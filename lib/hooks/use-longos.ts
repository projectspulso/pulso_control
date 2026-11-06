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
  montagem?: { versao: number; duracao_s: number; video: string; capa?: string | null; capas?: string[]; legenda: string; arquivo_local: string; em: string; final_mb?: number }
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

const CHAVES_LONGOS = ['voz_bastidores', 'longos_embalagem', 'longos_fabrica', 'cortes_destinos'] as const
export type ChaveLongos = (typeof CHAVES_LONGOS)[number]

/** As configurações que só valem para os Longos (voz, embalagem, fábrica e destinos dos cortes). */
export function useConfigsLongos() {
  return useQuery<Partial<Record<ChaveLongos, { valor: Record<string, unknown>; atualizado: string | null }>>>({
    queryKey: ['longos-configs'],
    queryFn: async () => {
      const { data, error } = await supabase.schema('pulso_core').from('configuracoes')
        .select('chave, valor, updated_at').in('chave', [...CHAVES_LONGOS])
      if (error) throw error
      const saida: Partial<Record<ChaveLongos, { valor: Record<string, unknown>; atualizado: string | null }>> = {}
      for (const r of data || []) {
        try { saida[r.chave as ChaveLongos] = { valor: JSON.parse(r.valor || '{}'), atualizado: r.updated_at } } catch { /* valor inválido fica de fora */ }
      }
      return saida
    },
  })
}

export interface ArquivoLongo { caminho: string; nome: string; pasta: string; bytes: number }

/** Tudo o que um episódio já tem no Storage (bucket bastidores), pasta a pasta. */
export function useArquivosEpisodio(codigo: string | undefined) {
  return useQuery<ArquivoLongo[]>({
    queryKey: ['longos-arquivos', codigo],
    enabled: Boolean(codigo),
    queryFn: async () => {
      const raiz = `episodios/${codigo}`
      const saida: ArquivoLongo[] = []
      const fila = [raiz]
      while (fila.length) {
        const pasta = fila.shift() as string
        const { data, error } = await supabase.storage.from('bastidores').list(pasta, { limit: 1000, sortBy: { column: 'name', order: 'asc' } })
        if (error) throw error
        for (const o of data || []) {
          const caminho = `${pasta}/${o.name}`
          if (!o.id) fila.push(caminho)
          else saida.push({ caminho, nome: o.name, pasta: pasta.slice(raiz.length + 1) || '', bytes: Number((o.metadata as { size?: number } | null)?.size || 0) })
        }
      }
      return saida
    },
  })
}
