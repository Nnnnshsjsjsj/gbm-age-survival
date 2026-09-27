// Shared bits for the guide scenes: a soft glowing point material, seeded randomness and a drag-to-turn helper.
import * as THREE from 'three';

/** Round, soft points with per-point colour, size and alpha. Additive on dark, normal blending on light. */
export function glowPoints({ light = false, scale = 1 } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: light ? THREE.NormalBlending : THREE.AdditiveBlending,
    uniforms: { uScale: { value: scale }, uPx: { value: 1 }, uLight: { value: light ? 1 : 0 } },
    vertexShader: /* glsl */`
      attribute vec3 color; attribute float size; attribute float alpha;
      uniform float uScale; uniform float uPx;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = size * uScale * uPx * (48.0 / max(0.5, -mv.z));
        vColor = color; vAlpha = alpha;
      }`,
    fragmentShader: /* glsl */`
      uniform float uLight;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - 0.5; float d = length(c);
        if (d > 0.5) discard;
        float core = smoothstep(0.5, 0.12, d);
        float halo = smoothstep(0.5, 0.0, d) * 0.5;
        float a = mix(core * 0.9 + halo, core, uLight) * vAlpha;
        gl_FragColor = vec4(vColor * mix(1.0 + core * 0.4, 0.9, uLight), a);
      }`,
  });
}

/** Deterministic pseudo-random numbers from a string (so the layout is the same on every visit). */
export function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h += 0x6D2B79F5; let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function gauss(rnd) {
  const u = Math.max(1e-9, rnd()); const v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Pointer drag on an element turns a target yaw/pitch; returns a cleanup. `state` = { yaw, pitch, dragging, last }. */
export function dragToTurn(el, state, { pitchLimit = 0.9, onStart, onTap } = {}) {
  let down = null;
  const pd = (e) => { down = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId }; state.dragging = true; onStart?.(); };
  const pm = (e) => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    if (!down.moved && Math.hypot(dx, dy) > 4) { down.moved = true; try { el.setPointerCapture(down.id); } catch { /* ok */ } }
    if (!down.moved) return;
    state.yaw += dx * 0.006; state.pitch = Math.max(-pitchLimit, Math.min(pitchLimit, state.pitch + dy * 0.004));
    down.x = e.clientX; down.y = e.clientY; state.last = performance.now();
  };
  const pu = (e) => {
    if (down && !down.moved) onTap?.(e);
    down = null; state.dragging = false; state.last = performance.now();
  };
  el.addEventListener('pointerdown', pd); el.addEventListener('pointermove', pm);
  el.addEventListener('pointerup', pu); el.addEventListener('pointercancel', pu);
  return () => {
    el.removeEventListener('pointerdown', pd); el.removeEventListener('pointermove', pm);
    el.removeEventListener('pointerup', pu); el.removeEventListener('pointercancel', pu);
  };
}

export const hex = (c) => new THREE.Color(c);
