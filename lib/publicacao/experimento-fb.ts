import 'server-only'

/**
 * RE-TESTE DO FACEBOOK VIA API — experimento com prazo, não mudança de política.
 *
 * O QUE JÁ FOI MEDIDO (e por que o Facebook está na lista de proibidos):
 *   11/07/2026 e 04/08/2026 — 3 publicações por API deram EXATAMENTE zero play, contra mediana
 *   446 nas 117 do histórico. Zero em 3 de 3 não é ruído, é supressão: o algoritmo do FB trata
 *   reel não-nativo de outro jeito. Só o método diferia.
 *
 * POR QUE RE-TESTAR MESMO ASSIM: aquela medição é de um canal com menos movimento. Hoje o perfil
 * publica todo dia, tem histórico e o Facebook responde por 43% de todo o alcance do PULSO — se
 * ele puder sair sozinho, some o único gargalo manual diário. A hipótese do dono é que o
 * amadurecimento do canal mude o resultado. Vale medir de novo; não vale trocar a política sem medir.
 *
 * COMO ESTE EXPERIMENTO SE PROTEGE:
 *  · ALTERNA — um vídeo por API, o próximo pela mão. Assim os dois braços vivem a mesma semana,
 *    o mesmo estoque e o mesmo humor do algoritmo. Mandar tudo por API compararia semanas
 *    diferentes, que é como se engana sozinho.
 *  · TEM PRAZO — `ate` é obrigatório e passado o dia ele se desliga sozinho. Experimento sem data
 *    de morte vira política por descuido.
 *  · É REVERSÍVEL SEM DEPLOY — mora em `pulso_core.configuracoes`, chave `experimento_fb_api`.
 *    Para abortar, basta `ativo: false`.
 *  · NÃO MEXE em REDES_PROIBIDAS_API. A trava continua de pé; o experimento é a exceção explícita
 *    e temporária, e quando expirar tudo volta ao normal sem ninguém precisar lembrar.
 *
 * O QUE ESTE TESTE CONSEGUE E NÃO CONSEGUE RESPONDER: com ~6 vídeos por braço numa semana, ele
 * distingue bem "voltou a ser zero" de "agora entrega algo" — que é a pergunta. Ele NÃO tem
 * poder para detectar diferença sutil (o FB é loteria, ~6% de acerto), então empate apertado
 * deve ser lido como "não sabemos", nunca como "tanto faz".
 */

export interface ExperimentoFbApi {
  ativo: boolean
  /** YYYY-MM-DD (BRT). Depois desta data o experimento se desliga sozinho. */
  ate: string
  /** true = alterna API/manual; false = todos por API (não recomendado) */
  alternar: boolean
}

export const CHAVE_EXPERIMENTO_FB = 'experimento_fb_api'

/** Lê a config e já aplica o prazo — vencido é o mesmo que desligado. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function experimentoFbAtivo(supabase: any): Promise<ExperimentoFbApi | null> {
  try {
    const { data } = await supabase.schema('pulso_core').from('configuracoes')
      .select('valor').eq('chave', CHAVE_EXPERIMENTO_FB).maybeSingle()
    if (!data?.valor) return null
    const cfg = (typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor) as ExperimentoFbApi
    if (!cfg?.ativo || !cfg?.ate) return null
    const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
    if (hoje > cfg.ate) return null // venceu: some sozinho
    return cfg
  } catch {
    return null
  }
}

/**
 * Este vídeo entra no braço da API?
 *
 * A alternância usa a PARIDADE do número do vídeo, não sorteio: assim a decisão é reproduzível,
 * auditável depois ("o #156 era par, foi por API") e não muda se a rodada rodar duas vezes.
 */
export function vaiPorApi(numeroVideo: number | null | undefined, cfg: ExperimentoFbApi): boolean {
  if (!cfg.alternar) return true
  const n = Number(numeroVideo)
  return Number.isFinite(n) ? n % 2 === 0 : false
}
