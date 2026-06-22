import { callOpenAI } from './ai-clients'
import { buildPromptRefazerHook } from './prompts'
import { avaliarHook, primeiraFrase } from './hook-score'

/** Troca a primeira frase do roteiro pela nova, preservando o resto. */
function trocarPrimeiraFrase(conteudo: string, nova: string): string {
  const orig = primeiraFrase(conteudo)
  const limpa = nova.trim().replace(/^["'“”]+|["'“”]+$/g, '').trim()
  const idx = conteudo.indexOf(orig)
  if (idx === -1) return `${limpa}\n\n${conteudo}`
  return conteudo.slice(0, idx) + limpa + conteudo.slice(idx + orig.length)
}

export interface RoteiroParaRefazer {
  id: string
  titulo: string
  conteudo_md: string
  nota_hook: number | null
  versao: number | null
}

export interface RefazerHookResult {
  id: string
  ok: boolean
  antes: number
  depois: number
  novaFrase?: string
  erro?: string
}

/**
 * Reescreve SÓ a primeira frase (hook) via Gemini seguindo a trava dos 3s,
 * re-pontua e salva como nova versão. Núcleo reusado pelo single e pelo lote.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function refazerHookRoteiro(supabase: any, roteiro: RoteiroParaRefazer): Promise<RefazerHookResult> {
  const antes = roteiro.nota_hook ?? avaliarHook(roteiro.conteudo_md || '').nota
  try {
    if (!roteiro.conteudo_md || roteiro.conteudo_md.length < 30) {
      return { id: roteiro.id, ok: false, antes, depois: antes, erro: 'roteiro sem conteúdo' }
    }
    const prompt = buildPromptRefazerHook(roteiro.titulo, roteiro.conteudo_md)
    const { content: resposta } = await callOpenAI(prompt, { temperature: 0.9, max_tokens: 120 })
    const nova = (resposta || '').split('\n').map((l) => l.trim()).filter(Boolean)[0] || ''
    if (nova.length < 8) {
      return { id: roteiro.id, ok: false, antes, depois: antes, erro: 'IA não retornou frase válida' }
    }
    const novoConteudo = trocarPrimeiraFrase(roteiro.conteudo_md, nova)
    const depois = avaliarHook(novoConteudo).nota
    const { error } = await supabase
      .schema('pulso_content')
      .from('roteiros')
      .update({ conteudo_md: novoConteudo, nota_hook: depois, versao: (roteiro.versao || 1) + 1 })
      .eq('id', roteiro.id)
    if (error) return { id: roteiro.id, ok: false, antes, depois: antes, erro: error.message }
    return { id: roteiro.id, ok: true, antes, depois, novaFrase: nova.replace(/^["'“”]+|["'“”]+$/g, '').trim() }
  } catch (e) {
    return { id: roteiro.id, ok: false, antes, depois: antes, erro: e instanceof Error ? e.message : 'erro' }
  }
}
