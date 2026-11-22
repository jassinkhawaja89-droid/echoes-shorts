// "Private Wojtek" (Polish II Corps, 1942-1944) — pure functions of the frame number (30 fps).
export const FPS = 30, N = 867;
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
export const CAMP = [0, 0, 0], BEER = [0, 0, 14], IRAN = [-120, 0, 0], PORT = [126, 0, 0], DESK = [0, 0, -40], CASSINO = [0, 0, -150], BADGE = [-40, 0, -40];
export const QUAY_X = 130;

// ---------- shots ----------
export const SHOTS = [
  { id: 'line', a: 0, b: 160, light: 'day' },
  { id: 'beer', a: 160, b: 236, light: 'day' },
  { id: 'reveal', a: 236, b: 280, light: 'day' },
  { id: 'iran', a: 280, b: 384, light: 'desert' },
  { id: 'ship', a: 384, b: 468, light: 'day' },
  { id: 'enlist', a: 468, b: 578, light: 'day' },
  { id: 'cassino', a: 578, b: 714, light: 'autumn' },
  { id: 'paint', a: 714, b: 794, light: 'day' },
  { id: 'emblem', a: 794, b: 867, light: 'day' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1];
export const FLASH = [[278, 6], [576, 6]];
export const flashAt = (f) => { let v = 0; for (const [a, d] of FLASH) { const t = (f - a) / d; if (t >= 0 && t <= 1) v = Math.max(v, Math.sin(t * Math.PI)); } return v; };
export const STAMP_F = 500, THROW_F = 200, BUTTON_F = 842;
export const KICKS = [[THROW_F, 0.5], [244, 0.4], [STAMP_F, 0.6], [640, 0.3], [672, 0.3], [BUTTON_F, 0.6]];
const kickAt = (f) => { let k = 0; for (const [a, s] of KICKS) { const d = f - a; if (d >= 0 && d < 7) k += s * (d % 2 ? -1 : 1) * (1 - d / 7); } return k; };

// ---------- world state ----------
export const worldAt = (f) => ({ shot: shotAt(f).id, emblem: clamp((f - 726) / 64) });

// ---------- cameras ----------
const C = (pos, look, fov = 40, roll = 0) => ({ pos, look, fov, roll });
const glide = (a, b, t) => C(L3(a.pos, b.pos, t), L3(a.look, b.look, t), lerp(a.fov, b.fov, t), lerp(a.roll, b.roll, t));
const creep = (c, k) => { const d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]]; return { ...c, pos: [c.pos[0] + d[0] * k, c.pos[1] + d[1] * k, c.pos[2] + d[2] * k] }; };
const orbit = (c, deg) => { const a = deg * Math.PI / 180, dx = c.pos[0] - c.look[0], dz = c.pos[2] - c.look[2];
  return { ...c, pos: [c.look[0] + dx * Math.cos(a) - dz * Math.sin(a), c.pos[1], c.look[2] + dx * Math.sin(a) + dz * Math.cos(a)] }; };
const drift = (c, f, k = 1) => ({ ...c, pos: [c.pos[0] + 0.012 * k * Math.sin(f * 0.07), c.pos[1] + 0.008 * k * Math.sin(f * 0.11 + 1), c.pos[2]], roll: c.roll + 0.35 * k * Math.sin(f * 0.05 + 2) });
const at = (o) => (x, y, z) => [o[0] + x, y, o[2] + z];
const Cm = at(CAMP), Be = at(BEER), I_ = at(IRAN), P_ = at(PORT), D_ = at(DESK), K_ = at(CASSINO), B_ = at(BADGE);

// sergeant walks along the line during 'line'
const sgX = (f) => lerp(-3.2, 2.2, sstep((f - 6) / 120));
// bear walk across Monte Cassino
const bearCassX = (f) => lerp(-4.5, 3.2, clamp((f - 584) / 124));

export const camAt = (f) => {
  const s = shotAt(f), t = (f - s.a) / (s.b - s.a);
  let c;
  switch (s.id) {
    case 'line': { const x = sgX(f); c = C(Cm(x + 0.6, 1.7, 4.6), Cm(x + 0.2, 1.35, -0.6), 44, -1 + 2 * t); c = creep(c, 0.12 * sstep(t)); break; }
    case 'beer': c = orbit(creep(C(Be(0, 1.6, 5.4), Be(0, 1.3, -1.2), 44, 0), 0.0015 * (f - 160)), -6 + 10 * sstep(t)); break;
    case 'reveal': { const k = easeOut((f - 238) / 20); c = C(Be(0, 1.55 + 0.2 * k, 5.0 - 1.6 * k), Be(0.1, 1.55 + 0.35 * k, -1.6), 44, 2 * k); break; }
    case 'iran': c = orbit(creep(C(I_(0, 1.3, 4.4), I_(0, 0.9, 0), 42, 0), 0.0016 * (f - 280)), 10 - 22 * sstep(t)); break;
    case 'ship': c = glide(C(P_(-5.4, 1.7, 1.2), P_(0.4, 1.3, -0.3), 44, 0), C(P_(-4.8, 1.6, -1.0), P_(0.4, 1.3, 0.0), 44, -1.5), sstep(t)); break;
    case 'enlist': {
      const a = C(D_(0.25, 1.65, 2.7), D_(0.3, 1.25, -0.6), 42, 0), b = C(D_(-0.6, 1.7, 5.6), D_(-0.6, 1.35, 0), 44, 1);
      c = glide(a, b, sstep((f - 504) / 32)); c = creep(c, 0.0008 * (f - 468)); break;
    }
    case 'cassino': { const x = bearCassX(f); c = C(K_(x - 0.6, 1.8, 6.0), K_(x + 0.4, 1.9, 0), 46, -1); c = orbit(c, -4 + 8 * t); break; }
    case 'paint': c = glide(C(B_(-1.0, 1.7, 6.6), B_(-0.2, 1.6, 0), 46, -1), C(B_(-0.4, 1.8, 5.8), B_(0.1, 1.7, 0), 44, 0.5), sstep(t)); break;
    case 'emblem': {
      c = C(B_(0.35, 1.7, 6.8), B_(0.35, 1.55, 0), 46, 0);
      c = creep(c, 0.0012 * (f - 794) + (f >= BUTTON_F ? 0.04 * easeOut((f - BUTTON_F) / 8) : 0));
      c.roll = f >= BUTTON_F ? 2.5 * easeOut((f - BUTTON_F) / 10) : 0; break;
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
    case 'line': return [9, dist(Cm(sgX(f), 1.5, 0))];
    case 'reveal': return [10, dist(Be(0, 1.6, -1.6))];
    case 'iran': return [9, dist(I_(0, 0.8, 0))];
    case 'enlist': return [9, dist(f < 512 ? D_(0.2, 0.9, -0.2) : D_(-0.4, 1.4, 0))];
    case 'emblem': return [8, dist(B_(1.0, 1.5, 0.9))];
    default: return [0, 10];
  }
};
export const focusAt = (f) => {
  const s = shotAt(f).id;
  return { line: CAMP, beer: BEER, reveal: BEER, iran: IRAN, ship: PORT, enlist: DESK, cassino: CASSINO, paint: BADGE, emblem: BADGE }[s];
};

// ---------- actors ----------
const P = (id, who, pos, opts = {}, extra = {}) => ({ id, kind: 'person', who, pos, opts, ...extra });
const BR = (id, pos, opts = {}, extra = {}) => ({ id, kind: 'bear', pos, opts, ...extra });
const FX = (id, fx, pos, t, size, extra = {}) => ({ id, kind: 'fx', fx, pos, t, size, ...extra });
const q1 = (v) => Math.round(v * 10) / 10;

export const actorsAt = (f) => {
  const s = shotAt(f).id, A = [];
  const bl = (seed) => blinkAt(f, seed);
  switch (s) {
    case 'line': {
      [-3.0, -1.6, -0.2, 1.2].forEach((x, i) => {
        const sal = clamp((f - (20 + i * 26)) / 8);
        A.push(P('s' + i, i % 2 ? 'soldier2' : 'soldier', Cm(x, 0, -1.2), { mode: 'stand', expr: 'stern', salute: q1(back(sal)), seed: 11 + i, blink: bl(11 + i), headTilt: 2 * idle(f, i) }));
      });
      const x = sgX(f), walking = f > 6 && f < 126;
      const surprised = f >= 132;
      A.push(P('sgt', 'sergeant', Cm(x, 0, 0.3), { mode: walking ? 'stroll' : 'stand', phase: q1(((f - 6) / 26) % 1), expr: surprised ? 'shock' : 'stern', paper: true, seed: 5, blink: bl(5), headTilt: surprised ? -6 : 3 * idle(f, 3) }, { roll: surprised ? 0.03 * Math.sin(f * 0.5) : 0 }));
      break;
    }
    case 'beer': {
      A.push(P('d1', 'soldier', Be(-1.0, 0, -0.2), { mode: 'stand', expr: f < 196 ? 'laugh' : 'shock', cheer: q1(0.6 + 0.4 * Math.abs(Math.sin(f * 0.18))), mug: true, seed: 21, blink: bl(21) }, { roll: 0.03 * Math.sin(f * 0.18) }));
      A.push(P('d2', 'soldier2', Be(1.0, 0, -0.3), { mode: 'stand', expr: f < 196 ? 'grin' : 'shock', cheer: q1(0.6 + 0.4 * Math.abs(Math.sin(f * 0.18 + 1))), mug: true, seed: 23, blink: bl(23) }, { roll: -0.03 * Math.sin(f * 0.18) }));
      A.push(FX('dust', 'smoke', Be(0.1, 0.9, -2.6), 0.5, 2.6, { seed: 3 + Math.floor(f / 4) % 5, col: '#c8b08a' }));
      if (f >= THROW_F) {
        const tt = clamp((f - THROW_F) / 18);
        A.push(P('thrown', 'soldier', Be(-0.4 - 2.0 * tt, 1.6 * Math.sin(Math.PI * tt), -2.4 + 0.4 * tt), { mode: 'fall', expr: tt < 1 ? 'shock' : 'dazed', seed: 25 }, { roll: tt < 1 ? -tt * 4 : -1.4, scale: 0.9, noBlob: tt < 1 }));
        if (tt >= 1) A.push(FX('stars0', 'stars', Be(-2.4, 0.9, -2.0), q1(((f - THROW_F) / 20) % 1), 0.8));
      }
      break;
    }
    case 'reveal': {
      const k = easeOut((f - 236) / 14);
      A.push(BR('bear', Be(0.1, 0, -1.6 - 0.8 * (1 - k)), { expr: 'grin', mug: q1(back(clamp((f - 240) / 10))), cap: true }, { scale: 1.08, roll: 0.03 * Math.sin(f * 0.25) }));
      A.push(FX('dust', 'smoke', Be(0.2, 0.9, -2.9), clamp(0.5 + (f - 236) / 60), 2.6, { seed: 3, col: '#c8b08a' }));
      A.push(P('thrown', 'soldier', Be(-2.2, 0, -1.9), { mode: 'fall', expr: 'dazed', seed: 25 }, { roll: -1.4, scale: 0.9 }));
      A.push(FX('stars0', 'stars', Be(-2.4, 0.9, -1.8), q1(((f - THROW_F) / 20) % 1), 0.8));
      break;
    }
    case 'iran': {
      A.push(BR('cub', I_(0.05, 0, 0), { expr: f < 340 ? 'happy' : 'grin', bottle: true, blink: bl(7) }, { scale: 0.42, roll: 0.05 * Math.sin(f * 0.2) }));
      A.push(P('i1', 'soldier', I_(-0.95, 0, -0.5), { mode: 'stand', expr: 'smile_closed', point: q1(0.4 + 0.2 * Math.sin(f * 0.1)), seed: 31, blink: bl(31), headTilt: 6 + 3 * idle(f, 2) }));
      A.push(P('i2', 'soldier2', I_(0.95, 0, -0.6), { mode: 'stand', expr: 'grin', seed: 33, blink: bl(33), headTilt: -5 + 3 * idle(f, 4) }, { flip: true }));
      break;
    }
    case 'ship': {
      const no = f >= 410;
      A.push(P('sentry', 'sentry', P_(0.9, 0, -1.1), { mode: 'stand', expr: no ? 'stern' : 'neutral', point: no ? q1(back((f - 410) / 8)) : undefined, seed: 41, blink: bl(41), headTilt: no ? 7 * Math.sin((f - 410) * 0.35) : 0 }, { flip: true }));
      A.push(BR('bear', P_(-0.4, 0, 0.3), { expr: no ? 'sad' : 'happy', blink: bl(8) }, { scale: 0.75, roll: 0.03 * Math.sin(f * 0.15) }));
      A.push(P('handler', 'soldier', P_(-1.7, 0, 1.4), { mode: 'stand', expr: no ? 'nervous' : 'smile', seed: 43, blink: bl(43), headTilt: 2 * idle(f, 5) }));
      A.push(FX('sign', 'sign', P_(2.0, 1.05, 0.45), 0, 2.0));
      break;
    }
    case 'enlist': {
      const sp = f < STAMP_F ? -0.2 + 1.2 * easeIn((f - 476) / (STAMP_F - 476)) : 1 - 0.6 * easeOut((f - STAMP_F) / 10);
      A.push(P('officer', 'officer', D_(0.5, 0, -1.3), { mode: 'stand', expr: f < STAMP_F ? 'stern' : 'sly', prop: ['hammer', q1(clamp(sp))], seed: 51, blink: bl(51), headTilt: 3 * idle(f, 6) }));
      A.push(FX('mark', 'stamp', D_(0.2, 0.93, -0.25), f >= STAMP_F ? 1 : 0, 0.34, { k: f >= STAMP_F ? 1 : 0 }));
      if (f >= STAMP_F && f < STAMP_F + 12) A.push(FX('puff', 'smoke', D_(0.25, 1.0, -0.2), (f - STAMP_F) / 12, 0.5, { seed: 9 }));
      const sal = clamp((f - 528) / 8);
      A.push(BR('bear', D_(-1.15, 0, 0.6), { expr: f < 528 ? 'happy' : 'proud', cap: f >= 516, salute: f >= 528 ? q1(back(sal)) : undefined, blink: bl(9) }, { scale: 1.02, roll: 0.02 * Math.sin(f * 0.15) }));
      break;
    }
    case 'cassino': {
      const x = bearCassX(f);
      A.push(BR('bear', K_(x, 0, 0), { expr: 'grin', crate: true, cap: true, walk: q1(((f - 584) / 22) % 1) }, { scale: 1.0 }));
      A.push(P('g1', 'soldier', K_(2.6, 0, -1.6), { mode: 'stand', expr: f > 660 ? 'shock' : 'stern', seed: 61, blink: bl(61), headTilt: 2 * idle(f, 7) }, { flip: true }));
      A.push(P('g2', 'soldier2', K_(-2.2, 0, -1.8), { mode: 'stand', expr: f > 620 ? 'grin' : 'stern', cheer: f > 640 ? q1(0.5 + 0.5 * Math.abs(Math.sin(f * 0.2))) : undefined, seed: 63, blink: bl(63) }));
      for (const [a, x0, z0] of [[600, -14, -40], [640, 10, -55], [672, -4, -48]]) if (f >= a && f < a + 30) A.push(FX('boom' + a, 'smoke', K_(x0, 3, z0), (f - a) / 30, 7, { seed: a, col: '#b8b0a4' }));
      break;
    }
    case 'paint': {
      A.push(FX('emb', 'emblem', B_(0, 1.95, -0.5), q1(clamp((f - 726) / 64) * 20) / 20, 1.9));
      A.push(P('painter', 'soldier', B_(-1.0, 0, 0.5), { mode: 'stand', expr: 'smile', point: q1(0.5 + 0.4 * Math.sin(f * 0.35)), seed: 71, blink: bl(71), headTilt: 4 * idle(f, 8) }));
      A.push(P('sgt', 'sergeant', B_(1.15, 0, 0.7), { mode: 'stand', expr: f < 760 ? 'stern' : 'grin', seed: 5, blink: bl(5), headTilt: 3 * idle(f, 9) }, { flip: true }));
      break;
    }
    case 'emblem': {
      A.push(FX('emb', 'emblem', B_(0, 1.95, -0.5), 1, 1.9));
      A.push(BR('bear', B_(0.8, 0, 1.0), { expr: f < BUTTON_F ? 'happy' : 'proud', shell: f >= 800, cap: true, blink: bl(10) }, { scale: 0.92, roll: f >= BUTTON_F ? 0.05 : 0.02 * Math.sin(f * 0.15) }));
      if (f >= BUTTON_F && f < BUTTON_F + 14) A.push(FX('ting', 'stars', B_(1.0, 2.3, 1.0), (f - BUTTON_F) / 14, 0.7));
      break;
    }
  }
  return A;
};

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 30, el: 50, sun: [1.0, 0.96, 0.86], sunI: 2.4, sky: '#4a9ae0', hor: '#d4e8f2', hemiSky: '#c6dcf2', hemiGnd: '#8aa060', hemiI: 1.15, fog: [80, 700], card: [1, 1, 1], sat: 1.1, gain: 1.0, sunDisc: 0 },
  desert: { az: 60, el: 35, sun: [1.0, 0.86, 0.62], sunI: 2.4, sky: '#e0a860', hor: '#f6dcb0', hemiSky: '#f6dcb0', hemiGnd: '#b89060', hemiI: 1.15, fog: [60, 500], card: [1, 0.95, 0.86], sat: 1.08, gain: 1.0, sunDisc: 0 },
  autumn: { az: 50, el: 30, sun: [1.0, 0.82, 0.58], sunI: 2.2, sky: '#d0a070', hor: '#f0d2a8', hemiSky: '#f0d4a8', hemiGnd: '#8a6a40', hemiI: 1.15, fog: [60, 500], card: [1, 0.94, 0.84], sat: 1.05, gain: 1.0, sunDisc: 0 },
};
export const lightFor = (f) => LIGHTS[shotAt(f).light];
