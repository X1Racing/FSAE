# Changelog

## 1.5 (2026-11-08)
- Licensed under the MIT License. See LICENSE and NOTICE.md. Trademarks stay reserved.
- Every tube now passes OSHcut's tube check: coped ends are cut at no more than 44 degrees from square, verified on OSHcut (S01 and S08 measured 44.0 and 44.1 degrees, no warnings).
- Tube end cut paths spaced about 1.1 mm apart (44 points on 5/8 in tube, 72 on 1 in). Finer spacing made OSHcut read false bevel spikes up to 57 degrees.
- Suspension arm tube is 0.625 x 0.065 in 4130, the wall OSHcut stocks (was 0.049, which OSHcut was substituting).
- Brake pedal ratio holes 16 mm apart so they no longer overlap; new check that plate holes leave a solid web between them.
- The OSHcut quote window shows OSHcut's own measured bevel and pivot angles on any tube it flags.
- Smaller STEP files (shared points, 5-decimal coordinates).

## 1.4 (2026-11-08)
- "Quote on OSHcut" is a prominent header button: one press uploads every laser-cut part to the viewer's OSHcut cart through the OSH Cut connector and prices it, with no AI in the loop; the cheapest total and a cart link show under the button.
- SendCutSend reduced to a small note: plates only, the tubes need a shop with laser tube cutting.

## 1.3 (2026-11-08)
- Hoops bent to OSHcut's tooling: 3.0 in (76.2 mm) centerline radius on their 1.0 in round-tube die, which is also the FSAE 3 x OD minimum.
- New checks: FSAE hoop bend radius at least 3 x OD; each hoop fits OSHcut's bender (stocked 4130 tube, 2.25 in minimum straight between bends and at the ends, 235 in maximum length).
- Live OSHcut quote lists OSHcut's own manufacturability errors and warnings per part.

## 1.2 (2026-11-08)
- Live OSHcut quote: sends every laser part (STEP, quantity, OSHcut material) to the viewer's own OSHcut cart through the claude.ai OSH Cut connector and prices it per lead time; shows OSHcut's manufacturability errors and warnings per part; a re-quote replaces the builder's earlier parts in the cart.
- OSHcut material map: 4130 sheet and round tube where stocked, noted substitutions otherwise.
- Coped tube ends drawn the way a tube laser cuts them: bevels held within 45 degrees, the deeper edge kept on the mating tube so the joint fits before welding.
- Straight tubes in the STEP files lie along +Y from the origin, one per file.
- One "Export STEP package" button; Save and Load design.json.
- Homepage: setup steps for the OSHcut connector.

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

## 1.0 (2026-11-06)
- Parametric FSAE tube frame: 95th percentile template, Size A/B/C tubing, hoop and brace rules checked live.
- Double-wishbone suspension with selectable camber gain, zero-bump-steer tie-rod placement, solved Ackermann, 3D linkage solve and animated travel.
- Rod-end spec driving cut lengths and clevis tabs; fixed or driven rack width with stroke check.
- Human factors: driver mannequin, seat, wheel, column and U-joints, pedal box, battery mount.
- Per-part DXF viewer; exact STEP (AP214) for coped tubes, bent hoops and the frame assembly.
- Welcome page and build prompt.
