const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Carregar .env da raiz do projeto
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

async function seedProject() {
  console.log('🚀 Populando projeto PULSO com dados completos...\n')
  
  try {
    // 1. Obter IDs necessários
    const { data: canal } = await supabase.from('canais').select('id').eq('slug', 'pulso-dark-pt').single()
    const { data: series } = await supabase.from('series').select('id, slug')
    const { data: plataformas } = await supabase.from('plataformas').select('id, tipo')
    
    console.log('✅ Canal:', canal?.id)
    console.log('✅ Séries:', series?.length)
    console.log('✅ Plataformas:', plataformas?.length)
    
    // 2. Conectar canal às plataformas
    console.log('\n📱 Conectando canal às plataformas...')
    const canaisPlataformas = plataformas.map(p => ({
      canal_id: canal.id,
      plataforma_id: p.id,
      identificador_externo: `@pulsodark_${p.tipo.toLowerCase()}`,
      nome_exibicao: `Pulso Dark - ${p.tipo}`,
      url_canal: `https://example.com/@pulsodark`,
      ativo: true
    }))
    
    const { error: cpError } = await supabase
      .from('canais_plataformas')
      .upsert(canaisPlataformas, { onConflict: 'plataforma_id,identificador_externo', ignoreDuplicates: true })
    
    if (!cpError) console.log('✅ Plataformas conectadas')
    
    // 3. Criar workflows N8N
    console.log('\n⚙️  Criando workflows...')
    const workflows = [
      {
        nome: 'Gerador de Roteiros IA',
        slug: 'gerador-roteiros-ia',
        descricao: 'Gera roteiros usando IA (GPT-4)',
        origem: 'N8N',
        referencia_externa: 'workflow_001',
        ativo: true,
        configuracao: { ai_model: 'gpt-4', trigger: 'webhook' }
      },
      {
        nome: 'Conversor TTS',
        slug: 'conversor-tts',
        descricao: 'Converte roteiros em áudio',
        origem: 'N8N',
        referencia_externa: 'workflow_002',
        ativo: true,
        configuracao: { tts_provider: 'elevenlabs' }
      },
      {
        nome: 'Gerador de Vídeos',
        slug: 'gerador-videos',
        descricao: 'Cria vídeos com áudio + assets',
        origem: 'N8N',
        referencia_externa: 'workflow_003',
        ativo: true,
        configuracao: { video_tool: 'remotion' }
      },
      {
        nome: 'Publicador Multi-Plataforma',
        slug: 'publicador-multiplataforma',
        descricao: 'Publica em YouTube, TikTok, Instagram',
        origem: 'N8N',
        referencia_externa: 'workflow_004',
        ativo: true,
        configuracao: { platforms: ['youtube', 'tiktok', 'instagram'] }
      },
      {
        nome: 'Coletor de Métricas',
        slug: 'coletor-metricas',
        descricao: 'Coleta métricas diárias',
        origem: 'N8N',
        referencia_externa: 'workflow_005',
        ativo: true,
        configuracao: { schedule: '0 6 * * *' }
      }
    ]
    
    const { data: workflowsData, error: wError } = await supabase
      .from('workflows')
      .upsert(workflows, { onConflict: 'slug', ignoreDuplicates: true })
      .select()
    
    if (!wError) console.log(`✅ ${workflows.length} workflows criados`)
    
    // 4. Criar execuções de workflows
    if (workflowsData && workflowsData.length > 0) {
      console.log('\n📊 Criando execuções de exemplo...')
      const execucoes = []
      
      workflowsData.forEach(w => {
        for (let i = 0; i < 5; i++) {
          const statuses = ['SUCESSO', 'ERRO', 'EXECUTANDO', 'PENDENTE']
          const status = statuses[Math.floor(Math.random() * statuses.length)]
          
          execucoes.push({
            workflow_id: w.id,
            entidade_tipo: 'ideia',
            status: status,
            mensagem: status === 'SUCESSO' ? 'Executado com sucesso' : status === 'ERRO' ? 'Erro na execução' : 'Em andamento',
            payload_entrada: { test: true },
            inicio_em: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
          })
        }
      })
      
      const { error: exError } = await supabase.from('workflow_execucoes').insert(execucoes)
      if (!exError) console.log(`✅ ${execucoes.length} execuções criadas`)
    }
    
    // 5. Criar roteiros a partir das ideias
    console.log('\n📝 Criando roteiros...')
    const { data: ideias } = await supabase
      .from('ideias')
      .select('id, titulo, descricao')
      .in('status', ['APROVADA', 'EM_PRODUCAO'])
      .limit(15)
    
    if (ideias && ideias.length > 0) {
      const roteiros = ideias.map((ideia, index) => ({
        ideia_id: ideia.id,
        titulo: ideia.titulo,
        versao: 1,
        conteudo_md: `# ${ideia.titulo}\n\n## Introdução\n\n${ideia.descricao || 'Roteiro gerado automaticamente'}\n\n## Desenvolvimento\n\n[Conteúdo a ser desenvolvido]\n\n## Conclusão\n\n[Conclusão impactante]`,
        duracao_estimado_segundos: 60,
        status: ['RASCUNHO', 'APROVADO', 'EM_PRODUCAO', 'PUBLICADO'][Math.floor(Math.random() * 4)],
        metadata: { gerado_por: 'ia', modelo: 'gpt-4' }
      }))
      
      const { error: rError } = await supabase.from('roteiros').upsert(roteiros, { onConflict: 'ideia_id,versao', ignoreDuplicates: true })
      if (!rError) console.log(`✅ ${roteiros.length} roteiros criados`)
    }
    
    // 6. Estatísticas finais
    console.log('\n========================================')
    console.log('📊 ESTATÍSTICAS DO PROJETO PULSO')
    console.log('========================================')
    
    const stats = await Promise.all([
      supabase.from('ideias').select('id', { count: 'exact', head: true }),
      supabase.from('roteiros').select('id', { count: 'exact', head: true }),
      supabase.from('workflows').select('id', { count: 'exact', head: true }),
      supabase.from('workflow_execucoes').select('id', { count: 'exact', head: true }),
      supabase.from('canais_plataformas').select('id', { count: 'exact', head: true })
    ])
    
    console.log(`Ideias: ${stats[0].count}`)
    console.log(`Roteiros: ${stats[1].count}`)
    console.log(`Workflows: ${stats[2].count}`)
    console.log(`Execuções: ${stats[3].count}`)
    console.log(`Canais-Plataformas: ${stats[4].count}`)
    console.log('========================================\n')
    
    console.log('✅ Seed completo executado com sucesso!')
    console.log('\n💡 Próximos passos:')
    console.log('   - Recarregue o dashboard (http://localhost:3000)')
    console.log('   - Os dados devem aparecer agora')
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  }
}

seedProject()
