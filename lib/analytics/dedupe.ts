/**
 * DEDUPLICAÇÃO DE PUBLICAÇÕES por (ideia, plataforma).
 *
 * A tabela metricas_publicacao NÃO tem UNIQUE(ideia_id, plataforma). Alguns vídeos foram
 * REPUBLICADOS — o mesmo conteúdo postado de novo dias depois, com novo post_id. A linha antiga
 * fica com views baixas (~4, o post que morreu) e a nova com as views reais. Isso é REAL, não
 * lixo: os dois posts existem nas plataformas. Mas ao AGREGAR por vídeo (somar views, contar
 * cobertura), contar as duas dobra o vídeo.
 *
 * Regra: por (ideia, plataforma), fica a linha de MAIOR views — a republicação que pegou. Não
 * apaga nada no banco; a dedup é só na leitura. A contagem de "republicações" (linhas a mais)
 * é devolvida à parte, pra tela de reconciliação mostrar com transparência.
 */

export interface LinhaPub {
  ideia_id: string | null
  plataforma: string
  views?: number | null
  // deixa passar qualquer outro campo — o dedupe só olha ideia/plataforma/views
  [k: string]: unknown
}

export interface ResultadoDedupe<T extends LinhaPub> {
  /** 1 linha por (ideia, plataforma) — a de maior views */
  unicas: T[]
  /** quantas linhas foram descartadas por serem republicação da mesma (ideia, plataforma) */
  republicacoes: number
}

export function dedupePublicacoes<T extends LinhaPub>(linhas: T[]): ResultadoDedupe<T> {
  const melhor = new Map<string, T>()
  let republicacoes = 0

  for (const l of linhas) {
    if (!l.ideia_id) {
      // sem ideia_id não dá pra agrupar — mantém como está (não deveria acontecer, mas não perde dado)
      melhor.set(`__sem_ideia__${melhor.size}`, l)
      continue
    }
    const chave = `${l.ideia_id}|${l.plataforma}`
    const atual = melhor.get(chave)
    if (!atual) {
      melhor.set(chave, l)
    } else {
      republicacoes++
      if ((l.views ?? 0) > (atual.views ?? 0)) melhor.set(chave, l)
    }
  }

  return { unicas: [...melhor.values()], republicacoes }
}
