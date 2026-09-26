import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../context/AppContext.jsx';
import { IconX, IconInfo, IconCheck, IconAlert, IconCopy, IconLock } from './Icons.jsx';

/* ---------------------------------------------------------------- Modal
   Focus is trapped inside, Escape closes, focus returns to the element that opened it. */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, sub, children, wide = false, sheet = false, labelledBy, initialFocus }) {
  const t = useT();
  const ref = useRef(null);
  const returnTo = useRef(null);
  const id = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    returnTo.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const node = ref.current;
    const first = (initialFocus && node.querySelector(initialFocus)) || node.querySelector('[data-autofocus]') || node.querySelector(FOCUSABLE) || node;
    requestAnimationFrame(() => { const cur = document.activeElement; if (!(cur && node.contains(cur) && cur !== node)) first.focus({ preventScroll: true }); });
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onCloseRef.current(); return; }
      if (e.key !== 'Tab') return;
      const items = [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) { e.preventDefault(); return; }
      const a = items[0], z = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === a || !node.contains(document.activeElement))) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      const back = returnTo.current;
      if (back && typeof back.focus === 'function' && document.contains(back)) back.focus({ preventScroll: true });
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;
  return createPortal(
    <div className={`scrim${sheet ? ' sheet' : ''}`} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className={`modal${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy || (title ? `${id}-t` : undefined)} tabIndex={-1}>
        {sheet ? <div className="grab" aria-hidden="true" /> : (
          <button type="button" className="iconbtn modal-x" onClick={onClose} aria-label={t('close')}><IconX /></button>
        )}
        {title && <h2 id={`${id}-t`}>{title}</h2>}
        {sub && <p className="msub">{sub}</p>}
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* ---------------------------------------------------------------- layout bits */
export function PageHead({ kicker, title, sub, children, className = '' }) {
  return (
    <header className={`pagehead ${className}`}>
      {kicker && <div className="kicker">{kicker}</div>}
      <h1 className="h1">{title}</h1>
      {sub && <p className="sub">{sub}</p>}
      {children}
    </header>
  );
}

export function SectionHead({ kicker, title, sub, id }) {
  return (
    <div className="section-head">
      {kicker && <div className="kicker">{kicker}</div>}
      <h2 className="h2" id={id}>{title}</h2>
      {sub && <p className="sub">{sub}</p>}
    </div>
  );
}

export function Tile({ k, v, ci, loading }) {
  return (
    <div className="tile">
      <div className="k">{k}</div>
      {loading ? <><span className="skel skel-line" style={{ width: '60%', height: 22, marginTop: 8 }} /><span className="skel skel-line" style={{ width: '40%', height: 10, marginTop: 6 }} /></> : (
        <>
          <div className="v">{v}</div>
          {ci ? <div className="ci">{ci}</div> : <div className="ci" aria-hidden="true">&nbsp;</div>}
        </>
      )}
    </div>
  );
}

/** Slim research-use notice shown above science results. */
export function UseNotice() {
  const t = useT();
  return (
    <div className="banner" role="note">
      <IconInfo />
      <p><b>{t('banner_tag')}</b> {t('banner')}</p>
    </div>
  );
}

/** Calm fallback when accounts are not available yet. */
export function CalmBanner({ className = '' }) {
  const t = useT();
  return (
    <div className={`banner banner-accent ${className}`} role="status" data-testid="calm-banner">
      <span className="pulse" aria-hidden="true" />
      <p><b>{t('calm_title')}</b> {t('calm_body')}</p>
    </div>
  );
}

export function Notice({ kind = 'info', children, className = '' }) {
  const Icon = kind === 'ok' ? IconCheck : kind === 'info' ? IconInfo : kind === 'lock' ? IconLock : IconAlert;
  const cls = kind === 'warn' ? 'banner-warn' : kind === 'error' ? 'banner-error' : kind === 'ok' || kind === 'accent' ? 'banner-accent' : '';
  return <div className={`banner ${cls} ${className}`} role={kind === 'error' ? 'alert' : 'status'}><Icon /><div>{children}</div></div>;
}

export function EmptyState({ icon: Icon, title, body, children }) {
  return (
    <div className="empty">
      {Icon && <span className="ic" aria-hidden="true"><Icon /></span>}
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {children && <div className="btnrow">{children}</div>}
    </div>
  );
}

export function Skel({ w = '100%', h = 12, r, className = '', style }) {
  return <span className={`skel ${className}`} style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden="true" />;
}

export function StatusBadge({ status }) {
  const t = useT();
  const label = { pass: t('pass'), warn: t('warn'), fail: t('fail') }[status];
  return <span className={`badge badge-${status}`}>{status === 'pass' ? <IconCheck /> : <IconAlert />}{label}</span>;
}

export function CopyButton({ text }) {
  const t = useT();
  const [done, setDone] = useState(false);
  useEffect(() => { if (!done) return undefined; const id = setTimeout(() => setDone(false), 1500); return () => clearTimeout(id); }, [done]);
  const copy = async () => { try { await navigator.clipboard.writeText(text); setDone(true); } catch { /* clipboard blocked */ } };
  return <button type="button" className="btn btn-soft btn-sm" onClick={copy} aria-live="polite">{done ? <IconCheck /> : <IconCopy />}{done ? t('copied') : t('copy')}</button>;
}

/** Heading that receives focus when mounted (wizard steps). */
export function FocusHeading({ children, as: Tag = 'h2', className = '', id }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, []);
  return <Tag ref={ref} id={id} tabIndex={-1} className={`outline-none ${className}`}>{children}</Tag>;
}

export function Counter({ value, max, min = 0 }) {
  const n = value.length;
  return <span className={`counter${n > max || (n > 0 && n < min) ? ' over' : ''}`} aria-live="off">{n} / {max}</span>;
}

/** A control that looks disabled and explains why on hover/focus. */
export function Tip({ text, children, left = false }) {
  const id = useId();
  return (
    <span className={`tip${left ? ' left' : ''}`}>
      {typeof children === 'function' ? children(`${id}-tip`) : children}
      <span className="tiptext" role="tooltip" id={`${id}-tip`}>{text}</span>
    </span>
  );
}

export function RoleBadge({ role }) {
  const t = useT();
  if (!role) return null;
  return <span className="role">{t(`role_${role}`)}</span>;
}
