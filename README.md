# Age at diagnosis and overall survival in glioblastoma

Survival analysis of 593 glioblastoma patients from TCGA, externally validated on 218 patients from the
Chinese Glioma Genome Atlas (CGGA), with an open, single-file survival calculator built from the fitted models.

**Live calculator:** `docs/index.html` (enable GitHub Pages → *Deploy from branch* → `main` / `/docs`)
**Paper:** [`paper/Research_Paper_EN.pdf`](paper/Research_Paper_EN.pdf) · [`paper/Research_Paper_RU.pdf`](paper/Research_Paper_RU.pdf)

## What the study found

| | TCGA-GBM (discovery) | CGGA (validation) |
|---|---|---|
| Patients / deaths | 593 / 492 | 218 / 183 |
| Median age | 59 y | 54 y |
| Median overall survival | 14.0 mo | 15.5 mo |
| Median OS, age < 59 vs ≥ 59 | 17.7 vs 10.7 mo (p = 2.5 × 10⁻¹³) | 19.2 vs 12.4 mo (p = 0.006) |
| **HR per year of age** (age-only Cox) | **1.034** (1.027–1.042) | **1.020** (1.008–1.032) |
| HR per year, IDH-wildtype only | 1.027 | 1.018 |
| HR per year, first 12 months / after | 1.047 / 1.025 | 1.028 / 1.015 |

* Age predicts survival in both cohorts, more strongly in the first year, and independently of IDH status.
* The effect is **smaller in CGGA** (age × cohort interaction p = 0.058). Restricting both cohorts to the same
  age window, or CGGA to temozolomide-treated patients, does not close the gap. We report it rather than explain it away.
* Across five nested adjustment sets in TCGA the HR stayed within 1.027–1.037 while the sample fell from 593 to 174.

## Repository layout

```
analysis/   run.py (TCGA), validate_cgga.py, compare_cohorts.py, export_models.py, build_app.py
app/        calculator source: template.html + model JSON; index.html is the built page
docs/       the built calculator, served by GitHub Pages
data/       derived patient-level tables (TCGA, CGGA) and the raw CGGA clinical files
results/    model tables, comparison table, figures, CGGA run log
paper/      the paper in English and Russian (.docx + .pdf) and the scripts that generate it
```

## Reproduce

```bash
pip install -r requirements.txt

# 1. TCGA (needs the three cBioPortal exports for study gbm_tcga in data/raw/tcga/: clinical.tsv,
#    mutations.txt, methylation_hm27.txt, methylation_hm450.txt — see data/README.md)
cd analysis && python run.py && cd ..            # -> figures/, nested_models.csv, gbm_cohort_final.csv

# 2. CGGA validation (raw files are included)
python analysis/validate_cgga.py data/raw/cgga/CGGA.mRNAseq_693_clinical.20200506.txt \
                                 data/raw/cgga/CGGA.mRNAseq_325_clinical.20200506.txt results/cgga

# 3. Cohort comparison (Table 9, Figures 6–7, heterogeneity tests)
python analysis/compare_cohorts.py data/gbm_cohort_final.csv data/cgga_cohort_final.csv results/compare

# 4. Calculator: fit the model ladders and inline them into the page
python analysis/export_models.py data/gbm_cohort_final.csv TCGA app/models_tcga.json
python analysis/export_models.py data/cgga_cohort_final.csv CGGA app/models_cgga.json
cp results/compare/compare.json app/compare.json
python analysis/build_app.py                     # -> app/index.html and docs/index.html
```

Every number in the paper is printed by one of these scripts. The only stochastic step (a Gaussian mixture
used to dichotomise MGMT beta values in TCGA) runs with a fixed seed.

## The calculator

One HTML file, no server, no dependencies. It embeds 24 Cox models (16 fitted on TCGA, 8 on CGGA) as
coefficients, covariance matrices, covariate means and baseline survival on a half-month grid. For the inputs
you provide it selects the model fitted with exactly those variables, computes
S(t) = S₀(t)^exp(β·(x − x̄)), and draws the curve with a 95 % band from the coefficient covariance on the
complementary log-log scale. It shows the sample size, C-index and equation behind every prediction and can
overlay the other cohort. Predictions were checked against `lifelines`.

**It is an educational tool built from retrospective public data. It is not medical advice.**

## Data sources and citation

* TCGA-GBM clinical, mutation and methylation data via cBioPortal, study `gbm_tcga` (Firehose Legacy), downloaded 25 July 2026.
  Cerami et al., *Cancer Discov* 2012; Gao et al., *Sci Signal* 2013; TCGA Research Network, *Nature* 2008.
* CGGA clinical tables `mRNAseq_693` and `mRNAseq_325` from <https://www.cgga.org.cn/download.jsp>.
  Zhao et al., *Genomics Proteomics Bioinformatics* 2021;19(1):1–12. CGGA asks that publications using its data cite this paper.

## Licence

Code (`analysis/`, `app/`, `paper/build/`) is released under the MIT licence (see `LICENSE`).
The paper text and figures are © the author. Data files keep the terms of their original sources.
