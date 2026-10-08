#!/usr/bin/env node
// Playbook I for 3D results: load a .glb with three.js in headless Chromium, report its stats,
// and save a clay-render contact sheet (4 views) for the flaw check.
//
//   node scripts/glb_inspect.mjs <model.glb> <out.png> [--size 512]
//
// Prints JSON: vertices, triangles, meshes, textures, bounding box, and connected components
// (pieces that share no vertex: a thin part that "broke off" shows up as an extra component).
// Uses video/node_modules/three and Playwright's Chromium (software WebGL).
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [glb, outPng] = process.argv.slice(2);
const size = Number(process.argv[process.argv.indexOf("--size") + 1]) || 512;
if (!glb || !outPng) {
  console.error("usage: node scripts/glb_inspect.mjs <model.glb> <out.png> [--size 512]");
  process.exit(2);
}
const pwPath = ["/opt/node22/lib/node_modules/playwright/index.mjs", join(root, "video/node_modules/playwright/index.mjs")].find(existsSync);
const { chromium } = await import(pwPath ?? "playwright");

const page = `<!doctype html><html><body style="margin:0;background:#D8DCCD">
<script type="importmap">{"imports":{"three":"/video/node_modules/three/build/three.module.js","three/addons/":"/video/node_modules/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
const S = ${size};
const gltf = await new GLTFLoader().loadAsync("/__model.glb");
const scene = gltf.scene;
let vertices = 0, triangles = 0, meshes = 0, textures = 0, components = 0;
scene.traverse((o) => {
  if (!o.isMesh) return;
  meshes++;
  const g = o.geometry;
  const n = g.attributes.position.count;
  vertices += n;
  const idx = g.index ? g.index.array : null;
  triangles += idx ? idx.length / 3 : n / 3;
  const m = o.material;
  for (const k of ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap"]) if (m && m[k]) textures++;
  // Union-find over welded positions (exporters often split vertices along seams).
  const pos = g.attributes.position.array;
  const key = new Map(); const id = new Int32Array(n);
  for (let i = 0; i < n; i++) { const k = pos[3*i].toFixed(5)+","+pos[3*i+1].toFixed(5)+","+pos[3*i+2].toFixed(5); if (!key.has(k)) key.set(k, key.size); id[i] = key.get(k); }
  const parent = new Int32Array(key.size).map((_, i) => i);
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const tri = idx ?? Array.from({ length: n }, (_, i) => i);
  for (let t = 0; t < tri.length; t += 3) { const a = find(id[tri[t]]), b = find(id[tri[t+1]]), c = find(id[tri[t+2]]); parent[b] = a; parent[find(c)] = a; }
  const roots = new Map();
  for (let t = 0; t < tri.length; t += 3) { const r = find(id[tri[t]]); roots.set(r, (roots.get(r) ?? 0) + 1); }
  const sizes = [...roots.values()].sort((a, b) => b - a);
  components += sizes.length;
  window.__sizes = sizes.slice(0, 8);
});
const box = new THREE.Box3().setFromObject(scene);
const dim = box.getSize(new THREE.Vector3()); const c = box.getCenter(new THREE.Vector3());
scene.position.sub(c);
const clay = new THREE.MeshStandardMaterial({ color: 0xc9cec0, roughness: 0.85, metalness: 0 });
scene.traverse((o) => { if (o.isMesh) o.material = clay; });
const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
r.setSize(S * 2, S * 2); r.setClearColor(0xd8dccd); document.body.appendChild(r.domElement);
const world = new THREE.Scene(); world.add(scene);
world.add(new THREE.HemisphereLight(0xffffff, 0x8c938d, 1.6));
const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(2, 3, 2); world.add(key);
const rad = dim.length() / 2;
const cam = new THREE.PerspectiveCamera(30, 1, rad / 100, rad * 100);
const views = [[0, 0.15], [Math.PI / 2, 0.15], [Math.PI, 0.15], [-Math.PI / 4, 0.6]];
r.setScissorTest(true);
views.forEach(([az, el], i) => {
  const x = (i % 2) * S, y = (1 - Math.floor(i / 2)) * S;
  r.setViewport(x, y, S, S); r.setScissor(x, y, S, S);
  const d = rad / Math.sin((15 * Math.PI) / 180) * 1.05;
  cam.position.set(Math.sin(az) * Math.cos(el) * d, Math.sin(el) * d, Math.cos(az) * Math.cos(el) * d);
  cam.lookAt(0, 0, 0); r.render(world, cam);
});
window.__stats = { vertices, triangles, meshes, textures, components, largest_components_tris: window.__sizes,
  bbox: [dim.x, dim.y, dim.z].map((v) => +v.toFixed(4)) };
window.__done = true;
</script></body></html>`;

const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/") return res.writeHead(200, { "content-type": "text/html" }).end(page);
  if (url === "/__model.glb") return res.writeHead(200, { "content-type": "model/gltf-binary" }).end(readFileSync(resolve(glb)));
  const f = join(root, url);
  if (!f.startsWith(join(root, "video/node_modules/three")) || !existsSync(f)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": extname(f) === ".js" ? "text/javascript" : "application/octet-stream" }).end(readFileSync(f));
}).listen(0);
const port = server.address().port;
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await browser.newPage({ viewport: { width: size * 2, height: size * 2 } });
p.on("pageerror", (e) => console.error("page error:", e.message));
await p.goto(`http://127.0.0.1:${port}/`);
await p.waitForFunction(() => window.__done === true, null, { timeout: 180000 });
const stats = await p.evaluate(() => window.__stats);
await p.locator("canvas").screenshot({ path: outPng });
await browser.close();
server.close();
console.log(JSON.stringify(stats));
