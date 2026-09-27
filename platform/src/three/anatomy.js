// Procedural brain anatomy. Everything is built from maths at load time: no downloaded model, no licence questions.
//
// Coordinates (object space): +z anterior (frontal pole at z ≈ +1), +y superior, +x the patient's right.
// The cerebrum is 2.0 long front to back. Each hemisphere is a lofted superellipse whose coronal cross-section
// changes along z (frontal and occipital taper, temporal lobe hanging low and lateral, flat medial face), then gyri
// and sulci are carved along the normal with a domain-warped ridged noise plus the big named fissures.
import * as THREE from 'three';
import { makeNoise, makeRandom, smoothstep as ss, gauss, lerp } from './noise.js';

export const REGION = { frontal: 0, parietal: 1, temporal: 2, occipital: 3, cerebellum: 4, stem: 5 };

/* ---------------------------------------------------------------- icosphere (recursive subdivision) */
export function icosphere(level) {
  const t = (1 + Math.sqrt(5)) / 2;
  const v = [];
  const add = (x, y, z) => { const l = Math.hypot(x, y, z); v.push(x / l, y / l, z / l); return v.length / 3 - 1; };
  [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]]
    .forEach(([x, y, z]) => add(x, y, z));
  let f = [0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
    3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1];
  for (let l = 0; l < level; l++) {
    const cache = new Map();
    const mid = (a, b) => {
      const key = a < b ? a * 1e7 + b : b * 1e7 + a;
      let m = cache.get(key);
      if (m === undefined) { m = add(v[a * 3] + v[b * 3], v[a * 3 + 1] + v[b * 3 + 1], v[a * 3 + 2] + v[b * 3 + 2]); cache.set(key, m); }
      return m;
    };
    const nf = new Array(f.length * 4);
    let k = 0;
    for (let i = 0; i < f.length; i += 3) {
      const a = f[i], b = f[i + 1], c = f[i + 2];
      const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
      nf[k++] = a; nf[k++] = ab; nf[k++] = ca;
      nf[k++] = b; nf[k++] = bc; nf[k++] = ab;
      nf[k++] = c; nf[k++] = ca; nf[k++] = bc;
      nf[k++] = ab; nf[k++] = bc; nf[k++] = ca;
    }
    f = nf;
  }
  return { pos: new Float32Array(v), index: f.length > 65535 * 3 ? new Uint32Array(f) : new Uint32Array(f) };
}

function geometryFrom(pos, index, attrs = {}) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  for (const [k, [arr, size]] of Object.entries(attrs)) g.setAttribute(k, new THREE.BufferAttribute(arr, size));
  g.setIndex(new THREE.BufferAttribute(index, 1));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

/** Superellipse component: sign(c)·|c|^(2/n). n = 2 is an ellipse, larger n is boxier. */
const se = (c, n) => Math.sign(c) * Math.abs(c) ** (2 / n);

/* ---------------------------------------------------------------- hemisphere outline (the "clay" before folding) */
const MEDIAL = 0.02; // half of the longitudinal fissure gap

/** Lateral extent (medial plane → lateral surface) before pole capping. Widest over the parietal/temporal region. */
const widthAt = (z) => 0.80 - 0.17 * ss(-0.05, 0.95, z) - 0.08 * ss(-0.45, -1.0, z) + 0.02 * gauss(z + 0.3, 0.35);
/** Pole capping: frontal pole blunt (superellipse 2.6), occipital pole a little more pointed (2.1). */
const capAt = (z) => { const p = z > 0 ? 2.7 : 2.45; return Math.max(0, 1 - Math.abs(z) ** p) ** (1 / p); };
/** Height of the widest lateral point (the coronal section is a "D": flat medial face, dome, widest low). */
const centreY = (z) => -0.03 + 0.12 * ss(0.3, 0.95, z) - 0.03 * ss(-0.5, -1.0, z);
const topAt = (z) => 0.72 + 0.05 * gauss(z + 0.1, 0.55) - 0.12 * ss(-0.35, -1.0, z) - 0.05 * ss(0.45, 1.0, z);
/** Absolute base height: lateral (temporal lobe hangs low) and medial (diencephalon, higher). */
const bottomLatAt = (z) => {
  const front = lerp(-0.15, -0.56, ss(0.46, 0.28, z)); // orbital surface → temporal pole
  const back = lerp(-0.56, -0.34, ss(-0.38, -0.74, z)); // temporal base → occipital base on the tentorium
  return z > -0.1 ? front : Math.max(front, back);
};
const bottomMedAt = (z) => lerp(-0.15, -0.28, ss(0.55, 0.15, z)) + 0.02 * ss(-0.4, -0.85, z);

function hemiBase(ux, uy, uz) {
  const z = uz;
  const r = Math.hypot(ux, uy) || 1e-9;
  const cx = ux / r, cy = uy / r;
  const cap = capAt(z);
  const W = widthAt(z) * cap; // medial plane → lateral surface
  const yc = centreY(z);
  const MR = 0.075 * Math.sqrt(cap); // rounding of the superomedial margin
  const tLobe = ss(0.46, 0.3, z) * ss(-0.74, -0.36, z); // temporal lobe span along z
  let x, y;
  if (cy >= 0) {
    const Rt = (topAt(z) - yc) * cap;
    x = cx >= 0 ? MEDIAL + MR + (W - MR) * se(cx, 2.05) : MEDIAL + MR + MR * se(cx, 2.4);
    y = yc + Rt * se(cy, 2.0);
  } else {
    const latness = ss(-0.4, 0.7, cx);
    const Rb = (yc - lerp(bottomMedAt(z), bottomLatAt(z), latness)) * cap;
    const Wb = W * 0.52;
    const bulge = 1 + 0.08 * tLobe * Math.sin(Math.PI * Math.min(1, -cy * 1.4)) * Math.max(0, cx); // temporal lobe bulges low-laterally
    x = cx >= 0 ? MEDIAL + Wb + (W - Wb) * se(cx, 2.0) * bulge : MEDIAL + Wb + Wb * se(cx, 3.2);
    y = yc + Rb * se(cy, 2.5);
  }
  return [x, y, z];
}

/* ---------------------------------------------------------------- named fissures, as curves in the lateral (z, y) view */
function distToPolyline(z, y, pts) {
  let best = 1e9, bestT = 0, acc = 0, total = 0;
  for (let i = 0; i < pts.length - 1; i++) total += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
  for (let i = 0; i < pts.length - 1; i++) {
    const [az, ay] = pts[i], [bz, by] = pts[i + 1];
    const dz = bz - az, dy = by - ay, L2 = dz * dz + dy * dy, L = Math.sqrt(L2);
    let t = ((z - az) * dz + (y - ay) * dy) / L2; t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(z - (az + t * dz), y - (ay + t * dy));
    if (d < best) { best = d; bestT = (acc + t * L) / total; }
    acc += L;
  }
  return [best, bestT];
}
// Sylvian (lateral) fissure: from the temporal stem forward-low to its posterior ascending ramus.
const SYLVIAN = [[0.40, -0.2], [0.22, -0.1], [0.0, -0.04], [-0.22, 0.02], [-0.38, 0.1], [-0.46, 0.22]];
const sylvianY = (z) => {
  // y of the fissure at a given z (for region tests)
  for (let i = 0; i < SYLVIAN.length - 1; i++) {
    const [az, ay] = SYLVIAN[i], [bz, by] = SYLVIAN[i + 1];
    if (z <= az && z >= bz) return lerp(ay, by, (az - z) / (az - bz));
  }
  return z > SYLVIAN[0][0] ? SYLVIAN[0][1] : SYLVIAN[SYLVIAN.length - 1][1];
};
// Central sulcus: from the vertex down and forward to just above the Sylvian fissure. zc as a function of height.
const centralZ = (y) => -0.1 + 0.26 * ss(0.72, -0.02, y) + 0.022 * Math.sin(y * 19.0) + 0.012 * Math.sin(y * 41.0 + 1.3);

/* ---------------------------------------------------------------- hemisphere */
export function buildHemisphere(level, side = 1, seed = 11) {
  const { pos: dir, index } = icosphere(level);
  const n = dir.length / 3;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const p = hemiBase(dir[i * 3], dir[i * 3 + 1], dir[i * 3 + 2]);
    pos[i * 3] = p[0]; pos[i * 3 + 1] = p[1]; pos[i * 3 + 2] = p[2];
  }
  // base normals from the smooth clay, so displacement goes along a stable direction
  const g0 = geometryFrom(pos.slice(), index);
  const nrm = g0.getAttribute('normal').array;
  g0.dispose();

  const { noise3 } = makeNoise(seed + (side > 0 ? 0 : 101));
  const depth = new Float32Array(n);
  const region = new Float32Array(n);
  const F1 = 4.6, WARP = 0.11, AMP = 0.06;
  let maxD = 0;
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const nx = nrm[i * 3], ny = nrm[i * 3 + 1], nz = nrm[i * 3 + 2];
    const lateral = ss(0.15, 0.6, nx); // facing sideways (not the medial face, not the base)
    const medial = ss(-0.5, -0.9, nx);

    // domain warp → meandering gyri
    const wx = x + WARP * noise3(x * 1.7 + 11.3, y * 1.7, z * 1.7);
    const wy = y + WARP * noise3(x * 1.7, y * 1.7 + 7.1, z * 1.7);
    const wz = z + WARP * noise3(x * 1.7, y * 1.7, z * 1.7 + 3.7);

    const sy = sylvianY(z);
    const zc = centralZ(y);
    const above = ss(sy - 0.02, sy + 0.08, y);
    const frontalW = ss(zc + 0.1, zc + 0.3, z) * above;
    const temporalW = (1 - above) * ss(-0.7, -0.4, z) * (1 - medial);
    // gyri run front→back in the frontal and temporal lobes: stretch the noise along z there
    const aniso = Math.max(frontalW * 0.75, temporalW * 0.8);
    const sz = lerp(1, 0.52, aniso);
    const nIso = noise3(wx * F1, wy * F1, wz * F1);
    const nAni = noise3(wx * F1 * 1.08 + 40, wy * F1 * 1.08, wz * F1 * sz);
    const n1 = lerp(nIso, nAni, aniso);
    const g1 = Math.abs(n1);
    let sulcus = (1 - ss(0.0, 0.24, g1)) ** 1.4; // narrow cleft where the noise crosses zero
    const round = 1 - ss(0.1, 0.6, g1); // rounded gyral shoulders
    const n2 = noise3(wx * F1 * 1.9 + 17, wy * F1 * 1.9, wz * F1 * 1.9);
    const tert = (1 - ss(0.0, 0.12, Math.abs(n2))) * ss(0.3, 0.6, g1);

    // pre- and postcentral gyri: two long, clean vertical ridges either side of the central sulcus
    const dC = z - zc;
    const cband = above * (1 - medial * 0.6) * ss(-0.1, 0.25, ny + nx);
    const inBand = cband * gauss(dC, 0.13);
    sulcus *= 1 - 0.25 * inBand;

    let d = AMP * (0.8 * sulcus + 0.2 * round) + AMP * 0.28 * tert * (1 - inBand * 0.7);
    const dNoise = d;

    // named fissures (along the base normal)
    const [dS, tS] = distToPolyline(z, y, SYLVIAN);
    const syl = gauss(dS, 0.034) * lateral * (1 - 0.45 * tS) * ss(0.46, 0.36, z);
    d += 0.12 * syl;
    // temporal stem notch between the temporal pole and the orbital frontal lobe
    d += 0.1 * gauss(dS, 0.055) * ss(0.12, 0.4, z) * ss(0.5, 0.36, z) * ss(-0.5, 0.1, nx) * (1 - medial);
    const central = gauss(dC, 0.018) * cband * ss(sy + 0.02, sy + 0.1, y);
    d += 0.065 * central;
    d += 0.042 * gauss(dC - 0.15, 0.017) * cband * ss(sy + 0.05, sy + 0.14, y); // precentral
    d += 0.04 * gauss(dC + 0.14, 0.017) * cband * ss(sy + 0.08, sy + 0.16, y) * ss(0.62, 0.45, y + 0.0); // postcentral
    const sts = gauss(y - (sy - 0.14 - 0.05 * ss(0.1, -0.4, z)), 0.018) * lateral * ss(0.36, 0.2, z) * ss(-0.72, -0.5, z);
    d += 0.045 * sts;
    // superior and inferior frontal sulci
    const fz = ss(zc + 0.18, zc + 0.26, z) * ss(0.92, 0.7, z) * lateral;
    d += 0.035 * gauss(y - (0.45 - 0.12 * ss(0.2, 0.9, z)), 0.016) * fz;
    d += 0.03 * gauss(y - (0.19 - 0.02 * ss(0.2, 0.9, z)), 0.016) * fz;

    // keep the medial face from bulging across the fissure; only ever push inward
    pos[i * 3] = x - nx * d;
    pos[i * 3 + 1] = y - ny * d;
    pos[i * 3 + 2] = z - nz * d;
    // shading depth: the noise sulci and the named fissures both reach full darkness
    depth[i] = Math.min(1, Math.max(dNoise / AMP, (d - dNoise) / 0.05 + dNoise / AMP * 0.5));
    if (d > maxD) maxD = d;

    let reg = REGION.parietal;
    if (y < sy - 0.01 && z > -0.62 && !(medial > 0.5 && y > -0.1)) reg = REGION.temporal;
    else if (z > zc) reg = REGION.frontal;
    else if (z < -0.66 + 0.1 * ss(0.6, 0.0, y)) reg = REGION.occipital;
    region[i] = reg;
  }
  if (side < 0) {
    for (let i = 0; i < n; i++) pos[i * 3] *= -1;
    for (let i = 0; i < index.length; i += 3) { const t = index[i + 1]; index[i + 1] = index[i + 2]; index[i + 2] = t; }
  }
  return geometryFrom(pos, index, { aDepth: [depth, 1], aRegion: [region, 1] });
}

/** Lobe at a point on (or near) the cerebral surface; same rules the builder uses. */
export function regionAt(x, y, z) {
  const sy = sylvianY(z);
  const zc = centralZ(y);
  const medial = Math.abs(x) < 0.09;
  if (y < sy - 0.01 && z > -0.62 && !(medial && y > -0.1)) return REGION.temporal;
  if (z > zc) return REGION.frontal;
  if (z < -0.66 + 0.1 * ss(0.6, 0.0, y)) return REGION.occipital;
  return REGION.parietal;
}

/* ---------------------------------------------------------------- cerebellum with folia */
export const CEREBELLUM_C = [0, -0.5, -0.5];
export function buildCerebellum(level, seed = 5) {
  const { pos: dir, index } = icosphere(level);
  const n = dir.length / 3;
  const { noise3 } = makeNoise(seed);
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const ux = dir[i * 3], uy = dir[i * 3 + 1], uz = dir[i * 3 + 2];
    let x = 0.57 * se(ux, 2.3);
    let y = uy > 0 ? 0.14 * se(uy, 3.0) : 0.25 * se(uy, 2.1);
    let z = uz > 0 ? 0.2 * uz : 0.34 * se(uz, 2.2);
    // two lateral hemispheres around the vermis: posterior and inferior midline notch
    const mid = gauss(x, 0.09);
    z *= 1 - 0.16 * mid * ss(0.1, -0.7, uz);
    y *= 1 - 0.1 * mid * ss(0.0, -0.8, uy);
    // tentorial surface slopes down toward the back and the sides
    y += 0.09 * uz - 0.08 * x * x + 0.035 * Math.max(0, uy) * mid;
    pos[i * 3] = x + CEREBELLUM_C[0]; pos[i * 3 + 1] = y + CEREBELLUM_C[1]; pos[i * 3 + 2] = z + CEREBELLUM_C[2];
  }
  const g0 = geometryFrom(pos.slice(), index);
  const nrm = g0.getAttribute('normal').array;
  g0.dispose();
  const depth = new Float32Array(n), region = new Float32Array(n).fill(REGION.cerebellum);
  let maxD = 0;
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1] - CEREBELLUM_C[1], z = pos[i * 3 + 2] - CEREBELLUM_C[2];
    // folia: fine leaves wrapped around the transverse axis
    // elevation from the cerebellar centre: folia read as stacked horizontal arcs from behind and from the side
    const th = Math.atan2(y + 0.02, Math.hypot(z, 0.55 * x)) * 1.6 + 0.05 * noise3(x * 4, y * 4, z * 4);
    const f = Math.sin(th * 13);
    let d = 0.012 * (1 - ss(0.0, 0.5, Math.abs(f)));
    d += 0.03 * gauss(th - 0.05, 0.035); // horizontal fissure
    d += 0.022 * gauss(th - 1.35, 0.04); // primary fissure
    d += 0.02 * gauss(x, 0.03) * ss(0.2, -0.5, z / 0.3); // vermis groove behind
    const nx = nrm[i * 3], ny = nrm[i * 3 + 1], nz = nrm[i * 3 + 2];
    pos[i * 3] -= nx * d; pos[i * 3 + 1] -= ny * d; pos[i * 3 + 2] -= nz * d;
    depth[i] = d; if (d > maxD) maxD = d;
  }
  for (let i = 0; i < n; i++) depth[i] = Math.min(1, depth[i] / (maxD * 0.7));
  return geometryFrom(pos, index, { aDepth: [depth, 1], aRegion: [region, 1] });
}

/* ---------------------------------------------------------------- brainstem: tapered tube with the pons bulge */
export function buildBrainstem(rings = 72, segs = 48) {
  const spine = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.12, -0.08), new THREE.Vector3(0, -0.38, -0.12),
    new THREE.Vector3(0, -0.62, -0.2), new THREE.Vector3(0, -0.86, -0.3),
  ]);
  const frames = spine.computeFrenetFrames(rings, false);
  const pos = [], depth = [], idx = [];
  for (let r = 0; r <= rings; r++) {
    const t = r / rings;
    const c = spine.getPointAt(t);
    const T = spine.getTangentAt(t);
    // stable frame: "forward" is +z projected off the tangent
    const fwd = new THREE.Vector3(0, 0, 1).addScaledVector(T, -T.z).normalize();
    const side = new THREE.Vector3().crossVectors(T, fwd).normalize();
    const rad = lerp(0.15, 0.092, ss(0.3, 1.0, t));
    for (let s = 0; s <= segs; s++) {
      const a = (s / segs) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const pons = 0.6 * gauss(t - 0.33, 0.13) * Math.max(0, ca) ** 1.2 + 0.16 * gauss(t - 0.33, 0.14);
      const pyramids = 0.06 * gauss(t - 0.72, 0.16) * Math.max(0, ca) * (1 - Math.abs(sa) * 0.3);
      const striae = 0.012 * gauss(t - 0.34, 0.1) * Math.max(0, ca) * (0.5 + 0.5 * Math.sin(t * 160));
      const rr = rad * (1 + pons + pyramids) - striae * 0.4;
      const wide = 1 + 0.25 * gauss(t - 0.33, 0.18) + 0.3 * ss(0.15, 0.0, t); // pons wider than deep; peduncles splay upward
      pos.push(c.x + (fwd.x * ca + side.x * sa * wide) * rr, c.y + (fwd.y * ca + side.y * sa * wide) * rr, c.z + (fwd.z * ca + side.z * sa * wide) * rr);
      depth.push(0.15 + striae * 20);
    }
  }
  void frames;
  const row = segs + 1;
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < segs; s++) {
      const a = r * row + s, b = a + row;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const n = pos.length / 3;
  return geometryFrom(new Float32Array(pos), new Uint32Array(idx), { aDepth: [new Float32Array(depth), 1], aRegion: [new Float32Array(n).fill(REGION.stem), 1] });
}

/* ---------------------------------------------------------------- tumour: right frontotemporal, deep-ish */
export const TUMOUR = new THREE.Vector3(0.43, -0.08, 0.26);

/** A noise-displaced blob around the tumour centre. */
export function buildBlob(level, radius, amp, freq, seed, stretch = [1, 1, 1], octaves = 3) {
  const { pos: dir, index } = icosphere(level);
  const { fbm } = makeNoise(seed);
  const n = dir.length / 3;
  const pos = new Float32Array(n * 3);
  const noiseA = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const ux = dir[i * 3], uy = dir[i * 3 + 1], uz = dir[i * 3 + 2];
    const k = fbm(ux * freq, uy * freq, uz * freq, octaves);
    const r = radius * (1 + amp * k);
    pos[i * 3] = TUMOUR.x + ux * r * stretch[0];
    pos[i * 3 + 1] = TUMOUR.y + uy * r * stretch[1];
    pos[i * 3 + 2] = TUMOUR.z + uz * r * stretch[2];
    noiseA[i] = k * 0.5 + 0.5;
  }
  return geometryFrom(pos, index, { aNoise: [noiseA, 1] });
}

/** Neftel states: 0 MES, 1 AC, 2 OPC, 3 NPC. Each state drifts toward its own mean direction when clustered. */
export const STATE_DIRS = [
  new THREE.Vector3(0.3, 0.55, 0.75).normalize(), // MES: toward the frontal cortex
  new THREE.Vector3(-0.85, 0.35, -0.2).normalize(), // AC: medially, along the corpus callosum
  new THREE.Vector3(0.2, -0.3, -0.9).normalize(), // OPC: back along the temporal white matter
  new THREE.Vector3(0.1, 0.9, -0.35).normalize(), // NPC: up toward the corona radiata
];
const STATE_P = [0.3, 0.3, 0.22, 0.18];

/** Infiltrating cells: points that stream outward from the rim along gently curved paths. */
export function buildCells(count, seed = 3) {
  const rnd = makeRandom(seed);
  const dirA = new Float32Array(count * 3), perpA = new Float32Array(count * 3);
  const seedA = new Float32Array(count), stateA = new Float32Array(count), lenA = new Float32Array(count), sizeA = new Float32Array(count);
  const v = new THREE.Vector3(), p = new THREE.Vector3(), q = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    // bias along white-matter directions: stretched front↔back and medially
    v.set(rnd() * 2 - 1, (rnd() * 2 - 1) * 0.75, (rnd() * 2 - 1) * 1.25);
    if (v.lengthSq() < 1e-4) v.set(0, 0, 1);
    v.normalize();
    q.set(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1);
    p.crossVectors(v, q).normalize();
    let u = rnd(), st = 0;
    while (st < 3 && u > STATE_P[st]) { u -= STATE_P[st]; st++; }
    // keep paths inside the hemisphere: shorter laterally (cortex is close), never across the midline
    const room = v.x > 0 ? lerp(0.44, 0.2, v.x) : Math.min(0.5, (TUMOUR.x - 0.08) / Math.max(0.05, -v.x));
    const len = Math.max(0.2, room * (0.6 + 0.5 * rnd()));
    dirA.set([v.x, v.y, v.z], i * 3);
    perpA.set([p.x, p.y, p.z], i * 3);
    seedA[i] = rnd();
    stateA[i] = st;
    lenA[i] = len;
    sizeA[i] = 0.6 + rnd() * 0.9;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3)); // computed in the shader
  g.setAttribute('aDir', new THREE.BufferAttribute(dirA, 3));
  g.setAttribute('aPerp', new THREE.BufferAttribute(perpA, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seedA, 1));
  g.setAttribute('aState', new THREE.BufferAttribute(stateA, 1));
  g.setAttribute('aLen', new THREE.BufferAttribute(lenA, 1));
  g.setAttribute('aSize', new THREE.BufferAttribute(sizeA, 1));
  g.boundingSphere = new THREE.Sphere(TUMOUR.clone(), 0.6);
  return g;
}

/* ---------------------------------------------------------------- label anchors (object space) */
export const ANCHORS = {
  core: [TUMOUR.x, TUMOUR.y, TUMOUR.z],
  rim: [TUMOUR.x + 0.06, TUMOUR.y + 0.1, TUMOUR.z + 0.05],
  oedema: [TUMOUR.x + 0.12, TUMOUR.y - 0.14, TUMOUR.z + 0.12],
  infiltration: [TUMOUR.x - 0.22, TUMOUR.y + 0.2, TUMOUR.z - 0.2],
  frontal: [0.42, 0.4, 0.8],
  temporal: [0.8, -0.34, 0.2],
  cerebellum: [0.36, -0.7, -0.74],
};

/** Level of detail: icosphere subdivision for the cerebrum. */
export function detailFor({ mobile }) {
  return mobile ? { hemi: 5, cereb: 4, stemRings: 48, cells: 1600 } : { hemi: 6, cereb: 5, stemRings: 72, cells: 3200 };
}
