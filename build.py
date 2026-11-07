"""Assemble the single-file app.
  python build.py            -> index.html (standalone page for GitHub Pages or any web host)
  python build.py --artifact -> dist/artifact.html (body-only page for a claude.ai artifact)
"""
import sys, pathlib
root = pathlib.Path(__file__).parent
shell = (root / "src/shell.html").read_text()
core = (root / "src/core.js").read_text().replace(
    "if (typeof module !== 'undefined') module.exports",
    "if (typeof module !== 'undefined' && typeof window === 'undefined') module.exports")
app = (root / "src/app.js").read_text()
body = shell.replace("/*CORE*/", core).replace("/*APP*/", app)
if "--artifact" in sys.argv:
    (root / "dist").mkdir(exist_ok=True)
    (root / "dist/artifact.html").write_text(body)
    print("wrote dist/artifact.html")
else:
    page = ("<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">"
            "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">"
            "<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}"
            "body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>"
            "</head><body>" + body + "</body></html>")
    (root / "index.html").write_text(page)
    print("wrote index.html")
