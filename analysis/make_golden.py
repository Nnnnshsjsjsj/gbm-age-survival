#!/usr/bin/env python3
"""Golden values for the JavaScript statistics engine (platform/tests/golden.json) and public reference cohorts.
Every number here comes from lifelines; the JS engine must match them to the stated tolerance."""
import json, os, numpy as np, pandas as pd
from lifelines import CoxPHFitter, KaplanMeierFitter
from lifelines.statistics import logrank_test, multivariate_logrank_test, proportional_hazard_test
os.makedirs("platform/public/reference", exist_ok=True); os.makedirs("platform/tests", exist_ok=True)
cols = ["pid", "AGE", "OS_MONTHS", "event", "male", "kps10", "mgmt_meth", "idh_mut"]
tc = pd.read_csv("cohort.csv")[cols]; cg = pd.read_csv("cgga_out/cgga_cohort_final.csv")
cg["kps10"] = np.nan; cg = cg[cols]
mk = pd.read_csv("meta_out/cohorts/msk_impact_harmonised.csv"); mk["kps10"] = np.nan; mk["idh_mut"] = np.nan; mk = mk[cols]
cp = pd.read_csv("meta_out/cohorts/cptac_gbm_harmonised.csv"); cp["kps10"] = np.nan; cp["mgmt_meth"] = np.nan; cp["idh_mut"] = np.nan; cp = cp[cols]
ref = {"tcga_gbm": tc, "cgga": cg, "msk_impact": mk, "cptac_gbm": cp}
for k, d in ref.items():
    d = d.copy(); d["OS_MONTHS"] = d.OS_MONTHS.round(3); d.to_csv(f"platform/public/reference/{k}.csv", index=False)
G = {"note": "Produced by make_golden.py with lifelines. Tolerances: coefficients 1e-3 absolute on log scale; probabilities 1e-3; p-values relative 5%.", "cohorts": {}}
def cox(d, xs):
    s = d[["OS_MONTHS", "event", *xs]].dropna(); m = CoxPHFitter().fit(s, "OS_MONTHS", "event")
    ph = proportional_hazard_test(m, s, time_transform="rank")
    return dict(covariates=xs, n=len(s), events=int(s.event.sum()), beta=[float(m.params_[x]) for x in xs], se=[float(m.standard_errors_[x]) for x in xs],
                p=[float(m.summary.loc[x, "p"]) for x in xs], log_likelihood=float(m.log_likelihood_), concordance=float(m.concordance_index_),
                schoenfeld_p=[float(ph.summary.loc[x, "p"]) if x in ph.summary.index else float(ph.summary.loc[(x, "rank"), "p"]) for x in xs])
for k, d in ref.items():
    km = KaplanMeierFitter().fit(d.OS_MONTHS, d.event); ci = km.confidence_interval_survival_function_
    def at(t):
        i = ci.index.get_indexer([t], method="ffill")[0]; return [float(ci.iloc[i, 0]), float(ci.iloc[i, 1])]
    g = dict(n=len(d), events=int(d.event.sum()),
             km=dict(median=float(km.median_survival_time_), s6=float(km.predict(6)), s12=float(km.predict(12)), s24=float(km.predict(24)),
                     ci12=at(12), ci24=at(24)),
             logrank_age59=dict(p=float(logrank_test(d.OS_MONTHS[d.AGE >= 59], d.OS_MONTHS[d.AGE < 59], d.event[d.AGE >= 59], d.event[d.AGE < 59]).p_value),
                                chi2=float(logrank_test(d.OS_MONTHS[d.AGE >= 59], d.OS_MONTHS[d.AGE < 59], d.event[d.AGE >= 59], d.event[d.AGE < 59]).test_statistic)),
             cox_age=cox(d, ["AGE"]), cox_age_sex=cox(d, ["AGE", "male"]))
    bands = pd.cut(d.AGE, [0, 49.999, 59.999, 69.999, 200], labels=["<50", "50-59", "60-69", ">=70"]).astype(str)
    lr = multivariate_logrank_test(d.OS_MONTHS, bands, d.event); g["logrank_4bands"] = dict(p=float(lr.p_value), chi2=float(lr.test_statistic), df=3)
    if k == "tcga_gbm":
        g["cox_m2"] = cox(d, ["AGE", "male", "kps10"]); g["cox_m5"] = cox(d, ["AGE", "male", "kps10", "mgmt_meth", "idh_mut"])
    if k == "cgga": g["cox_full"] = cox(d, ["AGE", "male", "mgmt_meth", "idh_mut"])
    G["cohorts"][k] = g
# meta-analysis golden (DerSimonian–Laird) from meta.json
meta = json.load(open("meta_out/meta.json")); rows = [r for r in meta["cohorts"] if r["pooled"]]
G["meta"] = dict(logHR=[r["logHR"] for r in rows], se=[r["se"] for r in rows], expected={k: meta["pooled_all"][k] for k in ["HR", "lo", "hi", "tau", "I2", "Q", "Q_p", "pred_lo", "pred_hi"]})
# a small synthetic messy cohort for upload testing (known HR 1.03/yr, exponential baseline, 35% censoring)
rng = np.random.default_rng(7); n = 60; age = rng.integers(22, 84, n); lam = 0.05 * np.exp(0.0296 * (age - 55))
tt = rng.exponential(1 / lam); cens = rng.exponential(1 / 0.02, n); obs = np.minimum(tt, cens); ev = (tt <= cens).astype(int)
demo = pd.DataFrame({"Patient": [f"P{i:03d}" for i in range(n)], "Age at Dx": age, "Sex": rng.choice(["M", "F", "male", "female"], n), "Survival (days)": (obs * 30.4375).round(0),
                     "Status": np.where(ev == 1, "dead", "alive"), "IDH1": rng.choice(["mut", "wt", ""], n, p=[.1, .8, .1]), "MGMT promoter": rng.choice(["methylated", "unmethylated", "NA"], n)})
demo.to_csv("platform/public/reference/demo_cohort_messy.csv", index=False)
dd = pd.DataFrame({"OS_MONTHS": obs, "event": ev, "AGE": age}); mm = CoxPHFitter().fit(dd, "OS_MONTHS", "event")
G["demo"] = dict(n=n, events=int(ev.sum()), beta_age=float(mm.params_["AGE"]), se_age=float(mm.standard_errors_["AGE"]))
json.dump(G, open("platform/tests/golden.json", "w"), indent=1)
print(json.dumps({k: (v["cox_age"]["beta"], v["km"]["median"]) for k, v in G["cohorts"].items()}, indent=0)); print("demo", G["demo"])
