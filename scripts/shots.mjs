/**
 * Design-review screenshots of every route at real viewport sizes.
 *   node scripts/shots.mjs [desktop|mobile] [route-filter]
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const base = process.env.SHOT_URL || 'http://127.0.0.1:5173';
const [, , onlyView, onlyRoute] = process.argv;
await mkdir('artifacts/pages', { recursive: true });

const ROUTES = [
  ['home', '/'],
  ['about', '/about'],
  ['projects', '/projects'],
  ['case', '/projects/nextup'],
  ['skills', '/skills'],
  ['build', '/build-log'],
  ['lab', '/lab'],
  ['education', '/education'],
  ['resume', '/resume'],
  ['playground', '/playground'],
  ['contact', '/contact'],
  ['404', '/definitely-not-a-page'],
];

const VIEWS = [
  ['desktop', 1440, 900],
  ['mobile', 390, 844],
];

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});

try {
  for (const [view, width, height] of VIEWS) {
    if (onlyView && onlyView !== view) continue;
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => m.type() === 'error' && errors.push(m.text()));

    for (const [name, path] of ROUTES) {
      if (onlyRoute && !name.includes(onlyRoute)) continue;
      await page.goto(base + path, { waitUntil: 'networkidle', timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(name === 'playground' ? 3500 : 1200);
      await page.screenshot({ path: `artifacts/pages/${view}-${name}.png` });
      // Scroll through once so reveal-on-scroll content is in its final state.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 500) {
          window.scrollTo(0, y);
          await new Promise(r => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(700);
      await page.screenshot({ path: `artifacts/pages/${view}-${name}-full.png`, fullPage: true });
    }
    console.log(`${view}: ${errors.length ? `${errors.length} error(s)` : 'clean'}`);
    for (const error of [...new Set(errors)].slice(0, 6)) console.log(`   ${error.slice(0, 200)}`);
    await page.close();
  }
} finally {
  await browser.close();
}
