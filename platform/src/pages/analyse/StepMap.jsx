import { useMemo } from 'react';
import { useT } from '../../context/AppContext.jsx';
import { useCohort } from '../../context/CohortContext.jsx';
import { FIELDS, UNITS, distinctValues, mappingReady, refreshField, autoMap } from '../../lib/mapping.js';
import { runChecks } from '../../lib/checks.js';
import { FocusHeading } from '../../components/ui.jsx';
import { IconArrowRight } from '../../components/Icons.jsx';

const CAT_OPTIONS = {
  sex: [['male', 'v_male'], ['female', 'v_female'], ['missing', 'map_missing']],
  idh: [['mutant', 'v_mutant'], ['wildtype', 'v_wildtype'], ['missing', 'map_missing']],
  mgmt: [['methylated', 'v_methylated'], ['unmethylated', 'v_unmethylated'], ['missing', 'map_missing']],
};

export default function StepMap({ go }) {
  const t = useT();
  const cohort = useCohort();
  const { headers, rows } = cohort.file;
  const mapping = cohort.mapping || autoMap(headers, rows);
  const setMapping = cohort.setMapping;

  const statusValues = useMemo(() => (mapping.cols.status ? distinctValues(rows, mapping.cols.status) : []), [rows, mapping.cols.status]);
  const ready = mappingReady(mapping);
  const dead = new Set(mapping.deadValues);

  const toggleDead = (v) => {
    const next = dead.has(v) ? mapping.deadValues.filter((x) => x !== v) : [...mapping.deadValues, v];
    setMapping({ ...mapping, deadValues: next });
  };
  const setCat = (field, raw, val) => setMapping({ ...mapping, values: { ...mapping.values, [field]: { ...mapping.values[field], [raw]: val } } });
  const next = () => {
    cohort.setMapping(mapping);
    cohort.setChecks(runChecks(headers, rows, mapping));
    go(2);
  };
  const required = FIELDS.filter((f) => f.required);
  const optional = FIELDS.filter((f) => !f.required);

  const row = (f) => (
    <div key={f.key} className="grid gap-2 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center sm:gap-4 py-3 border-b border-line last:border-b-0">
      <label htmlFor={`map-${f.key}`} className="text-[14.5px] font-semibold">{t(f.labelKey)}</label>
      <div className="flex flex-wrap gap-2">
        <select id={`map-${f.key}`} className="select flex-1 min-w-[180px]" value={mapping.cols[f.key] || ''} onChange={(e) => setMapping(refreshField(mapping, f.key, e.target.value, rows))}>
          <option value="">{t('map_none')}</option>
          {headers.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        {f.key === 'time' && mapping.cols.time && (
          <select className="select w-auto" aria-label={t('map_unit')} value={mapping.timeUnit} onChange={(e) => setMapping({ ...mapping, timeUnit: e.target.value })}>
            {UNITS.map((u) => <option key={u} value={u}>{t(`unit_${u}`)}</option>)}
          </select>
        )}
      </div>
    </div>
  );

  return (
    <section className="grid gap-4" aria-labelledby="map-h">
      <div className="card card-pad">
        <FocusHeading className="h3" id="map-h">{t('map_title')}</FocusHeading>
        <p className="small mt-1">{t('map_sub')}</p>
        <div className="mt-6">
          <p className="kicker mb-1">{t('map_required_group')}</p>
          {required.map(row)}
          <p className="kicker mt-6 mb-1">{t('map_optional_group')}</p>
          {optional.map(row)}
          <p className="tiny mt-3">{t('map_unit_help')}</p>
        </div>
      </div>

      {mapping.cols.status && (
        <fieldset className="card card-pad m-0">
          <legend className="sr-only">{t('map_event_title')}</legend>
          <h3 className="h4" aria-hidden="true">{t('map_event_title')}</h3>
          <p className="small mt-1 mb-3">{t('map_event_help')}</p>
          <div className="grid sm:grid-cols-2 gap-x-6">
            {statusValues.map(({ value, count }) => (
              <label key={value || '(empty)'} className="check">
                <input type="checkbox" checked={dead.has(value)} onChange={() => toggleDead(value)} disabled={value === ''} />
                <span>{value === '' ? <em>{t('map_missing')}</em> : value} <span className="num text-dim text-xs">×{count}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {['sex', 'idh', 'mgmt'].filter((f) => mapping.cols[f]).map((f) => {
        const field = FIELDS.find((x) => x.key === f);
        const vals = distinctValues(rows, mapping.cols[f]);
        return (
          <fieldset key={f} className="card card-pad m-0">
            <legend className="sr-only">{t('map_values_title', { field: t(field.labelKey) })}</legend>
            <h3 className="h4" aria-hidden="true">{t('map_values_title', { field: t(field.labelKey) })}</h3>
            <p className="small mt-1 mb-3">{t('map_values_help')}</p>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
              {vals.map(({ value, count }) => (
                <label key={value || '(empty)'} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-[14.5px]">
                  <span className="truncate">{value === '' ? <em>{t('map_missing')}</em> : value} <span className="num text-dim text-xs">×{count}</span></span>
                  <select className="select w-auto" style={{ minHeight: 40, paddingBlock: 6 }} value={mapping.values[f]?.[value] || 'missing'} onChange={(e) => setCat(f, value, e.target.value)}>
                    {CAT_OPTIONS[f].map(([v, k]) => <option key={v} value={v}>{t(k)}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}

      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={() => go(0)}>{t('back')}</button>
        <div className="right">
          {!ready && <span className="small" role="status">{mapping.cols.age && mapping.cols.time && mapping.cols.status ? t('map_need_event') : t('map_need_required')}</span>}
          <button type="button" className="btn btn-primary" disabled={!ready} onClick={next}>{t('next')}<IconArrowRight /></button>
        </div>
      </div>
    </section>
  );
}
