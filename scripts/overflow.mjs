/** Reports any element wider than the viewport, at several widths. */
import { chromium } from '@playwright/test';

const base = process.env.SHOT_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

for (const width of [320, 390, 768, 1024, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);

  const report = await page.evaluate(w => {
    const bad = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      if (r.right > w + 1 || r.left < -1) {
        bad.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 46),
          left: Math.round(r.left),
          right: Math.round(r.right),
        });
      }
    }
    return { scrollWidth: document.documentElement.scrollWidth, bad: bad.slice(0, 10) };
  }, width);

  console.log(`\n${width}px — document scrollWidth ${report.scrollWidth}`);
  if (!report.bad.length) console.log('  no overflow');
  for (const b of report.bad) console.log(`  ${b.left}→${b.right}  ${b.tag}.${b.cls}`);
  await page.close();
}

await browser.close();
