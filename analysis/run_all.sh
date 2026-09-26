#!/usr/bin/env bash
# Reproduce every table and figure. Run from the repository root:  bash analysis/run_all.sh
# The scripts were written against a flat working folder; this script recreates that layout with links in work/.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
python3 analysis/fetch_data.py
mkdir -p work && cd work
ln -sfn ../data/cohorts/tcga_gbm_full_clinical.csv cohort.csv
mkdir -p cgga_out && ln -sfn ../../data/cgga_cohort_final.csv cgga_out/cgga_cohort_final.csv
ln -sfn ../data/raw data_ext
ln -sfn ../app app; ln -sfn ../docs docs; ln -sfn ../platform platform; ln -sfn ../analysis analysis
for s in mtable_sex_kps heterogeneity meta_analysis export_explorer build_explorer make_golden; do ln -sfn ../analysis/$s.py $s.py; done
python3 mtable_sex_kps.py results
python3 heterogeneity.py het_out en && python3 heterogeneity.py het_out ru
python3 meta_analysis.py meta_out en && python3 meta_analysis.py meta_out ru
python3 export_explorer.py && python3 build_explorer.py
python3 make_golden.py
echo "outputs: work/results work/het_out work/meta_out ; explorer -> docs/index.html ; golden -> platform/tests/golden.json"
echo "compare with the committed copies in results/ to confirm the numbers"
