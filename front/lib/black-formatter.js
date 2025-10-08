let pyodide = null;
let isBlackInitialized = false;

// Load Pyodide from CDN dynamically
async function loadPyodideFromCDN() {
  // Check if loadPyodide is already available globally
  if (typeof window !== 'undefined' && window.loadPyodide) {
    return window.loadPyodide;
  }

  // Load Pyodide script from CDN
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.28.2/full/pyodide.js';
    script.onload = () => {
      if (window.loadPyodide) {
        resolve(window.loadPyodide);
      } else {
        reject(new Error('loadPyodide not found after loading script'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Pyodide from CDN'));
    document.head.appendChild(script);
  });
}

export async function initializeBlack() {
  if (!isBlackInitialized) {
    console.log('🔄 Loading Pyodide WASM environment from CDN...');

    const loadPyodide = await loadPyodideFromCDN();

    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.2/full/"
    });

    console.log('📦 Installing Black formatter...');
    await pyodide.loadPackage("micropip");
    await pyodide.runPythonAsync(`
      import micropip
      await micropip.install("black")
      import black
      print("✅ Black formatter loaded successfully!")
    `);

    isBlackInitialized = true;
    console.log('🐍 Black Python formatter initialized!');
  }
  return pyodide;
}

export async function formatWithBlack(pythonCode, options = {}) {
  try {
    const py = await initializeBlack();

    // Set up Black formatting options
    const lineLength = options.lineLength || 88;
    const stringNormalization = options.skipStringNormalization ? false : true; // Inverted logic

    // Create Python code to format the input
    const formattingScript = `
import black
import sys

# Input code
code = """${pythonCode.replace(/"""/g, '\\"""')}"""

try:
    # Configure Black mode
    mode = black.Mode(
        line_length=${lineLength},
        string_normalization=${stringNormalization ? 'True' : 'False'}
    )

    # Format the code
    formatted = black.format_str(code, mode=mode)

    result = {
        'success': True,
        'formatted': formatted,
        'changed': formatted != code,
        'original': code
    }
except Exception as e:
    result = {
        'success': False,
        'error': str(e),
        'formatted': code,
        'changed': False
    }

result
`;

    const result = py.runPython(formattingScript).toJs({ dict_converter: Object.fromEntries });

    console.log(`🖤 Black formatting ${result.success ? 'successful' : 'failed'}`);
    return result;

  } catch (error) {
    console.error('❌ Black formatting failed:', error);
    return {
      success: false,
      error: error.message,
      formatted: pythonCode,
      changed: false
    };
  }
}

export async function checkBlackCompatibility(pythonCode) {
  try {
    const py = await initializeBlack();

    const checkScript = `
import black

code = """${pythonCode.replace(/"""/g, '\\"""')}"""

try:
    # Format with Black
    formatted = black.format_str(code, mode=black.Mode())

    # Check if it's already Black-compliant
    is_compliant = formatted == code

    result = {
        'success': True,
        'isCompliant': is_compliant,
        'formatted': formatted,
        'original': code,
        'changes': not is_compliant
    }
except Exception as e:
    result = {
        'success': False,
        'error': str(e),
        'isCompliant': False
    }

result
`;

    const result = py.runPython(checkScript).toJs({ dict_converter: Object.fromEntries });

    console.log(`🔍 Black compliance check: ${result.isCompliant ? 'compliant' : 'needs formatting'}`);
    return result;

  } catch (error) {
    console.error('❌ Black compliance check failed:', error);
    return {
      success: false,
      error: error.message,
      isCompliant: false
    };
  }
}