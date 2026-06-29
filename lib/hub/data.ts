import 'server-only'

import { getSupabaseAdminClient } from '@/lib/supabase/server'

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
  redes: RedeLink[]
}
export interface HubItem {
  numero: number
  titulo: string
}

export const REDE_NOME: Record<string, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
}
const ORDEM = ['youtube', 'instagram', 'tiktok', 'facebook']

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
    sb.schema('pulso_content').from('metricas_publicacao').select('plataforma, url_publicacao').eq('ideia_id', pipe.ideia_id),
  ])

  return {
    numero,
    titulo: (ideiaQ.data?.titulo as string) || 'PULSO',
    descricao: (md.caption as string) || '',
    thumb: (md.thumb as string) || null,
    redes: linksDe(mpQ.data || []),
  }
}

export async function getVideosRecentes(limite = 40): Promise<HubItem[]> {
  const sb = getSupabaseAdminClient()
  const { data: pipes } = await sb.schema('pulso_content').from('pipeline_producao')
    .select('ideia_id, metadata, status').in('status', ['PUBLICADO', 'PRONTO_PUBLICACAO'])
  if (!pipes) return []
  const ids = pipes.map((p) => p.ideia_id)
  const { data: ideias } = await sb.schema('pulso_content').from('ideias').select('id, titulo').in('id', ids)
  const tit = new Map((ideias || []).map((i) => [i.id, i.titulo as string]))

  return pipes
    .map((p) => {
      const md = (p.metadata || {}) as Record<string, unknown>
      const numero = (md.numero as number) ?? null
      return numero != null ? { numero, titulo: tit.get(p.ideia_id) || 'PULSO' } : null
    })
    .filter((x): x is HubItem => x !== null)
    .sort((a, b) => b.numero - a.numero)
    .slice(0, limite)
}

// As 4 contas oficiais (handles confirmados nas memórias do projeto)
export const CONTAS = [
  { plataforma: 'youtube', nome: 'YouTube', handle: '@pulsohistorias', url: 'https://youtube.com/@pulsohistorias' },
  { plataforma: 'instagram', nome: 'Instagram', handle: '@pulsoprojects', url: 'https://instagram.com/pulsoprojects' },
  { plataforma: 'tiktok', nome: 'TikTok', handle: '@pulsohistorias', url: 'https://tiktok.com/@pulsohistorias' },
  { plataforma: 'facebook', nome: 'Facebook', handle: 'Pulso Projects', url: 'https://facebook.com/pulsoprojects' },
]
