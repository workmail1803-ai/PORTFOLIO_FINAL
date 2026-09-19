/**
 * Verification gate over every route: axe (WCAG 2.1 AA), horizontal overflow,
 * broken images and the no-WebGL fallback — at desktop and phone widths, with
 * the lamp both off and on.
 */
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const baseURL = process.env.AUDIT_URL || 'http://127.0.0.1:5173';
await mkdir('artifacts', { recursive: true });

const ROUTES = [
  '/',
  '/about',
  '/projects',
  '/projects/nextup',
  '/projects/pixelsub',
  '/skills',
  '/build-log',
  '/lab',
  '/education',
  '/resume',
  '/playground',
  '/contact',
  '/not-a-real-page',
];
const VIEWS = [
  ['desktop', 1440, 900],
  ['mobile', 390, 844],
];

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const failures = [];
const report = {};

try {
  for (const lamp of ['off', 'on']) {
    for (const [view, width, height] of VIEWS) {
      const context = await browser.newContext({ viewport: { width, height } });
      await context.addInitScript(value => {
        try {
          localStorage.setItem('lamp', value);
        } catch {
          /* private mode */
        }
      }, lamp);
      const page = await context.newPage();

      for (const route of ROUTES) {
        await page.goto(baseURL + route, { waitUntil: 'networkidle', timeout: 60000 });
        await page.evaluate(() => document.fonts.ready);
        // Walk the page so reveal-on-scroll content is in its final state.
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 600) {
            window.scrollTo(0, y);
            await new Promise(r => setTimeout(r, 40));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(900);

        const key = `${lamp}/${view}${route}`;
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        report[key] = axe.violations.map(v => ({
          id: v.id,
          nodes: v.nodes.map(n => ({
            target: n.target.join(' '),
            summary: (n.failureSummary || '').split(/\r?\n/).filter(Boolean).slice(-1)[0],
          })),
        }));
        if (axe.violations.length) failures.push(`${key}: ${axe.violations.map(v => v.id).join(', ')}`);

        const overflow = await page.evaluate(w => document.documentElement.scrollWidth - w, width);
        if (overflow > 1) failures.push(`${key}: ${overflow}px horizontal overflow`);

        const broken = await page.evaluate(() =>
          [...document.images].filter(img => img.complete && img.naturalWidth === 0).map(img => img.getAttribute('src')),
        );
        if (broken.length) failures.push(`${key}: broken images ${broken.join(', ')}`);
      }
      await context.close();
    }
  }

  // Without WebGL the site must still work; the playground degrades quietly.
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = function () {
      return null;
    };
  });
  const page = await context.newPage();
  for (const route of ['/', '/playground']) {
    await page.goto(baseURL + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    if (!(await page.locator('h1').first().isVisible())) failures.push(`no-webgl${route}: heading not visible`);
  }
  report.noWebgl = 'checked';
  await context.close();
} finally {
  await browser.close();
}

await writeFile('artifacts/audit.json', JSON.stringify(report, null, 2));

if (failures.length) {
  console.error(`audit failed (${failures.length}):`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`audit passed — ${ROUTES.length} routes × 2 widths × 2 lamp states: a11y clean, no overflow, no broken images, no-WebGL fallback works`);
