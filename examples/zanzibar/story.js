// "The Shortest War" (Anglo-Zanzibar War, 27 Aug 1896) — pure functions of the frame number (30 fps).
export const FPS = 30, N = 874;
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
const q2 = (v) => Math.round(v * 10) / 10;

// ---------- layout ----------
export const PAL = [0, 0, -14];          // palace centre; front face at z = -9, 22 m wide, 12 m high
export const BALC_Y = 7.5, BALC_Z = -7.8; // balcony floor height and where people stand on it
export const TOWER = [14, 0, -12];       // clock tower, clock face at y 21.5 on z = -10
export const LAND_Y = 0.6;
export const SHIPS = [{ x: -56, z: 86, s: 0.72 }, { x: -28, z: 81, s: 0.86 }, { x: 0, z: 78, s: 1 }, { x: 28, z: 81, s: 0.86 }, { x: 56, z: 86, s: 0.72 }];
export const DECK_Y = 3.0;               // flagship deck height
export const YACHT = [-24, 0, 16];
export const GUARD = [-2.4, LAND_Y, -3.2];
const ADM = [0.4, DECK_Y, 77.4];

// ---------- shots ----------
export const SHOTS = [
  { id: 'hook', a: 0, b: 145, light: 'day' },
  { id: 'harbor', a: 145, b: 224, light: 'day' },
  { id: 'balcony', a: 224, b: 352, light: 'day' },
  { id: 'warn', a: 352, b: 437, light: 'day' },
  { id: 'stays', a: 437, b: 489, light: 'day' },
  { id: 'clock', a: 489, b: 524, light: 'day' },
  { id: 'fire', a: 524, b: 588, light: 'day' },
  { id: 'crumble', a: 588, b: 685, light: 'smoke' },
  { id: 'over', a: 685, b: 762, light: 'smoke' },
  { id: 'bill', a: 762, b: 874, light: 'smoke' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1];
export const FLASH = [[142, 6], [586, 6]];
export const flashAt = (f) => { let v = 0; for (const [a, d] of FLASH) { const t = (f - a) / d; if (t >= 0 && t <= 1) v = Math.max(v, Math.sin(t * Math.PI)); } return v; };
// gun flashes: [frame, ship index, gun slot]
export const SHOTS_FIRED = [[536, 0, 0], [541, 1, 1], [546, 2, 0], [551, 3, 1], [556, 4, 0], [566, 2, 2], [570, 1, 0], [574, 3, 2], [578, 0, 1], [582, 4, 2]];
export const HITS = [592, 597, 602, 608, 614, 620];
export const KICKS = [[509, 0.5], ...SHOTS_FIRED.map(([a]) => [a, 0.45]), ...HITS.map((a) => [a, 0.7]), [650, 0.5], [738, 0.4], [836, 0.9]];
const kickAt = (f) => { let k = 0; for (const [a, s] of KICKS) { const d = f - a; if (d >= 0 && d < 7) k += s * (d % 2 ? -1 : 1) * (1 - d / 7); } return k; };

// ---------- world state ----------
export const worldAt = (f) => {
  const s = shotAt(f).id;
  const after = f >= 588;
  return {
    shot: s,
    collapse: s === 'crumble' ? clamp((f - 596) / 46) : after ? 1 : 0,
    sink: s === 'crumble' ? clamp((f - 646) / 40) : after ? 1 : 0,
    clock: s === 'clock' ? (f < 495 ? [8, 57] : f < 502 ? [8, 58] : f < 509 ? [8, 59] : [9, 0]) : s === 'stays' ? [8, 59] : f < 437 ? [8, 50] : [9, 38],
    flag: f < 735 ? 1 : 1 - clamp((f - 735) / 14),
  };
};

// ---------- cameras ----------
const C = (pos, look, fov = 40, roll = 0) => ({ pos, look, fov, roll });
const glide = (a, b, t) => C(L3(a.pos, b.pos, t), L3(a.look, b.look, t), lerp(a.fov, b.fov, t), lerp(a.roll, b.roll, t));
const creep = (c, k) => { const d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]]; return { ...c, pos: [c.pos[0] + d[0] * k, c.pos[1] + d[1] * k, c.pos[2] + d[2] * k] }; };
const orbit = (c, deg) => { const a = deg * Math.PI / 180, dx = c.pos[0] - c.look[0], dz = c.pos[2] - c.look[2];
  return { ...c, pos: [c.look[0] + dx * Math.cos(a) - dz * Math.sin(a), c.pos[1], c.look[2] + dx * Math.sin(a) + dz * Math.cos(a)] }; };
const drift = (c, f, k = 1) => ({ ...c, pos: [c.pos[0] + 0.012 * k * Math.sin(f * 0.07), c.pos[1] + 0.008 * k * Math.sin(f * 0.11 + 1), c.pos[2]], roll: c.roll + 0.35 * k * Math.sin(f * 0.05 + 2) });
const A_ = (x, y, z) => [ADM[0] + x, ADM[1] + y, ADM[2] + z];

export const camAt = (f) => {
  const s = shotAt(f), t = (f - s.a) / (s.b - s.a);
  let c;
  switch (s.id) {
    case 'hook': c = orbit(glide(C(A_(0.35, 1.6, 3.4), A_(0.05, 1.45, 0), 40, -2), C(A_(0.2, 1.62, 2.4), A_(0.1, 1.5, 0), 40, 1.5), sstep(f / 140)), 10 - 16 * sstep(f / 145)); break;
    case 'harbor': c = glide(C([34, 34, 70], [2, 6, -12], 44, 0), C([10, 12, 22], [1, 8.5, -12], 42, -1.5), sstep((f - 145) / 75)); break;
    case 'balcony': c = orbit(creep(C([0.8, BALC_Y + 2.9, -2.4], [0.1, BALC_Y + 1.35, BALC_Z], 32, 0), 0.0016 * (f - 224)), 9 * sstep(t) - 4); break;
    case 'warn': c = orbit(creep(C(A_(0.0, 1.75, 3.8), A_(0.15, 1.8, 0), 40, 0), 0.0025 * (f - 352)), -8 + 12 * sstep(t)); break;
    case 'stays': c = creep(C([-0.9, BALC_Y + 2.6, -2.6], [0.1, BALC_Y + 1.4, BALC_Z], 32, -3), 0.006 * (f - 437) + 0.06 * easeOut((f - 445) / 10)); break;
    case 'clock': c = creep(C([TOWER[0] + 0.6, 20.2, -2.5], [TOWER[0], 21.5, -10], 32, 0), 0.006 * (f - 489) + (f >= 509 ? 0.08 * easeOut((f - 509) / 6) : 0));
      c.roll = f >= 509 ? 4 * easeOut((f - 509) / 8) : 0; break;
    case 'fire': c = glide(C([-92, 15, 44], [-24, 3, 92], 42, -2), C([-84, 10, 50], [-14, 4, 92], 40, 2), sstep((f - 524) / 64)); break;
    case 'crumble': {
      const a = C([10, 8, 30], [-1, 7, -9], 42, 0), b = C([6, 6, 40], [-23, 1.5, 16], 40, -2);
      c = glide(a, b, sstep((f - 628) / 24));
      c = creep(c, 0.0012 * (f - 588));
      break;
    }
    case 'over': c = orbit(creep(C(A_(-0.2, 1.62, 3.0), A_(0.05, 1.5, 0), 40, 0), 0.002 * (f - 685)), 12 - 10 * sstep(t)); break;
    case 'bill': c = creep(C([GUARD[0] + 0.5, GUARD[1] + 1.55, 1.2], [GUARD[0], GUARD[1] + 1.45, GUARD[2]], 40, 0), 0.0028 * (f - 762) + (f >= 836 ? 0.1 * easeOut((f - 836) / 8) : 0));
      c.roll = f >= 836 ? -4 * easeOut((f - 836) / 10) : 0; break;
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
    case 'hook': case 'warn': case 'over': return [10, dist(A_(0, 1.5, 0))];
    case 'balcony': case 'stays': return [9, dist([0, BALC_Y + 1.5, BALC_Z])];
    case 'bill': return [10, dist([GUARD[0], GUARD[1] + 1.5, GUARD[2]])];
    default: return [0, 10];
  }
};
export const focusAt = (f) => {
  const s = shotAt(f).id;
  return { hook: ADM, warn: ADM, over: ADM, harbor: [0, 0, 0], balcony: [0, BALC_Y, BALC_Z], stays: [0, BALC_Y, BALC_Z], clock: [TOWER[0], 15, -10], fire: [0, 0, 80], crumble: [-8, 0, 0], bill: GUARD }[s];
};

// ---------- actors ----------
const P = (id, who, pos, opts = {}, extra = {}) => ({ id, kind: 'person', who, pos, opts, ...extra });
const FX = (id, fx, pos, t, size, extra = {}) => ({ id, kind: 'fx', fx, pos, t, size, ...extra });
const walkTo = (f, a, b, from, to) => { const t = clamp((f - a) / (b - a)); return { pos: L3(from, to, t), walking: t > 0 && t < 1, phase: (f - a) / 16 }; };
export const gunPos = (i, slot) => { const S = SHIPS[i]; return [S.x + (slot - 1) * 7 * S.s, 2.2 * S.s, S.z - 4.7 * S.s]; };
const loop = (f, a, period, off) => (((f - a) / period + off) % 1 + 1) % 1;
const palaceSmoke = (f, A, n = 6, big = 1) => {
  for (let i = 0; i < n; i++) {
    const t = loop(f, 0, 70 + 20 * R(i), R(i * 3));
    A.push(FX('ps' + i, 'smoke', [PAL[0] - 9 + 18 * R(i * 5), 6 + 9 * t + 3 * R(i), -6 + 2 * R(i * 7)], t, (5 + 3 * R(i * 2)) * big, { seed: i + 1, col: '#b8b0a6' }));
  }
};

export const actorsAt = (f) => {
  const s = shotAt(f).id, A = [];
  const bl = (seed) => blinkAt(f, seed);
  switch (s) {
    case 'hook': {
      const m = 38 * sstep((f - 40) / 70);
      A.push(P('adm', 'admiral', ADM, { mode: 'stand', expr: f < 100 ? 'sly' : 'grin', watch: true, seed: 5, blink: bl(5), headTilt: 4 * idle(f, 1) - (f > 40 && f < 110 ? 4 : 0) }, { roll: 0.03 * Math.sin(f * 0.12) }));
      A.push(FX('watch', 'watch', A_(0.24, 1.06, 0.3), 0, 0.42, { k: [Math.round(m * 2) / 2, f >= 112 ? q2(clamp((f - 112) / 10)) : -1], min: m, label: f >= 112 ? '38 MIN' : '', lt: clamp((f - 112) / 10), rotZ: 0.05 * Math.sin(f * 0.15) }));
      break;
    }
    case 'harbor': break;
    case 'balcony': {
      if (f < 272) {
        const sink = 1.6 * easeIn((f - 242) / 28);
        A.push(P('old', 'oldSultan', [-0.1, BALC_Y - sink, BALC_Z], { mode: 'stand', expr: f < 238 ? 'smile' : 'relief', present: f < 240 ? 0.4 + 0.25 * Math.sin(f * 0.35) : undefined, seed: 7, blink: f < 238 ? bl(7) : 0, headTilt: f < 240 ? 4 * idle(f, 3) : 8 }, { roll: 0.04 * Math.sin(f * 0.2) }));
      }
      if (f >= 262 && f < 290) A.push(FX('puff', 'smoke', [-0.1, BALC_Y + 1.0, BALC_Z + 0.2], (f - 262) / 28, 1.4, { seed: 3, col: '#f2ece0' }));
      if (f >= 276) {
        const w = walkTo(f, 276, 302, [1.9, BALC_Y, BALC_Z - 0.1], [0.2, BALC_Y, BALC_Z]);
        const up = f >= 308 ? back((f - 308) / 9, 2) : undefined, hop = f >= 308 && f < 320 ? 0.08 * Math.sin(Math.PI * (f - 308) / 12) : 0;
        A.push(P('khalid', 'khalid', [w.pos[0], w.pos[1] + hop, w.pos[2]], { mode: w.walking ? 'stroll' : 'stand', phase: w.phase, expr: f < 306 ? 'sly' : 'laugh', armsUp: up !== undefined ? clamp(up, 0, 1.15) : undefined, seed: 11, blink: bl(11), headTilt: f > 320 ? 5 * Math.sin((f - 320) * 0.3) : 3 * idle(f, 2) }, { roll: w.walking ? 0.05 * Math.sin(f * 0.4) : 0.05 * Math.sin(f * 0.25), flip: w.walking }));
      }
      break;
    }
    case 'warn': {
      const k = f >= 362 ? back((f - 362) / 10, 2) : 0;
      A.push(P('adm', 'admiral', ADM, { mode: 'stand', expr: 'stern', point: clamp(k, 0, 1.1), seed: 5, blink: bl(5), headTilt: f > 395 && f < 430 ? 4 * Math.sin((f - 395) * 0.45) : 3 * idle(f, 1) }, { roll: f > 395 && f < 430 ? 0.04 * Math.sin((f - 395) * 0.45) : 0.02 }));
      if (f >= 394) A.push(FX('sign', 'stamp', A_(0.22, 2.68, 0.4), (f - 394) / 8, 0.95, { text: 'LEAVE BY 9!', bg: '#c8243a', rot: -6, fontPx: 76 }));
      break;
    }
    case 'stays': {
      const shake = f > 452 && f < 476 ? 9 * Math.sin((f - 452) * 0.55) : 2 * idle(f, 2);
      A.push(P('khalid', 'khalid', [0.1, BALC_Y + (f >= 443 && f < 449 ? 0.04 * Math.sin(Math.PI * (f - 443) / 6) : 0), BALC_Z], { mode: 'stand', expr: 'stern', cross: true, seed: 11, blink: bl(11), headTilt: shake }, { roll: 0.02 * Math.sin(f * 0.2) }));
      break;
    }
    case 'clock': break;
    case 'fire': {
      for (const [a, i, slot] of SHOTS_FIRED) {
        const d = f - a; if (d < 0) continue;
        const g = gunPos(i, slot);
        if (d < 8) A.push(FX('bang' + a, 'bang', [g[0], g[1], g[2] - 1.2], d / 8, 8 * SHIPS[i].s));
        if (d < 50) A.push(FX('smk' + a, 'smoke', [g[0] - 1, g[1] + 0.5 + d * 0.03, g[2] - 3 - d * 0.04], d / 50, 11 * SHIPS[i].s, { seed: a, col: '#e4e0d8' }));
      }
      break;
    }
    case 'crumble': {
      HITS.forEach((a, i) => { const d = f - a; if (d >= 0 && d < 9) A.push(FX('hit' + i, 'bang', [PAL[0] - 8 + 16 * R(i * 3.3), 4 + 6 * R(i * 1.7), -7.5], d / 9, 6)); });
      palaceSmoke(f, A, 6, 1);
      if (f >= 646) for (let i = 0; i < 3; i++) { const t = loop(f, 646, 30, i / 3); A.push(FX('ys' + i, 'smoke', [YACHT[0] - 4 + 4 * i, 1 + 3 * t, YACHT[2] + 2], t, 4, { seed: 20 + i, col: '#e8f4f6' })); }
      break;
    }
    case 'over': {
      const shut = f >= 738;
      A.push(P('adm', 'admiral', ADM, { mode: 'stand', expr: f < 738 ? 'smile' : 'grin', watch: !shut, present: shut ? 0.5 + 0.3 * Math.sin((f - 738) * 0.4) : undefined, seed: 5, blink: bl(5), headTilt: shut ? 6 : 3 * idle(f, 1) }, { roll: shut ? 0.05 * Math.sin((f - 738) * 0.3) : 0.02 }));
      if (!shut) A.push(FX('watch', 'watch', A_(0.24, 1.06, 0.3), 0, 0.42, { k: [38, q2(clamp((f - 690) / 10))], min: 38, label: f >= 690 ? '38 MIN' : '', lt: clamp((f - 690) / 10), rotZ: 0.05 * Math.sin(f * 0.15) }));
      palaceSmoke(f, A, 5, 1.4);
      break;
    }
    case 'bill': {
      const roll = f >= 806 ? (f - 806) / 30 : -1;
      const shock = f >= 836;
      A.push(P('guard', 'guard', GUARD, { mode: 'stand', expr: f < 800 ? 'dazed' : shock ? 'shock' : 'nervous', hold: roll >= 0, soot: true, seed: 13, blink: shock ? 0 : bl(13), headTilt: shock ? 0 : 5 * Math.sin(f * 0.13) }, { roll: shock ? 0.05 * Math.sin((f - 836) * 0.9) * Math.exp(-(f - 836) * 0.08) : 0.03 * Math.sin(f * 0.15) }));
      if (roll >= 0) A.push(FX('bill', 'bill', [GUARD[0] + 0.02, GUARD[1] + 0.36, GUARD[2] + 0.32], roll, 0.62));
      if (f < 800) A.push(FX('soot', 'smoke', [GUARD[0] - 0.6, GUARD[1] + 2.1 + 0.01 * (f - 762), GUARD[2] - 0.6], loop(f, 762, 40, 0.2), 0.9, { seed: 31, col: '#8a8480' }));
      palaceSmoke(f, A, 6, 1.2);
      break;
    }
  }
  return A;
};

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 25, el: 55, sun: [1.0, 0.96, 0.86], sunI: 2.5, sky: '#3f94e6', hor: '#cfe8f4', hemiSky: '#c6e0f6', hemiGnd: '#c8a878', hemiI: 1.15, fog: [80, 700], card: [1, 1, 1], sat: 1.1, gain: 1.0, sunDisc: 0 },
  smoke: { az: 40, el: 38, sun: [1.0, 0.86, 0.66], sunI: 2.1, sky: '#7a94b0', hor: '#e2d2bc', hemiSky: '#d8d0c4', hemiGnd: '#a88a68', hemiI: 1.15, fog: [60, 520], card: [1, 0.96, 0.9], sat: 1.0, gain: 0.98, sunDisc: 0 },
};
export const lightFor = (f) => LIGHTS[shotAt(f).light];
