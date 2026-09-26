#!/usr/bin/env python3
"""Compare the age effect between the discovery (TCGA) and validation (CGGA) cohorts.

Usage: python3 compare_cohorts.py <tcga_cohort.csv> <cgga_cohort.csv> <out_dir>
Writes: compare.json (for the calculator), compare_table.csv, fig_compare_km.png, fig_compare_forest.png
"""
import sys, os, json
import numpy as np, pandas as pd
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from lifelines import CoxPHFitter, KaplanMeierFitter
from scipy.stats import norm

tcga, cgga, OUT = pd.read_csv(sys.argv[1]), pd.read_csv(sys.argv[2]), sys.argv[3]
LANG = sys.argv[4] if len(sys.argv) > 4 else "en"
L = {"en": dict(old="Older (≥59)", young="Younger (<59)", deaths="deaths", hr="HR per year", months="Months since diagnosis",
                prob="Overall survival probability", ftitle="Age effect in the discovery and validation cohorts, matched adjustment sets",
                xlab="Hazard ratio per additional year of age (95% CI)", tcga="TCGA-GBM (discovery)", cgga="CGGA (validation)",
                models=["age alone", "+ sex", "+ MGMT", "+ IDH", "+ sex + MGMT + IDH"]),
     "ru": dict(old="Старшая (≥59)", young="Младшая (<59)", deaths="смертей", hr="ОР на год", months="Месяцы от постановки диагноза",
                prob="Вероятность общей выживаемости", ftitle="Эффект возраста в исходной и валидационной когортах, одинаковые наборы поправок",
                xlab="Отношение рисков на дополнительный год возраста (95 % ДИ)", tcga="TCGA-GBM (исходная)", cgga="CGGA (валидационная)",
                models=["только возраст", "+ пол", "+ MGMT", "+ IDH", "+ пол + MGMT + IDH"])}[LANG]
SUF = "" if LANG == "en" else "_" + LANG
os.makedirs(OUT, exist_ok=True)
plt.rcParams["font.family"] = "DejaVu Sans"
COH = {"TCGA": tcga, "CGGA": cgga}

def fit(df, cols):
    s = df[["OS_MONTHS", "event", *cols]].dropna()
    m = CoxPHFitter().fit(s, "OS_MONTHS", "event")
    b, se = float(m.params_["AGE"]), float(m.standard_errors_["AGE"])
    return dict(n=len(s), events=int(s.event.sum()), beta=b, se=se, HR=float(np.exp(b)),
                lo=float(np.exp(b - 1.96 * se)), hi=float(np.exp(b + 1.96 * se)), p=float(m.summary.loc["AGE", "p"]),
                C=float(m.concordance_index_))

def het(a, b):
    z = (a["beta"] - b["beta"]) / np.sqrt(a["se"] ** 2 + b["se"] ** 2)
    return float(z), float(2 * (1 - norm.cdf(abs(z))))

rows, out = [], {"cohorts": {}, "matched_models": [], "range_matched": [], "interaction": {}, "pooled": {}}
for name, df in COH.items():
    km = KaplanMeierFitter().fit(df.OS_MONTHS, df.event)
    a = fit(df, ["AGE"]); dec = fit(df.assign(AGE=df.AGE / 10), ["AGE"])
    out["cohorts"][name] = dict(n=len(df), events=int(df.event.sum()), median_age=float(df.AGE.median()),
        age_min=float(df.AGE.min()), age_max=float(df.AGE.max()), pct_70plus=float((df.AGE >= 70).mean()),
        median_os=float(km.median_survival_time_), s12=float(km.predict(12)), s24=float(km.predict(24)),
        hr_year=a, hr_decade=dict(HR=dec["HR"], lo=dec["lo"], hi=dec["hi"]))

# matched adjustment sets available in both cohorts (CGGA has no KPS)
for label, cols in [("age alone", ["AGE"]), ("+ sex", ["AGE", "male"]), ("+ MGMT", ["AGE", "mgmt_meth"]),
                    ("+ IDH", ["AGE", "idh_mut"]), ("+ sex + MGMT + IDH", ["AGE", "male", "mgmt_meth", "idh_mut"])]:
    t, c = fit(tcga, cols), fit(cgga, cols); z, p = het(t, c)
    rec = dict(model=label, TCGA=t, CGGA=c, het_z=z, het_p=p); out["matched_models"].append(rec)
    rows.append(dict(model=label, tcga_n=t["n"], tcga_HR=t["HR"], tcga_lo=t["lo"], tcga_hi=t["hi"],
                     cgga_n=c["n"], cgga_HR=c["HR"], cgga_lo=c["lo"], cgga_hi=c["hi"], het_p=p))
    print(f"{label:22s} TCGA {t['HR']:.4f} ({t['lo']:.4f}-{t['hi']:.4f}) n={t['n']} | CGGA {c['HR']:.4f} ({c['lo']:.4f}-{c['hi']:.4f}) n={c['n']} | het p={p:.3f}")

# same age window in both cohorts
for lo_, hi_ in [(18, 79), (40, 79), (18, 70)]:
    t = fit(tcga[(tcga.AGE >= lo_) & (tcga.AGE <= hi_)], ["AGE"]); c = fit(cgga[(cgga.AGE >= lo_) & (cgga.AGE <= hi_)], ["AGE"])
    z, p = het(t, c); out["range_matched"].append(dict(range=f"{lo_}–{hi_}", TCGA=t, CGGA=c, het_p=p))
    print(f"age {lo_}-{hi_}: TCGA {t['HR']:.4f} (n={t['n']}) | CGGA {c['HR']:.4f} (n={c['n']}) | het p={p:.3f}")

# pooled models
p = pd.concat([tcga[["OS_MONTHS", "event", "AGE"]].assign(cgga=0), cgga[["OS_MONTHS", "event", "AGE"]].assign(cgga=1)])
p["age_x_cgga"] = p.AGE * p.cgga
mi = CoxPHFitter().fit(p, "OS_MONTHS", "event")
mc = CoxPHFitter().fit(p[["OS_MONTHS", "event", "AGE", "cgga"]], "OS_MONTHS", "event")
out["interaction"] = dict(hr_age_tcga=float(np.exp(mi.params_["AGE"])), hr_ratio_cgga_vs_tcga=float(np.exp(mi.params_["age_x_cgga"])),
                          p=float(mi.summary.loc["age_x_cgga", "p"]))
out["pooled"] = dict(n=len(p), events=int(p.event.sum()), hr_age=float(np.exp(mc.params_["AGE"])),
                     lo=float(np.exp(mc.confidence_intervals_.loc["AGE"].iloc[0])), hi=float(np.exp(mc.confidence_intervals_.loc["AGE"].iloc[1])),
                     hr_cgga_baseline=float(np.exp(mc.params_["cgga"])), p_cgga=float(mc.summary.loc["cgga", "p"]))
print(f"interaction age×cohort p={out['interaction']['p']:.3f}; pooled common slope HR={out['pooled']['hr_age']:.4f} ({out['pooled']['lo']:.4f}-{out['pooled']['hi']:.4f}); CGGA baseline HR {out['pooled']['hr_cgga_baseline']:.3f} (p={out['pooled']['p_cgga']:.3f})")

# TMZ-treated CGGA subgroup
if "chemo" in cgga.columns:
    s = fit(cgga[cgga.chemo == 1], ["AGE"]); out["cgga_tmz_only"] = s
    print(f"CGGA temozolomide-treated only: HR {s['HR']:.4f} ({s['lo']:.4f}-{s['hi']:.4f}) n={s['n']}")

pd.DataFrame(rows).to_csv(f"{OUT}/compare_table.csv", index=False)
json.dump(out, open(f"{OUT}/compare.json", "w"), indent=1)

# ---- figure 1: KM by age group (<59 / >=59) in both cohorts
f, axes = plt.subplots(1, 2, figsize=(12, 4.8), sharey=True)
for ax, (name, df) in zip(axes, COH.items()):
    for grp, c, lab in [(df[df.AGE >= 59], "#C44E52", L["old"]), (df[df.AGE < 59], "#4C72B0", L["young"])]:
        KaplanMeierFitter(label=f"{lab}  n={len(grp)}").fit(grp.OS_MONTHS, grp.event).plot_survival_function(ax=ax, color=c, ci_show=True)
    hr = out["cohorts"][name]["hr_year"]
    ax.set_title(f"{name}: n={len(df)}, {int(df.event.sum())} {L['deaths']}\n{L['hr']} {hr['HR']:.3f} ({hr['lo']:.3f}–{hr['hi']:.3f})")
    ax.set_xlim(0, 60); ax.set_ylim(0, 1); ax.set_xlabel(L["months"])
axes[0].set_ylabel(L["prob"])
f.tight_layout(); f.savefig(f"{OUT}/fig_compare_km{SUF}.png", dpi=160); plt.close(f)

# ---- figure 2: forest of matched models
mm = out["matched_models"]; f, ax = plt.subplots(figsize=(9, 0.85 * len(mm) + 1.9)); yy = np.arange(len(mm))[::-1]
for i, r in zip(yy, mm):
    t, c = r["TCGA"], r["CGGA"]
    ax.errorbar(t["HR"], i + .17, xerr=[[t["HR"] - t["lo"]], [t["hi"] - t["HR"]]], fmt="o", color="#4C72B0", capsize=4, lw=1.8, ms=7, label=L["tcga"] if i == yy[0] else None)
    ax.errorbar(c["HR"], i - .17, xerr=[[c["HR"] - c["lo"]], [c["hi"] - c["HR"]]], fmt="s", color="#C44E52", capsize=4, lw=1.8, ms=7, label=L["cgga"] if i == yy[0] else None)
    ax.text(1.058, i, f"p_het = {r['het_p']:.2f}", va="center", fontsize=9, color="0.35")
ax.set_yticks(yy); ax.set_yticklabels([f"{lab}\nTCGA n={r['TCGA']['n']} | CGGA n={r['CGGA']['n']}" for lab, r in zip(L["models"], mm)], fontsize=9)
ax.axvline(1, color="0.5", ls="--"); ax.set_xlim(0.985, 1.075); ax.set_xlabel(L["xlab"])
ax.set_title(L["ftitle"], fontsize=10.5); ax.legend(loc="upper right", fontsize=9)
f.tight_layout(); f.savefig(f"{OUT}/fig_compare_forest{SUF}.png", dpi=160); plt.close(f)
print("written", OUT)
