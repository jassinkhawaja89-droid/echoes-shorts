// Painted canvas textures: flat colour, dark seams, a little hand-painted noise.
const R = (s) => { let x = Math.sin(s * 127.1) * 43758.5453; return x - Math.floor(x); };
export const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const speck = (g, w, h, n, cols, size, seed) => {
  for (let i = 0; i < n; i++) {
    g.fillStyle = cols[i % cols.length]; g.globalAlpha = 0.25 + 0.35 * R(seed + i * 3.1);
    const x = R(seed + i) * w, y = R(seed + i * 7.7) * h, s = size * (0.5 + R(seed + i * 1.9));
    g.beginPath(); g.ellipse(x, y, s, s * 0.6, R(i) * 3, 0, 6.3); g.fill();
  }
  g.globalAlpha = 1;
};
export const dirt = () => { // red-brown wheatbelt dirt road
  const [c, g] = canvas(512, 512);
  g.fillStyle = '#b5683e'; g.fillRect(0, 0, 512, 512);
  speck(g, 512, 512, 700, ['#a35a34', '#c47a4a', '#93512e', '#cf8a58'], 9, 1);
  g.strokeStyle = '#8a4a2a'; g.globalAlpha = 0.5; g.lineWidth = 10;
  for (const x of [150, 360]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 6, 512); g.stroke(); } // wheel ruts
  g.globalAlpha = 1; return c;
};
export const field = () => { // ground under the wheat: golden rows
  const [c, g] = canvas(512, 512);
  g.fillStyle = '#d6a443'; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 16) { g.fillStyle = y % 32 ? '#c8963a' : '#e2b452'; g.fillRect(0, y, 512, 7); }
  speck(g, 512, 512, 900, ['#b88630', '#edc462', '#a87a2a'], 6, 5);
  return c;
};
export const scrub = () => { // dry grass verge
  const [c, g] = canvas(512, 512);
  g.fillStyle = '#b39a55'; g.fillRect(0, 0, 512, 512);
  speck(g, 512, 512, 900, ['#9a8448', '#c9b066', '#8a7a3a', '#7f8c4a'], 8, 9);
  return c;
};
export const weatherboard = (col = '#e8dcc0') => {
  const [c, g] = canvas(256, 256);
  for (let y = 0; y < 256; y += 32) {
    g.fillStyle = col; g.fillRect(0, y, 256, 32);
    g.fillStyle = 'rgba(70,50,30,.35)'; g.fillRect(0, y + 26, 256, 6);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, y, 256, 4);
  }
  speck(g, 256, 256, 80, ['#b8a888', '#fff4dc'], 4, 3);
  return c;
};
export const corrugated = (col = '#a9b2b6') => {
  const [c, g] = canvas(256, 256);
  for (let x = 0; x < 256; x += 16) {
    const gr = g.createLinearGradient(x, 0, x + 16, 0);
    gr.addColorStop(0, col); gr.addColorStop(0.5, '#e4e8ea'); gr.addColorStop(1, '#6f787c');
    g.fillStyle = gr; g.fillRect(x, 0, 16, 256);
  }
  speck(g, 256, 256, 60, ['#b56a3a', '#8a5030'], 7, 4); // rust spots
  return c;
};
export const planks = (col = '#b07a46', n = 6, vert = false) => {
  const [c, g] = canvas(256, 256);
  const s = 256 / n;
  for (let i = 0; i < n; i++) {
    const k = 0.9 + 0.2 * R(i + 3);
    g.fillStyle = col; g.filter = `brightness(${k})`;
    vert ? g.fillRect(i * s, 0, s, 256) : g.fillRect(0, i * s, 256, s);
    g.filter = 'none';
    g.fillStyle = 'rgba(40,24,14,.75)'; vert ? g.fillRect(i * s, 0, 4, 256) : g.fillRect(0, i * s, 256, 4);
    g.strokeStyle = 'rgba(80,50,30,.35)'; g.lineWidth = 2;
    for (let j = 0; j < 3; j++) { g.beginPath(); const o = i * s + s * (0.3 + 0.2 * j); vert ? (g.moveTo(o, 0), g.bezierCurveTo(o + 6, 80, o - 6, 170, o, 256)) : (g.moveTo(0, o), g.bezierCurveTo(80, o + 6, 170, o - 6, 256, o)); g.stroke(); }
  }
  return c;
};
export const olive = (col = '#5f6b3a') => {
  const [c, g] = canvas(256, 256);
  g.fillStyle = col; g.fillRect(0, 0, 256, 256);
  speck(g, 256, 256, 120, ['#525c30', '#6e7a46', '#4a3a28'], 6, 11);
  return c;
};
export const canvasCloth = (col = '#c9b98a') => {
  const [c, g] = canvas(256, 256);
  g.fillStyle = col; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(90,70,40,.3)'; g.lineWidth = 3;
  for (let x = 0; x < 256; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  speck(g, 256, 256, 100, ['#b3a274', '#ddd0a4'], 5, 13);
  return c;
};
export const bark = () => {
  const [c, g] = canvas(128, 256);
  g.fillStyle = '#d8d0c0'; g.fillRect(0, 0, 128, 256);
  speck(g, 128, 256, 60, ['#b8a890', '#9a8a78', '#efe8da'], 10, 17);
  return c;
};
/** chalk tally board: "50" with tally marks (reads correctly; plane UVs are not mirrored) */
export const tallyBoard = (reveal = 1) => {
  const [c, g] = canvas(512, 384);
  g.fillStyle = '#7a5434'; g.fillRect(0, 0, 512, 384);
  g.fillStyle = '#2f3b33'; g.fillRect(22, 22, 468, 340);
  g.strokeStyle = '#f2efe4'; g.fillStyle = '#f2efe4'; g.lineCap = 'round'; g.lineWidth = 7;
  g.font = 'bold 54px Georgia, serif'; g.fillText('EMUS', 46, 92);
  // tally marks (groups of five)
  for (let i = 0; i < 4; i++) {
    const x0 = 50 + i * 70;
    for (let j = 0; j < 4; j++) { g.beginPath(); g.moveTo(x0 + j * 12, 130); g.lineTo(x0 + j * 12 + 3, 200); g.stroke(); }
    g.beginPath(); g.moveTo(x0 - 8, 190); g.lineTo(x0 + 48, 140); g.stroke();
  }
  if (reveal > 0) {
    g.globalAlpha = Math.min(1, reveal);
    g.font = 'bold 150px Georgia, serif'; g.fillText('50', 300, 340);
    g.globalAlpha = 1;
  }
  return c;
};
export const metal = (col = '#3d4a3a') => olive(col);
export const cloud = (seed) => {
  const [c, g] = canvas(512, 256);
  const blobs = [];
  for (let i = 0; i < 9; i++) blobs.push([90 + R(seed + i) * 330, 150 - Math.sin((i / 8) * Math.PI) * 50 - R(seed + i * 2) * 20, 50 + R(seed + i * 3) * 40]);
  g.fillStyle = '#c9d6ea';
  for (const [x, y, r] of blobs) { g.beginPath(); g.arc(x, y + 12, r, 0, 6.3); g.fill(); }
  g.fillStyle = '#ffffff';
  for (const [x, y, r] of blobs) { g.beginPath(); g.arc(x - 4, y, r * 0.92, 0, 6.3); g.fill(); }
  g.fillRect(70, 150, 380, 30);
  g.fillStyle = '#c9d6ea'; g.fillRect(60, 178, 400, 14);
  return c;
};

// ---------- Paris 1925 ----------
export const cobble = () => {
  const [c, g] = canvas(512, 512);
  g.fillStyle = '#6f6a66'; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) for (let x = (y / 32) % 2 ? -24 : 0; x < 512; x += 48) {
    g.fillStyle = ['#8f8780', '#a39a90', '#857d77', '#9a918a'][(x * 7 + y * 3) % 4 < 0 ? 0 : ((x / 48 + y / 32) | 0) % 4];
    g.beginPath(); g.roundRect(x + 3, y + 3, 42, 26, 8); g.fill();
  }
  speck(g, 512, 512, 200, ['#5f5a56', '#b0a89e'], 5, 21);
  return c;
};
export const gravel = () => {
  const [c, g] = canvas(512, 512);
  g.fillStyle = '#d2bf98'; g.fillRect(0, 0, 512, 512);
  speck(g, 512, 512, 900, ['#c2ae86', '#e0d0aa', '#b8a47e'], 5, 23);
  return c;
};
export const grass = () => {
  const [c, g] = canvas(512, 512);
  g.fillStyle = '#6f9a4a'; g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 64) { g.fillStyle = (x / 64) % 2 ? '#79a452' : '#68924a'; g.fillRect(x, 0, 64, 512); }
  speck(g, 512, 512, 500, ['#5f8a40', '#88b060'], 6, 25);
  return c;
};
/** Haussmann facade tile: 1 storey x 2 windows, cream stone, balcony rail */
export const facade = (col = '#e8dcc4') => {
  const [c, g] = canvas(256, 256);
  g.fillStyle = col; g.fillRect(0, 0, 256, 256);
  g.fillStyle = 'rgba(120,100,70,.25)'; for (let y = 0; y < 256; y += 32) g.fillRect(0, y, 256, 3);
  for (const x of [34, 162]) {
    g.fillStyle = '#5a4a3a'; g.fillRect(x - 4, 46, 68, 156);
    g.fillStyle = '#2a3446'; g.fillRect(x, 50, 60, 148);
    g.fillStyle = '#4a5a78'; g.fillRect(x + 4, 54, 24, 66); g.fillRect(x + 32, 54, 24, 66); g.fillRect(x + 4, 126, 24, 66); g.fillRect(x + 32, 126, 24, 66);
    g.fillStyle = '#efe6d4'; g.fillRect(x - 10, 30, 80, 14);
    g.strokeStyle = '#1e1c22'; g.lineWidth = 4; g.strokeRect(x - 6, 168, 72, 34);
    for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(x - 6 + k * 12, 168); g.lineTo(x - 6 + k * 12, 202); g.stroke(); }
  }
  return c;
};
export const shopfront = (col = '#2f4a3a', label = '') => {
  const [c, g] = canvas(512, 256);
  g.fillStyle = '#d8ccb4'; g.fillRect(0, 0, 512, 256);
  g.fillStyle = col; g.fillRect(16, 40, 480, 216);
  g.fillStyle = '#e8d8a0'; g.fillRect(36, 70, 200, 150); g.fillRect(276, 70, 200, 150);
  g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(36, 70, 60, 150); g.fillRect(276, 70, 60, 150);
  g.fillStyle = col; g.fillRect(16, 40, 480, 28);
  if (label) { g.fillStyle = '#f4e6b0'; g.font = 'bold 22px Georgia'; g.textAlign = 'center'; g.fillText(label, 256, 61); }
  return c;
};
export const mansard = () => {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#5f6a78'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(30,36,46,.5)'; g.lineWidth = 3;
  for (let y = 0; y < 256; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  for (let y = 0; y < 256; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < 256; x += 16) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke(); }
  return c;
};
/** iron lattice for the tower: X braces with transparent holes (alpha-tested) */
export const lattice = (col = '#7a5a40') => {
  const [c, g] = canvas(256, 256);
  g.clearRect(0, 0, 256, 256);
  g.strokeStyle = col; g.lineCap = 'square';
  g.lineWidth = 22; g.strokeRect(11, 11, 234, 234);
  g.lineWidth = 12; g.beginPath(); g.moveTo(0, 0); g.lineTo(256, 256); g.moveTo(256, 0); g.lineTo(0, 256); g.stroke();
  g.lineWidth = 7; g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke();
  return c;
};
export const parquet = () => {
  const [c, g] = canvas(256, 256);
  for (let y = 0; y < 256; y += 32) for (let x = 0; x < 256; x += 64) {
    const k = ((x + y) / 32) % 2;
    g.fillStyle = k ? '#a8703e' : '#b98048'; g.fillRect((y / 32) % 2 ? x + 32 : x, y, 64, 32);
    g.strokeStyle = 'rgba(60,30,10,.5)'; g.lineWidth = 2; g.strokeRect((y / 32) % 2 ? x + 32 : x, y, 64, 32);
  }
  return c;
};
export const carpet = () => {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#9a2232'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#d8b44a'; g.lineWidth = 6; g.strokeRect(16, 16, 224, 224);
  g.lineWidth = 3; g.strokeRect(30, 30, 196, 196);
  g.fillStyle = '#c8a040';
  for (const [x, y] of [[128, 128], [64, 64], [192, 64], [64, 192], [192, 192]]) { g.beginPath(); g.moveTo(x, y - 16); g.lineTo(x + 16, y); g.lineTo(x, y + 16); g.lineTo(x - 16, y); g.closePath(); g.fill(); }
  return c;
};
export const salonWall = () => {
  const [c, g] = canvas(256, 512);
  g.fillStyle = '#efe0c0'; g.fillRect(0, 0, 256, 512);
  g.fillStyle = '#e4cfa4'; g.fillRect(24, 60, 208, 300);
  g.strokeStyle = '#c99a3a'; g.lineWidth = 6; g.strokeRect(24, 60, 208, 300);
  g.lineWidth = 3; g.strokeRect(38, 74, 180, 272);
  g.fillStyle = '#7a4a2a'; g.fillRect(0, 420, 256, 92);
  g.fillStyle = '#c99a3a'; g.fillRect(0, 412, 256, 10); g.fillRect(0, 20, 256, 8);
  return c;
};
export const cloth = () => {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#f6f2ea'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(180,170,150,.35)'; g.lineWidth = 2;
  for (let x = 0; x < 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  return c;
};
export const plainWall = (col = '#d8c8a8') => {
  const [c, g] = canvas(256, 256);
  g.fillStyle = col; g.fillRect(0, 0, 256, 256);
  speck(g, 256, 256, 120, ['#c8b898', '#e6d8bc'], 8, 27);
  g.fillStyle = '#6a4a2a'; g.fillRect(0, 210, 256, 46);
  return c;
};
export const sign = (text, bg = '#1e3a7a', fg = '#ffffff', w = 512, h = 160) => {
  const [c, g] = canvas(w, h);
  g.fillStyle = '#e8e2d4'; g.fillRect(0, 0, w, h);
  g.fillStyle = bg; g.fillRect(10, 10, w - 20, h - 20);
  g.fillStyle = fg; g.font = `bold ${Math.round(h * 0.55)}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 4);
  return c;
};
export const letter = () => {
  const [c, g] = canvas(128, 160);
  g.fillStyle = '#f8f2e2'; g.fillRect(0, 0, 128, 160);
  g.fillStyle = '#9aa0b0'; for (let y = 40; y < 140; y += 12) g.fillRect(16, y, 80 + (y % 24 ? 16 : 0), 4);
  g.fillStyle = '#c8243a'; g.beginPath(); g.arc(98, 128, 16, 0, 6.3); g.fill();
  g.fillStyle = '#2a3a6a'; g.fillRect(16, 14, 60, 10);
  return c;
};

// ---------- Lisbon / London 1925 ----------
/** fictional banknote (not a real design): "500", a ship vignette, serial number */
export const note = (serial = 'Nº 7A 24513', tint = '#5f8f6a') => {
  const [c, g] = canvas(512, 256);
  g.fillStyle = '#efe6c8'; g.fillRect(0, 0, 512, 256);
  g.strokeStyle = tint; g.lineWidth = 10; g.strokeRect(10, 10, 492, 236);
  g.lineWidth = 2; g.strokeRect(24, 24, 464, 208);
  for (let i = 0; i < 40; i++) { g.globalAlpha = 0.18; g.beginPath(); g.ellipse(256, 128, 60 + i * 5, 30 + i * 2.5, 0, 0, 6.3); g.stroke(); }
  g.globalAlpha = 1;
  g.fillStyle = tint; g.beginPath(); g.ellipse(150, 128, 62, 72, 0, 0, 6.3); g.fill();
  g.fillStyle = '#efe6c8'; g.beginPath(); g.moveTo(110, 150); g.lineTo(190, 150); g.lineTo(175, 170); g.lineTo(125, 170); g.closePath(); g.fill();
  g.fillRect(148, 90, 4, 60); g.beginPath(); g.moveTo(152, 92); g.lineTo(184, 140); g.lineTo(152, 140); g.closePath(); g.fill();
  g.fillStyle = '#2a3a2e'; g.font = 'bold 74px Georgia, serif'; g.textAlign = 'center'; g.fillText('500', 370, 110);
  g.font = 'bold 26px Georgia, serif'; g.fillText('ESCUDOS', 370, 146);
  g.fillStyle = '#b8243a'; g.font = 'bold 24px Courier New, monospace'; g.fillText(serial, 370, 206);
  return c;
};
export const stone = (col = '#8a8478') => {
  const [c, g] = canvas(256, 256);
  g.fillStyle = col; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 42) for (let x = (y / 42) % 2 ? -32 : 0; x < 256; x += 64) {
    g.fillStyle = ['#9a9488', '#7f796e', '#8f897c'][((x + y) / 21 | 0) % 3]; g.fillRect(x + 3, y + 3, 58, 36);
  }
  speck(g, 256, 256, 120, ['#6a645a', '#a8a296'], 5, 31);
  return c;
};
export const brick = (col = '#8a3e2e') => {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#5a4a40'; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 21) for (let x = (y / 21) % 2 ? -21 : 0; x < 256; x += 42) {
    g.fillStyle = ['#8a3e2e', '#7a3626', '#9a4a36'][((x + y) / 21 | 0) % 3]; g.fillRect(x + 2, y + 2, 38, 17);
  }
  return c;
};
export const tiles = (col = '#2a5a9a') => { // azulejo-ish tile band
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#f2ecdc'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = col; g.lineWidth = 5;
  for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 64) {
    g.strokeRect(x + 3, y + 3, 58, 58); g.beginPath(); g.arc(x + 32, y + 32, 16, 0, 6.3); g.stroke();
    g.beginPath(); g.moveTo(x + 32, y + 6); g.lineTo(x + 32, y + 58); g.moveTo(x + 6, y + 32); g.lineTo(x + 58, y + 32); g.stroke();
  }
  return c;
};
export const terracotta = () => {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#b8603a'; g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, '#9a4a2a'); gr.addColorStop(0.5, '#d07850'); gr.addColorStop(1, '#8a3e22'); g.fillStyle = gr; g.fillRect(x, 0, 16, 256); }
  g.strokeStyle = 'rgba(70,30,15,.5)'; g.lineWidth = 3; for (let y = 0; y < 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  return c;
};
/** chalk plan on the cell wall; k reveals it progressively (0..1) */
export const chalkWall = (k = 1) => {
  const c = stone('#7a756a'), g = c.getContext('2d');
  g.strokeStyle = '#f4f2ea'; g.fillStyle = '#f4f2ea'; g.lineWidth = 5; g.lineCap = 'round';
  g.font = 'bold 30px Georgia, serif';
  if (k > 0.05) g.fillText('LISBOA', 14, 60);
  if (k > 0.3) { g.beginPath(); g.moveTo(40, 80); g.quadraticCurveTo(128, 30 + 120 * 0, 200, 120); g.stroke(); g.beginPath(); g.moveTo(200, 120); g.lineTo(184, 104); g.moveTo(200, 120); g.lineTo(178, 124); g.stroke(); }
  if (k > 0.55) g.fillText('LONDON', 120, 160);
  if (k > 0.8) { g.font = 'bold 52px Georgia, serif'; g.fillText('$$$', 40, 230); }
  return c;
};
export const contract = () => {
  const [c, g] = canvas(256, 340);
  g.fillStyle = '#f6efd8'; g.fillRect(0, 0, 256, 340);
  g.fillStyle = '#2a2a3a'; g.font = 'bold 30px Georgia, serif'; g.textAlign = 'center'; g.fillText('CONTRATO', 128, 50);
  g.fillStyle = '#8a8a9a'; for (let y = 80; y < 260; y += 18) g.fillRect(30, y, 196 - (y % 36 ? 30 : 0), 6);
  g.strokeStyle = '#2a2a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(40, 300); g.bezierCurveTo(70, 270, 90, 320, 130, 290); g.stroke();
  g.fillStyle = '#c8243a'; g.beginPath(); g.arc(200, 292, 28, 0, 6.3); g.fill();
  g.fillStyle = '#e8606a'; g.beginPath(); g.arc(200, 292, 14, 0, 6.3); g.fill();
  return c;
};
export const crateLabel = () => {
  const c = planks('#a8783e', 4), g = c.getContext('2d');
  g.fillStyle = '#2a1e14'; g.font = 'bold 86px Georgia, serif'; g.textAlign = 'center'; g.fillText('500', 128, 160);
  return c;
};

// ---------- Zanzibar 1896 ----------
export const sand = () => {
  const [c, g] = canvas(512, 512);
  g.fillStyle = '#e6cf9c'; g.fillRect(0, 0, 512, 512);
  speck(g, 512, 512, 500, ['#d8bf88', '#f0dcae', '#cdb07a'], 8, 41);
  return c;
};
export const sea = () => {
  const [c, g] = canvas(512, 512);
  g.fillStyle = '#2f9ab8'; g.fillRect(0, 0, 512, 512);
  speck(g, 512, 512, 160, ['#2a8aa8', '#38a8c4'], 30, 43);
  g.strokeStyle = '#8fdcec'; g.lineWidth = 6; g.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const x = R(i * 3.3) * 512, y = R(i * 5.1) * 512, w = 30 + R(i) * 50;
    g.globalAlpha = 0.85; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x, y - 9, x + w, y); g.stroke();
  }
  g.globalAlpha = 1; return c;
};
export const palaceWall = (col = '#f4efe2', rows = 3, cols = 2, shut = '#3a7a6a') => { // whitewashed coral-stone with arched shuttered windows
  const [c, g] = canvas(512, 512);
  g.fillStyle = col; g.fillRect(0, 0, 512, 512);
  speck(g, 512, 512, 140, ['#e6e0d0', '#fbf8ee', '#ddd4c0'], 10, 47);
  const cw = 512 / cols, rh = 512 / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x = i * cw + cw * 0.3, y = j * rh + rh * 0.22, w = cw * 0.4, h = rh * 0.6;
    g.fillStyle = '#241726'; g.beginPath(); g.moveTo(x - 6, y + h + 6); g.lineTo(x - 6, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2 + 6, Math.PI, 0); g.lineTo(x + w + 6, y + h + 6); g.closePath(); g.fill();
    g.fillStyle = shut; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); g.fill();
    g.fillStyle = '#2a5a4e'; for (let k = 1; k < 6; k++) g.fillRect(x + 4, y + w / 2 + k * (h - w / 2) / 6, w - 8, 3);
    g.fillStyle = '#241726'; g.fillRect(x + w / 2 - 2, y, 4, h);
    g.fillStyle = '#d8ccb0'; g.fillRect(x - 12, y + h + 6, w + 24, 10);
  }
  g.fillStyle = '#d8ccb0'; for (let j = 1; j < rows; j++) g.fillRect(0, j * rh - 6, 512, 10);
  return c;
};
export const clockFace = (hour = 8, min = 55) => {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#f4efe2'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#241726'; g.beginPath(); g.arc(128, 128, 118, 0, 6.3); g.fill();
  g.fillStyle = '#fffaf0'; g.beginPath(); g.arc(128, 128, 108, 0, 6.3); g.fill();
  g.strokeStyle = '#241726'; g.lineCap = 'round';
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.lineWidth = i % 3 ? 5 : 10; g.beginPath(); g.moveTo(128 + Math.sin(a) * 84, 128 - Math.cos(a) * 84); g.lineTo(128 + Math.sin(a) * 100, 128 - Math.cos(a) * 100); g.stroke(); }
  const mh = (min / 60) * Math.PI * 2, hh = (((hour % 12) + min / 60) / 12) * Math.PI * 2;
  g.lineWidth = 12; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.sin(hh) * 52, 128 - Math.cos(hh) * 52); g.stroke();
  g.lineWidth = 7; g.strokeStyle = '#c8243a'; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.sin(mh) * 86, 128 - Math.cos(mh) * 86); g.stroke();
  g.fillStyle = '#241726'; g.beginPath(); g.arc(128, 128, 10, 0, 6.3); g.fill();
  return c;
};
export const hull = (col = '#26232a', band = '#d8b24a') => {
  const [c, g] = canvas(512, 256);
  g.fillStyle = col; g.fillRect(0, 0, 512, 256);
  g.fillStyle = band; g.fillRect(0, 22, 512, 10);
  g.fillStyle = '#9a2a2a'; g.fillRect(0, 210, 512, 46);
  g.fillStyle = '#141218'; for (let x = 20; x < 512; x += 64) { g.beginPath(); g.arc(x, 70, 9, 0, 6.3); g.fill(); }
  return c;
};
export const flagRed = () => { const [c, g] = canvas(128, 64); g.fillStyle = '#c8202a'; g.fillRect(0, 0, 128, 64); g.fillStyle = '#a81820'; g.fillRect(0, 56, 128, 8); return c; };
export const rubble = () => {
  const [c, g] = canvas(256, 256);
  g.fillStyle = '#b8ae98'; g.fillRect(0, 0, 256, 256);
  speck(g, 256, 256, 160, ['#8a8070', '#ddd4c0', '#6a6258'], 14, 53);
  return c;
};
