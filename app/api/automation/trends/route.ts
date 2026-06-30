import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { callOpenAI } from '@/lib/automation/ai-clients'
import { buildPromptTriarTrends } from '@/lib/automation/prompts'
import { coletarTrendsBR } from '@/lib/automation/trends'

/**
 * GET /api/automation/trends
 *
 * TREND TOPS PULSO: coleta assuntos em alta no Brasil (Google Trends + Google
 * News + YouTube em alta) e tria por IA pelo ENCAIXE PULSO (tem ângulo
 * educativo/atemporal?). Devolve ranqueado — o dono escolhe e manda pro
 * /api/automation/do-momento { assunto }.
 */
export async function GET(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  try {
    const brutos = await coletarTrendsBR()
    if (brutos.length === 0) {
      return NextResponse.json({ success: true, trends: [], aviso: 'Nenhuma fonte de tendência respondeu.' })
    }

    // triagem por IA: pontua encaixe + sugere ângulo + marca sensível
    const topicos = brutos.map((b) => b.topico)
    let triados: Array<{ topico: string; encaixe: number; angulo: string; sensivel: boolean }> = []
    try {
      const { content } = await callOpenAI(buildPromptTriarTrends(topicos), {
        json_mode: true,
        temperature: 0.2,
        max_tokens: 1500,
      })
      const parsed = JSON.parse(content)
      triados = Array.isArray(parsed.trends) ? parsed.trends : []
    } catch {
      // sem IA: devolve cru (encaixe neutro)
      triados = topicos.map((t) => ({ topico: t, encaixe: 5, angulo: '', sensivel: false }))
    }

    // casa a fonte de volta + ordena por encaixe
    const fontePorTopico = new Map(brutos.map((b) => [b.topico, b.fonte]))
    const trends = triados
      .map((t) => ({ ...t, fonte: fontePorTopico.get(t.topico) || 'ia' }))
      .sort((a, b) => (b.encaixe || 0) - (a.encaixe || 0))

    return NextResponse.json({
      success: true,
      total: trends.length,
      coletado_em: new Date().toISOString(),
      trends,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
