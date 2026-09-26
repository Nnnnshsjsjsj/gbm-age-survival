import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { Modal } from './ui.jsx';
import JoinModal from './JoinModal.jsx';
import LoginModal from './LoginModal.jsx';
import {
  Mark, IconMenu, IconMoon, IconSun, IconHome, IconCompass, IconChart, IconLayers, IconBook, IconHeart, IconInfo,
  IconShield, IconUser, IconLogOut, IconGlobe, IconChevronDown,
} from './Icons.jsx';

const REPO = 'https://github.com/Nnnnshsjsjsj/gbm-age-survival';
export const LINKS = {
  repo: REPO,
  issues: `${REPO}/issues`,
  paperEn: `${REPO}/blob/main/paper/Research_Paper_EN.pdf`,
  paperRu: `${REPO}/blob/main/paper/Research_Paper_RU.pdf`,
};

const NAV = [
  { to: '/', key: 'nav_home', icon: IconHome, match: (p) => p === '/' },
  { to: '/explore', key: 'nav_explore', icon: IconCompass },
  { to: '/analyse', key: 'nav_analyse', icon: IconChart },
  { to: '/pool', key: 'nav_pool', icon: IconLayers },
  { to: '/research', key: 'nav_research', icon: IconBook, match: (p) => p.startsWith('/research') || p.startsWith('/people') },
  { to: '/families', key: 'nav_families', icon: IconHeart },
  { to: '/about', key: 'nav_about', icon: IconInfo },
];
const isActive = (item, path) => (item.match ? item.match(path) : path === item.to || path.startsWith(`${item.to}/`));

const TITLES = [
  ['/explore', 'explore_title'], ['/analyse', 'wiz_title'], ['/pool', 'pool_title'], ['/research', 'nav_research'], ['/people', 'people_title'],
  ['/families', 'nav_families'], ['/mod', 'mod_title'], ['/account', 'acct_title'], ['/rules', 'rules_title'], ['/privacy', 'privacy_title'], ['/about', 'about_title'],
];

function Wordmark() {
  return (
    <Link to="/" className="wordmark" aria-label="plateau, home">
      <Mark size={28} />
      <span className="name" aria-hidden="true">plateau<span className="bar" /></span>
    </Link>
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

  useEffect(() => { window.scrollTo(0, 0); setSheet(false); }, [path]);
  useEffect(() => {
    const hit = TITLES.find(([p]) => path.startsWith(p));
    document.title = hit ? `${t(hit[1])} · plateau` : 'plateau — glioblastoma cohorts, side by side';
  }, [path, t]);
  useEffect(() => {
    if (!loc.hash) return;
    const el = document.getElementById(loc.hash.slice(1));
    if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
  }, [loc.hash, path]);

  // Signed in but no profile yet (signed up, then closed the tab): continue at the handle step, once per session.
  const nudged = useRef(null);
  useEffect(() => {
    const uid = auth.user?.id;
    if (auth.needsProfile && uid && nudged.current !== uid && !ui.join) { nudged.current = uid; ui.openJoin({ step: 3 }); }
  }, [auth.needsProfile, auth.user, ui]);

  const nav = auth.isAdmin ? [...NAV, { to: '/mod', key: 'nav_mod', icon: IconShield }] : NAV;
  const joinSpace = family ? 'family' : undefined;

  return (
    <div className="min-h-screen flex flex-col" data-space={family ? 'family' : 'research'}>
      <a href="#main" className="skip" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>{t('skip')}</a>
      <header className="topbar">
        <div className="shell topbar-in">
          <Wordmark />
          <nav className="mainnav" aria-label={t('nav_label')}>
            {nav.map((item) => (
              <Link key={item.to} to={item.to} className="navlink" aria-current={isActive(item, path) ? 'page' : undefined}>{t(item.key)}</Link>
            ))}
          </nav>
          <div className="topactions">
            <button type="button" className="iconbtn langbtn" onClick={toggleLang} aria-label={t('lang_toggle')} lang={lang === 'en' ? 'ru' : 'en'}>{t('lang_short')}</button>
            <button type="button" className="iconbtn themebtn" onClick={toggleTheme} aria-label={t('theme_toggle')}>
              <IconMoon className="theme-moon" /><IconSun className="theme-sun" />
            </button>
            {auth.user ? <UserMenu /> : (
              <button type="button" className="btn btn-primary btn-sm" onClick={() => ui.openJoin({ space: joinSpace })}>{t('join')}</button>
            )}
            <button type="button" className="iconbtn menubtn" aria-label={t('menu')} aria-expanded={sheet} onClick={() => setSheet(true)}><IconMenu /></button>
          </div>
        </div>
      </header>

      <Modal open={sheet} onClose={() => setSheet(false)} sheet labelledBy="sheet-h">
        <h2 id="sheet-h" className="sr-only">{t('menu')}</h2>
        <nav aria-label={t('nav_label')}>
          {nav.map((item) => {
            const Icon = item.icon;
            return <Link key={item.to} to={item.to} className="sheetitem" aria-current={isActive(item, path) ? 'page' : undefined} onClick={() => setSheet(false)}><Icon />{t(item.key)}</Link>;
          })}
        </nav>
        <div className="h-px bg-line my-2 mx-2" />
        <button type="button" className="sheetitem" onClick={toggleLang} lang={lang === 'en' ? 'ru' : 'en'}><IconGlobe />{t('lang_toggle')}</button>
        <button type="button" className="sheetitem" onClick={toggleTheme}><IconMoon className="theme-moon" /><IconSun className="theme-sun" />{t('theme_toggle')}</button>
        {auth.user ? (
          <>
            <Link to="/account" className="sheetitem" onClick={() => setSheet(false)}><IconUser />{t('nav_account')}</Link>
            <button type="button" className="sheetitem" onClick={() => { setSheet(false); auth.signOut(); }}><IconLogOut />{t('sign_out')}</button>
          </>
        ) : (
          <button type="button" className="sheetitem" onClick={() => { setSheet(false); ui.openLogin(); }}><IconUser />{t('log_in')}</button>
        )}
      </Modal>

      <main id="main" className="flex-1 w-full" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="footer">
        <div className="shell footer-in">
          <p>{t('footer_left')}</p>
          <nav aria-label={t('footer_nav')}>
            <Link to="/rules">{t('nav_rules')}</Link>
            <Link to="/privacy">{t('nav_privacy')}</Link>
            <Link to="/about">{t('nav_about')}</Link>
            <a href={LINKS.repo} rel="noopener">GitHub</a>
          </nav>
        </div>
      </footer>

      <JoinModal />
      <LoginModal />
    </div>
  );
}
