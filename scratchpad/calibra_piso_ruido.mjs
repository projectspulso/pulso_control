import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
const env = Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,'')]}))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL||env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const STOP=new Set('de do da dos das o a os as e que um uma em no na para por com se ao the of to is'.split(' '))
const tokens=s=>new Set(((s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/[a-z0-9]+/g)||[]).filter(t=>t.length>2&&!STOP.has(t)))
const jac=(a,b)=>{if(!a.size||!b.size)return 0;let i=0;for(const t of a)if(b.has(t))i++;return i/(a.size+b.size-i)}
const [{data:ideias},{data:pipe}] = await Promise.all([
  sb.schema('pulso_content').from('ideias').select('id, titulo, status, formato'),
  sb.schema('pulso_content').from('pipeline_producao').select('ideia_id, metadata'),
])
const ancora=[], legendaDe=new Map()
for(const p of pipe){const c=p.metadata?.caption; if(p.ideia_id&&c){ancora.push({id:p.ideia_id,toks:tokens(String(c))});legendaDe.set(p.ideia_id,String(c))}}
function casar(texto){const t=tokens(texto);const m=new Map()
  for(const a of ancora){const s=jac(t,a.toks); if(s>(m.get(a.id)??0))m.set(a.id,s)}
  let best=0,second=0,id=null
  for(const [k,s] of m){if(s>best){second=best;best=s;id=k}else if(s>second)second=s}
  return {id,best,second}}
const consultas=[]
for(const i of ideias){if(i.status==='DESCARTADA'||i.formato==='longo')continue; if(i.titulo&&legendaDe.has(i.id))consultas.push({esperado:i.id,texto:i.titulo})}
const R = consultas.map(q=>({...casar(q.texto), esperado:q.esperado}))
const pctl=(arr,p)=>{const o=[...arr].sort((a,b)=>a-b);return o[Math.min(o.length-1,Math.floor(o.length*p))]}
const seconds=R.map(r=>r.second), bestsCertos=R.filter(r=>r.id===r.esperado).map(r=>r.best)

console.log('=== O QUE O PISO POR RUIDO ENFRENTA, NO NOSSO ACERVO ===')
console.log('  second  : max', Math.max(...seconds).toFixed(3), '· p99', pctl(seconds,0.99).toFixed(3), '· p95', pctl(seconds,0.95).toFixed(3), '· p90', pctl(seconds,0.90).toFixed(3), '· mediana', pctl(seconds,0.5).toFixed(3))
console.log('  best LEGITIMO (topo certo): mediana', pctl(bestsCertos,0.5).toFixed(3), '· p25', pctl(bestsCertos,0.25).toFixed(3), '· p10', pctl(bestsCertos,0.10).toFixed(3), '· max', Math.max(...bestsCertos).toFixed(3))
console.log('\n=== piso = second_X + folga (mantendo margem>=0,15) ===')
for(const [nome,base] of [['max',Math.max(...seconds)],['p99',pctl(seconds,0.99)],['p95',pctl(seconds,0.95)],['p90',pctl(seconds,0.90)]]) {
  for(const folga of [0, 0.02]) {
    const piso = base + folga
    let ac=0,cert=0
    for(const r of R){ if(r.id && r.best>=piso && r.best-r.second>=0.15){ac++; if(r.id===r.esperado)cert++} }
    console.log(`  ${nome}${folga?'+0,02':''} => piso ${piso.toFixed(3)} | aceita ${ac} (${(ac/R.length*100).toFixed(1)}%) · corretos ${cert} · ERRADOS ${ac-cert}`)
  }
}
