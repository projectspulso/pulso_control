import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'

export interface EstoquePipeline {
  prontos: number
  emProducao: number
  aprovadosSemProducao: number
  publicados: number
  agendados: number
  ritmoDiario: number // vídeos/dia exigidos pela grade ativa
  diasCobertura: number // prontos ÷ ritmo
  metaMinDias: number
  metaMaxDias: number
  situacao: 'CRITICO' | 'ABAIXO' | 'SAUDAVEL' | 'CHEIO'
}

const META_MIN_DIAS = 7
const META_MAX_DIAS = 20

export function useEstoquePipeline() {
  return useQuery<EstoquePipeline>({
    queryKey: ['estoque-pipeline'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const [{ data: pipeline, error: e1 }, { data: cfgRow, error: e2 }] = await Promise.all([
        supabase.schema('pulso_content').from('pipeline_producao').select('status, data_publicacao'),
        supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'desafio_100').maybeSingle(),
      ])
      if (e1) throw e1
      if (e2) throw e2

      const porStatus = (s: string) => (pipeline || []).filter((p) => p.status === s).length
      const prontos = porStatus('PRONTO_PUBLICACAO')
      const emProducao =
        porStatus('EM_PRODUCAO') + porStatus('EM_EDICAO') + porStatus('RENDERIZANDO') + porStatus('EM_REVISAO')
      const publicados = porStatus('PUBLICADO')
      const agendados = porStatus('AGENDADO')

      // Ritmo = a MESMA grade que o Desafio dos 100 Dias cobra (pulso_core.configuracoes).
      // Antes vinha de plano_publicacao, tabela que ninguém mais escreve: ela somava 1/intervalo
      // de cada plano ativo e devolvia 12/dia, zerando a cobertura e deixando o alarme sempre aceso.
      const cfg = (cfgRow?.valor as { publicacoes_dia_alvo?: number } | null) || {}
      const ritmo = Math.max(1, cfg.publicacoes_dia_alvo ?? 2)
      const diasCobertura = (prontos + agendados) / ritmo

      let situacao: EstoquePipeline['situacao'] = 'SAUDAVEL'
      if (diasCobertura < 3) situacao = 'CRITICO'
      else if (diasCobertura < META_MIN_DIAS) situacao = 'ABAIXO'
      else if (diasCobertura > META_MAX_DIAS) situacao = 'CHEIO'

      return {
        prontos,
        emProducao,
        aprovadosSemProducao: 0,
        publicados,
        agendados,
        ritmoDiario: Math.round(ritmo * 100) / 100,
        diasCobertura,
        metaMinDias: META_MIN_DIAS,
        metaMaxDias: META_MAX_DIAS,
        situacao,
      }
    },
  })
}
