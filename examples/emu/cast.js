// Our own cast for "The Emu War": 1932 diggers, a commander, a farmer and lots of emus.
// Drawn with the Pen API from toonbase.js on the 600x1000 design canvas (soles at y = 975).
import { Pen, INK, SKINS, bodyFront, headGeom, mul, mix, shade, blobPts, curve, rnd, rad, ellPts, fxPuff, fxBurst, fxStars } from './toonbase.js';

export { fxPuff, fxBurst, fxStars };
const KHAKI = '#a88f5a', KHAKI_DK = '#8a7448';
export const DIGGER = (v = 0, extra = {}) => ({
  jacket: ['#9c8a55', '#a39058', '#94844f'][v % 3], pants: '#6f6040', boots: '#4a3426', hat: 'slouch', cap: ['#a8915e', '#9e8a5a', '#b09a66'][v % 3],
  belt: '#6b5636', buttons: '#c8b070', skin: SKINS[v % 4], moustache: v % 3 === 1 ? '#4a3426' : undefined, ...extra,
});
export const COMMANDER = { jacket: '#8f7f50', pants: '#6a5c3c', boots: '#3a2a1e', hat: 'cap', cap: '#7d6d44', belt: '#5a4630', buttons: '#e8c45a',
  sash: null, moustache: '#5a3a24', build: 'stout', skin: SKINS[0] };
export const FARMER = { jacket: '#3f6fb5', pants: '#5a4a3a', boots: '#4a3426', hat: 'slouch', cap: '#c9b48a', skin: SKINS[2], moustache: '#7a6a5a' };

const two = Math.PI * 2;
// ---------------- people ----------------
/** opts: bodyFront opts + {gun:'chest'|'up'|null, bino:0..1} */
export const drawPerson = (p, o, opts = {}) => {
  const seed = opts.seed ?? 1, G = headGeom(seed, o.build ?? 'adult', opts.mode === 'sit' ? 'sit' : 'stand');
  const u = G.u, tcx = 300, sy = G.chin + 0.12 * G.HH, tw = (G.tw / 2) * 2 * G.a / 1.06;
  const o2 = { ...o };
  const extra = {};
  if (opts.gun === 'up') { extra.waveL = 1; extra.wave = 1; }
  if (opts.gun === 'chest') {
    extra.armsL = [[tcx - 0.85 * tw, sy], [tcx - 1.0 * tw, sy + 0.4 * G.HH], [tcx - 0.2 * tw, sy + 0.55 * G.HH]];
    extra.armsR = [[tcx + 0.85 * tw, sy], [tcx + 1.05 * tw, sy + 0.42 * G.HH], [tcx + 0.55 * tw, sy + 0.62 * G.HH]];
  }
  if (opts.bino > 0) {
    const k = opts.bino, hy = G.hc + 6 * u;
    const lerp = (a, b) => a + (b - a) * k;
    extra.armsL = [[tcx - 0.85 * tw, sy], [tcx - 1.15 * tw, lerp(sy + 0.45 * G.HH, sy + 0.05 * G.HH)], [lerp(tcx - 0.6 * tw, 300 - 26 * u), lerp(sy + 0.6 * G.HH, hy + 10 * u)]];
    extra.armsR = [[tcx + 0.85 * tw, sy], [tcx + 1.15 * tw, lerp(sy + 0.45 * G.HH, sy + 0.05 * G.HH)], [lerp(tcx + 0.6 * tw, 300 + 26 * u), lerp(sy + 0.6 * G.HH, hy + 10 * u)]];
  }
  if (opts.fist !== undefined) extra.wave = opts.fist;
  bodyFront(p, o2, { ...opts, ...extra });
  // held props drawn on top
  if (opts.gun === 'chest') lewis2D(p, 300, sy + 0.55 * G.HH, 1.0 * u, -8);
  if (opts.bino > 0) {
    const k = opts.bino, hy = G.hc + 6 * u, y = hy + (1 - k) * 0.9 * G.HH;
    for (const s of [-1, 1]) {
      p.poly([[300 + s * 26 * u - 15 * u, y - 14 * u], [300 + s * 26 * u + 15 * u, y - 14 * u], [300 + s * 26 * u + 13 * u, y + 22 * u], [300 + s * 26 * u - 13 * u, y + 22 * u]], '#2d2b30', 3 * u);
      p.ell(300 + s * 26 * u, y + 22 * u, 13 * u, 6 * u, '#5d7f9a', 2.5 * u);
    }
    p.poly([[300 - 12 * u, y - 4 * u], [300 + 12 * u, y - 4 * u], [300 + 12 * u, y + 6 * u], [300 - 12 * u, y + 6 * u]], '#2d2b30', 2 * u);
  }
};

/** flat Lewis gun seen from the side (fat shroud, pan magazine, stock) centred at x,y */
export const lewis2D = (p, x, y, s, rot = 0) => {
  const prev = p.rot; p.rot = [rad(rot), x, y];
  const u = s;
  p.poly([[x - 95 * u, y - 4 * u], [x - 40 * u, y - 10 * u], [x - 40 * u, y + 12 * u], [x - 92 * u, y + 22 * u]], '#7a4b2a', 3 * u); // stock
  p.poly([[x - 40 * u, y - 13 * u], [x + 70 * u, y - 13 * u], [x + 70 * u, y + 13 * u], [x - 40 * u, y + 13 * u]], '#3d4a3a', 3 * u); // shroud
  for (let i = 0; i < 6; i++) p.stroke([[x - 30 * u + i * 17 * u, y - 13 * u], [x - 30 * u + i * 17 * u, y + 13 * u]], 2 * u, '#2a3328');
  p.poly([[x + 70 * u, y - 5 * u], [x + 115 * u, y - 5 * u], [x + 115 * u, y + 4 * u], [x + 70 * u, y + 4 * u]], '#3a3c40', 2.5 * u); // muzzle
  p.ell(x - 10 * u, y - 22 * u, 34 * u, 8 * u, '#4a4c50', 3 * u); // pan magazine
  p.rot = prev;
};

// ---------------- emus ----------------
const EMU_BODY = '#6e5b48', EMU_DARK = '#4a3b2e', EMU_NECK = '#8a98a6', EMU_LEG = '#7d6f60', BEAK = '#3b3532', EYE = '#e08a2a';
/**
 * Emu in profile facing screen-right.
 * o: { phase (run cycle 0..1), mode:'run'|'stand'|'peck'|'stomp', peck 0..1 (neck down), turn 0..1 (head looks at viewer),
 *      expr:'blank'|'smug'|'alarm'|'stern'|'happy', blink 0..1, puff 0..1 (chest out), wing 0..1 (little wing wave), seed }
 */
export const drawEmu = (p, o = {}) => {
  const { phase = 0, mode = 'stand', peck = 0, turn = 0, expr = 'blank', blink = 0, puff = 0, wing = 0, seed = 1, lean = 0 } = o;
  const sole = 975, u = 2.2;
  const run = mode === 'run';
  const bob = run ? 14 * Math.cos(2 * two * phase) : 0;
  const hip = [300 - 10, 610 + bob];
  // ---- legs ----
  const legL = 175, l1 = legL, l2 = 190; // thigh (hidden) is in the body; tibia + tarsus visible
  const legs = [];
  for (const [ph, near] of [[0, true], [0.5, false]]) {
    let ank;
    if (run) {
      const t = (phase + ph) % 1, S = 150;
      if (t < 0.5) ank = [hip[0] + S * (0.5 - 2 * t) * 1.0, sole - 6]; // stance: slides back
      else { const q = (t - 0.5) * 2; ank = [hip[0] + S * (-0.5 + q), sole - 6 - 120 * Math.sin(Math.PI * q)]; }
    } else {
      const spread = mode === 'stomp' ? 70 : 30;
      ank = [hip[0] + (near ? spread : -spread), sole - 6];
    }
    legs.push({ ank, near });
  }
  const drawLeg = ({ ank, near }) => {
    const col = near ? EMU_LEG : shade(EMU_LEG, 0.72);
    const dx = ank[0] - hip[0], dy = ank[1] - hip[1], d = Math.min(Math.hypot(dx, dy), l1 + l2 - 1);
    const A = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)))), base = Math.atan2(dy, dx);
    const k = base + A; // emu "knee" (ankle joint) bends backward
    const knee = [hip[0] + l1 * Math.cos(k), hip[1] + l1 * Math.sin(k)];
    p.stroke([hip, knee, ank], 24, INK); p.stroke([hip, knee, ank], 15, col);
    p.dot(knee[0], knee[1], 13, INK); p.dot(knee[0], knee[1], 8.5, col);
    // three toes
    for (const [tx, ty] of [[34, 4], [24, 2], [-14, 2]]) { p.stroke([ank, [ank[0] + tx*1.3, ank[1] + ty]], 17, INK); p.stroke([ank, [ank[0] + tx*1.3, ank[1] + ty]], 10, col); }
  };
  legs.filter((l) => !l.near).forEach(drawLeg);
  // ---- body: shaggy oval with a feathered hem ----
  const bcx = 300 - 10, bcy = 520 + bob, ba = 150 + 10 * puff, bb = 112 + 12 * puff;
  const tilt = rad(-8 + lean + (run ? -6 : 0));
  const pts = [];
  for (let i = 0; i < 90; i++) {
    const t = (i / 90) * two, c = Math.cos(t), s = Math.sin(t);
    let r = 1;
    if (s > 0.1) r += 0.07 * Math.abs(Math.sin(t * 9 + seed)) + 0.03 * Math.sin(t * 23 + seed * 3); // shaggy lower hem
    else r += 0.012 * Math.sin(t * 11 + seed);
    const x = ba * c * r * (c < 0 ? 1.08 : 1), y = bb * s * r * (s < 0 ? 0.95 : 1.05);
    pts.push([bcx + x * Math.cos(tilt) - y * Math.sin(tilt), bcy + x * Math.sin(tilt) + y * Math.cos(tilt)]);
  }
  p.shadedFill(pts, EMU_BODY, EMU_DARK, rad(-120), ba, 0.4);
  p.clip(pts, () => {
    for (let i = 0; i < 26; i++) {
      const x = bcx - ba + rnd(seed, i) * 2 * ba, y = bcy - bb + rnd(seed, i + 40) * 2 * bb;
      p.arc(x, y, 18, 12, 20, 160, 3, mix(EMU_DARK, EMU_BODY, 0.3));
    }
  });
  p.inkRing(pts, 10, rad(70));
  // little wing
  if (wing > 0) {
    const wa = rad(-20 - 70 * wing), wx = bcx + 40, wy = bcy - 20;
    const wp = []; for (let i = 0; i <= 6; i++) { const a2 = wa - 0.5 + i / 6, r2 = i % 2 ? 62 : 80; wp.push([wx + Math.cos(a2) * r2, wy + Math.sin(a2) * r2]); }
    p.poly([[wx, wy + 10], ...wp, [wx + 10, wy + 20]], shade(EMU_BODY, 0.82), 5);
  }
  // ---- neck + head ----
  const nb = [bcx + ba * 0.72, bcy - bb * 0.35]; // neck base
  const pk = Math.max(0, Math.min(1, peck));
  const headUp = [nb[0] + 55, nb[1] - 255 + 50 * puff], headDown = [nb[0] + 170, sole - 70];
  const hx = headUp[0] + (headDown[0] - headUp[0]) * pk, hy = headUp[1] + (headDown[1] - headUp[1]) * pk + (run ? bob * 0.6 : 0);
  const mid = [nb[0] + 40 + 80 * pk, (nb[1] + hy) / 2 - 10 + 60 * pk];
  const neck = curve(nb, mid, [hx - 6, hy + 20], 14);
  p.stroke(neck, 64, INK); p.stroke(neck, 50, EMU_NECK);
  // feathery neck ruff near the base
  p.clip(pts, () => {});
  for (let i = 0; i < 5; i++) { const q = neck[2 + i]; p.arc(q[0] - 12, q[1], 14, 10, 30, 150, 3, '#6d7a86'); }
  // head
  const hr = 60, eyeOpen = blink >= 0.9 ? 0 : 1;
  const ex = expr;
  if (turn < 0.5) {
    // profile head
    const hp = ellPts(hx, hy, hr * 1.05, hr * 0.9, 0, 360, -10, 40);
    p.poly(hp, EMU_NECK, 7);
    // tuft
    p.stroke([[hx - 14, hy - hr * 0.8], [hx - 24, hy - hr * 1.25]], 4); p.stroke([[hx - 4, hy - hr * 0.85], [hx - 6, hy - hr * 1.3]], 4);
    // beak
    const bopen = ex === 'alarm' ? 12 : 0;
    p.poly([[hx + hr * 0.75, hy - 6], [hx + hr * 1.75, hy + 4], [hx + hr * 0.8, hy + 10]], BEAK, 5);
    if (bopen) p.poly([[hx + hr * 0.8, hy + 12], [hx + hr * 1.6, hy + 14 + bopen], [hx + hr * 0.7, hy + 20]], BEAK, 5);
    // eye
    const er = ex === 'alarm' ? 24 : 19;
    p.ell(hx + 10, hy - 8, er, er, EYE, 5);
    if (eyeOpen) p.dot(hx + 14, hy - 8, ex === 'alarm' ? 7 : 9.5, INK);
    if (ex === 'smug' || ex === 'stern' || blink > 0) { // heavy lid
      const lidY = blink >= 0.9 ? er : ex === 'smug' ? 2 : ex === 'stern' ? -2 : er * blink;
      p.clip(ellPts(hx + 10, hy - 8, er, er), () => p.poly([[hx - 20, hy - 40], [hx + 40, hy - 40], [hx + 40, hy - 8 + lidY - (ex === 'stern' ? 6 : 0)], [hx - 20, hy - 8 + lidY + (ex === 'stern' ? 8 : 0)]], EMU_NECK, 0));
      p.stroke([[hx - 6, hy - 8 + lidY + (ex === 'stern' ? 6 : 0)], [hx + 26, hy - 8 + lidY - (ex === 'stern' ? 6 : 0)]], 4);
    }
    if (ex === 'happy') { p.ell(hx + 10, hy - 8, er, er, EMU_NECK, 0); p.arc(hx + 10, hy - 4, 11, 8, 200, 340, 5); }
  } else {
    // head turned to the viewer: round face, two eyes, beak pointing at us
    const hp = ellPts(hx, hy, hr * 0.95, hr, 0, 360, 0, 40);
    p.poly(hp, EMU_NECK, 7);
    p.stroke([[hx - 6, hy - hr * 0.9], [hx - 14, hy - hr * 1.35]], 4); p.stroke([[hx + 6, hy - hr * 0.9], [hx + 12, hy - hr * 1.35]], 4);
    for (const s of [-1, 1]) {
      const exx = hx + s * 27, eyy = hy - 10, er = ex === 'alarm' ? 19 : 16;
      p.ell(exx, eyy, er, er, EYE, 3.5);
      if (eyeOpen) p.dot(exx + s * 1, eyy + 1, 8, INK);
      if (ex === 'smug' || ex === 'stern' || (blink > 0 && blink < 0.9)) {
        const lidY = ex === 'smug' ? 1 : ex === 'stern' ? -1 : er * (1 - 2 * blink);
        p.clip(ellPts(exx, eyy, er, er), () => p.poly([[exx - 20, eyy - 30], [exx + 20, eyy - 30], [exx + 20, eyy + lidY - s * (ex === 'stern' ? -5 : 0)], [exx - 20, eyy + lidY + s * (ex === 'stern' ? -5 : 0)]], EMU_NECK, 0));
        p.stroke([[exx - 13, eyy + lidY + s * (ex === 'stern' ? -5 : 0)], [exx + 13, eyy + lidY - s * (ex === 'stern' ? -5 : 0)]], 3.5);
      }
      if (blink >= 0.9) { p.ell(exx, eyy, er, er, EMU_NECK, 0); p.stroke([[exx - 11, eyy], [exx + 11, eyy]], 4); }
    }
    // beak toward the viewer: short wedge below the eyes
    p.poly([[hx - 20, hy + 12], [hx + 20, hy + 12], [hx + 4, hy + 58], [hx - 4, hy + 58]], BEAK, 5);
    if (ex === 'alarm') p.ell(hx, hy + 30, 8, 6, '#5a1e28', 2);
  }
  legs.filter((l) => l.near).forEach(drawLeg);
};

/** wheat tuft texture: stalks with ears */
export const drawWheatTuft = (g, w, h, seed) => {
  for (let i = 0; i < 22; i++) {
    const x0 = w * (0.15 + 0.7 * rnd(seed, i)), lean = (rnd(seed, i + 50) - 0.5) * 0.35 * w, top = h * (0.08 + 0.22 * rnd(seed, i + 9));
    const col = ['#d9a83c', '#e6b84a', '#c99632', '#efc65a'][i % 4];
    g.strokeStyle = '#8a6a22'; g.lineWidth = w * 0.022;
    g.beginPath(); g.moveTo(x0, h); g.quadraticCurveTo(x0 + lean * 0.3, h * 0.6, x0 + lean, top + h * 0.1); g.stroke();
    g.strokeStyle = col; g.lineWidth = w * 0.012; g.stroke();
    // ear
    g.save(); g.translate(x0 + lean, top + h * 0.06); g.rotate(lean / w * 1.2);
    g.fillStyle = '#6b4e18'; g.beginPath(); g.ellipse(0, 0, w * 0.032, h * 0.085, 0, 0, two); g.fill();
    g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, w * 0.022, h * 0.075, 0, 0, two); g.fill();
    g.restore();
  }
};

export const newPen = (g) => new Pen(g);
