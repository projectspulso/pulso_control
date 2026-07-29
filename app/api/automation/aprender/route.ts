import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/automation/aprender
 *
 * LOOP DE APRENDIZADO — fecha o ciclo "mede → aprende".
 * Lê os campeões da nossa própria audiência (ganchos de maior retenção + tema×rede)
 * e grava um digest em pulso_core.configuracoes (chave: aprendizado_cerebro).
 * A geração de ideias/roteiro injeta esse digest no prompt (few-shot + viés tema→rede).
 * Roda semanal (cron) — quanto mais dados, mais forte.
 */

/**
 * PLANO DE CRESCIMENTO — trava estratégica que a IA de ideias/roteiro sempre segue.
 *
 * RECONCILIADO 25/07/2026 com o NOSSO dado, que contradiz parte do benchmark que originou
 * este bloco. O benchmark do @ministroda_educacao dizia "gancho Como funciona / evite mistério".
 * Mas a nossa audiência mostrou o contrário:
 *   - O #43 "COMO um menino inventou um brinquedo" (o padrão que o texto antigo MANDAVA usar)
 *     floppou — o dono reprovou no olho, a régua deu nota 2.
 *   - O #44 "Os camelos NÃO armazenam água... mas o que tem lá?" (quebra de crença — o padrão
 *     que o texto antigo mandava EVITAR) pegou — nota 5.
 *   - Os campeões de RETENÇÃO são todos MISTÉRIO ("uma casa que ninguém consegue deixar", "um
 *     navio sumiu no Ártico") — os mesmos que aparecem na lista GANCHOS QUE MAIS RETIVERAM
 *     gerada abaixo. O texto antigo brigava com a própria lista de campeões dele.
 *   - Medido: nota-de-gancho (quebra+laço) correlaciona com VIEWS +0,194 (o gancho para o dedo;
 *     a retenção é o vídeo, não o gancho). Ver lib/automation/hook-score.ts.
 *
 * O que se MANTÉM do benchmark: PAYLOAD VISUAL CONCRETO. Mistério vago sem objeto afunda; o que
 * retém é mistério/quebra-de-crença COM uma coisa física no centro que dá pra mostrar (#44 = camelo).
 *
 * Fica AQUI (prefixado no digest semanal) e não numa config solta porque o cron `aprender`
 * reescreve o aprendizado_cerebro toda segunda — se estivesse solto, seria apagado. Assim
 * a trava sobrevive a cada reescrita e continua data-driven (edite este bloco pra ajustar).
 */
const PLANO_CRESCIMENTO = `PLANO DE CRESCIMENTO (regra dura — vale acima de qualquer outra preferência):
FÓRMULA VENCEDORA (comprovada pelo NOSSO dado): abrir QUEBRANDO UMA CRENÇA ("X não é o que você
pensa", "ao contrário do que todos acham") OU com um MISTÉRIO/laço aberto que só fecha no fim
("existe uma casa que ninguém consegue deixar" → por quê?), sobre uma coisa CONCRETA que dá pra
mostrar. O gancho para o dedo; o objeto físico no centro segura quem ficou.
NUNCA abrir com "Como [X] funciona / foi inventado" seco — é explicação sem tensão, foi o que
floppou (#43). A régua de hook (hook-score.ts) rebaixa esse padrão pra nota 2 e ele é bloqueado.
PRIORIZE: mistério/contra-intuição/curiosidade COM payload concreto; ciência do cotidiano com
reviravolta; história com virada; animal/corpo humano com um fato que surpreende.
PAYLOAD OBRIGATÓRIO: sempre um objeto/lugar/fenômeno físico no centro que dá pra ver acontecer.
Mistério abstrato SEM isso afunda (essa parte do benchmark estava certa) — mas mistério COM objeto
concreto é o que MAIS reteve na nossa audiência.

TEMA — O SINAL MAIS FORTE QUE JÁ MEDIMOS (29/07/2026, 95 publicações de Facebook, a rede que
traz seguidor). Mediana de views por tema e quantos estouros (>=3k) cada um produziu em 48 dias:
  história/arqueologia ....... 2.919 ... 6 estouros  <- TODOS os estouros do período
  natureza/animais ........... 1.134 ... 0
  corpo/cérebro ................ 551 ... 0
  (outros) ..................... 446 ... 0
  tecnologia/IA ................ 268 ... 0
  produtividade/motivacional ... 252 ... 0
Lift de 10,9x entre o topo e o fundo. Nenhum tema fora de história/arqueologia jamais passou de
3k no Facebook. Campeões reais: "O fóssil que mudou tudo em 2003" (29k), "A cidade perdida que
surgiu das areias do Saara" (17k), "O navio desaparecido por 170 anos" (17k), "A Divisão que
Transformou a Igreja Católica" (6k), "Por que Ouro Preto foi construída em morros" (5k).
REGRA: a MAIORIA das ideias deve ser história/arqueologia — civilização antiga, ruína, naufrágio,
expedição, artefato, cidade, império, descoberta arqueológica. É o tema que compra bilhete no
Facebook. Tecnologia/IA e produtividade/motivacional estão PROIBIDOS como tema principal: 22
vídeos em 48 dias, mediana ~260, zero estouros.

O FACEBOOK É LOTERIA, não gradiente: 3 vídeos acima de 10k, 71 dos 95 abaixo de 1.000 — ~6% dos
vídeos carregam o crescimento inteiro. Por isso o objetivo NÃO é "melhorar a média": é produzir
mais bilhete no tema que sorteia.

EVITE: "Como/Por que X funciona" como abertura seca (sem quebra nem laço); tecnologia/IA e
produtividade/motivacional como tema; "história que ninguém conta" genérica sem objeto concreto.
NÃO USE como critério: presença de ano/data/número no título. Foi TESTADO nas mesmas 95
publicações e deu lift 0,56x — títulos com ano foram PIORES. A tese vinha de 2 virais que por
acaso tinham ano no título; é outlier virando narrativa. O que prevê é o TEMA, não o formato.
EXPLORAÇÃO: ~1 em cada 5 ideias pode fugir da fórmula pra testar tema novo — o resto segue a fórmula.
`

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function primeiraFrase(md: string): string {
  const linha = (md || '').split('\n').map((l) => l.trim()).find(Boolean) || ''
  const ponto = linha.search(/[.!?]/)
  const frase = ponto > 12 ? linha.slice(0, ponto + 1) : linha
  return frase.slice(0, 140).trim()
}

// O Cron da Vercel chama por GET. Esta rota só exportava POST, então o cron das segundas
// respondia 405 e o digest ficou CONGELADO em 30/06 — o cérebro passou 23 dias aprendendo
// com 33 ideias enquanto já havia 82. Mesmo padrão das outras rotas de cron do projeto.
export async function GET(request: NextRequest) {
  return POST(request)
}

export async function POST(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  try {
    const [{ data: metricas }, { data: roteiros }, { data: ideias }, { data: canais }] =
      await Promise.all([
        supabase
          .schema('pulso_content')
          .from('metricas_publicacao')
          .select('ideia_id, plataforma, views, taxa_retencao'),
        supabase
          .schema('pulso_content')
          .from('roteiros')
          .select('ideia_id, conteudo_md, nota_hook'),
        supabase.schema('pulso_content').from('ideias').select('id, titulo, canal_id'),
        supabase.schema('pulso_core').from('canais').select('id, nome'),
      ])

    const canalNome = new Map<string, string>((canais || []).map((c: { id: string; nome: string }) => [c.id, c.nome]))
    const ideiaCanal = new Map<string, string>()
    const ideiaTitulo = new Map<string, string>()
    for (const i of ideias || []) {
      ideiaCanal.set(i.id, i.canal_id)
      ideiaTitulo.set(i.id, i.titulo)
    }
    const roteiroPorIdeia = new Map<string, { conteudo_md: string; nota_hook: number | null }>()
    for (const r of roteiros || []) {
      if (r.ideia_id && !roteiroPorIdeia.has(r.ideia_id)) roteiroPorIdeia.set(r.ideia_id, r)
    }

    // PERCENTIL POR REDE: a retenção não é comparável entre plataformas — o YouTube devolve
    // averageViewPercentage, que passa de 100% quando o Short entra em loop (vimos 328%),
    // enquanto IG/FB são tempo÷duração (teto ~100). Comparar o número cru fazia o YouTube
    // ocupar o pódio inteiro por artefato de escala. Aqui cada vídeo é medido contra os
    // outros DA MESMA REDE: 0..1 = posição relativa. Aí sim as redes se somam.
    const porRede = new Map<string, number[]>()
    for (const m of metricas || []) {
      if (!m.taxa_retencao) continue
      if (!porRede.has(m.plataforma)) porRede.set(m.plataforma, [])
      porRede.get(m.plataforma)!.push(m.taxa_retencao)
    }
    for (const arr of porRede.values()) arr.sort((a, b) => a - b)
    const percentil = (plataforma: string, valor: number | null) => {
      const arr = porRede.get(plataforma)
      if (!valor || !arr || arr.length < 2) return 0
      let abaixo = 0
      for (const v of arr) if (v < valor) abaixo++
      return abaixo / (arr.length - 1)
    }

    // --- agrega métricas por ideia (retenção máx + views totais) ---
    const porIdeia = new Map<string, { views: number; ret: number }>()
    // --- tema×rede: views por (plataforma, vertical) ---
    const temaRede = new Map<string, Map<string, number>>()
    for (const m of metricas || []) {
      const ag = porIdeia.get(m.ideia_id) || { views: 0, ret: 0 }
      ag.views += m.views || 0
      ag.ret = Math.max(ag.ret, percentil(m.plataforma, m.taxa_retencao))
      porIdeia.set(m.ideia_id, ag)

      const vert = canalNome.get(ideiaCanal.get(m.ideia_id) || '') || '?'
      if (!temaRede.has(m.plataforma)) temaRede.set(m.plataforma, new Map())
      const vm = temaRede.get(m.plataforma)!
      vm.set(vert, (vm.get(vert) || 0) + (m.views || 0))
    }

    // --- ganchos campeões: ordena por retenção, depois views; pega os com roteiro ---
    const ranked = [...porIdeia.entries()]
      .map(([id, ag]) => ({ id, ...ag, r: roteiroPorIdeia.get(id) }))
      .filter((x) => x.r && x.r.conteudo_md)
      .sort((a, b) => b.ret - a.ret || b.views - a.views)

    const ganchos: string[] = []
    const vistos = new Set<string>()
    for (const x of ranked) {
      const g = primeiraFrase(x.r!.conteudo_md)
      const k = norm(g).slice(0, 40)
      if (g.length > 20 && !vistos.has(k)) {
        vistos.add(k)
        ganchos.push(g)
      }
      if (ganchos.length >= 8) break
    }

    const temaRedeTop: Record<string, string> = {}
    for (const [plat, vm] of temaRede) {
      const top = [...vm.entries()].sort((a, b) => b[1] - a[1])[0]
      if (top) temaRedeTop[plat] = top[0].replace(/^PULSO\s*/i, '')
    }

    // --- monta o digest (texto pronto pra injetar no prompt) ---
    const linhasTemaRede = Object.entries(temaRedeTop)
      .map(([p, v]) => `- ${p}: ${v}`)
      .join('\n')
    const texto = `${PLANO_CRESCIMENTO}
APRENDIZADO DA NOSSA AUDIÊNCIA (referência de PADRÃO — não copie tema nem frase literal):
GANCHOS QUE MAIS RETIVERAM (replique a ESTRUTURA do gancho, não o assunto):
${ganchos.map((g) => `- "${g}"`).join('\n')}
TEMA × REDE (o que cada rede mais premiou em views — priorize ao distribuir/escolher tema):
${linhasTemaRede}`

    const valor = {
      texto,
      ganchos,
      tema_rede: temaRedeTop,
      base: { ideias_com_metrica: porIdeia.size, ganchos: ganchos.length },
      atualizado_em: new Date().toISOString(),
    }

    // upsert em configuracoes
    const { data: existe } = await supabase
      .schema('pulso_core')
      .from('configuracoes')
      .select('chave')
      .eq('chave', 'aprendizado_cerebro')
      .maybeSingle()

    if (existe) {
      await supabase
        .schema('pulso_core')
        .from('configuracoes')
        .update({ valor: JSON.stringify(valor) })
        .eq('chave', 'aprendizado_cerebro')
    } else {
      await supabase
        .schema('pulso_core')
        .from('configuracoes')
        .insert({ chave: 'aprendizado_cerebro', valor: JSON.stringify(valor) })
    }

    return NextResponse.json({ success: true, ...valor })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
