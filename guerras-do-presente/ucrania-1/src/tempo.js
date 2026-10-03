// Linha do tempo: transforma o roteiro + a duração de cada frase narrada em
// instantes (segundos) de cada cena, frase e plano. Usado no navegador e no Node.

export const PAUSA_FRASE = 0.32; // silêncio entre frases da mesma cena
export const PAUSA_CENA = 0.7; // silêncio entre cenas
export const INICIO = 0.5; // respiro antes da primeira fala

// Sem o tempos.json (narração ainda não gerada), estima pela quantidade de letras.
const estimar = (frase) => (frase.fala || frase.texto).length * 0.058;

export function montarLinhaDoTempo(roteiro, tempos = {}) {
  let t = INICIO;
  const cenas = [];
  const planos = {};
  const frases = [];

  roteiro.cenas.forEach((cena, c) => {
    // A troca visual de cena acontece no meio do silêncio, antes da fala.
    const pausa = c > 0 ? cena.pausaAntes ?? PAUSA_CENA : 0;
    const inicio = c === 0 ? 0 : t + pausa * 0.35;
    t += pausa;
    const lista = cena.frases.map((f, i) => {
      const nome = `${String(c + 1).padStart(2, '0')}-${cena.id}-${i + 1}`;
      const dur = tempos[nome] ?? estimar(f);
      const fr = { nome, cena: c, i, texto: f.texto, inicio: t, fim: t + dur };
      t = fr.fim + (f.pausaDepois ?? (i < cena.frases.length - 1 ? PAUSA_FRASE : 0));
      frases.push(fr);
      return fr;
    });
    for (const p of cena.planos) {
      const fr = lista[p.s];
      planos[p.n] = fr.inicio + (fr.fim - fr.inicio) * p.f;
    }
    cenas.push({ id: cena.id, titulo: cena.titulo, inicio, fim: t, frases: lista });
  });

  // A cena dura até o começo da próxima.
  cenas.forEach((c, i) => {
    if (i < cenas.length - 1) c.fim = cenas[i + 1].inicio;
  });
  const duracao = Math.ceil(t * 10) / 10;
  cenas.at(-1).fim = duracao;
  return { cenas, planos, frases, duracao };
}
