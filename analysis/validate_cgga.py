#!/usr/bin/env python3
"""External validation of the TCGA-GBM age effect in the CGGA cohort.

Usage:
    python3 validate_cgga.py <CGGA_693_clinical.txt> <CGGA_325_clinical.txt> [out_dir]

Reads the two CGGA clinical tables, builds a primary-glioblastoma cohort that mirrors the
TCGA one, repeats the TCGA analyses (median split at 59, quartiles, nested Cox models,
12-month time split, IDH-wildtype sensitivity) and writes figures, tables and a JSON
summary to out_dir. Also compares the age hazard ratio with the TCGA values.
"""
import sys, os, json, re
import numpy as np, pandas as pd
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from lifelines import KaplanMeierFitter, CoxPHFitter
from lifelines.statistics import logrank_test, multivariate_logrank_test, proportional_hazard_test
from scipy.stats import mannwhitneyu

f693, f325 = sys.argv[1], sys.argv[2]
OUT = sys.argv[3] if len(sys.argv) > 3 else "cgga_out"
os.makedirs(OUT, exist_ok=True)
plt.rcParams["font.family"] = "DejaVu Sans"
log = []
def P(*a):
    s = " ".join(str(x) for x in a); print(s); log.append(s)

# ------------------------------------------------------------------ 1. load + harmonise
def load(path, batch):
    t = pd.read_csv(path, sep="\t", dtype=str)
    t.columns = [c.strip() for c in t.columns]
    def col(pattern):
        hits = [c for c in t.columns if re.search(pattern, c, re.I)]
        if not hits: raise SystemExit(f"{path}: no column matching /{pattern}/. Columns: {list(t.columns)}")
        return hits[0]
    out = pd.DataFrame({
        "pid":       t[col(r"^CGGA_ID$")].str.strip(),
        "prs":       t[col(r"PRS_type")].str.strip(),
        "histology": t[col(r"Histology")].str.strip(),
        "grade":     t[col(r"^Grade")].str.strip(),
        "sex":       t[col(r"Gender")].str.strip(),
        "AGE":       pd.to_numeric(t[col(r"^Age")], errors="coerce"),
        "OS_DAYS":   pd.to_numeric(t[col(r"^OS")], errors="coerce"),
        "event":     pd.to_numeric(t[col(r"Censor")], errors="coerce"),
        "radio":     pd.to_numeric(t[col(r"Radio_status")], errors="coerce"),
        "chemo":     pd.to_numeric(t[col(r"Chemo_status")], errors="coerce"),
        "idh":       t[col(r"IDH_mutation_status")].str.strip(),
        "mgmt":      t[col(r"MGMTp_methylation_status")].str.strip(),
    })
    out["batch"] = batch
    return out

raw = pd.concat([load(f693, "mRNAseq_693"), load(f325, "mRNAseq_325")], ignore_index=True)
P(f"raw rows: {len(raw)}  (693-batch {int((raw.batch=='mRNAseq_693').sum())}, 325-batch {int((raw.batch=='mRNAseq_325').sum())})")
P("PRS_type:", raw.prs.value_counts(dropna=False).to_dict())
P("Histology:", raw.histology.value_counts(dropna=False).to_dict())
P("Grade:", raw.grade.value_counts(dropna=False).to_dict())

dup = raw.pid.duplicated().sum(); raw = raw.drop_duplicates("pid")
P(f"duplicate CGGA_IDs across batches removed: {dup}  -> {len(raw)} patients")

# ------------------------------------------------------------------ 2. cohort: primary glioblastoma, WHO IV
is_gbm  = raw.histology.str.upper().eq("GBM")
is_iv   = raw.grade.str.contains("IV", case=False, na=False)
is_prim = raw.prs.str.lower().eq("primary")
steps = [("All patients", np.ones(len(raw), bool)),
         ("WHO grade IV", is_iv.values),
         ("Histology GBM (excludes rGBM, sGBM)", (is_iv & is_gbm).values),
         ("Primary tumour (PRS_type = Primary)", (is_iv & is_gbm & is_prim).values)]
for name, mask in steps: P(f"  {name:45s} n = {int(mask.sum())}")
d = raw[is_iv & is_gbm & is_prim].copy()

d["OS_MONTHS"] = d.OS_DAYS / 30.4375
d["male"]      = d.sex.str.lower().map({"male": 1.0, "female": 0.0})
d["idh_mut"]   = d.idh.str.lower().map({"mutant": 1.0, "wildtype": 0.0})
d["mgmt_meth"] = d.mgmt.str.lower().map({"methylated": 1.0, "un-methylated": 0.0, "unmethylated": 0.0})
n0 = len(d)
miss = dict(no_os_or_status=int((d.OS_MONTHS.isna() | d.event.isna()).sum()),
            no_age=int(d.AGE.isna().sum()), os_zero=int((d.OS_MONTHS <= 0).sum()))
d = d[d.OS_MONTHS.notna() & d.event.notna() & d.AGE.notna() & (d.OS_MONTHS > 0)].copy()
P(f"primary GBM: {n0} -> complete cases {len(d)} ({len(d)/n0*100:.1f}%)  excluded {n0-len(d)} {miss}")
P(f"deaths {int(d.event.sum())} ({d.event.mean()*100:.1f}%), censored {int((d.event==0).sum())}")
P(f"age: median {d.AGE.median():.1f} mean {d.AGE.mean():.1f} IQR {d.AGE.quantile(.25):.0f}-{d.AGE.quantile(.75):.0f} range {d.AGE.min():.0f}-{d.AGE.max():.0f}")
P("sex:", d.sex.value_counts().to_dict())
P(f"IDH known {int(d.idh_mut.notna().sum())}, mutant {int(d.idh_mut.sum())} ({d.idh_mut.mean()*100:.1f}%)")
P(f"MGMT known {int(d.mgmt_meth.notna().sum())}, methylated {int(d.mgmt_meth.sum())} ({d.mgmt_meth.mean()*100:.1f}%)")
P(f"radiotherapy known {int(d.radio.notna().sum())}, treated {int(d.radio.sum())}; TMZ known {int(d.chemo.notna().sum())}, treated {int(d.chemo.sum())}")
km = KaplanMeierFitter().fit(d.OS_MONTHS, d.event)
rkm = KaplanMeierFitter().fit(d.OS_MONTHS, 1 - d.event)
P(f"median OS {km.median_survival_time_:.1f} mo; 1y {km.predict(12)*100:.1f}% 2y {km.predict(24)*100:.1f}% 5y {km.predict(60)*100:.1f}%; median follow-up (reverse KM) {rkm.median_survival_time_:.1f} mo")
summary = dict(n=len(d), deaths=int(d.event.sum()), median_age=float(d.AGE.median()),
               median_os=float(km.median_survival_time_), s12=float(km.predict(12)), s24=float(km.predict(24)),
               s60=float(km.predict(60)), median_fu=float(rkm.median_survival_time_), steps={k: int(v.sum()) for k, v in steps},
               excluded=miss, idh_known=int(d.idh_mut.notna().sum()), idh_mut=int(d.idh_mut.sum()),
               mgmt_known=int(d.mgmt_meth.notna().sum()), mgmt_meth=int(d.mgmt_meth.sum()),
               male=int(d.male.sum()), radio_treated=int(d.radio.sum()), chemo_treated=int(d.chemo.sum()))

# ------------------------------------------------------------------ 3. KM at the TCGA cut-off (59) and at CGGA's own median
def km_split(cut, tag):
    y, o = d[d.AGE < cut], d[d.AGE >= cut]
    ky = KaplanMeierFitter(label=f"Younger (<{cut:.0f})  (n={len(y)})").fit(y.OS_MONTHS, y.event)
    ko = KaplanMeierFitter(label=f"Older (>={cut:.0f})  (n={len(o)})").fit(o.OS_MONTHS, o.event)
    lr = logrank_test(y.OS_MONTHS, o.OS_MONTHS, y.event, o.event)
    P(f"[{tag}] cut {cut:.0f}: young n={len(y)} d={int(y.event.sum())} med={ky.median_survival_time_:.1f} 1y={ky.predict(12)*100:.1f} 2y={ky.predict(24)*100:.1f} | "
      f"old n={len(o)} d={int(o.event.sum())} med={ko.median_survival_time_:.1f} 1y={ko.predict(12)*100:.1f} 2y={ko.predict(24)*100:.1f} | chi2={lr.test_statistic:.1f} p={lr.p_value:.2g}")
    f, ax = plt.subplots(figsize=(7.5, 5))
    ko.plot_survival_function(ax=ax, color="#C44E52"); ky.plot_survival_function(ax=ax, color="#4C72B0")
    ax.set_xlim(0, 80); ax.set_ylim(0, 1); ax.set_xlabel("Months since diagnosis"); ax.set_ylabel("Overall survival probability")
    ax.set_title(f"CGGA primary GBM: overall survival by age group (cut-off {cut:.0f} y)")
    ax.text(.6, .85, f"log-rank p = {lr.p_value:.1e}", transform=ax.transAxes, bbox=dict(fc="white", ec="0.7"))
    f.tight_layout(); f.savefig(f"{OUT}/cgga_km_age_{tag}.png", dpi=160); plt.close(f)
    return dict(cut=cut, young=dict(n=len(y), deaths=int(y.event.sum()), median=float(ky.median_survival_time_), s12=float(ky.predict(12)), s24=float(ky.predict(24))),
                old=dict(n=len(o), deaths=int(o.event.sum()), median=float(ko.median_survival_time_), s12=float(ko.predict(12)), s24=float(ko.predict(24))),
                chi2=float(lr.test_statistic), p=float(lr.p_value))
summary["split_59"] = km_split(59.0, "cut59")
summary["split_median"] = km_split(float(d.AGE.median()), "median")

# ------------------------------------------------------------------ 4. quartiles
d["q"] = pd.qcut(d.AGE, 4)
qrows = []
f, ax = plt.subplots(figsize=(7.5, 5))
for (lab, g), c in zip(d.groupby("q", observed=True), ["#2E7D32", "#4C72B0", "#E1A100", "#C44E52"]):
    k = KaplanMeierFitter(label=f"{lab.left:.0f}-{lab.right:.0f} y (n={len(g)})").fit(g.OS_MONTHS, g.event)
    k.plot_survival_function(ax=ax, ci_show=False, color=c, lw=2)
    qrows.append(dict(range=f"{g.AGE.min():.0f}–{g.AGE.max():.0f}", n=len(g), deaths=int(g.event.sum()),
                      median=float(k.median_survival_time_), s12=float(k.predict(12)), s24=float(k.predict(24))))
    P(f"quartile {qrows[-1]['range']:>7s} n={len(g):3d} d={int(g.event.sum()):3d} med={k.median_survival_time_:5.1f} 1y={k.predict(12)*100:.1f} 2y={k.predict(24)*100:.1f}")
ml = multivariate_logrank_test(d.OS_MONTHS, d.q, d.event)
P(f"4-group log-rank chi2={ml.test_statistic:.1f} p={ml.p_value:.2g}")
ax.set_xlim(0, 60); ax.set_ylim(0, 1); ax.set_title("CGGA primary GBM: overall survival by age quartile")
ax.set_xlabel("Months since diagnosis"); ax.set_ylabel("Overall survival probability")
ax.text(.55, .80, f"log-rank p = {ml.p_value:.1e}", transform=ax.transAxes, bbox=dict(fc="white", ec="0.7"))
f.tight_layout(); f.savefig(f"{OUT}/cgga_km_quartiles.png", dpi=160); plt.close(f)
summary["quartiles"] = dict(rows=qrows, chi2=float(ml.test_statistic), p=float(ml.p_value))

# ------------------------------------------------------------------ 5. nested Cox models (CGGA has treatment but no KPS)
MODELS = [("M1  age alone", ["AGE"]),
          ("M2  + sex", ["AGE", "male"]),
          ("M2t + sex + radiotherapy + TMZ", ["AGE", "male", "radio", "chemo"]),
          ("M3  + MGMT", ["AGE", "mgmt_meth"]),
          ("M4  + IDH", ["AGE", "idh_mut"]),
          ("M5  full (sex, RT, TMZ, MGMT, IDH)", ["AGE", "male", "radio", "chemo", "mgmt_meth", "idh_mut"])]
rows = []; full = {}
for name, cols in MODELS:
    s = d[["OS_MONTHS", "event", *cols]].dropna()
    m = CoxPHFitter().fit(s, "OS_MONTHS", "event")
    lo, hi = np.exp(m.confidence_intervals_.loc["AGE"])
    ph = proportional_hazard_test(m, s, time_transform="km").summary["p"]
    rows.append(dict(model=name, n=len(s), events=int(s.event.sum()), HR=float(m.hazard_ratios_["AGE"]), lo=float(lo), hi=float(hi),
                     p=float(m.summary.loc["AGE", "p"]), C=float(m.concordance_index_), PH_p_age=float(ph["AGE"])))
    full[name] = [dict(cov=c, HR=float(m.hazard_ratios_[c]), lo=float(np.exp(m.confidence_intervals_.loc[c].iloc[0])),
                       hi=float(np.exp(m.confidence_intervals_.loc[c].iloc[1])), p=float(m.summary.loc[c, "p"]), PH_p=float(ph[c])) for c in cols]
    P(f"\n--- {name} (n={len(s)}, deaths={int(s.event.sum())}, C={m.concordance_index_:.3f}) ---")
    P(m.summary[["exp(coef)", "exp(coef) lower 95%", "exp(coef) upper 95%", "p"]].round(4).to_string())
res = pd.DataFrame(rows); res.to_csv(f"{OUT}/cgga_nested_models.csv", index=False)
summary["nested"] = rows; summary["nested_full"] = full
dec = CoxPHFitter().fit(d[["OS_MONTHS", "event", "AGE"]].assign(AGE=lambda x: x.AGE / 10), "OS_MONTHS", "event")
summary["hr_per_decade"] = [float(dec.hazard_ratios_["AGE"]), *[float(v) for v in np.exp(dec.confidence_intervals_.loc["AGE"])]]
P(f"\nHR per decade: {summary['hr_per_decade'][0]:.3f} ({summary['hr_per_decade'][1]:.3f}-{summary['hr_per_decade'][2]:.3f})")

# ------------------------------------------------------------------ 6. time split at 12 months
CUT = 12.0
early = d.copy(); early["event"] = np.where(d.OS_MONTHS <= CUT, d.event, 0); early["OS_MONTHS"] = np.minimum(d.OS_MONTHS, CUT)
late = d[d.OS_MONTHS > CUT].copy(); late["OS_MONTHS"] -= CUT
ts = {}
for lab, s in [("0-12", early), (">12", late)]:
    m = CoxPHFitter().fit(s[["OS_MONTHS", "event", "AGE"]], "OS_MONTHS", "event")
    lo, hi = np.exp(m.confidence_intervals_.loc["AGE"])
    ts[lab] = dict(n=len(s), deaths=int(s.event.sum()), HR=float(m.hazard_ratios_["AGE"]), lo=float(lo), hi=float(hi), p=float(m.summary.loc["AGE", "p"]))
    P(f"time split {lab:>4s} mo: n={len(s)} deaths={int(s.event.sum())} HR/yr={ts[lab]['HR']:.4f} ({lo:.4f}-{hi:.4f}) p={ts[lab]['p']:.2g}")
summary["time_split"] = ts

# ------------------------------------------------------------------ 7. IDH sensitivity
prof = d[d.idh_mut.notna()]; mu, wt = prof[prof.idh_mut == 1], prof[prof.idh_mut == 0]
idh = {}
for lab, s in [("mutant", mu), ("wildtype", wt)]:
    k = KaplanMeierFitter().fit(s.OS_MONTHS, s.event)
    idh[lab] = dict(n=len(s), deaths=int(s.event.sum()), median_age=float(s.AGE.median()), median_os=float(k.median_survival_time_))
    P(f"IDH {lab:8s} n={len(s)} deaths={int(s.event.sum())} median age={s.AGE.median():.1f} median OS={k.median_survival_time_:.1f}")
if len(mu) >= 3:
    idh["p_age"] = float(mannwhitneyu(mu.AGE, wt.AGE).pvalue); idh["p_os"] = float(logrank_test(mu.OS_MONTHS, wt.OS_MONTHS, mu.event, wt.event).p_value)
    P(f"IDH groups: age p={idh['p_age']:.2g}, survival p={idh['p_os']:.2g}")
m = CoxPHFitter().fit(wt[["OS_MONTHS", "event", "AGE"]], "OS_MONTHS", "event"); lo, hi = np.exp(m.confidence_intervals_.loc["AGE"])
idh["wt_hr"] = [float(m.hazard_ratios_["AGE"]), float(lo), float(hi), float(m.summary.loc["AGE", "p"])]
m2 = CoxPHFitter().fit(prof[["OS_MONTHS", "event", "AGE"]], "OS_MONTHS", "event"); idh["all_profiled_hr"] = float(m2.hazard_ratios_["AGE"])
P(f"IDH-wildtype only (n={len(wt)}): HR/yr={idh['wt_hr'][0]:.4f} ({lo:.4f}-{hi:.4f}) p={idh['wt_hr'][3]:.2g};  all profiled: {idh['all_profiled_hr']:.4f}")
summary["idh"] = idh

# ------------------------------------------------------------------ 8. forest: TCGA vs CGGA, matched models
TCGA = {"M1  age alone": (593, 492, 1.0343, 1.0271, 1.0416),
        "M2  + sex": (593, 492, None, None, None),        # filled from JSON below if available
        "M3  + MGMT": (413, 316, 1.0365, 1.0274, 1.0457),
        "M4  + IDH": (285, 226, 1.0271, 1.0148, 1.0396)}
try:
    tj = json.load(open("app/models_tcga.json"))["models"]
    TCGA["M2  + sex"] = (tj["AGE+male"]["n"], tj["AGE+male"]["events"], tj["AGE+male"]["hr_age"], *tj["AGE+male"]["hr_age_ci"])
except Exception:
    TCGA.pop("M2  + sex")
pairs = [(k, TCGA[k], next(r for r in rows if r["model"] == k)) for k in TCGA if k in {r["model"] for r in rows}]
f, ax = plt.subplots(figsize=(8, 0.9 * len(pairs) + 1.6)); yy = np.arange(len(pairs))[::-1]
for i, (k, t, c) in zip(yy, pairs):
    ax.errorbar(t[2], i + 0.16, xerr=[[t[2] - t[3]], [t[4] - t[2]]], fmt="o", color="#4C72B0", capsize=4, lw=1.8, ms=7, label="TCGA-GBM" if i == yy[0] else None)
    ax.errorbar(c["HR"], i - 0.16, xerr=[[c["HR"] - c["lo"]], [c["hi"] - c["HR"]]], fmt="s", color="#C44E52", capsize=4, lw=1.8, ms=7, label="CGGA" if i == yy[0] else None)
ax.set_yticks(yy); ax.set_yticklabels([f"{k}\nTCGA n={t[0]} | CGGA n={c['n']}" for k, t, c in pairs], fontsize=9)
ax.axvline(1.0, color="0.5", ls="--"); ax.set_xlabel("Hazard ratio per additional year of age (95% CI)")
ax.set_title("Age effect in the discovery (TCGA) and validation (CGGA) cohorts"); ax.legend(loc="lower right")
f.tight_layout(); f.savefig(f"{OUT}/forest_tcga_vs_cgga.png", dpi=160); plt.close(f)
summary["tcga_reference"] = {k: dict(n=v[0], events=v[1], HR=v[2], lo=v[3], hi=v[4]) for k, v in TCGA.items()}

# ------------------------------------------------------------------ 9. outputs
d.to_csv(f"{OUT}/cgga_cohort_final.csv", index=False)
json.dump(summary, open(f"{OUT}/cgga_summary.json", "w"), indent=1)
open(f"{OUT}/cgga_log.txt", "w").write("\n".join(log))
P(f"\nwritten to {OUT}/")
