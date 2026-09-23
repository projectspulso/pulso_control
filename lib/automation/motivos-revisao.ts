/**
 * POR QUE O ROTEIRO NÃO FOI APROVADO SOZINHO — em português, para o card do kanban.
 *
 * A aprovação automática (ai_config.auto_approve_roteiro) só passa roteiro que atende TUDO: nota
 * mínima, gancho, chamada, e nenhuma trava acesa (fato suspeito, mesmo assunto, gêmeo no acervo,
 * promessa aberta). Quando uma falha, o card ficava em "Aguardando roteiro" sem dizer por quê — e o
 * dono precisava abrir o roteiro para descobrir. A mesma função serve à rota (que grava a lista) e
 * ao card (que reconstrói para roteiros gerados antes de 23/09/2026, sem a lista gravada).
 *
 * Sem import de alias: roda com `node --experimental-strip-types` no teste.
 */

/** A nota mínima da aprovação automática — um lugar só, usado pela rota e pelo card. */
export const NOTA_MINIMA_AUTO_APROVAR = 80

export interface EntradaRevisao {
  autoAprovarLigado?: boolean | null
  nota?: number | null
  notaMinima?: number | null
  notaHook?: number | null
  /** SÓ para roteiro gerado antes de 23/09/2026: a nota antiga contava parágrafos como "gancho" */
  blocoUnico?: boolean | null
  duracaoFora?: boolean | null
  temCta?: boolean | null
  colideCom?: string | null
  gemeoDe?: string | null
  promessaAberta?: boolean | null
  fatosSuspeitos?: number | null
  checagemRodou?: boolean | null
}

export function motivosRevisao(e: EntradaRevisao): string[] {
  const m: string[] = []
  if (e.autoAprovarLigado === false) m.push('aprovação automática desligada')
  if (e.fatosSuspeitos && e.fatosSuspeitos > 0) {
    m.push(`${e.fatosSuspeitos} fato${e.fatosSuspeitos > 1 ? 's' : ''} suspeito${e.fatosSuspeitos > 1 ? 's' : ''} na checagem`)
  } else if (e.checagemRodou === false) {
    m.push('checagem de fatos não rodou')
  }
  if (e.colideCom) m.push(`mesmo assunto de "${e.colideCom}"`)
  if (e.gemeoDe) m.push(`parecido com "${e.gemeoDe}"`)
  if (e.promessaAberta) m.push('promete um próximo vídeo que não existe')
  if (e.nota != null && (e.notaMinima == null || e.nota < e.notaMinima)) {
    // A nota é soma de critérios de FORMA; dizer só "65" faz parecer roteiro ruim. Diz o que faltou.
    const causas: string[] = []
    if (e.blocoUnico) causas.push('texto num bloco só, sem parágrafos')
    if (e.duracaoFora) causas.push('duração fora do alvo')
    const minimo = e.notaMinima != null ? ` (mínimo ${e.notaMinima})` : ''
    m.push(`nota ${e.nota}${minimo}${causas.length ? ': ' + causas.join(', ') : ''}`)
  }
  if (e.notaHook != null && e.notaHook < 3) m.push(`gancho fraco (${e.notaHook}/5)`)
  if (e.temCta === false) m.push('sem a chamada para seguir o PULSO')
  return m
}
