# cohortex — glioblastoma cohorts, side by side

![cohortex](brand/lockup.svg)

*Research repository: intratumoral heterogeneity, age at diagnosis and overall survival in glioblastoma*

A student research project on public glioblastoma data. It measures the age effect on overall survival in TCGA,
validates it in CGGA, tests whether two bulk measures of intratumoral heterogeneity explain it (they do not), pools
the age effect across 13 cohorts and about 40,800 patients, and releases an open cohort explorer and a browser-based
platform in which other researchers can compare their own cohort with these, without their data leaving their computer.

**Live site:** https://nnnnshsjsjsj.github.io/gbm-age-survival/ — Explore, Analyse and Pool for everyone; a moderated research space and a separate family space for signed-in members
**Paper:** [`paper/Research_Paper_EN.pdf`](paper/Research_Paper_EN.pdf) · [`paper/Research_Paper_RU.pdf`](paper/Research_Paper_RU.pdf)

## Findings in one table

| | Result |
|---|---|
| Age effect, TCGA (593 patients, 492 deaths) | HR 1.034 per year (95% CI 1.027–1.042); stable across five nested models (1.027–1.037) |
| Age effect, CGGA (218 / 183) | HR 1.020 (1.008–1.032); smaller than TCGA (interaction p = 0.058) |
| Sex vs KPS in the adjusted model | The small drop in the age HR comes from KPS, not sex (Table A5) |
| Cell-state entropy (Neftel states, bulk RNA) vs age | ρ = 0.04 (TCGA, n = 437) and 0.07 (CGGA, n = 218): no relation |
| MATH score (mutation allele fractions) vs age | ρ = −0.18 (TCGA, n = 375): slightly lower in older tumours |
| Heterogeneity and survival | Neither score prognostic; age HR unchanged with either in the model (1.032 / 1.037) |
| Meta-analysis, 13 cohorts | Pooled HR 1.028 per year (1.024–1.033); 95% prediction interval 1.012–1.045; I² 79% (49% without SEER) |

## Repository layout

```
analysis/    all Python scripts; run_all.sh reproduces everything; fetch_data.py downloads the large raw inputs
             legacy_calculator/  the withdrawn per-patient calculator (kept for the record, not deployed)
docs/        what GitHub Pages serves: the built cohortex app (do not edit by hand; built from platform/)
platform/    cohortex: React + Vite app, the JavaScript statistics engine (src/engine), its tests (tests/),
             the Supabase schema (supabase/migrations/0002_plateau.sql) and browser tests (e2e/)
app/         legacy_calculator/ and legacy_explorer/: earlier versions, kept for the record
data/        harmonised patient-level tables for TCGA, CGGA, MSK-IMPACT and CPTAC; Neftel gene lists;
             published estimates used in the meta-analysis with their sources; raw/ is filled by fetch_data.py
results/     every table, log and figure (heterogeneity/, meta/, figures/)
paper/       the paper in English and Russian (.docx and .pdf) and paper/build/ that generates it
```

## Reproduce the analysis

```bash
pip install -r requirements.txt
bash analysis/run_all.sh          # downloads ~350 MB of raw data on first run, then ~2 minutes of computation
```

Each script prints the numbers it is responsible for; `results/` holds the committed copies to compare against.

## Run the platform locally

```bash
cd platform
npm install
npm test          # 51 engine tests against lifelines golden values
npm run dev       # the live Supabase project is built in; Explore, Analyse and Pool also work offline
npm run build     # writes ../docs (the whole site)
npm run e2e       # browser test of the whole wizard (needs a prior build)
```

Accounts and the two communities run on Supabase (internal schema name `plateau`, see `platform/supabase/migrations/0002_plateau.sql`).
Moderators are listed in `plateau.admin_emails`. See `platform/README_PLATFORM.md` for the live test.

## Data sources

TCGA-GBM (cBioPortal `gbm_tcga` and `gbm_tcga_pan_can_atlas_2018`), CGGA (`mRNAseq_693`, `mRNAseq_325`), MSK-IMPACT
glioma (cBioPortal `glioma_mskcc_2019`), CPTAC-3 GBM (cBioPortal `gbm_cptac_2021`), Neftel et al. 2019 meta-modules.
All de-identified public research data. The published estimates in the meta-analysis are listed with their source
pages in `data/published_estimates.csv`.

## What this is not

Not a prognosis tool and not medical advice. Everything here describes how groups of patients in research cohorts
fared. The earlier per-patient calculator was withdrawn for that reason and is kept only under `legacy_calculator/`.

## License

MIT. See LICENSE.
