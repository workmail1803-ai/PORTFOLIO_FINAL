/**
 * Measures real frame pacing while the page is scrolled, so scroll smoothness
 * is a number rather than an opinion. Reports the worst frames, which are what
 * actually get felt.
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

const result = await page.evaluate(async () => {
  const frames = [];
  let last = performance.now();
  let running = true;

  const tick = now => {
    frames.push(now - last);
    last = now;
    if (running) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // Scroll the whole page in realistic increments.
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const steps = 140;
  for (let i = 0; i <= steps; i++) {
    window.scrollTo(0, (max * i) / steps);
    await new Promise(r => setTimeout(r, 16));
  }
  running = false;

  const sorted = [...frames].sort((a, b) => a - b);
  const at = q => sorted[Math.floor(sorted.length * q)];
  return {
    frames: frames.length,
    median: +at(0.5).toFixed(1),
    p90: +at(0.9).toFixed(1),
    p99: +at(0.99).toFixed(1),
    worst: +sorted[sorted.length - 1].toFixed(1),
    over32ms: frames.filter(f => f > 32).length,
  };
});

console.log('frame times while scrolling the full page (ms):');
console.log(`  frames    ${result.frames}`);
console.log(`  median    ${result.median}`);
console.log(`  p90       ${result.p90}`);
console.log(`  p99       ${result.p99}`);
console.log(`  worst     ${result.worst}`);
console.log(`  >32ms     ${result.over32ms} (${((result.over32ms / result.frames) * 100).toFixed(1)}%)`);
console.log('\nnote: software GL (swiftshader), so real hardware is faster than this.');

await browser.close();
