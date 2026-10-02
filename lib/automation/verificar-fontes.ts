/**
 * FONTE DE VERDADE DAS HISTÓRIAS — cada afirmação conferível do roteiro vai à web buscar prova.
 *
 * POR QUE (02/10/2026). A checagem de 04/09 (checagem-fatos.ts) é IA conferindo IA de memória: aponta
 * ONDE procurar, nunca confirma. E desde 05/09 nem isso ficava gravado — se alguém perguntasse "de
 * onde vocês tiraram isso?" num vídeo recente, não havia o que responder. O dono decidiu: as três
 * camadas (gravar a checagem, buscar a prova, resposta pronta) e a fonte FICA SÓ NO BANCO.
 *
 * COMO: cada afirmação vai ao modelo com busca na web (OpenAI Responses + web_search_preview), que
 * devolve status, URL e o trecho literal que comprova. E então NÓS abrimos a página e procuramos
 * esse trecho nela. Modelo fabrica citação com fluência — URL plausível, frase plausível, página
 * inexistente — e fonte inventada é pior que nenhuma. `verificada` só é true quando a página existe
 * e contém o que foi citado. O resto vira `sem_prova`, com a URL guardada como pista.
 *
 * Sem import de alias: roda com `node --experimental-strip-types` no teste.
 */

export type StatusFonte = 'confirmada' | 'contradita' | 'sem_prova'

export interface FonteDaAfirmacao {
  trecho: string
  status: StatusFonte
  /** true = abrimos a página e o trecho citado está lá */
  verificada: boolean
  url: string | null
  titulo: string | null
  citacao: string | null
  /** o valor que a fonte traz, quando diverge do roteiro */
  valorNaFonte: string | null
  observacao: string
}

export interface FontesDoVideo {
  quando: string
  total: number
  confirmadas: number
  contraditas: number
  semProva: number
  /** a busca não pôde ser feita (sem chave, erro de rede) — nunca confundir com "sem prova" */
  indisponivel: boolean
  itens: FonteDaAfirmacao[]
}

const semAcento = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '')
export const normalizar = (x: string) => semAcento((x || '').toLowerCase()).replace(/\s+/g, ' ').trim()
const numeros = (x: string) => (x.match(/\d[\d.,]*\d|\d/g) || []).map((n) => n.replace(/[.,]/g, '')).filter((n) => n.length >= 2)

/**
 * O trecho citado está na página? Aceita a frase quase literal OU os mesmos números com a maior
 * parte das palavras — páginas reformatam espaço, aspas e pontuação, então o literal puro falha à toa.
 */
export function paginaContem(paginaRaw: string, citacaoRaw: string): boolean {
  const pagina = normalizar(paginaRaw).replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ')
  const cit = normalizar(citacaoRaw).replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim()
  if (cit.length < 12) return false
  if (pagina.includes(cit.slice(0, 80))) return true
  const paginaNum = pagina.replace(/(\d) (?=\d{3}\b)/g, '$1')
  const nums = numeros(citacaoRaw)
  if (nums.length && !nums.every((n) => paginaNum.includes(n))) return false
  const palavras = [...new Set(cit.split(' ').filter((w) => w.length >= 5))]
  if (palavras.length < 3) return false
  const achadas = palavras.filter((w) => pagina.includes(w)).length
  return achadas / palavras.length >= 0.6
}

function extrairJson(texto: string): Record<string, unknown> | null {
  const m = texto.match(/\{[\s\S]*\}/)
  if (!m) return null
  try {
    return JSON.parse(m[0])
  } catch {
    return null
  }
}

const PROMPT = (trecho: string) => [
  'Você confere fatos para um canal de vídeos curtos de história e curiosidades.',
  'PESQUISE NA WEB a afirmação abaixo e responda SOMENTE com JSON, sem texto fora dele:',
  '{"status":"confirmada|contradita|sem_prova","url":"página exata usada","titulo":"título da página",',
  '"citacao":"trecho LITERAL copiado da página que comprova ou contradiz (até 250 caracteres)",',
  '"valor_na_fonte":"o valor que a fonte traz, se diferente do afirmado, senão null","observacao":"curta"}',
  'Prefira enciclopédias, instituições, museus, universidades e imprensa reconhecida.',
  'Arredondamento fiel não é contradição ("384 mil km" para 384.400). Só "contradita" se a fonte',
  'traz um fato materialmente diferente. Se não achar fonte clara: status "sem_prova", url null.',
  'NUNCA invente URL nem citação — copie da página que você realmente leu.',
  '',
  `AFIRMAÇÃO: ${trecho}`,
].join('\n')

async function buscarUma(trecho: string, apiKey: string, prazoMs: number): Promise<FonteDaAfirmacao> {
  const vazio: FonteDaAfirmacao = {
    trecho, status: 'sem_prova', verificada: false, url: null, titulo: null, citacao: null, valorNaFonte: null, observacao: '',
  }
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), prazoMs)
  try {
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: ctl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        tools: [{ type: 'web_search_preview', search_context_size: 'low' }],
        input: PROMPT(trecho),
      }),
    })
    if (!r.ok) return { ...vazio, observacao: `busca falhou (${r.status})` }
    const j = await r.json()
    const mensagens = ((j?.output || []) as Array<{ type: string; content?: Array<{ type: string; text?: string; annotations?: Array<{ type: string; url?: string; title?: string }> }> }>)
      .filter((o) => o.type === 'message')
      .flatMap((o) => o.content || [])
      .filter((c) => c.type === 'output_text')
    const texto = mensagens.map((c) => c.text || '').join('\n')
    const citadas = mensagens.flatMap((c) => c.annotations || []).filter((a) => a.type === 'url_citation' && a.url)
    const d = extrairJson(texto) || {}
    const str = (v: unknown) => (typeof v === 'string' && v.trim() && v.trim().toLowerCase() !== 'null' ? v.trim() : null)
    const url = str(d.url) || citadas[0]?.url || null
    const base: FonteDaAfirmacao = {
      trecho,
      status: d.status === 'confirmada' || d.status === 'contradita' ? d.status : 'sem_prova',
      verificada: false,
      url: url ? url.replace(/[?&]utm_source=openai$/, '') : null,
      titulo: str(d.titulo) || citadas[0]?.title || null,
      citacao: str(d.citacao),
      valorNaFonte: str(d.valor_na_fonte),
      observacao: str(d.observacao) || '',
    }
    return base
  } catch (e) {
    return { ...vazio, observacao: e instanceof Error && e.name === 'AbortError' ? 'busca estourou o prazo' : 'busca falhou' }
  } finally {
    clearTimeout(t)
  }
}

/** Abre a página e confere a citação. Página que não abre não prova nada. */
async function conferirPagina(f: FonteDaAfirmacao, prazoMs: number): Promise<FonteDaAfirmacao> {
  if (!f.url || !f.citacao || f.status === 'sem_prova') {
    return { ...f, status: 'sem_prova', verificada: false }
  }
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), prazoMs)
  try {
    const r = await fetch(f.url, {
      signal: ctl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PulsoFactCheck/1.0)', Accept: 'text/html,*/*' },
    })
    if (!r.ok) return { ...f, status: 'sem_prova', verificada: false, observacao: `${f.observacao} [página respondeu ${r.status}]`.trim() }
    const html = (await r.text()).slice(0, 1_500_000)
    const texto = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    if (paginaContem(texto, f.citacao)) return { ...f, verificada: true }
    return { ...f, status: 'sem_prova', verificada: false, observacao: `${f.observacao} [citação não encontrada na página]`.trim() }
  } catch {
    return { ...f, status: 'sem_prova', verificada: false, observacao: `${f.observacao} [página não abriu]`.trim() }
  } finally {
    clearTimeout(t)
  }
}

/** Data e número primeiro: é onde roteiro de vídeo curto mais erra, e o que mais se contesta. */
export function escolherAfirmacoes<T extends { trecho: string; tipo?: string }>(afirmacoes: T[], max = 6): T[] {
  const peso = (a: T) => (/\d/.test(a.trecho) ? 0 : a.tipo === 'nome' || a.tipo === 'lugar' ? 1 : 2)
  return [...afirmacoes].sort((a, b) => peso(a) - peso(b)).slice(0, max)
}

export async function verificarFontes(
  afirmacoes: Array<{ trecho: string; tipo?: string }>,
  opts: { apiKey?: string; max?: number; prazoBuscaMs?: number; prazoPaginaMs?: number } = {}
): Promise<FontesDoVideo> {
  const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY
  const quando = new Date().toISOString()
  const alvo = escolherAfirmacoes(afirmacoes, opts.max ?? 6)
  if (!apiKey || alvo.length === 0) {
    return { quando, total: 0, confirmadas: 0, contraditas: 0, semProva: 0, indisponivel: !apiKey, itens: [] }
  }
  const brutos = await Promise.all(alvo.map((a) => buscarUma(a.trecho, apiKey, opts.prazoBuscaMs ?? 40_000)))
  const itens = await Promise.all(brutos.map((f) => conferirPagina(f, opts.prazoPaginaMs ?? 8_000)))
  const falhasDeBusca = brutos.filter((b) => b.observacao.startsWith('busca')).length
  return {
    quando,
    total: itens.length,
    confirmadas: itens.filter((i) => i.status === 'confirmada').length,
    contraditas: itens.filter((i) => i.status === 'contradita').length,
    semProva: itens.filter((i) => i.status === 'sem_prova').length,
    indisponivel: falhasDeBusca === itens.length,
    itens,
  }
}

/**
 * A trava: fonte que CONTRADIZ segura o roteiro; falta de prova só segura quando é a maioria —
 * "não achei" sobre uma afirmação é falta de aval, sobre quase todas já é cheiro de invenção.
 */
export function fontesSeguramRoteiro(f: FontesDoVideo | null): boolean {
  if (!f || f.indisponivel || f.total === 0) return false
  return f.contraditas > 0 || f.semProva / f.total > 0.5
}

/** Para colar quando alguém perguntar "de onde vocês tiraram isso?". Só fontes verificadas. */
export function respostaPronta(f: FontesDoVideo | null): string | null {
  const boas = (f?.itens || []).filter((i) => i.verificada && i.status === 'confirmada' && i.url)
  if (!boas.length) return null
  const unicas = [...new Map(boas.map((i) => [new URL(i.url!).hostname, i])).values()].slice(0, 3)
  const lista = unicas.map((i) => `${i.titulo ? `${i.titulo} — ` : ''}${i.url}`).join('\n')
  return `Boa pergunta! A história se apoia nestas fontes:\n${lista}\nSegue o Pulso pra mais histórias assim!`
}
