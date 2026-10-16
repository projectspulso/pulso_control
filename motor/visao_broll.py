# -*- coding: utf-8 -*-
"""
FILTRO DE IMAGEM DO B-ROLL — olha o CLIPE antes de ele entrar no vídeo (dono, 15/10/2026).

Por quê: o filtro antigo lia só o nome/tag do clipe. Passaram pessoa (#246) e cena de outro assunto
(#258: copos "Happy St. Patrick's Day" num vídeo de Halloween). Três quadros vão ao Gemini (chave do
próprio PULSO) e voltam três respostas:
  pessoa      qualquer parte reconhecível de ser humano (formato faceless: sem gente)
  texto       texto legível e destacado (placa, tela, letreiro, copo escrito) — some no vídeo ou engana
  relevancia  0–10: o clipe mostra o que a cena do roteiro descreve?
Recusa se pessoa, texto ou relevância < RELEVANCIA_MIN. Veredito fica em cache (arquivo + cena).
Falha da API não derruba o render: o clipe passa marcado `checado: False` e entra na conta do ledger.
Modelo portado do Limelight (scripts/montar-video.mjs, clipeImproprio).
"""
import os, re, json, base64, hashlib, subprocess, tempfile, time, urllib.request, urllib.error

RELEVANCIA_MIN = 5
CACHE = "D:/tmp/visao_cache.json"
MODELO = "gemini-2.5-flash"
_cache = None
STATS = {"checados": 0, "recusados": 0, "nao_checados": 0}


def _chave():
    for l in open("D:/projetos/pulso_control/.env", encoding="utf-8", errors="ignore"):
        m = re.match(r'^GEMINI_API_KEY\s*=\s*"?([^"\r\n]*)', l)
        if m and m.group(1).strip(): return m.group(1).strip()
    return ""


def _md5(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()


def _load():
    global _cache
    if _cache is None:
        try: _cache = json.load(open(CACHE, encoding="utf-8"))
        except Exception: _cache = {}
    return _cache


def _save():
    try: json.dump(_cache, open(CACHE, "w", encoding="utf-8"))
    except Exception: pass


def _quadros(arquivo):
    try:
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arquivo],
                                   capture_output=True, text=True, timeout=30).stdout.strip() or 0)
    except Exception:
        dur = 0
    tempos = [0.5, max(0.6, dur / 2), max(0.7, dur - 0.6)] if dur > 1.5 else [0.2]
    imgs = []
    with tempfile.TemporaryDirectory() as tmp:
        for i, t in enumerate(tempos):
            out = os.path.join(tmp, f"q{i}.jpg")
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{t:.2f}", "-i", arquivo, "-frames:v", "1", "-q:v", "4",
                            "-vf", "scale=360:-1", out], capture_output=True, timeout=60)
            if os.path.exists(out): imgs.append(base64.b64encode(open(out, "rb").read()).decode())
    return imgs


def _perguntar(imgs, cena, tema=None):
    texto = ("Estes quadros vêm do MESMO clipe de vídeo, que vai ilustrar uma cena de um vídeo curto"
             + (f" sobre \"{tema}\"" if tema else "") + f". A cena pede: \"{cena}\". Responda sobre o conjunto dos quadros.\n"
             "1) PESSOA: aparece em destaque alguma parte reconhecível de um ser humano — rosto, corpo, mãos, braços, "
             "pernas, silhueta clara, alguém de uniforme? Figura minúscula ao longe, manequim e estátua não contam.\n"
             "2) TEXTO: existe texto escrito legível e destacado que o espectador leria sem esforço (placa, letreiro, "
             "tela, página, embalagem ou copo com frase)? Ignore texto minúsculo, borrado ou de fundo.\n"
             "3) RELEVANCIA: de 0 a 10, o clipe serve para ilustrar esta cena DENTRO do tema do vídeo? Não exija a ação exata: "
             "10 = mostra o que a cena pede; 6-8 = mostra o assunto do vídeo de forma próxima; 5 = genérico mas combina com o "
             "clima e o tema; 2-4 = assunto vizinho que confunde; 0-1 = outro assunto ou contexto errado (outra festa, outro "
             "país, outro objeto principal).\n"
             'Responda JSON: {"pessoa": true|false, "onde_pessoa": "<curto|null>", "texto": true|false, '
             '"o_que_diz": "<curto|null>", "relevancia": 0-10, "mostra": "<o que o clipe mostra, curto>"}')
    corpo = {"contents": [{"role": "user", "parts": [{"text": texto}] + [{"inlineData": {"mimeType": "image/jpeg", "data": d}} for d in imgs]}],
             "generationConfig": {"temperature": 0, "responseMimeType": "application/json"}}
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODELO}:generateContent",
                                 data=json.dumps(corpo).encode(), method="POST",
                                 headers={"x-goog-api-key": _chave(), "Content-Type": "application/json"})
    for tent in range(3):
        try:
            j = json.load(urllib.request.urlopen(req, timeout=60))
            txt = "".join(p.get("text", "") for p in j["candidates"][0]["content"]["parts"]).strip()
            return json.loads(re.sub(r"^```json\s*|\s*```$", "", txt))
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 503) and tent < 2: time.sleep(8 * (tent + 1)); continue
            raise
        except Exception:
            if tent < 2: time.sleep(3); continue
            raise


def checar(arquivo, cena, tema=None, exigir_relevancia=True):
    """{'ok', 'checado', 'motivo', ...}. ok=False = recusar este clipe.
    exigir_relevancia=False para a cena do fecho (CTA), que é paisagem calma de propósito."""
    if not _chave():
        STATS["nao_checados"] += 1
        return {"ok": True, "checado": False, "motivo": "sem GEMINI_API_KEY"}
    c = _load()
    k = "v2:" + _md5(arquivo) + ":" + hashlib.md5(f"{tema}|{cena}".encode()).hexdigest()[:12]
    if k in c:
        d = c[k]
    else:
        try:
            imgs = _quadros(arquivo)
            if not imgs:
                STATS["nao_checados"] += 1
                return {"ok": True, "checado": False, "motivo": "sem quadro"}
            d = _perguntar(imgs, cena, tema)
            c[k] = d; _save()
        except Exception as e:
            STATS["nao_checados"] += 1
            print(f"      [visao] não checou ({str(e)[:80]}) — clipe passa sem filtro", flush=True)
            return {"ok": True, "checado": False, "motivo": "erro na API"}
    STATS["checados"] += 1
    rel = d.get("relevancia")
    rel = rel if isinstance(rel, (int, float)) else 10
    motivo = None
    if d.get("pessoa") is True: motivo = f"pessoa ({d.get('onde_pessoa') or 'na cena'})"
    elif d.get("texto") is True: motivo = f"texto legível ({d.get('o_que_diz') or '?'})"
    elif exigir_relevancia and rel < RELEVANCIA_MIN: motivo = f"fora do assunto ({rel}/10: {d.get('mostra') or '?'})"
    if motivo:
        STATS["recusados"] += 1
        print(f"      [visao] RECUSADO: {motivo}", flush=True)
    return {"ok": motivo is None, "checado": True, "motivo": motivo, "pessoa": d.get("pessoa"),
            "texto": d.get("texto"), "relevancia": rel, "mostra": d.get("mostra")}


if __name__ == "__main__":
    import sys
    print(json.dumps(checar(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None), ensure_ascii=False, indent=2))
