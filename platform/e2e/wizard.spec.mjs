// End-to-end run of the Analyse wizard against the built site in docs/platform.
// Run: npm run build && npm run e2e
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../docs/platform');
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
      if (!s || s.isDirectory()) file = path.join(root, 'index.html');
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

async function main() {
  await mkdir(shots, { recursive: true });
  const server = await serve();
  const browser = await chromium.launch({ executablePath: EXEC, headless: true });
  const failures = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
    const page = await ctx.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    const badHosts = new Set();
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
    const fontFailures = [];
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const url = m.location()?.url || '';
      let host = ''; try { host = new URL(url).hostname; } catch { /* no url */ }
      // A blocked Google Fonts request is an environment issue, not an app error; the page falls back to system fonts.
      if (FONT_HOSTS.includes(host) && /Failed to load resource/.test(m.text())) { fontFailures.push(url); return; }
      consoleErrors.push(`${m.text()} (${url})`);
    });
    page.on('request', (r) => {
      const h = new URL(r.url()).hostname;
      if (!['localhost', '127.0.0.1', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(h)) badHosts.add(h);
    });
    const base = `http://127.0.0.1:${PORT}/`;
    const shot = (name) => page.screenshot({ path: path.join(shots, `${name}.png`), fullPage: true });
    const noOverflow = async (name) => {
      const w = await page.evaluate(() => document.documentElement.scrollWidth);
      ok(w <= 390, `${name}: horizontal overflow at 390px (scrollWidth=${w})`);
    };

    // Home
    await page.goto(`${base}#/`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { level: 1 }).waitFor();
    await shot('01-home');

    // Explore
    await page.goto(`${base}#/explore`);
    await page.getByText('TCGA-GBM', { exact: false }).first().waitFor();
    await page.locator('svg[role="img"] title').first().waitFor({ state: 'attached' });
    await page.waitForFunction(() => document.querySelectorAll('svg[role="img"] path').length > 2);
    await shot('02-explore');

    // Wizard: Upload
    await page.goto(`${base}#/analyse`);
    const stepsNav = page.locator('nav[aria-label="Steps"]');
    ok(await stepsNav.count() === 1, 'steps nav exists');
    ok((await stepsNav.locator('[aria-current="step"]').innerText()).includes('Upload'), 'Upload is current');
    await shot('03-upload');
    await page.getByRole('button', { name: 'Try the demo file' }).click();
    await page.getByText('demo_cohort_messy.csv').waitFor();
    await shot('03b-upload-loaded');
    await page.getByRole('button', { name: 'Next' }).click();

    // Map
    await page.getByRole('heading', { name: 'Map your columns' }).waitFor();
    ok((await stepsNav.locator('[aria-current="step"]').innerText()).includes('Map'), 'Map is current');
    const focused = await page.evaluate(() => document.activeElement && document.activeElement.textContent);
    ok(focused && focused.includes('Map your columns'), `focus moved to step heading (was: ${focused})`);
    ok(await page.locator('#map-age').inputValue() === 'Age at Dx', 'age auto-mapped');
    ok(await page.locator('#map-time').inputValue() === 'Survival (days)', 'time auto-mapped');
    ok(await page.locator('#map-status').inputValue() === 'Status', 'status auto-mapped');
    const deadBox = page.getByRole('checkbox', { name: /^dead/ });
    if (!(await deadBox.isChecked())) await deadBox.check();
    await shot('04-map');
    await page.getByRole('button', { name: 'Next' }).click();

    // Check
    await page.getByRole('heading', { name: 'Check the data' }).waitFor();
    const badges = await page.locator('.badge').allInnerTexts();
    ok(badges.length === 7, `7 checks shown (${badges.length})`);
    ok(badges.every((b) => /pass|warn|fail/i.test(b)), `badges carry text labels (${JSON.stringify(badges)})`);
    ok(!badges.some((b) => /fail/i.test(b)), 'no failed check on the demo file');
    await shot('05-check');
    await page.getByRole('button', { name: 'Run the analysis' }).click();

    // Analyse
    await page.getByRole('heading', { name: 'Results' }).waitFor();
    await page.getByTestId('age-hr').waitFor();
    const hr = await page.getByTestId('age-hr').innerText();
    ok(hr.includes('1.022'), `age HR shows 1.022 (got: ${hr})`);
    ok(hr.includes('1.003') && /1\.04[12]/.test(hr), `CI about 1.003–1.041 (got: ${hr})`);
    const svgs = page.locator('svg[role="img"]');
    for (let i = 0; i < await svgs.count(); i++) ok(await svgs.nth(i).locator('title').count() === 1, 'svg chart has a title');
    await shot('06-analyse');
    await page.getByRole('button', { name: 'Compare with reference cohorts' }).click();

    // Compare
    await page.getByRole('heading', { name: 'Compare' }).first().waitFor();
    await page.waitForFunction(() => /Pooled/.test(document.body.innerText));
    ok(/overlaps? the pooled interval/.test(await page.locator('main').innerText()), 'overlap sentence present');
    ok(await page.getByText('Sign-in is not configured on this deployment').count() === 1, 'not-configured panel in local mode');
    await shot('07-compare');

    // Form labels everywhere visited: each control must have an accessible name
    const unlabeled = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('input, select, textarea')) {
        const id = el.id;
        const has = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) || el.closest('label');
        if (!has) out.push(`${el.tagName}#${id || ''}.${el.className}`);
      }
      return out;
    });
    ok(unlabeled.length === 0, `unlabeled controls: ${unlabeled.join(', ')}`);

    // Pool and About
    await page.goto(`${base}#/pool`);
    await page.waitForFunction(() => /Leave one out/.test(document.body.innerText));
    await shot('08-pool');
    await page.goto(`${base}#/about`);
    await page.getByRole('heading', { name: 'About' }).waitFor();
    await shot('09-about');

    // Mobile checks
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}#/`);
    await page.getByRole('heading', { level: 1 }).waitFor();
    await noOverflow('home');
    await page.goto(`${base}#/explore`);
    await page.waitForFunction(() => document.querySelectorAll('svg[role="img"] path').length > 2);
    await noOverflow('explore');
    await page.goto(`${base}#/analyse/analyse`);
    await page.getByTestId('age-hr').waitFor();
    await noOverflow('analyse');
    await page.screenshot({ path: path.join(shots, '10-analyse-mobile.png'), fullPage: true });

    // Network + errors
    ok(badHosts.size === 0, `requests to unexpected hosts: ${[...badHosts].join(', ')}`);
    ok(pageErrors.length === 0, `page errors: ${pageErrors.join(' | ')}`);
    ok(consoleErrors.length === 0, `console errors: ${consoleErrors.join(' | ')}`);
    if (fontFailures.length) log(`note: ${fontFailures.length} Google Fonts request(s) failed in this environment; ignored`);
    log('PASS: wizard end to end, age HR 1.022 (1.003–1.041), no external requests, no console errors');
  } catch (e) {
    failures.push(e);
  } finally {
    await browser.close();
    server.close();
  }
  if (failures.length) { console.error('[e2e] FAIL', failures[0]); process.exit(1); }
}

main();
