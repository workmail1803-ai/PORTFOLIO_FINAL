import type { ReactNode } from 'react';
import { anchor, asset } from './assets';
import { Character } from './Character';
import type { CharacterName } from './assets';

/**
 * The boy sitting on the top edge of a real card, legs hanging over its
 * face. The artwork's seat line is aligned to the card's top edge from an
 * anchor recorded when the painted card was erased.
 */
export function SitOn({
  children,
  className = '',
  width = '34%',
}: {
  children: ReactNode;
  className?: string;
  width?: string;
}) {
  const [, seat] = anchor('boy-sit', 'seat');
  return (
    <div className={`sit ${className}`} style={{ ['--sit-w' as string]: width, ['--seat' as string]: seat }}>
      {children}
      <div className="sit-boy">
        <Character name="boy-sit" idle="breathe" sizes="(max-width: 760px) 40vw, 300px" />
      </div>
    </div>
  );
}

/**
 * Head and shoulders above an edge, the rest hidden behind it — as if the
 * character were standing behind the card. Rises a little when the card
 * underneath is hovered.
 */
export function Peek({
  name,
  show = 0.4,
  width = '150px',
  className = '',
  flip = false,
}: {
  name: CharacterName;
  show?: number;
  width?: string;
  className?: string;
  flip?: boolean;
}) {
  const a = asset(name);
  return (
    <div
      className={`peek ${className}`}
      // Only the top `show` fraction of the figure fits; the edge below hides the rest.
      style={{ ['--peek-w' as string]: width, aspectRatio: `${a.w} / ${a.h * show}` }}
      aria-hidden="true"
    >
      <Character name={name} idle="sway" react={false} flip={flip} sizes="200px" />
    </div>
  );
}

/** A small handwritten note, purely decorative. */
export function Note({ children, className = '', tilt = -4 }: { children: ReactNode; className?: string; tilt?: number }) {
  return (
    <span className={`note hand ${className}`} style={{ ['--tilt' as string]: `${tilt}deg` }} aria-hidden="true">
      {children}
    </span>
  );
}
