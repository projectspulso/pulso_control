// Reproduz o matching de reconciliar-publicacoes contra o acervo REAL do PULSO, para responder
// as 3 perguntas do Limelight com dado e nao de memoria.
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] })
)
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const STOP = new Set('de do da dos das o a os as e que um uma em no na para por com se ao the of to is'.split(' '))
const tokens = (s) => new Set(((s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().match(/[a-z0-9]+/g) || []).filter((t) => t.length > 2 && !STOP.has(t)))
const jac = (a, b) => { if (!a.size || !b.size) return 0; let i = 0; for (const t of a) if (b.has(t)) i++; return i / (a.size + b.size - i) }

const [{ data: ideias }, { data: pipe }, { data: pubs }] = await Promise.all([
  sb.schema('pulso_content').from('ideias').select('id, titulo, status, formato'),
  sb.schema('pulso_content').from('pipeline_producao').select('ideia_id, metadata'),
  sb.schema('pulso_content').from('metricas_publicacao').select('ideia_id, plataforma, metadata'),
])

// TESTE 2 do Limelight: consulta = TITULO da ideia · ancora = LEGENDA gerada. Textos DIFERENTES.
// (o meu primeiro teste era degenerado: consulta == ancora, best=1,00 sempre — nao mede nada)
const ancora = []
const legendaDe = new Map()
for (const p of pipe) { const c = p.metadata?.caption; if (p.ideia_id && c) { ancora.push({ id: p.ideia_id, toks: tokens(String(c)) }); legendaDe.set(p.ideia_id, String(c)) } }

function casar(texto) {
  const t = tokens(texto)
  const porIdeia = new Map()
  for (const a of ancora) { const s = jac(t, a.toks); if (s > (porIdeia.get(a.id) ?? 0)) porIdeia.set(a.id, s) }
  let best = 0, second = 0, id = null
  for (const [k, s] of porIdeia) { if (s > best) { second = best; best = s; id = k } else if (s > second) second = s }
  return { id, best, second }
}

const consultas = []
for (const i of ideias) {
  if (i.status === 'DESCARTADA' || i.formato === 'longo') continue
  if (i.titulo && legendaDe.has(i.id)) consultas.push({ esperado: i.id, texto: i.titulo, rede: 'titulo' })
}

console.log('ancoras:', ancora.length, '| ideias distintas:', new Set(ancora.map(a => a.id)).size, '| consultas:', consultas.length)

const LIM_BEST = 0.25, LIM_MARGEM = 0.15
let aceitos = 0, aceitosCertos = 0, revisao = 0, revisaoQueEstavaCerta = 0
const bests = [], seconds = [], margens = []
const exemplosRevisao = []

for (const q of consultas) {
  const { id, best, second } = casar(q.texto)
  bests.push(best); seconds.push(second); margens.push(best - second)
  const aceita = id && best >= LIM_BEST && best - second >= LIM_MARGEM
  const topoCerto = id === q.esperado
  if (aceita) { aceitos++; if (topoCerto) aceitosCertos++ }
  else { revisao++; if (topoCerto) { revisaoQueEstavaCerta++; if (exemplosRevisao.length < 5) exemplosRevisao.push({ best: best.toFixed(2), margem: (best - second).toFixed(2), t: q.texto.slice(0, 48) }) } }
}
const med = (a) => { const o = [...a].sort((x, y) => x - y); return o[Math.floor(o.length / 2)] }
const pct = (n) => (n / consultas.length * 100).toFixed(1) + '%'

console.log('\n=== COM O LIMIAR DO PULSO (best>=0,25 E margem>=0,15) ===')
console.log('  aceitos      :', aceitos, `(${pct(aceitos)})`, '· destes, corretos:', aceitosCertos, aceitos ? `(${(aceitosCertos/aceitos*100).toFixed(1)}%)` : '')
console.log('  FILA REVISÃO :', revisao, `(${pct(revisao)})`, '· destes, o topo JÁ estava certo:', revisaoQueEstavaCerta)
console.log('\n=== DISTRIBUIÇÃO ===')
console.log('  best   : mediana', med(bests).toFixed(2), '· min', Math.min(...bests).toFixed(2), '· max', Math.max(...bests).toFixed(2))
console.log('  second : mediana', med(seconds).toFixed(2), '· MAX (piso de ruído)', Math.max(...seconds).toFixed(2))
console.log('  margem : mediana', med(margens).toFixed(2), '· min', Math.min(...margens).toFixed(2))

console.log('\n=== SÓ MARGEM, SEM PISO (a pergunta 2) ===')
for (const m of [0.05, 0.10, 0.15, 0.20]) {
  let ac = 0, cert = 0
  for (const q of consultas) { const r = casar(q.texto); if (r.id && r.best - r.second >= m) { ac++; if (r.id === q.esperado) cert++ } }
  console.log(`  margem>=${m.toFixed(2)}: aceita ${ac} (${pct(ac)}) · corretos ${cert}` + (ac ? ` (${(cert/ac*100).toFixed(1)}%)` : '') + ` · ERRADOS ${ac-cert}`)
}
if (exemplosRevisao.length) { console.log('\nexemplos que foram para revisão MAS o topo estava certo:'); for (const e of exemplosRevisao) console.log(`  best ${e.best} margem ${e.margem} — ${e.t}`) }

// ===== TESTE EXTRA: Jaccard PONDERADO POR RARIDADE (IDF) =====
// Hipotese: o problema do vocabulario estreito nao e o LIMIAR, e o Jaccard tratar todo token
// igual. Num corpus de 28 episodios sobre oculos, "oculos" nao distingue nada e ainda assim
// pesa igual ao termo que distingue. Peso por raridade deveria separar os dois.
const df = new Map()
for (const a of ancora) for (const t of a.toks) df.set(t, (df.get(t) || 0) + 1)
const N = ancora.length
const idf = (t) => Math.log(N / (1 + (df.get(t) || 0)))

function jacIDF(A, B) {
  if (!A.size || !B.size) return 0
  let inter = 0, uni = 0
  const todos = new Set([...A, ...B])
  for (const t of todos) { const w = Math.max(0, idf(t)); if (A.has(t) && B.has(t)) inter += w; uni += w }
  return uni ? inter / uni : 0
}
function casarIDF(texto) {
  const t = tokens(texto)
  const porIdeia = new Map()
  for (const a of ancora) { const s = jacIDF(t, a.toks); if (s > (porIdeia.get(a.id) ?? 0)) porIdeia.set(a.id, s) }
  let best = 0, second = 0, id = null
  for (const [k, s] of porIdeia) { if (s > best) { second = best; best = s; id = k } else if (s > second) second = s }
  return { id, best, second }
}

console.log('\n=== JACCARD PONDERADO POR RARIDADE (IDF) ===')
let topoCertoIDF = 0
const bIDF = [], sIDF = []
for (const q of consultas) { const r = casarIDF(q.texto); bIDF.push(r.best); sIDF.push(r.second); if (r.id === q.esperado) topoCertoIDF++ }
console.log('  topo correto:', topoCertoIDF, '/', consultas.length, `(${(topoCertoIDF/consultas.length*100).toFixed(1)}%)`)
console.log('  best   : mediana', med(bIDF).toFixed(2), '· min', Math.min(...bIDF).toFixed(2))
console.log('  second : mediana', med(sIDF).toFixed(2), '· MAX (piso de ruído)', Math.max(...sIDF).toFixed(2))
for (const [pb, pm] of [[0.10,0.05],[0.15,0.05],[0.20,0.10],[0.25,0.15]]) {
  let ac = 0, cert = 0
  for (const q of consultas) { const r = casarIDF(q.texto); if (r.id && r.best >= pb && r.best - r.second >= pm) { ac++; if (r.id === q.esperado) cert++ } }
  console.log(`  best>=${pb} margem>=${pm}: aceita ${ac} (${(ac/consultas.length*100).toFixed(1)}%) · corretos ${cert} · ERRADOS ${ac-cert}`)
}
