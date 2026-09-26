import { useEffect, useMemo, useState } from 'react';
import { useT } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { allReferenceStats, loadPublished } from '../lib/reference.js';
import { metaRandomEffects } from '../engine/index.js';
import { api } from '../lib/api.js';
import { ageEstimateFromSummary } from '../lib/summary.js';
import { PageHeader, Tile, Loading, ErrorBox } from '../components/ui.jsx';
import ForestPlot from '../components/ForestPlot.jsx';
import { fmt } from '../lib/format.js';

export default function Pool() {
  const t = useT();
  const { configured } = useAuth();
  const [refs, setRefs] = useState(null);
  const [shared, setShared] = useState([]);
  const [pub, setPub] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    allReferenceStats().then((r) => alive && setRefs(r)).catch((e) => alive && setErr(t('error_load', { what: 'reference' }) + ' ' + e.message));
    loadPublished().then((p) => alive && setPub(p)).catch(() => alive && setPub([]));
    if (configured) api.listApprovedSummaries().then((s) => alive && setShared(s || [])).catch(() => {});
    return () => { alive = false; };
  }, [configured]); // eslint-disable-line react-hooks/exhaustive-deps

  const studies = useMemo(() => {
    if (!refs) return null;
    const out = refs.map((r) => ({ key: r.key, label: r.name, sub: `${r.country}, ${r.years}`, n: r.stats.n, events: r.stats.deaths, type: 'ref', logHR: r.stats.cox.beta[0], se: r.stats.cox.se[0] }));
    for (const s of shared) {
      const est = ageEstimateFromSummary(s);
      if (!est || !(est.se > 0)) continue;
      out.push({ key: s.id, label: s.cohort_name, sub: [s.country, s.years_from && s.years_to ? `${s.years_from}–${s.years_to}` : null].filter(Boolean).join(', '), n: s.n, events: s.events, type: 'shared', logHR: est.logHR, se: est.se });
    }
    return out;
  }, [refs, shared]);

  const meta = useMemo(() => (studies && studies.length >= 2 ? metaRandomEffects(studies.map((s) => s.logHR), studies.map((s) => s.se)) : null), [studies]);
  const loo = useMemo(() => {
    if (!studies || studies.length < 3) return [];
    return studies.map((s, i) => {
      const rest = studies.filter((_, j) => j !== i);
      const mm = metaRandomEffects(rest.map((x) => x.logHR), rest.map((x) => x.se));
      return { label: s.label, HR: mm.HR, lo: mm.loHK, hi: mm.hiHK, I2: mm.I2 };
    });
  }, [studies]);

  const pubPooled = useMemo(() => {
    if (!pub) return null;
    const rows = pub.filter((p) => p.pooled && p.lo_year > 0 && p.hi_year > p.lo_year);
    if (rows.length < 2) return null;
    return metaRandomEffects(rows.map((p) => Math.log(p.HR_year)), rows.map((p) => (Math.log(p.hi_year) - Math.log(p.lo_year)) / (2 * 1.959964)));
  }, [pub]);

  const items = studies && meta ? [
    ...studies.map((s, i) => ({ type: 'row', label: s.label, sub: `n=${s.n}, ${s.type === 'ref' ? t('type_ref') : t('type_shared')}`, hr: Math.exp(s.logHR), lo: Math.exp(s.logHR - 1.959964 * s.se), hi: Math.exp(s.logHR + 1.959964 * s.se), color: s.type === 'ref' ? 'var(--accent)' : 'var(--g2)', weight: meta.weights[i] })),
    { type: 'pooled', label: t('cmp_pooled'), sub: `k=${studies.length}, I²=${Math.round(meta.I2)}%`, hr: meta.HR, lo: meta.loHK, hi: meta.hiHK },
    ...(meta.predLo != null ? [{ type: 'pred', label: t('pool_pi'), lo: meta.predLo, hi: meta.predHi }] : []),
  ] : null;

  const pubItems = pub && pub.length ? [
    ...pub.map((p) => ({ type: 'row', label: p.cohort.replace(/\s*\(([^)]*)\)$/, ''), sub: `n=${p.n}${p.pooled === false ? ` · ${t('not_pooled')}` : ''}`, hr: p.HR_year, lo: p.lo_year, hi: p.hi_year, color: p.pooled === false ? 'var(--ref)' : 'var(--g3)' })),
    ...(pubPooled ? [{ type: 'pooled', label: t('pool_pub_pooled'), sub: `I²=${Math.round(pubPooled.I2)}%`, hr: pubPooled.HR, lo: pubPooled.loHK, hi: pubPooled.hiHK }] : []),
  ] : null;

  return (
    <div className="grid gap-4">
      <PageHeader title={t('pool_title')} sub={t('pool_sub')} />
      {err && <ErrorBox msg={err} />}
      <section className="panel" aria-labelledby="pool-h">
        <h2 id="pool-h" className="mb-1">{t('pool_ipd')}</h2>
        <p className="small mb-3">{t('pool_ipd_help')} {configured ? (shared.length ? '' : t('pool_shared_none')) : t('pool_shared_local')}</p>
        {!studies && !err && <Loading what={t('computing')} />}
        {meta && (
          <>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5 mb-3">
              <Tile k={`${t('hr_year')} (${t('pool_dl')})`} v={fmt(meta.HR)} ci={`${t('ci95')} ${fmt(meta.lo)}–${fmt(meta.hi)}`} />
              <Tile k={t('pool_hk')} v={`${fmt(meta.loHK)}–${fmt(meta.hiHK)}`} />
              <Tile k={t('pool_pi')} v={meta.predLo == null ? t('pool_pi_none') : `${fmt(meta.predLo)}–${fmt(meta.predHi)}`} />
              <Tile k={t('pool_i2')} v={`${Math.round(meta.I2)} %`} ci={`${t('pool_tau')} = ${fmt(meta.tau, 4)}`} />
            </div>
            <ForestPlot items={items} title={t('forest_title')} />
            <div className="tw mt-3">
              <table className="tbl">
                <thead><tr><th>{t('th_cohort')}</th><th>{t('th_type')}</th><th>{t('th_n')}</th><th>{t('th_events')}</th><th>{t('th_hr_pub')}</th><th>{t('th_weight')}</th></tr></thead>
                <tbody>
                  {studies.map((s, i) => (
                    <tr key={s.key}>
                      <td>{s.label} <span className="small">{s.sub}</span></td>
                      <td>{s.type === 'ref' ? t('type_ref') : t('type_shared')}</td>
                      <td className="n">{s.n}</td><td className="n">{s.events}</td>
                      <td className="n">{fmt(Math.exp(s.logHR))} ({fmt(Math.exp(s.logHR - 1.959964 * s.se))}–{fmt(Math.exp(s.logHR + 1.959964 * s.se))})</td>
                      <td className="n">{Math.round(meta.weights[i] * 100)} %</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {loo.length > 0 && (
        <section className="panel" aria-labelledby="loo-h">
          <h2 id="loo-h" className="mb-1">{t('pool_loo')}</h2>
          <p className="small mb-2">{t('pool_loo_help')}</p>
          <div className="tw">
            <table className="tbl">
              <thead><tr><th>{t('th_without')}</th><th>{t('th_pooled')}</th><th>{t('th_i2')}</th></tr></thead>
              <tbody>{loo.map((r) => <tr key={r.label}><td>{r.label}</td><td className="n">{fmt(r.HR)} ({fmt(r.lo)}–{fmt(r.hi)})</td><td className="n">{Math.round(r.I2)} %</td></tr>)}</tbody>
            </table>
          </div>
        </section>
      )}

      <section className="panel" aria-labelledby="pub-h">
        <h2 id="pub-h" className="mb-1">{t('pool_pub')}</h2>
        <p className="small mb-1">{t('pool_pub_help')}</p>
        <p className="small mb-3">{t('pool_yang')}</p>
        {!pub && <Loading />}
        {pubItems && <ForestPlot items={pubItems} title={t('pool_pub')} />}
        {pub && (
          <div className="tw mt-3">
            <table className="tbl">
              <thead><tr><th>{t('th_cohort')}</th><th>{t('country')}</th><th>{t('th_years')}</th><th>{t('th_n')}</th><th>{t('th_adj')}</th><th>{t('th_idh')}</th><th>{t('th_hr_pub')}</th></tr></thead>
              <tbody>
                {pub.map((p) => (
                  <tr key={p.cohort}>
                    <td><a href={p.url} rel="noopener">{p.cohort}</a>{p.pooled === false && <span className="small"> · {t('not_pooled')}</span>}</td>
                    <td>{p.country}</td><td className="n">{p.years}</td><td className="n">{p.n}</td>
                    <td>{p.adjusted ? t('yes') : t('no')}</td><td>{p.idh}</td>
                    <td className="n">{fmt(p.HR_year)} ({fmt(p.lo_year)}–{fmt(p.hi_year)})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
