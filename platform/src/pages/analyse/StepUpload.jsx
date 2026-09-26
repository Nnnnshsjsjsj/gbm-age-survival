import { useRef, useState } from 'react';
import { useT } from '../../context/AppContext.jsx';
import { useCohort } from '../../context/CohortContext.jsx';
import { parseFile, parseText } from '../../lib/csv.js';
import { autoMap } from '../../lib/mapping.js';
import { baseUrl } from '../../lib/reference.js';
import { FocusHeading, ErrorBox } from '../../components/ui.jsx';

export default function StepUpload({ go }) {
  const t = useT();
  const cohort = useCohort();
  const [over, setOver] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const accept = (name, parsed) => {
    if (!parsed.headers.length || !parsed.rows.length) { setErr(t('up_err_empty')); return; }
    cohort.loadFile({ name, ...parsed });
    cohort.setMapping(autoMap(parsed.headers, parsed.rows));
  };
  const onFile = async (f) => {
    if (!f) return;
    setErr(''); setBusy(true);
    try { accept(f.name, await parseFile(f)); } catch { setErr(t('up_err_parse')); } finally { setBusy(false); }
  };
  const onDemo = async () => {
    setErr(''); setBusy(true);
    try {
      const res = await fetch(`${baseUrl()}reference/demo_cohort_messy.csv`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      accept('demo_cohort_messy.csv', parseText(await res.text()));
    } catch (e) { setErr(t('error_load', { what: 'demo_cohort_messy.csv' }) + ' ' + e.message); } finally { setBusy(false); }
  };
  const onDrop = (e) => { e.preventDefault(); setOver(false); onFile(e.dataTransfer.files?.[0]); };
  const f = cohort.file;

  return (
    <section className="grid gap-4" aria-labelledby="up-h">
      <FocusHeading><span id="up-h">{t('step_upload')}</span></FocusHeading>
      {!f && (
        <div className="panel grid gap-4">
          <div className="drop" data-over={over} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={onDrop}>
            <p className="font-medium">{t('up_drop')}</p>
            <p className="text-muted text-sm my-2">{t('up_or')}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <label className="btn btn-primary cursor-pointer">
                <span>{t('up_pick')}</span>
                <input ref={inputRef} type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values" className="sr-only" aria-label={t('up_file_label')} onChange={(e) => onFile(e.target.files?.[0])} />
              </label>
              <button type="button" className="btn" onClick={onDemo} disabled={busy}>{t('up_demo')}</button>
            </div>
          </div>
          <p className="small">{t('up_need')}</p>
          <p className="small">{t('up_privacy')}</p>
          {err && <ErrorBox msg={err} />}
        </div>
      )}
      {f && (
        <div className="panel grid gap-3">
          <h3>{t('up_loaded')}</h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 m-0 text-sm">
            <dt className="lbl">{t('up_file_label')}</dt><dd className="m-0 break-all">{f.name}</dd>
            <dt className="lbl">{t('up_rows')}</dt><dd className="m-0 num">{f.rows.length}</dd>
            <dt className="lbl">{t('up_cols')}</dt><dd className="m-0 num">{f.headers.length}</dd>
          </dl>
          <h3 className="text-base">{t('up_preview')}</h3>
          <div className="tw">
            <table className="tbl text-[13px]">
              <thead><tr>{f.headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>{f.rows.slice(0, 5).map((r, i) => <tr key={i}>{f.headers.map((h) => <td key={h} className="whitespace-nowrap">{String(r[h] ?? '')}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <p className="small">{t('up_privacy')}</p>
          <div className="flex flex-wrap gap-2 justify-between">
            <button type="button" className="btn" onClick={() => cohort.reset()}>{t('up_replace')}</button>
            <button type="button" className="btn btn-primary" onClick={() => go(1)}>{t('next')}</button>
          </div>
        </div>
      )}
    </section>
  );
}
