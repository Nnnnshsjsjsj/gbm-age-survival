import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kaplanMeier, describe } from '../src/engine/index.js';
import { loadCohort, loadGolden, survivalData } from './util.js';

const golden = loadGolden();
const COHORTS = ['tcga_gbm', 'cgga', 'msk_impact', 'cptac_gbm'];
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} got ${a}, expected ${b} (tol ${tol})`);

for (const name of COHORTS) {
  test(`Kaplan–Meier matches lifelines on ${name}`, () => {
    const g = golden.cohorts[name];
    const { times, events } = survivalData(loadCohort(name));
    const km = kaplanMeier(times, events);
    assert.equal(km.n, g.n, 'n');
    assert.equal(km.events, g.events, 'events');
    // CSV times are rounded to 3 decimals; lifelines saw unrounded days->months (e.g. 15.540041 vs 15.54)
    close(km.median, g.km.median, 1e-3, 'median');
    close(km.at(6).s, g.km.s6, 1e-3, 's6');
    close(km.at(12).s, g.km.s12, 1e-3, 's12');
    close(km.at(24).s, g.km.s24, 1e-3, 's24');
    close(km.at(12).lo, g.km.ci12[0], 1e-3, 'ci12 lo');
    close(km.at(12).hi, g.km.ci12[1], 1e-3, 'ci12 hi');
    close(km.at(24).lo, g.km.ci24[0], 1e-3, 'ci24 lo');
    close(km.at(24).hi, g.km.ci24[1], 1e-3, 'ci24 hi');
  });
}

test('Kaplan–Meier structure: starts at t=0, s=1, monotone non-increasing, step lookup', () => {
  const times = [1, 2, 2, 3, 4, 5, 5, 6];
  const events = [1, 1, 0, 1, 0, 1, 1, 0];
  const km = kaplanMeier(times, events);
  assert.equal(km.t[0], 0);
  assert.equal(km.s[0], 1);
  assert.deepEqual(km.t, [0, 1, 2, 3, 5]);
  assert.deepEqual(km.atRisk, [8, 8, 7, 5, 3]);
  assert.deepEqual(km.deaths, [0, 1, 1, 1, 2]);
  // hand computation: 7/8 * 6/7 * 4/5 * 1/3
  close(km.s[1], 7 / 8, 1e-12);
  close(km.s[2], 7 / 8 * 6 / 7, 1e-12);
  close(km.s[3], 7 / 8 * 6 / 7 * 4 / 5, 1e-12);
  close(km.s[4], 7 / 8 * 6 / 7 * 4 / 5 * 1 / 3, 1e-12);
  for (let i = 1; i < km.s.length; i++) assert.ok(km.s[i] <= km.s[i - 1]);
  for (let i = 0; i < km.s.length; i++) assert.ok(km.lo[i] <= km.s[i] && km.s[i] <= km.hi[i]);
  assert.equal(km.at(0.5).s, 1);
  assert.equal(km.at(2.5).s, km.s[2]);
  assert.equal(km.at(100).s, km.s[4]);
  assert.equal(km.median, 5);
});

test('Kaplan–Meier median is null when survival never drops to 0.5', () => {
  const km = kaplanMeier([1, 2, 3, 4], [1, 0, 0, 0]);
  assert.equal(km.median, null);
});

test('Kaplan–Meier rejects NaN and invalid events', () => {
  assert.throws(() => kaplanMeier([1, NaN], [1, 0]));
  assert.throws(() => kaplanMeier([1, 2], [1, 2]));
  assert.throws(() => kaplanMeier([1], [1, 0]));
});

test('describe() reports cohort descriptives consistent with KM', () => {
  const rows = loadCohort('tcga_gbm');
  const { times, events, rows: kept } = survivalData(rows);
  const d = describe(times, events, kept.map((r) => r.AGE));
  const g = golden.cohorts.tcga_gbm;
  assert.equal(d.n, g.n);
  assert.equal(d.events, g.events);
  close(d.medianOS, g.km.median, 1e-3);
  close(d.s12, g.km.s12, 1e-3);
  assert.ok(d.ageIQR[0] <= d.medianAge && d.medianAge <= d.ageIQR[1]);
  assert.equal(d.ageBands.length, 4);
  assert.equal(d.ageBands.reduce((a, b) => a + b.n, 0), kept.filter((r) => r.AGE !== null).length);
});
