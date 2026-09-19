import { useRef, useState, type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '../router/router';
import { anchor, asset, src, srcSet } from './assets';
import { burst, wait } from '../lib/burst';

type State = 'idle' | 'hover' | 'press';

type Props = {
  children: ReactNode;
  icon?: ReactNode;
  /** Navigate on press… */
  to?: string;
  /** …or run an action (the playground uses this). */
  onPress?: () => void;
  width?: string;
  label?: string;
};

/**
 * The girl leans over a pill button with her fingertip resting on it.
 *
 * Her forearms were drawn *behind* the original painted button, so the
 * artwork has a pill-shaped hole there. The real button fills that hole
 * exactly — positioned from anchors recorded when the art was processed —
 * and only her fingertip is drawn in front of it.
 */
export function PressCta({ children, icon, to, onPress, width = 'min(460px, 100%)', label }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>('idle');
  const a = asset('girl-press');
  const [tlx, tly] = anchor('girl-press', 'buttonTopLeft');
  const [brx, bry] = anchor('girl-press', 'buttonBottomRight');
  const [fx, fy] = anchor('girl-press', 'fingertip');

  const press = async () => {
    setState('press');
    const node = host.current;
    if (node) burst(node, fx * node.offsetWidth, fy * node.offsetHeight + 8, { sparks: 10, colour: 'var(--pink)' });
    await wait(360);
  };

  const events = {
    onPointerEnter: () => setState(s => (s === 'press' ? s : 'hover')),
    onPointerLeave: () => setState(s => (s === 'press' ? s : 'idle')),
    onFocus: () => setState(s => (s === 'press' ? s : 'hover')),
    onBlur: () => setState(s => (s === 'press' ? s : 'idle')),
  };

  const style = {
    left: `${tlx * 100}%`,
    top: `calc(${tly * 100}% - 10px)`,
    width: `${(brx - tlx) * 100}%`,
    height: `calc(${(bry - tly) * 100}% + 10px)`,
  };

  const content = (
    <>
      {icon}
      <span>{children}</span>
      <ArrowRight size={20} aria-hidden="true" />
    </>
  );

  return (
    <div
      className="press"
      data-state={state}
      ref={host}
      style={{ width, aspectRatio: `${a.w} / ${a.h}` }}
    >
      {to ? (
        <Link to={to} before={press} className="press-button" style={style} aria-label={label} {...events}>
          {content}
        </Link>
      ) : (
        <button
          type="button"
          className="press-button"
          style={style}
          aria-label={label}
          {...events}
          onClick={async () => {
            await press();
            onPress?.();
            setState('hover');
          }}
        >
          {content}
        </button>
      )}
      <img
        className="press-girl"
        src={src('girl-press')}
        srcSet={srcSet('girl-press')}
        sizes="(max-width: 760px) 90vw, 460px"
        alt=""
        aria-hidden="true"
        width={a.w}
        height={a.h}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </div>
  );
}
