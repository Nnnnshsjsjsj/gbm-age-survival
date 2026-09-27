// Rows and cards shared by the Research hub sections.
import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { IconArrowUpRight, IconCopy, IconCheck, IconAlert } from '../../components/Icons.jsx';
import { citation, doiUrl, pubmedUrl, pmcUrl } from '../../lib/hub.js';
import { scrollToEl } from '../../motion/core.js';

export const TOPICS = ['start', 'classification', 'epidemiology', 'age', 'treatment', 'trials-design', 'genomics', 'heterogeneity', 'microenvironment', 'imaging', 'methods'];
export const LEVELS = ['start', 'core', 'advanced'];
export const CATS = ['data', 'tools', 'guidelines', 'trials', 'learn', 'community'];

// constellation groups: papers by broad theme, resources by kind
export const GROUPS = [
  { key: 'p:start', color: '#5EF2B8', light: '#0B7F58', label: 'top_start' },
  { key: 'p:biology', color: '#B69CFF', light: '#6A4BC4', label: 'hub_g_biology' },
  { key: 'p:clinic', color: '#FF8A5B', light: '#C2461A', label: 'hub_g_clinic' },
  { key: 'p:people', color: '#F5B35C', light: '#9A5B0C', label: 'hub_g_people' },
  { key: 'p:imaging', color: '#7AA2FF', light: '#3558C9', label: 'top_imaging' },
  { key: 'p:methods', color: '#4CC9F0', light: '#0B6F96', label: 'top_methods' },
  { key: 't:data', color: '#3EE6A8', light: '#0E7F57', label: 'cat_data' },
  { key: 't:tools', color: '#9BE7FF', light: '#1C6E8C', label: 'cat_tools' },
  { key: 't:guide', color: '#FFC7A1', light: '#A8431F', label: 'hub_g_guide' },
  { key: 't:learn', color: '#E6D3FF', light: '#7A4FB0', label: 'hub_g_learn' },
];
export function paperGroup(p) {
  const t = p.topics || [];
  if (p.level === 'start' || t[0] === 'start') return 'p:start';
  const first = t.find((x) => x !== 'start') || 'methods';
  if (['genomics', 'heterogeneity', 'microenvironment', 'classification'].includes(first)) return 'p:biology';
  if (['treatment', 'trials-design'].includes(first)) return 'p:clinic';
  if (['epidemiology', 'age'].includes(first)) return 'p:people';
  if (first === 'imaging') return 'p:imaging';
  return 'p:methods';
}
export function toolGroup(x) {
  if (x.cat === 'data') return 't:data';
  if (x.cat === 'tools') return 't:tools';
  if (x.cat === 'guidelines' || x.cat === 'trials') return 't:guide';
  return 't:learn';
}

/** Scroll to an item and make it glow briefly. */
export function flash(id) {
  const tryIt = (n) => {
    const el = document.getElementById(`item-${id}`);
    if (!el) { if (n < 20) setTimeout(() => tryIt(n + 1), 50); return; }
    scrollToEl(el, { offset: -120 });
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
    const focusable = el.querySelector('a, button');
    setTimeout(() => focusable?.focus({ preventScroll: true }), 700);
  };
  tryIt(0);
}

function CopyCite({ text }) {
  const { t } = useApp();
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className="linkchip" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1600); } catch { /* clipboard blocked */ }
    }}>
      {ok ? <IconCheck width={14} height={14} /> : <IconCopy width={14} height={14} />}{ok ? t('copied') : t('hub_cite')}
    </button>
  );
}

export function PaperRow({ p, step, compact = false }) {
  const { t, lang } = useApp();
  const summary = lang === 'ru' ? p.summary_ru || p.summary_en : p.summary_en;
  const note = lang === 'ru' ? p.note_ru || p.note_en : p.note_en;
  const href = p.doi ? doiUrl(p.doi) : p.pmid ? pubmedUrl(p.pmid) : null;
  return (
    <article className={`paper${compact ? ' compact' : ''}`} id={compact ? undefined : `item-${p.id}`}>
      <div className="paper-meta mono">
        {step != null && <span className="paper-step">{t('hub_step', { n: step })}</span>}
        <span>{p.year}</span><span className="sep" aria-hidden="true">·</span><span className="paper-j">{p.journal}</span>
        <span className={`badge lvl-${p.level}`}>{t(`lvl_${p.level}`)}</span>
        {p.open_access && <span className="badge badge-accent">{t('hub_oa')}</span>}
      </div>
      <h3 className="paper-title">
        {href ? <a href={href} target="_blank" rel="noopener">{p.title}</a> : p.title}
      </h3>
      <p className="paper-auth">{p.authors}</p>
      <p className="paper-sum">{summary}</p>
      {note && <p className="paper-note"><IconAlert width={15} height={15} /><span><b>{t('hub_caveat')}.</b> {note}</span></p>}
      <div className="paper-links">
        {p.doi && <a className="linkchip" href={doiUrl(p.doi)} target="_blank" rel="noopener">DOI<IconArrowUpRight width={13} height={13} /></a>}
        {p.pmid && <a className="linkchip" href={pubmedUrl(p.pmid)} target="_blank" rel="noopener">PubMed<IconArrowUpRight width={13} height={13} /></a>}
        {p.pmcid && <a className="linkchip linkchip-accent" href={pmcUrl(p.pmcid)} target="_blank" rel="noopener">{t('hub_oa')}<IconArrowUpRight width={13} height={13} /></a>}
        <CopyCite text={citation(p)} />
        {!compact && <span className="paper-topics">{(p.topics || []).map((x) => <span key={x} className="tag">{t(`top_${x}`)}</span>)}</span>}
      </div>
    </article>
  );
}

const UNIT_RU = {
  samples: 'образцов', patients: 'пациентов', 'patients (all glioma grades)': 'пациентов (глиомы всех степеней)',
  'patients (diffuse glioma grades 2–4)': 'пациентов (диффузные глиомы 2–4 степени)', 'tumours (adult + paediatric)': 'опухолей (взрослые и дети)',
};

export function ToolCard({ x, compact = false }) {
  const { t, lang } = useApp();
  const desc = lang === 'ru' ? x.desc_ru || x.desc_en : x.desc_en;
  return (
    <article className={`card spot tool${compact ? ' compact' : ''}`} id={compact ? undefined : `item-${x.id}`}>
      <div className="tool-top">
        <span className={`badge acc-${x.access}`}>{t(`acc_${x.access}`)}</span>
        <span className={`badge lvl-${x.level}`}>{t(`lvl_${x.level}`)}</span>
        {x.n ? <span className="mono tool-n">{t('hub_n_patients', { n: x.n.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US'), unit: lang === 'ru' ? UNIT_RU[x.n_unit || 'patients'] || x.n_unit : x.n_unit || 'patients' })}</span> : null}
      </div>
      <h3 className="tool-name"><a href={x.url} target="_blank" rel="noopener">{x.name}<IconArrowUpRight width={15} height={15} /></a></h3>
      <p className="tool-desc">{desc}</p>
      {!compact && (
        <div className="tool-tags">
          {(x.modality || []).map((m) => <span key={m} className="tag tag-strong">{m}</span>)}
          {(x.tags || []).filter((m) => !(x.modality || []).includes(m)).slice(0, 4).map((m) => <span key={m} className="tag">{m}</span>)}
        </div>
      )}
    </article>
  );
}
