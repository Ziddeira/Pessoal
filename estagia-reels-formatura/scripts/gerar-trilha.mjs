// Gera public/trilha.wav: trilha e efeitos sintetizados por código, sem
// música de terceiros. Os tempos vêm de src/timeline.json.
import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const timeline = JSON.parse(readFileSync(join(raiz, 'src/timeline.json'), 'utf8'));

const SR = 48000;
const fps = timeline.fps;
const inicio = {};
let acc = 0;
for (const c of timeline.cenas) {
	inicio[c.id] = acc / fps;
	acc += c.frames;
}
const DUR = acc / fps;
const N = Math.ceil(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);

// Ruído determinístico para a mesma trilha sair igual sempre.
let semente = 1234567;
const ruido = () => {
	semente = (semente * 1664525 + 1013904223) >>> 0;
	return semente / 4294967296 * 2 - 1;
};

const nota = (n) => 440 * Math.pow(2, (n - 69) / 12);
const add = (i, v, pan = 0) => {
	if (i < 0 || i >= N) return;
	L[i] += v * (1 - Math.max(0, pan));
	R[i] += v * (1 + Math.min(0, pan));
};

// Pad: senos levemente desafinados com ataque e soltura longos.
const pad = (t0, dur, midis, vol) => {
	const a = 0.9, r = 1.2;
	const i0 = Math.floor(t0 * SR), i1 = Math.floor((t0 + dur + r) * SR);
	for (let i = i0; i < i1; i++) {
		const t = i / SR - t0;
		const env = Math.min(1, t / a) * (t > dur ? Math.max(0, 1 - (t - dur) / r) : 1);
		let s = 0;
		for (const m of midis) {
			const f = nota(m);
			s += Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(2 * Math.PI * f * 1.003 * t + 1) + 0.18 * Math.sin(2 * Math.PI * f * 2.001 * t);
		}
		const trem = 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.25 * t);
		const v = s * env * trem * vol / midis.length;
		add(i, v, 0.15 * Math.sin(t));
	}
};

const bumbo = (t0, vol) => {
	const i0 = Math.floor(t0 * SR);
	let fase = 0;
	for (let k = 0; k < SR * 0.45; k++) {
		const t = k / SR;
		const f = 45 + 90 * Math.exp(-t * 28);
		fase += 2 * Math.PI * f / SR;
		add(i0 + k, Math.sin(fase) * Math.exp(-t * 7) * vol);
	}
};

const chimbal = (t0, vol, pan) => {
	const i0 = Math.floor(t0 * SR);
	let ant = 0;
	for (let k = 0; k < SR * 0.06; k++) {
		const n = ruido();
		const hp = n - ant;
		ant = n;
		add(i0 + k, hp * Math.exp(-k / SR * 60) * vol, pan);
	}
};

const pluck = (t0, m, vol, pan) => {
	const i0 = Math.floor(t0 * SR);
	const f = nota(m);
	for (let k = 0; k < SR * 0.7; k++) {
		const t = k / SR;
		const s = Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2 * t) * Math.exp(-t * 12);
		add(i0 + k, s * Math.exp(-t * 6) * vol, pan);
	}
};

// Whoosh: ruído com filtro passa-baixa que abre e fecha.
const whoosh = (tFim, dur, vol) => {
	const t0 = tFim - dur;
	const i0 = Math.floor(t0 * SR);
	let y = 0;
	for (let k = 0; k < (dur + 0.25) * SR; k++) {
		const t = k / SR;
		const x = Math.min(t / dur, 1);
		const corte = 0.02 + 0.3 * Math.pow(x, 2) * (t > dur ? Math.exp(-(t - dur) * 14) : 1);
		y += corte * (ruido() - y);
		const env = Math.pow(x, 2.2) * (t > dur ? Math.exp(-(t - dur) * 16) : 1);
		add(i0 + k, y * env * vol * 3, Math.sin(t * 9) * 0.5);
	}
};

const impacto = (t0, vol) => {
	bumbo(t0, vol);
	const i0 = Math.floor(t0 * SR);
	let y = 0;
	for (let k = 0; k < SR * 1.6; k++) {
		const t = k / SR;
		y += 0.04 * (ruido() - y);
		add(i0 + k, (Math.sin(2 * Math.PI * 41 * t) * 0.6 + y * 2) * Math.exp(-t * 2.6) * vol * 0.6);
	}
};

const clique = (t0, vol, pan = 0) => {
	const i0 = Math.floor(t0 * SR);
	for (let k = 0; k < SR * 0.05; k++) {
		const t = k / SR;
		add(i0 + k, Math.sin(2 * Math.PI * 1800 * t) * Math.exp(-t * 110) * vol, pan);
	}
};

const sino = (t0, midis, vol) => {
	midis.forEach((m, j) => {
		const i0 = Math.floor((t0 + j * 0.07) * SR);
		const f = nota(m);
		for (let k = 0; k < SR * 1.8; k++) {
			const t = k / SR;
			const s = Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t * 5);
			add(i0 + k, s * Math.exp(-t * 2.2) * vol, (j - 1) * 0.3);
		}
	});
};

// ---------- Música ----------
const BPM = 96;
const tempo = 60 / BPM;
const compasso = tempo * 4;
const virada = inicio.Produto;

// Parte da dor: ré menor, esparsa.
const acordesDor = [
	[50, 57, 62, 64, 65],
	[46, 53, 58, 62, 65],
	[41, 53, 57, 60, 64],
	[48, 55, 60, 62, 64],
];
for (let b = 0, t = 0; t < virada - 0.3; b++, t += compasso) {
	pad(t, Math.min(compasso, virada - t), acordesDor[b % 4], 0.07);
}
for (let t = inicio.Aluna; t < virada - 0.1; t += tempo * 2) bumbo(t, 0.32);
for (let t = inicio.Consequencias; t < virada - 0.1; t += tempo) chimbal(t + tempo / 2, 0.05, 0.3);

// Parte da solução: fá maior, com arpejo.
const acordesSol = [
	[41, 57, 60, 65, 69],
	[48, 55, 60, 64, 67],
	[50, 57, 62, 65, 69],
	[46, 58, 62, 65, 70],
];
const arpejos = [
	[65, 69, 72, 77],
	[64, 67, 72, 76],
	[62, 65, 69, 74],
	[62, 65, 70, 74],
];
const fimMusica = DUR - 2.2;
for (let b = 0, t = virada; t < fimMusica; b++, t += compasso) {
	pad(t, Math.min(compasso, fimMusica - t), acordesSol[b % 4], 0.08);
	for (let k = 0; k < 8; k++) {
		const tt = t + k * tempo / 2;
		if (tt < fimMusica) pluck(tt, arpejos[b % 4][k % 4], 0.07, k % 2 ? 0.35 : -0.35);
	}
}
for (let t = virada; t < fimMusica; t += tempo) {
	bumbo(t, 0.38);
	chimbal(t + tempo / 2, 0.08, 0.2);
}
pad(fimMusica, 1.4, [41, 57, 60, 65, 69, 72], 0.09);

// ---------- Efeitos ----------
const f = (cena, quadro) => inicio[cena] + quadro / fps;
for (const c of timeline.cenas.slice(1)) whoosh(inicio[c.id], 0.45, 0.22);
impacto(f('Formatura', 4), 0.55);
impacto(f('Aluna', 146), 0.45);
impacto(f('Consequencias', 128), 0.4);
for (let k = 0; k < 4; k++) clique(f('Consequencias', 14 + k * 20), 0.25, k % 2 ? 0.3 : -0.3);
sino(f('Semestres', 58), [62, 69], 0.08);
clique(f('Produto', 94), 0.35);
clique(f('Produto', 186), 0.35);
sino(f('Produto', 200), [72, 76, 79], 0.1);
for (let k = 0; k < 5; k++) clique(f('Recursos', 4 + k * 18), 0.22, k % 2 ? 0.3 : -0.3);
sino(f('Recursos', 76), [77, 81, 84], 0.08);
whoosh(f('Virada', 60), 1.0, 0.16);
sino(f('Virada', 60), [69, 74], 0.08);
sino(f('Chamada', 6), [65, 69, 72, 77], 0.1);
clique(f('Chamada', 92), 0.35);

// ---------- Mixagem e WAV ----------
let pico = 0;
for (let i = 0; i < N; i++) pico = Math.max(pico, Math.abs(L[i]), Math.abs(R[i]));
const ganho = 0.89 / pico;
const fadeOut = Math.floor(1.2 * SR);
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + N * 4, 4);
buf.write('WAVE', 8);
buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write('data', 36);
buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
	const fim = i > N - fadeOut ? (N - i) / fadeOut : 1;
	const ini = Math.min(1, i / (0.02 * SR));
	const g = ganho * fim * ini;
	buf.writeInt16LE(Math.round(Math.tanh(L[i] * g) * 32767), 44 + i * 4);
	buf.writeInt16LE(Math.round(Math.tanh(R[i] * g) * 32767), 46 + i * 4);
}
writeFileSync(join(raiz, 'public/trilha.wav'), buf);
console.log(`public/trilha.wav: ${DUR.toFixed(2)} s`);
