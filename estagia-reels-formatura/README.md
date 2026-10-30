# EstagIA · Reels "Aparece na formatura" (9:16)

Vídeo vertical de 49 s (1080×1920, 30 fps) feito em [Remotion](https://remotion.dev),
no estilo de tipografia cinética do vídeo de referência: palavra por palavra,
cortes secos entre verde-escuro e fundo claro, telas do produto e lista em
perspectiva. A trilha e os efeitos são sintetizados por código
(`scripts/gerar-trilha.mjs`), sem música de terceiros.

## A dor

O aluno faz as horas, mas no cenário errado, e o polo só descobre no último
semestre. A nova diretriz de Enfermagem conta o estágio por cenário
(Res. CNE/CES 1/2026), então "960h de 920h" pode estar em dia no total e
bloqueado em saúde mental. Nenhuma peça anterior (check-in, ficha, presença,
limite de horas, checklist, preceptor intermitente, painel) tratou disso.

## Roteiro

| Tempo | Cena | Texto na tela |
|---|---|---|
| 0–3 s | Gancho | O problema do estágio não aparece hoje. |
| 3–6 s | Formatura | (capelo em menta) Aparece na formatura. |
| 6–14 s | Aluna | Último semestre. Cartão da Ana: 960h de 920h, **Em dia**. Por cenário, saúde mental 40h/120h, **Bloqueio · faltam 80h**. "Fez as horas. No cenário errado." |
| 14–20 s | Consequências | A 3 meses da colação: colação adiada, família cobrando o polo, turno extra às pressas, convênio desgastado. "E quem responde é o polo." |
| 20–25 s | Semestres | Hoje, a conta só é feita no último semestre (linha 1º a 8º, marcador no 8º). Sem tempo para escalar 80h. |
| 25–35 s | Produto | Com a EstagIA, a conta é feita todo dia. Painel do polo: **Atenção** Ana, 4º semestre, 0h de 120h em saúde mental. Sugestão da IA: 20 turnos de 6h no CAPS Centro, de 05/03 a 30/04. Nada muda sem a sua aprovação. Aprovar escala, selo vira **Agendado**. |
| 35–40 s | Recursos | Horas por cenário · Check-in no local · Presença confirmada · Aviso com antecedência · **Formatura no tempo certo.** |
| 40–44 s | Virada | O marcador volta do 8º para o 4º: "No 4º semestre. Não no último." |
| 44–49 s | Chamada | Logo, "Veja a conta das horas com os dados do seu polo.", botão **Peça uma demonstração**, 60 dias sem mensalidade, estagia.api.br |

## Marca (manual 1.0)

- Cores só da paleta: verde-escuro `#10231F`, menta `#7FD1C1` só no escuro,
  verde de ação `#0E5A52` só em botão e progresso, neutros esverdeados.
- Plus Jakarta Sans e JetBrains Mono (números, horas e datas), em `public/fonts`.
- Logo e símbolo oficiais em `public/`, sem sombra, giro ou distorção.
- Todo status tem palavra (Em dia, Atenção, Bloqueio, Agendado) e toda tela de
  produto mostra o selo **Dados fictícios**.
- Tom: sem caixa-alta para assustar, sem emoji, números com unidade, datas em
  dd/mm, e "a IA sugere, a coordenação aprova".

## Como usar

```bash
npm install
npm run dev       # gera a trilha e abre o Remotion Studio
npm run render    # gera a trilha e out/estagia-formatura-9x16.mp4
```

Para mudar o tempo de uma cena, altere `src/timeline.json` e o
`durationInFrames` da mesma cena em `src/Video.tsx`, e rode `npm run trilha`
para recalcular os efeitos sonoros.

Neste ambiente de nuvem o render usa o Chromium já instalado:
`REMOTION_CHROME=/caminho/do/chrome-headless-shell npm run render`.
No seu computador, não precisa da variável.

## Estrutura

- `src/cenas/`: uma cena por arquivo, cada uma também aparece sozinha no Studio.
- `src/lib/marca.ts`: fontes, cores e pares de status do manual.
- `src/lib/componentes.tsx`: fundos, palavras animadas, selos, ícones de traço,
  linha dos semestres e pilha em perspectiva.
- `scripts/gerar-trilha.mjs`: trilha (ré menor na dor, fá maior na solução) e efeitos.
