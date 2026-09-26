import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  erfc, normSf, normCdf, normQuantile, chi2Sf, chi2Cdf, gammaP, gammaQ, lgamma, betaInc, tCdf, tQuantile,
} from '../src/engine/dist.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} got ${a}, expected ${b} (tol ${tol})`);
const relClose = (a, b, rel, msg) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${msg ?? ''} got ${a}, expected ${b} (rel ${rel})`);

test('erfc matches reference values to 1e-13 relative', () => {
  const ref = [
    [0, 1], [0.5, 0.4795001221869535], [1, 0.15729920705028513], [2, 0.004677734981047266],
    [3, 2.209049699858544e-05], [5, 1.5374597944280349e-12], [-0.3, 1.3286267594591274], [-2, 1.9953222650189528],
  ];
  for (const [x, y] of ref) relClose(erfc(x), y, 1e-13, `erfc(${x})`);
});

test('normal tail probabilities accurate to 1e-12 relative', () => {
  const ref = [
    [0, 0.5], [1, 0.15865525393145707], [1.96, 0.024997895148220435], [1.959963984540054, 0.025],
    [3, 0.0013498980316301035], [5, 2.866515718791939e-07], [10, 7.619853024160527e-24], [-1, 0.8413447460685429],
  ];
  for (const [x, y] of ref) relClose(normSf(x), y, 1e-12, `normSf(${x})`);
  for (const [x, y] of ref) relClose(normCdf(-x), y, 1e-12, `normCdf(${-x})`);
});

test('normQuantile inverts normCdf', () => {
  for (const p of [1e-10, 0.001, 0.025, 0.1, 0.5, 0.9, 0.975, 0.999, 1 - 1e-10]) {
    close(normCdf(normQuantile(p)), p, 1e-14 + 1e-12 * p, `p=${p}`);
  }
  close(normQuantile(0.975), 1.959963984540054, 1e-13);
});

test('chi2Sf matches scipy values', () => {
  const ref = [
    [3.841458820694124, 1, 0.05], [1, 1, 0.31731050786291415], [53.52852737472524, 1, 2.54864915873875e-13],
    [90.51458196802223, 3, 1.698355345551991e-19],
    // closed form for even df: exp(-x/2) * sum_{i<6} (x/2)^i / i!  (golden.json's Q_p used an unrounded Q)
    [55.85032344284071, 12, 1.2734946387843664e-07],
    [12.261269178082275, 3, 0.0065397054703872914], [0.5, 2, 0.7788007830714049], [20, 10, 0.02925268807696107],
  ];
  for (const [x, df, y] of ref) relClose(chi2Sf(x, df), y, 1e-10, `chi2Sf(${x}, ${df})`);
  close(chi2Sf(0, 1), 1, 0);
  close(chi2Cdf(3.841458820694124, 1) + chi2Sf(3.841458820694124, 1), 1, 1e-14);
});

test('incomplete gamma is a complement pair and lgamma is right', () => {
  for (const [a, x] of [[0.5, 0.1], [2, 3], [10, 5], [50, 60], [0.3, 2]]) {
    close(gammaP(a, x) + gammaQ(a, x), 1, 1e-14, `a=${a} x=${x}`);
  }
  relClose(gammaP(1, 2), 1 - Math.exp(-2), 1e-14);
  relClose(lgamma(10), Math.log(362880), 1e-14);
  relClose(lgamma(0.5), 0.5 * Math.log(Math.PI), 1e-14);
});

test('regularized incomplete beta', () => {
  relClose(betaInc(0.3, 2, 5), 0.579825, 1e-12);
  relClose(betaInc(0.5, 0.5, 0.5), 0.5, 1e-12);
  close(betaInc(0, 2, 3), 0, 0);
  close(betaInc(1, 2, 3), 1, 0);
});

test('t distribution quantiles match scipy', () => {
  const ref = [
    [0.975, 1, 12.706204736174698], [0.975, 2, 4.302652729911275], [0.975, 3, 3.182446305284263],
    [0.975, 11, 2.200985160082949], [0.975, 12, 2.178812829667228], [0.9, 5, 1.475884048824481],
    [0.975, 30, 2.0422724563012373], [0.995, 4, 4.604094871415702], [0.975, 1000, 1.962339080514726],
  ];
  for (const [p, df, y] of ref) relClose(tQuantile(p, df), y, 1e-9, `tQuantile(${p}, ${df})`);
  close(tQuantile(0.5, 7), 0, 0);
  relClose(tQuantile(0.025, 12), -2.178812829667228, 1e-9);
  for (const df of [1, 2, 3, 7, 25, 100]) {
    for (const p of [0.6, 0.9, 0.975, 0.999]) close(tCdf(tQuantile(p, df), df), p, 1e-11, `round trip p=${p} df=${df}`);
  }
});

test('invalid inputs produce NaN rather than throwing', () => {
  assert.ok(Number.isNaN(chi2Sf(NaN, 1)));
  assert.ok(Number.isNaN(chi2Sf(1, 0)));
  assert.ok(Number.isNaN(tQuantile(1.5, 3)));
  assert.ok(Number.isNaN(normSf(NaN)));
});
