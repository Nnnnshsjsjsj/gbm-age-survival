// Assembles the brain as a plain three.js group, so the same object serves the story canvas, the Brain lab and
// the screenshot harness. React components wrap it with <primitive>.
import * as THREE from 'three';
import {
  buildHemisphere, buildCerebellum, buildBrainstem, buildBlob, buildCells, detailFor, STATE_DIRS, REGION, regionAt,
} from './anatomy.js';
import {
  cortexUniforms, cortexMaterials, tumourUniforms, tumourMaterials, cellsMaterial, setTheme, stencilPair, capMaterial, PALETTE,
} from './materials.js';

export const LAYERS = ['cortex', 'hind', 'oedema', 'rim', 'core', 'cells'];

export function createBrain({ mobile = false, theme = 'dark', pixelRatio = 1 } = {}) {
  const lod = detailFor({ mobile });
  const clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 10); // keeps x < constant; 10 = no cut
  const planes = [clipPlane];

  const cu = cortexUniforms(theme);
  const cortexMat = cortexMaterials(cu, planes);
  const tu = tumourUniforms();
  const tm = tumourMaterials(tu, planes);
  const cm = cellsMaterial(pixelRatio);
  cm.uniforms.uStateDir.value = STATE_DIRS.map((d) => d.clone());

  const group = new THREE.Group();
  group.name = 'brain';

  const cortexMeshes = [];
  const addCortex = (geo, name, layer) => {
    const pre = new THREE.Mesh(geo, cortexMat.prepass); pre.renderOrder = 2; pre.name = `${name}-depth`;
    const col = new THREE.Mesh(geo, cortexMat.color); col.renderOrder = 3; col.name = name;
    pre.userData.layer = layer; col.userData.layer = layer;
    group.add(pre, col);
    cortexMeshes.push(pre, col);
    return col;
  };

  const right = addCortex(buildHemisphere(lod.hemi, 1), 'hemisphere-right', 'cortex');
  const left = addCortex(buildHemisphere(lod.hemi, -1), 'hemisphere-left', 'cortex');
  const cereb = addCortex(buildCerebellum(lod.cereb), 'cerebellum', 'hind');
  const stem = addCortex(buildBrainstem(lod.stemRings), 'brainstem', 'hind');

  const coreGeo = buildBlob(mobile ? 3 : 4, 0.068, 0.3, 2.0, 21, [1, 0.92, 1.1], 2);
  const rimGeo = buildBlob(mobile ? 4 : 5, 0.12, 0.22, 2.2, 22, [1, 0.9, 1.12], 2);
  const oedemaGeo = buildBlob(mobile ? 3 : 4, 0.215, 0.26, 1.6, 23, [0.95, 0.85, 1.25]);
  const core = new THREE.Mesh(coreGeo, tm.core); core.renderOrder = 0; core.name = 'core';
  const rim = new THREE.Mesh(rimGeo, tm.rim); rim.renderOrder = 0; rim.name = 'rim';
  const xray = new THREE.Mesh(rimGeo, tm.xray); xray.renderOrder = 4; xray.name = 'rim-xray';
  const oedema = new THREE.Mesh(oedemaGeo, tm.oedema); oedema.renderOrder = 1; oedema.name = 'oedema';
  const cells = new THREE.Points(buildCells(lod.cells), cm); cells.renderOrder = 1; cells.name = 'cells'; cells.frustumCulled = false;
  core.userData.layer = 'core'; rim.userData.layer = 'rim'; xray.userData.layer = 'rim'; oedema.userData.layer = 'oedema'; cells.userData.layer = 'cells';
  group.add(core, rim, oedema, cells, xray);

  // cross-section caps, drawn only while a cut is active (painter's order: tissue, oedema, rim, core)
  const caps = new THREE.Group(); caps.visible = false; caps.name = 'caps';
  const capPlane = new THREE.PlaneGeometry(3.2, 3.2).rotateY(Math.PI / 2);
  const P = PALETTE[theme] || PALETTE.dark;
  const capDefs = [
    { meshes: [right, left, cereb], mat: capMaterial({ color: P.cut, line: P.cutLine, kind: 0 }), layer: 'cortex' },
    { meshes: [oedema], mat: capMaterial({ color: '#1d5a70', alpha: 0.8, kind: 1 }), layer: 'oedema' },
    { meshes: [rim], mat: capMaterial({ color: '#E8764F', line: '#F5B35C', kind: 2, time: tu.uTime }), layer: 'rim' },
    { meshes: [core], mat: capMaterial({ color: '#3a1511', kind: 3 }), layer: 'core' },
  ];
  const capParts = [];
  let order = 10;
  for (const def of capDefs) {
    const sp = stencilPair(planes);
    for (const src of def.meshes) {
      const b = new THREE.Mesh(src.geometry, sp.back); b.renderOrder = order;
      const f = new THREE.Mesh(src.geometry, sp.front); f.renderOrder = order + 1;
      b.userData.layer = def.layer; f.userData.layer = def.layer;
      caps.add(b, f); capParts.push(b, f);
    }
    const plane = new THREE.Mesh(capPlane, def.mat); plane.renderOrder = order + 2; plane.userData.layer = def.layer; plane.userData.cap = true;
    caps.add(plane); capParts.push(plane);
    order += 3;
  }
  group.add(caps);

  const all = [...cortexMeshes, core, rim, xray, oedema, cells, ...capParts];

  // low-poly stand-ins for pointer picking (raycasting the full meshes on every move would be wasteful)
  const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
  const proxy = (geo, key, layer) => { const m = new THREE.Mesh(geo, proxyMat); m.userData = { key, layer }; return m; };
  const proxies = [
    proxy(buildHemisphere(3, 1), 'cerebrum', 'cortex'), proxy(buildHemisphere(3, -1), 'cerebrum', 'cortex'),
    proxy(buildCerebellum(3), 'cerebellum', 'hind'), proxy(buildBrainstem(16, 12), 'stem', 'hind'),
    proxy(buildBlob(2, 0.215, 0.26, 1.6, 23, [0.95, 0.85, 1.25]), 'oedema', 'oedema'),
    proxy(buildBlob(2, 0.12, 0.22, 2.2, 22, [1, 0.9, 1.12], 2), 'rim', 'rim'),
    proxy(buildBlob(2, 0.068, 0.3, 2.0, 21, [1, 0.92, 1.1], 2), 'core', 'core'),
  ];
  const pickGroup = new THREE.Group(); pickGroup.name = 'pick';
  pickGroup.add(...proxies);
  group.add(pickGroup);
  const layerOn = { cortex: true, hind: true, oedema: true, rim: true, core: true, cells: true };
  const ray = new THREE.Raycaster();
  const LOBE = ['frontal', 'parietal', 'temporal', 'occipital'];
  const pickable = [right, left, cereb, stem, core, rim, oedema];

  let triangles = 0;
  for (const m of [right, left, cereb, stem, core, rim, oedema]) triangles += m.geometry.index.count / 3;

  const api = {
    group, clipPlane, cortexUniforms: cu, tumourUniforms: tu, cellsMaterial: cm, pickable, triangles, lod,
    meshes: { right, left, cereb, stem, core, rim, xray, oedema, cells },
    setTime(t) { cu.uTime.value = t; tu.uTime.value = t; cm.uniforms.uTime.value = t; },
    setLayer(name, on) { layerOn[name] = on; for (const m of all) if (m.userData.layer === name) m.visible = on; },
    /**
     * What is under a normalised pointer position: the innermost visible tumour layer wins (it is seen through the
     * cortex), then the cortex lobe, cerebellum or brainstem. Returns a structure key or null.
     */
    pick(ndc, camera) {
      ray.setFromCamera(ndc, camera);
      const cut = clipPlane.constant;
      const hits = ray.intersectObjects(proxies.filter((p) => layerOn[p.userData.layer]), false)
        .filter((h) => h.point.x <= cut + 1e-3);
      if (!hits.length) return null;
      for (const k of ['core', 'rim', 'oedema']) if (hits.some((h) => h.object.userData.key === k)) return k;
      const h = hits[0];
      if (h.object.userData.key === 'cerebrum') { const p = h.point.clone(); group.worldToLocal(p); return LOBE[regionAt(p.x, p.y, p.z)]; }
      return h.object.userData.key;
    },
    setTheme(th) { setTheme(cu, th); },
    /** Sagittal cut: keeps everything with x below `x` (object space). Pass null for no cut. */
    setCut(x) {
      const on = x != null;
      clipPlane.constant = on ? x : 10;
      caps.visible = on;
      for (const p of capParts) if (p.userData.cap) p.position.x = on ? x : 0;
      xray.material.visible = !on;
      cm.depthTest = !on; // cells show on the cut face
      cells.renderOrder = on ? 40 : 1;
    },
    setRegionHighlight(hover, select) { cu.uHover.value = hover ?? -1; cu.uSelect.value = select ?? -1; },
    setTumourHighlight(which) {
      tu.uHiCore.value = which === 'core' ? 1 : 0; tu.uHiRim.value = which === 'rim' ? 1 : 0; tu.uHiOedema.value = which === 'oedema' ? 1 : 0;
    },
    dispose() {
      for (const m of all) { m.geometry.dispose(); }
      for (const mat of [cortexMat.prepass, cortexMat.color, tm.core, tm.rim, tm.xray, tm.oedema, cm]) mat.dispose();
      for (const p of capParts) p.material.dispose();
      capPlane.dispose();
      for (const p of proxies) p.geometry.dispose();
      proxyMat.dispose();
    },
  };
  return api;
}

export { REGION };
