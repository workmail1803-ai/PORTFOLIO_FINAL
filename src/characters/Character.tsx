import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { asset, srcSet, src, type CharacterName } from './assets';
import { finePointer, onPointer, prefersReduced } from '../lib/pointer';

export type Idle = 'breathe' | 'sway' | 'none';

type Props = {
  name: CharacterName;
  /** Which exported layer to show; defaults to the character name. */
  file?: string;
  /**
   * Characters are decorative unless they carry meaning. An empty alt already
   * hides the image from assistive tech — the wrapper is deliberately not
   * aria-hidden, because real controls can sit on a character (a card on a palm).
   */
  alt?: string;
  className?: string;
  /** Any CSS length. The height follows from the artwork's aspect ratio. */
  width?: string;
  idle?: Idle;
  /** Lean slightly toward the cursor while on screen. */
  react?: boolean;
  priority?: boolean;
  flip?: boolean;
  sizes?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/**
 * Tracks the pointer relative to an element and writes it to `--lx` / `--ly`
 * in the range −1…1. Idle when off screen, so a page full of characters costs
 * nothing until one is visible.
 */
export function useLean(ref: React.RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled || !finePointer() || prefersReduced()) return;

    let visible = false;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(node);

    const stop = onPointer((x, y) => {
      if (!visible) return;
      const box = node.getBoundingClientRect();
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      const lx = Math.max(-1, Math.min(1, (x - cx) / (window.innerWidth * 0.5)));
      const ly = Math.max(-1, Math.min(1, (y - cy) / (window.innerHeight * 0.5)));
      node.style.setProperty('--lx', lx.toFixed(3));
      node.style.setProperty('--ly', ly.toFixed(3));
    });

    return () => {
      observer.disconnect();
      stop();
    };
  }, [ref, enabled]);
}

export function Character({
  name,
  file,
  alt = '',
  className = '',
  width,
  idle = 'breathe',
  react = true,
  priority = false,
  flip = false,
  sizes = '(max-width: 760px) 70vw, 34vw',
  style,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const a = asset(name);
  useLean(ref, react);

  return (
    <div
      ref={ref}
      className={`char char-${idle} ${flip ? 'is-flipped' : ''} ${className}`.trim()}
      style={{ ...(width ? { ['--char-w' as string]: width } : null), aspectRatio: `${a.w} / ${a.h}`, ...style }}
    >
      <div className="char-lean">
        <div className="char-idle">
          <img
            src={src(file ?? name)}
            srcSet={srcSet(file ?? name)}
            sizes={sizes}
            alt={alt}
            width={a.w}
            height={a.h}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            draggable={false}
          />
          {children}
        </div>
      </div>
    </div>
  );
}
