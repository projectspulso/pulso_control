import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Carregar variáveis de ambiente
load_dotenv('.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
supabase: Client = create_client(url, key)

print("🔍 VERIFICANDO QUALIDADE DOS DADOS\n")

# 1. Verificar duplicatas de títulos (case insensitive)
print("=" * 80)
print("📋 VERIFICANDO DUPLICATAS DE TÍTULOS")
print("=" * 80)

roteiros = supabase.table('roteiros').select('id, titulo, canal_nome, status').execute()

titulos_vistos = {}
duplicatas = []

for r in roteiros.data:
    titulo = r.get('titulo', '')
    if not titulo:
        continue
    
    titulo_lower = titulo.lower().strip()
    
    if titulo_lower in titulos_vistos:
        duplicatas.append({
            'titulo': titulo,
            'original': titulos_vistos[titulo_lower],
            'duplicado': r
        })
    else:
        titulos_vistos[titulo_lower] = r

if duplicatas:
    print(f"\n❌ Encontradas {len(duplicatas)} duplicatas:\n")
    for dup in duplicatas:
        print(f"  Título: '{dup['titulo']}'")
        print(f"    Original:  ID={dup['original']['id'][:8]}... | Canal={dup['original'].get('canal_nome', 'N/A')}")
        print(f"    Duplicado: ID={dup['duplicado']['id'][:8]}... | Canal={dup['duplicado'].get('canal_nome', 'N/A')}")
        print()
else:
    print("\n✅ Nenhuma duplicata encontrada!")

# 2. Verificar problemas de ortografia/formatação
print("\n" + "=" * 80)
print("📝 VERIFICANDO PROBLEMAS DE TEXTO")
print("=" * 80)

problemas = []

for r in roteiros.data:
    titulo = r.get('titulo', '')
    if not titulo:
        problemas.append({
            'tipo': 'TÍTULO VAZIO',
            'id': r['id'],
            'titulo': '[VAZIO]',
            'canal': r.get('canal_nome', 'N/A')
        })
        continue
    
    # Verificar múltiplos espaços
    if '  ' in titulo:
        problemas.append({
            'tipo': 'ESPAÇOS DUPLOS',
            'id': r['id'],
            'titulo': titulo,
            'canal': r.get('canal_nome', 'N/A'),
            'sugestao': ' '.join(titulo.split())
        })
    
    # Verificar espaços no início/fim
    if titulo != titulo.strip():
        problemas.append({
            'tipo': 'ESPAÇOS NAS BORDAS',
            'id': r['id'],
            'titulo': f"'{titulo}'",
            'canal': r.get('canal_nome', 'N/A'),
            'sugestao': titulo.strip()
        })
    
    # Verificar primeira letra minúscula
    if titulo and titulo[0].islower():
        problemas.append({
            'tipo': 'PRIMEIRA LETRA MINÚSCULA',
            'id': r['id'],
            'titulo': titulo,
            'canal': r.get('canal_nome', 'N/A'),
            'sugestao': titulo[0].upper() + titulo[1:]
        })

if problemas:
    print(f"\n⚠️  Encontrados {len(problemas)} problemas:\n")
    for p in problemas:
        print(f"  [{p['tipo']}]")
        print(f"    ID: {p['id'][:8]}...")
        print(f"    Atual: {p['titulo']}")
        if 'sugestao' in p:
            print(f"    Sugestão: {p['sugestao']}")
        print(f"    Canal: {p['canal']}")
        print()
else:
    print("\n✅ Nenhum problema de formatação encontrado!")

# 3. Verificar ideias duplicadas
print("\n" + "=" * 80)
print("📋 VERIFICANDO DUPLICATAS DE IDEIAS")
print("=" * 80)

ideias = supabase.table('ideias').select('id, titulo, status').execute()

ideias_titulos = {}
ideias_duplicadas = []

for i in ideias.data:
    titulo = i.get('titulo', '')
    if not titulo:
        continue
    
    titulo_lower = titulo.lower().strip()
    
    if titulo_lower in ideias_titulos:
        ideias_duplicadas.append({
            'titulo': titulo,
            'original': ideias_titulos[titulo_lower],
            'duplicado': i
        })
    else:
        ideias_titulos[titulo_lower] = i

if ideias_duplicadas:
    print(f"\n❌ Encontradas {len(ideias_duplicadas)} ideias duplicadas:\n")
    for dup in ideias_duplicadas:
        print(f"  Título: '{dup['titulo']}'")
        print(f"    Original:  ID={dup['original']['id'][:8]}... | Status={dup['original'].get('status')}")
        print(f"    Duplicado: ID={dup['duplicado']['id'][:8]}... | Status={dup['duplicado'].get('status')}")
        print()
else:
    print("\n✅ Nenhuma ideia duplicada encontrada!")

# 4. Resumo
print("\n" + "=" * 80)
print("📊 RESUMO DA QUALIDADE")
print("=" * 80)
print(f"\n  Total de Roteiros: {len(roteiros.data)}")
print(f"  Total de Ideias: {len(ideias.data)}")
print(f"  Duplicatas de Roteiros: {len(duplicatas)}")
print(f"  Duplicatas de Ideias: {len(ideias_duplicadas)}")
print(f"  Problemas de Formatação: {len(problemas)}")

if duplicatas or ideias_duplicadas or problemas:
    print(f"\n⚠️  {len(duplicatas) + len(ideias_duplicadas) + len(problemas)} problemas encontrados no total")
    print("\n💡 Execute o script 'fix_data_quality.py' para corrigir automaticamente")
else:
    print("\n✅ Qualidade dos dados está excelente!")

print("\n" + "=" * 80)
