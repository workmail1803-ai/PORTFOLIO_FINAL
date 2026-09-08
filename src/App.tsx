import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Copy,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { GithubMark, LinkedinMark, WhatsappMark } from './components/icons';
const Backdrop = lazy(() =>
  import('./gl/Backdrop').then(m => ({ default: m.Backdrop })),
);
import { Clock } from './components/Clock';
import { Cursor } from './components/Cursor';
import { CaseStudy } from './components/CaseStudy';
import { Counter, Magnetic, Marquee, Reveal, SplitLines, Tilt } from './components/motion';
import { profile } from './data/profile';
import { principles, projects, stack, totals, type Project } from './data/projects';
import type { ShapeId } from './gl/shapes';
import { useFieldSlots, useReducedMotion, useTheme } from './lib/hooks';

const NAV = [
  ['wall', 'The wall'],
  ['work', 'Case studies'],
  ['method', 'Method'],
  ['about', 'About'],
];

const byId = (id: string) => projects.find(p => p.id === id)!;

/** The bento gallery. Order and span are deliberate — the flagship leads. */
const WALL: Array<{ project: Project; span: string; tall?: boolean }> = [
  { project: byId('allbanglapaper'), span: 'span-7', tall: true },
  { project: byId('nextup'), span: 'span-5', tall: true },
  { project: byId('pixelsub'), span: 'span-5' },
  { project: byId('mosjid'), span: 'span-7' },
  { project: byId('tutortrack'), span: 'span-6' },
  { project: byId('hikmah'), span: 'span-6' },
];

const CASES = [byId('allbanglapaper'), byId('nextup'), byId('pixelsub')];

/** What the particle field draws beneath each case study. */
const CASE_SHAPE: Record<string, ShapeId> = {
  allbanglapaper: 'songbad',
  nextup: 'plane',
  pixelsub: 'telegram',
};

const MARQUEE = [
  'All Bangla Paper',
  'সকল পত্রিকা',
  'NextUp Mentor',
  'PixelSub',
  'Mosjid.info',
  'মসজিদ ডিরেক্টরি',
  'TutorTrack',
  'Hikmah Tutors',
  'ipiguard',
  'SOUND-AI',
  'Railway QuickBook',
];

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const reduced = useReducedMotion();
  const { shape, slotEl, prevSlotEl, active, progress } = useFieldSlots<ShapeId>('globe');
  const [booted, setBooted] = useState(false);
  const [glReady, setGlReady] = useState(false);
  const [openCase, setOpenCase] = useState<Project | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const wasCondensed = useRef(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const onGlReady = useCallback(() => setGlReady(true), []);

  // Hold the curtain until the field is built, but never longer than a moment.
  useEffect(() => {
    const floor = setTimeout(() => setBooted(true), glReady ? 260 : 1900);
    return () => clearTimeout(floor);
  }, [glReady]);

  useEffect(() => {
    let frame = 0;
    const paint = () => {
      frame = 0;
      if (bar.current) bar.current.style.transform = `scaleX(${progress.current})`;
      const next = window.scrollY > window.innerHeight * 0.55;
      if (next !== wasCondensed.current) {
        wasCondensed.current = next;
        setCondensed(next);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [progress]);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  // A small keyboard affordance for people who like keyboards.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (event.key.toLowerCase() === 't' && !event.metaKey && !event.ctrlKey) toggleTheme();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleTheme]);

  async function copyEmail() {
    clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      copyTimer.current = setTimeout(() => setCopied(false), 2600);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  }

  return (
    <>
      <a className="skip-link" href="#wall">
        Skip to the work
      </a>

      <div className={`curtain ${booted ? 'is-open' : ''}`} aria-hidden={booted}>
        <div className="curtain-inner">
          <span className="mono">Assembling the field</span>
          <div className="curtain-bar">
            <i />
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="backdrop backdrop-static" aria-hidden="true" />}>
        <Backdrop
          shape={shape}
          slotEl={slotEl}
          prevSlotEl={prevSlotEl}
          active={active}
          light={theme === 'light'}
          reduced={reduced}
          onReady={onGlReady}
        />
      </Suspense>
      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <Cursor enabled={!reduced} />

      <header className={`bar ${condensed ? 'is-condensed' : ''}`}>
        <div className="bar-progress" ref={bar} aria-hidden="true" />
        <a className="brand" href="#top" aria-label={`${profile.name} — home`}>
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="brand-text">momen</span>
        </a>

        <nav className={`nav ${menuOpen ? 'is-open' : ''}`} aria-label="Sections">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
          <a className="nav-cta" href="#contact" onClick={() => setMenuOpen(false)}>
            Start a project <ArrowUpRight size={14} />
          </a>
        </nav>

        <div className="bar-tools">
          <Clock />
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title="Theme — or press T"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            className="icon-btn menu-btn"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen(v => !v)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      <main id="top">
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="hero" data-field-zone aria-labelledby="hero-title">
          <div className="field-slot hero-slot" data-field="globe" aria-hidden="true" />
          <div className="hero-grid">
            <p className="mono hero-eyebrow">
              {profile.name} <span className="sep">/</span> {profile.role} <span className="sep">/</span>{' '}
              {profile.location}
            </p>

            <h1 id="hero-title" className="display d1 hero-title">
              <SplitLines
                lines={[
                  <>Built in Dhaka.</>,
                  <>
                    Shipped to <em className="italic accent">production</em>.
                  </>,
                ]}
                delay={140}
              />
            </h1>

            <Reveal delay={520} className="hero-lede">
              <p className="lede">
                {totals.live} products you can open right now — a national newspaper index, a
                study-abroad platform, a mosque directory for a country of 300,000 mosques, a
                storefront that lives inside a Telegram chat. Real users. Real databases. Real
                constraints.
              </p>
            </Reveal>

            <Reveal delay={640} className="hero-actions">
              <Magnetic>
                <a className="btn btn-primary" href="#wall" data-cursor="look">
                  See the wall <ArrowDown size={16} />
                </a>
              </Magnetic>
              <a className="btn btn-ghost" href="#contact" data-cursor="talk">
                Start a project <ArrowUpRight size={16} />
              </a>
            </Reveal>

            <Reveal delay={760} className="hero-stats">
              {[
                [String(totals.live), 'live, open them yourself'],
                [String(totals.projects), 'projects built'],
                [String(totals.commits), 'commits tracked'],
                [totals.files.toLocaleString('en-US'), 'files under version control'],
              ].map(([value, label]) => (
                <div key={label}>
                  <strong>
                    <Counter value={value} />
                  </strong>
                  <span className="mono">{label}</span>
                </div>
              ))}
            </Reveal>
          </div>

          <div className="hero-foot">
            <span className="mono">Scroll — the field follows</span>
            <span className="scroll-rail" aria-hidden="true">
              <i />
            </span>
          </div>
        </section>

        <Marquee items={MARQUEE} speed={54} />

        <div className="reading">
        {/* ── The wall ────────────────────────────────────────────────────── */}
        <section className="section wall-section" id="wall" aria-labelledby="wall-title">
          <div className="section-head">
            <span className="mono">01 — Selected products</span>
            <h2 id="wall-title" className="display d2">
              <SplitLines lines={[<>The wall.</>]} />
            </h2>
            <Reveal delay={160}>
              <p className="lede">
                Not concepts. Not dribbble shots. Screens captured from sites that are serving
                requests while you read this.
              </p>
            </Reveal>
          </div>

          <div className="wall">
            {WALL.map(({ project, span, tall }, index) => (
              <Reveal key={project.id} delay={index * 70} className={`wall-cell ${span}`}>
                <Tilt>
                  <button
                    className={`frame ${tall ? 'is-tall' : ''} ${project.image ? '' : 'is-chat'}`}
                    style={{ ['--accent' as string]: project.accent }}
                    onClick={() => setOpenCase(project)}
                    data-cursor="case study"
                    aria-label={`Open the ${project.name} case study`}
                  >
                    <span className="frame-chrome" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                      <span className="frame-url mono">{project.liveLabel ?? project.repo.replace('https://', '')}</span>
                    </span>

                    <span className="frame-media">
                      {project.image ? (
                        <img
                          src={project.image}
                          srcSet={`${project.imageSm} 760w, ${project.image} 1600w`}
                          sizes="(max-width: 900px) 92vw, 46vw"
                          alt={`${project.name} home page`}
                          width="1600"
                          height="1000"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="chat">
                          <span className="chat-line">/start</span>
                          <span className="chat-bubble">
                            🛒 <strong>PixelSub</strong> — pick a product, pay in crypto, receive it
                            instantly.
                          </span>
                          <span className="chat-bubble is-me">Buy · 1×</span>
                          <span className="chat-bubble">
                            ✅ Payment confirmed. Delivering your item…
                          </span>
                          <span className="chat-meta mono">@PixelsubCCBOT</span>
                        </span>
                      )}
                    </span>

                    <span className="frame-foot">
                      <span className="frame-title">
                        <span className={`dot dot-${project.status}`} />
                        {project.name}
                      </span>
                      <span className="frame-tag mono">{project.kind}</span>
                    </span>

                    <span className="frame-hover" aria-hidden="true">
                      <span>{project.tagline}</span>
                    </span>
                  </button>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Case studies ────────────────────────────────────────────────── */}
        <section className="section" id="work" aria-labelledby="work-title">
          <div className="section-head">
            <span className="mono">02 — Under the surface</span>
            <h2 id="work-title" className="display d2">
              <SplitLines lines={[<>Three decisions</>, <>worth explaining.</>]} />
            </h2>
          </div>

          <div className="cases">
            {CASES.map((project, index) => (
              <article
                className="case-row"
                key={project.id}
                data-field-zone
                style={{ ['--accent' as string]: project.accent }}
              >
                <div className="case-media">
                  <div className="case-stack">
                  <Reveal>
                    <Tilt max={5}>
                      <div className={`shot ${project.image ? '' : 'shot-phone'}`}>
                        {project.image ? (
                          <img
                            src={project.image}
                            srcSet={`${project.imageSm} 760w, ${project.image} 1600w`}
                            sizes="(max-width: 980px) 92vw, 44vw"
                            alt={`${project.name} interface`}
                            width="1600"
                            height="1000"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="phone">
                            <div className="phone-screen">
                              <span className="chat-bubble">Choose a product</span>
                              <span className="chat-bubble is-me">Netflix 1 month</span>
                              <span className="chat-bubble">Pay 4.20 USDT →</span>
                              <span className="chat-bubble is-ok">✅ Delivered automatically</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </Tilt>
                  </Reveal>
                  {project.mobile && (
                    <Reveal delay={180} className="shot-mobile">
                      <img
                        src={project.mobile}
                        alt={`${project.name} on a phone`}
                        width="430"
                        height="932"
                        loading="lazy"
                        decoding="async"
                      />
                    </Reveal>
                  )}
                  </div>
                  <div
                    className="field-slot case-slot"
                    data-field={CASE_SHAPE[project.id]}
                    aria-hidden="true"
                  />
                </div>

                <div className="case-text">
                  <Reveal>
                    <span className="mono case-index">0{index + 1}</span>
                    <h3 className="display d3">{project.name}</h3>
                    {project.nameBn && <p className="bn case-bn">{project.nameBn}</p>}
                    <p className="case-tagline">{project.tagline}</p>
                  </Reveal>

                  <Reveal delay={90}>
                    <p className="case-summary">{project.summary}</p>
                  </Reveal>

                  <Reveal delay={140} className="metric-row">
                    {project.metrics.map(metric => (
                      <div key={metric.label}>
                        <strong>
                          <Counter value={metric.value} />
                        </strong>
                        <span className="mono">{metric.label}</span>
                      </div>
                    ))}
                  </Reveal>

                  <Reveal delay={190}>
                    <p className="case-craft">{project.craft}</p>
                  </Reveal>

                  <Reveal delay={230} className="case-actions">
                    <button className="btn btn-primary" onClick={() => setOpenCase(project)} data-cursor="read">
                      Full case study <ArrowUpRight size={16} />
                    </button>
                    {project.live && (
                      <a className="btn btn-ghost" href={project.live} target="_blank" rel="noreferrer" data-cursor="visit">
                        {project.liveLabel}
                      </a>
                    )}
                  </Reveal>
                </div>
              </article>
            ))}
          </div>

          <Reveal className="more-work">
            <h3 className="mono">Everything else</h3>
            <ul className="ledger">
              {projects
                .filter(p => !CASES.includes(p))
                .map(project => (
                  <li key={project.id}>
                    <button onClick={() => setOpenCase(project)} data-cursor="open">
                      <span className={`dot dot-${project.status}`} />
                      <span className="ledger-name">{project.name}</span>
                      <span className="ledger-tag mono">{project.kind}</span>
                      <span className="ledger-stack mono">{project.stack.slice(0, 3).join(' · ')}</span>
                      <span className="ledger-year mono">{project.year}</span>
                      <ArrowUpRight size={17} />
                    </button>
                  </li>
                ))}
            </ul>
          </Reveal>
        </section>

        {/* ── Method ──────────────────────────────────────────────────────── */}
        <section className="section method" id="method" aria-labelledby="method-title">
          <div className="method-head">
          <div className="section-head">
            <span className="mono">03 — How I build</span>
            <h2 id="method-title" className="display d2">
              <SplitLines lines={[<>Six rules I</>, <>do not break.</>]} />
            </h2>
            <Reveal delay={140}>
              <p className="lede">
                Every one of these was written down before the code, and every one of them is
                traceable to a repository you can open.
              </p>
            </Reveal>
          </div>
            <div className="field-slot method-slot" data-field="graph" aria-hidden="true" />
          </div>

          <div className="rules">
            {principles.map((rule, index) => (
              <Reveal key={rule.n} delay={index * 60} className="rule">
                <span className="rule-n display">{rule.n}</span>
                <h3>{rule.title}</h3>
                <p>{rule.body}</p>
                <a className="rule-proof mono" href={rule.href} target="_blank" rel="noreferrer" data-cursor="proof">
                  {rule.proof} <ArrowUpRight size={13} />
                </a>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Stack ───────────────────────────────────────────────────────── */}
        <section className="section stack-section" aria-labelledby="stack-title">
          <div className="section-head">
            <span className="mono">04 — Tools</span>
            <h2 id="stack-title" className="display d2">
              <SplitLines lines={[<>The kit.</>]} />
            </h2>
          </div>
          <div className="stack">
            {stack.map((group, index) => (
              <Reveal key={group.group} delay={index * 60} className="stack-group">
                <h3 className="mono">{group.group}</h3>
                <div className="chips">
                  {group.items.map(item => (
                    <span className="chip" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── About ───────────────────────────────────────────────────────── */}
        <section className="section about" id="about" aria-labelledby="about-title">
          <div className="about-grid">
            <div>
              <span className="mono">05 — The person</span>
              <h2 id="about-title" className="display d2">
                <SplitLines lines={[<>Nafis</>, <>Hossain</>, <em className="italic">Momen.</em>]} />
              </h2>
            </div>
            <div className="about-copy">
              <Reveal>
                <p className="lede">
                  I am a computer science student at BRAC University who could not wait to graduate
                  before building things people actually use.
                </p>
              </Reveal>
              <Reveal delay={90}>
                <p>
                  Most of what I build is for Bangladesh, in Bangla, for problems I watched someone
                  have. A directory because finding a newspaper meant six ad-covered aggregators. A
                  student portal because an anxious applicant deserves to know who is holding their
                  file. A mosque map because the information existed everywhere and nowhere.
                </p>
              </Reveal>
              <Reveal delay={140}>
                <p>
                  I care about the unglamorous half: permissions enforced in the database, money
                  computed in SQL, a README that states its own limits. It is slower on day one and
                  it is the reason these projects are still running.
                </p>
              </Reveal>
              <Reveal delay={190}>
                <p className="bn about-bn">যা বানাই, তা মানুষের কাজে লাগুক — এটাই আসল কথা।</p>
              </Reveal>
              <Reveal delay={240} className="about-facts">
                {[
                  ['Based in', `${profile.location} · UTC+${profile.utcOffset}`],
                  ['Studying', profile.study],
                  ['Working in', 'TypeScript, Python, SQL'],
                  ['Open to', 'Product work, platforms, contract builds'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span className="mono">{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </Reveal>
            </div>
          </div>
        </section>

        </div>

        {/* ── Contact ─────────────────────────────────────────────────────── */}
        <section className="section contact" id="contact" data-field-zone aria-labelledby="contact-title">
          <span className="mono">06 — Say hello</span>
          <h2 id="contact-title" className="display d1 contact-title">
            <SplitLines lines={[<>Your idea.</>, <em className="italic accent">My inbox.</em>]} />
          </h2>

          <Reveal delay={200}>
            <p className="lede contact-lede">
              Tell me what is not working yet. I reply from Dhaka, usually the same day.
            </p>
          </Reveal>

          <Reveal delay={280} className="contact-actions">
            <Magnetic strength={0.24}>
              <a className="btn btn-primary btn-lg" href={`mailto:${profile.email}`} data-cursor="write">
                {profile.email} <ArrowUpRight size={18} />
              </a>
            </Magnetic>
            <button className="icon-btn" onClick={copyEmail} aria-label="Copy email address" data-cursor="copy">
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
            <span className="copy-status mono" role="status">
              {copied ? 'Copied to clipboard' : ''}
            </span>
          </Reveal>

          <Reveal delay={340} className="socials">
            <a href={profile.github} target="_blank" rel="noreferrer" data-cursor="github">
              <GithubMark size={17} /> GitHub <ArrowUpRight size={13} />
            </a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer" data-cursor="linkedin">
              <LinkedinMark size={17} /> LinkedIn <ArrowUpRight size={13} />
            </a>
            <a href={profile.whatsapp} target="_blank" rel="noreferrer" data-cursor="message">
              <WhatsappMark size={17} /> WhatsApp <ArrowUpRight size={13} />
            </a>
          </Reveal>

          <div className="field-slot contact-slot" data-field="envelope" aria-hidden="true" />
        </section>
      </main>

      <footer className="foot">
        <span className="mono">
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span className="mono">
          {profile.location} <span className="bn">· {profile.locationBn}</span>
        </span>
        <a className="mono" href="#top" data-cursor="top">
          Back to the top <ArrowUpRight size={13} />
        </a>
      </footer>

      <CaseStudy project={openCase} onClose={() => setOpenCase(null)} />
    </>
  );
}
