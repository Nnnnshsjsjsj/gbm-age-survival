// End-to-end run against the built site in ../docs. Run: npm run build && npm run e2e
//
// Phase A — every outside host BLOCKED: the science tools, the Research hub and the Patients & families guide
// must work fully offline (all catalogues are static files).
// Phase G — the two guides with motion and WebGL on (constellation, cell states, MRI slicer, globe) for screenshots.
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
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const LOCAL = ['localhost', '127.0.0.1'];
const written = [];

/** New page with error collection. Every outside host is blocked: the site must not need one. */
async function openPage(browser, { width }) {
  // colorScheme 'light' on purpose: the app must stay dark by default whatever the OS prefers.
  const ctx = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 900 }, colorScheme: 'light', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = { page: [], console: [], hosts: new Set() };
  page.on('pageerror', (e) => errors.page.push(String(e)));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const url = m.location()?.url || '';
    let host = ''; try { host = new URL(url).hostname; } catch { /* no url */ }
    if (FONT_HOSTS.includes(host)) return; // fonts are blocked here on purpose
    errors.console.push(`${m.text()} (${url})`);
  });
  page.on('request', (r) => {
    const h = new URL(r.url()).hostname;
    if (![...LOCAL, ...FONT_HOSTS].includes(h)) errors.hosts.add(h);
  });
  await page.route((u) => !LOCAL.includes(u.hostname), (r) => r.abort('internetdisconnected'));
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
  ok(/measured/.test(await page.locator('h1').innerText()), 'home headline');
  ok(await page.title() === 'cohortex — glioblastoma cohorts, side by side', 'document title');
  ok(await page.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'dark is the default theme');
  await page.waitForTimeout(400);
  await reducedStory(page, width);
  await noOverflow(page, 'home'); await checkLabels(page, 'home');
  await shot(page, 'home', width, 'dark');

  await go(page, '/explore');
  await page.waitForFunction(() => document.querySelectorAll('svg[role="img"] path').length > 2);
  await noOverflow(page, 'explore'); await checkCharts(page, 'explore'); await checkLabels(page, 'explore');
  await shot(page, 'explore', width);

  await runWizard(page, width);
  ok(await page.getByRole('link', { name: /Offer it on GitHub/ }).count() === 1, 'compare: summary can be offered on GitHub (no accounts)');
  await noOverflow(page, 'compare');
  await shot(page, 'analyse-5-compare', width);

  await go(page, '/pool');
  await page.waitForFunction(() => /Leave one out/.test(document.body.innerText) && document.querySelectorAll('svg[role="img"]').length >= 2);
  await noOverflow(page, 'pool'); await checkCharts(page, 'pool');
  await shot(page, 'pool', width);

  // Research hub: search, filters, tabs, 3D fallback-safe
  await go(page, '/hub');
  await page.getByRole('heading', { level: 1, name: /Start in glioblastoma research/ }).waitFor();
  await page.locator('#library .paper').first().waitFor({ timeout: 20000 });
  ok(await page.locator('#library .paper').count() === 12, 'library shows the first 12 papers');
  await page.locator('#hub-q').fill('MGMT');
  await page.getByRole('heading', { name: /Search results/ }).waitFor();
  ok(await page.locator('#results .paper').count() >= 1, 'search finds MGMT papers');
  await page.locator('#hub-q').fill('');
  await page.getByRole('button', { name: /^Heterogeneity/ }).click();
  const het = await page.locator('#library .paper').count();
  ok(het >= 5 && het <= 12, `topic filter narrows the library (${het})`);
  await page.getByRole('tab', { name: /^Software/ }).click();
  ok(await page.locator('#tb-panel .tool').count() >= 10, 'toolbox software tab lists tools');
  await page.getByRole('tab', { name: /Survival statistics/ }).click();
  ok(await page.locator('.timeline li').count() >= 5, 'reading path timeline');
  await page.getByRole('button', { name: 'Evenly mixed' }).click();
  await page.waitForFunction(() => /1\.00/.test(document.querySelector('.cs-h')?.textContent || ''));
  ok(true, 'cell-state entropy reads 1.00 for an even mix');
  ok(await page.locator('.mri-frame canvas').count() === 1, 'MRI slice canvas present');
  await page.getByRole('button', { name: 'FLAIR' }).click();
  await noOverflow(page, 'hub'); await checkLabels(page, 'hub');
  await shot(page, 'hub', width);

  // Patients & families: country picker, help box, directory, reading filters
  await go(page, '/patients');
  await page.getByRole('heading', { level: 1, name: /Support for everyone/ }).waitFor();
  await page.locator('#pt-country').selectOption('RS');
  await page.locator('#directory .entry').first().waitFor();
  ok(/194/.test(await page.locator('#help').innerText()), 'Serbia: ambulance 194 in the help box');
  ok(await page.locator('#help a[href^="tel:"]').count() >= 2, 'help box has tap-to-call links');
  ok(await page.locator('#directory .entry').count() >= 5, 'Serbian services listed');
  await page.locator('#pt-country').selectOption('RU');
  await page.waitForFunction(() => /Россия|Russia/.test(document.querySelector('#directory')?.innerText || ''));
  await page.getByRole('button', { name: /^Books/ }).click();
  ok(await page.locator('.read').count() >= 6, 'books listed');
  await noOverflow(page, 'patients'); await checkLabels(page, 'patients');
  await shot(page, 'patients', width);

  // old community addresses redirect to the guides
  await go(page, '/research/methods');
  await page.getByRole('heading', { level: 1, name: /Start in glioblastoma research/ }).waitFor();
  await go(page, '/families');
  await page.getByRole('heading', { level: 1, name: /Support for everyone/ }).waitFor();

  for (const [route, name, heading] of [['/about', 'about', 'About cohortex'], ['/privacy', 'privacy', 'What we keep, and what we never see'], ['/nope', 'notfound', 'This page does not exist']]) {
    await go(page, route);
    await page.getByRole('heading', { name: heading }).first().waitFor();
    await noOverflow(page, name);
    if (['about', 'privacy'].includes(name)) await shot(page, name, width);
  }
  ok(await page.locator('.topbar').getByRole('button', { name: 'Join' }).count() === 0, 'no Join button any more');

  if (width < 900) {
    await page.getByRole('button', { name: 'Menu' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    ok(await dialog.getByRole('link', { name: 'Research hub' }).count() === 1, 'menu sheet links the Research hub');
    await modalShot(page, 'menu-sheet', width);
    await page.keyboard.press('Escape');
  } else {
    await page.locator('.topbar').getByRole('button', { name: /^Tools/ }).click();
    ok(await page.locator('#tools-menu a').count() === 3, 'Tools menu lists Explore, Analyse, Pool');
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

/* ------------------------------------------------------------------ the story and the Brain lab */
const CHAPTERS = ['One tumour, four layers.', 'Four cell states in every tumour.', 'Every year of age raises the hazard of death by about', 'Thirteen cohorts, one direction.', 'Bring your cohort. It never leaves this tab.', 'For the people behind the numbers.'];

/** Reduced motion: every chapter heading is there and visible without scrolling tricks (no Lenis, no pins). */
async function reducedStory(page, width) {
  for (const name of CHAPTERS) ok(await page.getByRole('heading', { name, exact: false }).count() >= 1, `story heading "${name}"`);
  const r = await page.evaluate(() => ({
    lenis: !!window.lenis,
    pins: document.querySelectorAll('.pin-spacer').length,
    hidden: [...document.querySelectorAll('.reveal, .st-h2, .st-kinetic, .st-caps li, .split-word')].filter((el) => Number(getComputedStyle(el).opacity) < 0.99 || getComputedStyle(el).transform !== 'none').length,
    motionClass: document.documentElement.classList.contains('motion'),
    canvas: !!document.querySelector('[data-testid="brain-canvas"], [data-testid="brain-fallback"]'),
  }));
  ok(!r.lenis, `reduced motion: no Lenis (${width})`);
  ok(r.pins === 0, `reduced motion: no pinned sections (${r.pins})`);
  ok(!r.motionClass && r.hidden === 0, `reduced motion: all story content visible (${r.hidden} hidden)`);
  ok(r.canvas, 'story: brain canvas or fallback present');
}

async function waitBrain(page, timeout = 120000) {
  await page.waitForFunction(() => document.documentElement.dataset.brain === 'ready', null, { timeout });
  await page.waitForTimeout(600);
}

async function phaseBrainLab(browser, width) {
  const { ctx, page, errors } = await openPage(browser, { width });
  await go(page, '/brain');
  await page.getByRole('heading', { name: 'Brain lab', level: 1 }).waitFor();
  await page.locator('.lab-viewer canvas').waitFor({ timeout: 60000 });
  ok(await page.evaluate(() => { const c = document.querySelector('.lab-viewer canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }), 'Brain lab: WebGL canvas with a live context');
  await waitBrain(page);
  const tris = Number(await page.evaluate(() => document.documentElement.dataset.brainTris));
  log(`  brain triangles at ${width}px: ${tris}`);
  ok(tris > 20000 && tris < 400000, `triangle budget (${tris})`);
  if (width < 900) await page.getByRole('tab', { name: 'Layers' }).click();
  const oedema = page.getByTestId('layer-oedema');
  ok(await oedema.getAttribute('aria-pressed') === 'true', 'oedema layer starts on');
  await oedema.click();
  ok(await oedema.getAttribute('aria-pressed') === 'false', 'layer toggle flips aria-pressed');
  await oedema.click();
  await page.getByTestId('colour-state').click();
  ok(await page.getByTestId('colour-state').getAttribute('aria-checked') === 'true', 'colour by cell state');
  await page.getByTestId('colour-single').click();
  if (width < 900) await page.getByRole('tab', { name: 'View' }).click();
  await page.keyboard.press('2');
  ok(await page.getByRole('button', { name: /Side/ }).getAttribute('aria-pressed') === 'true', 'key 2 selects the side view');
  await page.getByRole('button', { name: /Reset view/ }).click();
  await checkLabels(page, 'brain lab'); await noOverflow(page, 'brain lab');
  ok(errors.page.length === 0, `brain lab: page errors: ${errors.page.join(' | ')}`);
  ok(errors.console.length === 0, `brain lab: console errors: ${errors.console.join(' | ')}`);
  await ctx.close();

  // no WebGL → the static illustration
  const fb = await openPage(browser, { width });
  await fb.page.goto(`${base}?nogl#/brain`);
  await fb.page.getByTestId('brain-fallback').waitFor();
  ok(await fb.page.locator('.lab-viewer canvas').count() === 0, 'fallback: no canvas without WebGL');
  if (width >= 900) await shot(fb.page, 'brainlab-fallback', width);
  await fb.page.goto(`${base}?nogl#/`);
  await fb.page.getByTestId('brain-fallback').waitFor();
  ok(fb.errors.page.length === 0, `fallback: page errors: ${fb.errors.page.join(' | ')}`);
  await fb.ctx.close();
}

/** Motion on (as a visitor would see it): preloader, hero, every chapter, and the Brain lab states. */
async function phaseImmersive(browser, width) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 900 }, colorScheme: 'dark', reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route((u) => !LOCAL.includes(u.hostname), (r) => r.abort());
  const view = async (name) => { const file = `${name}-${width}.png`; await page.screenshot({ path: path.join(shots, file) }); written.push(file); };

  await page.goto(`${base}#/`);
  await page.getByTestId('preloader').waitFor();
  await page.waitForTimeout(420);
  await view('preloader');
  await page.getByTestId('preloader').waitFor({ state: 'detached', timeout: 10000 });
  await waitBrain(page);
  await page.waitForTimeout(1800);
  await view('story-hero');
  const motion = await page.evaluate(() => ({ lenis: !!window.lenis, pins: document.querySelectorAll('.pin-spacer').length }));
  ok(motion.lenis, 'motion: Lenis runs');
  if (width >= 1024) ok(motion.pins >= 2, `motion: tumour chapter and cohort strip are pinned (${motion.pins})`);

  const spots = width >= 1024
    ? [['ch1', 0.35, 'story-ch1-tumour'], ['ch1', 1.3, 'story-ch1-infiltration'], ['ch2', 0.05, 'story-ch2-states'], ['ch2', 1.25, 'story-ch2-manifesto'], ['ch3', 0.1, 'story-ch3-age'], ['ch3', 0.95, 'story-ch3-km'], ['ch4', 0.9, 'story-ch4-cohorts'], ['ch4', 2.2, 'story-ch4-forest'], ['ch5', 0.05, 'story-ch5-cohort'], ['ch6', 0.05, 'story-ch6-guides']]
    : [['ch1', 0.0, 'story-ch1-tumour'], ['ch2', 0.0, 'story-ch2-states'], ['ch2', 1.0, 'story-ch2-manifesto'], ['ch3', 0.0, 'story-ch3-age'], ['ch4', 0.0, 'story-ch4-cohorts'], ['ch5', 0.0, 'story-ch5-cohort'], ['ch6', 0.0, 'story-ch6-guides']];
  for (const [id, frac, name] of spots) {
    const y = await page.evaluate(([id, frac]) => { const el = document.getElementById(id); return el.getBoundingClientRect().top + window.scrollY + frac * window.innerHeight; }, [id, frac]);
    await page.evaluate((y) => window.lenis.scrollTo(y, { immediate: true }), y);
    await page.waitForTimeout(2600);
    await view(name);
  }
  await noOverflow(page, 'story (motion)');

  // Brain lab: default, cross-section, cell-state colouring
  await page.goto(`${base}#/brain`);
  await waitBrain(page);
  await page.waitForTimeout(1500);
  await view('brainlab-default');
  if (width < 900) await page.getByRole('tab', { name: 'Layers' }).click();
  await page.getByTestId('cut-toggle').check({ force: true });
  await page.waitForTimeout(1500);
  await view('brainlab-section');
  await page.getByTestId('cut-toggle').uncheck({ force: true });
  await page.getByTestId('colour-state').click();
  if (width < 900) await page.getByRole('tab', { name: 'View' }).click();
  await page.getByRole('button', { name: /Tumour close-up/ }).click();
  await page.waitForTimeout(2600);
  await view('brainlab-cells');
  ok(errors.length === 0, `immersive: page errors: ${errors.join(' | ')}`);
  await ctx.close();
}

/* ------------------------------------------------------------------ phase G: the guides with motion and WebGL */
async function phaseGuides(browser, width) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 900 }, colorScheme: 'dark', reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route((u) => !['127.0.0.1', 'localhost'].includes(u.hostname), (r) => r.abort());
  const view = async (name) => { const file = `${name}-${width}.png`; await page.screenshot({ path: path.join(shots, file) }); written.push(file); };
  const to = async (sel, wait = 2200) => {
    await page.evaluate((sel) => { const el = document.querySelector(sel); const y = el.getBoundingClientRect().top + window.scrollY - 80; if (window.lenis) window.lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y); }, sel);
    await page.waitForTimeout(wait);
  };

  await page.goto(`${base}#/hub`);
  await page.locator('.cst-wrap canvas').waitFor({ timeout: 60000 });
  await page.waitForTimeout(2500);
  await view('hub-hero');
  await page.locator('#hub-q').fill('single-cell');
  await page.waitForTimeout(400);
  await to('#results', 900); await view('hub-search');
  await page.locator('#hub-q').fill('');
  await to('#paths', 1200); await view('hub-paths');
  await to('#library', 1200); await view('hub-library');
  await to('#toolbox', 1200); await view('hub-toolbox');
  await to('#model-cells', 3500); await view('hub-model-cells');
  await to('#model-mri', 3500); await view('hub-model-mri');
  await page.getByRole('button', { name: /Show this path/ }).first().click().catch(() => {});
  await page.waitForTimeout(2500); await view('hub-hero-path');

  await page.goto(`${base}#/patients`);
  await page.locator('#pt-country').selectOption('RS');
  await page.locator('.globe-wrap canvas').waitFor({ timeout: 60000 });
  await page.waitForTimeout(3500);
  await view('patients-hero');
  await to('#help', 1200); await view('patients-help');
  await to('#directory', 1200); await view('patients-directory');
  await to('#reading', 1200); await view('patients-reading');
  await noOverflow(page, 'patients (motion)');
  ok(errors.length === 0, `guides: page errors: ${errors.join(' | ')}`);
  await ctx.close();
}

async function main() {
  await rm(shots, { recursive: true, force: true });
  await mkdir(shots, { recursive: true });
  const server = await serve();
  // SwiftShader gives headless Chromium a WebGL context, so the 3D brain really renders in these runs.
  const browser = await chromium.launch({ executablePath: EXEC, headless: true, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  let failed = null;
  try {
    if (!process.env.E2E_ONLY_3D && !process.env.E2E_ONLY_GUIDES) {
      for (const w of [1280, 390]) { log(`phase A (offline) at ${w}px`); await phaseBlocked(browser, w); }
      for (const w of [1280, 390]) await lightHome(browser, w);
    }
    if (!process.env.E2E_ONLY_GUIDES) {
      for (const w of [1280, 390]) { log(`Brain lab at ${w}px`); await phaseBrainLab(browser, w); }
      for (const w of [1280, 390]) { log(`immersive story with motion at ${w}px`); await phaseImmersive(browser, w); }
      if (process.env.E2E_ONLY_3D) { log(`PASS (3D only): ${written.length} screenshots`); return; }
    }
    for (const w of [1280, 390]) { log(`guides with motion at ${w}px`); await phaseGuides(browser, w); }
    log(`PASS: ${written.length} screenshots in e2e/shots; age HR 1.022 (1.003–1.041); everything works offline; Research hub search, filters, paths, toolbox, cell-state entropy, MRI slicer; Patients & families by country; Brain lab + WebGL + fallback; story with and without motion; no page errors`);
  } catch (e) {
    failed = e;
  } finally {
    await browser.close();
    server.close();
  }
  if (failed) { console.error('[e2e] FAIL', failed); process.exit(1); }
}

main();
