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

// ---------- world: Grangeville street (origin), post office inside (PO), railway (z = RZ), grandma's house (GH) ----------
const ground = (w, d, cv, T, pos, y, parent = scene) => {
  const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
  return add(g, toon(0xffffff, texOf(cv, [w / T, d / T])), [pos[0], y, pos[1]], parent, { cast: false });
};
ground(3000, 3000, PT.grass(), 6, [0, 0], -0.02);
ground(60, 5, PT.dirt(), 4, [0, 1.5], 0.004); // main street
ground(40, 3, PT.dirt(), 4, [120, 3.5], 0.004); // lane to grandma's
const wbm = (c) => toon(0xffffff, texOf(PT.weatherboard(c)));
const roofM = toon(0x6a4a3a), trimM = toon(0xf4f0e4), dark = toon(0x2a2228), glass = toon(0x9ac0d0);
const gable = (parent, w, d, y, mat) => { const g = new THREE.CylinderGeometry(0.01, 1, 1, 4, 1); g.rotateY(Math.PI / 4); const m = add(g, mat, [0, y, 0], parent); m.scale.set(w * 0.75, 1.6, d * 0.75); return m; };
const house = (x, z, w, d, h, col, rot = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
  tbox(w, h, d, wbm(col), [0, h / 2, 0], g, 2); gable(g, w, d, h + 0.8, roofM);
  for (const sx of [-w / 3, w / 3]) { tbox(0.8, 0.9, 0.06, glass, [sx, h * 0.6, d / 2 + 0.02], g, 1); tbox(0.92, 0.1, 0.08, trimM, [sx, h * 0.6 - 0.5, d / 2 + 0.03], g, 1); }
  return g; };
// family farmhouse + post office on the street
const farm = house(-3.2, -4.2, 6, 4, 2.8, '#e8dcc0');
tbox(1.0, 2.0, 0.06, toon(0x7a4a2a), [0, 1.0, 2.03], farm, 1);
const po = house(6.5, -4.2, 6, 4, 3.2, '#c8d8e0');
tbox(4.6, 0.6, 0.08, toon(0x1e3a5a), [0, 3.65, 2.06], po, 2);
add(new THREE.PlaneGeometry(4.4, 0.5), toon(0xffffff, texOf(PT.sign('POST OFFICE', '#1e3a5a', '#ffffff', 1024, 120))), [0, 3.65, 2.11], po, { cast: false });
tbox(1.1, 2.1, 0.06, toon(0x3a5a3a), [0, 1.05, 2.03], po, 1);
// fences, pines, hills
const pineMats = [toon(0x2f6a44), toon(0x3a7a4e), toon(0x2a5e3e)], trunk = toon(0x6a4a30);
const pine = (x, z, s = 1, i = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
  cyl(0.25, 0.35, 3, trunk, [0, 1.5, 0], g, 7); for (let k = 0; k < 4; k++) add(new THREE.ConeGeometry(2.4 - k * 0.5, 2.8, 9), pineMats[(i + k) % 3], [0, 3 + k * 1.7, 0], g); };
for (let i = 0; i < 30; i++) pine(-60 + i * 4.2 + (R(i) - 0.5) * 3, -12 - R(i * 3) * 8, 1.0 + R(i * 5) * 0.8, i);
for (let i = 0; i < 30; i++) pine(-60 + i * 4.2 + (R(i + 50) - 0.5) * 3, -70 - R(i * 3 + 1) * 10, 1.0 + R(i * 5 + 2) * 0.8, i);
for (let i = 0; i < 20; i++) pine(90 + i * 3.2 + (R(i + 9) - 0.5) * 3, -9 - R(i * 4) * 8, 1.0 + R(i * 7) * 0.6, i);
for (let i = 0; i < 10; i++) { const a = Math.PI * 0.05 + (i / 9) * Math.PI * 0.9, r = 380 + R(i * 3) * 80, s = 70 + R(i * 7) * 50;
  const h = add(new THREE.SphereGeometry(1, 20, 10), toon([0x6a8a5a, 0x7a9462, 0x5a7a4e][i % 3]), [Math.cos(a) * r, -s * 0.1, -Math.sin(a) * r * 0.6 - 60], scene, { cast: false }); h.scale.set(s, s * 0.35, s * 0.7); }
// ---- railway along x at z = RZ ----
const RZ = S.RZ;
{ ground(800, 3.4, PT.gravel(), 2, [0, RZ], 0.01);
  const rail = toon(0x6a6a72), sl = toon(0x6a4a30);
  for (const dz of [-0.72, 0.72]) tbox(800, 0.12, 0.08, rail, [0, 0.2, RZ + dz], scene, 2);
  const n = 400, im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.12, 2.2), sl, n), m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { m4.makeTranslation(-400 + i * 2, 0.08, RZ); im.setMatrixAt(i, m4); } im.receiveShadow = true; ND(im, 'world'); scene.add(im);
  // telegraph poles + Lewiston station sign
  for (let i = 0; i < 30; i++) { cyl(0.1, 0.12, 5, sl, [-120 + i * 18, 2.5, RZ - 4.5], scene, 6); tbox(1.4, 0.1, 0.1, sl, [-120 + i * 18, 4.6, RZ - 4.5], scene, 1); }
  const sg = new THREE.Group(); sg.position.set(S.LEWX, 0, RZ + 3.2); scene.add(sg);
  tbox(0.12, 2.4, 0.12, sl, [-1.3, 1.2, 0], sg, 1); tbox(0.12, 2.4, 0.12, sl, [1.3, 1.2, 0], sg, 1);
  tbox(3.0, 0.7, 0.08, toon(0xf4ead0), [0, 2.3, 0], sg, 1);
  add(new THREE.PlaneGeometry(2.9, 0.6), toon(0xffffff, texOf(PT.sign('LEWISTON', '#f4ead0', '#2a1e18', 1024, 200))), [0, 2.3, 0.05], sg, { cast: false }); }
// the train: locomotive + mail car, moving along +x (group origin = mail car centre)
const train = new THREE.Group(); scene.add(train);
const wheels = [];
{ const red = toon(0x8a2a22), blk = toon(0x2a2a30), wood = toon(0xffffff, texOf(PT.planks('#3a5a7a', 6, true))), brass = toon(0xd8b84a);
  const wheel = (x, z, r = 0.45) => { const w = cyl(r, r, 0.14, blk, [x, r, z], train, 16); w.rotation.x = Math.PI / 2; wheels.push(w); };
  // mail car: 8 m long, 2.6 wide, floor at 1.0, walls 2.4 tall, door opening on +z side between x -0.9..0.9
  tbox(8, 0.2, 2.6, blk, [0, 0.95, 0], train, 2);
  tbox(8, 2.4, 0.1, wood, [0, 2.2, -1.25], train, 2);
  tbox(3.1, 2.4, 0.1, wood, [-2.45, 2.2, 1.25], train, 2); tbox(3.1, 2.4, 0.1, wood, [2.45, 2.2, 1.25], train, 2);
  tbox(1.8, 0.35, 0.1, wood, [0, 3.22, 1.25], train, 1);
  tbox(0.1, 2.4, 2.6, wood, [-4, 2.2, 0], train, 2); tbox(0.1, 2.4, 2.6, wood, [4, 2.2, 0], train, 2);
  tbox(8.3, 0.16, 2.9, toon(0x4a4a52), [0, 3.45, 0], train, 2);
  add(new THREE.PlaneGeometry(2.4, 0.5), toon(0xffffff, texOf(PT.sign('MAIL', '#3a5a7a', '#f4e2a0', 512, 110))), [-2.45, 2.75, 1.31], train, { cast: false });
  for (const [x, z] of [[-1.2, -0.6], [-0.9, -0.1], [1.4, -0.5], [1.1, 0.2], [-2.4, 0.3]]) { const s = add(new THREE.SphereGeometry(0.35, 12, 8), toon(0xd8c8a0), [x, 1.35, z], train); s.scale.set(1, 1.1, 0.8); }
  for (const x of [-3, -2, 2, 3]) { wheel(x, 1.25); wheel(x, -1.25); }
  // locomotive in front (+x)
  const L = new THREE.Group(); L.position.set(8.4, 0, 0); train.add(L);
  const boiler = cyl(1.0, 1.0, 5.0, blk, [0.6, 1.9, 0], L, 18); boiler.rotation.z = Math.PI / 2;
  tbox(2.2, 2.6, 2.5, red, [-2.4, 2.3, 0], L, 2); tbox(2.5, 0.15, 2.8, blk, [-2.4, 3.65, 0], L, 2);
  tbox(0.9, 0.7, 0.06, glass, [-2.4, 2.8, 1.26], L, 1);
  cyl(0.28, 0.4, 1.2, blk, [2.3, 3.3, 0], L, 12); cyl(0.3, 0.3, 0.5, brass, [0.8, 3.0, 0], L, 12);
  tbox(5.8, 0.3, 2.4, blk, [0, 0.9, 0], L, 2);
  add(new THREE.ConeGeometry(0.9, 1.0, 4), red, [3.4, 0.7, 0], L).rotation.z = -Math.PI / 2;
  for (const x of [-1.6, -0.2, 1.2]) { const w1 = cyl(0.6, 0.6, 0.14, red, [x, 0.6, 1.2], L, 18); w1.rotation.x = Math.PI / 2; wheels.push(w1); const w2 = cyl(0.6, 0.6, 0.14, red, [x, 0.6, -1.2], L, 18); w2.rotation.x = Math.PI / 2; wheels.push(w2); }
}
// ---- post office interior at PO ----
const PO = S.PO;
{ const fl = toon(0xffffff, texOf(PT.planks('#a8784a', 6))), wall = toon(0xffffff, texOf(PT.plainWall('#d8c8a0')));
  tbox(12, 0.1, 12, fl, [PO[0], -0.04, PO[2]], scene, 2);
  tbox(12, 4, 0.2, wall, [PO[0], 2, PO[2] - 2.6], scene, 2);
  tbox(0.2, 4, 12, wall, [PO[0] - 4.2, 2, PO[2] + 3], scene, 2); tbox(0.2, 4, 12, wall, [PO[0] + 4.2, 2, PO[2] + 3], scene, 2);
  tbox(12, 0.2, 12, toon(0xe8dcc0), [PO[0], 4, PO[2] + 3], scene, 2);
  // counter on the right, mail slots on the wall behind it, poster on the left
  tbox(2.6, 1.1, 0.7, toon(0xffffff, texOf(PT.planks('#7a4a2a', 4, true))), [PO[0] + 1.5, 0.55, PO[2] - 1.0], scene, 1);
  tbox(2.8, 0.08, 0.85, toon(0x5a3420), [PO[0] + 1.5, 1.12, PO[2] - 1.0], scene, 1);
  tbox(2.4, 1.2, 0.1, toon(0xffffff, texOf(PT.lattice('#6a4a2a'))), [PO[0] + 1.5, 2.6, PO[2] - 2.48], scene, 0.4);
  add(new THREE.PlaneGeometry(1.5, 0.55), toon(0xffffff, texOf(PT.sign('PARCEL POST', '#c8302a', '#fff4d8', 1024, 300))), [PO[0] + 1.5, 3.55, PO[2] - 2.48], scene, { cast: false });
  tbox(1.0, 0.9, 0.06, glass, [PO[0] - 3.0, 2.3, PO[2] - 2.48], scene, 1);
  // platform scale on the left: base + column (dial is a card on top)
  tbox(1.1, 0.16, 0.9, toon(0x4a4a52), [PO[0] - 1.1, 0.08, PO[2] - 0.6], scene, 1);
  tbox(0.14, 1.5, 0.14, toon(0x4a4a52), [PO[0] - 1.1, 0.9, PO[2] - 1.0], scene, 1);
}
// ---- grandma's house at GH (Lewiston) ----
const GH = S.GH;
const ghouse = house(GH[0], GH[2] - 2.2, 6.4, 4.4, 2.9, '#f0d8d0');
const doorPivot = new THREE.Group(); doorPivot.position.set(GH[0] - 0.55, 0, GH[2] + 0.04); scene.add(doorPivot);
tbox(1.1, 2.1, 0.08, toon(0x2f6a5a), [0.55, 1.05, 0], doorPivot, 1);
add(new THREE.SphereGeometry(0.05, 8, 6), toon(0xd8b84a), [0.95, 1.05, 0.07], doorPivot);
tbox(1.1, 2.1, 0.02, toon(0x3a2a20), [GH[0], 1.05, GH[2] + 0.01], scene, 1); // dark doorway behind the door
tbox(3.6, 0.15, 1.6, toon(0xffffff, texOf(PT.planks('#a8784a', 4))), [GH[0], 0.07, GH[2] + 0.8], scene, 1);
for (const x of [-1.7, 1.7]) cyl(0.07, 0.07, 2.6, trimM, [GH[0] + x, 1.3, GH[2] + 1.5]);
tbox(3.8, 0.12, 1.8, roofM, [GH[0], 2.65, GH[2] + 0.8], scene, 1);
for (const [x, c] of [[-2.6, 0xe84a6a], [-2.2, 0xf2c230], [2.3, 0xe84a6a], [2.7, 0x8a4ab0]]) add(new THREE.SphereGeometry(0.2, 10, 8), toon(c), [GH[0] + x, 0.25, GH[2] + 0.4]);
const clouds = [];
for (let i = 0; i < 12; i++) {
  const t = texOf(PT.cloud(i + 1)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(200, 100), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.4, fog: false, depthWrite: false }));
  const a = (i / 12) * Math.PI * 2 + R(i) * 0.3; m.position.set(Math.cos(a) * 900, 160 + R(i * 3) * 200, Math.sin(a) * 900); m.scale.setScalar(1.0 + R(i * 5)); m.renderOrder = -5; ND(m, 'hide'); scene.add(m); clouds.push(m);
}
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
    c = { id, cv, g, tex, mesh, pen: C.newPen(g), key: '', blob: kind === 'fx' ? null : mkBlob(), size0: sizeM };
    cards.set(id, c);
  }
  return c;
};
const herdPool = [];
const q = (v, k = 100) => Math.round(v * k) / k;
const keyOf = (o) => JSON.stringify(o, (k, v) => (typeof v === 'number' ? q(v) : v));

const fxDraw = { dial: [400, 400, (p, t, a) => C.drawDial(p, t, a)], stamp: [200, 200, (p, t, a) => C.drawStamp(p, t, a)], price: [400, 240, (p, t, a) => C.drawPrice(p, t, a)], ticket: [300, 300, (p, t, a) => C.drawTicket(p, t, a)], book: [300, 260, (p, t, a) => C.drawBook(p, t, a)], steam: [300, 300, (p, t) => C.drawSteam(p, t)], speed: [400, 300, (p, t) => C.drawSpeed(p, t)], stars: [420, 240, (p, t) => C.fxStars(p, t)], heart: [200, 200, (p) => C.drawHeart(p)], puff: [300, 300, (p, t) => C.fxPuff(p, t)] };

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
  blobMat.opacity = 0.3;
  inkPass.u.uSat.value = L.sat; inkPass.u.uGain.value = L.gain;
};
const placeCard = (mesh, pos, flip, scale = 1, roll = 0, breathe = 0) => {
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.set(0, Math.atan2(camera.position.x - pos[0], camera.position.z - pos[2]), roll);
  mesh.scale.set(flip ? -scale : scale, scale * (1 + breathe), scale);
};
let FR = 0;
const hashId = (id) => { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 997; return h; };
const clockCache = {}; let clockKey = '';

window.renderFrame = (f) => {
  FR = f;
  const cm = S.camAt(f);
  camera.position.set(...cm.pos); camera.fov = cm.fov; camera.up.set(0, 1, 0); camera.lookAt(...cm.look);
  camera.rotateZ((cm.roll * Math.PI) / 180); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  camRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
  applyLight(f);
  for (const c of clouds) c.lookAt(camera.position);
  const ws = S.worldAt(f);
  train.position.set(ws.trainX, 0, S.RZ);
  for (const w of wheels) w.rotation.y = -ws.trainX / 0.5;
  doorPivot.rotation.y = 1.6 * ws.door; doorPivot.visible = ws.door < 0.45;
  // actors
  const seen = new Set();
  for (const a of S.actorsAt(f)) {
    seen.add(a.id);
    if (a.kind === 'fx') {
      const [cw, ch, fn] = fxDraw[a.fx];
      const cc = getCard(a.id, 'fx', cw, ch, a.size);
      const key = keyOf([a.fx, a.t, a.k ?? 0, a.seed ?? 0, a.rot ?? 0, a.icon ?? '', a.ph ?? 0, a.expr ?? '', a.o ?? 0]);
      if (key !== cc.key) { cc.key = key; cc.g.setTransform(CARD_RES, 0, 0, CARD_RES, 0, 0); cc.g.clearRect(0, 0, cw, ch); fn(cc.pen, Math.min(1, Math.max(0, a.t)), a); cc.tex.needsUpdate = true; }
      cc.mesh.visible = a.size > 0.005; placeCard(cc.mesh, a.pos, !!a.flip, cc.size0 ? a.size / cc.size0 : 1, a.rotZ || 0);
      continue;
    }
    const cc = getCard(a.id, a.kind);
    const key = keyOf([a.who || 'pig', a.opts]);
    if (key !== cc.key) { cc.key = key; cc.g.setTransform(CARD_RES, 0, 0, CARD_RES, 0, 0); cc.g.clearRect(0, 0, 600, 1000); if (a.kind === 'pig') C.drawPig(cc.pen, a.opts); else C.drawPerson(cc.pen, OUTFIT[a.who], a.opts); cc.tex.needsUpdate = true; }
    const flip = a.flip !== undefined ? a.flip : false;
    const hs = hashId(a.id);
    const sway = 0.022 * Math.sin(FR * 0.09 + hs) + 0.008 * Math.sin(FR * 0.23 + hs * 2);
    cc.mesh.visible = true; placeCard(cc.mesh, a.pos, flip, a.scale || 1, (a.roll || 0) + sway, 0.012 * Math.sin(FR * 0.15 + hs));
    if (cc.blob) { cc.blob.visible = !a.noBlob; cc.blob.position.set(a.pos[0], a.pos[1] + 0.03, a.pos[2]); cc.blob.scale.setScalar((a.scale || 1) * (a.kind === 'pig' ? 1.3 : 0.9)); }
  }
  for (const cc of cards.values()) if (!seen.has(cc.id)) { cc.mesh.visible = false; if (cc.blob) cc.blob.visible = false; }
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
