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

// ---------- world: Lisbon / London 1925 ----------
const ground = (w, d, cv, T, pos, y, parent = scene) => {
  const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
  return add(g, toon(0xffffff, texOf(cv, [w / T, d / T])), [pos[0], y, pos[1]], parent, { cast: false });
};
const fbox = (w, h, d, mat, pos, parent = scene) => {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const sz = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * sz[f][0] / 6, uv.getY(k) * sz[f][1] / 3.5); }
  return add(g, mat, pos, parent);
};
const plane = (w, h, mat, pos, rotY = 0, parent = scene, nd = 'world') => { const m = add(new THREE.PlaneGeometry(w, h), mat, pos, parent, { cast: false, nd }); m.rotation.y = rotY; return m; };
const clampTex = (cv) => { const t = texOf(cv); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; };
ground(3000, 3000, PT.grass(), 10, [0, 0], -0.02);
// --- Lisbon street ---
ground(14, 120, PT.cobble(), 4, [0, -20], 0.01);
const lisCols = ['#f2c8a8', '#f4dc9a', '#b8d4e0', '#e8b4b8', '#f0e0c0', '#c8e0b8'];
const lisMats = lisCols.map((c) => toon(0xffffff, texOf(PT.facade(c))));
const roofMat = toon(0xffffff, texOf(PT.terracotta()));
const tileMat = toon(0xffffff, texOf(PT.tiles('#2a5a9a')));
const lisBuilding = (x, z, w, side, i, h = 13) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  fbox(10, h, w, lisMats[i % lisMats.length], [0, h / 2, 0], g);
  tbox(10.01, 2.2, w + 0.01, tileMat, [0, 1.1, 0], g, 1.2);
  const r = tbox(11, 0.3, w + 0.6, roofMat, [0, h + 0.8, 0], g, 2); r.rotation.z = side * 0.25;
  tbox(10.6, 0.35, w + 0.3, toon(0xf4ece0), [0, h + 0.2, 0], g, 2);
};
let li = 0;
for (const side of [-1, 1]) for (let z = 14; z > -70; z -= 12.2) lisBuilding(side * -12, z, 12, side, li++, 11 + (li % 3) * 2);
// tram rails
for (const x of [-0.8, 0.8]) tbox(0.08, 0.03, 140, toon(0x8a8e92), [x, 0.02, -20], scene, 2);
// mansion at the end of the street
let bancoSign;
{
  const g = new THREE.Group(); g.position.set(...S.MANSION); scene.add(g);
  fbox(16, 11, 8, toon(0xffffff, texOf(PT.facade('#f0b8b8'))), [0, 5.5, 0], g);
  tbox(17, 0.5, 9, toon(0xf6ece0), [0, 11.2, 0], g, 2);
  const roof = add(new THREE.ConeGeometry(5, 3, 4), roofMat, [0, 13, 0], g); roof.rotation.y = Math.PI / 4; roof.scale.set(1.8, 1, 0.9);
  for (const x of [-3, -1, 1, 3]) cyl(0.35, 0.4, 5.2, toon(0xf6f0e6), [x, 2.6, 4.4], g, 12);
  tbox(9, 0.6, 1.6, toon(0xf6f0e6), [0, 5.4, 4.3], g, 2);
  tbox(2.2, 3.4, 0.1, toon(0x4a2a1e), [0, 1.7, 4.02], g, 1);
  for (const x of [-7, 7]) { const p = new THREE.Group(); p.position.set(x, 0, 6); g.add(p); cyl(0.2, 0.3, 6, toon(0x8a6a48), [0, 3, 0], p, 8); for (let k = 0; k < 7; k++) { const l = tbox(2.4, 0.08, 0.7, toon(0x4f8a3e), [Math.cos(k) * 0.9, 6.1, Math.sin(k) * 0.9], p, 1); l.rotation.set(0.3, k * 0.9, -0.5); } }
  bancoSign = new THREE.Group(); bancoSign.position.set(0, 7.3, 4.3); g.add(bancoSign);
  const bt = clampTex(PT.sign('BANCO REIS', '#1e3a7a', '#ffe9a8', 768, 160));
  add(new THREE.PlaneGeometry(6, 1.25), toon(0xffffff, bt, { emissive: 0x111111 }), [0, -0.65, 0.12], bancoSign, { cast: false });
  tbox(6.2, 1.4, 0.1, toon(0xd8b44a), [0, -0.65, 0.04], bancoSign, 1);
}
// --- falling banknotes (instanced) ---
const noteTex = clampTex(PT.note());
const noteMat = new THREE.MeshToonMaterial({ map: noteTex, gradientMap: grad, side: THREE.DoubleSide });
const rainIM = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.34, 0.17), noteMat, 90); rainIM.castShadow = false; ND(rainIM, 'mask'); scene.add(rainIM);
// --- prison cell ---
const cell = new THREE.Group(); cell.position.set(...S.CELL); scene.add(cell);
let chalkTex, chalkVal = -1;
{
  const g = cell, st = toon(0xffffff, texOf(PT.stone('#7a756a'), [3, 2]));
  ground(6, 6, PT.stone('#6a655c'), 1.5, [S.CELL[0], S.CELL[2]], 0.01, scene);
  plane(5, 3.6, st, [0, 1.8, -2], 0, g);
  for (const s of [-1, 1]) plane(5, 3.6, st, [s * 2.5, 1.8, 0.5], -s * Math.PI / 2, g);
  g.children.forEach(() => {});
  const win = plane(0.8, 0.6, new THREE.MeshBasicMaterial({ color: 0xe8f0ff }), [0.95, 2.45, -1.98], 0, g);
  for (let k = 0; k < 4; k++) cyl(0.025, 0.025, 0.62, toon(0x2a2a2e), [0.68 + k * 0.18, 2.45, -1.96], g, 6);
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 3.2), new THREE.MeshBasicMaterial({ color: 0xdfe8ff, transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.set(0.7, 1.4, -1.1); beam.rotation.set(-0.7, 0.3, 0.2); ND(beam, 'hide'); g.add(beam);
  chalkTex = clampTex(PT.chalkWall(0));
  plane(1.25, 1.25, toon(0xffffff, chalkTex), [-0.8, 1.75, -1.985], 0, g);
  tbox(0.9, 0.45, 2.0, toon(0x6a5a48), [1.85, 0.22, -0.9], g, 1); tbox(0.85, 0.12, 1.9, toon(0xd8d0b8), [1.85, 0.5, -0.9], g, 1);
  for (let k = -10; k <= 10; k++) cyl(0.025, 0.025, 3.4, toon(0x2a2a2e), [k * 0.25, 1.7, 1.6], g, 6);
  tbox(5.2, 0.08, 0.08, toon(0x2a2a2e), [0, 3.2, 1.6], g, 1); tbox(5.2, 0.08, 0.08, toon(0x2a2a2e), [0, 0.15, 1.6], g, 1);
}
// --- forger's desk ---
const desk = new THREE.Group(); desk.position.set(...S.DESK); scene.add(desk);
let stampedPile = [], envelope, contractPlane;
{
  const g = desk;
  ground(7, 7, PT.parquet(), 2.4, [S.DESK[0], S.DESK[2]], 0.01, scene);
  plane(7, 4, toon(0xffffff, texOf(PT.plainWall('#8a6a4a'), [3, 1.5])), [0, 2, -3], 0, g);
  for (const s of [-1, 1]) plane(7, 4, toon(0xffffff, texOf(PT.plainWall('#7a5e42'), [3, 1.5])), [s * 3.5, 2, 0], -s * Math.PI / 2, g);
  const wood = toon(0xffffff, texOf(PT.planks('#5a3a20', 4)));
  tbox(2.1, 0.08, 0.95, wood, [0, 0.72, -1.15], g, 1.2); tbox(2.0, 0.66, 0.9, wood, [0, 0.35, -1.15], g, 1.2);
  cyl(0.05, 0.06, 0.18, toon(0xf4ecd8), [-0.7, 0.85, -1.4], g, 10);
  add(new THREE.ConeGeometry(0.04, 0.1, 8), toon(0xffd070, null, { emissive: 0xffa020 }), [-0.7, 1.0, -1.4], g, { cast: false });
  contractPlane = plane(0.3, 0.4, toon(0xffffff, clampTex(PT.contract())), [0.15, 0.77, -1.15], 0, g); contractPlane.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 3; i++) { const p = plane(0.3, 0.4, toon(0xffffff, clampTex(PT.contract())), [0.62, 0.77 + i * 0.012, -1.2], 0, g); p.rotation.x = -Math.PI / 2; p.rotation.z = (R(i) - 0.5) * 0.4; stampedPile.push(p); }
  envelope = tbox(0.3, 0.012, 0.18, toon(0xf6f0e0), [0, 0, 0], scene, 0.3);
  const seal = cyl(0.03, 0.03, 0.01, toon(0xc8243a), [0, 0.008, 0], envelope, 12);
}
// --- London street + printing works ---
const london = new THREE.Group(); london.position.set(...S.LONDON); scene.add(london);
{
  const g = london, bm = toon(0xffffff, texOf(PT.brick(), [1, 1]));
  ground(16, 60, PT.cobble(), 4, [S.LONDON[0], S.LONDON[2] - 10], 0.01, scene);
  for (const s of [-1, 1]) for (let z = 4; z > -40; z -= 10) { const b = tbox(8, 12 + (z % 3), 9.6, bm, [s * 10, 6, z], g, 3); }
  // printing works facade at the end
  tbox(14, 12, 4, bm, [0, 6, -9.5], g, 3);
  tbox(2.4, 3.2, 0.1, toon(0x2a3a2a), [0, 1.6, -7.45], g, 1);
  for (const x of [-4.5, 4.5]) { tbox(2, 2, 0.1, toon(0x2a3446), [x, 2.2, -7.45], g, 1); tbox(2.2, 0.15, 0.2, toon(0xe8e2d4), [x, 1.15, -7.4], g, 1); }
  const pt = clampTex(PT.sign('PRINTING WORKS', '#2a2a2a', '#e8d8a0', 900, 150));
  plane(6.5, 1.1, toon(0xffffff, pt, { emissive: 0x111111 }), [0, 4.0, -7.4], 0, g);
  for (const x of [-5.5, 5.5]) { const l = new THREE.Group(); l.position.set(x, 0, -5); g.add(l); cyl(0.07, 0.1, 3.6, toon(0x22262a), [0, 1.8, 0], l, 8); add(new THREE.SphereGeometry(0.2, 12, 8), toon(0xfff2c0, null, { emissive: 0x6a5a30 }), [0, 3.75, 0], l); }
  // red phone box
  const pb = new THREE.Group(); pb.position.set(-4.5, 0, -2); g.add(pb);
  tbox(1, 2.5, 1, toon(0xc8242a), [0, 1.25, 0], pb, 1); tbox(1.1, 0.2, 1.1, toon(0xb81e24), [0, 2.6, 0], pb, 1);
  for (const s of [-1, 1]) tbox(0.7, 1.2, 0.02, toon(0x2a3446), [0, 1.5, s * 0.51], pb, 1);
}
// --- press room ---
const press = new THREE.Group(); press.position.set(...S.PRESS); scene.add(press);
let rollers = [], pressNotes, crates = [];
{
  const g = press, bm = toon(0xffffff, texOf(PT.brick('#7a4a3a'), [3, 2]));
  ground(14, 12, PT.parquet(), 2.4, [S.PRESS[0], S.PRESS[2]], 0.01, scene);
  plane(14, 6, bm, [0, 3, -4], 0, g);
  for (const s of [-1, 1]) plane(12, 6, bm, [s * 7, 3, 0], -s * Math.PI / 2, g);
  const iron = toon(0x2e4a3a), gold = toon(0xd8b44a);
  tbox(2.6, 0.5, 1.6, iron, [0, 0.25, -1], g, 1);
  for (const x of [-1.2, 1.2]) tbox(0.25, 2.4, 1.5, iron, [x, 1.5, -1], g, 1);
  tbox(2.6, 0.3, 1.6, iron, [0, 2.8, -1], g, 1);
  tbox(2.65, 0.06, 1.65, gold, [0, 2.97, -1], g, 1);
  for (let k = 0; k < 4; k++) { const r = cyl(0.22, 0.22, 2.2, toon(k % 2 ? 0x3a3c40 : 0x8a8e92), [0, 0.8 + k * 0.48, -1], g, 16); r.rotation.z = Math.PI / 2; rollers.push(r); }
  const wheel = add(new THREE.TorusGeometry(0.6, 0.06, 8, 24), gold, [-1.45, 1.5, -1], g); wheel.rotation.y = Math.PI / 2; rollers.push(wheel);
  tbox(3, 0.15, 0.9, toon(0x4a4a4e), [2.6, 0.9, -1], g, 1); // conveyor
  for (const x of [1.4, 3.8]) tbox(0.1, 0.9, 0.8, toon(0x3a3a3e), [x, 0.45, -1], g, 1);
  const lever = cyl(0.04, 0.04, 1.2, toon(0x8a2a2a), [-1.3, 1.6, -0.2], g, 6); lever.rotation.x = 0.3; press.userData.lever = lever;
  pressNotes = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.34, 0.17), noteMat, 60); pressNotes.castShadow = false; ND(pressNotes, 'mask'); g.add(pressNotes);
  const cm = toon(0xffffff, texOf(PT.crateLabel()));
  for (let i = 0; i < 10; i++) { const b = tbox(0.9, 0.7, 0.8, cm, [0, -10, 0], g, 0.9); crates.push(b); }
  for (let k = 0; k < 3; k++) { const l = new THREE.Group(); l.position.set(-3 + k * 3, 5.2, -1); g.add(l); cyl(0.01, 0.01, 1.4, toon(0x222222), [0, 0.7, 0], l, 4); add(new THREE.ConeGeometry(0.35, 0.3, 12, 1, true), toon(0x2e4a3a), [0, -0.05, 0], l); add(new THREE.SphereGeometry(0.12, 10, 8), toon(0xfff2c0, null, { emissive: 0x806030 }), [0, -0.15, 0], l); }
}
// --- bank counter ---
const bank = new THREE.Group(); bank.position.set(...S.BANK); scene.add(bank);
{
  const g = bank;
  ground(10, 10, PT.parquet(), 2.4, [S.BANK[0], S.BANK[2]], 0.01, scene);
  plane(10, 5, toon(0xffffff, texOf(PT.salonWall(), [10 / 2.4, 1])), [0, 2.5, -3.5], 0, g);
  for (const s of [-1, 1]) plane(10, 5, toon(0xffffff, texOf(PT.salonWall(), [10 / 2.4, 1])), [s * 4, 2.5, 0], -s * Math.PI / 2, g);
  const wood = toon(0xffffff, texOf(PT.planks('#6a3a1e', 4)));
  tbox(4.4, 1.05, 0.7, wood, [0, 0.52, -1.0], g, 1.2);
  tbox(4.5, 0.06, 0.8, toon(0x3a2416), [0, 1.08, -1.0], g, 1);
  for (let k = -8; k <= 8; k++) if (Math.abs(k) > 2) cyl(0.012, 0.012, 0.9, toon(0xd8b44a), [k * 0.13, 1.55, -1.25], g, 6);
  tbox(4.4, 0.05, 0.05, toon(0xd8b44a), [0, 2.0, -1.25], g, 1);
  const clock = cyl(0.4, 0.4, 0.06, toon(0xf6f0e0), [2.2, 3.2, -3.45], g, 24); clock.rotation.x = Math.PI / 2;
  tbox(0.03, 0.3, 0.02, toon(0x222222), [2.2, 3.3, -3.4], g, 1);
  for (const x of [-2.6, -1.6]) { tbox(0.8, 0.9, 0.6, toon(0x6a6e74), [x, 0.45, -3.1], g, 1); }
}

const clouds = [];
for (let i = 0; i < 10; i++) {
  const t = texOf(PT.cloud(i + 1)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(200, 100), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.4, fog: false, depthWrite: false }));
  const a = (i / 10) * Math.PI * 2 + R(i) * 0.3; m.position.set(Math.cos(a) * 900, 200 + R(i * 3) * 200, Math.sin(a) * 900); m.scale.setScalar(1.2 + R(i * 5)); m.renderOrder = -5; ND(m, 'hide'); scene.add(m); clouds.push(m);
}
// keep the taxi from the last film (now a cream Lisbon car)
// 1920s taxi
const car = new THREE.Group(); scene.add(car);
const carBody = new THREE.Group(); car.add(carBody);
const carWheels = []; let carDoor, carHole;
{
  const red = toon(0xe8dcb0), blk = toon(0x2a4a3a), chrome = toon(0xd8dade);
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

const noteImgs = {};
const noteImg = (serial) => noteImgs[serial] || (noteImgs[serial] = PT.note(serial));
const contractImg = PT.contract();
const fxDraw = { note: [512, 256, (p, t, a) => C.drawImageCard(p, 0, { img: noteImg(a.serial), w: 512, h: 256 })], check: [300, 300, (p, t) => C.drawCheck(p, t)],
  contract: [256, 340, (p, t, a) => C.drawImageCard(p, t, { img: contractImg, w: 256, h: 340, tear: a.tear })], stamp: [500, 320, (p, t, a) => C.drawStamp(p, t, a)], puff: [300, 300, C.fxPuff], burst: [500, 500, (p, t, a) => C.fxBurst(p, t, a.col || '#fff3b0')], sold: [500, 320, C.drawSold], stars: [420, 240, (p, t) => C.fxStars(p, t)] };

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
  if (K.on) { carDoor.rotation.y = 0; carHole.visible = false; car.position.set(K.x, 0, K.z); car.rotation.y = K.yaw; carBody.position.y = K.bounce; carBody.rotation.x = K.pitch; for (const w of carWheels) w.rotation.x = -K.wheel; }
  const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), zero = new THREE.Vector3(0.0001, 0.0001, 0.0001);
  rainIM.visible = ws.rain > 0;
  if (ws.rain > 0) {
    for (let i = 0; i < 90; i++) {
      const on = R(i * 1.7) < ws.rain, ph = (f * (0.008 + 0.006 * R(i)) + R(i * 3)) % 1;
      v.set((R(i * 5) - 0.5) * 5 + 0.4 * Math.sin(f * 0.07 + i), 4.2 - ph * 4.3, (R(i * 7) - 0.5) * 3 - 0.3);
      e.set(0.6 * Math.sin(f * 0.13 + i), f * 0.05 + i, 0.5 * Math.sin(f * 0.11 + i * 2)); qq.setFromEuler(e);
      m4.compose(v, qq, on ? one : zero); rainIM.setMatrixAt(i, m4);
    }
    rainIM.instanceMatrix.needsUpdate = true;
  }
  const cv = Math.round(ws.chalk * 20) / 20; if (cv !== chalkVal) { chalkVal = cv; chalkTex.image = PT.chalkWall(cv); chalkTex.needsUpdate = true; }
  stampedPile.forEach((p, i) => (p.visible = i < ws.stampCount));
  envelope.visible = ws.envelope >= 0 || ws.letterIn >= 0;
  if (ws.envelope >= 0) { const t = ws.envelope; envelope.position.set(S.DESK[0] + 0.15 + 0.4 * t, 0.8 + 2.4 * t * t, S.DESK[2] - 1.15 + 1.6 * t); envelope.rotation.set(-1.2 * t, 3 * t, 0.6 * t); }
  if (ws.letterIn >= 0) { const t = S.easeOut(ws.letterIn); envelope.position.set(S.LONDON[0] - 3 + 3.55 * t, 6 - 4.75 * t + 0.6 * Math.sin(Math.PI * t), S.LONDON[2] - 1 - 5.25 * t); envelope.rotation.set(0.6 * (1 - t), 6 * (1 - t), 0.4 * Math.sin(f * 0.4) * (1 - t)); }
  for (const r of rollers) r.rotation.x = ws.press * f * 0.4;
  if (press.userData.lever) press.userData.lever.rotation.x = 0.3 - 0.9 * Math.min(1, ws.press * 2) + 0.9 * Math.max(0, ws.press - 0.6) * 1.5;
  pressNotes.visible = ws.press > 0;
  if (ws.press > 0) {
    for (let i = 0; i < 60; i++) {
      const ph = ((f - 576) * 0.025 + R(i)) % 1; if (f < 576 + R(i) * 20) { m4.compose(v.set(0, -5, 0), qq, zero); pressNotes.setMatrixAt(i, m4); continue; }
      v.set(1.2 + ph * 3.2, 0.95 + Math.sin(ph * Math.PI) * (1.0 + R(i * 3) * 1.8), -1 + (R(i * 5) - 0.5) * 1.6);
      e.set(-1.3 + ph * 2 * R(i), ph * 5 * R(i * 2), ph * 3); qq.setFromEuler(e); m4.compose(v, qq, one); pressNotes.setMatrixAt(i, m4);
    }
    pressNotes.instanceMatrix.needsUpdate = true;
  }
  crates.forEach((b, i) => {
    if (ws.crates < 0) { b.visible = false; return; }
    const a = S.CRATES[i], t = (ws.crates - a) / 6; b.visible = t > 0;
    const col = i % 3, row = Math.floor(i / 3), tx = 2.6 + col * 0.95 - (row === 3 ? -0.95 : 0), ty = 0.35 + row * 0.7, tz = -1.6 + (row % 2) * 0.05;
    b.position.set(tx, t < 1 ? ty + 3 * (1 - t * t) : ty, tz); b.rotation.set(0, (R(i) - 0.5) * 0.2 + (t < 1 ? (1 - t) * 0.8 : 0), t < 1 ? (1 - t) * 0.4 : 0);
  });
  bancoSign.visible = ws.bancoSign > 0; bancoSign.rotation.x = (1 - S.back(ws.bancoSign, 2.2)) * 1.4; bancoSign.position.y = 7.3 + (1 - ws.bancoSign) * 2;
  cell.visible = ws.shot === 'cell'; desk.visible = ws.shot === 'forge'; press.visible = ws.shot === 'press' || ws.shot === 'crates'; bank.visible = ws.shot === 'bank'; london.visible = ws.shot === 'london' || ws.shot === 'nocheck';
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
      c.mesh.visible = true; placeCard(c.mesh, a.pos, false, 1, a.rotZ || 0); if (a.rotY) c.mesh.rotation.y += a.rotY;
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
