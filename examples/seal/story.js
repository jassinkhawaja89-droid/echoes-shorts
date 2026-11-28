// "Hoover the Talking Seal" (Maine 1971 / Boston) — pure functions of the frame number (30 fps).
export const FPS = 30, N = 843;
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
export const POND = [9, 0, 5], SIGN = [7.4, 0, 8.4], BA = [-120, 0, 0], AQ = [120, 0, 0];
const ROCKSEAT = [AQ[0] + 0.6, 1.68, AQ[2] - 0.8]; // Hoover on the pool rock (card centre)
const PUPROCK = [0.2, 1.12, -3.6];
const TUB = [BA[0] + 0.05, 0.8, BA[2] - 1.35];

// ---------- shots ----------
export const SHOTS = [
  { id: 'hook', a: 0, b: 128, light: 'day' },
  { id: 'maine', a: 128, b: 264, light: 'day' },
  { id: 'tub', a: 264, b: 331, light: 'indoor' },
  { id: 'gulp', a: 331, b: 441, light: 'day' },
  { id: 'much', a: 441, b: 505, light: 'day' },
  { id: 'move', a: 505, b: 572, light: 'day' },
  { id: 'voice', a: 572, b: 716, light: 'eve' },
  { id: 'reveal', a: 716, b: 760, light: 'eve' },
  { id: 'twist', a: 760, b: 843, light: 'eve' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1];
export const HELLO = 62, ENGLISH = 90, PICK = 196, HOOVER = 406, VACUUM = 368, SPLASH = 520, HEY = 652, CAP = 772, BUTTON_F = 812;
export const FLASH = [[128, 5], [264, 5], [331, 5], [505, 6], [572, 8]];
export const flashAt = (f) => { let v = 0; for (const [a, d] of FLASH) { const t = (f - a + d / 2) / d; if (t >= 0 && t <= 1) v = Math.max(v, Math.sin(t * Math.PI) * 0.8); } return v; };
export const KICKS = [[ENGLISH, 0.5], [HEY, 0.9], [716, 0.4], [BUTTON_F, 0.6]];
const kickAt = (f) => { let k = 0; for (const [a, s] of KICKS) { const d = f - a; if (d >= 0 && d < 7) k += s * (d % 2 ? -1 : 1) * (1 - d / 7); } return k; };
export const worldAt = (f) => ({
  shot: shotAt(f).id,
  sign: f < HOOVER ? 0 : back(clamp((f - HOOVER) / 10)),
  bucketTip: f >= 441 ? 1.35 : 0,
});

// ---------- cameras ----------
const C = (pos, look, fov = 40, roll = 0) => ({ pos, look, fov, roll });
const glide = (a, b, t) => C(L3(a.pos, b.pos, t), L3(a.look, b.look, t), lerp(a.fov, b.fov, t), lerp(a.roll, b.roll, t));
const creep = (c, k) => { const d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]]; return { ...c, pos: [c.pos[0] + d[0] * k, c.pos[1] + d[1] * k, c.pos[2] + d[2] * k] }; };
const orbit = (c, deg) => { const a = deg * Math.PI / 180, dx = c.pos[0] - c.look[0], dz = c.pos[2] - c.look[2];
  return { ...c, pos: [c.look[0] + dx * Math.cos(a) - dz * Math.sin(a), c.pos[1], c.look[2] + dx * Math.sin(a) + dz * Math.cos(a)] }; };
const drift = (c, f, k = 1) => ({ ...c, pos: [c.pos[0] + 0.012 * k * Math.sin(f * 0.07), c.pos[1] + 0.008 * k * Math.sin(f * 0.11 + 1), c.pos[2]], roll: c.roll + 0.35 * k * Math.sin(f * 0.05 + 2) });
const A0 = (x, y, z) => [AQ[0] + x, y, AQ[2] + z];
const B0 = (x, y, z) => [BA[0] + x, y, BA[2] + z];

// george in the Maine shot: walks to the rock, picks the pup up, turns to go home
const georgeMaine = (f) => {
  const w = sstep((f - 132) / 60), back2 = sstep((f - 228) / 36);
  const x = lerp(-3.1, -1.55, w) + lerp(0, -1.4, back2), z = lerp(0.1, -2.35, w) + lerp(0, 1.5, back2);
  return [x, 0, z];
};

export const camAt = (f) => {
  const s = shotAt(f), t = (f - s.a) / (s.b - s.a);
  let c;
  switch (s.id) {
    case 'hook': c = glide(creep(C(A0(0.5, 2.3, 4.6), [ROCKSEAT[0] - 0.05, 1.9, ROCKSEAT[2]], 40, -1), 0.0015 * f), C(A0(0.45, 2.4, 10.8), A0(0.4, 1.35, 1.0), 50, 1), sstep((f - ENGLISH + 4) / 32)); break;
    case 'maine': { const g = georgeMaine(f);
      c = glide(C([2.2, 2.6, 5.8], [-1.9, 1.0, -2.0], 44, -1), C([0.6, 1.6, 2.6], [g[0] + 0.4, 1.1, g[2] - 0.4], 42, 1), sstep((f - 140) / 90)); break; }
    case 'tub': c = creep(C(B0(0.6, 2.0, 3.1), B0(0.55, 0.95, -1.1), 46, -1), 0.12 * sstep(t)); c.roll += 2 * t; break;
    case 'gulp': c = glide(C([9.3, 1.6, 13.4], [9.05, 1.0, 8.2], 44, 1), C([9.0, 1.45, 12.4], [9.0, 0.95, 8.2], 44, -1), sstep(t)); break;
    case 'much': c = orbit(C([9.1, 1.6, 13.0], [9.05, 1.0, 8.2], 46, 0), -6 + 12 * sstep(t)); break;
    case 'move': c = creep(C(A0(-0.8, 2.4, 9.0), A0(-0.85, 1.1, 2.0), 50, 0), 0.1 * sstep(t)); break;
    case 'voice': { c = creep(C(A0(2.5, 1.7, 8.8), A0(2.25, 1.35, 4.0), 42, 0), 0.08 * sstep(t)); if (f >= HEY) c = creep(c, 0.12 * easeOut((f - HEY) / 12)); break; }
    case 'reveal': c = glide(C(A0(2.3, 1.7, 7.6), A0(2.1, 1.4, 4.0), 42, 0), C(A0(1.15, 2.1, 3.9), [ROCKSEAT[0] + 0.1, 1.85, ROCKSEAT[2]], 40, -2), easeOut(t * 1.6)); break;
    case 'twist': {
      c = glide(C(A0(1.3, 2.15, 4.6), [ROCKSEAT[0] + 0.1, 1.85, ROCKSEAT[2]], 40, -2), C(A0(1.0, 2.1, 3.9), [ROCKSEAT[0] + 0.1, 1.9, ROCKSEAT[2]], 38, 1), sstep(t));
      if (f >= BUTTON_F) c = creep(c, 0.06 * easeOut((f - BUTTON_F) / 10));
      c.roll += f >= BUTTON_F ? 2.5 * easeOut((f - BUTTON_F) / 10) : 0; break; }
  }
  c = drift(c, f);
  const k = kickAt(f);
  if (k) c = { ...c, roll: c.roll + 1.3 * k, look: [c.look[0], c.look[1] + 0.03 * k, c.look[2]] };
  return c;
};
export const dofAt = (f) => {
  const s = shotAt(f).id, cam = camAt(f);
  const dist = (p) => Math.hypot(p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]);
  switch (s) {
    case 'hook': return [f < ENGLISH ? 8 : 0, dist(ROCKSEAT)];
    case 'tub': return [6, dist(TUB)];
    case 'gulp': return [5, dist([8.6, 0.5, 7.9])];
    case 'reveal': case 'twist': return [8, dist(ROCKSEAT)];
    case 'voice': return [6, dist(A0(2.1, 1.5, 4.0))];
    default: return [0, 10];
  }
};
export const focusAt = (f) => ({ hook: A0(0, 0, 2), maine: [-1, 0, -2], tub: B0(0, 0, -0.5), gulp: [9, 0, 7], much: [9, 0, 7], move: A0(0, 0, 2), voice: A0(1.5, 0, 3), reveal: A0(1, 0, 1), twist: A0(1, 0, 1) }[shotAt(f).id]);

// ---------- actors ----------
const P = (id, who, pos, opts = {}, extra = {}) => ({ id, kind: 'person', who, pos, opts, ...extra });
const FX = (id, fx, pos, t, size, extra = {}) => ({ id, kind: 'fx', fx, pos, t, size, ...extra });
const q1 = (v) => Math.round(v * 10) / 10;
const q2 = (v) => Math.round(v * 20) / 20;
const seal = (id, pos, size, o, extra = {}) => FX(id, 'seal', pos, 0, size, { o, ...extra });
const talk = (f, a, b) => (f >= a && f < b ? q1(0.5 + 0.5 * Math.sin((f - a) * 0.9)) : 0);
const speech = (id, pos, f, f0, lines, size = 1.3, tail = 'left') => (f >= f0 ? FX(id, 'speech', pos, q1(back(clamp((f - f0) / 8))), size, { o: { lines, tail } }) : null);
const hooverRock = (f, o = {}) => seal('hoover', [ROCKSEAT[0], ROCKSEAT[1] + 0.02 * Math.sin(f * 0.12), ROCKSEAT[2]], 1.5, { expr: 'happy', ...o }, { rotZ: 0.03 * Math.sin(f * 0.09) });

export const actorsAt = (f) => {
  const s = shotAt(f).id, A = [];
  const push = (x) => { if (x) A.push(x); };
  switch (s) {
    case 'hook': {
      push(hooverRock(f, { mouth: talk(f, HELLO - 2, HELLO + 14), expr: 'happy' }));
      push(speech('sp1', [ROCKSEAT[0] - 0.2, 2.75, ROCKSEAT[2] + 0.2], f, HELLO, ['HELLO!'], 1.1, 'right'));
      const sh = f >= ENGLISH;
      A.push(P('vis', 'visitor', A0(-0.45, 0, 4.8), { mode: 'stand', expr: sh ? 'shock' : 'smile', seed: 31, blink: sh ? 0 : blinkAt(f, 31), headTilt: sh ? 6 * Math.sin(f * 0.4) : 3 * idle(f, 2), point: sh ? undefined : 0.4 }, { flip: false }));
      A.push(P('kid', 'kid', A0(1.3, 0, 5.0), { mode: 'stand', expr: sh ? 'shock' : 'grin', seed: 33, blink: sh ? 0 : blinkAt(f, 33), headTilt: 4 * idle(f, 4), shrug: sh ? 1 : undefined }, { flip: true }));
      break;
    }
    case 'maine': {
      const g = georgeMaine(f), held = f >= PICK, walking = (f > 132 && f < 192) || f > 228;
      A.push(P('george', 'george', g, { mode: walking ? 'march' : 'stand', phase: q2(((f - 132) / 14) % 1), expr: held ? 'relief' : 'smile', seed: 11, blink: blinkAt(f, 11), headTilt: 3 * idle(f, 3), carry: held ? 1 : undefined }, { flip: f > 228 }));
      if (!held) push(seal('pup', [PUPROCK[0], PUPROCK[1] + 0.01 * Math.sin(f * 0.2), PUPROCK[2]], 0.7, { pup: true, expr: f > 170 ? 'happy' : 'sleepy' }, { flip: true }));
      else { const k = sstep((f - PICK) / 10), to = [g[0] + 0.02, 1.08, g[2] + 0.12];
        push(seal('pup', L3(PUPROCK, to, k), 0.62, { pup: true, expr: 'happy' }, { flip: f <= 228 })); }
      if (f >= PICK + 6 && f < PICK + 40) push(FX('heart', 'heart', [g[0] + 0.25, 2.25 + 0.3 * clamp((f - PICK - 6) / 34), g[2] + 0.1], 0, 0.3 * back(clamp((f - PICK - 6) / 8))));
      break;
    }
    case 'tub': {
      push(seal('pup', [TUB[0], TUB[1] + 0.05 * Math.sin(f * 0.35), TUB[2]], 0.8, { pup: true, expr: 'happy', mouth: q1(0.4 + 0.4 * Math.sin(f * 0.3)), wet: true }, { rotZ: 0.12 * Math.sin(f * 0.3) }));
      A.push(P('george', 'george', B0(1.0, 0, -0.25), { mode: 'stand', expr: 'grin', seed: 11, blink: blinkAt(f, 11), headTilt: 5 * Math.sin(f * 0.15), hips: 1 }, { flip: true }));
      for (let i = 0; i < 6; i++) { const ph = ((f - 264) / 16 + i / 6) % 1, x = TUB[0] + (i - 2.5) * 0.25, y = 0.75 + 0.9 * ph - 1.2 * ph * ph;
        push(FX('dr' + i, 'drop', [x + (i % 2 ? 0.25 : -0.25) * ph, y, TUB[2] + 0.35], 0, 0.12)); }
      break;
    }
    case 'gulp': {
      const sz = lerp(0.85, 1.05, clamp((f - 331) / 110)), pup = [8.45, 0.05 + sz * 0.33, 7.95];
      let mouth = 0;
      for (let i = 0; i < 7; i++) { const t0 = 338 + i * 13, k = (f - t0) / 10; if (k < 0 || k > 1) continue;
        const from = [9.4, 1.55, 8.55], to = [pup[0] + 0.36 * sz, pup[1] + 0.02, pup[2] + 0.05];
        const p = L3(from, to, k); p[1] += 0.8 * Math.sin(Math.PI * k);
        push(FX('fish' + (i % 3), 'fish', p, 0, 0.32, { rot: q1(-0.5 + k * 1.2), flip: true })); mouth = Math.max(mouth, k > 0.4 ? 1 : k * 2); }
      const tossK = ((f - 336) % 13) / 13;
      push(seal('pup', pup, sz, { pup: true, expr: mouth > 0.5 ? 'gulp' : 'happy', mouth: q1(mouth) }, { rotZ: 0.05 * Math.sin(f * 0.5) }));
      A.push(P('george', 'george', [9.75, 0, 8.6], { mode: 'stand', expr: f > HOOVER ? 'laugh' : 'grin', seed: 11, blink: blinkAt(f, 11), headTilt: 4 * idle(f, 3), toss: f < 430 ? q1(Math.sin(Math.PI * tossK)) : undefined }, { flip: true }));
      if (f >= VACUUM) push(FX('bub', 'bubble', [9.05, 2.28, 8.45], q1(back(clamp((f - VACUUM) / 10))), 0.72, { icon: 'vacuum' }));
      break;
    }
    case 'much': {
      push(seal('hoover', [8.5, 0.62 + 0.02 * Math.sin(f * 0.2), 7.85], 1.55, { expr: 'happy', mouth: q1(0.5 + 0.5 * Math.sin(f * 0.6)) }, { rotZ: 0.04 * Math.sin(f * 0.15) }));
      A.push(P('george', 'george', [9.85, 0, 8.6], { mode: 'stand', expr: 'nervous', seed: 11, blink: blinkAt(f, 11), headTilt: 6 * Math.sin(f * 0.2), shrug: q1(0.6 + 0.4 * Math.sin(f * 0.25)) }, { flip: true }));
      break;
    }
    case 'move': {
      if (f >= SPLASH - 4 && f < SPLASH + 22) push(FX('spl', 'splash', A0(-0.8, 0.9, 1.5), q1(clamp((f - SPLASH + 4) / 26)), 2.4));
      if (f >= SPLASH + 6) { const k = sstep((f - SPLASH - 6) / 30); push(seal('hoover', [lerp(AQ[0] - 0.7, AQ[0] - 1.0, k), 0.55 + 0.05 * Math.sin(f * 0.3), AQ[2] + 1.6], 1.4, { expr: 'happy', wet: true }, { flip: true })); }
      A.push(P('george', 'george', A0(-1.55, 0, 4.3), { mode: 'stand', expr: f > SPLASH ? 'relief' : 'smile', seed: 11, blink: blinkAt(f, 11), headTilt: 4 * idle(f, 3), present: q1(0.5 + 0.5 * Math.sin(f * 0.35)) }));
      A.push(P('keeper', 'keeper', A0(-0.05, 0, 4.4), { mode: 'stand', expr: 'grin', seed: 41, blink: blinkAt(f, 41), headTilt: 3 * idle(f, 5), bucket: 1 }, { flip: true }));
      break;
    }
    case 'voice': {
      const hey = f >= HEY, jump = hey ? 0.18 * Math.sin(Math.PI * clamp((f - HEY) / 8)) : 0;
      A.push(P('keeper', 'keeper', A0(2.05, jump, 4.0), { mode: 'stand', expr: hey ? 'shock' : 'whistle', seed: 41, blink: hey ? 0 : blinkAt(f, 41), headTilt: hey ? 8 * Math.sin(f * 0.5) : 4 * Math.sin(f * 0.1), broom: hey ? 0 : q1(Math.sin(f * 0.25)) }, { flip: true }));
      A.push(P('keeper2', 'keeper2', A0(2.95, 0, 3.3), { mode: 'stand', expr: hey ? 'shock' : 'smile', seed: 43, blink: hey ? 0 : blinkAt(f, 43), headTilt: 4 * idle(f, 6), bucket: 1 }, { flip: true }));
      push(speech('sp2', A0(2.05, 2.55, 4.3), f, HEY, ['HEY! COME', 'OVER HERE!'], 0.95, 'left'));
      break;
    }
    case 'reveal': {
      push(hooverRock(f, { mouth: talk(f, 716, 744), expr: 'happy' }));
      push(speech('sp3', [ROCKSEAT[0] - 0.25, 2.7, ROCKSEAT[2] + 0.4], f, 722, ['HEY!'], 0.9, 'right'));
      break;
    }
    case 'twist': {
      const cap = f >= CAP;
      push(hooverRock(f, { mouth: talk(f, 784, 806), cap, expr: f >= BUTTON_F ? 'gulp' : 'happy' }));
      if (f >= CAP - 2 && f < CAP + 14) push(FX('puff', 'puff', [ROCKSEAT[0] + 0.35, ROCKSEAT[1] + 0.55, ROCKSEAT[2] + 0.2], q1(clamp((f - CAP + 2) / 16)), 0.7));
      push(speech('sp4', [ROCKSEAT[0] - 0.25, 2.7, ROCKSEAT[2] + 0.4], f, 784, ['HELLO', 'THERE!'], 0.95, 'right'));
      if (f >= BUTTON_F) push(FX('st', 'stars', [ROCKSEAT[0] + 0.3, ROCKSEAT[1] + 0.75, ROCKSEAT[2] + 0.2], q1(clamp((f - BUTTON_F) / 16)), 0.6));
      break;
    }
  }
  return A;
};

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 35, el: 48, sun: [1.0, 0.95, 0.86], sunI: 2.3, sky: '#5aa2dc', hor: '#d8e8f0', hemiSky: '#c6dcf2', hemiGnd: '#b8a070', hemiI: 1.15, fog: [90, 700], card: [1, 1, 1], sat: 1.08, gain: 1.0, sunDisc: 0 },
  indoor: { az: 20, el: 70, sun: [1.0, 0.96, 0.9], sunI: 1.4, sky: '#bcd8ec', hor: '#e8eef0', hemiSky: '#f4f0e8', hemiGnd: '#c8b898', hemiI: 1.7, fog: [60, 400], card: [1, 1, 1], sat: 1.06, gain: 1.02, sunDisc: 0 },
  eve: { az: -60, el: 16, sun: [1.0, 0.72, 0.46], sunI: 2.1, sky: '#4a5a9a', hor: '#f0a878', hemiSky: '#8a90c0', hemiGnd: '#a07858', hemiI: 1.0, fog: [80, 600], card: [1, 0.92, 0.84], sat: 1.1, gain: 0.98, sunDisc: 1 },
};
export const lightFor = (f) => LIGHTS[shotAt(f).light];
