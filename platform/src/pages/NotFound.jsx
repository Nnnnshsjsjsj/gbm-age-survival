import { Link } from 'react-router-dom';
import { useT } from '../context/AppContext.jsx';
import { EmptyState } from '../components/ui.jsx';
import { IconCompass, IconHome } from '../components/Icons.jsx';

export default function NotFound() {
  const t = useT();
  return (
    <div className="shell page pt-16">
      <div className="card">
        <EmptyState icon={IconCompass} title={t('nf_title')} body={t('nf_body')}>
          <Link to="/" className="btn btn-primary"><IconHome />{t('nf_home')}</Link>
        </EmptyState>
      </div>
    </div>
  );
}
