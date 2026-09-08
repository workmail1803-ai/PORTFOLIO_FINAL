/** Attributes the long frames: long tasks vs image decode vs style/layout. */
import { chromium } from '@playwright/test';

const base = process.env.SHOT_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(3000);

const out = await page.evaluate(async () => {
  const long = [];
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) long.push({ start: e.startTime, dur: e.duration });
  }).observe({ entryTypes: ['longtask'] });

  const resources = [];
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) {
      if (e.initiatorType === 'img') resources.push({ name: e.name.split('/').pop(), dur: e.duration });
    }
  }).observe({ entryTypes: ['resource'] });

  const max = document.documentElement.scrollHeight - window.innerHeight;
  for (let i = 0; i <= 140; i++) {
    window.scrollTo(0, (max * i) / 140);
    await new Promise(r => setTimeout(r, 16));
  }
  await new Promise(r => setTimeout(r, 400));
  return { long: long.sort((a, b) => b.dur - a.dur).slice(0, 8), images: resources };
});

console.log('longest main-thread tasks during scroll (ms):');
for (const t of out.long) console.log(`  ${t.dur.toFixed(0).padStart(5)}  at ${t.start.toFixed(0)}ms`);
console.log(`\nimages fetched during scroll: ${out.images.length}`);
for (const i of out.images.slice(0, 12)) console.log(`  ${i.dur.toFixed(0).padStart(5)}ms  ${i.name}`);

await browser.close();
