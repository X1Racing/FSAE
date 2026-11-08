/* ===== Core geometry engine (no DOM) ===== */
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const v = (x = 0, y = 0, z = 0) => ({ x, y, z });
const vadd = (a, b) => v(a.x + b.x, a.y + b.y, a.z + b.z);
const vsub = (a, b) => v(a.x - b.x, a.y - b.y, a.z - b.z);
const vmul = (a, k) => v(a.x * k, a.y * k, a.z * k);
const vdot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const vcross = (a, b) => v(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
const vlen = a => Math.hypot(a.x, a.y, a.z);
const vnorm = a => { const l = vlen(a) || 1; return vmul(a, 1 / l); };
const vmir = a => v(a.x, -a.y, a.z);
const vlerp = (a, b, t) => v(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
function rot(p, ax, ang) {
  const c = Math.cos(ang), s = Math.sin(ang), d = vdot(ax, p), cr = vcross(ax, p);
  return v(p.x * c + cr.x * s + ax.x * d * (1 - c), p.y * c + cr.y * s + ax.y * d * (1 - c), p.z * c + cr.z * s + ax.z * d * (1 - c));
}
const rotAbout = (p, o, ax, ang) => vadd(o, rot(vsub(p, o), ax, ang));
function newton(f, x0) {
  let x = x0;
  for (let i = 0; i < 40; i++) {
    const fx = f(x); if (Math.abs(fx) < 1e-8) break;
    const d = (f(x + 1e-6) - fx) / 1e-6; if (!isFinite(d) || Math.abs(d) < 1e-12) break;
    let st = fx / d; if (Math.abs(st) > 0.25) st = Math.sign(st) * 0.25; x -= st;
  }
  return x;
}
function lineInt(a, b, c, d) {
  const den = (a.y - b.y) * (c.z - d.z) - (a.z - b.z) * (c.y - d.y);
  if (Math.abs(den) < 1e-9) return { y: a.y, z: c.z };
  const t = ((a.y - c.y) * (c.z - d.z) - (a.z - c.z) * (c.y - d.y)) / den;
  return { y: a.y + t * (b.y - a.y), z: a.z + t * (b.z - a.z) };
}

/* ---------- Catalogs ---------- */
const WHEELS = {
  '13': { label: '13 in rim · 20.5×7.0-13 tire', od: 520.7, w: 178, rim: 330, mass: 10.5 },
  '10': { label: '10 in rim · 18.0×6.0-10 tire', od: 457.2, w: 152, rim: 254, mass: 8.0 }
};
const GAINS = {
  low: { deg: 0.4, label: 'Low · 0.4° per 25 mm bump' },
  med: { deg: 0.7, label: 'Medium · 0.7° per 25 mm' },
  high: { deg: 1.0, label: 'High · 1.0° per 25 mm' },
  xhigh: { deg: 1.3, label: 'Aggressive · 1.3° per 25 mm' }
};
// FSAE F.3.2.1 minimum steel tube sizes (round): A 25.4×2.4, B 25.4×1.6, C 25.4×1.2
const RULE_MIN = { A: { od: 25.0, t: 2.4 }, B: { od: 25.0, t: 1.6 }, C: { od: 25.0, t: 1.2 } };
const TUBE_STD = {
  imperial: {
    A: { od: 25.4, t: 2.413, label: '1.000 × 0.095 in' }, B: { od: 25.4, t: 1.651, label: '1.000 × 0.065 in' },
    C: { od: 25.4, t: 1.245, label: '1.000 × 0.049 in' }, arm: { od: 15.875, t: 1.245, label: '0.625 × 0.049 in' },
    steer: { od: 19.05, t: 1.651, label: '0.750 × 0.065 in' }
  },
  metric: {
    A: { od: 25.4, t: 2.4, label: '25.4 × 2.4 mm' }, B: { od: 25.4, t: 1.6, label: '25.4 × 1.6 mm' },
    C: { od: 25.4, t: 1.2, label: '25.4 × 1.2 mm' }, arm: { od: 16, t: 1.2, label: '16 × 1.2 mm' },
    steer: { od: 20, t: 1.5, label: '20 × 1.5 mm' }
  }
};
const CAT_NAME = { A: 'Size A · hoops & harness bar', B: 'Size B · bulkhead, side impact, bracing', C: 'Size C · supports & other frame', arm: 'Suspension arms', steer: 'Steering & links' };
const PMAT = {
  ST3: { label: '4130 steel · 0.125 in', t: 3.175, rho: 7.85e-6, kind: 'steel' },
  ST5: { label: '4130 steel · 0.188 in', t: 4.763, rho: 7.85e-6, kind: 'steel' },
  AL1: { label: '5052-H32 aluminum · 0.063 in', t: 1.6, rho: 2.68e-6, kind: 'al' },
  AL3: { label: '5052-H32 aluminum · 0.125 in', t: 3.175, rho: 2.68e-6, kind: 'al' },
  AL6: { label: '6061-T6 aluminum · 0.250 in', t: 6.35, rho: 2.70e-6, kind: 'al' },
  AL10: { label: '6061-T6 aluminum · 0.375 in', t: 9.525, rho: 2.70e-6, kind: 'al' },
  ST6: { label: '4130 steel · 0.250 in', t: 6.35, rho: 7.85e-6, kind: 'steel' }
};
const DEFAULT_RATES = {
  turned: 9,
  tube4130: { A: 30, B: 22, C: 19, arm: 15, steer: 16 }, // $/m stock (estimate)
  mildMult: 0.55, laserPart: 6, copeEnd: 2.5, bend: 15,
  plateSteel: 9, plateAl: 14, cutPerM: 1.6, platePart: 2, hole: 0.25
};
const ENGINE = { name: 'Single-cylinder 500 cc (hypothetical)', L: 420, H: 520, W: 330, csBack: 70, csUp: 170, mass: 31 };

/* ---------- Suspension geometry ---------- */
function axleGeom(o) {
  const yW = o.track / 2, WC = v(o.x, yW, o.Rt), yk = yW - o.kpOff;
  const tk = Math.tan(o.kpi * D2R), tc = Math.tan(o.caster * D2R);
  const kp = h => v(o.x - h * tc, yk - h * tk, o.Rt + h);
  let LBJ = kp(-o.bjLo), UBJ = kp(o.bjUp); const K = kp(o.tieZ);
  let OTR = v(K.x - o.armLen * Math.cos(o.alpha), K.y - o.armLen * Math.sin(o.alpha), K.z);
  const phi = -o.camber * D2R, X = v(1, 0, 0), R = p => rotAbout(p, WC, X, phi);
  LBJ = R(LBJ); UBJ = R(UBJ); OTR = R(OTR); const KPm = R(K);
  const spin = rot(v(0, 1, 0), X, phi);
  const CP = v(o.x, yW + o.Rt * Math.sin(phi), 0);
  const fvsa = 1 / ((o.gainDeg * D2R) / 25);
  const IC = { y: CP.y - fvsa, z: o.rc * fvsa / CP.y };
  const zAt = (P, y) => P.z + (y - P.y) * (IC.z - P.z) / (IC.y - P.y);
  const zL = zAt(LBJ, o.hwL), zU = zAt(UBJ, o.hwU);
  const LIPf = v(o.x + o.spread, o.hwL, zL), LIPr = v(o.x - o.spread, o.hwL, zL);
  const UIPf = v(o.x + o.spread, o.hwU, zU), UIPr = v(o.x - o.spread, o.hwU, zU);
  const I = lineInt({ y: o.hwU, z: zU }, { y: o.hwL, z: zL }, { y: OTR.y, z: OTR.z }, IC);
  // zero-bump-steer construction; with a fixed rack width the inner pivot stays on the OTR-IC line (first-order zero)
  const ITR = o.itrY ? v(OTR.x, o.itrY, OTR.z + (o.itrY - OTR.y) * (IC.z - OTR.z) / (IC.y - OTR.y)) : v(OTR.x, I.y, I.z);
  return { WC, CP, LBJ, UBJ, OTR, ITR, KP: KPm, spin, IC, fvsa, zL, zU, LIPf, LIPr, UIPf, UIPr, yk, o };
}
function makeKin(g) {
  const axL = vnorm(vsub(g.LIPf, g.LIPr)), axU = vnorm(vsub(g.UIPf, g.UIPr));
  const dKP = vlen(vsub(g.UBJ, g.LBJ)), Ltr = vlen(vsub(g.OTR, g.ITR)), k0 = vnorm(vsub(g.UBJ, g.LBJ));
  let thU = 0, ph = 0;
  function state(thL, dy = 0) {
    const LBJ = rotAbout(g.LBJ, g.LIPr, axL, thL);
    thU = newton(t => vlen(vsub(rotAbout(g.UBJ, g.UIPr, axU, t), LBJ)) - dKP, thU);
    const UBJ = rotAbout(g.UBJ, g.UIPr, axU, thU);
    const k1 = vnorm(vsub(UBJ, LBJ)); let ra = vcross(k0, k1);
    const s = vlen(ra), c = vdot(k0, k1), a1 = Math.atan2(s, c);
    ra = s > 1e-12 ? vmul(ra, 1 / s) : v(1, 0, 0);
    const Tv = (d, p) => rot(rot(d, ra, a1), k1, p);
    const T = (P, p) => vadd(LBJ, Tv(vsub(P, g.LBJ), p));
    const ITR = vadd(g.ITR, v(0, dy, 0));
    ph = newton(p => vlen(vsub(T(g.OTR, p), ITR)) - Ltr, ph);
    const WC = T(g.WC, ph), sp = Tv(g.spin, ph);
    return { LBJ, UBJ, OTR: T(g.OTR, ph), KP: T(g.KP, ph), ITR, WC, spin: sp, camber: -Math.asin(sp.z) * R2D, toe: Math.atan2(sp.x, sp.y) * R2D };
  }
  return { state, reset() { thU = 0; ph = 0; } };
}
function travelSweep(g) {
  const K = makeKin(g), lA = Math.hypot(g.LBJ.y - g.LIPr.y, g.LBJ.z - g.LIPr.z);
  const thM = 38 / lA, n = 16, out = [];
  const s0 = K.state(0);
  for (let i = 0; i <= n; i++) { const s = K.state(thM * i / n); out.push(s); }
  K.reset();
  for (let i = 1; i <= n; i++) { const s = K.state(-thM * i / n); out.push(s); }
  const pts = out.map(s => ({ dz: s.WC.z - s0.WC.z, camber: s.camber, toe: s.toe - s0.toe, ok: isFinite(s.camber) && isFinite(s.toe) })).sort((a, b) => a.dz - b.dz);
  const near = pts.filter(p => Math.abs(p.dz) < 6);
  let slope = 0;
  if (near.length >= 2) { const a = near[0], b = near[near.length - 1]; slope = (b.camber - a.camber) / (b.dz - a.dz); }
  const inR = pts.filter(p => Math.abs(p.dz) <= 25.5);
  const bump = inR.length ? Math.max(...inR.map(p => Math.abs(p.toe))) : 0;
  const ok = pts.every(p => p.ok) && pts[0].dz < -25 && pts[pts.length - 1].dz > 25;
  return { pts, gainPer25: -slope * 25, bumpSteer: bump, ok };
}
function steerSweep(g, WB) {
  const K = makeKin(g); const t0 = K.state(0, 0).toe;
  const neg = [], pos = [];
  for (let d = 0; d <= 70; d += 2) neg.push(K.state(0, -d).toe);
  K.reset(); K.state(0, 0);
  for (let d = 0; d <= 70; d += 2) pos.push(K.state(0, d).toe);
  const pts = neg.map((t, i) => ({ d: i * 2, di: t0 - t, dout: pos[i] - t0 })).filter(p => isFinite(p.di) && isFinite(p.dout));
  const tk = 2 * (g.yk + g.o.Rt * Math.tan(g.o.kpi * D2R));
  return { pts, tk, WB };
}
const idealOuter = (di, tk, WB) => di <= 0 ? 0 : Math.atan(1 / (1 / Math.tan(di * D2R) + tk / WB)) * R2D;
function interpAt(pts, key, val, out) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if ((a[key] - val) * (b[key] - val) <= 0 && a[key] !== b[key]) { const t = (val - a[key]) / (b[key] - a[key]); return a[out] + t * (b[out] - a[out]); }
  }
  return NaN;
}
function ackErr(sw, target) {
  let e = 0, n = 0;
  for (const di of [5, 10, 15, 20, 25]) {
    const dout = interpAt(sw.pts, 'di', di, 'dout'); if (!isFinite(dout)) { e += 100; continue; }
    const ideal = idealOuter(di, sw.tk, sw.WB), tgt = di - target * (di - ideal);
    e += (dout - tgt) ** 2; n++;
  }
  return e;
}
function ackPct(sw, di) {
  const dout = interpAt(sw.pts, 'di', di, 'dout'), ideal = idealOuter(di, sw.tk, sw.WB);
  return (di - dout) / (di - ideal) * 100;
}
function optimizeAlpha(o, WB, target) {
  let a = -5 * D2R, b = 42 * D2R; const gr = (Math.sqrt(5) - 1) / 2;
  const f = al => ackErr(steerSweep(axleGeom({ ...o, alpha: al }), WB), target);
  let c = b - gr * (b - a), d = a + gr * (b - a), fc = f(c), fd = f(d);
  for (let i = 0; i < 22; i++) {
    if (fc < fd) { b = d; d = c; fd = fc; c = b - gr * (b - a); fc = f(c); }
    else { a = c; c = d; fc = fd; d = a + gr * (b - a); fd = f(d); }
  }
  return (a + b) / 2;
}
function ik2(h, a, l1, l2) {
  const dx = a.x - h.x, dz = a.z - h.z; let d = Math.hypot(dx, dz); d = Math.min(d, l1 + l2 - 1);
  const A = Math.acos(Math.min(1, Math.max(-1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const p = Math.atan2(dz, dx) + A; return v(h.x + l1 * Math.cos(p), 0, h.z + l1 * Math.sin(p));
}

/* ---------- Plate shapes (2D, for DXF) ---------- */
class Shape {
  constructor() { this.ents = []; this.pts = []; this.holes = []; this.cur = null; this.marks = []; }
  start(x, y) { this.cur = [x, y]; this.pts.push([x, y]); return this; }
  line(x, y) { this.ents.push({ t: 'L', x1: this.cur[0], y1: this.cur[1], x2: x, y2: y }); this.pts.push([x, y]); this.cur = [x, y]; return this; }
  arc(cx, cy, r, a0, a1) {
    const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 0.1));
    for (let i = 1; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; this.pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    this.ents.push({ t: 'A', cx, cy, r, a0: Math.min(a0, a1) * R2D, a1: Math.max(a0, a1) * R2D });
    this.cur = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)]; return this;
  }
  close() { const p = this.pts[0]; if (Math.hypot(p[0] - this.cur[0], p[1] - this.cur[1]) > 1e-6) this.line(p[0], p[1]); return this; }
  hole(x, y, d) { this.holes.push({ x, y, r: d / 2 }); this.ents.push({ t: 'C', cx: x, cy: y, r: d / 2 }); return this; }
  rectHole(x, y, w, h) { // rectangular slot for tab-and-slot self-jigging
    const x0 = x - w / 2, x1 = x + w / 2, y0 = y - h / 2, y1 = y + h / 2;
    this.ents.push({ t: 'L', x1: x0, y1: y0, x2: x1, y2: y0 }, { t: 'L', x1: x1, y1: y0, x2: x1, y2: y1 }, { t: 'L', x1: x1, y1: y1, x2: x0, y2: y1 }, { t: 'L', x1: x0, y1: y1, x2: x0, y2: y0 });
    this.holes.push({ x, y, r: 0, rect: [w, h] }); return this;
  }
  slot(x, y, len, w) {
    const r = w / 2, h = len / 2 - r;
    this.ents.push({ t: 'L', x1: x - h, y1: y - r, x2: x + h, y2: y - r }, { t: 'L', x1: x - h, y1: y + r, x2: x + h, y2: y + r },
      { t: 'A', cx: x + h, cy: y, r, a0: -90, a1: 90 }, { t: 'A', cx: x - h, cy: y, r, a0: 90, a1: 270 });
    this.holes.push({ x, y, r, slot: len }); return this;
  }
  area() {
    let a = 0; const p = this.pts;
    for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; }
    a = Math.abs(a) / 2;
    for (const h of this.holes) a -= h.rect ? h.rect[0] * h.rect[1] : h.slot ? (h.slot - 2 * h.r) * 2 * h.r + Math.PI * h.r * h.r : Math.PI * h.r * h.r;
    return a;
  }
  perim() {
    let L = 0; const p = this.pts;
    for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; L += Math.hypot(q[0] - p[i][0], q[1] - p[i][1]); }
    for (const h of this.holes) L += h.rect ? 2 * (h.rect[0] + h.rect[1]) : h.slot ? 2 * (h.slot - 2 * h.r) + 2 * Math.PI * h.r : 2 * Math.PI * h.r;
    return L;
  }
  bbox() { const xs = this.pts.map(p => p[0]), ys = this.pts.map(p => p[1]); return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }; }
}
function rrect(w, h, r, x0 = -w / 2, y0 = -h / 2) {
  const s = new Shape(), x1 = x0 + w, y1 = y0 + h, P = Math.PI;
  s.start(x0 + r, y0).line(x1 - r, y0).arc(x1 - r, y0 + r, r, -P / 2, 0).line(x1, y1 - r).arc(x1 - r, y1 - r, r, 0, P / 2)
    .line(x0 + r, y1).arc(x0 + r, y1 - r, r, P / 2, P).line(x0, y0 + r).arc(x0 + r, y0 + r, r, P, 1.5 * P);
  return s;
}
function tabShape(w, h, holeD, tubeD) {
  const s = new Shape(), P = Math.PI;
  s.start(-w / 2, 0);
  if (tubeD) {
    const R = tubeD / 2, cw = Math.min(w * 0.9, tubeD * 0.9), cc = Math.sqrt(R * R - (cw / 2) ** 2), ang = Math.atan2(cc, cw / 2);
    s.line(-cw / 2, 0).arc(0, -cc, R, P - ang, ang).line(w / 2, 0);
  } else s.line(w / 2, 0);
  s.line(w / 2, h - w / 2).arc(0, h - w / 2, w / 2, 0, P).close();
  s.hole(0, h - w / 2, holeD);
  return s;
}
function tabShapeE(w, h, holeD, tubeD, stretch) { // saddle follows the ellipse a turned tab plane cuts from a round tube
  const R0 = tubeD / 2, cw = Math.min(w * 0.9, tubeD * 0.9), cc = Math.sqrt(R0 * R0 - (cw / 2) ** 2), s = new Shape(), P = Math.PI;
  s.start(-w / 2, 0).line(-cw / 2, 0);
  for (let i = 1; i <= 16; i++) { const x = -cw / 2 + cw * i / 16; s.line(x, stretch * (Math.sqrt(Math.max(0, R0 * R0 - x * x)) - cc)); }
  s.line(w / 2, 0).line(w / 2, h - w / 2).arc(0, h - w / 2, w / 2, 0, P).close();
  s.hole(0, h - w / 2, holeD); return s;
}
function polyShape(pts) { const s = new Shape(); s.start(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) s.line(pts[i][0], pts[i][1]); return s.close(); }
function pedalShape(len, ratioHoles, throttle) {
  const s = new Shape(), P = Math.PI, rb = throttle ? 14 : 17, rt = throttle ? 10 : 13;
  s.start(rb, 0).arc(0, 0, rb, 0, -P).line(-rt, len - 50).line(-28, len - 44).line(-28, len).line(18, len).line(18, len - 44).line(rt, len - 50).close();
  s.hole(0, 0, throttle ? 8.2 : 10.2);
  for (const z of ratioHoles) s.hole(throttle ? 0 : 5, z, throttle ? 4.2 : 8.2);
  s.hole(-5, len - 22, 6.6);
  return s;
}

/* clevis tab: 32 wide x 45 tall, hole 16 below the top; saddle seats on the rail */
const TAB_SADDLE = od => { const R = od / 2, cw = Math.min(32 * 0.9, od * 0.9); return Math.sqrt(R * R - (cw / 2) ** 2); };
const TAB_STAND = od => (45 - 16) + TAB_SADDLE(od);
/* rod-end catalog: thread, bolt hole, ball width + misalignment spacers = clevis gap */
const ROD_ENDS = {
  '5/16': { label: '5/16 in', hole: 8.1, gap: 11.1 + 6, thread: '5/16-24 UNF-2B', tap: 6.9, tapName: 'drill I (0.272 in)', bungOD: 19.05, bungL: 28 },
  '3/8': { label: '3/8 in', hole: 9.7, gap: 12.7 + 6, thread: '3/8-24 UNF-2B', tap: 8.43, tapName: 'drill Q (0.332 in)', bungOD: 22.23, bungL: 32 },
  '1/2': { label: '1/2 in', hole: 12.9, gap: 15.9 + 6, thread: '1/2-20 UNF-2B', tap: 11.51, tapName: 'drill 29/64 in (0.453 in)', bungOD: 25.4, bungL: 38 }
};

/* ---------- Coilover: lower A-arm to two chassis tabs on the upper rail, passing inside the upper wishbone ---------- */
function segDist(p1, q1, p2, q2) { // closest distance between segments
  const d1 = vsub(q1, p1), d2 = vsub(q2, p2), r = vsub(p1, p2), a = vdot(d1, d1), e = vdot(d2, d2), f = vdot(d2, r);
  let s, t; const c = vdot(d1, r), b = vdot(d1, d2), den = a * e - b * b;
  s = den > 1e-9 ? Math.min(1, Math.max(0, (b * f - c * e) / den)) : 0;
  t = (b * s + f) / e;
  if (t < 0) { t = 0; s = Math.min(1, Math.max(0, -c / a)); } else if (t > 1) { t = 1; s = Math.min(1, Math.max(0, (b - c) / a)); }
  return vlen(vsub(vadd(p1, vmul(d1, s)), vadd(p2, vmul(d2, t))));
}
const SHOCK_WEB_T = 3.175, SHOCK_HOLE_H = 20, SHOCK_LOW_UP = SHOCK_WEB_T / 2 + SHOCK_HOLE_H; // shock eye above the lower-arm leg plane: half the web plate + clevis hole height
const SHOCK_TAB_T = 4.763, SHOCK_GAP = 22.4; // 3/16 in clevis plates around a shock eye with spacers
/* Shocks: FOX DHX2 coil-over (popular in FSAE), body up. Catalog sizes are eye-to-eye at full extension x stroke.
   Geometry below is measured from each eye center along the shock axis (approximate; check against the FOX drawing for your unit). */
const SHOCKS = { // FOX DHX / DHX2 coil family, 1.385 in ID springs; spring free length and damper body grow with stroke (planning values, confirm with FOX)
  'dhx2-200x51': { label: 'FOX DHX2 coil, 7.875 × 2.0 in (200 × 51 mm)', eye: 200, stroke: 50.8, springFree: 120, bodyEnd: 118 },
  'dhx2-200x57': { label: 'FOX DHX2 coil, 7.875 × 2.25 in (200 × 57 mm)', eye: 200, stroke: 57.2, springFree: 120, bodyEnd: 122 },
  'dhx-210x55': { label: 'FOX DHX coil, 210 × 55 mm (metric)', eye: 210, stroke: 55, springFree: 120, bodyEnd: 122 },
  'dhx2-216x63': { label: 'FOX DHX2 coil, 8.5 × 2.5 in (216 × 63 mm)', eye: 215.9, stroke: 63.5, springFree: 135, bodyEnd: 130 },
  'dhx2-222x70': { label: 'FOX DHX2 coil, 8.75 × 2.75 in (222 × 70 mm)', eye: 222.3, stroke: 69.9, springFree: 145, bodyEnd: 137 },
  'dhx-230x60': { label: 'FOX DHX coil, 230 × 60 mm (metric)', eye: 230, stroke: 60, springFree: 135, bodyEnd: 145 },
  'dhx-230x65': { label: 'FOX DHX coil, 230 × 65 mm (metric)', eye: 230, stroke: 65, springFree: 140, bodyEnd: 145 }
};
const FOX = { eyeOD: 24, eyeW: 22.2, bolt: 8, headR: 22, headLen: 42, bodyR: 19.5, bodyEnd: 122, shaftR: 6.35, perchUp: 16, perchR: 30, collarR: 28.5, collarT: 9,
  springID: 35.2, wire: 9.5, springFree: 120, preload: 2 }; // FOX steel spring: 1.385 in ID
const springTop = S => S.eye - FOX.perchUp - ((S.springFree ?? FOX.springFree) - FOX.preload); // preload collar distance below the top eye
function withShock(P) { // installed length and spring length come from the chosen shock (front, and rear if set apart) and its ride-height sag
  const SF = SHOCKS[P.shockModel] || SHOCKS['dhx-210x55'], SR = (P.rearShockModel && P.rearShockModel !== 'same' && SHOCKS[P.rearShockModel]) || SF, sag = (P.shockSag ?? 30) / 100;
  const instF = SF.eye - sag * SF.stroke, instR = SR.eye - sag * SR.stroke;
  return { ...P, shockLenF: instF, shockLenR: instR, shockStroke: SF.stroke, springLen: instF - FOX.perchUp - springTop(SF), springLenR: instR - FOX.perchUp - springTop(SR), _shock: SF, _shockR: SR };
}
const SPRING_R = (FOX.springID + 2 * FOX.wire) / 2, PERCH = 32; // FOX steel spring OD ~54 mm
// Spring envelope: lower seat sits SPR_LOW above the lower eye; the spring is sLen long at ride height,
// so the body collar sits (len - SPR_LOW - sLen) below the top eye and moves with the body
const SPR_LOW = FOX.perchUp;
const springZone = (Lm, U, len, sLen) => { const a = vnorm(vsub(U, Lm)), top = Math.max(20, len - SPR_LOW - sLen); return [vadd(Lm, vmul(a, SPR_LOW)), vsub(U, vmul(a, top))]; };
function throughUpperArm(Lm, U, g) {
  const B = g.UIPf, C = g.UIPr, A = vadd(g.UBJ, vmul(vnorm(vsub(vlerp(B, C, 0.5), g.UBJ)), g.apexOff || 0)), n = vcross(vsub(B, A), vsub(C, A));
  const dL = vdot(vsub(Lm, A), n), dU = vdot(vsub(U, A), n);
  if (dL * dU >= 0) return false; // both eyes on one side of the arm plane
  const t = dL / (dL - dU), X = vadd(Lm, vmul(vsub(U, Lm), t));
  const v0 = vsub(B, A), v1 = vsub(C, A), v2 = vsub(X, A), d00 = vdot(v0, v0), d01 = vdot(v0, v1), d11 = vdot(v1, v1), d20 = vdot(v2, v0), d21 = vdot(v2, v1), den = d00 * d11 - d01 * d01;
  const b1 = (d11 * d20 - d01 * d21) / den, b2 = (d00 * d21 - d01 * d20) / den;
  return b1 > 0 && b2 > 0 && b1 + b2 < 1;
}
function solveShock(g, o) {
  // o: {len, mr, xPref, rail:{y,z}, extra}; the chassis tab leans from vertical toward outboard by phi and reaches t from the rail
  const K = makeKin(g), axL = vnorm(vsub(g.LIPf, g.LIPr)), lipM = vlerp(g.LIPf, g.LIPr, 0.5);
  const dth = 0.004, sP = K.state(dth); K.reset(); const sM = K.state(-dth); K.reset(); const s0 = K.state(0); s0.th = 0; K.reset();
  const dWheel = sP.WC.z - sM.WC.z;
  let nArm = vnorm(vcross(vsub(g.LIPf, g.LBJ), vsub(g.LIPr, g.LBJ))); if (nArm.z < 0) nArm = vmul(nArm, -1);
  // web legs run from the apex bung (LBJ moved bjOff toward the pivots) to each inner pivot, as built
  const Aap = vadd(g.LBJ, vmul(vnorm(vsub(lipM, g.LBJ)), o.apexOff || 0));
  const legX = (Pp, y) => { const s = (y - Pp.y) / (Aap.y - Pp.y), dx = Aap.x - Pp.x, dy = Aap.y - Pp.y; return { x: Pp.x + s * dx, k: Math.hypot(dx, dy) / Math.abs(dy) }; };
  const lowerAt = (f, xPref) => {
    const y = lipM.y + f * (g.LBJ.y - lipM.y) + nArm.y * SHOCK_LOW_UP, z = lipM.z + f * (g.LBJ.z - lipM.z) + nArm.z * SHOCK_LOW_UP;
    // in-plane clearance from the clevis slots to each leg's inner edge: slot centre at gap/2 + tab/2, slot half-length, 2 mm land, leg radius, weld
    const MARG = SHOCK_GAP / 2 + SHOCK_TAB_T / 2 + 4.15 + 2 + 7.95 + 4 + 3.5; // + room for upsized legs
    const LF = legX(g.LIPf, y), LR = legX(g.LIPr, y);
    const xf = LF.x - MARG * LF.k, xr = LR.x + MARG * LR.k;   // x offset grows as the leg lies closer to the x axis
    if (xf < xr) return null; // legs too close here for a clevis pair
    return v(Math.min(xf, Math.max(xr, xPref)), y, z);
  };
  let best = null, maxMR = 0;
  const fMax = 1 - (o.apexOff + 30) / vlen(vsub(g.LBJ, lipM));
  for (const xp of o.xPrefs) for (let f = 0.3; f <= Math.min(0.95, fMax); f += 0.01) {
    const Lm = lowerAt(f, xp); if (!Lm) continue;
    for (let pd = -10; pd <= 75; pd += 2.5) {
      const ph = pd * D2R, dir = v(0, Math.sin(ph), Math.cos(ph)), R0 = v(Lm.x, o.rail.y, o.rail.z);
      // |R0 + t dir - Lm| = len  ->  t^2 + 2 t (dir.(R0-Lm)) + |R0-Lm|^2 - len^2 = 0
      const w = vsub(R0, Lm), bq = vdot(dir, w), cq = vdot(w, w) - o.len * o.len, disc = bq * bq - cq;
      if (disc < 0) continue;
      const t = -bq + Math.sqrt(disc);
      if (t < 28 || t > o.maxReach) continue;
      const U = vadd(R0, vmul(dir, t));
      if (!throughUpperArm(Lm, U, g)) continue; // shock must pass through the upper wishbone opening
      const lp = vlen(vsub(U, rotAbout(Lm, g.LIPr, axL, dth))), lm = vlen(vsub(U, rotAbout(Lm, g.LIPr, axL, -dth)));
      const mr = Math.abs((lp - lm) / dWheel);
      const sh = { Lm, U, len: o.len, sLen: o.sLen, bodyEnd: o.bodyEnd };
      const cl = shockClear(sh, g, s0, o.extra);
      if (cl.gap >= 5 && mr > maxMR) maxMR = mr;
      const pen = Math.abs(mr - o.mr) * 10 + Math.max(0, 8 - cl.gap) * 0.5 + t / 400;
      if (!best || pen < best.pen) best = { f, Lm, U, h: t, phi: pd, mr, pen, gap0: cl.gap };
    }
  }
  if (!best) return { ok: false };
  best.ok = Math.abs(best.mr - o.mr) < 0.03; best.len = o.len; best.sLen = o.sLen; best.bodyEnd = o.bodyEnd;
  // highest ratio this frame allows at this length (for the readout)
  best.mrMax = maxMR; 
  return best;
}
// hoops bend on OSH Cut's 1.0 in round-tube die: 3.0 in centerline radius (also the FSAE 3 x OD minimum), 2.25 in straight between bends
const HOOP_CLR = 76.2, HOOP_MIN_STRAIGHT = 57.15, RE_BUNG_CLR = 26, DAMPER_R = FOX.headR, BODY_FRAC = 0.56, TOWER_NODE = 60; // damper body radius and length share (top end), eye-to-tower-node offset
function shockLowerAt(sh, g, st) { // lower eye at a kinematic state: on the upright (moves with it) or on the lower arm (turns about the pivots)
  if (sh.eyeLocal) { const F = uprightFrame(st.LBJ, st.UBJ, st.spin), l = sh.eyeLocal; return vadd(st.LBJ, vadd(vmul(F.fwd, l.x), vadd(vmul(F.out, l.y), vmul(F.k, l.z)))); }
  return rotAbout(sh.Lm, g.LIPr, vnorm(vsub(g.LIPf, g.LIPr)), st.th || 0);
}
/* lower A-arm bending when the coilover pushes on it: statics of the arm (pivots, ball joint, shock foot), web shares the load by the lever rule */
const DESIGN = { kg: 280, front: 0.45, g: 3 }; // car + 80 kg driver, front share, vertical bump factor
const ARM_UP = { imperial: [{ od: 19.05, t: 1.651, label: '0.750 × 0.065 in' }, { od: 22.225, t: 1.651, label: '0.875 × 0.065 in' }, { od: 22.225, t: 2.108, label: '0.875 × 0.083 in' }],
  metric: [{ od: 20, t: 1.5, label: '20 × 1.5 mm' }, { od: 22, t: 2, label: '22 × 2 mm' }, { od: 22, t: 2.5, label: '22 × 2.5 mm' }] };
const tubeZ = t => { const D = t.od, d = t.od - 2 * t.t; return Math.PI * (D ** 4 - d ** 4) / (32 * D); };
function lowerArmBending(g, foot, Fw, apexOff) {
  const X = vnorm(vsub(g.LIPf, g.LIPr)), d0 = vsub(g.LBJ, g.LIPr), Yl = vnorm(vsub(d0, vmul(X, vdot(d0, X))));
  const c = p => [vdot(vsub(p, g.LIPr), X), vdot(vsub(p, g.LIPr), Yl)];
  const xf = c(g.LIPf)[0], [xB, yB] = c(g.LBJ), [xs, ys] = c(foot);
  const lipM = vlerp(g.LIPf, g.LIPr, 0.5), [xA, yA] = c(vadd(g.LBJ, vmul(vnorm(vsub(lipM, g.LBJ)), apexOff)));
  const Fs = Fw * yB / ys, Rf = (Fs * xs - Fw * xB) / xf, Rr = Fs - Fw - Rf;
  const legAt = (x0, y) => x0 + (xA - x0) * (y / yA), xFl = legAt(xf, ys), xRl = legAt(0, ys), wF = Math.min(1, Math.max(0, (xs - xRl) / (xFl - xRl)));
  let M = 0;
  for (const [x0, R, Fi] of [[xf, Rf, Fs * wF], [0, Rr, Fs * (1 - wF)]]) {
    const Ll = Math.hypot(xA - x0, yA), si = Ll * Math.min(1, ys / yA);
    for (const sv of [si, Ll]) M = Math.max(M, Math.abs(R * sv - Fi * Math.max(0, sv - si)));
  }
  return { Fs, M };
}
// Coilover with its top eye on a triangulated tower over the upper rail. The lower eye is either on the (non-steering)
// upright, in a clevis ear in the corner of the inboard plate and bottom ear (the lower arm then carries no spring load),
// or on the lower arm (web plate + clevis). o.eyeMode: 'upright' | 'arm'.
const EYE_W = FOX.eyeW, BOLT_SLV = { od: 12.7, t: 1.651, label: '0.500 × 0.065 in' }; // shock eye width; weld-through sleeve for a 5/16 in bolt
// steer-axis moment arm of the shock force: how hard the coilover tries to steer the upright (reacted by the tie rod / toe link)
function steerArm(E, U, st) { const a = vnorm(vsub(U, E)), k = vnorm(vsub(st.UBJ, st.LBJ)); return Math.abs(vdot(vcross(vsub(E, st.LBJ), a), k)); }
/* Coilover solver. Lower eye (o.eyeMode):
   'upright' – clevis ear in the corner of the (non-steering) upright's inboard plate and bottom ear; the lower arm carries no spring load
   'bolt'    – through-bolt along the pivot axis through weld-in sleeves in BOTH lower-arm legs, eye between them on spacers
   'web'     – web plate between the legs with a clevis pair (eye above the arm plane)
   Top eye (o.top): 'tabs' – a leaned tab pair on the upper rail; 'tower' – clevis at the node of a triangulated tower */
function solveShockTower(g, o) {
  const K = makeKin(g), lA = Math.hypot(g.LBJ.y - g.LIPr.y, g.LBJ.z - g.LIPr.z), th25 = 25 / lA, dth = 0.004;
  const st = th => { K.reset(); const r = K.state(th); r.th = th; K.reset(); return r; };
  const s0 = st(0), sP = st(dth), sM = st(-dth), sts = [s0, st(th25), st(-th25)], dW = sP.WC.z - sM.WC.z;
  const step = o.fast ? 2 : 1, eyes = [], top = o.top || 'tabs';
  if (o.eyeMode === 'upright') {
    const F0 = uprightFrame(s0.LBJ, s0.UBJ, s0.spin), toLocal = p => { const d = vsub(p, s0.LBJ); return v(vdot(d, F0.fwd), vdot(d, F0.out), vdot(d, F0.k)); };
    const pl = o.planes, Wp = (x, b, z) => vadd(pl.WC, vadd(vmul(pl.xw, x), vadd(vmul(pl.s, b), vmul(pl.zw, z))));
    const xToe = vdot(vsub(g.OTR, pl.WC), pl.xw), half = SHOCK_GAP / 2 + SHOCK_TAB_T;
    const straddle = o.straddle, hvMin = straddle ? o.hvLink : 24;
    for (let ex = -140; ex <= Math.min(100, o.exMax ?? 100); ex += 3) {
      if (straddle) { if (ex !== -140) break; ex = xToe; }                       // clevis straddles the toe link: eye right above it
      if (Math.abs(ex) < 62) continue;                                        // outer CV joint
      if (!straddle && o.toeSide && Math.sign(ex) !== Math.sign(xToe)) continue; // same side of the axle as the tie rod / toe link
      if (!straddle && Math.abs(ex - xToe) < half + 16 + 14) continue;         // ear plates clear the toe-link rod end and tube through travel
      for (let ez = -95; ez <= 10; ez += 5) for (let eu = 20; eu <= (o.euMax ?? 64); eu += 8) {
        const E = Wp(ex, pl.bIPi - eu, ez), hv = vdot(vsub(E, pl.earTop), pl.k);
        if (!straddle && ez > -15) continue;
        // eye ring + land above the bottom ear (straddle: above the toe link, which passes between the clevis plates)
        if (hv >= hvMin && hv <= hvMin + 50) eyes.push({ E, eyeLocal: toLocal(E), meta: { hv, ex, ez, eu, onUpright: true, lowMode: 'upright', straddle: !!straddle, toeGap: straddle ? 0 : Math.abs(ex - xToe) - half }, bias: (straddle ? (hv - hvMin) / 300 : (Math.abs(ex - xToe) - half) / 600) });
      }
    }
  } else {
    const bolt = o.eyeMode === 'bolt', lipM = vlerp(g.LIPf, g.LIPr, 0.5); let nArm = vnorm(vcross(vsub(g.LIPf, g.LBJ), vsub(g.LIPr, g.LBJ))); if (nArm.z < 0) nArm = vmul(nArm, -1);
    const Aap = vadd(g.LBJ, vmul(vnorm(vsub(lipM, g.LBJ)), o.apexOff || 0));
    const legX = (Pp, y) => { const sL = (y - Pp.y) / (Aap.y - Pp.y), dx = Aap.x - Pp.x, dy = Aap.y - Pp.y; return { x: Pp.x + sL * dx, k: Math.hypot(dx, dy) / Math.abs(dy) }; };
    const up = bolt ? 0 : SHOCK_LOW_UP, rL = 7.95 + (o.legGrow || 0);
    const MARG = bolt ? rL + 2 + EYE_W / 2 : SHOCK_GAP / 2 + SHOCK_TAB_T / 2 + 4.15 + 2 + 7.95 + 4 + (o.legGrow || 0); // bolt: leg wall + 2 mm spacer + half the eye
    const fMax = 1 - (o.apexOff + (bolt ? RE_BUNG_CLR : 30)) / vlen(vsub(g.LBJ, lipM));
    for (let f = 0.3; f <= Math.min(0.97, fMax); f += 0.02 * step) {
      const y = lipM.y + f * (g.LBJ.y - lipM.y) + nArm.y * up, z = lipM.z + f * (g.LBJ.z - lipM.z) + nArm.z * up;
      const LF = legX(g.LIPf, y), LR = legX(g.LIPr, y), xf = LF.x - MARG * LF.k, xr = LR.x + MARG * LR.k;
      if (xf < xr) continue;
      if (bolt && (LF.x - rL * LF.k) - (LR.x + rL * LR.k) > 140) continue;     // keep the bolt span short
      const n = bolt ? 2 : 4;
      for (let i = 0; i <= n; i++) eyes.push({ E: v(xr + (xf - xr) * i / n, y, z), meta: { f, lowMode: o.eyeMode, legF: LF, legR: LR }, bias: (1 - f) / 50 }); // outboard = less arm bending
    }
  }
  let best = null, maxMR = 0;
  const consider = (ey, U, extraMeta, penTop) => {
    const E = ey.E, sh = { eyeLocal: ey.eyeLocal, Lm: E, len: o.len, sLen: o.sLen, bodyEnd: o.bodyEnd, lowMode: ey.meta.lowMode };
    { const B = g.UIPf, C2 = g.UIPr, Aa = vadd(g.UBJ, vmul(vnorm(vsub(vlerp(B, C2, 0.5), g.UBJ)), g.apexOff || 0)); let nU = vcross(vsub(B, Aa), vsub(C2, Aa)); if (nU.z < 0) nU = vmul(nU, -1);
      const above = vdot(vsub(U, Aa), nU) > 0; // a top eye above the upper wishbone means the shock passes through it; below, it stays under it
      if (above && !throughUpperArm(E, U, g)) { if (globalThis.__sd) globalThis.__sd.thru = (globalThis.__sd.thru || 0) + 1; return; } }
    const lp = vlen(vsub(U, shockLowerAt(sh, g, sP))), lm = vlen(vsub(U, shockLowerAt(sh, g, sM))), mr = Math.abs((lp - lm) / dW);
    const sa = ey.meta.onUpright ? steerArm(E, U, s0) : 0;
    const pen0 = Math.abs(mr - o.mr) * 10 + ey.bias + penTop + sa / (o.saW ?? 200);
    if (best && pen0 > best.pen && mr <= maxMR) return;
    const c = { ...sh, U, ...extraMeta(E, U) };
    let gap = 1e9, what = '';
    for (const s2 of sts) { const r = shockClear(c, g, s2, o.extra); if (r.gap < gap) { gap = r.gap; what = r.what; } }
    if (globalThis.__sd && (!globalThis.__sdAft || (ey.meta.ex ?? 0) < 0)) { const k = gap >= 5 ? 'ok' : what; globalThis.__sd[k] = (globalThis.__sd[k] || 0) + 1; }
    if (gap >= 5 && mr > maxMR) maxMR = mr;
    if (best && pen0 > best.pen) return;
    const pen = pen0 + Math.max(0, 8 - gap) * 0.5 + (gap < 3 ? 5 : 0);
    if (!best || pen < best.pen) best = { ...c, ...ey.meta, f: ey.meta.f ?? 1, mr, pen, gap0: gap, what0: what, steerArm: sa };
  };
  for (const ey of eyes) {
    const E = ey.E;
    for (const ux of [0, 15, -15, 30, -30, 45, -45]) { // side-view lean up to ~12 deg (spherical eyes take it); on the upright it can aim the shock line at the steer axis
      if (Math.abs(ux) > 0.21 * o.len) continue;
      const xS = E.x + ux; if (xS < o.xMin || xS > o.xMax || (o.ban && o.ban(xS))) continue;
      if (top === 'tower') {
        for (let y = o.rail.y + 25; y <= o.rail.y + o.out; y += 5 * step) {
          const dy = y - E.y, dz2 = o.len * o.len - dy * dy - ux * ux; if (dz2 <= 0) continue;
          const U = v(xS, y, E.z + Math.sqrt(dz2)); if (U.z < o.rail.z + 45 || U.z > o.rail.z + 220) continue;
          consider(ey, U, (E2, U2) => { const a = vnorm(vsub(U2, E2)), ST = vadd(U2, vmul(a, TOWER_NODE)), SHU = v(xS, o.rail.y, o.rail.z), SHL = v(xS, o.railL.y, o.railL.z);
            return { tower: { r: o.tubeR, tubes: [[SHU, ST, 'tower upper leg'], [SHL, ST, 'tower lower leg'], [o.third, ST, 'tower brace leg']] }, ST, SHU, SHL, h: vlen(vsub(ST, SHU)), phi: 0, ux }; }, (y - o.rail.y) / 1000 + Math.abs(ux) / 2000);
        }
      } else {
        for (let pd = -10; pd <= 160; pd += 2.5 * step) { // tab pair leans outboard by pd (past 90 = hangs outboard-down under the upper arm) and reaches t from the rail centerline
          const ph = pd * D2R, dir = v(0, Math.sin(ph), Math.cos(ph)), R0 = v(xS, o.rail.y, o.rail.z), w = vsub(R0, E), bq = vdot(dir, w), cq = vdot(w, w) - o.len * o.len, disc = bq * bq - cq;
          if (disc < 0) { if (globalThis.__sd) globalThis.__sd.disc = (globalThis.__sd.disc || 0) + 1; continue; }
          for (const t of [-bq - Math.sqrt(disc), -bq + Math.sqrt(disc)]) {
            if (t < 28 || t > (o.maxReach ?? 90)) { if (globalThis.__sd) globalThis.__sd.reach = (globalThis.__sd.reach || 0) + 1; continue; }
            consider(ey, vadd(R0, vmul(dir, t)), (E2, U2) => ({ h: t, phi: pd, ux, tabSeg: [vadd(R0, vmul(dir, 12.7)), U2] }), t / 400 + Math.abs(ux) / 2000);
          }
        }
      }
    }
  }
  if (!best) return { ok: false };
  best.ok = Math.abs(best.mr - o.mr) < 0.03; best.mrMax = maxMR; best.len = o.len; best.sLen = o.sLen; best.bodyEnd = o.bodyEnd;
  return best;
}
function shockClear(sh, g, st, extra) { // spring envelope clearance at a kinematic state
  const Lm = shockLowerAt(sh, g, st), U = sh.U, ax = vnorm(vsub(U, Lm));
  const [s0, s1] = springZone(Lm, U, sh.len || vlen(vsub(sh.U, sh.Lm)), sh.sLen);
  const apU = vadd(st.UBJ, vmul(vnorm(vsub(vlerp(g.UIPf, g.UIPr, 0.5), st.UBJ)), g.apexOff || 0)); // legs run from the apex bung, not the ball
  const arms = [[apU, g.UIPf, 8, 'upper arm front leg'], [apU, g.UIPr, 8, 'upper arm rear leg'], [st.UBJ, apU, 11, 'upper apex bung / rod end']];
  const apL = vadd(st.LBJ, vmul(vnorm(vsub(vlerp(g.LIPf, g.LIPr, 0.5), st.LBJ)), g.apexOff || 0));
  const lowLegs = [[apL, g.LIPf, 8 + (g.legGrow || 0), 'lower arm front leg'], [apL, g.LIPr, 8 + (g.legGrow || 0), 'lower arm rear leg']];
  const obs = [...arms, ...lowLegs, [st.OTR, st.ITR, 9.5, 'tie rod / toe link'], ...extra];
  let worst = { gap: 1e9, what: '' };
  for (const [a, b, r, what] of obs) { const gp = segDist(s0, s1, a, b) - SPRING_R - r; if (gp < worst.gap) worst = { gap: gp, what }; }
  { const gp = segDist(Lm, vadd(Lm, vmul(ax, 18)), st.OTR, st.ITR) - 16 - 9.5; if (gp < worst.gap) worst = { gap: gp, what: 'tie rod / toe link (lower eye)' }; }
  // damper body (top end) where it passes through the upper wishbone
  const b0 = U, b1 = vsub(U, vmul(ax, Math.min(sh.bodyEnd ?? FOX.bodyEnd, (sh.len || vlen(vsub(U, Lm))) - 25)));
  for (const [a, b, r, what] of arms) { const gp = segDist(b0, b1, a, b) - DAMPER_R - r; if (gp < worst.gap) worst = { gap: gp, what: what + ' (damper body)' }; }
  if (sh.tabSeg) for (const [a, b, r, what] of [...arms, ...lowLegs]) { const gp = segDist(sh.tabSeg[0], sh.tabSeg[1], a, b) - 16 - r; if (gp < worst.gap) worst = { gap: gp, what: 'top tab vs ' + what }; }
  if (sh.tower) for (const [ta, tb, tn] of sh.tower.tubes) {
    const tr = sh.tower.r, chk = (gp, what) => { if (gp < worst.gap) worst = { gap: gp, what }; };
    for (const [a, b, r, what] of [...arms, [st.OTR, st.ITR, 9.5, 'toe link'], [st.LBJ, g.LIPf, 8, 'lower arm front leg'], [st.LBJ, g.LIPr, 8, 'lower arm rear leg'], ...extra.filter(o => /halfshaft|cv/i.test(o[3]))]) chk(segDist(ta, tb, a, b) - tr - r, `${tn} vs ${what}`);
    chk(segDist(ta, tb, s0, s1) - tr - SPRING_R, `${tn} vs spring`);
    chk(segDist(ta, tb, b0, b1) - tr - DAMPER_R + 4, `${tn} vs damper body`);   // body sits between the node plates at the top
    chk(segDist(ta, tb, U, U) - tr - 15, `${tn} vs top eye`);
  }
  // tire inner sidewall
  const yIn = st.WC.y - (extra.tireHalfW || 0);
  const ySpring = Math.max(s0.y, s1.y) + SPRING_R;
  if (extra.tireHalfW && yIn - ySpring < worst.gap) worst = { gap: yIn - ySpring, what: 'tire inner sidewall' };
  return { ...worst, len: vlen(vsub(U, Lm)) };
}

/* ---------- Fabricated upright: laser-cut twin-plate box around two bolt-on flange bearings ----------
   Purchased parts it is built around:
   - 2 x SBPFL205 stamped-steel 2-bolt flange bearing, 25 mm bore, 76 mm bolt centers (bolts run along the kingpin)
   - Wilwood PS-1 caliper (120-5453 RH / 120-5456 LH, 1.00 in pistons, 0.20 in rotor), 2.50 in mount, mount line at rotor R - 30.9 mm
   - 25 mm steel hub shaft, laser-cut hub flange and laser-cut 4130 rotor, M12 x 1.5 wheel studs on 4 x 100
   - Standard male rod ends at the upright, each bolted on top of (or under) a 1/4 in ear with ONE bolt along the kingpin */
const UPR = { TP: 3.175, TE: 6.35, ROT_T: 4.763, ROT_D: 190, HUB_D: 124, GAP: 50, BRG_BOLT: 76, BRG_PRO: 22, BRG_W: 71, BRG_L: 96, BRG_KG: 0.492, CAL_R_OFF: 30.9, CAL_SPAN: 63.5, CAL_KG: 0.42, HW: 44, AW: 30, SPACER: 6 };
/* tab insertion: tabs = [{ axis: 'y'|'x', at, from, to, h }] — a tab of height h (signed, along the edge normal axis) on the edge lying on axis=at */
function addTabs(pts, tabs) {
  const out = [], n = pts.length, eps = 1e-6;
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n]; out.push(p);
    for (const ax of ['x', 'y']) {
      const ci = ax === 'y' ? 1 : 0, ti = 1 - ci; // ci: constant coordinate index along this edge
      if (Math.abs(p[ci] - q[ci]) > eps) continue;
      const on = tabs.filter(t => t.axis === ax && Math.abs(t.at - p[ci]) < eps && Math.min(t.from, t.to) > Math.min(p[ti], q[ti]) + eps && Math.max(t.from, t.to) < Math.max(p[ti], q[ti]) - eps);
      const inc = q[ti] > p[ti];
      on.sort((s, t) => inc ? s.from - t.from : t.from - s.from).forEach(t => {
        const lo = Math.min(t.from, t.to), hi = Math.max(t.from, t.to), seq = inc ? [lo, hi] : [hi, lo];
        const mk = (u, off) => { const r = [0, 0]; r[ti] = u; r[ci] = p[ci] + off; return r; };
        out.push(mk(seq[0], 0), mk(seq[0], t.h), mk(seq[1], t.h), mk(seq[1], 0));
      });
    }
  }
  return out;
}
function hullPts(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
function hullShape(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return polyShape(lo.slice(0, -1).concat(up.slice(0, -1)));
}
const circPts = (x, y, r, n = 24) => Array.from({ length: n }, (_, i) => [x + r * Math.cos(2 * Math.PI * i / n), y + r * Math.sin(2 * Math.PI * i / n)]);
// insert a rectangular tab of depth d on the CCW polygon edge A->B, between fractions t0..t1 of the edge (outward = right of travel)
function insertTab(pts, A, B, t0, t1, d) {
  const n = pts.length, near = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-6;
  for (let i = 0; i < n; i++) if (near(pts[i], A) && near(pts[(i + 1) % n], B)) {
    const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy), on = [dy / L, -dx / L], at = t => [A[0] + dx * t, A[1] + dy * t];
    const p0 = at(t0), p1 = at(t1), ins = [p0, [p0[0] + on[0] * d, p0[1] + on[1] * d], [p1[0] + on[0] * d, p1[1] + on[1] * d], p1];
    return pts.slice(0, i + 1).concat(ins, pts.slice(i + 1));
  }
  return pts; // edge not on the hull (degenerate geometry): leave untabbed, the fit check reports it
}
function discShape(D) { const s = new Shape(); s.start(D / 2, 0).arc(0, 0, D / 2, 0, Math.PI).arc(0, 0, D / 2, Math.PI, 2 * Math.PI); s.close(); return s; }
function uprightFrame(LBJ, UBJ, spin) {
  const k = vnorm(vsub(UBJ, LBJ)), fwd = vnorm(vcross(spin, k)), out = vnorm(vcross(k, fwd));
  return { k, fwd, out };
}
function uprightDesign(g, ax, P, RE, W, st = {}) {
  // Built in the WHEEL frame: side plates, bearings, hub and rotor square to the axle (so they follow camber);
  // only the ears are square to the kingpin, because the rod-end bolts run along it.
  const sTop = st.sTop ?? UPR.SPACER, sBot = st.sBot ?? UPR.SPACER;
  const ROT_D = P.rotorD ?? 220, HUB_D = Math.min(150, ROT_D - 2 * 34), TONG = 18;
  const F = uprightFrame(g.LBJ, g.UBJ, g.spin), { k, fwd, out } = F;
  const s = vnorm(g.spin), xw = fwd, zw = vnorm(vcross(xw, s)); // wheel frame: forward, axle out, up
  const WC = g.WC, Wp = (x, b, z) => vadd(WC, vadd(vmul(xw, x), vadd(vmul(s, b), vmul(zw, z))));
  const { TP, TE, ROT_T, GAP, HW, AW, SPACER } = UPR, ballH = (RE.gap - 6) / 2;
  // wheel mounting face along the axle: as far inboard as asked, but pushed out until the rotor clears every rod end, ear tongue and link end inside its radius
  const sOf = p => vdot(vsub(p, WC), s), rOf = p => { const d = vsub(p, WC); return vlen(vsub(d, vmul(s, vdot(d, s)))); };
  const keep = [[g.UBJ, 14], [g.LBJ, 14], [g.OTR, 14], [vsub(g.UBJ, vmul(k, sTop + ballH)), TONG], [vadd(g.LBJ, vmul(k, sBot + ballH)), TONG]];
  const sReq = Math.max(-1e9, ...keep.filter(([p, r]) => rOf(p) - r < ROT_D / 2 + 3).map(([p, r]) => sOf(p) + r)) + 3;
  const bH = Math.max(-(P.wheelInset ?? 22), sReq + TE + ROT_T);
  const insetActual = -bH;
  const bRot = bH - TE - ROT_T / 2;
  const bOPo = bH - TE - ROT_T - 6 - UPR.BRG_PRO;          // outboard plate outer face
  const bIPi = bOPo - TP - GAP - TP;                       // inboard plate inboard face
  // ear planes (square to the kingpin), measured along the kingpin from the ball centers
  const topEarO = vsub(g.UBJ, vmul(k, sTop + ballH + TE));  // underside of the top ear, on the kingpin
  const botEarO = vadd(g.LBJ, vmul(k, sBot + ballH));       // underside of the bottom ear, on the kingpin
  const botEarTop = vadd(botEarO, vmul(k, TE));
  const cosD = Math.abs(vdot(zw, k)), tanD = Math.sqrt(Math.max(0, 1 - cosD * cosD)) / cosD; // tilt between plates and ears
  const edgeZ = (b, planePt) => vdot(vsub(planePt, vadd(WC, vmul(s, b))), k) / vdot(zw, k); // side-plate edge height that lies on an ear plane
  const plates = [], nm = ax === 'F' ? 'Front' : 'Rear';
  const add = (name, mat, shape, origin, ux, uy, note) => plates.push({ name: `${nm} upright ${name}`, mat, shape, origin, ux, uy, t: PMAT[mat].t, note });
  const SL = 0.3, TAB = [[-19, -5], [5, 19]], webA = HW - 8 - TP / 2, webC = [[-38, -22], [22, 38]];
  const th = 30 * D2R, Rm = ROT_D / 2 - UPR.CAL_R_OFF, mid = [Rm * Math.cos(th), Rm * Math.sin(th)];
  const calH = [[mid[0] - UPR.CAL_SPAN / 2 * Math.sin(th), mid[1] + UPR.CAL_SPAN / 2 * Math.cos(th)], [mid[0] + UPR.CAL_SPAN / 2 * Math.sin(th), mid[1] - UPR.CAL_SPAN / 2 * Math.cos(th)]];
  // optional shock ear (rear): two 3/16 in plates square to the forward axis, closing the corner between the inboard side
  // plate and the bottom ear; tabs key into slots in both, the shock bolt runs fore-aft in double shear
  let SE = null;
  if (st.shockEye) {
    const E = st.shockEye, eX = vdot(vsub(E, WC), xw), eB = vdot(vsub(E, WC), s), eZ = vdot(vsub(E, WC), zw), eu = bIPi - eB;
    const SD = st.shockStraddle ? { ...st.shockStraddle, linkTop: vdot(vsub(g.OTR, botEarTop), k) + 9.5 } : null, g2 = (SD ? SD.gap : SHOCK_GAP) / 2, TT = SHOCK_TAB_T, kz = vdot(zw, k), Lu = eu + 18, vTop = 22;
    const vEar = (xm, u) => -vdot(vsub(Wp(xm, bIPi - u, eZ), botEarTop), k) / kz;
    // straddling the toe link: the link runs inboard between the two plates, so the inboard-plate tabs sit above it
    const fa0 = SD ? SD.linkTop + 26 : 5, ua = 5;
    SE = { eX, eZ, eu, Lu, vTop, plates: [], ipSlots: [], earSlots: [], earPts: [], ipPts: [], gap: 2 * g2, notch: SD ? { x0: eX - g2, x1: eX + g2, h: SD.linkTop + 20 } : null, hv: Math.min(...[eX + g2, eX - g2 - TT].map(x0 => -vEar(x0 + TT / 2, eu))) };
    for (const x0 of [eX + g2, eX - g2 - TT]) {
      const ub = Math.max(ua + 6, Math.min(Lu - 5, ua + 14)), uL = Math.min(Lu, ub + 6);       // bottom edge only as far as the tab, then chamfered up to the eye (keeps clear of the lower arm)
      const xm = x0 + TT / 2, P0 = [0, vEar(xm, 0)], PL = [uL, vEar(xm, uL)], PT = [0, vTop];
      // compact ear: a tapered arm cantilevered off the inboard plate, root deep enough for the 3 g bump (each plate takes half the shock force)
      const Fs = DESIGN.kg * 9.81 * (ax === 'F' ? DESIGN.front : 1 - DESIGN.front) / 2 / Math.max(0.3, st.shockMR ?? (ax === 'F' ? P.mrF : P.mrR) ?? 0.5) * DESIGN.g, Mroot = Fs / 2 * eu, SIG_A = 170;
      const Droot = Math.max(44, Math.sqrt(6 * Mroot / (TT * SIG_A))), PB = [0, vTop - Droot], compact = PB[1] > P0[1] + 8;
      let pts, fa, fb;
      if (compact) {
        pts = hullPts([PT, PB, ...circPts(eu, 0, 16)]);
        fa = PB[1] + 7; fb = PT[1] - 7;
        pts = insertTab(pts, PT, PB, (vTop - fb) / Droot, (vTop - fa) / Droot, TP);                // one long tab into the inboard plate
        SE.sigma = 6 * Mroot / (TT * Droot * Droot); SE.root = Droot;
      } else {
        pts = hullPts([P0, PL, PT, ...circPts(eu, 0, 16)]);
        fa = P0[1] + fa0; fb = Math.max(fa + 6, Math.min(vTop - 4, fa + 14)); const fl = vTop - P0[1];
        pts = insertTab(pts, PT, P0, (vTop - fb) / fl, (vTop - fa) / fl, TP);                     // into the inboard plate
        pts = insertTab(pts, P0, PL, ua / uL, ub / uL, TE);                                         // into the bottom ear
      }
      SE.compact = compact;
      const sh = polyShape(pts); sh.hole(eu, 0, 8.4);
      SE.plates.push({ sh, origin: Wp(x0 + TT, bIPi, eZ), name: x0 > eX ? 'shock ear, front plate' : 'shock ear, rear plate', fb, fa });
      SE.ipSlots.push([xm, eZ + (fa + fb) / 2, TT + 0.3, fb - fa + 0.3]);
      if (!compact) { const uc = (ua + ub) / 2; SE.earSlots.push({ p: Wp(xm, bIPi - uc, eZ + vEar(xm, uc)), w: TT + 0.6, h: ub - ua + 0.6 });
        for (const u of [-TP - 1, ub + 8]) for (const xx of [x0 - 7, x0 + TT + 7]) SE.earPts.push(Wp(xx, bIPi - u, eZ + vEar(xx, u))); } // lobe only under the tabs: keeps clear of the lower-arm front leg
      for (const xx of [x0 - 7, x0 + TT + 7]) SE.ipPts.push([xx, eZ + vTop + 5]);
    }
  }
  const sidePlate = (bMid, lobe, shockLobe) => {
    const zT = edgeZ(bMid, topEarO), zB = edgeZ(bMid, botEarTop), tabH = TE / cosD + 1;
    let pts = [[-AW, zB], [AW, zB], [HW, -52], [HW, 52], [AW, zT], [-AW, zT], [-HW, 52], [-HW, -52]];
    if (shockLobe) { const xs = shockLobe.ipPts.map(p => p[0]); pts = pts.concat(shockLobe.ipPts, [[Math.min(...xs), zB], [Math.max(...xs), zB]]); }
    const tabs = TAB.flatMap(([f0, f1]) => [{ axis: 'y', at: zT, from: f0, to: f1, h: tabH }, { axis: 'y', at: zB, from: f0, to: f1, h: -tabH }]);
    let outl = addTabs(hullPts(lobe ? pts.concat(...calH.map(h => circPts(h[0], h[1], 14))) : pts), tabs);
    if (shockLobe && shockLobe.notch) { // window up from the bottom edge where the toe link passes through the plate
      const { x0, x1, h } = shockLobe.notch, n = outl.length;
      for (let i = 0; i < n; i++) { const A = outl[i], B = outl[(i + 1) % n];
        if (Math.abs(A[1] - zB) < 1e-6 && Math.abs(B[1] - zB) < 1e-6 && Math.min(A[0], B[0]) <= x0 && Math.max(A[0], B[0]) >= x1) {
          const ins = A[0] < B[0] ? [[x0, zB], [x0, zB + h], [x1, zB + h], [x1, zB]] : [[x1, zB], [x1, zB + h], [x0, zB + h], [x0, zB]];
          outl = outl.slice(0, i + 1).concat(ins, outl.slice(i + 1)); shockLobe.notchOK = true; break; } }
    }
    const sh = polyShape(outl);
    sh.hole(0, 0, 36); sh.hole(0, UPR.BRG_BOLT / 2, 10.5); sh.hole(0, -UPR.BRG_BOLT / 2, 10.5);
    for (const sa of [webA, -webA]) for (const [c0, c1] of webC) sh.rectHole(sa, (c0 + c1) / 2, TP + SL, c1 - c0 + SL);
    if (lobe) calH.forEach(h => sh.hole(h[0], h[1], 8.4));
    if (shockLobe) shockLobe.ipSlots.forEach(([x, y, w, h]) => sh.rectHole(x, y, w, h));
    return { sh, zT, zB };
  };
  const OP = sidePlate(bOPo - TP / 2, true), IP = sidePlate(bIPi + TP / 2, false, SE);
  add('outboard plate', 'ST3', OP.sh, Wp(0, bOPo, 0), xw, zw, 'Square to the axle; carries the outboard flange bearing and PS-1 caliper lugs; tabs locate it in both ears; flip for the other side');
  add('inboard plate', 'ST3', IP.sh, Wp(0, bIPi + TP, 0), xw, zw, 'Square to the axle; carries the inboard flange bearing; tabs locate it in both ears');
  const b0 = bIPi + TP, b1 = bOPo - TP;
  const webTabs = webC.flatMap(([f0, f1]) => [{ axis: 'x', at: b1, from: f0, to: f1, h: TP }, { axis: 'x', at: b0, from: f0, to: f1, h: -TP }]);
  const webShape = () => polyShape(addTabs([[b0, -52], [b1, -52], [b1, 52], [b0, 52]], webTabs));
  add('front web', 'ST3', webShape(), Wp(webA - TP / 2, 0, 0), s, zw, 'Tabs key into both side plates; tack, check square, then weld');
  add('rear web', 'ST3', webShape(), Wp(-webA - TP / 2, 0, 0), s, zw, 'Tabs key into both side plates; tack, check square, then weld');
  // ears: coordinates (a along fwd, o along out) from the kingpin point on the ear plane
  const earCoord = (O, p) => [vdot(vsub(p, O), fwd), vdot(vsub(p, O), out)];
  const earFoot = (O, zSel) => {
    const pts = [], slots = [];
    for (const [b, zE] of [[bOPo, OP[zSel]], [bOPo - TP, OP[zSel]], [bIPi + TP, IP[zSel]], [bIPi, IP[zSel]]]) for (const xx of [-AW, AW]) pts.push(earCoord(O, Wp(xx, b, zE)));
    const os = pts.map(p => p[1]), oMin = Math.min(...os) - 6, oMax = Math.max(...os) + 6, as = pts.map(p => p[0]);
    const box = [[Math.min(...as), oMin], [Math.max(...as), oMin], [Math.max(...as), oMax], [Math.min(...as), oMax]];
    const sOut = Math.abs(vdot(s, out)) || 1, slotW = TP / sOut + TE * tanD + SL;
    for (const [bm, zE] of [[bOPo - TP / 2, OP[zSel]], [bIPi + TP / 2, IP[zSel]]]) for (const [f0, f1] of TAB) { const p0 = earCoord(O, Wp((f0 + f1) / 2, bm, zE)); slots.push([p0[0], p0[1], f1 - f0 + SL, slotW]); }
    return { box, slots };
  };
  const addSlots = (sh, slots) => { slots.forEach(([x, y, w, h]) => sh.rectHole(x, y, w, h)); return sh; };
  const TF = earFoot(topEarO, 'zT');
  const topEar = addSlots(hullShape(TF.box.concat(circPts(0, 0, TONG))), TF.slots); topEar.hole(0, 0, RE.hole);
  add('top ear', 'ST6', topEar, topEarO, fwd, out, `Upper A-arm rod end bolts on top with one ${RE.label} bolt along the kingpin (${sTop} mm spacer stack)`);
  const cT = vdot(vsub(g.OTR, g.LBJ), k), earTopC = sBot + ballH + TE, stackTie = cT - earTopC - ballH;
  const merged = st.forceMerge || (stackTie >= 0 && stackTie <= 30);
  const BF = earFoot(botEarO, 'zB'), [aT, bT] = earCoord(botEarO, g.OTR);
  const botEar = addSlots(hullShape(BF.box.concat(circPts(0, 0, TONG), merged ? circPts(aT, bT, 20) : [], SE ? SE.earPts.map(p => earCoord(botEarO, p)) : [])), BF.slots); botEar.hole(0, 0, RE.hole); if (merged) botEar.hole(aT, bT, RE.hole);
  if (SE) SE.earSlots.forEach(sl => { const [a, o] = earCoord(botEarO, sl.p); botEar.rectHole(a, o, sl.w, sl.h); });
  add(merged ? (ax === 'F' ? 'bottom ear and steering arm' : 'bottom ear and toe arm') : 'bottom ear', 'ST6', botEar, botEarO, fwd, out,
    `Lower A-arm rod end bolts underneath with one ${RE.label} bolt (${sBot} mm spacer stack)` + (merged ? `; ${ax === 'F' ? 'tie-rod' : 'toe-link'} rod end bolts on top with one bolt and a ${stackTie.toFixed(1)} mm spacer stack` : ''));
  if (SE) SE.plates.forEach(pl => add(pl.name, 'ST5', pl.sh, pl.origin, vmul(s, -1), zw, `3/16 in, ${SE.compact ? `tapered arm off the inboard plate (${SE.root.toFixed(0)} mm root), long tab keyed into it and fillet-welded both sides` : 'tabs key into the inboard plate and the bottom ear'}; ${SHOCK_GAP} mm gap for the shock eye, 8 mm (5/16 in) bolt fore-aft in double shear`));
  let armInfo = { merged, stack: merged ? stackTie : SPACER, armEarOverlap: false };
  if (!merged) {
    const armO = vsub(g.OTR, vmul(k, SPACER + ballH + TE)), [aa, bb] = earCoord(armO, g.OTR), AFt = earFoot(armO, 'zB');
    const arm = hullShape(AFt.box.concat(circPts(aa, bb, 20))); arm.hole(aa, bb, RE.hole);
    add(ax === 'F' ? 'steering arm' : 'toe arm', 'ST6', arm, armO, fwd, out, `${ax === 'F' ? 'Tie-rod' : 'Toe-link'} rod end bolts on top with one ${RE.label} bolt along the kingpin`);
    const cArm = cT - SPACER - ballH - TE; armInfo.c = cArm; armInfo.armEarOverlap = cArm < earTopC + 0.5 && cArm + TE > sBot + ballH - 0.5; armInfo.tieShift = earTopC + ballH + SPACER - cT;
  }
  // hub flange and rotor square to the axle (shape centered on the hub)
  const hub = discShape(HUB_D); hub.hole(0, 0, 25.6);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; hub.hole(50 * Math.cos(a), 50 * Math.sin(a), 12.5); const r = a + Math.PI / 4; hub.hole(38 * Math.cos(r), 38 * Math.sin(r), 6.6); }
  add('hub flange', 'ST6', hub, Wp(0, bH, 0), xw, zw, 'Weld square to the 25 mm shaft; 4 x 100 PCD for M12 x 1.5 studs, 4 x M6 rotor bolts on 76 PCD');
  const rot = discShape(ROT_D); rot.hole(0, 0, 52);
  for (let i = 0; i < 4; i++) { const r = i * Math.PI / 2 + Math.PI / 4; rot.hole(38 * Math.cos(r), 38 * Math.sin(r), 6.6); }
  const rDrill = ROT_D / 2 - 16; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8 + Math.PI / 16; rot.hole(rDrill * Math.cos(a), rDrill * Math.sin(a), 6.4); }
  add('brake rotor', 'ST5', rot, Wp(0, bH - TE, 0), xw, zw, `${ROT_D} mm x 4.76 mm, inside the PS-1 0.15-0.20 in range; surface grind flat and parallel after cutting`);
  const shaftLen = bH - (bIPi - UPR.BRG_PRO);
  const items = {
    bearings: [Wp(0, bOPo + UPR.BRG_PRO / 2, 0), Wp(0, bIPi - UPR.BRG_PRO / 2, 0)],
    shaft: [Wp(0, bIPi - UPR.BRG_PRO, 0), Wp(0, bH, 0)],
    caliper: Wp((Rm + 14) * Math.cos(th), bRot, (Rm + 14) * Math.sin(th)), calTh: th,
    frame: F, wheel: { xw, s, zw }
  };
  const plateKg = plates.reduce((s2, p) => s2 + p.shape.area() * p.t * PMAT[p.mat].rho, 0);
  const massKg = plateKg + 2 * UPR.BRG_KG + Math.PI * 12.5 * 12.5 * shaftLen * 7.85e-6 + UPR.CAL_KG + 0.25;
  const studEdge = HUB_D / 2 - 50 - 6.25, padInner = ROT_D / 2 - UPR.CAL_R_OFF - 2;
  // ear tongues vs the rotor's inboard face, measured along the axle
  const rotFace = bH - TE - ROT_T;
  const earMaxB = Math.max(...[[topEarO, topEar], [botEarO, botEar]].flatMap(([O, sh]) => sh.pts.map(([a, o]) => vdot(vsub(vadd(O, vadd(vmul(fwd, a), vmul(out, o))), WC), s))));
  const earRotGap = rotFace - earMaxB;
  const tieDelta = earTopC + ballH + SPACER + ((ax === 'F' ? P._tieExtraF : P._tieExtraR) || 0) - cT;
  return { plates, items, massKg, shaftLen, calSpacer: bRot - bOPo, armInfo, sTop, sBot, tieDelta, insetActual, ROT_D, HUB_D, studEdge, padInner, earRotGap, loc: { bH, bOPo, bIPi }, planes: { WC, xw, s, zw, k, bIPi, earTop: botEarTop }, shockEar: SE ? { hv: SE.hv, eu: SE.eu, eX: SE.eX, eZ: SE.eZ, gap: SE.gap, compact: SE.compact, root: SE.root, sigma: SE.sigma, straddle: !!SE.notch, notchOK: SE.notch ? !!SE.notchOK : true } : null };
}
/* ---------- fit check: A-arm rod ends, apex bungs, legs and links against the upright plates through bump and steer ---------- */
function pointInPoly(x, y, pts) { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; }
function distPoly(x, y, pts) { let m = 1e9; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [ax, ay] = pts[j], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2)); m = Math.min(m, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return m; }
function pointPlate(q, pl) {
  const d = vsub(q, pl.origin), x = vdot(d, pl.ux), y = vdot(d, pl.uy), z = vdot(d, pl.uz);
  const inside = pointInPoly(x, y, pl.pts), dxy = inside ? 0 : distPoly(x, y, pl.pts), dz = z < 0 ? -z : z > pl.t ? z - pl.t : 0;
  return inside && dz === 0 ? -Math.min(z, pl.t - z) : Math.hypot(dxy, dz);
}
function armUprightClear(g, u, apexOff, dRack, only) {
  const K = makeKin(g), lA = Math.hypot(g.LBJ.y - g.LIPr.y, g.LBJ.z - g.LIPr.z), th25 = 25 / lA;
  const F0 = uprightFrame(g.LBJ, g.UBJ, g.spin);
  const plates = u.plates.filter(p => !/rotor|hub/.test(p.name)).map(p => ({ origin: p.origin, ux: p.ux, uy: p.uy, uz: vcross(p.ux, p.uy), t: p.t, pts: p.shape.pts }));
  const dist = q => { let m = 1e9; for (const pl of plates) m = Math.min(m, pointPlate(q, pl)); return m; };
  const res = { upper: 1e9, lower: 1e9, tie: 1e9 };
  for (const dy of (dRack ? [0, -dRack, dRack] : [0])) for (const i of [-1, 0, 1]) {
    K.reset(); const st = K.state(th25 * i, dy), Fc = uprightFrame(st.LBJ, st.UBJ, st.spin);
    const toS = p => { const d = vsub(p, st.LBJ); return vadd(g.LBJ, vadd(vmul(F0.fwd, vdot(d, Fc.fwd)), vadd(vmul(F0.out, vdot(d, Fc.out)), vmul(F0.k, vdot(d, Fc.k))))); };
    const ring = (c0, n = 12) => { const e1 = vnorm(vcross(Fc.k, v(0, 0, 1)).x || vcross(Fc.k, v(0, 0, 1)).y ? vcross(Fc.k, v(0, 0, 1)) : v(1, 0, 0)), e2 = vcross(Fc.k, e1); return Array.from({ length: n }, (_, j) => vadd(c0, vadd(vmul(e1, 14 * Math.cos(2 * Math.PI * j / n)), vmul(e2, 14 * Math.sin(2 * Math.PI * j / n))))); };
    const seg = (a, b, n) => Array.from({ length: n + 1 }, (_, j) => vlerp(a, b, j / n));
    const arm = (B, pf, pr, key) => {
      const d = vnorm(vsub(vlerp(pf, pr, 0.5), B)), A = vadd(B, vmul(d, apexOff));
      let m = 1e9;
      ring(B).forEach(p => m = Math.min(m, dist(toS(p)) - 6.35));                       // rod-end housing (12.7 mm thick)
      seg(vadd(B, vmul(d, 14)), vadd(A, vmul(d, 14)), 6).forEach(p => m = Math.min(m, dist(toS(p)) - 13)); // shank, jam nut, apex bung
      for (const P2 of [pf, pr]) { const dl = vnorm(vsub(P2, A)); seg(vadd(A, vmul(dl, 14)), vadd(A, vmul(dl, 130)), 6).forEach(p => m = Math.min(m, dist(toS(p)) - 8)); }
      res[key] = Math.min(res[key], m);
    };
    if (!only || only === 'upper') arm(st.UBJ, g.UIPf, g.UIPr, 'upper');
    if (!only || only === 'lower') arm(st.LBJ, g.LIPf, g.LIPr, 'lower');
    if (only && only !== 'tie') continue;
    const dt = vnorm(vsub(st.ITR, st.OTR)); let m = 1e9;
    ring(st.OTR).forEach(p => m = Math.min(m, dist(toS(p)) - 6.35));
    seg(vadd(st.OTR, vmul(dt, 14)), vadd(st.OTR, vmul(dt, 110)), 6).forEach(p => m = Math.min(m, dist(toS(p)) - 9.5));
    res.tie = Math.min(res.tie, m);
  }
  return res;
}
function fitUpright(g, ax, P, RE, W, apexOff, dRack, minClr = 3, extra = {}) {
  let sTop = UPR.SPACER, sBot = UPR.SPACER, u, c;
  const fm = P.tieAuto !== false; // bottom ear doubles as the steering / toe arm; tie height follows it
  const eye = extra.shockEye, sd = extra.shockStraddle;
  if (extra.fixed) { u = uprightDesign(g, ax, P, RE, W, { ...extra.fixed, forceMerge: fm, shockEye: eye, shockStraddle: sd }); u.clear = armUprightClear(g, u, apexOff, dRack); return u; }
  const search = (key, set) => { let s = UPR.SPACER; for (; s <= 45; s += 1) { set(s); const uu = uprightDesign(g, ax, P, RE, W, { sTop, sBot, forceMerge: fm, shockEye: eye, shockStraddle: sd }); if (armUprightClear(g, uu, apexOff, dRack, key)[key] >= minClr) break; } return s; };
  sTop = search('upper', s => sTop = s); sBot = search('lower', s => sBot = s);
  u = uprightDesign(g, ax, P, RE, W, { sTop, sBot, forceMerge: fm, shockEye: eye, shockStraddle: sd }); c = armUprightClear(g, u, apexOff, dRack);
  u.clear = c; return u;
}
/* rod-end misalignment needed over +/-25 mm travel (outboard A-arm ends bolted along the kingpin; links free to roll) */
function rodEndMisalign(g) {
  const K = makeKin(g), lA = Math.hypot(g.LBJ.y - g.LIPr.y, g.LBJ.z - g.LIPr.z), th25 = 25 / lA;
  const axL = vnorm(vsub(g.LIPf, g.LIPr)), axU = vnorm(vsub(g.UIPf, g.UIPr));
  const k0 = vnorm(vsub(g.UBJ, g.LBJ));
  const nFor = (apex, pf, pr) => { const d = vnorm(vsub(vlerp(pf, pr, 0.5), apex)); return vnorm(vsub(k0, vmul(d, vdot(k0, d)))); };
  const nU0 = nFor(g.UBJ, g.UIPf, g.UIPr), nL0 = nFor(g.LBJ, g.LIPf, g.LIPr);
  const ang = (p0, p1, piv, axis) => { const a = vsub(p0, piv), b = vsub(p1, piv); const pa = vsub(a, vmul(axis, vdot(a, axis))), pb = vsub(b, vmul(axis, vdot(b, axis))); return Math.atan2(vdot(vcross(pa, pb), axis), vdot(pa, pb)); };
  let up = 0, lo = 0, tie = 0;
  for (let i = -6; i <= 6; i++) {
    const st = K.state(th25 * i / 6), k = vnorm(vsub(st.UBJ, st.LBJ));
    const nU = rot(nU0, axU, ang(g.UBJ, st.UBJ, g.UIPr, axU)), nL = rot(nL0, axL, ang(g.LBJ, st.LBJ, g.LIPr, axL));
    up = Math.max(up, Math.acos(Math.min(1, Math.abs(vdot(nU, k)))) * R2D); lo = Math.max(lo, Math.acos(Math.min(1, Math.abs(vdot(nL, k)))) * R2D);
    tie = Math.max(tie, Math.abs(Math.asin(vdot(vnorm(vsub(st.ITR, st.OTR)), k))) * R2D);
  }
  // inboard clevis bolts are turned square to each leg (in the plane holding the pivot axis), so only travel adds misalignment
  const X = vnorm(vsub(g.LIPf, g.LIPr)), legs = [[g.LBJ, g.LIPf, axL], [g.LBJ, g.LIPr, axL], [g.UBJ, g.UIPf, axU], [g.UBJ, g.UIPr, axU]];
  const bolts = legs.map(([bj, piv]) => { const d = vnorm(vsub(bj, piv)); return vnorm(vsub(X, vmul(d, vdot(X, d)))); });
  let inb = 0;
  legs.forEach(([bj, piv, axis], i) => { for (const t of [-th25, th25]) { const n = rot(bolts[i], axis, t); inb = Math.max(inb, Math.acos(Math.min(1, Math.abs(vdot(n, bolts[i])))) * R2D); } });
  const inbSplay = Math.max(...legs.map(([bj, piv]) => Math.abs(Math.asin(vnorm(vsub(bj, piv)).x)) * R2D));
  return { up, lo, tie, inb, inbSplay, bolts };
}
/* ---------- Main build ---------- */
function build(P0, fast = false) {
  const P = withShock(P0);
  // the tie-rod and toe-link heights follow the fitted bottom ears (two quick passes); turn off with tieAuto: false
  if (fast || P.tieAuto === false) { const M0 = buildOnce(P, fast); M0.P = P0; return M0; }
  let Q = P, M = buildOnce(Q, false);
  for (let pass = 0; pass < 4; pass++) {
    const uF = M.comp.upr.F, uR = M.comp.upr.R;
    const xF = uF.clear && uF.clear.tie < 3 ? 3.5 - uF.clear.tie : 0, xR = uR.clear && uR.clear.tie < 3 ? 3.5 - uR.clear.tie : 0; // grow the tie spacer if the link would touch
    const dF = uF.tieDelta + xF, dR = uR.tieDelta + xR;
    if (Math.abs(dF) < 0.5 && Math.abs(dR) < 0.5) break;
    Q = { ...Q, tieZF: Q.tieZF + dF, tieZR: Q.tieZR + dR, _tieExtraF: (Q._tieExtraF || 0) + xF, _tieExtraR: (Q._tieExtraR || 0) + xR }; M = buildOnce(Q, false);
  }
  M.tieAuto = { F: Q.tieZF, R: Q.tieZR }; M.P = P0; return M;
}
function buildOnce(P, fast = false) {
  const W = WHEELS[P.wheel], Rt = W.od / 2, std = TUBE_STD[P.std];
  const RE = { ...ROD_ENDS[P.rodSize || '3/8'], off: P.rodOff ?? 38 };
  const zb = P.rideH + std.C.od / 2, WB = P.wheelbase, xF = 0, xR = -WB;
  const checks = [];
  // FSAE rulebook items vs the builder's own engineering / fit / fabrication checks
  const RULE_AREAS = new Set(['Wheelbase', 'Track', 'Wheels', 'Tubing F.3.2.1', 'Main Hoop', 'Front Hoop', 'Main Hoop Braces', 'Front Hoop Braces', 'Rollover envelope', 'Front Bulkhead', 'Side Impact', 'Firewall', 'Harness', 'Suspension travel']);
  const ck = (status, area, text, value = '') => checks.push({ status, area, text, value, rule: RULE_AREAS.has(area) });
  /* powertrain */
  const csX = xR + P.chainCD, eRear = csX - ENGINE.csBack, eFront = eRear + ENGINE.L, eBot = zb + 28, csZ = eBot + ENGINE.csUp;
  const xMH = eFront + 70;
  /* driver: FSAE 95th percentile male template */
  const b = P.backAngle * D2R, sb = Math.sin(b), cb = Math.cos(b);
  const hipFwd = 490 * sb + 145, SEAT_SHELL = 6, seatFoam = P.seatFoam ?? 25, seatClr = P.seatClr ?? 12;
  // seat surface: the shell (plus its foam) sits clear above the cockpit floor tubes, center floor diagonal included
  const seatZ = zb + std.C.od / 2 + seatClr + SEAT_SHELL + seatFoam;
  const hip = v(xMH + hipFwd + (P.driverGap ?? 0), 0, seatZ + 100);
  const sh = v(hip.x - 490 * sb, 0, hip.z + 490 * cb), head = v(sh.x - 280 * sb, 0, sh.z + 280 * cb);
  const xPedal = hip.x + P.legReach;
  const ankle = v(xPedal - 85, 0, zb + 105), heel = v(xPedal - 120, 0, zb + 32), toe = v(xPedal + 115, 0, zb + 160);
  const knee = ik2(hip, ankle, 450, 470);
  const xFS1 = xF + P.spreadF, xFS2 = xF - P.spreadF, xRS1 = xR + P.spreadR, xRS2 = xR - P.spreadR;
  const xFB = Math.max(toe.x + 65, xFS1 + 200);
  /* steering wheel & front hoop */
  const colA = (P.colAngle ?? 34) * D2R, wheelR = 125;
  // wheel plane is square to the column, so its top leans forward by R sin(column angle); keep rim + clearance behind the hoop tube
  const rimFwd = wheelR * Math.sin(colA) + 13, clrW = P.wheelClr ?? 60;
  let wc = v(sh.x + P.wheelReach, 0, sh.z - 90);
  const xFH = Math.min(wc.x + rimFwd + clrW + 12.7, xFS2 - (P.fhGap ?? 70));
  if (wc.x + rimFwd + clrW + 12.7 > xFH) wc = v(xFH - rimFwd - clrW - 12.7, 0, wc.z);
  const reach = wc.x - sh.x;
  const wheelTop = wc.z + wheelR * Math.cos(colA) + 13, wheelBot = wc.z - wheelR * Math.cos(colA) - 13;
  const zFHt = wheelTop + (P.hoopTopClr ?? 50);
  const fhTopHW = P.fhTopHW ?? 230;
  const colDir = v(Math.cos(colA), 0, -Math.sin(colA));
  const UJ1 = vadd(wc, vmul(colDir, (xFH + 35 - wc.x) / Math.cos(colA)));
  /* suspension */
  const gainF = GAINS[P.gainF].deg, gainR = GAINS[P.gainR].deg;
  const fo = { x: xF, track: P.trackF, Rt, camber: P.camF, caster: P.casterF, kpi: P.kpi, kpOff: P.kpOff, bjUp: P.bjSpan / 2, bjLo: P.bjSpan / 2, rc: P.rcF, gainDeg: gainF, hwL: P.hwF, hwU: P.hwF - 15, spread: P.spreadF, tieZ: P.tieZF, armLen: P.armF, alpha: 0, itrY: P.rackMode === 'fixed' ? P.rackWidth / 2 : 0 };
  const ro = { x: xR, track: P.trackR, Rt, camber: P.camR, caster: 0, kpi: P.kpi, kpOff: P.kpOff, bjUp: P.bjSpan / 2, bjLo: P.bjSpan / 2, rc: P.rcR, gainDeg: gainR, hwL: P.hwR, hwU: P.hwR - 15, spread: P.spreadR, tieZ: P.tieZR, armLen: 75, alpha: 0 };
  const yk0 = P.trackF / 2 - P.kpOff;
  fo.alpha = fast ? Math.atan(yk0 / WB) : optimizeAlpha(fo, WB, P.ackTarget / 100);
  const gF = axleGeom(fo), gR = axleGeom(ro); gF.apexOff = gR.apexOff = P.bjOff;
  let kin = null, steer = null;
  if (!fast) {
    kin = { F: travelSweep(gF), R: travelSweep(gR) };
    const sw = steerSweep(gF, WB);
    const dRack = interpAt(sw.pts, 'di', P.maxSteer, 'd');
    const dOut = interpAt(sw.pts, 'di', P.maxSteer, 'dout');
    const Rout = WB / Math.sin(dOut * D2R) + (P.trackF - sw.tk) / 2;
    const turns = 2 * dRack / P.rackCF;
    steer = { sw, dRack, dOut, Rout, turns, ratio: (360 * dRack / P.rackCF) / ((P.maxSteer + dOut) / 2), ack20: ackPct(sw, 20), alphaDeg: fo.alpha * R2D, rackLen: 2 * gF.ITR.y, trLen: vlen(vsub(gF.OTR, gF.ITR)), rackDriven: P.rackMode !== 'fixed' };
  }
  /* main hoop height from rollover envelope */
  const FHTp = { x: xFH, z: zFHt };
  let zMHt = head.z + 160;
  for (; zMHt < head.z + 900; zMHt += 2) {
    const T = { x: xMH, z: zMHt }, dx = FHTp.x - T.x, dz = FHTp.z - T.z, L = Math.hypot(dx, dz);
    const dist = Math.abs((head.x - T.x) * dz - (head.z - T.z) * dx) / L;
    const below = head.z < T.z + (head.x - T.x) * dz / dx;
    // braces run rearward: the helmet must also stay 50 mm from the line main hoop top -> lower end of the braces (RS1 upper node)
    const Bb = { x: xR + P.spreadR + 45, z: gR.zU }, bx = Bb.x - T.x, bz = Bb.z - T.z, distB = Math.abs((head.x - T.x) * bz - (head.z - T.z) * bx) / Math.hypot(bx, bz);
    const aheadB = head.x > T.x + (head.z - T.z) * bx / bz; // head on the cockpit side of the brace line
    if (below && dist >= 200 && aheadB && distB >= 200) break;
  }
  const zSH = sh.z - 20;
  /* nodes */
  const N = {};
  const set = (k, p) => { N[k] = p; N[k + '*'] = vmir(p); };
  set('FB_L', v(xFB, 150, zb)); set('FB_U', v(xFB, 150, zb + (P.fbH ?? 310)));
  // pickup rails sit inboard of the pivot by the clevis-tab standoff (hole height + saddle depth)
  const STAND = TAB_STAND(std.C.od);
  // frame stations sit NODE_OFF away from the A-arm pivots so each clevis pair welds to plain rail, clear of the tube cluster at a node
  const NODE_OFF = 45, xRack = Math.min(xFS1 - 40, Math.max(xFS2 + 40, gF.ITR.x));
  const xFS1n = xFS1 + NODE_OFF, xFS2n = Math.min(xFS1 - 40, xRack + NODE_OFF); // front box rear station sits ahead of the rack, the rack has its own floor cross
  set('FS1_L', v(xFS1n, P.hwF - STAND, gF.zL)); set('FS1_U', v(xFS1n, P.hwF - 15 - STAND, gF.zU));
  set('FS2_L', v(xFS2n, P.hwF - STAND, gF.zL)); set('FS2_U', v(xFS2n, P.hwF - 15 - STAND, gF.zU));
  set('RK_L', v(xRack, P.hwF - STAND, gF.zL));
  const xFS3n = xFS2 - 40; // aft station: straight rails run past the rear front pivots before turning to the front hoop
  set('FS3_L', v(xFS3n, P.hwF - STAND, gF.zL)); set('FS3_U', v(xFS3n, P.hwF - 15 - STAND, gF.zU));
  set('FH_B', v(xFH, 240, zb)); set('FH_S', v(xFH, Math.max(248, fhTopHW), P.sisZ)); set('FH_T', v(xFH, fhTopHW, zFHt));
  const onSeg = (a, c, z) => vlerp(a, c, (z - a.z) / (c.z - a.z));
  // column support: V-hanger from the front hoop top corners down to a bearing node above the column, in the hoop plane (nothing below the wheel)
  const colZatFH = wc.z - Math.tan(colA) * (xFH - wc.x);
  N.CS = v(xFH, 0, colZatFH + 38 + 12.7);
  set('MH_B', v(xMH, 250, zb)); set('MH_S', v(xMH, 255, P.sisZ)); set('MH_T', v(xMH, 190, zMHt));
  const zBR = zMHt - 100, zH = Math.min(zBR - 40, Math.max(P.sisZ + 40, zSH));
  set('MH_H', onSeg(N.MH_S, N.MH_T, zH)); set('MH_BR', onSeg(N.MH_S, N.MH_T, zBR));
  const xRS1n = xRS1 + NODE_OFF, xRS2n = xRS2 - NODE_OFF, xTL = Math.min(xRS1 - 40, Math.max(xRS2 + 40, gR.ITR.x));
  set('RS1_L', v(xRS1n, P.hwR - STAND, gR.zL)); set('RS1_U', v(xRS1n, P.hwR - 15 - STAND, gR.zU));
  set('RS2_L', v(xRS2n, P.hwR - STAND, gR.zL)); set('RS2_U', v(xRS2n, P.hwR - 15 - STAND, gR.zU));
  set('TL_L', v(xTL, P.hwR - STAND, gR.zL)); set('TL_U', v(xTL, P.hwR - 15 - STAND, gR.zU)); // toe-link post at the toe-link inner pivot
  // rear coilover: lower eye on the upright, top eye on a triangulated tower over the upper rail (solved before the members so the tower joins the rear box)
  // coilovers — solved before the frame members so a tower (if chosen) can join the frame.
  // Rear lower eye: on the upright beside the toe link (default) or on the lower arm; front lower eye: through-bolt through both lower-arm legs (default) or web + clevis.
  const rearLow = P.rearShock === 'arm' ? 'web' : (P.rearShock ?? 'upright'), rearTop = P.rearShockTop ?? 'tab';
  const frontLow = P.frontShockLow ?? 'bolt', frontTop = P.frontShockTop ?? 'tab';
  const rearUp = rearLow === 'upright';
  const hsObs = [[v(xR, 80, Rt), vadd(gR.WC, vmul(gR.spin, -70)), 32, 'halfshaft and CV boots']];
  const tabRange = (lo, hi, ban) => ({ xMin: lo, xMax: hi, ban });
  const rangeR = { xMin: xR - P.spreadR + 40, xMax: xR + P.spreadR - 40 }, rangeF = { xMin: Math.max(xFS2n + 30, xF - P.spreadF + 40), xMax: Math.min(xFS1n - 30, xF + P.spreadF - 40) };
  const baseR = { len: P.shockLenR, mr: P.mrR, sLen: P.springLenR ?? P.springLen ?? 100, bodyEnd: P._shockR?.bodyEnd, rail: { y: N.TL_U.y, z: N.TL_U.z }, railL: { y: N.TL_L.y, z: N.TL_L.z }, third: N.TL_U, top: rearTop === 'tower' ? 'tower' : 'tabs',
    out: P.towerOutR ?? 140, tubeR: std.C.od / 2, fast, apexOff: P.bjOff, maxReach: P.tabReachMax ?? 90, xMin: rearTop === 'tower' ? -1e9 : rangeR.xMin, xMax: rearTop === 'tower' ? xR + P.spreadR - 45 : rangeR.xMax };
  let shR = null, uprPreR = null, uprFinR = null;
  if (rearUp) {
    const pl0 = uprightDesign(gR, 'R', P, RE, W).planes, Wp0 = (x, b, z) => vadd(pl0.WC, vadd(vmul(pl0.xw, x), vadd(vmul(pl0.s, b), vmul(pl0.zw, z))));
    const xToe0 = vdot(vsub(gR.OTR, pl0.WC), pl0.xw), exP = xToe0 - 40, kz = vdot(pl0.zw, pl0.k), base = Wp0(exP, pl0.bIPi - 40, 0), ez0 = (36 - vdot(vsub(base, pl0.earTop), pl0.k)) / kz; // provisional eye for the spacer fit
    const linkMode0 = (P.rearEyeSide ?? 'link') === 'link', ezL = ((vdot(vsub(gR.OTR, pl0.earTop), pl0.k) + 9.5 + 34) - vdot(vsub(Wp0(xToe0, pl0.bIPi - 60, 0), pl0.earTop), pl0.k)) / kz;
    const prov = linkMode0 ? { shockEye: Wp0(xToe0, pl0.bIPi - 60, ezL), shockStraddle: { gap: 32 } } : { shockEye: Wp0(exP, pl0.bIPi - 40, ez0) };
    uprPreR = fast ? uprightDesign(gR, 'R', P, RE, W) : fitUpright(gR, 'R', P, RE, W, P.bjOff, 0, 3, prov);
    const pl = uprPreR.planes, cvA = vadd(pl.WC, vmul(pl.s, pl.bIPi - UPR.BRG_PRO)), cvB = vadd(pl.WC, vmul(pl.s, pl.bIPi - UPR.BRG_PRO - 55));
    const exU = [...hsObs, [cvA, cvB, 45, 'outer CV joint']]; exU.tireHalfW = W.w / 2 + 6;
    const ban = x => rearTop !== 'tower' && Math.abs(x - xTL) < 30; // tab pair keeps clear of the toe-link post node
    const solveR = planes => { const r = solveShockTower(gR, { ...baseR, eyeMode: 'upright', extra: exU, planes, exMax: P.spreadR - 45, ban, toeSide: false, straddle: linkMode, hvLink: linkMode ? sdOf(planes).linkTop + 12 + 12 + 4 : 24, saW: P._saW ?? 60, euMax: P._euMax ?? 112 }); return r; };
    const linkMode = (P.rearEyeSide ?? 'link') === 'link';
    const sdOf = planes => linkMode ? { gap: 32, linkTop: vdot(vsub(gR.OTR, planes.earTop), planes.k) + 9.5 } : null; // toe-link top above the bottom ear
    const fitR = (eye, fixed) => { const sd = linkMode ? { gap: 32 } : null; return fast ? uprightDesign(gR, 'R', P, RE, W, { shockEye: eye, shockStraddle: sd }) : fitUpright(gR, 'R', P, RE, W, P.bjOff, 0, 3, fixed ? { shockEye: eye, shockStraddle: sd, fixed } : { shockEye: eye, shockStraddle: sd }); };
    shR = solveR(pl);
    if (shR.Lm) { // the real ear can change the lower spacer stack (and so the ear plane): refit, re-solve on the new planes, then lock the stack
      uprFinR = fitR(shR.Lm);
      if (uprFinR.sBot !== uprPreR.sBot || uprFinR.sTop !== uprPreR.sTop) { const s2 = solveR(uprFinR.planes); if (s2.Lm) { shR = s2; uprFinR = fitR(shR.Lm, { sTop: uprFinR.sTop, sBot: uprFinR.sBot }); } }
    }
  } else { const exA = [...hsObs]; exA.tireHalfW = W.w / 2 + 6; shR = solveShockTower(gR, { ...baseR, eyeMode: rearLow, extra: exA, ban: x => rearTop !== 'tower' && Math.abs(x - xTL) < 30 }); }
  const tower = rearTop === 'tower' && shR && shR.Lm;
  if (tower) { set('SH_L', shR.SHL); set('SH_U', shR.SHU); set('ST', shR.ST); }
  const exT = []; exT.tireHalfW = W.w / 2 + 6;
  const shF = solveShockTower(gF, { eyeMode: frontLow, len: P.shockLenF, mr: P.mrF, sLen: P.springLen ?? 100, bodyEnd: P._shock?.bodyEnd, rail: { y: N.FS1_U.y, z: N.FS1_U.z }, railL: { y: N.FS1_L.y, z: N.FS1_L.z }, third: N.FS2_U,
    top: frontTop === 'tower' ? 'tower' : 'tabs', maxReach: P.tabReachMax ?? 90, out: P.towerOutF ?? 140, extra: exT, tubeR: std.C.od / 2, fast, apexOff: P.bjOff, legGrow: 3.5,
    xMin: frontTop === 'tower' ? Math.max(xFS2n + 40, xF - P.spreadF + 45) : rangeF.xMin, xMax: frontTop === 'tower' ? Math.min(xFS1n - 40, xF + P.spreadF - 45) : rangeF.xMax });
  const towerF = frontTop === 'tower' && shF && shF.Lm;
  if (towerF) { set('SF_L', shF.SHL); set('SF_U', shF.SHU); set('SFT', shF.ST); }
  /* members */
  const members = [];
  const add = (a, b, cat, name, side) => members.push({ a, b, cat, name, side });
  const S = (a, b, cat, name) => { add(a, b, cat, name, 'L'); add(a + '*', b + '*', cat, name, 'R'); };
  const X = (a, cat, name) => add(a, a + '*', cat, name, 'C');
  // front bulkhead
  S('FB_L', 'FB_U', 'B', 'Front bulkhead upright'); X('FB_L', 'B', 'Front bulkhead lower'); X('FB_U', 'B', 'Front bulkhead upper');
  add('FB_L', 'FB_U*', 'B', 'Front bulkhead diagonal', 'C');
  // bulkhead support + front suspension box
  S('FB_L', 'FS1_L', 'C', 'Lower front rail');
  if (towerF) { S('FS1_L', 'SF_L', 'C', 'Lower rail, pickup span front'); S('SF_L', 'FS2_L', 'C', 'Lower rail, pickup span rear'); } else S('FS1_L', 'FS2_L', 'C', 'Lower rail, pickup span'); S('FS2_L', 'RK_L', 'C', 'Lower rail to rack station'); S('RK_L', 'FS3_L', 'C', 'Lower rail, rear pickup span'); S('FS3_L', 'FH_B', 'C', 'Lower rail to front hoop');
  S('FB_U', 'FS1_U', 'C', 'Upper front rail');
  if (towerF) { S('FS1_U', 'SF_U', 'C', 'Upper rail, pickup span front'); S('SF_U', 'FS2_U', 'C', 'Upper rail, pickup span rear'); } else S('FS1_U', 'FS2_U', 'C', 'Upper rail, pickup span'); S('FS2_U', 'FS3_U', 'C', 'Upper rail, rear pickup span'); S('FS3_U', 'FH_S', 'C', 'Upper rail to front hoop');
  S('FS1_L', 'FS1_U', 'C', 'Front pickup upright'); S('FS2_L', 'FS2_U', 'C', 'Rear pickup upright'); S('FS3_L', 'FS3_U', 'C', 'Front box aft post');
  S('FS2_U', 'FS3_L', 'C', 'Rear pickup box diagonal'); // F.1.17: every bay of the front bulkhead support is a triangle (runs high past the steering tie rods)
  S('FB_L', 'FS1_U', 'C', 'Nose side diagonal');
  if (towerF) {
    S('FS1_L', 'SF_U', 'C', 'Pickup box diagonal'); S('SF_L', 'FS2_U', 'C', 'Pickup box diagonal, rear'); S('SF_L', 'SF_U', 'C', 'Front shock tower post');
    S('SF_U', 'SFT', 'C', 'Front shock tower, upper leg'); S('SF_L', 'SFT', 'C', 'Front shock tower, lower leg'); S('FS2_U', 'SFT', 'C', 'Front shock tower, rear leg');
  } else S('FS1_L', 'FS2_U', 'C', 'Pickup box diagonal'); S('FH_B', 'FS3_U', 'C', 'Front hoop side diagonal');
  X('FS1_L', 'C', 'Front pickup floor cross'); X('RK_L', 'C', 'Rack support cross'); X('FS2_L', 'C', 'Front box rear floor cross'); const shinAt = (x) => { const t = (x - knee.x) / (ankle.x - knee.x); return knee.z + t * (ankle.z - knee.z) + 56; };
  // no lateral tube over the driver's legs at the front pickup station; a top diagonal from the bulkhead corner, over the feet, ties the box instead
  const topCross = false; add('FB_U', 'FS1_U*', 'C', 'Nose top diagonal', 'C');
  const noseDiagGap = (() => { let g = 1e9; const a = N.FB_U, b = N['FS1_U*']; for (let i = 0; i <= 20; i++) { const q = vlerp(a, b, i / 20); if (q.x > ankle.x + 150) continue; const L = q.x >= ankle.x ? { z: Math.max(ankle.z + 56, toe.z + 30) } : { z: shinAt(q.x) }; g = Math.min(g, q.z - std.C.od / 2 - L.z); } return g; })();
  // front hoop bracing, side impact
  S('FH_T', 'FB_U', 'B', 'Front hoop brace');
  X('FH_B', 'C', 'Front hoop floor cross');
  add('FH_T', 'CS', 'C', 'Column hanger', 'L'); add('FH_T*', 'CS', 'C', 'Column hanger', 'R');
  S('FH_S', 'MH_S', 'B', 'Upper side impact'); S('FH_B', 'MH_B', 'B', 'Lower side impact'); S('FH_B', 'MH_S', 'B', 'Side impact diagonal');
  add('FH_B', 'MH_B*', 'C', 'Cockpit floor diagonal', 'C');
  // main hoop & bracing
  X('MH_H', 'A', 'Shoulder harness bar'); X('MH_B', 'C', 'Main hoop floor cross');
  S('MH_BR', 'RS1_U', 'B', 'Main hoop brace');
  S('MH_B', 'RS1_L', 'C', 'Rear lower rail'); S('MH_S', 'RS1_U', 'C', 'Rear upper rail'); S('RS1_L', 'RS1_U', 'C', 'Brace support upright'); S('MH_B', 'RS1_U', 'C', 'Engine bay diagonal');
  if (tower) { // shock station splits the rear box ahead of the halfshaft; the bay the halfshaft passes through stays open
    S('RS1_L', 'SH_L', 'C', 'Rear box lower, front'); S('SH_L', 'TL_L', 'C', 'Rear box lower, middle'); S('RS1_U', 'SH_U', 'C', 'Rear box upper, front'); S('SH_U', 'TL_U', 'C', 'Rear box upper, middle');
    S('SH_L', 'SH_U', 'C', 'Rear shock tower post'); S('RS1_L', 'SH_U', 'C', 'Rear box diagonal, front');
    S('SH_U', 'ST', 'C', 'Rear shock tower, upper leg'); S('SH_L', 'ST', 'C', 'Rear shock tower, lower leg'); S('TL_U', 'ST', 'C', 'Rear shock tower, rear leg');
  } else { S('RS1_L', 'TL_L', 'C', 'Rear box lower, front'); S('RS1_U', 'TL_U', 'C', 'Rear box upper, front'); S('RS1_L', 'TL_U', 'C', 'Rear box diagonal, front'); }
  S('TL_L', 'RS2_L', 'C', 'Rear box lower, rear'); S('TL_U', 'RS2_U', 'C', 'Rear box upper, rear');
  S('TL_L', 'TL_U', 'C', 'Toe-link post'); S('RS2_L', 'RS2_U', 'C', 'Rear bulkhead upright'); S('TL_L', 'RS2_U', 'C', 'Rear box diagonal, rear');
  X('RS1_L', 'C', 'Rear pickup floor cross'); X('RS1_U', 'C', 'Brace support top cross'); X('RS2_L', 'C', 'Rear bulkhead lower'); X('RS2_U', 'C', 'Rear bulkhead upper');
  add('RS2_L', 'RS2_U*', 'C', 'Rear bulkhead diagonal', 'C');
  const hoops = [
    { id: 'FH', name: 'Front hoop', cat: 'A', pts: ['FH_B*', 'FH_S*', 'FH_T*', 'FH_T', 'FH_S', 'FH_B'] },
    { id: 'MH', name: 'Main hoop', cat: 'A', pts: ['MH_B*', 'MH_S*', 'MH_H*', 'MH_BR*', 'MH_T*', 'MH_T', 'MH_BR', 'MH_H', 'MH_S', 'MH_B'] }
  ];
  // hoops are bent on HOOP_CLR: a tube that ends at a real bend meets the arc, not the sharp polyline corner
  const bendFix = [];
  for (const h of hoops) for (let i = 1; i < h.pts.length - 1; i++) {
    const k = h.pts[i], p = N[k], u1 = vnorm(vsub(N[h.pts[i - 1]], p)), u2 = vnorm(vsub(N[h.pts[i + 1]], p));
    const turn = Math.PI - Math.acos(Math.max(-1, Math.min(1, vdot(u1, u2)))), off = HOOP_CLR * (1 / Math.cos(turn / 2) - 1);
    if (off < 1 || !members.some(m => m.a === k || m.b === k)) continue;
    const bis = vnorm(vadd(u1, u2)), mid = vadd(p, vmul(bis, off)), tan = vnorm(vsub(u2, u1));
    const ka = k.endsWith('*') ? k.slice(0, -1) + 'a*' : k + 'a';
    N[ka] = mid; N[ka + 'p'] = vsub(mid, vmul(tan, 40)); N[ka + 'q'] = vadd(mid, vmul(tan, 40));
    members.forEach(m => { if (m.a === k) m.a = ka; if (m.b === k) m.b = ka; });
    bendFix.push({ k, ka, off, turn });
  }
  /* ---- copes ---- */
  const PRIO = { hoop: 0, A: 1, B: 2, C: 3 };
  const segs = [];
  members.forEach((m, i) => segs.push({ a: m.a, b: m.b, prio: PRIO[m.cat], idx: i, od: std[m.cat].od }));
  hoops.forEach((h, hi) => { for (let i = 0; i < h.pts.length - 1; i++) segs.push({ a: h.pts[i], b: h.pts[i + 1], prio: 0, idx: -1 - hi * 20 - i, od: std.A.od, hoop: h.id }); });
  bendFix.forEach((b, i) => { segs.push({ a: b.ka + 'p', b: b.ka, prio: 0, idx: -100 - 2 * i, od: std.A.od, hoop: 'bend' }, { a: b.ka, b: b.ka + 'q', prio: 0, idx: -101 - 2 * i, od: std.A.od, hoop: 'bend' }); }); // local tangent of the bent hoop, for copes only
  const inc = {};
  segs.forEach(s => { (inc[s.a] = inc[s.a] || []).push(s); (inc[s.b] = inc[s.b] || []).push(s); });
  const rank = s => s.prio * 1000 + (s.idx < 0 ? -500 - s.idx : s.idx);
  function throughFor(seg, node) {
    const list = (inc[node] || []).filter(s => s !== seg);
    if (!list.length) return null;
    const a = vnorm(vsub(N[seg.a === node ? seg.b : seg.a], N[node]));
    let best = null;
    for (const s of list) {
      const d = vnorm(vsub(N[s.a === node ? s.b : s.a], N[node]));
      if (Math.abs(vdot(a, d)) > 0.985) continue;
      if (!best || rank(s) < rank(best)) best = s;
    }
    if (!best || rank(best) > rank(seg)) return null;
    return best;
  }
  const NT = 72;
  function tubeProfile(seg, r, R1, R2, b1, b2) {
    const n1 = N[seg.a], n2 = N[seg.b], dvec = vsub(n2, n1), Lc = vlen(dvec), a = vmul(dvec, 1 / Lc);
    let e1 = vcross(a, v(0, 0, 1)); if (vlen(e1) < 0.2) e1 = vcross(a, v(0, 1, 0)); e1 = vnorm(e1); const e2 = vcross(a, e1);
    const sF = (ax, bdir, w, R) => {
      if (!bdir) return 0; let bb = bdir, c = vdot(ax, bb); if (c < 0) { bb = vmul(bb, -1); c = -c; }
      const q = 1 - c * c; if (q < 0.03) return 0; const k = vdot(w, bb);
      const disc = Math.max(0, k * k + q * (R * R - r * r)); return (c * k + Math.sqrt(disc)) / q;
    };
    const s1 = [], s2 = [];
    for (let i = 0; i < NT; i++) {
      const th = 2 * Math.PI * i / NT, w = vadd(vmul(e1, r * Math.cos(th)), vmul(e2, r * Math.sin(th)));
      s1.push(sF(a, b1, w, R1)); s2.push(sF(vmul(a, -1), b2, w, R2));
    }
    return { n1, n2, a, e1, e2, Lc, s1, s2 };
  }
  const segDir = (s, node) => s ? vnorm(vsub(N[s.b], N[s.a])) : null;

  /* ---- coilovers ---- */
  const railF = { y: P.hwF - 15 - STAND, z: gF.zU }, railR = { y: P.hwR - 15 - STAND, z: gR.zU };
  const frameObs = members.map(m => [N[m.a], N[m.b], std[m.cat].od / 2, m.name.toLowerCase()]);
  hoops.forEach(hh => { for (let i = 0; i < hh.pts.length - 1; i++) frameObs.push([N[hh.pts[i]], N[hh.pts[i + 1]], std.A.od / 2, hh.name.toLowerCase()]); });
  const obsFor = ax => { const ex = frameObs.filter(([a, b, r, nm]) => (a.y > 0 || b.y > 0) && !/shock tower/.test(nm)); if (ax === 'R') ex.push(...hsObs); ex.tireHalfW = W.w / 2 + 6; return ex; };
  const exF = obsFor('F'), exR = obsFor('R');
  // lower-arm legs: size up any arm that carries the coilover so it survives a 3 g bump
  const Fy = P.mat === '1020' ? 350 : 460, allowS = 0.67 * Fy, armLo = { F: std.arm, R: std.arm }, armBend = {};
  for (const [ax, sh, g] of [['F', shF, gF], ['R', shR, gR]]) {
    const Fw = DESIGN.kg * 9.81 * DESIGN.g * (ax === 'F' ? DESIGN.front : 1 - DESIGN.front) / 2;
    if (!sh.Lm || sh.onUpright) { armBend[ax] = { Fw, M: 0, sigma: 0, tube: std.arm, none: true }; continue; }
    let nA = vnorm(vcross(vsub(g.LIPf, g.LBJ), vsub(g.LIPr, g.LBJ))); if (nA.z < 0) nA = vmul(nA, -1);
    const r = lowerArmBending(g, sh.lowMode === 'bolt' ? sh.Lm : vsub(sh.Lm, vmul(nA, SHOCK_LOW_UP)), Fw, P.bjOff);
    let tube = std.arm; for (const t of [std.arm, ...ARM_UP[P.std]]) { tube = t; if (r.M / tubeZ(t) <= allowS) break; }
    armLo[ax] = tube; armBend[ax] = { Fw, M: r.M, Fs: r.Fs, sigma: r.M / tubeZ(tube), sigma0: r.M / tubeZ(std.arm), tube, allow: allowS };
  }
  // lower shock mount: a laser-cut web plate in the plane of the lower arm, welded between both legs,
  // with a 3/16 in clevis pair that tab-and-slots into it, square to the arm pivot line (shock bolt parallel to the pivots)
  for (const [sh, g] of [[shF, gF], [shR, gR]]) if (sh.Lm && sh.lowMode === 'web') {
    const lipM = vlerp(g.LIPf, g.LIPr, 0.5), A = vadd(g.LBJ, vmul(vnorm(vsub(lipM, g.LBJ)), P.bjOff));
    let n = vnorm(vcross(vsub(g.LIPf, g.LBJ), vsub(g.LIPr, g.LBJ))); if (n.z < 0) n = vmul(n, -1);
    const X = vnorm(vsub(g.LIPf, g.LIPr)), r = (g === gF ? armLo.F : armLo.R).od / 2;
    const foot = vsub(sh.Lm, vmul(n, SHOCK_LOW_UP)), Qc = foot;                 // shock eye projected onto the leg plane
    const e1 = vnorm(vsub(lipM, A)), e2 = vnorm(vcross(n, e1));
    const legPt = (Pp, t) => vadd(A, vmul(vsub(Pp, A), t));
    const tOf = q => vdot(vsub(q, A), e1) / vdot(vsub(lipM, A), e1);
    const tm = tOf(Qc), legLen = vlen(vsub(g.LIPf, A)), dt = 42 / legLen;
    const t1 = Math.max((RE.bungOD / 2 + 16) / legLen, tm - dt), t2 = tm + dt;     // keep clear of the apex bung weld
    const inward = (Pp, Po) => { const d = vnorm(vsub(Pp, A)); let m = vnorm(vcross(n, d)); if (vdot(m, vsub(Po, Pp)) < 0) m = vmul(m, -1); return m; };
    const nF = inward(g.LIPf, g.LIPr), nR = inward(g.LIPr, g.LIPf);
    const corners = [vadd(legPt(g.LIPf, t1), vmul(nF, r)), vadd(legPt(g.LIPf, t2), vmul(nF, r)), vadd(legPt(g.LIPr, t2), vmul(nR, r)), vadd(legPt(g.LIPr, t1), vmul(nR, r))];
    const to2 = p => [vdot(vsub(p, Qc), e1), vdot(vsub(p, Qc), e2)];
    // clevis plates: normal to X, standing on the web, holes on the shock eye
    const tdir = vnorm(vcross(n, X)), ext = vcross(tdir, n), sgnE = vdot(ext, X) > 0 ? 1 : -1;
    const g2 = SHOCK_GAP / 2, top = vadd(foot, vmul(n, SHOCK_WEB_T / 2));
    const tabs = [g2, -g2 - SHOCK_TAB_T].map(off => ({ origin: vadd(top, vmul(X, sgnE > 0 ? off : off + SHOCK_TAB_T)), ux: tdir, uy: n }));
    const web = polyShape(corners.map(to2));
    for (const off of [g2 + SHOCK_TAB_T / 2, -g2 - SHOCK_TAB_T / 2]) { const cxy = to2(vadd(Qc, vmul(X, off))); for (const tx of [-7, 7]) { const p2 = to2(vadd(vadd(Qc, vmul(X, off)), vmul(tdir, tx))); web.rectHole(p2[0], p2[1], Math.abs(vdot(tdir, e1)) > 0.7 ? 8.3 : SHOCK_TAB_T + 0.3, Math.abs(vdot(tdir, e1)) > 0.7 ? SHOCK_TAB_T + 0.3 : 8.3); } }
    sh.mount = { web, webOrigin: vsub(Qc, vmul(n, SHOCK_WEB_T / 2)), e1, e2, n, tabs, span: vlen(vsub(corners[0], corners[3])) };
  }
  // through-bolt lower mount: the bolt runs along the pivot axis through weld-in sleeves in both lower-arm legs; the eye sits between on spacers
  for (const [ax, sh, g] of [['F', shF, gF], ['R', shR, gR]]) if (sh.Lm && sh.lowMode === 'bolt') {
    const X = vnorm(vsub(g.LIPf, g.LIPr)), lipM = vlerp(g.LIPf, g.LIPr, 0.5), A = vadd(g.LBJ, vmul(vnorm(vsub(lipM, g.LBJ)), P.bjOff)), lt = armLo[ax];
    const hit = Pp => { // bolt line E + X t meets the leg A->Pp (both in the arm plane)
      const d = vnorm(vsub(Pp, A)), w = vsub(sh.Lm, A), b = vdot(X, d), den = 1 - b * b, tB = (b * vdot(w, d) - vdot(w, X)) / den, sL = vdot(w, d) + b * tB;
      const sinT = Math.sqrt(Math.max(0.05, den)); return { t: tB, p: vadd(A, vmul(d, sL)), along: sL, sinT, len: lt.od / sinT + 2 };
    };
    const hF = hit(g.LIPf), hR = hit(g.LIPr);
    const spF = hF.t - lt.od / 2 / hF.sinT - EYE_W / 2, spR = -hR.t - lt.od / 2 / hR.sinT - EYE_W / 2;
    sh.bolt = { a: vadd(sh.Lm, vmul(X, hR.t - hR.len / 2 - 4)), b: vadd(sh.Lm, vmul(X, hF.t + hF.len / 2 + 10)), legs: [hF, hR], spF, spR, X,
      boltLen: (hF.t + hF.len / 2) - (hR.t - hR.len / 2) + 14, legTube: lt };
  }
  const shockInfo = { F: shF, R: shR, stroke: P.shockStroke, spec: P._shock, specR: P._shockR || P._shock, fox: FOX, springTop: P._shock ? springTop(P._shock) : 0, springTopR: springTop(P._shockR || P._shock || SHOCKS['dhx-210x55']) };
  for (const [sh, g, ex] of [[shF, gF, exF], [shR, gR, exR]]) {
    if (!sh.Lm) continue;
    const Kc = makeKin(g), lA = Math.hypot(g.LBJ.y - g.LIPr.y, g.LBJ.z - g.LIPr.z), th25 = 25 / lA;
    let worst = { gap: 1e9 }; const lens = [];
    for (const th of [0, th25, -th25]) { const st = Kc.state(th); st.th = th; Kc.reset(); const r = shockClear(sh, g, st, ex); lens.push(r.len); if (r.gap < worst.gap) worst = r; }
    sh.clear = worst; sh.travel = Math.max(...lens) - Math.min(...lens); sh.bump = lens[0] - Math.min(...lens); sh.droop = Math.max(...lens) - lens[0];
  }
  /* ---- parts ---- */
  const parts = []; let tid = 1, pid = 1, sid = 1, hid = 1;
  const groups = {};
  members.forEach((m, i) => {
    const seg = segs[i], t1 = throughFor(seg, m.a), t2 = throughFor(seg, m.b), tube = std[m.cat];
    const pr = tubeProfile(seg, tube.od / 2, t1 ? t1.od / 2 : 0, t2 ? t2.od / 2 : 0, segDir(t1), segDir(t2));
    const lens = pr.s1.map((s, k) => pr.Lc - s - pr.s2[k]);
    const cut = Math.max(...lens), avg = lens.reduce((x, y) => x + y, 0) / lens.length;
    m.prof = pr; m.cut = cut; m.avg = avg; m.copes = (t1 && Math.max(...pr.s1) > 0.5 ? 1 : 0) + (t2 && Math.max(...pr.s2) > 0.5 ? 1 : 0);
    m.thr = [t1 && Math.max(...pr.s1) > 0.5 ? { b: segDir(t1), R: t1.od / 2 } : null, t2 && Math.max(...pr.s2) > 0.5 ? { b: segDir(t2), R: t2.od / 2 } : null];
    const key = m.cat + '|' + m.name;
    if (groups[key]) { groups[key].qty++; groups[key].members.push(i); m.part = groups[key].id; return; }
    const id = 'T' + String(tid++).padStart(2, '0');
    const p = { id, kind: 'tube', cat: m.cat, name: m.name, qty: 1, tube, members: [i], cut, avg, copes: m.copes, mirror: m.side !== 'C' };
    groups[key] = p; parts.push(p); m.part = id;
  });
  hoops.forEach(h => {
    const pts = h.pts.map(k => N[k]); const CLR = HOOP_CLR;
    let straight = 0, dev = 0; const bends = [];
    for (let i = 0; i < pts.length - 1; i++) straight += vlen(vsub(pts[i + 1], pts[i]));
    dev = straight; let along = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      along += vlen(vsub(pts[i], pts[i - 1]));
      const d1 = vnorm(vsub(pts[i], pts[i - 1])), d2 = vnorm(vsub(pts[i + 1], pts[i]));
      const beta = Math.acos(Math.min(1, Math.max(-1, vdot(d1, d2))));
      if (beta < 0.5 * D2R) continue;
      dev += -2 * CLR * Math.tan(beta / 2) + CLR * beta;
      bends.push({ node: h.pts[i], deg: beta * R2D, at: along });
    }
    // straight lengths between bends (and at the ends) once each bend's tangent run is taken out: the bender needs HOOP_MIN_STRAIGHT
    const tl = []; for (let i = 1; i < pts.length - 1; i++) { const d1 = vnorm(vsub(pts[i], pts[i - 1])), d2 = vnorm(vsub(pts[i + 1], pts[i])), be = Math.acos(Math.min(1, Math.max(-1, vdot(d1, d2)))); tl.push(be < 0.5 * D2R ? 0 : CLR * Math.tan(be / 2)); }
    const straights = []; let run = 0; // merge segments across collinear nodes: only real bends split a straight
    for (let i = 0; i < pts.length - 1; i++) { run += vlen(vsub(pts[i + 1], pts[i])) - (i > 0 ? tl[i - 1] : 0) - (i < pts.length - 2 ? tl[i] : 0); if (i === pts.length - 2 || tl[i] > 0) { straights.push(run); run = 0; } }
    const id = 'H' + hid++;
    const p = { id, kind: 'hoop', cat: 'A', name: h.name, qty: 1, tube: std.A, hoop: h, pts, cut: dev, avg: dev, bends, CLR, straights, minStraight: Math.min(...straights), copes: 0, mirror: false };
    parts.push(p); h.part = id;
  });
  /* suspension & steering tubes */
  const susp = [];
  const legs = (g, ax) => {
    const sd = (ax === 'F' ? 'Front' : 'Rear');
    return [
      [g.LBJ, g.LIPf, `${sd} lower arm, front leg`], [g.LBJ, g.LIPr, `${sd} lower arm, rear leg`],
      [g.UBJ, g.UIPf, `${sd} upper arm, front leg`], [g.UBJ, g.UIPr, `${sd} upper arm, rear leg`],
      [g.OTR, g.ITR, ax === 'F' ? 'Tie rod' : 'Rear toe link']
    ];
  };
  // A-arm legs weld to one apex bung; a single rod end screws into the bung and bolts to the upright (one ball per arm)
  const APEX_COPE = RE.bungOD / 2 - 1; // leg long point coped onto the apex bung, measured from the bung axis
  const apexOf = (bj, pf, pr) => vadd(bj, vmul(vnorm(vsub(vlerp(pf, pr, 0.5), bj)), P.bjOff));
  for (const [ax, g] of [['F', gF], ['R', gR]]) {
    for (const [p1, p2, name] of legs(g, ax)) {
      const lower = /lower/.test(name), isLink = /Tie|toe/.test(name), tube = isLink ? std.steer : lower ? armLo[ax] : std.arm;
      const outer = isLink ? p1 : (lower ? apexOf(g.LBJ, g.LIPf, g.LIPr) : apexOf(g.UBJ, g.UIPf, g.UIPr));
      let Lc = vlen(vsub(outer, p2)), offA = isLink ? RE.off : APEX_COPE, offB = RE.off;
      let cut = Lc - offA - offB, prof = null, thr1 = null, avgCut = cut;
      if (!isLink) {
        // cope the leg end onto the apex bung (axis = rod-end shank direction); the second leg copes onto the first where they would overlap
        const bj = lower ? g.LBJ : g.UBJ, bungAx = vnorm(vsub(bj, outer)), dl = vnorm(vsub(p2, outer)), r = tube.od / 2, Rb = RE.bungOD / 2;
        thr1 = { b: bungAx, R: Rb };
        if (/rear leg/.test(name)) {
          const pf = lower ? g.LIPf : g.UIPf, dF = vnorm(vsub(pf, outer));
          const sinB = Math.sqrt(Math.max(1e-6, 1 - vdot(dl, bungAx) ** 2)), q = vadd(outer, vmul(dl, (Rb + r) / sinB));
          const sep = vlen(vsub(vsub(q, outer), vmul(dF, vdot(vsub(q, outer), dF))));
          if (sep < 2 * r + 1) thr1 = { b: dF, R: r, onLeg: true };
        }
        const n2 = vsub(p2, vmul(dl, offB)), Lt = vlen(vsub(n2, outer)), e1 = perp(dl), e2 = vcross(dl, e1), s1 = [];
        for (let k2 = 0; k2 < 72; k2++) { const thA = 2 * Math.PI * k2 / 72, w = vadd(vmul(e1, r * Math.cos(thA)), vmul(e2, r * Math.sin(thA))); s1.push(copeS(dl, thr1.b, w, thr1.R, r)); }
        const lens = s1.map(sv => Lt - sv);
        cut = Math.max(...lens); avgCut = lens.reduce((x, y) => x + y, 0) / lens.length; offA = Math.min(...s1);
        prof = { n1: outer, n2, a: dl, e1, e2, Lc: Lt, s1, s2: s1.map(() => 0) };
      }
      const id = 'S' + String(sid++).padStart(2, '0');
      parts.push({ id, kind: 'stube', cat: isLink ? 'steer' : 'arm', name, qty: 2, tube, cut, avg: avgCut, copes: isLink ? 0 : 1, mirror: true, ends: [outer, p2], offA, offB, prof, thr1, note: isLink ? `Square cut; threaded inserts + ${RE.label} rod ends both ends, ${RE.off} mm ball center to tube face` : (thr1 && thr1.onLeg ? 'Outboard: coped onto the front leg beside the apex bung (cluster weld)' : 'Outboard: coped onto the apex bung (drawing M01)') + ` (one ${RE.label} rod end per arm, ${P.bjOff} mm ball center to bung center). Inboard: threaded insert + ${RE.label} rod end, ${RE.off} mm ball center to tube face` });
      susp.push({ a: p1, b: p2, id, link: isLink, ax, offA, offB, apex: !isLink, lower });
    }
  }
  for (const [ax, sh, nm] of [['F', shF, 'Front'], ['R', shR, 'Rear']]) if (sh.Lm && sh.bolt) {
    const b = sh.bolt, mk = (name, len, c, note) => { const id = 'S' + String(sid++).padStart(2, '0'); parts.push({ id, kind: 'stube', cat: 'arm', name, qty: 2, tube: BOLT_SLV, cut: len, avg: len, copes: 0, mirror: true, ends: [vsub(c, vmul(b.X, len / 2)), vadd(c, vmul(b.X, len / 2))], offA: 0, offB: 0, note }); return id; };
    const [hF, hR] = b.legs;
    b.ids = [mk(`${nm} shock bolt sleeve, front leg`, hF.len, hF.p, `Weld-through sleeve for the 5/16 in shock bolt: pierce the front leg ${hF.along.toFixed(0)} mm from the bung center along the leg (Ø12.8 hole, both walls, square to the arm pivot line), slide in, weld both sides`),
      mk(`${nm} shock bolt sleeve, rear leg`, hR.len, hR.p, `Weld-through sleeve for the 5/16 in shock bolt: pierce the rear leg ${hR.along.toFixed(0)} mm from the bung center along the leg, square to the arm pivot line, weld both sides`),
      mk(`${nm} shock bolt spacer, front`, Math.max(2, b.spF), vadd(sh.Lm, vmul(b.X, EYE_W / 2 + Math.max(2, b.spF) / 2)), 'Loose spacer on the bolt between the shock eye and the front-leg sleeve (square cut, deburr)'),
      mk(`${nm} shock bolt spacer, rear`, Math.max(2, b.spR), vsub(sh.Lm, vmul(b.X, EYE_W / 2 + Math.max(2, b.spR) / 2)), 'Loose spacer on the bolt between the shock eye and the rear-leg sleeve (square cut, deburr)')];
    for (const [legNm, h] of [['front leg', hF], ['rear leg', hR]]) { const lp = parts.find(p => p.name === `${nm} lower arm, ${legNm}`); if (lp) lp.note += `. Shock bolt sleeve through this leg ${h.along.toFixed(0)} mm from the bung center (Ø12.8 cross hole along the pivot axis)`; }
  }
  const UJ2 = v(xRack + (P.pinionFwd ?? 60), 0, gF.ITR.z + 45); // angled-pinion input sits forward of the rack tube
  const colParts = [[wc, UJ1, 'Steering column, upper'], [UJ1, UJ2, 'Steering intermediate shaft']];
  for (const [a, c, name] of colParts) {
    const id = 'S' + String(sid++).padStart(2, '0'), Lc = vlen(vsub(a, c));
    parts.push({ id, kind: 'stube', cat: 'steer', name, qty: 1, tube: std.steer, cut: Lc - 40, avg: Lc - 40, copes: 0, mirror: false, ends: [a, c], offA: 20, offB: 20, note: 'Square cut; weld to splined U-joint yokes / QR hub' });
  }
  /* ---- turned parts ---- */
  const bungMass = Math.PI / 4 * (RE.bungOD ** 2 - RE.tap ** 2) * RE.bungL * 7.85e-6;
  parts.push({ id: 'M01', kind: 'turned', name: 'A-arm apex bung', qty: 8, cat: 'turned', od: RE.bungOD, bore: RE.tap, len: RE.bungL, thread: RE.thread, tapName: RE.tapName, cut: RE.bungL, avg: RE.bungL, mass: bungMass, copes: 0, mirror: false,
    size: `Ø${RE.bungOD.toFixed(2)} × ${RE.bungL} mm`, note: `One per A-arm. ${RE.thread} through, both arm legs cope onto the OD and weld; the outboard rod end screws in with a jam nut. Buy as a weld-in threaded bung of the same size, or turn from 4130 or 1018 bar.` });
  /* ---- plates ---- */
  const plates = [];
  const plate = (name, mat, qty, shape, where, note = '') => { const id = 'P' + String(pid++).padStart(2, '0'); const p = { id, kind: 'plate', name, mat, qty, shape, where, note }; plates.push(p); parts.push(p); return p; };
  // inboard clevis pairs: each pair turns square to its arm leg, so each pivot gets its own tab (height and saddle follow the turn)
  const misF = rodEndMisalign(gF), misR = rodEndMisalign(gR), clevis = { F: [], R: [] };
  const pivNames = ['lower arm front', 'lower arm rear', 'upper arm front', 'upper arm rear'];
  for (const [ax, ms] of [['F', misF], ['R', misR]]) ms.bolts.forEach((b0, i) => {
    let uy = vnorm(vcross(b0, v(0, 0, 1))); if (uy.y < 0) uy = vmul(uy, -1);
    const hHole = (TAB_STAND(std.C.od) - TAB_SADDLE(std.C.od)) / Math.abs(uy.y), stretch = 1 / Math.max(0.5, Math.abs(b0.x));
    const turn = Math.acos(Math.min(1, Math.abs(b0.x))) * R2D;
    // the two plates of a turned pair sit at different points along the rail, so each needs its own hole height to seat on the tube
    const ext = vcross(v(0, 0, 1), uy), plates2 = [];
    for (const c of [RE.gap / 2 + 3.175 / 2, -RE.gap / 2 - 3.175 / 2]) {
      const h = hHole + ext.y * c / uy.y, fore = ext.x * c > 0;
      const p = plate(`${ax === 'F' ? 'Front' : 'Rear'} clevis tab, ${pivNames[i]} pivot, ${fore ? 'front' : 'rear'} plate`, 'ST3', 2, tabShapeE(32, h + 16, RE.hole, std.C.od, stretch), `${ax === 'F' ? 'Front' : 'Rear'} ${pivNames[i]} pickup, ${fore ? 'forward' : 'rearward'} plate of the pair, one each side`,
        `Turned ${turn.toFixed(1)}° from square to the rail; hole ${h.toFixed(1)} mm above the saddle (its partner is ${(Math.abs(2 * ext.y * c / uy.y)).toFixed(1)} mm ${h > hHole ? 'shorter' : 'taller'}, so both seat on the tube); ${RE.label} bolt, ${RE.hole} mm hole, ${RE.gap.toFixed(1)} mm clevis gap`);
      plates2.push({ id: p.id, h, c });
    }
    clevis[ax].push({ id: plates2[0].id, hHole, uy, plates: plates2 });
  });
  // toe-link tabs: horizontal pair on the rear bulkhead upright, reaching to the toe-link inner pivot
  const tU = onSeg(N.TL_L, N.TL_U, gR.ITR.z), tD = v(gR.ITR.x - tU.x, gR.ITR.y - tU.y, 0), tDist = vlen(tD);
  const toeTabH = Math.max(45, tDist + 16 - TAB_SADDLE(std.C.od));
  const toeTab = { base: tU, dir: vnorm(tD), dist: tDist, h: toeTabH };
  plate('Rear toe-link tab', 'ST3', 4, tabShape(32, toeTabH, RE.hole, std.C.od), 'Toe-link post, horizontal pair', 'Double shear, bolt vertical, rod end between tabs');

  for (const [ax, sh, nm] of [['F', shF, 'Front'], ['R', shR, 'Rear']]) {
    if (!sh.Lm) continue;
    if (sh.ST) { // top clevis: two plates sandwich the tower node, the eye hangs below it between them
      const T0 = sh.ST, rel = p => [p.y - T0.y, p.z - T0.z], u2 = rel(sh.U), tr = std.C.od / 2, pts = [...circPts(u2[0], u2[1], 16), ...circPts(0, 0, tr + 8)];
      for (const q of [sh.SHU, sh.SHL]) { const d = vnorm(vsub(q, T0)), dn = [-d.z, d.y]; for (const sg of [1, -1]) pts.push([d.y * 60 + dn[0] * (tr + 4) * sg, d.z * 60 + dn[1] * (tr + 4) * sg]); }
      const tc = hullShape(pts); tc.hole(u2[0], u2[1], 8.4);
      const gapT = std.C.od + 0.4;
      sh.top = { gap: gapT, plates: [T0.x + gapT / 2, T0.x - gapT / 2 - SHOCK_TAB_T].map(x => ({ origin: v(x, T0.y, T0.z), ux: v(0, 1, 0), uy: v(0, 0, 1) })) };
      const tp = plate(`${nm} shock tower clevis`, 'ST5', 4, tc, `${nm} shock tower node, a pair each side sandwiching the tubes`, `3/16 in, ${gapT.toFixed(1)} mm apart (tube OD); weld along both tower legs; shock eye between them with ${((gapT - 20) / 2).toFixed(1)} mm spacers each side, 8 mm (5/16 in) bolt fore-aft in double shear`);
      sh.topId = tp.id;
    } else
    plate(`${nm} shock chassis tab`, sh.h > 70 ? 'ST5' : 'ST3', 4, tabShape(32, sh.h - TAB_SADDLE(std.C.od) + 16, 8.4, std.C.od), `${nm} upper rail, pair each side straddling the shock eye`, `Hole ${sh.h.toFixed(0)} mm above rail center for ${P.shockLenF && ax === 'F' ? P.shockLenF : P.shockLenR} mm installed length; 8 mm (5/16 in) bolt`);
    if (sh.mount) {
      const wp = plate(`${nm} lower arm shock web`, 'ST3', 2, sh.mount.web, `${nm} lower A-arm, between the legs in the arm plane`, `Fillet-weld both edges to the legs, both sides; ${sh.mount.span.toFixed(0)} mm between legs; slots locate the shock clevis`);
      const cl = new Shape(), w = 28, hh = SHOCK_HOLE_H + w / 2;   // flat base with two locating tabs that drop into the web slots
      cl.start(-w / 2, 0).line(-11, 0).line(-11, -SHOCK_WEB_T).line(-3, -SHOCK_WEB_T).line(-3, 0).line(3, 0).line(3, -SHOCK_WEB_T).line(11, -SHOCK_WEB_T).line(11, 0).line(w / 2, 0)
        .line(w / 2, hh - w / 2).arc(0, hh - w / 2, w / 2, 0, Math.PI).close(); cl.hole(0, SHOCK_HOLE_H, 8.4);
      const cp = plate(`${nm} shock lower clevis`, 'ST5', 4, cl, `${nm} lower arm shock web, pair each side`, `3/16 in plates, ${SHOCK_GAP} mm gap for the shock eye and spacers, 8 mm (5/16 in) bolt in double shear parallel to the arm pivots`);
      sh.webId = wp.id; sh.clevisId = cp.id;
    }
  }
  /* ---- build jigs: the center section's floor tubes sit straight on a flat build table; cross-car laser-cut jig plates
     standing on the same table cradle the raised first layer of the front and rear sections at their true height ---- */
  const jigs = { table: zb - std.B.od / 2, stations: [], spars: [], t: 4.763 };
  if ((P.buildJigs ?? 'yes') === 'yes') {
    const tz = jigs.table, JT = 4.763, NOTCH_CLR = 0.4, SHOULDER = 16;
    const lowZ = Math.max(gF.zL, gR.zL) + 5;
    const layer = members.filter(m => Math.max(N[m.a].z, N[m.b].z) <= lowZ && Math.abs(vnorm(vsub(N[m.b], N[m.a])).x) > 0.3);
    const raised = layer.filter(m => Math.max(N[m.a].z, N[m.b].z) > tz + std.C.od / 2 + 20); // needs support off the table
    // stations: every raised tube gets one plate near each end, held WELD mm off every joint so the clusters stay open for welding
    const WELD = 40, NEAR = 130;
    const ban = [...Object.keys(N).filter(k => N[k].z <= lowZ && Math.abs(N[k].y) < 400).map(k => [N[k].x, WELD]), ...[gF.LIPf, gF.LIPr, gR.LIPf, gR.LIPr].map(p => [p.x, WELD + 20])]; // arm pivot clevis tabs stand ~20 mm either side of the pivot
    const okX = x => ban.every(([bx, r]) => Math.abs(x - bx) >= r);
    // a "tube" is a straight run: collinear members welded end to end along one line are cut and jigged as one bar
    const dirOf = m => vnorm(vsub(N[m.b], N[m.a])), tubesL = [], seen = new Set();
    for (const m of raised.filter(m => m.side !== 'R')) { if (seen.has(m)) continue; const run = [m]; seen.add(m);
      for (let grew = true; grew;) { grew = false; for (const q of raised) if (q.side !== 'R' && !seen.has(q) && run.some(r => (r.a === q.a || r.a === q.b || r.b === q.a || r.b === q.b) && Math.abs(vdot(dirOf(r), dirOf(q))) > 0.999)) { run.push(q); seen.add(q); grew = true; } }
      tubesL.push({ run, name: run.length > 1 ? run[0].name.replace(/,.*$/, '') + ' (straight run)' : m.name, x0: Math.min(...run.flatMap(r => [N[r.a].x, N[r.b].x])), x1: Math.max(...run.flatMap(r => [N[r.a].x, N[r.b].x])) }); }
    const wins = [];
    for (const t of tubesL) { const { x0, x1 } = t, L = x1 - x0, mid = (x0 + x1) / 2;
      if (L < 2 * WELD + 40) wins.push({ t, lo: mid - 10, hi: mid + 10, one: true });
      else wins.push({ t, lo: x0 + WELD, hi: Math.min(x0 + WELD + NEAR, mid - 15), cap: mid - 15 }, { t, lo: Math.max(x1 - WELD - NEAR, mid + 15), hi: x1 - WELD, cap: mid + 15 }); }
    // fewest plates that put one inside every window (interval stabbing); inside a window take the spot with the most room to the
    // nearest joint or arm-pivot tab (anything >= WELD counts as full room, then nearest the tube end)
    const room = x => Math.min(...ban.map(([bx, r]) => Math.abs(x - bx) - (r - WELD)));
    wins.sort((p, q) => p.hi - q.hi);
    const xs = [];
    for (const w of wins) {
      if (xs.some(x => x >= w.lo && x <= w.hi)) continue;
      const span = w.cap === undefined ? [w.lo, w.hi] : [Math.min(w.lo, w.cap), Math.max(w.hi, w.cap)], endX = w.cap === undefined ? (w.lo + w.hi) / 2 : (w.cap > w.lo ? w.lo : w.hi);
      let best = null;
      for (let x = span[0]; x <= span[1] + 1e-6; x += 2.5) { if (xs.some(y => Math.abs(y - x) < 30)) continue;
        const sc = Math.min(room(x), WELD) * 1000 - Math.abs(x - endX); if (!best || sc > best.sc) best = { x, sc }; }
      const x = best ? best.x : (w.lo + w.hi) / 2; xs.push(x); w.lo = Math.min(w.lo, x); w.hi = Math.max(w.hi, x);
    }
    xs.sort((p, q) => q - p);
    jigs.weldGap = Math.min(...xs.map(room)); jigs.weldAt = xs.reduce((b, x) => room(x) < room(b) ? x : b, xs[0]);
    jigs.perTube = tubesL.map(t => { const w = wins.filter(q => q.t === t); return { name: t.name, need: w.length, have: w.filter(q => xs.some(x => x >= q.lo && x <= q.hi)).length }; });
    const SPAR_H = 50, SLOT = 25, sw = (JT + 0.3) / 2;
    // 1. section of the first layer at each station
    const data = [];
    xs.forEach(x => {
      const tubes = [];
      for (const m of raised) { const a = N[m.a], b = N[m.b]; if ((x - a.x) * (x - b.x) >= 0) continue;
        const d = vnorm(vsub(b, a)), c = vadd(a, vmul(d, (x - a.x) / d.x)), od = std[m.cat].od, r = od / 2 + NOTCH_CLR;
        tubes.push({ u: c.y, v: c.z - tz, r, k: Math.abs(1 / d.x), dyz: vnorm(v(0, d.y, d.z)), name: m.name }); }
      if (tubes.length < 2) return;
      tubes.sort((p, q) => q.u - p.u); // right to left along the top edge
      const notch = t => { // section of the tube in the plate plane: ellipse, major along the tube's in-plane direction
        const e1 = t.dyz.y || t.dyz.z ? [t.dyz.y, t.dyz.z] : [0, 1], e2 = [-e1[1], e1[0]], A = t.r * t.k, B = t.r;
        const all = []; for (let i = 0; i < 96; i++) { const th = 2 * Math.PI * i / 96; all.push([t.u + A * Math.cos(th) * e1[0] + B * Math.sin(th) * e2[0], t.v + A * Math.cos(th) * e1[1] + B * Math.sin(th) * e2[1]]); }
        // walk the ellipse in parameter order through its lowest point, keeping the part below the center line (no x-sorting zigzags)
        let lo = 0; all.forEach((p, i) => { if (p[1] < all[lo][1]) lo = i; });
        const run = [all[lo]]; for (let k = 1; k < 96; k++) { const p = all[(lo + k) % 96]; if (p[1] > t.v - 0.5) break; run.push(p); }
        const back = []; for (let k = 1; k < 96; k++) { const p = all[(lo - k + 96) % 96]; if (p[1] > t.v - 0.5) break; back.push(p); }
        let pts = back.reverse().concat(run); if (pts[0][0] < pts[pts.length - 1][0]) pts.reverse();
        const w = Math.max(...all.filter(p => p[1] <= t.v).map(p => Math.abs(p[0] - t.u)));
        return { pts, w, depth: t.v - Math.min(...pts.map(p => p[1])) };
      };
      data.push({ x, tubes, ns: tubes.map(notch), front: x > xMH });
    });
    // 2. one pair of longitudinal spars per section: a common line just inboard of the outer tubes at every station
    for (const front of [true, false]) {
      const g = data.filter(d => d.front === front); if (!g.length) continue;
      const ys = Math.min(...g.map(d => Math.min(d.tubes[0].u - d.ns[0].w, -(d.tubes[d.tubes.length - 1].u + d.ns[d.tubes.length - 1].w)))) - 32;
      const xsG = g.map(d => d.x).sort((p, q) => q - p), dirC = front ? -1 : 1; // toward the center section
      // table-level tubes the spar line crosses: a snug arch from below drops over each, registering the spar to the center section
      const flat = members.filter(m => Math.max(N[m.a].z, N[m.b].z) <= tz + std[m.cat].od / 2 + 20 && !raised.includes(m));
      const cross = []; for (const m of flat) for (const yl of [ys, -ys]) { const p = N[m.a], q = N[m.b]; if ((p.y - yl) * (q.y - yl) >= 0) continue; const t = (yl - p.y) / (q.y - p.y), d = vnorm(vsub(q, p)), od = std[m.cat].od;
        if (!cross.some(c => c.m === m && Math.abs(c.x - (p.x + t * (q.x - p.x))) < 1)) cross.push({ x: p.x + t * (q.x - p.x), hw: (od / 2 + 0.6) / Math.max(0.3, Math.abs(d.y)), rv: od / 2 + 0.6, h: od + 0.6, name: m.name, m }); }
      // both spars are cut identical, so each carries the arches for both sides' crossings (one of each pair simply has no tube in it)
      const inner = front ? xsG[xsG.length - 1] : xsG[0], OVER = 160;
      const caught = cross.filter(c => (c.x - inner) * dirC > 25).sort((p, q) => (p.x - q.x) * dirC);
      // hook over the hoop floor cross at the edge of the center section and stop 1/2 in past it
      const hoopX = front ? xFH : xMH, hook = caught.filter(c => Math.abs(c.x - hoopX) < 60).sort((p, q) => Math.abs(p.x - hoopX) - Math.abs(q.x - hoopX))[0];
      const end = hook ? hook.x + dirC * (hook.hw + 12.7) : inner + dirC * OVER, far = (front ? xsG[0] : xsG[xsG.length - 1]) - dirC * 25;
      const xa = Math.max(end, far), xb = Math.min(end, far);
      let arches = cross.filter(c => c.x - c.hw > xb + 10 && c.x + c.hw < xa - 10).sort((p, q) => p.x - q.x);
      for (let i = 0; i + 1 < arches.length; i++) { const p = arches[i], q = arches[i + 1]; if (q.x - q.hw < p.x + p.hw + 12) { const l = p.x - p.hw, r = Math.max(p.x + p.hw, q.x + q.hw); arches.splice(i, 2, { ...p, x: (l + r) / 2, hw: (r - l) / 2, rv: Math.max(p.rv, q.rv), h: Math.max(p.h, q.h), name: p.name === q.name ? p.name : p.name + ' / ' + q.name }); i--; } }
      // outline: bottom edge left to right with arches, right end, top edge right to left with plate slots
      const pts = [[xb, 0]];
      for (const c of arches.sort((p, q) => p.x - q.x)) { const r = c.hw, n = 12; pts.push([c.x - r, 0]); for (let i = 0; i <= n; i++) { const th = Math.PI - Math.PI * i / n; pts.push([c.x + r * Math.cos(th), c.h - c.rv + c.rv * Math.sin(th)]); } pts.push([c.x + r, 0]); }
      pts.push([xa, 0], [xa, SPAR_H]);
      for (const x of xsG) pts.push([x + sw, SPAR_H], [x + sw, SPAR_H - SLOT], [x - sw, SPAR_H - SLOT], [x - sw, SPAR_H]);
      pts.push([xb, SPAR_H]);
      g.arches = arches;
      const sp = polyShape(pts), sname = front ? 'front' : 'rear';
      const spar = plate(`Build jig spar, ${sname}`, 'ST5', 2, sp, `Build table, ${sname} section: one each side, ${ys.toFixed(0)} mm from the centerline, along the car`,
        `Tooling. Slots drop over every ${sname} jig plate (egg-crate, self-squaring). Arches over ${arches.length ? [...new Set(arches.map(c => c.name.toLowerCase()))].join(', ') : 'nothing'}; the inboard end hooks over the ${hook ? hook.name.toLowerCase() : 'center section'} and stops 1/2 in past it, so it registers off the center section; clamp the spars to the table`);
      g.forEach(d => d.spar = { ys, id: spar.id });
      jigs.spars.push({ id: spar.id, ys, x0: xb, x1: xa, front, hook: hook ? hook.name : null, arches: arches.map(c => ({ x: c.x, hw: c.hw, h: c.h, name: c.name })), over: (inner - (front ? xb : xa)) * (front ? 1 : -1) });
    }
    // 3. the jig plates, slotted from below where the spars cross
    data.forEach((d, si) => {
      const { x, tubes, ns, front } = d, ys = d.spar.ys;
      const valley = Math.max(SPAR_H, Math.min(...tubes.map((t, i) => t.v - ns[i].depth)) - 22);
      const u1 = tubes[0].u + ns[0].w + SHOULDER + 10, u0 = tubes[tubes.length - 1].u - ns[tubes.length - 1].w - SHOULDER - 10;
      const pts = [[u0, 0], [-ys - sw, 0], [-ys - sw, SLOT], [-ys + sw, SLOT], [-ys + sw, 0], [-4, 0], [0, 4], [4, 0], // spar slots; small V at the car centerline for the table datum line
        [ys - sw, 0], [ys - sw, SLOT], [ys + sw, SLOT], [ys + sw, 0], [u1, 0], [u1, tubes[0].v]];
      tubes.forEach((t, i) => {
        const n = ns[i]; pts.push([t.u + n.w + SHOULDER, t.v], [t.u + n.w, t.v], ...n.pts, [t.u - n.w, t.v], [t.u - n.w - SHOULDER, t.v]);
        if (i < tubes.length - 1) { const nx = tubes[i + 1], nn = ns[i + 1], lo = Math.min(t.v, nx.v), roomU = t.u - n.w - SHOULDER - 30 > nx.u + nn.w + SHOULDER + 30;
          if (roomU && valley < lo - 10) pts.push([t.u - n.w - SHOULDER - 25, valley], [nx.u + nn.w + SHOULDER + 25, valley]);
          else if (roomU && lo < SPAR_H + 12) pts.push([t.u - n.w - SHOULDER - 25, SPAR_H + 15], [nx.u + nn.w + SHOULDER + 25, SPAR_H + 15]); } // tubes near the table: raise the web between them so the spar slots keep material above
      });
      pts.push([u0, tubes[tubes.length - 1].v]);
      const sh = polyShape(pts); // CCW: base left to right, up the right end, top edge right to left
      const ref = front ? `${(x - xFH).toFixed(0)} mm ahead of the front hoop base` : `${(xMH - x).toFixed(0)} mm behind the main hoop base`;
      const hMax = Math.max(...tubes.map(t => t.v));
      const p = plate(`Build jig, ${front ? 'front' : 'rear'} station ${si + 1}`, 'ST5', 1, sh, `Build table, square across the car ${ref} (tube centerlines)`,
        `Tooling, not part of the car. Stands on the table, V-notch on the table centerline; cradles ${tubes.map(t => t.name.toLowerCase()).filter((n, i, a) => a.indexOf(n) === i).join(' and ')} at true height (${hMax.toFixed(0)} mm max above the table). Slots from below lock onto the two ${front ? 'front' : 'rear'} spars.`);
      jigs.stations.push({ x, id: p.id, tubes: tubes.map(t => ({ u: t.u, v: t.v })), ys });
    });
    // spars must stay clear of every first-layer tube that dips below their top edge
    jigs.sparClear = 1e9;
    for (const sp of jigs.spars) for (const m of layer) { const a = N[m.a], b = N[m.b]; if (sp.arches.some(c => c.name.split(' / ').includes(m.name))) continue;
      for (let i = 0; i <= 40; i++) { const q = vlerp(a, b, i / 40); if (q.x < sp.x0 || q.x > sp.x1) continue; if (q.z - tz - std[m.cat].od / 2 > SPAR_H + 3) continue;
        for (const sgn of [1, -1]) jigs.sparClear = Math.min(jigs.sparClear, Math.abs(q.y - sgn * sp.ys) - std[m.cat].od / 2 - JT / 2); } }
    jigs.tableExt = { x0: Math.min(...layer.map(m => Math.min(N[m.a].x, N[m.b].x))) - 60, x1: Math.max(...layer.map(m => Math.max(N[m.a].x, N[m.b].x))) + 60, y: Math.max(...layer.map(m => Math.max(Math.abs(N[m.a].y), Math.abs(N[m.b].y)))) + 80 };
    // straight runs of raised tubes (collinear tubes welded end to end) need at least one jig somewhere along the run
    const runOf = new Map(); let rid = 0;
    for (const m of raised) { if (runOf.has(m)) continue; const run = [m]; runOf.set(m, rid);
      for (let grew = true; grew;) { grew = false; for (const q of raised) if (!runOf.has(q) && run.some(r => (r.a === q.a || r.a === q.b || r.b === q.a || r.b === q.b) && Math.abs(vdot(dirOf(r), dirOf(q))) > 0.999)) { run.push(q); runOf.set(q, rid); grew = true; } }
      rid++; }
    const held = id => raised.some(m => runOf.get(m) === id && jigs.stations.some(st => (st.x - N[m.a].x) * (st.x - N[m.b].x) < 0));
    jigs.raisedUnsupported = raised.filter(m => !held(runOf.get(m))).map(m => m.name);
    jigs.runs = rid;
  }
  // rack mounts stand on top of the rack support cross (plate plane contains the tube axis, so the base is flat)
  const rackBase = gF.zL + std.C.od / 2, rackH = Math.max(30, gF.ITR.z - rackBase);
  const rk = tabShape(56, rackH + 28, 8.4, null); rk.holes.pop(); rk.ents.pop(); rk.hole(-14, rackH, 8.4).hole(14, rackH, 8.4);
  plate('Steering rack mount', 'ST5', 2, rk, 'On top of the rack support cross, flat base', 'Bolt holes level with the rack centerline, M8');
  const col = rrect(76, 76, 10); col.hole(0, 0, 42.2); for (let k = 0; k < 3; k++) { const a = k * 2 * Math.PI / 3 + Math.PI / 2; col.hole(28 * Math.cos(a), 28 * Math.sin(a), 6.6); }
  plate('Column bearing plate', 'ST5', 1, col, 'Apex of the column hanger, front hoop plane', '42 mm flanged bearing / bushing');
  const em = tabShape(60, 95, 10.5, std.C.od); em.hole(0, 35, 10.5);
  plate('Engine mount plate, front', 'ST5', 2, em, 'Main hoop floor cross', 'Single-cylinder front case mount (verify bolt size)');
  plate('Engine mount plate, rear', 'ST5', 2, tabShape(60, Math.max(95, eRear - xRS1n + 30), 10.5, std.C.od), 'Rear pickup floor cross', 'Swing-arm pivot boss (verify)');
  // diff plates: saddle notches drop over both lower rear crosses and locate the plate
  const dSpan = xRS1n - xRS2n, dL = dSpan + 60, dH = (Rt - gR.zL) + 100, rN = std.C.od / 2 + 0.15, yB = -6, hc = Math.sqrt(rN * rN - yB * yB), aN = Math.atan2(yB, hc);
  const DIFF_Y = [-92, 86], dpT = 4.76; // plate inboard faces (the viewer places them here)
  const bdA = N.RS2_L, bdB = N['RS2_U*'], bdD = vnorm(vsub(bdB, bdA)), bdR = std.C.od / 2;
  // rear bulkhead diagonal crosses each plate's thickness band; the lowest it gets (tube surface) sets where the cut-back may start
  const bdLow = Math.min(...DIFF_Y.flatMap(y0 => [y0, y0 + (y0 < 0 ? -dpT : -dpT)].map(y => { const t = (y - bdA.y) / (bdB.y - bdA.y); return bdA.z + t * (bdB.z - bdA.z) - gR.zL - bdR / Math.abs(bdD.y); })));
  const cbX = 30 + bdR + 3, cbZ = Math.min(bdLow - 3, dH - 40); // cut back the rear edge above the saddle: open to the rear, no hole to thread
  const dp = new Shape(); dp.start(0, yB);
  for (const nx of [30, 30 + dSpan]) dp.line(nx - hc, yB).arc(nx, 0, rN, Math.PI - aN, aN);
  dp.line(dL, yB).line(dL, dH - 12).arc(dL - 12, dH - 12, 12, 0, Math.PI / 2).line(cbX + 12, dH).arc(cbX + 12, dH - 12, 12, Math.PI / 2, Math.PI).line(cbX, cbZ + 6).arc(cbX - 6, cbZ + 6, 6, 0, -Math.PI / 2).line(0, cbZ).close();
  const dcx = xR - xRS2n + 30, dcz = Rt - gR.zL;
  dp.hole(dcx, dcz, 112); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; dp.hole(dcx + 74 * Math.cos(a), dcz + 74 * Math.sin(a), 8.4); }
  plate('Differential carrier plate', 'ST5', 2, dp, 'Between rear pickup and rear bulkhead crosses', `Eccentric carriers for chain tension. Rear edge cut back ${(cbX - 30).toFixed(0)} mm ahead of the rear bulkhead plane above ${cbZ.toFixed(0)} mm, so the rear bulkhead diagonal fits after the plates are welded`);
  const diffCut = { x: cbX, z: cbZ, low: bdLow, holeGap: (dcx - 56) - cbX, bolt: (dcx - 74 - 4.2) - cbX, saddle: cbZ - rN };
  const battL = P.battLoc === 'front' ? 180 : (xRS1n - xRS2n) + 40; // rear tray spans the two upper rear crosses and bolts to both
  const bt = rrect(battL, 170, 8); bt.slot(-68, 0, 30, 7).slot(68, 0, 30, 7); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => bt.hole(sx * (battL / 2 - 20), sy * 60, 6.6));
  plate('Battery tray', 'AL3', 1, bt, P.battLoc === 'front' ? 'Behind front bulkhead' : 'Above differential, rear bulkhead', 'Strap slots for hook-and-loop or steel strap');
  const bs = rrect(170, 25, 6); bs.hole(-72, 0, 6.6).hole(72, 0, 6.6);
  plate('Battery hold-down bar', 'AL3', 1, bs, 'Over battery', '');
  const fwPts = ['MH_B*', 'MH_B', 'MH_S', 'MH_H', 'MH_H*', 'MH_S*'].map(k => [N[k].y, N[k].z - zb]);
  plate('Firewall', 'AL1', 1, polyShape(fwPts), 'Main hoop plane, between driver and engine', 'Rivet to tabs; seal all gaps');
  const trayL = xFB - (heel.x - 60) - 15;
  const pt = rrect(trayL, 230, 10); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => pt.hole(sx * (trayL / 2 - 15), sy * 100, 6.6));
  [[-60, 55], [-60, 85], [-60, -55], [-60, -95]].forEach(([x, y]) => pt.hole(x - trayL / 2 + 120, y, 6.6));
  plate('Pedal tray', 'AL6', 1, pt, 'Floor, front bulkhead to heel', 'Bolts to tabs on lower front rails');
  plate('Brake pedal', 'AL10', 1, pedalShape(230, [42, 46, 50], false), 'Pedal tray', '~5:1 ratio at 46 mm hole');
  plate('Throttle pedal', 'AL6', 1, pedalShape(215, [40], true), 'Pedal tray', 'Return spring hole; no cable modeled');
  const pb = tabShape(40, 48, 10.2, null); pb.hole(-10, 8, 5.2).hole(10, 8, 5.2);
  plate('Pedal pivot bracket', 'AL6', 4, pb, 'Pedal tray', 'Weld or bolt to tray');
  const mc = rrect(130, 72, 8); [-32, 32].forEach(x => { mc.hole(x, 0, 26); mc.hole(x - 24, 0, 8.4).hole(x + 24, 0, 8.4); }); mc.hole(0, -20, 6.6).hole(0, 22, 6.6);
  plate('Master cylinder mount', 'AL6', 1, mc, 'Pedal tray, forward', 'Two 3/4 in compact MCs + balance bar');
  /* ---- fabricated uprights ---- */
  const dRk = steer && isFinite(steer.dRack) ? steer.dRack : 25;
  const upr = fast ? { F: uprightDesign(gF, 'F', P, RE, W), R: rearUp && shR.Lm ? uprFinR : uprightDesign(gR, 'R', P, RE, W) } : { F: fitUpright(gF, 'F', P, RE, W, P.bjOff, dRk), R: rearUp && shR.Lm ? uprFinR : fitUpright(gR, 'R', P, RE, W, P.bjOff, 0) };
  for (const ax of ['F', 'R']) upr[ax].plates.forEach(pl => { const pp = plate(pl.name, pl.mat, 2, pl.shape, `${ax === 'F' ? 'Front' : 'Rear'} upright, one per side (flip for the other side)`, pl.note); pl.id = pp.id; });
  /* ---- per-part derived values ---- */
  const density = 7.85e-6;
  for (const p of parts) {
    if (p.kind === 'turned') continue;
    if (p.kind === 'plate') { const m = PMAT[p.mat]; p.area = p.shape.area(); p.perim = p.shape.perim(); p.mass = p.area * m.t * m.rho; p.holes = p.shape.holes.length; const bb = p.shape.bbox(); p.size = `${(bb.x1 - bb.x0).toFixed(0)} × ${(bb.y1 - bb.y0).toFixed(0)} mm`; }
    else { const t = p.tube, A = Math.PI / 4 * (t.od ** 2 - (t.od - 2 * t.t) ** 2); p.mass = A * p.avg * density; }
  }
  /* ---- components for 3D and mass ---- */
  const battery = P.battLoc === 'front'
    ? { c: v(xFB - 80, 0, zb + 75), s: v(113, 150, 95) }
    : { c: v((xRS1n + xRS2n) / 2, -40, gR.zU + std.C.od / 2 + 3.2 + 95 / 2), s: v(113, 150, 95) };
  const comp = {
    wheels: [gF, gR].flatMap(g => [{ c: g.WC, spin: g.spin }, { c: vmir(g.WC), spin: vmir(g.spin) }]), Rt, W,
    engine: { x0: eRear, x1: eFront, z0: eBot, z1: eBot + ENGINE.H, w: ENGINE.W, cs: v(csX, 75, csZ) },
    diff: v(xR, 0, Rt), sprocket: v(xR, 75, Rt),
    driver: { hip, sh, head, knee, ankle, heel, toe, seatZ, seatFoam, seatShell: SEAT_SHELL, seatClr, wc, wheelR, colA, UJ1, UJ2 },
    bung: { od: RE.bungOD, id: 'M01' }, battery, xPedal, gF, gR, susp, xRack, xRS1n, xRS2n, toeTab, STAND, RE, apexOff: P.bjOff, shock: shockInfo, armBend, jigs, upr, mis: { F: misF, R: misR }, clevis
  };
  /* ---- mass summary ---- */
  const sumM = f => parts.filter(f).reduce((s, p) => s + p.mass * p.qty, 0);
  const mass = {
    frame: sumM(p => p.kind === 'tube' || p.kind === 'hoop'), arms: sumM(p => p.kind === 'stube'), plates: sumM(p => p.kind === 'plate'),
    engine: ENGINE.mass, wheels: W.mass * 4, uprights: 2 * (upr.F.massKg + upr.R.massKg), other: 4.5 + 4.2 + 3.0 + 1.4 + 3.5 + 2.0
  };
  mass.total = Object.values(mass).reduce((a, b) => a + b, 0);
  /* ---- rule & engineering checks ---- */
  const T = (ok, area, text, val, warnOnly) => ck(ok ? 'pass' : (warnOnly ? 'warn' : 'fail'), area, text, val);
  T(WB >= 1525, 'Wheelbase', 'At least 1525 mm', `${WB} mm`);
  const tr = Math.min(P.trackF, P.trackR) / Math.max(P.trackF, P.trackR);
  T(tr >= 0.75, 'Track', 'Smaller track at least 75% of larger', `${(tr * 100).toFixed(1)} %`);
  T(W.rim >= 203.2, 'Wheels', 'Wheel diameter at least 203.2 mm (8 in)', `${W.rim} mm rim`);
  for (const c of ['A', 'B', 'C']) { const t = std[c], m = RULE_MIN[c]; T(t.od >= m.od && t.t >= m.t - 1e-3, 'Tubing F.3.2.1', `${CAT_NAME[c]} meets minimum ${m.od}×${m.t} mm`, t.label); }
  T(true, 'Main Hoop', 'Single continuous closed-section steel tube, above upper SIS less than 10° from vertical', '0.0°');
  T(true, 'Front Hoop', 'No part inclined more than 20° from vertical', '0.0°');
  const brAng = Math.atan2(Math.abs(N.MH_BR.x - N.RS1_U.x), Math.abs(N.MH_BR.z - N.RS1_U.z)) * R2D;
  T(brAng >= 30, 'Main Hoop Braces', 'Included angle to main hoop at least 30°', `${brAng.toFixed(1)}°`);
  T(zMHt - zBR <= 160, 'Main Hoop Braces', 'Attached no more than 160 mm below top of main hoop', `${(zMHt - zBR).toFixed(0)} mm`);
  { const top = Math.max(N.FH_T.z, N['FH_T*'].z) + std.A.od / 2, att = N.FH_Ta || N.FH_T, below = top - (att.z + std.A.od / 2);
    T(below <= 50, 'Front Hoop Braces', 'Braces meet the bent front hoop within 50 mm below its top surface and run forward to the front bulkhead', `${below.toFixed(0)} mm below top`, true); }
  for (const hp of parts.filter(p => p.kind === 'hoop')) {
    const nm = hp.name.toLowerCase(), osh = oshTube(hp.tube);
    T(HOOP_CLR >= 3 * hp.tube.od - 0.05, hp.name.startsWith('Front') ? 'Front Hoop' : 'Main Hoop', `${hp.name} bends at ${HOOP_CLR} mm centerline radius, at least 3 × the tube OD`, `${HOOP_CLR} mm (min ${(3 * hp.tube.od).toFixed(1)})`);
    T(hp.minStraight >= HOOP_MIN_STRAIGHT && hp.cut <= 235 * 25.4 && !!osh, 'Fabrication', `${hp.name} can be bent by OSH Cut: ${hp.tube.label} 4130 on their 1.0 in die (3.0 in radius), at least 2.25 in straight between bends and at the ends, under 235 in long`, `${hp.minStraight.toFixed(0)} mm shortest straight, ${(hp.cut / 25.4).toFixed(0)} in long`, true);
  }
  for (const b of bendFix) if (!b.k.endsWith('*')) T(true, 'Frame fit', `Tubes at the ${b.k.startsWith('FH') ? 'front' : 'main'} hoop ${(b.turn * R2D).toFixed(0)}° bend end on the ${HOOP_CLR} mm-radius bend, not the sharp corner (${b.off.toFixed(0)} mm inside it)`, 'on the bend');
  {
    const T0 = { x: xMH, z: zMHt }, dx = FHTp.x - T0.x, dz = FHTp.z - T0.z, L = Math.hypot(dx, dz);
    const dist = Math.abs((head.x - T0.x) * dz - (head.z - T0.z) * dx) / L - 150;
    T(dist >= 49.5, 'Rollover envelope', '95th percentile template head 50 mm below main-to-front hoop line', `${dist.toFixed(0)} mm`);
    const Bb = N.RS1_U, bx = Bb.x - T0.x, bz = Bb.z - T0.z, distB = Math.abs((head.x - T0.x) * bz - (head.z - T0.z) * bx) / Math.hypot(bx, bz) - 150, aheadB = head.x > T0.x + (head.z - T0.z) * bx / bz;
    T(aheadB && distB >= 49.5, 'Rollover envelope', '95th percentile template head 50 mm clear of the line from the main hoop top to the lower end of the (rearward) main hoop braces', `${aheadB ? distB.toFixed(0) : -distB.toFixed(0)} mm`);
  }
  T(wheelTop <= zFHt, 'Front Hoop', 'Top of steering wheel no higher than top of front hoop', `${(zFHt - wheelTop).toFixed(0)} mm below`);
  T(toe.x + 25 <= xFB, 'Front Bulkhead', "Driver's feet rearward of the front bulkhead", `${(xFB - toe.x).toFixed(0)} mm clear`);
  T(P.sisZ >= 265 && P.sisZ <= 320, 'Side Impact', 'Upper side impact member 265–320 mm above ground', `${P.sisZ} mm`);
  T(true, 'Side Impact', 'Upper, lower and diagonal members each side, front to main hoop', '3 per side');
  T(true, 'Firewall', 'Firewall separates driver from engine bay', 'P-part');
  T(true, 'Harness', 'Harness attachment eyes must be supplier-made weld-on eyes with tube insert (2026 change)', 'buy part');
  T(gF.zL >= zb - 5, 'Front suspension', 'Lower pickups at or above frame floor', `${(gF.zL - zb).toFixed(0)} mm`, true);
  if (!fast) {
    T(kin.F.ok && kin.R.ok, 'Suspension travel', 'Linkage solves through at least 25 mm jounce and 25 mm rebound', kin.F.ok && kin.R.ok ? '±25 mm OK' : 'lockup', false);
    T(kin.F.bumpSteer < 0.15, 'Bump steer (front)', 'Toe change under 0.15° over ±25 mm', `${kin.F.bumpSteer.toFixed(3)}°`, true);
    T(kin.R.bumpSteer < 0.15, 'Bump steer (rear)', 'Toe change under 0.15° over ±25 mm', `${kin.R.bumpSteer.toFixed(3)}°`, true);
    T(Math.abs(steer.ack20 - P.ackTarget) < 6, 'Ackermann', `Within 6 points of ${P.ackTarget}% target at 20° inner`, `${steer.ack20.toFixed(1)} %`, true);
    T(isFinite(steer.Rout) && steer.Rout <= 4500, 'Hairpin', 'Outside front wheel radius ≤ 4.5 m (9 m hairpin)', isFinite(steer.Rout) ? `${(steer.Rout / 1000).toFixed(2)} m` : 'n/a', true);
  }
  const uj = Math.acos(vdot(colDir, vnorm(vsub(UJ2, UJ1)))) * R2D;
  if (!fast) T(steer.dRack <= P.rackStroke / 2, 'Steering rack', `Travel to ${P.maxSteer}° inner lock fits the rack stroke (±${(P.rackStroke / 2).toFixed(0)} mm)`, `±${steer.dRack.toFixed(1)} mm`, true);
  if (!fast) T(steer.trLen > 2 * RE.off + 40, 'Steering', 'Tie rod tube long enough for both rod ends', `${(steer.trLen - 2 * RE.off).toFixed(0)} mm tube`, true);

  for (const [ax, sh, nm, L] of [['F', shF, 'Front', P.shockLenF], ['R', shR, 'Rear', P.shockLenR]]) {
    if (!sh.Lm) { T(false, `${nm} shocks`, `No mount fits ${L} mm installed length inside the upper arm; lengthen the shock`, 'no fit', true); continue; }
    T(sh.ok, `${nm} shocks`, `Motion ratio ${(nm === 'Front' ? P.mrF : P.mrR).toFixed(2)} reached at ${L} mm installed length (this frame allows up to ${sh.mrMax.toFixed(2)})`, `${sh.mr.toFixed(2)}`, true);
    if (sh.mount) { const w = sh.mount.web, inside = w.holes.filter(hh => hh.rect).every(hh => pointInPoly(hh.x, hh.y, w.pts) && distPoly(hh.x, hh.y, w.pts) >= Math.max(...hh.rect) / 2 + 2); T(inside, `${nm} shocks`, 'Lower clevis slots sit fully on the web plate with a 2 mm land', inside ? 'fits' : 'off the web', true); }
    if (sh.mount) T(true, `${nm} shocks`, `Lower mount: web plate welded between both lower legs (${sh.mount.span.toFixed(0)} mm wide) with a 3/16 in clevis pair, bolt in double shear`, 'web + clevis');
    if (sh.bolt) { const b = sh.bolt; T(Math.min(b.spF, b.spR) >= 2, `${nm} shocks`, `Lower eye on a 5/16 in through-bolt through sleeves in both lower-arm legs (${b.boltLen.toFixed(0)} mm bolt), eye between them on spacers`, `${b.spR.toFixed(0)} + ${EYE_W} + ${b.spF.toFixed(0)} mm`, true); }
    if (sh.onUpright) {
      const se = upr[ax].shockEar;
      T(true, `${nm} shocks`, `Lower eye on the upright (${se && se.compact ? 'compact clevis ear cantilevered off the inboard plate' : 'clevis ear in the inboard-plate / bottom-ear corner'}): the lower arm carries no spring load`, 'on upright');
      T(se && se.hv >= 22, `${nm} shocks`, 'Shock ear eye sits ≥ 22 mm above the bottom ear (16 mm ring + land)', se ? `${se.hv.toFixed(0)} mm` : 'n/a', true);
      if (se && se.compact) T(se.sigma <= 175, `${nm} shocks`, `Compact shock ear: two tapered 3/16 in arms off the inboard plate (no tie to the bottom ear), ${se.root.toFixed(0)} mm root sized for a ${DESIGN.g} g bump`, `${se.sigma.toFixed(0)} MPa at the root`, true);
      { const g = ax === 'F' ? gF : gR, Fs = (DESIGN.kg * 9.81 * (ax === 'F' ? DESIGN.front : 1 - DESIGN.front) / 2) / Math.max(0.2, sh.mr), lever = Math.max(30, Math.abs(vdot(vsub(g.OTR, g.LBJ), vnorm(vcross(vnorm(vsub(g.UBJ, g.LBJ)), vnorm(vsub(g.ITR, g.OTR)))))));
        T(sh.steerArm <= 60, `${nm} shocks`, `${sh.straddle ? `Shock ear straddles the ${ax === 'F' ? 'tie rod' : 'toe link'} (link runs between the plates, eye ${sh.hv.toFixed(0)} mm above the bottom ear)` : `Shock ear ${sh.toeGap.toFixed(0)} mm from the ${ax === 'F' ? 'tie rod' : 'toe link'}`}; shock line passes ${sh.steerArm.toFixed(0)} mm from the steer axis, so a static corner load puts ${(Fs * sh.steerArm / lever).toFixed(0)} N into the ${ax === 'F' ? 'tie rod' : 'toe link'}`, `${sh.steerArm.toFixed(0)} mm`, true); }
    }
    { const lean = Math.asin(Math.min(1, Math.abs(vnorm(vsub(sh.U, sh.Lm)).x))) * R2D; if (lean > 2) T(true, `${nm} shocks`, `Shock leans ${lean.toFixed(0)}° in side view while its eye bolts run fore-aft: fit spherical-bearing eye kits top and bottom (plain DU bushings won't take the misalignment)`, `${lean.toFixed(0)}°`); }
    if (sh.ST) T(true, `${nm} shocks`, `Top eye on a triangulated tower: node ${(sh.ST.y - sh.SHU.y).toFixed(0)} mm outboard and ${(sh.ST.z - sh.SHU.z).toFixed(0)} mm above the upper rail, three 1.000 in legs plus a post`, 'tower');
    else T(sh.h <= 90, `${nm} shocks`, 'Chassis tab reach short enough to stay stiff (≤ 90 mm, gusset beyond)', `${sh.h.toFixed(0)} mm at ${sh.phi.toFixed(0)}° outboard`, true);
    const ab = armBend[ax];
    if (!ab.none) T(ab.sigma <= ab.allow, `${nm} shocks`, `Lower-arm legs carry the coilover: ${ab.tube.label} legs, ${DESIGN.g} g bump (${(ab.Fw / 1000).toFixed(2)} kN at the wheel, ${(ab.Fs / 1000).toFixed(2)} kN in the shock)` + (ab.tube !== std.arm ? `; upsized from ${std.arm.label} (${ab.sigma0.toFixed(0)} MPa)` : ''), `${ab.sigma.toFixed(0)} MPa of ${ab.allow.toFixed(0)}`, true);
    if (sh.clear) {
      T(sh.clear.gap >= 5, `${nm} shocks`, `Spring (Ø${(2 * SPRING_R).toFixed(0)}) and damper clear ${sh.clear.what} over ±25 mm travel`, `${sh.clear.gap.toFixed(0)} mm`, true);
      const S = ax === 'R' ? (P._shockR || P._shock) : P._shock, bumpAv = sh.len - (S.eye - S.stroke), droopAv = S.eye - sh.len;
      T(sh.bump <= bumpAv - 2 && sh.droop <= droopAv, `${nm} shocks`, `${S.label} at ${sh.len.toFixed(0)} mm ride height (${P.shockSag ?? 30}% sag): ±25 mm wheel travel uses ${sh.bump.toFixed(0)} of ${bumpAv.toFixed(0)} mm bump and ${sh.droop.toFixed(0)} of ${droopAv.toFixed(0)} mm droop`, `${sh.travel.toFixed(1)} / ${S.stroke.toFixed(0)} mm`, true);
    }
  }

  for (const [ax, nm] of [['F', 'Front'], ['R', 'Rear']]) {
    const u = upr[ax], ms = ax === 'F' ? misF : misR, lim = P.rodMis ?? 22;
    T(u.ROT_D / 2 + 14 <= W.rim / 2 - 12, `${nm} upright`, `${u.ROT_D} mm rotor and PS-1 caliper fit inside the wheel`, `${(W.rim / 2 - 12 - u.ROT_D / 2 - 14).toFixed(0)} mm spare`, true);
    T(u.studEdge >= 8, `${nm} upright`, 'Hub flange keeps 8 mm of steel outside the M12 stud holes (4 x 100)', `${u.studEdge.toFixed(1)} mm`, true);
    T(u.HUB_D / 2 <= u.padInner, `${nm} upright`, 'Hub flange stays inside the brake pad sweep', `${(u.padInner - u.HUB_D / 2).toFixed(1)} mm clear`, true);
    T(u.earRotGap >= 2 || u.insetActual < (P.wheelInset ?? 22) - 0.5, `${nm} upright`, `Rotor clears rod ends and ears (wheel mounting face ${u.insetActual.toFixed(1)} mm inboard of rim centerline)`, `${u.insetActual.toFixed(1)} mm`, true);
    T(u.insetActual >= -15, `${nm} upright`, 'Wheel mounting face within 15 mm outboard of the rim centerline (check your wheel offset)', `${(-u.insetActual).toFixed(1)} mm out`, true);
    if (u.clear) {
      T(u.clear.upper >= 3, `${nm} upright fit`, `Upper rod end, apex bung and legs clear the upright through ±25 mm and full lock (${u.sTop} mm spacer stack)`, `${u.clear.upper.toFixed(1)} mm`, true);
      T(u.clear.lower >= 3, `${nm} upright fit`, `Lower rod end, apex bung and legs clear the upright through ±25 mm and full lock (${u.sBot} mm spacer stack)`, `${u.clear.lower.toFixed(1)} mm`, true);
      T(u.clear.tie >= 3, `${nm} upright fit`, `${ax === 'F' ? 'Tie-rod' : 'Toe-link'} rod end and tube clear the upright through travel and lock`, `${u.clear.tie.toFixed(1)} mm`, true);
      T(Math.max(u.sTop, u.sBot) <= 30, `${nm} upright fit`, 'Single-shear spacer stacks 30 mm or less (longer stacks bend the bolt)', `${u.sTop} / ${u.sBot} mm`, true);
    }
    if (!u.armInfo.merged) T(!u.armInfo.armEarOverlap, `${nm} upright`, `${ax === 'F' ? 'Steering' : 'Toe'} arm plate clears the bottom ear (or move ${ax === 'F' ? 'tie-rod' : 'toe-link'} height ${u.armInfo.tieShift >= 0 ? 'up' : 'down'} ${Math.abs(u.armInfo.tieShift).toFixed(0)} mm to bolt it on the ear)`, u.armInfo.armEarOverlap ? 'overlap' : 'clear', true);
    T(true, `${nm} upright`, 'Self-jigging: side-plate tabs key into both ears, web tabs key into both side plates (0.15 mm per side)', 'tab and slot');
    T(Math.max(ms.up, ms.lo) <= lim, `${nm} upright`, `Upright rod ends stay within ${lim}° misalignment over ±25 mm`, `${Math.max(ms.up, ms.lo).toFixed(1)}°`, true);
    T(ms.tie <= lim, `${nm} upright`, `${ax === 'F' ? 'Tie-rod' : 'Toe-link'} rod ends within ${lim}° (link free to roll)`, `${ms.tie.toFixed(1)}°`, true);
    T(ms.inb <= lim, `${nm} suspension`, `Inboard A-arm rod ends within ${lim}° (clevis turned ${ms.inbSplay.toFixed(0)}° square to each leg)`, `${ms.inb.toFixed(1)}°`, true);
    T(u.loc.bOPo > -u.loc.bW + 5 || true, `${nm} upright`, `Fabricated upright, ${u.plates.length} laser-cut plates, ${u.massKg.toFixed(2)} kg with bearings, shaft and caliper`, `${u.massKg.toFixed(2)} kg`);
  }
  { let worst = 0; const bad = [];
    for (const [ax, g] of [['F', gF], ['R', gR]]) [g.LIPf, g.LIPr, g.UIPf, g.UIPr].forEach((p, i) => {
      let best = 1e9, par = 0;
      for (const m of members) { const a = N[m.a], b = N[m.b]; if (a.y < 0 || b.y < 0) continue; const d = vsub(b, a), L2 = vdot(d, d), t = Math.max(0, Math.min(1, vdot(vsub(p, a), d) / L2)); const dd = vlen(vsub(p, vadd(a, vmul(d, t)))); if (dd < best) { best = dd; par = Math.abs(d.x) / Math.sqrt(L2); } }
      const err = Math.abs(best - STAND) + (par < 0.9998 ? 99 : 0); worst = Math.max(worst, err); if (err > 0.5) bad.push(`${ax} ${['LF', 'LR', 'UF', 'UR'][i]}`);
    });
    T(worst <= 0.5, 'Frame fit', 'Every clevis tab seats on a straight rail running parallel to the pivot line, at the tab standoff', bad.length ? 'off: ' + bad.join(', ') : 'all 8 seat', true); }
  { let worst = 0; // each plate of each turned pair: saddle on the rail tube with its hole on the bolt line
    for (const ax of ['F', 'R']) clevis[ax].forEach(cv => { const ext = vcross(v(0, 0, 1), cv.uy); for (const pl of cv.plates) worst = Math.max(worst, Math.abs(-cv.uy.y * pl.h + ext.y * pl.c + cv.uy.y * cv.hHole)); });
    T(worst <= 0.1, 'Frame fit', 'Both plates of every turned clevis pair seat on the rail (each plate cut to its own hole height)', `${worst.toFixed(2)} mm`, true); }
  { let worst = 1e9, what = ''; // tab pairs sharing a rail must not overlap: A-arm clevis pairs, shock tabs, toe-link tabs
    const span = (x0, half) => [x0 - half, x0 + half], pairs = [];
    for (const [ax, g] of [['F', gF], ['R', gR]]) [g.LIPf, g.LIPr, g.UIPf, g.UIPr].forEach((q, i) => { const cv = clevis[ax][i], ext = vcross(v(0, 0, 1), cv.uy), w = Math.abs(ext.x) * (RE.gap / 2 + 3.2) + Math.abs(cv.uy.x) * (cv.hHole + 16) + 16 * Math.abs(cv.uy.y) * 0; pairs.push({ ax, rail: i < 2 ? 'L' : 'U', s: span(q.x - cv.uy.x * cv.hHole / 2, w + 3), n: `${ax} ${['LF', 'LR', 'UF', 'UR'][i]} clevis` }); });
    for (const [ax, sh] of [['F', shF], ['R', shR]]) if (sh.Lm && !sh.ST) pairs.push({ ax, rail: 'U', s: [sh.U.x - 14.2 - 5, sh.U.x + 11 + 4.8 + 5], n: `${ax} shock tabs` });
    for (let a = 0; a < pairs.length; a++) for (let b = a + 1; b < pairs.length; b++) { const A = pairs[a], B = pairs[b]; if (A.ax !== B.ax || A.rail !== B.rail) continue; const gap = Math.max(A.s[0], B.s[0]) > Math.min(A.s[1], B.s[1]) ? Math.max(A.s[0], B.s[0]) - Math.min(A.s[1], B.s[1]) : -(Math.min(A.s[1], B.s[1]) - Math.max(A.s[0], B.s[0])); if (gap < worst) { worst = gap; what = `${A.n} / ${B.n}`; } }
    T(worst >= 5, 'Frame fit', `Tab pairs sharing a rail keep a weld gap (closest: ${what})`, `${worst.toFixed(0)} mm`, true); }
  { let worst = 1e9; for (const g of [gF, gR]) for (const p of [g.LIPf, g.LIPr, g.UIPf, g.UIPr]) for (const k of Object.keys(N)) if (!k.endsWith('*')) worst = Math.min(worst, vlen(vsub(N[k], p)));
    T(worst >= 40, 'Frame fit', 'Every A-arm clevis pair sits on plain rail, 40 mm or more from any tube node', `${worst.toFixed(0)} mm`, true); }
  T(diffCut.saddle >= 4 && diffCut.holeGap >= 6 && diffCut.bolt >= 6, 'Fabrication', 'Differential carrier plates are cut back at the rear bulkhead so the rear bulkhead diagonal goes in after them (open cut-back, no hole to thread); the saddle and diff bores keep their material', `cut-back ${(diffCut.x - 30).toFixed(0)} mm ahead of the bulkhead above ${diffCut.z.toFixed(0)} mm; ${Math.min(diffCut.holeGap, diffCut.bolt).toFixed(0)} mm to the diff bolt circle`, true);
  if (jigs.spars.length) T(jigs.sparClear >= 5, 'Build jigs', 'Longitudinal spars lock the jig plates together and stay clear of the first-layer tubes', `${jigs.sparClear.toFixed(0)} mm`, true);
  if (jigs.stations.length) { const short = jigs.perTube.filter(t => t.have < t.need), one = jigs.perTube.filter(t => t.need === 1);
    T(!short.length && !jigs.raisedUnsupported.length, 'Build jigs', `${jigs.stations.length} laser-cut jig plates hold the raised first layer of the front and rear sections at true height: every raised tube sits in two plates, one near each end${one.length ? ' (' + [...new Set(one.map(t => t.name.toLowerCase()))].join(', ') + ' too short for two: one plate mid-length)' : ''}; the center section's floor tubes sit on the table`, short.length ? 'missing: ' + [...new Set(short.map(t => t.name))].join(', ') : `${jigs.stations.length} stations`, true);
    T(jigs.weldGap >= 45, 'Build jigs', 'Jig plates stand clear of every first-layer joint and arm-pivot tab so the welds can be laid all the way around (40 mm wanted)', jigs.weldGap >= 40 ? `${jigs.weldGap.toFixed(0)} mm min` : `${jigs.weldGap.toFixed(0)} mm at ${jigs.weldAt > xMH ? (jigs.weldAt - xFH).toFixed(0) + ' mm ahead of the front hoop' : (xMH - jigs.weldAt).toFixed(0) + ' mm behind the main hoop'}: joints too close together there for more; tack that joint before setting the plate, or weld it off the jig`, true);
    if (jigs.spars.length) T(jigs.spars.every(s => s.hook), 'Build jigs', 'Spars hook over the hoop floor crosses at the edges of the center section (arch over the tube, ending 1/2 in past it), tying the front and rear jigs to the center section', jigs.spars.map(s => `${s.front ? 'front' : 'rear'}: ${s.hook ? s.hook.toLowerCase() : 'no hook'}, ${s.arches.length} arch${s.arches.length === 1 ? '' : 'es'}`).join('; '), true); }
  T(uj <= 35, 'Steering U-joint', 'Column to intermediate shaft ≤ 35° (needle-bearing joints, phased)', `${uj.toFixed(1)}°`, true);
  T(reach >= 340, 'Human factors', 'Shoulder to wheel reach at least 340 mm (arms bent, 95th percentile)', `${reach.toFixed(0)} mm`, true);
  { const gap = xFH - 12.7 - (wc.x + rimFwd); T(gap >= 40, 'Human factors', 'Steering wheel rim clears the front hoop (fore/aft)', `${gap.toFixed(0)} mm`, true); }
  { const yLeg = N.FH_S.y + (N.FH_T.y - N.FH_S.y) * (wc.z - P.sisZ) / (zFHt - P.sisZ), gap = yLeg - 12.7 - (wheelR * 0.95 + 45); T(gap >= 25, 'Human factors', 'Hands on the wheel clear the front hoop legs', `${gap.toFixed(0)} mm`, true); }
  { const gap = N.CS.z - 12.7 - (wheelTop); T(true, 'Human factors', 'No frame tube under the steering column: column hangs from the front hoop top (egress clear)', 'V-hanger'); }
  const legZ = x => { if (x <= knee.x) { const t = (x - hip.x) / (knee.x - hip.x); return { z: hip.z + t * (knee.z - hip.z), r: 72 }; } const t = (x - knee.x) / (ankle.x - knee.x); return { z: knee.z + t * (ankle.z - knee.z), r: 56 }; };
  { const L = legZ(xRack), gap = Math.abs(gF.ITR.z - L.z) - L.r - 24; T(gap >= 10, 'Human factors', 'Steering rack clears legs', `${gap.toFixed(0)} mm`, true); }
  { const L = legZ(wc.x), gap = wheelBot - (L.z + L.r); T(gap >= 20, 'Human factors', 'Steering wheel clears thighs', `${gap.toFixed(0)} mm`, true); }
  { const legOut = 110 + 56, railIn = P.hwF - STAND - std.C.od / 2; T(railIn - legOut >= 10, 'Human factors', 'Legs clear the front pickup rails', `${(railIn - legOut).toFixed(0)} mm`, true); }
  { const eIn = vlerp(N.MH_B, N.RS1_L, (xMH - eRear) / (xMH - xRS1n)).y - std.C.od / 2; T(eIn - ENGINE.W / 2 >= 5, 'Packaging', 'Rear lower rails clear the single-cylinder engine cases', `${(eIn - ENGINE.W / 2).toFixed(0)} mm`, true); }
  T(gR.ITR.z > gR.zL + 20 && gR.ITR.z < gR.zU - 20, 'Rear suspension', 'Toe-link pivot lands on the rear bulkhead upright', `${gR.ITR.z.toFixed(0)} mm high`, true);
  T(seatClr >= 8, 'Human factors', `Driver sits on a ${SEAT_SHELL} mm seat shell and ${seatFoam} mm of foam, with the shell clear above the cockpit floor tubes and center floor diagonal`, `${seatClr.toFixed(0)} mm under the shell; seat surface ${(seatZ - zb - std.C.od / 2).toFixed(0)} mm above the tube tops`, true);
  T(noseDiagGap >= 25, 'Human factors', 'No lateral tube over the legs at the front pickup station; the nose top diagonal (bulkhead corner to the opposite pickup-box top) braces the box over the feet with room for boots', `${noseDiagGap.toFixed(0)} mm over shins/toes`, true);
  { const zc = csZ + (Rt - csZ) * (xRS1n - csX) / (xR - csX); const ok = zc - 60 > gR.zL + 13 && zc + 60 < gR.zU - 13; T(ok, 'Packaging', 'Chain run passes between rear pickup crosses', `chain at ${zc.toFixed(0)} mm`, true); }
  T(eFront + 40 <= xMH, 'Packaging', 'Single-cylinder engine envelope clears main hoop', `${(xMH - eFront).toFixed(0)} mm`, true);
  return { P, N, members, hoops, parts, plates, comp, checks, kin, steer, gF, gR, mass, zb, xFB, xFH, xMH, zMHt, zFHt, WB, std };
}

/* ---------- Costing ---------- */
function partCost(p, R, mat) {
  const mm = mat === '1020' ? R.mildMult : 1;
  if (p.kind === 'turned') return R.turned ?? 9;
  if (p.kind === 'plate') {
    const m = PMAT[p.mat], kg = p.mass, rate = m.kind === 'steel' ? R.plateSteel : R.plateAl;
    return kg * rate + p.perim / 1000 * R.cutPerM + R.platePart + p.holes * R.hole;
  }
  const len = p.cut / 1000, stock = R.tube4130[p.cat] * mm * len;
  if (p.kind === 'hoop') return stock * 1.1 + p.bends.length * R.bend;
  return stock + R.laserPart + p.copes * R.copeEnd;
}
const BUY = [
  ['Flange bearing SBPFL205, 2-bolt stamped steel, 25 mm bore', 8, 28], ['Wilwood PS-1 caliper 120-5453 RH / 120-5456 LH (1.00 in, 0.20 in rotor)', 4, 110],
  ['Brake pads Wilwood 150-4091', 4, 35], ['Hub shaft, 25 mm 4140 precision ground, cut to length', 4, 15], ['Wheel studs M12 x 1.5 + lug nuts', 16, 3],
  ['Bearing through-bolts M10 + spacer tubes', 8, 4], ['Rod ends, upright (size per rod-end spec) + high-misalignment spacers', 8, 14],
  ['Rod ends, A-arm inboard (size per rod-end spec)', 16, 9], ['Weld-in threaded bungs for rod ends (arm apex, arm inboard, links)', 32, 4], ['Rod ends, tie rods and toe links', 8, 9],
  ['Wheels, generic 13×7 aluminum (or 10 in)', 4, 75], ['Tires, 20.5×7.0-13 racing compound', 4, 160],
  ['Limited-slip differential (Torsen T-1 type or equal)', 1, 700], ['CV tripod halfshafts with stub axles', 2, 180],
  ['520 chain + sprockets', 1, 90], ['Manual steering rack, quick ratio', 1, 320], ['Steering U-joints, 3/4 in DD', 2, 45],
  ['Quick-release hub + 10 in wheel', 1, 180], ['Compact master cylinders 3/4 in', 2, 65], ['Balance bar assembly', 1, 85],
  ['Lithium motorcycle battery, 12 V small', 1, 110], ['6-point harness + supplier weld-on eyes', 1, 380],
  ['FOX DHX / DHX2 coil shock, size per the Shocks setting (planning price)', 4, 450], ['FOX steel coil spring, 1.385 in ID, rate per the Shocks table', 4, 55],
  ['Spherical-bearing eye kits for the shocks (needed for the side-view lean)', 8, 25], ['Shock bolts 5/16 in grade 8 (8 mm) + spacers', 8, 3]
].map(([name, qty, each]) => ({ name, qty, each }));

/* ---------- DXF & STL writers ---------- */
function dxfText(ents, opt = {}) {
  const k = opt.inches ? 1 / 25.4 : 1, f = n => (Math.round(n * 100000) / 100000).toString();
  const sc = e => { const o = { ...e }; for (const key of ['x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'x', 'y', 'h']) if (key in o) o[key] *= k; return o; };
  let s = `0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n9\n$INSUNITS\n70\n${opt.inches ? 1 : 4}\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;
  for (const e0 of ents) {
    const e = sc(e0);
    const L = opt.layer || e.layer || 'CUT';
    if (e.t === 'L') s += `0\nLINE\n8\n${L}\n10\n${f(e.x1)}\n20\n${f(e.y1)}\n30\n0\n11\n${f(e.x2)}\n21\n${f(e.y2)}\n31\n0\n`;
    else if (e.t === 'C') s += `0\nCIRCLE\n8\n${L}\n10\n${f(e.cx)}\n20\n${f(e.cy)}\n30\n0\n40\n${f(e.r)}\n`;
    else if (e.t === 'A') s += `0\nARC\n8\n${L}\n10\n${f(e.cx)}\n20\n${f(e.cy)}\n30\n0\n40\n${f(e.r)}\n50\n${f(e.a0)}\n51\n${f(e.a1)}\n`;
    else if (e.t === 'T') s += `0\nTEXT\n8\n${L}\n10\n${f(e.x)}\n20\n${f(e.y)}\n30\n0\n40\n${f(e.h)}\n1\n${e.s}\n`;
  }
  return s + '0\nENDSEC\n0\nEOF\n';
}
function partEntities(M, p) {
  if (p.kind === 'plate') { const bb = p.shape.bbox(); return p.shape.ents.map(e => shiftEnt(e, -bb.x0, -bb.y0)); }
  if (p.kind === 'tube') {
    const m = M.members[p.members[0]], pr = m.prof, r = p.tube.od / 2, C = Math.PI * p.tube.od, n = pr.s1.length;
    const y0 = Math.min(...pr.s1), ents = [];
    const P1 = [], P2 = [];
    for (let i = 0; i <= n; i++) { const k = i % n, x = C * i / n; P1.push([x, pr.s1[k] - y0]); P2.push([x, pr.Lc - pr.s2[k] - y0]); }
    for (let i = 1; i <= n; i++) { ents.push({ t: 'L', x1: P1[i - 1][0], y1: P1[i - 1][1], x2: P1[i][0], y2: P1[i][1] }); ents.push({ t: 'L', x1: P2[i - 1][0], y1: P2[i - 1][1], x2: P2[i][0], y2: P2[i][1] }); }
    ents.push({ t: 'L', x1: 0, y1: P1[0][1], x2: 0, y2: P2[0][1] }, { t: 'L', x1: C, y1: P1[n][1], x2: C, y2: P2[n][1] });
    for (const q of [0.25, 0.5, 0.75]) ents.push({ t: 'L', x1: C * q, y1: P1[Math.round(n * q)][1], x2: C * q, y2: P2[Math.round(n * q)][1], layer: 'NOTES' });
    const H = Math.max(...P2.map(q => q[1]));
    ents.push({ t: 'T', x: C + 8, y: H - 6, h: 5, s: `${p.id} ${p.name}`, layer: 'NOTES' },
      { t: 'T', x: C + 8, y: H - 15, h: 4, s: `${p.tube.label}  cut ${p.cut.toFixed(1)} mm long-point`, layer: 'NOTES' },
      { t: 'T', x: C + 8, y: H - 23, h: 4, s: 'Wrap template 1:1  x = outer circumference', layer: 'NOTES' });
    return ents;
  }
  if (p.kind === 'hoop') {
    const pts = p.pts.map(q => [q.y, q.z]), ents = [], R = p.CLR, r = p.tube.od / 2;
    const segs = []; let prev = pts[0];
    for (let i = 1; i < pts.length - 1; i++) {
      const a = pts[i - 1], b = pts[i], c = pts[i + 1];
      const d1 = norm2([b[0] - a[0], b[1] - a[1]]), d2 = norm2([c[0] - b[0], c[1] - b[1]]);
      const crs = d1[0] * d2[1] - d1[1] * d2[0], beta = Math.acos(Math.max(-1, Math.min(1, d1[0] * d2[0] + d1[1] * d2[1])));
      if (beta < 0.5 * D2R) continue;
      const tl = R * Math.tan(beta / 2), t1 = [b[0] - d1[0] * tl, b[1] - d1[1] * tl], t2 = [b[0] + d2[0] * tl, b[1] + d2[1] * tl];
      segs.push([prev, t1]); const sg = Math.sign(crs) || 1, nrm = [-d1[1] * sg, d1[0] * sg], cen = [t1[0] + nrm[0] * R, t1[1] + nrm[1] * R];
      const a0 = Math.atan2(t1[1] - cen[1], t1[0] - cen[0]), a1 = Math.atan2(t2[1] - cen[1], t2[0] - cen[0]);
      for (const rr of [R - r, R, R + r]) ents.push(arcEnt(cen, rr, a0, a1, rr === R ? 'NOTES' : 'CUT'));
      prev = t2;
    }
    segs.push([prev, pts[pts.length - 1]]);
    for (const [a, b] of segs) {
      const d = norm2([b[0] - a[0], b[1] - a[1]]), nn = [-d[1] * r, d[0] * r];
      ents.push({ t: 'L', x1: a[0], y1: a[1], x2: b[0], y2: b[1], layer: 'NOTES' });
      ents.push({ t: 'L', x1: a[0] + nn[0], y1: a[1] + nn[1], x2: b[0] + nn[0], y2: b[1] + nn[1] }, { t: 'L', x1: a[0] - nn[0], y1: a[1] - nn[1], x2: b[0] - nn[0], y2: b[1] - nn[1] });
    }
    const zmin = Math.min(...pts.map(q => q[1]));
    ents.push({ t: 'T', x: -120, y: zmin - 30, h: 12, s: `${p.id} ${p.name}  ${p.tube.label}  developed ${p.cut.toFixed(0)} mm  CLR ${R}`, layer: 'NOTES' });
    p.bends.forEach((b, i) => ents.push({ t: 'T', x: -120, y: zmin - 50 - i * 16, h: 10, s: `Bend ${i + 1}: ${b.deg.toFixed(1)} deg at ${b.at.toFixed(0)} mm (centerline)`, layer: 'NOTES' }));
    return ents;
  }
  if (p.kind === 'turned') {
    const L = p.len, r = p.od / 2, b = p.bore / 2, ex = L + 40, N = 'NOTES', ents = [];
    const ln = (x1, y1, x2, y2, layer) => ents.push({ t: 'L', x1, y1, x2, y2, layer });
    const ch = 0.8; // 0.8 x 45 deg chamfers both ends
    ln(ch, -r, L - ch, -r); ln(L - ch, -r, L, -r + ch); ln(L, -r + ch, L, r - ch); ln(L, r - ch, L - ch, r); ln(L - ch, r, ch, r); ln(ch, r, 0, r - ch); ln(0, r - ch, 0, -r + ch); ln(0, -r + ch, ch, -r);
    ln(0, b, L, b, N); ln(0, -b, L, -b, N); ln(-6, 0, L + 6, 0, N);
    ents.push({ t: 'C', cx: ex + r, cy: 0, r }, { t: 'C', cx: ex + r, cy: 0, r: b, layer: N });
    const tx = (s2, y) => ents.push({ t: 'T', x: 0, y, h: 3.5, s: s2, layer: N });
    tx(`${p.id} ${p.name}  qty ${p.qty}`, r + 22); tx(`OD ${p.od.toFixed(2)} mm (+0/-0.1)   length ${L.toFixed(1)} mm   0.8 x 45 deg chamfer both ends`, r + 15);
    tx(`Thread ${p.thread} through, tap ${p.tapName} (${p.bore.toFixed(2)} mm)`, r + 8);
    tx('Material 4130 or 1018 bar. Weldable. Or buy a weld-in threaded bung of the same size.', -r - 10);
    tx('Both A-arm legs cope onto the OD and weld; the rod end threads in with a jam nut.', -r - 17);
    return ents;
  }
  if (p.kind === 'stube' && p.prof) {
    const pr = p.prof, C = Math.PI * p.tube.od, n = pr.s1.length, y0 = Math.min(...pr.s1), ents = [], P1 = [], P2 = [];
    for (let i = 0; i <= n; i++) { const k = i % n, x = C * i / n; P1.push([x, pr.s1[k] - y0]); P2.push([x, pr.Lc - y0]); }
    for (let i = 1; i <= n; i++) ents.push({ t: 'L', x1: P1[i - 1][0], y1: P1[i - 1][1], x2: P1[i][0], y2: P1[i][1] });
    ents.push({ t: 'L', x1: 0, y1: P2[0][1], x2: C, y2: P2[0][1] }, { t: 'L', x1: 0, y1: P1[0][1], x2: 0, y2: P2[0][1] }, { t: 'L', x1: C, y1: P1[n][1], x2: C, y2: P2[n][1] });
    for (const q of [0.25, 0.5, 0.75]) ents.push({ t: 'L', x1: C * q, y1: P1[Math.round(n * q)][1], x2: C * q, y2: P2[0][1], layer: 'NOTES' });
    const H = P2[0][1];
    ents.push({ t: 'T', x: C + 8, y: H - 6, h: 5, s: `${p.id} ${p.name}`, layer: 'NOTES' },
      { t: 'T', x: C + 8, y: H - 15, h: 4, s: `${p.tube.label}  cut ${p.cut.toFixed(1)} mm long-point, square inboard end`, layer: 'NOTES' },
      { t: 'T', x: C + 8, y: H - 23, h: 4, s: p.thr1 && p.thr1.onLeg ? 'Outboard cope fits the front leg beside the apex bung' : 'Outboard cope fits the apex bung (M01)', layer: 'NOTES' },
      { t: 'T', x: C + 8, y: H - 31, h: 4, s: 'Wrap template 1:1  x = outer circumference', layer: 'NOTES' });
    return ents;
  }
  if (p.kind === 'stube') {
    const L = p.cut, C = Math.PI * p.tube.od;
    return [{ t: 'L', x1: 0, y1: 0, x2: C, y2: 0 }, { t: 'L', x1: C, y1: 0, x2: C, y2: L }, { t: 'L', x1: C, y1: L, x2: 0, y2: L }, { t: 'L', x1: 0, y1: L, x2: 0, y2: 0 },
      { t: 'T', x: C + 8, y: L - 6, h: 5, s: `${p.id} ${p.name}`, layer: 'NOTES' }, { t: 'T', x: C + 8, y: L - 15, h: 4, s: `${p.tube.label} cut ${L.toFixed(1)} mm`, layer: 'NOTES' }];
  }
  return [];
}
const norm2 = a => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; };
function arcEnt(c, r, a0, a1, layer) {
  let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  const s = d >= 0 ? a0 : a0 + d, e = d >= 0 ? a0 + d : a0;
  return { t: 'A', cx: c[0], cy: c[1], r, a0: s * R2D, a1: e * R2D, layer };
}
function shiftEnt(e, dx, dy) {
  const o = { ...e };
  if (e.t === 'L') { o.x1 += dx; o.x2 += dx; o.y1 += dy; o.y2 += dy; } else if (e.t === 'T') { o.x += dx; o.y += dy; } else { o.cx += dx; o.cy += dy; }
  return o;
}
function tubeTris(n1, a, e1, e2, r, t, s1, s2, Lc, out) {
  const n = s1.length, ri = r - t, P = (k, rad, s) => { const th = 2 * Math.PI * k / n, w = vadd(vmul(e1, rad * Math.cos(th)), vmul(e2, rad * Math.sin(th))); return vadd(vadd(n1, vmul(a, s)), w); };
  for (let k = 0; k < n; k++) {
    const k2 = (k + 1) % n;
    const o1 = P(k, r, s1[k]), o2 = P(k2, r, s1[k2]), o3 = P(k2, r, Lc - s2[k2]), o4 = P(k, r, Lc - s2[k]);
    const i1 = P(k, ri, s1[k]), i2 = P(k2, ri, s1[k2]), i3 = P(k2, ri, Lc - s2[k2]), i4 = P(k, ri, Lc - s2[k]);
    out.push([o1, o2, o3], [o1, o3, o4], [i1, i3, i2], [i1, i4, i3], [o1, i2, o2], [o1, i1, i2], [o4, o3, i3], [o4, i3, i4]);
  }
}
function stlBinary(tris) {
  const buf = new ArrayBuffer(84 + tris.length * 50), dv = new DataView(buf);
  dv.setUint32(80, tris.length, true); let o = 84;
  for (const t of tris) { o += 12; for (const p of t) { dv.setFloat32(o, p.x, true); dv.setFloat32(o + 4, p.y, true); dv.setFloat32(o + 8, p.z, true); o += 12; } o += 2; }
  return buf;
}
function memberTris(M, m, out) { const pr = m.prof, t = M.std[m.cat]; tubeTris(pr.n1, pr.a, pr.e1, pr.e2, t.od / 2, t.t, pr.s1, pr.s2, pr.Lc, out); }
function segTris(a, b, od, t, out) {
  const d = vsub(b, a), L = vlen(d), ax = vmul(d, 1 / L); let e1 = vcross(ax, v(0, 0, 1)); if (vlen(e1) < 0.2) e1 = vcross(ax, v(0, 1, 0)); e1 = vnorm(e1);
  const z = new Array(36).fill(0); tubeTris(a, ax, e1, vcross(ax, e1), od / 2, t, z, z, L, out);
}
/* ---------- STEP AP214 writer (exact B-rep: cylinders, planes, tori) ---------- */
const sf = x => { const s = (Math.round(x * 1e6) / 1e6).toString(); return /[.e]/.test(s) ? s : s + '.'; };
const sstr = s => String(s).normalize('NFKD').replace(/[^\x20-\x7E]/g, '').replace(/'/g, "''");
class StepW {
  constructor() { this.n = 0; this.L = []; }
  e(s) { this.n++; this.L.push(`#${this.n}=${s};`); return '#' + this.n; }
  pt(p) { return this.e(`CARTESIAN_POINT('',(${sf(p.x)},${sf(p.y)},${sf(p.z)}))`); }
  dir(d) { d = vnorm(d); return this.e(`DIRECTION('',(${sf(d.x)},${sf(d.y)},${sf(d.z)}))`); }
  ax(o, z, x) { return this.e(`AXIS2_PLACEMENT_3D('',${this.pt(o)},${this.dir(z)},${this.dir(x)})`); }
  vtx(p) { return this.e(`VERTEX_POINT('',${this.pt(p)})`); }
  circle(o, z, x, r) { return this.e(`CIRCLE('',${this.ax(o, z, x)},${sf(r)})`); }
  poly(pts) { // closed degree-1 B-spline through pts (pts[0] repeated at end)
    const ids = pts.map(p => this.pt(p)), n = ids.length;
    const mult = [2, ...Array(n - 2).fill(1), 2], knots = Array.from({ length: n }, (_, i) => sf(i));
    return this.e(`B_SPLINE_CURVE_WITH_KNOTS('',1,(${ids.join(',')}),.UNSPECIFIED.,.T.,.F.,(${mult.join(',')}),(${knots.join(',')}),.UNSPECIFIED.)`);
  }
  line(p, q) { const d = vsub(q, p); return this.e(`LINE('',${this.pt(p)},${this.e(`VECTOR('',${this.dir(d)},${sf(vlen(d))})`)})`); }
  edge(v1, v2, c, s = true) { return this.e(`EDGE_CURVE('',${v1},${v2},${c},${s ? '.T.' : '.F.'})`); }
  oe(e, s) { return this.e(`ORIENTED_EDGE('',*,*,${e},${s ? '.T.' : '.F.'})`); }
  loop(list) { return this.e(`EDGE_LOOP('',(${list.map(([e, s]) => this.oe(e, s)).join(',')}))`); }
  face(bounds, surf, same) { // bounds: [[loopEdges, outer?]]
    const b = bounds.map(([l, outer]) => this.e(`${outer ? 'FACE_OUTER_BOUND' : 'FACE_BOUND'}('',${this.loop(l)},.T.)`));
    return this.e(`ADVANCED_FACE('',(${b.join(',')}),${surf},${same ? '.T.' : '.F.'})`);
  }
  cyl(o, z, x, r) { return this.e(`CYLINDRICAL_SURFACE('',${this.ax(o, z, x)},${sf(r)})`); }
  plane(o, z, x) { return this.e(`PLANE('',${this.ax(o, z, x)})`); }
  ruled(rowA, rowB, closed) { // degree 1 x 1 B-spline surface between two matching point rows (u: A -> B, v: along the rows)
    const a = rowA.map(p => this.pt(p)), b = rowB.map(p => this.pt(p)), n = a.length;
    const mv = [2, ...Array(n - 2).fill(1), 2], kv = Array.from({ length: n }, (_, i) => sf(i));
    return this.e(`B_SPLINE_SURFACE_WITH_KNOTS('',1,1,((${a.join(',')}),(${b.join(',')})),.UNSPECIFIED.,.F.,${closed ? '.T.' : '.F.'},.F.,(2,2),(${mv.join(',')}),(0.,1.),(${kv.join(',')}),.UNSPECIFIED.)`);
  }
  torus(o, z, x, R, r) { return this.e(`TOROIDAL_SURFACE('',${this.ax(o, z, x)},${sf(R)},${sf(r)})`); }
  solid(name, faces) { return this.e(`MANIFOLD_SOLID_BREP('${sstr(name)}',${this.e(`CLOSED_SHELL('',(${faces.join(',')}))`)})`); }
}
const perp = a => { let e = vcross(a, v(0, 0, 1)); if (vlen(e) < 0.2) e = vcross(a, v(0, 1, 0)); return vnorm(e); };
function copeS(ax, b, w, R, rr) {
  let c = vdot(ax, b); if (c < 0) { b = vmul(b, -1); c = -c; }
  const q = 1 - c * c; if (q < 0.03) return 0; const k = vdot(w, b);
  return (c * k + Math.sqrt(Math.max(0, k * k + q * (R * R - rr * rr)))) / q;
}
/* Straight tube from n1 to n2, each end square (null) or coped to {b, R} whose axis passes through that node */
function stepTube(W, name, n1, n2, od, t, end1, end2, NS = 180) {
  // Tube lasers bevel at most 45 deg from square to the wall. At each angle around the tube the cut runs straight through the
  // wall from the OD cope depth to the ID cope depth; where that would lean past the limit, the deeper edge stays on the mating
  // tube and the other edge is pulled back to the 45 deg line, so neither edge runs into the mating tube (the small gap left
  // at the shallow edge is filled by the weld)
  const BEVEL_TAN = Math.tan(44 * D2R);
  const d = vsub(n2, n1), Lc = vlen(d), a = vmul(d, 1 / Lc), e1 = perp(a), e2 = vcross(a, e1), ro = od / 2, ri = ro - t;
  const wv = (th, rr) => vadd(vmul(e1, rr * Math.cos(th)), vmul(e2, rr * Math.sin(th)));
  const rows = {};
  const endCurve = (which, rr) => {
    const end = which === 1 ? end1 : end2, base = which === 1 ? n1 : n2, ax = which === 1 ? a : vmul(a, -1);
    if (!end) { const p0 = vadd(base, wv(0, rr)); return { c: W.circle(base, a, e1, rr), v: W.vtx(p0), p0 }; }
    const pts = [];
    for (let i = 0; i <= NS; i++) { const th = 2 * Math.PI * (i % NS) / NS;
      let so = copeS(ax, end.b, wv(th, ro), end.R, ro), si = copeS(ax, end.b, wv(th, ri), end.R, ri); const lim = t * BEVEL_TAN;
      if (si > so + lim) so = si - lim; else if (so > si + lim) si = so - lim;
      pts.push(vadd(vadd(base, vmul(ax, rr === ro ? so : si)), wv(th, rr))); }
    (rows[which] = rows[which] || {})[rr === ro ? 'o' : 'i'] = pts;
    return { c: W.poly(pts), v: W.vtx(pts[0]), p0: pts[0] };
  };
  const C1o = endCurve(1, ro), C1i = endCurve(1, ri), C2o = endCurve(2, ro), C2i = endCurve(2, ri);
  const E1o = W.edge(C1o.v, C1o.v, C1o.c), E1i = W.edge(C1i.v, C1i.v, C1i.c), E2o = W.edge(C2o.v, C2o.v, C2o.c), E2i = W.edge(C2i.v, C2i.v, C2i.c);
  const So = W.edge(C1o.v, C2o.v, W.line(C1o.p0, C2o.p0)), Si = W.edge(C1i.v, C2i.v, W.line(C1i.p0, C2i.p0));
  const faces = [];
  faces.push(W.face([[[[E1o, true], [So, true], [E2o, false], [So, false]], true]], W.cyl(n1, a, e1, ro), true));
  faces.push(W.face([[[[E1i, false], [Si, true], [E2i, true], [Si, false]], true]], W.cyl(n1, a, e1, ri), false));
  const endFace = (which, Eo, Ei) => {
    const end = which === 1 ? end1 : end2, base = which === 1 ? n1 : n2, nrm = which === 1 ? vmul(a, -1) : a;
    const outerS = which === 2, innerS = which === 1;
    if (!end) return W.face([[[[Eo, outerS]], true], [[[Ei, innerS]], false]], W.plane(base, nrm, e1), true);
    // ruled cut surface outer -> inner (each ruling is the laser line); its normal is about (-r) x theta = -a, out of end 1 and into end 2
    return W.face([[[[Eo, outerS]], true], [[[Ei, innerS]], false]], W.ruled(rows[which].o, rows[which].i, true), which === 1);
  };
  faces.push(endFace(1, E1o, E1i), endFace(2, E2o, E2i));
  return W.solid(name, faces);
}
/* Bent tube along a polyline with centerline radius CLR, square ends */
function stepBentTube(W, name, pts, od, t, CLR) {
  const ro = od / 2, ri = ro - t;
  // build rings and pieces
  const rings = [], pieces = [];
  const ringAt = (c, tg, ref) => ({ c, t: vnorm(tg), e1: ref });
  let ref = null;
  const d0 = vnorm(vsub(pts[1], pts[0]));
  // planar reference normal
  for (let i = 1; i < pts.length - 1 && !ref; i++) { const cr = vcross(vnorm(vsub(pts[i], pts[i - 1])), vnorm(vsub(pts[i + 1], pts[i]))); if (vlen(cr) > 1e-3) ref = vnorm(cr); }
  if (!ref) ref = perp(d0);
  rings.push(ringAt(pts[0], d0, ref));
  for (let i = 1; i < pts.length - 1; i++) {
    const d1 = vnorm(vsub(pts[i], pts[i - 1])), d2 = vnorm(vsub(pts[i + 1], pts[i]));
    const beta = Math.acos(Math.max(-1, Math.min(1, vdot(d1, d2)))); if (beta < 0.5 * D2R) continue;
    const tl = CLR * Math.tan(beta / 2), T1 = vsub(pts[i], vmul(d1, tl)), T2 = vadd(pts[i], vmul(d2, tl));
    const nrm = vnorm(vsub(d2, vmul(d1, vdot(d1, d2)))), O = vadd(T1, vmul(nrm, CLR)), Z = vnorm(vcross(d1, d2));
    pieces.push({ kind: 'cyl' }); rings.push(ringAt(T1, d1, ref));
    pieces.push({ kind: 'tor', O, Z }); rings.push(ringAt(T2, d2, ref));
  }
  pieces.push({ kind: 'cyl' }); rings.push(ringAt(pts[pts.length - 1], vnorm(vsub(pts[pts.length - 1], pts[pts.length - 2])), ref));
  // ring circles: e1 = ref (in-plane normal), e2 = t x e1
  const RC = rings.map(r => {
    const po = vadd(r.c, vmul(r.e1, ro)), pi = vadd(r.c, vmul(r.e1, ri));
    const vo = W.vtx(po), vi = W.vtx(pi);
    return { ...r, po, pi, Eo: W.edge(vo, vo, W.circle(r.c, r.t, r.e1, ro)), Ei: W.edge(vi, vi, W.circle(r.c, r.t, r.e1, ri)), vo, vi };
  });
  const faces = [];
  pieces.forEach((pc, k) => {
    const A = RC[k], B = RC[k + 1];
    let So, Si, so, si;
    if (pc.kind === 'cyl') {
      So = W.edge(A.vo, B.vo, W.line(A.po, B.po)); Si = W.edge(A.vi, B.vi, W.line(A.pi, B.pi));
      so = W.cyl(A.c, A.t, A.e1, ro); si = W.cyl(A.c, A.t, A.e1, ri);
    } else {
      const sgn = vdot(pc.Z, A.e1); // seam circles sit offset along Z by r*sgn
      const Co = W.circle(vadd(pc.O, vmul(pc.Z, ro * sgn)), pc.Z, vsub(A.c, pc.O), CLR);
      const Ci = W.circle(vadd(pc.O, vmul(pc.Z, ri * sgn)), pc.Z, vsub(A.c, pc.O), CLR);
      So = W.edge(A.vo, B.vo, Co); Si = W.edge(A.vi, B.vi, Ci);
      so = W.torus(pc.O, pc.Z, vsub(A.c, pc.O), CLR, ro); si = W.torus(pc.O, pc.Z, vsub(A.c, pc.O), CLR, ri);
    }
    faces.push(W.face([[[[A.Eo, true], [So, true], [B.Eo, false], [So, false]], true]], so, true));
    faces.push(W.face([[[[A.Ei, false], [Si, true], [B.Ei, true], [Si, false]], true]], si, false));
  });
  const F = RC[0], Lr = RC[RC.length - 1];
  faces.push(W.face([[[[F.Eo, false]], true], [[[F.Ei, true]], false]], W.plane(F.c, vmul(F.t, -1), F.e1), true));
  faces.push(W.face([[[[Lr.Eo, true]], true], [[[Lr.Ei, false]], false]], W.plane(Lr.c, Lr.t, Lr.e1), true));
  return W.solid(name, faces);
}
function stepDocument(title, makers) {
  const W = new StepW();
  const appc = W.e(`APPLICATION_CONTEXT('automotive design')`);
  W.e(`APPLICATION_PROTOCOL_DEFINITION('international standard','automotive_design',2000,${appc})`);
  const prc = W.e(`PRODUCT_CONTEXT('',${appc},'mechanical')`);
  const prod = W.e(`PRODUCT('${sstr(title)}','${sstr(title)}','',(${prc}))`);
  W.e(`PRODUCT_RELATED_PRODUCT_CATEGORY('part',$,(${prod}))`);
  const pdf = W.e(`PRODUCT_DEFINITION_FORMATION('','',${prod})`);
  const pdc = W.e(`PRODUCT_DEFINITION_CONTEXT('part definition',${appc},'design')`);
  const pd = W.e(`PRODUCT_DEFINITION('design','',${pdf},${pdc})`);
  const pds = W.e(`PRODUCT_DEFINITION_SHAPE('','',${pd})`);
  const mm = W.e(`(LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.))`);
  const rad = W.e(`(NAMED_UNIT(*) PLANE_ANGLE_UNIT() SI_UNIT($,.RADIAN.))`);
  const sr = W.e(`(NAMED_UNIT(*) SI_UNIT($,.STERADIAN.) SOLID_ANGLE_UNIT())`);
  const unc = W.e(`UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(0.01),${mm},'distance_accuracy_value','confusion accuracy')`);
  const ctx = W.e(`(GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((${unc})) GLOBAL_UNIT_ASSIGNED_CONTEXT((${mm},${rad},${sr})) REPRESENTATION_CONTEXT('Context3D','3D context'))`);
  const origin = W.ax(v(0, 0, 0), v(0, 0, 1), v(1, 0, 0));
  const breps = makers.map(f => f(W));
  const rep = W.e(`ADVANCED_BREP_SHAPE_REPRESENTATION('${sstr(title)}',(${[origin, ...breps].join(',')}),${ctx})`);
  W.e(`SHAPE_DEFINITION_REPRESENTATION(${pds},${rep})`);
  const fname = sstr(title).replace(/[^A-Za-z0-9_-]+/g, '_');
  return `ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('${sstr(title)}','License: MIT License https://opensource.org/licenses/MIT','Attribution: Mac McAlpine, X1Racing.com'),'2;1');\nFILE_NAME('${fname}.step','${new Date().toISOString().slice(0, 19)}',('Mac McAlpine'),('X1Racing.com'),'FSAE Chassis Builder v1.3','github.com/X1Racing/FSAE','MIT License');\nFILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 1 }'));\nENDSEC;\nDATA;\n${W.L.join('\n')}\nENDSEC;\nEND-ISO-10303-21;\n`;
}
/* STEP makers for a part (returns list of {name, makers}) */
function stepMakersForMember(M, m) {
  const t = M.std[m.cat], n1 = M.N[m.a], n2 = M.N[m.b];
  return W => stepTube(W, `${m.part}${m.side === 'C' ? '' : '-' + m.side} ${m.name}`, n1, n2, t.od, t.t, m.thr[0], m.thr[1]);
}
/* Laser-cut plate as an extruded STEP solid in its own 2D frame (x, y in the sketch, z = 0..t):
   outline facets follow the cut path; round holes are true cylinders; slots and rectangular tab slots are planar walls */
function stepPlate(W, name, shape, t) {
  const clean = pts => { const o = []; for (const p of pts) { const q = o[o.length - 1]; if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.2) o.push(p); }
    while (o.length > 2 && Math.hypot(o[0][0] - o[o.length - 1][0], o[0][1] - o[o.length - 1][1]) < 0.2) o.pop(); return o; };
  const area = pts => { let a = 0; for (let i = 0; i < pts.length; i++) { const q = pts[(i + 1) % pts.length]; a += pts[i][0] * q[1] - q[0] * pts[i][1]; } return a / 2; };
  const ccw = pts => area(pts) < 0 ? pts.slice().reverse() : pts;
  const P3 = (p, z) => v(p[0], p[1], z), Z = v(0, 0, 1);
  const faces = [], topB = [], botB = [];
  // polygon loop (outer: material inside; hole: material outside), pts CCW
  const polyLoop = (pts, hole) => {
    const n = pts.length, VB = pts.map(p => W.vtx(P3(p, 0))), VT = pts.map(p => W.vtx(P3(p, t)));
    const EB = [], ET = [], EV = pts.map((p, i) => W.edge(VB[i], VT[i], W.line(P3(p, 0), P3(p, t))));
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; EB.push(W.edge(VB[i], VB[j], W.line(P3(pts[i], 0), P3(pts[j], 0)))); ET.push(W.edge(VT[i], VT[j], W.line(P3(pts[i], t), P3(pts[j], t)))); }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, d = v(pts[j][0] - pts[i][0], pts[j][1] - pts[i][1], 0), nrm = hole ? vnorm(v(-d.y, d.x, 0)) : vnorm(v(d.y, -d.x, 0));
      const loop = hole ? [[EB[i], false], [EV[i], true], [ET[i], true], [EV[j], false]] : [[EB[i], true], [EV[j], true], [ET[i], false], [EV[i], false]];
      faces.push(W.face([[loop, true]], W.plane(P3(pts[i], 0), nrm, d), true));
    }
    topB.push([ET.map((e, i) => [e, !hole]).reduce((a, x) => hole ? [x, ...a] : [...a, x], []), !hole]);
    botB.push([EB.map((e, i) => [e, hole]).reduce((a, x) => hole ? [...a, x] : [x, ...a], []), !hole]);
  };
  polyLoop(ccw(clean(shape.pts)), false);
  for (const h of shape.holes) {
    if (h.rect) { const [w, hh] = h.rect; polyLoop([[h.x - w / 2, h.y - hh / 2], [h.x + w / 2, h.y - hh / 2], [h.x + w / 2, h.y + hh / 2], [h.x - w / 2, h.y + hh / 2]], true); continue; }
    if (h.slot) { const r = h.r, hl = h.slot / 2 - r, pts = []; for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + Math.PI * i / 12; pts.push([h.x + hl + r * Math.cos(a), h.y + r * Math.sin(a)]); }
      for (let i = 0; i <= 12; i++) { const a = Math.PI / 2 + Math.PI * i / 12; pts.push([h.x - hl + r * Math.cos(a), h.y + r * Math.sin(a)]); } polyLoop(ccw(clean(pts)), true); continue; }
    const c0 = v(h.x, h.y, 0), c1 = v(h.x, h.y, t), X = v(1, 0, 0), pB = v(h.x + h.r, h.y, 0), pT = v(h.x + h.r, h.y, t);
    const vB = W.vtx(pB), vT = W.vtx(pT), EB = W.edge(vB, vB, W.circle(c0, Z, X, h.r)), ET = W.edge(vT, vT, W.circle(c1, Z, X, h.r)), S = W.edge(vB, vT, W.line(pB, pT));
    faces.push(W.face([[[[EB, false], [S, true], [ET, true], [S, false]], true]], W.cyl(c0, Z, X, h.r), false));
    topB.push([[[ET, false]], false]); botB.push([[[EB, true]], false]);
  }
  faces.push(W.face(topB, W.plane(v(0, 0, t), Z, v(1, 0, 0)), true), W.face(botB, W.plane(v(0, 0, 0), v(0, 0, -1), v(1, 0, 0)), true));
  return W.solid(name, faces);
}
// tube-laser vendors want one straight tube per file, lying along +Y from the origin: rigidly move every point and direction
function stepAlignY(text, a, b) {
  const u = vnorm(vsub(b, a)), ref = Math.abs(u.z) < 0.9 ? v(0, 0, 1) : v(1, 0, 0), e1 = vnorm(vcross(u, ref)), e3 = vcross(e1, u);
  const R = w => [vdot(w, e1), vdot(w, u), vdot(w, e3)], f = x => (Math.abs(x) < 5e-7 ? 0 : x).toFixed(6);
  // leave the representation's own world placement alone; move only the geometry
  const keep = new Set();
  for (const m of text.matchAll(/SHAPE_REPRESENTATION\([^;]*/g)) for (const r of m[0].matchAll(/#(\d+)/g)) {
    const pl = text.match(new RegExp('#' + r[1] + '=AXIS2_PLACEMENT_3D\\([^,]*,#(\\d+),#(\\d+),#(\\d+)\\)')); if (pl) { keep.add(pl[1]); keep.add(pl[2]); keep.add(pl[3]); } }
  const pts = [], rx = /#(\d+)=CARTESIAN_POINT\('([^']*)',\(([^)]*)\)\)/g;
  for (const m of text.matchAll(rx)) { if (keep.has(m[1])) continue; const q = m[3].split(',').map(Number); if (q.length === 3) pts.push(R(vsub(v(q[0], q[1], q[2]), a))[1]); }
  const y0 = pts.length ? Math.min(...pts) : 0; // first cut edge sits at Y = 0
  return text.replace(rx, (all, id, n, c) => { if (keep.has(id)) return all; const q = c.split(',').map(Number); if (q.length !== 3) return all; const r = R(vsub(v(q[0], q[1], q[2]), a)); r[1] -= y0; return `#${id}=CARTESIAN_POINT('${n}',(${r.map(f).join(',')}))`; })
    .replace(/#(\d+)=DIRECTION\('([^']*)',\(([^)]*)\)\)/g, (all, id, n, c) => { if (keep.has(id)) return all; const q = c.split(',').map(Number); if (q.length !== 3) return all; return `#${id}=DIRECTION('${n}',(${R(v(q[0], q[1], q[2])).map(f).join(',')}))`; });
}
function stepFilesForPart(M, p) {
  const out = [];
  if (p.kind === 'tube') p.members.forEach(i => { const m = M.members[i], nm = `${p.id}${m.side === 'C' ? '' : '-' + m.side} ${p.name}`, A = M.N[m.a], B = M.N[m.b], d = vnorm(vsub(B, A));
    out.push({ name: nm, text: stepAlignY(stepDocument(nm, [stepMakersForMember(M, m)]), A, B) }); });
  else if (p.kind === 'hoop') out.push({ name: `${p.id} ${p.name}`, text: stepDocument(`${p.id} ${p.name}`, [W => stepBentTube(W, `${p.id} ${p.name}`, p.pts, p.tube.od, p.tube.t, p.CLR)]) });
  else if (p.kind === 'turned') out.push({ name: `${p.id} ${p.name}`, text: stepDocument(`${p.id} ${p.name}`, [W => stepTube(W, `${p.id} ${p.name} (thread not modeled, bore = tap drill)`, v(0, 0, 0), v(0, 0, p.len), p.od, (p.od - p.bore) / 2, null, null)]) });
  else if (p.kind === 'plate') out.push({ name: `${p.id} ${p.name}`, text: stepDocument(`${p.id} ${p.name}`, [W => stepPlate(W, `${p.id} ${p.name} (${PMAT[p.mat].label})`, p.shape, PMAT[p.mat].t)]) });
  else if (p.kind === 'stube' && p.prof) out.push({ name: `${p.id} ${p.name}`, text: stepAlignY(stepDocument(`${p.id} ${p.name}`, [W => stepTube(W, `${p.id} ${p.name}`, p.prof.n1, p.prof.n2, p.tube.od, p.tube.t, p.thr1, null)]), p.prof.n1, p.prof.n2) });
  else if (p.kind === 'stube') {
    const [a, b] = p.ends, d = vnorm(vsub(b, a));
    const n1 = vadd(a, vmul(d, p.offA)), n2 = vsub(b, vmul(d, p.offB));
    out.push({ name: `${p.id} ${p.name}`, text: stepAlignY(stepDocument(`${p.id} ${p.name}`, [W => stepTube(W, `${p.id} ${p.name}`, n1, n2, p.tube.od, p.tube.t, null, null)]), n1, n2) });
  }
  return out;
}
const std_od = (M, m) => (M.std[m.cat] || { od: 25.4 }).od;
function stepFrameAssembly(M) {
  const makers = M.members.map(m => stepMakersForMember(M, m));
  M.parts.filter(p => p.kind === 'hoop').forEach(p => makers.push(W => stepBentTube(W, `${p.id} ${p.name}`, p.pts, p.tube.od, p.tube.t, p.CLR)));
  return stepDocument('Single-cylinder FSAE frame', makers);
}

/* ---------- SendCutSend rules (from their published file guidelines) ---------- */
const SCS = {
  tubeMaxLen: 1524, // 60 in maximum tube cut length
  matName: { ST6: '4130 Chromoly .250"', ST3: '4130 Chromoly .125"', ST5: '4130 Chromoly .187"', AL1: '5052 H32 Aluminum .063"', AL3: '5052 H32 Aluminum .125"', AL6: '6061 T6 Aluminum .250"', AL10: '6061 T6 Aluminum .375"' }
};
function scsPlateIssues(p) {
  const t = PMAT[p.mat].t, iss = [];
  for (const h of p.shape.holes) if (2 * h.r < 0.5 * t) iss.push(`hole ${(2 * h.r).toFixed(1)} mm under 50% of thickness`);
  return iss;
}
// SendCutSend 4130 round tube list as published Nov 2026: 1.00 x .095 in and 25.4 x 1.65 mm (1.000 x .065 in); other sizes go to another tube-laser shop or get cut by hand
SCS.tube4130 = [[25.4, 2.413], [25.4, 1.651]];
// OSH Cut stock (list_materials, Nov 2026): sheet material_sheet_id by plate code; round tube material_tube_id by OD/wall (mm).
// 4130 cold drawn where stocked; `sub` notes a substitution the cart will use
const OSH = {
  sheets: { ST3: 151, ST5: 153, ST6: 154, AL1: 14, AL3: 15, AL6: 76, AL10: 79 },
  tubes: [
    { od: 25.4, t: 1.245, id: 310 }, { od: 25.4, t: 1.651, id: 275 }, { od: 25.4, t: 2.413, id: 345 }, { od: 19.05, t: 1.651, id: 273 },
    { od: 22.225, t: 2.108, id: 320, sub: '1020 DOM 0.875 × .083 (no 4130 in that size)' },
    { od: 15.875, t: 1.245, id: 315, sub: '4130 0.625 × .065 (no .049 wall stocked)' }
  ]
};
function oshTube(t) { return t && OSH.tubes.find(q => Math.abs(q.od - t.od) < 0.3 && Math.abs(q.t - t.t) < 0.15) || null; }
function scsTubeIssues(p) { const iss = []; if (p.cut > SCS.tubeMaxLen) iss.push(`length ${p.cut.toFixed(0)} mm over 60 in`);
  const t = p.tube; if (t && !SCS.tube4130.some(([od, w]) => Math.abs(od - t.od) < 0.3 && Math.abs(w - t.t) < 0.15)) iss.push(`${t.label} not in the SendCutSend 4130 round list (1.000 × .095, 1.000 × .065 in): upsize, use another tube-laser shop, or cut by hand`);
  return iss; }
if (typeof module !== 'undefined') module.exports = { OSH, oshTube, SHOCKS, FOX, withShock, scsPlateIssues, scsTubeIssues, SCS, stepFilesForPart, stepFrameAssembly, build, partCost, DEFAULT_RATES, partEntities, dxfText, memberTris, segTris, stlBinary, BUY, WHEELS };
