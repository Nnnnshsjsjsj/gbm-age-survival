#!/usr/bin/env python3
"""TCGA-GBM (gbm_tcga): age at diagnosis and overall survival.
Reads data/, writes figures/."""
import os, re, numpy as np, pandas as pd
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from sklearn.mixture import GaussianMixture
from lifelines import KaplanMeierFitter, CoxPHFitter
from lifelines.statistics import (logrank_test, multivariate_logrank_test,
                                  proportional_hazard_test)
UP, OUT = "data", "figures"
os.makedirs(OUT, exist_ok=True)

# ---- 1. load, verify study, deduplicate to one row per patient
df = pd.read_csv(f"{UP}/clinical.tsv", sep="\t", low_memory=False)
assert df["Study ID"].unique().tolist() == ["gbm_tcga"], "wrong study"
print(f"raw: {len(df)} rows, {df['Patient ID'].nunique()} patients")
df["pid"] = df["Patient ID"].astype(str).str[:12]
df = df.sort_values("Overall Survival (Months)").drop_duplicates("pid")

# ---- 2. parse the censoring indicator out of '1:DECEASED' / '0:LIVING'
print(df["Overall Survival Status"].value_counts(dropna=False).to_string())
def parse_event(v):
    if pd.isna(v): return np.nan
    s = str(v).strip(); m = re.match(r"^([01]):", s)
    if m: return int(m.group(1))
    if s in ("0","1"): return int(s)
    u = s.upper()
    return 1 if ("DECEAS" in u or u=="DEAD") else (0 if ("LIVING" in u or u=="ALIVE") else np.nan)
df["event"]     = df["Overall Survival Status"].map(parse_event)
df["OS_MONTHS"] = pd.to_numeric(df["Overall Survival (Months)"], errors="coerce")
df["AGE"]       = pd.to_numeric(df["Diagnosis Age"], errors="coerce")

# ---- 3. complete-case filter
d = df[df.OS_MONTHS.notna() & df.event.notna() & df.AGE.notna() & (df.OS_MONTHS>0)].copy()
print(f"cohort: {len(d)} patients, {int(d.event.sum())} deaths ({d.event.mean()*100:.1f}%)")

# ---- 4. IDH (NP = not profiled stays missing, never coerced to wildtype)
mut = pd.read_csv(f"{UP}/mutations.txt", sep="\t")
mut["idh_mut"] = mut.apply(lambda r: np.nan if (r.IDH1=="NP" and r.IDH2=="NP")
                  else float(r.IDH1 not in ("WT","NP") or r.IDH2 not in ("WT","NP")), axis=1)
mut["pid"] = mut.SAMPLE_ID.str[:12]
d = d.merge(mut.sort_values("idh_mut", ascending=False).drop_duplicates("pid")[["pid","idh_mut"]],
            on="pid", how="left")

# ---- 5. MGMT: dichotomise beta with a 2-component GMM, per platform
frames = []
for plat, fn in [("HM27","methylation_hm27.txt"), ("HM450","methylation_hm450.txt")]:
    t = pd.read_csv(f"{UP}/{fn}", sep="\t")
    t["beta"] = pd.to_numeric(t.MGMT, errors="coerce"); t = t[t.beta.notna()].copy()
    X = t.beta.values.reshape(-1,1); gm = GaussianMixture(2, random_state=0).fit(X)
    t["mgmt_meth"] = (gm.predict(X) == int(np.argmax(gm.means_.ravel()))).astype(float)
    print(f"MGMT {plat}: n={len(t)} cutoff~{t.loc[t.mgmt_meth==1,'beta'].min():.3f} "
          f"methylated {int(t.mgmt_meth.sum())} ({t.mgmt_meth.mean()*100:.1f}%)")
    frames.append(t)
mg = pd.concat(frames); mg["pid"] = mg.SAMPLE_ID.str[:12]
d = d.merge(mg.sort_values("beta", ascending=False).drop_duplicates("pid")[["pid","beta","mgmt_meth"]],
            on="pid", how="left")
d["male"]  = (d.Sex=="Male").astype(float); d.loc[d.Sex.isna(),"male"] = np.nan
d["kps10"] = d["Karnofsky Performance Score"]/10.0

# ---- 6. age distribution
med = d.AGE.median()
print(f"age: median {med:.1f} mean {d.AGE.mean():.1f} IQR {d.AGE.quantile(.25):.0f}-"
      f"{d.AGE.quantile(.75):.0f} range {d.AGE.min():.0f}-{d.AGE.max():.0f}")
f, ax = plt.subplots(figsize=(7,4.2))
ax.hist(d.AGE, bins=25, color="#4C72B0", edgecolor="white")
ax.axvline(med, color="#C44E52", ls="--", lw=2, label=f"median = {med:.0f} y")
ax.set_xlabel("Age at diagnosis (years)"); ax.set_ylabel("Patients"); ax.legend()
ax.set_title(f"TCGA-GBM age at diagnosis (n={len(d)})")
f.tight_layout(); f.savefig(f"{OUT}/fig1_age_histogram.png", dpi=160)

# ---- 7. KM by median split
d["grp"] = np.where(d.AGE < med, f"Young (<{med:.0f})", f"Old (>={med:.0f})")
f, ax = plt.subplots(figsize=(7.5,5))
for lab, c in zip(sorted(d.grp.unique()), ["#C44E52","#4C72B0"]):
    g = d[d.grp==lab]
    k = KaplanMeierFitter(label=f"{lab}  (n={len(g)})").fit(g.OS_MONTHS, g.event)
    k.plot_survival_function(ax=ax, color=c)
    print(f"{lab}: deaths={int(g.event.sum())} median OS={k.median_survival_time_:.1f} mo")
y, o = d[d.grp.str.startswith("Young")], d[d.grp.str.startswith("Old")]
lr = logrank_test(y.OS_MONTHS, o.OS_MONTHS, y.event, o.event)
print(f"log-rank chi2={lr.test_statistic:.2f} p={lr.p_value:.3g}")
ax.set_xlim(0,80); ax.set_ylim(0,1); ax.set_title("Overall survival by age group")
ax.set_xlabel("Months since diagnosis"); ax.set_ylabel("Overall survival probability")
ax.text(.6,.85,f"log-rank p = {lr.p_value:.1e}", transform=ax.transAxes, bbox=dict(fc="white",ec="0.7"))
f.tight_layout(); f.savefig(f"{OUT}/fig2_km_age_groups.png", dpi=160)

# ---- 8. KM by quartile (monotonic dose-response)
d["q"] = pd.qcut(d.AGE, 4)
f, ax = plt.subplots(figsize=(7.5,5))
for (lab,g),c in zip(d.groupby("q", observed=True), ["#2E7D32","#4C72B0","#E1A100","#C44E52"]):
    k = KaplanMeierFitter(label=f"{lab.left:.0f}-{lab.right:.0f} y (n={len(g)})")
    k.fit(g.OS_MONTHS, g.event); k.plot_survival_function(ax=ax, ci_show=False, color=c, lw=2)
    print(f"{str(lab):>16} n={len(g):3d} median OS={k.median_survival_time_:5.1f} mo")
ml = multivariate_logrank_test(d.OS_MONTHS, d.q, d.event)
print(f"log-rank 4 groups: chi2={ml.test_statistic:.1f} p={ml.p_value:.3g}")
ax.set_xlim(0,60); ax.set_ylim(0,1); ax.set_title("Overall survival by age quartile")
ax.set_xlabel("Months since diagnosis"); ax.set_ylabel("Overall survival probability")
ax.text(.55,.80,f"log-rank p = {ml.p_value:.1e}", transform=ax.transAxes, bbox=dict(fc="white",ec="0.7"))
f.tight_layout(); f.savefig(f"{OUT}/fig3_km_age_quartiles.png", dpi=160)

# ---- 9. nested Cox models
MODELS = [("M1  age alone",["AGE"]), ("M2  + sex + KPS",["AGE","male","kps10"]),
          ("M3  + MGMT",["AGE","mgmt_meth"]), ("M4  + IDH",["AGE","idh_mut"]),
          ("M5  full",["AGE","male","kps10","idh_mut","mgmt_meth"])]
rows = []
for name, cols in MODELS:
    s = d[["OS_MONTHS","event"]+cols].dropna()
    m = CoxPHFitter().fit(s, "OS_MONTHS", "event")
    lo, hi = np.exp(m.confidence_intervals_.loc["AGE"])
    ph = proportional_hazard_test(m, s, time_transform="km").summary["p"].min()
    rows.append(dict(model=name, n=len(s), events=int(s.event.sum()),
                     HR=m.hazard_ratios_["AGE"], lo=lo, hi=hi,
                     p=m.summary.loc["AGE","p"], C=m.concordance_index_, PH_p=ph))
    print(f"\n--- {name} (n={len(s)}) ---")
    print(m.summary[["exp(coef)","exp(coef) lower 95%","exp(coef) upper 95%","p"]].round(4).to_string())
res = pd.DataFrame(rows); res.to_csv(f"{OUT}/nested_models.csv", index=False)
print("\n"+res.round(4).to_string(index=False))

f, ax = plt.subplots(figsize=(7.5,4)); yy = np.arange(len(res))[::-1]
ax.errorbar(res.HR, yy, xerr=[res.HR-res.lo, res.hi-res.HR], fmt="o",
            color="#4C72B0", capsize=4, lw=1.8, ms=7)
ax.axvline(1.0, color="0.5", ls="--"); ax.set_yticks(yy)
ax.set_yticklabels([f"{r.model}\nn={r.n}, {r.events} deaths" for r in res.itertuples()], fontsize=9)
ax.set_xlabel("Hazard ratio per additional year of age (95% CI)")
ax.set_title("Age effect is stable across adjustment sets")
f.tight_layout(); f.savefig(f"{OUT}/fig4_forest_nested.png", dpi=160)

# ---- 10. PH violation: age acts more strongly in the first year
CUT = 12.0
early = d.copy(); early["event"] = np.where(d.OS_MONTHS<=CUT, d.event, 0)
early["OS_MONTHS"] = np.minimum(d.OS_MONTHS, CUT)
late = d[d.OS_MONTHS>CUT].copy(); late["OS_MONTHS"] -= CUT
for lab, s in [(f"0-{CUT:.0f} mo", early), (f">{CUT:.0f} mo", late)]:
    m = CoxPHFitter().fit(s[["OS_MONTHS","event","AGE"]], "OS_MONTHS", "event")
    lo, hi = np.exp(m.confidence_intervals_.loc["AGE"])
    print(f"{lab:>9}: n={len(s):3d} deaths={int(s.event.sum()):3d} "
          f"HR/yr={m.hazard_ratios_['AGE']:.4f} ({lo:.4f}-{hi:.4f}) p={m.summary.loc['AGE','p']:.3g}")

# ---- 11. IDH sensitivity (WHO CNS5)
prof = d[d.idh_mut.notna()]
for lab, s in prof.groupby(prof.idh_mut.map({1:"mutant",0:"wildtype"})):
    k = KaplanMeierFitter().fit(s.OS_MONTHS, s.event)
    print(f"{lab:9s} n={len(s):3d} median age={s.AGE.median():4.1f} median OS={k.median_survival_time_:5.1f} mo")
wt = prof[prof.idh_mut==0]
m = CoxPHFitter().fit(wt[["OS_MONTHS","event","AGE"]], "OS_MONTHS", "event")
lo, hi = np.exp(m.confidence_intervals_.loc["AGE"])
print(f"IDH-wildtype only (n={len(wt)}): HR/yr={m.hazard_ratios_['AGE']:.4f} "
      f"({lo:.4f}-{hi:.4f}) p={m.summary.loc['AGE','p']:.3g}")

d.to_csv(f"{OUT}/gbm_cohort_final.csv", index=False)
print(f"\nwritten to {OUT}/")
