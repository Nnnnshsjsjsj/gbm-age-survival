import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCommunity } from '../context/CommunityContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { api, friendly, isDown, classify } from '../lib/api.js';
import { boardByKey, spaceBase } from '../lib/boards.js';
import { relTime, fullTime } from '../lib/time.js';
import { Linkified } from '../lib/text.jsx';
import { useWriteAccess, UsefulButton } from '../components/Forum.jsx';
import { Modal, CalmBanner, EmptyState, Skel, RoleBadge, Counter } from '../components/ui.jsx';
import { IconChevronRight, IconFlag, IconTrash, IconClock, IconMessage, IconCheckCircle, IconInbox, IconLock, IconArrowLeft } from '../components/Icons.jsx';

function ReportModal({ target, onClose }) {
  const { t } = useApp();
  const auth = useAuth();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { if (target) { setReason(''); setDone(false); setErr(''); } }, [target]);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await api.report({ target_type: target.type, target_id: target.id, reason: reason.trim() }, auth.user.id); setDone(true); } catch (ex) { setErr(friendly(ex, t)); } finally { setBusy(false); }
  };
  return (
    <Modal open={!!target} onClose={onClose} title={t(target?.type === 'reply' ? 'report_reply_t' : 'report_t')} sub={t('report_s')}>
      {done ? (
        <div className="mt-6 grid gap-4">
          <p className="inline-ok" role="status"><IconCheckCircle />{t('report_done')}</p>
          <div className="actions"><span /><button type="button" className="btn btn-primary" onClick={onClose} data-autofocus>{t('close')}</button></div>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <div className="field">
            <div className="flex justify-between items-baseline gap-2"><label htmlFor="rp-reason">{t('report_reason')}</label><Counter value={reason} max={500} min={3} /></div>
            <textarea id="rp-reason" className="textarea" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={520} required data-autofocus />
          </div>
          {err && <p className="inline-err" role="alert">{err}</p>}
          <div className="actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={busy || reason.trim().length < 3 || reason.length > 500}>{t('report_send')}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function ThreadSkeleton() {
  return (
    <div aria-busy="true">
      <Skel w={180} h={12} />
      <Skel w="70%" h={30} style={{ marginTop: 24 }} />
      <div className="flex gap-3 mt-4"><Skel w={28} h={28} r={14} /><Skel w={160} h={12} style={{ marginTop: 8 }} /></div>
      {[96, 92, 88, 60].map((w, i) => <Skel key={i} w={`${w}%`} h={13} style={{ marginTop: i ? 10 : 28 }} />)}
    </div>
  );
}

export default function ThreadPage({ space }) {
  const { t, lang } = useApp();
  const { id } = useParams();
  const auth = useAuth();
  const community = useCommunity();
  const ui = useUI();
  const access = useWriteAccess(space);
  const base = spaceBase(space);
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sentOk, setSentOk] = useState(false);
  const [report, setReport] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setState('loading');
    try {
      const d = await api.thread(id);
      if (!d) { setState('notfound'); return; }
      setData(d); setState('ok');
    } catch (e) {
      const c = classify(e);
      community.report(c);
      setState(isDown(c) ? 'down' : /invalid input syntax/i.test(c.message) ? 'notfound' : 'error');
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load, auth.user?.id]);

  if (state === 'ok' && data.space && data.space !== space) return <Navigate to={`${spaceBase(data.space)}/t/${id}`} replace />;

  const board = data ? boardByKey(data.board) : null;
  const pending = data && data.status !== 'approved';
  const sendReply = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(''); setSentOk(false);
    try {
      await api.createReply(id, reply.trim(), auth.user.id);
      setReply(''); setSentOk(true);
      await load(true);
    } catch (ex) { const c = classify(ex); community.report(c); setErr(friendly(c, t)); } finally { setBusy(false); }
  };
  const delReply = async (rid) => {
    try { await api.deleteReply(rid); setConfirmDel(null); await load(true); } catch (ex) { setErr(friendly(ex, t)); }
  };
  const replyBlock = () => {
    if (pending) return <p className="small flex gap-2 items-start"><IconClock width={18} height={18} className="flex-none mt-[1px]" />{t('reply_pending')}</p>;
    if (!access.ok) {
      return (
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <p className="small flex gap-2 items-start"><IconLock width={18} height={18} className="flex-none mt-[1px]" />{access.reason}</p>
          {!auth.user && <div className="btnrow"><button type="button" className="btn btn-ghost btn-sm" onClick={ui.openLogin}>{t('log_in')}</button><button type="button" className="btn btn-primary btn-sm" onClick={() => ui.openJoin({ space })}>{t('join')}</button></div>}
          {auth.user && access.action && <button type="button" className="btn btn-primary btn-sm" onClick={access.action}>{t('finish_setup')}</button>}
        </div>
      );
    }
    return (
      <form onSubmit={sendReply} className="grid gap-3">
        <div className="flex justify-between items-baseline gap-2"><label htmlFor="reply-body" className="font-semibold text-[14px]">{t('your_reply')}</label><Counter value={reply} max={3000} /></div>
        <textarea id="reply-body" className="textarea" rows={4} value={reply} onChange={(e) => setReply(e.target.value)} maxLength={3200} />
        {err && <p className="inline-err" role="alert">{err}</p>}
        {sentOk && <p className="inline-ok" role="status"><IconCheckCircle />{t('reply_sent')}</p>}
        <div className="actions">
          <p className="tiny">{t('reply_note')}</p>
          <div className="right"><button type="submit" className="btn btn-primary" disabled={busy || !reply.trim() || reply.length > 3000}>{busy ? t('working') : t('send_reply')}</button></div>
        </div>
      </form>
    );
  };

  return (
    <div className="shell page" data-space={space}>
      <div className="tview pt-8">
        <nav className="crumbs" aria-label={t('breadcrumbs')}>
          <Link to={base}>{t(space === 'family' ? 'nav_families' : 'nav_research')}</Link>
          {board && <><IconChevronRight aria-hidden="true" /><Link to={`${base}/${board.key}`}>{t(`board_${board.key}_t`)}</Link></>}
        </nav>

        {state === 'loading' && <ThreadSkeleton />}
        {state === 'down' && <><CalmBanner /><div className="card mt-4"><EmptyState icon={IconMessage} title={t('thread_down_t')} body={t('thread_down_b')}><Link to={base} className="btn btn-ghost"><IconArrowLeft />{t('back_to_feed')}</Link></EmptyState></div></>}
        {(state === 'notfound' || state === 'error') && <div className="card"><EmptyState icon={IconInbox} title={t('thread_nf_t')} body={t('thread_nf_b')}><Link to={base} className="btn btn-primary"><IconArrowLeft />{t('back_to_feed')}</Link></EmptyState></div>}

        {state === 'ok' && data && (
          <>
            <article>
              {data.status !== 'approved' && (
                <div className={`banner mb-4 ${data.status === 'pending' ? 'banner-warn' : 'banner-error'}`} role="status">
                  <IconClock />
                  <p><b>{t(data.status === 'pending' ? 'waiting_review' : data.status === 'removed' ? 'status_removed' : 'status_rejected')}.</b> {data.status === 'pending' ? t('pending_explain') : data.mod_note ? `${t('mod_note')}: ${data.mod_note}` : t('rejected_explain')}</p>
                </div>
              )}
              <h1 className="h2">{data.title}</h1>
              <div className="meta mt-4">
                <span className="avatar" aria-hidden="true">{(data.author?.handle || 'm').slice(0, 1)}</span>
                <span className="hdl">@{data.author?.handle || 'member'}</span>
                <RoleBadge role={data.author?.role} />
                <span className="sep" aria-hidden="true" />
                <time dateTime={data.created_at} title={fullTime(data.created_at, lang)}>{relTime(data.created_at, lang)}</time>
              </div>
              <div className="op"><Linkified text={data.body} /></div>
              <div className="flex flex-wrap items-center gap-3 mt-6 pb-6 border-b border-line">
                <UsefulButton row item={{ ...data, status: data.status }} space={space} onChange={(p) => setData((d) => ({ ...d, ...p }))} />
                {auth.user && !data.mine && <button type="button" className="btn btn-soft btn-sm" onClick={() => setReport({ type: 'thread', id: data.id })}><IconFlag />{t('report')}</button>}
              </div>
            </article>

            <section aria-labelledby="replies-h" className="mt-8">
              <h2 id="replies-h" className="h4">{t('n_replies', { n: data.replies?.length || 0 })}</h2>
              {data.replies?.length ? (
                <div className="mt-2">
                  {data.replies.map((r) => (
                    <div key={r.id} className="reply" id={`r-${r.id}`}>
                      <div className="meta mt-0">
                        <span className="hdl">@{r.author?.handle || 'member'}</span>
                        <RoleBadge role={r.author?.role} />
                        <span className="sep" aria-hidden="true" />
                        <time dateTime={r.created_at} title={fullTime(r.created_at, lang)}>{relTime(r.created_at, lang)}</time>
                        {r.removed && <span className="badge badge-rejected">{t('status_removed')}</span>}
                        <span className="ml-auto flex gap-1">
                          {r.mine && (confirmDel === r.id ? (
                            <>
                              <button type="button" className="btn btn-danger btn-sm" onClick={() => delReply(r.id)}>{t('confirm_delete')}</button>
                              <button type="button" className="btn btn-soft btn-sm" onClick={() => setConfirmDel(null)}>{t('cancel')}</button>
                            </>
                          ) : <button type="button" className="btn btn-soft btn-sm" onClick={() => setConfirmDel(r.id)} aria-label={t('delete_reply')}><IconTrash />{t('delete')}</button>)}
                          {auth.user && !r.mine && <button type="button" className="btn btn-soft btn-sm" onClick={() => setReport({ type: 'reply', id: r.id })} aria-label={t('report_reply_t')}><IconFlag /></button>}
                        </span>
                      </div>
                      <p className="body"><Linkified text={r.body} /></p>
                    </div>
                  ))}
                </div>
              ) : <p className="small mt-2">{t(pending ? 'no_replies_pending' : 'no_replies')}</p>}
            </section>

            <section className="card card-pad mt-6" aria-label={t('your_reply')}>{replyBlock()}</section>
          </>
        )}
      </div>
      <ReportModal target={report} onClose={() => setReport(null)} />
    </div>
  );
}
