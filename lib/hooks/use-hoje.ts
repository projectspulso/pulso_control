'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

/**
 * Plano do dia do PULSO — junta agenda × estoque pronto × o que já saiu × saúde da esteira.
 * A rede recomendada por vídeo vem do useAprendizados (a página cruza pelo canalId).
 */

export interface ItemPronto {
  ideiaId: string
  numero: number | null
  titulo: string
  canalId: string | null
  canalNome: string
  videoUrl: string | null
  pipelineId: string
  caption: string | null
  notaHook: number | null
}

export interface PublicadoHoje {
  ideiaId: string
  numero: number | null
  titulo: string
  plataformas: string[]
  /** URL pública do vídeo (storage) — pra baixar e postar as redes manuais (FB/Kwai) do celular */
  videoUrl: string | null
}

export interface KwaiRepost {
  ideiaId: string
  numero: number | null
  titulo: string
  videoUrl: string | null
  caption: string | null
  /** quantos ainda faltam repostar no Kwai (incluindo este) */
  restantes: number
}

export interface FbPendente {
  ideiaId: string
  numero: number | null
  titulo: string
  videoUrl: string | null
  caption: string | null
  /** dias desde a estreia do vídeo nas outras redes */
  diasAtras: number
}

export interface Hoje {
  prontos: ItemPronto[]
  publicadosHoje: PublicadoHoje[]
  emRenderComCenas: number
  emRenderSemCenas: number
  aguardandoRoteiroOuAudio: number
  /** dias de estoque (prontos ÷ publicações/dia da grade, lida da config desafio_100) */
  estoqueDias: number
  /** publicações/dia da grade ativa (config desafio_100) */
  alvoDia: number
  /** repost matinal do Kwai (backfill de cobertura) — o próximo campeão que ainda não está lá */
  kwaiHoje: KwaiRepost | null
  /** vídeos já publicados que nunca foram ao Facebook (rede manual, Business Suite) */
  fbPendentes: FbPendente[]
}

const HOJE_ISO = () => new Date().toISOString().slice(0, 10)

export function useHoje() {
  return useQuery<Hoje>({
    queryKey: ['hoje'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const [ppRes, ideiasRes, canaisRes, metRes, rotRes, cfgRes, kwaiCfgRes, kwaiPubRes, todasPubRes] = await Promise.all([
        supabase.schema('pulso_content').from('pipeline_producao').select('id, ideia_id, status, metadata'),
        supabase.schema('pulso_content').from('ideias').select('id, titulo, canal_id'),
        supabase.schema('pulso_core').from('canais').select('id, nome'),
        supabase
          .schema('pulso_content')
          .from('metricas_publicacao')
          .select('ideia_id, plataforma, data_publicacao')
          .gte('data_publicacao', HOJE_ISO()),
        supabase.schema('pulso_content').from('roteiros').select('ideia_id, nota_hook'),
        supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'desafio_100').maybeSingle(),
        supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'kwai_backfill').maybeSingle(),
        supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id').eq('plataforma', 'kwai'),
        supabase
          .schema('pulso_content')
          .from('metricas_publicacao')
          .select('ideia_id, plataforma, data_publicacao'),
      ])
      // grade real (mesma fonte do burn-up e do estoque) — não hardcodar 3/dia
      const alvoDia = Math.max(1, (cfgRes.data?.valor as { publicacoes_dia_alvo?: number } | null)?.publicacoes_dia_alvo ?? 2)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ideiaMap = new Map<string, any>((ideiasRes.data || []).map((i: any) => [i.id, i]))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canalNome = new Map<string, string>((canaisRes.data || []).map((c: any) => [c.id, c.nome]))
      // nota_hook por ideia (a força do gancho segue do roteiro até a ordem de publicação)
      const notaHookMap = new Map<string, number>()
      for (const r of (rotRes.data || []) as { ideia_id: string; nota_hook: number | null }[]) {
        if (r.ideia_id && typeof r.nota_hook === 'number' && !notaHookMap.has(r.ideia_id)) notaHookMap.set(r.ideia_id, r.nota_hook)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pp = (ppRes.data || []) as any[]

      const prontos: ItemPronto[] = pp
        .filter((p) => p.status === 'PRONTO_PUBLICACAO' && p.metadata?.video_url)
        .map((p) => {
          const ideia = ideiaMap.get(p.ideia_id)
          return {
            ideiaId: p.ideia_id,
            numero: p.metadata?.numero ?? null,
            titulo: ideia?.titulo || '(sem título)',
            canalId: ideia?.canal_id ?? null,
            canalNome: (ideia?.canal_id && canalNome.get(ideia.canal_id)) || '—',
            videoUrl: p.metadata?.video_url ?? null,
            pipelineId: p.id,
            caption: p.metadata?.caption ?? null,
            notaHook: notaHookMap.get(p.ideia_id) ?? null,
          }
        })
        // gancho mais forte publica primeiro; empate mantém a ordem do número
        .sort((a, b) => (b.notaHook ?? 0) - (a.notaHook ?? 0) || (a.numero ?? 999) - (b.numero ?? 999))

      // já publicado hoje (agrupado por ideia)
      const porIdeia = new Map<string, Set<string>>()
      for (const m of metRes.data || []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mm = m as any
        if (!mm.ideia_id) continue
        if (!porIdeia.has(mm.ideia_id)) porIdeia.set(mm.ideia_id, new Set())
        porIdeia.get(mm.ideia_id)!.add(mm.plataforma)
      }
      const publicadosHoje: PublicadoHoje[] = [...porIdeia.entries()].map(([ideiaId, plats]) => {
        const ideia = ideiaMap.get(ideiaId)
        const p = pp.find((x) => x.ideia_id === ideiaId)
        return {
          ideiaId,
          numero: p?.metadata?.numero ?? null,
          titulo: ideia?.titulo || '(sem título)',
          plataformas: [...plats],
          videoUrl: p?.metadata?.video_url ?? null,
        }
      })

      // KWAI — repost matinal do próximo campeão que ainda não está lá. Avança sozinho: usa o
      // 1º da fila cuja ideia ainda não tem linha de Kwai (pular um dia não fura a sequência).
      let kwaiHoje: KwaiRepost | null = null
      try {
        const raw = kwaiCfgRes.data?.valor
        const cfg = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
        const fila: { ideia_id: string; numero: number | null; titulo: string; video_url: string | null; caption: string | null }[] =
          cfg?.fila || []
        const inicio: string = cfg?.inicio || '2026-07-21'
        if (fila.length && HOJE_ISO() >= inicio) {
          const jaNoKwai = new Set((kwaiPubRes.data || []).map((r: { ideia_id: string }) => r.ideia_id))
          const pendentes = fila.filter((x) => !jaNoKwai.has(x.ideia_id))
          const prox = pendentes[0]
          if (prox) {
            kwaiHoje = {
              ideiaId: prox.ideia_id,
              numero: prox.numero ?? null,
              titulo: prox.titulo,
              videoUrl: prox.video_url ?? null,
              caption: prox.caption ?? null,
              restantes: pendentes.length,
            }
          }
        }
      } catch { /* fila do Kwai é best-effort */ }

      // FACEBOOK — rede 100% manual (Business Suite). Aqui é DERIVADO, não fila fixa: qualquer
      // vídeo que estreou nas outras redes e nunca foi ao FB aparece sozinho, e some ao ser postado.
      // Janela de 30 dias porque repostar coisa muito antiga não vale o esforço.
      const fbPendentes: FbPendente[] = (() => {
        const pubs = (todasPubRes.data || []) as { ideia_id: string; plataforma: string; data_publicacao: string | null }[]
        const temFb = new Set(pubs.filter((m) => m.plataforma === 'facebook').map((m) => m.ideia_id))
        const estreia = new Map<string, string>()
        for (const m of pubs) {
          if (!m.ideia_id || !m.data_publicacao) continue
          const atual = estreia.get(m.ideia_id)
          if (!atual || m.data_publicacao < atual) estreia.set(m.ideia_id, m.data_publicacao)
        }
        const agora = Date.now()
        return [...estreia.entries()]
          .filter(([ideiaId]) => !temFb.has(ideiaId))
          .map(([ideiaId, quando]) => {
            const p = pp.find((x) => x.ideia_id === ideiaId)
            const dias = Math.floor((agora - new Date(quando).getTime()) / 86_400_000)
            return {
              ideiaId,
              numero: p?.metadata?.numero ?? null,
              titulo: ideiaMap.get(ideiaId)?.titulo || '(sem título)',
              videoUrl: p?.metadata?.video_url ?? null,
              caption: p?.metadata?.caption ?? null,
              diasAtras: dias,
            }
          })
          .filter((f) => f.videoUrl && f.diasAtras <= 30)
          .sort((a, b) => a.diasAtras - b.diasAtras)
      })()

      const emRenderComCenas = pp.filter((p) => p.status === 'EM_EDICAO' && p.metadata?.cenas).length
      const emRenderSemCenas = pp.filter((p) => p.status === 'EM_EDICAO' && !p.metadata?.cenas).length
      const aguardandoRoteiroOuAudio = pp.filter((p) =>
        ['AGUARDANDO_ROTEIRO', 'ROTEIRO_PRONTO', 'AUDIO_GERADO'].includes(p.status),
      ).length

      return {
        prontos,
        publicadosHoje,
        emRenderComCenas,
        emRenderSemCenas,
        aguardandoRoteiroOuAudio,
        estoqueDias: Math.round((prontos.length / alvoDia) * 10) / 10,
        alvoDia,
        kwaiHoje,
        fbPendentes,
      }
    },
  })
}
