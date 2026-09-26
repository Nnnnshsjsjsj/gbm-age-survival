import { useT } from '../context/AppContext.jsx';
import { PageHeader } from '../components/ui.jsx';
import { LINKS } from '../components/Layout.jsx';

export default function About() {
  const t = useT();
  const Sec = ({ id, title, children }) => (
    <section className="panel prose" aria-labelledby={id}>
      <h2 id={id} className="mb-2">{title}</h2>
      {children}
    </section>
  );
  return (
    <div className="grid gap-4 max-w-[80ch]">
      <PageHeader title={t('about_title')} />
      <Sec id="a-what" title={t('about_what_t')}><p>{t('about_what')}</p></Sec>
      <Sec id="a-methods" title={t('about_methods_t')}>
        <p>{t('about_methods_1')}</p><p>{t('about_methods_2')}</p><p>{t('about_methods_3')}</p><p>{t('about_methods_4')}</p>
      </Sec>
      <Sec id="a-data" title={t('about_data_t')}><p>{t('about_data')}</p></Sec>
      <Sec id="a-privacy" title={t('about_privacy_t')}>
        <p>{t('about_privacy_1')}</p><p>{t('about_privacy_2')}</p><p>{t('about_privacy_3')}</p>
      </Sec>
      <Sec id="a-device" title={t('about_device_t')}><p>{t('about_device')}</p></Sec>
      <Sec id="a-contact" title={t('about_contact_t')}>
        <p>{t('about_contact')}</p>
        <p className="flex flex-wrap gap-2 mt-3">
          <a className="btn" href={LINKS.issues}>GitHub issues</a>
          <a className="btn" href={LINKS.paper}>{t('about_paper')}</a>
        </p>
      </Sec>
    </div>
  );
}
