import Papa from 'papaparse';

const OPTS = { header: true, skipEmptyLines: true, dynamicTyping: false };

/** Parse CSV/TSV text into { headers, rows, errors }. Delimiter is auto-detected by papaparse. */
export function parseText(text) {
  const out = Papa.parse(text, OPTS);
  const headers = (out.meta.fields || []).filter((h) => h != null && String(h).trim() !== '');
  const rows = out.data.filter((r) => headers.some((h) => r[h] != null && String(r[h]).trim() !== ''));
  return { headers, rows, errors: out.errors || [], delimiter: out.meta.delimiter };
}

export function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      try { resolve(parseText(String(reader.result))); } catch (e) { reject(e); }
    };
    reader.readAsText(file);
  });
}

export const MISSING_RE = /^(|na|n\/a|nan|null|none|unknown|unk|missing|\?|-|—|\.)$/i;
export const isMissing = (v) => v == null || MISSING_RE.test(String(v).trim());
export function toNumber(v) {
  if (isMissing(v)) return null;
  const x = Number(String(v).trim().replace(',', '.'));
  return Number.isFinite(x) ? x : null;
}
