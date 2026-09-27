// The home page's single fixed canvas: the brain travels along the scroll story (see storyStore.js).
import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Brain, Label, ANCHORS } from './Brain.jsx';
import { TUMOUR } from './anatomy.js';
import { story, poseAt, POSES } from './storyStore.js';

const LABELS = [
  ['core', 'left'], ['rim', 'right'], ['oedema', 'right'], ['infiltration', 'left'],
  ['frontal', 'left'], ['temporal', 'right'], ['cerebellum', 'down'],
];

function Rig({ wrap, mobile, still, theme, labels }) {
  const brain = useRef(null);
  const cur = useRef({ ...POSES.hero, alpha: 0 }); // fades in on the first frames
  const target = useRef({});
  const pt = useRef({ x: 0, y: 0 });
  const viewport = useThree((s) => s.viewport);
  const q = useRef(new THREE.Quaternion());
  const e = useRef(new THREE.Euler());
  const tv = useRef(new THREE.Vector3());

  useFrame((state, dt) => {
    const b = brain.current;
    if (!b) return;
    const travel = story.travel;
    const goal = travel ? poseAt(window.scrollY, target.current) : POSES.hero;
    const c = cur.current;
    const k = still ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) * 3.2);
    for (const key of Object.keys(goal)) c[key] += (goal[key] - c[key]) * k;
    const kp = still ? 0 : 1 - Math.exp(-Math.min(dt, 0.1) * 2.2);
    pt.current.x += (story.pointer.x - pt.current.x) * kp;
    pt.current.y += (story.pointer.y - pt.current.y) * kp;

    const t = state.clock.elapsedTime;
    const sway = still ? 0 : Math.sin(t * 0.22) * 0.16 * (1 - c.focus * 0.6);
    const yaw = c.yaw + sway + pt.current.x * 0.16;
    const pitch = c.pitch + pt.current.y * 0.08;
    const fit = Math.min(1, viewport.width / (mobile ? 2.3 : 3.1));
    const s = c.s * fit;
    const g = b.group;
    e.current.set(pitch, yaw, 0, 'YXZ');
    g.rotation.copy(e.current);
    g.scale.setScalar(s);
    q.current.setFromEuler(e.current);
    tv.current.copy(TUMOUR).applyQuaternion(q.current).multiplyScalar(s * c.focus);
    const px = (mobile ? 0 : c.x) * viewport.width;
    const py = c.y * viewport.height + 0.12 * s * (1 - c.focus);
    g.position.set(px - tv.current.x, py - tv.current.y, -tv.current.z);

    b.cortexUniforms.uOpacity.value = c.op;
    b.tumourUniforms.uXray.value = c.xray;
    const cu = b.cellsMaterial.uniforms;
    cu.uMode.value = c.cells; cu.uCluster.value = c.cells;
    if (wrap.current) wrap.current.style.opacity = c.alpha.toFixed(3);
  });

  return (
    <Brain ref={brain} mobile={mobile} theme={theme} still={still}>
      {!mobile && LABELS.map(([key, side]) => (
        <Label key={key} at={ANCHORS[key]} side={side} text={labels[key]} watch={() => story.labels[key]} />
      ))}
    </Brain>
  );
}

export default function StoryCanvas({ mobile, still, theme, labels, onReady }) {
  const wrap = useRef(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([en]) => setVisible(en.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const frameloop = !visible ? 'never' : still ? 'demand' : 'always';
  return (
    <div ref={wrap} className={`story-canvas${story.travel ? ' travel' : ' hero-only'}`} aria-hidden="true" data-testid="brain-canvas">
      <Canvas
        dpr={[1, 1.75]} frameloop={frameloop}
        camera={{ position: [0, 0, 6], fov: 30, near: 0.1, far: 40 }}
        gl={{ antialias: true, alpha: true, stencil: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => { gl.localClippingEnabled = true; gl.setClearColor(0x000000, 0); onReady?.(); }}
        style={{ pointerEvents: 'none' }}
      >
        <Rig wrap={wrap} mobile={mobile} still={still} theme={theme} labels={labels} />
      </Canvas>
    </div>
  );
}
