/**
 * KIT DE MÍDIA — o que o patrocinador vê. Sai dos mesmos dados da aba Controle e é CONGELADO no envio
 * (pulso_analytics.kit_midia_envios, migration 082): o número do dia do envio não muda depois.
 *
 * Regras do que entra (04-05/11/2026):
 *   · seguidor só do contador do perfil (seguidores_historico); rede sem leitura = "não medido", nunca estimado
 *   · views = soma por vídeo (republicação conta uma vez), vídeo longo fora — igual ao Controle
 *   · views do mês = views GANHAS (v_ganho_diario), não acumuladas
 *   · NADA de tema × rede nem desempenho por assunto: isso é receita do Livro de Problemas (segredo)
 *   · nem a lista de verticais: os nomes são internos ("Pulso Dark PT") e mostram o mix do conteúdo
 *   · Kwai é lido por print: o kit diz isso
 */
import { agruparGanho, NOME_REDE, REDES, type Controle, type GanhoDia, type Rede } from '@/lib/analytics/controle'

export interface Fatia { rotulo: string; pct: number }

export interface PublicoRede { idade: Fatia[]; genero: Fatia[]; paises: Fatia[]; cidades: Fatia[] }

export interface KitRede {
  rede: Rede
  nome: string
  seguidores: number | null
  seguidoresEm: string | null
  ganho30: number | null
  views: number
  views30: number
  videos: number
  manual: boolean
}

export interface KitDados {
  versao: 1
  medidoEm: string
  desde: string | null // primeira publicação medida
  totais: { seguidores: number; views: number; views30: number; interacoes: number; videos: number; videos30: number }
  redes: KitRede[]
  meses: { rotulo: string; views: number; videos: number }[]
  top: { titulo: string; views: number; publicadoEm: string; rede: string }[]
  publico: { atualizadoEm: string | null; youtube: PublicoRede | null; instagram: PublicoRede | null }
}

export interface LeituraSeguidores { data: string; [rede: string]: number | string | null }

const DIA = 864e5
const GENERO: Record<string, string> = { male: 'Homens', m: 'Homens', female: 'Mulheres', f: 'Mulheres', u: 'Não informado' }

function fatias(lista: unknown, limite = 8, rotular: (s: string) => string = (s) => s): Fatia[] {
  if (!Array.isArray(lista)) return []
  return lista
    .map((x) => ({ rotulo: rotular(String(x?.rotulo ?? '')), pct: Number(x?.pct) || 0 }))
    .filter((x) => x.rotulo && x.pct > 0)
    .slice(0, limite)
}

function publicoDe(bruto: unknown): PublicoRede | null {
  if (!bruto || typeof bruto !== 'object') return null
  const b = bruto as Record<string, unknown>
  const p: PublicoRede = {
    idade: fatias(b.idade, 8, (s) => s.replace(/-$/, '+')),
    genero: fatias(b.genero, 3, (s) => GENERO[s.toLowerCase()] || s),
    paises: fatias(b.paises, 5),
    cidades: fatias(b.cidades, 6, (s) => s.replace(/ \(state\)/g, '')),
  }
  return p.idade.length || p.genero.length || p.paises.length ? p : null
}

/** Último valor medido da rede e quanto ganhou em ~30 dias (contra a leitura mais próxima de 30 dias antes). */
function seguidoresDe(hist: LeituraSeguidores[], rede: Rede) {
  const medidas = hist
    .filter((h) => typeof h[rede] === 'number')
    .sort((a, b) => a.data.localeCompare(b.data))
  const ultima = medidas.at(-1)
  if (!ultima) return { seguidores: null, em: null, ganho30: null }
  const alvo = new Date(`${ultima.data}T00:00:00Z`).getTime() - 30 * DIA
  const antes = [...medidas].reverse().find((h) => new Date(`${h.data}T00:00:00Z`).getTime() <= alvo)
  return {
    seguidores: ultima[rede] as number,
    em: ultima.data,
    ganho30: antes ? (ultima[rede] as number) - (antes[rede] as number) : null,
  }
}

export function montarKit(
  entrada: {
    controle: Controle
    ganhos: GanhoDia[]
    seguidores: LeituraSeguidores[]
    publico: Record<string, unknown> | null
  },
  agora: number,
): KitDados {
  const { controle, ganhos } = entrada
  const hoje = new Date(agora).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const corte30 = new Date(agora - 30 * DIA).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const ganho30 = (rede?: Rede) =>
    ganhos.filter((g) => g.dia.slice(0, 10) > corte30 && (!rede || g.plataforma === rede))
      .reduce((s, g) => s + (Number(g.views_ganhas) || 0), 0)

  const redes: KitRede[] = REDES.map((rede) => {
    const s = seguidoresDe(entrada.seguidores, rede)
    const comPost = controle.videos.filter((v) => v.redes[rede])
    return {
      rede, nome: NOME_REDE[rede], seguidores: s.seguidores, seguidoresEm: s.em, ganho30: s.ganho30,
      views: comPost.reduce((t, v) => t + (v.redes[rede]?.views || 0), 0),
      views30: ganho30(rede), videos: comPost.length, manual: rede === 'kwai',
    }
  })

  const videos30 = controle.videos.filter((v) => v.publicadoEm && agora - new Date(v.publicadoEm).getTime() <= 30 * DIA).length
  const datas = controle.videos.map((v) => v.publicadoEm).filter(Boolean).sort()

  const meses = agruparGanho(ganhos, controle.videos, 'mes', { rede: 'todas', canalId: 'todos' }, hoje)
    .slice(-6).map((b) => ({ rotulo: b.rotulo, views: b.views, videos: b.videos }))

  const top = [...controle.videos].sort((a, b) => b.totalViews - a.totalViews).slice(0, 5).map((v) => {
    const principal = REDES.reduce<Rede | null>((m, r) => ((v.redes[r]?.views || 0) > (m ? v.redes[m]?.views || 0 : -1) ? r : m), null)
    return { titulo: v.titulo, views: v.totalViews, publicadoEm: v.publicadoEm, rede: principal ? NOME_REDE[principal] : '—' }
  })

  const pub = entrada.publico || {}
  return {
    versao: 1,
    medidoEm: new Date(agora).toISOString(),
    desde: datas[0] || null,
    totais: {
      seguidores: redes.reduce((t, r) => t + (r.seguidores || 0), 0),
      views: controle.totalViews,
      views30: ganho30(),
      interacoes: controle.totalInteracoes,
      videos: controle.videos.length,
      videos30,
    },
    redes, meses, top,
    publico: {
      atualizadoEm: typeof pub.atualizadoEm === 'string' ? pub.atualizadoEm : null,
      youtube: publicoDe(pub.youtube),
      instagram: publicoDe(pub.instagram),
    },
  }
}
