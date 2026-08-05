/**
 * O QUE FLOPOU — e, mais importante, POR QUÊ.
 *
 * Uma lista de "menores views" seria inútil: 100 views é normal no Instagram (mediana 173) e
 * péssimo no Kwai (mediana 672). Por isso o corte é sempre RELATIVO à mediana da própria rede.
 *
 * Mas o que dá valor a esta tela é a separação de MOTIVO, e ela veio de um caso real. Em 04/08 o
 * dono viu 5 publicações do Facebook com zero views e perguntou o que era. Eu li como "o Facebook
 * não quis" — errado. Três daquelas tinham sido postadas via API, e via API a Meta estrangula reel
 * não-nativo: 3 de 3 posts por API deram EXATAMENTE zero, contra mediana 464 nos 107 manuais.
 * Aqueles vídeos nunca foram entregues; nunca tiveram chance de flopar.
 *
 * Daí os três baldes, que pedem coisas opostas:
 *   · NAO_ENTREGUE  — a rede não mostrou pra ninguém. É bug/veto nosso, não conteúdo. RECUPERÁVEL:
 *                     republicar do jeito certo é primeira exibição, não repost.
 *   · SEM_PUBLICAR  — o vídeo simplesmente não existe naquela rede. RECUPERÁVEL: é só publicar.
 *   · ENTREGUE_FRACO — teve alcance normal e mesmo assim ninguém quis. Isso sim é APRENDIZADO
 *                     editorial, e é o único balde que deve influenciar o que produzimos.
 *
 * Misturar os três produz a conclusão errada: foi exatamente o que eu fiz antes de checar.
 */

export type MotivoFlop = 'nao_entregue' | 'sem_publicar' | 'entregue_fraco'

/** Abaixo desta fração da mediana da rede, a publicação conta como fraca. */
export const FRACAO_DA_MEDIANA = 0.25
/** Antes disso a rede ainda está distribuindo — chamar de flop seria cedo demais. */
export const IDADE_MINIMA_DIAS = 7

export interface PubBrutaFlop {
  ideiaId: string
  plataforma: string
  views: number
  reach: number | null
  metodo: string | null
  dataPublicacao: string | null
}

export interface Flop {
  ideiaId: string
  plataforma: string
  motivo: MotivoFlop
  views: number
  /** mediana da rede, para dar escala ao número */
  medianaRede: number
  idadeDias: number | null
  /** frase curta do porquê — o dono precisa poder discordar, não obedecer */
  explicacao: string
  /** dá pra consertar publicando de novo (ou pela primeira vez)? */
  recuperavel: boolean
}

export interface ResumoFlops {
  flops: Flop[]
  medianas: Record<string, number>
  /** contagem por motivo, pra tela não precisar recontar */
  porMotivo: Record<MotivoFlop, number>
  totalPublicacoes: number
}

function mediana(nums: number[]): number {
  if (!nums.length) return 0
  const a = [...nums].sort((x, y) => x - y)
  return a[Math.floor(a.length / 2)]
}

function idadeEmDias(iso: string | null, hojeMs: number): number | null {
  if (!iso) return null
  return Math.floor((hojeMs - new Date(iso).getTime()) / 86_400_000)
}

/**
 * @param pubs publicações com data (as sem data ainda não foram ao ar)
 * @param redes universo de redes — precisa vir de fora para detectar as que FALTAM
 * @param hojeMs instante de referência (injetado para o cálculo ser testável)
 */
export function levantarFlops(pubs: PubBrutaFlop[], redes: readonly string[], hojeMs: number): ResumoFlops {
  const publicadas = pubs.filter((p) => p.dataPublicacao)

  const medianas: Record<string, number> = {}
  for (const r of redes) {
    medianas[r] = mediana(publicadas.filter((p) => p.plataforma === r).map((p) => p.views))
  }

  const flops: Flop[] = []

  for (const p of publicadas) {
    const idade = idadeEmDias(p.dataPublicacao, hojeMs)
    const med = medianas[p.plataforma] || 0

    // 1) NÃO ENTREGUE. Dois sinais, ambos objetivos:
    //    · Facebook via API — medido, não suposto: 3 de 3 deram zero (teste de 11/07).
    //    · alcance de 0-2 pessoas depois de uma semana: a rede não mostrou, ponto.
    const viaApiNoFacebook = p.plataforma === 'facebook' && p.metodo === 'api'
    const semAlcance = (p.reach ?? 99) <= 2 && (idade ?? 0) >= IDADE_MINIMA_DIAS
    if (viaApiNoFacebook || semAlcance) {
      flops.push({
        ideiaId: p.ideiaId, plataforma: p.plataforma, motivo: 'nao_entregue',
        views: p.views, medianaRede: med, idadeDias: idade,
        explicacao: viaApiNoFacebook
          ? 'publicado via API no Facebook — a Meta estrangula reel não-nativo (3 de 3 deram zero)'
          : `alcance de ${p.reach} pessoa(s) em ${idade} dias — a rede não mostrou`,
        recuperavel: true,
      })
      continue
    }

    // 2) ENTREGUE E FRACO — teve chance e não pegou. Só depois da janela de distribuição.
    if ((idade ?? 0) >= IDADE_MINIMA_DIAS && med > 0 && p.views < med * FRACAO_DA_MEDIANA) {
      flops.push({
        ideiaId: p.ideiaId, plataforma: p.plataforma, motivo: 'entregue_fraco',
        views: p.views, medianaRede: med, idadeDias: idade,
        explicacao: `${p.views} views contra mediana ${med} da rede — foi entregue e não pegou`,
        recuperavel: false,
      })
    }
  }

  // 3) SEM PUBLICAR — o par vídeo×rede que nunca existiu. Não aparece na tabela, então tem que
  //    ser deduzido: sem isto, o buraco de distribuição fica invisível para sempre.
  const redesDoVideo = new Map<string, Set<string>>()
  for (const p of publicadas) {
    if (!redesDoVideo.has(p.ideiaId)) redesDoVideo.set(p.ideiaId, new Set())
    redesDoVideo.get(p.ideiaId)!.add(p.plataforma)
  }
  for (const [ideiaId, tem] of redesDoVideo) {
    for (const r of redes) {
      if (tem.has(r)) continue
      flops.push({
        ideiaId, plataforma: r, motivo: 'sem_publicar',
        views: 0, medianaRede: medianas[r] || 0, idadeDias: null,
        explicacao: 'este vídeo nunca foi publicado nesta rede',
        recuperavel: true,
      })
    }
  }

  const porMotivo: Record<MotivoFlop, number> = { nao_entregue: 0, sem_publicar: 0, entregue_fraco: 0 }
  for (const f of flops) porMotivo[f.motivo]++

  return { flops, medianas, porMotivo, totalPublicacoes: publicadas.length }
}
