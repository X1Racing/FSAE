# The prompt behind the FSAE chassis builder

Build a single-page web app: a parametric 3D model builder for a Formula SAE car chassis, around a hypothetical single-cylinder engine.

Rules and frame
- Rule compliant with the current Formula SAE rules: 95th percentile driver template, Size A/B/C steel tubing, front and main hoop geometry and bracing, side impact structure, front bulkhead and firewall. Show a rules panel with pass / warn / fail for every check.
- Model both hoops as bent tube on a real centerline radius, in the viewer and in the STEP files. Any tube that meets a hoop at a bend must end on the bend, not the sharp corner, and the front hoop braces must land within 50 mm of the top.
- Triangulate every bay of the front bulkhead support with tubes. Leave room between the front suspension and the front hoop so the transition tubes stay at buildable angles; lengthen the wheelbase rather than squeeze the cockpit.
- Run the frame rails straight and parallel to the pivot line wherever a clevis tab sits, keep every tab clear of tube nodes and of the other tabs on the same rail, and make sure every plate of every tab pair actually seats on its tube.

Drivetrain, uprights and suspension
- Design it around a hypothetical single-cylinder engine with chain drive, a limited-slip rear differential with halfshafts, and rear-wheel drive. Use generic wheels and tires and a place for a small motorcycle battery.
- Design fabricated uprights from laser-cut flat plate around a low-cost lightweight caliper, a laser-cut rotor, bolt-on flange bearings and a simple hub, with no machining. Make the plates self-jigging with tab-and-slot. Every joint at the upright uses a standard catalog rod end held by a single bolt, stacked on top of or under its mounting ear.
- Build each A-arm from two legs coped onto one apex bung with a single rod end. Turn each inboard clevis pair square to its arm leg.
- Let the user select front and rear camber gain and place the pickups to hit it. Design for near-zero bump steer and ideal Ackermann, verify both with a 3D linkage solve, and plot camber, toe and Ackermann curves.
- Add a rod-end spec used by every arm, tie rod and toe link: size, and the offset from ball center to tube end face, which sets tube cut lengths and clevis tabs.
- Show the steering rack inner-pivot width when it is driven by the zero-bump-steer geometry, and allow a fixed width to match a purchased rack, with a stroke check.

Shocks
- Model popular FSAE coil-overs (FOX DHX / DHX2 coil, catalog eye-to-eye and stroke) as real dampers with springs, not keep-out zones. Ride-height sag sets the installed length.
- Front: short shocks from tabs off the upper frame rail to a through-bolt that runs along the pivot axis through weld-in sleeves in both lower-arm legs, with the eye on spacers between them. Size the lower-arm legs for a 3 g bump.
- Rear: tabs off the upper rail on top; the lower eye ties to the upright in a clevis that straddles the toe link, placed to keep the steer moment from shock loads low. Report the steer moment and the load it puts into the toe link, and offer the least-steer-moment position as an option.
- Check spring and damper clearance to arms, links, frame, halfshafts and tires through travel, bump and droop against the stroke, and flag side-view lean that needs spherical-bearing eyes. Let the user show or hide the clearance envelopes in the 3D view.

Human factors, viewer and parts
- Model human factors and steering: driver mannequin, seat, steering wheel, column, U-joints, rack and tie rods, and all brake and pedal components. Skip brake tubing and throttle cables.
- Show the frame in 3D with animated suspension travel and a button that automatically orbits the view.
- Optimize for weight and cost, with a button that searches the main dimensions for the lightest, cheapest frame that still passes every rule check.
- List every tube, plate, arm, link and turned part. Clicking a part in the list or the 3D view opens a simple DXF viewer for that part.

Exports
- Add a prominent Quote on OSHcut button that runs from the page itself through the viewer's OSH Cut connector (no AI in the loop): upload every laser part with its quantity and OSHcut material, price the cart per lead time, list OSHcut's manufacturability warnings, and link to the cart for checkout.
- Export one STEP package for OSHcut or any shop with laser tube cutting (SendCutSend can cut the plates only). Every part gets a drawing and a STEP model: coped tubes, both bent hoops, arm legs and links, plates as solids, turned parts and the full frame assembly. Include plate DXFs that follow each vendor's file rules, 1:1 tube wrap templates, a parts manifest and an order sheet, and check that each package covers every part.
- Show estimated pricing with editable rates, and get live pricing from the vendor if it can be automated.
