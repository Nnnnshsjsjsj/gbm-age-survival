// Random-effects meta-analysis of log hazard ratios.
// DerSimonian–Laird tau^2, Wald CI, Hartung–Knapp(–Sidik–Jonkman) CI and a
// Higgins–Thompson–Spiegelhalter prediction interval on t(k-2).

import { normQuantile, tQuantile, chi2Sf } from './dist.js';

/**
 * @param {number[]} logHR  study log hazard ratios
 * @param {number[]} se     their standard errors (> 0)
 * @param {{alpha?: number}} [opts]
 */
export function metaRandomEffects(logHR, se, opts = {}) {
  if (!Array.isArray(logHR) || !Array.isArray(se)) throw new TypeError('logHR and se must be arrays');
  const k = logHR.length;
  if (se.length !== k) throw new RangeError('logHR and se must have the same length');
  if (k < 2) throw new RangeError('meta-analysis needs at least 2 studies');
  for (let i = 0; i < k; i++) {
    if (!Number.isFinite(logHR[i])) throw new RangeError(`logHR[${i}] is not finite`);
    if (!Number.isFinite(se[i]) || se[i] <= 0) throw new RangeError(`se[${i}] must be a positive number`);
  }
  const alpha = opts.alpha ?? 0.05;
  const z = normQuantile(1 - alpha / 2);

  // Fixed effect
  const w = se.map((s) => 1 / (s * s));
  const sumW = w.reduce((a, b) => a + b, 0);
  const sumW2 = w.reduce((a, b) => a + b * b, 0);
  const thetaF = w.reduce((a, wi, i) => a + wi * logHR[i], 0) / sumW;
  const seF = Math.sqrt(1 / sumW);

  // Heterogeneity
  const Q = w.reduce((a, wi, i) => a + wi * (logHR[i] - thetaF) ** 2, 0);
  const Qdf = k - 1;
  const Qp = chi2Sf(Q, Qdf);
  const C = sumW - sumW2 / sumW;
  const tau2 = C > 0 ? Math.max(0, (Q - Qdf) / C) : 0;
  const tau = Math.sqrt(tau2);
  const I2 = Q > 0 ? Math.max(0, (Q - Qdf) / Q) * 100 : 0;
  const H2 = Qdf > 0 ? Q / Qdf : NaN;

  // Random effects
  const wStar = se.map((s) => 1 / (s * s + tau2));
  const sumWStar = wStar.reduce((a, b) => a + b, 0);
  const thetaR = wStar.reduce((a, wi, i) => a + wi * logHR[i], 0) / sumWStar;
  const seR = Math.sqrt(1 / sumWStar);
  const weights = wStar.map((wi) => wi / sumWStar);

  // Hartung–Knapp variance
  const qHK = wStar.reduce((a, wi, i) => a + wi * (logHR[i] - thetaR) ** 2, 0) / (Qdf * sumWStar);
  const seHK = Math.sqrt(qHK);
  const tHK = tQuantile(1 - alpha / 2, Qdf);

  // Prediction interval
  let predLo = null;
  let predHi = null;
  if (k >= 3) {
    const tPI = tQuantile(1 - alpha / 2, k - 2);
    const half = tPI * Math.sqrt(tau2 + seR * seR);
    predLo = Math.exp(thetaR - half);
    predHi = Math.exp(thetaR + half);
  }

  return {
    k,
    logHR: thetaR,
    se: seR,
    HR: Math.exp(thetaR),
    lo: Math.exp(thetaR - z * seR),
    hi: Math.exp(thetaR + z * seR),
    loHK: Math.exp(thetaR - tHK * seHK),
    hiHK: Math.exp(thetaR + tHK * seHK),
    seHK,
    tau2,
    tau,
    I2,
    Q,
    Qdf,
    Qp,
    H2,
    predLo,
    predHi,
    weights,
    fixed: {
      logHR: thetaF,
      se: seF,
      HR: Math.exp(thetaF),
      lo: Math.exp(thetaF - z * seF),
      hi: Math.exp(thetaF + z * seF),
    },
  };
}
