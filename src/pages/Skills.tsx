import { useState } from 'react';
import { Link } from '../router/router';
import { Character } from '../characters/Character';
import { PageHero } from '../components/PageHero';
import { Reveal, Tilt } from '../components/motion';
import { stack } from '../data/projects';
import { toolbox, toolGroups } from '../data/toolbox';
import { profile } from '../data/profile';
import { useTitle } from '../lib/hooks';

export function Skills() {
  useTitle(`Skills & tools · ${profile.name}`, 'The languages, frameworks and tools behind the projects, and where each one is used.');
  const [group, setGroup] = useState('All');
  const [picked, setPicked] = useState<string | null>(null);
  const shown = toolbox.filter(tool => group === 'All' || tool.group === group);
  const active = toolbox.find(tool => tool.name === picked);

  return (
    <>
      <PageHero
        id="skills-title"
        eyebrow="Skills & tools"
        title={
          <>
            My skills <span className="grad">&amp; tools.</span>
          </>
        }
        lede="The kit I reach for, grouped the way I think about it. Below, every tool that shows up in a real project, with the projects it shipped in."
        note="Keep learning."
        character={<Character name="girl-point" priority flip sizes="(max-width: 760px) 80vw, 440px" className="page-hero-char" />}
      />

      <section className="section wrap" aria-labelledby="groups-title">
        <div className="section-head">
          <p className="eyebrow">Core skills</p>
          <h2 id="groups-title" className="h-2">
            The main areas I work in.
          </h2>
        </div>
        <div className="skill-groups">
          {stack.map((g, index) => (
            <Reveal key={g.group} delay={index * 60} className="skill-group glass lift">
              <h3 className="h-3">{g.group}</h3>
              <div className="chips">
                {g.items.map(item => (
                  <span className="chip" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section wrap" aria-labelledby="toolbox-title">
        <div className="section-head is-split">
          <div>
            <p className="eyebrow">My toolbox</p>
            <h2 id="toolbox-title" className="h-2">
              Where each tool was actually used.
            </h2>
            <p className="muted">Pick one to see the projects it shipped in. Counts are real projects, not ratings.</p>
          </div>
          <div className="filter-chips" role="group" aria-label="Filter tools by area">
            {toolGroups.map(g => (
              <button
                key={g}
                type="button"
                className="filter-chip"
                aria-pressed={group === g}
                onClick={() => setGroup(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="toolbox">
          <div className="tool-grid">
            {shown.map(tool => (
              <Tilt key={tool.name} max={8} className="tool-tilt">
                <button
                  type="button"
                  className="tool glass"
                  aria-pressed={picked === tool.name}
                  onClick={() => setPicked(p => (p === tool.name ? null : tool.name))}
                  onPointerEnter={() => setPicked(tool.name)}
                >
                  <span className="tool-mark" aria-hidden="true">
                    {tool.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2)}
                  </span>
                  <span className="tool-name">{tool.name}</span>
                  <span className="tool-count mono">
                    {tool.projects.length
                      ? `${tool.projects.length} project${tool.projects.length === 1 ? '' : 's'}`
                      : 'in the kit'}
                  </span>
                </button>
              </Tilt>
            ))}
          </div>

          <aside className="tool-detail glass is-strong" aria-live="polite">
            <Character name="boy-point" className="tool-detail-char" sizes="160px" />
            {active ? (
              <>
                <p className="eyebrow">{active.group}</p>
                <h3 className="h-2">{active.name}</h3>
                {active.projects.length ? (
                  <ul className="tool-projects">
                    {active.projects.map(project => (
                      <li key={project.id}>
                        <Link to={`/projects/${project.id}`}>
                          <strong>{project.name}</strong>
                          <span className="muted">{project.kind}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Part of the kit, but not listed in a published project’s stack yet.</p>
                )}
              </>
            ) : (
              <>
                <p className="eyebrow">Toolbox</p>
                <h3 className="h-2">{toolbox.length} tools</h3>
                <p className="muted">Hover or select one to see where it was used.</p>
              </>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
