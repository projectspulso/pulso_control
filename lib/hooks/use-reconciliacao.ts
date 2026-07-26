'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

/**
 * RECONCILIAÇÃO — a verdade da operação inteira, SEM filtro de período/rede.
 *
 * Responde "os números fecham?": por rede, quantas publicações (linhas), quantos vídeos
 * distintos, quantas republicações (linha a mais da mesma ideia+rede), quantas sem post_id
 * (registro manual, ex.: Kwai), e a cobertura de cada métrica que só algumas redes entregam.
 *
 * Fonte única: pulso_content.metricas_publicacao (todas as linhas). É o painel de confiabilidade —
 * nenhuma recomendação vale se isto não fechar.
 */

// Redes que a API resolve sozinha vs. as que dependem da mão (Business Suite / sem API).
const METRICAS_COBERTURA = [
  { chave: 'reach', rotulo: 'alcance', redes: ['instagram', 'facebook'] },
  { chave: 'taxa_retencao', rotulo: 'retenção', redes: ['youtube', 'instagram', 'facebook'] },
  { chave: 'avg_watch_ms', rotulo: 'tempo médio', redes: ['youtube', 'instagram', 'facebook'] },
  { chave: 'retention_graph', rotulo: 'curva', redes: ['youtube', 'facebook'] },
  { chave: 'saves', rotulo: 'salvamentos', redes: ['instagram'] },
  { chave: 'taxa_conversao', rotulo: 'seguidor ganho', redes: ['facebook'] },
] as const

export interface RedeReconc {
  plataforma: string
  linhas: number // linhas na tabela (publicações registradas)
  videos: number // vídeos distintos (ideias)
  republicacoes: number // linhas a mais da mesma (ideia, plataforma)
  semPostId: number // registro sem id externo (manual — Kwai)
  // cobertura de cada métrica: quantos vídeos distintos têm o campo, do total de vídeos da rede
  cobertura: { rotulo: string; tem: number; suportada: boolean }[]
}

export interface ReconciliacaoSnapshot {
  totalLinhas: number // = o número do "painel" (419)
  totalPares: number // vídeo-rede únicos (linhas − republicações)
  totalRepublicacoes: number
  ideiasPublicadas: number // vídeos-base que têm ao menos 1 publicação
  ideiasTotais: number // todas as ideias no banco (a maioria nunca publicada)
  redes: RedeReconc[]
  ultimaColeta: string | null
}

const ORDEM = ['youtube', 'instagram', 'facebook', 'tiktok', 'kwai']

export function useReconciliacao() {
  return useQuery<ReconciliacaoSnapshot>({
    queryKey: ['reconciliacao'],
    refetchInterval: 10 * 60 * 1000,
    queryFn: async () => {
      const campos = ['ideia_id', 'plataforma', 'post_id', 'ultima_atualizacao', ...METRICAS_COBERTURA.map((m) => m.chave)]
      const [metQ, ideiasQ] = await Promise.all([
        supabase.schema('pulso_content').from('metricas_publicacao').select(campos.join(', ')),
        supabase.schema('pulso_content').from('ideias').select('id'),
      ])
      if (metQ.error) throw metQ.error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const linhas = (metQ.data || []) as any[]
      const ideiasTotais = (ideiasQ.data || []).length

      const porRede = new Map<string, {
        linhas: number
        videos: Set<string>
        vistos: Set<string> // (ideia|plataforma) já contado → o 2º+ é republicação
        republicacoes: number
        semPostId: number
        temMetrica: Map<string, Set<string>> // metrica → ideias distintas com valor
      }>()
      const ideiasPublicadas = new Set<string>()
      let ultimaColeta: string | null = null

      for (const m of linhas) {
        const p = m.plataforma as string
        if (!porRede.has(p)) {
          porRede.set(p, {
            linhas: 0, videos: new Set(), vistos: new Set(), republicacoes: 0, semPostId: 0,
            temMetrica: new Map(METRICAS_COBERTURA.map((mm) => [mm.chave, new Set<string>()])),
          })
        }
        const r = porRede.get(p)!
        r.linhas++
        if (m.ideia_id) {
          ideiasPublicadas.add(m.ideia_id)
          r.videos.add(m.ideia_id)
          const chave = `${m.ideia_id}|${p}`
          if (r.vistos.has(chave)) r.republicacoes++
          else r.vistos.add(chave)
        }
        if (!m.post_id || String(m.post_id) === 'null') r.semPostId++
        for (const mm of METRICAS_COBERTURA) {
          if (m[mm.chave] != null && m.ideia_id) r.temMetrica.get(mm.chave)!.add(m.ideia_id)
        }
        if (m.ultima_atualizacao && (!ultimaColeta || m.ultima_atualizacao > ultimaColeta)) {
          ultimaColeta = m.ultima_atualizacao
        }
      }

      const redes: RedeReconc[] = [...porRede.entries()]
        .map(([plataforma, r]) => ({
          plataforma,
          linhas: r.linhas,
          videos: r.videos.size,
          republicacoes: r.republicacoes,
          semPostId: r.semPostId,
          cobertura: METRICAS_COBERTURA.map((mm) => ({
            rotulo: mm.rotulo,
            tem: r.temMetrica.get(mm.chave)!.size,
            suportada: (mm.redes as readonly string[]).includes(plataforma),
          })),
        }))
        .sort((a, b) => ORDEM.indexOf(a.plataforma) - ORDEM.indexOf(b.plataforma))

      const totalLinhas = redes.reduce((s, r) => s + r.linhas, 0)
      const totalRepublicacoes = redes.reduce((s, r) => s + r.republicacoes, 0)

      return {
        totalLinhas,
        totalPares: totalLinhas - totalRepublicacoes,
        totalRepublicacoes,
        ideiasPublicadas: ideiasPublicadas.size,
        ideiasTotais,
        redes,
        ultimaColeta,
      }
    },
  })
}
