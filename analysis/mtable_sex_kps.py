#!/usr/bin/env python3
"""Separate the roles of sex and KPS in the adjusted age model (answers the supervisor's question about M2).
Usage: python3 mtable_sex_kps.py <out_dir>
Writes sex_kps_table.csv, sex_kps.json, kps_audit.txt
"""
import sys, os, json, numpy as np, pandas as pd
from lifelines import CoxPHFitter
OUT = sys.argv[1] if len(sys.argv) > 1 else "results"; os.makedirs(OUT, exist_ok=True)
d = pd.read_csv("cohort.csv")
rows, out = [], {}
def fit(df, cols, label):
    s = df[["OS_MONTHS", "event", *cols]].dropna(); m = CoxPHFitter().fit(s, "OS_MONTHS", "event")
    r = dict(model=label, n=len(s), events=int(s.event.sum()), C=round(float(m.concordance_index_), 3))
    for c in cols:
        q = m.summary.loc[c]; r[c] = dict(HR=float(np.exp(q["coef"])), lo=float(np.exp(q["coef lower 95%"])), hi=float(np.exp(q["coef upper 95%"])), p=float(q["p"]))
    rows.append(r); return r
k = d[d.kps10.notna()]
fit(d, ["AGE"], "Age only, all patients")
fit(d, ["AGE", "male"], "Age + sex, all patients")
fit(d, ["male"], "Sex only, all patients")
fit(k, ["AGE"], "Age only, KPS subset")
fit(k, ["AGE", "male"], "Age + sex, KPS subset")
fit(k, ["AGE", "kps10"], "Age + KPS, KPS subset")
fit(k, ["AGE", "male", "kps10"], "Age + sex + KPS (M2)")
# audit: KPS = 0 records
z = d[d["Karnofsky Performance Score"] == 0]
audit = ["KPS = 0 records (KPS 0 means dead at assessment, so it is not a valid pre-treatment score):"]
for _, r in z.iterrows():
    audit.append(f"  {r.pid}: age {r.AGE:.0f}, OS {r.OS_MONTHS:.1f} months, event {int(r.event)}, sex {'M' if r.male==1 else 'F'}")
k2 = k[k["Karnofsky Performance Score"] > 0]
r_wo = fit(k2, ["AGE", "male", "kps10"], "Age + sex + KPS, KPS = 0 excluded")
audit.append(f"M2 refit without them: n={r_wo['n']}, age HR {r_wo['AGE']['HR']:.3f} ({r_wo['AGE']['lo']:.3f}–{r_wo['AGE']['hi']:.3f}); KPS HR per 10 points {r_wo['kps10']['HR']:.3f}; male HR {r_wo['male']['HR']:.3f}")
out["rows"] = rows
out["corr_age_kps"] = float(k[["AGE", "kps10"]].corr().iloc[0, 1])
out["kps_missing_n"] = int(d.kps10.isna().sum())
out["age_mean_kps_missing"] = float(d[d.kps10.isna()].AGE.mean()); out["age_mean_kps_present"] = float(k.AGE.mean())
open(f"{OUT}/kps_audit.txt", "w").write("\n".join(audit) + "\n"); print("\n".join(audit))
flat = []
for r in rows:
    f = dict(model=r["model"], n=r["n"], events=r["events"], C=r["C"])
    for c in ["AGE", "male", "kps10"]:
        if c in r: f[f"{c}_HR"] = round(r[c]["HR"], 3); f[f"{c}_lo"] = round(r[c]["lo"], 3); f[f"{c}_hi"] = round(r[c]["hi"], 3); f[f"{c}_p"] = r[c]["p"]
    flat.append(f)
pd.DataFrame(flat).to_csv(f"{OUT}/sex_kps_table.csv", index=False)
json.dump(out, open(f"{OUT}/sex_kps.json", "w"), indent=1)
print(pd.DataFrame(flat).to_string()); print("corr age-KPS", round(out["corr_age_kps"], 3))
