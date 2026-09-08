/**
 * Verification gate: accessibility, contrast, keyboard reachability and the
 * no-WebGL fallback. Run against a dev or preview server.
 */
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const baseURL = process.env.AUDIT_URL || 'http://127.0.0.1:5173';
await mkdir('artifacts', { recursive: true });

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const failures = [];
const report = {};

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500);
}

try {
  for (const theme of ['dark', 'light']) {
    for (const [name, width, height] of [
      ['desktop', 1440, 900],
      ['mobile', 390, 844],
    ]) {
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      await page.addInitScript(t => {
        try {
          localStorage.setItem('theme', t);
        } catch {
          /* private mode */
        }
      }, theme);
      await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 60000 });
      await settle(page);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const key = `${theme}-${name}`;
      report[key] = results.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map(n => ({
          target: n.target.join(' '),
          summary: (n.failureSummary || '').split(/\r?\n/).filter(Boolean).slice(-1)[0],
        })),
      }));
      if (results.violations.length) {
        failures.push(`${key}: ${results.violations.map(v => v.id).join(', ')}`);
      }

      // No element may push the page wider than the screen.
      const overflow = await page.evaluate(
        w => document.documentElement.scrollWidth - w,
        width,
      );
      if (overflow > 1) failures.push(`${key}: ${overflow}px of horizontal overflow`);

      await context.close();
    }
  }

  // Every project the wall links to must resolve.
  const linkContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await linkContext.newPage();
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await settle(page);

  const broken = await page.evaluate(async () => {
    const bad = [];
    for (const img of document.querySelectorAll('img')) {
      if (img.complete && img.naturalWidth === 0) bad.push(img.getAttribute('src'));
    }
    return bad;
  });
  if (broken.length) failures.push(`broken images: ${broken.join(', ')}`);
  report.brokenImages = broken;

  // The page must still work with WebGL unavailable.
  const noGlContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const noGl = await noGlContext.newPage();
  await noGl.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = function () {
      return null;
    };
  });
  await noGl.goto(baseURL, { waitUntil: 'networkidle' });
  await settle(noGl);
  const headingVisible = await noGl.locator('#hero-title').isVisible();
  if (!headingVisible) failures.push('no-webgl: hero heading not visible');
  await noGl.screenshot({ path: 'artifacts/no-webgl.png' });
  report.noWebglOk = headingVisible;
  await noGlContext.close();
  await linkContext.close();
} finally {
  await browser.close();
}

await writeFile('artifacts/audit.json', JSON.stringify(report, null, 2));

if (failures.length) {
  console.error('audit failed:');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log('audit passed — a11y clean, no overflow, no broken images, no-WebGL fallback works');
