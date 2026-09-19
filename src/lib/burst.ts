import { prefersReduced } from './pointer';

/**
 * A circular ripple plus a ring of sparks at a point inside `host`.
 *
 * Written straight to the DOM: it is a 600ms decoration, and routing it through
 * React state would re-render the component doing the tapping at the exact
 * moment the tap should feel instant.
 */
export function burst(host: HTMLElement, x: number, y: number, { sparks = 9, colour = 'var(--cyan)' } = {}) {
  if (prefersReduced()) return;

  const layer = document.createElement('span');
  layer.className = 'burst';
  layer.style.left = `${x}px`;
  layer.style.top = `${y}px`;
  layer.style.setProperty('--burst', colour);

  const ring = document.createElement('i');
  ring.className = 'burst-ring';
  layer.appendChild(ring);

  const ring2 = document.createElement('i');
  ring2.className = 'burst-ring is-late';
  layer.appendChild(ring2);

  for (let i = 0; i < sparks; i++) {
    const spark = document.createElement('i');
    spark.className = 'burst-spark';
    const angle = (360 / sparks) * i + (i % 2 ? 11 : -7);
    spark.style.setProperty('--a', `${angle}deg`);
    spark.style.setProperty('--d', `${30 + (i % 3) * 9}px`);
    layer.appendChild(spark);
  }

  host.appendChild(layer);
  window.setTimeout(() => layer.remove(), 720);
}

/** Ripple from wherever a button was pressed. */
export function rippleFrom(event: React.PointerEvent<HTMLElement>) {
  const target = event.currentTarget;
  const box = target.getBoundingClientRect();
  burst(target, event.clientX - box.left, event.clientY - box.top, { sparks: 0, colour: 'rgba(255,255,255,.55)' });
}

export const wait = (ms: number) =>
  new Promise<void>(resolve => window.setTimeout(resolve, prefersReduced() ? 0 : ms));
