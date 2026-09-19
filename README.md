# Momen — portfolio

Personal site for **Nafis Hossain Momen**, full-stack engineer in Dhaka.

Eleven projects, six of them live, and the engineering decisions behind them.
Every number on the site is traceable to a repository. Developer portfolio
first, anime night-room second.

## The idea

A dark room lit by a monitor, with two illustrated characters who use the
interface rather than decorate it:

- On the home page the boy crouches beside **View my work** and presses it —
  his hand is a separate layer cut at the sleeve, rotating from inside the cuff,
  so the finger goes down while the body stays put. Hover, press, compress,
  ripple, sparks, then the page changes.
- The girl presses a real pill button (home, Playground), peeks over panels,
  points at case studies and waves when a message is composed; the boy sits on
  the featured project card and holds the email card on the contact page.
- The sleeping boy in the footer can be woken up. The girl on the 404 page has
  opinions about where the page went.

The characters never receive pointer events — the real link or button
underneath does, so keyboard, screen readers and "open in new tab" all behave.

| Pose | Where |
| :-- | :-- |
| `boy-tap` (body + hand layers) | Home hero — **View my work** |
| `girl-press` | Home **View all projects**, Playground **Next shape** |
| `boy-sit` | Projects — featured card |
| `boy-present` | Contact — holds the email card on his palm |
| `girl-point` | Case studies, Skills, Résumé, Home |
| `girl-peace` | Home, Projects, Contact (sent) |
| `girl-think` | About, Lab, Projects (empty search), 404 |
| `girl-laptop` | Home, Education |
| `boy-point`, `boy-code`, `boy-coffee` | Skills, About, Lab, Build log, Education |
| `boy-sleep` | Footer |

## The room

Every page sits in one painted night room, fixed behind the content and
cropped like a cover image. It is alive, and everything that moves was found in
the painting rather than scattered over it: lit windows in the skyline switch
off and flare, the painted stars twinkle, the neon sign buzzes and drops out,
the lamps flicker, the cat breathes, someone is typing on the monitor, steam
leaves the coffee cup, and now and then a shooting star or a plane crosses the
big window.

Parts of the room can be touched where the page leaves them showing: the desk
lamp switches the lamp theme, the cat talks, the books on the floor open Lab,
Projects, Skills and About, the monitor opens the build log and the poster opens
the method. They mirror links that already exist; the room is a second way in,
never the only one.

**Every page is a corner of the room.** Projects and Skills rest on the
bookshelf, About and its neighbours on the desk. Changing page plays a
sub-second camera glide (generated from the painting with Google Flow, then
sped up with frame blending), backwards when leaving a corner. Clips are
fetched at idle; reduced motion, data saver and slow connections get a
cross-fade instead.

```bash
npm run build:room     # painting → scene, neon on/off, breathing cat, lit windows and stars
npm run build:camera   # design-src/video/*.mp4 → glides, reversed glides, corner stills
```

All of it is transform and opacity on a handful of compositor layers; twinkles
animate in interleaved groups, which is what keeps a budget phone at 60 fps.

## Pages

Home · About · Projects · Case study (`/projects/:id`) · Skills · Lab · Contact,
and under **More**: Build log · Education · Résumé · Playground. Unknown paths
get a 404.

**Pages only exist when their data does.** Achievements, Writing and
Testimonials are built, but `src/data/content.ts` has no entries for them, so
they are not routed, not linked and not rendered. Add an entry and the page
appears — there are no placeholder quotes, awards or posts anywhere.

- The résumé is the page itself; **Download PDF** prints it through a print
  stylesheet.
- The contact form has no backend and says so: it composes the message in the
  visitor's own mail app, and offers to reopen it if nothing happened.
- The particle field (a real-coastline globe, সংবাদ in Bangla type, and four
  emblems) now lives on the Playground, lazy-loaded; no other page loads
  three.js.

## Running it

```bash
npm install
npm run dev
```

## Verification

```bash
npm test                # data invariants, dates, routes, character layers
npm run build           # typecheck + production bundle
npm run audit           # axe on every route, both widths, lamp on and off; overflow; broken images; no-WebGL
npm run check:tap       # the tap: idle → near → hover → press, sparks, navigation, keyboard, hit-test
npm run check:functions # filters, search, sort, case studies, Back restores scroll, lamp, form, easter eggs, room, camera
npm run check:copy      # no em or en dashes anywhere on the rendered site
npm run check:overflow
npm run perf            # frame pacing across a full-page scroll
```

The browser checks expect the dev server on `http://127.0.0.1:5173`
(override with `SHOT_URL` / `AUDIT_URL`).

## Characters

The artwork is generated PNGs with painted "transparent" checkerboards.
`npm run build:characters` cuts them out — border flood fill over the checker
tones, island and pocket cleanup, polygon masks where a pose overlaps a UI
element that the site renders for real — and writes two WebP widths per pose
to `public/characters/`, plus `src/characters/manifest.ts` with each pose's
anchors (fingertip, pivot, seat, palm) as fractions of the image. Components
position real buttons from those anchors, so the art and the UI stay aligned at
every size.

Source PNGs go in `design-src/` (git-ignored; extracted from the artwork zip).

## Deploying

Vercel detects Vite — build `npm run build`, output `dist`. `vercel.json`
rewrites every path to `index.html` so deep links work with the client-side
router (real files are served first), and sets cache headers for `/images/`
and `/characters/`.

Canonical and Open Graph tags need an absolute URL, which is only known at
deploy time. A small Vite plugin stamps `__SITE_URL__` in `index.html` from,
in order:

1. `VITE_SITE_URL` — set this once a custom domain is attached
2. `VERCEL_PROJECT_PRODUCTION_URL` — supplied by Vercel, used automatically
3. `https://nafismomen.com` — the local fallback

Re-run `npm run build:social` if the hero changes, so the share card matches.

## Performance and access

- Pages ship at about 95 kB gzipped; three.js is a separate chunk loaded only by
  the Playground.
- Characters are WebP at 520 and 960 px with `srcset`, lazy below the fold.
- Glass is painted with gradients rather than stacked `backdrop-filter`s, and
  the cursor-lean reads one shared, rAF-throttled pointer and idles off screen.
- `prefers-reduced-motion` stills the characters and skips the transitions; the
  site works without WebGL; `T` toggles the desk lamp (the warm theme).
