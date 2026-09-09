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
 * A FONTE FICA NO BANCO, NUNCA NA TELA (decisão do dono, 04/09/2026). O motivo não é vaidade
 * editorial: é ter com que RESPONDER quando alguém contestar um número nos comentários — e o PULSO
 * responde em todos os lugares. Por isso a fonte é gravada por afirmação e recuperável na ficha do
 * vídeo, e não vira selo de autoridade para o público.
 *
 * E ELA NASCE MARCADA COMO NÃO VERIFICADA, de propósito. Modelo de linguagem fabrica citação com
 * fluência — nome de estudo plausível, ano plausível, revista plausível, tudo inexistente. Uma
 * fonte inventada é PIOR que fonte nenhuma, porque desarma a desconfiança de quem lê. Enquanto não
 * houver busca externa confirmando, `verificada` é false e a ficha diz isso em voz alta: serve para
 * o dono saber ONDE procurar antes de responder, nunca para ele responder direto citando.
 *
 * TRÊS ESTADOS, NÃO DOIS — e confundi-los na primeira versão inutilizou a trava. Rodada em 24
 * roteiros do acervo em 04/09/2026, ela acusou 12 com "suspeita", e quase nada era erro: eram
 * frases NARRATIVAS extraídas como se fossem afirmações ("o que desafia tudo o que sabemos",
 * "a resposta está na técnica de 5 minutos"), marcadas como não-conferidas porque o modelo não
 * tinha o que confirmar. Sinal que grita em tudo não avisa nada.
 *
 * A distinção que faltava: "eu sei que está errado" é diferente de "eu não sei". A primeira é
 * prova e trava a esteira; a segunda é ausência de informação e no máximo levanta a sobrancelha —
 * um roteiro com MUITAS afirmações não confirmáveis é suspeito no conjunto, não em cada linha.
 * E prosa não entra: só vira afirmação o que carrega data, número, nome próprio ou lugar.
 *
 * E A TERCEIRA CALIBRAGEM: casa decimal não é erro. Rodado o acervo inteiro (211 roteiros, 710
 * afirmações), 17 saíram como "errada" e só TRÊS eram exagero material — Tutancâmon com "mais de 20
 * mortes" quando o registro é 9, o Kryptos com "quase 1.800 letras" quando são 865, e o fóssil dos
 * 300 milhões. O resto era arredondamento fiel ("384 mil km" para 384.400), limite inferior
 * verdadeiro ("mais de 70 anos" quando são 73), comparação tratada como medida ("do tamanho de uma
 * toranja" contra "400 cm³") e até concordância lida como divergência. Roteiro de vídeo curto é
 * fala, não artigo: o que interessa é o erro que muda a história.
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
  /**
   * `ok`          — bate com o que o modelo sabe
   * `errada`      — o modelo sabe um valor DIFERENTE. É o único que prova erro e trava a esteira.
   * `nao_sei`     — afirmação concreta que o modelo não consegue confirmar. Não é erro; é falta de
   *                 aval. Muitas delas juntas é que viram sinal.
   */
  veredito: 'ok' | 'errada' | 'nao_sei'
  /** por que não confere, ou por que não deu para dizer */
  observacao: string
  /** onde o conhecimento está ancorado — NÃO verificado; ponto de partida da busca, não citação */
  fonte: string | null
}

export interface ResultadoChecagem {
  afirmacoes: Afirmacao[]
  /** o modelo sabe um valor diferente — a única prova de erro, e o que segura a auto-aprovação */
  erradas: Afirmacao[]
  /** concretas que ele não confirmou: não travam sozinhas, mas em quantidade são cheiro ruim */
  naoConfirmadas: Afirmacao[]
  /** true = a checagem não pôde ser feita. Nunca confundir com "está tudo certo". */
  indisponivel: boolean
  /** nenhuma fonte aqui passou por confirmação externa — o campo existe para ser honesto sobre isso */
  fontesVerificadas: false
}

const PROMPT = [
  'Você confere fatos de roteiros de vídeos curtos de curiosidades e história.',
  '',
  'PASSO 1 — extraia SÓ o que é conferível: afirmações que contenham DATA, NÚMERO, NOME PRÓPRIO ou',
  'LUGAR. Nada mais.',
  '',
  'UMA AFIRMAÇÃO POR ELEMENTO. Se a frase carrega data E número, ela vira DUAS entradas separadas,',
  'cada uma com seu tipo. Juntar afunda a checagem: "Em 1938 achou-se um fóssil de 300 milhões de',
  'anos" virando UM item faz o desconhecimento sobre 1938 engolir o erro dos 300 milhões, e a',
  'resposta sai "nao_sei" quando havia um erro provável ali dentro. Separe SEMPRE.',
  'O campo tipo recebe UM valor só — nunca "data|numero".',
  'NÃO extraia narrativa, suspense, opinião nem chamada da marca. Estas NÃO são afirmações e não',
  'devem aparecer na sua resposta:',
  '  "o que desafia tudo o que sabemos"  ·  "a resposta vai te surpreender"',
  '  "cientistas ficaram intrigados"     ·  "o mistério só aumenta"',
  'Se o roteiro inteiro não tiver nenhuma afirmação conferível, devolva a lista VAZIA. Isso é uma',
  'resposta correta e comum — não force extração para parecer útil.',
  '',
  'PASSO 2 — para CADA afirmação extraída, diga de MEMÓRIA PRÓPRIA o valor que você conhece.',
  'Não trate o roteiro como referência: ele pode estar errado, e é isso que você está checando.',
  'Se não souber, sabido = null. NÃO invente e NÃO chute.',
  '',
  'ANTES DO VEREDITO, o que NÃO é erro. Roteiro de vídeo curto é fala, não artigo científico:',
  '  · ARREDONDAMENTO fiel: "384 mil km" para 384.400 km · "um metro" para 1,1 m · "170 anos" para 169.',
  '  · LIMITE INFERIOR verdadeiro: "mais de 70 anos" quando são 73 está CORRETO. Só é erro quando',
  '    o número real fica ABAIXO do que o roteiro afirma ("mais de 20" quando são 9).',
  '  · COMPARAÇÃO e figura de linguagem: "do tamanho de uma toranja" não é medida e não se confere',
  '    contra "400 cm³".',
  '  · Afirmação que o seu conhecimento CONFIRMA, ainda que com detalhe a mais: se o roteiro diz',
  '    "Patrimônio da Humanidade pela UNESCO" e você sabe que foi reconhecida em 1980, isso é "ok" —',
  '    você concordou com ele.',
  'Marcar essas coisas como erradas afoga o sinal: numa passada por 211 roteiros, 17 foram acusadas',
  'e só 3 eram exagero material. O que interessa é o erro que muda a história, não a casa decimal.',
  '',
  'PASSO 3 — dê o veredito, e a distinção aqui é o coração da tarefa:',
  '  veredito = "ok"      -> o roteiro bate com o que você sabe.',
  '  veredito = "errada"  -> você SABE um valor diferente E a diferença MUDA a história: exagero,',
  '                          ordem de grandeza trocada, evento atribuído a outro lugar ou pessoa.',
  '                          Só use quando puder dizer qual é o certo.',
  '  veredito = "nao_sei" -> você não consegue confirmar nem desmentir.',
  '"nao_sei" NÃO é acusação: é falta de aval, e é uma resposta honesta e esperada. Nunca marque',
  '"errada" só porque desconhece — sem valor alternativo, o veredito é "nao_sei".',
  '',
  'Exemplo real deste canal, e é assim que a saída deve ficar. Roteiro: "Em 1938, na Antártica, um',
  'fóssil de 300 milhões de anos foi encontrado". Isso são DUAS entradas:',
  '  1) trecho "fóssil de 300 milhões de anos", tipo "numero", sabido "260-280 milhões de anos",',
  '     veredito "errada" — as florestas de Gondwana têm essa idade.',
  '  2) trecho "Em 1938", tipo "data", sabido null, veredito "nao_sei" — não conhecer descoberta',
  '     nessa data não basta para chamar de mentira.',
  'Uma entrada só, misturando as duas, seria resposta ERRADA à tarefa.',
  '',
  'PASSO 4 — para cada afirmação, diga ONDE o conhecimento está ancorado: o evento, a expedição, o',
  'estudo, a instituição ou o período de referência ("expedição de Scott, 1910-1913"; "artigo na',
  'Nature, abril de 2020").',
  'NÃO INVENTE FONTE. Fonte fabricada é pior que fonte nenhuma: faz informação errada parecer',
  'confiável. Sem saber, fonte = null — resposta aceitável e esperada.',
  '',
  'Responda APENAS JSON:',
  '{"afirmacoes":[{"trecho":"...","tipo":"data|numero|nome|lugar","sabido":"..."|null,',
  '"veredito":"ok|errada|nao_sei","observacao":"curta","fonte":"..."|null}]}',
].join('\n')

/**
 * TRAVA DO LIMITE ABERTO — em código, porque o prompt já pedia isso e o modelo não obedeceu.
 *
 * MEDIDO em 09/09/2026 sobre as 16 acusações que a checagem tinha acumulado em 211 roteiros:
 * QUATRO eram o mesmo engano. O roteiro afirma um limite aberto e o modelo devolve o valor exato
 * como se fosse contradição, quando o valor SATISFAZ o limite:
 *
 *   "mais de 300 anos antes"      x  "a Antártida foi avistada em 1820"   (1820−1513 = 307) ✔
 *   "mais de um milhão de dólares" x  "1,04 milhão de dólares"                              ✔
 *   "mais de 70 anos"              x  "73 anos"                                             ✔
 *   "Patrimônio da Humanidade"     x  "reconhecida como Patrimônio em 1980"  (acrescenta)   ✔
 *
 * Nos quatro o roteiro estava CERTO. Acusar aqui não é rigor, é ruído — e ruído em checagem de
 * fato custa caro duas vezes: gera revisão inútil e ensina quem lê a ignorar o alerta, que é como
 * o erro de verdade passa. Por isso a regra virou código: um `errada` cujo `sabido` satisfaz o
 * limite do próprio trecho é rebaixado a `ok`, com a observação preservada.
 *
 * Só rebaixa quando consegue LER os dois números. Se não conseguir, deixa como veio — a trava
 * corrige o engano que ela entende, não opina sobre o resto.
 */
// numeros por extenso, que o roteiro usa o tempo todo ("mais de um milhao de dolares") e o
// `sabido` quase nunca usa ("1,04 milhao"). Sem isto o lado do roteiro sai vazio e a trava desiste.
const EXTENSO: Record<string, string> = {
  um: '1', uma: '1', dois: '2', duas: '2', tres: '3', quatro: '4', cinco: '5',
  seis: '6', sete: '7', oito: '8', nove: '9', dez: '10', cem: '100', cento: '100',
}

function paresNumeroUnidade(txt: string): Array<{ n: number; unidade: string }> {
  const t = (txt || '').toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/(um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|cem|cento)/g,
             (w) => EXTENSO[w] ?? w)
    .replace(/(\d)[.\u00a0](\d{3})\b/g, '$1$2')
    .replace(/(\d),(\d)/g, '$1.$2')
  const pares: Array<{ n: number; unidade: string }> = []
  const re = /(\d+(?:\.\d+)?)\s*(milh(?:ões|ao|ão|oes)|mil)?\s*(?:de\s+)?([a-zà-ú]{3,})?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(t)) !== null) {
    const escala = m[2] ? (m[2].startsWith('milh') ? 1e6 : 1e3) : 1
    const unidade = (m[3] || '').replace(/s$/, '')
    if (unidade) pares.push({ n: parseFloat(m[1]) * escala, unidade })
  }
  return pares
}

/**
 * Só rebaixa quando os dois lados falam da MESMA unidade. Sem isso a trava compara um ano com uma
 * duração — em #23 ela devolvia "satisfeito" comparando 1820 com 300, e acertava por sorte. O caso
 * que me fez apertar é o inverso e é grave: um erro real como "mais de 20 pessoas" contra um
 * `sabido` que mencione qualquer ano ("9 pessoas, em 1923") seria APAGADO, porque 1923 >= 20.
 * Trava que esconde erro real é pior que o ruído que ela conserta.
 */
export function limiteAbertoSatisfeito(trecho: string, sabido: string | null): boolean {
  if (!sabido) return false
  const t = (trecho || '').toLowerCase()
  const paraCima = /\b(mais de|acima de|pelo menos|no m[ií]nimo|superior a)\b/.test(t)
  const paraBaixo = /\b(menos de|abaixo de|no m[aá]ximo|inferior a)\b/.test(t)
  if (!paraCima && !paraBaixo) return false

  const alvo = paresNumeroUnidade(t)
  const real = paresNumeroUnidade(sabido)
  if (!alvo.length || !real.length) return false

  return alvo.some((a) =>
    real.some((r) => r.unidade === a.unidade && (paraCima ? r.n >= a.n : r.n <= a.n))
  )
}

export async function checarFatos(
  roteiro: string,
  callLLM: (prompt: string) => Promise<string>
): Promise<ResultadoChecagem> {
  const texto = (roteiro || '').slice(0, 4000)
  const vazio: ResultadoChecagem = {
    afirmacoes: [], erradas: [], naoConfirmadas: [], indisponivel: true, fontesVerificadas: false,
  }
  if (!texto.trim()) return vazio

  try {
    const bruto = await callLLM(`${PROMPT}\n\nROTEIRO:\n${texto}`)
    const j = JSON.parse(bruto) as { afirmacoes?: Afirmacao[] }
    const afirmacoes = (j.afirmacoes || [])
      .filter((a) => a && typeof a.trecho === 'string')
      // o modelo às vezes devolve a STRING "null" em vez de null — sem isto, "não sei" viraria
      // um valor de referência inventado na tela da ficha
      .map((a) => ({
        ...a,
        sabido: a.sabido == null || String(a.sabido).toLowerCase() === 'null' ? null : a.sabido,
        fonte: a.fonte == null || String(a.fonte).toLowerCase() === 'null' ? null : a.fonte,
      }))
    // a trava do limite aberto age ANTES de qualquer contagem: o que ela rebaixa não conta como
    // erro em lugar nenhum, nem na tela nem no bloqueio da esteira
    const triadas = afirmacoes.map((a) =>
      a.veredito === 'errada' && limiteAbertoSatisfeito(a.trecho, a.sabido)
        ? { ...a, veredito: 'ok' as const,
            observacao: `${a.observacao || ''} [rebaixado: o valor conhecido satisfaz o limite aberto do roteiro]`.trim() }
        : a
    )
    return {
      afirmacoes: triadas,
      erradas: triadas.filter((a) => a.veredito === 'errada'),
      naoConfirmadas: triadas.filter((a) => a.veredito === 'nao_sei'),
      indisponivel: false,
      fontesVerificadas: false,
    }
  } catch {
    // Falha de checagem NÃO é aval. Quem chama trata `indisponivel` como "não sei", nunca como
    // "está limpo" — foi a distinção que faltou no dedup e custou um lote inteiro parecendo saturado.
    return vazio
  }
}
