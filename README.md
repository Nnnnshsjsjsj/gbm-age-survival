# Intratumoral heterogeneity, age at diagnosis and overall survival in glioblastoma

A student research project on public glioblastoma data. It measures the age effect on overall survival in TCGA,
validates it in CGGA, tests whether two bulk measures of intratumoral heterogeneity explain it (they do not), pools
the age effect across 13 cohorts and about 40,800 patients, and releases an open cohort explorer and a browser-based
platform in which other researchers can compare their own cohort with these, without their data leaving their computer.

**Live site:** https://nnnnshsjsjsj.github.io/gbm-age-survival/ (cohort explorer) · https://nnnnshsjsjsj.github.io/gbm-age-survival/platform/ (platform)
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
app/         cohort explorer source (explorer_template.html + explorer_data.json)
docs/        what GitHub Pages serves: index.html (explorer) and platform/ (built platform)
platform/    the platform: React + Vite app, the JavaScript statistics engine (src/engine), its tests (tests/),
             the Supabase schema (supabase/migrations) and the browser end-to-end test (e2e/)
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
npm run dev       # local mode: Explore, Analyse and Pool work; sharing and community need Supabase
npm run build     # writes ../docs/platform
npm run e2e       # browser test of the whole wizard (needs a prior build)
```

To enable sign-in, sharing, the researcher directory and the admin queue: create a Supabase project, run
`platform/supabase/migrations/0001_init.sql` in its SQL editor, copy `platform/.env.example` to `platform/.env` with the
project URL and anon key, rebuild, and add your own user to the `admins` table after your first sign-in.

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
