# plateau — the web app

Source for https://nnnnshsjsjsj.github.io/gbm-age-survival/ (React + Vite + Tailwind, HashRouter).
`npm run build` writes the whole site into `../docs` (GitHub Pages root). `REDESIGN_SPEC.md` is the design brief.

## Commands

| command | what it does |
| --- | --- |
| `npm install` | dependencies |
| `npm run dev` | local dev server |
| `npm test` | engine tests (51, node:test) |
| `npm run build` | production build into `../docs` (emptied first) |
| `npm run e2e` | Playwright run against `../docs` with Supabase **blocked**, then **mocked in the browser**; writes screenshots to `e2e/shots/` |
| `npm run e2e:live` | smoke test against the deployed site and the real Supabase project (see below) |

## Supabase

- Client: `src/lib/supabase.js` (URL and publishable key hard-coded, overridable with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).
  All queries: `src/lib/api.js`. Schema: `supabase/migrations/0002_plateau.sql` (`0001_init.sql` is superseded).
- Two dashboard switches are needed before accounts work:
  1. **API settings → Exposed schemas**: add `plateau`.
  2. **Authentication → Providers → Email**: turn **Confirm email** off (there is no email sending).
  Until then the site shows "Accounts open soon — the science tools work now" wherever an account would be needed.
- Moderators: `plateau.admin_emails` (seeded with the owner's address) or rows in `plateau.admins`. The Mod desk is at `#/mod`.

## Live smoke test

Run from this folder once the two switches are on and the site is deployed:

```sh
npm i -D playwright && npx playwright install chromium   # once, on your own machine
LIVE_URL=https://nnnnshsjsjsj.github.io/gbm-age-survival/ npm run e2e:live
```

It signs up a throwaway research account (`plateau-e2e-<stamp>@example.com`; override with `LIVE_EMAIL` or
`LIVE_EMAIL_DOMAIN` if your project rejects that domain), picks a handle, accepts the rules, creates a post in
"Using plateau", checks that it appears with the "Waiting for review" badge, and finally deletes the account
(which cascades to the post). Set `KEEP_ACCOUNT=1` to keep it so you can approve the post from the Mod desk,
and `HEADED=1` to watch the browser.

## Layout

- `src/engine/` statistics engine (unchanged, tested); `src/lib/` analysis, checks, mapping, csv, methods, reference, summary.
- `src/pages/` one file per route; `src/components/` Layout, Forum, Join/Login dialogs, charts, UI primitives, icons.
- `src/i18n/` English and Russian strings (`science.js` for the analysis tools, `en.js` / `ru.js` for the rest).
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
