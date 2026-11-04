'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { montarControle, type Controle } from '@/lib/analytics/controle'

export function useControleVideos() {
  return useQuery<Controle>({
    queryKey: ['controle-videos'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const desde = new Date(Date.now() - 4 * 864e5).toISOString()
      const [met, pipe, ide, can, rod, cfg] = await Promise.all([
        supabase.schema('pulso_content').from('metricas_publicacao')
          .select('ideia_id, plataforma, post_id, url_publicacao, data_publicacao, views, likes, comentarios, shares, saves, reach, taxa_retencao, ultima_atualizacao'),
        supabase.schema('pulso_content').from('pipeline_producao')
          .select('ideia_id, status, data_publicacao_planejada, numero:metadata->>numero'),
        supabase.schema('pulso_content').from('ideias').select('id, titulo, canal_id, formato'),
        supabase.schema('pulso_core').from('canais').select('id, nome'),
        supabase.schema('pulso_content').from('logs_workflows').select('created_at, status, detalhes')
          .eq('workflow_name', 'COLETAR_METRICAS').gte('created_at', desde).order('created_at', { ascending: false }).limit(200),
        supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'linha_producao').maybeSingle(),
      ])
      for (const q of [met, pipe, ide, can, rod]) if (q.error) throw q.error
      let redesPausadas: string[] = []
      try { redesPausadas = JSON.parse(cfg.data?.valor || '{}').redes_pausadas || [] } catch { /* sem config = nenhuma pausada */ }
      return montarControle(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { metricas: met.data as any, pipeline: pipe.data as any, ideias: ide.data as any, canais: can.data || [], rodadas: rod.data as any, redesPausadas },
        Date.now(),
      )
    },
  })
}
