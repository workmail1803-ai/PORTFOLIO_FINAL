/**
 * Point-cloud targets for the background field.
 *
 * Every shape is a Float32Array of positions normalised into roughly
 * [-1.7, 1.7]. Only two of them are ever uploaded to the GPU at a time
 * (`aFrom` / `aTo`), so per-vertex cost stays flat no matter how many shapes
 * exist — which is what keeps this affordable on a low-end phone.
 *
 * Text and icons are produced by rasterising to a small offscreen canvas and
 * sampling the filled pixels. One helper covers Bangla type and SVG glyphs
 * alike, so adding a shape costs a few lines rather than a new generator.
 */

export type ShapeId = 'globe' | 'songbad' | 'plane' | 'telegram' | 'graph' | 'envelope';

/** Half-extent every shape is normalised into; the placement maths assumes it. */
export const EXTENT = 1.7;

/**
 * Baked-in rotation applied to the globe before time starts. Dhaka sits at -Z
 * in the raw projection, i.e. facing away; half a turn brings South Asia to the
 * camera on first paint. Field and Arcs both apply it.
 */
export const SPIN_OFFSET = Math.PI;

/** Deterministic PRNG so the field looks identical on every load. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function lonLatToVec3(lon: number, lat: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

/* ── Device budget ───────────────────────────────────────────────────────── */

export type Tier = 'low' | 'mid' | 'high';

/**
 * Picks a particle budget from what the device actually reports. A cheap
 * Android gets a field it can hold at 60fps; a desktop gets the dense one.
 */
export function detectTier(): Tier {
  if (typeof navigator === 'undefined') return 'mid';
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  const coarse = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  const narrow = typeof matchMedia !== 'undefined' && matchMedia('(max-width: 820px)').matches;

  if (memory <= 2 || cores <= 2) return 'low';
  if (memory <= 4 || cores <= 4 || (coarse && narrow)) return 'mid';
  return 'high';
}

export const BUDGET: Record<Tier, { count: number; dpr: [number, number]; size: number }> = {
  low: { count: 5500, dpr: [1, 1], size: 3.2 },
  mid: { count: 12000, dpr: [1, 1.25], size: 2.7 },
  high: { count: 26000, dpr: [1, 1.5], size: 2.3 },
};

/* ── Raster sampling ─────────────────────────────────────────────────────── */

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

/**
 * Draws something opaque onto a small canvas, then scatters `count` points
 * across the pixels it covered. Raster size tracks the budget so a sparse
 * field still lands enough points per glyph to stay readable.
 */
function rasterToPoints(count: number, seed: number, draw: Draw, depth = 0.16): Float32Array {
  const out = new Float32Array(count * 3);
  const random = rng(seed);

  const side = Math.max(160, Math.min(460, Math.round(Math.sqrt(count) * 2.9)));
  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return out;

  ctx.clearRect(0, 0, side, side);
  draw(ctx, side, side);

  const { data } = ctx.getImageData(0, 0, side, side);
  const filled: number[] = [];
  let minX = side;
  let maxX = 0;
  let minY = side;
  let maxY = 0;

  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      if (data[(y * side + x) * 4 + 3] > 120) {
        filled.push(y * side + x);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!filled.length) return out;

  const boxW = Math.max(1, maxX - minX);
  const boxH = Math.max(1, maxY - minY);
  const unit = (EXTENT * 2) / Math.max(boxW, boxH);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  for (let i = 0; i < count; i++) {
    const pixel = filled[(random() * filled.length) | 0];
    const px = pixel % side;
    const py = (pixel / side) | 0;
    out[i * 3] = (px + random() - 0.5 - cx) * unit;
    out[i * 3 + 1] = -(py + random() - 0.5 - cy) * unit;
    out[i * 3 + 2] = (random() - 0.5) * depth;
  }
  return out;
}

/** Fits an SVG path into the canvas and fills it. */
function pathDraw(path: string, viewBox: number, padding = 0.08): Draw {
  return (ctx, w) => {
    const inset = w * padding;
    const scale = (w - inset * 2) / viewBox;
    ctx.save();
    ctx.translate(inset, inset);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#fff';
    ctx.fill(new Path2D(path));
    ctx.restore();
  };
}

/** Strokes a drawing, so the dots trace an outline instead of filling a blob. */
function strokeDraw(paint: (ctx: CanvasRenderingContext2D, w: number) => void): Draw {
  return (ctx, w) => {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = w * 0.045;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    paint(ctx, w);
  };
}

/** An envelope: the closing panel is about reaching the inbox. */
const envelopeDraw = strokeDraw((ctx, w) => {
  const bw = w * 0.78;
  const bh = bw * 0.66;
  const x = (w - bw) / 2;
  const y = (w - bh) / 2;
  const r = w * 0.045;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + bw, y, x + bw, y + bh, r);
  ctx.arcTo(x + bw, y + bh, x, y + bh, r);
  ctx.arcTo(x, y + bh, x, y, r);
  ctx.arcTo(x, y, x + bw, y, r);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + bw * 0.04, y + bh * 0.08);
  ctx.lineTo(x + bw * 0.5, y + bh * 0.58);
  ctx.lineTo(x + bw * 0.96, y + bh * 0.08);
  ctx.stroke();
});

/** Sets type at the largest size that still fits the canvas. */
function textDraw(text: string, family: string, weight = 600): Draw {
  return (ctx, w, h) => {
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let size = Math.round(w * 0.6);
    for (; size > 8; size -= 2) {
      ctx.font = `${weight} ${size}px ${family}`;
      const metrics = ctx.measureText(text);
      const height =
        (metrics.actualBoundingBoxAscent ?? size * 0.8) +
        (metrics.actualBoundingBoxDescent ?? size * 0.3);
      if (metrics.width <= w * 0.9 && height <= h * 0.78) break;
    }
    ctx.font = `${weight} ${size}px ${family}`;
    ctx.fillText(text, w / 2, h / 2);
  };
}

/* ── Geometric shapes ────────────────────────────────────────────────────── */

type Mask = { land: Uint8Array; w: number; h: number };

/** Reads the land mask PNG into a boolean grid the sampler can test cheaply. */
export async function loadLandMask(src: string): Promise<Mask> {
  const image = new Image();
  image.decoding = 'async';
  image.src = src;
  await image.decode();

  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('2d context unavailable');
  ctx.drawImage(image, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const land = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) land[i] = data[i * 4] > 127 ? 1 : 0;
  return { land, w, h };
}

/** Fibonacci-sphere candidates, kept only where the mask says land. */
function globePoints(count: number, mask: Mask, radius: number) {
  const out = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const random = rng(20260909);
  const candidates = Math.ceil(count / 0.28) + 4000;

  let written = 0;
  for (let i = 0; i < candidates && written < count; i++) {
    const y = 1 - (i / (candidates - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const t = golden * i;
    const x = Math.cos(t) * r;
    const z = Math.sin(t) * r;

    // Longitude is negated so this matches lonLatToVec3's convention exactly —
    // without it the landmasses come out mirrored against the city markers.
    const lat = Math.asin(y) * (180 / Math.PI);
    const lon = -Math.atan2(z, x) * (180 / Math.PI);

    const px = Math.min(mask.w - 1, Math.max(0, Math.floor(((lon + 180) / 360) * mask.w)));
    const py = Math.min(mask.h - 1, Math.max(0, Math.floor(((90 - lat) / 180) * mask.h)));
    if (!mask.land[py * mask.w + px]) continue;

    const lift = radius * (1 + (random() - 0.5) * 0.01);
    out[written * 3] = x * lift;
    out[written * 3 + 1] = y * lift;
    out[written * 3 + 2] = z * lift;
    written++;
  }

  for (let i = written; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const t = golden * i;
    out[i * 3] = Math.cos(t) * r * radius;
    out[i * 3 + 1] = y * radius;
    out[i * 3 + 2] = Math.sin(t) * r * radius;
  }
  return out;
}

/** A clustered constellation — nodes with edge filaments strung between them. */
function graphPoints(count: number, spread: number) {
  const out = new Float32Array(count * 3);
  const random = rng(5150);
  const nodes = 13;
  const centres: Array<[number, number, number]> = [];

  for (let n = 0; n < nodes; n++) {
    const a = (n / nodes) * Math.PI * 2 + random() * 0.4;
    const r = spread * (0.4 + random() * 0.6);
    centres.push([Math.cos(a) * r, (random() - 0.5) * spread * 0.9, Math.sin(a) * r * 0.5]);
  }

  const onEdges = Math.floor(count * 0.44);
  for (let i = 0; i < count; i++) {
    if (i < onEdges) {
      const a = centres[(random() * nodes) | 0];
      const b = centres[(random() * nodes) | 0];
      const t = random();
      const sag = Math.sin(t * Math.PI) * 0.2;
      out[i * 3] = a[0] + (b[0] - a[0]) * t + (random() - 0.5) * 0.04;
      out[i * 3 + 1] = a[1] + (b[1] - a[1]) * t - sag + (random() - 0.5) * 0.04;
      out[i * 3 + 2] = a[2] + (b[2] - a[2]) * t + (random() - 0.5) * 0.04;
    } else {
      const c = centres[(random() * nodes) | 0];
      const g = () => (random() + random() + random() - 1.5) * 0.3;
      out[i * 3] = c[0] + g();
      out[i * 3 + 1] = c[1] + g();
      out[i * 3 + 2] = c[2] + g();
    }
  }
  return out;
}

/* ── Registry ────────────────────────────────────────────────────────────── */

/** Top-down airliner. */
const PLANE_PATH =
  'M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z';

/** Telegram's paper plane. */
const TELEGRAM_PATH =
  'M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.27 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z';

export type ShapeSet = Record<ShapeId, Float32Array>;

export type FieldBuffers = {
  count: number;
  shapes: ShapeSet;
  seed: Float32Array;
  tint: Float32Array;
};

const PALETTE: Array<[number, number, number]> = [
  [0.208, 0.909, 0.608],
  [0.914, 0.953, 0.925],
  [1.0, 0.706, 0.329],
  [0.702, 0.533, 1.0],
  [0.357, 0.658, 1.0],
];

/** Per-shape accent, mixed over each particle's own tint. */
export const SHAPE_COLOR: Record<ShapeId, [number, number, number]> = {
  globe: [0.208, 0.909, 0.608],
  songbad: [1.0, 0.42, 0.32],
  plane: [0.208, 0.909, 0.608],
  telegram: [0.357, 0.658, 1.0],
  graph: [0.702, 0.533, 1.0],
  envelope: [0.208, 0.909, 0.608],
};

/** How much of the field to show for each shape. */
export const SHAPE_PRESENCE: Record<ShapeId, number> = {
  globe: 0.92,
  songbad: 0.72,
  plane: 0.72,
  telegram: 0.72,
  graph: 0.5,
  envelope: 0.7,
};

/** Uniformly rescales a buffer so its widest axis reaches ±EXTENT. */
function normalise(buffer: Float32Array) {
  let peak = 0;
  for (let i = 0; i < buffer.length; i += 3) {
    peak = Math.max(peak, Math.abs(buffer[i]), Math.abs(buffer[i + 1]));
  }
  if (peak === 0) return buffer;
  const k = EXTENT / peak;
  for (let i = 0; i < buffer.length; i++) buffer[i] *= k;
  return buffer;
}

export function buildField(count: number, mask: Mask): FieldBuffers {
  const seed = new Float32Array(count);
  const tint = new Float32Array(count * 3);
  const random = rng(31337);

  for (let i = 0; i < count; i++) {
    seed[i] = random();
    const c = random() < 0.74 ? PALETTE[0] : PALETTE[1 + ((random() * 4) | 0)];
    tint[i * 3] = c[0];
    tint[i * 3 + 1] = c[1];
    tint[i * 3 + 2] = c[2];
  }

  const shapes: ShapeSet = {
    globe: globePoints(count, mask, EXTENT),
    songbad: rasterToPoints(count, 4411, textDraw('সংবাদ', '"Hind Siliguri", sans-serif', 600)),
    plane: rasterToPoints(count, 8822, pathDraw(PLANE_PATH, 24, 0.1)),
    telegram: rasterToPoints(count, 1337, pathDraw(TELEGRAM_PATH, 24, 0.06)),
    graph: normalise(graphPoints(count, EXTENT * 1.15)),
    envelope: rasterToPoints(count, 6060, envelopeDraw),
  };

  return { count, shapes, seed, tint };
}
