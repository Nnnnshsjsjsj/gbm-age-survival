import { useEffect, useState } from 'react';
import { useT } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { PageHeader, NotConfigured, SignInPanel, Loading, ErrorBox } from '../components/ui.jsx';
import { fmt } from '../lib/format.js';

function SummaryCard({ s, onDone }) {
  const t = useT();
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const act = async (status) => { setErr(''); try { await api.reviewSummary(s.id, status, note); onDone(); } catch (e) { setErr(e.message); } };
  const age = (s.models || []).find((m) => m.covariates?.[0] === 'age');
  return (
    <li className="panel-2 grid gap-2 text-sm">
      <p className="font-medium">{s.cohort_name} <span className="text-muted">· {[s.country, s.years_from && `${s.years_from}–${s.years_to}`].filter(Boolean).join(', ')}</span></p>
      <p className="num">n={s.n}, events={s.events}, median age {s.median_age}, median OS {s.median_os}{age ? `, HR/year ${fmt(Math.exp(age.beta[0]))}` : ''}</p>
      <details><summary className="cursor-pointer min-h-[44px] flex items-center">JSON</summary><pre className="code">{JSON.stringify(s, null, 2)}</pre></details>
      <label className="grid gap-1"><span className="lbl">{t('adm_note')}</span><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></label>
      <div className="flex gap-2 flex-wrap">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => act('approved')}>{t('adm_approve')}</button>
        <button type="button" className="btn btn-sm" onClick={() => act('rejected')}>{t('adm_reject')}</button>
      </div>
      {err && <ErrorBox msg={err} />}
    </li>
  );
}

function Queue() {
  const t = useT();
  const [sums, setSums] = useState(null);
  const [threads, setThreads] = useState(null);
  const [replies, setReplies] = useState(null);
  const load = () => {
    api.listPendingSummaries().then(setSums).catch(() => setSums([]));
    api.listPendingThreads().then(setThreads).catch(() => setThreads([]));
    api.listRecentReplies().then(setReplies).catch(() => setReplies([]));
  };
  useEffect(load, []);
  return (
    <div className="grid gap-4">
      <section className="panel grid gap-3" aria-labelledby="q1"><h2 id="q1">{t('adm_summaries')}</h2>
        {!sums && <Loading />}{sums && sums.length === 0 && <p className="small">{t('adm_empty')}</p>}
        <ul className="list-none m-0 p-0 grid gap-2">{(sums || []).map((s) => <SummaryCard key={s.id} s={s} onDone={load} />)}</ul>
      </section>
      <section className="panel grid gap-3" aria-labelledby="q2"><h2 id="q2">{t('adm_threads')}</h2>
        {!threads && <Loading />}{threads && threads.length === 0 && <p className="small">{t('adm_empty')}</p>}
        <ul className="list-none m-0 p-0 grid gap-2">{(threads || []).map((th) => (
          <li key={th.id} className="panel-2 text-sm grid gap-2">
            <p className="font-medium">{th.title} <span className="text-muted">· {th.dataset_key}</span></p>
            <p className="whitespace-pre-wrap">{th.body}</p>
            <div className="flex gap-2"><button type="button" className="btn btn-primary btn-sm" onClick={async () => { await api.moderateThread(th.id, 'approved'); load(); }}>{t('adm_approve')}</button><button type="button" className="btn btn-sm" onClick={async () => { await api.moderateThread(th.id, 'removed'); load(); }}>{t('adm_remove')}</button></div>
          </li>
        ))}</ul>
      </section>
      <section className="panel grid gap-3" aria-labelledby="q3"><h2 id="q3">{t('adm_replies')}</h2>
        {!replies && <Loading />}{replies && replies.length === 0 && <p className="small">{t('adm_empty')}</p>}
        <ul className="list-none m-0 p-0 grid gap-2">{(replies || []).map((r) => (
          <li key={r.id} className="panel-2 text-sm flex justify-between gap-2"><p className="whitespace-pre-wrap">{r.body}</p><button type="button" className="btn btn-sm" onClick={async () => { await api.removeReply(r.id); load(); }}>{t('adm_remove')}</button></li>
        ))}</ul>
      </section>
    </div>
  );
}

export default function Admin() {
  const t = useT();
  const { configured, user, isAdmin, loading } = useAuth();
  return (
    <div className="grid gap-4">
      <PageHeader title={t('adm_title')} sub={t('adm_sub')} />
      {!configured && <NotConfigured />}
      {configured && loading && <Loading />}
      {configured && !loading && !user && <SignInPanel />}
      {configured && user && !isAdmin && <><SignInPanel /><p className="notice"><span>{t('adm_not_admin')}</span></p></>}
      {configured && user && isAdmin && <><SignInPanel /><Queue /></>}
    </div>
  );
}
