import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'

export interface BiFiltros {
  plataforma: string // 'todas' | youtube | instagram | facebook | tiktok
  canalId: string // 'todos' | uuid
  periodoDias: number // 0 = desde o início
}

export interface BiPublicacao {
  id: string
  ideia_id: string | null
  ideiaTitulo: string
  canalId: string
  canalNome: string
  plataforma: string
  url: string | null
  dataPublicacao: string
  views: number
  likes: number
  comentarios: number
  shares: number
  saves: number
}

export interface BiSerieDia {
  data: string
  views: number
  likes: number
}

export interface BiSnapshot {
  publicacoes: BiPublicacao[]
  serieDiaria: BiSerieDia[] // ganho por dia (delta hoje−ontem)
  serieCumulativa: BiSerieDia[] // crescimento total acumulado por dia
  canais: { id: string; nome: string }[]
  videosProduzidos: number
  ultimaColeta: string | null // hora da última coleta (ultima_atualizacao mais recente)
}

export function useBi(filtros: BiFiltros) {
  return useQuery<BiSnapshot>({
    queryKey: ['bi', filtros],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const [metricasQ, ideiasQ, canaisQ, diariasQ] = await Promise.all([
        supabase.schema('pulso_content').from('metricas_publicacao').select('*'),
        supabase.schema('pulso_content').from('ideias').select('id, titulo, canal_id'),
        supabase.schema('pulso_core').from('canais').select('id, nome').order('nome'),
        supabase
          .schema('pulso_analytics')
          .from('leituras_metricas')
          .select('ideia_id, plataforma, data_ref, views, likes')
          .gte('data_ref', '2026-06-10'), // série limpa: 1 leitura por post por dia (sem FK)
      ])
      if (metricasQ.error) throw metricasQ.error
      if (ideiasQ.error) throw ideiasQ.error
      if (canaisQ.error) throw canaisQ.error
      if (diariasQ.error) throw diariasQ.error

      const ideias = new Map((ideiasQ.data || []).map((i) => [i.id, i]))
      const canais = new Map((canaisQ.data || []).map((c) => [c.id, c.nome]))
      const limite = filtros.periodoDias > 0 ? Date.now() - filtros.periodoDias * 864e5 : 0

      const publicacoes: BiPublicacao[] = []
      let ultimaColeta: string | null = null
      for (const m of metricasQ.data || []) {
        const ideia = m.ideia_id ? ideias.get(m.ideia_id) : null
        if (!ideia) continue
        if (filtros.plataforma !== 'todas' && m.plataforma !== filtros.plataforma) continue
        if (filtros.canalId !== 'todos' && ideia.canal_id !== filtros.canalId) continue
        if (limite && new Date(m.data_publicacao).getTime() < limite) continue
        // hora real da coleta (mesma fonte/campo das outras telas → número consistente)
        const col = m.ultima_atualizacao
        if (col && (!ultimaColeta || col > ultimaColeta)) ultimaColeta = col
        publicacoes.push({
          id: m.id,
          ideia_id: m.ideia_id,
          ideiaTitulo: ideia.titulo,
          canalId: ideia.canal_id,
          canalNome: canais.get(ideia.canal_id) || '—',
          plataforma: m.plataforma,
          url: m.url_publicacao,
          dataPublicacao: m.data_publicacao,
          views: m.views || 0,
          likes: m.likes || 0,
          comentarios: m.comentarios || 0,
          shares: m.shares || 0,
          saves: m.saves || 0,
        })
      }

      // ── séries: snapshot CUMULATIVO por post (ideia_id+plataforma) com CARRY-FORWARD ──
      // metricas_diarias guarda, por linha, o total de views de UM post naquele dia. A cobertura
      // é incompleta (nem todo post tem linha todo dia), então somar cru gera serrote e subconta.
      // Carry-forward: cada post mantém seu último valor conhecido até aparecer snapshot novo.
      const porPost = new Map<string, Map<string, { views: number; likes: number }>>()
      const diasSet = new Set<string>()
      for (const d of diariasQ.data || []) {
        if (filtros.plataforma !== 'todas' && d.plataforma !== filtros.plataforma) continue
        if (filtros.canalId !== 'todos') {
          const ideia = d.ideia_id ? ideias.get(d.ideia_id) : null
          if (!ideia || ideia.canal_id !== filtros.canalId) continue
        }
        const key = `${d.ideia_id}|${d.plataforma}`
        if (!porPost.has(key)) porPost.set(key, new Map())
        porPost.get(key)!.set(d.data_ref, { views: d.views || 0, likes: d.likes || 0 })
        diasSet.add(d.data_ref)
      }
      const diasOrd = [...diasSet].sort()
      const cumul: BiSerieDia[] = []
      const ultimo = new Map<string, { views: number; likes: number }>()
      for (const dia of diasOrd) {
        for (const [key, serie] of porPost) {
          const v = serie.get(dia)
          if (v) ultimo.set(key, v) // só atualiza quem tem snapshot novo nesse dia
        }
        let views = 0
        let likes = 0
        for (const v of ultimo.values()) {
          views += v.views
          likes += v.likes
        }
        cumul.push({ data: dia, views, likes })
      }
      // acumulado NÃO pode cair (snapshot ruidoso às vezes vem menor) — força monotônico
      for (let i = 1; i < cumul.length; i++) {
        if (cumul[i].views < cumul[i - 1].views) cumul[i] = { ...cumul[i], views: cumul[i - 1].views }
        if (cumul[i].likes < cumul[i - 1].likes) cumul[i] = { ...cumul[i], likes: cumul[i - 1].likes }
      }
      // ÂNCORA: o total de HOJE = fonte de verdade (metricas_publicacao, mesma do resumo do topo),
      // pra a curva FECHAR com o número grande (a coleta diária pode estar incompleta/atrasada).
      const totalRealV = publicacoes.reduce((a, p) => a + p.views, 0)
      const totalRealL = publicacoes.reduce((a, p) => a + p.likes, 0)
      if (cumul.length) {
        cumul[cumul.length - 1] = { data: cumul[cumul.length - 1].data, views: totalRealV, likes: totalRealL }
      } else {
        cumul.push({ data: new Date().toISOString().slice(0, 10), views: totalRealV, likes: totalRealL })
      }

      // crescimento total acumulado (curva monotônica que fecha no total real)
      const serieCumulativa = cumul.slice(-14)
      // ganho do dia = hoje − ontem (delta da curva acumulada)
      let prevV = 0
      let prevL = 0
      const serieDiaria = cumul
        .map((d) => {
          const ganhoViews = Math.max(0, d.views - prevV) // max(0) evita negativo se um post sumir
          const ganhoLikes = Math.max(0, d.likes - prevL)
          prevV = d.views
          prevL = d.likes
          return { data: d.data, views: ganhoViews, likes: ganhoLikes }
        })
        .slice(-14)

      const videosProduzidos = new Set(publicacoes.map((p) => p.ideia_id)).size

      return {
        publicacoes: publicacoes.sort((a, b) => b.views - a.views),
        serieDiaria,
        serieCumulativa,
        canais: canaisQ.data || [],
        videosProduzidos,
        ultimaColeta,
      }
    },
  })
}
