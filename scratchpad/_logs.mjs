import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
const env = Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,'')]}))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL||env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const { data, error } = await sb.schema('pulso_content').from('logs_workflows').select('workflow_name, status, created_at').order('created_at',{ascending:false}).limit(200)
if (error) { console.log('ERRO:', error.message); process.exit(1) }
const st = new Set(data.map(d=>d.status)); const wf = new Set(data.map(d=>d.workflow_name))
console.log('status ja usados :', [...st].join(' | '))
console.log('workflows recentes:', [...wf].join(' | '))
console.log('RECONCILIAR ja loga?', data.some(d=>d.workflow_name.includes('RECONCILIAR')) ? 'sim' : 'NAO — este e o buraco')
