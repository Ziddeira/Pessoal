// Gera os PNGs das artes de Instagram: cada <section id> de cada .html vira
// instagram/imagens/<id>.png no tamanho exato.
//
//   node instagram/gerar.mjs
//
// Usa o Playwright instalado em reels/ (rode `npm install` lá antes).
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '..');
const OUT = path.join(DIR, 'imagens');

let chromium;
try {
  ({ chromium } = createRequire(path.join(ROOT, 'reels', 'package.json'))('playwright'));
} catch {
  console.error('Playwright não encontrado. Rode `npm install` dentro de reels/ e tente de novo.');
  process.exit(1);
}

const MIME = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return res.writeHead(404).end();
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));

const browser = await chromium.launch({ args: ['--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width: 2400, height: 2100 } });
page.on('pageerror', (e) => console.error('erro na página:', e.message));
fs.mkdirSync(OUT, { recursive: true });

for (const html of fs.readdirSync(DIR).filter((f) => f.endsWith('.html'))) {
  await page.goto(`http://localhost:${server.address().port}/instagram/${html}`);
  await page.evaluate(() => window.pronto);
  for (const id of await page.$$eval('section[id]', (els) => els.map((e) => e.id))) {
    const file = path.join(OUT, `${id}.png`);
    await page.locator(`#${id}`).screenshot({ path: file });
    console.log(`imagens/${id}.png`);
  }
}

await browser.close();
server.close();
