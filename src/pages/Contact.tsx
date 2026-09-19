import { useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, Check, Copy, Mail, MapPin, Send } from 'lucide-react';
import { Character } from '../characters/Character';
import { Note } from '../characters/Poses';
import { anchor } from '../characters/assets';
import { GithubMark, LinkedinMark, WhatsappMark } from '../components/icons';
import { Clock } from '../components/Clock';
import { about, notes } from '../data/content';
import { profile } from '../data/profile';
import { burst, rippleFrom, wait } from '../lib/burst';
import { useTitle } from '../lib/hooks';

const TOPICS = ['A project', 'A collaboration', 'A job or contract', 'Just saying hello'];
const openTo = about.facts.find(([label]) => label === 'Open to')?.[1];

export function Contact() {
  useTitle(`Contact · ${profile.name}`, 'Email, GitHub, LinkedIn and WhatsApp, or write a message here.');
  const [copied, setCopied] = useState(false);
  /** The composed mail, kept so the visitor can reopen it if nothing opened. */
  const [sent, setSent] = useState<string | null>(null);
  const [pressing, setPressing] = useState(false);
  const sendRef = useRef<HTMLButtonElement>(null);
  const [cx, cy] = anchor('boy-present', 'cardCentre');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };

  /**
   * There is no server behind this form, and it does not pretend otherwise:
   * it composes the message in the visitor's own mail app. Nothing is stored.
   */
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const topic = String(data.get('topic') ?? '');
    const message = String(data.get('message') ?? '').trim();

    setPressing(true);
    const button = sendRef.current;
    if (button) burst(button, button.offsetWidth / 2, button.offsetHeight / 2, { sparks: 12 });
    await wait(320);
    setPressing(false);

    const subject = `${topic}, from ${name}`;
    const body = `${message}\n\n${name}${email ? ` (${email})` : ''}`;
    const mail = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mail;
    setSent(mail);
  };

  return (
    <>
      <section className="contact-hero wrap" aria-labelledby="contact-title">
        <div className="contact-copy">
          <p className="eyebrow">Contact</p>
          <h1 id="contact-title" className="h-1">
            Let’s build something <span className="grad">great</span> together.
          </h1>
          <p className="lede">Tell me what is not working yet. I reply from Dhaka, usually the same day.</p>

          <ul className="reach">
            <li>
              <a className="reach-card glass lift" href={`mailto:${profile.email}`}>
                <span className="stat-icon" aria-hidden="true">
                  <Mail size={18} />
                </span>
                <span>
                  <strong>Email</strong>
                  <span className="muted">{profile.email}</span>
                </span>
              </a>
            </li>
            <li>
              <a className="reach-card glass lift" href={profile.github} target="_blank" rel="noreferrer">
                <span className="stat-icon" aria-hidden="true">
                  <GithubMark size={18} />
                </span>
                <span>
                  <strong>GitHub</strong>
                  <span className="muted">workmail1803-ai</span>
                </span>
              </a>
            </li>
            <li>
              <a className="reach-card glass lift" href={profile.linkedin} target="_blank" rel="noreferrer">
                <span className="stat-icon" aria-hidden="true">
                  <LinkedinMark size={18} />
                </span>
                <span>
                  <strong>LinkedIn</strong>
                  <span className="muted">nafis-hossain-momen</span>
                </span>
              </a>
            </li>
            <li>
              <a className="reach-card glass lift" href={profile.whatsapp} target="_blank" rel="noreferrer">
                <span className="stat-icon" aria-hidden="true">
                  <WhatsappMark size={18} />
                </span>
                <span>
                  <strong>WhatsApp</strong>
                  <span className="muted">Quick messages</span>
                </span>
              </a>
            </li>
          </ul>
        </div>

        <div className="present">
          <Character name="boy-present" priority sizes="(max-width: 760px) 86vw, 500px">
            <div className="present-card glass is-strong" style={{ left: `${cx * 100}%`, top: `${cy * 100}%` }}>
              <span className="stat-icon" aria-hidden="true">
                <Mail size={18} />
              </span>
              <strong>Write to me</strong>
              <span className="muted present-email">{profile.email}</span>
              <span className="present-actions">
                <a className="btn btn-primary btn-sm" href={`mailto:${profile.email}`}>
                  <Send size={14} aria-hidden="true" /> Email
                </a>
                <button type="button" className="btn btn-ghost btn-sm" onClick={copy} aria-label="Copy email address">
                  {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </span>
            </div>
          </Character>
          <Note className="present-note" tilt={-5}>
            {notes.contact[0]}
            <br />
            {notes.contact[1]}
          </Note>
        </div>
      </section>

      <section className="section wrap" aria-labelledby="form-title">
        <div className="contact-grid">
          <div className="contact-form glass is-strong">
            {sent ? (
              <div className="sent" role="status">
                <Character name="girl-peace" sizes="220px" className="sent-char" />
                <div>
                  <h2 className="h-2">Nearly there.</h2>
                  <p className="lede">
                    Your mail app should have opened with the message ready to send. If it didn’t,{' '}
                    <a className="sent-retry" href={sent}>open it again</a> or email{' '}
                    <a href={`mailto:${profile.email}`}>{profile.email}</a> directly.
                  </p>
                  <button type="button" className="btn btn-ghost" onClick={() => setSent(null)}>
                    Write another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} noValidate={false}>
                <h2 id="form-title" className="h-2">
                  Send a message
                </h2>
                <p className="muted form-note">
                  This opens your own email app with everything filled in. Nothing is stored on this site.
                </p>
                <div className="form-row">
                  <div className="field">
                    <label htmlFor="c-name">Your name</label>
                    <input id="c-name" name="name" autoComplete="name" required />
                  </div>
                  <div className="field">
                    <label htmlFor="c-email">Your email</label>
                    <input id="c-email" name="email" type="email" autoComplete="email" required />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="c-topic">What is it about?</label>
                  <select id="c-topic" name="topic" defaultValue={TOPICS[0]}>
                    {TOPICS.map(topic => (
                      <option key={topic}>{topic}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="c-message">Message</label>
                  <textarea id="c-message" name="message" required minLength={10} />
                </div>
                <button
                  ref={sendRef}
                  type="submit"
                  className={`btn btn-primary btn-lg send-btn ${pressing ? 'is-pressed' : ''}`}
                  onPointerDown={rippleFrom}
                >
                  <Send size={17} aria-hidden="true" /> Send message
                </button>
              </form>
            )}
          </div>

          <aside className="contact-side">
            <div className="glass contact-where">
              <p className="eyebrow">
                <MapPin size={13} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> Location
              </p>
              <p className="h-3">{profile.location}</p>
              <p className="bn muted">{profile.locationBn}</p>
              <p className="muted">
                It is <Clock bare /> here right now (UTC+{profile.utcOffset}).
              </p>
            </div>
            {openTo && (
              <div className="glass contact-where">
                <p className="eyebrow">Open to</p>
                <p>{openTo}</p>
              </div>
            )}
            <a className="glass contact-where lift" href={profile.github} target="_blank" rel="noreferrer">
              <p className="eyebrow">Before you write</p>
              <p>Every project’s source is public. Have a look at how I work first.</p>
              <span className="link-arrow">
                GitHub <ArrowUpRight size={14} aria-hidden="true" />
              </span>
            </a>
          </aside>
        </div>
      </section>
    </>
  );
}
