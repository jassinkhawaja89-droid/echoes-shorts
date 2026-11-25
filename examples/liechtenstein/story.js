// "80 went, 81 came back" (Liechtenstein, 1866) — pure functions of the frame number (30 fps).
export const FPS = 30, N = 885;
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
export const VILLAGE = [0, 0, 0], BARRACKS = [0, 0, -20], CASTLE = [-14, 0, -135], ROAD = [100, 0, 0], PASS = [200, 0, 0];

// ---------- shots ----------
export const SHOTS = [
  { id: 'hook', a: 0, b: 162, light: 'day' },
  { id: 'march', a: 162, b: 252, light: 'day' },
  { id: 'empty', a: 252, b: 322, light: 'cold' },
  { id: 'cold', a: 322, b: 418, light: 'cold' },
  { id: 'over', a: 418, b: 492, light: 'cold' },
  { id: 'home', a: 492, b: 590, light: 'golden' },
  { id: 'count', a: 590, b: 626, light: 'golden' },
  { id: 'extra', a: 626, b: 720, light: 'golden' },
  { id: 'abolish', a: 720, b: 885, light: 'day' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1];
export const FLASH = [[588, 5]];
export const flashAt = (f) => { let v = 0; for (const [a, d] of FLASH) { const t = (f - a) / d; if (t >= 0 && t <= 1) v = Math.max(v, Math.sin(t * Math.PI)); } return v; };
export const COUNT_F = 596, POOF_F = 792, STAMP_F = 842, BUTTON_F = 860;
export const KICKS = [[606, 0.6], [POOF_F, 0.4], [STAMP_F, 0.8], [BUTTON_F, 0.4]];
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
const Vi = at(VILLAGE), Rd = at(ROAD), Ps = at(PASS);

export const camAt = (f) => {
  const s = shotAt(f), t = (f - s.a) / (s.b - s.a);
  let c;
  switch (s.id) {
    case 'hook': c = glide(C(Vi(1.5, 12, 22), Vi(-2, 8, -60), 44, -1), C(Vi(0.6, 1.9, 9.5), Vi(0, 1.5, -2), 46, 1), sstep(t / 0.75)); break;
    case 'march': c = orbit(C(Rd(0.5, 1.6, 7.5 - 0.02 * (f - 162)), Rd(0, 1.8, -3 - 0.02 * (f - 162)), 46, 0), -10 + 18 * sstep(t)); break;
    case 'empty': c = glide(C(Ps(0.2, 1.7, 5.0), Ps(0, 1.6, -20), 44, 0), C(Ps(0.1, 2.4, 3.2), Ps(0, 1.4, -30), 44, 0), sstep(t)); break;
    case 'cold': c = orbit(creep(C(Ps(-3.6, 1.6, 4.6), Ps(-4.1, 1.3, -1.9), 44, 0), 0.0015 * (f - 322)), 8 - 14 * t); break;
    case 'over': c = orbit(C(Ps(0.4, 1.6, 6.0), Ps(0, 1.3, -1.5), 46, 0), -6 + 10 * sstep(t)); break;
    case 'home': c = glide(C(Vi(1.2, 1.7, 9.0), Vi(0, 1.5, -3), 46, 0), C(Vi(-0.8, 1.7, 7.6), Vi(-0.4, 1.4, -2), 46, 1), sstep(t)); break;
    case 'count': c = creep(C(Vi(-1.2, 1.8, 5.6), Vi(-2.3, 1.6, 0.3), 42, 0), 0.2 * easeOut((f - 590) / 30)); break;
    case 'extra': c = glide(C(Vi(-1.8, 1.6, 4.8), Vi(-1.8, 1.3, 0), 44, 0), C(Vi(2.4, 1.6, 4.4), Vi(2.6, 1.3, 0), 44, 0), sstep((f - 630) / 60)); break;
    case 'abolish': {
      c = glide(C(Vi(0.6, 1.8, -12.0), Vi(4.8, 1.7, -19), 46, 0), C(Vi(1.6, 1.9, -14.5), Vi(5.6, 1.9, -20), 42, 0), sstep((f - 720) / 120));
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
    case 'cold': return [8, dist(Ps(-4.6, 1.4, -2.4))];
    case 'count': return [8, dist(Vi(-2.6, 1.7, 0.6))];
    case 'extra': return [6, dist(Vi(0.4, 1.4, 0))];
    default: return [0, 10];
  }
};
export const focusAt = (f) => { const id = shotAt(f).id; return id === 'march' ? ROAD : ['empty', 'cold', 'over'].includes(id) ? PASS : VILLAGE; };

// ---------- actors ----------
const P = (id, who, pos, opts = {}, extra = {}) => ({ id, kind: 'person', who, pos, opts, ...extra });
const FX = (id, fx, pos, t, size, extra = {}) => ({ id, kind: 'fx', fx, pos, t, size, ...extra });
const q1 = (v) => Math.round(v * 10) / 10;
const SOLD = ['sold1', 'sold2', 'sold3', 'sold4'];
const marcher = (f, id, who, pos, seed, expr = 'stern', opts = {}) => P(id, who, [pos[0], pos[1], pos[2]], { mode: 'march', phase: q1((f / 22 + (seed % 2) * 0.5) % 1), expr, seed, blink: blinkAt(f, seed), headTilt: 2 * idle(f, seed), ...opts });
const stander = (f, id, who, pos, seed, expr = 'neutral', opts = {}, extra = {}) => P(id, who, pos, { mode: 'stand', expr, seed, blink: blinkAt(f, seed), headTilt: 4 * idle(f, seed), ...opts }, extra);
const flag = (id, pos, f, size = 1.3) => FX(id, 'flag', pos, 0, size, { flagKind: 'li', ph: q1(f * 0.15 % 6.28) });
const bearer = (f, id, pos, seed) => [marcher(f, id, 'sold3', pos, seed, 'grin'), flag(id + 'f', [pos[0] + 0.3, 2.05, pos[2] + 0.12], f)];
const column = (f, A, base, rows, dz, ox = 0.75, exprs = ['stern', 'neutral', 'smile']) => { for (let r = 0; r < rows; r++) for (const s of [-1, 1]) { const i = r * 2 + (s > 0 ? 1 : 0); A.push(marcher(f, 'm' + i, SOLD[i % 4], [base[0] + s * ox, 0, base[2] - r * dz], 10 + i, exprs[i % exprs.length])); } };

export const actorsAt = (f) => {
  const s = shotAt(f).id, A = [];
  const push = (...xs) => { for (const x of xs) if (x) A.push(x); };
  switch (s) {
    case 'hook': {
      const z0 = -3.5 + 0.022 * f;
      push(marcher(f, 'off', 'officer', Vi(0, 0, z0 + 1.4), 3, 'stern'));
      column(f, A, Vi(0, 0, z0), 6, 1.6);
      push(...bearer(f, 'fb', Vi(-1.6, 0, z0 + 0.2), 8));
      push(stander(f, 'w1', 'wife', Vi(3.2, 0, 1.0), 5, 'smile', { cheer: q1(0.5 + 0.5 * Math.sin(f * 0.25)) }, { flip: true }));
      push(stander(f, 'v1', 'civ2', Vi(-3.3, 0, -1.5), 7, 'grin', { cheer: q1(0.5 + 0.5 * Math.sin(f * 0.22 + 1)) }));
      push(stander(f, 'v2', 'civ1', Vi(3.4, 0, -4.0), 9, 'smile', { point: 0.7 }, { flip: true }));
      break;
    }
    case 'march': {
      const z0 = -0.02 * (f - 162);
      push(marcher(f, 'off', 'officer', Rd(0, 0, z0 + 1.2), 3, 'stern'));
      column(f, A, Rd(0, 0, z0), 5, 1.6);
      push(...bearer(f, 'fb', Rd(-1.6, 0, z0 + 0.1), 8));
      break;
    }
    case 'empty': {
      push(stander(f, 'g1', 'sold2', Ps(-0.75, 0, -2.4), 21, 'neutral', { salute: 0.8 }));
      push(stander(f, 'g2', 'sold3', Ps(0.8, 0, -2.8), 23, f < 290 ? 'neutral' : 'dazed', {}, { flip: true }));
      if (f > 286) push(FX('qm', 'question', Ps(0.95, 2.75 + 0.05 * Math.sin(f * 0.2), -2.2), q1(((f - 286) / 30) % 1), 0.75 * Math.min(1, back((f - 286) / 8))));
      push(FX('wd', 'wind', Ps(0.3, 1.0, -8), q1(((f - 252) / 40) % 1), 3.0));
      break;
    }
    case 'cold': {
      [['sold1', -5.1, -1.9], ['sold4', -4.1, -1.6], ['sold2', -3.1, -2.1]].forEach(([w, x, z], i) => push(P('c' + i, w, Ps(x + 0.03 * Math.sin(f * 1.3 + i), 0, z), { mode: 'stand', expr: ['nervous', 'pained', 'nervous'][i], seed: 31 + i, blink: blinkAt(f, 31 + i), headTilt: 5 * Math.sin(f * 0.9 + i) }, { roll: 0.025 * Math.sin(f * 1.7 + i) })));
      for (let i = 0; i < 14; i++) { const ph = ((f - 322) / (50 + (i % 4) * 8) + i * 0.137) % 1; push(FX('sf' + i, 'flake', Ps(-6.6 + (i % 7) * 0.8 + 0.3 * Math.sin(f * 0.05 + i), 3.4 - 3.3 * ph, -1.4 - (i % 3) * 0.7), 0, 0.14)); }
      push(FX('wd', 'wind', Ps(-4.4, 2.2, -1.6), q1(((f - 322) / 30) % 1), 2.2));
      break;
    }
    case 'over': {
      const k = easeOut((f - 418) / 26);
      push(P('cr', 'courier', Ps(4.0 - 3.0 * k, 0.05 * Math.abs(Math.sin(f * 0.4)) * (1 - k), -1.0), { mode: k < 1 ? 'march' : 'stand', phase: q1((f / 10) % 1), expr: 'grin', cheer: f > 446 ? 0.6 : undefined, seed: 41, blink: blinkAt(f, 41), headTilt: 3 * idle(f, 4) }, { flip: true }));
      push(FX('lt', 'letter', Ps(4.0 - 3.0 * k + (f > 446 ? 0.36 : -0.5), f > 446 ? 1.95 : 1.25, -0.9), 0, 0.42));
      push(stander(f, 'off', 'officer', Ps(-0.6, 0, -1.8), 43, f < 450 ? 'stern' : 'laugh', { cheer: f > 458 ? q1(0.5 + 0.5 * Math.sin(f * 0.3)) : undefined }));
      push(stander(f, 'o1', 'sold1', Ps(-1.7, 0, -2.6), 45, f < 456 ? 'neutral' : 'grin', { cheer: f > 462 ? q1(0.5 + 0.5 * Math.sin(f * 0.3 + 1)) : undefined }));
      push(stander(f, 'o2', 'sold3', Ps(1.6, 0, -3.0), 47, f < 456 ? 'neutral' : 'laugh', { cheer: f > 466 ? q1(0.5 + 0.5 * Math.sin(f * 0.3 + 2)) : undefined }, { flip: true }));
      break;
    }
    case 'home': {
      const z0 = -6 + 0.03 * (f - 492);
      column(f, A, Vi(0.6, 0, z0), 6, 1.5, 0.7, ['smile', 'grin', 'laugh']);
      push(stander(f, 'off', 'officer', Vi(-1.6, 0, 0.6), 3, 'neutral', { point: q1(0.6 + 0.3 * Math.sin(f * 0.35)) }));
      push(stander(f, 'w1', 'wife', Vi(3.4, 0, -2.0), 5, 'laugh', { cheer: q1(0.5 + 0.5 * Math.sin(f * 0.25)) }, { flip: true }));
      push(...bearer(f, 'fb', Vi(-0.95, 0, z0 + 0.6), 8));
      break;
    }
    case 'count': {
      push(FX('cb', 'count', Vi(-2.9, 1.75, -0.2), 0, 1.25, { k: q1(clamp((f - COUNT_F) / 14)) }));
      push(stander(f, 'off', 'officer', Vi(-1.95, 0, 0.4), 3, f < 606 ? 'neutral' : 'shock', {}, {}));
      break;
    }
    case 'extra': {
      const line = [['sold1', -2.4], ['sold2', -1.2], ['sold3', 0], ['sold4', 1.2]];
      line.forEach(([w, x], i) => push(stander(f, 'l' + i, w, Vi(x, 0, -0.2 - 0.1 * (i % 2)), 51 + i, f < 660 + i * 4 ? 'stern' : 'shock', { headTilt: f > 660 + i * 4 ? 10 : 0 })));
      push(stander(f, 'xm', 'stranger', Vi(2.55, 0, 0.1), 57, f < 690 ? 'smile' : 'grin', { present: f > 694 ? q1(0.5 + 0.5 * Math.sin(f * 0.35)) : undefined }, { flip: true }));
      if (f > 662) push(FX('qx', 'question', Vi(2.65, 2.7 + 0.05 * Math.sin(f * 0.2), 0.1), q1(((f - 662) / 30) % 1), 0.8 * Math.min(1, back((f - 662) / 8))));
      break;
    }
    case 'abolish': {
      push(FX('nb', 'notice', Vi(5.75, 2.3, -20), 0, 1.4, { k: f >= STAMP_F ? q1(clamp((f - STAMP_F) / 6)) : 0 }));
      const civ = f >= POOF_F + 4, who = civ ? ['civ1', 'civ2', 'civ3'] : ['sold1', 'sold2', 'sold3'];
      [[4.2, -17.6], [3.43, -18.06], [4.97, -17.14]].forEach(([x, z], i) => push(stander(f, 'a' + i, who[i], Vi(x - (civ ? 0.004 * (f - POOF_F) : 0), 0, z), 61 + i, civ ? ['laugh', 'grin', 'smile'][i] : 'stern', { cheer: civ && f > 805 ? q1(0.5 + 0.5 * Math.sin(f * 0.3 + i)) : undefined })));
      if (f >= POOF_F && f < POOF_F + 18) [[4.2, -17.6], [3.43, -18.06], [4.97, -17.14]].forEach(([x, z], i) => push(FX('pf' + i, 'smoke', Vi(x, 1.2, z + 0.15), q1((f - POOF_F) / 18), 2.0, { seed: i + 2 })));
      if (f >= STAMP_F && f < STAMP_F + 14) push(FX('ss', 'stars', Vi(5.7, 3.4, -19.6), q1((f - STAMP_F) / 14), 1.2));
      break;
    }
  }
  return A;
};

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 30, el: 50, sun: [1.0, 0.96, 0.86], sunI: 2.4, sky: '#4a9ae0', hor: '#d4e8f2', hemiSky: '#c6dcf2', hemiGnd: '#8aa060', hemiI: 1.15, fog: [80, 700], card: [1, 1, 1], sat: 1.1, gain: 1.0, sunDisc: 0 },
  golden: { az: 60, el: 25, sun: [1.0, 0.8, 0.55], sunI: 2.3, sky: '#d89a68', hor: '#f4d2a4', hemiSky: '#f0d0a8', hemiGnd: '#8a6a40', hemiI: 1.15, fog: [60, 500], card: [1, 0.94, 0.84], sat: 1.06, gain: 1.0, sunDisc: 0 },
  cold: { az: 20, el: 35, sun: [0.85, 0.9, 1.0], sunI: 1.5, sky: '#9aaac0', hor: '#dfe6ee', hemiSky: '#d8e2ee', hemiGnd: '#9aa0aa', hemiI: 1.35, fog: [40, 420], card: [0.92, 0.95, 1.0], sat: 0.92, gain: 1.0, sunDisc: 0 },
  night: { az: -40, el: 40, sun: [0.55, 0.65, 1.0], sunI: 1.0, sky: '#141c3c', hor: '#2e3a6a', hemiSky: '#4a5a9a', hemiGnd: '#2a2a3a', hemiI: 0.95, fog: [40, 400], card: [0.72, 0.76, 0.95], sat: 0.95, gain: 1.0, sunDisc: 0, lamps: 1 },
};
export const lightFor = (f) => LIGHTS[shotAt(f).light];
