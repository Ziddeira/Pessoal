# Max Verstappen & Red Bull Racing

Site de uma página feito com HTML, CSS e JavaScript puros, sem dependências. A abertura é uma animação de scroll
com 300 imagens WEBP desenhadas em `<canvas>`.

## Estrutura de pastas

```
max-verstappen/
├── index.html
├── styles.css
├── script.js
├── assets/
│   ├── IMG_0454.JPG      ← foto do piloto (já incluída)
│   └── IMG_0455.JPG      ← copie do Drive (pasta MARX VERSTAPEN)
└── frames/
    ├── frame-0001.webp   ← extraia aqui o conteúdo de frameia-sequencia.zip
    ├── frame-0002.webp
    ├── …
    └── frame-0300.webp
```

**Onde colocar os frames:** descompacte o `frameia-sequencia.zip` e coloque os 300 arquivos
(`frame-0001.webp` até `frame-0300.webp`) **diretamente** dentro de `frames/`, ao lado do `index.html`.
Se o zip criar uma subpasta (por exemplo `frames/frameia-sequencia/frame-0001.webp`), mova os arquivos para
`frames/`. Os nomes precisam ter 4 dígitos e a extensão em minúsculas (`.webp`), porque servidores web
diferenciam maiúsculas de minúsculas.

Se os frames não forem encontrados, a abertura mostra um aviso explicando onde colocá-los.

## Como abrir

Dá para abrir o `index.html` direto no navegador. Para testar como num site publicado:

```bash
cd max-verstappen
python3 -m http.server 8000
# abra http://localhost:8000
```

Para publicar, envie a pasta inteira para qualquer hospedagem estática (Netlify, Vercel, GitHub Pages etc.).

## Como funciona a animação

- **Fixa na tela:** a seção `.sequence` é alta (`500vh`, ou `380vh` no celular) e o canvas fica em
  `position: sticky`. O progresso da rolagem dentro da seção escolhe o frame (0 → 299).
- **Troca suave:** o frame exibido persegue o frame pedido pelo scroll com interpolação a cada
  `requestAnimationFrame` (`CONFIG.smoothing` no `script.js`). Só redesenha quando o frame muda.
- **Pré-carregamento:** carrega primeiro o frame 1, depois 1 a cada 10 (a animação já fica utilizável) e por
  fim os demais, com 6 downloads simultâneos. A porcentagem aparece na tela. Se um frame ainda não chegou,
  desenha o mais próximo já carregado.
- **Canvas responsivo:** acompanha o tamanho da tela com `ResizeObserver` e usa a densidade de pixels do
  aparelho (limitada a 2x). A imagem é desenhada no modo *cover*: preenche a tela toda, mantém a proporção e
  corta só as sobras.
- **Celular:** usa `100svh` para não pular quando a barra do navegador aparece ou some, a rolagem da
  seção é mais curta e o scroll é escutado como `passive`.
- **`prefers-reduced-motion`:** com a preferência ativada, nada é animado. A abertura vira um quadro
  estático (`CONFIG.staticFrame`) com altura de uma tela, só esse frame é baixado e as revelações e contadores
  ficam desligados. Mudar a preferência com a página aberta também funciona.

## Ajustes rápidos (`script.js` → `CONFIG`)

| Opção | Padrão | Para quê |
| --- | --- | --- |
| `frameCount` | `300` | quantidade de frames |
| `framePath` | `frames/frame-0001.webp` | padrão dos nomes |
| `smoothing` | `0.16` | menor = mais macio; `1` = sem suavização |
| `staticFrame` | `1` | frame mostrado com menos movimento |
| `maxDpr` | `2` | limite de nitidez (desempenho no celular) |

O comprimento da rolagem fica em `--sequence-length` no `styles.css`. As legendas sobre a animação ficam no
`index.html` e cada uma tem um intervalo de progresso (`data-from` / `data-to`, de 0 a 1).

---

Site feito por fã, sem vínculo oficial com o piloto, a equipe ou a Fórmula 1. Estatísticas até o fim de 2024.
