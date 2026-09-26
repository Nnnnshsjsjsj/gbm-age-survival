import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { coxPH, schoenfeldTest, concordanceIndex } from '../src/engine/index.js';
import { loadCohort, loadGolden, design, parseCSV, num, REFERENCE_DIR } from './util.js';

const golden = loadGolden();
const COHORTS = ['tcga_gbm', 'cgga', 'msk_impact', 'cptac_gbm'];
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} got ${a}, expected ${b} (tol ${tol})`);
const relClose = (a, b, rel, msg) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${msg ?? ''} got ${a}, expected ${b} (rel ${rel})`);

for (const name of COHORTS) {
  const g = golden.cohorts[name];
  const rows = loadCohort(name);
  for (const key of Object.keys(g).filter((k) => k.startsWith('cox_'))) {
    const gc = g[key];
    test(`Cox PH (${key}: ${gc.covariates.join(', ')}) matches lifelines on ${name}`, () => {
      const { X, times, events } = design(rows, gc.covariates);
      const m = coxPH(X, times, events, { names: gc.covariates });
      assert.equal(m.n, gc.n, 'n after dropping missing');
      assert.equal(m.events, gc.events, 'events');
      assert.ok(m.converged, 'converged');
      assert.ok(m.iterations <= 20, `iterations ${m.iterations}`);
      for (let j = 0; j < gc.covariates.length; j++) {
        const cov = gc.covariates[j];
        close(m.beta[j], gc.beta[j], 1e-3, `beta[${cov}]`);
        close(m.se[j], gc.se[j], 1e-3, `se[${cov}]`);
        // p-values: 5% relative, or absolute 1e-3 for tiny values dominated by rounding of beta/se
        assert.ok(Math.abs(m.p[j] - gc.p[j]) <= Math.max(0.05 * gc.p[j], 1e-12), `p[${cov}] got ${m.p[j]} expected ${gc.p[j]}`);
        close(m.hr[j], Math.exp(m.beta[j]), 1e-12, 'hr = exp(beta)');
        close(m.lo[j], Math.exp(m.beta[j] - 1.959963984540054 * m.se[j]), 1e-9, 'lo');
        close(m.hi[j], Math.exp(m.beta[j] + 1.959963984540054 * m.se[j]), 1e-9, 'hi');
        close(m.z[j], m.beta[j] / m.se[j], 1e-12, 'z');
      }
      relClose(m.logLik, gc.log_likelihood, 1e-3, 'partial log-likelihood');
      close(m.logLik, gc.log_likelihood, 1e-4, 'partial log-likelihood (absolute)');
      close(m.concordance, gc.concordance, 2e-3, 'concordance');
      assert.ok(m.logLik >= m.logLikNull, 'fitted log-lik >= null log-lik');
      close(m.lrChi2, 2 * (m.logLik - m.logLikNull), 1e-9);

      const sch = schoenfeldTest(m, X, times, events);
      assert.equal(sch.p.length, gc.covariates.length);
      for (let j = 0; j < gc.covariates.length; j++) {
        const exp = gc.schoenfeld_p[j];
        const got = sch.p[j];
        assert.ok(Math.abs(got - exp) <= Math.max(0.15 * exp, 0.02), `schoenfeld p[${gc.covariates[j]}] got ${got} expected ${exp}`);
      }
    });
  }
}

test('Cox PH on the messy demo cohort (age, days, alive/dead) matches lifelines', () => {
  const raw = parseCSV(readFileSync(join(REFERENCE_DIR, 'demo_cohort_messy.csv'), 'utf8'));
  const X = [];
  const times = [];
  const events = [];
  for (const r of raw) {
    const age = num(r['Age at Dx']);
    const t = num(r['Survival (days)']);
    const status = String(r.Status).trim().toLowerCase();
    if (age === null || t === null || !(status === 'dead' || status === 'alive')) continue;
    X.push([age]);
    times.push(t);
    events.push(status === 'dead' ? 1 : 0);
  }
  const m = coxPH(X, times, events, { names: ['age'] });
  assert.equal(m.n, golden.demo.n);
  assert.equal(m.events, golden.demo.events);
  close(m.beta[0], golden.demo.beta_age, 1e-3, 'beta');
  close(m.se[0], golden.demo.se_age, 1e-3, 'se');
});

test('Cox PH result structure: covariance, means, baseline hazard', () => {
  const { X, times, events } = design(loadCohort('cgga'), ['AGE', 'male']);
  const m = coxPH(X, times, events, { names: ['AGE', 'male'] });
  assert.deepEqual(m.names, ['AGE', 'male']);
  assert.equal(m.cov.length, 2);
  close(m.cov[0][1], m.cov[1][0], 1e-15, 'cov symmetric');
  close(Math.sqrt(m.cov[0][0]), m.se[0], 1e-15);
  close(m.means[0], X.reduce((a, r) => a + r[0], 0) / X.length, 1e-12, 'mean age');
  const b = m.baseline;
  assert.equal(b.t[0], 0);
  assert.equal(b.h0[0], 0);
  assert.equal(b.s0[0], 1);
  assert.equal(b.t.length, b.h0.length);
  assert.equal(b.t.length, b.s0.length);
  for (let i = 1; i < b.t.length; i++) {
    assert.ok(b.t[i] > b.t[i - 1], 'baseline times increasing');
    assert.ok(b.h0[i] >= b.h0[i - 1], 'cumulative hazard non-decreasing');
    close(b.s0[i], Math.exp(-b.h0[i]), 1e-12);
  }
  const distinctEventTimes = new Set(times.filter((_, i) => events[i] === 1)).size;
  assert.equal(b.t.length - 1, distinctEventTimes);
  // Breslow baseline with a single covariate at its mean: sum d_j / sum_R exp(eta) where eta is centred
  assert.ok(m.lrP >= 0 && m.lrP <= 1);
});

test('Cox PH is invariant to covariate location and scale', () => {
  const { X, times, events } = design(loadCohort('cptac_gbm'), ['AGE']);
  const a = coxPH(X, times, events, { names: ['AGE'] });
  const b = coxPH(X.map((r) => [(r[0] - 60) / 10]), times, events, { names: ['AGE decade'] });
  close(b.beta[0], a.beta[0] * 10, 1e-8);
  close(b.se[0], a.se[0] * 10, 1e-8);
  close(b.logLik, a.logLik, 1e-8);
  close(b.concordance, a.concordance, 1e-12);
});

test('Cox PH handles heavy ties (Efron) sensibly and reproduces a hand-checked small example', () => {
  // Data from Collett-style illustration: times with ties.
  const times = [6, 6, 6, 7, 10, 13, 16, 22, 23, 6, 9, 10, 11, 17, 19, 20, 25, 32, 32, 34, 35, 1, 1, 2, 2, 3, 4, 4, 5, 5, 8, 8, 8, 8, 11, 11, 12, 12, 15, 17, 22, 23];
  const events = [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  const X = times.map((_, i) => [i < 21 ? 1 : 0]); // 6-MP (treated) vs placebo, Gehan data
  const m = coxPH(X, times, events, { names: ['treatment'] });
  // Known Efron result for the Gehan/Freireich data: beta = -1.5721, se = 0.4124
  close(m.beta[0], -1.5721, 5e-4);
  close(m.se[0], 0.4124, 5e-4);
});

test('concordance index: lifelines tie conventions', () => {
  // Perfect ranking
  assert.equal(concordanceIndex([1, 2, 3, 4], [1, 1, 1, 1], [4, 3, 2, 1]), 1);
  // Reverse ranking
  assert.equal(concordanceIndex([1, 2, 3, 4], [1, 1, 1, 1], [1, 2, 3, 4]), 0);
  // All tied predictions -> 0.5
  assert.equal(concordanceIndex([1, 2, 3, 4], [1, 1, 1, 1], [0, 0, 0, 0]), 0.5);
  // Censored subject at the same time as a death is comparable; two deaths at the same time are not
  // deaths at t=1 (risk 3) and t=1 (risk 1): not compared; censored at t=1 with risk 2 compared to both deaths
  // pairs: (d1 risk3 vs c risk2) concordant, (d2 risk1 vs c risk2) discordant => 0.5
  assert.equal(concordanceIndex([1, 1, 1], [1, 1, 0], [3, 1, 2]), 0.5);
});

test('Cox PH input validation', () => {
  assert.throws(() => coxPH([[1], [NaN]], [1, 2], [1, 1]), /finite/);
  assert.throws(() => coxPH([[1], [2]], [1, 2], [0, 0]), /no events/);
  assert.throws(() => coxPH([[1], [1], [1]], [1, 2, 3], [1, 1, 0]), /constant/);
  assert.throws(() => coxPH([[1, 2], [3]], [1, 2], [1, 1]));
  assert.throws(() => coxPH([[1], [2]], [1, 2], [1, 1], { names: ['a', 'b'] }));
});
