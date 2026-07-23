# Wan (Alibaba Model Studio / DashScope) — gerador de b-roll do PULSO. Região Singapura.
# Cascata de modelos: cota grátis é POR MODELO; ao esgotar (AllocationQuota) cai pro próximo.
# Uso: ok, modelo, usd = gerar(prompt, dur, out)   (out = caminho .mp4 destino)
import os, json, time, urllib.request

_BASE = "https://dashscope-intl.aliyuncs.com/api/v1"
# (modelo, size aceito por esse modelo) — tamanho é POR MODELO, não misturar
MODELOS = [
    # ORDEM = melhor qualidade primeiro, entre os que AINDA TÊM COTA (checado 22/07).
    ("wan2.7-t2v",         "832*1088"),   # ✅ cota livre — o mais novo
    ("wan2.1-t2v-turbo",   "480*832"),    # ✅ cota livre
    # esgotados em 22/07 (ficam no fim: se a cota renovar/for paga, voltam a servir)
    ("wan2.5-t2v-preview", "480*832"),
    ("wan2.6-t2v",         "720*1280"),
    ("wan2.2-t2v-plus",    "480*832"),
]
USD_POR_S = 0.10  # ~US$0,10/s 720p (referência de custo p/ ledger)


def _key():
    for ln in open("D:/projetos/pulso_control/.env", encoding="utf-8", errors="ignore"):
        if ln.startswith("DASHSCOPE_API_KEY_SG="):
            return ln.split("=", 1)[1].strip().strip('"')
    return ""


def _req(method, path, body=None, key=None):
    data = json.dumps(body).encode() if body is not None else None
    h = {"Authorization": "Bearer " + key, "Content-Type": "application/json"}
    if method == "POST":
        h["X-DashScope-Async"] = "enable"
    req = urllib.request.Request(_BASE + path, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read())
        except Exception:
            return {"code": "HTTPError", "message": str(e)}
    except Exception as e:
        return {"code": "Error", "message": str(e)}


def _valido(path):
    import subprocess
    try:
        if not (os.path.exists(path) and os.path.getsize(path) > 50000):
            return False
        r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                           capture_output=True, text=True, timeout=30)
        return r.returncode == 0 and (r.stdout or "").strip() not in ("", "N/A", "0.000000")
    except Exception:
        return False


def gerar(prompt, dur, out, timeout_s=300):
    """Gera um clip via Wan (cascata de modelos). Retorna (ok:bool, modelo:str, usd:float)."""
    key = _key()
    if not key:
        return (False, "", 0.0)
    for modelo, size in MODELOS:
        sub = _req("POST", "/services/aigc/video-generation/video-synthesis",
                   {"model": modelo, "input": {"prompt": prompt}, "parameters": {"size": size}}, key)
        code = str(sub.get("code", ""))
        if "AllocationQuota" in code or "Throttling" in code:
            print(f"      [wan] {modelo}: cota esgotada ({code}) -> proximo modelo", flush=True)
            continue
        task = (sub.get("output") or {}).get("task_id")
        if not task:
            print(f"      [wan] {modelo}: sem task_id ({json.dumps(sub)[:120]})", flush=True)
            continue
        # poll
        t0 = time.time()
        while time.time() - t0 < timeout_s:
            time.sleep(8)
            st = _req("GET", f"/tasks/{task}", None, key)
            o = st.get("output") or {}
            status = o.get("task_status")
            if status == "SUCCEEDED":
                url = o.get("video_url")
                if url:
                    for _ in range(2):
                        try:
                            urllib.request.urlretrieve(url, out)
                        except Exception:
                            continue
                        if _valido(out):
                            usd = round((dur or 5) * USD_POR_S, 3)
                            return (True, modelo, usd)
                break  # SUCCEEDED mas download ruim -> tenta proximo modelo
            if status == "FAILED":
                print(f"      [wan] {modelo}: FAILED {json.dumps(o)[:120]}", flush=True)
                break
        # timeout ou falha -> proximo modelo
    return (False, "", 0.0)


if __name__ == "__main__":
    import sys
    p = sys.argv[1] if len(sys.argv) > 1 else "A vintage soccer ball on a grassy field, cinematic, no people"
    ok, mod, usd = gerar(p, 5, "D:/tmp/_wan_teste.mp4")
    print(f"RESULTADO: ok={ok} modelo={mod} usd={usd} arquivo={'ok' if os.path.exists('D:/tmp/_wan_teste.mp4') else 'nao'}")
