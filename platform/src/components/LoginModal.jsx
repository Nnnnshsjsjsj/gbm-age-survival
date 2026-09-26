import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { api, friendly, isDown, classify } from '../lib/api.js';
import { Modal, CalmBanner } from './ui.jsx';

export default function LoginModal() {
  const { t } = useApp();
  const ui = useUI();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [down, setDown] = useState(false);

  useEffect(() => { if (ui.login) { setErr(''); setDown(false); setBusy(false); } }, [ui.login]);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setDown(false); setBusy(true);
    try {
      const s = await api.signIn(email.trim(), pw);
      auth.setSession(s);
      setPw('');
      ui.close();
    } catch (ex) {
      const c = classify(ex);
      if (isDown(c)) setDown(true); else setErr(friendly(c, t));
    } finally { setBusy(false); }
  };

  return (
    <Modal open={ui.login} onClose={ui.close} title={t('login_t')} sub={t('login_s')}>
      <form onSubmit={submit} className="mt-6 grid gap-4" data-testid="login-form">
        {down && <CalmBanner />}
        <div className="field">
          <label htmlFor="l-email">{t('email')}</label>
          <input id="l-email" className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} data-autofocus />
        </div>
        <div className="field">
          <label htmlFor="l-pw">{t('password')}</label>
          <input id="l-pw" className="input" type="password" required autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <p className="hint">{t('forgot_1')} <Link to="/about#contact" onClick={ui.close}>{t('forgot_2')}</Link></p>
        </div>
        {err && <p className="inline-err" role="alert">{err}</p>}
        <div className="actions mt-2">
          <button type="button" className="btn-link" onClick={() => ui.openJoin()}>{t('no_account')}</button>
          <button type="submit" className="btn btn-primary" disabled={busy || !email || !pw}>{busy ? t('working') : t('log_in')}</button>
        </div>
      </form>
    </Modal>
  );
}
