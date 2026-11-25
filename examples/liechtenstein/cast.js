// Cast for "The Liechtenstein 1866" (San Juan Island, 1859). Pen API from toonbase.js, 600x1000 design canvas (soles at y = 975).
import { Pen, INK, SKINS, bodyFront, headGeom, mul, shade, rad, ellPts, fxPuff, fxBurst, fxStars } from './toonbase.js';
export { fxPuff, fxBurst, fxStars };

export const OUTFITS = {
  sold1: { jacket: '#5a6e8e', pants: '#d8d4c8', boots: INK, hat: 'shako', belt: '#f1efe6', buttons: '#e8c45a', skin: SKINS[0], rifle: true },
  sold2: { jacket: '#5a6e8e', pants: '#d8d4c8', boots: INK, hat: 'shako', belt: '#f1efe6', buttons: '#e8c45a', skin: SKINS[1], rifle: true, moustache: '#6a4428' },
  sold3: { jacket: '#5a6e8e', pants: '#d8d4c8', boots: INK, hat: 'shako', belt: '#f1efe6', buttons: '#e8c45a', skin: SKINS[2], rifle: true },
  sold4: { jacket: '#5a6e8e', pants: '#d8d4c8', boots: INK, hat: 'shako', belt: '#f1efe6', buttons: '#e8c45a', skin: SKINS[3], rifle: true, moustache: '#2a1e16' },
  officer: { jacket: '#3a4a6e', pants: '#d8d4c8', boots: INK, hat: 'shako_tall', buttons: '#e8c45a', sash: '#c0353a', sword: true, moustache: '#4a3020', build: 'stout', skin: SKINS[1] },
  courier: { jacket: '#c8743a', pants: '#3a3a44', boots: '#3a2a1e', hat: 'cap', cap: '#3a5a8a', buttons: '#e8c45a', skin: SKINS[0] },
  stranger: { jacket: '#5a7a3a', pants: '#6a5a44', boots: '#3a2a1e', hat: 'slouch', cap: '#3a2e26', buttons: '#2a2a2a', skin: SKINS[1], moustache: '#2a1e16' },
  civ1: { jacket: '#8a5a34', pants: '#4a5a3a', boots: '#3a2a1e', hat: 'cap', cap: '#6a5a3a', buttons: '#4a3020', skin: SKINS[0] },
  civ2: { jacket: '#3a6a4a', pants: '#5a4a3a', boots: '#3a2a1e', hat: 'hair', hair: '#5a3a22', buttons: '#2a2a2a', skin: SKINS[1], moustache: '#6a4428' },
  civ3: { jacket: '#7a3a5a', pants: '#3a3a44', boots: '#2a1e16', hat: 'slouch', cap: '#8a6a3a', buttons: '#e8c45a', skin: SKINS[2] },
  wife: { jacket: '#c25a7a', pants: '#3a3040', boots: '#3a2a1e', hat: 'bonnet', dress: '#c25a7a', skin: SKINS[0] },
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
  if (opts.salute !== undefined) { const k = opts.salute; extra.armsR = [sR, [300 + 1.3 * tw, sy + 0.25 * G.HH - 0.25 * G.HH * k], [300 + 1.25 * tw - 0.65 * tw * k, sy + 0.5 * G.HH - 1.15 * G.HH * k]]; }
  if (opts.cheer !== undefined) { const k = opts.cheer; extra.armsR = [sR, [300 + 1.35 * tw, sy - 0.1 * G.HH * k], [300 + 1.4 * tw + 10 * u, sy - 0.35 * G.HH - 0.35 * G.HH * k]]; extra.armsL = [sL, [300 - 1.35 * tw, sy - 0.1 * G.HH * k], [300 - 1.4 * tw - 10 * u, sy - 0.35 * G.HH - 0.35 * G.HH * k]]; }
  if (opts.aim !== undefined) { // rifle behind the arms, pointing screen-right
    const y = sy + 0.22 * G.HH - 0.06 * G.HH * (opts.kick || 0), x0 = 300 - 0.3 * tw, x1 = 300 + 1.6 * tw + 150 * u;
    p.band([[x0, y + 10 * u], [300 + 1.3 * tw, y]], '#7a4b2a', 6 * u, 1.5 * u, 'round');
    p.band([[300 + 1.3 * tw, y], [x1, y - 6 * u]], '#8d949c', 2.6 * u, 1.2 * u, 'round');
  }
  bodyFront(p, oo, { ...opts, ...extra });
  if (opts.cheer !== undefined && opts.mug) { const k = opts.cheer, hx = 300 + 1.4 * tw + 10 * u, hy = sy - 0.35 * G.HH - 0.35 * G.HH * k; p.poly([[hx - 9 * u, hy - 22 * u], [hx + 9 * u, hy - 22 * u], [hx + 8 * u, hy + 4 * u], [hx - 8 * u, hy + 4 * u]], '#e8b030', 2 * u); p.ell(hx, hy - 22 * u, 10 * u, 5 * u, '#fbf6e8', 2 * u); }
  if (opts.instr === 'drum') { const hx = 300, hy = sy + 0.95 * G.HH; p.ell(hx, hy + 22 * u, 30 * u, 10 * u, '#c8282e', 2 * u); p.poly([[hx - 30 * u, hy], [hx + 30 * u, hy], [hx + 30 * u, hy + 22 * u], [hx - 30 * u, hy + 22 * u]], '#c8282e', 2 * u); p.ell(hx, hy, 30 * u, 10 * u, '#f4ead0', 2 * u); const k = opts.beat || 0; p.stroke([[hx + 30 * u, hy - 30 * u + 20 * u * k], [hx + 8 * u, hy - 4 * u]], 2.5 * u, '#7a5232'); }
  if (opts.instr === 'fiddle') { const hx = 300 + 0.6 * tw, hy = sy + 0.1 * G.HH; p.ell(hx, hy, 12 * u, 18 * u, '#a8642a', 2 * u, 0, 360, -40); p.stroke([[hx + 8 * u, hy - 12 * u], [hx + 26 * u, hy - 32 * u]], 3 * u, '#5a3a1e'); const k = opts.beat || 0; p.stroke([[hx - 26 * u + 10 * u * k, hy + 22 * u], [hx + 22 * u + 10 * u * k, hy - 8 * u]], 1.6 * u, '#e8d8b0'); }
  if (opts.instr === 'horn') { const hx = 300 + 0.3 * tw, hy = G.chin - 0.28 * G.HH; p.poly([[hx, hy - 3 * u], [hx + 40 * u, hy - 8 * u], [hx + 52 * u, hy - 18 * u], [hx + 52 * u, hy + 14 * u], [hx + 40 * u, hy + 6 * u], [hx, hy + 3 * u]], '#e8b830', 2 * u); }
  if (opts.paper) { const hx = 300 - 1.0 * tw, hy = sy + 0.75 * G.HH; p.poly([[hx - 16 * u, hy - 22 * u], [hx + 16 * u, hy - 20 * u], [hx + 14 * u, hy + 20 * u], [hx - 17 * u, hy + 18 * u]], '#f4efe0', 2 * u); for (let i = 0; i < 4; i++) p.stroke([[hx - 10 * u, hy - 12 * u + i * 8 * u], [hx + 9 * u, hy - 11 * u + i * 8 * u]], 1.5 * u); }
};

/** big painted count board, 520 x 400: a.k reveals 81 (80 crossed out first) */
export const drawCount = (p, t, a = {}) => {
  const g = p.g, k = Math.min(1, Math.max(0, a.k || 0));
  p.poly([[20, 20], [500, 20], [500, 380], [20, 380]], '#7a5434', 8); p.poly([[44, 44], [476, 44], [476, 356], [44, 356]], '#2f3b33', 4);
  g.fillStyle = '#f2efe4'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 44px Georgia, serif'; g.fillText('MEN', 260, 92);
  g.font = 'bold 170px Georgia, serif';
  if (k < 0.5) g.fillText('80', 260, 240); else { g.fillStyle = '#ffd84a'; g.fillText('81', 260, 240); }
  if (k > 0.15 && k < 0.5) { g.strokeStyle = '#e8402a'; g.lineWidth = 14; g.lineCap = 'round'; const e = (k - 0.15) / 0.35; g.beginPath(); g.moveTo(130, 300); g.lineTo(130 + 260 * e, 300 - 150 * e); g.stroke(); }
};
/** question mark bubble, 260 x 300 */
export const drawQuestion = (p, t) => { const g = p.g; p.ell(130, 130, 110, 110, '#fbf6ea', 7); p.poly([[95, 220], [130, 235], [80, 285]], '#fbf6ea', 6); p.ell(130, 130, 104, 104, '#fbf6ea', 0); g.fillStyle = '#241726'; g.font = 'bold 170px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 130, 140 + 6 * Math.sin(t * 6.3)); };
/** snowflake, 120 x 120 */
export const drawFlake = (p) => { const g = p.g; g.strokeStyle = '#ffffff'; g.lineWidth = 9; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(60 - 45 * Math.cos(a), 60 - 45 * Math.sin(a)); g.lineTo(60 + 45 * Math.cos(a), 60 + 45 * Math.sin(a)); g.stroke(); } };
/** wind streaks, 500 x 200 (t = phase) */
export const drawWind = (p, t) => { const g = p.g; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 8; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { const x = ((t + i * 0.33) % 1) * 400 - 40, y = 50 + i * 50; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 60, y - 20, x + 120, y + 20, x + 160, y); g.stroke(); } };
/** sealed letter, 300 x 220 */
export const drawLetter = (p) => { p.poly([[20, 30], [280, 30], [280, 190], [20, 190]], '#f4ecd4', 7); p.stroke([[20, 30], [150, 120], [280, 30]], 6); p.ell(150, 118, 26, 26, '#b82a2a', 5); };
/** notice board "ARMY" with a stamp, 520 x 420: a.k stamp in (0..1) */
export const drawNotice = (p, t, a = {}) => {
  const g = p.g, k = Math.min(1, Math.max(0, a.k || 0));
  p.poly([[30, 30], [490, 30], [490, 390], [30, 390]], '#f4ecd4', 8);
  g.fillStyle = '#241726'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 96px Georgia, serif'; g.fillText('ARMY', 260, 130);
  g.font = 'bold 54px Georgia, serif'; g.fillText('1868', 260, 230);
  if (k > 0) { g.save(); g.translate(260, 300); g.rotate(-0.18); const s = 1.6 - 0.6 * k; g.scale(s, s); g.globalAlpha = Math.min(1, k * 1.5);
    g.strokeStyle = '#c8202a'; g.lineWidth = 10; g.strokeRect(-200, -55, 400, 110); g.fillStyle = '#c8202a'; g.font = 'bold 70px Georgia, serif'; g.fillText('DISBANDED', 0, 4); g.restore(); }
};
/** simple 1859 flags on a 480 x 300 canvas: kind 'uk' or 'us'; wave phase t */
export const drawFlag = (p, t, a = {}) => {
  const g = p.g, w = 400, h = 240, x0 = 40, y0 = 30;
  g.save();
  const wav = (x) => 10 * Math.sin(x / 70 + (a.ph || 0));
  const clipFlag = () => { g.beginPath(); g.moveTo(x0, y0 + wav(0)); for (let x = 0; x <= w; x += 20) g.lineTo(x0 + x, y0 + wav(x) * (x / w)); for (let x = w; x >= 0; x -= 20) g.lineTo(x0 + x, y0 + h + wav(x) * (x / w)); g.closePath(); };
  g.fillStyle = '#241726'; g.fillRect(x0 - 16, y0 - 10, 14, 280);
  clipFlag(); g.lineWidth = 14; g.strokeStyle = '#241726'; g.stroke(); g.save(); g.clip();
  if (a.flagKind === 'li') {
    g.fillStyle = '#1e3a9a'; g.fillRect(x0, y0 - 20, w, (h + 40) / 2); g.fillStyle = '#c8202a'; g.fillRect(x0, y0 - 20 + (h + 40) / 2, w, (h + 40) / 2 + 2);
    g.fillStyle = '#e8c040'; g.beginPath(); g.moveTo(x0 + 60, y0 + 70); g.lineTo(x0 + 70, y0 + 30); g.lineTo(x0 + 90, y0 + 55); g.lineTo(x0 + 105, y0 + 20); g.lineTo(x0 + 120, y0 + 55); g.lineTo(x0 + 140, y0 + 30); g.lineTo(x0 + 150, y0 + 70); g.closePath(); g.fill();
  } else if (a.flagKind === 'uk') {
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
