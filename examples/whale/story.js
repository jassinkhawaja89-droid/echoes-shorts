// "The Exploding Whale" (Florence, Oregon, 1970) — pure functions of the frame number (30 fps).
export const FPS = 30, N = 891;
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
export const WHALE = [0, 0, 0], ENG = [2.6, 0, 4.2], CRATES = [0.4, 0, 3.0], CAR = [5, 0, 27], OWNER = [7.2, 0, 25.0];
const CROWD = [[-1.2, 0, 19.6], [-0.3, 0, 19.0], [0.8, 0, 19.4], [1.7, 0, 18.8], [-2.1, 0, 18.6]];
const CROWD_WHO = ['c1', 'c2', 'c3', 'c4', 'c5'];

// ---------- shots ----------
export const SHOTS = [
  { id: 'hook', a: 0, b: 150, light: 'day' },
  { id: 'beach', a: 150, b: 264, light: 'day' },
  { id: 'plan', a: 264, b: 390, light: 'day' },
  { id: 'gulls', a: 390, b: 492, light: 'day' },
  { id: 'boom', a: 492, b: 564, light: 'day' },
  { id: 'rain', a: 564, b: 662, light: 'day' },
  { id: 'car', a: 662, b: 740, light: 'day' },
  { id: 'fled', a: 740, b: 792, light: 'day' },
  { id: 'twist', a: 792, b: 891, light: 'day' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1];
export const BOOM = 536, HEADHIT = 118, ROOF = 690, BUTTON_F = 858;
export const FLASH = [[BOOM, 8], [147, 5]];
export const flashAt = (f) => { let v = 0; for (const [a, d] of FLASH) { const t = (f - a) / d; if (t >= 0 && t <= 1) v = Math.max(v, Math.sin(t * Math.PI)); } return v; };
export const KICKS = [[HEADHIT, 0.4], [BOOM, 1.0], [BOOM + 8, 0.6], [ROOF, 0.8], [BUTTON_F, 0.5]];
const kickAt = (f) => { let k = 0; for (const [a, s] of KICKS) { const d = f - a; if (d >= 0 && d < 7) k += s * (d % 2 ? -1 : 1) * (1 - d / 7); } return k; };
// crates pop in one after another during "half a ton of dynamite"
const CRATE_T = [300, 312, 324, 336, 348, 360];
export const worldAt = (f) => ({
  shot: shotAt(f).id,
  crates: CRATE_T.map((t) => (f < BOOM ? back(clamp((f - t) / 9)) : 0)),
  crush: f < ROOF ? 0 : easeOut((f - ROOF) / 5),
  blown: f >= BOOM,
});

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
    case 'hook': c = glide(C([5.5, 3.6, 21], [-0.5, 1.6, 0], 46, -2), C([2.9, 1.65, 8.2], [2.55, 1.55, 4.2], 40, 1), sstep((f - 4) / 92)); break;
    case 'beach': c = orbit(C([10, 3.2, 15], [0.5, 1.4, 0], 46, -1), -18 + 22 * sstep(t)); break;
    case 'plan': c = glide(C([2.6, 1.5, 9.2], [1.8, 1.4, 3.6], 42, -1), C([1.4, 1.2, 6.6], [0.7, 0.9, 3.0], 42, 2), sstep((f - 290) / 80)); break;
    case 'gulls': c = glide(C([3.0, 1.6, 8.6], [2.7, 1.9, 4.2], 42, 0), C([3.2, 1.4, 9.6], [1.4, 6.2, 0], 50, 3), sstep((f - 440) / 45)); break;
    case 'boom': c = creep(C([0.6, 3.0, 27.5], [0.0, 2.2, 0], 44, 0), 0.002 * (f - 492)); break;
    case 'rain': c = orbit(creep(C([0.2, 1.7, 14.2], [0.1, 1.5, 19.2], 46, 0), 0.0015 * (f - 564)), -10 + 18 * sstep(t)); break;
    case 'car': c = glide(C([10.8, 2.6, 20.0], [4.4, 1.1, 26.6], 46, -1), C([10.0, 2.2, 20.8], [4.2, 1.1, 26.6], 46, 1), sstep(t)); break;
    case 'fled': c = glide(C([1.0, 1.8, 9], [0.5, 5, 0], 50, -2), C([1.2, 1.8, 9], [0.0, 10.5, -2], 52, 3), sstep(t)); break;
    case 'twist': {
      c = glide(C([3.0, 1.65, 7.8], [2.6, 1.6, 4.2], 40, 0), C([7.5, 3.4, 19], [0.6, 1.6, 0], 46, 0), sstep((f - 796) / 50));
      if (f >= BUTTON_F) c = creep(c, 0.05 * easeOut((f - BUTTON_F) / 10));
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
    case 'hook': return [f > 60 ? 8 : 0, dist([ENG[0], 1.6, ENG[2]])];
    case 'plan': return [7, dist([CRATES[0] + 0.4, 1.0, CRATES[2]])];
    case 'rain': return [6, dist([0, 1.6, 19.2])];
    default: return [0, 10];
  }
};
export const focusAt = (f) => ({ boom: [0, 0, 12], rain: [0, 0, 19], car: CAR }[shotAt(f).id] || [0, 0, 2]);

// ---------- actors ----------
const P = (id, who, pos, opts = {}, extra = {}) => ({ id, kind: 'person', who, pos, opts, ...extra });
const FX = (id, fx, pos, t, size, extra = {}) => ({ id, kind: 'fx', fx, pos, t, size, ...extra });
const q1 = (v) => Math.round(v * 10) / 10;
const q2 = (v) => Math.round(v * 20) / 20;
// raining blubber: chunk i starts at f0 + i * every at (x, z), lands after 22 frames and stays
const rain = (f, A, f0, n, every, cx, cz, w, d, pre = 0, avoid = []) => {
  for (let i = 0; i < n; i++) { const s = f0 + i * every - pre, x = cx + (R(i * 3.7) - 0.5) * w, z = cz + (R(i * 5.1) - 0.5) * d; if (f < s) continue;
    if (avoid.some(([ax, az]) => Math.hypot(x - ax, z - az) < 0.55)) continue;
    const t = clamp((f - s) / 22), y = lerp(12, 0.16, easeIn(t)), rot = t < 1 ? q1((f - s) * 0.25 + i) : q1(i * 0.7);
    A.push(FX('k' + i, 'blub', [x, y, z], 0, 0.42, { rot, flip: i % 2 === 1 })); }
};
const eng = (f, opts = {}, extra = {}) => P('eng', 'eng', ENG, { mode: 'stand', expr: 'grin', seed: 11, blink: blinkAt(f, 11), headTilt: 3 * idle(f, 3), ...opts }, extra);
const gull = (f, id, pos, w, seed, extra = {}) => FX(id, 'gull', pos, 0, w, { ph: q2(((f + seed * 7) / 14) % 1), rotZ: 0.08 * Math.sin(f * 0.05 + seed), ...extra });
const circling = (f, A, n, h0, sp = 0.025) => { for (let i = 0; i < n; i++) { const a = f * sp + i * (6.28 / n), r = 3.5 + (i % 3) * 1.6, h = h0 + (i % 3) * 1.4;
  A.push(gull(f, 'g' + i, [r * Math.cos(a), h, r * Math.sin(a) * 0.6], 1.3, i + 1, { flip: Math.sin(a) > 0 })); } };
const headChunk = (f, f0, pos) => { // chunk falling on a head (top of the head at ~1.93 m)
  const t = clamp((f - f0 + 16) / 16), y = lerp(9, 1.8, easeIn(t));
  return FX('hc', 'blub', [pos[0] - 0.02, y, pos[2] + 0.05], 0, 0.34, { rot: t < 1 ? q1(f * 0.3) : 0.2 });
};
const stink = (f, A, n, base) => { for (let i = 0; i < n; i++) { const t = ((f / 60) + i / n) % 1;
  A.push(FX('st' + i, 'stink', [base[0] + (i - n / 2) * 2.2, base[1] + 2.4 + 2.2 * t, base[2] + 0.4 * (i % 2)], q2(t), 1.6)); } };

export const actorsAt = (f) => {
  const s = shotAt(f).id, A = [];
  switch (s) {
    case 'hook': {
      const hit = f >= HEADHIT;
      A.push(eng(f, { expr: hit ? 'dazed' : 'grin', point: hit ? undefined : q1(0.6 + 0.3 * Math.sin(f * 0.1)) }));
      if (f >= HEADHIT - 16) A.push(headChunk(f, HEADHIT, ENG));
      if (hit && f < HEADHIT + 14) A.push(FX('hst', 'stars', [ENG[0] + 0.1, 2.2, ENG[2] + 0.15], q1((f - HEADHIT) / 14), 0.8));
      rain(f, A, 20, 40, 2, 1.5, 3.6, 7, 3.5, 0, [ENG]);
      stink(f, A, 3, [0, 0, 0.5]);
      break;
    }
    case 'beach': {
      stink(f, A, 5, [0, 0, 0.6]);
      circling(f, A, 5, 7);
      A.push(P('o1', 'off1', [4.2, 0, 4.4], { mode: 'stand', expr: 'pained', seed: 21, blink: blinkAt(f, 21), headTilt: 5 * idle(f, 2) }));
      A.push(P('o2', 'off2', [5.4, 0, 3.9], { mode: 'stand', expr: 'nervous', seed: 23, blink: blinkAt(f, 23), headTilt: 5 * idle(f, 4) }, { flip: true }));
      break;
    }
    case 'plan': {
      A.push(eng(f, { expr: 'grin', point: f > 300 ? q1(0.7 + 0.3 * Math.sin(f * 0.15)) : undefined, headTilt: 6 * Math.sin(f * 0.12) }, { pos: [1.85, 0, 3.7], flip: true }));
      stink(f, A, 2, [0, 0, 0.6]);
      break;
    }
    case 'gulls': {
      A.push(eng(f, { expr: 'smile', headTilt: 4 * idle(f, 2) }));
      if (f >= 404) A.push(FX('bub', 'bubble', [ENG[0] - 0.35, 2.35, ENG[2] + 0.1], q1(back(clamp((f - 404) / 10))), 0.75, { icon: 'gull' }));
      circling(f, A, 6, 6.5);
      break;
    }
    case 'boom': {
      CROWD.forEach((p, i) => A.push(P('cr' + i, CROWD_WHO[i], p, { mode: 'stand', expr: f < BOOM ? (i % 2 ? 'smile' : 'neutral') : 'shock', seed: 51 + i, blink: f < BOOM ? blinkAt(f, 51 + i) : 0, headTilt: 4 * idle(f, i) }, { flip: i % 2 === 1 })));
      if (f < BOOM) circling(f, A, 4, 7);
      if (f >= BOOM) {
        const t = (f - BOOM) / 26;
        A.push(FX('bang', 'bang', [0, 3, 0.5], q1(clamp(t * 1.4)), 13));
        A.push(FX('sm1', 'smoke', [-1.5, 2.5 + 4 * clamp(t), 0], q1(clamp(t * 0.8)), 11 + 6 * clamp(t), { seed: 3 }));
        A.push(FX('sm2', 'smoke', [2.0, 3.0 + 6 * clamp(t), -0.5], q1(clamp(t * 0.7)), 10 + 6 * clamp(t), { seed: 7 }));
        for (let i = 0; i < 14; i++) { const a = -0.3 + (i / 13) * 3.74, v = 0.35 + 0.25 * R(i), d = f - BOOM;
          A.push(FX('fly' + i, 'blub', [Math.cos(a) * v * d * 0.7, 2.5 + Math.sin(a) * v * d * 0.9 + 0.2 * d, 0.6 + 0.2 * Math.sin(i)], 0, 0.9, { rot: q1(d * 0.3 + i) })); }
      }
      break;
    }
    case 'rain': {
      CROWD.forEach((p, i) => { const dir = i % 2 ? 1 : -1, w = clamp((f - 590 - i * 4) / 60), x = p[0] + dir * 2.4 * sstep(w);
        A.push(P('cr' + i, CROWD_WHO[i], [x, 0, p[2]], { mode: w > 0 && w < 1 ? 'march' : 'stand', phase: q2(((f - 590) / 12) % 1), expr: 'shock', seed: 51 + i, headTilt: 6 * Math.sin(f * 0.4 + i) }, { flip: dir < 0 })); });
      rain(f, A, 564, 40, 2, 0.2, 19.2, 7, 3.2, 0, CROWD);
      break;
    }
    case 'car': {
      const owner = f >= ROOF ? 'shock' : 'smile';
      A.push(P('own', 'owner', OWNER, { mode: 'stand', expr: owner, seed: 61, blink: f < ROOF ? blinkAt(f, 61) : 0, headTilt: f >= ROOF ? 6 * Math.sin(f * 0.5) : 3 * idle(f, 6) }, { flip: true }));
      if (f < ROOF) { const t = clamp((f - (ROOF - 20)) / 20); A.push(FX('big', 'blub', [CAR[0], lerp(14, 1.75, easeIn(t)), CAR[2]], 0, 1.2, { rot: q1(f * 0.15) })); }
      else A.push(FX('big', 'blub', [CAR[0], 1.45, CAR[2] + 0.1], 0, 1.2, { rot: 0.2 }));
      if (f >= ROOF && f < ROOF + 16) A.push(FX('cst', 'stars', [CAR[0], 2.3, CAR[2] + 0.4], q1((f - ROOF) / 16), 1.6));
      rain(f, A, 640, 16, 3, 0.8, 26.5, 3.2, 4, 0, [OWNER]);
      break;
    }
    case 'fled': {
      const k = clamp((f - 748) / 30);
      for (let i = 0; i < 6; i++) { const a = i * 1.05, x = 3 * Math.cos(a) + (i % 2 ? 1 : -1) * 6 * easeIn(k), y = 6.5 + (i % 3) * 1.4 + 6 * easeIn(k);
        A.push(gull(f, 'g' + i, [x, y, 3 * Math.sin(a) * 0.6], 1.3, i + 1, { flip: i % 2 === 0, expr: 'shock', ph: q2(((f + i * 7) / 6) % 1) }));
        if (k > 0.05 && i < 4) A.push(FX('sp' + i, 'speed', [x - (i % 2 ? 1.1 : -1.1), y - 0.5, 3 * Math.sin(a) * 0.6 - 0.1], q1(clamp(k * 3)), 1.3, { rotZ: i % 2 ? -0.7 : 0.7 + Math.PI })); }
      break;
    }
    case 'twist': {
      A.push(eng(f, { expr: f < BUTTON_F ? 'dazed' : 'pained' }));
      A.push(FX('hc', 'blub', [ENG[0] - 0.02, 1.8, ENG[2] + 0.05], 0, 0.34, { rot: 0.2 }));
      rain(f, A, 0, 40, 2, 1.5, 3.6, 7, 3.5, 900, [ENG]);
      stink(f, A, 4, [0, 0, 0.6]);
      if (f >= BUTTON_F) A.push(FX('bst', 'stars', [ENG[0] + 0.1, 2.3, ENG[2] + 0.15], q1(clamp((f - BUTTON_F) / 14)), 0.9));
      break;
    }
  }
  return A;
};

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 35, el: 48, sun: [1.0, 0.95, 0.86], sunI: 2.3, sky: '#5aa2dc', hor: '#d8e8f0', hemiSky: '#c6dcf2', hemiGnd: '#b8a070', hemiI: 1.15, fog: [90, 700], card: [1, 1, 1], sat: 1.08, gain: 1.0, sunDisc: 0 },
};
export const lightFor = (f) => LIGHTS[shotAt(f).light];
