import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupBrowser, teardownBrowser, page } from '../helpers/browser.js';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Python Ruff Linter in Headless Browser', () => {
  let server;
  let serverUrl;

  beforeEach(async () => {
    await setupBrowser();

    // Set up Express server to serve our files
    const app = express();

    // Serve static files from the project root
    const projectRoot = join(__dirname, '../..');
    app.use(express.static(projectRoot));

    // Serve node_modules for accessing the Ruff WASM package
    app.use('/node_modules', express.static(join(projectRoot, 'node_modules')));

    // Start server
    const port = 3001;
    server = app.listen(port);
    serverUrl = `http://localhost:${port}`;

    console.log(`🌐 Test server running at ${serverUrl}`);
  });

  afterEach(async () => {
    await teardownBrowser();
    if (server) {
      server.close();
    }
  });

  it('should successfully lint Python code in headless browser', async () => {
    // Navigate to a simple page
    await page.goto(`${serverUrl}/demo-python-linting.html`);

    // Inject Ruff WASM loading script
    await page.addScriptTag({
      type: 'module',
      content: `
        import init, { Workspace } from '/node_modules/@astral-sh/ruff-wasm-web/ruff_wasm.js';
        window.ruffInit = init;
        window.RuffWorkspace = Workspace;
        window.ruffLoaded = true;
        console.log('✅ Ruff WASM modules loaded');
      `
    });

    // Wait for Ruff to load
    await page.waitForFunction(() => window.ruffLoaded === true, { timeout: 10000 });

    const result = await page.evaluate(async () => {
      // Test Python code with intentional issues
      const pythonCode = `import unused_module
import os

def bad_function():
    x=1+2
    unused_var = 42
    if x>0:
        print("test")
`;

      try {
        console.log('🔄 Initializing Ruff WASM in headless browser...');
        await window.ruffInit();

        console.log('🏗️ Creating workspace...');
        const workspace = new window.RuffWorkspace({
          'line-length': 88,
          lint: {
            select: ['E4', 'E7', 'E9', 'F', 'W']
          }
        });

        console.log('🐍 Starting linting...');
        const diagnostics = workspace.check(pythonCode);

        console.log('🔍 Raw diagnostics:', diagnostics);

        const results = {
          success: true,
          diagnostics: diagnostics.map(diagnostic => ({
            code: diagnostic.code || 'UNKNOWN',
            message: diagnostic.message || diagnostic.body || 'Unknown error',
            line: diagnostic.range ? (diagnostic.range.start.line + 1) : (diagnostic.location ? diagnostic.location.row : 1),
            column: diagnostic.range ? (diagnostic.range.start.character + 1) : (diagnostic.location ? diagnostic.location.column : 1),
            severity: diagnostic.severity || 'error'
          })),
          totalIssues: diagnostics.length
        };

        console.log('✅ Linting completed in headless browser!', results);
        return results;

      } catch (error) {
        console.error('❌ Linting failed:', error);
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    });

    console.log('🎉 Headless browser lint results:', result);

    expect(result.success).toBe(true);
    expect(Array.isArray(result.diagnostics)).toBe(true);
    expect(result.diagnostics.length).toBeGreaterThan(0);

    // Should find unused import
    const unusedImports = result.diagnostics.filter(d => d.code?.startsWith('F401'));
    expect(unusedImports.length).toBeGreaterThan(0);

    console.log(`🎯 Successfully found ${result.diagnostics.length} linting issues in headless browser!`);
    result.diagnostics.forEach(d => {
      console.log(`  📋 ${d.code}: ${d.message} (line ${d.line})`);
    });
  });

  it('should successfully format Python code in headless browser', async () => {
    await page.goto(`${serverUrl}/demo-python-linting.html`);

    // Inject Ruff WASM loading script
    await page.addScriptTag({
      type: 'module',
      content: `
        import init, { Workspace } from '/node_modules/@astral-sh/ruff-wasm-web/ruff_wasm.js';
        window.ruffInit = init;
        window.RuffWorkspace = Workspace;
        window.ruffLoaded = true;
      `
    });

    // Wait for Ruff to load
    await page.waitForFunction(() => window.ruffLoaded === true, { timeout: 10000 });

    const result = await page.evaluate(async () => {
      // Poorly formatted Python code
      const pythonCode = `def bad_format(   x,y,   z ):
    if x>0:print("positive")
    else:print("negative")
    return x+y+z`;

      try {
        console.log('✨ Loading Ruff WASM for formatting...');
        await window.ruffInit();

        console.log('🏗️ Creating workspace...');
        const workspace = new window.RuffWorkspace({ 'line-length': 88 });

        console.log('✨ Starting formatting...');
        const formatted = workspace.format(pythonCode);

        const results = {
          success: true,
          formatted: formatted,
          changed: formatted !== pythonCode,
          original: pythonCode
        };

        console.log('✅ Formatting completed in headless browser!');
        return results;

      } catch (error) {
        console.error('❌ Formatting failed:', error);
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    });

    console.log('✨ Headless browser format results:', result);

    expect(result.success).toBe(true);
    expect(result.changed).toBe(true);
    expect(result.formatted).toContain('def bad_format(x, y, z):');
    expect(result.formatted).toContain('if x > 0:');

    console.log('🎉 Python code formatting works perfectly in headless browser!');
    console.log('📝 Original:', result.original.replace(/\n/g, '\\n'));
    console.log('✨ Formatted:', result.formatted.replace(/\n/g, '\\n'));  // TODO Actually check formatted code
  });
});
