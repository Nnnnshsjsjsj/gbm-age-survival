import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { useCommunity } from '../context/CommunityContext.jsx';
import { api, friendly } from '../lib/api.js';
import { RESEARCH_ROLES, FAMILY_ROLES, TAGS, spaceBase, boardByKey, tagKey } from '../lib/boards.js';
import { relTime } from '../lib/time.js';
import { PageHead, EmptyState, CalmBanner, Skel } from '../components/ui.jsx';
import { PasswordStrength } from '../components/JoinModal.jsx';
import { IconUser, IconCheckCircle, IconLogOut, IconClock, IconTrash } from '../components/Icons.jsx';

function Sec({ id, title, sub, children }) {
  return (
    <section className="card card-pad" aria-labelledby={id}>
      <h2 id={id} className="h3">{title}</h2>
      {sub && <p className="small mt-1">{sub}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Saved({ show, text }) {
  return show ? <p className="inline-ok" role="status"><IconCheckCircle />{text}</p> : null;
}

function ProfileForm() {
  const { t } = useApp();
  const auth = useAuth();
  const p = auth.profile;
  const [f, setF] = useState(() => ({ display_name: p.display_name || '', role_label: p.role_label, institution: p.institution || '', country: p.country || '', bio: p.bio || '', works_with: p.works_with || '', tags: p.tags || [], is_public: p.is_public }));
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => { setF((x) => ({ ...x, [k]: v })); setOk(false); };
  const research = p.space === 'research';
  const roles = research ? RESEARCH_ROLES : FAMILY_ROLES;
  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(''); setOk(false);
    const patch = { display_name: f.display_name.trim() || null, role_label: f.role_label, bio: f.bio.trim() || null,
      ...(research ? { institution: f.institution.trim() || null, country: f.country.trim() || null, works_with: f.works_with.trim() || null, tags: f.tags, is_public: f.is_public } : {}) };
    try { await api.updateProfile(p.id, patch); await auth.refreshProfile(); setOk(true); } catch (ex) { setErr(friendly(ex, t)); } finally { setBusy(false); }
  };
  const input = (k, label, extra = {}) => (
    <div className="field"><label htmlFor={`a-${k}`}>{label}</label><input id={`a-${k}`} className="input" value={f[k]} onChange={(e) => set(k, e.target.value)} {...extra} /></div>
  );
  return (
    <form onSubmit={save} className="grid gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {input('display_name', t('display_name'), { maxLength: 60 })}
        <div className="field">
          <label htmlFor="a-role">{t('role')}</label>
          <select id="a-role" className="select" value={f.role_label} onChange={(e) => set('role_label', e.target.value)}>{roles.map((r) => <option key={r} value={r}>{t(`role_${r}`)}</option>)}</select>
        </div>
        {research && input('institution', t('institution'), { maxLength: 120 })}
        {research && input('country', t('country'), { maxLength: 60 })}
      </div>
      {research && input('works_with', t('works_with'), { maxLength: 300 })}
      <div className="field"><label htmlFor="a-bio">{t('bio')}</label><textarea id="a-bio" className="textarea" rows={3} maxLength={600} value={f.bio} onChange={(e) => set('bio', e.target.value)} /></div>
      {research && (
        <fieldset className="field border-0 p-0 m-0">
          <legend className="flabel mb-2">{t('tags')}</legend>
          <div className="flex flex-wrap gap-2">
            {[...new Set([...TAGS, ...f.tags])].map((tag) => {
              const k = tagKey(tag); const lbl = t(k) === k ? tag : t(k);
              return <button key={tag} type="button" className="chip" aria-pressed={f.tags.includes(tag)} onClick={() => set('tags', f.tags.includes(tag) ? f.tags.filter((x) => x !== tag) : [...f.tags, tag].slice(0, 12))}>{lbl}</button>;
            })}
          </div>
        </fieldset>
      )}
      {research && <label className="check"><input type="checkbox" checked={f.is_public} onChange={(e) => set('is_public', e.target.checked)} /><span>{t('show_in_directory')}</span></label>}
      {err && <p className="inline-err" role="alert">{err}</p>}
      <div className="actions"><Saved show={ok} text={t('saved')} /><div className="right"><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? t('working') : t('save')}</button></div></div>
    </form>
  );
}

function PasswordForm() {
  const { t } = useApp();
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(''); setOk(false);
    try { await api.updatePassword(pw); setPw(''); setOk(true); } catch (ex) { setErr(friendly(ex, t)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="field">
        <label htmlFor="a-pw">{t('new_password')}</label>
        <input id="a-pw" className="input" type="password" autoComplete="new-password" minLength={10} value={pw} onChange={(e) => { setPw(e.target.value); setOk(false); }} />
        <PasswordStrength pw={pw} />
      </div>
      {err && <p className="inline-err" role="alert">{err}</p>}
      <div className="actions"><Saved show={ok} text={t('pw_changed')} /><div className="right"><button type="submit" className="btn btn-ghost" disabled={busy || pw.length < 10}>{t('change_password')}</button></div></div>
    </form>
  );
}

function DeleteAccount() {
  const { t } = useApp();
  const nav = useNavigate();
  const [txt, setTxt] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const word = t('delete_word');
  const del = async () => {
    setBusy(true); setErr('');
    try { await api.deleteMyAccount(); nav('/'); window.location.reload(); } catch (ex) { setErr(friendly(ex, t)); setBusy(false); }
  };
  return (
    <div className="grid gap-4">
      <p className="small max-w-[62ch]">{t('delete_explain')}</p>
      <div className="field max-w-[360px]">
        <label htmlFor="a-del">{t('delete_type', { word })}</label>
        <input id="a-del" className="input" value={txt} onChange={(e) => setTxt(e.target.value)} autoComplete="off" autoCapitalize="none" />
      </div>
      {err && <p className="inline-err" role="alert">{err}</p>}
      <div><button type="button" className="btn btn-danger" disabled={busy || txt.trim().toLowerCase() !== word} onClick={del}><IconTrash />{t('delete_account')}</button></div>
    </div>
  );
}

function MyPosts() {
  const { t, lang } = useApp();
  const auth = useAuth();
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { api.myThreads(auth.user.id).then((r) => setRows(r || [])).catch(() => setFailed(true)); }, [auth.user.id]);
  if (failed) return <p className="small">{t('my_posts_error')}</p>;
  if (!rows) return <div className="grid gap-3">{[0, 1].map((i) => <Skel key={i} h={48} r={8} />)}</div>;
  if (!rows.length) return <p className="small">{t('my_posts_none')}</p>;
  const base = spaceBase(auth.profile?.space);
  return (
    <ul className="list-none m-0 p-0">
      {rows.map((r) => (
        <li key={r.id} className="py-4 border-b border-line last:border-b-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge ${r.status === 'approved' ? 'badge-ok' : r.status === 'pending' ? 'badge-pending' : 'badge-rejected'}`}>{r.status === 'pending' && <IconClock />}{t(`status_${r.status}`)}</span>
            <span className="tiny">{boardByKey(r.board_key) ? t(`board_${r.board_key}_t`) : r.board_key} · {relTime(r.created_at, lang)}</span>
          </div>
          <Link to={`${base}/t/${r.id}`} className="font-semibold text-ink no-underline hover:underline block mt-2">{r.title}</Link>
          {r.mod_note && r.status !== 'approved' && <p className="small mt-2 p-3 rounded-[8px] bg-tint"><b className="text-ink">{t('mod_note')}:</b> {r.mod_note}</p>}
        </li>
      ))}
    </ul>
  );
}

export default function Account() {
  const { t } = useApp();
  const auth = useAuth();
  const ui = useUI();
  const community = useCommunity();

  if (!auth.ready || auth.profileState === 'loading') {
    return <div className="shell-narrow page pt-16" aria-busy="true"><Skel w={200} h={36} /><Skel h={240} r={12} style={{ marginTop: 32 }} /></div>;
  }
  if (!auth.user) {
    return (
      <div className="shell-narrow page pt-16">
        {community.down && <CalmBanner className="mb-4" />}
        <div className="card"><EmptyState icon={IconUser} title={t('acct_signed_out_t')} body={t('acct_signed_out_b')}>
          <button type="button" className="btn btn-primary" onClick={ui.openLogin}>{t('log_in')}</button>
          <button type="button" className="btn btn-ghost" onClick={() => ui.openJoin()}>{t('join')}</button>
        </EmptyState></div>
      </div>
    );
  }
  const p = auth.profile;
  return (
    <div className="shell-narrow page" data-space={p?.space === 'family' ? 'family' : 'research'}>
      <PageHead kicker={p ? t(p.space === 'family' ? 'space_family' : 'space_research') : t('acct_kicker')} title={p ? `@${p.handle}` : t('acct_title')} sub={t('acct_sub', { email: auth.user.email })} />
      <div className="grid gap-4">
        {!p && (
          <div className="card"><EmptyState icon={IconUser} title={t('acct_no_profile_t')} body={t('acct_no_profile_b')}><button type="button" className="btn btn-primary" onClick={() => ui.openJoin({ step: 3 })}>{t('finish_setup')}</button></EmptyState></div>
        )}
        {p && <Sec id="acct-profile" title={t('acct_profile')} sub={t('acct_profile_sub')}><ProfileForm /></Sec>}
        {p && <Sec id="acct-posts" title={t('acct_posts')} sub={t('acct_posts_sub')}><MyPosts /></Sec>}
        <Sec id="acct-pw" title={t('acct_password')}><PasswordForm /></Sec>
        <Sec id="acct-session" title={t('acct_session')}>
          <button type="button" className="btn btn-ghost" onClick={auth.signOut}><IconLogOut />{t('sign_out')}</button>
        </Sec>
        <Sec id="acct-del" title={t('acct_delete')}><DeleteAccount /></Sec>
      </div>
    </div>
  );
}
