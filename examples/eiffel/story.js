// "The Man Who Sold the Eiffel Tower" — pure functions of the frame number (30 fps).
export const FPS = 30, N = 1110;
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
export const TOWER = [0, 0, -330];
export const SALON = [400, 0, 0];
export const OFFICE = [460, 0, 0];
export const POLICE = [-31, 0, 20.5];
const S_ = (x, y, z) => [SALON[0] + x, y, SALON[2] + z];
const O_ = (x, y, z) => [OFFICE[0] + x, y, OFFICE[2] + z];

// ---------- shots ----------
export const SHOTS = [
  { id: 'hook', a: 0, b: 196, light: 'day' },
  { id: 'bolt', a: 196, b: 316, light: 'day' },
  { id: 'office', a: 316, b: 440, light: 'office' },
  { id: 'whisper', a: 440, b: 577, light: 'salon' },
  { id: 'model', a: 577, b: 617, light: 'salon' },
  { id: 'iron', a: 617, b: 690, light: 'salon' },
  { id: 'shh', a: 690, b: 738, light: 'salon' },
  { id: 'pay', a: 738, b: 830, light: 'salon' },
  { id: 'escape', a: 830, b: 897, light: 'day' },
  { id: 'police', a: 897, b: 1000, light: 'day' },
  { id: 'again', a: 1000, b: 1110, light: 'salon' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1];
export const FLASH = [[436, 6], [997, 6]];
export const flashAt = (f) => { let v = 0; for (const [a, d] of FLASH) { const t = (f - a) / d; if (t >= 0 && t <= 1) v = Math.max(v, Math.sin(t * Math.PI)); } return v; };
export const KICKS = [[172, 0.7], [182, 0.9], [292, 0.5], [600, 0.6], [655, 0.8], [854, 0.5], [1090, 1.0]];
const kickAt = (f) => { let k = 0; for (const [a, s] of KICKS) { const d = f - a; if (d >= 0 && d < 7) k += s * (d % 2 ? -1 : 1) * (1 - d / 7); } return k; };
const STAMPS = [324, 338, 352, 366, 380];

// ---------- world state ----------
export const carAt = (f) => {
  const s = shotAt(f).id;
  if (s !== 'escape') return { on: 0 };
  const t = Math.max(0, (f - 853) / 30), d = t < 1.5 ? 6 * t * t : 13.5 + 18 * (t - 1.5);
  const door = f < 834 ? 0 : f < 842 ? back((f - 834) / 8, 1.2) : f < 848 ? 1 : 1 - easeIn((f - 848) / 5);
  return { on: 1, x: 3.2, z: -5 - d, yaw: 0, door: clamp(door, 0, 1.1), bounce: f > 853 ? 0.03 * Math.abs(Math.sin(f * 1.1)) : f >= 846 && f < 852 ? 0.04 * Math.sin(Math.PI * (f - 846) / 6) : 0, pitch: f > 853 && f < 863 ? -0.04 : 0, wheel: d / 0.4 };
};
export const worldAt = (f) => {
  const s = shotAt(f).id;
  const inSalon = ['whisper', 'model', 'iron', 'shh', 'pay', 'again'].includes(s);
  const bt = (f - 272) / 18;
  return {
    shot: s, inSalon,
    bolt: s === 'bolt' && f >= 272 ? { y: bt < 1 ? 3.0 * (1 - bt * bt) : 0.12 * Math.abs(Math.sin((f - 290) * 0.45)) * Math.exp(-(f - 290) * 0.18), spin: bt < 1 ? f * 0.4 : 0 } : null,
    stampCount: s === 'office' ? STAMPS.filter((a) => f >= a + 3).length : 5,
    letters: s === 'office' && f >= 396 ? clamp((f - 396) / 40) : 0,
    modelFall: s === 'model' ? easeIn(clamp((f - 586) / 14)) + (f > 600 ? -0.06 * Math.sin((f - 600) * 1.2) * Math.exp(-(f - 600) * 0.3) : 0) : s === 'iron' || s === 'shh' || s === 'pay' ? 1 : 0,
    girders: s === 'iron' ? f : s === 'shh' || s === 'pay' ? 9999 : -1,
    case: s === 'pay' ? clamp((f - 748) / 24) : s === 'again' ? -1 : -1,
    env: s === 'pay' ? clamp((f - 801) / 15) : -1,
    car: carAt(f),
  };
};

// ---------- cameras ----------
const C = (pos, look, fov = 40, roll = 0) => ({ pos, look, fov, roll });
const glide = (a, b, t) => C(L3(a.pos, b.pos, t), L3(a.look, b.look, t), lerp(a.fov, b.fov, t), lerp(a.roll, b.roll, t));
const creep = (c, k) => { const d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]]; return { ...c, pos: [c.pos[0] + d[0] * k, c.pos[1] + d[1] * k, c.pos[2] + d[2] * k] }; };
/** swing the camera around the look point by deg (vertical axis) */
const orbit = (c, deg) => { const a = deg * Math.PI / 180, dx = c.pos[0] - c.look[0], dz = c.pos[2] - c.look[2];
  return { ...c, pos: [c.look[0] + dx * Math.cos(a) - dz * Math.sin(a), c.pos[1], c.look[2] + dx * Math.sin(a) + dz * Math.cos(a)] }; };
/** gentle handheld drift */
const drift = (c, f, k = 1) => ({ ...c, pos: [c.pos[0] + 0.012 * k * Math.sin(f * 0.07), c.pos[1] + 0.008 * k * Math.sin(f * 0.11 + 1), c.pos[2]], roll: c.roll + 0.35 * k * Math.sin(f * 0.05 + 2) });
const LZ = -4.55; // Lustig's spot at the head of the table

export const camAt = (f) => {
  const s = shotAt(f), t = (f - s.a) / (s.b - s.a);
  let c;
  switch (s.id) {
    case 'hook': {
      const a = C([0.2, 0.7, 3.4], [-0.2, 2.35, 0], 52, -2.5), b = C([0.75, 0.7, 2.6], [0.25, 2.45, 0], 52, 2);
      c = glide(a, b, sstep(f / 190));
      c = orbit(c, -6 * sstep(f / 196));
      break;
    }
    case 'bolt': {
      c = C([0.45, 1.5, 3.7], [0.05, 1.35, 0], 40, 0);
      c = creep(c, 0.0016 * (f - 196));
      c = orbit(c, -10 + 22 * sstep(t));
      if (f > 276) c = { ...c, look: [c.look[0] + 0.1 * sstep((f - 276) / 14), c.look[1] - 0.3 * sstep((f - 276) / 14), c.look[2]] };
      if (f > 298) c = { ...c, look: [c.look[0], c.look[1] + 0.25 * sstep((f - 298) / 14), c.look[2]] };
      break;
    }
    case 'office': {
      c = C(O_(0.9, 1.55, 1.7), O_(0.0, 1.2, -1.6), 40, 0);
      c = orbit(creep(c, 0.0018 * (f - 316)), -8 * sstep((f - 316) / 80));
      if (f > 392) c = glide(c, C(O_(0.4, 1.35, 0.6), O_(-0.1, 1.9, -1.8), 44, 4), sstep((f - 392) / 44));
      break;
    }
    case 'whisper': {
      const a = C(S_(2.4, 3.0, 4.6), S_(0, 1.1, -2.4), 46, 0), b = C(S_(1.15, 1.65, -0.6), S_(0.8, 1.35, LZ + 0.4), 46, -1.5);
      c = glide(a, b, sstep((f - 440) / 38));
      if (f > 478) c = orbit(creep(c, 0.0016 * (f - 478)), -6 * sstep((f - 478) / 99));
      break;
    }
    case 'model': {
      c = C(S_(0.2, 1.3, -2.45), S_(-0.45, 0.98, -3.75), 40, 2);
      c = orbit(creep(c, 0.0025 * (f - 577)), 14 * sstep((f - 577) / 40));
      break;
    }
    case 'iron': {
      c = C(S_(2.0, 2.4, 1.6), S_(0, 0.95, -2.2), 46, 0);
      c = orbit(creep(c, 0.002 * (f - 617)), -10 * sstep((f - 617) / 73));
      break;
    }
    case 'shh': {
      c = C(S_(0.25, 1.72, LZ + 1.9), S_(0.0, 1.62, LZ), 36, -2);
      c = orbit(creep(c, 0.004 * (f - 690)), 6 * sstep((f - 690) / 48));
      break;
    }
    case 'pay': {
      c = C(S_(1.55, 1.35, -1.2), S_(0.75, 0.98, -3.85), 46, 0);
      c = orbit(creep(c, 0.0015 * (f - 738)), -8 * sstep((f - 738) / 92));
      break;
    }
    case 'escape': {
      c = C([7.4, 1.55, 0.6], [2.6, 1.6, -9], 44, 0);
      c = { ...c, look: [3.6, 1.45, -6.5] };
      if (f > 853) { const K = carAt(f); c = { ...c, look: [lerp(3.6, K.x, 0.5 * sstep((f - 853) / 10)), 1.5, lerp(-6.5, K.z, 0.45 * sstep((f - 853) / 10))] }; }
      c = creep(c, f > 853 ? 0.004 * (f - 853) : 0.002 * (f - 830));
      break;
    }
    case 'police': {
      c = C([-24.2, 1.6, 25.2], [-30.0, 1.3, 21.0], 40, 0);
      c = orbit(creep(c, 0.0014 * (f - 897)), -10 + 18 * sstep(t));
      break;
    }
    case 'again': {
      const a = C(S_(2.4, 2.6, 1.8), S_(0.3, 1.2, LZ + 0.3), 44, 0), b = C(S_(1.0, 1.75, -1.0), S_(0.05, 1.5, LZ), 40, 1);
      c = glide(a, b, sstep((f - 1000) / 80));
      if (f > 1080) c = creep(c, 0.012 * (f - 1080));
      break;
    }
  }
  c = drift(c, f, s.id === 'escape' ? 0.5 : 1);
  const k = kickAt(f);
  if (k) c = { ...c, roll: c.roll + 1.3 * k, look: [c.look[0], c.look[1] + 0.02 * k, c.look[2]] };
  return c;
};

export const dofAt = (f) => {
  const s = shotAt(f).id, cam = camAt(f);
  const dist = (p) => Math.hypot(p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]);
  switch (s) {
    case 'bolt': return [9, dist([0, 1.5, 0])];
    case 'office': return [8, dist(O_(0, 1.3, -2.0))];
    case 'whisper': return [lerp(0, 9, sstep((f - 470) / 10)), dist(S_(0.5, 1.5, LZ + 0.4))];
    case 'model': return [12, dist(S_(-0.45, 1.0, -3.75))];
    case 'shh': return [13, dist(S_(0, 1.6, LZ))];
    case 'pay': return [8, dist(S_(0.4, 0.95, -3.7))];
    case 'police': return [7, dist([-29.5, 1.4, 21.5])];
    case 'again': return [8, dist(S_(0, 1.5, LZ))];
    default: return [0, 10];
  }
};

// ---------- actors ----------
const P = (id, who, pos, opts = {}, extra = {}) => ({ id, kind: 'person', who, pos, opts, ...extra });
const FX = (id, fx, pos, t, size, extra = {}) => ({ id, kind: 'fx', fx, pos, t, size, ...extra });
const SEATS = [[1.45, -3.7], [-1.45, -3.2], [1.45, -2.5], [-1.45, -1.9], [1.45, -1.1]];
/** list: [who, seatIndex] pairs; hop = vertical jump, lean = lean towards Lustig */
const salonDealers = (f, list, bl, { hop = 0, lean = 0, laugh = 0 } = {}) => list.map(([who, i]) => {
  const side = Math.sign(SEATS[i][0]), j = laugh ? 0.05 * Math.abs(Math.sin(f * 0.55 + i * 1.3)) * laugh : 0;
  return P('seat' + i + who, who, S_(SEATS[i][0] - side * 0.12 * lean, 0.42 + hop * (0.7 + 0.3 * R(i)) + j, SEATS[i][1] - 0.1 * lean),
    { mode: 'sit', seed: 5 + i * 2, blink: bl(5 + i), headTilt: 6 * -side * (0.4 + lean) + 3 * idle(f, i) + (laugh ? 6 * Math.sin(f * 0.55 + i) : 0) },
    { roll: side * 0.07 * lean + (laugh ? 0.05 * Math.sin(f * 0.55 + i * 1.3) : 0) });
});
const ALL = [['poisson', 0], ['d1', 1], ['d2', 2], ['d3', 3], ['d4', 4]], CLOSE = [['poisson', 0], ['d1', 1], ['d3', 3]];
const walkTo = (f, a, b, from, to) => { const t = clamp((f - a) / (b - a)); return { pos: L3(from, to, t), walking: t > 0 && t < 1, phase: (f - a) / 16 }; };

export const actorsAt = (f) => {
  const s = shotAt(f).id, A = [];
  const bl = (seed) => blinkAt(f, seed);
  switch (s) {
    case 'hook': {
      const w = walkTo(f, 0, 40, [-0.9, 0, 0.15], [0, 0, 0]);
      const pres = f < 105 ? undefined : 0.45 + 0.4 * back((f - 105) / 14) + 0.15 * Math.sin((f - 105) * 0.35);
      const hop = f > 104 && f < 118 ? 0.08 * Math.sin(Math.PI * (f - 104) / 14) : 0;
      A.push(P('lustig', 'lustig', [w.pos[0], hop, w.pos[2]], { mode: w.walking ? 'stroll' : 'stand', phase: w.phase, expr: f < 105 ? 'sly' : 'grin', present: pres, seed: 3, blink: bl(3), headTilt: 4 * idle(f, 1) }, { roll: w.walking ? 0.05 * Math.sin(f * 0.4) : f > 105 ? -0.06 * sstep((f - 105) / 10) : 0 }));
      const jump = f > 140 && f < 156 ? 0.22 * Math.sin(Math.PI * (f - 140) / 16) : 0;
      A.push(P('poisson', 'poisson', [0.9, jump + 0.03 * Math.abs(Math.sin(f * 0.3)), -1.5], { mode: 'stand', expr: f < 140 ? 'grin' : 'shock', bag: 1, seed: 5, blink: bl(5), headTilt: 5 * Math.sin(f * 0.15) }, { roll: 0.04 * Math.sin(f * 0.2) }));
      if (f >= 170) A.push(FX('sold1', 'sold', [-0.8, 4.3, -3.4], (f - 170) / 8, 2.4, { rot: -9 }));
      if (f >= 180) A.push(FX('sold2', 'sold', [1.0, 5.6, -4.0], (f - 180) / 8, 2.6, { rot: 7 }));
      break;
    }
    case 'bolt': {
      const expr = f < 248 ? 'sly' : f < 286 ? 'smile' : f < 300 ? 'whistle' : 'grin';
      const flinch = f > 288 && f < 300 ? 0.1 * Math.sin(Math.PI * (f - 288) / 12) : 0;
      const shrug = f > 300 ? 0.05 * Math.abs(Math.sin((f - 300) * 0.35)) : 0;
      A.push(P('lustig', 'lustig', [0, flinch + shrug, 0], { mode: 'stand', expr, tip: f > 204 && f < 236, present: f > 300 ? 0.3 + 0.2 * Math.sin((f - 300) * 0.4) : undefined, seed: 3, blink: bl(3), look: f > 284 && f < 300 ? 0.5 : 0, headTilt: 4 * idle(f, 1) + (f > 300 ? 6 * Math.sin((f - 300) * 0.4) : 0) },
        { roll: f > 204 && f < 236 ? 0.05 : f > 300 ? 0.05 * Math.sin((f - 300) * 0.3) : 0 }));
      if (f >= 290 && f < 302) A.push(FX('boltting', 'burst', [0.6, 0.15, 0.2], (f - 290) / 12, 0.5));
      break;
    }
    case 'office': {
      const last = STAMPS.filter((a) => f >= a - 6).pop();
      let st = 0.1, dip = 0;
      if (last !== undefined) { const d = f - last; st = d < 0 ? 0.1 + 0.15 * (6 + d) / 6 : d < 3 ? 1 : 1 - 0.9 * sstep((d - 3) / 7); dip = d >= 0 && d < 5 ? -0.04 * Math.sin(Math.PI * d / 5) : 0; }
      const fling = f >= 392 ? 0.06 * Math.sin(Math.PI * clamp((f - 392) / 14)) : 0;
      A.push(P('lustig', 'lustig', O_(0, dip + fling, -1.95), { mode: 'stand', expr: f < 392 ? 'stern' : 'grin', stamp: f < 392 ? st : undefined, present: f >= 392 ? 0.8 + 0.2 * Math.sin(f * 0.5) : undefined, seed: 3, blink: bl(3), headTilt: f < 392 ? -4 + 3 * st : 5 },
        { roll: f < 392 ? -0.05 * st : -0.08 * Math.sin(Math.PI * clamp((f - 392) / 20)) }));
      break;
    }
    case 'whisper': {
      const lean = f > 478 && f < 572 ? sstep((f - 478) / 12) : 0;
      A.push(P('lustig', 'lustig', S_(0.12 * lean, 0, LZ), { mode: 'stand', expr: 'sly', whisper: f > 478 && f < 572, seed: 3, blink: bl(3), headTilt: 10 * lean }, { roll: -0.09 * lean + 0.02 * Math.sin(f * 0.3) * lean }));
      const ds = salonDealers(f, f < 470 ? ALL : CLOSE, bl, { lean: lean * (0.7 + 0.3 * Math.sin(f * 0.2)) });
      ds.forEach((d, i) => { d.opts.expr = f > 500 ? (i === 0 ? 'whistle' : 'nervous') : 'neutral'; });
      A.push(...ds);
      break;
    }
    case 'model': {
      A.push(P('lustig', 'lustig', S_(0, 0, LZ), { mode: 'stand', expr: f < 588 ? 'smile' : 'grin', present: f > 582 ? 0.5 + 0.3 * Math.sin((f - 582) * 0.4) : undefined, seed: 3, blink: bl(3) }, { roll: f > 582 ? -0.05 : 0 }));
      const hop = f > 600 && f < 614 ? 0.2 * Math.sin(Math.PI * (f - 600) / 14) : 0;
      A.push(...salonDealers(f, ALL, bl, { hop }).map((d) => (d.opts.expr = f > 600 ? 'shock' : 'neutral', d)));
      break;
    }
    case 'iron': {
      A.push(P('lustig', 'lustig', S_(0, 0.03 * Math.abs(Math.sin(f * 0.3)), LZ), { mode: 'stand', expr: 'grin', present: 0.6 + 0.35 * Math.sin(f * 0.35), seed: 3, blink: bl(3) }, { roll: 0.05 * Math.sin(f * 0.18) }));
      const hop = f > 638 && f < 652 ? 0.22 * Math.sin(Math.PI * (f - 638) / 14) : 0;
      A.push(...salonDealers(f, ALL, bl, { hop, laugh: f > 655 ? 1 : 0 }).map((d, i) => (d.opts.expr = f < 648 ? 'shock' : i % 2 ? 'grin' : 'laugh', d)));
      if (f >= 650) A.push(FX('stars', 'stars', S_(1.45, 1.75, -3.7), ((f - 650) / 40) % 1, 1.0));
      break;
    }
    case 'shh': {
      A.push(P('lustig', 'lustig', S_(0, 0, LZ + 0.1 * sstep((f - 690) / 20)), { mode: 'stand', expr: 'sly', shh: f > 694, seed: 3, blink: bl(3), headTilt: -6 + 4 * idle(f, 2) }, { roll: 0.04 * Math.sin(f * 0.12) }));
      break;
    }
    case 'pay': {
      const catchE = f > 812 && f < 826 ? 0.06 * Math.sin(Math.PI * (f - 812) / 14) : 0;
      A.push(P('lustig', 'lustig', S_(0, catchE, LZ), { mode: 'stand', expr: f < 770 ? 'smile' : 'grin', seed: 3, blink: bl(3), present: f > 770 ? 0.35 + 0.25 * Math.sin((f - 770) * 0.3) : undefined, headTilt: 4 * idle(f, 3) }, { roll: f > 770 ? 0.04 * Math.sin((f - 770) * 0.2) : 0 }));
      const push = f > 744 && f < 776 ? Math.sin(Math.PI * (f - 744) / 32) : 0;
      A.push(...salonDealers(f, CLOSE, bl, { lean: push }).map((d, i) => (d.opts.expr = i === 0 ? (f < 790 ? 'grin' : 'nervous') : 'neutral', d)));
      break;
    }
    case 'escape': {
      const K = carAt(f);
      const inside = f >= 845;
      let pos, mode = 'stand', ph = 0, roll = 0;
      if (f < 840) { const w = walkTo(f, 828, 840, [6.4, 0, -2.9], [K.x + 1.3, 0, -4.4]); pos = w.pos; mode = w.walking ? 'stroll' : 'stand'; ph = w.phase; roll = 0.05 * Math.sin(f * 0.4); }
      else if (f < 848) { const c = (f - 840) / 8; pos = [lerp(K.x + 1.3, K.x + 0.3, sstep(c)), 0.72 * sstep(c) + 0.25 * Math.sin(Math.PI * c), lerp(-4.4, K.z + 0.6, sstep(c))]; mode = c < 0.6 ? 'stand' : 'sit'; roll = -0.15 * Math.sin(Math.PI * c); }
      else pos = [K.x + 0.3, 0.72 + K.bounce, K.z + 0.6];
      A.push(P('lustig', 'lustig', pos, { mode, phase: ph, expr: 'grin', case: f < 846 ? 1 : 0, present: f > 852 ? 0.75 + 0.25 * Math.sin(f * 0.6) : undefined, seed: 3, blink: bl(3) }, { roll: inside && f > 852 ? 0.04 * Math.sin(f * 0.5) : roll }));
      if (f >= 853 && f < 873) A.push(FX('dust', 'puff', [K.x, 0, K.z + 2.6], (f - 853) / 20, 3.2));
      break;
    }
    case 'police': {
      const walkIn = clamp((f - 897) / 38), turn = f >= 968;
      let x = lerp(-26.3, -29.3, walkIn), z = lerp(24.0, 21.9, walkIn), walking = walkIn > 0 && walkIn < 1;
      if (f > 970) { const t2 = clamp((f - 970) / 30); x = lerp(-29.3, -25.8, t2); z = lerp(21.9, 24.6, t2); walking = t2 < 1; }
      const fidget = !walking ? 0.03 * Math.sin(f * 0.6) : 0;
      A.push(P('poisson', 'poisson', [x, 0, z], { mode: walking ? 'stroll' : 'stand', phase: (f - 897) / 15, expr: f < 940 ? 'stern' : 'pained', blush: f < 942 ? 0 : clamp((f - 942) / 18), seed: 5, blink: bl(5), headTilt: f > 945 ? -8 + 4 * Math.sin(f * 0.3) : 0 },
        { flip: turn, roll: walking ? 0.04 * Math.sin(f * 0.42) : fidget }));
      A.push(P('gendarme', 'gendarme', [-30.25, 0, 19.7], { mode: 'stand', expr: f < 960 ? 'neutral' : 'nervous', seed: 11, blink: bl(11), look: f > 950 ? 1 : 0, headTilt: f > 960 ? 8 : 0 }, { roll: f > 960 ? -0.06 * sstep((f - 960) / 12) : 0 }));
      break;
    }
    case 'again': {
      const w = walkTo(f, 1004, 1046, [2.6, 0, LZ + 0.2], [0, 0, LZ]);
      const hop = f > 1083 && f < 1095 ? 0.08 * Math.sin(Math.PI * (f - 1083) / 12) : 0;
      const expr = f < 1083 ? 'sly' : 'wink';
      A.push(P('lustig', 'lustig', [S_(0, 0, 0)[0] + w.pos[0], hop, w.pos[2]], { mode: w.walking ? 'stroll' : 'stand', phase: w.phase, expr, case: f < 1050 ? 1 : 0, present: f > 1055 && f < 1083 ? 0.5 + 0.3 * Math.sin(f * 0.4) : undefined, tip: f >= 1083, seed: 3, blink: f < 1080 ? bl(3) : 0 },
        { roll: w.walking ? 0.05 * Math.sin(f * 0.4) : f >= 1083 ? 0.06 : 0, flip: w.walking }));
      A.push(...salonDealers(f, f < 1040 ? [['n1', 0], ['n2', 1], ['n3', 2], ['n4', 3]] : [['n1', 0], ['n2', 1], ['n4', 3]], bl, { lean: f > 1050 ? 0.6 : 0, laugh: f > 1060 ? 0.6 : 0 }).map((d) => (d.opts.expr = f > 1060 ? 'grin' : 'neutral', d)));
      if (f >= 1090) A.push(FX('sold3', 'sold', S_(0.55, 1.95, LZ + 1.3), (f - 1090) / 8, 1.1, { rot: -6 }));
      break;
    }
  }
  return A;
};

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 35, el: 45, sun: [1.0, 0.95, 0.86], sunI: 2.3, sky: '#5a94d8', hor: '#cde0f0', hemiSky: '#c0d6f0', hemiGnd: '#9a8a70', hemiI: 1.15, fog: [60, 900], card: [1, 1, 1], sat: 1.06, gain: 1.0, sunDisc: 0 },
  salon: { az: 120, el: 62, sun: [1.0, 0.86, 0.66], sunI: 1.7, sky: '#f0d8a8', hor: '#f4dcb0', hemiSky: '#ffe8c0', hemiGnd: '#8a5a3a', hemiI: 1.35, fog: [40, 900], card: [1.0, 0.95, 0.86], sat: 1.08, gain: 1.0, sunDisc: 0 },
  office: { az: 300, el: 55, sun: [1.0, 0.85, 0.62], sunI: 1.6, sky: '#e8d0a0', hor: '#ecd8b0', hemiSky: '#f6e0b8', hemiGnd: '#6a4a30', hemiI: 1.25, fog: [40, 900], card: [1.0, 0.93, 0.82], sat: 1.06, gain: 0.98, sunDisc: 0 },
};
export const lightFor = (f) => LIGHTS[shotAt(f).light];
export const focusAt = (f) => {
  const s = shotAt(f).id, K = carAt(f);
  return { hook: [0, 0, -1], bolt: [0, 0, 0], office: O_(0, 0, -1), whisper: S_(0, 0, -2.5), model: S_(0, 0, -3.5), iron: S_(0, 0, -2.5), shh: S_(0, 0, -4),
    pay: S_(0, 0, -3.5), escape: [3, 0, K.on ? K.z + 3 : -6], police: [-29, 0, 22], again: S_(0, 0, -2.5) }[s];
};
