// Renderiza o Reels quadro a quadro no Chromium headless e gera o MP4 com ffmpeg.
//
//   node render.mjs                 -> out/angeltech-reels.mp4
//   node render.mjs --stills 1,8.5  -> out/still-1.png, out/still-8.5.png
//   node render.mjs --stills 1.3 --phone -> só o celular, sem textos
//   node render.mjs --serve         -> abre o player em http://localhost:5173
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { FPS, DURATION, CUES, MUSIC } from './src/video.js';
import { generateSoundtrack, encodeWav } from './src/audio.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'out');
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i < 0 ? null : (args[i + 1] ?? '');
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

function serve(port = 0) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.join(ROOT, url === '/' ? 'index.html' : url);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

if (args.includes('--serve')) {
  const server = await serve(Number(process.env.PORT) || 5173);
  console.log(`Player: http://localhost:${server.address().port}`);
} else {
  await render();
}

async function render() {
  const { chromium } = await import('playwright');
  fs.mkdirSync(OUT, { recursive: true });
  const server = await serve();
  const browser = await chromium.launch({ args: ['--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(`http://localhost:${server.address().port}/?render`);
  await page.waitForFunction(() => window.reels?.ready, null, { timeout: 30000 });

  const opts = { phoneOnly: args.includes('--phone') };
  const grab = async (t) => {
    const url = await page.evaluate(([tt, o]) => window.reels.frame(tt, o), [t, opts]);
    return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
  };

  const stills = flag('--stills');
  if (stills !== null) {
    for (const s of stills.split(',').map(Number)) {
      const file = path.join(OUT, `${opts.phoneOnly ? 'celular' : 'still'}-${s}.png`);
      fs.writeFileSync(file, await grab(s));
      console.log(file);
    }
  } else {
    const wav = path.join(OUT, 'trilha.wav');
    fs.writeFileSync(wav, encodeWav(generateSoundtrack({ sampleRate: 48000, duration: DURATION, cues: CUES, music: MUSIC })));

    const mp4 = path.join(OUT, 'angeltech-reels.mp4');
    const ff = spawn('ffmpeg', [
      '-y', '-loglevel', 'error',
      '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-i', wav,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
      '-c:a', 'aac', '-b:a', '192k',
      '-shortest', '-movflags', '+faststart',
      mp4,
    ], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg saiu com código ' + c)))));

    const total = Math.round(DURATION * FPS);
    for (let i = 0; i < total; i++) {
      const png = await grab(i / FPS);
      if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
      if (i % FPS === 0) process.stdout.write(`\r${Math.round((i / total) * 100)}%`);
    }
    ff.stdin.end();
    await done;
    console.log(`\r100% -> ${mp4}`);
  }

  await browser.close();
  server.close();
}
