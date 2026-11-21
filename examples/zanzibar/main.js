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

// ---------- world: Zanzibar harbour, 27 August 1896 ----------
const ground = (w, d, cv, T, pos, y, parent = scene) => {
  const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
  return add(g, toon(0xffffff, texOf(cv, [w / T, d / T])), [pos[0], y, pos[1]], parent, { cast: false });
};
const clampTex = (cv) => { const t = texOf(cv); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; };
/** box whose front/back UVs follow world-ish x/y so a facade texture lines up across pieces (Tx, Ty metres per repeat) */
const wbox = (w, h, d, mat, pos, parent = scene, Tx = 8, Ty = 12, ox = 0, oy = 0) => {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) {
    const k = f * 4 + i, u0 = uv.getX(k), v0 = uv.getY(k);
    if (f >= 4) uv.setXY(k, (ox + u0 * w) / Tx, (oy + v0 * h) / Ty);
    else if (f <= 1) uv.setXY(k, (u0 * d) / Tx, (oy + v0 * h) / Ty);
    else uv.setXY(k, (u0 * w) / Tx, (v0 * d) / Tx);
  }
  return add(g, mat, pos, parent);
};
// sea + land
const seaTex = texOf(PT.sea(), [3000 / 14, 3000 / 14]);
const seaMat = toon(0xffffff, seaTex);
{ const g = new THREE.PlaneGeometry(3000, 3000); g.rotateX(-Math.PI / 2); add(g, seaMat, [0, 0, 1490], scene, { cast: false }); }
ground(3000, 1500, PT.sand(), 8, [0, -750], S.LAND_Y);
const stoneMat = toon(0xffffff, texOf(PT.stone('#a89a80')));
tbox(400, 2.4, 1.2, stoneMat, [0, S.LAND_Y - 1.2, -0.6], scene, 2);
for (let x = -150; x <= 150; x += 9) cyl(0.18, 0.22, 0.6, toon(0x4a3a2e), [x + 2, S.LAND_Y + 0.3, -0.5], scene, 8); // bollards

// ---------- palace ----------
const palMat = toon(0xffffff, texOf(PT.palaceWall('#f6f1e4', 3, 2)));
const trimMat = toon(0xe8dcc0);
const palace = new THREE.Group(); palace.position.set(...S.PAL); scene.add(palace);
const core = new THREE.Group(); palace.add(core);
const coreMat = toon(0xffffff, palMat.map);
{
  const b = wbox(22, 12, 8.8, coreMat, [0, 6, -0.6], core); // back block (front face at z = -9.6 world)
  for (let x = -10.5; x <= 10.5; x += 1.5) tbox(0.8, 0.8, 0.8, trimMat, [x, 12.4, 3.4], core, 1); // crenellations
  tbox(22.4, 0.4, 9.2, trimMat, [0, 12, -0.6], core, 2);
  // verandah roof on the sides
  for (const s of [-1, 1]) tbox(1.2, 0.3, 8.8, trimMat, [s * 11.6, 8, -0.6], core, 2);
}
// front facade: 5 x 3 pieces that fall in the bombardment
const pieces = [];
{
  const cols = 5, rows = 3, pw = 22 / cols, ph = 12 / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x = -11 + pw * (i + 0.5), y = ph * (j + 0.5);
    const grp = new THREE.Group(); grp.position.set(S.PAL[0] + x, y, -9.3); scene.add(grp);
    wbox(pw, ph, 0.6, palMat, [0, 0, 0], grp, 8, 12, x + 11 - pw / 2, y - ph / 2);
    pieces.push({ grp, x0: S.PAL[0] + x, y0: y, z0: -9.3, i, j, d: 0.38 * (1 - j / 2) * 0.6 + 0.3 * R(i * 3 + j) });
  }
}
// balcony (falls with the middle top piece)
const balcony = new THREE.Group(); balcony.position.set(0, 0, 0); scene.add(balcony);
{
  const bm = toon(0xf2ead8), cm = toon(0xffffff, texOf(PT.planks('#8a5a3a', 4)));
  tbox(4.4, 1.6, 2.0, bm, [0, S.BALC_Y - 0.8, -8.0], balcony, 2);
  tbox(4.6, 0.16, 2.2, cm, [0, S.BALC_Y + 0.02, -8.0], balcony, 2);
  tbox(4.6, 0.7, 0.25, bm, [0, S.BALC_Y + 0.35, -7.12], balcony, 2);
  for (const s of [-1, 1]) tbox(0.25, 0.7, 2.0, bm, [s * 2.18, S.BALC_Y + 0.35, -8.0], balcony, 2);
  tbox(4.8, 0.14, 0.4, trimMat, [0, S.BALC_Y + 0.75, -7.12], balcony, 2);
  for (let k = 0; k < 5; k++) { const c = add(new THREE.ConeGeometry(0.22, 0.9, 8), bm, [-1.6 + k * 0.8, S.BALC_Y - 1.9, -7.4], balcony); c.rotation.x = Math.PI; }
  // painted door behind (on the facade)
  const door = add(new THREE.PlaneGeometry(1.2, 2.2), toon(0x2a4a40), [0.3, S.BALC_Y + 1.1, -8.99], balcony, { cast: false });
  add(new THREE.CircleGeometry(0.6, 16, 0, Math.PI), toon(0x2a4a40), [0.3, S.BALC_Y + 2.2, -8.99], balcony, { cast: false });
}
// rubble heaps that rise as the facade falls
const heaps = [];
for (let i = 0; i < 9; i++) {
  const h = add(new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(0xffffff, texOf(PT.rubble())), [-10 + 2.5 * i + R(i) * 1.2, S.LAND_Y - 0.05, -7.2 - R(i * 4) * 1.4], scene);
  h.userData.s = [2.2 + 1.4 * R(i * 2), 1.2 + 1.2 * R(i * 5), 1.6 + 0.8 * R(i * 7)]; h.scale.set(0.001, 0.001, 0.001); heaps.push(h);
}
// flag on the roof
const flagPole = new THREE.Group(); flagPole.position.set(-6, 12.4, -12); scene.add(flagPole);
cyl(0.1, 0.12, 8, toon(0xe8e4dc), [0, 4, 0], flagPole, 8);
const flagGeo = new THREE.PlaneGeometry(3.2, 1.8, 16, 4); flagGeo.translate(1.6, 0, 0);
const flagBase = flagGeo.attributes.position.array.slice();
const flag = add(flagGeo, toon(0xffffff, clampTex(PT.flagRed()), { side: THREE.DoubleSide }), [0.1, 7.0, 0], flagPole, { cast: false });
// clock tower (House of Wonders style)
const clockMat = toon(0xffffff, clampTex(PT.clockFace(8, 50)), { emissive: 0x111111 });
{
  const g = new THREE.Group(); g.position.set(...S.TOWER); scene.add(g);
  const tm = toon(0xffffff, texOf(PT.palaceWall('#efe6d2', 1, 1)));
  wbox(4, 26, 4, tm, [0, 13, 0], g, 4, 4);
  tbox(4.6, 0.5, 4.6, trimMat, [0, 19.5, 0], g, 2);
  tbox(4.6, 0.5, 4.6, trimMat, [0, 23.6, 0], g, 2);
  const roof = add(new THREE.ConeGeometry(3.4, 4.5, 4), toon(0x5a8a7a), [0, 28.2, 0], g); roof.rotation.y = Math.PI / 4;
  add(new THREE.PlaneGeometry(3.2, 3.2), clockMat, [0, 21.5, 2.01], g, { cast: false });
}
// town: whitewashed houses around the harbour
{
  const cols = ['#f4efe2', '#efe2c8', '#e8d4b4', '#f2e6d6', '#dcd0bc'];
  const mats = cols.map((c, i) => toon(0xffffff, texOf(PT.palaceWall(c, 2, 2, ['#3a7a6a', '#7a4a2a', '#3a5a8a'][i % 3]))));
  const spots = [];
  for (let x = -90; x <= 100; x += 9) for (let z = -6; z > -80; z -= 10) {
    if (x > -16 && x < 20 && z > -26) continue;
    if (R(x * 1.3 + z) < 0.25) continue;
    spots.push([x + (R(x + z * 3) - 0.5) * 3, z - (z === -6 ? 0 : R(x * z) * 3)]);
  }
  spots.forEach(([x, z], i) => {
    const h = 6 + 6 * R(i * 1.7), w = 7 + 2 * R(i * 2.3), d = 7;
    wbox(w, h, d, mats[i % mats.length], [x, S.LAND_Y + h / 2, z - d / 2], scene, 7, 8);
    tbox(w + 0.3, 0.35, d + 0.3, trimMat, [x, S.LAND_Y + h, z - d / 2], scene, 2);
  });
}
// palms
const palmLeaf = [toon(0x4f8a3e), toon(0x3f7a36), toon(0x5c9a48)], trunkMat = toon(0xffffff, texOf(PT.bark()));
const palm = (x, z, s = 1, seed = 1) => {
  const g = new THREE.Group(); g.position.set(x, S.LAND_Y, z); g.scale.setScalar(s); scene.add(g);
  const lean = (R(seed) - 0.5) * 0.3;
  let top = [0, 0, 0];
  for (let k = 0; k < 4; k++) { const seg = cyl(0.26 - k * 0.03, 0.3 - k * 0.03, 2.2, trunkMat, [top[0] + lean * 1.1, top[1] + 1.1, 0], g, 8); seg.rotation.z = -lean * 0.5 * (k + 1) / 4; top = [top[0] + lean * 2.2 * 0.5, top[1] + 2.15, 0]; }
  const crown = new THREE.Group(); crown.position.set(top[0], top[1], 0); g.add(crown);
  for (let k = 0; k < 8; k++) {
    const l = add(new THREE.SphereGeometry(1, 10, 6), palmLeaf[k % 3], [0, 0, 0], crown); l.scale.set(2.2, 0.12, 0.45);
    l.position.set(Math.cos(k * 0.785) * 1.8, -0.35, Math.sin(k * 0.785) * 1.8); l.rotation.set(0, -k * 0.785, -0.45);
  }
  return crown;
};
const palmCrowns = [[-20, -3, 1.0], [-13, -3.5, 0.9], [8.5, -3, 1.0], [22, -3.2, 1.1], [31, -2.8, 0.9], [-34, -3, 1.05], [-46, -4, 0.95], [44, -3.5, 1.0], [-27, -2.8, 0.85]].map(([x, z, s], i) => palm(x, z, s, i + 3));
// distant green hills behind the town
for (let i = 0; i < 16; i++) {
  const a = Math.PI + (i / 15) * Math.PI, r = 420 + R(i * 3) * 120, s = 90 + R(i * 7) * 80;
  const h = add(new THREE.SphereGeometry(1, 20, 10), toon([0x6f9a5a, 0x7aa462, 0x5f8a50][i % 3]), [Math.cos(a) * r, -s * 0.06, Math.sin(a) * r * 0.6 - 120], scene, { cast: false });
  h.scale.set(s, s * (0.14 + R(i * 2) * 0.08), s * 0.7);
}
const clouds = [];
for (let i = 0; i < 12; i++) {
  const t = texOf(PT.cloud(i + 1)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(200, 100), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.4, fog: false, depthWrite: false }));
  const a = (i / 12) * Math.PI * 2 + R(i) * 0.3; m.position.set(Math.cos(a) * 900, 160 + R(i * 3) * 200, Math.sin(a) * 900); m.scale.setScalar(1.0 + R(i * 5)); m.renderOrder = -5; ND(m, 'hide'); scene.add(m); clouds.push(m);
}

// ---------- ships ----------
const deckMat = toon(0xffffff, texOf(PT.planks('#b8875a', 6), [0.3, 0.3]));
const buff = toon(0xd8b070), black = toon(0x26232a), white = toon(0xf4f2ec), gunMat = toon(0x3a3c42);
const hullShape = (L, B) => { const s = new THREE.Shape(); s.moveTo(-L / 2, -B / 2 * 0.85); s.lineTo(L * 0.22, -B / 2); s.quadraticCurveTo(L * 0.45, -B * 0.42, L / 2, 0); s.quadraticCurveTo(L * 0.45, B * 0.42, L * 0.22, B / 2); s.lineTo(-L / 2, B / 2 * 0.85); s.closePath(); return s; };
const makeHull = (L, B, H, sideMat, parent) => {
  const g = new THREE.ExtrudeGeometry(hullShape(L, B), { depth: H, bevelEnabled: false, curveSegments: 8 });
  g.rotateX(-Math.PI / 2); g.translate(0, -2, 0);
  return add(g, [deckMat, sideMat], [0, 0, 0], parent);
};
const shipGroups = [];
const makeShip = (S0, idx) => {
  const g = new THREE.Group(); g.position.set(S0.x, 0, S0.z); g.scale.setScalar(S0.s); scene.add(g);
  const hm = toon(0xffffff, texOf(PT.hull('#26232a'), [1 / 10, 1 / 5]));
  makeHull(34, 7, 5, hm, g); // deck at y = 3
  const rail = toon(0xe8e4dc);
  for (const z of [-3.15, 3.15]) { tbox(26, 0.08, 0.08, rail, [-3, 4.0, z], g, 1); for (let x = -15; x <= 9; x += 2) tbox(0.06, 1.0, 0.06, rail, [x, 3.5, z], g, 1); }
  tbox(4, 2.6, 4.2, white, [9, 4.3, 0], g, 2); tbox(4.6, 0.25, 5.2, toon(0xb8875a), [9, 5.7, 0], g, 2); // bridge
  for (const x of [-5, -9]) { cyl(0.95, 0.95, 6.5, buff, [x, 6.2, 0], g, 16); cyl(0.97, 0.97, 0.9, black, [x, 9.1, 0], g, 16); }
  for (const x of [13, -14]) { cyl(0.16, 0.2, 15, toon(0x8a6a48), [x, 10.5, 0], g, 8); tbox(0.12, 0.12, 5, toon(0x8a6a48), [x, 14, 0], g, 1); }
  // sponson guns on the port side (facing the palace, -z)
  for (const slot of [0, 1, 2]) {
    const x = (slot - 1) * 7;
    const sp = cyl(0.8, 0.9, 1.0, toon(0x3a3640), [x, 2.2, -3.4], g, 14);
    const b = cyl(0.17, 0.2, 2.4, gunMat, [x, 2.2, -4.4], g, 10); b.rotation.x = Math.PI / 2;
  }
  // forward turret
  const tur = cyl(1.3, 1.4, 1.2, toon(0x5a5a62), [13.5, 3.6, 0], g, 16);
  for (const s of [-0.35, 0.35]) { const b = cyl(0.15, 0.18, 3, gunMat, [15.4, 3.8, s], g, 10); b.rotation.z = Math.PI / 2; }
  shipGroups.push(g);
  return g;
};
S.SHIPS.forEach((s, i) => makeShip(s, i));
// the sultan's royal yacht
const yacht = new THREE.Group(); yacht.position.set(...S.YACHT); scene.add(yacht);
{
  const hm = toon(0xffffff, texOf(PT.hull('#f4f2ec', '#c8a040'), [1 / 8, 1 / 4]));
  const g = new THREE.ExtrudeGeometry(hullShape(20, 4.4), { depth: 4, bevelEnabled: false, curveSegments: 8 }); g.rotateX(-Math.PI / 2); g.translate(0, -2, 0);
  add(g, [deckMat, hm], [0, 0, 0], yacht);
  tbox(5, 1.6, 2.6, white, [-1, 2.8, 0], yacht, 2); tbox(5.6, 0.2, 3.2, toon(0x8a5a3a), [-1, 3.7, 0], yacht, 2);
  cyl(0.6, 0.6, 3.5, buff, [1.5, 3.8, 0], yacht, 14); cyl(0.62, 0.62, 0.5, black, [1.5, 5.5, 0], yacht, 14);
  for (const x of [6, -6.5]) cyl(0.1, 0.13, 10, toon(0x8a6a48), [x, 7, 0], yacht, 8);
  const yf = add(new THREE.PlaneGeometry(1.4, 0.8), toon(0xffffff, clampTex(PT.flagRed()), { side: THREE.DoubleSide }), [-6.5 + 0.7, 11.4, 0], yacht, { cast: false });
}
// dhows in the harbour
const dhows = [];
for (const [x, z, r] of [[-40, 10, 0.3], [-10, 9, -0.2], [14, 12, 0.5], [34, 8, -0.4], [-52, 22, 0.1], [48, 20, 0.2]]) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = r; scene.add(g);
  const gg = new THREE.ExtrudeGeometry(hullShape(7, 2.2), { depth: 1.4, bevelEnabled: false, curveSegments: 6 }); gg.rotateX(-Math.PI / 2); gg.translate(0, -0.6, 0);
  add(gg, [toon(0xffffff, texOf(PT.planks('#9a6a40', 4))), toon(0xffffff, texOf(PT.planks('#7a4a2a', 4, false)))], [0, 0, 0], g);
  cyl(0.07, 0.09, 6, toon(0x6a4a30), [0.6, 3.6, 0], g, 6);
  const sh = new THREE.Shape(); sh.moveTo(-2.6, 1.2); sh.lineTo(2.8, 6.4); sh.lineTo(2.2, 1.2); sh.closePath();
  add(new THREE.ShapeGeometry(sh), toon(0xf2e8d0, null, { side: THREE.DoubleSide }), [0.6, 0, 0.05], g);
  dhows.push(g);
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

const fxDraw = { watch: [400, 600, (p, t, a) => C.drawWatch(p, t, a)], stamp: [500, 320, (p, t, a) => C.drawStamp(p, t, a)], bill: [360, 900, (p, t) => C.drawBill(p, t)], smoke: [400, 400, (p, t, a) => C.drawSmoke(p, t, a)], bang: [500, 500, (p, t) => C.drawBang(p, t)] };

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
  // sea, flags, boats
  seaTex.offset.set(f * 0.0012, f * 0.0025);
  const fp = flagGeo.attributes.position;
  for (let i = 0; i < fp.count; i++) { const x = flagBase[i * 3]; fp.setZ(i, 0.28 * (x / 3.2) * Math.sin(x * 2.2 - f * 0.32)); fp.setY(i, flagBase[i * 3 + 1] - 0.06 * x * (x / 3.2)); }
  fp.needsUpdate = true; flagGeo.computeVertexNormals();
  flagPole.rotation.z = (1 - ws.flag) * 1.45 + (ws.collapse > 0 ? 0.05 * ws.collapse : 0);
  dhows.forEach((g, i) => { g.position.y = 0.08 * Math.sin(f * 0.06 + i * 1.7); g.rotation.z = 0.03 * Math.sin(f * 0.05 + i); });
  shipGroups.forEach((g, i) => { if (i === 2) return; g.position.y = 0.06 * Math.sin(f * 0.04 + i * 2); g.rotation.x = 0.008 * Math.sin(f * 0.035 + i); });
  palmCrowns.forEach((c, i) => { c.rotation.z = 0.04 * Math.sin(f * 0.05 + i); c.rotation.x = 0.03 * Math.sin(f * 0.043 + i * 2); });
  // clock
  const ck = ws.clock.join(':');
  if (ck !== clockKey) { clockKey = ck; clockMat.map = clampTex(clockCache[ck] || (clockCache[ck] = PT.clockFace(ws.clock[0], ws.clock[1]))); clockMat.needsUpdate = true; }
  // collapse of the palace front
  const c = ws.collapse;
  for (const p of pieces) {
    const tt = Math.max(0, Math.min(1, (c - p.d) / 0.42)), e = tt * tt;
    const rest = S.LAND_Y + 0.3 + 0.6 * R(p.i * 7 + p.j);
    p.grp.position.set(p.x0 + (R(p.i + p.j * 5) - 0.5) * 2 * tt, p.y0 - (p.y0 - rest) * e, p.z0 + (2 + 2.5 * R(p.i * 3 + p.j)) * tt);
    p.grp.rotation.set(1.35 * e * (0.6 + 0.5 * R(p.i * 2 + p.j)), 0, (R(p.i * 9 + p.j) - 0.5) * 0.8 * tt);
    if (p.i === 2 && p.j === 2) { // balcony rides on the middle top piece
      balcony.position.set(p.grp.position.x - p.x0, p.grp.position.y - p.y0, p.grp.position.z - p.z0);
      balcony.rotation.x = p.grp.rotation.x * 0.6;
    }
  }
  core.scale.y = 1 - 0.42 * S.sstep(c); coreMat.color.setRGB(1 - 0.35 * c, 1 - 0.37 * c, 1 - 0.4 * c);
  flagPole.position.y = 12.4 * core.scale.y;
  heaps.forEach((h, i) => { const k = S.sstep((c - 0.3 - 0.05 * i) / 0.5); const s = h.userData.s; h.scale.set(Math.max(0.001, s[0] * k), Math.max(0.001, s[1] * k), Math.max(0.001, s[2] * k)); });
  // yacht
  const sk = ws.sink;
  yacht.position.y = -6.2 * Math.pow(sk, 1.3) + 0.05 * Math.sin(f * 0.07); yacht.rotation.x = 0.4 * sk; yacht.rotation.z = -0.12 * sk + 0.01 * Math.sin(f * 0.05);
  // recoil on the guns' ship
  // actors
  const seen = new Set();
  for (const a of S.actorsAt(f)) {
    seen.add(a.id);
    if (a.kind === 'fx') {
      const [cw, ch, fn] = fxDraw[a.fx];
      const cc = getCard(a.id, 'fx', cw, ch, a.size);
      const key = keyOf([a.fx, a.t, a.k ?? 0, a.seed ?? 0]);
      if (key !== cc.key) { cc.key = key; cc.g.setTransform(CARD_RES, 0, 0, CARD_RES, 0, 0); cc.g.clearRect(0, 0, cw, ch); fn(cc.pen, Math.min(1, Math.max(0, a.t)), a); cc.tex.needsUpdate = true; }
      cc.mesh.visible = true; placeCard(cc.mesh, a.pos, false, 1, a.rotZ || 0);
      continue;
    }
    const cc = getCard(a.id, a.kind);
    const key = keyOf([a.who, a.opts]);
    if (key !== cc.key) { cc.key = key; cc.g.setTransform(CARD_RES, 0, 0, CARD_RES, 0, 0); cc.g.clearRect(0, 0, 600, 1000); C.drawPerson(cc.pen, OUTFIT[a.who], a.opts); cc.tex.needsUpdate = true; }
    const flip = a.flip !== undefined ? a.flip : false;
    const hs = hashId(a.id);
    const sway = 0.022 * Math.sin(FR * 0.09 + hs) + 0.008 * Math.sin(FR * 0.23 + hs * 2);
    cc.mesh.visible = true; placeCard(cc.mesh, a.pos, flip, a.scale || 1, (a.roll || 0) + sway, 0.012 * Math.sin(FR * 0.15 + hs));
    if (cc.blob) { cc.blob.visible = !a.noBlob; cc.blob.position.set(a.pos[0], a.pos[1] + 0.03, a.pos[2]); cc.blob.scale.setScalar((a.scale || 1) * 0.9); }
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
