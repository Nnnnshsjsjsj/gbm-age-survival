import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useT } from '../context/AppContext.jsx';
import { useCohort, STEPS } from '../context/CohortContext.jsx';
import { Banner, PageHeader } from '../components/ui.jsx';
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
    <div>
      <PageHeader title={t('wiz_title')} sub={t('wiz_sub')} />
      <Banner />
      <nav aria-label={t('steps_label')} className="mb-5">
        <ol className="steps list-none m-0 p-0">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button type="button" className="step" aria-current={i === idx ? 'step' : undefined} data-done={i < max || (i < idx)} disabled={i > max} onClick={() => go(i)}>
                <span className="idx" aria-hidden="true">{i + 1}</span>
                <span>{t(LABEL[s])}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <View key={step} go={go} idx={idx} />
    </div>
  );
}
