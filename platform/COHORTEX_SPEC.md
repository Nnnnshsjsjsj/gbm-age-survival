# cohortex — premium dark redesign (v4)

The product is renamed **cohortex** (lowercase; cohort + cortex). Everything user-visible that says "plateau" becomes
"cohortex". The database schema stays named `plateau` internally (do not change `db: { schema: 'plateau' }` or any RPC
names). This is a visual and brand redesign of the existing app in /home/claude/platform. **All functionality, routes,
Supabase code, i18n keys, accessibility behaviour and the engine stay.** Rewrite styles/components, not logic.

Reference aesthetic: Linear, Vercel, Raycast, Resend marketing sites. Dark-first, precise, quiet luxury. Not "gamer",
not neon overload. One accent family, used sparingly. Motion is subtle and purposeful.

## Brand
- Assets in `public/brand2/`: `mark.svg` (dark), `mark_light.svg`, `lockup.svg`, `lockup_light.svg`, PNG icons. Move them
  to `public/brand/` (replace the old plateau files; delete the old ones) and update index.html (favicon.svg = mark.svg,
  apple-touch-icon, theme-color #07090A, title "cohortex — glioblastoma cohorts, side by side", OG tags).
- In the top bar render the mark inline (26px) + wordmark "cohort" in text colour and "ex" in the accent gradient
  (background-clip:text), Geist 600, letter-spacing −0.03em. The mark is a 5×5 dot matrix whose lit dots trace a
  Kaplan–Meier step curve; build an inline React `<Logo/>` component from mark.svg so it inherits theme.

## Typography
Google Fonts: **Geist** (400/500/600/700) for everything, **Geist Mono** (400/500) for numbers, code, stats, labels
in small caps style. Fallback Inter, system-ui. Headlines: Geist 600, letter-spacing −0.04em, line-height 1.02,
hero clamp(44px, 7vw, 88px). Section titles clamp(30px, 4vw, 48px). Body 16px/1.6, muted colour for secondary text.
Kicker labels: Geist Mono 12px uppercase, letter-spacing .12em, muted, often preceded by a small accent dot.

## Colour tokens (CSS variables; dark is the default, light via [data-theme=light])
Dark (default, applied to :root and [data-theme=dark]):
```
--bg:#07090A; --bg-2:#0B0F10; --surface:rgba(255,255,255,0.028); --surface-2:rgba(255,255,255,0.05);
--surface-solid:#0E1314; --elev:#12181A; --line:rgba(255,255,255,0.08); --line-strong:rgba(255,255,255,0.14);
--ink:#EDF3F0; --muted:#94A39E; --dim:#5F6D69;
--accent:#3EE6A8; --accent-2:#4CC9F0; --accent-ink:#7EF2C6; --accent-soft:rgba(62,230,168,0.12); --on-accent:#04110C;
--grad: linear-gradient(135deg,#5EF2B8 0%,#4CC9F0 100%);
--warm:#F5B35C; --warm-2:#F2865E; --warm-ink:#F9C98A; --warm-soft:rgba(245,179,92,0.12); --on-warm:#1A0F03;
--grad-warm: linear-gradient(135deg,#F7C77A 0%,#F2865E 100%);
--red:#FF6B6B; --red-soft:rgba(255,107,107,.12); --blue:#7AA2FF;
--g1:#3EE6A8; --g2:#4CC9F0; --g3:#F5B35C; --g4:#FF7A7A;   (chart group colours)
--shadow-lg: 0 24px 80px -24px rgba(0,0,0,.7); --ring: 0 0 0 1px var(--line-strong);
--r:14px; --r-sm:10px; --r-lg:20px; --pill:999px;
```
Light ([data-theme=light]): bg #F6F8F7, bg-2 #FFFFFF, surface #FFFFFF, surface-2 #F0F4F2, surface-solid #FFFFFF, elev #FFFFFF,
line rgba(10,20,18,.08), line-strong rgba(10,20,18,.14), ink #0A1412, muted #55635F, dim #8A9793, accent #0E9F6E, accent-2 #0B7FAB,
accent-ink #0B7F58, accent-soft rgba(14,159,110,.10), on-accent #FFFFFF, grad linear-gradient(135deg,#0E9F6E,#0B7FAB),
warm #C2661A, warm-2 #B4452A, warm-ink #9A4F12, warm-soft rgba(194,102,26,.10), g1 #0E9F6E g2 #0B7FAB g3 #C2661A g4 #C23B3B.
Default theme = dark regardless of OS preference (store choice in localStorage). Family space remaps accent → warm
(`[data-space=family]`), exactly as before.
All text colours must pass WCAG AA on their backgrounds; check muted on bg (≥4.5:1 for body text).

## Signature surfaces and effects
- **Page background**: bg colour + a very faint 56px grid of 1px lines (line colour at ~40% of --line) masked with a
  radial gradient so it fades out toward the edges; a large blurred radial glow (accent at 10–14% opacity) behind the hero,
  plus a second cyan glow offset. Absolutely no busy patterns behind body text.
- **Glass cards**: background var(--surface), 1px border var(--line), radius var(--r), backdrop-filter blur(12px) where it sits
  over glow; on hover the border brightens to --line-strong and a **spotlight** follows the cursor (radial-gradient at
  the mouse position, accent at 8%; implement with CSS vars --mx/--my set on pointermove; disabled on touch and under
  prefers-reduced-motion).
- **Gradient border** for featured cards and the primary CTA container: 1px border using a masked gradient (--grad).
- **Buttons**: primary = solid accent (or --grad) with on-accent text, 40–44px tall, radius 10px (not pill), subtle inner
  highlight (inset 0 1px 0 rgba(255,255,255,.25)), hover lifts 1px and brightens; secondary = surface + line border;
  ghost = text only. Keyboard focus ring 2px accent with 2px offset.
- **Nav**: sticky, translucent (bg at 70% + backdrop blur 16px), bottom hairline. Links muted → ink on hover; active link
  ink with a 2px accent dot or underline glow. Right side: language, theme, "Sign in" ghost + "Join" primary. Mobile: full-
  screen sheet with large links.
- **Badges/chips**: mono 11–12px, surface-2 background, line border, radius 6–8px.
- **Stat strip**: numbers in Geist Mono 28–36px with gradient text, labels muted mono uppercase.
- **Tables**: no zebra; hairline rows; mono numbers right-aligned; sticky header on long tables.
- **Charts** (KMChart, ForestPlot): dark-optimised — grid lines at line colour, axes dim, group colours --g1..--g4, CI bands at
  12–16% opacity, the pooled diamond in --grad, highlight row for the user's cohort in accent-soft. Tooltips as glass popovers.
- **Motion**: fade-up 12px on first view (IntersectionObserver, 400ms ease-out, stagger 60ms), hero KM line draws itself once
  (stroke-dashoffset 1.6s) with a soft glow that settles; numbers count up once. All disabled with prefers-reduced-motion.
  No infinite animations except a very slow (20s+) drift of the hero glow, also disabled under reduced motion.
- Skeleton loaders shimmer subtly (disabled under reduced motion).

## Home page (rewrite layout, keep copy meaning; write crisp copy)
1. Hero: kicker "● OPEN GLIOBLASTOMA COHORT DATA"; H1 "Glioblastoma cohorts," / line 2 "side by side." with "side by side"
   in gradient text. Lede (muted, 18–20px, max 56ch): "cohortex puts your cohort next to the big public ones. Kaplan–Meier
   curves, Cox models and a living meta-analysis of thirteen cohorts, computed in your browser. Your patients' rows never
   leave your computer." CTAs: primary "Analyse your cohort", secondary "Explore the data". Under CTAs a mono line:
   "No upload · No account needed for the tools · EN / RU".
   Right/below: a **product visual** — a glass window mock (traffic-light dots, title "age effect · 13 cohorts") that contains a
   real, live-rendered mini forest plot from the Pool data (or the four reference KM curves) with the glow. It must be the real
   component with real numbers, not an image.
2. Logo-like strip of data sources in muted mono: "TCGA-GBM · CGGA · MSK-IMPACT · CPTAC-GBM · 9 published series".
3. Stat strip (4 cells with hairline dividers): 4 reference cohorts · 1,392 patients · 13 cohorts pooled · 0 rows uploaded
   (count-up). Live members count only if > 0.
4. "How it works": three glass cards with numbered mono labels 01/02/03, an icon, title, text; connected by a thin gradient line.
5. Feature bento grid (2×3 on desktop): (a) large card "Your cohort on the forest plot" with a mini ForestPlot; (b) "Cox models,
   checked" (mono snippet of the methods paragraph); (c) "Proportional hazards" (tiny Schoenfeld check badge); (d) "Privacy by
   construction" (a lock + "0 bytes uploaded" metric); (e) "Living meta-analysis" (I² and prediction interval numbers);
   (f) "Bilingual" (EN/RU toggle illustration). Spotlight hover on each.
6. "Two spaces, one wall": two tall cards, research (accent gradient border) and family (warm gradient border), with the
   same content as now.
7. "The fine print": two-column list with mono labels (DATA / NOT A PROGNOSIS / MODERATION / SEPARATION) and a quote card.
8. Final CTA band: large gradient-bordered panel "Bring your cohort." + primary button.
9. Footer: logo, one-line mission, columns (Product: Explore, Analyse, Pool · Community: Research, Families, People ·
   Project: About, Rules, Privacy, GitHub, Paper), bottom row "© 2026 cohortex · Belgrade" and a status dot "All tools run
   offline in your browser".

## Every other page
Apply the same system: page header with kicker + title + lede on a subtle glow; content in glass cards; forum layout with a
glass sidebar and feed items as rows with hairlines (hover surface-2), vote button as a mono counter pill; thread page with
a readable 72ch column; wizard stepper as a horizontal track with glowing active node; Pool tiles with gradient numbers;
modals as elevated glass with backdrop blur and a gradient hairline at the top; toasts bottom-right glass.

## Copy and i18n
Replace "plateau" with "cohortex" in en.js, ru.js, science.js and anywhere else (About page: explain the name in one
sentence — "cohort + cortex: many cohorts, one brain tumour"). Russian: "cohortex" stays in Latin letters.
Keep sentences short; no hype words ("revolutionary", "cutting-edge", "unlock").

## Quality bar (unchanged)
`npm test` 51/51; `npm run build` OK, main chunk < 800 kB; `npm run e2e` passes with supabase.co blocked (update selectors if
you change text); no horizontal overflow at 390px; AA contrast in both themes; keyboard and reduced-motion behaviour intact.
Screenshots at 1280×900 and 390×844 for home (dark and light), explore, analyse results + compare, pool, research
(fallback + mock), families, join modal, about. Look at every screenshot yourself and fix anything that looks cheap:
misaligned baselines, cramped padding, inconsistent radii, low-contrast text, glow banding, orphans in headlines.
