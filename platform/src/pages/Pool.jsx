import { useEffect, useMemo, useState } from 'react';
import { useT } from '../context/AppContext.jsx';
import { useCommunity } from '../context/CommunityContext.jsx';
import { allReferenceStats, loadPublished } from '../lib/reference.js';
import { metaRandomEffects } from '../engine/index.js';
import { api } from '../lib/api.js';
import { ageEstimateFromSummary } from '../lib/summary.js';
import { PageHead, Tile, Notice, Skel, UseNotice } from '../components/ui.jsx';
import ForestPlot, { ForestSkeleton } from '../components/ForestPlot.jsx';
import { IconExternal } from '../components/Icons.jsx';
import { fmt } from '../lib/format.js';

const Z = 1.959964;

export default function Pool() {
  const t = useT();
  const community = useCommunity();
  const [refs, setRefs] = useState(null);
  const [shared, setShared] = useState([]);
  const [sharedState, setSharedState] = useState('loading'); // loading | ok | down
  const [pub, setPub] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    allReferenceStats().then((r) => alive && setRefs(r)).catch((e) => alive && setErr(`${t('error_load', { what: 'reference' })} ${e.message}`));
    loadPublished().then((p) => alive && setPub(p)).catch(() => alive && setPub([]));
    api.approvedSummaries()
      .then((s) => { if (alive) { setShared(s || []); setSharedState('ok'); } })
      .catch((e) => { if (alive) { setSharedState('down'); community.report(e); } });
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const studies = useMemo(() => {
    if (!refs) return null;
    const out = refs.map((r) => ({ key: r.key, label: r.name, sub: `${r.country}, ${r.years}`, n: r.stats.n, events: r.stats.deaths, type: 'ref', logHR: r.stats.cox.beta[0], se: r.stats.cox.se[0] }));
    for (const s of shared) {
      const est = ageEstimateFromSummary(s);
      if (!est || !(est.se > 0) || !Number.isFinite(est.logHR)) continue;
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
    return metaRandomEffects(rows.map((p) => Math.log(p.HR_year)), rows.map((p) => (Math.log(p.hi_year) - Math.log(p.lo_year)) / (2 * Z)));
  }, [pub]);

  const typeLabel = (s) => (s.type === 'ref' ? t('type_ref') : t('type_shared'));
  const items = studies && meta ? [
    ...studies.map((s, i) => ({ type: 'row', label: s.label, sub: `n=${s.n}`, hr: Math.exp(s.logHR), lo: Math.exp(s.logHR - Z * s.se), hi: Math.exp(s.logHR + Z * s.se), color: s.type === 'ref' ? 'var(--accent)' : 'var(--g2)', weight: meta.weights[i] })),
    { type: 'pooled', label: t('cmp_pooled'), sub: `k=${studies.length}, I²=${Math.round(meta.I2)}%`, hr: meta.HR, lo: meta.loHK, hi: meta.hiHK },
    ...(meta.predLo != null ? [{ type: 'pred', label: t('pool_pi'), lo: meta.predLo, hi: meta.predHi }] : []),
  ] : null;

  const pubItems = pub && pub.length ? [
    ...pub.map((p) => ({ type: 'row', label: p.cohort.replace(/\s*\(([^)]*)\)$/, ''), sub: `n=${p.n}${p.pooled === false ? ` · ${t('not_pooled')}` : ''}`, hr: p.HR_year, lo: p.lo_year, hi: p.hi_year, color: p.pooled === false ? 'var(--ref)' : 'var(--g3)' })),
    ...(pubPooled ? [{ type: 'pooled', label: t('pool_pub_pooled'), sub: `I²=${Math.round(pubPooled.I2)}%`, hr: pubPooled.HR, lo: pubPooled.loHK, hi: pubPooled.hiHK }] : []),
  ] : null;

  const sharedCount = shared.length;
  return (
    <div className="shell page">
      <PageHead kicker={t('pool_kicker')} title={t('pool_title')} sub={t('pool_sub')} />
      {err && <Notice kind="error" className="mb-4">{err}</Notice>}

      <div className="tiles on-paper mb-4">
        <Tile k={`${t('hr_year')}, ${t('pool_dl')}`} v={meta ? fmt(meta.HR) : ''} ci={meta ? `${t('ci95')} ${fmt(meta.lo)}–${fmt(meta.hi)}` : ''} loading={!meta && !err} />
        <Tile k={t('pool_hk')} v={meta ? `${fmt(meta.loHK)}–${fmt(meta.hiHK)}` : ''} loading={!meta && !err} />
        <Tile k={t('pool_pi')} v={meta ? (meta.predLo == null ? t('pool_pi_none') : `${fmt(meta.predLo)}–${fmt(meta.predHi)}`) : ''} loading={!meta && !err} />
        <Tile k={t('pool_i2')} v={meta ? `${Math.round(meta.I2)} %` : ''} ci={meta ? `${t('pool_tau')} = ${fmt(meta.tau, 4)}` : ''} loading={!meta && !err} />
      </div>

      <section className="card card-pad" aria-labelledby="pool-h">
        <div className="card-head">
          <div>
            <h2 id="pool-h" className="h3">{t('pool_ipd')}</h2>
            <p className="small mt-1 max-w-[72ch]">{t('pool_ipd_help')}</p>
          </div>
          <span className={`badge ${sharedState === 'ok' && sharedCount ? 'badge-blue' : ''}`}>
            {sharedState === 'loading' ? t('pool_shared_loading') : sharedState === 'down' ? t('pool_shared_off') : t('pool_shared_n', { n: sharedCount })}
          </span>
        </div>
        {!items && !err && <ForestSkeleton rows={7} />}
        {items && <ForestPlot items={items} title={t('forest_title')} />}
        {sharedState === 'ok' && sharedCount === 0 && <p className="tiny mt-3">{t('pool_shared_none')}</p>}
        {sharedState === 'down' && <p className="tiny mt-3">{t('pool_shared_down')}</p>}
        <div className="tw mt-6">
          <table className="tbl">
            <thead><tr><th>{t('th_cohort')}</th><th>{t('th_type')}</th><th className="n">{t('th_n')}</th><th className="n">{t('th_events')}</th><th className="n">{t('th_hr_pub')}</th><th className="n">{t('th_weight')}</th></tr></thead>
            <tbody>
              {!studies && [0, 1, 2, 3].map((i) => <tr key={i}>{[0, 1, 2, 3, 4, 5].map((j) => <td key={j}><Skel w={j ? 48 : 120} h={12} style={{ marginLeft: j > 1 ? 'auto' : 0 }} /></td>)}</tr>)}
              {studies && meta && studies.map((s, i) => (
                <tr key={s.key}>
                  <td><span className="font-medium">{s.label}</span> <span className="tiny block">{s.sub}</span></td>
                  <td><span className={`badge ${s.type === 'ref' ? 'badge-accent' : 'badge-blue'}`}>{typeLabel(s)}</span></td>
                  <td className="n">{s.n}</td><td className="n">{s.events}</td>
                  <td className="n">{fmt(Math.exp(s.logHR))} ({fmt(Math.exp(s.logHR - Z * s.se))}–{fmt(Math.exp(s.logHR + Z * s.se))})</td>
                  <td className="n">{Math.round(meta.weights[i] * 100)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card card-pad mt-4" aria-labelledby="loo-h">
        <h2 id="loo-h" className="h3">{t('pool_loo')}</h2>
        <p className="small mt-1 mb-4">{t('pool_loo_help')}</p>
        <div className="tw">
          <table className="tbl">
            <thead><tr><th>{t('th_without')}</th><th className="n">{t('th_pooled')}</th><th className="n">{t('th_i2')}</th></tr></thead>
            <tbody>
              {!loo.length && [0, 1, 2].map((i) => <tr key={i}><td><Skel w={120} h={12} /></td><td><Skel w={140} h={12} style={{ marginLeft: 'auto' }} /></td><td><Skel w={40} h={12} style={{ marginLeft: 'auto' }} /></td></tr>)}
              {loo.map((r) => <tr key={r.label}><td>{r.label}</td><td className="n">{fmt(r.HR)} ({fmt(r.lo)}–{fmt(r.hi)})</td><td className="n">{Math.round(r.I2)} %</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card card-pad mt-4" aria-labelledby="pub-h">
        <h2 id="pub-h" className="h3">{t('pool_pub')}</h2>
        <p className="small mt-1">{t('pool_pub_help')}</p>
        <p className="tiny mt-1 mb-6">{t('pool_yang')}</p>
        {!pub && <ForestSkeleton rows={8} />}
        {pubItems && <ForestPlot items={pubItems} title={t('pool_pub')} />}
        {pub && (
          <div className="tw mt-6">
            <table className="tbl">
              <thead><tr><th>{t('th_cohort')}</th><th>{t('country')}</th><th className="n">{t('th_years')}</th><th className="n">{t('th_n')}</th><th>{t('th_adj')}</th><th>{t('th_idh')}</th><th className="n">{t('th_hr_pub')}</th></tr></thead>
              <tbody>
                {pub.map((p) => (
                  <tr key={p.cohort}>
                    <td><a href={p.url} rel="noopener" target="_blank" className="inline-flex items-center gap-1 font-medium">{p.cohort}<IconExternal width={13} height={13} /></a>{p.pooled === false && <span className="tiny block">{t('not_pooled')}</span>}</td>
                    <td>{p.country}</td><td className="n">{p.years}</td><td className="n">{p.n}</td>
                    <td>{p.adjusted ? t('yes') : t('no')}</td><td className="whitespace-nowrap">{p.idh}</td>
                    <td className="n">{fmt(p.HR_year)} ({fmt(p.lo_year)}–{fmt(p.hi_year)})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <div className="mt-6"><UseNotice /></div>
    </div>
  );
}
