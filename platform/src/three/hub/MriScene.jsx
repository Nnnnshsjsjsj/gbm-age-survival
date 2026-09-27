// "From a 3D tumour to an MRI slice": a see-through model head with the tumour layers inside and the current slice
// drawn as a textured plane moving through it. The slice image itself is rendered on a 2D canvas (mriModel.js).
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { BRAIN, TUMOR, planePoint } from '../../lib/mriModel.js';

function shell(color, opacity, power = 2.2) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.FrontSide,
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uPow: { value: power } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uOpacity; uniform float uPow; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1. - abs(dot(vN, vV)), uPow); gl_FragColor = vec4(uColor, uOpacity * (0.15 + f)); }`,
  });
}

function Slice({ plane, s, source, version }) {
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(source);
    t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter;
    return t;
  }, [source]);
  const { invalidate } = useThree();
  useEffect(() => { tex.needsUpdate = true; invalidate(); }, [tex, version, invalidate]);
  const geo = useMemo(() => {
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    const pos = corners.flatMap(([u, v]) => planePoint(plane, u, v, s));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    return g;
  }, [plane, s]);
  const frame = useMemo(() => {
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]];
    return new THREE.BufferGeometry().setFromPoints(corners.map(([u, v]) => new THREE.Vector3(...planePoint(plane, u, v, s))));
  }, [plane, s]);
  useEffect(() => () => { geo.dispose(); frame.dispose(); }, [geo, frame]);
  return (
    <group>
      <mesh geometry={geo} renderOrder={2}>
        <meshBasicMaterial map={tex} transparent alphaTest={0.02} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <line geometry={frame}>
        <lineBasicMaterial color="#5EF2B8" transparent opacity={0.55} />
      </line>
    </group>
  );
}

function Head({ light }) {
  const scalp = useMemo(() => shell(light ? '#0B7FAB' : '#4CC9F0', light ? 0.18 : 0.22, 2.4), [light]);
  const brain = useMemo(() => shell(light ? '#0E9F6E' : '#5EF2B8', light ? 0.12 : 0.14, 1.6), [light]);
  const T = [TUMOR.x, TUMOR.y, TUMOR.z];
  return (
    <group>
      <mesh scale={[BRAIN.a * 1.2, BRAIN.b * 1.2, BRAIN.c * 1.2]} position={[0, BRAIN.cy, 0]} material={scalp} renderOrder={3}>
        <sphereGeometry args={[1, 64, 48]} />
      </mesh>
      <mesh scale={[BRAIN.a, BRAIN.b, BRAIN.c]} position={[0, BRAIN.cy, 0]} material={brain} renderOrder={3}>
        <sphereGeometry args={[1, 64, 48]} />
      </mesh>
      <mesh position={T} renderOrder={1}>
        <sphereGeometry args={[TUMOR.oedema, 32, 24]} />
        <meshBasicMaterial color="#4CC9F0" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <mesh position={T} renderOrder={1}>
        <sphereGeometry args={[TUMOR.rim, 32, 24]} />
        <meshBasicMaterial color="#FF8A5B" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh position={T} renderOrder={1}>
        <sphereGeometry args={[TUMOR.core, 24, 16]} />
        <meshBasicMaterial color="#3A1712" />
      </mesh>
    </group>
  );
}

export default function MriScene({ plane, s, source, version, still, light }) {
  const controls = useRef(null);
  return (
    <Canvas dpr={[1, 1.75]} frameloop="demand" camera={{ position: [1.9, 2.3, 2.5], fov: 36 }} gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}>
      <Head light={light} />
      <Slice plane={plane} s={s} source={source} version={version} />
      <OrbitControls ref={controls} enablePan={false} minDistance={2} maxDistance={6} enableDamping={!still} />
    </Canvas>
  );
}
