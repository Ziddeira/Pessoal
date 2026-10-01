// Valida os textos do Google Ads, gera ANUNCIOS.md, os CSVs para o Google Ads
// Editor e as imagens dos criativos.
//
//   node google-ads/gerar.mjs            -> tudo
//   node google-ads/gerar.mjs --textos   -> só validação, ANUNCIOS.md e CSVs
//
// As imagens usam o Playwright instalado em reels/ (rode `npm install` lá antes).
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '..');
const dados = JSON.parse(fs.readFileSync(path.join(DIR, 'anuncios.json'), 'utf8'));

// Limites do Google Ads (anúncio responsivo de pesquisa e recursos).
const LIM = { titulo: 30, descricao: 90, caminho: 15, destaque: 25, sitelink: 25, sitelinkLinha: 35, snippet: 25 };
const len = (s) => [...s].length;

// ------------------------------------------------------------------ validação
const erros = [];
const checa = (s, max, onde) => {
  if (len(s) > max) erros.push(`${onde}: "${s}" tem ${len(s)} caracteres (máx. ${max})`);
  if (/!/.test(s) && onde.includes('título')) erros.push(`${onde}: "${s}" — título não pode ter "!"`);
  if (/\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{4,}\b/.test(s)) erros.push(`${onde}: "${s}" — palavra toda em maiúsculas é reprovada`);
};

for (const g of dados.grupos) {
  const onde = `Grupo "${g.nome}"`;
  if (g.titulos.length < 3 || g.titulos.length > 15) erros.push(`${onde}: use de 3 a 15 títulos`);
  if (g.descricoes.length < 2 || g.descricoes.length > 4) erros.push(`${onde}: use de 2 a 4 descrições`);
  if (new Set(g.titulos).size !== g.titulos.length) erros.push(`${onde}: títulos repetidos`);
  g.titulos.forEach((t, i) => checa(t, LIM.titulo, `${onde}, título ${i + 1}`));
  g.descricoes.forEach((d, i) => checa(d, LIM.descricao, `${onde}, descrição ${i + 1}`));
  g.caminho.forEach((c, i) => checa(c, LIM.caminho, `${onde}, caminho ${i + 1}`));
  for (const lista of Object.values(g.fixar ?? {}))
    for (const t of lista) if (!g.titulos.includes(t)) erros.push(`${onde}: título fixado não existe: "${t}"`);
}
dados.frases_destaque.forEach((f) => checa(f, LIM.destaque, 'Frase de destaque'));
for (const s of dados.sitelinks) {
  checa(s.texto, LIM.sitelink, 'Sitelink');
  checa(s.l1, LIM.sitelinkLinha, `Sitelink "${s.texto}", linha 1`);
  checa(s.l2, LIM.sitelinkLinha, `Sitelink "${s.texto}", linha 2`);
}
dados.snippets.valores.forEach((v) => checa(v, LIM.snippet, 'Snippet estruturado'));

if (erros.length) {
  console.error('Textos fora das regras do Google Ads:\n- ' + erros.join('\n- '));
  process.exit(1);
}
console.log('Textos validados: todos dentro dos limites do Google Ads.');

// ------------------------------------------------------------------ ANUNCIOS.md
const conta = (s, max) => `${len(s)}/${max}`;
const posicao = (g, t) => {
  for (const [pos, lista] of Object.entries(g.fixar ?? {})) if (lista.includes(t)) return pos;
  return '';
};

let md = `# Angel Tech · Textos da campanha de pesquisa

> Arquivo gerado por \`gerar.mjs\` a partir de \`anuncios.json\`. Edite o JSON e rode o script de novo.
> Todos os textos já passaram pela validação de limites do Google Ads.

**Campanha:** ${dados.campanha}
`;

for (const g of dados.grupos) {
  md += `\n## Grupo de anúncios: ${g.nome}\n\n`;
  md += `**URL exibida:** \`seusite.com.br/${g.caminho.join('/')}\`\n\n`;
  md += `| # | Título | Caracteres | Fixar na posição |\n|---|---|---|---|\n`;
  g.titulos.forEach((t, i) => (md += `| ${i + 1} | ${t} | ${conta(t, LIM.titulo)} | ${posicao(g, t)} |\n`));
  md += `\n| # | Descrição | Caracteres |\n|---|---|---|\n`;
  g.descricoes.forEach((d, i) => (md += `| ${i + 1} | ${d} | ${conta(d, LIM.descricao)} |\n`));
  md += `\n**Palavras-chave:** ${g.palavras.map((p) => `\`${p}\``).join(', ')}\n`;
}

md += `\n## Recursos da campanha (valem para todos os grupos)

### Frases de destaque
${dados.frases_destaque.map((f) => `- ${f} (${conta(f, LIM.destaque)})`).join('\n')}

### Sitelinks
| Texto | Linha 1 | Linha 2 |
|---|---|---|
${dados.sitelinks.map((s) => `| ${s.texto} | ${s.l1} | ${s.l2} |`).join('\n')}

### Snippet estruturado · ${dados.snippets.cabecalho}
${dados.snippets.valores.join(', ')}

### Ligação
${dados.telefone}

### Palavras-chave negativas (nível da campanha, correspondência de frase)
${dados.negativas.map((n) => `\`${n}\``).join(', ')}
`;
fs.writeFileSync(path.join(DIR, 'ANUNCIOS.md'), md);

// ------------------------------------------------------------------ CSVs para o Google Ads Editor
const csv = (rows) =>
  '﻿' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n') + '\r\n';

const cabAnuncio = ['Campaign', 'Ad group', 'Ad type'];
for (let i = 1; i <= 15; i++) cabAnuncio.push(`Headline ${i}`, `Headline ${i} position`);
for (let i = 1; i <= 4; i++) cabAnuncio.push(`Description ${i}`);
cabAnuncio.push('Path 1', 'Path 2', 'Final URL');
const linhasAnuncio = dados.grupos.map((g) => {
  const r = [dados.campanha, g.nome, 'Responsive search ad'];
  for (let i = 0; i < 15; i++) r.push(g.titulos[i] ?? '', g.titulos[i] ? posicao(g, g.titulos[i]) : '');
  for (let i = 0; i < 4; i++) r.push(g.descricoes[i] ?? '');
  r.push(g.caminho[0], g.caminho[1], 'PREENCHER-URL-DA-PAGINA');
  return r;
});
fs.writeFileSync(path.join(DIR, 'editor-anuncios.csv'), csv([cabAnuncio, ...linhasAnuncio]));

const tipo = (p) => (p.startsWith('[') ? 'Exact' : 'Phrase');
const limpa = (p) => p.replace(/^["[]|["\]]$/g, '');
const linhasPalavras = [
  ...dados.grupos.flatMap((g) => g.palavras.map((p) => [dados.campanha, g.nome, limpa(p), tipo(p)])),
  ...dados.negativas.map((n) => [dados.campanha, '', n, 'Campaign Negative Phrase']),
];
fs.writeFileSync(path.join(DIR, 'editor-palavras-chave.csv'), csv([['Campaign', 'Ad group', 'Keyword', 'Criterion Type'], ...linhasPalavras]));
console.log('Gerados: ANUNCIOS.md, editor-anuncios.csv, editor-palavras-chave.csv');

// ------------------------------------------------------------------ imagens
if (!process.argv.includes('--textos')) {
  let chromium;
  try {
    ({ chromium } = createRequire(path.join(ROOT, 'reels', 'package.json'))('playwright'));
  } catch {
    console.error('Playwright não encontrado. Rode `npm install` dentro de reels/ e tente de novo.');
    process.exit(1);
  }
  const MIME = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.woff2': 'font/woff2' };
  const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, r));

  const browser = await chromium.launch({ args: ['--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1400 } });
  page.on('pageerror', (e) => console.error('erro na página:', e.message));
  await page.goto(`http://localhost:${server.address().port}/google-ads/criativos.html`);
  await page.evaluate(() => window.pronto);

  const outDir = path.join(DIR, 'imagens');
  fs.mkdirSync(outDir, { recursive: true });
  for (const id of await page.$$eval('section[id]', (els) => els.map((e) => e.id))) {
    const file = path.join(outDir, `${id}.png`);
    await page.locator(`#${id}`).screenshot({ path: file });
    const kb = Math.round(fs.statSync(file).size / 1024);
    console.log(`imagens/${id}.png (${kb} KB)`);
    if (kb > 5120) console.warn(`  atenção: acima de 5 MB, o Google Ads recusa`);
  }
  await browser.close();
  server.close();
}
