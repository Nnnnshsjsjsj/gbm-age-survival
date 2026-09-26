// Wizard state. Lives in memory only; nothing is written to storage.
import { createContext, useContext, useMemo, useState } from 'react';

const Ctx = createContext(null);

export const STEPS = ['upload', 'map', 'check', 'analyse', 'compare'];

export function CohortProvider({ children }) {
  const [file, setFile] = useState(null);        // { name, headers, rows, delimiter }
  const [mapping, setMapping] = useState(null);  // see lib/mapping.js
  const [checks, setChecks] = useState(null);    // result of runChecks
  const [analysis, setAnalysis] = useState(null);
  const [share, setShare] = useState({ cohort_name: '', country: '', years_from: '', years_to: '' });

  const value = useMemo(() => ({
    file, mapping, checks, analysis, share,
    setShare,
    loadFile(f) { setFile(f); setMapping(null); setChecks(null); setAnalysis(null); },
    setMapping(m) { setMapping(m); setChecks(null); setAnalysis(null); },
    setChecks(c) { setChecks(c); setAnalysis(null); },
    setAnalysis,
    reset() { setFile(null); setMapping(null); setChecks(null); setAnalysis(null); },
    /** Highest step index the user may open. */
    maxStep() { if (!file) return 0; if (!mapping) return 1; if (!checks || !checks.canProceed) return 2; if (!analysis) return 3; return 4; },
  }), [file, mapping, checks, analysis, share]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useCohort = () => useContext(Ctx);
