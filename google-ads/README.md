# Angel Tech · Campanha Google Ads

Pacote pronto para subir uma campanha local focada em conversão (ligação e
WhatsApp) para a assistência técnica do Ipiranga, em São José/SC.

| Arquivo | Para quê |
|---|---|
| `ANUNCIOS.md` | Todos os textos, com contagem de caracteres e posições fixadas |
| `editor-anuncios.csv` | Os 3 anúncios responsivos para colar no Google Ads Editor |
| `editor-palavras-chave.csv` | Palavras-chave por grupo e negativas da campanha |
| `imagens/*-texto.png` | Display e Demand Gen: com preço, prazo e garantia |
| `imagens/*-limpa.png` | Performance Max e display responsivo: pouco texto, como o Google recomenda |
| `imagens/logo-quadrado.png` | Logo 1:1 (1200×1200) |
| `anuncios.json` | Fonte de todos os textos. Edite aqui e rode `node google-ads/gerar.mjs` |

## Por que pesquisa primeiro

Quem quebrou a tela ou molhou o celular procura **agora**, no Google, com
intenção de resolver hoje. Por isso o investimento principal vai para a
campanha de **Pesquisa**. As imagens servem para uma campanha de Performance
Max ou Demand Gen depois, quando a pesquisa já estiver convertendo.

Cada grupo de anúncios responde a uma dor específica, com o mesmo argumento
do kit de marca: **preço e prazo na frente, garantia sempre citada.**

| Grupo | Dor | Gancho principal |
|---|---|---|
| Troca de tela | Tela quebrada | 40 minutos, a partir de R$ 190, garantia de 90 dias |
| Troca de bateria | Descarrega rápido ou estufou | Garantia de 90 dias, risco da bateria estufada |
| Celular molhado | Caiu na água | "Não ligue, traga agora", banho químico |

## Configuração recomendada

- **Tipo:** Pesquisa, só Rede de Pesquisa (desmarque Parceiros de pesquisa e Display).
- **Local:** raio de 5 a 8 km a partir da loja, com a opção **"Presença: pessoas
  que estão ou estão regularmente nos locais segmentados"**. Sem isso o anúncio
  aparece para quem só pesquisa sobre São José estando longe.
- **Programação:** só no horário de atendimento. A loja fecha às 18h no
  inverno, e uma ligação que ninguém atende é um clique pago perdido.
- **Lance:** começar em *Maximizar conversões*. Depois de umas 30 conversões
  no mês, passar para *CPA desejado*.
- **Orçamento:** um valor diário que você consiga manter por 3 a 4 semanas sem
  mexer. O algoritmo precisa desse tempo para aprender, então mudanças diárias
  atrapalham.
- **Recursos:** ligação, local (vincular o Perfil da Empresa no Google),
  sitelinks, frases de destaque e snippet. Todos estão em `ANUNCIOS.md`.

## Conversões (sem isso o Google não sabe o que otimizar)

1. **Ligações dos anúncios** com duração mínima de 60 segundos.
2. **Clique no botão de WhatsApp** da página de destino.
3. **Pedido de rota** do recurso de local (como conversão secundária).

## Antes de publicar

- **Página de destino:** o Google não aceita link `wa.me` como URL final. É
  preciso uma página (site ou landing page) com o preço de R$ 190, a garantia
  e o botão de WhatsApp. Troque `PREENCHER-URL-DA-PAGINA` no CSV pela URL dela.
- **Preço:** o anúncio diz "a partir de R$ 190", e a página precisa dizer o
  mesmo, senão o anúncio pode ser reprovado por informação divergente.
- **Fotos reais:** para Performance Max, somar fotos da bancada, da fachada e
  de um conserto real às imagens daqui. O Google costuma favorecer foto real.
- **Promoções:** a proposta de marketing sugere "troque a bateria e ganhe uma
  película". Se a loja confirmar, vale virar um recurso de promoção.

## Como importar no Google Ads Editor

1. Crie a campanha "Angel Tech | Pesquisa | São José" com as configurações acima.
2. *Conta → Importar → Colar texto* e cole o conteúdo de `editor-anuncios.csv`.
   Confira o mapeamento das colunas na tela de revisão.
3. Repita com `editor-palavras-chave.csv`.
4. Revise, faça as alterações pendentes e publique.
