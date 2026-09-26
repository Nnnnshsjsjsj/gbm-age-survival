import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coxPH, kaplanMeier, logRank, schoenfeldTest } from '../src/engine/index.js';

/** mulberry32 seeded PRNG -> uniform (0, 1) */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function simulateCohort(rand, n, beta) {
  const X = [];
  const times = [];
  const events = [];
  const baselineRate = 1 / 15; // median ~10 months at age 50
  for (let i = 0; i < n; i++) {
    const age = 20 + 60 * rand(); // uniform 20-80
    const hazard = baselineRate * Math.exp(beta * (age - 50));
    const u = Math.max(rand(), 1e-12);
    const t = -Math.log(u) / hazard; // exponential event time
    const c = 60 * rand(); // uniform random censoring up to 60 months
    const observed = Math.min(t, c);
    X.push([age]);
    times.push(Math.round(observed * 100) / 100 + 0.01); // 2-decimal months, strictly positive, produces ties
    events.push(t <= c ? 1 : 0);
  }
  return { X, times, events };
}

test('simulation: Cox estimate is unbiased and the 95% CI has nominal coverage (200 cohorts, n=150, beta=0.03)', () => {
  const rand = mulberry32(20240926);
  const TRUE_BETA = 0.03;
  const R = 200;
  let sum = 0;
  let covered = 0;
  let sumSchoenfeldP = 0;
  for (let r = 0; r < R; r++) {
    const { X, times, events } = simulateCohort(rand, 150, TRUE_BETA);
    const m = coxPH(X, times, events, { names: ['age'] });
    assert.ok(m.converged, `cohort ${r} converged`);
    assert.ok(Number.isFinite(m.beta[0]) && Number.isFinite(m.se[0]));
    sum += m.beta[0];
    const lo = m.beta[0] - 1.959963984540054 * m.se[0];
    const hi = m.beta[0] + 1.959963984540054 * m.se[0];
    if (lo <= TRUE_BETA && TRUE_BETA <= hi) covered++;
    assert.ok(m.concordance > 0.5 && m.concordance < 1, `concordance ${m.concordance}`);
    const sch = schoenfeldTest(m, X, times, events);
    assert.ok(sch.p[0] >= 0 && sch.p[0] <= 1);
    sumSchoenfeldP += sch.p[0];
  }
  const mean = sum / R;
  const coverage = covered / R;
  assert.ok(Math.abs(mean - TRUE_BETA) <= 0.004, `mean beta ${mean.toFixed(5)} not within 0.004 of ${TRUE_BETA}`);
  assert.ok(coverage >= 0.9 && coverage <= 0.99, `coverage ${coverage} outside 90-99%`);
  // Under proportional hazards, Schoenfeld p-values are ~uniform: mean ~0.5
  const meanP = sumSchoenfeldP / R;
  assert.ok(meanP > 0.35 && meanP < 0.65, `mean Schoenfeld p ${meanP}`);
});

test('simulation: log-rank rejects at ~5% under the null and KM stays consistent', () => {
  const rand = mulberry32(7);
  const R = 200;
  let rejected = 0;
  for (let r = 0; r < R; r++) {
    const { X, times, events } = simulateCohort(rand, 120, 0); // no age effect
    const groups = X.map((row) => (row[0] < 50 ? 'young' : 'old'));
    const lr = logRank(times, events, groups);
    if (lr.p < 0.05) rejected++;
    const km = kaplanMeier(times, events);
    assert.equal(km.n, 120);
    assert.equal(km.events, events.reduce((a, b) => a + b, 0));
    for (let i = 1; i < km.s.length; i++) assert.ok(km.s[i] <= km.s[i - 1]);
  }
  const rate = rejected / R;
  assert.ok(rate >= 0.01 && rate <= 0.11, `type I error rate ${rate}`);
});

test('simulation: multivariable fit recovers several coefficients', () => {
  const rand = mulberry32(99);
  const n = 400;
  const trueBeta = [0.03, 0.5, -0.4];
  const X = [];
  const times = [];
  const events = [];
  for (let i = 0; i < n; i++) {
    const age = 20 + 60 * rand();
    const male = rand() < 0.6 ? 1 : 0;
    const marker = rand() < 0.3 ? 1 : 0;
    const eta = trueBeta[0] * (age - 50) + trueBeta[1] * male + trueBeta[2] * marker;
    const t = -Math.log(Math.max(rand(), 1e-12)) / ((1 / 15) * Math.exp(eta));
    const c = 60 * rand();
    X.push([age, male, marker]);
    times.push(Math.min(t, c));
    events.push(t <= c ? 1 : 0);
  }
  const m = coxPH(X, times, events, { names: ['age', 'male', 'marker'] });
  for (let j = 0; j < 3; j++) {
    assert.ok(Math.abs(m.beta[j] - trueBeta[j]) < 3 * m.se[j], `beta[${j}] ${m.beta[j]} vs ${trueBeta[j]} (se ${m.se[j]})`);
  }
  assert.ok(m.lrP < 1e-6);
});
