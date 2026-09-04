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
  'PASSO 3 — dê o veredito, e a distinção aqui é o coração da tarefa:',
  '  veredito = "ok"      -> o roteiro bate com o que você sabe.',
  '  veredito = "errada"  -> você SABE um valor diferente. Só use quando puder dizer qual é o certo.',
  '  veredito = "nao_sei" -> você não consegue confirmar nem desmentir.',
  '"nao_sei" NÃO é acusação: é falta de aval, e é uma resposta honesta e esperada. Nunca marque',
  '"errada" só porque desconhece — sem valor alternativo, o veredito é "nao_sei".',
  '',
  'Exemplo real deste canal: o roteiro dizia "Em 1938, na Antártica, um fóssil de 300 milhões de',
  'anos". As florestas de Gondwana têm 260-280 milhões de anos -> "300 milhões" é "errada", com',
  'sabido = "260-280 milhões de anos". Sobre "1938", se você não conhece descoberta nessa data,',
  'o veredito é "nao_sei" — não "errada".',
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
    const afirmacoes = (j.afirmacoes || []).filter((a) => a && typeof a.trecho === 'string')
    return {
      afirmacoes,
      erradas: afirmacoes.filter((a) => a.veredito === 'errada'),
      naoConfirmadas: afirmacoes.filter((a) => a.veredito === 'nao_sei'),
      indisponivel: false,
      fontesVerificadas: false,
    }
  } catch {
    // Falha de checagem NÃO é aval. Quem chama trata `indisponivel` como "não sei", nunca como
    // "está limpo" — foi a distinção que faltou no dedup e custou um lote inteiro parecendo saturado.
    return vazio
  }
}
