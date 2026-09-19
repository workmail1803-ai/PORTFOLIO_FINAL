import { useDhakaTime } from '../lib/hooks';

/**
 * Isolated on purpose. Ticking the time from a page component re-renders the
 * whole tree every second, which lands as a ~60ms stall mid-scroll. Here it
 * re-renders one span.
 */
export function Clock({ bare = false }: { bare?: boolean }) {
  const now = useDhakaTime();
  if (bare) return <time>{now}</time>;
  return (
    <span className="clock mono" title="Local time in Dhaka">
      <i className="live-dot" aria-hidden="true" />
      <time>{now}</time> <span className="clock-zone">Dhaka</span>
    </span>
  );
}
