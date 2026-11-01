# -*- coding: utf-8 -*-
"""
CERTIFICADO DO VÍDEO — confere o ARQUIVO que vai ao ar, sem o qual a publicação recusa (dono, 31/10/2026).

Por quê: o #242 foi renderizado em 24/09, ficou 5 semanas na fila e saiu em 31/10 com o mascote grande
cobrindo o vídeo e clipes de outro assunto. O QC só roda no render; nada conferia de novo ao publicar.
O certificado vale para uma URL: remontou, a URL muda e ele precisa ser refeito.

Barra:
  render antigo  clipes de antes do filtro de imagem (15/10/2026), que nunca passaram por ele
  mascote        mascote grande antes dos 75% finais (o montador nunca o coloca antes disso)
  duração        vídeo vazio ou ilegível
Falha da API ou do ffmpeg não certifica: fica sem certificado e a próxima rodada tenta de novo.

Uso: python certificar_video.py --fila [--refazer]  |  python certificar_video.py <numero>
"""
import os, re, sys, json, base64, tempfile, subprocess, datetime, urllib.request
sys.path.insert(0, "D:/tmp")
import pulso_guard as g
import visao_broll as v

VERSAO = 1
FILTRO_DESDE = "2026-10-15"
PONTOS = (.10, .20, .30, .40, .50, .60, .70, .73)
PROMPT = ("Estes quadros vêm, em ordem, de um vídeo vertical. Numere-os a partir de 0. O vídeo tem um mascote roxo de boné "
          "amarelo e casaco azul. Em quais quadros ele aparece GRANDE, de corpo inteiro, no meio da tela? A bolha pequena "
          "redonda no canto inferior esquerdo NÃO conta. Em quais quadros aparece uma pessoa real em destaque? "
          'Responda JSON: {"mascote_grande": [indices], "pessoa": [indices]}')

def duracao(url):
    r = subprocess.run(["ffprobe", "-v", "error", "-rw_timeout", "30000000", "-show_entries", "format=duration", "-of", "csv=p=0", url],
                       capture_output=True, text=True, timeout=120)
    return float(r.stdout.strip() or 0)

def quadro(url, t, out):
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-rw_timeout", "30000000", "-ss", f"{t:.2f}", "-i", url, "-frames:v", "1",
                    "-q:v", "4", "-vf", "scale=360:-1", out], capture_output=True, timeout=120)
    return base64.b64encode(open(out, "rb").read()).decode()

def olhar(imgs):
    corpo = {"contents": [{"role": "user", "parts": [{"text": PROMPT}] + [{"inlineData": {"mimeType": "image/jpeg", "data": d}} for d in imgs]}],
             "generationConfig": {"temperature": 0, "responseMimeType": "application/json"}}
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{v.MODELO}:generateContent",
                                 data=json.dumps(corpo).encode(), method="POST",
                                 headers={"x-goog-api-key": v._chave(), "Content-Type": "application/json"})
    j = json.load(urllib.request.urlopen(req, timeout=120))
    return json.loads("".join(p.get("text", "") for p in j["candidates"][0]["content"]["parts"]))

def render_em(url):
    m = re.match(r"(.+?)_\d{3}(_.*)?\.mp4$", url.rsplit("/", 1)[-1])
    led = f"D:/tmp/pulso_lote4/{m.group(1)}/ledger_render.json" if m else ""
    return json.load(open(led, encoding="utf-8")).get("quando", "")[:10] if led and os.path.exists(led) else None

def certificar(p):
    md = p.get("metadata") or {}; url = md.get("video_url")
    if not url: return None
    motivos = []
    feito = render_em(url)
    if feito and feito < FILTRO_DESDE: motivos.append(f"render de {feito}, anterior ao filtro de imagem")
    d = duracao(url)
    if d <= 0: raise RuntimeError("vídeo ilegível")
    with tempfile.TemporaryDirectory() as tmp:
        imgs = [quadro(url, d * x, f"{tmp}/{i}.jpg") for i, x in enumerate(PONTOS)]
    o = olhar(imgs)
    cedo = sorted(i for i in o.get("mascote_grande", []) if 0 <= i < len(PONTOS))
    if cedo: motivos.append("mascote grande aos " + ", ".join(f"{int(PONTOS[i]*100)}%" for i in cedo))
    cert = {"versao": VERSAO, "url": url, "ok": not motivos, "motivos": motivos, "duracao": round(d, 1), "render_em": feito,
            "pessoa_quadros": o.get("pessoa", []), "em": datetime.datetime.now().isoformat(timespec="seconds")}
    atual = g._db("GET", "/rest/v1/pipeline_producao?id=eq.%s&select=metadata" % p["id"], schema="pulso_content")[0]["metadata"] or {}
    atual["certificado"] = cert
    g._db("PATCH", "/rest/v1/pipeline_producao?id=eq.%s" % p["id"], {"metadata": atual}, schema="pulso_content")
    return cert

def main():
    sys.stdout.reconfigure(encoding="utf-8")
    base = "/rest/v1/pipeline_producao?select=id,metadata,data_publicacao_planejada&status=eq.PRONTO_PUBLICACAO&order=data_publicacao_planejada.asc.nullslast"
    fila = g._db("GET", base, schema="pulso_content") or []
    alvo = sys.argv[1] if len(sys.argv) > 1 else "--fila"
    if alvo != "--fila": fila = [p for p in fila if str((p.get("metadata") or {}).get("numero")) == alvo]
    refazer = "--refazer" in sys.argv or alvo != "--fila"
    for p in fila:
        md = p.get("metadata") or {}; c = md.get("certificado") or {}
        if not refazer and c.get("url") == md.get("video_url") and c.get("versao") == VERSAO: continue
        try:
            r = certificar(p)
            print(f"[certificado] #{md.get('numero')} {'OK' if r['ok'] else 'BARRADO'} {r['motivos'] or ''} pessoa={r['pessoa_quadros']}", flush=True)
        except Exception as e:
            print(f"[certificado] #{md.get('numero')} sem certificado: {str(e)[:120]}", flush=True)

if __name__ == "__main__":
    main()
