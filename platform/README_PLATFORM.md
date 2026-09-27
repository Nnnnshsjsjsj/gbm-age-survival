# cohortex — the web app

Source for https://nnnnshsjsjsj.github.io/gbm-age-survival/ (React + Vite + Tailwind, HashRouter).
`npm run build` writes the whole site into `../docs` (GitHub Pages root). `REDESIGN_SPEC.md` is the design brief.

## Commands

| command | what it does |
| --- | --- |
| `npm install` | dependencies |
| `npm run dev` | local dev server |
| `npm test` | engine tests (51, node:test) |
| `npm run build` | production build into `../docs` (emptied first) |
| `npm run audit:mobile` | touch-emulated phone/tablet audit (360, 390, 768, 1024): full-page screenshots, overflow, small tap targets, tiny text → `AUDIT_URL` defaults to a local server on :4180 |
| `npm run views:mobile` | viewport screenshots of key phone moments with motion on (`W`/`H` env for tablets) |
| `npm run e2e` | Playwright run against `../docs` with every outside host **blocked**; covers the tools, the story, the Brain lab and both guides, and writes screenshots to `e2e/shots/` |

## Layout

- `src/engine/` statistics engine (unchanged, tested); `src/lib/` analysis, checks, mapping, csv, methods, reference, summary.
- `src/pages/` one file per route (`Hub.jsx` + `hub/`, `Patients.jsx`); `src/components/` Layout, charts, UI primitives, icons.
- `src/i18n/` English and Russian strings (`science.js` for the analysis tools, `en.js` / `ru.js` for the rest, `story.js` and `guides.js` for v5 and v6).
- Design tokens are CSS variables in `src/styles.css`; the family space remaps `--accent*` to the warm colour.
- `public/platform/index.html` redirects old `/platform/` links to the root; `public/404.html` sends unknown paths home.

## v5: the story and the Brain lab (`IMMERSIVE_SPEC.md`)

- `src/three/` is the procedural brain: `noise.js` (seeded 3D simplex), `anatomy.js` (hemispheres lofted from a
  coronal "D" section with gyri, Sylvian and central fissures, cerebellum with folia, brainstem, tumour layers,
  infiltrating cells), `materials.js` (holographic cortex shader, tumour layers, stencil cross-section caps),
  `brainScene.js` (plain three.js assembly + picking). `Brain.jsx`, `StoryCanvas.jsx`, `LabCanvas.jsx` are the
  React Three Fiber wrappers and load lazily in their own chunk. `storyStore.js` holds the scroll poses.
- `src/motion/` is the motion system: Lenis + GSAP ScrollTrigger per route (`core.js`), `SplitText`, `Reveal`,
  `Magnetic`, `Marquee`, `CountUp`, `ScrollWords`, `HorizontalStrip`, `Cursor`, and the `Preloader`.
- No WebGL (or `?nogl` before the `#`) shows the SVG illustration. Reduced motion: no Lenis, no pins, static brain.
- The `npm run e2e` run renders WebGL through SwiftShader and also writes the story / Brain lab screenshots.

## v6: two guides instead of the forums

- The community spaces, accounts, Join/Log in and the Mod desk are gone, and so is the Supabase client. Old
  addresses (`#/research…`, `#/families…`, `#/people`) redirect to the guides. The site is fully static.
- **Research hub** (`#/hub`): search across everything (press `/`), five reading paths, a filterable library of 100
  papers, a toolbox of 109 datasets / programs / guidelines / registries / courses / societies, 3D models
  (constellation of the catalogue, Neftel cell states with live entropy, MRI slice explorer) and newcomer FAQs.
- **Patients & families** (`#/patients`, warm space): country picker and globe, "help right now" box with tap-to-call
  numbers, services by kind for 64 countries, international directories, common questions and a reading list.
- Data: `data-src/*.json` are the hand-checked research outputs (September 2026); `python3 data-src/merge.py` writes
  `public/hub/research.json`, `public/hub/patients.json` and `src/data/hubStats.js`. `data-src/land.mjs` rebuilds the
  globe's land dots. To correct a phone number, edit the matching `data-src/patients_*.json` entry and re-run merge.
- 3D scenes for the guides live in `src/three/hub/` and load lazily; the MRI model (`src/lib/mriModel.js`) is plain JS,
  so the 2D slice works without WebGL.

## v7: phones and tablets

- Touch devices (`pointer: coarse`) get 40–44px controls everywhere; hover-only effects are off.
- Tables turn into one labelled card per row on phones (`Layout.jsx` copies header text into `data-label`);
  wide data previews keep sideways scrolling with `tbl-raw`.
- Forest plots switch to a stacked layout below 560px: name and numbers on one line, the interval under it at full width.
- Story: the 13 cohort cards swipe (scroll-snap) below 1024px. KM curves are clipped to the plot area.
- Guides: a sticky "on this page" bar, filter chips that swipe, summaries that open on tap, four services per group with
  "Show all", the 3D picture stays in view (sticky) while you move the model controls, and the constellation shows a
  preview card on tap (tap again or press Open). A support shortcut (heart) sits in the top bar on phones and tablets.
- Analyse: Back/Next stay at the bottom of the screen on phones.
- `npm run e2e` includes a touch-phone phase (swipe strip, labelled tables, 40px targets, sticky wizard bar, star tap).
