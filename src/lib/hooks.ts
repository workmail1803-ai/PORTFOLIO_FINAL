import { useEffect, useRef, useState } from 'react';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return reduced;
}

export type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* storage can be unavailable; the theme still applies for this visit */
    }
  }, [theme]);

  return [theme, () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))] as const;
}

/**
 * The layout decides what the particle field draws and where.
 *
 * Elements marked `data-field="<shape>"` reserve real space in the document,
 * so whatever the field renders lands in a gap the page deliberately left for
 * it — it can never collide with text. The nearest slot to the middle of the
 * viewport wins.
 */
export function useFieldSlots<T extends string>(initial: T) {
  const shape = useRef<T>(initial);
  /**
   * The winning element itself, not a snapshot of its box. The renderer reads
   * its rect on the frame it draws, so the field is glued to the layout — a
   * cached-and-damped position lags behind the scroll and reads as the page
   * drifting on its own.
   */
  const slotEl = useRef<HTMLElement | null>(null);
  /** Where the field is travelling from, so the move can be animated. */
  const prevSlotEl = useRef<HTMLElement | null>(null);
  /** False in sections that deliberately have no shape — nothing is drawn. */
  const active = useRef(true);
  const progress = useRef(0);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      progress.current = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;

      const eye = window.innerHeight / 2;

      // Only a slot the middle of the screen is actually inside counts. There
      // is no background state: sections that do not offer a slot show nothing
      // at all, and the field simply waits where it was.
      let inside: { el: HTMLElement; area: number } | null = null;

      for (const el of document.querySelectorAll<HTMLElement>('[data-field]')) {
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;

        // A shape is switched on by its section (`data-field-zone`) but drawn
        // inside its own empty box. Without that split each emblem would only
        // survive the few hundred pixels its box happens to occupy, and the
        // dots would blink out between every project.
        const zone = el.closest<HTMLElement>('[data-field-zone]') ?? el;
        const band = zone === el ? rect : zone.getBoundingClientRect();
        if (band.top > eye || band.bottom < eye) continue;

        const area = band.width * band.height;
        if (!inside || area < inside.area) inside = { el, area };
      }

      active.current = Boolean(inside);
      if (!inside) return;

      if (inside.el !== slotEl.current) {
        prevSlotEl.current = slotEl.current ?? inside.el;
        slotEl.current = inside.el;
        shape.current = (inside.el.dataset.field as T) ?? initial;
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [initial]);

  return { shape, slotEl, prevSlotEl, active, progress };
}

/** Adds `is-in` once an element first enters the viewport. */
export function useReveal<T extends HTMLElement>(threshold = 0.18) {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, shown] as const;
}

/** Ticking clock for Dhaka, independent of the visitor's own timezone. */
export function useDhakaTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return formatter.format(now);
}
