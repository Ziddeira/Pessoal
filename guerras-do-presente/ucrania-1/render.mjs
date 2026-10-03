// Renderiza o vídeo quadro a quadro no Chromium headless e monta os MP4 com o ffmpeg.
//
//   node render.mjs                     -> out/ucrania-1-16x9.mp4 e out/ucrania-1-9x16.mp4
//   node render.mjs --formato 16x9      -> só o horizontal
//   node render.mjs --formato 9x16 --de 120 --ate 178   -> trecho vertical (para Shorts)
//   node render.mjs --stills 3,40,95 [--vertical] [--guia]  -> PNGs em out/
//   node render.mjs --audio             -> só a mixagem (out/audio.wav e out/audio-sem-narracao.wav)
//   node render.mjs --sem-narracao      -> troca o áudio dos MP4 prontos pela trilha sem voz
//   node render.mjs --serve             -> player em http://localhost:5174
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { montarLinhaDoTempo } from './src/tempo.js';
import { gerarTrilha, lerWav, gravarWav } from './src/audio.js';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(RAIZ, 'out');
const args = process.argv.slice(2);
const flag = (n) => {
  const i = args.indexOf(n);
  return i < 0 ? null : (args[i + 1] ?? '');
};
const FPS = 30;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.woff2': 'font/woff2', '.wav': 'audio/wav', '.png': 'image/png',
};

function servir(porta = 0) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const arq = path.join(RAIZ, url === '/' ? 'index.html' : url);
    if (!arq.startsWith(RAIZ) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    const tam = fs.statSync(arq).size;
    const range = req.headers.range?.match(/bytes=(\d+)-(\d*)/);
    const tipo = MIME[path.extname(arq)] ?? 'application/octet-stream';
    if (range) {
      const a = Number(range[1]);
      const b = range[2] ? Number(range[2]) : tam - 1;
      res.writeHead(206, { 'Content-Type': tipo, 'Content-Range': `bytes ${a}-${b}/${tam}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 });
      fs.createReadStream(arq, { start: a, end: b }).pipe(res);
      return;
    }
    res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': tam, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(arq).pipe(res);
  });
  return new Promise((r) => server.listen(porta, () => r(server)));
}

const ffmpeg = (a, stdin = 'ignore') => spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...a], { stdio: [stdin, 'inherit', 'inherit'] });
const esperar = (p) => new Promise((res, rej) => p.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg saiu com código ${c}`)))));

// ------------------------------------------------------------ áudio
async function montarAudio() {
  fs.mkdirSync(OUT, { recursive: true });
  const roteiro = JSON.parse(fs.readFileSync(path.join(RAIZ, 'src/roteiro.json'), 'utf8'));
  const tempos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'narracao/tempos.json'), 'utf8'));
  const L = montarLinhaDoTempo(roteiro, tempos);

  // narração: cada frase no seu instante, na taxa original das gravações
  const amostras = L.frases.map((f) => lerWav(path.join(RAIZ, 'narracao', `${f.nome}.wav`)));
  const sr = amostras[0].sr;
  const voz = new Float32Array(Math.ceil(L.duracao * sr));
  L.frases.forEach((f, i) => {
    const a = amostras[i];
    if (a.sr !== sr) throw new Error(`${f.nome}: taxa ${a.sr} Hz diferente de ${sr} Hz`);
    const s0 = Math.round(f.inicio * sr);
    for (let j = 0; j < a.dados.length && s0 + j < voz.length; j++) voz[s0 + j] += a.dados[j];
  });
  let pico = 0;
  for (const v of voz) pico = Math.max(pico, Math.abs(v));
  for (let j = 0; j < voz.length; j++) voz[j] *= 0.89 / (pico || 1);
  gravarWav(path.join(OUT, 'narracao.wav'), [voz], sr);

  // trilha e efeitos sintetizados, com a música abaixando sob a voz
  const trilha = gerarTrilha(L, 48000);
  let picoT = 0;
  for (const c of trilha) for (const v of c) picoT = Math.max(picoT, Math.abs(v));
  if (picoT > 0.89) for (const c of trilha) for (let j = 0; j < c.length; j++) c[j] *= 0.89 / picoT;
  gravarWav(path.join(OUT, 'trilha.wav'), trilha, 48000);

  // mixagem sem normalização dinâmica: mede a loudness e aplica um ganho fixo,
  // o mesmo na versão com voz e na versão só com trilha (o equilíbrio se mantém).
  const bruto = path.join(OUT, 'mix-bruto.wav');
  await esperar(ffmpeg([
    '-i', path.join(OUT, 'trilha.wav'), '-i', path.join(OUT, 'narracao.wav'),
    '-filter_complex',
    '[1:a]aresample=48000,highpass=f=85,lowpass=f=7400,equalizer=f=220:t=q:w=1:g=2,equalizer=f=3000:t=q:w=1.3:g=3,'
    + 'acompressor=threshold=-20dB:ratio=3:attack=4:release=120:makeup=2,aecho=0.8:0.5:38:0.08,pan=stereo|c0=c0|c1=c0[v];'
    + '[0:a][v]amix=inputs=2:normalize=0[a]',
    '-map', '[a]', '-c:a', 'pcm_f32le', bruto,
  ]));
  const ganho = -15 - (await loudness(bruto));
  const final = path.join(OUT, 'audio.wav');
  const semVoz = path.join(OUT, 'audio-sem-narracao.wav');
  for (const [ent, sai] of [[bruto, final], [path.join(OUT, 'trilha.wav'), semVoz]]) {
    await esperar(ffmpeg(['-i', ent, '-af', `volume=${ganho.toFixed(2)}dB,alimiter=limit=0.89:level=false`, '-ar', '48000', '-c:a', 'pcm_s16le', sai]));
  }
  fs.rmSync(bruto);
  console.log(`áudio -> ${final} e ${semVoz} (ganho ${ganho.toFixed(1)} dB)`);

  // legendas
  const srt = L.frases.map((f, i) => `${i + 1}\n${hms(f.inicio)} --> ${hms(f.fim + 0.2)}\n${f.texto}\n`).join('\n');
  fs.writeFileSync(path.join(OUT, 'ucrania-1.srt'), srt);
  fs.writeFileSync(path.join(OUT, 'roteiro-falas.txt'), roteiroFalas(L, roteiro));
  return { L, final, semVoz };
}

// Loudness integrada (LUFS) de um arquivo, pelo filtro ebur128 do ffmpeg.
function loudness(arq) {
  return new Promise((res, rej) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-nostats', '-i', arq, '-af', 'ebur128', '-f', 'null', '-']);
    let log = '';
    p.stderr.on('data', (d) => (log += d));
    p.on('close', () => {
      const m = [...log.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].at(-1);
      m ? res(Number(m[1])) : rej(new Error('não consegui medir a loudness'));
    });
  });
}

// Roteiro das falas com tempos, para gravar e posicionar a narração num editor.
function roteiroFalas(L, roteiro) {
  const mmss = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
  const planos = {};
  roteiro.cenas.forEach((c, ci) => c.planos.forEach((p) => ((planos[`${ci}-${p.s}`] ??= []).push(p.n))));
  const linhas = [
    `ROTEIRO DAS FALAS · ${roteiro.titulo}`,
    `Guerras do Presente · Rússia x Ucrânia 1/3 · duração total ${mmss(L.duracao)}`,
    '',
    'Como usar: cada fala começa no tempo indicado. A "janela" é o tempo que a animação',
    'reserva para ela; tente caber nela (ritmo de ~145 palavras por minuto). Se gravar',
    'frase por frase, cole cada arquivo no início indicado. O arquivo ucrania-1.srt tem os',
    'mesmos tempos e pode ser importado no editor como guia.',
    '',
  ];
  let n = 0;
  L.cenas.forEach((c, ci) => {
    linhas.push('='.repeat(78), `CENA ${ci + 1} · ${c.titulo.toUpperCase()}  (${mmss(c.inicio)} – ${mmss(c.fim)})`, '='.repeat(78), '');
    c.frases.forEach((f, i) => {
      n++;
      const pl = planos[`${ci}-${i}`];
      linhas.push(`${String(n).padStart(2, '0')}  [${mmss(f.inicio)} → ${mmss(f.fim)}]  janela ${(f.fim - f.inicio).toFixed(1)}s${pl ? `  · entra o plano ${pl.join(', ')}` : ''}`);
      linhas.push(`    ${f.texto}`, '');
    });
  });
  linhas.push('='.repeat(78), '', 'TEXTO CORRIDO (para teleprompter)', '');
  L.cenas.forEach((c) => linhas.push(c.frases.map((f) => f.texto).join(' '), ''));
  return linhas.join('\n');
}

const hms = (s) => {
  const ms = Math.round(s * 1000);
  const p = (n, k = 2) => String(n).padStart(k, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

// ------------------------------------------------------------ vídeo
async function abrirPagina() {
  const { chromium } = await import('playwright');
  const server = await servir();
  const browser = await chromium.launch({ args: ['--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.error('erro na página:', e.message));
  page.on('console', (m) => m.type() === 'error' && console.error('console:', m.text()));
  await page.goto(`http://localhost:${server.address().port}/?render`);
  await page.waitForFunction(() => window.video?.ready, null, { timeout: 60000 });
  return { page, fechar: async () => { await browser.close(); server.close(); } };
}

async function renderizar(page, formato, audio, de, ate) {
  const vertical = formato === '9x16';
  await page.evaluate((v) => window.video.formato(v), vertical);
  const duracao = await page.evaluate(() => window.video.duracao);
  ate = Math.min(ate ?? duracao, duracao);
  de = de ?? 0;
  const sufixo = de > 0 || ate < duracao ? `-${Math.round(de)}s-${Math.round(ate)}s` : '';
  const mp4 = path.join(OUT, `ucrania-1-${formato}${sufixo}.mp4`);
  const ff = ffmpeg([
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-ss', String(de), '-t', String(ate - de), '-i', audio,
    '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', mp4,
  ], 'pipe');
  const fim = esperar(ff);
  const total = Math.round((ate - de) * FPS);
  const opts = { vertical, legendas: args.includes('--legendas') };
  const inicio = Date.now();
  for (let i = 0; i < total; i++) {
    const url = await page.evaluate(([t, o]) => window.video.quadro(t, o), [de + i / FPS, opts]);
    const png = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % FPS === 0) {
      const seg = (Date.now() - inicio) / 1000;
      process.stdout.write(`\r${formato}: ${Math.round((i / total) * 100)}% · ${Math.round(seg)}s`);
    }
  }
  ff.stdin.end();
  await fim;
  console.log(`\r${formato}: 100% -> ${mp4}`);
  return mp4;
}

if (args.includes('--serve')) {
  const s = await servir(Number(process.env.PORT) || 5174);
  console.log(`Player: http://localhost:${s.address().port}`);
} else if (args.includes('--audio')) {
  await montarAudio();
} else if (args.includes('--sem-narracao')) {
  // reaproveita as imagens já renderizadas e troca só o áudio (trilha + efeitos, sem voz)
  const { semVoz } = await montarAudio();
  for (const f of ['16x9', '9x16']) {
    const ent = path.join(OUT, `ucrania-1-${f}.mp4`);
    if (!fs.existsSync(ent)) continue;
    const sai = path.join(OUT, `ucrania-1-${f}-sem-narracao.mp4`);
    await esperar(ffmpeg(['-i', ent, '-i', semVoz, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', sai]));
    console.log(`-> ${sai}`);
  }
} else if (flag('--stills') !== null) {
  fs.mkdirSync(OUT, { recursive: true });
  const { page, fechar } = await abrirPagina();
  const vertical = args.includes('--vertical');
  await page.evaluate((v) => window.video.formato(v), vertical);
  for (const s of flag('--stills').split(',').map(Number)) {
    const url = await page.evaluate(([t, o]) => window.video.quadro(t, o), [s, { vertical, guia: args.includes('--guia'), legendas: args.includes('--legendas') }]);
    const arq = path.join(OUT, `quadro-${vertical ? 'v-' : ''}${s}.png`);
    fs.writeFileSync(arq, Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
    console.log(arq);
  }
  await fechar();
} else {
  const { final } = await montarAudio();
  const { page, fechar } = await abrirPagina();
  const fmt = flag('--formato');
  const de = flag('--de') !== null ? Number(flag('--de')) : undefined;
  const ate = flag('--ate') !== null ? Number(flag('--ate')) : undefined;
  for (const f of fmt ? [fmt] : ['16x9', '9x16']) await renderizar(page, f, final, de, ate);
  await fechar();
}
