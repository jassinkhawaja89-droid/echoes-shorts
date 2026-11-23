// "It Rained Meat" (Bath County, Kentucky, 1876) — pure functions of the frame number (30 fps).
export const FPS = 30, N = 881;
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
export const KETTLE = [-3, 0, 0.8], MRS = [-1.75, 0, 1.35], LAB = [24, 0, 6], CABIN = [-7.5, 0, -10], PIG = [1.2, 0, -2.2];
const M1 = [0.55, 0, 1.7], M2 = [1.85, 0, 1.25], T1 = [0.15, 0, 1.6], T2 = [1.4, 0, 1.3], SKY = [0, 0, -8];

// ---------- shots ----------
export const SHOTS = [
  { id: 'hook', a: 0, b: 142, light: 'day' },
  { id: 'soap', a: 142, b: 263, light: 'day' },
  { id: 'pour', a: 263, b: 350, light: 'day' },
  { id: 'taste', a: 350, b: 416, light: 'day' },
  { id: 'mutton', a: 416, b: 517, light: 'day' },
  { id: 'sci', a: 517, b: 588, light: 'day' },
  { id: 'vult', a: 588, b: 669, light: 'day' },
  { id: 'throw', a: 669, b: 778, light: 'day' },
  { id: 'twist', a: 778, b: 881, light: 'day' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1];
export const FLASH = [[139, 6], [514, 6]];
export const flashAt = (f) => { let v = 0; for (const [a, d] of FLASH) { const t = (f - a) / d; if (t >= 0 && t <= 1) v = Math.max(v, Math.sin(t * Math.PI)); } return v; };
export const PLOP = 286, STARTLE = 678, PUKE = 694, GREEN = 818, BUTTON_F = 846;
export const KICKS = [[PLOP, 0.4], [STARTLE, 0.5], [GREEN, 0.3], [BUTTON_F, 0.6]];
const kickAt = (f) => { let k = 0; for (const [a, s] of KICKS) { const d = f - a; if (d >= 0 && d < 7) k += s * (d % 2 ? -1 : 1) * (1 - d / 7); } return k; };
export const worldAt = (f) => ({ shot: shotAt(f).id });

// ---------- cameras ----------
const C = (pos, look, fov = 40, roll = 0) => ({ pos, look, fov, roll });
const glide = (a, b, t) => C(L3(a.pos, b.pos, t), L3(a.look, b.look, t), lerp(a.fov, b.fov, t), lerp(a.roll, b.roll, t));
const creep = (c, k) => { const d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]]; return { ...c, pos: [c.pos[0] + d[0] * k, c.pos[1] + d[1] * k, c.pos[2] + d[2] * k] }; };
const orbit = (c, deg) => { const a = deg * Math.PI / 180, dx = c.pos[0] - c.look[0], dz = c.pos[2] - c.look[2];
  return { ...c, pos: [c.look[0] + dx * Math.cos(a) - dz * Math.sin(a), c.pos[1], c.look[2] + dx * Math.sin(a) + dz * Math.cos(a)] }; };
const drift = (c, f, k = 1) => ({ ...c, pos: [c.pos[0] + 0.012 * k * Math.sin(f * 0.07), c.pos[1] + 0.008 * k * Math.sin(f * 0.11 + 1), c.pos[2]], roll: c.roll + 0.35 * k * Math.sin(f * 0.05 + 2) });
const Lb = (x, y, z) => [LAB[0] + x, y, LAB[2] + z];
const VB = [0, 17, -14]; // the startled vulture

export const camAt = (f) => {
  const s = shotAt(f), t = (f - s.a) / (s.b - s.a);
  let c;
  switch (s.id) {
    case 'hook': c = glide(C([-1.2, 1.6, 7.5], [-1.4, 7.5, -3], 46, -3), C([-1.0, 1.8, 6.2], [-1.5, 1.35, 0.6], 44, 1), sstep((f - 10) / 75)); break;
    case 'soap': c = orbit(creep(C([-1.7, 1.7, 5.8], [-2.4, 1.35, 0.9], 42, 0), 0.0015 * (f - 142)), -14 + 26 * sstep(t)); break;
    case 'pour': c = glide(C([-1.3, 0.9, 4.4], [-2.0, 2.2, 0.6], 44, -2), C([-1.2, 1.0, 4.0], [-1.9, 2.6, 0.2], 46, 2), sstep(t)); break;
    case 'taste': c = orbit(creep(C([1.2, 1.6, 5.6], [1.2, 1.4, 1.4], 44, 0), 0.0015 * (f - 350)), 8 - 12 * sstep(t)); break;
    case 'mutton': c = glide(C([0.6, 1.65, 4.6], [0.55, 1.6, 1.7], 42, -1), C([1.8, 1.65, 4.3], [1.85, 1.6, 1.25], 42, 1), sstep((f - 455) / 22)); break;
    case 'sci': c = orbit(creep(C(Lb(0, 1.8, 7.3), Lb(0, 1.35, -0.2), 46, 0), 0.0015 * (f - 517)), -10 + 18 * sstep(t)); break;
    case 'vult': c = glide(C([0, 1.4, 6], [0, 8, -6], 48, -2), C([0.5, 1.6, 6], [0, 13, -8], 48, 3), sstep(t)); break;
    case 'throw': { const k = clamp((f - 740) / 38); c = glide(C([VB[0] + 0.2, VB[1] + 0.2, VB[2] + 5.0], [VB[0], VB[1] - 0.3, VB[2]], 44, 0), C([VB[0] - 0.3, VB[1] + 0.6, VB[2] + 6.5], [VB[0] + 1.5 * k, VB[1] + 0.5 + 3 * k, VB[2]], 46, -2), sstep(t)); break; }
    case 'twist': {
      c = glide(C([0.15, 2.0, 8.6], [0.15, 1.4, 1.3], 46, 0), C([0.8, 1.7, 5.9], [0.78, 1.55, 1.4], 42, 0), sstep((f - 800) / 40));
      if (f >= BUTTON_F) c = creep(c, 0.06 * easeOut((f - BUTTON_F) / 10));
      c.roll += f >= BUTTON_F ? 2.5 * easeOut((f - BUTTON_F) / 10) : 0; break; }
  }
  c = drift(c, f);
  const k = kickAt(f);
  if (k) c = { ...c, roll: c.roll + 1.3 * k, look: [c.look[0], c.look[1] + 0.02 * k, c.look[2]] };
  return c;
};
export const dofAt = (f) => {
  const s = shotAt(f).id, cam = camAt(f);
  const dist = (p) => Math.hypot(p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]);
  switch (s) {
    case 'soap': return [9, dist([MRS[0], 1.6, MRS[2]])];
    case 'mutton': return [8, dist([f < 466 ? M1[0] : M2[0], 1.6, M1[2]])];
    case 'sci': return [7, dist(Lb(0, 1.6, -0.4))];
    default: return [0, 10];
  }
};
export const focusAt = (f) => ({ sci: LAB, throw: [0, 0, -14], vult: [0, 0, -8] }[shotAt(f).id] || [0, 0, 0]);

// ---------- actors ----------
const P = (id, who, pos, opts = {}, extra = {}) => ({ id, kind: 'person', who, pos, opts, ...extra });
const FX = (id, fx, pos, t, size, extra = {}) => ({ id, kind: 'fx', fx, pos, t, size, ...extra });
const q1 = (v) => Math.round(v * 10) / 10;
const q2 = (v) => Math.round(v * 20) / 20;
// raining chunks: chunk i starts falling at f0 + i * every at (x, z), lands after 24 frames and stays
const rain = (f, A, f0, n, every, cx, cz, w, d, pre = 0) => {
  for (let i = 0; i < n; i++) { const s = f0 + i * every - pre, x = cx + (R(i * 3.7) - 0.5) * w, z = cz + (R(i * 5.1) - 0.5) * d; if (f < s) continue;
    const t = clamp((f - s) / 24), y = lerp(9, 0.14, easeIn(t)), rot = t < 1 ? q1((f - s) * 0.25 + i) : q1(i * 0.7);
    if (Math.hypot(x - KETTLE[0], z - KETTLE[2]) < 0.7 && t >= 1) continue;
    A.push(FX('k' + i, 'meat', [x, y, z], 0, 0.36, { rot, flip: i % 2 === 1 })); }
};
const mrs = (f, opts = {}) => P('mrs', 'mrs', MRS, { mode: 'stand', expr: 'shock', seed: 21, blink: blinkAt(f, 21), headTilt: 3 * idle(f, 5), ...opts }, { flip: true });
const vult = (f, id, pos, w, seed, extra = {}) => FX(id, 'vulture', pos, 0, w, { ph: q2(((f + seed * 7) / 22) % 1), rotZ: 0.08 * Math.sin(f * 0.05 + seed), ...extra });

export const actorsAt = (f) => {
  const s = shotAt(f).id, A = [];
  switch (s) {
    case 'hook': {
      A.push(mrs(f, { expr: 'shock', look: -0.6, cheer: q1(0.6 + 0.3 * Math.sin(f * 0.25)) }));
      rain(f, A, 0, 80, 2, -1.3, 0.8, 4.5, 3.5, 40);
      break;
    }
    case 'soap': {
      A.push(mrs(f, { expr: 'smile', stir: q2(((f - 142) / 30) % 1) }));
      for (let i = 0; i < 5; i++) { const t = ((f - 142) / 50 + i / 5) % 1; A.push(FX('b' + i, 'soap', [KETTLE[0] + 0.3 * Math.sin(i * 2 + t * 4), 0.9 + 1.6 * t, KETTLE[2] + 0.2 * Math.cos(i)], 0, 0.14 * Math.sin(Math.PI * t) + 0.01)); }
      break;
    }
    case 'pour': {
      A.push(mrs(f, f < 290 ? { expr: 'smile', stir: q2(((f - 142) / 30) % 1) } : { expr: 'shock', look: -0.6, cheer: q1(back(clamp((f - 290) / 8))) }));
      if (f < PLOP) { const t = clamp((f - 262) / 24); A.push(FX('k0', 'meat', [KETTLE[0], lerp(9, 0.8, easeIn(t)), KETTLE[2]], 0, 0.32, { rot: q1(f * 0.25) })); }
      else if (f < PLOP + 14) A.push(FX('splash', 'stars', [KETTLE[0], 1.15, KETTLE[2] + 0.2], q1((f - PLOP) / 14), 0.7));
      rain(f, A, 282, 40, 2, -1.6, 0.6, 5, 4);
      break;
    }
    case 'taste': {
      rain(f, A, 0, 34, 4, -1.2, 0.2, 6, 5, 400);
      const w1 = clamp((f - 350) / 40), w2 = clamp((f - 356) / 40);
      A.push(P('m1', 'man1', [M1[0] + 2.2 * (1 - sstep(w1)), 0, M1[2]], { mode: w1 < 1 ? 'march' : 'stand', phase: q2(((f - 350) / 16) % 1), expr: 'nervous', seed: 31, blink: blinkAt(f, 31), headTilt: 4 * idle(f, 1), chunk: f > 395 ? 0 : undefined }));
      A.push(P('m2', 'man2', [M2[0] + 2.2 * (1 - sstep(w2)), 0, M2[2]], { mode: w2 < 1 ? 'march' : 'stand', phase: q2(((f - 356) / 16) % 1), expr: 'nervous', seed: 33, blink: blinkAt(f, 33), headTilt: 4 * idle(f, 2) }, { flip: true }));
      A.push(mrs(f, { expr: 'nervous' }));
      break;
    }
    case 'mutton': {
      rain(f, A, 0, 34, 4, -1.2, 0.2, 6, 5, 400);
      const c1 = f < 440 ? q1(sstep((f - 418) / 14)) : 0, c2 = f < 485 ? q1(sstep((f - 462) / 14)) : 0;
      A.push(P('m1', 'man1', M1, { mode: 'stand', expr: f < 440 ? 'nervous' : 'lick', seed: 31, blink: blinkAt(f, 31), headTilt: f > 440 ? 6 * Math.sin(f * 0.5) : 0, chunk: f < 440 ? c1 : undefined }));
      A.push(P('m2', 'man2', M2, { mode: 'stand', expr: f < 485 ? 'nervous' : 'lick', seed: 33, blink: blinkAt(f, 33), headTilt: f > 485 ? 6 * Math.sin(f * 0.5) : 0, chunk: f < 485 ? c2 : undefined }, { flip: true }));
      if (f >= 432) A.push(FX('bub1', 'bubble', [M1[0] + 0.25, 2.3, M1[2] + 0.1], q1(back(clamp((f - 432) / 10))), 0.7, { icon: 'sheep' }));
      if (f >= 476) A.push(FX('bub2', 'bubble', [M2[0] - 0.25, 2.3, M2[2] + 0.1], q1(back(clamp((f - 476) / 10))), 0.7, { icon: 'deer' }));
      break;
    }
    case 'sci': {
      const arg = Math.sin((f - 517) * 0.3);
      A.push(P('s1', 'sci1', Lb(-1.15, 0, 0.3), { mode: 'stand', expr: 'stern', point: arg > 0 ? q1(arg) : undefined, seed: 41, blink: blinkAt(f, 41), headTilt: 6 * arg }));
      A.push(P('s2', 'sci2', Lb(1.15, 0, 0.3), { mode: 'stand', expr: arg < 0 ? 'shock' : 'stern', point: arg < 0 ? q1(-arg) : undefined, seed: 43, blink: blinkAt(f, 43), headTilt: -6 * arg }, { flip: true }));
      break;
    }
    case 'vult': {
      for (let i = 0; i < 6; i++) { const a = (f - 588) * 0.02 + i * 1.05, r = 4 + (i % 3) * 1.4, h = 9 + (i % 3) * 2.5;
        A.push(vult(f, 'v' + i, [SKY[0] + r * Math.cos(a), h, SKY[2] + r * Math.sin(a) * 0.6], 2.2, i + 1, { flip: Math.sin(a) > 0 })); }
      if (f >= 628) { const k = back(clamp((f - 628) / 10)); A.push(vult(f, 'vb', [0.4, 4.0 + 0.2 * Math.sin(f * 0.1), 1.5], 1.5 * k + 0.01, 9, { expr: 'grin' })); }
      break;
    }
    case 'throw': {
      const fly = clamp((f - 740) / 38), vx = VB[0] + 2.5 * easeIn(fly), vy = VB[1] + 4.5 * easeIn(fly);
      A.push(vult(f, 'vb', [vx, vy + 0.15 * Math.sin(f * 0.2), VB[2]], 1.6, 9, { expr: f < STARTLE ? 'grin' : f < 740 ? (f < PUKE ? 'shock' : 'sick') : 'relief', ph: q2(((f) / (f < 740 ? 22 : 8)) % 1) }));
      if (f >= STARTLE && f < STARTLE + 12) A.push(FX('st', 'stars', [VB[0] + 0.6, VB[1] + 1.1, VB[2] + 0.2], q1((f - STARTLE) / 12), 0.7));
      if (f >= PUKE) { const t = clamp((f - PUKE) / 30); A.push(FX('pk', 'puke', [VB[0], VB[1] - 1.6 - 1.2 * clamp((f - 724) / 40), VB[2] + 0.05], q1(t), 1.4)); }
      if (f >= 742) A.push(FX('sp', 'speed', [vx - 1.3, vy - 0.4, VB[2] - 0.1], q1(clamp((f - 742) / 8)), 1.4, { rotZ: -0.9 }));
      break;
    }
    case 'twist': {
      rain(f, A, 0, 34, 4, -1.2, 0.2, 6, 5, 900);
      const g = f >= GREEN;
      A.push(P('m1', g ? 'man1g' : 'man1', T1, { mode: 'stand', expr: g ? 'pained' : 'neutral', seed: 31, blink: blinkAt(f, 31), headTilt: g ? 6 * Math.sin(f * 0.6) : 3 * idle(f, 1) }, { roll: g ? 0.05 * Math.sin(f * 0.3) : 0 }));
      A.push(P('m2', g ? 'man2g' : 'man2', T2, { mode: 'stand', expr: g ? 'pained' : 'neutral', seed: 33, blink: blinkAt(f, 33), headTilt: g ? -6 * Math.sin(f * 0.6) : 3 * idle(f, 2) }, { flip: true, roll: g ? -0.05 * Math.sin(f * 0.3) : 0 }));
      A.push({ ...mrs(f, { expr: f < 800 ? 'neutral' : 'sly' }), pos: [-1.1, 0, 1.1] });
      if (f >= BUTTON_F) A.push(FX('bst', 'stars', [T1[0] + 0.6, 2.5, T1[2] + 0.2], q1(clamp((f - BUTTON_F) / 14)), 0.8));
      break;
    }
  }
  return A;
};

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 30, el: 50, sun: [1.0, 0.96, 0.86], sunI: 2.4, sky: '#4a9ae0', hor: '#d4e8f2', hemiSky: '#c6dcf2', hemiGnd: '#8aa060', hemiI: 1.15, fog: [80, 700], card: [1, 1, 1], sat: 1.1, gain: 1.0, sunDisc: 0 },
  autumn: { az: 50, el: 30, sun: [1.0, 0.82, 0.58], sunI: 2.2, sky: '#d0a070', hor: '#f0d2a8', hemiSky: '#f0d4a8', hemiGnd: '#8a6a40', hemiI: 1.15, fog: [60, 500], card: [1, 0.94, 0.84], sat: 1.05, gain: 1.0, sunDisc: 0 },
};
export const lightFor = (f) => LIGHTS[shotAt(f).light];
