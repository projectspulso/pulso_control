'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface Episodio {
  id: string
  codigo: string
  titulo: string
  gancho: string | null
  status: string
  roteiro_md: string | null
  data_prevista: string | null
  audio_url: string | null
  video_url: string | null
  metadata?: FichaEpisodio
}

/** O que os motores dos Longos gravam em episodios.metadata (083). Tudo opcional: a ficha mostra o que existir. */
export interface FichaEpisodio {
  fontes?: { casos: string[]; assuntos: string[]; banco: string[] }
  trava?: { em: string; receitas: number; trechos_comuns: number; termos_proibidos: string[]; passou: boolean }
  narracao?: { blocos: { bloco: string; caracteres: number; duracao_s: number }[]; total_s: number; caracteres: number; voz?: string; voz_aprovada_em?: string }
  montagem?: { versao: number; duracao_s: number; video: string; capa?: string | null; legenda: string; arquivo_local: string; em: string; final_mb?: number }
  textos?: { youtube: { titulo: string; descricao: string; tags: string[]; aviso: string }; cortes: Record<string, { legenda: string }> }
  publicacao?: { canal: string | null; url: string | null; data: string | null }
}

export interface Corte {
  id: string
  numero: number
  titulo: string
  gancho: string
  inicio_s: number
  fim_s: number
  duracao_s: number
  video: string | null
  status: 'pronto' | 'aprovado' | 'publicado' | 'descartado'
  publicacoes: Record<string, { url?: string; data?: string }>
}

export type EstadoFabrica = 'pronto' | 'em_andamento' | 'falta' | 'a_fazer'
export interface ItemFabrica { id: string; nome: string; estado: EstadoFabrica; nota: string }

export function useEpisodios() {
  return useQuery<Episodio[]>({
    queryKey: ['longos-episodios'],
    queryFn: async () => {
      const { data, error } = await supabase.schema('pulso_content').from('episodios')
        .select('id, codigo, titulo, gancho, status, roteiro_md, data_prevista, audio_url, video_url')
        .order('codigo')
      if (error) throw error
      return (data || []) as Episodio[]
    },
  })
}

export function useEpisodio(codigo: string) {
  return useQuery<Episodio | null>({
    queryKey: ['longos-episodio', codigo],
    queryFn: async () => {
      const { data, error } = await supabase.schema('pulso_content').from('episodios')
        .select('id, codigo, titulo, gancho, status, roteiro_md, data_prevista, audio_url, video_url, metadata')
        .eq('codigo', codigo).maybeSingle()
      if (error) throw error
      return (data as Episodio) || null
    },
  })
}

export function useCortes(episodioId: string | undefined) {
  return useQuery<Corte[]>({
    queryKey: ['longos-cortes', episodioId],
    enabled: Boolean(episodioId),
    queryFn: async () => {
      const { data, error } = await supabase.schema('pulso_content').from('episodio_cortes')
        .select('id, numero, titulo, gancho, inicio_s, fim_s, duracao_s, video, status, publicacoes')
        .eq('episodio_id', episodioId!).order('numero')
      if (error) throw error
      return (data || []) as Corte[]
    },
  })
}

/** URLs assinadas do bucket privado bastidores: o vídeo tem o rosto do dono e o repositório é público. */
export function useUrlsAssinadas(caminhos: (string | null | undefined)[]) {
  const lista = caminhos.filter((c): c is string => Boolean(c))
  return useQuery<Record<string, string>>({
    queryKey: ['bastidores-urls', ...lista],
    enabled: lista.length > 0,
    staleTime: 50 * 60 * 1000,
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase.storage.from('bastidores').createSignedUrls(lista, 3600)
      if (error) throw error
      const urls: Record<string, string> = {}
      for (const d of data || []) if (d.path && d.signedUrl) urls[d.path] = d.signedUrl
      return urls
    },
  })
}

/** Checklist da fábrica (configuracoes.longos_fabrica): o que falta para o primeiro episódio sair. */
export function useFabrica() {
  return useQuery<{ atualizadoEm: string | null; itens: ItemFabrica[] }>({
    queryKey: ['longos-fabrica'],
    queryFn: async () => {
      const { data, error } = await supabase.schema('pulso_core').from('configuracoes')
        .select('valor').eq('chave', 'longos_fabrica').maybeSingle()
      if (error) throw error
      try {
        const v = JSON.parse(data?.valor || '{}')
        return { atualizadoEm: v.atualizadoEm || null, itens: Array.isArray(v.itens) ? v.itens : [] }
      } catch {
        return { atualizadoEm: null, itens: [] }
      }
    },
  })
}

/** Vídeos longos já publicados (ideias formato=longo com publicação medida). */
export function useLongosPublicados() {
  return useQuery<{ titulo: string; plataforma: string; views: number; data: string | null }[]>({
    queryKey: ['longos-publicados'],
    queryFn: async () => {
      const ide = await supabase.schema('pulso_content').from('ideias').select('id, titulo').eq('formato', 'longo')
      if (ide.error) throw ide.error
      const ids = (ide.data || []).map((i) => i.id)
      if (!ids.length) return []
      const met = await supabase.schema('pulso_content').from('metricas_publicacao')
        .select('ideia_id, plataforma, views, data_publicacao').in('ideia_id', ids)
      if (met.error) throw met.error
      const titulo = new Map((ide.data || []).map((i) => [i.id, i.titulo as string]))
      return (met.data || []).map((m) => ({
        titulo: titulo.get(m.ideia_id) || '—', plataforma: m.plataforma, views: Number(m.views) || 0, data: m.data_publicacao,
      }))
    },
  })
}
