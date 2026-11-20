// Cast for "The Man Who Sold the Eiffel Tower" (Paris, 1925). Drawn with the Pen API from toonbase.js
// on the 600x1000 design canvas (soles at y = 975).
import { Pen, INK, SKINS, bodyFront, headGeom, mul, shade, rad, ellPts, fxPuff, fxBurst, fxStars } from './toonbase.js';
export { fxPuff, fxBurst, fxStars };

export const OUTFITS = {
  lustig: { tie: '#9a1e2e', jacket: '#2b2f45', pants: '#24263a', boots: '#1a1a1e', hat: 'tophat', belt: null, buttons: '#d8b44a', skin: SKINS[1], moustache: '#2a1e1a' },
  poisson: { tie: '#2e5a3a', jacket: '#7a5a3a', pants: '#5a4430', boots: '#3a2a20', hat: 'bowler', cap: '#3a2e28', belt: null, buttons: '#c8a050', skin: SKINS[0], moustache: '#6a4a30', build: 'stout' },
  d1: { tie: '#3a2a5a', jacket: '#6f7378', pants: '#4a4c52', boots: '#2a2a2a', hat: 'bowler', cap: '#232022', belt: null, buttons: '#c0c0c0', skin: SKINS[2], moustache: '#5a5a5a' },
  d2: { tie: '#7a3a20', jacket: '#4f6b4a', pants: '#3a4a36', boots: '#3a2a20', hat: 'cap', cap: '#6a5038', belt: null, buttons: '#c8a050', skin: SKINS[3] },
  d3: { tie: '#9a7a2a', jacket: '#3a4a6a', pants: '#2a3348', boots: '#22222a', hat: 'bowler', cap: '#4a3a2a', belt: null, buttons: '#c8a050', skin: SKINS[0], moustache: '#8a6a4a', build: 'stout' },
  d4: { tie: '#2a4a6a', jacket: '#a08a60', pants: '#6a5a40', boots: '#3a2a20', hat: 'cap', cap: '#5a5a5a', belt: null, buttons: '#8a6a3a', skin: SKINS[1] },
  n1: { tie: '#d8b44a', jacket: '#6a3a3a', pants: '#4a2a2a', boots: '#2a1a1a', hat: 'bowler', cap: '#2a2222', belt: null, buttons: '#c8a050', skin: SKINS[1], moustache: '#3a2a2a', build: 'stout' },
  n2: { tie: '#8a2a2a', jacket: '#4a6a7a', pants: '#34505c', boots: '#2a2a2a', hat: 'cap', cap: '#3a4a5a', belt: null, buttons: '#c0c0c0', skin: SKINS[0] },
  n3: { tie: '#2a2a4a', jacket: '#7a7a4a', pants: '#5a5a36', boots: '#3a2a20', hat: 'bowler', cap: '#3a3020', belt: null, buttons: '#c8a050', skin: SKINS[3], moustache: '#2a2a2a' },
  n4: { tie: '#e0e0e0', jacket: '#8a5a7a', pants: '#5a3a50', boots: '#2a1a24', hat: 'bowler', cap: '#2a2028', belt: null, buttons: '#c8a050', skin: SKINS[2] },
  gendarme: { jacket: '#2a3a6a', pants: '#26304a', boots: '#15151a', hat: 'cap', cap: '#2a3a6a', belt: '#e8e6dc', buttons: '#d8d8e0', skin: SKINS[0], moustache: '#4a3020' },
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
