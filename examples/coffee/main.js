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

// ---------- world: a papal hall in Rome (around 1600) and a Venice quay ----------
const ground = (w, d, cv, T, pos, y, parent = scene) => {
  const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
  return add(g, toon(0xffffff, texOf(cv, [w / T, d / T])), [pos[0], y, pos[1]], parent, { cast: false });
};
const marble = () => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#c8b8a0' : '#f0e8da'; g.fillRect(x * 128, y * 128, 128, 128); }
  g.strokeStyle = 'rgba(120,100,80,.35)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(R(i) * 256, 0); g.bezierCurveTo(R(i + 3) * 256, 90, R(i + 5) * 256, 170, R(i + 7) * 256, 256); g.stroke(); }
  g.strokeStyle = '#8a7a64'; g.lineWidth = 3; g.strokeRect(0, 0, 256, 256); g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke(); return c; };
const wallTex = () => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#e8d4a8'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#d8c090'; for (let x = 0; x < 256; x += 64) g.fillRect(x + 8, 40, 48, 150);
  g.strokeStyle = '#b89a62'; g.lineWidth = 4; for (let x = 0; x < 256; x += 64) g.strokeRect(x + 8, 40, 48, 150);
  g.fillStyle = '#8a3a2a'; g.fillRect(0, 214, 256, 42); g.fillStyle = '#c8a050'; g.fillRect(0, 208, 256, 8); g.fillRect(0, 20, 256, 8); return c; };
ground(3000, 3000, PT.grass(), 10, [0, 0], -0.02);
// hall
{ const H = S.HALL;
  ground(12, 10, marble(), 1.6, [H[0], H[2] + 0.5], 0.004);
  const wm = toon(0xffffff, texOf(wallTex(), [3, 1]));
  tbox(12, 6, 0.3, wm, [H[0], 3, H[2] - 4.3], scene, 4);
  for (const s of [-1, 1]) { const w = tbox(0.3, 6, 10, wm, [H[0] + s * 6, 3, H[2] + 0.5], scene, 4); }
  tbox(12.6, 0.4, 10.6, toon(0xc8a050), [H[0], 6.1, H[2] + 0.5], scene, 2);
  const gold = toon(0xd8b050), velvet = toon(0xa8202a), red = toon(0xb82a2a);
  // columns
  for (const x of [-4.2, -2.4, 2.4, 4.2]) { cyl(0.28, 0.32, 5.4, toon(0xf0e6d2), [x, 2.7, -3.8], scene, 16); tbox(0.8, 0.25, 0.8, gold, [x, 5.5, -3.8], scene, 1); tbox(0.8, 0.25, 0.8, gold, [x, 0.12, -3.8], scene, 1); }
  // red curtains behind the throne
  for (const s of [-1, 1]) { const c = tbox(1.2, 5.2, 0.15, red, [s * 1.3, 2.9, -4.05], scene, 1); }
  tbox(3.8, 0.6, 0.2, gold, [0, 5.5, -4.0], scene, 1);
  // throne
  { const T = S.THRONE; tbox(1.3, 0.12, 0.9, gold, [T[0], 0.06, T[2]], scene, 1);
    tbox(1.1, 0.5, 0.8, gold, [T[0], 0.37, T[2]], scene, 1); tbox(1.0, 0.12, 0.7, velvet, [T[0], 0.66, T[2]], scene, 1);
    tbox(1.1, 1.9, 0.18, gold, [T[0], 1.35, T[2] - 0.38], scene, 1); tbox(0.86, 1.6, 0.06, velvet, [T[0], 1.4, T[2] - 0.27], scene, 1);
    for (const s of [-1, 1]) { tbox(0.14, 0.4, 0.8, gold, [T[0] + s * 0.55, 0.82, T[2]], scene, 1); add(new THREE.SphereGeometry(0.11, 10, 8), gold, [T[0] + s * 0.5, 2.38, T[2] - 0.38]); } }
  // carpet runner
  ground(1.6, 6, PT.carpet(), 1.6, [H[0], H[2] + 1.6], 0.01);
  // little table with a white cloth
  { const T = S.TABLE; cyl(0.32, 0.32, 0.05, toon(0x8a5a34), [T[0], 0.92, T[2]], scene, 20); cyl(0.34, 0.36, 0.2, toon(0xf4f0e8), [T[0], 0.84, T[2]], scene, 20);
    cyl(0.05, 0.08, 0.86, toon(0x8a5a34), [T[0], 0.43, T[2]], scene, 10); cyl(0.25, 0.25, 0.04, toon(0x8a5a34), [T[0], 0.02, T[2]], scene, 14); }
  // windows with sky light + candle stands
  for (const z of [-1.5, 1.5]) { tbox(0.06, 1.8, 1.0, toon(0xbfe0f4, null, { emissive: 0x6a8aa0 }), [H[0] - 5.84, 3.2, z], scene, 1); tbox(0.08, 2.0, 0.12, gold, [H[0] - 5.82, 3.2, z - 0.56], scene, 1); tbox(0.08, 2.0, 0.12, gold, [H[0] - 5.82, 3.2, z + 0.56], scene, 1); }
  for (const x of [-2.9, 3.0]) { cyl(0.04, 0.06, 1.8, gold, [x, 0.9, -3.0], scene, 8); cyl(0.05, 0.05, 0.2, toon(0xf4f0e0), [x, 1.9, -3.0], scene, 8);
    add(new THREE.ConeGeometry(0.05, 0.14, 7), new THREE.MeshBasicMaterial({ color: 0xffc040 }), [x, 2.07, -3.0], scene, { cast: false }); }
}
// Venice quay (x = 60): water channel, stone quay, coloured palazzi, a boat with sacks
{ const V = S.VEN;
  ground(30, 14, PT.stone('#a8a090'), 1.6, [V[0], V[2] + 4], 0.01);
  const wt = texOf(PT.sea(), [6, 3]); window.__veniceWater = wt;
  { const g = new THREE.PlaneGeometry(40, 20); g.rotateX(-Math.PI / 2); add(g, toon(0xffffff, wt), [V[0], -0.6, V[2] - 13], scene, { cast: false }); }
  tbox(30, 0.62, 0.4, toon(0xffffff, texOf(PT.stone('#9a9282'))), [V[0], -0.3, V[2] - 3.2], scene, 1);
  const cols = ['#e8a070', '#f0d080', '#d87a6a', '#e8dcc4', '#a8c0a0', '#f0b8a0'];
  for (let i = 0; i < 6; i++) { const h = 7 + R(i * 3) * 4; const b = tbox(4.6, h, 3, toon(0xffffff, texOf(PT.facade(cols[i]))), [V[0] - 13 + i * 5, h / 2, V[2] - 22], scene, 4);
    tbox(4.9, 0.4, 3.3, toon(0x8a4a30), [V[0] - 13 + i * 5, h + 0.2, V[2] - 22], scene, 1); }
  for (let i = 0; i < 4; i++) { const h = 8 + R(i * 5) * 3; tbox(4.6, h, 3, toon(0xffffff, texOf(PT.facade(cols[(i + 2) % 6]))), [V[0] - 18 + i * 5, h / 2, V[2] + 12], scene, 4); }
  // boat moored at the quay
  const boat = new THREE.Group(); boat.position.set(V[0] + 0.5, -0.45, V[2] - 4.6); scene.add(boat);
  tbox(5.2, 0.6, 1.6, toon(0xffffff, texOf(PT.planks('#6a4a30', 4))), [0, 0, 0], boat, 1.5);
  for (const s of [-1, 1]) { const e = add(new THREE.ConeGeometry(0.8, 1.2, 4), toon(0x5a3a24), [s * 3.0, 0.1, 0], boat); e.rotation.z = -s * Math.PI / 2; e.scale.set(1, 1, 0.9); }
  for (let i = 0; i < 4; i++) { const sk = add(new THREE.SphereGeometry(0.35, 10, 8), toon(0xc8a46a), [-1.6 + i * 0.9, 0.55, (i % 2 - 0.5) * 0.5], boat); sk.scale.set(1, 0.8, 0.9); }
  cyl(0.06, 0.08, 4.5, toon(0x6a4a30), [0.6, 2.5, 0], boat, 8);
  for (const x of [-8, -3.5, 4, 9]) { cyl(0.12, 0.14, 2.6, toon(0x2a4a8a), [V[0] + x, 0.4, V[2] - 3.9], scene, 8); cyl(0.15, 0.15, 0.2, toon(0xf0e0b0), [V[0] + x, 1.75, V[2] - 3.9], scene, 8); }
  // a bell tower far back
  tbox(3, 22, 3, toon(0xffffff, texOf(PT.brick('#a84a3a'))), [V[0] + 10, 11, V[2] - 40], scene, 3);
  add(new THREE.ConeGeometry(2.4, 5, 4), toon(0x5a7a6a), [V[0] + 10, 24.5, V[2] - 40]).rotation.y = Math.PI / 4;
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

const fxDraw = { cup: [300, 300, (p, t, a) => C.drawCup(p, t, a)], sack: [200, 200, (p) => C.drawSack(p)], sparkle: [300, 300, (p, t) => C.drawSparkle(p, t)], stars: [420, 240, (p, t) => C.fxStars(p, t)] };

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
  window.__veniceWater.offset.set(f * 0.0008, f * 0.0016);
  // actors
  const seen = new Set();
  for (const a of S.actorsAt(f)) {
    seen.add(a.id);
    if (a.kind === 'fx') {
      const [cw, ch, fn] = fxDraw[a.fx];
      const cc = getCard(a.id, 'fx', cw, ch, a.size);
      const key = keyOf([a.fx, a.t, a.k ?? 0, a.seed ?? 0, a.rot ?? 0, a.icon ?? '', a.ph ?? 0, a.expr ?? '', a.horns ?? 0, a.halo ?? 0]);
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
