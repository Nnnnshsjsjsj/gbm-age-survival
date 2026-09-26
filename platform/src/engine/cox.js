// Cox proportional-hazards regression with Efron tie handling.
// Newton–Raphson with step halving on standardized covariates, results reported on the
// original scale. Matches lifelines' CoxPHFitter (partial log-likelihood without constants,
// Harrell's C with lifelines' tie/censoring conventions, Breslow baseline at covariate means).

import { normSf, chi2Sf, normQuantile } from './dist.js';
import { choleskySolve, inverse, solve, zeros, zerosMatrix } from './linalg.js';

function validate(X, times, events, names) {
  if (!Array.isArray(X) || !Array.isArray(times) || !Array.isArray(events)) {
    throw new TypeError('X, times and events must be arrays');
  }
  const n = times.length;
  if (X.length !== n || events.length !== n) throw new RangeError('X, times and events must have the same length');
  if (n === 0) throw new RangeError('empty data');
  const p = Array.isArray(X[0]) ? X[0].length : -1;
  if (p < 1) throw new RangeError('X must be an array of rows with at least one column');
  if (names && names.length !== p) throw new RangeError('names must have one entry per column of X');
  let nEvents = 0;
  for (let i = 0; i < n; i++) {
    const row = X[i];
    if (!Array.isArray(row) || row.length !== p) throw new RangeError(`X[${i}] must have ${p} columns`);
    for (let j = 0; j < p; j++) {
      const v = row[j];
      if (typeof v !== 'number' || !Number.isFinite(v)) throw new RangeError(`X[${i}][${j}] is not a finite number (missing values must be dropped)`);
    }
    const t = times[i];
    if (typeof t !== 'number' || !Number.isFinite(t)) throw new RangeError(`times[${i}] is not a finite number`);
    if (t < 0) throw new RangeError(`times[${i}] is negative`);
    if (events[i] !== 0 && events[i] !== 1) throw new RangeError(`events[${i}] must be 0 or 1`);
    nEvents += events[i];
  }
  if (nEvents === 0) throw new RangeError('no events observed; the Cox model is undefined');
  return { n, p, nEvents };
}

/**
 * Efron partial log-likelihood, gradient and observed information at beta.
 * Z: standardized covariates (n x p). order: indices sorted by time ascending.
 */
export function efronLogLik(Z, times, events, order, beta) {
  const n = Z.length;
  const p = beta.length;
  const eta = new Float64Array(n);
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const row = Z[i];
    let s = 0;
    for (let j = 0; j < p; j++) s += row[j] * beta[j];
    eta[i] = s;
    w[i] = Math.exp(s);
  }

  let ll = 0;
  const grad = zeros(p);
  const info = zerosMatrix(p);
  let S0 = 0;
  const S1 = zeros(p);
  const S2 = zerosMatrix(p);
  const D1 = zeros(p);
  const D2 = zerosMatrix(p);
  const a = zeros(p);

  let k = n - 1;
  while (k >= 0) {
    const t = times[order[k]];
    let d = 0;
    let D0 = 0;
    for (let j = 0; j < p; j++) {
      D1[j] = 0;
      for (let l = 0; l < p; l++) D2[j][l] = 0;
    }
    let m = k;
    while (m >= 0 && times[order[m]] === t) {
      const i = order[m];
      const wi = w[i];
      const zi = Z[i];
      S0 += wi;
      for (let j = 0; j < p; j++) {
        const zj = zi[j] * wi;
        S1[j] += zj;
        const row = S2[j];
        for (let l = 0; l < p; l++) row[l] += zj * zi[l];
      }
      if (events[i] === 1) {
        d++;
        D0 += wi;
        ll += eta[i];
        for (let j = 0; j < p; j++) {
          grad[j] += zi[j];
          const zj = zi[j] * wi;
          D1[j] += zj;
          const row = D2[j];
          for (let l = 0; l < p; l++) row[l] += zj * zi[l];
        }
      }
      m--;
    }
    if (d > 0) {
      for (let l = 0; l < d; l++) {
        const f = l / d;
        const phi = S0 - f * D0;
        ll -= Math.log(phi);
        for (let j = 0; j < p; j++) a[j] = (S1[j] - f * D1[j]) / phi;
        for (let j = 0; j < p; j++) {
          grad[j] -= a[j];
          const irow = info[j];
          const s2row = S2[j];
          const d2row = D2[j];
          for (let q = 0; q < p; q++) irow[q] += (s2row[q] - f * d2row[q]) / phi - a[j] * a[q];
        }
      }
    }
    k = m;
  }
  return { ll, grad, info };
}

/**
 * Harrell's concordance index with lifelines' conventions:
 * admissible pairs are (i, j) where i has an event and either T_j > T_i, or T_j == T_i and j is censored.
 * A pair is concordant when risk_i > risk_j; tied risks count 1/2.
 */
export function concordanceIndex(times, events, risk) {
  const n = times.length;
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => times[a] - times[b]);
  let pairs = 0;
  let correct = 0;
  let tied = 0;
  for (let a = 0; a < n; a++) {
    const i = order[a];
    if (events[i] !== 1) continue;
    const ti = times[i];
    const ri = risk[i];
    for (let b = a + 1; b < n; b++) {
      const j = order[b];
      if (times[j] === ti && events[j] === 1) continue;
      pairs++;
      const rj = risk[j];
      if (ri > rj) correct++;
      else if (ri === rj) tied++;
    }
    // subjects earlier in the sort with the same time but censored are also admissible
    for (let b = a - 1; b >= 0 && times[order[b]] === ti; b--) {
      const j = order[b];
      if (events[j] === 1) continue;
      pairs++;
      const rj = risk[j];
      if (ri > rj) correct++;
      else if (ri === rj) tied++;
    }
  }
  if (pairs === 0) return NaN;
  return (correct + tied / 2) / pairs;
}

/**
 * Cox proportional hazards model.
 * @param {number[][]} X       n rows, p columns (no missing values)
 * @param {number[]} times
 * @param {number[]} events    1 = event, 0 = censored
 * @param {{names?: string[], maxIter?: number, tol?: number, alpha?: number}} [opts]
 */
export function coxPH(X, times, events, opts = {}) {
  const { names: namesIn, maxIter = 100, tol = 1e-9, alpha = 0.05 } = opts;
  const { n, p, nEvents } = validate(X, times, events, namesIn);
  const names = namesIn ? namesIn.slice() : Array.from({ length: p }, (_, j) => `x${j + 1}`);

  // Standardize columns for numerical conditioning
  const means = zeros(p);
  const sds = zeros(p);
  for (let j = 0; j < p; j++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += X[i][j];
    means[j] = s / n;
  }
  for (let j = 0; j < p; j++) {
    let s = 0;
    for (let i = 0; i < n; i++) {
      const dlt = X[i][j] - means[j];
      s += dlt * dlt;
    }
    const sd = Math.sqrt(s / Math.max(1, n - 1));
    if (!(sd > 0)) throw new RangeError(`covariate "${names[j]}" is constant; the model is not identifiable`);
    sds[j] = sd;
  }
  const Z = new Array(n);
  for (let i = 0; i < n; i++) {
    const row = new Array(p);
    for (let j = 0; j < p; j++) row[j] = (X[i][j] - means[j]) / sds[j];
    Z[i] = row;
  }
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => times[a] - times[b]);

  // Newton–Raphson with step halving
  let beta = zeros(p);
  let cur = efronLogLik(Z, times, events, order, beta);
  const logLikNull = cur.ll;
  let iterations = 0;
  let converged = false;
  for (let it = 1; it <= maxIter; it++) {
    iterations = it;
    let delta = choleskySolve(cur.info, cur.grad);
    if (!delta) delta = solve(cur.info, cur.grad);
    let step = 1;
    let next = null;
    let candidate = null;
    for (let h = 0; h < 50; h++) {
      candidate = beta.map((b, j) => b + step * delta[j]);
      next = efronLogLik(Z, times, events, order, candidate);
      if (Number.isFinite(next.ll) && next.ll >= cur.ll - 1e-12 * Math.abs(cur.ll)) break;
      step /= 2;
      next = null;
    }
    if (!next) {
      // could not improve: treat as converged at the current point
      converged = true;
      break;
    }
    let maxChange = 0;
    for (let j = 0; j < p; j++) {
      const change = Math.abs(step * delta[j] / sds[j]);
      if (change > maxChange) maxChange = change;
    }
    beta = candidate;
    cur = next;
    if (maxChange < tol) {
      converged = true;
      break;
    }
  }

  const covZ = inverse(cur.info);
  const betaOut = beta.map((b, j) => b / sds[j]);
  const cov = zerosMatrix(p);
  for (let j = 0; j < p; j++) for (let l = 0; l < p; l++) cov[j][l] = covZ[j][l] / (sds[j] * sds[l]);
  const se = betaOut.map((_, j) => Math.sqrt(Math.max(0, cov[j][j])));
  const z = normQuantile(1 - alpha / 2);
  const zStat = betaOut.map((b, j) => (se[j] > 0 ? b / se[j] : NaN));
  const pValues = zStat.map((v) => 2 * normSf(Math.abs(v)));
  const hr = betaOut.map(Math.exp);
  const lo = betaOut.map((b, j) => Math.exp(b - z * se[j]));
  const hi = betaOut.map((b, j) => Math.exp(b + z * se[j]));

  const logLik = cur.ll;
  const lrChi2 = 2 * (logLik - logLikNull);
  const lrP = chi2Sf(lrChi2, p);

  // Linear predictor at centred covariates
  const eta = new Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = 0; j < p; j++) s += betaOut[j] * (X[i][j] - means[j]);
    eta[i] = s;
  }
  const concordance = concordanceIndex(times, events, eta);

  // Breslow baseline cumulative hazard at covariate means
  const bt = [0];
  const bh0 = [0];
  const bs0 = [1];
  {
    let riskSum = 0;
    let H = 0;
    let k = n - 1;
    const pending = [];
    while (k >= 0) {
      const t = times[order[k]];
      let d = 0;
      let m = k;
      while (m >= 0 && times[order[m]] === t) {
        const i = order[m];
        riskSum += Math.exp(eta[i]);
        if (events[i] === 1) d++;
        m--;
      }
      if (d > 0) pending.push([t, d / riskSum]);
      k = m;
    }
    for (let q = pending.length - 1; q >= 0; q--) {
      H += pending[q][1];
      bt.push(pending[q][0]);
      bh0.push(H);
      bs0.push(Math.exp(-H));
    }
  }

  return {
    names,
    beta: betaOut,
    se,
    hr,
    lo,
    hi,
    z: zStat,
    p: pValues,
    logLik,
    logLikNull,
    lrChi2,
    lrP,
    concordance,
    cov,
    means,
    baseline: { t: bt, h0: bh0, s0: bs0 },
    n,
    events: nEvents,
    iterations,
    converged,
  };
}
