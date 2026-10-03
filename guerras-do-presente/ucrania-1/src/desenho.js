// Primitivas de desenho: easing, textos, selos, carimbos, setas, ícones e bandeiras.
// Tudo é vetorial (canvas 2D) e determinístico: o mesmo t gera o mesmo quadro.

export const W = 1920;
export const H = 1080;
// Coluna segura para o corte 9:16 (608 px de largura no centro do quadro 16:9).
export const SEGURO = { x0: 656, x1: 1264, cx: 960, larg: 608 };

export const C = {
  fundo: '#070D18',
  agua: '#0A1424',
  terra: '#18263D',
  borda: 'rgba(130,160,200,0.32)',
  azul: '#2C6BD6',
  amarelo: '#F4C430',
  vermelho: '#C62F3A',
  vermelhoEsc: '#7E1E27',
  otan: '#2A55A8',
  ouro: '#D9AE55',
  laranja: '#F28C28',
  cinza: '#8A94A6',
  verde: '#5E7F4F',
  texto: '#F2F4F8',
  textoSec: '#B4BED0',
  papel: '#F1E7D2',
  tinta: '#2A2420',
};

// ------------------------------------------------------------------ tempo
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, p) => a + (b - a) * p;
export const prog = (t, t0, dur) => clamp((t - t0) / dur);
export const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const easeOut = (p) => 1 - Math.pow(1 - p, 3);
export const easeIn = (p) => p * p * p;
export const easeOutBack = (p) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};
// Entra (fade) em t0 e sai em t1, com rampas de `r` segundos.
export const janela = (t, t0, t1 = Infinity, r = 0.4) => clamp(Math.min((t - t0) / r, (t1 - t) / r));

// Número pseudoaleatório estável por índice.
export const hash = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ------------------------------------------------------------------ texto
export function fonte(ctx, size, weight = 700, family = 'Montserrat') {
  ctx.font = `${weight} ${size}px ${family}, Arial, sans-serif`;
}

function quebrar(ctx, str, maxW) {
  const linhas = [];
  for (const par of String(str).split('\n')) {
    let atual = '';
    for (const palavra of par.split(' ')) {
      const tent = atual ? `${atual} ${palavra}` : palavra;
      if (ctx.measureText(tent).width > maxW && atual) {
        linhas.push(atual);
        atual = palavra;
      } else atual = tent;
    }
    linhas.push(atual);
  }
  return linhas;
}

// Texto com quebra automática. Retorna a altura ocupada.
export function texto(ctx, str, x, y, o = {}) {
  const {
    size = 44, weight = 700, family = 'Montserrat', color = C.texto, align = 'center',
    maxW = SEGURO.larg - 48, lineH = 1.18, alpha = 1, sombra = true, base = 'middle',
  } = o;
  if (alpha <= 0) return 0;
  ctx.save();
  ctx.globalAlpha *= alpha;
  fonte(ctx, size, weight, family);
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  const linhas = quebrar(ctx, str, maxW);
  const lh = size * lineH;
  let y0 = base === 'middle' ? y - ((linhas.length - 1) * lh) / 2 : y;
  if (sombra) {
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = size * 0.35;
    ctx.shadowOffsetY = size * 0.06;
  }
  ctx.fillStyle = color;
  for (const l of linhas) {
    ctx.fillText(l, x, y0);
    y0 += lh;
  }
  ctx.restore();
  return linhas.length * lh;
}

// Selo de data/assunto no alto, centralizado na coluna segura.
export function selo(ctx, str, p, o = {}) {
  if (p <= 0) return;
  const { y = 92, cor = C.texto, fundo = 'rgba(8,14,26,0.78)', borda = 'rgba(255,255,255,0.22)', size = 30 } = o;
  ctx.save();
  fonte(ctx, size, 700);
  const w = ctx.measureText(str).width + 48;
  const h = size * 1.75;
  const e = easeOutBack(clamp(p));
  ctx.globalAlpha *= clamp(p * 1.5);
  ctx.translate(SEGURO.cx, y);
  ctx.scale(lerp(0.7, 1, e), lerp(0.7, 1, e));
  ctx.fillStyle = fundo;
  ctx.strokeStyle = borda;
  ctx.lineWidth = 1.5;
  rrect(ctx, -w / 2, -h / 2, w, h, h / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = cor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, 0, 2);
  ctx.restore();
}

// Datilografa o texto (revela letra a letra).
export const digitar = (str, p) => str.slice(0, Math.round(str.length * clamp(p)));

export function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Faixa escura atrás de textos para legibilidade sobre o mapa.
export function faixa(ctx, y, h, alpha = 0.55) {
  const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  g.addColorStop(0, 'rgba(5,9,18,0)');
  g.addColorStop(0.25, `rgba(5,9,18,${alpha})`);
  g.addColorStop(0.75, `rgba(5,9,18,${alpha})`);
  g.addColorStop(1, 'rgba(5,9,18,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, y - h / 2, W, h);
}

export function vinheta(ctx, forca = 0.6) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${forca})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// ------------------------------------------------------------------ carimbo
export function carimbo(ctx, str, x, y, p, o = {}) {
  if (p <= 0) return;
  const { cor = '#E0393E', size = 54, rot = -0.12, sub = null, subSize = 24 } = o;
  const e = clamp(p / 0.35);
  const esc = lerp(2.4, 1, easeOut(e));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(esc, esc);
  ctx.globalAlpha *= clamp(e * 1.6) * 0.95;
  fonte(ctx, size, 800);
  const w = Math.min(ctx.measureText(str).width + size * 0.9, SEGURO.larg - 40);
  const h = size * 1.5 + (sub ? subSize * 1.4 : 0);
  ctx.strokeStyle = cor;
  ctx.fillStyle = cor;
  ctx.lineWidth = size * 0.09;
  rrect(ctx, -w / 2, -h / 2, w, h, size * 0.18);
  ctx.stroke();
  ctx.lineWidth = size * 0.03;
  rrect(ctx, -w / 2 + size * 0.14, -h / 2 + size * 0.14, w - size * 0.28, h - size * 0.28, size * 0.1);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const yTxt = sub ? -subSize * 0.6 : 0;
  ctx.fillText(str, 0, yTxt + 2, w - size * 0.5);
  if (sub) {
    fonte(ctx, subSize, 700);
    ctx.fillText(sub, 0, yTxt + size * 0.55 + subSize * 0.5, w - size * 0.5);
  }
  // falhas de tinta
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 28; i++) {
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc((hash(i) - 0.5) * w, (hash(i + 50) - 0.5) * h, 1 + hash(i + 99) * 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ setas
// Seta curva de a até b (coordenadas de tela), desenhada até a fração p.
export function seta(ctx, a, b, p, o = {}) {
  if (p <= 0) return;
  const { cor = C.vermelho, larg = 9, curva = 0.18, ponta = 26, alpha = 1 } = o;
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const cx = mx - dy * curva;
  const cy = my + dx * curva;
  const N = 40;
  const pts = [];
  for (let i = 0; i <= N * p; i++) {
    const u = i / N;
    pts.push([
      (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * cx + u * u * b[0],
      (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * cy + u * u * b[1],
    ]);
  }
  if (pts.length < 2) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = cor;
  ctx.fillStyle = cor;
  ctx.lineWidth = larg;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  const fim = pts.at(-1);
  const ant = pts.at(-2);
  const ang = Math.atan2(fim[1] - ant[1], fim[0] - ant[0]);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const q of pts.slice(1, -1)) ctx.lineTo(q[0], q[1]);
  ctx.lineTo(fim[0] - Math.cos(ang) * ponta * 0.6, fim[1] - Math.sin(ang) * ponta * 0.6);
  ctx.stroke();
  ctx.translate(fim[0], fim[1]);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(-ponta, -ponta * 0.62);
  ctx.lineTo(-ponta * 0.72, 0);
  ctx.lineTo(-ponta, ponta * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  return { fim, ang };
}

// Ponto pulsante com anéis que se expandem.
export function pulso(ctx, x, y, t, o = {}) {
  const { cor = C.vermelho, r = 10, alpha = 1, periodo = 1.4 } = o;
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  for (let k = 0; k < 2; k++) {
    const f = ((t / periodo + k / 2) % 1 + 1) % 1;
    ctx.strokeStyle = cor;
    ctx.globalAlpha = alpha * (1 - f) * 0.8;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r + f * r * 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = alpha;
  ctx.fillStyle = cor;
  ctx.shadowColor = cor;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function rotulo(ctx, str, x, y, o = {}) {
  const { size = 24, cor = C.texto, alpha = 1, dx = 18, align = 'left' } = o;
  texto(ctx, str, x + (align === 'left' ? dx : align === 'right' ? -dx : 0), y, { size, weight: 700, color: cor, align, alpha, maxW: 400 });
}

// ------------------------------------------------------------------ ícones
// Cada ícone é desenhado centrado em (x, y) com tamanho base s.
function tr(ctx, x, y, s, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale(s / 100, s / 100);
}

export function tanque(ctx, x, y, s, cor = C.vermelho, rot = 0) {
  tr(ctx, x, y, s, rot);
  ctx.fillStyle = cor;
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 4;
  rrect(ctx, -46, 2, 92, 26, 13);
  ctx.fill();
  ctx.stroke();
  rrect(ctx, -38, -14, 72, 20, 6);
  ctx.fill();
  ctx.stroke();
  rrect(ctx, -16, -30, 34, 18, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(16, -25, 46, 7);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(i * 12, 15, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function ogiva(ctx, x, y, s, cor = '#D8DEE8') {
  tr(ctx, x, y, s);
  ctx.fillStyle = cor;
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -48);
  ctx.bezierCurveTo(22, -30, 20, -5, 18, 30);
  ctx.lineTo(-18, 30);
  ctx.bezierCurveTo(-20, -5, -22, -30, 0, -48);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#E2B93B';
  ctx.beginPath();
  ctx.moveTo(-18, 30);
  ctx.lineTo(-30, 48);
  ctx.lineTo(30, 48);
  ctx.lineTo(18, 30);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // símbolo de radiação
  ctx.fillStyle = '#1A1A1A';
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 3;
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 13, a - 0.5, a + 0.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function soldado(ctx, x, y, s, cor = '#4F6B3E') {
  tr(ctx, x, y, s);
  ctx.fillStyle = cor;
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 4;
  // capacete e cabeça
  ctx.beginPath();
  ctx.arc(0, -52, 15, Math.PI, 0);
  ctx.lineTo(18, -48);
  ctx.lineTo(-18, -48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2B3324';
  ctx.fillRect(-11, -48, 22, 14);
  ctx.fillStyle = cor;
  // corpo
  rrect(ctx, -20, -32, 40, 46, 10);
  ctx.fill();
  ctx.stroke();
  // pernas
  ctx.fillRect(-17, 12, 13, 36);
  ctx.fillRect(4, 12, 13, 36);
  // fuzil
  ctx.fillStyle = '#1E2418';
  ctx.save();
  ctx.rotate(-0.7);
  ctx.fillRect(-6, -40, 8, 70);
  ctx.restore();
  ctx.restore();
}

export function igreja(ctx, x, y, s, cor = C.ouro) {
  tr(ctx, x, y, s);
  ctx.fillStyle = '#EDE3CC';
  ctx.strokeStyle = 'rgba(40,30,20,0.6)';
  ctx.lineWidth = 3;
  ctx.fillRect(-40, -10, 80, 50);
  ctx.strokeRect(-40, -10, 80, 50);
  ctx.fillRect(-14, -36, 28, 28);
  ctx.strokeRect(-14, -36, 28, 28);
  ctx.fillStyle = cor;
  const cupula = (cx, cy, r) => {
    ctx.beginPath();
    ctx.moveTo(cx - r, cy);
    ctx.bezierCurveTo(cx - r, cy - r * 1.3, cx - 2, cy - r * 1.2, cx, cy - r * 2);
    ctx.bezierCurveTo(cx + 2, cy - r * 1.2, cx + r, cy - r * 1.3, cx + r, cy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(cx - 1.5, cy - r * 2 - 14, 3, 14);
    ctx.fillRect(cx - 6, cy - r * 2 - 10, 12, 3);
  };
  cupula(0, -36, 16);
  cupula(-30, -10, 10);
  cupula(30, -10, 10);
  ctx.fillStyle = '#6B4E2E';
  rrect(ctx, -8, 14, 16, 26, 7);
  ctx.fill();
  ctx.restore();
}

export function coroa(ctx, x, y, s, cor = C.ouro) {
  tr(ctx, x, y, s);
  ctx.fillStyle = cor;
  ctx.strokeStyle = 'rgba(40,25,10,0.7)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-40, 26);
  ctx.lineTo(-46, -18);
  ctx.lineTo(-22, 2);
  ctx.lineTo(0, -32);
  ctx.lineTo(22, 2);
  ctx.lineTo(46, -18);
  ctx.lineTo(40, 26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#B3262E';
  for (const [cx, cy] of [[-46, -22], [0, -36], [46, -22]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Livro: aberto (p=0) a fechado (p=1).
export function livro(ctx, x, y, s, p = 0) {
  tr(ctx, x, y, s);
  const ab = 1 - clamp(p);
  ctx.strokeStyle = 'rgba(40,25,10,0.7)';
  ctx.lineWidth = 3;
  // capa
  ctx.fillStyle = '#6E3B2A';
  rrect(ctx, -6 - 84 * ab, -58, 12 + 84 * ab + 84, 116, 8);
  ctx.fill();
  // páginas direita
  ctx.fillStyle = C.papel;
  ctx.fillRect(4, -52, 74, 104);
  ctx.strokeRect(4, -52, 74, 104);
  // página esquerda (gira ao fechar)
  ctx.save();
  ctx.scale(lerp(1, -1, clamp(p)), 1);
  ctx.fillStyle = '#E8DCC2';
  ctx.fillRect(-78, -52, 74, 104);
  ctx.strokeRect(-78, -52, 74, 104);
  ctx.restore();
  // linhas em "cirílico"
  fonte(ctx, 9, 700, 'Inter');
  ctx.fillStyle = 'rgba(42,36,32,0.75)';
  ctx.textAlign = 'left';
  const linhas = ['КОБЗАР', 'Як умру,', 'то поховайте', 'мене на', 'могилі,', 'серед степу', 'широкого'];
  linhas.forEach((l, i) => ctx.fillText(l, 12, -38 + i * 13, 60));
  if (p < 0.5) linhas.forEach((l, i) => ctx.fillText(l, -70, -38 + i * 13, 60));
  ctx.restore();
}

export function carro(ctx, x, y, s, cor = '#2E3440', rot = 0) {
  tr(ctx, x, y, s, rot);
  ctx.fillStyle = cor;
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 3;
  rrect(ctx, -48, -6, 96, 26, 10);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-28, -6);
  ctx.lineTo(-16, -26);
  ctx.lineTo(22, -26);
  ctx.lineTo(34, -6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#9FB6D6';
  ctx.fillRect(-12, -22, 14, 13);
  ctx.fillRect(6, -22, 14, 13);
  ctx.fillStyle = '#111';
  for (const cx of [-28, 28]) {
    ctx.beginPath();
    ctx.arc(cx, 22, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function urna(ctx, x, y, s) {
  tr(ctx, x, y, s);
  ctx.fillStyle = '#E9EEF5';
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 4;
  rrect(ctx, -50, -30, 100, 80, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2A3446';
  ctx.fillRect(-30, -34, 60, 8);
  ctx.fillStyle = '#fff';
  ctx.save();
  ctx.translate(0, -52);
  ctx.rotate(0.15);
  ctx.fillRect(-20, -22, 40, 34);
  ctx.strokeRect(-20, -22, 40, 34);
  ctx.strokeStyle = C.laranja;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-10, -5);
  ctx.lineTo(-2, 4);
  ctx.lineTo(12, -14);
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

export function caminhao(ctx, x, y, s, cor = '#5B5F66') {
  tr(ctx, x, y, s);
  ctx.fillStyle = cor;
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 4;
  rrect(ctx, -50, -26, 66, 40, 4);
  ctx.fill();
  ctx.stroke();
  rrect(ctx, 18, -14, 30, 28, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#C9A55A';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(-36 + i * 19, -30, 10, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#111';
  for (const cx of [-32, 2, 34]) {
    ctx.beginPath();
    ctx.arc(cx, 18, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function pessoa(ctx, x, y, s, cor = C.cinza) {
  tr(ctx, x, y, s);
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.arc(0, -40, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-26, 46);
  ctx.quadraticCurveTo(-28, -18, 0, -18);
  ctx.quadraticCurveTo(28, -18, 26, 46);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function explosao(ctx, x, y, s, p) {
  if (p <= 0 || p >= 1) return;
  tr(ctx, x, y, s * lerp(0.4, 1.3, easeOut(p)));
  ctx.globalAlpha *= 1 - p;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
  g.addColorStop(0, 'rgba(255,250,220,1)');
  g.addColorStop(0.35, 'rgba(255,170,60,0.95)');
  g.addColorStop(0.7, 'rgba(220,60,40,0.6)');
  g.addColorStop(1, 'rgba(120,20,20,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const r = i % 2 ? 26 : 50;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function foiceMartelo(ctx, x, y, s, cor = '#F2C94C') {
  tr(ctx, x, y, s);
  ctx.strokeStyle = cor;
  ctx.fillStyle = cor;
  ctx.lineCap = 'round';
  // foice
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(-4, -6, 34, -2.4, 1.1);
  ctx.stroke();
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-16, 22);
  ctx.lineTo(-34, 42);
  ctx.stroke();
  // martelo
  ctx.save();
  ctx.rotate(-0.78);
  ctx.fillRect(-5, -26, 10, 66);
  ctx.fillRect(-18, -38, 36, 16);
  ctx.restore();
  ctx.restore();
}

// Marcador com cadeado. quebra: 0 inteiro, 1 partido ao meio.
export function marcador(ctx, x, y, s, quebra = 0) {
  tr(ctx, x, y, s);
  const metade = (lado) => {
    ctx.save();
    const q = easeOut(clamp(quebra));
    ctx.translate(lado * q * 34, q * 26);
    ctx.rotate(lado * q * 0.12);
    ctx.beginPath();
    ctx.rect(lado < 0 ? -60 : 0, -80, 60, 170);
    ctx.clip();
    ctx.fillStyle = C.amarelo;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-36, -70);
    ctx.lineTo(36, -70);
    ctx.lineTo(36, 70);
    ctx.lineTo(0, 44);
    ctx.lineTo(-36, 70);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // cadeado
    ctx.strokeStyle = '#2A2F3A';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, -22, 13, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#2A2F3A';
    rrect(ctx, -19, -22, 38, 30, 5);
    ctx.fill();
    ctx.fillStyle = C.amarelo;
    ctx.beginPath();
    ctx.arc(0, -9, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  metade(-1);
  metade(1);
  if (quebra > 0 && quebra < 1) {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -80);
    for (let i = 1; i <= 8; i++) ctx.lineTo((i % 2 ? 6 : -6), -80 + i * 20);
    ctx.globalAlpha *= 1 - quebra;
    ctx.stroke();
  }
  ctx.restore();
}

export function globo(ctx, x, y, r, t, cor = C.texto) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = cor;
  ctx.lineWidth = 2;
  ctx.globalAlpha *= 0.85;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha *= 0.55;
  for (let k = 0; k < 6; k++) {
    const ph = ((t * 0.25 + k / 6) % 1) * Math.PI;
    const rx = Math.abs(Math.cos(ph)) * r;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, r, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const f of [-0.6, -0.3, 0, 0.3, 0.6]) {
    const yy = f * r;
    const rr = Math.sqrt(r * r - yy * yy);
    ctx.beginPath();
    ctx.ellipse(0, yy, rr, rr * 0.18, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// Silhueta do Kremlin (torres com estrelas).
export function kremlin(ctx, x, y, s, cor = 'rgba(0,0,0,0.35)') {
  tr(ctx, x, y, s);
  ctx.fillStyle = cor;
  ctx.fillRect(-160, 0, 320, 40);
  for (let i = -7; i <= 7; i++) ctx.fillRect(i * 22 - 7, -12, 14, 14);
  const torre = (cx, h, w) => {
    ctx.fillRect(cx - w / 2, -h, w, h);
    ctx.beginPath();
    ctx.moveTo(cx - w / 2 - 4, -h);
    ctx.lineTo(cx, -h - w * 2.1);
    ctx.lineTo(cx + w / 2 + 4, -h);
    ctx.closePath();
    ctx.fill();
    estrela(ctx, cx, -h - w * 2.1 - 10, 10, '#E04848');
    ctx.fillStyle = cor;
  };
  torre(0, 110, 34);
  torre(-110, 70, 26);
  torre(110, 70, 26);
  ctx.restore();
}

// Cúpulas douradas (Kiev).
export function cupulas(ctx, x, y, s, cor = C.ouro) {
  tr(ctx, x, y, s);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(-150, -20, 300, 60);
  ctx.fillStyle = cor;
  const cup = (cx, cy, r) => {
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(cx - r * 0.7, cy, r * 1.4, -cy - 20);
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.moveTo(cx - r, cy);
    ctx.bezierCurveTo(cx - r, cy - r * 1.3, cx - 2, cy - r * 1.2, cx, cy - r * 2);
    ctx.bezierCurveTo(cx + 2, cy - r * 1.2, cx + r, cy - r * 1.3, cx + r, cy);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(cx - 2, cy - r * 2 - 16, 4, 16);
    ctx.fillRect(cx - 7, cy - r * 2 - 11, 14, 3);
  };
  cup(0, -70, 30);
  cup(-80, -40, 20);
  cup(80, -40, 20);
  cup(-130, -24, 13);
  cup(130, -24, 13);
  ctx.restore();
}

export function estrela(ctx, x, y, r, cor) {
  ctx.save();
  ctx.fillStyle = cor;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.42 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------ bandeiras
export function bandeira(ctx, cod, x, y, w, h, o = {}) {
  const { alpha = 1, borda = true } = o;
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x - w / 2, y - h / 2);
  ctx.save();
  rrect(ctx, 0, 0, w, h, Math.min(w, h) * 0.08);
  ctx.clip();
  const faixasH = (cores) => cores.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, (h * i) / cores.length, w, h / cores.length + 1);
  });
  const faixasV = (cores) => cores.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect((w * i) / cores.length, 0, w / cores.length + 1, h);
  });
  if (cod === 'ru') faixasH(['#FFFFFF', '#1C3FAA', '#D52B1E']);
  else if (cod === 'ua') faixasH(['#0057B7', '#FFD700']);
  else if (cod === 'by') {
    ctx.fillStyle = '#C8313E';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#4AA657';
    ctx.fillRect(0, (h * 2) / 3, w, h / 3);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w * 0.11, h);
    ctx.fillStyle = '#C8313E';
    for (let i = 0; i < 8; i++) ctx.fillRect(w * 0.03, h * (0.05 + i * 0.12), w * 0.05, h * 0.06);
  } else if (cod === 'de') faixasH(['#000000', '#DD0000', '#FFCE00']);
  else if (cod === 'fr') faixasV(['#0055A4', '#FFFFFF', '#EF4135']);
  else if (cod === 'eu' || cod === 'otan' || cod === 'osce') {
    ctx.fillStyle = cod === 'eu' ? '#003399' : cod === 'otan' ? '#004990' : '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    if (cod === 'eu') {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        estrela(ctx, w / 2 + Math.cos(a) * h * 0.32, h / 2 + Math.sin(a) * h * 0.32, h * 0.055, '#FFCC00');
      }
    } else if (cod === 'otan') {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      const cx = w / 2;
      const cy = h / 2;
      const r = h * 0.3;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const rr = i % 2 ? r * 0.22 : r;
        ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = Math.max(1, h * 0.03);
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.75, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#1E3A6E';
      fonte(ctx, h * 0.32, 800);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('OSCE', w / 2, h / 2 + 1);
    }
  } else if (cod === 'us') {
    for (let i = 0; i < 13; i++) {
      ctx.fillStyle = i % 2 ? '#FFFFFF' : '#B22234';
      ctx.fillRect(0, (h * i) / 13, w, h / 13 + 1);
    }
    ctx.fillStyle = '#3C3B6E';
    ctx.fillRect(0, 0, w * 0.4, (h * 7) / 13);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) {
      ctx.beginPath();
      ctx.arc(w * (0.04 + i * 0.08), h * (0.06 + j * 0.13), Math.max(1, h * 0.022), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (cod === 'uk') {
    ctx.fillStyle = '#012169';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = h * 0.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, h);
    ctx.moveTo(w, 0);
    ctx.lineTo(0, h);
    ctx.stroke();
    ctx.strokeStyle = '#C8102E';
    ctx.lineWidth = h * 0.07;
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = h * 0.33;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.strokeStyle = '#C8102E';
    ctx.lineWidth = h * 0.2;
    ctx.stroke();
  }
  ctx.restore();
  if (borda) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    rrect(ctx, 0, 0, w, h, Math.min(w, h) * 0.08);
    ctx.stroke();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ documento
export function documento(ctx, x, y, w, h, o = {}) {
  const { titulo = '', linhas = 5, rot = 0, alpha = 1, destaque = null, bandeiras = [], assinatura = 0, sub = null } = o;
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = C.papel;
  rrect(ctx, -w / 2, -h / 2, w, h, 10);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  let yy = -h / 2 + 42;
  if (bandeiras.length) {
    const bw = 54;
    const total = bandeiras.length * bw + (bandeiras.length - 1) * 14;
    bandeiras.forEach((b, i) => bandeira(ctx, b, -total / 2 + bw / 2 + i * (bw + 14), yy, bw, 34));
    yy += 44;
  }
  yy += texto(ctx, titulo, 0, yy, { size: 26, weight: 800, color: C.tinta, sombra: false, maxW: w - 50, base: 'top' }) - 4;
  if (sub) {
    texto(ctx, sub, 0, yy, { size: 18, weight: 500, family: 'Inter', color: 'rgba(42,36,32,0.8)', sombra: false, maxW: w - 50, base: 'top' });
    yy += 34;
  }
  ctx.strokeStyle = 'rgba(42,36,32,0.25)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  for (let i = 0; i < linhas; i++) {
    const ly = yy + 10 + i * 22;
    if (ly > h / 2 - 50) break;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 34, ly);
    ctx.lineTo(w / 2 - 34 - (i === linhas - 1 ? w * 0.3 : (hash(i) * w * 0.15)), ly);
    ctx.stroke();
  }
  if (destaque) {
    const dy = yy + 10 + Math.min(linhas, 3) * 22 + 18;
    ctx.fillStyle = 'rgba(198,47,58,0.12)';
    rrect(ctx, -w / 2 + 24, dy - 22, w - 48, 44, 8);
    ctx.fill();
    texto(ctx, destaque, 0, dy, { size: 24, weight: 800, color: '#A3222B', sombra: false, maxW: w - 60 });
  }
  if (assinatura > 0) {
    ctx.strokeStyle = '#1D3F8A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const n = Math.floor(60 * clamp(assinatura));
    for (let i = 0; i <= n; i++) {
      const u = i / 60;
      const sx = -w / 2 + 50 + u * (w - 100);
      const sy = h / 2 - 40 + Math.sin(u * 30) * 9 * Math.sin(u * 3.1);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function pizza(ctx, x, y, r, frac, cor, o = {}) {
  const { fundo = 'rgba(255,255,255,0.15)' } = o;
  ctx.save();
  ctx.fillStyle = fundo;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export const fmt = (n) => Math.round(n).toLocaleString('pt-BR');
