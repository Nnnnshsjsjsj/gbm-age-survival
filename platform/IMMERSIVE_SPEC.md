# cohortex v5 — "beyond a forum": an immersive scientific experience with a 3D brain

Owner's request: take inspiration from his friend's sites (source in /home/claude/rogday: coffeerog/site is the key one —
R3F 3D object that travels with scroll, GSAP ScrollTrigger, Lenis, preloader, kinetic type, split-text reveals, magnetic
buttons, marquees, horizontal strip inside vertical scroll; flow_1, flow_2, bubletealove use Motion + Lenis with a splash,
manifesto words that light up on scroll, counters). **Study the techniques; do not copy code verbatim** (no licence in
those repos). Make cohortex feel "less like a forum, something beyond", and add a 3D model of a brain affected by
glioblastoma.

Keep: the cohortex brand, dark premium system (COHORTEX_SPEC.md tokens, Geist), all routes and logic (Explore, Analyse wizard,
Pool, Research, Families, People, Mod, Account, Rules, Privacy, About), Supabase code (schema `plateau`), engine, i18n (add new
keys in EN and RU), accessibility and tests.

## Stack additions
`three`, `@react-three/fiber@^8` and `@react-three/drei@^9` (React 18 compatible — do not upgrade React), `gsap` (ScrollTrigger),
`lenis`. The 3D code must be **lazy-loaded** (React.lazy + Suspense) into its own chunk so the tools pages stay light; main chunk
stays < 400 kB. WebGL unavailable → a static SVG illustration fallback. `prefers-reduced-motion` → no Lenis, no scroll-jacking or
pinning, brain rendered static (no autorotation), all content visible.

## Navigation
Top bar: logo · Story (home) · Brain lab · Explore · Analyse · Pool · Community ▾ (Research, Families, People) · About ·
EN/RU · theme · Log in · Join. The community is one menu item now, not the centre of the site.

## The 3D brain (procedural, no downloaded model)
Write `src/three/Brain.jsx` and friends. Build it procedurally so there are no licensing questions:
- **Cerebrum**: two hemispheres from high-detail icospheres (detail ≈ 6–7 desktop, 4–5 mobile), shaped to anatomical proportions
  (long axis front–back ≈ 1.25× height; flatten the medial surface; slight frontal and occipital taper; temporal lobe bulge
  low-lateral; a longitudinal fissure gap between hemispheres). Gyri/sulci: vertex displacement with a ridged multi-octave
  3D noise (write a small simplex/3D noise in JS) along the normal, amplitude ≈ 3–4% of radius; store the displacement as a
  vertex attribute so the shader can darken sulci.
- **Cerebellum**: a smaller flattened ellipsoid under the occipital lobes with fine horizontal folia (sin bands); **brainstem**:
  a tapered cylinder.
- **Material** ("holographic scan" look that matches the dark UI): custom ShaderMaterial — very dark base, sulci darker, gyri
  crowns faintly lit, strong fresnel rim in the accent gradient (#5EF2B8 → #4CC9F0), optional faint scanline sweep moving
  front→back every ~6 s (off under reduced motion). Slight transparency so the tumour inside shows through when the camera
  moves close (depthWrite handling done carefully; render tumour after cortex).
- **Tumour** (glioblastoma, right frontotemporal region, deep-ish, ~12% of hemisphere length): layered like an MRI description:
  **necrotic core** (dark irregular blob), **enhancing rim** (noise-displaced shell, emissive warm coral #FF8A5B → amber
  #F5B35C, pulsing very slowly), **peritumoral oedema** (larger soft translucent shell, cyan at low opacity), and
  **infiltrating cells** (2–4k points streaming outward along curved paths, fading with distance — this is the
  "heterogeneity" and "infiltration" story). Points carry a `state` attribute (0..3 = MES, AC, OPC, NPC) so chapter 2 can
  colour them by Neftel state: MES #FF8A5B, AC #F5B35C, OPC #4CC9F0, NPC #B69CFF.
- Label anchors (3D positions) for: necrotic core, enhancing rim, oedema, infiltration, frontal lobe, temporal lobe,
  cerebellum. Labels are HTML (drei `Html`) glass chips with a thin leader line, visible only in the right chapter.
- Performance: one Canvas; dpr [1, 1.75]; frameloop "demand" when idle on the Brain lab page; pause rendering when the
  canvas is off-screen or the tab is hidden; target 60 fps on a mid laptop.

## Home = the Story (scroll-driven, replaces the current home)
One fixed full-screen Canvas behind the page (pointer-events none) with the brain travelling along a scroll path (like the
friend's cup): centre-large in the hero → right side → close-up of the tumour → left side → centre again at the end. Smoothly
interpolated, reacts slightly to the pointer. On mobile the brain stays in the hero only (no travelling) and chapters use
simple fade-ups.

0. **Preloader** (first visit per session, ≤ 1.6 s, skippable by click/Esc, skipped under reduced motion): a Kaplan–Meier line
   draws across the screen while a mono counter goes 0 → 100, then the curtain lifts.
1. **Hero**: kicker "● GLIOBLASTOMA · OPEN COHORT DATA"; huge split-text headline, each word rising:
   "Glioblastoma," / "measured." with "measured" in the gradient; lede: "An interactive atlas of the deadliest brain tumour
   in adults, and a lab for your own cohort. Built on 1,392 patients from four public cohorts and nine published series."
   Magnetic primary CTA "Start the story ↓" (scrolls) and secondary "Analyse your cohort". Bottom: a marquee of data sources in
   mono (TCGA-GBM · CGGA · MSK-IMPACT · CPTAC-GBM · RTOG 0525 · SEER · …) drifting slowly (static under reduced motion).
2. **Chapter 01 — The tumour** (pinned ~150vh on desktop): the camera moves close to the tumour; labels appear one by one in
   sync with short captions: "Necrotic core — tissue that has outgrown its blood supply." "Enhancing rim — where the tumour is most
   active." "Oedema — swelling around it." "Infiltration — cells that have already left the visible mass; the reason surgery
   cannot remove all of it." Facts strip with count-up (use only these numbers, all from the paper): median survival 14.6 months
   with radiotherapy plus temozolomide [Stupp 2005]; 7.1% alive at five years [CBTRUS]; median age at diagnosis 66 [CBTRUS].
   Show the source in small mono under each number.
3. **Chapter 02 — Four cell states**: the infiltrating points recolour by Neftel state and gently cluster; legend chips MES / AC
   / OPC / NPC with one line each. Then the finding, set as a manifesto whose words light up as you scroll:
   "We measured how mixed these states are in 655 tumours. The mix did not change with age." Small stats: ρ = 0.04 (TCGA,
   n = 437) · ρ = 0.07 (CGGA, n = 218) · MATH ρ = −0.18 (n = 375). Link "Read the heterogeneity analysis" → About#heterogeneity.
4. **Chapter 03 — Age** : brain moves aside; big kinetic line "Every year of age raises the hazard of death by about 3%." with
   "3%" as a count-up gradient number; below, the real KMChart of TCGA by age band drawing in (reuse the component; data from
   /reference/tcga_gbm.csv via existing loaders) with the four median survivals as tiles (21.9 / 15.1 / 12.7 / 7.6 months).
5. **Chapter 04 — Thirteen cohorts**: a horizontal strip inside vertical scroll (pinned) of cohort cards (country, years, n,
   HR per year with CI, a tiny interval glyph), ending in the pooled card "1.028 per year · 95% CI 1.024–1.033 · prediction
   interval 1.012–1.045". Then the real ForestPlot builds row by row. Data from /reference/published.json and the reference
   cohorts (same source as the Pool page).
6. **Chapter 05 — Your cohort**: glass panel "Bring your cohort. It never leaves this tab." with three mini-steps and a magnetic
   CTA to /analyse, plus a mono line "0 bytes uploaded".
7. **Chapter 06 — People** (short, not a forum): two cards, Research and Families (warm), each one sentence and a link; a line
   "Every post is read by a moderator first."
8. Footer as now.

## Brain lab (`/brain`)
Full-height interactive viewer: OrbitControls (damping, zoom limits, no pan), start view 3/4 from front-right.
Left glass panel with **layers** toggles (cortex, cerebellum & stem, oedema, enhancing rim, necrotic core, infiltrating
cells), **view** presets (front, side, top, tumour close-up; animate the camera), **colour cells by** (single colour / cell
state), a **cortex opacity** slider, and **cross-section** toggle (a clipping plane sweeping sagittally with a slider,
showing the tumour layers inside). Right panel: context text for the selected structure (click a label or a structure to
select; hover highlights). Bottom mono caption: "Illustration built from a mathematical model, not a patient scan."
Keyboard: arrow keys orbit, +/- zoom, 1–4 view presets; all controls are real buttons/inputs with labels. Mobile: panels become
a bottom sheet with tabs.

## Motion system
- Lenis for smooth scroll (lerp ≈ 0.1), wired to GSAP ScrollTrigger (`lenis.on('scroll', ScrollTrigger.update)` and gsap ticker).
  Expose `window.lenis` and a `scrollToEl` helper; anchors and the router's scroll-to-top must work through it.
- Reusable components: `SplitText` (words/lines rise with stagger), `Reveal` (fade-up), `Magnetic` (button follows pointer,
  elastic return), `Marquee`, `CountUp`, `ScrollWords` (manifesto words light up with scroll progress), `HorizontalStrip` (pinned).
- Custom cursor: a small ring that grows over links/buttons and shows "drag" over the 3D canvas on Brain lab; only on fine
  pointers; hidden under reduced motion; never hides the native cursor for text inputs.
- Kill all ScrollTriggers and the Lenis instance on route change (no leaks); refresh triggers after fonts/images load.

## Copy rules
Short plain sentences, no hype ("revolutionary", "cutting-edge"), no individual prognosis language. All medical facts must be
the ones listed above (they come from the paper). Russian translations for every new string, natural Russian.

## Quality bar
- `npm test` 51/51, `npm run build` OK (main chunk < 400 kB; 3D in a separate lazy chunk; report sizes), `npm run e2e` passes with
  supabase.co blocked. Update e2e for the new home (the old home assertions) and add: Brain lab loads, WebGL canvas present,
  layer toggle changes something (e.g. aria-pressed), reduced-motion run shows all chapter headings without scrolling tricks.
  Headless Chromium supports WebGL via SwiftShader; if a GL context fails, the fallback must render.
- Screenshots (1280×900 and 390×844) of: preloader, hero, each chapter (scroll to it), brain lab (default, cross-section,
  cell-state colouring), and the existing pages to confirm nothing regressed. Look at every screenshot and iterate until the
  brain looks convincingly like a brain (proportions, folds, hemispheres, cerebellum) and the tumour reads clearly. Compare
  side view against a mental model of a real sagittal brain; fix anything that looks like a blob or a potato.
- No horizontal overflow at 390px; keyboard reachable; AA contrast.
