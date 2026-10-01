# Angel Tech · Reels 9:16

Vídeo vertical (1080×1920, 30 fps, 29 s) feito 100% em JavaScript: a imagem é
desenhada em `<canvas>` e a trilha é sintetizada com código, então não há
música de terceiros nem problema de direitos autorais.

## Roteiro

| Tempo | Cena | Mensagem |
|---|---|---|
| 0–3 s | Gancho | **CAIU. TRINCOU?** O celular cai e a tela racha. "Calma. A Angel Tech resolve." |
| 3–6,6 s | Prazo | **TROCA DE TELA EM 40 MINUTOS**, com um cronômetro e a tela sendo reparada |
| 6,6–10 s | Preço | **R$ 190** em âmbar, "a partir de". "Preço na frente. Sem enrolação." |
| 10–13,8 s | Garantia | **GARANTIA POR ESCRITO**, com o selo de 90 dias. "Você fala direto com quem conserta o seu aparelho." |
| 13,8–17,4 s | Molhou? | **NÃO LIGA O APARELHO.** "Traz agora que a chance de salvar é maior." · Banho químico |
| 17,4–21,6 s | Serviços | Bateria, banho químico, películas e acessórios, notebook e computador, impressoras, desbloqueio Android, limpeza e remoção de vírus |
| 21,6–24,4 s | Orçamento | **ORÇAMENTO SEM COMPROMISSO.** "Se não compensar consertar, a gente fala." |
| 24,4–29 s | Final | Logo oficial, Ipiranga · São José · SC, botão **CHAMA NO WHATSAPP** e (48) 98865-0449 |

Segue o kit de marca (v1, agosto/2026): fundo azul noite `#0C1C33`, azul Angel
`#1C89DC` só em traços e destaques, âmbar `#F5A623` só no preço, no botão e no
selo, títulos em Montserrat 700/800 e textos em Inter. O logo não é distorcido,
girado nem recebe sombra. O texto importante fica fora das áreas que a
interface do Instagram cobre (topo e rodapé).

## Como usar

```bash
npm install          # instala o Playwright (só é necessário para gerar o MP4)
npm run dev          # abre o player em http://localhost:5173
npm run render       # gera out/angeltech-reels.mp4 (H.264 + AAC, pronto para o Reels)
npm run stills       # salva quadros-chave em out/ para revisão
```

No player dá para tocar, pausar, avançar e usar **Exportar vídeo**. A exportação
grava em tempo real pelo navegador (MP4 no Chrome, WebM nos outros).

## Estrutura

- `src/video.js`: cenas, linha do tempo e `renderFrame(ctx, t, assets)`. É
  determinístico: o mesmo tempo sempre gera o mesmo quadro.
- `src/audio.js`: trilha a 120 BPM e efeitos sincronizados por `CUES`.
- `render.mjs`: servidor local, render quadro a quadro no Chromium headless e
  montagem do MP4 com o ffmpeg.
- `assets/`: logo vertical e símbolo, extraídos do kit de marca.
- `fonts/`: Montserrat e Inter (Google Fonts, licença OFL).

Para mudar um texto, um preço ou o tempo de uma cena, edite `SCENES` e as
funções `scene*` em `src/video.js`.
