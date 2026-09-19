import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { CAT, LIGHTS, NEON, ROOM, ROOM_WIDTHS, STARS } from './manifest';
import { CAT_LINES, CODE_LINES, CUP, HOTSPOTS, LAMPS, MOTES, SCREEN, SKY, type Rect } from './scene';
import { navigate } from '../router/router';
import { CORNERS, type CornerId } from './corners';
import { useCamera } from './useCamera';

/*
 * The room behind every page: one painting, brought to life by the things in
 * it rather than by effects laid over it. Windows in the city switch off and
 * on, the painted stars twinkle, the neon sign buzzes, the lamps flicker, the
 * cat breathes, somebody is typing on the monitor, and now and then a plane
 * crosses the big window.
 *
 * Every animation is transform or opacity on a small element, so it runs on
 * the compositor and costs nothing while the page scrolls. Nothing here moves
 * with scroll.
 */

const pct = (v: number, of: number) => `${(v / of) * 100}%`;
const at = (x: number, y: number): CSSProperties => ({ left: pct(x, ROOM.w), top: pct(y, ROOM.h) });
const box = ({ x, y, w, h }: Rect): CSSProperties => ({ ...at(x, y), width: pct(w, ROOM.w), height: pct(h, ROOM.h) });
const vars = (v: Record<string, string | number>) => v as CSSProperties;
const srcSet = ROOM_WIDTHS.map(w => `/room/room-${w}.webp ${w}w`).join(', ');
const sizes = `(max-aspect-ratio: ${ROOM.w}/${ROOM.h}) ${((ROOM.w / ROOM.h) * 100).toFixed(1)}vh, 100vw`;
/** Deals items into n interleaved groups, so each group is spread across the whole city. */
const groups = <T,>(items: T[], n: number) => Array.from({ length: n }, (_, g) => items.filter((_, i) => i % n === g));

export function Room({ lamp, onLamp, corner }: { lamp: boolean; onLamp: () => void; corner: CornerId }) {
  const [ready, setReady] = useState(false);
  const camera = useCamera(corner);
  // Corner stills are fetched once the room has loaded, or at once if the page opens on one.
  const [warm, setWarm] = useState(false);
  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => setWarm(true), 1200);
    return () => window.clearTimeout(timer);
  }, [ready]);
  const img = useRef<HTMLImageElement>(null);
  const [cat, setCat] = useState<string | null>(null);
  const catLine = useRef(0);
  const catTimer = useRef(0);
  const lampWas = useRef(lamp);

  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth) setReady(true);
  }, []);

  const say = (line: string) => {
    setCat(line);
    window.clearTimeout(catTimer.current);
    catTimer.current = window.setTimeout(() => setCat(null), 2600);
  };

  // The cat has opinions about the lamp.
  useEffect(() => {
    if (lamp && !lampWas.current) say('too bright…');
    lampWas.current = lamp;
  }, [lamp]);

  useEffect(() => () => window.clearTimeout(catTimer.current), []);

  const act = (id: string, to?: string) => {
    if (to) return navigate(to);
    if (id === 'lamp') return onLamp();
    if (id === 'cat') {
      say(CAT_LINES[catLine.current % CAT_LINES.length]);
      catLine.current += 1;
    }
  };

  return (
    <div className={`room${camera.at !== 'room' || camera.moving ? ' is-away' : ''}`} aria-hidden="true">
      <div className="scene" data-ready={ready || undefined} style={{ backgroundImage: `url(${ROOM.lqip})` }}>
        <img
          ref={img}
          className="scene-img"
          src="/room/room-1280.webp"
          srcSet={srcSet}
          sizes={sizes}
          alt=""
          width={ROOM.w}
          height={ROOM.h}
          decoding="async"
          draggable={false}
          onLoad={() => setReady(true)}
        />

        <div className="scene-life">
          {/* Stars and windows twinkle in a few interleaved groups rather than one
              animation each: a handful of compositor layers instead of eighty,
              which is the difference that shows on a cheap phone. */}
          {groups(STARS, 3).map((group, g) => (
            <div key={`sg${g}`} className={`twinkle stars${g ? ' is-minor' : ''}`} style={vars({ '--d': `${3.1 + g * 1.3}s`, '--t': `${-g * 1.1}s` })}>
              {group.map((s, i) => (
                <i key={i} className="star" style={{ ...at(s.x, s.y), ...vars({ '--s': s.s }) }} />
              ))}
            </div>
          ))}

          <div className="sky" style={box(SKY)}>
            <i className="shoot" />
            <i className="shoot is-late" />
            <span className="plane">
              <i />
            </span>
          </div>

          {groups(
            LIGHTS.filter(l => l.k === 'f'),
            4,
          ).map((group, g) => (
            <div key={`lg${g}`} className={`twinkle flares${g % 2 ? ' is-minor' : ''}`} style={vars({ '--d': `${3.4 + g * 0.9}s`, '--t': `${-g * 1.7}s` })}>
              {group.map((l, i) => (
                <i key={i} className="lit" style={{ ...at(l.x, l.y), ...vars({ '--s': l.s, '--c': l.c }) }} />
              ))}
            </div>
          ))}

          {groups(
            LIGHTS.filter(l => l.k === 'o'),
            3,
          ).map((group, g) => (
            <div key={`og${g}`} className="twinkle unlits" style={vars({ '--d': `${11 + g * 4}s`, '--t': `${-g * 5}s` })}>
              {group.map((l, i) => (
                <i key={i} className="unlit" style={{ ...box(l), ...vars({ '--c': l.c }) }} />
              ))}
            </div>
          ))}

          <img className="neon-off" src="/room/neon-off.webp" alt="" style={box(NEON)} draggable={false} />
          {/* The glow buzzes inside a wrapper that goes dark whenever the sign does. */}
          <div className="neon-glow" style={box(NEON)}>
            <img className="neon-on" src="/room/neon-on.webp" alt="" draggable={false} />
          </div>

          {LAMPS.map(l => (
            <i
              key={l.id}
              className={`glow glow-${l.id}`}
              style={{ ...at(l.x, l.y), ...vars({ '--r': l.r, '--d': `${l.d}s` }) }}
            />
          ))}

          <div className="screen" style={box(SCREEN)}>
            {CODE_LINES.map((c, i) => (
              <i key={i} style={vars({ '--in': c.indent, '--len': c.len, '--c': c.color, '--n': i })} />
            ))}
          </div>

          <div className="steam" style={at(CUP.x, CUP.y)}>
            <i />
            <i />
            <i />
          </div>

          <img className="cat" src="/room/cat.webp" alt="" style={box(CAT)} draggable={false} />
          <div className={`zzz hand${cat ? ' is-awake' : ''}`} style={at(1486, 516)}>
            <i>z</i>
            <i>z</i>
            <i>Z</i>
          </div>

          {MOTES.map(([x, y, mx, my, d], i) => (
            <i
              key={`m${i}`}
              className="mote"
              style={{ ...at(x, y), ...vars({ '--mx': mx, '--my': my, '--d': `${d}s`, '--t': `${-i * 1.7}s` }) }}
            />
          ))}
        </div>

        {CORNERS.map(c =>
          warm || camera.at === c.id ? (
            <img
              key={c.id}
              className={`corner-still${camera.at === c.id ? ' is-on' : ''}`}
              src={`/room/corner-${c.id}-1280.webp`}
              srcSet={`/room/corner-${c.id}-1280.webp 1280w, /room/corner-${c.id}-1920.webp 1920w`}
              sizes={sizes}
              alt=""
              width={ROOM.w}
              height={ROOM.h}
              decoding="async"
              draggable={false}
            />
          ) : null,
        )}
        {camera.videos.map((ref, i) => (
          <video
            key={i}
            ref={ref}
            className={`scene-video${camera.showing === i ? ' is-on' : ''}`}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            tabIndex={-1}
          />
        ))}
      </div>

      <div className="room-scrim" />
      <div className="room-warm" />

      {/* The same geometry again, above the scrim, for the parts you can touch. */}
      <div className="scene scene-hot">
        {HOTSPOTS.map(h => (
          <button
            key={h.id}
            type="button"
            tabIndex={-1}
            className={`hot hot-${h.id}`}
            style={box(h)}
            onClick={() => act(h.id, h.to)}
          >
            {h.tip && <span className="hot-tip hand">{h.id === 'lamp' ? (lamp ? 'lamp off · T' : 'lamp on · T') : h.tip}</span>}
          </button>
        ))}
        <span className={`cat-bubble hand${cat ? ' is-on' : ''}`} style={at(1470, 500)}>
          {cat}
        </span>
      </div>
    </div>
  );
}
