/** Overlays a labelled coordinate grid on a source image, to pick crop/erase regions. */
import sharp from 'sharp';

const [, , id, step = '100'] = process.argv;
// Either an artwork number or a path to any image.
const file = /^\d+$/.test(id) ? `design-src/portfolio_asset_${String(id).padStart(2, '0')}.png` : id;
const tag = /^\d+$/.test(id) ? id : id.replace(/^.*[\/]/, '').replace(/\.\w+$/, '');
const { width, height } = await sharp(file).metadata();
const s = Number(step);

let lines = '';
for (let x = 0; x <= width; x += s) {
  lines += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#ff2bd6" stroke-width="1.5" opacity="0.75"/>`;
  lines += `<text x="${x + 3}" y="16" font-size="15" font-family="monospace" fill="#ff2bd6">${x}</text>`;
}
for (let y = 0; y <= height; y += s) {
  lines += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#2bf0ff" stroke-width="1.5" opacity="0.75"/>`;
  lines += `<text x="3" y="${y - 3}" font-size="15" font-family="monospace" fill="#2bf0ff">${y}</text>`;
}
const overlay = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${lines}</svg>`);

await sharp(file)
  .flatten({ background: '#3a3f55' })
  .composite([{ input: overlay }])
  .jpeg({ quality: 80 })
  .toFile(`artifacts/grid-${tag}.jpg`);
console.log(`artifacts/grid-${tag}.jpg (${width}x${height})`);
