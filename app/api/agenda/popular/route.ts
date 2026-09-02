import { NextRequest, NextResponse } from 'next/server'

import { guardApi } from '@/lib/auth/api-guard'
import { rotearSlots, type CandidatoAgenda, type Faixa, type SlotParaPreencher } from '@/lib/agenda/roteador'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/agenda/popular
 * Preenche os slots futuros (gerados da grade vw_agenda_semanal) com o melhor ativo
 * de cada canal: vídeo pronto > áudio > roteiro > ideia. Não reusa o mesmo conteúdo,
 * não sobrescreve slot já atribuído (preserva edição manual). Slot sem estoque = "vazio".
 * Payload: { horizonte?: number }
 */
const RANK: Record<string, number> = { video: 4, audio: 3, roteiro: 2, ideia: 1 }

// Cron do Vercel chama via GET — reusa o mesmo fluxo (auto-encaixe diário = agenda viva)
export async function GET(request: NextRequest) {
  return POST(request)
}

export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  const body = await request.json().catch(() => ({}))
  // 28 DIAS por padrão, alinhado com a tela. A /publicar projeta useAgenda(28) e o planejador
  // preenchia 21: os 7 dias de diferença viravam 14 slots "sem conteúdo" no card "O que está
  // travando" — alarme estrutural que aparecia mesmo com a fila cheia e escondia o alarme real.
  const horizonte = Math.min(Math.max(Number(body.horizonte) || 28, 7), 60)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  try {
    const [gradeQ, ideiasQ, roteirosQ, audiosQ, metricasQ, pipeQ, atribQ] = await Promise.all([
      supabase.from('vw_agenda_semanal').select('*').eq('ativo', true),
      supabase.schema('pulso_content').from('ideias').select('id, canal_id, status, titulo, formato'),
      supabase.schema('pulso_content').from('roteiros').select('ideia_id, conteudo_md'),
      supabase.schema('pulso_content').from('audios').select('ideia_id'),
      supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id, plataforma, taxa_retencao'),
      supabase.schema('pulso_content').from('pipeline_producao').select('ideia_id, status, metadata, updated_at'),
      supabase.schema('pulso_content').from('agenda_atribuicoes').select('id, data, horario, ideia_id, fixado, status'),
    ])
    if (gradeQ.error) return NextResponse.json({ error: gradeQ.error.message }, { status: 500 })

    const grade = gradeQ.data || []
    const comRoteiro = new Set((roteirosQ.data || []).map((r: { ideia_id: string }) => r.ideia_id))
    // O corpo do roteiro entra na classificação de tema: o título sozinho mandava
    // "A Misteriosa Biblioteca Subterrânea de Paris" (catacumba, Segunda Guerra, documento
    // histórico) para "outros", e a agenda deixava de priorizar o tema que sorteia no Facebook.
    const roteiroDaIdeia = new Map<string, string>()
    for (const r of (roteirosQ.data || []) as Array<{ ideia_id: string; conteudo_md: string | null }>) {
      if (r.ideia_id && r.conteudo_md && !roteiroDaIdeia.has(r.ideia_id)) roteiroDaIdeia.set(r.ideia_id, r.conteudo_md)
    }
    const comAudio = new Set((audiosQ.data || []).map((a: { ideia_id: string }) => a.ideia_id))
    const publicado = new Set((metricasQ.data || []).map((m: { ideia_id: string }) => m.ideia_id))
    const videoPronto = new Set(
      (pipeQ.data || []).filter((p: { status: string }) => p.status === 'PRONTO_PUBLICACAO').map((p: { ideia_id: string }) => p.ideia_id)
    )

    // RETENÇÃO POR CANAL em percentil dentro da rede — retenção crua não se compara entre
    // plataformas (o YouTube passa de 100% quando o Short entra em loop). Alimenta o roteador.
    const canalDaIdeia = new Map<string, string>()
    for (const i of ideiasQ.data || []) if (i.canal_id) canalDaIdeia.set(i.id, i.canal_id)
    const retPorRede = new Map<string, number[]>()
    for (const m of metricasQ.data || []) {
      if (m.taxa_retencao == null) continue
      if (!retPorRede.has(m.plataforma)) retPorRede.set(m.plataforma, [])
      retPorRede.get(m.plataforma)!.push(m.taxa_retencao)
    }
    for (const arr of retPorRede.values()) arr.sort((a, b) => a - b)
    const percentilNaRede = (plataforma: string, valor: number): number | null => {
      const arr = retPorRede.get(plataforma)
      if (!arr || arr.length < 2) return null
      let abaixo = 0
      for (const v of arr) if (v < valor) abaixo++
      return abaixo / (arr.length - 1)
    }
    const accCanal = new Map<string, { soma: number; n: number }>()
    for (const m of metricasQ.data || []) {
      if (m.taxa_retencao == null || !m.ideia_id) continue
      const canal = canalDaIdeia.get(m.ideia_id)
      if (!canal) continue
      const pct = percentilNaRede(m.plataforma, m.taxa_retencao)
      if (pct == null) continue
      const a = accCanal.get(canal) || { soma: 0, n: 0 }
      a.soma += pct; a.n += 1
      accCanal.set(canal, a)
    }
    const SHRINK_K = 8 // canal com poucas leituras é puxado pro neutro (0,5)
    const percentilCanal = new Map<string, number>()
    for (const [canal, a] of accCanal) {
      percentilCanal.set(canal, (a.n * (a.soma / a.n) + SHRINK_K * 0.5) / (a.n + SHRINK_K))
    }

    // "pronto desde" — proxy honesto de parado: updated_at do pipeline em lote carimba tudo no
    // mesmo dia, então usamos quando as cenas ficaram prontas quando existe.
    const prontoDesde = new Map<string, string>()
    for (const p of pipeQ.data || []) {
      const md = (p.metadata || {}) as { cenas_geradas_em?: string }
      const quando = md.cenas_geradas_em || p.updated_at
      if (p.ideia_id && quando) prontoDesde.set(p.ideia_id, quando)
    }
    const agora = Date.now()

    // ESTOQUE ÚNICO (não mais por canal): o roteador escolhe pelo que rende, e a grade de canal
    // vira preferência de desempate. Antes, terça era do PULSO IA (mediana 86 no Facebook) tivesse
    // ele algo bom ou não, enquanto um história/arqueologia (mediana 2.919) esperava na fila.
    const candidatos: CandidatoAgenda[] = []
    for (const i of ideiasQ.data || []) {
      if (publicado.has(i.id)) continue
      // formato=longo fica FORA da grade de Shorts: a série de bastidores tem cadência e canal
      // próprios (1/semana, só YouTube) e só entra na agenda quando o formato se provar.
      if ((i as { formato?: string }).formato === 'longo') continue
      let estagio: CandidatoAgenda['estagio'] | null = null
      if (videoPronto.has(i.id)) estagio = 'video'
      else if (comAudio.has(i.id)) estagio = 'audio'
      else if (comRoteiro.has(i.id)) estagio = 'roteiro'
      else if (i.status === 'APROVADA') estagio = 'ideia'
      if (!estagio) continue
      const desde = prontoDesde.get(i.id)
      candidatos.push({
        ideiaId: i.id,
        titulo: i.titulo || '',
        corpo: roteiroDaIdeia.get(i.id) ?? null,
        estagio,
        canalId: i.canal_id ?? null,
        percentilCanal: i.canal_id ? (percentilCanal.get(i.canal_id) ?? null) : null,
        diasParado: desde ? Math.max(0, Math.floor((agora - new Date(desde).getTime()) / 86_400_000)) : null,
      })
    }
    // compat: o resto da rota ainda consulta `emEstoque`
    const estoque = new Map<string, { id: string; titulo: string; estagio: string; rank: number }[]>()
    for (const c of candidatos) {
      const k = c.canalId || 'sem-canal'
      if (!estoque.has(k)) estoque.set(k, [])
      estoque.get(k)!.push({ id: c.ideiaId, titulo: c.titulo, estagio: c.estagio, rank: RANK[c.estagio] })
    }

    // já atribuídos: preserva slots + não reusa ideias
    const slotsExistentes = new Set((atribQ.data || []).map((a: { data: string; horario: string }) => `${a.data}|${a.horario}`))
    const hojeISO = new Date().toISOString().slice(0, 10)
    // OCUPADAS = só ideia presa em slot FUTURO fixado pelo dono. Slot VENCIDO não queima estoque:
    // se a ideia tivesse ido ao ar, o set `publicado` (fonte de verdade do "já postamos") barra;
    // se não foi, o vídeo precisa voltar pro bolo. Em 19/08 os 12 prontos do estoque estavam
    // TODOS inagendáveis porque um dia sentaram num slot que venceu sem publicar — o filtro
    // `a.data < hojeISO` daqui marcava slot passado como ocupação eterna, exatamente o bug que
    // o comentário antigo dizia ter consertado.
    const usados = new Set<string>(
      (atribQ.data || [])
        .filter((a: { data: string; fixado?: boolean }) => a.fixado === true && a.data >= hojeISO)
        .map((a: { ideia_id: string | null }) => a.ideia_id)
        .filter((x: string | null): x is string => !!x)
    )

    // REAVALIAÇÃO DE SLOT OBSOLETO — o motivo de a agenda apontar vídeo já publicado.
    // A rota era insert-only: slot existente era pulado pra sempre (os 2 slots de hoje foram
    // escritos em 27/06 e nunca revisitados). Agora um slot FUTURO é reavaliado quando ficou
    // obsoleto: sem ideia, ou a ideia já foi ao ar, ou ela saiu do estoque.
    // TRAVAS: nunca toca data passada (histórico é histórico) nem slot fixado=true (edição do
    // dono manda). A coluna `fixado` era escrita em /atribuir e nunca lida — agora é lida.
    const emEstoque = new Set<string>()
    for (const arr of estoque.values()) for (const x of arr) emEstoque.add(x.id)

    const slotsPorChave = new Map<string, { id: string; data: string; ideia_id: string | null; fixado?: boolean }>()
    for (const a of (atribQ.data || []) as { id: string; data: string; horario: string; ideia_id: string | null; fixado?: boolean }[]) {
      slotsPorChave.set(`${a.data}|${a.horario}`, { id: a.id, data: a.data, ideia_id: a.ideia_id, fixado: a.fixado })
    }
    const hojeIso = new Date().toISOString().slice(0, 10)
    const reavaliar: { id: string; ideia_id: string | null; estagio: string }[] = []

    // gera slots datados do horizonte
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const novos: Record<string, unknown>[] = []
    // Coleta TODOS os slots que precisam de conteúdo e decide de uma vez, no roteador. Antes cada
    // slot escolhia sozinho dentro do seu canal, então ninguém comparava um slot com o outro —
    // e o melhor vídeo do estoque podia cair num horário fraco enquanto o nobre pegava sobra.
    const aPreencher: (SlotParaPreencher & { slotId: string | null })[] = []
    for (let d = 0; d < horizonte; d++) {
      const dt = new Date(hoje)
      dt.setDate(hoje.getDate() + d)
      const wd = dt.getDay() === 0 ? 7 : dt.getDay()
      const dataIso = dt.toISOString().slice(0, 10)
      for (const g of grade.filter((x: { dia_semana: number }) => x.dia_semana === wd)) {
        const chave = `${dataIso}|${g.horario}`
        const existente = slotsPorChave.get(chave)
        if (existente) {
          // INTOCÁVEL: passado é histórico, e slot fixado é decisão do dono — o roteador não
          // reescreve nenhum dos dois, por mais que ache que sabe mais.
          const intocavel = existente.fixado === true || existente.data < hojeIso
          if (intocavel) {
            if (existente.ideia_id) usados.add(existente.ideia_id) // segue ocupando a ideia
            continue
          }
          // O RESTO DO FUTURO É REAVALIADO SEMPRE (mudou em 30/07). Antes só o slot OBSOLETO era
          // revisto — sem ideia, já publicado ou fora do estoque — e o slot "válido" ficava
          // congelado com a escolha da grade antiga. Ou seja: o roteador novo nunca chegava ao
          // plano que já estava na tela. Como o critério agora melhora conforme os dados chegam,
          // o plano futuro precisa acompanhar; quem quiser travar uma data usa `fixado`.
          aPreencher.push({ chave, data: dataIso, horario: g.horario, faixa: (g.faixa === 'sazonal' ? 'sazonal' : 'perene') as Faixa, canalIdPreferido: g.canal_id, slotId: existente.id })
          continue
        }
        aPreencher.push({ chave, data: dataIso, horario: g.horario, faixa: (g.faixa === 'sazonal' ? 'sazonal' : 'perene') as Faixa, canalIdPreferido: g.canal_id, slotId: null })
        slotsExistentes.add(chave)
      }
    }

    // O MOTIVO da escolha NÃO é gravado: ele é recalculado na leitura (lib/hooks/use-agenda.ts,
    // mesma função pontuarCandidato). Motivo congelado no banco mente assim que o estoque muda —
    // e ainda exigiria coluna nova. Recalculado, a frase na tela é sempre a verdade de agora.
    // O ROTEADOR decide tudo de uma vez (ver lib/agenda/roteador.ts): tema que estoura no
    // Facebook > retenção do canal > tempo parado > estágio, com a grade de canal virando só
    // desempate e a faixa sazonal servindo de slot de exploração.
    const escolhas = rotearSlots(aPreencher, candidatos, usados)

    for (const slot of aPreencher) {
      const e = escolhas.get(slot.chave)
      if (slot.slotId) {
        reavaliar.push({ id: slot.slotId, ideia_id: e?.ideiaId || null, estagio: e?.estagio || 'vazio' })
      } else {
        novos.push({
          data: slot.data,
          horario: slot.horario,
          canal_id: slot.canalIdPreferido ?? null,
          ideia_id: e?.ideiaId || null,
          estagio: e?.estagio || 'vazio',
          status: 'planejado',
        })
      }
    }

    if (novos.length > 0) {
      const { error } = await supabase.schema('pulso_content').from('agenda_atribuicoes').insert(novos)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // troca item de slot futuro que ficou obsoleto (um UPDATE por slot — são poucos)
    let reavaliados = 0
    for (const r of reavaliar) {
      const { error } = await supabase
        .schema('pulso_content')
        .from('agenda_atribuicoes')
        .update({ ideia_id: r.ideia_id, estagio: r.estagio })
        .eq('id', r.id)
      if (!error) reavaliados++
    }

    const porEstagio: Record<string, number> = {}
    for (const n of novos) porEstagio[n.estagio as string] = (porEstagio[n.estagio as string] || 0) + 1

    const resumo = {
      criados: novos.length,
      reavaliados, // slots futuros que apontavam vídeo já publicado ou fora do estoque
      preenchidos: novos.filter((n) => n.ideia_id).length,
      vazios: novos.filter((n) => !n.ideia_id).length,
      por_estagio: porEstagio,
    }

    // Cron nunca falha em silêncio: TODA rodada deixa registro, inclusive a que não mudou nada.
    // Sem isto, o dia em que o pg_cron parar de chamar esta rota é indistinguível do dia calmo.
    await supabase.schema('pulso_content').from('logs_workflows').insert({
      workflow_name: 'POPULAR_AGENDA',
      status: novos.length || reavaliados ? 'sucesso' : 'ocioso',
      detalhes: resumo,
    }).then(
      () => {},
      (e: unknown) => console.error('[popular] falha ao logar rodada:', e)
    )

    return NextResponse.json({ success: true, ...resumo })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
