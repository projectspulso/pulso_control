import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
const env = Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,'')]}))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL||env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const { data, error } = await sb.schema('pulso_content').from('metricas_publicacao').select('*').limit(3)
if (error) { console.log('ERRO:', error.message); process.exit(1) }
console.log('colunas:', Object.keys(data[0]).join(', '))
for (const r of data) {
  console.log('\nplataforma:', r.plataforma, '| ideia_id:', r.ideia_id ? 'sim' : 'NULO')
  console.log('  metadata:', r.metadata ? JSON.stringify(r.metadata).slice(0,300) : String(r.metadata))
}
const { count } = await sb.schema('pulso_content').from('metricas_publicacao').select('*',{count:'exact',head:true})
console.log('\ntotal de linhas:', count)
// quantas tem metadata nao-nulo, por rede
const { data: all } = await sb.schema('pulso_content').from('metricas_publicacao').select('plataforma, metadata, ideia_id')
const por = {}
for (const r of all) {
  const k = r.plataforma
  por[k] = por[k] || { total:0, comMeta:0, chaves:new Set(), semIdeia:0 }
  por[k].total++
  if (r.metadata && Object.keys(r.metadata).length) { por[k].comMeta++; for (const c of Object.keys(r.metadata)) por[k].chaves.add(c) }
  if (!r.ideia_id) por[k].semIdeia++
}
console.log('\nrede | linhas | com metadata | sem ideia_id | chaves vistas')
for (const [k,v] of Object.entries(por)) console.log(` ${k}: ${v.total} | ${v.comMeta} | ${v.semIdeia} | ${[...v.chaves].slice(0,12).join(',')}`)
