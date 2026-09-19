import { ArrowUpRight, GraduationCap } from 'lucide-react';
import { Link } from '../router/router';
import { Character } from '../characters/Character';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/motion';
import { education } from '../data/content';
import { projects } from '../data/projects';
import { profile } from '../data/profile';
import { useTitle } from '../lib/hooks';

export function Education() {
  useTitle(`Education · ${profile.name}`, `${profile.study}.`);

  return (
    <>
      <PageHero
        id="education-title"
        eyebrow="Education"
        title={
          <>
            Still in school. <span className="grad">Already shipping.</span>
          </>
        }
        lede="Studying computer science while building production software. Where a course produced real work, the work is linked below."
        note="One step at a time."
        character={<Character name="girl-laptop" priority sizes="(max-width: 760px) 70vw, 380px" className="page-hero-char" />}
      />

      <section className="section wrap" aria-labelledby="school-title">
        <h2 id="school-title" className="sr-only">
          Institutions
        </h2>
        <ol className="timeline is-academic">
          {education.map(entry => (
            <li key={entry.institution} className="timeline-item">
              <span className="timeline-dot" aria-hidden="true" />
              <Reveal className="timeline-card glass is-strong school">
                <div className="school-head">
                  <span className="stat-icon" aria-hidden="true">
                    <GraduationCap size={18} />
                  </span>
                  <div>
                    <h3 className="h-2">{entry.institution}</h3>
                    <p className="lede">{[entry.degree, entry.field].filter(Boolean).join(', ')}</p>
                  </div>
                </div>

                {(entry.period || entry.result) && (
                  <dl className="case-facts">
                    {entry.period && (
                      <div>
                        <dt className="mono">Period</dt>
                        <dd>{entry.period}</dd>
                      </div>
                    )}
                    {entry.result && (
                      <div>
                        <dt className="mono">Result</dt>
                        <dd>{entry.result}</dd>
                      </div>
                    )}
                  </dl>
                )}

                {entry.work?.length ? (
                  <div className="school-work">
                    <p className="eyebrow">Coursework with real output</p>
                    {entry.work.map(work => {
                      const project = projects.find(p => p.id === work.projectId);
                      if (!project) return null;
                      return (
                        <Link key={work.course} to={`/projects/${project.id}`} className="school-project glass lift">
                          <span className="mono">{work.course}</span>
                          <strong>{project.name}</strong>
                          <span className="muted">{project.tagline}</span>
                          <ArrowUpRight size={16} aria-hidden="true" />
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </Reveal>
            </li>
          ))}
        </ol>
        <div className="school-char">
          <Character name="boy-coffee" sizes="(max-width: 760px) 50vw, 240px" />
        </div>
      </section>
    </>
  );
}
