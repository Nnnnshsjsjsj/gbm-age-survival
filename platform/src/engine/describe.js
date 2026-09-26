// Cohort descriptives for the shareable summary.

import { kaplanMeier } from './km.js';

/** Quantile with linear interpolation (numpy default, type 7). */
export function quantile(sorted, q) {
  const n = sorted.length;
  if (n === 0) return NaN;
  const pos = (n - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/** Age bands used throughout the app (same bands as the 4-group log-rank). */
export const AGE_BANDS = [
  { label: '<50', test: (a) => a < 50 },
  { label: '50–59', test: (a) => a >= 50 && a < 60 },
  { label: '60–69', test: (a) => a >= 60 && a < 70 },
  { label: '≥70', test: (a) => a >= 70 },
];

export function ageBand(age) {
  for (const b of AGE_BANDS) if (b.test(age)) return b.label;
  return null;
}

/**
 * @param {number[]} times
 * @param {number[]} events
 * @param {(number|null)[]} age  age per subject (null allowed; excluded from age statistics)
 */
export function describe(times, events, age) {
  if (!Array.isArray(times) || !Array.isArray(events)) throw new TypeError('times and events must be arrays');
  if (age !== undefined && age !== null && age.length !== times.length) {
    throw new RangeError('age must be aligned with times');
  }
  const km = kaplanMeier(times, events);
  const ages = (age || []).filter((a) => typeof a === 'number' && Number.isFinite(a)).sort((a, b) => a - b);
  const medianAge = ages.length ? quantile(ages, 0.5) : null;
  const ageIQR = ages.length ? [quantile(ages, 0.25), quantile(ages, 0.75)] : [null, null];
  const ageBands = AGE_BANDS.map((b) => ({ label: b.label, n: ages.filter(b.test).length }));
  return {
    n: km.n,
    events: km.events,
    medianAge,
    ageIQR,
    medianOS: km.median,
    s6: km.at(6).s,
    s12: km.at(12).s,
    s24: km.at(24).s,
    ageBands,
  };
}
