'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

/**
 * Motor de aprendizado do PULSO — reutilizável no app inteiro.
 * Lê o histórico real (metricas_publicacao × canal) e devolve, POR CANAL,
 * qual rede entrega mais (a "rede recomendada"). Alimenta a sequência de
 * postagem sugerida em /audios, /publicar, /producao.
 *
 * A verdade mora no dado: se o Facebook manual passa a entregar mais em
 * Mistérios, a recomendação muda sozinha na próxima coleta.
 */

export type Rede = 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'kwai'

export const REDE_LABEL: Record<Rede, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  kwai: 'Kwai',
}
export const REDE_EMOJI: Record<Rede, string> = {
  youtube: '▶️',
  instagram: '📸',
  facebook: '📘',
  tiktok: '🎵',
  kwai: '🧡',
}
const REDES: Rede[] = ['youtube', 'instagram', 'facebook', 'tiktok', 'kwai']

export interface CanalAprendizado {
  canalId: string
  canalNome: string
  redeRecomendada: Rede | null
  mediaPorRede: Record<Rede, number>
  amostras: number
}

export interface Aprendizados {
  porCanal: Map<string, CanalAprendizado> // key = canalId
  /** Melhor rede para um canal (fallback = youtube quando não há histórico). */
  redeRecomendada: (canalId: string | null | undefined) => Rede
  /** Melhor rede a partir do NOME do canal (telas que só têm o nome). */
  redeRecomendadaNome: (canalNome: string | null | undefined) => Rede
  /** Nome do canal a partir do id. */
  nomeCanal: (canalId: string | null | undefined) => string
}

export function useAprendizados() {
  return useQuery({
    queryKey: ['aprendizados'],
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Aprendizados> => {
      const [canaisRes, ideiasRes, metricasRes] = await Promise.all([
        supabase.schema('pulso_core').from('canais').select('id, nome'),
        supabase.schema('pulso_content').from('ideias').select('id, canal_id'),
        supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id, plataforma, views'),
      ])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nomePorCanal = new Map<string, string>((canaisRes.data || []).map((c: any) => [c.id, c.nome]))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canalPorIdeia = new Map<string, string>((ideiasRes.data || []).map((i: any) => [i.id, i.canal_id]))

      // acumula soma+contagem por canal×rede
      const acc = new Map<string, { soma: Record<Rede, number>; cnt: Record<Rede, number> }>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const m of metricasRes.data || []) {
        const canalId = canalPorIdeia.get((m as any).ideia_id)
        const rede = (m as any).plataforma as Rede
        if (!canalId || !REDES.includes(rede)) continue
        if (!acc.has(canalId)) {
          acc.set(canalId, {
            soma: { youtube: 0, instagram: 0, facebook: 0, tiktok: 0, kwai: 0 },
            cnt: { youtube: 0, instagram: 0, facebook: 0, tiktok: 0, kwai: 0 },
          })
        }
        const a = acc.get(canalId)!
        a.soma[rede] += (m as any).views || 0
        a.cnt[rede] += 1
      }

      const porCanal = new Map<string, CanalAprendizado>()
      for (const [canalId, a] of acc) {
        const mediaPorRede: Record<Rede, number> = { youtube: 0, instagram: 0, facebook: 0, tiktok: 0, kwai: 0 }
        let melhor: Rede | null = null
        let melhorVal = 0
        let amostras = 0
        for (const rede of REDES) {
          const media = a.cnt[rede] ? Math.round(a.soma[rede] / a.cnt[rede]) : 0
          mediaPorRede[rede] = media
          amostras += a.cnt[rede]
          if (media > melhorVal) {
            melhorVal = media
            melhor = rede
          }
        }
        porCanal.set(canalId, {
          canalId,
          canalNome: nomePorCanal.get(canalId) || '—',
          redeRecomendada: melhor,
          mediaPorRede,
          amostras,
        })
      }

      const redeRecomendada = (canalId: string | null | undefined): Rede => {
        if (!canalId) return 'youtube'
        return porCanal.get(canalId)?.redeRecomendada || 'youtube'
      }
      const nomeCanal = (canalId: string | null | undefined): string =>
        (canalId && nomePorCanal.get(canalId)) || '—'

      const porCanalNome = new Map<string, CanalAprendizado>()
      for (const c of porCanal.values()) porCanalNome.set(c.canalNome, c)
      const redeRecomendadaNome = (canalNome: string | null | undefined): Rede => {
        if (!canalNome) return 'youtube'
        return porCanalNome.get(canalNome)?.redeRecomendada || 'youtube'
      }

      return { porCanal, redeRecomendada, redeRecomendadaNome, nomeCanal }
    },
  })
}

/** Cor do badge da nota de hook (0-10). Regra do harness: ≤2 é bloqueio. */
export function corNotaHook(nota: number | null | undefined): string {
  if (nota == null) return 'bg-zinc-800/60 text-zinc-500 ring-zinc-700/40'
  if (nota >= 7) return 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30'
  if (nota >= 4) return 'bg-amber-500/15 text-amber-300 ring-amber-500/30'
  return 'bg-red-500/15 text-red-300 ring-red-500/40'
}

/** Extrai o gancho (primeira frase) do markdown do roteiro. */
export function extrairHook(conteudoMd: string | null | undefined): string {
  if (!conteudoMd) return ''
  const limpo = conteudoMd.replace(/^#+\s*/gm, '').replace(/\*\*/g, '').trim()
  const primeira = limpo.split(/(?<=[.!?])\s/)[0] || limpo
  return primeira.length > 160 ? primeira.slice(0, 157).trimEnd() + '…' : primeira
}

/** Encurta o nome do canal ("PULSO Mistérios & História" -> "Mistérios & História"). */
export function canalCurto(nome: string): string {
  return nome.replace(/^PULSO\s*/i, '')
}
