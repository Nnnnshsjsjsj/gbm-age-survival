# -*- coding: utf-8 -*-
# English manuscript, plain-language version. Citation tokens: [@key] or [@key1;@key2].

TITLE = "Intratumoral Heterogeneity, Age at Diagnosis and Overall Survival in Glioblastoma: An Analysis of TCGA Data with External Validation in CGGA"
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
    "p = 0.058), and neither age range nor treatment explained the gap. We then asked whether intratumoral heterogeneity "
    "could explain the age effect. We scored each tumor in two ways: a cell-state entropy from the four Neftel "
    "transcriptional states, computed from bulk expression in 437 TCGA and 218 CGGA tumors, and the MATH score, "
    "computed from the allele fractions of somatic mutations in 375 TCGA tumors. Neither score rose with age. Entropy "
    "was unrelated to age in both cohorts (Spearman ρ = 0.04 and 0.07), and MATH was slightly lower in older patients "
    "(ρ = −0.18). Neither score predicted survival on its own, and adding either to the model left the age hazard "
    "ratio unchanged (1.032 with entropy, 1.037 with MATH). Finally, we pooled the age effect across 13 cohorts and "
    "about 40,800 patients: our four individual-patient cohorts (TCGA, CGGA, MSK-IMPACT and CPTAC) and nine published "
    "series. The random-effects hazard ratio was 1.028 per year (95% CI 1.024–1.033; prediction interval 1.012–1.045), "
    "every cohort pointed the same way, and a cohort's median age did not explain its estimate. Age is a strong, "
    "reproducible and largely independent predictor of survival in glioblastoma, and bulk measures of intratumoral "
    "heterogeneity do not account for it. The analysis code, the harmonized cohorts and a browser-based platform that "
    "lets other researchers compare their own cohort with these are released openly."
)
KEYWORDS = "glioblastoma, age at diagnosis, overall survival, intratumoral heterogeneity, cellular states, MATH score, Cox regression, meta-analysis, TCGA, CGGA"

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
("p", "Heterogeneity can be measured in a bulk tumor sample in two broad ways. At the DNA level, the mutant-allele "
      "tumor heterogeneity (MATH) score summarizes how widely the allele fractions of a tumor's somatic mutations are "
      "spread: a tumor made of one clone has similar fractions for all its mutations, while a tumor made of several "
      "subclones has a wide spread [@mroz2013]. At the RNA level, the four cellular states described by Neftel and "
      "colleagues can be scored in a bulk expression profile, which gives a rough estimate of how the states are mixed "
      "in that tumor [@neftel2019]. Both approaches are proxies. Neither sees individual cells. But both can be applied "
      "to hundreds of tumors with survival data, which single-cell studies cannot."),
("p", "This paper measures heterogeneity in both ways and asks a specific question about it. Age multiplies the risk "
      "of death by about 1.4 per decade. If older tumors were more heterogeneous, heterogeneity could be part of the "
      "reason, and any molecular score that correlates with age would look predictive for the wrong reason unless age "
      "is in the model. So we first establish the age effect carefully, then test whether heterogeneity tracks age, "
      "predicts survival, or changes the age estimate when the two are modeled together."),

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
      "has only been shown in one dataset is a hypothesis, not a finding [@royston2013]. Two further questions follow "
      "from the heterogeneity literature. Is intratumoral heterogeneity, measured in bulk tumors, related to age, and "
      "does it explain any part of the age effect? And how much does the age effect vary between cohorts, once more "
      "than two are compared?"),
("h3", "Aim"),
("p", "To measure the association between age at diagnosis and overall survival in the TCGA-GBM dataset, to test "
      "whether that association is independent of sex, Karnofsky performance score, MGMT promoter methylation, IDH "
      "mutation status and two measures of intratumoral heterogeneity, to check whether it replicates in the "
      "independent CGGA cohort, and to place it among the estimates from other cohorts."),
("h3", "Objectives"),
("num", [
    "To build a patient-level dataset from the cBioPortal gbm_tcga export, reading the survival status string correctly as a censoring indicator.",
    "To describe how age at diagnosis is distributed, and to compare survival between patients below the median age and patients at or above it.",
    "To test whether the effect grows with age by comparing survival across age quartiles.",
    "To estimate how much each extra year of age multiplies the risk of death, using a series of Cox models with more and more corrections, and to check whether the models' main assumption holds.",
    "To repeat the estimate in IDH-wildtype tumors only, matching the WHO CNS5 definition of glioblastoma.",
    "To validate the age effect externally by repeating the analysis in primary glioblastoma patients from CGGA and testing whether the two cohorts' estimates differ.",
    "To score intratumoral heterogeneity in each tumor in two ways, a cell-state entropy from bulk expression and the MATH score from mutation allele fractions, and to test whether either is related to age, predicts survival, or changes the age estimate.",
    "To pool the age effect across our cohorts and published series in a random-effects meta-analysis, and to test whether cohort characteristics explain the differences between estimates.",
    "To release the analysis code, the harmonized cohorts and a browser-based platform in which other researchers can analyze their own cohort and compare it with these, without their patient data leaving their computer.",
]),
("h3", "Hypotheses"),
("p", "Primary: patients younger than the median age of the group live longer than older patients, and each extra "
      "year of age raises the risk of death even after correction for sex, performance status, MGMT status and IDH "
      "status. The hypothesis is wrong if the corrected confidence interval for the hazard ratio includes 1.0. "
      "Secondary: intratumoral heterogeneity is higher in older patients and accounts for part of the age effect, so "
      "that the age hazard ratio falls when a heterogeneity score enters the model. This hypothesis is wrong if the "
      "scores do not correlate with age and the age estimate does not move."),
("h3", "Novelty"),
("p", "The link between age and survival in glioblastoma is not new. This study adds five things. It uses nested "
      "models, which separate the effect of correcting for a variable from the effect of losing patients. It splits "
      "follow-up time to show how the age effect changes after the first year, and gives a separate estimate for "
      "IDH-wildtype tumors. It repeats the whole analysis in an independent cohort and tests formally whether the two "
      "estimates agree, which most TCGA-based prognostic papers skip. It tests, for the first time to our knowledge in "
      "these datasets, whether bulk measures of intratumoral heterogeneity explain the age effect. And it pools the age "
      "effect across 13 cohorts, which turns a two-cohort disagreement into a distribution of estimates with a "
      "prediction interval."),

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
      "zero at 12 months. Because M2 adds sex and KPS at the same time, we also fitted the two variables separately on "
      "the same 439 patients, so that any change in the age estimate can be attributed to one of them (Appendix A, "
      "Table A5). Two patients carry a Karnofsky score of 0, which by definition means dead at assessment and cannot "
      "be a pre-treatment score; we report M2 with and without them."),
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
("h2", "2.9. Heterogeneity scores"),
("p", "We scored intratumoral heterogeneity in each tumor in two independent ways, one from RNA and one from DNA. "
      "Both use data that TCGA and CGGA already hold for the same patients, so no new samples were needed."),
("p", "The cell-state entropy comes from the four transcriptional states that Neftel and colleagues found in "
      "single-cell data and then scored in 401 bulk TCGA tumors [@neftel2019]. We used their published gene lists, "
      "merging MES1 with MES2 and NPC1 with NPC2, which gives four modules of 95, 39, 50 and 89 genes for the "
      "mesenchymal-like, astrocyte-like, oligodendrocyte-progenitor-like and neural-progenitor-like states. For TCGA we "
      "used the Agilent expression array, the same platform Neftel scored, which covers 399 patients of our cohort, and "
      "filled in 38 more from the RNA-sequencing data; on the 120 tumors measured on both platforms the two entropies "
      "agreed closely (Spearman ρ = 0.88). For CGGA we used the RNA-sequencing tables of the two batches, scored "
      "separately. Within each dataset, every gene was standardized across tumors, a state score was the mean of its "
      "module's standardized genes, and the four state scores were standardized again across tumors. We turned the "
      "four scores into relative shares with a softmax transform and computed the Shannon entropy of the shares, "
      "divided by log 4 so that it runs from 0, when one state dominates, to 1, when all four are equally represented. "
      "We also recorded each tumor's dominant state. This entropy is an estimate of how mixed the states are in the "
      "sampled piece of tumor. It is not a single-cell measurement, and we treat it as a proxy."),
("p", "The MATH score follows Mroz and Rocco [@mroz2013]. From the TCGA PanCancer Atlas mutation calls, which unlike "
      "the legacy calls carry read counts, we kept single-nucleotide variants with at least 20 reads and at least 3 "
      "variant reads, computed each mutation's variant allele fraction, and defined MATH as 100 times the median "
      "absolute deviation of the fractions divided by their median. A tumor whose mutations all sit at similar "
      "fractions has a low MATH; a tumor with subclones at different fractions has a high one. We required at least 10 "
      "usable mutations and excluded hypermutated tumors with more than 1,000, which left 375 patients of our cohort. "
      "The median tumor had 70 usable mutations (interquartile range 56 to 89). CGGA does not release allele fractions, "
      "so MATH is TCGA-only."),
("p", "For each score we tested three things, in the order set out in the hypothesis. First, its relation to age: "
      "Spearman correlation, medians across the age bands used elsewhere in the paper with a Kruskal-Wallis test, and "
      "median age by dominant state. Second, its relation to survival: a Cox model with the score alone, standardized "
      "so that the hazard ratio is per one standard deviation, and Kaplan-Meier curves by tertile with a log-rank test. "
      "Third, whether it changes the age estimate: the age-only model refitted on the patients who have the score, "
      "then age plus the score, then age plus the score plus sex, MGMT and IDH, and, for the entropy, an IDH-wildtype "
      "repeat. All of this is in heterogeneity.py."),
("h2", "2.10. Additional cohorts and meta-analysis of the age effect"),
("p", "Two cohorts settle little when they disagree. To see the age effect as a distribution across cohorts we did "
      "two things. We added two more individual-patient cohorts from cBioPortal that record age and overall survival "
      "for primary glioblastoma: the MSK-IMPACT glioma study [@jonsson2019], from which we kept 485 patients with a WHO "
      "grade 4 glioblastoma sample and a positive survival time, and the CPTAC-3 glioblastoma cohort [@wang2021], 96 "
      "patients with a recorded vital status, whose survival we computed from the days between diagnosis and death or "
      "last contact. Both were mapped to the same fields as TCGA and CGGA and run through the same age-only Cox model. "
      "MSK-IMPACT patients had to survive until their tumor was sequenced, which lengthens their observed survival; we "
      "return to this in Section 5. We also searched the literature for cohorts that report a Cox hazard ratio for age "
      "as a continuous variable in adult glioblastoma. Nine met that condition and did not overlap with our cohorts "
      "[@gittleman2017;@gittleman2019;@abedi2021;@ronning2012;@thumma2012;@shi2022;@bjorland2023;@karschnia2025;@blakstad2023]. "
      "A tenth, from the CGGA registry [@yang2015], overlaps our CGGA cohort and is shown but not pooled. Estimates "
      "reported per decade were converted to per year on the log scale. One trial report prints a ±1 standard error "
      "band where a 95% interval would be expected, so we used its standard error directly [@gittleman2017]. Appendix "
      "E lists every value with its source."),
("p", "We pooled log hazard ratios with a DerSimonian-Laird random-effects model [@dersimonian1986] and report the "
      "pooled hazard ratio with a Wald interval and with the Hartung-Knapp interval, which is more honest when the "
      "number of cohorts is small [@inthout2014]; the between-cohort standard deviation τ; the I² statistic, which is "
      "the share of the variation between estimates that is not sampling error [@higgins2002]; and a 95% prediction "
      "interval, which is the range in which the age effect of a new, similar cohort would be expected to fall "
      "[@riley2011]. We pooled the four individual-patient cohorts, the nine published cohorts and all thirteen "
      "together, repeated the pooling leaving each cohort out in turn, and pooled subgroups defined by IDH-wildtype-only "
      "versus all-comer cohorts, temozolomide-era versus mixed-era diagnoses, and adjusted versus unadjusted estimates. "
      "A mixed-effects meta-regression tested whether a cohort's median age explained its estimate. For the four "
      "individual-patient cohorts we also fitted one Cox model with age, cohort indicators and their interactions, and "
      "tested the interactions with a likelihood-ratio test. All of this is in meta_analysis.py."),
("h2", "2.11. Practical component: an open cohort platform"),
("p", "The first version of this project released the fitted models as a calculator that returned a survival curve "
      "for one set of patient characteristics. We withdrew it. A tool that takes one person's details and returns a "
      "survival time reads as a prognosis, whatever its disclaimer says; software intended for prognosis falls under "
      "the definition of a medical device in the EU regulation and in the Serbian law aligned with it; and a single "
      "number such as a median of 13 months, shown to a person without context, does harm. Group-level results are a "
      "different matter. They are what this paper reports, and they are what teaching and research need."),
("p", "The replacement is a web application called cohortex (cohort + cortex: many cohorts, one brain "
      "tumour), served from the project repository on GitHub Pages in English and Russian. Its Explore "
      "section shows Kaplan-Meier curves by age band, with confidence bands, for each of the four individual-patient "
      "cohorts, together with the forest plot of the meta-analysis. It never draws a group of fewer than 10 patients. "
      "Its Analyse section is for students and "
      "researchers who have a cohort of their own. The user loads a spreadsheet, maps its columns to a standard field "
      "list, and the application checks the file, warns about columns that look like names, dates or identifiers, "
      "converts survival times to months, and then runs the same analyses as this paper: Kaplan-Meier curves, the "
      "log-rank test, the nested Cox models, the Schoenfeld test and a written methods paragraph. It then places the "
      "user's age hazard ratio on a forest plot next to the four reference cohorts and pools them. Everything runs in "
      "the browser. No patient row is transmitted. A user who wishes to can share a summary of their cohort, which "
      "contains counts, medians and model coefficients only, with age-band counts below 10 removed; an administrator "
      "reviews it before it joins the pool, and the pooled estimate then updates for everyone. Around the tools sit two "
      "communities that share one sign-in but are kept apart by the database's access rules: a research space with "
      "discussion boards per dataset and per method and a directory of researchers, and a family space for patients, "
      "caregivers and relatives, whose posts only other family members can read, with a list of verified support "
      "organisations. Every new post in either space is read by a moderator before it appears, and the family space "
      "does not allow medical advice. The home page tells the study as a scroll-driven story around an interactive 3D "
      "model of a brain with a glioblastoma, and a Brain lab page lets the reader turn the model, cut through it and "
      "switch its layers on and off: the necrotic core, the enhancing rim, the oedema, and the infiltrating cells "
      "coloured by the four Neftel states. The model is generated mathematically in the browser and is an "
      "illustration, not a patient scan."),
("p", "The statistics inside the platform are our own JavaScript implementation, because sending data to a server was "
      "not acceptable. We verified it against lifelines on all four reference cohorts: 51 automated tests require the "
      "Cox coefficients and standard errors to match to 0.001, the Kaplan-Meier estimates to 0.001, the log-rank "
      "statistics to 1% and the Schoenfeld p values to 0.02. In practice the coefficients agree to about 10⁻⁵. A "
      "simulation of 200 cohorts with a known hazard ratio of 1.030 per year returned a mean estimate of 1.030 and 94% "
      "coverage of the true value. An automated browser test loads a deliberately messy demonstration file, walks "
      "through every step and confirms that no network request leaves the page."),

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
      "five variables (M5, n = 174) the hazard ratio was 1.032 (95% CI 1.014 to 1.051; p = 4.3 × 10⁻⁴). The small "
      "drop in M2 comes from KPS, not from sex. On the same 439 patients, age alone gives 1.033, age with sex gives "
      "1.033, age with KPS gives 1.029, and age with both gives 1.028 (Table A5). Older patients arrive with lower "
      "Karnofsky scores (r = −0.29), so part of what age measures in M1 is performance status. Sex itself carries a "
      "modest risk, HR 1.21 on its own and 1.33 once KPS is in the model, but it does not touch the age estimate. "
      "Dropping the 154 patients without KPS changes nothing (1.034 against 1.033), and excluding the two patients with "
      "KPS 0 leaves M2 at 1.028."),
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

("h2", "3.10. Heterogeneity did not rise with age"),
("p", "The cell-state entropy could be computed for 437 of the 593 TCGA patients and for all 218 CGGA patients. It "
      "was spread across most of its range in both cohorts: a median of 0.88 in TCGA (interquartile range 0.75 to "
      "0.94) and 0.92 in CGGA (0.83 to 0.96), meaning that most tumors expressed several states at once and a minority "
      "were dominated by one. The mesenchymal-like state was the most common dominant state in both cohorts, in 163 "
      "TCGA tumors (37%) and 77 CGGA tumors (35%), followed by astrocyte-like, neural-progenitor-like and "
      "oligodendrocyte-progenitor-like. None of this tracked age (Figure 8). The correlation between age and entropy "
      "was 0.04 in TCGA (p = 0.47) and 0.07 in CGGA (p = 0.34), the medians across the four age bands were flat "
      "(Kruskal-Wallis p = 0.82 and 0.61), and the median age of the four dominant-state groups differed by five years "
      "in TCGA and nine in CGGA, with no consistent order between the cohorts (Table 10)."),
("p", "The MATH score, available for 375 TCGA patients, had a median of 35.0 (interquartile range 26.5 to 58.1). It "
      "did correlate with age, but in the opposite direction to the hypothesis: older patients had slightly less "
      "spread in their allele fractions (Spearman ρ = −0.18, p = 0.0004; Figure 9). The two scores were nearly "
      "independent of each other (ρ = −0.11, p = 0.06, n = 278), which is expected since one measures the mix of "
      "expression states and the other the clonal structure of mutations."),
("table", "Table 10. Heterogeneity scores by cohort and their relation to age.",
    ["", "TCGA entropy", "CGGA entropy", "TCGA MATH"],
    [["Patients scored", "437", "218", "375"],
     ["Median (IQR)", "0.88 (0.75–0.94)", "0.92 (0.83–0.96)", "35.0 (26.5–58.1)"],
     ["Spearman ρ with age (p)", "0.04 (0.47)", "0.07 (0.34)", "−0.18 (0.0004)"],
     ["Median by age band <50 / 50–59 / 60–69 / ≥70", "0.85 / 0.88 / 0.87 / 0.87", "0.92 / 0.91 / 0.93 / 0.93", "—"],
     ["Kruskal-Wallis across bands, p", "0.82", "0.61", "—"],
     ["Dominant state, n: MES / AC / NPC / OPC", "163 / 106 / 102 / 66", "77 / 50 / 47 / 44", "—"],
     ["Median age by dominant state, MES / AC / NPC / OPC", "59 / 62 / 57 / 59", "57 / 53 / 48 / 51", "—"]]),
("fig", "fig8_hetage", "Figure 8. Age at diagnosis against cell-state entropy in TCGA (left) and CGGA (right), with the least-squares line and the Spearman correlation."),
("fig", "fig9_math", "Figure 9. The MATH score in TCGA: against age (left), and Kaplan-Meier curves by MATH tertile (right)."),
("h2", "3.11. Heterogeneity did not predict survival or change the age effect"),
("p", "Neither score separated patients by survival (Table 11, Figure 10). In TCGA, one standard deviation more "
      "entropy gave a hazard ratio of 1.03 (95% CI 0.92 to 1.14; p = 0.64), the tertiles had median survivals of "
      "14.9, 13.3 and 14.3 months (log-rank p = 0.68), and no dominant state differed from the astrocyte-like "
      "reference. In CGGA the continuous estimate was 1.02 per standard deviation (0.86 to 1.21; p = 0.78). The CGGA "
      "tertiles did differ, with medians of 19.4, 13.3 and 13.6 months and a log-rank p of 0.049, but a continuous "
      "effect that is absent and a tertile split that just reaches significance is the pattern of a chance finding, "
      "and we read it as one. MATH gave a hazard ratio of 0.90 per standard deviation (0.80 to 1.00; p = 0.057) on its "
      "own, and the tertiles did not separate (p = 0.32)."),
("p", "The decisive test was what the scores did to the age estimate, and the answer is nothing. On the 437 TCGA "
      "patients with an entropy, age alone gave 1.032 per year and age plus entropy gave 1.032 (95% CI 1.024 to 1.040), "
      "with the entropy term at 0.99. On the 375 patients with MATH, age alone gave 1.036 and age plus MATH gave 1.037 "
      "(1.026 to 1.048), and the weak protective look of MATH on its own vanished once age was in the model (1.01, "
      "p = 0.87), which means that the lower MATH of older tumors was standing in for age. With sex, MGMT and IDH added "
      "as well, the age estimate stayed at 1.029 with entropy and 1.036 with MATH. In CGGA, age plus entropy gave "
      "1.020, identical to age alone. In IDH-wildtype TCGA tumors, age plus entropy gave 1.025 (1.010 to 1.041), the "
      "same as the IDH-wildtype estimate without it. The secondary hypothesis is therefore rejected on both counts: "
      "heterogeneity, as far as bulk data can measure it, is not higher in older patients, and it does not account for "
      "any part of the age effect."),
("table", "Table 11. Cox models with heterogeneity scores. Scores are standardized, so their hazard ratios are per one standard deviation.",
    ["Cohort, model", "n", "Deaths", "Age, HR per year (95% CI)", "Score, HR per SD (95% CI)", "p (score)"],
    [["TCGA: age alone, entropy subset", "437", "367", "1.032 (1.024–1.040)", "—", "—"],
     ["TCGA: entropy alone", "437", "367", "—", "1.03 (0.92–1.14)", "0.64"],
     ["TCGA: age + entropy", "437", "367", "1.032 (1.024–1.040)", "0.99 (0.89–1.11)", "0.92"],
     ["TCGA: age + entropy + sex + MGMT + IDH", "168", "128", "1.029 (1.012–1.046)", "0.89 (0.74–1.08)", "0.23"],
     ["TCGA, IDH-wildtype: age + entropy", "187", "154", "1.025 (1.010–1.041)", "0.94 (0.78–1.12)", "0.47"],
     ["TCGA: age alone, MATH subset", "375", "291", "1.036 (1.026–1.047)", "—", "—"],
     ["TCGA: MATH alone", "375", "291", "—", "0.90 (0.80–1.00)", "0.057"],
     ["TCGA: age + MATH", "375", "291", "1.037 (1.026–1.048)", "1.01 (0.90–1.14)", "0.87"],
     ["TCGA: age + MATH + sex + MGMT + IDH", "235", "177", "1.036 (1.021–1.050)", "1.08 (0.89–1.30)", "0.45"],
     ["CGGA: age alone", "218", "183", "1.020 (1.008–1.032)", "—", "—"],
     ["CGGA: entropy alone", "218", "183", "—", "1.02 (0.86–1.21)", "0.78"],
     ["CGGA: age + entropy", "218", "183", "1.020 (1.008–1.032)", "1.02 (0.86–1.20)", "0.83"],
     ["CGGA: age + entropy + sex + MGMT + IDH", "194", "165", "1.013 (1.001–1.026)", "0.99 (0.84–1.18)", "0.94"]]),
("fig", "fig10_hetkm", "Figure 10. Kaplan-Meier curves by tertile of cell-state entropy in TCGA (left) and CGGA (right)."),
("h2", "3.12. The age effect across thirteen cohorts"),
("p", "The two extra individual-patient cohorts fell between TCGA and CGGA. In MSK-IMPACT (485 patients, 223 deaths, "
      "median survival 23.5 months) the hazard ratio per year was 1.025 (95% CI 1.014 to 1.036); in CPTAC (96 patients, "
      "62 deaths) it was 1.028 (1.006 to 1.049). A single model over the four cohorts with a common age slope gave "
      "1.029 (1.024 to 1.034), and the test of whether the slope differs between cohorts was no longer significant "
      "once four cohorts were in it (likelihood-ratio p = 0.105, 3 degrees of freedom). Pooling the four with random "
      "effects gave 1.028 (1.021 to 1.035) with I² = 38%."),
("p", "The nine published cohorts contributed about 39,400 further patients, from a 799-patient trial arm to the "
      "34,664-patient SEER registry analysis. Their estimates ran from 1.017 to 1.040 per year, and every interval "
      "excluded 1.0. Pooling all thirteen cohorts gave a hazard ratio of 1.028 per year (95% CI 1.024 to 1.033; "
      "Hartung-Knapp 1.023 to 1.034), a between-cohort standard deviation of 0.007 on the log scale, and a 95% "
      "prediction interval of 1.012 to 1.045 (Table 12, Figure 11). In words: in a new glioblastoma cohort, each year "
      "of age would be expected to raise the hazard of death by somewhere between 1% and 4.5%, most likely by about 3%. "
      "The I² of 79% looks high, but it is driven by one cohort: the SEER analysis has an interval so narrow that any "
      "difference from it counts as heterogeneity, and without it I² falls to 49% and the pooled estimate to 1.027 "
      "(1.023 to 1.032). Leaving out any single cohort moved the pooled estimate between 1.027 and 1.030."),
("p", "The subgroups agreed with each other. IDH-wildtype-only cohorts gave 1.031 (1.025 to 1.037), all-comer cohorts "
      "1.027 (1.020 to 1.034); temozolomide-era cohorts 1.027 (1.023 to 1.032), mixed-era cohorts 1.032 (1.023 to "
      "1.040); adjusted estimates 1.028, unadjusted 1.029. A cohort's median age did not explain its estimate: the "
      "meta-regression slope corresponds to a change in the hazard ratio by a factor of 1.002 per ten years of cohort "
      "median age (p = 0.77; Figure 12). Our CGGA estimate of 1.020 sits at the low end of the distribution, but "
      "inside the prediction interval and next to the Copenhagen and Norwegian population cohorts, so it is not an "
      "outlier. What looked like a disagreement between two cohorts is the ordinary spread of one effect."),
("table", "Table 12. The age effect in thirteen glioblastoma cohorts and the pooled estimates. Published estimates were converted to per year where needed; Appendix E gives the source of each value.",
    ["Cohort", "Country, years of diagnosis", "n (deaths)", "HR per year (95% CI)", "Adjusted"],
    [["TCGA-GBM (this study)", "USA, 1989–2013", "593 (492)", "1.034 (1.027–1.042)", "no"],
     ["CGGA (this study)", "China, 2006–2016", "218 (183)", "1.020 (1.008–1.032)", "no"],
     ["MSK-IMPACT (this study)", "USA, 2014–2018", "485 (223)", "1.025 (1.014–1.036)", "no"],
     ["CPTAC-GBM (this study)", "USA/international, 2016–2019", "96 (62)", "1.028 (1.006–1.049)", "no"],
     ["NRG/RTOG 0525 [@gittleman2017]", "USA/Canada, 2006–2008", "799 (625)", "1.030 (1.022–1.038)", "yes"],
     ["Ohio Brain Tumor Study [@gittleman2019]", "USA, 2007–2017", "179 (163)", "1.018 (1.002–1.034)", "yes"],
     ["Copenhagen [@abedi2021]", "Denmark, 2005–2016", "680 (646)", "1.017 (1.008–1.025)", "yes"],
     ["Norway, population-based [@ronning2012]", "Norway, 2000–2007", "694", "1.020 (1.010–1.030)", "yes"],
     ["SEER [@thumma2012]", "USA, 1973–2008", "34,664", "1.037 (1.036–1.038)", "yes"],
     ["Dana-Farber [@shi2022]", "USA, 2010–2019", "665", "1.040 (1.030–1.050)", "yes"],
     ["Western Norway [@bjorland2023]", "Norway, 2007–2014", "235", "1.030 (1.020–1.040)", "yes"],
     ["RANO resect [@karschnia2025]", "USA/Europe, to 2022", "1,003 (667)", "1.030 (1.020–1.040)", "no"],
     ["Bergen–Oslo [@blakstad2023]", "Norway, 2015–2017", "467 (415)", "1.030 (1.020–1.039)", "no"],
     ["Pooled, our four cohorts", "", "1,392 (960)", "1.028 (1.021–1.035), I² 38%", ""],
     ["Pooled, nine published cohorts", "", "≈39,400", "1.029 (1.023–1.035), I² 82%", ""],
     ["Pooled, all thirteen", "", "≈40,800", "1.028 (1.024–1.033), I² 79%", ""],
     ["Pooled, all without SEER", "", "≈6,100", "1.027 (1.023–1.032), I² 49%", ""],
     ["95% prediction interval, all thirteen", "", "", "1.012–1.045", ""]]),
("fig", "fig11_metaforest", "Figure 11. Forest plot of the hazard ratio per year of age in four individual-patient cohorts (blue) and nine published cohorts (red), with the pooled estimates and the 95% prediction interval. The grey row overlaps our CGGA cohort and is shown but not pooled."),
("fig", "fig12_metareg", "Figure 12. Meta-regression of each cohort's age hazard ratio on its median age. Bubble size is the random-effects weight."),
("h2", "3.13. The cohortex application"),
("p", "Figure 13 shows the Explore section of cohortex. The reader picks a cohort and sees its survival curves by age band "
      "with confidence bands, a table of patients, deaths, median survival and survival at 12 and 24 months per band, "
      "the log-rank p value, and the cohort's age hazard ratio; below that sits the forest plot of Figure 11. The "
      "platform's analysis wizard produces, for a user's own file, the same outputs as Sections 3.1 to 3.7 of this "
      "paper, and its comparison step reproduces Figure 11 with the user's cohort added. On the demonstration file, a "
      "60-patient cohort simulated with a known hazard ratio of 1.030, the platform estimated 1.022 (95% CI 1.003 to "
      "1.042), which is also what lifelines gives for the same file. Both tools state on their first screen that they "
      "show how groups fared in research cohorts and are not for decisions about any person."),
("fig", "fig13_explorer", "Figure 13. The cohortex home page. The same site holds the Explore, Analyse and Pool tools and the two moderated communities, in English and Russian."),

("h1", "4. Discussion"),
("h2", "4.1. Main findings"),
("p", "Age at diagnosis was associated with survival in every analysis we ran. The younger half of the group lived "
      "seven months longer at the median than the older half. Survival fell step by step across age quartiles. The "
      "risk of death per extra year of age stayed between 1.027 and 1.037 whatever we corrected for. The effect was "
      "concentrated in the first year after diagnosis, and it survived the removal of IDH-mutant tumors. In the "
      "independent CGGA cohort every one of those statements held again, with one qualification: the effect per year "
      "was smaller, 1.020 rather than 1.034, and that difference sits at the edge of statistical significance. Two "
      "measures of intratumoral heterogeneity, one from expression and one from mutations, were unrelated or weakly "
      "inversely related to age, did not predict survival, and left the age estimate exactly where it was. Across "
      "thirteen cohorts and about 40,800 patients the age effect pooled to 1.028 per year, with a prediction interval "
      "of 1.012 to 1.045 that contains both TCGA and CGGA."),
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
      "cohort could move it either way. The meta-analysis settles the question as far as it can be settled. With "
      "eleven more cohorts on the plot, CGGA is no longer the odd one out. It sits at the low end of a distribution "
      "that also holds the Copenhagen series at 1.017, the Ohio study at 1.018 and the Norwegian registry at 1.020, all "
      "of them adjusted estimates from treatment systems very different from Beijing's. Two cohorts can disagree by "
      "chance; a spread of 1.017 to 1.040 across thirteen is what a real effect looks like when it is measured in "
      "different populations with different adjustments. The prediction interval is the honest summary: a new cohort "
      "should expect between 1% and 4.5% per year."),
("p", "The fifth is the heterogeneity result, which is negative and, we think, useful. The hypothesis that older "
      "tumors are more heterogeneous, and that this is part of why older patients do worse, is plausible and, as far "
      "as we can find, had not been tested directly in these datasets. It failed on every count. Cell-state entropy "
      "was flat across age in two cohorts measured on two platforms. MATH was, if anything, lower in older tumors, "
      "which fits what is known about the genetics of age in glioblastoma: older tumors more often carry the classic "
      "chromosome 7 gain and 10 loss with EGFR amplification, changes that arise early in the tumor's history and are "
      "therefore shared by most of its cells, whereas younger tumors more often carry the IDH and G-CIMP changes. We "
      "offer this as a reading, not a finding of this study. "
      "Neither score predicted survival, and neither moved the age estimate. The conclusion is not that heterogeneity "
      "does not matter for glioblastoma; the single-cell and multi-region literature says otherwise, above all for "
      "treatment resistance and relapse. The conclusion is narrower: whatever heterogeneity does, it does not do it "
      "through age, and a bulk snapshot taken at diagnosis does not carry a prognostic signal that survives correction "
      "for age. Any study that reports a heterogeneity score as prognostic in bulk data should show that it adds to "
      "age, and this paper gives the benchmark it has to beat."),
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
      "[@zhao2021]. The only published continuous age estimate from CGGA we found, 1.019 per year in an earlier "
      "registry cohort [@yang2015], matches ours, so the smaller effect appears to be a property of the CGGA population "
      "rather than of our cohort selection. Our pooled estimate of 1.028 per year agrees with the largest single "
      "estimates in the literature, 1.030 in the RTOG 0525 trial [@gittleman2017] and 1.037 in SEER [@thumma2012], and "
      "the MATH result agrees with the original description of the score, which found it prognostic in head and neck "
      "cancer but did not claim generality across tumor types [@mroz2013]."),
("h2", "4.4. Why this matters"),
("p", "For anyone analyzing TCGA-GBM, the result sets a benchmark. A hazard ratio of 1.40 per decade means that the "
      "18-year spread of the middle half of our patients corresponds to a hazard ratio of about 1.8, and the 33-year "
      "gap between the median ages of the youngest and oldest quartiles to a hazard ratio near 3. Any molecular "
      "variable proposed as a predictor in this dataset should be shown to add something beyond age. Any variable "
      "that correlates with age, as IDH status, G-CIMP and the proneural subtype all do, should be interpreted with "
      "age in the model. We applied that rule to heterogeneity and it did not pass. The validation adds a practical "
      "rule: an effect size taken from TCGA should not be assumed to transfer to another population without checking, "
      "because even the best-established prognostic factor in the disease came out a third smaller in the second "
      "cohort, and the meta-analysis adds the range within which such a transfer can be expected to land. The platform "
      "turns that range into something a student with a 40-patient hospital series can use: load the file, see the "
      "cohort's age effect next to thirteen others, and know whether it is ordinary."),

("h1", "5. Limitations"),
("num", [
    "IDH profiling was incomplete. Mutation calls exist for 290 of the 619 samples, so the sensitivity analysis covers 285 patients, or 48% of the group. We cannot rule out that the profiled and unprofiled patients differ in ways we did not see. Supplementary Table S1 of Brennan and colleagues [@brennan2013] would extend the coverage and is the obvious next step.",
    "We derived MGMT status by splitting array beta values with a Gaussian mixture on each platform. The two platforms use different probes and share only five samples. Our calls agreed with the independent GlioVis annotation for 75.4% of 346 shared patients, so some patients are misclassified, which pulls the MGMT estimate toward no effect. This does not affect the age estimate, because MGMT is not strongly linked to age in this group.",
    "How much of the tumor the surgeon removed is not in the TCGA-GBM clinical export, so we could not include it. It is a known predictor of survival and it correlates with age.",
    "Treatment varied between patients and is mostly not recorded. Diagnoses span 1989 to 2013, before and after temozolomide became standard, and only 24 patients have a recorded radiotherapy field. Our survival figures therefore describe a mixed-era group rather than patients treated the way they would be today.",
    "KPS was missing for 154 patients (26%), and MGMT and IDH were missing for larger shares. The nested models reduce this problem by showing that the estimate is stable across subgroups, but each subgroup may still differ from the whole group in ways we cannot observe.",
    "Age breaks the proportional hazards assumption, so the single hazard ratios in Table 4 are averages over the whole follow-up. Our split at 12 months describes this, but a model with a coefficient that changes over time would measure it more precisely.",
    "The validation cohort is smaller (218 patients), comes from a single country and treatment system, has no Karnofsky score, and contains a higher share of IDH-mutant tumors than a WHO CNS5 glioblastoma series would. Its confidence intervals are correspondingly wider.",
    "Both heterogeneity scores are bulk proxies. The cell-state entropy estimates how mixed the four Neftel states are in one piece of tumor from an average expression profile; it cannot see cells, and the softmax step that turns state scores into shares is a modeling choice, although the result is a ranking that a different transform would change little. It was measured on an array in TCGA and by RNA sequencing in CGGA. MATH depends on sequencing depth and purity, is available for TCGA only, and uses a different, more recent set of mutation calls than the IDH variable. A negative result with proxies does not exclude an effect of heterogeneity measured at single-cell or multi-region resolution.",
    "The meta-analysis mixes estimates that were adjusted for different variables with estimates that were not, and the published values were read from papers rather than recomputed, so they inherit each paper's choices. The SEER estimate dominates the fixed weights and inflates I²; we report the analysis with and without it. Two of the individual-patient cohorts have their own biases: MSK-IMPACT patients had to survive to sequencing, which is a form of left truncation that our analysis does not correct, and CPTAC is small with short follow-up. A systematic search with two independent reviewers would be needed before this pooling could be called a systematic review; ours was a structured search that verified each number against its source.",
    "The platform has been tested against lifelines and by automated browser tests, but not yet by users. The usability study described in Section 6 is still to be done, and the shared-summary pool holds only the reference cohorts at the time of writing.",
    "The study is observational in every cohort, so none of these associations proves that age causes shorter survival. The explorer and the platform inherit every limitation of the data behind them and are research and teaching tools, not clinical ones.",
]),

("h1", "6. Conclusion"),
("num", [
    "We built a patient-level dataset of 593 TCGA-GBM patients with 492 deaths from the cBioPortal export, reading the survival status string as a censoring indicator. Missing data cost us 2.1% of the patients.",
    "Patients younger than the median age of 59 years lived a median of 17.7 months, against 10.7 months for older patients (log-rank p = 2.5 × 10⁻¹³). Our hypothesis that younger patients live longer is supported.",
    "The effect grew with age: median survival fell step by step across the four age quartiles, from 21.9 to 7.6 months (p = 5.4 × 10⁻²¹).",
    "Each extra year of age raised the risk of death by between 2.7% and 3.7% across five nested Cox models, and every confidence interval excluded 1.0 (fully corrected HR 1.032, 95% CI 1.014 to 1.051). The effect was strongest in the first year after diagnosis (HR 1.047) and about half as strong on the log scale afterward (HR 1.025).",
    "In IDH-wildtype tumors, the group that WHO CNS5 now calls glioblastoma, the age effect remained (HR 1.027 per year, 95% CI 1.014 to 1.040). Including IDH-mutant tumors makes the effect look slightly larger, but it does not create it.",
    "In an independent cohort of 218 primary glioblastoma patients from CGGA, age again predicted survival (HR 1.020 per year, 95% CI 1.008 to 1.032), again more strongly in the first year, and again independently of IDH status. The effect was smaller than in TCGA (interaction p = 0.058), and neither age range nor treatment explained the difference.",
    "Intratumoral heterogeneity, scored as cell-state entropy in 437 TCGA and 218 CGGA tumors and as MATH in 375 TCGA tumors, was not higher in older patients (ρ = 0.04, 0.07 and −0.18), did not predict survival, and did not change the age estimate (1.032 with entropy, 1.037 with MATH). The secondary hypothesis is rejected.",
    "Across thirteen cohorts and about 40,800 patients, the age effect pooled to HR 1.028 per year (95% CI 1.024 to 1.033) with a 95% prediction interval of 1.012 to 1.045. Every cohort pointed the same way, a cohort's median age did not explain its estimate, and the CGGA value lies inside the expected range.",
    "The analysis code, the four harmonized cohorts, a public cohort explorer and a browser-based platform in which researchers can analyze and compare their own cohort without uploading patient data are released openly, with the platform's statistics verified against lifelines by 51 automated tests.",
]),
("h2", "Future directions"),
("p", "The heterogeneity question deserves a second attempt with better instruments. Deconvolution methods that "
      "estimate cell-state proportions from bulk expression using single-cell references would replace our softmax "
      "shares with proper estimates, and the CGGA tumors that have both RNA sequencing and whole-exome data would allow "
      "a MATH replication. The age analysis has three natural extensions. A coefficient for age that changes "
      "continuously with time would replace the fixed cut at 12 months. A model with left truncation would give "
      "MSK-IMPACT an unbiased estimate. And the meta-analysis should grow: the platform is designed so that every "
      "cohort a user chooses to share adds a row to Figure 11, and the first outside cohorts will show whether the "
      "prediction interval holds. The platform itself needs a usability study with five to eight students, each given "
      "the demonstration file and asked to reach the comparison step, measuring time and errors and collecting a "
      "System Usability Scale score; that study is planned as the next step of the project. A patient and family "
      "space, kept separate from the research platform and moderated by a clinician, is planned after the research "
      "side is stable."),
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
("table", "Table A5. Sex and KPS entered separately, on the same patients, to show which of them moves the age estimate in M2.",
    ["Model", "n", "Deaths", "Age, HR per year (95% CI)", "Male sex, HR (95% CI)", "KPS per 10 points, HR (95% CI)", "C-index"],
    [["Age only, all patients", "593", "492", "1.034 (1.027–1.042)", "—", "—", "0.655"],
     ["Age + sex, all patients", "593", "492", "1.034 (1.027–1.042)", "1.19 (0.99–1.43)", "—", "0.655"],
     ["Sex only, all patients", "593", "492", "—", "1.21 (1.01–1.46)", "—", "0.512"],
     ["Age only, patients with KPS", "439", "359", "1.033 (1.025–1.042)", "—", "—", "0.648"],
     ["Age + sex, patients with KPS", "439", "359", "1.033 (1.024–1.041)", "1.21 (0.98–1.51)", "—", "0.649"],
     ["Age + KPS", "439", "359", "1.029 (1.020–1.038)", "—", "0.82 (0.76–0.89)", "0.664"],
     ["Age + sex + KPS (M2)", "439", "359", "1.028 (1.019–1.037)", "1.33 (1.07–1.66)", "0.81 (0.75–0.87)", "0.666"],
     ["Age + sex + KPS, two KPS = 0 patients excluded", "437", "357", "1.028 (1.019–1.037)", "1.33 (1.07–1.66)", "0.81 (0.74–0.88)", "0.664"]]),
("h2", "Appendix B. Input files and the variables we derived from them"),
("table", "Table B1. Which file each variable came from.",
    ["File (cBioPortal, gbm_tcga)", "Fields used", "Variable we built"],
    [["clinical.tsv (TCGA)", "Patient ID, Diagnosis Age, Overall Survival (Months), Overall Survival Status, Sex, Karnofsky Performance Score", "AGE, OS_MONTHS, event (the number in front of the status string), male, kps10"],
     ["CGGA.mRNAseq_693_clinical, CGGA.mRNAseq_325_clinical", "CGGA_ID, PRS_type, Histology, Grade, Gender, Age, OS (days), Censor, Radio_status, Chemo_status, IDH_mutation_status, MGMTp_methylation_status", "AGE, OS_MONTHS (= OS / 30.4375), event, male, radio, chemo, idh_mut, mgmt_meth"],
     ["mutations.txt", "SAMPLE_ID, IDH1, IDH2", "idh_mut (1 if either gene is mutated, 0 if both are normal, missing if both are not profiled)"],
     ["methylation_hm27.txt, methylation_hm450.txt", "SAMPLE_ID, MGMT (beta value)", "beta (the higher of the two platforms), mgmt_meth (Gaussian mixture per platform, upper component = 1)"],
     ["data_mrna_agilent_microarray.txt, data_mrna_seq_v2_rsem.txt (gbm_tcga); CGGA.mRNAseq_693/325.RSEM-genes", "expression by gene symbol", "four state scores, p_MES, p_AC, p_OPC, p_NPC, entropy, dominant state"],
     ["data_mutations.txt (gbm_tcga_pan_can_atlas_2018)", "Tumor_Sample_Barcode, Variant_Type, t_ref_count, t_alt_count", "variant allele fraction per mutation, n_mut, MATH"],
     ["IDHwt.GBM.MetaModules.tsv (Neftel et al. 2019, Table S2)", "MESlike1, MESlike2, AClike, OPClike, NPClike1, NPClike2", "the four merged gene modules"],
     ["data_clinical_patient/sample.txt (glioma_mskcc_2019, gbm_cptac_2021)", "AGE, OS_MONTHS, OS_STATUS, SEX, MGMT_STATUS, ONCOTREE_CODE, WHO_GRADE; AGE, VITAL_STATUS, PATH_DIAG_TO_DEATH_DAYS, PATH_DIAG_TO_LAST_CONTACT_DAYS", "AGE, OS_MONTHS, event, male, mgmt_meth for the two extra cohorts"]]),
("h2", "Appendix C. Code and reproducibility"),
("p", "Everything is in one public repository, github.com/Nnnnshsjsjsj/gbm-age-survival. The folder analysis/ holds "
      "the scripts: run.py reads the unchanged cBioPortal exports and prints every number in Sections 3.1 to 3.7; "
      "validate_cgga.py repeats the analysis on the CGGA tables (Section 3.8); compare_cohorts.py produces Table 9 and "
      "Figures 6 and 7; mtable_sex_kps.py produces Table A5; heterogeneity.py computes both heterogeneity scores and "
      "produces Tables 10 and 11 and Figures 8 to 10; meta_analysis.py harmonizes the MSK-IMPACT and CPTAC cohorts, "
      "pools the thirteen estimates and produces Table 12 and Figures 11 and 12; export_explorer.py and "
      "build_explorer.py build the cohort explorer; make_golden.py writes the reference values that the platform's "
      "tests check against. The folder data/ holds the harmonized patient-level tables for all four cohorts, the Neftel "
      "gene lists and the extracted published estimates; results/ holds every table and log; paper/ holds this document "
      "in both languages with its build script. Each script prints the numbers it is responsible for, so any value in "
      "this paper can be traced to one line of output. The proportional-hazards and heterogeneity computations run in "
      "under a minute on a laptop."),
("h2", "Appendix D. The cohortex application"),
("p", "cohortex is served at nnnnshsjsjsj.github.io/gbm-age-survival from the docs/ folder of the repository; its source "
      "is in platform/. It is a React application. Its statistics engine (platform/src/engine/) is a set of plain "
      "JavaScript modules for the Kaplan-Meier estimator, the log-rank test, Cox regression with Efron tie handling, the "
      "Schoenfeld test and random-effects meta-analysis, with tests in platform/tests/ that compare them with lifelines "
      "on the four reference cohorts and on simulated data. Accounts and the two communities use a Supabase database "
      "hosted in the EU, whose schema and row-level security rules are in platform/supabase/migrations/0002_plateau.sql. "
      "The rules let a family post be read only by family members and moderators, let a research account alone share a "
      "cohort summary, hold every new post as pending until a moderator approves it, and send every moderation action "
      "to an audit log. The database stores no field that could hold a patient row and refuses summaries with fewer "
      "than 10 patients or 10 deaths. A summary that a user chooses to share contains counts, medians, survival at "
      "fixed times and model coefficients with their standard errors, and nothing else."),
("h2", "Appendix E. Published estimates used in the meta-analysis"),
("table", "Table E1. Source and form of each published estimate. All were read from the cited paper's text or tables; the URL in the repository file data/published_estimates.csv points to the page used.",
    ["Cohort", "Reported as", "Read from", "Note"],
    [["NRG/RTOG 0525 [@gittleman2017]", "1.030 per year, SE 0.0039", "Table 2, training set", "The printed interval (1.026–1.034) is ±1 SE; the 95% CI used is 1.022–1.038"],
     ["Ohio Brain Tumor Study [@gittleman2019]", "1.018 (1.002–1.034) per year", "Multivariable table", "IDH-wildtype only"],
     ["Copenhagen [@abedi2021]", "1.18 (1.08–1.28) per 10 years", "Table 3", "Converted to 1.017 (1.008–1.025) per year; supersedes an overlapping earlier series from the same hospital"],
     ["Norway, population-based [@ronning2012]", "1.02 (1.01–1.03) per year", "Table 3", "694 patients in the model"],
     ["SEER [@thumma2012]", "1.037 (1.036–1.038) per year", "Table 7", "Registry; no adjustment for performance status or chemotherapy"],
     ["Dana-Farber [@shi2022]", "1.04 (1.03–1.05) per year", "Multivariable table", "IDH-wildtype only"],
     ["Western Norway [@bjorland2023]", "1.03 (1.02–1.04) per year", "Text", "IDH-mutant cases excluded per WHO 2021"],
     ["RANO resect [@karschnia2025]", "1.03 (1.02–1.04) per year", "Table 2", "Univariable; the multivariable model used age above 65 as a category"],
     ["Bergen–Oslo [@blakstad2023]", "1.34 (1.22–1.46) per 10 years", "Text", "Univariable; converted to 1.030 (1.020–1.039) per year"],
     ["CGGA registry [@yang2015]", "1.019 (1.002–1.036) per year", "Table 2", "Overlaps our CGGA cohort; shown, not pooled"]]),
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
"mroz2013": "Mroz EA, Rocco JW. MATH, a novel measure of intratumor genetic heterogeneity, is high in poor-outcome classes of head and neck squamous cell carcinoma. Oral Oncol. 2013;49(3):211–5. doi:10.1016/j.oraloncology.2012.09.007",
"jonsson2019": "Jonsson P, Lin AL, Young RJ, DiStefano NM, Hyman DM, Li BT, et al. Genomic correlates of disease progression and treatment response in prospectively characterized gliomas. Clin Cancer Res. 2019;25(18):5537–47. doi:10.1158/1078-0432.CCR-19-0032",
"wang2021": "Wang LB, Karpova A, Gritsenko MA, Kyle JE, Cao S, Li Y, et al. Proteogenomic and metabolomic characterization of human glioblastoma. Cancer Cell. 2021;39(4):509–528.e20. doi:10.1016/j.ccell.2021.01.006",
"gittleman2017": "Gittleman H, Lim D, Kattan MW, Chakravarti A, Gilbert MR, Lassman AB, et al. An independently validated nomogram for individualized estimation of survival among patients with newly diagnosed glioblastoma: NRG Oncology RTOG 0525 and 0825. Neuro Oncol. 2017;19(5):669–77. doi:10.1093/neuonc/now208",
"gittleman2019": "Gittleman H, Cioffi G, Chunduru P, Molinaro AM, Berger MS, Sloan AE, Barnholtz-Sloan JS. An independently validated nomogram for isocitrate dehydrogenase-wild-type glioblastoma patient survival. Neurooncol Adv. 2019;1(1):vdz007. doi:10.1093/noajnl/vdz007",
"abedi2021": "Abedi AA, Grunnet K, Christensen IJ, Michaelsen SR, Muhic A, Møller S, et al. A prognostic model for glioblastoma patients treated with standard therapy based on a prospective cohort of consecutive non-selected patients from a single institution. Front Oncol. 2021;11:597587. doi:10.3389/fonc.2021.597587",
"ronning2012": "Rønning PA, Helseth E, Meling TR, Johannesen TB. A population-based study on the effect of temozolomide in the treatment of glioblastoma multiforme. Neuro Oncol. 2012;14(9):1178–84. doi:10.1093/neuonc/nos153",
"thumma2012": "Thumma SR, Fairbanks RK, Lamoreaux WT, Mackay AR, Demakas JJ, Cooke BS, et al. Effect of pretreatment clinical factors on overall survival in glioblastoma multiforme: a Surveillance Epidemiology and End Results (SEER) population analysis. World J Surg Oncol. 2012;10:75. doi:10.1186/1477-7819-10-75",
"shi2022": "Shi DD, Youssef GC, Nassar AH, Lim-Fat MJ, Ligon KL, Wen PY, Rahman R. Improved survival among females and association with lymphopenia in patients with newly diagnosed glioblastoma. Neuro Oncol. 2022;24(11):2005–7. doi:10.1093/neuonc/noac190",
"bjorland2023": "Bjorland LS, Mahesparan R, Fluge Ø, Gilje B, Kurz KD, Farbu E. Impact of extent of resection on outcome from glioblastoma using the RANO resect group classification system: a retrospective, population-based cohort study. Neurooncol Adv. 2023;5(1):vdad126. doi:10.1093/noajnl/vdad126",
"karschnia2025": "Karschnia P, Young JS, Youssef GC, Dono A, Häni L, Sciortino T, et al. Development and validation of a clinical risk model for postoperative outcome in newly diagnosed glioblastoma: a report of the RANO resect group. Neuro Oncol. 2025;27(4):1046–60. doi:10.1093/neuonc/noae231",
"blakstad2023": "Blakstad H, Brekke J, Rahman MA, Arnesen VS, Miletic H, Brandal P, et al. Survival in a consecutive series of 467 glioblastoma patients: association with prognostic factors and treatment at recurrence at two independent institutions. PLoS One. 2023;18(2):e0281166. doi:10.1371/journal.pone.0281166",
"yang2015": "Yang P, Zhang W, Wang Y, Peng X, Chen B, Qiu X, et al. IDH mutation and MGMT promoter methylation in glioblastoma: results of a prospective registry. Oncotarget. 2015;6(38):40896–906. doi:10.18632/oncotarget.5683",
"dersimonian1986": "DerSimonian R, Laird N. Meta-analysis in clinical trials. Control Clin Trials. 1986;7(3):177–88. doi:10.1016/0197-2456(86)90046-2",
"higgins2002": "Higgins JPT, Thompson SG. Quantifying heterogeneity in a meta-analysis. Stat Med. 2002;21(11):1539–58. doi:10.1002/sim.1186",
"inthout2014": "IntHout J, Ioannidis JPA, Borm GF. The Hartung-Knapp-Sidik-Jonkman method for random effects meta-analysis is straightforward and considerably outperforms the standard DerSimonian-Laird method. BMC Med Res Methodol. 2014;14:25. doi:10.1186/1471-2288-14-25",
"riley2011": "Riley RD, Higgins JPT, Deeks JJ. Interpretation of random effects meta-analyses. BMJ. 2011;342:d549. doi:10.1136/bmj.d549",
}

LABELS = dict(abstract="Abstract", keywords="Keywords", references="References", toc="Table of Contents",
              toc_note="[ Update this table in Word: References → Table of Contents → Update Table ]")
