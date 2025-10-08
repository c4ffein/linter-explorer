import puppeteer from 'puppeteer';

let browser;
let page;

export async function setupBrowser() {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  page = await browser.newPage();

  // Capture browser console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'log') console.log('🌐', text);
    else if (type === 'error') console.error('🌐', text);
    else if (type === 'warn') console.warn('🌐', text);
  });

  return { browser, page };
}

export async function teardownBrowser() {
  if (page) await page.close();
  if (browser) await browser.close();
}

export async function loadPage(url = 'about:blank') {
  await page.goto(url);
}

export async function executeFunction(fnString, ...args) {
  return await page.evaluate((fn, ...params) => {
    const func = new Function('return (' + fn + ')')();
    return func(...params);
  }, fnString, ...args);
}

export async function getPageContent() {
  return await page.content();
}

export { page };