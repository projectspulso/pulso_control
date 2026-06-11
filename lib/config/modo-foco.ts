// Desativado em 11/06/2026: operação voltou a ser multi-canal (1 canal online,
// verticais misturadas via grade — doc 17). Telas usam MODO_FOCO_ATIVO nos filtros.
export const MODO_FOCO_ATIVO = false

export const MODO_FOCO = {
  canalId: '257b5ac4-72ab-4d96-a2eb-031833a319a6',
  canalNome: 'PULSO Misterios & Historia',
  canalNomeDb: 'PULSO Mistérios & História',
  canalSlug: 'pulso-misterios-historia-pt',
  redeAncora: 'YouTube Shorts',
  loteMinimo: 5,
  loteValidacao: 20,
  dataInicio: '15/05/2026',
  dataGate: '03/06/2026',
} as const

export const PULSO_MASCOTE = {
  papel: 'narrador e guia editorial do canal',
  formatoMvp: 'voz do Pulso com imagens, cortes, legendas e movimento simples no fundo',
  evitarAgora: 'animacao complexa do personagem antes de validar audiencia',
  voz: 'masculina jovem-adulta, curiosa, direta e levemente misteriosa',
} as const

