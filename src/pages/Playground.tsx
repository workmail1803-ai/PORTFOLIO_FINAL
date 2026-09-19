import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Shuffle } from 'lucide-react';
import { PressCta } from '../characters/PressCta';
import { Note } from '../characters/Poses';
import type { ShapeId } from '../gl/shapes';
import { profile } from '../data/profile';
import { useReducedMotion, useTitle } from '../lib/hooks';

const Backdrop = lazy(() => import('../gl/Backdrop').then(m => ({ default: m.Backdrop })));

const SHAPES: Array<[ShapeId, string, string]> = [
  ['globe', 'Globe', 'Real coastline data, opening on Dhaka, with arcs to where NextUp places students.'],
  ['songbad', 'সংবাদ', '“News” in Bangla, rasterised from live type. For All Bangla Paper.'],
  ['plane', 'Plane', 'For NextUp Mentor, a study-abroad platform.'],
  ['telegram', 'Telegram', 'For PixelSub, a shop that lives inside a Telegram chat.'],
  ['graph', 'Constellation', 'Nodes and edges: how the method section thinks.'],
  ['envelope', 'Envelope', 'The inbox, for the contact page.'],
];

export function Playground() {
  useTitle(`Playground · ${profile.name}`, 'An interactive particle field: a globe, Bangla type and emblems, morphing on command.');
  const reduced = useReducedMotion();
  const [current, setCurrent] = useState<ShapeId>('globe');
  const [ready, setReady] = useState(false);
  // Stable identity: Backdrop rebuilds the whole field if this changes.
  const onReady = useCallback(() => setReady(true), []);

  // The field reads these refs every frame, so switching shape never re-renders the canvas.
  const shape = useRef<ShapeId>('globe');
  const slot = useRef<HTMLDivElement>(null);
  const active = useRef(true);

  const choose = (next: ShapeId) => {
    shape.current = next;
    setCurrent(next);
  };
  const cycle = () => {
    const index = SHAPES.findIndex(([id]) => id === shape.current);
    choose(SHAPES[(index + 1) % SHAPES.length][0]);
  };
  const detail = SHAPES.find(([id]) => id === current)!;

  return (
    <section className="wrap playground" aria-labelledby="play-title">
      <div className="play-head">
        <p className="eyebrow">Playground</p>
        <h1 id="play-title" className="h-2">
          The particle field, <span className="grad">in your hands.</span>
        </h1>
        <p className="lede">
          The previous version of this site was built around this: up to 26,000 points that morph between shapes that
          mean something. The count adapts to your device, so a budget phone gets a lighter field than a desktop.
        </p>
      </div>

      <div className="play-grid">
        <div className="play-stage" ref={slot} aria-label={`Particle field showing: ${detail[1]}`} role="img">
          {!ready && <span className="play-loading mono">Assembling the field…</span>}
          <Note className="play-note" tilt={-4}>
            move your cursor over the globe ↘
          </Note>
        </div>

        <div className="play-controls glass">
          <p className="eyebrow">Shape</p>
          <div className="play-chips" role="group" aria-label="Choose a shape">
            {SHAPES.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`filter-chip ${id === 'songbad' ? 'bn' : ''}`}
                aria-pressed={current === id}
                onClick={() => choose(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="muted play-detail" aria-live="polite">
            {detail[2]}
          </p>
          <PressCta onPress={cycle} icon={<Shuffle size={20} aria-hidden="true" />} width="min(360px, 100%)" label="Next shape">
            Next shape
          </PressCta>
        </div>
      </div>

      {createPortal(
        <Suspense fallback={null}>
          <Backdrop
            shape={shape}
            slotEl={slot}
            prevSlotEl={slot}
            active={active}
            light={false}
            reduced={reduced}
            onReady={onReady}
          />
        </Suspense>,
        document.body,
      )}
    </section>
  );
}
