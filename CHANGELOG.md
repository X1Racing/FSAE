# Changelog

## 1.1 (2026-11-07)
- Renamed to FSAE Chassis Builder; designed around a hypothetical single-cylinder engine.
- Checks split into FSAE rule checks and builder design checks; new rule check for the helmet against the main-hoop-to-brace line (the main hoop is sized for it).
- FOX DHX / DHX2 coil-over catalog with separate front and rear selection; rear defaults to DHX 230 x 65. Compact cantilevered shock ear on the rear upright, straddling the toe link.
- Short front shocks on a through-bolt in both lower-arm legs; rear shocks on upper tabs.
- Bent hoops modeled in the viewer and STEP; members at bends land on the arc.
- Front pickup top cross over the driver's legs removed; nose top diagonal added. Differential carrier plates cut back for the rear bulkhead diagonal.
- Driver raised onto a seat shell and foam clear of the floor tubes; animated egress with a wave.
- Sheet-metal build jigs: two plates per tube clear of the welds, longitudinal spars that egg-crate the plates and hook over the hoop floor crosses.
- One STEP package export for SendCutSend or OSHcut, with straight tubes laid along +Y; Save and Load design.json.
- Homepage: disclaimer, sections, flying-car section, About the author.
- Licensed under the MIT License. See LICENSE and NOTICE.md. Trademarks stay reserved.

## 1.0 (2026-11-06)
- Parametric FSAE tube frame: 95th percentile template, Size A/B/C tubing, hoop and brace rules checked live.
- Double-wishbone suspension with selectable camber gain, zero-bump-steer tie-rod placement, solved Ackermann, 3D linkage solve and animated travel.
- Rod-end spec driving cut lengths and clevis tabs; fixed or driven rack width with stroke check.
- Human factors: driver mannequin, seat, wheel, column and U-joints, pedal box, battery mount.
- Per-part DXF viewer; exact STEP (AP214) for coped tubes, bent hoops and the frame assembly.
- Welcome page and build prompt.
