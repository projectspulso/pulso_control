/**
 * CONTROLE DOS VÍDEOS PUBLICADOS — confere, vídeo a vídeo e rede a rede, se o dado que o app mostra
 * é verdadeiro e está em dia. É a base do kit de mídia e dos Bastidores: só se vende o que se prova.
 *
 * Nasceu do 504 de 01-03/11/2026: YouTube e Instagram ficaram dois dias sem leitura e nenhuma tela
 * acusou. Cada regra abaixo foi medida no banco antes de virar alerta (03/11), para não virar ruído:
 *   · rede por API sem leitura há 72h no post — FB tinha 17, TikTok 2
 *   · 0 views depois de 3 dias — FB tinha 20 (estrangulado ou post_id errado)
 *   · Kwai é manual e as views congelam em 3 dias: o alerta é da ROTINA parada, não do post
 *   · rede faltando só em vídeo dos últimos 30 dias (o histórico antigo não teve as 5 redes)
 */

export const REDES = ['youtube', 'instagram', 'facebook', 'tiktok', 'kwai'] as const
export type Rede = (typeof REDES)[number]

export const NOME_REDE: Record<Rede, string> = {
  youtube: 'YouTube', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', kwai: 'Kwai',
}

const MANUAIS: Rede[] = ['kwai']
const HORA = 3_600_000
const DIA = 24 * HORA

export interface LinhaMetrica {
  ideia_id: string | null
  plataforma: string
  post_id: string | null
  url_publicacao: string | null
  data_publicacao: string | null
  views: number | null
  likes: number | null
  comentarios: number | null
  shares: number | null
  saves: number | null
  reach: number | null
  taxa_retencao: number | null
  ultima_atualizacao: string | null
}

export interface LinhaPipeline {
  ideia_id: string
  status: string
  data_publicacao_planejada: string | null
  numero: string | null
}

export interface LinhaIdeia {
  id: string
  titulo: string
  canal_id: string | null
  formato?: string | null
}

export interface RodadaColeta {
  created_at: string
  status: string
  detalhes: { rede?: string; coletados?: number | string; pulados_por_prazo?: number | string } | null
}

export type Gravidade = 'alta' | 'media'

export interface Alerta {
  tipo: 'falta_rede' | 'sem_leitura' | 'zerado' | 'atrasado' | 'coleta_parada' | 'rotina_manual'
  gravidade: Gravidade
  rede?: Rede
  texto: string
}

export interface CelulaRede {
  views: number
  likes: number
  comentarios: number
  compart: number
  reach: number | null
  retencao: number | null
  url: string | null
  ultimaLeitura: string | null
  posts: number // > 1 = republicação
}

export interface VideoControle {
  ideiaId: string
  numero: number | null
  titulo: string
  canal: string
  publicadoEm: string
  redes: Partial<Record<Rede, CelulaRede>>
  totalViews: number
  totalInteracoes: number
  alertas: Alerta[]
}

export interface RedeControle {
  rede: Rede
  manual: boolean
  publicacoes: number // vídeos com post nesta rede (republicação conta uma vez)
  republicacoes: number // posts a mais do mesmo vídeo — o que morreu fica fora das contas abaixo
  lidas24h: number
  paradas: number
  zeradas: number
  ultimaLeitura: string | null
  ultimaRodada: { quando: string; status: string; coletados: number; pulados: number } | null
}

export interface Controle {
  videos: VideoControle[]
  redes: RedeControle[]
  gerais: Alerta[]
  totalViews: number
  totalInteracoes: number
}

const ms = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : NaN)
const n = (v: number | string | null | undefined) => Number(v ?? 0) || 0

export function montarControle(
  dados: {
    metricas: LinhaMetrica[]
    pipeline: LinhaPipeline[]
    ideias: LinhaIdeia[]
    canais: { id: string; nome: string }[]
    rodadas: RodadaColeta[]
    redesPausadas?: string[]
  },
  agora: number,
): Controle {
  const ideias = new Map(dados.ideias.map((i) => [i.id, i]))
  const canais = new Map(dados.canais.map((c) => [c.id, c.nome]))
  const numeroDe = new Map<string, number>()
  for (const p of dados.pipeline) if (p.numero && /^\d+$/.test(p.numero)) numeroDe.set(p.ideia_id, Number(p.numero))
  const pausadas = new Set(dados.redesPausadas || [])

  const porVideo = new Map<string, VideoControle>()
  for (const m of dados.metricas) {
    const rede = m.plataforma as Rede
    if (!m.ideia_id || !REDES.includes(rede)) continue
    const ideia = ideias.get(m.ideia_id)
    if (!ideia || ideia.formato === 'longo') continue // vídeo longo mede hora de exibição, não views
    let v = porVideo.get(m.ideia_id)
    if (!v) {
      v = {
        ideiaId: m.ideia_id, numero: numeroDe.get(m.ideia_id) ?? null, titulo: ideia.titulo,
        canal: canais.get(ideia.canal_id || '') || '—', publicadoEm: m.data_publicacao || '',
        redes: {}, totalViews: 0, totalInteracoes: 0, alertas: [],
      }
      porVideo.set(m.ideia_id, v)
    }
    if (m.data_publicacao && (!v.publicadoEm || m.data_publicacao < v.publicadoEm)) v.publicadoEm = m.data_publicacao
    const atual = v.redes[rede]
    const views = n(m.views)
    // republicação: fica o post de MAIOR views (mesma regra do dedupe do BI), mas conta os dois
    if (!atual || views > atual.views) {
      v.redes[rede] = {
        views, likes: n(m.likes), comentarios: n(m.comentarios), compart: n(m.shares) + n(m.saves),
        reach: m.reach, retencao: m.taxa_retencao, url: m.url_publicacao,
        ultimaLeitura: m.ultima_atualizacao, posts: (atual?.posts || 0) + 1,
      }
    } else {
      atual.posts += 1
    }
  }

  for (const v of porVideo.values()) {
    const idade = agora - ms(v.publicadoEm)
    for (const rede of REDES) {
      const c = v.redes[rede]
      if (c) {
        v.totalViews += c.views
        v.totalInteracoes += c.likes + c.comentarios + c.compart
      }
      if (MANUAIS.includes(rede)) continue
      if (!c) {
        if (idade > 2 * DIA && idade < 30 * DIA && !pausadas.has(rede)) {
          v.alertas.push({ tipo: 'falta_rede', gravidade: 'alta', rede, texto: `sem publicação no ${NOME_REDE[rede]}` })
        }
        continue
      }
      const semLer = agora - ms(c.ultimaLeitura)
      if (!c.ultimaLeitura || semLer > 72 * HORA) {
        const h = c.ultimaLeitura ? Math.round(semLer / HORA) : null
        v.alertas.push({ tipo: 'sem_leitura', gravidade: 'media', rede,
          texto: h ? `${NOME_REDE[rede]} sem leitura há ${h >= 48 ? `${Math.round(h / 24)} dias` : `${h}h`}` : `${NOME_REDE[rede]} nunca foi lido` })
      }
      if (c.views === 0 && idade > 3 * DIA) {
        v.alertas.push({ tipo: 'zerado', gravidade: 'media', rede, texto: `${NOME_REDE[rede]} com 0 views há ${Math.floor(idade / DIA)} dias` })
      }
    }
  }

  const redes: RedeControle[] = REDES.map((rede) => {
    // conta por VÍDEO, igual à tabela: contar linha punha na conta o post republicado que morreu
    const celulas = [...porVideo.values()].flatMap((v) => (v.redes[rede] ? [{ c: v.redes[rede]!, pub: v.publicadoEm }] : []))
    let ultimaLeitura: string | null = null
    for (const { c } of celulas) if (c.ultimaLeitura && (!ultimaLeitura || c.ultimaLeitura > ultimaLeitura)) ultimaLeitura = c.ultimaLeitura
    const r = dados.rodadas.find((x) => x.detalhes?.rede === rede || (x.detalhes?.rede === 'todas' && !MANUAIS.includes(rede)))
    return {
      rede, manual: MANUAIS.includes(rede), publicacoes: celulas.length,
      republicacoes: celulas.reduce((s, { c }) => s + c.posts - 1, 0),
      lidas24h: celulas.filter(({ c }) => agora - ms(c.ultimaLeitura) <= 26 * HORA).length,
      paradas: celulas.filter(({ c }) => !c.ultimaLeitura || agora - ms(c.ultimaLeitura) > 72 * HORA).length,
      zeradas: celulas.filter(({ c, pub }) => c.views === 0 && agora - ms(pub) > 3 * DIA).length,
      ultimaLeitura,
      ultimaRodada: r ? { quando: r.created_at, status: r.status, coletados: n(r.detalhes?.coletados), pulados: n(r.detalhes?.pulados_por_prazo) } : null,
    }
  })

  const gerais: Alerta[] = []
  for (const r of redes) {
    if (r.manual) {
      // a rotina do Kwai grava por foto às 21h; dois dias sem nenhuma leitura = rotina parou
      if (!r.ultimaLeitura || agora - ms(r.ultimaLeitura) > 48 * HORA) {
        gerais.push({ tipo: 'rotina_manual', gravidade: 'alta', rede: r.rede,
          texto: `${NOME_REDE[r.rede]}: sem prints desde ${r.ultimaLeitura ? new Date(r.ultimaLeitura).toLocaleDateString('pt-BR') : 'nunca'} — mande os prints da Central de Dados na rotina das 21h` })
      }
      continue
    }
    if (pausadas.has(r.rede)) continue
    // 26h: a coleta roda várias vezes por dia; uma rede sem leitura nova em mais de um dia morreu
    if (!r.ultimaLeitura || agora - ms(r.ultimaLeitura) > 26 * HORA) {
      gerais.push({ tipo: 'coleta_parada', gravidade: 'alta', rede: r.rede,
        texto: `${NOME_REDE[r.rede]}: coleta sem leitura nova há ${r.ultimaLeitura ? Math.round((agora - ms(r.ultimaLeitura)) / HORA) : '?'}h` })
    }
  }
  const publicados = new Set(porVideo.keys())
  for (const p of dados.pipeline) {
    if (p.status !== 'PRONTO_PUBLICACAO' || !p.data_publicacao_planejada || publicados.has(p.ideia_id)) continue
    // a data planejada é gravada SEM fuso, em horário de Brasília
    const marcado = ms(`${p.data_publicacao_planejada.replace(' ', 'T').slice(0, 19)}-03:00`)
    if (agora - marcado > 2 * HORA) {
      gerais.push({ tipo: 'atrasado', gravidade: 'alta',
        texto: `#${p.numero ?? '?'} era para sair em ${new Date(marcado).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} e não saiu` })
    }
  }

  const videos = [...porVideo.values()].sort((a, b) => b.publicadoEm.localeCompare(a.publicadoEm))
  return {
    videos, redes, gerais,
    totalViews: videos.reduce((s, v) => s + v.totalViews, 0),
    totalInteracoes: videos.reduce((s, v) => s + v.totalInteracoes, 0),
  }
}

/** CSV para o kit de mídia e os Bastidores — separador ";" e vírgula decimal (Excel em pt-BR). */
export function controleCsv(c: Controle): string {
  const cab = ['numero', 'titulo', 'vertical', 'publicado_em', ...REDES.map((r) => `views_${r}`), 'views_total', 'interacoes_total', 'alertas']
  const esc = (s: string) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
  const linhas = c.videos.map((v) => [
    v.numero ?? '', esc(v.titulo), esc(v.canal), v.publicadoEm.slice(0, 10),
    ...REDES.map((r) => v.redes[r]?.views ?? ''), v.totalViews, v.totalInteracoes,
    esc(v.alertas.map((a) => a.texto).join(' | ')),
  ].join(';'))
  return '﻿' + [cab.join(';'), ...linhas].join('\n')
}
