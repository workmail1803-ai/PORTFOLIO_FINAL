/**
 * Image surgery for the character artwork.
 *
 * Four of the generated images have a transparency checkerboard *painted into
 * the pixels* rather than a real alpha channel. The pattern is roughly but not
 * exactly regular (square size drifts between 10 and 18px), so a fixed grid
 * model would misfire. Instead:
 *
 *   1. Flood-fill from the image border across checker-coloured pixels. Anime
 *      line art is dark and closed, so the fill stops at the silhouette.
 *   2. Enclosed pockets (between an arm and the body, say) are not reachable
 *      from the border. A pocket is removed only if it alternates between the
 *      two checker tones at checkerboard frequency — a white sneaker has smooth
 *      shading and never does.
 *   3. Light, neutral anti-aliasing pixels left touching the background are
 *      peeled away, then the edge is feathered by a pixel.
 */
import sharp from 'sharp';

const neutral = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b);

/** Returns RGBA pixels with the painted checkerboard made transparent. */
export async function removeCheckerboard(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const N = W * H;

  // 0 = other, 1 = light checker tone, 2 = dark checker tone,
  // 3 = the anti-aliased blend on a square edge. Leaving that blend
  // unclassified is what strands specks of checkerboard in the background.
  const tone = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    if (neutral(r, g, b) > 10) continue;
    const l = (r + g + b) / 3;
    if (l >= 244) tone[i] = 1;
    else if (l >= 198 && l <= 226) tone[i] = 2;
    else if (l > 226) tone[i] = 3;
  }

  const bg = new Uint8Array(N);
  const queue = new Int32Array(N);

  // 1. flood fill from the border
  let head = 0;
  let tail = 0;
  const seed = i => {
    if (tone[i] && !bg[i]) {
      bg[i] = 1;
      queue[tail++] = i;
    }
  };
  for (let x = 0; x < W; x++) {
    seed(x);
    seed((H - 1) * W + x);
  }
  for (let y = 0; y < H; y++) {
    seed(y * W);
    seed(y * W + W - 1);
  }
  while (head < tail) {
    const i = queue[head++];
    const x = i % W;
    if (x > 0) seed(i - 1);
    if (x < W - 1) seed(i + 1);
    if (i >= W) seed(i - W);
    if (i < N - W) seed(i + W);
  }

  // 2. enclosed pockets that alternate like a checkerboard
  const seen = new Uint8Array(N);
  let pockets = 0;
  for (let start = 0; start < N; start++) {
    if (!tone[start] || bg[start] || seen[start]) continue;
    const members = [];
    head = 0;
    tail = 0;
    queue[tail++] = start;
    seen[start] = 1;
    while (head < tail) {
      const i = queue[head++];
      members.push(i);
      const x = i % W;
      const next = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i < N - W ? i + W : -1];
      for (const j of next) {
        if (j >= 0 && tone[j] && !bg[j] && !seen[j]) {
          seen[j] = 1;
          queue[tail++] = j;
        }
      }
    }
    if (members.length < 40) continue;

    // Alternation is measured between the two *pure* tones only, skipping
    // blend pixels, so noisy shading that hovers around a threshold does not
    // masquerade as a checkerboard.
    let light = 0;
    let dark = 0;
    let transitions = 0;
    for (const i of members) {
      if (tone[i] === 1) light++;
      else if (tone[i] === 2) dark++;
      else continue;
      const x = i % W;
      for (let k = 1; k <= 3 && x + k < W; k++) {
        const t = tone[i + k];
        if (t === 3) continue;
        if (t && t !== tone[i]) transitions++;
        break;
      }
    }
    const pure = light + dark;
    if (!pure) continue;
    const share = light / pure;
    const density = transitions / members.length;
    if (share > 0.15 && share < 0.85 && density > 0.03) {
      for (const i of members) bg[i] = 1;
      pockets++;
    }
  }

  // Floating islands: anything not attached to the figure is residue.
  const label = new Int32Array(N).fill(-1);
  const sizes = [];
  for (let start = 0; start < N; start++) {
    if (bg[start] || label[start] !== -1) continue;
    const id = sizes.length;
    head = 0;
    tail = 0;
    queue[tail++] = start;
    label[start] = id;
    while (head < tail) {
      const i = queue[head++];
      const x = i % W;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const j = i + dy * W + dx;
          if (nx < 0 || nx >= W || j < 0 || j >= N) continue;
          if (bg[j] || label[j] !== -1) continue;
          label[j] = id;
          queue[tail++] = j;
        }
      }
    }
    sizes.push(tail);
  }
  const largest = Math.max(...sizes);
  let islands = 0;
  for (let i = 0; i < N; i++) {
    if (label[i] >= 0 && sizes[label[i]] < largest * 0.004) {
      bg[i] = 1;
      islands++;
    }
  }

  // 3. peel light neutral anti-aliasing off the silhouette
  for (let pass = 0; pass < 2; pass++) {
    const peel = [];
    for (let i = 0; i < N; i++) {
      if (bg[i]) continue;
      const r = data[i * 3];
      const g = data[i * 3 + 1];
      const b = data[i * 3 + 2];
      if (neutral(r, g, b) > 14 || (r + g + b) / 3 < 150) continue;
      const x = i % W;
      if ((x > 0 && bg[i - 1]) || (x < W - 1 && bg[i + 1]) || (i >= W && bg[i - W]) || (i < N - W && bg[i + W])) {
        peel.push(i);
      }
    }
    for (const i of peel) bg[i] = 1;
  }

  const rgba = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    rgba[i * 4] = data[i * 3];
    rgba[i * 4 + 1] = data[i * 3 + 1];
    rgba[i * 4 + 2] = data[i * 3 + 2];
    if (bg[i]) {
      rgba[i * 4 + 3] = 0;
      continue;
    }
    // feather: a pixel touching the background keeps a little translucency
    const x = i % W;
    const touches =
      (x > 0 && bg[i - 1]) || (x < W - 1 && bg[i + 1]) || (i >= W && bg[i - W]) || (i < N - W && bg[i + W]);
    rgba[i * 4 + 3] = touches ? 190 : 255;
  }

  return { rgba, width: W, height: H, pockets, islands };
}

/**
 * Rasterises shapes into a single-channel 0/255 mask. Each entry is either a
 * polygon (array of [x, y]) or a raw SVG element string (for rounded rects).
 */
export async function polygonMask(width, height, polygons) {
  const shapes = polygons
    .map(shape =>
      typeof shape === 'string'
        ? shape
        : `<polygon points="${shape.map(p => p.join(',')).join(' ')}" fill="#fff"/>`,
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${shapes}</svg>`;
  const { data } = await sharp(Buffer.from(svg)).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  return data;
}

export async function loadRGBA(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { rgba: data, width: info.width, height: info.height };
}

export const isSkin = (r, g, b) => r > 185 && r > g + 12 && g > b - 4 && b < 215 && r - b > 30;
export const isBlueish = (r, g, b) => b > r + 18 && b > g + 6;
