import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { Modal } from './ui.jsx';
import JoinModal from './JoinModal.jsx';
import { useSmoothScroll, scrollToEl } from '../motion/core.js';
import { Cursor } from '../motion/components.jsx';
import LoginModal from './LoginModal.jsx';
import {
  Logo, IconMenu, IconMoon, IconSun, IconHome, IconCompass, IconChart, IconLayers, IconBook, IconHeart, IconInfo,
  IconShield, IconUser, IconLogOut, IconGlobe, IconChevronDown, IconArrowUpRight, IconBrain, IconUsers,
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
  { to: '/explore', key: 'nav_explore', icon: IconCompass },
  { to: '/analyse', key: 'nav_analyse', icon: IconChart },
  { to: '/pool', key: 'nav_pool', icon: IconLayers },
];
const COMMUNITY = [
  { to: '/research', key: 'nav_research', icon: IconBook },
  { to: '/families', key: 'nav_families', icon: IconHeart },
  { to: '/people', key: 'nav_people', icon: IconUsers },
];
const ABOUT = { to: '/about', key: 'nav_about', icon: IconInfo };
const inCommunity = (p) => COMMUNITY.some((c) => p === c.to || p.startsWith(`${c.to}/`)) || p === '/community';
const isActive = (item, path) => (item.match ? item.match(path) : path === item.to || path.startsWith(`${item.to}/`));

const TITLES = [
  ['/brain', 'lab_title'], ['/explore', 'explore_title'], ['/analyse', 'wiz_title'], ['/pool', 'pool_title'], ['/research', 'nav_research'], ['/people', 'people_title'],
  ['/families', 'nav_families'], ['/mod', 'mod_title'], ['/account', 'acct_title'], ['/rules', 'rules_title'], ['/privacy', 'privacy_title'], ['/about', 'about_title'],
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
          <nav aria-label={t('footer_community')}>
            <h2>{t('footer_community')}</h2>
            <ul>
              <li><Link to="/research">{t('nav_research')}</Link></li>
              <li><Link to="/families">{t('nav_families')}</Link></li>
              <li><Link to="/people">{t('footer_people')}</Link></li>
            </ul>
          </nav>
          <nav aria-label={t('footer_project')}>
            <h2>{t('footer_project')}</h2>
            <ul>
              <li><Link to="/about">{t('nav_about')}</Link></li>
              <li><Link to="/rules">{t('nav_rules')}</Link></li>
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

/** "Community ▾": a disclosure with three links. Escape or a click outside closes it. */
function CommunityMenu({ path }) {
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
  const active = inCommunity(path);
  return (
    <div className="relative navdrop" ref={ref}>
      <button type="button" className="navlink" aria-expanded={open} aria-controls="community-menu" data-active={active || undefined} onClick={() => setOpen((o) => !o)}>
        {t('nav_community')}<IconChevronDown width={14} height={14} className="chev" />
      </button>
      {open && (
        <div className="menu navmenu" id="community-menu">
          <div className="mhead">{t('nav_community_menu')}</div>
          {COMMUNITY.map((c) => {
            const Icon = c.icon;
            return <Link key={c.to} to={c.to} aria-current={path.startsWith(c.to) ? 'page' : undefined} onClick={() => setOpen(false)}><Icon width={18} height={18} />{t(c.key)}</Link>;
          })}
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { t } = useApp();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); ref.current?.querySelector('button')?.focus(); } };
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const name = profile?.handle || (user?.email || '').split('@')[0];
  return (
    <div className="relative" ref={ref} data-space={profile?.space === 'family' ? 'family' : undefined}>
      <button type="button" className="userbtn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="avatar" aria-hidden="true">{name.slice(0, 1)}</span>
        <span className="h">@{name}</span>
        <IconChevronDown width={16} height={16} />
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="mhead">{profile ? t(profile.space === 'family' ? 'space_family' : 'space_research') : t('acct_no_profile_short')}</div>
          <Link role="menuitem" to="/account" onClick={() => setOpen(false)}><IconUser width={18} height={18} />{t('nav_account')}</Link>
          {isAdmin && <Link role="menuitem" to="/mod" onClick={() => setOpen(false)}><IconShield width={18} height={18} />{t('nav_mod')}</Link>}
          <div className="sep" />
          <button role="menuitem" type="button" onClick={() => { setOpen(false); signOut(); }}><IconLogOut width={18} height={18} />{t('sign_out')}</button>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { t, lang, toggleLang, toggleTheme } = useApp();
  const auth = useAuth();
  const ui = useUI();
  const loc = useLocation();
  const path = loc.pathname;
  const [sheet, setSheet] = useState(false);
  const family = path.startsWith('/families');

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

  // Signed in but no profile yet (signed up, then closed the tab): continue at the handle step, once per session.
  const nudged = useRef(null);
  useEffect(() => {
    const uid = auth.user?.id;
    if (auth.needsProfile && uid && nudged.current !== uid && !ui.join) { nudged.current = uid; ui.openJoin({ step: 3 }); }
  }, [auth.needsProfile, auth.user, ui]);

  useSurfaceMotion(path);

  const extra = auth.isAdmin ? [{ to: '/mod', key: 'nav_mod', icon: IconShield }] : [];
  const sheetNav = [...NAV, ...COMMUNITY, ABOUT, ...extra];
  const joinSpace = family ? 'family' : undefined;

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
            <CommunityMenu path={path} />
            {[ABOUT, ...extra].map((item) => (
              <Link key={item.to} to={item.to} className="navlink" aria-current={isActive(item, path) ? 'page' : undefined}>{t(item.key)}</Link>
            ))}
          </nav>
          <div className="topactions">
            <button type="button" className="iconbtn langbtn" onClick={toggleLang} aria-label={t('lang_toggle')} lang={lang === 'en' ? 'ru' : 'en'}>{t('lang_short')}</button>
            <button type="button" className="iconbtn themebtn" onClick={toggleTheme} aria-label={t('theme_toggle')}>
              <IconMoon className="theme-moon" /><IconSun className="theme-sun" />
            </button>
            {auth.user ? <UserMenu /> : (
              <>
                <span className="topsep" aria-hidden="true" />
                <button type="button" className="btn btn-text btn-sm signin" onClick={ui.openLogin}>{t('log_in')}</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => ui.openJoin({ space: joinSpace })}>{t('join')}</button>
              </>
            )}
            <button type="button" className="iconbtn menubtn" aria-label={t('menu')} aria-expanded={sheet} onClick={() => setSheet(true)}><IconMenu /></button>
          </div>
        </div>
      </header>

      <Modal open={sheet} onClose={() => setSheet(false)} sheet labelledBy="sheet-h">
        <h2 id="sheet-h" className="sr-only">{t('menu')}</h2>
        <div className="sheet-top wordmark" aria-hidden="true"><Logo size={26} /><span className="name">cohort<span className="ex">ex</span></span></div>
        <nav aria-label={t('nav_label')}>
          {sheetNav.map((item) => {
            const Icon = item.icon;
            const first = item === COMMUNITY[0];
            return (
              <div key={item.to} className="contents">
                {first && <div className="sheetgroup">{t('nav_community')}</div>}
                <Link to={item.to} className="sheetitem" aria-current={isActive(item, path) ? 'page' : undefined} onClick={() => setSheet(false)}><Icon />{t(item.key)}</Link>
              </div>
            );
          })}
        </nav>
        <div className="mt-6 grid">
          <button type="button" className="sheetitem small-item" onClick={toggleLang} lang={lang === 'en' ? 'ru' : 'en'}><IconGlobe />{t('lang_toggle')}</button>
          <button type="button" className="sheetitem small-item" onClick={toggleTheme}><IconMoon className="theme-moon" /><IconSun className="theme-sun" />{t('theme_toggle')}</button>
          {auth.user ? (
            <>
              <Link to="/account" className="sheetitem small-item" onClick={() => setSheet(false)}><IconUser />{t('nav_account')}</Link>
              <button type="button" className="sheetitem small-item" onClick={() => { setSheet(false); auth.signOut(); }}><IconLogOut />{t('sign_out')}</button>
            </>
          ) : (
            <button type="button" className="sheetitem small-item" onClick={() => { setSheet(false); ui.openLogin(); }}><IconUser />{t('log_in')}</button>
          )}
        </div>
      </Modal>

      <main id="main" className="flex-1 w-full" tabIndex={-1}>
        <Outlet />
      </main>

      <Footer />

      <JoinModal />
      <LoginModal />
      <Cursor dragLabel={t('cursor_drag')} />
    </div>
  );
}
