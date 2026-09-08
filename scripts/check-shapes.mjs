/**
 * Walks the page in small scroll steps and records which field slot wins at
 * each stop, so we can see the shape sequence is stable and never oscillates.
 */
import { chromium } from '@playwright/test';

const base = process.env.SHOT_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(2000);

const sequence = await page.evaluate(() => {
  // Mirrors useFieldSlots: containment first, smallest wins, else nearest.
  const pick = () => {
    const eye = window.innerHeight / 2;
    let inside = null;
    for (const el of document.querySelectorAll('[data-field]')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const zone = el.closest('[data-field-zone]') || el;
      const band = zone === el ? r : zone.getBoundingClientRect();
      if (band.top > eye || band.bottom < eye) continue;
      const area = band.width * band.height;
      if (!inside || area < inside.area) inside = { el, area };
    }
    return inside ? inside.el.dataset.field : '(none)';
  };

  const max = document.documentElement.scrollHeight - window.innerHeight;
  const out = [];
  for (let y = 0; y <= max; y += 120) {
    window.scrollTo({ top: y, behavior: 'instant' });
    out.push([y, pick()]);
  }
  return out;
});

const runs = [];
for (const [y, shape] of sequence) {
  if (!runs.length || runs[runs.length - 1].shape !== shape) runs.push({ shape, from: y, to: y });
  else runs[runs.length - 1].to = y;
}

console.log('shape runs down the page:');
for (const r of runs) console.log(`  ${String(r.from).padStart(6)}–${String(r.to).padStart(6)}px  ${r.shape}`);

const seen = new Map();
let oscillations = 0;
for (const r of runs) {
  if (seen.has(r.shape) && seen.get(r.shape) < runs.indexOf(r) - 1) oscillations++;
  seen.set(r.shape, runs.indexOf(r));
}
console.log(`\nruns: ${runs.length}, repeated shapes (excluding 'grid'): ` +
  runs.filter(r => r.shape !== 'grid').length + ' vs unique ' +
  new Set(runs.filter(r => r.shape !== 'grid').map(r => r.shape)).size);

await browser.close();
