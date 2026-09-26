import { useT } from '../../context/AppContext.jsx';
import { useCohort } from '../../context/CohortContext.jsx';
import { FocusHeading, StatusBadge } from '../../components/ui.jsx';
import { IconArrowRight } from '../../components/Icons.jsx';

export default function StepCheck({ go }) {
  const t = useT();
  const { checks } = useCohort();
  const counts = { pass: 0, warn: 0, fail: 0 };
  checks.checks.forEach((c) => { counts[c.status] += 1; });
  return (
    <section className="grid gap-4" aria-labelledby="chk-h">
      <div className="card card-pad">
        <div className="card-head">
          <div>
            <FocusHeading className="h3" id="chk-h">{t('check_title')}</FocusHeading>
            <p className="small mt-1">{t('check_sub')}</p>
          </div>
          <p className="small" aria-hidden="true">
            <span className="num text-ink font-semibold">{counts.pass}</span> {t('pass').toLowerCase()} · <span className="num text-ink font-semibold">{counts.warn}</span> {t('warn').toLowerCase()} · <span className="num text-ink font-semibold">{counts.fail}</span> {t('fail').toLowerCase()}
          </p>
        </div>
        <ul className="checklist">
          {checks.checks.map((c) => (
            <li key={c.id}>
              <span><StatusBadge status={c.status} /></span>
              <div>
                <p className="font-semibold text-[15px]">{t(c.titleKey)}</p>
                <p className="small mt-1">{t(c.textKey, c.params)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={() => go(1)}>{t('back')}</button>
        <div className="right">
          {!checks.canProceed && <span className="small" role="status">{t('check_blocked')}</span>}
          <button type="button" className="btn btn-primary" disabled={!checks.canProceed} onClick={() => go(3)}>{t('check_go')}<IconArrowRight /></button>
        </div>
      </div>
    </section>
  );
}
