// Cast for "Hoover the Talking Seal" (Maine 1971 / Boston). Pen API from toonbase.js, 600x1000 design canvas (soles at y = 975).
import { Pen, INK, SKINS, bodyFront, headGeom, fxPuff, fxBurst, fxStars, fxSplash } from './toonbase.js';
export { fxPuff, fxBurst, fxStars, fxSplash };

export const OUTFITS = {
  may: { jacket: '#c8404a', pants: '#3a3a44', boots: '#3a2a1e', hat: 'hair', hair: '#8a5a2a', dress: '#c8404a', skin: SKINS[0], build: 'kid' },
  dad: { jacket: '#5a4a3a', pants: '#3a3a44', boots: '#2a2228', hat: 'bowler', cap: '#3a3030', buttons: '#e8c45a', skin: SKINS[1], moustache: '#5a3a24', build: 'stout' },
  mom: { jacket: '#5a7a9a', pants: '#3a3a44', boots: '#2a2228', hat: 'bonnet', dress: '#5a7a9a', skin: SKINS[0] },
  clerk: { jacket: '#2f4a7a', pants: '#2a3040', boots: '#2a2228', hat: 'cap', cap: '#2f4a7a', buttons: '#e8c45a', skin: SKINS[1], moustache: '#3a2a20' },
  mailman: { jacket: '#3a5a8a', pants: '#2a3040', boots: '#2a2228', hat: 'cap', cap: '#2a3a5a', buttons: '#e8c45a', skin: SKINS[2] },
  grandma: { jacket: '#8a5a9a', pants: '#3a3a44', boots: '#2a2228', hat: 'hair', hair: '#d8d8d8', dress: '#8a5a9a', skin: SKINS[0] },
};

export const drawPerson = (p, o, opts = {}) => {
  const seed = opts.seed ?? 1, G = headGeom(seed, o.build ?? 'adult', 'stand');
  const u = G.u, sy = G.chin + 0.12 * G.HH, tw = (G.tw / 2) * 2 * G.a / 1.06;
  const sR = [300 + 0.85 * tw, sy], sL = [300 - 0.85 * tw, sy];
  const extra = {};
  if (opts.point !== undefined) { const k = opts.point; extra.armsR = [sR, [300 + 1.25 * tw + 30 * u * k, sy + 0.2 * G.HH - 0.25 * G.HH * k], [300 + 1.3 * tw + 70 * u * k, sy + 0.35 * G.HH - 0.6 * G.HH * k]]; }
  if (opts.shrug) { const k = opts.shrug; extra.armsR = [sR, [300 + 1.4 * tw, sy + 0.25 * G.HH], [300 + 1.6 * tw + 10 * u, sy - 0.1 * G.HH * k]]; extra.armsL = [sL, [300 - 1.4 * tw, sy + 0.25 * G.HH], [300 - 1.6 * tw - 10 * u, sy - 0.1 * G.HH * k]]; }
  if (opts.present !== undefined) extra.wave = opts.present;
  // carry: both forearms forward across the belly (something is held in front)
  if (opts.carry) { extra.armsR = [sR, [300 + 1.2 * tw, sy + 0.45 * G.HH], [300 + 0.2 * tw, sy + 0.62 * G.HH]]; extra.armsL = [sL, [300 - 1.2 * tw, sy + 0.45 * G.HH], [300 - 0.2 * tw, sy + 0.62 * G.HH]]; }
  // toss: right arm swings from low to high (k 0..1)
  if (opts.toss !== undefined) { const k = opts.toss; extra.armsR = [sR, [300 + 1.3 * tw, sy + 0.3 * G.HH - 0.35 * G.HH * k], [300 + 1.5 * tw + 30 * u * k, sy + 0.55 * G.HH - 0.95 * G.HH * k]]; }
  // hands on hips
  if (opts.hips) { extra.armsR = [sR, [300 + 1.55 * tw, sy + 0.35 * G.HH], [300 + 0.95 * tw, sy + 0.7 * G.HH]]; extra.armsL = [sL, [300 - 1.55 * tw, sy + 0.35 * G.HH], [300 - 0.95 * tw, sy + 0.7 * G.HH]]; }
  // broom held diagonally in the right hand (stays inside the card)
  if (opts.broom !== undefined) { const k = opts.broom; extra.armsR = [sR, [300 + 1.3 * tw, sy + 0.35 * G.HH], [300 + 1.15 * tw + 12 * u * k, sy + 0.6 * G.HH]]; }
  if (opts.broom !== undefined) { const k = opts.broom, hx = 300 + 1.15 * tw + 12 * u * k, hy = sy + 0.6 * G.HH;
    p.band([[hx - 30 * u, hy - 60 * u], [hx + 20 * u, 930]], '#a8783e', 4 * u, 1.4 * u, 'round');
    p.poly([[hx + 4 * u, 915], [hx + 46 * u, 915], [hx + 56 * u, 972], [hx - 8 * u, 972]], '#e0c060', 5); }
  bodyFront(p, o, { ...opts, ...extra });
  if (opts.stamps) { const cols = ['#2a8a4a', '#d84a3a', '#3a6ab8', '#e8a030', '#8a4ab0', '#2a8a8a', '#c86a2a'];
    const spots = [[-0.45, 0.35], [0.4, 0.32], [-0.05, 0.55], [-0.5, 0.78], [0.38, 0.72], [0.0, 0.95], [-0.3, 1.1]];
    for (let i = 0; i < Math.min(7, opts.stamps); i++) { const [dx, dy] = spots[i], x = 300 + dx * tw * 1.2, y = sy + dy * G.HH, w = 15 * u, h = 18 * u;
      p.poly([[x - w, y - h], [x + w, y - h], [x + w, y + h], [x - w, y + h]], '#fff8e8', 2.5 * u);
      p.poly([[x - w * 0.65, y - h * 0.65], [x + w * 0.65, y - h * 0.65], [x + w * 0.65, y + h * 0.65], [x - w * 0.65, y + h * 0.65]], cols[i], 0); } }
  if (opts.tag) { const x = 300 + 0.15 * tw, y = sy + 0.2 * G.HH; p.stroke([[x - 20 * u, y - 14 * u], [x, y + 6 * u]], 2 * u);
    p.poly([[x - 4 * u, y + 4 * u], [x + 70 * u, y + 4 * u], [x + 70 * u, y + 40 * u], [x - 4 * u, y + 40 * u]], '#f4e2b0', 3 * u);
    p.g.fillStyle = INK; p.g.font = `900 ${14 * u}px Arial`; p.g.textAlign = 'center'; p.g.textBaseline = 'middle'; p.g.fillText('MAIL', x + 33 * u, y + 22 * u); }
  if (opts.coin) { const x = 300 + 1.3 * tw + 40 * u, y = sy + 0.1 * G.HH; p.ell(x, y, 14 * u, 14 * u, '#e8c45a', 3 * u); }
  if (opts.bucket) { const hx = 300 - 1.25 * tw, hy = sy + 0.75 * G.HH; p.poly([[hx - 36, hy], [hx + 36, hy], [hx + 28, hy + 70], [hx - 28, hy + 70]], '#b8c0c8', 6); p.stroke([[hx - 34, hy], [hx, hy - 34], [hx + 34, hy]], 5); }
};

/** harbour seal, side view facing screen-right, 400 x 300. a.o: { mouth 0..1, expr ('happy'|'talk'|'gulp'|'sleepy'), pup, cap, wet } */
export const drawSeal = (p, t, a = {}) => {
  const o = a.o || {}, g = p.g, pup = !!o.pup;
  const body = pup ? '#c8c4bc' : '#8a8c94', dk = pup ? '#a8a49c' : '#6a6c74', belly = pup ? '#e8e4dc' : '#b8b4ac';
  p.poly([[70, 225], [20, 200], [28, 246], [18, 280], [78, 258]], dk, 6);
  g.save();
  p.ell(185, 220, 125, 62, body, 8);
  p.ell(200, 252, 95, 26, belly, 0);
  for (const [x, y, r] of [[140, 200, 7], [170, 190, 5], [210, 205, 6], [120, 228, 5], [240, 195, 5]]) p.ell(x, y, r, r * 0.8, dk, 0);
  p.poly([[225, 245], [262, 288], [228, 292], [205, 262]], dk, 6);
  const hx = 300, hy = 150 + (o.mouth ? -4 * o.mouth : 0);
  p.ell(268, 190, 48, 50, body, 0);
  p.ell(hx, hy, 62, 56, body, 8);
  p.ell(hx + 46, hy + 16, 30, 24, belly, 6);
  const m = o.mouth || 0;
  if (m > 0.05) p.ell(hx + 54, hy + 34, 16, 6 + 16 * m, '#5a1e28', 5);
  p.ell(hx + 62, hy + 6, 9, 7, INK, 0);
  g.strokeStyle = INK; g.lineWidth = 3; for (const dy of [-4, 6, 16]) { g.beginPath(); g.moveTo(hx + 52, hy + 14 + dy * 0.4); g.lineTo(hx + 96, hy + 6 + dy); g.stroke(); }
  const e = o.expr || 'happy';
  if (e === 'gulp') { p.arc(hx + 12, hy - 14, 12, 10, 200, 340, 5); }
  else if (e === 'sleepy') { p.stroke([[hx + 2, hy - 12], [hx + 24, hy - 12]], 5); }
  else { const r = pup ? 17 : 13; p.ell(hx + 12, hy - 14, r, r + 2, INK, 0); p.ell(hx + 16, hy - 20, r * 0.35, r * 0.35, '#ffffff', 0); }
  if (e === 'happy' && m < 0.05) p.arc(hx + 40, hy + 30, 14, 8, 20, 160, 4);
  if (o.cap) {
    p.poly([[hx - 58, hy - 22], [hx - 40, hy - 58], [hx + 10, hy - 66], [hx + 44, hy - 46], [hx + 52, hy - 30], [hx - 50, hy - 18]], '#3a4a3a', 6);
    p.poly([[hx + 30, hy - 36], [hx + 84, hy - 30], [hx + 80, hy - 20], [hx + 26, hy - 24]], '#2e3c2e', 5);
  }
  if (o.wet) { for (const [x, y] of [[150, 160], [250, 170], [200, 150]]) p.poly([[x, y - 14], [x + 7, y], [x, y + 7], [x - 7, y]], '#bfe8ff', 3); }
  g.restore();
};

/** comic speech bubble with text, 600 x 400; t = pop 0..1; a.o.lines, a.o.tail ('left'|'right') */
export const drawSpeech = (p, t, a = {}) => {
  const g = p.g, k = Math.min(1, Math.max(0, t)); if (k <= 0) return;
  const o = a.o || {}, lines = o.lines || ['HELLO!'];
  g.save(); g.translate(300, 200); g.scale(0.3 + 0.7 * k, 0.3 + 0.7 * k); g.translate(-300, -200);
  const tl = o.tail === 'left';
  p.poly(tl ? [[150, 270], [70, 380], [230, 290]] : [[450, 270], [530, 380], [370, 290]], '#ffffff', 8);
  p.ell(300, 180, 270, 130, '#ffffff', 9);
  p.poly(tl ? [[160, 262], [80, 368], [222, 280]] : [[440, 262], [520, 368], [378, 280]], '#ffffff', 0);
  g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle';
  const fs = lines.length > 1 ? 62 : 96;
  g.font = `900 ${fs}px "Arial Black", Arial, sans-serif`;
  lines.forEach((L, i) => g.fillText(L, 300, 180 + (i - (lines.length - 1) / 2) * fs * 1.1));
  g.restore();
};

/** silver fish, 200 x 200 (facing right), a.rot */
export const drawFish = (p, t, a = {}) => {
  const g = p.g; g.save(); g.translate(100, 100); g.rotate(a.rot || 0); g.translate(-100, -100);
  p.poly([[40, 100], [10, 70], [14, 130]], '#7a9ab0', 5);
  p.ell(100, 100, 62, 26, '#b8d0e0', 6);
  p.ell(108, 110, 40, 10, '#e4eef4', 0);
  p.dot(140, 94, 5);
  g.restore();
};
export const drawDrop = (p) => { p.poly([[60, 14], [92, 70], [60, 104], [28, 70]], '#bfe8ff', 6); };
export const drawSplash = (p, t) => fxSplash(p, t);

/** thought bubble, 300 x 300; icon 'vacuum' (canister vacuum cleaner, no brand) */
export const drawBubble = (p, t, a = {}) => {
  const g = p.g, k = Math.min(1, Math.max(0, t)); if (k <= 0) return;
  g.save(); g.translate(150, 150); g.scale(0.3 + 0.7 * k, 0.3 + 0.7 * k); g.translate(-150, -150);
  p.ell(60, 270, 14, 12, '#ffffff', 5); p.ell(90, 238, 22, 18, '#ffffff', 5);
  p.ell(170, 120, 118, 100, '#ffffff', 7);
  if (a.icon === 'vacuum') {
    p.ell(130, 150, 52, 36, '#d84a3a', 6); p.ell(110, 182, 12, 12, '#3a3440', 4); p.ell(158, 182, 12, 12, '#3a3440', 4);
    g.strokeStyle = INK; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(175, 140); g.bezierCurveTo(230, 120, 220, 60, 250, 70); g.stroke();
    g.strokeStyle = '#8a8a96'; g.lineWidth = 8; g.stroke();
    p.poly([[236, 60], [270, 52], [276, 92], [244, 96]], '#5a5a66', 5);
    for (const [x, y] of [[262, 112], [285, 128], [250, 135]]) p.stroke([[x, y], [x - 14, y - 8]], 4);
  }
  g.restore();
};
export const drawSpeed = (p, t) => { for (let i = 0; i < 6; i++) { const y = 40 + i * 44, l = 120 + 80 * ((i * 5) % 3); p.stroke([[380 - l * t, y], [380, y]], 8, '#ffffff'); } };
export const drawHeart = (p) => { p.poly([[100, 170], [30, 100], [30, 55], [60, 35], [100, 60], [140, 35], [170, 55], [170, 100]], '#e84a6a', 6); };

/** scale dial, 400 x 400: needle angle from weight a.o.w (0..60 lb); red limit mark at 50 */
export const drawDial = (p, t, a = {}) => {
  const g = p.g, w = (a.o && a.o.w) || 0, c = 200, r = 170;
  p.ell(c, c, r, r, '#f8f2e0', 10);
  const ang = (v) => Math.PI * 0.75 + (v / 60) * Math.PI * 1.5;
  g.strokeStyle = INK; g.lineWidth = 5; for (let v = 0; v <= 60; v += 5) { const A = ang(v), l = v % 10 ? 18 : 32; g.beginPath(); g.moveTo(c + Math.cos(A) * (r - 10), c + Math.sin(A) * (r - 10)); g.lineTo(c + Math.cos(A) * (r - 10 - l), c + Math.sin(A) * (r - 10 - l)); g.stroke(); }
  g.strokeStyle = '#d82a2a'; g.lineWidth = 16; g.beginPath(); g.arc(c, c, r - 24, ang(50), ang(60)); g.stroke();
  g.fillStyle = INK; g.font = '900 34px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const v of [0, 20, 40]) { const A = ang(v); g.fillText(String(v), c + Math.cos(A) * (r - 70), c + Math.sin(A) * (r - 70)); }
  g.fillStyle = '#d82a2a'; { const A = ang(50); g.fillText('50', c + Math.cos(A) * (r - 70), c + Math.sin(A) * (r - 70)); }
  g.fillStyle = INK; g.font = '900 30px Arial'; g.fillText('LB', c, c + 90);
  const A = ang(w); p.poly([[c + Math.cos(A + 1.57) * 8, c + Math.sin(A + 1.57) * 8], [c + Math.cos(A) * (r - 30), c + Math.sin(A) * (r - 30)], [c + Math.cos(A - 1.57) * 8, c + Math.sin(A - 1.57) * 8]], '#d82a2a', 4);
  p.ell(c, c, 16, 16, INK, 0);
};
/** postage stamp flying, 200 x 200 */
export const drawStamp = (p, t, a = {}) => { const cols = ['#2a8a4a', '#d84a3a', '#3a6ab8', '#e8a030', '#8a4ab0'];
  p.poly([[50, 30], [150, 30], [150, 170], [50, 170]], '#fff8e8', 6); p.poly([[64, 44], [136, 44], [136, 156], [64, 156]], cols[(a.seed || 0) % 5], 0);
  p.ell(100, 92, 22, 26, '#fff8e8', 0); };
/** price tag 53 cents, 400 x 240 */
export const drawPrice = (p, t, a = {}) => { const g = p.g, k = Math.min(1, Math.max(0, t)); if (k <= 0) return;
  g.save(); g.translate(200, 120); g.scale(0.3 + 0.7 * k, 0.3 + 0.7 * k); g.translate(-200, -120);
  p.poly([[40, 40], [330, 40], [370, 120], [330, 200], [40, 200]], '#f4e2b0', 8); p.ell(320, 120, 14, 14, '#8a6a40', 4);
  g.fillStyle = INK; g.font = '900 96px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText((a.o && a.o.text) || '53¢', 180, 124); g.restore(); };
/** thought bubble with a train ticket and a crossed coin, 300 x 300 */
export const drawTicket = (p, t, a = {}) => { const g = p.g, k = Math.min(1, Math.max(0, t)); if (k <= 0) return;
  g.save(); g.translate(150, 150); g.scale(0.3 + 0.7 * k, 0.3 + 0.7 * k); g.translate(-150, -150);
  p.ell(60, 270, 14, 12, '#ffffff', 5); p.ell(90, 238, 22, 18, '#ffffff', 5); p.ell(170, 120, 118, 100, '#ffffff', 7);
  p.poly([[90, 80], [250, 80], [250, 160], [90, 160]], '#f2d070', 6); p.stroke([[120, 80], [120, 160]], 3);
  g.fillStyle = INK; g.font = '900 30px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TICKET', 186, 120);
  p.stroke([[100, 60], [240, 180]], 10, '#d82a2a'); p.stroke([[240, 60], [100, 180]], 10, '#d82a2a'); g.restore(); };
/** big rule book with a question mark, 300 x 260 */
export const drawBook = (p, t, a = {}) => { const g = p.g;
  p.poly([[20, 40], [150, 60], [150, 240], [20, 220]], '#f8f2e0', 6); p.poly([[150, 60], [280, 40], [280, 220], [150, 240]], '#f8f2e0', 6);
  for (let i = 0; i < 6; i++) { p.stroke([[40, 80 + i * 22], [130, 96 + i * 22]], 4, '#8a8a96'); }
  g.fillStyle = '#d82a2a'; g.font = '900 120px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 215, 145); };
/** steam puff, 300 x 300 */
export const drawSteam = (p, t) => { const k = Math.min(1, Math.max(0, t)), r = 40 + 70 * k; if (k >= 1) return;
  for (const [dx, dy, s] of [[0, 0, 1], [-50, 20, 0.7], [50, 15, 0.75]]) p.ell(150 + dx * (0.5 + k), 160 + dy - 40 * k, r * s, r * s * 0.85, '#f4f2ee', 6); };

export const newPen = (g) => new Pen(g);
