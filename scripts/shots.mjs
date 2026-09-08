/**
 * Design-review screenshots. Renders the running dev server at real viewport
 * sizes and writes them to artifacts/ so the layout can be judged honestly.
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const base = process.env.SHOT_URL || 'http://127.0.0.1:5173';
const only = process.argv[2];

await mkdir('artifacts', { recursive: true });

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

const VIEWS = [
  ['desktop', 1440, 900],
  ['mobile', 390, 844],
];

/** [name, css selector, extra scroll in viewport heights] */
const STOPS = [
  ['hero', null, 0],
  ['wall', '#wall', 0],
  ['case-1', '#work', 0.9],
  ['case-2', '#work', 2.2],
  ['ledger', '#work', 4.4],
  ['method', '#method', 0],
  ['about', '#about', 0],
  ['contact', '#contact', 0],
];

try {
  for (const [label, width, height] of VIEWS) {
    if (only && only !== label) continue;
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => m.type() === 'error' && errors.push(m.text()));

    await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(3500); // let the field assemble

    for (const [name, selector, offset] of STOPS) {
      await page.evaluate(
        ([sel, off]) => {
          const target = sel ? document.querySelector(sel) : null;
          const base = target ? target.getBoundingClientRect().top + window.scrollY : 0;
          window.scrollTo({ top: base + off * window.innerHeight, behavior: 'instant' });
        },
        [selector, offset],
      );
      await page.waitForTimeout(1600);
      await page.screenshot({ path: `artifacts/${label}-${name}.png` });
    }

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `artifacts/${label}-full.png`, fullPage: true });

    console.log(`${label}: ${errors.length ? `⚠ ${errors.length} error(s)` : 'clean'}`);
    for (const error of errors.slice(0, 5)) console.log(`   ${error}`);
    await page.close();
  }
} finally {
  await browser.close();
}
