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

// ---------- ground ----------
const ground = (w, d, cv, T, pos, y) => {
  const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
  const m = add(g, toon(0xffffff, texOf(cv, [w / T, d / T])), [pos[0], y, pos[1]], scene, { cast: false });
  return m;
};
ground(2400, 2400, PT.scrub(), 7, [0, 0], 0);
ground(300, 196, PT.field(), 9, [0, -102.5], 0.01);
ground(600, 6.4, PT.dirt(), 6.4, [0, 0], 0.02);

// ---------- wheat (instanced crossed tufts) ----------
const tuftTex = (() => { const [cv, g] = PT.canvas(256, 256); C.drawWheatTuft(g, 256, 256, 3); return texOf(cv); })();
const tuftGeo = (() => {
  const a = new THREE.PlaneGeometry(1.15, 1.0); a.translate(0, 0.5, 0);
  const b = a.clone(); b.rotateY(Math.PI / 2);
  const pos = [...a.attributes.position.array, ...b.attributes.position.array], uv = [...a.attributes.uv.array, ...b.attributes.uv.array];
  const nrm = new Array(pos.length).fill(0).map((_, i) => (i % 3 === 1 ? 1 : 0));
  const idx = [...a.index.array, ...b.index.array.map((v) => v + 4)];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setIndex(idx); return g;
})();
const wheatMat = new THREE.MeshBasicMaterial({ map: tuftTex, alphaTest: 0.5, side: THREE.DoubleSide, color: 0xffffff });
{
  const pts = [], clear = S.CLEAR;
  const inHouse = (x, z) => x > -58 && x < -22 && z > -78 && z < -44;
  for (let x = -120; x < 120; x += 1.0) for (let z = -5.3; z > -150; z -= 1.0) {
    const jx = x + (R(x * 3.1 + z) - 0.5) * 0.9, jz = z - R(x + z * 1.7) * 0.9;
    if (jz > -5.2 || inHouse(jx, jz)) continue;
    if (clear.some((c) => (jx - c.x) ** 2 + (jz - c.z) ** 2 < c.r * c.r)) continue;
    pts.push([jx, jz]);
  }
  const im = new THREE.InstancedMesh(tuftGeo, wheatMat, pts.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  pts.forEach(([x, z], i) => {
    const s = 0.8 + 0.35 * R(i * 1.3);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), R(i * 2.7) * 3.14);
    m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(s, s * (0.85 + 0.3 * R(i)), s)); im.setMatrixAt(i, m4);
    const k = 0.86 + 0.2 * R(i * 5.3); im.setColorAt(i, col.setRGB(k, k * (0.97 + 0.04 * R(i)), k * 0.95));
  });
  im.castShadow = false; im.receiveShadow = false; ND(im, 'mask'); scene.add(im);
  window.wheatCount = pts.length;
}

// ---------- fences ----------
{
  const postMat = toon(0x8a6a48, texOf(PT.planks('#8a6a48', 2, true)));
  const xs = []; for (let x = -150; x <= 150; x += 3.5) xs.push(x);
  const g = new THREE.CylinderGeometry(0.06, 0.07, 1.15, 6); g.translate(0, 0.575, 0);
  const im = new THREE.InstancedMesh(g, postMat, xs.length * 2), m4 = new THREE.Matrix4();
  xs.forEach((x, i) => { m4.makeTranslation(x, 0, -4.7); im.setMatrixAt(2 * i, m4); m4.makeTranslation(x, 0, -4.7); im.setMatrixAt(2 * i + 1, m4); });
  im.castShadow = true; ND(im, 'world'); scene.add(im);
  for (const z of [-4.7]) for (const y of [0.55, 0.95]) {
    const w = add(new THREE.CylinderGeometry(0.012, 0.012, 300, 4), toon(0x55504a), [0, y, z], scene, { cast: false, nd: 'mask' }); w.rotation.z = Math.PI / 2;
  }
}

// ---------- farmhouse, tank, windpump ----------
{
  const g = new THREE.Group(); g.position.set(S.HOUSE[0], 0, S.HOUSE[2]); scene.add(g);
  const wb = toon(0xffffff, texOf(PT.weatherboard('#ece0c4'))), iron = toon(0xffffff, texOf(PT.corrugated('#b04a3a'))), deck = toon(0xffffff, texOf(PT.planks('#9a6a40', 6)));
  tbox(10, 3.4, 7, wb, [0, 2.2, 0], g, 2.2);
  tbox(10.6, 0.5, 9.4, deck, [0, 0.25, 1.1], g, 2);
  for (const s of [-1, 1]) { const r = tbox(11.2, 0.18, 4.6, iron, [0, 4.75, s * 2.0], g, 2.2); r.rotation.x = s * 0.5; }
  tbox(10.6, 0.12, 2.6, iron, [0, 3.75, 4.4], g, 2.2).rotation.x = 0.18;
  for (let i = 0; i < 6; i++) cyl(0.07, 0.07, 3.2, toon(0xf3ead8), [-5 + i * 2, 2.1, 5.6], g, 8);
  const dark = toon(0x2b3240), frame = toon(0xf6f0e2);
  for (const x of [-3.2, 3.2]) { tbox(1.4, 1.3, 0.06, frame, [x, 2.4, 3.52], g); tbox(1.15, 1.05, 0.08, dark, [x, 2.4, 3.53], g); }
  tbox(1.1, 2.1, 0.08, toon(0x4f7a5a), [0, 1.55, 3.53], g);
  tbox(0.7, 1.4, 0.7, toon(0xa85a3e), [3.2, 5.4, -1.2], g);
  const tank = new THREE.Group(); tank.position.set(S.PUMP[0] - 4, 0, S.PUMP[2] + 1); scene.add(tank);
  cyl(1.3, 1.3, 2.2, toon(0xffffff, texOf(PT.corrugated('#9aa4a8'), [3, 1])), [0, 2.6, 0], tank, 20);
  cyl(0.05, 1.35, 0.5, toon(0x8f989c), [0, 3.95, 0], tank, 20);
  tbox(2.8, 1.5, 2.8, toon(0x8a6a48, texOf(PT.planks('#8a6a48', 4, true))), [0, 0.75, 0], tank, 1.5);
  // windpump (Southern Cross style)
  const wp = new THREE.Group(); wp.position.set(S.PUMP[0], 0, S.PUMP[2]); scene.add(wp);
  const steel = toon(0xc8ccd0);
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const leg = add(new THREE.CylinderGeometry(0.05, 0.07, 10.2, 6), steel, [sx * 0.75, 5, sz * 0.75], wp); leg.rotation.set(sz * 0.14, 0, -sx * 0.14);
  }
  for (const y of [2.5, 5, 7.5]) { const k = 1 - y / 10.5; tbox(1.9 * k + 0.2, 0.05, 0.05, steel, [0, y, 0.75 * k + 0.05], wp, 1); tbox(1.9 * k + 0.2, 0.05, 0.05, steel, [0, y, -0.75 * k - 0.05], wp, 1); }
  const wheel = new THREE.Group(); wheel.position.set(0, 10.3, 0.45); wp.add(wheel); window.pumpWheel = wheel;
  for (let i = 0; i < 18; i++) { const b = tbox(0.32, 1.35, 0.03, toon(0xe8ecee), [0, 0, 0], wheel, 1); const a = (i / 18) * Math.PI * 2; b.position.set(Math.sin(a) * 0.95, Math.cos(a) * 0.95, 0); b.rotation.set(0, 0.5, -a); }
  add(new THREE.TorusGeometry(1.55, 0.04, 6, 32), steel, [0, 0, 0], wheel);
  cyl(0.12, 0.12, 0.4, steel, [0, 10.3, 0], wp).rotation.x = Math.PI / 2;
  tbox(0.04, 1.0, 1.9, toon(0xd8443a), [0, 10.3, -1.4], wp, 1);
}

// ---------- gum trees, hills, clouds ----------
const gumMat = toon(0xffffff, texOf(PT.bark())), leafMat = [toon(0x6f8a52), toon(0x5d7a48), toon(0x7d9058)];
const gum = (x, z, s = 1, seed = 1) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
  const t = cyl(0.22, 0.38, 6, gumMat, [0, 3, 0], g, 8); t.rotation.z = (R(seed) - 0.5) * 0.25;
  const b = cyl(0.1, 0.18, 3, gumMat, [0.7, 5.6, 0], g, 6); b.rotation.z = -0.6;
  for (let i = 0; i < 6; i++) {
    const m = add(new THREE.IcosahedronGeometry(1.6 + R(seed + i) * 1.1, 1), leafMat[i % 3], [(R(seed * 3 + i) - 0.5) * 4.5, 6.6 + R(seed + i * 2) * 2.4, (R(seed * 5 + i) - 0.5) * 3.5], g);
    m.scale.set(1, 0.62, 1);
  }
  return g;
};
const gums = [[-60, -70], [-52, -48], [-20, -66], [-70, -40], [55, -158], [20, -165], [-15, -160], [-90, -150], [90, -120], [120, -70], [-120, -60], [38, 30], [62, 22], [-30, 26],
  [0, 40], [-60, 35], [85, 40], [130, -20], [-130, -10], [25, 22], [-10, 18], [70, -6], [-80, 8], [110, 15]];
gums.forEach(([x, z], i) => gum(x, z, 0.9 + R(i) * 0.5, i + 1));
for (let i = 0; i < 26; i++) {
  const a = (i / 26) * Math.PI * 2 + R(i) * 0.2, r = 330 + R(i * 3) * 160, s = 80 + R(i * 7) * 90;
  const h = add(new THREE.SphereGeometry(1, 20, 10), toon([0x8f9a5a, 0x9a8a5a, 0x7f8a5a][i % 3]), [Math.cos(a) * r, -s * 0.05, Math.sin(a) * r], scene, { cast: false });
  h.scale.set(s, s * (0.12 + R(i * 2) * 0.1), s * 0.8);
}
const clouds = [];
for (let i = 0; i < 12; i++) {
  const t = texOf(PT.cloud(i + 1)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(200, 100), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.4, fog: false, depthWrite: false }));
  const a = (i / 12) * Math.PI * 2 + R(i) * 0.3, r = 800;
  m.position.set(Math.cos(a) * r, 140 + R(i * 3) * 160, Math.sin(a) * r); m.scale.setScalar(0.9 + R(i * 5) * 0.8); m.renderOrder = -5;
  ND(m, 'hide'); scene.add(m); clouds.push(m);
}

// ---------- Lewis gun ----------
const gunDark = toon(0x3d4a3a, texOf(PT.metal('#3d4a3a'))), gunWood = toon(0x7a4b2a), gunSteel = toon(0x3a3c40);
const makeLewis = () => {
  const g = new THREE.Group(), barrel = new THREE.Group(); g.add(barrel);
  tbox(0.32, 0.09, 0.07, gunWood, [-0.46, -0.03, 0], g, 1);
  tbox(0.3, 0.13, 0.11, gunSteel, [-0.15, 0, 0], g, 1);
  const pan = cyl(0.17, 0.17, 0.05, gunSteel, [-0.12, 0.1, 0], g, 20);
  cyl(0.075, 0.075, 0.72, gunDark, [0.36, 0, 0], barrel, 14).rotation.z = Math.PI / 2;
  cyl(0.026, 0.026, 0.24, gunSteel, [0.82, 0, 0], barrel, 8).rotation.z = Math.PI / 2;
  g.userData.barrel = barrel; return g;
};
const tripod = (parent, pos) => {
  const t = new THREE.Group(); t.position.set(...pos); parent.add(t);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.4; const l = cyl(0.025, 0.03, 1.25, gunSteel, [Math.cos(a) * 0.17, 0.6, Math.sin(a) * 0.17], t, 6); l.rotation.set(Math.sin(a) * 0.28, 0, -Math.cos(a) * 0.28); }
  return t;
};
// hook nest
const hookGun = makeLewis(); hookGun.position.set(S.HOOK[0] + 0.3, 1.12, S.HOOK[2] + 0.4); hookGun.rotation.y = 0.5; scene.add(hookGun);
const hookTri = tripod(scene, [S.HOOK[0] + 0.3, 0, S.HOOK[2] + 0.4]);
// split-shot nest at the fence
const nestGun = makeLewis(); nestGun.position.set(13.4, 1.15, -8.0); nestGun.rotation.y = 1.9; scene.add(nestGun);
const nestTri = tripod(scene, [13.4, 0, -8.0]);

// ---------- truck ----------
const truck = new THREE.Group(); scene.add(truck);
const tBody = new THREE.Group(); truck.add(tBody);
const wheels = [];
{
  const od = toon(0xffffff, texOf(PT.olive('#5f6b3a'))), odk = toon(0x4c5630), blk = toon(0x262426), wood = toon(0xffffff, texOf(PT.planks('#9c7a4c', 4)));
  tbox(5.4, 0.22, 1.5, blk, [-0.3, 0.78, 0], tBody, 2);
  tbox(1.5, 0.85, 1.25, od, [1.95, 1.3, 0], tBody, 1.5); // bonnet
  tbox(0.08, 0.8, 1.05, toon(0x9aa0a2), [2.72, 1.28, 0], tBody, 0.5); // grille
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.12, 12, 8), toon(0xf2e8b0), [2.72, 1.55, s * 0.5], tBody);
  // open cab
  tbox(1.15, 0.65, 1.9, od, [0.75, 1.28, 0], tBody, 1.5);
  tbox(1.3, 0.08, 2.0, od, [0.8, 2.3, 0], tBody, 1.5);
  tbox(0.08, 0.7, 1.9, od, [0.2, 1.95, 0], tBody, 1.5);
  for (const [x, z] of [[0.22, -0.92], [0.22, 0.92], [1.3, -0.92], [1.3, 0.92]]) tbox(0.07, 0.72, 0.07, odk, [x, 1.95, z], tBody, 1);
  tbox(0.05, 0.08, 1.9, odk, [1.32, 1.62, 0], tBody, 1);
  // fenders over the front wheels
  for (const s of [-1, 1]) { const fd = add(new THREE.CylinderGeometry(0.55, 0.55, 0.36, 14, 1, true, -Math.PI / 2, Math.PI), odk, [1.9, 0.82, s * 0.85], tBody); fd.rotation.x = Math.PI / 2; fd.rotation.y = 0; fd.rotation.z = 0; fd.material.side = THREE.DoubleSide; }
  // bed
  tbox(2.95, 0.12, 2.1, wood, [-1.15, 1.0, 0], tBody, 1.5);
  for (const s of [-1, 1]) tbox(2.95, 0.5, 0.08, wood, [-1.15, 1.31, s * 1.03], tBody, 1.5);
  tbox(0.08, 0.5, 2.1, wood, [-2.6, 1.31, 0], tBody, 1.5);
  for (const [x, z] of [[1.9, 0.92], [1.9, -0.92], [-1.6, 0.92], [-1.6, -0.92]]) {
    const w = new THREE.Group(); w.position.set(x, 0.45, z); truck.add(w); wheels.push(w);
    cyl(0.45, 0.45, 0.28, blk, [0, 0, 0], w, 18).rotation.x = Math.PI / 2;
    cyl(0.2, 0.2, 0.3, toon(0x6a7240), [0, 0, 0], w, 10).rotation.x = Math.PI / 2;
    tbox(0.7, 0.07, 0.3, toon(0x3a3a38), [0, 0, 0], w, 1);
  }
}
const truckGun = makeLewis(); tBody.add(truckGun);
const truckPost = cyl(0.06, 0.08, 0.75, gunSteel, [-1.2, 1.43, 0], tBody, 8);

// ---------- camp ----------
const casingMat = toon(0xd8a840);
let pile, mound, rainIM, board, boardTex, boardVal = -1;
{
  const g = new THREE.Group(); scene.add(g);
  const cloth = toon(0xffffff, texOf(PT.canvasCloth()));
  const tent = add(new THREE.CylinderGeometry(1.7, 1.7, 3.6, 3, 1), cloth, [18, 1.0, 16.5], g); tent.rotation.set(0, 0, Math.PI / 2); tent.scale.set(1, 1, 1.3);
  const crate = toon(0xffffff, texOf(PT.planks('#8f6a3e', 3)));
  for (const [x, y, z, r] of [[7.6, 0.25, 10.4, 0.1], [8.3, 0.25, 10.9, -0.2], [7.9, 0.75, 10.6, 0.3], [12.7, 0.25, 11.6, 0.3], [6.6, 0.25, 11.5, 0.4]]) tbox(0.75, 0.5, 0.55, crate, [x, y, z], g, 0.8).rotation.y = r;
  pile = add(new THREE.ConeGeometry(1, 1, 24), casingMat, [10.2, 0, 12.1], g); pile.scale.set(0.01, 0.01, 0.01);
  const cg0 = new THREE.CylinderGeometry(0.03, 0.03, 0.13, 7);
  mound = new THREE.InstancedMesh(cg0, casingMat, 1400); ND(mound, 'world'); mound.position.set(10.2, 0, 12.1); mound.castShadow = true; g.add(mound);
  { const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), e = new THREE.Euler(), pts = [];
    for (let i = 0; i < 1400; i++) { const r = Math.sqrt(R(i * 1.7)) * 1.05, a = R(i * 3.9) * 6.283; pts.push([r, a, (1 - r / 1.05) * 0.75 * R(i * 5.1) ** 0.3]); }
    pts.sort((p1, p2) => p1[2] - p2[2]);
    pts.forEach(([r, a, y], i) => { e.set(R(i) * 3, R(i * 2) * 3, R(i * 4) * 3); qq.setFromEuler(e); m4.compose(new THREE.Vector3(Math.cos(a) * r, y + 0.03, Math.sin(a) * r * 0.8), qq, new THREE.Vector3(1, 1, 1)); mound.setMatrixAt(i, m4); }); }
  const cg = new THREE.CylinderGeometry(0.03, 0.03, 0.13, 6);
  rainIM = new THREE.InstancedMesh(cg, casingMat, 160); rainIM.castShadow = false; ND(rainIM, 'world'); g.add(rainIM);
  // tally board on an easel
  const [cv] = [PT.tallyBoard(0)]; boardTex = texOf(cv); boardTex.wrapS = boardTex.wrapT = THREE.ClampToEdgeWrapping;
  board = add(new THREE.PlaneGeometry(1.25, 0.94), new THREE.MeshToonMaterial({ map: boardTex, gradientMap: grad, emissive: 0x222222 }), [14.0, 1.42, 11.0], g, { cast: true });
  board.rotation.set(-0.08, -0.12, 0);
  for (const dx of [-0.5, 0.5]) { const l = cyl(0.03, 0.03, 1.9, toon(0x7a5434), [14.0 + dx * 1.25, 0.95, 10.93], g, 6); l.rotation.z = dx * 0.2; }
  const back = cyl(0.03, 0.03, 1.9, toon(0x7a5434), [14.0, 0.95, 10.7], g, 6); back.rotation.x = -0.3;
  
}

// ---------- cards ----------
const SCALE = 0.00225; // metres per design unit (600 x 1000 design canvas, soles at y = 975)
const CARD_RES = 1.6;
const cardGeo = new THREE.PlaneGeometry(600 * SCALE, 1000 * SCALE); cardGeo.translate(0, (1000 / 2 - 975) * SCALE + 1000 * SCALE * 0, 0); // centre then lift
cardGeo.translate(0, 0, 0);
const cards = new Map();
const OUTFIT = { digger0: C.DIGGER(0), digger1: C.DIGGER(1), digger2: C.DIGGER(2), commander: C.COMMANDER, farmer: C.FARMER };
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
// herd: shared pre-drawn textures
const herdTex = {};
const mkHerdTex = (key, opts) => {
  const cv = document.createElement('canvas'); cv.width = 360; cv.height = 600; const g = cv.getContext('2d'); g.scale(0.6, 0.6);
  C.drawEmu(C.newPen(g), opts);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  herdTex[key] = { mat: cardMat(t), depth: depthMat(t) };
};
for (let i = 0; i < 8; i++) { mkHerdTex('run' + i, { mode: 'run', phase: i / 8, expr: 'alarm', seed: i + 1 }); mkHerdTex('walk' + i, { mode: 'run', phase: i / 8, expr: 'blank', seed: i + 11 }); }
mkHerdTex('stand', { mode: 'stand', expr: 'blank', seed: 3 }); mkHerdTex('peck', { mode: 'peck', peck: 0.95, expr: 'blank', seed: 4 });
const herdPool = [];
const getHerd = (i) => {
  if (!herdPool[i]) { const m = new THREE.Mesh(personGeo, herdTex.stand.mat); m.castShadow = true; ND(m, 'mask'); scene.add(m); herdPool[i] = { mesh: m, blob: mkBlob() }; }
  return herdPool[i];
};
const q = (v, k = 100) => Math.round(v * k) / k;
const keyOf = (o) => JSON.stringify(o, (k, v) => (typeof v === 'number' ? q(v) : v));

const fxDraw = { puff: [300, 300, C.fxPuff], burst: [500, 500, (p, t, a) => C.fxBurst(p, t, a.col || '#fff3b0')] };

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
const maskCache = new Map();
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
  skyU.top.value.set(L.sky); skyU.hor.value.set(L.hor); skyU.sunDir.value.copy(dir); skyU.sunCol.value.setRGB(...L.sun); skyU.sunAmt.value = shot.light === 'day' ? 0 : 1;
  scene.fog.color.set(L.hor); scene.fog.near = L.fog[0]; scene.fog.far = L.fog[1];
  const tint = new THREE.Color().setRGB(...L.card);
  wheatMat.color.copy(tint).multiplyScalar(shot.light === 'day' ? 1.0 : 0.95);
  for (const c of cards.values()) c.mesh.material.color.copy(tint);
  for (const k in herdTex) herdTex[k].mat.color.copy(tint);
  blobMat.opacity = shot.light === 'day' ? 0.32 : 0.22;
  inkPass.u.uSat.value = L.sat; inkPass.u.uGain.value = L.gain;
};

const placeCard = (mesh, pos, flip, scale = 1) => {
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.rotation.set(0, Math.atan2(camera.position.x - pos[0], camera.position.z - pos[2]), 0);
  mesh.scale.set(flip ? -scale : scale, scale, scale);
};

window.renderFrame = (f) => {
  // camera
  const cm = S.camAt(f);
  camera.position.set(...cm.pos); camera.fov = cm.fov; camera.up.set(0, 1, 0); camera.lookAt(...cm.look);
  camera.rotateZ((cm.roll * Math.PI) / 180); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  camRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
  applyLight(f);
  for (const c of clouds) c.lookAt(camera.position);
  window.pumpWheel.rotation.z = -f * 0.05;
  // world state
  const ws = S.worldAt(f);
  hookGun.visible = hookTri.visible = ws.shot === 'hook';
  hookGun.userData.barrel.rotation.z = -0.55 * ws.droop;
  nestGun.visible = nestTri.visible = ws.shot === 'split';
  const T = ws.truck;
  truck.visible = !!T.on;
  if (T.on) {
    truck.position.set(T.x, 0, T.z); truck.rotation.set(0, T.yaw, 0);
    tBody.position.y = T.bounce; tBody.rotation.set(T.roll, 0, T.pitch);
    for (const w of wheels) w.rotation.z = -T.wheel;
    const gy = 1.95 + 1.3 * (1 - S.easeIn(T.gun ?? 0)) + (T.gunDrop < 9999 && f > 654 ? 0.06 * Math.sin((f - 654) * 1.3) * Math.exp(-(f - 654) * 0.35) : 0);
    truckGun.visible = truckPost.visible = (T.gun ?? 0) > 0;
    truckGun.position.set(-1.2, gy, 0); truckGun.rotation.set(0, 0, 0.06 + (ws.shot === 'outrun' ? 0.08 * Math.sin(f * 1.7) : 0));
    truckGun.rotation.y = ws.shot === 'outrun' ? 0.15 * Math.sin(f * 0.9) : 0;
  }
  const cs = ws.casings; pile.visible = mound.visible = cs > 0.01; pile.scale.set(0.9 * cs, 0.55 * cs, 0.75 * cs); pile.position.y = 0.55 * cs / 2 - 0.05; mound.scale.set(0.25 + 0.75 * cs, 0.15 + 0.85 * cs, 0.25 + 0.75 * cs);
  rainIM.visible = !!ws.rain;
  if (ws.rain) {
    const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < 160; i++) {
      const ph = ((f * 0.06 + R(i)) % 1), y = 3.2 * (1 - ph * ph) + 0.3, x = 10.2 + (R(i * 3) - 0.5) * 1.6, z = 12.1 + (R(i * 7) - 0.5) * 1.2;
      e.set(f * 0.3 + i, i, f * 0.2); qq.setFromEuler(e); m4.compose(new THREE.Vector3(x, y, z), qq, new THREE.Vector3(1, 1, 1)); rainIM.setMatrixAt(i, m4);
    }
    rainIM.instanceMatrix.needsUpdate = true;
  }
  const bv = Math.round(ws.board * 10) / 10;
  if (bv !== boardVal) { boardVal = bv; boardTex.image = PT.tallyBoard(bv); boardTex.needsUpdate = true; }
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
      if (a.kind === 'person') C.drawPerson(c.pen, OUTFIT[a.who], a.opts); else C.drawEmu(c.pen, a.opts);
      c.tex.needsUpdate = true;
    }
    const flip = a.flip !== undefined ? a.flip : a.vel ? a.vel[0] * camRight.x + a.vel[2] * camRight.z < 0 : false;
    c.mesh.visible = true; placeCard(c.mesh, a.pos, flip, a.scale || 1);
    if (c.blob) { c.blob.visible = a.pos[1] > -0.3; c.blob.position.set(a.pos[0], Math.max(0, a.pos[1]) + 0.03, a.pos[2]); c.blob.scale.setScalar((a.scale || 1) * (a.kind === 'emu' ? 1.2 : 0.9)); }
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
