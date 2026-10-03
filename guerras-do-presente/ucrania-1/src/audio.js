// Trilha e efeitos sonoros gerados por código (sem arquivos de terceiros, sem direitos autorais).
// Ré menor (Dm–Bb–Gm–A), clima tenso e discreto; a música abaixa sob a narração.
import fs from 'node:fs';

const TAU = Math.PI * 2;
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

function aleatorio(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Intensidade da música por cena (0 = só o grave, 1 = cheia).
const INTENSIDADE = {
  gancho: 0.9, abertura: 0.85, rus: 0.45, imperio: 0.6, urss: 0.55, independencia: 0.7, budapeste: 0.5,
  'dois-lados': 0.6, euromaidan: 0.75, crimeia: 0.85, minsk: 0.4, 'caminho-2022': 0.7, fechamento: 0.8,
};
const ACORDES = [
  [50, 57, 62, 65], // Dm
  [46, 53, 58, 62], // Bb
  [43, 50, 55, 58], // Gm
  [45, 52, 57, 61], // A
];

export function gerarTrilha(L, sr = 48000) {
  const N = Math.ceil(L.duracao * sr);
  const E = new Float32Array(N);
  const D = new Float32Array(N);
  const rnd = aleatorio(7);
  const ruido = () => rnd() * 2 - 1;
  const P = (n) => L.planos[n];
  const cena = (id) => L.cenas.find((c) => c.id === id);

  // ------------------------------------------------ envelopes de controle (a cada 10 ms)
  const passo = Math.round(sr / 100);
  const nC = Math.ceil(N / passo) + 1;
  const intens = new Float32Array(nC);
  const duck = new Float32Array(nC);
  for (let k = 0; k < nC; k++) {
    const t = (k * passo) / sr;
    // intensidade com transição suave entre cenas
    let v = 0;
    let peso = 0;
    for (const c of L.cenas) {
      const w = clamp(Math.min((t - c.inicio + 1) / 2, (c.fim + 1 - t) / 2));
      v += w * INTENSIDADE[c.id];
      peso += w;
    }
    let x = peso ? v / peso : 0.5;
    // Holodomor: a trilha some e fica só o grave
    if (t > P(18) && t < P(19) + 3.5) x *= 1 - clamp((t - P(18)) / 1.2) * clamp((P(19) + 3.5 - t) / 1.5) * 0.92;
    // respiro antes do retrocesso (plano 4)
    if (t > P(4) - 0.5 && t < P(4) + 0.4) x *= 0.15;
    // a música cresce até a invasão no fim da cena 12
    const c12 = cena('caminho-2022');
    if (t > P(43) && t < c12.fim) x = Math.max(x, 0.7 + 0.3 * clamp((t - P(43)) / 6));
    intens[k] = x;
    // ducking sob a voz
    let fala = 0;
    for (const f of L.frases) {
      if (t > f.inicio - 0.15 && t < f.fim + 0.35) {
        fala = 1;
        break;
      }
    }
    duck[k] = fala;
  }
  // suaviza o ducking (ataque 120 ms, soltura 450 ms)
  let d = 0;
  for (let k = 0; k < nC; k++) {
    const alvo = duck[k] ? 0.32 : 1;
    d += (alvo - d) * (alvo < d ? 0.08 : 0.022);
    duck[k] = d;
  }
  const ctl = (arr, j) => {
    const k = j / passo;
    const k0 = Math.floor(k);
    const u = k - k0;
    return arr[k0] * (1 - u) + (arr[Math.min(k0 + 1, nC - 1)] ?? 0) * u;
  };

  // ------------------------------------------------ pad (tabela de onda de dente-de-serra suave)
  const TAB = 4096;
  const tabela = new Float32Array(TAB);
  for (let i = 0; i < TAB; i++) {
    let v = 0;
    for (let h = 1; h <= 7; h++) v += Math.sin((TAU * h * i) / TAB) / (h * h * 0.6 + h * 0.4);
    tabela[i] = v * 0.55;
  }
  const DUR_ACORDE = 6;
  const fases = new Float64Array(64);
  let lpE = 0;
  let lpD = 0;
  for (let j = 0; j < N; j++) {
    const t = j / sr;
    const k = Math.floor(t / DUR_ACORDE);
    const it = ctl(intens, j);
    let sE = 0;
    let sD = 0;
    for (let q = 0; q < 2; q++) {
      const kk = k - q;
      if (kk < 0) continue;
      const tl = t - kk * DUR_ACORDE;
      const env = clamp(tl / 1.4) * clamp((DUR_ACORDE + 1.6 - tl) / 1.6);
      if (env <= 0) continue;
      const notas = ACORDES[kk % 4];
      for (let n = 0; n < 4; n++) {
        const f = midi(notas[n] - 12);
        for (let dv = 0; dv < 2; dv++) {
          const idx = (kk % 2) * 32 + n * 2 + dv;
          fases[idx] += (f * (dv ? 1.0035 : 0.9965)) / sr;
          const v = tabela[Math.floor((fases[idx] % 1) * TAB)] * env;
          if (dv) sD += v;
          else sE += v;
        }
      }
    }
    // filtro passa-baixa que abre com a intensidade
    const a = 0.02 + it * 0.07;
    lpE += a * (sE - lpE);
    lpD += a * (sD - lpD);
    const sub = Math.sin(TAU * midi(26) * t) * 0.35 + Math.sin(TAU * midi(38) * t) * 0.12;
    const g = (0.07 + it * 0.11) * ctl(duck, j);
    E[j] += (lpE * 0.5 + sub * (0.4 + it * 0.4)) * g;
    D[j] += (lpD * 0.5 + sub * (0.4 + it * 0.4)) * g;
  }

  // ------------------------------------------------ efeitos
  function soma(t0, len, fn, ganho = 1, pan = 0) {
    const s0 = Math.floor(t0 * sr);
    const n = Math.floor(len * sr);
    const gl = ganho * Math.min(1, 1 - pan);
    const gr = ganho * Math.min(1, 1 + pan);
    for (let i = 0; i < n; i++) {
      const j = s0 + i;
      if (j < 0 || j >= N) continue;
      const v = fn(i / sr, i);
      E[j] += v * gl;
      D[j] += v * gr;
    }
  }
  const impacto = (t0, g = 0.5) => {
    let lp = 0;
    soma(t0, 2.2, (t) => {
      lp += 0.04 * (ruido() - lp);
      const ph = TAU * (34 * t + (60 / 9) * (1 - Math.exp(-9 * t)));
      return Math.sin(ph) * Math.exp(-t * 2.4) + lp * 2.2 * Math.exp(-t * 3);
    }, g);
  };
  const estrondo = (t0, g = 0.25, pan = 0) => {
    let lp = 0;
    soma(t0, 1.6, (t) => {
      lp += 0.025 * (ruido() - lp);
      return lp * 4 * Math.exp(-t * 2.6) * Math.min(1, t * 60);
    }, g, pan);
  };
  const sirene = (t0, len = 3.2, g = 0.05) => {
    let ph = 0;
    soma(t0, len, (t) => {
      const f = 640 + 260 * (0.5 - 0.5 * Math.cos(TAU * 0.45 * t));
      ph += f / sr;
      const env = clamp(t / 0.6) * clamp((len - t) / 0.8);
      return (Math.sin(TAU * ph) + 0.3 * Math.sin(TAU * 2 * ph)) * env;
    }, g, 0.3);
  };
  const sopro = (t0, len = 1.1, g = 0.18, sobe = true) => {
    let bp = 0;
    let lp = 0;
    soma(t0, len, (t) => {
      const u = t / len;
      const a = 0.02 + 0.25 * (sobe ? u : 1 - u);
      lp += a * (ruido() - lp);
      bp += 0.5 * (lp - bp);
      return (lp - bp * 0.6) * Math.sin(Math.PI * u) ** 2;
    }, g);
  };
  const paginas = (t0, len = 2.4, g = 0.12) => {
    soma(t0, len, (t) => {
      const ciclo = (t * 14) % 1;
      return ruido() * Math.exp(-ciclo * 18) * clamp(t / 0.2) * clamp((len - t) / 0.3);
    }, g, -0.1);
  };
  const carimbo = (t0, g = 0.4) => {
    soma(t0, 0.5, (t) => Math.sin(TAU * 90 * t) * Math.exp(-t * 22) + ruido() * Math.exp(-t * 80) * 0.6, g);
  };
  const clique = (t0, g = 0.14, pan = 0) => {
    soma(t0, 0.25, (t) => (Math.sin(TAU * 2400 * t) * 0.6 + Math.sin(TAU * 3700 * t) * 0.3 + ruido() * 0.4) * Math.exp(-t * 40), g, pan);
  };
  const sino = (t0, g = 0.16, distorcido = false) => {
    const parc = [[1, 1], [2.76, 0.5], [5.4, 0.25], [8.93, 0.12]];
    soma(t0, 2.6, (t) => {
      let v = 0;
      const f0 = distorcido ? 880 * (1 - 0.06 * t) : 880;
      for (const [r, a] of parc) v += Math.sin(TAU * f0 * r * t) * a * Math.exp(-t * (1.6 + r * 0.6));
      return distorcido ? Math.tanh(v * 3) * 0.6 : v;
    }, g);
  };
  const racha = (t0, g = 0.3) => {
    soma(t0, 0.9, (t) => {
      const estalo = rnd() < 0.012 * Math.exp(-t * 4) ? ruido() * 4 : 0;
      return (ruido() * Math.exp(-t * 12) * 0.8 + estalo) * Math.exp(-t * 3);
    }, g);
  };
  const coro = (t0, len = 2.6, g = 0.1) => {
    const notas = [50, 57, 62, 65];
    soma(t0, len, (t) => {
      let v = 0;
      for (const n of notas) {
        const f = midi(n);
        for (let h = 1; h <= 8; h++) {
          const fh = f * h;
          const form = Math.exp(-(((fh - 700) / 300) ** 2)) + 0.6 * Math.exp(-(((fh - 1150) / 260) ** 2)) + 0.3;
          v += Math.sin(TAU * fh * t * (1 + 0.003 * Math.sin(TAU * 5 * t))) * form / h;
        }
      }
      return v * 0.12 * clamp(t / 0.5) * clamp((len - t) / 0.9);
    }, g);
  };
  const tambor = (t0, g = 0.3, pan = 0) => {
    soma(t0, 0.7, (t) => {
      const ph = TAU * (70 * t + (50 / 14) * (1 - Math.exp(-14 * t)));
      return Math.sin(ph) * Math.exp(-t * 6) + ruido() * Math.exp(-t * 60) * 0.25;
    }, g, pan);
  };
  const multidao = (t0, len, g = 0.06) => {
    let lp = 0;
    soma(t0, len, (t) => {
      lp += 0.18 * (ruido() - lp);
      const mod = 0.6 + 0.4 * Math.sin(TAU * 0.7 * t) * Math.sin(TAU * 1.9 * t);
      return lp * mod * clamp(t / 0.8) * clamp((len - t) / 1);
    }, g);
  };
  const motor = (t0, len = 2.6, g = 0.08) => {
    let ph = 0;
    soma(t0, len, (t) => {
      ph += (48 + 30 * clamp(t / 1)) / sr;
      return ((ph % 1) * 2 - 1) * 0.7 * clamp(t / 0.3) * clamp((len - t) / 0.6) + ruido() * 0.1;
    }, g, 0.2);
  };
  const tique = (t0, len, g = 0.06) => {
    for (let k = 0; k * 0.5 < len; k++) clique(t0 + k * 0.5, g * (k % 2 ? 0.7 : 1), k % 2 ? 0.3 : -0.3);
  };
  const rasgo = (t0, g = 0.2) => {
    let hp = 0;
    soma(t0, 0.8, (t) => {
      const n = ruido();
      const v = n - hp;
      hp = n;
      return v * (0.5 + 0.5 * Math.sin(TAU * 40 * t)) * Math.exp(-t * 3.5);
    }, g);
  };
  const assinatura = (t0, g = 0.35) => {
    // vinheta: acorde forte + sopro reverso
    sopro(t0 - 0.9, 0.9, 0.22, true);
    const notas = [38, 50, 57, 62, 65, 69];
    soma(t0, 3.2, (t) => {
      let v = 0;
      for (const n of notas) v += Math.sin(TAU * midi(n) * t) * 0.3 + Math.sin(TAU * midi(n) * 2 * t) * 0.08;
      return v * Math.exp(-t * 1.2) * clamp(t / 0.01);
    }, g * 0.4);
    impacto(t0, g);
  };

  // ------------------------------------------------ cues sincronizados com os planos
  sirene(P(2) - 0.2);
  impacto(P(2), 0.55);
  [0, 0.28, 0.56, 0.84].forEach((d, i) => estrondo(P(2) + d, 0.22, (i - 1.5) * 0.3));
  paginas(P(4) + 0.2, 2.4);
  sopro(P(4) + 0.1, 1.6, 0.12, false);
  assinatura(P(5) + 0.15);
  sopro(P(7), 1.4, 0.12);
  racha(P(7) + 2.4, 0.28);
  coro(P(9) + 0.3, 2.8, 0.12);
  coro(P(11), 2.2, 0.06);
  [0, 0.45, 0.9, 1.2, 1.5, 1.95, 2.4].forEach((d, i) => tambor(P(12) + 0.2 + d, 0.22, i % 2 ? 0.25 : -0.25));
  carimbo(P(14) + 0.6, 0.3);
  carimbo(P(15) + 1.3, 0.42);
  racha(P(20) + 0.4, 0.3);
  coro(P(21) + 0.2, 2.6, 0.08);
  for (let i = 0; i < 9; i++) clique(P(23) + 0.2 + i * 0.12, 0.1, (i - 4) * 0.08);
  for (let i = 0; i < 9; i++) clique(P(24) + i * 0.16 + 1.1, 0.07, 0.4);
  sino(P(26), 0.14);
  multidao(P(28) + 0.4, Math.max(1, P(29) - P(28) - 0.4), 0.07);
  carimbo(P(28) + 2.2, 0.32);
  const em = cena('euromaidan').frases[0];
  rasgo(em.inicio + (em.fim - em.inicio) * 0.72, 0.25);
  for (let k = 0; k * 0.75 < P(33) - P(32) - 0.5; k++) tambor(P(32) + 0.3 + k * 0.75, 0.12, k % 2 ? 0.3 : -0.3);
  multidao(P(32), Math.max(1, P(33) - P(32)), 0.05);
  motor(P(33) + 0.5);
  sopro(P(34) - 0.3, 1.2, 0.1);
  carimbo(P(35) + 0.5, 0.35);
  for (let k = 0; k < 6; k++) estrondo(P(36) + 1 + k * 0.7, 0.12, (k % 3 - 1) * 0.4);
  sino(P(37) + 0.2, 0.12, true);
  racha(P(37) + 0.9, 0.3);
  carimbo(P(39), 0.38);
  const mk = cena('minsk');
  tique(mk.frases[1].inicio + 0.2, mk.frases[1].fim - mk.frases[1].inicio, 0.05);
  const c12 = cena('caminho-2022');
  for (let k = 0; k < 10; k++) tambor(P(41) + 0.3 + k * 0.3, 0.08, (k % 2) * 0.4 - 0.2);
  carimbo(c12.frases[3].inicio, 0.42);
  sopro(c12.frases[5].inicio - 0.2, 0.7, 0.12);
  impacto(c12.frases[5].inicio + 0.9, 0.5);
  [0, 0.28, 0.56, 0.84].forEach((d, i) => estrondo(c12.frases[5].inicio + 0.9 + d, 0.18, (i - 1.5) * 0.3));
  assinatura(P(46) + 0.4, 0.25);

  return [E, D];
}

// ------------------------------------------------ WAV
export function lerWav(arq) {
  const b = fs.readFileSync(arq);
  let p = 12;
  let sr = 0;
  let canais = 1;
  let bits = 16;
  let dados = null;
  while (p < b.length) {
    const id = b.toString('ascii', p, p + 4);
    const tam = b.readUInt32LE(p + 4);
    if (id === 'fmt ') {
      canais = b.readUInt16LE(p + 10);
      sr = b.readUInt32LE(p + 12);
      bits = b.readUInt16LE(p + 22);
    } else if (id === 'data') {
      if (bits !== 16) throw new Error(`${arq}: use WAV de 16 bits`);
      const n = Math.floor(tam / 2 / canais);
      dados = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        let v = 0;
        for (let c = 0; c < canais; c++) v += b.readInt16LE(p + 8 + (i * canais + c) * 2);
        dados[i] = v / canais / 32768;
      }
    }
    p += 8 + tam + (tam % 2);
  }
  return { sr, dados };
}

export function gravarWav(arq, canais, sr) {
  const n = canais[0].length;
  const k = canais.length;
  const b = Buffer.alloc(44 + n * k * 2);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + n * k * 2, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(k, 22);
  b.writeUInt32LE(sr, 24);
  b.writeUInt32LE(sr * k * 2, 28);
  b.writeUInt16LE(k * 2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(n * k * 2, 40);
  for (let i = 0; i < n; i++) for (let c = 0; c < k; c++) {
    b.writeInt16LE(Math.round(clamp(canais[c][i], -1, 1) * 32767), 44 + (i * k + c) * 2);
  }
  fs.writeFileSync(arq, b);
}
