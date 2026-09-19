import type { ReactNode } from 'react';
import { Note } from '../characters/Poses';

/**
 * Every inner page opens the same way — copy on the left, a character in the
 * room on the right — so moving between pages feels like moving between
 * scenes of one place rather than between templates.
 */
export function PageHero({
  eyebrow,
  title,
  lede,
  actions,
  character,
  note,
  id,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  character?: ReactNode;
  note?: ReactNode;
  id: string;
}) {
  return (
    <section className="page-hero wrap" aria-labelledby={id}>
      <div className="page-hero-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id={id} className="h-1">
          {title}
        </h1>
        {lede && <p className="lede">{lede}</p>}
        {actions && <div className="btn-row">{actions}</div>}
      </div>
      {character && (
        <div className="page-hero-stage">
          <div className="hero-window" aria-hidden="true" />
          {note && (
            <Note className="page-hero-note" tilt={5}>
              {note}
            </Note>
          )}
          {character}
        </div>
      )}
    </section>
  );
}
