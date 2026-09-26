#!/usr/bin/env python3
"""Is the age effect in glioblastoma the same across cohorts?  Random-effects meta-analysis of the
hazard ratio per year of age (overall survival), from four individual-patient cohorts we analysed
ourselves (TCGA, CGGA, MSK-IMPACT, CPTAC) and from published cohorts.

Usage: python3 meta_analysis.py <out_dir> [en|ru]
Writes: meta.json, meta_cohorts.csv, fig_meta_forest{_ru}.png, fig_meta_regression{_ru}.png, cohorts/*.csv (harmonised IPD)
"""
import sys, os, json, warnings
import numpy as np, pandas as pd
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from scipy import stats
from lifelines import CoxPHFitter, KaplanMeierFitter
warnings.filterwarnings("ignore")
OUT = sys.argv[1] if len(sys.argv) > 1 else "meta_out"; os.makedirs(f"{OUT}/cohorts", exist_ok=True)
LANG = sys.argv[2] if len(sys.argv) > 2 else "en"; SUF = "" if LANG == "en" else "_ru"
D = "data_ext"; plt.rcParams["font.family"] = "DejaVu Sans"
L = {"en": dict(xlab="Hazard ratio per year of age (95% CI)", ipd="Individual-patient cohorts (our analysis)", pub="Published cohorts",
                pooled_ipd="Pooled, our cohorts", pooled_pub="Pooled, published", pooled_all="Pooled, all cohorts", pred="95% prediction interval",
                title="The age effect across glioblastoma cohorts", uv="univariable", mv="adjusted", medage="Cohort median age (years)",
                reg_title="Meta-regression: cohort median age vs age effect", hr="HR per year"),
     "ru": dict(xlab="Отношение рисков на год возраста (95 % ДИ)", ipd="Когорты с индивидуальными данными (наш анализ)", pub="Опубликованные когорты",
                pooled_ipd="Объединённая оценка, наши когорты", pooled_pub="Объединённая оценка, публикации", pooled_all="Объединённая оценка, все когорты",
                pred="95 % интервал предсказания", title="Эффект возраста в когортах глиобластомы", uv="без поправок", mv="с поправками",
                medage="Медианный возраст когорты (лет)", reg_title="Мета-регрессия: медианный возраст когорты и эффект возраста", hr="ОР на год")}[LANG]
log = open(f"{OUT}/meta_log.txt", "w")
def P(*a):
    s = " ".join(str(x) for x in a); print(s); log.write(s + "\n")

# ---------------- individual-patient cohorts ----------------
def cox_age(df):
    s = df[["OS_MONTHS", "event", "AGE"]].dropna(); m = CoxPHFitter().fit(s, "OS_MONTHS", "event")
    km = KaplanMeierFitter().fit(s.OS_MONTHS, s.event)
    return dict(n=len(s), events=int(s.event.sum()), logHR=float(m.params_["AGE"]), se=float(m.standard_errors_["AGE"]),
                median_age=float(s.AGE.median()), age_iqr=[float(s.AGE.quantile(.25)), float(s.AGE.quantile(.75))],
                median_os=float(km.median_survival_time_), s12=float(km.predict(12)), s24=float(km.predict(24)), C=float(m.concordance_index_))

ipd = {}
tc = pd.read_csv("cohort.csv"); ipd["TCGA-GBM"] = (tc, dict(country="USA", years="1989–2013", era="mixed", idh="all-comers", adjusted=False, source="cBioPortal gbm_tcga"))
cg = pd.read_csv("cgga_out/cgga_cohort_final.csv"); ipd["CGGA"] = (cg, dict(country="China", years="2006–2016", era="TMZ", idh="all-comers", adjusted=False, source="CGGA mRNAseq_693 + _325"))
# MSK-IMPACT glioma (Jonsson 2019): GBM patients, age at diagnosis, OS from diagnosis
mp = pd.read_csv(f"{D}/cohorts/glioma_mskcc_2019__data_clinical_patient.txt", sep="\t", comment="#")
ms = pd.read_csv(f"{D}/cohorts/glioma_mskcc_2019__data_clinical_sample.txt", sep="\t", comment="#")
gbm_ids = ms[(ms.ONCOTREE_CODE == "GBM") & (ms.WHO_GRADE == "G4")].PATIENT_ID.unique()
mk = mp[mp.PATIENT_ID.isin(gbm_ids)].copy()
mk["event"] = mk.OS_STATUS.str.startswith("1").astype(int); mk = mk.rename(columns={"PATIENT_ID": "pid"})
mk["male"] = (mk.SEX.str.upper() == "MALE").astype(float)
mk["mgmt_meth"] = mk.MGMT_STATUS.map({"Methylated": 1.0, "Unmethylated": 0.0})
mk = mk[["pid", "AGE", "OS_MONTHS", "event", "male", "mgmt_meth"]].dropna(subset=["AGE", "OS_MONTHS"])
mk = mk[mk.OS_MONTHS > 0]
ipd["MSK-IMPACT"] = (mk, dict(country="USA", years="2014–2018", era="TMZ", idh="all-comers", adjusted=False, source="cBioPortal glioma_mskcc_2019"))
# CPTAC-GBM (Wang 2021)
cp = pd.read_csv(f"{D}/cohorts/gbm_cptac_2021__data_clinical_patient.txt", sep="\t", comment="#")
cp = cp[cp.VITAL_STATUS.isin(["Deceased", "Living"])].copy()
cp["event"] = (cp.VITAL_STATUS == "Deceased").astype(int)
cp["days"] = np.where(cp.event == 1, cp.PATH_DIAG_TO_DEATH_DAYS, cp.PATH_DIAG_TO_LAST_CONTACT_DAYS)
cp["OS_MONTHS"] = cp.days / 30.4375; cp = cp.rename(columns={"PATIENT_ID": "pid"})
cp["male"] = (cp.SEX.str.upper() == "MALE").astype(float)
cp = cp[["pid", "AGE", "OS_MONTHS", "event", "male"]].dropna(subset=["AGE", "OS_MONTHS"]); cp = cp[cp.OS_MONTHS > 0]
ipd["CPTAC-GBM"] = (cp, dict(country="USA/international", years="2016–2019", era="TMZ", idh="all-comers", adjusted=False, source="cBioPortal gbm_cptac_2021"))

rows = []
for name, (df, meta) in ipd.items():
    r = cox_age(df); r.update(meta); r["cohort"] = name; r["type"] = "ipd"; rows.append(r)
    df.to_csv(f"{OUT}/cohorts/{name.lower().replace('-', '_')}_harmonised.csv", index=False)
    P(f"{name:12s} n={r['n']:4d} deaths={r['events']:4d} median age {r['median_age']:.0f}  HR/yr {np.exp(r['logHR']):.4f} ({np.exp(r['logHR']-1.96*r['se']):.4f}–{np.exp(r['logHR']+1.96*r['se']):.4f})  median OS {r['median_os']:.1f} mo")

# heterogeneity among IPD cohorts by pooled model with interaction
allp = pd.concat([df[["OS_MONTHS", "event", "AGE"]].assign(cohort=n) for n, (df, _) in ipd.items()])
X = pd.get_dummies(allp.cohort, prefix="c", dtype=float).drop(columns=["c_TCGA-GBM"])
inter = X.mul(allp.AGE, axis=0).add_prefix("agex_")
m0 = CoxPHFitter().fit(pd.concat([allp[["OS_MONTHS", "event", "AGE"]], X], axis=1), "OS_MONTHS", "event")
m1 = CoxPHFitter().fit(pd.concat([allp[["OS_MONTHS", "event", "AGE"]], X, inter], axis=1), "OS_MONTHS", "event")
lr = 2 * (m1.log_likelihood_ - m0.log_likelihood_); p_int = 1 - stats.chi2.cdf(lr, inter.shape[1])
ipd_common = dict(n=len(allp), events=int(allp.event.sum()), HR=float(np.exp(m0.params_["AGE"])),
                  lo=float(np.exp(m0.confidence_intervals_.loc["AGE"].iloc[0])), hi=float(np.exp(m0.confidence_intervals_.loc["AGE"].iloc[1])),
                  interaction_LR=float(lr), interaction_df=int(inter.shape[1]), interaction_p=float(p_int))
P(f"IPD common-slope model (cohort as covariate): HR {ipd_common['HR']:.4f} ({ipd_common['lo']:.4f}–{ipd_common['hi']:.4f}); age×cohort interaction LR={lr:.2f} df={inter.shape[1]} p={p_int:.3f}")

# ---------------- published cohorts ----------------
# Values as read from the publications by the literature search (URLs in meta_cohorts.csv). HRs converted to per-year on the log scale.
pub = [
 dict(cohort="NRG/RTOG 0525 (Gittleman 2017)", country="USA/Canada", years="2006–2008", era="TMZ", idh="all-comers", adjusted=True, n=799, events=625, median_age=57,
      HR=1.030, se=0.0039, note="SE read from Table 2 (printed interval is ±1 SE)", url="https://academic.oup.com/neuro-oncology/article/19/5/669/3076814"),
 dict(cohort="Ohio Brain Tumor Study (Gittleman 2019)", country="USA", years="2007–2017", era="TMZ", idh="IDH-wildtype", adjusted=True, n=179, events=163, median_age=62,
      HR=1.018, lo=1.002, hi=1.034, url="https://academic.oup.com/noa/article/1/1/vdz007/5506677"),
 dict(cohort="Copenhagen (Abedi 2021)", country="Denmark", years="2005–2016", era="TMZ", idh="all-comers", adjusted=True, n=680, events=646, median_age=62,
      HR=1.18, lo=1.08, hi=1.28, scale=10, url="https://www.frontiersin.org/journals/oncology/articles/10.3389/fonc.2021.597587/full"),
 dict(cohort="Norway population-based (Rønning 2012)", country="Norway", years="2000–2007", era="mixed", idh="all-comers", adjusted=True, n=694, events=None, median_age=63,
      HR=1.02, lo=1.01, hi=1.03, url="https://pmc.ncbi.nlm.nih.gov/articles/PMC3424214/"),
 dict(cohort="SEER (Thumma 2012)", country="USA", years="1973–2008", era="mixed", idh="all-comers", adjusted=True, n=34664, events=None, median_age=62,
      HR=1.037, lo=1.036, hi=1.038, note="registry; no KPS or chemotherapy adjustment", url="https://wjso.biomedcentral.com/articles/10.1186/1477-7819-10-75"),
 dict(cohort="Dana-Farber (Shi 2022)", country="USA", years="2010–2019", era="TMZ", idh="IDH-wildtype", adjusted=True, n=665, events=None, median_age=61,
      HR=1.04, lo=1.03, hi=1.05, url="https://pmc.ncbi.nlm.nih.gov/articles/PMC9629423/"),
 dict(cohort="Western Norway (Bjorland 2023)", country="Norway", years="2007–2014", era="TMZ", idh="IDH-wildtype", adjusted=True, n=235, events=None, median_age=64,
      HR=1.03, lo=1.02, hi=1.04, url="https://academic.oup.com/noa/article/5/1/vdad126/7283074"),
 dict(cohort="RANO resect (Karschnia 2025)", country="USA/Europe", years="≤2022", era="TMZ", idh="IDH-wildtype", adjusted=False, n=1003, events=667, median_age=63,
      HR=1.03, lo=1.02, hi=1.04, url="https://academic.oup.com/neuro-oncology/article/27/4/1046/7874752"),
 dict(cohort="Bergen–Oslo (Blakstad 2023)", country="Norway", years="2015–2017", era="TMZ", idh="mostly IDH-wildtype", adjusted=False, n=467, events=415, median_age=65,
      HR=1.34, lo=1.22, hi=1.46, scale=10, url="https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0281166"),
 dict(cohort="CGGA registry (Yang 2015)", country="China", years="2004–2014", era="TMZ", idh="all-comers", adjusted=True, n=229, events=None, median_age=50,
      HR=1.019, lo=1.002, hi=1.036, overlap="overlaps our CGGA cohort; shown but not pooled", url="https://pmc.ncbi.nlm.nih.gov/articles/PMC4747376/"),
]
for r in pub:
    sc = r.get("scale", 1)
    r["logHR"] = np.log(r["HR"]) / sc
    r["se"] = r["se"] / sc if "se" in r else (np.log(r["hi"]) - np.log(r["lo"])) / (2 * 1.96) / sc
    r["type"] = "published"; r["source"] = r["url"]
    rows.append(r)

tab = pd.DataFrame(rows)
tab["HR_year"] = np.exp(tab.logHR); tab["lo_year"] = np.exp(tab.logHR - 1.96 * tab.se); tab["hi_year"] = np.exp(tab.logHR + 1.96 * tab.se)
tab["pooled"] = ~tab.get("overlap", pd.Series([None] * len(tab))).notna()

# ---------------- random-effects pooling ----------------
def pool(y, se, label):
    w = 1 / se**2; yf = np.sum(w * y) / np.sum(w); Q = np.sum(w * (y - yf)**2); k = len(y); dfq = k - 1
    C = np.sum(w) - np.sum(w**2) / np.sum(w); tau2 = max(0, (Q - dfq) / C)
    wr = 1 / (se**2 + tau2); yr = np.sum(wr * y) / np.sum(wr); ser = np.sqrt(1 / np.sum(wr))
    I2 = max(0, (Q - dfq) / Q) * 100 if Q > 0 else 0; pQ = 1 - stats.chi2.cdf(Q, dfq)
    # Hartung–Knapp variance and prediction interval
    q = np.sum(wr * (y - yr)**2) / dfq if dfq > 0 else 1; se_hk = ser * np.sqrt(max(q, 1)); tcrit = stats.t.ppf(.975, dfq) if dfq > 0 else np.nan
    pred_lo = yr - stats.t.ppf(.975, k - 2) * np.sqrt(tau2 + ser**2) if k > 2 else np.nan
    pred_hi = yr + stats.t.ppf(.975, k - 2) * np.sqrt(tau2 + ser**2) if k > 2 else np.nan
    res = dict(label=label, k=int(k), HR=float(np.exp(yr)), lo=float(np.exp(yr - 1.96 * ser)), hi=float(np.exp(yr + 1.96 * ser)),
               lo_hk=float(np.exp(yr - tcrit * se_hk)), hi_hk=float(np.exp(yr + tcrit * se_hk)), tau=float(np.sqrt(tau2)), I2=float(I2), Q=float(Q), Q_p=float(pQ),
               pred_lo=float(np.exp(pred_lo)), pred_hi=float(np.exp(pred_hi)), fixed_HR=float(np.exp(yf)), fixed_lo=float(np.exp(yf - 1.96 / np.sqrt(np.sum(w)))), fixed_hi=float(np.exp(yf + 1.96 / np.sqrt(np.sum(w)))),
               weights=(wr / wr.sum()).tolist())
    P(f"{label:28s} k={k:2d} HR {res['HR']:.4f} (95% CI {res['lo']:.4f}–{res['hi']:.4f}; HK {res['lo_hk']:.4f}–{res['hi_hk']:.4f}) tau={res['tau']:.4f} I2={I2:.0f}% Q p={pQ:.3g} PI {res['pred_lo']:.3f}–{res['pred_hi']:.3f}")
    return res

sub_ipd = tab[tab.type == "ipd"]; sub_pub = tab[(tab.type == "published") & tab.pooled]; sub_all = tab[tab.pooled]
meta = {"cohorts": json.loads(tab.to_json(orient="records")), "ipd_common": ipd_common}
meta["pooled_ipd"] = pool(sub_ipd.logHR.values, sub_ipd.se.values, "IPD cohorts")
meta["pooled_pub"] = pool(sub_pub.logHR.values, sub_pub.se.values, "Published cohorts")
meta["pooled_all"] = pool(sub_all.logHR.values, sub_all.se.values, "All cohorts")
meta["pooled_all_noSEER"] = pool(sub_all[~sub_all.cohort.str.contains("SEER")].logHR.values, sub_all[~sub_all.cohort.str.contains("SEER")].se.values, "All without SEER")
# leave-one-out
loo = []
for i, r in sub_all.iterrows():
    s = sub_all.drop(i); pr = pool(s.logHR.values, s.se.values, f"  LOO without {r.cohort[:24]}"); loo.append(dict(dropped=r.cohort, HR=pr["HR"], lo=pr["lo"], hi=pr["hi"], I2=pr["I2"]))
meta["leave_one_out"] = loo
# subgroups
for key, fn, lab in [("idh_wt", lambda d: d.idh.str.contains("wildtype"), "IDH-wildtype-only cohorts"), ("all_comers", lambda d: d.idh == "all-comers", "All-comer cohorts"),
                     ("tmz_era", lambda d: d.era == "TMZ", "TMZ-era cohorts"), ("mixed_era", lambda d: d.era == "mixed", "Mixed/pre-TMZ era cohorts"),
                     ("adjusted", lambda d: d.adjusted == True, "Adjusted estimates"), ("unadjusted", lambda d: d.adjusted == False, "Unadjusted estimates"),
                     ("asia", lambda d: d.country == "China", "Chinese cohorts"), ("west", lambda d: d.country != "China", "Western cohorts")]:
    s = sub_all[fn(sub_all)]
    if len(s) >= 2: meta[f"sub_{key}"] = pool(s.logHR.values, s.se.values, lab)
# meta-regression on cohort median age (method-of-moments mixed model)
def metareg(y, se, x, label):
    X = np.column_stack([np.ones_like(x), x]); w = 1 / se**2
    b = np.linalg.solve(X.T @ (w[:, None] * X), X.T @ (w * y)); resid = y - X @ b; Q = np.sum(w * resid**2)
    P_ = np.diag(w) - (w[:, None] * X) @ np.linalg.inv(X.T @ (w[:, None] * X)) @ (X.T * w); tau2 = max(0, (Q - (len(y) - 2)) / np.trace(P_))
    wr = 1 / (se**2 + tau2); V = np.linalg.inv(X.T @ (wr[:, None] * X)); b = V @ (X.T @ (wr * y)); seb = np.sqrt(np.diag(V))
    z = b[1] / seb[1]; p = 2 * (1 - stats.norm.cdf(abs(z)))
    r = dict(label=label, slope_per_unit=float(b[1]), slope_se=float(seb[1]), p=float(p), tau=float(np.sqrt(tau2)), k=int(len(y)),
             HR_ratio_per_10y_median_age=float(np.exp(10 * b[1])))
    P(f"meta-regression {label}: slope {b[1]:.5f} (SE {seb[1]:.5f}) p={p:.3f}; the age HR changes by a factor {np.exp(10*b[1]):.3f} per 10 years of cohort median age; residual tau={np.sqrt(tau2):.4f}")
    return r, b
meta["metareg_median_age"], breg = metareg(sub_all.logHR.values, sub_all.se.values, sub_all.median_age.values.astype(float), "cohort median age")
meta["metareg_median_age_noSEER"], _ = metareg(sub_all[~sub_all.cohort.str.contains("SEER")].logHR.values, sub_all[~sub_all.cohort.str.contains("SEER")].se.values,
                                                sub_all[~sub_all.cohort.str.contains("SEER")].median_age.values.astype(float), "cohort median age, without SEER")
json.dump(meta, open(f"{OUT}/meta.json", "w"), indent=1, default=str)
tab.drop(columns=["weights"], errors="ignore").to_csv(f"{OUT}/meta_cohorts.csv", index=False)

# ---------------- forest plot ----------------
ip = tab[tab.type == "ipd"]; pb = tab[tab.type == "published"]
n_rows = len(ip) + len(pb) + 3 + 3
f, ax = plt.subplots(figsize=(11, 0.42 * n_rows + 1.6)); y = n_rows
def row(lbl, hr, lo, hi, weight=None, bold=False, marker="s", color="#4C72B0", size=None, extra=""):
    global y
    y -= 1
    ax.plot([lo, hi], [y, y], color=color, lw=1.6); ax.plot(hr, y, marker, color=color, ms=size or 7)
    ax.text(0.9935, y, lbl, ha="right", va="center", fontsize=9.5, fontweight="bold" if bold else "normal")
    ax.text(1.0605, y, f"{hr:.3f} ({lo:.3f}–{hi:.3f}){extra}", va="center", fontsize=9)
def header(txt):
    global y
    y -= 1; ax.text(0.9935, y, txt, ha="right", va="center", fontsize=10, fontweight="bold", color="0.2")
header(L["ipd"])
for _, r in ip.iterrows(): row(f"{r.cohort}  (n={int(r.n)}, {int(r.events)} {'deaths' if LANG=='en' else 'смертей'})", r.HR_year, r.lo_year, r.hi_year)
pr = meta["pooled_ipd"]; row(L["pooled_ipd"], pr["HR"], pr["lo"], pr["hi"], bold=True, marker="D", color="#2A3F5F", size=9, extra=f"  I²={pr['I2']:.0f}%")
header(L["pub"])
for _, r in pb.iterrows():
    lbl = f"{r.cohort}  (n={int(r.n)}, {L['mv'] if r.adjusted else L['uv']})" + ("  *" if not r.pooled else "")
    row(lbl, r.HR_year, r.lo_year, r.hi_year, color="#C44E52" if r.pooled else "0.6")
pr = meta["pooled_pub"]; row(L["pooled_pub"], pr["HR"], pr["lo"], pr["hi"], bold=True, marker="D", color="#7A2E33", size=9, extra=f"  I²={pr['I2']:.0f}%")
pr = meta["pooled_all"]; y -= 0.4; row(L["pooled_all"], pr["HR"], pr["lo"], pr["hi"], bold=True, marker="D", color="black", size=10, extra=f"  I²={pr['I2']:.0f}%")
y -= 1; ax.plot([pr["pred_lo"], pr["pred_hi"]], [y, y], color="black", lw=3, alpha=.35); ax.text(0.9935, y, L["pred"], ha="right", va="center", fontsize=9.5, color="0.3")
ax.text(1.0605, y, f"{pr['pred_lo']:.3f}–{pr['pred_hi']:.3f}", va="center", fontsize=9)
ax.axvline(1, color="0.5", ls="--", lw=1); ax.axvline(pr["HR"], color="black", ls=":", lw=1)
ax.set_xlim(0.99, 1.06); ax.set_ylim(-3.2, n_rows + 0.5); ax.set_yticks([]); ax.set_xlabel(L["xlab"]); ax.set_title(L["title"], fontsize=11)
for s in ["top", "right", "left"]: ax.spines[s].set_visible(False)
ax.text(0.99, -2.6, "* " + ("overlaps our CGGA cohort; shown, not pooled" if LANG == "en" else "пересекается с нашей когортой CGGA; показана, но не объединена"), fontsize=8.5, color="0.4")
f.tight_layout(); f.savefig(f"{OUT}/fig_meta_forest{SUF}.png", dpi=160, bbox_inches="tight"); plt.close(f)

# ---------------- meta-regression bubble plot ----------------
f, ax = plt.subplots(figsize=(7.2, 4.6)); s = sub_all
wts = 1 / (s.se**2 + meta["pooled_all"]["tau"]**2); sz = 40 + 500 * wts / wts.max()
ax.scatter(s.median_age, s.HR_year, s=sz, alpha=.5, color=np.where(s.type == "ipd", "#4C72B0", "#C44E52"), edgecolor="0.3")
xs = np.linspace(s.median_age.min() - 2, s.median_age.max() + 2, 50); ax.plot(xs, np.exp(breg[0] + breg[1] * xs), color="0.2", lw=1.5)
for _, r in s.iterrows(): ax.annotate(r.cohort.split(" (")[0], (r.median_age, r.HR_year), fontsize=7.5, xytext=(4, 4), textcoords="offset points", color="0.3")
ax.set_xlabel(L["medage"]); ax.set_ylabel(L["hr"]); ax.set_title(L["reg_title"] + f"  (p = {meta['metareg_median_age']['p']:.2f})", fontsize=10.5)
f.tight_layout(); f.savefig(f"{OUT}/fig_meta_regression{SUF}.png", dpi=160); plt.close(f)
P("written", OUT)
