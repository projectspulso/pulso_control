'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { dedupePublicacoes } from '@/lib/analytics/dedupe'
import { classificarTema, type Tema } from '@/lib/decisor/temas'

/**
 * A FICHA COMPLETA de um vídeo, da ideia à publicação — a rota /video/[id].
 *
 * Antes, a vida de um vídeo estava espalhada por quatro telas: a ideia em /ideias/[id], o roteiro
 * em /roteiros/[id], o áudio em /audios, e o desempenho aqui. Ninguém conseguia responder "o que
 * aconteceu com o 118?" sem abrir tudo. Agora é uma consulta só e uma tela só, e todo o resto do
 * app (kanban, agenda, aderência, assets, decisor) aponta pra cá.
 *
 * O que ESTA tela não faz é editar: /ideias/[id] e /roteiros/[id] continuam sendo os editores, e a
 * ficha linka pra eles. Ler e escrever são atos diferentes; fundir os dois seria reescrever 1.500
 * linhas de formulário que hoje seguram a linha de produção, para ganhar zero em leitura.
 *
 * Marca "indisponível" o que a API da rede não entrega (retenção em TikTok/Kwai, alcance fora de
 * IG/FB) — nunca finge zero.
 */

/** Uma cena do b-roll, com a fonte de onde ela veio (banco, acervo grátis, Wan, Veo). */
export interface CenaDoVideo {
  nome: string
  prompt: string
}

export interface EtapaFunil {
  /** existe? quando? */
  em: string | null
  detalhe: string | null
}

export interface RedeDoVideo {
  plataforma: string
  /** só Instagram: o painel do IG exibe views(IG) + facebook_views(crosspost) num número só.
   *  Guardado pra tela explicar a diferença — ver memória instagram-total-views-crosspost. */
  igTotalViews?: number | null
  igFacebookViews?: number | null
  url: string | null
  views: number
  reach: number | null
  likes: number
  comentarios: number
  shares: number
  saves: number
  taxaRetencao: number | null
  seguidores: number | null
  percentil: number | null // posição da retenção dentro da rede (0..100), null = sem base
  dataPublicacao: string | null
}

export interface PontoSerie {
  data: string
  views: number
}

/** Conferência de fatos do roteiro — USO INTERNO. Fica no banco e na ficha, nunca no público:
 *  serve para responder quem contesta um número nos comentários. As fontes NÃO passaram por
 *  confirmação externa (ver lib/automation/checagem-fatos.ts) — são onde procurar, não citação. */
export interface ChecagemDoVideo {
  conferidas: number
  suspeitas: number
  sem_resposta: number
  quando: string
  fontes_verificadas: boolean
  itens: Array<{
    trecho: string
    tipo?: string
    confere: boolean
    sabido: string | null
    fonte: string | null
    observacao: string
  }>
}

export interface VideoDetalhe {
  ideiaId: string
  checagem: ChecagemDoVideo | null
  titulo: string
  canalNome: string
  numero: number | null
  notaHook: number | null
  duracaoSeg: number | null
  videoUrl: string | null
  // ── a ideia ──
  descricao: string | null
  statusIdeia: string | null
  origem: string | null
  tags: string[]
  gatilho: string | null
  potencialViralIA: number | null
  criadaEm: string | null
  /** classificado com título + roteiro — o mesmo tema que a agenda usa pra priorizar */
  tema: Tema
  // ── roteiro ──
  roteiroId: string | null
  roteiroTexto: string | null
  roteiroEm: string | null
  duracaoEstimadaSeg: number | null
  // ── áudio ──
  audioUrl: string | null
  audioEm: string | null
  vozId: string | null
  // ── produção ──
  statusPipeline: string | null
  thumbUrl: string | null
  cenas: CenaDoVideo[]
  cenasGeradasEm: string | null
  /** de onde veio cada cena e quanto custou de verdade (ledger do render) */
  ledger: { fontes: Record<string, number>; veoCr: number; economizadoCr: number; quando: string | null } | null
  // ── copy e agenda ──
  caption: string | null
  transcricao: string | null
  previsto: { data: string; horario: string; fixado: boolean } | null
  // consolidado (soma/represália do que faz sentido somar)
  viewsTotal: number
  reachTotal: number | null // só onde há (IG+FB)
  seguidoresTotal: number | null // só FB
  redes: RedeDoVideo[]
  serie: PontoSerie[] // views totais do vídeo por dia (todas as redes somadas)
  padrao: 'explosao' | 'evergreen' | 'desacelerando' | 'estavel' | 'poucos_dados'
}

// mesmas regras da reconciliação: quais redes entregam cada métrica
const RET_REDES = new Set(['youtube', 'instagram', 'facebook'])
const REACH_REDES = new Set(['instagram', 'facebook'])

export function useVideo(ideiaId: string) {
  return useQuery<VideoDetalhe | null>({
    queryKey: ['video', ideiaId],
    enabled: !!ideiaId,
    queryFn: async () => {
      const [ideiaQ, metQ, todasMetQ, pipeQ, audioQ, canaisQ, roteiroQ, leiturasQ, agendaQ] = await Promise.all([
        supabase.schema('pulso_content').from('ideias').select('*').eq('id', ideiaId).maybeSingle(),
        supabase.schema('pulso_content').from('metricas_publicacao')
          .select('plataforma, url_publicacao, views, reach, likes, comentarios, shares, saves, taxa_retencao, taxa_conversao, data_publicacao, metadata')
          .eq('ideia_id', ideiaId),
        // retenção de TODOS os vídeos, por rede, pra calcular o percentil deste dentro da rede
        supabase.schema('pulso_content').from('metricas_publicacao').select('plataforma, taxa_retencao'),
        supabase.schema('pulso_content').from('pipeline_producao').select('status, metadata').eq('ideia_id', ideiaId).maybeSingle(),
        supabase.schema('pulso_content').from('audios')
          .select('duracao_segundos, public_url, url, voz_id, created_at').eq('ideia_id', ideiaId)
          .order('created_at', { ascending: false }).limit(1),
        supabase.schema('pulso_core').from('canais').select('id, nome'),
        supabase.schema('pulso_content').from('roteiros')
          .select('id, conteudo_md, nota_hook, duracao_estimado_segundos, created_at').eq('ideia_id', ideiaId)
          .order('created_at', { ascending: false }).limit(1),
        supabase.schema('pulso_analytics').from('leituras_metricas')
          .select('data_ref, views, plataforma').eq('ideia_id', ideiaId).eq('estimado', false).order('data_ref'),
        supabase.from('vw_agenda_atribuicoes').select('data, horario, fixado').eq('ideia_id', ideiaId).limit(1),
      ])
      if (!ideiaQ.data) return null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canalNome = new Map<string, string>(((canaisQ.data || []) as any[]).map((c) => [c.id, c.nome]))

      // percentil de retenção dentro de cada rede (mesma lógica do cérebro/agenda)
      const retPorRede = new Map<string, number[]>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const m of (todasMetQ.data || []) as any[]) {
        if (m.taxa_retencao == null) continue
        if (!retPorRede.has(m.plataforma)) retPorRede.set(m.plataforma, [])
        retPorRede.get(m.plataforma)!.push(m.taxa_retencao)
      }
      for (const arr of retPorRede.values()) arr.sort((a, b) => a - b)
      const percentil = (plataforma: string, valor: number | null): number | null => {
        if (valor == null) return null
        const arr = retPorRede.get(plataforma)
        if (!arr || arr.length < 2) return null
        let abaixo = 0
        for (const v of arr) if (v < valor) abaixo++
        return Math.round((abaixo / (arr.length - 1)) * 100)
      }

      // dedup de repost na linha por rede
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { unicas } = dedupePublicacoes(((metQ.data || []) as any[]).map((m) => ({ ...m, ideia_id: ideiaId })))
      const redes: RedeDoVideo[] = unicas
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((m: any) => ({
          plataforma: m.plataforma,
          igTotalViews: (m.metadata as { ig_total_views?: number } | null)?.ig_total_views ?? null,
          igFacebookViews: (m.metadata as { ig_facebook_views?: number } | null)?.ig_facebook_views ?? null,
          url: m.url_publicacao,
          views: m.views || 0,
          reach: REACH_REDES.has(m.plataforma) ? (m.reach ?? null) : null,
          likes: m.likes || 0,
          comentarios: m.comentarios || 0,
          shares: m.shares || 0,
          saves: m.saves || 0,
          taxaRetencao: RET_REDES.has(m.plataforma) ? (m.taxa_retencao ?? null) : null,
          seguidores: m.plataforma === 'facebook' && m.taxa_conversao != null && m.views
            ? Math.round((m.taxa_conversao * m.views) / 1000) : null,
          percentil: percentil(m.plataforma, RET_REDES.has(m.plataforma) ? m.taxa_retencao : null),
          dataPublicacao: m.data_publicacao,
        }))
        .sort((a, b) => b.views - a.views)

      // série temporal: views totais do vídeo por dia (soma das redes naquele dia)
      const porDia = new Map<string, number>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const l of (leiturasQ.data || []) as any[]) {
        porDia.set(l.data_ref, (porDia.get(l.data_ref) || 0) + (l.views || 0))
      }
      const serie: PontoSerie[] = [...porDia.entries()].sort().map(([data, views]) => ({ data, views }))

      // classifica o padrão: onde a maior parte das views chegou
      let padrao: VideoDetalhe['padrao'] = 'poucos_dados'
      if (serie.length >= 3) {
        const total = serie[serie.length - 1].views
        const dia3 = serie[Math.min(2, serie.length - 1)].views
        const frac3 = total > 0 ? dia3 / total : 0
        const ganhoRecente = serie.length >= 2 ? serie[serie.length - 1].views - serie[serie.length - 2].views : 0
        if (frac3 >= 0.7) padrao = 'explosao'
        else if (ganhoRecente > total * 0.03) padrao = 'evergreen'
        else if (ganhoRecente <= total * 0.005) padrao = 'desacelerando'
        else padrao = 'estavel'
      }

      const viewsTotal = redes.reduce((s, r) => s + r.views, 0)
      const reachRedes = redes.filter((r) => r.reach != null)
      const seguidoresRedes = redes.filter((r) => r.seguidores != null)

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const ideia = ideiaQ.data as any
      const roteiro = (roteiroQ.data as any[])?.[0] ?? null
      const audio = (audioQ.data as any[])?.[0] ?? null
      const md = ((pipeQ.data as any)?.metadata || {}) as any
      const led = md.ledger_render || null
      const agendado = (agendaQ.data as any[])?.[0] ?? null
      /* eslint-enable @typescript-eslint/no-explicit-any */

      return {
        ideiaId,
        // conferência de fatos gravada por /api/checagem — interna, ver ChecagemDoVideo
        checagem: (ideia?.metadata?.checagem as ChecagemDoVideo | undefined) ?? null,
        titulo: ideia.titulo || '(sem título)',
        canalNome: (ideia.canal_id && canalNome.get(ideia.canal_id)) || '—',
        numero: md.numero ?? null,
        notaHook: roteiro?.nota_hook ?? null,
        duracaoSeg: audio?.duracao_segundos ?? null,
        videoUrl: md.video_url ?? null,
        descricao: ideia.descricao ?? null,
        statusIdeia: ideia.status ?? null,
        origem: ideia.origem ?? null,
        tags: Array.isArray(ideia.tags) ? ideia.tags : [],
        gatilho: ideia.gatilho_psicologico ?? null,
        potencialViralIA: ideia.potencial_viral_ia ?? null,
        criadaEm: ideia.created_at ?? null,
        // o mesmo classificador do roteador: título primeiro, roteiro só como desempate com prova
        tema: classificarTema(ideia.titulo, roteiro?.conteudo_md ?? null),
        roteiroId: roteiro?.id ?? null,
        roteiroTexto: roteiro?.conteudo_md ?? null,
        roteiroEm: roteiro?.created_at ?? null,
        duracaoEstimadaSeg: roteiro?.duracao_estimado_segundos ?? null,
        audioUrl: audio?.public_url ?? audio?.url ?? null,
        audioEm: audio?.created_at ?? null,
        vozId: audio?.voz_id ?? null,
        statusPipeline: (pipeQ.data as { status?: string } | null)?.status ?? null,
        thumbUrl: md.thumb ?? null,
        cenas: Array.isArray(md.cenas?.scenes)
          ? md.cenas.scenes.map((c: { name?: string; prompt?: string }) => ({ nome: c.name || '', prompt: c.prompt || '' }))
          : [],
        cenasGeradasEm: md.cenas_geradas_em ?? null,
        ledger: led
          ? { fontes: led.fontes || {}, veoCr: led.veo_cr ?? 0, economizadoCr: led.economizado_cr ?? 0, quando: led.quando ?? null }
          : null,
        caption: md.caption ?? null,
        transcricao: md.transcricao ?? null,
        previsto: agendado ? { data: agendado.data, horario: agendado.horario, fixado: !!agendado.fixado } : null,
        viewsTotal,
        reachTotal: reachRedes.length ? reachRedes.reduce((s, r) => s + (r.reach || 0), 0) : null,
        seguidoresTotal: seguidoresRedes.length ? seguidoresRedes.reduce((s, r) => s + (r.seguidores || 0), 0) : null,
        redes,
        serie,
        padrao,
      }
    },
  })
}
