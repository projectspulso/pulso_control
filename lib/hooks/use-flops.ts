'use client'

import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'
import { levantarFlops, type Flop, type ResumoFlops } from '@/lib/analytics/flops'
import { classificarTema, PAPEL_NO_FACEBOOK, type Tema } from '@/lib/decisor/temas'

const REDES = ['youtube', 'instagram', 'facebook', 'tiktok', 'kwai'] as const

export interface FlopComContexto extends Flop {
  numero: number | null
  titulo: string
  tema: Tema
  papelNoFacebook: 'sorteia' | 'neutro' | 'morto'
  videoUrl: string | null
}

export interface FlopsSnapshot extends Omit<ResumoFlops, 'flops'> {
  flops: FlopComContexto[]
  /** o dia 100 do desafio — o dono decidiu que a fila de recuperação só roda depois dele */
  liberaEm: string | null
  diasAteLiberar: number | null
}

export function useFlops() {
  return useQuery<FlopsSnapshot>({
    queryKey: ['flops'],
    refetchInterval: 10 * 60 * 1000,
    queryFn: async () => {
      const [mpQ, ideiasQ, rotQ, pipeQ, cfgQ] = await Promise.all([
        supabase.schema('pulso_content').from('metricas_publicacao')
          .select('ideia_id, plataforma, views, reach, metadata, data_publicacao'),
        supabase.schema('pulso_content').from('ideias').select('id, titulo'),
        supabase.schema('pulso_content').from('roteiros').select('ideia_id, conteudo_md'),
        supabase.schema('pulso_content').from('pipeline_producao').select('ideia_id, metadata'),
        supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'desafio_100').maybeSingle(),
      ])
      if (mpQ.error) throw mpQ.error

      const titulos = new Map((ideiasQ.data || []).map((i) => [i.id, i.titulo as string]))
      const corpos = new Map<string, string>()
      for (const r of (rotQ.data || []) as Array<{ ideia_id: string; conteudo_md: string | null }>) {
        if (r.ideia_id && r.conteudo_md && !corpos.has(r.ideia_id)) corpos.set(r.ideia_id, r.conteudo_md)
      }
      const numeros = new Map<string, number>()
      const videoUrls = new Map<string, string>()
      for (const p of (pipeQ.data || []) as Array<{ ideia_id: string | null; metadata: Record<string, unknown> | null }>) {
        if (!p.ideia_id) continue
        const md = p.metadata || {}
        if (typeof md.numero === 'number') numeros.set(p.ideia_id, md.numero)
        if (typeof md.video_url === 'string') videoUrls.set(p.ideia_id, md.video_url)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pubs = ((mpQ.data || []) as any[]).map((m) => ({
        ideiaId: m.ideia_id as string,
        plataforma: m.plataforma as string,
        views: (m.views as number) || 0,
        reach: (m.reach as number) ?? null,
        metodo: ((m.metadata || {}).metodo as string) ?? null,
        dataPublicacao: (m.data_publicacao as string) ?? null,
      }))

      const base = levantarFlops(pubs, REDES, Date.now())

      const flops: FlopComContexto[] = base.flops.map((f) => {
        const titulo = titulos.get(f.ideiaId) || '(sem título)'
        const tema = classificarTema(titulo, corpos.get(f.ideiaId))
        return {
          ...f,
          numero: numeros.get(f.ideiaId) ?? null,
          titulo,
          tema,
          papelNoFacebook: PAPEL_NO_FACEBOOK[tema],
          videoUrl: videoUrls.get(f.ideiaId) ?? null,
        }
      })

      // ── quando a fila de recuperação abre ──
      // Decisão do dono em 04/08: não republicar durante o Desafio dos 100 Dias. O motivo é bom —
      // com o desafio rodando, um repost concorre com a grade do dia e suja a leitura de qual
      // vídeo rendeu o quê. Depois do dia 100 esses vídeos saem como conteúdo novo, porque para
      // a audiência eles são: os "não entregues" tiveram alcance de 0 a 2 pessoas.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cfg: any = (cfgQ.data as any)?.valor ?? null
      if (typeof cfg === 'string') { try { cfg = JSON.parse(cfg) } catch { cfg = null } }
      let liberaEm: string | null = null
      let diasAteLiberar: number | null = null
      if (cfg?.inicio) {
        const metaDias = cfg.meta_dias || cfg.metaDias || 100
        const fim = new Date(new Date(`${cfg.inicio}T12:00:00Z`).getTime() + (metaDias - 1) * 86_400_000)
        liberaEm = fim.toISOString().slice(0, 10)
        diasAteLiberar = Math.ceil((fim.getTime() - Date.now()) / 86_400_000)
      }

      return { ...base, flops, liberaEm, diasAteLiberar }
    },
  })
}
