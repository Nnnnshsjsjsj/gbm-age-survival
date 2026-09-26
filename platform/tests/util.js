// Test helpers: tiny CSV reader and cohort loading (no dependencies).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(here, '..');
export const REFERENCE_DIR = join(ROOT, 'public', 'reference');

/** Parse a simple CSV (no quoted fields needed for our reference files, but quotes are handled). */
export function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter((l) => l.trim().length > 0);
  const splitLine = (line) => {
    const out = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false;
        } else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ',') { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const header = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const row = {};
    header.forEach((h, i) => { row[h] = cells[i] ?? ''; });
    return row;
  });
}

/** Parse a numeric cell; blank / NA / null -> null. */
export function num(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === '' || /^(na|nan|null|none)$/i.test(s)) return null;
  const x = Number(s);
  return Number.isFinite(x) ? x : null;
}

export function loadGolden() {
  return JSON.parse(readFileSync(join(ROOT, 'tests', 'golden.json'), 'utf8'));
}

/** Load a reference cohort as an array of row objects with numeric fields (null = missing). */
export function loadCohort(name) {
  const rows = parseCSV(readFileSync(join(REFERENCE_DIR, `${name}.csv`), 'utf8'));
  return rows.map((r) => ({
    pid: r.pid,
    AGE: num(r.AGE),
    OS_MONTHS: num(r.OS_MONTHS),
    event: num(r.event),
    male: num(r.male),
    kps10: num(r.kps10),
    mgmt_meth: num(r.mgmt_meth),
    idh_mut: num(r.idh_mut),
  }));
}

/**
 * Build a design matrix for the given covariates, dropping rows with any missing value in
 * AGE/OS_MONTHS/event or the requested covariates (as lifelines' dropna did).
 */
export function design(rows, covariates) {
  const X = [];
  const times = [];
  const events = [];
  const kept = [];
  for (const r of rows) {
    if (r.OS_MONTHS === null || r.event === null) continue;
    const x = covariates.map((c) => r[c]);
    if (x.some((v) => v === null)) continue;
    X.push(x);
    times.push(r.OS_MONTHS);
    events.push(r.event);
    kept.push(r);
  }
  return { X, times, events, rows: kept };
}

/** Complete-case survival data (time + event present). */
export function survivalData(rows) {
  const kept = rows.filter((r) => r.OS_MONTHS !== null && r.event !== null);
  return { times: kept.map((r) => r.OS_MONTHS), events: kept.map((r) => r.event), rows: kept };
}

export function approxEqual(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

export function relClose(a, b, rel) {
  return Math.abs(a - b) <= rel * Math.abs(b);
}
