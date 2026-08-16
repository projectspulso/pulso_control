import 'server-only'

import { FORMAS_HOOK, type FormaHook } from '@/lib/automation/forma-hook.constantes'

/**
 * A FORMA DO GANCHO VIRA VARIÁVEL DE EXPERIMENTO — não escolha do modelo.
 *
 * O PORQUÊ, medido em 14/08/2026:
 *  · a `nota_hook` que calculávamos NÃO prevê nada: nota 4 rende 2.456 views de mediana e nota 5
 *    rende 2.426. Idênticas. Pontuamos 154 roteiros com um instrumento cego.
 *  · quando o modelo escolhe a forma sozinho, ele CONVERGE: das 67 ideias que registraram
 *    `tipo_hook`, curiosity_gap tinha 25 e pergunta_identificadora tinha 1. Não dá pra comparar
 *    o que quase nunca foi tentado.
 *  · e a forma do ROTEIRO — o texto que de fato é narrado — nunca era gravada em lugar nenhum.
 *
 * Aqui a forma passa a ser sorteada por RODÍZIO: sempre a menos usada entre os roteiros já
 * publicados. Assim cada braço enche no mesmo ritmo e a comparação fica possível.
 *
 * COMO SERÁ JULGADO (e por que não por views): views têm variação relativa de 74% — detectar 20%
 * de diferença exigiria 221 vídeos por forma, quatro meses no ritmo atual. A retenção aos 5
 * segundos varia 11% e exige 5. É a mesma pergunta com 40× menos amostra, porque views carregam
 * sorte de algoritmo e retenção no início é quase só o gancho.
 * Só YouTube e Facebook entregam retenção; TikTok e Kwai ficam de fora da medição.
 */

export { FORMAS_HOOK, ROTULO_FORMA, type FormaHook } from '@/lib/automation/forma-hook.constantes'

/** Instrução que substitui o "escolha 1" — o modelo recebe a forma já decidida. */
export const INSTRUCAO_POR_FORMA: Record<FormaHook, string> = {
  bold_claim:
    'AFIRMAÇÃO OUSADA logo na primeira frase: algo contraintuitivo que o espectador acharia falso à primeira vista, mas é verdade verificável.',
  curiosity_gap:
    'LACUNA DE CONHECIMENTO: revele que existe uma explicação e NÃO a entregue. O cérebro precisa fechar a lacuna e por isso continua.',
  micro_historia:
    'IN MEDIA RES: comece no meio da ação, com data/lugar/pessoa concretos, como se a cena já estivesse acontecendo.',
  pergunta_identificadora:
    'RECONHECIMENTO: uma pergunta em que o espectador se vê ("você também..."). Precisa ser comportamento comum de verdade, não suposição.',
  promessa_especifica:
    'RESULTADO CONCRETO E MENSURÁVEL logo de cara — número, prazo ou efeito específico, nunca promessa vaga.',
  pattern_interrupt:
    'QUEBRA DE PADRÃO: comece de um jeito que destoa do esperado para o tema, provocando um segundo a mais de atenção.',
}

/**
 * Escolhe a forma MENOS usada até agora — rodízio simples.
 * Empate resolve pela ordem da lista, então o preenchimento é determinístico e auditável.
 */
export function proximaForma(usos: Record<string, number>): FormaHook {
  let escolhida: FormaHook = FORMAS_HOOK[0]
  let menor = Infinity
  for (const f of FORMAS_HOOK) {
    const n = usos[f] ?? 0
    if (n < menor) {
      menor = n
      escolhida = f
    }
  }
  return escolhida
}

/** Conta quantos roteiros já saíram de cada forma (fonte: roteiros.metadata.forma_hook). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function contarFormas(supabase: any): Promise<Record<string, number>> {
  const { data } = await supabase.schema('pulso_content').from('roteiros').select('metadata')
  const usos: Record<string, number> = {}
  for (const r of data || []) {
    const f = (r.metadata || {}).forma_hook
    if (typeof f === 'string') usos[f] = (usos[f] || 0) + 1
  }
  return usos
}

/** Abaixo disto a diferença entre formas ainda é sorte — mesma régua do painel. */
export const N_MINIMO_POR_FORMA = 5
/** Quanto do tráfego continua explorando depois que as formas amadurecem. */
export const FATIA_EXPLORACAO = 0.3

export interface DesempenhoForma {
  n: number
  ret5: number | null
}

/**
 * Retenção mediana aos 5 segundos de cada forma — a régua do experimento.
 * Só YouTube e Facebook entregam curva; TikTok e Kwai não entram na conta.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function desempenhoPorForma(supabase: any): Promise<Record<string, DesempenhoForma>> {
  const [{ data: roteiros }, { data: metricas }] = await Promise.all([
    supabase.schema('pulso_content').from('roteiros').select('ideia_id, metadata'),
    supabase.schema('pulso_content').from('metricas_publicacao')
      .select('ideia_id, retention_graph').in('plataforma', ['youtube', 'facebook']),
  ])

  const formaDa = new Map<string, string>()
  for (const r of roteiros || []) {
    const f = (r.metadata || {}).forma_hook
    if (f && r.ideia_id) formaDa.set(r.ideia_id, f)
  }

  const balde: Record<string, number[]> = {}
  for (const m of metricas || []) {
    const f = m.ideia_id ? formaDa.get(m.ideia_id) : undefined
    if (!f) continue
    const g = typeof m.retention_graph === 'string' ? JSON.parse(m.retention_graph) : m.retention_graph
    const v = g?.['5']
    if (typeof v === 'number' && v > 0) (balde[f] = balde[f] || []).push(v * 100)
  }

  const saida: Record<string, DesempenhoForma> = {}
  for (const f of FORMAS_HOOK) {
    const a = balde[f] || []
    const s = [...a].sort((x, y) => x - y)
    const m = s.length >> 1
    saida[f] = { n: a.length, ret5: s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : null }
  }
  return saida
}

/**
 * EXPLORAR, DEPOIS FAVORECER — e nunca parar de explorar de vez.
 *
 * Enquanto alguma forma tiver menos de N_MINIMO_POR_FORMA medições, é rodízio puro: sem amostra
 * não há vencedor, e escolher cedo congela a estratégia em cima de sorte — foi assim que a
 * `nota_hook` passou 154 roteiros parecendo útil.
 *
 * Depois que todas amadurecem, a melhor leva a maior parte, mas FATIA_EXPLORACAO das gerações
 * continua no rodízio. Sem isso o sistema nunca descobriria que uma forma preterida melhorou —
 * e a audiência muda.
 *
 * `sorteio` entra por parâmetro para o teste ser determinístico.
 */
export function escolherForma(
  usos: Record<string, number>,
  desempenho: Record<string, DesempenhoForma>,
  sorteio: number = Math.random(),
): { forma: FormaHook; motivo: 'rodizio' | 'exploracao' | 'melhor' } {
  const imaturas = FORMAS_HOOK.filter((f) => (desempenho[f]?.n ?? 0) < N_MINIMO_POR_FORMA)
  if (imaturas.length > 0) return { forma: proximaForma(usos), motivo: 'rodizio' }
  if (sorteio < FATIA_EXPLORACAO) return { forma: proximaForma(usos), motivo: 'exploracao' }

  let melhor: FormaHook = FORMAS_HOOK[0]
  let maior = -Infinity
  for (const f of FORMAS_HOOK) {
    const r = desempenho[f]?.ret5 ?? -Infinity
    if (r > maior) { maior = r; melhor = f }
  }
  return { forma: melhor, motivo: 'melhor' }
}
