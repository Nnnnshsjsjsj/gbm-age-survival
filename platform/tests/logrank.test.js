import { test } from 'node:test';
import assert from 'node:assert/strict';
import { logRank, ageBand } from '../src/engine/index.js';
import { loadCohort, loadGolden, design } from './util.js';

const golden = loadGolden();
const COHORTS = ['tcga_gbm', 'cgga', 'msk_impact', 'cptac_gbm'];
const relClose = (a, b, rel, msg) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${msg ?? ''} got ${a}, expected ${b} (rel ${rel})`);

for (const name of COHORTS) {
  test(`two-group log-rank (age < 59 vs >= 59) matches lifelines on ${name}`, () => {
    const g = golden.cohorts[name].logrank_age59;
    const { X, times, events } = design(loadCohort(name), ['AGE']);
    const groups = X.map((r) => (r[0] < 59 ? 'young' : 'old'));
    const lr = logRank(times, events, groups);
    assert.equal(lr.df, 1);
    relClose(lr.chi2, g.chi2, 0.01, 'chi2');
    relClose(lr.p, g.p, 0.05, 'p');
    assert.equal(lr.groups.length, 2);
    assert.equal(lr.groups.reduce((a, b) => a + b.n, 0), times.length);
    const obs = lr.groups.reduce((a, b) => a + b.observed, 0);
    const exp = lr.groups.reduce((a, b) => a + b.expected, 0);
    assert.ok(Math.abs(obs - exp) < 1e-9, 'total observed equals total expected');
  });

  test(`four-band log-rank (<50, 50-59, 60-69, >=70) matches lifelines on ${name}`, () => {
    const g = golden.cohorts[name].logrank_4bands;
    const { X, times, events } = design(loadCohort(name), ['AGE']);
    const groups = X.map((r) => ageBand(r[0]));
    const lr = logRank(times, events, groups);
    assert.equal(lr.df, g.df);
    relClose(lr.chi2, g.chi2, 0.01, 'chi2');
    relClose(lr.p, g.p, 0.05, 'p');
    assert.equal(lr.groups.length, 4);
  });
}

test('log-rank on a textbook example', () => {
  // Two groups, no ties: hand-computable
  const times = [1, 2, 3, 4, 5, 6];
  const events = [1, 1, 1, 1, 1, 1];
  const groups = ['a', 'a', 'a', 'b', 'b', 'b'];
  const lr = logRank(times, events, groups);
  // E_a = 3/6 + 2/5 + 1/4 = 1.15 ; O_a = 3
  const ga = lr.groups.find((x) => x.label === 'a');
  assert.ok(Math.abs(ga.expected - 1.15) < 1e-12);
  assert.equal(ga.observed, 3);
  assert.ok(lr.chi2 > 0 && lr.p < 0.1);
});

test('log-rank with identical groups gives chi2 ~ 0 and p ~ 1', () => {
  const times = [1, 2, 3, 4, 1, 2, 3, 4];
  const events = [1, 1, 1, 0, 1, 1, 1, 0];
  const groups = [0, 0, 0, 0, 1, 1, 1, 1];
  const lr = logRank(times, events, groups);
  assert.ok(lr.chi2 < 1e-12);
  assert.ok(lr.p > 0.999);
});

test('log-rank input validation', () => {
  assert.throws(() => logRank([1, 2], [1, 1], ['a', 'a']), /at least 2 groups/);
  assert.throws(() => logRank([1, 2], [1, 1], ['a']));
  assert.throws(() => logRank([1, NaN], [1, 1], ['a', 'b']));
  assert.throws(() => logRank([1, 2], [1, 1], ['a', null]));
});
