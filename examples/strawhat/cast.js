// Cast for "The Straw Hat Riot" (New York, 1922). Pen API from toonbase.js, 600x1000 design canvas (soles at y = 975).
import { Pen, INK, SKINS, bodyFront, headGeom, mul, shade, rad, ellPts, fxPuff, fxBurst, fxStars } from './toonbase.js';
export { fxPuff, fxBurst, fxStars };

export const OUTFITS = {
  gent1: { jacket: '#5a6a8a', pants: '#3a3a48', boots: INK, hat: 'boater', band: '#2a2a5a', buttons: '#2a2a3a', skin: SKINS[0], moustache: '#6a4428' },
  gent2: { jacket: '#c8b890', pants: '#6a5a44', boots: '#3a2a1e', hat: 'boater', band: '#8a2a2a', buttons: '#5a4a30', skin: SKINS[1] },
  gent3: { jacket: '#7a4a3a', pants: '#3a3440', boots: INK, hat: 'boater', band: '#2a4a2a', buttons: '#e8c45a', skin: SKINS[3], moustache: '#2a1e16', build: 'stout' },
  gent4: { jacket: '#3a5a4a', pants: '#2a2a30', boots: INK, hat: 'boater', band: '#2a2a2a', buttons: '#d8c890', skin: SKINS[2] },
  teen1: { jacket: '#c8502e', pants: '#3a4a6a', boots: '#3a2a1e', hat: 'cap', cap: '#4a4a52', buttons: '#2a2a2a', skin: SKINS[1] },
  teen2: { jacket: '#5a7a3a', pants: '#5a4a3a', boots: '#3a2a1e', hat: 'cap', cap: '#7a3a2a', buttons: '#2a2a2a', skin: SKINS[0] },
  teen3: { jacket: '#8a6aa8', pants: '#3a3a3a', boots: '#2a1e16', hat: 'cap', cap: '#2a3a5a', buttons: '#2a2a2a', skin: SKINS[3] },
  dock1: { jacket: '#3a5a8a', pants: '#4a4038', boots: '#2a1e16', hat: 'boater', band: '#3a2a2a', buttons: '#c8c0b0', skin: SKINS[1], moustache: '#4a3020', build: 'stout' },
  dock2: { jacket: '#8a3a2e', pants: '#3a3a44', boots: '#2a1e16', hat: 'boater', band: '#2a2a4a', buttons: '#c8c0b0', skin: SKINS[0], build: 'stout' },
  cop: { jacket: '#1e2a4a', pants: '#1e2a4a', boots: INK, hat: 'cap', cap: '#1e2a4a', buttons: '#e8c45a', skin: SKINS[0], moustache: '#3a2a1e', build: 'stout' },
};
// hatless variants (after the boater has been snatched)
for (const k of ['gent1', 'gent2', 'gent3', 'gent4', 'dock1', 'dock2']) OUTFITS[k + '_bare'] = { ...OUTFITS[k], hat: 'hair', hair: ['#5a3a22', '#2a1e16', '#8a5a2a', '#3a2a1e', '#6a4428', '#2a1e16'][['gent1', 'gent2', 'gent3', 'gent4', 'dock1', 'dock2'].indexOf(k)] };

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

/** straw boater hat on its own, 300 x 200. a.k = 0 round .. 1 squashed flat */
export const drawBoater = (p, t, a = {}) => {
  const k = Math.min(1, Math.max(0, a.k || 0)), col = '#e8d08a', dk = '#c8a85a';
  const g = p.g; g.save(); g.translate(150, 120); g.rotate((a.rot || 0) * Math.PI / 180); g.translate(-150, -120);
  const ch = 70 * (1 - 0.8 * k), cw = 78 + 14 * k, by = 140;
  p.ell(150, by, 128 + 10 * k, 30 - 6 * k, dk, 6);
  p.poly([[150 - cw, by], [150 - cw + 4, by - ch], [150 + cw - 4, by - ch], [150 + cw, by]], col, 6);
  p.poly([[150 - cw + 2, by - 8], [150 - cw + 3, by - 8 - 22 * (1 - 0.6 * k)], [150 + cw - 3, by - 8 - 22 * (1 - 0.6 * k)], [150 + cw - 2, by - 8]], a.band || '#2a2a5a', 0);
  p.ell(150, by - ch, cw - 4, 12, '#f0dc9a', 5);
  if (k > 0.5) { p.stroke([[110, by - ch + 4], [128, by - 6], [118, by + 10]], 4); p.stroke([[190, by - ch + 2], [178, by - 2]], 4); }
  g.restore();
};
/** wall calendar page, 400 x 520: a.day (number), a.month, a.mark (red circle 0..1), a.peel (0..1 page lifting) */
export const drawCalendar = (p, t, a = {}) => {
  const g = p.g;
  p.poly([[30, 40], [370, 40], [370, 500], [30, 500]], '#fbf6ea', 8);
  p.poly([[30, 40], [370, 40], [370, 150], [30, 150]], '#c8282e', 8);
  for (const x of [110, 290]) { p.ell(x, 40, 14, 14, '#d8d0c0', 5); }
  g.fillStyle = '#ffffff'; g.font = 'bold 72px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(a.month || 'SEPT', 200, 100);
  g.fillStyle = '#241726'; g.font = 'bold 230px Georgia, serif'; g.fillText(String(a.day ?? 15), 200, 330);
  g.font = 'bold 40px Georgia, serif'; g.fillText('1922', 200, 465);
  const m = Math.min(1, Math.max(0, a.mark || 0));
  if (m > 0) { g.strokeStyle = '#d8202a'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.ellipse(200, 325, 150, 125, -0.2, -1.4, -1.4 + 6.4 * m); g.stroke(); }
  const fl = Math.min(1, Math.max(0, a.peel || 0));
  if (fl > 0) { const y = 500 - 460 * fl; p.poly([[30, 150], [370, 150], [370, y], [30, y + 30 * Math.sin(Math.PI * fl)]], '#efe8d8', 6); }
};
/** police whistle tweet lines, 200 x 200 */
export const drawTweet = (p, t) => { const g = p.g; g.strokeStyle = '#241726'; g.lineWidth = 9; g.lineCap = 'round'; for (const [a, r] of [[-0.6, 1], [0, 1.15], [0.6, 1]]) { g.beginPath(); g.moveTo(40 + 30 * Math.cos(a), 100 + 30 * Math.sin(a)); g.lineTo(40 + (60 + 70 * r * (0.6 + 0.4 * t)) * Math.cos(a), 100 + (60 + 70 * r * (0.6 + 0.4 * t)) * Math.sin(a)); g.stroke(); } };
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
/** sweat drop, 200 x 200 */
export const drawDrop = (p) => { p.poly([[100, 30], [140, 120], [100, 170], [60, 120]], '#8ad0f0', 6); };

export const newPen = (g) => new Pen(g);
