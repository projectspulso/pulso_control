'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { BiFiltros } from '@/lib/hooks/use-bi'

/**
 * A NOTA PREVÊ VIRAL? — cruza a nota_hook do roteiro (1-5) com as views reais.
 * Responde à pergunta do dono: "às vezes a nota não serve pra nada, mas viraliza
 * o que não tem nota boa". Pega alcance total por ideia (soma das redes), agrupa
 * por nota, calcula a correlação (Pearson) e destaca as surpresas dos dois lados:
 *  - viralizou com nota baixa (a nota não pegou o que funcionou)
 *  - nota alta e floppou (a nota superestimou)
 */

export interface PontoNota {
  ideiaId: string
  numero: number | null
  titulo: string
  canal: string
  notaHook: number
  views: number
}

export interface MediaPorNota {
  nota: number
  mediaViews: number
  medianaViews: number
  n: number
}

export interface NotaVsViews {
  pontos: PontoNota[]
  porNota: MediaPorNota[]
  correlacao: number | null
  /** amostra usada (ideias publicadas, com nota e com views) */
  amostra: number
  /** viralizou apesar da nota baixa (nota ≤3 no quartil de cima de views) */
  surpresas: PontoNota[]
  /** nota alta (5) mas ficou no quartil de baixo de views */
  decepcoes: PontoNota[]
  /** leitura pronta pro humano */
  veredito: string
}

function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length
  if (n < 4) return null
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx
    const b = ys[i] - my
    num += a * b
    dx += a * a
    dy += b * b
  }
  if (dx === 0 || dy === 0) return null
  return num / Math.sqrt(dx * dy)
}

function mediana(v: number[]): number {
  if (!v.length) return 0
  const s = [...v].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
}

function quantil(v: number[], q: number): number {
  if (!v.length) return 0
  const s = [...v].sort((a, b) => a - b)
  const pos = (s.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  return s[base + 1] !== undefined ? Math.round(s[base] + rest * (s[base + 1] - s[base])) : s[base]
}

export function useNotaVsViews(filtros?: BiFiltros) {
  const f = filtros ?? { plataforma: 'todas', canalId: 'todos', periodoDias: 0 }
  return useQuery<NotaVsViews>({
    queryKey: ['nota-vs-views', f.plataforma, f.canalId, f.periodoDias],
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const [rotRes, ideiasRes, canaisRes, metRes, pipeRes] = await Promise.all([
        supabase.schema('pulso_content').from('roteiros').select('ideia_id, nota_hook'),
        supabase.schema('pulso_content').from('ideias').select('id, titulo, canal_id'),
        supabase.schema('pulso_core').from('canais').select('id, nome'),
        (() => {
          // o alcance segue o filtro: "a nota prevê o viral NO YOUTUBE?" é outra pergunta —
          // e a resposta muda mesmo (a correlação global esconde a de cada rede)
          let q = supabase.schema('pulso_content').from('metricas_publicacao')
            .select('ideia_id, views, plataforma, data_publicacao')
          if (f.plataforma !== 'todas') q = q.eq('plataforma', f.plataforma)
          if (f.periodoDias > 0) q = q.gte('data_publicacao', new Date(Date.now() - f.periodoDias * 864e5).toISOString())
          return q
        })(),
        supabase.schema('pulso_content').from('pipeline_producao').select('ideia_id, metadata'),
      ])

      // nota_hook por ideia
      const notaDe = new Map<string, number>()
      for (const r of (rotRes.data || []) as { ideia_id: string; nota_hook: number | null }[]) {
        if (r.ideia_id && typeof r.nota_hook === 'number' && !notaDe.has(r.ideia_id)) notaDe.set(r.ideia_id, r.nota_hook)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ideiaMap = new Map<string, any>((ideiasRes.data || []).map((i: any) => [i.id, i]))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canalNome = new Map<string, string>((canaisRes.data || []).map((c: any) => [c.id, (c.nome || '').replace(/^PULSO\s*/i, '')]))
      const numeroDe = new Map<string, number>()
      for (const p of (pipeRes.data || []) as { ideia_id: string; metadata: { numero?: number } }[]) {
        if (p.ideia_id && p.metadata?.numero != null && !numeroDe.has(p.ideia_id)) numeroDe.set(p.ideia_id, p.metadata.numero)
      }

      // alcance total por ideia (soma das redes — o "quanto pegou" agregado)
      const viewsDe = new Map<string, number>()
      for (const m of (metRes.data || []) as { ideia_id: string; views: number | null }[]) {
        if (!m.ideia_id) continue
        viewsDe.set(m.ideia_id, (viewsDe.get(m.ideia_id) || 0) + (m.views || 0))
      }

      const pontos: PontoNota[] = []
      for (const [ideiaId, views] of viewsDe) {
        const nota = notaDe.get(ideiaId)
        if (nota == null || views <= 0) continue // só publicados com nota e com views reais
        const ideia = ideiaMap.get(ideiaId)
        if (f.canalId !== 'todos' && ideia?.canal_id !== f.canalId) continue
        pontos.push({
          ideiaId,
          numero: numeroDe.get(ideiaId) ?? null,
          titulo: ideia?.titulo || '(sem título)',
          canal: (ideia?.canal_id && canalNome.get(ideia.canal_id)) || '—',
          notaHook: nota,
          views,
        })
      }
      pontos.sort((a, b) => b.views - a.views)

      // média/mediana por nota
      const buckets = new Map<number, number[]>()
      for (const p of pontos) {
        if (!buckets.has(p.notaHook)) buckets.set(p.notaHook, [])
        buckets.get(p.notaHook)!.push(p.views)
      }
      const porNota: MediaPorNota[] = [...buckets.entries()]
        .map(([nota, vs]) => ({
          nota,
          mediaViews: Math.round(vs.reduce((a, b) => a + b, 0) / vs.length),
          medianaViews: mediana(vs),
          n: vs.length,
        }))
        .sort((a, b) => a.nota - b.nota)

      const correlacao = pearson(pontos.map((p) => p.notaHook), pontos.map((p) => p.views))

      // surpresas: quartil de cima de views, mas nota ≤3 | decepções: nota 5 no quartil de baixo
      const todasViews = pontos.map((p) => p.views)
      const q75 = quantil(todasViews, 0.75)
      const q25 = quantil(todasViews, 0.25)
      const surpresas = pontos.filter((p) => p.notaHook <= 3 && p.views >= q75).slice(0, 6)
      const decepcoes = pontos.filter((p) => p.notaHook >= 5 && p.views <= q25).sort((a, b) => a.views - b.views).slice(0, 6)

      let veredito: string
      if (correlacao == null) {
        veredito = 'Amostra ainda pequena — poucas ideias publicadas com nota e views pra medir a correlação. Continua coletando.'
      } else if (correlacao >= 0.4) {
        veredito = `A nota está prevendo bem: correlação ${correlacao.toFixed(2)} (nota mais alta → mais views, em geral). Vale seguir priorizando por nota.`
      } else if (correlacao >= 0.15) {
        veredito = `A nota ajuda um pouco (correlação ${correlacao.toFixed(2)}), mas há muita surpresa — nota não é destino. Olhe também as surpresas abaixo.`
      } else if (correlacao > -0.15) {
        veredito = `A nota quase não prevê views (correlação ${correlacao.toFixed(2)}). Hoje o gancho pontuado não explica o que viraliza — o critério precisa evoluir com esses dados.`
      } else {
        veredito = `Sinal invertido (correlação ${correlacao.toFixed(2)}): o que a nota acha bom está performando PIOR. O critério de nota está desalinhado com o público.`
      }

      return { pontos, porNota, correlacao, amostra: pontos.length, surpresas, decepcoes, veredito }
    },
  })
}
