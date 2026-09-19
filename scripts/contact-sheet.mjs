/** Builds labelled contact sheets of the raw artwork so it can be reviewed at a glance. */
import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';

const SRC = 'design-src';
const OUT = 'artifacts/sheets';
await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter(f => f.endsWith('.png')).sort();
const groups = [
  ['cutouts', [2, 7, 8, 9, 10, 11, 12, 13, 14]],
  ['scenes-a', [1, 3, 4, 5, 6, 15]],
  ['pages-a', [16, 17, 18, 19, 20, 21]],
  ['pages-b', [22, 23, 24, 25, 26, 27]],
];

const CELL_W = 420;
const CELL_H = 520;
const COLS = 3;

for (const [name, ids] of groups) {
  const rows = Math.ceil(ids.length / COLS);
  const tiles = [];
  for (const [i, id] of ids.entries()) {
    const file = files.find(f => f.endsWith(`_${String(id).padStart(2, '0')}.png`));
    const img = await sharp(`${SRC}/${file}`)
      .resize(CELL_W - 20, CELL_H - 60, { fit: 'contain', background: { r: 40, g: 44, b: 60, alpha: 1 } })
      .flatten({ background: { r: 40, g: 44, b: 60 } })
      .toBuffer();
    const label = Buffer.from(
      `<svg width="${CELL_W}" height="40"><rect width="100%" height="100%" fill="#111"/>` +
        `<text x="12" y="27" font-family="monospace" font-size="20" fill="#7CF">#${id}</text></svg>`,
    );
    const x = (i % COLS) * CELL_W;
    const y = Math.floor(i / COLS) * CELL_H;
    tiles.push({ input: label, left: x, top: y });
    tiles.push({ input: img, left: x + 10, top: y + 48 });
  }
  await sharp({
    create: { width: COLS * CELL_W, height: rows * CELL_H, channels: 3, background: '#0b0d14' },
  })
    .composite(tiles)
    .jpeg({ quality: 82 })
    .toFile(`${OUT}/${name}.jpg`);
  console.log(`${OUT}/${name}.jpg`);
}
