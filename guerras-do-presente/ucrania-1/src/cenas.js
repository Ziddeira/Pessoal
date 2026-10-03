// As 13 cenas do vídeo 1. Cada cena recebe (ctx, t, K):
//   t      tempo global em segundos
//   K.P(n) instante em que o plano n começa
//   K.F(i) / K.Ff(i) início / fim da frase i da cena atual
//   K.c0 / K.c1 início / fim da cena; K.mapa; K.hach (padrões de hachura)
// Regra de composição: tudo o que importa fica na coluna central (SEGURO),
// para o corte 9:16 funcionar sem perder informação.
import {
  W, H, C, SEGURO, clamp, lerp, prog, janela, easeOut, easeInOut, easeIn, easeOutBack, hash,
  texto, selo, digitar, faixa, carimbo, seta, pulso, rotulo, rrect, fonte, tanque, ogiva, soldado, igreja, coroa,
  livro, carro, urna, caminhao, pessoa, explosao, foiceMartelo, marcador, globo, kremlin, cupulas, bandeira,
  documento, pizza, fmt, estrela,
} from './desenho.js';
import { camera, URSS, OTAN_ANTES, OTAN_1999, OTAN_2004, FORA_DO_IMPERIO, DNIEPRE, CIDADES } from './mapa.js';

const UA = [31.4, 48.6, 1600]; // enquadramento da Ucrânia inteira na coluna segura

// Ucrânia com as cores da bandeira (azul em cima, amarelo embaixo).
function ucraniaBandeira(ctx, K, cam, alpha = 1, o = {}) {
  const { semCrimeia = false, contorno = true } = o;
  if (alpha <= 0) return;
  const m = K.mapa;
  const forma = semCrimeia ? 'Ukraine' : 'Ucrânia';
  m.recortar(ctx, cam, forma);
  ctx.globalAlpha *= alpha;
  const [, ym] = m.proj(cam, 31, 49.2);
  ctx.fillStyle = '#1F5FC4';
  ctx.fillRect(0, 0, W, ym);
  ctx.fillStyle = '#E9B92C';
  ctx.fillRect(0, ym, W, H - ym);
  ctx.restore();
  if (contorno) m.pintar(ctx, cam, forma, { stroke: 'rgba(255,240,190,0.85)', lw: 2.5, alpha });
}

// Explosões nas cidades + setas da invasão de 24/02/2022.
function invasao(ctx, K, cam, t0, t, alpha = 1) {
  if (alpha <= 0 || t < t0) return;
  const m = K.mapa;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const cidades = ['kiev', 'kharkiv', 'dnipro', 'odessa'];
  cidades.forEach((c, i) => {
    const ti = t0 + i * 0.28;
    if (t < ti) return;
    const [x, y] = m.proj(cam, ...CIDADES[c]);
    explosao(ctx, x, y, 90, prog(t, ti, 0.7));
    pulso(ctx, x, y, t - ti, { cor: '#FF4A4A', r: 9, alpha: clamp((t - ti) * 3) });
  });
  const setas = [
    [[27.8, 52.4], [30.3, 50.8]],
    [[38.2, 51.5], [36.4, 50.2]],
    [[41.2, 48.9], [38.6, 48.3]],
    [[34.0, 45.4], [33.2, 46.8]],
  ];
  setas.forEach(([a, b], i) => {
    const p = easeOut(prog(t, t0 + 0.5 + i * 0.25, 1.6));
    const r = seta(ctx, m.proj(cam, ...a), m.proj(cam, ...b), p, { cor: '#E5363F', larg: 10, curva: 0.12 * (i % 2 ? -1 : 1) });
    if (r && p > 0.3) tanque(ctx, r.fim[0] - Math.cos(r.ang) * 60, r.fim[1] - Math.sin(r.ang) * 60, 44, '#8C1F27', 0);
  });
  ctx.restore();
}

// ============================================================ 1 · gancho
function gancho(ctx, t, K) {
  const m = K.mapa;
  const cam = camera(t, [[0, ...UA], [K.P(3), 24, 50.5, 820, 2.4]]);
  m.fundo(ctx, cam, 'moderno');
  m.pintar(ctx, cam, 'Rússia', { fill: 'rgba(198,47,58,0.18)' });
  ucraniaBandeira(ctx, K, cam, 0.9);
  invasao(ctx, K, cam, K.P(2), t);

  // retrocesso para o ano 900
  const r = prog(t, K.P(4) + 0.2, 2.4);
  if (t > K.P(4)) {
    m.fundo(ctx, cam, 'pergaminho', prog(t, K.P(4) + 1.2, 1.4));
    ctx.fillStyle = `rgba(4,7,14,${0.55 * janela(t, K.P(4), K.c1 + 1, 0.5)})`;
    ctx.fillRect(0, 0, W, H);
    // riscos de velocidade
    ctx.save();
    ctx.globalAlpha = 0.25 * Math.sin(Math.PI * r);
    ctx.strokeStyle = '#fff';
    for (let i = 0; i < 40; i++) {
      const y = hash(i) * H;
      const x = ((hash(i + 9) * W + t * 2600) % (W + 400)) - 200;
      ctx.lineWidth = 1 + hash(i + 3) * 3;
      ctx.beginPath();
      ctx.moveTo(W - x, y);
      ctx.lineTo(W - x + 160 + hash(i + 5) * 220, y);
      ctx.stroke();
    }
    ctx.restore();
    const ano = Math.round(lerp(2022, 900, easeIn(r)));
    texto(ctx, String(ano), SEGURO.cx, 500, { size: 168, weight: 800, alpha: clamp((t - K.P(4)) * 3), color: r >= 1 ? C.ouro : C.texto });
    texto(ctx, '2022 → ano 900', SEGURO.cx, 640, { size: 40, weight: 700, color: C.textoSec, alpha: clamp((t - K.P(4) - 0.3) * 2) });
  }

  if (t < K.P(4)) {
    selo(ctx, digitar('24/02/2022', prog(t, K.P(1) + 0.4, 0.9)) || ' ', prog(t, K.P(1) + 0.3, 0.6));
  }
  if (t > K.P(3) && t < K.P(4) + 0.3) {
    const a = janela(t, K.P(3) + 0.6, K.P(4) + 0.2, 0.4);
    faixa(ctx, 880, 210, 0.7 * a);
    texto(ctx, 'A maior invasão na Europa desde 1945', SEGURO.cx, 880, { size: 50, weight: 800, alpha: a });
  }
  // abertura a partir do preto
  ctx.fillStyle = `rgba(0,0,0,${1 - prog(t, K.P(1), 1.5)})`;
  ctx.fillRect(0, 0, W, H);
}

// ============================================================ 2 · abertura
function abertura(ctx, t, K) {
  const m = K.mapa;
  const t0 = K.P(5);
  const fusao = K.P(7);
  const camFundo = { lon: 31 + (t - K.c0) * 0.25, lat: 50, s: 900 };
  ctx.fillStyle = C.fundo;
  ctx.fillRect(0, 0, W, H);
  m.fundo(ctx, camFundo, 'noite', 0.5);

  // fusão e separação dos dois países
  if (t > fusao - 0.6) {
    const a = prog(t, fusao - 0.6, 0.8);
    const cam = { lon: 35.5, lat: 51.5, s: 1150 };
    m.fundo(ctx, cam, 'noite', a);
    const juntar = easeInOut(prog(t, fusao, 1.4));
    const ps = prog(t, fusao + 2.4, 0.7);
    const separar = ps > 0 ? easeOutBack(ps) : 0;
    const d = 160 * (1 - juntar) + 46 * separar;
    const ouro = clamp(juntar * 1.4 - 0.4) * (1 - separar);
    const corRu = mix('#C62F3A', C.ouro, ouro);
    const corUa = mix('#2C6BD6', C.ouro, ouro);
    m.pintar(ctx, cam, 'Rússia', { fill: corRu, stroke: 'rgba(255,255,255,0.5)', lw: 2, alpha: a * 0.92, desloc: [d * 0.8, -d * 0.6] });
    m.pintar(ctx, cam, 'Ucrânia', { fill: corUa, stroke: 'rgba(255,255,255,0.5)', lw: 2, alpha: a * 0.92, desloc: [-d * 0.8, d * 0.6] });
    if (ps > 0 && ps < 1) {
      ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - ps)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // vinheta: globo + nome do canal, depois selo da cápsula
  const sobe = easeInOut(prog(t, K.P(6) - 0.2, 0.9));
  const some = 1 - prog(t, fusao - 0.4, 0.6);
  if (some > 0) {
    ctx.save();
    ctx.globalAlpha = some;
    const gy = lerp(380, 250, sobe);
    const ge = easeOutBack(prog(t, t0, 0.8)) * lerp(1, 0.7, sobe);
    if (ge > 0) globo(ctx, SEGURO.cx, gy, 120 * ge, t, C.texto);
    const ty = lerp(600, 420, sobe);
    const ts = lerp(1, 0.78, sobe);
    texto(ctx, 'GUERRAS', SEGURO.cx, ty, { size: 104 * ts, weight: 800, alpha: prog(t, t0 + 0.3, 0.5) });
    texto(ctx, 'DO PRESENTE', SEGURO.cx, ty + 84 * ts, { size: 50 * ts, weight: 700, color: C.textoSec, alpha: prog(t, t0 + 0.55, 0.5) });
    const lw = 300 * easeOut(prog(t, t0 + 0.7, 0.6)) * ts;
    ctx.fillStyle = '#E5363F';
    ctx.fillRect(SEGURO.cx - lw / 2, ty + 132 * ts, lw, 6);
    // selo da cápsula
    const sp = prog(t, K.P(6), 0.6);
    if (sp > 0) {
      const x = lerp(SEGURO.cx + 400, SEGURO.cx, easeOut(sp));
      texto(ctx, 'RÚSSIA x UCRÂNIA', x, 660, { size: 48, weight: 800, alpha: sp, maxW: 600 });
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i === 0 ? '#E5363F' : 'rgba(255,255,255,0.25)';
        rrect(ctx, x - 70 + i * 50, 720, 40, 40, 6);
        ctx.fill();
      }
      texto(ctx, '1/3', x, 800, { size: 34, weight: 700, color: C.textoSec, alpha: sp });
    }
    ctx.restore();
  }
}

function mix(a, b, p) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], clamp(p)))).join(',')})`;
}

// ============================================================ 3 · Rus de Kiev
function rus(ctx, t, K) {
  const m = K.mapa;
  const cam = camera(t, [[K.c0, 31.2, 52.6, 1250], [K.c0 + 0.01, 31.2, 52.6, 1420, K.c1 - K.c0]]);
  m.fundo(ctx, cam, 'pergaminho');
  const kiev = m.proj(cam, ...CIDADES.kiev);

  // área da Rus revelada a partir de Kiev
  const rev = easeOut(prog(t, K.P(9), 2.6));
  if (rev > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(kiev[0], kiev[1], rev * 1100, 0, Math.PI * 2);
    ctx.clip();
    m.pintar(ctx, cam, 'Rus de Kiev', { fill: 'rgba(217,174,85,0.55)', stroke: 'rgba(255,220,140,0.9)', lw: 3 });
    ctx.restore();
    // ondas da fé se espalhando
    for (let k = 0; k < 3; k++) {
      const f = ((t - K.P(9)) / 2.2 + k / 3) % 1;
      if (t < K.P(9) + k * 0.7) continue;
      ctx.strokeStyle = `rgba(255,225,150,${0.5 * (1 - f)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(kiev[0], kiev[1], 40 + f * 380, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  m.linha(ctx, cam, DNIEPRE, easeInOut(prog(t, K.P(8), 3.2)), { cor: '#7FB2E5', lw: 7 });
  if (t > K.P(8) + 2) {
    pulso(ctx, kiev[0], kiev[1], t, { cor: C.ouro, r: 11, alpha: prog(t, K.P(8) + 2, 0.4) });
    rotulo(ctx, 'Kiev', kiev[0], kiev[1] + 4, { size: 30, alpha: prog(t, K.P(8) + 2.2, 0.4), align: 'right', dx: 26 });
    rotulo(ctx, 'rio Dniepre', ...m.proj(cam, 29.9, 54.1), { size: 22, cor: '#BFD9F2', align: 'right', alpha: prog(t, K.P(8) + 2.6, 0.5) });
  }
  const ie = easeOutBack(prog(t, K.P(9) + 0.3, 0.8));
  if (ie > 0) igreja(ctx, kiev[0] + 4, kiev[1] - 70, 96 * ie);

  // três bandeiras disputando o mesmo berço
  const alvo = m.proj(cam, 33.6, 56.4);
  ['ru', 'ua', 'by'].forEach((b, i) => {
    const p = easeOutBack(prog(t, K.P(10) + i * 0.25, 0.7));
    if (p <= 0) return;
    const x = SEGURO.cx + (i - 1) * 180;
    const y = lerp(1180, 920, p);
    const pa = easeInOut(prog(t, K.P(10) + 0.9 + i * 0.2, 1.4));
    seta(ctx, [x, y - 70], [alvo[0] + (i - 1) * 30, alvo[1] + 40], pa, { cor: ['#E8E8E8', '#F4C430', '#E05555'][i], larg: 7, curva: (1 - i) * 0.25, ponta: 22, alpha: 0.9 });
    bandeira(ctx, b, x, y, 140, 92);
    texto(ctx, ['Rússia', 'Ucrânia', 'Belarus'][i], x, y + 72, { size: 24, weight: 700, alpha: p });
  });
  // quem é o herdeiro?
  const q = easeOutBack(prog(t, K.P(11), 0.6));
  if (q > 0) {
    texto(ctx, '?', alvo[0], alvo[1] - 20, { size: 220 * q, weight: 800, color: '#FFF4D6' });
  }

  if (t < K.P(9)) selo(ctx, 'Rus de Kiev · séc. IX', prog(t, K.P(8) + 0.4, 0.6));
  else if (t < K.P(11)) selo(ctx, '988 · batismo de Vladimir', prog(t, K.P(9) + 0.3, 0.6));
  else selo(ctx, 'Quem é o herdeiro?', prog(t, K.P(11) + 0.2, 0.6), { cor: '#FFE7A8' });
}

// ============================================================ 4 · Império Russo
const IMPERIO = [...URSS.filter((n) => n !== 'Ukraine'), 'Finland', 'Poland', 'Crimeia'];

function imperio(ctx, t, K) {
  const m = K.mapa;
  const cam = camera(t, [
    [K.c0, 31.2, 52.6, 1420],
    [K.P(12) + 0.2, 36, 53.6, 1050, 2.2],
    [K.P(13), 36, 55, 640, 2.0],
    [K.P(14), ...UA, 1.8],
  ]);
  m.fundo(ctx, cam, 'pergaminho');
  // a Rus dourada se apaga com as invasões
  m.pintar(ctx, cam, 'Rus de Kiev', { fill: 'rgba(217,174,85,0.55)', stroke: 'rgba(255,220,140,0.9)', lw: 3, alpha: 1 - prog(t, K.P(12) + 1, 2) });
  // setas da Horda Dourada
  [[[58, 47], [42, 50.5]], [[59, 53], [43.5, 54.5]], [[54, 43], [40.5, 47.6]]].forEach(([a, b], i) => {
    const p = easeOut(prog(t, K.P(12) + 0.2 + i * 0.3, 1.5));
    seta(ctx, m.proj(cam, ...a), m.proj(cam, ...b), p, { cor: '#9B4A2E', larg: 12, curva: 0.1, alpha: 1 - prog(t, K.P(13), 1) });
  });
  // a coroa vai de Kiev para Moscou
  const cp = easeInOut(prog(t, K.P(12) + 1.6, 2.4));
  if (t > K.P(12) + 0.8 && t < K.P(13) + 1.5) {
    const a = m.proj(cam, ...CIDADES.kiev);
    const b = m.proj(cam, ...CIDADES.moscou);
    ctx.save();
    ctx.globalAlpha = prog(t, K.P(12) + 0.8, 0.5) * (1 - prog(t, K.P(13) + 0.8, 0.6));
    coroa(ctx, lerp(a[0], b[0], cp), lerp(a[1], b[1], cp) - 50 - Math.sin(cp * Math.PI) * 60, 70);
    rotulo(ctx, 'Moscou', b[0], b[1], { size: 26, alpha: cp });
    if (cp > 0.9) pulso(ctx, b[0], b[1], t, { cor: C.ouro, r: 9 });
    ctx.restore();
  }
  // o Império se expande a partir de Moscou
  const ep = easeOut(prog(t, K.P(13) + 0.3, 2.6));
  if (ep > 0) {
    const mo = m.proj(cam, ...CIDADES.moscou);
    ctx.save();
    ctx.beginPath();
    ctx.arc(mo[0], mo[1], ep * 1600, 0, Math.PI * 2);
    ctx.clip();
    const regioes = Object.keys(K.mapa.geo.regioes).filter((r) => !FORA_DO_IMPERIO.includes(r)).map((r) => `r:${r}`);
    m.pintar(ctx, cam, [...IMPERIO, ...regioes], { fill: 'rgba(122,28,34,0.72)' });
    m.pintar(ctx, cam, IMPERIO, { stroke: 'rgba(255,190,150,0.25)', lw: 1.2 });
    ctx.restore();
  }
  // "Pequena Rússia"
  if (t > K.P(14)) {
    const [x, y] = m.proj(cam, 32.5, 49.2);
    m.pintar(ctx, cam, 'Ucrânia', { stroke: 'rgba(255,240,200,0.8)', lw: 2.5, alpha: prog(t, K.P(14) + 0.3, 0.6) * (1 - prog(t, K.P(15), 0.4)) });
    ctx.save();
    ctx.globalAlpha = 1 - prog(t, K.P(15), 0.4);
    carimbo(ctx, 'PEQUENA RÚSSIA', clamp(x, 700, 1220), y, prog(t, K.P(14) + 0.6, 0.6), { cor: '#F0C766', size: 56, rot: -0.1 });
    ctx.restore();
  }
  // livro proibido
  if (t > K.P(15)) {
    const a = prog(t, K.P(15), 0.5);
    ctx.fillStyle = `rgba(20,12,6,${0.7 * a})`;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = a;
    const fecha = easeInOut(prog(t, K.P(15) + 0.6, 0.9));
    livro(ctx, SEGURO.cx - fecha * 140, 500, 330, fecha);
    ctx.restore();
    carimbo(ctx, 'PROIBIDO', SEGURO.cx, 540, prog(t, K.P(15) + 1.3, 0.6), { size: 76, rot: -0.16 });
    texto(ctx, 'Decreto de Ems, 1876', SEGURO.cx, 820, { size: 42, weight: 700, alpha: prog(t, K.P(15) + 1.6, 0.5) });
  }

  if (t < K.P(13)) selo(ctx, 'séc. XIII · invasões mongóis', prog(t, K.P(12) + 0.4, 0.6));
  else if (t < K.P(15)) selo(ctx, t < K.P(14) ? 'Império Russo' : 'séc. XIX', prog(t, K.P(13) + 0.6, 0.6));
}

// ============================================================ 5 · URSS e Holodomor
function urss(ctx, t, K) {
  const m = K.mapa;
  const cam = camera(t, [[K.c0, 45, 52, 620], [K.P(17), ...UA, 1.8]]);
  m.fundo(ctx, cam, 'sovietico');
  m.pintar(ctx, cam, [...URSS, 'Crimeia'], { fill: 'rgba(150,32,40,0.7)', stroke: 'rgba(255,150,150,0.35)', lw: 1.2 });
  m.pintar(ctx, cam, 'Ucrânia', { stroke: '#FFFFFF', lw: 3.5, brilho: 14, alpha: prog(t, K.P(16) + 0.8, 0.6) });
  const fm = easeOutBack(prog(t, K.P(16) + 0.3, 0.7));
  if (fm > 0 && t < K.P(17) + 0.5) {
    ctx.save();
    ctx.globalAlpha = 1 - prog(t, K.P(17), 0.5);
    foiceMartelo(ctx, SEGURO.cx, 250, 110 * fm);
    ctx.restore();
  }

  // trigo que seca e caminhões que levam a colheita
  const tr = prog(t, K.P(17), 1.2);
  if (tr > 0) {
    const seca = prog(t, K.P(17) + 3.2, 2.4);
    m.recortar(ctx, cam, 'Ucrânia');
    ctx.globalAlpha = tr;
    ctx.fillStyle = mix('#8A6A22', '#55524C', seca);
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = mix('#E8C25A', '#8C8A84', seca);
    ctx.lineWidth = 3;
    for (let i = 0; i < 900; i++) {
      const x = 560 + hash(i) * 820;
      const y = 300 + hash(i + 400) * 520;
      const h = 14 + hash(i + 800) * 10;
      const bal = Math.sin(t * 2 + i) * 3 * (1 - seca);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + bal, y - h);
      ctx.stroke();
    }
    ctx.restore();
    m.pintar(ctx, cam, 'Ucrânia', { stroke: '#FFFFFF', lw: 3, alpha: tr });
    for (let k = 0; k < 3; k++) {
      const p = prog(t, K.P(17) + 1.2 + k * 0.7, 3.2);
      if (p <= 0 || p >= 1) continue;
      const a = m.proj(cam, 31 + k * 0.6, 48.4 + k * 0.5);
      const b = m.proj(cam, 39.5, 52.6);
      ctx.save();
      ctx.globalAlpha = clamp(Math.min(p * 4, (1 - p) * 4));
      caminhao(ctx, lerp(a[0], b[0], p), lerp(a[1], b[1], p), 70);
      ctx.restore();
    }
    texto(ctx, 'Coletivização forçada', SEGURO.cx, 900, { size: 44, weight: 800, alpha: janela(t, K.P(17) + 0.6, K.P(18), 0.5) });
  }

  // Holodomor: silhuetas que se apagam (sem fotos de vítimas)
  const dk = prog(t, K.P(18), 1);
  if (dk > 0) {
    ctx.fillStyle = `rgba(6,4,4,${0.88 * dk})`;
    ctx.fillRect(0, 0, W, H);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) {
      const i = r * 8 + c;
      const ap = prog(t, K.P(18) + 0.8 + i * 0.16, 0.8);
      ctx.save();
      ctx.globalAlpha = dk * lerp(0.9, 0.12, ap) * (1 - prog(t, K.P(19), 0.6) * 0.6);
      pessoa(ctx, 712 + c * 71, 610 + r * 110, 62, '#9AA0A8');
      ctx.restore();
    }
    const at = janela(t, K.P(18) + 0.4, K.P(19), 0.5);
    texto(ctx, '1932–1933', SEGURO.cx, 300, { size: 84, weight: 800, alpha: at });
    texto(ctx, '3,5 a 5 milhões de mortos', SEGURO.cx, 400, { size: 38, weight: 700, alpha: at, maxW: 600 });
    texto(ctx, '(estimativas de historiadores)', SEGURO.cx, 452, { size: 28, weight: 500, family: 'Inter', color: C.textoSec, alpha: at });
  }
  if (t > K.P(19)) {
    const p = prog(t, K.P(19), 0.6);
    const troca = prog(t, K.P(19) + 1.8, 0.6);
    texto(ctx, 'Голодомор', SEGURO.cx, 420, { size: 92, weight: 800, alpha: p * (1 - troca) });
    texto(ctx, 'Holodomor', SEGURO.cx, 420, { size: 92, weight: 800, alpha: troca });
    texto(ctx, '= “matar pela fome”', SEGURO.cx, 530, { size: 46, weight: 700, color: '#E8C25A', alpha: troca });
  }

  if (t < K.P(17)) selo(ctx, 'URSS · 1922', prog(t, K.P(16) + 0.5, 0.6), { cor: '#FFD3D3' });
}

// ============================================================ 6 · Independência
function independencia(ctx, t, K) {
  const m = K.mapa;
  const cam = camera(t, [[K.c0, 45, 52, 620], [K.P(21) - 0.6, ...UA, 1.6]]);
  const moderno = prog(t, K.P(21) - 0.6, 1.2);
  m.fundo(ctx, cam, 'sovietico');
  m.fundo(ctx, cam, 'moderno', moderno);
  // a URSS racha em 15 peças
  const racha = easeOut(prog(t, K.P(20) + 0.4, 1.6));
  const centroU = m.proj(cam, 62, 50);
  const lista = [...URSS.filter((n) => n !== 'Ukraine'), 'Ucrânia'];
  for (const n of lista) {
    const ref = n === 'Ucrânia' ? [31.4, 48.6] : m.centro(n);
    const [x, y] = m.proj(cam, ...ref);
    const d = Math.hypot(x - centroU[0], y - centroU[1]) || 1;
    const off = [((x - centroU[0]) / d) * 34 * racha * (1 - moderno), ((y - centroU[1]) / d) * 34 * racha * (1 - moderno)];
    const ua = n === 'Ucrânia';
    m.pintar(ctx, cam, n, {
      fill: ua ? 'rgba(150,32,40,0.7)' : `rgba(150,32,40,${0.7 * (1 - moderno * 0.6)})`,
      stroke: `rgba(255,255,255,${0.25 + racha * 0.5})`, lw: 1.6, desloc: off,
    });
  }
  // Ucrânia ganha a bandeira
  ucraniaBandeira(ctx, K, cam, prog(t, K.P(21), 0.8));
  // regiões acendem uma a uma, terminando na Crimeia
  if (t > K.P(22)) {
    const ids = Object.keys(m.geo.regioes).filter((r) => r !== 'crimea' && r !== 'kyiv-city');
    ids.sort((a, b) => m.centro(`r:${a}`)[0] - m.centro(`r:${b}`)[0]);
    [...ids, 'crimea'].forEach((id, i) => {
      const ti = K.P(22) + i * 0.11;
      if (t < ti) return;
      const f = prog(t, ti, 0.5);
      m.pintar(ctx, cam, `r:${id}`, { fill: `rgba(255,255,255,${0.55 * (1 - f) + 0.08})`, stroke: 'rgba(255,255,255,0.8)', lw: 1.5 });
    });
    const tc = K.P(22) + ids.length * 0.11;
    if (t > tc) {
      const [x, y] = m.proj(cam, 34.2, 45.3);
      pulso(ctx, x, y, t - tc, { cor: '#FFFFFF', r: 10 });
      rotulo(ctx, 'Crimeia', x, y + 50, { size: 28, align: 'center', alpha: prog(t, tc, 0.4) });
    }
  }
  // pizza do referendo
  const pz = prog(t, K.P(21) + 0.3, 0.6);
  if (pz > 0) {
    const fr = 0.903 * easeOut(prog(t, K.P(21) + 0.5, 1.4));
    ctx.save();
    ctx.globalAlpha = pz;
    faixa(ctx, 930, 190, 0.6);
    pizza(ctx, 800, 930, 66, fr, '#2C6BD6');
    texto(ctx, `${(fr * 100).toFixed(1).replace('.', ',')}%`, 900, 905, { size: 64, weight: 800, align: 'left' });
    texto(ctx, 'votaram SIM', 902, 965, { size: 32, weight: 700, align: 'left', color: C.amarelo });
    ctx.restore();
  }
  if (t < K.P(21)) selo(ctx, '1991', prog(t, K.P(20) + 0.3, 0.6));
  else selo(ctx, 'Referendo · 01/12/1991', prog(t, K.P(21) + 0.2, 0.6));
}

// ============================================================ 7 · Budapeste
const OGIVAS = [[25.5, 50.3], [28.4, 51.0], [31.2, 50.7], [34.0, 50.4], [26.8, 48.6], [29.8, 48.9], [32.8, 48.6], [35.8, 48.9], [30.6, 47.3]];

function budapeste(ctx, t, K) {
  const m = K.mapa;
  const cam = camera(t, [[K.c0, ...UA]]);
  m.fundo(ctx, cam, 'moderno');
  m.pintar(ctx, cam, 'Rússia', { fill: 'rgba(198,47,58,0.25)' });
  ucraniaBandeira(ctx, K, cam, 0.55);
  // fronteira que brilha (a garantia)
  const brilho = prog(t, K.P(25) + 0.6, 0.8);
  if (brilho > 0) m.pintar(ctx, cam, 'Ucrânia', { stroke: '#FFFFFF', lw: 4, brilho: 24, alpha: brilho * (0.75 + 0.25 * Math.sin(t * 4)) });

  // ogivas: aparecem e depois seguem em fila para a Rússia
  const destino = m.proj(cam, 39.6, 52.6);
  OGIVAS.forEach((pos, i) => {
    const ap = easeOutBack(prog(t, K.P(23) + 0.2 + i * 0.12, 0.5));
    if (ap <= 0) return;
    const [x0, y0] = m.proj(cam, ...pos);
    const v = easeInOut(prog(t, K.P(24) + i * 0.16, 1.3));
    if (v >= 1) return;
    const x = lerp(x0, destino[0] - i * 6, v);
    const y = lerp(y0, destino[1] + i * 4, v);
    ctx.save();
    ctx.globalAlpha = 1 - prog(v, 0.75, 0.25);
    ogiva(ctx, x, y, 52 * ap * lerp(1, 0.7, v));
    ctx.restore();
  });
  // pódio do arsenal (1º Rússia, 2º EUA, 3º Ucrânia)
  const pd = janela(t, K.P(23) + 0.8, K.P(24) + 0.3, 0.5);
  if (pd > 0) {
    ctx.save();
    ctx.globalAlpha = pd;
    faixa(ctx, 930, 260, 0.75);
    const deg = [[840, 92, 'us', '2º', 'EUA'], [960, 130, 'ru', '1º', 'Rússia'], [1080, 66, 'ua', '3º', 'Ucrânia']];
    for (const [x, h, b, pos, nome] of deg) {
      const ua = b === 'ua';
      ctx.fillStyle = ua ? 'rgba(244,196,48,0.9)' : 'rgba(255,255,255,0.18)';
      ctx.fillRect(x - 54, 1040 - h, 108, h);
      texto(ctx, pos, x, 1040 - h / 2, { size: 36, weight: 800, color: ua ? '#1B2433' : C.texto, sombra: false });
      bandeira(ctx, b, x, 1040 - h - 34, 66, 44);
      texto(ctx, nome, x, 1040 - h - 76, { size: 22, weight: 700 });
    }
    ctx.restore();
  }
  // o memorando
  const dp = janela(t, K.P(25), K.P(26), 0.4);
  if (dp > 0) {
    documento(ctx, SEGURO.cx, 540, 470, 360, {
      titulo: 'Memorando de Budapeste', sub: 'Budapeste, 05/12/1994', linhas: 4, bandeiras: ['ru', 'us', 'uk'],
      assinatura: prog(t, K.P(25) + 0.8, 1.6), alpha: dp, rot: -0.02,
    });
  }
  // guarde essa promessa
  const mk = easeOutBack(prog(t, K.P(26), 0.6));
  if (mk > 0) {
    const vai = easeInOut(prog(t, K.P(26) + 2.2, 0.9));
    ctx.fillStyle = `rgba(4,7,14,${0.6 * mk * (1 - vai)})`;
    ctx.fillRect(0, 0, W, H);
    marcador(ctx, lerp(SEGURO.cx, MARCADOR.x, vai), lerp(470, MARCADOR.y, vai), lerp(190, MARCADOR.s, vai) * mk);
    texto(ctx, 'Guarde essa promessa', SEGURO.cx, 760, { size: 52, weight: 800, alpha: mk * (1 - vai), color: C.amarelo });
  }

  if (t < K.P(24)) selo(ctx, '3º maior arsenal nuclear', prog(t, K.P(23) + 0.4, 0.6));
  else if (t < K.P(26)) selo(ctx, '1994', prog(t, K.P(24), 0.5));
}

export const MARCADOR = { x: 1212, y: 210, s: 64 };

// ============================================================ 8 · entre dois lados
function doisLados(ctx, t, K) {
  const m = K.mapa;
  const cam = camera(t, [
    [K.c0, 28, 50.2, 1150],
    [K.P(28) - 0.2, ...CIDADES.kiev, 4200, 1.5],
    [K.P(29) - 0.3, 25.5, 52.5, 820, 1.7],
  ]);
  m.fundo(ctx, cam, 'moderno');
  const otan = t > K.P(29) - 0.3;
  m.pintar(ctx, cam, 'Rússia', { fill: 'rgba(198,47,58,0.42)' });
  if (otan) {
    const fase = (lista, t0) => m.pintar(ctx, cam, lista, { fill: 'rgba(42,85,168,0.85)', stroke: 'rgba(160,190,255,0.6)', lw: 1.2, alpha: prog(t, t0, 0.6) });
    fase(OTAN_ANTES, K.P(29) + 0.5);
    fase(OTAN_1999, K.P(29) + 1.6);
    fase(OTAN_2004, K.P(29) + 2.7);
  }
  // Ucrânia puxada pelos dois lados
  const ten = t < K.P(28) ? Math.sin((t - K.c0) * 2.4) * 12 : 0;
  ucraniaBandeira(ctx, K, { ...cam, lon: cam.lon - ten / cam.s / (Math.PI / 180) }, 0.9);
  const cordas = janela(t, K.P(27) + 0.3, K.P(28) - 0.2, 0.4);
  if (cordas > 0) {
    const [xa, ya] = m.proj(cam, 23.4, 49.6);
    const [xb, yb] = m.proj(cam, 39.6, 48.9);
    const corda = (x0, y0, x1, y1, cor) => {
      ctx.save();
      ctx.globalAlpha = cordas;
      ctx.strokeStyle = cor;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 8, x1, y1);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 12]);
      ctx.lineDashOffset = t * 30;
      ctx.stroke();
      ctx.restore();
    };
    corda(xa + ten, ya, -40, ya - 20, '#3D7BE0');
    corda(xb + ten, yb, W + 40, yb - 30, '#D9363F');
    texto(ctx, '← Europa', 700, ya - 90, { size: 34, weight: 800, align: 'left', alpha: cordas, color: '#9CC2FF' });
    texto(ctx, 'Rússia →', 1222, yb - 110, { size: 34, weight: 800, align: 'right', alpha: cordas, color: '#FF9C9C' });
  }
  // Revolução Laranja
  const rl = janela(t, K.P(28) + 0.6, K.P(29) - 0.2, 0.5);
  if (rl > 0) {
    ctx.save();
    ctx.globalAlpha = rl;
    ctx.fillStyle = 'rgba(4,7,14,0.45)';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) {
      const ti = K.P(28) + 0.6 + hash(i) * 1.6;
      if (t < ti) continue;
      const a = hash(i + 30) * Math.PI * 2;
      const r = Math.sqrt(hash(i + 60));
      const x = SEGURO.cx + Math.cos(a) * r * 290;
      const y = 600 + Math.sin(a) * r * 170;
      ctx.fillStyle = i % 9 === 0 ? '#FFD08A' : '#F28C28';
      ctx.beginPath();
      ctx.arc(x, y + Math.sin(t * 6 + i) * 2, 9 + hash(i + 90) * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    urna(ctx, SEGURO.cx, 520, 150);
    ctx.restore();
    carimbo(ctx, 'ANULADA', SEGURO.cx, 560, prog(t, K.P(28) + 2.2, 0.6), { size: 64, rot: -0.14 });
  }
  // balões: ameaça x proteção
  if (t > K.P(30)) {
    const mo = m.proj(cam, ...CIDADES.moscou);
    const po = m.proj(cam, ...CIDADES.varsovia);
    balao(ctx, 'Ameaça', clamp(mo[0], 860, 1150), mo[1] - 120, mo, prog(t, K.P(30), 0.5), '#C62F3A');
    balao(ctx, 'Proteção', clamp(po[0], 780, 1100), po[1] + 150, po, prog(t, K.F(4), 0.5), '#2A55A8');
  }

  if (t < K.P(28)) selo(ctx, 'Europa ou Rússia?', prog(t, K.P(27) + 0.4, 0.6));
  else if (t < K.P(29)) selo(ctx, '2004 · Revolução Laranja', prog(t, K.P(28) + 0.5, 0.6), { cor: '#FFC27A' });
  else {
    const anos = t < K.P(29) + 1.6 ? 'OTAN' : t < K.P(29) + 2.7 ? 'OTAN: 1999' : 'OTAN: 1999 · 2004';
    selo(ctx, anos, prog(t, K.P(29) + 0.4, 0.6), { cor: '#BCD2FF' });
  }
}

function balao(ctx, str, x, y, alvo, p, cor) {
  if (p <= 0) return;
  const e = easeOutBack(p);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(e, e);
  fonte(ctx, 40, 800);
  const w = ctx.measureText(str).width + 56;
  const h = 76;
  ctx.fillStyle = cor;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 16;
  rrect(ctx, -w / 2, -h / 2, w, h, 20);
  ctx.fill();
  const tx = (alvo[0] - x) / e;
  const ty = (alvo[1] - y) / e;
  const lado = ty > 0 ? h / 2 - 2 : -h / 2 + 2;
  ctx.beginPath();
  ctx.moveTo(-16, lado);
  ctx.lineTo(16, lado);
  ctx.lineTo(tx * 0.85, ty * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, 0, 2);
  ctx.restore();
  pulso(ctx, alvo[0], alvo[1], p * 3, { cor, r: 8 });
}

// ============================================================ 9 · Euromaidan
function euromaidan(ctx, t, K) {
  const m = K.mapa;
  const camK = { lon: CIDADES.kiev[0] + (t - K.c0) * 0.01, lat: CIDADES.kiev[1], s: 2600 };
  const mapa = t > K.P(33) - 0.4;
  const cam = camera(t, [[K.c0, ...CIDADES.kiev, 2600], [K.P(33) - 0.4, 34.2, 50.4, 1350, 1.4]]);
  m.fundo(ctx, mapa ? cam : camK, 'noite');
  ucraniaBandeira(ctx, K, mapa ? cam : camK, mapa ? 0.6 : 0.25);
  m.pintar(ctx, mapa ? cam : camK, 'Rússia', { fill: 'rgba(198,47,58,0.3)' });
  ctx.fillStyle = `rgba(4,7,14,${0.55 * (1 - prog(t, K.P(33) - 0.4, 1))})`;
  ctx.fillRect(0, 0, W, H);

  // acordo rasgado
  const dp = janela(t, K.P(31) + 0.2, K.P(32), 0.4);
  if (dp > 0) {
    const rasga = easeOut(prog(t, K.F(0) + (K.Ff(0) - K.F(0)) * 0.72, 0.9));
    for (const lado of [-1, 1]) {
      ctx.save();
      ctx.translate(SEGURO.cx + lado * rasga * 70, 540 + rasga * 30);
      ctx.rotate(lado * rasga * 0.18);
      ctx.beginPath();
      if (lado < 0) {
        ctx.moveTo(-400, -300);
        ctx.lineTo(4, -300);
        for (let i = 0; i <= 12; i++) ctx.lineTo(i % 2 ? -10 : 8, -200 + i * 34);
        ctx.lineTo(-400, 300);
      } else {
        ctx.moveTo(400, -300);
        ctx.lineTo(4, -300);
        for (let i = 0; i <= 12; i++) ctx.lineTo(i % 2 ? -10 : 8, -200 + i * 34);
        ctx.lineTo(400, 300);
      }
      ctx.closePath();
      ctx.clip();
      documento(ctx, 0, 0, 460, 380, { titulo: 'Acordo de Associação\ncom a União Europeia', linhas: 5, bandeiras: ['ua', 'eu'], alpha: dp });
      ctx.restore();
    }
  }
  // a praça Maidan
  const pm = janela(t, K.P(32), K.P(33) - 0.3, 0.5);
  if (pm > 0) maidan(ctx, t, K, pm);

  // a fuga
  if (mapa) {
    const kv = m.proj(cam, ...CIDADES.kiev);
    const fim = m.linha(ctx, cam, [CIDADES.kiev, [33.5, 50.6], [36.3, 50.9], [38.8, 51.2]], easeInOut(prog(t, K.P(33) + 0.4, 2.8)), { cor: 'rgba(255,255,255,0.85)', lw: 4, tracejado: [14, 12] });
    pulso(ctx, kv[0], kv[1], t, { cor: C.amarelo, r: 8 });
    rotulo(ctx, 'Kiev', kv[0], kv[1], { size: 26, align: 'right', dx: 24 });
    if (fim && t > K.P(33) + 0.4) carro(ctx, fim[0], fim[1] - 26, 62);
  }

  if (t < K.P(32)) selo(ctx, 'Nov. 2013', prog(t, K.P(31) + 0.4, 0.6));
  else if (t < K.P(33)) selo(ctx, 'Euromaidan', prog(t, K.P(32) + 0.3, 0.6));
  else selo(ctx, 'Fev. 2014', prog(t, K.P(33) + 0.3, 0.6));
}

function maidan(ctx, t, K, a) {
  ctx.save();
  ctx.globalAlpha = a;
  const cx = SEGURO.cx;
  // chão da praça
  const g = ctx.createRadialGradient(cx, 760, 40, cx, 760, 520);
  g.addColorStop(0, 'rgba(70,80,96,0.95)');
  g.addColorStop(1, 'rgba(20,26,38,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, 770, 560, 190, 0, 0, Math.PI * 2);
  ctx.fill();
  // fumaça
  for (let i = 0; i < 14; i++) {
    const f = ((t * 0.12 + hash(i)) % 1);
    ctx.fillStyle = `rgba(160,165,175,${0.22 * (1 - f)})`;
    ctx.beginPath();
    ctx.arc(cx - 300 + hash(i + 4) * 600, 720 - f * 520, 50 + f * 90, 0, Math.PI * 2);
    ctx.fill();
  }
  // monumento da Independência
  ctx.fillStyle = '#E8EAEE';
  ctx.fillRect(cx - 18, 300, 36, 430);
  ctx.fillRect(cx - 50, 700, 100, 40);
  ctx.fillStyle = C.ouro;
  ctx.beginPath();
  ctx.moveTo(cx, 220);
  ctx.lineTo(cx - 34, 270);
  ctx.lineTo(cx - 10, 268);
  ctx.lineTo(cx - 14, 302);
  ctx.lineTo(cx + 14, 302);
  ctx.lineTo(cx + 10, 268);
  ctx.lineTo(cx + 34, 270);
  ctx.closePath();
  ctx.fill();
  // barracas
  for (let i = 0; i < 16; i++) {
    const x = cx - 270 + (i % 8) * 77 + (i > 7 ? 38 : 0);
    const y = 800 + (i > 7 ? 70 : 0);
    ctx.fillStyle = ['#3D6FB6', '#E3A33A', '#7C8796', '#B9483E'][i % 4];
    ctx.beginPath();
    ctx.moveTo(x - 34, y);
    ctx.lineTo(x, y - 54);
    ctx.lineTo(x + 34, y);
    ctx.closePath();
    ctx.fill();
  }
  // bandeiras tremulando
  [[cx - 220, 'ua'], [cx + 220, 'eu'], [cx - 110, 'eu'], [cx + 120, 'ua']].forEach(([x, b], i) => {
    ctx.fillStyle = '#ccc';
    ctx.fillRect(x - 2, 560 + (i % 2) * 40, 4, 200);
    ctx.save();
    ctx.translate(Math.sin(t * 3 + i) * 3, 0);
    bandeira(ctx, b, x + 44, 590 + (i % 2) * 40, 84, 56);
    ctx.restore();
  });
  // contador de dias
  const d = Math.round(lerp(1, 90, easeInOut(prog(t, K.P(32) + 0.5, K.Ff(2) - K.P(32)))));
  if (t < K.F(2)) {
    faixa(ctx, 985, 110, 0.6);
    texto(ctx, `DIA ${d}`, cx, 985, { size: 52, weight: 800, color: C.amarelo });
  } else {
    faixa(ctx, 975, 120, 0.7);
    texto(ctx, '3 meses · mais de 100 mortos', cx, 975, { size: 40, weight: 800, alpha: prog(t, K.F(2), 0.5) });
  }
  ctx.restore();
}

// ============================================================ 10 · Crimeia e Donbas
const SOLDADOS = [[33.4, 45.9], [34.2, 45.8], [35.1, 45.6], [33.8, 45.2], [34.6, 45.0], [33.6, 44.7], [35.4, 45.2]];
const EXPLOSOES = [[37.6, 48.1], [38.2, 47.9], [38.9, 48.4], [39.4, 48.7], [37.9, 48.6], [38.6, 47.6], [39.8, 48.2], [37.3, 47.8]];

function crimeia(ctx, t, K) {
  const m = K.mapa;
  const cam = camera(t, [[K.c0, 34.3, 45.35, 5200], [K.P(36) - 0.2, 38.6, 48.3, 3300, 1.6]]);
  m.fundo(ctx, cam, 'moderno');
  m.pintar(ctx, cam, 'Rússia', { fill: 'rgba(198,47,58,0.3)' });
  ucraniaBandeira(ctx, K, cam, 0.8);
  // anexação: Crimeia em vermelho hachurado
  const an = prog(t, K.P(35), 1.2);
  if (an > 0) {
    m.pintar(ctx, cam, 'Crimeia', { fill: `rgba(198,47,58,${0.55 * an})` });
    m.pintar(ctx, cam, 'Crimeia', { fill: K.hach.vermelho, alpha: an, stroke: '#FF6B6B', lw: 3 });
  }
  // soldados sem insígnia
  SOLDADOS.forEach((pos, i) => {
    const p = easeOutBack(prog(t, K.P(34) + 0.3 + i * 0.18, 0.5));
    if (p <= 0) return;
    const [x, y] = m.proj(cam, ...pos);
    ctx.save();
    ctx.globalAlpha = 1 - prog(t, K.P(36) - 0.4, 0.5) * 0.8;
    soldado(ctx, x, y, 78 * p);
    ctx.restore();
  });
  const st = janela(t, K.P(35) + 0.5, K.P(36) - 0.2, 0.4);
  if (st > 0) {
    ctx.save();
    ctx.globalAlpha = st;
    carimbo(ctx, 'ANEXAÇÃO · MAR. 2014', SEGURO.cx, 860, prog(t, K.P(35) + 0.5, 0.6), { size: 50, rot: -0.06, sub: 'inválida para a Assembleia Geral da ONU', subSize: 22 });
    ctx.restore();
  }
  // Donbas
  if (t > K.P(36)) {
    const pd = prog(t, K.P(36) + 0.6, 0.6);
    m.pintar(ctx, cam, ['r:donetsk', 'r:luhansk'], { stroke: '#FF5A5A', lw: 4, brilho: 16, alpha: pd * (0.7 + 0.3 * Math.sin(t * 5)) });
    EXPLOSOES.forEach((pos, i) => {
      const ciclo = 1.3;
      const ti = K.P(36) + 1 + hash(i) * ciclo;
      if (t < ti) return;
      const [x, y] = m.proj(cam, ...pos);
      explosao(ctx, x, y, 70, ((t - ti) % ciclo) / 0.8);
    });
    const [dx, dy] = m.proj(cam, 37.8, 48.0);
    rotulo(ctx, 'Donetsk', dx, dy + 40, { size: 26, align: 'center', alpha: pd });
    const [lx, ly] = m.proj(cam, 39.3, 48.57);
    rotulo(ctx, 'Luhansk', lx, ly - 40, { size: 26, align: 'center', alpha: pd });
  }
  // a promessa quebrada
  if (t > K.P(37)) {
    const vem = easeInOut(prog(t, K.P(37), 0.8));
    ctx.fillStyle = `rgba(4,7,14,${0.6 * vem})`;
    ctx.fillRect(0, 0, W, H);
    marcador(ctx, lerp(MARCADOR.x, SEGURO.cx, vem), lerp(MARCADOR.y, 500, vem), lerp(MARCADOR.s, 200, vem), prog(t, K.P(37) + 0.9, 0.7));
    texto(ctx, 'Promessa quebrada', SEGURO.cx, 780, { size: 52, weight: 800, color: '#FF7A7A', alpha: prog(t, K.P(37) + 1.2, 0.5) });
  }

  if (t < K.P(36)) selo(ctx, '“Homenzinhos verdes”', prog(t, K.P(34) + 0.6, 0.6), { cor: '#CFE3B5' });
  else if (t < K.P(37)) selo(ctx, 'Donbas · abr. 2014', prog(t, K.P(36) + 0.5, 0.6), { cor: '#FFB4B4' });
}

// ============================================================ 11 · Minsk
function minsk(ctx, t, K) {
  const m = K.mapa;
  const donbas = t > K.F(1) - 0.3;
  const cam = donbas ? { lon: 38.6, lat: 48.3, s: 3300 } : { lon: CIDADES.minsk[0], lat: CIDADES.minsk[1], s: 2200 };
  m.fundo(ctx, cam, 'noite');
  ucraniaBandeira(ctx, K, cam, donbas ? 0.55 : 0.2);
  if (donbas) m.pintar(ctx, cam, ['r:donetsk', 'r:luhansk'], { stroke: '#FF5A5A', lw: 3, alpha: 0.8 });
  ctx.fillStyle = `rgba(4,7,14,${donbas ? 0.45 : 0.65})`;
  ctx.fillRect(0, 0, W, H);

  const mesa = janela(t, K.P(38), K.F(1) - 0.2, 0.5);
  if (mesa > 0) {
    ctx.save();
    ctx.globalAlpha = mesa;
    ctx.fillStyle = '#5A3E2B';
    ctx.beginPath();
    ctx.ellipse(SEGURO.cx, 640, 290, 120, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6E4C35';
    ctx.beginPath();
    ctx.ellipse(SEGURO.cx, 626, 290, 120, 0, 0, Math.PI * 2);
    ctx.fill();
    const nomes = [['ua', 'Ucrânia'], ['ru', 'Rússia'], ['osce', 'OSCE'], ['fr', 'França'], ['de', 'Alemanha']];
    nomes.forEach(([b, n], i) => {
      const p = easeOutBack(prog(t, K.P(38) + 0.2 + i * 0.15, 0.5));
      const x = 718 + i * 121;
      bandeira(ctx, b, x, 410, 96 * p, 64 * p);
      texto(ctx, n, x, 470, { size: 20, weight: 700, alpha: p });
    });
    documento(ctx, 868, 630, 176, 190, { titulo: 'Minsk I', sub: '2014', linhas: 3, rot: -0.07 });
    documento(ctx, 1052, 630, 176, 190, { titulo: 'Minsk II', sub: '2015', linhas: 3, rot: 0.06 });
    ctx.restore();
    carimbo(ctx, 'NÃO CUMPRIDO', SEGURO.cx, 640, prog(t, K.P(39), 0.6) * mesa, { size: 58, rot: -0.1 });
  }
  if (donbas) {
    const n = 14000 * easeOut(prog(t, K.F(1) + 0.2, (K.Ff(1) - K.F(1)) * 0.8));
    faixa(ctx, 560, 300, 0.6);
    texto(ctx, `~${fmt(n)}`, SEGURO.cx, 520, { size: 130, weight: 800, alpha: prog(t, K.F(1), 0.4) });
    texto(ctx, 'mortos (2014–2021)', SEGURO.cx, 630, { size: 44, weight: 700, color: C.textoSec, alpha: prog(t, K.F(1) + 0.2, 0.4) });
  }
  if (!donbas) selo(ctx, 'Acordos de Minsk', prog(t, K.P(38) + 0.4, 0.6));
  else selo(ctx, 'Donbas · 2014–2021', prog(t, K.F(1), 0.6));
}

// ============================================================ 12 · caminho até 2022
const TROPAS = [[24.6, 52.3], [26.2, 52.1], [27.8, 52.0], [29.4, 51.9], [30.9, 51.9], [33.0, 52.6], [34.6, 52.0],
  [35.9, 51.2], [37.3, 50.6], [38.6, 50.1], [39.9, 49.4], [40.4, 48.3], [40.1, 47.3], [33.4, 45.9], [34.9, 45.7]];

function caminho(ctx, t, K) {
  const m = K.mapa;
  const fase2 = t > K.P(41) - 0.4;
  const cam = fase2 ? camera(t, [[K.P(41) - 0.4, 32.2, 49.6, 1550]]) : { lon: 31.2, lat: 52.6, s: 1300 + (t - K.c0) * 10 };
  m.fundo(ctx, cam, fase2 ? 'moderno' : 'pergaminho');
  if (!fase2) {
    const heranca = prog(t, K.F(1), 1);
    m.pintar(ctx, cam, 'Rus de Kiev', { fill: `rgba(217,174,85,${0.3 + 0.35 * heranca})`, stroke: 'rgba(255,220,140,0.9)', lw: 3 });
    ctx.fillStyle = `rgba(20,12,6,${0.55 * (1 - heranca * 0.7)})`;
    ctx.fillRect(0, 0, W, H);
    const da = janela(t, K.P(40) + 0.2, K.F(1) + 0.4, 0.5);
    documento(ctx, SEGURO.cx, 520, 470, 420, {
      titulo: 'Об историческом единстве русских и украинцев', sub: 'Vladimir Putin · 12/07/2021', linhas: 6, alpha: da, rot: 0.02,
    });
    texto(ctx, '“Um só povo”', SEGURO.cx, 860, { size: 60, weight: 800, color: '#FFE2A0', alpha: prog(t, K.P(40) + 1.2, 0.6) * (1 - prog(t, K.P(41) - 0.8, 0.4)) });
    selo(ctx, 'jul. 2021', prog(t, K.P(40) + 0.4, 0.6));
    ctx.fillStyle = `rgba(0,0,0,${prog(t, K.P(41) - 0.9, 0.5)})`;
    ctx.fillRect(0, 0, W, H);
    return;
  }
  m.pintar(ctx, cam, 'Rússia', { fill: 'rgba(198,47,58,0.35)' });
  m.pintar(ctx, cam, 'Belarus', { fill: 'rgba(198,47,58,0.18)' });
  ucraniaBandeira(ctx, K, cam, 0.85, { semCrimeia: true });
  m.pintar(ctx, cam, 'Crimeia', { fill: K.hach.vermelho, stroke: '#FF6B6B', lw: 2 });
  ctx.fillStyle = `rgba(0,0,0,${1 - prog(t, K.P(41) - 0.4, 0.5)})`;
  ctx.fillRect(0, 0, W, H);

  // tropas se acumulando nas fronteiras
  for (let onda = 0; onda < 2; onda++) {
    TROPAS.forEach((pos, i) => {
      const k = onda * TROPAS.length + i;
      const p = easeOutBack(prog(t, K.P(41) + 0.3 + k * 0.1, 0.4));
      if (p <= 0) return;
      const [x, y] = m.proj(cam, pos[0] + onda * 0.5, pos[1] + onda * 0.4);
      if (k % 2) soldado(ctx, x, y, 46 * p, '#7E1E27');
      else tanque(ctx, x, y, 48 * p, '#9E2830');
    });
  }
  const cont = prog(t, K.P(41) + 0.4, 2.4);
  const docF = t > K.P(42);
  if (!docF || t < K.P(42) + 0.4) {
    faixa(ctx, 950, 150, 0.7 * (1 - prog(t, K.P(42), 0.4)));
    texto(ctx, `${fmt(100000 * easeOut(cont))}${cont >= 1 ? '+' : ''} soldados`, SEGURO.cx, 950, { size: 58, weight: 800, alpha: prog(t, K.P(41) + 0.4, 0.4) * (1 - prog(t, K.P(42), 0.4)) });
  }
  // exigências russas, recusadas
  const dp = janela(t, K.P(42), K.P(43) - 0.1, 0.4);
  if (dp > 0) {
    ctx.fillStyle = `rgba(4,7,14,${0.55 * dp})`;
    ctx.fillRect(0, 0, W, H);
    documento(ctx, SEGURO.cx, 540, 470, 400, { titulo: 'Exigências russas', sub: 'dezembro de 2021', linhas: 3, destaque: 'Ucrânia fora da OTAN', alpha: dp, rot: -0.02 });
    carimbo(ctx, 'RECUSADO', SEGURO.cx, 640, prog(t, K.F(3), 0.6) * dp, { size: 70, rot: -0.14 });
  }
  // calendário: 21 -> 24 de fevereiro, e a invasão
  if (t > K.P(43)) {
    const inv = K.F(5) + 0.9;
    const cal = 1 - prog(t, inv, 0.5);
    if (cal > 0) {
      ctx.fillStyle = `rgba(4,7,14,${0.6 * cal})`;
      ctx.fillRect(0, 0, W, H);
      calendario(ctx, SEGURO.cx, 520, prog(t, K.F(5), 0.6), easeOutBack(prog(t, K.P(43), 0.5)) * cal);
    }
    if (t > inv) invasao(ctx, K, cam, inv, t);
  }
  if (t < K.P(42)) selo(ctx, 'Fronteiras · 2021', prog(t, K.P(41) + 0.3, 0.6));
  else if (t < K.P(43)) selo(ctx, 'Dez. 2021', prog(t, K.P(42) + 0.2, 0.6));
  else if (t > K.F(5) + 0.9) selo(ctx, '24/02/2022', prog(t, K.F(5) + 1, 0.5), { cor: '#FFB4B4' });
}

function calendario(ctx, x, y, virada, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  const w = 300;
  const h = 340;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#F4F1EA';
  rrect(ctx, -w / 2, -h / 2, w, h, 18);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#C62F3A';
  rrect(ctx, -w / 2, -h / 2, w, 84, 18);
  ctx.fill();
  ctx.fillRect(-w / 2, -h / 2 + 50, w, 34);
  texto(ctx, 'FEVEREIRO 2022', 0, -h / 2 + 44, { size: 30, weight: 800, sombra: false });
  const flip = clamp(virada);
  const dia = flip < 0.5 ? '21' : '24';
  ctx.save();
  ctx.scale(1, Math.abs(Math.cos(flip * Math.PI)));
  texto(ctx, dia, 0, 50, { size: 170, weight: 800, color: '#1B2433', sombra: false });
  ctx.restore();
  ctx.restore();
}

// ============================================================ 13 · fechamento
const LINHA = [['988', 'Batismo da Rus de Kiev'], ['1922', 'Ucrânia na URSS'], ['1991', 'Independência'],
  ['1994', 'Memorando de Budapeste'], ['2004', 'Revolução Laranja'], ['2014', 'Crimeia e Donbas'], ['2022', 'Invasão']];

function fechamento(ctx, t, K) {
  const m = K.mapa;
  const cam = { lon: 33 + (t - K.c0) * 0.05, lat: 50, s: 1100 };
  m.fundo(ctx, cam, 'noite');
  ctx.fillStyle = 'rgba(4,7,14,0.5)';
  ctx.fillRect(0, 0, W, H);

  // a pergunta e as duas visões
  const vis = janela(t, K.c0, K.P(45) - 0.1, 0.5);
  if (vis > 0) {
    const split = easeInOut(prog(t, K.F(1) - 0.2, 0.8));
    texto(ctx, 'Por que a Rússia invadiu a Ucrânia?', SEGURO.cx, lerp(540, 80, split), { size: lerp(66, 30, split), weight: 800, alpha: vis * (1 - split * 0.15), maxW: lerp(560, 600, split) });
    if (split > 0) {
      ctx.save();
      ctx.globalAlpha = vis * split;
      const foco = t < K.F(2) ? 0 : 1;
      const top = ctx.createLinearGradient(0, 120, 0, 560);
      top.addColorStop(0, 'rgba(150,26,34,0.95)');
      top.addColorStop(1, 'rgba(90,16,22,0.95)');
      ctx.fillStyle = top;
      ctx.fillRect(0, 130, W, 410);
      ctx.fillStyle = '#1F5FC4';
      ctx.fillRect(0, 548, W, 205);
      ctx.fillStyle = '#E2B12C';
      ctx.fillRect(0, 753, W, 205);
      kremlin(ctx, SEGURO.cx, 535, 100, 'rgba(0,0,0,0.22)');
      cupulas(ctx, SEGURO.cx, 930, 120, 'rgba(0,0,0,0.22)');
      ctx.globalAlpha = vis * split * (foco === 0 ? 1 : 0.55);
      texto(ctx, 'Visão do Kremlin', SEGURO.cx, 215, { size: 52, weight: 800 });
      texto(ctx, 'impedir que um vizinho se junte ao Ocidente', SEGURO.cx, 298, { size: 32, weight: 600, family: 'Inter', maxW: 540 });
      ctx.globalAlpha = vis * prog(t, K.F(2) - 0.1, 0.5) * (foco === 1 ? 1 : 0.55);
      texto(ctx, 'Visão da Ucrânia', SEGURO.cx, 660, { size: 52, weight: 800 });
      texto(ctx, 'uma luta pela sobrevivência do país', SEGURO.cx, 750, { size: 32, weight: 600, family: 'Inter', maxW: 540, color: '#1B2433', sombra: false });
      ctx.restore();
    }
  }
  // linha do tempo do vídeo (vertical, cabe no 9:16)
  const lt = janela(t, K.P(45), K.P(46) - 0.1, 0.5);
  if (lt > 0) {
    ctx.save();
    ctx.globalAlpha = lt;
    const x0 = 740;
    const ys = LINHA.map((_, i) => 160 + i * 128);
    const pl = prog(t, K.P(45) + 0.2, LINHA.length * 0.42);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x0, ys[0]);
    ctx.lineTo(x0, lerp(ys[0], ys.at(-1), pl));
    ctx.stroke();
    LINHA.forEach(([ano, desc], i) => {
      const p = easeOutBack(prog(t, K.P(45) + 0.2 + i * 0.42, 0.5));
      if (p <= 0) return;
      const ult = i === LINHA.length - 1;
      ctx.fillStyle = ult ? '#E5363F' : C.ouro;
      ctx.beginPath();
      ctx.arc(x0, ys[i], 13 * p, 0, Math.PI * 2);
      ctx.fill();
      texto(ctx, ano, x0 + 36, ys[i], { size: 44, weight: 800, align: 'left', color: ult ? '#FF8A8A' : C.ouro, alpha: p });
      texto(ctx, desc, x0 + 178, ys[i], { size: 28, weight: 600, family: 'Inter', align: 'left', alpha: p, maxW: 330 });
    });
    ctx.restore();
  }
  // tela final
  const tf = prog(t, K.P(46), 0.6);
  if (tf > 0) {
    ctx.save();
    ctx.globalAlpha = tf;
    texto(ctx, 'PRÓXIMO VÍDEO', SEGURO.cx, 250, { size: 32, weight: 700, color: C.textoSec });
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < 2 ? '#E5363F' : 'rgba(255,255,255,0.25)';
      rrect(ctx, SEGURO.cx - 70 + i * 50, 300, 40, 40, 6);
      ctx.fill();
    }
    texto(ctx, 'Vídeo 2/3', SEGURO.cx, 400, { size: 40, weight: 700 });
    texto(ctx, 'A guerra de 2022 até hoje', SEGURO.cx, 500, { size: 64, weight: 800, maxW: 560 });
    const bp = easeOutBack(prog(t, K.P(46) + 0.5, 0.6));
    ctx.translate(SEGURO.cx, 720);
    ctx.scale(bp, bp);
    ctx.fillStyle = '#E5363F';
    rrect(ctx, -190, -44, 380, 88, 44);
    ctx.fill();
    texto(ctx, 'INSCREVA-SE', 0, 2, { size: 40, weight: 800, sombra: false });
    ctx.restore();
    texto(ctx, 'Playlist: Rússia x Ucrânia', SEGURO.cx, 860, { size: 30, weight: 600, family: 'Inter', color: C.textoSec, alpha: tf });
  }
  ctx.fillStyle = `rgba(0,0,0,${prog(t, K.c1 - 1.2, 1.2)})`;
  ctx.fillRect(0, 0, W, H);
}

export const CENAS = {
  gancho, abertura, rus, imperio, urss, independencia, budapeste,
  'dois-lados': doisLados, euromaidan, crimeia, minsk, 'caminho-2022': caminho, fechamento,
};
