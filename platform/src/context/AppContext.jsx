import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translate } from '../i18n.js';

const Ctx = createContext(null);
const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };

export function AppProvider({ children }) {
  const [lang, setLangState] = useState(() => (read('gbm-lang') === 'ru' ? 'ru' : 'en'));
  const [theme, setThemeState] = useState(() => read('gbm-theme') || 'auto');

  useEffect(() => { document.documentElement.lang = lang; write('gbm-lang', lang); }, [lang]);
  useEffect(() => {
    if (theme === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = theme;
    if (theme !== 'auto') write('gbm-theme', theme);
  }, [theme]);

  const toggleLang = useCallback(() => setLangState((l) => (l === 'en' ? 'ru' : 'en')), []);
  const toggleTheme = useCallback(() => {
    setThemeState((cur) => {
      const dark = matchMedia('(prefers-color-scheme: dark)').matches;
      const eff = cur === 'auto' ? (dark ? 'dark' : 'light') : cur;
      return eff === 'dark' ? 'light' : 'dark';
    });
  }, []);
  const t = useCallback((key, params) => translate(lang, key, params), [lang]);
  const value = useMemo(() => ({ lang, t, toggleLang, theme, toggleTheme }), [lang, t, toggleLang, theme, toggleTheme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
export const useT = () => useContext(Ctx).t;
