import { ArrowUpRight, BookOpen, Bot, FlaskConical, Globe2, LayoutGrid, ShoppingBag } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from '../router/router';
import type { Project, Status } from '../data/projects';
import { GithubMark } from './icons';
import { Tilt } from './motion';

const STATUS: Record<Status, string> = {
  live: 'Live',
  shipped: 'Shipped',
  research: 'Research',
  prototype: 'In development',
};

export function StatusTag({ status }: { status: Status }) {
  return (
    <span className={`status is-${status}`}>
      <i aria-hidden="true" />
      {STATUS[status]}
    </span>
  );
}

export const KIND_ICON: Record<Project['kind'], ReactNode> = {
  Platform: <LayoutGrid size={18} aria-hidden="true" />,
  Directory: <Globe2 size={18} aria-hidden="true" />,
  Automation: <Bot size={18} aria-hidden="true" />,
  Research: <FlaskConical size={18} aria-hidden="true" />,
  Commerce: <ShoppingBag size={18} aria-hidden="true" />,
};

export function ProjectLinks({ project, size = 'md' }: { project: Project; size?: 'md' | 'sm' }) {
  const cls = size === 'sm' ? 'btn btn-ghost btn-sm' : 'btn btn-ghost';
  return (
    <div className="btn-row">
      <Link to={`/projects/${project.id}`} className={size === 'sm' ? 'btn btn-primary btn-sm' : 'btn btn-primary'}>
        <BookOpen size={15} aria-hidden="true" /> Case study
      </Link>
      {project.live && (
        <a className={cls} href={project.live} target="_blank" rel="noreferrer">
          {project.liveLabel ?? 'Live'} <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      )}
      <a className={cls} href={project.repo} target="_blank" rel="noreferrer" aria-label={`${project.name} source on GitHub`}>
        <GithubMark size={15} /> Source
      </a>
    </div>
  );
}

/** A screenshot when one exists; otherwise a designed tile, never a fake screen. */
export function ProjectVisual({ project, eager = false }: { project: Project; eager?: boolean }) {
  if (project.image) {
    return (
      <img
        src={project.image}
        srcSet={project.imageSm ? `${project.imageSm} 760w, ${project.image} 1600w` : undefined}
        sizes="(max-width: 760px) 92vw, 30vw"
        alt={`${project.name}, captured from the live site`}
        width="1600"
        height="1000"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    );
  }
  if (project.id === 'pixelsub') {
    // The bot's real flow, with its real /start command. No invented products.
    return (
      <div className="visual-chat" aria-label="Illustration of the PixelSub Telegram flow">
        <span className="chat-cmd">/start</span>
        <span className="chat-bubble">Choose a product</span>
        <span className="chat-bubble is-me">Pay with crypto</span>
        <span className="chat-bubble is-ok">Payment confirmed, delivered</span>
        <span className="chat-meta">@PixelsubCCBOT</span>
      </div>
    );
  }
  return (
    <div className="visual-tile" style={{ ['--accent' as string]: project.accent }} aria-hidden="true">
      <span className="visual-icon">{KIND_ICON[project.kind]}</span>
      <strong>{project.metrics[0]?.value}</strong>
      <span>{project.metrics[0]?.label}</span>
    </div>
  );
}

export function ProjectCard({ project, featured = false }: { project: Project; featured?: boolean }) {
  return (
    <Tilt className="project-tilt" max={5}>
      <article
        className={`project-card glass lift ${featured ? 'is-featured' : ''}`}
        style={{ ['--accent' as string]: project.accent }}
      >
        <Link to={`/projects/${project.id}`} className="project-media" tabIndex={-1} aria-hidden="true">
          <ProjectVisual project={project} />
        </Link>
        <div className="project-body">
          <div className="project-meta">
            <span className="project-kind">
              {KIND_ICON[project.kind]}
              {project.kind}
            </span>
            <StatusTag status={project.status} />
          </div>
          <h3 className="h-3">
            <Link to={`/projects/${project.id}`} className="project-title">
              {project.name}
            </Link>
          </h3>
          <p className="project-tagline">{project.tagline}</p>
          <div className="chips">
            {project.stack.slice(0, featured ? 6 : 4).map(item => (
              <span className="chip" key={item}>
                {item}
              </span>
            ))}
          </div>
          <div className="project-foot">
            <Link to={`/projects/${project.id}`} className="link-arrow">
              Case study <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
            <span className="project-links">
              {project.live && (
                <a href={project.live} target="_blank" rel="noreferrer" className="icon-btn" aria-label={`Open ${project.name}`}>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              )}
              <a href={project.repo} target="_blank" rel="noreferrer" className="icon-btn" aria-label={`${project.name} source on GitHub`}>
                <GithubMark size={16} />
              </a>
            </span>
          </div>
        </div>
      </article>
    </Tilt>
  );
}
