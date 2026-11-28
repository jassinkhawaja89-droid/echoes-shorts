// "The Girl Who Was Mailed" (Grangeville -> Lewiston, Idaho, 1914) — pure functions of the frame number (30 fps).
export const FPS = 30, N = 843;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const sstep = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const easeOut = (t) => 1 - (1 - clamp(t)) ** 3;
export const easeIn = (t) => clamp(t) ** 2;
export const back = (t, s = 1.7) => { t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1; };
const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const R = (s) => { const x = Math.sin(s * 127.1 + 1.3) * 43758.5453; return x - Math.floor(x); };
export const idle = (f, seed) => Math.sin(f * 0.11 + seed * 2.1) * 0.5 + Math.sin(f * 0.047 + seed) * 0.5;
export const blinkAt = (f, seed, every = 70) => { const p = (f + Math.floor(R(seed) * every)) % (every + Math.floor(R(seed + 1) * 25)); return p < 4 ? 1 : 0; };

// ---------- layout ----------
export const PO = [-120, 0, 0], GH = [120, 0, 0], RZ = -60, LEWX = 300;
const SCALE_TOP = [PO[0] - 1.1, 0.16, PO[2] - 0.5];

// ---------- shots ----------
export const SHOTS = [
  { id: 'hook', a: 0, b: 136, light: 'day' },
  { id: 'home', a: 136, b: 258, light: 'day' },
  { id: 'rule', a: 258, b: 388, light: 'indoor' },
  { id: 'weigh', a: 388, b: 522, light: 'indoor' },
  { id: 'stamps', a: 522, b: 620, light: 'indoor' },
  { id: 'train', a: 620, b: 705, light: 'day' },
  { id: 'door', a: 705, b: 843, light: 'gold' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1];
export const MAIL = 98, TICKET = 205, NORULE = 330, HOP = 398, LIMIT = 482, PRICE = 530, KNOCK = 758, OPEN = 784, BUTTON_F = 810;
export const STAMP_T = [566, 572, 578, 584, 590, 596, 602];
export const FLASH = [[136, 5], [258, 6], [620, 6], [705, 6]];
export const flashAt = (f) => { let v = 0; for (const [a, d] of FLASH) { const t = (f - a + d / 2) / d; if (t >= 0 && t <= 1) v = Math.max(v, Math.sin(t * Math.PI) * 0.8); } return v; };
export const KICKS = [[MAIL, 0.6], [HOP + 6, 0.5], [LIMIT, 0.5], [KNOCK, 0.3], [BUTTON_F, 0.6]];
const kickAt = (f) => { let k = 0; for (const [a, s] of KICKS) { const d = f - a; if (d >= 0 && d < 7) k += s * (d % 2 ? -1 : 1) * (1 - d / 7); } return k; };
const trainX = (f) => -14 + (f - 620) * 0.22; // mail car centre x during the train shot (~6.6 m/s)
export const worldAt = (f) => ({
  shot: shotAt(f).id,
  trainX: shotAt(f).id === 'train' ? trainX(f) : -14,
  door: f < OPEN ? 0 : easeOut((f - OPEN) / 10),
});
// dial reading: swings past and settles on 48.5
const weightAt = (f) => { if (f < HOP + 4) return 0; const t = (f - HOP - 4) / 30; return q1(48.5 + (0 - 48.5) * Math.exp(-4 * t) * Math.cos(9 * t)); };

// ---------- cameras ----------
const C = (pos, look, fov = 40, roll = 0) => ({ pos, look, fov, roll });
const glide = (a, b, t) => C(L3(a.pos, b.pos, t), L3(a.look, b.look, t), lerp(a.fov, b.fov, t), lerp(a.roll, b.roll, t));
const creep = (c, k) => { const d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]]; return { ...c, pos: [c.pos[0] + d[0] * k, c.pos[1] + d[1] * k, c.pos[2] + d[2] * k] }; };
const drift = (c, f, k = 1) => ({ ...c, pos: [c.pos[0] + 0.012 * k * Math.sin(f * 0.07), c.pos[1] + 0.008 * k * Math.sin(f * 0.11 + 1), c.pos[2]], roll: c.roll + 0.35 * k * Math.sin(f * 0.05 + 2) });
const P0 = (x, y, z) => [PO[0] + x, y, PO[2] + z];
const G0 = (x, y, z) => [GH[0] + x, y, GH[2] + z];

export const camAt = (f) => {
  const s = shotAt(f), t = (f - s.a) / (s.b - s.a);
  let c;
  switch (s.id) {
    case 'hook': c = glide(C([6.6, 3.0, 9.5], [6.3, 1.9, -2.0], 46, -1), C([6.0, 1.4, 3.9], [5.95, 1.05, 0.2], 42, 1), sstep((f - 4) / 80)); break;
    case 'home': c = glide(C([-2.1, 1.9, 7.4], [-2.2, 1.3, 0.2], 44, -1), C([-2.2, 1.7, 6.2], [-2.3, 1.25, 0.3], 42, 1), sstep(t)); break;
    case 'rule': c = glide(C(P0(0.5, 2.0, 6.2), P0(0.55, 1.5, -0.8), 46, 0), C(P0(0.6, 1.9, 5.3), P0(0.6, 1.5, -1.0), 46, 1), sstep(t)); break;
    case 'weigh': { c = glide(C(P0(-0.6, 1.6, 3.6), P0(-1.0, 1.15, -0.6), 44, -1), C(P0(-1.0, 1.75, 2.4), P0(-1.08, 1.6, -0.8), 40, 1), sstep((f - 440) / 60)); break; }
    case 'stamps': c = creep(C(P0(-0.95, 1.5, 2.5), P0(-1.0, 1.28, -0.5), 42, -1), 0.1 * sstep(t)); c.roll += 2 * t; break;
    case 'train': { const x = trainX(f); c = C([x + 1.5 - 1.5 * t, 2.5, RZ + 8.2], [x + 0.2, 2.1, RZ + 1.2], 46, -1 + 2 * t); break; }
    case 'door': {
      c = glide(C(G0(0.4, 1.7, 8.5), G0(0.05, 1.2, 1.5), 44, -1), C(G0(0.3, 1.5, 5.6), G0(0.0, 1.15, 0.8), 44, 1), sstep((f - 712) / 90));
      if (f >= BUTTON_F) c = creep(c, 0.06 * easeOut((f - BUTTON_F) / 10));
      c.roll += f >= BUTTON_F ? 2 * easeOut((f - BUTTON_F) / 10) : 0; break; }
  }
  c = drift(c, f);
  const k = kickAt(f);
  if (k) c = { ...c, roll: c.roll + 1.3 * k, look: [c.look[0], c.look[1] + 0.03 * k, c.look[2]] };
  return c;
};
export const dofAt = (f) => {
  const s = shotAt(f).id, cam = camAt(f);
  const dist = (p) => Math.hypot(p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]);
  switch (s) {
    case 'hook': return [f > 70 ? 7 : 0, dist([5.6, 1.1, 0.3])];
    case 'weigh': return [5, dist(P0(-1.1, 1.3, -0.6))];
    case 'stamps': return [8, dist(P0(-1.1, 0.9, -0.5))];
    case 'door': return [5, dist(G0(0, 1.2, 1.2))];
    default: return [0, 10];
  }
};
export const focusAt = (f) => ({ hook: [5, 0, 0], home: [-2, 0, 0], rule: P0(0, 0, -0.5), weigh: P0(-1, 0, -0.5), stamps: P0(-1, 0, -0.5), train: [trainX(f), 0, RZ], door: G0(0, 0, 1) }[shotAt(f).id]);

// ---------- actors ----------
const P = (id, who, pos, opts = {}, extra = {}) => ({ id, kind: 'person', who, pos, opts, ...extra });
const FX = (id, fx, pos, t, size, extra = {}) => ({ id, kind: 'fx', fx, pos, t, size, ...extra });
const q1 = (v) => Math.round(v * 10) / 10;
const q2 = (v) => Math.round(v * 20) / 20;
const may = (f, pos, o = {}, x = {}) => P('may', 'may', pos, { mode: 'stand', expr: 'smile', seed: 7, blink: blinkAt(f, 7), headTilt: 4 * idle(f, 1), tag: 1, ...o }, x);

export const actorsAt = (f) => {
  const s = shotAt(f).id, A = [];
  const push = (x) => { if (x) A.push(x); };
  switch (s) {
    case 'hook': {
      const n = f < MAIL ? 6 : 7;
      A.push(may(f, [5.6, 0, 0.3], { stamps: n, expr: f >= MAIL ? 'grin' : 'smile', present: f > MAIL + 8 ? q1(0.5 + 0.5 * Math.sin(f * 0.3)) : undefined }));
      A.push(P('mailman', 'mailman', [6.4, 0, -0.1], { mode: 'stand', expr: f >= MAIL ? 'laugh' : 'smile', seed: 21, blink: blinkAt(f, 21), headTilt: 3 * idle(f, 4) }, { flip: true }));
      if (f >= MAIL - 8 && f < MAIL) { const k = (f - MAIL + 8) / 8; push(FX('flyst', 'stamp', L3([7.4, 2.6, 0.8], [5.6, 1.0, 0.45], easeIn(k)), 0, 0.3, { seed: 6, rotZ: 3 * (1 - k) })); }
      if (f >= MAIL && f < MAIL + 14) push(FX('pf', 'puff', [5.6, 0.95, 0.5], q1((f - MAIL) / 14), 0.6));
      break;
    }
    case 'home': {
      const tk = f >= TICKET - 6;
      A.push(P('dad', 'dad', [-3.2, 0, 0.6], { mode: 'stand', expr: tk ? 'stern' : 'neutral', seed: 31, blink: blinkAt(f, 31), headTilt: tk ? 10 * Math.sin(f * 0.35) : 3 * idle(f, 2), coin: 1 }, { flip: false }));
      A.push(P('mom', 'mom', [-1.3, 0, 0.5], { mode: 'stand', expr: tk ? 'nervous' : 'smile', seed: 33, blink: blinkAt(f, 33), headTilt: 4 * idle(f, 3), shrug: tk ? q1(0.7 + 0.3 * Math.sin(f * 0.2)) : undefined }, { flip: true }));
      A.push(may(f, [-2.25, 0, 1.0], { tag: 0, expr: 'smile' }));
      if (tk) push(FX('tick', 'ticket', [-3.05, 2.7, 0.9], q1(back(clamp((f - TICKET + 6) / 10))), 0.8));
      break;
    }
    case 'rule': {
      const nr = f >= NORULE;
      A.push(P('clerk', 'clerk', P0(1.5, 0, -1.75), { mode: 'stand', expr: nr ? 'grin' : 'neutral', seed: 41, blink: blinkAt(f, 41), headTilt: nr ? 6 * Math.sin(f * 0.2) : 3 * idle(f, 5), shrug: nr ? q1(0.6 + 0.4 * Math.sin(f * 0.25)) : undefined }, { flip: true }));
      push(FX('book', 'book', P0(0.95, 1.36, -0.8), 0, 0.5, { rotZ: 0.05 * Math.sin(f * 0.2) }));
      A.push(P('dad', 'dad', P0(-0.15, 0, 0.85), { mode: 'stand', expr: nr ? 'grin' : 'neutral', seed: 31, blink: blinkAt(f, 31), headTilt: 3 * idle(f, 2), point: nr ? q1(0.6 + 0.2 * Math.sin(f * 0.2)) : undefined }));
      A.push(may(f, P0(0.65, 0, 1.15), { tag: 0, expr: nr ? 'grin' : 'smile' }));
      if (nr && f < NORULE + 16) push(FX('st', 'stars', P0(1.4, 2.45, -1.7), q1((f - NORULE) / 16), 0.6));
      break;
    }
    case 'weigh': {
      const hop = clamp((f - HOP) / 10), y = f < HOP ? 0 : lerp(0, SCALE_TOP[1], hop) + 0.35 * Math.sin(Math.PI * hop);
      const pos = f < HOP ? P0(-0.55, 0, -0.2) : L3(P0(-0.55, 0, -0.2), [SCALE_TOP[0], 0, SCALE_TOP[2]], sstep(hop));
      A.push(may(f, [pos[0], y, pos[2]], { tag: 0, expr: f >= LIMIT ? 'relief' : f > HOP + 10 ? 'nervous' : 'grin' }));
      push(FX('dial', 'dial', P0(-1.1, 1.95, -0.95), 0, 0.62, { o: { w: weightAt(f) } }));
      A.push(P('clerk', 'clerk', P0(0.35, 0, 0.1), { mode: 'stand', expr: f >= LIMIT ? 'grin' : 'neutral', seed: 41, blink: blinkAt(f, 41), headTilt: 3 * idle(f, 5), point: f >= LIMIT ? 0.6 : undefined }, { flip: true }));
      break;
    }
    case 'stamps': {
      const n = STAMP_T.filter((t) => f >= t + 5).length;
      A.push(may(f, [SCALE_TOP[0], SCALE_TOP[1], SCALE_TOP[2]], { tag: 0, stamps: n, expr: n > 0 ? 'grin' : 'smile', headTilt: 4 * Math.sin(f * 0.2) }));
      push(FX('dial', 'dial', P0(-1.1, 1.95, -0.95), 0, 0.62, { o: { w: 48.5 } }));
      if (f >= PRICE) push(FX('price', 'price', P0(-0.72, 1.62, -0.15), q1(back(clamp((f - PRICE) / 9))), 0.42, { o: { text: '53¢' } }));
      STAMP_T.forEach((t0, i) => { if (f >= t0 && f < t0 + 5) { const k = (f - t0) / 5; push(FX('fs' + (i % 2), 'stamp', L3(P0(-0.2, 1.9, 0.4), P0(-1.1, 1.0, -0.4), easeIn(k)), 0, 0.2, { seed: i, rotZ: 2 * (1 - k) })); } });
      break;
    }
    case 'train': {
      const x = trainX(f);
      A.push(may(f, [x - 0.35, 1.05, RZ + 0.85], { tag: 1, stamps: 7, expr: 'grin', present: q1(0.5 + 0.5 * Math.sin(f * 0.35)) }));
      A.push(P('mailman', 'mailman', [x + 0.4, 1.05, RZ + 0.6], { mode: 'stand', expr: 'smile', seed: 21, blink: blinkAt(f, 21), headTilt: 3 * idle(f, 4) }, { flip: true, noBlob: true }));
      for (let i = 0; i < 4; i++) { const t = ((f - 620) / 20 + i / 4) % 1; push(FX('stm' + i, 'steam', [x + 8.4 + 2.3 - 3.5 * t, 3.9 + 1.4 * t, RZ], q1(t), 1.6 + 1.2 * t)); }
      break;
    }
    case 'door': {
      const w = sstep((f - 708) / 46), mp = L3(G0(-0.6, 0, 5.2), G0(-0.6, 0.15, 1.45), w), cp = L3(G0(0.6, 0, 5.6), G0(0.62, 0.15, 1.75), w);
      const walking = f > 708 && f < 752;
      A.push(may(f, mp, { tag: 1, stamps: 7, mode: walking ? 'march' : 'stand', phase: q2(((f - 708) / 12) % 1), expr: f >= OPEN ? 'grin' : 'smile', present: f >= BUTTON_F ? q1(0.5 + 0.5 * Math.sin(f * 0.4)) : undefined }));
      A.push(P('mailman', 'mailman', cp, { mode: walking ? 'march' : 'stand', phase: q2(((f - 708) / 14) % 1), expr: 'smile', seed: 21, blink: blinkAt(f, 21), headTilt: 3 * idle(f, 4), point: f >= KNOCK && f < OPEN ? q1(0.5 + 0.5 * Math.sin((f - KNOCK) * 0.9)) : undefined }, { flip: true }));
      if (f >= OPEN + 2) { const k = sstep((f - OPEN - 2) / 14); A.push(P('grandma', 'grandma', G0(0.05, lerp(0.0, 0.15, k), lerp(0.08, 0.5, k)), { mode: 'stand', expr: f >= BUTTON_F ? 'relief' : 'shock', seed: 51, blink: 0, headTilt: 5 * Math.sin(f * 0.25), shrug: f < BUTTON_F ? 1 : undefined }, { noBlob: k < 0.5 })); }
      if (f >= BUTTON_F) push(FX('heart', 'heart', G0(-0.25, 2.15 + 0.2 * clamp((f - BUTTON_F) / 30), 1.0), 0, 0.35 * back(clamp((f - BUTTON_F) / 8))));
      break;
    }
  }
  return A;
};

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 35, el: 48, sun: [1.0, 0.95, 0.86], sunI: 2.3, sky: '#5aa2dc', hor: '#d8e8f0', hemiSky: '#c6dcf2', hemiGnd: '#b8a070', hemiI: 1.15, fog: [90, 700], card: [1, 1, 1], sat: 1.08, gain: 1.0, sunDisc: 0 },
  indoor: { az: 20, el: 70, sun: [1.0, 0.94, 0.84], sunI: 1.3, sky: '#bcd8ec', hor: '#e8e0d0', hemiSky: '#f4ead8', hemiGnd: '#b89868', hemiI: 1.7, fog: [60, 400], card: [1, 0.98, 0.95], sat: 1.06, gain: 1.02, sunDisc: 0 },
  gold: { az: -40, el: 24, sun: [1.0, 0.82, 0.6], sunI: 2.2, sky: '#6a9ad0', hor: '#f4d0a0', hemiSky: '#b8c4e0', hemiGnd: '#b09060', hemiI: 1.1, fog: [80, 600], card: [1, 0.96, 0.9], sat: 1.1, gain: 1.0, sunDisc: 0 },
};
export const lightFor = (f) => LIGHTS[shotAt(f).light];
