// A small mathematical "head" for teaching: scalp, skull, CSF, grey and white matter, ventricles and a right
// frontotemporal glioblastoma (necrotic core, enhancing rim, oedema). It returns MRI-like grey values for two
// sequences. No three.js here, so the 2D slice also works without WebGL.

// value noise in 3D (deterministic)
function hash(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const fade = (t) => t * t * (3 - 2 * t);
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
  let v = 0;
  for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
    const w = (dx ? xf : 1 - xf) * (dy ? yf : 1 - yf) * (dz ? zf : 1 - zf);
    v += w * hash(xi + dx, yi + dy, zi + dz);
  }
  return v;
}
const fbm = (x, y, z) => 0.6 * vnoise(x, y, z) + 0.3 * vnoise(x * 2.1, y * 2.1, z * 2.1) + 0.1 * vnoise(x * 4.3, y * 4.3, z * 4.3);

// geometry (x: patient's left(−)/right(+), y: down/up, z: back/front), units ≈ decimetres
export const BRAIN = { a: 0.66, b: 0.56, c: 0.82, cy: 0.04 };
export const TUMOR = { x: 0.3, y: 0.02, z: 0.3, core: 0.085, rim: 0.14, oedema: 0.3 };
export const EXTENT = 1.12; // half-size of the image field

const GREY = {
  t1c: { bg: 0, scalp: 0.78, skull: 0.07, csf: 0.1, gm: 0.44, wm: 0.62, core: 0.2, rim: 0.97, oedema: 0.4 },
  flair: { bg: 0, scalp: 0.62, skull: 0.05, csf: 0.05, gm: 0.54, wm: 0.4, core: 0.5, rim: 0.66, oedema: 0.9 },
};

/** Tissue label at a point: 'bg' | 'scalp' | 'skull' | 'csf' | 'gm' | 'wm' | 'core' | 'rim' | 'oedema'. */
export function tissue(x, y, z) {
  const { a, b, c, cy } = BRAIN;
  const ny = y - cy;
  const r = Math.sqrt((x / a) ** 2 + (ny / b) ** 2 + (z / c) ** 2);
  if (r > 1.2) return 'bg';
  if (r > 1.12) return 'scalp';
  if (r > 1.045) return 'skull';
  if (r > 1.0) return 'csf';
  // falx: thin CSF gap between hemispheres, deeper at the top
  if (Math.abs(x) < 0.012 && ny > -0.05 - (1 - r) * 0.2) return 'csf';
  // ventricles: two curved lateral horns
  const vx = Math.abs(x) - 0.07 - 0.04 * z, vy = ny - 0.03 + 0.25 * (z * z), vz = z + 0.03;
  if ((vx / (0.04 + 0.03 * Math.max(0, -z))) ** 2 + (vy / 0.08) ** 2 + (vz / 0.36) ** 2 < 1) return 'csf';
  // tumour (checked before cortex so it can reach the surface)
  const dx = x - TUMOR.x, dy = y - TUMOR.y, dz = z - TUMOR.z;
  const n = fbm(x * 9 + 3, y * 9, z * 9);
  const d = Math.sqrt((dx * 1.1) ** 2 + dy * dy + (dz * 0.9) ** 2) + (n - 0.5) * 0.09;
  const n2 = fbm(x * 17 + 1, y * 17, z * 17);
  if (d < TUMOR.core + (n2 - 0.5) * 0.05) return 'core';
  if (d < TUMOR.rim + (n2 - 0.5) * 0.04) return 'rim';
  const fingers = fbm(x * 12, y * 12 + 5, z * 12) - 0.5;
  if (d < TUMOR.oedema + fingers * 0.22 && r < 0.95) return 'oedema';
  // cortex with sulci
  const fold = fbm(x * 7, y * 7, z * 7);
  const ridge = 1 - Math.abs(2 * vnoise(x * 16 + 2, y * 16, z * 16) - 1);
  const band = 0.84 - fold * 0.12 - ridge * 0.05;
  if (r > band) return ridge > 0.86 && r > 0.9 ? 'csf' : 'gm';
  return 'wm';
}

/** Map an image pixel (u, v in −1..1, v up) to 3D for a plane and slice position s (−1..1). */
export function planePoint(plane, u, v, s) {
  const e = EXTENT;
  if (plane === 'axial') return [-u * e, s * 0.62 + BRAIN.cy, v * e];      // radiological: image left = patient right
  if (plane === 'coronal') return [-u * e, v * e, s * 0.86];
  return [s * 0.7, v * e, u * e];                                          // sagittal: image right = front
}

/** Render a slice into RGBA pixels (alpha 0 outside the head). */
export function renderSlice(img, plane, s, seq) {
  const { width: W, height: H, data } = img;
  const g = GREY[seq] || GREY.t1c;
  for (let j = 0; j < H; j++) {
    const v = 1 - (2 * (j + 0.5)) / H;
    for (let i = 0; i < W; i++) {
      const u = (2 * (i + 0.5)) / W - 1;
      const [x, y, z] = planePoint(plane, u, v, s);
      const t = tissue(x, y, z);
      const o = (j * W + i) * 4;
      if (t === 'bg') { data[o] = data[o + 1] = data[o + 2] = 0; data[o + 3] = 0; continue; }
      let val = g[t];
      if (t === 'core') val += (vnoise(x * 30, y * 30, z * 30) - 0.5) * (seq === 'flair' ? 0.3 : 0.1);
      if (t === 'wm' || t === 'gm') val += (vnoise(x * 18, y * 18, z * 18) - 0.5) * 0.05;
      val += (hash(i, j, 7) - 0.5) * 0.035;                    // grain
      val *= 0.94 + 0.06 * (1 - Math.abs(v));                   // gentle coil shading
      const c = Math.max(0, Math.min(255, Math.round(val * 255)));
      data[o] = data[o + 1] = data[o + 2] = c; data[o + 3] = 255;
    }
  }
  return img;
}
