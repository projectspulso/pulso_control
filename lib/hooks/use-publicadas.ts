import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'

/**
 * IDEIAS JÁ PUBLICADAS — o conjunto de ideia_ids que já foram ao ar em alguma rede
 * (têm linha em metricas_publicacao). Serve pra "desentulhar" os módulos: Ideias, Roteiros
 * e Áudios escondem por padrão o que já foi postado, com um botão pra revelar.
 *
 * Filtrar > apagar: as ideias/roteiros/áudios ficam no banco (mantêm as ligações e evitam
 * duplicidade); a lista só deixa de mostrar o que já rodou seu ciclo.
 */
export function usePublicadas() {
  return useQuery<Set<string>>({
    queryKey: ['ideias-publicadas'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('pulso_content')
        .from('metricas_publicacao')
        .select('ideia_id')
      if (error) throw error
      const set = new Set<string>()
      for (const r of data || []) if (r.ideia_id) set.add(r.ideia_id as string)
      return set
    },
  })
}
