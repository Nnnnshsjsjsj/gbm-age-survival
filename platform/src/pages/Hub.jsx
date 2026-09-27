// Research hub: a guided map of glioblastoma research for newcomers. Everything is in public/hub/research.json.
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useHub, search, paperFields, toolFields, faqFields } from '../lib/hub.js';
import { BrainStage, Constellation } from '../components/BrainStage.jsx';
import { SplitText, Reveal, Magnetic, Marquee, CountUp } from '../motion/components.jsx';
import { reducedMotion, isMobile, scrollToEl } from '../motion/core.js';
import { Notice } from '../components/ui.jsx';
import { IconSearch, IconX, IconArrowRight, IconArrowUpRight, IconHeart, IconChevronDown, IconSparkle, IconCheckCircle } from '../components/Icons.jsx';
import { LINKS } from '../components/Layout.jsx';
import Models from './hub/Models.jsx';
import SectionNav from '../components/SectionNav.jsx';
import { PaperRow, ToolCard, TOPICS, LEVELS, CATS, GROUPS, paperGroup, toolGroup, flash } from './hub/items.jsx';

const QUICK = ['MGMT', 'WHO 2021', 'single-cell', 'Cox', 'BraTS', 'TCGA', 'meta-analysis', 'CAR-T'];
const PAGE = 12;

function Stat({ v, k }) {
  return <div className="hub-stat"><CountUp value={v} className="v mono" /><span className="k">{k}</span></div>;
}

/* ---------------------------------------------------------------- hero with search and the 3D constellation */
function Hero({ data, q, setQ, onPick, pathIds, activeGroup, setActiveGroup }) {
  const { t, theme } = useApp();
  const input = useRef(null);
  const [env] = useState(() => ({ still: reducedMotion(), mobile: isMobile() }));
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) { e.preventDefault(); input.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const items = useMemo(() => (data ? [
    ...data.papers.map((p) => ({ id: p.id, group: paperGroup(p), label: p.title, sub: `${p.authors.split(',')[0]} · ${p.year}` })),
    ...data.toolbox.map((x) => ({ id: x.id, group: toolGroup(x), label: x.name, sub: t(`cat_${x.cat}`) })),
  ] : []), [data, t]);
  const groupLabels = useMemo(() => Object.fromEntries(GROUPS.map((g) => [g.key, t(g.label)])), [t]);
  const [preview, setPreview] = useState(null);
  const [clear, setClear] = useState(0);
  const journals = useMemo(() => (data ? [...new Set(data.papers.map((p) => p.journal))].slice(0, 22) : []), [data]);

  return (
    <section className="hub-hero" aria-labelledby="hub-h1">
      <div className="hub-map">
        {data && (
          <div aria-hidden="true" className="contents"><BrainStage fallback={null}>
            <Constellation items={items} groups={theme === 'light' ? GROUPS.map((g) => ({ ...g, color: g.light })) : GROUPS} groupLabels={groupLabels} pathIds={pathIds} activeGroup={activeGroup}
              onPick={onPick} onGroup={(g) => setActiveGroup((a) => (a === g ? null : g))} still={env.still} light={theme === 'light'} openLabel={t('hub_open')}
              onPreview={setPreview} clearPreview={clear} />
          </BrainStage></div>
        )}
        {preview && (
          <div className="cst-card" role="status">
            <b>{preview.label}</b><span>{preview.sub}</span>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => { onPick(preview.id); setClear((n) => n + 1); }}>{t('hub_open')}</button>
            <button type="button" className="x" aria-label={t('close')} onClick={() => setClear((n) => n + 1)}><IconX width={14} height={14} /></button>
          </div>
        )}
      </div>
      <div className="shell hub-hero-in">
        <span className="eyebrow">{t('hub_kicker')}</span>
        <h1 className="hub-display" id="hub-h1">
          <SplitText lines={[{ text: t('hub_h1_a') }, { text: t('hub_h1_b'), className: 'hl' }]} stagger={70} />
        </h1>
        <p className="lede mt-6">{t('hub_lede')}</p>
        <form className="hub-search mt-8" role="search" onSubmit={(e) => { e.preventDefault(); if (q) scrollToEl('results', { offset: -96 }); }}>
          <label htmlFor="hub-q" className="sr-only">{t('hub_search_label')}</label>
          <IconSearch className="ic" aria-hidden="true" />
          <input id="hub-q" ref={input} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('hub_search_ph')} autoComplete="off" spellCheck="false" />
          {q ? <button type="button" className="iconbtn" onClick={() => { setQ(''); input.current?.focus(); }} aria-label={t('clear')}><IconX /></button> : <kbd aria-hidden="true">/</kbd>}
        </form>
        <div className="hub-quick mt-4">
          <span className="tiny">{t('hub_try')}</span>
          {QUICK.map((w) => <button key={w} type="button" className="chip chip-sm" onClick={() => { setQ(w); setTimeout(() => scrollToEl('results', { offset: -96 }), 50); }}>{w}</button>)}
        </div>
        {data && (
          <div className="hub-stats mt-10">
            <Stat v={data.papers.length} k={t('hub_stat_papers')} />
            <Stat v={data.toolbox.length} k={t('hub_stat_tools')} />
            <Stat v={data.paths.length} k={t('hub_stat_paths')} />
            <Stat v={data.faq.length} k={t('hub_stat_faq')} />
          </div>
        )}
        <p className="tiny hub-maphint mt-6"><IconSparkle width={14} height={14} />{t('hub_map_hint')}</p>
      </div>
      {data && (
        <div className="cst-legend" role="group" aria-label={t('hub_map_legend')}>
          {GROUPS.map((g) => (
            <button key={g.key} type="button" aria-pressed={activeGroup === g.key} style={{ '--c': theme === 'light' ? g.light : g.color }}
              onClick={() => setActiveGroup((a) => (a === g.key ? null : g.key))}><i aria-hidden="true" />{groupLabels[g.key]}</button>
          ))}
        </div>
      )}
      {journals.length > 0 && <Marquee items={journals} className="hub-marquee" label="Journals" />}
    </section>
  );
}

/* ---------------------------------------------------------------- search results */
function Results({ data, q, setQ }) {
  const { t } = useApp();
  const dq = useDeferredValue(q);
  const res = useMemo(() => {
    if (!data || !dq.trim()) return null;
    return {
      papers: search(data.papers, dq, paperFields),
      tools: search(data.toolbox, dq, toolFields),
      faq: search(data.faq, dq, faqFields),
    };
  }, [data, dq]);
  if (!res) return null;
  const n = res.papers.length + res.tools.length + res.faq.length;
  return (
    <section className="shell hub-results" id="results" aria-labelledby="res-h">
      <div className="card card-lg card-pad">
        <div className="card-head">
          <div>
            <h2 id="res-h" className="h3">{t('hub_results_t')}: “{dq}”</h2>
            <p className="small mt-1" aria-live="polite">{t('results_n', { n })}</p>
          </div>
          <button type="button" className="btn btn-soft btn-sm" onClick={() => setQ('')}>{t('clear')}</button>
        </div>
        {n === 0 && <p className="small">{t('no_results')}</p>}
        {res.faq.length > 0 && (
          <div className="res-block">
            <div className="res-kind mono">{t('hub_type_faq')} · {res.faq.length}</div>
            {res.faq.slice(0, 4).map((f) => <FaqItem key={f.q_en} f={f} data={data} open />)}
          </div>
        )}
        {res.papers.length > 0 && (
          <div className="res-block">
            <div className="res-kind mono">{t('hub_type_paper')} · {res.papers.length}</div>
            <div className="paper-list">{res.papers.slice(0, 8).map((p) => <PaperRow key={p.id} p={p} compact />)}</div>
          </div>
        )}
        {res.tools.length > 0 && (
          <div className="res-block">
            <div className="res-kind mono">{t('hub_type_tool')} · {res.tools.length}</div>
            <div className="tool-grid">{res.tools.slice(0, 9).map((x) => <ToolCard key={x.id} x={x} compact />)}</div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- 01 reading paths */
function Paths({ data, byId, active, setActive, onShow }) {
  const { t, lang } = useApp();
  const path = data.paths[active];
  return (
    <section className="hub-sec" id="paths" aria-labelledby="paths-h">
      <div className="shell">
        <Reveal className="kicker kicker-dot">{t('hub_paths_kicker')}</Reveal>
        <Reveal as="h2" className="st-h2" id="paths-h" i={1}>{t('hub_paths_title')}</Reveal>
        <Reveal as="p" className="lede mt-5" i={2}>{t('hub_paths_sub')}</Reveal>
        <div className="path-tabs mt-10" role="tablist" aria-label={t('hub_paths_title')}>
          {data.paths.map((p, i) => (
            <button key={p.id} type="button" role="tab" id={`tab-${p.id}`} aria-selected={i === active} aria-controls="path-panel" className="path-tab" onClick={() => setActive(i)}>
              <span className="mono n">{String(i + 1).padStart(2, '0')}</span>
              <span>{lang === 'ru' ? p.title_ru : p.title_en}</span>
            </button>
          ))}
        </div>
        <div className="path-panel" id="path-panel" role="tabpanel" aria-labelledby={`tab-${path.id}`}>
          <div className="path-intro">
            <p>{lang === 'ru' ? path.blurb_ru : path.blurb_en}</p>
            <button type="button" className="btn btn-soft btn-sm" onClick={onShow}><IconSparkle />{t('hub_path_map')}</button>
          </div>
          <ol className="timeline">
            {path.steps.map((id, i) => byId[id] && (
              <li key={id} className="reveal" style={{ '--i': i % 4 }}>
                <span className="dot" aria-hidden="true" />
                <PaperRow p={byId[id]} step={i + 1} compact />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- 02 library */
function Library({ data, filt, setFilt }) {
  const { t } = useApp();
  const { topic, level, oa, sort, limit } = filt;
  const set = (patch) => setFilt((f) => ({ ...f, limit: PAGE, ...patch }));
  const counts = useMemo(() => Object.fromEntries(TOPICS.map((x) => [x, data.papers.filter((p) => p.topics?.includes(x)).length])), [data]);
  const list = useMemo(() => {
    const lvlRank = { start: 0, core: 1, advanced: 2 };
    let l = data.papers.filter((p) => (!topic || p.topics?.includes(topic)) && (!level || p.level === level) && (!oa || p.open_access));
    if (sort === 'new') l = [...l].sort((a, b) => b.year - a.year);
    else if (sort === 'old') l = [...l].sort((a, b) => a.year - b.year);
    else l = [...l].sort((a, b) => lvlRank[a.level] - lvlRank[b.level] || b.year - a.year);
    return l;
  }, [data, topic, level, oa, sort]);
  return (
    <section className="hub-sec" id="library" aria-labelledby="lib-h">
      <div className="shell">
        <Reveal className="kicker kicker-dot">{t('hub_lib_kicker')}</Reveal>
        <Reveal as="h2" className="st-h2" id="lib-h" i={1}>{t('hub_lib_title')}</Reveal>
        <Reveal as="p" className="lede mt-5" i={2}>{t('hub_lib_sub')}</Reveal>
        <div className="filters mt-10">
          <div role="group" aria-label={t('hub_f_topic')} className="chips xrow-m">
            <button type="button" className="chip" aria-pressed={!topic} onClick={() => set({ topic: null })}>{t('all')} <span className="text-dim">{data.papers.length}</span></button>
            {TOPICS.map((x) => (
              <button key={x} type="button" className="chip" aria-pressed={topic === x} onClick={() => set({ topic: topic === x ? null : x })}>
                {t(`top_${x}`)} <span className="text-dim">{counts[x]}</span>
              </button>
            ))}
          </div>
          <div className="filters-row">
            <div className="segs" role="group" aria-label={t('hub_f_level')}>
              <button type="button" aria-pressed={!level} onClick={() => set({ level: null })}>{t('all')}</button>
              {LEVELS.map((x) => <button key={x} type="button" aria-pressed={level === x} onClick={() => set({ level: x })}>{t(`lvl_${x}`)}</button>)}
            </div>
            <label className="toggle"><input type="checkbox" checked={oa} onChange={(e) => set({ oa: e.target.checked })} /><span>{t('hub_f_oa')}</span></label>
            <label className="sortsel">
              <span className="sr-only">{t('hub_f_sort')}</span>
              <select className="select select-sm" value={sort} onChange={(e) => set({ sort: e.target.value })}>
                <option value="rel">{t('hub_sort_rel')}</option><option value="new">{t('hub_sort_new')}</option><option value="old">{t('hub_sort_old')}</option>
              </select>
            </label>
            <span className="mono tiny ml-auto" aria-live="polite">{t('results_n', { n: list.length })}</span>
          </div>
        </div>
        <div className="paper-list mt-6">
          {list.slice(0, limit).map((p) => <PaperRow key={p.id} p={p} />)}
          {list.length === 0 && <p className="small">{t('no_results')}</p>}
        </div>
        {list.length > limit && (
          <div className="mt-6 text-center">
            <button type="button" className="btn btn-soft" onClick={() => setFilt((f) => ({ ...f, limit: f.limit + PAGE }))}>{t('show_more')} <span className="text-dim mono">+{Math.min(PAGE, list.length - limit)}</span></button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- 03 toolbox */
function Toolbox({ data, cat, setCat }) {
  const { t } = useApp();
  const [limit, setLimit] = useState(12);
  useEffect(() => { setLimit(12); }, [cat]);
  const counts = useMemo(() => Object.fromEntries(CATS.map((c) => [c, data.toolbox.filter((x) => x.cat === c).length])), [data]);
  const order = { start: 0, core: 1, advanced: 2 };
  const list = useMemo(() => data.toolbox.filter((x) => x.cat === cat).sort((a, b) => order[a.level] - order[b.level]), [data, cat]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <section className="hub-sec" id="toolbox" aria-labelledby="tb-h">
      <div className="shell">
        <Reveal className="kicker kicker-dot">{t('hub_tb_kicker')}</Reveal>
        <Reveal as="h2" className="st-h2" id="tb-h" i={1}>{t('hub_tb_title')}</Reveal>
        <Reveal as="p" className="lede mt-5" i={2}>{t('hub_tb_sub')}</Reveal>
        <div className="tb-tabs mt-10" role="tablist" aria-label={t('hub_tb_title')}>
          {CATS.map((c) => (
            <button key={c} type="button" role="tab" aria-selected={cat === c} aria-controls="tb-panel" id={`tbt-${c}`} className="tb-tab" onClick={() => setCat(c)}>
              {t(`cat_${c}`)} <span className="mono">{counts[c]}</span>
            </button>
          ))}
        </div>
        <div className="tool-grid mt-6" id="tb-panel" role="tabpanel" aria-labelledby={`tbt-${cat}`}>
          {list.slice(0, limit).map((x) => <ToolCard key={x.id} x={x} />)}
        </div>
        {list.length > limit && (
          <div className="mt-6 text-center">
            <button type="button" className="btn btn-soft" onClick={() => setLimit(list.length)}>{t('show_all_n', { n: list.length })}</button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- 05 FAQ */
function FaqItem({ f, data, open = false }) {
  const { lang } = useApp();
  const names = useMemo(() => Object.fromEntries([...data.toolbox.map((x) => [x.id, x.name]), ...data.papers.map((p) => [p.id, `${p.authors.split(' ')[0]} ${p.year}`])]), [data]);
  return (
    <details className="faq" open={open || undefined}>
      <summary><span>{lang === 'ru' ? f.q_ru : f.q_en}</span><IconChevronDown width={18} height={18} /></summary>
      <div className="faq-body">
        <p>{lang === 'ru' ? f.a_ru : f.a_en}</p>
        {f.links?.length > 0 && (
          <div className="paper-links mt-3">
            {f.links.filter((id) => names[id]).map((id) => <button key={id} type="button" className="linkchip" onClick={() => flash(id)}>{names[id]}<IconArrowRight width={13} height={13} /></button>)}
          </div>
        )}
      </div>
    </details>
  );
}

/* ---------------------------------------------------------------- page */
export default function Hub() {
  const { t } = useApp();
  const { data, error } = useHub('research');
  const [q, setQ] = useState('');
  const [pathIdx, setPathIdx] = useState(0);
  const [showPath, setShowPath] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);
  const [filt, setFilt] = useState({ topic: null, level: null, oa: false, sort: 'rel', limit: PAGE });
  const [cat, setCat] = useState('data');
  const byId = useMemo(() => (data ? Object.fromEntries(data.papers.map((p) => [p.id, p])) : {}), [data]);

  // open any item: make it visible in its section, then scroll to it
  const onPick = useCallback((id) => {
    if (!data) return;
    const pi = data.papers.findIndex((p) => p.id === id);
    if (pi >= 0) {
      const lvlRank = { start: 0, core: 1, advanced: 2 };
      const order = [...data.papers].sort((a, b) => lvlRank[a.level] - lvlRank[b.level] || b.year - a.year);
      const idx = order.findIndex((p) => p.id === id);
      setFilt({ topic: null, level: null, oa: false, sort: 'rel', limit: Math.max(PAGE, Math.ceil((idx + 1) / PAGE) * PAGE) });
    } else {
      const x = data.toolbox.find((y) => y.id === id);
      if (x) setCat(x.cat);
    }
    flash(id);
  }, [data]);

  useEffect(() => {
    if (!data) return;
    const h = window.location.hash.split('#')[2];
    if (h && document.getElementById(h)) setTimeout(() => scrollToEl(h, { immediate: true }), 100);
  }, [data]);

  if (error) return <div className="shell page"><Notice kind="error">{t('error_load', { what: 'catalogue' })} {error.message}</Notice></div>;

  const pathIds = showPath && data ? data.paths[pathIdx].steps : null;
  return (
    <div className="hub" data-space="research">
      <Hero data={data} q={q} setQ={setQ} onPick={onPick} pathIds={pathIds} activeGroup={activeGroup} setActiveGroup={setActiveGroup} />
      {!data && <div className="shell page"><p className="small mono">{t('loading_catalogue')}</p></div>}
      {data && (
        <>
          <SectionNav label={t('jump_to')} items={[
            { id: 'paths', n: '01', label: t('hub_paths_short') }, { id: 'library', n: '02', label: t('hub_library') },
            { id: 'toolbox', n: '03', label: t('hub_toolbox') }, { id: 'models', n: '04', label: t('hub_models_short') },
            { id: 'faq', n: '05', label: t('hub_faq_short') }, { id: 'practice', n: '06', label: t('hub_good_short') },
          ]} />
          <Results data={data} q={q} setQ={setQ} />
          <Paths data={data} byId={byId} active={pathIdx} setActive={setPathIdx}
            onShow={() => { setShowPath(true); setActiveGroup(null); scrollToEl(0); }} />
          <Library data={data} filt={filt} setFilt={setFilt} />
          <Toolbox data={data} cat={cat} setCat={setCat} />
          <section className="hub-sec" id="models" aria-labelledby="models-h">
            <div className="shell">
              <Reveal className="kicker kicker-dot">{t('hub_models_kicker')}</Reveal>
              <Reveal as="h2" className="st-h2" id="models-h" i={1}>{t('hub_models_title')}</Reveal>
              <Reveal as="p" className="lede mt-5 mb-10" i={2}>{t('hub_models_sub')}</Reveal>
              <Models />
            </div>
          </section>
          <section className="hub-sec" id="faq" aria-labelledby="faq-h">
            <div className="shell hub-two">
              <div>
                <Reveal className="kicker kicker-dot">{t('hub_faq_kicker')}</Reveal>
                <Reveal as="h2" className="st-h2" id="faq-h" i={1}>{t('hub_faq_title')}</Reveal>
              </div>
              <div className="faq-list">{data.faq.map((f) => <FaqItem key={f.q_en} f={f} data={data} />)}</div>
            </div>
          </section>
          <section className="hub-sec" id="practice" aria-labelledby="gp-h">
            <div className="shell">
              <Reveal className="kicker kicker-dot">{t('hub_good_kicker')}</Reveal>
              <Reveal as="h2" className="st-h2" id="gp-h" i={1}>{t('hub_good_title')}</Reveal>
              <div className="good-grid mt-10">
                {[1, 2, 3, 4].map((i) => (
                  <Reveal key={i} className="card spot card-pad good" i={i - 1}>
                    <span className="mono n">{String(i).padStart(2, '0')}</span>
                    <IconCheckCircle className="ic" />
                    <h3 className="h4 mt-3">{t(`good_${i}_t`)}</h3>
                    <p className="small mt-2">{t(`good_${i}_b`)}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
          <section className="hub-sec hub-end" id="suggest" aria-labelledby="sg-h">
            <div className="shell hub-end-grid">
              <Reveal className="card card-lg ctaband-lite">
                <h2 id="sg-h" className="h3">{t('hub_suggest_t')}</h2>
                <p className="small mt-2">{t('hub_suggest_b')}</p>
                <Magnetic><a className="btn btn-primary mt-6" href={`${LINKS.issues}/new?labels=resource&title=${encodeURIComponent('Resource suggestion')}`} target="_blank" rel="noopener">{t('hub_suggest_cta')}<IconArrowUpRight /></a></Magnetic>
                <p className="tiny mono mt-5">{t('hub_checked')}</p>
              </Reveal>
              <Reveal className="card card-lg spot ctaband-lite" data-space="family" i={1}>
                <span className="ic-round" aria-hidden="true"><IconHeart /></span>
                <h2 className="h3 mt-4">{t('hub_patients_t')}</h2>
                <Link to="/patients" className="btn btn-soft mt-6">{t('hub_patients_cta')}<IconArrowRight /></Link>
              </Reveal>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
