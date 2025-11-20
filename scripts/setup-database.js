require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedInitialData() {
  console.log('🌱 Iniciando seed de dados iniciais...\n');

  try {
    // 1. Criar plataformas
    console.log('📱 Criando plataformas...');
    const { data: plataformas, error: platError } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO pulso_core.plataformas (tipo, nome_exibicao, descricao, ativo)
        VALUES 
          ('YOUTUBE_SHORTS', 'YouTube Shorts', 'Vídeos curtos do YouTube', true),
          ('YOUTUBE_LONGO', 'YouTube', 'Vídeos longos do YouTube', true),
          ('TIKTOK', 'TikTok', 'Rede social de vídeos curtos', true),
          ('INSTAGRAM_REELS', 'Instagram Reels', 'Reels do Instagram', true),
          ('KWAI', 'Kwai', 'Plataforma de vídeos curtos', true)
        ON CONFLICT (tipo, nome_exibicao) DO NOTHING
        RETURNING nome_exibicao;
      `
    });

    if (platError) {
      console.error('  ❌ Erro ao criar plataformas:', platError.message);
      console.log('\n💡 Execute manualmente no SQL Editor do Supabase:');
      console.log(`
INSERT INTO pulso_core.plataformas (tipo, nome_exibicao, descricao, ativo)
VALUES 
  ('YOUTUBE_SHORTS', 'YouTube Shorts', 'Vídeos curtos do YouTube', true),
  ('YOUTUBE_LONGO', 'YouTube', 'Vídeos longos do YouTube', true),
  ('TIKTOK', 'TikTok', 'Rede social de vídeos curtos', true),
  ('INSTAGRAM_REELS', 'Instagram Reels', 'Reels do Instagram', true),
  ('KWAI', 'Kwai', 'Plataforma de vídeos curtos', true)
ON CONFLICT (tipo, nome_exibicao) DO NOTHING;

INSERT INTO pulso_core.canais (nome, slug, descricao, idioma, status)
VALUES ('Pulso Dark PT', 'pulso-dark-pt', 'Canal principal de conteúdos dark em português', 'pt-BR', 'ATIVO')
ON CONFLICT (slug) DO NOTHING
RETURNING id;

-- Substitua <canal_id> pelo ID retornado acima
INSERT INTO pulso_core.series (canal_id, nome, slug, descricao, status, ordem_padrao)
VALUES ('<canal_id>', 'Curiosidades Dark', 'curiosidades-dark', 'Série sobre fatos curiosos e obscuros', 'ATIVO', 1)
ON CONFLICT (canal_id, slug) DO NOTHING;

INSERT INTO pulso_core.tags (nome, slug, descricao)
VALUES 
  ('História', 'historia', NULL),
  ('Ciência', 'ciencia', NULL),
  ('Mistério', 'misterio', NULL),
  ('Tecnologia', 'tecnologia', NULL)
ON CONFLICT (slug) DO NOTHING;
      `);
    } else {
      console.log('  ✅ Plataformas criadas');
    }

    console.log('\n✅ Verificando dados via views públicas...');
    
    // Testar conexão com as views
    const { data: canais, error: canaisError } = await supabase
      .from('vw_pulso_canais')
      .select('*')
      .limit(5);

    if (canaisError) {
      console.error('  ❌ Erro ao consultar canais:', canaisError.message);
    } else {
      console.log(`  ✅ Canais encontrados: ${canais?.length || 0}`);
      if (canais && canais.length > 0) {
        console.log('     Exemplo:', canais[0].nome);
      }
    }

    console.log('\n📋 Próximos passos:');
    console.log('  1. Execute o SQL acima no Supabase SQL Editor');
    console.log('  2. Configure credenciais no n8n (Supabase)');
    console.log('  3. Crie workflows de automação');
    console.log('  4. Teste: npm run db:test');

  } catch (error) {
    console.error('\n❌ Erro durante seed:', error.message);
  }
}

// Executar
seedInitialData();
