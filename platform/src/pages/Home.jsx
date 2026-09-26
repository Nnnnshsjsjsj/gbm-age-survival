import { Link } from 'react-router-dom';
import { useT } from '../context/AppContext.jsx';

function Card({ to, title, body, open }) {
  return (
    <Link to={to} className="panel card-link flex flex-col gap-2">
      <h2>{title}</h2>
      <p className="text-muted text-[15px] flex-1">{body}</p>
      <span className="text-accent-ink font-medium text-sm">{open} →</span>
    </Link>
  );
}

export default function Home() {
  const t = useT();
  return (
    <div className="grid gap-6">
      <header className="max-w-[70ch]">
        <h1>{t('brand')}</h1>
        <p className="mt-2 text-[17px]">{t('home_lead')}</p>
        <p className="mt-2 text-muted text-sm">{t('home_privacy')}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <Card to="/explore" title={t('home_card1_t')} body={t('home_card1_b')} open={t('home_open')} />
        <Card to="/analyse" title={t('home_card2_t')} body={t('home_card2_b')} open={t('home_open')} />
        <Card to="/pool" title={t('home_card3_t')} body={t('home_card3_b')} open={t('home_open')} />
      </div>
      <section className="panel max-w-[76ch]" aria-labelledby="not-h">
        <h2 id="not-h" className="mb-2">{t('home_not_t')}</h2>
        <ul className="m-0 pl-5 grid gap-1 text-[15px]">
          <li>{t('home_not_1')}</li>
          <li>{t('home_not_2')}</li>
          <li>{t('home_not_3')}</li>
        </ul>
      </section>
    </div>
  );
}
