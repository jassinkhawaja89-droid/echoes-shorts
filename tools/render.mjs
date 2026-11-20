// node render.mjs <outdir> "0-10,20,30"   (RESUME=1 skips existing)
import { chromium } from 'playwright';
import fs from 'fs';
const [out, spec] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const frames = [];
for (const part of spec.split(',')) { const [a, b] = part.split('-').map(Number); for (let f = a; f <= (b ?? a); f++) frames.push(f); }
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-sandbox'] });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
pg.on('pageerror', (e) => console.log('PAGEERR', e.message));
pg.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('console', m.text().slice(0, 300)); });
await pg.goto('http://localhost:8790/index.html');
await pg.waitForFunction('window.ready', null, { timeout: 120000 });
const t0 = Date.now(); let n = 0;
for (const f of frames) {
  const p = `${out}/f${String(f).padStart(4, '0')}.jpg`;
  if (process.env.RESUME && fs.existsSync(p)) continue;
  const data = await pg.evaluate((f) => { window.renderFrame(f); return document.querySelector('canvas').toDataURL('image/jpeg', 0.95); }, f);
  fs.writeFileSync(p, Buffer.from(data.split(',')[1], 'base64'));
  n++; if (n % 10 === 0 || n === frames.length) console.log(`frame ${f} done ${n}/${frames.length} ${((Date.now() - t0) / n / 1000).toFixed(1)}s/f`);
}
await b.close(); console.log('DONE');
