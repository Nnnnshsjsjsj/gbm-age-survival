// All UI strings. `t(key, params)` replaces {name} placeholders. Missing Russian keys fall back to English.
import { scienceEn, scienceRu } from './i18n/science.js';
import { enApp } from './i18n/en.js';
import { ruApp } from './i18n/ru.js';
import { storyEn, storyRu } from './i18n/story.js';
import { guidesEn, guidesRu } from './i18n/guides.js';

export const en = { ...scienceEn, ...enApp, ...storyEn, ...guidesEn };
export const ru = { ...scienceRu, ...ruApp, ...storyRu, ...guidesRu };
export const LANGS = { en, ru };

export function translate(lang, key, params) {
  const table = LANGS[lang] || en;
  let s = table[key] ?? en[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
