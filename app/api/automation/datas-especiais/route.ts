import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { repassarCredencial } from '@/lib/auth/repassar-credencial'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/automation/datas-especiais — o calendário que faltava (dono, 12/10/2026).
 *
 * Dia das Crianças passou sem um vídeo sequer: a raia "do Momento" só gera quando alguém digita um
 * assunto, e com 6 semanas de estoque pronto uma ideia nova levaria semanas para chegar ao ar.
 * Datas vivem no banco (config `datas_especiais`), nunca em constante.
 *
 * Cada data tem 1 ou 2 vagas, sempre às 19h: 2 = dois dias antes + véspera; 1 = véspera (no dia, o vídeo já circula).
 * A partir de `antecedencia_dias` antes, cada rodada avança UM passo por vaga, furando a fila:
 *   sem ideia → cria pela raia do Momento no canal da data, já APROVADA, prioridade 10
 *   sem roteiro → gera; roteiro em RASCUNHO → para e avisa (aprovação continua humana)
 *   sem áudio → gera (as cenas vêm junto); sem cenas → gera; com cenas → EM_EDICAO (o worker põe na frente)
 *   PRONTO → crava data/hora da vaga; quem ocupava o dia perde a data e o comprometer realoca
 * Toda rodada grava log, inclusive ociosa.
 */

export const maxDuration = 300

type Data = { slug: string; nome: string; data: string; videos?: number; canal_id?: string; angulo?: string; angulos?: string[] }
type Vaga = { slug: string; nome: string; data: string; slot: string; ordem: number; canal_id?: string; angulo?: string; vizinhas?: string }

function somarDias(iso: string, n: number) {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  return POST(request)
}

export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any
  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const log = (status: string, detalhes: Record<string, unknown>) =>
    supabase.schema('pulso_content').from('logs_workflows').insert({ workflow_name: 'DATAS_ESPECIAIS', status, detalhes: { hoje, ...detalhes } })

  const { data: cfgRow } = await supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'datas_especiais').maybeSingle()
  const cfg = typeof cfgRow?.valor === 'string' ? JSON.parse(cfgRow.valor) : cfgRow?.valor
  if (!cfg?.datas?.length) { await log('erro', { motivo: 'config datas_especiais vazia' }); return NextResponse.json({ ok: false, erro: 'sem calendário' }) }
  const antecedencia = Number(cfg.antecedencia_dias) || 20
  const horario = String(cfg.horario || '19:00')

  const vagas: Vaga[] = []
  for (const d of cfg.datas as Data[]) {
    const n = d.videos === 2 ? 2 : 1
    for (let k = 0; k < n; k++) {
      // LANÇA ATÉ A VÉSPERA ÀS 19h (dono, 15/10/2026): no dia da data o vídeo já está circulando o dia
      // inteiro. Com 2 vídeos: 2 dias antes e véspera; com 1: véspera. Nunca no próprio dia, às 19h — tarde demais.
      const slot = somarDias(d.data, k - n)
      if (slot <= hoje || somarDias(hoje, antecedencia) < slot) continue
      // um ângulo por vaga: com o mesmo, a trava anti-duplicidade barrou o 2º vídeo do Halloween (12/10)
      vagas.push({ slug: d.slug, nome: d.nome, data: d.data, slot, ordem: k + 1, canal_id: d.canal_id, angulo: d.angulos?.[k] || d.angulo })
    }
  }
  if (!vagas.length) { await log('ocioso', { motivo: `nenhuma data nos próximos ${antecedencia} dias` }); return NextResponse.json({ ok: true, nada: 'sem data na janela' }) }

  const origin = new URL(request.url).origin
  const credenciais = repassarCredencial(request)
  const chamar = async (rota: string, body: unknown) => {
    const r = await fetch(`${origin}${rota}`, { method: 'POST', headers: credenciais, body: JSON.stringify(body) })
    const j = await r.json().catch(() => ({}))
    if (!r.ok || j?.error) throw new Error(`${rota}: ${j?.error || `HTTP ${r.status}`}`)
    return j
  }

  const { data: lidas } = await supabase.schema('pulso_content').from('ideias')
    .select('id, titulo, status, metadata').not('metadata->data_especial', 'is', null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ideias: any[] = [...(lidas || [])]
  const resultados: Array<Record<string, unknown>> = []

  for (const v of vagas) {
    const chave = `${v.slug}|${v.slot}`
    const r: Record<string, unknown> = { vaga: chave }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ideia = ideias.find((i: any) => i.status !== 'DESCARTADA' && `${i.metadata?.data_especial?.slug}|${i.metadata?.data_especial?.slot}` === chave)

      if (!ideia) {
        // datas vizinhas puxam o mesmo assunto (Finados saiu "celtas e máscaras" logo após o Halloween)
        v.vizinhas = ideias.filter((i: { status: string; metadata?: { data_especial?: { slot?: string } } }) => {
          const s = i.metadata?.data_especial?.slot
          return i.status !== 'DESCARTADA' && s && Math.abs(Date.parse(s) - Date.parse(v.slot)) <= 10 * 864e5
        }).map((i: { titulo: string }) => `"${i.titulo}"`).join(', ')
        const assunto = `${v.nome} (${v.data.split('-').reverse().join('/')}) — sai ${v.slot === somarDias(v.data, -1) ? 'na véspera' : 'dois dias antes'}, às 19h. Ângulo: ${v.angulo || 'a origem e a história por trás da data'}`
          + (v.ordem === 2 ? '. Conte uma história DIFERENTE do outro vídeo desta data.' : '')
          + (v.vizinhas ? `. Já existem vídeos de datas próximas sobre: ${v.vizinhas} — NÃO repita esses assuntos.` : '')
        const g = await chamar('/api/automation/do-momento', { assunto, canal_id: v.canal_id })
        if (!g?.ideia?.id) { r.passo = 'ideia barrada'; r.motivo = g?.aviso || g?.motivo || JSON.stringify(g).slice(0, 200); resultados.push(r); continue }
        const { data: atual } = await supabase.schema('pulso_content').from('ideias').select('metadata').eq('id', g.ideia.id).single()
        await supabase.schema('pulso_content').from('ideias').update({
          status: g.precisa_revisao ? 'RASCUNHO' : 'APROVADA', prioridade: 10,
          metadata: { ...(atual?.metadata || {}), data_especial: { slug: v.slug, nome: v.nome, data: v.data, slot: v.slot } },
        }).eq('id', g.ideia.id)
        await supabase.schema('pulso_content').from('agenda_atribuicoes').upsert({
          data: v.slot, horario, canal_id: v.canal_id || null, ideia_id: g.ideia.id, estagio: 'ideia', status: 'planejado', fixado: true, updated_at: new Date().toISOString(),
        }, { onConflict: 'data,horario' })
        ideias.push({ id: g.ideia.id, titulo: g.ideia.titulo, status: 'APROVADA', metadata: { data_especial: { slug: v.slug, slot: v.slot } } })
        r.passo = g.precisa_revisao ? 'ideia criada — PRECISA REVISÃO do dono' : 'ideia criada e aprovada'; r.titulo = g.ideia.titulo
        resultados.push(r); continue
      }
      r.titulo = ideia.titulo
      if (ideia.status !== 'APROVADA') { r.passo = 'parada: ideia aguardando aprovação do dono'; resultados.push(r); continue }

      const { data: rots } = await supabase.schema('pulso_content').from('roteiros').select('id, status').eq('ideia_id', ideia.id).order('created_at', { ascending: false }).limit(1)
      const rot = rots?.[0]
      if (!rot) { await chamar('/api/automation/gerar-roteiro', { ideia_id: ideia.id }); r.passo = 'roteiro gerado'; resultados.push(r); continue }
      if (rot.status !== 'APROVADO') { r.passo = 'parada: roteiro aguardando aprovação do dono'; resultados.push(r); continue }

      const { data: pipes } = await supabase.schema('pulso_content').from('pipeline_producao').select('id, status, metadata, data_publicacao_planejada').eq('ideia_id', ideia.id).limit(1)
      const p = pipes?.[0]
      if (!p) { r.passo = 'parada: roteiro aprovado sem linha no pipeline'; resultados.push(r); continue }
      const quando = `${v.slot}T${horario.slice(0, 5)}:00`

      if (p.status === 'ROTEIRO_PRONTO' || p.status === 'AGUARDANDO_ROTEIRO') {
        await chamar('/api/automation/gerar-audio', { roteiro_id: rot.id }); r.passo = 'áudio gerado'
      } else if (p.status === 'AUDIO_GERADO' && !p.metadata?.cenas?.scenes?.length) {
        await chamar('/api/automation/gerar-cenas', { roteiro_id: rot.id }); r.passo = 'cenas geradas'
      } else if (p.status === 'AUDIO_GERADO') {
        await supabase.schema('pulso_content').from('pipeline_producao').update({ status: 'EM_EDICAO', updated_at: new Date().toISOString() }).eq('id', p.id)
        r.passo = 'autorizado para render (EM_EDICAO)'
      } else if (p.status === 'EM_EDICAO') {
        r.passo = p.metadata?.segurado ? 'parada: segurado' : 'aguardando o worker renderizar'
      } else if (p.status === 'PRONTO_PUBLICACAO') {
        // quem divide o dia sai SEMPRE, mesmo com o nosso já no lugar: em 15/10 a fila recuada pôs o #229
        // em 31/10 junto do Jack-o'-lantern, e o early-return antigo deixava os dois
        const jaCravado = String(p.data_publicacao_planejada || '').replace('T', ' ').slice(0, 16) === quando.replace('T', ' ').slice(0, 16)
        const { data: ocupantes } = await supabase.schema('pulso_content').from('pipeline_producao').select('id, metadata')
          .gte('data_publicacao_planejada', `${v.slot}T00:00:00`).lte('data_publicacao_planejada', `${v.slot}T23:59:59`).neq('id', p.id)
        // o desalojado vai para o 1º dia livre depois da vaga — sem data ele sumia da fila (nenhum robô
        // dá data nova: o comprometer só simula), e dia de outra data especial fica reservado
        const { data: datados } = await supabase.schema('pulso_content').from('pipeline_producao').select('data_publicacao_planejada')
          .gt('data_publicacao_planejada', `${v.slot}T23:59:59`)
        const ocupados = new Set<string>([
          ...(datados || []).map((x: { data_publicacao_planejada: string }) => String(x.data_publicacao_planejada).slice(0, 10)),
          ...vagas.map((x) => x.slot),
        ])
        let livre = v.slot
        for (const o of ocupantes || []) {
          do { livre = somarDias(livre, 1) } while (ocupados.has(livre))
          ocupados.add(livre)
          await supabase.schema('pulso_content').from('pipeline_producao').update({ data_publicacao_planejada: `${livre}T${horario.slice(0, 5)}:00` }).eq('id', o.id)
        }
        if (!jaCravado) await supabase.schema('pulso_content').from('pipeline_producao').update({ data_publicacao_planejada: quando }).eq('id', p.id)
        r.passo = jaCravado ? 'pronto e cravado na vaga' : 'cravado na vaga'; r.desalojados = (ocupantes || []).map((o: { metadata: { numero?: number } | null }) => o.metadata?.numero ?? null); r.desalojados_ate = livre
      } else {
        r.passo = `status ${p.status} — nada a fazer`
      }
    } catch (e) {
      r.erro = e instanceof Error ? e.message.slice(0, 300) : 'erro'
    }
    resultados.push(r)
  }

  const erros = resultados.filter((x) => x.erro).length
  await log(erros ? (erros === resultados.length ? 'erro' : 'parcial') : 'sucesso', { vagas: resultados })
  return NextResponse.json({ ok: erros === 0, vagas: resultados })
}
