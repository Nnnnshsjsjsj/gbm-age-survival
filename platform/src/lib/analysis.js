// Runs the user's analysis: descriptives, KM, log-rank, Cox models (worker for large cohorts), Schoenfeld.
import { kaplanMeier, describe } from '../engine/index.js';
import { kmByBand } from './reference.js';
import { fitJobs } from './cox-jobs.js';

export const WORKER_THRESHOLD = 2000;

let worker = null, seq = 0;
const pending = new Map();
function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('../workers/stats.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const { id, results, error } = e.data;
      const p = pending.get(id);
      if (!p) return;
      pending.delete(id);
      error ? p.reject(new Error(error)) : p.resolve(results);
    };
    worker.onerror = (e) => { for (const p of pending.values()) p.reject(new Error(e.message || 'worker error')); pending.clear(); };
  }
  return worker;
}
function fitInWorker(jobs) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, jobs });
  });
}

/** Model definitions mirroring the paper's nested set. */
export const MODEL_SET = [
  { key: 'age', labelKey: 'model_age', covs: ['age'] },
  { key: 'sex', labelKey: 'model_sex', covs: ['age', 'sex'] },
  { key: 'kps', labelKey: 'model_kps', covs: ['age', 'kps'] },
  { key: 'mgmt', labelKey: 'model_mgmt', covs: ['age', 'mgmt'] },
  { key: 'idh', labelKey: 'model_idh', covs: ['age', 'idh'] },
  { key: 'all', labelKey: 'model_all', covs: null },
];

function buildJob(def, data, available) {
  const covs = def.covs || ['age', ...available];
  if (def.covs && def.covs.some((c) => c !== 'age' && !available.includes(c))) return null;
  if (!def.covs && available.length < 2) return null; // "all" only adds something beyond the pairwise models with 2+ extras
  const X = [], times = [], events = [];
  for (let i = 0; i < data.age.length; i++) {
    const row = covs.map((c) => data[c][i]);
    if (row.some((v) => v == null || !Number.isFinite(v))) continue;
    X.push(row); times.push(data.time[i]); events.push(data.event[i]);
  }
  if (events.reduce((a, b) => a + b, 0) < 10) return null;
  // drop if any covariate is constant
  for (let j = 0; j < covs.length; j++) { const s = new Set(X.map((r) => r[j])); if (s.size < 2) return null; }
  return { key: def.key, X, times, events, names: covs, schoenfeld: def.key === 'age' };
}

export async function runAnalysis(data) {
  const n = data.age.length;
  const desc = describe(data.time, data.event, data.age);
  const kmAll = kaplanMeier(data.time, data.event);
  const rows = data.age.map((age, i) => ({ age, time: data.time[i], event: data.event[i] }));
  const bands = kmByBand(rows);
  const available = ['sex', 'kps', 'mgmt', 'idh'].filter((c) => data[c].some((v) => v != null));
  const jobs = MODEL_SET.map((d) => buildJob(d, data, available)).filter(Boolean);
  const useWorker = n > WORKER_THRESHOLD && typeof Worker !== 'undefined';
  const results = useWorker ? await fitInWorker(jobs) : fitJobs(jobs);
  const models = results.filter((r) => !r.error).map((r) => ({ ...r, def: MODEL_SET.find((d) => d.key === r.key) }));
  const ageModel = models.find((m) => m.key === 'age');
  if (!ageModel) throw new Error(results.find((r) => r.error)?.error || 'age model failed');
  // median OS CI from KM: first t where lo/hi crosses 0.5
  const cross = (arr) => { for (let i = 0; i < kmAll.t.length; i++) if (arr[i] <= 0.5) return kmAll.t[i]; return null; };
  const medianCI = [cross(kmAll.lo), cross(kmAll.hi)];
  return { n, events: kmAll.events, desc, kmAll, medianCI, bands, models, ageModel, schoenfeldP: ageModel.schoenfeld?.p?.[0] ?? null, usedWorker: useWorker, available };
}
