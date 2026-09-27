// Home = the story. One fixed WebGL canvas behind the page; the brain travels with the scroll (storyStore.js).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { HUB_STATS } from '../data/hubStats.js';
import KMChart, { GROUP_COLORS, ChartSkeleton } from '../components/KMChart.jsx';
import ForestPlot, { ForestSkeleton } from '../components/ForestPlot.jsx';
import { BrainStage, StoryCanvas, BrainFallback } from '../components/BrainStage.jsx';
import { IconArrowRight, IconArrowDown, IconUpload, IconChart, IconLayers, IconBook, IconHeart, IconShield, IconLock } from '../components/Icons.jsx';
import { referenceStats, allReferenceStats, loadPublished } from '../lib/reference.js';
import { metaRandomEffects } from '../engine/index.js';
import { fmt } from '../lib/format.js';
import { ScrollTrigger, reducedMotion, isMobile, scrollToEl } from '../motion/core.js';
import { SplitText, Reveal, Magnetic, Marquee, CountUp, ScrollWords, HorizontalStrip, useInView } from '../motion/components.jsx';
import Preloader, { shouldShowPreloader } from '../motion/Preloader.jsx';
import { story, POSES } from '../three/storyStore.js';
import { STATE_COLORS } from '../three/palette.js';

const Z = 1.959964;
const SOURCES = ['TCGA-GBM', 'CGGA', 'MSK-IMPACT', 'CPTAC-GBM', 'RTOG 0525', 'SEER', 'Ohio BTS', 'Copenhagen', 'Norway', 'Dana-Farber', 'Western Norway', 'RANO resect', 'Bergen–Oslo'];

function usePromise(fn) {
  const [state, setState] = useState({ data: null, error: null });
  useEffect(() => {
    let alive = true;
    fn().then((data) => alive && setState({ data, error: null })).catch((error) => alive && setState({ data: null, error }));
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}

/** The 13 cohorts with the fields the cards need (same sources and maths as the Pool page). */
async function loadCohorts() {
  const [refs, pub] = await Promise.all([allReferenceStats(), loadPublished()]);
  const studies = [
    ...refs.map((r) => ({ label: r.name, country: r.country, years: r.years, n: r.stats.n, type: 'ref', logHR: r.stats.cox.beta[0], se: r.stats.cox.se[0] })),
    ...pub.filter((p) => p.pooled && p.lo_year > 0 && p.hi_year > p.lo_year).map((p) => ({
      label: p.cohort.replace(/\s*\(([^)]*)\)$/, ''), cite: (p.cohort.match(/\(([^)]*)\)$/) || [])[1], country: p.country, years: p.years, n: p.n, type: 'pub',
      logHR: Math.log(p.HR_year), se: (Math.log(p.hi_year) - Math.log(p.lo_year)) / (2 * Z),
    })),
  ];
  const meta = metaRandomEffects(studies.map((s) => s.logHR), studies.map((s) => s.se));
  return { studies: studies.map((s) => ({ ...s, hr: Math.exp(s.logHR), lo: Math.exp(s.logHR - Z * s.se), hi: Math.exp(s.logHR + Z * s.se) })), meta };
}

/* ---------------------------------------------------------------- hero */
function Hero({ play }) {
  const { t } = useApp();
  return (
    <section className="st-hero" id="story-top" data-pose="hero" aria-labelledby="st-h1">
      <div className="shell st-hero-in">
        <span className="eyebrow st-kick">{t('st_kicker')}</span>
        <div className="st-hero-bottom">
          <h1 className="st-display" id="st-h1">
            <SplitText lines={[{ text: t('st_h1_a') }, { text: t('st_h1_b'), className: 'hl' }]} play={play} stagger={90} />
          </h1>
          <div className="st-hero-side">
            <p className="lede">{t('st_lede')}</p>
            <div className="btnrow mt-7">
              <Magnetic>
                <button type="button" className="btn btn-primary btn-lg" onClick={() => scrollToEl('ch1', { offset: 0 })}>{t('st_cta1')}<IconArrowDown /></button>
              </Magnetic>
              <Link to="/analyse" className="btn btn-ghost btn-lg">{t('st_cta2')}</Link>
            </div>
          </div>
        </div>
      </div>
      <Marquee items={SOURCES} className="st-marquee" label={t('st_sources')} />
    </section>
  );
}

/* ---------------------------------------------------------------- chapter 01: the tumour (pinned) */
const CAPS = [['core', 'cap_core'], ['rim', 'cap_rim'], ['oedema', 'cap_oedema'], ['infiltration', 'cap_infil']];

function ChapterTumour({ motion }) {
  const { t } = useApp();
  const sec = useRef(null);
  const stage = useRef(null);
  const [step, setStep] = useState(motion ? -1 : CAPS.length - 1);
  useEffect(() => {
    if (!motion) return undefined;
    const st = ScrollTrigger.create({
      trigger: sec.current, start: 'top top', end: '+=150%', pin: stage.current, scrub: true, anticipatePin: 1,
      onUpdate: (s) => {
        const n = Math.min(CAPS.length - 1, Math.floor(s.progress * (CAPS.length + 0.6)));
        setStep(n);
        CAPS.forEach(([k], i) => { story.labels[k] = s.isActive && n >= i; });
      },
      onToggle: (s) => { if (!s.isActive) CAPS.forEach(([k]) => { story.labels[k] = false; }); },
    });
    return () => { st.kill(); CAPS.forEach(([k]) => { story.labels[k] = false; }); };
  }, [motion]);

  return (
    <section className="st-chapter st-ch1" id="ch1" ref={sec} aria-labelledby="ch1-h">
      <div className="st-stage" ref={stage} data-pose="tumour">
        <div className="shell st-split">
          <div className="st-copy">
            <div className="kicker kicker-dot">{t('ch1_kicker')}</div>
            <h2 className="st-h2" id="ch1-h">{t('ch1_title')}</h2>
            <p className="st-sub">{t('ch1_sub')}</p>
            <ol className="st-caps">
              {CAPS.map(([k, key], i) => (
                <li key={k} className={step >= i ? 'on' : ''} aria-current={step === i ? 'step' : undefined}>
                  <span className="n mono">{String(i + 1).padStart(2, '0')}</span>
                  <p><b>{t(`${key}_t`)}</b> — {t(`${key}_b`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      <div className="shell">
        <ul className="st-facts" aria-label={t('facts_label')}>
          {[['14.6', 1, 'fact_os'], ['7.1', 1, 'fact_5y'], ['66', 0, 'fact_age']].map(([v, d, k], i) => (
            <Reveal as="li" key={k} i={i}>
              <div className="v"><CountUp value={Number(v)} decimals={d} className="g" /><span className="u">{t(`${k}_u`)}</span></div>
              <p className="l">{t(`${k}_l`)}</p>
              <p className="src mono">{t(`${k}_src`)}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- chapter 02: four cell states */
const STATES = [['MES', 'state_mes'], ['AC', 'state_ac'], ['OPC', 'state_opc'], ['NPC', 'state_npc']];
function ChapterStates() {
  const { t } = useApp();
  return (
    <section className="st-chapter st-ch2" id="ch2" aria-labelledby="ch2-h">
      <div className="shell st-split" data-pose="states">
        <div className="st-copy">
          <Reveal className="kicker kicker-dot">{t('ch2_kicker')}</Reveal>
          <Reveal as="h2" className="st-h2" id="ch2-h" i={1}>{t('ch2_title')}</Reveal>
          <Reveal as="p" className="st-sub" i={2}>{t('ch2_sub')}</Reveal>
          <ul className="st-states">
            {STATES.map(([code, key], i) => (
              <Reveal as="li" key={code} i={i}>
                <span className="chip-state mono" style={{ '--c': STATE_COLORS[i] }}><i aria-hidden="true" />{code}</span>
                <span>{t(key)}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
      <div className="shell st-manifesto" data-pose="words">
        <ScrollWords text={t('ch2_manifesto')} className="st-words" accent={t('ch2_manifesto_hl')} />
        <div className="st-rho">
          <span className="k mono">{t('ch2_stats_label')}</span>
          <ul>
            <li><b className="mono">ρ = 0.04</b><span>TCGA, n = 437</span></li>
            <li><b className="mono">ρ = 0.07</b><span>CGGA, n = 218</span></li>
            <li><b className="mono">MATH ρ = −0.18</b><span>n = 375</span></li>
          </ul>
          <Link className="st-link" to="/about#heterogeneity">{t('ch2_link')}<IconArrowRight /></Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- chapter 03: age */
function ChapterAge() {
  const { t } = useApp();
  const { data } = usePromise(() => referenceStats('tcga_gbm'));
  const [ref, inView] = useInView({ threshold: 0.25 });
  const groups = data ? data.bands.groups.filter((g) => !g.suppressed) : [];
  const series = groups.map((g, i) => ({ label: `${g.label} (n=${g.n})`, km: g.km, color: GROUP_COLORS[i] }));
  return (
    <section className="st-chapter st-ch3" id="ch3" aria-labelledby="ch3-h">
      <div className="shell">
        <div className="st-age" data-pose="age">
          <div />
          <div>
            <Reveal className="kicker kicker-dot">{t('ch3_kicker')}</Reveal>
            <h2 className="st-kinetic" id="ch3-h">
              {t('ch3_title_a')} <CountUp value={3} format={(v) => `${Math.round(v)}%`} className="hl" />{t('ch3_title_b')}
            </h2>
            <Reveal as="p" className="st-sub" i={1}>{t('ch3_sub')}</Reveal>
          </div>
        </div>
        <div className="st-km" ref={ref}>
          <Reveal className="card card-pad glass">
            <p className="kicker mb-3">{t('ch3_km_title')}</p>
            {data && inView ? <KMChart series={series} title={t('ch3_km_title')} tmax={60} draw /> : <ChartSkeleton />}
          </Reveal>
          <ul className="st-tiles">
            {(groups.length ? groups : [{ label: '<50' }, { label: '50–59' }, { label: '60–69' }, { label: '≥70' }]).map((g, i) => (
              <Reveal as="li" key={g.label} i={i} style={{ '--c': GROUP_COLORS[i] }}>
                <span className="k mono"><i aria-hidden="true" />{g.label}</span>
                <span className="v mono">{g.median != null ? fmt(g.median, 1) : '—'}</span>
                <span className="u">{t('ch3_median')}, {t('ch3_months')}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- chapter 04: thirteen cohorts */
function Glyph({ lo, hr, hi, pooled }) {
  const x = (v) => 4 + ((Math.min(1.06, Math.max(0.995, v)) - 0.995) / 0.065) * 112;
  return (
    <svg className="glyph" viewBox="0 0 120 20" aria-hidden="true">
      <line x1={x(1)} x2={x(1)} y1="2" y2="18" stroke="var(--line-strong)" strokeDasharray="2 2" />
      <line x1={x(lo)} x2={x(hi)} y1="10" y2="10" stroke={pooled ? 'url(#g-pool)' : 'var(--accent-2)'} strokeWidth="2" strokeLinecap="round" />
      {pooled ? <path d={`M${x(lo)} 10 L${x(hr)} 4 L${x(hi)} 10 L${x(hr)} 16 Z`} fill="url(#g-pool)" /> : <rect x={x(hr) - 3} y="7" width="6" height="6" rx="1.5" fill="var(--accent)" />}
    </svg>
  );
}

function ChapterCohorts() {
  const { t } = useApp();
  const { data, error } = usePromise(loadCohorts);
  const [ref, inView] = useInView({ threshold: 0.12 });
  const items = data ? [
    ...data.studies.map((s) => ({ type: 'row', label: s.label, sub: `n=${s.n}`, hr: s.hr, lo: s.lo, hi: s.hi, color: s.type === 'ref' ? 'var(--accent)' : 'var(--accent-2)', weight: undefined })),
    { type: 'pooled', label: t('cmp_pooled'), sub: `k=${data.studies.length}`, hr: data.meta.HR, lo: data.meta.loHK, hi: data.meta.hiHK },
    ...(data.meta.predLo != null ? [{ type: 'pred', label: t('pool_pi'), lo: data.meta.predLo, hi: data.meta.predHi }] : []),
  ] : null;
  const m = data?.meta;
  return (
    <section className="st-chapter st-ch4" id="ch4" aria-labelledby="ch4-h">
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <defs><linearGradient id="g-pool" x1="0" x2="1"><stop offset="0" stopColor="#5EF2B8" /><stop offset="1" stopColor="#4CC9F0" /></linearGradient></defs>
      </svg>
      <HorizontalStrip label={t('ch4_strip')} hint={t('swipe_hint')} head={(
        <div className="shell st-ch4-head" data-pose="cohorts">
          <Reveal className="kicker kicker-dot">{t('ch4_kicker')}</Reveal>
          <Reveal as="h2" className="st-h2" id="ch4-h" i={1}>{t('ch4_title')}</Reveal>
          <Reveal as="p" className="st-sub" i={2}>{t('ch4_sub')}</Reveal>
        </div>
      )}>
        {(data ? data.studies : Array.from({ length: 6 }, () => null)).map((s, i) => (
          <article key={s ? s.label : i} className="card cohort-card">
            {s ? (
              <>
                <div className="cc-top"><span className="mono cc-n">{String(i + 1).padStart(2, '0')}</span><span className={`cc-type ${s.type}`}>{t(s.type === 'ref' ? 'ch4_ref' : 'ch4_pub')}</span></div>
                <h3>{s.label}</h3>
                <p className="cc-meta mono">{s.country} · {s.years} · n = {s.n.toLocaleString('en-US')}</p>
                <div className="cc-hr"><span className="k">{t('ch4_hr')}</span><span className="v mono">{fmt(s.hr, 3)}</span></div>
                <p className="cc-ci mono">{t('ch4_ci')} {fmt(s.lo, 3)}–{fmt(s.hi, 3)}</p>
                <Glyph lo={s.lo} hr={s.hr} hi={s.hi} />
              </>
            ) : <span className="skel skel-block" style={{ height: 180 }} />}
          </article>
        ))}
        <article className="card cohort-card pooled gborder">
          <div className="cc-top"><span className="mono cc-n">Σ</span><span className="cc-type pooled">{t('ch4_pooled')}</span></div>
          <h3 className="hl">{m ? `${fmt(m.HR, 3)}` : '—'}</h3>
          <p className="cc-meta">{t('ch4_hr')}</p>
          <p className="cc-ci mono">{m ? `${t('ch4_ci')} ${fmt(m.loHK, 3)}–${fmt(m.hiHK, 3)}` : ' '}</p>
          <p className="cc-ci mono">{m && m.predLo != null ? `${t('pool_pi')} ${fmt(m.predLo, 3)}–${fmt(m.predHi, 3)}` : ' '}</p>
          {m && <Glyph lo={m.predLo ?? m.loHK} hr={m.HR} hi={m.predHi ?? m.hiHK} pooled />}
        </article>
      </HorizontalStrip>
      <div className="shell st-forest" ref={ref}>
        <Reveal className="card card-pad glass">
          <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
            <p className="kicker">{t('ch4_forest')}</p>
            <Link to="/pool" className="st-link">{t('ch4_open_pool')}<IconArrowRight /></Link>
          </div>
          {items && inView ? <ForestPlot items={items} title={t('ch4_forest')} animate />
            : error ? <p className="small py-8">{t('error_load', { what: 'reference' })}</p> : <ForestSkeleton rows={15} />}
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- chapter 05: your cohort */
function ChapterYou() {
  const { t } = useApp();
  return (
    <section className="st-chapter st-ch5" id="ch5" aria-labelledby="ch5-h">
      <div className="shell st-you" data-pose="you">
        <div />
        <Reveal className="st-panel gborder glass">
          <div className="kicker kicker-dot">{t('ch5_kicker')}</div>
          <h2 className="st-h2" id="ch5-h">{t('ch5_title')}</h2>
          <ol className="st-steps">
            {[[IconUpload, 'ch5_s1'], [IconChart, 'ch5_s2'], [IconLayers, 'ch5_s3']].map(([Icon, k], i) => (
              <li key={k}><span className="ic" aria-hidden="true"><Icon /></span><span className="n mono">{String(i + 1).padStart(2, '0')}</span><b>{t(`${k}_t`)}</b><span>{t(`${k}_b`)}</span></li>
            ))}
          </ol>
          <div className="st-panel-foot">
            <Magnetic><Link to="/analyse" className="btn btn-primary btn-lg">{t('ch5_cta')}<IconArrowRight /></Link></Magnetic>
            <span className="mono st-bytes"><IconLock width={16} height={16} />{t('ch5_bytes')}</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- chapter 06: two guides */
function ChapterGuides() {
  const { t } = useApp();
  const S = HUB_STATS;
  return (
    <section className="st-chapter st-ch6" id="ch6" aria-labelledby="ch6-h">
      <div className="shell" data-pose="people">
        <Reveal className="kicker kicker-dot">{t('ch6_kicker')}</Reveal>
        <Reveal as="h2" className="st-h2" id="ch6-h" i={1}>{t('ch6_title')}</Reveal>
        <div className="st-people">
          <Reveal className="card spot st-person" data-space="research">
            <span className="ic" aria-hidden="true"><IconBook /></span>
            <h3>{t('nav_hub')}</h3>
            <p>{t('ch6_research')}</p>
            <p className="mono small st-counts"><span><b>{S.papers}</b> {t('ch6_n_papers')}</span><span><b>{S.tools}</b> {t('ch6_n_tools')}</span><span><b>{S.paths}</b> {t('ch6_n_paths')}</span></p>
            <Link to="/hub" className="st-link">{t('ch6_research_link')}<IconArrowRight /></Link>
          </Reveal>
          <Reveal className="card spot st-person" data-space="family" i={1}>
            <span className="ic" aria-hidden="true"><IconHeart /></span>
            <h3>{t('nav_patients')}</h3>
            <p>{t('ch6_family')}</p>
            <p className="mono small st-counts"><span><b>{S.services}</b> {t('ch6_n_services')}</span><span><b>{S.countries}</b> {t('ch6_n_countries')}</span><span><b>{S.reading}</b> {t('ch6_n_reading')}</span></p>
            <Link to="/patients" className="st-link">{t('ch6_family_link')}<IconArrowRight /></Link>
          </Reveal>
        </div>
        <Reveal as="p" className="st-mod mono"><IconShield width={16} height={16} />{t('ch6_mod')}</Reveal>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- page */
export default function Home() {
  const { t, theme } = useApp();
  const root = useRef(null);
  const [intro, setIntro] = useState(() => shouldShowPreloader());
  const [env] = useState(() => ({ reduce: reducedMotion(), mobile: isMobile() }));
  const motion = !env.reduce && !env.mobile;
  story.travel = motion;
  story.still = env.reduce;

  const labels = useMemo(() => ({
    core: t('lbl_core'), rim: t('lbl_rim'), oedema: t('lbl_oedema'), infiltration: t('lbl_infiltration'),
    frontal: t('lbl_frontal'), temporal: t('lbl_temporal'), cerebellum: t('lbl_cerebellum'),
  }), [t]);

  // keyframes for the travelling brain: one per [data-pose] marker, at the scroll position where it is centred
  useEffect(() => {
    if (!motion) { story.frames = [{ at: 0, pose: POSES.hero }]; return undefined; }
    const marks = [...root.current.querySelectorAll('[data-pose]')];
    const sts = marks.map((el) => ScrollTrigger.create({ trigger: el, start: el.dataset.pose === 'hero' ? 'top top' : 'center center' }));
    const tumourSec = root.current.querySelector('#ch1');
    const compute = () => {
      const frames = sts.map((st, i) => ({ at: st.start, pose: POSES[marks[i].dataset.pose] }));
      const pin = ScrollTrigger.getAll().find((s) => s.pin && s.trigger === tumourSec);
      const tumour = frames.find((f) => f.pose === POSES.tumour);
      if (tumour && pin) { tumour.at = pin.start + 1; frames.push({ at: pin.end - 1, pose: POSES.tumour }); }
      story.frames = frames.sort((a, b) => a.at - b.at);
    };
    compute();
    ScrollTrigger.addEventListener('refresh', compute);
    const onMove = (e) => { story.pointer.x = (e.clientX / window.innerWidth) * 2 - 1; story.pointer.y = (e.clientY / window.innerHeight) * 2 - 1; };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      ScrollTrigger.removeEventListener('refresh', compute);
      sts.forEach((s) => s.kill());
      window.removeEventListener('pointermove', onMove);
      story.frames = [{ at: 0, pose: POSES.hero }];
      story.labels = {};
    };
  }, [motion]);

  // no scrolling while the preloader runs
  useEffect(() => {
    if (!intro) { ScrollTrigger.refresh(); return undefined; }
    window.lenis?.stop();
    document.documentElement.classList.add('is-loading');
    return () => { window.lenis?.start(); document.documentElement.classList.remove('is-loading'); };
  }, [intro]);

  // the 3D chunk and the geometry build are heavy: start them once the preloader curtain has lifted
  const [stage, setStage] = useState(!intro);
  useEffect(() => {
    if (intro || stage) return undefined;
    const id = setTimeout(() => setStage(true), 150);
    return () => clearTimeout(id);
  }, [intro, stage]);

  const fallback = <div className="story-canvas hero-only fallback" aria-hidden="true"><BrainFallback title={t('st_brain_alt')} /></div>;

  return (
    <div className="story" ref={root}>
      {intro && <Preloader onDone={() => setIntro(false)} label={t('pre_label')} />}
      {stage && (
        <BrainStage fallback={fallback}>
          <StoryCanvas mobile={env.mobile} still={env.reduce} theme={theme} labels={labels} />
        </BrainStage>
      )}
      <Hero play={!intro} />
      <ChapterTumour motion={motion} />
      <ChapterStates />
      <ChapterAge />
      <ChapterCohorts />
      <ChapterYou />
      <ChapterGuides />
    </div>
  );
}

