// Engine: toon world + cartoon cards + ink + grade + lens blur. window.renderFrame(f) draws one frame.
import * as THREE from './three.module.js';
import * as S from './story.js';
import * as C from './cast.js';
import * as PT from './paint.js';

const W = 1080, H = 1920;
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xc4dcf0, 40, 420);
const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 2500);

// ---------- toon materials ----------
const grad = new THREE.DataTexture(new Uint8Array([120, 120, 255, 255]), 4, 1, THREE.RedFormat);
grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
const texOf = (cv, rep = [1, 1]) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = 8; return t; };
const toon = (col, map = null, extra = {}) => new THREE.MeshToonMaterial({ color: col, map, gradientMap: grad, ...extra });
const ND = (m, kind = 'world') => { m.userData.nd = kind; return m; };
const add = (geo, mat, pos = [0, 0, 0], parent = scene, opts = {}) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(...pos);
  m.castShadow = opts.cast ?? true; m.receiveShadow = opts.recv ?? true; ND(m, opts.nd ?? 'world');
  parent.add(m); return m;
};
/** box with constant texel density: T metres per texture repeat */
const tbox = (w, h, d, mat, pos, parent = scene, T = 2, opts) => {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const sz = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * sz[f][0] / T, uv.getY(k) * sz[f][1] / T); }
  return add(g, mat, pos, parent, opts);
};
const cyl = (r0, r1, h, mat, pos, parent = scene, seg = 14, opts) => add(new THREE.CylinderGeometry(r0, r1, h, seg), mat, pos, parent, opts);
const R = (s) => { const x = Math.sin(s * 127.1 + 0.7) * 43758.5453; return x - Math.floor(x); };

// ---------- lights ----------
const hemi = new THREE.HemisphereLight(0xbcd4f0, 0xa98c5a, 1.1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2.4); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 200 });
scene.add(sun); scene.add(sun.target);

// ---------- sky ----------
const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, sunAmt: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top, hor, sunDir, sunCol; uniform float sunAmt; varying vec3 vD;
    void main(){ float y = max(vD.y, 0.); vec3 c = mix(hor, top, pow(smoothstep(0., .55, y), .7));
      float s = max(dot(normalize(vD), normalize(sunDir)), 0.); c += sunAmt * sunCol * (smoothstep(.9985, .9992, s) * 2.5 + pow(s, 60.) * .5);
      gl_FragColor = vec4(c, 1.); }`,
}));
sky.frustumCulled = false; sky.renderOrder = -10; ND(sky, 'sky'); scene.add(sky);

// ---------- world: Paris 1925 ----------
const ground = (w, d, cv, T, pos, y, rot = 0) => {
  const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
  const m = add(g, toon(0xffffff, texOf(cv, [w / T, d / T])), [pos[0], y, pos[1]], scene, { cast: false });
  m.rotation.y = rot; return m;
};
ground(3000, 3000, PT.grass(), 10, [0, -400], 0);
ground(80, 60, PT.cobble(), 4, [0, 10], 0.01);
ground(24, 320, PT.gravel(), 8, [0, -180], 0.012);
for (const x of [-30, 30]) ground(10, 360, PT.cobble(), 4, [x, -150], 0.013);
// facade box: uv repeats per storey (3.5 m) and window pair (6 m)
const fbox = (w, h, d, mat, pos, parent = scene) => {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const sz = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * sz[f][0] / 6, uv.getY(k) * sz[f][1] / 3.5); }
  return add(g, mat, pos, parent);
};
const facCols = ['#ecdfc6', '#e6d6b8', '#f0e4cc', '#e2d0b0'];
const facMats = facCols.map((c) => toon(0xffffff, texOf(PT.facade(c))));
const roofMat = toon(0xffffff, texOf(PT.mansard()));
const shopMats = [['#2f4a3a', 'CAFÉ'], ['#6a2a2a', 'BOULANGERIE'], ['#2a3a5a', 'TABAC'], ['#4a3a2a', 'LIBRAIRIE']].map(([c, l]) => { const t = texOf(PT.shopfront(c, l)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return toon(0xffffff, t); });
const building = (x, z, w, d, side, i) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const h = 21;
  fbox(d, h - 4.5, w, facMats[i % 4], [0, 4.5 + (h - 4.5) / 2, 0], g);
  tbox(d, 4.5, w, toon(0xd8ccb4), [0, 2.25, 0], g, 3);
  const shop = add(new THREE.PlaneGeometry(w * 0.9, 4.2), shopMats[i % 4], [side * (d / 2 + 0.02), 2.2, 0], g, { cast: false });
  shop.rotation.y = side * Math.PI / 2;
  tbox(d + 0.8, 0.5, w + 0.2, toon(0xefe6d4), [0, h + 0.25, 0], g, 2); // cornice
  const roof = tbox(d - 3, 4, w - 0.6, roofMat, [0, h + 2.5, 0], g, 3); // mansard
  for (let k = -2; k <= 2; k++) tbox(1.2, 1.6, 1.2, toon(0xd8d0c0), [side * (d / 2 - 1.8), h + 1.6, k * (w / 5.5)], g, 1); // dormers
  for (const k of [-1, 1]) tbox(0.9, 3, 0.9, toon(0xb06a4a), [0, h + 5, k * w * 0.3], g, 1); // chimneys
};
let bi = 0;
for (const side of [-1, 1]) for (let z = 40; z > -230; z -= 31) building(side * -44, z, 30, 16, side, bi++);
// tower: four lattice frustums + platforms + spire
const latticeTex = (rep) => { const t = texOf(PT.lattice('#7a5638'), rep); return t; };
const towerMat = (rep) => new THREE.MeshToonMaterial({ color: 0xffffff, map: latticeTex(rep), gradientMap: grad, alphaTest: 0.5, side: THREE.DoubleSide });
const towerGroup = (s = 1) => {
  const g = new THREE.Group();
  const sec = (y0, y1, w0, w1, rep) => {
    const geo = new THREE.CylinderGeometry(w1 * Math.SQRT1_2, w0 * Math.SQRT1_2, y1 - y0, 4, 1, true); geo.rotateY(Math.PI / 4);
    const m = add(geo, towerMat(rep), [0, (y0 + y1) / 2, 0], g); return m;
  };
  sec(0, 57, 125, 72, [4, 3]);
  for (const [r, x, z] of [[0, 0, 52], [0, 0, -52], [Math.PI / 2, 52, 0], [Math.PI / 2, -52, 0]]) { const a = add(new THREE.TorusGeometry(34, 2.0, 6, 24, Math.PI), toon(0x6a4a30), [x, 0, z], g); a.rotation.y = r; a.scale.set(1, 1.15, 1); }
  sec(57, 115, 72, 44, [4, 3]);
  sec(115, 200, 40, 22, [5, 6]);
  sec(200, 276, 22, 10, [4, 7]);
  for (const [y, w] of [[57, 80], [115, 46], [276, 14]]) tbox(w, 4, w, toon(0x6a4a30), [0, y, 0], g, 6);
  cyl(5, 6, 12, toon(0x6a4a30), [0, 284, 0], g, 8);
  cyl(0.4, 1.2, 18, toon(0x5a3a28), [0, 299, 0], g, 6);
  g.scale.setScalar(s); return g;
};
const tower = towerGroup(); tower.position.set(...S.TOWER); scene.add(tower);
tower.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } });
// plane trees + lamps along the avenue
const leafMat = [toon(0x5f8a3e), toon(0x6c964a), toon(0x547c38)], barkMat = toon(0x9a8a6a);
const ptree = (x, z, seed) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  cyl(0.22, 0.32, 4.5, barkMat, [0, 2.25, 0], g, 8);
  for (let i = 0; i < 5; i++) add(new THREE.IcosahedronGeometry(1.8 + R(seed + i) * 0.8, 1), leafMat[i % 3], [(R(seed * 3 + i) - 0.5) * 3, 5.6 + R(seed + i * 2) * 1.6, (R(seed * 5 + i) - 0.5) * 3], g);
};
const lamp = (x, z) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const iron = toon(0x22262a);
  cyl(0.06, 0.11, 3.6, iron, [0, 1.8, 0], g, 8);
  cyl(0.16, 0.2, 0.3, iron, [0, 0.15, 0], g, 8);
  add(new THREE.SphereGeometry(0.2, 12, 8), toon(0xfff2c0, null, { emissive: 0x6a5a30 }), [0, 3.75, 0], g);
  cyl(0.24, 0.05, 0.18, iron, [0, 4.0, 0], g, 8);
};
for (let z = 30; z > -220; z -= 13) { ptree(-19, z, z); ptree(19, z - 6, z + 50); }
for (let z = 22; z > -60; z -= 13) { lamp(-10, z); lamp(10, z - 6); }
for (let i = 0; i < 30; i++) { const a = (i / 30) * Math.PI * 2, r = 700 + R(i) * 200; const h = add(new THREE.SphereGeometry(1, 16, 8), toon([0x8fa0a8, 0x9aa8b0, 0x8a9aa0][i % 3]), [Math.cos(a) * r, -10, Math.sin(a) * r], scene, { cast: false }); h.scale.set(120, 30 + R(i) * 40, 90); }
const clouds = [];
for (let i = 0; i < 12; i++) {
  const t = texOf(PT.cloud(i + 1)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(200, 100), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.4, fog: false, depthWrite: false }));
  const a = (i / 12) * Math.PI * 2 + R(i) * 0.3, r = 1100;
  m.position.set(Math.cos(a) * r, 260 + R(i * 3) * 260, Math.sin(a) * r); m.scale.setScalar(1.4 + R(i * 5) * 1.0); m.renderOrder = -5;
  ND(m, 'hide'); scene.add(m); clouds.push(m);
}
// police station (protrudes from the left row)
{
  const g = new THREE.Group(); g.position.set(...S.POLICE); scene.add(g);
  tbox(3, 7, 9, toon(0xffffff, texOf(PT.plainWall('#d8ccb0'))), [-1.5, 3.5, 0], g, 3);
  tbox(0.2, 2.6, 1.5, toon(0x2a3a6a), [0.02, 1.3, -0.2], g, 1); // door
  tbox(0.22, 0.2, 1.9, toon(0xe8e2d4), [0.05, 2.7, -0.2], g, 1);
  const st = texOf(PT.sign('POLICE')); st.wrapS = st.wrapT = THREE.ClampToEdgeWrapping;
  const sg = add(new THREE.PlaneGeometry(2.4, 0.75), toon(0xffffff, st, { emissive: 0x111111 }), [0.14, 3.35, -0.2], g, { cast: false }); sg.rotation.y = Math.PI / 2;
  for (const dz of [-2.6, 2.2]) { tbox(0.15, 1.4, 1.1, toon(0x2a3446), [0.02, 1.8, dz], g, 1); tbox(0.18, 0.12, 1.3, toon(0xefe6d4), [0.04, 2.55, dz], g, 1); }
  cyl(0.03, 0.03, 1.6, toon(0x333333), [0.6, 4.5, -0.2], g, 6).rotation.z = -0.6;
  for (const [i, c] of [[0, 0x2a3f9a], [1, 0xf4f4f4], [2, 0xd42a36]]) tbox(0.02, 0.6, 0.3, toon(c), [1.05 + 0.02 * i, 4.9, -0.2 + 0.3 * (i - 1) + 0.0], g, 1);
}
// 1920s taxi
const car = new THREE.Group(); scene.add(car);
const carBody = new THREE.Group(); car.add(carBody);
const carWheels = []; let carDoor, carHole;
{
  const red = toon(0x8a1e2a), blk = toon(0x1c1a1e), chrome = toon(0xd8dade);
  tbox(1.5, 0.25, 4.0, blk, [0, 0.55, 0], carBody, 2);
  tbox(1.3, 0.7, 1.4, red, [0, 1.0, -1.25], carBody, 1.5); // bonnet (car faces -z)
  tbox(0.1, 0.7, 1.0, chrome, [0, 1.0, -1.98], carBody, 0.5).rotation.y = Math.PI / 2;
  tbox(1.5, 0.75, 2.2, red, [0, 1.05, 0.65], carBody, 1.5);
  tbox(1.5, 0.08, 2.2, blk, [0, 2.2, 0.65], carBody, 1.5);
  for (const [x, z] of [[-0.72, -0.4], [0.72, -0.4], [-0.72, 1.7], [0.72, 1.7]]) tbox(0.07, 0.8, 0.07, blk, [x, 1.8, z], carBody, 1);
  tbox(1.5, 0.75, 0.08, blk, [0, 1.8, 1.72], carBody, 1);
  // passenger door on the camera side (+x): pivots at its front edge
  carHole = add(new THREE.PlaneGeometry(0.9, 0.66), toon(0x1a1416), [0.757, 1.06, 0.6], carBody, { cast: false }); carHole.rotation.y = Math.PI / 2;
  carDoor = new THREE.Group(); carDoor.position.set(0.77, 1.06, 0.15); carBody.add(carDoor);
  tbox(0.04, 0.68, 0.9, red, [0, 0, 0.45], carDoor, 1.5);
  tbox(0.05, 0.05, 0.14, chrome, [0.03, 0.08, 0.75], carDoor, 0.3);
  for (const y of [-0.3, 0.3]) tbox(0.045, 0.03, 0.9, blk, [0.005, y, 0.45], carDoor, 1);
  for (const s of [-1, 1]) { tbox(0.35, 0.06, 3.6, blk, [s * 0.92, 0.48, 0.1], carBody, 1); add(new THREE.SphereGeometry(0.14, 12, 8), toon(0xfff2c0), [s * 0.5, 1.25, -2.0], carBody); }
  for (const [x, z] of [[-0.78, -1.3], [0.78, -1.3], [-0.78, 1.35], [0.78, 1.35]]) {
    const w = new THREE.Group(); w.position.set(x, 0.42, z); car.add(w); carWheels.push(w);
    cyl(0.42, 0.42, 0.18, blk, [0, 0, 0], w, 18).rotation.z = Math.PI / 2;
    cyl(0.16, 0.16, 0.2, chrome, [0, 0, 0], w, 10).rotation.z = Math.PI / 2;
    for (let k = 0; k < 4; k++) tbox(0.04, 0.6, 0.04, toon(0xd8c8a0), [0, 0, 0], w, 1).rotation.x = k * Math.PI / 4;
  }
}
// ---------- salon (grand hotel room) ----------
const salon = new THREE.Group(); salon.position.set(...S.SALON); scene.add(salon);
let modelPivot, briefcase, envelope, girders = [];
{
  const g = salon;
  ground(18, 14, PT.parquet(), 2.4, [S.SALON[0], S.SALON[2]], 0.02);
  ground(3.2, 9, PT.carpet(), 3.2, [S.SALON[0], S.SALON[2] - 2], 0.03);
  const wall = toon(0xffffff, texOf(PT.salonWall(), [18 / 2.4, 1]));
  add(new THREE.PlaneGeometry(18, 6), wall, [0, 3, -7], g, { cast: false });
  for (const s of [-1, 1]) { const w = add(new THREE.PlaneGeometry(14, 6), toon(0xffffff, texOf(PT.salonWall(), [14 / 2.4, 1])), [s * 9, 3, 0], g, { cast: false }); w.rotation.y = -s * Math.PI / 2; }
  // tall windows on the left wall (bright)
  for (const z of [-4, 0, 4]) { const w = add(new THREE.PlaneGeometry(1.6, 3.4), new THREE.MeshBasicMaterial({ color: 0xfff4d8 }), [-8.97, 2.6, z], g, { cast: false }); w.rotation.y = Math.PI / 2; ND(w, 'world'); }
  // mirrors/paintings on the back wall
  for (const x of [-4.5, 4.5]) { tbox(2.0, 1.5, 0.08, toon(0xc99a3a), [x, 3.0, -6.95], g, 1); tbox(1.7, 1.2, 0.1, toon(0x6a8a9a), [x, 3.0, -6.94], g, 1); }
  // long table along z
  const tc = toon(0xffffff, texOf(PT.cloth()));
  tbox(1.9, 0.1, 4.8, tc, [0, 0.78, -1.7], g, 1.5);
  tbox(1.95, 0.45, 4.85, tc, [0, 0.54, -1.7], g, 1.5);
  for (const [sx, z] of [[1, -3.7], [-1, -3.2], [1, -2.5], [-1, -1.9], [1, -1.1], [-1, -0.6]]) { const s = sx; const ch = new THREE.Group(); ch.position.set(s * 1.5, 0, z - 0.42); g.add(ch); tbox(0.55, 0.08, 0.55, toon(0x9a2232), [0, 0.5, 0], ch, 1); tbox(0.08, 1.0, 0.55, toon(0x7a4a2a), [s * 0.28, 0.95, 0], ch, 1); }
  // candelabras + glasses
  for (const [x, z] of [[-0.4, -1.6], [0.4, -0.6], [0.5, -2.6]]) { cyl(0.035, 0.03, 0.14, toon(0xe8f0f4), [x, 0.9, z], g, 8); cyl(0.008, 0.008, 0.08, toon(0xe8f0f4), [x, 0.8, z], g, 6); }
  // chandelier
  const ch = new THREE.Group(); ch.position.set(0, 4.6, -1.8); g.add(ch);
  add(new THREE.TorusGeometry(0.8, 0.05, 6, 24), toon(0xd8b44a), [0, 0, 0], ch).rotation.x = Math.PI / 2;
  add(new THREE.SphereGeometry(0.25, 12, 8), toon(0xfff2d0, null, { emissive: 0x806a40 }), [0, -0.3, 0], ch);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; add(new THREE.OctahedronGeometry(0.08), toon(0xf6f8ff, null, { emissive: 0x404858 }), [Math.cos(a) * 0.8, -0.18, Math.sin(a) * 0.8], ch); }
  cyl(0.02, 0.02, 1.4, toon(0xd8b44a), [0, 0.7, 0], ch, 6);
  // model Eiffel tower on the table (falls over at "coming down")
  modelPivot = new THREE.Group(); modelPivot.position.set(-0.45, 0.83, -3.75); g.add(modelPivot);
  const mt = towerGroup(1 / 400); modelPivot.add(mt); mt.position.set(0, 0, 0);
  mt.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  // briefcase + envelope
  briefcase = new THREE.Group(); g.add(briefcase);
  tbox(0.46, 0.12, 0.32, toon(0x6a3a1e), [0, 0.06, 0], briefcase, 0.5);
  add(new THREE.TorusGeometry(0.06, 0.012, 6, 12, Math.PI), toon(0x3a2a1a), [0, 0.12, 0], briefcase);
  tbox(0.06, 0.03, 0.02, toon(0xd8b44a), [0, 0.1, -0.165], briefcase, 0.2);
  envelope = tbox(0.24, 0.012, 0.16, toon(0xf6f0e0), [0, 0, 0], g, 0.3);
  // steel girders for "seven thousand tons of iron"
  for (let i = 0; i < 7; i++) { const b = tbox(1.4, 0.12, 0.16, toon(0x6a5a50), [0, -10, 0], g, 1); girders.push(b); }
}
// ---------- office ----------
const office = new THREE.Group(); office.position.set(...S.OFFICE); scene.add(office);
let stampedPile = [], letterIM;
{
  const g = office;
  ground(7, 7, PT.parquet(), 2.4, [S.OFFICE[0], S.OFFICE[2]], 0.02);
  add(new THREE.PlaneGeometry(7, 4), toon(0xffffff, texOf(PT.plainWall('#cdbb94'), [3, 1.5])), [0, 2, -3], g, { cast: false });
  for (const s of [-1, 1]) { const w = add(new THREE.PlaneGeometry(7, 4), toon(0xffffff, texOf(PT.plainWall('#c4b08a'), [3, 1.5])), [s * 3.5, 2, 0], g, { cast: false }); w.rotation.y = -s * Math.PI / 2; }
  const win = add(new THREE.PlaneGeometry(1.3, 1.6), new THREE.MeshBasicMaterial({ color: 0xfff0cc }), [1.5, 2.2, -2.98], g, { cast: false }); ND(win, 'world');
  tbox(1.45, 0.08, 0.1, toon(0x6a4a2a), [1.5, 1.38, -2.95], g, 1);
  // shelves with ledgers
  tbox(1.6, 1.8, 0.35, toon(0x7a5434), [-1.7, 0.9, -2.8], g, 1);
  for (let i = 0; i < 9; i++) tbox(0.12, 0.35, 0.25, toon([0x8a2a2a, 0x2a4a6a, 0x4a6a3a][i % 3]), [-2.3 + i * 0.14, 1.45, -2.75], g, 1);
  // desk
  const wood = toon(0xffffff, texOf(PT.planks('#7a4a28', 4)));
  tbox(2.1, 0.08, 0.95, wood, [0, 0.72, -1.15], g, 1.2);
  tbox(2.0, 0.66, 0.9, wood, [0, 0.35, -1.15], g, 1.2);
  // green banker's lamp, ink pad, stack of blank letters
  cyl(0.03, 0.03, 0.35, toon(0xc8a040), [-0.75, 0.92, -1.5], g, 6);
  const sh = add(new THREE.CylinderGeometry(0.06, 0.16, 0.12, 12, 1, true), toon(0x2a7a4a), [-0.75, 1.09, -1.45], g); sh.rotation.x = 0.4; sh.material.side = THREE.DoubleSide;
  tbox(0.2, 0.03, 0.14, toon(0x5a1a24), [0.25, 0.78, -1.1], g, 0.3);
  const lt = texOf(PT.letter()); lt.wrapS = lt.wrapT = THREE.ClampToEdgeWrapping;
  const letterMat = toon(0xffffff, lt);
  for (let i = 0; i < 6; i++) tbox(0.21, 0.01, 0.27, toon(0xf8f2e2), [-0.25, 0.77 + i * 0.012, -1.25], g, 0.3);
  for (let i = 0; i < 5; i++) { const p = add(new THREE.PlaneGeometry(0.21, 0.27), letterMat, [0.62, 0.77 + i * 0.012, -1.2], g, { cast: false }); p.rotation.x = -Math.PI / 2; p.rotation.z = (R(i) - 0.5) * 0.4; stampedPile.push(p); }
  letterIM = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.21, 0.27), new THREE.MeshToonMaterial({ map: lt, gradientMap: grad, side: THREE.DoubleSide }), 30);
  ND(letterIM, 'world'); letterIM.castShadow = false; g.add(letterIM);
}
// falling bolt
const bolt = new THREE.Group(); scene.add(bolt); bolt.scale.setScalar(1.4);
cyl(0.14, 0.14, 0.11, toon(0x9aa0a6), [0, 0.06, 0], bolt, 6);
cyl(0.055, 0.055, 0.5, toon(0x8a9096), [0, 0.11, 0], bolt, 10).rotation.z = Math.PI / 2;
bolt.children[1].position.set(0.25, 0.08, 0);

// ---------- cards ----------
const SCALE = 0.00225; // metres per design unit (600 x 1000 design canvas, soles at y = 975)
const CARD_RES = 1.6;
const cardGeo = new THREE.PlaneGeometry(600 * SCALE, 1000 * SCALE); cardGeo.translate(0, (1000 / 2 - 975) * SCALE + 1000 * SCALE * 0, 0); // centre then lift
cardGeo.translate(0, 0, 0);
const cards = new Map();
const OUTFIT = C.OUTFITS;
const blobGeo = new THREE.CircleGeometry(0.42, 20); blobGeo.rotateX(-Math.PI / 2);
const blobMat = new THREE.MeshBasicMaterial({ color: 0x2a1e18, transparent: true, opacity: 0.32, depthWrite: false, fog: true });
const mkBlob = () => { const b = new THREE.Mesh(blobGeo, blobMat); b.renderOrder = 1; ND(b, 'hide'); scene.add(b); return b; };
const cardMat = (tex) => {
  const m = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, fog: true });
  return m;
};
const depthMat = (tex) => new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
const geoFor = (w, h, base) => { const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2 - base, 0); return g; };
const personGeo = geoFor(600 * SCALE, 1000 * SCALE, 25 * SCALE);
const getCard = (id, kind, cw = 600, ch = 1000, sizeM = null) => {
  let c = cards.get(id);
  if (!c) {
    const cv = document.createElement('canvas'); cv.width = Math.round(cw * CARD_RES); cv.height = Math.round(ch * CARD_RES);
    const g = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const geo = sizeM ? geoFor(sizeM, sizeM * ch / cw, sizeM * ch / cw / 2) : personGeo;
    const mesh = new THREE.Mesh(geo, cardMat(tex)); mesh.customDepthMaterial = depthMat(tex);
    mesh.castShadow = kind !== 'fx'; ND(mesh, 'mask'); scene.add(mesh);
    c = { id, cv, g, tex, mesh, pen: C.newPen(g), key: '', blob: kind === 'fx' ? null : mkBlob() };
    cards.set(id, c);
  }
  return c;
};
const herdPool = [];
const q = (v, k = 100) => Math.round(v * k) / k;
const keyOf = (o) => JSON.stringify(o, (k, v) => (typeof v === 'number' ? q(v) : v));

const fxDraw = { puff: [300, 300, C.fxPuff], burst: [500, 500, (p, t, a) => C.fxBurst(p, t, a.col || '#fff3b0')], sold: [500, 320, C.drawSold], stars: [420, 240, (p, t) => C.fxStars(p, t)] };

// ---------- normal / depth pass ----------
const ndVert = `#include <common>
  varying vec3 vN; varying float vDepth; varying vec2 vUv;
  void main(){
    #include <beginnormal_vertex>
    #include <defaultnormal_vertex>
    #include <begin_vertex>
    #include <project_vertex>
    vN = normalize(transformedNormal); vDepth = -mvPosition.z; vUv = uv;
  }`;
const ndWorld = new THREE.ShaderMaterial({ vertexShader: ndVert, side: THREE.DoubleSide,
  fragmentShader: `varying vec3 vN; varying float vDepth; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vDepth); }` });
const maskCache = new Map(), worldACache = new Map();
const ndWorldA = (map) => { if (!worldACache.has(map.uuid)) worldACache.set(map.uuid, new THREE.ShaderMaterial({ vertexShader: ndVert, side: THREE.DoubleSide, uniforms: { map: { value: map }, mapM: { value: (map.updateMatrix(), map.matrix) } },
  fragmentShader: `uniform sampler2D map; uniform mat3 mapM; varying vec3 vN; varying float vDepth; varying vec2 vUv; void main(){ if(texture2D(map, (mapM * vec3(vUv, 1.)).xy).a < .5) discard; vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vDepth); }` })); return worldACache.get(map.uuid); };
const ndMask = (map) => {
  const k = map ? map.uuid : 'none';
  if (!maskCache.has(k)) maskCache.set(k, new THREE.ShaderMaterial({ vertexShader: ndVert, side: THREE.DoubleSide, uniforms: { map: { value: map } },
    fragmentShader: `uniform sampler2D map; varying float vDepth; varying vec2 vUv; void main(){ ${map ? 'if(texture2D(map, vUv).a < .5) discard;' : ''} gl_FragColor = vec4(0.,0.,0., vDepth); }` }));
  return maskCache.get(k);
};
const ndSky = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, vertexShader: `void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`, fragmentShader: `void main(){ gl_FragColor = vec4(0.,0.,0.,10000.); }` });
const rtOpts = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
const rtColor = new THREE.WebGLRenderTarget(W, H, { ...rtOpts, samples: 4 });
const rtND = new THREE.WebGLRenderTarget(W, H, { ...rtOpts, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtInk = new THREE.WebGLRenderTarget(W, H, rtOpts);
const swapped = [];
const renderND = () => {
  scene.traverse((m) => {
    if (!m.isMesh) return;
    const k = m.userData.nd || 'world';
    swapped.push([m, m.material, m.visible]);
    if (k === 'hide') m.visible = false;
    else if (k === 'sky') m.material = ndSky;
    else if (k === 'mask') m.material = ndMask(m.material.map);
    else if (m.material.alphaTest > 0 && m.material.map) m.material = ndWorldA(m.material.map);
    else m.material = ndWorld;
  });
  const fog = scene.fog; scene.fog = null;
  renderer.setRenderTarget(rtND); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  scene.fog = fog;
  for (const [m, mat, v] of swapped) { m.material = mat; m.visible = v; }
  swapped.length = 0;
};

// ---------- post ----------
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const quad = (frag, uniforms) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms, vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`, fragmentShader: frag, depthTest: false, depthWrite: false })); const s = new THREE.Scene(); s.add(m); return { s, u: uniforms }; };
const inkPass = quad(`
  uniform sampler2D tColor, tND; uniform vec2 uRes; uniform float uInkR, uSat, uGain, uVig, uFlash; uniform vec3 uLift, uInk;
  varying vec2 vUv;
  bool isWorld(vec4 n){ return dot(n.rgb, n.rgb) > 0.01; }
  void main(){
    vec3 col = texture2D(tColor, vUv).rgb;
    vec4 c = texture2D(tND, vUv);
    float ink = 0.;
    if (isWorld(c)) {
      vec3 nc = c.rgb * 2. - 1.;
      for (int i = 0; i < 4; i++) {
        float a = float(i) * 0.785398;
        vec2 o = vec2(cos(a), sin(a)) * uInkR / uRes;
        vec4 n1 = texture2D(tND, vUv + o), n2 = texture2D(tND, vUv - o);
        bool w1 = isWorld(n1), w2 = isWorld(n2), s1 = !w1 && n1.a > 5000., s2 = !w2 && n2.a > 5000.;
        if ((w1 || s1) && (w2 || s2)) {
          float L = (1./n1.a + 1./n2.a - 2./c.a) * c.a;
          float far = max(n1.a, n2.a);
          if (abs(L) > 0.05 && c.a < far * 0.985) ink = 1.;
        } else {
          // one neighbour is a card: only test the other side for a depth jump
          vec4 n = (w1 || s1) ? n1 : n2;
          if ((w1 || s1 || w2 || s2) && (n.a - c.a) / c.a > 0.08) ink = 1.;
        }
        if (w1 && dot(nc, n1.rgb * 2. - 1.) < 0.82) ink = max(ink, 0.9);
      }
      ink *= 1. - smoothstep(140., 520., c.a);
    }
    col = mix(col, uInk, ink);
    float l = dot(col, vec3(.2126, .7152, .0722));
    col = mix(vec3(l), col, uSat) * uGain + uLift;
    vec2 d = vUv - .5; d.x *= .75;
    col *= 1. - uVig * smoothstep(.25, .75, length(d));
    col = mix(col, vec3(1.), uFlash);
    gl_FragColor = vec4(max(col, 0.), 1.);
  }`, { tColor: { value: rtColor.texture }, tND: { value: rtND.texture }, uRes: { value: new THREE.Vector2(W, H) }, uInkR: { value: 2.6 }, uSat: { value: 1.08 }, uGain: { value: 1 },
  uVig: { value: 0.22 }, uFlash: { value: 0 }, uLift: { value: new THREE.Vector3(0.004, 0.005, 0.01) }, uInk: { value: new THREE.Vector3(0.0034, 0.003, 0.0037) } });
const dofPass = quad(`
  uniform sampler2D tImg, tND; uniform vec2 uRes; uniform float uC, uFocus;
  varying vec2 vUv;
  float coc(float d){ return uC * clamp(abs(d - uFocus) / d, 0., 1.); }
  vec3 enc(vec3 c){ c = clamp(c, 0., 1.); return mix(c * 12.92, 1.055 * pow(c, vec3(1./2.4)) - .055, step(.0031308, c)); }
  void main(){
    vec3 col = texture2D(tImg, vUv).rgb;
    if (uC > 0.5) {
      float c0 = coc(texture2D(tND, vUv).a);
      vec3 acc = col; float wsum = 1.;
      float R = max(c0, 0.);
      for (int i = 0; i < 48; i++) {
        float fi = float(i) + .5, r = sqrt(fi / 48.), a = fi * 2.39996;
        vec2 o = vec2(cos(a), sin(a)) * r * uC;
        vec2 uv = vUv + o / uRes;
        float cs = coc(texture2D(tND, uv).a), dist = r * uC;
        float w = smoothstep(dist - 1.5, dist, cs) * (cs >= c0 - 1. || dist <= c0 ? 1. : 0.);
        w *= step(dist, max(cs, c0) + 1.);
        acc += texture2D(tImg, uv).rgb * w; wsum += w;
      }
      col = acc / wsum;
    }
    gl_FragColor = vec4(enc(col), 1.);
  }`, { tImg: { value: rtInk.texture }, tND: { value: rtND.texture }, uRes: { value: new THREE.Vector2(W, H) }, uC: { value: 0 }, uFocus: { value: 10 } });

// ---------- per-frame ----------
const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const camRight = new THREE.Vector3();
let lastLight = '';
const applyLight = (f) => {
  const L = S.lightFor(f), shot = S.shotAt(f);
  const az = (L.az * Math.PI) / 180, el = (L.el * Math.PI) / 180, dir = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
  const fc = S.focusAt(f);
  sun.target.position.set(...fc); sun.position.copy(v3(fc).addScaledVector(dir, 80));
  sun.color.setRGB(...L.sun); sun.intensity = L.sunI;
  hemi.color.set(L.hemiSky); hemi.groundColor.set(L.hemiGnd); hemi.intensity = L.hemiI;
  skyU.top.value.set(L.sky); skyU.hor.value.set(L.hor); skyU.sunDir.value.copy(dir); skyU.sunCol.value.setRGB(...L.sun); skyU.sunAmt.value = L.sunDisc;
  scene.fog.color.set(L.hor); scene.fog.near = L.fog[0]; scene.fog.far = L.fog[1];
  const tint = new THREE.Color().setRGB(...L.card);
  for (const c of cards.values()) c.mesh.material.color.copy(tint);
  blobMat.opacity = shot.light === 'day' ? 0.32 : 0.26;
  inkPass.u.uSat.value = L.sat; inkPass.u.uGain.value = L.gain;
};

const placeCard = (mesh, pos, flip, scale = 1, roll = 0, breathe = 0) => {
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.set(0, Math.atan2(camera.position.x - pos[0], camera.position.z - pos[2]), roll);
  mesh.scale.set(flip ? -scale : scale, scale * (1 + breathe), scale);
};
let FR = 0;
const hashId = (id) => { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 997; return h; };

window.renderFrame = (f) => {
  FR = f;
  // camera
  const cm = S.camAt(f);
  camera.position.set(...cm.pos); camera.fov = cm.fov; camera.up.set(0, 1, 0); camera.lookAt(...cm.look);
  camera.rotateZ((cm.roll * Math.PI) / 180); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  camRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
  applyLight(f);
  for (const c of clouds) c.lookAt(camera.position);
  // world state
  const ws = S.worldAt(f);
  const K = ws.car; car.visible = !!K.on;
  if (K.on) { carDoor.rotation.y = K.door * 1.25; carHole.visible = K.door > 0.02; car.position.set(K.x, 0, K.z); car.rotation.y = K.yaw; carBody.position.y = K.bounce; carBody.rotation.x = K.pitch; for (const w of carWheels) w.rotation.x = -K.wheel; }
  bolt.visible = !!ws.bolt;
  if (ws.bolt) { bolt.position.set(0.6, ws.bolt.y, 0.15); bolt.rotation.set(0.3, ws.bolt.spin, ws.bolt.spin * 0.7); }
  stampedPile.forEach((p, i) => (p.visible = i < ws.stampCount));
  letterIM.visible = ws.letters > 0;
  if (ws.letters > 0) {
    const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < 30; i++) {
      const t = Math.max(0, Math.min(1, ws.letters * 1.6 - R(i) * 0.6));
      const x = 0.6 + (R(i * 3) - 0.5) * 3.2 * t, y = 0.85 + t * (1.4 + R(i * 5) * 1.2), z = -1.2 + t * (1.0 + R(i * 7) * 1.4);
      e.set(-1.2 + t * (2 + R(i) * 3), t * R(i * 9) * 4, t * (R(i * 2) - 0.5) * 3); qq.setFromEuler(e);
      m4.compose(new THREE.Vector3(x, y, z), qq, new THREE.Vector3(t > 0 ? 1 : 0.001, 1, 1)); letterIM.setMatrixAt(i, m4);
    }
    letterIM.instanceMatrix.needsUpdate = true;
  }
  modelPivot.rotation.set(0, 0, 0); modelPivot.rotation.z = ws.modelFall * Math.PI / 2 * 0.98; modelPivot.position.y = 0.83;
  girders.forEach((b, i) => {
    if (ws.girders < 0) { b.visible = false; return; }
    const a = 630 + i * 6, t = (ws.girders - a) / 10;
    b.visible = t > 0;
    const y = t < 1 ? 0.86 + 3.2 * (1 - t * t) : 0.86 + 0.13 * Math.floor(i / 2);
    b.position.set(0.1 + (R(i) - 0.5) * 0.6, y, -1.0 + (R(i * 3) - 0.5) * 1.2); b.rotation.set(0, R(i * 5) * 2.5 + (t < 1 ? t * 2 : 2), t < 1 ? (1 - t) * 1.5 : 0);
  });
  if (ws.case >= 0) { briefcase.visible = true; const t = S.easeOut(ws.case); briefcase.position.set(0.75 + (0.1 - 0.75) * t, 0.83, -3.45 + (-3.88 + 3.45) * t); briefcase.rotation.y = 0.3 * (1 - t) - 0.1; }
  else briefcase.visible = false;
  if (ws.env >= 0) { envelope.visible = true; const t = S.easeOut(ws.env); envelope.position.set(0.72 + (-0.2 - 0.72) * t, 0.84, -3.3 + (-3.85 + 3.3) * t); envelope.rotation.y = 0.5 * (1 - t); }
  else envelope.visible = false;
  salon.visible = ws.inSalon; office.visible = ws.shot === 'office';
  // actors
  const seen = new Set(); let hi = 0;
  for (const a of S.actorsAt(f)) {
    if (a.kind === 'herd') {
      const h = getHerd(hi++), t = herdTex[a.tex] || herdTex.stand;
      h.mesh.material = t.mat; h.mesh.customDepthMaterial = t.depth; h.mesh.visible = true;
      placeCard(h.mesh, a.pos, a.vel[0] * camRight.x + a.vel[2] * camRight.z < 0, 0.95);
      h.blob.visible = true; h.blob.position.set(a.pos[0], 0.03, a.pos[2]); h.blob.scale.set(1.1, 1, 0.7);
      continue;
    }
    seen.add(a.id);
    if (a.kind === 'fx') {
      const [cw, ch, fn] = fxDraw[a.fx];
      const c = getCard(a.id, 'fx', cw, ch, a.size);
      const key = keyOf([a.fx, a.t]);
      if (key !== c.key) { c.key = key; c.g.setTransform(CARD_RES, 0, 0, CARD_RES, 0, 0); c.g.clearRect(0, 0, cw, ch); fn(c.pen, Math.min(1, Math.max(0, a.t)), a); c.tex.needsUpdate = true; }
      c.mesh.visible = true; placeCard(c.mesh, a.pos, false, 1);
      continue;
    }
    const c = getCard(a.id, a.kind);
    const key = keyOf([a.who, a.opts]);
    if (key !== c.key) {
      c.key = key; c.g.setTransform(CARD_RES, 0, 0, CARD_RES, 0, 0); c.g.clearRect(0, 0, 600, 1000);
      C.drawPerson(c.pen, OUTFIT[a.who], a.opts);
      c.tex.needsUpdate = true;
    }
    const flip = a.flip !== undefined ? a.flip : a.vel ? a.vel[0] * camRight.x + a.vel[2] * camRight.z < 0 : false;
    const hs = hashId(a.id), sit = a.opts.mode === 'sit';
    const sway = (sit ? 0.012 : 0.022) * Math.sin(FR * 0.09 + hs) + 0.008 * Math.sin(FR * 0.23 + hs * 2);
    c.mesh.visible = true; placeCard(c.mesh, a.pos, flip, a.scale || 1, (a.roll || 0) + sway, 0.012 * Math.sin(FR * 0.15 + hs));
    if (c.blob) { c.blob.visible = a.pos[1] > -0.3; c.blob.position.set(a.pos[0], Math.max(0, a.pos[1]) + 0.03, a.pos[2]); c.blob.scale.setScalar((a.scale || 1) * 0.9); }
  }
  for (const c of cards.values()) if (!seen.has(c.id)) { c.mesh.visible = false; if (c.blob) c.blob.visible = false; }
  for (let i = hi; i < herdPool.length; i++) { herdPool[i].mesh.visible = false; herdPool[i].blob.visible = false; }
  // passes
  renderer.shadowMap.needsUpdate = true;
  renderer.setRenderTarget(rtColor); renderer.render(scene, camera);
  renderND();
  inkPass.u.uFlash.value = S.flashAt(f);
  renderer.setRenderTarget(rtInk); renderer.render(inkPass.s, quadCam);
  const [cInf, focus] = S.dofAt(f);
  dofPass.u.uC.value = cInf; dofPass.u.uFocus.value = focus;
  renderer.setRenderTarget(null); renderer.render(dofPass.s, quadCam);
  return true;
};
window.ready = true;
