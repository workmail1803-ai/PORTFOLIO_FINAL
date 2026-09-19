import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Lamp, Menu, Send, X } from 'lucide-react';
import { Link } from '../router/router';
import { ROUTES } from '../routes';
import { profile } from '../data/profile';

const primary = ROUTES.filter(r => r.enabled && r.nav === 'primary');
const more = ROUTES.filter(r => r.enabled && r.nav === 'more');

/** `/projects/nextup` keeps "Projects" lit. */
export function isActive(path: string, current: string) {
  const here = current.split('#')[0].replace(/\/+$/, '') || '/';
  if (path === '/') return here === '/';
  return here === path || here.startsWith(`${path}/`);
}

export function Nav({ current, lamp, onLamp }: { current: string; lamp: boolean; onLamp: () => void }) {
  const [menu, setMenu] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreActive = more.some(r => isActive(r.path, current));

  useEffect(() => {
    setMenu(false);
    setMoreOpen(false);
  }, [current]);

  useEffect(() => {
    if (!moreOpen) return;
    const close = (event: PointerEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false);
    };
    const key = (event: KeyboardEvent) => event.key === 'Escape' && setMoreOpen(false);
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', key);
    };
  }, [moreOpen]);

  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menu]);

  return (
    <>
      <header className="nav">
        <div className="nav-bar">
          <Link to="/" className="brand" aria-label={`${profile.name}, home`}>
            Nafis<i>.</i>
          </Link>

          <nav className="nav-links" aria-label="Main">
            {primary.map(route => (
              <Link
                key={route.name}
                to={route.path}
                className={`nav-link ${route.name === 'home' ? 'is-secondary' : ''}`}
                aria-current={isActive(route.path, current) ? 'page' : undefined}
              >
                {route.label}
              </Link>
            ))}
            <div className={`nav-more ${moreOpen ? 'is-open' : ''}`} ref={moreRef}>
              <button
                type="button"
                className="nav-link"
                aria-expanded={moreOpen}
                aria-haspopup="true"
                aria-current={moreActive ? 'page' : undefined}
                onClick={() => setMoreOpen(v => !v)}
              >
                More <ChevronDown size={14} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} />
              </button>
              <div className="nav-more-list">
                {more.map(route => (
                  <Link
                    key={route.name}
                    to={route.path}
                    className="nav-link"
                    aria-current={isActive(route.path, current) ? 'page' : undefined}
                  >
                    {route.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          <div className="nav-tools">
            <button
              type="button"
              className="icon-btn"
              onClick={onLamp}
              aria-pressed={lamp}
              aria-label={lamp ? 'Turn the lamp off' : 'Turn the lamp on'}
              title="Desk lamp (or press T)"
            >
              <Lamp size={17} aria-hidden="true" />
            </button>
            <Link to="/contact" className="btn btn-primary nav-cta">
              <Send size={15} aria-hidden="true" /> Let's talk
            </Link>
            <button
              type="button"
              className="icon-btn menu-btn"
              aria-expanded={menu}
              aria-controls="mobile-menu"
              aria-label={menu ? 'Close menu' : 'Open menu'}
              onClick={() => setMenu(v => !v)}
            >
              {menu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* visibility:hidden when closed also removes it from the tab order */}
      <nav id="mobile-menu" className={`mobile-menu ${menu ? 'is-open' : ''}`} aria-label="Mobile">
        {[...primary, ...more].map((route, index) => (
          <Link
            key={route.name}
            to={route.path}
            aria-current={isActive(route.path, current) ? 'page' : undefined}
            style={{ transitionDelay: `${60 + index * 35}ms` }}
          >
            {route.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
