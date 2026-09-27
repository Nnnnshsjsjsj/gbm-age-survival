import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useCohort } from '../../context/CohortContext.jsx';
import { runAnalysis, WORKER_THRESHOLD } from '../../lib/analysis.js';
import { methodsParagraph } from '../../lib/methods.js';
import { FocusHeading, Tile, Notice, CopyButton, Skel } from '../../components/ui.jsx';
import KMChart, { GROUP_COLORS, ChartSkeleton } from '../../components/KMChart.jsx';
import { IconArrowRight, IconCheckCircle, IconAlert } from '../../components/Icons.jsx';
import { fmt, fmtP, pct, hrText, pText } from '../../lib/format.js';

function LoadingResults({ big }) {
  const { t } = useApp();
  return (
    <div className="grid gap-4" aria-busy="true">
      <p className="sr-only" role="status">{t('computing')}</p>
      <div className="card card-pad"><Skel w={160} h={16} /><div className="tiles mt-4">{[0, 1, 2, 3, 4, 5].map((i) => <Tile key={i} k={<Skel w={80} h={10} />} loading />)}</div></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card card-pad"><Skel w={200} h={16} style={{ marginBottom: 16 }} /><ChartSkeleton /></div>
        <div className="card card-pad"><Skel w={200} h={16} style={{ marginBottom: 16 }} /><ChartSkeleton /></div>
      </div>
      {big && <p className="small">{t('an_worker')}</p>}
    </div>
  );
}

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
    <div className="card-head !mb-0">
      <div>
        <FocusHeading className="h3" id="an-h">{t('an_title')}</FocusHeading>
        <p className="small mt-1">{analysis ? t('an_sub', { n: analysis.n }) : t('computing')}</p>
      </div>
    </div>
  );
  if (err) return <section className="grid gap-4" aria-labelledby="an-h"><div className="card card-pad">{heading}</div><Notice kind="error">{t('an_error', { msg: err })}</Notice><div><button type="button" className="btn btn-ghost" onClick={() => go(2)}>{t('back')}</button></div></section>;
  if (!analysis) return <section className="grid gap-4" aria-labelledby="an-h"><div className="card card-pad">{heading}</div><LoadingResults big={checks.kept > WORKER_THRESHOLD} /></section>;

  const a = analysis;
  const m = a.ageModel.model;
  const bandSeries = a.bands.groups.map((g, i) => (g.suppressed ? null : { label: `${g.label} (n=${g.n})`, km: g.km, color: GROUP_COLORS[i] })).filter(Boolean);
  const methods = methodsParagraph(lang, a, { dropped: checks.dropped, timeUnit: mapping.timeUnit });
  const tmax = a.kmAll.t[a.kmAll.t.length - 1];
  const schOk = a.schoenfeldP != null && a.schoenfeldP > 0.05;

  return (
    <section className="grid gap-4" aria-labelledby="an-h">
      <div className="card card-pad">
        {heading}
        <h3 className="kicker mt-6 mb-3">{t('an_desc')}</h3>
        <div className="tiles">
          <Tile k={t('n_events')} v={`${a.n} / ${a.events}`} />
          <Tile k={t('an_median_age')} v={fmt(a.desc.medianAge, 0)} ci={`${fmt(a.desc.ageIQR[0], 0)}–${fmt(a.desc.ageIQR[1], 0)}`} />
          <Tile k={t('an_median_os')} v={a.desc.medianOS == null ? '—' : `${fmt(a.desc.medianOS, 1)} ${t('mo')}`} ci={`${a.medianCI[0] == null ? '—' : fmt(a.medianCI[0], 1)}–${a.medianCI[1] == null ? '—' : fmt(a.medianCI[1], 1)}`} />
          <Tile k={t('alive_at', { m: 6 })} v={pct(a.desc.s6)} />
          <Tile k={t('alive_at', { m: 12 })} v={pct(a.desc.s12)} />
          <Tile k={t('alive_at', { m: 24 })} v={pct(a.desc.s24)} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card card-pad">
          <h3 className="h4 mb-4">{t('an_km_all')}</h3>
          <KMChart series={[{ label: `${t('whole_cohort')} (n=${a.n})`, km: a.kmAll, color: 'var(--accent)' }]} title={t('km_title', { name: t('whole_cohort') })} tmax={tmax} />
        </div>
        <div className="card card-pad">
          <h3 className="h4 mb-4">{t('an_km_age')}</h3>
          <KMChart series={bandSeries} title={t('age_band_km_title', { name: t('cmp_yours') })} tmax={tmax} />
          {a.bands.groups.some((g) => g.suppressed) && <p className="tiny mt-2">{a.bands.groups.filter((g) => g.suppressed).map((g) => `${g.label}: ${t('suppressed')}`).join(' · ')}</p>}
          {a.bands.logrank && <p className="small mt-2">{t('logrank', { p: pText(a.bands.logrank.p) })}</p>}
        </div>
      </div>

      <div className="card card-pad">
        <h3 className="h4">{t('an_cox')}</h3>
        <p className="small mt-1 max-w-[70ch]">{t('an_cox_help')}</p>
        <div className="tiles mt-4">
          <Tile k={t('hr_year')} v={fmt(m.hr[0])} ci={`${t('ci95')} ${fmt(m.lo[0])}–${fmt(m.hi[0])}`} />
          <Tile k={t('p_value')} v={fmtP(m.p[0])} />
          <Tile k={t('c_index')} v={fmt(m.concordance, 3)} />
          <Tile k={t('n_events')} v={`${a.ageModel.n} / ${a.ageModel.events}`} />
        </div>
        <p className="mt-4 text-[15px]" data-testid="age-hr">
          {t('hr_year')}: <span className="num font-medium">{hrText(m)}</span>
        </p>
        <div className={`banner mt-4 ${schOk ? '' : 'banner-warn'}`}>
          {schOk ? <IconCheckCircle /> : <IconAlert />}
          <p><b>{t('an_schoenfeld')}.</b> {a.schoenfeldP == null ? '—' : t(schOk ? 'an_sch_ok' : 'an_sch_warn', { p: pText(a.schoenfeldP) })}</p>
        </div>
        {a.models.length > 1 && (
          <>
            <h4 className="h4 mt-8">{t('an_models')}</h4>
            <p className="small mt-1 mb-2">{t('an_models_help')}</p>
            <div className="tw">
              <table className="tbl">
                <thead><tr><th>{t('th_model')}</th><th className="n">{t('th_hr')}</th><th className="n">{t('p_value')}</th><th className="n">{t('th_n')}</th><th className="n">{t('th_events')}</th></tr></thead>
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

      <div className="card card-pad">
        <div className="card-head">
          <div>
            <h3 className="h4">{t('an_methods')}</h3>
            <p className="small mt-1">{t('an_methods_help')}</p>
          </div>
          <CopyButton text={methods} />
        </div>
        <p className="methods">{methods}</p>
      </div>

      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={() => go(2)}>{t('back')}</button>
        <div className="right"><button type="button" className="btn btn-primary" onClick={() => go(4)}>{t('an_go_compare')}<IconArrowRight /></button></div>
      </div>
    </section>
  );
}
