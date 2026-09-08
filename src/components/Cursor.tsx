import { useEffect, useRef } from 'react';

/**
 * A two-part cursor: a dot that tracks exactly, and a ring that lags and swells
 * over anything interactive. Elements opt into a label with `data-cursor="open"`.
 * Pointer-coarse devices never mount it.
 */
export function Cursor({ enabled }: { enabled: boolean }) {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!matchMedia('(pointer: fine)').matches) return;

    const target = { x: innerWidth / 2, y: innerHeight / 2 };
    const eased = { x: target.x, y: target.y };
    let frame = 0;
    let visible = false;

    const move = (event: PointerEvent) => {
      target.x = event.clientX;
      target.y = event.clientY;
      if (!visible) {
        visible = true;
        document.body.classList.add('has-cursor');
      }
      if (dot.current) {
        dot.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      }
    };

    const tick = () => {
      eased.x += (target.x - eased.x) * 0.16;
      eased.y += (target.y - eased.y) * 0.16;
      if (ring.current) {
        ring.current.style.transform = `translate3d(${eased.x}px, ${eased.y}px, 0)`;
      }
      frame = requestAnimationFrame(tick);
    };

    const over = (event: PointerEvent) => {
      const node = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        'a, button, [data-cursor], input, summary',
      );
      const active = Boolean(node);
      ring.current?.classList.toggle('is-active', active);
      const text = node?.dataset.cursor ?? '';
      ring.current?.classList.toggle('has-label', Boolean(text));
      if (label.current) label.current.textContent = text;
    };

    const leave = () => {
      visible = false;
      document.body.classList.remove('has-cursor');
    };

    const down = () => ring.current?.classList.add('is-down');
    const up = () => ring.current?.classList.remove('is-down');

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerover', over, { passive: true });
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    document.addEventListener('pointerleave', leave);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      document.removeEventListener('pointerleave', leave);
      document.body.classList.remove('has-cursor');
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
      <div ref={ring} className="cursor-ring" aria-hidden="true">
        <span ref={label} className="cursor-label" />
      </div>
    </>
  );
}
