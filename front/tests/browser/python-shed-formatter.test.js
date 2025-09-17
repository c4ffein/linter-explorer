import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupBrowser, teardownBrowser, page } from '../helpers/browser.js';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Python Shed Formatter in Headless Browser', () => {
  let server;
  let serverUrl;

  beforeEach(async () => {
    await setupBrowser();

    // Set up Express server to serve our files
    const app = express();

    // Serve static files from the actual project root (parent of front)
    const projectRoot = join(__dirname, '../../..');
    console.log(`📁 Serving static files from: ${projectRoot}`);
    console.log(`📁 Vendor directory should be at: ${join(projectRoot, 'vendor')}`);
    app.use(express.static(projectRoot));

    // Serve node_modules for accessing packages (they're in the front directory)
    app.use('/node_modules', express.static(join(projectRoot, 'front/node_modules')));

    // Start server
    const port = 3003;
    server = app.listen(port);
    serverUrl = `http://localhost:${port}`;

    console.log(`🌐 Shed test server running at ${serverUrl}`);
  });

  afterEach(async () => {
    await teardownBrowser();
    if (server) {
      server.close();
    }
  });

  it('should successfully format Python code with Shed in headless browser', async () => {
    // Navigate to a simple page
    await page.goto(`${serverUrl}/front/demo-python-linting.html`);

    // Load the pre-built Shed UMD bundle
    await page.addScriptTag({
      path: join(__dirname, '../../dist/shed-formatter.umd.cjs')
    });

    // Wait for the bundle to load
    await page.waitForFunction(() => window.ShedFormatter !== undefined, { timeout: 5000 });

    // Run the test using the bundled module
    const result = await page.evaluate(async () => {
      // Messy Python code that Shed should improve
      const pythonCode = `import unused_module
import os
import sys

def   badly_formatted_function(x,y,z):
    unused_var = 42
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
        console.log('🏠 Running bundled Shed formatting...');

        // Use the pre-built bundle - all the complexity is now hidden!
        const result = await window.ShedFormatter.formatWithShed(pythonCode);

        console.log('✅ Bundled Shed formatting completed!', result);
        return result;

      } catch (error) {
        console.error('❌ Bundled Shed formatting failed:', error);
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    }, { timeout: 120000 }); // 2 minute timeout for bundled Shed

    console.log('🏠 Headless browser Shed results:', result);

    expect(result.success).toBe(true);
    expect(result.changed).toBe(true);

    // Check that Shed actually improved formatting (Black formatting works)
    expect(result.formatted).toContain('def badly_formatted_function(x, y, z):'); // Should fix function spacing
    expect(result.formatted).toContain('class MyClass:'); // Should fix class spacing
    expect(result.formatted).toContain('if x > 0:'); // Should fix if statement spacing
    expect(result.formatted).toContain('return x + y + z'); // Should fix operator spacing

    // Check that the code is properly formatted (no extra spaces)
    expect(result.formatted).not.toContain('def   badly_formatted_function'); // Remove extra spaces
    expect(result.formatted).not.toContain('class   MyClass'); // Remove extra spaces
    expect(result.formatted).not.toContain('if(x>0)'); // Fix if statement formatting
    expect(result.formatted).not.toContain('return x+y+z'); // Fix operator spacing

    // Note: Shed may not remove unused imports in this test setup,
    // but it should still format the code with Black

    // Verify improvements tracking
    expect(result.improvements.black_formatted).toBe(true);
    expect(result.improvements.ruff_processed).toBe(true);
    expect(result.improvements.algorithm).toBe('Shed (Black + WASM Ruff + Black)');

    console.log('🎉 Bundled Shed formatting works perfectly in headless browser!');
    console.log('📝 Original length:', result.original.length);
    console.log('🏠 Shed improved length:', result.formatted.length);
    console.log('🔧 Using Vite-bundled Shed source with WASM Ruff bridge!');
  }, 180000); // 3 minute test timeout for Shed

  it('should analyze Shed improvements in headless browser', async () => {
    await page.goto(`${serverUrl}/front/demo-python-linting.html`);

    // Load the pre-built Shed UMD bundle
    await page.addScriptTag({
      path: join(__dirname, '../../dist/shed-formatter.umd.cjs')
    });

    // Wait for the bundle to load
    await page.waitForFunction(() => window.ShedFormatter !== undefined, { timeout: 5000 });

    const result = await page.evaluate(async () => {
      // Code with various issues that Shed can detect and fix
      const pythonCode = `import os
import sys
import unused_import

def test_function():
    unused_variable = 42
    print("hello world")
    return True`;

      try {
        console.log('🔍 Analyzing improvements with Shed...');

        // Use the bundled analysis function
        const result = await window.ShedFormatter.analyzeShedImprovements(pythonCode);
        return result;

      } catch (error) {
        console.error('❌ Shed analysis failed:', error);
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    }, { timeout: 120000 });

    console.log('🔍 Shed analysis results:', result);

    expect(result.success).toBe(true);
    expect(result.hasImprovements).toBe(true);

    console.log('✅ Shed analysis works in headless browser!');
  }, 180000);

  it('should match local Shed formatter output exactly', async () => {
    // Load the comprehensive test file and local reference
    const testFilesDir = join(__dirname, '../../../test_files');
    const originalCode = readFileSync(join(testFilesDir, 'broken_python.py'), 'utf-8');
    const localShedOutput = readFileSync(join(testFilesDir, 'outputs/shed_formatted.py'), 'utf-8');

    await page.goto(`${serverUrl}/front/demo-python-linting.html`);

    // Load the pre-built Shed UMD bundle
    await page.addScriptTag({
      path: join(__dirname, '../../dist/shed-formatter.umd.cjs')
    });

    // Wait for the bundle to load
    await page.waitForFunction(() => window.ShedFormatter !== undefined, { timeout: 10000 });

    const result = await page.evaluate(async (testCode) => {
      try {
        const formatResult = await window.ShedFormatter.formatWithShed(testCode);
        return {
          success: formatResult.success,
          formatted: formatResult.formatted,
          changed: formatResult.changed,
          error: formatResult.error
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }, originalCode);

    console.log('🏠 Web vs Local Shed Comparison:', {
      webSuccess: result.success,
      webLength: result.formatted?.length,
      localLength: localShedOutput.length,
      changed: result.changed
    });

    expect(result.success).toBe(true);
    expect(result.changed).toBe(true);
    expect(result.formatted).toBe(localShedOutput);

    console.log('✅ Web Shed matches local Shed formatter exactly!');
  }, 180000);

  it('should demonstrate Shed vs individual tools progression', async () => {
    // Load test files - Shed should do everything the other tools do, but better
    const testFilesDir = join(__dirname, '../../../test_files');
    const originalCode = readFileSync(join(testFilesDir, 'broken_python.py'), 'utf-8');
    const shedOutput = readFileSync(join(testFilesDir, 'outputs/shed_formatted.py'), 'utf-8');

    // For reference: what individual tools produce
    const ruffLength = readFileSync(join(testFilesDir, 'outputs/ruff_formatted.py'), 'utf-8').length;
    const blackLength = readFileSync(join(testFilesDir, 'outputs/black_formatted.py'), 'utf-8').length;

    await page.goto(`${serverUrl}/front/demo-python-linting.html`);

    // Load Shed bundle
    await page.addScriptTag({
      path: join(__dirname, '../../dist/shed-formatter.umd.cjs')
    });
    await page.waitForFunction(() => window.ShedFormatter !== undefined, { timeout: 10000 });

    const result = await page.evaluate(async (testCode) => {
      try {
        // Only run Shed - it handles Ruff and Black internally!
        const shedResult = await window.ShedFormatter.formatWithShed(testCode);

        return {
          original: {
            length: testCode.length,
            lines: testCode.split('\\n').length
          },
          shed: {
            success: shedResult.success,
            length: shedResult.formatted?.length || 0,
            lines: shedResult.formatted?.split('\\n').length || 0,
            formatted: shedResult.formatted
          }
        };
      } catch (error) {
        return { error: error.message };
      }
    }, originalCode);

    console.log('📊 Shed vs Individual Tools Analysis:');
    console.log(`📁 Original:     ${result.original.length} chars, ${result.original.lines} lines`);
    console.log(`🏠 Web Shed:     ${result.shed.length} chars, ${result.shed.lines} lines`);
    console.log(`📏 Local Shed:   ${shedOutput.length} chars (reference)`);
    console.log(`🔧 Local Ruff:   ${ruffLength} chars (for comparison)`);
    console.log(`🖤 Local Black:  ${blackLength} chars (for comparison)`);

    // Shed should succeed
    expect(result.shed.success).toBe(true);

    // Web Shed should match local Shed exactly
    expect(result.shed.length).toBe(shedOutput.length);
    expect(result.shed.formatted).toBe(shedOutput);

    // Shed should be more aggressive than individual Ruff/Black (removes unused imports)
    expect(result.shed.length).toBeLessThan(ruffLength);
    expect(result.shed.length).toBeLessThan(blackLength);

    console.log('✅ Shed combines Ruff + Black + more, producing optimal output!');
    console.log('🎯 Web Shed matches local Shed exactly and outperforms individual tools!');
  }, 180000);
});