// Live smoke test against the deployed site and the real Supabase project. NOT run in CI or in the sandbox.
// It signs up a throwaway research account, creates a post, checks that it shows as "Waiting for review",
// then deletes the account again (which also deletes the post).
//
//   LIVE_URL=https://nnnnshsjsjsj.github.io/gbm-age-survival/ node e2e/live.spec.mjs
//
// Needs: the "plateau" schema exposed in the Supabase API settings and email confirmation switched off.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
function requirePlaywright() {
  for (const c of [path.resolve(here, '..'), '/home/claude/.npm-global/lib/node_modules/playwright']) {
    try { return createRequire(path.join(c, 'package.json'))('playwright'); } catch { /* next */ }
  }
  throw new Error('playwright not found: npm i -D playwright && npx playwright install chromium');
}
const { chromium } = requirePlaywright();
const BASE = (process.env.LIVE_URL || 'https://nnnnshsjsjsj.github.io/gbm-age-survival/').replace(/\/?$/, '/');
const stamp = Date.now().toString(36);
const email = process.env.LIVE_EMAIL || `plateau-e2e-${stamp}@${process.env.LIVE_EMAIL_DOMAIN || 'example.com'}`;
const password = `live-test-${stamp}-password`;
const handle = `e2e_${stamp}`.slice(0, 24);
const title = `Live test post ${stamp}`;
const ok = (c, m) => { if (!c) throw new Error(`ASSERT: ${m}`); };
const log = (...a) => console.log('[live]', ...a);

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined, headless: process.env.HEADED ? false : true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));
try {
  await page.goto(`${BASE}#/research`);
  const dialog = page.getByRole('dialog');
  await page.locator('.topbar').getByRole('button', { name: 'Join', exact: true }).click();
  await page.getByRole('radio', { name: /^Research space/ }).click();
  await dialog.getByRole('button', { name: 'Continue' }).click();
  await page.locator('#j-email').fill(email);
  await page.locator('#j-pw').fill(password);
  await dialog.getByRole('button', { name: 'Create account' }).click();
  const step3 = page.getByTestId('join-step-3');
  const calm = dialog.getByTestId('calm-banner');
  await Promise.race([step3.waitFor({ timeout: 20000 }), calm.waitFor({ timeout: 20000 })]);
  ok(!(await calm.isVisible()), 'sign-up reached Supabase (if this fails: expose schema "plateau" and disable email confirmation)');
  log('signed up', email);
  await page.locator('#j-handle').fill(handle);
  await dialog.getByText('Available.').waitFor({ timeout: 15000 });
  await dialog.getByRole('button', { name: 'Continue' }).click();
  await dialog.getByRole('checkbox', { name: 'I have read the rules' }).check();
  await dialog.getByRole('checkbox', { name: 'I am 18 or older' }).check();
  await dialog.getByRole('button', { name: 'Join', exact: true }).click();
  await page.getByTestId('join-step-done').waitFor({ timeout: 20000 });
  log('profile created', `@${handle}`);
  await dialog.getByRole('button', { name: 'Go to the research space' }).click();

  await page.getByRole('link', { name: 'Using plateau' }).first().click();
  await page.getByRole('button', { name: 'New post' }).first().click();
  await page.locator('#np-title').fill(title);
  await page.locator('#np-body').fill('Automated live smoke test. A moderator can reject this.');
  await dialog.getByRole('button', { name: 'Send for review' }).click();
  await page.getByText('Your post is waiting for review').waitFor({ timeout: 20000 });
  const card = page.locator('[data-testid="post"]', { hasText: title });
  await card.waitFor({ timeout: 20000 });
  ok(await card.getByText('Waiting for review').count() === 1, 'new post shows as pending');
  log('post created and pending:', title);

  if (!process.env.KEEP_ACCOUNT) {
    await page.goto(`${BASE}#/account`);
    await page.locator('#a-del').fill('delete');
    await page.getByRole('button', { name: 'Delete my account' }).click();
    await page.waitForURL((u) => !u.hash.includes('account'), { timeout: 20000 });
    log('account deleted');
  }
  ok(pageErrors.length === 0, `page errors: ${pageErrors.join(' | ')}`);
  log('PASS');
} catch (e) {
  console.error('[live] FAIL', e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
