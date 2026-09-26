import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translate } from '../i18n.js';

const Ctx = createContext(null);
const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* storage unavailable */ } };

export function AppProvider({ children }) {
  const [lang, setLang] = useState(() => (read('plateau-lang') === 'ru' ? 'ru' : 'en'));
  const [theme, setTheme] = useState(() => { const v = read('plateau-theme'); return v === 'light' || v === 'dark' ? v : 'auto'; });

  useEffect(() => { document.documentElement.lang = lang; write('plateau-lang', lang); }, [lang]);
  useEffect(() => {
    const el = document.documentElement;
    if (theme === 'auto') delete el.dataset.theme; else el.dataset.theme = theme;
    write('plateau-theme', theme === 'auto' ? null : theme);
  }, [theme]);

  const toggleLang = useCallback(() => setLang((l) => (l === 'en' ? 'ru' : 'en')), []);
  const isDark = () => {
    const cur = document.documentElement.dataset.theme;
    if (cur) return cur === 'dark';
    try { return matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; }
  };
  const toggleTheme = useCallback(() => setTheme(isDark() ? 'light' : 'dark'), []);
  const t = useCallback((key, params) => translate(lang, key, params), [lang]);
  const value = useMemo(() => ({ lang, t, toggleLang, theme, toggleTheme, isDark }), [lang, t, toggleLang, theme, toggleTheme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
export const useT = () => useContext(Ctx).t;
