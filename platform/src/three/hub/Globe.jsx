// Patients & families hero: a calm dotted globe with a warm light for every country in the guide. Drag to turn,
// click a light to choose that country; the globe turns to face the selected one.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { glowPoints, dragToTurn } from './common.js';

const R = 1;
export function toVec(lat, lng, r = R) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const th = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}
const faceAngles = (lat, lng) => {
  const v = toVec(lat, lng);
  return { yaw: -Math.atan2(v.x, v.z), pitch: (lat * Math.PI) / 180 };
};

function Scene({ land, countries, selected, onSelect, still, light, names }) {
  const { gl, camera, size } = useThree();
  const root = useRef(null);
  const turn = useRef({ yaw: 0, pitch: 0.5, dragging: false, last: 0 });
  const cur = useRef({ yaw: 0, pitch: 0.5 });
  const [hover, setHover] = useState(null);

  const landGeo = useMemo(() => {
    const n = land.length / 2;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const v = toVec(land[i * 2] / 10, land[i * 2 + 1] / 10, R * 1.001); pos.set([v.x, v.y, v.z], i * 3); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const c = new THREE.Color(light ? '#8A9793' : '#5F6D69');
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).map((_, i) => [c.r, c.g, c.b][i % 3]), 3));
    g.setAttribute('size', new THREE.BufferAttribute(new Float32Array(n).fill(0.16), 1));
    g.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(n).fill(light ? 0.7 : 0.55), 1));
    return g;
  }, [land, light]);

  const mkGeo = useMemo(() => {
    const pos = new Float32Array(countries.length * 3);
    countries.forEach((c, i) => { const v = toVec(c.lat, c.lng, R * 1.01); pos.set([v.x, v.y, v.z], i * 3); });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const warm = new THREE.Color(light ? '#C2661A' : '#F5B35C');
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(countries.length * 3).map((_, i) => [warm.r, warm.g, warm.b][i % 3]), 3));
    g.setAttribute('size', new THREE.BufferAttribute(new Float32Array(countries.length).fill(1), 1));
    g.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(countries.length).fill(1), 1));
    g.computeBoundingSphere();
    return g;
  }, [countries, light]);

  const landMat = useMemo(() => glowPoints({ light }), [light]);
  const mkMat = useMemo(() => glowPoints({ light }), [light]);
  useEffect(() => { landMat.uniforms.uPx.value = gl.getPixelRatio(); mkMat.uniforms.uPx.value = gl.getPixelRatio(); }, [gl, landMat, mkMat]);

  useEffect(() => {
    const s = mkGeo.getAttribute('size');
    countries.forEach((c, i) => { s.array[i] = c.code === selected ? 1.2 : hover === i ? 0.95 : 0.5; });
    s.needsUpdate = true;
  }, [mkGeo, countries, selected, hover]);

  useEffect(() => {
    const c = countries.find((x) => x.code === selected);
    if (!c) return;
    const a = faceAngles(c.lat, c.lng);
    const t = turn.current;
    t.yaw = a.yaw + Math.round((t.yaw - a.yaw) / (2 * Math.PI)) * 2 * Math.PI;
    t.pitch = Math.max(-0.9, Math.min(0.9, a.pitch * 0.85));
    t.last = performance.now() + 6000;
  }, [selected, countries]);

  const ray = useMemo(() => { const r = new THREE.Raycaster(); r.params.Points.threshold = 0.045; return r; }, []);
  const mkRef = useRef(null);
  useEffect(() => {
    const el = gl.domElement;
    const ndc = new THREE.Vector2();
    const pick = (e) => {
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.params.Points.threshold = e.pointerType === 'mouse' ? 0.045 : 0.1;
      ray.setFromCamera(ndc, camera);
      const hits = mkRef.current ? ray.intersectObject(mkRef.current) : [];
      // only the side facing us
      const world = new THREE.Vector3();
      for (const h of hits) {
        world.copy(h.point).normalize();
        if (world.dot(camera.position.clone().normalize()) > 0.15) return h.index;
      }
      return null;
    };
    const off = dragToTurn(el, turn.current, { pitchLimit: 1.1, onTap: (e) => { const i = pick(e); if (i != null) onSelect(countries[i].code); } });
    let raf = 0;
    const move = (e) => {
      if (e.pointerType !== 'mouse' || turn.current.dragging || raf) return;
      raf = requestAnimationFrame(() => { raf = 0; const i = pick(e); setHover(i); el.style.cursor = i != null ? 'pointer' : 'grab'; });
    };
    const leave = () => setHover(null);
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
    el.style.cursor = 'grab';
    return () => { off(); cancelAnimationFrame(raf); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, [gl, camera, ray, countries, onSelect]);

  useFrame((_, dt) => {
    const t = turn.current; const c = cur.current;
    if (!still && !t.dragging && performance.now() - t.last > 3000) t.yaw += Math.min(dt, 0.05) * 0.05;
    const k = still ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) * 3);
    c.yaw += (t.yaw - c.yaw) * k; c.pitch += (t.pitch - c.pitch) * k;
    if (root.current) root.current.rotation.set(c.pitch, c.yaw, 0, 'XYZ');
  });

  useEffect(() => { camera.position.set(0, 0, 4.1); camera.lookAt(0, 0, 0); }, [camera, size.width]);

  const sel = countries.find((c) => c.code === selected);
  const hv = hover != null ? countries[hover] : null;
  const atmo = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.BackSide, blending: light ? THREE.NormalBlending : THREE.AdditiveBlending,
    uniforms: { uC: { value: new THREE.Color(light ? '#C2661A' : '#F5B35C') }, uA: { value: light ? 0.18 : 0.35 } },
    vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'uniform vec3 uC; uniform float uA; varying vec3 vN; void main(){ float f = pow(clamp(-dot(vN, vec3(0.,0.,1.)) * 2.2, 0., 1.), 2.); gl_FragColor = vec4(uC, f*uA); }',
  }), [light]);

  return (
    <>
      <mesh scale={1.12} material={atmo}><sphereGeometry args={[R, 64, 48]} /></mesh>
      <group ref={root}>
        <mesh>
          <sphereGeometry args={[R * 0.995, 64, 48]} />
          <meshBasicMaterial color={light ? '#F0F4F2' : '#0B0F10'} transparent opacity={light ? 0.9 : 0.92} />
        </mesh>
        <points geometry={landGeo} material={landMat} />
        <points ref={mkRef} geometry={mkGeo} material={mkMat} />
        {sel && (
          <Html position={toVec(sel.lat, sel.lng, R * 1.02).toArray()} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            <span className="gl-pin">{names(sel)}</span>
          </Html>
        )}
        {hv && hv !== sel && (
          <Html position={toVec(hv.lat, hv.lng, R * 1.02).toArray()} zIndexRange={[21, 0]} style={{ pointerEvents: 'none' }}>
            <span className="gl-pin gl-pin-soft">{names(hv)}</span>
          </Html>
        )}
      </group>
    </>
  );
}

export default function Globe({ land, countries, selected, onSelect, still, light, names }) {
  const wrap = useRef(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={wrap} className="globe-wrap">
      <Canvas dpr={[1, 1.75]} frameloop={visible ? 'always' : 'never'} camera={{ position: [0, 0, 4.1], fov: 36 }}
        gl={{ antialias: true, alpha: true }} onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}>
        <Scene land={land} countries={countries} selected={selected} onSelect={onSelect} still={still} light={light} names={names} />
      </Canvas>
    </div>
  );
}
