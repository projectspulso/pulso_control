# Gera 1 miniatura por clip do banco, sobe pro Supabase Storage e grava o catálogo
# em configuracoes (banco_clips_catalogo) pra o app montar a galeria buscável.
import os, sys, json, hashlib, subprocess, urllib.request

SO_NOVOS = "--novos" in sys.argv  # worker: só sobe thumb de clip novo (catálogo/usos sempre atualiza)

BANCO = "D:/tmp/banco_clips"
IDX = BANCO + "/index.json"
THUMBS = BANCO + "/thumbs"
BUCKET = "banco-clips"

env = {}
for ln in open("D:/projetos/pulso_control/.env", encoding="utf-8", errors="ignore"):
    if "=" in ln and not ln.strip().startswith("#"):
        k, v = ln.split("=", 1); env[k.strip()] = v.strip().strip('"')
URL = env.get("SUPABASE_URL") or env["NEXT_PUBLIC_SUPABASE_URL"]
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]
H = {"apikey": KEY, "Authorization": "Bearer " + KEY}

os.makedirs(THUMBS, exist_ok=True)


def req(method, path, data=None, headers=None, raw=False):
    h = dict(H); h.update(headers or {})
    r = urllib.request.Request(URL + path, method=method, data=data, headers=h)
    try:
        with urllib.request.urlopen(r) as resp:
            b = resp.read()
            return json.loads(b) if (b and not raw) else b
    except urllib.error.HTTPError as e:
        return {"_err": e.code, "_msg": e.read().decode()[:120]}


# 1) garante o bucket público
b = req("POST", "/storage/v1/bucket", json.dumps({"id": BUCKET, "name": BUCKET, "public": True}).encode(),
        {"Content-Type": "application/json"})
_bmsg = (b.get("_msg", "") if isinstance(b, dict) else "").lower()
_bok = not (isinstance(b, dict) and b.get("_err")) or "exist" in _bmsg or "duplicate" in _bmsg
print("bucket:", "ok" if _bok else b)

clips = json.load(open(IDX, encoding="utf-8"))
catalogo = []
feitos = up = 0
for c in clips:
    cid = c["id"]; src = c["file"]; thumb = f"{THUMBS}/{cid}.jpg"
    if not os.path.exists(src):
        continue
    novo = not os.path.exists(thumb)
    if novo:
        subprocess.run(["ffmpeg", "-y", "-ss", "1", "-i", src, "-frames:v", "1", "-vf", "scale=200:-1", thumb],
                       capture_output=True)
    if os.path.exists(thumb):
        feitos += 1
        if novo or not SO_NOVOS:  # no modo --novos só sobe o que é novo
            blob = open(thumb, "rb").read()
            r = req("POST", f"/storage/v1/object/{BUCKET}/thumbs/{cid}.jpg", blob,
                    {"Content-Type": "image/jpeg", "x-upsert": "true"}, raw=True)
            if not (isinstance(r, dict) and r.get("_err")):
                up += 1
    # video_url e prompt_hash TÊM que sair daqui: este script reescreve o catálogo inteiro a
    # cada rodada, então qualquer campo anotado por fora é apagado na próxima (foi o que
    # aconteceu com a migração de 22/07). A URL é determinística — o id é o nome do arquivo.
    catalogo.append({
        "id": cid, "prompt": (c.get("prompt") or "")[:140], "tags": c.get("tags", []),
        "tema": c.get("tema", ""), "dur": c.get("dur", 8), "usos": c.get("usos", 0),
        "thumb": f"{URL}/storage/v1/object/public/{BUCKET}/thumbs/{cid}.jpg",
        "video_url": f"{URL}/storage/v1/object/public/{BUCKET}/videos/{cid}.mp4",
        "prompt_hash": hashlib.sha1((c.get("prompt") or "").strip().encode("utf-8")).hexdigest()[:16],
    })

# 2) grava o catálogo em configuracoes (PATCH→POST)
row = {"valor": json.dumps(catalogo, ensure_ascii=False), "tipo": "json",
       "categoria": "banco_clips", "descricao": "Catalogo navegavel do banco de clips"}
import urllib.parse
upd = req("PATCH", "/rest/v1/configuracoes?chave=eq.banco_clips_catalogo", json.dumps(row).encode(),
          {"Content-Type": "application/json", "Content-Profile": "pulso_core", "Prefer": "return=representation"})
if not upd:
    req("POST", "/rest/v1/configuracoes", json.dumps({**row, "chave": "banco_clips_catalogo"}).encode(),
        {"Content-Type": "application/json", "Content-Profile": "pulso_core"})
print(f"thumbs geradas={feitos} | upload ok={up} | catalogo={len(catalogo)} clips")
