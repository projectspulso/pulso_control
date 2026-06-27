import { callOpenAI } from '@/lib/automation/ai-clients'

/**
 * Núcleo do CÉREBRO do worker de render: do roteiro (narração) gera o roteiro VISUAL
 * — ~10 cenas de b-roll para o Veo + o BASE de estilo. Usado pela rota
 * /api/automation/gerar-cenas e (best-effort) pelo gerar-audio, pra que o
 * pipeline já chegue em AUDIO_GERADO com metadata.cenas pronto pro worker.
 */

const SYSTEM = `Você é diretor de arte de vídeos curtos verticais (9:16) do canal PULSO (curiosidades, mistérios, psicologia, história). Sua tarefa: transformar a NARRAÇÃO em um roteiro VISUAL de b-roll para o gerador de vídeo Veo.

Responda APENAS um JSON válido no formato:
{"slug":"<slug_curto_sem_espacos>","base":"<frase de estilo que prefixa toda cena>","scenes":[{"name":"s1_xxx","prompt":"<descrição visual em inglês>"}, ... ]}

REGRAS DURAS (obrigatórias):
- Exatamente 10 cenas, nomes s1_... até s10_..., a última DEVE ser "s10_cta".
- prompts em INGLÊS, cinematográficos, descritivos, terminando com "slow" ou movimento de câmera lento.
- As 10 cenas seguem a NARRAÇÃO na ordem, cobrindo do início ao fim (cada cena ~1/10 da história).
- s10_cta = cena calma e convidativa, com "wide empty space at the top" (espaço pro mascote) e "slow pull-back".
- PROIBIDO: pessoas, rostos visíveis, crianças (o Veo recusa "kids/children" — use objetos, cenários, animais, mãos no máximo), texto legível, logos, marcas, gore.
- Futebol = SOCCER (association football): bola REDONDA, gol com rede, gramado. NUNCA futebol americano, capacete, bola oval.
- "base" é um prefixo curto de estilo coerente com o tema. Sempre inclua "no people, no readable text, no logos" no base.
- Sem texto explicativo fora do JSON.`

const PROIBIDO = /\b(kid|kids|child|children|american football|helmet|gridiron)\b/i

export interface CenasResult {
  slug: string
  base: string
  scenes: { name: string; prompt: string }[]
}

/**
 * Gera e valida as cenas. Lança Error com mensagem clara se o LLM falhar/violar travas.
 * Persiste em pipeline_producao.metadata.cenas (best-effort) quando há pipeline.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function gerarCenas(supabase: any, opts: { ideia_id?: string; roteiro_id?: string }): Promise<CenasResult> {
  let roteiro
  if (opts.roteiro_id) {
    const { data } = await supabase.schema('pulso_content').from('roteiros').select('id, ideia_id, titulo, conteudo_md, canal_id').eq('id', opts.roteiro_id).single()
    roteiro = data
  } else {
    const { data } = await supabase.schema('pulso_content').from('roteiros').select('id, ideia_id, titulo, conteudo_md, canal_id').eq('ideia_id', opts.ideia_id).order('versao', { ascending: false }).limit(1)
    roteiro = data?.[0]
  }
  if (!roteiro?.conteudo_md) throw new Error('Roteiro não encontrado para esta ideia')

  let canalNome = 'PULSO'
  if (roteiro.canal_id) {
    const { data: c } = await supabase.schema('pulso_core').from('canais').select('nome').eq('id', roteiro.canal_id).single()
    if (c?.nome) canalNome = c.nome
  }

  const userPrompt = `CANAL: ${canalNome}\nTÍTULO: ${roteiro.titulo}\n\nNARRAÇÃO:\n${roteiro.conteudo_md.trim()}`
  const { content } = await callOpenAI(`${SYSTEM}\n\n${userPrompt}`, { temperature: 0.7, max_tokens: 1600, json_mode: true })

  const jsonStr = (content || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
  let parsed
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error('LLM não retornou JSON válido')
  }

  const scenes = Array.isArray(parsed?.scenes) ? parsed.scenes : []
  const erros: string[] = []
  if (scenes.length !== 10) erros.push(`esperado 10 cenas, veio ${scenes.length}`)
  if (scenes.length && scenes[scenes.length - 1]?.name !== 's10_cta') erros.push('última cena deve ser s10_cta')
  for (const s of scenes) {
    if (!s?.name || !s?.prompt) { erros.push('cena sem name/prompt'); break }
    if (PROIBIDO.test(s.prompt)) { erros.push(`cena ${s.name} viola trava (pessoas/criança/football)`); break }
  }
  if (!parsed?.base || !parsed?.slug) erros.push('faltou base ou slug')
  if (erros.length) throw new Error('Cenas reprovadas nas travas: ' + erros.join('; '))

  const result: CenasResult = {
    slug: String(parsed.slug).toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 40),
    base: String(parsed.base),
    scenes: scenes.map((s: { name: string; prompt: string }) => ({ name: String(s.name), prompt: String(s.prompt) })),
  }

  try {
    const { data: pipe } = await supabase.schema('pulso_content').from('pipeline_producao').select('id, metadata').eq('ideia_id', roteiro.ideia_id).limit(1)
    if (pipe?.[0]) {
      await supabase.schema('pulso_content').from('pipeline_producao')
        .update({ metadata: { ...(pipe[0].metadata || {}), cenas: result, cenas_geradas_em: new Date().toISOString() } })
        .eq('id', pipe[0].id)
    }
  } catch (e) {
    console.error('[gerar-cenas] falha ao persistir cenas no pipeline (segue):', e)
  }

  return result
}
