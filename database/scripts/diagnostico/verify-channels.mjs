import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const canais = await supabase
  .from('canais')
  .select('id, nome, slug')
  .eq('status', 'ATIVO')
  .order('nome');

console.log('\n=== VERIFICAÇÃO COMPLETA POR CANAL ===\n');

for (const canal of canais.data) {
  console.log(`📺 ${canal.nome}`);
  console.log(`   Slug: ${canal.slug}`);
  
  const series = await supabase
    .from('series')
    .select('id, nome, slug')
    .eq('canal_id', canal.id)
    .eq('status', 'ATIVO')
    .order('nome');
  
  if (!series.data || series.data.length === 0) {
    console.log('   ⚠️  SEM SÉRIES\n');
    continue;
  }
  
  console.log(`   Séries: ${series.data.length}`);
  
  for (const serie of series.data) {
    const ideias = await supabase
      .from('ideias')
      .select('id, titulo, status')
      .eq('canal_id', canal.id)
      .eq('serie_id', serie.id);
    
    const total = ideias.data?.length || 0;
    const aprovadas = ideias.data?.filter(i => i.status === 'APROVADA').length || 0;
    const rascunhos = ideias.data?.filter(i => i.status === 'RASCUNHO').length || 0;
    const outras = total - aprovadas - rascunhos;
    
    console.log(`   └─ 📑 ${serie.nome} (${serie.slug})`);
    console.log(`      Total: ${total} ideias`);
    if (aprovadas > 0) console.log(`      ✅ APROVADA: ${aprovadas}`);
    if (rascunhos > 0) console.log(`      📝 RASCUNHO: ${rascunhos}`);
    if (outras > 0) console.log(`      🔄 OUTRAS: ${outras}`);
    if (total === 0) console.log(`      ⚠️  SEM IDEIAS`);
  }
  
  const totalCanal = await supabase
    .from('ideias')
    .select('id')
    .eq('canal_id', canal.id);
  
  console.log(`   ━━━ TOTAL DO CANAL: ${totalCanal.data?.length || 0} ideias\n`);
}

const orfas = await supabase
  .from('ideias')
  .select('id, titulo')
  .is('canal_id', null);

if (orfas.data && orfas.data.length > 0) {
  console.log(`\n⚠️  IDEIAS ÓRFÃS (sem canal): ${orfas.data.length}`);
} else {
  console.log(`\n✅ Nenhuma ideia órfã encontrada`);
}
