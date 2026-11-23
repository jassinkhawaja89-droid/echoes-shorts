// Cast for "The Pig War" (San Juan Island, 1859). Pen API from toonbase.js, 600x1000 design canvas (soles at y = 975).
import { Pen, INK, SKINS, bodyFront, headGeom, mul, shade, rad, ellPts, fxPuff, fxBurst, fxStars } from './toonbase.js';
export { fxPuff, fxBurst, fxStars };

export const OUTFITS = {
  judge: { jacket: '#a8282e', pants: '#3a2430', boots: INK, hat: 'cap', cap: '#a8282e', dress: '#a8282e', buttons: '#e8c45a', skin: SKINS[0], moustache: '#e8e4dc', build: 'stout' },
  lawyer: { jacket: '#2a2430', pants: '#2a2430', boots: INK, hat: 'cap', cap: '#2a2430', dress: '#2a2430', skin: SKINS[1], moustache: '#4a3020' },
  priest: { jacket: '#5a4a3a', pants: '#3a3040', boots: '#3a2a1e', hat: 'hair', hair: '#9a9a9a', dress: '#5a4a3a', skin: SKINS[2] },
  wife1: { jacket: '#5a8fc2', pants: '#3a3040', boots: '#3a2a1e', hat: 'bonnet', dress: '#5a8fc2', skin: SKINS[1] },
  wife2: { jacket: '#d9a441', pants: '#3a3040', boots: '#3a2a1e', hat: 'bonnet', dress: '#d9a441', skin: SKINS[2] },
  man1: { jacket: '#8a5a34', pants: '#4a5a3a', boots: '#3a2a1e', hat: 'slouch', cap: '#6a5a3a', buttons: '#4a3020', skin: SKINS[1], moustache: '#6a4428' },
  man2: { jacket: '#4a6a8a', pants: '#6a4a3a', boots: '#2a1e16', hat: 'hair', hair: '#8a5a2a', buttons: '#2a3040', skin: SKINS[0] },
  man3: { jacket: '#7a3a5a', pants: '#3a3a44', boots: '#2a1e16', hat: 'cap', cap: '#3a6a4a', buttons: '#e8c45a', skin: SKINS[3] },
  farmer: { jacket: '#6a7a3a', pants: '#5a4a3a', boots: '#3a2a1e', hat: 'slouch', cap: '#b8984a', buttons: '#3a2a1e', skin: SKINS[1], moustache: '#7a5030' },
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
  if (opts.gavel !== undefined) { const k = opts.gavel; extra.armsR = [sR, [300 + 1.4 * tw, sy + 0.1 * G.HH - 0.2 * G.HH * k], [300 + 1.3 * tw + 10 * u, sy - 0.15 * G.HH - 0.45 * G.HH * k]]; }
  bodyFront(p, oo, { ...opts, ...extra });
  if (opts.gavel !== undefined) { const k = opts.gavel, hx = 300 + 1.3 * tw + 10 * u, hy = sy - 0.15 * G.HH - 0.45 * G.HH * k;
    p.stroke([[hx, hy + 6 * u], [hx + 8 * u, hy - 34 * u]], 4 * u, '#7a4b2a');
    p.poly([[hx - 10 * u, hy - 50 * u], [hx + 30 * u, hy - 42 * u], [hx + 27 * u, hy - 24 * u], [hx - 13 * u, hy - 32 * u]], '#8a5a30', 2 * u); }
  if (opts.cheer !== undefined && opts.mug) { const k = opts.cheer, hx = 300 + 1.4 * tw + 10 * u, hy = sy - 0.35 * G.HH - 0.35 * G.HH * k; p.poly([[hx - 9 * u, hy - 22 * u], [hx + 9 * u, hy - 22 * u], [hx + 8 * u, hy + 4 * u], [hx - 8 * u, hy + 4 * u]], '#e8b030', 2 * u); p.ell(hx, hy - 22 * u, 10 * u, 5 * u, '#fbf6e8', 2 * u); }
  if (opts.instr === 'drum') { const hx = 300, hy = sy + 0.95 * G.HH; p.ell(hx, hy + 22 * u, 30 * u, 10 * u, '#c8282e', 2 * u); p.poly([[hx - 30 * u, hy], [hx + 30 * u, hy], [hx + 30 * u, hy + 22 * u], [hx - 30 * u, hy + 22 * u]], '#c8282e', 2 * u); p.ell(hx, hy, 30 * u, 10 * u, '#f4ead0', 2 * u); const k = opts.beat || 0; p.stroke([[hx + 30 * u, hy - 30 * u + 20 * u * k], [hx + 8 * u, hy - 4 * u]], 2.5 * u, '#7a5232'); }
  if (opts.instr === 'fiddle') { const hx = 300 + 0.6 * tw, hy = sy + 0.1 * G.HH; p.ell(hx, hy, 12 * u, 18 * u, '#a8642a', 2 * u, 0, 360, -40); p.stroke([[hx + 8 * u, hy - 12 * u], [hx + 26 * u, hy - 32 * u]], 3 * u, '#5a3a1e'); const k = opts.beat || 0; p.stroke([[hx - 26 * u + 10 * u * k, hy + 22 * u], [hx + 22 * u + 10 * u * k, hy - 8 * u]], 1.6 * u, '#e8d8b0'); }
  if (opts.instr === 'horn') { const hx = 300 + 0.3 * tw, hy = G.chin - 0.28 * G.HH; p.poly([[hx, hy - 3 * u], [hx + 40 * u, hy - 8 * u], [hx + 52 * u, hy - 18 * u], [hx + 52 * u, hy + 14 * u], [hx + 40 * u, hy + 6 * u], [hx, hy + 3 * u]], '#e8b830', 2 * u); }
  if (opts.paper) { const hx = 300 - 1.0 * tw, hy = sy + 0.75 * G.HH; p.poly([[hx - 16 * u, hy - 22 * u], [hx + 16 * u, hy - 20 * u], [hx + 14 * u, hy + 20 * u], [hx - 17 * u, hy + 18 * u]], '#f4efe0', 2 * u); for (let i = 0; i < 4; i++) p.stroke([[hx - 10 * u, hy - 12 * u + i * 8 * u], [hx + 9 * u, hy - 11 * u + i * 8 * u]], 1.5 * u); }
};

/** cartoon bear standing upright, front view, on the 600 x 1000 canvas (feet at y 975).
 * opts: expr (happy/grin/sad/shock/proud), cap, mug (0..1 raise), crate (carried above head), shell (held in arms), salute (0..1), bottle, walk (phase), cub */
export const drawBear = (p, opts = {}) => {
  const g = p.g, fur = '#8a5630', dk = '#5e3a20', belly = '#c99a68', muz = '#e2c49a';
  const ph = (opts.walk || 0) * Math.PI * 2, bob = opts.walk !== undefined ? Math.abs(Math.sin(ph)) * 10 : 0;
  const bx = 300, by = 700 - bob, hx = 300, hy = 430 - bob;
  // legs
  for (const s of [-1, 1]) { const lift = opts.walk !== undefined ? Math.max(0, Math.sin(ph + (s > 0 ? Math.PI : 0))) * 22 : 0;
    p.ell(bx + s * 70, 905 - lift, 52, 72, fur, 8); p.ell(bx + s * 78, 962 - lift, 56, 20, dk, 7); }
  // arms behind for crate (raised)
  const arm = (pts) => { g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 62; g.beginPath(); g.moveTo(...pts[0]); g.quadraticCurveTo(...pts[1], ...pts[2]); g.stroke(); g.strokeStyle = fur; g.lineWidth = 48; g.stroke(); p.ell(pts[2][0], pts[2][1], 30, 28, dk, 7); };
  if (opts.crate) { arm([[bx - 120, by - 120], [bx - 175, by - 280], [bx - 120, hy - 190]]); arm([[bx + 120, by - 120], [bx + 175, by - 280], [bx + 120, hy - 190]]); }
  // body
  p.ell(bx, by, 175, 230, fur, 9);
  p.ell(bx, by + 30, 112, 160, belly, 0);
  // head
  for (const s of [-1, 1]) { p.ell(hx + s * 105, hy - 105, 46, 46, fur, 8); p.ell(hx + s * 105, hy - 105, 24, 24, belly, 0); }
  p.ell(hx, hy, 140, 125, fur, 9);
  p.ell(hx, hy + 52, 66, 50, muz, 6);
  p.ell(hx, hy + 26, 24, 16, INK, 0);
  const e = opts.expr || 'happy';
  if (e === 'shock') { for (const s of [-1, 1]) { p.ell(hx + s * 50, hy - 30, 20, 24, '#ffffff', 5); p.dot(hx + s * 50 + 2, hy - 26, 8); } p.ell(hx, hy + 76, 16, 18, '#5a1e2a', 5); }
  else if (e === 'sad') { for (const s of [-1, 1]) { p.dot(hx + s * 50, hy - 24, 10); p.stroke([[hx + s * 30, hy - 58], [hx + s * 70, hy - 48]], 6); } p.arc(hx, hy + 90, 22, 12, 200, 340, 6); }
  else { const closed = e === 'grin' || e === 'proud'; for (const s of [-1, 1]) { if (closed) p.arc(hx + s * 50, hy - 22, 16, 12, 200, 340, 7); else p.dot(hx + s * 50, hy - 24, 11); }
    p.arc(hx, hy + 56, 30, 22, 20, 160, 6); if (e === 'grin') p.ell(hx, hy + 76, 18, 10, '#c8505a', 4); }
  if (opts.blink && e !== 'grin' && e !== 'proud') for (const s of [-1, 1]) { p.ell(hx + s * 50, hy - 24, 16, 14, fur, 0); p.stroke([[hx + s * 50 - 14, hy - 24], [hx + s * 50 + 14, hy - 24]], 5); }
  if (opts.cap) { // khaki field cap, sits low between the ears
    p.poly([[hx - 92, hy - 70], [hx - 70, hy - 132], [hx + 60, hy - 140], [hx + 96, hy - 72], [hx + 20, hy - 60]], '#5e5a36', 7);
    p.ell(hx - 40, hy - 100, 12, 12, '#e8c45a', 4);
  }
  // front arms
  if (opts.crate) { // crate held above the head
    const cy = hy - 250; p.poly([[bx - 150, cy - 70], [bx + 150, cy - 70], [bx + 150, cy + 70], [bx - 150, cy + 70]], '#a8784a', 8);
    p.stroke([[bx - 150, cy], [bx + 150, cy]], 5); p.stroke([[bx - 75, cy - 70], [bx - 75, cy + 70]], 4); p.stroke([[bx + 75, cy - 70], [bx + 75, cy + 70]], 4);
    for (const s of [-1, 1]) p.ell(bx + s * 150, cy + 40, 30, 28, dk, 7);
  } else if (opts.shell) { // artillery shell hugged diagonally
    g.save(); g.translate(bx + 10, by - 60); g.rotate(-0.22);
    p.poly([[-48, 150], [48, 150], [48, -80], [30, -150], [0, -190], [-30, -150], [-48, -80]], '#d4a84a', 8); p.poly([[-48, -80], [48, -80], [30, -150], [0, -190], [-30, -150]], '#8a8e96', 7); p.poly([[-52, 150], [52, 150], [52, 180], [-52, 180]], '#a8782a', 7); p.stroke([[-48, 110], [48, 110]], 5);
    g.restore();
    arm([[bx - 140, by - 120], [bx - 100, by + 10], [bx + 40, by + 20]]); arm([[bx + 140, by - 120], [bx + 150, by - 20], [bx + 60, by - 110]]);
  } else {
    const ar = (s, k, up) => arm([[bx + s * 135, by - 130], [bx + s * (190 + 10 * k), by - 30 - 120 * up], [bx + s * (170 - 40 * up), by + 70 - 330 * up]]);
    if (opts.salute !== undefined) { ar(-1, 0, 0); const k = opts.salute; arm([[bx + 135, by - 130], [bx + 230, by - 120 - 120 * k], [bx + 170 - 40 * k, hy + 40 - 100 * k]]); }
    else if (opts.mug !== undefined) { ar(-1, 0, 0); const k = opts.mug; const ex = bx + 170 - 40 * k, ey = by + 70 - 330 * k; ar(1, 1, k);
      p.poly([[ex - 40, ey - 100], [ex + 40, ey - 100], [ex + 36, ey + 10], [ex - 36, ey + 10]], '#e8b030', 7); p.ell(ex, ey - 100, 44, 20, '#fbf6e8', 6); p.ell(ex, ey - 20, 30, 28, dk, 7); }
    else if (opts.bottle) { ar(-1, 0, 0.55); ar(1, 0, 0.55); p.poly([[hx - 20, hy + 70], [hx + 20, hy + 70], [hx + 26, hy + 190], [hx - 26, hy + 190]], '#f4f4f0', 6); p.ell(hx, hy + 66, 12, 18, '#d8a070', 5); }
    else { ar(-1, 0, 0); ar(1, 0, 0); }
  }
};

/** circular company badge: bear carrying a shell, revealed by t (0..1), 600 x 600 */
export const drawEmblem = (p, t) => {
  const g = p.g, k = Math.min(1, Math.max(0, t));
  g.save(); g.translate(300, 300); g.scale(0.4 + 0.6 * k, 0.4 + 0.6 * k); g.rotate((1 - k) * -0.6); g.translate(-300, -300);
  p.ell(300, 300, 260, 260, '#2a3a5a', 12); p.ell(300, 300, 225, 225, '#f4ead0', 8);
  g.save(); g.translate(300, 330); g.scale(0.42, 0.42); g.translate(-300, -560); drawBear(p, { shell: true, expr: 'proud' }); g.restore();
  g.restore();
};
/** unrolled prescription scroll, 600 x 400 */
export const drawScroll = (p, t) => {
  const g = p.g, k = Math.min(1, Math.max(0, t)), h = 40 + 280 * k;
  p.poly([[70, 40], [530, 40], [530, 40 + h], [70, 40 + h]], '#f2e6c4', 8);
  p.ell(300, 40, 240, 22, '#d8c49a', 7); p.ell(300, 40 + h, 240, 22, '#d8c49a', 7);
  if (k > 0.8) { g.fillStyle = '#7a1e1e'; g.font = 'bold italic 78px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MORE', 300, 140); g.fillText('DANCING', 300, 240); }
};
/** musical note, 200 x 200 */
export const drawNote = (p) => { p.ell(80, 140, 34, 26, INK, 0, 0, 360, -20); p.stroke([[110, 135], [110, 30], [160, 55]], 12); };
/** heat wiggle above a head, 300 x 300 */
export const drawHeat = (p, t) => { const g = p.g; g.strokeStyle = '#e8502a'; g.lineWidth = 12; g.lineCap = 'round'; for (const x of [90, 150, 210]) { g.beginPath(); for (let y = 260; y > 40; y -= 10) g.lineTo(x + 14 * Math.sin(y / 22 + t * 6.3 + x), y); g.stroke(); } };

/** official stamp splat on paper, 300 x 300 */
export const drawStampMark = (p, t) => { const g = p.g; p.poly([[30, 40], [270, 30], [275, 270], [25, 262]], '#f4efe0', 6); if (t > 0.3) { g.strokeStyle = '#b82a2a'; g.lineWidth = 10; g.beginPath(); g.arc(150, 150, 70, 0, 6.3); g.stroke(); g.fillStyle = '#b82a2a'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PTE', 150, 152); } };

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

/** cartoon rat standing on its hind legs, 300 x 400 canvas, feet at y 390.
 * a: expr (happy/scared/sly/chew), pose ('stand'|'eat'|'peek'), ph (tail/chew phase), col */
export const drawRat = (p, t, a = {}) => {
  const g = p.g, fur = a.col || '#8a8494', dk = '#5e5868', pink = '#f0a0a8', ph = (a.ph || 0) * Math.PI * 2;
  const bx = 150, by = 285, hx = 150, hy = a.pose === 'peek' ? 205 : 165;
  // tail
  g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 13; g.beginPath(); g.moveTo(bx + 30, 360);
  g.bezierCurveTo(bx + 120, 380, bx + 140 + 15 * Math.sin(ph), 300, bx + 110 + 25 * Math.sin(ph + 1), 250); g.stroke();
  g.strokeStyle = pink; g.lineWidth = 7; g.stroke();
  if (a.pose !== 'peek') { for (const s of [-1, 1]) p.ell(bx + s * 32, 378, 26, 12, pink, 4); p.ell(bx, by, 62, 90, fur, 6); p.ell(bx, by + 18, 38, 58, '#c8c2cc', 0); }
  else p.ell(bx, by + 30, 70, 80, fur, 6);
  // ears
  for (const s of [-1, 1]) { p.ell(hx + s * 52, hy - 50, 38, 38, fur, 6); p.ell(hx + s * 52, hy - 50, 22, 22, pink, 0); }
  // head (pear with snout pointing down)
  p.poly([[hx - 62, hy - 30], [hx - 50, hy - 62], [hx, hy - 72], [hx + 50, hy - 62], [hx + 62, hy - 30], [hx + 30, hy + 40], [hx, hy + 62], [hx - 30, hy + 40]], fur, 6);
  p.ell(hx, hy + 60, 12, 10, pink, 4);
  for (const s of [-1, 1]) for (const k of [-1, 0, 1]) p.stroke([[hx + s * 18, hy + 50 + k * 6], [hx + s * 60, hy + 42 + k * 12]], 2.5);
  const e = a.expr || 'happy';
  if (e === 'scared') { for (const s of [-1, 1]) { p.ell(hx + s * 24, hy - 14, 15, 19, '#ffffff', 4); p.dot(hx + s * 24, hy - 10, 6); } p.ell(hx, hy + 80, 9, 8, '#5a1e2a', 3); p.ell(hx + 56, hy - 30, 5, 8, '#9fd4ff', 2); }
  else if (e === 'sly') { for (const s of [-1, 1]) { p.dot(hx + s * 24, hy - 10, 8); p.stroke([[hx + s * 10, hy - 22], [hx + s * 38, hy - 18]], 4); } p.arc(hx, hy + 70, 16, 10, 20, 160, 4); }
  else { for (const s of [-1, 1]) { if (a.blink) p.stroke([[hx + s * 24 - 9, hy - 12], [hx + s * 24 + 9, hy - 12]], 4); else p.dot(hx + s * 24, hy - 12, 9); p.dot(hx + s * 24 + 3, hy - 15, 3, '#ffffff'); } p.arc(hx, hy + 70, 16, 10, 20, 160, 4); }
  // teeth
  p.poly([[hx - 7, hy + 70], [hx + 7, hy + 70], [hx + 7, hy + 82], [hx - 7, hy + 82]], '#ffffff', 2.5);
  // arms / props
  if (a.pose === 'eat') { const c = Math.sin(ph * 3); // barley ear held to the mouth
    p.stroke([[hx - 6, hy + 150], [hx + 2, hy + 70]], 5, '#c8a040');
    for (let i = 0; i < 5; i++) p.ell(hx + 6 + (i % 2 ? 8 : -8), hy + 60 - i * 13 + 3 * c, 7, 11, '#e8c45a', 2.5);
    for (const s of [-1, 1]) p.ell(hx + s * 16, hy + 108 + 4 * c, 14, 12, fur, 4);
  } else if (a.pose === 'peek') { for (const s of [-1, 1]) p.ell(hx + s * 40, hy + 92, 18, 14, fur, 4); }
  else { const up = a.wave || 0; p.ell(bx - 54, by - 22, 14, 22, fur, 4); p.ell(bx + 54 + 8 * up, by - 22 - 50 * up, 14, 22, fur, 4); }
};

/** cartoon cat sitting, 400 x 400 canvas, base at y 390. a: col, ph (tail), expr ('sly'|'lick'|'grin'), lick (0..1) */
export const drawCat = (p, t, a = {}) => {
  const g = p.g, fur = a.col || '#e08a3a', dk = a.dk || '#a85a22', ph = (a.ph || 0) * Math.PI * 2, bx = 200, hx = 200, hy = 150;
  g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 30; g.beginPath(); g.moveTo(bx + 60, 370);
  g.bezierCurveTo(bx + 170, 380, bx + 160 + 30 * Math.sin(ph), 260, bx + 130 + 40 * Math.sin(ph + 0.8), 200); g.stroke();
  g.strokeStyle = fur; g.lineWidth = 20; g.stroke();
  p.ell(bx, 300, 95, 95, fur, 7);
  p.ell(bx, 310, 50, 70, '#fbeedc', 0);
  for (const s of [-1, 1]) p.ell(bx + s * 40, 378, 32, 16, fur, 6);
  for (const s of [-1, 1]) { p.poly([[hx + s * 30, hy - 60], [hx + s * 88, hy - 120], [hx + s * 90, hy - 30]], fur, 7); p.poly([[hx + s * 42, hy - 62], [hx + s * 78, hy - 98], [hx + s * 80, hy - 46]], '#f0a0a8', 0); }
  p.ell(hx, hy, 100, 82, fur, 7);
  for (const k of [-1, 0, 1]) p.stroke([[hx + k * 22, hy - 80], [hx + k * 18, hy - 56]], 7, dk);
  p.poly([[hx - 12, hy + 14], [hx + 12, hy + 14], [hx, hy + 26]], '#e86a7a', 3);
  for (const s of [-1, 1]) for (const k of [-1, 1]) p.stroke([[hx + s * 30, hy + 22 + k * 5], [hx + s * 96, hy + 14 + k * 14]], 3);
  const e = a.expr || 'sly';
  if (e === 'lick') { for (const s of [-1, 1]) p.arc(hx + s * 38, hy - 10, 18, 12, 200, 340, 6); const k = a.lick || 0;
    p.ell(hx, hy + 46, 14, 12 + 8 * k, '#e86a7a', 3); p.ell(hx + 34, hy + 70 - 20 * k, 26, 24, fur, 6); }
  else { for (const s of [-1, 1]) { p.ell(hx + s * 38, hy - 12, 22, 18, '#d8e86a', 5); p.ell(hx + s * 38, hy - 12, 5, 15, INK, 0); p.stroke([[hx + s * 14, hy - 26], [hx + s * 62, hy - 34]], 6); }
    p.arc(hx - 12, hy + 30, 12, 9, 20, 160, 4); p.arc(hx + 12, hy + 30, 12, 9, 20, 160, 4);
    if (e === 'grin') { p.poly([[hx - 16, hy + 36], [hx - 10, hy + 50], [hx - 4, hy + 37]], '#ffffff', 2); p.poly([[hx + 16, hy + 36], [hx + 10, hy + 50], [hx + 4, hy + 37]], '#ffffff', 2); } }
};
/** summons scroll with seal, 600 x 400 */
export const drawSummons = (p, t) => {
  const g = p.g, k = Math.min(1, Math.max(0, t)), h = 40 + 280 * k;
  p.poly([[70, 40], [530, 40], [530, 40 + h], [70, 40 + h]], '#f2e6c4', 8);
  p.ell(300, 40, 240, 22, '#d8c49a', 7); p.ell(300, 40 + h, 240, 22, '#d8c49a', 7);
  if (k > 0.8) { g.fillStyle = '#3a2420'; g.font = 'bold italic 64px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SUMMONS', 300, 120); g.font = 'italic 40px Georgia, serif'; g.fillText('to all rats', 300, 190); p.ell(300, 270, 34, 34, '#b82a2a', 5); }
};
