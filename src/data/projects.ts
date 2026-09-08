/**
 * Every figure in this file is taken from the repository it describes — commit
 * counts from `git rev-list`, table and policy counts from the migrations,
 * timings from the project's own measured build. Nothing here is decoration.
 */

export type Status = 'live' | 'shipped' | 'research' | 'prototype';

export type Metric = { value: string; label: string };

export type Project = {
  id: string;
  name: string;
  nameBn?: string;
  tagline: string;
  summary: string;
  status: Status;
  year: string;
  kind: 'Platform' | 'Directory' | 'Automation' | 'Research' | 'Commerce';
  scale: 'flagship' | 'major' | 'minor';
  stack: string[];
  metrics: Metric[];
  highlights: string[];
  craft: string;
  honest: string;
  live?: string;
  liveLabel?: string;
  repo: string;
  image?: string;
  imageSm?: string;
  mobile?: string;
  accent: string;
  commits: number;
  files: number;
};

export const projects: Project[] = [
  {
    id: 'allbanglapaper',
    name: 'All Bangla Paper',
    nameBn: 'সকল পত্রিকার মিলিত স্থান',
    tagline: 'Every Bangla newspaper. One tap. Ten milliseconds.',
    summary:
      'A complete directory of Bangla media — national dailies, online portals, TV and FM channels, ePapers, government sites and job boards — organised across 19 categories and all 8 divisions, and served as static HTML so a page never makes you wait.',
    status: 'live',
    year: '2026',
    kind: 'Directory',
    scale: 'flagship',
    stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind v4', 'Supabase', 'Postgres'],
    metrics: [
      { value: '158+', label: 'outlets indexed' },
      { value: '~10ms', label: 'TTFB, static' },
      { value: '30×', label: 'viewer speed-up' },
      { value: '19', label: 'categories' },
    ],
    highlights: [
      'Every public route pre-rendered with ISR — home, 19 categories, 8 divisions and 158 outlet pages ship as static HTML.',
      'Outlets open in an on-site viewer so the reader never gets bounced to a third party; sites that refuse embedding flip to a one-click direct open.',
      'A Bangla converter that runs entirely in the browser: phonetic English→বাংলা typing, Bijoy ⇌ Unicode, and English ⇌ Bangla digits.',
      'A password-gated admin for outlets, categories, submissions, blog posts and logo uploads, with live click analytics.',
    ],
    craft:
      'The outlet viewer originally made a database round-trip per request and took 478 ms. Moving it to fully pre-rendered SSG brought it to ~16 ms — about a 30× speed-up — and click counting moved to a fire-and-forget browser beacon so measurement never blocks a render. Reads go through a `React.cache()` de-duped query layer with a bundled dataset as fallback, which means the site still boots and serves all 158 outlets with no database attached at all.',
    honest:
      'Timings are measured against a local production build (`next start`), not a synthetic benchmark. Traffic and revenue figures are not claimed.',
    live: 'https://www.allbanglapaper.com',
    liveLabel: 'allbanglapaper.com',
    repo: 'https://github.com/faizasurma66-max/BANGLA_NEWS',
    image: '/images/work/allbanglapaper.webp',
    imageSm: '/images/work/allbanglapaper-sm.webp',
    mobile: '/images/work/allbanglapaper-mobile.webp',
    accent: '#FF5A45',
    commits: 30,
    files: 166,
  },
  {
    id: 'nextup',
    name: 'NextUp Mentor',
    tagline: 'A study-abroad file that always says who is holding it.',
    summary:
      'The operating system for a Bangladeshi consultancy placing students in Italy, Lithuania, Hungary and Germany — public booking, a student portal, a staff CRM and an admin surface, with Postgres, not the interface, deciding what each of them can read.',
    status: 'live',
    year: '2026',
    kind: 'Platform',
    scale: 'flagship',
    stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind v4', 'Supabase', 'Postgres', 'RLS'],
    metrics: [
      { value: '66', label: 'RLS policies' },
      { value: '21', label: 'tables' },
      { value: '28', label: 'migrations' },
      { value: '4', label: 'user surfaces' },
    ],
    highlights: [
      'Three separate Supabase clients — public, staff and student — each with its own storage key, so a tutor and a student sharing one browser can never be mistaken for each other.',
      'Permission lives in the database. `is_admin()`, `is_staff()` and `current_staff_id()` are SECURITY DEFINER STABLE functions; React decides what renders, Postgres decides what is readable.',
      'Money is stored in minor units and totals are derived in a view, never stored — two columns that must agree eventually will not.',
      'Receipt fields are copied rather than joined, so a later rename or repricing cannot silently rewrite a document that was already issued.',
    ],
    craft:
      'The portal refuses to show a number it cannot evidence. Stage events are tagged `recorded` or `inferred`, and only recorded data produces a day count — behind two gates: at least 5 samples, and distinct values covering at least 60% of them. That second gate exists because importing the archive produced 16 samples with only 4 distinct values, bulk-update artifacts that would otherwise have told an anxious student "38 days" on no evidence at all. Sample size is always shown next to the number.',
    honest:
      'Built with an AI pair; commit history credits both. Counts come from the migration set. Placement outcomes and revenue are the consultancy\'s, not a metric I claim.',
    live: 'https://nextupmentor.com',
    liveLabel: 'nextupmentor.com',
    repo: 'https://github.com/workmail1803-ai/Nextup',
    image: '/images/work/nextup.webp',
    imageSm: '/images/work/nextup-sm.webp',
    mobile: '/images/work/nextup-mobile.webp',
    accent: '#35E89B',
    commits: 42,
    files: 228,
  },
  {
    id: 'pixelsub',
    name: 'PixelSub',
    tagline: 'A shop, a payment rail and an admin panel — all inside Telegram.',
    summary:
      'A digital-goods storefront that lives entirely in a Telegram chat: crypto checkout through Cryptomus, a store-credit wallet, automatic delivery the moment payment confirms, and a full admin panel the owner runs from their phone. Live as @PixelsubCCBOT.',
    status: 'live',
    year: '2026',
    kind: 'Commerce',
    scale: 'major',
    stack: ['Node.js', 'grammY', 'Express', 'Prisma', 'PostgreSQL', 'Cryptomus', 'Railway'],
    metrics: [
      { value: '0', label: 'apps to install' },
      { value: '2', label: 'payment safety nets' },
      { value: '100%', label: 'admin from phone' },
      { value: '19', label: 'commits' },
    ],
    highlights: [
      'Customers browse live stock, pay in USDT, BTC, ETH or TRX, and receive their codes automatically the instant the payment clears.',
      'A wallet system: top up with crypto, or request store credit from the admin and pay from balance.',
      'The entire back office is Telegram — add products, edit prices, paste stock, ban users, grant credit, approve credit requests, broadcast, read stats. No dashboard required.',
      'Stock auto-decrements per sale; an optional web dashboard exists for desktop but nothing depends on it.',
    ],
    craft:
      'Payment confirmation has two independent paths and one hard rule. The Cryptomus webhook makes confirmation instant; a background poller re-checks every pending order in case a webhook is ever missed. But delivery is never triggered by the incoming message — it is gated on a fresh server-to-server status re-check, so a spoofed webhook cannot hand out a single product code.',
    honest:
      'Deployed on Railway with a health check and long polling. Sales volume belongs to the operator; I built and shipped the system.',
    live: 'https://t.me/PixelsubCCBOT',
    liveLabel: '@PixelsubCCBOT',
    repo: 'https://github.com/workmail1803-ai/PIXELSUB',
    accent: '#5BA8FF',
    commits: 19,
    files: 53,
  },
  {
    id: 'mosjid',
    name: 'Mosjid.info',
    nameBn: 'বাংলাদেশের মসজিদ তথ্য ও ডিরেক্টরি',
    tagline: 'Finding a mosque should not require knowing someone.',
    summary:
      'A nationwide mosque directory for Bangladesh — prayer times, location, facilities and contact for a country with more than 300,000 mosques — built Bangla-first with a real map rather than a list of addresses.',
    status: 'live',
    year: '2026',
    kind: 'Directory',
    scale: 'major',
    stack: ['Next.js 15', 'TypeScript', 'Tailwind v4', 'Supabase', 'MapLibre GL', 'OpenFreeMap'],
    metrics: [
      { value: '300k+', label: 'mosques targeted' },
      { value: '8', label: 'divisions' },
      { value: '170', label: 'files' },
      { value: 'Bangla', label: 'first language' },
    ],
    highlights: [
      'MapLibre GL over OpenFreeMap tiles — a real vector map, no per-view billing attached to a commercial tile provider.',
      'Hind Siliguri for Bangla and Inter for Latin, set as a genuine bilingual type system rather than one font stretched over two scripts.',
      'Supabase Postgres with row-level security, auth and storage; submissions from the public go through moderation.',
    ],
    craft:
      'A national directory is a data problem before it is a UI problem. The schema is built so a mosque can be added by anyone, verified by someone, and located by everyone — with division, district and upazila as first-class fields so the map and the browse tree read from the same source.',
    honest:
      '300,000+ is the size of the problem, not a count of rows currently in the database. The platform is live and accepting entries.',
    live: 'https://mosjid.info',
    liveLabel: 'mosjid.info',
    repo: 'https://github.com/workmail1803-ai/masjid_info',
    image: '/images/work/mosjid.webp',
    imageSm: '/images/work/mosjid-sm.webp',
    mobile: '/images/work/mosjid-mobile.webp',
    accent: '#4FD6C1',
    commits: 14,
    files: 170,
  },
  {
    id: 'tutortrack',
    name: 'TutorTrack',
    tagline: 'Less administration. More room to teach.',
    summary:
      'An installable, mobile-first platform for private tutors — roster, recurring schedule, homework, attendance, monthly invoicing and reports — with a dedicated student portal on the other side of the same database.',
    status: 'live',
    year: '2026',
    kind: 'Platform',
    scale: 'major',
    stack: ['Next.js 16', 'React 19', 'TypeScript', 'Prisma 6', 'PostgreSQL', 'Clerk', 'Framer Motion'],
    metrics: [
      { value: '22', label: 'routes, clean build' },
      { value: '2', label: 'portals, one DB' },
      { value: 'PWA', label: 'installable' },
      { value: '6mo', label: 'earnings reporting' },
    ],
    highlights: [
      'Recurring scheduling generates weekly classes across chosen weekdays; attendance is present / absent / rescheduled / cancelled and stored permanently.',
      'One-click monthly invoice generation with paid, due and overdue states, plus earnings and outstanding reporting.',
      'A student portal showing next class, schedule, homework, attendance percentage, teacher notes and fee history.',
      'Server Actions are the API layer — a deliberate call to ship one full-stack app instead of operating a separate service.',
    ],
    craft:
      'Built as a mobile-first installable PWA so one codebase serves web, Android and iOS through add-to-home-screen, rather than paying the cost of a native wrapper for a product whose entire job is a tutor checking a schedule between classes.',
    honest:
      'Phase 1 is complete and builds clean at 22 routes. Push notifications, file attachments, an AI assistant and a native wrapper are explicitly deferred, and the README says so.',
    live: 'https://tutorme-orpin.vercel.app',
    liveLabel: 'tutorme.vercel.app',
    repo: 'https://github.com/workmail1803-ai/TUTORME',
    image: '/images/work/tutorme.webp',
    imageSm: '/images/work/tutorme-sm.webp',
    mobile: '/images/work/tutorme-mobile.webp',
    accent: '#B388FF',
    commits: 10,
    files: 99,
  },
  {
    id: 'hikmah',
    name: 'Hikmah Tutors',
    tagline: 'Tuition media, tracked from posting to collection.',
    summary:
      'A tuition media platform for Rajshahi. Guardians post requirements, tutors apply, Hikmah shortlists and places — and the media fee is followed all the way to collection instead of being remembered by hand.',
    status: 'live',
    year: '2026',
    kind: 'Platform',
    scale: 'minor',
    stack: ['FastAPI', 'asyncpg', 'React 19', 'Tailwind', 'shadcn/ui', 'Supabase'],
    metrics: [
      { value: '196', label: 'files' },
      { value: '17', label: 'commits' },
      { value: '2', label: 'storage tiers' },
    ],
    highlights: [
      'FastAPI + asyncpg straight onto Supabase Postgres in ap-south-1 — the region nearest the people using it.',
      'Two storage tiers by design: public avatars, private identity documents. A tutor\'s NID is not a profile picture.',
      'Bangla-first React front end on shadcn/ui.',
    ],
    craft:
      'The interesting part of a media business is not matching, it is the fee. Modelling placement and collection as one tracked lifecycle is what separates a job board from a business the owner can actually reconcile at the end of a month.',
    honest: 'Live and in use by the operator. Placement volume is theirs, not a metric I claim.',
    live: 'https://hikmahtutors.com',
    liveLabel: 'hikmahtutors.com',
    repo: 'https://github.com/workmail1803-ai/HIKMAH',
    image: '/images/work/hikmah.webp',
    imageSm: '/images/work/hikmah-sm.webp',
    accent: '#FFB454',
    commits: 17,
    files: 196,
  },
  {
    id: 'ipiguard',
    name: 'ipiguard',
    tagline: 'Reading an agent\'s mail before the agent does.',
    summary:
      'A research prototype that classifies email arriving at an LLM agent over MCP as benign or poisoned with indirect prompt injection, produces a calibrated confidence score, and gates a sandboxed simulation of sensitive tool execution behind it.',
    status: 'research',
    year: '2026',
    kind: 'Research',
    scale: 'major',
    stack: ['Python', 'MCP', 'LLM security', 'Calibration'],
    metrics: [
      { value: '82', label: 'files' },
      { value: 'phase 1', label: 'detection layer' },
      { value: 'gated', label: 'tool execution' },
    ],
    highlights: [
      'Treats the inbox as untrusted input to a tool-using agent — the actual threat surface, not a hypothetical one.',
      'Emits a calibrated confidence score rather than a bare label, so a downstream policy can choose its own threshold.',
      'Sensitive tool calls run in a sandboxed simulation gated on that score.',
    ],
    craft:
      'The report leads with what it cannot do. It is one component of a zero-trust execution architecture, not a defence, and `docs/REPORT.md` documents its limitations and known evasions in the open. A security prototype that oversells itself is worse than no prototype.',
    honest:
      'Experimental, phase 1, and explicitly not a complete defence against prompt injection. Collaborative research repository.',
    repo: 'https://github.com/RaianKibriaRohan/ZeroTrustAgent',
    accent: '#FF5A45',
    commits: 2,
    files: 82,
  },
  {
    id: 'soundai',
    name: 'SOUND-AI',
    tagline: 'When the shape of a song decides which words matter.',
    summary:
      'A neural architecture that predicts the musical context of a clip by fusing two views of the same piece — a graph neural network over a music-structure graph built from the audio, and BERT over the text describing it — joined with cross-attention.',
    status: 'research',
    year: '2026',
    kind: 'Research',
    scale: 'minor',
    stack: ['PyTorch', 'PyTorch Geometric', 'Transformers', 'librosa', 'GraphSAGE / GAT'],
    metrics: [
      { value: '2', label: 'modalities fused' },
      { value: 'cross-attn', label: 'fusion' },
      { value: 'audited', label: 'for leakage' },
    ],
    highlights: [
      'A music-structure graph built from time segments and estimated chords, encoded with GraphSAGE / GAT.',
      'Cross-attention lets the graph decide which words of the description carry signal.',
      'Graph, text and audio baselines compared under the same conditions, with ablations.',
    ],
    craft:
      'The hard part was not the architecture, it was making the comparison honest — preventing artist overlap and label leakage between training and evaluation, so an improvement is an improvement and not a memorised split.',
    honest:
      'A university course project with multiple credited authors. The published results run on a small synthetic development corpus — smoke tests, not benchmark performance, and the README says exactly that.',
    repo: 'https://github.com/workmail1803-ai/SOUND-AI',
    accent: '#B388FF',
    commits: 8,
    files: 60,
  },
  {
    id: 'quickbook',
    name: 'Railway QuickBook',
    tagline: 'Removing reaction time. Not jumping the queue.',
    summary:
      'A Manifest V3 Chrome extension that prepares a Bangladesh Railway booking before the 08:00 Asia/Dhaka sales window opens, then drives the site\'s normal flow the moment it does — and stops with the seats selected so a human commits the purchase.',
    status: 'shipped',
    year: '2026',
    kind: 'Automation',
    scale: 'minor',
    stack: ['TypeScript', 'Chrome MV3', 'DOM automation'],
    metrics: [
      { value: '08:00', label: 'Asia/Dhaka window' },
      { value: '1', label: 'account, real limits' },
      { value: 'stops', label: 'before payment' },
    ],
    highlights: [
      'Search, train, class and seat map are driven through the site\'s own booking flow — no private API, no forged request.',
      'Written for a single legitimate account and the ticket limit that account already has.',
      'Halts with seats selected. A person makes the purchase.',
    ],
    craft:
      'The README has a section titled "What it will never do", and the design honours it. It removes human reaction time and dead waiting; it does not, and cannot, make the server faster or take a seat that was not fairly available. Knowing where to stop is the feature.',
    honest: 'Personal-use automation with deliberate limits. Not a scalping tool and not built to become one.',
    repo: 'https://github.com/workmail1803-ai/TRAIN_TICKET',
    accent: '#5BA8FF',
    commits: 9,
    files: 53,
  },
  {
    id: 'nazmul',
    name: 'Nazmul Commerce',
    tagline: 'The cart total is a SQL function, not a React variable.',
    summary:
      'A Bangladesh electronics storefront and admin — Next.js 16 on Supabase Postgres 17 — where pricing is computed in the database and the client is never trusted to submit a number.',
    status: 'prototype',
    year: '2026',
    kind: 'Commerce',
    scale: 'minor',
    stack: ['Next.js 16', 'TypeScript', 'Tailwind v4', 'Supabase', 'Postgres 17', 'Vitest'],
    metrics: [
      { value: '256', label: 'files' },
      { value: '1', label: 'source of price truth' },
    ],
    highlights: [
      'A `quote_cart()` SQL function is the single source of truth for a total. Client code may display a price; it may never submit one.',
      'Order creation re-quotes server-side and ignores any price in the request payload.',
      'RLS is the security boundary. Middleware redirects are UX, not authorization.',
    ],
    craft:
      'Two rules were written down before the first component: money is computed in Postgres, and `is_staff()` / `has_role()` are SECURITY DEFINER helpers reading a roles table — never a client-supplied claim. Everything else in the codebase follows from those.',
    honest: 'In active development. Not yet deployed to a live storefront.',
    repo: 'https://github.com/workmail1803-ai/ECOM',
    accent: '#FFB454',
    commits: 4,
    files: 256,
  },
  {
    id: 'shortlink',
    name: 'Shortlink',
    tagline: 'A 301 that keeps the preview and the attribution intact.',
    summary:
      'A self-hosted short-link service built for paid social — instant redirects, no interstitial, and Open Graph tags copied from the destination so a shared link previews as the real landing page.',
    status: 'shipped',
    year: '2026',
    kind: 'Automation',
    scale: 'minor',
    stack: ['Node.js', 'PostgreSQL', 'Vercel', 'Docker'],
    metrics: [
      { value: '301', label: 'no interstitial' },
      { value: 'multi', label: 'custom domains' },
    ],
    highlights: [
      'Dynamic Open Graph: title, description and image are copied onto the short link so the Facebook, Messenger and WhatsApp preview matches the real page.',
      '`fbclid` and `utm_*` parameters forward to the destination, so Pixel and analytics attribution keeps working through the redirect.',
      'Multiple custom domains from one installation, plus per-link QR codes and a keyed REST API.',
    ],
    craft:
      'A short link that breaks the preview or drops the click ID quietly costs more than it saves. The whole design is about being invisible: arrive, forward everything that matters, leave no interstitial behind.',
    honest: 'Runs on Vercel, a VPS or Docker. Built for a specific advertising workflow.',
    repo: 'https://github.com/workmail1803-ai/URL_SHORTENER',
    accent: '#4FD6C1',
    commits: 12,
    files: 70,
  },
];

export const wall = projects.filter(p => p.image);
export const flagships = projects.filter(p => p.scale === 'flagship');

export const totals = {
  /** Products a visitor can open right now. */
  live: projects.filter(p => p.status === 'live').length,
  /** Built and in use, but with no public URL to visit. */
  shipped: projects.filter(p => p.status === 'shipped').length,
  commits: projects.reduce((sum, p) => sum + p.commits, 0),
  files: projects.reduce((sum, p) => sum + p.files, 0),
  projects: projects.length,
};

export const principles = [
  {
    n: '01',
    title: 'The database decides.',
    body: 'Row-level security is the boundary. React chooses what renders; Postgres chooses what is readable. A hidden button is not a permission.',
    proof: 'NextUp Mentor — 66 policies across 21 tables',
    href: 'https://github.com/workmail1803-ai/Nextup',
  },
  {
    n: '02',
    title: 'Never show a number you cannot evidence.',
    body: 'Inferred data is labelled inferred. Averages are gated on sample size and distinctness, and the sample size ships next to the number.',
    proof: 'NextUp portal — n ≥ 5, distinct ≥ 60%',
    href: 'https://github.com/workmail1803-ai/Nextup',
  },
  {
    n: '03',
    title: 'Measure, then move the bottleneck.',
    body: 'A per-request database round-trip became a pre-rendered page, and the measurement itself moved off the render path.',
    proof: 'All Bangla Paper — 478ms → ~16ms',
    href: 'https://www.allbanglapaper.com',
  },
  {
    n: '04',
    title: 'Trust the re-check, not the message.',
    body: 'An incoming webhook is a hint that something may have happened. Delivery is gated on asking the payment provider directly.',
    proof: 'PixelSub — server-to-server confirmation',
    href: 'https://t.me/PixelsubCCBOT',
  },
  {
    n: '05',
    title: 'Write down where it stops.',
    body: 'Scope discipline is a feature. The booking automation halts before payment; the security prototype leads with its own evasions.',
    proof: 'Railway QuickBook · ipiguard',
    href: 'https://github.com/workmail1803-ai/TRAIN_TICKET',
  },
  {
    n: '06',
    title: 'Build for the language people think in.',
    body: 'Bangla is not a translation layer bolted on at the end. It is the first-class script, with its own type system and its own converter.',
    proof: 'All Bangla Paper · Mosjid.info',
    href: 'https://www.allbanglapaper.com',
  },
];

export const stack = [
  { group: 'Interface', items: ['React 19', 'Next.js 16', 'TypeScript', 'Tailwind v4', 'Three.js', 'Framer Motion'] },
  { group: 'Server', items: ['Server Actions', 'FastAPI', 'Express', 'Node.js', 'grammY', 'Prisma'] },
  { group: 'Data', items: ['PostgreSQL', 'Supabase', 'Row-level security', 'asyncpg', 'SQL functions'] },
  { group: 'Research', items: ['PyTorch', 'PyTorch Geometric', 'Transformers', 'librosa', 'MCP'] },
  { group: 'Ship', items: ['Vercel', 'Railway', 'Docker', 'Playwright', 'Lighthouse'] },
];
