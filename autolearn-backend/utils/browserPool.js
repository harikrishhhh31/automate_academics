import { chromium } from 'playwright';

const POOL_SIZE = 3;
const pool = [];
const waitQueue = [];

async function createBrowser() {
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox'
    ]
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/124.0.0.0 Safari/537.36'
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });
  });
  return { browser, context, inUse: false };
}

export async function initPool() {
  for (let i = 0; i < POOL_SIZE; i++) {
    const instance = await createBrowser();
    pool.push(instance);
  }
  console.log(`[Pool] ${POOL_SIZE} browsers ready`);
}

export async function acquireBrowser() {
  const free = pool.find(b => !b.inUse);
  if (free) {
    free.inUse = true;
    return free;
  }
  return new Promise(resolve => waitQueue.push(resolve));
}

export function releaseBrowser(instance) {
  instance.inUse = false;
  if (waitQueue.length > 0) {
    const next = waitQueue.shift();
    instance.inUse = true;
    next(instance);
  }
}
