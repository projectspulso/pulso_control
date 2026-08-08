/**
 * QUAIS REDES PODEM SAIR POR API — regra única, servidor e tela.
 *
 * Estava só dentro de app/publicar/page.tsx. Agora o cron de agendamento também precisa dela, e
 * duas cópias dessa lista é o tipo de divergência que ninguém percebe até o alcance sumir: basta
 * alguém adicionar o Facebook num lugar e não no outro.
 */

export const REDES_API = ['youtube', 'instagram', 'tiktok'] as const

/**
 * O Facebook fica de fora POR MEDIÇÃO, não por esquecimento.
 *
 * TESTE 11/07/2026 (conta aquecida ~20 dias, mesma página, reels published:true): FB via API
 * entregou ALCANCE 0 nos 3 testes, contra 234/265 pela mão. Só o método difere — é política de
 * distribuição do FB pra reel não-nativo (o IG, mesma Graph API, não sofre isso). O Facebook
 * MANUAL rende ~2.261 views/post e 65k de alcance em 14 dias: 7× a melhor rede de API.
 *
 * REMEDIDO em 04/08/2026 com o método já marcado no banco: 3 de 3 posts por API deram
 * EXATAMENTE zero play, contra mediana 464 nos 107 manuais. Botar 'facebook' em REDES_API é
 * jogar fora a rede de maior alcance do PULSO — se um dia quiser reverter, é decisão consciente:
 * tem que sair daqui TAMBÉM, e o certo é re-testar o alcance antes.
 *
 * O Kwai não entra por outro motivo: não tem API pública. Entra pelo celular.
 * Ver memória teste-alcance-api-vs-manual.
 */
export const REDES_PROIBIDAS_API = ['facebook', 'kwai'] as const

/** Trava anti-reintrodução: se alguém puser uma rede proibida em REDES_API, ela cai aqui e avisa. */
export const REDES_API_SEGURAS = REDES_API.filter((r) => {
  if ((REDES_PROIBIDAS_API as readonly string[]).includes(r)) {
    console.error(`[publicacao] "${r}" está em REDES_API mas é PROIBIDA (estrangula via API) — removida.`)
    return false
  }
  return true
})
