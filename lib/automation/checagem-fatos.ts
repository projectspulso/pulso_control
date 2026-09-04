/**
 * CHECAGEM DE FATOS — a trava que faltava, e a que mais custa não ter.
 *
 * O QUE ACONTECEU (04/09/2026). O vídeo #189 foi ao ar dizendo "Em 1938, na Antártica, um fóssil de
 * 300 milhões de anos". A floresta fóssil que ele descreve — Glossopteris, Gondwana, antes dos
 * dinossauros — tem 260 a 280 milhões de anos, e nenhum evento de 1938 corresponde à descoberta: o
 * marco histórico é a expedição de Scott (início de 1900) e os trabalhos modernos são de 2017 e
 * 2020. Era certa, número inflado, data inventada. Já estava publicado, com 1.621 views no
 * Facebook e 1.402 no Instagram.
 *
 * POR QUE PASSOU. O `validarRoteiro` pontua FORMA e só forma: hook 25, CTA 25, duração 25, tamanho
 * 15, parágrafos 10. Um roteiro tira 100 com toda data inventada. O prompt sempre mandou "SOMENTE
 * fatos reais e verificáveis" — e nada nunca conferiu. Medido no acervo: 160 de 211 roteiros (76%)
 * afirmam um ano específico, 165 (78%) fazem alguma afirmação checável, e ZERO passaram por
 * verificação. 162 desses já foram ao ar.
 *
 * A PRESSÃO QUE NÓS MESMOS CRIAMOS. Em 03/09 o prompt ganhou a regra "NOMEIE O CASO", com o número
 * medido por trás (439 views quando o roteiro nomeia, 230 quando não). Ela está certa, mas
 * recompensa especificidade — e sem verificação ao lado, empurra o modelo a produzir uma data
 * concreta mesmo quando não tem uma. Prevenir vem antes de detectar: o prompt de escrita passou a
 * dizer que OMITIR a data é preferível a inventá-la, e esta checagem é a rede embaixo disso.
 *
 * COMO A PERGUNTA É FEITA, E POR QUE ASSIM. "Isto está correto?" recebe "sim" de qualquer modelo
 * complacente. Aqui ele NÃO julga o roteiro: ele diz, de memória própria e antes de olhar, o valor
 * que conhece para cada afirmação — e só então os dois são comparados. Modelo que não sabe deve
 * dizer que não sabe; "não sei" sobre uma data que o roteiro afirma com precisão já é suspeita.
 *
 * O LIMITE, DECLARADO: IA checando IA é REDE, não garantia. Pega o que ela sabe estar errado —
 * um evento que não existe, um número fora da faixa conhecida — e perde o resto. Verificação de
 * verdade exigiria busca externa por afirmação, com outro custo e outra latência. Esta trava reduz
 * a superfície; não a fecha.
 */

export type TipoAfirmacao = 'data' | 'numero' | 'nome' | 'lugar' | 'outro'

export interface Afirmacao {
  /** o trecho do roteiro, como está escrito */
  trecho: string
  tipo: TipoAfirmacao
  /** o que o modelo sabe de forma independente — null quando ele não sabe */
  sabido: string | null
  /** true quando o que o roteiro diz bate com o que o modelo sabe */
  confere: boolean
  /** por que não confere, ou por que não deu para dizer */
  observacao: string
}

export interface ResultadoChecagem {
  afirmacoes: Afirmacao[]
  /** afirmações que NÃO conferem — o que segura a auto-aprovação */
  suspeitas: Afirmacao[]
  /** afirmações que o modelo não soube avaliar: não é erro, mas também não é aval */
  semResposta: number
  /** true = a checagem não pôde ser feita. Nunca confundir com "está tudo certo". */
  indisponivel: boolean
}

const PROMPT = [
  'Você confere fatos de roteiros de vídeos curtos de curiosidades e história.',
  '',
  'PASSO 1 — extraia do roteiro TODA afirmação verificável: datas, anos, quantidades, magnitudes',
  '(idades geológicas, distâncias, medidas), nomes próprios de pessoas, lugares e obras.',
  'Ignore o que é opinião, gancho ou chamada da marca — só o que pode ser conferido.',
  '',
  'PASSO 2 — para CADA afirmação, responda de MEMÓRIA PRÓPRIA qual é o valor correto.',
  'Não trate o roteiro como referência: ele pode estar errado, e é isso que você está checando.',
  'Se você não souber, escreva sabido = null. NÃO invente e NÃO chute para parecer útil.',
  '',
  'PASSO 3 — compare. confere = true só quando o roteiro bate com o que você sabe.',
  'confere = false quando você sabe que está errado OU quando o roteiro afirma com precisão algo',
  'que você não consegue confirmar que exista — data específica de um evento que você desconhece é',
  'suspeita, não neutralidade.',
  '',
  'Exemplo de suspeita real (caso verdadeiro deste canal): o roteiro dizia "Em 1938, na Antártica,',
  'um fóssil de 300 milhões de anos". As florestas fósseis antárticas de Gondwana têm 260-280',
  'milhões de anos, e não há descoberta conhecida de 1938 — o marco é a expedição de Scott, do',
  'início de 1900. Duas afirmações, as duas com confere = false.',
  '',
  'Responda APENAS JSON:',
  '{"afirmacoes":[{"trecho":"...","tipo":"data|numero|nome|lugar|outro","sabido":"..."|null,',
  '"confere":true|false,"observacao":"curta"}]}',
].join('\n')

export async function checarFatos(
  roteiro: string,
  callLLM: (prompt: string) => Promise<string>
): Promise<ResultadoChecagem> {
  const texto = (roteiro || '').slice(0, 4000)
  const vazio: ResultadoChecagem = { afirmacoes: [], suspeitas: [], semResposta: 0, indisponivel: true }
  if (!texto.trim()) return vazio

  try {
    const bruto = await callLLM(`${PROMPT}\n\nROTEIRO:\n${texto}`)
    const j = JSON.parse(bruto) as { afirmacoes?: Afirmacao[] }
    const afirmacoes = (j.afirmacoes || []).filter((a) => a && typeof a.trecho === 'string')
    return {
      afirmacoes,
      suspeitas: afirmacoes.filter((a) => a.confere === false),
      semResposta: afirmacoes.filter((a) => a.sabido == null).length,
      indisponivel: false,
    }
  } catch {
    // Falha de checagem NÃO é aval. Quem chama trata `indisponivel` como "não sei", nunca como
    // "está limpo" — foi a distinção que faltou no dedup e custou um lote inteiro parecendo saturado.
    return vazio
  }
}
