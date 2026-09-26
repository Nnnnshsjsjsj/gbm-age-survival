// Reference cohorts: fetched at runtime from /reference/*.csv and analysed with the engine.
import Papa from 'papaparse';
import { kaplanMeier, logRank, coxPH, describe, AGE_BANDS, ageBand } from '../engine/index.js';

export const MIN_GROUP = 10;

export const COHORTS = [
  { key: 'tcga_gbm', name: 'TCGA-GBM', country: 'USA', years: '1989–2013', source: 'TCGA via cBioPortal gbm_tcga', noteKey: 'cohort_note_tcga' },
  { key: 'cgga', name: 'CGGA', country: 'China', years: '2006–2016', source: 'CGGA mRNAseq_693 + mRNAseq_325', noteKey: 'cohort_note_cgga' },
  { key: 'msk_impact', name: 'MSK-IMPACT', country: 'USA', years: '2014–2018', source: 'cBioPortal glioma_mskcc_2019', noteKey: 'cohort_note_msk' },
  { key: 'cptac_gbm', name: 'CPTAC-GBM', country: 'USA/international', years: '2016–2019', source: 'cBioPortal gbm_cptac_2021', noteKey: 'cohort_note_cptac' },
];

export const baseUrl = () => import.meta.env.BASE_URL.replace(/\/?$/, '/');

const num = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  if (s === '' || /^(na|nan|null|none)$/i.test(s)) return null;
  const x = Number(s);
  return Number.isFinite(x) ? x : null;
};

const cache = new Map();

/** Fetch and parse one reference cohort. Returns aligned arrays of complete (age, time, event) rows. */
export async function loadReference(key) {
  if (cache.has(key)) return cache.get(key);
  const p = (async () => {
    const res = await fetch(`${baseUrl()}reference/${key}.csv`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: false });
    const rows = [];
    for (const r of parsed.data) {
      const age = num(r.AGE), time = num(r.OS_MONTHS), event = num(r.event);
      if (age == null || time == null || event == null || time < 0) continue;
      rows.push({ age, time, event: event >= 1 ? 1 : 0, male: num(r.male), kps: num(r.kps10) == null ? null : num(r.kps10) * 10, mgmt: num(r.mgmt_meth), idh: num(r.idh_mut) });
    }
    return rows;
  })();
  cache.set(key, p);
  p.catch(() => cache.delete(key));
  return p;
}

/** KM by age band with the small-group rule, plus log-rank over the shown groups. */
export function kmByBand(rows) {
  const groups = AGE_BANDS.map((b) => {
    const sub = rows.filter((r) => b.test(r.age));
    const n = sub.length;
    if (n < MIN_GROUP) return { label: b.label, n, suppressed: true };
    const km = kaplanMeier(sub.map((r) => r.time), sub.map((r) => r.event));
    return { label: b.label, n, suppressed: false, km, deaths: km.events, median: km.median, s12: km.at(12).s, s24: km.at(24).s };
  });
  const shown = rows.filter((r) => { const g = groups.find((x) => x.label === ageBand(r.age)); return g && !g.suppressed; });
  let lr = null;
  const labels = new Set(shown.map((r) => ageBand(r.age)));
  if (labels.size >= 2) {
    try { lr = logRank(shown.map((r) => r.time), shown.map((r) => r.event), shown.map((r) => ageBand(r.age))); } catch { lr = null; }
  }
  return { groups, logrank: lr };
}

/** Full stats for a reference cohort (whole-cohort KM, bands, age Cox). */
export function analyseReference(rows) {
  const times = rows.map((r) => r.time), events = rows.map((r) => r.event), ages = rows.map((r) => r.age);
  const kmAll = kaplanMeier(times, events);
  const bands = kmByBand(rows);
  const cox = coxPH(rows.map((r) => [r.age]), times, events, { names: ['age'] });
  const desc = describe(times, events, ages);
  const sortedAges = [...ages].sort((a, b) => a - b);
  return { n: rows.length, deaths: kmAll.events, kmAll, bands, cox, desc, ageRange: [sortedAges[0], sortedAges[sortedAges.length - 1]] };
}

const statsCache = new Map();
export async function referenceStats(key) {
  if (!statsCache.has(key)) statsCache.set(key, loadReference(key).then(analyseReference));
  return statsCache.get(key);
}

export async function allReferenceStats() {
  const out = [];
  for (const c of COHORTS) out.push({ ...c, stats: await referenceStats(c.key) });
  return out;
}

let publishedCache = null;
export async function loadPublished() {
  if (!publishedCache) {
    publishedCache = fetch(`${baseUrl()}reference/published.json`).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); });
    publishedCache.catch(() => { publishedCache = null; });
  }
  return publishedCache;
}
