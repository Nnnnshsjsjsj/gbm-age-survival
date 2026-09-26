// k-sample log-rank test (Mantel–Cox), matching lifelines' multivariate_logrank_test.

import { chi2Sf } from './dist.js';
import { inverse, zeros, zerosMatrix } from './linalg.js';

/**
 * @param {number[]} times
 * @param {number[]} events   1 = event, 0 = censored
 * @param {(string|number)[]} groups  group label per subject (k >= 2 distinct labels)
 * @returns {{chi2: number, df: number, p: number, groups: {label, n, observed, expected}[]}}
 */
export function logRank(times, events, groups) {
  if (!Array.isArray(times) || !Array.isArray(events) || !Array.isArray(groups)) {
    throw new TypeError('times, events and groups must be arrays');
  }
  const n = times.length;
  if (events.length !== n || groups.length !== n) throw new RangeError('times, events and groups must have the same length');

  const labels = [];
  const labelIndex = new Map();
  const g = new Array(n);
  for (let i = 0; i < n; i++) {
    const t = times[i];
    if (typeof t !== 'number' || Number.isNaN(t)) throw new RangeError(`times[${i}] is not a number`);
    if (events[i] !== 0 && events[i] !== 1) throw new RangeError(`events[${i}] must be 0 or 1`);
    const lab = groups[i];
    if (lab === null || lab === undefined || (typeof lab === 'number' && Number.isNaN(lab))) {
      throw new RangeError(`groups[${i}] is missing`);
    }
    if (!labelIndex.has(lab)) {
      labelIndex.set(lab, labels.length);
      labels.push(lab);
    }
    g[i] = labelIndex.get(lab);
  }
  const k = labels.length;
  if (k < 2) throw new RangeError('logRank needs at least 2 groups');

  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => times[a] - times[b]);

  const nRisk = zeros(k);
  const count = zeros(k);
  for (let i = 0; i < n; i++) {
    nRisk[g[i]]++;
    count[g[i]]++;
  }
  const observed = zeros(k);
  const expected = zeros(k);
  const V = zerosMatrix(k);

  let i = 0;
  while (i < n) {
    const ti = times[order[i]];
    let j = i;
    const d = zeros(k);
    let dTot = 0;
    while (j < n && times[order[j]] === ti) {
      const idx = order[j];
      if (events[idx] === 1) {
        d[g[idx]]++;
        dTot++;
      }
      j++;
    }
    const nTot = n - i;
    if (dTot > 0) {
      for (let a = 0; a < k; a++) {
        observed[a] += d[a];
        expected[a] += nRisk[a] * dTot / nTot;
      }
      if (nTot > 1) {
        const f = dTot * (nTot - dTot) / (nTot - 1) / (nTot * nTot);
        for (let a = 0; a < k; a++) {
          for (let b = 0; b < k; b++) {
            V[a][b] += f * nRisk[a] * ((a === b ? nTot : 0) - nRisk[b]);
          }
        }
      }
    }
    for (let m = i; m < j; m++) nRisk[g[order[m]]]--;
    i = j;
  }

  // Quadratic form on the first k-1 groups
  const m = k - 1;
  const diff = zeros(m);
  const Vm = zerosMatrix(m);
  for (let a = 0; a < m; a++) {
    diff[a] = observed[a] - expected[a];
    for (let b = 0; b < m; b++) Vm[a][b] = V[a][b];
  }
  let chi2;
  if (m === 1) {
    chi2 = Vm[0][0] > 0 ? diff[0] * diff[0] / Vm[0][0] : 0;
  } else {
    const Vinv = inverse(Vm);
    chi2 = 0;
    for (let a = 0; a < m; a++) for (let b = 0; b < m; b++) chi2 += diff[a] * Vinv[a][b] * diff[b];
  }
  const df = m;
  const p = chi2Sf(chi2, df);
  return {
    chi2,
    df,
    p,
    groups: labels.map((label, idx) => ({ label, n: count[idx], observed: observed[idx], expected: expected[idx] })),
  };
}
