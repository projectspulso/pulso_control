import { NextResponse } from 'next/server'

import { getSupabaseAdminClient } from '@/lib/supabase/server'

// Match SEMÂNTICO: embeda o prompt da cena e devolve o clip do banco mais parecido
// (cosine vs embeddings precomputados), respeitando dur, usos<3, não-repetir e hook fresco.
// O render local chama isto; se casar, copia o arquivo local pelo id (sem gastar Veo).
export const dynamic = 'force-dynamic'

const MAX_USOS = 3
const THRESH = 0.6 // estrito p/ qualidade — só reusa se for de fato semelhante (dim 1024)

interface Clip { id: string; dur: number; usos: number; tema: string; emb?: number[]; visao?: { descricao?: string } }

function autorizado(req: Request): boolean {
  const auth = req.headers.get('authorization') || ''
  return [process.env.CRON_SECRET, process.env.SUPABASE_SERVICE_ROLE_KEY]
    .filter(Boolean).map((s) => `Bearer ${s}`).includes(auth)
}

function cos(a: number[], b: number[]): number {
  let d = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  return na && nb ? d / (Math.sqrt(na) * Math.sqrt(nb)) : 0
}

let _cache: { at: number; cat: Clip[] } | null = null
async function catalogo(): Promise<Clip[]> {
  if (_cache && Date.now() - _cache.at < 60000) return _cache.cat
  const sb = getSupabaseAdminClient()
  const { data } = await sb.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'banco_clips_catalogo').single()
  let cat: Clip[] = []
  try { cat = JSON.parse(data?.valor || '[]') } catch { cat = [] }
  _cache = { at: Date.now(), cat }
  return cat
}

export async function POST(request: Request) {
  if (!autorizado(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY ausente' }, { status: 500 })

  const body = await request.json().catch(() => ({})) as { prompt?: string; dur?: number; idxCena?: number; usados?: string[] }
  const prompt = (body.prompt || '').trim()
  if (!prompt) return NextResponse.json({ match: null })
  if (body.idxCena === 0) return NextResponse.json({ match: null, motivo: 'hook sempre fresco' })

  const dur = Number(body.dur || 8)
  const usados = new Set(body.usados || [])

  const r = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', dimensions: 1024, input: prompt }),
  })
  if (!r.ok) return NextResponse.json({ match: null, erro: 'embed falhou' }, { status: 502 })
  const q = (await r.json()).data?.[0]?.embedding as number[]
  if (!q) return NextResponse.json({ match: null })

  const cat = await catalogo()
  let best: Clip | null = null, bestS = 0
  for (const c of cat) {
    if (!c.emb || c.emb.length !== q.length) continue
    if ((c.usos || 0) >= MAX_USOS) continue
    if (usados.has(c.id)) continue
    if (Number(c.dur) < dur) continue
    const s = cos(q, c.emb)
    if (s > bestS) { bestS = s; best = c }
  }
  if (best && bestS >= THRESH) {
    return NextResponse.json({ match: { id: best.id, score: Number(bestS.toFixed(3)), tema: best.tema, descricao: best.visao?.descricao || '' } })
  }
  return NextResponse.json({ match: null, melhor: Number(bestS.toFixed(3)) })
}
