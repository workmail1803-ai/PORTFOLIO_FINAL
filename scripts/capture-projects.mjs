import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const TARGETS = [
  ['allbanglapaper', 'https://www.allbanglapaper.com'],
  ['nextup', 'https://nextupmentor.com'],
  ['tutorme', 'https://tutorme-orpin.vercel.app'],
  ['mosjid', 'https://mosjid.info'],
  ['hikmah', 'https://hikmahtutors.com'],
  ['relief-chain', 'https://relief-chain-eta.vercel.app'],
];

await mkdir('public/images/work', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
  });
  for (const [name, url] of TARGETS) {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1200);
      const shot = await page.screenshot();
      await sharp(shot).resize(1600).webp({ quality: 86 }).toFile(`public/images/work/${name}.webp`);
      await sharp(shot).resize(760).webp({ quality: 80 }).toFile(`public/images/work/${name}-sm.webp`);
      console.log(`captured ${name} — ${await page.title()}`);
    } catch (error) {
      console.log(`skipped ${name}: ${error.message.split('\n')[0]}`);
    }
  }

  const mobile = await browser.newPage({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
    isMobile: true,
    hasTouch: true,
  });
  for (const [name, url] of TARGETS.slice(0, 4)) {
    try {
      await mobile.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await mobile.evaluate(() => document.fonts.ready);
      await mobile.waitForTimeout(1000);
      const shot = await mobile.screenshot();
      await sharp(shot).resize(430).webp({ quality: 84 }).toFile(`public/images/work/${name}-mobile.webp`);
      console.log(`captured ${name} (mobile)`);
    } catch (error) {
      console.log(`skipped ${name} mobile: ${error.message.split('\n')[0]}`);
    }
  }
} finally {
  await browser.close();
}
