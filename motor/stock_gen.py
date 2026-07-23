# Acervo real grátis (Pexels + Pixabay) — tier 0 de b-roll do PULSO. Custo: R$ 0,00.
# Entra ANTES do Wan: se existe filmagem real que serve, não faz sentido gerar por IA.
# Uso: ok, fonte, usd = gerar(prompt_cena, dur, out)
import os, json, re, subprocess, urllib.request, urllib.parse

_ENV = "D:/projetos/pulso_control/.env"
# Termos que denunciam cena com gente — o PULSO é faceless (ver regra do formato).
_PESSOAS = ("people", "person", "man", "woman", "child", "kid", "boy", "girl", "crowd",
            "family", "portrait", "face", "hands", "couple", "player", "athlete")
# Palavras de enquadramento/estilo não ajudam a busca em acervo — só poluem a query.
_RUIDO = ("cinematic", "shot", "slow", "pull", "back", "wide", "empty", "space", "top",
          "no", "readable", "text", "logos", "camera", "angle", "closeup", "close",
          "up", "the", "a", "an", "of", "in", "on", "and", "with", "gently", "softly")


def _env(chave):
    try:
        for ln in open(_ENV, encoding="utf-8", errors="ignore"):
            if ln.startswith(chave + "="):
                return ln.split("=", 1)[1].strip().strip('"')
    except Exception:
        pass
    return ""


def _termos(prompt):
    """Palavras de conteúdo do prompt, sem estilo e sem gente, na ordem em que aparecem."""
    palavras = [w.lower() for w in re.findall(r"[A-Za-z]+", prompt or "")]
    uteis = [w for w in palavras if len(w) > 2 and w not in _RUIDO and w not in _PESSOAS]
    vistos, saida = set(), []
    for w in uteis:
        if w not in vistos:
            vistos.add(w)
            saida.append(w)
    return saida


def _queries(prompt):
    """Consultas do específico ao geral. O acervo casa TODAS as palavras (AND), então
    'ancient parchment map wooden' quase sempre volta vazio enquanto 'parchment map' acha.
    Sem esses degraus o tier de acervo nunca entregava e tudo caía pro Wan (pago)."""
    t = _termos(prompt)
    if not t:
        return []
    fora = []
    for n in (3, 2, 1):
        if len(t) >= n:
            q = " ".join(t[:n])
            if q not in fora:
                fora.append(q)
    return fora


def _query(prompt):
    qs = _queries(prompt)
    return qs[0] if qs else ""


def _tem_pessoa(texto):
    t = (texto or "").lower()
    return any(re.search(r"\b" + p + r"\b", t) for p in _PESSOAS)


def _valido(path):
    try:
        if not (os.path.exists(path) and os.path.getsize(path) > 50000):
            return False
        r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                            "-of", "csv=p=0", path], capture_output=True, text=True, timeout=30)
        return r.returncode == 0 and (r.stdout or "").strip() not in ("", "N/A", "0.000000")
    except Exception:
        return False


def _baixar(url, out):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "pulso/1.0"})
        with urllib.request.urlopen(req, timeout=120) as r, open(out, "wb") as f:
            f.write(r.read())
        return _valido(out)
    except Exception:
        return False


def _get(url, headers=None):
    # User-Agent OBRIGATÓRIO: o urllib se identifica como "Python-urllib/3.x" e o Pexels
    # devolve 403 Forbidden. Com curl a mesma chave funcionava — foi o que mascarou o
    # problema e fez parecer que o acervo não tinha nada, quando nem chegava a buscar.
    h = {"User-Agent": "Mozilla/5.0 (compatible; pulso-broll/1.0)"}
    h.update(headers or {})
    req = urllib.request.Request(url, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f"      [stock] HTTP {e.code} em {url.split('?')[0]}", flush=True)
        return {}
    except Exception as e:
        print(f"      [stock] falha de rede: {type(e).__name__}", flush=True)
        return {}


def _pexels(q, dur, orientacao="portrait"):
    key = _env("PEXELS_API_KEY")
    if not key:
        return None
    url = ("https://api.pexels.com/videos/search?query=" + urllib.parse.quote(q)
           + ("&orientation=" + orientacao if orientacao else "") + "&size=medium&per_page=15")
    j = _get(url, {"Authorization": key})
    for v in (j.get("videos") or []):
        if v.get("duration", 0) < dur:          # curto demais pra cena: descarta
            continue
        if _tem_pessoa(v.get("url", "")):       # o slug da URL traz o assunto (faceless)
            continue
        arquivos = [f for f in (v.get("video_files") or []) if (f.get("height") or 0) >= 1080]
        if not arquivos:
            continue
        arquivos.sort(key=lambda f: f.get("height", 0))   # o menor que ainda é full HD
        return arquivos[0].get("link")
    return None


def _pixabay(q, dur):
    key = _env("PIXABAY_API_KEY")
    if not key:
        return None
    url = ("https://pixabay.com/api/videos/?key=" + key + "&q=" + urllib.parse.quote(q)
           + "&per_page=20&safesearch=true")
    j = _get(url)
    cands = []
    for v in (j.get("hits") or []):
        if v.get("duration", 0) < dur:
            continue
        if _tem_pessoa(v.get("tags", "")):
            continue
        vids = v.get("videos") or {}
        alvo = vids.get("large") or vids.get("medium")
        if not (alvo and alvo.get("url")):
            continue
        # o make_video corta pra 9:16; clip deitado vira zoom pesado, então vertical primeiro
        vertical = (alvo.get("height") or 0) >= (alvo.get("width") or 0)
        cands.append((0 if vertical else 1, alvo["url"]))
    cands.sort(key=lambda c: c[0])
    return cands[0][1] if cands else None


def gerar(prompt_cena, dur, out):
    """Procura b-roll real que sirva pra cena. Retorna (ok:bool, fonte:str, usd:float=0)."""
    queries = _queries(prompt_cena)
    if not queries:
        return (False, "", 0.0)
    # Do específico ao geral; dentro de cada consulta, do melhor enquadramento ao pior
    # (vertical de verdade > vertical do Pixabay > deitado, que o make_video corta).
    for q in queries:
        tentativas = (
            ("pexels", lambda q=q: _pexels(q, dur, "portrait")),
            ("pixabay", lambda q=q: _pixabay(q, dur)),
            ("pexels-wide", lambda q=q: _pexels(q, dur, "")),
        )
        for nome, fn in tentativas:
            try:
                link = fn()
            except Exception:
                link = None
            if not link:
                continue
            if _baixar(link, out):
                print(f"      [stock] {nome}: '{q}' -> clip real (R$0)", flush=True)
                return (True, nome, 0.0)
    print(f"      [stock] nada util pra '{queries[0]}' (nem afrouxando) -> cai pro Wan", flush=True)
    return (False, "", 0.0)


if __name__ == "__main__":
    import sys
    p = sys.argv[1] if len(sys.argv) > 1 else "An ancient parchment map on a wooden table, cinematic, no people"
    ok, fonte, usd = gerar(p, 5, "D:/tmp/_stock_teste.mp4")
    print(f"RESULTADO: ok={ok} fonte={fonte} query='{_query(p)}'")
