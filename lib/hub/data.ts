import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/server'

// URL pública do site (troca por env quando tiver domínio próprio)
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pulsoprojects.vercel.app').replace(/\/$/, '')

export interface RedeLink {
  plataforma: string
  nome: string
  url: string
}
export interface HubVideo {
  numero: number | null
  titulo: string
  descricao: string
  thumb: string | null
  data: string | null // uploadDate (ISO) p/ SEO
  transcricao: string | null
  redes: RedeLink[]
  youtubeId: string | null
}
export interface HubItem {
  numero: number
  titulo: string
  thumb: string | null
  canalId: string | null
  canalNome: string | null
}
export interface HubCanal {
  id: string
  nome: string
  itens: HubItem[]
}

export const REDE_NOME: Record<string, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
}
const ORDEM = ['youtube', 'instagram', 'tiktok', 'facebook']

// Extrai o ID de um vídeo do YouTube (shorts / watch / youtu.be / embed) p/ o player interno
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null
  const m = url.match(/(?:shorts\/|watch\?v=|youtu\.be\/|embed\/|\/v\/)([A-Za-z0-9_-]{6,})/)
  return m ? m[1] : null
}

function linksDe(metricas: { plataforma: string; url_publicacao: string | null }[]): RedeLink[] {
  const por = new Map<string, string>()
  for (const m of metricas) {
    if (m.url_publicacao && !por.has(m.plataforma)) por.set(m.plataforma, m.url_publicacao)
  }
  return ORDEM.filter((p) => por.has(p)).map((p) => ({ plataforma: p, nome: REDE_NOME[p] || p, url: por.get(p)! }))
}

export async function getVideoPorNumero(numero: number): Promise<HubVideo | null> {
  const sb = getSupabaseAdminClient()
  const { data: pipes } = await sb.schema('pulso_content').from('pipeline_producao')
    .select('ideia_id, metadata, status').in('status', ['PUBLICADO', 'PRONTO_PUBLICACAO'])
  const pipe = (pipes || []).find((p) => Number((p.metadata as Record<string, unknown>)?.numero) === numero)
  if (!pipe) return null
  const md = (pipe.metadata || {}) as Record<string, unknown>

  const [ideiaQ, mpQ] = await Promise.all([
    sb.schema('pulso_content').from('ideias').select('titulo').eq('id', pipe.ideia_id).single(),
    sb.schema('pulso_content').from('metricas_publicacao').select('plataforma, url_publicacao, data_publicacao').eq('ideia_id', pipe.ideia_id),
  ])

  const datas = (mpQ.data || []).map((m) => m.data_publicacao as string).filter(Boolean).sort()

  const redes = linksDe(mpQ.data || [])
  return {
    numero,
    titulo: (ideiaQ.data?.titulo as string) || 'PULSO',
    descricao: (md.caption as string) || '',
    thumb: (md.thumb as string) || null,
    data: datas[0] || null,
    transcricao: (md.transcricao as string) || null,
    redes,
    youtubeId: youtubeId(redes.find((r) => r.plataforma === 'youtube')?.url),
  }
}

export async function getVideosRecentes(limite = 120): Promise<HubItem[]> {
  const sb = getSupabaseAdminClient()
  const { data: pipes } = await sb.schema('pulso_content').from('pipeline_producao')
    .select('ideia_id, metadata, status').in('status', ['PUBLICADO', 'PRONTO_PUBLICACAO'])
  if (!pipes) return []
  const ids = pipes.map((p) => p.ideia_id)
  const { data: ideias } = await sb.schema('pulso_content').from('ideias').select('id, titulo, canal_id').in('id', ids)
  const info = new Map((ideias || []).map((i) => [i.id, { titulo: i.titulo as string, canalId: (i.canal_id as string) || null }]))

  const canalIds = [...new Set((ideias || []).map((i) => i.canal_id).filter(Boolean) as string[])]
  const { data: canais } = canalIds.length
    ? await sb.schema('pulso_core').from('canais').select('id, nome').in('id', canalIds)
    : { data: [] }
  const nomeCanal = new Map((canais || []).map((c) => [c.id as string, c.nome as string]))

  const porNumero = new Map<number, HubItem>()
  for (const p of pipes) {
    const md = (p.metadata || {}) as Record<string, unknown>
    const numero = (md.numero as number) ?? null
    if (numero == null || porNumero.has(numero)) continue
    const i = info.get(p.ideia_id)
    porNumero.set(numero, {
      numero,
      titulo: i?.titulo || 'PULSO',
      thumb: (md.thumb as string) || null,
      canalId: i?.canalId ?? null,
      canalNome: i?.canalId ? nomeCanal.get(i.canalId) || null : null,
    })
  }

  return [...porNumero.values()].sort((a, b) => b.numero - a.numero).slice(0, limite)
}

// Agrupa os vídeos em canais (verticais reais), ordenados por volume de conteúdo
export function agruparPorCanal(itens: HubItem[]): HubCanal[] {
  const grupos = new Map<string, HubCanal>()
  for (const v of itens) {
    if (!v.canalId || !v.canalNome) continue
    if (!grupos.has(v.canalId)) grupos.set(v.canalId, { id: v.canalId, nome: v.canalNome, itens: [] })
    grupos.get(v.canalId)!.itens.push(v)
  }
  return [...grupos.values()].sort((a, b) => b.itens.length - a.itens.length)
}

// As 4 contas oficiais (handles confirmados nas memórias do projeto)
export const CONTAS = [
  { plataforma: 'youtube', nome: 'YouTube', handle: '@pulsohistorias', url: 'https://youtube.com/@pulsohistorias' },
  { plataforma: 'instagram', nome: 'Instagram', handle: '@pulsoprojects', url: 'https://instagram.com/pulsoprojects' },
  { plataforma: 'tiktok', nome: 'TikTok', handle: '@pulsohistorias', url: 'https://tiktok.com/@pulsohistorias' },
  { plataforma: 'facebook', nome: 'Facebook', handle: 'Pulso Projects', url: 'https://facebook.com/pulsoprojects' },
]
