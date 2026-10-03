# Guerras do Presente · Rússia x Ucrânia 1/3

Vídeo 1 da cápsula Rússia x Ucrânia, **"Por que a Rússia e a Ucrânia estão em
guerra?"**, feito em JavaScript: cada quadro é desenhado em `<canvas>` (mapas,
ícones, textos e carimbos são vetoriais), a narração é sintetizada por uma voz
neural local (Piper) e a trilha e os efeitos sonoros são gerados por código.

- 4min53s, 13 cenas e 46 planos, seguindo o roteiro da aba "Roteiro — Vídeo 1".
- Formato 16:9 (1920×1080, 30 fps). Tudo o que importa fica numa coluna central
  de 608 px, então o mesmo vídeo sai também em 9:16 (1080×1920), renderizado
  de novo em alta resolução, sem perda de nitidez.

## Arquivos gerados (`out/`)

| Arquivo | O que é |
| --- | --- |
| `ucrania-1-16x9.mp4` | Vídeo horizontal para o YouTube (H.264 + AAC) |
| `ucrania-1-9x16.mp4` | Versão vertical inteira, para recortar Shorts e Reels |
| `ucrania-1.srt` | Legendas em português, sincronizadas com a narração |
| `audio.wav` | Mixagem final (voz + trilha), -15 LUFS |
| `narracao.wav`, `trilha.wav` | Voz e trilha separadas, para remixar em outro editor |

## Como usar

```bash
npm install                 # Playwright, mapas (Natural Earth) e regiões da Ucrânia
npm run voz                 # baixa a voz pt-BR do Piper (60 MB) para vozes/
pip install piper-tts       # sintetizador de voz
npm run narracao            # gera narracao/*.wav e narracao/tempos.json
npm run dev                 # player em http://localhost:5174 (guia 9:16, legendas, ver em 9:16)
npm run render              # gera os dois MP4 + SRT em out/
```

Outros comandos:

```bash
node render.mjs --formato 9x16 --de 126 --ate 146   # recorta um Short (aqui: Budapeste)
node render.mjs --formato 16x9 --legendas           # legendas desenhadas no vídeo
node render.mjs --stills 40,100 --vertical --guia   # quadros PNG para revisão
npm run audio                                       # refaz só a mixagem
```

## Trocar a narração pela sua voz

A voz sintética (Piper, voz "edresson", 16 kHz) serve de guia, mas tem
qualidade simples e erra algumas nasais. Para a versão final:

1. Grave cada frase com o mesmo nome do arquivo em `narracao/`
   (ex.: `03-rus-2.wav`), em WAV mono de 16 bits. Todas com a mesma taxa (por
   exemplo, 48 kHz).
2. Rode `python3 narracao.py --so-tempos`. Os tempos são recalculados e todas
   as animações se reajustam sozinhas à duração da sua fala.
3. Rode `npm run render`.

O texto de cada frase está em `src/roteiro.json` (`texto` é a legenda e
`fala` é a grafia usada pela voz sintética).

## Estrutura

- `src/roteiro.json`: frases da narração e o ponto da fala em que cada plano
  entra (`s` = frase, `f` = fração da frase).
- `src/tempo.js`: monta a linha do tempo a partir das durações da fala.
- `src/cenas.js`: as 13 cenas, uma função por cena.
- `src/mapa.js`: projeção de Mercator, câmera animada e estilos de época
  (moderno, pergaminho, soviético).
- `src/desenho.js`: textos, selos, carimbos, setas, ícones e bandeiras.
- `src/audio.js`: trilha em ré menor, efeitos sincronizados e ducking sob a voz.
- `prep-geo.mjs`: gera `src/geo.json` (separa a Crimeia do polígono russo do
  Natural Earth e ajusta as regiões ucranianas às coordenadas).
- `narracao.py`: síntese da voz frase a frase.
- `render.mjs`: mixagem com ffmpeg, render quadro a quadro no Chromium e MP4.

## Créditos e licenças (colocar na descrição do vídeo)

- Mapas: Natural Earth (domínio público), via `world-atlas`.
- Regiões da Ucrânia: `@svg-maps/ukraine`, licença CC BY 4.0.
- Voz sintética: Piper, voz pt-BR "edresson", treinada no TTS-Portuguese-Corpus
  (CC BY 4.0).
- Fontes: Montserrat e Inter (SIL Open Font License).
- Trilha e efeitos: gerados por código neste projeto.

Os contornos da Rus de Kiev e do Império Russo são aproximados, e as fronteiras
do Império seguem as atuais apenas como referência visual.
