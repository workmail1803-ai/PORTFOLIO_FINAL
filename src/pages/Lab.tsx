import { ArrowUpRight, FlaskConical, Sparkles } from 'lucide-react';
import { Link } from '../router/router';
import { Character } from '../characters/Character';
import { Peek } from '../characters/Poses';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/motion';
import { StatusTag, KIND_ICON } from '../components/Project';
import { GithubMark } from '../components/icons';
import { projects } from '../data/projects';
import { notes } from '../data/content';
import { profile } from '../data/profile';
import { useTitle } from '../lib/hooks';

/** Research, automation, and anything not yet a public product. */
const experiments = projects.filter(
  p => p.kind === 'Research' || p.kind === 'Automation' || p.status === 'prototype' || p.status === 'research',
);

export function Lab() {
  useTitle(`Lab · ${profile.name}`, 'Research prototypes, automation and work in progress.');

  return (
    <>
      <PageHero
        id="lab-title"
        eyebrow="Lab & experiments"
        title={
          <>
            Welcome to <span className="grad">the lab.</span>
          </>
        }
        lede="The side of the work that is not a storefront: security research, a neural-network study, automation with deliberate limits, and a shop still being built. Each one says plainly how far it got."
        note={notes.lab[0]}
        character={<Character name="boy-code" priority sizes="(max-width: 760px) 80vw, 460px" className="page-hero-char" />}
      />

      <section className="section wrap" aria-labelledby="experiments-title">
        <div className="section-head">
          <p className="eyebrow">
            <FlaskConical size={13} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> On the
            bench
          </p>
          <h2 id="experiments-title" className="h-2">
            {experiments.length} experiments, all with source.
          </h2>
        </div>

        <div className="lab-grid">
          {experiments.map((project, index) => (
            <Reveal
              key={project.id}
              delay={index * 60}
              className="lab-card glass lift peek-host"
              style={{ ['--accent' as string]: project.accent }}
            >
              {index === 1 && <Peek name="girl-think" width="120px" className="lab-peek" flip />}
              <div className="lab-card-top">
                <span className="lab-icon" aria-hidden="true">
                  {KIND_ICON[project.kind]}
                </span>
                <StatusTag status={project.status} />
              </div>
              <h3 className="h-3">{project.name}</h3>
              <p className="muted">{project.tagline}</p>
              <p className="lab-honest">{project.honest}</p>
              <div className="chips">
                {project.stack.slice(0, 4).map(item => (
                  <span className="chip" key={item}>
                    {item}
                  </span>
                ))}
              </div>
              <div className="project-foot">
                <Link to={`/projects/${project.id}`} className="link-arrow">
                  Case study <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
                <a href={project.repo} target="_blank" rel="noreferrer" className="icon-btn" aria-label={`${project.name} source`}>
                  <GithubMark size={16} />
                </a>
              </div>
            </Reveal>
          ))}

          <Reveal delay={experiments.length * 60} className="lab-card lab-play glass is-strong lift">
            <div className="lab-card-top">
              <span className="lab-icon" aria-hidden="true">
                <Sparkles size={18} />
              </span>
              <span className="status is-live">
                <i aria-hidden="true" />
                Interactive
              </span>
            </div>
            <h3 className="h-3">The particle field</h3>
            <p className="muted">
              Up to 26,000 points that morph between a globe built from real coastline data, সংবাদ in live Bangla type,
              a plane and more, with the particle count tuned to your device.
            </p>
            <Link to="/playground" className="btn btn-primary">
              Open the playground <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
