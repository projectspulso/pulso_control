const { createClient } = require('@supabase/supabase-js')
const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '../../../.env') })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixAndComplete() {
  console.log('🔧 Corrigindo e completando dados...\n')
  
  // 1. Aprovar algumas ideias
  console.log('1. Aprovando 15 ideias...')
  const { data: todasIdeias } = await supabase
    .from('ideias')
    .select('id')
    .limit(15)
  
  if (todasIdeias) {
    for (const ideia of todasIdeias) {
      await supabase
        .from('ideias')
        .update({ status: Math.random() > 0.5 ? 'APROVADA' : 'EM_PRODUCAO' })
        .eq('id', ideia.id)
    }
    console.log(`✅ ${todasIdeias.length} ideias atualizadas\n`)
  }
  
  // 2. Criar roteiros
  console.log('2. Criando roteiros...')
  const { data: ideiasAprovadas } = await supabase
    .from('ideias')
    .select('id, titulo, descricao, canal_id, serie_id')
    .in('status', ['APROVADA', 'EM_PRODUCAO'])
    .limit(15)
  
  console.log(`   Ideias aprovadas encontradas: ${ideiasAprovadas?.length || 0}`)
  
  if (ideiasAprovadas && ideiasAprovadas.length > 0) {
    const roteiros = ideiasAprovadas.map((ideia, index) => ({
      ideia_id: ideia.id,
      titulo: ideia.titulo,
      versao: 1,
      conteudo_md: `# ${ideia.titulo}\n\n## Introdução\n\n${ideia.descricao || 'Conteúdo gerado automaticamente'}\n\n## Desenvolvimento\n\n[Desenvolvimento do tema]\n\n## Conclusão\n\n[Conclusão impactante]`,
      duracao_estimado_segundos: 60 + Math.floor(Math.random() * 60),
      status: ['RASCUNHO', 'APROVADO', 'EM_PRODUCAO'][Math.floor(Math.random() * 3)],
      linguagem: 'pt-BR',
      metadata: { 
        gerado_por: 'ia',
        modelo: 'gpt-4',
        formato: 'curto',
        tom: 'dark'
      }
    }))
    
    const { data: roteirosData, error } = await supabase
      .from('roteiros')
      .insert(roteiros)
      .select()
    
    if (error) {
      console.log(`   ⚠️  Erro ao criar roteiros: ${error.message}`)
    } else {
      console.log(`✅ ${roteirosData?.length || 0} roteiros criados\n`)
    }
  }
  
  // 3. Estatísticas finais
  console.log('========================================')
  console.log('📊 ESTATÍSTICAS ATUALIZADAS')
  console.log('========================================')
  
  const [ideias, roteiros, workflows, execucoes] = await Promise.all([
    supabase.from('ideias').select('id', { count: 'exact', head: true }),
    supabase.from('roteiros').select('id', { count: 'exact', head: true }),
    supabase.from('workflows').select('id', { count: 'exact', head: true }),
    supabase.from('workflow_execucoes').select('id', { count: 'exact', head: true })
  ])
  
  console.log(`Ideias: ${ideias.count}`)
  console.log(`Roteiros: ${roteiros.count}`)
  console.log(`Workflows: ${workflows.count}`)
  console.log(`Execuções: ${execucoes.count}`)
  console.log('========================================\n')
  
  console.log('✅ Dados corrigidos e completados!')
  console.log('\n🔄 Recarregue o dashboard para ver as mudanças')
}

fixAndComplete().catch(console.error)
