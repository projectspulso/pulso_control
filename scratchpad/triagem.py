# -*- coding: utf-8 -*-
# Tria os 16 itens que a checagem marcou como "errada". A checagem NAO e arbitro final: ela erra
# nos dois sentidos, e gravar o veredito dela como correcao plantaria erro novo no banco.
# Onde da para decidir por ARITMETICA sobre os numeros que a propria checagem declarou, decido.
# Onde precisa de fonte externa que eu nao tenho, digo que precisa — nao invento.
import json, io, os, urllib.request

TRIAGEM = {
 # numero: (classe, porque)
 '74':  ('ERRO_REAL', 'A premissa do video cai. Hindenburg e 6/5/1937 e Chernobyl 26/4/1986; um diario de ate 1932 nao pode te-los previsto pelo nome. Sao dois itens no mesmo video e atingem o argumento inteiro, nao um detalhe.'),
 '177': ('ERRO_REAL', 'O SS Baychimo foi abandonado em 1931, nao 1960. O erro esta na PRIMEIRA FRASE, o gancho. AINDA NAO PUBLICADO — agendado para 16/09 21h.'),
 '99':  ('ERRO_MENOR', '2014 menos 1845 da 169, o roteiro diz 170. Erro de um ano, verdadeiro mas irrelevante para quem assiste.'),
 '96':  ('ERRO_MENOR', 'Homo floresiensis tinha ~1,1 m e o roteiro diz "um metro". Aproximacao folgada, defensavel; a comparacao do cerebro com toranja e imprecisa no mesmo grau.'),
 '23':  ('CHECAGEM_ERRADA', 'ARITMETICA: mapa de 1513, avistamento da Antartida em 1820 = 307 anos. "Mais de 300 anos antes" esta CERTO. Quem errou foi o verificador, usando a propria data que ele citou.'),
 '163': ('CHECAGEM_ERRADA', 'ARITMETICA: a obra vendeu por 1,04 milhao. "Mais de um milhao de dolares" e verdade. O verificador tratou uma afirmacao correta como erro.'),
 '101': ('CHECAGEM_ERRADA', 'O roteiro afirma que Ouro Preto e Patrimonio da Humanidade pela UNESCO — o que e verdade. O verificador nao contesta isso: acrescenta a data (1980). Acrescentar nao e refutar.'),
 '134': ('VAGO', 'O verificador diz "a afirmacao deve ser atualizada para refletir o tempo exato" sem dizer qual seria. Nao afirma erro; pede precisao.'),
 '13':  ('PRECISA_FONTE', 'Diz que o numero de letras do Kryptos "e diferente do mencionado" sem dizer o correto. Sem fonte nao da para corrigir nem descartar.'),
 '135': ('PRECISA_FONTE', 'Diz que as mortes ligadas a Tutancamon sao "menos de 20" sem numero. O roteiro diz "mais de 20". Contradicao real, mas sem fonte nao se escreve a correcao.'),
 '7':   ('PRECISA_FONTE', 'Roteiro: um segundo a cada 138 milhoes de anos. Verificador: "em torno de 100 milhoes". Ordem de grandeza igual; qual relogio atomico muda o numero. Precisa da fonte para decidir.'),
 '108': ('PRECISA_FONTE', 'Roteiro: 1 em 15 mil de ser atingido por um raio. Verificador diz que e mais alta, sem numero. A estatistica varia por pais e por janela (ano x vida).'),
 '66':  ('PRECISA_FONTE', 'Roteiro: placas movem "alguns milimetros". Verificador: "geralmente maior". Depende da placa; sem a fonte nao da para fixar o numero.'),
 '189': ('CHECAGEM_ERRADA', 'O verificador escreve "as florestas de Gondwana tem essa idade" — que CONFIRMA os 300 milhoes de anos do roteiro em vez de refutar. Marcado como erro por engano.'),
}

env = {}
for l in io.open('.env', encoding='utf-8'):
    if '=' in l and not l.strip().startswith('#'):
        k, v = l.split('=', 1); env[k.strip()] = v.strip().strip('"')

def sql(q):
    io.open('scratchpad/_q.json','w',encoding='utf-8').write(json.dumps({'query': q}))
    os.system('curl -s -X POST "https://api.supabase.com/v1/projects/nlcisbfdiokmipyihtuz/database/query" '
              '-H "Authorization: Bearer %s" -H "Content-Type: application/json" '
              '--data-binary @scratchpad/_q.json -o scratchpad/_r.json' % env['ACCESS_TOKEN_SUPABASE'])
    return json.load(io.open('scratchpad/_r.json', encoding='utf-8'))

resumo = {}
for n, (classe, _) in TRIAGEM.items(): resumo[classe] = resumo.get(classe, 0) + 1
print('TRIAGEM DE 14 VIDEOS (16 itens marcados):')
for c in ['ERRO_REAL','ERRO_MENOR','CHECAGEM_ERRADA','VAGO','PRECISA_FONTE']:
    print('  %-16s %s' % (c, resumo.get(c, 0)))

ACAO = {
 'ERRO_REAL':       'Decisao do dono. Video ja no ar: manter e usar esta resposta se alguem apontar. Nao publicado: nao publicar como esta.',
 'ERRO_MENOR':      'Nenhuma acao. Se alguem apontar, reconhecer o numero exato — nao muda a historia.',
 'CHECAGEM_ERRADA': 'Nenhuma acao no video. O erro foi do verificador; este registro existe para o proximo leitor nao "corrigir" um roteiro correto.',
 'VAGO':            'Nenhuma acao. O verificador pediu precisao sem apontar erro.',
 'PRECISA_FONTE':   'Pendente de fonte. Nao afirmar nem desmentir ate ter referencia — foi assim que o erro entrou.',
}

feitos = 0
for numero, (classe, porque) in TRIAGEM.items():
    payload = json.dumps({
        'quando': '2026-09-09',
        'classe': classe,
        'porque': porque,
        'acao': ACAO[classe],
        'revisado_por': 'agente do pulso_control, item a item',
        'nota': 'A checagem automatica NAO e arbitro final: em 4 dos 14 ela marcou como errado um trecho correto.',
    }, ensure_ascii=False).replace("'", "''")
    r = sql("""update pulso_content.ideias i
               set metadata = jsonb_set(coalesce(i.metadata,'{}'::jsonb), '{correcao}', '%s'::jsonb)
               from pulso_content.pipeline_producao p
               where p.ideia_id = i.id and p.metadata->>'numero' = '%s'""" % (payload, numero))
    if isinstance(r, list): feitos += 1
    else: print('  FALHOU #%s: %s' % (numero, str(r)[:120]))

print('\ngravados:', feitos, 'de', len(TRIAGEM))
v = sql("select count(*) n from pulso_content.ideias where metadata ? 'correcao'")
print('ideias com correcao no banco:', v[0]['n'] if isinstance(v, list) else v)
w = sql("select metadata->'correcao'->>'classe' classe, count(*) n from pulso_content.ideias where metadata ? 'correcao' group by 1 order by 2 desc")
for r in (w if isinstance(w, list) else []): print('  %-16s %s' % (r['classe'], r['n']))
