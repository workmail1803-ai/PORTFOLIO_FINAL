/**
 * Turns the generated character artwork into web-ready layers.
 *
 *   node scripts/build-characters.mjs
 *
 * Source PNGs live in design-src/ (extracted from the artwork zip, not
 * committed). Output: public/characters/*.webp at two widths, plus
 * src/characters/manifest.ts with each image's size and named anchor points
 * expressed as fractions, so components can align a fingertip to a button
 * without hard-coding pixels.
 *
 * Several images arrived with interface elements painted in — a "View My Work"
 * button under a finger, a card someone is sitting on. Those are erased here
 * so the site can put a *real*, clickable element in exactly that place.
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { removeCheckerboard, polygonMask, loadRGBA, isSkin, isBlueish } from './lib/cutout.mjs';

const SRC = id => `design-src/portfolio_asset_${String(id).padStart(2, '0')}.png`;
const OUT = 'public/characters';
const WIDTHS = [960, 520];

await mkdir(OUT, { recursive: true });
await mkdir('src/characters', { recursive: true });

const manifest = {};

/* ── helpers ─────────────────────────────────────────────────────────────── */

function erase(img, test) {
  const { rgba, width, height } = img;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (test(x, y, rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3])) rgba[i + 3] = 0;
    }
  }
}

function eraseMasked(img, mask, keep = () => false) {
  const { rgba, width, height } = img;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (!mask[p]) continue;
      const i = p * 4;
      if (!keep(x, y, rgba[i], rgba[i + 1], rgba[i + 2])) rgba[i + 3] = 0;
    }
  }
}

/** Bounding box of every pixel with meaningful alpha, across one or more images. */
function alphaBox(...imgs) {
  const { width, height } = imgs[0];
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (const { rgba } of imgs) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (rgba[(y * width + x) * 4 + 3] > 24) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
  }
  const pad = 4;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

async function write(name, img, box) {
  const base = sharp(img.rgba, { raw: { width: img.width, height: img.height, channels: 4 } }).extract(box);
  const png = await base.png().toBuffer();
  const sizes = [];
  for (const w of WIDTHS) {
    const target = Math.min(w, box.width);
    const info = await sharp(png)
      .resize({ width: target })
      .webp({ quality: 84, alphaQuality: 90, effort: 5 })
      .toFile(`${OUT}/${name}-${w}.webp`);
    sizes.push(`${w}w ${(info.size / 1024).toFixed(0)}KB`);
  }
  console.log(`  ${name.padEnd(16)} ${box.width}x${box.height}  ${sizes.join('  ')}`);
}

/** Converts source-pixel anchors into fractions of the cropped image. */
function anchors(box, points) {
  const out = {};
  for (const [key, [x, y]] of Object.entries(points)) {
    out[key] = [+((x - box.left) / box.width).toFixed(4), +((y - box.top) / box.height).toFixed(4)];
  }
  return out;
}

async function simple(name, id, points = {}) {
  const img = await loadRGBA(SRC(id));
  const box = alphaBox(img);
  await write(name, img, box);
  manifest[name] = { w: box.width, h: box.height, anchors: anchors(box, points) };
}

async function checker(name, id, points = {}) {
  const img = await removeCheckerboard(SRC(id));
  const box = alphaBox(img);
  await write(name, img, box);
  manifest[name] = { w: box.width, h: box.height, anchors: anchors(box, points) };
}

/* ── boy tapping a button — split into body + hand ───────────────────────── */

async function boyTap() {
  const img = await loadRGBA(SRC(7));
  const { width, height } = img;

  // The painted button. The fingertip dips into its top edge, so skin and the
  // finger's outline are kept inside a small box; everything blue goes.
  erase(img, (x, y, r, g, b) => {
    if (x > 760 || y < 945) return false;
    const onFinger = x >= 350 && x <= 412 && y <= 1002;
    return !(onFinger && !isBlueish(r, g, b));
  });
  // the painted "tap" sparks — real ones are animated instead
  erase(img, (x, y) => x >= 238 && x <= 356 && y >= 755 && y <= 896);

  // Forearm + hand, cut at the sleeve cuff. The hand layer also carries a band
  // reaching into the sleeve, so rotating it about a pivot in the cuff never
  // opens a seam.
  const lower = [
    [412, 740], [470, 708], [566, 750], [516, 808], [514, 926], [428, 950],
    [408, 1006], [358, 1006], [340, 880], [398, 782],
  ];
  const hand = [
    [404, 726], [468, 690], [578, 734], [566, 750], [516, 808], [514, 926], [428, 950],
    [408, 1006], [358, 1006], [340, 880], [398, 782],
  ];
  const lowerMask = await polygonMask(width, height, [lower]);
  const handMask = await polygonMask(width, height, [hand]);

  const body = { width, height, rgba: Buffer.from(img.rgba) };
  const handImg = { width, height, rgba: Buffer.alloc(img.rgba.length) };
  for (let p = 0; p < width * height; p++) {
    if (lowerMask[p]) body.rgba[p * 4 + 3] = 0;
    if (handMask[p]) img.rgba.copy(handImg.rgba, p * 4, p * 4, p * 4 + 4);
  }

  const box = alphaBox(body, handImg);
  await write('boy-tap-body', body, box);
  await write('boy-tap-hand', handImg, box);
  manifest['boy-tap'] = {
    w: box.width,
    h: box.height,
    anchors: anchors(box, { fingertip: [384, 998], pivot: [492, 722] }),
  };
}

/* ── girl pressing a pill button — her arms rest behind it ───────────────── */

async function girlPress() {
  const img = await loadRGBA(SRC(8));
  const { width, height } = img;
  const pill = await polygonMask(width, height, [
    '<rect x="186" y="804" width="980" height="278" rx="139" fill="#fff"/>',
  ]);
  // Only the fingertip is drawn in front of the button.
  eraseMasked(img, pill, (x, y, r, g, b) => {
    const inBox = x >= 540 && x <= 608 && y <= 862;
    const brownLine = r >= g && g >= b && r - b > 14 && r < 175;
    return inBox && !isBlueish(r, g, b) && (isSkin(r, g, b) || brownLine);
  });
  // Her yellow tap marks are left alone: they are painted over the sweater,
  // so erasing them would punch holes in it.

  const box = alphaBox(img);
  await write('girl-press', img, box);
  manifest['girl-press'] = {
    w: box.width,
    h: box.height,
    anchors: anchors(box, {
      fingertip: [572, 852],
      buttonTopLeft: [186, 804],
      buttonBottomRight: [1166, 1082],
    }),
  };
}

/* ── boy sitting on a card — legs hang in front of it ────────────────────── */

async function boySit() {
  const img = await loadRGBA(SRC(13));
  const { width, height } = img;

  const card = await polygonMask(width, height, [
    '<rect x="30" y="760" width="1085" height="596" rx="60" fill="#fff"/>',
  ]);
  const legs = await polygonMask(width, height, [
    [
      [165, 776], [902, 776], [916, 1000], [1006, 1136], [999, 1190], [965, 1216], [850, 1248],
      [745, 1254], [697, 1232], [694, 1195], [735, 1110], [770, 1040], [735, 1060], [722, 1090],
      [676, 1120], [615, 1116], [596, 1074], [553, 975], [550, 915], [515, 952], [480, 932],
      [448, 845], [436, 804], [165, 804],
    ],
  ]);

  // Outside the legs: the card goes entirely. Inside: only its cool lavender
  // white and shadow go — the sneakers are warm white, the card is not.
  for (let p = 0; p < width * height; p++) {
    if (!card[p]) continue;
    const i = p * 4;
    const [r, g, b] = [img.rgba[i], img.rgba[i + 1], img.rgba[i + 2]];
    const lum = (r + g + b) / 3;
    const y = Math.floor(p / width);
    // Along the seat line the hand and the jacket hem overlap the card's
    // border; keep only what is warm (skin, brown cloth) or near-black.
    if (y < 800) {
      if (!(isSkin(r, g, b) || r > b + 3 || lum < 45)) img.rgba[i + 3] = 0;
      continue;
    }
    const cardTone = (b >= r + 3 && lum > 175) || (b > r + 8 && lum > 110);
    if (!legs[p] || cardTone) img.rgba[i + 3] = 0;
  }
  erase(img, (x, y) => x >= 50 && x <= 160 && y >= 645 && y <= 755);

  const box = alphaBox(img);
  await write('boy-sit', img, box);
  manifest['boy-sit'] = {
    w: box.width,
    h: box.height,
    anchors: anchors(box, { seat: [30, 776], seatRight: [1115, 776] }),
  };
}

/* ── boy presenting something on his open palm ───────────────────────────── */

async function boyPresent() {
  const img = await loadRGBA(SRC(10));
  const { width, height } = img;
  const cardMask = await polygonMask(width, height, [
    '<rect x="672" y="302" width="478" height="346" rx="44" fill="#fff"/>',
  ]);
  eraseMasked(img, cardMask, (x, y, r, g, b) => y > 596 && isSkin(r, g, b));
  erase(img, (x, y) => (x >= 190 && x <= 270 && y >= 240 && y <= 310) || (x >= 1040 && x <= 1140 && y >= 240 && y <= 334));

  const box = alphaBox(img);
  await write('boy-present', img, box);
  manifest['boy-present'] = {
    w: box.width,
    h: box.height,
    anchors: anchors(box, { palm: [990, 640], cardCentre: [910, 470], pointer: [650, 462] }),
  };
}

/* ── run ─────────────────────────────────────────────────────────────────── */

console.log('characters →', OUT);
await boyTap();
await girlPress();
await boySit();
await boyPresent();

await checker('boy-point', 3, { fingertip: [300, 280] });
await checker('girl-peace', 4);
await checker('boy-coffee', 5);
await checker('girl-laptop', 6);

await simple('girl-point', 9, { fingertip: [1100, 855] });
await simple('girl-think', 11);
await simple('boy-code', 12);
await simple('boy-sleep', 14);

const ts = `/* Generated by scripts/build-characters.mjs — do not edit by hand. */

export type CharacterAsset = {
  /** Intrinsic size of the largest export, for aspect ratio. */
  w: number;
  h: number;
  /** Named points as [x, y] fractions of the image. */
  anchors: Record<string, [number, number]>;
};

export const characterAssets = ${JSON.stringify(manifest, null, 2)} as const satisfies Record<string, CharacterAsset>;

export const CHARACTER_WIDTHS = ${JSON.stringify(WIDTHS)} as const;
`;
await writeFile('src/characters/manifest.ts', ts);
console.log('manifest → src/characters/manifest.ts');
