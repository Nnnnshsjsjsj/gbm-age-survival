#!/usr/bin/env python3
"""Inline every app/models_*.json into app/template.html -> app/index.html (single self-contained file)."""
import json, glob, os
models = {}
for f in sorted(glob.glob("app/models_*.json"), key=lambda f: (0 if "tcga" in f else 1, f)):
    j = json.load(open(f)); models[j["cohort"]] = j
    print(f"{f}: {j['cohort']} n={j['n_total']} models={len(j['models'])}")
html = open("app/template.html", encoding="utf8").read()
assert "/*__MODELS__*/{}" in html
out = html.replace("/*__MODELS__*/{}", json.dumps(models, separators=(",", ":")))
cmp = json.load(open("app/compare.json")) if os.path.exists("app/compare.json") else None
out = out.replace("/*__COMPARE__*/null", json.dumps(cmp, separators=(",", ":")))
open("app/index.html", "w", encoding="utf8").write(out)
os.makedirs("docs", exist_ok=True); open("docs/index.html", "w", encoding="utf8").write(out)
print("app/index.html + docs/index.html", f"{os.path.getsize('app/index.html')/1024:.0f} KB, cohorts:", list(models))
