// The shareable summary (schema gbm-summary/1). Never contains patient rows.
import { round } from './format.js';

export const APP_VERSION = 'gbm-age-survival platform 0.1';
export const BAND_KEYS = { '<50': '<50', '50–59': '50-59', '60–69': '60-69', '≥70': '>=70' };

export function buildSummary(analysis, meta) {
  const { desc, models } = analysis;
  const age_bands = {};
  for (const b of desc.ageBands) age_bands[BAND_KEYS[b.label] || b.label] = b.n < 10 ? null : b.n;
  return {
    schema: 'gbm-summary/1',
    cohort_name: meta.cohort_name || '',
    country: meta.country || null,
    years_from: meta.years_from ? Number(meta.years_from) : null,
    years_to: meta.years_to ? Number(meta.years_to) : null,
    n: desc.n,
    events: desc.events,
    median_age: round(desc.medianAge, 1),
    age_iqr: desc.ageIQR.map((x) => round(x, 1)),
    age_bands,
    median_os: round(desc.medianOS, 2),
    s6: round(desc.s6, 4), s12: round(desc.s12, 4), s24: round(desc.s24, 4),
    models: models.map((m) => ({
      covariates: m.model.names,
      beta: m.model.beta.map((b) => round(b, 5)),
      se: m.model.se.map((s) => round(s, 5)),
      n: m.n, events: m.events,
    })),
    created_with: APP_VERSION,
  };
}

/** Map the summary to a cohort_summaries row. */
export function summaryToRow(summary, owner, ethics) {
  return {
    owner,
    cohort_name: summary.cohort_name,
    country: summary.country,
    years_from: summary.years_from,
    years_to: summary.years_to,
    n: summary.n,
    events: summary.events,
    median_age: summary.median_age,
    age_iqr: summary.age_iqr,
    age_bands: summary.age_bands,
    median_os: summary.median_os,
    s6: summary.s6, s12: summary.s12, s24: summary.s24,
    models: summary.models,
    schema_version: summary.schema,
    ethics_confirmed: !!ethics,
  };
}

/** Age log-HR and se from a stored summary (its age-only model). */
export function ageEstimateFromSummary(row) {
  const models = Array.isArray(row.models) ? row.models : [];
  const m = models.find((x) => x.covariates?.length === 1 && x.covariates[0] === 'age') || models[0];
  if (!m) return null;
  const i = m.covariates.indexOf('age');
  if (i < 0) return null;
  return { logHR: m.beta[i], se: m.se[i] };
}

export function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** JSON with short primitive arrays kept on one line, for the preview. */
export function compactJson(obj) {
  return JSON.stringify(obj, null, 2).replace(/\[\n\s+((?:[^\[\]{}]|\n)*?)\n\s+\]/g, (m, inner) => `[${inner.split(/,\s*\n\s*/).map((x) => x.trim()).join(', ')}]`);
}
