'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export type AreaProblema = 'coleta' | 'publicacao' | 'render' | 'producao' | 'dados' | 'seguranca' | 'custo' | 'infra' | 'conteudo'

export interface Problema {
  id: string
  slug: string
  titulo: string
  area: AreaProblema
  gravidade: 'alta' | 'media' | 'baixa'
  inicio: string
  fim: string | null
  sintoma: string
  causa: string
  conserto: string
  prova: string
  trava: string
  impacto: { rotulo: string; valor: string; data?: string }[]
  historia_md: string
  commits: string[]
  memorias: string[]
  assunto_slug: string | null
  status: 'rascunho' | 'aprovado'
}

const COLUNAS = 'id, slug, titulo, area, gravidade, inicio, fim, sintoma, causa, conserto, prova, trava, impacto, historia_md, commits, memorias, assunto_slug, status'

export function useLivro() {
  return useQuery<Problema[]>({
    queryKey: ['livro'],
    queryFn: async () => {
      const { data, error } = await supabase.schema('pulso_content').from('livro_problemas')
        .select(COLUNAS).order('inicio', { ascending: false }).order('slug', { ascending: false })
      if (error) throw error
      return (data || []) as Problema[]
    },
  })
}

/** O caso e, só para admin, a receita. Para quem não é admin a RLS devolve vazio: a tela some com a seção. */
export function useProblema(slug: string) {
  return useQuery<{ problema: Problema; receita: string | null } | null>({
    queryKey: ['livro', slug],
    queryFn: async () => {
      const { data, error } = await supabase.schema('pulso_content').from('livro_problemas')
        .select(COLUNAS).eq('slug', slug).maybeSingle()
      if (error) throw error
      if (!data) return null
      const { data: r } = await supabase.schema('pulso_content').from('livro_problemas_receita')
        .select('receita_md').eq('problema_id', data.id).maybeSingle()
      return { problema: data as Problema, receita: r?.receita_md ?? null }
    },
  })
}
