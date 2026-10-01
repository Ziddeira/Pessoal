// Trilha sonora gerada por código (sem arquivos de áudio externos, sem direitos autorais).
// Funciona igual no navegador (Web Audio) e no Node (WAV para o MP4).
// Batida a 120 BPM em Lá menor (Am–F–C–G) + efeitos sincronizados com as cenas.

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// Am, F, C, G — baixo e acordes
const PROG = [
  { bass: midi(33), chord: [57, 60, 64] },
  { bass: midi(29), chord: [53, 57, 60] },
  { bass: midi(36), chord: [55, 60, 64] },
  { bass: midi(31), chord: [55, 59, 62] },
];

export function generateSoundtrack({ sampleRate = 44100, duration, cues = [], music = {}, bpm = 120 }) {
  const N = Math.ceil(duration * sampleRate);
  const L = new Float32Array(N);
  const R = new Float32Array(N);
  const rand = mulberry32(42);
  const noise = () => rand() * 2 - 1;

  // Soma fn(tempoLocal) no buffer a partir de t0, com ganho e pan (-1..1).
  function add(t0, len, fn, gain = 1, pan = 0) {
    const s0 = Math.floor(t0 * sampleRate);
    const n = Math.floor(len * sampleRate);
    const gl = gain * Math.min(1, 1 - pan);
    const gr = gain * Math.min(1, 1 + pan);
    for (let i = 0; i < n; i++) {
      const j = s0 + i;
      if (j < 0 || j >= N) continue;
      const v = fn(i / sampleRate);
      L[j] += v * gl;
      R[j] += v * gr;
    }
  }

  // ------------------------------------------------------------ instrumentos
  const kick = (t0, g = 0.9) =>
    add(t0, 0.45, (t) => {
      const ph = TAU * (45 * t + (90 / 30) * (1 - Math.exp(-30 * t)));
      return Math.sin(ph) * Math.exp(-t * 7) + noise() * Math.exp(-t * 300) * 0.2;
    }, g);

  const hat = (t0, g = 0.1, pan = 0.25) => {
    let prev = 0;
    add(t0, 0.08, (t) => {
      const n = noise();
      const v = n - prev;
      prev = n;
      return v * Math.exp(-t * 60);
    }, g, pan);
  };

  const clap = (t0, g = 0.22) => {
    let lp = 0;
    add(t0, 0.3, (t) => {
      lp += 0.35 * (noise() - lp);
      const env = Math.exp(-t * 22) + 0.7 * (t > 0.012 ? Math.exp(-(t - 0.012) * 22) : 0);
      return (noise() - lp) * env;
    }, g, -0.15);
  };

  const bass = (t0, f, len, g = 0.2) => {
    let lp = 0;
    add(t0, len, (t) => {
      let v = 0;
      for (let h = 1; h <= 6; h++) v += Math.sin(TAU * f * h * t) / h;
      lp += 0.09 * (v - lp);
      const env = Math.min(1, t / 0.005) * (0.6 + 0.4 * Math.exp(-t * 8)) * Math.min(1, (len - t) / 0.03);
      return lp * env;
    }, g);
  };

  const pad = (t0, notes, len, g = 0.035) => {
    notes.forEach((n, k) => {
      const f = midi(n);
      const pan = (k - 1) * 0.5;
      add(t0, len, (t) => {
        const env = Math.min(1, t / 0.35) * Math.min(1, (len - t) / 0.5);
        return (Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * f * 1.003 * t)) * env;
      }, g, pan);
    });
  };

  const pluck = (t0, n, g = 0.05, pan = 0) => {
    const f = midi(n);
    add(t0, 0.4, (t) => (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * 2 * f * t)) * Math.exp(-t * 9), g, pan);
  };

  // ------------------------------------------------------------ efeitos
  const sfx = {
    riser: (t0) => {
      const len = 0.55;
      let prev = 0;
      add(t0, len, (t) => {
        const n = noise();
        const v = n - prev * 0.6;
        prev = n;
        return v * Math.pow(t / len, 2);
      }, 0.22);
    },
    impact: (t0) => {
      add(t0, 1.2, (t) => Math.sin(TAU * (38 * t + (80 / 12) * (1 - Math.exp(-12 * t)))) * Math.exp(-t * 3.2), 0.9);
      let lp = 0;
      add(t0, 0.5, (t) => {
        lp += 0.2 * (noise() - lp);
        return lp * Math.exp(-t * 9);
      }, 0.9);
    },
    whoosh: (t0) => {
      const len = 0.42;
      let lp = 0;
      add(t0, len, (t) => {
        const k = t / len;
        lp += (0.02 + 0.25 * Math.sin(Math.PI * k)) * (noise() - lp);
        return lp * Math.sin(Math.PI * k);
      }, 0.55, 0);
    },
    tick: (t0) => add(t0, 0.03, (t) => Math.sin(TAU * 3200 * t) * Math.exp(-t * 220), 0.12, 0.2),
    pop: (t0) => add(t0, 0.12, (t) => Math.sin(TAU * (600 * t + 3000 * t * t)) * Math.exp(-t * 35), 0.28),
    ding: (t0) => {
      add(t0, 1.6, (t) => (Math.sin(TAU * 1318.5 * t) + 0.6 * Math.sin(TAU * 1975.5 * t) + 0.25 * Math.sin(TAU * 2637 * t)) * Math.exp(-t * 3.5), 0.16);
    },
    stamp: (t0) => {
      add(t0, 0.35, (t) => Math.sin(TAU * 70 * t) * Math.exp(-t * 12), 0.7);
      add(t0, 0.1, (t) => noise() * Math.exp(-t * 60), 0.35);
    },
    drop: (t0) => add(t0, 0.15, (t) => Math.sin(TAU * (1400 * t - 3500 * t * t)) * Math.exp(-t * 25), 0.22, (rand() - 0.5) * 0.8),
    type: (t0) => {
      let prev = 0;
      add(t0, 0.025, (t) => {
        const n = noise();
        const v = n - prev;
        prev = n;
        return v * Math.exp(-t * 300);
      }, 0.08, 0.1);
    },
    chime: (t0) => {
      [69, 72, 76, 81].forEach((n, i) => {
        const f = midi(n + 12);
        add(t0 + i * 0.08, 2.2, (t) => (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * 2 * f * t)) * Math.exp(-t * 2.2), 0.09, (i - 1.5) * 0.3);
      });
    },
  };

  // ------------------------------------------------------------ arranjo
  const beat = 60 / bpm;
  const start = music.start ?? 0;
  const breaks = music.breaks ?? [];
  const inBreak = (t) => breaks.some(([a, b]) => t >= a && t < b - 0.05);
  const end = duration - 0.4;

  for (let i = 0; start + i * beat < end; i++) {
    const t = start + i * beat;
    const bar = Math.floor(i / 4);
    const pos = i % 4;
    const ch = PROG[bar % PROG.length];
    const brk = inBreak(t);

    if (pos === 0) pad(t, ch.chord, beat * 4 + 0.3, brk ? 0.08 : 0.035);
    if (!brk) {
      kick(t);
      if (pos === 1 || pos === 3) clap(t);
      bass(t, ch.bass, beat * 0.45);
      bass(t + beat / 2, ch.bass * (pos === 3 ? 1.5 : 1), beat * 0.45);
    }
    hat(t + beat / 2);
    if (bar >= 2 && !brk) {
      hat(t + beat / 4, 0.05, -0.3);
      hat(t + (3 * beat) / 4, 0.05, -0.3);
    }
    // Arpejo leve em semicolcheias depois do segundo compasso
    if (bar >= 1) {
      const notes = [...ch.chord, ch.chord[0] + 12];
      for (let k = 0; k < 4; k++) pluck(t + (k * beat) / 4, notes[(pos * 4 + k) % 4] + 12, brk ? 0.035 : 0.045, k % 2 ? 0.35 : -0.35);
    }
  }

  for (const c of cues) sfx[c.type]?.(c.t);

  // ------------------------------------------------------------ master
  const fadeOut = 1.8;
  let peak = 0;
  for (let j = 0; j < N; j++) {
    const t = j / sampleRate;
    const g = Math.min(1, (duration - t) / fadeOut) * Math.min(1, t / 0.02);
    L[j] = Math.tanh(L[j] * 1.1) * g;
    R[j] = Math.tanh(R[j] * 1.1) * g;
    peak = Math.max(peak, Math.abs(L[j]), Math.abs(R[j]));
  }
  const norm = peak > 0 ? 0.89 / peak : 1;
  for (let j = 0; j < N; j++) {
    L[j] *= norm;
    R[j] *= norm;
  }
  return { left: L, right: R, sampleRate };
}

// WAV PCM 16-bit estéreo
export function encodeWav({ left, right, sampleRate }) {
  const n = left.length;
  const buf = new ArrayBuffer(44 + n * 4);
  const v = new DataView(buf);
  const str = (o, s) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + n * 4, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 2, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 4, true);
  v.setUint16(32, 4, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) {
    v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, left[i])) * 0x7fff, true);
    v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, right[i])) * 0x7fff, true);
  }
  return new Uint8Array(buf);
}
