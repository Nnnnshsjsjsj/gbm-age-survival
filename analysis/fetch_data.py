#!/usr/bin/env python3
"""Download the raw inputs that are too large to keep in the repository into data/raw/.

Sources
  cBioPortal datahub (public, via GitHub LFS media host):
    gbm_tcga: expression (Agilent, RNA-seq), mutations, clinical
    gbm_tcga_pan_can_atlas_2018: mutations with read counts (for MATH)
    glioma_mskcc_2019, gbm_cptac_2021: clinical tables (extra cohorts)
  CGGA (cgga.org.cn): RNA-seq expression for the mRNAseq_693 and mRNAseq_325 batches
  Neftel 2019 meta-module gene lists: a public copy in the bardylab/GBM_CSF_Science_Advances_Paper_2023 repository

Run from the repository root:  python3 analysis/fetch_data.py
If cgga.org.cn refuses the automated download, download the two zips in a browser and put them in data/raw/.
"""
import os, sys, urllib.request, zipfile
RAW = "data/raw"; os.makedirs(f"{RAW}/cohorts", exist_ok=True)
DH = "https://media.githubusercontent.com/media/cBioPortal/datahub/master/public"
FILES = {
 f"{RAW}/tcga_data_clinical_patient.txt": f"{DH}/gbm_tcga/data_clinical_patient.txt",
 f"{RAW}/tcga_data_clinical_sample.txt": f"{DH}/gbm_tcga/data_clinical_sample.txt",
 f"{RAW}/tcga_data_mutations.txt": f"{DH}/gbm_tcga/data_mutations.txt",
 f"{RAW}/tcga_data_mrna_seq_v2_rsem.txt": f"{DH}/gbm_tcga/data_mrna_seq_v2_rsem.txt",
 f"{RAW}/tcga_data_mrna_agilent_microarray.txt": f"{DH}/gbm_tcga/data_mrna_agilent_microarray.txt",
 f"{RAW}/pca_data_mutations.txt": f"{DH}/gbm_tcga_pan_can_atlas_2018/data_mutations.txt",
 f"{RAW}/cohorts/glioma_mskcc_2019__data_clinical_patient.txt": f"{DH}/glioma_mskcc_2019/data_clinical_patient.txt",
 f"{RAW}/cohorts/glioma_mskcc_2019__data_clinical_sample.txt": f"{DH}/glioma_mskcc_2019/data_clinical_sample.txt",
 f"{RAW}/cohorts/gbm_cptac_2021__data_clinical_patient.txt": f"{DH}/gbm_cptac_2021/data_clinical_patient.txt",
 f"{RAW}/cohorts/gbm_cptac_2021__data_clinical_sample.txt": f"{DH}/gbm_cptac_2021/data_clinical_sample.txt",
 f"{RAW}/CGGA.mRNAseq_693.RSEM-genes.20200506.txt.zip": "https://www.cgga.org.cn/download/20200506/CGGA.mRNAseq_693.RSEM-genes.20200506.txt.zip",
 f"{RAW}/CGGA.mRNAseq_325.RSEM-genes.20200506.txt.zip": "https://www.cgga.org.cn/download/20200506/CGGA.mRNAseq_325.RSEM-genes.20200506.txt.zip",
 f"{RAW}/neftel_metamodules.tsv": "https://raw.githubusercontent.com/bardylab/GBM_CSF_Science_Advances_Paper_2023/main/data/reference_sheets/IDHwt.GBM.MetaModules.tsv",
}
for path, url in FILES.items():
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        print("have   ", path); continue
    print("fetch  ", url)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "gbm-age-survival/1.0"})
        with urllib.request.urlopen(req, timeout=600) as r, open(path, "wb") as f:
            while True:
                b = r.read(1 << 20)
                if not b: break
                f.write(b)
        print("   ok  ", os.path.getsize(path) // 1024, "KB")
    except Exception as e:
        print("   FAILED", e, "\n   download it manually and place it at", path)
for z in ["CGGA.mRNAseq_693.RSEM-genes.20200506.txt.zip", "CGGA.mRNAseq_325.RSEM-genes.20200506.txt.zip"]:
    p = f"{RAW}/{z}"
    if os.path.exists(p) and not os.path.exists(p[:-4]):
        try: zipfile.ZipFile(p).extractall(RAW); print("unzipped", z)
        except zipfile.BadZipFile: print("not a zip (blocked download?):", p)
# the Neftel file name used by the scripts
if not os.path.exists(f"{RAW}/neftel_metamodules.tsv") and os.path.exists("data/neftel_metamodules.tsv"):
    import shutil; shutil.copy("data/neftel_metamodules.tsv", f"{RAW}/neftel_metamodules.tsv")
print("done. Raw folder:", RAW)
