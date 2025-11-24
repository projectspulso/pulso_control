import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Carregar variáveis de ambiente
load_dotenv('.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
supabase: Client = create_client(url, key)

print("🧹 LIMPANDO DUPLICATAS DE ROTEIROS\n")

# IDs dos roteiros duplicados para DELETAR (mantendo o original)
duplicados_para_deletar = [
    'da115164',  # Gêmeos Parasitas (duplicado)
    '787d9953',  # Priões (duplicado)
    '2da50154',  # Bactérias (duplicado)
    '178e6a96',  # Elisa Lam (duplicado)
    'cf9e80f6',  # Casa Winchester (duplicado)
    'ba2b3f19',  # Ilha dos Mortos (duplicado)
]

print("⚠️  ESTE SCRIPT VAI DELETAR 6 ROTEIROS DUPLICADOS")
print("\nRoteiros que serão deletados:")
print("  1. Gêmeos Parasitas (duplicado)")
print("  2. Priões: O Vírus Indestrutível (duplicado)")
print("  3. Bactérias que Controlam Seu Humor (duplicado)")
print("  4. A Garota do Elevador Elisa Lam (duplicado)")
print("  5. A Casa Winchester (duplicado)")
print("  6. A Ilha dos Mortos - Poveglia (duplicado)")

resposta = input("\n❓ Continuar? (digite 'SIM' para confirmar): ")

if resposta.upper() != 'SIM':
    print("\n❌ Operação cancelada.")
    exit(0)

print("\n🔄 Deletando duplicatas...\n")

# Buscar IDs completos
roteiros = supabase.table('roteiros').select('id, titulo').execute()

ids_completos = {}
for r in roteiros.data:
    for id_parcial in duplicados_para_deletar:
        if r['id'].startswith(id_parcial):
            ids_completos[id_parcial] = r['id']
            break

# Deletar cada um
deletados = 0
for id_parcial, id_completo in ids_completos.items():
    try:
        # Primeiro remover do pipeline se existir
        pipeline = supabase.table('pipeline_producao').select('id').eq('roteiro_id', id_completo).execute()
        if pipeline.data:
            for p in pipeline.data:
                supabase.table('pipeline_producao').delete().eq('id', p['id']).execute()
                print(f"  ✓ Removido do pipeline: {id_completo[:8]}...")
        
        # Deletar roteiro
        result = supabase.table('roteiros').delete().eq('id', id_completo).execute()
        deletados += 1
        print(f"  ✓ Deletado roteiro: {id_completo[:8]}...")
    except Exception as e:
        print(f"  ✗ Erro ao deletar {id_completo[:8]}...: {e}")

print(f"\n✅ {deletados} roteiros duplicados foram removidos!")
print("\n🔍 Executando verificação final...")

# Verificar novamente
roteiros_final = supabase.table('roteiros').select('id, titulo').execute()
titulos_finais = {}
duplicatas_restantes = 0

for r in roteiros_final.data:
    titulo_lower = r['titulo'].lower().strip()
    if titulo_lower in titulos_finais:
        duplicatas_restantes += 1
    else:
        titulos_finais[titulo_lower] = r

print(f"\n📊 Resultado:")
print(f"  Total de roteiros: {len(roteiros_final.data)}")
print(f"  Duplicatas restantes: {duplicatas_restantes}")

if duplicatas_restantes == 0:
    print("\n✅ Banco limpo! Nenhuma duplicata encontrada.")
else:
    print(f"\n⚠️  Ainda há {duplicatas_restantes} duplicatas. Execute check_data_quality.py novamente.")
