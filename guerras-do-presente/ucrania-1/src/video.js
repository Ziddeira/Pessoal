// Monta o vídeo: carrega roteiro, tempos da narração e mapas; desenha o quadro do instante t.
//   const v = await carregarVideo(base); v.quadro(ctx, t, { legendas, guia })
import { W, H, C, SEGURO, clamp, prog, texto, vinheta, marcador } from './desenho.js';
import { Mapa, hachura } from './mapa.js';
import { CENAS, MARCADOR } from './cenas.js';
import { montarLinhaDoTempo } from './tempo.js';

export const FPS = 30;
const TRANSICAO = 0.5;

async function lerJSON(url, padrao) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch {
    if (padrao === undefined) throw new Error(`não consegui ler ${url}`);
    return padrao;
  }
}

export async function carregarVideo(base = '.') {
  const [roteiro, tempos, geo] = await Promise.all([
    lerJSON(`${base}/src/roteiro.json`),
    lerJSON(`${base}/narracao/tempos.json`, {}),
    lerJSON(`${base}/src/geo.json`),
  ]);
  const L = montarLinhaDoTempo(roteiro, tempos);
  const mapa = new Mapa(geo);
  let hach = null;
  let buffer = null;

  function contexto(ci, ctx) {
    const cena = L.cenas[ci];
    hach ??= { vermelho: hachura(ctx, 'rgba(255,90,90,0.75)') };
    return {
      L, mapa, hach, c0: cena.inicio, c1: cena.fim,
      P: (n) => L.planos[n],
      F: (i) => cena.frases[i].inicio,
      Ff: (i) => cena.frases[i].fim,
    };
  }

  function desenharCena(ctx, ci, t) {
    ctx.save();
    CENAS[L.cenas[ci].id](ctx, t, contexto(ci, ctx));
    ctx.restore();
  }

  function quadro(ctx, t, o = {}) {
    t = clamp(t, 0, L.duracao - 1 / FPS);
    const ci = Math.max(0, L.cenas.findIndex((c) => t >= c.inicio && t < c.fim));
    ctx.save();
    ctx.fillStyle = C.fundo;
    ctx.fillRect(0, 0, W, H);
    desenharCena(ctx, ci, t);

    // transição: a cena anterior se dissolve sobre a nova
    const dt = t - L.cenas[ci].inicio;
    if (ci > 0 && dt < TRANSICAO) {
      if (!buffer) {
        buffer = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(W, H) : Object.assign(document.createElement('canvas'), { width: W, height: H });
      }
      const b = buffer.getContext('2d');
      b.fillStyle = C.fundo;
      b.fillRect(0, 0, W, H);
      desenharCena(b, ci - 1, t);
      ctx.globalAlpha = 1 - dt / TRANSICAO;
      ctx.drawImage(buffer, 0, 0);
      ctx.globalAlpha = 1;
    }

    // marcador "Guarde essa promessa" fica no canto até a cena da Crimeia
    const ini = L.planos[26] + 3.1;
    const fim = L.planos[37];
    if (t > ini && t < fim) {
      ctx.save();
      ctx.globalAlpha = clamp((t - ini) * 4) * 0.95;
      marcador(ctx, MARCADOR.x, MARCADOR.y, MARCADOR.s);
      ctx.restore();
    }

    vinheta(ctx, 0.55);
    if (o.legendas) legenda(ctx, t);
    if (o.guia) guia916(ctx);
    ctx.restore();
  }

  function legenda(ctx, t) {
    const f = L.frases.find((fr) => t >= fr.inicio - 0.05 && t <= fr.fim + 0.25);
    if (!f) return;
    const a = clamp(Math.min((t - f.inicio + 0.05) * 6, (f.fim + 0.25 - t) * 6));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(SEGURO.x0, 968, SEGURO.larg, 100);
    texto(ctx, f.texto, SEGURO.cx, 1018, { size: 25, weight: 600, family: 'Inter', maxW: SEGURO.larg - 40, lineH: 1.25 });
    ctx.restore();
  }

  function guia916(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, SEGURO.x0, H);
    ctx.fillRect(SEGURO.x1, 0, W - SEGURO.x1, H);
    ctx.strokeStyle = '#FFD24A';
    ctx.setLineDash([12, 10]);
    ctx.lineWidth = 2;
    ctx.strokeRect(SEGURO.x0, 0, SEGURO.larg, H);
    ctx.restore();
  }

  // Instantes dos efeitos sonoros, para a mixagem.
  return { L, quadro, duracao: L.duracao, roteiro };
}

export { W, H };
