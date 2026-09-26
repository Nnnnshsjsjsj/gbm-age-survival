#!/usr/bin/env python3
"""Intratumoral heterogeneity scores for GBM bulk tumours, and their relation to age and survival.

Two scores per tumour:
  1. Cell-state entropy (RNA). Neftel et al. 2019 meta-modules (MES1+MES2, AC, OPC, NPC1+NPC2).
     Score per state = mean z-scored expression of module genes, standardised across tumours;
     relative abundance = softmax of the four standardised scores;
     entropy H = -sum p log p / log 4  (0 = one state dominates, 1 = evenly mixed).
  2. MATH (DNA). Mutant-allele tumour heterogeneity (Mroz & Rocco 2013):
     MATH = 100 * MAD(VAF) / median(VAF) over somatic mutations with depth >= 20.

Usage: python3 heterogeneity.py <out_dir> [en|ru]
Inputs (data_ext/): tcga_data_mrna_agilent_microarray.txt, tcga_data_mrna_seq_v2_rsem.txt,
  pca_data_mutations.txt, CGGA.mRNAseq_693/325.RSEM-genes.20200506.txt, neftel_metamodules.tsv
  cohort.csv (TCGA clinical, 593), cgga_out/cgga_cohort_final.csv (CGGA clinical, 218)
"""
import sys, os, json, warnings
import numpy as np, pandas as pd
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from scipy.stats import spearmanr, mannwhitneyu, kruskal
from lifelines import CoxPHFitter, KaplanMeierFitter
from lifelines.statistics import logrank_test, multivariate_logrank_test
warnings.filterwarnings("ignore")

OUT = sys.argv[1] if len(sys.argv) > 1 else "het_out"; os.makedirs(OUT, exist_ok=True)
LANG = sys.argv[2] if len(sys.argv) > 2 else "en"; SUF = "" if LANG == "en" else "_ru"
D = "data_ext"
plt.rcParams["font.family"] = "DejaVu Sans"
L = {"en": dict(ent="Cell-state entropy (0–1)", math="MATH score", age="Age at diagnosis (years)",
                months="Months since diagnosis", prob="Overall survival probability", low="Low", mid="Middle", high="High",
                tert="tertile", n="n", deaths="deaths"),
     "ru": dict(ent="Энтропия клеточных состояний (0–1)", math="Показатель MATH", age="Возраст на момент диагноза (лет)",
                months="Месяцы от постановки диагноза", prob="Вероятность общей выживаемости", low="Низкая", mid="Средняя", high="Высокая",
                tert="терциль", n="n", deaths="смертей")}[LANG]
log = open(f"{OUT}/heterogeneity_log.txt", "w")
def P(*a):
    s = " ".join(str(x) for x in a); print(s); log.write(s + "\n")

# ---------- gene modules ----------
mods = pd.read_csv(f"{D}/neftel_metamodules.tsv", sep="\t")
STATES = {"MES": set(mods.MESlike1.dropna()) | set(mods.MESlike2.dropna()), "AC": set(mods.AClike.dropna()),
          "OPC": set(mods.OPClike.dropna()), "NPC": set(mods.NPClike1.dropna()) | set(mods.NPClike2.dropna())}
P("module sizes:", {k: len(v) for k, v in STATES.items()})

def load_expr(path, log_transform):
    e = pd.read_csv(path, sep="\t", low_memory=False)
    gene_col = e.columns[0]
    e = e[e[gene_col].notna()].copy()
    if "Entrez_Gene_Id" in e.columns: e = e.drop(columns=["Entrez_Gene_Id"])
    e = e.groupby(gene_col).mean(numeric_only=True)          # collapse duplicate symbols
    if log_transform: e = np.log2(e.clip(lower=0) + 1)
    return e

def entropy_scores(expr, label):
    """expr: genes x samples (log scale). Returns DataFrame indexed by sample with state scores, p_*, entropy."""
    expr = expr.loc[expr.var(axis=1) > 0]
    z = expr.sub(expr.mean(axis=1), axis=0).div(expr.std(axis=1), axis=0)
    sc = {}
    for st, genes in STATES.items():
        g = [x for x in genes if x in z.index]
        sc[st] = z.loc[g].mean(axis=0)
        P(f"  {label}: {st} uses {len(g)}/{len(genes)} genes")
    S = pd.DataFrame(sc)
    S = (S - S.mean()) / S.std()                                  # standardise each state score across tumours
    ex = np.exp(S.sub(S.max(axis=1), axis=0)); Pr = ex.div(ex.sum(axis=1), axis=0)
    H = -(Pr * np.log(Pr.clip(lower=1e-12))).sum(axis=1) / np.log(4)
    out = S.add_prefix("score_").join(Pr.add_prefix("p_"))
    out["entropy"] = H; out["dominant"] = Pr.idxmax(axis=1); out["dominance"] = Pr.max(axis=1)
    out["n_states_pos"] = (S > 0).sum(axis=1)
    return out

# ---------- TCGA ----------
tc = pd.read_csv("cohort.csv")[["pid", "AGE", "OS_MONTHS", "event", "male", "kps10", "mgmt_meth", "idh_mut"]]
P("\n=== TCGA expression: Agilent (Neftel's bulk platform) ===")
ag = load_expr(f"{D}/tcga_data_mrna_agilent_microarray.txt", log_transform=False)
ag.columns = [c[:12] for c in ag.columns]; ag = ag.loc[:, ~ag.columns.duplicated()]
ent_ag = entropy_scores(ag, "Agilent")
P("\n=== TCGA expression: RNA-seq (RSEM) ===")
rs = load_expr(f"{D}/tcga_data_mrna_seq_v2_rsem.txt", log_transform=True)
rs.columns = [c[:12] for c in rs.columns]; rs = rs.loc[:, ~rs.columns.duplicated()]
ent_rs = entropy_scores(rs, "RNA-seq")
both = ent_ag[["entropy"]].join(ent_rs[["entropy"]], lsuffix="_agilent", rsuffix="_rnaseq", how="inner")
r_plat, p_plat = spearmanr(both.entropy_agilent, both.entropy_rnaseq)
P(f"Agilent vs RNA-seq entropy on {len(both)} shared tumours: Spearman rho={r_plat:.3f} p={p_plat:.2g}")
# primary entropy = Agilent (401 tumours, the platform Neftel scored); fill from RNA-seq where Agilent is missing
ent = ent_ag[["entropy", "dominant", "dominance", "p_MES", "p_AC", "p_OPC", "p_NPC"]].copy(); ent["platform"] = "Agilent"
extra = ent_rs.loc[~ent_rs.index.isin(ent.index), ["entropy", "dominant", "dominance", "p_MES", "p_AC", "p_OPC", "p_NPC"]].copy(); extra["platform"] = "RNA-seq"
ent = pd.concat([ent, extra])

P("\n=== TCGA MATH from PanCancer Atlas mutation calls ===")
m = pd.read_csv(f"{D}/pca_data_mutations.txt", sep="\t", comment="#", low_memory=False)
m = m[m.Variant_Type.isin(["SNP"])]                                 # single-nucleotide variants only (cleanest VAFs)
m["depth"] = m.t_ref_count + m.t_alt_count; m = m[(m.depth >= 20) & (m.t_alt_count >= 3)]
m["vaf"] = m.t_alt_count / m.depth
m["pid"] = m.Tumor_Sample_Barcode.str[:12]
def math_score(v):
    med = np.median(v); mad = 1.4826 * np.median(np.abs(v - med)); return 100 * mad / med
g = m.groupby("pid").vaf
math = pd.DataFrame({"n_mut": g.size(), "MATH": g.apply(lambda v: math_score(v.values)), "median_vaf": g.median()})
P(f"tumours with mutation data: {len(math)}; mutations per tumour median {math.n_mut.median():.0f} (IQR {math.n_mut.quantile(.25):.0f}–{math.n_mut.quantile(.75):.0f})")
math = math[(math.n_mut >= 10) & (math.n_mut <= 1000)]              # enough mutations; drop hypermutators
P(f"after >=10 and <=1000 mutations: {len(math)}")

t = tc.set_index("pid").join(ent).join(math)
t["has_ent"] = t.entropy.notna(); t["has_math"] = t.MATH.notna()
P(f"\nTCGA cohort n={len(t)}: entropy available {t.has_ent.sum()} (Agilent {(t.platform=='Agilent').sum()}, RNA-seq {(t.platform=='RNA-seq').sum()}), MATH available {t.has_math.sum()}, both {(t.has_ent & t.has_math).sum()}")

# ---------- CGGA ----------
P("\n=== CGGA expression (RNA-seq RSEM), scored within each batch ===")
cg = pd.read_csv("cgga_out/cgga_cohort_final.csv")
parts = []
for batch, f in [("mRNAseq_693", "CGGA.mRNAseq_693.RSEM-genes.20200506.txt"), ("mRNAseq_325", "CGGA.mRNAseq_325.RSEM-genes.20200506.txt")]:
    e = load_expr(f"{D}/{f}", log_transform=True)
    ids = cg.loc[cg.batch == batch, "pid"]; e = e.loc[:, e.columns.isin(ids)]
    P(f"  {batch}: {e.shape[1]} of {len(ids)} cohort patients have expression")
    x = entropy_scores(e, batch); x["platform"] = batch; parts.append(x)
ent_cg = pd.concat(parts)
c = cg.set_index("pid").join(ent_cg[["entropy", "dominant", "dominance", "p_MES", "p_AC", "p_OPC", "p_NPC", "platform"]])
P(f"CGGA cohort n={len(c)}: entropy available {c.entropy.notna().sum()}")

# ---------- statistics ----------
res = {"tcga": {}, "cgga": {}}
def cox(df, cols, label, key, store):
    s = df[["OS_MONTHS", "event", *cols]].dropna()
    f = CoxPHFitter().fit(s, "OS_MONTHS", "event")
    row = {"model": label, "n": len(s), "events": int(s.event.sum()), "C": float(f.concordance_index_)}
    for cc in cols:
        r = f.summary.loc[cc]
        row[cc] = dict(HR=float(np.exp(r["coef"])), lo=float(np.exp(r["coef lower 95%"])), hi=float(np.exp(r["coef upper 95%"])), p=float(r["p"]))
    store.setdefault("cox", []).append(row)
    P(f"{label:44s} n={len(s):3d} d={int(s.event.sum()):3d} " + " | ".join(f"{cc} HR {row[cc]['HR']:.3f} ({row[cc]['lo']:.3f}–{row[cc]['hi']:.3f}) p={row[cc]['p']:.2g}" for cc in cols) + f" C={f.concordance_index_:.3f}")
    return row

for name, df, store in [("TCGA", t, res["tcga"]), ("CGGA", c, res["cgga"])]:
    P(f"\n=== {name}: heterogeneity, age and survival ===")
    df = df.copy()
    df["ent_sd"] = (df.entropy - df.entropy.mean()) / df.entropy.std()
    store["entropy_desc"] = dict(n=int(df.entropy.notna().sum()), mean=float(df.entropy.mean()), sd=float(df.entropy.std()),
                                 median=float(df.entropy.median()), q1=float(df.entropy.quantile(.25)), q3=float(df.entropy.quantile(.75)))
    store["dominant_counts"] = df.dominant.value_counts().to_dict()
    P("entropy:", {k: round(v, 3) if isinstance(v, float) else v for k, v in store["entropy_desc"].items()}, "dominant state:", store["dominant_counts"])
    r, p = spearmanr(df.AGE, df.entropy, nan_policy="omit"); store["age_entropy_spearman"] = dict(rho=float(r), p=float(p))
    P(f"age vs entropy: Spearman rho={r:.3f} p={p:.3g}")
    d = df.dropna(subset=["entropy"])
    grp = d.groupby(pd.cut(d.AGE, [0, 49, 59, 69, 120], labels=["<50", "50–59", "60–69", "≥70"]))["entropy"]
    store["entropy_by_age_band"] = {str(k): dict(n=int(v.size), median=float(v.median())) for k, v in grp}
    P("entropy by age band (median):", {k: (v["n"], round(v["median"], 3)) for k, v in store["entropy_by_age_band"].items()})
    P("Kruskal–Wallis across age bands p=%.3g" % kruskal(*[v.values for _, v in grp]).pvalue)
    # dominant state vs age
    P("median age by dominant state:", d.groupby("dominant").AGE.median().round(1).to_dict(), " n:", d.dominant.value_counts().to_dict())
    store["age_by_dominant"] = d.groupby("dominant").AGE.median().round(1).to_dict()
    # Cox
    cox(df, ["AGE"], "age alone (entropy subset)", "a", store) if False else None
    sub = df.dropna(subset=["entropy"])
    cox(sub, ["AGE"], "age alone, entropy subset", "age_sub", store)
    cox(sub, ["ent_sd"], "entropy alone (per SD)", "ent", store)
    cox(sub, ["AGE", "ent_sd"], "age + entropy", "age_ent", store)
    cox(sub, ["AGE", "ent_sd", "male", "mgmt_meth", "idh_mut"], "age + entropy + sex + MGMT + IDH", "full", store)
    # dominant state as categorical
    dm = pd.get_dummies(sub.dominant, prefix="dom", dtype=float).drop(columns=["dom_AC"], errors="ignore")
    cox(sub.join(dm), ["AGE", *dm.columns], "age + dominant state (ref AC)", "dom", store)
    # tertiles KM
    sub = sub.copy(); sub["tert"] = pd.qcut(sub.entropy, 3, labels=[L["low"], L["mid"], L["high"]])
    lr = multivariate_logrank_test(sub.OS_MONTHS, sub.tert, sub.event)
    store["entropy_tertile_logrank_p"] = float(lr.p_value)
    km = {}
    for k, v in sub.groupby("tert"):
        kf = KaplanMeierFitter().fit(v.OS_MONTHS, v.event); km[str(k)] = dict(n=len(v), deaths=int(v.event.sum()), median=float(kf.median_survival_time_))
    store["entropy_tertile_km"] = km
    P("entropy tertiles: median OS", {k: (v["n"], round(v["median"], 1)) for k, v in km.items()}, f"log-rank p={lr.p_value:.3g}")
    if name == "TCGA":
        mm = df.dropna(subset=["MATH"])
        store["math_desc"] = dict(n=len(mm), median=float(mm.MATH.median()), q1=float(mm.MATH.quantile(.25)), q3=float(mm.MATH.quantile(.75)))
        r, p = spearmanr(mm.AGE, mm.MATH); store["age_math_spearman"] = dict(rho=float(r), p=float(p))
        P(f"MATH: n={len(mm)} median {mm.MATH.median():.1f} (IQR {mm.MATH.quantile(.25):.1f}–{mm.MATH.quantile(.75):.1f}); age vs MATH rho={r:.3f} p={p:.3g}")
        bb = df.dropna(subset=["MATH", "entropy"]); r2, p2 = spearmanr(bb.MATH, bb.entropy); store["math_entropy_spearman"] = dict(n=len(bb), rho=float(r2), p=float(p2))
        P(f"MATH vs entropy (n={len(bb)}): rho={r2:.3f} p={p2:.3g}")
        mm = mm.copy(); mm["math_sd"] = (mm.MATH - mm.MATH.mean()) / mm.MATH.std()
        cox(mm, ["AGE"], "age alone, MATH subset", "age_m", store)
        cox(mm, ["math_sd"], "MATH alone (per SD)", "math", store)
        cox(mm, ["AGE", "math_sd"], "age + MATH", "age_math", store)
        cox(mm, ["AGE", "math_sd", "male", "mgmt_meth", "idh_mut"], "age + MATH + sex + MGMT + IDH", "full_m", store)
        mm["tert"] = pd.qcut(mm.MATH, 3, labels=[L["low"], L["mid"], L["high"]])
        lr = multivariate_logrank_test(mm.OS_MONTHS, mm.tert, mm.event); store["math_tertile_logrank_p"] = float(lr.p_value)
        km = {}
        for k, v in mm.groupby("tert"):
            kf = KaplanMeierFitter().fit(v.OS_MONTHS, v.event); km[str(k)] = dict(n=len(v), deaths=int(v.event.sum()), median=float(kf.median_survival_time_))
        store["math_tertile_km"] = km
        P("MATH tertiles: median OS", {k: (v["n"], round(v["median"], 1)) for k, v in km.items()}, f"log-rank p={lr.p_value:.3g}")
        # IDH-wildtype sensitivity
        wt = sub[sub.idh_mut == 0]
        cox(wt, ["AGE", "ent_sd"], "IDH-wildtype only: age + entropy", "wt", store)
        store["platform_agreement"] = dict(n=len(both), rho=float(r_plat), p=float(p_plat))
        t.to_csv(f"{OUT}/tcga_heterogeneity.csv")
    else:
        c.to_csv(f"{OUT}/cgga_heterogeneity.csv")

json.dump(res, open(f"{OUT}/heterogeneity.json", "w"), indent=1, default=str)

# ---------- figures ----------
tt = t.dropna(subset=["entropy"]); cc_ = c.dropna(subset=["entropy"])
# Fig A: age vs entropy scatter, both cohorts
f, ax = plt.subplots(1, 2, figsize=(11, 4.2), sharey=True)
for a, (nm, d, col) in zip(ax, [("TCGA", tt, "#4C72B0"), ("CGGA", cc_, "#C44E52")]):
    a.scatter(d.AGE, d.entropy, s=14, alpha=.55, color=col, edgecolor="none")
    z = np.polyfit(d.AGE, d.entropy, 1); xs = np.linspace(d.AGE.min(), d.AGE.max(), 50); a.plot(xs, np.polyval(z, xs), color="0.25", lw=1.5)
    r, p = spearmanr(d.AGE, d.entropy); a.set_title(f"{nm}: n={len(d)}, ρ={r:.2f}, p={p:.2g}"); a.set_xlabel(L["age"])
ax[0].set_ylabel(L["ent"]); f.tight_layout(); f.savefig(f"{OUT}/fig_het_age{SUF}.png", dpi=160); plt.close(f)
# Fig B: KM by entropy tertile, both cohorts
f, ax = plt.subplots(1, 2, figsize=(11, 4.4), sharey=True)
for a, (nm, d) in zip(ax, [("TCGA", tt), ("CGGA", cc_)]):
    d = d.copy(); d["tert"] = pd.qcut(d.entropy, 3, labels=[L["low"], L["mid"], L["high"]])
    for k, colr in zip([L["low"], L["mid"], L["high"]], ["#4C72B0", "#8172B2", "#C44E52"]):
        v = d[d.tert == k]; KaplanMeierFitter(label=f"{k} {L['tert']} (n={len(v)})").fit(v.OS_MONTHS, v.event).plot_survival_function(ax=a, color=colr, ci_show=False)
    p = multivariate_logrank_test(d.OS_MONTHS, d.tert, d.event).p_value
    a.set_title(f"{nm}: log-rank p={p:.2f}"); a.set_xlim(0, 60); a.set_ylim(0, 1); a.set_xlabel(L["months"])
ax[0].set_ylabel(L["prob"]); f.tight_layout(); f.savefig(f"{OUT}/fig_het_km{SUF}.png", dpi=160); plt.close(f)
# Fig C: MATH vs age + KM (TCGA)
mm = t.dropna(subset=["MATH"]).copy()
f, ax = plt.subplots(1, 2, figsize=(11, 4.2))
ax[0].scatter(mm.AGE, mm.MATH, s=14, alpha=.55, color="#4C72B0", edgecolor="none"); r, p = spearmanr(mm.AGE, mm.MATH)
ax[0].set_title(f"TCGA: n={len(mm)}, ρ={r:.2f}, p={p:.2g}"); ax[0].set_xlabel(L["age"]); ax[0].set_ylabel(L["math"])
mm["tert"] = pd.qcut(mm.MATH, 3, labels=[L["low"], L["mid"], L["high"]])
for k, colr in zip([L["low"], L["mid"], L["high"]], ["#4C72B0", "#8172B2", "#C44E52"]):
    v = mm[mm.tert == k]; KaplanMeierFitter(label=f"{k} {L['tert']} (n={len(v)})").fit(v.OS_MONTHS, v.event).plot_survival_function(ax=ax[1], color=colr, ci_show=False)
p = multivariate_logrank_test(mm.OS_MONTHS, mm.tert, mm.event).p_value
ax[1].set_title(f"MATH {L['tert']}s: log-rank p={p:.2f}"); ax[1].set_xlim(0, 60); ax[1].set_ylim(0, 1); ax[1].set_xlabel(L["months"]); ax[1].set_ylabel(L["prob"])
f.tight_layout(); f.savefig(f"{OUT}/fig_math{SUF}.png", dpi=160); plt.close(f)
P("written", OUT)
