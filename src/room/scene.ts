/**
 * Hand-placed parts of the room, in pixels of the 1672×940 painting.
 * What the build script finds by itself (lit windows, stars, the neon sign,
 * the cat) lives in manifest.ts; this is what a person had to point at.
 */

export type Rect = { x: number; y: number; w: number; h: number };

/** Light sources that flicker, and how far their glow reaches. */
export const LAMPS = [
  { id: 'desk', x: 198, y: 222, r: 130, d: 6.1 },
  { id: 'floor', x: 590, y: 612, r: 70, d: 3.7 },
  { id: 'sill', x: 1427, y: 512, r: 88, d: 4.6 },
] as const;

/** The code on the monitor: lines that get typed near the bottom of the screen. */
export const SCREEN: Rect = { x: 4, y: 360, w: 150, h: 40 };
export const CODE_LINES = [
  { indent: 6, len: 64, color: '#7d97ff' },
  { indent: 16, len: 88, color: '#ff7ac8' },
  { indent: 16, len: 46, color: '#56dcff' },
  { indent: 6, len: 30, color: '#c1c8ec' },
];

/** The rim of the coffee cup, where the steam leaves from. */
export const CUP = { x: 49, y: 408 };

/** The big window's sky, below its slanted top frame: where things fly.
 *  A plain rectangle, because an angled clip-path costs a mask every frame. */
export const SKY: Rect = { x: 776, y: 96, w: 436, h: 140 };

/** Warm dust floating in the lamplight: [x, y, drift x, drift y, seconds]. */
export const MOTES: Array<[number, number, number, number, number]> = [
  [1402, 470, 14, -26, 9],
  [1446, 488, -12, -30, 11],
  [1460, 540, 10, -18, 8],
  [1392, 540, -16, -14, 12],
  [566, 590, 12, -22, 10],
  [612, 572, -10, -26, 9],
  [600, 640, 14, -12, 13],
  [224, 260, 12, -20, 10],
  [176, 280, -12, -24, 12],
  [240, 300, 8, -16, 9],
];

export type Hotspot = Rect & { id: string; tip: string; to?: string };

/**
 * Things in the room that do something. They mirror links that already exist
 * in the navigation — the room is a second way in, never the only one.
 */
export const HOTSPOTS: Hotspot[] = [
  { id: 'lamp', x: 158, y: 156, w: 86, h: 94, tip: 'lamp · T' },
  { id: 'monitor', x: 0, y: 258, w: 176, h: 158, tip: 'what I’m building →', to: '/build-log' },
  { id: 'poster', x: 1532, y: 316, w: 126, h: 178, tip: 'how I work →', to: '/about#method' },
  { id: 'cat', x: 1460, y: 504, w: 196, h: 90, tip: '' },
  { id: 'ideas', x: 98, y: 726, w: 120, h: 50, tip: 'Ideas → Lab', to: '/lab' },
  { id: 'projects', x: 96, y: 775, w: 136, h: 44, tip: 'Projects →', to: '/projects' },
  { id: 'skills', x: 92, y: 816, w: 148, h: 42, tip: 'Skills →', to: '/skills' },
  { id: 'better', x: 86, y: 856, w: 170, h: 48, tip: 'A Better Me → About', to: '/about' },
];

/** Things the cat says when woken. Nothing it says is a claim about anyone. */
export const CAT_LINES = ['mrrp?', '…five more minutes', 'purrrr', 'no bugs here. only naps.', 'zZz… oh, hi.'];
