# Data

## Included
* `gbm_cohort_final.csv` — the 593-patient TCGA-GBM analysis table written by `analysis/run.py`
  (one row per patient; AGE, OS_MONTHS, event, male, kps10, idh_mut, mgmt_meth, beta, plus the original cBioPortal clinical columns).
* `cgga_cohort_final.csv` — the 218-patient CGGA primary-glioblastoma table written by `analysis/validate_cgga.py`.
* `raw/cgga/` — the two CGGA clinical tables exactly as downloaded (2020-05-06 release), with line endings normalised to LF.

## Not included (too large): the raw TCGA exports
Download from cBioPortal, study **gbm_tcga** (Glioblastoma Multiforme, TCGA, Firehose Legacy), into `data/raw/tcga/`:
1. `clinical.tsv` — Clinical Data → download all patients/samples
2. `mutations.txt` — Query IDH1 and IDH2, download the mutation table (OQL: `IDH1 IDH2`)
3. `methylation_hm27.txt`, `methylation_hm450.txt` — MGMT gene-level methylation (beta values) for each platform

`analysis/run.py` expects them in a `data/` folder next to it; either copy them there or adjust `UP` at the top of the script.
