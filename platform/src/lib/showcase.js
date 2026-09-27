// Real numbers for the home page visuals. Nothing here is mocked: the reference cohorts, the published series and
// the demo file go through the same engine and pipeline as Explore, Pool and the Analyse wizard.
import { allReferenceStats, loadPublished, baseUrl } from './reference.js';
import { metaRandomEffects } from '../engine/index.js';
import { parseText } from './csv.js';
import { autoMap } from './mapping.js';
import { runChecks } from './checks.js';
import { runAnalysis } from './analysis.js';

const Z = 1.959964;
const short = (name) => name.replace(/\s*\(([^)]*)\)$/, '');

let poolP = null;
/** The 13-cohort pool: 4 reference cohorts (individual data, Cox per year of age) + 9 pooled published series. */
export function heroPool() {
  if (!poolP) {
    poolP = Promise.all([allReferenceStats(), loadPublished()]).then(([refs, pub]) => {
      const studies = [
        ...refs.map((r) => ({ label: r.name, n: r.stats.n, type: 'ref', logHR: r.stats.cox.beta[0], se: r.stats.cox.se[0] })),
        ...pub.filter((p) => p.pooled && p.lo_year > 0 && p.hi_year > p.lo_year)
          .map((p) => ({ label: short(p.cohort), n: p.n, type: 'pub', logHR: Math.log(p.HR_year), se: (Math.log(p.hi_year) - Math.log(p.lo_year)) / (2 * Z) })),
      ];
      const meta = metaRandomEffects(studies.map((s) => s.logHR), studies.map((s) => s.se));
      return { studies, meta, refs };
    });
    poolP.catch(() => { poolP = null; });
  }
  return poolP;
}

let demoP = null;
/** The demo CSV through the wizard pipeline: parse → auto-map → checks → analysis. */
export function demoAnalysis() {
  if (!demoP) {
    demoP = fetch(`${baseUrl()}reference/demo_cohort_messy.csv`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
      .then(async (text) => {
        const { headers, rows } = parseText(text);
        const mapping = autoMap(headers, rows);
        const checks = runChecks(headers, rows, mapping);
        const analysis = await runAnalysis(checks.data);
        return { mapping, checks, analysis };
      });
    demoP.catch(() => { demoP = null; });
  }
  return demoP;
}

export const ciOf = (logHR, se) => ({ hr: Math.exp(logHR), lo: Math.exp(logHR - Z * se), hi: Math.exp(logHR + Z * se) });
