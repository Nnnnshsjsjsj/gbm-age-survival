# Statistics engine contract (`src/engine/`)

Pure ES modules, no dependencies, no DOM. All functions are deterministic and synchronous. Times are in months; `event` is 1 = died, 0 = censored. Missing values are `null`/`NaN` and must be dropped by the caller (the engine throws on NaN).

```js
import { kaplanMeier, logRank, coxPH, schoenfeldTest, metaRandomEffects, describe } from './engine/index.js';

// Kaplan–Meier with Greenwood variance and log(-log) 95% CI (same as lifelines default).
kaplanMeier(times: number[], events: number[]) -> {
  t: number[], s: number[], lo: number[], hi: number[], atRisk: number[], deaths: number[],   // one entry per distinct event time, plus t=0
  median: number|null,                    // first t where s <= 0.5 (null if never reached)
  at(t: number) -> { s, lo, hi },         // step-function lookup
  n: number, events: number
}

// Log-rank test, k groups (k >= 2). groups: array of labels (string or number) aligned with times.
logRank(times, events, groups) -> { chi2: number, df: number, p: number, groups: {label, n, observed, expected}[] }

// Cox proportional hazards, Efron tie handling, Newton–Raphson with step halving, converged when max|Δβ| < 1e-9.
// X: number[][] (n rows, p columns). names: string[] (length p).
coxPH(X, times, events, { names, maxIter = 100 }) -> {
  names, beta: number[], se: number[], hr: number[], lo: number[], hi: number[], z: number[], p: number[],
  logLik: number, logLikNull: number, lrChi2: number, lrP: number,
  concordance: number,                    // Harrell's C on the linear predictor (lifelines definition: ties count 0.5)
  cov: number[][],                        // inverse observed information
  means: number[],                        // column means (for centring)
  baseline: { t: number[], h0: number[], s0: number[] },   // Breslow baseline cumulative hazard at covariate means
  n, events, iterations
}

// Proportional-hazards check: correlation of scaled Schoenfeld residuals with rank-transformed time,
// per covariate (lifelines proportional_hazard_test, time_transform="rank"). Returns one p-value per covariate.
schoenfeldTest(model, X, times, events) -> { stat: number[], p: number[] }

// DerSimonian–Laird random-effects pooling with Hartung–Knapp CI and a t-based prediction interval.
metaRandomEffects(logHR: number[], se: number[]) -> {
  logHR: number, se: number, HR, lo, hi,   // Wald 95% CI
  loHK, hiHK,                              // Hartung–Knapp 95% CI
  tau2, tau, I2, Q, Qdf, Qp, H2,
  predLo, predHi,                          // 95% prediction interval (t with k-2 df), null when k < 3
  weights: number[],                       // random-effects weights, sum to 1
  fixed: { HR, lo, hi }
}

// Descriptives used in the summary that a user may share.
describe(times, events, age) -> { n, events, medianAge, ageIQR:[q1,q3], medianOS, s6, s12, s24, ageBands: {label, n}[] }
```

Numerical conventions: p-values from the normal or chi-square distribution use an erfc-based implementation accurate to 1e-12; `chi2Sf(x, df)` for integer df via the regularized upper gamma function. Provide `src/engine/dist.js` with `normSf`, `chi2Sf`, `tQuantile(p, df)` (Hill's algorithm or bisection on the regularized incomplete beta).

Golden tests (`tests/golden.json`, produced by lifelines) must pass: `npm test` runs `node --test tests/`. Tolerances: |Δβ| ≤ 1e-3 and |Δse| ≤ 1e-3 (log scale); KM survival probabilities ± 1e-3; log-rank chi² within 1%; concordance ± 2e-3; Schoenfeld p within 15% relative or ± 0.02 absolute; meta-analysis HR/CI ± 1e-4 and I² ± 0.5.
