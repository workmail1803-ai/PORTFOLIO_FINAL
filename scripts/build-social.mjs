/**
 * Renders the Open Graph card from the real hero, and the apple-touch icon
 * from the favicon, so the share preview is always the current design.
 */
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const base = process.env.SHOT_URL || 'http://127.0.0.1:5173';

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(4000);

// Hide the fixed chrome so the card is just the statement and the globe.
await page.addStyleTag({ content: '.bar, .curtain, .cursor-dot, .cursor-ring { display: none !important }' });
await page.waitForTimeout(400);

const shot = await page.screenshot();
await sharp(shot).resize(1200, 630).png({ compressionLevel: 9 }).toFile('public/images/social.png');
console.log('social.png — 1200x630');

await browser.close();

// apple-touch-icon from the same mark as the favicon.
const svg = await readFile('public/images/favicon.svg');
await sharp(svg, { density: 512 }).resize(180, 180).png().toFile('public/images/favicon.png');
console.log('favicon.png — 180x180');
