# Data

* `cohorts/` — harmonised patient-level tables used in the paper (columns: pid, AGE, OS_MONTHS, event, male, kps10, mgmt_meth, idh_mut, plus cohort-specific extras):
  `tcga_gbm_full_clinical.csv` (593 TCGA patients with every clinical field), `cgga_cohort_final.csv` (218), `msk_impact_harmonised.csv` (485), `cptac_gbm_harmonised.csv` (96).
* `gbm_cohort_final.csv`, `cgga_cohort_final.csv` — the two original cohorts as used in the first version of the paper.
* `neftel_metamodules.tsv` — Neftel et al. 2019 Table S2 meta-module gene lists (MESlike1/2, AClike, OPClike, NPClike1/2, G1/S, G2/M).
* `published_estimates.csv` — every cohort in the meta-analysis: hazard ratio per year, standard error, n, era, IDH selection, adjustment, and the URL the value was read from.
* `raw/` — large inputs downloaded by `analysis/fetch_data.py` (TCGA expression and mutation files, CGGA expression, extra-cohort clinical tables). Not committed except the small CGGA clinical files.

All data are de-identified public research data. No patient rows other than these public tables are stored anywhere in this project.
