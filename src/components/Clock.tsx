import { useDhakaTime } from '../lib/hooks';

/**
 * Isolated on purpose. Ticking the time from the page component re-renders the
 * entire tree every second, which lands as a ~60ms stall in the middle of a
 * scroll. Here it re-renders one span.
 */
export function Clock() {
  const now = useDhakaTime();
  return (
    <span className="clock mono" title="Local time in Dhaka">
      <i className="live-dot" />
      {now} <span className="clock-zone">DHAKA</span>
    </span>
  );
}
