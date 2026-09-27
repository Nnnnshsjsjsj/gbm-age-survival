// Research hub hero: every paper and resource as a star, clustered by topic. Drag to turn, hover to read, click to
// open. The selected reading path is drawn as a bright line through its papers.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { glowPoints, seeded, gauss, dragToTurn } from './common.js';

function layout(items, groups) {
  const centers = {};
  const n = groups.length;
  const ga = Math.PI * (3 - Math.sqrt(5));
  groups.forEach((g, i) => {
    const y = 0.72 - (i / Math.max(1, n - 1)) * 1.44;
    const r = Math.sqrt(1 - y * y);
    const th = ga * i * 1.7;
    centers[g.key] = new THREE.Vector3(Math.cos(th) * r, y * 0.9, Math.sin(th) * r).multiplyScalar(1.75);
  });
  const pos = new Float32Array(items.length * 3);
  items.forEach((it, i) => {
    const rnd = seeded(it.id);
    const c = centers[it.group] || new THREE.Vector3();
    const spread = 0.36;
    pos[i * 3] = c.x + gauss(rnd) * spread;
    pos[i * 3 + 1] = c.y + gauss(rnd) * spread * 0.8;
    pos[i * 3 + 2] = c.z + gauss(rnd) * spread;
  });
  return { centers, pos };
}

function Scene({ items, groups, pathIds, activeGroup, hovered, setHovered, onPick, onGroup, still, light, groupLabels }) {
  const { gl, camera, size } = useThree();
  const root = useRef(null);
  const turn = useRef({ yaw: 0.4, pitch: 0.12, dragging: false, last: 0 });
  const cur = useRef({ yaw: 0.4, pitch: 0.12 });
  const { centers, pos } = useMemo(() => layout(items, groups), [items, groups]);
  const colorOf = useMemo(() => Object.fromEntries(groups.map((g) => [g.key, new THREE.Color(g.color)])), [groups]);
  const index = useMemo(() => Object.fromEntries(items.map((it, i) => [it.id, i])), [items]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const col = new Float32Array(items.length * 3);
    items.forEach((it, i) => { const c = colorOf[it.group] || new THREE.Color('#fff'); col.set([c.r, c.g, c.b], i * 3); });
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('size', new THREE.BufferAttribute(new Float32Array(items.length).fill(1), 1));
    g.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(items.length).fill(1), 1));
    g.computeBoundingSphere();
    return g;
  }, [pos, items, colorOf]);
  const mat = useMemo(() => glowPoints({ light, scale: 1 }), [light]);
  useEffect(() => { mat.uniforms.uPx.value = gl.getPixelRatio(); }, [gl, mat]);

  // faint threads: each star to its nearest earlier neighbour in the same group
  const threads = useMemo(() => {
    const seg = [];
    const byGroup = {};
    items.forEach((it, i) => { (byGroup[it.group] ||= []).push(i); });
    for (const list of Object.values(byGroup)) {
      for (let a = 1; a < list.length; a++) {
        let best = -1, bd = Infinity;
        for (let b = 0; b < a; b++) {
          const i = list[a] * 3, j = list[b] * 3;
          const d = (pos[i] - pos[j]) ** 2 + (pos[i + 1] - pos[j + 1]) ** 2 + (pos[i + 2] - pos[j + 2]) ** 2;
          if (d < bd) { bd = d; best = list[b]; }
        }
        if (best >= 0 && bd < 0.5) seg.push(...pos.slice(list[a] * 3, list[a] * 3 + 3), ...pos.slice(best * 3, best * 3 + 3));
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(seg), 3));
    return g;
  }, [items, pos]);

  const pathGeo = useMemo(() => {
    const pts = (pathIds || []).map((id) => index[id]).filter((i) => i != null).map((i) => new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]));
    if (pts.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    return new THREE.TubeGeometry(curve, pts.length * 24, 0.012, 6, false);
  }, [pathIds, index, pos]);

  // highlight: active group, path members, hovered star
  useEffect(() => {
    const size = geo.getAttribute('size'); const alpha = geo.getAttribute('alpha');
    const inPath = new Set(pathIds || []);
    items.forEach((it, i) => {
      const dim = (activeGroup && it.group !== activeGroup) || (inPath.size && !inPath.has(it.id));
      const hot = hovered === i || inPath.has(it.id);
      size.array[i] = hot ? 1.5 : dim ? 0.55 : 0.8;
      alpha.array[i] = dim ? 0.22 : 1;
    });
    size.needsUpdate = true; alpha.needsUpdate = true;
  }, [geo, items, activeGroup, pathIds, hovered]);

  // turn toward the active group
  useEffect(() => {
    if (!activeGroup || !centers[activeGroup]) return;
    const c = centers[activeGroup];
    const t = turn.current;
    const target = -Math.atan2(c.x, c.z);
    t.yaw = target + Math.round((t.yaw - target) / (2 * Math.PI)) * 2 * Math.PI;
    t.pitch = Math.max(-0.6, Math.min(0.6, Math.atan2(c.y, Math.hypot(c.x, c.z))));
  }, [activeGroup, centers]);

  // pointer: drag to turn, hover to read, tap to open
  const ray = useMemo(() => { const r = new THREE.Raycaster(); r.params.Points.threshold = 0.09; return r; }, []);
  const pointsRef = useRef(null);
  useEffect(() => {
    const el = gl.domElement;
    const ndc = new THREE.Vector2();
    const pick = (e) => {
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = pointsRef.current ? ray.intersectObject(pointsRef.current)[0] : null;
      return hit ? hit.index : null;
    };
    const off = dragToTurn(el, turn.current, { onTap: (e) => { const i = pick(e); if (i != null) onPick(items[i].id); } });
    let raf = 0;
    const move = (e) => {
      if (turn.current.dragging || raf) return;
      raf = requestAnimationFrame(() => { raf = 0; const i = pick(e); setHovered(i); el.style.cursor = i != null ? 'pointer' : 'grab'; });
    };
    const leave = () => setHovered(null);
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
    el.style.cursor = 'grab';
    return () => { off(); cancelAnimationFrame(raf); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, [gl, camera, ray, items, onPick, setHovered]);

  useFrame((_, dt) => {
    const t = turn.current; const c = cur.current;
    const idle = !t.dragging && performance.now() - t.last > 2500 && !activeGroup && hovered == null;
    if (idle && !still) t.yaw += Math.min(dt, 0.05) * 0.06;
    const k = still ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) * 4);
    c.yaw += (t.yaw - c.yaw) * k; c.pitch += (t.pitch - c.pitch) * k;
    if (root.current) root.current.rotation.set(c.pitch, c.yaw, 0);
  });

  const fitZ = Math.max(6.6, 2.75 / (Math.tan((19 * Math.PI) / 180) * Math.min(1, size.width / size.height)));
  useEffect(() => { camera.position.set(0, 0.2, fitZ); camera.lookAt(0, 0, 0); }, [camera, fitZ]);

  const hv = hovered != null ? items[hovered] : null;
  return (
    <group position={[size.width > 900 ? 0.25 : 0, 0.15, 0]}>
    <group ref={root}>
      <lineSegments geometry={threads}>
        <lineBasicMaterial color={light ? '#0A1412' : '#EDF3F0'} transparent opacity={light ? 0.08 : 0.07} depthWrite={false} />
      </lineSegments>
      <points ref={pointsRef} geometry={geo} material={mat} />
      {pathGeo && (
        <mesh geometry={pathGeo}>
          <meshBasicMaterial color={light ? '#0E9F6E' : '#5EF2B8'} transparent opacity={0.9} depthWrite={false} />
        </mesh>
      )}
      {groups.map((g) => {
        const c = centers[g.key];
        return (
          <Html key={g.key} position={[c.x * 1.28, c.y * 1.28 + 0.1, c.z * 1.28]} center zIndexRange={[20, 0]}>
            <button type="button" tabIndex={-1} className={`cst-label${activeGroup === g.key ? ' on' : ''}`} style={{ '--c': g.color }} onClick={() => onGroup(g.key)}>
              {groupLabels[g.key] || g.key}
            </button>
          </Html>
        );
      })}
      {hv && (
        <Html position={[pos[hovered * 3], pos[hovered * 3 + 1], pos[hovered * 3 + 2]]} zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
          <div className="cst-tip"><b>{hv.label}</b>{hv.sub && <span>{hv.sub}</span>}</div>
        </Html>
      )}
    </group>
    </group>
  );
}

export default function Constellation(props) {
  const wrap = useRef(null);
  const [visible, setVisible] = useState(true);
  const [hovered, setHovered] = useState(null);
  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={wrap} className="cst-wrap">
      <Canvas dpr={[1, 1.75]} frameloop={visible ? 'always' : 'never'} camera={{ position: [0, 0.2, 7.2], fov: 38, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true }} onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}>
        <Scene {...props} hovered={hovered} setHovered={setHovered} />
      </Canvas>
    </div>
  );
}
