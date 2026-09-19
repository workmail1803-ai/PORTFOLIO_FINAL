import { useCallback, useEffect, useRef, useState } from 'react';

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

/**
 * The desk lamp. This replaces the old light/dark toggle: a night-room site
 * does not turn into daytime, but the lamp can warm it up. Same `T` shortcut.
 */
export function useLamp() {
  const [lamp, setLamp] = useState<boolean>(() => {
    try {
      return localStorage.getItem('lamp') === 'on';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.dataset.lamp = lamp ? 'on' : 'off';
    try {
      localStorage.setItem('lamp', lamp ? 'on' : 'off');
    } catch {
      /* storage can be unavailable; the lamp still works for this visit */
    }
  }, [lamp]);

  const toggle = useCallback(() => setLamp(v => !v), []);
  return [lamp, toggle] as const;
}

/** Sets the document title and description for the page on screen. */
export function useTitle(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    }
  }, [title, description]);
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
