'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export type TipoAssunto = 'incidente' | 'marco' | 'decisao' | 'produto' | 'numero'

export interface Assunto {
  id: string
  slug: string
  titulo: string
  tipo: TipoAssunto
  data: string
  resumo: string
  corpo_md: string
  numeros: { rotulo: string; valor: string; data?: string }[]
  imagens: { caminho: string; legenda?: string }[]
  videos: number[]
  fontes: string[]
  episodio: string | null
  status: 'rascunho' | 'aprovado'
  origem: string
}

export interface ImagemAssinada { url: string; legenda?: string }
export interface VideoCitado { numero: number; ideiaId: string; titulo: string; thumb: string | null }

const COLUNAS = 'id, slug, titulo, tipo, data, resumo, corpo_md, numeros, imagens, videos, fontes, episodio, status, origem'

// capturas do app moram em bucket PRIVADO (mostram número interno; o repo é público): URL assinada
async function assinar(imagens: Assunto['imagens']): Promise<ImagemAssinada[]> {
  if (!imagens.length) return []
  const { data, error } = await supabase.storage.from('bastidores').createSignedUrls(imagens.map((i) => i.caminho), 3600)
  if (error) throw error
  return (data || []).flatMap((d, i) => (d.signedUrl ? [{ url: d.signedUrl, legenda: imagens[i].legenda }] : []))
}

async function videosCitados(numeros: number[]): Promise<VideoCitado[]> {
  if (!numeros.length) return []
  const { data, error } = await supabase.schema('pulso_content').from('pipeline_producao')
    .select('ideia_id, numero:metadata->>numero, thumb:metadata->>thumb')
    .in('metadata->>numero', numeros.map(String))
  if (error) throw error
  const ids = (data || []).map((d) => d.ideia_id as string)
  const { data: ideias } = ids.length
    ? await supabase.schema('pulso_content').from('ideias').select('id, titulo').in('id', ids)
    : { data: [] as { id: string; titulo: string }[] }
  const titulo = new Map((ideias || []).map((i) => [i.id, i.titulo]))
  return (data || [])
    .map((d) => ({ numero: Number(d.numero), ideiaId: d.ideia_id as string, titulo: titulo.get(d.ideia_id as string) || '', thumb: (d.thumb as string) || null }))
    .sort((a, b) => a.numero - b.numero)
}

/** Linha do tempo: todos os assuntos, do mais recente; capa = 1ª imagem ou thumb do 1º vídeo citado. */
export function useBastidores() {
  return useQuery<(Assunto & { capa: string | null })[]>({
    queryKey: ['bastidores'],
    queryFn: async () => {
      const { data, error } = await supabase.schema('pulso_content').from('bastidores_assuntos')
        .select(COLUNAS).order('data', { ascending: false })
      if (error) throw error
      const assuntos = (data || []) as Assunto[]
      const primeiras = assuntos.flatMap((a) => (a.imagens[0] ? [a.imagens[0]] : []))
      const assinadas = await assinar(primeiras)
      const porCaminho = new Map(primeiras.map((p, i) => [p.caminho, assinadas[i]?.url]))
      const thumbs = await videosCitados([...new Set(assuntos.flatMap((a) => (a.imagens[0] ? [] : a.videos.slice(0, 1))))])
      const thumbDe = new Map(thumbs.map((t) => [t.numero, t.thumb]))
      return assuntos.map((a) => ({
        ...a,
        capa: (a.imagens[0] && porCaminho.get(a.imagens[0].caminho)) || (a.videos[0] != null ? thumbDe.get(a.videos[0]) ?? null : null),
      }))
    },
  })
}

export function useAssunto(slug: string) {
  return useQuery<{ assunto: Assunto; imagens: ImagemAssinada[]; videos: VideoCitado[]; vizinhos: { antes?: Pick<Assunto, 'slug' | 'titulo'>; depois?: Pick<Assunto, 'slug' | 'titulo'> } } | null>({
    queryKey: ['bastidores', slug],
    queryFn: async () => {
      const { data, error } = await supabase.schema('pulso_content').from('bastidores_assuntos')
        .select(COLUNAS).eq('slug', slug).maybeSingle()
      if (error) throw error
      if (!data) return null
      const assunto = data as Assunto
      const [imagens, videos, antes, depois] = await Promise.all([
        assinar(assunto.imagens),
        videosCitados(assunto.videos),
        supabase.schema('pulso_content').from('bastidores_assuntos').select('slug, titulo')
          .lt('data', assunto.data).order('data', { ascending: false }).limit(1).maybeSingle(),
        supabase.schema('pulso_content').from('bastidores_assuntos').select('slug, titulo')
          .gt('data', assunto.data).order('data', { ascending: true }).limit(1).maybeSingle(),
      ])
      return { assunto, imagens, videos, vizinhos: { antes: antes.data ?? undefined, depois: depois.data ?? undefined } }
    },
  })
}
