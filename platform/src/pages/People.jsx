import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useCommunity } from '../context/CommunityContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { api, isDown, classify, friendly } from '../lib/api.js';
import { TAGS, tagKey } from '../lib/boards.js';
import { relTime } from '../lib/time.js';
import { PageHead, CalmBanner, EmptyState, Skel, RoleBadge } from '../components/ui.jsx';
import { IconSearch, IconUsers, IconArrowLeft, IconPlus } from '../components/Icons.jsx';

const tagLabel = (t, tag) => { const k = tagKey(tag); const v = t(k); return v === k ? tag : v; };

export default function People() {
  const { t, lang } = useApp();
  const community = useCommunity();
  const auth = useAuth();
  const ui = useUI();
  const [rows, setRows] = useState(null);
  const [state, setState] = useState('loading');
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [tag, setTag] = useState(null);

  useEffect(() => {
    let alive = true;
    api.directory().then((r) => { if (alive) { setRows(r || []); setState('ok'); } }).catch((e) => {
      if (!alive) return;
      const c = classify(e); community.report(c);
      setState(isDown(c) ? 'down' : 'error'); setErr(friendly(c, t));
    });
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = useMemo(() => {
    if (!rows) return [];
    const s = q.trim().toLowerCase();
    return rows.filter((p) => (!tag || (p.tags || []).includes(tag))
      && (!s || [p.handle, p.display_name, p.institution, p.country, p.works_with, p.bio, ...(p.tags || [])].filter(Boolean).join(' ').toLowerCase().includes(s)));
  }, [rows, q, tag]);

  return (
    <div className="shell page" data-space="research">
      <div className="pt-8"><Link to="/research" className="crumbs inline-flex"><IconArrowLeft width={16} height={16} />{t('nav_research')}</Link></div>
      <PageHead kicker={t('people_kicker')} title={t('people_title')} sub={t('people_sub')} className="!pt-2" />
      {state === 'down' ? (
        <>
          <CalmBanner />
          <div className="card mt-4"><EmptyState icon={IconUsers} title={t('people_down_t')} body={t('people_down_b')} /></div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 items-center mb-4">
            <div className="searchbox flex-1 min-w-[220px] max-w-[420px]">
              <IconSearch />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('people_search')} aria-label={t('people_search')} />
            </div>
            {!auth.profile && <button type="button" className="btn btn-primary ml-auto" onClick={() => ui.openJoin({ space: 'research' })}><IconPlus />{t('people_add_me')}</button>}
          </div>
          <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label={t('filter_tag')}>
            <button type="button" className="chip" aria-pressed={!tag} onClick={() => setTag(null)}>{t('all')}</button>
            {TAGS.map((x) => <button key={x} type="button" className="chip" aria-pressed={tag === x} onClick={() => setTag(tag === x ? null : x)}>{tagLabel(t, x)}</button>)}
          </div>
          {state === 'loading' && (
            <div className="people" aria-busy="true">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="card person" aria-hidden="true">
                  <div className="top"><Skel w={40} h={40} r={20} /><div className="flex-1"><Skel w="50%" h={14} /><Skel w="35%" h={10} style={{ marginTop: 8 }} /></div></div>
                  <Skel w="90%" h={11} /><div className="flex gap-2"><Skel w={70} h={20} r={10} /><Skel w={90} h={20} r={10} /></div>
                </div>
              ))}
            </div>
          )}
          {state === 'error' && <div className="card"><EmptyState icon={IconUsers} title={t('feed_error_t')} body={err} /></div>}
          {state === 'ok' && shown.length === 0 && (
            <div className="card">
              {rows.length ? <EmptyState icon={IconSearch} title={t('people_none_t')} body={t('people_none_b')}><button type="button" className="btn btn-ghost" onClick={() => { setQ(''); setTag(null); }}>{t('clear_search')}</button></EmptyState>
                : <EmptyState icon={IconUsers} title={t('people_empty_t')} body={t('people_empty_b')} />}
            </div>
          )}
          {state === 'ok' && shown.length > 0 && (
            <div className="people">
              {shown.map((p) => (
                <article key={p.handle} className="card person">
                  <div className="top">
                    <span className="avatar" aria-hidden="true">{p.handle.slice(0, 1)}</span>
                    <div className="min-w-0">
                      <h2 className="h4 truncate">{p.display_name || `@${p.handle}`}</h2>
                      <p className="tiny truncate">{p.display_name ? `@${p.handle} · ` : ''}{t('joined', { when: relTime(p.created_at, lang) })}</p>
                    </div>
                    <span className="ml-auto"><RoleBadge role={p.role_label} /></span>
                  </div>
                  {(p.institution || p.country) && <p className="small">{[p.institution, p.country].filter(Boolean).join(' · ')}</p>}
                  {p.works_with && <p className="text-[14px]"><span className="text-dim">{t('works_with')}:</span> {p.works_with}</p>}
                  {p.tags?.length > 0 && <div className="taglist">{p.tags.map((x) => <span key={x} className="tagsm">{tagLabel(t, x)}</span>)}</div>}
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
