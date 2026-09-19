import { Download, Mail, MapPin } from 'lucide-react';
import { Character } from '../characters/Character';
import { GithubMark, LinkedinMark, WhatsappMark } from '../components/icons';
import { profile } from '../data/profile';
import { principles, projects, stack, totals } from '../data/projects';
import { about, education, hero } from '../data/content';
import { useTitle } from '../lib/hooks';

const month = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
const span = (a: string, b: string) => (month(a) === month(b) ? month(a) : `${month(a)} to ${month(b)}`);

const selected = projects.filter(p => p.scale !== 'minor');
const other = projects.filter(p => p.scale === 'minor');
const host = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

/**
 * The résumé is the site's own data laid out as a document. "Download" uses
 * the browser's save-as-PDF with a print stylesheet, so the PDF can never
 * drift out of date the way a committed file would.
 */
export function Resume() {
  useTitle(`Résumé · ${profile.name}`, `${profile.name}, ${profile.role.toLowerCase()} in ${profile.location}.`);

  return (
    <section className="wrap resume-page" aria-labelledby="resume-name">
      <div className="resume-top no-print">
        <div>
          <p className="eyebrow">Résumé</p>
          <p className="muted">Everything here comes from the same data as the rest of the site.</p>
        </div>
        <button type="button" className="btn btn-primary btn-lg" onClick={() => window.print()}>
          <Download size={17} aria-hidden="true" /> Download PDF
        </button>
        <Character name="girl-point" className="resume-char" sizes="200px" flip />
      </div>

      <article className="resume-doc">
        <header className="resume-head">
          <div>
            <h1 id="resume-name">{profile.name}</h1>
            <p className="resume-role">{profile.role}</p>
          </div>
          <ul className="resume-contact">
            <li>
              <MapPin size={14} aria-hidden="true" /> {profile.location}
            </li>
            <li>
              <Mail size={14} aria-hidden="true" /> <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </li>
            <li>
              <GithubMark size={14} /> <a href={profile.github}>{host(profile.github)}</a>
            </li>
            <li>
              <LinkedinMark size={14} /> <a href={profile.linkedin}>{host(profile.linkedin)}</a>
            </li>
            <li>
              <WhatsappMark size={14} /> <a href={profile.whatsapp}>WhatsApp</a>
            </li>
          </ul>
        </header>

        <section className="resume-section">
          <h2>Summary</h2>
          <p>
            {about.lede} {totals.live} {hero.lede}
          </p>
        </section>

        <section className="resume-section">
          <h2>Selected work</h2>
          {selected.map(project => (
            <div className="resume-item" key={project.id}>
              <div className="resume-item-head">
                <h3>
                  {project.name} <span>· {project.kind}</span>
                </h3>
                <time dateTime={project.started}>{span(project.started, project.updated)}</time>
              </div>
              <p>{project.summary}</p>
              <p className="resume-metrics">
                {project.metrics.map(m => `${m.value} ${m.label}`).join(' · ')}
              </p>
              <p className="resume-links">
                {project.live && <a href={project.live}>{project.liveLabel ?? host(project.live)}</a>}
                <a href={project.repo}>{host(project.repo)}</a>
              </p>
            </div>
          ))}
        </section>

        <section className="resume-section">
          <h2>Also built</h2>
          <ul className="resume-list">
            {other.map(project => (
              <li key={project.id}>
                <strong>{project.name}</strong>: {project.tagline}
              </li>
            ))}
          </ul>
        </section>

        <div className="resume-columns">
          <section className="resume-section">
            <h2>Skills</h2>
            {stack.map(group => (
              <p key={group.group} className="resume-skill">
                <strong>{group.group}:</strong> {group.items.join(', ')}
              </p>
            ))}
          </section>

          <section className="resume-section">
            <h2>Education</h2>
            {education.map(entry => (
              <div key={entry.institution} className="resume-item">
                <h3>{entry.institution}</h3>
                <p>{[entry.degree, entry.field, entry.period, entry.result].filter(Boolean).join(' · ')}</p>
                {entry.work?.map(work => (
                  <p key={work.course} className="resume-metrics">
                    {work.course} ({projects.find(p => p.id === work.projectId)?.name})
                  </p>
                ))}
              </div>
            ))}

            <h2 style={{ marginTop: '1.4rem' }}>How I work</h2>
            <ul className="resume-list">
              {principles.map(rule => (
                <li key={rule.n}>{rule.title}</li>
              ))}
            </ul>
          </section>
        </div>
      </article>
    </section>
  );
}
