# -*- coding: utf-8 -*-
"""Figure 1: cohort flow diagram, EN + RU.
Every box is drawn AFTER its text is measured, so text can never spill over a border."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
from matplotlib.transforms import Bbox

plt.rcParams["font.family"] = "DejaVu Sans"

T = {
 "en": dict(
   main=["cBioPortal export, study gbm_tcga\n619 sample rows, 606 patients",
         "One row per patient\n606 patients",
         "Final cohort: age and survival known\n593 patients (97.9%)\n492 deaths (83.0%), 101 censored (17.0%)"],
   dup="13 patients gave two samples each.\nWe kept the row with the longer\nrecorded follow-up time.",
   excl="Excluded: 13 patients (criteria overlap)\nno survival time or status: 12\nno age at diagnosis: 10\nsurvival time = 0 months: 1",
   covtitle="Data available for the 593 patients",
   cov=[("Sex", "593"), ("Karnofsky score", "439"), ("MGMT methylation", "413"),
        ("IDH1/IDH2 status", "285"), ("All five variables", "174")]),
 "ru": dict(
   main=["Выгрузка cBioPortal, исследование gbm_tcga\n619 строк (образцов), 606 пациентов",
         "Одна строка на пациента\n606 пациентов",
         "Итоговая когорта: известны возраст и выживаемость\n593 пациента (97.9 %)\n492 умерших (83.0 %), 101 цензурирован (17.0 %)"],
   dup="У 13 пациентов было по два образца.\nМы оставили строку с большим\nзаписанным временем наблюдения.",
   excl="Исключено: 13 пациентов (критерии пересекаются)\nнет времени/статуса выживаемости: 12\nнет возраста на момент диагноза: 10\nвремя выживаемости = 0 мес.: 1",
   covtitle="Данные, доступные для 593 пациентов",
   cov=[("Пол", "593"), ("Индекс Карновского", "439"), ("Метилирование MGMT", "413"),
        ("Статус IDH1/IDH2", "285"), ("Все пять переменных", "174")]),
}

BLUE_F, BLUE_E = "#EAF0F8", "#2E5A88"
RED_F, RED_E, RED_T = "#FBEEEC", "#8C1C13", "#5A1610"


def fit(ax, fig, x, y, text, w, h, ha="center", color="black", weight="normal",
        fs_max=9.6, fs_min=5.6, padx=0.22, pady=0.14):
    """Place text and shrink the font until it fits inside a w x h data-unit box."""
    fs = fs_max
    while True:
        t = ax.text(x, y, text, ha=ha, va="center", fontsize=fs, color=color, weight=weight)
        fig.canvas.draw()
        bb = t.get_window_extent(fig.canvas.get_renderer())
        bb = Bbox(ax.transData.inverted().transform(bb))
        if (bb.width <= w - 2 * padx and bb.height <= h - 2 * pady) or fs <= fs_min:
            return t
        t.remove()
        fs -= 0.3


def box(ax, cx, cy, w, h, fc, ec, lw=1.4):
    ax.add_patch(FancyBboxPatch((cx - w / 2, cy - h / 2), w, h,
                                boxstyle="round,pad=0.04", fc=fc, ec=ec, lw=lw, zorder=1))


def arrow(ax, x0, y0, x1, y1, color=BLUE_E, lw=1.4):
    ax.annotate("", xy=(x1, y1), xytext=(x0, y0),
                arrowprops=dict(arrowstyle="->", color=color, lw=lw))


for lang, t in T.items():
    fig, ax = plt.subplots(figsize=(8.2, 8.0))
    ax.set_xlim(0, 10); ax.set_ylim(1.1, 9.9); ax.axis("off")

    # --- main chain (left column) ---
    MW, MCX = 5.4, 3.0                       # main box width, centre x
    rows = [(9.25, 0.95), (7.45, 0.85), (5.55, 1.25)]
    for (cy, h), txt in zip(rows, t["main"]):
        box(ax, MCX, cy, MW, h, BLUE_F, BLUE_E)
        fit(ax, fig, MCX, cy, txt, MW, h, fs_max=9.4)
    for (y0, h0), (y1, h1) in zip(rows[:-1], rows[1:]):
        arrow(ax, MCX, y0 - h0 / 2, MCX, y1 + h1 / 2)

    # --- duplicate-samples note (right of the first arrow) ---
    NX = MCX + MW / 2 + 0.55                 # left edge of the right-hand column
    ax.plot([MCX + MW / 2 + 0.05, NX - 0.1], [8.35, 8.35], color="0.45", lw=1, zorder=0)
    fit(ax, fig, NX, 8.35, t["dup"], (9.9 - NX) * 2, 1.1, ha="left", color="0.25",
        fs_max=8.6, padx=0.0)

    # --- exclusion box (right of the second arrow) ---
    EW = 9.9 - NX
    ECX, ECY, EH = NX + EW / 2, 6.45, 1.55
    box(ax, ECX, ECY, EW, EH, RED_F, RED_E, lw=1.3)
    fit(ax, fig, ECX, ECY, t["excl"], EW, EH, color=RED_T, fs_max=8.6)
    arrow(ax, MCX, ECY, NX - 0.02, ECY, color=RED_E, lw=1.2)

    # --- covariate availability list ---
    arrow(ax, MCX, rows[2][0] - rows[2][1] / 2, MCX, 4.62)
    fit(ax, fig, MCX - MW / 2, 4.35, t["covtitle"], MW * 2, 0.6, ha="left",
        weight="bold", fs_max=9.8, padx=0.0, pady=0.04)
    y, RH = 3.88, 0.46
    for name, n in t["cov"]:
        box(ax, MCX, y, MW, RH, "#F5F7FA", "#B7C3D3", lw=0.9)
        fit(ax, fig, MCX - MW / 2 + 0.25, y, name, MW * 0.66, RH, ha="left", fs_max=9.0, padx=0.0)
        fit(ax, fig, MCX + MW / 2 - 0.25, y, "n = " + n, MW * 0.3, RH, ha="right", fs_max=9.0, padx=0.0)
        y -= RH + 0.12

    fig.savefig(f"figs/fig1_flow_{lang}.png", dpi=170, bbox_inches="tight")
    plt.close(fig)

print("flow diagrams written")
