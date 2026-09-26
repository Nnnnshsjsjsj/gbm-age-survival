import { useState } from 'react';
import { useT } from '../../context/AppContext.jsx';
import { useCohort } from '../../context/CohortContext.jsx';
import { parseFile, parseText } from '../../lib/csv.js';
import { autoMap } from '../../lib/mapping.js';
import { baseUrl } from '../../lib/reference.js';
import { FocusHeading, Notice } from '../../components/ui.jsx';
import { IconUpload, IconFile, IconArrowRight, IconLock } from '../../components/Icons.jsx';

export default function StepUpload({ go }) {
  const t = useT();
  const cohort = useCohort();
  const [over, setOver] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

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
    } catch (e) { setErr(`${t('error_load', { what: 'demo_cohort_messy.csv' })} ${e.message}`); } finally { setBusy(false); }
  };
  const onDrop = (e) => { e.preventDefault(); setOver(false); onFile(e.dataTransfer.files?.[0]); };
  const f = cohort.file;

  return (
    <section className="card card-pad" aria-labelledby="up-h">
      <FocusHeading className="h3" id="up-h">{f ? t('up_loaded') : t('up_title')}</FocusHeading>
      <p className="small mt-1">{f ? t('up_loaded_sub') : t('up_need')}</p>
      {!f && (
        <div className="mt-6 grid gap-4">
          <div className="drop" data-over={over} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={onDrop}>
            <span className="ic" aria-hidden="true"><IconUpload /></span>
            <p className="h4">{t('up_drop')}</p>
            <p className="small mt-1">{t('up_formats')}</p>
            <div className="btnrow justify-center mt-6">
              <label className="btn btn-primary cursor-pointer">
                <span>{t('up_pick')}</span>
                <input type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values" className="sr-only" aria-label={t('up_file_label')} onChange={(e) => onFile(e.target.files?.[0])} />
              </label>
              <button type="button" className="btn btn-ghost" onClick={onDemo} disabled={busy}>{t('up_demo')}</button>
            </div>
          </div>
          <p className="small inline-flex items-center gap-2"><IconLock width={16} height={16} className="flex-none" />{t('up_privacy')}</p>
          {err && <Notice kind="error">{err}</Notice>}
        </div>
      )}
      {f && (
        <div className="mt-6 grid gap-6">
          <div className="flex flex-wrap items-center gap-4 p-4 rounded-[12px] bg-tint">
            <span className="w-11 h-11 rounded-[12px] bg-card flex items-center justify-center text-accent-text flex-none" aria-hidden="true"><IconFile width={22} height={22} /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold break-all">{f.name}</p>
              <p className="small"><span className="num">{f.rows.length}</span> {t('up_rows')} · <span className="num">{f.headers.length}</span> {t('up_cols')}</p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => cohort.reset()}>{t('up_replace')}</button>
          </div>
          <div>
            <h3 className="kicker mb-2">{t('up_preview')}</h3>
            <div className="tw">
              <table className="tbl text-[13px]">
                <thead><tr>{f.headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>{f.rows.slice(0, 5).map((r, i) => <tr key={i}>{f.headers.map((h) => <td key={h} className="whitespace-nowrap">{String(r[h] ?? '')}</td>)}</tr>)}</tbody>
              </table>
            </div>
          </div>
          <div className="actions">
            <p className="small inline-flex items-center gap-2"><IconLock width={16} height={16} className="flex-none" />{t('up_privacy_short')}</p>
            <div className="right"><button type="button" className="btn btn-primary" onClick={() => go(1)}>{t('next')}<IconArrowRight /></button></div>
          </div>
        </div>
      )}
    </section>
  );
}
