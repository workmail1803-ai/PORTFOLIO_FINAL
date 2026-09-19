import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, GitCommitHorizontal, ShieldCheck } from 'lucide-react';
import { Link } from '../router/router';
import { Character } from '../characters/Character';
import { Note } from '../characters/Poses';
import { ProjectVisual, StatusTag, KIND_ICON } from '../components/Project';
import { Counter, Reveal } from '../components/motion';
import { GithubMark } from '../components/icons';
import { projects, type Project } from '../data/projects';
import { education } from '../data/content';
import { profile } from '../data/profile';
import { useTitle } from '../lib/hooks';
import { NotFound } from './NotFound';

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** Inline `code` in the stored copy becomes real <code>. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('`') && part.endsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : <span key={i}>{part}</span>,
      )}
    </>
  );
}

export function CaseStudyRoute({ id }: { id: string }) {
  const project = projects.find(p => p.id === id);
  if (!project) return <NotFound />;
  return <CaseStudy project={project} />;
}

export function CaseStudy({ project }: { project: Project }) {
  useTitle(`${project.name} · case study · ${profile.name}`, project.summary);
  const index = projects.indexOf(project);
  const next = projects[(index + 1) % projects.length];
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const course = education.flatMap(e => e.work ?? []).find(w => w.projectId === project.id);

  return (
    <article className="case" style={{ ['--accent' as string]: project.accent }} aria-labelledby="case-title">
      <header className="case-hero wrap">
        <Link to="/projects" className="btn btn-quiet case-back">
          <ArrowLeft size={16} aria-hidden="true" /> All projects
        </Link>
        <div className="case-hero-grid">
          <div className="case-hero-copy">
            <div className="case-kicker">
              <span className="project-kind">
                {KIND_ICON[project.kind]}
                {project.kind}
              </span>
              <StatusTag status={project.status} />
              {course && <span className="chip">{course.course}</span>}
            </div>
            <h1 id="case-title" className="h-1">
              {project.name}
            </h1>
            {project.nameBn && <p className="bn case-bn">{project.nameBn}</p>}
            <p className="case-tagline">{project.tagline}</p>
            <div className="btn-row">
              {project.live && (
                <a className="btn btn-primary btn-lg" href={project.live} target="_blank" rel="noreferrer">
                  Open {project.liveLabel} <ArrowUpRight size={17} aria-hidden="true" />
                </a>
              )}
              <a className="btn btn-ghost btn-lg" href={project.repo} target="_blank" rel="noreferrer">
                <GithubMark size={16} /> Source
              </a>
            </div>
            <dl className="case-facts">
              <div>
                <dt className="mono">
                  <CalendarDays size={13} aria-hidden="true" /> Built
                </dt>
                <dd>
                  {project.started === project.updated
                    ? fmt(project.started)
                    : `${fmt(project.started)} → ${fmt(project.updated)}`}
                </dd>
              </div>
              <div>
                <dt className="mono">
                  <GitCommitHorizontal size={13} aria-hidden="true" /> History
                </dt>
                <dd>
                  {project.commits} commits · {project.files} files
                </dd>
              </div>
            </dl>
          </div>

          <div className="case-showcase">
            <div className="case-screen glass">
              <ProjectVisual project={project} eager />
            </div>
            {project.mobile && (
              <img
                className="case-phone"
                src={project.mobile}
                alt={`${project.name} on a phone`}
                width="430"
                height="932"
                loading="lazy"
                decoding="async"
              />
            )}
            <Character name="girl-point" className="case-presenter" sizes="(max-width: 760px) 40vw, 240px" />
          </div>
        </div>
      </header>

      <section className="section wrap case-body">
        <div className="case-main">
          <Reveal className="case-block">
            <h2 className="eyebrow">Overview</h2>
            <p className="lede">{project.summary}</p>
          </Reveal>

          {project.metrics.length > 0 && (
            <Reveal className="case-metrics">
              {project.metrics.map(metric => (
                <div className="glass" key={metric.label}>
                  <strong>
                    <Counter value={metric.value} />
                  </strong>
                  <span className="mono">{metric.label}</span>
                </div>
              ))}
            </Reveal>
          )}

          {project.highlights.length > 0 && (
            <Reveal className="case-block">
              <h2 className="eyebrow">What it does</h2>
              <ul className="case-features">
                {project.highlights.map(item => (
                  <li key={item} className="glass">
                    <Rich text={item} />
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          {project.craft && (
            <Reveal className="case-block case-decision glass is-strong">
              <h2 className="eyebrow">The engineering decision</h2>
              <p>
                <Rich text={project.craft} />
              </p>
              <Note className="case-note" tilt={-4}>
                the part worth reading ↑
              </Note>
            </Reveal>
          )}

          {project.honest && (
            <Reveal className="case-block case-honest">
              <h2 className="eyebrow">
                <ShieldCheck size={13} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> What I am
                not claiming
              </h2>
              <p className="muted">
                <Rich text={project.honest} />
              </p>
            </Reveal>
          )}
        </div>

        <aside className="case-side">
          <div className="glass case-stack">
            <h2 className="eyebrow">Built with</h2>
            <div className="chips">
              {project.stack.map(item => (
                <span className="chip" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <nav className="wrap case-pager" aria-label="More case studies">
        <Link to={`/projects/${prev.id}`} className="pager glass lift">
          <span className="mono">
            <ArrowLeft size={13} aria-hidden="true" /> Previous
          </span>
          <strong>{prev.name}</strong>
        </Link>
        <Link to={`/projects/${next.id}`} className="pager glass lift is-next">
          <span className="mono">
            Next <ArrowRight size={13} aria-hidden="true" />
          </span>
          <strong>{next.name}</strong>
        </Link>
      </nav>
    </article>
  );
}
