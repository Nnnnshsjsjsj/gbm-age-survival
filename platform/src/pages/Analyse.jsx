import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useT } from '../context/AppContext.jsx';
import { useCohort, STEPS } from '../context/CohortContext.jsx';
import { PageHead } from '../components/ui.jsx';
import { IconCheck, IconLock } from '../components/Icons.jsx';
import StepUpload from './analyse/StepUpload.jsx';
import StepMap from './analyse/StepMap.jsx';
import StepCheck from './analyse/StepCheck.jsx';
import StepAnalyse from './analyse/StepAnalyse.jsx';
import StepCompare from './analyse/StepCompare.jsx';

const LABEL = { upload: 'step_upload', map: 'step_map', check: 'step_check', analyse: 'step_analyse', compare: 'step_compare' };
const VIEW = { upload: StepUpload, map: StepMap, check: StepCheck, analyse: StepAnalyse, compare: StepCompare };

export default function Analyse() {
  const t = useT();
  const nav = useNavigate();
  const { step: param } = useParams();
  const cohort = useCohort();
  const max = cohort.maxStep();
  const requested = STEPS.includes(param) ? STEPS.indexOf(param) : 0;
  const idx = Math.min(requested, max);
  const step = STEPS[idx];

  useEffect(() => { if (requested !== idx) nav(`/analyse/${step}`, { replace: true }); }, [requested, idx, step, nav]);

  const go = (i) => nav(`/analyse/${STEPS[i]}`);
  const View = VIEW[step];

  return (
    <div className="shell page">
      <PageHead kicker={t('wiz_kicker')} title={t('wiz_title')} sub={t('wiz_sub')}>
        <p className="small mt-3 inline-flex items-center gap-2"><IconLock width={16} height={16} />{t('wiz_private')}</p>
      </PageHead>
      <nav aria-label={t('steps_label')} className="card card-pad mb-4" style={{ paddingBlock: 20 }}>
        <ol className="stepper">
          {STEPS.map((s, i) => {
            const done = i < idx || (i < max && i !== idx);
            return (
              <li key={s} data-done={i < idx}>
                <button type="button" className="step" aria-current={i === idx ? 'step' : undefined} data-done={done} disabled={i > max} onClick={() => go(i)}>
                  <span className="idx" aria-hidden="true">{done ? <IconCheck /> : i + 1}</span>
                  <span className="lbl">{t(LABEL[s])}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <View key={step} go={go} idx={idx} />
    </div>
  );
}
