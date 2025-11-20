require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuração Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Teste de conexão
async function testConnection() {
  console.log('🔄 Testando conexão com Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('vw_pulso_canais')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    
    console.log('✅ Conexão bem-sucedida!');
    console.log('📊 Canais encontrados:', data?.length || 0);
    if (data?.length > 0) {
      console.log('Exemplo:', data[0]);
    }
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
  }
}

// Exportar funções úteis
module.exports = {
  supabase,
  testConnection
};

// Se executado diretamente
if (require.main === module) {
  testConnection();
}
