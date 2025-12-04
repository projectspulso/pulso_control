import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function analisarDatas() {
  console.log('\n📅 ANÁLISE DE DATAS NO SISTEMA\n')
  
  // 1. Ideias - quando foram criadas
  console.log('1️⃣ IDEIAS - Distribuição por data')
  const { data: ideias } = await supabase
    .schema('pulso_content')
    .from('ideias')
    .select('id, titulo, status, created_at, updated_at')
    .order('created_at', { ascending: true })
  
  if (ideias && ideias.length > 0) {
    const primeira = new Date(ideias[0].created_at)
    const ultima = new Date(ideias[ideias.length - 1].created_at)
    console.log(`   Total: ${ideias.length}`)
    console.log(`   Primeira criada: ${primeira.toLocaleString('pt-BR')}`)
    console.log(`   Última criada: ${ultima.toLocaleString('pt-BR')}`)
    
    // Distribuição por status
    const porStatus = ideias.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    console.log(`   Por status:`, porStatus)
  }
  
  // 2. Roteiros - quando foram gerados
  console.log('\n2️⃣ ROTEIROS - Distribuição por data')
  const { data: roteiros } = await supabase
    .schema('pulso_content')
    .from('roteiros')
    .select('id, titulo, status, created_at, updated_at')
    .order('created_at', { ascending: true })
  
  if (roteiros && roteiros.length > 0) {
    const primeira = new Date(roteiros[0].created_at)
    const ultima = new Date(roteiros[roteiros.length - 1].created_at)
    console.log(`   Total: ${roteiros.length}`)
    console.log(`   Primeiro criado: ${primeira.toLocaleString('pt-BR')}`)
    console.log(`   Último criado: ${ultima.toLocaleString('pt-BR')}`)
    
    const porStatus = roteiros.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    console.log(`   Por status:`, porStatus)
  }
  
  // 3. Áudios - quando foram gerados
  console.log('\n3️⃣ ÁUDIOS - Distribuição por data')
  const { data: audios } = await supabase
    .schema('pulso_content')
    .from('audios')
    .select('id, status, created_at')
    .order('created_at', { ascending: true })
  
  if (audios && audios.length > 0) {
    const primeira = new Date(audios[0].created_at)
    const ultima = new Date(audios[audios.length - 1].created_at)
    console.log(`   Total: ${audios.length}`)
    console.log(`   Primeiro criado: ${primeira.toLocaleString('pt-BR')}`)
    console.log(`   Último criado: ${ultima.toLocaleString('pt-BR')}`)
  } else {
    console.log(`   Total: 0 (ainda não foram gerados)`)
  }
  
  // 4. Pipeline - datas previstas
  console.log('\n4️⃣ PIPELINE - Datas previstas')
  const { data: pipeline } = await supabase
    .schema('pulso_content')
    .from('pipeline_producao')
    .select('id, status, data_prevista, data_publicacao, created_at')
    .order('created_at', { ascending: true })
  
  if (pipeline && pipeline.length > 0) {
    console.log(`   Total items: ${pipeline.length}`)
    const comDataPrevista = pipeline.filter(p => p.data_prevista).length
    const comDataPublicacao = pipeline.filter(p => p.data_publicacao).length
    console.log(`   Com data_prevista: ${comDataPrevista}`)
    console.log(`   Com data_publicacao: ${comDataPublicacao}`)
    
    if (comDataPrevista > 0) {
      const primeira = pipeline.filter(p => p.data_prevista).sort((a, b) => 
        new Date(a.data_prevista!).getTime() - new Date(b.data_prevista!).getTime()
      )[0]
      console.log(`   Primeira data prevista: ${new Date(primeira.data_prevista!).toLocaleDateString('pt-BR')}`)
    }
  }
  
  // 5. Canais - metadata pode ter data_inicio
  console.log('\n5️⃣ CANAIS - Verificar metadata')
  const { data: canais } = await supabase
    .schema('pulso_core')
    .from('canais')
    .select('id, nome, status, metadata, created_at')
  
  if (canais && canais.length > 0) {
    console.log(`   Total: ${canais.length}`)
    canais.forEach(canal => {
      if (canal.metadata && typeof canal.metadata === 'object') {
        const meta = canal.metadata as any
        if (meta.data_inicio || meta.data_lancamento) {
          console.log(`   ${canal.nome}:`)
          if (meta.data_inicio) console.log(`     - data_inicio: ${meta.data_inicio}`)
          if (meta.data_lancamento) console.log(`     - data_lancamento: ${meta.data_lancamento}`)
        }
      }
    })
  }
  
  // 6. Logs de workflows
  console.log('\n6️⃣ LOGS DE WORKFLOWS')
  const { data: logs } = await supabase
    .schema('pulso_content')
    .from('logs_workflows')
    .select('workflow_name, status, created_at')
    .order('created_at', { ascending: true })
    .limit(1)
  
  if (logs && logs.length > 0) {
    console.log(`   Primeiro log: ${new Date(logs[0].created_at).toLocaleString('pt-BR')}`)
    console.log(`   Workflow: ${logs[0].workflow_name}`)
  }
  
  console.log('\n✅ Análise concluída!\n')
}

analisarDatas().catch(console.error)
