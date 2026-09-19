import { CHARACTER_WIDTHS, characterAssets } from './manifest';

export type CharacterName =
  | 'boy-tap'
  | 'girl-press'
  | 'boy-sit'
  | 'boy-present'
  | 'boy-point'
  | 'girl-peace'
  | 'boy-coffee'
  | 'girl-laptop'
  | 'girl-point'
  | 'girl-think'
  | 'boy-code'
  | 'boy-sleep';

type Asset = { w: number; h: number; anchors: Record<string, readonly [number, number]> };

const assets = characterAssets as unknown as Record<string, Asset>;

export function asset(name: string): Asset {
  return assets[name];
}

/** `srcset` for one exported layer, e.g. `boy-tap-body`. */
export function srcSet(file: string) {
  return CHARACTER_WIDTHS.map(w => `/characters/${file}-${w}.webp ${w}w`).join(', ');
}

export function src(file: string) {
  return `/characters/${file}-${CHARACTER_WIDTHS[CHARACTER_WIDTHS.length - 1]}.webp`;
}

/** Height as a fraction of width. */
export function ratio(name: string) {
  const a = asset(name);
  return a.h / a.w;
}

export function anchor(name: string, key: string): [number, number] {
  const point = asset(name).anchors[key];
  if (!point) throw new Error(`character ${name} has no anchor "${key}"`);
  return [point[0], point[1]];
}
