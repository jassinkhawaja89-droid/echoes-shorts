// "The Emu War" — pure functions of the frame number (30 fps, 1235 frames).
export const FPS = 30, N = 1235;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const sstep = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const easeOut = (t) => 1 - (1 - clamp(t)) ** 3;
export const easeIn = (t) => clamp(t) ** 2;
export const back = (t, s = 1.7) => { t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1; };
export const spring = (t, k = 7, d = 5) => { t = Math.max(0, t); return 1 - Math.exp(-d * t) * Math.cos(k * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const R = (s) => { const x = Math.sin(s * 127.1 + 1.3) * 43758.5453; return x - Math.floor(x); };
/** smooth idle wobble */
export const idle = (f, seed) => Math.sin(f * 0.11 + seed * 2.1) * 0.5 + Math.sin(f * 0.047 + seed) * 0.5;
export const blinkAt = (f, seed, every = 70) => { const p = (f + Math.floor(R(seed) * every)) % (every + Math.floor(R(seed + 1) * 25)); return p < 4 ? 1 : 0; };

// ---------- layout ----------
export const HOOK = [30, 0, -30];
export const HERD3 = [10, 0, -48];
export const CAMP = [10, 0, 12];
export const HOUSE = [-42, 0, -62];
export const PUMP = [-30, 0, -55];
/** places the wheat must stay clear of (camera paths, standing spots) */
export const CLEAR = [
  { x: HOOK[0] + 0.6, z: HOOK[2] + 1.0, r: 2.2 }, { x: HOOK[0] + 1.1, z: HOOK[2] + 4.6, r: 1.6 },
  { x: 6.3, z: -9.8, r: 1.4 }, { x: -9.8, z: -11.8, r: 1.6 }, { x: -4, z: -8.5, r: 2.4 }, { x: -3, z: -5.5, r: 1.6 }, { x: -1.5, z: -5, r: 1.0 },
];

// ---------- shots ----------
// a/b frames, light preset
export const SHOTS = [
  { id: 'hook', a: 0, b: 214, light: 'day' },
  { id: 'herd', a: 214, b: 303, light: 'day' },
  { id: 'army', a: 303, b: 452, light: 'day' },
  { id: 'easy', a: 452, b: 490, light: 'day' },
  { id: 'split', a: 490, b: 635, light: 'day' },
  { id: 'mount', a: 635, b: 713, light: 'day' },
  { id: 'outrun', a: 713, b: 770, light: 'day' },
  { id: 'camp', a: 770, b: 940, light: 'golden' },
  { id: 'cmdr', a: 940, b: 1010, light: 'golden' },
  { id: 'tank', a: 1010, b: 1058, light: 'golden' },
  { id: 'home', a: 1058, b: 1157, light: 'dusk' },
  { id: 'emus', a: 1157, b: 1235, light: 'golden' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1];
export const FLASH = [[208, 6], [766, 6]];
export const flashAt = (f) => { let v = 0; for (const [a, d] of FLASH) { const t = (f - a) / d; if (t >= 0 && t <= 1) v = Math.max(v, Math.sin(t * Math.PI)); } return v; };
export const KICKS = [[203, 0.6], [340, 0.5], [519, 0.8], [654, 0.8], [1025, 1.2], [1213, 0.4]];
const kickAt = (f) => { let k = 0; for (const [a, s] of KICKS) { const d = f - a; if (d >= 0 && d < 7) k += s * (d % 2 ? -1 : 1) * (1 - d / 7); } return k; };

// ---------- trucks ----------
// truck faces +x when yaw = 0; bed floor at y 1.05, bed spans local x -2.6..0.2
export const truckAt = (f) => {
  const s = shotAt(f).id;
  if (s === 'army') {
    const t = clamp((f - 303) / 37), x = lerp(-26, 0, easeOut(t)) + (t >= 1 ? 0.12 * Math.sin((f - 340) * 0.9) * Math.exp(-(f - 340) * 0.25) : 0);
    const pitch = f > 336 ? 0.05 * Math.sin((f - 336) * 0.8) * Math.exp(-(f - 336) * 0.2) : 0;
    return { on: 1, x, z: 0.6, yaw: 0, bounce: f < 340 ? 0.03 * Math.abs(Math.sin(f * 1.3)) : 0, pitch, roll: 0, gun: 0, wheel: x / 0.45 };
  }
  if (s === 'mount' || s === 'outrun') {
    const tt = Math.max(0, (f - 690) / 30), x = 40 + (tt < 2 ? 2 * tt * tt : 8 + 8 * (tt - 2));
    const moving = f > 690;
    const b = moving ? 0.07 * Math.abs(Math.sin(f * 0.9)) + 0.04 * Math.abs(Math.sin(f * 2.3)) : 0;
    return { on: 1, x, z: 0.6, yaw: 0, bounce: b, pitch: moving ? 0.03 * Math.sin(f * 1.1) : 0, roll: moving ? 0.035 * Math.sin(f * 0.7) : 0,
      gun: s === 'mount' ? clamp((f - 643) / 11) : 1, gunDrop: s === 'mount' ? f : 9999, wheel: x / 0.45 };
  }
  if (s === 'home') {
    const t = Math.max(0, (f - 1064) / 30), x = -2 - (t < 2.4 ? 1.25 * t * t : 7.2 + 6 * (t - 2.4));
    return { on: 1, x, z: 0.6, yaw: Math.PI, bounce: 0.03 * Math.abs(Math.sin(f * 0.8)), pitch: 0, roll: 0.02 * Math.sin(f * 0.5), gun: 0, wheel: -x / 0.45 };
  }
  if (s === 'camp' || s === 'cmdr') return { on: 1, x: 22, z: 15, yaw: -0.4, bounce: 0, pitch: 0, roll: 0, gun: 0, wheel: 0 };
  return { on: 0 };
};
/** local truck point -> world (handles yaw 0/π/any) */
export const truckPt = (T, lx, ly, lz) => {
  const c = Math.cos(T.yaw), s = Math.sin(T.yaw);
  return [T.x + lx * c + lz * s, ly + T.bounce, T.z - lx * s + lz * c];
};

// ---------- world state ----------
export const worldAt = (f) => {
  const s = shotAt(f).id;
  return {
    shot: s,
    droop: s === 'hook' ? back(clamp((f - 200) / 6), 2.2) : 0,
    casings: s === 'camp' ? clamp((f - 800) / 62) : s === 'cmdr' ? 1 : 0,
    rain: s === 'camp' && f > 796 && f < 866 ? 1 : 0,
    board: s === 'camp' ? clamp((f - 893) / 5) : 1,
    nest: s === 'hook' || s === 'split',
    truck: truckAt(f),
  };
};

// ---------- cameras ----------
const C = (pos, look, fov = 40, roll = 0) => ({ pos, look, fov, roll });
const glide = (a, b, t) => C(L3(a.pos, b.pos, t), L3(a.look, b.look, t), lerp(a.fov, b.fov, t), lerp(a.roll, b.roll, t));
/** push-in creep along the view ray, fraction k */
const creep = (c, k) => { const d = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]]; return { ...c, pos: [c.pos[0] + d[0] * k, c.pos[1] + d[1] * k, c.pos[2] + d[2] * k] }; };
const H = (x, y, z) => [HOOK[0] + x, y, HOOK[2] + z];

export const camAt = (f) => {
  const s = shotAt(f), t = (f - s.a) / (s.b - s.a);
  let c;
  switch (s.id) {
    case 'hook': {
      const a = C(H(0.35, 1.55, 5.8), H(0.45, 1.3, 0), 34, -1.5), b = C(H(0.7, 1.55, 5.3), H(0.6, 1.32, 0.1), 34, 1.5);
      c = glide(a, b, sstep(f / 214));
      c = creep(c, 0.0009 * f);
      break;
    }
    case 'herd': {
      const a = C([HERD3[0] + 4, 1.0, HERD3[2] + 9], [HERD3[0], 1.1, HERD3[2]], 44, 2), b = C([HERD3[0] + 14, 9, HERD3[2] + 26], [HERD3[0] - 10, 0, HERD3[2] - 6], 46, -1);
      c = glide(a, b, sstep((f - 214) / 80));
      break;
    }
    case 'army': {
      const a = C([4.0, 2.7, 13.0], [-0.6, 1.9, 0.6], 42, 0), b = C([3.4, 2.7, 12.0], [-0.8, 1.9, 0.6], 42, 1);
      c = glide(a, b, sstep((f - 303) / 90));
      const p = C([-0.2, 2.75, 4.9], [-1.25, 2.45, 0.6], 40, -2.5);
      c = glide(c, p, sstep((f - 393) / 30));
      c = creep(c, 0.0012 * (f - 303));
      break;
    }
    case 'easy': {
      c = C([6.35, 1.5, -9.4], [6.05, 1.62, -12], 34, 0);
      c = creep(c, 0.004 * (f - 452));
      break;
    }
    case 'split': {
      const a = C([21, 11, -17], [9, 0, -38], 46, 0), b = C([24, 10, -22], [9, 0, -40], 46, 3);
      c = glide(a, b, sstep((f - 490) / 145));
      break;
    }
    case 'mount': {
      c = C([49, 1.6, 8.8], [39.6, 1.8, 0.3], 44, -1);
      c = creep(c, 0.0015 * (f - 635));
      if (f > 690) { const T = truckAt(f); c = { ...c, look: [T.x + 0.2, 1.9, 0.3] }; }
      break;
    }
    case 'outrun': {
      const T = truckAt(f);
      c = C([T.x + 1.2, 2.6, 11.0], [T.x + 1.5, 1.5, -1.2], 48, 2);
      break;
    }
    case 'camp': {
      const a = C([11.3, 1.6, 17.0], [11.2, 0.6, 12.2], 40, 0), b = C([13.6, 1.75, 15.9], [13.95, 1.3, 11.2], 40, -1);
      c = glide(a, b, sstep((f - 862) / 30));
      c = creep(c, 0.0008 * (f - 770));
      break;
    }
    case 'cmdr': {
      c = C([17.1, 1.6, 12.4], [16.0, 1.55, 9.0], 36, 0);
      c = creep(c, 0.002 * (f - 940));
      break;
    }
    case 'tank': {
      c = C([-3.35, 0.5, -5.7], [-4.0, 1.3, -8.6], 44, -3);
      c = creep(c, 0.0025 * (f - 1010) + (f > 1024 ? 0.03 * easeOut((f - 1024) / 8) : 0));
      break;
    }
    case 'home': {
      c = C([5.8, 1.6, -3.4], [-20, 1.4, 0.6], 46, 0);
      c = creep(c, 0.0006 * (f - 1058));
      break;
    }
    case 'emus': {
      const a = C([-9.6, 1.5, -11.4], [-10.05, 1.5, -14], 36, 0), b = C([-4, 7.5, -2.5], [-12, 0.4, -17], 44, 0);
      c = glide(a, b, sstep((f - 1190) / 45));
      if (f < 1190) c = creep(c, 0.002 * (f - 1157));
      break;
    }
  }
  const k = kickAt(f);
  if (k) c = { ...c, roll: c.roll + 1.2 * k, look: [c.look[0], c.look[1] + 0.02 * k, c.look[2]] };
  return c;
};

// ---------- depth of field: [cInf px at 1080, focus distance from camera] ----------
export const dofAt = (f) => {
  const s = shotAt(f).id, cam = camAt(f);
  const dist = (p) => Math.hypot(p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]);
  switch (s) {
    case 'hook': return [10, dist(H(0.2, 1.6, 0))];
    case 'army': return [lerp(0, 9, sstep((f - 393) / 30)), dist([-1.2, 2.6, 0.6])];
    case 'easy': return [14, dist([6.05, 1.62, -12])];
    case 'camp': return [7, dist(cam.look)];
    case 'cmdr': return [12, dist([16, 1.6, 9])];
    case 'tank': return [8, dist([-4, 1.4, -8.6])];
    case 'home': return [5, 18];
    case 'emus': return [f < 1190 ? 13 : lerp(13, 0, sstep((f - 1190) / 25)), dist([-10, 1.5, -14])];
    default: return [0, 10];
  }
};

// ---------- actors ----------
// person: {id, kind:'person', who, pos, opts}; emu: {id, kind:'emu', pos, vel, opts}; herd emu: {kind:'herd', pos, vel, tex}
const P = (id, who, pos, opts = {}, extra = {}) => ({ id, kind: 'person', who, pos, opts, ...extra });
const E = (id, pos, opts = {}, extra = {}) => ({ id, kind: 'emu', pos, opts, ...extra });
const FX = (id, fx, pos, t, size, extra = {}) => ({ id, kind: 'fx', fx, pos, t, size, ...extra });

const herdFlock = (center, n, seed, f, mode = 'graze', rad = 9) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = R(seed + i) * 6.283, r = Math.sqrt(R(seed + i * 3.3)) * rad;
    const x = center[0] + Math.cos(a) * r, z = center[2] + Math.sin(a) * r * 0.8;
    const walk = R(seed + i * 5.1) < 0.4;
    const dir = R(seed + i * 7.7) < 0.5 ? 1 : -1;
    const px = x + (walk ? dir * 0.9 * (f / 30) : 0);
    const pk = !walk && R(seed + i * 2.2) < 0.6 ? ((f + Math.floor(R(seed + i) * 40)) % 50 < 18 ? 'peck' : 'stand') : 'stand';
    const tex = walk ? `walk${Math.floor((f / 4 + i * 3) % 8)}` : pk;
    out.push({ kind: 'herd', pos: [px, 0, z], vel: [walk ? dir : (R(seed + i * 9) < 0.5 ? 1 : -1) * 0.01, 0, 0], tex });
  }
  return out;
};

export const actorsAt = (f) => {
  const s = shotAt(f).id, A = [];
  const bl = (seed) => blinkAt(f, seed);
  switch (s) {
    case 'hook': {
      const expr = f < 150 ? 'stern' : f < 196 ? 'nervous' : f < 203 ? 'shock' : 'dazed';
      A.push(P('gunner', 'digger0', H(0, 0, 0), { mode: 'stand', expr, seed: 3, blink: bl(3), look: f > 150 && f < 200 ? 1 : 0, headTilt: 2 * idle(f, 1) }));
      // the emu rises out of the wheat beside the muzzle at "birds"
      const up = spring((f - 140) / 30 * 2.2, 6, 4.5), pk = f < 193 ? 0.05 + 0.03 * idle(f, 4) : f < 200 ? lerp(0.05, 0.36, back((f - 193) / 7)) : lerp(0.36, 0.1, sstep((f - 200) / 6));
      A.push(E('hookemu', H(1.6, -1.9 * (1 - up), -0.3), { mode: 'stand', expr: f < 205 ? 'smug' : 'happy', turn: f > 150 && f < 190 ? 1 : 0, peck: pk, blink: bl(8), seed: 2 }, { flip: true }));
      // herd far behind
      for (const e of herdFlock([HOOK[0] - 8, 0, HOOK[2] - 26], 14, 31, f, 'graze', 10)) A.push(e);
      break;
    }
    case 'herd': {
      for (const e of herdFlock(HERD3, 70, 7, f, 'graze', 14)) A.push(e);
      for (const e of herdFlock([HERD3[0] - 18, 0, HERD3[2] - 4], 30, 91, f, 'graze', 10)) A.push(e);
      // hero emus close to the opening lens
      A.push(E('h3a', [HERD3[0] + 1.2, 0, HERD3[2] + 3.4], { mode: 'peck', peck: f % 40 < 16 ? 0.9 : 0.1, expr: 'blank', seed: 4 }));
      A.push(E('h3b', [HERD3[0] + 3.4, 0, HERD3[2] + 1.0], { mode: 'stand', expr: 'blank', blink: bl(5), seed: 5 }, { flip: true }));
      // the farmer shakes a fist on his veranda
      A.push(P('farmer', 'farmer', [HOUSE[0] + 4, 0.5, HOUSE[2] + 4.4], { mode: 'stand', expr: 'stern', fist: 0.5 + 0.5 * Math.sin(f * 0.6), seed: 11 }, { scale: 1.6 }));
      break;
    }
    case 'army': {
      const T = truckAt(f);
      const pops = [343, 349, 355];
      ['digger0', 'digger1', 'digger2'].forEach((who, i) => {
        const up = spring((f - pops[i]) / 30 * 2.4, 7, 4.2);
        const lx = [-0.55, -1.35, -2.15][i];
        const gun = i > 0 && f > [0, 401, 408][i] ? 'chest' : null;
        const expr = gun ? 'grin' : f > pops[i] ? 'stern' : 'neutral';
        const p = truckPt(T, lx, 1.05 - 1.4 * (1 - up), 0.15 - 0.15 * i);
        A.push(P('sold' + i, who, p, { mode: 'stand', expr, gun, seed: 3 + 2 * i, blink: bl(3 + i), wave: i === 0 && f > 380 ? 0.6 + 0.4 * Math.sin(f * 0.2) : undefined, headTilt: 3 * idle(f, i) }));
        if (gun) A.push(FX('ting' + i, 'burst', [p[0] + 0.05, p[1] + 1.25, p[2] + 0.4], clamp((f - [0, 401, 408][i]) / 9), 0.7));
      });
      if (f > 338 && f < 360) A.push(FX('dust4', 'puff', [T.x + 2.0, 0, T.z + 1.3], (f - 338) / 22, 2.2));
      break;
    }
    case 'easy': {
      const turn = f < 462 ? 0 : 1;
      A.push(E('easy', [6.15, 0, -12.1], { mode: 'stand', expr: f > 470 ? 'smug' : 'blank', turn, blink: f > 476 && f < 481 ? 1 : 0, seed: 6 }, { flip: true }));
      break;
    }
    case 'split': {
      const fs = 519, run = Math.max(0, f - fs);
      for (let g = 0; g < 10; g++) {
        const ang = (g / 10) * 6.283 + 0.3 * R(g), n = 5 + Math.floor(R(g + 4) * 5);
        const dist = run <= 0 ? 0 : 9 * (run / 30) - 4.5 * (1 - Math.exp(-run / 15)) * 0;
        const acc = clamp(run / 10);
        for (let i = 0; i < n; i++) {
          const o = [Math.cos(ang) * (2 + R(g * 9 + i) * 3) + (R(g * 7 + i) - 0.5) * 2.5, 0, Math.sin(ang) * (2 + R(g * 5 + i) * 3) + (R(g * 3 + i) - 0.5) * 2.5];
          const d = dist * (0.9 + 0.2 * R(i + g * 11)) * acc;
          const pos = [9 + o[0] + Math.cos(ang) * d, 0, -40 + o[2] + Math.sin(ang) * d];
          const tex = run > 2 ? `run${Math.floor((f / 2 + i * 2 + g) % 8)}` : (f + i * 7) % 40 < 15 ? 'peck' : 'stand';
          A.push({ kind: 'herd', pos, vel: [Math.cos(ang), 0, Math.sin(ang)], tex });
        }
      }
      // the gun nest at the fence
      ['digger0', 'digger1', 'digger2'].forEach((who, i) => A.push(P('nest' + i, who, [13 + i * 1.1, 0, -9 + i * 0.3], { mode: 'stand', expr: f < fs + 6 ? 'stern' : 'shock', seed: 3 + 2 * i, look: Math.sin(f * 0.15 + i), blink: bl(i) }, { scale: 1.2 })));
      for (let k = 0; k < 3; k++) { const a = fs + 14 + k * 26; if (f >= a && f < a + 14) A.push(FX('pf' + k, 'puff', [9 + 10 * Math.cos(k * 2.1), 0, -40 + 8 * Math.sin(k * 2.1)], (f - a) / 14, 3.5)); }
      break;
    }
    case 'mount':
    case 'outrun': {
      const T = truckAt(f);
      const g = truckPt(T, -1.75, 1.05, 0);
      A.push(P('gunner2', 'digger1', g, { mode: 'stand', expr: s === 'mount' ? (f > 656 ? 'grin' : 'stern') : f > 735 ? 'shock' : 'nervous', seed: 5, blink: bl(5), headTilt: s === 'outrun' ? 6 * Math.sin(f * 0.9) : 0 }));
      A.push(P('driver', 'digger2', truckPt(T, 0.75, 0.55, 0.45), { mode: 'stand', expr: f > 735 ? 'shock' : 'stern', seed: 7, blink: bl(7) }, { scale: 0.92 }));
      if (s === 'outrun') {
        for (let i = 0; i < 7; i++) {
          const x0 = T.x - 3.26 + (2 - i) * 2.6 + (f - 713) * 0.18 * (0.95 + 0.1 * R(i)), z = 2.6 + R(i * 3) * 1.4;
          if (i === 2) A.push(E('runhero', [x0, 0, z], { mode: 'run', phase: ((f - 713) / 9 + 0.3) % 1, expr: f > 738 ? 'smug' : 'blank', turn: f > 740 && f < 762 ? 1 : 0, seed: 9 }, {}));
          else A.push({ kind: 'herd', pos: [x0, 0, z], vel: [1, 0, 0], tex: `run${Math.floor(((f - 713) / 1.2 + i * 3) % 8)}` });
        }
      } else {
        for (const e of herdFlock([28, 0, -14], 18, 55, f, 'graze', 8)) A.push(e);
      }
      break;
    }
    case 'camp': {
      A.push(P('sad', 'digger0', [11.6, 0, 12.6], { mode: 'sit', expr: f > 897 ? 'pained' : 'nervous', seed: 3, blink: bl(3), headTilt: 4 * idle(f, 2) }));
      A.push(P('chalk', 'digger2', [14.6, 0, 11.2], { mode: 'stand', expr: f > 897 ? 'nervous' : 'stern', seed: 7, blink: bl(7), wave: f > 880 && f < 900 ? 0.3 : undefined }));
      for (let i = 0; i < 6; i++) {
        const x = 2 + (f - 770) * 0.03 + i * 2.6, z = 20 + R(i) * 3;
        A.push({ kind: 'herd', pos: [x, 0, z], vel: [1, 0, 0], tex: (f + i * 13) % 60 < 22 ? 'peck' : `walk${Math.floor((f / 4 + i * 3) % 8)}` });
      }
      if (f > 900) A.push(E('casemu', [8.6, 0, 11.4], { mode: 'peck', peck: (f % 30) < 10 ? 0.95 : 0.3, expr: 'happy', seed: 12 }));
      break;
    }
    case 'cmdr': {
      const bino = 1 - sstep((f - 978) / 10);
      A.push(P('cmdr', 'commander', [16, 0, 9], { mode: 'stand', expr: f < 990 ? 'stern' : 'shock', bino, seed: 9, blink: bl(9), headTilt: 2 * idle(f, 6) }));
      break;
    }
    case 'tank': {
      const st = clamp((f - 1018) / 7);
      A.push(E('tank', [-4, 0, -8.6], { mode: st > 0.5 ? 'stomp' : 'stand', puff: easeOut(st), expr: 'stern', turn: 1, blink: bl(10), seed: 10 }, {}));
      if (f >= 1024 && f < 1046) A.push(FX('stomp', 'puff', [-4, 0, -8.3], (f - 1024) / 22, 3.0));
      if (f >= 1038 && f < 1048) A.push(FX('ping', 'burst', [-3.7, 1.0, -8.2], (f - 1038) / 10, 0.6));
      break;
    }
    case 'home': {
      const T = truckAt(f);
      ['digger0', 'digger1', 'digger2'].forEach((who, i) => A.push(P('home' + i, who, truckPt(T, -0.8 - i * 0.75, 1.05, (i - 1) * 0.55), { mode: 'sit', expr: i === 1 ? 'pained' : 'nervous', seed: 3 + 2 * i, blink: bl(i) })));
      A.push(E('wave1', [-0.8, 0, -3.4], { mode: 'stand', expr: 'smug', wing: f > 1110 ? 0.5 + 0.5 * Math.sin(f * 0.5) : 0, blink: bl(13), seed: 13 }, { flip: true }));
      A.push(E('wave2', [-3, 0, -3.6], { mode: 'stand', expr: 'happy', blink: bl(14), seed: 14 }, { flip: true }));
      for (const e of herdFlock([-14, 0, -16], 16, 77, f, 'graze', 8)) A.push(e);
      break;
    }
    case 'emus': {
      const up = spring((f - 1158) / 30 * 2.6, 7, 4.5);
      const look = f < 1170 ? 0 : f < 1180 ? 1 : 0;
      const pk = f < 1206 ? 0 : f < 1213 ? back((f - 1206) / 7) : lerp(1, 0.15, sstep((f - 1216) / 10));
      A.push(E('final', [-10.05, -1.9 * (1 - up), -14], { mode: pk > 0.3 ? 'peck' : 'stand', peck: pk * 0.75, expr: f > 1214 ? 'happy' : f > 1190 ? 'smug' : 'alarm', turn: look, blink: bl(15), seed: 15 }, { flip: f < 1175 || f > 1180 }));
      if (f >= 1213 && f < 1230) A.push(FX('chaff', 'burst', [-9.2, 0.3, -13.8], (f - 1213) / 17, 0.9, { col: '#f0c860' }));
      for (const e of herdFlock([-14, 0, -24], 40, 101, f, 'graze', 12)) A.push(e);
      break;
    }
  }
  return A;
};

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 140, el: 50, sun: [1.0, 0.96, 0.88], sunI: 2.4, sky: '#4f8fd8', hor: '#c4dcf0', hemiSky: '#bcd4f0', hemiGnd: '#a98c5a', hemiI: 1.15, fog: [40, 420], card: [1, 1, 1], sat: 1.08, gain: 1.0 },
  golden: { az: 250, el: 12, sun: [1.0, 0.72, 0.45], sunI: 2.6, sky: '#f0a868', hor: '#ffd59a', hemiSky: '#c9a0b8', hemiGnd: '#8a6a4a', hemiI: 1.0, fog: [30, 380], card: [1.0, 0.9, 0.78], sat: 1.1, gain: 1.0 },
  dusk: { az: 270, el: 6, sun: [1.0, 0.6, 0.38], sunI: 2.3, sky: '#c8789a', hor: '#ffc07a', hemiSky: '#9a84b8', hemiGnd: '#6a5048', hemiI: 0.95, fog: [25, 340], card: [0.98, 0.82, 0.72], sat: 1.1, gain: 0.97 },
};
export const lightFor = (f) => LIGHTS[shotAt(f).light];
/** where the shadow camera centres per shot */
export const focusAt = (f) => {
  const s = shotAt(f).id, T = truckAt(f);
  return { hook: H(0, 0, 0), herd: HERD3, army: [-1, 0, 0.6], easy: [6, 0, -12], split: [11, 0, -30], mount: [T.x || 40, 0, 0], outrun: [T.x || 50, 0, -1],
    camp: CAMP, cmdr: [16, 0, 9], tank: [-4, 0, -8.6], home: [-6, 0, -2], emus: [-10, 0, -14] }[s];
};
