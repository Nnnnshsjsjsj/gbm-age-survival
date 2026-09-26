#!/usr/bin/env python3
"""Fit the ladder of Cox models used by the calculator and export them as JSON.

For every subset of the optional covariates (age is always in), we fit a Cox model on the
complete cases for that subset and store: coefficients, their covariance, the covariate means
lifelines centres on, the baseline survival on a monthly grid, and fit statistics.

Usage: python3 export_models.py <cohort.csv> <cohort_label> <out.json>
The cohort CSV must contain OS_MONTHS, event, AGE and any of: male, kps10, mgmt_meth, idh_mut.
"""
import sys, json, itertools
import numpy as np, pandas as pd
from lifelines import CoxPHFitter

src, label, out = sys.argv[1], sys.argv[2], sys.argv[3]
d = pd.read_csv(src)
OPTIONAL = [c for c in ["male", "kps10", "mgmt_meth", "idh_mut"] if c in d.columns and d[c].notna().sum() > 30]
GRID = np.arange(0, 60.5, 0.5)

models = {}
for r in range(len(OPTIONAL) + 1):
    for subset in itertools.combinations(OPTIONAL, r):
        cols = ["AGE", *subset]
        s = d[["OS_MONTHS", "event", *cols]].dropna()
        if len(s) < 40 or s.event.sum() < 20:
            continue
        m = CoxPHFitter().fit(s, "OS_MONTHS", "event")
        S0 = m.baseline_survival_["baseline survival"]
        # step function evaluated on the grid (right-continuous)
        S0g = np.interp(GRID, S0.index.values, S0.values, left=1.0, right=S0.values[-1])
        # keep it a proper step: use previous knot value
        idx = np.searchsorted(S0.index.values, GRID, side="right") - 1
        S0g = np.where(idx >= 0, S0.values[np.clip(idx, 0, len(S0) - 1)], 1.0)
        key = "+".join(cols)
        models[key] = dict(
            covariates=cols,
            beta=[float(m.params_[c]) for c in cols],
            cov=[[float(m.variance_matrix_.loc[a, b]) for b in cols] for a in cols],
            means=[float(s[c].mean()) for c in cols],
            baseline_S=[round(float(v), 5) for v in S0g],
            n=int(len(s)), events=int(s.event.sum()),
            c_index=round(float(m.concordance_index_), 3),
            hr_age=round(float(np.exp(m.params_["AGE"])), 4),
            hr_age_ci=[round(float(v), 4) for v in np.exp(m.confidence_intervals_.loc["AGE"])],
        )
        print(f"{label:6s} {key:32s} n={len(s):4d} ev={int(s.event.sum()):4d} HR_age={models[key]['hr_age']:.4f} C={m.concordance_index_:.3f}")

payload = dict(
    cohort=label,
    grid_months=[float(g) for g in GRID],
    optional_covariates=OPTIONAL,
    n_total=int(len(d)), events_total=int(d.event.sum()),
    age_range=[float(d.AGE.min()), float(d.AGE.max())],
    models=models,
)
json.dump(payload, open(out, "w"), separators=(",", ":"))
print("wrote", out, f"({len(models)} models)")
