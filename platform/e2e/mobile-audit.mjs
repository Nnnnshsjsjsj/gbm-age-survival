// Mobile/tablet audit: touch-emulated devices, full-page screenshots, overflow, small tap targets, tiny text.
// Usage: AUDIT_URL=http://127.0.0.1:4180/ node e2e/mobile-audit.mjs [outDir]
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const req = createRequire(import.meta.url);
let pw; try { pw = req('playwright'); } catch { pw = createRequire('/home/claude/.npm-global/lib/node_modules/playwright/package.json')('playwright'); }
const { chromium } = pw;
const BASE = process.env.AUDIT_URL || 'http://127.0.0.1:4180/';
const OUT = process.argv[2] || '/home/claude/shots/m';
fs.mkdirSync(OUT, { recursive: true });
const DEVICES = {
  phone360: { viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  phone390: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  tab768: { viewport: { width: 768, height: 1024 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  tab1024: { viewport: { width: 1024, height: 768 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};
const ROUTES = (process.env.ROUTES || '/,/brain,/explore,/pool,/hub,/patients,/about,/privacy,/analyse').split(',');
const only = process.env.DEVICES ? process.env.DEVICES.split(',') : Object.keys(DEVICES);

async function audit(page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out = { overflowX: document.documentElement.scrollWidth - vw, small: [], tiny: [], wide: [] };
    const seen = new Set();
    for (const el of document.querySelectorAll('a[href], button, input, select, [role="tab"], summary, [tabindex="0"]')) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (!r.width || !r.height || cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (el.closest('.sr-only, .skip, .marquee-row[aria-hidden]')) continue;
      if (el.type === 'range' || el.type === 'checkbox' || el.type === 'radio') continue;
      if (r.height < 36 || r.width < 36) {
        const k = `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}:${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}`;
        if (!seen.has(k)) { seen.add(k); out.small.push(`${k} ${Math.round(r.width)}x${Math.round(r.height)}`); }
      }
    }
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const tinySeen = new Set();
    while (tw.nextNode()) {
      const n = tw.currentNode; const p = n.parentElement;
      if (!p || !n.textContent.trim() || p.closest('.sr-only, svg, canvas')) continue;
      const fs = parseFloat(getComputedStyle(p).fontSize);
      if (fs < 11.5) { const k = `${p.tagName.toLowerCase()}.${String(p.className).split(' ')[0]} ${fs}px`; if (!tinySeen.has(k)) { tinySeen.add(k); out.tiny.push(k); } }
    }
    for (const el of document.querySelectorAll('main *')) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && r.width > 0 && !el.closest('.tw, .marquee, .path-tabs, [data-scroll-x]')) {
        const k = `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} right=${Math.round(r.right)}`;
        if (out.wide.length < 12 && !out.wide.includes(k)) out.wide.push(k);
      }
    }
    return out;
  });
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const report = {};
for (const dname of only) {
  const ctx = await browser.newContext({ ...DEVICES[dname], reducedMotion: process.env.MOTION ? 'no-preference' : 'reduce' });
  await ctx.addInitScript(() => { try { sessionStorage.setItem('cohortex-intro', '1'); localStorage.setItem('cohortex-country', 'RS'); } catch { /* ok */ } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
  await page.route((u) => !['127.0.0.1', 'localhost'].includes(u.hostname), (r) => r.abort());
  for (const route of ROUTES) {
    await page.goto(`${BASE}#${route}`);
    await page.locator('main#main').waitFor();
    await page.waitForTimeout(route === '/hub' || route === '/patients' ? 2500 : 1500);
    if (route === '/analyse') {
      await page.getByRole('button', { name: 'Try the demo file' }).click(); await page.getByText('demo_cohort_messy.csv').waitFor();
      await page.getByRole('button', { name: 'Next' }).click(); await page.getByRole('heading', { name: 'Map your columns' }).waitFor();
      await page.screenshot({ path: path.join(OUT, `${dname}-analyse-map.png`), fullPage: true });
      const dead = page.getByRole('checkbox', { name: /^dead/ }); if (!(await dead.isChecked())) await dead.check();
      await page.getByRole('button', { name: 'Next' }).click(); await page.getByRole('heading', { name: 'Check the data' }).waitFor();
      await page.getByRole('button', { name: 'Run the analysis' }).click(); await page.getByTestId('age-hr').waitFor({ timeout: 60000 });
      await page.waitForTimeout(800);
      report[`${dname} /analyse results`] = await audit(page);
      await page.screenshot({ path: path.join(OUT, `${dname}-analyse-results.png`), fullPage: true });
      await page.getByRole('button', { name: 'Compare with reference cohorts' }).click();
      await page.waitForFunction(() => /Pooled/.test(document.body.innerText), null, { timeout: 60000 });
      await page.waitForTimeout(600);
    }
    const name = route === '/' ? 'home' : route.slice(1).replace(/\//g, '-');
    report[`${dname} ${route}`] = await audit(page);
    await page.screenshot({ path: path.join(OUT, `${dname}-${name}.png`), fullPage: true });
  }
  report[`${dname} errors`] = errs;
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
for (const [k, v] of Object.entries(report)) {
  if (Array.isArray(v)) { if (v.length) console.log(k, v); continue; }
  console.log(`${k}: overflowX=${v.overflowX} small=${v.small.length} tiny=${v.tiny.length} wide=${v.wide.length}`);
}
