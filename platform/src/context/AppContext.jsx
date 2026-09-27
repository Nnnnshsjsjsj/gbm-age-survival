import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translate } from '../i18n.js';

const Ctx = createContext(null);
const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* storage unavailable */ } };

export function AppProvider({ children }) {
  const [lang, setLang] = useState(() => (read('plateau-lang') === 'ru' ? 'ru' : 'en'));
  // Dark is the default regardless of the OS preference; an explicit choice is remembered.
  const [theme, setTheme] = useState(() => (read('plateau-theme') === 'light' ? 'light' : 'dark'));

  useEffect(() => { document.documentElement.lang = lang; write('plateau-lang', lang); }, [lang]);
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'light' ? '#F6F8F7' : '#07090A';
    write('plateau-theme', theme);
  }, [theme]);

  const toggleLang = useCallback(() => setLang((l) => (l === 'en' ? 'ru' : 'en')), []);
  const isDark = () => document.documentElement.dataset.theme !== 'light';
  const toggleTheme = useCallback(() => setTheme(isDark() ? 'light' : 'dark'), []);
  const t = useCallback((key, params) => translate(lang, key, params), [lang]);
  const value = useMemo(() => ({ lang, t, toggleLang, theme, toggleTheme, isDark }), [lang, t, toggleLang, theme, toggleTheme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
export const useT = () => useContext(Ctx).t;
