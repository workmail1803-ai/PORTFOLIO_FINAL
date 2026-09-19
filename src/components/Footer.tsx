import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '../router/router';
import { ROUTES } from '../routes';
import { profile } from '../data/profile';
import { notes } from '../data/content';
import { Character } from '../characters/Character';
import { GithubMark, LinkedinMark, WhatsappMark } from './icons';
import { Clock } from './Clock';

const pages = ROUTES.filter(r => r.enabled && r.nav !== 'none');

export function Footer() {
  const [woke, setWoke] = useState(0);
  const lines = ['zZz…', 'five more minutes…', 'okay, okay, I’m up.', 'zZz…'];

  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div>
          <Link to="/" className="brand" aria-label="Home">
            Nafis<i>.</i>
          </Link>
          <p className="muted" style={{ marginTop: '0.7rem', maxWidth: '32ch', fontSize: '0.92rem' }}>
            {profile.name}, {profile.role.toLowerCase()} in {profile.location}.
          </p>
          <div className="socials" style={{ marginTop: '1.1rem' }}>
            <a className="icon-btn" href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub">
              <GithubMark size={17} />
            </a>
            <a className="icon-btn" href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <LinkedinMark size={17} />
            </a>
            <a className="icon-btn" href={profile.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp">
              <WhatsappMark size={17} />
            </a>
          </div>
        </div>

        <div>
          <h2>Pages</h2>
          <div className="footer-links" style={{ gridTemplateColumns: '1fr 1fr', columnGap: '1.5rem' }}>
            {pages.map(route => (
              <Link key={route.name} to={route.path}>
                {route.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2>Reach me</h2>
          <div className="footer-links">
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <a href={profile.github} target="_blank" rel="noreferrer">
              github.com/workmail1803-ai <ArrowUpRight size={12} aria-hidden="true" style={{ display: 'inline' }} />
            </a>
            <Link to="/resume">Résumé</Link>
            <span className="muted" style={{ fontSize: '0.92rem' }}>
              <Clock bare /> in Dhaka
            </span>
          </div>
        </div>

        <div className="footer-motto hand" aria-hidden="true">
          {notes.footer.map(line => (
            <span key={line}>{line}</span>
          ))}
        </div>
      </div>

      <div className="wrap">
        <button
          type="button"
          className="footer-sleep"
          onClick={() => setWoke(n => (n + 1) % lines.length)}
          aria-label="Wake the sleeping developer"
        >
          <Character name="boy-sleep" idle="breathe" react={false} sizes="250px" />
          <span className="footer-snore hand" aria-live="polite">
            {lines[woke]}
          </span>
        </button>
      </div>

      <div className="wrap footer-base">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span>
          {profile.location} · <span className="bn">{profile.locationBn}</span>
        </span>
      </div>
    </footer>
  );
}
