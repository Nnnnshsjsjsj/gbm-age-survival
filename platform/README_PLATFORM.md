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
