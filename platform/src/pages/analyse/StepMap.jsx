import { useMemo } from 'react';
import { useT } from '../../context/AppContext.jsx';
import { useCohort } from '../../context/CohortContext.jsx';
import { FIELDS, UNITS, distinctValues, mappingReady, refreshField, autoMap } from '../../lib/mapping.js';
import { runChecks } from '../../lib/checks.js';
import { FocusHeading } from '../../components/ui.jsx';

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

  return (
    <section className="grid gap-4" aria-labelledby="map-h">
      <div>
        <FocusHeading><span id="map-h">{t('map_title')}</span></FocusHeading>
        <p className="text-muted mt-1">{t('map_sub')}</p>
      </div>
      <div className="panel grid gap-3">
        {FIELDS.map((f) => (
          <div key={f.key} className="grid gap-1 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center sm:gap-3">
            <label htmlFor={`map-${f.key}`} className="font-medium text-sm">
              {t(f.labelKey)} {f.required && <span className="text-muted text-xs">({t('map_required')})</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              <select id={`map-${f.key}`} className="select flex-1 min-w-[160px]" value={mapping.cols[f.key] || ''} onChange={(e) => setMapping(refreshField(mapping, f.key, e.target.value, rows))}>
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
        ))}
        <p className="small">{t('map_unit_help')}</p>
      </div>

      {mapping.cols.status && (
        <fieldset className="panel border-line m-0">
          <legend className="font-serif font-semibold px-1">{t('map_event_title')}</legend>
          <p className="small mb-2">{t('map_event_help')}</p>
          <div className="grid sm:grid-cols-2 gap-x-4">
            {statusValues.map(({ value, count }) => (
              <label key={value || '(empty)'} className="check">
                <input type="checkbox" checked={dead.has(value)} onChange={() => toggleDead(value)} disabled={value === ''} />
                <span>{value === '' ? <em>{t('map_missing')}</em> : value} <span className="num text-muted text-xs">×{count}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {['sex', 'idh', 'mgmt'].filter((f) => mapping.cols[f]).map((f) => {
        const field = FIELDS.find((x) => x.key === f);
        const vals = distinctValues(rows, mapping.cols[f]);
        return (
          <fieldset key={f} className="panel border-line m-0">
            <legend className="font-serif font-semibold px-1">{t('map_values_title', { field: t(field.labelKey) })}</legend>
            <p className="small mb-2">{t('map_values_help')}</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {vals.map(({ value, count }) => (
                <label key={value || '(empty)'} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-sm">
                  <span className="truncate">{value === '' ? <em>{t('map_missing')}</em> : value} <span className="num text-muted text-xs">×{count}</span></span>
                  <select className="select w-auto min-h-[40px]" value={mapping.values[f]?.[value] || 'missing'} onChange={(e) => setCat(f, value, e.target.value)}>
                    {CAT_OPTIONS[f].map(([v, k]) => <option key={v} value={v}>{t(k)}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <button type="button" className="btn" onClick={() => go(0)}>{t('back')}</button>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {!ready && <span className="small" role="status">{mapping.cols.age && mapping.cols.time && mapping.cols.status ? t('map_need_event') : t('map_need_required')}</span>}
          <button type="button" className="btn btn-primary" disabled={!ready} onClick={next}>{t('next')}</button>
        </div>
      </div>
    </section>
  );
}
