import { ArrowUpRight, FileText, MapPin } from 'lucide-react';
import { Link } from '../router/router';
import { Character } from '../characters/Character';
import { Note, Peek } from '../characters/Poses';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/motion';
import { principles, projects, totals } from '../data/projects';
import { about, notes } from '../data/content';
import { profile } from '../data/profile';
import { useTitle } from '../lib/hooks';

const recent = [...projects].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 3);

export function About() {
  useTitle(`About · ${profile.name}`, about.lede);

  return (
    <>
      <PageHero
        id="about-title"
        eyebrow="About me"
        title={
          <>
            More than just <span className="grad">code.</span>
          </>
        }
        lede={about.lede}
        actions={
          <>
            <Link to="/projects" className="btn btn-primary btn-lg">
              See the work
            </Link>
            <Link to="/resume" className="btn btn-ghost btn-lg">
              <FileText size={16} aria-hidden="true" /> Résumé
            </Link>
          </>
        }
        note={
          <>
            {notes.about[0]}
            <br />
            {notes.about[1]}
          </>
        }
        character={<Character name="boy-code" priority sizes="(max-width: 760px) 80vw, 460px" className="page-hero-char" />}
      />

      <section className="section wrap" aria-labelledby="story-title">
        <div className="story">
          <div className="story-copy">
            <p className="eyebrow">The story so far</p>
            <h2 id="story-title" className="h-2">
              Why I build what I build.
            </h2>
            {about.paragraphs.map(paragraph => (
              <Reveal key={paragraph}>
                <p className="lede">{paragraph}</p>
              </Reveal>
            ))}
            <Reveal>
              <p className="bn about-bn">{about.bangla}</p>
            </Reveal>
          </div>

          <aside className="facts glass peek-host" aria-label="Quick facts">
            <Peek name="girl-think" width="130px" className="facts-peek" />
            {about.facts.map(([label, value]) => (
              <div key={label} className="fact">
                <span className="mono">{label}</span>
                <span>{value}</span>
              </div>
            ))}
            <div className="fact">
              <span className="mono">Shipped</span>
              <span>
                {totals.live} live products, {totals.projects} projects in total
              </span>
            </div>
            <span className="facts-place muted">
              <MapPin size={14} aria-hidden="true" /> {profile.locationBn}
            </span>
          </aside>
        </div>
      </section>

      <section className="section wrap" id="method" aria-labelledby="method-title">
        <div className="section-head">
          <p className="eyebrow">How I build</p>
          <h2 id="method-title" className="h-1">
            Six rules I do not break.
          </h2>
          <p className="lede">
            Every one of these was written down before the code, and every one of them is traceable to a
            repository you can open.
          </p>
        </div>
        <div className="rules">
          {principles.map((rule, index) => (
            <Reveal key={rule.n} delay={index * 60} className="rule glass lift">
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

      <section className="section wrap" aria-labelledby="now-title">
        <div className="now glass is-strong">
          <div>
            <p className="eyebrow">Most recent work</p>
            <h2 id="now-title" className="h-2">
              What the commit history says I’ve been doing.
            </h2>
            <ol className="now-list">
              {recent.map(project => (
                <li key={project.id}>
                  <Link to={`/projects/${project.id}`}>
                    <strong>{project.name}</strong>
                    <span className="muted">{project.tagline}</span>
                    <time className="mono" dateTime={project.updated}>
                      last commit {project.updated}
                    </time>
                  </Link>
                </li>
              ))}
            </ol>
            <Link to="/build-log" className="link-arrow">
              The full build log <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="now-char">
            <Character name="boy-coffee" sizes="(max-width: 760px) 55vw, 280px" />
            <Note className="now-note" tilt={-4}>
              {notes.build[0]}
            </Note>
          </div>
        </div>
      </section>
    </>
  );
}
