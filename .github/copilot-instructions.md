# Portfolio conventions

Personal site for Nafis Hossain Momen. React 19 + Vite + TypeScript, a small
in-house router, and three.js only on the Playground.

## Content

- Projects live in `src/data/projects.ts`. Every figure must be traceable to the
  repository it describes — commit counts from `git rev-list`, dates from the
  first and last commit, table and policy counts from migrations, timings from
  that project's own measured build.
- Each project carries an `honest` field stating what is **not** being claimed.
  Do not remove it and do not soften it.
- `status: 'live'` means a visitor can open it and requires a `live` URL.
  `'shipped'` means built and running with nothing public to open. The tests
  enforce both.
- Page copy lives in `src/data/content.ts`. Achievements, certifications, posts
  and testimonials are empty on purpose. **Never invent entries** — no sample
  quotes, awards, clients, metrics or dates. A page whose data is empty is not
  routed, linked or rendered (`src/routes.ts`).
- No em or en dashes in any copy the site shows (text, titles, meta, labels).
  Rewrite with a comma, colon, full stop or parentheses. `npm test` and
  `npm run check:copy` enforce it.
- Screenshots are captured from the real sites (`npm run capture:projects`).
  Never mock up a screen.

## Characters

- Poses come from `npm run build:characters`, which writes WebP layers and
  `src/characters/manifest.ts`. Do not hand-edit the manifest.
- Position UI against a pose with its anchors (`anchor(name, key)`), never with
  magic pixel offsets — the art scales with the layout.
- A character never takes pointer events. The real `<a>`/`<button>` under it
  does the work, so keyboard and assistive tech are unaffected. Decorative
  poses use `alt=""`; do not put `aria-hidden` on a wrapper that holds controls.
- Motion goes through `prefers-reduced-motion`, and transforms only.

## The room

- The background is one painting (`npm run build:room`). Anything animated in
  it must be found in the painting (a lit window, a painted star), not added.
- Only transform and opacity animate, on as few layers as possible: group
  twinkles, avoid clip-path and mask on animated content, and measure with
  `PERF_THROTTLE=4 npm run perf` before adding more.
- Pages map to corners in `src/room/useCamera.ts`; camera clips are built with
  `npm run build:camera` from `design-src/video/`.

## The particle field (Playground)

- Only two shape buffers are ever on the GPU. Adding a shape must not add
  per-vertex cost; the budget comes from `detectTier()`.
- Emblems hold still once formed; only the globe breathes and reacts to the
  pointer, in world space.
- Keep it lazy-loaded and optional — the page must work without WebGL.

## Gates

Run before calling anything done (browser checks need `npm run dev`):

```
npm test                 # data invariants
npm run build            # typecheck + bundle
npm run audit            # axe on every route, both widths, lamp on/off; overflow; no-WebGL
npm run check:tap        # the hero tap interaction
npm run check:functions  # filters, routing, scroll restore, form, easter eggs
```

Keep theme tokens in `src/styles/tokens.css`.
