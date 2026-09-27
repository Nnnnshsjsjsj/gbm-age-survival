import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useCommunity } from '../context/CommunityContext.jsx';
import { SectionHead } from '../components/ui.jsx';
import ForestPlot, { ForestSkeleton } from '../components/ForestPlot.jsx';
import { IconArrowRight, IconUpload, IconChart, IconLayers, IconCheck, IconCheckCircle, IconAlert, IconLock } from '../components/Icons.jsx';
import { heroPool, demoAnalysis, ciOf } from '../lib/showcase.js';
import { metaRandomEffects } from '../engine/index.js';
import { methodsParagraph } from '../lib/methods.js';
import { translate } from '../i18n.js';
import { fmt, pText } from '../lib/format.js';

const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return true; } };

/** Counts up once when it scrolls into view. Screen readers get the final value only. */
function CountUp({ value, format = (v) => String(v) }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(() => (reduced() || value === 0 ? value : 0));
  useEffect(() => {
    if (reduced() || value === 0 || typeof IntersectionObserver === 'undefined') { setShown(value); return undefined; }
    let raf = 0;
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1200;
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        setShown(Math.round(value * (1 - (1 - p) ** 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);
  return <span ref={ref}><span aria-hidden="true">{format(shown)}</span><span className="sr-only">{format(value)}</span></span>;
}

function usePromise(fn) {
  const [state, setState] = useState({ data: null, error: null });
  useEffect(() => {
    let alive = true;
    fn().then((data) => alive && setState({ data, error: null })).catch((error) => alive && setState({ data: null, error }));
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}

/** The product visual: a glass window with the live 13-cohort forest plot. Real component, real numbers. */
function HeroWindow() {
  const { t } = useApp();
  const { data, error } = usePromise(heroPool);
  const items = data ? [
    ...data.studies.map((s, i) => ({ type: 'row', label: s.label, ...ciOf(s.logHR, s.se), color: s.type === 'ref' ? 'var(--accent)' : 'var(--accent-2)', weight: data.meta.weights[i] })),
    { type: 'pooled', label: t('cmp_pooled'), sub: `k=${data.studies.length}`, hr: data.meta.HR, lo: data.meta.loHK, hi: data.meta.hiHK },
    ...(data.meta.predLo != null ? [{ type: 'pred', label: t('pool_pi'), lo: data.meta.predLo, hi: data.meta.predHi }] : []),
  ] : null;
  const n = data ? data.studies.reduce((a, s) => a + (s.n || 0), 0) : 0;
  return (
    <div className="window" data-testid="hero-window">
      <div className="window-bar">
        <span className="tl" aria-hidden="true" /><span className="tl" aria-hidden="true" /><span className="tl" aria-hidden="true" />
        <span className="window-title">{t('win_title')}</span>
        <span className="window-live">{t('win_live')}</span>
      </div>
      <div className="window-body">
        <div className="window-main">
          <div className="window-legend" aria-hidden="true">
            <span><i style={{ background: 'var(--accent)' }} />{t('win_ref')}</span>
            <span><i style={{ background: 'var(--accent-2)' }} />{t('win_pub')}</span>
          </div>
          {items ? <ForestPlot items={items} title={t('forest_title')} compact animate />
            : error ? <p className="small py-12">{t('error_load', { what: 'reference' })}</p>
              : <div style={{ minHeight: 400, paddingTop: 12 }}><ForestSkeleton rows={14} /></div>}
        </div>
        <div className="window-side">
          <div className="wstat">
            <div className="k">{t('win_pooled')}</div>
            <div className="v g">{data ? fmt(data.meta.HR) : '—'}</div>
          </div>
          <div className="wstat">
            <div className="k">{t('win_ci')}</div>
            <div className="v sm">{data ? `${fmt(data.meta.loHK)}–${fmt(data.meta.hiHK)}` : '—'}</div>
          </div>
          <div className="wstat">
            <div className="k">{t('win_k')}</div>
            <div className="v sm">{data ? data.studies.length : '—'}</div>
            <div className="s">{data ? `n = ${n.toLocaleString('en-US')}` : ' '}</div>
          </div>
          <div className="wstat">
            <div className="k">{t('win_i2')}</div>
            <div className="v sm">{data ? `I² ${Math.round(data.meta.I2)}%` : '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bento() {
  const { t, lang } = useApp();
  const demo = usePromise(demoAnalysis);
  const pool = usePromise(heroPool);

  const five = useMemo(() => {
    if (!demo.data || !pool.data) return null;
    const m = demo.data.analysis.ageModel.model;
    const refs = pool.data.refs;
    const meta = metaRandomEffects([...refs.map((r) => r.stats.cox.beta[0]), m.beta[0]], [...refs.map((r) => r.stats.cox.se[0]), m.se[0]]);
    return [
      { type: 'row', label: t('b_demo'), sub: `n=${demo.data.analysis.n}`, hr: m.hr[0], lo: m.lo[0], hi: m.hi[0], color: 'var(--accent)', highlight: true },
      ...refs.map((r) => ({ type: 'row', label: r.name, sub: `n=${r.stats.n}`, hr: r.stats.cox.hr[0], lo: r.stats.cox.lo[0], hi: r.stats.cox.hi[0], color: 'var(--accent-2)' })),
      { type: 'pooled', label: t('cmp_pooled'), sub: `k=${refs.length + 1}`, hr: meta.HR, lo: meta.loHK, hi: meta.hiHK },
    ];
  }, [demo.data, pool.data, t]);

  const methods = demo.data ? methodsParagraph(lang, demo.data.analysis, { dropped: demo.data.checks.dropped, timeUnit: demo.data.mapping.timeUnit }) : '';
  const sch = demo.data ? demo.data.analysis.schoenfeldP : null;
  const schOk = sch != null && sch > 0.05;
  const meta = pool.data?.meta;

  return (
    <div className="bento">
      <article className="card spot ba reveal">
        <p className="blabel">{t('win_live')}</p>
        <h3>{t('b1_t')}</h3>
        <p className="bt">{t('b1_b')}</p>
        {five && (
          <div className="minitiles">
            <div><div className="k">{t('b_demo')}</div><div className="v">{fmt(five[0].hr)}</div></div>
            <div><div className="k">{t('b_pooled')}</div><div className="v">{fmt(five[five.length - 1].hr)}</div></div>
            <div><div className="k">{t('b_overlap')}</div><div className="v">{five[0].lo <= five[five.length - 1].hi && five[0].hi >= five[five.length - 1].lo ? <><IconCheck />{t('yes')}</> : t('no')}</div></div>
          </div>
        )}
        <div className="bvis">
          {five ? <ForestPlot items={five} title={t('forest_title')} compact /> : <div style={{ minHeight: 220 }}><ForestSkeleton rows={6} /></div>}
        </div>
      </article>
      <article className="card spot bb reveal" style={{ '--i': 1 }}>
        <h3>{t('b2_t')}</h3>
        <p className="bt">{t('b2_b')}</p>
        <div className="bvis">
          <div className="snippet" aria-hidden="true">{methods || ' '}</div>
        </div>
      </article>
      <article className="card spot bc reveal" style={{ '--i': 2 }}>
        <h3>{t('b3_t')}</h3>
        <p className="bt">{t('b3_b')}</p>
        <div className="bvis">
          {demo.data ? (
            <span className={`checkpill${schOk ? '' : ' warn'}`}>{schOk ? <IconCheckCircle /> : <IconAlert />}{pText(sch)} · {t(schOk ? 'b3_pass' : 'b3_warn')}</span>
          ) : <span className="skel" style={{ width: 220, height: 34, borderRadius: 999 }} />}
        </div>
      </article>
      <article className="card spot bd reveal">
        <span className="lockbox" aria-hidden="true"><IconLock /></span>
        <h3>{t('b4_t')}</h3>
        <p className="bt">{t('b4_b')}</p>
        <div className="bvis bigmetric"><span className="v">0</span><span className="k">{t('b4_metric')}</span></div>
      </article>
      <article className="card spot be reveal" style={{ '--i': 1 }}>
        <h3>{t('b5_t')}</h3>
        <p className="bt">{t('b5_b')}</p>
        <div className="bvis kv">
          <div><span>I²</span><b>{meta ? `${Math.round(meta.I2)}%` : '—'}</b></div>
          <div><span>{t('pool_pi')}</span><b>{meta && meta.predLo != null ? `${fmt(meta.predLo)}–${fmt(meta.predHi)}` : '—'}</b></div>
          <div><span>τ</span><b>{meta ? fmt(meta.tau, 4) : '—'}</b></div>
        </div>
      </article>
      <article className="card spot bf reveal" style={{ '--i': 2 }}>
        <h3>{t('b6_t')}</h3>
        <p className="bt">{t('b6_b')}</p>
        <div className="bvis" aria-hidden="true">
          <span className="langtoggle"><span className={lang === 'en' ? 'on' : ''}>EN</span><span className={lang === 'ru' ? 'on' : ''}>RU</span></span>
          <div className="bilines">
            <span lang={lang}>{translate(lang, 'hr_year')}</span>
            <span lang={lang === 'en' ? 'ru' : 'en'}>{translate(lang === 'en' ? 'ru' : 'en', 'hr_year')}</span>
          </div>
        </div>
      </article>
    </div>
  );
}

export default function Home() {
  const { t, lang } = useApp();
  const { stats } = useCommunity();
  const researchers = stats && Number(stats.researchers) > 0 ? Number(stats.researchers) : 0;
  const nf = (v) => v.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US');

  return (
    <div>
      <section className="hero">
        <div className="shell">
          <div className="hero-copy">
            <span className="eyebrow">{t('home_kicker')}</span>
            <h1 className="display mt-7">
              {t('home_h1_a')}<br />
              <span className="hl">{t('home_h1_hl')}</span>{t('home_h1_b')}
            </h1>
            <p className="lede">{t('home_lede')}</p>
            <div className="btnrow mt-9">
              <Link to="/analyse" className="btn btn-primary btn-lg">{t('home_cta1')}<IconArrowRight /></Link>
              <Link to="/explore" className="btn btn-ghost btn-lg">{t('home_cta2')}</Link>
            </div>
            <p className="hero-note">{t('home_note').split(' · ').map((x) => <span key={x}>{x}</span>)}</p>
          </div>

          <div className="hero-visual">
            <HeroWindow />
          </div>

          <p className="sources">
            <span className="lbl">{t('home_sources')}</span>
            <b>TCGA-GBM</b><b>CGGA</b><b>MSK-IMPACT</b><b>CPTAC-GBM</b><b>{t('home_sources_pub')}</b>
          </p>

          <ul className={`statstrip${researchers > 0 ? ' five' : ''}`} aria-label={t('home_numbers')}>
            <li><div className="v"><CountUp value={4} /></div><div className="k">{t('chip_refs')}</div></li>
            <li><div className="v"><CountUp value={1392} format={nf} /></div><div className="k">{t('chip_patients')}</div></li>
            <li><div className="v"><CountUp value={13} /></div><div className="k">{t('chip_pool')}</div></li>
            <li><div className="v">0</div><div className="k">{t('chip_rows')}</div></li>
            {researchers > 0 && <li data-testid="chip-researchers"><div className="v"><CountUp value={researchers} /></div><div className="k"><span className="live" aria-hidden="true" />{t('chip_researchers')}</div></li>}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="how-h">
        <div className="shell">
          <SectionHead kicker={t('how_kicker')} title={t('how_title')} sub={t('how_sub')} id="how-h" />
          <div className="how track">
            {[['01', IconUpload, 'how1'], ['02', IconChart, 'how2'], ['03', IconLayers, 'how3']].map(([n, Icon, k], i) => (
              <div key={k} className="card card-pad spot reveal" style={{ '--i': i }}>
                <div className="num"><span>{n}</span><span className="ic" aria-hidden="true"><Icon /></span></div>
                <h3 className="h4">{t(`${k}_t`)}</h3>
                <p>{t(`${k}_b`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="bento-h">
        <div className="shell">
          <SectionHead kicker={t('bento_kicker')} title={t('bento_title')} sub={t('bento_sub')} id="bento-h" />
          <Bento />
        </div>
      </section>

      <section className="section" aria-labelledby="spaces-h">
        <div className="shell">
          <SectionHead kicker={t('spaces_kicker')} title={t('spaces_title')} sub={t('spaces_sub')} id="spaces-h" />
          <div className="spaces">
            {['research', 'family'].map((s, i) => (
              <div key={s} data-space={s} className="card spacecard gborder reveal" style={{ '--i': i }}>
                <span className="kicker-pill self-start">{t(s === 'research' ? 'space_research' : 'space_family')}</span>
                <h3>{t(`spaces_${s}_t`)}</h3>
                <ul>
                  {[1, 2, 3].map((j) => <li key={j}><IconCheck />{t(`spaces_${s}_${j}`)}</li>)}
                </ul>
                <div>
                  <Link to={s === 'research' ? '/research' : '/families'} className="btn btn-primary">{t(s === 'research' ? 'spaces_research_btn' : 'spaces_family_btn')}<IconArrowRight /></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="fine-h">
        <div className="shell duo">
          <div className="reveal">
            <div className="kicker kicker-dot">{t('fine_kicker')}</div>
            <h2 className="h2 mt-4" id="fine-h">{t('fine_title')}</h2>
            <ul className="quietlist mt-10">
              {['data', 'prog', 'mod', 'sep'].map((k) => (
                <li key={k}><span className="tag">{t(`fine_${k}_tag`)}</span><p><b>{t(`fine_${k}_b`)}</b> {t(`fine_${k}`)}</p></li>
              ))}
            </ul>
          </div>
          <figure className="card card-lg quote m-0 reveal" style={{ '--i': 1 }}>
            <span className="kicker-pill">{t('quote_kicker')}</span>
            <blockquote className="q m-0">{t('quote')}</blockquote>
            <figcaption className="a">{t('quote_by')}</figcaption>
            <Link to="/rules" className="btn btn-ghost">{t('read_rules')}</Link>
          </figure>
        </div>
      </section>

      <section className="section pt-0 border-t-0" aria-labelledby="cta-h">
        <div className="shell">
          <div className="ctaband gborder reveal">
            <span className="kicker kicker-dot">{t('cta_kicker')}</span>
            <h2 className="h2 mt-5" id="cta-h">{t('cta_title')}</h2>
            <p className="sub">{t('cta_body')}</p>
            <div className="btnrow">
              <Link to="/analyse" className="btn btn-primary btn-lg">{t('home_cta1')}<IconArrowRight /></Link>
              <Link to="/explore" className="btn btn-ghost btn-lg">{t('home_cta2')}</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
