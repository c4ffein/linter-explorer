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
    // Load Ruff WASM from CDN with Shed-compatible configuration
    const ruffScript = document.createElement('script');
    ruffScript.type = 'module';
    ruffScript.textContent = `
      import init, { Workspace, PositionEncoding } from 'https://cdn.jsdelivr.net/npm/@astral-sh/ruff-wasm-web@0.14.0/ruff_wasm.js';
      await init();

      // Shed's exact rule list from vendor/shed/src/shed/__init__.py _RUFF_RULES
      // These are the ONLY rules Shed checks (E731 is explicitly NOT included)
      window.SHED_RUFF_RULES = [
        'I',      // isort
        'UP',     // pyupgrade
        'F841',   // unused-variable
        'F901',   // raise NotImplemented -> raise NotImplementedError
        'E711',   // == None -> is None
        'E713',   // not x in y -> x not in y
        'E714',   // not x is y -> x is not y
        'C400', 'C401', 'C402', 'C403', 'C404', 'C405', 'C406',
        'C408', 'C409', 'C410', 'C411', 'C413', 'C416', 'C417', 'C418', 'C419',
        'SIM101', // duplicate-isinstance-call
        'B011',   // assert False -> raise
        'F401'    // unused-import (added by Shed when _remove_unused_imports=True)
      ];

      // Configure Ruff workspace with Shed's settings
      const config = {
        lint: {
          isort: {
            'combine-as-imports': true,
            'known-first-party': []
          },
          'extend-safe-fixes': [
            'F841', 'C400', 'C401', 'C402', 'C403', 'C404', 'C405', 'C406',
            'C408', 'C409', 'C410', 'C411', 'C416', 'C417', 'C418', 'C419',
            'SIM101', 'E711', 'UP031', 'C413', 'B011'
          ]
        }
      };

      console.log('🔧 Creating Ruff workspace with Shed config:', JSON.stringify(config, null, 2));
      // Ruff 0.14.0 requires position_encoding parameter (use UTF-8)
      window.ruffWorkspace = new Workspace(config, PositionEncoding.Utf8);
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

      // Convert Python list to JavaScript array
      const argsArray = Array.isArray(args) ? args : (args?.toJs?.() || []);
      const argsStr = argsArray.join(' ');
      console.log('⚙️ Ruff args:', argsStr);

      try {
        // Parse the Ruff command args to determine what operation to do
        const isCheck = argsArray.includes('check');
        const isFixOnly = argsArray.includes('--fix-only');

        let result;
        if (isCheck && isFixOnly) {
          // This is `ruff check --fix-only` - apply linter fixes iteratively
          // Ruff's strategy: apply non-overlapping fixes, then re-run until convergence
          // See: https://github.com/astral-sh/ruff/issues/660
          console.log('🔧 Applying Ruff fixes (check --fix-only)...');

          let currentCode = code;
          let totalFixesApplied = 0;
          let passes = 0;
          const MAX_PASSES = 100;

          while (passes < MAX_PASSES) {
            passes++;
            const checkResult = ruffWorkspace.check(currentCode);

            // Collect all safe fix edits from this pass, filtering to Shed's rule list
            const allEdits = [];
            for (const diagnostic of checkResult) {
              // Filter: only apply fixes for rules in Shed's list (excludes E731, etc.)
              const ruleCode = diagnostic.code;
              const isAllowedRule = window.SHED_RUFF_RULES.some(rule => {
                // Match exact rule (e.g., 'F841') or rule prefix (e.g., 'I' matches 'I001')
                return ruleCode === rule || ruleCode?.startsWith(rule);
              });

              if (!isAllowedRule) {
                continue; // Skip diagnostics not in Shed's rule list
              }

              if (diagnostic.fix && diagnostic.fix.edits) {
                const applicability = diagnostic.fix.applicability;
                if (!applicability || applicability === 'safe') {
                  for (const edit of diagnostic.fix.edits) {
                    allEdits.push({
                      startRow: edit.location.row,
                      startCol: edit.location.column,
                      endRow: edit.end_location.row,
                      endCol: edit.end_location.column,
                      content: edit.content || ''
                    });
                  }
                }
              }
            }

            if (allEdits.length === 0) {
              break; // Converged - no more fixes to apply
            }

            // Sort edits from end to beginning to preserve positions
            allEdits.sort((a, b) => {
              if (b.startRow !== a.startRow) return b.startRow - a.startRow;
              if (b.startCol !== a.startCol) return b.startCol - a.startCol;
              if (b.endRow !== a.endRow) return b.endRow - a.endRow;
              return b.endCol - a.endCol;
            });

            // Filter to only non-overlapping edits for this pass
            const nonOverlappingEdits = [];
            let lastKeptStartRow = Infinity;
            let lastKeptStartCol = Infinity;

            for (const edit of allEdits) {
              const noOverlap = edit.endRow < lastKeptStartRow ||
                               (edit.endRow === lastKeptStartRow && edit.endCol <= lastKeptStartCol);

              if (noOverlap) {
                nonOverlappingEdits.push(edit);
                lastKeptStartRow = edit.startRow;
                lastKeptStartCol = edit.startCol;
              }
            }

            if (nonOverlappingEdits.length === 0) {
              break; // No non-overlapping fixes available
            }

            // Apply the non-overlapping fixes
            const lines = currentCode.split('\n');

            for (const edit of nonOverlappingEdits) {
              const startRow = edit.startRow - 1;
              const startCol = edit.startCol - 1;
              const endRow = edit.endRow - 1;
              const endCol = edit.endCol - 1;

              if (startRow === endRow) {
                const line = lines[startRow];
                lines[startRow] = line.substring(0, startCol) + edit.content + line.substring(endCol);
              } else {
                const firstLinePart = lines[startRow].substring(0, startCol);
                const lastLinePart = lines[endRow].substring(endCol);
                const replacement = firstLinePart + edit.content + lastLinePart;
                const replacementLines = replacement.split('\n');
                lines.splice(startRow, endRow - startRow + 1, ...replacementLines);
              }
            }

            currentCode = lines.join('\n');
            totalFixesApplied += nonOverlappingEdits.length;
          }

          result = currentCode;
          console.log(`✅ Applied ${totalFixesApplied} fix(es) in ${passes} pass(es): ${code.length} → ${result.length} chars`);
        } else if (argsArray.includes('format')) {
          // This is `ruff format` - just formatting
          console.log('🎨 Applying Ruff format...');
          result = ruffWorkspace.format(code, { extension: 'py' });
        } else {
          // Default to format
          console.log('🎨 Default to Ruff format...');
          result = ruffWorkspace.format(code, { extension: 'py' });
        }

        console.log('✅ WASM Ruff completed, result length:', result?.length || code.length);
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

    // Install the mock FIRST
    console.log('🔧 Installing subprocess mock...');
    py.runPython(mockSubprocessScript);
    console.log('✅ Subprocess mock installed');

    // Now import and patch subprocess BEFORE loading Shed
    console.log('🔧 Importing subprocess to verify mock...');
    const verifyResult = py.runPython(`
import sys
import subprocess

# Verify mock is active
print(f"✅ subprocess.run name: {subprocess.run.__name__}")
subprocess.run.__name__
    `);
    console.log('✅ Subprocess mock verified, name =', verifyResult);

    // Now run the REAL Shed source with our mocked subprocess
    // IMPORTANT: Remove subprocess import from Shed since we already imported and mocked it
    const shedWithoutSubprocessImport = shedAlgorithm.replace(/^import subprocess$/m, '# import subprocess  # Already imported and mocked above');

    const realShedScript = `
# Input code
source_code = """${pythonCode.replace(/"""/g, '\\"\\"\\"')}"""

# Shed source code (subprocess import removed - already mocked above)
${shedWithoutSubprocessImport}

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