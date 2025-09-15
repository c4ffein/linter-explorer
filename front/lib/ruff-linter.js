import init, { Workspace } from '@astral-sh/ruff-wasm-web';

let isRuffInitialized = false;
let workspace = null;

export async function initializeRuff() {
  if (!isRuffInitialized) {
    await init();

    // Initialize workspace with common Python linting rules
    workspace = new Workspace({
      'line-length': 88,
      lint: {
        select: [
          'E4',   // Import errors
          'E7',   // Statement errors
          'E9',   // Runtime errors
          'F',    // Pyflakes errors
          'W',    // Warning codes
        ]
      }
    });

    isRuffInitialized = true;
    console.log('🐍 Ruff WASM linter initialized!');
  }
  return workspace;
}

export async function lintPythonCode(pythonCode) {
  try {
    const ruffWorkspace = await initializeRuff();

    // Create a document object for Ruff
    const document = {
      uri: 'file:///temp.py',
      text: pythonCode
    };

    // Run linting
    const diagnostics = ruffWorkspace.check(document);

    // Format the results
    const results = {
      success: true,
      diagnostics: diagnostics.map(diagnostic => ({
        code: diagnostic.code || 'UNKNOWN',
        message: diagnostic.message,
        line: diagnostic.range.start.line + 1, // Convert to 1-based
        column: diagnostic.range.start.character + 1,
        endLine: diagnostic.range.end.line + 1,
        endColumn: diagnostic.range.end.character + 1,
        severity: diagnostic.severity || 'error'
      })),
      totalIssues: diagnostics.length
    };

    console.log(`🔍 Linted Python code: found ${diagnostics.length} issues`);
    return results;

  } catch (error) {
    console.error('❌ Ruff linting failed:', error);
    return {
      success: false,
      error: error.message,
      diagnostics: []
    };
  }
}

export async function formatPythonCode(pythonCode) {
  try {
    const ruffWorkspace = await initializeRuff();

    const document = {
      uri: 'file:///temp.py',
      text: pythonCode
    };

    const formatted = ruffWorkspace.format(document);

    return {
      success: true,
      formatted: formatted,
      changed: formatted !== pythonCode
    };

  } catch (error) {
    console.error('❌ Ruff formatting failed:', error);
    return {
      success: false,
      error: error.message,
      formatted: pythonCode
    };
  }
}