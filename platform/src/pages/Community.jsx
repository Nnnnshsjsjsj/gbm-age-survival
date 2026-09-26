import { useEffect, useState } from 'react';
import { useT } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { COHORTS } from '../lib/reference.js';
import { PageHeader, NotConfigured, SignInPanel, Loading, ErrorBox } from '../components/ui.jsx';

export const TAGS = ['survival', 'glioblastoma', 'TCGA', 'CGGA', 'cBioPortal', 'Cox', 'meta-analysis', 'R', 'Python', 'lifelines', 'clinical', 'teaching'];
const ROLES = ['student', 'researcher', 'clinician', 'teacher', 'other'];

function ProfileEditor({ user, onSaved }) {
  const t = useT();
  const [p, setP] = useState({ display_name: '', handle: '', institution: '', country: '', role: 'student', tags: [], bio: '', works_with: '', is_public: true });
  const [free, setFree] = useState('');
  const [state, setState] = useState('loading');
  const [err, setErr] = useState('');
  useEffect(() => {
    let alive = true;
    api.getMyProfile(user.id).then((row) => {
      if (!alive) return;
      if (row) { setP({ ...p, ...row, tags: row.tags || [] }); setFree((row.tags || []).filter((x) => !TAGS.includes(x)).join(', ')); }
      setState('idle');
    }).catch((e) => { setErr(e.message); setState('idle'); });
    return () => { alive = false; };
  }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k, v) => setP((x) => ({ ...x, [k]: v }));
  const toggleTag = (tag) => set('tags', p.tags.includes(tag) ? p.tags.filter((x) => x !== tag) : [...p.tags, tag]);
  const save = async (e) => {
    e.preventDefault(); setState('saving'); setErr('');
    const extra = free.split(',').map((s) => s.trim()).filter(Boolean);
    const tags = [...new Set([...p.tags.filter((x) => TAGS.includes(x)), ...extra])];
    try {
      await api.upsertProfile({ id: user.id, display_name: p.display_name, handle: p.handle || null, institution: p.institution || null, country: p.country || null, role: p.role, tags, bio: p.bio || null, works_with: p.works_with || null, is_public: p.is_public, updated_at: new Date().toISOString() });
      setState('saved'); onSaved?.();
    } catch (ex) { setErr(ex.message); setState('idle'); }
  };
  if (state === 'loading') return <Loading />;
  const input = (k, label, extra = {}) => (
    <label className="grid gap-1 text-sm"><span className="lbl">{label}</span><input className="input" value={p[k] || ''} onChange={(e) => set(k, e.target.value)} {...extra} /></label>
  );
  return (
    <form onSubmit={save} className="panel grid gap-3" aria-labelledby="prof-h">
      <h2 id="prof-h">{t('com_profile')}</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {input('display_name', t('p_name'), { required: true, maxLength: 80 })}
        {input('handle', t('p_handle'), { pattern: '[a-z0-9_-]{3,32}', maxLength: 32 })}
        {input('institution', t('p_inst'), { maxLength: 120 })}
        {input('country', t('p_country'), { maxLength: 60 })}
        <label className="grid gap-1 text-sm"><span className="lbl">{t('p_role')}</span>
          <select className="select" value={p.role} onChange={(e) => set('role', e.target.value)}>{ROLES.map((r) => <option key={r} value={r}>{t(`role_${r}`)}</option>)}</select>
        </label>
      </div>
      <fieldset className="border-0 p-0 m-0">
        <legend className="lbl mb-1">{t('p_tags')}</legend>
        <div className="flex flex-wrap gap-x-4">{TAGS.map((tag) => <label key={tag} className="check text-sm"><input type="checkbox" checked={p.tags.includes(tag)} onChange={() => toggleTag(tag)} />{tag}</label>)}</div>
      </fieldset>
      <label className="grid gap-1 text-sm"><span className="lbl">{t('p_tags_free')}</span><input className="input" value={free} onChange={(e) => setFree(e.target.value)} /></label>
      <label className="grid gap-1 text-sm"><span className="lbl">{t('p_bio')}</span><textarea className="textarea" maxLength={600} value={p.bio || ''} onChange={(e) => set('bio', e.target.value)} /></label>
      <label className="grid gap-1 text-sm"><span className="lbl">{t('p_works')}</span><textarea className="textarea" maxLength={300} value={p.works_with || ''} onChange={(e) => set('works_with', e.target.value)} /></label>
      <label className="check"><input type="checkbox" checked={p.is_public} onChange={(e) => set('is_public', e.target.checked)} />{t('p_public')}</label>
      <div className="flex items-center gap-3"><button type="submit" className="btn btn-primary" disabled={state === 'saving'}>{t('p_save')}</button>{state === 'saved' && <span className="small" role="status">{t('p_saved')}</span>}</div>
      {err && <ErrorBox msg={err} />}
    </form>
  );
}

function Directory({ refreshKey }) {
  const t = useT();
  const [rows, setRows] = useState(null);
  const [tag, setTag] = useState('');
  useEffect(() => { let alive = true; api.listProfiles().then((r) => alive && setRows(r || [])).catch(() => alive && setRows([])); return () => { alive = false; }; }, [refreshKey]);
  const list = (rows || []).filter((r) => !tag || (r.tags || []).includes(tag));
  const allTags = [...new Set((rows || []).flatMap((r) => r.tags || []))];
  return (
    <section className="panel grid gap-3" aria-labelledby="dir-h">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="dir-h">{t('com_dir')}</h2>
        <label className="flex items-center gap-2 text-sm"><span>{t('com_filter')}</span>
          <select className="select w-auto" value={tag} onChange={(e) => setTag(e.target.value)}><option value="">{t('com_all')}</option>{allTags.map((x) => <option key={x} value={x}>{x}</option>)}</select>
        </label>
      </div>
      {!rows && <Loading />}
      {rows && list.length === 0 && <p className="small">{t('com_empty')}</p>}
      <ul className="list-none m-0 p-0 grid gap-2 sm:grid-cols-2">
        {list.map((r) => (
          <li key={r.id} className="panel-2 text-sm">
            <p className="font-medium">{r.display_name} {r.handle && <span className="text-muted">@{r.handle}</span>}</p>
            <p className="text-muted">{[t(`role_${r.role}`), r.institution, r.country].filter(Boolean).join(' · ')}</p>
            {r.bio && <p className="mt-1">{r.bio}</p>}
            {r.works_with && <p className="mt-1 text-muted">{r.works_with}</p>}
            {r.tags?.length > 0 && <p className="mt-1 flex flex-wrap gap-1">{r.tags.map((x) => <span key={x} className="badge badge-pass normal-case tracking-normal">{x}</span>)}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Thread({ th, user, isAdmin }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState(null);
  const [body, setBody] = useState('');
  const load = () => api.listReplies(th.id).then(setReplies).catch(() => setReplies([]));
  useEffect(() => { if (open && !replies) load(); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const post = async (e) => { e.preventDefault(); await api.createReply({ thread_id: th.id, author: user.id, body }); setBody(''); load(); };
  return (
    <li className="py-3 border-b border-line last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="font-medium text-left min-h-[44px] bg-transparent border-0 p-0 cursor-pointer text-text hover:underline" aria-expanded={open} onClick={() => setOpen(!open)}>{th.title}</button>
        {th.status === 'pending' && <span className="badge badge-warn">{t('com_pending')}</span>}
      </div>
      <p className="text-sm text-muted whitespace-pre-wrap">{th.body}</p>
      {open && (
        <div className="mt-2 pl-3 border-l-2 border-line grid gap-2">
          {!replies && <Loading />}
          {replies && replies.map((r) => (
            <div key={r.id} className="text-sm flex justify-between gap-2">
              <p className="whitespace-pre-wrap">{r.body}</p>
              {isAdmin && <button type="button" className="btn btn-sm" onClick={async () => { await api.removeReply(r.id); load(); }}>{t('adm_remove')}</button>}
            </div>
          ))}
          {th.status === 'approved' && (
            <form onSubmit={post} className="grid gap-2">
              <label className="grid gap-1 text-sm"><span className="lbl">{t('com_reply')}</span><textarea className="textarea" required maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} /></label>
              <div><button type="submit" className="btn btn-sm">{t('com_send_reply')}</button></div>
            </form>
          )}
        </div>
      )}
    </li>
  );
}

function Threads({ user, isAdmin }) {
  const t = useT();
  const [datasets, setDatasets] = useState(COHORTS.map((c) => ({ key: c.key, name: c.name })));
  const [ds, setDs] = useState(COHORTS[0].key);
  const [threads, setThreads] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { api.listApprovedSummaries().then((s) => setDatasets([...COHORTS.map((c) => ({ key: c.key, name: c.name })), ...(s || []).map((x) => ({ key: x.id, name: x.cohort_name }))])).catch(() => {}); }, []);
  const load = () => api.listThreads(ds).then(setThreads).catch((e) => { setErr(e.message); setThreads([]); });
  useEffect(() => { setThreads(null); load(); }, [ds]); // eslint-disable-line react-hooks/exhaustive-deps
  const post = async (e) => {
    e.preventDefault(); setErr('');
    try { await api.createThread({ dataset_key: ds, author: user.id, title, body }); setTitle(''); setBody(''); load(); } catch (ex) { setErr(ex.message); }
  };
  return (
    <section className="panel grid gap-3" aria-labelledby="thr-h">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="thr-h">{t('com_threads')}</h2>
        <label className="flex items-center gap-2 text-sm"><span>{t('com_dataset')}</span>
          <select className="select w-auto" value={ds} onChange={(e) => setDs(e.target.value)}>{datasets.map((d) => <option key={d.key} value={d.key}>{d.name}</option>)}</select>
        </label>
      </div>
      <p className="small">{t('com_rule')}</p>
      {!threads && <Loading />}
      {threads && threads.length === 0 && <p className="small">{t('com_none')}</p>}
      <ul className="list-none m-0 p-0">{(threads || []).map((th) => <Thread key={th.id} th={th} user={user} isAdmin={isAdmin} />)}</ul>
      <form onSubmit={post} className="grid gap-2 border-t border-line pt-3">
        <h3 className="text-base">{t('com_new')}</h3>
        <label className="grid gap-1 text-sm"><span className="lbl">{t('th_title')}</span><input className="input" required minLength={3} maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="grid gap-1 text-sm"><span className="lbl">{t('th_body')}</span><textarea className="textarea" required maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} /></label>
        <div><button type="submit" className="btn btn-primary">{t('com_post')}</button></div>
        {err && <ErrorBox msg={err} />}
      </form>
    </section>
  );
}

export default function Community() {
  const t = useT();
  const { configured, user, isAdmin, loading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="grid gap-4">
      <PageHeader title={t('com_title')} sub={t('com_sub')} />
      <p className="notice"><b>{t('nav_community')}</b><span>{t('com_rule')}</span></p>
      {!configured && <NotConfigured />}
      {configured && loading && <Loading />}
      {configured && !loading && !user && <SignInPanel />}
      {configured && user && (
        <>
          <SignInPanel />
          <ProfileEditor user={user} onSaved={() => setRefreshKey((k) => k + 1)} />
          <Directory refreshKey={refreshKey} />
          <Threads user={user} isAdmin={isAdmin} />
        </>
      )}
    </div>
  );
}
