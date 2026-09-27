import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Modal } from './ui.jsx';
import { useSmoothScroll, scrollToEl } from '../motion/core.js';
import { Cursor } from '../motion/components.jsx';
import {
  Logo, IconMenu, IconMoon, IconSun, IconHome, IconCompass, IconChart, IconLayers, IconBook, IconHeart, IconInfo,
  IconGlobe, IconChevronDown, IconArrowUpRight, IconBrain,
} from './Icons.jsx';

const REPO = 'https://github.com/Nnnnshsjsjsj/gbm-age-survival';
export const LINKS = {
  repo: REPO,
  issues: `${REPO}/issues`,
  paperEn: `${REPO}/blob/main/paper/Research_Paper_EN.pdf`,
  paperRu: `${REPO}/blob/main/paper/Research_Paper_RU.pdf`,
};

const NAV = [
  { to: '/', key: 'nav_story', icon: IconHome, match: (p) => p === '/' },
  { to: '/brain', key: 'nav_brain', icon: IconBrain },
];
const TOOLS = [
  { to: '/explore', key: 'nav_explore', icon: IconCompass, hint: 'nav_explore_hint' },
  { to: '/analyse', key: 'nav_analyse', icon: IconChart, hint: 'nav_analyse_hint' },
  { to: '/pool', key: 'nav_pool', icon: IconLayers, hint: 'nav_pool_hint' },
];
const GUIDES = [
  { to: '/hub', key: 'nav_hub', icon: IconBook },
  { to: '/patients', key: 'nav_patients', icon: IconHeart },
];
const ABOUT = { to: '/about', key: 'nav_about', icon: IconInfo };
const inTools = (p) => TOOLS.some((c) => p === c.to || p.startsWith(`${c.to}/`));
const isActive = (item, path) => (item.match ? item.match(path) : path === item.to || path.startsWith(`${item.to}/`));

const TITLES = [
  ['/brain', 'lab_title'], ['/explore', 'explore_title'], ['/analyse', 'wiz_title'], ['/pool', 'pool_title'], ['/hub', 'nav_hub'],
  ['/patients', 'nav_patients'], ['/privacy', 'privacy_title'], ['/about', 'about_title'],
];

function Wordmark() {
  return (
    <Link to="/" className="wordmark" aria-label="cohortex, home">
      <Logo size={26} />
      <span className="name" aria-hidden="true">cohort<span className="ex">ex</span></span>
    </Link>
  );
}

/** Pointer spotlight for .spot cards and fade-up for .reveal blocks. Both stay off under reduced motion. */
function useSurfaceMotion(path) {
  useEffect(() => {
    let reduce = false;
    try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* old browser */ }
    if (reduce) return undefined;
    let raf = 0, last = null;
    const onMove = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      last = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = last.target instanceof Element ? last.target.closest('.spot') : null;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${last.clientX - r.left}px`);
        el.style.setProperty('--my', `${last.clientY - r.top}px`);
      });
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => { document.removeEventListener('pointermove', onMove); if (raf) cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    let reduce = false;
    try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* old browser */ }
    if (reduce || typeof IntersectionObserver === 'undefined') { document.documentElement.classList.remove('motion'); return undefined; }
    document.documentElement.classList.add('motion');
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    const scan = () => document.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));
    scan();
    const main = document.getElementById('main');
    const mo = main ? new MutationObserver(scan) : null;
    if (mo) mo.observe(main, { childList: true, subtree: true });
    return () => { io.disconnect(); mo?.disconnect(); };
  }, [path]);
}

function Footer() {
  const { t, lang } = useApp();
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer-grid">
          <div className="footer-brand">
            <Wordmark />
            <p>{t('footer_mission')}</p>
          </div>
          <nav aria-label={t('footer_product')}>
            <h2>{t('footer_product')}</h2>
            <ul>
              <li><Link to="/explore">{t('nav_explore')}</Link></li>
              <li><Link to="/analyse">{t('nav_analyse')}</Link></li>
              <li><Link to="/pool">{t('nav_pool')}</Link></li>
              <li><Link to="/brain">{t('nav_brain')}</Link></li>
            </ul>
          </nav>
          <nav aria-label={t('footer_guides')}>
            <h2>{t('footer_guides')}</h2>
            <ul>
              <li><Link to="/hub">{t('nav_hub')}</Link></li>
              <li><Link to="/hub#library">{t('hub_library')}</Link></li>
              <li><Link to="/hub#toolbox">{t('hub_toolbox')}</Link></li>
              <li><Link to="/patients">{t('nav_patients')}</Link></li>
              <li><Link to="/patients#help">{t('pt_help_title_short')}</Link></li>
            </ul>
          </nav>
          <nav aria-label={t('footer_project')}>
            <h2>{t('footer_project')}</h2>
            <ul>
              <li><Link to="/about">{t('nav_about')}</Link></li>
              <li><Link to="/privacy">{t('nav_privacy')}</Link></li>
              <li><a href={LINKS.repo} rel="noopener">GitHub<IconArrowUpRight /></a></li>
              <li><a href={lang === 'ru' ? LINKS.paperRu : LINKS.paperEn} rel="noopener">{t('footer_paper')}<IconArrowUpRight /></a></li>
            </ul>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>{t('footer_copy')}</span>
          <span className="status">{t('footer_status')}</span>
        </div>
      </div>
    </footer>
  );
}

/** "Tools ▾": a disclosure with the three cohort tools. Escape or a click outside closes it. */
function ToolsMenu({ path }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); ref.current?.querySelector('button')?.focus(); } };
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div className="relative navdrop" ref={ref}>
      <button type="button" className="navlink" aria-expanded={open} aria-controls="tools-menu" data-active={inTools(path) || undefined} onClick={() => setOpen((o) => !o)}>
        {t('nav_tools')}<IconChevronDown width={14} height={14} className="chev" />
      </button>
      {open && (
        <div className="menu navmenu navmenu-wide" id="tools-menu">
          <div className="mhead">{t('nav_tools_menu')}</div>
          {TOOLS.map((c) => {
            const Icon = c.icon;
            return (
              <Link key={c.to} to={c.to} aria-current={path.startsWith(c.to) ? 'page' : undefined} onClick={() => setOpen(false)}>
                <Icon width={18} height={18} /><span className="grid"><span>{t(c.key)}</span><span className="mhint">{t(c.hint)}</span></span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { t, lang, toggleLang, toggleTheme } = useApp();
  const loc = useLocation();
  const path = loc.pathname;
  const [sheet, setSheet] = useState(false);
  const family = path.startsWith('/patients');

  useSmoothScroll(path);
  useEffect(() => { setSheet(false); }, [path]);
  useEffect(() => {
    const hit = TITLES.find(([p]) => path.startsWith(p));
    document.title = hit ? `${t(hit[1])} · cohortex` : 'cohortex — glioblastoma cohorts, side by side';
  }, [path, t]);
  useEffect(() => {
    if (!loc.hash) return;
    const id = loc.hash.slice(1);
    const t1 = setTimeout(() => { if (document.getElementById(id)) scrollToEl(id, { immediate: true }); }, 60);
    return () => clearTimeout(t1);
  }, [loc.hash, path]);

  useSurfaceMotion(path);

  const sheetGroups = [[null, NAV], ['nav_tools', TOOLS], ['nav_guides', GUIDES], [null, [ABOUT]]];

  return (
    <div className="app min-h-screen flex flex-col" data-space={family ? 'family' : 'research'}>
      <div className={`backdrop${path === '/' ? ' home' : ''}${path === '/brain' ? ' is-lab' : ''}`} aria-hidden="true">
        <div className="grid" /><div className="glow glow-a" /><div className="glow glow-b" />
      </div>
      <a href="#main" className="skip" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>{t('skip')}</a>
      <header className="topbar">
        <div className="shell topbar-in">
          <Wordmark />
          <nav className="mainnav" aria-label={t('nav_label')}>
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className="navlink" aria-current={isActive(item, path) ? 'page' : undefined}>{t(item.key)}</Link>
            ))}
            <ToolsMenu path={path} />
            {[...GUIDES, ABOUT].map((item) => (
              <Link key={item.to} to={item.to} className="navlink" aria-current={isActive(item, path) ? 'page' : undefined}>{t(item.key)}</Link>
            ))}
          </nav>
          <div className="topactions">
            <button type="button" className="iconbtn langbtn" onClick={toggleLang} aria-label={t('lang_toggle')} lang={lang === 'en' ? 'ru' : 'en'}>{t('lang_short')}</button>
            <button type="button" className="iconbtn themebtn" onClick={toggleTheme} aria-label={t('theme_toggle')}>
              <IconMoon className="theme-moon" /><IconSun className="theme-sun" />
            </button>
            <span className="topsep" aria-hidden="true" />
            <Link to="/patients#help" className="btn btn-soft btn-sm helpbtn" data-space="family">{t('nav_help')}</Link>
            <button type="button" className="iconbtn menubtn" aria-label={t('menu')} aria-expanded={sheet} onClick={() => setSheet(true)}><IconMenu /></button>
          </div>
        </div>
      </header>

      <Modal open={sheet} onClose={() => setSheet(false)} sheet labelledBy="sheet-h">
        <h2 id="sheet-h" className="sr-only">{t('menu')}</h2>
        <div className="sheet-top wordmark" aria-hidden="true"><Logo size={26} /><span className="name">cohort<span className="ex">ex</span></span></div>
        <nav aria-label={t('nav_label')}>
          {sheetGroups.map(([label, items]) => (
            <div key={label || items[0].to} className="contents">
              {label && <div className="sheetgroup">{t(label)}</div>}
              {items.map((item) => {
                const Icon = item.icon;
                return <Link key={item.to} to={item.to} className="sheetitem" aria-current={isActive(item, path) ? 'page' : undefined} onClick={() => setSheet(false)}><Icon />{t(item.key)}</Link>;
              })}
            </div>
          ))}
        </nav>
        <Link to="/patients#help" className="btn btn-soft helpbtn sheet-help" data-space="family" onClick={() => setSheet(false)}><IconHeart />{t('nav_help')}</Link>
        <div className="mt-6 grid">
          <button type="button" className="sheetitem small-item" onClick={toggleLang} lang={lang === 'en' ? 'ru' : 'en'}><IconGlobe />{t('lang_toggle')}</button>
          <button type="button" className="sheetitem small-item" onClick={toggleTheme}><IconMoon className="theme-moon" /><IconSun className="theme-sun" />{t('theme_toggle')}</button>
        </div>
      </Modal>

      <main id="main" className="flex-1 w-full" tabIndex={-1}>
        <Outlet />
      </main>

      <Footer />

      <Cursor dragLabel={t('cursor_drag')} />
    </div>
  );
}
