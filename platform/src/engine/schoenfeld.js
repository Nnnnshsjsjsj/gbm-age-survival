// Proportional-hazards check based on scaled Schoenfeld residuals, replicating
// lifelines.statistics.proportional_hazard_test(time_transform="rank") exactly.
//
// lifelines semantics (verified against lifelines/statistics.py and coxph_fitter.py):
//   * Schoenfeld residuals use the Efron tie correction: for a death at a tied time,
//     r_i = x_i - mean_l( xbar_l ), where xbar_l = (S1 - l/d D1) / (S0 - l/d D0), l = 0..d-1.
//   * Scaled residuals: r* = d * r . V   (V = variance matrix of beta, d = number of deaths).
//   * Time transform "rank" is `np.cumsum(events)` over rows sorted (stably) by (time, event):
//     i.e. the ordinal rank of each death among deaths, ties broken by input order.
//   * Statistic for covariate k:  T_k = (sum_j (g_j - gbar) r*_jk)^2 / (d * V_kk * sum_j (g_j - gbar)^2),
//     p = chi2Sf(T_k, 1).
// This is the Grambsch–Therneau score test as implemented in R's cox.zph before survival 3.0
// (the approximation lifelines documents), not the newer exact-information version.

import { chi2Sf } from './dist.js';
import { kaplanMeier } from './km.js';
import { zeros, zerosMatrix } from './linalg.js';

/** Average ranks (1-based) with ties sharing their mean rank, as pandas Series.rank(). */
export function averageRanks(values) {
  const n = values.length;
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => values[a] - values[b]);
  const ranks = new Array(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j < n && values[order[j]] === values[order[i]]) j++;
    const avg = (i + 1 + j) / 2; // mean of ranks i+1 .. j
    for (let m = i; m < j; m++) ranks[order[m]] = avg;
    i = j;
  }
  return ranks;
}

/**
 * lifelines' "rank" time transform: cumulative event count after a stable sort by (time, event).
 * Returns one value per subject (only the values at event rows are used by the test).
 */
export function lifelinesRankTransform(times, events) {
  const n = times.length;
  const order = Array.from({ length: n }, (_, i) => i)
    .sort((a, b) => times[a] - times[b] || events[a] - events[b] || a - b);
  const out = new Array(n);
  let c = 0;
  for (const i of order) {
    c += events[i];
    out[i] = c;
  }
  return out;
}

/**
 * Efron-corrected Schoenfeld residuals for event rows.
 * Returns { rows: number[] (indices of event subjects, time-ascending), resid: number[][] }.
 */
export function schoenfeldResiduals(X, times, events, beta) {
  const n = X.length;
  const p = beta.length;
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => times[a] - times[b] || a - b);
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = 0; j < p; j++) s += X[i][j] * beta[j];
    w[i] = Math.exp(s);
  }
  let S0 = 0;
  const S1 = zeros(p);
  const D1 = zeros(p);
  const xbar = zeros(p);
  const rowsOut = [];
  const residOut = [];
  let k = n - 1;
  while (k >= 0) {
    const t = times[order[k]];
    let d = 0;
    let D0 = 0;
    for (let j = 0; j < p; j++) D1[j] = 0;
    const deaths = [];
    let m = k;
    while (m >= 0 && times[order[m]] === t) {
      const i = order[m];
      S0 += w[i];
      for (let j = 0; j < p; j++) S1[j] += X[i][j] * w[i];
      if (events[i] === 1) {
        d++;
        D0 += w[i];
        for (let j = 0; j < p; j++) D1[j] += X[i][j] * w[i];
        deaths.push(i);
      }
      m--;
    }
    if (d > 0) {
      for (let j = 0; j < p; j++) xbar[j] = 0;
      for (let l = 0; l < d; l++) {
        const f = l / d;
        const phi = S0 - f * D0;
        for (let j = 0; j < p; j++) xbar[j] += (S1[j] - f * D1[j]) / (phi * d);
      }
      // deaths were collected in descending sort order; emit ascending
      for (let q = deaths.length - 1; q >= 0; q--) {
        const i = deaths[q];
        rowsOut.push(i);
        residOut.push(X[i].map((x, j) => x - xbar[j]));
      }
    }
    k = m;
  }
  rowsOut.reverse();
  residOut.reverse();
  return { rows: rowsOut, resid: residOut };
}

const TRANSFORMS = {
  rank: (times, events) => lifelinesRankTransform(times, events),
  identity: (times) => times.slice(),
  log: (times) => times.map(Math.log),
  km: (times, events) => {
    const km = kaplanMeier(times, events);
    return times.map((t) => 1 - km.at(t).s);
  },
};

/**
 * Proportional-hazards test (lifelines proportional_hazard_test, time_transform="rank").
 * @param {ReturnType<import('./cox.js').coxPH>} model  fitted coxPH result (uses beta, cov, names)
 * @param {number[][]} X   the design matrix the model was fitted on (same rows/order)
 * @param {number[]} times
 * @param {number[]} events
 * @param {{timeTransform?: 'rank'|'identity'|'log'|'km'}} [opts]
 * @returns {{stat: number[], p: number[], names: string[], df: number}}
 */
export function schoenfeldTest(model, X, times, events, opts = {}) {
  if (!model || !Array.isArray(model.beta) || !Array.isArray(model.cov)) {
    throw new TypeError('schoenfeldTest expects a coxPH result as the first argument');
  }
  const n = times.length;
  if (!Array.isArray(X) || X.length !== n || events.length !== n) {
    throw new RangeError('X, times and events must have the same length');
  }
  const p = model.beta.length;
  if (X[0].length !== p) throw new RangeError('X must have one column per model coefficient');
  const transformName = opts.timeTransform ?? 'rank';
  const transform = TRANSFORMS[transformName];
  if (!transform) throw new RangeError(`unknown time transform "${transformName}"`);

  const { rows, resid } = schoenfeldResiduals(X, times, events, model.beta);
  const d = rows.length;
  const names = model.names ?? Array.from({ length: p }, (_, j) => `x${j + 1}`);
  if (d < 3) {
    return { stat: zeros(p).map(() => NaN), p: zeros(p).map(() => NaN), names, df: 1 };
  }
  const V = model.cov;

  // scaled residuals: d * r . V
  const scaled = zerosMatrix(d, p);
  for (let a = 0; a < d; a++) {
    for (let k = 0; k < p; k++) {
      let s = 0;
      for (let j = 0; j < p; j++) s += resid[a][j] * V[j][k];
      scaled[a][k] = d * s;
    }
  }

  const gAll = transform(times, events);
  const g = rows.map((i) => gAll[i]);
  let mean = 0;
  for (const v of g) mean += v;
  mean /= d;
  let ss = 0;
  for (const v of g) ss += (v - mean) * (v - mean);

  const stat = new Array(p);
  const pv = new Array(p);
  for (let k = 0; k < p; k++) {
    let num = 0;
    for (let a = 0; a < d; a++) num += (g[a] - mean) * scaled[a][k];
    const T = ss > 0 ? (num * num) / (d * V[k][k] * ss) : NaN;
    stat[k] = T;
    pv[k] = chi2Sf(T, 1);
  }
  return { stat, p: pv, names, df: 1 };
}
