import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupBrowser, teardownBrowser, executeFunction, loadPage } from '../helpers/browser.js';

// Keeping this test to check the most basic thing still works

describe('Function Execution in Headless Browser', () => {
  beforeEach(async () => {
    await setupBrowser();
  });

  afterEach(async () => {
    await teardownBrowser();
  });

  it('should execute a simple function', async () => {
    await loadPage();

    const result = await executeFunction(`
      function add(a, b) {
        return a + b;
      }
    `, 5, 3);

    expect(result).toBe(8);
  });

  it('should execute async function', async () => {
    await loadPage();

    const result = await executeFunction(`
      async function delayedSum(a, b) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return a + b;
      }
    `, 10, 20);

    expect(result).toBe(30);
  });

  it('should execute DOM manipulation function', async () => {
    await loadPage();

    const result = await executeFunction(`
      function createAndCountDivs(count) {
        for(let i = 0; i < count; i++) {
          const div = document.createElement('div');
          div.textContent = 'Test ' + i;
          document.body.appendChild(div);
        }
        return document.querySelectorAll('div').length;
      }
    `, 5);

    expect(result).toBe(5);
  });
});
