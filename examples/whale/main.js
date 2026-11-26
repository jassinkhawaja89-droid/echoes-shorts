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

// ---------- world: the beach at Florence, Oregon, 1970 ----------
const ground = (w, d, cv, T, pos, y, parent = scene) => {
  const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
  return add(g, toon(0xffffff, texOf(cv, [w / T, d / T])), [pos[0], y, pos[1]], parent, { cast: false });
};
// sand everywhere toward the land, the Pacific behind the whale (z < -7)
ground(3000, 1520, PT.sand(), 8, [0, 750], 0);
const seaTex = texOf(PT.sea(), [3000 / 14, 1500 / 14]);
{ const g = new THREE.PlaneGeometry(3000, 1500); g.rotateX(-Math.PI / 2); add(g, toon(0xffffff, seaTex), [0, -0.05, -757], scene, { cast: false }); }
// wet sand band + foam line
{ const g = new THREE.PlaneGeometry(3000, 5); g.rotateX(-Math.PI / 2); add(g, toon(0xc8b080), [0, 0.006, -6.5], scene, { cast: false }); }
const foam = [];
for (let i = 0; i < 3; i++) { const g = new THREE.PlaneGeometry(3000, 0.5); g.rotateX(-Math.PI / 2); const m = add(g, toon(0xf4f8fa), [0, 0.012 + i * 0.002, -8.5 - i * 6], scene, { cast: false }); foam.push(m); }
// the sperm whale, lying along x (head at +x)
const whale = new THREE.Group(); whale.position.set(...S.WHALE); scene.add(whale);
{
  const skin = toon(0x5a6478), belly = toon(0x8a92a4);
  const body = add(new THREE.SphereGeometry(1, 28, 16), skin, [-1.2, 1.35, 0], whale); body.scale.set(5.6, 1.45, 1.6);
  const head = add(new THREE.CapsuleGeometry(1.45, 3.6, 8, 20), skin, [4.2, 1.5, 0], whale); head.rotation.z = Math.PI / 2; head.scale.set(1.0, 1.0, 1.08);
  const jaw = add(new THREE.CapsuleGeometry(0.35, 3.4, 6, 12), belly, [4.4, 0.35, 0.55], whale); jaw.rotation.z = Math.PI / 2;
  const tailStock = add(new THREE.SphereGeometry(1, 16, 10), skin, [-6.6, 1.0, 0], whale); tailStock.scale.set(1.8, 0.6, 0.6);
  for (const s of [-1, 1]) { const fl = add(new THREE.SphereGeometry(1, 14, 8), skin, [-8.3, 0.35, s * 1.1], whale); fl.scale.set(1.0, 0.18, 1.4); fl.rotation.y = s * 0.5; }
  const fin = add(new THREE.SphereGeometry(1, 12, 8), skin, [0.8, 0.5, 1.6], whale); fin.scale.set(0.9, 0.2, 0.5); fin.rotation.x = -0.4;
  // eye (closed: a dark crease) and wrinkles
  const eye = add(new THREE.TorusGeometry(0.14, 0.035, 6, 12, Math.PI), toon(0x241726), [2.4, 1.05, 1.42], whale); eye.rotation.z = Math.PI;
  for (let i = 0; i < 6; i++) { const w = add(new THREE.TorusGeometry(1.5, 0.03, 4, 24, 1.2), toon(0x4a5266), [-3 + i * 0.9, 1.35, 0], whale); w.rotation.y = Math.PI / 2; w.rotation.z = 0.9; }
}
// after the blast: a pale crater patch on the back and a few strips of blubber
const crater = add(new THREE.SphereGeometry(1, 16, 8), toon(0xf2c8b0), [-0.4, 2.62, 0.3], whale, { cast: false }); crater.scale.set(1.5, 0.25, 0.9); crater.visible = false;
// dynamite crates beside the whale
const crates = [];
{ const lab = toon(0xffffff, texOf(PT.sign('DYNAMITE', '#b82a22', '#fff4d8', 1024, 200))), wood = toon(0xffffff, texOf(PT.planks('#a8783e', 3)));
  const spots = [[0, 0.22, 0], [0.62, 0.22, 0.05], [1.24, 0.22, -0.05], [0.3, 0.66, 0], [0.92, 0.66, 0], [0.6, 1.1, 0]];
  spots.forEach(([x, y, z], i) => { const g = new THREE.Group(); g.position.set(S.CRATES[0] + x, y, S.CRATES[2] + z); scene.add(g);
    tbox(0.58, 0.42, 0.42, wood, [0, 0, 0], g, 1);
    const fr = add(new THREE.PlaneGeometry(0.54, 0.105), lab, [0, 0, 0.215], g, { cast: false }); crates.push(g); }); }
// driftwood
{ const dw = toon(0xb8a284); for (const [x, z, r] of [[-6, 6, 0.4], [7, 9, -0.6], [-3, 12, 1.2], [9, 17, 0.3], [-8, 22, -0.2]]) { const l = cyl(0.14, 0.18, 2.6, dw, [x, 0.14, z], scene, 8); l.rotation.set(Math.PI / 2, 0, r); } }
// dunes with beach grass toward the land, and a parking spot with the new car
for (let i = 0; i < 14; i++) { const x = -60 + i * 9 + (R(i) - 0.5) * 4, z = 36 + R(i * 3) * 10, s = 6 + R(i * 7) * 6;
  const d = add(new THREE.SphereGeometry(1, 18, 10), toon(0xe2c896), [x, -s * 0.55, z], scene, { cast: false }); d.scale.set(s * 1.4, s, s); }
{ const gm = [toon(0x7a9a4a), toon(0x8aa858)]; const n = 220, im = new THREE.InstancedMesh(new THREE.ConeGeometry(0.12, 0.7, 4), gm[0], n), m4 = new THREE.Matrix4(), col = new THREE.Color();
  for (let i = 0; i < n; i++) { const x = -40 + R(i * 1.3) * 80, z = 30 + R(i * 2.7) * 14; m4.compose(new THREE.Vector3(x, 0.3, z), new THREE.Quaternion().setFromEuler(new THREE.Euler((R(i) - 0.5) * 0.4, 0, (R(i * 5) - 0.5) * 0.4)), new THREE.Vector3(1, 0.8 + R(i * 9), 1)); im.setMatrixAt(i, m4); im.setColorAt(i, col.setRGB(0.9 + 0.2 * R(i), 1, 0.9)); }
  im.castShadow = true; ND(im, 'world'); scene.add(im); }
// 1970 sedan
const car = new THREE.Group(); car.position.set(...S.CAR); car.rotation.y = 0.35; scene.add(car);
const carRoof = new THREE.Group(); car.add(carRoof);
{ const paint = toon(0x3a7a6a), dark = toon(0x1c1a1e), chrome = toon(0xd8dade), glass = toon(0x9ac0d0);
  tbox(1.9, 0.55, 5.0, paint, [0, 0.62, 0], car, 2);
  tbox(1.95, 0.12, 5.1, chrome, [0, 0.38, 0], car, 2);
  carRoof.position.set(0, 0.9, 0.2);
  tbox(1.7, 0.55, 2.4, glass, [0, 0.27, 0], carRoof, 2);
  tbox(1.74, 0.08, 2.2, paint, [0, 0.58, 0], carRoof, 2);
  for (const [x, z] of [[-0.85, -1.15], [0.85, -1.15], [-0.85, 1.15], [0.85, 1.15]]) tbox(0.07, 0.56, 0.08, paint, [x, 0.28, z], carRoof, 1);
  for (const s of [-1, 1]) { add(new THREE.SphereGeometry(0.13, 10, 8), toon(0xfff2c0), [s * 0.65, 0.68, -2.52], car); tbox(0.4, 0.12, 0.05, toon(0xc82a22), [s * 0.6, 0.7, 2.52], car, 0.5); }
  for (const [x, z] of [[-0.9, -1.6], [0.9, -1.6], [-0.9, 1.6], [0.9, 1.6]]) { const w = cyl(0.36, 0.36, 0.26, dark, [x, 0.36, z], car, 16); w.rotation.z = Math.PI / 2; const h = cyl(0.16, 0.16, 0.28, chrome, [x, 0.36, z], car, 10); h.rotation.z = Math.PI / 2; } }
// a second parked car and a wooden sign post far back
{ const c2 = new THREE.Group(); c2.position.set(-3, 0, 30); c2.rotation.y = -0.2; scene.add(c2); const pm = toon(0xc8a040);
  tbox(1.9, 0.55, 5.0, pm, [0, 0.62, 0], c2, 2); tbox(1.7, 0.6, 2.4, toon(0x9ac0d0), [0, 1.2, 0.2], c2, 2);
  for (const [x, z] of [[-0.9, -1.6], [0.9, -1.6], [-0.9, 1.6], [0.9, 1.6]]) { const w = cyl(0.36, 0.36, 0.26, toon(0x1c1a1e), [x, 0.36, z], c2, 16); w.rotation.z = Math.PI / 2; } }
// headland with pines on the horizon
const pineMats = [toon(0x2f6a44), toon(0x3a7a4e), toon(0x2a5e3e)], trunk = toon(0x6a4a30);
const pine = (x, z, s = 1, i = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
  cyl(0.25, 0.35, 3, trunk, [0, 1.5, 0], g, 7); for (let k = 0; k < 4; k++) add(new THREE.ConeGeometry(2.4 - k * 0.5, 2.8, 9), pineMats[(i + k) % 3], [0, 3 + k * 1.7, 0], g); };
for (let i = 0; i < 40; i++) pine(-70 + i * 3.6 + (R(i) - 0.5) * 3, 50 + R(i * 3) * 14, 1.1 + R(i * 5) * 0.8, i);
for (let i = 0; i < 10; i++) { const a = Math.PI * 0.05 + (i / 9) * Math.PI * 0.9, r = 380 + R(i * 3) * 80, s = 70 + R(i * 7) * 50;
  const h = add(new THREE.SphereGeometry(1, 20, 10), toon([0x4f7a5a, 0x5a8462, 0x46704e][i % 3]), [Math.cos(a) * r, -s * 0.06, Math.sin(a) * r * 0.6 + 120], scene, { cast: false }); h.scale.set(s, s * 0.3, s * 0.7); }
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

const fxDraw = { blub: [200, 200, (p, t, a) => C.drawBlub(p, t, a)], gull: [400, 300, (p, t, a) => C.drawGull(p, t, a)], stink: [200, 400, (p, t) => C.drawStink(p, t)], bubble: [300, 300, (p, t, a) => C.drawBubble(p, t, a)], speed: [400, 300, (p, t) => C.drawSpeed(p, t)], smoke: [400, 400, (p, t, a) => C.drawSmoke(p, t, a)], bang: [500, 500, (p, t) => C.drawBang(p, t)], stars: [420, 240, (p, t) => C.fxStars(p, t)] };

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
  foam.forEach((m, i) => { m.position.z = -8.5 - i * 6 + 0.6 * Math.sin(f * 0.04 + i * 2); });
  ws.crates.forEach((k, i) => { crates[i].visible = k > 0.01; crates[i].scale.setScalar(Math.max(0.01, k)); });
  carRoof.scale.y = 1 - 0.55 * ws.crush; carRoof.position.y = 0.9 - 0.1 * ws.crush; carRoof.rotation.z = 0.08 * ws.crush;
  crater.visible = ws.blown;
  // actors
  const seen = new Set();
  for (const a of S.actorsAt(f)) {
    seen.add(a.id);
    if (a.kind === 'fx') {
      const [cw, ch, fn] = fxDraw[a.fx];
      const cc = getCard(a.id, 'fx', cw, ch, a.size);
      const key = keyOf([a.fx, a.t, a.k ?? 0, a.seed ?? 0, a.rot ?? 0, a.icon ?? '', a.ph ?? 0, a.expr ?? '']);
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
