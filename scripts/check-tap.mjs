/**
 * Drives the hero tap interaction through every state and checks each one,
 * then confirms the press actually navigates. Also captures each state.
 */
import { chromium } from '@playwright/test';

const base = process.env.SHOT_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);

const state = () => page.locator('.tap').getAttribute('data-state');
const button = page.locator('.tap-button');
const box = await button.boundingBox();
const results = [];
const check = (label, got, want) => results.push([label, got, want, got === want]);

// 1. Cursor far away: idle.
await page.mouse.move(80, 850);
await page.waitForTimeout(250);
check('far away', await state(), 'idle');

// 2. Within reach: he notices.
await page.mouse.move(box.x - 120, box.y + box.height / 2, { steps: 6 });
await page.waitForTimeout(450);
check('approaching', await state(), 'near');
await page.screenshot({ path: 'artifacts/tap-near.png', clip: { x: box.x - 120, y: box.y - 420, width: 560, height: 520 } });

// 3. On the button: finger rests on it.
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
await page.waitForTimeout(450);
check('hovering', await state(), 'hover');
await page.screenshot({ path: 'artifacts/tap-hover.png', clip: { x: box.x - 120, y: box.y - 420, width: 560, height: 520 } });

// 4. Press: state flips, burst appears, then the page changes.
await page.mouse.down();
await page.mouse.up();
await page.waitForTimeout(90);
check('pressed', await state(), 'press');
const burst = await page.locator('.tap .burst').count();
check('ripple + sparks spawned', burst > 0, true);
await page.screenshot({ path: 'artifacts/tap-press.png', clip: { x: box.x - 120, y: box.y - 420, width: 560, height: 520 } });

await page.waitForURL('**/projects', { timeout: 3000 });
check('navigated', new URL(page.url()).pathname, '/projects');

// 5. Keyboard: Enter on the focused link runs the same sequence.
await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.locator('.tap-button').focus();
await page.waitForTimeout(300);
check('keyboard focus', await state(), 'hover');
await page.keyboard.press('Enter');
await page.waitForURL('**/projects', { timeout: 3000 });
check('keyboard navigates', new URL(page.url()).pathname, '/projects');

// 6. The character never intercepts the pointer.
await page.goto(base, { waitUntil: 'networkidle' });
const hit = await page.evaluate(() => {
  const b = document.querySelector('.tap-button').getBoundingClientRect();
  const el = document.elementFromPoint(b.left + b.width * 0.72, b.top + 6);
  return el?.closest('.tap-button') ? 'button' : el?.className;
});
check('fingertip spot hits the button', hit, 'button');

await browser.close();
let ok = true;
for (const [label, got, want, pass] of results) {
  console.log(`${pass ? '✔' : '✖'} ${label.padEnd(26)} got ${JSON.stringify(got)}${pass ? '' : `  expected ${JSON.stringify(want)}`}`);
  ok &&= pass;
}
process.exit(ok ? 0 : 1);
