import { useMemo, useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { Link } from '../router/router';
import { Character } from '../characters/Character';
import { Note, SitOn } from '../characters/Poses';
import { PageHero } from '../components/PageHero';
import { ProjectCard, ProjectLinks, ProjectVisual, StatusTag } from '../components/Project';
import { projects, totals, type Project } from '../data/projects';
import { notes } from '../data/content';
import { profile } from '../data/profile';
import { useTitle } from '../lib/hooks';

const KINDS = ['All', ...Array.from(new Set(projects.map(p => p.kind)))];
const STATUSES: Array<[Project['status'] | 'all', string]> = [
  ['all', 'Any status'],
  ['live', 'Live'],
  ['shipped', 'Shipped'],
  ['research', 'Research'],
  ['prototype', 'In development'],
];
const SORTS = {
  recent: { label: 'Most recent activity', fn: (a: Project, b: Project) => b.updated.localeCompare(a.updated) },
  commits: { label: 'Most commits', fn: (a: Project, b: Project) => b.commits - a.commits },
  name: { label: 'Name', fn: (a: Project, b: Project) => a.name.localeCompare(b.name) },
};
type SortKey = keyof typeof SORTS;

const featured = projects.find(p => p.id === 'allbanglapaper')!;

export function Projects() {
  useTitle(`Projects · ${profile.name}`, `${totals.projects} projects, ${totals.live} of them live: case studies, source and the decisions behind them.`);
  const [kind, setKind] = useState('All');
  const [status, setStatus] = useState<Project['status'] | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects
      .filter(p => kind === 'All' || p.kind === kind)
      .filter(p => status === 'all' || p.status === status)
      .filter(
        p =>
          !q ||
          [p.name, p.nameBn ?? '', p.tagline, p.summary, p.kind, ...p.stack].some(field => field.toLowerCase().includes(q)),
      )
      .sort(SORTS[sort].fn);
  }, [kind, status, query, sort]);

  return (
    <>
      <PageHero
        id="projects-title"
        eyebrow="Projects"
        title={
          <>
            Ideas turned <span className="grad">into reality.</span>
          </>
        }
        lede={`${totals.projects} projects, ${totals.live} you can open right now. Each has a case study, its source, and a note on what it does not claim.`}
        note={notes.projects[0]}
        character={<Character name="girl-peace" priority sizes="(max-width: 760px) 70vw, 380px" className="page-hero-char" />}
      />

      <section className="section wrap" aria-labelledby="featured-project-title">
        <SitOn width="30%" className="featured-sit">
          <article className="featured-project glass is-strong" style={{ ['--accent' as string]: featured.accent }}>
            <div className="featured-project-media">
              <ProjectVisual project={featured} eager />
            </div>
            <div className="featured-project-copy">
              <p className="eyebrow">Featured</p>
              <h2 id="featured-project-title" className="h-2">
                {featured.name}
              </h2>
              {featured.nameBn && <p className="bn muted">{featured.nameBn}</p>}
              <p className="lede">{featured.tagline}</p>
              <div className="featured-metrics">
                {featured.metrics.map(m => (
                  <div key={m.label}>
                    <strong>{m.value}</strong>
                    <span className="mono">{m.label}</span>
                  </div>
                ))}
              </div>
              <ProjectLinks project={featured} />
            </div>
          </article>
        </SitOn>
      </section>

      <section className="section wrap" aria-labelledby="all-title">
        <div className="section-head">
          <p className="eyebrow">Everything</p>
          <h2 id="all-title" className="h-2">
            All projects
          </h2>
        </div>

        <div className="toolbar glass">
          <div className="filter-chips" role="group" aria-label="Filter by type">
            {KINDS.map(k => (
              <button key={k} type="button" className="filter-chip" aria-pressed={kind === k} onClick={() => setKind(k)}>
                {k}
              </button>
            ))}
          </div>
          <div className="toolbar-controls">
            <label className="search">
              <Search size={16} aria-hidden="true" />
              <span className="sr-only">Search projects</span>
              <input
                type="search"
                placeholder="Search name, stack…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </label>
            <label className="select">
              <span className="sr-only">Filter by status</span>
              <select value={status} onChange={e => setStatus(e.target.value as Project['status'] | 'all')}>
                {STATUSES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="select">
              <span className="sr-only">Sort projects</span>
              <select value={sort} onChange={e => setSort(e.target.value as SortKey)}>
                {Object.entries(SORTS).map(([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <p className="results-count mono" role="status">
          {results.length} of {projects.length} shown
        </p>

        {results.length ? (
          <div className="project-grid">
            {results.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="empty glass">
            <Character name="girl-think" sizes="220px" className="empty-char" />
            <div>
              <h3 className="h-3">Nothing matches that.</h3>
              <p className="muted">Try another type, status, or a shorter search.</p>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setKind('All');
                  setStatus('all');
                  setQuery('');
                }}
              >
                Clear filters
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="section wrap">
        <div className="more-links">
          <Link to="/lab" className="more-link glass lift">
            <StatusTag status="research" />
            <strong>The lab</strong>
            <span className="muted">Research, automation and prototypes.</span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          <Link to="/build-log" className="more-link glass lift">
            <StatusTag status="shipped" />
            <strong>Build log</strong>
            <span className="muted">Every project in the order it began.</span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
          <Note className="more-note" tilt={-5}>
            Ideas → Reality
          </Note>
        </div>
      </section>
    </>
  );
}
