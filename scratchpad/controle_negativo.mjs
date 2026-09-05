// O CONTROLE NEGATIVO QUE EU NAO TINHA FEITO.
// O meu calibra_jaccard.mjs mede so um lado: dada uma consulta que TEM resposta certa entre as
// ancoras, o topo esta certo? Isso nao diz nada sobre o caso oposto — consulta que NAO tem dono
// nenhum ali. E foi exatamente o buraco que o Limelight achou no teste DELE, depois de eu contar
// que o meu primeiro teste era degenerado. O buraco e o mesmo nos dois. Aqui eu corrijo o meu.
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
const env = Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,'')]}))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL||env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const STOP=new Set('de do da dos das o a os as e que um uma em no na para por com se ao the of to is'.split(' '))
const tk=s=>new Set(((s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/[a-z0-9]+/g)||[]).filter(t=>t.length>2&&!STOP.has(t)))
const jac=(a,b)=>{if(!a.size||!b.size)return 0;let i=0;for(const t of a)if(b.has(t))i++;return i/(a.size+b.size-i)}

const [{data:ideias},{data:pipe}] = await Promise.all([
  sb.schema('pulso_content').from('ideias').select('id, titulo, status, formato'),
  sb.schema('pulso_content').from('pipeline_producao').select('ideia_id, metadata'),
])
const comLegenda = new Map()
for (const p of pipe) { const c = p.metadata?.caption; if (p.ideia_id && c) comLegenda.set(p.ideia_id, String(c)) }

// METADE DAS ANCORAS SAI. As consultas das ideias removidas viram ORFAO DE VERDADE: o dono
// correto NAO esta no conjunto, entao QUALQUER aceite e falso positivo. Sem inventar texto.
const ids = [...comLegenda.keys()]
const fora = new Set(ids.filter((_, i) => i % 2 === 1))
const ancora = ids.filter(id => !fora.has(id)).map(id => ({ id, toks: tk(comLegenda.get(id)) }))

function casar(txt, idf){const t=tk(txt);const m=new Map()
  for(const a of ancora){const s=idf?jacIDF(t,a.toks):jac(t,a.toks); if(s>(m.get(a.id)??0))m.set(a.id,s)}
  let best=0,second=0,id=null
  for(const [k,s] of m){if(s>best){second=best;best=s;id=k}else if(s>second)second=s}
  return {id,best,second}}
const df=new Map(); for(const a of ancora) for(const t of a.toks) df.set(t,(df.get(t)||0)+1)
const N=ancora.length, idfw=t=>Math.max(0,Math.log(N/(1+(df.get(t)||0))))
function jacIDF(A,B){if(!A.size||!B.size)return 0;let i=0,u=0
  for(const t of new Set([...A,...B])){const w=idfw(t); if(A.has(t)&&B.has(t))i+=w; u+=w}
  return u?i/u:0}

const titulo = new Map(ideias.map(i=>[i.id,i.titulo]))
const orfaos = [...fora].map(id=>titulo.get(id)).filter(Boolean)   // sem dono no conjunto
const legitimos = ancora.map(a=>({texto:titulo.get(a.id), esperado:a.id})).filter(x=>x.texto)
console.log('ancoras:', ancora.length, '| consultas LEGITIMAS:', legitimos.length, '| ORFAS (sem dono):', orfaos.length)

console.log('\ncorte              | legitimos aceitos | ORFAOS ACEITOS (= falso positivo)')
for (const modo of ['puro','idf']) {
  console.log(`--- Jaccard ${modo.toUpperCase()}`)
  for (const m of [0.05,0.10,0.12,0.15,0.20]) {
    let ok=0, fp=0
    for (const l of legitimos){const r=casar(l.texto, modo==='idf'); if(r.id&&r.best-r.second>=m&&r.id===l.esperado)ok++}
    for (const o of orfaos)   {const r=casar(o, modo==='idf');       if(r.id&&r.best-r.second>=m)fp++}
    console.log(`  margem>=${m.toFixed(2)}     | ${String(ok).padStart(3)}/${legitimos.length}          | ${String(fp).padStart(3)}/${orfaos.length}${fp===0?'   <- zero':''}`)
  }
}
