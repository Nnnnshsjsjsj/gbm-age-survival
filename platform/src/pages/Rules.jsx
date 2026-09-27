import { Link } from 'react-router-dom';
import { useT } from '../context/AppContext.jsx';
import { RULES } from '../lib/rules.js';

export default function Rules() {
  const t = useT();
  const block = (space) => (
    <section id={space} aria-labelledby={`${space}-h`} className="mt-12" data-space={space}>
      <span className="kicker-pill">{t(space === 'family' ? 'space_family' : 'space_research')}</span>
      <h2 id={`${space}-h`} className="h2 mt-4">{t(`rules_${space}_t`)}</h2>
      <p className="sub mt-3 mb-6">{t(`rules_${space}_s`)}</p>
      {RULES[space].map((n) => (
        <div key={n} className="rule">
          <span className="rnum">{String(n).padStart(2, '0')}</span>
          <div>
            <h3>{t(`rule_${space}_${n}_t`)}</h3>
            <p>{t(`rule_${space}_${n}_b`)}</p>
          </div>
        </div>
      ))}
    </section>
  );
  return (
    <div className="shell-narrow doc">
      <div className="kicker kicker-dot">{t('rules_kicker')}</div>
      <h1 className="h1 mt-3">{t('rules_title')}</h1>
      <p className="lede mt-4">{t('rules_sub')}</p>
      <nav className="toc" aria-label={t('rules_title')}>
        <a href="#research" className="chip" onClick={(e) => { e.preventDefault(); document.getElementById('research')?.scrollIntoView(); }}>{t('space_research')}</a>
        <a href="#family" className="chip" onClick={(e) => { e.preventDefault(); document.getElementById('family')?.scrollIntoView(); }}>{t('space_family')}</a>
      </nav>
      <div className="banner banner-accent mt-8"><span className="pulse" aria-hidden="true" /><p><b>{t('rules_how_t')}</b> {t('rules_how_b')}</p></div>
      {block('research')}
      {block('family')}
      <p className="small mt-12">{t('rules_foot')} <Link to="/privacy">{t('nav_privacy')}</Link> · <Link to="/about#contact">{t('about_contact_t')}</Link></p>
    </div>
  );
}
