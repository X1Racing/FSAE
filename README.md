# FSAE Chassis Builder

**Version 1.3** · by Mac McAlpine, [X1Racing.com](https://x1racing.com) · [MIT License](LICENSE)

**Open the builder:** [https://x1racing.com/fsae](https://x1racing.com/fsae)

That is the live page for this project.

The copy in this repository is [`index.html`](./index.html). Download that file and open it in a browser to run the builder on your own machine.

Set the wheelbase, driver fit, and suspension targets. The builder solves a tube-frame chassis around a hypothetical single-cylinder engine, checks it against Formula SAE rules, and writes STEP and DXF files for SendCutSend or OSHcut. Treat the result as a rule-minded baseline. Swap in 3D models of the engine, driveline, and hubs you will actually use before you order parts.

> This version is meant to show the workflow and the parametric thinking that super-intelligent design tools make possible. It is not a finished, build-ready car. Before you order anything, rebuild the design around 3D models of the parts you will actually use: engine, shocks, spindles, axles, wheels, battery, and the rest. Then check every fit, load, and rule yourself.

## What it does

One parametric model, from rules to cut files.

- **Rules.** 95th percentile driver template, Size A, B, and C tubing, bent front and main hoops and bracing, side impact, front bulkhead support triangulation, and firewall. Checks update as you change inputs. Formula SAE rule checks stay separate from the builder's own design checks (suspension, shocks, uprights, steering, packaging, human factors, and build jigs).
- **Suspension and steering.** Choose front and rear camber gain. Pickups move to hit that gain, tie rods are placed for near-zero bump steer, and the steering arm angle is solved toward an Ackermann target. A 3D linkage solve plots camber, toe, and Ackermann. Suspension travel can be animated.
- **Shocks.** FOX DHX and DHX2 coil-overs from a catalog, chosen separately front and rear. The rear defaults to a longer DHX 230 × 65. Front eyes sit on a through-bolt through both lower-arm legs. Rear eyes sit on a compact clevis on the upright that straddles the toe link. The builder checks spring and damper clearance through travel and reports steer moment from the rear shock.
- **Driver.** A 95th percentile driver sets hoop heights, seat, pedal box, and wheel reach, with clearance checks for legs, rack, and column. The driver sits on a seat shell and foam over the floor tubes. Egress can be animated.
- **Drivetrain.** Chain drive to a limited-slip differential with halfshafts. Laser-cut uprights use bolt-on flange bearings and Wilwood PS-1 calipers, with a laser-cut rotor and a simple hub. Wheels are generic 13 in or 10 in, with a place for a small motorcycle battery.
- **Fabrication model.** Laser-cut self-jigging uprights, turned clevis tabs, coped tubes, bent hoops, and sheet-metal build jigs: two plates per tube, clear of the welds, egg-crated onto spars that hook over the center section. Coped tube ends are drawn the way a tube laser cuts them: bevels held within 45 degrees, with the deeper edge kept on the mating tube.
- **Parts.** Click a tube or plate in the list or the 3D view to open its drawing. Save and load a `design.json` to share a design.

## From inputs to files

1. Open the builder and set vehicle, driver, suspension, and shock inputs in the left rail.
2. Watch the Checks tab. Fix any Formula SAE rule failure, then review the design checks.
3. Use the Geometry tab for camber, bump steer, Ackermann, uprights, and shocks.
4. Press Optimize to search the main dimensions for a lighter, cheaper frame that still passes the hard rule checks.
5. Export one STEP package. Upload those files to [SendCutSend](https://sendcutsend.com) or [OSHcut](https://www.oshcut.com) when you want a price from the vendor.

The package contains a STEP solid per part (straight tubes laid along +Y, as tube-laser shops ask), the frame assembly, plate DXFs, 1:1 tube cope templates, hoop drawings, a manifest, and `design.json`.

Prices inside the builder are planning estimates from editable rates. They are not a quote. Vendor prices come from uploading the files on the vendor's site. SendCutSend's published 4130 round list is short (1.000 × .095 in and 1.000 × .065 in at the time of writing); the builder flags tube sizes outside it. The bent hoops are over 60 in and need a tube bender, not a tube laser.

Straight tubes in the STEP files lie along +Y from the origin, one file per tube. OSHcut's material map uses 4130 sheet and round tube where that shop stocks them, and it notes a substitution when it does not.

Version 1.3 bends the front and main hoops at a 76.2 mm (3.0 in) centerline radius, the radius of a 1.0 in round-tube die and the 3 × OD minimum for 1.0 in Size A tube. The builder also checks each hoop against OSHcut's bender limits: stocked 4130, at least 2.25 in of straight tube between bends and at the ends, and a developed length no longer than 235 in. Those shop checks are warnings. A live quote still lists OSHcut's own per-part manufacturability errors and warnings only when the claude.ai connector actually returns them.

## Live OSHcut quote

A live cart quote is available only inside claude.ai, and only after you add your own OSH Cut connector (Settings → Connectors, name `oshcut`, server URL `https://app.oshcut.com/api/mcp`) and press **Quote this design on OSHcut**. The hosted page at [x1racing.com/fsae](https://x1racing.com/fsae) and any ordinary browser do not have `window.claude.use`. Opening the quote there does not upload parts, request a price, or invent one. Export the STEP package and upload it yourself. Nothing is ordered until you check out on OSHcut.

## Run and build locally

Download [`index.html`](./index.html) and open it in a browser. The page loads [three.js r128](https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js), [OrbitControls](https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js), and [JSZip](https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js) from public CDNs, and typefaces from Google Fonts.

Rebuild the page from source, or generate and check STEP files for the default design:

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

## License

MIT License. Copyright (c) 2026 Mac McAlpine, X1 Racing. See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md).

The code, the prompt, and the files the builder exports are under that license. The X1 Racing name and logo are trademarks and are not covered by it. three.js, OrbitControls, JSZip, and the Google Fonts on the page stay under their own licenses.

Credit line: "FSAE Chassis Builder by Mac McAlpine, X1Racing.com, licensed under the MIT License."

## Before you cut metal

Design output is a study model. Verify it against the current Formula SAE rules and your own engineering review before fabrication. The export notes that harness eyes must be supplier weld-on eyes over a welded tube insert, and that no laser-cut harness tabs are included. Impact attenuator, anti-intrusion plate, head restraint, bodywork, and brake lines are outside the package. Rebuild around the real engine, shocks, spindles, axles, wheels, and battery, then check every fit, load, and rule yourself.

## About

Mac McAlpine founded X1 Racing. He is a former mentor of the UNC Charlotte FSAE team and a former professor of Advanced Motorsports Instrumentation, Electric Drivetrains, and Senior Design at UNC Charlotte. He was a research and development engineer for Michael Waltrip Racing and a support engineer for Pi Research, now Cosworth Electronics. He holds a BS in Computer Engineering and an MS in Industrial Management, both from Clemson University.

The welcome page points people interested in FSAE to Jim Fox at UNC Charlotte's Alan D. Kulwicki Motorsports Laboratory: [Jim Fox](https://engineering.charlotte.edu/people/james-fox/), [Motorsports at UNC Charlotte](https://motorsports.charlotte.edu/), [UNC Charlotte](https://www.charlotte.edu).

More from X1 Racing: [fly the sim](https://x1racing.com/sim) · [Flying Car Regulation Breakout](https://x1racing.com/game) · [design your own rule-compliant X1 Racing SkyRacer](https://buildflyingcars.com)
