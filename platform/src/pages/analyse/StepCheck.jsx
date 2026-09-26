import { useT } from '../../context/AppContext.jsx';
import { useCohort } from '../../context/CohortContext.jsx';
import { FocusHeading, StatusBadge } from '../../components/ui.jsx';

export default function StepCheck({ go }) {
  const t = useT();
  const { checks } = useCohort();
  return (
    <section className="grid gap-4" aria-labelledby="chk-h">
      <div>
        <FocusHeading><span id="chk-h">{t('check_title')}</span></FocusHeading>
        <p className="text-muted mt-1">{t('check_sub')}</p>
      </div>
      <ul className="panel list-none m-0 p-0 divide-y divide-line">
        {checks.checks.map((c) => (
          <li key={c.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 py-3 first:pt-0 last:pb-0 items-start">
            <StatusBadge status={c.status} />
            <div>
              <p className="font-medium">{t(c.titleKey)}</p>
              <p className="text-muted text-sm">{t(c.textKey, c.params)}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <button type="button" className="btn" onClick={() => go(1)}>{t('back')}</button>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {!checks.canProceed && <span className="small" role="status">{t('check_blocked')}</span>}
          <button type="button" className="btn btn-primary" disabled={!checks.canProceed} onClick={() => go(3)}>{t('check_go')}</button>
        </div>
      </div>
    </section>
  );
}
