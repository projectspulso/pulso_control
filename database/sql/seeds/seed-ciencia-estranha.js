const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Carregar .env da raiz do projeto
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

async function seedIdeiasCS() {
  console.log('🔬 Criando ideias para Ciência Estranha...\n')
  
  try {
    // Buscar canal e série
    const { data: canal } = await supabase.from('canais').select('id').eq('slug', 'pulso-dark-pt').single()
    const { data: serie } = await supabase.from('series').select('id').eq('slug', 'ciencia-estranha').single()
    
    if (!canal || !serie) {
      console.error('❌ Canal ou série não encontrados')
      return
    }
    
    console.log('✅ Canal ID:', canal.id)
    console.log('✅ Série ID:', serie.id)
    
    // Ideias para Ciência Estranha
    const ideias = [
      {
        titulo: 'O Cérebro que Vive Fora do Corpo',
        descricao: 'Cientistas conseguiram manter um cérebro humano vivo por 36 horas fora do corpo. O que aconteceu?',
        canal_id: canal.id,
        serie_id: serie.id,
        status: 'RASCUNHO',
        prioridade: 8,
        metadata: {
          tipo_conteudo: 'CIENCIA_DARK',
          fonte: 'Nature Journal',
          duracao_estimada: '30s'
        }
      },
      {
        titulo: 'A Doença que Te Faz Morrer de Riso',
        descricao: 'Kuru: doença rara que causa riso incontrolável antes da morte. Como é transmitida?',
        canal_id: canal.id,
        serie_id: serie.id,
        status: 'RASCUNHO',
        prioridade: 9,
        metadata: {
          tipo_conteudo: 'CIENCIA_DARK',
          fonte: 'Medical Archives',
          duracao_estimada: '25s'
        }
      },
      {
        titulo: 'Experimento Humano Mais Bizarro',
        descricao: 'Em 1950, cientistas costuraram dois cães juntos. O resultado foi perturbador.',
        canal_id: canal.id,
        serie_id: serie.id,
        status: 'APROVADA',
        prioridade: 10,
        metadata: {
          tipo_conteudo: 'CIENCIA_DARK',
          fonte: 'Soviet Science Archives',
          duracao_estimada: '35s'
        }
      },
      {
        titulo: 'O Veneno Mais Mortal do Universo',
        descricao: 'Um grama de Botulinum poderia matar toda a população da Terra. Como funciona?',
        canal_id: canal.id,
        serie_id: serie.id,
        status: 'RASCUNHO',
        prioridade: 7,
        metadata: {
          tipo_conteudo: 'CIENCIA_DARK',
          fonte: 'Toxicology Research',
          duracao_estimada: '20s'
        }
      },
      {
        titulo: 'A Água que Te Mata em Segundos',
        descricao: 'Água pesada pode ser letal. Cientistas descobriram isso do jeito mais macabro possível.',
        canal_id: canal.id,
        serie_id: serie.id,
        status: 'APROVADA',
        prioridade: 8,
        metadata: {
          tipo_conteudo: 'CIENCIA_DARK',
          fonte: 'Chemistry Today',
          duracao_estimada: '30s'
        }
      },
      {
        titulo: 'O Som que Liquefaz Seus Órgãos',
        descricao: 'Frequências infrassônicas podem literalmente derreter seus órgãos internos. Como?',
        canal_id: canal.id,
        serie_id: serie.id,
        status: 'RASCUNHO',
        prioridade: 9,
        metadata: {
          tipo_conteudo: 'CIENCIA_DARK',
          fonte: 'Acoustic Weapons Research',
          duracao_estimada: '28s'
        }
      },
      {
        titulo: 'A Bactéria que Come Carne Humana',
        descricao: 'Fasciíte necrosante: como uma pequena bactéria pode devorar músculos em horas.',
        canal_id: canal.id,
        serie_id: serie.id,
        status: 'RASCUNHO',
        prioridade: 8,
        metadata: {
          tipo_conteudo: 'CIENCIA_DARK',
          fonte: 'CDC Reports',
          duracao_estimada: '32s'
        }
      },
      {
        titulo: 'O Planeta Onde Chove Vidro',
        descricao: 'HD 189733b: um planeta onde ventos de 8.700 km/h fazem chover vidro derretido horizontalmente.',
        canal_id: canal.id,
        serie_id: serie.id,
        status: 'APROVADA',
        prioridade: 10,
        metadata: {
          tipo_conteudo: 'CIENCIA_DARK',
          fonte: 'NASA Exoplanet Database',
          duracao_estimada: '35s'
        }
      },
      {
        titulo: 'A Radiação que Te Mata Amanhã',
        descricao: 'Síndrome aguda da radiação: você se sente bem hoje, mas já está morto. Entenda.',
        canal_id: canal.id,
        serie_id: serie.id,
        status: 'RASCUNHO',
        prioridade: 7,
        metadata: {
          tipo_conteudo: 'CIENCIA_DARK',
          fonte: 'Chernobyl Medical Records',
          duracao_estimada: '40s'
        }
      },
      {
        titulo: 'O Experimento do Sono Russo',
        descricao: 'Manter humanos acordados por 30 dias. O que aconteceu foi além da ciência.',
        canal_id: canal.id,
        serie_id: serie.id,
        status: 'RASCUNHO',
        prioridade: 10,
        metadata: {
          tipo_conteudo: 'CIENCIA_DARK',
          fonte: 'Declassified Documents',
          duracao_estimada: '45s'
        }
      }
    ]
    
    // Inserir ideias
    console.log('\n📝 Inserindo ideias...')
    const { data: result, error } = await supabase
      .from('ideias')
      .insert(ideias)
      .select('id, titulo, status')
    
    if (error) throw error
    
    console.log(`\n✅ ${result.length} ideias criadas:`)
    result.forEach((ideia, i) => {
      console.log(`   ${i + 1}. ${ideia.titulo} [${ideia.status}]`)
    })
    
    // Stats finais
    const { data: stats } = await supabase
      .from('ideias')
      .select('status, serie_id')
      .eq('serie_id', serie.id)
    
    const byStatus = stats?.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1
      return acc
    }, {})
    
    console.log('\n📊 Stats da série Ciência Estranha:')
    console.log('   Total:', stats?.length)
    console.log('   Por status:', byStatus)
    
    console.log('\n✨ Concluído!')
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  }
}

seedIdeiasCS()
