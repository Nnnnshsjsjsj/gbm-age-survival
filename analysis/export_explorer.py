#!/usr/bin/env python3
"""Export group-level survival curves (no individual prediction) for the public cohort explorer.
Usage: python3 export_explorer.py  ->  app/explorer_data.json
Small-group rule: no curve or statistic is exported for a group with fewer than 10 patients.
"""
import json, numpy as np, pandas as pd
from lifelines import KaplanMeierFitter
from lifelines.statistics import multivariate_logrank_test
MIN_N = 10
BANDS = [("<50", 0, 49.999), ("50–59", 50, 59.999), ("60–69", 60, 69.999), ("≥70", 70, 200)]
cohorts = {
 "TCGA-GBM": dict(df=pd.read_csv("cohort.csv"), country="USA", years="1989–2013", source="TCGA via cBioPortal (gbm_tcga)", note="Mostly pre-2010 diagnoses; many patients treated before temozolomide became standard in 2005."),
 "CGGA": dict(df=pd.read_csv("cgga_out/cgga_cohort_final.csv"), country="China", years="2006–2016", source="Chinese Glioma Genome Atlas (mRNAseq_693 + mRNAseq_325)", note="Primary WHO grade IV glioblastoma only. Younger than Western cohorts."),
 "MSK-IMPACT": dict(df=pd.read_csv("meta_out/cohorts/msk_impact_harmonised.csv"), country="USA", years="2014–2018", source="MSK-IMPACT glioma study via cBioPortal (glioma_mskcc_2019)", note="Patients had to survive until tumour sequencing, so survival looks longer than in unselected series."),
 "CPTAC-GBM": dict(df=pd.read_csv("meta_out/cohorts/cptac_gbm_harmonised.csv"), country="USA / international", years="2016–2019", source="CPTAC-3 GBM via cBioPortal (gbm_cptac_2021)", note="Small proteogenomic cohort with short follow-up."),
}
meta = json.load(open("meta_out/meta.json"))
out = {"min_group_n": MIN_N, "bands": [b[0] for b in BANDS], "cohorts": {}, "meta": {
    "pooled_all": {k: meta["pooled_all"][k] for k in ["k", "HR", "lo", "hi", "I2", "pred_lo", "pred_hi"]},
    "rows": [{k: r.get(k) for k in ["cohort", "type", "n", "events", "HR_year", "lo_year", "hi_year", "adjusted", "pooled", "country", "years"]} for r in meta["cohorts"]]}}
def km_curve(t, e, grid):
    kf = KaplanMeierFitter().fit(t, e)
    s = kf.survival_function_at_times(grid).values
    ci = kf.confidence_interval_survival_function_
    lo = np.interp(grid, ci.index.values, ci.iloc[:, 0].values); hi = np.interp(grid, ci.index.values, ci.iloc[:, 1].values)
    med = kf.median_survival_time_
    return dict(t=[round(float(x), 1) for x in grid], s=[round(float(x), 4) for x in s], lo=[round(float(x), 4) for x in lo], hi=[round(float(x), 4) for x in hi],
                median=None if not np.isfinite(med) else round(float(med), 1),
                s6=round(float(kf.predict(6)), 3), s12=round(float(kf.predict(12)), 3), s24=round(float(kf.predict(24)), 3), s36=round(float(kf.predict(36)), 3))
for name, c in cohorts.items():
    d = c["df"][["AGE", "OS_MONTHS", "event"]].dropna(); d = d[d.OS_MONTHS > 0]
    grid = np.arange(0, min(60, d.OS_MONTHS.max()) + 0.01, 0.5)
    rec = dict(country=c["country"], years=c["years"], source=c["source"], note=c["note"], n=len(d), deaths=int(d.event.sum()),
               median_age=float(d.AGE.median()), age_range=[int(d.AGE.min()), int(d.AGE.max())], all=km_curve(d.OS_MONTHS, d.event, grid), groups={})
    labels = pd.cut(d.AGE, [b[1] - 0.5 for b in BANDS] + [999], labels=[b[0] for b in BANDS], right=False)
    for lab in [b[0] for b in BANDS]:
        g = d[labels == lab]
        if len(g) < MIN_N: rec["groups"][lab] = dict(n=len(g), suppressed=True); continue
        rec["groups"][lab] = dict(n=len(g), deaths=int(g.event.sum()), suppressed=False, **km_curve(g.OS_MONTHS, g.event, grid))
    ok = labels.isin([k for k, v in rec["groups"].items() if not v["suppressed"]])
    rec["logrank_p"] = float(multivariate_logrank_test(d.OS_MONTHS[ok], labels[ok].astype(str), d.event[ok]).p_value)
    hr = next(r for r in meta["cohorts"] if r["cohort"] == name); rec["hr_year"] = dict(HR=hr["HR_year"], lo=hr["lo_year"], hi=hr["hi_year"])
    out["cohorts"][name] = rec
    print(name, len(d), int(d.event.sum()), {k: v["n"] for k, v in rec["groups"].items()}, f"log-rank p={rec['logrank_p']:.2g}")
json.dump(out, open("app/explorer_data.json", "w"), separators=(",", ":"))
print("app/explorer_data.json", round(len(json.dumps(out)) / 1024), "KB")
