// Cast for "The Man Who Sold the Eiffel Tower" (Paris, 1925). Drawn with the Pen API from toonbase.js
// on the 600x1000 design canvas (soles at y = 975).
import { Pen, INK, SKINS, bodyFront, headGeom, mul, shade, rad, ellPts, fxPuff, fxBurst, fxStars } from './toonbase.js';
export { fxPuff, fxBurst, fxStars };

export const OUTFITS = {
  reis: { tie: '#2a4a8a', jacket: '#e6d8b8', pants: '#d4c4a0', boots: '#6a4026', hat: 'boater', cap: '#ecd48c', band: '#2a3a6a', belt: null, buttons: '#8a6a3a', skin: SKINS[2], moustache: '#1e1612' },
  reisCell: { tie: '#2a4a8a', jacket: '#bdb39c', pants: '#a49a84', boots: '#4a3426', hat: 'hair', hair: '#1e1612', belt: null, buttons: '#8a6a3a', skin: SKINS[2], moustache: '#1e1612' },
  printer: { tie: '#6a1e2a', jacket: '#5a5e66', pants: '#46484e', boots: '#1e1e22', hat: 'tophat', belt: null, buttons: '#c8c8c8', skin: SKINS[0], moustache: '#e8e4dc', build: 'stout' },
  worker: { jacket: '#6a4a3a', pants: '#3a3a44', boots: '#2a2020', hat: 'cap', cap: '#4a4a52', belt: null, buttons: '#8a8a8a', skin: SKINS[1] },
  clerk: { tie: '#2a2a2a', jacket: '#3e4a5a', pants: '#2e3440', boots: '#1e1e22', hat: 'cap', cap: '#3a8a5a', belt: null, buttons: '#c8a050', skin: SKINS[0], moustache: '#6a4a30' },
};

/** opts: bodyFront opts + {blush, shh, whisper, stamp (0 up .. 1 down), bag, case, present, tip} */
export const drawPerson = (p, o, opts = {}) => {
  const seed = opts.seed ?? 1, G0 = headGeom(seed, o.build ?? 'adult', opts.mode === 'sit' ? 'sit' : 'stand');
  const B = { adult: [1.1, 1.4], stout: [1.15, 1.32] }[o.build ?? 'adult'], tall = (1 + B[0] + B[1]) * G0.HH, ph = opts.phase || 0;
  const bob = opts.mode === 'march' ? 0.025 * tall * Math.cos(4 * Math.PI * ph) : opts.mode === 'stroll' ? 0.015 * tall * Math.cos(4 * Math.PI * ph) : 0;
  const G = { ...G0, hc: G0.hc + bob, chin: G0.chin + bob };
  const u = G.u, sy = G.chin + 0.12 * G.HH, tw = (G.tw / 2) * 2 * G.a / 1.06;
  const sR = [300 + 0.85 * tw, sy], sL = [300 - 0.85 * tw, sy];
  const extra = {};
  if (opts.shh) extra.armsR = [sR, [300 + 1.15 * tw, sy + 0.42 * G.HH], [300 + 14 * u, G.hc + 0.5 * G.b]];
  if (opts.whisper) extra.armsR = [sR, [300 + 1.3 * tw, sy + 0.35 * G.HH], [300 + 0.95 * G.a, G.hc + 0.3 * G.b]];
  if (opts.stamp !== undefined) { const y = sy + (0.02 + 0.36 * opts.stamp) * G.HH; extra.armsR = [sR, [300 + 1.25 * tw, sy + 0.3 * G.HH], [300 + 0.7 * tw, y]]; }
  if (opts.tip) extra.armsR = [sR, [300 + 1.25 * tw, sy - 0.05 * G.HH], [300 + 0.55 * G.a, G.hc - 0.75 * G.b]];
  if (opts.present !== undefined) extra.wave = opts.present;
  if (opts.case) extra.armsL = [sL, [300 - 1.12 * tw, sy + 0.45 * G.HH], [300 - 1.05 * tw, sy + 0.9 * G.HH]];
  bodyFront(p, o, { ...opts, ...extra });
  if (o.tie && opts.mode !== 'side') {
    const c = G.chin + 1 * u, hh = (opts.mode === 'sit' ? 0.3 : 0.34) * G.HH;
    p.poly([[300 - 20 * u, c], [300 + 20 * u, c], [300, c + hh]], '#f4f0e6', 2.4 * u);
    p.poly([[300 - 6 * u, c + 2 * u], [300 + 6 * u, c + 2 * u], [300 + 8 * u, c + hh * 0.8], [300, c + hh], [300 - 8 * u, c + hh * 0.8]], o.tie, 2.2 * u);
  }
  if (opts.glasses) {
    const gy = G.hc - 0.02 * G.b - (opts.glassesPop || 0) * 0.5 * G.b;
    for (const s of [-1, 1]) p.ell(300 + s * 0.36 * G.a, gy, 0.26 * G.a, 0.24 * G.a, null, 3.2 * u);
    p.stroke([[300 - 0.1 * G.a, gy], [300 + 0.1 * G.a, gy]], 3 * u);
  }
  if (opts.blush) for (const s of [-1, 1]) { p.g.globalAlpha = 0.55 * opts.blush; p.ell(300 + s * 0.52 * G.a, G.hc + 0.32 * G.b, 0.2 * G.a, 0.11 * G.b, '#ff5a6a', 0); p.g.globalAlpha = 1; }
  if (opts.shh) p.stroke([[300 + 8 * u, G.hc + 0.25 * G.b], [300 + 9 * u, G.hc + 0.62 * G.b]], 6 * u, INK), p.stroke([[300 + 8 * u, G.hc + 0.25 * G.b], [300 + 9 * u, G.hc + 0.62 * G.b]], 3.4 * u, o.skin);
  if (opts.stamp !== undefined) {
    const y = sy + (0.02 + 0.36 * opts.stamp) * G.HH, x = 300 + 0.7 * tw;
    p.poly([[x - 7 * u, y - 4 * u], [x + 7 * u, y - 4 * u], [x + 6 * u, y + 26 * u], [x - 6 * u, y + 26 * u]], '#8a5a30', 2.5 * u);
    p.poly([[x - 22 * u, y + 26 * u], [x + 22 * u, y + 26 * u], [x + 22 * u, y + 38 * u], [x - 22 * u, y + 38 * u]], '#3a2a24', 2.5 * u);
    p.poly([[x - 22 * u, y + 38 * u], [x + 22 * u, y + 38 * u], [x + 22 * u, y + 44 * u], [x - 22 * u, y + 44 * u]], '#c8243a', 2 * u);
  }
  if (opts.bag) { // money sack in the left hand
    const x = 300 - 1.15 * tw, y = sy + 1.0 * G.HH;
    p.poly(ellPts(x, y + 40 * u, 42 * u, 46 * u), '#c9a56a', 3 * u);
    p.poly([[x - 14 * u, y - 4 * u], [x + 14 * u, y - 4 * u], [x + 8 * u, y + 2 * u], [x - 8 * u, y + 2 * u]], '#b08a50', 2.5 * u);
    p.g.font = `bold ${44 * u}px Georgia`; p.g.fillStyle = '#5a3a14'; p.g.textAlign = 'center'; p.g.fillText('₣', x, y + 58 * u); p.g.textAlign = 'start';
  }
  if (opts.case) { // briefcase in the left hand
    const x = 300 - 1.05 * tw, y = sy + 0.93 * G.HH;
    p.poly([[x - 50 * u, y + 6 * u], [x + 50 * u, y + 6 * u], [x + 50 * u, y + 70 * u], [x - 50 * u, y + 70 * u]], '#6a3a1e', 3 * u);
    p.stroke([[x - 14 * u, y + 6 * u], [x - 12 * u, y - 6 * u], [x + 12 * u, y - 6 * u], [x + 14 * u, y + 6 * u]], 3.5 * u);
    p.poly([[x - 6 * u, y + 14 * u], [x + 6 * u, y + 14 * u], [x + 6 * u, y + 22 * u], [x - 6 * u, y + 22 * u]], '#d8b44a', 1.5 * u);
  }
};

/** generic placard: a.text, a.bg */
export const drawStamp = (p, t, a = {}) => {
  const g = p.g, s = 0.25 + 0.75 * Math.min(1, t * 4);
  g.save(); g.translate(250, 160); g.rotate((a.rot || -8) * Math.PI / 180); g.scale(s, s);
  g.fillStyle = '#1a1416'; g.fillRect(-212, -92, 424, 184);
  g.fillStyle = a.bg || '#2a8a4a'; g.fillRect(-200, -80, 400, 160);
  g.strokeStyle = '#fff4e0'; g.lineWidth = 8; g.strokeRect(-182, -62, 364, 124);
  g.fillStyle = '#fff4e0'; g.font = `bold ${a.fontPx || 100}px Georgia, serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(a.text || "OK", 0, 6);
  g.restore();
};
/** big green check mark that draws itself */
export const drawCheck = (p, t) => {
  const g = p.g, k = Math.min(1, t * 2.5);
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  const pts = [[70, 160], [130, 225], [240, 70]];
  const L1 = 1, L2 = 1.7, tot = L1 + L2, d = k * tot;
  const path = (lw, col) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(...pts[0]);
    if (d <= L1) g.lineTo(pts[0][0] + (pts[1][0] - pts[0][0]) * d / L1, pts[0][1] + (pts[1][1] - pts[0][1]) * d / L1);
    else { g.lineTo(...pts[1]); const e = (d - L1) / L2; g.lineTo(pts[1][0] + (pts[2][0] - pts[1][0]) * e, pts[1][1] + (pts[2][1] - pts[1][1]) * e); } g.stroke(); };
  path(54, '#141014'); path(36, '#3ac060');
  g.restore();
};
/** draw a canvas image as a card; t>0.5 tears it into flying pieces when a.tear */
export const drawImageCard = (p, t, a = {}) => {
  const g = p.g, img = a.img, W = a.w, H = a.h;
  if (!a.tear || t <= 0) { g.drawImage(img, 0, 0, W, H); g.strokeStyle = '#141014'; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6); return; }
  const n = 5;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const sx = (i / n) * img.width, sy = (j / n) * img.height, sw = img.width / n, sh = img.height / n;
    const dx = (i / n) * W, dy = (j / n) * H, dw = W / n, dh = H / n;
    const r = Math.sin(i * 12.9 + j * 78.2) * 43758.5, rr = r - Math.floor(r);
    const ox = (i - 2) * 60 * t + (rr - 0.5) * 80 * t, oy = (j - 2) * 50 * t + 120 * t * t, rot = (rr - 0.5) * 4 * t;
    g.save(); g.translate(dx + dw / 2 + ox, dy + dh / 2 + oy); g.rotate(rot); g.globalAlpha = Math.max(0, 1 - t * 0.9);
    g.drawImage(img, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh); g.restore();
  }
  g.globalAlpha = 1;
};
/** big red SOLD placard (text reads left-to-right; cards are never mirrored) */
export const drawSold = (p, t, a = {}) => {
  const g = p.g, s = 0.25 + 0.75 * Math.min(1, t * 4);
  g.save(); g.translate(250, 160); g.rotate((a.rot || -8) * Math.PI / 180); g.scale(s, s);
  g.fillStyle = '#1a1416'; g.fillRect(-212, -92, 424, 184);
  g.fillStyle = '#d42a36'; g.fillRect(-200, -80, 400, 160);
  g.strokeStyle = '#fff4e0'; g.lineWidth = 8; g.strokeRect(-182, -62, 364, 124);
  g.fillStyle = '#fff4e0'; g.font = 'bold 112px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SOLD', 0, 6);
  g.restore();
};

export const newPen = (g) => new Pen(g);
