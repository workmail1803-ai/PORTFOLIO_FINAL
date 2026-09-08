import { chromium } from '@playwright/test';

const base = process.env.SHOT_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(3500);

const fields = await page.evaluate(() =>
  [...document.querySelectorAll('[data-field]')].map(el => el.dataset.field),
);

for (const [i, name] of fields.entries()) {
  await page.evaluate(index => {
    const el = document.querySelectorAll('[data-field]')[index];
    const r = el.getBoundingClientRect();
    window.scrollTo({
      top: r.top + window.scrollY + r.height / 2 - window.innerHeight / 2,
      behavior: 'instant',
    });
  }, i);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `artifacts/emblem-${i}-${name}.png` });
}

await browser.close();
console.log('emblems:', fields.join(', '));
