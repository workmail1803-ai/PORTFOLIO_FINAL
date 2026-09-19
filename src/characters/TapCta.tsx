import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '../router/router';
import { anchor, asset, src, srcSet } from './assets';
import { burst, wait } from '../lib/burst';
import { distanceToRect, finePointer, onPointer } from '../lib/pointer';
import { useLean } from './Character';

type State = 'idle' | 'near' | 'hover' | 'press';

/**
 * The boy crouches beside a real link and presses it.
 *
 *   idle  → his finger hovers just above the button, bobbing slightly
 *   near  → the cursor comes within range; he leans in, finger lowers
 *   hover → the finger rests on the button, which glows
 *   press → the hand rotates down from the elbow, the button compresses,
 *           a ripple and sparks leave the fingertip, then the page changes
 *
 * The hand is its own image layer, cut at the sleeve, rotating about a pivot
 * inside the cuff — so the finger moves while the body stays put, which is
 * what makes it read as a press rather than the whole picture bouncing.
 * The character never receives pointer events; the link underneath does.
 */
export function TapCta({ to, children, icon }: { to: string; children: ReactNode; icon?: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const boy = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLAnchorElement>(null);
  const tip = useRef<[number, number]>([0, 0]);
  const [state, setState] = useState<State>('idle');
  const hovering = useRef(false);

  const a = asset('boy-tap');
  const [fx, fy] = anchor('boy-tap', 'fingertip');
  const [px, py] = anchor('boy-tap', 'pivot');

  useLean(boy);

  // Put the button under the fingertip. Layout values are read from offsets,
  // not getBoundingClientRect, so the breathing animation cannot skew them.
  useLayoutEffect(() => {
    const place = () => {
      const b = button.current;
      const figure = boy.current;
      if (!b || !figure) return;
      const tipX = figure.offsetLeft + fx * figure.offsetWidth;
      const tipY = figure.offsetTop + fy * figure.offsetHeight;
      tip.current = [tipX, tipY];
      // Aim the finger at the arrow end, but never push the button out of the
      // stage — on a phone the finger then simply lands nearer its middle.
      const stageWidth = stage.current?.clientWidth ?? Infinity;
      const left = Math.min(Math.max(0, tipX - b.offsetWidth * 0.72), stageWidth - b.offsetWidth);
      b.style.left = `${Math.round(left)}px`;
      b.style.top = `${Math.round(tipY - 5)}px`;
    };
    place();
    const observer = new ResizeObserver(place);
    if (stage.current) observer.observe(stage.current);
    if (button.current) observer.observe(button.current);
    return () => observer.disconnect();
  }, [fx, fy]);

  // He notices the cursor before it arrives.
  useEffect(() => {
    if (!finePointer()) return;
    return onPointer((x, y) => {
      const b = button.current;
      if (!b || hovering.current) return;
      const near = distanceToRect(x, y, b.getBoundingClientRect()) < 230;
      setState(current => (current === 'press' ? current : near ? 'near' : 'idle'));
    });
  }, []);

  const enter = () => {
    hovering.current = true;
    setState(current => (current === 'press' ? current : 'hover'));
  };
  const leave = () => {
    hovering.current = false;
    setState(current => (current === 'press' ? current : 'idle'));
  };

  const press = async () => {
    setState('press');
    const host = stage.current;
    if (host) burst(host, tip.current[0] - 2, tip.current[1] + 6, { sparks: 10 });
    await wait(380);
  };

  return (
    <div className="tap" ref={stage} data-state={state}>
      <div
        ref={boy}
        className="tap-boy"
        style={{ aspectRatio: `${a.w} / ${a.h}` }}
        aria-hidden="true"
      >
        <div className="char-lean tap-lean">
          <div className="tap-body">
            <img
              src={src('boy-tap-body')}
              srcSet={srcSet('boy-tap-body')}
              sizes="(max-width: 760px) 62vw, 30vw"
              alt=""
              width={a.w}
              height={a.h}
              fetchPriority="high"
              decoding="async"
              draggable={false}
            />
            <img
              className="tap-hand"
              src={src('boy-tap-hand')}
              srcSet={srcSet('boy-tap-hand')}
              sizes="(max-width: 760px) 62vw, 30vw"
              alt=""
              width={a.w}
              height={a.h}
              decoding="async"
              draggable={false}
              style={{ transformOrigin: `${px * 100}% ${py * 100}%` }}
            />
          </div>
        </div>
      </div>

      <Link
        ref={button}
        to={to}
        before={press}
        className="btn btn-primary btn-lg tap-button"
        onPointerEnter={enter}
        onPointerLeave={leave}
        onFocus={enter}
        onBlur={leave}
      >
        {icon}
        <span>{children}</span>
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </div>
  );
}
