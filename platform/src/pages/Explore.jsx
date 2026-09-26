import { useEffect, useState } from 'react';
import { useT } from '../context/AppContext.jsx';
import { COHORTS, referenceStats } from '../lib/reference.js';
import { Banner, PageHeader, Tile, Loading, ErrorBox } from '../components/ui.jsx';
import KMChart, { GROUP_COLORS } from '../components/KMChart.jsx';
import { fmt, pct, pText } from '../lib/format.js';

export default function Explore() {
  const t = useT();
  const [key, setKey] = useState(COHORTS[0].key);
  const [showCI, setShowCI] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState('');
  const meta = COHORTS.find((c) => c.key === key);

  useEffect(() => {
    let alive = true;
    setStats(null); setErr('');
    referenceStats(key).then((s) => alive && setStats(s)).catch((e) => alive && setErr(t('error_load', { what: meta.name }) + ' ' + e.message));
    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const series = [];
  if (stats) {
    if (showAll) series.push({ label: `${t('whole_cohort')} (n=${stats.n})`, km: stats.kmAll, color: 'var(--ref)', dashed: true });
    stats.bands.groups.forEach((g, i) => { if (!g.suppressed) series.push({ label: `${g.label} (n=${g.n})`, km: g.km, color: GROUP_COLORS[i] }); });
  }

  return (
    <div>
      <PageHeader title={t('explore_title')} sub={t('explore_sub')} />
      <Banner />
      <div className="grid gap-4 md:grid-cols-[300px_minmax(0,1fr)]">
        <section className="panel" aria-labelledby="ctl-h">
          <h2 id="ctl-h" className="mb-3">{t('cohort')}</h2>
          <fieldset className="border-0 p-0 m-0 mb-4">
            <legend className="sr-only">{t('cohort')}</legend>
            <div className="flex flex-col border border-line-strong rounded-md overflow-hidden">
              {COHORTS.map((c) => (
                <label key={c.key} className={`flex items-center justify-between gap-2 px-3 min-h-[44px] cursor-pointer border-t first:border-t-0 border-line-strong ${c.key === key ? 'bg-accent text-on-accent' : 'hover:bg-accent-soft'}`}>
                  <span className="flex items-center gap-2 font-medium text-sm">
                    <input type="radio" name="cohort" value={c.key} checked={c.key === key} onChange={() => setKey(c.key)} className="w-4 h-4 accent-[var(--accent)]" />
                    {c.name}
                  </span>
                  <small className="num text-xs opacity-85">{c.years}</small>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mb-4">
            <span className="lbl block mb-1">{t('display')}</span>
            <label className="check"><input type="checkbox" checked={showCI} onChange={(e) => setShowCI(e.target.checked)} /> {t('ci_bands')}</label>
            <label className="check"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> {t('show_all')}</label>
          </div>
          <dl className="panel-2 grid gap-1 text-sm m-0">
            <dt className="lbl text-[11px]">{t('n_events')}</dt><dd className="m-0 num">{stats ? `${stats.n} / ${stats.deaths}` : '…'}</dd>
            <dt className="lbl text-[11px] mt-1">{t('country')}</dt><dd className="m-0">{meta.country}</dd>
            <dt className="lbl text-[11px] mt-1">{t('years_dx')}</dt><dd className="m-0 num">{meta.years}</dd>
            <dt className="lbl text-[11px] mt-1">{t('median_age')}</dt><dd className="m-0 num">{stats ? `${fmt(stats.desc.medianAge, 0)} (${stats.ageRange[0]}–${stats.ageRange[1]})` : '…'}</dd>
            <dt className="lbl text-[11px] mt-1">{t('source')}</dt><dd className="m-0">{meta.source}</dd>
            <dt className="lbl text-[11px] mt-1">{t('note')}</dt><dd className="m-0">{t(meta.noteKey)}</dd>
          </dl>
        </section>

        <section className="panel" aria-labelledby="res-h">
          <h2 id="res-h" className="mb-3">{t('km_by_age')}</h2>
          {err && <ErrorBox msg={err} />}
          {!stats && !err && <Loading />}
          {stats && (
            <>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5 mb-3">
                <Tile k={t('t_med')} v={stats.kmAll.median == null ? '—' : `${fmt(stats.kmAll.median, 1)} ${t('mo')}`} />
                <Tile k={t('hr_year')} v={fmt(stats.cox.hr[0])} ci={`${fmt(stats.cox.lo[0])}–${fmt(stats.cox.hi[0])}`} />
                <Tile k={t('n_events')} v={`${stats.n} / ${stats.deaths}`} />
              </div>
              <KMChart series={series} showCI={showCI} title={t('age_band_km_title', { name: meta.name })} />
              <div className="legend">
                {stats.bands.groups.filter((g) => g.suppressed).map((g) => <span key={g.label}><i style={{ background: 'var(--line-strong)' }} aria-hidden="true" />{g.label}: {t('suppressed')}</span>)}
              </div>
              <div className="tw mt-2">
                <table className="tbl">
                  <thead><tr><th>{t('age_group')}</th><th>{t('patients')}</th><th>{t('deaths')}</th><th>{t('median_os')}, {t('months')}</th><th>{t('alive_at', { m: 12 })}</th><th>{t('alive_at', { m: 24 })}</th></tr></thead>
                  <tbody>
                    {stats.bands.groups.map((g, i) => (
                      <tr key={g.label}>
                        <td><span className="inline-block w-2.5 h-2.5 rounded-sm mr-2 align-middle" style={{ background: g.suppressed ? 'var(--line-strong)' : GROUP_COLORS[i] }} aria-hidden="true" />{g.label}</td>
                        <td className="n">{g.n}</td>
                        {g.suppressed ? <td colSpan={4} className="small">{t('suppressed')}</td> : (
                          <>
                            <td className="n">{g.deaths}</td>
                            <td className="n">{g.median == null ? '—' : fmt(g.median, 1)}</td>
                            <td className="n">{pct(g.s12)}</td>
                            <td className="n">{pct(g.s24)}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {stats.bands.logrank && <p className="small mt-2">{t('logrank', { p: pText(stats.bands.logrank.p) })}</p>}
            </>
          )}
        </section>
      </div>
      <details className="border-t border-line mt-5 py-3">
        <summary className="cursor-pointer font-serif font-semibold min-h-[44px] flex items-center">{t('explore_how')}</summary>
        <div className="prose pt-2 text-[15px]">
          <p>{t('explore_how1')}</p><p>{t('explore_how2')}</p><p>{t('explore_how3')}</p>
        </div>
      </details>
    </div>
  );
}
