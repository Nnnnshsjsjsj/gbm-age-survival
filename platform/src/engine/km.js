// Kaplan–Meier estimator with Greenwood variance and log(-log) ("exponential Greenwood")
// 95% confidence intervals, matching lifelines' KaplanMeierFitter defaults.

import { normQuantile } from './dist.js';

function checkInputs(times, events) {
  if (!Array.isArray(times) || !Array.isArray(events)) throw new TypeError('times and events must be arrays');
  if (times.length !== events.length) throw new RangeError('times and events must have the same length');
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    const e = events[i];
    if (typeof t !== 'number' || Number.isNaN(t) || t === null) throw new RangeError(`times[${i}] is not a finite number`);
    if (t < 0) throw new RangeError(`times[${i}] is negative`);
    if (e !== 0 && e !== 1) throw new RangeError(`events[${i}] must be 0 or 1`);
  }
}

/**
 * Kaplan–Meier product-limit estimate.
 * @param {number[]} times   follow-up times (months)
 * @param {number[]} events  1 = event, 0 = censored
 * @param {{alpha?: number}} [opts]  alpha for the CI (default 0.05)
 */
export function kaplanMeier(times, events, opts = {}) {
  checkInputs(times, events);
  const alpha = opts.alpha ?? 0.05;
  const z = normQuantile(1 - alpha / 2);
  const n = times.length;

  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => times[a] - times[b]);

  const t = [0];
  const s = [1];
  const lo = [1];
  const hi = [1];
  const atRisk = [n];
  const deaths = [0];

  let surv = 1;
  let greenwood = 0; // sum d / (n (n - d))
  let i = 0;
  let totalEvents = 0;
  while (i < n) {
    const ti = times[order[i]];
    let d = 0;
    let j = i;
    while (j < n && times[order[j]] === ti) {
      if (events[order[j]] === 1) d++;
      j++;
    }
    const nRisk = n - i;
    if (d > 0) {
      totalEvents += d;
      surv *= 1 - d / nRisk;
      if (nRisk > d) greenwood += d / (nRisk * (nRisk - d));
      let ciLo;
      let ciHi;
      if (surv <= 0) {
        ciLo = 0;
        ciHi = 0;
      } else if (surv >= 1) {
        ciLo = 1;
        ciHi = 1;
      } else {
        const logS = Math.log(surv);
        const v = Math.log(-logS);
        const half = z * Math.sqrt(greenwood) / Math.abs(logS);
        ciLo = Math.exp(-Math.exp(v + half));
        ciHi = Math.exp(-Math.exp(v - half));
      }
      t.push(ti);
      s.push(surv);
      lo.push(ciLo);
      hi.push(ciHi);
      atRisk.push(nRisk);
      deaths.push(d);
    }
    i = j;
  }

  let median = null;
  for (let k = 0; k < s.length; k++) {
    if (s[k] <= 0.5) {
      median = t[k];
      break;
    }
  }

  const at = (time) => {
    if (typeof time !== 'number' || Number.isNaN(time)) throw new RangeError('time must be a number');
    // last index with t[k] <= time (binary search)
    let a = 0;
    let b = t.length - 1;
    if (time < t[0]) return { s: 1, lo: 1, hi: 1 };
    while (a < b) {
      const mid = (a + b + 1) >> 1;
      if (t[mid] <= time) a = mid; else b = mid - 1;
    }
    return { s: s[a], lo: lo[a], hi: hi[a] };
  };

  return { t, s, lo, hi, atRisk, deaths, median, at, n, events: totalEvents };
}
