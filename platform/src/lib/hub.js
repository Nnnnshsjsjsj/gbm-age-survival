// Catalogues for the two guides (public/hub/*.json), loaded once and cached. Search is local and bilingual.
import { useEffect, useState } from 'react';
import { baseUrl } from './reference.js';

const cache = {};
export function loadHub(name) {
  if (!cache[name]) {
    cache[name] = fetch(`${baseUrl()}hub/${name}.json`).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
    cache[name].catch(() => { delete cache[name]; });
  }
  return cache[name];
}

export function useHub(name) {
  const [state, setState] = useState({ data: null, error: null });
  useEffect(() => {
    let alive = true;
    loadHub(name).then((data) => alive && setState({ data, error: null })).catch((error) => alive && setState({ data: null, error }));
    return () => { alive = false; };
  }, [name]);
  return state;
}

/** Lower case, no accents, ё → е, punctuation to spaces. */
export function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

// A few synonyms so a newcomer's words find the specialist ones.
const SYN = {
  survival: ['kaplan', 'cox', 'hazard', 'survival', 'выживаем'],
  выживаемость: ['kaplan', 'cox', 'survival', 'выживаем'],
  mri: ['imaging', 'mri', 'radiolog', 'brats', 'rano', 'segment'],
  мрт: ['imaging', 'mri', 'мрт', 'визуализ', 'brats'],
  scrna: ['single cell', 'single-cell', 'scrna', 'seurat', 'scanpy', 'одноклеточ'],
  'single cell': ['single cell', 'scrna', 'seurat', 'scanpy'],
  'meta analysis': ['meta analysis', 'metafor', 'dersimonian', 'heterogeneity', 'метаанализ'],
  метаанализ: ['meta analysis', 'metafor', 'метаанализ'],
  who: ['who', 'classification', 'cns5', 'классификац'],
  trials: ['trial', 'clinicaltrials', 'исследован'],
  immunotherapy: ['immun', 'car t', 'nivolumab', 'checkpoint', 'vaccine', 'иммун'],
  radiotherapy: ['radiotherapy', 'radiation', 'лучев'],
  chemotherapy: ['temozolomide', 'lomustine', 'chemo', 'химио', 'темозоломид'],
};

/**
 * Score items against a query. `fields` returns [[text, weight], …] for an item. All query words must match
 * somewhere (a synonym counts). Returns items sorted by score, best first.
 */
export function search(items, query, fields) {
  const q = norm(query);
  if (!q) return items;
  const words = q.split(' ').filter(Boolean);
  const groups = words.map((w) => [w, ...(SYN[w] || [])].map(norm));
  const multi = SYN[q] ? [SYN[q].map(norm)] : null;
  const out = [];
  for (const it of items) {
    const fs = fields(it).map(([txt, wgt]) => [norm(txt), wgt]);
    let score = 0; let ok = true;
    for (const g of (multi || groups)) {
      let best = 0;
      for (const [txt, wgt] of fs) {
        for (const w of g) {
          if (!w || !txt.includes(w)) continue;
          const whole = new RegExp(`(^| )${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(txt);
          best = Math.max(best, wgt * (whole ? 1.5 : 1));
        }
      }
      if (!best) { ok = false; break; }
      score += best;
    }
    if (ok) out.push([score, it]);
  }
  return out.sort((a, b) => b[0] - a[0]).map(([, it]) => it);
}

export const paperFields = (p) => [
  [p.title, 4], [p.authors, 2], [p.journal, 1], [String(p.year), 1], [(p.topics || []).join(' '), 2],
  [p.summary_en, 1], [p.summary_ru, 1], [p.id, 2],
];
export const toolFields = (x) => [
  [x.name, 4], [(x.tags || []).join(' '), 2], [(x.modality || []).join(' '), 2], [x.cat, 1], [x.desc_en, 1], [x.desc_ru, 1], [x.id, 2],
];
export const faqFields = (f) => [[f.q_en, 3], [f.q_ru, 3], [f.a_en, 1], [f.a_ru, 1]];

export const doiUrl = (doi) => `https://doi.org/${doi}`;
export const pubmedUrl = (pmid) => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
export const pmcUrl = (pmcid) => `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/`;

/** Vancouver-style reference, good enough to paste into a draft. */
export function citation(p) {
  return `${p.authors} ${p.title.replace(/\.$/, '')}. ${p.journal}. ${p.year}.${p.doi ? ` doi:${p.doi}` : ''}${p.pmid ? ` PMID: ${p.pmid}` : ''}`;
}

/** Country code guessed from the browser's language list (e.g. "sr-RS" → RS, "ru" → RU). */
export function guessCountry(codes) {
  const langs = (typeof navigator !== 'undefined' && (navigator.languages?.length ? navigator.languages : [navigator.language])) || [];
  const byLang = { ru: 'RU', sr: 'RS', hr: 'HR', bs: 'BA', mk: 'MK', sl: 'SI', bg: 'BG', ro: 'RO', uk: 'UA', be: 'BY', kk: 'KZ', uz: 'UZ', ky: 'KG', hy: 'AM', az: 'AZ', lv: 'LV', lt: 'LT', et: 'EE', de: 'DE', fr: 'FR', it: 'IT', es: 'ES', pt: 'PT', nl: 'NL', sv: 'SE', nb: 'NO', no: 'NO', da: 'DK', fi: 'FI', is: 'IS', pl: 'PL', cs: 'CZ', sk: 'SK', hu: 'HU', el: 'GR', tr: 'TR', he: 'IL', ja: 'JP', ko: 'KR', zh: 'CN' };
  for (const l of langs) {
    const [base, region] = String(l || '').split('-');
    if (region && codes.includes(region.toUpperCase())) return region.toUpperCase();
    const c = byLang[base?.toLowerCase()];
    if (c && codes.includes(c)) return c;
  }
  return null;
}

const KEYPAD = { a: 2, b: 2, c: 2, d: 3, e: 3, f: 3, g: 4, h: 4, i: 4, j: 5, k: 5, l: 5, m: 6, n: 6, o: 6, p: 7, q: 7, r: 7, s: 7, t: 8, u: 8, v: 8, w: 9, x: 9, y: 9, z: 9 };

/** "116 111 (children); 0800 0800 (parents)" → [{ num: '116 111', label: 'children', tel: 'tel:116111' }, …] */
export function phoneParts(phone) {
  if (!phone) return [];
  return String(phone).split(/\s*;\s*|\s+\/\s+/).filter(Boolean).map((part) => {
    // a trailing "(…)" is a label unless it is a short area code like "(1)" or the digit form of a vanity number
    let num = part.trim(); let label = null;
    const m = num.match(/^(.*\S)\s*\(([^)]*)\)\s*$/);
    if (m && !/^\d{1,2}$/.test(m[2])) {
      num = m[1];
      label = /^[\d\s-]+$/.test(m[2]) && /[A-Za-z]/.test(m[1]) ? null : m[2];
    }
    const dial = num.split(/\sDW\s/)[0].toLowerCase().replace(/[a-z]/g, (ch) => KEYPAD[ch] ?? '').replace(/[^\d+]/g, '');
    return { num: num.replace(/\s{2,}/g, ' '), label, tel: dial.length >= 3 && !/whatsapp/i.test(label || '') ? `tel:${dial}` : null };
  });
}
