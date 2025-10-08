import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupBrowser, teardownBrowser, page } from '../helpers/browser.js';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Python Black Formatter in Headless Browser', () => {
  let server;
  let serverUrl;

  beforeEach(async () => {
    await setupBrowser();

    // NOTE: We use Express instead of Vite dev server because:
    // 1. Starting Vite programmatically in tests causes esbuild issues
    // 2. The lib/black-formatter.js uses bare imports ('pyodide') which don't work in browsers
    // 3. For deployment, `npm run build:app` bundles everything properly with Vite
    // 4. For now, tests load Pyodide inline (same as first 2 tests) to avoid import issues
    const app = express();
    const projectRoot = join(__dirname, '../..');
    app.use(express.static(projectRoot));
    app.use('/node_modules', express.static(join(projectRoot, 'node_modules')));

    const port = 3002;
    server = app.listen(port);
    serverUrl = `http://localhost:${port}`;

    console.log(`🌐 Black test server running at ${serverUrl}`);
  });

  afterEach(async () => {
    await teardownBrowser();
    if (server) {
      server.close();
    }
  });

  it('should successfully format Python code with Black in headless browser', async () => {
    // Navigate to a simple page
    await page.goto(`${serverUrl}/demo-python-linting.html`);

    // Set a longer timeout for Pyodide initialization
    const result = await page.evaluate(async () => {
      // Poorly formatted Python code
      const pythonCode = `def   badly_formatted_function(x,y,z):
    if(x>0):
        print("positive")
    else:
        print("negative")
    return x+y+z

class   MyClass:
    def __init__( self, value ):
        self.value=value

    def   get_value(self):
        return self.value`;

      try {
        console.log('🔄 Loading Pyodide for Black formatting...');

        // Load Pyodide from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.28.2/full/pyodide.js';
        document.head.appendChild(script);

        // Wait for Pyodide to load
        await new Promise((resolve) => {
          script.onload = resolve;
        });

        console.log('🐍 Initializing Pyodide...');
        const pyodide = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.2/full/"
        });

        console.log('📦 Installing Black...');
        await pyodide.loadPackage("micropip");
        await pyodide.runPythonAsync(`
          import micropip
          await micropip.install("black")
          import black
          print("✅ Black installed successfully!")
        `);

        console.log('🖤 Formatting code with Black...');

        // Format the code using Black
        const formattingResult = pyodide.runPython(`
import black

code = """${pythonCode.replace(/"""/g, '\\"""')}"""

try:
    mode = black.Mode(line_length=88)
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
        `);

        const result = formattingResult.toJs({ dict_converter: Object.fromEntries });

        console.log('✅ Black formatting completed!', result);
        return result;

      } catch (error) {
        console.error('❌ Black formatting failed:', error);
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    }, { timeout: 60000 }); // 60 second timeout for Pyodide

    console.log('🖤 Headless browser Black results:', result);

    expect(result.success).toBe(true);
    expect(result.changed).toBe(true);
    expect(result.formatted).toContain('def badly_formatted_function(x, y, z):');
    expect(result.formatted).toContain('if x > 0:');
    expect(result.formatted).toContain('class MyClass:');
    expect(result.formatted).toContain('def __init__(self, value):');

    console.log('🎉 Black formatting works perfectly in headless browser!');
    console.log('📝 Original length:', result.original.length);
    console.log('✨ Formatted length:', result.formatted.length);
  }, 120000); // 2 minute test timeout

  it('should check Black compliance in headless browser', async () => {
    await page.goto(`${serverUrl}/demo-python-linting.html`);

    const result = await page.evaluate(async () => {
      // Already well-formatted Python code
      const pythonCode = `def well_formatted_function(x: int, y: int, z: int) -> int:
    if x > 0:
        print("positive")
    else:
        print("negative")
    return x + y + z


class MyClass:
    def __init__(self, value: int) -> None:
        self.value = value

    def get_value(self) -> int:
        return self.value
`;

      try {
        console.log('🔄 Loading Pyodide for Black compliance check...');

        // Load Pyodide from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.28.2/full/pyodide.js';
        document.head.appendChild(script);

        await new Promise((resolve) => {
          script.onload = resolve;
        });

        const pyodide = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.2/full/"
        });

        await pyodide.loadPackage("micropip");
        await pyodide.runPythonAsync(`
          import micropip
          await micropip.install("black")
          import black
        `);

        console.log('🔍 Checking Black compliance...');

        const complianceResult = pyodide.runPython(`
import black

code = """${pythonCode.replace(/"""/g, '\\"""')}"""

try:
    formatted = black.format_str(code, mode=black.Mode())
    is_compliant = formatted == code

    result = {
        'success': True,
        'isCompliant': is_compliant,
        'formatted': formatted,
        'original': code
    }
except Exception as e:
    result = {
        'success': False,
        'error': str(e),
        'isCompliant': False
    }

result
        `);

        const result = complianceResult.toJs({ dict_converter: Object.fromEntries });

        console.log('✅ Black compliance check completed!', result);
        return result;

      } catch (error) {
        console.error('❌ Black compliance check failed:', error);
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    }, { timeout: 60000 });

    console.log('🔍 Black compliance results:', result);

    expect(result.success).toBe(true);
    expect(result.isCompliant).toBe(true);

    console.log('✅ Black compliance checking works in headless browser!');
  }, 120000);

  it('should match local Black formatter output exactly', async () => {
    // Load the comprehensive test file and local reference
    const testFilesDir = join(__dirname, '../../../test_files');
    const originalCode = readFileSync(join(testFilesDir, 'broken_python.py'), 'utf-8');
    const localBlackOutput = readFileSync(join(testFilesDir, 'outputs/black_only.py'), 'utf-8');

    await page.goto(`${serverUrl}/demo-python-linting.html`);

    // Load the Black formatter lib - it handles loading Pyodide from CDN internally
    await page.addScriptTag({
      type: 'module',
      content: `
        import { formatWithBlack } from './lib/black-formatter.js';
        window.formatWithBlack = formatWithBlack;
        window.blackFormatterLoaded = true;
      `
    });

    // Wait for module to load
    await page.waitForFunction(() => window.blackFormatterLoaded === true, { timeout: 10000 });

    // Now use the lib to format
    const result = await page.evaluate(async (testCode) => {
      try {
        return await window.formatWithBlack(testCode);
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }, originalCode, { timeout: 60000 });

    console.log('🖤 Web vs Local Black Comparison:', {
      webSuccess: result.success,
      webLength: result.formatted?.length,
      localLength: localBlackOutput.length,
      changed: result.changed,
      error: result.error
    });

    if (!result.success) {
      console.error('❌ Black formatting failed:', result.error);
    }

    expect(result.success).toBe(true);
    expect(result.changed).toBe(true);
    expect(result.formatted).toBe(localBlackOutput);

    console.log('✅ Web Black matches local Black formatter exactly!');
  }, 120000);
});