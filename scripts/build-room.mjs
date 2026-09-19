/**
 * Builds the living room behind every page from one painting.
 *
 *   public/room/room-{1280,1920}.webp   the scene itself
 *   public/room/neon-on.webp            the neon sign's glow, to brighten it
 *   public/room/neon-off.webp           the sign painted out, to flicker it off
 *   public/room/cat.webp                the sleeping cat, feathered, to breathe
 *   src/room/manifest.ts                where the real lit windows and painted
 *                                       stars are, so twinkles land on them
 *
 * Everything that moves is found in the painting rather than scattered at
 * random: a window that switches off is a window that was lit.
 *
 * Source: design-src/room-night.webp (git-ignored).
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const SRC = 'design-src/room-night.webp';
const OUT = 'public/room';
await mkdir(OUT, { recursive: true });

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const px = (x, y) => {
  const i = (y * W + x) * 3;
  return [data[i], data[i + 1], data[i + 2]];
};
const lum = (x, y) => {
  const [r, g, b] = px(x, y);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const hex = ([r, g, b]) => '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

// Deterministic, so a rebuild does not reshuffle the whole city.
let seed = 20260919;
const rand = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const between = (a, b) => a + (b - a) * rand();
const round = (v, d = 2) => Number(v.toFixed(d));

/** Separable Gaussian blur over a float image. */
function blur(src, w, h, sigma) {
  const r = Math.ceil(sigma * 3);
  const k = Array.from({ length: r * 2 + 1 }, (_, i) => Math.exp(-((i - r) ** 2) / (2 * sigma * sigma)));
  const sum = k.reduce((a, b) => a + b, 0);
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let i = -r; i <= r; i++) s += src[y * w + Math.min(w - 1, Math.max(0, x + i))] * k[i + r];
      tmp[y * w + x] = s / sum;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let i = -r; i <= r; i++) s += tmp[Math.min(h - 1, Math.max(0, y + i)) * w + x] * k[i + r];
      out[y * w + x] = s / sum;
    }
  return out;
}

/* ── The scene ─────────────────────────────────────────────────────────── */

for (const width of [1280, 1920]) {
  const file = `${OUT}/room-${width}.webp`;
  await sharp(SRC)
    .resize(width, null, { kernel: 'lanczos3' })
    .sharpen({ sigma: width > W ? 0.7 : 0.4 })
    .webp({ quality: width > 1600 ? 78 : 76, effort: 6 })
    .toFile(file);
}
// A blurred thumbnail, inlined, so the room is there before the image is.
const lqip = await sharp(SRC).resize(32).blur(1.2).webp({ quality: 40 }).toBuffer();

/* ── Where the city is ─────────────────────────────────────────────────── */

const inRect = (x, y, [x0, y0, x1, y1]) => x >= x0 && x < x1 && y >= y0 && y < y1;

// The three window panes, below their skylines, and what stands in front of them.
const CITY = [
  [438, 205, 632, 526],
  [778, 150, 1210, 526],
  [1258, 226, 1448, 526],
];
const NOT_CITY = [
  [585, 150, 845, 380], // the hanging plant
  [728, 430, 792, 540], // sill plant, left
  [858, 425, 995, 540], // sill plants, centre
  [1238, 470, 1302, 540], // sill plant, right
  [1312, 486, 1372, 540],
  [1388, 452, 1462, 582], // the lantern
  [972, 140, 1012, 232], // the tallest spire's tip, which reads as a star
];
const isCity = (x, y) => CITY.some(r => inRect(x, y, r)) && !NOT_CITY.some(r => inRect(x, y, r));
const greenish = ([r, g, b]) => g > r + 8 && g > b;

function localMax(x, y, radius) {
  const l = lum(x, y);
  for (let dy = -radius; dy <= radius; dy++)
    for (let dx = -radius; dx <= radius; dx++) if ((dx || dy) && lum(x + dx, y + dy) > l) return false;
  return true;
}

function pick(candidates, minGap, limit) {
  candidates.sort((a, b) => b.l - a.l);
  const chosen = [];
  for (const c of candidates) {
    if (chosen.length >= limit) break;
    if (chosen.every(o => (o.x - c.x) ** 2 + (o.y - c.y) ** 2 >= minGap * minGap)) chosen.push(c);
  }
  return chosen;
}

const lit = [];
for (let y = 4; y < H - 4; y++)
  for (let x = 4; x < W - 4; x++) {
    if (!isCity(x, y)) continue;
    const l = lum(x, y);
    if (l < 150 || greenish(px(x, y)) || !localMax(x, y, 2)) continue;
    lit.push({ x, y, l });
  }

/** The colour of the building around a light, for painting it out. */
function wall(x, y) {
  const around = [];
  for (let dy = -6; dy <= 6; dy++)
    for (let dx = -6; dx <= 6; dx++) around.push(px(Math.min(W - 1, Math.max(0, x + dx)), Math.min(H - 1, Math.max(0, y + dy))));
  around.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  return around[Math.floor(around.length * 0.2)];
}

/** How far a light spreads, so the patch covers the whole window. */
function extent(x, y, peak) {
  let x0 = x, x1 = x, y0 = y, y1 = y;
  for (let dy = -5; dy <= 5; dy++)
    for (let dx = -5; dx <= 5; dx++)
      if (lum(x + dx, y + dy) > peak * 0.55) {
        x0 = Math.min(x0, x + dx);
        x1 = Math.max(x1, x + dx);
        y0 = Math.min(y0, y + dy);
        y1 = Math.max(y1, y + dy);
      }
  return [x0, y0, x1 + 1, y1 + 1];
}

const lights = pick(lit, 13, 46).map(({ x, y, l }, i) => {
  // Roughly a third of the lit windows switch off now and then; the rest flare.
  const off = i % 3 === 1;
  if (off) {
    const [x0, y0, x1, y1] = extent(x, y, l);
    return {
      k: 'o',
      x: x0 - 0.5,
      y: y0 - 0.5,
      w: x1 - x0 + 1,
      h: y1 - y0 + 1,
      c: hex(wall(x, y)),
      d: round(between(9, 19), 1),
      t: round(-between(0, 19), 1),
    };
  }
  const [r, g, b] = px(x, y);
  return {
    k: 'f',
    x,
    y,
    s: round(between(9, 15), 1),
    c: hex([r + (255 - r) * 0.35, g + (255 - g) * 0.35, b + (255 - b) * 0.35]),
    d: round(between(2.6, 6.8), 1),
    t: round(-between(0, 6.8), 1),
  };
});

/* ── The sky ───────────────────────────────────────────────────────────── */

// Above the skylines: the upper left pane, the big pane under its frame, and
// the strip of the right pane above and below the neon sign.
const SKY = [
  (x, y) => x >= 440 && x < 628 && y >= 8 && y < 188,
  (x, y) => x >= 780 && x < 1208 && y < 228 && y > 92 - (x - 770) * 0.26 + 6 && !(x > 968 && x < 1016 && y > 140) && !(x > 1160 && y > 188),
  (x, y) => x >= 1262 && x < 1446 && ((y >= 8 && y < 74) || (y >= 216 && y < 240)) && !(x > 1392 && y > 180),
];
const isSky = (x, y) => SKY.some(test => test(x, y));

function mean(x, y, r) {
  let s = 0, n = 0;
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      s += lum(x + dx, y + dy);
      n++;
    }
  return s / n;
}

// The painting already has stars; twinkle those first.
const painted = [];
for (let y = 6; y < 245; y++)
  for (let x = 436; x < 1450; x++) {
    if (!isSky(x, y)) continue;
    const l = lum(x, y);
    if (l < 60 || !localMax(x, y, 2)) continue;
    const contrast = l - mean(x, y, 5);
    if (contrast > 18) painted.push({ x, y, l: contrast });
  }
const stars = pick(painted, 22, 26);
// Top up with quiet points of dark sky if the painting is sparse somewhere.
for (let tries = 0; stars.length < 32 && tries < 4000; tries++) {
  const x = Math.round(between(440, 1446));
  const y = Math.round(between(8, 236));
  if (!isSky(x, y) || lum(x, y) > 55) continue;
  if (stars.every(o => (o.x - x) ** 2 + (o.y - y) ** 2 >= 34 * 34)) stars.push({ x, y, l: 0 });
}
const starList = stars.map(({ x, y, l }) => ({
  x,
  y,
  s: round(l ? between(4, 6.5) : between(2.5, 4), 1),
  d: round(between(2.2, 5.8), 1),
  t: round(-between(0, 5.8), 1),
}));

/* ── The neon sign ─────────────────────────────────────────────────────── */

const NEON = [1300, 70, 1440, 224]; // x0, y0, x1, y1 — with room for the glow
{
  const [x0, y0, x1, y1] = NEON;
  const w = x1 - x0;
  const h = y1 - y0;
  const stroke = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      // Tube pixels run 100–160 in luminance against a sky of 25–60; the
      // ramp starts above the painted halo so the halo's box never lights up.
      const a = Math.min(1, Math.max(0, (lum(x0 + x, y0 + y) - 72) / 40));
      // Fade to nothing at the layer's edges so no rectangle can ever show.
      const edge = Math.min(1, x / 14, y / 14, (w - 1 - x) / 14, (h - 1 - y) / 14);
      stroke[y * w + x] = a * Math.max(0, edge);
    }

  // The glow: the strokes, blurred, tinted — added when the sign buzzes bright.
  const halo = blur(stroke, w, h, 6);
  const on = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const glow = halo[i];
    const core = stroke[i];
    on[i * 4] = 170 + 85 * core;
    on[i * 4 + 1] = 176 + 79 * core;
    on[i * 4 + 2] = 255;
    on[i * 4 + 3] = Math.round(Math.min(1, glow * 1.6 + core * 0.7) * 255);
  }
  await sharp(on, { raw: { width: w, height: h, channels: 4 } }).webp({ quality: 88, alphaQuality: 90 }).toFile(`${OUT}/neon-on.webp`);

  // Painted out: the tubes and their halo replaced by the sky around them —
  // a normalised blur over only the pixels that are not sign.
  const cover = blur(stroke, w, h, 2.5);
  const weight = cover.map(c => Math.max(0, 1 - c * 10));
  const wBlur = blur(weight, w, h, 7);
  const channel = c => {
    const out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[y * w + x] = px(x0 + x, y0 + y)[c] * weight[y * w + x];
    return blur(out, w, h, 7);
  };
  const [cr, cg, cb] = [channel(0), channel(1), channel(2)];
  const off = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const n = Math.max(1e-4, wBlur[i]);
    off[i * 4] = cr[i] / n;
    off[i * 4 + 1] = cg[i] / n;
    off[i * 4 + 2] = cb[i] / n;
    off[i * 4 + 3] = Math.round(Math.min(1, cover[i] * 3.2) * 255);
  }
  await sharp(off, { raw: { width: w, height: h, channels: 4 } }).webp({ quality: 86, alphaQuality: 90 }).toFile(`${OUT}/neon-off.webp`);
}

/* ── The cat ───────────────────────────────────────────────────────────── */

const CAT = [1456, 498, 1660, 600];
{
  const [x0, y0, x1, y1] = CAT;
  const w = x1 - x0;
  const h = y1 - y0;
  // A feathered ellipse around the sleeping cat's flank — the part that rises
  // and falls. The head stays out of it: the lantern lights the wall behind
  // it, and a scaled edge against that light would show.
  const ellipse = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <filter id="f"><feGaussianBlur stdDeviation="5"/></filter>
      <ellipse cx="${1584 - x0}" cy="${558 - y0}" rx="68" ry="33" fill="#fff" filter="url(#f)"/>
    </svg>`,
  );
  const alpha = await sharp(ellipse).resize(w, h).extractChannel(0).raw().toBuffer();
  const cut = await sharp(SRC).extract({ left: x0, top: y0, width: w, height: h }).removeAlpha().raw().toBuffer();
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = cut[i * 3];
    rgba[i * 4 + 1] = cut[i * 3 + 1];
    rgba[i * 4 + 2] = cut[i * 3 + 2];
    rgba[i * 4 + 3] = alpha[i];
  }
  await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).webp({ quality: 88, alphaQuality: 90 }).toFile(`${OUT}/cat.webp`);
}

/* ── Manifest ──────────────────────────────────────────────────────────── */

const rect = ([x0, y0, x1, y1]) => ({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
const manifest = `// Generated by scripts/build-room.mjs — do not edit by hand.
// Coordinates are pixels of the ${W}×${H} painting.

export const ROOM = { w: ${W}, h: ${H}, lqip: 'data:image/webp;base64,${lqip.toString('base64')}' } as const;
export const ROOM_WIDTHS = [1280, 1920] as const;

/** Lit windows: 'f' flares brighter, 'o' is a dark patch that switches the window off. */
export type Light =
  | { k: 'f'; x: number; y: number; s: number; c: string; d: number; t: number }
  | { k: 'o'; x: number; y: number; w: number; h: number; c: string; d: number; t: number };
export const LIGHTS: Light[] = ${JSON.stringify(lights)};

export const STARS: Array<{ x: number; y: number; s: number; d: number; t: number }> = ${JSON.stringify(starList)};

export const NEON = ${JSON.stringify(rect(NEON))};
export const CAT = ${JSON.stringify(rect(CAT))};
`;
await mkdir('src/room', { recursive: true });
await writeFile('src/room/manifest.ts', manifest);

const flares = lights.filter(l => l.k === 'f').length;
console.log(`room: ${lights.length} lights (${flares} flare, ${lights.length - flares} switch off), ${starList.length} stars (${stars.filter(s => s.l).length} painted)`);
