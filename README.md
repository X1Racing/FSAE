# FSAE Chassis Builder

**Version 1.1** · by Mac McAlpine, [X1Racing.com](https://x1racing.com) · [MIT License](LICENSE)

A single-page web app that designs a rule-compliant Formula SAE tube-frame chassis around a hypothetical single-cylinder engine, solves the suspension, steering and shocks, and exports every part ready to order from SendCutSend or OSHcut.

> This version shows the workflow and the parametric thinking that super-intelligent design tools make possible. Rebuild the design around 3D models of your real engine, shocks, uprights, axles, wheels and battery before you order anything.

## What it does
- **FSAE rule checks, kept separate from the builder's own design checks:** 95th percentile template and rollover envelope (front-hoop line and the main-hoop-to-brace line), Size A/B/C tubing, bent front and main hoops, bracing, side impact, front bulkhead and its triangulation, firewall, harness eyes, wheelbase, track and travel.
- **Suspension and steering:** selectable camber gain, zero-bump-steer tie rods, solved Ackermann, a 3D linkage solve with camber, toe and Ackermann plots, and animated travel.
- **Shocks:** FOX DHX / DHX2 coil-overs from a catalog, picked separately front and rear (the rear defaults to a longer DHX 230 x 65). Front eyes on a through-bolt in both lower-arm legs; rear eyes on a compact clevis ear on the upright that straddles the toe link to keep the steer moment low. Spring and damper clearance through travel.
- **Fabrication:** laser-cut self-jigging uprights, turned clevis tabs, coped tubes, bent hoops, and sheet-metal build jigs (two plates per tube, clear of the welds, egg-crated onto spars that hook over the center section).
- **Human factors:** seated driver template with seat shell and foam over the floor tubes, wheel, column, U-joints, pedal box, and an animated egress.
- **Ready to order:** one STEP package: a STEP solid per part (straight tubes laid along +Y as tube-laser shops ask), the frame assembly, plate DXFs, tube cope templates, hoop drawings, a manifest and design.json. Save and Load a design.json to share a design.

## Run it
Open `index.html` in a browser. The page loads [three.js r128](https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js), [OrbitControls](https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js), and [JSZip](https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js) from public CDNs, and typefaces from Google Fonts. In-page links are relative or hashes, so the file also runs under the GitHub Pages project path `/FSAE/`.

## GitHub Pages
The site is not live until this change is merged and Pages is enabled.

1. Merge into `main`.
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. `.github/workflows/pages.yml` rebuilds `index.html` and publishes it with `LICENSE` and this notice. The project URL is `https://x1racing.github.io/FSAE/`.

Paths are case-sensitive on Pages. Use `index.html` and `LICENSE` exactly. No root-absolute or machine-local assets are required to run the builder.

## Develop
```
src/shell.html   page markup and styles (welcome page + builder)
src/core.js      geometry engine: suspension, steering, shocks, frame, copes, plates, jigs, DXF, STEP, rules, costing
src/app.js       UI, 3D view, charts, DXF viewer, egress animation, exports
build.py         assembles index.html (or dist/artifact.html for claude.ai)
tools/           STEP generator for tests, independent STEP validator, hero image generator
docs/prompt.md   the prompt that builds this tool
```
```
python build.py                      # writes index.html
node tools/gen_step.js               # writes STEP files to out/ from the default design
python tools/validate_step.py 'out/*.step'
```

## Ordering notes
- SendCutSend and OSHcut cut tubes from 3D STEP files, one straight tube per file. SendCutSend's published 4130 round list is short (1.000 x .095 and 1.000 x .065 in at the time of writing); the builder flags tube sizes outside it.
- The bent hoops are over 60 in and need a tube bender, not a tube laser.

## License
MIT License. Copyright (c) 2026 Mac McAlpine, X1 Racing. See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md). The X1 Racing name and logo are trademarks and are not covered by the license. CDN libraries and fonts stay under their own licenses.

More from X1 Racing: [fly the sim](https://x1racing.com/sim) · [Flying Car Regulation Breakout](https://x1racing.com/game) · [design your own rule-compliant X1 Racing SkyRacer](https://buildflyingcars.com)
