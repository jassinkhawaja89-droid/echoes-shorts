// "The Money Was Real" (Alves Reis, 1925) — pure functions of the frame number (30 fps).
export const FPS = 30, N = 1057;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const sstep = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const easeOut = (t) => 1 - (1 - clamp(t)) ** 3;
export const easeIn = (t) => clamp(t) ** 2;
export const back = (t, s = 1.7) => { t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1; };
export const spring = (t, k = 7, d = 5) => { t = Math.max(0, t); return 1 - Math.exp(-d * t) * Math.cos(k * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const R = (s) => { const x = Math.sin(s * 127.1 + 1.3) * 43758.5453; return x - Math.floor(x); };
export const idle = (f, seed) => Math.sin(f * 0.11 + seed * 2.1) * 0.5 + Math.sin(f * 0.047 + seed) * 0.5;
export const blinkAt = (f, seed, every = 70) => { const p = (f + Math.floor(R(seed) * every)) % (every + Math.floor(R(seed + 1) * 25)); return p < 4 ? 1 : 0; };

// ---------- layout ----------
export const CELL = [300, 0, 0], DESK = [360, 0, 0], LONDON = [0, 0, 400], PRESS = [440, 0, 0], BANK = [500, 0, 0];
export const MANSION = [0, 0, -34];
const at = (o) => (x, y, z) => [o[0] + x, y, o[2] + z];
const C_ = at(CELL), D_ = at(DESK), L_ = at(LONDON), P_ = at(PRESS), B_ = at(BANK);

// ---------- shots ----------
export const SHOTS = [
  { id: 'hook', a: 0, b: 150, light: 'lisbon' },
  { id: 'real', a: 150, b: 236, light: 'lisbon' },
  { id: 'cell', a: 236, b: 340, light: 'cell' },
  { id: 'forge', a: 340, b: 437, light: 'desk' },
  { id: 'london', a: 437, b: 515, light: 'london' },
  { id: 'nocheck', a: 515, b: 565, light: 'london' },
  { id: 'press', a: 565, b: 612, light: 'press' },
  { id: 'crates', a: 612, b: 690, light: 'press' },
  { id: 'buy', a: 690, b: 815, light: 'lisbon' },
  { id: 'bank', a: 815, b: 935, light: 'bank' },
  { id: 'real2', a: 935, b: 990, light: 'lisbon' },
  { id: 'fake', a: 990, b: 1057, light: 'lisbon' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1];
export const FLASH = [[233, 6], [434, 6], [686, 6]];
export const flashAt = (f) => { let v = 0; for (const [a, d] of FLASH) { const t = (f - a) / d; if (t >= 0 && t <= 1) v = Math.max(v, Math.sin(t * Math.PI)); } return v; };
const CRATE_T = [624, 630, 636, 642, 648, 654, 660, 666, 672, 678];
export const KICKS = [[207, 0.6], [355, 0.4], [369, 0.4], [383, 0.4], [495, 0.4], [541, 0.8], [577, 0.7], ...CRATE_T.map((a) => [a + 6, 0.35]), [776, 0.9], [906, 0.8], [970, 0.5], [1043, 0.7]];
const kickAt = (f) => { let k = 0; for (const [a, s] of KICKS) { const d = f - a; if (d >= 0 && d < 7) k += s * (d % 2 ? -1 : 1) * (1 - d / 7); } return k; };
const STAMPS = [355, 369, 383];

// ---------- world state ----------
export const carAt = (f) => {
  if (shotAt(f).id !== 'buy') return { on: 0 };
  const t = clamp((f - 690) / 26), z = lerp(-26, -7, easeOut(t));
  return { on: 1, x: 1.7, z, yaw: 0, door: 0, bounce: t < 1 ? 0.03 * Math.abs(Math.sin(f * 1.1)) : 0, pitch: t >= 1 && f < 722 ? 0.05 * Math.sin((f - 716) * 0.9) * Math.exp(-(f - 716) * 0.25) : 0, wheel: z / 0.4 };
};
export const worldAt = (f) => {
  const s = shotAt(f).id;
  const rain = { hook: clamp((f - 60) / 50) * 0.6 + clamp((f - 100) / 20) * 0.4, real: 0.5, real2: 0.6, fake: 0.7 }[s] || 0;
  return {
    shot: s, rain,
    chalk: s === 'cell' ? clamp((f - 245) / 60) : 1,
    stampCount: s === 'forge' ? STAMPS.filter((a) => f >= a + 3).length : 3,
    envelope: s === 'forge' && f > 412 ? clamp((f - 412) / 24) : -1,
    letterIn: s === 'london' ? clamp((f - 450) / 45) : -1,
    press: s === 'press' ? clamp((f - 576) / 6) : s === 'crates' ? 1 : 0,
    crates: s === 'crates' ? f : -1,
    bancoSign: s === 'buy' ? clamp((f - 768) / 8) : s === 'real2' || s === 'fake' ? 1 : 0,
    car: carAt(f),
  };
};
export const CRATES = CRATE_T;

// ---------- cameras ----------
const C = (pos, look, fov = 40, roll = 0) => ({ pos, look, fov, roll });
const glide = (a, b, t) => C(L3(a.pos, b.pos, t), L3(a.look, b.look, t), lerp(a.fov, b.fov, t), lerp(a.roll, b.roll, t));
const creep = (c, k) => { const d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]]; return { ...c, pos: [c.pos[0] + d[0] * k, c.pos[1] + d[1] * k, c.pos[2] + d[2] * k] }; };
const orbit = (c, deg) => { const a = deg * Math.PI / 180, dx = c.pos[0] - c.look[0], dz = c.pos[2] - c.look[2];
  return { ...c, pos: [c.look[0] + dx * Math.cos(a) - dz * Math.sin(a), c.pos[1], c.look[2] + dx * Math.sin(a) + dz * Math.cos(a)] }; };
const drift = (c, f, k = 1) => ({ ...c, pos: [c.pos[0] + 0.012 * k * Math.sin(f * 0.07), c.pos[1] + 0.008 * k * Math.sin(f * 0.11 + 1), c.pos[2]], roll: c.roll + 0.35 * k * Math.sin(f * 0.05 + 2) });

export const camAt = (f) => {
  const s = shotAt(f), t = (f - s.a) / (s.b - s.a);
  let c;
  switch (s.id) {
    case 'hook': c = orbit(glide(C([0.3, 0.75, 3.6], [0, 2.2, -2], 50, -2), C([0.5, 0.85, 2.7], [0.05, 2.0, -2], 50, 1.5), sstep(f / 150)), -8 * sstep(f / 150)); break;
    case 'real': c = orbit(creep(C([0.25, 1.5, 2.4], [0.0, 1.35, 0], 38, 0), 0.0025 * (f - 150)), 8 * sstep(t)); break;
    case 'cell': c = glide(C(C_(0.375, 1.6, 1.25), C_(-0.3, 1.5, -1.6), 46, 0), C(C_(0.375, 1.65, 3.5), C_(-0.3, 1.45, -1.4), 46, 2), sstep((f - 290) / 40)); break;
    case 'forge': c = orbit(creep(C(D_(0.8, 1.55, 1.6), D_(0, 1.15, -1.5), 40, 0), 0.0025 * (f - 340)), -8 * sstep(t));
      if (f > 410) c = glide(c, C(D_(0.3, 1.4, 0.4), D_(-0.2, 2.0, -1.0), 46, 5), sstep((f - 410) / 27)); break;
    case 'london': c = glide(C(L_(2.5, 3.2, 4.5), L_(0, 3.0, -6), 46, 0), C(L_(1.6, 1.6, -2.2), L_(0.5, 1.5, -6.6), 42, -2), sstep((f - 437) / 60)); break;
    case 'nocheck': c = orbit(creep(C(L_(1.05, 1.62, -4.4), L_(0.5, 1.55, -6.6), 38, 0), 0.003 * (f - 515)), 10 * sstep(t)); break;
    case 'press': c = orbit(creep(C(P_(1.0, 2.0, 5.4), P_(-0.2, 1.3, -1), 52, 0), 0.003 * (f - 565)), -6 * sstep(t)); break;
    case 'crates': c = glide(C(P_(5.2, 1.6, 4.2), P_(3.4, 1.0, -1.2), 44, 0), C(P_(5.8, 2.2, 5.4), P_(3.4, 2.1, -1.2), 46, 2), sstep((f - 612) / 70)); break;
    case 'buy': {
      const a = C([5.2, 1.6, 3.5], [1.5, 1.3, -7.5], 44, 0), b = C([3.5, 1.9, 2.5], [0, 4.2, -33], 42, 0), e = C([1.6, 2.0, -14], [0, 4.4, -33], 42, -1);
      c = glide(a, b, sstep((f - 724) / 30));
      if (f > 755) c = glide(c, e, sstep((f - 755) / 40));
      break;
    }
    case 'bank': c = creep(C(B_(0.4, 1.6, 1.6), B_(0, 1.5, -1.5), 40, 0), 0.0045 * (f - 815) + (f > 900 ? 0.08 * easeOut((f - 900) / 8) : 0)); break;
    case 'real2': c = orbit(creep(C([0.3, 1.5, 2.5], [0, 1.35, 0], 38, 0), 0.002 * (f - 935)), -6 * sstep(t)); break;
    case 'fake': c = orbit(glide(C([-0.2, 1.6, 2.1], [0, 1.5, 0], 38, 0), C([0.4, 1.3, 3.6], [0, 1.6, -1], 44, 1), sstep((f - 990) / 60)), 5 * sstep(t)); break;
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
    case 'real': return [12, dist([0, 1.5, 0])];
    case 'cell': return [8, dist(C_(0, 1.5, -1.0))];
    case 'forge': return [8, dist(D_(0, 1.3, -1.95))];
    case 'nocheck': return [11, dist(L_(0.5, 1.5, -6.6))];
    case 'bank': return [10, dist(B_(0, 1.5, -0.9))];
    case 'real2': return [12, dist([0, 1.5, 0])];
    case 'fake': return [9, dist([0, 1.5, 0])];
    default: return [0, 10];
  }
};

// ---------- actors ----------
const P = (id, who, pos, opts = {}, extra = {}) => ({ id, kind: 'person', who, pos, opts, ...extra });
const FX = (id, fx, pos, t, size, extra = {}) => ({ id, kind: 'fx', fx, pos, t, size, ...extra });
const walkTo = (f, a, b, from, to) => { const t = clamp((f - a) / (b - a)); return { pos: L3(from, to, t), walking: t > 0 && t < 1, phase: (f - a) / 16 }; };

export const actorsAt = (f) => {
  const s = shotAt(f).id, A = [];
  const bl = (seed) => blinkAt(f, seed);
  switch (s) {
    case 'hook': {
      const w = walkTo(f, 0, 36, [-0.8, 0, 0.1], [0, 0, 0]);
      const joy = f > 95 ? 0.05 * Math.abs(Math.sin((f - 95) * 0.35)) : 0;
      A.push(P('reis', 'reis', [w.pos[0], joy, w.pos[2]], { mode: w.walking ? 'stroll' : 'stand', phase: w.phase, expr: f < 95 ? 'sly' : 'laugh', present: f > 95 ? 0.7 + 0.3 * Math.sin(f * 0.45) : undefined, seed: 3, blink: bl(3), headTilt: 5 * idle(f, 1) }, { roll: w.walking ? 0.05 * Math.sin(f * 0.4) : 0.06 * Math.sin(f * 0.2) }));
      break;
    }
    case 'real': {
      A.push(P('reis', 'reis', [0, 0, 0], { mode: 'stand', expr: f < 200 ? 'stern' : 'grin', seed: 3, blink: bl(3), headTilt: f < 200 ? -6 : 5 }, { roll: f > 205 ? 0.05 * Math.sin((f - 205) * 0.3) : 0 }));
      const lift = sstep((f - 152) / 14);
      A.push(FX('note1', 'note', [0.08, 0.72 + 0.28 * lift, 0.42], 0, 0.6, { serial: 'Nº 7A 24513', rotY: 0.04 * Math.sin(f * 0.2) }));
      if (f >= 204) A.push(FX('check1', 'check', [0.3, 1.12, 0.5], (f - 204) / 12, 0.36));
      break;
    }
    case 'cell': {
      const draw = f > 245 && f < 305;
      A.push(P('reis', 'reisCell', C_(-0.05, 0, -1.05), { mode: 'stand', expr: f < 300 ? 'sly' : 'grin', present: draw ? 0.75 + 0.25 * Math.sin(f * 0.9) : undefined, seed: 3, blink: bl(3), headTilt: draw ? 10 : 3 * idle(f, 2) }, { roll: draw ? 0.06 * Math.sin(f * 0.45) : 0 }));
      break;
    }
    case 'forge': {
      const last = STAMPS.filter((a) => f >= a - 6).pop();
      let st = 0.1, dip = 0;
      if (last !== undefined) { const d = f - last; st = d < 0 ? 0.1 + 0.15 * (6 + d) / 6 : d < 3 ? 1 : 1 - 0.9 * sstep((d - 3) / 7); dip = d >= 0 && d < 5 ? -0.04 * Math.sin(Math.PI * d / 5) : 0; }
      const fling = f >= 410 ? 0.06 * Math.sin(Math.PI * clamp((f - 410) / 14)) : 0;
      A.push(P('reis', 'reis', D_(0, dip + fling, -1.95), { mode: 'stand', expr: f < 400 ? 'stern' : 'grin', stamp: f < 400 ? st : undefined, present: f >= 405 ? 0.85 + 0.15 * Math.sin(f * 0.5) : undefined, seed: 3, blink: bl(3), headTilt: f < 400 ? -4 + 3 * st : 6 }, { roll: f < 400 ? -0.05 * st : -0.07 * Math.sin(Math.PI * clamp((f - 405) / 20)) }));
      break;
    }
    case 'london': {
      const reach = f > 482 ? sstep((f - 482) / 10) : 0;
      A.push(P('printer', 'printer', L_(0.5, 0.03 * Math.abs(Math.sin(f * 0.25)), -6.6), { mode: 'stand', expr: f < 495 ? 'neutral' : 'smile', present: reach > 0 ? 0.5 * reach : undefined, seed: 9, blink: bl(9), headTilt: 4 * idle(f, 4) }, { roll: 0.03 * Math.sin(f * 0.15) }));
      break;
    }
    case 'nocheck': {
      A.push(P('printer', 'printer', L_(0.5, 0, -6.6), { mode: 'stand', expr: 'smile', blink: f > 522 ? 1 : bl(9), present: 0.4 + 0.5 * Math.abs(Math.sin((f - 515) * 0.25)), seed: 9, headTilt: 8 }, { roll: 0.06 * Math.sin(f * 0.22) }));
      if (f >= 540) A.push(FX('ok', 'stamp', L_(0.7, 1.8, -6.1), (f - 540) / 8, 0.75, { text: 'OK!', bg: '#2a8a4a', rot: -10 }));
      break;
    }
    case 'press': {
      const pull = f > 570 && f < 584 ? Math.sin(Math.PI * (f - 570) / 14) : 0;
      A.push(P('worker', 'worker', P_(-0.7, 0, 1.1), { mode: 'stand', expr: f < 577 ? 'stern' : 'grin', present: 0.3 + 0.7 * pull, seed: 13, blink: bl(13) }, { roll: -0.08 * pull }));
      A.push(P('printer', 'printer', P_(0.95, 0.04 * Math.abs(Math.sin(f * 0.4)), 1.3), { mode: 'stand', expr: f < 580 ? 'smile' : 'laugh', present: f > 580 ? 0.7 + 0.3 * Math.sin(f * 0.5) : undefined, seed: 9, blink: bl(9) }, { roll: 0.05 * Math.sin(f * 0.3) }));
      break;
    }
    case 'crates': {
      A.push(P('worker', 'worker', P_(2.0, 0, 0.6), { mode: 'stand', expr: f < 660 ? 'shock' : 'dazed', seed: 13, blink: bl(13), headTilt: 6 * Math.sin(f * 0.2), look: 1 }, { roll: 0.05 * Math.sin(f * 0.25) }));
      break;
    }
    case 'buy': {
      const K = carAt(f);
      const onCar = f < 718;
      let pos = onCar ? [K.x + 1.02, 0.42 + K.bounce, K.z + 0.2] : null, mode = 'stand', ph = 0;
      if (!onCar) { const hop = clamp((f - 718) / 6); pos = [lerp(K.x + 1.02, K.x + 1.5, hop), 0.42 * (1 - hop) + 0.2 * Math.sin(Math.PI * hop), lerp(K.z + 0.2, K.z + 1.2, hop)];
        if (f > 726) { const w = walkTo(f, 726, 800, [K.x + 1.5, 0, K.z + 1.2], [0.8, 0, -27]); pos = w.pos; mode = w.walking ? 'stroll' : 'stand'; ph = w.phase; } }
      A.push(P('reis', 'reis', pos, { mode, phase: ph, expr: 'laugh', present: 0.75 + 0.25 * Math.sin(f * 0.5), seed: 3, blink: bl(3) }, { roll: mode === 'stroll' ? 0.05 * Math.sin(f * 0.4) : -0.06, flip: mode === 'stroll' }));
      break;
    }
    case 'bank': {
      const pop = f >= 906 ? spring((f - 906) / 30 * 2.5, 8, 4) : 0;
      A.push(P('clerk', 'clerk', B_(0, 0, -1.9), { mode: 'stand', expr: f < 906 ? 'neutral' : 'shock', glasses: 1, glassesPop: clamp(pop), seed: 15, blink: f < 900 ? bl(15) : 0, headTilt: f < 880 ? 6 * Math.sin(f * 0.08) : 0 }, { roll: f >= 906 ? -0.04 * Math.sin((f - 906) * 0.9) * Math.exp(-(f - 906) * 0.1) : 0 }));
      const shake = f >= 906 ? 0.01 * Math.sin(f * 2.1) : 0;
      A.push(FX('noteL', 'note', B_(-0.29 + shake, 1.3, -1.05), 0, 0.5, { serial: 'Nº 7A 24513', rotZ: 0.06 }));
      A.push(FX('noteR', 'note', B_(0.29 - shake, 1.3, -1.05), 0, 0.5, { serial: 'Nº 7A 24513', rotZ: -0.06 }));
      break;
    }
    case 'real2': {
      A.push(P('reis', 'reis', [0, 0, 0], { mode: 'stand', expr: f < 960 ? 'nervous' : 'grin', seed: 3, blink: bl(3), headTilt: f < 960 ? 6 * Math.sin(f * 0.3) : 4 }, { roll: f < 960 ? 0.04 * Math.sin(f * 0.6) : 0.03 }));
      A.push(FX('note2', 'note', [0.06, 0.98, 0.42], 0, 0.6, { serial: 'Nº 7A 24513', rotY: 0.04 * Math.sin(f * 0.2) }));
      if (f >= 962) A.push(FX('check2', 'check', [0.3, 1.1, 0.5], (f - 962) / 12, 0.36));
      break;
    }
    case 'fake': {
      const shrug = f > 1045 ? 0.05 * Math.abs(Math.sin((f - 1045) * 0.35)) : 0;
      A.push(P('reis', 'reis', [0, shrug, 0], { mode: 'stand', expr: f < 1040 ? 'smile' : 'sly', present: f > 1045 ? 0.4 + 0.2 * Math.sin(f * 0.4) : undefined, tip: f > 1000 && f < 1030, seed: 3, blink: bl(3), headTilt: 5 * idle(f, 2) }, { roll: f > 1045 ? 0.05 * Math.sin((f - 1045) * 0.3) : 0 }));
      A.push(FX('contract', 'contract', [0.15, 1.18, 0.45], clamp((f - 1036) / 18), 0.5, { tear: f >= 1036 }));
      break;
    }
  }
  return A;
};

// ---------- lights ----------
export const LIGHTS = {
  lisbon: { az: 30, el: 48, sun: [1.0, 0.95, 0.84], sunI: 2.4, sky: '#4f98e0', hor: '#d4e6f2', hemiSky: '#c6dcf2', hemiGnd: '#b09070', hemiI: 1.15, fog: [60, 600], card: [1, 1, 1], sat: 1.08, gain: 1.0, sunDisc: 0 },
  cell: { az: 190, el: 65, sun: [0.85, 0.9, 1.0], sunI: 1.2, sky: '#3a4458', hor: '#4a5468', hemiSky: '#8a9ab8', hemiGnd: '#3a3430', hemiI: 0.95, fog: [40, 400], card: [0.82, 0.86, 0.95], sat: 0.95, gain: 0.95, sunDisc: 0 },
  desk: { az: 300, el: 50, sun: [1.0, 0.75, 0.45], sunI: 1.4, sky: '#3a2a20', hor: '#5a4030', hemiSky: '#f0c890', hemiGnd: '#5a3a24', hemiI: 1.1, fog: [40, 400], card: [1.0, 0.88, 0.72], sat: 1.05, gain: 0.96, sunDisc: 0 },
  london: { az: 20, el: 40, sun: [0.92, 0.94, 1.0], sunI: 1.1, sky: '#a8aeb8', hor: '#c4c8ce', hemiSky: '#c8ccd4', hemiGnd: '#6a6460', hemiI: 1.35, fog: [6, 70], card: [0.94, 0.95, 1.0], sat: 0.9, gain: 1.0, sunDisc: 0 },
  press: { az: 120, el: 60, sun: [1.0, 0.85, 0.62], sunI: 1.6, sky: '#5a4a3a', hor: '#7a6a58', hemiSky: '#f0d4a8', hemiGnd: '#5a4030', hemiI: 1.2, fog: [40, 400], card: [1.0, 0.93, 0.82], sat: 1.05, gain: 1.0, sunDisc: 0 },
  bank: { az: 60, el: 60, sun: [1.0, 0.9, 0.72], sunI: 1.5, sky: '#e8d4b0', hor: '#ecdcc0', hemiSky: '#fff0d0', hemiGnd: '#6a4a30', hemiI: 1.3, fog: [40, 400], card: [1.0, 0.96, 0.88], sat: 1.05, gain: 1.0, sunDisc: 0 },
};
export const lightFor = (f) => LIGHTS[shotAt(f).light];
export const focusAt = (f) => {
  const s = shotAt(f).id;
  return { hook: [0, 0, -2], real: [0, 0, 0], cell: C_(0, 0, -0.5), forge: D_(0, 0, -1), london: L_(0, 0, -5), nocheck: L_(0, 0, -6), press: P_(1, 0, 0), crates: P_(3, 0, -1),
    buy: [0, 0, f < 740 ? -8 : -26], bank: B_(0, 0, -1), real2: [0, 0, 0], fake: [0, 0, 0] }[s];
};
