# Momen — portfolio

Personal site for **Nafis Hossain Momen**, full-stack engineer in Dhaka.

Six products you can open, eleven projects, and the engineering decisions behind
them. Every number on the page is traceable to a repository.

## What makes it different

**The particle field is driven by the layout, not by scroll maths.** One point
cloud of up to 34,000 particles spends the page morphing between shapes that
mean something:

| Section | Shape |
| :-- | :-- |
| Hero | A point-cloud globe built from real Natural Earth land data, opening on South Asia, with great-circle arcs to the countries NextUp Mentor places students in |
| All Bangla Paper | **সংবাদ** — "news", rasterised from live Bangla type |
| NextUp Mentor | An aircraft |
| PixelSub | The Telegram glyph |
| Method | A constellation of nodes and edges |
| Contact | An interference wave |

Each shape is drawn inside a box the layout deliberately reserved for it, so it
can never land on top of the words — at any screen width. Sections that offer no
box draw nothing at all; there is no decorative background state.

## Running it

```bash
npm install
npm run dev
```

## Verification

```bash
npm test              # data invariants, including "what I am not claiming"
npm run build         # typecheck + production bundle
npm run audit         # axe in both themes, overflow, broken images, no-WebGL fallback
npm run check:shapes  # the shape sequence must never oscillate while scrolling
npm run check:overflow
npm run perf          # frame pacing across a full-page scroll
```

Regenerating assets:

```bash
npm run build:mask         # land mask from Natural Earth
npm run capture:projects   # screenshots from the live sites
```

## Deploying

Vercel detects Vite automatically — build `npm run build`, output `dist`. No
rewrites are needed: the page has no client-side router, only hash anchors, so
unknown paths should genuinely 404.

Canonical and Open Graph tags need an absolute URL, which is only known at
deploy time. A small Vite plugin stamps `__SITE_URL__` in `index.html` from,
in order:

1. `VITE_SITE_URL` — set this once a custom domain is attached
2. `VERCEL_PROJECT_PRODUCTION_URL` — supplied by Vercel, used automatically
3. `https://nafismomen.com` — the local fallback

So a preview deploy is correct with no configuration, and attaching a domain is
one environment variable. Re-run `npm run build:social` if the hero changes, so
the share card matches.

## Performance

three.js is code-split behind a lazy import, so the readable page ships in about
80 kB gzipped and the field arrives after. The particle count, pixel ratio and
point size come from `detectTier()`, which reads device memory and core count; a
frame-time governor drops the pixel ratio further if a device still struggles.
Only two shape buffers are ever on the GPU, so adding a shape costs memory but
never per-vertex bandwidth.

Respects `prefers-reduced-motion`, works without WebGL, and degrades to a static
gradient if the context is lost.
