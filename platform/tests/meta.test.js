import { test } from 'node:test';
import assert from 'node:assert/strict';
import { metaRandomEffects, tQuantile } from '../src/engine/index.js';
import { loadGolden } from './util.js';

const golden = loadGolden();
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} got ${a}, expected ${b} (tol ${tol})`);
const relClose = (a, b, rel, msg) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${msg ?? ''} got ${a}, expected ${b} (rel ${rel})`);

test('DerSimonian–Laird random effects match the golden pooled estimate', () => {
  const { logHR, se, expected } = golden.meta;
  const m = metaRandomEffects(logHR, se);
  assert.equal(m.k, 13);
  close(m.HR, expected.HR, 1e-4, 'HR');
  close(m.lo, expected.lo, 1e-4, 'lo');
  close(m.hi, expected.hi, 1e-4, 'hi');
  close(m.tau, expected.tau, 1e-6, 'tau');
  close(m.I2, expected.I2, 0.5, 'I2');
  relClose(m.Q, expected.Q, 1e-8, 'Q');
  relClose(m.Qp, expected.Q_p, 1e-6, 'Q p');
  close(m.predLo, expected.pred_lo, 1e-4, 'prediction lo');
  close(m.predHi, expected.pred_hi, 1e-4, 'prediction hi');
  assert.equal(m.Qdf, 12);
  close(m.H2, m.Q / 12, 1e-12);
  close(m.weights.reduce((a, b) => a + b, 0), 1, 1e-12, 'weights sum to 1');
  // Hartung–Knapp interval is centred on the same estimate
  close(Math.sqrt(m.loHK * m.hiHK), m.HR, 1e-9, 'HK centred');
  assert.ok(m.loHK < m.HR && m.HR < m.hiHK);
  // Fixed-effect estimate is more precise
  assert.ok(m.fixed.hi - m.fixed.lo < m.hi - m.lo);
});

test('random effects reduce to fixed effect when tau2 = 0', () => {
  const logHR = [0.1, 0.11, 0.09];
  const se = [0.2, 0.2, 0.2];
  const m = metaRandomEffects(logHR, se);
  assert.equal(m.tau2, 0);
  assert.equal(m.I2, 0);
  close(m.HR, m.fixed.HR, 1e-12);
  close(m.lo, m.fixed.lo, 1e-12);
  close(m.hi, m.fixed.hi, 1e-12);
  // prediction interval uses t(k-2) = t(1) and equals the Wald interval scaled by t/z when tau2 = 0
  const t1 = tQuantile(0.975, 1);
  close(Math.log(m.predHi) - m.logHR, t1 * m.se, 1e-12);
});

test('hand-computed two-study example', () => {
  // studies: theta = 0 and 1, se = 1 each -> w = 1, thetaF = 0.5, Q = 0.5, C = 2 - 2/2 = 1, tau2 = max(0, (0.5-1)/1) = 0
  const m = metaRandomEffects([0, 1], [1, 1]);
  close(m.logHR, 0.5, 1e-12);
  close(m.Q, 0.5, 1e-12);
  assert.equal(m.tau2, 0);
  close(m.se, Math.sqrt(0.5), 1e-12);
  assert.equal(m.predLo, null);
  assert.equal(m.predHi, null);
  // tau2 > 0 case: theta = 0 and 2, se = 0.5 -> w = 4, thetaF = 1, Q = 8, C = 8 - 32/8 = 4, tau2 = (8-1)/4 = 1.75
  const m2 = metaRandomEffects([0, 2], [0.5, 0.5]);
  close(m2.tau2, 1.75, 1e-12);
  close(m2.I2, 87.5, 1e-9);
  close(m2.logHR, 1, 1e-12);
});

test('meta-analysis input validation', () => {
  assert.throws(() => metaRandomEffects([0.1], [0.1]));
  assert.throws(() => metaRandomEffects([0.1, 0.2], [0.1]));
  assert.throws(() => metaRandomEffects([0.1, NaN], [0.1, 0.1]));
  assert.throws(() => metaRandomEffects([0.1, 0.2], [0.1, 0]));
});
