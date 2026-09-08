# Executa um .sql pela Management API do Supabase. Le o token do .env.
import json, sys, urllib.request
env = {}
for l in open('.env', encoding='utf-8'):
    if '=' in l and not l.strip().startswith('#'):
        k, v = l.split('=', 1); env[k.strip()] = v.strip().strip('"')
sql = open(sys.argv[1], encoding='utf-8').read()
req = urllib.request.Request(
    "https://api.supabase.com/v1/projects/nlcisbfdiokmipyihtuz/database/query",
    data=json.dumps({"query": sql}).encode(),
    headers={"Authorization": "Bearer " + env['ACCESS_TOKEN_SUPABASE'], "Content-Type": "application/json"})
try:
    print(urllib.request.urlopen(req).read().decode()[:3000])
except urllib.error.HTTPError as e:
    print("ERRO", e.code, e.read().decode()[:1500]); sys.exit(1)
