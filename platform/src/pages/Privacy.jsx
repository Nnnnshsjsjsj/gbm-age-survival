import { Link } from 'react-router-dom';
import { useT } from '../context/AppContext.jsx';
import { IconCheck, IconX } from '../components/Icons.jsx';

export default function Privacy() {
  const t = useT();
  const list = (keys, Icon, color) => (
    <ul className="list-none m-0 p-0 grid gap-3 mt-4">
      {keys.map((k) => <li key={k} className="flex gap-3 items-start text-[15.5px] text-muted"><Icon width={18} height={18} className="flex-none mt-1" style={{ color }} /><span><b className="text-ink font-semibold">{t(`${k}_t`)}</b> {t(`${k}_b`)}</span></li>)}
    </ul>
  );
  return (
    <div className="shell-narrow doc">
      <div className="kicker kicker-dot">{t('privacy_kicker')}</div>
      <h1 className="h1 mt-3">{t('privacy_title')}</h1>
      <p className="lede mt-4">{t('privacy_sub')}</p>
      <section className="mt-12" aria-labelledby="pv-store">
        <h2 id="pv-store" className="h3">{t('pv_store_h')}</h2>
        {list(['pv_prefs', 'pv_export'], IconCheck, 'var(--accent)')}
      </section>
      <section className="mt-12" aria-labelledby="pv-never">
        <h2 id="pv-never" className="h3">{t('pv_never_h')}</h2>
        {list(['pv_rows', 'pv_files', 'pv_accounts', 'pv_tracking'], IconX, 'var(--red)')}
      </section>
      {['pv_links', 'pv_where'].map((k) => (
        <section key={k} className="rule mt-10" aria-labelledby={`${k}-h`} style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <h2 id={`${k}-h`} className="h3">{t(`${k}_h`)}</h2>
            <p className="mt-2">{t(`${k}_b`)}</p>
          </div>
        </section>
      ))}
      <p className="small mt-10">{t('pv_foot')} <Link to="/about#contact">{t('about_contact_t')}</Link></p>
    </div>
  );
}
