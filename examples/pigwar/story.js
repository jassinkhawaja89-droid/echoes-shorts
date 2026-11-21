// "The Pig War" (San Juan Island, 1859) — pure functions of the frame number (30 fps).
export const FPS = 30, N = 878;
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
export const LAND_Y = 0, SHORE_Z = 40;
export const PIG = [1.2, 0, -2.2], FARMER = [-0.35, 0, 1.6];
export const HOOK = [0, 0, 12];
export const OWN = [-5, 0, -4];
export const TRENCH = [24, 0, 6];
export const FIELD = [-30, 0, 20];
export const CABIN = [-7.5, 0, -10];
export const SHIPS = [{ x: -34, z: 112, s: 0.8 }, { x: 0, z: 106, s: 1 }, { x: 34, z: 114, s: 0.8 }];

// ---------- shots ----------
export const SHOTS = [
  { id: 'hook', a: 0, b: 128, light: 'day' },
  { id: 'island', a: 128, b: 216, light: 'day' },
  { id: 'patch', a: 216, b: 318, light: 'day' },
  { id: 'shoot', a: 318, b: 360, light: 'day' },
  { id: 'owners', a: 360, b: 506, light: 'day' },
  { id: 'dig', a: 506, b: 566, light: 'day' },
  { id: 'ships', a: 566, b: 628, light: 'day' },
  { id: 'face', a: 628, b: 720, light: 'autumn' },
  { id: 'noshot', a: 720, b: 788, light: 'autumn' },
  { id: 'angel', a: 788, b: 878, light: 'day' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1];
export const FLASH = [[126, 6], [626, 6], [786, 6]];
export const flashAt = (f) => { let v = 0; for (const [a, d] of FLASH) { const t = (f - a) / d; if (t >= 0 && t <= 1) v = Math.max(v, Math.sin(t * Math.PI)); } return v; };
const SHOT_F = 330, DIGS = [516, 530, 544, 558];
export const KICKS = [[SHOT_F, 0.9], [290, 0.4], ...DIGS.map((a) => [a + 4, 0.25]), [600, 0.4], [845, 0.6]];
const kickAt = (f) => { let k = 0; for (const [a, s] of KICKS) { const d = f - a; if (d >= 0 && d < 7) k += s * (d % 2 ? -1 : 1) * (1 - d / 7); } return k; };

// ---------- world state ----------
export const worldAt = (f) => {
  const s = shotAt(f).id;
  return {
    shot: s,
    shipTurn: s === 'ships' ? sstep((f - 572) / 34) : f >= 628 ? 1 : 0,  // ships swing broadside
    gunUp: s === 'ships' ? back((f - 596) / 14) : f >= 628 ? 1 : 0,        // barrels elevate
    dirt: s === 'dig' ? clamp((f - 506) / 60) : f >= 566 ? 1 : 0,
  };
};

// ---------- cameras ----------
const C = (pos, look, fov = 40, roll = 0) => ({ pos, look, fov, roll });
const glide = (a, b, t) => C(L3(a.pos, b.pos, t), L3(a.look, b.look, t), lerp(a.fov, b.fov, t), lerp(a.roll, b.roll, t));
const creep = (c, k) => { const d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]]; return { ...c, pos: [c.pos[0] + d[0] * k, c.pos[1] + d[1] * k, c.pos[2] + d[2] * k] }; };
const orbit = (c, deg) => { const a = deg * Math.PI / 180, dx = c.pos[0] - c.look[0], dz = c.pos[2] - c.look[2];
  return { ...c, pos: [c.look[0] + dx * Math.cos(a) - dz * Math.sin(a), c.pos[1], c.look[2] + dx * Math.sin(a) + dz * Math.cos(a)] }; };
const drift = (c, f, k = 1) => ({ ...c, pos: [c.pos[0] + 0.012 * k * Math.sin(f * 0.07), c.pos[1] + 0.008 * k * Math.sin(f * 0.11 + 1), c.pos[2]], roll: c.roll + 0.35 * k * Math.sin(f * 0.05 + 2) });
const at = (o) => (x, y, z) => [o[0] + x, y, o[2] + z];
const H_ = at(HOOK), O_ = at(OWN), T_ = at(TRENCH), F_ = at(FIELD);

export const camAt = (f) => {
  const s = shotAt(f), t = (f - s.a) / (s.b - s.a);
  let c;
  switch (s.id) {
    case 'hook': c = orbit(creep(C(H_(0, 1.35, 5.2), H_(0, 1.05, 0), 46, 0), 0.0016 * f), -8 + 14 * sstep(f / 128)); break;
    case 'island': c = glide(C([26, 30, 52], [0, 1, -3], 44, 0), C([9, 9, 18], [0.5, 1, -3], 42, -1.5), sstep((f - 128) / 88)); break;
    case 'patch': c = orbit(creep(C([-0.2, 1.85, 6.2], [0.2, 1.1, -0.4], 42, 0), 0.0018 * (f - 216)), 6 - 10 * sstep(t)); break;
    case 'shoot': c = creep(C([-0.1, 1.65, 6.2], [0.3, 1.1, -0.4], 42, 0), 0.004 * (f - 318)); break;
    case 'owners': {
      const a = C(O_(-0.5, 1.65, 3.6), O_(-0.8, 1.55, 0), 40, 0), b = C(O_(0.6, 1.65, 3.6), O_(0.8, 1.55, 0), 40, 1);
      c = glide(a, b, sstep((f - 440) / 22)); c = creep(c, 0.0012 * (f - 360)); break;
    }
    case 'dig': c = glide(C(T_(-1.2, 1.4, 5.4), T_(-0.4, 0.9, 0), 42, -1), C(T_(1.0, 1.6, 5.0), T_(0.6, 0.9, 0), 42, 1), sstep(t)); break;
    case 'ships': c = glide(C([-75, 9, 66], [15, 3, 112], 40, 0), C([-68, 7, 72], [20, 3.5, 112], 38, -1.5), sstep(t)); break;
    case 'face': c = glide(C(F_(0, 1.55, 7.4), F_(0, 1.2, 0), 50, 0), C(F_(0, 1.9, 4.6), F_(0, 1.3, -3), 50, 0), sstep(t)); break;
    case 'noshot': c = orbit(creep(C(F_(1.0, 1.75, 2.6), F_(1.4, 1.75, 0), 40, 0), 0.003 * (f - 720)), 6 * sstep(t)); break;
    case 'angel': {
      const y = sstep((f - 800) / 60);
      c = C([0.5, 1.5 + 1.3 * y, 3.4], [0.9, 1.1 + 2.5 * y, PIG[2]], 44, 0);
      c = creep(c, 0.002 * (f - 788) + (f >= 845 ? 0.08 * easeOut((f - 845) / 8) : 0));
      c.roll = f >= 845 ? 3 * easeOut((f - 845) / 10) : 0; break;
    }
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
    case 'hook': return [9, dist(H_(0, 1, 0.3))];
    case 'patch': return [8, dist([FARMER[0], 1.4, FARMER[2]])];
    case 'owners': return [9, dist(O_(f < 450 ? -0.8 : 0.8, 1.5, 0))];
    case 'noshot': return [10, dist(F_(1.4, 1.7, 0))];
    default: return [0, 10];
  }
};
export const focusAt = (f) => {
  const s = shotAt(f).id;
  return { hook: HOOK, island: [0, 0, 0], patch: [0, 0, -1], shoot: [0, 0, -1], owners: OWN, dig: TRENCH, ships: [0, 0, 100], face: F_(0, 0, -3), noshot: FIELD, angel: PIG }[s];
};

// ---------- actors ----------
const P = (id, who, pos, opts = {}, extra = {}) => ({ id, kind: 'person', who, pos, opts, ...extra });
const PG = (id, pos, opts = {}, extra = {}) => ({ id, kind: 'pig', pos, opts, ...extra });
const FX = (id, fx, pos, t, size, extra = {}) => ({ id, kind: 'fx', fx, pos, t, size, ...extra });
const q1 = (v) => Math.round(v * 10) / 10;

export const actorsAt = (f) => {
  const s = shotAt(f).id, A = [];
  const bl = (seed) => blinkAt(f, seed);
  switch (s) {
    case 'hook': {
      A.push(P('red', 'redcoat', H_(-0.95, 0, -0.6), { mode: 'stand', expr: 'stern', facing: 1, look: 1, seed: 21, blink: bl(21), headTilt: 3 * idle(f, 1) }, { roll: 0.02 * Math.sin(f * 0.1) }));
      A.push(P('blue', 'bluecoat', H_(0.95, 0, -0.6), { mode: 'stand', expr: 'stern', facing: -1, look: -1, seed: 23, blink: bl(23), headTilt: 3 * idle(f, 2) }, { roll: -0.02 * Math.sin(f * 0.1) }));
      A.push(PG('pig', H_(-0.1, 0, 0.4), { expr: f > 70 && f < 100 ? 'shock' : 'happy', legs: 0, chew: 0 }, { scale: 0.75, roll: 0.03 * Math.sin(f * 0.2) }));
      break;
    }
    case 'island': {
      A.push(PG('pig', [PIG[0] - 2.5 + 2.5 * sstep((f - 140) / 60), 0, PIG[2]], { expr: 'happy', legs: q1(((f - 140) / 12) % 1) }, { scale: 0.75 }));
      A.push(P('farmer', 'farmer', FARMER, { mode: 'stand', expr: 'smile', seed: 3, blink: bl(3) }));
      break;
    }
    case 'patch': {
      const mad = f >= 262;
      A.push(P('farmer', 'farmer', FARMER, { mode: 'stand', expr: f < 250 ? 'smile' : mad ? 'stern' : 'shock', point: f >= 268 ? Math.min(1, back((f - 268) / 8)) : undefined, seed: 3, blink: bl(3), headTilt: f > 290 ? 5 * Math.sin((f - 290) * 0.5) : 3 * idle(f, 1) }, { roll: f >= 250 && f < 258 ? 0.06 : 0.02 * Math.sin(f * 0.2) }));
      A.push(PG('pig', PIG, { expr: 'eat', chew: q1(f * 0.6), potato: true }, { scale: 0.75, roll: 0.03 * Math.sin(f * 0.6), flip: true }));
      break;
    }
    case 'shoot': {
      const kick = f >= SHOT_F ? Math.exp(-(f - SHOT_F) * 0.3) : 0;
      A.push(P('farmer', 'farmer', FARMER, { mode: 'stand', expr: f < SHOT_F ? 'stern' : 'shock', aim: 1, kick: q1(kick), seed: 3, blink: bl(3) }, { roll: -0.05 * kick }));
      if (f >= SHOT_F && f < SHOT_F + 8) A.push(FX('bang', 'bang', [FARMER[0] + 1.25, 1.5, FARMER[2] + 0.1], (f - SHOT_F) / 8, 0.9));
      if (f >= SHOT_F + 2 && f < SHOT_F + 28) A.push(FX('smk', 'smoke', [FARMER[0] + 1.3, 1.6, FARMER[2]], (f - SHOT_F - 2) / 26, 0.9, { seed: 4 }));
      const hit = f >= SHOT_F + 2, tt = clamp((f - SHOT_F - 2) / 14);
      const pos = hit ? [PIG[0] + 0.3 * tt, 1.4 * Math.sin(Math.PI * tt) + 0.12 * tt, PIG[2]] : PIG;
      A.push(PG('pig', pos, { expr: hit ? (tt < 1 ? 'shock' : 'dazed') : 'eat', upside: hit && tt > 0.5, chew: hit ? 0 : q1(f * 0.6) }, { scale: 0.75, roll: hit ? (tt < 1 ? -tt * 3.2 : 0) : 0, flip: true }));
      if (hit && tt >= 1) A.push(FX('stars', 'stars', [PIG[0] + 0.35, 0.95, PIG[2] + 0.1], q1(((f - SHOT_F) / 20) % 1), 0.9));
      break;
    }
    case 'owners': {
      const angry = f >= 380;
      A.push(P('company', 'company', O_(-0.8, 0, 0), { mode: 'stand', expr: angry ? 'stern' : 'shock', point: angry ? Math.min(1, back((f - 380) / 9)) : undefined, seed: 9, blink: bl(9), headTilt: angry && f < 440 ? 5 * Math.sin((f - 380) * 0.45) : 2 }, { roll: angry && f < 440 ? 0.03 * Math.sin((f - 380) * 0.45) : 0 }));
      A.push(P('farmer', 'farmer', O_(0.8, 0, 0.2), { mode: 'stand', expr: f < 460 ? 'nervous' : 'sly', shrug: f >= 462 ? Math.abs(Math.sin((f - 462) * 0.18)) : undefined, seed: 3, blink: bl(3), headTilt: f >= 462 ? 6 * Math.sin((f - 462) * 0.18) : 0 }, { roll: 0.02 * Math.sin(f * 0.2) }));
      A.push(FX('ukflag', 'flag', O_(-1.55, 2.0, -1.0), q1((f * 0.12) % 6.28), 1.1, { flagKind: 'uk', ph: f * 0.12, k: q1(f * 0.12) }));
      A.push(FX('usflag', 'flag', O_(1.6, 2.0, -1.0), q1((f * 0.12) % 6.28), 1.1, { flagKind: 'us', ph: f * 0.12 + 1, k: q1(f * 0.12) }));
      break;
    }
    case 'dig': {
      [-1.3, 0, 1.3].forEach((dx, i) => {
        const ph = ((f - 506 + i * 7) % 14) / 14, k = Math.sin(ph * Math.PI);
        A.push(P('dig' + i, 'digger', T_(dx, 0, -0.2 + 0.25 * i), { mode: 'stand', expr: 'stern', prop: ['hammer', q1(k)], seed: 31 + i, blink: bl(31 + i), headTilt: 4 * k }, { roll: 0.05 * k }));
        if (ph < 0.5) A.push(FX('dp' + i, 'smoke', T_(dx + 0.4, 0.4 + ph, 0.8), ph * 2, 0.7, { seed: 40 + i, col: '#a8784a' }));
      });
      break;
    }
    case 'ships': break;
    case 'face': {
      for (let i = 0; i < 4; i++) {
        const z = -i * 2.4;
        A.push(P('r' + i, 'redcoat', F_(-1.1, 0, z), { mode: 'stand', expr: 'stern', facing: 1, look: 1, seed: 50 + i, blink: bl(50 + i), headTilt: 2 * idle(f, i) }));
        A.push(P('b' + i, 'bluecoat', F_(1.1, 0, z), { mode: 'stand', expr: 'stern', facing: -1, look: -1, seed: 60 + i, blink: bl(60 + i), headTilt: 2 * idle(f, i + 9) }));
      }
      for (let i = 0; i < 10; i++) {
        const t = ((f - 628) / 70 + R(i)) % 1;
        A.push(FX('leaf' + i, 'leaf', F_(-2.5 + 5 * R(i * 3) + 0.4 * Math.sin(f * 0.08 + i), 4 - 4 * t, -1 - 7 * R(i * 7)), 0, 0.22, { rot: Math.round(f * 3 + i * 40) % 360, col: ['#d8742a', '#c8a030', '#b8481e'][i % 3], k: Math.round(f * 3 + i * 40) % 360 }));
      }
      break;
    }
    case 'noshot': {
      const bored = f >= 752;
      A.push(P('b0', 'bluecoat', F_(1.35, 0, 0), { mode: 'stand', expr: bored ? 'whistle' : 'nervous', facing: -1, look: -1, seed: 60, blink: bored ? 1 : bl(60), headTilt: bored ? -8 : 3 * Math.sin(f * 0.5) }, { roll: bored ? -0.04 : 0.01 * Math.sin(f * 0.9) }));
      if (!bored) A.push(FX('drop', 'drop', F_(1.62, 2.05 - 0.4 * (((f - 720) / 24) % 1), 0.15), 0, 0.12));
      A.push(P('r0', 'redcoat', F_(-1.35, 0, 0), { mode: 'stand', expr: bored ? 'whistle' : 'stern', facing: 1, look: 1, seed: 50, blink: bl(50) }));
      break;
    }
    case 'angel': {
      const rise = sstep((f - 800) / 60);
      A.push(P('farmer', 'farmer', FARMER, { mode: 'stand', expr: f < 845 ? 'nervous' : 'shock', seed: 3, blink: f < 845 ? bl(3) : 0, headTilt: -6 }, { roll: 0.02 * Math.sin(f * 0.2) }));
      A.push(PG('angel', [PIG[0], 0.1 + 2.6 * rise + 0.08 * Math.sin(f * 0.15), PIG[2]], { expr: 'happy', angel: true, flap: q1(f * 0.5) }, { scale: 0.85, roll: 0.05 * Math.sin(f * 0.12), noBlob: true, flip: true }));
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
