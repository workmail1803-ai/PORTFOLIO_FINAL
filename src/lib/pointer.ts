/**
 * One window-level pointer listener shared by every interactive element.
 *
 * Characters, magnetic buttons and proximity glows all want the cursor
 * position. Giving each its own listener multiplies work on every mouse move;
 * this coalesces them into a single rAF-throttled broadcast.
 */

type Listener = (x: number, y: number) => void;

const listeners = new Set<Listener>();
let x = -9999;
let y = -9999;
let frame = 0;
let bound = false;

function flush() {
  frame = 0;
  for (const listener of listeners) listener(x, y);
}

function onMove(event: PointerEvent) {
  if (event.pointerType === 'touch') return;
  x = event.clientX;
  y = event.clientY;
  if (!frame) frame = requestAnimationFrame(flush);
}

export function onPointer(listener: Listener) {
  if (!bound && typeof window !== 'undefined') {
    window.addEventListener('pointermove', onMove, { passive: true });
    bound = true;
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const finePointer = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches;

export const prefersReduced = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Distance from a point to the nearest edge of a rect (0 when inside). */
export function distanceToRect(px: number, py: number, rect: DOMRect) {
  const dx = Math.max(rect.left - px, 0, px - rect.right);
  const dy = Math.max(rect.top - py, 0, py - rect.bottom);
  return Math.hypot(dx, dy);
}
