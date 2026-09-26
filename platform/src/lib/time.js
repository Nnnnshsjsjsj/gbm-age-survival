// Short relative times: "just now", "5 min ago", "3 h ago", "2 d ago", then a date.
const UNITS = {
  en: { now: 'just now', min: (n) => `${n} min ago`, h: (n) => `${n} h ago`, d: (n) => `${n} d ago` },
  ru: { now: 'только что', min: (n) => `${n} мин назад`, h: (n) => `${n} ч назад`, d: (n) => `${n} дн. назад` },
};

export function relTime(iso, lang = 'en', now = Date.now()) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const u = UNITS[lang] || UNITS.en;
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return u.now;
  const m = Math.floor(s / 60);
  if (m < 60) return u.min(m);
  const h = Math.floor(m / 60);
  if (h < 24) return u.h(h);
  const d = Math.floor(h / 24);
  if (d < 14) return u.d(d);
  return new Date(t).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short', year: new Date(t).getFullYear() === new Date(now).getFullYear() ? undefined : 'numeric' });
}

export const fullTime = (iso, lang = 'en') => (iso ? new Date(iso).toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '');
