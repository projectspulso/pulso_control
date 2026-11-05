'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useControleVideos, useGanhoDiario } from '@/lib/hooks/use-controle-videos'
import { montarKit, type KitDados, type LeituraSeguidores } from '@/lib/analytics/kit'

export interface EnvioKit {
  id: string
  token: string
  destinatario: string
  nota: string
  medido_em: string
  criado_em: string
  expira_em: string
  revogado_em: string | null
  acessos: number
  ultimo_acesso: string | null
}

function useConfigKit() {
  return useQuery({
    queryKey: ['kit-config'],
    queryFn: async () => {
      const { data, error } = await supabase.schema('pulso_core').from('configuracoes')
        .select('chave, valor').in('chave', ['seguidores_historico', 'publico_redes'])
      if (error) throw error
      const ler = (chave: string) => {
        try { return JSON.parse(data?.find((c) => c.chave === chave)?.valor || 'null') } catch { return null }
      }
      return {
        seguidores: (ler('seguidores_historico')?.historico || []) as LeituraSeguidores[],
        publico: ler('publico_redes') as Record<string, unknown> | null,
      }
    },
  })
}

/** Os números vivos; `montar(agora)` devolve o kit. Congelar é gravar esse objeto num envio. */
export function useKitAoVivo() {
  const controle = useControleVideos()
  const ganho = useGanhoDiario()
  const config = useConfigKit()
  const erro = controle.error || ganho.error || config.error
  const pronto = Boolean(controle.data && ganho.data && config.data)
  const montar = (agora: number): KitDados | null =>
    controle.data && ganho.data && config.data
      ? montarKit({ controle: controle.data, ganhos: ganho.data.ganhos, seguidores: config.data.seguidores, publico: config.data.publico }, agora)
      : null
  return { montar, pronto, isLoading: !pronto && !erro, error: erro }
}

export function useEnviosKit() {
  return useQuery<EnvioKit[]>({
    queryKey: ['kit-envios'],
    queryFn: async () => {
      const { data, error } = await supabase.schema('pulso_analytics').from('kit_midia_envios')
        .select('id, token, destinatario, nota, medido_em, criado_em, expira_em, revogado_em, acessos, ultimo_acesso')
        .order('criado_em', { ascending: false })
      if (error) throw error
      return (data || []) as EnvioKit[]
    },
  })
}
