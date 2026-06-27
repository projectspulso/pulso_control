import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'

/**
 * AUDIT DE COERÊNCIA — a rede de segurança "pra não nos perdermos".
 * Roda invariantes entre pipeline / publicações e devolve flags. Verde = ok,
 * vermelho = incoerência que precisa de ação. Mesma lógica do audit manual.
 */

export interface AuditCheck {
  id: string
  label: string
  ok: boolean
  count: number
  detalhe: string[] // exemplos (títulos) quando há problema
}

const ALL_REDES = ['instagram', 'youtube', 'tiktok', 'facebook']

export function useAudit() {
  return useQuery<{ checks: AuditCheck[]; saude: number }>({
    queryKey: ['audit-coerencia'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const [pipeQ, ideiasQ, mpQ] = await Promise.all([
        supabase.schema('pulso_content').from('pipeline_producao').select('id, ideia_id, status, metadata'),
        supabase.schema('pulso_content').from('ideias').select('id, titulo, canal_id'),
        supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id, plataforma, post_id'),
      ])
      if (pipeQ.error) throw pipeQ.error
      const pipe = pipeQ.data || []
      const tit = new Map((ideiasQ.data || []).map((i) => [i.id, i.titulo as string]))
      const canal = new Map((ideiasQ.data || []).map((i) => [i.id, i.canal_id as string | null]))
      const mp = mpQ.data || []

      const t = (id: string | null) => (id ? tit.get(id) || '?' : '?')

      // redes por ideia
      const redes = new Map<string, Set<string>>()
      for (const r of mp) {
        if (!r.ideia_id) continue
        if (!redes.has(r.ideia_id)) redes.set(r.ideia_id, new Set())
        redes.get(r.ideia_id)!.add(r.plataforma)
      }

      const checks: AuditCheck[] = []
      const add = (id: string, label: string, ruins: string[]) =>
        checks.push({ id, label, ok: ruins.length === 0, count: ruins.length, detalhe: ruins.slice(0, 6) })

      // 1) PRONTO sem video_url
      add('pronto_sem_video', 'PRONTO sem vídeo',
        pipe.filter((p) => p.status === 'PRONTO_PUBLICACAO' && !p.metadata?.video_url).map((p) => t(p.ideia_id)))
      // 2) AUDIO_GERADO sem cenas (worker travaria)
      add('audio_sem_cenas', 'Áudio gerado sem cenas (trava o worker)',
        pipe.filter((p) => p.status === 'AUDIO_GERADO' && !p.metadata?.cenas).map((p) => t(p.ideia_id)))
      // 3) card (não publicado) sem canal
      add('card_sem_canal', 'Card sem canal',
        pipe.filter((p) => p.status !== 'PUBLICADO' && !canal.get(p.ideia_id || '')).map((p) => t(p.ideia_id)))
      // 4) PUBLICADO sem as 4 redes
      add('pub_sem_4redes', 'Publicado sem as 4 redes',
        pipe.filter((p) => p.status === 'PUBLICADO').filter((p) => {
          const r = redes.get(p.ideia_id || '') || new Set()
          return ALL_REDES.some((x) => !r.has(x))
        }).map((p) => {
          const r = redes.get(p.ideia_id || '') || new Set()
          return `${t(p.ideia_id)} (falta ${ALL_REDES.filter((x) => !r.has(x)).join('/')})`
        }))
      // 5) métricas órfãs (sem ideia)
      add('metricas_orfas', 'Métricas órfãs (sem ideia)',
        mp.filter((r) => !r.ideia_id).map(() => 'linha sem ideia_id'))
      // 6) post_id duplicado na mesma rede
      const seen = new Map<string, number>()
      for (const r of mp) if (r.post_id) { const k = `${r.plataforma}|${r.post_id}`; seen.set(k, (seen.get(k) || 0) + 1) }
      add('post_dup', 'post_id duplicado na mesma rede',
        [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k))

      const okCount = checks.filter((c) => c.ok).length
      const saude = Math.round((okCount / checks.length) * 100)
      return { checks, saude }
    },
  })
}
