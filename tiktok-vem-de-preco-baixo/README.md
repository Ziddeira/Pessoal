# Vem de Preço Baixo · TikTok 9:16

Vídeo de divulgação do grupo de promoções **Vem de Preço Baixo**, para impulsionar
no TikTok. Tem 1080×1920, 30 fps e 23 s, e foi feito 100% em JavaScript: a imagem
é desenhada em `<canvas>` e a trilha é sintetizada no código. Como não há música
de terceiros, não há problema de direitos autorais ao impulsionar.

O vídeo pronto está em `entrega/vem-de-preco-baixo-tiktok.mp4` (H.264 + AAC).

## Roteiro

| Tempo | Cena | Mensagem |
|---|---|---|
| 0–3 s | Gancho | **AINDA PAGA PREÇO CHEIO?** Uma etiqueta de R$ 299,90 é riscada e despenca. "PARA TUDO!" |
| 3–6,2 s | Queda | **AQUI O PREÇO SÓ DESCE!** A seta da logo cai e o preço desce até R$ 149,90 (-50%) |
| 6,2–11,5 s | Grupo | **PROMOÇÕES TODO DIA NO SEU CELULAR.** Celular com o grupo recebendo ofertas |
| 11,5–15,5 s | Vantagens | Ofertas selecionadas, cupons de desconto, achadinhos do dia, bug de preço |
| 15,5–18 s | Grátis | "E o melhor..." **É GRÁTIS!** com confete. "Entrar não custa nada" |
| 18–23 s | Final | Logo, **ENTRE NO GRUPO!** e botão **LINK NA BIO** pulsando |

Cores e estilo seguem a logo: degradê azul `#006CFD → #06387C`, vermelho `#FF0000`,
amarelo `#FFED00` e letras grossas e inclinadas com contorno, em Titan One e
Alfa Slab One. Também usa Montserrat e Inter. Todas são do Google Fonts, com licença OFL.
O texto importante fica fora das áreas que a interface do TikTok cobre: o topo, a
legenda no rodapé e os botões à direita.

**Atenção:** os produtos e preços que aparecem no celular são exemplos. Troque-os
pelas ofertas reais do grupo em `OFERTAS`, no topo de `src/video.js`.

## Como usar

```bash
npm install          # instala o Playwright (só é necessário para gerar o MP4)
npm run dev          # abre o player em http://localhost:5173
npm run render       # gera out/vem-de-preco-baixo-tiktok.mp4
npm run stills       # salva quadros-chave em out/ para revisão
```

No player dá para tocar, pausar, avançar e usar **Exportar vídeo**. A exportação
grava em tempo real pelo navegador (MP4 no Chrome, WebM nos outros).

## Estrutura

- `src/video.js`: cenas, linha do tempo e `renderFrame(ctx, t, assets)`. É
  determinístico: o mesmo tempo sempre gera o mesmo quadro.
- `src/audio.js`: trilha a 120 BPM (Dó–Sol–Lá m–Fá) e efeitos sincronizados
  pelos `CUES`, como caixa registradora, notificação e risco de caneta.
- `render.mjs`: servidor local, render quadro a quadro no Chromium headless e
  montagem do MP4 com o ffmpeg.
- `assets/logo.png`: logo do grupo.

Para mudar um texto, um preço ou o tempo de uma cena, edite `SCENES`, `OFERTAS`,
`VANTAGENS` e as funções `scene*` em `src/video.js`. Se o link do grupo não ficar
na bio, troque `'LINK NA BIO'` em `sceneFinal`.
