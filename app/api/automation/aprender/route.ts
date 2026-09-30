import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { desempenhoPorForma, ROTULO_FORMA, N_MINIMO_POR_FORMA, type FormaHook } from '@/lib/automation/forma-hook'
import { medirTemas, TEMAS, type TemasMedidos } from '@/lib/decisor/temas'
import { hojeBRT } from '@/lib/datas'
import { coletarPublico, resumoPublico, type PublicoRedes } from '@/lib/automation/publico-redes'

/**
 * POST /api/automation/aprender
 *
 * LOOP DE APRENDIZADO — fecha o ciclo "mede → aprende".
 * Lê os campeões da nossa própria audiência (ganchos de maior retenção + tema×rede)
 * e grava um digest em pulso_core.configuracoes (chave: aprendizado_cerebro).
 * A geração de ideias/roteiro injeta esse digest no prompt (few-shot + viés tema→rede).
 * Roda todo dia 07:00 UTC (pg_cron pulso-aprender-diario). Também grava configuracoes.temas_medidos
 * (papel de cada tema em 90 dias) e o crescimento de seguidores por rede em 30 dias.
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
 * 30/09/2026: a tabela de temas que morava aqui (medianas de 29/07, "história/arqueologia tem TODOS
 * os estouros") saiu. Estava dois meses velha — história não estourava desde 30/07 — e era lida
 * todo dia pelo gerador. Agora o bloco de tema é MEDIDO a cada rodada (medirTemas) e a medição
 * fica gravada em configuracoes.temas_medidos para a agenda, o Decisor e as telas.
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

O FACEBOOK É LOTERIA, não gradiente: poucos vídeos carregam o crescimento inteiro. Por isso o
objetivo NÃO é "melhorar a média": é produzir mais bilhete nos temas que estão sorteando (lista
MEDIDA abaixo, refeita toda manhã).

EVITE: "Como/Por que X funciona" como abertura seca (sem quebra nem laço); tema marcado FRACO na
medição abaixo; "história que ninguém conta" genérica sem objeto concreto.
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
    const [{ data: metricas }, { data: roteiros }, { data: ideias }, { data: canais }, { data: segRow }] =
      await Promise.all([
        supabase
          .schema('pulso_content')
          .from('metricas_publicacao')
          .select('ideia_id, plataforma, views, taxa_retencao, data_publicacao'),
        supabase
          .schema('pulso_content')
          .from('roteiros')
          .select('ideia_id, conteudo_md, nota_hook'),
        supabase.schema('pulso_content').from('ideias').select('id, titulo, canal_id, formato'),
        supabase.schema('pulso_core').from('canais').select('id, nome'),
        supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'seguidores_historico').maybeSingle(),
      ])

    const canalNome = new Map<string, string>((canais || []).map((c: { id: string; nome: string }) => [c.id, c.nome]))
    // Vídeo longo (bastidores) fora do aprendizado de Shorts: a métrica dele é hora de exibição.
    const idsLongo = new Set((ideias || []).filter((i: { formato?: string }) => i.formato === 'longo').map((i: { id: string }) => i.id))
    const ideiaCanal = new Map<string, string>()
    const ideiaTitulo = new Map<string, string>()
    const metricasShort = (metricas || []).filter((m: { ideia_id: string }) => !idsLongo.has(m.ideia_id))
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
    for (const m of metricasShort) {
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
    for (const m of metricasShort) {
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
    // ANTI-IMITAÇÃO (29/07/2026): esta seção estava FABRICANDO duplicatas. Ela injeta os ganchos
    // campeões como referência, e o gerador — mesmo lendo "replique a estrutura, não o assunto" —
    // derivava pro assunto do exemplo. Virou loop: campeão entra como referência → gerador produz
    // variante do campeão → a trava lexical não pegava a variante → variante vira vídeo. Foi assim
    // que saíram "relógio de Praga 1922" e "relógio suíço 1923", ou "Rota da Seda" duas vezes em
    // 4 dias. O aprendizado funcionava; só estava otimizando IMITAÇÃO em vez de acerto, porque
    // ninguém media diversidade. Agora os campeões vêm com a lista de assuntos QUEIMADOS colada.
    // A lista tem que ser os TÍTULOS PUBLICADOS, não só os 8 ganchos de retenção. No teste de
    // 29/07 o gerador propôs "A Cidade Submersa que Ressurgiu no Deserto" — praticamente o
    // campeão de 17k "A cidade perdida que surgiu das areias do Saara" — e passou, porque o Saara
    // não estava entre os ganchos (ele é campeão de VIEWS, e a lista vinha da RETENÇÃO).
    const titulosPublicados = [
      ...new Set(
        metricasShort
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((m: any) => ideiaTitulo.get(m.ideia_id) as string | undefined)
          .filter((t: string | undefined): t is string => typeof t === 'string' && t.length > 8)
      ),
    ]
    const assuntosQueimados = [
      ...ganchos
        .map((g) => String(g).replace(/^Em \d{4},?\s*/i, '').split(/[.,]/)[0].trim())
        .filter((s) => s.length > 8),
      ...titulosPublicados,
    ]

    // FORMA DO GANCHO — o experimento entra no cerebro so quando tem amostra. Enquanto mede, a
    // linha diz que esta medindo, em vez de sugerir vencedor com n=1 (o erro da nota_hook).
    let blocoForma = ''
    try {
      const desemp = await desempenhoPorForma(supabase)
      const maduras = (Object.keys(desemp) as FormaHook[])
        .filter((f) => desemp[f].n >= N_MINIMO_POR_FORMA && desemp[f].ret5 != null)
        .sort((a, b) => (desemp[b].ret5 as number) - (desemp[a].ret5 as number))
      if (maduras.length >= 2) {
        const linhas = maduras
          .map((f) => `- ${ROTULO_FORMA[f]}: ${(desemp[f].ret5 as number).toFixed(0)}% de retencao aos 5s (n=${desemp[f].n})`)
          .join('\n')
        blocoForma = `

FORMA DE GANCHO QUE MAIS SEGURA (medido por RETENCAO aos 5 segundos, nao por views):
${linhas}
Prefira a forma do topo quando ela couber no assunto. Nao force: gancho que nao combina com o
tema perde mais do que a forma ganha.`
      } else {
        blocoForma = `

FORMA DE GANCHO: experimento em curso, ainda sem ${N_MINIMO_POR_FORMA} medicoes por forma. Nenhuma preferencia ate la.`
      }
    } catch {
      /* o digest nao pode quebrar por causa do experimento */
    }

    // --- TEMA MEDIDO AGORA (janela de 90 dias) — substitui a tabela congelada de 29/07 ---
    const corpos = new Map<string, string | null>([...roteiroPorIdeia].map(([id, r]) => [id, r.conteudo_md]))
    const temasMedidos: TemasMedidos = medirTemas(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metricasShort.map((m: any) => ({ ideiaId: m.ideia_id, plataforma: m.plataforma, views: m.views, dataPublicacao: m.data_publicacao })),
      ideiaTitulo,
      corpos,
      hojeBRT()
    )
    const g = temasMedidos.geral
    const linhasTema = TEMAS.filter((t) => temasMedidos.porTema[t])
      .map((t) => ({ t, m: temasMedidos.porTema[t]! }))
      .sort((a, b) => b.m.mediana - a.m.mediana)
      .map(({ t, m }) => {
        const selo = m.papel === 'sorteia' ? '  <- SORTEANDO' : m.papel === 'morto' ? '  <- FRACO' : ''
        const outras = Object.entries(m.porRede).filter(([r, v]) => r !== 'facebook' && v.n >= 3)
          .map(([r, v]) => `${r} ${v.mediana}`).join(', ')
        return `  ${t}: mediana FB ${m.mediana} (n=${m.n}, ${m.estouros} estouro${m.estouros === 1 ? '' : 's'})${outras ? ` · ${outras}` : ''}${selo}`
      })
      .join('\n')
    const sorteando = TEMAS.filter((t) => temasMedidos.porTema[t]?.papel === 'sorteia')
    const fracos = TEMAS.filter((t) => temasMedidos.porTema[t]?.papel === 'morto')
    const blocoTemas = `TEMA — MEDIDO HOJE no nosso banco (Facebook, últimos ${temasMedidos.janelaDias} dias, ${g.n} vídeos,
mediana geral ${g.mediana}, ${g.estouros} estouros ≥3k). Fora do FB, a mediana de cada rede:
${linhasTema}
REGRA: a maior parte das ideias deve vir dos temas SORTEANDO (${sorteando.join(', ') || 'nenhum com prova agora — distribua entre os de maior mediana'}).
${fracos.length ? `PROIBIDO como tema principal: ${fracos.join(', ')}.` : 'Nenhum tema está fraco o bastante para ser proibido.'}
Se o vídeo mira YouTube/TikTok/Kwai, escolha pelo número daquela rede acima, não pelo do Facebook.
`

    // --- SEGUIDORES: quem cresce de verdade (contador do perfil, nunca derivado de métrica de post) ---
    let seguidores30d: Record<string, number> = {}
    try {
      const raw = segRow?.valor
      const v = typeof raw === 'string' ? JSON.parse(raw) : raw
      const hist: Array<Record<string, number | string | null>> = Array.isArray(v) ? v : v?.historico || []
      const limite = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10)
      for (const rede of ['facebook', 'instagram', 'youtube', 'tiktok', 'kwai']) {
        const pts = hist.filter((h) => typeof h[rede] === 'number')
        const ult = pts[pts.length - 1]
        const base = [...pts].reverse().find((h) => String(h.data) <= limite)
        if (ult && base) seguidores30d[rede] = (ult[rede] as number) - (base[rede] as number)
      }
    } catch {
      seguidores30d = {}
    }
    const linhaSeguidores = Object.entries(seguidores30d).sort((a, b) => b[1] - a[1])
      .map(([r, n]) => `${r} ${n >= 0 ? '+' : ''}${n}`).join(' · ')

    // --- QUEM ASSISTE (YouTube Analytics + Instagram) — falha não derruba o digest ---
    let publico: PublicoRedes | null = null
    try {
      publico = await coletarPublico()
      await supabase.schema('pulso_core').from('configuracoes')
        .upsert({ chave: 'publico_redes', valor: JSON.stringify(publico) }, { onConflict: 'chave' })
    } catch {
      publico = null
    }
    const linhaPublico = resumoPublico(publico)

    const texto = `${PLANO_CRESCIMENTO}
${blocoTemas}${linhaPublico ? `QUEM ASSISTE (medido pelas plataformas): ${linhaPublico}. Escreva para esse público — referências, tom e exemplos que ele reconhece.
` : ''}
SEGUIDORES GANHOS NOS ÚLTIMOS 30 DIAS (contador do perfil): ${linhaSeguidores || 'sem histórico'}

APRENDIZADO DA NOSSA AUDIÊNCIA (referência de PADRÃO — não copie tema nem frase literal):
GANCHOS QUE MAIS RETIVERAM (replique a ESTRUTURA do gancho, NUNCA o assunto):
${ganchos.map((g) => `- "${g}"`).join('\n')}

ASSUNTOS JÁ QUEIMADOS — estes ganchos acima JÁ VIRARAM VÍDEO. Propor qualquer variação deles é
duplicata e será barrada. Não vale trocar o detalhe (ano, cidade, nacionalidade, objeto parecido)
e chamar de ideia nova — "relojoeiro suíço em 1923" é o mesmo vídeo que "relojoeiro em Praga em
1922". O que se copia é a ESTRUTURA da frase; o assunto tem que ser inédito:
${assuntosQueimados.map((s) => `- ${s}`).join('\n')}

TEMA × REDE (o que cada rede mais premiou em views — priorize ao distribuir/escolher tema):
${linhasTemaRede}${blocoForma}`

    const valor = {
      texto,
      ganchos,
      tema_rede: temaRedeTop,
      seguidores_30d: seguidores30d,
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

    // a medição de temas vira dado próprio: agenda, Decisor, gerador e telas leem daqui
    await supabase.schema('pulso_core').from('configuracoes')
      .upsert({ chave: 'temas_medidos', valor: JSON.stringify(temasMedidos) }, { onConflict: 'chave' })

    return NextResponse.json({ success: true, ...valor, temas_medidos: temasMedidos, publico_erros: publico?.erros ?? ['não coletado'] })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
