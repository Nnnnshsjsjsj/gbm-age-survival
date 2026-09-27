// Viewport screenshots of key mobile moments with motion and touch on (what a phone visitor sees).
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const req = createRequire(import.meta.url);
let pw; try { pw = req('playwright'); } catch { pw = createRequire('/home/claude/.npm-global/lib/node_modules/playwright/package.json')('playwright'); }
const BASE = process.env.AUDIT_URL || 'http://127.0.0.1:4180/';
const OUT = process.argv[2] || '/home/claude/shots/mv';
fs.mkdirSync(OUT, { recursive: true });
const W = Number(process.env.W || 390), H = Number(process.env.H || 844);
const browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
await ctx.addInitScript(() => { try { sessionStorage.setItem('cohortex-intro', '1'); localStorage.setItem('cohortex-country', 'RS'); } catch { /* ok */ } });
await ctx.route((u) => !['127.0.0.1', 'localhost'].includes(u.hostname), (r) => r.abort());
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
const shot = async (n) => { await page.screenshot({ path: path.join(OUT, `${W}-${n}.png`) }); };
const to = async (sel, extra = 0, wait = 1800) => {
  await page.evaluate(([sel, extra]) => { const el = document.querySelector(sel); const y = el.getBoundingClientRect().top + scrollY - 70 + extra; if (window.lenis) window.lenis.scrollTo(y, { immediate: true }); else scrollTo(0, y); }, [sel, extra]);
  await page.waitForTimeout(wait);
};
const tag = process.env.TAG || '';
await page.goto(`${BASE}#/`); await page.waitForTimeout(4000); await shot(`${tag}home-hero`);
await to('#ch4', 300, 2500); await shot(`${tag}home-cohorts`);
await page.evaluate(() => { const tr = document.querySelector('.hstrip-track'); tr.scrollLeft = 700; }); await page.waitForTimeout(600); await shot(`${tag}home-cohorts-swiped`);
await to('.st-forest', 0, 3000); await shot(`${tag}home-forest`);
await to('#ch3', 350, 2500); await shot(`${tag}home-km`);
await page.goto(`${BASE}#/hub`); await page.locator('.cst-wrap canvas').waitFor({ timeout: 60000 });
await to('.hub-map', -60, 3000); await shot(`${tag}hub-map`);
const box = await page.locator('.cst-wrap canvas').boundingBox();
// tap a few spots until a tooltip appears
for (const [fx, fy] of [[0.5, 0.5], [0.45, 0.4], [0.6, 0.55], [0.4, 0.6], [0.55, 0.35]]) {
  await page.touchscreen.tap(box.x + box.width * fx, box.y + box.height * fy); await page.waitForTimeout(400);
  if (await page.locator('.cst-tip').count()) break;
}
await shot(`${tag}hub-map-tap`);
await to('#paths', 0); await shot(`${tag}hub-paths`);
await to('#library', 0); await shot(`${tag}hub-library`);
await to('#toolbox', 0); await shot(`${tag}hub-toolbox`);
await to('#model-cells', 0, 4000); await shot(`${tag}hub-cells`);
await to('#model-cells', 420, 2500); await shot(`${tag}hub-cells-sliders`);
await to('#model-mri', 0, 4000); await shot(`${tag}hub-mri`);
await to('#model-mri', 450, 2500); await shot(`${tag}hub-mri-controls`);
await page.goto(`${BASE}#/patients`); await page.waitForTimeout(4000); await shot(`${tag}patients-hero`);
await to('#help', 0); await shot(`${tag}patients-help`);
await to('#directory', 0); await shot(`${tag}patients-dir`);
await to('#reading', 0); await shot(`${tag}patients-reading`);
await page.goto(`${BASE}#/pool`); await page.waitForTimeout(2500); await to('.card', 0); await shot(`${tag}pool`);
await page.goto(`${BASE}#/brain`); await page.waitForTimeout(5000); await shot(`${tag}brain`);
await page.goto(`${BASE}#/explore`); await page.waitForTimeout(2500); await shot(`${tag}explore`);
await page.getByRole('button', { name: 'Menu' }).click(); await page.waitForTimeout(700); await shot(`${tag}menu`);
console.log('errors', errs);
await browser.close();
