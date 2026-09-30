import { useQuery } from '@tanstack/react-query'

import { carregarTemasMedidos } from '@/lib/decisor/temas-db'
import { supabase } from '@/lib/supabase/client'

/** O papel de cada tema (sorteia/neutro/morto) medido toda manhã — ver lib/decisor/temas.ts. */
export function useTemasMedidos() {
  return useQuery({
    queryKey: ['temas-medidos'],
    staleTime: 30 * 60 * 1000,
    queryFn: () => carregarTemasMedidos(supabase),
  })
}
