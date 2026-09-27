// "Four cell states, one tumour": cells gather at the corners of a tetrahedron (MES, AC, OPC, NPC). The mix is set
// from outside (sliders/presets); cells glide to their new state. Schematic, not data.
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { glowPoints, seeded, gauss } from './common.js';
import { STATE_COLORS } from '../palette.js';

const N = 900;
const S = 1.25;
const V = [
  new THREE.Vector3(1, 1, 1), new THREE.Vector3(-1, -1, 1), new THREE.Vector3(-1, 1, -1), new THREE.Vector3(1, -1, -1),
].map((v) => v.normalize().multiplyScalar(S));
const COLS = STATE_COLORS.map((c) => new THREE.Color(c));

/** State per cell for a mix: cells are ranked by a fixed random key, so a small change moves only a few cells. */
function assign(weights, keys) {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const cum = []; let acc = 0;
  for (const w of weights) { acc += w / sum; cum.push(acc); }
  return keys.map((u) => { let s = 0; while (s < 3 && u > cum[s]) s++; return s; });
}

function Scene({ weights, still, light, names }) {
  const { gl } = useThree();
  const rnd = useMemo(() => seeded('neftel'), []);
  const cells = useMemo(() => Array.from({ length: N }, (_, i) => ({
    key: (i + rnd()) / N,
    off: new THREE.Vector3(gauss(rnd), gauss(rnd), gauss(rnd)).multiplyScalar(0.2),
    hybrid: rnd() < 0.14 ? rnd() * 0.45 : 0,
    other: Math.floor(rnd() * 3),
    phase: rnd() * Math.PI * 2,
  })), [rnd]);
  const keysSorted = useMemo(() => cells.map((c) => c.key), [cells]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute('size', new THREE.BufferAttribute(new Float32Array(N).fill(0.4), 1));
    g.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(N).fill(0.95), 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 3);
    return g;
  }, []);
  const mat = useMemo(() => glowPoints({ light }), [light]);
  useEffect(() => { mat.uniforms.uPx.value = gl.getPixelRatio(); }, [gl, mat]);

  const target = useRef({ pos: new Float32Array(N * 3), col: new Float32Array(N * 3) });
  const first = useRef(true);
  useEffect(() => {
    const st = assign(weights, keysSorted);
    const tp = target.current.pos; const tc = target.current.col;
    const tmp = new THREE.Vector3();
    cells.forEach((c, i) => {
      const s = st[i];
      const o = (s + 1 + c.other) % 4;
      tmp.copy(V[s]).multiplyScalar(0.82).lerp(V[o].clone().multiplyScalar(0.82), c.hybrid).add(c.off);
      tp.set([tmp.x, tmp.y, tmp.z], i * 3);
      const col = COLS[s].clone().lerp(COLS[o], c.hybrid * 0.8);
      tc.set([col.r, col.g, col.b], i * 3);
    });
    if (first.current || still) {
      geo.getAttribute('position').array.set(tp); geo.getAttribute('color').array.set(tc);
      geo.getAttribute('position').needsUpdate = true; geo.getAttribute('color').needsUpdate = true;
      first.current = false;
    }
  }, [weights, cells, keysSorted, geo, still]);

  useFrame((state, dt) => {
    if (still) return;
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 3);
    const p = geo.getAttribute('position'); const c = geo.getAttribute('color');
    const tp = target.current.pos; const tc = target.current.col;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < N * 3; i++) {
      const wob = Math.sin(t * 0.8 + cells[(i / 3) | 0].phase + i) * 0.0015;
      p.array[i] += (tp[i] - p.array[i]) * k + wob;
      c.array[i] += (tc[i] - c.array[i]) * k;
    }
    p.needsUpdate = true; c.needsUpdate = true;
  });

  const edges = useMemo(() => {
    const pts = [];
    for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) pts.push(V[a], V[b]);
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  return (
    <group>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={light ? '#0A1412' : '#EDF3F0'} transparent opacity={0.16} />
      </lineSegments>
      {V.map((v, i) => (
        <group key={i} position={v}>
          <mesh>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshBasicMaterial color={STATE_COLORS[i]} />
          </mesh>
          <Html center position={[v.x * 0.22, v.y * 0.22, v.z * 0.22]} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
            <span className="cs-vlabel" style={{ '--c': STATE_COLORS[i] }}>{names[i]}</span>
          </Html>
        </group>
      ))}
      <points geometry={geo} material={mat} />
    </group>
  );
}

export default function CellStates({ weights, still, light, names }) {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [2.6, 1.4, 3.4], fov: 40 }} gl={{ antialias: true, alpha: true }} onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}>
      <Scene weights={weights} still={still} light={light} names={names} />
      <OrbitControls enablePan={false} enableZoom={false} autoRotate={!still} autoRotateSpeed={0.6} enableDamping />
    </Canvas>
  );
}
