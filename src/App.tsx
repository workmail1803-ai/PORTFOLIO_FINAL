import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { match, savedScroll, useLocation } from './router/router';
import { Room } from './room/Room';
import { cornerFor } from './room/useCamera';
import { routePatterns } from './routes';
import { Nav } from './components/Nav';
import { Footer } from './components/Footer';
import { useLamp, useReducedMotion } from './lib/hooks';
import { finePointer, onPointer } from './lib/pointer';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Projects } from './pages/Projects';
import { CaseStudyRoute } from './pages/CaseStudy';
import { Skills } from './pages/Skills';
import { BuildLog } from './pages/BuildLog';
import { Lab } from './pages/Lab';
import { Education } from './pages/Education';
import { Resume } from './pages/Resume';
import { Playground } from './pages/Playground';
import { Contact } from './pages/Contact';
import { NotFound } from './pages/NotFound';
import { Achievements, Blog } from './pages/Pending';

function renderRoute(path: string) {
  const found = match(path, routePatterns);
  switch (found?.name) {
    case 'home':
      return <Home />;
    case 'about':
      return <About />;
    case 'projects':
      return <Projects />;
    case 'case':
      return <CaseStudyRoute id={found.params.id} />;
    case 'skills':
      return <Skills />;
    case 'build':
      return <BuildLog />;
    case 'lab':
      return <Lab />;
    case 'education':
      return <Education />;
    case 'resume':
      return <Resume />;
    case 'playground':
      return <Playground />;
    case 'achievements':
      return <Achievements />;
    case 'blog':
      return <Blog />;
    case 'contact':
      return <Contact />;
    default:
      return <NotFound />;
  }
}

/** A soft light that follows the cursor. Desktop only; one element, one transform. */
function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!finePointer()) return;
    let seen = false;
    return onPointer((x, y) => {
      if (!seen) {
        seen = true;
        document.body.classList.add('has-pointer');
      }
      if (ref.current) ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  }, []);
  return <div ref={ref} className="cursor-glow" aria-hidden="true" />;
}

export default function App() {
  const location = useLocation();
  const reduced = useReducedMotion();
  const [lamp, toggleLamp] = useLamp();
  const [shown, setShown] = useState(location);
  const [leaving, setLeaving] = useState(false);
  const main = useRef<HTMLElement>(null);
  const focusedFor = useRef(location);

  // Leave, then enter. The outgoing scene fades briefly so the change reads
  // as moving between rooms of one place rather than a hard cut.
  useEffect(() => {
    if (location === shown) return;
    const samePage = location.split('#')[0] === shown.split('#')[0];
    if (samePage || reduced) {
      setShown(location);
      return;
    }
    setLeaving(true);
    const timer = window.setTimeout(() => {
      setShown(location);
      setLeaving(false);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [location, shown, reduced]);

  // Land in the right place: a hash target, the saved position on Back, or the top.
  useLayoutEffect(() => {
    const hash = shown.split('#')[1];
    if (hash) {
      requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }));
    } else {
      window.scrollTo(0, savedScroll() ?? 0);
    }
    // Move focus to the new page for keyboard and screen-reader users — only
    // on a real navigation, never on first load (StrictMode runs this twice).
    if (focusedFor.current !== shown) {
      focusedFor.current = shown;
      main.current?.focus({ preventScroll: true });
    }
  }, [shown]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (event.key.toLowerCase() === 't' && !event.metaKey && !event.ctrlKey && !event.altKey) toggleLamp();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleLamp]);

  const path = shown.split('#')[0];

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {/* The camera sets off on the click itself, not after the old page has left. */}
      <Room lamp={lamp} onLamp={toggleLamp} corner={cornerFor(match(location.split('#')[0], routePatterns)?.name)} />
      <div className="grain" aria-hidden="true" />
      <CursorGlow />
      <Nav current={shown} lamp={lamp} onLamp={toggleLamp} />
      <main id="main" ref={main} tabIndex={-1} key={path} className={`page ${leaving ? 'is-leaving' : ''}`}>
        {renderRoute(path)}
      </main>
      <Footer />
    </>
  );
}
