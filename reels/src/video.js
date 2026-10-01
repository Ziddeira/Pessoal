// Angel Tech — Reels 9:16 (1080x1920)
// Todo o vídeo é desenhado em <canvas> por renderFrame(ctx, t, assets).
// A função é determinística: o mesmo t sempre gera o mesmo quadro, o que
// permite tocar ao vivo no navegador e renderizar quadro a quadro para MP4.
//
// Regras do kit de marca seguidas aqui:
// - Fundo azul noite; azul Angel só como traço e destaque, nunca como fundo.
// - Âmbar só em preço, botão e selo.
// - Montserrat 700/800 em caixa alta nos títulos; Inter no texto corrido.
// - Logo sem distorção, sem rotação e sem sombra.
// - Preço e prazo na frente; garantia citada; nada de "consulte no direct".

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const DURATION = 29;

export const C = {
  noite: '#0C1C33',
  angel: '#1C89DC',
  branco: '#FFFFFF',
  ambar: '#F5A623',
};

const ANGEL_RGB = '28,137,220';
const angelA = (a) => `rgba(${ANGEL_RGB},${a})`;

// Linha do tempo das cenas, em segundos.
export const SCENES = {
  gancho: [0, 3.2],
  tempo: [3.2, 6.6],
  preco: [6.6, 10.2],
  garantia: [10.2, 13.8],
  molhou: [13.8, 17.4],
  servicos: [17.4, 21.6],
  orcamento: [21.6, 24.4],
  final: [24.4, DURATION],
};

const SERVICOS = [
  'TROCA DE BATERIA',
  'BANHO QUÍMICO',
  'PELÍCULAS E ACESSÓRIOS',
  'NOTEBOOK E COMPUTADOR',
  'IMPRESSORAS',
  'DESBLOQUEIO ANDROID',
  'LIMPEZA E REMOÇÃO DE VÍRUS',
];
const SERVICOS_T0 = 17.75;
const SERVICOS_STEP = 0.22;

const TYPE_T0 = 22.4;
const TYPE_CPS = 40;
const TYPE_L1 = 'Se não compensar consertar,';
const TYPE_L2 = 'a gente fala.';

// Efeitos sonoros sincronizados com a imagem (lidos por audio.js).
export const CUES = [
  { t: 0, type: 'riser' },
  { t: 0.1, type: 'pop' },
  { t: 0.55, type: 'impact' },
  { t: 0.62, type: 'pop' },
  ...Object.values(SCENES).slice(1).map(([s]) => ({ t: s - 0.14, type: 'whoosh' })),
  ...Array.from({ length: 9 }, (_, i) => ({ t: 3.7 + i * 0.2, type: 'tick' })),
  { t: 5.35, type: 'pop' },
  { t: 6.95, type: 'stamp' },
  { t: 6.95, type: 'ding' },
  { t: 11.0, type: 'pop' },
  { t: 11.35, type: 'stamp' },
  { t: 13.9, type: 'stamp' },
  ...[14.1, 14.45, 15.0, 15.65, 16.3].map((t) => ({ t, type: 'drop' })),
  { t: 15.3, type: 'pop' },
  ...SERVICOS.map((_, i) => ({ t: SERVICOS_T0 + i * SERVICOS_STEP, type: 'pop' })),
  ...typeCueTimes().map((t) => ({ t, type: 'type' })),
  { t: 24.45, type: 'impact' },
  { t: 24.6, type: 'chime' },
  { t: 25.3, type: 'pop' },
];

// Um clique por caractere visível do texto digitado.
function typeCueTimes() {
  const full = TYPE_L1 + TYPE_L2;
  return [...full].flatMap((ch, k) => (ch === ' ' ? [] : [TYPE_T0 + (k + 1) / TYPE_CPS]));
}

// Trilha: batida começa no impacto e some no "orçamento" (breakdown).
export const MUSIC = { start: 0.55, breaks: [[21.6, 24.4]] };

// ---------------------------------------------------------------- utilidades

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
const ease = {
  in: (t) => t * t * t,
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function setFont(ctx, size, weight, font, spacing) {
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
    size = 80, weight = 800, font = 'Montserrat', color = C.branco,
    align = 'center', spacing = 0, alpha = 1, base = 'alphabetic', maxW = 900,
  } = o;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const s = fitSize(ctx, str, size, weight, font, spacing, maxW);
  setFont(ctx, s, weight, font, spacing);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  // letterSpacing também é aplicado após o último caractere; compensa no centro.
  ctx.fillText(str, align === 'center' ? x + spacing / 2 : x, y);
  ctx.restore();
}

// Linha com trechos de cores diferentes, centralizada em x.
function rich(ctx, segs, x, y, o = {}) {
  const { size = 80, weight = 800, font = 'Montserrat', spacing = 0, maxW = 900 } = o;
  ctx.save();
  const full = segs.map(([s]) => s).join('');
  const s = fitSize(ctx, full, size, weight, font, spacing, maxW);
  setFont(ctx, s, weight, font, spacing);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const widths = segs.map(([str]) => ctx.measureText(str).width);
  let cx = x - widths.reduce((a, b) => a + b, 0) / 2;
  segs.forEach(([str, color], i) => {
    ctx.fillStyle = color;
    ctx.fillText(str, cx, y);
    cx += widths[i];
  });
  ctx.restore();
}

// Entrada animada: sobe dy px, ganha opacidade e sai da escala `scale` para 1.
function anim(ctx, t, t0, o, draw) {
  const { dur = 0.45, x = W / 2, y = 0, dy = 50, dx = 0, scale = 1, curve = ease.out } = o;
  const p = prog(t, t0, t0 + dur);
  if (p <= 0) return;
  const k = curve(p);
  ctx.save();
  ctx.globalAlpha *= clamp(p * 1.8);
  ctx.translate(x + dx * (1 - k), y + dy * (1 - k));
  const s = lerp(scale, 1, k);
  ctx.scale(s, s);
  ctx.translate(-x, -y);
  draw();
  ctx.restore();
}

function polyLen(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
}

// Desenha só a fração p do traçado (efeito de "desenhar a linha").
function strokePartial(ctx, pts, p) {
  if (p <= 0) return;
  const L = polyLen(pts) * clamp(p);
  let acc = 0;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const d = Math.hypot(x1 - x0, y1 - y0);
    if (acc + d >= L) {
      const f = d ? (L - acc) / d : 0;
      ctx.lineTo(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f);
      break;
    }
    ctx.lineTo(x1, y1);
    acc += d;
  }
  ctx.stroke();
}

function quad(pts, p0, p1, p2, n) {
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    pts.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]);
  }
}

// ------------------------------------------------------ geometria pré-calculada

const PHONE = { w: 380, h: 780, r: 60 };
const SCREEN = { w: PHONE.w - 40, h: PHONE.h - 40, r: 44 };
const PHONE_Y = 1020;
const PHONE_S = 0.85;
const IMPACT = { x: 60, y: -150 };

const CRACKS = (() => {
  const r = mulberry32(7);
  const out = [];
  const n = 11;
  for (let i = 0; i < n; i++) {
    let a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.5;
    let x = IMPACT.x;
    let y = IMPACT.y;
    const pts = [[x, y]];
    const len = 200 + r() * 420;
    const segs = 6 + Math.floor(r() * 4);
    for (let s = 0; s < segs; s++) {
      a += (r() - 0.5) * 0.6;
      x += (Math.cos(a) * len) / segs;
      y += (Math.sin(a) * len) / segs;
      pts.push([x, y]);
    }
    out.push({ pts, w: 2 + r() * 3, delay: 0 });
    if (r() > 0.4) {
      const k = 2 + Math.floor(r() * 3);
      let [bx, by] = pts[k];
      let ba = a + (r() > 0.5 ? 1 : -1) * (0.6 + r() * 0.6);
      const bp = [[bx, by]];
      for (let s = 0; s < 3; s++) {
        ba += (r() - 0.5) * 0.5;
        bx += Math.cos(ba) * 45;
        by += Math.sin(ba) * 45;
        bp.push([bx, by]);
      }
      out.push({ pts: bp, w: 1.5, delay: 0.35 });
    }
  }
  const ring = [];
  for (let i = 0; i <= 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const rr = 38 + r() * 14;
    ring.push([IMPACT.x + Math.cos(a) * rr, IMPACT.y + Math.sin(a) * rr]);
  }
  out.push({ pts: ring, w: 2, delay: 0.15 });
  return out;
})();

const SHARDS = (() => {
  const r = mulberry32(21);
  return Array.from({ length: 14 }, () => ({
    a: r() * Math.PI * 2,
    v: 260 + r() * 520,
    s: 5 + r() * 9,
    spin: (r() - 0.5) * 18,
  }));
})();

const SHIELD = (() => {
  const pts = [[0, -210]];
  quad(pts, [0, -210], [90, -150], [180, -150], 12);
  pts.push([180, -20]);
  quad(pts, [180, -20], [170, 150], [0, 230], 20);
  quad(pts, [0, 230], [-170, 150], [-180, -20], 20);
  pts.push([-180, -150]);
  quad(pts, [-180, -150], [-90, -150], [0, -210], 12);
  return pts;
})();
const CHECK = [[-80, 10], [-22, 72], [96, -62]];

const PARTICLES = (() => {
  const r = mulberry32(3);
  return Array.from({ length: 38 }, () => ({
    x: r() * W, y: r() * H, sp: 15 + r() * 45, r: 1.5 + r() * 3, a: 0.06 + r() * 0.16,
  }));
})();

const DROPS = (() => {
  const r = mulberry32(11);
  return Array.from({ length: 26 }, () => ({
    x: 40 + r() * (W - 80), off: r() * (H + 300), sp: 520 + r() * 700, s: 9 + r() * 14, a: 0.18 + r() * 0.3,
  }));
})();

// Tremidas de câmera: [início, amplitude px, duração].
const SHAKES = [[0.55, 22, 0.4], [6.95, 12, 0.3], [11.35, 10, 0.25], [13.9, 10, 0.3], [24.45, 8, 0.3]];

// ---------------------------------------------------------------- camadas

function drawBackground(ctx, t) {
  ctx.fillStyle = C.noite;
  ctx.fillRect(0, 0, W, H);

  const boost = 1 + 0.6 * ease.out(prog(t, 24.4, 25.2));
  const gx = W / 2 + Math.sin(t * 0.4) * 120;
  const gy = 900 + Math.cos(t * 0.3) * 160;
  const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 950);
  g.addColorStop(0, angelA(0.15 * boost));
  g.addColorStop(1, angelA(0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Grade fina em azul Angel (traço, não preenchimento), subindo devagar.
  const s = 120;
  const off = (t * 22) % s;
  ctx.save();
  ctx.strokeStyle = angelA(0.06);
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= W; x += s) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = -off; y <= H + s; y += s) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
  ctx.restore();

  for (const p of PARTICLES) {
    const y = (((p.y - t * p.sp) % H) + H) % H;
    ctx.fillStyle = angelA(p.a);
    ctx.beginPath();
    ctx.arc(p.x, y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  const v = ctx.createRadialGradient(W / 2, H / 2, 520, W / 2, H / 2, 1250);
  v.addColorStop(0, 'rgba(4,10,20,0)');
  v.addColorStop(1, 'rgba(4,10,20,0.55)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

// Símbolo pequeno no topo durante o vídeo (só o símbolo: abaixo de 120 px o texto do logo some).
function drawWatermark(ctx, t, A) {
  const a = prog(t, 0.8, 1.2) * (1 - prog(t, 24.0, 24.35));
  if (a <= 0) return;
  const w = 150;
  const h = (w * A.simbolo.height) / A.simbolo.width;
  ctx.save();
  ctx.globalAlpha = 0.95 * a;
  ctx.drawImage(A.simbolo, W / 2 - w / 2, 120, w, h);
  ctx.restore();
}

function drawPhone(ctx, t, A) {
  if (t >= SCENES.tempo[1]) return;
  const fall = prog(t, 0, 0.55);
  let y = lerp(-560, PHONE_Y, ease.in(fall));
  const rot = lerp(-0.45, 0, ease.in(fall));
  if (t > 0.55) {
    const b = prog(t, 0.55, 0.9);
    y = PHONE_Y - Math.sin(b * Math.PI) * 28 * (1 - b);
  }
  const pe = ease.in(prog(t, 6.25, 6.6));
  const s = PHONE_S * (1 - 0.3 * pe);

  ctx.save();
  ctx.globalAlpha *= 1 - pe;
  ctx.translate(W / 2, y);
  ctx.rotate(rot);
  ctx.scale(s, s);

  const { w, h, r } = PHONE;
  const sw = SCREEN.w;
  const sh = SCREEN.h;

  ctx.fillStyle = C.noite;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, r);
  ctx.fill();

  // Tela
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(-sw / 2, -sh / 2, sw, sh, SCREEN.r);
  ctx.clip();
  ctx.fillStyle = angelA(0.06);
  ctx.fillRect(-sw / 2, -sh / 2, sw, sh);

  const scanP = ease.inOut(prog(t, 3.7, 5.3));
  const scanY = -sh / 2 + sh * scanP;
  if (scanP > 0) {
    const g = ctx.createLinearGradient(0, -sh / 2, 0, sh / 2);
    g.addColorStop(0, angelA(0.32));
    g.addColorStop(1, angelA(0.08));
    ctx.fillStyle = g;
    ctx.fillRect(-sw / 2, -sh / 2, sw, scanY + sh / 2);
  }
  const hp = ease.out(prog(t, 5.25, 5.75));
  if (hp > 0) {
    const iw = lerp(180, 230, hp);
    const ih = (iw * A.simbolo.height) / A.simbolo.width;
    ctx.save();
    ctx.globalAlpha *= hp;
    ctx.drawImage(A.simbolo, -iw / 2, -ih / 2 - 20, iw, ih);
    ctx.restore();
  }

  const cp = prog(t, 0.55, 1.1);
  if (cp > 0 && scanP < 1) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-sw / 2, scanY, sw, sh);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const c of CRACKS) {
      ctx.lineWidth = c.w;
      strokePartial(ctx, c.pts, ease.out(clamp((cp - c.delay) / (1 - c.delay))));
    }
    ctx.restore();
  }

  if (scanP > 0 && scanP < 1) {
    const g = ctx.createLinearGradient(0, scanY - 110, 0, scanY);
    g.addColorStop(0, angelA(0));
    g.addColorStop(1, angelA(0.45));
    ctx.fillStyle = g;
    ctx.fillRect(-sw / 2, scanY - 110, sw, 110);
    ctx.fillStyle = C.branco;
    ctx.fillRect(-sw / 2, scanY - 3, sw, 6);
  }
  ctx.restore();

  // Câmera frontal e contorno
  ctx.fillStyle = C.noite;
  ctx.strokeStyle = C.angel;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(-58, -sh / 2 + 18, 116, 30, 15);
  ctx.fill();
  ctx.stroke();

  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, r);
  ctx.stroke();
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(w / 2 + 12, -h / 2 + 150);
  ctx.lineTo(w / 2 + 12, -h / 2 + 230);
  ctx.moveTo(-w / 2 - 12, -h / 2 + 140);
  ctx.lineTo(-w / 2 - 12, -h / 2 + 190);
  ctx.stroke();

  // Cacos de vidro voando no impacto
  const sp = prog(t, 0.55, 1.25);
  if (sp > 0 && sp < 1) {
    const dt = sp * 0.7;
    ctx.fillStyle = C.branco;
    for (const s2 of SHARDS) {
      const x = IMPACT.x + Math.cos(s2.a) * s2.v * dt;
      const yy = IMPACT.y + Math.sin(s2.a) * s2.v * dt + 900 * dt * dt;
      ctx.save();
      ctx.globalAlpha *= 1 - sp;
      ctx.translate(x, yy);
      ctx.rotate(s2.spin * dt);
      ctx.beginPath();
      ctx.moveTo(0, -s2.s);
      ctx.lineTo(s2.s * 0.8, s2.s * 0.6);
      ctx.lineTo(-s2.s * 0.7, s2.s * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function stopwatch(ctx, x, y, r, ang, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = r * 0.17;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(0, -r * 1.3);
  ctx.moveTo(-r * 0.32, -r * 1.34);
  ctx.lineTo(r * 0.32, -r * 1.34);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.sin(ang) * r * 0.6, -Math.cos(ang) * r * 0.6);
  ctx.stroke();
  ctx.restore();
}

function sceneGancho(ctx, t) {
  anim(ctx, t, 0.1, { y: 370, dy: 0, scale: 1.6, dur: 0.3, curve: ease.back }, () =>
    txt(ctx, 'CAIU.', W / 2, 370, { size: 140 }));
  anim(ctx, t, 0.62, { y: 510, dy: 0, scale: 1.6, dur: 0.3, curve: ease.back }, () =>
    txt(ctx, 'TRINCOU?', W / 2, 510, { size: 140, color: C.angel }));
  anim(ctx, t, 1.5, { y: 1460 }, () =>
    rich(ctx, [['Calma. A ', C.branco], ['Angel Tech', C.angel], [' resolve.', C.branco]], W / 2, 1460,
      { size: 50, weight: 500, font: 'Inter' }));
}

function sceneTempo(ctx, t) {
  anim(ctx, t, 3.3, { y: 370 }, () => txt(ctx, 'TROCA DE TELA', W / 2, 370, { size: 104 }));
  anim(ctx, t, 3.5, { y: 490 }, () =>
    rich(ctx, [['EM ', C.branco], ['40 MINUTOS', C.angel]], W / 2, 490, { size: 104 }));

  anim(ctx, t, 3.6, { y: 1455, scale: 0.7, curve: ease.back }, () => {
    const cw = 400;
    const ch = 112;
    ctx.save();
    ctx.fillStyle = C.noite;
    ctx.strokeStyle = C.angel;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(W / 2 - cw / 2, 1455 - ch / 2, cw, ch, ch / 2);
    ctx.fill();
    ctx.stroke();
    const cp = prog(t, 3.7, 5.3);
    const min = Math.round(40 * ease.inOut(cp));
    stopwatch(ctx, W / 2 - cw / 2 + 72, 1462, 28, cp * Math.PI * 2 * 4, C.branco);
    txt(ctx, `${String(min).padStart(2, '0')} MIN`, W / 2 - cw / 2 + 130, 1458, { size: 62, base: 'middle', align: 'left' });
    ctx.restore();
  });
}

function scenePreco(ctx, t) {
  anim(ctx, t, 6.7, { y: 620 }, () => txt(ctx, 'TROCA DE TELA', W / 2, 620, { size: 104 }));
  anim(ctx, t, 6.85, { y: 735 }, () =>
    txt(ctx, 'a partir de', W / 2, 735, { size: 54, weight: 500, font: 'Inter', alpha: 0.85 }));

  anim(ctx, t, 6.95, { y: 960, dy: 0, scale: 2.4, dur: 0.38, curve: ease.back }, () =>
    rich(ctx, [['R$ ', C.ambar], ['190', C.ambar]], W / 2, 1040, { size: 300, maxW: 960 }));

  const sw = prog(t, 7.1, 7.9);
  if (sw > 0 && sw < 1) {
    ctx.save();
    ctx.strokeStyle = angelA(1 - sw);
    ctx.lineWidth = 8 * (1 - sw) + 1;
    ctx.beginPath();
    ctx.arc(W / 2, 950, lerp(140, 720, ease.out(sw)), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  anim(ctx, t, 7.7, { y: 1210 }, () =>
    txt(ctx, 'Preço na frente. Sem enrolação.', W / 2, 1210, { size: 48, weight: 500, font: 'Inter' }));
}

function selo(ctx, x, y, r) {
  ctx.fillStyle = C.ambar;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(12,28,51,0.55)';
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 9]);
  ctx.beginPath();
  ctx.arc(x, y, r - 15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  txt(ctx, '90', x, y + r * 0.2, { size: r * 0.86, color: C.noite });
  txt(ctx, 'DIAS', x + 3, y + r * 0.56, { size: r * 0.3, color: C.noite, spacing: 6 });
}

function sceneGarantia(ctx, t) {
  anim(ctx, t, 10.3, { y: 380 }, () => txt(ctx, 'GARANTIA', W / 2, 380, { size: 132 }));
  anim(ctx, t, 10.45, { y: 490 }, () => txt(ctx, 'POR ESCRITO', W / 2, 490, { size: 92, color: C.angel }));

  const sp = ease.inOut(prog(t, 10.5, 11.1));
  ctx.save();
  ctx.translate(W / 2, 890);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (sp >= 1) {
    ctx.fillStyle = angelA(0.1);
    ctx.beginPath();
    SHIELD.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.fill();
  }
  ctx.strokeStyle = C.angel;
  ctx.lineWidth = 14;
  strokePartial(ctx, SHIELD, sp);
  ctx.strokeStyle = C.branco;
  ctx.lineWidth = 20;
  strokePartial(ctx, CHECK, ease.out(prog(t, 11.0, 11.3)));
  ctx.restore();

  const st = prog(t, 11.35, 11.6);
  if (st > 0) {
    ctx.save();
    ctx.globalAlpha *= clamp(st * 3);
    ctx.translate(780, 1080);
    ctx.rotate(-0.2);
    const s = lerp(1.9, 1, ease.out(st));
    ctx.scale(s, s);
    selo(ctx, 0, 0, 118);
    ctx.restore();
  }

  anim(ctx, t, 11.8, { y: 1310 }, () => {
    txt(ctx, 'Você fala direto com quem', W / 2, 1310, { size: 48, weight: 500, font: 'Inter' });
    txt(ctx, 'conserta o seu aparelho.', W / 2, 1374, { size: 48, weight: 500, font: 'Inter' });
  });
}

function drop(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y - s * 1.8);
  ctx.bezierCurveTo(x + s * 0.2, y - s, x + s, y - s * 0.2, x + s, y + s * 0.3);
  ctx.arc(x, y + s * 0.3, s, 0, Math.PI);
  ctx.bezierCurveTo(x - s, y - s * 0.2, x - s * 0.2, y - s, x, y - s * 1.8);
  ctx.fill();
}

function power(ctx, x, y, r, p1, p2) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineCap = 'round';
  ctx.strokeStyle = C.branco;
  ctx.lineWidth = 16;
  const a0 = -Math.PI / 2 + 0.65;
  const a1 = -Math.PI / 2 - 0.65 + Math.PI * 2;
  if (p1 > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, r, a0, a0 + (a1 - a0) * p1);
    ctx.stroke();
    strokePartial(ctx, [[0, -r * 1.15], [0, -r * 0.2]], clamp(p1 * 1.5));
  }
  if (p2 > 0) {
    const line = [[-r * 1.3, -r * 1.3], [r * 1.3, r * 1.3]];
    ctx.strokeStyle = C.noite;
    ctx.lineWidth = 34;
    strokePartial(ctx, line, p2);
    ctx.strokeStyle = C.angel;
    ctx.lineWidth = 18;
    strokePartial(ctx, line, p2);
  }
  ctx.restore();
}

function sceneMolhou(ctx, t) {
  const [a, b] = SCENES.molhou;
  const lt = t - a;
  const da = prog(t, a, a + 0.4) * (1 - prog(t, b - 0.3, b));
  ctx.save();
  for (const d of DROPS) {
    const y = ((lt * d.sp + d.off) % (H + 300)) - 150;
    ctx.fillStyle = angelA(d.a * da);
    drop(ctx, d.x, y, d.s);
  }
  ctx.restore();

  anim(ctx, t, 13.9, { y: 470, dy: 0, scale: 1.7, dur: 0.32, curve: ease.back }, () =>
    txt(ctx, 'MOLHOU?', W / 2, 470, { size: 170 }));
  anim(ctx, t, 14.5, { y: 700 }, () =>
    rich(ctx, [['NÃO', C.angel], [' LIGA', C.branco]], W / 2, 700, { size: 108 }));
  anim(ctx, t, 14.65, { y: 815 }, () => txt(ctx, 'O APARELHO.', W / 2, 815, { size: 108 }));

  power(ctx, W / 2, 1040, 92, ease.inOut(prog(t, 14.9, 15.3)), ease.out(prog(t, 15.3, 15.5)));

  anim(ctx, t, 15.7, { y: 1275 }, () => {
    txt(ctx, 'Traz agora que a chance', W / 2, 1275, { size: 48, weight: 500, font: 'Inter' });
    txt(ctx, 'de salvar é maior.', W / 2, 1339, { size: 48, weight: 500, font: 'Inter' });
  });

  anim(ctx, t, 16.1, { y: 1440, scale: 0.7, curve: ease.back }, () => {
    ctx.save();
    setFont(ctx, 38, 700, 'Montserrat', 4);
    const pw = ctx.measureText('BANHO QUÍMICO').width + 80;
    ctx.strokeStyle = C.angel;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(W / 2 - pw / 2, 1440 - 40, pw, 80, 40);
    ctx.stroke();
    ctx.restore();
    txt(ctx, 'BANHO QUÍMICO', W / 2, 1442, { size: 38, weight: 700, spacing: 4, base: 'middle' });
  });
}

function sceneServicos(ctx, t) {
  anim(ctx, t, 17.5, { y: 410 }, () => txt(ctx, 'TAMBÉM FAZEMOS', W / 2, 410, { size: 100 }));
  const x0 = 110;
  const rw = W - 2 * x0;
  const rh = 100;
  SERVICOS.forEach((s, i) => {
    const t0 = SERVICOS_T0 + i * SERVICOS_STEP;
    const yc = 560 + i * 122;
    anim(ctx, t, t0, { y: yc, dy: 0, dx: 140, dur: 0.4 }, () => {
      ctx.save();
      ctx.fillStyle = angelA(0.07);
      ctx.strokeStyle = angelA(0.45);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x0, yc - rh / 2, rw, rh, 26);
      ctx.fill();
      ctx.stroke();
      const cx = x0 + 60;
      ctx.strokeStyle = C.angel;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, yc, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = C.branco;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      strokePartial(ctx, [[cx - 11, yc + 1], [cx - 3, yc + 10], [cx + 12, yc - 9]], ease.out(prog(t, t0 + 0.15, t0 + 0.35)));
      ctx.restore();
      txt(ctx, s, x0 + 112, yc + 2, { size: 42, weight: 700, align: 'left', base: 'middle', maxW: rw - 140 });
    });
  });
}

function bubble(ctx, x, y, w, h, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = C.angel;
  ctx.lineWidth = 10;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 40);
  ctx.stroke();
  ctx.fillStyle = C.noite;
  ctx.beginPath();
  ctx.moveTo(-w * 0.26, h / 2 - 6);
  ctx.lineTo(-w * 0.3, h / 2 + 44);
  ctx.lineTo(-w * 0.04, h / 2 - 6);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-w * 0.26, h / 2);
  ctx.lineTo(-w * 0.3, h / 2 + 44);
  ctx.lineTo(-w * 0.04, h / 2);
  ctx.stroke();
  ctx.fillStyle = C.branco;
  for (let i = 0; i < 3; i++) {
    const dy = -Math.max(0, Math.sin(t * 6 - i * 0.9)) * 14;
    ctx.beginPath();
    ctx.arc(-50 + i * 50, dy, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function typed(str, t, t0) {
  return str.slice(0, Math.max(0, Math.floor((t - t0) * TYPE_CPS)));
}

function sceneOrcamento(ctx, t) {
  anim(ctx, t, 21.7, { y: 520, scale: 0.6, curve: ease.back }, () => bubble(ctx, W / 2, 520, 230, 150, t));
  anim(ctx, t, 21.85, { y: 790 }, () => txt(ctx, 'ORÇAMENTO', W / 2, 790, { size: 132 }));
  anim(ctx, t, 22.0, { y: 900 }, () => txt(ctx, 'SEM COMPROMISSO.', W / 2, 900, { size: 86, color: C.angel }));

  if (t >= TYPE_T0) {
    const t2 = TYPE_T0 + TYPE_L1.length / TYPE_CPS;
    const l1 = typed(TYPE_L1, t, TYPE_T0);
    const l2 = typed(TYPE_L2, t, t2);
    const o = { size: 54, weight: 500, font: 'Inter', align: 'left', maxW: 1000 };
    ctx.save();
    setFont(ctx, 54, 500, 'Inter', 0);
    const w1 = ctx.measureText(TYPE_L1).width;
    const w2 = ctx.measureText(TYPE_L2).width;
    const cur1 = ctx.measureText(l1).width;
    const cur2 = ctx.measureText(l2).width;
    ctx.restore();
    txt(ctx, l1, W / 2 - w1 / 2, 1090, o);
    txt(ctx, l2, W / 2 - w2 / 2, 1165, o);
    const blink = Math.floor(t * 2.5) % 2 === 0;
    if (blink) {
      const onL2 = t >= t2;
      const cx = onL2 ? W / 2 - w2 / 2 + cur2 + 6 : W / 2 - w1 / 2 + cur1 + 6;
      ctx.fillStyle = C.angel;
      ctx.fillRect(cx, (onL2 ? 1165 : 1090) - 46, 5, 58);
    }
  }
}

function pin(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, -s * 0.35, s * 0.45, Math.PI * 0.85, Math.PI * 2.15);
  ctx.lineTo(0, s * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.noite;
  ctx.beginPath();
  ctx.arc(0, -s * 0.35, s * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function sceneFinal(ctx, t, A) {
  // Logo vertical oficial, proporção travada, sem sombra e sem giro.
  const lp = prog(t, 24.5, 25.15);
  if (lp > 0) {
    const lw = 600;
    const lh = (lw * A.logo.height) / A.logo.width;
    const s = lerp(0.86, 1, ease.out(lp));
    ctx.save();
    ctx.globalAlpha *= clamp(lp * 1.6);
    ctx.translate(W / 2, 250 + lh / 2);
    ctx.scale(s, s);
    ctx.drawImage(A.logo, -lw / 2, -lh / 2, lw, lh);
    ctx.restore();
  }

  anim(ctx, t, 25.0, { y: 905 }, () => {
    const label = 'Ipiranga · São José · SC';
    ctx.save();
    setFont(ctx, 46, 500, 'Inter', 0);
    const tw = ctx.measureText(label).width;
    ctx.restore();
    const total = 36 + 18 + tw;
    const sx = W / 2 - total / 2;
    pin(ctx, sx + 18, 890, 40, C.angel);
    txt(ctx, label, sx + 54, 905, { size: 46, weight: 500, font: 'Inter', align: 'left', alpha: 0.9 });
  });

  anim(ctx, t, 25.3, { y: 1080, dy: 0, scale: 0.6, dur: 0.4, curve: ease.back }, () => {
    const bw = 820;
    const bh = 144;
    const pulse = t > 25.8 ? 1 + 0.03 * Math.sin((t - 25.8) * Math.PI * 2 * 0.9) : 1;
    ctx.save();
    ctx.translate(W / 2, 1080);
    ctx.scale(pulse, pulse);
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    ctx.fillStyle = C.ambar;
    ctx.fill();
    ctx.clip();
    if (t > 25.8) {
      const ph = ((t - 25.8) % 1.8) / 1.8;
      const sx = lerp(-bw / 2 - 260, bw / 2 + 260, ease.inOut(ph));
      const g = ctx.createLinearGradient(sx - 120, 0, sx + 120, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.45)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    }
    txt(ctx, 'CHAMA NO WHATSAPP', 0, 4, { size: 52, color: C.noite, base: 'middle', maxW: bw - 100 });
    ctx.restore();
  });

  anim(ctx, t, 25.6, { y: 1275 }, () => txt(ctx, '(48) 98865-0449', W / 2, 1275, { size: 88 }));
  anim(ctx, t, 25.9, { y: 1355 }, () =>
    txt(ctx, 'Garantia de 90 dias por escrito.', W / 2, 1355, { size: 42, weight: 400, font: 'Inter', alpha: 0.8 }));
}

function drawSweeps(ctx, t) {
  const bounds = Object.values(SCENES).slice(1).map(([s]) => s);
  for (const b of bounds) {
    const p = prog(t, b - 0.2, b + 0.25);
    if (p <= 0 || p >= 1) continue;
    const x = lerp(-700, W + 700, ease.inOut(p));
    const lines = [[0, 16, 0.8], [80, 7, 0.5], [140, 3, 0.35]];
    ctx.save();
    ctx.lineCap = 'round';
    for (const [o, lw, a] of lines) {
      ctx.strokeStyle = angelA(a);
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(x + o + 260, -60);
      ctx.lineTo(x + o - 260, H + 60);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// Cena com saída automática: sobe e some nos últimos `exit` segundos.
function layer(ctx, t, [a, b], draw, exit = 0.28) {
  if (t < a || t >= b) return;
  const pe = exit > 0 ? ease.in(prog(t, b - exit, b)) : 0;
  ctx.save();
  ctx.globalAlpha = 1 - pe;
  ctx.translate(0, -70 * pe);
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
  for (const [t0, amp, d] of SHAKES) {
    if (t < t0 || t > t0 + d) continue;
    const k = amp * (1 - (t - t0) / d);
    sx += Math.sin(t * 93) * k;
    sy += Math.cos(t * 71) * k;
  }
  ctx.translate(sx, sy);

  drawWatermark(ctx, t, A);
  drawPhone(ctx, t, A);
  layer(ctx, t, SCENES.gancho, () => sceneGancho(ctx, t));
  layer(ctx, t, SCENES.tempo, () => sceneTempo(ctx, t));
  layer(ctx, t, SCENES.preco, () => scenePreco(ctx, t));
  layer(ctx, t, SCENES.garantia, () => sceneGarantia(ctx, t));
  layer(ctx, t, SCENES.molhou, () => sceneMolhou(ctx, t));
  layer(ctx, t, SCENES.servicos, () => sceneServicos(ctx, t));
  layer(ctx, t, SCENES.orcamento, () => sceneOrcamento(ctx, t));
  layer(ctx, t, SCENES.final, () => sceneFinal(ctx, t, A), 0);
  drawSweeps(ctx, t);

  const fl = prog(t, 0.55, 0.8);
  if (fl > 0 && fl < 1) {
    ctx.fillStyle = `rgba(255,255,255,${0.4 * (1 - fl)})`;
    ctx.fillRect(-40, -40, W + 80, H + 80);
  }
  ctx.restore();
}
