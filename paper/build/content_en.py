# -*- coding: utf-8 -*-
# English manuscript, plain-language version. Citation tokens: [@key] or [@key1;@key2].

TITLE = "Age at Diagnosis and Overall Survival in Glioblastoma: Analysis of the TCGA Cohort with External Validation in CGGA"
COVER = [
    "[ Name of school / institution ]",
    "[ Name of conference / section ]",
    "RESEARCH PAPER",
    TITLE,
    "",
    "Author: [ Full name, grade ]",
    "Supervisor: [ Full name, position ]",
    "Advisor: [ Full name ]",
    "[ City ], 2026",
]

ABSTRACT = (
    "Glioblastoma is the deadliest brain tumor in adults. Patients who receive the same diagnosis and the same "
    "treatment can still live for very different lengths of time, and that difference is not fully explained. Age at "
    "diagnosis is the oldest known clinical predictor of survival, but in the TCGA glioblastoma dataset age is usually "
    "used as a background correction rather than studied on its own. We asked two questions. Does age predict how long "
    "patients live? And does it still predict survival once we account for sex, physical condition (Karnofsky score), "
    "MGMT promoter methylation and IDH mutation status? We downloaded clinical, mutation and methylation data for 606 "
    "patients from cBioPortal. Our final group contained 593 patients with a known age and a known survival time, and "
    "492 of them died during follow-up. We used Kaplan-Meier curves, log-rank tests and five Cox regression models. "
    "Patients younger than the median age of 59 years lived a median of 17.7 months. Older patients lived 10.7 months "
    "(log-rank p = 2.5 × 10⁻¹³). Median survival fell steadily across age quartiles, from 21.9 months in the youngest "
    "quarter to 7.6 months in the oldest. In all five models, each extra year of age raised the risk of death by "
    "between 2.7% and 3.7%, which is about 40% per decade. The effect was strongest during the first year after "
    "diagnosis and held in IDH-wildtype tumors, the group that matches the 2021 WHO definition of glioblastoma. We then "
    "repeated the analysis in an independent cohort of 218 primary glioblastoma patients from the Chinese Glioma Genome "
    "Atlas (CGGA). Age predicted survival there too (HR 1.020 per year, 95% CI 1.008–1.032), with the same first-year "
    "concentration and the same independence from IDH status, but the effect was smaller than in TCGA (interaction "
    "p = 0.058), and neither age range nor treatment explained the gap. Age is a strong and largely independent "
    "predictor of survival in both cohorts, and molecular studies that use these data need to correct for it. The fitted "
    "models are available as an open, single-file survival calculator."
)
KEYWORDS = "glioblastoma, age at diagnosis, overall survival, Cox regression, TCGA, CGGA, external validation, IDH, MGMT"

# ("h1"|"h2"|"h3", text) | ("p", text) | ("fig", key, caption) | ("table", caption, header, rows) | ("num", [..])
BODY = [
("h1", "1. Introduction"),
("h2", "1.1. Background and significance"),
("p", "Glioblastoma (GBM) is the most aggressive tumor that starts inside the adult brain and spinal cord. Almost "
      "every patient dies of it, and that has not changed much in forty years. GBM is not a common cancer, but it is "
      "the most common malignant brain tumor. In the United States about 3.27 people per 100,000 are diagnosed with it "
      "each year. GBM makes up 13.9% of all tumors that start in the brain and 51.5% of the malignant ones [@cbtrus]. "
      "It is mostly a disease of older people. The median age at diagnosis is 66 years, and men get it more often than "
      "women [@cbtrus]. Worldwide, GLOBOCAN 2022 counted about 321,700 new brain and nervous system cancers and "
      "248,500 deaths from them, although it does not count GBM separately [@globocan]."),
("p", "Survival is what makes GBM such a serious problem. Only 43.2% of patients are alive one year after diagnosis, "
      "and only 7.1% are alive after five years [@cbtrus]. Most patients die within the first year. About one patient "
      "in fourteen reaches five years."),
("p", "Treatment has barely improved since the current standard was set. The EORTC/NCIC trial added the drug "
      "temozolomide to radiotherapy after surgery, and median survival rose from 12.1 to 14.6 months [@stupp2005]. "
      "After five years of follow-up, about 10% of the patients who received radiotherapy plus temozolomide were still "
      "alive, compared with about 2% of those who received radiotherapy alone [@stupp2009]. Twenty years later those "
      "numbers are still the benchmark for the field."),
("p", "The real problem sits behind these averages. Two patients can get the same diagnosis and the same treatment and "
      "still have completely different outcomes. Some tumors come back within months. Others respond for a while, and "
      "a few patients live much longer than expected. Looking at the tumor under a microscope does not explain this "
      "difference. There are two kinds of explanation. The first is molecular: the tumors differ in their genes and in "
      "the mix of cells inside them. The second is clinical: the patients differ in age, in how well they can function "
      "day to day, and in how much treatment they can tolerate. Before we use molecular data to predict survival, we "
      "need to know how much the clinical variables already explain. Age is the first of those variables, and it is "
      "what this paper studies."),

("h2", "1.2. Molecular features of glioblastoma and the WHO CNS5 classification"),
("p", "The Cancer Genome Atlas (TCGA) mapped the genetics of GBM in 2008. It showed that the changes which keep "
      "appearing in these tumors cluster on three signaling pathways. The RTK/RAS/PI3K pathway is altered in about 88% "
      "of tumors, the p53 pathway in about 87% and the RB pathway in about 78% [@tcga2008]. A larger TCGA study in "
      "2013 confirmed this picture and refined the numbers [@brennan2013]. The genes that appear again and again are "
      "EGFR, which is often amplified and sometimes rearranged into a form called EGFRvIII, along with PDGFRA, PTEN, "
      "NF1, TP53, MDM2 and MDM4, CDKN2A/B, CDK4 and RB1. Mutations in the TERT promoter, which help a tumor protect "
      "the ends of its chromosomes, appear in most primary IDH-wildtype tumors and usually come together with EGFR "
      "amplification [@brennan2013]."),
("p", "Two molecular markers matter for this study, because both of them are linked to age. The first is IDH. "
      "Mutations in the IDH1 or IDH2 genes appear in a small share of tumors that look like GBM under a microscope. "
      "Patients who carry these mutations are younger and live longer than patients with IDH-wildtype tumors "
      "[@yan2009]. IDH mutation also produces a distinctive pattern of DNA methylation called G-CIMP, which is again "
      "more common in younger patients and in the proneural subtype [@noushmehr2010]. The second marker is MGMT. When "
      "the MGMT promoter is methylated, the cell produces less of a DNA repair enzyme, and the tumor responds better "
      "to temozolomide. In the EORTC/NCIC trial, patients with a methylated MGMT promoter who received temozolomide "
      "lived a median of 21.7 months, against 12.7 months for patients without methylation [@hegi2005]."),
("p", "The 2021 WHO classification, known as WHO CNS5, changed what the word glioblastoma means. This matters for "
      "anyone working with TCGA data. Glioblastoma is now defined as a grade 4 diffuse astrocytic glioma that is "
      "IDH-wildtype and H3-wildtype. The diagnosis can be made from what the tumor looks like, meaning new blood "
      "vessels or dead tissue inside it, or from molecular findings alone: a TERT promoter mutation, EGFR "
      "amplification, or gain of chromosome 7 together with loss of chromosome 10 [@louis2021]. Tumors that look the "
      "same but carry an IDH mutation are now called astrocytoma, IDH-mutant, and count as a different disease with a "
      "different course. The TCGA-GBM dataset was collected before 2021, so it still contains IDH-mutant tumors that "
      "would no longer be called glioblastoma. Those patients are younger and live longer, so leaving them in could "
      "make the age effect look larger than it really is. We handle this in a separate analysis (Section 3.7)."),

("h2", "1.3. Intratumoral heterogeneity"),
("p", "Molecular profiling explained part of why patients differ from one another. It also revealed that a single "
      "tumor is not uniform inside. Intratumoral heterogeneity (ITH) means that one tumor contains several groups of "
      "cells that differ in their genes, in which genes they switch on, in how they behave and in what surrounds them "
      "[@eisenbarth2023;@yabo2024]. This is not the same as intertumoral heterogeneity, which is the difference "
      "between the tumors of different patients. The distinction has a practical consequence for GBM. One biopsy can "
      "describe one part of a tumor correctly and still miss cell types that exist somewhere else in the same tumor "
      "[@parker2016]."),
("p", "ITH is connected to why treatment fails, and the evidence is strongest for drug resistance. Studies that sample "
      "several regions of one tumor, or single cells, or the spatial layout of a tumor, all show that heterogeneity "
      "explains why different parts of the same tumor respond differently to therapy [@qazi2017;@akgul2019]. The "
      "mechanism is simple in outline. Treatment kills the sensitive cells, and the resistant ones survive and grow. "
      "Wang and colleagues compared 86 pairs of samples taken from the same patients before and after treatment. They "
      "found that relapse is driven less by new mutations and more by a shift toward a mesenchymal cell state, "
      "controlled by a protein complex called AP-1, together with signals the tumor receives from nearby nerve and "
      "immune cells [@wang2022]. Earlier work had already shown that this mesenchymal shift, driven by NF-κB, makes "
      "tumors resistant to radiation [@bhat2013]. The link between heterogeneity and how soon a tumor comes back is "
      "less certain. A 2025 study reported shorter survival in tumors with more copy-number variation [@otani2025], "
      "but direct evidence is still limited."),
("p", "This paper does not measure heterogeneity. It establishes the clinical baseline that a later heterogeneity "
      "analysis of the same dataset will have to work against. If age on its own multiplies the risk of death by 1.4 "
      "per decade, then any molecular score that happens to correlate with age will look predictive for the wrong "
      "reason, unless age is included in the model."),

("h2", "1.4. Transcriptional subtypes and cellular states"),
("p", "Verhaak and colleagues sorted GBM into four transcriptional subtypes using bulk expression data, and linked "
      "those subtypes to the genes described in Section 1.2. EGFR changes mark the classical subtype, PDGFRA and IDH1 "
      "changes mark the proneural subtype, and loss of NF1 marks the mesenchymal subtype [@verhaak2010]. Each tumor "
      "was described by a single average expression profile taken from a mixture of cells. This system organized a "
      "decade of GBM research. It was later reduced to three tumor-intrinsic subtypes, once the signal coming from "
      "non-tumor cells was separated out [@wangq2017]."),
("p", "Single-cell sequencing then broke the assumption that one tumor equals one subtype. Patel and colleagues "
      "sequenced individual cells from primary glioblastomas and found cells of different subtypes living inside the "
      "same tumor [@patel2014]. Neftel and colleagues turned this into a model with four malignant cell states: "
      "AC-like, OPC-like, NPC-like and MES-like. These states appear in most tumors, cells can switch from one to "
      "another, and each state is linked to particular genetic changes, with CDK4 tied to NPC-like, PDGFRA to "
      "OPC-like, EGFR to AC-like and NF1 to MES-like. They tested the model by scoring the four states on 401 bulk "
      "TCGA samples [@neftel2019]. The subtypes did not disappear. They turned out to describe states inside one "
      "tumor rather than fixed labels for whole tumors."),
("p", "Age runs through this molecular map. The proneural subtype, and the IDH-mutant G-CIMP tumors inside it, are "
      "more common in younger patients [@verhaak2010;@noushmehr2010]. Whether age affects survival through these "
      "molecular differences, or separately from them, is a question that can be tested. The models in this paper "
      "test exactly that."),

("h2", "1.5. Age as a clinical predictor"),
("p", "Age is the oldest prognostic variable in neuro-oncology. In 1993 the Radiation Therapy Oncology Group analyzed "
      "1,578 patients from three malignant glioma trials. Their method split patients into groups using whichever "
      "variable separated them best, and the very first split was age, at 50 years. Age, Karnofsky performance score "
      "and mental status together produced six prognostic classes [@curran1993]. The later EORTC/NCIC nomograms kept "
      "age, performance status, how much tumor the surgeon removed, mental state and MGMT status as independent "
      "predictors [@gorlia2008]. In the temozolomide trial itself, patients over 60 gained less from the drug "
      "[@stupp2005]."),
("p", "Older patients are now treated as a group of their own. The Nordic trial and the NOA-08 trial showed that "
      "temozolomide alone, or a shorter course of radiotherapy, works at least as well as standard six-week "
      "radiotherapy in patients over 60 or 65 [@malmstrom2012;@wick2012]. The CE.6 trial then made short-course "
      "radiotherapy plus temozolomide the standard for patients aged 65 and over, with a median survival of 9.3 "
      "months [@perry2017]. So the clinical effect of age is not in doubt. What is still open for any particular "
      "research dataset is how large the effect is, what shape it has, whether it stays the same over time, and how "
      "much of it survives once we correct for molecular markers that are themselves tied to age."),
("p", "Sex belongs in the same discussion. Women with GBM live longer than men, and the difference remains after "
      "correction for age and treatment [@ostrom2018]. We therefore include sex as a variable alongside performance "
      "status."),

("h2", "1.6. Using public data"),
("p", "TCGA profiled several hundred glioblastomas and published the results together with clinical information: which "
      "genes were mutated, how many copies of each region the tumor carried, how its DNA was methylated, which genes "
      "were switched on, and how long each patient lived [@tcga2008;@brennan2013]. cBioPortal makes these data "
      "available in one place and in one format, together with follow-up time and whether the patient was alive at "
      "last contact [@cerami2012;@gao2013]. A study of age and survival needs three tables: the clinical file, the "
      "IDH1 and IDH2 mutation calls, and the MGMT methylation values. A second public resource, the Chinese Glioma "
      "Genome Atlas (CGGA), publishes clinical tables for more than a thousand glioma patients treated in Beijing, "
      "including age, sex, survival, IDH and MGMT status and whether the patient received radiotherapy and temozolomide "
      "[@zhao2021]. Because it comes from a different population and a later treatment era, it is a natural place to "
      "check whether a result from TCGA holds up. Two limits of the TCGA resource should be stated "
      "now rather than buried in the discussion. First, the clinical file has no field for how much of the tumor the "
      "surgeon removed, so we cannot include that variable. Second, patients were enrolled between 1989 and 2013, a "
      "period that covers the years before and after temozolomide became standard. Treatment therefore varies from "
      "patient to patient and is mostly not recorded."),
("p", "Survival data need their own methods, because follow-up is never complete. Some patients were still alive when "
      "the study last had contact with them. We know they lived at least that long, but not how long in total. "
      "Removing these patients would bias the result in one direction, and treating their follow-up time as a "
      "survival time would bias it in the other. The Kaplan-Meier estimator handles this correctly [@km1958]. The "
      "log-rank test compares survival between groups. Cox regression estimates how much each variable multiplies the "
      "risk of death, without having to assume a shape for the underlying risk over time [@cox1972]. These three "
      "methods form the framework of this paper."),

("h2", "1.7. Knowledge gap, aim and objectives"),
("p", "The value of age as a predictor is well established in clinical trials, but trials enroll patients who are in "
      "relatively good condition [@curran1993;@gorlia2008]. In TCGA-GBM, age almost always appears as a correction "
      "term in studies aimed at some molecular marker. Its own effect size often goes unreported, or is reported "
      "without a confidence interval. As far as we know, three questions have not been answered together for this "
      "dataset. How stable is the age effect when we change which variables we correct for, given that each "
      "correction also shrinks the sample? Does the effect stay the same throughout follow-up? How much of it is left "
      "once we remove the IDH-mutant tumors that WHO CNS5 no longer counts as glioblastoma? And does the estimate from "
      "TCGA replicate in an independent cohort from a different population and treatment era? A prognostic result that "
      "has only been shown in one dataset is a hypothesis, not a finding [@royston2013]."),
("h3", "Aim"),
("p", "To measure the association between age at diagnosis and overall survival in the TCGA-GBM dataset, and to test "
      "whether that association is independent of sex, Karnofsky performance score, MGMT promoter methylation and IDH "
      "mutation status, and to check whether it replicates in the independent CGGA cohort."),
("h3", "Objectives"),
("num", [
    "To build a patient-level dataset from the cBioPortal gbm_tcga export, reading the survival status string correctly as a censoring indicator.",
    "To describe how age at diagnosis is distributed, and to compare survival between patients below the median age and patients at or above it.",
    "To test whether the effect grows with age by comparing survival across age quartiles.",
    "To estimate how much each extra year of age multiplies the risk of death, using a series of Cox models with more and more corrections, and to check whether the models' main assumption holds.",
    "To repeat the estimate in IDH-wildtype tumors only, matching the WHO CNS5 definition of glioblastoma.",
    "To validate the age effect externally by repeating the analysis in primary glioblastoma patients from CGGA and testing whether the two cohorts' estimates differ.",
    "To release the fitted models as an open survival calculator, so that the results can be inspected and reused.",
]),
("h3", "Hypothesis"),
("p", "Patients younger than the median age of the group live longer than older patients, and each extra year of age "
      "raises the risk of death even after correction for sex, performance status, MGMT status and IDH status. The "
      "hypothesis is wrong if the corrected confidence interval for the hazard ratio includes 1.0."),
("h3", "Novelty"),
("p", "The link between age and survival in glioblastoma is not new. This study adds three things for the TCGA-GBM "
      "dataset. It uses nested models, which separate the effect of correcting for a variable from the effect of "
      "losing patients. It splits follow-up time to show how the age effect changes after the first year. And it "
      "gives a separate estimate for IDH-wildtype tumors. It then does what most TCGA-based prognostic papers skip: it "
      "repeats the whole analysis in an independent cohort and tests formally whether the two estimates agree. The "
      "study also serves as the clinical baseline for a planned analysis of cellular-state signatures in the same "
      "dataset."),

("h1", "2. Materials and Methods"),
("h2", "2.1. Data source"),
("p", "We took our data from cBioPortal for Cancer Genomics [@cerami2012;@gao2013], study identifier gbm_tcga "
      "(Glioblastoma Multiforme, TCGA, Firehose Legacy), downloaded on 25 July 2026. We used three tables: the "
      "clinical export with 619 sample rows, the IDH1 and IDH2 mutation table with 290 profiled samples, and the "
      "gene-level MGMT methylation values from two Illumina array platforms, HumanMethylation27 (HM27) and "
      "HumanMethylation450 (HM450). The data carry no patient identifiers and were collected in studies with "
      "documented informed consent under the TCGA program [@tcga2008]."),
("h2", "2.2. Building the patient group"),
("p", "The clinical export held 619 rows for 606 patients, because 13 patients gave two samples each. Survival "
      "belongs to a patient and not to a sample, so we first reduced the table to one row per patient and kept the "
      "row with the longer recorded follow-up. We then kept a patient only if the survival time, the survival status "
      "and the age at diagnosis were all present, and the survival time was greater than zero. Thirteen patients "
      "failed at least one of these tests. Twelve had no survival time or status, ten had no age, and one had a "
      "survival time of zero months. These counts add up to more than 13 because a patient can fail more than one "
      "test. That left 593 patients, or 97.9% of the group, with 492 deaths and 101 patients still alive at last "
      "contact. Figure 1 shows the whole process."),
("p", "We did not restrict the main analysis to IDH-wildtype tumors, because IDH status was known for fewer than half "
      "of the patients (Section 2.4), and restricting the group would have thrown away most of the data. Instead we "
      "applied the WHO CNS5 criterion in a separate analysis planned in advance (Section 2.5)."),
("h2", "2.3. Survival time and censoring"),
("p", "cBioPortal stores survival status as the text 1:DECEASED or 0:LIVING. We read the number at the front of that "
      "string as the event indicator. The number is a censoring indicator rather than a label, and it only makes "
      "sense together with the recorded time. If the indicator is 1, the recorded time is how long the patient lived. "
      "If it is 0, the recorded time is how long the study followed the patient, and the true survival time is "
      "unknown and longer than that. In our group the median recorded time was shorter for living patients (8.6 "
      "months) than for patients who died (12.5 months). That happens because the living patients joined the study "
      "later, not because they did worse. Averaging recorded times, or dropping the living patients, would push the "
      "result in opposite directions. We used Kaplan-Meier and Cox methods because they use the partial information "
      "from these patients correctly."),
("h2", "2.4. Variables"),
("p", "We took age at diagnosis in years from the clinical field Diagnosis Age and used it as a continuous variable. "
      "For the descriptive comparisons we also split it at the median and into quartiles. We coded sex as an "
      "indicator for male. The Karnofsky performance score (KPS), a 0 to 100 scale of how well a patient can function "
      "day to day, was available for 439 patients. We divided it by 10, so that the result refers to a change of 10 "
      "points."),
("p", "We derived IDH status from the IDH1 and IDH2 columns of the mutation table. A patient counted as IDH-mutant if "
      "either gene carried a mutation that changes the protein, and as IDH-wildtype if both genes were called normal. "
      "Samples marked as not profiled (NP) for both genes stayed missing, and we never treated them as wildtype. If a "
      "patient had two profiled samples, a mutant call won. IDH status was known for 285 of the 593 patients."),
("p", "MGMT promoter methylation is not given as a yes or no category in cBioPortal. Only a continuous beta value per "
      "gene is available, from two array platforms that use different probes and share only five samples. We split "
      "the beta values into two groups on each platform separately, using a two-component Gaussian mixture model "
      "(scikit-learn, random_state = 0), and called a sample methylated if it belonged to the component with the "
      "higher mean. If a patient had values on both platforms, we kept the higher beta. MGMT status was known for 413 "
      "patients, and 156 of them (37.8%) came out methylated. Our calls agreed with the independent annotation in the "
      "GlioVis portal [@gliovis] for 75.4% of the 346 patients present in both, and we return to what that means in "
      "Section 5. Array-based MGMT calling is known to depend on which probes and which threshold are used "
      "[@bady2012]."),
("h2", "2.5. Statistical analysis"),
("p", "We estimated survival curves with the Kaplan-Meier method [@km1958] and compared them with the log-rank test, "
      "or with its four-group version. Median survival times come from the Kaplan-Meier curves. We estimated median "
      "follow-up with the reverse Kaplan-Meier method. The main analysis used age as a continuous variable in Cox "
      "regression [@cox1972]. We report the hazard ratio for one extra year of age with a 95% confidence interval, "
      "plus the concordance index, which measures how well the model ranks patients by risk. Cutting a continuous "
      "variable into groups throws away information and can create thresholds that do not exist [@royston2006], so we "
      "treat the median split and the quartiles as descriptive and take the continuous estimate as the real result."),
("p", "Different variables were missing for different patients, so a single model containing all of them would have "
      "covered only 174 patients. Instead we fitted five nested models, each on the patients with complete data for "
      "its own set of variables. M1 contains age alone. M2 adds sex and KPS. M3 adds MGMT. M4 adds IDH. M5 contains "
      "all five variables. If the age estimate stays roughly the same across these models, and the confidence "
      "intervals overlap, then the effect is not an artifact of one particular correction or one particular subgroup. "
      "We tested the proportional hazards assumption, which says that a variable's effect stays constant over time, "
      "using scaled Schoenfeld residuals against Kaplan-Meier transformed time [@schoenfeld1982;@grambsch1994]. Where "
      "the assumption failed, we cut follow-up at 12 months and fitted age-only Cox models twice: once for the first "
      "year, with follow-up censored at 12 months, and once for the patients who survived past it, with time reset to "
      "zero at 12 months."),
("p", "The sensitivity analysis, planned before we ran it, restricted the group to IDH-wildtype tumors in line with "
      "WHO CNS5. We compared age and survival between IDH-mutant and IDH-wildtype patients with the Mann-Whitney U "
      "test and the log-rank test, then refitted the age-only Cox model in the wildtype subgroup. The comparison that "
      "matters is how much the age estimate changes when the IDH-mutant tumors are removed, so we compared the "
      "wildtype estimate with the age-only estimate on all IDH-profiled patients, not with the full group. We treated "
      "two-sided p values below 0.05 as significant. We did not correct for multiple comparisons, because the study "
      "tests one hypothesis about age that was set in advance, and the other analyses either describe the data or "
      "confirm the main result. Every estimate comes with a confidence interval."),
("h2", "2.6. Software and reproducibility"),
("p", "We ran everything in Python 3 using pandas, NumPy, lifelines [@lifelines], scikit-learn and Matplotlib. A "
      "single script, run.py, reads the unchanged cBioPortal exports from a data/ folder and writes every figure, the "
      "table of nested models and the final patient-level file into a figures/ folder. The only step that involves "
      "randomness, the Gaussian mixture used for MGMT, runs with a fixed seed of 0. The script, the list of required "
      "libraries and the final data table are attached to this paper (Appendix C)."),
("h2", "2.7. External validation cohort"),
("p", "We downloaded the clinical tables of the two CGGA RNA-sequencing batches, mRNAseq_693 and mRNAseq_325, from "
      "cgga.org.cn [@zhao2021]. They hold 1,018 glioma patients of all grades with no overlap between batches. To mirror "
      "the TCGA cohort we kept patients with WHO grade IV, histology recorded as GBM, and a primary tumor, which removes "
      "lower-grade gliomas, recurrent GBM and secondary GBM. We then applied the same completeness rule as before: "
      "survival time, survival status and age all present, and survival time greater than zero. CGGA reports survival "
      "in days, so we divided by 30.4375 to obtain months. Sex, IDH status and MGMT promoter status were recoded to the "
      "same 0/1 variables as in TCGA. CGGA also records whether each patient received radiotherapy and temozolomide, "
      "which TCGA does not, and does not record the Karnofsky score, which TCGA does. The nested models for CGGA "
      "therefore replace KPS with treatment: M1 age; M2 age and sex; M2t age, sex, radiotherapy and temozolomide; M3 age "
      "and MGMT; M4 age and IDH; M5 all of these. Every other step, including the median split at 59 years, the "
      "quartiles, the 12-month split and the IDH-wildtype sensitivity analysis, was repeated unchanged."),
("h2", "2.8. Comparing the two cohorts"),
("p", "To ask whether the age effect is the same in both cohorts we did three things. First, for each adjustment set "
      "available in both cohorts we compared the two log hazard ratios with a two-sample z test, which gives a p value "
      "for heterogeneity. Second, we pooled the two cohorts into one Cox model with age, a cohort indicator and their "
      "interaction; the interaction term tests whether the age slope differs between cohorts. Third, because the CGGA "
      "patients are younger, we refitted the age-only model in both cohorts restricted to the same age windows (18–79, "
      "40–79 and 18–70 years), and in CGGA restricted to temozolomide-treated patients, to see whether age range or "
      "treatment could explain any difference. These comparisons were specified before the CGGA data were opened. All "
      "of this is in compare_cohorts.py."),
("h2", "2.9. Practical component: a survival calculator"),
("p", "The fitted models would be of little use locked inside a table, so we built a calculator that runs them. For "
      "each cohort we fitted one Cox model for every combination of the optional variables (sex, KPS, MGMT and IDH in "
      "TCGA; sex, MGMT and IDH in CGGA), with age always included, on the patients who had those variables recorded. "
      "That gives 16 models for TCGA and 8 for CGGA. For each model we stored the coefficients, their covariance "
      "matrix, the covariate means and the baseline survival curve on a half-month grid. The calculator is a single "
      "HTML file with no server: it picks the model that matches the variables the user enters, computes "
      "S(t) = S₀(t)^exp(β·(x − x̄)), and draws the curve with a 95% band derived from the coefficient covariance on the "
      "complementary log-log scale. It states on every screen that it is an educational tool built from retrospective "
      "data and not medical advice. We checked its output against lifelines for a set of test patients."),

("h1", "3. Results"),
("h2", "3.1. Who was in the group"),
("p", "Our group contained 593 patients: 363 men (61.2%) and 230 women (38.8%). The median age at diagnosis was 59.0 "
      "years, the mean was 57.8, the middle half of the patients fell between 50 and 68, and the full range ran from "
      "10 to 89 years. Patients were diagnosed between 1989 and 2013, with a median year of 2006. The pathology "
      "record listed untreated primary (de novo) GBM for 543 patients, treated primary GBM for 20 and GBM without "
      "further detail for 30. There were 587 primary tumors and 6 recurrences. During follow-up 492 patients (83.0%) "
      "died and 101 (17.0%) were still alive at last contact. Median follow-up, estimated by the reverse "
      "Kaplan-Meier method, was 73.8 months. Median overall survival for the whole group was 14.0 months, and "
      "survival was 58.1% at one year, 23.2% at two years and 6.0% at five years. KPS was recorded for 439 patients, "
      "with a median of 80 and a middle half between 70 and 80. Table 1 summarizes the group, and Figure 1 shows "
      "which variables were available for how many patients."),
("table", "Table 1. The 593 patients in the analysis.",
    ["Characteristic", "Value"],
    [["Patients, n", "593"],
     ["Male / female, n (%)", "363 (61.2) / 230 (38.8)"],
     ["Age at diagnosis, years: median (middle half); range", "59.0 (50–68); 10–89"],
     ["Died / still alive at last contact, n (%)", "492 (83.0) / 101 (17.0)"],
     ["Median follow-up (reverse Kaplan-Meier), months", "73.8"],
     ["Median overall survival, months", "14.0"],
     ["Survival at 1 / 2 / 5 years, %", "58.1 / 23.2 / 6.0"],
     ["KPS known, n; median (middle half)", "439; 80 (70–80)"],
     ["MGMT status known, n; methylated, n (%)", "413; 156 (37.8)"],
     ["IDH status known, n; mutant, n (%)", "285; 15 (5.3)"],
     ["All five variables known, n", "174"]]),
("fig", "fig1_flow", "Figure 1. How the group of 593 patients was built, and how many of them had each variable. The exclusion counts add up to more than 13 because one patient can fail more than one test."),

("h2", "3.2. Age at diagnosis"),
("p", "Age had a long tail toward younger patients (Figure 2). Most of the group fell between 50 and 75 years. "
      "Sixty-seven patients (11.3%) were younger than 40, sixteen (2.7%) were younger than 25, and 128 (21.6%) were "
      "70 or older. The quartile boundaries used below are 50, 59 and 68 years."),
("fig", "fig2_hist", "Figure 2. Age at diagnosis for the 593 patients. The dashed line marks the median of 59 years."),

("h2", "3.3. Younger patients lived longer than older patients"),
("p", "Splitting the group at the median age gave two halves of similar size (Table 2). Patients younger than 59 lived "
      "a median of 17.7 months. Patients aged 59 or older lived a median of 10.7 months. The gap is 7.0 months, and "
      "the log-rank test gives χ² = 53.5 and p = 2.5 × 10⁻¹³ (Figure 3). One year after diagnosis, 70.2% of the "
      "younger group and 46.3% of the older group were alive. At two years the figures were 32.6% and 13.9%. The two "
      "curves separate within the first months and never cross. Our hypothesis that younger patients live longer is "
      "therefore supported."),
("table", "Table 2. Survival in the two age groups, split at the median.",
    ["Group", "n", "Deaths", "Median survival, months", "Alive at 1 year, %", "Alive at 2 years, %"],
    [["Younger (< 59 years)", "288", "233", "17.7", "70.2", "32.6"],
     ["Older (≥ 59 years)", "305", "259", "10.7", "46.3", "13.9"],
     ["Log-rank test", "", "", "χ² = 53.5, p = 2.5 × 10⁻¹³", "", ""]]),
("fig", "fig3_km2", "Figure 3. Kaplan-Meier survival curves for patients below and at or above the median age of 59 years, with 95% confidence bands."),

("h2", "3.4. Survival fell step by step across age quartiles"),
("p", "A median split treats a 59-year-old and an 89-year-old as the same patient, so we also divided the group into "
      "four equal quartiles. Survival fell at every step (Table 3, Figure 4). Median survival was 21.9 months in the "
      "youngest quarter, then 14.9, 13.3 and 7.6 months in the following quarters. The four-group log-rank test gives "
      "χ² = 97.5 and p = 5.4 × 10⁻²¹. The gap between the youngest and oldest quarters is 14.3 months. Two years "
      "after diagnosis, 44.8% of the youngest quarter and 10.6% of the oldest quarter were alive. The two middle "
      "quarters run close together after the first year, and the largest single drop falls between the third and the "
      "fourth quarter."),
("table", "Table 3. Survival by quartile of age at diagnosis.",
    ["Quartile", "Age range, years", "n", "Deaths", "Median survival, months", "Alive at 1 year, %", "Alive at 2 years, %"],
    [["Q1", "10–50", "161", "122", "21.9", "78.0", "44.8"],
     ["Q2", "51–59", "145", "127", "14.9", "60.4", "17.1"],
     ["Q3", "60–68", "141", "121", "13.3", "59.3", "17.3"],
     ["Q4", "69–89", "146", "122", "7.6", "31.7", "10.6"],
     ["Log-rank test (4 groups)", "", "", "", "χ² = 97.5, p = 5.4 × 10⁻²¹", "", ""]]),
("fig", "fig4_km4", "Figure 4. Kaplan-Meier survival curves for the four age quartiles."),

("h2", "3.5. Each extra year of age raised the risk of death by about 3%"),
("p", "In the model with age alone, fitted on all 593 patients, each extra year of age multiplied the risk of death "
      "by 1.034 (95% CI 1.027 to 1.042; p = 4.4 × 10⁻²¹; concordance 0.655). Over ten years that becomes a hazard "
      "ratio of 1.40 (95% CI 1.31 to 1.50). Across the five nested models the hazard ratio per year stayed between "
      "1.027 and 1.037, even though the sample shrank from 593 patients to 174, and all five confidence intervals "
      "overlapped (Table 4, Figure 5). Correcting for sex and KPS (M2), or for IDH status (M4), moved the estimate "
      "down by less than one percentage point. Correcting for MGMT (M3) moved it slightly up. In the model with all "
      "five variables (M5, n = 174) the hazard ratio was 1.032 (95% CI 1.014 to 1.051; p = 4.3 × 10⁻⁴)."),
("table", "Table 4. Hazard ratio for one extra year of age in five nested Cox models.",
    ["Model", "Variables", "n", "Deaths", "HR per year (95% CI)", "p", "C-index"],
    [["M1", "age", "593", "492", "1.034 (1.027–1.042)", "4.4 × 10⁻²¹", "0.655"],
     ["M2", "age, sex, KPS", "439", "359", "1.028 (1.019–1.037)", "2.3 × 10⁻¹⁰", "0.666"],
     ["M3", "age, MGMT", "413", "316", "1.036 (1.027–1.046)", "2.0 × 10⁻¹⁵", "0.667"],
     ["M4", "age, IDH", "285", "226", "1.027 (1.015–1.040)", "1.5 × 10⁻⁵", "0.629"],
     ["M5", "age, sex, KPS, MGMT, IDH", "174", "127", "1.032 (1.014–1.051)", "4.3 × 10⁻⁴", "0.676"]]),
("fig", "fig5_forest", "Figure 5. Hazard ratio for one extra year of age in each of the five nested Cox models, with 95% confidence intervals. The dashed line marks a hazard ratio of 1.0, which would mean no effect."),
("p", "The other variables behaved the way the literature predicts (Table 5). In model M2, being male carried a hazard "
      "ratio of 1.33 (95% CI 1.07 to 1.66; p = 0.011), and every 10 extra points of KPS lowered the risk of death by "
      "19% (HR 0.81, 95% CI 0.75 to 0.87; p < 0.0001). KPS was the strongest single predictor in the group after age. "
      "MGMT methylation was protective on its own (HR 0.70, 95% CI 0.56 to 0.89; p = 0.0028; median survival 17.2 "
      "against 12.8 months) and after correction for age (M3: HR 0.79, 95% CI 0.62 to 0.99; p = 0.043), but not in "
      "the small five-variable model. IDH mutation had a hazard ratio near 0.5 in both models that contained it, with "
      "wide confidence intervals that cross 1.0. That is what we expected from only 15 mutant patients and 6 deaths "
      "among them."),
("table", "Table 5. Hazard ratios for the variables other than age.",
    ["Variable", "Model", "n", "HR (95% CI)", "p"],
    [["Male sex", "on its own", "593", "1.21 (1.01–1.46)", "0.041"],
     ["Male sex", "M2", "439", "1.33 (1.07–1.66)", "0.011"],
     ["Male sex", "M5", "174", "1.87 (1.26–2.76)", "0.0017"],
     ["KPS, per 10 points", "on its own", "439", "0.77 (0.72–0.83)", "< 0.0001"],
     ["KPS, per 10 points", "M2", "439", "0.81 (0.75–0.87)", "< 0.0001"],
     ["KPS, per 10 points", "M5", "174", "0.85 (0.76–0.96)", "0.0063"],
     ["MGMT methylated", "on its own", "413", "0.70 (0.56–0.89)", "0.0028"],
     ["MGMT methylated", "M3", "413", "0.79 (0.62–0.99)", "0.043"],
     ["MGMT methylated", "M5", "174", "0.93 (0.62–1.39)", "0.72"],
     ["IDH mutant", "M4", "285", "0.52 (0.22–1.22)", "0.13"],
     ["IDH mutant", "M5", "174", "0.54 (0.18–1.58)", "0.26"]]),

("h2", "3.6. The age effect was strongest in the first year"),
("p", "Cox regression assumes that a variable's effect stays constant over time. Age broke that assumption in the "
      "age-only model (scaled Schoenfeld test, p = 1.5 × 10⁻⁵), which means the single hazard ratio in Table 4 is an "
      "average across the whole follow-up. To see what the average hides, we cut follow-up at 12 months. During the "
      "first year, each extra year of age multiplied the risk of death by 1.047 (95% CI 1.035 to 1.058), based on 593 "
      "patients and 233 deaths. Among the 298 patients who lived past 12 months, the figure was 1.025 (95% CI 1.015 "
      "to 1.034), based on 259 deaths. On the log scale, age mattered about twice as much in the first year as "
      "afterward. The violation also got weaker once KPS entered the model, with p rising from 1.5 × 10⁻⁵ in M1 to "
      "0.011 in M2. Part of what looked like a changing age effect was therefore a performance-status effect that age "
      "had been carrying."),

("h2", "3.7. The age effect held in IDH-wildtype tumors (WHO CNS5)"),
("p", "Of the 285 patients with a known IDH status, 15 (5.3%) carried a mutation in IDH1 or IDH2, which matches "
      "published estimates for TCGA-GBM. IDH-mutant patients were younger, with a median age of 40.0 against 62.0 "
      "years (Mann-Whitney p = 9.5 × 10⁻⁷), and lived longer, with a median survival of 33.6 against 12.9 months "
      "(log-rank p = 0.001), than IDH-wildtype patients (Table 6). When we fitted the age-only model to the 270 "
      "IDH-wildtype patients, the hazard ratio was 1.027 per year (95% CI 1.014 to 1.040; p = 3.0 × 10⁻⁵). The "
      "matching figure on all 285 profiled patients was 1.031. Removing the IDH-mutant tumors therefore lowered the "
      "age effect by about 0.4 percentage points per year and left it well above 1.0. In the IDH-wildtype group, "
      "which is what WHO CNS5 now calls glioblastoma, each extra year of age was associated with a 2.7% higher risk "
      "of death (95% CI 1.4% to 4.0%)."),
("table", "Table 6. IDH status, age and survival among the 285 patients with a known IDH status.",
    ["IDH status", "n", "Deaths", "Median age, years", "Median survival, months", "HR per year of age (95% CI)"],
    [["Mutant", "15", "6", "40.0", "33.6", "—"],
     ["Wildtype", "270", "220", "62.0", "12.9", "1.027 (1.014–1.040)"],
     ["All with known status", "285", "226", "—", "—", "1.031"],
     ["Comparison of the two groups", "", "", "p = 9.5 × 10⁻⁷", "p = 0.001", ""]]),

("h2", "3.8. External validation: the age effect in CGGA"),
("p", "Of the 1,018 CGGA patients, 388 had a WHO grade IV tumor, 225 of those were primary GBM by histology, and 218 "
      "(96.9%) had complete survival and age data (Table 7). The CGGA group was younger than TCGA: median age 54 years "
      "against 59, with only 6% of patients aged 70 or older against 22% in TCGA. It was also more heavily treated in "
      "the modern way: 86% received radiotherapy and 81% received temozolomide. IDH mutations were three times as common "
      "(15.2% against 5.3%). Median survival was 15.5 months, and 63.2% of patients were alive at one year."),
("table", "Table 7. The two cohorts side by side.",
    ["Characteristic", "TCGA-GBM (discovery)", "CGGA (validation)"],
    [["Patients / deaths", "593 / 492 (83.0%)", "218 / 183 (83.9%)"],
     ["Male, %", "61.2", "61.0"],
     ["Age, years: median (middle half); range", "59 (50–68); 10–89", "54 (43–60); 11–79"],
     ["Aged 70 or older, %", "21.6", "6.0"],
     ["Median follow-up, months", "73.8", "69.6"],
     ["Median survival, months", "14.0", "15.5"],
     ["Alive at 1 / 2 / 5 years, %", "58.1 / 23.2 / 6.0", "63.2 / 32.1 / 14.4"],
     ["IDH known; mutant, n (%)", "285; 15 (5.3)", "211; 32 (15.2)"],
     ["MGMT known; methylated, n (%)", "413; 156 (37.8)", "200; 95 (47.5)"],
     ["Radiotherapy / temozolomide recorded", "24 patients only", "211 / 210 patients; 86% / 81% treated"],
     ["Karnofsky score recorded", "439 patients", "not recorded"]]),
("p", "Age predicted survival in CGGA as well. Patients younger than 59 lived a median of 19.2 months and patients aged "
      "59 or older 12.4 months (log-rank χ² = 7.4, p = 0.0064; Figure 6). Median survival fell across the four CGGA "
      "age quartiles from 23.9 months (ages 11–43) to 13.9, 12.7 and 12.4 months (ages 61–79; four-group p = 0.029), "
      "although the three older quartiles sat close together. In the age-only Cox model each extra year multiplied the "
      "hazard by 1.020 (95% CI 1.008–1.032; p = 0.0008), which is 1.22 per decade (95% CI 1.09–1.37). Across the six "
      "nested CGGA models the hazard ratio stayed between 1.015 and 1.022 and every confidence interval excluded 1.0 "
      "(Table 8). Adding treatment made the age estimate slightly larger, not smaller. Temozolomide itself carried a "
      "hazard ratio of 0.42 (95% CI 0.29–0.60), and IDH mutation 0.59 (95% CI 0.38–0.93). Sex and MGMT were not "
      "significant in CGGA."),
("table", "Table 8. Hazard ratio for one extra year of age in the CGGA nested models.",
    ["Model", "Variables", "n", "Deaths", "HR per year (95% CI)", "p", "C-index"],
    [["M1", "age", "218", "183", "1.020 (1.008–1.032)", "0.0008", "0.580"],
     ["M2", "age, sex", "218", "183", "1.020 (1.008–1.032)", "0.0009", "0.578"],
     ["M2t", "age, sex, radiotherapy, temozolomide", "210", "175", "1.022 (1.010–1.035)", "0.0004", "0.618"],
     ["M3", "age, MGMT", "200", "168", "1.018 (1.006–1.031)", "0.0032", "0.563"],
     ["M4", "age, IDH", "211", "179", "1.015 (1.004–1.027)", "0.011", "0.595"],
     ["M5", "age, sex, RT, TMZ, MGMT, IDH", "188", "159", "1.016 (1.003–1.029)", "0.016", "0.628"]]),
("fig", "fig6_cmpkm", "Figure 6. Overall survival by age group (split at 59 years) in the discovery cohort (TCGA, left) and the validation cohort (CGGA, right), with 95% confidence bands."),
("p", "The two secondary patterns from TCGA appeared in CGGA too. The age effect was larger in the first year "
      "(HR 1.028, 95% CI 1.009–1.048) than afterward (1.015, 95% CI 1.000–1.030), even though the formal proportional "
      "hazards test did not reject in this smaller cohort (p = 0.27). And removing IDH-mutant tumors changed almost "
      "nothing: the hazard ratio in the 179 IDH-wildtype patients was 1.018 (95% CI 1.005–1.032; p = 0.005), against "
      "1.019 in all 211 profiled patients. IDH-mutant CGGA patients were, as in TCGA, younger (median 40 against 55 "
      "years, p = 1.2 × 10⁻⁵) and longer-lived (median 28.5 against 13.6 months, p = 0.004)."),

("h2", "3.9. The age effect is real in both cohorts but smaller in CGGA"),
("p", "Direction and significance replicated; magnitude did not fully. The CGGA hazard ratio per year, 1.020, sits "
      "below the TCGA value of 1.034, and on the log scale it is about 60% of its size. Figure 7 and Table 9 compare "
      "the two cohorts for every adjustment set that exists in both. The gap is similar in each set, and the "
      "heterogeneity test gives p between 0.02 and 0.05 for four of the five, and 0.18 for the IDH-adjusted pair. The "
      "pooled model's age × cohort interaction has p = 0.058. Restricting both cohorts to the same age window did not "
      "close the gap: at ages 18–79 the estimates were 1.035 in TCGA and 1.017 in CGGA (p = 0.012), and at 40–79 they "
      "were 1.035 and 1.013 (p = 0.040). Restricting CGGA to temozolomide-treated patients left its estimate at 1.019. A "
      "single model with one common age slope for both cohorts gives HR 1.030 per year (95% CI 1.024–1.036), with CGGA "
      "patients at 0.81 times the TCGA baseline hazard (p = 0.015)."),
("table", "Table 9. The age effect in matched adjustment sets, and whether the two cohorts differ.",
    ["Adjustment set", "TCGA: HR per year (95% CI), n", "CGGA: HR per year (95% CI), n", "Heterogeneity p"],
    [["Age alone", "1.034 (1.027–1.042), 593", "1.020 (1.008–1.032), 218", "0.044"],
     ["+ sex", "1.034 (1.027–1.042), 593", "1.020 (1.008–1.032), 218", "0.043"],
     ["+ MGMT", "1.036 (1.027–1.046), 413", "1.018 (1.006–1.031), 200", "0.021"],
     ["+ IDH", "1.027 (1.015–1.040), 285", "1.015 (1.004–1.027), 211", "0.18"],
     ["+ sex + MGMT + IDH", "1.032 (1.018–1.047), 238", "1.013 (1.001–1.026), 194", "0.045"],
     ["Age alone, both cohorts limited to 18–79 years", "1.035, 564", "1.017, 216", "0.012"],
     ["Age alone, both cohorts limited to 40–79 years", "1.035, 502", "1.013, 181", "0.040"],
     ["Age alone, CGGA temozolomide-treated only", "—", "1.019 (1.006–1.033), 170", "—"],
     ["Pooled, common slope + cohort term", "1.030 (1.024–1.036), 811 patients", "", "interaction p = 0.058"]]),
("fig", "fig7_cmpforest", "Figure 7. Hazard ratio per additional year of age in TCGA (circles) and CGGA (squares) for the adjustment sets available in both cohorts, with the heterogeneity p value for each pair."),

("h2", "3.10. The survival calculator"),
("p", "Figure 8 shows the calculator with the same patient, a 62-year-old man with a Karnofsky score of 80, run "
      "through both cohorts' models. The TCGA model gives a median survival of 13.0 months and a one-year survival of "
      "57%; the CGGA model, which cannot use the Karnofsky score, gives 13.1 months (95% band 12.1–14.6) and 56%. The "
      "two cohorts agree for a typical patient. They disagree where the data are thin: for a 40-year-old woman with an "
      "IDH-mutant tumor, TCGA predicts a median of 49 months with a lower bound of 21 months and no upper bound within "
      "five years, because TCGA has only 15 IDH-mutant patients, while CGGA, with 32, predicts 28 months (19.5–52). The "
      "tool shows the sample size behind every prediction for exactly that reason. It is one 70-kilobyte file that runs offline in any browser; the source and the model files are in the "
      "repository (Appendix D)."),
("fig", "fig8_app", "Figure 8. The survival calculator: the two cohort summaries at the top, patient inputs on the left, and the predicted curve with its 95% band, the cohort-average curve, the other cohort's prediction, a readable table and the fitted equation on the right."),

("h1", "4. Discussion"),
("h2", "4.1. Main findings"),
("p", "Age at diagnosis was associated with survival in every analysis we ran. The younger half of the group lived "
      "seven months longer at the median than the older half. Survival fell step by step across age quartiles. The "
      "risk of death per extra year of age stayed between 1.027 and 1.037 whatever we corrected for. The effect was "
      "concentrated in the first year after diagnosis, and it survived the removal of IDH-mutant tumors. In the "
      "independent CGGA cohort every one of those statements held again, with one qualification: the effect per year "
      "was smaller, 1.020 rather than 1.034, and that difference sits at the edge of statistical significance."),
("h2", "4.2. What the results mean"),
("p", "Three things about the result are worth discussing. The first is how stable it is. The five models differ both "
      "in which variables they contain and in which patients they cover, from 593 patients down to 174, and the age "
      "estimate moves by less than one percentage point. Sex, KPS, MGMT and IDH status together explain very little "
      "of the age effect. Age must therefore act on survival mostly through routes that these four variables do not "
      "capture. Possible routes include tumor biology that changes with age, such as fewer proneural and G-CIMP "
      "tumors and more EGFR and chromosome 7/10 changes in older patients, lower tolerance of radiotherapy and "
      "chemotherapy, less aggressive surgery in older patients, and other illnesses. Our data cannot separate these "
      "explanations, and we make no claim about cause. What we found is an association between recorded age and "
      "recorded survival."),
("p", "The second is the change over time. Age mattered about twice as much during the first year as it did "
      "afterward. One reading is that early deaths are driven by the patient's ability to tolerate treatment and by "
      "general decline, both of which follow age closely, while later deaths are driven by the tumor coming back, "
      "which follows age less closely. The fact that the assumption violation weakened once KPS entered the model "
      "supports this reading. Part of what looked like a changing age effect was a performance-status effect that age "
      "had been standing in for. Patients who survive the first year are a selected group, and within that group age "
      "still matters, just less."),
("p", "The third is the IDH result. The worry raised by WHO CNS5 was that IDH-mutant tumors, being both younger and "
      "longer-surviving, might be producing the age effect by themselves. They are not. They account for roughly 0.4 "
      "percentage points of risk per year, a small share of the 2.7% to 3.1% seen in the profiled subgroup. The age "
      "gradient belongs to IDH-wildtype glioblastoma as it is defined today."),
("p", "The fourth is the size difference between cohorts, which is the most interesting thing the validation produced. "
      "The obvious explanations do not work. CGGA patients are younger, but restricting TCGA to CGGA's age range "
      "leaves the TCGA estimate untouched, so the difference is not a matter of TCGA having more very old patients. "
      "CGGA patients were treated more uniformly with temozolomide, but the estimate among temozolomide-treated CGGA "
      "patients is the same as in the whole cohort. CGGA has three times the share of IDH-mutant tumors, but the "
      "IDH-wildtype estimates differ by the same margin as the overall ones. What remains are explanations we cannot "
      "test with these data: differences between the populations themselves, differences in how age shaped treatment "
      "decisions in Beijing between roughly 2006 and 2017 compared with the United States between 1989 and 2013, and "
      "chance, since the interaction p value of 0.058 is close enough to the threshold that a somewhat larger CGGA "
      "cohort could move it either way. We report the gap rather than explain it away."),
("h2", "4.3. Comparison with other studies"),
("p", "Both the direction and the size of the effect agree with the trial literature. The RTOG analysis put its first "
      "split at 50 years [@curran1993], and in our data the youngest quartile, which ends at 50, stood apart from the "
      "rest with a median survival of 21.9 months against 7.6 months in the oldest quartile. The EORTC/NCIC nomograms "
      "treat age as a continuous predictor whose effect grows steadily [@gorlia2008], which is what our quartile "
      "analysis shows. Median survival in our oldest quartile (7.6 months, ages 69 to 89) is lower than the 9.3 "
      "months reached with short-course radiotherapy plus temozolomide in the CE.6 trial [@perry2017]. That is what "
      "we would expect from an unselected group in which many patients were treated before temozolomide became "
      "standard. The median of 14.0 months for the whole group sits close to the 14.6 months of the temozolomide arm "
      "in the original trial [@stupp2005]."),
("p", "The results for the other variables also match published work. The extra risk in men, about 1.2 to 1.3, "
      "agrees with registry data [@ostrom2018]. Our MGMT hazard ratio of 0.70 is weaker than the effect seen in the "
      "EORTC/NCIC trial [@hegi2005], and there are two reasons to expect that. Our array-based classification agreed "
      "with an independent annotation for only three quarters of patients, and misclassification pulls an estimate "
      "toward no effect. On top of that, many patients in this group were treated before temozolomide became "
      "standard, so the part of the MGMT effect that depends on that drug is diluted. Our IDH-mutant share of 5.3%, "
      "and the age and survival differences between the IDH groups, match the first description of IDH mutations in "
      "glioma [@yan2009]. The CGGA findings fit what its authors reported for the resource as a whole: a younger "
      "population than Western series, a higher share of IDH-mutant tumors, and a strong temozolomide effect "
      "[@zhao2021]. We did not find a published head-to-head comparison of the age effect between CGGA and TCGA "
      "glioblastoma, so we cannot say whether the smaller CGGA estimate is typical of Chinese series or particular to "
      "this cohort."),
("h2", "4.4. Why this matters"),
("p", "For anyone analyzing TCGA-GBM, the result sets a benchmark. A hazard ratio of 1.40 per decade means that the "
      "18-year spread of the middle half of our patients corresponds to a hazard ratio of about 1.8, and the 33-year "
      "gap between the median ages of the youngest and oldest quartiles to a hazard ratio near 3. Any molecular "
      "variable proposed as a predictor in this dataset should be shown to add something beyond age. Any variable "
      "that correlates with age, as IDH status, G-CIMP and the proneural subtype all do, should be interpreted with "
      "age in the model. For the planned analysis of cellular-state signatures in the same dataset, age, sex and KPS "
      "are now fixed as the minimum set of corrections, and the time-split result suggests that the first year and "
      "the later follow-up may need separate models. The validation adds a practical rule: an effect size taken from "
      "TCGA should not be assumed to transfer to another population without checking, because even the best-established "
      "prognostic factor in the disease came out a third smaller in the second cohort."),

("h1", "5. Limitations"),
("num", [
    "IDH profiling was incomplete. Mutation calls exist for 290 of the 619 samples, so the sensitivity analysis covers 285 patients, or 48% of the group. We cannot rule out that the profiled and unprofiled patients differ in ways we did not see. Supplementary Table S1 of Brennan and colleagues [@brennan2013] would extend the coverage and is the obvious next step.",
    "We derived MGMT status by splitting array beta values with a Gaussian mixture on each platform. The two platforms use different probes and share only five samples. Our calls agreed with the independent GlioVis annotation for 75.4% of 346 shared patients, so some patients are misclassified, which pulls the MGMT estimate toward no effect. This does not affect the age estimate, because MGMT is not strongly linked to age in this group.",
    "How much of the tumor the surgeon removed is not in the TCGA-GBM clinical export, so we could not include it. It is a known predictor of survival and it correlates with age.",
    "Treatment varied between patients and is mostly not recorded. Diagnoses span 1989 to 2013, before and after temozolomide became standard, and only 24 patients have a recorded radiotherapy field. Our survival figures therefore describe a mixed-era group rather than patients treated the way they would be today.",
    "KPS was missing for 154 patients (26%), and MGMT and IDH were missing for larger shares. The nested models reduce this problem by showing that the estimate is stable across subgroups, but each subgroup may still differ from the whole group in ways we cannot observe.",
    "Age breaks the proportional hazards assumption, so the single hazard ratios in Table 4 are averages over the whole follow-up. Our split at 12 months describes this, but a model with a coefficient that changes over time would measure it more precisely.",
    "The validation cohort is smaller (218 patients), comes from a single country and treatment system, has no Karnofsky score, and contains a higher share of IDH-mutant tumors than a WHO CNS5 glioblastoma series would. Its confidence intervals are correspondingly wider, and the cohort difference we report (interaction p = 0.058) needs a third cohort to settle.",
    "The study is observational in both cohorts, so none of these associations proves that age causes shorter survival. The calculator inherits every limitation of the data it was fitted on and is an educational tool, not a clinical one.",
]),

("h1", "6. Conclusion"),
("num", [
    "We built a patient-level dataset of 593 TCGA-GBM patients with 492 deaths from the cBioPortal export, reading the survival status string as a censoring indicator. Missing data cost us 2.1% of the patients.",
    "Patients younger than the median age of 59 years lived a median of 17.7 months, against 10.7 months for older patients (log-rank p = 2.5 × 10⁻¹³). Our hypothesis that younger patients live longer is supported.",
    "The effect grew with age: median survival fell step by step across the four age quartiles, from 21.9 to 7.6 months (p = 5.4 × 10⁻²¹).",
    "Each extra year of age raised the risk of death by between 2.7% and 3.7% across five nested Cox models, and every confidence interval excluded 1.0 (fully corrected HR 1.032, 95% CI 1.014 to 1.051). The effect was strongest in the first year after diagnosis (HR 1.047) and about half as strong on the log scale afterward (HR 1.025).",
    "In IDH-wildtype tumors, the group that WHO CNS5 now calls glioblastoma, the age effect remained (HR 1.027 per year, 95% CI 1.014 to 1.040). Including IDH-mutant tumors makes the effect look slightly larger, but it does not create it.",
    "In an independent cohort of 218 primary glioblastoma patients from CGGA, age again predicted survival (HR 1.020 per year, 95% CI 1.008 to 1.032), again more strongly in the first year, and again independently of IDH status. The effect was smaller than in TCGA (interaction p = 0.058), and neither age range nor treatment explained the difference.",
    "The fitted models from both cohorts are released as a single-file survival calculator that shows the sample size, C-index and equation behind every prediction.",
]),
("h2", "Future directions"),
("p", "The next stage of this project scores the four Neftel cellular-state signatures on the bulk expression profiles "
      "of the same patients and asks whether their relative levels are linked to survival. The present results fix "
      "the corrections that analysis will need, which are age, sex and KPS at a minimum, and show that the "
      "proportional hazards assumption has to be tested from the start. Three extensions of the age analysis itself "
      "are worth doing. A third cohort with recorded treatment and Karnofsky score, such as a recent European hospital "
      "series, would settle whether the smaller CGGA effect is a population difference or chance. A coefficient for age "
      "that changes continuously with time would replace the fixed cut at 12 months. And a head-to-head comparison of "
      "Cox regression with random survival forests and gradient-boosted survival models on these same 811 patients "
      "would show whether machine learning adds anything over the model used here, which we doubt at this sample size."),
]

APPENDICES = [
("h1", "Appendices"),
("h2", "Appendix A. Full results of the nested Cox models"),
("table", "Table A1. Every variable in models M1 to M5, with hazard ratios and 95% confidence intervals. The last column is the scaled Schoenfeld test for that variable, where a small p value means the variable's effect changes over time.",
    ["Model (n, deaths)", "Variable", "HR", "95% CI", "p", "PH test p"],
    [["M1 (593, 492)", "Age, per year", "1.034", "1.027–1.042", "4.4 × 10⁻²¹", "1.5 × 10⁻⁵"],
     ["M2 (439, 359)", "Age, per year", "1.028", "1.019–1.037", "2.3 × 10⁻¹⁰", "0.011"],
     ["", "Male sex", "1.330", "1.067–1.658", "0.011", "0.11"],
     ["", "KPS, per 10 points", "0.808", "0.749–0.872", "< 0.0001", "0.22"],
     ["M3 (413, 316)", "Age, per year", "1.036", "1.027–1.046", "2.0 × 10⁻¹⁵", "0.0007"],
     ["", "MGMT methylated", "0.786", "0.623–0.992", "0.043", "0.50"],
     ["M4 (285, 226)", "Age, per year", "1.027", "1.015–1.040", "1.5 × 10⁻⁵", "0.0076"],
     ["", "IDH mutant", "0.518", "0.221–1.216", "0.13", "0.11"],
     ["M5 (174, 127)", "Age, per year", "1.032", "1.014–1.051", "4.3 × 10⁻⁴", "0.0035"],
     ["", "Male sex", "1.868", "1.265–2.758", "0.0017", "0.14"],
     ["", "KPS, per 10 points", "0.850", "0.756–0.955", "0.0063", "0.96"],
     ["", "IDH mutant", "0.537", "0.182–1.580", "0.26", "0.64"],
     ["", "MGMT methylated", "0.930", "0.624–1.388", "0.72", "0.98"]]),
("table", "Table A2. Age-only Cox models fitted separately to the first year and to the time after it.",
    ["Period", "n", "Deaths", "HR per year of age", "95% CI"],
    [["First 12 months (follow-up cut at 12)", "593", "233", "1.047", "1.035–1.058"],
     ["After 12 months (time reset at 12)", "298", "259", "1.025", "1.015–1.034"]]),
("table", "Table A3. Every variable in the CGGA nested models. PH test p is the scaled Schoenfeld test for that variable.",
    ["Model (n, deaths)", "Variable", "HR", "95% CI", "p", "PH test p"],
    [["M1 (218, 183)", "Age, per year", "1.020", "1.008–1.032", "0.0008", "0.27"],
     ["M2 (218, 183)", "Age, per year", "1.020", "1.008–1.032", "0.0009", "0.25"],
     ["", "Male sex", "1.088", "0.804–1.473", "0.58", "0.28"],
     ["M2t (210, 175)", "Age, per year", "1.022", "1.010–1.035", "0.0004", "0.074"],
     ["", "Male sex", "1.082", "0.791–1.481", "0.62", "0.90"],
     ["", "Radiotherapy", "0.873", "0.551–1.382", "0.56", "0.0015"],
     ["", "Temozolomide", "0.415", "0.287–0.601", "< 0.0001", "0.60"],
     ["M3 (200, 168)", "Age, per year", "1.018", "1.006–1.031", "0.0032", "0.72"],
     ["", "MGMT methylated", "0.858", "0.631–1.167", "0.33", "0.37"],
     ["M4 (211, 179)", "Age, per year", "1.015", "1.004–1.027", "0.011", "0.44"],
     ["", "IDH mutant", "0.591", "0.376–0.927", "0.022", "0.37"],
     ["M5 (188, 159)", "Age, per year", "1.016", "1.003–1.029", "0.016", "0.36"],
     ["", "Male sex", "1.106", "0.786–1.558", "0.56", "0.68"],
     ["", "Radiotherapy", "0.786", "0.484–1.276", "0.33", "0.0025"],
     ["", "Temozolomide", "0.381", "0.257–0.565", "< 0.0001", "0.95"],
     ["", "MGMT methylated", "0.896", "0.641–1.253", "0.52", "0.79"],
     ["", "IDH mutant", "0.462", "0.286–0.747", "0.0016", "0.44"]]),
("table", "Table A4. CGGA cohort construction.",
    ["Step", "Patients"],
    [["mRNAseq_693 + mRNAseq_325 clinical tables", "1,018"],
     ["WHO grade IV", "388"],
     ["Histology GBM (excludes 133 rGBM and 30 sGBM)", "225"],
     ["Primary tumor", "225"],
     ["Survival time, status and age present, time > 0 (7 lacked survival data)", "218"]]),
("h2", "Appendix B. Input files and the variables we derived from them"),
("table", "Table B1. Which file each variable came from.",
    ["File (cBioPortal, gbm_tcga)", "Fields used", "Variable we built"],
    [["clinical.tsv (TCGA)", "Patient ID, Diagnosis Age, Overall Survival (Months), Overall Survival Status, Sex, Karnofsky Performance Score", "AGE, OS_MONTHS, event (the number in front of the status string), male, kps10"],
     ["CGGA.mRNAseq_693_clinical, CGGA.mRNAseq_325_clinical", "CGGA_ID, PRS_type, Histology, Grade, Gender, Age, OS (days), Censor, Radio_status, Chemo_status, IDH_mutation_status, MGMTp_methylation_status", "AGE, OS_MONTHS (= OS / 30.4375), event, male, radio, chemo, idh_mut, mgmt_meth"],
     ["mutations.txt", "SAMPLE_ID, IDH1, IDH2", "idh_mut (1 if either gene is mutated, 0 if both are normal, missing if both are not profiled)"],
     ["methylation_hm27.txt, methylation_hm450.txt", "SAMPLE_ID, MGMT (beta value)", "beta (the higher of the two platforms), mgmt_meth (Gaussian mixture per platform, upper component = 1)"]]),
("h2", "Appendix C. Code and reproducibility"),
("p", "The analysis script run.py, the list of required libraries (pandas, numpy, matplotlib, lifelines, "
      "scikit-learn) and the final data table gbm_cohort_final.csv are attached to this paper. To reproduce the "
      "results, put the three cBioPortal exports in a data/ folder next to the script and run python3 run.py. The "
      "script checks that the study identifier is gbm_tcga, prints every number reported in Sections 3.1 to 3.7, and "
      "writes the figures and nested_models.csv into a figures/ folder. The validation and the calculator have their own "
      "scripts: validate_cgga.py repeats every analysis on the CGGA tables and prints each number in Section 3.8; "
      "compare_cohorts.py produces Table 9, Figures 6 and 7 and the heterogeneity tests; export_models.py fits the model "
      "ladder for a cohort and writes it as JSON; build_app.py inlines the JSON into the calculator page. "
      "[ Repository link ]"),
("h2", "Appendix D. The survival calculator"),
("p", "The calculator is the file app/index.html in the repository. It needs no installation: open it in a browser, or "
      "host it on any static web server such as GitHub Pages. It embeds 24 Cox models (16 fitted on TCGA, 8 on CGGA), "
      "each stored as its coefficients, covariance matrix, covariate means and baseline survival on a half-month grid, "
      "together with the cohort comparison from Table 9. For the inputs the user provides, it selects the model fitted "
      "with exactly those variables, computes the linear predictor relative to the cohort mean, raises the baseline "
      "survival to exp of that value, and draws a 95% band from the covariance of the coefficients. The page reports the "
      "model's sample size, number of deaths, C-index and the fitted equation next to every prediction, offers the other "
      "cohort's prediction as an overlay, and gives the same numbers as a table for readers who cannot use the chart. "
      "Its predictions were checked against lifelines and agree to three decimal places."),
]

REFS = {
"cbtrus": "Ostrom QT, Price M, Neff C, Cioffi G, Waite KA, Kruchko C, Barnholtz-Sloan JS. CBTRUS Statistical Report: Primary Brain and Other Central Nervous System Tumors Diagnosed in the United States in 2017–2021. Neuro Oncol. 2024;26(Suppl 5):iv1–iv85. doi:10.1093/neuonc/noae145",
"globocan": "Bray F, Laversanne M, Sung H, Ferlay J, Siegel RL, Soerjomataram I, Jemal A. Global cancer statistics 2022: GLOBOCAN estimates of incidence and mortality worldwide for 36 cancers in 185 countries. CA Cancer J Clin. 2024;74(3):229–63. doi:10.3322/caac.21834",
"stupp2005": "Stupp R, Mason WP, van den Bent MJ, Weller M, Fisher B, Taphoorn MJB, et al. Radiotherapy plus concomitant and adjuvant temozolomide for glioblastoma. N Engl J Med. 2005;352(10):987–96. doi:10.1056/NEJMoa043330",
"stupp2009": "Stupp R, Hegi ME, Mason WP, van den Bent MJ, Taphoorn MJB, Janzer RC, et al. Effects of radiotherapy with concomitant and adjuvant temozolomide versus radiotherapy alone on survival in glioblastoma in a randomised phase III study: 5-year analysis of the EORTC-NCIC trial. Lancet Oncol. 2009;10(5):459–66. doi:10.1016/S1470-2045(09)70025-7",
"tcga2008": "Cancer Genome Atlas Research Network. Comprehensive genomic characterization defines human glioblastoma genes and core pathways. Nature. 2008;455(7216):1061–8. doi:10.1038/nature07385",
"brennan2013": "Brennan CW, Verhaak RGW, McKenna A, Campos B, Noushmehr H, Salama SR, et al. The somatic genomic landscape of glioblastoma. Cell. 2013;155(2):462–77. doi:10.1016/j.cell.2013.09.034",
"yan2009": "Yan H, Parsons DW, Jin G, McLendon R, Rasheed BA, Yuan W, et al. IDH1 and IDH2 mutations in gliomas. N Engl J Med. 2009;360(8):765–73. doi:10.1056/NEJMoa0808710",
"noushmehr2010": "Noushmehr H, Weisenberger DJ, Diefes K, Phillips HS, Pujara K, Berman BP, et al. Identification of a CpG island methylator phenotype that defines a distinct subgroup of glioma. Cancer Cell. 2010;17(5):510–22. doi:10.1016/j.ccr.2010.03.017",
"hegi2005": "Hegi ME, Diserens AC, Gorlia T, Hamou MF, de Tribolet N, Weller M, et al. MGMT gene silencing and benefit from temozolomide in glioblastoma. N Engl J Med. 2005;352(10):997–1003. doi:10.1056/NEJMoa043331",
"louis2021": "Louis DN, Perry A, Wesseling P, Brat DJ, Cree IA, Figarella-Branger D, et al. The 2021 WHO Classification of Tumors of the Central Nervous System: a summary. Neuro Oncol. 2021;23(8):1231–51. doi:10.1093/neuonc/noab106",
"eisenbarth2023": "Eisenbarth D, Wang YA. Glioblastoma heterogeneity at single cell resolution. Oncogene. 2023;42(27):2155–65. doi:10.1038/s41388-023-02738-y",
"yabo2024": "Yabo YA, Heiland DH. Understanding glioblastoma at the single-cell level: recent advances and future challenges. PLoS Biol. 2024;22(5):e3002640. doi:10.1371/journal.pbio.3002640",
"parker2016": "Parker NR, Hudson AL, Khong P, Parkinson JF, Dwight T, Ikin RJ, et al. Intratumoral heterogeneity identified at the epigenetic, genetic and transcriptional level in glioblastoma. Sci Rep. 2016;6:22477. doi:10.1038/srep22477",
"qazi2017": "Qazi MA, Vora P, Venugopal C, Sidhu SS, Moffat J, Swanton C, Singh SK. Intratumoral heterogeneity: pathways to treatment resistance and relapse in human glioblastoma. Ann Oncol. 2017;28(7):1448–56. doi:10.1093/annonc/mdx169",
"akgul2019": "Akgül S, Patch AM, D'Souza RCJ, Mukhopadhyay P, Nones K, Kempe S, et al. Intratumoural heterogeneity underlies distinct therapy responses and treatment resistance in glioblastoma. Cancers (Basel). 2019;11(2):190. doi:10.3390/cancers11020190",
"wang2022": "Wang L, Jung J, Babikir H, Shamardani K, Jain S, Feng X, et al. A single-cell atlas of glioblastoma evolution under therapy reveals cell-intrinsic and cell-extrinsic therapeutic targets. Nat Cancer. 2022;3(12):1534–52. doi:10.1038/s43018-022-00475-x",
"bhat2013": "Bhat KPL, Balasubramaniyan V, Vaillant B, Ezhilarasan R, Hummelink K, Hollingsworth F, et al. Mesenchymal differentiation mediated by NF-κB promotes radiation resistance in glioblastoma. Cancer Cell. 2013;24(3):331–46. doi:10.1016/j.ccr.2013.08.001",
"otani2025": "Otani R, et al. 10057-MPC-2 Intratumoral heterogeneity correlates with prognosis in glioblastoma. Neurooncol Adv. 2025;7(Suppl 6):vdaf236.071. doi:10.1093/noajnl/vdaf236.071",
"verhaak2010": "Verhaak RGW, Hoadley KA, Purdom E, Wang V, Qi Y, Wilkerson MD, et al. Integrated genomic analysis identifies clinically relevant subtypes of glioblastoma characterized by abnormalities in PDGFRA, IDH1, EGFR, and NF1. Cancer Cell. 2010;17(1):98–110. doi:10.1016/j.ccr.2009.12.020",
"wangq2017": "Wang Q, Hu B, Hu X, Kim H, Squatrito M, Scarpace L, et al. Tumor evolution of glioma-intrinsic gene expression subtypes associates with immunological changes in the microenvironment. Cancer Cell. 2017;32(1):42–56.e6. doi:10.1016/j.ccell.2017.06.003",
"patel2014": "Patel AP, Tirosh I, Trombetta JJ, Shalek AK, Gillespie SM, Wakimoto H, et al. Single-cell RNA-seq highlights intratumoral heterogeneity in primary glioblastoma. Science. 2014;344(6190):1396–401. doi:10.1126/science.1254257",
"neftel2019": "Neftel C, Laffy J, Filbin MG, Hara T, Shore ME, Rahme GJ, et al. An integrative model of cellular states, plasticity, and genetics for glioblastoma. Cell. 2019;178(4):835–849.e21. doi:10.1016/j.cell.2019.06.024",
"curran1993": "Curran WJ Jr, Scott CB, Horton J, Nelson JS, Weinstein AS, Fischbach AJ, et al. Recursive partitioning analysis of prognostic factors in three Radiation Therapy Oncology Group malignant glioma trials. J Natl Cancer Inst. 1993;85(9):704–10. doi:10.1093/jnci/85.9.704",
"gorlia2008": "Gorlia T, van den Bent MJ, Hegi ME, Mirimanoff RO, Weller M, Cairncross JG, et al. Nomograms for predicting survival of patients with newly diagnosed glioblastoma: prognostic factor analysis of EORTC and NCIC trial 26981-22981/CE.3. Lancet Oncol. 2008;9(1):29–38. doi:10.1016/S1470-2045(07)70384-4",
"malmstrom2012": "Malmström A, Grønberg BH, Marosi C, Stupp R, Frappaz D, Schultz H, et al. Temozolomide versus standard 6-week radiotherapy versus hypofractionated radiotherapy in patients older than 60 years with glioblastoma: the Nordic randomised, phase 3 trial. Lancet Oncol. 2012;13(9):916–26. doi:10.1016/S1470-2045(12)70265-6",
"wick2012": "Wick W, Platten M, Meisner C, Felsberg J, Tabatabai G, Simon M, et al. Temozolomide chemotherapy alone versus radiotherapy alone for malignant astrocytoma in the elderly: the NOA-08 randomised, phase 3 trial. Lancet Oncol. 2012;13(7):707–15. doi:10.1016/S1470-2045(12)70164-X",
"perry2017": "Perry JR, Laperriere N, O'Callaghan CJ, Brandes AA, Menten J, Phillips C, et al. Short-course radiation plus temozolomide in elderly patients with glioblastoma. N Engl J Med. 2017;376(11):1027–37. doi:10.1056/NEJMoa1611977",
"ostrom2018": "Ostrom QT, Rubin JB, Lathia JD, Berens ME, Barnholtz-Sloan JS. Females have the survival advantage in glioblastoma. Neuro Oncol. 2018;20(4):576–7. doi:10.1093/neuonc/noy002",
"cerami2012": "Cerami E, Gao J, Dogrusoz U, Gross BE, Sumer SO, Aksoy BA, et al. The cBio Cancer Genomics Portal: an open platform for exploring multidimensional cancer genomics data. Cancer Discov. 2012;2(5):401–4. doi:10.1158/2159-8290.CD-12-0095",
"gao2013": "Gao J, Aksoy BA, Dogrusoz U, Dresdner G, Gross B, Sumer SO, et al. Integrative analysis of complex cancer genomics and clinical profiles using the cBioPortal. Sci Signal. 2013;6(269):pl1. doi:10.1126/scisignal.2004088",
"km1958": "Kaplan EL, Meier P. Nonparametric estimation from incomplete observations. J Am Stat Assoc. 1958;53(282):457–81. doi:10.1080/01621459.1958.10501452",
"cox1972": "Cox DR. Regression models and life-tables. J R Stat Soc Ser B. 1972;34(2):187–220.",
"gliovis": "Bowman RL, Wang Q, Carro A, Verhaak RGW, Squatrito M. GlioVis data portal for visualization and analysis of brain tumor expression datasets. Neuro Oncol. 2017;19(1):139–41. doi:10.1093/neuonc/now247",
"bady2012": "Bady P, Sciuscio D, Diserens AC, Bloch J, van den Bent MJ, Marosi C, et al. MGMT methylation analysis of glioblastoma on the Infinium methylation BeadChip identifies two distinct CpG regions associated with gene silencing and outcome, yielding a prediction model for comparisons across datasets, tumor grades, and CIMP-status. Acta Neuropathol. 2012;124(4):547–60. doi:10.1007/s00401-012-1016-2",
"royston2006": "Royston P, Altman DG, Sauerbrei W. Dichotomizing continuous predictors in multiple regression: a bad idea. Stat Med. 2006;25(1):127–41. doi:10.1002/sim.2331",
"schoenfeld1982": "Schoenfeld D. Partial residuals for the proportional hazards regression model. Biometrika. 1982;69(1):239–41. doi:10.1093/biomet/69.1.239",
"grambsch1994": "Grambsch PM, Therneau TM. Proportional hazards tests and diagnostics based on weighted residuals. Biometrika. 1994;81(3):515–26. doi:10.1093/biomet/81.3.515",
"lifelines": "Davidson-Pilon C. lifelines: survival analysis in Python. J Open Source Softw. 2019;4(40):1317. doi:10.21105/joss.01317",
"zhao2021": "Zhao Z, Zhang KN, Wang Q, Li G, Zeng F, Zhang Y, et al. Chinese Glioma Genome Atlas (CGGA): a comprehensive resource with functional genomic data from Chinese glioma patients. Genomics Proteomics Bioinformatics. 2021;19(1):1–12. doi:10.1016/j.gpb.2020.10.005",
"royston2013": "Royston P, Altman DG. External validation of a Cox prognostic model: principles and methods. BMC Med Res Methodol. 2013;13:33. doi:10.1186/1471-2288-13-33",
}

LABELS = dict(abstract="Abstract", keywords="Keywords", references="References", toc="Table of Contents",
              toc_note="[ Update this table in Word: References → Table of Contents → Update Table ]")
