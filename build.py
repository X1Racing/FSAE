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
    # shell.html starts with a title for the artifact body. The hosted page keeps that title in head.
    title_prefix = "<title>FSAE Chassis Builder</title>"
    page_body = body[len(title_prefix):].lstrip("\n") if body.startswith(title_prefix) else body
    head = (
        "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">"
        "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">"
        "<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}"
        "body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>"
        "<title>FSAE Chassis Builder</title>"
        "<meta name=\"description\" content=\"Design a rule-compliant FSAE chassis in your browser: set wheelbase, driver fit and suspension, check it against the Formula SAE rules, and export STEP and DXF files. Free and open source from X1 Racing.\">"
        "<link rel=\"canonical\" href=\"https://x1racing.com/fsae\">"
        "<meta property=\"og:type\" content=\"website\">"
        "<meta property=\"og:site_name\" content=\"X1 Racing\">"
        "<meta property=\"og:url\" content=\"https://x1racing.com/fsae\">"
        "<meta property=\"og:title\" content=\"FSAE Chassis Builder\">"
        "<meta property=\"og:description\" content=\"Design a rule-compliant FSAE chassis in your browser: set wheelbase, driver fit and suspension, check it against the Formula SAE rules, and export STEP and DXF files. Free and open source from X1 Racing.\">"
        "<meta property=\"og:image\" content=\"https://x1racing.com/fsae-home-social-1200x630.jpg\">"
        "<meta property=\"og:image:width\" content=\"1200\">"
        "<meta property=\"og:image:height\" content=\"630\">"
        "<meta property=\"og:image:alt\" content=\"FSAE Chassis Builder welcome page: Design a rule-compliant FSAE chassis, then order the parts, with an illustrated single-cylinder FSAE frame and the X1 Racing logo\">"
        "<meta name=\"twitter:card\" content=\"summary_large_image\">"
        "<meta name=\"twitter:site\" content=\"@realx1racing\">"
        "<meta name=\"twitter:title\" content=\"FSAE Chassis Builder\">"
        "<meta name=\"twitter:description\" content=\"Design a rule-compliant FSAE chassis in your browser: set wheelbase, driver fit and suspension, check it against the Formula SAE rules, and export STEP and DXF files. Free and open source from X1 Racing.\">"
        "<meta name=\"twitter:image\" content=\"https://x1racing.com/fsae-home-social-1200x630.jpg\">"
        "<meta name=\"twitter:image:alt\" content=\"FSAE Chassis Builder welcome page: Design a rule-compliant FSAE chassis, then order the parts, with an illustrated single-cylinder FSAE frame and the X1 Racing logo\">"
        "</head><body>"
    )
    page = head + page_body + "</body></html>"
    (root / "index.html").write_text(page)
    print("wrote index.html")
