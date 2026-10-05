// Vem de Preço Baixo — vídeo de divulgação para TikTok (9:16, 1080x1920)
// Todo o vídeo é desenhado em <canvas> por renderFrame(ctx, t, assets).
// A função é determinística: o mesmo t sempre gera o mesmo quadro, o que
// permite tocar ao vivo no navegador e renderizar quadro a quadro para MP4.
//
// Identidade seguida aqui (tirada da logo):
// - Fundo em degradê azul (#006CFD -> #06387C), como na logo.
// - Letras grossas e inclinadas, com contorno branco e sombra (estilo adesivo).
// - Vermelho #FF0000 e amarelo #FFED00 como cores de destaque.
// - A seta para baixo da logo é o símbolo do "preço que desce".
// - Texto importante longe das áreas que a interface do TikTok cobre
//   (topo, rodapé com legenda e coluna de botões à direita).

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const DURATION = 23;

export const C = {
  azul: '#006CFD',
  azulMedio: '#0448A2',
  azulEscuro: '#06387C',
  vermelho: '#FF0000',
  amarelo: '#FFED00',
  branco: '#FFFFFF',
  tinta: '#0B2350',
};

const TITAN = '"Titan One"';
const SLAB = '"Alfa Slab One"';
const MONT = 'Montserrat';
const INTER = 'Inter';

// Linha do tempo das cenas, em segundos.
export const SCENES = {
  gancho: [0, 3.0],
  queda: [3.0, 6.2],
  grupo: [6.2, 11.5],
  vantagens: [11.5, 15.5],
  gratis: [15.5, 18.0],
  final: [18.0, DURATION],
};

// Ofertas de exemplo que aparecem no celular. Troque pelas reais do grupo.
const OFERTAS = [
  { nome: 'Fone Bluetooth', de: 199.9, por: 89.9, icone: 'fone', cor: '#7B3FF2' },
  { nome: 'Air Fryer 4L', de: 499.9, por: 279.9, icone: 'airfryer', cor: '#FF6A00' },
  { nome: 'Tênis Esportivo', de: 349.9, por: 159.9, icone: 'tenis', cor: '#00A86B' },
  { nome: 'Smartwatch', de: 299.9, por: 119.9, icone: 'relogio', cor: '#E6007A' },
];
const OFERTA_T0 = 6.9;
const OFERTA_STEP = 1.0;

const VANTAGENS = ['OFERTAS SELECIONADAS', 'CUPONS DE DESCONTO', 'ACHADINHOS DO DIA', 'BUG DE PREÇO'];
const VANTAGEM_T0 = 12.1;
const VANTAGEM_STEP = 0.5;

// Preço do gancho e da queda
const PRECO_CHEIO = 299.9;
const PRECO_BAIXO = 149.9;
const CONTA_T0 = 3.75;
const CONTA_T1 = 5.0;

const GRATIS_T = 16.2;

// Efeitos sonoros sincronizados com a imagem (lidos por audio.js).
export const CUES = [
  { t: 0.12, type: 'pop' },
  { t: 0.42, type: 'pop' },
  { t: 0.6, type: 'stamp' },
  { t: 1.3, type: 'slash' },
  { t: 2.3, type: 'fall' },
  ...Object.values(SCENES).slice(1).map(([s]) => ({ t: s - 0.14, type: 'whoosh' })),
  { t: 3.1, type: 'pop' },
  { t: 3.35, type: 'pop' },
  ...Array.from({ length: 12 }, (_, i) => ({ t: CONTA_T0 + i * ((CONTA_T1 - CONTA_T0) / 12), type: 'tick' })),
  { t: CONTA_T1, type: 'impact' },
  { t: CONTA_T1 + 0.03, type: 'cash' },
  { t: 6.3, type: 'pop' },
  ...OFERTAS.map((_, i) => ({ t: OFERTA_T0 + i * OFERTA_STEP, type: 'notif' })),
  { t: 11.6, type: 'pop' },
  ...VANTAGENS.map((_, i) => ({ t: VANTAGEM_T0 + i * VANTAGEM_STEP + 0.15, type: 'pop' })),
  { t: 15.6, type: 'riser' },
  { t: GRATIS_T, type: 'impact' },
  { t: GRATIS_T + 0.02, type: 'cash' },
  { t: GRATIS_T + 0.05, type: 'chime' },
  { t: 16.75, type: 'pop' },
  { t: 18.05, type: 'impact' },
  { t: 18.15, type: 'chime' },
  { t: 18.6, type: 'pop' },
  { t: 18.9, type: 'pop' },
];

// Trilha: batida desde o primeiro quadro, respiro antes do "É GRÁTIS!".
export const MUSIC = { start: 0, breaks: [[15.5, GRATIS_T]] };

// ---------------------------------------------------------------- utilidades

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
const ease = {
  in: (t) => t * t * t,
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => {
    const c1 = 2.2;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

const brl = (v) => 'R$ ' + v.toFixed(2).replace('.', ',');
const pct = (o) => '-' + Math.round((1 - o.por / o.de) * 100) + '%';

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function setFont(ctx, size, weight, font, spacing = 0) {
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.letterSpacing = `${spacing}px`;
}

// Reduz o corpo até o texto caber em maxW.
function fitSize(ctx, str, size, weight, font, spacing, maxW) {
  setFont(ctx, size, weight, font, spacing);
  const w = ctx.measureText(str).width;
  return w > maxW ? Math.floor((size * maxW) / w) : size;
}

function txt(ctx, str, x, y, o = {}) {
  const {
    size = 60, weight = 800, font = MONT, color = C.branco,
    align = 'center', spacing = 0, alpha = 1, maxW = 860,
  } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const s = fitSize(ctx, str, size, weight, font, spacing, maxW);
  setFont(ctx, s, weight, font, spacing);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  // letterSpacing também é aplicado após o último caractere; compensa no centro.
  ctx.fillText(str, align === 'center' ? x + spacing / 2 : x, y);
  ctx.restore();
  return s;
}

// Texto "adesivo" no estilo da logo: inclinado, contorno grosso e sombra.
// segs = [[texto, preenchimento, contorno?], ...], centralizado em x.
function sticker(ctx, segs, x, y, o = {}) {
  if (typeof segs === 'string') segs = [[segs, o.fill ?? C.branco]];
  const { size = 120, font = TITAN, skew = -0.16, maxW = 860, shadow = true, line = 0.15 } = o;
  const full = segs.map(([s]) => s).join('');
  ctx.save();
  const s = fitSize(ctx, full, size, 400, font, 0, maxW);
  setFont(ctx, s, 400, font, 0);
  const widths = segs.map(([str]) => ctx.measureText(str).width);
  const total = widths.reduce((a, b) => a + b, 0);
  // A inclinação desloca o topo para a direita; recentra pela meia altura.
  ctx.translate(x + skew * s * 0.36, y);
  ctx.transform(1, 0, skew, 1, 0, 0);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.lineWidth = s * line;

  const pass = (fn) => {
    let cx = -total / 2;
    segs.forEach((seg, i) => {
      fn(seg, cx);
      cx += widths[i];
    });
  };
  if (shadow) {
    ctx.fillStyle = ctx.strokeStyle = 'rgba(1,20,64,0.55)';
    pass(([str], cx) => {
      ctx.strokeText(str, cx + s * 0.03, s * 0.09);
      ctx.fillText(str, cx + s * 0.03, s * 0.09);
    });
  }
  pass(([str, fill, stroke], cx) => {
    ctx.strokeStyle = stroke ?? (fill === C.branco ? C.azulEscuro : C.branco);
    ctx.strokeText(str, cx, 0);
  });
  pass(([str, fill], cx) => {
    ctx.fillStyle = fill;
    ctx.fillText(str, cx, 0);
  });
  ctx.restore();
}

// Entrada com "pop": cresce de `from` até 1 em volta de (x, y), com sobra elástica.
function pop(ctx, t, t0, x, y, draw, o = {}) {
  const { dur = 0.4, from = 0.2, dy = 0, dx = 0, curve = ease.back, rot = 0 } = o;
  const p = prog(t, t0, t0 + dur);
  if (p <= 0) return;
  const k = curve(p);
  ctx.save();
  ctx.globalAlpha *= clamp(p * 3);
  ctx.translate(x + dx * (1 - k), y + dy * (1 - k));
  ctx.rotate(rot * (1 - k));
  const s = Math.max(0, lerp(from, 1, k));
  ctx.scale(s, s);
  ctx.translate(-x, -y);
  draw();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// Seta para baixo da logo: haste + ponta, centrada em x, topo em y.
function arrowPath(ctx, x, y, o) {
  const { shaft = 440, head = 660, shaftH = 420, headH = 300, r = 34 } = o;
  const pts = [
    [x - shaft / 2, y], [x + shaft / 2, y], [x + shaft / 2, y + shaftH],
    [x + head / 2, y + shaftH], [x, y + shaftH + headH],
    [x - head / 2, y + shaftH], [x - shaft / 2, y + shaftH],
  ];
  ctx.beginPath();
  const n = pts.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(pts[n - 1], pts[0]);
  ctx.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    ctx.arcTo(p[0], p[1], q[0], q[1], r);
  }
  ctx.closePath();
}

// Setinha pequena (fundo e detalhes).
function miniArrow(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x - s * 0.22, y - s * 0.5);
  ctx.lineTo(x + s * 0.22, y - s * 0.5);
  ctx.lineTo(x + s * 0.22, y);
  ctx.lineTo(x + s * 0.48, y);
  ctx.lineTo(x, y + s * 0.5);
  ctx.lineTo(x - s * 0.48, y);
  ctx.lineTo(x - s * 0.22, y);
  ctx.closePath();
  ctx.fill();
}

function star(ctx, x, y, rOut, rIn, n, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? rIn : rOut;
    const a = rot + (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}

// ------------------------------------------------------ elementos pré-calculados

const FUNDO = (() => {
  const r = mulberry32(5);
  return Array.from({ length: 30 }, () => ({
    x: r() * W, off: r() * (H + 200), sp: 60 + r() * 140, s: 30 + r() * 60,
    a: 0.05 + r() * 0.08, pct: r() > 0.7, rot: (r() - 0.5) * 0.6,
  }));
})();

const CONFETES = (() => {
  const r = mulberry32(17);
  const cores = [C.amarelo, C.vermelho, C.branco, '#7FD0FF', C.amarelo];
  return Array.from({ length: 110 }, () => {
    const a = -Math.PI / 2 + (r() - 0.5) * Math.PI * 1.5;
    const v = 900 + r() * 1500;
    return {
      vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 14 + r() * 16, h: 8 + r() * 10,
      spin: (r() - 0.5) * 16, cor: cores[Math.floor(r() * cores.length)], flip: 4 + r() * 8,
    };
  });
})();

// Tremidas de câmera: [início, amplitude px, duração].
const SHAKES = [[0.6, 14, 0.25], [1.3, 10, 0.25], [CONTA_T1, 20, 0.35], [GRATIS_T, 26, 0.4], [18.05, 12, 0.3]];

// ---------------------------------------------------------------- camadas

function drawBackground(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, C.azul);
  g.addColorStop(0.55, C.azulMedio);
  g.addColorStop(1, C.azulEscuro);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Raios girando atrás de tudo (mais fortes no "É GRÁTIS!" e no final).
  const boost = Math.max(
    prog(t, GRATIS_T, GRATIS_T + 0.2) * (1 - prog(t, 17.8, 18.0)),
    prog(t, 18.0, 18.4),
  );
  const cx = W / 2;
  const cy = t >= 18 ? 760 : 960;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 0.12);
  ctx.fillStyle = `rgba(255,255,255,${0.035 + 0.06 * boost})`;
  const n = 18;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 2200, a, a + Math.PI / n);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Brilho suave no centro
  const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 900);
  rg.addColorStop(0, `rgba(80,170,255,${0.28 + 0.2 * boost})`);
  rg.addColorStop(1, 'rgba(80,170,255,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);

  // Setinhas e "%" caindo devagar: o preço sempre descendo.
  ctx.save();
  for (const p of FUNDO) {
    const y = ((p.off + t * p.sp) % (H + 200)) - 100;
    ctx.globalAlpha = p.a;
    ctx.fillStyle = C.branco;
    if (p.pct) {
      ctx.save();
      ctx.translate(p.x, y);
      ctx.rotate(p.rot);
      setFont(ctx, p.s, 400, TITAN);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('%', 0, 0);
      ctx.restore();
    } else {
      miniArrow(ctx, p.x, y, p.s);
    }
  }
  ctx.restore();

  // Vinheta para dar profundidade
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  v.addColorStop(0, 'rgba(0,10,40,0)');
  v.addColorStop(1, 'rgba(0,10,40,0.45)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- cenas

// Etiqueta de preço branca, centrada em (0, 0).
function priceTag(ctx, w, h, preco) {
  const x = -w / 2;
  const y = -h / 2;
  const notch = 110;
  ctx.beginPath();
  ctx.moveTo(x + notch, y);
  ctx.lineTo(x + w - 30, y);
  ctx.arcTo(x + w, y, x + w, y + 30, 30);
  ctx.lineTo(x + w, y + h - 30);
  ctx.arcTo(x + w, y + h, x + w - 30, y + h, 30);
  ctx.lineTo(x + notch, y + h);
  ctx.lineTo(x, 0);
  ctx.closePath();
  ctx.save();
  ctx.shadowColor = 'rgba(0,15,50,0.45)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = C.branco;
  ctx.fill();
  ctx.restore();
  // furo e cordão
  ctx.fillStyle = C.azulMedio;
  ctx.beginPath();
  ctx.arc(x + 70, 0, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(11,35,80,0.15)';
  ctx.lineWidth = 6;
  ctx.setLineDash([16, 12]);
  roundRect(ctx, x + notch + 10, y + 22, w - notch - 32, h - 44, 18);
  ctx.stroke();
  ctx.setLineDash([]);

  txt(ctx, 'PREÇO CHEIO', 55, y + 110, { size: 40, color: '#7A8BA8', spacing: 6, maxW: w - 200 });
  txt(ctx, preco, 55, y + 250, { size: 130, weight: 400, font: SLAB, color: C.tinta, maxW: w - 190 });
}

function sceneGancho(ctx, t) {
  pop(ctx, t, 0.0, W / 2, 330, () => sticker(ctx, 'AINDA PAGA', W / 2, 360, { size: 120 }), { from: 0.4 });
  pop(ctx, t, 0.3, W / 2, 500, () => sticker(ctx, 'PREÇO CHEIO?', W / 2, 540, { size: 150, fill: C.vermelho }), { from: 2.2, curve: ease.out, dur: 0.3 });

  // Some quando a etiqueta despenca, para não ficar por baixo dela.
  ctx.save();
  ctx.globalAlpha *= 1 - prog(t, 2.25, 2.45);
  pop(ctx, t, 1.55, W / 2, 1420, () => sticker(ctx, 'PARA TUDO!', W / 2, 1450, { size: 110, fill: C.amarelo }), { from: 0.3 });
  ctx.restore();

  // Etiqueta: entra, leva o risco vermelho, treme e cai.
  const enter = ease.back(prog(t, 0.45, 0.85));
  if (enter <= 0) return;
  const fall = prog(t, 2.3, 3.0);
  const shake = t > 1.3 && t < 1.8 ? Math.sin(t * 90) * 14 * (1 - prog(t, 1.3, 1.8)) : 0;
  ctx.save();
  ctx.globalAlpha *= clamp(enter * 2);
  ctx.translate(W / 2 + shake, 1000 + 900 * ease.in(fall) + (1 - enter) * 300);
  ctx.rotate(-0.08 + fall * fall * 0.9);
  ctx.scale(lerp(0.6, 1, enter), lerp(0.6, 1, enter));
  priceTag(ctx, 820, 400, brl(PRECO_CHEIO));

  // Risco vermelho riscando o preço
  const s = ease.out(prog(t, 1.3, 1.5));
  if (s > 0) {
    ctx.lineCap = 'round';
    const x0 = -230;
    const y0 = 40;
    const x1 = 400;
    const y1 = -60;
    for (const [w, c] of [[44, C.branco], [26, C.vermelho]]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(lerp(x0, x1, s), lerp(y0, y1, s));
      ctx.stroke();
    }
  }
  ctx.restore();

}

function sceneQueda(ctx, t) {
  pop(ctx, t, 3.05, W / 2, 330, () => sticker(ctx, 'AQUI O PREÇO', W / 2, 360, { size: 112 }), { from: 0.4 });
  pop(ctx, t, 3.3, W / 2, 490, () => sticker(ctx, 'SÓ DESCE!', W / 2, 530, { size: 160, fill: C.amarelo }), { from: 0.3 });

  // A seta da logo despenca de cima e pousa com um "tranco" no fim da contagem.
  const drop = ease.out(prog(t, 3.25, 3.7));
  if (drop <= 0) return;
  const land = prog(t, CONTA_T1, CONTA_T1 + 0.35);
  const squash = Math.sin(land * Math.PI) * (1 - land) * 0.12;
  const top = 650;
  const x = W / 2;
  ctx.save();
  ctx.translate(x, top + 1000);
  ctx.scale(1 + squash, 1 - squash);
  ctx.translate(-x, -(top + 1000));
  ctx.translate(0, (1 - drop) * -1300 + Math.sin(prog(t, 3.75, 5.0) * Math.PI * 6) * 6 * (1 - land));
  const shape = { shaft: 460, head: 700, shaftH: 400, headH: 300 };
  ctx.save();
  ctx.shadowColor = 'rgba(0,15,50,0.5)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 24;
  arrowPath(ctx, x, top, shape);
  const g = ctx.createLinearGradient(0, top, 0, top + 700);
  g.addColorStop(0, '#1E86FF');
  g.addColorStop(1, '#0058D6');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 16;
  ctx.strokeStyle = C.branco;
  arrowPath(ctx, x, top, shape);
  ctx.stroke();

  // Contador caindo de R$ 299,90 até R$ 149,90
  const k = ease.inOut(prog(t, CONTA_T0, CONTA_T1));
  const valor = lerp(PRECO_CHEIO, PRECO_BAIXO, k);
  const flash = 1 - prog(t, CONTA_T1, CONTA_T1 + 0.5);
  txt(ctx, 'POR APENAS', x, top + 105, { size: 44, color: C.branco, spacing: 6, maxW: 400 });
  sticker(ctx, brl(valor), x, top + 300, { size: 150, font: SLAB, fill: C.amarelo, stroke: C.azulEscuro, maxW: 420, skew: -0.08, line: 0.16 });
  const bounce = ease.back(prog(t, CONTA_T1, CONTA_T1 + 0.4));
  if (bounce > 0) {
    ctx.save();
    ctx.translate(x, top + 520);
    ctx.scale(bounce, bounce);
    sticker(ctx, '-50%', 0, 10, { size: 100, fill: C.branco, stroke: C.vermelho, maxW: 380 });
    ctx.restore();
  }
  ctx.restore();
  if (flash > 0 && t >= CONTA_T1) {
    ctx.fillStyle = `rgba(255,255,255,${0.35 * flash * flash})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// ----- ícones dos produtos (desenhados em um quadrado de 150 px centrado em 0,0)

function icone(ctx, tipo) {
  ctx.save();
  ctx.strokeStyle = C.branco;
  ctx.fillStyle = C.branco;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (tipo === 'fone') {
    ctx.beginPath();
    ctx.arc(0, 8, 42, Math.PI, 0);
    ctx.stroke();
    roundRect(ctx, -54, 2, 26, 46, 10);
    ctx.fill();
    roundRect(ctx, 28, 2, 26, 46, 10);
    ctx.fill();
  } else if (tipo === 'airfryer') {
    roundRect(ctx, -40, -46, 80, 92, 18);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    roundRect(ctx, -28, -6, 56, 40, 8);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -26, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.branco;
    roundRect(ctx, -12, 8, 24, 10, 4);
    ctx.fill();
  } else if (tipo === 'tenis') {
    ctx.beginPath();
    ctx.moveTo(-52, 22);
    ctx.lineTo(-48, -18);
    ctx.quadraticCurveTo(-30, -12, -18, -28);
    ctx.lineTo(10, -4);
    ctx.quadraticCurveTo(48, 2, 54, 18);
    ctx.lineTo(54, 26);
    ctx.lineTo(-52, 26);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-50, 14);
    ctx.lineTo(54, 14);
    ctx.moveTo(-14, -16);
    ctx.lineTo(-4, -6);
    ctx.moveTo(-4, -22);
    ctx.lineTo(6, -12);
    ctx.stroke();
  } else if (tipo === 'relogio') {
    roundRect(ctx, -20, -56, 40, 112, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    roundRect(ctx, -20, -56, 40, 112, 10);
    ctx.fill();
    ctx.fillStyle = C.branco;
    roundRect(ctx, -34, -34, 68, 68, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -18);
    ctx.moveTo(0, 0);
    ctx.lineTo(13, 8);
    ctx.stroke();
  }
  ctx.restore();
}

const PHONE = { x: 210, y: 480, w: 660, h: 1040, r: 80 };
const CARD = { h: 200, gap: 22 };

function oferta(ctx, o, x, y, w) {
  const h = CARD.h;
  ctx.save();
  ctx.shadowColor = 'rgba(10,40,90,0.18)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = C.branco;
  roundRect(ctx, x, y, w, h, [8, 28, 28, 28]);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = o.cor;
  roundRect(ctx, x + 22, y + 25, 150, 150, 26);
  ctx.fill();
  ctx.save();
  ctx.translate(x + 97, y + 100);
  icone(ctx, o.icone);
  ctx.restore();

  const tx = x + 196;
  txt(ctx, 'Vem de Preço Baixo', tx, y + 44, { size: 22, weight: 700, font: INTER, color: C.azul, align: 'left', maxW: w - 220 });
  txt(ctx, o.nome, tx, y + 84, { size: 32, weight: 800, color: C.tinta, align: 'left', maxW: w - 220 });
  const de = 'de ' + brl(o.de);
  const ds = txt(ctx, de, tx, y + 122, { size: 25, weight: 500, font: INTER, color: '#8592A8', align: 'left', maxW: 260 });
  setFont(ctx, ds, 500, INTER);
  const dw = ctx.measureText(de).width;
  ctx.fillStyle = '#8592A8';
  ctx.fillRect(tx + 38, y + 113, dw - 38, 3);
  txt(ctx, brl(o.por), tx, y + 174, { size: 48, weight: 800, color: '#E00000', align: 'left', maxW: 250 });

  // Selo de desconto
  const bx = x + w - 130;
  const by = y + 128;
  ctx.fillStyle = C.amarelo;
  roundRect(ctx, bx, by, 108, 52, 26);
  ctx.fill();
  txt(ctx, pct(o), bx + 54, by + 38, { size: 30, weight: 800, color: C.azulEscuro, maxW: 92 });
}

function drawPhone(ctx, t, A) {
  const { x, y, w, h, r } = PHONE;
  // Corpo
  ctx.save();
  ctx.shadowColor = 'rgba(0,10,40,0.55)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 30;
  ctx.fillStyle = '#0D1626';
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 4;
  roundRect(ctx, x + 2, y + 2, w - 4, h - 4, r - 2);
  ctx.stroke();

  const sx = x + 22;
  const sy = y + 22;
  const sw = w - 44;
  const sh = h - 44;
  ctx.save();
  roundRect(ctx, sx, sy, sw, sh, r - 20);
  ctx.clip();
  ctx.fillStyle = '#E9F0FA';
  ctx.fillRect(sx, sy, sw, sh);
  // padrão leve de setinhas no fundo do chat
  ctx.fillStyle = 'rgba(0,108,253,0.06)';
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 10; j++) {
      miniArrow(ctx, sx + 50 + i * 110 + (j % 2) * 55, sy + 200 + j * 100, 34);
    }
  }

  // Ofertas chegando de baixo e empurrando as anteriores para cima
  const inputH = 96;
  const bottom = sy + sh - inputH - 18;
  const cw = sw - 40;
  OFERTAS.forEach((o, i) => {
    const ti = OFERTA_T0 + i * OFERTA_STEP;
    const pin = prog(t, ti, ti + 0.35);
    if (pin <= 0) return;
    let off = 0;
    for (let j = i + 1; j < OFERTAS.length; j++) {
      off += ease.out(prog(t, OFERTA_T0 + j * OFERTA_STEP, OFERTA_T0 + j * OFERTA_STEP + 0.35)) * (CARD.h + CARD.gap);
    }
    const k = ease.back(pin);
    const cy = bottom - CARD.h - off + (1 - k) * 120;
    ctx.save();
    ctx.globalAlpha *= clamp(pin * 3);
    const s = lerp(0.85, 1, k);
    ctx.translate(sx + 20, cy + CARD.h);
    ctx.scale(s, s);
    ctx.translate(-(sx + 20), -(cy + CARD.h));
    oferta(ctx, o, sx + 20, cy, cw);
    ctx.restore();
  });

  // Barra de mensagem
  ctx.fillStyle = '#F7F9FC';
  ctx.fillRect(sx, sy + sh - inputH, sw, inputH);
  ctx.fillStyle = C.branco;
  roundRect(ctx, sx + 20, sy + sh - inputH + 18, sw - 120, 60, 30);
  ctx.fill();
  txt(ctx, 'Mensagem', sx + 50, sy + sh - inputH + 58, { size: 26, weight: 500, font: INTER, color: '#9AA6B8', align: 'left' });
  ctx.fillStyle = C.azul;
  ctx.beginPath();
  ctx.arc(sx + sw - 58, sy + sh - inputH + 48, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.branco;
  ctx.beginPath();
  ctx.moveTo(sx + sw - 70, sy + sh - inputH + 34);
  ctx.lineTo(sx + sw - 40, sy + sh - inputH + 48);
  ctx.lineTo(sx + sw - 70, sy + sh - inputH + 62);
  ctx.closePath();
  ctx.fill();

  // Cabeçalho do grupo
  const hh = 170;
  const hg = ctx.createLinearGradient(sx, sy, sx + sw, sy + hh);
  hg.addColorStop(0, C.azul);
  hg.addColorStop(1, C.azulMedio);
  ctx.fillStyle = hg;
  ctx.fillRect(sx, sy, sw, hh);
  // ilha da câmera
  ctx.fillStyle = '#0D1626';
  roundRect(ctx, x + w / 2 - 70, sy + 14, 140, 34, 17);
  ctx.fill();
  // avatar redondo com a logo
  const ax = sx + 80;
  const ay = sy + 108;
  ctx.save();
  ctx.beginPath();
  ctx.arc(ax, ay, 44, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(A.logo, ax - 44, ay - 44, 88, 88);
  ctx.restore();
  ctx.strokeStyle = C.branco;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(ax, ay, 44, 0, Math.PI * 2);
  ctx.stroke();
  txt(ctx, 'Vem de Preço Baixo', ax + 66, ay - 4, { size: 34, weight: 800, align: 'left', maxW: sw - 170 });
  const novas = OFERTAS.filter((_, i) => t >= OFERTA_T0 + i * OFERTA_STEP).length;
  txt(ctx, novas ? `grupo de promoções · ${novas} nova${novas > 1 ? 's' : ''}` : 'grupo de promoções', ax + 66, ay + 34, {
    size: 24, weight: 500, font: INTER, color: 'rgba(255,255,255,0.85)', align: 'left', maxW: sw - 170,
  });
  ctx.restore();
}

function sceneGrupo(ctx, t, A) {
  pop(ctx, t, 6.25, W / 2, 280, () => sticker(ctx, 'PROMOÇÕES TODO DIA', W / 2, 300, { size: 100 }), { from: 0.4 });
  pop(ctx, t, 6.45, W / 2, 400, () => sticker(ctx, 'NO SEU CELULAR', W / 2, 420, { size: 100, fill: C.amarelo }), { from: 0.4 });

  const enter = ease.out(prog(t, 6.2, 6.75));
  if (enter <= 0) return;
  ctx.save();
  ctx.translate(0, (1 - enter) * 1300);
  ctx.translate(W / 2, PHONE.y + PHONE.h / 2);
  ctx.rotate((1 - enter) * 0.15);
  ctx.translate(-W / 2, -(PHONE.y + PHONE.h / 2));
  drawPhone(ctx, t, A);
  ctx.restore();

  // Pílula de notificação pulando no canto do celular a cada oferta
  const last = OFERTAS.reduce((acc, _, i) => (t >= OFERTA_T0 + i * OFERTA_STEP ? OFERTA_T0 + i * OFERTA_STEP : acc), -1);
  if (last > 0) {
    const n = OFERTAS.filter((_, i) => t >= OFERTA_T0 + i * OFERTA_STEP).length;
    const b = ease.back(prog(t, last, last + 0.3));
    ctx.save();
    ctx.translate(PHONE.x + PHONE.w - 20, PHONE.y + 30);
    ctx.scale(lerp(0.6, 1, b), lerp(0.6, 1, b));
    ctx.fillStyle = C.vermelho;
    ctx.strokeStyle = C.branco;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    txt(ctx, String(n), 0, 18, { size: 52, weight: 400, font: TITAN });
    ctx.restore();
  }
}

function check(ctx, x, y, r, p) {
  ctx.fillStyle = C.amarelo;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (p <= 0) return;
  const pts = [[x - r * 0.45, y + r * 0.02], [x - r * 0.12, y + r * 0.36], [x + r * 0.5, y - r * 0.34]];
  const l1 = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
  const l2 = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]);
  const d = p * (l1 + l2);
  ctx.strokeStyle = C.azulEscuro;
  ctx.lineWidth = r * 0.24;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  if (d <= l1) {
    ctx.lineTo(lerp(pts[0][0], pts[1][0], d / l1), lerp(pts[0][1], pts[1][1], d / l1));
  } else {
    ctx.lineTo(pts[1][0], pts[1][1]);
    const f = (d - l1) / l2;
    ctx.lineTo(lerp(pts[1][0], pts[2][0], f), lerp(pts[1][1], pts[2][1], f));
  }
  ctx.stroke();
}

function sceneVantagens(ctx, t) {
  pop(ctx, t, 11.55, W / 2, 360, () => sticker(ctx, [['NO GRUPO ', C.branco], ['TEM:', C.amarelo]], W / 2, 400, { size: 130 }), { from: 0.4 });

  const pw = 860;
  const ph = 140;
  VANTAGENS.forEach((v, i) => {
    const t0 = VANTAGEM_T0 + i * VANTAGEM_STEP;
    const cy = 640 + i * 175;
    const destaque = i === VANTAGENS.length - 1;
    pop(ctx, t, t0, W / 2, cy, () => {
      ctx.save();
      ctx.translate(W / 2, cy);
      ctx.rotate(i % 2 ? 0.015 : -0.015);
      ctx.save();
      ctx.shadowColor = 'rgba(0,15,50,0.4)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 12;
      ctx.fillStyle = destaque ? C.vermelho : C.branco;
      roundRect(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2);
      ctx.fill();
      ctx.restore();
      if (destaque) {
        ctx.strokeStyle = C.branco;
        ctx.lineWidth = 8;
        roundRect(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2);
        ctx.stroke();
      }
      check(ctx, -pw / 2 + 76, 0, 46, ease.out(prog(t, t0 + 0.15, t0 + 0.4)));
      txt(ctx, v, -pw / 2 + 150, 19, { size: 54, weight: 900, color: destaque ? C.branco : C.azulEscuro, align: 'left', maxW: pw - 200 });
      ctx.restore();
    }, { dx: i % 2 ? 900 : -900, from: 0.9, dur: 0.45 });
  });

  pop(ctx, t, 14.3, W / 2, 1360, () => txt(ctx, 'Tudo reunido num lugar só.', W / 2, 1380, { size: 46, weight: 600, font: INTER }), { from: 0.8, dy: 30, curve: ease.out });
}

function sceneGratis(ctx, t) {
  const pre = prog(t, 15.55, 15.85) * (1 - prog(t, GRATIS_T - 0.05, GRATIS_T + 0.15));
  if (pre > 0) {
    ctx.save();
    ctx.globalAlpha *= pre;
    sticker(ctx, 'E O MELHOR...', W / 2, 980 - 40 * prog(t, 15.55, GRATIS_T), { size: 110 });
    ctx.restore();
  }
  if (t < GRATIS_T) return;

  const k = ease.out(prog(t, GRATIS_T, GRATIS_T + 0.22));
  const pulse = 1 + 0.03 * Math.sin((t - GRATIS_T) * Math.PI * 4);
  ctx.save();
  ctx.translate(W / 2, 900);
  // estrela vermelha girando atrás
  ctx.save();
  ctx.rotate(t * 0.5);
  ctx.scale(k, k);
  star(ctx, 0, 0, 440, 360, 20);
  ctx.fillStyle = C.vermelho;
  ctx.fill();
  ctx.lineWidth = 14;
  ctx.strokeStyle = C.branco;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
  const s = lerp(2.6, 1, k) * pulse;
  ctx.scale(s, s);
  ctx.globalAlpha *= clamp(k * 3);
  sticker(ctx, 'É', 0, -130, { size: 130, fill: C.branco });
  sticker(ctx, 'GRÁTIS!', 0, 110, { size: 230, fill: C.amarelo, maxW: 880 });
  ctx.restore();

  // Confete
  const dt = t - GRATIS_T;
  if (dt < 2.2) {
    ctx.save();
    for (const c of CONFETES) {
      const px = W / 2 + c.vx * dt * 0.55;
      const py = 900 + c.vy * dt * 0.55 + 0.5 * 2600 * dt * dt * 0.55;
      if (py > H + 50) continue;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(c.spin * dt);
      ctx.scale(1, Math.cos(dt * c.flip));
      ctx.globalAlpha = 1 - prog(dt, 1.6, 2.2);
      ctx.fillStyle = c.cor;
      ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      ctx.restore();
    }
    ctx.restore();
  }

  pop(ctx, t, 16.75, W / 2, 1420, () => {
    const pw = 820;
    ctx.fillStyle = C.branco;
    roundRect(ctx, W / 2 - pw / 2, 1360, pw, 120, 60);
    ctx.fill();
    txt(ctx, 'ENTRAR NÃO CUSTA NADA', W / 2, 1438, { size: 50, weight: 900, color: C.azulEscuro, maxW: pw - 80 });
  }, { from: 0.5 });
}

function sceneFinal(ctx, t, A) {
  pop(ctx, t, 18.0, W / 2, 330, () => txt(ctx, 'SEU GRUPO DE PROMOÇÕES', W / 2, 345, { size: 48, weight: 800, spacing: 4 }), { from: 0.8, dy: -20, curve: ease.out });

  // Logo em cartão arredondado (como a foto do grupo), quicando e flutuando.
  const k = ease.back(prog(t, 18.05, 18.6));
  if (k > 0) {
    const size = 580;
    const cy = 780 + Math.sin((t - 18.6) * 2.4) * 10 * prog(t, 18.6, 19.0);
    ctx.save();
    ctx.translate(W / 2, cy);
    ctx.rotate((1 - k) * -0.4);
    ctx.scale(k, k);
    ctx.save();
    ctx.shadowColor = 'rgba(0,10,40,0.55)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 30;
    ctx.fillStyle = C.branco;
    roundRect(ctx, -size / 2 - 14, -size / 2 - 14, size + 28, size + 28, 84);
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, -size / 2, -size / 2, size, size, 72);
    ctx.clip();
    ctx.drawImage(A.logo, -size / 2, -size / 2, size, size);
    // brilho passando pela logo
    const sp = prog(t, 19.3, 19.9);
    if (sp > 0 && sp < 1) {
      const gx = lerp(-size, size, sp);
      const g = ctx.createLinearGradient(gx - 120, -size / 2, gx + 120, size / 2);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.45)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-size / 2, -size / 2, size, size);
    }
    ctx.restore();
    ctx.restore();
  }

  pop(ctx, t, 18.6, W / 2, 1180, () => sticker(ctx, 'ENTRE NO GRUPO!', W / 2, 1210, { size: 110 }), { from: 0.3 });

  // Botão de chamada pulsando no ritmo, com toque.
  const bk = ease.back(prog(t, 18.9, 19.3));
  if (bk > 0) {
    const beat = 0.5;
    const ph = ((t - 18.9) % beat) / beat;
    const pulse = 1 + 0.05 * Math.exp(-ph * 6) * (t > 19.3 ? 1 : 0);
    const bw = 680;
    const bh = 160;
    const by = 1370;
    ctx.save();
    ctx.translate(W / 2, by);
    ctx.scale(bk * pulse, bk * pulse);
    ctx.save();
    ctx.shadowColor = 'rgba(0,10,40,0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 16;
    ctx.fillStyle = C.vermelho;
    roundRect(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2);
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = 10;
    ctx.strokeStyle = C.branco;
    roundRect(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2);
    ctx.stroke();
    sticker(ctx, 'LINK NA BIO', -40, 30, { size: 92, fill: C.amarelo, stroke: C.azulEscuro, maxW: bw - 220 });
    ctx.fillStyle = C.branco;
    miniArrow(ctx, bw / 2 - 75, 0, 64);
    ctx.restore();

    // anel do "toque" a cada 2 batidas
    if (t > 19.3) {
      const rp = ((t - 19.3) % 1.0) / 1.0;
      ctx.save();
      ctx.globalAlpha = (1 - rp) * 0.8;
      ctx.strokeStyle = C.branco;
      ctx.lineWidth = 8 * (1 - rp) + 2;
      roundRect(ctx, W / 2 - bw / 2 - rp * 40, by - bh / 2 - rp * 40, bw + rp * 80, bh + rp * 80, bh / 2 + rp * 40);
      ctx.stroke();
      ctx.restore();
    }
  }
}

// Camada de cena com saída rápida (sobe, aumenta e some) nos últimos `exit` segundos.
function layer(ctx, t, [a, b], draw, exit = 0.2) {
  if (t < a || t >= b) return;
  const p = b >= DURATION ? 0 : ease.in(prog(t, b - exit, b));
  ctx.save();
  ctx.globalAlpha = 1 - p;
  ctx.translate(W / 2, H / 2);
  ctx.scale(1 + p * 0.15, 1 + p * 0.15);
  ctx.translate(-W / 2, -H / 2 - p * 80);
  draw();
  ctx.restore();
}

export function renderFrame(ctx, t, A) {
  t = clamp(t, 0, DURATION - 1e-6);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;

  drawBackground(ctx, t);

  let sx = 0;
  let sy = 0;
  for (const [t0, amp, dur] of SHAKES) {
    const p = prog(t, t0, t0 + dur);
    if (p > 0 && p < 1) {
      const a = amp * (1 - p) * (1 - p);
      sx += Math.sin((t - t0) * 70) * a;
      sy += Math.cos((t - t0) * 55) * a;
    }
  }
  ctx.translate(sx, sy);

  const S = SCENES;
  layer(ctx, t, S.gancho, () => sceneGancho(ctx, t), 0.12);
  layer(ctx, t, S.queda, () => sceneQueda(ctx, t));
  layer(ctx, t, S.grupo, () => sceneGrupo(ctx, t, A));
  layer(ctx, t, S.vantagens, () => sceneVantagens(ctx, t));
  layer(ctx, t, S.gratis, () => sceneGratis(ctx, t));
  layer(ctx, t, S.final, () => sceneFinal(ctx, t, A));

  // Sem fade de entrada: o gancho precisa aparecer já no primeiro quadro.
  const end = prog(t, DURATION - 0.35, DURATION);
  if (end > 0) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(3,20,60,${end * 0.6})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}
