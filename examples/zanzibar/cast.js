// Cast for "The Shortest War" (Zanzibar, 1896). Drawn with the Pen API from toonbase.js
// on the 600x1000 design canvas (soles at y = 975).
import { Pen, INK, SKINS, bodyFront, headGeom, mul, shade, rad, ellPts, fxPuff, fxBurst, fxStars } from './toonbase.js';
export { fxPuff, fxBurst, fxStars };

const BROWN = '#b07a52', DEEP = '#8a5a3a';
export const OUTFITS = {
  admiral: { jacket: '#1f2b4e', pants: '#1f2b4e', boots: '#141218', hat: 'bicorne', buttons: '#e2bc4a', skin: SKINS[0], moustache: '#ece6da', build: 'stout' },
  khalid: { jacket: '#2c3a5c', dress: '#f2ece0', pants: '#f2ece0', boots: '#6a4026', hat: 'turban', cap: '#f6f2e8', jewel: '#d8343a', buttons: '#e2bc4a', skin: BROWN, moustache: '#1a1210' },
  oldSultan: { jacket: '#6a3a6a', dress: '#efe6d2', pants: '#efe6d2', boots: '#6a4026', hat: 'turban', cap: '#f0e6c8', jewel: '#3a9a5a', buttons: '#e2bc4a', skin: DEEP, moustache: '#f2f0ea' },
  guard: { jacket: '#c8b48a', pants: '#ece4d2', boots: '#5a3a24', hat: 'cap', cap: '#b8282e', buttons: '#7a5a3a', skin: DEEP, moustache: '#1a1210' },
};

/** opts: bodyFront opts + {point (0..1), cross, watch (hand to chest), armsUp (0..1), hold, soot} */
export const drawPerson = (p, o, opts = {}) => {
  const seed = opts.seed ?? 1, G0 = headGeom(seed, o.build ?? 'adult', opts.mode === 'sit' ? 'sit' : 'stand');
  const B = { adult: [1.1, 1.4], stout: [1.15, 1.32] }[o.build ?? 'adult'], tall = (1 + B[0] + B[1]) * G0.HH, ph = opts.phase || 0;
  const bob = opts.mode === 'march' ? 0.025 * tall * Math.cos(4 * Math.PI * ph) : opts.mode === 'stroll' ? 0.015 * tall * Math.cos(4 * Math.PI * ph) : 0;
  const G = { ...G0, hc: G0.hc + bob, chin: G0.chin + bob };
  const u = G.u, sy = G.chin + 0.12 * G.HH, tw = (G.tw / 2) * 2 * G.a / 1.06;
  const sR = [300 + 0.85 * tw, sy], sL = [300 - 0.85 * tw, sy];
  const extra = {};
  if (opts.point !== undefined) { const k = opts.point; extra.armsR = [sR, [300 + 1.25 * tw + 30 * u * k, sy + 0.2 * G.HH - 0.25 * G.HH * k], [300 + 1.3 * tw + 70 * u * k, sy + 0.35 * G.HH - 0.6 * G.HH * k]]; }
  if (opts.cross) {
    extra.armsR = [sR, [300 + 1.1 * tw, sy + 0.38 * G.HH], [300 - 0.45 * tw, sy + 0.3 * G.HH]];
    extra.armsL = [sL, [300 - 1.1 * tw, sy + 0.42 * G.HH], [300 + 0.45 * tw, sy + 0.36 * G.HH]];
  }
  if (opts.watch) extra.armsR = [sR, [300 + 1.2 * tw, sy + 0.4 * G.HH], [300 + 0.45 * tw, sy + 0.18 * G.HH]];
  if (opts.armsUp !== undefined) { extra.wave = opts.armsUp; extra.waveL = opts.armsUp; }
  if (opts.present !== undefined) extra.wave = opts.present;
  if (opts.hold) {
    extra.armsR = [sR, [300 + 1.2 * tw, sy + 0.42 * G.HH], [300 + 0.55 * tw, sy + 0.5 * G.HH]];
    extra.armsL = [sL, [300 - 1.2 * tw, sy + 0.42 * G.HH], [300 - 0.55 * tw, sy + 0.5 * G.HH]];
  }
  bodyFront(p, o, { ...opts, ...extra });
  if (opts.soot) {
    p.g.globalAlpha = 0.6;
    for (const [dx, dy, r] of [[-0.3, 0.55, 14], [0.25, 0.9, 18], [0.05, 1.25, 12], [0.38, -0.95, 9], [-0.4, -0.75, 7]]) p.ell(300 + dx * tw * 1.6, sy + dy * G.HH, r * u, r * 0.7 * u, '#3a3036', 0);
    p.g.globalAlpha = 1;
  }
};

/** pocket watch: a.min minutes (0..60) swept as a red pie from 12; a.label under the dial (400 x 600) */
export const drawWatch = (p, t, a = {}) => {
  const g = p.g, cx = 200, cy = 220, r = 150, m = a.min || 0;
  g.save();
  g.fillStyle = '#141014'; g.beginPath(); g.arc(cx, cy - r - 24, 26, 0, 6.3); g.fill();
  g.fillStyle = '#d8b24a'; g.beginPath(); g.arc(cx, cy - r - 24, 17, 0, 6.3); g.fill();
  g.fillStyle = '#141014'; g.beginPath(); g.arc(cx, cy, r + 16, 0, 6.3); g.fill();
  g.fillStyle = '#e2bc4a'; g.beginPath(); g.arc(cx, cy, r + 8, 0, 6.3); g.fill();
  g.fillStyle = '#fff8e8'; g.beginPath(); g.arc(cx, cy, r - 6, 0, 6.3); g.fill();
  if (m > 0) { g.fillStyle = '#e8484a'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r - 14, -Math.PI / 2, -Math.PI / 2 + (m / 60) * Math.PI * 2); g.closePath(); g.fill(); }
  g.strokeStyle = '#241726'; g.lineCap = 'round';
  for (let i = 0; i < 12; i++) { const an = (i / 12) * Math.PI * 2; g.lineWidth = i % 3 ? 5 : 9; g.beginPath(); g.moveTo(cx + Math.sin(an) * (r - 34), cy - Math.cos(an) * (r - 34)); g.lineTo(cx + Math.sin(an) * (r - 16), cy - Math.cos(an) * (r - 16)); g.stroke(); }
  const mh = (m / 60) * Math.PI * 2, hh = ((9 + m / 60) / 12) * Math.PI * 2;
  g.lineWidth = 12; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(hh) * 70, cy - Math.cos(hh) * 70); g.stroke();
  g.lineWidth = 8; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.sin(mh) * 112, cy - Math.cos(mh) * 112); g.stroke();
  g.fillStyle = '#241726'; g.beginPath(); g.arc(cx, cy, 13, 0, 6.3); g.fill();
  if (a.label) {
    const s = 0.3 + 0.7 * Math.min(1, (a.lt ?? 1) * 4);
    g.translate(cx, cy + r + 90); g.scale(s, s); g.rotate(-0.06);
    g.fillStyle = '#141014'; g.fillRect(-170, -50, 340, 100); g.fillStyle = '#e8484a'; g.fillRect(-162, -42, 324, 84);
    g.fillStyle = '#fff4e0'; g.font = 'bold 64px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(a.label, 0, 4);
  }
  g.restore();
};

/** generic placard: a.text, a.bg (500 x 320) */
export const drawStamp = (p, t, a = {}) => {
  const g = p.g, s = 0.25 + 0.75 * Math.min(1, t * 4);
  g.save(); g.translate(250, 160); g.rotate((a.rot || -8) * Math.PI / 180); g.scale(s, s);
  g.fillStyle = '#1a1416'; g.fillRect(-232, -92, 464, 184);
  g.fillStyle = a.bg || '#2a8a4a'; g.fillRect(-220, -80, 440, 160);
  g.strokeStyle = '#fff4e0'; g.lineWidth = 8; g.strokeRect(-202, -62, 404, 124);
  g.fillStyle = '#fff4e0'; g.font = `bold ${a.fontPx || 84}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(a.text || 'OK', 0, 6);
  g.restore();
};

/** the bill: a paper scroll that unrolls downwards (t 0..1) on a 360 x 900 canvas */
export const drawBill = (p, t) => {
  const g = p.g, k = Math.min(1, t), top = 40, len = 120 + 700 * (1 - (1 - k) ** 3), x0 = 40, x1 = 320;
  g.save();
  g.fillStyle = '#141014'; g.fillRect(x0 - 6, top - 6, x1 - x0 + 12, len + 12);
  g.fillStyle = '#f6ecd2'; g.fillRect(x0, top, x1 - x0, len);
  g.save(); g.beginPath(); g.rect(x0, top, x1 - x0, len); g.clip();
  g.fillStyle = '#241726'; g.textAlign = 'center';
  g.font = 'bold 50px Georgia, serif'; g.fillText('BILL', 180, top + 64);
  g.fillRect(70, top + 82, 220, 4);
  g.font = '30px Georgia, serif'; g.textAlign = 'left';
  ['Shells fired', 'at the palace', '', '1 war,', '38 minutes'].forEach((r, i) => g.fillText(r, 66, top + 140 + i * 46));
  for (let i = 0; i < 8; i++) { g.fillStyle = '#9a8a70'; g.fillRect(66, top + 420 + i * 30, i % 3 === 0 ? 220 : 150, 7); }
  g.fillStyle = '#c8243a'; g.font = 'bold 44px Georgia, serif'; g.fillText('PAY UP!', 66, top + 740);
  g.restore();
  g.fillStyle = '#141014'; g.fillRect(x0 - 16, top + len - 18, x1 - x0 + 32, 40);
  g.fillStyle = '#e8dcc0'; g.fillRect(x0 - 10, top + len - 12, x1 - x0 + 20, 28);
  g.restore();
};

/** cartoon smoke cloud: grey bubbles with ink edge that swell then shrink (t 0..1), 400 x 400 */
export const drawSmoke = (p, t, a = {}) => {
  const g = p.g, tt = Math.min(1, Math.max(0, t)), s = Math.sin(Math.PI * tt) ** 0.6, seed = a.seed || 1, col = a.col || '#d8d2c8';
  const R = (i) => { const x = Math.sin((seed + i) * 91.7) * 43758.5; return x - Math.floor(x); };
  const bl = [];
  for (let i = 0; i < 7; i++) bl.push([200 + (R(i) - 0.5) * 180 * (0.6 + 0.6 * tt), 250 - (R(i + 9) * 110) * (0.4 + 0.6 * tt), (48 + 36 * R(i + 4)) * s]);
  g.fillStyle = '#241726';
  for (const [x, y, r] of bl) if (r > 2) { g.beginPath(); g.arc(x, y, r + 7, 0, 6.3); g.fill(); }
  g.fillStyle = col;
  for (const [x, y, r] of bl) if (r > 2) { g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); }
  g.fillStyle = '#f4f0ea';
  for (const [x, y, r] of bl) if (r > 10) { g.beginPath(); g.arc(x - r * 0.3, y - r * 0.32, r * 0.38, 0, 6.3); g.fill(); }
};

/** orange explosion flash (t 0..1), 500 x 500 */
export const drawBang = (p, t) => {
  const g = p.g, c = 250, e = 1 - (1 - Math.min(1, t)) ** 2, n = 12;
  if (t > 0.75) return;
  const star = (r0, r1, col, w) => {
    g.beginPath();
    for (let i = 0; i <= n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, r = i % 2 ? r0 : r1 * (0.8 + 0.2 * Math.sin(i * 2.7)); g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); }
    g.closePath(); g.fillStyle = col; g.fill(); if (w) { g.lineWidth = w; g.strokeStyle = '#241726'; g.stroke(); }
  };
  star(80 * e + 30, 220 * e + 40, '#ff8a2a', 12); star(50 * e + 20, 140 * e + 25, '#ffd84a'); star(20 * e + 10, 60 * e + 12, '#fff8d8');
};

export const newPen = (g) => new Pen(g);
