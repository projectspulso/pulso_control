import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/metricas/kwai-perfil   { seguidores, curtidas }
 * GET  /api/metricas/kwai-perfil   -> último lançamento + se está vencido
 *
 * O Kwai não tem API pública: seguidores e curtidas do perfil só existem se alguém digitar o que
 * vê no print. Até 29/07/2026 NÃO HAVIA ONDE DIGITAR — a config `kwai_perfil` era só LIDA pelo
 * cron de status-contas, e o valor só entrava quando era escrito à mão direto no banco. Resultado:
 * o dono passava os números todo dia e eles não eram gravados; o histórico ficou com platôs falsos
 * ("98, 98, 98, 98") que eram, na verdade, dias sem medição.
 *
 * Esta rota fecha o buraco: um lugar de verdade pra registrar, com data e validação. O cron passa
 * a gravar null quando o lançamento vence (36h), então um furo aparece como furo em vez de virar
 * linha reta inventada.
 */

export const maxDuration = 30

const CHAVE = 'kwai_perfil'
const VALIDADE_HORAS = 36

interface Perfil {
  seguidores: number
  curtidas: number | null
  quando: string
  anterior?: { seguidores: number; curtidas: number | null; quando: string } | null
}

export async function GET(request: NextRequest) {
  const guard = await guardApi(request)
  if (guard) return guard

  const perfil = await ler()
  if (!perfil) return NextResponse.json({ ok: true, perfil: null, vencido: true, horas: null })

  const horas = idadeHoras(perfil.quando)
  return NextResponse.json({
    ok: true,
    perfil,
    vencido: horas == null || horas > VALIDADE_HORAS,
    horas: horas == null ? null : Math.round(horas),
  })
}

export async function POST(request: NextRequest) {
  const guard = await guardApi(request)
  if (guard) return guard

  try {
    const body = await request.json().catch(() => ({}))
    const seguidores = Number(body?.seguidores)
    const curtidasRaw = body?.curtidas
    const curtidas = curtidasRaw == null || curtidasRaw === '' ? null : Number(curtidasRaw)

    if (!Number.isFinite(seguidores) || seguidores < 0) {
      return NextResponse.json({ ok: false, error: 'seguidores inválido' }, { status: 400 })
    }
    if (curtidas != null && (!Number.isFinite(curtidas) || curtidas < 0)) {
      return NextResponse.json({ ok: false, error: 'curtidas inválido' }, { status: 400 })
    }

    const anterior = await ler()

    // TRAVA DE SANIDADE: seguidor de perfil não cai sozinho. Uma queda grande quase sempre é
    // dígito trocado na leitura do print (ex.: 154 -> 54). Recusa e pede confirmação explícita,
    // porque um número errado aqui contamina o histórico e o cálculo de ganho por rede.
    if (anterior && seguidores < anterior.seguidores * 0.8 && !body?.confirmar_queda) {
      return NextResponse.json(
        {
          ok: false,
          error: `queda suspeita: ${anterior.seguidores} → ${seguidores}. Se estiver certo, reenvie com confirmar_queda: true`,
          anterior: anterior.seguidores,
        },
        { status: 409 }
      )
    }

    const perfil: Perfil = {
      seguidores,
      curtidas,
      quando: new Date().toISOString(),
      anterior: anterior
        ? { seguidores: anterior.seguidores, curtidas: anterior.curtidas, quando: anterior.quando }
        : null,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdminClient() as any
    const payload = JSON.stringify(perfil)
    const { data: upd } = await supabase
      .schema('pulso_core')
      .from('configuracoes')
      .update({ valor: payload })
      .eq('chave', CHAVE)
      .select('chave')
    if (!upd || upd.length === 0) {
      await supabase.schema('pulso_core').from('configuracoes').insert({ chave: CHAVE, valor: payload })
    }

    // Grava TAMBÉM no snapshot de hoje do histórico — sem isso o número só entraria na próxima
    // rodada do cron, e um lançamento feito depois das 11h UTC ficaria fora do dia.
    await carimbarNoHistorico(seguidores)

    const ganho = anterior ? seguidores - anterior.seguidores : null
    return NextResponse.json({ ok: true, perfil, ganho })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

async function ler(): Promise<Perfil | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdminClient() as any
    const { data } = await supabase
      .schema('pulso_core')
      .from('configuracoes')
      .select('valor')
      .eq('chave', CHAVE)
      .maybeSingle()
    if (!data?.valor) return null
    const v = typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor
    return typeof v?.seguidores === 'number' ? (v as Perfil) : null
  } catch {
    return null
  }
}

function idadeHoras(quando: string | null | undefined): number | null {
  if (!quando) return null
  const t = new Date(quando).getTime()
  if (!Number.isFinite(t)) return null
  return (Date.now() - t) / 3_600_000
}

/** Escreve o valor de hoje no seguidores_historico, sem esperar o cron. */
async function carimbarNoHistorico(seguidores: number) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseAdminClient() as any
    const hoje = new Date().toISOString().slice(0, 10)
    const { data } = await supabase
      .schema('pulso_core')
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'seguidores_historico')
      .maybeSingle()
    if (!data?.valor) return
    const v = typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hist: any[] = Array.isArray(v?.historico) ? v.historico : []
    const idx = hist.findIndex((h) => h.data === hoje)
    if (idx >= 0) hist[idx] = { ...hist[idx], kwai: seguidores }
    else hist.push({ data: hoje, kwai: seguidores })
    hist.sort((a, b) => (a.data < b.data ? -1 : 1))
    await supabase
      .schema('pulso_core')
      .from('configuracoes')
      .update({ valor: JSON.stringify({ historico: hist.slice(-180) }) })
      .eq('chave', 'seguidores_historico')
  } catch {
    // histórico é secundário; o lançamento principal já foi gravado
  }
}
