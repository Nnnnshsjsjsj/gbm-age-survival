import { useEffect, useMemo, useState } from 'react';
import { useT } from '../../context/AppContext.jsx';
import { useCohort } from '../../context/CohortContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { allReferenceStats } from '../../lib/reference.js';
import { metaRandomEffects } from '../../engine/index.js';
import { buildSummary, summaryToRow, downloadJson, compactJson } from '../../lib/summary.js';
import { api } from '../../lib/api.js';
import { FocusHeading, Loading, ErrorBox, NotConfigured, SignInPanel } from '../../components/ui.jsx';
import ForestPlot from '../../components/ForestPlot.jsx';
import { fmt } from '../../lib/format.js';

export default function StepCompare({ go }) {
  const t = useT();
  const cohort = useCohort();
  const { analysis, share, setShare } = cohort;
  const { configured, user } = useAuth();
  const [refs, setRefs] = useState(null);
  const [err, setErr] = useState('');
  const [ethics, setEthics] = useState(false);
  const [sendState, setSendState] = useState('idle');
  const [sendErr, setSendErr] = useState('');

  useEffect(() => {
    let alive = true;
    allReferenceStats().then((r) => alive && setRefs(r)).catch((e) => alive && setErr(t('error_load', { what: 'reference' }) + ' ' + e.message));
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const m = analysis.ageModel.model;
  const meta = useMemo(() => {
    if (!refs) return null;
    const logHR = [...refs.map((r) => r.stats.cox.beta[0]), m.beta[0]];
    const se = [...refs.map((r) => r.stats.cox.se[0]), m.se[0]];
    return metaRandomEffects(logHR, se);
  }, [refs, m]);

  const summary = useMemo(() => buildSummary(analysis, share), [analysis, share]);
  const items = refs && meta ? [
    { type: 'row', label: t('cmp_yours'), sub: `n=${analysis.n}`, hr: m.hr[0], lo: m.lo[0], hi: m.hi[0], color: 'var(--accent)', highlight: true },
    ...refs.map((r) => ({ type: 'row', label: r.name, sub: `n=${r.stats.n}`, hr: r.stats.cox.hr[0], lo: r.stats.cox.lo[0], hi: r.stats.cox.hi[0], color: 'var(--g3)' })),
    { type: 'pooled', label: t('cmp_pooled'), sub: `k=${refs.length + 1}, I²=${Math.round(meta.I2)}%`, hr: meta.HR, lo: meta.loHK, hi: meta.hiHK },
  ] : null;
  const overlaps = meta ? m.lo[0] <= meta.hiHK && m.hi[0] >= meta.loHK : null;
  const canSend = ethics && summary.cohort_name.trim().length >= 2 && analysis.n >= 10 && analysis.events >= 10;

  const send = async () => {
    setSendState('sending'); setSendErr('');
    try { await api.insertSummary(summaryToRow(summary, user.id, ethics)); setSendState('sent'); } catch (e) { setSendErr(e.message); setSendState('idle'); }
  };
  const field = (key, label, type = 'text', extra = {}) => (
    <label className="grid gap-1 text-sm">
      <span className="lbl">{label}</span>
      <input className="input" type={type} value={share[key]} onChange={(e) => setShare({ ...share, [key]: e.target.value })} {...extra} />
    </label>
  );

  return (
    <section className="grid gap-4" aria-labelledby="cmp-h">
      <div>
        <FocusHeading><span id="cmp-h">{t('cmp_title')}</span></FocusHeading>
        <p className="text-muted mt-1">{t('cmp_sub')}</p>
      </div>
      <div className="panel">
        {err && <ErrorBox msg={err} />}
        {!refs && !err && <Loading what={t('computing')} />}
        {items && (
          <>
            <ForestPlot items={items} title={t('forest_title')} />
            <p className="mt-3 text-[15px]">{t(overlaps ? 'cmp_overlap_yes' : 'cmp_overlap_no', { lo: fmt(meta.loHK), hi: fmt(meta.hiHK) })} {t('cmp_i2', { i2: Math.round(meta.I2) })}</p>
          </>
        )}
      </div>

      <div className="panel grid gap-3" aria-labelledby="share-h">
        <h3 id="share-h">{t('share_title')}</h3>
        <p className="small">{t('share_help')}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {field('cohort_name', t('share_name'), 'text', { maxLength: 120, required: true })}
          {field('country', t('share_country'), 'text', { maxLength: 60 })}
          {field('years_from', t('share_from'), 'number', { min: 1970, max: 2100, inputMode: 'numeric' })}
          {field('years_to', t('share_to'), 'number', { min: 1970, max: 2100, inputMode: 'numeric' })}
        </div>
        <div>
          <span className="lbl block mb-1">{t('share_preview')}</span>
          <pre className="code max-h-[360px] overflow-auto" tabIndex={0}>{compactJson(summary)}</pre>
        </div>
        <label className="check items-start">
          <input type="checkbox" className="mt-3" checked={ethics} onChange={(e) => setEthics(e.target.checked)} />
          <span>{t('share_ethics')}</span>
        </label>
        {configured ? (
          <div className="grid gap-3">
            {!user && <><p className="small">{t('share_need_signin')}</p><SignInPanel /></>}
            {user && <SignInPanel />}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" disabled={!user || !canSend || sendState !== 'idle'} onClick={send}>{t('share_send')}</button>
              <button type="button" className="btn" onClick={() => downloadJson(summary, 'gbm-summary.json')}>{t('download_json')}</button>
            </div>
            {sendState === 'sent' && <p className="small" role="status">{t('share_sent')}</p>}
            {sendErr && <ErrorBox msg={t('share_err', { msg: sendErr })} />}
          </div>
        ) : (
          <div className="grid gap-3">
            <NotConfigured />
            <div><button type="button" className="btn" onClick={() => downloadJson(summary, 'gbm-summary.json')}>{t('download_json')}</button></div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-between">
        <button type="button" className="btn" onClick={() => go(3)}>{t('back')}</button>
        <button type="button" className="btn" onClick={() => { cohort.reset(); go(0); }}>{t('start_over')}</button>
      </div>
    </section>
  );
}
