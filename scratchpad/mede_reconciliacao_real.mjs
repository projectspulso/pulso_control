// ATENCAO — ESTE SCRIPT NAO MEDE O QUE O NOME PROMETE. Fica versionado como REGISTRO DE UM
// FALSO-NEGATIVO MEU, para ninguem rerodar e se enganar.
//
// Rodei em 05/09 esperando medir a reconciliacao real e ele devolveu "0 legendas" em todas as
// redes. A leitura preguicosa seria "o casador nao tem o que casar". A verdade e outra: as
// legendas NAO SAO PERSISTIDAS em metricas_publicacao.metadata (as chaves que existem la sao
// metodo, kwai_*, ig_total_views, registrado_por...). A rota busca as legendas da Graph API AO
// VIVO, a cada rodada, e nao guarda nenhuma. Entao a medicao offline do caso de producao e
// IMPOSSIVEL com o dado que temos — nao porque nao ha casamento, mas porque nao ha registro dele.
//
// Foi essa descoberta que motivou a correcao do mesmo dia: a rota passou a gravar a prova do
// casamento em metadata.casamento e a rodada inteira em logs_workflows. A partir de agora este
// script passa a ter o que medir; antes de 05/09, nao tinha.
//
// Conferido no mesmo dia: as 826 linhas de metricas_publicacao tem ideia_id — ZERO orfaos hoje.
// O buraco era de auditoria, nao de cobertura.

// O caso de PRODUCAO do PULSO, nao o do Limelight: ancora = legenda do Instagram (auto-registrada
// pela Graph API), consulta = legenda do post que veio de FORA do app (FB manual, TikTok no
// celular, YT Studio). O cabecalho da rota assume que a legenda foi COLADA identica ao publicar
// manual. Isto mede se essa premissa se sustenta no acervo real.
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
const env = Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,'')]}))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL||env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const STOP=new Set('de do da dos das o a os as e que um uma em no na para por com se ao the of to is'.split(' '))
const tk=s=>new Set(((s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/[a-z0-9]+/g)||[]).filter(t=>t.length>2&&!STOP.has(t)))
const jac=(a,b)=>{if(!a.size||!b.size)return 0;let i=0;for(const t of a)if(b.has(t))i++;return i/(a.size+b.size-i)}

const { data: pubs } = await sb.schema('pulso_content').from('metricas_publicacao')
  .select('ideia_id, plataforma, post_id, metadata')

const legenda = p => p.metadata?.caption || p.metadata?.legenda || p.metadata?.title || p.metadata?.descricao || ''
const ancoras = pubs.filter(p => p.plataforma === 'instagram' && p.ideia_id && legenda(p))
                    .map(p => ({ id: p.ideia_id, toks: tk(legenda(p)) }))
console.log('ancoras Instagram com legenda:', ancoras.length, '| ideias distintas:', new Set(ancoras.map(a=>a.id)).size)

function casar(txt){const t=tk(txt);const m=new Map()
  for(const a of ancoras){const s=jac(t,a.toks); if(s>(m.get(a.id)??0))m.set(a.id,s)}
  let best=0,second=0,id=null
  for(const [k,s] of m){if(s>best){second=best;best=s;id=k}else if(s>second)second=s}
  return {id,best,second}}

for (const rede of ['facebook','tiktok','youtube','kwai']) {
  const alvos = pubs.filter(p => p.plataforma === rede && p.ideia_id && legenda(p))
  if (!alvos.length) { console.log(`\n--- ${rede}: 0 posts com legenda (nada a medir)`); continue }
  let idem=0, acha=0, aceita=0, certo=0
  const bs=[]
  for (const p of alvos) {
    const r = casar(legenda(p))
    bs.push(r.best)
    if (r.best >= 0.999) idem++
    if (r.id === p.ideia_id) acha++
    if (r.id && r.best>=0.25 && r.best-r.second>=0.15) { aceita++; if (r.id===p.ideia_id) certo++ }
  }
  const o=[...bs].sort((a,b)=>a-b), med=o[Math.floor(o.length/2)]
  console.log(`\n--- ${rede}: ${alvos.length} posts com legenda`)
  console.log(`    legenda IDENTICA a do IG (best=1,00): ${idem} (${(idem/alvos.length*100).toFixed(0)}%)  <- a premissa do cabecalho`)
  console.log(`    topo correto                        : ${acha} (${(acha/alvos.length*100).toFixed(0)}%)`)
  console.log(`    o limiar atual ACEITARIA            : ${aceita} · corretos ${certo} · ERRADOS ${aceita-certo}`)
  console.log(`    best: mediana ${med.toFixed(2)} · min ${Math.min(...bs).toFixed(2)}`)
}
