// Cast for "The Pig War" (San Juan Island, 1859). Pen API from toonbase.js, 600x1000 design canvas (soles at y = 975).
import { Pen, INK, SKINS, bodyFront, headGeom, mul, shade, rad, ellPts, fxPuff, fxBurst, fxStars } from './toonbase.js';
export { fxPuff, fxBurst, fxStars };

export const OUTFITS = {
  eng: { jacket: '#e8862a', pants: '#3a4a6a', boots: '#3a2a1e', hat: 'cap', cap: '#f2c230', buttons: '#3a2a1e', skin: SKINS[1], moustache: '#6a4a2a', build: 'stout' },
  off1: { jacket: '#5a7aa8', pants: '#3a3a44', boots: '#2a2228', hat: 'hair', hair: '#7a4a2a', buttons: '#e8e8e8', skin: SKINS[0] },
  off2: { jacket: '#8a6a3a', pants: '#4a3a30', boots: '#2a2228', hat: 'cap', cap: '#f2c230', buttons: '#3a2a1e', skin: SKINS[2] },
  c1: { jacket: '#c84a6a', pants: '#3a4a7a', boots: '#3a2a1e', hat: 'hair', hair: '#d8a040', skin: SKINS[0] },
  c2: { jacket: '#4a9a7a', pants: '#5a4a3a', boots: '#3a2a1e', hat: 'hair', hair: '#3a2a20', skin: SKINS[3], moustache: '#2a1e18' },
  c3: { jacket: '#e0b040', pants: '#6a3a2a', boots: '#3a2a1e', hat: 'bonnet', dress: '#e0b040', skin: SKINS[1] },
  c4: { jacket: '#7a5ac0', pants: '#3a3a44', boots: '#2a2228', hat: 'hair', hair: '#a8501e', skin: SKINS[2] },
  c5: { jacket: '#3a6ab0', pants: '#c8b890', boots: '#3a2a1e', hat: 'bowler', cap: '#3a3030', skin: SKINS[1] },
  owner: { jacket: '#b84a3a', pants: '#3a3a44', boots: '#2a2228', hat: 'hair', hair: '#5a3a24', buttons: '#e8c45a', skin: SKINS[1], moustache: '#5a3a24' },
};

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
  if (opts.chunk !== undefined) { const k = opts.chunk; extra.armsR = [sR, [300 + 1.35 * tw, sy + 0.2 * G.HH - 0.2 * G.HH * k], [300 + 0.9 * tw - 0.5 * tw * k, sy + 0.25 * G.HH - 0.5 * G.HH * k]]; }
  if (opts.stir !== undefined) { const k = Math.sin(opts.stir * Math.PI * 2); extra.armsR = [sR, [300 + 1.35 * tw, sy + 0.3 * G.HH], [300 + 1.6 * tw + 20 * u * k, sy + 0.55 * G.HH]]; }
  bodyFront(p, oo, { ...opts, ...extra });
  if (opts.chunk !== undefined) { const k = opts.chunk, hx = 300 + 0.9 * tw - 0.5 * tw * k, hy = sy + 0.25 * G.HH - 0.5 * G.HH * k; drawMeatAt(p, hx, hy - 8 * u, 0.22 * u); }
  if (opts.stir !== undefined) { const k = Math.sin(opts.stir * Math.PI * 2), hx = 300 + 1.6 * tw + 20 * u * k, hy = sy + 0.55 * G.HH; p.band([[hx - 4 * u, hy - 30 * u], [hx + 12 * u, hy + 90 * u]], '#8a5a30', 5 * u, 1.5 * u, 'round'); }
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

/** cartoon chunk of meat centred at (x, y), scale s (design units ~ 200 px chunk at s = 1) */
export const drawMeatAt = (p, x, y, s = 1, rot = 0) => {
  const g = p.g; g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  p.poly([[-70, -30], [-40, -62], [20, -66], [66, -36], [72, 18], [40, 58], [-20, 64], [-66, 34]], '#d8606a', 10);
  g.strokeStyle = '#f6e0d0'; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(-44, -20); g.quadraticCurveTo(0, -40, 40, -10); g.quadraticCurveTo(10, 20, -30, 30); g.stroke();
  p.ell(-30, -38, 14, 8, '#f09aa0', 0);
  g.restore();
};
/** falling chunk, 200 x 200 */
export const drawMeat = (p, t, a = {}) => drawMeatAt(p, 100, 100, 1, a.rot || 0);
/** thought bubble with a sheep or a deer, 300 x 300 */
export const drawBubble = (p, t, a = {}) => {
  const g = p.g, k = Math.min(1, Math.max(0, t)); if (k <= 0) return;
  g.save(); g.translate(150, 150); g.scale(0.3 + 0.7 * k, 0.3 + 0.7 * k); g.translate(-150, -150);
  p.ell(60, 270, 14, 12, '#ffffff', 5); p.ell(90, 238, 22, 18, '#ffffff', 5);
  p.ell(170, 120, 118, 100, '#ffffff', 7);
  if (a.icon === 'sheep') { for (const [x, y] of [[130, 100], [170, 85], [210, 100], [140, 140], [190, 140], [220, 125]]) p.ell(x, y, 34, 30, '#f4f0e8', 5); p.ell(118, 128, 30, 36, '#3a3440', 5); p.dot(110, 120, 6, '#ffffff'); p.ell(100, 104, 14, 8, '#3a3440', 4); }
  else if (a.icon === 'gull') { // seagulls happily eating tiny bits
    for (const [x, y, sc] of [[120, 140, 1], [215, 125, 0.9]]) { p.ell(x, y, 30 * sc, 24 * sc, '#ffffff', 5); p.ell(x + 22 * sc, y - 26 * sc, 18 * sc, 16 * sc, '#ffffff', 5); p.poly([[x + 34 * sc, y - 28 * sc], [x + 56 * sc, y - 22 * sc], [x + 36 * sc, y - 18 * sc]], '#f2b030', 3); p.dot(x + 24 * sc, y - 30 * sc, 4); }
    for (const [x, y] of [[150, 175], [175, 185], [200, 172], [240, 180], [95, 178]]) p.ell(x, y, 9, 7, '#f0e2c8', 3); }
  else { p.ell(170, 135, 44, 52, '#a8743a', 6); for (const s of [-1, 1]) { p.stroke([[170 + s * 25, 90], [170 + s * 50, 40], [170 + s * 80, 30]], 7, '#6a4a2a'); p.stroke([[170 + s * 42, 55], [170 + s * 30, 35]], 6, '#6a4a2a'); p.ell(170 + s * 50, 100, 18, 10, '#a8743a', 5); }
    p.ell(170, 170, 22, 16, '#e8c8a0', 4); p.dot(170, 160, 7); for (const s of [-1, 1]) p.dot(170 + s * 18, 125, 6); }
  g.restore();
};
/** cartoon vulture, 400 x 300 canvas. a: ph (wing flap 0..1), expr ('grin'|'shock'|'sick'|'relief'), puke (0..1) */
export const drawVulture = (p, t, a = {}) => {
  const g = p.g, ph = (a.ph || 0) * Math.PI * 2, up = Math.sin(ph), cx = 200, cy = 170;
  for (const s of [-1, 1]) { // wings
    const tipY = cy - 90 * up, tipX = cx + s * 190;
    p.poly([[cx + s * 30, cy - 20], [cx + s * 110, cy - 50 - 50 * up], [tipX, tipY], [cx + s * 170, tipY + 30], [cx + s * 150, tipY + 40], [cx + s * 125, tipY + 45], [cx + s * 40, cy + 30]], '#2a2430', 7);
    for (const f of [0.55, 0.75]) p.stroke([[cx + s * 60, cy + 10], [cx + s * 190 * f, tipY + 40 - 10 * f]], 4, '#5a5260'); }
  p.ell(cx, cy + 20, 58, 66, '#3a3240', 7);
  p.ell(cx, cy - 34, 50, 18, '#f4ece0', 5); // white ruff
  const hy = cy - 78; p.ell(cx, hy, 42, 40, '#e88a8a', 7);
  p.poly([[cx - 12, hy + 14], [cx + 14, hy + 14], [cx + 10, hy + 44], [cx, hy + 54], [cx - 4, hy + 40]], '#e8d070', 5);
  const e = a.expr || 'grin';
  if (e === 'shock') { for (const s of [-1, 1]) { p.ell(cx + s * 18, hy - 8, 12, 15, '#ffffff', 4); p.dot(cx + s * 18, hy - 6, 5); } }
  else if (e === 'sick') { for (const s of [-1, 1]) p.stroke([[cx + s * 26, hy - 14], [cx + s * 10, hy - 6], [cx + s * 26, hy + 2]], 4); p.ell(cx - 34, hy + 10, 12, 10, '#b8dc90', 0); p.ell(cx + 34, hy + 10, 12, 10, '#b8dc90', 0); }
  else { for (const s of [-1, 1]) { p.dot(cx + s * 18, hy - 8, 7); p.stroke([[cx + s * 30, hy - 22], [cx + s * 8, hy - 18]], 4); } }
  for (const s of [-1, 1]) p.stroke([[cx + s * 18, cy + 80], [cx + s * 22, cy + 110]], 5, '#e8d070');
};
/** vomit stream of chunks out of a beak at the top, 300 x 500. t = 0..1 */
export const drawPuke = (p, t) => {
  const k = Math.min(1, Math.max(0, t));
  for (let i = 0; i < 9; i++) { const d = (i / 9) * k; if (d <= 0) continue; const y = 30 + 440 * d, x = 150 + 30 * Math.sin(i * 1.7);
    drawMeatAt(p, x, y, 0.22 + 0.12 * ((i * 7) % 3) / 2, i * 0.9); }
  p.ell(150, 20, 26, 14, '#c8a868', 4);
};
/** speed lines, 400 x 300 */
export const drawSpeed = (p, t) => { for (let i = 0; i < 6; i++) { const y = 40 + i * 44, l = 120 + 80 * ((i * 5) % 3); p.stroke([[380 - l * t, y], [380, y]], 8, '#ffffff'); } };
/** soap bubble, 200 x 200 */
export const drawSoap = (p) => { p.ell(100, 100, 70, 70, '#d8f0ff', 6); p.ell(76, 74, 16, 10, '#ffffff', 0, 0, 360, -30); };

/** blubber chunk, 200 x 200: grey skin on one side, pale fat */
export const drawBlubAt = (p, x, y, s = 1, rot = 0) => {
  const g = p.g; g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  p.poly([[-72, -24], [-44, -60], [18, -64], [68, -34], [74, 20], [42, 56], [-22, 62], [-66, 30]], '#f0e2c8', 10);
  p.poly([[-72, -24], [-44, -60], [18, -64], [68, -34], [40, -26], [-20, -30]], '#6a7488', 8);
  p.ell(10, 20, 16, 10, '#f8eedc', 0); p.ell(-34, 14, 9, 6, '#e0ccaa', 0);
  g.restore();
};
export const drawBlub = (p, t, a = {}) => drawBlubAt(p, 100, 100, 1, a.rot || 0);
/** cartoon seagull, 400 x 300. a: ph (flap 0..1), expr ('shock') */
export const drawGull = (p, t, a = {}) => {
  const ph = (a.ph || 0) * Math.PI * 2, up = Math.sin(ph), cx = 200, cy = 170;
  for (const s of [-1, 1]) { const tipY = cy - 80 * up, tipX = cx + s * 185;
    p.poly([[cx + s * 25, cy - 10], [cx + s * 105, cy - 40 - 45 * up], [tipX, tipY], [cx + s * 150, tipY + 26], [cx + s * 30, cy + 26]], '#f4f4f0', 7);
    p.poly([[tipX, tipY], [cx + s * 150, tipY + 26], [cx + s * 135, tipY + 6]], '#2a2a30', 5); }
  p.ell(cx, cy + 12, 48, 40, '#ffffff', 7);
  const hy = cy - 40; p.ell(cx, hy, 36, 32, '#ffffff', 7);
  p.poly([[cx - 10, hy + 10], [cx + 12, hy + 10], [cx + 4, hy + 38]], '#f2b030', 5);
  if (a.expr === 'shock') { for (const s of [-1, 1]) { p.ell(cx + s * 15, hy - 6, 10, 13, '#ffffff', 4); p.dot(cx + s * 15, hy - 4, 5); } }
  else for (const s of [-1, 1]) p.dot(cx + s * 15, hy - 6, 6);
  for (const s of [-1, 1]) p.stroke([[cx + s * 14, cy + 50], [cx + s * 18, cy + 74]], 5, '#f2b030');
};
/** wavy green stink line, 200 x 400; t = life 0..1 (fades in and out by thickness) */
export const drawStink = (p, t) => {
  const k = Math.sin(Math.PI * Math.min(1, Math.max(0, t))); if (k < 0.05) return;
  const g = p.g; g.lineCap = 'round';
  for (const [dx, ph] of [[-40, 0], [40, 1.7]]) { const pts = []; for (let i = 0; i <= 16; i++) pts.push([100 + dx + 22 * Math.sin(i * 0.8 + ph + t * 6), 380 - i * 22]);
    g.strokeStyle = '#241726'; g.lineWidth = 18 * k; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    g.strokeStyle = '#9ccf5a'; g.lineWidth = 9 * k; g.stroke(); }
};
