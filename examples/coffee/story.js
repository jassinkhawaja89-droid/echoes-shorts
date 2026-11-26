// "The Pope Who Baptized Coffee" (legend, Rome around 1600) — pure functions of the frame number (30 fps).
export const FPS = 30, N = 879;
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
// papal hall around the origin (throne at the back wall z = -4), Venice quay at x = 60
export const HALL = [0, 0, 0], THRONE = [0, 0, -3.4], POPE = [0.2, 0, -1.9], TABLE = [1.4, 0, -1.4], VEN = [60, 0, 0];
const P1 = [-1.2, 0, -1.0], P2 = [-0.6, 0, 0.2];

// ---------- shots ----------
export const SHOTS = [
  { id: 'hook', a: 0, b: 148, light: 'hall' },
  { id: 'venice', a: 148, b: 258, light: 'day' },
  { id: 'rush', a: 258, b: 360, light: 'hall' },
  { id: 'beg', a: 360, b: 456, light: 'hall' },
  { id: 'demand', a: 456, b: 565, light: 'hall' },
  { id: 'sip', a: 565, b: 657, light: 'hall' },
  { id: 'smile', a: 657, b: 705, light: 'hall' },
  { id: 'devil', a: 705, b: 800, light: 'hall' },
  { id: 'twist', a: 800, b: 879, light: 'hall' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1];
export const HORNS = 104, SATAN = 418, SNIFF = 570, SIP1 = 594, SIP2 = 618, SMILE = 668, BLESS = 812, BUTTON_F = 846;
export const FLASH = [[145, 6], [255, 6]];
export const flashAt = (f) => { let v = 0; for (const [a, d] of FLASH) { const t = (f - a) / d; if (t >= 0 && t <= 1) v = Math.max(v, Math.sin(t * Math.PI)); } return v; };
export const KICKS = [[HORNS, 0.4], [SATAN, 0.6], [SMILE, 0.3], [BUTTON_F, 0.5]];
const kickAt = (f) => { let k = 0; for (const [a, s] of KICKS) { const d = f - a; if (d >= 0 && d < 7) k += s * (d % 2 ? -1 : 1) * (1 - d / 7); } return k; };
export const worldAt = (f) => ({ shot: shotAt(f).id });

// ---------- cameras ----------
const C = (pos, look, fov = 40, roll = 0) => ({ pos, look, fov, roll });
const glide = (a, b, t) => C(L3(a.pos, b.pos, t), L3(a.look, b.look, t), lerp(a.fov, b.fov, t), lerp(a.roll, b.roll, t));
const creep = (c, k) => { const d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]]; return { ...c, pos: [c.pos[0] + d[0] * k, c.pos[1] + d[1] * k, c.pos[2] + d[2] * k] }; };
const orbit = (c, deg) => { const a = deg * Math.PI / 180, dx = c.pos[0] - c.look[0], dz = c.pos[2] - c.look[2];
  return { ...c, pos: [c.look[0] + dx * Math.cos(a) - dz * Math.sin(a), c.pos[1], c.look[2] + dx * Math.sin(a) + dz * Math.cos(a)] }; };
const drift = (c, f, k = 1) => ({ ...c, pos: [c.pos[0] + 0.012 * k * Math.sin(f * 0.07), c.pos[1] + 0.008 * k * Math.sin(f * 0.11 + 1), c.pos[2]], roll: c.roll + 0.35 * k * Math.sin(f * 0.05 + 2) });
const V = (x, y, z) => [VEN[0] + x, y, VEN[2] + z];
const CUPON = [TABLE[0], 1.19, TABLE[2] + 0.05];

export const camAt = (f) => {
  const s = shotAt(f), t = (f - s.a) / (s.b - s.a);
  let c;
  switch (s.id) {
    case 'hook': c = glide(C([TABLE[0] + 0.5, 1.45, TABLE[2] + 2.2], [TABLE[0], 1.3, TABLE[2]], 40, -2), C([TABLE[0] + 0.2, 1.35, TABLE[2] + 1.35], [TABLE[0], 1.32, TABLE[2]], 40, 2), sstep(t)); break;
    case 'venice': c = orbit(C(V(1.5, 1.8, 7.5), V(0, 1.4, 0.5), 46, -1), -14 + 22 * sstep(t)); break;
    case 'rush': c = glide(C([-3.6, 1.7, 4.2], [-1.6, 1.5, -0.6], 46, -1), C([1.2, 1.8, 4.6], [-0.5, 1.6, -1.4], 46, 1), sstep((f - 262) / 90)); break;
    case 'beg': c = orbit(creep(C([0.1, 1.8, 6.6], [0.1, 1.3, -1.0], 46, 0), 0.002 * (f - 360)), -4 + 7 * sstep(t)); break;
    case 'demand': c = glide(C([-0.2, 1.7, 3.8], [-0.2, 1.5, -1.6], 44, -1), C([0.3, 1.65, 3.0], [-0.1, 1.5, -1.7], 42, 1), sstep(t)); break;
    case 'sip': c = creep(C([0.55, 1.75, 2.1], [0.25, 1.62, -1.9], 40, 0), 0.06 * sstep(t)); break;
    case 'smile': c = creep(C([0.5, 1.75, 1.75], [0.2, 1.65, -1.9], 40, 0), 0.05 * sstep(t)); break;
    case 'devil': c = orbit(C([-0.4, 1.7, 4.4], [-0.5, 1.5, -1.0], 44, 0), 8 - 14 * sstep(t)); break;
    case 'twist': {
      c = glide(C([0.85, 1.65, 3.9], [0.8, 1.4, -1.6], 44, 0), C([0.85, 1.6, 3.1], [0.8, 1.35, -1.6], 42, 0), sstep((f - 800) / 40));
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
    case 'hook': return [10, dist(CUPON)];
    case 'sip': case 'smile': return [9, dist([POPE[0], 1.7, POPE[2]])];
    case 'twist': return [8, dist([POPE[0], 1.5, POPE[2]])];
    default: return [0, 10];
  }
};
export const focusAt = (f) => (shotAt(f).id === 'venice' ? VEN : [0, 0, -1]);

// ---------- actors ----------
const P = (id, who, pos, opts = {}, extra = {}) => ({ id, kind: 'person', who, pos, opts, ...extra });
const FX = (id, fx, pos, t, size, extra = {}) => ({ id, kind: 'fx', fx, pos, t, size, ...extra });
const q1 = (v) => Math.round(v * 10) / 10;
const q2 = (v) => Math.round(v * 20) / 20;
const pope = (f, opts = {}, extra = {}) => P('pope', 'pope', POPE, { mode: 'stand', expr: 'stern', seed: 71, blink: blinkAt(f, 71), headTilt: 3 * idle(f, 7), ...opts }, extra);
const priest = (f, i, pos, opts = {}, extra = {}) => P('pr' + i, i ? 'pr2' : 'pr1', pos, { mode: 'stand', expr: 'nervous', seed: 81 + i, blink: blinkAt(f, 81 + i), headTilt: 4 * idle(f, i + 3), ...opts }, extra);
const steamPh = (f) => q2((f / 40) % 1);

export const actorsAt = (f) => {
  const s = shotAt(f).id, A = [];
  switch (s) {
    case 'hook': {
      A.push(FX('cup', 'cup', CUPON, steamPh(f), 0.55, { horns: f >= HORNS ? q1(back(clamp((f - HORNS) / 10))) : 0 }));
      break;
    }
    case 'venice': {
      A.push(P('m1', 'merch', V(-0.9, 0, 1.6), { mode: 'stand', expr: 'grin', seed: 91, blink: blinkAt(f, 91), headTilt: 4 * idle(f, 1), cup: q1(0.2 + 0.2 * Math.sin(f * 0.08)) }));
      A.push(P('t1', 'town1', V(0.5, 0, 1.2), { mode: 'stand', expr: f < 200 ? 'smile' : 'laugh', seed: 93, blink: blinkAt(f, 93), headTilt: 5 * idle(f, 2), cup: q1(f > 190 && f < 225 ? 1 : 0.2) }));
      A.push(P('t2', 'town2', V(1.6, 0, 1.6), { mode: 'stand', expr: 'smile_closed', seed: 95, blink: blinkAt(f, 95), headTilt: 5 * idle(f, 3), cup: q1(f > 214 ? 1 : 0.2) }, { flip: true }));
      for (let i = 0; i < 3; i++) A.push(FX('sk' + i, 'sack', V(-2.2 + 0.55 * i, 0.32, 0.4 - 0.2 * i), 0, 0.75));
      break;
    }
    case 'rush': {
      for (let i = 0; i < 2; i++) { const w = clamp((f - 262 - i * 8) / 80), p0 = i ? [-4.6, 0, 1.6] : [-4.0, 0, 1.2], p1 = i ? P2 : P1;
        A.push(priest(f, i, L3(p0, p1, sstep(w)), { mode: w < 1 ? 'march' : 'stand', phase: q2(((f - 262) / 14) % 1), expr: 'nervous', tilt: w < 1 ? 6 : 0 })); }
      A.push(pope(f, { expr: 'neutral' }));
      break;
    }
    case 'beg': {
      const sat = f >= SATAN;
      A.push(priest(f, 0, P1, { expr: sat ? 'shock' : 'nervous', shrug: q1(0.6 + 0.4 * Math.sin(f * 0.3)), headTilt: 6 * Math.sin(f * 0.3) }));
      A.push(priest(f, 1, P2, { expr: 'nervous', shrug: q1(0.6 + 0.4 * Math.sin(f * 0.3 + 1.5)), headTilt: 6 * Math.sin(f * 0.3 + 1.5) }));
      A.push(pope(f, { expr: 'stern' }));
      A.push(FX('cup', 'cup', CUPON, steamPh(f), 0.55, { horns: sat ? q1(back(clamp((f - SATAN) / 10))) : 0 }));
      break;
    }
    case 'demand': {
      const pt = f > 466 && f < 520;
      A.push(pope(f, { expr: pt ? 'stern' : 'sly', point: pt ? q1(sstep((f - 466) / 8)) : undefined, cup: f >= 528 ? q1(0.2) : undefined }));
      // a servant carries the cup across to the Pope
      const w = clamp((f - 470) / 50), sp = L3([-3.2, 0, 0.6], [-0.45, 0, -1.6], sstep(w));
      A.push(P('srv', 'servant', sp, { mode: w > 0 && w < 1 ? 'march' : 'stand', phase: q2(((f - 470) / 14) % 1), expr: 'smile', seed: 99, blink: blinkAt(f, 99), cup: f < 528 ? q1(0.35) : undefined }));
      break;
    }
    case 'sip': {
      const sip = (a) => clamp((f - a) / 6) * (1 - clamp((f - a - 16) / 6));
      const k = Math.max(0.45 * clamp((f - SNIFF) / 6) * (1 - clamp((f - SNIFF - 18) / 6)), sip(SIP1), sip(SIP2));
      const e = f < SIP1 ? 'smile_closed' : f < SIP2 ? 'whistle' : 'relief';
      A.push(pope(f, { expr: e, cup: q1(0.2 + 0.8 * k), headTilt: f < SIP1 ? 5 * Math.sin(f * 0.4) : 3 * idle(f, 7) }));
      break;
    }
    case 'smile': {
      A.push(pope(f, { expr: f < SMILE ? 'smile' : 'relief_open', cup: 0.2, headTilt: 4 * Math.sin(f * 0.2) }));
      if (f >= SMILE) A.push(FX('spk', 'sparkle', [POPE[0] + 0.35, 2.1, POPE[2] + 0.2], q1(clamp((f - SMILE) / 20)), 0.6));
      break;
    }
    case 'devil': {
      A.push(pope(f, { expr: 'grin', cup: 0.2, headTilt: 6 * Math.sin(f * 0.25) }));
      A.push(priest(f, 0, P1, { expr: 'shock', headTilt: 5 * Math.sin(f * 0.5) }));
      A.push(priest(f, 1, P2, { expr: 'shock', headTilt: 5 * Math.sin(f * 0.5 + 1) }));
      break;
    }
    case 'twist': {
      A.push(pope(f, { expr: f < BLESS ? 'smile' : 'smile_closed', present: f >= BLESS ? q1(sstep((f - BLESS) / 10)) : undefined }));
      const halo = f >= BUTTON_F - 6 ? q1(back(clamp((f - BUTTON_F + 6) / 10))) : 0;
      A.push(FX('cup', 'cup', CUPON, steamPh(f), 0.55, { halo }));
      if (f >= BLESS) A.push(FX('spk', 'sparkle', [CUPON[0] - 0.05, 1.35, CUPON[2] + 0.1], q1(clamp((f - BLESS) / 24)), 0.7));
      if (f >= BUTTON_F) A.push(FX('bst', 'stars', [CUPON[0], 1.5, CUPON[2] + 0.15], q1(clamp((f - BUTTON_F) / 14)), 0.7));
      break;
    }
  }
  return A;
};

// ---------- lights ----------
export const LIGHTS = {
  hall: { az: -30, el: 42, sun: [1.0, 0.9, 0.74], sunI: 2.0, sky: '#e8c890', hor: '#f4dcb0', hemiSky: '#f4e2c0', hemiGnd: '#8a6a4a', hemiI: 1.3, fog: [60, 400], card: [1, 0.97, 0.92], sat: 1.06, gain: 1.0, sunDisc: 0 },
  day: { az: 40, el: 45, sun: [1.0, 0.95, 0.84], sunI: 2.3, sky: '#5aa2dc', hor: '#dce8ee', hemiSky: '#c6dcf2', hemiGnd: '#a89070', hemiI: 1.15, fog: [80, 600], card: [1, 1, 1], sat: 1.08, gain: 1.0, sunDisc: 0 },
};
export const lightFor = (f) => LIGHTS[shotAt(f).light];
