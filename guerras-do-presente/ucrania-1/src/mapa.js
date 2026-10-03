// Mapa em projeção de Mercator com câmera animável { lon, lat, s }.
// s = pixels por radiano de longitude (s = 1900 enquadra a Ucrânia na coluna 9:16).
import { W, H, C, clamp, lerp, easeInOut, hash } from './desenho.js';

const R = Math.PI / 180;
const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * R) / 2));

export const ESTILOS = {
  moderno: { agua: '#0A1424', terra: '#18263D', borda: 'rgba(130,160,200,0.30)' },
  noite: { agua: '#060B15', terra: '#111B2C', borda: 'rgba(130,160,200,0.18)' },
  pergaminho: { agua: '#2A2015', terra: '#4B3C27', borda: 'rgba(225,195,135,0.22)' },
  sovietico: { agua: '#100909', terra: '#2B1719', borda: 'rgba(210,90,90,0.25)' },
};

// Grupos usados nas cenas.
export const URSS = ['Russia', 'Ukraine', 'Belarus', 'Moldova', 'Estonia', 'Latvia', 'Lithuania', 'Georgia', 'Armenia',
  'Azerbaijan', 'Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan', 'Tajikistan'];
export const OTAN_ANTES = ['United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Portugal', 'Netherlands', 'Belgium',
  'Luxembourg', 'Denmark', 'Norway', 'Iceland', 'Greece', 'Turkey'];
export const OTAN_1999 = ['Poland', 'Czechia', 'Hungary'];
export const OTAN_2004 = ['Estonia', 'Latvia', 'Lithuania', 'Slovakia', 'Slovenia', 'Romania', 'Bulgaria'];
// Regiões ucranianas que estavam fora do Império Russo no século XIX (Áustria-Hungria).
export const FORA_DO_IMPERIO = ['lviv', 'ternopil', 'ivano-frankivsk', 'chernivtsi', 'zakarpattia'];

// Contorno aproximado da Rus de Kiev por volta do ano 1000 (lon, lat).
export const RUS_KIEV = [[23.9, 50.4], [23.6, 51.6], [24.1, 52.6], [23.5, 53.6], [24.6, 54.2], [25.8, 54.9],
  [26.6, 55.9], [27.9, 56.6], [27.6, 57.6], [28.2, 58.6], [29.3, 59.3], [28.6, 60.0], [30.0, 60.6], [31.2, 61.4],
  [32.9, 61.9], [34.6, 61.6], [36.4, 60.9], [37.7, 60.1], [38.9, 59.4], [40.3, 58.6], [41.6, 57.7], [42.4, 56.8],
  [41.3, 56.1], [40.4, 55.2], [39.2, 54.6], [38.4, 53.8], [37.6, 53.0], [36.9, 52.2], [36.2, 51.3], [35.4, 50.6],
  [34.9, 49.8], [34.0, 49.3], [33.1, 49.0], [32.2, 48.6], [31.0, 48.9], [29.8, 49.2], [28.6, 49.0], [27.4, 49.3],
  [26.1, 49.6], [24.9, 49.8]];

// Curso aproximado do rio Dniepre, da nascente à foz.
export const DNIEPRE = [[33.2, 55.9], [32.0, 54.8], [30.4, 54.5], [30.3, 53.9], [30.2, 53.0], [30.4, 52.3], [30.6, 51.4],
  [30.52, 50.45], [31.6, 49.8], [32.06, 49.44], [33.4, 49.07], [34.6, 48.7], [35.05, 48.46], [35.14, 47.84],
  [34.4, 47.57], [33.4, 47.0], [32.6, 46.64], [31.9, 46.5]];

export const CIDADES = {
  kiev: [30.52, 50.45], kharkiv: [36.23, 49.99], dnipro: [35.05, 48.46], odessa: [30.73, 46.48],
  moscou: [37.62, 55.75], minsk: [27.56, 53.9], simferopol: [34.1, 44.95], donetsk: [37.8, 48.0],
  luhansk: [39.3, 48.57], budapeste: [19.04, 47.5], varsovia: [21.0, 52.23], sebastopol: [33.52, 44.6],
};

export class Mapa {
  constructor(geo) {
    this.geo = geo;
    const box = (rings) => {
      let x0 = 180;
      let x1 = -180;
      let y0 = 90;
      let y1 = -90;
      for (const r of rings) for (let i = 0; i < r.length; i += 2) {
        x0 = Math.min(x0, r[i]);
        x1 = Math.max(x1, r[i]);
        y0 = Math.min(y0, r[i + 1]);
        y1 = Math.max(y1, r[i + 1]);
      }
      return [x0, x1, y0, y1];
    };
    this.formas = {};
    for (const [nome, rings] of Object.entries(geo.paises)) this.formas[nome] = { rings, box: box(rings) };
    this.formas.Crimeia = { rings: geo.crimeia, box: box(geo.crimeia) };
    this.formas['Ucrânia'] = { rings: [...geo.paises.Ukraine, ...geo.crimeia], box: box([...geo.paises.Ukraine, ...geo.crimeia]) };
    this.formas['Rússia'] = this.formas.Russia;
    for (const [id, rings] of Object.entries(geo.regioes)) this.formas[`r:${id}`] = { rings, box: box(rings) };
    this.formas['Rus de Kiev'] = { rings: [RUS_KIEV.flat()], box: box([RUS_KIEV.flat()]) };
    this.nomes = Object.keys(geo.paises);
  }

  proj(cam, lon, lat) {
    return [W / 2 + cam.s * (lon - cam.lon) * R, H / 2 - cam.s * (mercY(lat) - mercY(cam.lat))];
  }

  visivel(cam, box) {
    const [a, b] = [this.proj(cam, box[0], box[3]), this.proj(cam, box[1], box[2])];
    return !(b[0] < -50 || a[0] > W + 50 || b[1] < -50 || a[1] > H + 50);
  }

  // Adiciona os contornos da forma ao path atual (sem beginPath).
  tracar(ctx, cam, nome, desloc = null) {
    const f = this.formas[nome];
    if (!f || !this.visivel(cam, f.box)) return false;
    const dx = desloc ? desloc[0] : 0;
    const dy = desloc ? desloc[1] : 0;
    for (const r of f.rings) {
      for (let i = 0; i < r.length; i += 2) {
        const [x, y] = this.proj(cam, r[i], r[i + 1]);
        if (i === 0) ctx.moveTo(x + dx, y + dy);
        else ctx.lineTo(x + dx, y + dy);
      }
      ctx.closePath();
    }
    return true;
  }

  pintar(ctx, cam, nomes, o = {}) {
    const { fill = null, stroke = null, lw = 2, alpha = 1, desloc = null, brilho = 0 } = o;
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.beginPath();
    for (const n of [].concat(nomes)) this.tracar(ctx, cam, n, desloc);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill('evenodd');
    }
    if (stroke) {
      if (brilho) {
        ctx.shadowColor = stroke;
        ctx.shadowBlur = brilho;
      }
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    ctx.restore();
  }

  // Recorta (clip) o contexto à forma; chame ctx.restore() depois.
  recortar(ctx, cam, nomes) {
    ctx.save();
    ctx.beginPath();
    for (const n of [].concat(nomes)) this.tracar(ctx, cam, n);
    ctx.clip('evenodd');
  }

  centro(nome) {
    const r = this.formas[nome].rings.reduce((a, b) => (b.length > a.length ? b : a));
    let x = 0;
    let y = 0;
    for (let i = 0; i < r.length; i += 2) {
      x += r[i];
      y += r[i + 1];
    }
    return [x / (r.length / 2), y / (r.length / 2)];
  }

  // Fundo: água, todas as terras e fronteiras, no estilo pedido.
  fundo(ctx, cam, estilo = 'moderno', alpha = 1) {
    const e = ESTILOS[estilo];
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = e.agua;
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    for (const n of this.nomes) this.tracar(ctx, cam, n);
    this.tracar(ctx, cam, 'Crimeia');
    ctx.fillStyle = e.terra;
    ctx.fill();
    ctx.strokeStyle = e.borda;
    ctx.lineWidth = 1.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    if (estilo === 'pergaminho') {
      // textura de papel
      for (let i = 0; i < 90; i++) {
        ctx.fillStyle = `rgba(255,235,190,${0.008 + hash(i) * 0.014})`;
        ctx.beginPath();
        ctx.arc(hash(i + 7) * W, hash(i + 13) * H, 120 + hash(i + 3) * 260, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Linha (lista de [lon, lat]) desenhada até a fração p.
  linha(ctx, cam, pts, p, o = {}) {
    const { cor = '#5BA8F0', lw = 6, alpha = 1, tracejado = null } = o;
    if (p <= 0) return null;
    const tela = pts.map(([lo, la]) => this.proj(cam, lo, la));
    const seg = [];
    let total = 0;
    for (let i = 1; i < tela.length; i++) {
      const d = Math.hypot(tela[i][0] - tela[i - 1][0], tela[i][1] - tela[i - 1][1]);
      seg.push(d);
      total += d;
    }
    let resta = total * clamp(p);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.strokeStyle = cor;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (tracejado) ctx.setLineDash(tracejado);
    ctx.beginPath();
    ctx.moveTo(tela[0][0], tela[0][1]);
    let fim = tela[0];
    for (let i = 1; i < tela.length && resta > 0; i++) {
      const u = Math.min(1, resta / seg[i - 1]);
      fim = [lerp(tela[i - 1][0], tela[i][0], u), lerp(tela[i - 1][1], tela[i][1], u)];
      ctx.lineTo(fim[0], fim[1]);
      resta -= seg[i - 1];
    }
    ctx.stroke();
    ctx.restore();
    return fim;
  }
}

// Câmera por quadros-chave: [[t, lon, lat, s, dur?], ...]. Cada chave começa a
// mover a câmera no instante t e chega lá depois de dur segundos (padrão 1,6 s).
export function camera(t, chaves) {
  let cam = { lon: chaves[0][1], lat: chaves[0][2], s: chaves[0][3] };
  for (let i = 1; i < chaves.length; i++) {
    const [t0, lon, lat, s, dur = 1.6] = chaves[i];
    if (t <= t0) break;
    const p = easeInOut(clamp((t - t0) / dur));
    cam = {
      lon: lerp(cam.lon, lon, p),
      lat: lerp(cam.lat, lat, p),
      s: Math.exp(lerp(Math.log(cam.s), Math.log(s), p)),
    };
  }
  return cam;
}

// Hachura (área ocupada/anexada).
export function hachura(ctx, cor = C.vermelho, passo = 14) {
  const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(passo, passo) : document.createElement('canvas');
  c.width = passo;
  c.height = passo;
  const g = c.getContext('2d');
  g.strokeStyle = cor;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, passo);
  g.lineTo(passo, 0);
  g.moveTo(-passo / 2, passo / 2);
  g.lineTo(passo / 2, -passo / 2);
  g.moveTo(passo / 2, passo * 1.5);
  g.lineTo(passo * 1.5, passo / 2);
  g.stroke();
  return ctx.createPattern(c, 'repeat');
}
