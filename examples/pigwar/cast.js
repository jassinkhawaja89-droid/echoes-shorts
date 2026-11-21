// Cast for "The Pig War" (San Juan Island, 1859). Pen API from toonbase.js, 600x1000 design canvas (soles at y = 975).
import { Pen, INK, SKINS, bodyFront, headGeom, mul, shade, rad, ellPts, fxPuff, fxBurst, fxStars } from './toonbase.js';
export { fxPuff, fxBurst, fxStars };

export const OUTFITS = {
  farmer: { jacket: '#c8743a', pants: '#3a5a8a', boots: '#5a3a24', hat: 'slouch', cap: '#a8915e', buttons: '#5a3a24', skin: SKINS[1], moustache: '#7a4a2a' },
  company: { jacket: '#3a3440', pants: '#5a5660', boots: '#1e1e22', hat: 'tophat', buttons: '#c8c8c8', skin: SKINS[0], moustache: '#c8b8a0', build: 'stout' },
  redcoat: { jacket: '#c8282e', pants: '#2a2a36', boots: INK, hat: 'shako', belt: '#f1efe6', buttons: '#e8c45a', skin: SKINS[0], rifle: true },
  bluecoat: { jacket: '#2a3e6e', pants: '#7a8ab0', boots: INK, hat: 'cap', cap: '#22305a', belt: '#f1efe6', buttons: '#e8c45a', skin: SKINS[2], rifle: true },
  digger: { jacket: '#2a3e6e', pants: '#7a8ab0', boots: INK, hat: 'cap', cap: '#22305a', belt: null, buttons: '#e8c45a', skin: SKINS[1] },
};

/** opts: bodyFront opts + {point, aim (rifle levelled to screen-right), shrug} */
export const drawPerson = (p, o, opts = {}) => {
  const seed = opts.seed ?? 1, G = headGeom(seed, o.build ?? 'adult', 'stand');
  const u = G.u, sy = G.chin + 0.12 * G.HH, tw = (G.tw / 2) * 2 * G.a / 1.06;
  const sR = [300 + 0.85 * tw, sy], sL = [300 - 0.85 * tw, sy];
  const extra = {};
  let oo = o;
  if (opts.point !== undefined) { const k = opts.point; extra.armsR = [sR, [300 + 1.25 * tw + 30 * u * k, sy + 0.2 * G.HH - 0.25 * G.HH * k], [300 + 1.3 * tw + 70 * u * k, sy + 0.35 * G.HH - 0.6 * G.HH * k]]; }
  if (opts.aim !== undefined) {
    oo = { ...o, rifle: false };
    const y = sy + 0.22 * G.HH - 0.06 * G.HH * (opts.kick || 0);
    extra.armsR = [sR, [300 + 1.2 * tw, sy + 0.3 * G.HH], [300 + 1.25 * tw + 20 * u, y]];
    extra.armsL = [sL, [300 - 0.2 * tw, sy + 0.4 * G.HH], [300 + 1.6 * tw + 50 * u, y - 4 * u]];
  }
  if (opts.shrug) { const k = opts.shrug; extra.armsR = [sR, [300 + 1.4 * tw, sy + 0.25 * G.HH], [300 + 1.6 * tw + 10 * u, sy - 0.1 * G.HH * k]]; extra.armsL = [sL, [300 - 1.4 * tw, sy + 0.25 * G.HH], [300 - 1.6 * tw - 10 * u, sy - 0.1 * G.HH * k]]; }
  if (opts.present !== undefined) extra.wave = opts.present;
  if (opts.aim !== undefined) { // rifle behind the arms, pointing screen-right
    const y = sy + 0.22 * G.HH - 0.06 * G.HH * (opts.kick || 0), x0 = 300 - 0.3 * tw, x1 = 300 + 1.6 * tw + 150 * u;
    p.band([[x0, y + 10 * u], [300 + 1.3 * tw, y]], '#7a4b2a', 6 * u, 1.5 * u, 'round');
    p.band([[300 + 1.3 * tw, y], [x1, y - 6 * u]], '#8d949c', 2.6 * u, 1.2 * u, 'round');
  }
  bodyFront(p, oo, { ...opts, ...extra });
};

/** cartoon pig, side view, on the 600 x 1000 canvas (feet at y 975). opts: expr (happy/eat/dazed/shock), chew, upside, angel, legs (walk phase) */
export const drawPig = (p, opts = {}) => {
  const g = p.g, pink = '#f4a6b4', dk = '#d47a8e', W = 1;
  g.save();
  if (opts.upside) { g.translate(300, 900); g.rotate(Math.PI); g.translate(-300, -900); }
  const by = 820, bx = 290;
  const leg = (x, ph) => { const s = Math.sin(ph) * 14; p.poly([[x - 16 + s, by + 40], [x + 16 + s, by + 40], [x + 14 + s, 975], [x - 14 + s, 975]], pink, 7); p.poly([[x - 14 + s, 958], [x + 14 + s, 958], [x + 14 + s, 975], [x - 14 + s, 975]], '#6a3a3a', 5); };
  const ph = (opts.legs || 0) * Math.PI * 2;
  if (opts.angel) { // wings behind
    for (const s of [-1, 1]) { g.save(); g.translate(bx - 10, by - 70); g.rotate(s * 0.25 + 0.15 * Math.sin(opts.flap || 0)); p.ell(s * 70, -60, 70, 110, '#ffffff', 7, 0, 360, s * 25); g.restore(); }
  }
  leg(bx - 95, ph + Math.PI); leg(bx + 75, ph);
  // tail
  g.strokeStyle = INK; g.lineWidth = 13; g.lineCap = 'round'; g.beginPath(); g.moveTo(bx - 175, by - 20); g.bezierCurveTo(bx - 230, by - 60, bx - 200, by - 110, bx - 225, by - 95); g.stroke();
  g.strokeStyle = pink; g.lineWidth = 6; g.stroke();
  p.ell(bx, by, 185, 115, pink, 8);
  p.ell(bx - 30, by + 40, 120, 50, '#f8bcc8', 0);
  leg(bx - 60, ph); leg(bx + 110, ph + Math.PI);
  // head
  const hx = bx + 175, hy = by - 60 + (opts.chew ? 8 * Math.sin(opts.chew) : 0);
  p.poly([[hx - 30, hy - 70], [hx - 5, hy - 140], [hx + 25, hy - 60]], dk, 7);
  p.ell(hx, hy, 95, 88, pink, 8);
  p.poly([[hx + 10, hy - 75], [hx + 60, hy - 135], [hx + 70, hy - 55]], dk, 7);
  p.ell(hx + 78, hy + 22, 40, 34, '#f28aa0', 7);
  p.dot(hx + 66, hy + 18, 6); p.dot(hx + 90, hy + 18, 6);
  const e = opts.expr || 'happy';
  if (e === 'dazed') { for (const dx of [-12, 30]) { g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); for (let a = 0; a < 12; a += 0.3) g.lineTo(hx + dx + Math.cos(a) * a * 1.3, hy - 28 + Math.sin(a) * a * 1.3); g.stroke(); } }
  else if (e === 'shock') { for (const dx of [-12, 30]) { p.ell(hx + dx, hy - 28, 16, 18, '#ffffff', 5); p.dot(hx + dx + 3, hy - 26, 6); } }
  else if (e === 'eat') { for (const dx of [-12, 30]) p.arc(hx + dx, hy - 24, 10, 6, 200, 340, 5); }
  else { for (const dx of [-12, 30]) p.arc(hx + dx, hy - 30, 11, 9, 200, 340, 5); }
  if (e === 'happy' || e === 'eat') p.arc(hx + 30, hy + 48, 26, 16, 20, 160, 5);
  if (e === 'shock') p.ell(hx + 34, hy + 56, 12, 14, '#5a1e2a', 4);
  if (opts.angel) { p.ell(hx - 10, hy - 140, 60, 16, null, 0); g.strokeStyle = INK; g.lineWidth = 14; g.beginPath(); g.ellipse(hx - 10, hy - 150, 58, 15, 0, 0, 6.3); g.stroke(); g.strokeStyle = '#ffd84a'; g.lineWidth = 8; g.stroke(); }
  if (opts.potato) { p.ell(hx + 110, hy + 40, 30, 22, '#b88a50', 5); }
  g.restore();
};

/** simple 1859 flags on a 480 x 300 canvas: kind 'uk' or 'us'; wave phase t */
export const drawFlag = (p, t, a = {}) => {
  const g = p.g, w = 400, h = 240, x0 = 40, y0 = 30;
  g.save();
  const wav = (x) => 10 * Math.sin(x / 70 + (a.ph || 0));
  const clipFlag = () => { g.beginPath(); g.moveTo(x0, y0 + wav(0)); for (let x = 0; x <= w; x += 20) g.lineTo(x0 + x, y0 + wav(x) * (x / w)); for (let x = w; x >= 0; x -= 20) g.lineTo(x0 + x, y0 + h + wav(x) * (x / w)); g.closePath(); };
  g.fillStyle = '#241726'; g.fillRect(x0 - 16, y0 - 10, 14, 280);
  clipFlag(); g.lineWidth = 14; g.strokeStyle = '#241726'; g.stroke(); g.save(); g.clip();
  if (a.flagKind === 'uk') {
    g.fillStyle = '#1e3a8a'; g.fillRect(x0, y0 - 20, w, h + 40);
    g.strokeStyle = '#ffffff'; g.lineWidth = 46; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + w, y0 + h); g.moveTo(x0 + w, y0); g.lineTo(x0, y0 + h); g.stroke();
    g.strokeStyle = '#c8202a'; g.lineWidth = 16; g.stroke();
    g.fillStyle = '#ffffff'; g.fillRect(x0, y0 + h / 2 - 40, w, 80); g.fillRect(x0 + w / 2 - 40, y0 - 20, 80, h + 40);
    g.fillStyle = '#c8202a'; g.fillRect(x0, y0 + h / 2 - 24, w, 48); g.fillRect(x0 + w / 2 - 24, y0 - 20, 48, h + 40);
  } else {
    for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#c8202a'; g.fillRect(x0, y0 - 20 + i * (h + 40) / 13, w, (h + 40) / 13 + 1); }
    g.fillStyle = '#1e3a8a'; g.fillRect(x0, y0 - 20, w * 0.42, (h + 40) * 0.54);
    g.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(x0 + 20 + i * 32, y0 + j * 32, 6, 0, 6.3); g.fill(); }
  }
  g.restore(); g.restore();
};

/** cartoon smoke cloud (t 0..1), 400 x 400 */
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
/** orange flash (t 0..1), 500 x 500 */
export const drawBang = (p, t) => {
  const g = p.g, c = 250, e = 1 - (1 - Math.min(1, t)) ** 2, n = 12;
  if (t > 0.75) return;
  const star = (r0, r1, col, w) => { g.beginPath(); for (let i = 0; i <= n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, r = i % 2 ? r0 : r1 * (0.8 + 0.2 * Math.sin(i * 2.7)); g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); } g.closePath(); g.fillStyle = col; g.fill(); if (w) { g.lineWidth = w; g.strokeStyle = '#241726'; g.stroke(); } };
  star(80 * e + 30, 220 * e + 40, '#ff8a2a', 12); star(50 * e + 20, 140 * e + 25, '#ffd84a'); star(20 * e + 10, 60 * e + 12, '#fff8d8');
};
/** falling autumn leaf, 200 x 200 */
export const drawLeaf = (p, t, a = {}) => { p.ell(100, 100, 60, 30, a.col || '#d8742a', 6, 0, 360, (a.rot || 0)); p.stroke([[50, 100], [150, 100]], 4); };
/** sweat drop, 200 x 200 */
export const drawDrop = (p) => { p.poly([[100, 30], [140, 120], [100, 170], [60, 120]], '#8ad0f0', 6); };

export const newPen = (g) => new Pen(g);
