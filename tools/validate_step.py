"""Independent STEP B-rep validator for the builder's output (structure + geometry + orientation)."""
import re, sys, math, glob

def parse(path):
    txt = open(path).read()
    data = txt.split('DATA;', 1)[1].rsplit('ENDSEC;', 1)[0]
    ents = {}
    for m in re.finditer(r'#(\d+)=(.*?);\s*(?=#\d+=|$)', data, re.S):
        ents[int(m.group(1))] = m.group(2).strip()
    return ents

def args(s):
    s = s[s.index('(') + 1: s.rindex(')')]
    out, depth, cur, q = [], 0, '', False
    for ch in s:
        if ch == "'" : q = not q
        if not q and ch == '(':
            depth += 1
        if not q and ch == ')':
            depth -= 1
        if not q and ch == ',' and depth == 0:
            out.append(cur.strip()); cur = ''
        else:
            cur += ch
    out.append(cur.strip())
    return out

def lst(s): return [x.strip() for x in s.strip()[1:-1].split(',') if x.strip()]
def ref(s): return int(s.strip()[1:])
def name(s): return s.split('(', 1)[0].strip()

def sub(a, b): return [a[i] - b[i] for i in range(3)]
def add(a, b): return [a[i] + b[i] for i in range(3)]
def mul(a, k): return [x * k for x in a]
def dot(a, b): return sum(a[i] * b[i] for i in range(3))
def cross(a, b): return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]
def ln(a): return math.sqrt(dot(a, a))
def nrm(a): l = ln(a); return [x / l for x in a]

def check(path, tol=0.025):
    E = parse(path); errs = []
    for k, s in E.items():
        for r in re.findall(r'#(\d+)', s):
            if int(r) not in E: errs.append(f'#{k} refs missing #{r}')
    P = lambda r: [float(x) for x in lst(args(E[r])[1])]
    D = lambda r: nrm([float(x) for x in lst(args(E[r])[1])])
    def AX(r):
        a = args(E[r]); z = D(ref(a[2])); x = D(ref(a[3])); x = nrm(sub(x, mul(z, dot(x, z)))); return P(ref(a[1])), z, x, cross(z, x)
    def curve_samples(r, n=48):
        t = name(E[r]); a = args(E[r])
        if t == 'CIRCLE':
            o, z, x, y = AX(ref(a[1])); R = float(a[2])
            return [add(o, add(mul(x, R*math.cos(2*math.pi*i/n)), mul(y, R*math.sin(2*math.pi*i/n)))) for i in range(n)]
        if t == 'LINE':
            p = P(ref(a[1])); va = args(E[ref(a[2])]); d = D(ref(va[1])); L = float(va[2])
            return [add(p, mul(d, L * i / n)) for i in range(n + 1)]
        if t.startswith('B_SPLINE'):
            pts = [P(ref(x)) for x in lst(a[2])]; out = []
            for i in range(len(pts) - 1):
                out.append(pts[i]); out.append(mul(add(pts[i], pts[i+1]), 0.5))
            return out
        errs.append('unknown curve ' + t); return []
    def surf_dist(r, p):
        t = name(E[r]); a = args(E[r])
        if t == 'PLANE':
            o, z, _, _ = AX(ref(a[1])); return abs(dot(sub(p, o), z))
        if t == 'CYLINDRICAL_SURFACE':
            o, z, _, _ = AX(ref(a[1])); R = float(a[2]); d = sub(p, o); d = sub(d, mul(z, dot(d, z))); return abs(ln(d) - R)
        if t == 'TOROIDAL_SURFACE':
            o, z, _, _ = AX(ref(a[1])); R, r_ = float(a[2]), float(a[3]); d = sub(p, o); h = dot(d, z); rad = ln(sub(d, mul(z, h)))
            return abs(math.hypot(rad - R, h) - r_)
        if t == 'B_SPLINE_SURFACE_WITH_KNOTS':
            A, B = bs_rows(r); best = 1e9
            for i in range(len(A) - 1):
                for (p0, p1) in ((A[i], A[i+1]), (B[i], B[i+1]), (A[i], B[i])):
                    dv = sub(p1, p0); L2 = dot(dv, dv) or 1e-12; tt = max(0, min(1, dot(sub(p, p0), dv) / L2)); best = min(best, ln(sub(p, add(p0, mul(dv, tt)))))
            return best
        errs.append('unknown surface ' + t); return 0
    bs_cache = {}
    def bs_rows(r):
        if r not in bs_cache:
            a = args(E[r]); grid = a[3]
            rows_ = [[P(int(x)) for x in re.findall(r'#(\d+)', row)] for row in re.findall(r'\(([^()]*)\)', grid)]
            bs_cache[r] = (rows_[0], rows_[1])
        return bs_cache[r]
    def surf_normal(r, p):
        t = name(E[r]); a = args(E[r])
        if t == 'B_SPLINE_SURFACE_WITH_KNOTS':
            A, B = bs_rows(r); i = min(range(len(A) - 1), key=lambda k: ln(sub(p, mul(add(add(A[k], A[k+1]), add(B[k], B[k+1])), 0.25))))
            return nrm(cross(sub(B[i], A[i]), sub(A[i+1], A[i])))
        o, z, _, _ = AX(ref(a[1]))
        if t == 'PLANE': return z
        d = sub(p, o)
        if t == 'CYLINDRICAL_SURFACE': return nrm(sub(d, mul(z, dot(d, z))))
        R = float(a[2]); h = dot(d, z); radv = sub(d, mul(z, h)); c = add(o, mul(nrm(radv), R)); return nrm(sub(p, c))
    shells = [k for k, s in E.items() if name(s) == 'CLOSED_SHELL']
    nfaces = 0
    for sh in shells:
        use = {}
        for fr in map(ref, lst(args(E[sh])[1])):
            nfaces += 1
            fa = args(E[fr]); surf = ref(fa[2]); same = fa[3] == '.T.'
            bounds = lst(fa[1]); bdata = []
            for br in map(ref, bounds):
                ba = args(E[br]); outer = name(E[br]) == 'FACE_OUTER_BOUND'
                loop = lst(args(E[ref(ba[1])])[1]); seq = []
                for oe in loop:
                    oa = args(E[ref(oe)]); er = ref(oa[3]); s = oa[4] == '.T.'
                    ea = args(E[er]); v1, v2, cr = ref(ea[1]), ref(ea[2]), ref(ea[3])
                    use.setdefault(er, []).append(s)
                    a_, b_ = (v1, v2) if s else (v2, v1); seq.append((a_, b_, er, s, cr))
                    for vr in (v1, v2):
                        vp = P(ref(args(E[vr])[1]))
                        if name(E[cr]) == 'CIRCLE':
                            ca = args(E[cr]); o, z, _, _ = AX(ref(ca[1])); R = float(ca[2]); d = sub(vp, o); h = dot(d, z)
                            dv = math.hypot(ln(sub(d, mul(z, h))) - R, h)
                        else:
                            dv = min(ln(sub(vp, q)) for q in curve_samples(cr, 360))
                        if dv > tol: errs.append(f'vertex #{vr} off curve #{cr} by {dv:.4f}')
                    for q in curve_samples(cr):
                        dd = surf_dist(surf, q)
                        if dd > tol: errs.append(f'face #{fr} curve #{cr} off surface by {dd:.4f}'); break
                for i in range(len(seq)):
                    if seq[i][1] != seq[(i + 1) % len(seq)][0]: errs.append(f'face #{fr} loop not connected')
                bdata.append((outer, seq))
            # orientation: left of non-seam edges must point into face region
            outer_pts = []
            for outer, seq in bdata:
                if outer:
                    for (_, _, er, s, cr) in seq: outer_pts += curve_samples(cr)
            cen = mul([sum(p[i] for p in outer_pts) for i in range(3)], 1 / len(outer_pts))
            planar = name(E[surf]) == 'PLANE'
            if planar:  # exact test: a step to the left of each edge (seen from the face normal) must land inside the face region
                o, z, x, y = AX(ref(args(E[surf])[1]))
                to2 = lambda q: (dot(sub(q, o), x), dot(sub(q, o), y))
                polys = [(outer, [to2(q) for (_, _, er, s, cr) in seq for q in (curve_samples(cr, 64) if s else list(reversed(curve_samples(cr, 64))))]) for outer, seq in bdata]
                def pin(px, py, poly):
                    ins = False; n_ = len(poly)
                    for i in range(n_):
                        x1, y1 = poly[i]; x2, y2 = poly[(i + 1) % n_]
                        if (y1 > py) != (y2 > py) and px < (x2 - x1) * (py - y1) / (y2 - y1) + x1: ins = not ins
                    return ins
                def inside(px, py): return all(pin(px, py, pl) == ob for ob, pl in polys)
            for outer, seq in bdata:
                for (_, _, er, s, cr) in seq:
                    if sum(1 for x in seq if x[2] == er) > 1: continue  # seam
                    cs = curve_samples(cr, 96); k = min(7, len(cs) // 2) if len(cs) > 3 else 1
                    p = mul(add(cs[k - 1], cs[k]), 0.5) if planar and len(cs) <= 3 else cs[k]
                    tg = sub(cs[k], cs[k - 1]) if planar and len(cs) <= 3 else sub(cs[k + 1], cs[k - 1])
                    if not s: tg = mul(tg, -1)
                    n = surf_normal(surf, p); n = n if same else mul(n, -1)
                    left = cross(n, nrm(tg))
                    if planar:
                        q = add(p, mul(left, 0.05)); ok = inside(*to2(q)) == True
                    else:
                        score = dot(left, sub(cen, p)); ok = score > 0 if outer else score < 0
                    if not ok: errs.append(f'face #{fr} ({name(E[surf])}) edge #{er} wrong orientation (outer={outer})')
        for er, ss in use.items():
            if len(ss) != 2 or ss[0] == ss[1]: errs.append(f'edge #{er} uses {ss}')
    return errs, len(shells), nfaces

if __name__ == '__main__':
    bad = 0; tot = 0
    for f in sorted(glob.glob(sys.argv[1])):
        errs, ns, nf = check(f); tot += 1
        if errs:
            bad += 1; print(f, ns, nf, errs[:6])
    print(f'{tot} files checked, {bad} with errors')
