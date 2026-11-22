// "The Dancing Plague" (Strasbourg, 1518) — pure functions of the frame number (30 fps).
export const FPS = 30, N = 863;
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
export const SQUARE = [0, 0, 0], STREET = [60, 0, 0], DOC = [60, 0, -22], MARKET = [-60, 0, 0];

// ---------- shots ----------
export const SHOTS = [
  { id: 'hook', a: 0, b: 150, light: 'day' },
  { id: 'troffea', a: 150, b: 300, light: 'day' },
  { id: 'days', a: 300, b: 378, light: 'night' },
  { id: 'crowd', a: 378, b: 486, light: 'day' },
  { id: 'nobody', a: 486, b: 580, light: 'golden' },
  { id: 'doctors', a: 580, b: 656, light: 'golden' },
  { id: 'cure', a: 656, b: 706, light: 'golden' },
  { id: 'more', a: 706, b: 750, light: 'golden' },
  { id: 'stage', a: 750, b: 863, light: 'day' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1];
export const FLASH = [[298, 6], [376, 6]];
export const flashAt = (f) => { let v = 0; for (const [a, d] of FLASH) { const t = (f - a) / d; if (t >= 0 && t <= 1) v = Math.max(v, Math.sin(t * Math.PI)); } return v; };
export const SCROLL_F = 712, BUTTON_F = 834;
export const KICKS = [[150, 0.3], [SCROLL_F, 0.6], [756, 0.3], [BUTTON_F, 0.6]];
const kickAt = (f) => { let k = 0; for (const [a, s] of KICKS) { const d = f - a; if (d >= 0 && d < 7) k += s * (d % 2 ? -1 : 1) * (1 - d / 7); } return k; };
export const worldAt = (f) => ({ shot: shotAt(f).id });

// ---------- cameras ----------
const C = (pos, look, fov = 40, roll = 0) => ({ pos, look, fov, roll });
const glide = (a, b, t) => C(L3(a.pos, b.pos, t), L3(a.look, b.look, t), lerp(a.fov, b.fov, t), lerp(a.roll, b.roll, t));
const creep = (c, k) => { const d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]]; return { ...c, pos: [c.pos[0] + d[0] * k, c.pos[1] + d[1] * k, c.pos[2] + d[2] * k] }; };
const orbit = (c, deg) => { const a = deg * Math.PI / 180, dx = c.pos[0] - c.look[0], dz = c.pos[2] - c.look[2];
  return { ...c, pos: [c.look[0] + dx * Math.cos(a) - dz * Math.sin(a), c.pos[1], c.look[2] + dx * Math.sin(a) + dz * Math.cos(a)] }; };
const drift = (c, f, k = 1) => ({ ...c, pos: [c.pos[0] + 0.012 * k * Math.sin(f * 0.07), c.pos[1] + 0.008 * k * Math.sin(f * 0.11 + 1), c.pos[2]], roll: c.roll + 0.35 * k * Math.sin(f * 0.05 + 2) });
const at = (o) => (x, y, z) => [o[0] + x, y, o[2] + z];
const Sq = at(SQUARE), St = at(STREET), Dc = at(DOC), Mk = at(MARKET);

export const camAt = (f) => {
  const s = shotAt(f), t = (f - s.a) / (s.b - s.a);
  let c;
  switch (s.id) {
    case 'hook': c = glide(C(Sq(0.5, 6.5, 12.5), Sq(0, 1.0, -1.5), 44, -2), C(Sq(0.2, 2.1, 7.6), Sq(0, 1.35, -0.5), 46, 1), sstep(t)); break;
    case 'troffea': c = orbit(creep(C(St(0, 1.55, 4.6), St(0, 1.25, 0), 44, 0), 0.0012 * (f - 150)), -14 + 28 * sstep(t)); break;
    case 'days': c = orbit(creep(C(St(0, 1.6, 4.2), St(0, 1.3, 0), 44, 0), 0.0016 * (f - 300)), 10 - 8 * t); break;
    case 'crowd': c = glide(C(Sq(0, 1.6, 4.4), Sq(0, 1.35, 0), 44, 0), C(Sq(0, 3.6, 13), Sq(0, 1.4, -1), 46, -1.5), sstep((f - 384) / 90)); break;
    case 'nobody': c = orbit(creep(C(Sq(1.0, 1.6, 3.4), Sq(1.0, 1.5, 0), 40, 0), 0.0015 * (f - 486)), -6 + 12 * t); break;
    case 'doctors': c = glide(C(Dc(-0.6, 1.8, 6.8), Dc(-0.2, 1.4, -0.6), 46, 0), C(Dc(0.2, 1.8, 6.2), Dc(0.0, 1.4, -0.6), 46, 1), sstep(t)); break;
    case 'cure': c = creep(C(Dc(-0.4, 1.85, 3.0), Dc(-0.55, 1.75, -1.6), 42, 0), 0.25 * easeOut((f - 656) / 40)); break;
    case 'more': c = creep(C(Dc(0.0, 1.75, 3.9), Dc(0.0, 1.6, -0.6), 44, 0), 0.08 * easeOut((f - 706) / 30)); break;
    case 'stage': {
      c = glide(C(Mk(0, 1.6, 5.0), Mk(0, 1.5, -1), 44, 0), C(Mk(0, 2.9, 10.5), Mk(0, 1.8, -3), 46, 0), sstep((f - 752) / 70));
      if (f >= BUTTON_F) c = creep(c, 0.05 * easeOut((f - BUTTON_F) / 8));
      c.roll += f >= BUTTON_F ? 2.5 * easeOut((f - BUTTON_F) / 10) : 0; break;
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
    case 'troffea': case 'days': return [9, dist(St(0, 1.4, 0))];
    case 'nobody': return [10, dist(Sq(1.0, 1.5, 0))];
    case 'cure': return [10, dist(Dc(-0.6, 1.8, -1.6))];
    case 'more': return [6, dist(Dc(0.1, 1.5, -0.6))];
    default: return [0, 10];
  }
};
export const focusAt = (f) => ({ hook: SQUARE, troffea: STREET, days: STREET, crowd: SQUARE, nobody: SQUARE, doctors: DOC, cure: DOC, more: DOC, stage: MARKET }[shotAt(f).id]);

// ---------- actors ----------
const P = (id, who, pos, opts = {}, extra = {}) => ({ id, kind: 'person', who, pos, opts, ...extra });
const FX = (id, fx, pos, t, size, extra = {}) => ({ id, kind: 'fx', fx, pos, t, size, ...extra });
const q1 = (v) => Math.round(v * 10) / 10;
const WHO = ['wife1', 'man1', 'wife2', 'man2', 'wife3', 'man3'];
// a dancer: stepping legs, arms flung up in turns, hops and sways
const dancer = (f, id, who, pos, seed, expr = 'grin', sp = 1) => {
  const ph = (f * sp / 15 + seed * 0.37) % 1, s2 = Math.sin(ph * Math.PI * 2);
  const hop = 0.07 * Math.abs(Math.sin(ph * Math.PI * 2));
  return P(id, who, [pos[0], pos[1] + hop, pos[2]], { mode: 'march', phase: q1(ph), expr, cheer: q1(0.5 + 0.5 * s2), seed: 10 + seed, blink: blinkAt(f, 10 + seed), headTilt: 8 * s2 }, { roll: 0.09 * s2, flip: s2 > 0.6 });
};
const CROWD = [[-1.6, -0.6], [1.5, -0.9], [-0.8, -2.4], [0.9, -2.6], [-2.6, -1.9], [2.6, -2.2], [-1.9, -3.9], [0.1, -4.2], [2.0, -4.0], [-3.4, -3.4], [3.3, -3.6], [-0.9, -5.6], [1.2, -5.8]];

export const actorsAt = (f) => {
  const s = shotAt(f).id, A = [];
  const bl = (seed) => blinkAt(f, seed);
  switch (s) {
    case 'hook': {
      A.push(dancer(f, 'tro', 'troffea', Sq(0, 0, 0.6), 0, 'laugh'));
      CROWD.slice(0, 10).forEach(([x, z], i) => A.push(dancer(f, 'c' + i, WHO[i % 6], Sq(x, 0, z), i + 1, ['grin', 'nervous', 'laugh', 'shock'][i % 4])));
      break;
    }
    case 'troffea': {
      A.push(dancer(f, 'tro', 'troffea', St(0, 0, 0), 0, 'laugh', 1.1));
      A.push(P('o1', 'man1', St(-1.25, 0, -1.7), { mode: 'stand', expr: f < 200 ? 'neutral' : 'shock', seed: 41, blink: bl(41), headTilt: 4 * idle(f, 1) }));
      A.push(P('o2', 'wife2', St(1.3, 0, -1.5), { mode: 'stand', expr: f < 230 ? 'neutral' : 'shock', point: f > 240 ? q1(back((f - 240) / 8)) : undefined, seed: 43, blink: bl(43) }, { flip: true }));
      for (let i = 0; i < 3; i++) { const t = ((f - 150) / 40 + i / 3) % 1; A.push(FX('n' + i, 'note', St(-0.6 + 0.6 * i, 2.2 + 1.2 * t, 0), 0, 0.35 * Math.sin(Math.PI * t) + 0.01)); }
      break;
    }
    case 'days': {
      A.push(dancer(f, 'tro', 'troffea', St(0, 0, 0), 0, 'dazed', 0.8));
      const t = ((f - 300) / 18) % 1; A.push(FX('drop', 'drop', St(0.45, 2.05 - 0.4 * t, 0.1), 0, 0.14));
      break;
    }
    case 'crowd': {
      A.push(dancer(f, 'tro', 'troffea', Sq(0, 0, 0.6), 0, 'dazed'));
      const n = Math.min(CROWD.length, 2 + Math.floor((f - 378) / 7));
      CROWD.slice(0, n).forEach(([x, z], i) => { const a = 378 + i * 7, k = easeOut((f - a) / 10); A.push(dancer(f, 'c' + i, WHO[i % 6], Sq(x * k + (1 - k) * x * 2.2, 0, z), i + 1, ['grin', 'nervous', 'laugh', 'shock'][i % 4])); });
      break;
    }
    case 'nobody': {
      A.push(dancer(f, 'm2', 'man2', Sq(1.0, 0, 0), 3, f < 530 ? 'nervous' : 'pained', 1.2));
      [[-0.8, -2.2], [2.6, -2.6], [0.4, -4.0]].forEach(([x, z], i) => A.push(dancer(f, 'b' + i, WHO[(i * 2) % 6], Sq(x, 0, z), i + 5, 'dazed')));
      break;
    }
    case 'doctors': {
      A.push(P('doc', 'doctor', Dc(-0.6, 0, -1.6), { mode: 'stand', expr: 'stern', point: f > 610 ? q1(back((f - 610) / 8)) : undefined, seed: 51, blink: bl(51), headTilt: 3 * idle(f, 2) }));
      A.push(P('doc2', 'doctor2', Dc(1.3, 0, -0.5), { mode: 'stand', expr: f < 620 ? 'neutral' : 'stern', seed: 53, blink: bl(53), headTilt: f > 620 ? 5 * Math.sin((f - 620) * 0.3) : 0 }, { flip: true }));
      A.push(dancer(f, 'pd', 'man3', Dc(-1.45 + 0.8 * clamp((f - 580) / 70), 0, 0.7), 6, 'dazed'));
      A.push(FX('heat', 'heat', Dc(-1.45 + 0.8 * clamp((f - 580) / 70), 2.65, 0.75), q1(((f - 580) / 20) % 1), 0.7, { k: q1(((f - 580) / 20) % 1) }));
      break;
    }
    case 'cure': {
      A.push(P('doc', 'doctor', Dc(-0.6, 0, -1.6), { mode: 'stand', expr: f < 690 ? 'sly' : 'grin', point: q1(clamp(0.6 + 0.3 * Math.sin((f - 656) * 0.25))), seed: 51, blink: bl(51), headTilt: -4 + 3 * idle(f, 3) }));
      break;
    }
    case 'more': {
      A.push(P('doc', 'doctor', Dc(-0.6, 0, -1.6), { mode: 'stand', expr: 'grin', seed: 51, blink: bl(51), headTilt: 4 * Math.sin(f * 0.2) }));
      A.push(FX('scroll', 'scroll', Dc(0.22, 1.45, -0.1), q1(back(clamp((f - SCROLL_F) / 10), 1.2)), 1.1, { k: f >= SCROLL_F ? 1 : 0 }));
      break;
    }
    case 'stage': {
      const beat = (f) => q1(Math.abs(Math.sin(f * 0.35)));
      A.push(P('drum', 'drummer', Mk(-1.8, 0.96, -4.4), { mode: 'stand', expr: 'grin', instr: 'drum', beat: beat(f), seed: 61, blink: bl(61), headTilt: 4 * Math.sin(f * 0.35) }));
      A.push(P('fid', 'fiddler', Mk(0, 0.96, -4.6), { mode: 'stand', expr: 'laugh', instr: 'fiddle', beat: beat(f + 3), seed: 63, blink: bl(63), headTilt: -6 + 4 * Math.sin(f * 0.3) }));
      A.push(P('pip', 'piper', Mk(1.8, 0.96, -4.4), { mode: 'stand', expr: 'whistle', instr: 'horn', seed: 65, blink: bl(65), headTilt: 3 * Math.sin(f * 0.3) }, { roll: 0.04 * Math.sin(f * 0.3) }));
      A.push(dancer(f, 'tro', 'troffea', Mk(0, 0, 0.2), 0, 'dazed'));
      CROWD.slice(0, 8).forEach(([x, z], i) => A.push(dancer(f, 'c' + i, WHO[i % 6], Mk(x * 1.2, 0, 1.6 + z * 0.55), i + 1, ['dazed', 'nervous', 'pained', 'shock'][i % 4])));
      for (let i = 0; i < 4; i++) { const t = ((f - 760) / 36 + i / 4) % 1; if (f >= 770) A.push(FX('n' + i, 'note', Mk(-2.4 + 1.6 * i, 2.9 + 1.6 * t, -4.2), 0, 0.45 * Math.sin(Math.PI * t) + 0.01)); }
      break;
    }
  }
  return A;
};

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 30, el: 50, sun: [1.0, 0.96, 0.86], sunI: 2.4, sky: '#4a9ae0', hor: '#d4e8f2', hemiSky: '#c6dcf2', hemiGnd: '#8aa060', hemiI: 1.15, fog: [80, 700], card: [1, 1, 1], sat: 1.1, gain: 1.0, sunDisc: 0 },
  golden: { az: 60, el: 25, sun: [1.0, 0.8, 0.55], sunI: 2.3, sky: '#d89a68', hor: '#f4d2a4', hemiSky: '#f0d0a8', hemiGnd: '#8a6a40', hemiI: 1.15, fog: [60, 500], card: [1, 0.94, 0.84], sat: 1.06, gain: 1.0, sunDisc: 0 },
  night: { az: -40, el: 40, sun: [0.55, 0.65, 1.0], sunI: 1.0, sky: '#141c3c', hor: '#2e3a6a', hemiSky: '#4a5a9a', hemiGnd: '#2a2a3a', hemiI: 0.95, fog: [40, 400], card: [0.72, 0.76, 0.95], sat: 0.95, gain: 1.0, sunDisc: 0, lamps: 1 },
};
export const lightFor = (f) => LIGHTS[shotAt(f).light];
