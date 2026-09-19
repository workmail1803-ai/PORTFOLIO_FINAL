import { ArrowUpRight, GitCommitHorizontal } from 'lucide-react';
import { Link } from '../router/router';
import { Character } from '../characters/Character';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/motion';
import { StatusTag, KIND_ICON } from '../components/Project';
import { projects } from '../data/projects';
import { notes } from '../data/content';
import { profile } from '../data/profile';
import { useTitle } from '../lib/hooks';

const timeline = [...projects].sort((a, b) => a.started.localeCompare(b.started));

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function range(start: string, end: string) {
  return start === end ? fmt(start) : `${fmt(start)} → ${fmt(end)}`;
}

export function BuildLog() {
  useTitle(`Build log · ${profile.name}`, 'Every project in the order it was started, with dates from its own git history.');

  return (
    <>
      <PageHero
        id="build-title"
        eyebrow="Build log"
        title={
          <>
            From curiosity <span className="grad">to creation.</span>
          </>
        }
        lede="No invented job titles here. This is a build log: every project in the order it began, and every date is the first and latest commit in that project’s own repository."
        note={notes.build[0]}
        character={<Character name="boy-coffee" priority sizes="(max-width: 760px) 70vw, 380px" className="page-hero-char" />}
      />

      <section className="section wrap" aria-labelledby="log-title">
        <h2 id="log-title" className="sr-only">
          Projects by start date
        </h2>
        <ol className="timeline">
          {timeline.map((project, index) => (
            <li key={project.id} className="timeline-item" style={{ ['--accent' as string]: project.accent }}>
              <span className="timeline-dot" aria-hidden="true" />
              <Reveal delay={Math.min(index, 4) * 50} className="timeline-card glass lift">
                <div className="timeline-meta">
                  <time className="mono" dateTime={project.started}>
                    {range(project.started, project.updated)}
                  </time>
                  <StatusTag status={project.status} />
                </div>
                <h3 className="h-3">
                  <span className="timeline-kind" aria-hidden="true">
                    {KIND_ICON[project.kind]}
                  </span>
                  {project.name}
                </h3>
                <p className="muted">{project.tagline}</p>
                <div className="chips">
                  {project.stack.slice(0, 5).map(item => (
                    <span className="chip" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
                <div className="timeline-foot">
                  <span className="mono">
                    <GitCommitHorizontal size={13} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} />{' '}
                    {project.commits} commits · {project.files} files
                  </span>
                  <Link to={`/projects/${project.id}`} className="link-arrow">
                    Case study <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
