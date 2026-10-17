/**
 * Configurações da página – edite aqui (não precisa mexer no HTML).
 */
window.GLOW_CONFIG = {
  // URL do "App da Web" publicado no Google Apps Script (termina em /exec).
  // Enquanto estiver vazio, a agenda funciona em MODO DEMONSTRAÇÃO (horários fictícios).
  apiUrl: '',

  // WhatsApp com DDI + DDD, só números. Ex.: 5511987654321
  whatsapp: '5500000000000',
  instagram: 'glowstudio',
  endereco: 'Glow Studio • Endereço do studio',
  mapsUrl: 'https://maps.google.com/?q=Glow+Studio',

  // Preços exibidos na página. A chave (aplicacao / manutencao) e a duração
  // precisam ser as mesmas do arquivo google-apps-script/Codigo.gs.
  servicos: {
    aplicacao: {
      nome: 'Aplicação Molde F1',
      subtitulo: 'Alongamento completo',
      preco: 160,
      duracaoMin: 150,
      itens: [
        'Preparação e cutilagem',
        'Alongamento com molde F1 nas 10 unhas',
        'Formato à sua escolha (amendoada, quadrada, bailarina)',
        'Esmaltação em gel cor única',
      ],
    },
    manutencao: {
      nome: 'Manutenção Molde F1',
      subtitulo: 'A cada 20–25 dias',
      preco: 110,
      duracaoMin: 120,
      itens: [
        'Nivelamento do crescimento',
        'Reforço da estrutura',
        'Ajuste de formato e comprimento',
        'Esmaltação em gel cor única',
      ],
    },
  },

  // Quantos dias aparecem na agenda.
  diasNaAgenda: 21,

  // Rastreamento opcional (deixe vazio se não usar).
  metaPixelId: '',
  googleAnalyticsId: '',
};
