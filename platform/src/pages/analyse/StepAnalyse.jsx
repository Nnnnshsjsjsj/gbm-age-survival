import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useCohort } from '../../context/CohortContext.jsx';
import { runAnalysis, WORKER_THRESHOLD } from '../../lib/analysis.js';
import { methodsParagraph } from '../../lib/methods.js';
import { FocusHeading, Tile, Loading, ErrorBox, CopyButton } from '../../components/ui.jsx';
import KMChart, { GROUP_COLORS } from '../../components/KMChart.jsx';
import { fmt, fmtP, pct, hrText, pText } from '../../lib/format.js';

export default function StepAnalyse({ go }) {
  const { t, lang } = useApp();
  const cohort = useCohort();
  const { checks, analysis, mapping } = cohort;
  const [err, setErr] = useState('');

  useEffect(() => {
    if (analysis) return undefined;
    let alive = true;
    runAnalysis(checks.data).then((a) => alive && cohort.setAnalysis(a)).catch((e) => alive && setErr(e.message));
    return () => { alive = false; };
  }, [analysis, checks]); // eslint-disable-line react-hooks/exhaustive-deps

  const heading = (
    <div>
      <FocusHeading><span id="an-h">{t('an_title')}</span></FocusHeading>
      {analysis && <p className="text-muted mt-1">{t('an_sub', { n: analysis.n })}</p>}
    </div>
  );
  if (err) return <section className="grid gap-4" aria-labelledby="an-h">{heading}<ErrorBox msg={t('an_error', { msg: err })} /><div><button type="button" className="btn" onClick={() => go(2)}>{t('back')}</button></div></section>;
  if (!analysis) return <section className="grid gap-4" aria-labelledby="an-h">{heading}<Loading what={t('computing')} />{checks.kept > WORKER_THRESHOLD && <p className="small">{t('an_worker')}</p>}</section>;

  const a = analysis;
  const m = a.ageModel.model;
  const bandSeries = a.bands.groups.map((g, i) => (g.suppressed ? null : { label: `${g.label} (n=${g.n})`, km: g.km, color: GROUP_COLORS[i] })).filter(Boolean);
  const methods = methodsParagraph(lang, a, { dropped: checks.dropped, timeUnit: mapping.timeUnit });
  const tmax = a.kmAll.t[a.kmAll.t.length - 1];

  return (
    <section className="grid gap-4" aria-labelledby="an-h">
      {heading}

      <div className="panel">
        <h3 className="mb-3">{t('an_desc')}</h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
          <Tile k={t('n_events')} v={`${a.n} / ${a.events}`} />
          <Tile k={t('an_median_age')} v={fmt(a.desc.medianAge, 0)} ci={`${fmt(a.desc.ageIQR[0], 0)}–${fmt(a.desc.ageIQR[1], 0)}`} />
          <Tile k={t('an_median_os')} v={a.desc.medianOS == null ? '—' : `${fmt(a.desc.medianOS, 1)} ${t('mo')}`} ci={`${a.medianCI[0] == null ? '—' : fmt(a.medianCI[0], 1)}–${a.medianCI[1] == null ? '—' : fmt(a.medianCI[1], 1)}`} />
          <Tile k={t('alive_at', { m: 6 })} v={pct(a.desc.s6)} />
          <Tile k={t('alive_at', { m: 12 })} v={pct(a.desc.s12)} />
          <Tile k={t('alive_at', { m: 24 })} v={pct(a.desc.s24)} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel">
          <h3 className="mb-3">{t('an_km_all')}</h3>
          <KMChart series={[{ label: `${t('whole_cohort')} (n=${a.n})`, km: a.kmAll, color: 'var(--accent)' }]} title={t('km_title', { name: t('whole_cohort') })} tmax={tmax} />
        </div>
        <div className="panel">
          <h3 className="mb-3">{t('an_km_age')}</h3>
          <KMChart series={bandSeries} title={t('age_band_km_title', { name: t('cmp_yours') })} tmax={tmax} />
          <div className="legend">
            {a.bands.groups.filter((g) => g.suppressed).map((g) => <span key={g.label}><i style={{ background: 'var(--line-strong)' }} aria-hidden="true" />{g.label}: {t('suppressed')}</span>)}
          </div>
          {a.bands.logrank && <p className="small mt-2">{t('logrank', { p: pText(a.bands.logrank.p) })}</p>}
        </div>
      </div>

      <div className="panel">
        <h3 className="mb-1">{t('an_cox')}</h3>
        <p className="small mb-3">{t('an_cox_help')}</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
          <Tile k={t('hr_year')} v={fmt(m.hr[0])} ci={`${t('ci95')} ${fmt(m.lo[0])}–${fmt(m.hi[0])}`} />
          <Tile k={t('p_value')} v={fmtP(m.p[0])} />
          <Tile k={t('c_index')} v={fmt(m.concordance, 3)} />
          <Tile k={t('n_events')} v={`${a.ageModel.n} / ${a.ageModel.events}`} />
        </div>
        <p className="mt-3 text-sm" data-testid="age-hr">
          {t('hr_year')}: <span className="num font-medium">{hrText(m)}</span>
        </p>
        {a.models.length > 1 && (
          <>
            <h4 className="mt-4 mb-1 text-base">{t('an_models')}</h4>
            <p className="small mb-2">{t('an_models_help')}</p>
            <div className="tw">
              <table className="tbl">
                <thead><tr><th>{t('th_model')}</th><th>{t('th_hr')}</th><th>{t('p_value')}</th><th>{t('th_n')}</th><th>{t('th_events')}</th></tr></thead>
                <tbody>
                  {a.models.map((mm) => {
                    const i = mm.model.names.indexOf('age');
                    return (
                      <tr key={mm.key}>
                        <td>{mm.def ? t(mm.def.labelKey) : mm.model.names.join(' + ')}</td>
                        <td className="n">{hrText(mm.model, i)}</td>
                        <td className="n">{fmtP(mm.model.p[i])}</td>
                        <td className="n">{mm.n}</td>
                        <td className="n">{mm.events}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="panel">
        <h3 className="mb-1">{t('an_schoenfeld')}</h3>
        <p className="text-sm">{a.schoenfeldP == null ? '—' : t(a.schoenfeldP > 0.05 ? 'an_sch_ok' : 'an_sch_warn', { p: pText(a.schoenfeldP) })}</p>
      </div>

      <div className="panel">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
          <h3>{t('an_methods')}</h3>
          <CopyButton text={methods} />
        </div>
        <p className="small mb-2">{t('an_methods_help')}</p>
        <p className="text-[15px] leading-relaxed max-w-[80ch]">{methods}</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-between">
        <button type="button" className="btn" onClick={() => go(2)}>{t('back')}</button>
        <button type="button" className="btn btn-primary" onClick={() => go(4)}>{t('an_go_compare')}</button>
      </div>
    </section>
  );
}
