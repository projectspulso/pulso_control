'use client'

import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'
import type { EscadaSerie, PontoSerie } from '@/lib/analytics/marcos'

/**
 * Monta TODA série cumulativa do PULSO que aguenta virar escada de marcos.
 *
 * O critério de entrada é um só: **o denominador não pode mudar no meio**. Auditado em 01/08/2026
 * contra o banco — `leituras_metricas` tem 45 dias corridos (18/06→01/08) sem um único buraco de
 * calendário, e views/likes/comentários/compartilhamentos são não-nulos em todas as 10.592 linhas
 * desde o primeiro dia. Essas passam. `reach` reprovou (cobertura pulou de 86 para 172 posts em
 * 24/07) e está em ESCADAS_REPROVADAS, impressa na tela com o motivo.
 *
 * O acumulado de cada dia é a soma da ÚLTIMA leitura conhecida de cada post até ali — não a soma
 * das leituras do dia, que daria o ganho diário. Efeito colateral bom: o dia em curso (hoje o Kwai
 * ainda não entrou e o IG está pela metade) não derruba a série, porque quem não foi lido hoje
 * mantém o valor de ontem.
 */

const REDES_SEGUIDOR = ['youtube', 'instagram', 'facebook', 'tiktok', 'kwai'] as const

export interface MarcosSnapshot {
  escadas: EscadaSerie[]
  reprovadas: Array<{ titulo: string; motivo: string }>
}

/** O que foi medido, tem série, e mesmo assim NÃO vira degrau. Aparece na tela — silêncio aqui
 *  viraria a impressão de que a métrica não existe, quando o problema é outro. */
const ESCADAS_REPROVADAS = [
  {
    titulo: 'Alcance (Instagram + Facebook)',
    motivo:
      'em 24/07 os posts que reportavam alcance saltaram de 86 para 172 e o acumulado foi de 22.559 para 131.970 no mesmo dia. O degrau seria da coleta, não do alcance.',
  },
  {
    titulo: 'Retenção média',
    motivo: 'é média, não acumulado — média não tem degrau. Está na aba Qualidade, que é onde ela decide.',
  },
]

type Leitura = {
  post_id: string | null
  plataforma: string
  data_ref: string
  views: number | null
  likes: number | null
  comentarios: number | null
  compartilhamentos: number | null
  view_time_ms: number | null
}

/** Acumulado diário = soma da última leitura conhecida de cada post. */
function acumular(leituras: Leitura[], campo: keyof Leitura, transformar?: (v: number) => number): PontoSerie[] {
  const porDia = new Map<string, Leitura[]>()
  for (const l of leituras) {
    const d = l.data_ref.slice(0, 10)
    if (!porDia.has(d)) porDia.set(d, [])
    porDia.get(d)!.push(l)
  }
  const ultima = new Map<string, number>()
  const out: PontoSerie[] = []
  for (const d of [...porDia.keys()].sort()) {
    for (const l of porDia.get(d)!) {
      const v = l[campo]
      if (typeof v === 'number') ultima.set(`${l.plataforma}|${l.post_id}`, v)
    }
    let soma = 0
    for (const v of ultima.values()) soma += v
    out.push({ data: d, valor: transformar ? transformar(soma) : soma })
  }
  return out
}

/** Acumulado por data de criação — para o funil de produção. */
function acumularPorData(datas: string[]): PontoSerie[] {
  const contagem = new Map<string, number>()
  for (const d of datas) if (d) contagem.set(d, (contagem.get(d) || 0) + 1)
  let acc = 0
  return [...contagem.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([data, n]) => ({ data, valor: (acc += n) }))
}

async function paginado<T>(consulta: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  let todas: T[] = []
  for (let de = 0; ; de += 1000) {
    const { data, error } = await consulta(de, de + 999)
    if (error) throw error
    const lote = data || []
    todas = todas.concat(lote)
    if (lote.length < 1000) return todas
  }
}

export function useMarcos() {
  return useQuery<MarcosSnapshot>({
    queryKey: ['marcos'],
    refetchInterval: 15 * 60 * 1000,
    queryFn: async () => {
      const [leituras, cfgQ, pubQ, ideiasQ, roteirosQ, audiosQ] = await Promise.all([
        paginado<Leitura>((de, ate) =>
          supabase
            .schema('pulso_analytics')
            .from('leituras_metricas')
            .select('post_id, plataforma, data_ref, views, likes, comentarios, compartilhamentos, view_time_ms')
            // Mesmo recorte da use-bi: o backfill de 19/06 carimbou o valor daquele dia sobre
            // 10–17/06 — não muda os marcos, mas falsifica o piso da série.
            .eq('estimado', false)
            .gte('data_ref', '2026-06-18')
            .order('data_ref')
            .range(de, ate)
        ),
        supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'seguidores_historico').maybeSingle(),
        supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id, data_publicacao'),
        supabase.schema('pulso_content').from('ideias').select('created_at'),
        supabase.schema('pulso_content').from('roteiros').select('created_at'),
        supabase.schema('pulso_content').from('audios').select('created_at'),
      ])

      // ── seguidores: contador diário do perfil, a única fonte honesta (nunca derivar de post) ──
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let raw: any = (cfgQ.data as any)?.valor ?? null
      if (typeof raw === 'string') { try { raw = JSON.parse(raw) } catch { raw = null } }
      const hist: Array<Record<string, unknown>> = Array.isArray(raw) ? raw : raw?.historico || []
      const num = (h: Record<string, unknown>, k: string) => (typeof h[k] === 'number' ? (h[k] as number) : 0)

      const serieSeguidores = hist
        .map((h) => ({ data: String(h.data), valor: REDES_SEGUIDOR.reduce((s, r) => s + num(h, r), 0) }))
        .filter((p) => p.valor > 0)
      const serieViewsCanal = hist
        .map((h) => ({ data: String(h.data), valor: num(h, 'views_canal') }))
        .filter((p) => p.valor > 0)

      // ── vídeos publicados: pela PRIMEIRA publicação, então republicar não duplica o degrau ──
      const pubs = (pubQ.data || []) as Array<{ ideia_id: string | null; data_publicacao: string | null }>
      const primeiraPub = new Map<string, string>()
      for (const p of pubs) {
        if (!p.ideia_id || !p.data_publicacao) continue
        const d = p.data_publicacao.slice(0, 10)
        const at = primeiraPub.get(p.ideia_id)
        if (!at || d < at) primeiraPub.set(p.ideia_id, d)
      }

      // O dia em que views/curtidas/horas estavam comprovadamente em zero: antes do primeiro vídeo
      // ir ao ar não havia o que contar. A coleta diária só começou em 18/06 e no dia seguinte
      // apareceram 34.697 views de uma vez — reais, acumuladas desde aqui, só não observadas.
      const primeiroVideo = [...primeiraPub.values()].sort()[0]

      const criadas = (q: { data: Array<{ created_at: string | null }> | null }) =>
        acumularPorData(((q.data || []) as Array<{ created_at: string | null }>).map((x) => (x.created_at || '').slice(0, 10)))

      const escadas: EscadaSerie[] = [
        // ══ ALCANCE ══
        {
          id: 'views', titulo: 'Views', unidade: 'views', grupo: 'alcance',
          passo: 100_000, passos: [50_000, 100_000, 250_000],
          nota: 'Soma das 5 redes, reconstruída da leitura diária por post desde 18/06 — 45 dias sem buraco.',
          serie: acumular(leituras, 'views'),
          inicioReal: primeiroVideo,
        },
        {
          id: 'horas', titulo: 'Horas assistidas', unidade: 'h', grupo: 'alcance',
          passo: 100, passos: [50, 100, 250],
          nota: 'Só Instagram e Facebook — YouTube, TikTok e Kwai não devolvem tempo total pela API. O número real é maior que este.',
          serie: acumular(leituras, 'view_time_ms', (ms) => Math.floor(ms / 3_600_000)),
          inicioReal: primeiroVideo,
        },
        {
          id: 'views_canal', titulo: 'Views do canal no YouTube', unidade: 'views', grupo: 'alcance',
          passo: 5_000, passos: [2_500, 5_000, 10_000],
          nota: 'Contador do próprio canal (inclui vídeo antigo e tráfego fora dos Shorts). Registro começa em 13/07, já em 28.630.',
          serie: serieViewsCanal,
        },
        // ══ AUDIÊNCIA ══
        {
          id: 'seguidores', titulo: 'Seguidores (5 redes)', unidade: 'seguidores', grupo: 'audiencia',
          passo: 100, passos: [50, 100, 250],
          nota: 'Contador do perfil, nunca derivado de métrica de post. Kwai entra por print; platô repetido costuma ser dia não medido.',
          serie: serieSeguidores,
        },
        ...REDES_SEGUIDOR.map((rede) => ({
          id: `seg_${rede}`,
          titulo: `Seguidores no ${rede === 'youtube' ? 'YouTube' : rede === 'tiktok' ? 'TikTok' : rede[0].toUpperCase() + rede.slice(1)}`,
          unidade: 'seguidores', grupo: 'audiencia' as const,
          passo: 50, passos: [25, 50, 100],
          nota: 'Contador do perfil desde 13/07.',
          serie: hist.map((h) => ({ data: String(h.data), valor: num(h, rede) })).filter((p) => p.valor > 0),
        })),
        // ══ ENGAJAMENTO ══
        {
          id: 'likes', titulo: 'Curtidas', unidade: 'curtidas', grupo: 'engajamento',
          passo: 1_000, passos: [500, 1_000, 2_500],
          nota: 'As 5 redes, coletado desde o primeiro dia da série.',
          serie: acumular(leituras, 'likes'),
          inicioReal: primeiroVideo,
        },
        {
          id: 'compartilhamentos', titulo: 'Compartilhamentos', unidade: 'shares', grupo: 'engajamento',
          passo: 50, passos: [25, 50, 100],
          nota: 'Facebook, Instagram, TikTok e Kwai — a API do YouTube não devolve compartilhamento, então o total é subestimado.',
          serie: acumular(leituras, 'compartilhamentos'),
          inicioReal: primeiroVideo,
        },
        {
          id: 'comentarios', titulo: 'Comentários', unidade: 'comentários', grupo: 'engajamento',
          passo: 10, passos: [5, 10, 25],
          nota: 'As 5 redes. Número pequeno é real, não falta de coleta: a maioria dos posts tem zero.',
          serie: acumular(leituras, 'comentarios'),
          inicioReal: primeiroVideo,
        },
        // ══ PRODUÇÃO (o que depende de nós, não do algoritmo) ══
        {
          id: 'publicados', titulo: 'Vídeos publicados', unidade: 'vídeos', grupo: 'producao',
          passo: 25, passos: [10, 25, 50],
          nota: 'Conta na data da primeira publicação — republicar em outra rede não cria degrau novo.',
          serie: acumularPorData([...primeiraPub.values()]),
        },
        {
          id: 'ideias', titulo: 'Ideias criadas', unidade: 'ideias', grupo: 'producao',
          passo: 50, passos: [25, 50, 100],
          nota: 'Topo do funil, por data de criação — inclui as descartadas.',
          serie: criadas(ideiasQ),
        },
        {
          id: 'roteiros', titulo: 'Roteiros escritos', unidade: 'roteiros', grupo: 'producao',
          passo: 25, passos: [10, 25, 50],
          nota: 'Por data de criação.',
          serie: criadas(roteirosQ),
        },
        {
          id: 'audios', titulo: 'Áudios gerados', unidade: 'áudios', grupo: 'producao',
          passo: 25, passos: [10, 25, 50],
          nota: 'Por data de criação. Voz oficial do PULSO no ElevenLabs.',
          serie: criadas(audiosQ),
        },
      ]

      return { escadas: escadas.filter((e) => e.serie.length > 0), reprovadas: ESCADAS_REPROVADAS }
    },
  })
}
