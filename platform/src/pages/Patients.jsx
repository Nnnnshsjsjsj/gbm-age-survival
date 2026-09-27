// Patients & families: support services by country, international resources, common questions and reading.
// Warm space (data-space="family"). All data in public/hub/patients.json, checked by hand in September 2026.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useHub, loadHub, guessCountry, phoneParts } from '../lib/hub.js';
import { BrainStage, Globe } from '../components/BrainStage.jsx';
import { SplitText, Reveal, CountUp } from '../motion/components.jsx';
import { reducedMotion, isMobile, scrollToEl } from '../motion/core.js';
import { Notice } from '../components/ui.jsx';
import { IconPhone, IconArrowUpRight, IconArrowRight, IconChevronDown, IconHeart, IconGlobe, IconBook, IconInfo, IconUsers, IconClock, IconShield } from '../components/Icons.jsx';
import { LINKS } from '../components/Layout.jsx';

const REGIONS = {
  europe: ['RS', 'ME', 'BA', 'HR', 'MK', 'SI', 'BG', 'RO', 'GB', 'IE', 'DE', 'AT', 'CH', 'FR', 'BE', 'NL', 'LU', 'IT', 'ES', 'PT', 'GR', 'CY', 'MT', 'SE', 'NO', 'DK', 'FI', 'IS', 'PL', 'CZ', 'SK', 'HU', 'LV', 'LT', 'EE', 'UA', 'BY', 'MD'],
  eurasia: ['RU', 'KZ', 'UZ', 'KG', 'AM', 'AZ', 'TR', 'IL'],
  americas: ['US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO'],
  asia: ['AU', 'NZ', 'JP', 'KR', 'CN', 'IN', 'SG'],
  africa: ['ZA', 'EG', 'NG', 'AE'],
};
const REGION_NAMES = {
  en: { europe: 'Europe', eurasia: 'Russia, Central Asia, Caucasus, Middle East', americas: 'Americas', asia: 'Asia and Oceania', africa: 'Africa and the Gulf' },
  ru: { europe: 'Европа', eurasia: 'Россия, Центральная Азия, Кавказ, Ближний Восток', americas: 'Америка', asia: 'Азия и Океания', africa: 'Африка и Персидский залив' },
};
const LABEL_RU = { WhatsApp: 'WhatsApp', 'Find A Helpline': 'по данным Find A Helpline', landline: 'с городского', 'toll-free': 'бесплатно', children: 'дети', parents: 'родители', mobile: 'с мобильного', 'landline, Moscow': 'с городского, Москва', Estonian: 'по-эстонски', Russian: 'по-русски' };
const KIND_GROUPS = [
  { key: 'talk', kinds: ['crisis', 'mental'], icon: IconUsers },
  { key: 'tumour', kinds: ['tumour'], icon: IconHeart },
  { key: 'caregiver', kinds: ['caregiver'], icon: IconShield },
  { key: 'info', kinds: ['info', 'directory'], icon: IconInfo },
];
const AUD = ['patient', 'family', 'children', 'carer', 'bereaved'];
const STORE = 'cohortex-country';
const readStore = () => { try { return localStorage.getItem(STORE); } catch { return null; } };
const writeStore = (v) => { try { localStorage.setItem(STORE, v); } catch { /* storage unavailable */ } };

function useLangName(lang) {
  return useMemo(() => {
    let dn = null;
    try { dn = new Intl.DisplayNames([lang], { type: 'language' }); } catch { /* old browser */ }
    return (code) => { try { return dn?.of(code) || code; } catch { return code; } };
  }, [lang]);
}

function Phones({ phone, big = false }) {
  const { lang, t } = useApp();
  return (
    <span className={`phones${big ? ' big' : ''}`}>
      {phoneParts(phone).map((p, i) => {
        const label = p.label ? (lang === 'ru' ? LABEL_RU[p.label] || p.label : p.label) : null;
        const inner = <><IconPhone width={big ? 18 : 15} height={big ? 18 : 15} /><span className="mono">{p.num}</span>{label && <span className="plabel">{label}</span>}</>;
        return p.tel
          ? <a key={i} className="phone" href={p.tel} aria-label={`${t('pt_call', { phone: p.num })}${label ? ` (${label})` : ''}`}>{inner}</a>
          : <span key={i} className="phone">{inner}</span>;
      })}
    </span>
  );
}

const CYR = /[А-яЁё]/;
/** In Russian, a Cyrillic local name reads better as the title; the other name goes underneath. */
export function entryNames(e, lang) {
  if (lang === 'ru' && e.name_local && CYR.test(e.name_local)) return [e.name_local, e.name];
  return [e.name, e.name_local && e.name_local !== e.name ? e.name_local : null];
}

function Entry({ e }) {
  const { t, lang } = useApp();
  const [title, sub] = entryNames(e, lang);
  const langName = useLangName(lang);
  const desc = lang === 'ru' ? e.desc_ru || e.desc_en : e.desc_en;
  let host = '';
  try { host = new URL(e.url).hostname.replace(/^www\./, ''); } catch { /* bad url */ }
  return (
    <article className="card spot entry" id={`svc-${e.id}`}>
      {(e.free || e.hours) && (
        <div className="entry-top">
          {e.free && <span className="badge badge-warm">{t('pt_free')}</span>}
          {e.hours && <span className="entry-hours"><IconClock width={14} height={14} />{e.hours}</span>}
        </div>
      )}
      <h4 className="entry-name">{title}</h4>
      {sub && <p className="entry-local">{sub}</p>}
      <p className="entry-desc">{desc}</p>
      {e.phone && <Phones phone={e.phone} />}
      <div className="entry-foot">
        <a className="linkchip" href={e.url} target="_blank" rel="noopener">{host || t('pt_site')}<IconArrowUpRight width={13} height={13} /></a>
        {e.langs?.length > 0 && <span className="entry-langs">{e.langs.slice(0, 4).map(langName).join(' · ')}</span>}
      </div>
      {e.via_directory && <p className="tiny entry-dir">{t('pt_via_dir')}</p>}
    </article>
  );
}

/* ---------------------------------------------------------------- hero */
function Hero({ data, land, code, setCode, countryName }) {
  const { t, lang, theme } = useApp();
  const [env] = useState(() => ({ still: reducedMotion(), mobile: isMobile() }));
  const sorted = useMemo(() => {
    const byCode = Object.fromEntries(data.countries.map((c) => [c.code, c]));
    return Object.entries(REGIONS).map(([r, codes]) => [r, codes.filter((c) => byCode[c]).map((c) => byCode[c]).sort((a, b) => countryName(a).localeCompare(countryName(b), lang))]);
  }, [data, countryName, lang]);
  const nServices = data.countries.reduce((n, c) => n + c.entries.length, 0) + data.intl.length;
  return (
    <section className="pt-hero" aria-labelledby="pt-h1">
      <div className="shell pt-hero-grid">
        <div className="pt-hero-copy">
          <span className="eyebrow">{t('pt_kicker')}</span>
          <h1 className="hub-display pt-display" id="pt-h1">
            <SplitText lines={[{ text: t('pt_h1_a') }, { text: t('pt_h1_b'), className: 'hl' }]} stagger={70} />
          </h1>
          <p className="lede mt-6">{t('pt_lede')}</p>
          <div className="pt-pick mt-8">
            <label htmlFor="pt-country" className="flabel"><IconGlobe width={16} height={16} />{t('pt_country')}</label>
            <select id="pt-country" className="select" value={code || ''} onChange={(e) => setCode(e.target.value || null)}>
              <option value="">—</option>
              {sorted.map(([r, list]) => (
                <optgroup key={r} label={REGION_NAMES[lang === 'ru' ? 'ru' : 'en'][r]}>
                  {list.map((c) => <option key={c.code} value={c.code}>{countryName(c)}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="hub-stats pt-stats mt-10">
            <div className="hub-stat"><CountUp value={nServices} className="v mono" /><span className="k">{t('pt_stat_services')}</span></div>
            <div className="hub-stat"><CountUp value={data.countries.length} className="v mono" /><span className="k">{t('pt_stat_countries')}</span></div>
            <div className="hub-stat"><CountUp value={data.reading.length} className="v mono" /><span className="k">{t('pt_stat_reading')}</span></div>
          </div>
        </div>
        <div className="pt-globe">
          {land && (
            <BrainStage fallback={null}>
              <Globe land={land} countries={data.countries} selected={code} onSelect={setCode} still={env.still} light={theme === 'light'} names={countryName} />
            </BrainStage>
          )}
          <p className="tiny pt-globe-hint">{t('pt_globe_hint')}</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- help now */
function HelpNow({ country, countryName }) {
  const { t, lang } = useApp();
  const crisis = country ? country.entries.filter((e) => e.kind === 'crisis' && e.phone).slice(0, 3) : [];
  return (
    <section className="shell pt-help-wrap" id="help" aria-labelledby="help-h">
      <div className="pt-help card card-lg">
        <div className="pt-help-head">
          <span className="kicker kicker-dot">{t('pt_help_kicker')}{country ? ` · ${countryName(country)}` : ''}</span>
          <h2 className="h3 mt-3" id="help-h">{t('pt_help_title')}</h2>
        </div>
        {!country && <p className="small">{t('pt_dir_pick')}</p>}
        {country && (
          <div className="pt-help-grid">
            {country.emergency.length > 0 && (
              <div>
                <p className="small">{t('pt_help_emergency')}</p>
                <ul className="em-list">
                  {country.emergency.map((em) => (
                    <li key={em.number + em.label_en}>
                      <a className="em-num mono" href={`tel:${em.number.split(/[ /]/)[0].replace(/[^\d+]/g, '')}`}>{em.number}</a>
                      <span>{lang === 'ru' ? em.label_ru || em.label_en : em.label_en}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <p className="small">{t('pt_help_crisis')}</p>
              {crisis.length ? (
                <ul className="crisis-list">
                  {crisis.map((e) => (
                    <li key={e.id}>
                      <b>{entryNames(e, lang)[0]}</b>
                      <Phones phone={e.phone} big />
                      {e.hours && <span className="tiny">{e.hours}</span>}
                    </li>
                  ))}
                </ul>
              ) : <p className="small mt-2">{t('pt_help_none')}</p>}
            </div>
          </div>
        )}
        <a className="linkchip mt-5" href="https://findahelpline.com/" target="_blank" rel="noopener">{t('pt_help_other')}<IconArrowUpRight width={13} height={13} /></a>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- directory */
function Directory({ country, countryName }) {
  const { t } = useApp();
  if (!country) return null;
  return (
    <section className="pt-sec" id="directory" aria-labelledby="dir-h">
      <div className="shell">
        <Reveal className="kicker kicker-dot">{t('pt_dir_kicker', { country: countryName(country) })}</Reveal>
        <Reveal as="h2" className="st-h2" id="dir-h" i={1}>{t('pt_dir_title')}</Reveal>
        <div className="dir-groups mt-10">
          {KIND_GROUPS.map((g) => {
            const list = country.entries.filter((e) => g.kinds.includes(e.kind));
            if (!list.length) return null;
            const Icon = g.icon;
            return (
              <div key={g.key} className="dir-group">
                <div className="dir-head">
                  <span className="ic-round" aria-hidden="true"><Icon /></span>
                  <div>
                    <h3 className="h4">{t(`kind_${g.key}`)}</h3>
                    <p className="small">{t(`kind_${g.key}_b`)}</p>
                  </div>
                </div>
                <div className="entry-grid">{list.map((e) => <Entry key={e.id} e={e} />)}</div>
              </div>
            );
          })}
        </div>
        <p className="tiny mono mt-8">{t('hub_checked')}</p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- topics */
function Topics({ topics }) {
  const { t, lang } = useApp();
  return (
    <section className="pt-sec" id="topics" aria-labelledby="top-h">
      <div className="shell hub-two">
        <div>
          <Reveal className="kicker kicker-dot">{t('pt_topics_kicker')}</Reveal>
          <Reveal as="h2" className="st-h2" id="top-h" i={1}>{t('pt_topics_title')}</Reveal>
          <Reveal as="p" className="lede mt-5" i={2}>{t('pt_topics_sub')}</Reveal>
        </div>
        <div className="faq-list">
          {topics.map((x) => (
            <details key={x.id} className="faq">
              <summary><span>{lang === 'ru' ? x.title_ru : x.title_en}</span><IconChevronDown width={18} height={18} /></summary>
              <div className="faq-body">
                <p>{lang === 'ru' ? x.desc_ru : x.desc_en}</p>
                <div className="paper-links mt-3">
                  {x.links.map((l) => <a key={l.url} className="linkchip" href={l.url} target="_blank" rel="noopener">{l.label}<IconArrowUpRight width={13} height={13} /></a>)}
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- reading */
function Reading({ items }) {
  const { t, lang } = useApp();
  const [cat, setCat] = useState('guide');
  const [aud, setAud] = useState(null);
  const [lng, setLng] = useState(lang === 'ru' ? 'ru' : null);
  const [limit, setLimit] = useState(12);
  const list = useMemo(() => items.filter((x) => x.cat === cat && (!aud || x.audience.includes(aud))
    && (!lng || x.lang.includes(lng) || (lng === 'ru' && x.title_ru))), [items, cat, aud, lng]);
  return (
    <section className="pt-sec" id="reading" aria-labelledby="read-h">
      <div className="shell">
        <Reveal className="kicker kicker-dot">{t('pt_read_kicker')}</Reveal>
        <Reveal as="h2" className="st-h2" id="read-h" i={1}>{t('pt_read_title')}</Reveal>
        <Reveal as="p" className="lede mt-5" i={2}>{t('pt_read_sub')}</Reveal>
        <div className="filters mt-10">
          <div className="filters-row">
            <div className="segs" role="group" aria-label={t('pt_f_type')}>
              {['guide', 'book'].map((c) => <button key={c} type="button" aria-pressed={cat === c} onClick={() => { setCat(c); setLimit(12); }}>{t(`pt_type_${c}`)} <span className="text-dim mono">{items.filter((x) => x.cat === c).length}</span></button>)}
            </div>
            <div className="segs" role="group" aria-label={t('pt_f_lang')}>
              {[[null, t('all')], ['en', 'EN'], ['ru', 'RU']].map(([k, l]) => <button key={l} type="button" aria-pressed={lng === k} onClick={() => setLng(k)}>{l}</button>)}
            </div>
          </div>
          <div role="group" aria-label={t('pt_f_aud')} className="chips">
            <button type="button" className="chip" aria-pressed={!aud} onClick={() => setAud(null)}>{t('all')}</button>
            {AUD.map((a) => <button key={a} type="button" className="chip" aria-pressed={aud === a} onClick={() => setAud(aud === a ? null : a)}>{t(`aud_${a}`)}</button>)}
          </div>
        </div>
        <div className="read-grid mt-6" aria-live="polite">
          {list.slice(0, limit).map((x) => {
            const desc = lang === 'ru' ? x.desc_ru || x.desc_en : x.desc_en;
            const note = lang === 'ru' ? x.note_ru || x.note_en : x.note_en;
            return (
              <article key={x.id} className="card spot read">
                <div className="read-top">
                  <span className={`read-icon ${x.cat}`} aria-hidden="true"><IconBook /></span>
                  <div className="read-badges">
                    {x.free && <span className="badge badge-warm">{t('pt_free')}</span>}
                    {x.lang.map((l) => <span key={l} className="badge">{l.toUpperCase()}</span>)}
                  </div>
                </div>
                <h3 className="read-title"><a href={x.url} target="_blank" rel="noopener">{x.title}<IconArrowUpRight width={14} height={14} /></a></h3>
                {x.title_ru && x.title_ru !== x.title && <p className="read-ru"><span className="tiny">{t('pt_ru_title')}</span> {x.title_ru}</p>}
                <p className="read-auth">{[x.author, x.year].filter(Boolean).join(' · ')}</p>
                <p className="read-desc">{desc}</p>
                {note && <p className="paper-note"><IconInfo width={15} height={15} /><span>{note}</span></p>}
                <div className="tool-tags mt-auto pt-3">{x.audience.map((a) => <span key={a} className="tag">{t(`aud_${a}`)}</span>)}</div>
              </article>
            );
          })}
          {list.length === 0 && <p className="small">{t('no_results')}</p>}
        </div>
        {list.length > limit && <div className="mt-6 text-center"><button type="button" className="btn btn-soft" onClick={() => setLimit((l) => l + 12)}>{t('show_more')}</button></div>}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- page */
export default function Patients() {
  const { t, lang } = useApp();
  const { data, error } = useHub('patients');
  const [land, setLand] = useState(null);
  const [code, setCodeRaw] = useState(() => readStore());
  useEffect(() => { loadHub('land').then(setLand).catch(() => setLand(null)); }, []);
  useEffect(() => {
    if (!data || code) return;
    const g = guessCountry(data.countries.map((c) => c.code));
    if (g) setCodeRaw(g);
  }, [data, code]);
  const setCode = (c) => { setCodeRaw(c); if (c) writeStore(c); };
  const countryName = useMemo(() => (c) => (lang === 'ru' ? c.name_ru : c.name_en), [lang]);

  useEffect(() => {
    if (!data) return;
    const h = window.location.hash.split('#')[2];
    if (h && document.getElementById(h)) setTimeout(() => scrollToEl(h, { immediate: true }), 100);
  }, [data]);

  if (error) return <div className="shell page"><Notice kind="error">{t('error_load', { what: 'guide' })} {error.message}</Notice></div>;
  if (!data) return <div className="shell page" data-space="family"><p className="small mono">{t('loading_catalogue')}</p></div>;
  const country = data.countries.find((c) => c.code === code) || null;

  return (
    <div className="patients" data-space="family">
      <Hero data={data} land={land} code={code} setCode={setCode} countryName={countryName} />
      <HelpNow country={country} countryName={countryName} />
      <Directory country={country} countryName={countryName} />
      <section className="pt-sec" id="international" aria-labelledby="intl-h">
        <div className="shell">
          <Reveal className="kicker kicker-dot">{t('pt_intl_kicker')}</Reveal>
          <Reveal as="h2" className="st-h2" id="intl-h" i={1}>{t('pt_intl_title')}</Reveal>
          <Reveal as="p" className="lede mt-5" i={2}>{t('pt_intl_sub')}</Reveal>
          <div className="entry-grid mt-10">{data.intl.map((e) => <Entry key={e.id} e={e} />)}</div>
        </div>
      </section>
      <Topics topics={data.topics} />
      <Reading items={data.reading} />
      <section className="pt-sec hub-end" aria-labelledby="note-h">
        <div className="shell hub-end-grid">
          <Reveal className="card card-lg ctaband-lite">
            <h2 id="note-h" className="h3">{t('pt_note_t')}</h2>
            <p className="small mt-2">{t('pt_note_b')}</p>
            <a className="btn btn-soft mt-6" href={`${LINKS.issues}/new?labels=support-directory&title=${encodeURIComponent('Support directory correction')}`} target="_blank" rel="noopener">{t('pt_report')}<IconArrowUpRight /></a>
            <p className="tiny mono mt-5">{t('hub_checked')}</p>
          </Reveal>
          <Reveal className="card card-lg spot ctaband-lite" data-space="research" i={1}>
            <span className="ic-round" aria-hidden="true"><IconBook /></span>
            <h2 className="h3 mt-4">{t('pt_research_t')}</h2>
            <Link to="/hub" className="btn btn-soft mt-6">{t('pt_research_cta')}<IconArrowRight /></Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
