import { useState } from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { Link } from '../router/router';
import { Character } from '../characters/Character';
import { useTitle } from '../lib/hooks';

const THOUGHTS = [
  'Hmm…',
  'Was it here a second ago?',
  'Maybe it wandered off to the lab.',
  'Checked under the laptop. Nothing.',
  'Okay, let’s just go home.',
];

export function NotFound() {
  useTitle('Page not found · Nafis Hossain Momen');
  const [thought, setThought] = useState(0);

  return (
    <section className="wrap lost" aria-labelledby="lost-title">
      <div className="lost-copy">
        <p className="lost-code" aria-hidden="true">
          4<span className="grad">0</span>4
        </p>
        <h1 id="lost-title" className="h-1">
          Looks like this page wandered away.
        </h1>
        <p className="lede">The address might be mistyped, or the page moved. Either way, it isn’t here.</p>
        <div className="btn-row">
          <Link to="/" className="btn btn-primary btn-lg">
            <Home size={16} aria-hidden="true" /> Take me home
          </Link>
          <button type="button" className="btn btn-ghost btn-lg" onClick={() => history.back()}>
            <ArrowLeft size={16} aria-hidden="true" /> Go back
          </button>
        </div>
      </div>

      <button
        type="button"
        className="lost-stage"
        onClick={() => setThought(n => (n + 1) % THOUGHTS.length)}
        aria-label="Ask her where the page went"
      >
        <span className="bubble hand lost-bubble" aria-live="polite">
          {THOUGHTS[thought]}
        </span>
        <Character name="girl-think" priority sizes="(max-width: 760px) 70vw, 420px" />
      </button>
    </section>
  );
}
