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

// ---------- world: San Juan Island, 1859 ----------
const ground = (w, d, cv, T, pos, y, parent = scene) => {
  const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
  return add(g, toon(0xffffff, texOf(cv, [w / T, d / T])), [pos[0], y, pos[1]], parent, { cast: false });
};
const seaTex = texOf(PT.sea(), [3000 / 14, 3000 / 14]);
{ const g = new THREE.PlaneGeometry(3000, 3000); g.rotateX(-Math.PI / 2); add(g, toon(0xffffff, seaTex), [0, -0.3, S.SHORE_Z + 1490], scene, { cast: false }); }
ground(3000, 1500, PT.grass(), 10, [0, S.SHORE_Z - 750], 0);
ground(3000, 6, PT.sand(), 6, [0, S.SHORE_Z - 2], 0.01);
// potato patch
ground(7.5, 5.5, PT.dirt(), 3, [1.5, -3.2], 0.015);
{
  const leaf = [toon(0x4f8a3e), toon(0x5f9a48)], pts = [];
  for (let z = -5.6; z <= -0.8; z += 0.8) for (let x = -2; x <= 5; x += 0.55) { if (Math.abs(x - S.PIG[0]) < 0.9 && Math.abs(z - S.PIG[2]) < 0.6) continue; pts.push([x + (R(x * 3 + z) - 0.5) * 0.15, z]); }
  const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.16, 0), leaf[0], pts.length), m4 = new THREE.Matrix4(), col = new THREE.Color();
  pts.forEach(([x, z], i) => { m4.compose(new THREE.Vector3(x, 0.1, z), new THREE.Quaternion(), new THREE.Vector3(1, 0.6 + 0.3 * R(i), 1)); im.setMatrixAt(i, m4); im.setColorAt(i, col.setRGB(0.9 + 0.2 * R(i * 2), 1, 0.9)); });
  im.castShadow = true; ND(im, 'world'); scene.add(im);
}
// fences
{
  const pm = toon(0xffffff, texOf(PT.planks('#8a6a48', 2, true)));
  const fence = (x0, z0, x1, z1) => { const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 2); for (let i = 0; i <= n; i++) cyl(0.06, 0.07, 1.2, pm, [x0 + (x1 - x0) * i / n, 0.6, z0 + (z1 - z0) * i / n], scene, 6);
    for (const y of [0.5, 1.0]) { const r = tbox(Math.hypot(x1 - x0, z1 - z0), 0.08, 0.06, pm, [(x0 + x1) / 2, y, (z0 + z1) / 2], scene, 1); r.rotation.y = -Math.atan2(z1 - z0, x1 - x0); } };
  fence(-3, -6.4, 6, -6.4); fence(6, -6.4, 6, 0.2);
}
// log cabin
{
  const g = new THREE.Group(); g.position.set(...S.CABIN); scene.add(g);
  const logs = toon(0xffffff, texOf(PT.planks('#8a5a34', 7))), roof = toon(0xffffff, texOf(PT.planks('#5a4030', 5, true)));
  tbox(6, 3, 4.5, logs, [0, 1.5, 0], g, 2);
  for (const s of [-1, 1]) { const r = tbox(6.6, 0.2, 3.0, roof, [0, 3.65, s * 1.2], g, 2); r.rotation.x = s * 0.6; }
  const gab = new THREE.Shape(); gab.moveTo(-3, 0); gab.lineTo(3, 0); gab.lineTo(0, 1.6); gab.closePath();
  for (const z of [-2.25, 2.25]) add(new THREE.ShapeGeometry(gab), logs, [0, 3, z], g).material.side = THREE.DoubleSide;
  tbox(1.1, 2.0, 0.1, toon(0x5a3a22), [0.8, 1.0, 2.27], g, 1);
  tbox(0.9, 0.8, 0.08, toon(0x2b3240), [-1.6, 1.8, 2.27], g, 1);
  tbox(0.8, 2.2, 0.8, toon(0xffffff, texOf(PT.stone('#8a8478'))), [-2.4, 3.7, -0.8], g, 1);
}
// trench mound
const mound = tbox(5.2, 0.5, 0.9, toon(0xffffff, texOf(PT.dirt())), [S.TRENCH[0], 0.25, S.TRENCH[2] + 0.9], scene, 2);
// pines
const pineMats = [toon(0x2f6a44), toon(0x3a7a4e), toon(0x2a5e3e)], trunk = toon(0x6a4a30);
const pine = (x, z, s = 1, i = 0) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
  cyl(0.25, 0.35, 3, trunk, [0, 1.5, 0], g, 7);
  for (let k = 0; k < 4; k++) add(new THREE.ConeGeometry(2.4 - k * 0.5, 2.8, 9), pineMats[(i + k) % 3], [0, 3 + k * 1.7, 0], g);
};
{
  const avoid = [[0, 0, 9], [0, 12, 7], [-5, -4, 4], [24, 6, 7], [-30, 20, 9], [-30, 12, 6], [-7.5, -10, 5]];
  let i = 0;
  for (let x = -70; x <= 70; x += 7) for (let z = -60; z <= 30; z += 7) {
    const jx = x + (R(x + z * 7) - 0.5) * 5, jz = z + (R(x * 3 - z) - 0.5) * 5;
    if (R(x * 1.7 + z * 0.3) < 0.45) continue;
    if (avoid.some(([ax, az, r]) => (jx - ax) ** 2 + (jz - az) ** 2 < r * r)) continue;
    if (jz > 8 && jz < 30 && jx > -20 && jx < 30) continue; // open meadow in front of the farm
    pine(jx, jz, 0.9 + 0.6 * R(i * 3), i++);
  }
}
for (let i = 0; i < 16; i++) {
  const a = Math.PI + (i / 15) * Math.PI, r = 420 + R(i * 3) * 120, s = 90 + R(i * 7) * 80;
  const h = add(new THREE.SphereGeometry(1, 20, 10), toon([0x4f7a5a, 0x5a8462, 0x46704e][i % 3]), [Math.cos(a) * r, -s * 0.06, Math.sin(a) * r * 0.6 - 100], scene, { cast: false });
  h.scale.set(s, s * (0.2 + R(i * 2) * 0.1), s * 0.7);
}
const clouds = [];
for (let i = 0; i < 12; i++) {
  const t = texOf(PT.cloud(i + 1)); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(200, 100), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.4, fog: false, depthWrite: false }));
  const a = (i / 12) * Math.PI * 2 + R(i) * 0.3; m.position.set(Math.cos(a) * 900, 160 + R(i * 3) * 200, Math.sin(a) * 900); m.scale.setScalar(1.0 + R(i * 5)); m.renderOrder = -5; ND(m, 'hide'); scene.add(m); clouds.push(m);
}
// ---------- British warships ----------
const deckMat = toon(0xffffff, texOf(PT.planks('#b8875a', 6), [0.3, 0.3]));
const buff = toon(0xd8b070), black = toon(0x26232a), white = toon(0xf4f2ec), gunMat = toon(0x3a3c42);
const hullShape = (L, B) => { const s = new THREE.Shape(); s.moveTo(-L / 2, -B / 2 * 0.85); s.lineTo(L * 0.22, -B / 2); s.quadraticCurveTo(L * 0.45, -B * 0.42, L / 2, 0); s.quadraticCurveTo(L * 0.45, B * 0.42, L * 0.22, B / 2); s.lineTo(-L / 2, B / 2 * 0.85); s.closePath(); return s; };
const shipGroups = [], barrels = [];
S.SHIPS.forEach((S0) => {
  const g = new THREE.Group(); g.position.set(S0.x, -0.3, S0.z); g.scale.setScalar(S0.s); scene.add(g);
  const hm = toon(0xffffff, texOf(PT.hull('#26232a'), [1 / 10, 1 / 5]));
  const geo = new THREE.ExtrudeGeometry(hullShape(34, 7), { depth: 5, bevelEnabled: false, curveSegments: 8 }); geo.rotateX(-Math.PI / 2); geo.translate(0, -2, 0);
  add(geo, [deckMat, hm], [0, 0, 0], g);
  for (const x of [-4, -8]) { cyl(0.9, 0.9, 6, buff, [x, 6, 0], g, 16); cyl(0.92, 0.92, 0.8, black, [x, 8.7, 0], g, 16); }
  for (const x of [11, -14]) { cyl(0.16, 0.2, 16, toon(0x8a6a48), [x, 11, 0], g, 8); for (const y of [12, 15]) tbox(0.12, 0.12, 6 - (y - 12), toon(0x8a6a48), [x, y, 0], g, 1); }
  tbox(4, 2.4, 4.2, white, [6, 4.2, 0], g, 2);
  for (let k = -3; k <= 3; k++) {
    const x = k * 3.6;
    tbox(0.7, 0.6, 0.1, black, [x, 2.0, -3.3], g, 1);
    const b = cyl(0.16, 0.19, 1.8, gunMat, [x, 2.0, -3.9], g, 10); b.rotation.x = Math.PI / 2; barrels.push(b);
  }
  // red ensign at the stern
  const fl = add(new THREE.PlaneGeometry(2.4, 1.4), toon(0xc8202a, null, { side: THREE.DoubleSide }), [-16.4, 6.5, 0], g, { cast: false });
  shipGroups.push(g);
});
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

const fxDraw = { smoke: [400, 400, (p, t, a) => C.drawSmoke(p, t, a)], bang: [500, 500, (p, t) => C.drawBang(p, t)], stars: [420, 240, (p, t) => C.fxStars(p, t)], flag: [480, 300, (p, t, a) => C.drawFlag(p, t, a)], leaf: [200, 200, (p, t, a) => C.drawLeaf(p, t, a)], drop: [200, 200, (p) => C.drawDrop(p)] };

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
  seaTex.offset.set(f * 0.0012, f * 0.0025);
  shipGroups.forEach((g, i) => { g.rotation.y = -Math.PI / 2 * (1 - ws.shipTurn) * (i === 1 ? 1 : 0.8); g.position.y = -0.3 + 0.06 * Math.sin(f * 0.04 + i * 2); });
  for (const b of barrels) b.rotation.x = Math.PI / 2 + 0.35 * ws.gunUp;
  mound.scale.y = 0.3 + 0.7 * ws.dirt; mound.position.y = 0.25 * mound.scale.y;
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
