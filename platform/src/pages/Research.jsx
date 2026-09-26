import { Link, useParams } from 'react-router-dom';
import { useT } from '../context/AppContext.jsx';
import Forum from '../components/Forum.jsx';
import NotFound from './NotFound.jsx';
import { boardByKey } from '../lib/boards.js';
import { IconUsers } from '../components/Icons.jsx';

export default function Research() {
  const t = useT();
  const { board } = useParams();
  if (board && boardByKey(board)?.space !== 'research') return <NotFound />;
  return (
    <Forum space="research" board={board || null}
      extraRail={<Link to="/people" className="railitem"><IconUsers />{t('people_title')}</Link>} />
  );
}
