import { ArrowUpRight, Code2, FileText, FolderGit2, GitCommitHorizontal, Rocket, Send, Sparkles } from 'lucide-react';
import { Link } from '../router/router';
import { TapCta } from '../characters/TapCta';
import { PressCta } from '../characters/PressCta';
import { Character } from '../characters/Character';
import { Note, Peek } from '../characters/Poses';
import { Counter, Marquee, Reveal } from '../components/motion';
import { ProjectCard } from '../components/Project';
import { profile } from '../data/profile';
import { principles, projects, stack, totals } from '../data/projects';
import { about, hero, notes } from '../data/content';
import { useTitle } from '../lib/hooks';
import { Testimonials } from './Pending';

const byId = (id: string) => projects.find(p => p.id === id)!;
const featured = [byId('allbanglapaper'), byId('nextup'), byId('pixelsub')];
const latest = [...projects].sort((a, b) => b.updated.localeCompare(a.updated))[0];
const dateLabel = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

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

export function Home() {
  useTitle(
    `${profile.name} · Full-stack engineer, Dhaka`,
    `Full-stack engineer in Dhaka. ${totals.live} products live in production, ${totals.projects} projects, and the engineering decisions behind them.`,
  );

  return (
    <>
      <section className="hero wrap" aria-labelledby="hero-title">
        <div className="hero-copy">
          <Note className="hero-hi" tilt={-5}>
            {hero.greeting}
          </Note>
          <h1 id="hero-title" className="h-display">
            I’m <span className="grad">Nafis</span>
            <i className="dot">.</i>
          </h1>
          <p className="hero-role">
            <strong>{profile.role}</strong>
            <span>
              {hero.headline[0]} <em>{hero.headline[1]}</em>
            </span>
          </p>
          <p className="lede hero-lede">
            {totals.live} {hero.lede}
          </p>
          <div className="btn-row">
            <Link to="/contact" className="btn btn-ghost btn-lg">
              <Send size={16} aria-hidden="true" /> Start a project
            </Link>
            <Link to="/resume" className="btn btn-quiet">
              <FileText size={16} aria-hidden="true" /> Résumé
            </Link>
          </div>
          <div className="stats hero-stats">
            {[
              [<Rocket size={17} key="i" />, String(totals.live), 'live, open them yourself'],
              [<FolderGit2 size={17} key="i" />, String(totals.projects), 'projects built'],
              [<GitCommitHorizontal size={17} key="i" />, String(totals.commits), 'commits tracked'],
              [<Code2 size={17} key="i" />, totals.files.toLocaleString('en-US'), 'files in version control'],
            ].map(([icon, value, label]) => (
              <div className="stat glass" key={label as string}>
                <span className="stat-icon" aria-hidden="true">
                  {icon}
                </span>
                <div>
                  <strong>
                    <Counter value={value as string} />
                  </strong>
                  <span>{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-stage">
          <div className="hero-window" aria-hidden="true" />
          <Link to={`/projects/${latest.id}`} className="float-chip glass hero-chip">
            <i className="live-dot" aria-hidden="true" />
            <span>
              <span className="mono">Latest commit</span>
              <strong>{latest.name}</strong>
              <span className="muted">{dateLabel(latest.updated)}</span>
            </span>
          </Link>
          <span className="bubble hand hero-bubble" aria-hidden="true">
            Click here.<br />
            Let me show you my work!
          </span>
          <Note className="hero-note" tilt={4}>
            {notes.hero[0]}
            <br />
            {notes.hero[1]}
          </Note>
          <TapCta to="/projects" icon={<Rocket size={18} aria-hidden="true" />}>
            View my work
          </TapCta>
        </div>
      </section>

      <Marquee items={MARQUEE} speed={60} />

      <section className="section wrap" aria-labelledby="featured-title">
        <div className="section-head is-split">
          <div>
            <p className="eyebrow">
              <Sparkles size={13} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> Featured
              projects
            </p>
            <h2 id="featured-title" className="h-1">
              Three I’d show you <span className="grad">first.</span>
            </h2>
          </div>
          <Link to="/projects" className="link-arrow">
            All {totals.projects} projects <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <div className="featured-grid">
          {featured.map((project, index) => (
            <Reveal key={project.id} delay={index * 90} className="peek-host featured-cell">
              {index === 0 && <Peek name="girl-peace" width="150px" className="featured-peek" />}
              {index === 0 && (
                <Note className="featured-note" tilt={-6}>
                  start here ♡
                </Note>
              )}
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>

        <div className="featured-press">
          <PressCta to="/projects" icon={<FolderGit2 size={22} aria-hidden="true" />} width="min(430px, 88vw)">
            View all projects
          </PressCta>
        </div>
      </section>

      <section className="section wrap" aria-labelledby="about-preview-title">
        <div className="about-preview glass is-strong">
          <div className="about-preview-char">
            <Character name="boy-point" sizes="(max-width: 760px) 60vw, 340px" />
          </div>
          <div className="about-preview-copy">
            <p className="eyebrow">More than just code</p>
            <h2 id="about-preview-title" className="h-2">
              {about.lede}
            </h2>
            <p className="muted">{about.paragraphs[0]}</p>
            <p className="bn about-bn">{about.bangla}</p>
            <Link to="/about" className="link-arrow">
              About me <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <Note className="about-preview-note" tilt={5}>
            {notes.about[0]}
            <br />
            {notes.about[1]}
          </Note>
        </div>
      </section>

      <section className="section wrap" aria-labelledby="method-preview-title">
        <div className="section-head is-split">
          <div>
            <p className="eyebrow">How I build</p>
            <h2 id="method-preview-title" className="h-1">
              Rules I don’t break.
            </h2>
          </div>
          <Link to="/about#method" className="link-arrow">
            All six <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <div className="rules">
          {principles.slice(0, 3).map((rule, index) => (
            <Reveal key={rule.n} delay={index * 80} className="rule glass lift">
              <span className="rule-n">{rule.n}</span>
              <h3 className="h-3">{rule.title}</h3>
              <p className="muted">{rule.body}</p>
              <a className="rule-proof mono" href={rule.href} target="_blank" rel="noreferrer">
                {rule.proof} <ArrowUpRight size={12} aria-hidden="true" />
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section wrap" aria-labelledby="skills-preview-title">
        <div className="skills-preview glass">
          <div className="skills-preview-copy">
            <p className="eyebrow">Skills & tools</p>
            <h2 id="skills-preview-title" className="h-2">
              The kit behind the work.
            </h2>
            <div className="skills-preview-groups">
              {stack.map(group => (
                <div key={group.group}>
                  <p className="mono">{group.group}</p>
                  <div className="chips">
                    {group.items.map(item => (
                      <span className="chip" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Link to="/skills" className="link-arrow">
              See where each one is used <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="skills-preview-char">
            <Character name="girl-point" sizes="(max-width: 760px) 60vw, 320px" flip />
          </div>
        </div>
      </section>

      {/* Renders nothing until real testimonials exist in content.ts. */}
      <Testimonials />

      <section className="section wrap" aria-labelledby="cta-title">
        <div className="cta-banner glass is-strong">
          <div className="cta-copy">
            <p className="eyebrow">Say hello</p>
            <h2 id="cta-title" className="h-1">
              Let’s build something <span className="grad">good</span> together.
            </h2>
            <p className="lede">Tell me what is not working yet. I reply from Dhaka, usually the same day.</p>
            <div className="btn-row">
              <Link to="/contact" className="btn btn-primary btn-lg">
                <Send size={16} aria-hidden="true" /> Let’s talk
              </Link>
              <a className="btn btn-ghost btn-lg" href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
            </div>
          </div>
          <div className="cta-char">
            <Character name="girl-laptop" sizes="(max-width: 760px) 55vw, 300px" />
          </div>
        </div>
      </section>
    </>
  );
}
