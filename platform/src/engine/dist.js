// Probability distributions used by the survival engine.
// Pure functions, no dependencies. Accuracy targets: erfc-based normal tail ~1e-15
// relative (W. J. Cody's rational approximations), regularized incomplete gamma /
// beta to ~1e-14 via series + continued fractions (Lentz).

const SQRT2 = Math.SQRT2;
const INV_SQRT_PI = 0.5641895835477563; // 1/sqrt(pi)

// ---------------------------------------------------------------------------
// erf / erfc  (Cody, "Rational Chebyshev approximations for the error function",
// Math. Comp. 1969; coefficients from SPECFUN CALERF)
// ---------------------------------------------------------------------------
const ERF_A = [3.1611237438705656, 113.864154151050156, 377.485237685302021, 3209.37758913846947, 0.185777706184603153];
const ERF_B = [23.6012909523441209, 244.024637934444173, 1282.61652607737228, 2844.23683343917062];
const ERF_C = [0.564188496988670089, 8.88314979438837594, 66.1191906371416295, 298.635138197400131,
  881.95222124176909, 1712.04761263407058, 2051.07837782607147, 1230.33935479799725, 2.15311535474403846e-8];
const ERF_D = [15.7449261107098347, 117.693950891312499, 537.181101862009858, 1621.38957456669019,
  3290.79923573345963, 4362.61909014324716, 3439.36767414372164, 1230.33935480374942];
const ERF_P = [0.305326634961232344, 0.360344899949804439, 0.125781726111229246, 0.0160837851487422766,
  6.58749161529837803e-4, 0.0163153871373020978];
const ERF_Q = [2.56852019228982242, 1.87295284992346725, 0.527905102951428412, 0.0605183413124413191, 2.33520497626869185e-3];

/** Complementary error function, accurate to ~1e-16 relative over the whole real line. */
export function erfc(x) {
  if (Number.isNaN(x)) return NaN;
  const y = Math.abs(x);
  let result;
  if (y <= 0.46875) {
    const ysq = y > 1.11e-16 ? y * y : 0;
    let xnum = ERF_A[4] * ysq;
    let xden = ysq;
    for (let i = 0; i < 3; i++) {
      xnum = (xnum + ERF_A[i]) * ysq;
      xden = (xden + ERF_B[i]) * ysq;
    }
    const erf = x * (xnum + ERF_A[3]) / (xden + ERF_B[3]);
    return 1 - erf;
  }
  if (y <= 4) {
    let xnum = ERF_C[8] * y;
    let xden = y;
    for (let i = 0; i < 7; i++) {
      xnum = (xnum + ERF_C[i]) * y;
      xden = (xden + ERF_D[i]) * y;
    }
    result = (xnum + ERF_C[7]) / (xden + ERF_D[7]);
  } else {
    if (y >= 27) {
      result = 0;
    } else {
      const ysq = 1 / (y * y);
      let xnum = ERF_P[5] * ysq;
      let xden = ysq;
      for (let i = 0; i < 4; i++) {
        xnum = (xnum + ERF_P[i]) * ysq;
        xden = (xden + ERF_Q[i]) * ysq;
      }
      result = ysq * (xnum + ERF_P[4]) / (xden + ERF_Q[4]);
      result = (INV_SQRT_PI - result) / y;
    }
  }
  if (result !== 0) {
    // exp(-y^2) computed as exp(-ysq^2) * exp(-del) for accuracy
    const ysq = Math.trunc(y * 16) / 16;
    const del = (y - ysq) * (y + ysq);
    result = Math.exp(-ysq * ysq) * Math.exp(-del) * result;
  }
  return x < 0 ? 2 - result : result;
}

/** Error function. */
export function erf(x) {
  if (Math.abs(x) <= 0.46875) return 1 - erfc(x);
  return x < 0 ? erfc(-x) - 1 : 1 - erfc(x);
}

// ---------------------------------------------------------------------------
// Normal distribution
// ---------------------------------------------------------------------------

/** Standard normal survival function P(Z > x). */
export function normSf(x) {
  return 0.5 * erfc(x / SQRT2);
}

/** Standard normal CDF P(Z <= x). */
export function normCdf(x) {
  return 0.5 * erfc(-x / SQRT2);
}

/** Standard normal density. */
export function normPdf(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Standard normal quantile (inverse CDF). Acklam's rational approximation
 * followed by one Halley refinement step using erfc, giving ~1e-15 accuracy.
 */
export function normQuantile(p) {
  if (Number.isNaN(p) || p < 0 || p > 1) return NaN;
  if (p === 0) return -Infinity;
  if (p === 1) return Infinity;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let x;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= pHigh) {
    const q = p - 0.5;
    const r = q * q;
    x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  // Halley refinement
  const e = normCdf(x) - p;
  const u = e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
  x = x - u / (1 + x * u / 2);
  return x;
}

// ---------------------------------------------------------------------------
// Gamma function family
// ---------------------------------------------------------------------------
const LANCZOS_G = 7;
const LANCZOS_COEF = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

/** log Gamma(x) for x > 0 (Lanczos approximation, ~1e-15 relative). */
export function lgamma(x) {
  if (Number.isNaN(x)) return NaN;
  if (x <= 0 && Number.isInteger(x)) return Infinity;
  if (x < 0.5) {
    // reflection
    return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
  }
  x -= 1;
  let a = LANCZOS_COEF[0];
  const t = x + LANCZOS_G + 0.5;
  for (let i = 1; i < LANCZOS_G + 2; i++) a += LANCZOS_COEF[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

const GAMMA_EPS = 1e-15;
const GAMMA_MAXIT = 100000;
const FPMIN = Number.MIN_VALUE / GAMMA_EPS;

function gammaSeries(a, x) {
  // series for P(a, x)
  let ap = a;
  let sum = 1 / a;
  let del = sum;
  for (let n = 0; n < GAMMA_MAXIT; n++) {
    ap += 1;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * GAMMA_EPS) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
}

function gammaContinuedFraction(a, x) {
  // continued fraction for Q(a, x) (modified Lentz)
  let b = x + 1 - a;
  let c = 1 / FPMIN;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < GAMMA_MAXIT; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < GAMMA_EPS) break;
  }
  return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}

/** Regularized lower incomplete gamma P(a, x). */
export function gammaP(a, x) {
  if (Number.isNaN(a) || Number.isNaN(x) || a <= 0 || x < 0) return NaN;
  if (x === 0) return 0;
  if (x === Infinity) return 1;
  if (x < a + 1) return gammaSeries(a, x);
  return 1 - gammaContinuedFraction(a, x);
}

/** Regularized upper incomplete gamma Q(a, x) = 1 - P(a, x). */
export function gammaQ(a, x) {
  if (Number.isNaN(a) || Number.isNaN(x) || a <= 0 || x < 0) return NaN;
  if (x === 0) return 1;
  if (x === Infinity) return 0;
  if (x < a + 1) return 1 - gammaSeries(a, x);
  return gammaContinuedFraction(a, x);
}

/** Chi-square survival function P(X > x) with df degrees of freedom (df > 0, need not be integer). */
export function chi2Sf(x, df) {
  if (Number.isNaN(x) || Number.isNaN(df) || df <= 0) return NaN;
  if (x <= 0) return 1;
  return gammaQ(df / 2, x / 2);
}

/** Chi-square CDF. */
export function chi2Cdf(x, df) {
  if (Number.isNaN(x) || Number.isNaN(df) || df <= 0) return NaN;
  if (x <= 0) return 0;
  return gammaP(df / 2, x / 2);
}

// ---------------------------------------------------------------------------
// Beta function family
// ---------------------------------------------------------------------------

/** log Beta(a, b). */
export function lbeta(a, b) {
  return lgamma(a) + lgamma(b) - lgamma(a + b);
}

function betaContinuedFraction(a, b, x) {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - qab * x / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= GAMMA_MAXIT; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < GAMMA_EPS) break;
  }
  return h;
}

/** Regularized incomplete beta I_x(a, b). */
export function betaInc(x, a, b) {
  if (Number.isNaN(x) || Number.isNaN(a) || Number.isNaN(b) || a <= 0 || b <= 0) return NaN;
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return bt * betaContinuedFraction(a, b, x) / a;
  return 1 - bt * betaContinuedFraction(b, a, 1 - x) / b;
}

// ---------------------------------------------------------------------------
// Student t distribution
// ---------------------------------------------------------------------------

/** Student t CDF P(T <= t) with df degrees of freedom. */
export function tCdf(t, df) {
  if (Number.isNaN(t) || Number.isNaN(df) || df <= 0) return NaN;
  if (t === Infinity) return 1;
  if (t === -Infinity) return 0;
  const x = df / (df + t * t);
  const tail = 0.5 * betaInc(x, df / 2, 0.5);
  return t >= 0 ? 1 - tail : tail;
}

/** Student t survival function P(T > t). */
export function tSf(t, df) {
  return tCdf(-t, df);
}

/** Student t density. */
export function tPdf(t, df) {
  return Math.exp(lgamma((df + 1) / 2) - lgamma(df / 2) - 0.5 * Math.log(df * Math.PI) -
    ((df + 1) / 2) * Math.log(1 + t * t / df));
}

/**
 * Student t quantile: the t such that P(T <= t) = p.
 * Newton iterations on the CDF (via the regularized incomplete beta) starting from the
 * normal quantile, safeguarded by bisection on a bracket. Accurate to ~1e-12.
 */
export function tQuantile(p, df) {
  if (Number.isNaN(p) || Number.isNaN(df) || df <= 0 || p < 0 || p > 1) return NaN;
  if (p === 0) return -Infinity;
  if (p === 1) return Infinity;
  if (p === 0.5) return 0;
  if (p < 0.5) return -tQuantile(1 - p, df);
  if (df === Infinity) return normQuantile(p);

  // Exact closed forms for df = 1, 2
  if (df === 1) return Math.tan(Math.PI * (p - 0.5));
  if (df === 2) {
    const a = 4 * p * (1 - p);
    return (2 * p - 1) * Math.sqrt(2 / a);
  }

  // Bracket: p > 0.5 so the quantile is positive
  let lo = 0;
  let hi = Math.max(1, normQuantile(p));
  while (tCdf(hi, df) < p) {
    lo = hi;
    hi *= 2;
    if (hi > 1e300) return Infinity;
  }
  // Initial guess: Cornish–Fisher expansion from the normal quantile
  const z = normQuantile(p);
  const g1 = (z ** 3 + z) / 4;
  const g2 = (5 * z ** 5 + 16 * z ** 3 + 3 * z) / 96;
  const g3 = (3 * z ** 7 + 19 * z ** 5 + 17 * z ** 3 - 15 * z) / 384;
  let x = z + g1 / df + g2 / (df * df) + g3 / (df * df * df);
  if (!(x > lo && x < hi)) x = 0.5 * (lo + hi);

  for (let iter = 0; iter < 200; iter++) {
    const f = tCdf(x, df) - p;
    if (f > 0) hi = x; else lo = x;
    const fp = tPdf(x, df);
    let xNew = fp > 0 ? x - f / fp : NaN;
    if (!(xNew > lo && xNew < hi)) xNew = 0.5 * (lo + hi);
    if (Math.abs(xNew - x) <= 1e-14 * Math.max(1, Math.abs(x))) {
      x = xNew;
      break;
    }
    x = xNew;
    if (hi - lo <= 1e-14 * Math.max(1, Math.abs(x))) break;
  }
  return x;
}
