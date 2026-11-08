/* ===== App ===== */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SCHEMA = [
  ['Vehicle', [
    ['wheelbase', 'Wheelbase', 1525, 1800, 5, 1650, 'mm'], ['fhGap', 'Front hoop behind the rear front-arm pivots (sets the front-box-to-hoop bay)', 70, 250, 5, 170, 'mm'], ['trackF', 'Front track', 1100, 1350, 5, 1220, 'mm'], ['trackR', 'Rear track', 1100, 1350, 5, 1180, 'mm'],
    ['wheel', 'Wheels & tires', 'sel', Object.fromEntries(Object.entries(WHEELS).map(([k, w]) => [k, w.label])), '13'],
    ['rideH', 'Frame ground clearance', 25, 70, 1, 40, 'mm']]],
  ['Driver & cockpit', [
    ['backAngle', 'Seat back angle from vertical', 20, 45, 1, 30, '°'], ['legReach', 'Hip to pedal face', 850, 1100, 5, 960, 'mm'],
    ['driverGap', 'Seat back to main hoop gap (moves the driver forward)', 0, 150, 5, 0, 'mm'],
    ['seatClr', 'Seat shell clearance over the floor tubes', 5, 60, 1, 12, 'mm'], ['seatFoam', 'Seat foam under the driver', 10, 60, 1, 25, 'mm'],
    ['wheelReach', 'Shoulder to steering wheel', 380, 600, 5, 470, 'mm'], ['colAngle', 'Steering column angle', 15, 45, 1, 28, '°'],
    ['wheelClr', 'Wheel rim to front hoop clearance', 20, 150, 5, 60, 'mm'], ['hoopTopClr', 'Front hoop top above wheel', 25, 120, 5, 50, 'mm'],
    ['fhTopHW', 'Front hoop half-width at top', 160, 280, 5, 230, 'mm'],
    ['sisZ', 'Upper side impact height', 265, 320, 1, 300, 'mm']]],
  ['Powertrain · single-cylinder', [
    ['chainCD', 'Countershaft to axle', 260, 450, 5, 300, 'mm'],
    ['battLoc', 'Battery location', 'sel', { rear: 'Rear, above differential', front: 'Front, behind bulkhead' }, 'rear']]],
  ['Front suspension', [
    ['gainF', 'Camber gain', 'sel', Object.fromEntries(Object.entries(GAINS).map(([k, g]) => [k, g.label])), 'med'],
    ['rcF', 'Roll center height', 0, 100, 1, 30, 'mm'], ['camF', 'Static camber', -3, 0, 0.1, -1.0, '°'], ['casterF', 'Caster', 0, 8, 0.5, 5, '°'],
    ['kpi', 'Upright KPI (line through rod-end centers)', 0, 12, 0.5, 8, '°'], ['kpOff', 'Kingpin offset at hub', 30, 90, 1, 55, 'mm'], ['bjSpan', 'Upright rod-end spacing', 160, 280, 2, 220, 'mm'],
    ['spreadF', 'Pickup spacing fore/aft (±)', 90, 180, 5, 120, 'mm'], ['hwF', 'Pivot half-width (rails sit 34.5 mm inboard)', 200, 300, 5, 240, 'mm'],
    ['tieAuto', 'Tie-rod and toe-link height', 'sel', { on: 'Auto: rod end sits on the bottom ear', off: 'Manual: use the sliders' }, 'on'],
    ['tieZF', 'Tie-rod height vs hub', -140, 60, 1, -90, 'mm'], ['armF', 'Steering arm length', 60, 110, 1, 85, 'mm']]],
  ['Rear suspension', [
    ['gainR', 'Camber gain', 'sel', Object.fromEntries(Object.entries(GAINS).map(([k, g]) => [k, g.label])), 'med'],
    ['rcR', 'Roll center height', 0, 120, 1, 50, 'mm'], ['camR', 'Static camber', -3, 0, 0.1, -0.5, '°'],
    ['spreadR', 'Pickup spacing fore/aft (±)', 90, 200, 5, 170, 'mm'], ['hwR', 'Pivot half-width (rails sit 34.5 mm inboard)', 190, 300, 5, 225, 'mm'],
    ['tieZR', 'Toe-link height vs hub', -140, 60, 1, -60, 'mm']]],
  ['Uprights & brakes', [
    ['wheelInset', 'Wheel mounting face inboard of rim centerline', 0, 60, 1, 22, 'mm'],
    ['rotorD', 'Rotor diameter (PS-1 takes 152–229)', 152, 229, 1, 220, 'mm'],
    ['rodMis', 'Rod-end misalignment limit', 12, 30, 0.5, 22, '°']]],
  ['Shocks · coilovers', [
    ['shockModel', 'Shock (FOX coil-over, eye-to-eye × stroke)', 'sel', Object.fromEntries(Object.entries(SHOCKS).map(([k, s]) => [k, s.label])), 'dhx-210x55'],
    ['rearShockModel', 'Rear shock (longer in the same family if it fits)', 'sel', { same: 'Same as front', ...Object.fromEntries(Object.entries(SHOCKS).map(([k, s]) => [k, s.label])) }, 'dhx-230x65'],
    ['shockSag', 'Ride-height sag (share of stroke)', 15, 45, 1, 30, '%'],
    ['frontShockLow', 'Front lower mount', 'sel', { bolt: 'Through-bolt through both lower-arm legs', web: 'Web plate + clevis on the lower arm' }, 'bolt'],
    ['frontShockTop', 'Front top mount', 'sel', { tab: 'Tabs off the upper rail', tower: 'Tower over the upper rail' }, 'tab'],
    ['mrF', 'Front motion ratio (shock / wheel)', 0.25, 0.8, 0.01, 0.35, ''],
    ['rearShock', 'Rear lower mount', 'sel', { upright: 'On the upright (clevis ear)', bolt: 'Through-bolt through both lower-arm legs', web: 'Web plate + clevis on the lower arm' }, 'upright'],
    ['rearEyeSide', 'Rear upright ear position', 'sel', { link: 'On the toe link (clevis straddles it)', least: 'Least steer moment (ahead of the axle)' }, 'link'],
    ['rearShockTop', 'Rear top mount', 'sel', { tab: 'Tabs off the upper rail', tower: 'Tower over the upper rail' }, 'tab'],
    ['mrR', 'Rear motion ratio (shock / wheel)', 0.25, 0.8, 0.01, 0.50, ''],
    ['tabReachMax', 'Top tab max reach from the rail (gusset past 90)', 50, 130, 5, 90, 'mm'],
    ['towerOutF', 'Front tower: max reach outboard of the rail', 60, 200, 5, 140, 'mm'],
    ['towerOutR', 'Rear tower: max reach outboard of the rail', 60, 200, 5, 140, 'mm']]],
  ['Rod ends & links', [
    ['rodSize', 'Rod end size (arms, tie rods, toe links)', 'sel', { '5/16': '5/16 in', '3/8': '3/8 in', '1/2': '1/2 in' }, '3/8'],
    ['rodOff', 'Rod end: ball center to tube face', 20, 70, 0.5, 38, 'mm'],
    ['bjOff', 'Arm apex rod end: ball center to tube face', 15, 70, 0.5, 32, 'mm']]],
  ['Steering', [
    ['ackTarget', 'Ackermann target', 0, 120, 5, 100, '%'], ['maxSteer', 'Inner wheel lock', 18, 35, 0.5, 32, '°'],
    ['rackMode', 'Rack width', 'sel', { auto: 'Driven by zero bump steer', fixed: 'Fixed: match my rack' }, 'auto'],
    ['rackWidth', 'Rack inner pivot center to center', 300, 600, 5, 410, 'mm'],
    ['rackStroke', 'Rack stroke, total', 50, 160, 1, 90, 'mm'],
    ['rackCF', 'Rack travel per pinion turn', 50, 120, 1, 89, 'mm'],
    ['pinionFwd', 'Pinion input ahead of rack tube', 0, 120, 5, 60, 'mm']]],
  ['Frame material', [
    ['mat', 'Tube alloy', 'sel', { '4130': '4130 chromoly (N)', '1020': '1020 DOM mild steel' }, '4130'],
    ['std', 'Tube sizes', 'sel', { imperial: 'Imperial stock (1.0 in OD)', metric: 'Metric stock (25.4 mm OD)' }, 'imperial']]]
];
const DEFAULTS = {}; SCHEMA.forEach(([, ps]) => ps.forEach(p => DEFAULTS[p[0]] = p[2] === 'sel' ? p[4] : p[5]));
let P = { ...DEFAULTS };
try { const s = JSON.parse(localStorage.getItem('fsae-ktm-params-v9') || 'null'); if (s) P = { ...P, ...s }; } catch (e) { }
let RATES = JSON.parse(JSON.stringify(DEFAULT_RATES));
let BUYC = BUY.map(b => ({ ...b }));
let M = null, selId = null;

/* ---------- parameter UI ---------- */
function paramUI() {
  const root = $('#params'); root.innerHTML = '';
  SCHEMA.forEach(([g, ps], gi) => {
    const d = document.createElement('details'); if (gi < 4) d.open = true;
    d.innerHTML = `<summary>${esc(g)}</summary>`;
    ps.forEach(p => {
      const [id, label] = p, div = document.createElement('div'); div.className = 'ctl';
      if (p[2] === 'sel') {
        div.innerHTML = `<label for="p_${id}">${esc(label)}</label><select id="p_${id}">${Object.entries(p[3]).map(([k, t]) => `<option value="${k}">${esc(t)}</option>`).join('')}</select>`;
        const s = div.querySelector('select'); s.value = P[id];
        s.onchange = () => {
          if (id === 'rackMode' && s.value === 'fixed' && M && M.steer) { P.rackWidth = Math.round(M.steer.rackLen / 5) * 5; const r = $('#p_rackWidth'); if (r) r.value = P.rackWidth; }
          P[id] = s.value; schedule();
        };
      } else {
        const [, , min, max, step, , unit] = p;
        div.innerHTML = `<label for="p_${id}">${esc(label)}<output id="o_${id}"></output></label><input type="range" id="p_${id}" min="${min}" max="${max}" step="${step}">`;
        const r = div.querySelector('input'), o = div.querySelector('output');
        const show = () => o.textContent = `${(+P[id]).toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)} ${unit}`.trim();
        r.value = P[id]; show(); r.oninput = () => { P[id] = +r.value; show(); schedule(); };
      }
      d.appendChild(div);
    });
    root.appendChild(d);
  });
  const lic = document.createElement('p'); lic.className = 'rail-lic';
  lic.innerHTML = 'Version 1.2 · <a href="'+'https://github.com/X1Racing/FSAE'+'" target="_blank" rel="noopener">github.com/X1Racing/FSAE</a><br>Generated by Mac McAlpine of <a href="https://x1racing.com" target="_blank" rel="noopener">X1Racing.com</a>. Licensed under the <a href="LICENSE">MIT License</a>. Exports include LICENSE.txt. The X1 Racing name and logo are trademarks and are not covered by the license.';
  root.appendChild(lic);
}
let tmr = null;
function schedule() { $('#status').textContent = 'Solving…'; clearTimeout(tmr); tmr = setTimeout(rebuild, 120); }
function syncRackUI() {
  const r = $('#p_rackWidth'), o = $('#o_rackWidth'); if (!r || !M.steer) return;
  const driven = P.rackMode !== 'fixed';
  r.disabled = driven; if (driven) r.value = Math.min(600, Math.max(300, M.steer.rackLen));
  o.textContent = driven ? `${M.steer.rackLen.toFixed(0)} mm, driven` : `${(+P.rackWidth).toFixed(0)} mm`;
}
function syncTieUI() {
  for (const [id, ax] of [['tieZF', 'F'], ['tieZR', 'R']]) { const r = $('#p_' + id), o = $('#o_' + id); if (!r) continue;
    const auto = P.tieAuto !== 'off' && M.tieAuto; r.disabled = !!auto;
    if (auto) { r.value = M.tieAuto[ax]; o.textContent = `${M.tieAuto[ax].toFixed(0)} mm, auto`; } else o.textContent = `${(+P[id]).toFixed(0)} mm`; }
}
function rebuild() {
  const t = performance.now();
  try { M = build({ ...P, tieAuto: P.tieAuto !== 'off' }); } catch (e) { $('#status').textContent = 'Geometry error: ' + e.message; console.error(e); return; }
  try { localStorage.setItem('fsae-ktm-params-v9', JSON.stringify(P)); } catch (e) { }
  const nf = M.checks.filter(c => c.status === 'fail').length, nw = M.checks.filter(c => c.status === 'warn').length;
  { const rf = M.checks.filter(c => c.rule && c.status !== 'pass').length, df = M.checks.filter(c => !c.rule && c.status !== 'pass').length;
    $('#status').textContent = `${rf ? rf + ' FSAE rule issue' + (rf > 1 ? 's' : '') : 'FSAE rules pass'} · ${df ? df + ' design flag' + (df > 1 ? 's' : '') : 'design checks pass'} · solved in ${(performance.now() - t).toFixed(0)} ms`; }
  syncRackUI(); syncTieUI(); render3D(); renderSummary(); renderChecks(); renderGeo(); renderParts(); renderCost();
  if (selId && !M.parts.find(p => p.id === selId)) selId = null;
  highlight();
}

/* ---------- 3D ---------- */
const COL = { A: 0xD38E44, B: 0x6FA3D6, C: 0x9AA6B1, arm: 0x7CC59A, steer: 0x7CC59A };
const vp = $('#vp'), cv = $('#c3');
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1B232A);
const camera = new THREE.PerspectiveCamera(32, 1, 20, 60000); camera.up.set(0, 0, 1);
const controls = new THREE.OrbitControls(camera, cv); controls.enableDamping = true; controls.dampingFactor = 0.12;
const hemi = new THREE.HemisphereLight(0xE6EEF5, 0x2A3038, 0.85); hemi.position.set(0, 0, 1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.75); sun.position.set(1800, 1400, 3200); scene.add(sun);
const sun2 = new THREE.DirectionalLight(0xffffff, 0.25); sun2.position.set(-2000, -1600, 900); scene.add(sun2);
const grid = new THREE.GridHelper(6000, 60, 0x3A4651, 0x26313A); grid.rotation.x = Math.PI / 2; scene.add(grid);
const LAYERS = { frame: 'Frame', plates: 'Plates', susp: 'Suspension', steer: 'Steering & pedals', power: 'Powertrain', driver: 'Driver', wheels: 'Wheels' };
let rig = null; const egress = { t: -1, on: false, t0: 0 };
const groups = {}; const layerOn = { frame: 1, plates: 1, susp: 1, steer: 1, power: 1, driver: 1, wheels: 1, clear: 0, jigs: 0 }; // shock clearance envelopes and build jigs start hidden
[...Object.keys(LAYERS), 'clear', 'jigs'].forEach(k => { groups[k] = new THREE.Group(); scene.add(groups[k]); });
$('#layers').innerHTML = Object.entries(LAYERS).map(([k, t]) => `<label class="chip${layerOn[k] ? ' on' : ''}" data-layer="${k}" ${k === 'clear' ? 'title="Show the spring and damper envelopes the clearance check uses (red = under 5 mm)"' : ''}><input type="checkbox" ${layerOn[k] ? 'checked' : ''} id="ly_${k}">${t}</label>`).join('');
$('#layers').addEventListener('change', e => { const k = e.target.id.slice(3); layerOn[k] = e.target.checked; groups[k].visible = e.target.checked; e.target.parentElement.classList.toggle('on', e.target.checked); });
const mats = {};
const mat = (hex, o = {}) => { const k = hex + JSON.stringify(o); return mats[k] || (mats[k] = new THREE.MeshStandardMaterial({ color: hex, roughness: o.r ?? 0.55, metalness: o.m ?? 0.35, transparent: !!o.op, opacity: o.op ?? 1, side: o.ds ? THREE.DoubleSide : THREE.FrontSide })); };
const selMat = new THREE.MeshStandardMaterial({ color: 0xFFD08A, emissive: 0xB86A10, emissiveIntensity: 0.65, roughness: 0.4 });
const V3 = p => new THREE.Vector3(p.x, p.y, p.z);
function cyl(a, b, r, m, seg = 14) {
  const d = vsub(b, a), L = vlen(d); if (L < 0.01) return new THREE.Object3D();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, seg, 1), m);
  mesh.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(d.x / L, d.y / L, d.z / L)); return mesh;
}
const sph = (p, r, m) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m); s.position.copy(V3(p)); return s; };
const boxAt = (c, sx, sy, sz, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); b.position.copy(V3(c)); return b; };
let pickables = [];
function clearGroup(g) { while (g.children.length) { const o = g.children.pop(); o.traverse(x => { if (x.geometry) x.geometry.dispose(); }); } }
function tag(o, id) { o.userData.pid = id; o.userData.base = o.material; pickables.push(o); return o; }
function plateMesh(shape, thick, m) {
  const s = new THREE.Shape(shape.pts.map(p => new THREE.Vector2(p[0], p[1])));
  shape.holes.forEach(h => { if (!h.slot) { const pa = new THREE.Path(); pa.absarc(h.x, h.y, h.r, 0, Math.PI * 2, true); s.holes.push(pa); } });
  return new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false, curveSegments: 16 }), m);
}
function placePlate(mesh, origin, ux, uy) { // shape x->ux, y->uy, extrude along ux×uy
  const uz = vcross(ux, uy); const m4 = new THREE.Matrix4().makeBasis(V3(ux), V3(uy), V3(uz)); m4.setPosition(V3(origin)); mesh.applyMatrix4(m4); return mesh;
}
let firstView = true, corners = [], animSusp = false;
const tireGeos = {};
function tireGeo(ro, ri) { const k = ro + '/' + ri; if (tireGeos[k]) return tireGeos[k]; // unit-height annulus about Y, same frame as ucyl so setCyl places it
  const bead = Math.min(ri + 6, ro - 4), pr = [[bead, -0.5], [ro - 12, -0.5], [ro, -0.42], [ro, 0.42], [ro - 12, 0.5], [bead, 0.5], [bead, -0.5]].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(pr, 48); g.computeVertexNormals(); return (tireGeos[k] = g); }
function ucyl(r, m, seg = 14) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, seg, 1), m); }
function setCyl(mesh, a, b) {
  const d = vsub(b, a), L = vlen(d) || 0.01;
  mesh.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); mesh.scale.set(1, L, 1);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(d.x / L, d.y / L, d.z / L));
}
function cornerFrames(g) { // linkage solved through about +/-30 mm wheel travel, sorted by travel
  const K = makeKin(g), lA = Math.hypot(g.LBJ.y - g.LIPr.y, g.LBJ.z - g.LIPr.z), thM = 34 / lA, out = [];
  const s0 = K.state(0); s0.th = 0; out.push(s0);
  for (let i = 1; i <= 24; i++) { const st = K.state(thM * i / 24); st.th = thM * i / 24; out.push(st); }
  K.reset(); K.state(0);
  for (let i = 1; i <= 24; i++) { const st = K.state(-thM * i / 24); st.th = -thM * i / 24; out.push(st); }
  out.forEach(s => s.dz = s.WC.z - s0.WC.z); out.sort((a, b) => a.dz - b.dz); return out;
}
function frameAt(frames, dz) {
  let best = frames[0]; for (const f of frames) if (Math.abs(f.dz - dz) < Math.abs(best.dz - dz)) best = f; return best;
}
const travelNow = () => 25 * Math.sin(performance.now() / 1000 * 2 * Math.PI / 2.6);

function placeM(mesh, origin, ux, uy, t, sgn) { // place a plate, mirrored across the centerline for the right side
  if (sgn > 0) return placePlate(mesh, origin, ux, uy);
  const uz = vcross(ux, uy); return placePlate(mesh, vadd(vmir(origin), vmul(vmir(uz), t)), vmir(ux), vmir(uy));
}
function orientedBox(c, ux, uy, uz, sx, sy, sz, m) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m);
  b.applyMatrix4(new THREE.Matrix4().makeBasis(V3(ux), V3(uy), V3(uz)).setPosition(V3(c))); return b;
}
function makeUpright(u, g, sgn) {
  const f = sgn > 0 ? (p => p) : vmir, grp = new THREE.Group(); grp.matrixAutoUpdate = false; groups.susp.add(grp);
  const steelM = mat(0xB9C2CA, { m: .7, r: .35 }), rotM = mat(0x9AA3AB, { m: .85, r: .3 }), brgM = mat(0x4F5862, { m: .6, r: .4 }), calM = mat(0xC4302B, { m: .3, r: .5 });
  u.plates.forEach(pl => { const m = placeM(plateMesh(pl.shape, pl.t, /rotor/.test(pl.name) ? rotM : steelM), pl.origin, pl.ux, pl.uy, pl.t, sgn); grp.add(tag(m, pl.id)); });
  const Wf = u.items.wheel, fw = sgn > 0 ? Wf.xw : vmir(Wf.xw), ou = sgn > 0 ? Wf.s : vmir(Wf.s), kk = sgn > 0 ? Wf.zw : vmir(Wf.zw); // bearings and caliper square to the axle
  u.items.bearings.forEach(c => grp.add(orientedBox(f(c), fw, ou, kk, UPR.BRG_W, UPR.BRG_PRO + 3, UPR.BRG_L, brgM)));
  grp.add(cyl(f(u.items.shaft[0]), f(u.items.shaft[1]), 12.5, mat(0xD5DADE, { m: .9, r: .2 })));
  const th = u.items.calTh, tang = vadd(vmul(fw, -Math.sin(th)), vmul(kk, Math.cos(th))), rad = vadd(vmul(fw, Math.cos(th)), vmul(kk, Math.sin(th)));
  grp.add(orientedBox(f(u.items.caliper), rad, ou, tang, 34, 52, 92, calM));
  const F0 = uprightFrame(f(g.LBJ), f(g.UBJ), sgn > 0 ? g.spin : vmir(g.spin)), L0 = f(g.LBJ);
  const m0 = new THREE.Matrix4().makeBasis(V3(F0.fwd), V3(F0.out), V3(F0.k)), m0i = m0.clone().transpose();
  return { update(L, U, sp) {
    const Fc = uprightFrame(L, U, sp), R = new THREE.Matrix4().makeBasis(V3(Fc.fwd), V3(Fc.out), V3(Fc.k)).multiply(m0i);
    const t = V3(L).sub(V3(L0).applyMatrix4(R)); R.setPosition(t); grp.matrix.copy(R); grp.matrixWorldNeedsUpdate = true;
  } };
}
function makeShockMeshes(sh, g, sgn, ax) {
  // FOX DHX/DHX2-style coil-over, body up: top eye + damper head with adjusters, Kashima body, preload collar, steel spring,
  // shaft, lower spring retainer and bottom eye. Dimensions from the shock catalog in core (FOX).
  const f = sgn > 0 ? (p => p) : vmir, axL = vnorm(vsub(g.LIPf, g.LIPr)), Fx = M.comp.shock.fox, spec = ax === 'R' ? M.comp.shock.specR : M.comp.shock.spec, dTop = ax === 'R' ? M.comp.shock.springTopR : M.comp.shock.springTop, bodyEnd = spec.bodyEnd ?? Fx.bodyEnd;
  const kash = mat(0xC9A24E, { m: .75, r: .28 }), blk = mat(0x1E2124, { m: .4, r: .5 }), chrome = mat(0xE6E9EC, { m: .95, r: .12 }), orange = mat(0xE8641E, { m: .2, r: .5 }), alu = mat(0x9AA3AB, { m: .8, r: .3 }), springM = mat(0x1E2124, { m: .6, r: .35 });
  const eyeU = ucyl(Fx.eyeOD / 2, alu, 16), eyeL = ucyl(Fx.eyeOD / 2, alu, 16), head = ucyl(Fx.headR, blk, 20), knob = ucyl(9, orange, 12), body = ucyl(Fx.bodyR, kash, 20);
  const collar = ucyl(Fx.collarR, orange, 24), shaftC = ucyl(Fx.shaftR, chrome, 12), perch = ucyl(Fx.perchR, blk, 24), boot = ucyl(Fx.shaftR + 3, blk, 12);
  // helix built at its real ride-height length (mm) so the wire keeps its round section; travel only rescales it a few percent
  const coils = 8, Rm = (Fx.springID + Fx.wire) / 2, pts = [], L0 = Math.max(40, sh.sLen || 100);
  for (let i = 0; i <= coils * 24; i++) { const a = i / 24 * 2 * Math.PI, t = i / (coils * 24); pts.push(new THREE.Vector3(Rm * Math.cos(a), L0 * t, Rm * Math.sin(a))); }
  const spring = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), coils * 40, Fx.wire / 2, 8, false), springM);
  const pid = sh.topId || M.parts.find(p => p.name === (ax === 'F' ? 'Front' : 'Rear') + ' shock chassis tab').id;
  const parts3 = [eyeU, eyeL, head, knob, body, collar, shaftC, perch, boot, spring]; parts3.forEach(m => tag(m, pid)); groups.susp.add(...parts3);
  // clearance-check envelopes (Shock clearance layer): the spring and damper volumes the check measures against arms, links, frame and tire
  const failing = sh.clear && sh.clear.gap < 5, envM = mat(failing ? 0xFF3B30 : 0xE5484D, { m: 0, r: .6, op: failing ? 0.55 : 0.22, ds: true });
  const envSpring = ucyl(SPRING_R, envM, 24), envBody = ucyl(DAMPER_R, envM, 20), envTab = sh.tabSeg ? ucyl(16, envM, 12) : null;
  [envSpring, envBody, envTab].forEach(m => { if (m) { m.renderOrder = 2; m.material.depthWrite = false; groups.clear.add(tag(m, pid)); } });
  const X = v(1, 0, 0), eyeAt = (m, c) => setCyl(m, vsub(c, vmul(X, Fx.eyeW / 2)), vadd(c, vmul(X, Fx.eyeW / 2))); // eyes turn on bolts along the pivot axis
  // lower clevis pair on a group that turns with the lower arm
  // lower mount (web plate + clevis pair) rides on a group that turns with the lower arm about its pivot line
  const piv = f(g.LIPr), grp = new THREE.Group(); grp.position.copy(V3(piv)); groups.plates.add(grp);
  const pm2 = mat(0xC5CDD4, { m: .6, r: .35 }), mt = sh.mount;
  if (sh.bolt) { // through-bolt, weld-in sleeves and spacers turn with the lower arm
    const bt = sh.bolt, rel = p => vsub(f(p), piv), bm = mat(0x8A939C, { m: .8, r: .3 }), slM = mat(COL.arm, { m: .4 });
    grp.add(cyl(rel(bt.a), rel(bt.b), 3.97, bm));
    bt.legs.forEach((h, i) => grp.add(tag(cyl(rel(vsub(h.p, vmul(bt.X, h.len / 2))), rel(vadd(h.p, vmul(bt.X, h.len / 2))), 6.35, slM), bt.ids[i])));
    [[EYE_W / 2, bt.spF, 2], [-EYE_W / 2, -bt.spR, 3]].forEach(([o0, l, k]) => { if (Math.abs(l) > 0.5) grp.add(tag(cyl(rel(vadd(sh.Lm, vmul(bt.X, o0))), rel(vadd(sh.Lm, vmul(bt.X, o0 + l))), 6.35, bm), bt.ids[k])); });
  }
  if (mt) {
    const webP = M.parts.find(p => p.id === sh.webId), clP = M.parts.find(p => p.id === sh.clevisId);
    grp.add(tag(placeM(plateMesh(webP.shape, SHOCK_WEB_T, pm2), vsub(mt.webOrigin, g.LIPr), mt.e1, mt.e2, SHOCK_WEB_T, sgn), webP.id));
    mt.tabs.forEach(tb => grp.add(tag(placeM(plateMesh(clP.shape, SHOCK_TAB_T, pm2), vsub(tb.origin, g.LIPr), tb.ux, tb.uy, SHOCK_TAB_T, sgn), clP.id)));
  }
  return { update(st) {
    const th = st.th || 0, L = f(shockLowerAt(sh, g, st)), U = f(sh.U), a = vnorm(vsub(U, L)), at = (p, d) => vsub(p, vmul(a, d)); // lower eye rides on the upright or turns with the arm
    eyeAt(eyeU, U); eyeAt(eyeL, L);
    setCyl(head, at(U, Fx.eyeOD / 2 - 2), at(U, Fx.headLen)); setCyl(knob, vadd(at(U, 24), vmul(vnorm(vcross(a, X)), Fx.headR - 2)), vadd(at(U, 24), vmul(vnorm(vcross(a, X)), Fx.headR + 10)));
    setCyl(body, at(U, Fx.headLen), at(U, bodyEnd)); setCyl(collar, at(U, dTop - Fx.collarT), at(U, dTop));
    setCyl(shaftC, vadd(L, vmul(a, Fx.eyeOD / 2)), at(U, bodyEnd - 5)); setCyl(boot, vadd(L, vmul(a, Fx.perchUp)), vadd(L, vmul(a, Fx.perchUp + 12)));
    const p0 = vadd(L, vmul(a, Fx.perchUp)), p1 = at(U, dTop); setCyl(perch, vsub(p0, vmul(a, 5)), p0);
    spring.position.copy(V3(p0)); spring.scale.set(1, vlen(vsub(p1, p0)) / L0, 1);
    setCyl(envSpring, p0, p1); setCyl(envBody, U, at(U, Math.min(bodyEnd, vlen(vsub(U, L)) - 25)));
    if (envTab) setCyl(envTab, f(sh.tabSeg[0]), f(sh.tabSeg[1]));
    spring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(a.x, a.y, a.z));
    grp.quaternion.setFromAxisAngle(V3(axL), sgn * th); // mirrored side turns the opposite way
  } };
}
function applyTravel(dz) { corners.forEach(c => c.apply(frameAt(c.frames, dz))); const o = $('#travelOut'); if (o) o.textContent = `${dz >= 0 ? '+' : ''}${dz.toFixed(0)} mm`; }
function render3D() {
  Object.values(groups).forEach(clearGroup); pickables = [];
  const { N, std, comp } = M;
  // frame tubes
  M.members.forEach(m => groups.frame.add(tag(cyl(N[m.a], N[m.b], std[m.cat].od / 2, mat(COL[m.cat], { m: .5, r: .45 })), m.part)));
  M.hoops.forEach(h => { // bent on the hoop's centerline radius: straights between tangent points, torus sections at each bend
    const pts = h.pts.map(k => N[k]), hp = M.parts.find(p => p.id === h.part), R = hp.CLR, r = std.A.od / 2, hm = mat(COL.A, { m: .5, r: .45 });
    let from = pts[0];
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i];
      if (i === pts.length - 1) { groups.frame.add(tag(cyl(from, p, r, hm), h.part)); break; }
      const u1 = vnorm(vsub(pts[i - 1], p)), u2 = vnorm(vsub(pts[i + 1], p)), turn = Math.PI - Math.acos(Math.max(-1, Math.min(1, vdot(u1, u2))));
      if (turn < 0.01) continue; // collinear node: the straight carries on
      const tl = R * Math.tan(turn / 2), t1 = vadd(p, vmul(u1, tl)), t2 = vadd(p, vmul(u2, tl)), C = vadd(p, vmul(vnorm(vadd(u1, u2)), R / Math.cos(turn / 2)));
      groups.frame.add(tag(cyl(from, t1, r, hm), h.part));
      const x = vnorm(vsub(t1, C)), z = vnorm(vcross(vsub(t1, C), vsub(t2, C))), y = vcross(z, x);
      const tor = new THREE.Mesh(new THREE.TorusGeometry(R, r, 10, Math.max(6, Math.ceil(turn / 0.12)), turn), hm);
      tor.applyMatrix4(new THREE.Matrix4().makeBasis(V3(x), V3(y), V3(z)).setPosition(V3(C))); groups.frame.add(tag(tor, h.part));
      from = t2;
    }
  });
  // suspension corners: arms, links, uprights and wheels driven by the 3D linkage solve
  const am = mat(COL.arm, { m: .4 }), ujm = mat(0x8A939C, { m: .7, r: .3 }), um = mat(0x5D666F, { m: .6, r: .4 });
  const tm = mat(0x23282D, { m: 0, r: .9 }), rm = mat(0xB7C0C8, { m: .8, r: .3, op: .18, ds: true }), bootM = mat(0x2B2F33, { m: 0, r: .9 });
  corners = [];
  for (const [ax, g] of [['F', comp.gF], ['R', comp.gR]]) {
    const frames = cornerFrames(g), legs = comp.susp.filter(s => s.ax === ax);
    for (const sgn of [1, -1]) {
      const f = sgn > 0 ? (p => p) : vmir;
      [g.LIPf, g.LIPr, g.UIPf, g.UIPr].forEach(p => groups.susp.add(sph(f(p), 10, ujm)));
      const arm = legs.map(s => { const pt = M.parts.find(p => p.id === s.id), m = tag(ucyl(pt && pt.tube ? pt.tube.od / 2 : (s.link ? 9.5 : 8), am), s.id); groups[s.link ? 'steer' : 'susp'].add(m); return m; });
      const rodM = mat(0xC9CED3, { m: .85, r: .25 });
      const shk = legs.map(s => { const a = ucyl(4.5, rodM, 10), b = ucyl(4.5, rodM, 10); groups[s.link ? 'steer' : 'susp'].add(a, b); return [a, b]; });
      const bIn = sph(v(), 9, rodM); groups.steer.add(bIn);
      const bungM = mat(0xC9CED3, { m: .8, r: .3 }), bungL = tag(ucyl(comp.bung.od / 2, bungM, 18), comp.bung.id), bungU = tag(ucyl(comp.bung.od / 2, bungM, 18), comp.bung.id); groups.susp.add(bungL, bungU);
      const bL = sph(v(), 15, ujm), bU = sph(v(), 15, ujm), bT = sph(v(), 11, ujm);
      const uprG = makeUpright(comp.upr[ax], g, sgn); // laser-cut upright moves as one rigid body
      const tire = new THREE.Mesh(tireGeo(comp.Rt, comp.W.rim / 2), mat(0x23282D, { m: 0, r: .9, ds: true })), rim = ucyl(comp.W.rim / 2, rm, 32); rim.renderOrder = 2; // tire is a hollow ring, wheel center see-through so the upright, hub and brake show
      groups.susp.add(bL, bU, bT); groups.wheels.add(tire, rim);
      let shaft = null, boot = null;
      if (ax === 'R') { shaft = ucyl(13, ujm); boot = sph(v(), 32, bootM); groups.power.add(shaft, boot); }
      // coilover: eyes, damper body, shaft, 2 in spring; lower clevis rides on the lower arm
      const sh = comp.shock[ax], shk2 = sh && sh.Lm ? makeShockMeshes(sh, g, sgn, ax) : null;
      const piv = [g.LIPf, g.LIPr, g.UIPf, g.UIPr];
      corners.push({ frames, apply(st) {
        const L = f(st.LBJ), U = f(st.UBJ), O = f(st.OTR), I = f(st.ITR), W = f(st.WC), sp = sgn > 0 ? st.spin : vmir(st.spin), K = f(st.KP);
        // arms: both legs meet one apex bung; one rod end (shank + ball) runs from the bung to the upright bolt
        const apex = (bj, p0, p1) => vadd(bj, vmul(vnorm(vsub(vlerp(p0, p1, 0.5), bj)), comp.apexOff));
        const AL = apex(L, f(piv[0]), f(piv[1])), AU = apex(U, f(piv[2]), f(piv[3]));
        const ends = [[AL, f(piv[0])], [AL, f(piv[1])], [AU, f(piv[2])], [AU, f(piv[3])], [O, I]];
        ends.forEach(([a, b], i) => { const d = vnorm(vsub(b, a)), fa = vadd(a, vmul(d, legs[i].offA)), fb = vsub(b, vmul(d, legs[i].offB)); setCyl(arm[i], fa, fb); setCyl(shk[i][1], fb, b); if (i === 4) setCyl(shk[i][0], a, fa); });
        setCyl(shk[0][0], L, AL); setCyl(shk[2][0], U, AU); shk[1][0].visible = false; shk[3][0].visible = false;
        const bl = M.parts.find(p => p.id === comp.bung.id).len / 2; setCyl(bungL, vsub(AL, vmul(vnorm(vsub(AL, L)), bl)), vadd(AL, vmul(vnorm(vsub(AL, L)), bl))); setCyl(bungU, vsub(AU, vmul(vnorm(vsub(AU, U)), bl)), vadd(AU, vmul(vnorm(vsub(AU, U)), bl)));
        bIn.position.copy(V3(I));
        uprG.update(L, U, sp);
        bL.position.copy(V3(L)); bU.position.copy(V3(U)); bT.position.copy(V3(O));
        setCyl(tire, vadd(W, vmul(sp, -comp.W.w / 2)), vadd(W, vmul(sp, comp.W.w / 2)));
        setCyl(rim, vadd(W, vmul(sp, -comp.W.w / 2 - 1)), vadd(W, vmul(sp, comp.W.w / 2 + 1)));
        if (shk2) shk2.update(st);
        if (shaft) { const a = v(comp.diff.x, 80 * sgn, comp.diff.z), b = vadd(W, vmul(sp, -70)); setCyl(shaft, a, b); boot.position.copy(V3(b)); }
      } });
    }
  }
  applyTravel(animSusp ? travelNow() : 0);
  // powertrain
  const e = comp.engine, em = mat(0x55606A, { m: .6, r: .5 }), eo = mat(0xE07A1F, { m: .2, r: .6 });
  groups.power.add(boxAt(v((e.x0 + e.x1) / 2, 0, (e.z0 + e.z1) / 2), e.x1 - e.x0, e.w * 0.66, e.z1 - e.z0, em));
  groups.power.add(cyl(v(e.x0 + 260, 0, e.z0 + 260), v(e.x0 + 300, 0, e.z1), 62, eo));
  groups.power.add(cyl(v(e.cs.x, 60, e.cs.z), v(e.cs.x, 80, e.cs.z), 40, ujm));
  groups.power.add(cyl(v(comp.diff.x, -70, comp.diff.z), v(comp.diff.x, 70, comp.diff.z), 62, em));
  groups.power.add(cyl(v(comp.diff.x, 72, comp.diff.z), v(comp.diff.x, 80, comp.diff.z), 105, ujm, 36));
  groups.power.add(cyl(v(e.cs.x, 76, e.cs.z + 40), v(comp.diff.x, 76, comp.diff.z + 105), 4, mat(0x1A1D20)));
  groups.power.add(cyl(v(e.cs.x, 76, e.cs.z - 40), v(comp.diff.x, 76, comp.diff.z - 105), 4, mat(0x1A1D20)));
  for (const sgn of [1, -1]) groups.power.add(sph(v(comp.diff.x, 80 * sgn, comp.diff.z), 30, bootM));
  groups.power.add(boxAt(comp.battery.c, comp.battery.s.x, comp.battery.s.y, comp.battery.s.z, mat(0x2F6FB0, { m: .1, r: .6 })));
  // steering
  const d = comp.driver, sm = mat(0x9099A3, { m: .7, r: .35 });
  const wh = new THREE.Mesh(new THREE.TorusGeometry(d.wheelR, 13, 10, 40), mat(0x2A2E33, { m: 0, r: .9 }));
  wh.position.copy(V3(d.wc)); wh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(Math.cos(d.colA), 0, -Math.sin(d.colA))); groups.steer.add(wh);
  groups.steer.add(cyl(vadd(d.wc, v(0, -d.wheelR, 0)), vadd(d.wc, v(0, d.wheelR, 0)), 9, mat(0x2A2E33, { m: 0, r: .9 })));
  const colId = M.parts.find(p => p.name === 'Steering column, upper').id, intId = M.parts.find(p => p.name === 'Steering intermediate shaft').id;
  groups.steer.add(tag(cyl(d.wc, d.UJ1, 9.5, mat(COL.steer)), colId)); groups.steer.add(tag(cyl(d.UJ1, d.UJ2, 9.5, mat(COL.steer)), intId));
  groups.steer.add(sph(d.UJ1, 16, ujm)); groups.steer.add(sph(d.UJ2, 16, ujm));
  const gF = comp.gF; groups.steer.add(cyl(v(gF.ITR.x, -(gF.ITR.y - 70), gF.ITR.z), v(gF.ITR.x, gF.ITR.y - 70, gF.ITR.z), 22, sm));
  groups.steer.add(cyl(v(gF.ITR.x, gF.ITR.y - 70, gF.ITR.z), V3(gF.ITR), 10, sm)); groups.steer.add(cyl(v(gF.ITR.x, -(gF.ITR.y - 70), gF.ITR.z), vmir(gF.ITR), 10, sm));
  // pedals
  const zb = M.zb, xp = comp.xPedal;
  const pedalId = M.parts.find(p => p.name === 'Brake pedal').id, thrId = M.parts.find(p => p.name === 'Throttle pedal').id;
  const pv = v(xp + 25, 0, zb + 50);
  const bp = M.parts.find(p => p.id === pedalId), tp = M.parts.find(p => p.id === thrId);
  const tilt = 15 * D2R, ux = v(Math.cos(tilt), 0, Math.sin(tilt)), uz = v(-Math.sin(tilt), 0, Math.cos(tilt));
  // plates in 3D with real outlines
  const pm = mat(0xC5CDD4, { m: .6, r: .35 }), am2 = mat(0xB9C3CC, { m: .5, r: .3 });
  groups.steer.add(tag(placePlate(plateMesh(bp.shape, 9.5, am2), v(pv.x, 55 + 4.7, pv.z), ux, uz), pedalId));
  const tpm = placePlate(plateMesh(tp.shape, 6.35, am2), v(pv.x, -70 + 3.2, pv.z), ux, uz); groups.steer.add(tag(tpm, thrId));
  groups.steer.add(cyl(v(pv.x + 50, 55, pv.z + 46), v(M.xFB - 40, 30, pv.z + 46), 14, mat(0x3B4148)));
  groups.steer.add(cyl(v(pv.x + 50, 55, pv.z + 46), v(M.xFB - 40, 80, pv.z + 46), 14, mat(0x3B4148)));
  // plates placement
  const P_ = name => M.parts.find(p => p.name === name);
  const trayP = P_('Pedal tray'), bb = trayP.shape.bbox();
  groups.plates.add(tag(placePlate(plateMesh(trayP.shape, 6.35, am2), v((comp.driver.heel.x - 60 + M.xFB - 15) / 2, 0, zb + 13), v(1, 0, 0), v(0, 1, 0)), trayP.id));
  const fw = P_('Firewall'); groups.plates.add(tag(placePlate(plateMesh(fw.shape, 1.6, mat(0xC9D1D8, { m: .5, r: .4, op: .55, ds: true })), v(M.xMH - 16, 0, zb), v(0, 1, 0), v(0, 0, 1)), fw.id));
  const bt = P_('Battery tray'); groups.plates.add(tag(placePlate(plateMesh(bt.shape, 3.2, pm), vadd(comp.battery.c, v(0, 0, -comp.battery.s.z / 2 - 3.2)), v(1, 0, 0), v(0, 1, 0)), bt.id));
  const dpp = P_('Differential carrier plate');
  for (const y of [-92, 86]) groups.plates.add(tag(placePlate(plateMesh(dpp.shape, 4.76, pm), v(N.RS2_L.x - 30, y, M.gR.zL), v(1, 0, 0), v(0, 0, 1)), dpp.id)); // notches sit over both lower crosses
  // inboard clevis pairs: bolt turned square to its arm leg, plates normal to the bolt, hole on the pivot, saddle on the rail
  for (const [ax, g] of [['F', M.gF], ['R', M.gR]]) [g.LIPf, g.LIPr, g.UIPf, g.UIPr].forEach((p, i) => { const cv = comp.clevis[ax][i], tp2 = M.parts.find(pp => pp.id === cv.id); for (const s of [1, -1]) {
    const b0 = comp.mis[ax].bolts[i], bolt = s > 0 ? b0 : vmir(b0), q = s > 0 ? p : vmir(p), z = v(0, 0, 1);
    let uy = vnorm(vcross(bolt, z)); if (uy.y * s < 0) uy = vmul(uy, -1);
    const ext = vcross(z, uy), gp = comp.RE.gap / 2; // plates extrude along ext (parallel to the bolt, either sense)
    for (const o of [gp, -gp - 3.175]) { // each plate of the pair has its own hole height so both saddles sit on the rail
      const c = o + 3.175 / 2, h = cv.hHole + ext.y * c / uy.y, pl = cv.plates.reduce((b, x) => Math.abs(x.h - h) < Math.abs(b.h - h) ? x : b), pp = M.parts.find(x => x.id === pl.id);
      const base = vadd(vadd(q, vmul(uy, -pl.h)), vmul(ext, o)); groups.plates.add(tag(placePlate(plateMesh(pp.shape, 3.175, pm), base, z, uy), pp.id)); }
  } });
  // rear toe-link pair: horizontal plates on the rear bulkhead upright, bolt vertical
  const toeP = P_('Rear toe-link tab'), tt = comp.toeTab;
  for (const s of [1, -1]) for (const dz of [comp.RE.gap / 2 + 3.2, -comp.RE.gap / 2]) { // plates extrude downward 3.2 mm
    const dir = s > 0 ? tt.dir : vmir(tt.dir), base = s > 0 ? tt.base : vmir(tt.base), ux = v(-dir.y, dir.x, 0);
    const o = vadd(vadd(base, vmul(dir, TAB_SADDLE(M.std.C.od))), v(0, 0, dz));
    groups.plates.add(tag(placePlate(plateMesh(toeP.shape, 3.2, pm), o, ux, dir), toeP.id));
  }
  // shock chassis tab pairs: lean outboard along the solved tab direction, bolt along X
  for (const ax of ['F', 'R']) {
    const sh = comp.shock[ax]; if (!sh.Lm) continue;
    if (sh.top) { // tower node clevis: two plates sandwich the tower tubes, eye hangs between them
      const tcP = M.parts.find(p => p.id === sh.topId);
      for (const sg of [1, -1]) sh.top.plates.forEach(q => groups.plates.add(tag(placeM(plateMesh(tcP.shape, 4.76, pm), q.origin, q.ux, q.uy, 4.763, sg), tcP.id)));
      continue;
    }
    const tp3 = P_((ax === 'F' ? 'Front' : 'Rear') + ' shock chassis tab'), ph = sh.phi * D2R;
    for (const sg of [1, -1]) {
      const uy = v(0, sg * Math.sin(ph), Math.cos(ph)), ux = v(0, Math.cos(ph), -sg * Math.sin(ph));
      const U = sg > 0 ? sh.U : vmir(sh.U), R0 = vsub(U, vmul(uy, sh.h)), o = vadd(R0, vmul(uy, TAB_SADDLE(M.std.C.od)));
      for (const dx of [11, -14.2]) groups.plates.add(tag(placePlate(plateMesh(tp3.shape, tp3.mat === 'ST5' ? 4.76 : 3.2, pm), v(U.x + dx, o.y, o.z), ux, uy), tp3.id));
    }
  }
  // build jigs and the flat build table (Show build jigs)
  const J = comp.jigs;
  if (J && J.stations.length) {
    const jm = mat(0x3FA7D6, { m: .4, r: .5 }), tm2 = mat(0x6B7682, { m: .2, r: .8, op: 0.35, ds: true });
    J.stations.forEach(st => { const jp = M.parts.find(p => p.id === st.id);
      groups.jigs.add(tag(placePlate(plateMesh(jp.shape, J.t, jm), v(st.x - J.t / 2, 0, J.table), v(0, 1, 0), v(0, 0, 1)), jp.id)); });
    J.spars.forEach(sp => { const pp = M.parts.find(p => p.id === sp.id); for (const y of [sp.ys, -sp.ys]) groups.jigs.add(tag(placePlate(plateMesh(pp.shape, J.t, jm), v(0, y + J.t / 2, J.table), v(1, 0, 0), v(0, 0, 1)), pp.id)); });
    const te = J.tableExt, tbl = new THREE.Mesh(new THREE.BoxGeometry(te.x1 - te.x0, 2 * te.y, 6), tm2); tbl.position.set((te.x0 + te.x1) / 2, 0, J.table - 3); groups.jigs.add(tbl);
  }
  const cb = P_('Column bearing plate'); groups.plates.add(tag(placePlate(plateMesh(cb.shape, 4.76, pm), v(M.N.CS.x - 2.4, 0, M.N.CS.z - 50.7), v(0, 1, 0), v(0, 0, 1)), cb.id));
  const rkP = P_('Steering rack mount'); for (const s of [1, -1]) groups.plates.add(tag(placePlate(plateMesh(rkP.shape, 4.76, pm), v(M.N.RK_L.x - 2.4, s * 110, M.gF.zL + M.std.C.od / 2), v(0, 1, 0), v(0, 0, 1)), rkP.id)); // flat base on top of the cross
  // driver mannequin: a posable rig so the egress animation can move it
  rig = makeRig(d, M.N, M.zb); groups.driver.add(rig.g); egress.t = -1; egressUI();
  // seat
  // seat back lies behind the torso along the back angle (top leans rearward); seat pan sits under the hips
  const sb = P.backAngle * D2R, up = v(-Math.sin(sb), 0, Math.cos(sb)), behind = v(-Math.cos(sb), 0, -Math.sin(sb));
  const seatM = mat(0x2C3136, { m: .1, r: .8 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(560, 420, 14), seatM);
  back.position.copy(V3(vadd(vadd(d.hip, vmul(up, 250)), vmul(behind, 150))));
  back.rotation.y = (90 - P.backAngle) * D2R; groups.driver.add(back);
  const pan = new THREE.Mesh(new THREE.BoxGeometry(360, 420, 14), seatM);
  // seat shell tilts 8 deg nose-up; its rear (lowest) edge sits on the clearance line above the floor tubes, foam on top
  const shellBot = d.seatZ - d.seatFoam - d.seatShell, panTilt = 8 * D2R, lift = 180 * Math.sin(panTilt);
  pan.scale.z = d.seatShell / 14; pan.position.copy(V3(v(d.hip.x + 110, 0, shellBot + d.seatShell / 2 + lift))); pan.rotation.y = -panTilt; groups.driver.add(pan);
  const foam = new THREE.Mesh(new THREE.BoxGeometry(340, 400, d.seatFoam), mat(0x4A5560, { m: 0, r: .95 }));
  foam.position.copy(V3(v(d.hip.x + 110, 0, shellBot + d.seatShell + d.seatFoam / 2 + lift))); foam.rotation.y = -panTilt; groups.driver.add(foam);
  Object.keys(groups).forEach(k => groups[k].visible = !!layerOn[k]);
  if (firstView) { setView('iso'); firstView = false; }
}
/* ---------- driver rig and egress animation ---------- */
function makeRig(d, N, zb) {
  const sk = mat(0xD8B48C, { m: 0, r: .8 }), suit = mat(0x3C4F7A, { m: 0, r: .85 }), hm = mat(0xE9EEF2, { m: .1, r: .4 }), shoe = mat(0x222222, { m: 0, r: .9 });
  const g = new THREE.Group(), U = (r, m, s = 14) => { const c = ucyl(r, m, s); g.add(c); return c; }, S = (r, m) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m); g.add(s); return s; };
  const parts = { torso: U(140, suit, 20), pelvis: S(140, suit), head: S(150, hm), side: [1, -1].map(() => ({ th: U(72, suit), kn: S(62, suit), sh: U(56, suit), ft: U(45, shoe), ua: U(45, suit), fa: U(38, suit), hd: S(40, sk) })) };
  const THIGH = 450, SHIN = 470, UARM = 320, FARM = 300, UP = v(0, 0, 1);
  const ik = (a, c, l1, l2, bend) => { // two-bone IK: joint bends toward `bend`; out-of-reach targets are pulled in
    let dv = vsub(c, a), L = vlen(dv); const u = vmul(dv, 1 / (L || 1)); if (L > l1 + l2 - 0.5) { L = l1 + l2 - 0.5; c = vadd(a, vmul(u, L)); }
    const x = (l1 * l1 - l2 * l2 + L * L) / (2 * L), h = Math.sqrt(Math.max(0, l1 * l1 - x * x)), bp = vnorm(vsub(bend, vmul(u, vdot(bend, u))));
    return { j: vadd(vadd(a, vmul(u, x)), vmul(bp, h)), end: c };
  };
  const sm = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t), seg = (t, a, b) => sm((t - a) / (b - a));
  const path = (pts, f) => { if (f <= 0) return pts[0]; if (f >= 1) return pts[pts.length - 1]; const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + vlen(vsub(pts[i], pts[i - 1])));
    const s = f * L[L.length - 1]; for (let i = 1; i < pts.length; i++) if (s <= L[i]) return vlerp(pts[i - 1], pts[i], (s - L[i - 1]) / (L[i] - L[i - 1] || 1)); return pts[pts.length - 1]; };
  // car: he climbs out over the +y side, stepping over the upper side-impact tube (feet clear its top by ~70 mm)
  const sideY = Math.max(N.FH_S.y, N.MH_S.y), railTop = N.MH_S.z + 13, clr = railTop + 150, X0 = d.hip.x, Xs = X0 + 20, ankIn = d.seatZ + 85, ankOut = 80; // stands up on the seat, behind the steering wheel
  const standIn = ankIn + 860, standOut = ankOut + 880, out = sideY + 560;
  const T = { grip: 0.5, push: 1.3, up: 2.0, stepA: 3.1, shift: 3.6, stepB: 4.7, turn: 5.7 };
  // push phase: hands on the side tubes, he presses himself back and up out of the seat with both legs held straight (heels slide back off the pedals)
  const hipPush = v(X0 - 70, 0, d.hip.z + 200), legDir = s => vnorm(vsub(seatedFeet(s).an, vadd(d.hip, v(0, 95 * s, 0))));
  const pushAnkle = (s, f) => { const hp0 = vadd(d.hip, v(0, 95 * s, 0)), hp = vadd(vlerp(d.hip, hipPush, f), v(0, 95 * s, 0)), L0 = vlen(vsub(seatedFeet(s).an, hp0)), dir = vnorm(vadd(legDir(s), v(0, 0, 0.12 * f)));
    return vadd(hp, vmul(dir, L0 + (THIGH + SHIN - 1 - L0) * sm(Math.min(1, f * 1.6)))); }; // knees lock straight early in the push
  const seatedFeet = s => ({ an: vadd(d.ankle, v(0, 110 * s, 0)), heel: vadd(d.heel, v(0, 110 * s, 0)), toe: vadd(d.toe, v(0, 110 * s, -50)) });
  // foot (ankle) positions through the climb, s = +1 is the +y (exit side) foot, which goes first
  const ankleAt = (s, t) => {
    const inA = v(Xs, 110 * s, ankIn);
    if (t <= T.grip) return seatedFeet(s).an;
    if (t <= T.push) return pushAnkle(s, seg(t, T.grip, T.push));
    if (t <= T.up) return vlerp(pushAnkle(s, 1), inA, seg(t, T.push, T.up));
    const plantA = v(Xs + 20, sideY + 280, ankOut), plantB = v(Xs - 20, sideY + 140, ankOut), finA = v(Xs - 110, out, ankOut), finB = v(Xs + 110, out, ankOut);
    if (s > 0) {
      if (t <= T.stepA) return path([inA, v(Xs, sideY - 110, clr), v(Xs + 20, sideY + 110, clr), plantA], seg(t, T.up, T.stepA));
      if (t <= T.stepB) return plantA;
      const f = seg(t, T.stepB, T.turn); return vadd(vlerp(plantA, finA, f), v(0, 0, 70 * Math.sin(Math.PI * f)));
    }
    if (t <= T.shift) return inA;
    if (t <= T.stepB) return path([inA, v(Xs, sideY - 110, clr), v(Xs - 20, sideY + 110, clr), plantB], seg(t, T.shift, T.stepB));
    const f = seg(t, T.stepB + 0.3, T.turn); return vadd(vlerp(plantB, finB, f), v(0, 0, 70 * Math.sin(Math.PI * f)));
  };
  const hipAt = t => {
    if (t <= T.grip) return d.hip;
    if (t <= T.push) return vlerp(d.hip, hipPush, seg(t, T.grip, T.push));
    if (t <= T.up) return vlerp(hipPush, v(Xs, 0, standIn), seg(t, T.push, T.up));
    if (t <= T.stepA) return vlerp(v(Xs, 0, standIn), v(Xs, sideY - 120, standIn - 40), seg(t, T.up, T.stepA));
    if (t <= T.shift) return vlerp(v(Xs, sideY - 120, standIn - 40), v(Xs, sideY + 150, 880), seg(t, T.stepA, T.shift)); // straddling the rail
    if (t <= T.stepB) return vlerp(v(Xs, sideY + 150, 880), v(Xs, sideY + 210, standOut - 10), seg(t, T.shift, T.stepB));
    return vlerp(v(Xs, sideY + 210, standOut - 10), v(Xs, out, standOut), seg(t, T.stepB, T.turn));
  };
  const heading = t => Math.PI / 2 * seg(t, T.stepB, T.turn); // faces +x in the car, turns to face +y (the camera) once out
  const pose = (t, wave) => {
    const th = heading(t), fwd = v(Math.cos(th), Math.sin(th), 0), lat = v(-Math.sin(th), Math.cos(th), 0), fs = seg(t, T.push, T.up);
    const hip = hipAt(t), tDir = vnorm(vlerp(vnorm(vsub(d.sh, d.hip)), UP, fs)), sh = vadd(hip, vmul(tDir, 490)), head = vadd(sh, vmul(tDir, 280));
    const side = [1, -1].map(s => {
      const hp = vadd(hip, vmul(lat, 95 * s)), an = ankleAt(s, t);
      // feet: on the pedals while seated, then flat and pointing where he faces (toes dip a little while a foot is in the air)
      const sf0 = seatedFeet(s), dA = vsub(an, sf0.an), sf = { heel: vadd(sf0.heel, dA), toe: vadd(sf0.toe, dA) }, air = Math.max(0, Math.min(1, (an.z - (an.y > sideY ? ankOut : ankIn)) / 80));
      const heelS = vadd(vsub(an, vmul(fwd, 35)), v(0, 0, -73 + 30 * air)), toeS = vadd(vadd(an, vmul(fwd, 200)), v(0, 0, -60 - 25 * air));
      const heel = vlerp(sf.heel, heelS, fs), toe = vlerp(sf.toe, toeS, fs);
      const leg = ik(hp, an, THIGH, SHIN, vnorm(vadd(vlerp(UP, fwd, fs), vmul(lat, 0.15 * s))));
      const shp = vadd(vadd(sh, vmul(lat, 190 * s)), v(0, 0, -20));
      let hand;
      if (t <= T.grip) hand = vlerp(vadd(d.wc, v(0, d.wheelR * s * 0.95, 0)), v(d.sh.x + 60, s * (sideY + 10), railTop + 15), seg(t, 0, T.grip));
      else if (t <= T.push) hand = vlerp(v(d.sh.x + 60, s * (sideY + 10), railTop + 15), v(X0 + 40, s * (sideY + 10), railTop + 15), seg(t, T.grip, T.push)); // pressing down on the side tubes
      else if (t <= T.up) hand = vlerp(v(X0 + 40, s * (sideY + 10), railTop + 15), vadd(shp, vadd(vmul(lat, 70 * s), v(0, 0, -560))), seg(t, T.push, T.up));
      else hand = vadd(shp, vadd(vmul(lat, (70 + 120 * (t > T.up && t < T.stepB ? 1 : 0)) * s), v(0, 0, -560)));  // arms out for balance on the rail
      if (wave && s < 0) { const w = Math.sin(wave * 7); hand = vadd(shp, vadd(vmul(lat, -(260 + 70 * w)), v(0, 60, 420))); }
      const arm = ik(shp, hand, UARM, FARM, wave && s < 0 ? vadd(vmul(lat, -1), v(0, 0, -0.6)) : vadd(vmul(fwd, -1), vmul(lat, 0.6 * s)));
      return { hp, kn: leg.j, an: leg.end, heel, toe, shp, el: arm.j, hand: arm.end };
    });
    return { hip, sh, head, side };
  };
  const draw = (t, wave) => { const Q = pose(t, wave);
    setCyl(parts.torso, Q.hip, Q.sh); parts.pelvis.position.copy(V3(Q.hip)); parts.head.position.copy(V3(Q.head));
    Q.side.forEach((j, i) => { const m = parts.side[i];
      setCyl(m.th, j.hp, j.kn); m.kn.position.copy(V3(j.kn)); setCyl(m.sh, j.kn, j.an); setCyl(m.ft, j.heel, j.toe);
      setCyl(m.ua, j.shp, j.el); setCyl(m.fa, j.el, j.hand); m.hd.position.copy(V3(j.hand)); }); };
  draw(0);
  return { g, draw, pose, end: T.turn, headAt: t => pose(t).head, frame: { center: v((-M.WB / 2 + 150 + Xs) / 2, out / 2, 700), out } };
}
function egressUI() { const b = $('#bEgress'); if (!b) return; b.setAttribute('aria-pressed', egress.on ? 'true' : 'false'); b.classList.toggle('on', egress.on); b.textContent = egress.on ? 'Back in the seat' : 'Egress'; if (!egress.on) $('#bubble').hidden = true; }
function egressTick(now) {
  if (camTween) { const f = Math.min(1, (now - camTween.t0) / 1200), e = f * f * (3 - 2 * f); camera.position.lerpVectors(camTween.p0, camTween.p1, e); controls.target.lerpVectors(camTween.c0, camTween.c1, e); if (f >= 1) camTween = null; }
  if (!rig || !egress.on) return;
  const t = (now - egress.t0) / 1000, done = t >= rig.end;
  rig.draw(Math.min(t, rig.end), done ? t - rig.end + 0.0001 : 0);
  const bb = $('#bubble');
  if (done && t > rig.end + 0.5 && layerOn.driver) { const h = rig.headAt(rig.end), p = new THREE.Vector3(h.x, h.y, h.z + 200).project(camera);
    const w = vp.clientWidth, hh = vp.clientHeight, x = (p.x + 1) / 2 * w, y = (1 - p.y) / 2 * hh;
    bb.hidden = p.z > 1; bb.style.left = Math.max(8, Math.min(w - 230, x - 30)) + 'px'; bb.style.top = Math.max(8, y - 64) + 'px'; }
  else bb.hidden = true;
}
let camTween = null;
function frameEgress() { // pull the camera back so the car and the driver standing beside it (waving) are both in view
  const c = rig.frame.center, c1 = new THREE.Vector3(c.x, c.y, c.z), n = new THREE.Vector3(1.0, 1.15, 0.5).normalize().multiplyScalar(6200);
  camTween = { t0: performance.now(), p0: camera.position.clone(), c0: controls.target.clone(), p1: c1.clone().add(n), c1 };
}
function setView(k) {
  const c = new THREE.Vector3(-M.WB / 2 + 150, 0, 420), D = 4200;
  const pos = { iso: [1.0, 1.05, 0.62], side: [0, 1, 0.02], top: [0.0001, 0, 1], front: [1, 0, 0.08] }[k];
  const n = new THREE.Vector3(...pos).normalize().multiplyScalar(D);
  camera.position.copy(c.clone().add(n)); controls.target.copy(c); controls.update();
}
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => setView(b.dataset.view));
function resize() { const w = vp.clientWidth, h = vp.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(vp);
(function loop(now) { requestAnimationFrame(loop); if (animSusp) applyTravel(travelNow()); egressTick(now || performance.now()); controls.update(); renderer.render(scene, camera); })();
// picking
const ray = new THREE.Raycaster(); let down = null;
cv.addEventListener('pointerdown', e => down = [e.clientX, e.clientY]);
cv.addEventListener('pointerup', e => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
  const r = cv.getBoundingClientRect(), m = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(m, camera); const hit = ray.intersectObjects(pickables.filter(o => { let p = o; while (p) { if (!p.visible) return false; p = p.parent; } return true; }), false)[0];
  if (hit) { select(hit.object.userData.pid, true); } else select(null);
});
function highlight() {
  pickables.forEach(o => o.material = (selId && o.userData.pid === selId) ? selMat : o.userData.base);
  document.querySelectorAll('tr.part').forEach(tr => tr.classList.toggle('sel', tr.dataset.id === selId));
}
function select(id, open) { selId = id; highlight(); if (id && open) openPart(id); }

/* ---------- panels ---------- */
const fmt = (n, d = 0) => isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—';
function costs() {
  const fab = M.parts.reduce((s, p) => s + partCost(p, RATES, P.mat) * p.qty, 0);
  const buy = BUYC.reduce((s, b) => s + b.qty * b.each, 0);
  return { fab, buy, total: fab + buy };
}
function renderSummary() {
  const c = costs(), s = M.steer;
  $('#summary').innerHTML = [
    ['Frame mass', `${fmt(M.mass.frame, 1)} kg`], ['Car est.', `${fmt(M.mass.total, 0)} kg`], ['Fab est.', `$${fmt(c.fab)}`],
    ['Ackermann @20°', `${fmt(s.ack20, 0)} %`], ['Turn radius', `${fmt(s.Rout / 1000, 2)} m`], [s.rackDriven ? 'Rack c–c, driven' : 'Rack c–c, fixed', `${fmt(s.rackLen)} mm`]
  ].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
}
function renderChecks() {
  const order = { fail: 0, warn: 1, pass: 2 };
  const row = c => `<div class="check"><span class="pill ${c.status}">${c.status}</span><span><span class="a">${esc(c.area)}</span>${esc(c.text)}</span><span class="val">${esc(c.value)}</span></div>`;
  const sec = (title, sub, list) => { const nf = list.filter(c => c.status === 'fail').length, nw = list.filter(c => c.status === 'warn').length;
    return `<h3 class="chk-h">${title} <small>${list.length} checks · ${nf ? `<b class="bad">${nf} fail</b>` : 'all pass'}${nw ? ` · ${nw} warn` : ''}</small></h3><p class="note">${sub}</p>` + [...list].sort((a, b) => order[a.status] - order[b.status]).map(row).join(''); };
  const rules = M.checks.filter(c => c.rule), user = M.checks.filter(c => !c.rule);
  $('#tab-checks').innerHTML =
    sec('FSAE rule checks', 'Items from the Formula SAE rulebook: 95th-percentile template and rollover envelope, Size A/B/C tubing, hoop and brace geometry, bulkhead, side impact, firewall, harness, wheelbase, track and travel. Confirm every item against the current rulebook and your SES before cutting tube.', rules) +
    sec('Builder design checks', 'The builder\'s own engineering, fit and fabrication checks (suspension, shocks, uprights, steering, packaging, human factors, build jigs). Not rules: they flag what will bind, clash, overstress or be hard to build.', user);
}
function chart(cvs, series, xr, yr, xl, yl) {
  const dpr = window.devicePixelRatio || 1, w = cvs.clientWidth || 360, h = cvs.clientHeight || 170;
  cvs.width = w * dpr; cvs.height = h * dpr; const g = cvs.getContext('2d'); g.scale(dpr, dpr);
  const cs = getComputedStyle(document.documentElement), ink = cs.getPropertyValue('--muted').trim(), line = cs.getPropertyValue('--line').trim();
  const L = 44, R = 10, T = 10, B = 28, X = x => L + (x - xr[0]) / (xr[1] - xr[0]) * (w - L - R), Y = y => T + (1 - (y - yr[0]) / (yr[1] - yr[0])) * (h - T - B);
  g.font = '11px "JetBrains Mono", monospace'; g.fillStyle = ink; g.strokeStyle = line; g.lineWidth = 1;
  const ticks = (a, b, n) => { const st = (b - a) / n; return Array.from({ length: n + 1 }, (_, i) => a + st * i); };
  ticks(yr[0], yr[1], 4).forEach(y => { g.beginPath(); g.moveTo(L, Y(y)); g.lineTo(w - R, Y(y)); g.stroke(); g.fillText((+y.toFixed(2)).toString(), 4, Y(y) + 4); });
  ticks(xr[0], xr[1], 4).forEach(x => { g.fillText((+x.toFixed(1)).toString(), X(x) - 10, h - 12); });
  g.fillText(xl, w - R - g.measureText(xl).width, h - 1); g.save(); g.translate(11, T + 2); g.restore();
  g.fillText(yl, L + 4, T + 10);
  series.forEach(s => {
    g.strokeStyle = s.color; g.lineWidth = 2; g.setLineDash(s.dash || []); g.beginPath();
    s.pts.forEach((p, i) => { const fx = X(p[0]), fy = Y(Math.max(yr[0], Math.min(yr[1], p[1]))); i ? g.lineTo(fx, fy) : g.moveTo(fx, fy); }); g.stroke(); g.setLineDash([]);
  });
  let lx = L + 6; series.forEach(s => { g.fillStyle = s.color; g.fillRect(lx, h - B - 14, 10, 3); g.fillStyle = ink; g.fillText(s.label, lx + 14, h - B - 10); lx += g.measureText(s.label).width + 30; });
}
function uprightHTML() {
  const rows = [];
  for (const [ax, nm] of [['F', 'Front'], ['R', 'Rear']]) {
    const u = M.comp.upr[ax], ms = M.comp.mis[ax];
    rows.push(`<tr><td>${nm}</td><td class="n">${u.plates.length}</td><td class="n">${u.massKg.toFixed(2)} kg</td><td class="n">${u.shaftLen.toFixed(0)} mm</td><td class="n">${u.calSpacer.toFixed(1)} mm</td><td class="n">${ms.up.toFixed(1)}° / ${ms.lo.toFixed(1)}°</td><td class="n">${ms.tie.toFixed(1)}°</td><td class="n">${ms.inb.toFixed(1)}° <small>(${ms.inbSplay.toFixed(0)}°)</small></td></tr>`);
  }
  const a = M.comp.upr.F.armInfo, r = M.comp.upr.R.armInfo;
  return `<div style="overflow-x:auto"><table><tr><th>Axle</th><th class="n">Plates</th><th class="n">Mass ea.</th><th class="n">25 mm shaft</th><th class="n">Plate face to rotor center</th><th class="n">Rod ends upper / lower</th><th class="n">Link rod end</th><th class="n">Inboard rod ends (clevis turned)</th></tr>${rows.join('')}</table></div>
  <h3>Fit check</h3><div style="overflow-x:auto"><table><tr><th>Axle</th><th class="n">Upper stack</th><th class="n">Lower stack</th><th class="n">Link stack</th><th class="n">Upper arm clear</th><th class="n">Lower arm clear</th><th class="n">Link clear</th></tr>
  ${['F', 'R'].map(ax => { const u = M.comp.upr[ax]; return `<tr><td>${ax === 'F' ? 'Front' : 'Rear'}</td><td class="n">${u.sTop} mm</td><td class="n">${u.sBot} mm</td><td class="n">${u.armInfo.stack.toFixed(1)} mm</td><td class="n">${u.clear.upper.toFixed(1)} mm</td><td class="n">${u.clear.lower.toFixed(1)} mm</td><td class="n">${u.clear.tie.toFixed(1)} mm</td></tr>`; }).join('')}</table></div>
  <p class="note">Stack is the spacer height between each rod-end ball and its ear. The builder grows each stack until the rod-end housing, apex bung and first 130 mm of each arm leg clear every upright plate by 3 mm, checked at ride height, ±25 mm and both steering locks. Then it sets the tie-rod and toe-link heights so their rod ends sit on the bottom ear (Auto in Front suspension).</p>
  <p class="note">Each upright is a twin-plate box of 1/8 in 4130 with 1/4 in ears, welded. Two SBPFL205 2-bolt flange bearings (25 mm) bolt to the outside faces with two M10 through-bolts and spacer tubes, so nothing needs machining. A 25 mm shaft carries a laser-cut hub flange (4 × 100 studs) and a laser-cut 4130 rotor, 4.76 mm thick; grind it flat after cutting. A Wilwood PS-1 (120-5453 RH / 120-5456 LH) bolts to lugs on the outboard plate; the "plate face to rotor center" figure sets its spacer once you measure the caliper's lug-to-rotor offset.</p>
  <p class="note">Every joint at the upright is a standard catalog male rod end with one bolt along the kingpin: the upper A-arm rod end sits on top of the top ear, the lower one hangs under the bottom ear, and the ${a.merged ? 'tie-rod rod end sits on top of the bottom ear' : 'tie-rod rod end sits on top of the steering arm'} (front) and the ${r.merged ? `toe-link rod end sits on top of the bottom ear on a ${r.stack.toFixed(1)} mm spacer stack` : 'toe-link rod end sits on top of the toe arm'} (rear). Steering turns the upright about those bolts, so the rod ends only take suspension misalignment, shown above. Rear: the 25 mm shaft is driven by welding it to the halfshaft's outer CV housing, or by a splined stub sized to your CV.</p>`;
}
function shockTable() {
  const sh = M.comp.shock, mt = M.mass.total + 77, rows = [];
  const springFor = (ax, s) => { const share = ax === 'F' ? 0.45 : 0.55, fHz = ax === 'F' ? 2.8 : 3.0, m = mt * share / 2 - 14; const kw = m * (2 * Math.PI * fHz) ** 2 / 1000; return kw / (s.mr * s.mr); };
  for (const [ax, nm, L, mr] of [['F', 'Front', sh.F.len, P.mrF], ['R', 'Rear', sh.R.len, P.mrR]]) {
    const s = sh[ax];
    if (!s.Lm) { rows.push(`<tr><td>${nm}</td><td colspan="2">No fit at ${L.toFixed(0)} mm. Try the longer shock or more sag.</td></tr>`); continue; }
    const k = springFor(ax, s);
    const top = s.ST ? `tower, ${(s.ST.y - s.SHU.y).toFixed(0)} out / ${(s.ST.z - s.SHU.z).toFixed(0)} up` : `tabs, ${s.h.toFixed(0)} mm @ ${s.phi.toFixed(0)}°`;
    const low = s.onUpright ? `upright ear, ${s.steerArm.toFixed(0)} mm off steer axis` : `${s.bolt ? 'through-bolt' : 'web + clevis'}, ${(s.f * 100).toFixed(0)}% out the arm`;
    const ab = M.comp.armBend && M.comp.armBend[ax];
    rows.push(`<tr><td>${nm}</td><td class="n">${L.toFixed(0)} mm</td><td class="n">${s.mr.toFixed(2)} <small>(target ${mr.toFixed(2)}, max ${s.mrMax.toFixed(2)})</small></td><td class="n">${top}</td><td class="n">${low}</td><td class="n">${ab && !ab.none ? `${ab.sigma.toFixed(0)} MPa · ${ab.tube.label}` : 'no spring load'}</td><td class="n">${s.clear.gap.toFixed(0)} mm</td><td class="n">${s.bump.toFixed(0)} bump / ${s.droop.toFixed(0)} droop of ${sh.spec.stroke.toFixed(0)}</td><td class="n">${(k * 5.71).toFixed(0)} lb/in</td></tr>`);
  }
  return `<p class="note">Front: <b>${sh.spec.label}</b>, ${sh.spec.eye} mm eye-to-eye extended, ${sh.spec.stroke.toFixed(1)} mm stroke, ${(P.shockSag ?? 30)}% sag → ${sh.F.len ? sh.F.len.toFixed(0) : '–'} mm at ride height.${sh.specR && sh.specR !== sh.spec ? ` Rear: <b>${sh.specR.label}</b>, ${sh.specR.stroke.toFixed(1)} mm stroke → ${sh.R.len ? sh.R.len.toFixed(0) : '–'} mm at ride height (longer spring, ${sh.specR.springFree} mm free).` : ''} FOX steel spring, 1.385 in ID (~${(sh.fox.springID + 2 * sh.fox.wire).toFixed(0)} mm OD), 2.3–2.5 in stroke family; 8 mm bolts through 22.2 mm-wide eye hardware. Spring rate column picks from FOX's 250–800 lb range.</p><div style="overflow-x:auto"><table><tr><th>Axle</th><th class="n">Installed</th><th class="n">Motion ratio</th><th class="n">Top mount</th><th class="n">Lower eye</th><th class="n">Lower-arm bending, 3 g</th><th class="n">Spring clear</th><th class="n">Shaft travel ±25, mm</th><th class="n">Spring est.</th></tr>${rows.join('')}</table></div>
  <p class="note">Default layout: short coilovers on tab pairs off the upper rail (a tab can hang outboard and down under the upper wishbone, or lean up through it). Front: the lower eye sits on a 5/16 in bolt that runs along the pivot axis through weld-in sleeves in both lower-arm legs, with loose spacers either side of the eye; the legs carrying it are sized for a 3 g bump. Rear: the lower eye sits in a 3/16 in clevis ear welded into the corner of the upright's inboard plate and bottom ear, so the lower arm carries no spring load. Because that load enters the upright away from the steer axis, it tries to steer the wheel and the toe link reacts it; By default the ear sits on the toe arm and its two plates straddle the toe link (the link runs between them through a window in the inboard plate), with the eye above it; the Rear upright ear position setting can instead put it ahead of the axle where the steer moment is smallest.</p>
  <p class="note">For your installed length and target ratio the solver picks the lower eye, tab lean and reach (or tower), and up to ~12° of side-view lean. It checks the spring (Ø54) and damper head and body (Ø44) and the tabs against both arms, apex bungs, links, frame, halfshaft, outer CV and tire through ±25 mm. Motion ratio is shock travel over wheel travel. Spring estimate assumes 45/55 weight split with a 77 kg driver, 14 kg unsprung per corner, and 2.8 / 3.0 Hz ride.</p>
  <p class="note">Shorter shocks give lower ratios: the top tab can only reach so far off the rail, so the lower eye has to move inboard. Longer tabs (with a gusset) or a tower buy ratio back.</p>`;
}
function renderGeo() {
  const k = M.kin, s = M.steer, gF = M.gF, gR = M.gR;
  const cs = getComputedStyle(document.documentElement), acc = cs.getPropertyValue('--accent').trim(), cob = cs.getPropertyValue('--cobalt').trim(), mu = cs.getPropertyValue('--muted').trim();
  $('#tab-geo').innerHTML = `
  <h3>Camber vs wheel travel</h3><canvas class="chart" id="chCam"></canvas>
  <div class="kv" style="margin-top:6px"><span>Front gain (target ${GAINS[P.gainF].deg}°/25 mm)</span><b>${fmt(k.F.gainPer25, 2)}°/25 mm</b><span>Rear gain (target ${GAINS[P.gainR].deg}°/25 mm)</span><b>${fmt(k.R.gainPer25, 2)}°/25 mm</b>
  <span>Front swing arm length</span><b>${fmt(gF.fvsa)} mm</b><span>Rear swing arm length</span><b>${fmt(gR.fvsa)} mm</b></div>
  <h3>Bump steer</h3><canvas class="chart" id="chToe"></canvas>
  <p class="note">Tie-rod and toe-link inner points are placed where the line through the arm pivots meets the line from the outer tie-rod point to the instant center, then verified with a full 3D linkage solve including caster.</p>
  <div class="kv"><span>Front toe change, ±25 mm</span><b>${fmt(k.F.bumpSteer, 3)}°</b><span>Rear toe change, ±25 mm</span><b>${fmt(k.R.bumpSteer, 3)}°</b></div>
  <h3>Ackermann</h3><canvas class="chart" id="chAck"></canvas>
  <div class="kv" style="margin-top:6px"><span>Steering arm angle (solved)</span><b>${fmt(s.alphaDeg, 1)}°</b><span>Ackermann at 20° inner</span><b>${fmt(s.ack20, 1)} %</b>
  <span>Rack travel to ${P.maxSteer}° inner</span><b>${fmt(s.dRack, 1)} mm</b><span>Outer wheel at lock</span><b>${fmt(s.dOut, 1)}°</b>
  <span>Lock to lock</span><b>${fmt(s.turns * 360, 0)}° wheel</b><span>Overall steering ratio</span><b>${fmt(s.ratio, 1)} : 1</b>
  <span>Rack inner pivot c–c (${s.rackDriven ? 'driven by zero bump steer' : 'fixed'})</span><b>${fmt(s.rackLen)} mm</b><span>Rack travel used / stroke</span><b>±${fmt(s.dRack, 1)} / ±${fmt(P.rackStroke / 2, 0)} mm</b><span>Tie rod, ball center to ball center</span><b>${fmt(s.trLen)} mm</b><span>Tie rod tube cut (${M.comp.RE.label} rod ends, ${P.rodOff} mm each)</span><b>${fmt(s.trLen - 2 * P.rodOff, 1)} mm</b></div>
  <h3>Fabricated uprights</h3>
  ${uprightHTML()}
  <h3>Shocks · coilovers</h3>
  ${shockTable()}
  <h3>Pickup points · left side, mm</h3>
  <div style="overflow-x:auto"><table><tr><th>Point</th><th class="n">X</th><th class="n">Y</th><th class="n">Z</th></tr>
  ${[['F lower front', gF.LIPf], ['F lower rear', gF.LIPr], ['F upper front', gF.UIPf], ['F upper rear', gF.UIPr], ['F lower ball joint', gF.LBJ], ['F upper ball joint', gF.UBJ], ['F tie rod outer', gF.OTR], ['F tie rod inner', gF.ITR],
      ['R lower front', gR.LIPf], ['R lower rear', gR.LIPr], ['R upper front', gR.UIPf], ['R upper rear', gR.UIPr], ['R lower ball joint', gR.LBJ], ['R upper ball joint', gR.UBJ], ['R toe link outer', gR.OTR], ['R toe link inner', gR.ITR]]
      .map(([n, p]) => `<tr><td>${n}</td><td class="n">${fmt(p.x, 1)}</td><td class="n">${fmt(p.y, 1)}</td><td class="n">${fmt(p.z, 1)}</td></tr>`).join('')}</table></div>
  <p class="note">Origin: front axle centerline at ground. X forward, Y left, Z up.</p>`;
  const cam = s2 => s2.pts.map(p => [p.dz, p.camber]), toe = s2 => s2.pts.map(p => [p.dz, p.toe]);
  const allC = [...cam(k.F), ...cam(k.R)].map(p => p[1]), cmin = Math.floor(Math.min(...allC) * 2) / 2, cmax = Math.ceil(Math.max(...allC) * 2) / 2;
  chart($('#chCam'), [{ pts: cam(k.F), color: acc, label: 'Front' }, { pts: cam(k.R), color: cob, label: 'Rear' }], [-38, 38], [cmin, cmax], 'travel mm', 'camber °');
  const tm = Math.max(0.1, ...[...toe(k.F), ...toe(k.R)].map(p => Math.abs(p[1]))) * 1.2;
  chart($('#chToe'), [{ pts: toe(k.F), color: acc, label: 'Front' }, { pts: toe(k.R), color: cob, label: 'Rear' }], [-38, 38], [-tm, tm], 'travel mm', 'toe-in °');
  const sw = s.sw, act = sw.pts.filter(p => p.di <= 34).map(p => [p.di, p.dout]);
  const ideal = act.map(p => [p[0], idealOuter(p[0], sw.tk, sw.WB)]), par = act.map(p => [p[0], p[0]]);
  chart($('#chAck'), [{ pts: act, color: acc, label: 'Outer wheel' }, { pts: ideal, color: cob, label: 'Ideal', dash: [5, 4] }, { pts: par, color: mu, label: 'Parallel', dash: [2, 4] }], [0, 34], [0, 34], 'inner wheel °', 'outer °');
}
const GROUP_TITLES = { tube: 'Frame tubes · laser cut & coped', hoop: 'Roll hoops · bent', stube: 'Arms, links & steering shafts', turned: 'Turned parts', plate: 'Laser-cut plates' };
function renderParts() {
  let h = `<p class="note">Click a row to open its drawing. Mirrored L/R tubes share a part number; the export writes both hands.</p><div style="overflow-x:auto"><table><tr><th>ID</th><th>Part</th><th class="n">Qty</th><th class="n">Size</th><th class="n">kg ea</th></tr>`;
  for (const kind of ['tube', 'hoop', 'stube', 'turned', 'plate']) {
    h += `<tr class="grp"><td colspan="5">${GROUP_TITLES[kind]}</td></tr>`;
    M.parts.filter(p => p.kind === kind).forEach(p => {
      const size = p.kind === 'plate' ? `${PMAT[p.mat].label.split('·')[1].trim()}<br>${p.size}` : p.kind === 'turned' ? `${p.thread}<br>${p.size}` : `${p.tube.label}<br>${fmt(p.cut)} mm`;
      h += `<tr class="part" data-id="${p.id}"><td class="id">${p.id}</td><td>${esc(p.name)}${p.mirror ? ' <small style="color:var(--muted)">L/R</small>' : ''}</td><td class="n">${p.qty}</td><td class="n">${size}</td><td class="n">${fmt(p.mass, 2)}</td></tr>`;
    });
  }
  h += `<tr class="grp"><td colspan="5">Buy parts</td></tr>` + BUYC.map(b => `<tr><td class="id">B</td><td>${esc(b.name)}</td><td class="n">${b.qty}</td><td class="n" colspan="2">see Cost</td></tr>`).join('') + '</table></div>';
  $('#tab-parts').innerHTML = h;
  $('#tab-parts').querySelectorAll('tr.part').forEach(tr => tr.onclick = () => select(tr.dataset.id, true));
}
function renderCost() {
  const c = costs(), byKind = k => M.parts.filter(p => p.kind === k).reduce((s, p) => s + partCost(p, RATES, P.mat) * p.qty, 0);
  const rateRows = [['turned', 'Turned apex bung, $/each'], ['tube4130.A', 'Size A tube, $/m'], ['tube4130.B', 'Size B tube, $/m'], ['tube4130.C', 'Size C tube, $/m'], ['tube4130.arm', 'Arm tube, $/m'], ['tube4130.steer', 'Link tube, $/m'],
  ['mildMult', 'Mild steel price factor'], ['laserPart', 'Tube laser, $/part'], ['copeEnd', 'Coped end, $/end'], ['bend', 'Hoop bend, $/bend'],
  ['plateSteel', 'Steel plate, $/kg'], ['plateAl', 'Aluminum plate, $/kg'], ['cutPerM', 'Laser cut, $/m'], ['platePart', 'Plate setup, $/part'], ['hole', 'Pierce, $/hole']];
  const get = k => k.split('.').reduce((o, x) => o[x], RATES);
  $('#tab-cost').innerHTML = `
  <div class="kv"><span>Frame tubes (laser cut)</span><b>$${fmt(byKind('tube'))}</b><span>Roll hoops (bent)</span><b>$${fmt(byKind('hoop'))}</b><span>Arms, links, shafts</span><b>$${fmt(byKind('stube'))}</b><span>Laser-cut plates</span><b>$${fmt(byKind('plate'))}</b>
  <span>Buy parts</span><b>$${fmt(c.buy)}</b><span style="font-weight:600">Total estimate</span><b style="color:var(--accent)">$${fmt(c.total)}</b></div>
  <p class="note">These are planning estimates from the editable rates below, not an OSHcut quote. OSHcut prices from the uploaded file in their quoting page; this page cannot reach oshcut.com, and there is no OSHcut connector to call.</p>
  <h3>Send to OSHcut</h3>
  <ol class="steps">
    <li>Export the package. Plates are in <code>oshcut/plates/</code> as clean single-layer DXF, one per part, named with material and quantity.</li>
    <li>Upload the plate DXFs at <a href="https://www.oshcut.com" target="_blank" rel="noopener">oshcut.com</a>, choose the material shown in the file name, set quantity, and read the live price.</li>
    <li>Upload the coped tube STEP files from <code>oshcut/tubes-step/</code> to OSHcut's tube laser. Each is an exact solid with the cope cut along the mating tube's cylinder; mirrored parts come as separate L and R files. The 1:1 wrap templates in <code>drawings/tube-wraps/</code> remain for hand notching.</li>
    <li>Roll hoops go to a bender: <code>drawings/hoops/</code> has the bend table and <code>step/hoops/</code> the bent solid. <code>step/frame-assembly.step</code> holds the whole frame for CAD.</li>
  </ol>
  <h3>Send to SendCutSend</h3>
  ${scsSummaryHTML()}
  <ol class="steps">
    <li>Export the SendCutSend package. Plates are in <code>sendcutsend/plates/</code>: inch DXF, 1:1, one part per file, cut geometry only on a single layer, as their file guidelines ask.</li>
    <li>Drag the whole folder into the quote page at <a href="https://app.sendcutsend.com" target="_blank" rel="noopener">app.sendcutsend.com</a>, confirm inches, then set material and quantity from <code>sendcutsend/order-sheet.csv</code>. Pricing appears instantly per part.</li>
    <li>Tubes in <code>sendcutsend/tubes-step/</code> are STEP, the format their tube service takes, and each is checked against their 60 in length limit. Their tube laser was waitlisted when this was built, so check availability before planning on it.</li>
    <li>SendCutSend doesn't bend tube: send the hoops to a bender with <code>drawings/hoops/</code>.</li>
  </ol>
  <h3>Rates</h3><div class="rates">${rateRows.map(([k, l]) => `<label for="r_${k}">${l}</label><input id="r_${k}" data-k="${k}" type="number" step="0.05" value="${get(k)}">`).join('')}</div>
  <h3>Buy parts · est. each</h3><div class="rates">${BUYC.map((b, i) => `<label for="b_${i}">${esc(b.name)} × ${b.qty}</label><input id="b_${i}" data-i="${i}" type="number" step="1" value="${b.each}">`).join('')}</div>
  <p class="note">Buy-part prices are placeholders to edit with your supplier numbers.</p>`;
  $('#tab-cost').querySelectorAll('input[data-k]').forEach(inp => inp.onchange = () => { const ks = inp.dataset.k.split('.'); let o = RATES; while (ks.length > 1) o = o[ks.shift()]; o[ks[0]] = +inp.value || 0; renderSummary(); refreshCostTop(); });
  $('#tab-cost').querySelectorAll('input[data-i]').forEach(inp => inp.onchange = () => { BUYC[+inp.dataset.i].each = +inp.value || 0; renderSummary(); refreshCostTop(); });
}
function refreshCostTop() { const kv = $('#tab-cost .kv'); const c = costs(); kv.lastElementChild.textContent = `$${fmt(c.total)}`; kv.children[9].textContent = `$${fmt(c.buy)}`; }
document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
  document.querySelectorAll('[data-tab]').forEach(x => x.setAttribute('aria-selected', x === b)); document.querySelectorAll('.tabpane').forEach(p => p.hidden = p.id !== 'tab-' + b.dataset.tab);
  if (b.dataset.tab === 'geo') renderGeo();
});

/* ---------- DXF viewer ---------- */
let dxfView = null;
function openPart(id) {
  const p = M.parts.find(q => q.id === id); if (!p) return;
  const ents = partEntities(M, p);
  $('#mTitle').textContent = `${p.id} · ${p.name}`;
  let info = '';
  if (p.kind === 'plate') {
    info = `<div class="kv"><span>Material</span><b>${PMAT[p.mat].label}</b><span>Quantity</span><b>${p.qty}</b><span>Envelope</span><b>${p.size}</b><span>Area</span><b>${fmt(p.area / 100, 1)} cm²</b><span>Cut length</span><b>${fmt(p.perim / 1000, 2)} m</b><span>Holes</span><b>${p.holes}</b><span>Mass each</span><b>${fmt(p.mass, 3)} kg</b><span>Est. cost each</span><b>$${fmt(partCost(p, RATES, P.mat), 2)}</b></div><p class="note">${esc(p.where)}. ${esc(p.note)}</p><p class="note">DXF exported in mm, outline and holes only, ready for OSHcut upload.</p>`;
  } else if (p.kind === 'turned') {
    info = `<div class="kv"><span>Outside diameter</span><b>${p.od.toFixed(2)} mm</b><span>Length</span><b>${p.len} mm</b><span>Thread</span><b>${p.thread}</b><span>Tap drill</span><b>${p.tapName}</b><span>Quantity</span><b>${p.qty}</b><span>Mass each</span><b>${fmt(p.mass, 3)} kg</b><span>Est. cost each</span><b>$${fmt(partCost(p, RATES, P.mat), 2)}</b></div><p class="note">${esc(p.note)}</p><p class="note">Export includes this drawing and a STEP model (bore shown at tap-drill size, thread called out on the drawing).</p>`;
  } else if (p.kind === 'hoop') {
    info = `<div class="kv"><span>Tube</span><b>${p.tube.label}</b><span>Developed length</span><b>${fmt(p.cut)} mm</b><span>Centerline radius</span><b>${p.CLR} mm</b><span>Mass</span><b>${fmt(p.mass, 2)} kg</b></div><h3>Bend table</h3><table><tr><th>#</th><th class="n">Angle</th><th class="n">From start</th></tr>${p.bends.map((b, i) => `<tr><td>${i + 1}</td><td class="n">${b.deg.toFixed(1)}°</td><td class="n">${fmt(b.at)} mm</td></tr>`).join('')}</table><p class="note">Single continuous tube, all bends in one plane. Ends square cut; lower rails and cross tubes cope to the hoop.</p>`;
  } else {
    info = `<div class="kv"><span>Tube</span><b>${p.tube.label}</b><span>Alloy</span><b>${P.mat === '4130' ? '4130 N' : '1020 DOM'}</b><span>Cut length (long point)</span><b>${fmt(p.cut, 1)} mm</b><span>Coped ends</span><b>${p.copes}</b><span>Quantity</span><b>${p.qty}${p.mirror ? ' (L/R mirror)' : ''}</b><span>Mass each</span><b>${fmt(p.mass, 3)} kg</b><span>Est. cost each</span><b>$${fmt(partCost(p, RATES, P.mat), 2)}</b></div>
    <p class="note">${p.kind === 'tube' ? 'Drawing is the 1:1 wrap template: width equals outer circumference, each edge is a cope profile. Dashed lines mark 90° stations. Export includes the STEP solid for OSHcut.' : esc(p.note || '') + ' Export includes a STEP solid.'}</p>`;
  }
  $('#mInfo').innerHTML = info; $('#modal').hidden = false; dxfView = { ents, p, z: 1, ox: 0, oy: 0 }; fitDxf(); drawDxf();
}
function fitDxf() {
  const xs = [], ys = []; dxfView.ents.forEach(e => { if (e.t === 'L') { xs.push(e.x1, e.x2); ys.push(e.y1, e.y2); } else if (e.t === 'T') { xs.push(e.x); ys.push(e.y); } else { xs.push(e.cx - e.r, e.cx + e.r); ys.push(e.cy - e.r, e.cy + e.r); } });
  dxfView.bb = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }; dxfView.z = 1; dxfView.ox = 0; dxfView.oy = 0;
}
function drawDxf() {
  const c = $('#dxf'), dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight; c.width = w * dpr; c.height = h * dpr;
  const g = c.getContext('2d'); g.scale(dpr, dpr); g.fillStyle = '#1B232A'; g.fillRect(0, 0, w, h);
  const bb = dxfView.bb, pad = 30, s0 = Math.min((w - 2 * pad) / (bb.x1 - bb.x0 || 1), (h - 2 * pad) / (bb.y1 - bb.y0 || 1)), s = s0 * dxfView.z;
  const X = x => w / 2 + (x - (bb.x0 + bb.x1) / 2) * s + dxfView.ox, Y = y => h / 2 - (y - (bb.y0 + bb.y1) / 2) * s + dxfView.oy;
  // 10 mm grid
  const step = s * 10 < 8 ? 100 : 10; g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 1;
  for (let x = Math.floor(bb.x0 / step) * step - step * 20; x < bb.x1 + step * 20; x += step) { g.beginPath(); g.moveTo(X(x), 0); g.lineTo(X(x), h); g.stroke(); }
  for (let y = Math.floor(bb.y0 / step) * step - step * 20; y < bb.y1 + step * 20; y += step) { g.beginPath(); g.moveTo(0, Y(y)); g.lineTo(w, Y(y)); g.stroke(); }
  dxfView.ents.forEach(e => {
    const note = e.layer === 'NOTES'; g.strokeStyle = note ? '#6E8193' : '#F0B26C'; g.fillStyle = '#AFC0CF'; g.lineWidth = note ? 1 : 1.6; g.setLineDash(note && e.t !== 'T' ? [5, 4] : []);
    g.beginPath();
    if (e.t === 'L') { g.moveTo(X(e.x1), Y(e.y1)); g.lineTo(X(e.x2), Y(e.y2)); g.stroke(); }
    else if (e.t === 'C') { g.arc(X(e.cx), Y(e.cy), e.r * s, 0, Math.PI * 2); g.stroke(); }
    else if (e.t === 'A') { g.arc(X(e.cx), Y(e.cy), e.r * s, -e.a1 * D2R, -e.a0 * D2R); g.stroke(); }
    else if (e.t === 'T') { g.font = `${Math.max(10, Math.min(14, e.h * s))}px "JetBrains Mono", monospace`; g.fillText(e.s, X(e.x), Y(e.y)); }
  });
  g.setLineDash([]); g.fillStyle = '#8D99A4'; g.font = '12px "JetBrains Mono", monospace';
  g.fillText(`${(bb.x1 - bb.x0).toFixed(1)} × ${(bb.y1 - bb.y0).toFixed(1)} mm · scroll to zoom, drag to pan`, 10, h - 10);
}
(() => {
  const c = $('#dxf'); let drag = null;
  c.addEventListener('wheel', e => { e.preventDefault(); dxfView.z *= e.deltaY < 0 ? 1.15 : 1 / 1.15; drawDxf(); }, { passive: false });
  c.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY]; c.setPointerCapture(e.pointerId); });
  c.addEventListener('pointermove', e => { if (!drag) return; dxfView.ox += e.clientX - drag[0]; dxfView.oy += e.clientY - drag[1]; drag = [e.clientX, e.clientY]; drawDxf(); });
  c.addEventListener('pointerup', () => drag = null);
  c.addEventListener('dblclick', () => { fitDxf(); drawDxf(); });
})();
$('#mClose').onclick = () => { $('#modal').hidden = true; };
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') $('#modal').hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#modal').hidden = true; });
window.addEventListener('resize', () => { if (!$('#modal').hidden) drawDxf(); });

/* ---------- export ---------- */
const APP_VERSION = '1.2';
const LICENSE_TXT = `FSAE Chassis Builder v1.2 and exported design files
Source: https://github.com/X1Racing/FSAE
Copyright (c) 2026 Mac McAlpine, X1 Racing

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Suggested credit: "FSAE Chassis Builder by Mac McAlpine, X1Racing.com, licensed under the MIT License."

The X1 Racing name and logo are trademarks of X1 Racing and are not licensed under the MIT License.
Design files are provided as is. Verify every part against the current Formula SAE rules and your own
engineering review before fabrication or use. This license does not relicense three.js, OrbitControls,
JSZip, or the Google Fonts loaded by the builder page.
`;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(t._t); t._t = setTimeout(() => t.hidden = true, 3800); }
const safe = s => s.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
function plateFile(p) { return `oshcut/plates/${p.id}_${safe(p.name)}_${safe(PMAT[p.mat].label)}_qty${p.qty}.dxf`; }
function tubeTrisFor(p) {
  const out = [];
  if (p.kind === 'tube') { memberTris(M, M.members[p.members[0]], out); }
  else if (p.kind === 'hoop') { for (let i = 0; i < p.pts.length - 1; i++) segTris(p.pts[i], p.pts[i + 1], p.tube.od, p.tube.t, out); }
  else if (p.kind === 'stube' && p.prof) tubeTris(p.prof.n1, p.prof.a, p.prof.e1, p.prof.e2, p.tube.od / 2, p.tube.t, p.prof.s1, p.prof.s2, p.prof.Lc, out);
  else if (p.kind === 'stube') segTris(p.ends[0], p.ends[1], p.tube.od, p.tube.t, out);
  return out;
}
const stepPath = (p, nm) => `${p.kind === 'hoop' ? 'step/hoops' : p.kind === 'stube' ? 'step/arms-links' : p.kind === 'turned' ? 'step/turned' : p.kind === 'plate' ? 'step/plates' : 'oshcut/tubes-step'}/${safe(nm)}.step`;
function addStep(zip, p) { for (const f of stepFilesForPart(M, p)) zip.file(stepPath(p, f.name), f.text); }
async function addPart(zip, p, stepOnly) {
  addStep(zip, p); // every part: tubes, hoops, arm legs and links, turned parts and plates
  if (p.kind === 'turned') { if (!stepOnly) zip.file(`drawings/turned/${p.id}_${safe(p.name)}.dxf`, dxfText(partEntities(M, p))); return; }
  if (stepOnly) return;
  const ents = partEntities(M, p);
  if (p.kind === 'plate') zip.file(plateFile(p), dxfText(ents));
  else if (p.kind === 'hoop') zip.file(`drawings/hoops/${p.id}_${safe(p.name)}.dxf`, dxfText(ents));
  else zip.file(`drawings/tube-wraps/${p.id}_${safe(p.name)}.dxf`, dxfText(ents));
}
function scsRows() {
  return M.parts.filter(p => p.kind === 'plate' || p.kind === 'tube' || p.kind === 'stube').map(p => {
    const iss = p.kind === 'plate' ? scsPlateIssues(p) : scsTubeIssues(p);
    const files = p.kind === 'plate' ? [scsPlateFile(p)] : stepFilesForPart(M, p).map(f => `sendcutsend/tubes-step/${safe(f.name)}.step`);
    return { p, iss, files, material: p.kind === 'plate' ? SCS.matName[p.mat] : `${P.mat === '4130' ? '4130 chromoly' : 'Mild steel'} round tube ${p.tube.label}`, qty: p.kind === 'plate' ? p.qty : p.kind === 'stube' ? p.qty : 1 };
  });
}
function scsPlateFile(p) { return `sendcutsend/plates/${p.id}_${safe(p.name)}_${safe(SCS.matName[p.mat])}_qty${p.qty}.dxf`; }
function scsSummaryHTML() {
  const rows = scsRows(), bad = rows.filter(r => r.iss.length);
  const nPlates = rows.filter(r => r.p.kind === 'plate').length, nTubes = rows.filter(r => r.p.kind !== 'plate').length;
  return `<p class="note">${nPlates} plate files and ${nTubes} tube parts checked against SendCutSend's rules (holes at least 50% of thickness, tube at most 60 in). ${bad.length ? 'Issues: ' + bad.map(r => `<b>${r.p.id}</b> ${esc(r.iss.join('; '))}`).join(' · ') : 'No issues found.'}</p>
  <p class="note">SendCutSend has no public pricing API, so the price comes from their quote page after upload; this page can't fetch it.</p>`;
}
function scsOrderSheet() {
  const rows = [['part_id', 'part', 'file', 'material', 'quantity', 'notes']];
  scsRows().forEach(r => r.files.forEach(f => rows.push([r.p.id, r.p.name, f, r.material, r.p.kind === 'plate' || r.p.kind === 'stube' ? r.p.qty : 1, r.iss.join('; ') || (r.p.kind === 'tube' ? 'tube laser, STEP' : r.p.kind === 'stube' ? (r.p.prof ? 'tube laser, coped end, STEP' : 'tube laser, square cut, STEP') : 'laser cut, no services')])));
  return rows.map(r => r.map(x => /[",]/.test(String(x)) ? `"${String(x).replace(/"/g, '""')}"` : x).join(',')).join('\n');
}
async function exportSCS() {
  toast('Building SendCutSend package…');
  const zip = new JSZip();
  for (const r of scsRows()) {
    if (r.p.kind === 'plate') zip.file(scsPlateFile(r.p), dxfText(partEntities(M, r.p), { inches: true, layer: '0' }));
    else stepFilesForPart(M, r.p).forEach(f => zip.file(`sendcutsend/tubes-step/${safe(f.name)}.step`, f.text));
  }
  zip.file('sendcutsend/order-sheet.csv', scsOrderSheet());
  M.parts.filter(p => p.kind === 'hoop').forEach(p => { zip.file(`drawings/hoops/${p.id}_${safe(p.name)}.dxf`, dxfText(partEntities(M, p))); addStep(zip, p); });
  M.parts.filter(p => p.kind === 'turned').forEach(p => { zip.file(`drawings/turned/${p.id}_${safe(p.name)}.dxf`, dxfText(partEntities(M, p))); addStep(zip, p); });
  M.parts.filter(p => p.kind === 'tube' || p.kind === 'stube').forEach(p => zip.file(`drawings/tube-wraps/${p.id}_${safe(p.name)}.dxf`, dxfText(partEntities(M, p))));
  M.parts.filter(p => p.kind === 'plate').forEach(p => addStep(zip, p));
  zip.file('manifest.csv', manifest());
  zip.file('README.txt', `SENDCUTSEND PACKAGE · single-cylinder FSAE chassis · builder v${APP_VERSION} · ${new Date().toISOString().slice(0, 10)}

sendcutsend/plates/      Inch DXF, 1:1, one part per file, single layer, no text. Material and quantity are in the file name.
sendcutsend/tubes-step/  Coped frame tubes, A-arm legs, tie rods, toe links, steering shafts, shock-bolt sleeves and
                         spacers as STEP solids (mm). Mirrored frame tubes come as separate L and R files.
sendcutsend/order-sheet.csv  File, material and quantity for each upload.
step/plates/             Every plate as a STEP solid at its cut thickness, for CAD fit-up (upload the DXFs for cutting).
step/hoops/, drawings/hoops/   Hoop STEP and bend drawings for an outside bender; SendCutSend does not bend tube.
step/turned/, drawings/turned/ A-arm apex bung for a machine shop (or buy weld-in bungs); SendCutSend does not turn parts.
drawings/tube-wraps/     1:1 wrap templates for every tube, if you cope by hand instead.
manifest.csv             Every part with quantity, size, mass and estimated cost.

HOW TO PRICE
1. Go to app.sendcutsend.com and drag in the plates folder. Confirm units are inches.
2. Pick the material and thickness shown in each file name, then set quantity from the order sheet.
3. Upload the tube STEP files to the tube service if it is accepting orders.
SendCutSend has no public pricing API, so prices come from their site after upload.

LICENSE: MIT License, Mac McAlpine, X1Racing.com. See LICENSE.txt. The X1 Racing name and logo are trademarks and are not covered by the license.
`);
  zip.file('LICENSE.txt', LICENSE_TXT);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  await saveFile(`FSAE-Chassis-SendCutSend_${new Date().toISOString().slice(0, 10)}.zip`, blob);
}
function manifest() {
  const rows = [['id', 'kind', 'name', 'qty', 'material_or_tube', 'length_or_envelope_mm', 'coped_ends', 'mass_each_kg', 'est_cost_each_usd', 'mirror_pair', 'file']];
  M.parts.forEach(p => rows.push([p.id, p.kind, p.name, p.qty, p.kind === 'plate' ? PMAT[p.mat].label : p.kind === 'turned' ? `4130/1018 bar, ${p.thread}` : `${P.mat} ${p.tube.label}`, p.kind === 'plate' || p.kind === 'turned' ? p.size : p.cut.toFixed(1), p.copes || 0, p.mass.toFixed(3), partCost(p, RATES, P.mat).toFixed(2), p.mirror ? 'yes' : 'no', p.kind === 'plate' ? plateFile(p) : '']));
  BUYC.forEach(b => rows.push(['BUY', 'purchased', b.name, b.qty, '', '', '', '', b.each, '', '']));
  return rows.map(r => r.map(x => /[",]/.test(String(x)) ? `"${String(x).replace(/"/g, '""')}"` : x).join(',')).join('\n');
}
function readme() {
  const c = costs();
  return `SINGLE-CYLINDER FSAE CHASSIS PACKAGE
Builder v${APP_VERSION} · source ${'https://github.com/X1Racing/FSAE'}
Generated ${new Date().toISOString().slice(0, 10)} · units mm · origin front axle at ground, X forward, Y left, Z up

FOLDERS
oshcut/plates/        Single-layer DXF per laser-cut plate. File name carries material and quantity.
                      Upload directly to OSHcut, pick that material, set quantity, read the live price.
oshcut/tubes-step/    Coped frame tubes as exact STEP solids (AP214, mm), one file per hand for mirrored
                      parts. Upload straight to OSHcut's tube laser for live pricing.
step/hoops/           Front and main hoop as bent-tube STEP solids (89 mm CLR) for the bender or CAD.
step/arms-links/      A-arm legs, tie rods, toe links, steering shafts, shock-bolt sleeves and spacers as STEP (cut length).
step/plates/          Every laser-cut plate as a STEP solid at its cut thickness, in its own sketch frame.
step/turned/          A-arm apex bung (bore at tap drill; thread on the drawing).
step/frame-assembly.step  Every frame tube and hoop in place, for CAD layout, FEA and SES.
drawings/tube-wraps/  1:1 wrap templates for every frame tube and arm/link tube. Print at 100%, wrap, align the 0 deg seam.
drawings/turned/      Apex bung drawing with thread call-out.
drawings/hoops/       Bend drawings for the front and main hoop: developed length, bend table, 89 mm CLR.
stl/frame.stl         Whole frame mesh for quick viewing.
manifest.csv          Every part with quantity, size, mass and estimated cost.
design.json           Parameters and solved geometry. Load it back into the builder.

SUMMARY
Frame mass ${M.mass.frame.toFixed(1)} kg · modeled car ${M.mass.total.toFixed(0)} kg (no bodywork, brakes, fluids)
Fabrication estimate $${c.fab.toFixed(0)} · buy parts $${c.buy.toFixed(0)} · total $${c.total.toFixed(0)} (planning numbers, not quotes)

LICENSE
MIT License, Mac McAlpine, X1Racing.com. See LICENSE.txt. The X1 Racing name and logo are trademarks and are not covered by the license.

RULE NOTES
Checked against the 2026 Formula SAE rules structure. Verify against the current rulebook and submit an SES.
Harness eyes must be supplier weld-on eyes over a welded tube insert (2026 change); no laser-cut harness tabs are included.
Impact attenuator, anti-intrusion plate, head restraint, bodywork and brake lines are outside this package.
`;
}
// Save a file: claude.ai artifact downloads capability, or a plain browser download when hosted elsewhere (GitHub Pages)
const inArtifact = () => !!(window.claude && window.claude.use);
async function saveFile(filename, blob) {
  if (inArtifact()) {
    const dl = await window.claude.use('downloads');
    if (!dl) { toast('Saving is not available in this view.'); return; }
    try { await dl.save({ filename, data: blob }); toast('Saved ' + filename); }
    catch (e) { toast(e && e.code === 'declined' ? 'Export cancelled' : 'Export unavailable here: ' + (e && e.message || e)); }
    return;
  }
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast('Saved ' + filename);
}
const designJSON = () => JSON.stringify({ version: APP_VERSION, params: P, rates: RATES, buy: BUYC, nodes: M.N, members: M.members.map(m => ({ a: m.a, b: m.b, cat: m.cat, name: m.name, part: m.part })), hoops: M.hoops.map(h => ({ id: h.id, pts: h.pts })) }, null, 1);
$('#bSave').onclick = () => saveFile(`FSAE-Chassis-design_${new Date().toISOString().slice(0, 10)}.json`, new Blob([designJSON()], { type: 'application/json' }));

/* ---------- OSH Cut live quote (viewer's own OSH Cut connector) ---------- */
const OSH_SERVER = 'oshcut', OSH_KEY = 'fsae-oshcut-cart';
const oshEl = () => $('#oshBody');
const oshLS = { get() { try { return localStorage.getItem(OSH_KEY) || ''; } catch (e) { return ''; } }, set(v) { try { v ? localStorage.setItem(OSH_KEY, v) : localStorage.removeItem(OSH_KEY); } catch (e) {} } };
async function oshMcp() { try { return window.claude && window.claude.use ? await window.claude.use('mcp') : null; } catch (e) { return null; } }
const b64 = s => { const u = new TextEncoder().encode(s); let out = ''; for (let i = 0; i < u.length; i += 0x8000) out += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(out); };
// every laser part: STEP file, cart name, quantity, OSH Cut material; turned parts and unstocked sizes are listed, not uploaded
function oshItems() {
  const items = [], skipped = [], subs = new Set();
  for (const p of M.parts) {
    if (p.kind === 'turned') { skipped.push(`${p.id} ${p.name} (lathe part)`); continue; }
    let mat;
    if (p.kind === 'plate') { const id = OSH.sheets[p.mat]; if (!id) { skipped.push(`${p.id} ${p.name} (${p.mat} not stocked)`); continue; } mat = { material_sheet_id: id, part_type: 'sheetMetal' }; }
    else { const t = oshTube(p.tube); if (!t) { skipped.push(`${p.id} ${p.name} (${p.tube ? p.tube.label : 'tube'} not stocked at OSH Cut)`); continue; } if (t.sub) subs.add(`${p.tube.label} → ${t.sub}`); mat = { material_tube_id: t.id, part_type: 'tube' }; }
    const files = stepFilesForPart(M, p), q = p.kind === 'tube' ? 1 : p.qty;
    for (const f of files) { const fn = f.name.replace(/[^A-Za-z0-9-]+/g, '_') + '.step', text = f.text;
      items.push({ file: fn, name: ('FSAE ' + f.name).slice(0, 80), qty: q, b64: b64(text), ...mat }); }
  }
  return { items, skipped, subs: [...subs] };
}
// pull a value out of an unknown-shaped payload
function oshFind(o, test, depth = 0) { if (o == null || depth > 6) return null; if (typeof o !== 'object') return null;
  for (const [k, v] of Object.entries(o)) { const r = test(k, v); if (r != null) return r; } for (const v of Object.values(o)) { const r = oshFind(v, test, depth + 1); if (r != null) return r; } return null; }
const oshGuid = pl => oshFind(pl, (k, v) => (/order_?guid/i.test(k) && typeof v === 'string') ? v : (typeof v === 'string' && /^O-[0-9a-f-]{8,}/i.test(v) ? v : null));
const oshUrl = (pl, g) => oshFind(pl, (k, v) => (/cart_?url/i.test(k) && typeof v === 'string' && /^https:\/\//.test(v)) ? v : null) || (g ? `https://app.oshcut.com/cart/${encodeURIComponent(g)}` : null);
function oshErrText(e) {
  const c = e && e.code;
  if (c === 'server_not_connected' || c === 'server_not_found') return 'Add the OSH Cut connector (server URL https://app.oshcut.com/api/mcp) in claude.ai Settings → Connectors, then try again.';
  if (c === 'needs_reauth') return 'Your OSH Cut connection has lapsed. Reconnect OSH Cut in claude.ai Settings → Connectors.';
  if (c === 'selection_required') return 'You have more than one OSH Cut connector. Choose one when claude.ai asks, then try again.';
  if (c === 'not_in_manifest' || c === 'approval_required' || c === 'consent_required') return 'This page needs your OK to use your OSH Cut connector. Press the button again and allow it when claude.ai asks.';
  if (c === 'blocked_by_policy') return 'Your organization blocks the OSH Cut connector for this page.';
  if (c === 'server_unavailable' || c === 'upstream_error') return 'OSH Cut did not answer. Some files may already be in your cart: open the cart link below to check, then try again.';
  if (c === 'tool_error') return 'OSH Cut refused the request: ' + (e.message || '').slice(0, 300);
  return 'The quote could not run here (' + (c || 'unknown') + ').';
}
function oshQuoteHTML(pl) { // render whatever per-lead-time totals OSH Cut returns
  const rows = []; const money = v => typeof v === 'number' ? '$' + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : esc(String(v));
  const walk = (o, label) => { if (o == null) return; if (Array.isArray(o)) { o.forEach((x, i) => walk(x, label)); return; }
    if (typeof o === 'object') { const lt = o.lead_time || o.leadTime || o.name || o.label || o.lead_time_name || o.days, tot = o.total ?? o.price ?? o.total_dollars ?? o.subtotal ?? o.amount, ship = o.ship_date || o.shipDate || o.ships;
      if (tot != null && lt != null) { rows.push([String(lt), money(tot), ship ? esc(String(ship)) : '']); return; }
      for (const [k, v] of Object.entries(o)) { if (typeof v === 'number' && /total|price|\$|usd|dollar/i.test(k + label)) rows.push([k, money(v), '']); else if (typeof v === 'object') walk(v, k); else if (typeof v === 'number' && label && /lead|time/i.test(label)) rows.push([k, money(v), '']); } } };
  walk(pl, '');
  if (!rows.length) return `<pre class="osh-raw">${esc(JSON.stringify(pl, null, 1).slice(0, 2000))}</pre>`;
  return `<table class="osh-q"><thead><tr><th>Lead time</th><th>Total</th><th>Ships</th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r[0])}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table>`;
}
async function oshQuote() {
  const body = oshEl(), go = $('#oshGo'); $('#oshModal').hidden = false;
  const mcp = await oshMcp();
  if (!mcp) { body.innerHTML = `<p>A live OSHcut quote needs the claude.ai OSH Cut connector (<code>window.claude.use</code>). An ordinary browser, including the hosted page at x1racing.com/fsae, does not have that connector. Nothing was uploaded and no price was invented. Use <b>Export STEP package</b>, then upload the files yourself at <a href="https://app.oshcut.com" target="_blank" rel="noopener">app.oshcut.com</a>.</p>`; return; }
  go.disabled = true;
  try {
    const { items, skipped, subs } = oshItems();
    const say = h => { body.innerHTML = h; };
    let guid = oshLS.get(), url = null, failed = [], warned = [], up = 0;
    say(`<p>Preparing ${items.length} STEP files…</p>`);
    if (guid) { // one cart per person: clear the builder's previous upload of this design, keep anything else in the cart
      try { const c = await mcp.callTool(OSH_SERVER, 'get_cart', { order_guid: guid }, { cache: false });
        const old = []; oshFind(c.payload, (k, v) => { if (Array.isArray(v)) v.forEach(x => { if (x && typeof x === 'object' && x.guid && /^FSAE /.test(x.name || '')) old.push(x.guid); }); return null; });
        if (old.length) { say(`<p>Clearing ${old.length} parts from the last quote…</p>`); await mcp.callTool(OSH_SERVER, 'remove_cart_parts', { guids: old }, { cache: false }); }
      } catch (e) { if (e && e.code === 'tool_error') { guid = ''; oshLS.set(''); } else throw e; }
    }
    // batches under ~700 KB of base64 so each call stays inside the 1 MiB input limit
    const batches = []; let cur = [], size = 0;
    for (const it of items) { if (cur.length && (size + it.b64.length > 700000 || cur.length >= 60)) { batches.push(cur); cur = []; size = 0; } cur.push(it); size += it.b64.length; }
    if (cur.length) batches.push(cur);
    for (const b of batches) {
      say(`<p>Uploading to OSH Cut: ${up} of ${items.length} files…</p><div class="osh-bar"><i style="width:${(100 * up / items.length).toFixed(0)}%"></i></div>`);
      const input = { files: b.map(it => ({ filename: it.file, content_base64: it.b64 })),
        parts: JSON.stringify(b.map(it => { const o = { file: it.file, qty: it.qty, name: it.name, part_type: it.part_type }; if (it.material_sheet_id) o.material_sheet_id = it.material_sheet_id; else o.material_tube_id = it.material_tube_id; return o; })) };
      if (guid) input.order_guid = guid;
      const r = await mcp.callTool(OSH_SERVER, 'add_parts_to_cart', input, { cache: false });
      const pl = r.payload; guid = guid || oshGuid(pl); url = oshUrl(pl, guid) || url; if (guid) oshLS.set(guid);
      const parts = oshFind(pl, (k, v) => k === 'parts' && Array.isArray(v) ? v : null) || [];
      const txt = x => typeof x === 'string' ? x : (x && (x.title || x.message || x.text || x.name)) || JSON.stringify(x).slice(0, 160);
      parts.forEach(p => { if (!p) return; const who = p.name || p.file || '?', err = p.error || (p.success === false ? 'not processed' : null);
        if (err) failed.push(`${who}: ${txt(err)}`);
        (p.dfm_errors || []).forEach(x => failed.push(`${who}: ${txt(x)}`));
        [...(p.dfm_warnings || []), ...(p.warnings || [])].forEach(x => warned.push(`${who}: ${txt(x)}`)); });
      up += b.length;
      if (!guid) throw { code: 'tool_error', message: 'OSH Cut did not return a cart id.' };
    }
    say(`<p>Pricing the cart…</p>`);
    const q = await mcp.callTool(OSH_SERVER, 'quote_cart', { order_guid: guid, summary: true }, { cache: false });
    url = url || oshUrl(null, guid);
    say(`<p class="osh-ok">${items.length} parts are in your OSH Cut cart, priced as one order.</p>${oshQuoteHTML(q.payload)}
      <p><a class="btn primary" href="${esc(url)}" target="_blank" rel="noopener">Review and order on OSH Cut ↗</a></p>
      <p class="note">Shipping, tax and coupons are added at checkout on OSH Cut. Check each part's material, then order there.</p>
      ${subs.length ? `<p class="note"><b>Material swaps:</b> ${subs.map(esc).join('; ')}.</p>` : ''}
      ${skipped.length ? `<details><summary>${skipped.length} parts not sent (make these elsewhere)</summary><ul>${skipped.map(s => `<li>${esc(s)}</li>`).join('')}</ul></details>` : ''}
      ${failed.length ? `<details open><summary>${failed.length} OSH Cut errors to fix before ordering</summary><ul>${failed.map(s => `<li>${esc(s)}</li>`).join('')}</ul></details>` : ''}
      ${warned.length ? `<details><summary>${warned.length} OSH Cut warnings to review</summary><ul>${warned.map(s => `<li>${esc(s)}</li>`).join('')}</ul></details>` : `<p class="note">OSH Cut's manufacturability check raised no warnings on the upload.</p>`}`);
  } catch (e) {
    const g = oshLS.get();
    body.innerHTML = `<p class="osh-err">${esc(oshErrText(e))}</p>${g ? `<p><a href="${esc(oshUrl(null, g))}" target="_blank" rel="noopener">Open your OSH Cut cart ↗</a></p>` : ''}`;
  } finally { go.disabled = false; }
}
$('#bOsh').onclick = () => { $('#oshModal').hidden = false; };
document.querySelectorAll('.w-copy').forEach(b => b.onclick = async () => { const t = b.dataset.copy; try { await navigator.clipboard.writeText(t); b.textContent = 'Copied'; } catch (e) { const s = window.getSelection(), r = document.createRange(); r.selectNodeContents(b.previousElementSibling); s.removeAllRanges(); s.addRange(r); b.textContent = 'Selected'; } setTimeout(() => { b.textContent = 'Copy'; }, 1600); });
$('#oshGo').onclick = () => oshQuote();
$('#oshClose').onclick = () => { $('#oshModal').hidden = true; };

async function exportZip(only, stepOnly) {
  toast('Building package…');
  const zip = new JSZip();
  if (only) await addPart(zip, M.parts.find(p => p.id === only));
  else if (stepOnly) { for (const p of M.parts) await addPart(zip, p, true); zip.file('step/frame-assembly.step', stepFrameAssembly(M)); }
  else {
    for (const p of M.parts) await addPart(zip, p);
    zip.file('step/frame-assembly.step', stepFrameAssembly(M));
    const all = []; M.members.forEach(m => memberTris(M, m, all)); M.hoops.forEach(h => { const p = M.parts.find(q => q.id === h.part); for (let i = 0; i < p.pts.length - 1; i++) segTris(p.pts[i], p.pts[i + 1], p.tube.od, p.tube.t, all); });
    zip.file('stl/frame.stl', stlBinary(all)); zip.file('manifest.csv', manifest()); zip.file('README.txt', readme());
    zip.file('design.json', designJSON());
  }
  zip.file('LICENSE.txt', LICENSE_TXT);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  await saveFile(only ? `${only}_${safe(M.parts.find(p => p.id === only).name)}.zip` : `FSAE-Chassis-${stepOnly ? 'STEP' : 'STEP-package'}_${new Date().toISOString().slice(0, 10)}.zip`, blob);
}
$('#bExport').onclick = () => exportZip();
$('#mExport').onclick = () => dxfView && exportZip(dxfView.p.id);
$('#bReset').onclick = () => { P = { ...DEFAULTS }; paramUI(); rebuild(); toast('Reset to defaults'); };
$('#bLoad').onclick = () => $('#fLoad').click();
$('#fLoad').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try { const j = JSON.parse(await f.text()); P = { ...DEFAULTS, ...(j.params || j) }; if (j.rates) RATES = j.rates; if (j.buy) BUYC = j.buy; paramUI(); rebuild(); toast('Design loaded'); }
  catch (err) { toast('That file is not a builder design.json'); }
  e.target.value = '';
};
$('#bOpt').onclick = () => {
  const base = { ...P }, score = Q => { const m = build(Q, true); if (m.checks.some(c => c.status === 'fail')) return null; const cost = m.parts.reduce((s, p) => s + partCost(p, RATES, Q.mat) * p.qty, 0); return { m, s: m.mass.frame * 40 + cost, cost }; };
  const b0 = score(base); let best = { Q: base, r: b0 };
  for (const wb of [1530, 1550, 1575, 1600]) for (const cd of [280, 300, 330]) for (const hf of [230, 240, 250]) for (const hr of [215, 225, 240]) {
    const Q = { ...base, wheelbase: wb, chainCD: cd, hwF: hf, hwR: hr }, r = score(Q);
    if (r && (!best.r || r.s < best.r.s)) best = { Q, r };
  }
  if (!best.r) { toast('No variant passes every hard rule check. Adjust the driver inputs first.'); return; }
  const before = b0 ? `${b0.m.mass.frame.toFixed(1)} kg / $${b0.cost.toFixed(0)}` : 'failing design';
  P = best.Q; paramUI(); rebuild();
  toast(`Optimized frame: ${before} → ${best.r.m.mass.frame.toFixed(1)} kg / $${best.r.cost.toFixed(0)} fab`);
};
paramUI(); rebuild();

/* ---------- welcome routing, orbit, prompt copy ---------- */
function licenseHref() {
  if (location.protocol === 'file:') return 'LICENSE';
  const path = location.pathname;
  const dir = /\/[^/]+\.html?$/i.test(path) ? path.replace(/[^/]+$/, '') : (path.endsWith('/') ? path : path + '/');
  return dir + 'LICENSE';
}
(function pointLicenseLinks() {
  const href = licenseHref();
  document.querySelectorAll('a[href="LICENSE"], link[rel="license"][href="LICENSE"]').forEach(el => el.setAttribute('href', href));
})();
function route() {
  const h = location.hash, b = h === '#builder';
  $('#welcome').hidden = b; $('#builder').hidden = !b;
  if (b) { requestAnimationFrame(() => { resize(); if (!$('#modal').hidden) drawDxf(); }); }
  const t = !b && h && h !== '#welcome' && document.getElementById(h.slice(1));
  if (t) requestAnimationFrame(() => t.scrollIntoView()); else window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route); route();
controls.autoRotateSpeed = 1.6;
const syncClear = () => { const b = $('#bClear'); if (!b) return; b.setAttribute('aria-pressed', layerOn.clear ? 'true' : 'false'); b.classList.toggle('on', !!layerOn.clear); b.textContent = layerOn.clear ? 'Hide shock clearance' : 'Show shock clearance'; groups.clear.visible = !!layerOn.clear; };
$('#bClear').onclick = () => { layerOn.clear = layerOn.clear ? 0 : 1; syncClear(); };
syncClear();
const syncJigs = () => { const b = $('#bJigs'); if (!b) return; b.setAttribute('aria-pressed', layerOn.jigs ? 'true' : 'false'); b.classList.toggle('on', !!layerOn.jigs); b.textContent = layerOn.jigs ? 'Hide build jigs' : 'Show build jigs'; groups.jigs.visible = !!layerOn.jigs; };
$('#bJigs').onclick = () => { layerOn.jigs = layerOn.jigs ? 0 : 1; syncJigs(); };
syncJigs();
$('#bCycle').onclick = () => {
  animSusp = !animSusp; const b = $('#bCycle');
  b.setAttribute('aria-pressed', animSusp); b.classList.toggle('on', animSusp);
  b.innerHTML = animSusp ? 'Stop · <span id="travelOut"></span>' : 'Cycle suspension';
  if (!animSusp) applyTravel(0);
};
$('#bEgress').onclick = () => {
  egress.on = !egress.on; egress.t0 = performance.now();
  if (!egress.on && rig) rig.draw(0);
  if (egress.on && rig) frameEgress();
  if (egress.on && !layerOn.driver) { layerOn.driver = 1; groups.driver.visible = true; const c = $('#ly_driver'); if (c) { c.checked = true; c.parentElement.classList.add('on'); } }
  egressUI();
};
$('#bOrbit').onclick = () => {
  controls.autoRotate = !controls.autoRotate;
  $('#bOrbit').setAttribute('aria-pressed', controls.autoRotate); $('#bOrbit').classList.toggle('on', controls.autoRotate);
  $('#bOrbit').textContent = controls.autoRotate ? 'Stop orbit' : 'Orbit';
};
$('#copyPrompt').onclick = async () => {
  const t = $('#promptText').textContent;
  try { await navigator.clipboard.writeText(t); toast('Prompt copied'); }
  catch (e) { const r = document.createRange(); r.selectNodeContents($('#promptText')); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); toast('Prompt selected. Press Ctrl+C or Cmd+C to copy'); }
};
