import { useEffect, useRef, useState } from 'react';
import { CORNERS, type CornerId } from './corners';
import { prefersReduced } from '../lib/pointer';

/*
 * Every page is a corner of the same room. When the page changes, the camera
 * glides there: a sub-second clip generated from the painting itself, ending
 * on the frame that becomes the new page's background. Leaving a corner plays
 * its move backwards; corner to corner steps back through the room first.
 *
 * Clips are fetched once, at idle, into blob URLs, so a transition never waits
 * on the network. Until they are ready — or when the visitor prefers reduced
 * motion or has asked to save data — the backgrounds simply cross-fade.
 */

const ROUTE_CORNER: Record<string, CornerId> = {
  about: 'desk',
  lab: 'desk',
  build: 'desk',
  education: 'desk',
  resume: 'desk',
  projects: 'shelf',
  case: 'shelf',
  skills: 'shelf',
};

const available = new Set<string>(CORNERS.map(c => c.id));

/** The corner a route lives in; the whole room when its corner has no clip yet. */
export function cornerFor(routeName: string | undefined): CornerId {
  const corner = routeName ? ROUTE_CORNER[routeName] : undefined;
  return corner && available.has(corner) ? corner : 'room';
}

type Connection = { saveData?: boolean; effectiveType?: string };

function mayGlide() {
  if (prefersReduced()) return false;
  const connection = (navigator as Navigator & { connection?: Connection }).connection;
  if (connection?.saveData) return false;
  if (/(^|-)2g|3g/.test(connection?.effectiveType ?? '')) return false;
  // Phones only fetch the clips on a fast connection; everything else does.
  return matchMedia('(min-width: 761px)').matches || connection?.effectiveType === '4g';
}

const clips = new Map<string, string>();
let loading: Promise<void> | null = null;

function preload() {
  const probe = document.createElement('video');
  const ext = probe.canPlayType('video/webm; codecs="vp9"') ? 'webm' : 'mp4';
  loading ??= Promise.all(
    CORNERS.flatMap(c => [`move-${c.id}`, `move-${c.id}-back`]).map(async name => {
      const response = await fetch(`/room/${name}.${ext}`);
      if (!response.ok) throw new Error(name);
      clips.set(name, URL.createObjectURL(await response.blob()));
    }),
  ).then(
    () => undefined,
    () => undefined,
  );
  return loading;
}

export type Camera = {
  /** The corner on screen, or being arrived at. */
  at: CornerId;
  /** True while a clip is playing. */
  moving: boolean;
  /** Which of the two video elements is showing, if any. */
  showing: 0 | 1 | null;
  videos: [React.RefObject<HTMLVideoElement | null>, React.RefObject<HTMLVideoElement | null>];
};

export function useCamera(target: CornerId): Camera {
  const [at, setAt] = useState<CornerId>(target);
  const [moving, setMoving] = useState(false);
  const [showing, setShowing] = useState<0 | 1 | null>(null);
  const a = useRef<HTMLVideoElement>(null);
  const b = useRef<HTMLVideoElement>(null);
  const from = useRef<CornerId>(target);
  const run = useRef(0);

  // Fetch the clips once the page has settled.
  useEffect(() => {
    if (!mayGlide()) return;
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(() => void preload(), { timeout: 4000 });
      return () => window.cancelIdleCallback(handle);
    }
    const handle = window.setTimeout(() => void preload(), 1500);
    return () => window.clearTimeout(handle);
  }, []);

  useEffect(() => {
    if (target === from.current) return;
    const token = ++run.current;
    const start = from.current;
    from.current = target;

    const steps = [start !== 'room' ? `move-${start}-back` : null, target !== 'room' ? `move-${target}` : null].filter(
      (s): s is string => Boolean(s),
    );
    const ready = mayGlide() && steps.every(s => clips.has(s));

    // No clip to hand, or asked not to move: cross-fade the backgrounds.
    if (!ready) {
      for (const v of [a.current, b.current]) v?.pause();
      setShowing(null);
      setMoving(false);
      setAt(target);
      if (mayGlide()) void preload();
      return;
    }

    const players = [a.current, b.current];
    if (!players[0] || !players[1]) {
      setAt(target);
      return;
    }

    const cancelled = () => token !== run.current;
    setMoving(true);

    const play = async (index: number) => {
      const slot = (index % 2) as 0 | 1;
      const video = players[slot]!;
      const next = players[1 - slot]!;
      const last = index === steps.length - 1;
      // Queue the following clip on the other element so the swap is seamless.
      if (!last) {
        next.src = clips.get(steps[index + 1])!;
        next.load();
      }
      if (video.src !== clips.get(steps[index])) {
        video.src = clips.get(steps[index])!;
        video.load();
      }
      video.currentTime = 0;
      await new Promise<void>(resolve => {
        const shown = () => {
          video.removeEventListener('playing', shown);
          resolve();
        };
        video.addEventListener('playing', shown);
        video.play().catch(() => resolve());
      });
      if (cancelled()) return;
      setShowing(slot);
      // Under the final clip, the destination fades in, so it is there when the clip ends.
      if (last) setAt(target);
      await new Promise<void>(resolve => video.addEventListener('ended', () => resolve(), { once: true }));
      if (cancelled()) return;
      if (!last) return play(index + 1);
      setShowing(null);
      setMoving(false);
    };

    void play(0);
    return () => {
      run.current++;
      for (const v of players) v?.pause();
    };
  }, [target]);

  // A move cut short by another navigation leaves no video on screen.
  useEffect(() => {
    if (!moving) return;
    const timer = window.setTimeout(() => {
      setShowing(null);
      setMoving(false);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [moving]);

  return { at, moving, showing, videos: [a, b] };
}
