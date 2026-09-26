// Data checks after mapping. Produces the cleaned arrays used by the analysis.
import { isMissing, toNumber } from './csv.js';
import { UNIT_TO_MONTHS } from './mapping.js';

const PII_HEADER = /name|surname|patient|\bid\b|_id|id$|^id|mrn|dob|birth|date|фио|имя|фамил|пациент|дата|рожд/i;
const DATE_RE = /^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})(\b|T| )/;

function looksLikeDates(vals) {
  if (vals.length < 3) return false;
  const hits = vals.filter((v) => DATE_RE.test(v)).length;
  return hits / vals.length > 0.5;
}
function looksLikeFreeText(vals) {
  if (vals.length < 3) return false;
  const long = vals.filter((v) => v.length > 25 && /\s/.test(v)).length;
  return long / vals.length > 0.5;
}
function looksLikeIdentifier(vals, total) {
  if (total < 20) return false;
  const nonNumeric = vals.filter((v) => !/^-?\d+(\.\d+)?$/.test(v));
  if (nonNumeric.length / Math.max(1, vals.length) < 0.8) return false;
  const uniq = new Set(vals).size;
  return uniq / vals.length > 0.95;
}

/**
 * @returns {{ checks: Array<{id, status:'pass'|'warn'|'fail', textKey, params}>, data, canProceed }}
 */
export function runChecks(headers, rows, mapping) {
  const { cols, timeUnit, deadValues, values } = mapping;
  const dead = new Set(deadValues);
  const factor = UNIT_TO_MONTHS[timeUnit] ?? 1;
  const total = rows.length;

  let missingReq = 0, timeBad = 0, ageBad = 0, kpsBad = 0, binaryBad = 0;
  const data = { age: [], time: [], event: [], sex: [], idh: [], mgmt: [], kps: [], year: [] };

  for (const r of rows) {
    const age = toNumber(r[cols.age]);
    const timeRaw = toNumber(r[cols.time]);
    const statusRaw = r[cols.status];
    const statusMissing = isMissing(statusRaw);
    if (age == null || timeRaw == null || statusMissing) { missingReq++; continue; }
    const time = timeRaw * factor;
    if (time <= 0) { timeBad++; continue; }
    if (age < 0 || age > 100) { ageBad++; continue; }
    const s = String(statusRaw).trim();
    const event = dead.has(s) ? 1 : 0;
    if (event !== 0 && event !== 1) { binaryBad++; continue; }

    let kps = cols.kps ? toNumber(r[cols.kps]) : null;
    if (kps != null && (kps <= 0 || kps > 100)) { kpsBad++; kps = null; }

    const cat = (f, levels) => {
      if (!cols[f]) return null;
      const v = isMissing(r[cols[f]]) ? '' : String(r[cols[f]]).trim();
      const m = values[f]?.[v];
      if (m === levels[0]) return 1;
      if (m === levels[1]) return 0;
      return null;
    };
    data.age.push(age); data.time.push(time); data.event.push(event);
    data.sex.push(cat('sex', ['male', 'female']));
    data.idh.push(cat('idh', ['mutant', 'wildtype']));
    data.mgmt.push(cat('mgmt', ['methylated', 'unmethylated']));
    data.kps.push(kps);
    data.year.push(cols.year ? toNumber(r[cols.year]) : null);
  }
  const kept = data.age.length;
  const events = data.event.reduce((a, b) => a + b, 0);

  // Personal-data scan over columns that are not used in the analysis.
  const mapped = new Set(Object.values(cols).filter(Boolean));
  const pii = [];
  for (const h of headers) {
    if (mapped.has(h)) continue;
    const vals = rows.map((r) => r[h]).filter((v) => !isMissing(v)).map((v) => String(v).trim()).slice(0, 200);
    if (PII_HEADER.test(h) || looksLikeDates(vals) || looksLikeFreeText(vals) || looksLikeIdentifier(vals, rows.length)) pii.push(h);
  }

  const checks = [
    { id: 'missing', status: missingReq > 0 ? 'warn' : 'pass', titleKey: 'check_missing', textKey: 'check_missing_d', params: { n: missingReq, total, kept } },
    { id: 'time', status: timeBad > 0 ? 'warn' : 'pass', titleKey: 'check_time', textKey: timeBad > 0 ? 'check_time_d' : 'check_time_ok', params: { n: timeBad } },
    { id: 'age', status: ageBad > 0 ? 'warn' : 'pass', titleKey: 'check_age', textKey: ageBad > 0 ? 'check_age_d' : 'check_age_ok', params: { n: ageBad } },
    { id: 'kps', status: kpsBad > 0 ? 'warn' : 'pass', titleKey: 'check_kps', textKey: !cols.kps ? 'check_kps_none' : kpsBad > 0 ? 'check_kps_d' : 'check_kps_ok', params: { n: kpsBad } },
    { id: 'pii', status: pii.length ? 'warn' : 'pass', titleKey: 'check_pii', textKey: pii.length ? 'check_pii_d' : 'check_pii_ok', params: { cols: pii.join(', ') } },
    { id: 'events', status: events < 10 ? 'fail' : 'pass', titleKey: 'check_events', textKey: events < 10 ? 'check_events_d' : 'check_events_ok', params: { n: events, kept } },
    { id: 'binary', status: binaryBad > 0 ? 'fail' : 'pass', titleKey: 'check_binary', textKey: binaryBad > 0 ? 'check_binary_d' : 'check_binary_ok', params: { n: binaryBad } },
  ];
  const canProceed = checks.every((c) => c.status !== 'fail');
  return { checks, data, canProceed, kept, events, dropped: total - kept };
}
