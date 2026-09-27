// Brain lab viewer: orbit controls, camera presets, layers, cross-section, picking. Renders on demand: it animates
// for a few seconds after any interaction, then idles (no frames) until the next one.
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { Brain, Label, ANCHORS } from './Brain.jsx';
import { TUMOUR } from './anatomy.js';

export const VIEWS = {
  start: { pos: [3.1, 1.15, 3.5], target: [0, -0.1, 0] },
  front: { pos: [0, 0.2, 5.1], target: [0, -0.1, 0] },
  side: { pos: [5.1, 0.15, 0], target: [0, -0.1, 0] },
  top: { pos: [0, 5.1, 0.02], target: [0, -0.1, 0] },
  tumour: { pos: [2.05, 0.42, 1.55], target: [TUMOUR.x, TUMOUR.y, TUMOUR.z] },
};
const REGION_OF = { frontal: 0, parietal: 1, temporal: 2, occipital: 3, cerebellum: 4, stem: 5 };
const LABELS = [
  ['core', 'left', 'core'], ['rim', 'right', 'rim'], ['oedema', 'right', 'oedema'], ['infiltration', 'left', 'cells'],
  ['frontal', 'left', 'cortex'], ['temporal', 'right', 'cortex'], ['cerebellum', 'down', 'hind'],
];

function Rig({ state, api, onHover, onSelect, still, mobile, theme, labels }) {
  const brain = useRef(null);
  const controls = useRef(null);
  const { camera, gl, invalidate } = useThree();
  const awake = useRef(0);
  const wake = (ms = 5000) => { awake.current = Math.max(awake.current, performance.now() + ms); invalidate(); };

  useFrame(() => { if (!still && performance.now() < awake.current) invalidate(); });

  // camera presets
  const fly = (key, immediate = false) => {
    const v = VIEWS[key] || VIEWS.start;
    const c = controls.current;
    gsap.killTweensOf(camera.position); if (c) gsap.killTweensOf(c.target);
    if (immediate || still) {
      camera.position.set(...v.pos); c?.target.set(...v.target); c?.update(); invalidate(); return;
    }
    const dur = 1.1;
    gsap.to(camera.position, { x: v.pos[0], y: v.pos[1], z: v.pos[2], duration: dur, ease: 'power3.inOut', onUpdate: () => { c?.update(); invalidate(); } });
    if (c) gsap.to(c.target, { x: v.target[0], y: v.target[1], z: v.target[2], duration: dur, ease: 'power3.inOut' });
    wake(dur * 1000 + 400);
  };

  // keyboard helpers: orbit around the target, dolly toward it
  const sph = useMemo(() => new THREE.Spherical(), []);
  const off = useMemo(() => new THREE.Vector3(), []);
  const orbit = (dAz, dPol) => {
    const c = controls.current; if (!c) return;
    off.copy(camera.position).sub(c.target); sph.setFromVector3(off);
    sph.theta += dAz; sph.phi = Math.min(Math.PI - 0.15, Math.max(0.15, sph.phi + dPol));
    off.setFromSpherical(sph); camera.position.copy(c.target).add(off); c.update(); wake(1200);
  };
  const zoom = (f) => {
    const c = controls.current; if (!c) return;
    off.copy(camera.position).sub(c.target);
    const d = Math.min(c.maxDistance, Math.max(c.minDistance, off.length() * f));
    off.setLength(d); camera.position.copy(c.target).add(off); c.update(); wake(1200);
  };

  useEffect(() => {
    api.current = { fly, orbit, zoom, wake };
    fly('start', true);
    return () => { api.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // state → scene
  useEffect(() => {
    const b = brain.current; if (!b) return;
    for (const [k, on] of Object.entries(state.layers)) b.setLayer(k, on);
    b.cortexUniforms.uOpacity.value = state.opacity;
    b.setCut(state.cut ? state.cutX : null);
    const cu = b.cellsMaterial.uniforms;
    gsap.to(cu.uMode, { value: state.cellMode === 'state' ? 1 : 0, duration: still ? 0 : 0.6, onUpdate: invalidate });
    gsap.to(cu.uCluster, { value: state.cellMode === 'state' ? 1 : 0, duration: still ? 0 : 1.4, ease: 'power2.inOut', onUpdate: invalidate });
    b.tumourUniforms.uXray.value = state.opacity > 0.8 ? 0.22 : 0.1;
    const hl = state.hover || state.selected;
    b.setRegionHighlight(REGION_OF[state.hover] ?? -1, REGION_OF[state.selected] ?? -1);
    b.cortexUniforms.uDim.value = state.selected && REGION_OF[state.selected] != null ? 0.35 : 0;
    b.setTumourHighlight(['core', 'rim', 'oedema'].includes(hl) ? hl : null);
    cu.uOpacity.value = hl === 'infiltration' ? 1.6 : 1;
    wake(1500);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  // pointer picking on the canvas element
  useEffect(() => {
    const el = gl.domElement;
    const ndc = new THREE.Vector2();
    let down = null, raf = 0, last = null, hovered = null;
    const at = (e) => { const r = el.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
    const move = (e) => {
      last = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!brain.current || down?.moved) return;
        at(last);
        const k = brain.current.pick(ndc, camera);
        if (k !== hovered) { hovered = k; onHover(k); el.style.cursor = k ? 'pointer' : ''; }
      });
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) down.moved = true;
    };
    const pdown = (e) => { down = { x: e.clientX, y: e.clientY, moved: false }; wake(); };
    const pup = (e) => {
      if (down && !down.moved && brain.current) { at(e); onSelect(brain.current.pick(ndc, camera)); }
      down = null;
    };
    const leave = () => { if (hovered) { hovered = null; onHover(null); } };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerdown', pdown);
    el.addEventListener('pointerup', pup);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('wheel', () => wake(), { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', move); el.removeEventListener('pointerdown', pdown);
      el.removeEventListener('pointerup', pup); el.removeEventListener('pointerleave', leave);
    };
  }, [gl, camera]); // eslint-disable-line react-hooks/exhaustive-deps

  const layerOf = Object.fromEntries(LABELS.map(([k, , l]) => [k, l]));
  return (
    <>
      <Brain ref={brain} mobile={mobile} theme={theme} still={still}>
        {LABELS.map(([key, side]) => {
          const on = state.layers[layerOf[key]] && state.labels;
          return (
            <Label key={key} at={ANCHORS[key]} side={side} text={labels[key]} on={on} interactive
              selected={state.selected === key} onClick={() => onSelect(key)} />
          );
        })}
      </Brain>
      <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.08} enablePan={false}
        minDistance={1.3} maxDistance={8} rotateSpeed={0.7} zoomSpeed={0.8} onStart={() => wake(4000)} onChange={() => wake(600)} />
    </>
  );
}

export default function LabCanvas({ state, apiRef, onHover, onSelect, still, mobile, theme, labels, onReady }) {
  return (
    <Canvas
      dpr={[1, 1.75]} frameloop="demand"
      camera={{ position: VIEWS.start.pos, fov: 30, near: 0.05, far: 40 }}
      gl={{ antialias: true, alpha: true, stencil: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => { gl.localClippingEnabled = true; gl.setClearColor(0x000000, 0); onReady?.(); }}
    >
      <Rig state={state} api={apiRef} onHover={onHover} onSelect={onSelect} still={still} mobile={mobile} theme={theme} labels={labels} />
    </Canvas>
  );
}
