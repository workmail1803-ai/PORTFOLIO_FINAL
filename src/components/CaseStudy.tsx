import { useEffect, useRef } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { GithubMark } from './icons';
import type { Project } from '../data/projects';

const STATUS_LABEL: Record<Project['status'], string> = {
  live: 'Live in production',
  shipped: 'Shipped and in use',
  research: 'Research prototype',
  prototype: 'In development',
};

export function CaseStudy({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = dialog.current;
    if (!project || !node) return;
    const previous = document.activeElement as HTMLElement | null;
    node.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      node.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [project]);

  return (
    <dialog
      ref={dialog}
      className="case"
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
      onClick={event => {
        if (event.target === dialog.current) onClose();
      }}
      aria-labelledby="case-title"
    >
      {project && (
        <article className="case-body" style={{ ['--accent' as string]: project.accent }}>
          <button className="case-close" onClick={onClose} aria-label="Close case study" data-cursor="close">
            <X size={18} />
          </button>

          <header className="case-head">
            <span className="mono case-kicker">
              <i className={`dot dot-${project.status}`} />
              {STATUS_LABEL[project.status]} · {project.kind} · {project.year}
            </span>
            <h2 id="case-title" className="display d3">
              {project.name}
            </h2>
            {project.nameBn && <p className="bn case-bn">{project.nameBn}</p>}
            <p className="case-tagline">{project.tagline}</p>
          </header>

          {project.image && (
            <figure className="case-shot">
              <img
                src={project.image}
                alt={`${project.name} — captured from the live site`}
                width="1600"
                height="1000"
                loading="lazy"
              />
              <figcaption className="mono">Captured from the live site</figcaption>
            </figure>
          )}

          <p className="case-summary">{project.summary}</p>

          <div className="case-metrics">
            {project.metrics.map(metric => (
              <div key={metric.label}>
                <strong>{metric.value}</strong>
                <span className="mono">{metric.label}</span>
              </div>
            ))}
          </div>

          <section className="case-section">
            <h3 className="mono">What it does</h3>
            <ul className="case-list">
              {project.highlights.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="case-section">
            <h3 className="mono">The engineering decision</h3>
            <p className="case-craft">{project.craft}</p>
          </section>

          <section className="case-section">
            <h3 className="mono">What I am not claiming</h3>
            <p className="case-honest">{project.honest}</p>
          </section>

          <section className="case-section">
            <h3 className="mono">Built with</h3>
            <div className="chips">
              {project.stack.map(item => (
                <span className="chip" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </section>

          <footer className="case-links">
            {project.live && (
              <a
                className="btn btn-primary"
                href={project.live}
                target="_blank"
                rel="noreferrer"
                data-cursor="visit"
              >
                {project.liveLabel ?? 'Open live'} <ArrowUpRight size={17} />
              </a>
            )}
            <a className="btn btn-ghost" href={project.repo} target="_blank" rel="noreferrer" data-cursor="code">
              <GithubMark size={16} /> Source
            </a>
            <span className="mono case-stat">
              {project.commits} commits · {project.files} files
            </span>
          </footer>
        </article>
      )}
    </dialog>
  );
}
