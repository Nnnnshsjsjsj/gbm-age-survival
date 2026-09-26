// Recess-style stepped Join flow: 1 space · 2 email + password · 3 handle + profile · 4 rules.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { api, friendly, isDown, classify } from '../lib/api.js';
import { HANDLE_RE, RESEARCH_ROLES, FAMILY_ROLES, TAGS, tagKey } from '../lib/boards.js';
import { RULES } from '../lib/rules.js';
import { Modal, CalmBanner } from './ui.jsx';
import { IconBook, IconHeart, IconCheck, IconCheckCircle, IconArrowRight } from './Icons.jsx';

export function passwordScore(pw) {
  if (!pw) return 0;
  if (pw.length < 10) return 1;
  let s = 2;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(pw)).length;
  if (classes >= 3 || pw.length >= 16) s += 1;
  if ((classes >= 3 && pw.length >= 14) || pw.length >= 20) s += 1;
  return Math.min(s, 4);
}

export function PasswordStrength({ pw }) {
  const { t } = useApp();
  const s = passwordScore(pw);
  const label = [t('pw_hint'), t('pw_short'), t('pw_fair'), t('pw_good'), t('pw_strong')][s];
  return (
    <div aria-live="polite">
      <div className="strength" data-s={s} aria-hidden="true"><i /><i /><i /><i /></div>
      <p className={`hint mt-2 ${s === 1 ? 'err' : s >= 3 ? 'ok' : ''}`}>{label}</p>
    </div>
  );
}

function SpaceOption({ space, checked, onPick, icon: Icon, title, body }) {
  return (
    <div data-space={space}>
      <button type="button" role="radio" aria-checked={checked} className="spaceopt w-full" onClick={() => onPick(space)}>
        <span className="ic" aria-hidden="true"><Icon /></span>
        <span>
          <span className="h4 block">{title}</span>
          <p>{body}</p>
        </span>
      </button>
    </div>
  );
}

export default function JoinModal() {
  const { t } = useApp();
  const ui = useUI();
  const auth = useAuth();
  const nav = useNavigate();
  const open = !!ui.join;

  const [step, setStep] = useState(1);
  const [space, setSpace] = useState(null);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [handle, setHandle] = useState('');
  const [hState, setHState] = useState('idle'); // idle | invalid | checking | ok | taken | unknown
  const [role, setRole] = useState('');
  const [institution, setInstitution] = useState('');
  const [country, setCountry] = useState('');
  const [tags, setTags] = useState([]);
  const [freeTags, setFreeTags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [rulesOk, setRulesOk] = useState(false);
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [down, setDown] = useState(false);
  const [done, setDone] = useState(false);

  // (Re)initialise when the dialog opens.
  useEffect(() => {
    if (!ui.join) return;
    const metaSpace = auth.user?.user_metadata?.space;
    const s = ui.join.space || (metaSpace === 'research' || metaSpace === 'family' ? metaSpace : null);
    setSpace(s);
    setStep(auth.user ? 3 : ui.join.step || 1);
    setErr(''); setDown(false); setDone(false); setBusy(false);
  }, [ui.join]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setRole(space === 'family' ? 'caregiver' : 'student'); }, [space]);

  // Live handle availability.
  useEffect(() => {
    if (step !== 3) return undefined;
    const h = handle.trim().toLowerCase();
    if (!h) { setHState('idle'); return undefined; }
    if (!HANDLE_RE.test(h)) { setHState('invalid'); return undefined; }
    setHState('checking');
    let alive = true;
    const id = setTimeout(() => {
      api.handleAvailable(h).then((ok) => alive && setHState(ok ? 'ok' : 'taken')).catch(() => alive && setHState('unknown'));
    }, 350);
    return () => { alive = false; clearTimeout(id); };
  }, [handle, step]);

  // Move focus into each new step so keyboard and screen-reader users land on it.
  useEffect(() => {
    if (!open) return undefined;
    const id = requestAnimationFrame(() => {
      const box = document.querySelector('[data-testid^="join-step"]');
      const el = box?.querySelector('[data-autofocus]');
      const cur = document.activeElement;
      // Never steal focus from a field the person is already typing in.
      if (cur && box?.contains(cur) && /^(INPUT|TEXTAREA|SELECT)$/.test(cur.tagName)) return;
      if (el) el.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [step, done, open]);

  const close = () => ui.close();
  const fail = (e) => { const c = classify(e); if (isDown(c)) setDown(true); else setErr(friendly(c, t)); };

  const submitCredentials = async (e) => {
    e.preventDefault();
    setErr(''); setDown(false);
    if (pw.length < 10) { setErr(t('pw_short')); return; }
    setBusy(true);
    try {
      const session = await api.signUp(email.trim(), pw, space);
      auth.setSession(session);
      setStep(3);
    } catch (ex) { fail(ex); } finally { setBusy(false); }
  };

  const allTags = useMemo(() => {
    const extra = freeTags.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    return [...new Set([...tags, ...extra])].slice(0, 12);
  }, [tags, freeTags]);

  const submitProfile = async (e) => {
    e.preventDefault();
    setErr(''); setDown(false);
    const uid = auth.user?.id;
    if (!uid) { setErr(t('err_signed_out')); return; }
    setBusy(true);
    const row = {
      id: uid, handle: handle.trim().toLowerCase(), space, role_label: role,
      adult_confirmed: true, rules_accepted_at: new Date().toISOString(),
      ...(space === 'research' ? { institution: institution.trim() || null, country: country.trim() || null, tags: allTags, is_public: isPublic } : { is_public: false }),
    };
    try {
      await api.createProfile(row);
      await auth.refreshProfile();
      setDone(true);
    } catch (ex) { fail(ex); } finally { setBusy(false); }
  };

  const roles = space === 'family' ? FAMILY_ROLES : RESEARCH_ROLES;
  const titles = { 1: t('join_t1'), 2: t('join_t2'), 3: t('join_t3'), 4: t('join_t4') };
  const subs = { 1: t('join_s1'), 2: t('join_s2'), 3: t('join_s3'), 4: t('join_s4') };
  const handleHint = {
    idle: t('handle_rules'), invalid: t('handle_invalid'), checking: t('handle_checking'),
    ok: t('handle_ok'), taken: t('handle_taken'), unknown: t('handle_unknown'),
  }[hState];
  const handleReady = hState === 'ok' || hState === 'unknown';
  const toggleTag = (tag) => setTags((cur) => (cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag]));

  if (!open) return null;
  return (
    <Modal open={open} onClose={close} wide={step === 1 || step === 3} labelledBy="join-h">
      <div data-space={space === 'family' ? 'family' : 'research'} data-testid={`join-step-${done ? 'done' : step}`}>
        {done ? (
          <div className="empty" style={{ padding: '8px 0 4px' }}>
            <span className="ic" aria-hidden="true"><IconCheckCircle /></span>
            <h2 id="join-h" style={{ paddingRight: 0 }}>{t('join_done_t', { handle: handle.trim().toLowerCase() })}</h2>
            <p>{t(space === 'family' ? 'join_done_family' : 'join_done_research')}</p>
            <div className="btnrow">
              <button type="button" className="btn btn-primary" data-autofocus onClick={() => { close(); nav(space === 'family' ? '/families' : '/research'); }}>
                {t(space === 'family' ? 'join_go_family' : 'join_go_research')}<IconArrowRight />
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="kicker">{t('join_step', { n: step, of: 4 })}</p>
            <h2 id="join-h" className="mt-2">{titles[step]}</h2>
            <p className="msub">{subs[step]}</p>
            <div className="progress" aria-hidden="true">{[1, 2, 3, 4].map((i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>
            {down && <CalmBanner className="mb-4" />}

            {step === 1 && (
              <div>
                <div className="spacepick" role="radiogroup" aria-labelledby="join-h">
                  <SpaceOption space="research" checked={space === 'research'} onPick={setSpace} icon={IconBook} title={t('space_research')} body={t('join_research_body')} />
                  <SpaceOption space="family" checked={space === 'family'} onPick={setSpace} icon={IconHeart} title={t('space_family')} body={t('join_family_body')} />
                </div>
                <p className="tiny mt-4">{t('join_permanent')}</p>
                <div className="actions mt-6">
                  <button type="button" className="btn-link" onClick={() => ui.openLogin()}>{t('have_account')}</button>
                  <button type="button" className="btn btn-primary" disabled={!space} onClick={() => setStep(2)}>{t('continue')}<IconArrowRight /></button>
                </div>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={submitCredentials} noValidate={false}>
                <div className="grid gap-4">
                  <div className="field">
                    <label htmlFor="j-email">{t('email')}</label>
                    <input id="j-email" className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} data-autofocus />
                    <p className="hint">{t('email_private')}</p>
                  </div>
                  <div className="field">
                    <label htmlFor="j-pw">{t('password')}</label>
                    <input id="j-pw" className="input" type="password" required minLength={10} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} aria-describedby="j-pw-h" />
                    <div id="j-pw-h"><PasswordStrength pw={pw} /></div>
                  </div>
                </div>
                {err && <p className="inline-err mt-4" role="alert">{err}</p>}
                <div className="actions mt-6">
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>{t('back')}</button>
                  <button type="submit" className="btn btn-primary" disabled={busy || !email || pw.length < 10}>{busy ? t('working') : t('create_account')}</button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={(e) => { e.preventDefault(); if (handleReady && space) setStep(4); }}>
                <div className="grid gap-4">
                  {!space && (
                    <div className="field">
                      <span className="flabel">{t('join_which')}</span>
                      <div className="tabs" role="radiogroup" aria-label={t('join_which')}>
                        {['research', 'family'].map((s) => <button key={s} type="button" role="radio" className="tab" aria-selected={space === s} aria-checked={space === s} onClick={() => setSpace(s)}>{t(`space_${s}`)}</button>)}
                      </div>
                    </div>
                  )}
                  <div className="field">
                    <label htmlFor="j-handle">{t('handle')}</label>
                    <div className="searchbox" style={{ borderRadius: 8, paddingLeft: 14 }}>
                      <span className="text-dim font-semibold" aria-hidden="true">@</span>
                      <input id="j-handle" value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/\s/g, ''))} maxLength={24} autoComplete="off" autoCapitalize="none" spellCheck={false} aria-describedby="j-handle-h" aria-invalid={hState === 'invalid' || hState === 'taken'} data-autofocus />
                    </div>
                    <p id="j-handle-h" className={`hint ${hState === 'ok' ? 'ok' : hState === 'invalid' || hState === 'taken' ? 'err' : ''}`} aria-live="polite">{handleHint}</p>
                  </div>
                  <div className="field">
                    <label htmlFor="j-role">{t('role')}</label>
                    <select id="j-role" className="select" value={role} onChange={(e) => setRole(e.target.value)}>
                      {roles.map((r) => <option key={r} value={r}>{t(`role_${r}`)}</option>)}
                    </select>
                  </div>
                  {space === 'research' && (
                    <>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="field">
                          <label htmlFor="j-inst">{t('institution')} <span className="text-dim font-normal">{t('optional')}</span></label>
                          <input id="j-inst" className="input" maxLength={120} value={institution} onChange={(e) => setInstitution(e.target.value)} autoComplete="organization" />
                        </div>
                        <div className="field">
                          <label htmlFor="j-country">{t('country')} <span className="text-dim font-normal">{t('optional')}</span></label>
                          <input id="j-country" className="input" maxLength={60} value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country-name" />
                        </div>
                      </div>
                      <fieldset className="field border-0 p-0 m-0">
                        <legend className="flabel mb-2">{t('tags')}</legend>
                        <div className="flex flex-wrap gap-2">
                          {TAGS.map((tag) => <button key={tag} type="button" className="chip" aria-pressed={tags.includes(tag)} onClick={() => toggleTag(tag)}>{t(tagKey(tag))}</button>)}
                        </div>
                        <input className="input mt-2" aria-label={t('tags_free')} placeholder={t('tags_free')} value={freeTags} onChange={(e) => setFreeTags(e.target.value)} maxLength={200} />
                      </fieldset>
                      <label className="check"><input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /><span>{t('show_in_directory')}</span></label>
                    </>
                  )}
                </div>
                {err && <p className="inline-err mt-4" role="alert">{err}</p>}
                <div className="actions mt-6">
                  {auth.user ? <span /> : <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>{t('back')}</button>}
                  <button type="submit" className="btn btn-primary" disabled={!handleReady || !space}>{t('continue')}<IconArrowRight /></button>
                </div>
              </form>
            )}

            {step === 4 && (
              <form onSubmit={submitProfile}>
                <ol className="rules-list">
                  {RULES[space || 'research'].map((n) => (
                    <li key={n}><span className="n">{n}</span><span><b>{t(`rule_${space}_${n}_t`)}</b> {t(`rule_${space}_${n}_s`)}</span></li>
                  ))}
                </ol>
                <div className="grid gap-2 mt-6">
                  <label className="checkcard"><input type="checkbox" required checked={rulesOk} onChange={(e) => setRulesOk(e.target.checked)} data-autofocus /><span>{t('rules_read')}</span></label>
                  <label className="checkcard"><input type="checkbox" required checked={adult} onChange={(e) => setAdult(e.target.checked)} /><span>{t('adult')}</span></label>
                </div>
                {err && <p className="inline-err mt-4" role="alert">{err}</p>}
                <div className="actions mt-6">
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(3)}>{t('back')}</button>
                  <button type="submit" className="btn btn-primary" disabled={!rulesOk || !adult || busy}>{busy ? t('working') : <><IconCheck />{t('join_finish')}</>}</button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
