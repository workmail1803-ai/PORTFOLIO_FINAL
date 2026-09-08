# Portfolio conventions

Personal site for Nafis Hossain Momen. React 19 + Vite + TypeScript + three.js.

## Content

- Projects live in `src/data/projects.ts`. Every figure must be traceable to the
  repository it describes — commit counts from `git rev-list`, table and policy
  counts from migrations, timings from that project's own measured build.
- Each project carries an `honest` field stating what is **not** being claimed.
  Do not remove it and do not soften it.
- `status: 'live'` means a visitor can open it and requires a `live` URL.
  `'shipped'` means built and running with nothing public to open. The tests
  enforce both.
- Screenshots are captured from the real sites (`npm run capture:projects`).
  Never mock up a screen.

## The particle field

- Shape and placement are driven by the DOM, not by scroll percentages.
  `data-field="<shape>"` marks a real, space-reserving box the field draws
  inside; `data-field-zone` on an ancestor marks when that shape is active.
- A section with no slot draws nothing. There is no decorative background state.
- Never damp the stage position — it must be glued to the layout, or the page
  appears to scroll by itself.
- Pointer effects run in world space, and only on the globe.
- Particle budget comes from `detectTier()`. Keep low-end devices at 60fps;
  adding a shape must not add per-vertex cost.

## Gates

Run before calling anything done:

```
npm test              # data invariants
npm run build         # typecheck + bundle
npm run audit         # axe (both themes), overflow, broken images, no-WebGL
npm run check:shapes  # the shape sequence must not oscillate
```

Keep WebGL lazy-loaded and optional, respect `prefers-reduced-motion`, and keep
theme tokens in `src/styles/tokens.css`.
