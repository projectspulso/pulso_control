import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'
import { withPulsoCodigo } from '@/lib/pulso-codigo'

/**
 * KIT DE PUBLICAÇÃO MANUAL — tudo que o dono precisa pra subir um PRONTO à mão
 * (YouTube/Facebook) sem depender de ninguém: título curto, legenda, arquivo e o
 * passo a passo por rede. Vale até travarmos tudo via API.
 */

export interface KitVideo {
  ideiaId: string
  numero: number | null
  tituloCurto: string // título enxuto pro YouTube
  legenda: string
  videoUrl: string | null
  arquivoOneDrive: string
}

// título de YouTube enxuto a partir da legenda (1ª frase, capado, + #shorts)
function tituloCurto(caption: string, fallback: string): string {
  const linha = (caption || '').split('\n')[0].trim() || fallback
  let t = linha
  if (t.length > 70) {
    const corte = t.slice(0, 70)
    const fim = Math.max(corte.lastIndexOf('. '), corte.lastIndexOf('! '), corte.lastIndexOf('? '))
    t = (fim > 30 ? corte.slice(0, fim + 1) : corte).trim()
  }
  if (!/#shorts/i.test(t)) t = `${t} #shorts`
  return t
}

export function useKitPublicacao() {
  return useQuery<KitVideo[]>({
    queryKey: ['kit-publicacao'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const [pipeQ, ideiasQ] = await Promise.all([
        supabase.schema('pulso_content').from('pipeline_producao').select('ideia_id, status, metadata').eq('status', 'PRONTO_PUBLICACAO'),
        supabase.schema('pulso_content').from('ideias').select('id, titulo'),
      ])
      if (pipeQ.error) throw pipeQ.error
      const tit = new Map((ideiasQ.data || []).map((i) => [i.id, i.titulo as string]))
      return (pipeQ.data || []).map((p) => {
        const md = p.metadata || {}
        const numero = (md.numero as number) ?? null
        // #pulsoNNN discreto no fim da legenda — código de ligação entre redes. Idempotente.
        const legenda = withPulsoCodigo((md.caption as string) || '', numero)
        const url = (md.video_url as string) || null
        const slug = url ? (url.split('/').pop() || '').replace(/\.mp4$/, '') : ''
        return {
          ideiaId: p.ideia_id,
          numero,
          tituloCurto: tituloCurto(legenda, tit.get(p.ideia_id) || 'PULSO'),
          legenda,
          videoUrl: url,
          arquivoOneDrive: numero != null && slug ? `…/pulso/videos/video_${String(numero).padStart(3, '0')}_${slug.replace(/_\d+$/, '')}/FINAL_${slug.replace(/_\d+$/, '')}.mp4` : '—',
        }
      }).sort((a, b) => (a.numero ?? 999) - (b.numero ?? 999))
    },
  })
}
