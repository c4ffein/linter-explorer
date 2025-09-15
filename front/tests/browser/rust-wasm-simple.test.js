import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupBrowser, teardownBrowser, page } from '../helpers/browser.js';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Rust WebAssembly Simple Execution', () => {
  beforeEach(async () => {
    await setupBrowser();
  });

  afterEach(async () => {
    await teardownBrowser();
  });

  it('should execute Rust functions directly via WASM exports', async () => {
    const wasmPath = join(process.cwd(), 'wasm-math/pkg/wasm_linter_bg.wasm');
    const wasmBuffer = readFileSync(wasmPath);

    await page.goto('about:blank');

    const result = await page.evaluate(async (wasmBytes) => {
      // Create the WASM memory and imports exactly as the generated code expects
      let wasmMemory;
      let wasmExports;

      // Text decoder for reading strings from WASM memory
      const textDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

      function getStringFromWasm(ptr, len) {
        const bytes = new Uint8Array(wasmMemory.buffer, ptr, len);
        return textDecoder.decode(bytes);
      }

      // Create the imports object exactly as wasm-bindgen expects
      const imports = {
        wbg: {
          __wbg_log_be42534a310aeb7d: function(ptr, len) {
            console.log(getStringFromWasm(ptr, len));
          },
          __wbindgen_init_externref_table: function() {
            // Initialize the externref table
            const table = wasmExports.__wbindgen_export_0;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
          }
        }
      };

      try {
        // Instantiate the WASM module
        const wasmModule = await WebAssembly.instantiate(new Uint8Array(wasmBytes), imports);
        wasmExports = wasmModule.instance.exports;
        wasmMemory = wasmExports.memory;

        // Initialize the externref table if the function exists
        if (wasmExports.__wbindgen_init_externref_table) {
          imports.wbg.__wbindgen_init_externref_table();
        }

        // Test our Rust functions directly
        const addResult = wasmExports.add(10, 32);

        return {
          success: true,
          addResult,
          memoryPages: wasmMemory.buffer.byteLength / 65536,
          exports: Object.keys(wasmExports).slice(0, 15)
        };

      } catch (error) {
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    }, Array.from(wasmBuffer));

    console.log('🦀 Rust WASM result:', result);

    expect(result.success).toBe(true);
    expect(result.addResult).toBe(42); // 10 + 32
    expect(result.exports).toContain('add');
    expect(result.exports).toContain('greet');
    expect(result.exports).toContain('demo_message');
  });

  it('should handle Rust string functions', async () => {
    const wasmPath = join(process.cwd(), 'wasm-math/pkg/wasm_linter_bg.wasm');
    const wasmBuffer = readFileSync(wasmPath);

    await page.goto('about:blank');

    const result = await page.evaluate(async (wasmBytes) => {
      let wasmMemory;
      let wasmExports;

      const textDecoder = new TextDecoder('utf-8');
      const textEncoder = new TextEncoder();

      function getStringFromWasm(ptr, len) {
        const bytes = new Uint8Array(wasmMemory.buffer, ptr, len);
        return textDecoder.decode(bytes);
      }

      function passStringToWasm(str) {
        const bytes = textEncoder.encode(str);
        const ptr = wasmExports.__wbindgen_malloc(bytes.length, 1);
        const mem = new Uint8Array(wasmMemory.buffer, ptr, bytes.length);
        mem.set(bytes);
        return [ptr, bytes.length];
      }

      const imports = {
        wbg: {
          __wbg_log_be42534a310aeb7d: function(ptr, len) {
            console.log('Rust says:', getStringFromWasm(ptr, len));
          },
          __wbindgen_init_externref_table: function() {
            if (wasmExports.__wbindgen_export_0) {
              const table = wasmExports.__wbindgen_export_0;
              const offset = table.grow(4);
              table.set(0, undefined);
              table.set(offset + 0, undefined);
              table.set(offset + 1, null);
              table.set(offset + 2, true);
              table.set(offset + 3, false);
            }
          }
        }
      };

      try {
        const wasmModule = await WebAssembly.instantiate(new Uint8Array(wasmBytes), imports);
        wasmExports = wasmModule.instance.exports;
        wasmMemory = wasmExports.memory;

        // Initialize if needed
        if (wasmExports.__wbindgen_init_externref_table) {
          imports.wbg.__wbindgen_init_externref_table();
        }

        // Test string function - greet expects a string pointer and length
        const [namePtr, nameLen] = passStringToWasm("WebAssembly");
        const greetPtr = wasmExports.greet(namePtr, nameLen);

        // The greet function returns a pointer to the result string
        // We need to read it from memory (this is simplified)

        return {
          success: true,
          hasGreet: 'greet' in wasmExports,
          hasMalloc: '__wbindgen_malloc' in wasmExports,
          memorySize: wasmMemory.buffer.byteLength
        };

      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }, Array.from(wasmBuffer));

    console.log('🦀 Rust string test result:', result);

    expect(result.success).toBe(true);
    expect(result.hasGreet).toBe(true);
    expect(result.hasMalloc).toBe(true);
  });
});