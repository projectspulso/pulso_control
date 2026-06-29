import { NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase/server'

// Enriquece o catálogo do banco com TAGS POR VISÃO (gpt-4o-mini olha a miniatura).
// Protegido por CRON_SECRET. Incremental + idempotente: só processa clip sem `visao`,
// grava a cada 5 (resiste a timeout). Chame em loop até restantes=0.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface Visao {
  descricao?: string
  objetos?: string[]
  cenario?: string
  clima?: string[]
  paleta?: string[]
  busca?: string[]
}
interface Clip {
  id: string
  prompt: string
  tags: string[]
  tema: string
  dur: number
  usos: number
  thumb: string
  visao?: Visao
  vtags?: string[]
}

const PROMPT = `Você é curador de um acervo de vídeo faceless (canal PULSO, histórias/curiosidades).
Olhe este frame de vídeo e devolva SOMENTE um JSON, em português:
{"descricao":"1 frase curta do que se vê","objetos":["3-6 elementos visuais"],"cenario":"local/ambiente","clima":["2-3 emoções/atmosfera"],"paleta":["3-4 cores dominantes"],"busca":["3-5 frases curtas que alguém digitaria pra achar este clip"]}`

async function tagThumb(thumb: string, apiKey: string): Promise<Visao | null> {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 350,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: PROMPT },
          { type: 'image_url', image_url: { url: thumb, detail: 'low' } },
        ],
      }],
    }),
  })
  if (!r.ok) return null
  const d = await r.json()
  try {
    return JSON.parse(d.choices?.[0]?.message?.content || '{}') as Visao
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const auth = request.headers.get('authorization') || ''
  const aceitos = [process.env.CRON_SECRET, process.env.SUPABASE_SERVICE_ROLE_KEY].filter(Boolean).map((s) => `Bearer ${s}`)
  if (!aceitos.includes(auth)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY ausente' }, { status: 500 })

  const url = new URL(request.url)
  const limit = Math.min(Number(url.searchParams.get('limit')) || 20, 40)

  const sb = getSupabaseAdminClient()
  const { data } = await sb.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'banco_clips_catalogo').single()
  let catalogo: Clip[] = []
  try { catalogo = JSON.parse(data?.valor || '[]') } catch { catalogo = [] }

  const pendentes = catalogo.filter((c) => !c.visao)
  const lote = pendentes.slice(0, limit)
  let ok = 0

  async function salvar() {
    await sb.schema('pulso_core').from('configuracoes')
      .update({ valor: JSON.stringify(catalogo) }).eq('chave', 'banco_clips_catalogo')
  }

  for (let i = 0; i < lote.length; i++) {
    const c = lote[i]
    const v = await tagThumb(c.thumb, apiKey)
    if (v) {
      c.visao = v
      c.vtags = [
        ...(v.objetos || []), ...(v.clima || []), ...(v.paleta || []), ...(v.busca || []),
        v.cenario || '',
      ].filter(Boolean).map((s) => s.toLowerCase())
      ok++
    }
    if ((i + 1) % 5 === 0) await salvar()
  }
  await salvar()

  return NextResponse.json({ processados: ok, restantes: pendentes.length - ok, total: catalogo.length })
}
