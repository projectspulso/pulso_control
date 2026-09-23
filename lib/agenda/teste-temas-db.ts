import {
  avaliarTeste, diaBRT, pisoPorRede, somarDias, viewsNaIdade,
  type CanalComTeste, type PublicacaoRede, type RegrasTeste, type TesteDoCanal,
} from './teste-temas'

/**
 * O VEREDITO GRAVADO. As regras são puras (./teste-temas); aqui mora o que precisa de banco:
 * ler as leituras, julgar e gravar em `pulso_core.canais.metadata.teste`.
 *
 * Gravado, e não recalculado a cada tela, porque veredito é decisão: um tema reprovado não volta
 * sozinho se o vídeo crescer depois da idade de avaliação. Quem reabre é o dono.
 *
 * Só lê as leituras (~30 mil linhas em 45 dias) quando há tentativa madura para julgar — nos dias
 * sem tema em teste, isto não custa nada.
 */
export async function julgarTestes(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  canais: CanalComTeste[],
  canalPorIdeia: Map<string, string>,
  pubs: PublicacaoRede[],
  estreiaPorIdeia: Map<string, string>,
  regras: RegrasTeste,
  hoje: string
): Promise<{ canais: CanalComTeste[]; mudancas: string[] }> {
  const mudancas: string[] = []
  const ideiasPorCanal = new Map<string, string[]>()
  for (const [ideia, canal] of canalPorIdeia) {
    if (!ideiasPorCanal.has(canal)) ideiasPorCanal.set(canal, [])
    ideiasPorCanal.get(canal)!.push(ideia)
  }

  const limiteMaduro = somarDias(hoje, -regras.idadeAvaliacaoDias)
  const aJulgar = canais.filter(
    (c) => c.teste?.status === 'em_teste' &&
      (ideiasPorCanal.get(c.id) || []).some((i) => (estreiaPorIdeia.get(i) || '9999') <= limiteMaduro)
  )
  if (aJulgar.length === 0) return { canais, mudancas }

  const { data: leit, error } = await supabase
    .schema('pulso_analytics').from('leituras_metricas')
    .select('ideia_id, plataforma, data_ref, views')
    .eq('estimado', false)
    .gte('data_ref', somarDias(hoje, -45))
  if (error) {
    // sem leitura não se julga — e não julgar é o lado seguro: o intervalo de 7 dias continua valendo
    mudancas.push(`teste de tema: leituras indisponíveis (${error.message}) — veredito adiado`)
    return { canais, mudancas }
  }

  const publicadoEm = new Map<string, string>()
  for (const p of pubs) publicadoEm.set(`${p.ideiaId}|${p.plataforma}`, diaBRT(p.dataPublicacao))
  const views = viewsNaIdade(
    ((leit || []) as Array<{ ideia_id: string; plataforma: string; data_ref: string; views: number | null }>)
      .filter((l) => l.ideia_id)
      .map((l) => ({ ideiaId: l.ideia_id, plataforma: l.plataforma, dataRef: l.data_ref, views: l.views ?? 0 })),
    publicadoEm,
    regras.idadeAvaliacaoDias
  )
  const normais = new Set(canais.filter((c) => !c.teste || c.teste.status === 'aprovado').map((c) => c.id))
  const pisos = pisoPorRede(views, canalPorIdeia, normais)

  const saida = [...canais]
  for (const canal of aJulgar) {
    const r = avaliarTeste(canal, ideiasPorCanal.get(canal.id) || [], estreiaPorIdeia, views, pisos, regras, hoje)
    const antes = canal.teste!
    const mudouStatus = r.status !== antes.status
    const novo: TesteDoCanal = {
      ...antes,
      status: r.status,
      tentativas: r.tentativas,
      motivo: r.motivo,
      ...(mudouStatus ? { decidido_em: hoje } : {}),
    }
    if (!mudouStatus && JSON.stringify(antes.tentativas || []) === JSON.stringify(r.tentativas)) continue

    const { data: atual } = await supabase.schema('pulso_core').from('canais').select('metadata').eq('id', canal.id).single()
    const { error: upErr } = await supabase
      .schema('pulso_core').from('canais')
      .update({ metadata: { ...(atual?.metadata || {}), teste: novo } })
      .eq('id', canal.id)
    if (upErr) {
      mudancas.push(`teste de tema: ${canal.nome} não gravou (${upErr.message})`)
      continue
    }
    const i = saida.findIndex((c) => c.id === canal.id)
    saida[i] = { ...canal, teste: novo }
    mudancas.push(`teste de tema: ${canal.nome} → ${r.status} (${r.motivo})`)
  }
  return { canais: saida, mudancas }
}
