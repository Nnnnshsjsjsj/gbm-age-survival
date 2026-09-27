// End-to-end run against the built site in ../docs. Run: npm run build && npm run e2e
//
// Phase A — Supabase BLOCKED (as in the sandbox): the science flow and all static pages must work, community
//           pages must show the calm fallback, no uncaught page errors, no horizontal overflow at 390 px.
// Phase B — Supabase MOCKED in the browser (never the network): walks the Join flow to the end and renders the
//           forum, a thread and the directory with sample data, so every step can be screenshotted.
import { createServer } from 'node:http';
import { readFile, stat, mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../docs');
const shots = path.join(here, 'shots');
const PORT = Number(process.env.E2E_PORT || 4173);

function requirePlaywright() {
  const candidates = [path.resolve(here, '..'), '/home/claude/.npm-global/lib/node_modules/playwright'];
  for (const c of candidates) {
    try { return createRequire(path.join(c, 'package.json'))('playwright'); } catch { /* next */ }
  }
  throw new Error('playwright not found');
}
const { chromium } = requirePlaywright();
const EXEC = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium';

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.csv': 'text/csv', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
async function serve() {
  const server = createServer(async (req, res) => {
    try {
      const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let file = path.join(root, url);
      if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
      const s = await stat(file).catch(() => null);
      if (!s || s.isDirectory()) file = path.join(file, 'index.html');
      if (!(await stat(file).catch(() => null))) file = path.join(root, 'index.html');
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch (e) { res.writeHead(404); res.end(String(e)); }
  });
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
  return server;
}

const ok = (cond, msg) => { if (!cond) throw new Error(`ASSERT: ${msg}`); };
const log = (...a) => console.log('[e2e]', ...a);
const base = `http://127.0.0.1:${PORT}/`;
const SUPA = /(^|\.)supabase\.co$/;
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const written = [];

/** New page with error collection and network policy. mode: 'blocked' | 'mock' */
async function openPage(browser, { width, mode = 'blocked', mock = null }) {
  // colorScheme 'light' on purpose: the app must stay dark by default whatever the OS prefers.
  const ctx = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 900 }, colorScheme: 'light', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = { page: [], console: [], hosts: new Set() };
  page.on('pageerror', (e) => errors.page.push(String(e)));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const url = m.location()?.url || '';
    let host = ''; try { host = new URL(url).hostname; } catch { /* no url */ }
    // Blocked Supabase and Google Fonts requests are expected here; the app must degrade calmly, not throw.
    if (SUPA.test(host) || FONT_HOSTS.includes(host) || /supabase\.co/.test(m.text())) return;
    errors.console.push(`${m.text()} (${url})`);
  });
  page.on('request', (r) => {
    const h = new URL(r.url()).hostname;
    if (!['localhost', '127.0.0.1', ...FONT_HOSTS].includes(h) && !SUPA.test(h)) errors.hosts.add(h);
  });
  await page.route((u) => FONT_HOSTS.includes(u.hostname), (r) => r.abort());
  if (mode === 'blocked') await page.route((u) => SUPA.test(u.hostname), (r) => r.abort('internetdisconnected'));
  else await page.route((u) => SUPA.test(u.hostname), (r) => mock.handle(r));
  return { ctx, page, errors };
}

const shotName = (name, width, variant) => `${name}-${width}${variant ? `-${variant}` : ''}.png`;
async function shot(page, name, width, variant = '') {
  const file = shotName(name, width, variant);
  await page.waitForTimeout(120);
  await page.screenshot({ path: path.join(shots, file), fullPage: true });
  written.push(file);
}
async function modalShot(page, name, width) {
  const file = shotName(name, width, '');
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(shots, file), fullPage: false });
  written.push(file);
}
async function noOverflow(page, name) {
  const w = await page.evaluate(() => document.documentElement.scrollWidth);
  const vw = page.viewportSize().width;
  ok(w <= vw, `${name}: horizontal overflow at ${vw}px (scrollWidth=${w})`);
}
async function checkLabels(page, where) {
  const unlabeled = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('input, select, textarea')) {
      const id = el.id;
      const has = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) || el.closest('label');
      if (!has) out.push(`${el.tagName}#${id || ''}.${el.className}`);
    }
    return out;
  });
  ok(unlabeled.length === 0, `${where}: unlabeled controls: ${unlabeled.join(', ')}`);
}
async function checkCharts(page, where) {
  const bad = await page.evaluate(() => [...document.querySelectorAll('svg[role="img"]')].filter((s) => s.querySelectorAll(':scope > title').length !== 1).length);
  ok(bad === 0, `${where}: every chart svg has one <title>`);
}
async function go(page, route) {
  await page.goto(`${base}#${route}`);
  await page.locator('main#main').waitFor();
}

/* ------------------------------------------------------------------ the wizard */
async function runWizard(page, width) {
  await go(page, '/analyse');
  const stepsNav = page.locator('nav[aria-label="Steps"]');
  ok(await stepsNav.count() === 1, 'steps nav exists');
  ok((await stepsNav.locator('[aria-current="step"]').innerText()).includes('Upload'), 'Upload is current');
  await shot(page, 'analyse-1-upload', width);
  await page.getByRole('button', { name: 'Try the demo file' }).click();
  await page.getByText('demo_cohort_messy.csv').waitFor();
  await shot(page, 'analyse-1b-loaded', width);
  await page.getByRole('button', { name: 'Next' }).click();

  await page.getByRole('heading', { name: 'Map your columns' }).waitFor();
  ok((await stepsNav.locator('[aria-current="step"]').innerText()).includes('Map'), 'Map is current');
  const focused = await page.evaluate(() => document.activeElement && document.activeElement.textContent);
  ok(focused && focused.includes('Map your columns'), `focus moved to step heading (was: ${focused})`);
  ok(await page.locator('#map-age').inputValue() === 'Age at Dx', 'age auto-mapped');
  ok(await page.locator('#map-time').inputValue() === 'Survival (days)', 'time auto-mapped');
  ok(await page.locator('#map-status').inputValue() === 'Status', 'status auto-mapped');
  const deadBox = page.getByRole('checkbox', { name: /^dead/ });
  if (!(await deadBox.isChecked())) await deadBox.check();
  await checkLabels(page, 'map step');
  await shot(page, 'analyse-2-map', width);
  await page.getByRole('button', { name: 'Next' }).click();

  await page.getByRole('heading', { name: 'Check the data' }).waitFor();
  const badges = await page.locator('.checklist .badge').allInnerTexts();
  ok(badges.length === 7, `7 checks shown (${badges.length})`);
  ok(badges.every((b) => /pass|warn|fail/i.test(b)), `badges carry text labels (${JSON.stringify(badges)})`);
  ok(!badges.some((b) => /fail/i.test(b)), 'no failed check on the demo file');
  await shot(page, 'analyse-3-check', width);
  await page.getByRole('button', { name: 'Run the analysis' }).click();

  await page.getByRole('heading', { name: 'Results' }).waitFor();
  await page.getByTestId('age-hr').waitFor();
  const hr = await page.getByTestId('age-hr').innerText();
  ok(hr.includes('1.022'), `age HR shows 1.022 (got: ${hr})`);
  ok(hr.includes('1.003') && /1\.04[12]/.test(hr), `CI about 1.003–1.041 (got: ${hr})`);
  await checkCharts(page, 'analyse');
  await shot(page, 'analyse-4-results', width);
  await page.getByRole('button', { name: 'Compare with reference cohorts' }).click();

  await page.getByRole('heading', { name: 'Compare' }).first().waitFor();
  await page.waitForFunction(() => /Pooled/.test(document.body.innerText));
  ok(/overlaps? the pooled interval/.test(await page.locator('main').innerText()), 'overlap sentence present');
  await page.getByRole('button', { name: 'Download JSON' }).waitFor();
  await checkLabels(page, 'compare step');
  await checkCharts(page, 'compare');
}

/* ------------------------------------------------------------------ phase A: Supabase blocked */
async function phaseBlocked(browser, width) {
  const { ctx, page, errors } = await openPage(browser, { width });
  const T = (n) => `${n}`;

  await go(page, '/');
  await page.getByRole('heading', { level: 1 }).waitFor();
  ok(/side by side/.test(await page.locator('h1').innerText()), 'home headline');
  ok(await page.title() === 'cohortex — glioblastoma cohorts, side by side', 'document title');
  ok(await page.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'dark is the default theme');
  await page.waitForTimeout(400);
  ok(await page.getByTestId('chip-researchers').count() === 0, 'live researchers chip hidden when stats fail');
  await noOverflow(page, 'home'); await checkLabels(page, 'home');
  await shot(page, 'home', width, 'dark');

  await go(page, '/explore');
  await page.waitForFunction(() => document.querySelectorAll('svg[role="img"] path').length > 2);
  await noOverflow(page, 'explore'); await checkCharts(page, 'explore'); await checkLabels(page, 'explore');
  await shot(page, 'explore', width);

  await runWizard(page, width);
  // In blocked mode the share card falls back calmly.
  ok(await page.getByTestId('calm-banner').count() >= 1, 'compare: calm banner when accounts are unavailable');
  await noOverflow(page, 'compare');
  await shot(page, 'analyse-5-compare', width);

  await go(page, '/pool');
  await page.waitForFunction(() => /Leave one out/.test(document.body.innerText) && document.querySelectorAll('svg[role="img"]').length >= 2);
  await page.waitForFunction(() => /shared cohorts unavailable/i.test(document.body.innerText), null, { timeout: 20000 });
  await noOverflow(page, 'pool'); await checkCharts(page, 'pool');
  await shot(page, 'pool', width);

  await go(page, '/research');
  await page.getByTestId('calm-banner').waitFor({ timeout: 20000 });
  ok(await page.getByRole('heading', { name: 'The forum opens with accounts' }).count() === 1, 'research: calm fallback');
  await noOverflow(page, 'research'); await checkLabels(page, 'research');
  await shot(page, 'research-fallback', width);

  await go(page, '/research/methods');
  await page.getByTestId('calm-banner').waitFor({ timeout: 20000 });
  await noOverflow(page, 'research board');

  await go(page, '/research/t/00000000-0000-0000-0000-000000000000');
  await page.getByTestId('calm-banner').waitFor({ timeout: 20000 });
  await noOverflow(page, 'thread');

  await go(page, '/people');
  await page.getByTestId('calm-banner').waitFor({ timeout: 20000 });
  await noOverflow(page, 'people');

  await go(page, '/families');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.getByTestId('resources').locator('article').first().waitFor();
  ok((await page.getByTestId('resources').locator('article').count()) >= 8, 'resources listed');
  await noOverflow(page, 'families'); await checkLabels(page, 'families');
  await shot(page, 'families', width);

  for (const [route, name, heading] of [['/about', 'about', 'About cohortex'], ['/rules', 'rules', 'House rules'], ['/privacy', 'privacy', 'What we keep, and what we never see'], ['/account', 'account', 'You are not signed in'], ['/mod', 'mod', 'This desk is for moderators'], ['/nope', 'notfound', 'This page does not exist']]) {
    await go(page, route);
    await page.getByRole('heading', { name: heading }).first().waitFor();
    await noOverflow(page, name);
    if (['about', 'rules'].includes(name)) await shot(page, name, width);
  }

  // Join modal: steps 1 and 2, then the calm fallback when sign-up cannot reach Supabase.
  await go(page, '/');
  const joinBtn = page.locator('.topbar').getByRole('button', { name: 'Join', exact: true });
  await joinBtn.click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  await page.getByTestId('join-step-1').waitFor();
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'detached' });
  ok(await page.evaluate(() => document.activeElement?.textContent?.trim()) === 'Join', 'focus returns to Join after Escape');
  await joinBtn.click();
  await page.getByTestId('join-step-1').waitFor();
  for (let i = 0; i < 14; i++) await page.keyboard.press('Tab');
  ok(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')), 'focus is trapped in the dialog');
  await page.getByRole('radio', { name: /^Research space/ }).click();
  await modalShot(page, 'join-1-space', width);
  await dialog.getByRole('button', { name: 'Continue' }).click();
  await page.getByTestId('join-step-2').waitFor();
  await page.locator('#j-email').fill('someone@example.org');
  await page.locator('#j-pw').fill('correct horse battery');
  await checkLabels(page, 'join step 2');
  await modalShot(page, 'join-2-credentials', width);
  await dialog.getByRole('button', { name: 'Create account' }).click();
  await dialog.getByTestId('calm-banner').waitFor({ timeout: 20000 });
  await modalShot(page, 'join-2-fallback', width);
  await page.keyboard.press('Escape');

  // Log in dialog also degrades calmly.
  if (width >= 900) {
    await page.locator('.topbar').getByRole('button', { name: 'Join', exact: true }).click();
    await dialog.getByRole('button', { name: 'I already have an account' }).click();
    await page.getByTestId('login-form').waitFor();
    await page.locator('#l-email').fill('someone@example.org');
    await page.locator('#l-pw').fill('whatever-password');
    await dialog.getByRole('button', { name: 'Log in' }).click();
    await dialog.getByTestId('calm-banner').waitFor({ timeout: 20000 });
    await page.keyboard.press('Escape');
  } else {
    await page.getByRole('button', { name: 'Menu' }).click();
    await dialog.waitFor();
    await modalShot(page, 'menu-sheet', width);
    await page.keyboard.press('Escape');
  }

  ok(errors.hosts.size === 0, `requests to unexpected hosts: ${[...errors.hosts].join(', ')}`);
  ok(errors.page.length === 0, `page errors: ${errors.page.join(' | ')}`);
  ok(errors.console.length === 0, `console errors: ${errors.console.join(' | ')}`);
  await ctx.close();
}

async function lightHome(browser, width) {
  // Dark is the default; the light theme is an explicit, remembered choice.
  const { ctx, page, errors } = await openPage(browser, { width });
  await ctx.addInitScript(() => { try { localStorage.setItem('plateau-theme', 'light'); } catch { /* storage off */ } });
  await go(page, '/');
  await page.getByRole('heading', { level: 1 }).waitFor();
  ok(await page.evaluate(() => document.documentElement.dataset.theme) === 'light', 'light theme applied from storage');
  await noOverflow(page, 'home light');
  await page.waitForTimeout(400);
  await shot(page, 'home', width, 'light');
  await go(page, '/explore');
  await page.waitForFunction(() => document.querySelectorAll('svg[role="img"] path').length > 2);
  await shot(page, 'explore', width, 'light');
  ok(errors.page.length === 0, `light: page errors: ${errors.page.join(' | ')}`);
  await ctx.close();
}

/* ------------------------------------------------------------------ phase B: Supabase mocked in the browser */
function makeMock() {
  const uid = '11111111-2222-4333-8444-555555555555';
  const now = Date.now();
  const ago = (min) => new Date(now - min * 60000).toISOString();
  const state = { profile: null, email: null, space: 'research', votes: new Set() };
  const author = (handle, role, space = 'research') => ({ handle, role, space });
  const posts = {
    research: [
      { id: 'a0000000-0000-4000-8000-000000000001', board: 'methods', board_title: 'Methods & statistics', title: 'Schoenfeld test flags age in my 60-patient series. What now?', excerpt: 'Global p = 0.03 for age, and the residual plot bends after month 18. I have 41 deaths. Is a time-varying coefficient reasonable at this size, or should I just report the average HR with a caveat?', status: 'approved', replies: 7, votes: 12, created_at: ago(190), last_activity: ago(25), author: author('km_curious', 'student'), mine: false, voted: false },
      { id: 'a0000000-0000-4000-8000-000000000002', board: 'tcga-gbm', board_title: 'TCGA-GBM', title: 'Why TCGA median OS looks shorter than modern trials', excerpt: 'Most TCGA patients were diagnosed before temozolomide became standard in 2005. If you compare with Stupp-era trials, filter by year of diagnosis first.', status: 'approved', replies: 3, votes: 9, created_at: ago(60 * 26), last_activity: ago(60 * 5), author: author('neuro_onc_md', 'clinician'), mine: false, voted: true },
      { id: 'a0000000-0000-4000-8000-000000000003', board: 'lobby', board_title: 'The lobby', title: 'Hello from a biostatistics MSc in Novi Sad', excerpt: 'Working on a thesis about age and MGMT in a regional cohort. Happy to swap code for Efron ties.', status: 'approved', replies: 2, votes: 4, created_at: ago(60 * 50), last_activity: ago(60 * 30), author: author('mila_r', 'student'), mine: false, voted: false },
      { id: 'a0000000-0000-4000-8000-000000000004', board: 'show-your-work', board_title: 'Show your work', title: 'Poster draft: age effect in 3 Balkan hospitals', excerpt: 'Pooled HR per year 1.024. Would love feedback on the forest plot before the regional fair.', status: 'pending', replies: 0, votes: 0, created_at: ago(3), last_activity: ago(3), author: author('test_student', 'student'), mine: true, voted: false },
    ],
    family: [
      { id: 'b0000000-0000-4000-8000-000000000001', board: 'caregivers', board_title: 'Caregivers', title: 'Keeping track of the steroid schedule', excerpt: 'We used a whiteboard on the fridge and a shared phone note. What worked for you when the dose changes every few days?', status: 'approved', replies: 5, votes: 8, created_at: ago(300), last_activity: ago(40), author: author('dana_k', 'caregiver', 'family'), mine: false, voted: false },
      { id: 'b0000000-0000-4000-8000-000000000002', board: 'questions-for-doctors', board_title: 'Questions for your doctor', title: 'Questions we took to the first oncology visit', excerpt: 'A list that helped us: what is the plan for the next 6 weeks, who do we call at night, what side effects should we watch for.', status: 'approved', replies: 11, votes: 21, created_at: ago(60 * 30), last_activity: ago(60 * 2), author: author('marko_family', 'family', 'family'), mine: false, voted: false },
    ],
  };
  const thread = (id) => {
    const all = [...posts.research, ...posts.family];
    const p = all.find((x) => x.id === id) || posts.research[0];
    const space = posts.family.includes(p) ? 'family' : 'research';
    return {
      ...p, space, body: `${p.excerpt}\n\nHere is what I tried so far:\n1. Stratified by age band\n2. Added a log(t) interaction\n\nThe lifelines docs discuss this at https://lifelines.readthedocs.io/en/latest/ and I followed that.`, mod_note: null, replies_count: 2,
      replies: [
        { id: 'r1', body: 'With 41 events I would report the average HR and show the residual plot in a supplement. A time-varying term will be very unstable.', created_at: ago(120), author: author('biostat_teacher', 'teacher'), mine: false, removed: false },
        { id: 'r2', body: 'Agree. You could also split follow-up at 18 months and fit two HRs, but say clearly it is exploratory.', created_at: ago(30), author: author('neuro_onc_md', 'clinician'), mine: false, removed: false },
      ],
    };
  };
  const people = [
    { handle: 'biostat_teacher', role_label: 'teacher', display_name: 'Ana P.', institution: 'University of Belgrade', country: 'Serbia', tags: ['survival analysis', 'statistics teaching'], works_with: 'TCGA-GBM for teaching Cox models', created_at: ago(60 * 24 * 40) },
    { handle: 'neuro_onc_md', role_label: 'clinician', display_name: null, institution: 'Regional cancer centre', country: 'Montenegro', tags: ['neuro-oncology', 'clinical trials'], works_with: 'A 120-patient hospital series, 2012–2022', created_at: ago(60 * 24 * 12) },
    { handle: 'mila_r', role_label: 'student', display_name: 'Mila', institution: 'University of Novi Sad', country: 'Serbia', tags: ['epidemiology', 'genomics'], works_with: 'CGGA and MSK-IMPACT', created_at: ago(60 * 24 * 3) },
    { handle: 'km_curious', role_label: 'student', display_name: null, institution: null, country: 'Bosnia and Herzegovina', tags: ['survival analysis', 'machine learning'], works_with: null, created_at: ago(60 * 20) },
  ];
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const session = () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const user = { id: uid, aud: 'authenticated', role: 'authenticated', email: state.email, user_metadata: { space: state.space }, app_metadata: { provider: 'email' }, created_at: ago(1) };
    return { access_token: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: uid, exp, role: 'authenticated', email: state.email })}.sig`, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'refresh-mock', user };
  };
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS', 'access-control-expose-headers': '*' };
  const json = (route, body, status = 200) => route.fulfill({ status, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return {
    state,
    async handle(route) {
      const req = route.request();
      const url = new URL(req.url());
      const p = url.pathname;
      const method = req.method();
      if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      let body = {};
      try { body = req.postDataJSON() || {}; } catch { body = {}; }
      if (p === '/auth/v1/signup') { state.email = body.email; state.space = body.data?.space || 'research'; return json(route, session()); }
      if (p === '/auth/v1/token') return json(route, session());
      if (p === '/auth/v1/user') return json(route, session().user);
      if (p === '/auth/v1/logout') return route.fulfill({ status: 204, headers: cors });
      if (p === '/rest/v1/rpc/stats') return json(route, { researchers: 38, families: 11, posts: 64, shared_cohorts: 1, median_review_minutes: 22 });
      if (p === '/rest/v1/rpc/is_admin') return json(route, false);
      if (p === '/rest/v1/rpc/handle_available') return json(route, body.p_handle !== 'taken');
      if (p === '/rest/v1/rpc/feed') {
        const list = (posts[body.p_space] || []).filter((x) => !body.p_board || x.board === body.p_board)
          .filter((x) => x.status === 'approved' || (state.email && x.mine))
          .map((x) => ({ ...x, voted: x.voted || state.votes.has(x.id), votes: x.votes + (state.votes.has(x.id) ? 1 : 0) }));
        return json(route, list);
      }
      if (p === '/rest/v1/rpc/thread') return json(route, thread(body.p_id));
      if (p === '/rest/v1/profiles' && method === 'GET') {
        if (url.searchParams.get('id')) return json(route, state.profile ? [state.profile] : []);
        return json(route, people);
      }
      if (p === '/rest/v1/profiles' && method === 'POST') { state.profile = { ...body, banned: false, created_at: ago(0) }; return route.fulfill({ status: 201, headers: cors }); }
      if (p === '/rest/v1/profiles' && method === 'PATCH') { state.profile = { ...state.profile, ...body }; return route.fulfill({ status: 204, headers: cors }); }
      if (p === '/rest/v1/threads' && method === 'GET') return json(route, []);
      if (p === '/rest/v1/votes') { if (method === 'POST') state.votes.add(body.thread_id); return route.fulfill({ status: 201, headers: cors }); }
      if (p === '/rest/v1/cohort_summaries' && method === 'GET') {
        return json(route, [{ id: 'c1', cohort_name: 'Balkan hospital series', country: 'Serbia', years_from: 2012, years_to: 2022, n: 142, events: 118, status: 'approved', models: [{ covariates: ['age'], beta: [0.0231], se: [0.0072], n: 142, events: 118 }] }]);
      }
      return route.fulfill({ status: 201, headers: cors });
    },
  };
}

async function phaseMocked(browser, width, space) {
  const mock = makeMock();
  const { ctx, page, errors } = await openPage(browser, { width, mode: 'mock', mock });
  const fam = space === 'family';
  await go(page, fam ? '/families' : '/research');
  const dialog = page.getByRole('dialog');
  if (fam) await page.getByRole('button', { name: 'Join as family' }).click();
  else await page.locator('.topbar').getByRole('button', { name: 'Join', exact: true }).click();
  await page.getByTestId('join-step-1').waitFor();
  await page.getByRole('radio', { name: fam ? /^Family space/ : /^Research space/ }).click();
  await dialog.getByRole('button', { name: 'Continue' }).click();
  await page.locator('#j-email').fill('tester@example.org');
  await page.locator('#j-pw').fill('a long enough password');
  await dialog.getByRole('button', { name: 'Create account' }).click();
  await page.getByTestId('join-step-3').waitFor();
  await page.locator('#j-handle').fill(fam ? 'test_family' : 'test_student');
  await dialog.getByText('Available.').waitFor();
  if (!fam) await dialog.getByRole('button', { name: 'survival analysis' }).click();
  await checkLabels(page, 'join step 3');
  if (!fam) await modalShot(page, 'join-3-handle', width);
  await dialog.getByRole('button', { name: 'Continue' }).click();
  await page.getByTestId('join-step-4').waitFor();
  await dialog.getByRole('checkbox', { name: 'I have read the rules' }).check();
  await dialog.getByRole('checkbox', { name: 'I am 18 or older' }).check();
  if (!fam) await modalShot(page, 'join-4-rules', width);
  await dialog.getByRole('button', { name: 'Join', exact: true }).click();
  await page.getByTestId('join-step-done').waitFor();
  ok(mock.state.profile?.adult_confirmed === true && !!mock.state.profile?.rules_accepted_at, 'profile inserted with adult_confirmed and rules_accepted_at');
  ok(mock.state.profile?.space === space, `profile space is ${space}`);
  if (!fam) await modalShot(page, 'join-5-done', width);
  await dialog.getByRole('button', { name: fam ? 'Go to the family space' : 'Go to the research space' }).click();
  await dialog.waitFor({ state: 'detached' });

  await page.locator('[data-testid="post"]').first().waitFor();
  if (!fam) {
    ok(await page.getByText('Waiting for review').count() >= 1, 'own pending post is badged');
    ok(/Median review time: 22 min/.test(await page.getByTestId('premod-banner').innerText()), 'median review time from stats');
  }
  await noOverflow(page, `${space} forum (mock)`);
  await shot(page, `${fam ? 'families' : 'research'}-forum-mock`, width);

  await page.getByRole('button', { name: 'New post' }).first().click();
  await page.locator('#np-title').fill('How do you handle KPS = 0 in old registries?');
  await page.locator('#np-body').fill('Some rows have KPS 0 but a survival time of several months.');
  await checkLabels(page, 'new post');
  if (!fam) await modalShot(page, 'new-post-mock', width);
  await dialog.getByRole('button', { name: 'Send for review' }).click();
  await dialog.waitFor({ state: 'detached' });
  await page.getByText('Your post is waiting for review').waitFor();

  await page.locator('[data-testid="post"] h3 a').first().click();
  await page.locator('.tview .op').waitFor();
  ok(await page.locator('.tview .op a[href^="https://lifelines"]').count() === 1, 'URLs in posts are autolinked');
  await noOverflow(page, 'thread (mock)');
  await shot(page, `${fam ? 'families' : 'research'}-thread-mock`, width);

  if (!fam) {
    await go(page, '/people');
    await page.locator('.person').first().waitFor();
    await noOverflow(page, 'people (mock)');
    await shot(page, 'people-mock', width);
    await go(page, '/pool');
    await page.waitForFunction(() => /Balkan hospital series/.test(document.body.innerText));
    await go(page, '/account');
    await page.getByRole('heading', { name: '@test_student' }).waitFor();
    await noOverflow(page, 'account (mock)');
    await shot(page, 'account-mock', width);
  }
  ok(errors.page.length === 0, `mock ${space}: page errors: ${errors.page.join(' | ')}`);
  ok(errors.console.length === 0, `mock ${space}: console errors: ${errors.console.join(' | ')}`);
  await ctx.close();
}

async function main() {
  await rm(shots, { recursive: true, force: true });
  await mkdir(shots, { recursive: true });
  const server = await serve();
  const browser = await chromium.launch({ executablePath: EXEC, headless: true });
  let failed = null;
  try {
    if (!process.env.E2E_ONLY_MOCK) {
      for (const w of [1280, 390]) { log(`phase A (Supabase blocked) at ${w}px`); await phaseBlocked(browser, w); }
      for (const w of [1280, 390]) await lightHome(browser, w);
    }
    for (const w of [1280, 390]) { log(`phase B (Supabase mocked) at ${w}px`); await phaseMocked(browser, w, 'research'); }
    await phaseMocked(browser, 1280, 'family');
    log(`PASS: ${written.length} screenshots in e2e/shots; age HR 1.022 (1.003–1.041); calm fallback with Supabase blocked; join flow and forum with Supabase mocked; no page errors`);
  } catch (e) {
    failed = e;
  } finally {
    await browser.close();
    server.close();
  }
  if (failed) { console.error('[e2e] FAIL', failed); process.exit(1); }
}

main();
