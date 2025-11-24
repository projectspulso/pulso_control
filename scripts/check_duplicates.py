import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Carregar variáveis de ambiente
load_dotenv('.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not url or not key:
    print("❌ Erro: Variáveis de ambiente não encontradas!")
    print("Certifique-se que .env.local existe com:")
    print("  NEXT_PUBLIC_SUPABASE_URL=...")
    print("  NEXT_PUBLIC_SUPABASE_ANON_KEY=...")
    exit(1)

supabase: Client = create_client(url, key)

print("🔍 Verificando duplicidades no banco...\n")

# 1. Contar totais
print("📊 TOTAIS:")
ideias = supabase.table('ideias').select('id', count='exact').execute()
roteiros = supabase.table('roteiros').select('id', count='exact').execute()
pipeline = supabase.table('pipeline_producao').select('id', count='exact').execute()

print(f"  - Ideias: {ideias.count}")
print(f"  - Roteiros: {roteiros.count}")
print(f"  - Pipeline: {pipeline.count}\n")

# 2. Ver roteiros
print("📝 ROTEIROS (primeiros 15):")
all_roteiros = supabase.table('roteiros').select('id, titulo, canal_nome, status').order('created_at', desc=True).limit(15).execute()

for i, r in enumerate(all_roteiros.data, 1):
    titulo = r.get('titulo') or 'SEM TÍTULO'
    canal = r.get('canal_nome') or 'sem canal'
    status = r.get('status') or 'sem status'
    print(f"  {i:2}. {titulo[:50]:50} | {canal:30} | {status}")

# 3. Status dos roteiros
print("\n📈 ROTEIROS POR STATUS:")
status_roteiros = supabase.table('roteiros').select('status').execute()
status_count = {}
for r in status_roteiros.data:
    s = r.get('status') or 'INDEFINIDO'
    status_count[s] = status_count.get(s, 0) + 1

for status, count in sorted(status_count.items(), key=lambda x: x[1], reverse=True):
    print(f"  - {status}: {count}")

# 4. Pipeline por status
print("\n📊 PIPELINE POR STATUS:")
status_pipeline = supabase.table('pipeline_producao').select('status').execute()
pipeline_count = {}
for p in status_pipeline.data:
    s = p.get('status') or 'INDEFINIDO'
    pipeline_count[s] = pipeline_count.get(s, 0) + 1

for status, count in sorted(pipeline_count.items(), key=lambda x: x[1], reverse=True):
    print(f"  - {status}: {count}")

print("\n✅ Verificação completa!")
