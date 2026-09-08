import { useEffect, useRef, type ElementType, type ReactNode } from 'react';
import { useReveal } from '../lib/hooks';

/** Fades and lifts its children the first time they scroll into view. */
export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
}) {
  const [ref, shown] = useReveal<HTMLDivElement>();
  const Element = Tag as 'div';
  return (
    <Element
      ref={ref}
      className={`reveal ${shown ? 'is-in' : ''} ${className}`.trim()}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Element>
  );
}

/** Splits a headline into lines that clip upward in sequence. */
export function SplitLines({
  lines,
  className = '',
  delay = 0,
}: {
  lines: ReactNode[];
  className?: string;
  delay?: number;
}) {
  const [ref, shown] = useReveal<HTMLDivElement>(0.12);
  return (
    <div ref={ref} className={`split ${shown ? 'is-in' : ''} ${className}`.trim()}>
      {lines.map((line, index) => (
        <span className="split-line" key={index}>
          <span className="split-inner" style={{ transitionDelay: `${delay + index * 90}ms` }}>
            {line}
          </span>
        </span>
      ))}
    </div>
  );
}

/**
 * Counts to a value once visible. Non-numeric values render as-is.
 *
 * The tween writes straight to the DOM node. Driving it through state means a
 * React render on every animation frame, and with a dozen counters coming into
 * view at once that alone is enough to make scrolling stutter.
 */
export function Counter({ value, duration = 1400 }: { value: string; duration?: number }) {
  const [ref, shown] = useReveal<HTMLSpanElement>(0.4);
  const done = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!shown || done.current || !node) return;

    const match = value.match(/^([^\d-]*)(-?[\d.,]+)(.*)$/);
    if (!match) return;
    const [, prefix, rawNumber, suffix] = match;
    const decimals = (rawNumber.split('.')[1] ?? '').length;
    const numeric = Number(rawNumber.replace(/,/g, ''));
    if (!Number.isFinite(numeric)) return;

    done.current = true;
    const start = performance.now();
    let frame = 0;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const current = numeric * (1 - Math.pow(1 - t, 3));
      const formatted =
        decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString('en-US');
      node.textContent = `${prefix}${formatted}${suffix}`;
      if (t < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [shown, value, duration, ref]);

  return (
    <span ref={ref} className="counter">
      {value}
    </span>
  );
}

/** A continuous band of text. Duplicated once so the loop is seamless. */
export function Marquee({ items, speed = 40 }: { items: string[]; speed?: number }) {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track" style={{ animationDuration: `${speed}s` }}>
        {[0, 1].map(copy => (
          <div className="marquee-run" key={copy}>
            {items.map((item, index) => (
              <span key={`${copy}-${index}`}>
                {item}
                <i className="marquee-dot" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Pulls a button gently toward the pointer. */
export function Magnetic({
  children,
  strength = 0.32,
  className = '',
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!matchMedia('(pointer: fine)').matches) return;

    const move = (event: PointerEvent) => {
      const box = node.getBoundingClientRect();
      const x = event.clientX - (box.left + box.width / 2);
      const y = event.clientY - (box.top + box.height / 2);
      node.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`;
    };
    const reset = () => {
      node.style.transform = 'translate3d(0, 0, 0)';
    };

    node.addEventListener('pointermove', move);
    node.addEventListener('pointerleave', reset);
    return () => {
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerleave', reset);
    };
  }, [strength]);

  return (
    <span ref={ref} className={`magnetic ${className}`.trim()}>
      {children}
    </span>
  );
}

/** 3D tilt toward the pointer, used by the project frames on the wall. */
export function Tilt({
  children,
  className = '',
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!matchMedia('(pointer: fine)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const move = (event: PointerEvent) => {
      const box = node.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      node.style.setProperty('--rx', `${-y * max}deg`);
      node.style.setProperty('--ry', `${x * max}deg`);
      node.style.setProperty('--gx', `${(x + 0.5) * 100}%`);
      node.style.setProperty('--gy', `${(y + 0.5) * 100}%`);
    };
    const reset = () => {
      node.style.setProperty('--rx', '0deg');
      node.style.setProperty('--ry', '0deg');
    };

    node.addEventListener('pointermove', move);
    node.addEventListener('pointerleave', reset);
    return () => {
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerleave', reset);
    };
  }, [max]);

  return (
    <div ref={ref} className={`tilt ${className}`.trim()}>
      {children}
    </div>
  );
}
