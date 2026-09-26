// Writes the methods paragraph in plain sentences with the numbers filled in.
import { fmt, pText } from './format.js';

const unitNames = {
  en: { days: 'days', weeks: 'weeks', months: 'months', years: 'years' },
  ru: { days: 'днях', weeks: 'неделях', months: 'месяцах', years: 'годах' },
};
const covNames = {
  en: { age: 'age', sex: 'sex', kps: 'KPS', mgmt: 'MGMT status', idh: 'IDH status' },
  ru: { age: 'возраст', sex: 'пол', kps: 'индекс Карновского', mgmt: 'статус MGMT', idh: 'статус IDH' },
};

export function methodsParagraph(lang, a, ctx) {
  const m = a.ageModel.model;
  const shown = a.bands.groups.filter((g) => !g.suppressed);
  const hidden = a.bands.groups.filter((g) => g.suppressed);
  const adj = a.models.filter((x) => x.key !== 'age');
  const covs = [...new Set(adj.flatMap((x) => x.model.names))].filter((c) => c !== 'age');
  const medCI = a.medianCI.map((x) => (x == null ? (lang === 'ru' ? 'не достигнуто' : 'not reached') : fmt(x, 1)));
  const median = a.desc.medianOS == null ? (lang === 'ru' ? 'не достигнута' : 'not reached') : `${fmt(a.desc.medianOS, 1)}`;
  const sch = a.schoenfeldP;

  if (lang === 'ru') {
    const s = [];
    s.push(`Проанализировано ${a.n} пациентов (${a.events} смертей).`);
    if (ctx.dropped > 0) s.push(`${ctx.dropped} строк исключены из-за отсутствия возраста, времени или статуса либо недопустимых значений.`);
    if (ctx.timeUnit !== 'months') s.push(`Время наблюдения, заданное в ${unitNames.ru[ctx.timeUnit]}, переведено в месяцы (месяц = 30,4375 дня).`);
    s.push(`Общая выживаемость оценена методом Каплана–Майера с дисперсией Гринвуда и 95 % доверительными интервалами по log(−log). Медиана общей выживаемости составила ${median} мес. (95 % ДИ ${medCI[0]}–${medCI[1]}); доля живых через 12 мес. — ${Math.round(a.desc.s12 * 100)} %, через 24 мес. — ${Math.round(a.desc.s24 * 100)} %.`);
    s.push(`Пациенты разделены на возрастные группы (<50, 50–59, 60–69, ≥70 лет); группы меньше 10 человек не показаны${hidden.length ? ` (${hidden.map((g) => g.label).join(', ')})` : ''}.${a.bands.logrank ? ` Различия между ${shown.length} показанными группами проверены лог-ранговым тестом (χ² = ${fmt(a.bands.logrank.chi2, 2)}, df = ${a.bands.logrank.df}, ${pText(a.bands.logrank.p)}).` : ''}`);
    s.push(`Связь возраста с риском смерти оценена моделью пропорциональных рисков Кокса (поправка Эфрона на совпадающие времена) с возрастом как непрерывной переменной: отношение рисков на год возраста ${fmt(m.hr[0])} (95 % ДИ ${fmt(m.lo[0])}–${fmt(m.hi[0])}, ${pText(m.p[0])}, C-индекс ${fmt(m.concordance, 2)}).`);
    if (adj.length) s.push(`Дополнительно построены модели с поправкой на ${covs.map((c) => covNames.ru[c] || c).join(', ')}; в каждой использованы пациенты с полными данными по её ковариатам.`);
    if (sch != null) s.push(`Пропорциональность рисков для возраста проверена по масштабированным остаткам Шёнфельда (${pText(sch)}); ${sch > 0.05 ? 'признаков нарушения не найдено' : 'есть признаки изменения эффекта со временем, поэтому отношение рисков следует читать как среднее за период наблюдения'}.`);
    s.push('Все расчёты выполнены в браузере с помощью открытого движка платформы, проверенного против lifelines. Результаты описывают группы и не относятся к отдельным пациентам.');
    return s.join(' ');
  }

  const s = [];
  s.push(`We analysed ${a.n} patients (${a.events} deaths).`);
  if (ctx.dropped > 0) s.push(`${ctx.dropped} rows were excluded for missing age, time or status, or for values outside the allowed range.`);
  if (ctx.timeUnit !== 'months') s.push(`Follow-up recorded in ${unitNames.en[ctx.timeUnit]} was converted to months (one month = 30.4375 days).`);
  s.push(`Overall survival was estimated with the Kaplan–Meier method, Greenwood variance and log(−log) 95% confidence intervals. Median overall survival was ${median} months (95% CI ${medCI[0]}–${medCI[1]}); ${Math.round(a.desc.s12 * 100)}% of patients were alive at 12 months and ${Math.round(a.desc.s24 * 100)}% at 24 months.`);
  s.push(`Patients were grouped by age (<50, 50–59, 60–69, ≥70 years); groups with fewer than 10 patients are not shown${hidden.length ? ` (${hidden.map((g) => g.label).join(', ')})` : ''}.${a.bands.logrank ? ` The ${shown.length} groups shown were compared with the log-rank test (χ² = ${fmt(a.bands.logrank.chi2, 2)}, df = ${a.bands.logrank.df}, ${pText(a.bands.logrank.p)}).` : ''}`);
  s.push(`The association between age and the hazard of death was estimated with a Cox proportional-hazards model (Efron tie handling) with age as a continuous variable: hazard ratio per year of age ${fmt(m.hr[0])} (95% CI ${fmt(m.lo[0])}–${fmt(m.hi[0])}, ${pText(m.p[0])}, C-index ${fmt(m.concordance, 2)}).`);
  if (adj.length) s.push(`Additional models adjusted for ${covs.map((c) => covNames.en[c] || c).join(', ')}; each used the patients with complete data for its covariates.`);
  if (sch != null) s.push(`The proportional-hazards assumption for age was checked with scaled Schoenfeld residuals (${pText(sch)}); ${sch > 0.05 ? 'there was no evidence of a violation' : 'there was some evidence that the effect changes over time, so the hazard ratio should be read as an average over follow-up'}.`);
  s.push('All computation ran in the browser with the platform\'s open-source engine, which is tested against lifelines. Results describe groups and do not apply to any individual patient.');
  return s.join(' ');
}
