/**
 * Pages whose content does not exist yet.
 *
 * They are fully built and wired to `src/data/content.ts`, but routes.ts keeps
 * them out of the router and the navigation while their arrays are empty. Add
 * a real entry and the page appears — nothing is ever invented to fill one.
 */
import { ArrowUpRight, Award, CalendarDays, Clock3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Character } from '../characters/Character';
import { PageHero } from '../components/PageHero';
import { Reveal } from '../components/motion';
import { achievements, certifications, posts, testimonials, type Achievement } from '../data/content';
import { profile } from '../data/profile';
import { useTitle } from '../lib/hooks';

const date = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function AwardCard({ item }: { item: Achievement }) {
  const body = (
    <>
      <span className="stat-icon" aria-hidden="true">
        <Award size={18} />
      </span>
      <h3 className="h-3">{item.title}</h3>
      <p className="muted">{item.issuer}</p>
      <time className="mono" dateTime={item.date}>
        {date(item.date)}
      </time>
      {item.note && <p className="muted">{item.note}</p>}
    </>
  );
  return item.url ? (
    <a className="award glass lift" href={item.url} target="_blank" rel="noreferrer">
      {body}
    </a>
  ) : (
    <div className="award glass">{body}</div>
  );
}

export function Achievements() {
  useTitle(`Achievements · ${profile.name}`);
  return (
    <>
      <PageHero
        id="achievements-title"
        eyebrow="Achievements"
        title={
          <>
            Small steps, <span className="grad">big wins.</span>
          </>
        }
        character={<Character name="girl-peace" priority sizes="380px" className="page-hero-char" />}
      />
      {[
        ['Awards & recognition', achievements],
        ['Certifications', certifications],
      ].map(([title, items]) =>
        (items as Achievement[]).length ? (
          <section className="section wrap" key={title as string}>
            <h2 className="h-2 section-head">{title as string}</h2>
            <div className="rules">
              {(items as Achievement[]).map(item => (
                <Reveal key={item.title}>
                  <AwardCard item={item} />
                </Reveal>
              ))}
            </div>
          </section>
        ) : null,
      )}
    </>
  );
}

export function Blog() {
  useTitle(`Writing · ${profile.name}`);
  const categories = ['All', ...Array.from(new Set(posts.map(p => p.category)))];
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const shown = useMemo(
    () =>
      [...posts]
        .sort((a, b) => b.date.localeCompare(a.date))
        .filter(p => category === 'All' || p.category === category)
        .filter(p => !query || `${p.title} ${p.excerpt}`.toLowerCase().includes(query.toLowerCase())),
    [category, query],
  );

  return (
    <>
      <PageHero
        id="blog-title"
        eyebrow="Writing"
        title={
          <>
            Thoughts, experiences <span className="grad">and ideas.</span>
          </>
        }
        character={<Character name="boy-coffee" priority sizes="380px" className="page-hero-char" />}
      />
      <section className="section wrap">
        <div className="toolbar glass">
          <div className="filter-chips" role="group" aria-label="Filter by category">
            {categories.map(c => (
              <button key={c} type="button" className="filter-chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
          <label className="search">
            <span className="sr-only">Search posts</span>
            <input type="search" placeholder="Search posts…" value={query} onChange={e => setQuery(e.target.value)} />
          </label>
        </div>
        <div className="project-grid">
          {shown.map(post => (
            <a key={post.slug} className="post glass lift" href={post.url}>
              <span className="chip">{post.category}</span>
              <h3 className="h-3">{post.title}</h3>
              <p className="muted">{post.excerpt}</p>
              <span className="mono">
                <CalendarDays size={12} aria-hidden="true" /> {date(post.date)}
                {post.minutes ? (
                  <>
                    {' '}
                    · <Clock3 size={12} aria-hidden="true" /> {post.minutes} min
                  </>
                ) : null}
              </span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}

/** Rendered on the home page only when testimonials exist. */
export function Testimonials() {
  if (!testimonials.length) return null;
  return (
    <section className="section wrap" aria-labelledby="testimonials-title">
      <div className="section-head">
        <p className="eyebrow">Kind words</p>
        <h2 id="testimonials-title" className="h-1">
          What people say.
        </h2>
      </div>
      <div className="rules">
        {testimonials.map(t => (
          <figure key={t.name} className="glass rule">
            <blockquote>“{t.quote}”</blockquote>
            <figcaption className="muted">
              <strong>{t.name}</strong>, {t.role}, {t.company}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
