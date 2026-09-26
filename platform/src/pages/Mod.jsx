import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCommunity } from '../context/CommunityContext.jsx';
import { api, friendly, isDown, classify } from '../lib/api.js';
import { boardByKey, spaceBase } from '../lib/boards.js';
import { relTime } from '../lib/time.js';
import { PageHead, CalmBanner, EmptyState, Skel, RoleBadge, Notice } from '../components/ui.jsx';
import { IconShield, IconCheckCircle, IconExternal } from '../components/Icons.jsx';

function Decide({ onDecide, approveKey = 'approve', rejectKey = 'reject', notePlaceholder }) {
  const { t } = useApp();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async (status) => { setBusy(true); try { await onDecide(status, note.trim()); } finally { setBusy(false); } };
  return (
    <div className="qact">
      <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder={notePlaceholder || t('mod_note_ph')} aria-label={t('mod_note_ph')} maxLength={300} />
      <button type="button" className="btn btn-ok btn-sm" disabled={busy} onClick={() => go('approved')}>{t(approveKey)}</button>
      <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={() => go('rejected')}>{t(rejectKey)}</button>
    </div>
  );
}

function Members({ onError }) {
  const { t } = useApp();
  const [handle, setHandle] = useState('');
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState('');
  const run = async (ban) => {
    setMsg('');
    try {
      if (ban) await api.banUser(handle.trim().toLowerCase(), reason.trim()); else await api.unbanUser(handle.trim().toLowerCase());
      setMsg(t(ban ? 'mod_banned' : 'mod_unbanned', { h: handle.trim().toLowerCase() }));
    } catch (e) { onError(e); }
  };
  return (
    <div className="card card-pad max-w-[640px]">
      <h2 className="h4">{t('mod_members_t')}</h2>
      <p className="small mt-1 mb-4">{t('mod_members_b')}</p>
      <div className="grid gap-4">
        <div className="field"><label htmlFor="m-handle">{t('handle')}</label><input id="m-handle" className="input" value={handle} onChange={(e) => setHandle(e.target.value)} autoCapitalize="none" /></div>
        <div className="field"><label htmlFor="m-reason">{t('mod_reason')}</label><input id="m-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} /></div>
        {msg && <p className="inline-ok" role="status"><IconCheckCircle />{msg}</p>}
        <div className="btnrow">
          <button type="button" className="btn btn-danger" disabled={!handle.trim() || !reason.trim()} onClick={() => run(true)}>{t('mod_ban')}</button>
          <button type="button" className="btn btn-ghost" disabled={!handle.trim()} onClick={() => run(false)}>{t('mod_unban')}</button>
        </div>
      </div>
    </div>
  );
}

export default function Mod() {
  const { t, lang } = useApp();
  const auth = useAuth();
  const community = useCommunity();
  const [q, setQ] = useState(null);
  const [state, setState] = useState('loading');
  const [tab, setTab] = useState('posts');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try { const d = await api.modQueue(); setQ(d); setState('ok'); } catch (e) {
      const c = classify(e); community.report(c); setState(isDown(c) ? 'down' : 'error'); setErr(friendly(c, t));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (auth.isAdmin) load(); }, [auth.isAdmin, load]);
  const onError = (e) => setErr(friendly(e, t));
  const act = async (fn) => { setErr(''); try { await fn(); await load(); } catch (e) { onError(e); } };

  if (!auth.user || !auth.isAdmin) {
    return (
      <div className="shell page pt-16">
        <div className="card"><EmptyState icon={IconShield} title={t('mod_only_t')} body={t('mod_only_b')}><Link to="/" className="btn btn-ghost">{t('nf_home')}</Link></EmptyState></div>
      </div>
    );
  }
  const threads = q?.threads || [], summaries = q?.summaries || [], reports = q?.reports || [];
  const tabs = [['posts', t('mod_posts'), threads.length], ['summaries', t('mod_summaries'), summaries.length], ['reports', t('mod_reports'), reports.length], ['members', t('mod_members'), q?.members ?? null]];

  return (
    <div className="shell page" style={{ maxWidth: 980 }}>
      <PageHead kicker={t('mod_kicker')} title={t('mod_title')} sub={t('mod_sub')} />
      {state === 'down' && <CalmBanner />}
      {err && <Notice kind="error" className="mb-4">{err}</Notice>}
      <div className="tabs mb-6" role="tablist" aria-label={t('mod_title')}>
        {tabs.map(([k, label, n]) => (
          <button key={k} type="button" role="tab" className="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{label}{n != null && <span className="cnt">{n}</span>}</button>
        ))}
      </div>
      {state === 'loading' && <div className="grid gap-3">{[0, 1, 2].map((i) => <div key={i} className="card qitem"><Skel w="30%" h={10} /><Skel w="60%" h={16} style={{ marginTop: 12 }} /><Skel w="90%" h={11} style={{ marginTop: 12 }} /></div>)}</div>}
      {state === 'ok' && tab === 'posts' && (threads.length ? (
        <div className="grid gap-3">
          {threads.map((th) => (
            <article key={th.id} className="card qitem" data-space={th.space}>
              <div className="qmeta">
                <span className={`badge ${th.space === 'family' ? 'badge-warm' : 'badge-accent'}`}>{t(th.space === 'family' ? 'space_family' : 'space_research')}</span>
                <span>{boardByKey(th.board) ? t(`board_${th.board}_t`) : th.board}</span>
                <span className="hdl text-muted font-semibold">@{th.author?.handle}</span><RoleBadge role={th.author?.role} />
                <span>{relTime(th.created_at, lang)}</span>
              </div>
              <h3 className="h4">{th.title}</h3>
              <p className="qbody">{th.body}</p>
              <Decide onDecide={(s, note) => act(() => api.moderateThread(th.id, s, note))} />
            </article>
          ))}
        </div>
      ) : <div className="card"><EmptyState icon={IconCheckCircle} title={t('mod_empty_t')} body={t('mod_empty_posts')} /></div>)}
      {state === 'ok' && tab === 'summaries' && (summaries.length ? (
        <div className="grid gap-3">
          {summaries.map((s) => (
            <article key={s.id} className="card qitem">
              <div className="qmeta"><span className="badge badge-blue">{t('type_shared')}</span><span>n={s.n}, {t('th_events').toLowerCase()}={s.events}</span><span>{relTime(s.created_at, lang)}</span></div>
              <h3 className="h4">{s.cohort_name}</h3>
              <pre className="code mt-3 max-h-[260px] overflow-auto" tabIndex={0}>{JSON.stringify({ country: s.country, years: [s.years_from, s.years_to], median_age: s.median_age, median_os: s.median_os, s12: s.s12, models: s.models }, null, 2)}</pre>
              <Decide onDecide={(st, note) => act(() => api.reviewSummary(s.id, st, note))} />
            </article>
          ))}
        </div>
      ) : <div className="card"><EmptyState icon={IconCheckCircle} title={t('mod_empty_t')} body={t('mod_empty_summaries')} /></div>)}
      {state === 'ok' && tab === 'reports' && (reports.length ? (
        <div className="grid gap-3">
          {reports.map((r) => (
            <article key={r.id} className="card qitem">
              <div className="qmeta"><span className="badge badge-rejected">{r.target_type}</span><span>{t('reported_by')} @{r.reporter?.handle}</span><span>{relTime(r.created_at, lang)}</span></div>
              <p className="text-[15px]">{r.reason}</p>
              <div className="qact">
                {r.target_type === 'thread' && <Link className="btn btn-soft btn-sm" to={`${spaceBase('research')}/t/${r.target_id}`}><IconExternal />{t('mod_open')}</Link>}
                {r.target_type === 'reply' && <button type="button" className="btn btn-danger btn-sm" onClick={() => act(() => api.removeReply(r.target_id, r.reason))}>{t('mod_remove_reply')}</button>}
                {r.target_type === 'thread' && <button type="button" className="btn btn-danger btn-sm" onClick={() => act(() => api.moderateThread(r.target_id, 'removed', r.reason))}>{t('mod_remove_post')}</button>}
                {!['thread', 'reply'].includes(r.target_type) && <span className="tiny mono">{r.target_id}</span>}
                <span className="flex-1" />
                <button type="button" className="btn btn-ok btn-sm" onClick={() => act(() => api.resolveReport(r.id, 'resolved'))}>{t('mod_resolve')}</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => act(() => api.resolveReport(r.id, 'dismissed'))}>{t('mod_dismiss')}</button>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="card"><EmptyState icon={IconCheckCircle} title={t('mod_empty_t')} body={t('mod_empty_reports')} /></div>)}
      {state === 'ok' && tab === 'members' && <Members onError={onError} />}
    </div>
  );
}
