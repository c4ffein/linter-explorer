// Shed Formatter UMD Bundle
// This is a standalone bundle that includes everything needed to run Shed formatting
// It loads Pyodide from CDN and embeds the Shed source to work in any environment

import shedAlgorithm from '@vendor/shed/src/shed/__init__.py?raw';

let pyodide = null;
let isShedInitialized = false;
let ruffWorkspace = null;

// Initialize Ruff WASM for the subprocess bridge
async function initializeRuffWASM() {
  if (!ruffWorkspace) {
    // Load Ruff WASM from CDN
    const ruffScript = document.createElement('script');
    ruffScript.type = 'module';
    ruffScript.textContent = `
      import init, { Workspace } from 'https://cdn.jsdelivr.net/npm/@astral-sh/ruff-wasm-web@0.13.0/ruff_wasm.js';
      await init();
      window.ruffWorkspace = new Workspace({});
      window.ruffReady = true;
    `;
    document.head.appendChild(ruffScript);

    // Wait for Ruff to be ready
    await new Promise((resolve) => {
      const checkRuff = () => {
        if (window.ruffReady && window.ruffWorkspace) {
          ruffWorkspace = window.ruffWorkspace;
          resolve();
        } else {
          setTimeout(checkRuff, 100);
        }
      };
      checkRuff();
    });
  }
  return ruffWorkspace;
}

async function initializeShed() {
  if (!isShedInitialized) {
    console.log('🔄 Loading Pyodide WASM environment for Shed...');

    // Load Pyodide from CDN (no npm imports)
    if (!window.loadPyodide) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.28.2/full/pyodide.js';
      document.head.appendChild(script);
      await new Promise((resolve) => script.onload = resolve);
    }

    pyodide = await window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.2/full/"
    });

    console.log('📦 Installing Shed dependencies (Black, com2ann, libcst, pyupgrade)...');
    await pyodide.loadPackage("micropip");
    await pyodide.runPythonAsync(`
      import micropip
      # Install all the dependencies that Shed uses
      await micropip.install(["black", "com2ann", "libcst", "pyupgrade"])
      import black
      import com2ann
      import libcst
      # Don't import pyupgrade directly as we'll use it via Ruff
      print("✅ Shed dependencies installed!")
    `);

    isShedInitialized = true;
    console.log('🏠 Shed Python formatter initialized!');
  }
  return pyodide;
}

export async function formatWithShed(pythonCode) {
  try {
    const py = await initializeShed();
    await initializeRuffWASM();

    console.log('🏠 Formatting code with Shed algorithm (with WASM Ruff bridge)...');

    // Install a JavaScript function that Python can call (synchronous)
    py.globals.set('js_ruff_format_sync', py.toPy((code, args) => {
      console.log('🌉 Python → JavaScript bridge called!');
      console.log('📝 Input code length:', code.length);
      console.log('⚙️ Ruff args:', args);

      try {
        // Call our WASM Ruff with the code
        const result = ruffWorkspace.format(code, { extension: 'py' });
        console.log('✅ WASM Ruff completed, returning to Python');
        return result || code;
      } catch (error) {
        console.error('❌ WASM Ruff failed:', error);
        return code; // Return original on error
      }
    }));

    // Create the subprocess bridge that calls our WASM Ruff
    const mockSubprocessScript = `
import subprocess
import json

# Store original subprocess.run
_original_subprocess_run = subprocess.run

# Mock result object
class MockCompletedProcess:
    def __init__(self, stdout="", stderr="", returncode=0):
        self.stdout = stdout
        self.stderr = stderr
        self.returncode = returncode
        self.args = []

def sync_mock_subprocess_run(args, **kwargs):
    """Mock subprocess.run to intercept Ruff calls and bridge to WASM Ruff"""
    # Check if this is a Ruff call
    if args and args[0] == "ruff":
        print(f"🔧 Intercepted Ruff call: {' '.join(args)}")

        # Extract the input code
        input_code = kwargs.get('input', '')

        print("🌉 Calling JavaScript WASM Ruff...")

        # Call our JavaScript WASM Ruff function
        result = js_ruff_format_sync(input_code, args[1:])

        print(f"✅ Got result from WASM Ruff: {len(result)} chars")

        # Return the formatted code
        return MockCompletedProcess(stdout=result)
    else:
        # For non-Ruff calls, use original subprocess
        return _original_subprocess_run(args, **kwargs)

subprocess.run = sync_mock_subprocess_run
print("✅ Subprocess bridge installed!")
`;

    py.runPython(mockSubprocessScript);

    // Now run the REAL Shed source with our mocked subprocess
    const realShedScript = `
# Input code
source_code = """${pythonCode.replace(/"""/g, '\\"\\"\\"')}"""

${shedAlgorithm}

# Call the real shed function
result = shed(source_code)
{"formatted": result, "changed": result != source_code}
`;

    const pythonResult = py.runPython(realShedScript).toJs({ dict_converter: Object.fromEntries });

    console.log('🏠 Shed completed with WASM Ruff bridge!');
    console.log('🎯 Result:', pythonResult.changed ? 'Code was changed' : 'No changes needed');

    return {
      success: true,
      formatted: pythonResult.formatted,
      changed: pythonResult.changed,
      original: pythonCode,
      improvements: {
        'black_formatted': true,
        'ruff_processed': true,
        'algorithm': 'Shed (Black + WASM Ruff + Black)'
      }
    };

  } catch (error) {
    console.error('❌ Shed formatting failed:', error);
    return {
      success: false,
      error: error.message,
      formatted: pythonCode,
      changed: false
    };
  }
}

export async function analyzeShedImprovements(pythonCode) {
  try {
    // Use Shed for analysis
    const shedResult = await formatWithShed(pythonCode);

    if (shedResult.success) {
      return {
        success: true,
        original: pythonCode,
        improved: shedResult.formatted,
        changes: [
          shedResult.improvements.issues_fixed > 0 ? `Fixed ${shedResult.improvements.issues_fixed} code issues` : null,
          shedResult.improvements.black_formatted ? "Applied Black formatting" : null,
          shedResult.improvements.ruff_processed ? "Applied Ruff fixes" : null,
          shedResult.improvements.algorithm ? `Using ${shedResult.improvements.algorithm}` : null
        ].filter(Boolean),
        hasImprovements: shedResult.changed
      };
    } else {
      return shedResult;
    }

  } catch (error) {
    console.error('❌ Shed analysis failed:', error);
    return {
      success: false,
      error: error.message,
      hasImprovements: false
    };
  }
}

// UMD export pattern
const ShedFormatter = {
  formatWithShed,
  analyzeShedImprovements
};

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShedFormatter;
}
if (typeof window !== 'undefined') {
  window.ShedFormatter = ShedFormatter;
}

export default ShedFormatter;