import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../../context/AppContext.jsx';
import { useCohort } from '../../context/CohortContext.jsx';
import { allReferenceStats } from '../../lib/reference.js';
import { metaRandomEffects } from '../../engine/index.js';
import { buildSummary, downloadJson, compactJson } from '../../lib/summary.js';
import { FocusHeading, Notice } from '../../components/ui.jsx';
import { LINKS } from '../../components/Layout.jsx';
import ForestPlot, { ForestSkeleton } from '../../components/ForestPlot.jsx';
import { IconDownload, IconArrowUpRight, IconCheckCircle, IconChevronDown } from '../../components/Icons.jsx';
import { fmt } from '../../lib/format.js';

export default function StepCompare({ go }) {
  const t = useT();
  const cohort = useCohort();
  const { analysis, share, setShare } = cohort;
  const [refs, setRefs] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    allReferenceStats().then((r) => alive && setRefs(r)).catch((e) => alive && setErr(`${t('error_load', { what: 'reference' })} ${e.message}`));
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
    ...refs.map((r) => ({ type: 'row', label: r.name, sub: `n=${r.stats.n}`, hr: r.stats.cox.hr[0], lo: r.stats.cox.lo[0], hi: r.stats.cox.hi[0], color: 'var(--g2)' })),
    { type: 'pooled', label: t('cmp_pooled'), sub: `k=${refs.length + 1}, I²=${Math.round(meta.I2)}%`, hr: meta.HR, lo: meta.loHK, hi: meta.hiHK },
  ] : null;
  const overlaps = meta ? m.lo[0] <= meta.hiHK && m.hi[0] >= meta.loHK : null;
  const field = (key, label, type = 'text', extra = {}) => (
    <div className="field">
      <label htmlFor={`sh-${key}`}>{label}</label>
      <input id={`sh-${key}`} className="input" type={type} value={share[key]} onChange={(e) => setShare({ ...share, [key]: e.target.value })} {...extra} />
    </div>
  );
  const download = <button type="button" className="btn btn-ghost" onClick={() => downloadJson(summary, 'cohortex-summary.json')}><IconDownload />{t('download_json')}</button>;

  return (
    <section className="grid gap-4" aria-labelledby="cmp-h">
      <div className="card card-pad">
        <FocusHeading className="h3" id="cmp-h">{t('cmp_title')}</FocusHeading>
        <p className="small mt-1 mb-6">{t('cmp_sub')}</p>
        {err && <Notice kind="error">{err}</Notice>}
        {!refs && !err && <ForestSkeleton rows={6} />}
        {items && (
          <>
            <ForestPlot items={items} title={t('forest_title')} />
            <div className={`banner mt-4 ${overlaps ? 'banner-accent' : 'banner-warn'}`}>
              <IconCheckCircle />
              <p>{t(overlaps ? 'cmp_overlap_yes' : 'cmp_overlap_no', { lo: fmt(meta.loHK), hi: fmt(meta.hiHK) })} {t('cmp_i2', { i2: Math.round(meta.I2) })}</p>
            </div>
          </>
        )}
      </div>

      <div className="card card-pad" aria-labelledby="share-h" data-space="research">
        <h3 id="share-h" className="h4">{t('share_title')}</h3>
        <p className="small mt-1 max-w-[72ch]">{t('share_help')}</p>
        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          {field('cohort_name', t('share_name'), 'text', { maxLength: 120, required: true })}
          {field('country', t('share_country'), 'text', { maxLength: 60 })}
          {field('years_from', t('share_from'), 'number', { min: 1970, max: 2100, inputMode: 'numeric' })}
          {field('years_to', t('share_to'), 'number', { min: 1970, max: 2100, inputMode: 'numeric' })}
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-[14px] font-semibold min-h-[44px] flex items-center gap-2 list-none">{t('share_preview')}<IconChevronDown width={16} height={16} className="text-dim" /></summary>
          <pre className="code max-h-[360px] overflow-auto mt-2" tabIndex={0}>{compactJson(summary)}</pre>
        </details>

        <div className="mt-4 grid gap-4">
          <Notice kind="lock"><p>{t('share_local')}</p></Notice>
          <div className="actions">
            {download}
            <div className="right"><a className="btn btn-soft" href={`${LINKS.issues}/new?labels=cohort-summary&title=${encodeURIComponent('Cohort summary')}`} rel="noopener" target="_blank">{t('share_issue')}<IconArrowUpRight /></a></div>
          </div>
        </div>
      </div>

      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={() => go(3)}>{t('back')}</button>
        <div className="right">
          <button type="button" className="btn btn-soft" onClick={() => { cohort.reset(); go(0); }}>{t('start_over')}</button>
          <Link to="/pool" className="btn btn-ghost">{t('cmp_to_pool')}</Link>
        </div>
      </div>
    </section>
  );
}
