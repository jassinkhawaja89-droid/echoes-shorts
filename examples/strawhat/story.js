// "The Straw Hat Riot" (New York, 1922) — pure functions of the frame number (30 fps).
export const FPS = 30, N = 888;
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
export const STREET = [0, 0, 0], DOCK = [400, 0, 0], BRIDGE = Object.assign([400, 0, -62], { Y: 30 });
export const CAL = [-5.95, 2.15, -2.6];

// ---------- shots ----------
export const SHOTS = [
  { id: 'hook', a: 0, b: 140, light: 'day' },
  { id: 'rule', a: 140, b: 276, light: 'day' },
  { id: 'crush', a: 276, b: 374, light: 'day' },
  { id: 'teens', a: 374, b: 462, light: 'day' },
  { id: 'snatch', a: 462, b: 556, light: 'day' },
  { id: 'dock', a: 556, b: 676, light: 'day' },
  { id: 'days', a: 676, b: 766, light: 'golden' },
  { id: 'early', a: 766, b: 888, light: 'day' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1];
export const FLASH = [[274, 5], [674, 5]];
export const flashAt = (f) => { let v = 0; for (const [a, d] of FLASH) { const t = (f - a) / d; if (t >= 0 && t <= 1) v = Math.max(v, Math.sin(t * Math.PI)); } return v; };
export const SNATCH_HOOK = 100, CRUSH_POP = 300, STOMP = 334, FIGHT = 594, MARK_F = 832, BUTTON_F = 866;
export const SNATCH = [480, 500, 522];
export const KICKS = [[SNATCH_HOOK, 0.4], [STOMP, 0.7], [FIGHT, 0.6], [BUTTON_F, 0.6]];
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
const St = at(STREET), Dk = at(DOCK);

export const camAt = (f) => {
  const s = shotAt(f), t = (f - s.a) / (s.b - s.a);
  let c;
  switch (s.id) {
    case 'hook': c = glide(C(St(0.4, 7.0, 15), St(0, 1.0, -3), 44, -2), C(St(0.2, 1.9, 7.2), St(0, 1.4, -1.5), 46, 1), sstep(t / 0.8)); break;
    case 'rule': c = orbit(creep(C(St(-1.6, 1.65, 3.4), St(-5.2, 1.6, -1.2), 42, 0), 0.0016 * (f - 140)), -6 + 10 * sstep(t)); break;
    case 'crush': c = orbit(creep(C(St(1.7, 1.45, 4.6), St(0.85, 1.0, -0.1), 44, 0), 0.0012 * (f - 276)), 8 - 14 * t); break;
    case 'teens': c = creep(C(St(0.2, 1.6, 5.6), St(0, 1.4, -0.8), 44, -1), 0.22 * sstep(t)); break;
    case 'snatch': c = orbit(C(St(0.3, 1.35, 6.4), St(0, 1.45, -2.5), 46, 0), -8 + 14 * sstep(t)); break;
    case 'dock': {
      const a = C(Dk(0.4, 1.6, 4.4), Dk(0, 1.35, -2.0), 44, 0), b = C(Dk(0, 36, 16), Dk(0, 30.5, -62), 40, 0);
      c = f < 620 ? creep(a, 0.1 * sstep((f - 556) / 64)) : glide(creep(a, 0.1), b, sstep((f - 620) / 46)); break;
    }
    case 'days': c = glide(C(St(3.0, 2.4, 8.5), St(0.4, 1.0, -3), 44, -1), C(St(-2.6, 2.1, 8.0), St(-0.4, 1.0, -3), 44, 1), sstep(t)); break;
    case 'early': {
      c = creep(C(St(-2.5, 1.85, 2.6), St(-5.7, 1.8, -1.7), 40, 0), 0.06 + 0.22 * sstep((f - 766) / 100));
      if (f >= BUTTON_F) c = creep(c, 0.06 * easeOut((f - BUTTON_F) / 8));
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
    case 'rule': return [8, dist(St(-4.9, 1.5, -0.2))];
    case 'crush': return [7, dist(St(0.5, 1.2, -0.3))];
    case 'teens': return [7, dist(St(0, 1.5, -0.6))];
    case 'early': return [7, dist(St(-5.6, 1.8, -1.6))];
    default: return [0, 10];
  }
};
export const focusAt = (f) => ({ dock: DOCK }[shotAt(f).id] || STREET);

// ---------- actors ----------
const P = (id, who, pos, opts = {}, extra = {}) => ({ id, kind: 'person', who, pos, opts, ...extra });
const FX = (id, fx, pos, t, size, extra = {}) => ({ id, kind: 'fx', fx, pos, t, size, ...extra });
const q1 = (v) => Math.round(v * 10) / 10;
const add3 = (p, x, y, z) => [p[0] + x, p[1] + y, p[2] + z];
// a strolling gent: gentle bob, sway
const stroller = (f, id, who, pos, seed, expr = 'smile', opts = {}) => P(id, who, pos, { mode: 'stroll', phase: q1((f / 26 + seed * 0.31) % 1), expr, seed, blink: blinkAt(f, seed), headTilt: 4 * idle(f, seed), ...opts });
const runner = (f, id, who, pos, seed, expr = 'laugh', flip = false, opts = {}) => P(id, who, [pos[0], pos[1] + 0.05 * Math.abs(Math.sin(f * 0.42 + seed)), pos[2]], { mode: 'march', phase: q1((f / 10 + seed * 0.3) % 1), expr, seed, blink: blinkAt(f, seed), headTilt: 6 * Math.sin(f * 0.21 + seed), ...opts }, { flip, roll: 0.06 * Math.sin(f * 0.42 + seed) });
// the boater flying off a head at frame t0: arcs up and to the side (dx), spins, lands on the ground
const flyingHat = (f, id, pos, t0, dx = 0.9, dz = 0.3, band = '#2a2a5a', squash = null) => {
  if (f < t0) return null;
  const t = clamp((f - t0) / 22), land = [pos[0] + dx, 0.13, pos[2] + dz];
  let p, rot;
  if (t < 1) { p = [pos[0] + dx * t, 1.95 + 1.3 * Math.sin(Math.PI * t) - 1.82 * t * t, pos[2] + dz * t]; rot = 540 * t; }
  else { p = land; rot = 12 + 6 * Math.sin(seedOf(id)); }
  const k = squash === null ? 0 : q1(clamp((f - squash) / 4));
  return FX(id, 'boater', p, 0, 0.55, { rot: Math.round(rot / 15) * 15, k, band });
};
const seedOf = (id) => { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 97; return h; };
const popFx = (f, id, pos, t0, size = 1.0) => (f >= t0 && f < t0 + 14 ? FX(id, 'stars', pos, q1((f - t0) / 14), size) : null);
const puffFx = (f, id, pos, t0, size = 1.0, seed = 1) => (f >= t0 && f < t0 + 18 ? FX(id, 'smoke', pos, q1((f - t0) / 18), size, { seed }) : null);
const GENTS = ['gent1', 'gent2', 'gent3', 'gent4'];

export const actorsAt = (f) => {
  const s = shotAt(f).id, A = [];
  const push = (...xs) => { for (const x of xs) if (x) A.push(x); };
  switch (s) {
    case 'hook': {
      const crowd = [[-1.6, -3.2], [1.4, -4.4], [-0.6, -6.4], [2.2, -7.6], [-2.4, -8.8], [0.8, -10]];
      crowd.forEach(([x, z], i) => { const zz = z + 0.012 * f; const bare = i === 0 && f >= SNATCH_HOOK; push(stroller(f, 'g' + i, GENTS[i % 4] + (bare ? '_bare' : ''), St(x, 0, zz), 3 + i, bare ? (f < SNATCH_HOOK + 10 ? 'shock' : 'pained') : 'smile')); });
      const g0 = St(-1.6, 0, -3.2 + 0.012 * f);
      if (f >= 70) { const k = clamp((f - 70) / 30); push(runner(f, 't1', 'teen1', St(3.8 - 5.0 * k + (f > 100 ? -0.05 * (f - 100) : 0), 0, -2.6), 11, 'laugh', true)); }
      push(flyingHat(f, 'hat0', g0, SNATCH_HOOK, -0.9, 0.6, '#2a2a5a'), popFx(f, 'pop0', add3(g0, 0, 1.9, 0.1), SNATCH_HOOK, 0.9));
      break;
    }
    case 'rule': {
      push(P('g2', 'gent2', St(-4.9, 0, -0.2), { mode: 'stand', expr: f < 200 ? 'smile' : 'stern', point: f > 196 ? q1(back((f - 196) / 10)) : undefined, seed: 21, blink: blinkAt(f, 21), headTilt: 4 * idle(f, 2) }));
      push(stroller(f, 'g4', 'gent4', St(1.4, 0, -6 + 0.02 * (f - 140)), 7, 'smile'));
      push(FX('cal', 'calendar', CAL, 0, 1.0, { day: 15, mark: q1(clamp((f - 214) / 20)) }));
      break;
    }
    case 'crush': {
      const g = St(0.3, 0, -0.5), bare = f >= CRUSH_POP;
      push(P('g3', bare ? 'gent3_bare' : 'gent3', g, { mode: 'stand', expr: !bare ? 'smile' : f < STOMP ? 'shock' : 'pained', seed: 31, blink: blinkAt(f, 31), headTilt: bare ? 6 * Math.sin((f - CRUSH_POP) * 0.3) * Math.exp(-(f - CRUSH_POP) / 40) : 3 * idle(f, 3) }));
      // the stranger steps in, snatches, then stomps the hat
      const tx = f < CRUSH_POP ? 2.6 - 1.2 * easeOut((f - 276) / 24) : 1.4 + 0.1 * clamp((f - 312) / 10);
      const hop = f >= 318 && f < STOMP ? 0.32 * Math.sin(Math.PI * (f - 318) / 16) : 0;
      push(P('st', 'teen2', St(tx, hop, -0.2), { mode: 'stand', expr: f < STOMP ? 'sly' : 'laugh', cheer: f >= 318 && f < STOMP + 6 ? 0.8 : undefined, seed: 33, blink: blinkAt(f, 33), headTilt: 4 * idle(f, 4) }, { flip: true }));
      push(flyingHat(f, 'hat1', St(0.3, 0, -0.5), CRUSH_POP, 0.9, 0.9, '#2a4a2a', STOMP));
      push(popFx(f, 'pop1', St(1.25, 0.6, 0.45), STOMP, 1.2), puffFx(f, 'puff1', St(1.25, 0.25, 0.5), STOMP, 1.0, 3));
      break;
    }
    case 'teens': {
      [['teen1', -0.95, -1.2], ['teen2', 0, -0.6], ['teen3', 0.95, -1.3]].forEach(([w, x, z], i) => push(P('tt' + i, w, St(x, 0.03 * Math.abs(Math.sin(f * 0.2 + i)), z), { mode: 'stand', expr: i === 1 ? (f < 420 ? 'sly' : 'grin') : ['sly', 'grin', 'laugh'][i], point: i === 1 && f > 418 ? q1(back((f - 418) / 9)) : undefined, cheer: i === 2 && f > 430 ? q1(0.5 + 0.5 * Math.sin(f * 0.3)) : undefined, seed: 41 + i, blink: blinkAt(f, 41 + i), headTilt: 5 * idle(f, i + 5) }, { flip: i === 0 })));
      push(stroller(f, 'bg', 'gent1', St(-3.6, 0, -9 + 0.02 * (f - 374)), 9, 'smile'));
      break;
    }
    case 'snatch': {
      const gs = [['gent2', -1.4, -3.6, SNATCH[0], -1.0], ['gent4', 1.5, -4.4, SNATCH[1], 1.0], ['gent1', 0.1, -6.2, SNATCH[2], -0.8]];
      gs.forEach(([w, x, z, t0, dx], i) => { const p = St(x, 0, z + 0.015 * (f - 462)); const bare = f >= t0; push(stroller(f, 'sg' + i, w + (bare ? '_bare' : ''), p, 12 + i, bare ? 'shock' : 'smile')); push(flyingHat(f, 'sh' + i, p, t0, dx, 0.5, ['#8a2a2a', '#2a2a2a', '#2a2a5a'][i])); push(popFx(f, 'sp' + i, add3(p, 0, 1.9, 0.1), t0, 0.8)); });
      // teens dash across, each past the gent he robs
      push(runner(f, 'r1', 'teen1', St(-4 + 5.5 * clamp((f - 462) / 40), 0, -2.6 + 0.015 * (f - 462)), 51, 'laugh'));
      push(runner(f, 'r2', 'teen3', St(4.2 - 5.5 * clamp((f - 478) / 40), 0, -3.4 + 0.015 * (f - 462)), 53, 'grin', true));
      push(runner(f, 'r3', 'teen2', St(-3.6 + 6.5 * clamp((f - 498) / 48), 0, -5.2 + 0.015 * (f - 462)), 55, 'laugh'));
      break;
    }
    case 'dock': {
      const fight = f >= FIGHT;
      if (!fight) {
        push(P('d1', 'dock1', Dk(-0.9, 0, -2.0), { mode: 'stand', expr: f < 580 ? 'neutral' : 'stern', seed: 61, blink: blinkAt(f, 61), headTilt: 3 * idle(f, 6) }));
        push(P('d2', 'dock2', Dk(0.95, 0, -2.3), { mode: 'stand', expr: f < 584 ? 'neutral' : 'stern', seed: 63, blink: blinkAt(f, 63), headTilt: 3 * idle(f, 7) }, { flip: true }));
        const k = easeOut((f - 556) / 34);
        push(runner(f, 'dt1', 'teen1', Dk(-3.0 + 2.0 * k, 0, -0.6), 65, 'sly'));
        push(runner(f, 'dt2', 'teen3', Dk(3.0 - 1.9 * k, 0, -0.8), 67, 'sly', true));
      } else {
        // cartoon brawl cloud with stars and the odd flying boater
        for (let i = 0; i < 3; i++) { const ph = ((f - FIGHT) / 16 + i / 3) % 1; push(FX('cl' + i, 'smoke', Dk(-0.7 + 0.7 * i, 1.0 + 0.2 * i, -1.6 - 0.1 * i), q1(0.3 + 0.4 * ph), 3.0, { seed: i + 1 + Math.floor((f - FIGHT) / 16) % 3 })); }
        for (let i = 0; i < 3; i++) { const ph = ((f - FIGHT) / 12 + i / 3) % 1; push(FX('cs' + i, 'stars', Dk(-1.2 + 1.2 * i, 2.4 + 0.5 * ph, -1.2), q1(ph), 0.9)); }
        const ht = ((f - FIGHT) / 26) % 1; push(FX('dh', 'boater', Dk(0.4 + 2.0 * ht, 2.6 + 2.4 * Math.sin(Math.PI * ht), -1.0), 0, 0.55, { rot: Math.round(ht * 720 / 15) * 15 }));
      }
      if (f >= 620) { const ph = ((f - 620) / 16) % 1; push(FX('bc', 'smoke', [BRIDGE[0] + 2, BRIDGE.Y + 2.5, BRIDGE[2]], q1(0.3 + 0.4 * ph), 9, { seed: 1 + Math.floor((f - 620) / 16) % 3 })); push(FX('bs', 'stars', [BRIDGE[0] + 2, BRIDGE.Y + 6, BRIDGE[2] + 1], q1(ph), 6)); }
      push(P('d3', 'gent4', Dk(-5.2, 0, -4.5), { mode: 'stand', expr: f < 600 ? 'neutral' : 'shock', seed: 69, blink: blinkAt(f, 69), headTilt: 3 * idle(f, 9) }));
      break;
    }
    case 'days': {
      for (let i = 0; i < 9; i++) { const x = -2.8 + (i % 3) * 2.6 + seedOf('h' + i) / 97 - 0.5, z = -1 - Math.floor(i / 3) * 2.4; push(FX('fh' + i, 'boater', St(x, 0.1, z), 0, 0.5, { k: 1, rot: (seedOf('r' + i) % 5 - 2) * 10, band: ['#2a2a5a', '#8a2a2a', '#2a4a2a'][i % 3] })); }
      const k = (f - 676) / 90;
      push(runner(f, 'rt', 'teen3', St(-3.4 + 6.4 * k, 0, -3.4), 71, 'laugh'));
      push(runner(f, 'cp', 'cop', St(-5.0 + 6.4 * k, 0, -3.6), 73, 'whistle'));
      push(FX('tw', 'tweet', St(-4.55 + 6.4 * k, 1.85, -3.5), q1(Math.abs(Math.sin(f * 0.4))), 0.45));
      push(stroller(f, 'dg', 'gent2_bare', St(2.6, 0, -6.5), 75, 'pained'));
      { const ph = ((f - 676) / 22) % 1; push(FX('dp', 'smoke', St(-1.5, 1.0, -9), q1(0.3 + 0.4 * ph), 2.4, { seed: 2 + Math.floor((f - 676) / 22) % 3 })); }
      break;
    }
    case 'early': {
      const day = f < 800 ? 15 : f < 818 ? 14 : 13;
      const peel = f >= 788 && f < 800 ? q1((f - 788) / 12) : f >= 806 && f < 818 ? q1((f - 806) / 12) : 0;
      push(FX('cal', 'calendar', CAL, 0, 1.0, { day, peel, mark: day === 13 ? q1(clamp((f - MARK_F) / 14)) : 0 }));
      push(P('et', 'teen1', St(-5.2, 0, -0.7), { mode: 'stand', expr: f < 846 ? 'sly' : f < 862 ? 'wink' : 'laugh', point: f > 826 && f < 860 ? q1(back((f - 826) / 9)) : undefined, cheer: f >= BUTTON_F ? 0.9 : undefined, seed: 81, blink: blinkAt(f, 81), headTilt: 5 * idle(f, 8) }, { flip: true }));
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
