// "Rats on Trial" (Autun, early 1500s) — pure functions of the frame number (30 fps).
export const FPS = 30, N = 858;
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
export const SQUARE = [0, 0, 0], STREET = [60, 0, 0], MARKET = [-60, 0, 0], FIELD = [150, 0, 0], ROAD = [150, 0, -60];
export const VILLS = [[0, 150, 1], [-13, 190, 5], [14, 232, 9]];

// ---------- shots ----------
export const SHOTS = [
  { id: 'hook', a: 0, b: 130, light: 'day' },
  { id: 'crime', a: 130, b: 203, light: 'day' },
  { id: 'summon', a: 203, b: 290, light: 'day' },
  { id: 'lawyer', a: 290, b: 386, light: 'day' },
  { id: 'vills', a: 386, b: 466, light: 'day' },
  { id: 'priest', a: 466, b: 530, light: 'day' },
  { id: 'norats', a: 530, b: 570, light: 'day' },
  { id: 'peek', a: 570, b: 618, light: 'golden' },
  { id: 'cats', a: 618, b: 688, light: 'golden' },
  { id: 'safety', a: 688, b: 764, light: 'day' },
  { id: 'twist', a: 764, b: 858, light: 'day' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1];
export const FLASH = [[384, 6]];
export const flashAt = (f) => { let v = 0; for (const [a, d] of FLASH) { const t = (f - a) / d; if (t >= 0 && t <= 1) v = Math.max(v, Math.sin(t * Math.PI)); } return v; };
export const GAVEL1 = 60, GAVEL2 = 214, CATJUMP = 802, BUTTON_F = 834;
export const KICKS = [[GAVEL1, 0.3], [GAVEL2, 0.5], [CATJUMP + 8, 0.3], [BUTTON_F, 0.6]];
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
const Mk = at(MARKET), St = at(STREET), Fd = at(FIELD), Rd = at(ROAD);
const JUDGE = Mk(0, 0.96, -4.4), STOOL = Mk(0.9, 0.48, -0.6), LAW = Mk(-1.0, 0, -0.4);

export const camAt = (f) => {
  const s = shotAt(f), t = (f - s.a) / (s.b - s.a);
  let c;
  switch (s.id) {
    case 'hook': c = glide(C(Mk(1.05, 0.95, 1.5), Mk(0.9, 0.8, -0.6), 40, -2), C(Mk(0.3, 2.3, 7.4), Mk(0.0, 1.9, -2.2), 44, 1), sstep((f - 8) / 80)); break;
    case 'crime': c = orbit(creep(C(Fd(0.2, 0.75, 3.6), Fd(0, 0.55, 0.4), 42, 0), 0.0015 * (f - 130)), -12 + 22 * sstep(t)); break;
    case 'summon': {
      const a = C(Mk(0.1, 2.75, -0.6), Mk(0, 2.6, -4.4), 42, 0), b = C(Mk(1.15, 1.05, 1.5), Mk(0.9, 0.75, -0.6), 42, -1.5);
      c = glide(creep(a, 0.002 * (f - 203)), b, sstep((f - 238) / 22)); if (f > 260) c = creep(c, 0.002 * (f - 260)); break; }
    case 'lawyer': c = orbit(creep(C(Mk(-0.25, 1.6, 2.7), Mk(-0.85, 1.65, -0.4), 42, 0), 0.0012 * (f - 290)), 8 - 14 * sstep(t)); break;
    case 'vills': c = glide(C([0, 16, 108], [0, 5, 185], 46, -2), C([3, 26, 100], [0, 4, 190], 46, 2), sstep(t)); break;
    case 'priest': c = orbit(creep(C(St(0, 1.65, 4.3), St(0, 1.5, 0), 44, 0), 0.0015 * (f - 466)), -10 + 18 * sstep(t)); break;
    case 'norats': c = glide(C(Mk(1.9, 1.35, 2.6), Mk(0.8, 0.85, -0.7), 42, 0), C(Mk(1.5, 1.2, 2.0), Mk(0.85, 0.8, -0.65), 42, 1.5), sstep(t)); break;
    case 'peek': c = creep(C(Rd(-1.45, 0.55, -1.5), Rd(-1.75, 0.4, 0.9), 42, 0), 0.12 * sstep(t)); break;
    case 'cats': c = glide(C(Rd(0.0, 0.7, 0.2), Rd(0, 0.55, -10), 44, 0), C(Rd(0.0, 0.8, -0.7), Rd(0, 0.5, -12), 44, -1.5), sstep(t)); break;
    case 'safety': c = orbit(creep(C(Mk(-1.75, 1.85, 3.3), Mk(-0.3, 2.1, -4.4), 44, 0), 0.0015 * (f - 688)), -6 + 10 * sstep(t)); break;
    case 'twist': {
      const a = C(Mk(0.3, 2.6, 0.6), Mk(0, 2.5, -4.4), 42, 0), b = C(Mk(1.1, 1.1, 1.55), Mk(0.9, 0.82, -0.6), 42, -1);
      c = glide(creep(a, 0.002 * (f - 764)), b, sstep((f - 790) / 18));
      if (f >= BUTTON_F) c = creep(c, 0.08 * easeOut((f - BUTTON_F) / 10));
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
    case 'crime': return [9, dist(Fd(0, 0.4, 0.6))];
    case 'lawyer': return [9, dist(Mk(-1.0, 1.7, -0.4))];
    case 'priest': return [8, dist(St(0, 1.5, 0))];
    case 'peek': return [9, dist(Rd(-1.6, 0.35, 0.9))];
    case 'safety': return [6, dist(Mk(0, 2.6, -4.4))];
    default: return [0, 10];
  }
};
export const focusAt = (f) => ({ crime: FIELD, priest: STREET, vills: [0, 0, 170], peek: ROAD, cats: Rd(0, 0, -6) }[shotAt(f).id] || MARKET);

// ---------- actors ----------
const P = (id, who, pos, opts = {}, extra = {}) => ({ id, kind: 'person', who, pos, opts, ...extra });
const FX = (id, fx, pos, t, size, extra = {}) => ({ id, kind: 'fx', fx, pos, t, size, ...extra });
const q1 = (v) => Math.round(v * 10) / 10;
const q2 = (v) => Math.round(v * 20) / 20;
// rat card: width w (m), standing with feet at base
const rat = (f, id, base, w, seed, extra = {}) => { const h = w * 4 / 3, hop = extra.hop ? 0.04 * w * Math.abs(Math.sin(f * 0.35 + seed)) : 0;
  return FX(id, 'rat', [base[0], base[1] + h / 2 + hop, base[2]], 0, w, { ph: q2(((f + seed * 9) / 40) % 1), blink: blinkAt(f, seed), rotZ: 0.05 * Math.sin(f * 0.12 + seed), ...extra }); };
const cat = (f, id, base, w, seed, extra = {}) => FX(id, 'cat', [base[0], base[1] + w / 2, base[2]], 0, w, { ph: q2(((f + seed * 13) / 50) % 1), rotZ: 0.03 * Math.sin(f * 0.08 + seed), ...extra });
const CATCOL = [['#e08a3a', '#a85a22'], ['#5a5a66', '#3a3a44'], ['#2a2430', '#141018'], ['#c8b8a0', '#8a7a60'], ['#d8d0c8', '#9a928a']];
const crowd = (f, A) => {
  A.push(P('t1', 'man1', Mk(-2.0, 0, -1.5), { mode: 'stand', expr: 'shock', seed: 31, blink: blinkAt(f, 31), headTilt: 5 * idle(f, 1) }));
  A.push(P('t2', 'wife1', Mk(2.1, 0, -1.7), { mode: 'stand', expr: 'nervous', seed: 33, blink: blinkAt(f, 33), headTilt: 5 * idle(f, 2) }, { flip: true }));
  A.push(P('t3', 'man3', Mk(-2.8, 0, -2.6), { mode: 'stand', expr: 'grin', seed: 35, blink: blinkAt(f, 35), headTilt: 4 * idle(f, 3) }));
  A.push(P('t4', 'wife2', Mk(2.9, 0, -2.8), { mode: 'stand', expr: 'shock', seed: 37, blink: blinkAt(f, 37), headTilt: 4 * idle(f, 4) }, { flip: true }));
};
const judge = (f, opts = {}) => P('judge', 'judge', JUDGE, { mode: 'stand', expr: 'stern', seed: 21, blink: blinkAt(f, 21), headTilt: 3 * idle(f, 5), ...opts });
const lawyer = (f, opts = {}) => P('law', 'lawyer', LAW, { mode: 'stand', expr: 'sly', seed: 23, blink: blinkAt(f, 23), headTilt: 4 * idle(f, 6), ...opts });
const gav = (f, g) => { const d = f - g; if (d < -14) return 0.3; if (d < 0) return q1(0.3 + 0.7 * sstep((d + 14) / 12)); if (d < 3) return 0; return q1(0.3 * easeOut((d - 3) / 10)); };

export const actorsAt = (f) => {
  const s = shotAt(f).id, A = [];
  switch (s) {
    case 'hook': {
      A.push(judge(f, { gavel: gav(f, GAVEL1), expr: f < GAVEL1 ? 'stern' : 'stern' }));
      A.push(lawyer(f, { expr: 'neutral' }));
      A.push(rat(f, 'r0', STOOL, 0.5, 1, { expr: f < GAVEL1 ? 'happy' : 'scared' }));
      crowd(f, A); break;
    }
    case 'crime': {
      [[-1.1, 0.4], [0.2, 1.2], [1.2, 0.2], [-0.3, -0.6], [0.9, -1.4]].forEach(([x, z], i) => A.push(rat(f, 'f' + i, Fd(x, 0, z), 0.42, i + 3, { pose: 'eat', expr: i % 2 ? 'sly' : 'happy', ph: q2(((f + i * 7) / 24) % 1), flip: i % 2 === 1 })));
      A.push(P('farmer', 'farmer', Fd(-0.6, 0, -4.4), { mode: 'stand', expr: 'stern', point: q1(0.5 + 0.5 * Math.sin((f - 130) * 0.4)), seed: 41, blink: blinkAt(f, 41), headTilt: 6 * Math.sin(f * 0.3) }));
      break;
    }
    case 'summon': {
      A.push(judge(f, { gavel: gav(f, GAVEL2), expr: f < 245 ? 'stern' : 'nervous', look: f > 245 ? 0.6 : 0 }));
      A.push(FX('sum', 'summons', Mk(-0.45, 2.2, -3.7), q1(easeOut((f - 203) / 12)), 0.42));
      A.push(lawyer(f)); crowd(f, A);
      if (f > 244) { const t = (f - 244) / 40; A.push(FX('leaf', 'leaf', Mk(1.9 - 2.4 * t, 0.15 + 0.12 * Math.abs(Math.sin(t * 9)), -0.3), 0, 0.22, { rotZ: q1(t * 8) })); }
      break;
    }
    case 'lawyer': {
      A.push(lawyer(f, { expr: f < 330 ? 'stern' : 'sly', point: q1(0.6 + 0.4 * Math.sin((f - 290) * 0.22)), headTilt: 6 * Math.sin((f - 290) * 0.2) }));
      A.push(judge(f, { gavel: 0.3, expr: 'neutral' })); crowd(f, A); break;
    }
    case 'vills': {
      S_VILLS.forEach(([vx, vz], i) => { const a = 392 + i * 14, k = back(clamp((f - a) / 12)); if (f >= a) A.push(rat(f, 'v' + i, [vx + (i ? 0 : 4), 0, vz - 11], 12 * k + 0.01, i + 7, { expr: 'happy', wave: q1(0.5 + 0.5 * Math.sin(f * 0.3 + i)) })); });
      break;
    }
    case 'priest': {
      A.push(P('pr', 'priest', St(0, 0, 0), { mode: 'stand', expr: 'stern', seed: 51, blink: blinkAt(f, 51), headTilt: 4 * Math.sin(f * 0.25) }));
      A.push(FX('sum2', 'summons', St(0.05, 1.25, 0.35), q1(easeOut((f - 466) / 10)), 0.62));
      A.push(P('o1', 'man2', St(-1.3, 0, -1.6), { mode: 'stand', expr: 'shock', seed: 53, blink: blinkAt(f, 53), headTilt: 4 * idle(f, 2) }));
      A.push(P('o2', 'wife2', St(1.35, 0, -1.4), { mode: 'stand', expr: 'nervous', seed: 55, blink: blinkAt(f, 55), headTilt: 4 * idle(f, 3) }, { flip: true }));
      break;
    }
    case 'norats': {
      A.push(judge(f, { gavel: 0.3, expr: 'stern', look: 0.6 }));
      A.push(lawyer(f, { shrug: q1(clamp((f - 535) / 8)), expr: 'sly' })); crowd(f, A);
      { const t = (f - 530) / 40; A.push(FX('leaf2', 'leaf', Mk(1.9 - 2.4 * t, 0.15 + 0.1 * Math.abs(Math.sin(t * 9)), -0.3), 0, 0.22, { rotZ: q1(t * 8) })); }
      break;
    }
    case 'peek': {
      [[-1.98, 0.75], [-1.55, 0.8], [-1.76, 0.6]].forEach(([x, z], i) => { const k = easeOut((f - 572 - i * 6) / 10); A.push(rat(f, 'p' + i, Rd(x, -0.35 + 0.35 * k, z), 0.32, i + 11, { pose: 'peek', expr: f < 600 ? 'happy' : 'scared', rotZ: 0.06 * Math.sin(f * (f < 600 ? 0.1 : 0.9) + i) })); });
      break;
    }
    case 'cats': {
      for (let i = 0; i < 10; i++) { const side = i % 2 ? 1 : -1, z = -2.4 - Math.floor(i / 2) * 2.0, [c0, c1] = CATCOL[i % 5];
        A.push(cat(f, 'c' + i, Rd(side * 0.85, 0, z), 0.9, i + 1, { col: c0, dk: c1, expr: i === 0 ? 'grin' : 'sly', flip: side > 0 })); }
      break;
    }
    case 'safety': {
      A.push(lawyer(f, { point: q1(clamp((f - 692) / 8)), expr: 'sly', headTilt: 5 * Math.sin(f * 0.2) }));
      A.push(judge(f, { gavel: 0.3, expr: f < 715 ? 'neutral' : 'nervous' }));
      if (f > 718) { const t = ((f - 718) / 18) % 1; A.push(FX('drop', 'drop', [JUDGE[0] + 0.45, JUDGE[1] + 2.15 - 0.3 * t, JUDGE[2] + 0.1], 0, 0.14)); }
      crowd(f, A); break;
    }
    case 'twist': {
      A.push(judge(f, f >= 770 ? { shrug: q1(back(clamp((f - 770) / 8))), expr: 'nervous' } : { gavel: 0.3, expr: 'nervous' }));
      A.push(lawyer(f, { expr: f > 795 ? 'shock' : 'sly' })); crowd(f, A);
      if (f >= CATJUMP) { const t = clamp((f - CATJUMP) / 10), arc = Math.sin(Math.PI * t) * 0.5;
        A.push(cat(f, 'jc', [STOOL[0] + 1.2 * (1 - t), STOOL[1] + arc, STOOL[2] + 0.1], 0.62, 3, { col: '#e08a3a', dk: '#a85a22', expr: f >= BUTTON_F ? 'lick' : 'sly', lick: f >= BUTTON_F ? q1(0.5 + 0.5 * Math.sin((f - BUTTON_F) * 0.6)) : 0 })); }
      break;
    }
  }
  return A;
};
const S_VILLS = VILLS.map(([x, z]) => [x, z]);

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 30, el: 50, sun: [1.0, 0.96, 0.86], sunI: 2.4, sky: '#4a9ae0', hor: '#d4e8f2', hemiSky: '#c6dcf2', hemiGnd: '#8aa060', hemiI: 1.15, fog: [80, 700], card: [1, 1, 1], sat: 1.1, gain: 1.0, sunDisc: 0 },
  golden: { az: 60, el: 25, sun: [1.0, 0.8, 0.55], sunI: 2.3, sky: '#d89a68', hor: '#f4d2a4', hemiSky: '#f0d0a8', hemiGnd: '#8a6a40', hemiI: 1.15, fog: [60, 500], card: [1, 0.94, 0.84], sat: 1.06, gain: 1.0, sunDisc: 0 },
  night: { az: -40, el: 40, sun: [0.55, 0.65, 1.0], sunI: 1.0, sky: '#141c3c', hor: '#2e3a6a', hemiSky: '#4a5a9a', hemiGnd: '#2a2a3a', hemiI: 0.95, fog: [40, 400], card: [0.72, 0.76, 0.95], sat: 0.95, gain: 1.0, sunDisc: 0, lamps: 1 },
};
export const lightFor = (f) => LIGHTS[shotAt(f).light];
