import { useEffect, useRef, useState } from 'react';
import { useT } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

export function Banner() {
  const t = useT();
  return (
    <div className="notice mb-5" role="note">
      <b>{t('banner_tag')}</b>
      <p>{t('banner')}</p>
    </div>
  );
}

export function PageHeader({ title, sub, children }) {
  return (
    <header className="mb-5">
      <h1>{title}</h1>
      {sub && <p className="text-muted mt-1 max-w-[66ch]">{sub}</p>}
      {children}
    </header>
  );
}

export function Tile({ k, v, ci }) {
  return (
    <div className="tile">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
      {ci && <div className="ci">{ci}</div>}
    </div>
  );
}

export function NotConfigured() {
  const t = useT();
  return (
    <div className="panel" role="status">
      <h2 className="mb-2">{t('not_configured_title')}</h2>
      <p className="text-muted max-w-[70ch]">{t('not_configured_body')}</p>
    </div>
  );
}

export function StatusBadge({ status }) {
  const t = useT();
  const label = { pass: t('pass'), warn: t('warn'), fail: t('fail') }[status];
  const glyph = { pass: '✓', warn: '!', fail: '✕' }[status];
  return <span className={`badge badge-${status}`}><span aria-hidden="true">{glyph}</span>{label}</span>;
}

export function Loading({ what }) {
  const t = useT();
  return <p className="text-muted" role="status">{what || t('loading')}</p>;
}

export function ErrorBox({ msg }) {
  return <div className="notice" role="alert" style={{ background: 'var(--fail-bg)', borderColor: 'var(--fail-line)' }}><p>{msg}</p></div>;
}

export function CopyButton({ text }) {
  const t = useT();
  const [done, setDone] = useState(false);
  useEffect(() => { if (!done) return undefined; const id = setTimeout(() => setDone(false), 1500); return () => clearTimeout(id); }, [done]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); } catch { /* clipboard blocked */ }
  };
  return <button type="button" className="btn btn-sm" onClick={copy} aria-live="polite">{done ? t('copied') : t('copy')}</button>;
}

/** Heading that receives focus when mounted (used for wizard steps). */
export function FocusHeading({ children, as: Tag = 'h2', className = '' }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus({ preventScroll: false }); }, []);
  return <Tag ref={ref} tabIndex={-1} className={`outline-none ${className}`}>{children}</Tag>;
}

export function SignInPanel() {
  const t = useT();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle');
  const [err, setErr] = useState('');
  if (user) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-muted text-sm">{t('signed_in_as', { email: user.email })}</span>
        <button type="button" className="btn btn-sm" onClick={() => api.signOut()}>{t('sign_out')}</button>
      </div>
    );
  }
  const submit = async (e) => {
    e.preventDefault();
    setState('sending'); setErr('');
    try { await api.signInWithEmail(email.trim()); setState('sent'); } catch (ex) { setErr(ex.message); setState('idle'); }
  };
  return (
    <form onSubmit={submit} className="panel grid gap-3 max-w-md">
      <h2>{t('sign_in')}</h2>
      <p className="small">{t('sign_in_help')}</p>
      <label className="grid gap-1">
        <span className="lbl">{t('email')}</span>
        <input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <button type="submit" className="btn btn-primary" disabled={state !== 'idle'}>{t('send_link')}</button>
      {state === 'sent' && <p className="small" role="status">{t('link_sent')}</p>}
      {err && <ErrorBox msg={err} />}
    </form>
  );
}
