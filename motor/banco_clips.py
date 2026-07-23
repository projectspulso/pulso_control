# Banco de clips reusáveis do PULSO — economia de créditos Veo.
# Indexa clips já gerados por palavra-chave do prompt da CENA (não da base de estilo,
# que é igual em todo vídeo). gen_scenes consulta antes de gerar; casou = copia (0cr).
import os, json, re, hashlib, shutil, datetime

BANCO_DIR = "D:/tmp/banco_clips"
IDX = BANCO_DIR + "/index.json"
MAX_USOS = 3          # não repete o mesmo clip mais que isso (anti-repetição)
THRESHOLD = 0.55      # similaridade mínima de palavras-chave pra reusar (estrito = qualidade)

# palavras de estilo/genéricas que não distinguem conteúdo (a base PULSO + conectivos)
STOP = set((
    "a an the of on in at to from for by and or with as is it its into out over under "
    "slow fast pan zoom shot wide close up angle camera scene view "
    "dramatic inspiring cinematic visuals no people readable text logos detailed realistic "
    "soft warm cold light dark shadow shadows long bright moody atmospheric"
).split())

os.makedirs(BANCO_DIR, exist_ok=True)


def _load():
    if os.path.exists(IDX):
        try:
            return json.load(open(IDX, encoding="utf-8"))
        except Exception:
            return []
    return []


def _save(d):
    json.dump(d, open(IDX, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def tokens(prompt):
    ws = re.findall(r"[a-zA-Z]{3,}", (prompt or "").lower())
    return set(w for w in ws if w not in STOP)


def _jaccard(a, b):
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def buscar(prompt_cena, dur, idx_cena=None, usados_run=None):
    """Retorna um clip do banco que casa, ou None. prompt_cena = SÓ a cena (sem base)."""
    if idx_cena == 0:
        return None  # hook (cena 1) sempre fresco
    banco = _load()

    def _serve(c):
        return (c.get("usos", 0) < MAX_USOS
                and not (usados_run and c["id"] in usados_run)
                and int(c.get("dur", 8)) >= int(dur))

    # 1) MESMO PROMPT, palavra por palavra: é o mesmo clip: reusa sem adivinhação.
    #    Antes só existia a similaridade por tags, que podia recusar um acerto exato
    #    (tags são derivadas e ruidosas) e mandar gerar de novo o que já estava no banco.
    ph = _prompt_hash(prompt_cena)
    for c in banco:
        if _serve(c) and _prompt_hash(c.get("prompt")) == ph:
            return c

    # 2) senão, similaridade de tags
    t = tokens(prompt_cena)
    if len(t) < 2:
        return None
    best, best_s = None, 0.0
    for c in banco:
        if c.get("usos", 0) >= MAX_USOS:
            continue
        if usados_run and c["id"] in usados_run:
            continue  # não usa o mesmo clip 2x no mesmo vídeo
        if int(c.get("dur", 8)) < int(dur):
            continue
        s = _jaccard(t, set(c.get("tags", [])))
        if s > best_s:
            best_s, best = s, c
    return best if (best and best_s >= THRESHOLD) else None


_MATCH_URL = "https://pulsoprojects.vercel.app/api/banco-clips/match"


def _service_key():
    try:
        for ln in open("D:/projetos/pulso_control/.env", encoding="utf-8", errors="ignore"):
            if ln.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                return ln.split("=", 1)[1].strip().strip('"')
    except Exception:
        pass
    return ""


def enriquecer_novos():
    """Dispara tag por visão + embedding dos clips NOVOS (rotas no Vercel). Idempotente
    (só processa o que falta). Chamado pelo worker após cada render."""
    key = _service_key()
    if not key:
        return
    import urllib.request
    base = "https://pulsoprojects.vercel.app/api/banco-clips"
    for ep in ("tag?limit=12", "embed?limit=60"):  # tag primeiro (a visão alimenta o embedding)
        try:
            req = urllib.request.Request(f"{base}/{ep}", method="POST", data=b"{}",
                                         headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
            urllib.request.urlopen(req, timeout=90)
        except Exception:
            pass


def buscar_semantico(prompt_cena, dur, idx_cena=None, usados_run=None):
    """Match por embedding (rota no Vercel). Retorna {id,file,score} ou None. Hook (0) nunca."""
    if idx_cena == 0:
        return None
    key = _service_key()
    if not key:
        return None
    import urllib.request
    body = json.dumps({"prompt": prompt_cena, "dur": int(dur), "idxCena": idx_cena,
                       "usados": list(usados_run or [])}).encode()
    req = urllib.request.Request(_MATCH_URL, method="POST", data=body,
                                 headers={"Content-Type": "application/json", "Authorization": "Bearer " + key})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            d = json.loads(r.read())
    except Exception:
        return None
    m = d.get("match")
    if not m:
        return None
    f = f"{BANCO_DIR}/{m['id']}.mp4"
    if not os.path.exists(f):
        return None
    return {"id": m["id"], "file": f, "score": m.get("score")}


def usar(clip_id):
    banco = _load()
    for c in banco:
        if c["id"] == clip_id:
            c["usos"] = c.get("usos", 0) + 1
            c["ultimo_uso"] = datetime.date.today().isoformat()
    _save(banco)


def _hash(fp):
    h = hashlib.md5()
    with open(fp, "rb") as f:
        for ch in iter(lambda: f.read(65536), b""):
            h.update(ch)
    return h.hexdigest()[:12]


def _prompt_hash(p):
    return hashlib.sha1((p or "").strip().encode("utf-8")).hexdigest()[:16]


def _subir_storage(hid, filepath):
    """Sobe o clip pro storage durável (banco-clips/videos/<hid>.mp4). Retorna a URL pública ou None.
    ESTANCA A SANGRIA: sem isto o .mp4 só vivia no D:/tmp (temp) e sumia. Ver saida-videos-onedrive."""
    key = _service_key()
    if not key:
        return None
    import urllib.request
    url_base = ""
    for ln in open("D:/projetos/pulso_control/.env", encoding="utf-8", errors="ignore"):
        if ln.startswith("NEXT_PUBLIC_SUPABASE_URL=") or (not url_base and ln.startswith("SUPABASE_URL=")):
            url_base = ln.split("=", 1)[1].strip().strip('"')
    if not url_base:
        return None
    try:
        data = open(filepath, "rb").read()
        req = urllib.request.Request(
            f"{url_base}/storage/v1/object/banco-clips/videos/{hid}.mp4", data=data, method="POST",
            headers={"Authorization": "Bearer " + key, "Content-Type": "video/mp4", "x-upsert": "true"})
        urllib.request.urlopen(req, timeout=90)
        return f"{url_base}/storage/v1/object/public/banco-clips/videos/{hid}.mp4"
    except Exception:
        return None


def adicionar(prompt_cena, dur, filepath, tema="", modelo="veo", usd=0.0):
    """Copia o clip pro banco local + SOBE pro storage durável + indexa. Dedup por conteúdo (hash)."""
    if not os.path.exists(filepath) or os.path.getsize(filepath) == 0:
        return None
    banco = _load()
    hid = _hash(filepath)
    if any(c.get("hash") == hid for c in banco):
        return None  # clip idêntico já no banco
    dest = f"{BANCO_DIR}/{hid}.mp4"
    if not os.path.exists(dest):
        shutil.copy2(filepath, dest)
    video_url = _subir_storage(hid, dest)  # durável na hora — nunca mais se perde
    entry = {
        "id": hid, "hash": hid, "file": dest, "prompt": prompt_cena,
        "prompt_hash": _prompt_hash(prompt_cena),
        "tags": sorted(tokens(prompt_cena)), "tema": tema, "dur": int(dur),
        "modelo": modelo, "usd": round(float(usd), 3), "video_url": video_url,
        "usos": 0, "criado": datetime.date.today().isoformat(),
    }
    banco.append(entry)
    _save(banco)
    return entry


def stats():
    b = _load()
    return {
        "clips": len(b),
        "usos_total": sum(c.get("usos", 0) for c in b),
        "creditos_economizados": sum(c.get("usos", 0) * int(c.get("dur", 8)) for c in b),
        "temas": len(set(c.get("tema", "") for c in b)),
    }


def sincronizar_supabase():
    """Empurra o RESUMO do banco pra configuracoes (o app mostra o acervo). Banco é local-first;
    isto é só visibilidade — os clips ficam no PC (render é local)."""
    try:
        import sys
        sys.path.insert(0, "D:/tmp")
        import pulso_guard as g
    except Exception:
        return
    b = _load()
    por_tema = {}
    for c in b:
        t = c.get("tema", "?")
        por_tema[t] = por_tema.get(t, 0) + 1
    payload = {**stats(), "por_tema": por_tema, "atualizado": datetime.date.today().isoformat()}
    row = {"valor": json.dumps(payload, ensure_ascii=False), "tipo": "json",
           "categoria": "banco_clips", "descricao": "Estatisticas do banco de clips reusaveis"}
    try:
        upd = g._db("PATCH", "/rest/v1/configuracoes?chave=eq.banco_clips_stats", row, schema="pulso_core")
        if not upd:  # não existia → cria
            g._db("POST", "/rest/v1/configuracoes", {**row, "chave": "banco_clips_stats"}, schema="pulso_core")
    except Exception:
        pass

