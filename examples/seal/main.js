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

// ---------- world: Maine shore (origin), bathroom (BA), Boston aquarium pool (AQ) ----------
const ground = (w, d, cv, T, pos, y, parent = scene) => {
  const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
  return add(g, toon(0xffffff, texOf(cv, [w / T, d / T])), [pos[0], y, pos[1]], parent, { cast: false });
};
const pcv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d')); return c; };
const tilesCv = (base = '#e8f0f2', line = '#9ab0b8', n = 8) => pcv(256, 256, (g) => { g.fillStyle = base; g.fillRect(0, 0, 256, 256); g.strokeStyle = line; g.lineWidth = 4; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * 256 / n, 0); g.lineTo(i * 256 / n, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 256 / n); g.lineTo(256, i * 256 / n); g.stroke(); } });
const concreteCv = (col = '#c8c4bc') => pcv(256, 256, (g) => { g.fillStyle = col; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(60,50,40,${0.04 + 0.05 * R(i)})`; g.fillRect(R(i * 3) * 256, R(i * 7) * 256, 3, 3); } g.fillStyle = 'rgba(60,50,40,.25)'; g.fillRect(0, 0, 256, 3); g.fillRect(0, 0, 3, 256); });
// ground: sand/grass everywhere, sea beyond z < -7 (Maine) and around the aquarium
ground(3000, 3000, PT.grass(), 6, [0, 0], -0.02);
const seaTex = texOf(PT.sea(), [3000 / 14, 1500 / 14]);
{ const g = new THREE.PlaneGeometry(3000, 1500); g.rotateX(-Math.PI / 2); add(g, toon(0xffffff, seaTex), [0, 0.0, -757], scene, { cast: false }); }
ground(60, 14, PT.sand(), 6, [0, 0], 0.005); // beach strip
const foam = [];
for (let i = 0; i < 2; i++) { const g = new THREE.PlaneGeometry(400, 0.4); g.rotateX(-Math.PI / 2); foam.push(add(g, toon(0xf4f8fa), [0, 0.012 + i * 0.002, -7.4 - i * 5], scene, { cast: false })); }
// Maine: granite rocks at the waterline, a fisherman's shack, lobster buoys, a pond with a sign
const granite = toon(0xffffff, texOf(PT.stone('#9a948a'), [1, 1]));
for (const [x, z, s] of [[0.2, -3.6, 1.0], [-1.6, -4.4, 1.3], [1.9, -4.8, 1.1], [-3.5, -5.2, 1.6], [3.8, -5.6, 1.4], [-0.9, -6.4, 0.9], [5.5, -4.2, 0.9]]) {
  const r = add(new THREE.DodecahedronGeometry(s, 0), granite, [x, s * 0.35, z]); r.scale.set(1.3, 0.6, 1); r.rotation.y = x; }
const shack = new THREE.Group(); shack.position.set(-6.5, 0, -0.5); shack.rotation.y = 0.45; scene.add(shack);
{ const wb = toon(0xffffff, texOf(PT.weatherboard('#d8d0c0'))), roof = toon(0x5a5450);
  tbox(4, 2.6, 3.2, wb, [0, 1.3, 0], shack, 2);
  const rf = add(new THREE.CylinderGeometry(0.01, 2.9, 1.4, 4, 1), roof, [0, 3.3, 0], shack); rf.rotation.y = Math.PI / 4; rf.scale.set(1.0, 1, 0.8);
  tbox(0.9, 1.7, 0.08, toon(0x3a5a7a), [0.6, 0.85, 1.62], shack, 1);
  tbox(0.8, 0.7, 0.06, toon(0x9ac0d0), [-1.0, 1.6, 1.62], shack, 1);
  for (const [x, y, c] of [[-1.7, 1.2, 0xe84a3a], [-1.7, 0.7, 0xf2c230], [-1.9, 1.0, 0x4a9ad0]]) { const b = add(new THREE.SphereGeometry(0.17, 12, 8), toon(c), [x, y, 1.75], shack); b.scale.set(1, 1.5, 1); } }
// lobster traps on the dock-ish grass
for (const [x, z] of [[-3.6, 1.6], [-3.0, 2.1]]) tbox(0.8, 0.45, 0.55, toon(0xffffff, texOf(PT.lattice('#8a6a40'))), [x, 0.23, z], scene, 0.6);
// the pond behind the house (POND)
const POND_P = S.POND;
{ const g = new THREE.CircleGeometry(2.6, 32); g.rotateX(-Math.PI / 2); const pondTex = texOf(PT.sea(), [2, 2]); add(g, toon(0x9ad0e0, pondTex), [POND_P[0], 0.03, POND_P[2]], scene, { cast: false });
  for (let i = 0; i < 18; i++) { const a = (i / 18) * 6.283, r = add(new THREE.SphereGeometry(0.3, 8, 6), granite, [POND_P[0] + Math.cos(a) * 2.7, 0.05, POND_P[2] + Math.sin(a) * 2.7]); r.scale.set(1, 0.5, 1); } }
// "HOOVER" sign that pops up next to the pond
const hsign = new THREE.Group(); hsign.position.set(...S.SIGN); scene.add(hsign);
{ tbox(0.1, 1.1, 0.1, toon(0x8a6a40), [0, 0.55, 0], hsign, 1); const lab = toon(0xffffff, texOf(PT.sign('HOOVER', '#f4e8c8', '#3a2a1e', 768, 240)));
  const b = tbox(1.3, 0.42, 0.06, toon(0x8a6a40), [0, 1.15, 0], hsign, 1); add(new THREE.PlaneGeometry(1.24, 0.38), lab, [0, 1.15, 0.035], hsign, { cast: false }); }
// fish bucket next to the pond
const bucket = cyl(0.26, 0.2, 0.42, toon(0xb8c0c8), [POND_P[0] + 0.2, 0.21, POND_P[2] + 2.55]);
// pines and hills (Maine)
const pineMats = [toon(0x2f6a44), toon(0x3a7a4e), toon(0x2a5e3e)], trunk = toon(0x6a4a30);
const pine = (x, z, s = 1, i = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
  cyl(0.25, 0.35, 3, trunk, [0, 1.5, 0], g, 7); for (let k = 0; k < 4; k++) add(new THREE.ConeGeometry(2.4 - k * 0.5, 2.8, 9), pineMats[(i + k) % 3], [0, 3 + k * 1.7, 0], g); };
for (let i = 0; i < 26; i++) pine(-40 + i * 3.2 + (R(i) - 0.5) * 3, 16 + R(i * 3) * 12, 1.1 + R(i * 5) * 0.8, i);
for (let i = 0; i < 8; i++) pine(-14 - R(i) * 8, -2 + i * 2.2, 1 + R(i * 2) * 0.5, i);
// a far headland with a lighthouse across the water
{ const h = add(new THREE.SphereGeometry(1, 20, 10), toon(0x4f7a5a), [-60, -6, -120], scene, { cast: false }); h.scale.set(60, 16, 20);
  cyl(1.2, 1.6, 9, toon(0xf4f0e8), [-48, 12, -116]); cyl(1.0, 1.0, 1.6, toon(0xc8302a), [-48, 17.2, -116]); }
// ---- bathroom at BA ----
const BA = S.BA;
{ const tile = toon(0xffffff, texOf(tilesCv('#dcecf0', '#8aaab4', 8))), floor = toon(0xffffff, texOf(tilesCv('#e8e0d0', '#a89878', 4), [3, 3]));
  tbox(10, 0.1, 10, floor, [BA[0], -0.04, BA[2]], scene, 2);
  tbox(10, 3.6, 0.2, tile, [BA[0], 1.8, BA[2] - 2.2], scene, 1.5);
  tbox(0.2, 3.6, 10, tile, [BA[0] - 2.6, 1.8, BA[2] + 2.8], scene, 1.5);
  tbox(0.2, 3.6, 10, tile, [BA[0] + 3.4, 1.8, BA[2] + 2.8], scene, 1.5);
  tbox(10, 0.2, 10, toon(0xf4f0e8), [BA[0], 3.6, BA[2] + 2.8], scene, 2);
  // bathtub along the back wall: hollow box + water surface
  const tw = toon(0xf8f8f4), foot = toon(0xd8b84a);
  const tx = BA[0] + 0.2, tz = BA[2] - 1.4;
  tbox(2.0, 0.62, 0.08, tw, [tx, 0.36, tz + 0.46], scene, 1); tbox(2.0, 0.62, 0.08, tw, [tx, 0.36, tz - 0.46], scene, 1);
  tbox(0.08, 0.62, 1.0, tw, [tx - 1.0, 0.36, tz], scene, 1); tbox(0.08, 0.62, 1.0, tw, [tx + 1.0, 0.36, tz], scene, 1);
  tbox(2.0, 0.08, 1.0, tw, [tx, 0.08, tz], scene, 1);
  for (const [x, z] of [[-0.85, 0.4], [0.85, 0.4], [-0.85, -0.4], [0.85, -0.4]]) add(new THREE.SphereGeometry(0.07, 8, 6), foot, [tx + x, 0.04, tz + z]);
  const wg = new THREE.PlaneGeometry(1.92, 0.92); wg.rotateX(-Math.PI / 2); add(wg, toon(0x8ad0e8), [tx, 0.52, tz], scene, { cast: false });
  cyl(0.03, 0.03, 0.4, toon(0xc8ccd0), [tx + 0.8, 0.85, tz - 0.4]); // tap
  // towel rail + towel and a small window
  tbox(0.7, 0.9, 0.04, toon(0xe86a7a), [BA[0] + 2.2, 1.4, BA[2] - 2.08], scene, 1);
  tbox(0.9, 0.7, 0.04, toon(0x9ac0d0), [BA[0] - 1.2, 2.3, BA[2] - 2.08], scene, 1);
}
// ---- aquarium pool at AQ (outdoor, in front of the building, harbour around) ----
const AQ = S.AQ;
const poolWater = { tex: texOf(PT.sea(), [3, 2]) };
{ const conc = toon(0xffffff, texOf(concreteCv('#d0ccc4'), [1, 1])), tile = toon(0xffffff, texOf(tilesCv('#5ab0d0', '#3a8ab0', 6)));
  tbox(40, 0.1, 30, conc, [AQ[0], 0.0, AQ[2] + 4], scene, 2); // plaza
  // pool rim walls (0.6 high), pool 9 x 6
  for (const [x, z, w, d] of [[0, 3.0, 9.3, 0.3], [0, -3.0, 9.3, 0.3], [-4.5, 0, 0.3, 6], [4.5, 0, 0.3, 6]]) tbox(w, 0.6, d, conc, [AQ[0] + x, 0.3, AQ[2] + z], scene, 1);
  const wg = new THREE.PlaneGeometry(8.7, 5.7); wg.rotateX(-Math.PI / 2); add(wg, toon(0x6ac0e0, poolWater.tex), [AQ[0], 0.42, AQ[2]], scene, { cast: false });
  // rock island in the pool
  const rk = add(new THREE.DodecahedronGeometry(1.1, 0), granite, [AQ[0] + 0.6, 0.55, AQ[2] - 0.8]); rk.scale.set(1.5, 0.55, 1.0);
  const rk2 = add(new THREE.DodecahedronGeometry(0.7, 0), granite, [AQ[0] - 1.8, 0.45, AQ[2] - 1.6]); rk2.scale.set(1.3, 0.6, 1);
  // aquarium building behind: concrete block with a sign, harbour water to the sides
  const fac = toon(0xffffff, texOf(concreteCv('#b8b4ac'), [1, 1]));
  tbox(30, 9, 6, fac, [AQ[0], 4.5, AQ[2] - 10], scene, 3);
  tbox(14, 1.6, 0.1, toon(0x1e3a5a), [AQ[0], 7.2, AQ[2] - 6.95], scene, 2);
  add(new THREE.PlaneGeometry(13.6, 1.4), toon(0xffffff, texOf(PT.sign('AQUARIUM', '#1e3a5a', '#ffffff', 1024, 120))), [AQ[0], 7.2, AQ[2] - 6.88], scene, { cast: false });
  for (let i = 0; i < 6; i++) tbox(2.2, 2.6, 0.1, toon(0x6a9ab0), [AQ[0] - 11 + i * 4.4, 2.0, AQ[2] - 6.95], scene, 1);
  const rail = toon(0x2a4a6a);
  // lamp posts and benches on the plaza
  for (const x of [-7, 7]) { cyl(0.06, 0.08, 3.4, rail, [AQ[0] + x, 1.7, AQ[2] + 5.5]); add(new THREE.SphereGeometry(0.25, 12, 8), toon(0xfff2c0, null, { emissive: 0x6a5a20 }), [AQ[0] + x, 3.5, AQ[2] + 5.5]); }
}
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

const fxDraw = { seal: [400, 300, (p, t, a) => C.drawSeal(p, t, a)], speech: [600, 400, (p, t, a) => C.drawSpeech(p, t, a)], fish: [200, 200, (p, t, a) => C.drawFish(p, t, a)], drop: [120, 120, (p) => C.drawDrop(p)], splash: [800, 800, (p, t) => C.drawSplash(p, t)], bubble: [300, 300, (p, t, a) => C.drawBubble(p, t, a)], speed: [400, 300, (p, t) => C.drawSpeed(p, t)], stars: [420, 240, (p, t) => C.fxStars(p, t)], heart: [200, 200, (p) => C.drawHeart(p)], puff: [300, 300, (p, t) => C.fxPuff(p, t)] };

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
  seaTex.offset.set(f * 0.0008, f * 0.0018);
  poolWater.tex.offset.set(f * 0.002, f * 0.001);
  foam.forEach((m, i) => { m.position.z = -7.4 - i * 5 + 0.5 * Math.sin(f * 0.04 + i * 2); });
  hsign.scale.setScalar(Math.max(0.001, ws.sign)); hsign.visible = ws.sign > 0.01;
  bucket.rotation.z = ws.bucketTip;
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
