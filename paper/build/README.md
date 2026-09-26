# Paper generator
`content_en.py` / `content_ru.py` hold the full text, tables and figure captions. `build_docx.py` renders them into
the supervisor's template (`template.docx`) with numbered Vancouver references resolved automatically.
```
cd paper/build
python build_docx.py en ../Research_Paper_EN.docx
python build_docx.py ru ../Исследовательская_работа_RU.docx
```
Figures live in `figs/` (`make_flow.py` draws Figure 1; `make_figs.py` the Russian-labelled versions of Figures 2–5;
Figures 6–7 come from `analysis/compare_cohorts.py`, Figure 8 is a screenshot of the calculator).
