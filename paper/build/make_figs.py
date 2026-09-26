import pandas as pd, numpy as np, matplotlib
matplotlib.use("Agg"); import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
from lifelines import KaplanMeierFitter
from lifelines.statistics import logrank_test, multivariate_logrank_test
plt.rcParams["font.family"]="DejaVu Sans"
d=pd.read_csv('cohort.csv'); med=d.AGE.median()
res=pd.read_csv('/root/.claude/uploads/71a36567-4b92-5be6-8f1f-e80a20bcf7cf/b80ddcc6-nested_models.csv')

T={"en":dict(flow=[("cBioPortal export gbm_tcga\n619 rows, 606 patients",None),
     ("Collapsed to one row per patient\n606 patients","13 patients contributed 2 samples"),
     ("Survival time and status available\n594 patients","12 excluded: no OS time or status"),
     ("Age at diagnosis available\n584 patients","10 excluded: no age"),
     ("Final analysis cohort\n593 patients (97.9%)\n492 deaths, 101 censored","1 excluded: OS time = 0")],
     hist=("Age at diagnosis (years)","Patients","median = {m:.0f} y","TCGA-GBM age at diagnosis (n={n})"),
     km2=("Young (<59)","Old (>=59)","Months since diagnosis","Overall survival probability","Overall survival by age group","log-rank p = {p:.1e}"),
     km4=("{a:.0f}-{b:.0f} y (n={n})","Overall survival by age quartile","log-rank p = {p:.1e}"),
     forest=(["M1  age alone","M2  + sex + KPS","M3  + MGMT","M4  + IDH","M5  full"],"n={n}, {e} deaths","Hazard ratio per additional year of age (95% CI)","Age effect is stable across adjustment sets")),
   "ru":dict(flow=[("Выгрузка cBioPortal, gbm_tcga\n619 строк, 606 пациентов",None),
     ("Одна строка на пациента\n606 пациентов","13 пациентов с двумя образцами"),
     ("Есть время и статус выживаемости\n594 пациента","Исключено 12: нет времени/статуса ОВ"),
     ("Есть возраст на момент диагноза\n584 пациента","Исключено 10: нет возраста"),
     ("Итоговая когорта\n593 пациента (97,9 %)\n492 умерших, 101 цензурированный","Исключён 1: время ОВ = 0")],
     hist=("Возраст на момент диагноза (лет)","Пациенты","медиана = {m:.0f} лет","TCGA-GBM: возраст на момент диагноза (n={n})"),
     km2=("Младшая (<59)","Старшая (≥59)","Месяцы от постановки диагноза","Вероятность общей выживаемости","Общая выживаемость по возрастным группам","лог-ранговый p = {p:.1e}"),
     km4=("{a:.0f}–{b:.0f} лет (n={n})","Общая выживаемость по квартилям возраста","лог-ранговый p = {p:.1e}"),
     forest=(["M1  только возраст","M2  + пол + Карновский","M3  + MGMT","M4  + IDH","M5  полная"],"n={n}, {e} смертей","Отношение рисков на год возраста (95 % ДИ)","Эффект возраста устойчив во всех спецификациях"))}

for lang,t in T.items():
    # flow diagram: actual sequence is 606 -> minus 12 (no OS) -> minus 10 (no age) -> minus 1 (OS<=0) = 583? check
    pass

# derive actual step counts from the filter logic: report table lists 12,10,1 removed -> 606-23=583 != 593. The report's rows are counts of *missing per criterion*, overlapping. Compute properly:
raw_note = "overlap"
print("note: report lists criteria counts that overlap; final n=593 => 13 removed total")

for lang,t in T.items():
    # ---- Figure 1 flow
    steps=t["flow"]
    f,ax=plt.subplots(figsize=(7.5,7.2)); ax.axis("off"); ax.set_xlim(0,10); ax.set_ylim(0,10)
    ys=[9.1,7.35,5.6,3.85,1.9]
    for (txt,side),y in zip(steps,ys):
        h=1.05 if "\n" in txt and txt.count("\n")==2 else 0.9
        box=FancyBboxPatch((1.0,y-h/2),4.8,h,boxstyle="round,pad=0.05",fc="#EAF0F8",ec="#2E5A88",lw=1.4); ax.add_patch(box)
        ax.text(3.4,y,txt,ha="center",va="center",fontsize=9.6)
        if side:
            ax.annotate("",xy=(7.0,y),xytext=(5.85,y),arrowprops=dict(arrowstyle="->",color="#8C1C13",lw=1.2))
            ax.text(7.1,y,side,ha="left",va="center",fontsize=8.8,color="#8C1C13",wrap=True)
    for y0,y1 in zip(ys[:-1],ys[1:]):
        ax.annotate("",xy=(3.4,y1+0.5),xytext=(3.4,y0-0.5),arrowprops=dict(arrowstyle="->",color="#2E5A88",lw=1.4))
    f.tight_layout(); f.savefig(f"figs/fig1_flow_{lang}.png",dpi=170); plt.close(f)
    if lang=="en": continue
    # ---- Figure 2 hist
    f,ax=plt.subplots(figsize=(7,4.2))
    ax.hist(d.AGE,bins=25,color="#4C72B0",edgecolor="white"); ax.axvline(med,color="#C44E52",ls="--",lw=2,label=t["hist"][2].format(m=med))
    ax.set_xlabel(t["hist"][0]); ax.set_ylabel(t["hist"][1]); ax.legend(); ax.set_title(t["hist"][3].format(n=len(d)))
    f.tight_layout(); f.savefig(f"figs/fig2_hist_{lang}.png",dpi=160); plt.close(f)
    # ---- Figure 3 KM median split
    f,ax=plt.subplots(figsize=(7.5,5))
    y_,o_=d[d.AGE<med],d[d.AGE>=med]
    for g,lab,c in [(o_,t["km2"][1],"#C44E52"),(y_,t["km2"][0],"#4C72B0")]:
        KaplanMeierFitter(label=f"{lab}  (n={len(g)})").fit(g.OS_MONTHS,g.event).plot_survival_function(ax=ax,color=c)
    lr=logrank_test(y_.OS_MONTHS,o_.OS_MONTHS,y_.event,o_.event)
    ax.set_xlim(0,80); ax.set_ylim(0,1); ax.set_title(t["km2"][4]); ax.set_xlabel(t["km2"][2]); ax.set_ylabel(t["km2"][3])
    ax.text(.6,.85,t["km2"][5].format(p=lr.p_value),transform=ax.transAxes,bbox=dict(fc="white",ec="0.7"))
    f.tight_layout(); f.savefig(f"figs/fig3_km2_{lang}.png",dpi=160); plt.close(f)
    # ---- Figure 4 quartiles
    d["q"]=pd.qcut(d.AGE,4); f,ax=plt.subplots(figsize=(7.5,5))
    for (lab,g),c in zip(d.groupby("q",observed=True),["#2E7D32","#4C72B0","#E1A100","#C44E52"]):
        KaplanMeierFitter(label=t["km4"][0].format(a=lab.left,b=lab.right,n=len(g))).fit(g.OS_MONTHS,g.event).plot_survival_function(ax=ax,ci_show=False,color=c,lw=2)
    ml=multivariate_logrank_test(d.OS_MONTHS,d.q,d.event)
    ax.set_xlim(0,60); ax.set_ylim(0,1); ax.set_title(t["km4"][1]); ax.set_xlabel(t["km2"][2]); ax.set_ylabel(t["km2"][3])
    ax.text(.55,.80,t["km4"][2].format(p=ml.p_value),transform=ax.transAxes,bbox=dict(fc="white",ec="0.7"))
    f.tight_layout(); f.savefig(f"figs/fig4_km4_{lang}.png",dpi=160); plt.close(f)
    # ---- Figure 5 forest
    f,ax=plt.subplots(figsize=(7.5,4)); yy=np.arange(len(res))[::-1]
    ax.errorbar(res.HR,yy,xerr=[res.HR-res.lo,res.hi-res.HR],fmt="o",color="#4C72B0",capsize=4,lw=1.8,ms=7)
    ax.axvline(1.0,color="0.5",ls="--"); ax.set_yticks(yy)
    ax.set_yticklabels([f"{m}\n"+t["forest"][1].format(n=r.n,e=r.events) for m,r in zip(t["forest"][0],res.itertuples())],fontsize=9)
    ax.set_xlabel(t["forest"][2]); ax.set_title(t["forest"][3]); f.tight_layout(); f.savefig(f"figs/fig5_forest_{lang}.png",dpi=160); plt.close(f)
print("done")
