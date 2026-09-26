import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const REPO = 'https://github.com/Nnnnshsjsjsj/gbm-age-survival';
export const LINKS = { repo: REPO, issues: `${REPO}/issues`, paper: `${REPO}#paper` };

function ThemeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Layout() {
  const { t, lang, toggleLang, toggleTheme } = useApp();
  const { configured, isAdmin } = useAuth();
  const loc = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);

  const nav = [
    ['/', 'nav_home'], ['/explore', 'nav_explore'], ['/analyse', 'nav_analyse'], ['/pool', 'nav_pool'],
    ['/community', 'nav_community'], ...(configured && isAdmin ? [['/admin', 'nav_admin']] : []), ['/about', 'nav_about'],
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 btn">{t('skip')}</a>
      <header className="border-b border-line bg-surface">
        <div className="wrap flex items-center justify-between gap-3 py-2 flex-wrap">
          <NavLink to="/" className="font-serif font-semibold text-[15px] text-muted no-underline hover:text-text min-h-[44px] inline-flex items-center">{t('brand')}</NavLink>
          <div className="flex gap-2">
            <button type="button" className="btn btn-sm min-h-[44px]" onClick={toggleLang} aria-label={t('lang_toggle')} lang={lang === 'en' ? 'ru' : 'en'}>{t('lang_short')}</button>
            <button type="button" className="btn btn-sm min-h-[44px]" onClick={toggleTheme} aria-label={t('theme_toggle')}><ThemeIcon /></button>
          </div>
        </div>
        <nav className="wrap pb-2" aria-label="Main">
          <ul className="flex flex-wrap gap-1 list-none m-0 p-0">
            {nav.map(([to, key]) => (
              <li key={to}><NavLink to={to} end={to === '/'} className="nav-link">{t(key)}</NavLink></li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main" className="wrap flex-1 w-full py-6" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="wrap py-6 text-muted text-[13px] max-w-[84ch]">
        <p>{t('footer')} · <a href={REPO}>{t('github')}</a></p>
      </footer>
    </div>
  );
}
