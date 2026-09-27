// Builds public/hub/land.json (dotted land for the globe) from Natural Earth via world-atlas (public domain / ISC).
// Run once from platform/: npm i --no-save world-atlas@2 topojson-client d3-geo && node data-src/land.mjs
import fs from 'fs';
import { feature } from 'topojson-client';
import { geoContains } from 'd3-geo';
const topo = JSON.parse(fs.readFileSync(new URL('../node_modules/world-atlas/land-110m.json', import.meta.url)));
const land = feature(topo, topo.objects.land);
const N = 16000, out = [];
const ga = Math.PI * (3 - Math.sqrt(5));
for (let i = 0; i < N; i++) {
  const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = ga * i;
  const lat = Math.asin(y) * 180 / Math.PI, lng = ((Math.atan2(Math.sin(th) * r, Math.cos(th) * r) * 180 / Math.PI));
  if (lat < -60) continue; // skip Antarctica for a cleaner look
  if (geoContains(land, [lng, lat])) out.push(Math.round(lat * 10), Math.round(lng * 10));
}
fs.writeFileSync(new URL('../public/hub/land.json', import.meta.url), JSON.stringify(out));
console.log(out.length / 2, 'dots', fs.statSync(new URL('../public/hub/land.json', import.meta.url)).size, 'bytes');
