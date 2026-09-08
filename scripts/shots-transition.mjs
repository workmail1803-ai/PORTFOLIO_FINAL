/**
 * Scrolls gradually across an emblem boundary and captures frames, which is
 * how the transition is actually experienced.
 */
import { chromium } from '@playwright/test';

const base = process.env.SHOT_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(3000);

// Park just above the boundary between the সংবাদ and plane slots.
const start = await page.evaluate(() => {
  const el = document.querySelector('[data-field="plane"]');
  const r = el.getBoundingClientRect();
  const top = r.top + window.scrollY - innerHeight / 2 - 260;
  window.scrollTo({ top, behavior: 'instant' });
  return top;
});
await page.waitForTimeout(2500);
await page.screenshot({ path: 'artifacts/travel-0-before.png' });

// Cross it at a human scroll speed.
for (let i = 1; i <= 6; i++) {
  await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), start + i * 90);
  await page.waitForTimeout(150);
  await page.screenshot({ path: `artifacts/travel-${i}.png` });
}

await page.waitForTimeout(1400);
await page.screenshot({ path: 'artifacts/travel-7-settled.png' });

await browser.close();
console.log('captured gradual travel');
