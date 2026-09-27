import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { LINKS } from '../components/Layout.jsx';
import { IconGithub, IconFile, IconExternal } from '../components/Icons.jsx';

export default function About() {
  const { t, lang } = useApp();
  return (
    <div className="shell-narrow doc">
      <div className="kicker kicker-dot">{t('about_kicker')}</div>
      <h1 className="h1 mt-3">{t('about_title')}</h1>
      <p className="lede mt-4">{t('about_lede')}</p>
      <p className="namenote">{t('about_name')}</p>
      <div className="btnrow mt-8">
        <a className="btn btn-primary" href={lang === 'ru' ? LINKS.paperRu : LINKS.paperEn} rel="noopener"><IconFile />{t('about_paper')}</a>
        <a className="btn btn-ghost" href={LINKS.repo} rel="noopener"><IconGithub />GitHub</a>
      </div>

      <ul className="statchips mt-10 list-none p-0" aria-label={t('about_numbers')}>
        <li className="statchip"><b>4</b>{t('chip_refs')}</li>
        <li className="statchip"><b>{t('chip_patients_n')}</b>{t('chip_patients')}</li>
        <li className="statchip"><b>13</b>{t('chip_pool')}</li>
        <li className="statchip"><b>51</b>{t('chip_tests')}</li>
      </ul>

      <section className="mt-12 prose" aria-labelledby="a-paper">
        <h2 id="a-paper" className="h3 text-ink">{t('about_paper_t')}</h2>
        <p className="mt-3">{t('about_paper_1')}</p>
        <p>{t('about_paper_2')}</p>
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <a href={LINKS.paperEn} rel="noopener" className="inline-flex items-center gap-1">{t('about_pdf_en')}<IconExternal width={14} height={14} /></a>
          <a href={LINKS.paperRu} rel="noopener" className="inline-flex items-center gap-1">{t('about_pdf_ru')}<IconExternal width={14} height={14} /></a>
        </p>
      </section>

      <section className="mt-12 prose" aria-labelledby="a-methods">
        <h2 id="a-methods" className="h3 text-ink">{t('about_methods_t')}</h2>
        <ul>
          <li>{t('about_methods_1')}</li><li>{t('about_methods_2')}</li><li>{t('about_methods_3')}</li><li>{t('about_methods_4')}</li>
        </ul>
      </section>

      <section className="mt-12 prose" id="heterogeneity" aria-labelledby="a-het">
        <h2 id="a-het" className="h3 text-ink">{t('about_het_t')}</h2>
        <p className="mt-3">{t('about_het_1')}</p>
        <p>{t('about_het_2')}</p>
      </section>

      <section className="mt-12 prose" aria-labelledby="a-data">
        <h2 id="a-data" className="h3 text-ink">{t('about_data_t')}</h2>
        <p className="mt-3">{t('about_data')}</p>
      </section>

      <section className="mt-12 prose" aria-labelledby="a-device">
        <h2 id="a-device" className="h3 text-ink">{t('about_device_t')}</h2>
        <p className="mt-3">{t('about_device')}</p>
        <p><Link to="/privacy">{t('nav_privacy')}</Link></p>
      </section>

      <section className="mt-12 card card-lg quote" id="contact" aria-labelledby="a-contact">
        <span className="kicker-pill">{t('about_contact_t')}</span>
        <h2 id="a-contact" className="h3 mt-4">{t('about_contact_h')}</h2>
        <p className="small mt-2 max-w-[60ch]">{t('about_contact')}</p>
        <div className="btnrow mt-6">
          <a className="btn btn-ghost" href={LINKS.issues} rel="noopener"><IconGithub />{t('about_issue')}</a>
          <Link className="btn btn-soft" to="/hub#suggest">{t('about_suggest')}</Link>
        </div>
      </section>
    </div>
  );
}
