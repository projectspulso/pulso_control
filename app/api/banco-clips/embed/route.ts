import { NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase/server'

// Precomputa o EMBEDDING de cada clip (texto = prompt + visão + vtags) e grava no
// catálogo. text-embedding-3-small com dimensions:256 (leve). Incremental + idempotente.
// Protegido (service-role/cron). Chame em loop até restantes=0.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface Clip {
  id: string; prompt: string; tags: string[]; tema: string; dur: number; usos: number; thumb: string
  visao?: { descricao?: string }; vtags?: string[]; emb?: number[]
}

function autorizado(req: Request): boolean {
  const auth = req.headers.get('authorization') || ''
  return [process.env.CRON_SECRET, process.env.SUPABASE_SERVICE_ROLE_KEY]
    .filter(Boolean).map((s) => `Bearer ${s}`).includes(auth)
}

function textoDe(c: Clip): string {
  return [c.prompt, c.visao?.descricao || '', (c.vtags || []).join(', '), c.tema].filter(Boolean).join('. ').slice(0, 800)
}

export async function POST(request: Request) {
  if (!autorizado(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY ausente' }, { status: 500 })

  const limit = Math.min(Number(new URL(request.url).searchParams.get('limit')) || 60, 100)
  const sb = getSupabaseAdminClient()
  const { data } = await sb.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'banco_clips_catalogo').single()
  let cat: Clip[] = []
  try { cat = JSON.parse(data?.valor || '[]') } catch { cat = [] }

  const pend = cat.filter((c) => !c.emb || c.emb.length === 0)
  const lote = pend.slice(0, limit)
  if (!lote.length) return NextResponse.json({ processados: 0, restantes: 0, total: cat.length })

  const r = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', dimensions: 256, input: lote.map(textoDe) }),
  })
  if (!r.ok) return NextResponse.json({ error: 'embeddings falhou', detalhe: (await r.text()).slice(0, 120) }, { status: 502 })
  const emb = (await r.json()).data as { embedding: number[] }[]
  lote.forEach((c, i) => { c.emb = emb[i]?.embedding?.map((x) => Math.round(x * 1e5) / 1e5) || [] })

  await sb.schema('pulso_core').from('configuracoes').update({ valor: JSON.stringify(cat) }).eq('chave', 'banco_clips_catalogo')
  return NextResponse.json({ processados: lote.length, restantes: pend.length - lote.length, total: cat.length })
}
