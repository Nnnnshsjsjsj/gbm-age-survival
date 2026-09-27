import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { baseUrl } from '../lib/reference.js';
import { boardByKey } from '../lib/boards.js';
import Forum from '../components/Forum.jsx';
import NotFound from './NotFound.jsx';
import { SectionHead, Skel, Notice } from '../components/ui.jsx';
import { IconLock, IconShield, IconMessage, IconExternal, IconPhone, IconArrowRight, IconBook, IconHeart } from '../components/Icons.jsx';

const REGION_ORDER = ['International', 'Europe', 'UK', 'USA', 'Canada', 'Serbia', 'Russia'];

export function Resources() {
  const { t, lang } = useApp();
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState(false);
  const [region, setRegion] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch(`${baseUrl()}reference/resources.json`).then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => alive && setRows(d)).catch(() => alive && setErr(true));
    return () => { alive = false; };
  }, []);
  const groups = rows ? REGION_ORDER.concat([...new Set(rows.map((r) => r.region))].filter((r) => !REGION_ORDER.includes(r)))
    .map((region) => [region, rows.filter((r) => r.region === region)]).filter(([, list]) => list.length) : [];
  const regionLabel = (r) => { const k = `region_${r.toLowerCase()}`; const v = t(k); return v === k ? r : v; };

  return (
    <div data-testid="resources">
      {err && <Notice kind="error">{t('res_error')}</Notice>}
      {!rows && !err && (
        <div className="grid gap-3 sm:grid-cols-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => <div key={i} className="card card-pad" aria-hidden="true"><Skel w="60%" h={16} /><Skel w="95%" h={11} style={{ marginTop: 14 }} /><Skel w="70%" h={11} style={{ marginTop: 8 }} /></div>)}
        </div>
      )}
      {rows && (
        <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label={t('res_filter')}>
          <button type="button" className="chip" aria-pressed={!region} onClick={() => setRegion(null)}>{t('all')} <span className="text-dim">{rows.length}</span></button>
          {groups.map(([r, list]) => <button key={r} type="button" className="chip" aria-pressed={region === r} onClick={() => setRegion(region === r ? null : r)}>{regionLabel(r)} <span className="text-dim">{list.length}</span></button>)}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groups.filter(([r]) => !region || r === region).flatMap(([r, list]) => list.map((x) => ({ ...x, region: r }))).map((r) => (
          <article key={r.url} className="card card-pad flex flex-col gap-2">
            <p className="kicker">{regionLabel(r.region)}</p>
            <h3 className="h4"><a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-2 text-ink no-underline hover:underline">{r.name}<IconExternal width={15} height={15} className="flex-none mt-1 text-dim" /></a></h3>
            <p className="small">{(r.offers && (r.offers[lang] || r.offers.en)) || ''}</p>
            {(r.helpline || (r.lang && r.lang !== 'en')) && (
              <div className="flex flex-wrap gap-2 mt-auto pt-2 items-center">
                {r.helpline && <span className="badge badge-accent normal-case tracking-normal text-[12.5px] whitespace-normal">{r.helpline.includes('@') ? <IconMessage /> : <IconPhone />}{r.helpline}</span>}
                {r.lang && r.lang !== 'en' && <span className="role">{r.lang.toUpperCase()}</span>}
              </div>
            )}
          </article>
        ))}
      </div>
      {rows && <p className="tiny mt-8 max-w-[70ch]">{t('res_disclaimer')}</p>}
    </div>
  );
}

function Landing() {
  const { t } = useApp();
  const auth = useAuth();
  const ui = useUI();
  const research = auth.profile?.space === 'research';
  return (
    <>
      <section className="hero" style={{ paddingBottom: 56 }}>
        <div className="hero-glow" aria-hidden="true" />
        <div className="shell relative">
          <span className="kicker-pill">{t('fam_kicker')}</span>
          <h1 className="display mt-6" style={{ maxWidth: '19ch' }}>{t('fam_h1_a')}<span className="hl">{t('fam_h1_hl')}</span>{t('fam_h1_b')}</h1>
          <p className="lede mt-6">{t('fam_lede')}</p>
          {research ? (
            <div className="mt-8 max-w-[640px]"><Notice kind="lock"><p><b>{t('fam_research_t')}</b> {t('fam_research_b')}</p></Notice></div>
          ) : (
            <div className="btnrow mt-8">
              <button type="button" className="btn btn-primary" onClick={() => ui.openJoin({ space: 'family' })}>{t('fam_join')}<IconArrowRight /></button>
              {!auth.user && <button type="button" className="btn btn-ghost" onClick={ui.openLogin}>{t('log_in')}</button>}
            </div>
          )}
        </div>
      </section>
      <section className="section" aria-labelledby="prom-h">
        <div className="shell">
          <SectionHead kicker={t('fam_prom_kicker')} title={t('fam_prom_title')} id="prom-h" />
          <div className="how">
            {[[IconLock, 'p1'], [IconShield, 'p2'], [IconMessage, 'p3']].map(([Icon, k]) => (
              <div key={k} className="card card-pad">
                <div className="num"><span className="ic" aria-hidden="true"><Icon /></span></div>
                <h3 className="h4">{t(`fam_${k}_t`)}</h3>
                <p>{t(`fam_${k}_b`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section" aria-labelledby="res-h" id="resources">
        <div className="shell">
          <SectionHead kicker={t('res_kicker')} title={t('res_title')} sub={t('res_sub')} id="res-h" />
          <Resources />
        </div>
      </section>
    </>
  );
}

export default function Families() {
  const { t } = useApp();
  const auth = useAuth();
  const { board } = useParams();
  const [params] = useSearchParams();
  if (board && boardByKey(board)?.space !== 'family') return <NotFound />;
  const member = auth.profile?.space === 'family' || (auth.isAdmin && !!auth.profile);
  if (!member) {
    if (auth.user && auth.profileState === 'loading') {
      return <div className="shell page pt-16" aria-busy="true"><Skel w={220} h={14} /><Skel w="60%" h={48} style={{ marginTop: 24 }} /><Skel w="45%" h={16} style={{ marginTop: 24 }} /></div>;
    }
    return <Landing />;
  }
  const tab = params.get('tab') === 'resources' ? 'resources' : 'forum';
  return (
    <div data-space="family">
      <div className="shell pt-6">
        <nav className="tabs" aria-label={t('nav_families')}>
          <Link to="/families" className="tab" aria-current={tab === 'forum' ? 'page' : undefined}><IconHeart width={16} height={16} />{t('fam_tab_forum')}</Link>
          <Link to="/families?tab=resources" className="tab" aria-current={tab === 'resources' ? 'page' : undefined}><IconBook width={16} height={16} />{t('fam_tab_res')}</Link>
        </nav>
      </div>
      {tab === 'forum' ? <Forum space="family" board={board || null} /> : (
        <div className="shell page">
          <div className="pagehead"><div className="kicker kicker-dot">{t('res_kicker')}</div><h1 className="h1">{t('res_title')}</h1><p className="sub">{t('res_sub')}</p></div>
          <Resources />
        </div>
      )}
    </div>
  );
}
