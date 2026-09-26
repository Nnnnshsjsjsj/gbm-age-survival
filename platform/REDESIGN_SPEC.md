# plateau — redesign and full build (v3)

The site is renamed **plateau** (lowercase). The name is the flat tail of a Kaplan–Meier curve, where the long-term
survivors are. It serves two separate communities: a **research space** (students, researchers, clinicians, teachers)
and a **family space** (patients, caregivers, relatives). They share one sign-in system but never see each other's
private content. The science tools (Explore, Analyse, Pool) work for everyone, signed in or not.

The design language copies **Recess** (the owner's other site; a rendered copy is at `/home/claude/recess_ref/recess.html`,
screenshots `/home/claude/recess_ref/r1.png`, `r_forum.png`, `r_full.png`). Study it before writing CSS. What to take from it:
Inter everywhere, huge tight headlines (letter-spacing about −0.035em, weight 800) with one phrase highlighted in a soft
pill background in the brand colour, a white sticky top bar with a pill-shaped active nav item, a filled pill CTA
("Join"), stat chips under the hero (bold number + muted label, pill border), uppercase small section labels
("HOW IT WORKS"), 12px card radius, 1px borders, very light shadows, generous whitespace, a forum with a left sidebar of
boards (coloured dots), a pre-moderation banner above the feed, and a "fine print, honestly" section with a two-column
label/explanation list plus a quote card. Do **not** copy Recess's text, name, asterisk logo or blue colour.

## Brand
- Logo files: `public/brand/mark.svg` (green square, white step curve), `mark_dark.svg`, `lockup.svg`, `lockup_dark.svg`, favicons.
  In the top bar render the mark (28px) inline as SVG + the word **plateau** in Inter 800, −0.04em, plus a short green
  bar (the "plateau") after the word at baseline height, width ~0.45em, height ~0.14em, radius full. Do not use the PNGs in the UI.
- Put `<link rel="icon" href="./favicon.svg">`, apple-touch-icon and a `<meta name="theme-color">` in index.html.
  Title: "plateau — glioblastoma cohorts, side by side". Meta description to match. Open Graph title/description.

## Tokens (CSS variables in src/styles.css, mapped in tailwind.config.js)
Light:
`--paper #F6F7F5; --card #FFFFFF; --tint #EFF2EE; --tint2 #E6EAE4; --line #E1E5DF; --line-strong #C9D0C6; --ink #121714;
--muted #58625B; --dim #8A938C; --brand #16794A; --brand-hover #11653D; --brand-text #146C42; --brand-soft #E7F3EC;
--on-brand #FFFFFF; --warm #B45309; --warm-hover #92400E; --warm-text #9A4A0B; --warm-soft #FDF1E1; --on-warm #FFFFFF;
--red #C9362B; --red-soft #FDECEA; --gold #8A6400; --gold-soft #FBF3DF; --blue #2F5BD3; --blue-soft #EAF0FD;
--shadow 0 1px 2px rgba(18,23,20,.05); --shadow-md 0 2px 8px rgba(18,23,20,.07); --shadow-lg 0 10px 34px rgba(18,23,20,.13);
--r 12px; --r-sm 8px; --r-lg 16px; --pill 999px;`
Chart group colours g1..g4: `#16794A #2F5BD3 #B45309 #A8433A`.
Dark (`@media (prefers-color-scheme: dark)` on `:root:not([data-theme=light])`, and `:root[data-theme=dark]`):
`--paper #0D110F; --card #161B18; --tint #1E2420; --tint2 #262D28; --line #29302B; --line-strong #3B443E; --ink #E8EDE9;
--muted #A3ADA6; --dim #78827B; --brand #3DBE7E; --brand-hover #52CC8E; --brand-text #7FD9A8; --brand-soft rgba(61,190,126,.15);
--on-brand #0D110F; --warm #F0A24B; --warm-hover #F5B46B; --warm-text #F6BE7E; --warm-soft rgba(240,162,75,.15); --on-warm #0D110F;
--red #F0645A; --red-soft rgba(240,100,90,.15); --gold #D8B25E; --gold-soft rgba(216,178,94,.14); --blue #7FA2FF; --blue-soft rgba(127,162,255,.15);`
g1..g4 dark: `#5FD39A #8DB0FF #F0A24B #F07F74`.
The **family space uses the warm accent** everywhere the research space uses brand green (buttons, active nav, highlights,
dots), so users always know which space they are in. Wrap family pages in `data-space="family"` and remap `--accent*`
variables there; components use `--accent*`, never `--brand` directly, except the logo.
Fonts: Google Fonts Inter 400/500/600/700/800 and JetBrains Mono 400/500 (numbers, code, stats). Body 16px/1.55.
Numbers use `font-variant-numeric: tabular-nums`. Respect prefers-reduced-motion. Focus rings 2px accent, offset 2px.
Touch targets ≥44px. No emoji anywhere. Icons: inline SVG (Lucide-style, 1.75 stroke), aria-hidden next to text.

## Hosting
- Vite `base: './'`, `build.outDir: '../docs'`, `emptyOutDir: true`. The app becomes the site root
  (https://nnnnshsjsjsj.github.io/gbm-age-survival/). Put `public/platform/index.html` containing a meta-refresh +
  JS redirect to `../` (preserving the hash) so old links to /platform/ still work. Add `public/.nojekyll` (empty).
  Add `public/404.html` that redirects to `./` (GitHub Pages serves it for unknown paths).
- Reference data under `public/reference/` as now; `resources.json` has been added for the family resources page.
- Keep HashRouter.

## Supabase (live)
- URL `https://knvzabdifwvyvdsajsji.supabase.co`, publishable key `sb_publishable_KFJoAiBMRUQHD175VIyA8Q_bnkm1NG5`.
  Hard-code these as defaults in `src/lib/supabase.js` (overridable by `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).
  They are public by design. Create the client with `{ db: { schema: 'plateau' }, auth: { persistSession: true, autoRefreshToken: true } }`.
- The schema is in `supabase/migrations/0002_plateau.sql`. **Read it fully** and use exactly those names. Old
  `0001_init.sql` is superseded; delete the old api calls that target public.* tables.
  Tables (all in schema plateau): profiles, boards, threads, replies, votes, reports, cohort_summaries, admins.
  RPCs: `feed(p_board, p_space, p_sort, p_query, p_limit, p_offset)` returns rows of JSON; `thread(p_id)`; `stats()`;
  `handle_available(p_handle)`; `is_admin()`; `my_space()`; moderation: `mod_queue()`, `moderate_thread(p_id,p_status,p_note)`,
  `remove_reply(p_id,p_note)`, `review_summary(p_id,p_status,p_note)`, `resolve_report(p_id,p_status)`, `ban_user(p_handle,p_reason)`,
  `unban_user(p_handle)`; `delete_my_account()`.
  Inserts go straight to tables (RLS + triggers set author/status): `threads {board_key,title,body}`, `replies {thread_id,body}`,
  `votes {thread_id,user_id}`, `reports {target_type,target_id,reporter,reason}`, `profiles {...}`, `cohort_summaries {...}`.
  Surface trigger errors (e.g. "daily limit of 8 new posts reached") to the user as friendly inline messages.
- **Auth: email + password, no email verification.** `signUp({email,password})` returns a session. There is no email
  sending, so there is no "forgot password" email: show "Forgot your password? Write to the moderators from the contact
  page" instead. Password rules: at least 10 characters; show a strength hint.
- Until the owner flips two dashboard switches (expose schema `plateau`; disable email confirmation) the API may answer
  with a "schema must be one of" / "Invalid schema" or "Email not confirmed" error. Detect these and show a calm banner
  "Accounts open soon — the science tools work now" instead of breaking. Everything that does not need an account must work.

## Accounts and onboarding (Recess-style "Join" flow)
Join is a stepped modal/page:
1. **Which space?** Two big cards. Research: "Students, researchers, clinicians, teachers. Analyse data, share summaries,
   discuss methods." Family: "Patients, caregivers and relatives. A private, moderated place to talk. No medical advice."
   Explain in one line that the choice is permanent and the spaces cannot see each other's private posts.
2. **Email + password** (email is never shown to anyone; used only to sign in).
3. **Handle** (3–24 chars, `a-z 0-9 _ -`, live availability check via `handle_available`), role (research: student /
   researcher / clinician / teacher / other; family: patient / caregiver / family / other). Research also: optional
   institution, country, tags (chips from a fixed list: survival analysis, genomics, imaging, epidemiology, clinical
   trials, machine learning, neuro-oncology, statistics teaching + free text), "show my profile in the directory".
4. **Rules**: the space's rules as a short list, a required checkbox "I have read the rules", and a required "I am 18 or older".
   Insert the profile with `adult_confirmed: true, rules_accepted_at: now`.
Signed-in users without a profile (e.g. signed up then closed the tab) are sent to step 3 automatically.
Log in: email + password. Account page: edit profile fields, change password (`auth.updateUser`), sign out, delete
account (typed confirmation "delete" → `rpc('delete_my_account')` then sign out). Show the user's own pending/rejected posts
with the moderator's note.

## Routes and pages
Top bar (sticky, white/card): logo · Home · Explore · Analyse · Pool · Research · Families · About · (Mod desk if admin) ·
language toggle EN/RU · theme toggle · Join (pill) or avatar menu (handle, Account, Sign out). Collapse into a menu button
under 900px with a bottom sheet like Recess. Active item = pill background (tint2) in research, warm-soft in family.

1. `/` **Home.** Uppercase kicker chip "GLIOBLASTOMA · OPEN COHORT DATA · EST. 2026". Headline: "Glioblastoma cohorts," / "side by
   **side.**" (highlight "side by side" in accent pill). Sub: "plateau puts your cohort next to the big public ones. Kaplan–Meier
   curves, Cox models and a living meta-analysis of thirteen cohorts, all computed in your browser. Your patients' rows never
   leave your computer." CTAs: "Analyse your cohort" (primary) and "Explore the data" (outline). Stat chips: `4` reference cohorts ·
   `1,392` patients · `13` cohorts in the pool · `0` rows uploaded · live `N` researchers (from `stats()`, hide chip if 0 or error).
   Right side of hero: a small animated-once SVG of a KM step curve that settles into a flat tail (the logo idea, drawn big and
   quiet, accent at 15% opacity; static under reduced motion).
   Section "HOW IT WORKS": three numbered cards — Load (your CSV stays in this tab), Analyse (the same methods as the paper), Compare
   (your age effect on one forest plot with 13 cohorts).
   Section "TWO SPACES, KEPT APART": two cards side by side, green Research card and warm Families card, each with 3 bullets and a
   button ("Enter the research space", "Visit the family space").
   Section "THE FINE PRINT, HONESTLY": two-column list like Recess — DATA: "Your file is read in this tab. Nothing is uploaded unless
   you choose to share a summary of counts and coefficients." · NOT A PROGNOSIS: "Everything here describes how groups of patients
   fared. It says nothing about any one person." · MODERATION: "Every new post is read by a human before it appears. Replies go live
   and can be removed." · SEPARATION: "Family posts are visible only to family members. Researchers never see them." — plus a quote
   card on the right: "We built plateau because a 40-patient hospital series deserves the same analysis as TCGA." — the author,
   and a "Read the rules" button.
   Footer: "© 2026 plateau · Belgrade · a student research project" left; links Rules · Privacy · About · GitHub right.
2. `/explore` Reference cohorts — keep current functionality, restyle: cohort switcher as pill tabs, KM chart card, table, tiles.
3. `/analyse/*` Wizard — keep all logic; restyle: horizontal stepper with numbered circles and connecting line; each step a card;
   primary actions bottom-right. Compare step: the **Share summary** card now really inserts into `cohort_summaries` when signed
   in to a research account; otherwise shows "Join the research space to share" + Download JSON.
4. `/pool` — keep; include approved shared summaries from `cohort_summaries` in the pooling (convert `models[0].beta/se` for the
   age-only model), marked "shared by @handle" (owner handle via a join is not available; label "shared cohort").
5. `/research` and `/research/:board` Forum (Recess forum layout): left sidebar 260px with search box, groups "GENERAL"
   (lobby, methods, finding-data, papers, show-your-work, platform-help) and "DATASETS" (4 datasets), coloured dots. Main: board
   title + key pill + blurb, green banner "Every post here was approved by a human moderator. Median review time: X min" (from
   stats; omit the time if null), sort tabs Active / New / Top, "New post" button (opens a modal with board select, title, body,
   live character counts, and a note "A moderator reads it before it appears"). Feed items: title, excerpt (2 lines), board chip,
   @handle + role badge, relative time, reply count, "Useful" vote button (toggle; disabled when signed out with tooltip). Own pending
   posts appear with a "Waiting for review" badge; rejected with the moderator note.
   `/research/t/:id` Thread page: breadcrumbs, title, body (preserve line breaks; autolink URLs; no HTML), author line, Useful button,
   Report link (modal with reason), replies list, reply box (disabled with a clear reason when signed out / other space / thread
   pending). Delete own reply. Empty states everywhere written like Recess (short, warm, specific).
6. `/people` Researcher directory: search, tag filter chips, cards (handle, role, institution, country, tags, "works with").
7. `/families` Family space entry. Signed out or research account: a warm landing (headline "A quiet room for the people living
   with it.", three promises: private to family members, read by a human first, no medical advice — questions for your doctor
   instead) + Join as family / Log in; plus the **Resources** list (public, from `/reference/resources.json`, grouped by region,
   with helpline text; RU uses `offers.ru`). Family account: the forum (same component as research, space='family', warm accent,
   boards from `boards` where space='family') and a Resources tab. `/families/t/:id` thread page.
8. `/mod` Mod desk (admins only; check `rpc('is_admin')`): tabs Posts (pending threads from both spaces with space badge; Approve /
   Reject with note), Summaries (JSON preview; Approve/Reject), Reports (open reports; link to target; Resolve/Dismiss; remove reply),
   Members (ban/unban by handle with reason). Counts in tab labels.
9. `/account` as above. `/rules` (research rules and family rules, two sections), `/privacy` (what is stored: email, handle, profile
   fields, posts; what is never stored: patient rows, uploaded files; Supabase hosting in the EU; deletion), `/about` (the paper, the
   methods, the numbers, links to GitHub and the paper PDFs in the repo).

Write all UI copy in plain, short sentences (no hype, no "predict", no "your survival"). Provide full Russian in i18n.js; Russian should
read naturally. Keep EN/RU and theme persisted in localStorage inside try/catch.

## Quality bar
- `npm test` (engine) still 51/51. `npm run build` succeeds, main chunk < 800 kB, Supabase SDK may be in the main bundle now.
- Update `e2e/wizard.spec.mjs`: it must pass with the network to supabase.co **blocked** (the sandbox cannot reach it): the science
  flow and all static pages must work; community pages must show the calm fallback instead of errors; no uncaught page errors.
  Allow requests to supabase.co to fail without failing the test. Screenshots at 1280×900 and 390×844 for: home, explore, analyse
  (each step), pool, research (fallback state), families, join modal (each step), about, rules; light and dark for home.
- No horizontal overflow at 390px on any page. Keyboard: every control reachable, visible focus, Escape closes modals, focus trapped
  in modals and returned on close. Charts have role="img" and a title.
- Remove dead code (old Community/Admin pages replaced). Keep the engine untouched.
- Also write `e2e/live.spec.mjs` (not run here) that the owner can run later against the live site: sign up a test research account,
  create a post, check it appears as pending — documented in README_PLATFORM.md.
