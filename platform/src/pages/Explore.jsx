import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../context/AppContext.jsx';
import { COHORTS, referenceStats } from '../lib/reference.js';
import { PageHead, Tile, UseNotice, Notice, Skel } from '../components/ui.jsx';
import KMChart, { GROUP_COLORS, ChartSkeleton } from '../components/KMChart.jsx';
import { IconArrowRight, IconChevronDown } from '../components/Icons.jsx';
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
    referenceStats(key).then((s) => alive && setStats(s)).catch((e) => alive && setErr(`${t('error_load', { what: meta.name })} ${e.message}`));
    return () => { alive = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const series = [];
  if (stats) {
    if (showAll) series.push({ label: `${t('whole_cohort')} (n=${stats.n})`, km: stats.kmAll, color: 'var(--ref)', dashed: true });
    stats.bands.groups.forEach((g, i) => { if (!g.suppressed) series.push({ label: `${g.label} (n=${g.n})`, km: g.km, color: GROUP_COLORS[i] }); });
  }
  const loading = !stats && !err;

  return (
    <div className="shell page">
      <PageHead kicker={t('explore_kicker')} title={t('explore_title')} sub={t('explore_sub')} />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="tabs grid-sm" role="tablist" aria-label={t('cohort')}>
          {COHORTS.map((c) => (
            <button key={c.key} type="button" role="tab" className="tab" aria-selected={c.key === key} onClick={() => setKey(c.key)}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="toggles" role="group" aria-label={t('display')}>
          <label className="switch"><input type="checkbox" checked={showCI} onChange={(e) => setShowCI(e.target.checked)} /><span className="knob" aria-hidden="true" />{t('ci_bands')}</label>
          <label className="switch"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /><span className="knob" aria-hidden="true" />{t('show_all')}</label>
        </div>
      </div>

      {err && <Notice kind="error" className="mb-4">{err}</Notice>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="card card-pad" aria-labelledby="km-h">
          <div className="card-head">
            <div>
              <h2 id="km-h" className="h3">{t('km_by_age')}</h2>
              <p className="small mt-1">{meta.name} · {meta.country} · {meta.years}</p>
            </div>
          </div>
          {stats ? <KMChart series={series} showCI={showCI} title={t('age_band_km_title', { name: meta.name })} /> : (
            <>
              <ChartSkeleton />
              <div className="legend" aria-hidden="true">{[0, 1, 2, 3].map((i) => <Skel key={i} w={92} h={12} />)}</div>
            </>
          )}
          {stats && stats.bands.groups.some((g) => g.suppressed) && (
            <p className="tiny mt-2">{stats.bands.groups.filter((g) => g.suppressed).map((g) => `${g.label}: ${t('suppressed')}`).join(' · ')}</p>
          )}
        </section>

        <aside className="grid gap-4 content-start">
          <div className="card card-pad">
            <h2 className="h4 mb-4">{t('at_a_glance')}</h2>
            <div className="grid grid-cols-2 gap-3">
              <Tile k={t('t_med')} v={stats ? (stats.kmAll.median == null ? '—' : `${fmt(stats.kmAll.median, 1)} ${t('mo')}`) : ''} loading={loading} />
              <Tile k={t('hr_year')} v={stats ? fmt(stats.cox.hr[0]) : ''} ci={stats ? `${fmt(stats.cox.lo[0])}–${fmt(stats.cox.hi[0])}` : ''} loading={loading} />
              <Tile k={t('n_events')} v={stats ? `${stats.n} / ${stats.deaths}` : ''} loading={loading} />
              <Tile k={t('median_age')} v={stats ? fmt(stats.desc.medianAge, 0) : ''} ci={stats ? `${stats.ageRange[0]}–${stats.ageRange[1]}` : ''} loading={loading} />
            </div>
          </div>
          <div className="card card-pad">
            <dl className="grid gap-3 m-0 text-[14px]">
              <div><dt className="kicker">{t('source')}</dt><dd className="m-0 mt-1">{meta.source}</dd></div>
              <div><dt className="kicker">{t('note')}</dt><dd className="m-0 mt-1 text-muted">{t(meta.noteKey)}</dd></div>
            </dl>
          </div>
        </aside>
      </div>

      <section className="card card-pad mt-4" aria-labelledby="tbl-h">
        <div className="card-head">
          <h2 id="tbl-h" className="h3">{t('by_age_table')}</h2>
          {stats?.bands.logrank && <span className="badge">{t('logrank_short', { p: pText(stats.bands.logrank.p) })}</span>}
        </div>
        <div className="tw">
          <table className="tbl">
            <thead><tr><th>{t('age_group')}</th><th className="n">{t('patients')}</th><th className="n">{t('deaths')}</th><th className="n">{t('median_os')}, {t('mo')}</th><th className="n">{t('alive_at', { m: 12 })}</th><th className="n">{t('alive_at', { m: 24 })}</th></tr></thead>
            <tbody>
              {!stats && [0, 1, 2, 3].map((i) => <tr key={i}>{[0, 1, 2, 3, 4, 5].map((j) => <td key={j}><Skel w={j ? 40 : 70} h={12} style={{ marginLeft: j ? 'auto' : 0 }} /></td>)}</tr>)}
              {stats && stats.bands.groups.map((g, i) => (
                <tr key={g.label}>
                  <td><span className="inline-block w-2.5 h-2.5 rounded-sm mr-2 align-middle" style={{ background: g.suppressed ? 'var(--line-strong)' : GROUP_COLORS[i] }} aria-hidden="true" />{g.label}</td>
                  <td className="n">{g.n}</td>
                  {g.suppressed ? <td colSpan={4} className="small text-right">{t('suppressed')}</td> : (
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
      </section>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start mt-4">
        <details className="card card-pad">
          <summary className="h4 cursor-pointer min-h-[28px] flex items-center justify-between gap-3 list-none">{t('explore_how')}<IconChevronDown width={18} height={18} className="text-dim flex-none" /></summary>
          <div className="prose mt-4 text-[15px]">
            <p>{t('explore_how1')}</p><p>{t('explore_how2')}</p><p>{t('explore_how3')}</p>
          </div>
        </details>
        <div className="card card-pad flex flex-col gap-3 items-start">
          <h2 className="h4">{t('explore_next_t')}</h2>
          <p className="small">{t('explore_next_b')}</p>
          <Link to="/analyse" className="btn btn-primary btn-sm mt-1">{t('home_cta1')}<IconArrowRight /></Link>
        </div>
      </div>
      <div className="mt-6"><UseNotice /></div>
    </div>
  );
}
