/**
 * A deliberately small router.
 *
 * The site has a dozen static routes and one dynamic one, so a library would
 * mostly be weight. Owning it also means the page transition — a character
 * finishing its tap before the next scene fades in — can be sequenced exactly.
 */
import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent, type ReactNode, type Ref } from 'react';

const CHANGE = 'app:navigate';

type HistoryState = { key: string; scroll?: number } | null;

function currentKey() {
  return (history.state as HistoryState)?.key ?? 'root';
}

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener(CHANGE, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(CHANGE, onChange);
  };
}

const snapshot = () => location.pathname + location.hash;

/** The current path (with hash). Re-renders on every navigation. */
export function useLocation() {
  return useSyncExternalStore(subscribe, snapshot, () => '/');
}

if (typeof window !== 'undefined') {
  history.scrollRestoration = 'manual';
  if (!history.state) history.replaceState({ key: 'root' }, '');
}

/** Scroll position to restore for the entry now showing, if any. */
export function savedScroll() {
  return (history.state as HistoryState)?.scroll;
}

export function navigate(to: string, { replace = false } = {}) {
  const url = new URL(to, location.href);
  if (url.origin !== location.origin) {
    location.href = to;
    return;
  }
  if (url.pathname + url.hash === snapshot()) {
    if (url.hash) document.querySelector(url.hash)?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  // Remember where we were, so Back lands in the same place.
  history.replaceState({ key: currentKey(), scroll: window.scrollY }, '');
  const state = { key: Math.random().toString(36).slice(2) };
  if (replace) history.replaceState(state, '', url.pathname + url.hash);
  else history.pushState(state, '', url.pathname + url.hash);
  window.dispatchEvent(new Event(CHANGE));
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string;
  children: ReactNode;
  /** Runs before navigating; resolve to continue. Lets a character finish its tap. */
  before?: () => Promise<void> | void;
  ref?: Ref<HTMLAnchorElement>;
};

export function Link({ to, before, onClick, children, ref, ...rest }: LinkProps) {
  const handle = async (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (rest.target && rest.target !== '_self') return;
    event.preventDefault();
    await before?.();
    navigate(to);
  };
  return (
    <a ref={ref} href={to} onClick={handle} {...rest}>
      {children}
    </a>
  );
}

/* ── Route table ─────────────────────────────────────────────────────────── */

export type Match = { name: string; params: Record<string, string> };

export function match(pathname: string, patterns: Array<[string, string]>): Match | null {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  for (const [name, pattern] of patterns) {
    const segs = pattern.split('/').filter(Boolean);
    if (segs.length !== parts.length) continue;
    const params: Record<string, string> = {};
    let ok = true;
    for (let i = 0; i < segs.length; i++) {
      if (segs[i].startsWith(':')) params[segs[i].slice(1)] = decodeURIComponent(parts[i]);
      else if (segs[i] !== parts[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return { name, params };
  }
  return null;
}
