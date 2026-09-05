/**
 * O DIA DO PULSO É O DIA DE BRASÍLIA — e escrever isso à mão erra depois das 21h.
 *
 * O QUE O DONO VIU (04/09/2026, 21:15 BRT): a contagem já tinha virado para 05/09 e os vídeos do
 * dia sumiram do painel. Às 21h em Brasília já é meia-noite passada em UTC, então
 * `new Date().toISOString().slice(0, 10)` devolve o dia SEGUINTE — e a comparação com as
 * publicações da noite, que ainda são de hoje, dá zero. Todo dia, das 21h à meia-noite, o app
 * mentia sobre o próprio dia.
 *
 * E O BANCO TEM DUAS CONVENÇÕES, que é o que torna o erro fácil de repetir:
 *   · `metricas_publicacao.data_publicacao` é timestamptz REAL: "2026-09-04T21:05:20+00:00",
 *     que são 18:05 em Brasília. Para saber o dia BRT dela é preciso CONVERTER — cortar os dez
 *     primeiros caracteres devolve o dia UTC, que depois das 21h já é outro.
 *   · `pipeline_producao.data_publicacao_planejada` é NAIVE: "2026-09-04T18:00:00" já está em
 *     horário de Brasília, e aí cortar os dez primeiros caracteres é o certo.
 * Misturar as duas foi o que produziu o bug. As funções abaixo separam os dois casos pelo nome,
 * para que a escolha seja explícita em quem chama.
 *
 * Ver docs/20_BANCO/MIGRACAO_FUSO_HORARIO.md — a migração das 38 colunas sem fuso está adiada
 * para depois de 17/09/2026 (fim do desafio dos 100 dias). Até lá, a regra vive aqui.
 */

const FUSO = 'America/Sao_Paulo'

/** O dia de hoje em Brasília, no formato YYYY-MM-DD. */
export function hojeBRT(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: FUSO })
}

/** Agora em Brasília, como "YYYY-MM-DDTHH:mm:ss" — comparável por string com o formato naive. */
export function agoraBRT(): string {
  return new Date().toLocaleString('sv-SE', { timeZone: FUSO }).replace(' ', 'T')
}

/**
 * O dia BRT de um timestamp COM fuso (o caso de `metricas_publicacao.data_publicacao`).
 * Converte antes de cortar — é a diferença entre acertar e errar depois das 21h.
 */
export function diaBRT(ts: string | null | undefined): string | null {
  if (!ts) return null
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-CA', { timeZone: FUSO })
}

/**
 * O dia de um timestamp SEM fuso (o caso de `pipeline_producao.data_publicacao_planejada`).
 * Aqui o valor JÁ está em Brasília: converter de novo tiraria três horas que não existem.
 */
export function diaNaive(ts: string | null | undefined): string | null {
  return ts ? String(ts).slice(0, 10) : null
}
