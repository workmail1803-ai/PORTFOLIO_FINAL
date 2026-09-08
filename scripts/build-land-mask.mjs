/**
 * Rasterises Natural Earth land polygons into an equirectangular mask.
 * The browser samples this PNG to place globe particles on land only,
 * so the hero globe is real geography rather than a decorative sphere.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { geoPath, geoEquirectangular } from 'd3-geo';
import { feature } from 'topojson-client';
import sharp from 'sharp';

const WIDTH = 2048;
const HEIGHT = 1024;

const topology = JSON.parse(
  await readFile(new URL('../node_modules/world-atlas/land-50m.json', import.meta.url), 'utf8'),
);
const land = feature(topology, topology.objects.land);

const projection = geoEquirectangular()
  .scale(WIDTH / (2 * Math.PI))
  .translate([WIDTH / 2, HEIGHT / 2]);
const path = geoPath(projection);
const d = path(land);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#000"/>
  <path d="${d}" fill="#fff"/>
</svg>`;

await mkdir('public/images', { recursive: true });
await sharp(Buffer.from(svg)).png({ colors: 2, compressionLevel: 9 }).toFile('public/images/land-mask.png');

const { size } = await sharp('public/images/land-mask.png').metadata();
console.log(`land-mask.png — ${WIDTH}x${HEIGHT}, ${(size / 1024).toFixed(1)} KB`);

