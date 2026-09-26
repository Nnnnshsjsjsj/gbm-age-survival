// Column mapping: standard fields, fuzzy auto-suggestion, value dictionaries.
import { isMissing } from './csv.js';

export const FIELDS = [
  { key: 'age', labelKey: 'f_age', required: true },
  { key: 'time', labelKey: 'f_time', required: true },
  { key: 'status', labelKey: 'f_status', required: true },
  { key: 'sex', labelKey: 'f_sex', categorical: ['male', 'female'] },
  { key: 'idh', labelKey: 'f_idh', categorical: ['mutant', 'wildtype'] },
  { key: 'mgmt', labelKey: 'f_mgmt', categorical: ['methylated', 'unmethylated'] },
  { key: 'kps', labelKey: 'f_kps' },
  { key: 'eor', labelKey: 'f_eor' },
  { key: 'rt', labelKey: 'f_rt' },
  { key: 'tmz', labelKey: 'f_tmz' },
  { key: 'year', labelKey: 'f_year' },
];

export const UNITS = ['days', 'weeks', 'months', 'years'];
export const UNIT_TO_MONTHS = { days: 1 / 30.4375, weeks: 7 / 30.4375, months: 1, years: 12 };

// Ordered: more specific fields first so "Age (years)" is not eaten by "year".
const PATTERNS = [
  ['age', [/\bage\b/i, /возраст/i, /\balter\b/i, /^age/i]],
  ['status', [/\bstatus\b/i, /\bevent\b/i, /vital/i, /\bdead\b/i, /death/i, /died/i, /censor/i, /статус/i, /исход/i, /^os_?status$/i]],
  ['time', [/os_?months/i, /surviv/i, /\bos\b/i, /follow.?up/i, /\btime\b/i, /duration/i, /\bmonths?\b/i, /\bdays?\b/i, /время/i, /выжива/i, /наблюд/i]],
  ['kps', [/\bkps\b/i, /karnof/i, /карновск/i]],
  ['idh', [/idh/i]],
  ['mgmt', [/mgmt/i]],
  ['sex', [/\bsex\b/i, /gender/i, /\bmale\b/i, /\bпол\b/i]],
  ['eor', [/resect/i, /\beor\b/i, /extent/i, /резекц/i]],
  ['rt', [/radio/i, /\brt\b/i, /\bxrt\b/i, /лучев/i]],
  ['tmz', [/temoz/i, /\btmz\b/i, /chemo/i, /темозол/i, /химио/i]],
  ['year', [/year.*(diag|dx)/i, /(diag|dx).*year/i, /\byear\b/i, /\byr\b/i, /год/i]],
];

const norm = (h) => String(h || '').replace(/[_\-./()[\]]+/g, ' ').trim();
const matches = (re, h) => re.test(h) || re.test(norm(h));

export function detectUnit(header) {
  const h = norm(header);
  if (/\bdays?\b|\(d\)|_d$|дн/i.test(h)) return 'days';
  if (/\bweeks?\b|\bwk|нед/i.test(h)) return 'weeks';
  if (/\byears?\b|\byrs?\b|лет|год/i.test(h)) return 'years';
  return 'months';
}

export const DEAD_RE = /^(dead|deceased|died|death|expired|1|1\.0|true|yes|y|d|умер|умерла|смерть|1:deceased)$/i;
export const detectDead = (v) => DEAD_RE.test(String(v).trim()) || /deceased|dead|died/i.test(String(v));

export function distinctValues(rows, col, limit = 30) {
  const counts = new Map();
  for (const r of rows) {
    const v = r[col];
    const s = isMissing(v) ? '' : String(v).trim();
    counts.set(s, (counts.get(s) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([value, count]) => ({ value, count }));
}

export function guessCategory(field, raw) {
  const v = String(raw).trim();
  if (v === '' || isMissing(v)) return 'missing';
  if (field === 'sex') {
    if (/^(m|male|man|муж|мужской|м|1|1\.0)$/i.test(v)) return 'male';
    if (/^(f|female|woman|жен|женский|ж|0|0\.0|2)$/i.test(v)) return 'female';
  }
  if (field === 'idh') {
    if (/^(wt|wild.?type|wildtype|0|0\.0|no|neg|negative|дикий)/i.test(v)) return 'wildtype';
    if (/^(mut|mutant|mutated|mutation|1|1\.0|yes|pos|positive|мут)/i.test(v)) return 'mutant';
  }
  if (field === 'mgmt') {
    if (/^(un|non|not|u|0|0\.0|no|neg|не)/i.test(v)) return 'unmethylated';
    if (/^(meth|methylated|m|1|1\.0|yes|pos|мет)/i.test(v)) return 'methylated';
  }
  return 'missing';
}

/** Suggest a full mapping for the given headers and sample rows. */
export function autoMap(headers, rows) {
  const used = new Set();
  const cols = {};
  for (const [field, res] of PATTERNS) {
    let best = null;
    for (const re of res) {
      const h = headers.find((x) => !used.has(x) && matches(re, x));
      if (h) { best = h; break; }
    }
    cols[field] = best;
    if (best) used.add(best);
  }
  const mapping = {
    cols,
    timeUnit: cols.time ? detectUnit(cols.time) : 'months',
    deadValues: [],
    values: { sex: {}, idh: {}, mgmt: {} },
  };
  if (cols.status) {
    mapping.deadValues = distinctValues(rows, cols.status).map((d) => d.value).filter((v) => v !== '' && detectDead(v));
  }
  for (const f of ['sex', 'idh', 'mgmt']) {
    if (!cols[f]) continue;
    for (const { value } of distinctValues(rows, cols[f])) mapping.values[f][value] = guessCategory(f, value);
  }
  return mapping;
}

export function mappingReady(m) {
  return !!(m && m.cols.age && m.cols.time && m.cols.status && m.deadValues.length > 0);
}

/** Recompute derived parts (unit, dead values, category maps) when the user changes a column. */
export function refreshField(mapping, field, header, rows) {
  const next = { ...mapping, cols: { ...mapping.cols, [field]: header || null }, values: { ...mapping.values } };
  if (field === 'time') next.timeUnit = header ? detectUnit(header) : 'months';
  if (field === 'status') next.deadValues = header ? distinctValues(rows, header).map((d) => d.value).filter((v) => v !== '' && detectDead(v)) : [];
  if (['sex', 'idh', 'mgmt'].includes(field)) {
    const dict = {};
    if (header) for (const { value } of distinctValues(rows, header)) dict[value] = guessCategory(field, value);
    next.values[field] = dict;
  }
  return next;
}
