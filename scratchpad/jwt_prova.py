# Prova de acesso pela API REAL (PostgREST), com JWT assinado pela chave do proprio projeto.
# Nenhuma conta criada, nenhuma senha: a RLS so le o `sub` do token. O segredo nunca e impresso.
import json, io, hmac, hashlib, base64, time, urllib.request, sys
env = {}
for l in io.open('.env', encoding='utf-8'):
    if '=' in l and not l.strip().startswith('#'):
        k, v = l.split('=', 1); env[k.strip()] = v.strip().strip('"')
def get(url, headers):
    req = urllib.request.Request(url, headers={**headers, 'User-Agent': 'curl/8'})
    try:
        r = urllib.request.urlopen(req, timeout=30); return r.status, json.loads(r.read() or b'null')
    except urllib.error.HTTPError as e:
        return e.code, None
sec = get('https://api.supabase.com/v1/projects/nlcisbfdiokmipyihtuz/postgrest',
          {'Authorization': 'Bearer ' + env['ACCESS_TOKEN_SUPABASE']})[1]['jwt_secret']
b64 = lambda b: base64.urlsafe_b64encode(b).rstrip(b'=').decode()
def jwt(sub):
    h = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}).encode())
    p = b64(json.dumps({'sub': sub, 'role': 'authenticated', 'aud': 'authenticated',
                        'iat': int(time.time()), 'exp': int(time.time()) + 600}).encode())
    s = b64(hmac.new(sec.encode(), f'{h}.{p}'.encode(), hashlib.sha256).digest())
    return f'{h}.{p}.{s}'
URL, ANON = env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
PAPEIS = {
  'intruso': jwt('00000000-0000-0000-0000-0000000000ff'),
  'dono':    jwt('7c89e951-63c6-41b9-81b0-094baab51d3e'),
}
ALVOS = [  # (rotulo, schema, relacao)
  ('views: roteiros',        'public',        'roteiros'),
  ('views: ideias',          'public',        'ideias'),
  ('views: configuracoes',   'public',        'configuracoes'),
  ('tabela: configuracoes',  'pulso_core',    'configuracoes'),
  ('tabela: usuarios_int.',  'pulso_core',    'usuarios_internos'),
  ('views: v_custos_mes',    'pulso_content', 'v_custos_mes'),
]
fase = sys.argv[1] if len(sys.argv) > 1 else '?'
print(f'=== {fase}: chamada REAL ao PostgREST, com JWT assinado ===')
print('  %-24s %-14s %-14s' % ('relacao', 'intruso', 'dono'))
for rot, sch, rel in ALVOS:
    lin = []
    for papel in ('intruso', 'dono'):
        code, data = get(f'{URL}/rest/v1/{rel}?select=*&limit=500',
                         {'apikey': ANON, 'Authorization': 'Bearer ' + PAPEIS[papel], 'Accept-Profile': sch})
        lin.append(f'{len(data)} linhas' if code == 200 and isinstance(data, list) else f'HTTP {code}')
    alerta = '  <<< ABERTO' if lin[0].split()[0] not in ('0', 'HTTP') else ''
    print('  %-24s %-14s %-14s%s' % (rot, lin[0], lin[1], alerta))
# escrita: PATCH que nao muda nada (filtro que casa com nenhuma chave real devolveria 0; aqui usamos
# prefer=return=representation com chave=eq.<chave existente> e set chave=<mesma> -> no-op)
code, data = get(f'{URL}/rest/v1/configuracoes?select=chave&limit=1',
                 {'apikey': ANON, 'Authorization': 'Bearer ' + PAPEIS['dono'], 'Accept-Profile': 'pulso_core'})
if code == 200 and data:
    ch = data[0]['chave']
    req = urllib.request.Request(f'{URL}/rest/v1/configuracoes?chave=eq.{ch}',
        data=json.dumps({'chave': ch}).encode(), method='PATCH',
        headers={'apikey': ANON, 'Authorization': 'Bearer ' + PAPEIS['intruso'], 'Content-Profile': 'pulso_core',
                 'Content-Type': 'application/json', 'Prefer': 'return=representation', 'User-Agent': 'curl/8'})
    try:
        r = urllib.request.urlopen(req, timeout=30); n = len(json.loads(r.read() or b'[]'))
        print(f'  ESCRITA intruso em configuracoes (no-op): alterou {n} linha(s)' + ('  <<< ESCRITA ABERTA' if n else ''))
    except urllib.error.HTTPError as e:
        print(f'  ESCRITA intruso em configuracoes: HTTP {e.code} (bloqueada)')
