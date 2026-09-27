// Shader materials for the brain: a "holographic scan" cortex, three tumour layers and the infiltrating cells.
// Render order (inner things first so they show through the slightly transparent cortex):
//   0 necrotic core + enhancing rim (opaque)   1 oedema, cells (no depth write)
//   2 cortex depth pre-pass (no colour)        3 cortex colour (blended, LessEqual)   4 x-ray glow of the rim
import * as THREE from 'three';
import { TUMOUR } from './anatomy.js';

export const PALETTE = {
  dark: { deep: '#020605', base: '#1b2c29', crown: '#3a5752', a: '#5EF2B8', b: '#4CC9F0', cut: '#12201f', cutLine: '#274a46' },
  light: { deep: '#5f6f6b', base: '#b9c9c4', crown: '#e6eeeb', a: '#0E9F6E', b: '#0B7FAB', cut: '#dfe8e5', cutLine: '#9fb5ae' },
};
import { STATE_COLORS } from './palette.js';

export { STATE_COLORS };
/** Colour shown exactly as written: our ShaderMaterials output raw values (no colour-space conversion). */
export const raw = (hex) => new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace);

const clipVert = `#include <clipping_planes_pars_vertex>`;
const clipFrag = `#include <clipping_planes_pars_fragment>`;

/* ---------------------------------------------------------------- cortex */
const cortexVS = /* glsl */`
  attribute float aDepth;
  attribute float aRegion;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vObj;
  varying float vDepth;
  varying float vRegion;
  ${clipVert}
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = -mvPosition.xyz;
    vObj = position;
    vDepth = aDepth;
    vRegion = aRegion;
    gl_Position = projectionMatrix * mvPosition;
    #include <clipping_planes_vertex>
  }
`;
const cortexFS = /* glsl */`
  uniform vec3 uDeep; uniform vec3 uBase; uniform vec3 uCrown; uniform vec3 uA; uniform vec3 uB;
  uniform vec3 uCut; uniform vec3 uCutLine;
  uniform float uOpacity; uniform float uTime; uniform float uScan; uniform float uRim;
  uniform float uHover; uniform float uSelect; uniform float uDim; uniform float uLight;
  varying vec3 vN; varying vec3 vV; varying vec3 vObj; varying float vDepth; varying float vRegion;
  ${clipFrag}
  void main() {
    #include <clipping_planes_fragment>
    if (!gl_FrontFacing) {
      // the far wall seen through a cross-section: draw it flat, like a cut surface of solid tissue
      float lines = smoothstep(0.92, 1.0, abs(sin(vObj.y * 90.0))) * 0.35 + smoothstep(0.96, 1.0, abs(sin(vObj.z * 60.0))) * 0.2;
      gl_FragColor = vec4(mix(uCut, uCutLine, lines), 1.0);
      return;
    }
    vec3 N = normalize(vN);
    vec3 V = normalize(vV);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float fres = pow(1.0 - ndv, 2.2);
    float crown = 1.0 - vDepth;
    vec3 L1 = normalize(vec3(0.45, 0.8, 0.6));
    vec3 L2 = normalize(vec3(-0.6, -0.2, 0.4));
    float key = max(dot(N, L1), 0.0);
    float fill = max(dot(N, L2), 0.0);
    // folds: sulci go dark, gyral crowns catch a little light
    float cav = smoothstep(0.0, 0.85, crown);
    // cerebellar folia: fine leaves too small for the mesh, drawn per pixel
    if (vRegion > 3.5 && vRegion < 4.5) {
      vec3 q = vObj - vec3(0.0, -0.5, -0.5);
      float th = atan(q.y + 0.02, length(vec2(q.z, 0.55 * q.x))) * 1.6;
      float ph = th * 46.0;
      float fw = fwidth(ph) + 1e-4;
      float f = abs(sin(ph));
      crown *= mix(mix(0.3, 1.0, smoothstep(0.0, 0.6, f)), 0.8, smoothstep(0.6, 1.6, fw));
      cav = smoothstep(0.0, 0.85, crown);
    }
    vec3 col = mix(uDeep, uBase, cav);
    col = mix(col, uCrown, pow(crown, 2.0) * 0.6 * key);
    col *= 0.22 + 1.05 * key + 0.25 * fill;
    col *= mix(0.18, 1.0, cav);
    // contour at the sulcal walls: the gyri read as outlined ridges, like a surface scan
    float w = fwidth(vDepth) * 1.2 + 1e-4;
    float iso = 1.0 - smoothstep(0.0, w, abs(vDepth - 0.42));
    col += mix(uB, uA, 0.5) * iso * 0.16 * (1.0 - uLight * 0.6);
    // spec-like sheen on crowns
    vec3 H = normalize(L1 + V);
    col += uA * pow(max(dot(N, H), 0.0), 40.0) * 0.12 * crown;
    // accent rim, gradient from mint (top) to cyan (bottom)
    vec3 rimCol = mix(uB, uA, clamp(vObj.y * 0.7 + 0.5, 0.0, 1.0));
    col += rimCol * fres * uRim * (0.6 + 0.4 * crown);
    // scan sweep, front → back every ~6 s
    float zs = 1.35 - mod(uTime, 6.0) / 6.0 * 2.9;
    float band = exp(-pow((vObj.z - zs) / 0.022, 2.0));
    float trail = exp(-max(0.0, vObj.z - zs) * 9.0) * step(zs, vObj.z) * 0.18;
    col += rimCol * (band * 0.7 + trail * 0.35) * uScan * (0.4 + 0.6 * crown);
    // hover / selection highlight of a region
    float hov = 1.0 - step(0.5, abs(vRegion - uHover));
    float sel = 1.0 - step(0.5, abs(vRegion - uSelect));
    col += rimCol * (hov * 0.12 + sel * 0.2) * (0.3 + crown);
    col *= mix(1.0, 0.55, uDim * (1.0 - max(hov, sel)));
    float a = mix(uOpacity, 1.0, fres * 0.55);
    gl_FragColor = vec4(col, a);
  }
`;

export function cortexUniforms(theme = 'dark') {
  const p = PALETTE[theme] || PALETTE.dark;
  return {
    uDeep: { value: new THREE.Color(p.deep) }, uBase: { value: new THREE.Color(p.base) }, uCrown: { value: new THREE.Color(p.crown) },
    uA: { value: new THREE.Color(p.a) }, uB: { value: new THREE.Color(p.b) },
    uCut: { value: new THREE.Color(p.cut) }, uCutLine: { value: new THREE.Color(p.cutLine) },
    uOpacity: { value: 0.96 }, uTime: { value: 0 }, uScan: { value: 1 }, uRim: { value: 1.0 },
    uHover: { value: -1 }, uSelect: { value: -1 }, uDim: { value: 0 }, uLight: { value: theme === 'light' ? 1 : 0 },
  };
}
export function setTheme(uniforms, theme) {
  const p = PALETTE[theme] || PALETTE.dark;
  uniforms.uDeep.value.set(p.deep); uniforms.uBase.value.set(p.base); uniforms.uCrown.value.set(p.crown);
  uniforms.uA.value.set(p.a); uniforms.uB.value.set(p.b); uniforms.uCut.value.set(p.cut); uniforms.uCutLine.value.set(p.cutLine);
  uniforms.uLight.value = theme === 'light' ? 1 : 0;
}

export function cortexMaterials(uniforms, clippingPlanes = []) {
  const prepass = new THREE.ShaderMaterial({
    vertexShader: cortexVS,
    fragmentShader: `${clipFrag}\nvoid main(){\n#include <clipping_planes_fragment>\ngl_FragColor=vec4(0.0);}`,
    uniforms: {}, colorWrite: false, depthWrite: true, transparent: true, clipping: true, clippingPlanes,
  });
  const color = new THREE.ShaderMaterial({
    vertexShader: cortexVS, fragmentShader: cortexFS, uniforms,
    transparent: true, depthWrite: false, depthFunc: THREE.LessEqualDepth, side: THREE.DoubleSide,
    clipping: true, clippingPlanes,
  });
  return { prepass, color };
}

/* ---------------------------------------------------------------- tumour layers */
const blobVS = /* glsl */`
  attribute float aNoise;
  varying vec3 vN; varying vec3 vV; varying float vNoise; varying vec3 vObj;
  ${clipVert}
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = -mvPosition.xyz;
    vNoise = aNoise; vObj = position;
    gl_Position = projectionMatrix * mvPosition;
    #include <clipping_planes_vertex>
  }
`;
const coreFS = /* glsl */`
  uniform float uTime; uniform float uHi;
  varying vec3 vN; varying vec3 vV; varying float vNoise; varying vec3 vObj;
  ${clipFrag}
  void main() {
    #include <clipping_planes_fragment>
    vec3 N = normalize(vN); vec3 V = normalize(vV);
    float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.0);
    float key = max(dot(N, normalize(vec3(0.4, 0.8, 0.6))), 0.0);
    vec3 col = mix(vec3(0.06, 0.02, 0.022), vec3(0.28, 0.09, 0.07), vNoise * vNoise) * (0.35 + 0.9 * key);
    col += vec3(0.6, 0.18, 0.12) * fres * 0.55;
    col += vec3(1.0, 0.55, 0.36) * uHi * (0.12 + fres * 0.5);
    gl_FragColor = vec4(col, 1.0);
  }
`;
const rimFS = /* glsl */`
  uniform float uTime; uniform float uPulse; uniform float uHi; uniform float uXray;
  varying vec3 vN; varying vec3 vV; varying float vNoise; varying vec3 vObj;
  ${clipFrag}
  void main() {
    #include <clipping_planes_fragment>
    vec3 N = normalize(vN); vec3 V = normalize(vV);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float fres = pow(1.0 - ndv, 1.6);
    float pulse = 0.82 + 0.18 * sin(uTime * 0.9) * uPulse;
    vec3 coral = vec3(1.0, 0.54, 0.36);
    vec3 amber = vec3(0.96, 0.70, 0.36);
    vec3 col = mix(coral, amber, smoothstep(0.3, 0.75, vNoise));
    float key = max(dot(N, normalize(vec3(0.4, 0.8, 0.6))), 0.0);
    // ring enhancement: bright at the grazing edges, see-through in the middle so the dark core shows
    vec3 c = col * (0.5 + 0.45 * key + 0.9 * fres) * pulse;
    float a = 0.07 + 0.93 * pow(fres, 1.35);
    if (!gl_FrontFacing) { c = col * 0.5 * pulse; a = 0.05 + 0.3 * pow(fres, 2.0); }
    c += col * uHi * 0.4;
    gl_FragColor = vec4(c, min(1.0, a + uHi * 0.15));
  }
`;
const xrayFS = /* glsl */`
  uniform float uTime; uniform float uXray; uniform float uPulse;
  varying vec3 vN; varying vec3 vV; varying float vNoise; varying vec3 vObj;
  void main() {
    vec3 N = normalize(vN); vec3 V = normalize(vV);
    float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 1.4);
    float pulse = 0.8 + 0.2 * sin(uTime * 0.9) * uPulse;
    vec3 col = mix(vec3(1.0, 0.54, 0.36), vec3(0.96, 0.70, 0.36), vNoise);
    gl_FragColor = vec4(col * (0.25 + fres) * uXray * pulse, 1.0);
  }
`;
const oedemaFS = /* glsl */`
  uniform float uOpacity; uniform float uHi; uniform float uTime;
  varying vec3 vN; varying vec3 vV; varying float vNoise; varying vec3 vObj;
  ${clipFrag}
  void main() {
    #include <clipping_planes_fragment>
    vec3 N = normalize(vN); vec3 V = normalize(vV);
    float fres = pow(1.0 - abs(dot(N, V)), 2.0);
    vec3 cyan = vec3(0.30, 0.79, 0.94);
    float bands = 0.5 + 0.5 * sin(length(vObj - vec3(${TUMOUR.x.toFixed(3)}, ${TUMOUR.y.toFixed(3)}, ${TUMOUR.z.toFixed(3)})) * 160.0 - uTime * 0.6);
    float a = (0.04 + 0.42 * fres + 0.05 * bands * fres) * uOpacity * (1.0 + uHi * 0.8);
    gl_FragColor = vec4(cyan * (0.8 + 0.4 * vNoise), a);
  }
`;

export function tumourUniforms() {
  return {
    uTime: { value: 0 }, uPulse: { value: 1 }, uXray: { value: 0.16 },
    uHiCore: { value: 0 }, uHiRim: { value: 0 }, uHiOedema: { value: 0 }, uOedema: { value: 1 },
  };
}

export function tumourMaterials(u, clippingPlanes = []) {
  const shared = { uTime: u.uTime, uPulse: u.uPulse, uXray: u.uXray };
  const core = new THREE.ShaderMaterial({ vertexShader: blobVS, fragmentShader: coreFS, uniforms: { ...shared, uHi: u.uHiCore }, clipping: true, clippingPlanes });
  const rim = new THREE.ShaderMaterial({ vertexShader: blobVS, fragmentShader: rimFS, uniforms: { ...shared, uHi: u.uHiRim }, side: THREE.DoubleSide, transparent: true, depthWrite: false, clipping: true, clippingPlanes });
  const xray = new THREE.ShaderMaterial({ vertexShader: blobVS, fragmentShader: xrayFS, uniforms: shared, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
  const oedema = new THREE.ShaderMaterial({
    vertexShader: blobVS, fragmentShader: oedemaFS, uniforms: { uOpacity: u.uOedema, uHi: u.uHiOedema, uTime: u.uTime },
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, clipping: true, clippingPlanes,
  });
  return { core, rim, xray, oedema };
}

/* ---------------------------------------------------------------- infiltrating cells */
const cellsVS = /* glsl */`
  attribute vec3 aDir; attribute vec3 aPerp; attribute float aSeed; attribute float aState; attribute float aLen; attribute float aSize;
  uniform float uTime; uniform float uSpeed; uniform float uCluster; uniform float uSize; uniform float uPR; uniform vec3 uCentre;
  uniform vec3 uStateDir[4]; uniform vec3 uStateCol[4]; uniform vec3 uSingle; uniform float uMode;
  varying float vAlpha; varying vec3 vCol;
  void main() {
    int st = int(aState + 0.5);
    vec3 sd = uStateDir[0]; vec3 sc = uStateCol[0];
    if (st == 1) { sd = uStateDir[1]; sc = uStateCol[1]; }
    else if (st == 2) { sd = uStateDir[2]; sc = uStateCol[2]; }
    else if (st == 3) { sd = uStateDir[3]; sc = uStateCol[3]; }
    vec3 dir = normalize(mix(aDir, sd, uCluster * 0.55));
    float s = fract(aSeed + uTime * uSpeed * (0.6 + 0.4 * aSize));
    float r = mix(0.1, aLen, pow(s, 0.8));
    vec3 p = uCentre + dir * r + aPerp * (s * s) * 0.09 * aLen / 0.3;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aSize * uPR * (1.0 / max(0.2, -mv.z)) * (1.0 - 0.4 * s);
    vAlpha = smoothstep(0.0, 0.06, s) * pow(1.0 - s, 1.35);
    vCol = mix(uSingle, sc, uMode);
  }
`;
const cellsFS = /* glsl */`
  uniform float uOpacity;
  varying float vAlpha; varying vec3 vCol;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vCol * (0.6 + 0.8 * core * core), vAlpha * core * uOpacity);
  }
`;

export function cellsMaterial(pixelRatio = 1) {
  const u = {
    uTime: { value: 0 }, uSpeed: { value: 0.035 }, uCluster: { value: 0 }, uSize: { value: 11 }, uPR: { value: pixelRatio },
    uCentre: { value: TUMOUR.clone() }, uMode: { value: 0 }, uOpacity: { value: 1 },
    uSingle: { value: raw('#FFB08A') },
    uStateCol: { value: STATE_COLORS.map(raw) },
    uStateDir: { value: [] },
  };
  return new THREE.ShaderMaterial({
    vertexShader: cellsVS, fragmentShader: cellsFS, uniforms: u,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

/* ---------------------------------------------------------------- cross-section caps (stencil) */
// For each closed mesh: back faces increment the stencil, front faces decrement it, so the stencil is non-zero
// exactly where the cutting plane lies inside the mesh. A plane drawn there with stencil != 0 is the cut surface.
export function stencilPair(clippingPlanes) {
  const base = {
    depthWrite: false, depthTest: false, colorWrite: false, stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc, clippingPlanes,
    transparent: true, // keeps them in the same render list as the caps, so renderOrder interleaves them
  };
  const back = new THREE.MeshBasicMaterial({ ...base, side: THREE.BackSide });
  back.stencilFail = back.stencilZFail = back.stencilZPass = THREE.IncrementWrapStencilOp;
  const front = new THREE.MeshBasicMaterial({ ...base, side: THREE.FrontSide });
  front.stencilFail = front.stencilZFail = front.stencilZPass = THREE.DecrementWrapStencilOp;
  return { back, front };
}

const capVS = /* glsl */`
  varying vec3 vW;
  void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
`;
const capFS = /* glsl */`
  uniform vec3 uColor; uniform vec3 uLine; uniform float uAlpha; uniform float uKind; uniform float uTime;
  varying vec3 vW;
  void main() {
    vec3 c = uColor;
    if (uKind < 0.5) {
      // tissue: faint scan grid
      vec2 g = abs(fract(vW.yz * 20.0) - 0.5);
      float line = 1.0 - smoothstep(0.0, 0.035, min(g.x, g.y));
      c = mix(uColor, uLine, line * 0.55);
    } else if (uKind < 1.5) {
      // oedema: soft diagonal hatching
      float h = smoothstep(0.35, 0.5, abs(fract((vW.y + vW.z) * 60.0) - 0.5));
      c = uColor * (0.75 + 0.35 * h);
    } else if (uKind < 2.5) {
      // enhancing rim: coral → amber mottling, slow pulse
      float mott = 0.5 + 0.5 * sin(vW.y * 70.0 + sin(vW.z * 55.0) * 2.0);
      c = mix(uColor, uLine, mott * 0.6) * (0.86 + 0.1 * sin(uTime * 0.9));
    } else {
      float mott = 0.5 + 0.5 * sin(vW.y * 90.0 + sin(vW.z * 80.0) * 2.5);
      c = uColor * (0.7 + 0.5 * mott);
    }
    gl_FragColor = vec4(c, uAlpha);
  }
`;
export function capMaterial({ color, line = color, alpha = 1, kind = 0, time }) {
  const m = new THREE.ShaderMaterial({
    vertexShader: capVS, fragmentShader: capFS,
    uniforms: { uColor: { value: raw(color) }, uLine: { value: raw(line) }, uAlpha: { value: alpha }, uKind: { value: kind }, uTime: time || { value: 0 } },
    transparent: true, depthWrite: true, depthTest: false, side: THREE.DoubleSide,
    stencilWrite: true, stencilRef: 0, stencilFunc: THREE.NotEqualStencilFunc,
  });
  m.stencilFail = THREE.ReplaceStencilOp; m.stencilZFail = THREE.ReplaceStencilOp; m.stencilZPass = THREE.ReplaceStencilOp;
  return m;
}
