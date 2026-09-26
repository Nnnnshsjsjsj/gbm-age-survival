#!/usr/bin/env python3
"""Inline app/explorer_data.json into app/explorer_template.html -> app/explorer.html and docs/index.html (the public page)."""
import json, os
data = json.load(open("app/explorer_data.json"))
html = open("app/explorer_template.html", encoding="utf8").read()
assert "/*__DATA__*/null" in html
out = html.replace("/*__DATA__*/null", json.dumps(data, separators=(",", ":"), ensure_ascii=False))
os.makedirs("docs", exist_ok=True)
for p in ["app/explorer.html", "docs/index.html"]:
    open(p, "w", encoding="utf8").write(out)
print("written app/explorer.html and docs/index.html", f"{len(out.encode())/1024:.0f} KB")
