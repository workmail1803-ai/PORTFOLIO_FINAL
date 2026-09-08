import { chromium } from '@playwright/test';

const base = process.env.SHOT_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => {
  try {
    localStorage.setItem('theme', 'light');
  } catch {
    /* private mode */
  }
});
await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(4000);

const STOPS = [
  ['hero', null, 0],
  ['wall', '#wall', 0],
  ['case', '#work', 0.9],
  ['method', '#method', 0],
  ['contact', '#contact', 0],
];

for (const [name, selector, offset] of STOPS) {
  await page.evaluate(
    ([sel, off]) => {
      const target = sel ? document.querySelector(sel) : null;
      const base = target ? target.getBoundingClientRect().top + window.scrollY : 0;
      window.scrollTo({ top: base + off * window.innerHeight, behavior: 'instant' });
    },
    [selector, offset],
  );
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `artifacts/light-${name}.png` });
}

await browser.close();
console.log('light theme captured');
