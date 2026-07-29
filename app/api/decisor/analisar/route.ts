import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { callOpenAI } from '@/lib/automation/ai-clients'

/**
 * POST|GET /api/decisor/analisar
 *
 * O ANALISTA. Recebe os fatos JÁ CALCULADOS por /api/decisor e escreve a leitura em português.
 *
 * AS TRÊS TRAVAS (o motivo de isto não ser "pergunta pro GPT o que está acontecendo"):
 *
 * 1. NÃO FAZ CONTA. Todo número vem pronto do motor determinístico. O prompt proíbe citar
 *    qualquer número que não esteja no JSON recebido. Sem isto o modelo preenche buraco com
 *    número plausível — que é a forma mais perigosa de erro, porque parece certo.
 *
 * 2. NÃO INVENTA MUDANÇA DE ALGORITMO. Perguntar "o que mudou no algoritmo do FB essa semana?"
 *    faz o modelo descrever uma atualização verossímil que ele não tem como saber (conhecimento
 *    congelado no treino). Mudança de distribuição só pode ser INFERIDA do nosso próprio dado —
 *    queda uniforme de alcance em todos os vídeos ao mesmo tempo, por exemplo — e sempre sai
 *    rotulada como hipótese.
 *
 * 3. RÓTULO DE CONFIANÇA OBRIGATÓRIO em cada item: fato (nosso dado) · tendencia (Trend Tops) ·
 *    hipotese (inferência) · caminho (sugestão de ação). É o que separa analista de chute.
 *
 * CUSTO: roda 1×/dia pelo cron, grava em pulso_core.configuracoes. A tela só LÊ o cache — nunca
 * dispara LLM ao abrir. Modelo barato (gpt-4o-mini) porque a tarefa é redigir, não raciocinar
 * sobre número cru.
 */

export const maxDuration = 60

const CHAVE_PARECER = 'decisor_parecer'
const MODELO = 'gpt-4o-mini'

interface ItemParecer {
  tipo: 'fato' | 'tendencia' | 'hipotese' | 'caminho'
  texto: string
}

interface Parecer {
  geradoEm: string
  leitura: string
  faca: string[]
  evite: string[]
  observe: string[]
  itens: ItemParecer[]
  modelo: string
}

export async function GET(request: NextRequest) {
  return POST(request)
}

export async function POST(request: NextRequest) {
  const guard = await guardApi(request)
  if (guard) return guard

  try {
    // pega os fatos da própria rota de fatos — uma fonte só, sem duplicar consulta
    const base = new URL(request.url)
    const fatosUrl = `${base.origin}/api/decisor`
    const auth = request.headers.get('authorization')
    const cookie = request.headers.get('cookie')
    const r = await fetch(fatosUrl, {
      headers: {
        ...(auth ? { authorization: auth } : {}),
        ...(cookie ? { cookie } : {}),
      },
      cache: 'no-store',
    })
    if (!r.ok) throw new Error(`fatos indisponíveis (${r.status})`)
    const { fatos } = await r.json()
    if (!fatos) throw new Error('fatos vazios')

    const trends = await lerTrends()
    const parecer = await redigir(fatos, trends)

    const supabase = getSupabaseAdminClient()
    await supabase
      .schema('pulso_core')
      .from('configuracoes')
      .upsert({ chave: CHAVE_PARECER, valor: parecer }, { onConflict: 'chave' })

    return NextResponse.json({ ok: true, parecer })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

/** Trend Tops — fonte real de tendência. Se não houver, o analista simplesmente não fala de trend. */
async function lerTrends(): Promise<string[]> {
  try {
    const supabase = getSupabaseAdminClient()
    const { data } = await supabase
      .schema('pulso_core')
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'trends_pulso')
      .maybeSingle()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v: any = (data as any)?.valor
    const arr = Array.isArray(v) ? v : v?.itens || v?.trends || []
    return arr
      .slice(0, 12)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((t: any) => (typeof t === 'string' ? t : t?.titulo || t?.termo || t?.tema))
      .filter(Boolean)
  } catch {
    return []
  }
}

const INSTRUCAO = `Você é o analista de dados do PULSO, um canal brasileiro de vídeos curtos (faceless) que publica em YouTube, Instagram, Facebook, TikTok e Kwai.

Sua tarefa: ler os FATOS abaixo (já calculados, todos verdadeiros) e escrever a leitura do dia para o dono do canal, em português do Brasil, direto e sem enrolação.

REGRAS INEGOCIÁVEIS:
1. NUNCA cite um número que não esteja nos FATOS. Não estime, não arredonde para um valor diferente, não invente. Se um dado não está lá, diga "não medido".
2. NUNCA afirme que uma plataforma mudou o algoritmo, lançou recurso ou alterou política. Você não tem essa informação. Se os FATOS mostram queda uniforme em todos os vídeos de uma rede, você pode levantar isso como HIPÓTESE de mudança de distribuição — sempre rotulada como hipótese, nunca como fato.
3. Só fale de tendência externa se a lista TRENDS vier preenchida. Se vier vazia, não mencione tendências.
4. Não repita o óbvio nem descreva o gráfico. Diga o que MUDA UMA DECISÃO. Se nada mudou, diga isso — é uma resposta legítima e valiosa.
5. Escreva para um humano ocupado: frases curtas, sem jargão, sem "insights valiosos" e sem encher linguiça.

CONTEXTO ESTRATÉGICO JÁ MEDIDO (use, não recalcule):
- O Facebook é o motor de SEGUIDOR (converte por alcance). Kwai e TikTok entregam muita view e pouco seguidor.
- No Facebook o resultado é LOTERIA: poucos vídeos carregam quase todo o crescimento. A decisão certa não é "melhorar a média", é aumentar a chance de acerto e reagir rápido ao vídeo que pega.
- O tema é o sinal mais forte de acerto no Facebook. Os campos temasFacebook e fila mostram o placar atual e o que vem pela frente.

Responda APENAS com JSON válido neste formato:
{
  "leitura": "2 a 4 frases explicando o que está acontecendo e por quê",
  "faca": ["ação concreta", "..."],
  "evite": ["o que não fazer agora", "..."],
  "observe": ["o que vigiar nos próximos dias", "..."],
  "itens": [{"tipo": "fato|tendencia|hipotese|caminho", "texto": "uma linha"}]
}
Máximo 3 itens em cada lista. Se uma lista não tiver nada relevante, devolva [].`

async function redigir(fatos: unknown, trends: string[]): Promise<Parecer> {
  const prompt = `${INSTRUCAO}

FATOS (JSON, todos verdadeiros e já calculados):
${JSON.stringify(fatos, null, 1)}

TRENDS (Trend Tops da semana; se vazio, não mencione tendências):
${trends.length ? JSON.stringify(trends) : '[]'}`

  const { content } = await callOpenAI(prompt, {
    model: MODELO,
    temperature: 0.3,
    max_tokens: 1200,
    json_mode: true,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let j: any = {}
  try {
    j = JSON.parse(content)
  } catch {
    j = { leitura: content.slice(0, 600) }
  }

  const lista = (x: unknown): string[] =>
    Array.isArray(x) ? x.filter((v) => typeof v === 'string').slice(0, 3) : []

  return {
    geradoEm: new Date().toISOString(),
    leitura: typeof j.leitura === 'string' ? j.leitura : '',
    faca: lista(j.faca),
    evite: lista(j.evite),
    observe: lista(j.observe),
    itens: Array.isArray(j.itens)
      ? j.itens
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((i: any) => i && typeof i.texto === 'string')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((i: any) => ({
            tipo: ['fato', 'tendencia', 'hipotese', 'caminho'].includes(i.tipo) ? i.tipo : 'fato',
            texto: String(i.texto),
          }))
          .slice(0, 8)
      : [],
    modelo: MODELO,
  }
}
