# -*- coding: utf-8 -*-
"""
GERADOR DE STORIES do PULSO — as artes saem do vídeo do dia, custo de geração zero.

Plano: docs/planos/motor-stories.md (dono, 03/10/2026). Para cada vídeo PRONTO com video_url:
  pergunta.jpg       — frame do vídeo, escurecido, com o título como pergunta + "a resposta sai às 19h"
  teaser_antes.mp4   — os 9s iniciais (o gancho) com faixa "HOJE ÀS 19H · NO PERFIL"
  teaser_depois.mp4  — os mesmos 9s com faixa "SAIU! VÍDEO COMPLETO NO PERFIL"
Sobe em pulso-assets/stories/<num>_<slug>/ e grava pipeline_producao.metadata.stories.

Sem emoji nas artes: o Pillow não desenha emoji colorido com as fontes do Windows, e quadradinho
vazio no story é pior que nenhum.

Uso:
  python gerar_stories.py <ideia_id>        # um vídeo
  python gerar_stories.py --pendentes [N]   # os N próximos agendados sem stories (padrão 3)
"""
import os, re, sys, json, subprocess, urllib.request, urllib.error, datetime, textwrap
sys.path.insert(0, "D:/tmp"); import pulso_guard as g
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ENV = {}
for l in open(r"D:/projetos/pulso_control/.env", encoding="utf-8", errors="ignore"):
    m = re.match(r'^([A-Za-z0-9_]+)\s*=\s*"?([^"\r\n]*)"?', l)
    if m and m.group(1) not in ENV: ENV[m.group(1)] = m.group(2)
U = ENV["SUPABASE_URL"]; K = ENV["SUPABASE_SERVICE_ROLE_KEY"]
BASE = "D:/tmp/stories"
LOGO = "D:/projetos/pulso_control/public/pulso/logo.png"
F_TITULO = "C:/Windows/Fonts/seguibl.ttf"
F_FAIXA = "C:/Windows/Fonts/impact.ttf"
F_TEXTO = "C:/Windows/Fonts/segoeuib.ttf"
W, H = 1080, 1920
ROXO = (124, 58, 237)

def log(*a): print("[stories]", *a, flush=True)

def baixar(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0: return dest
    with urllib.request.urlopen(url, timeout=300) as r, open(dest, "wb") as f: f.write(r.read())
    return dest

def subir(local, caminho, ctype):
    data = open(local, "rb").read()
    try:
        urllib.request.urlopen(urllib.request.Request(U + "/storage/v1/object/pulso-assets/" + caminho, data=data, method="POST",
            headers={"apikey": K, "Authorization": "Bearer " + K, "Content-Type": ctype, "x-upsert": "true"}), timeout=300).read()
    except urllib.error.HTTPError as e:
        raise Exception("upload %s falhou (%s): %s" % (caminho, e.code, e.read().decode("utf-8", "ignore")[:200]))
    return f"{U}/storage/v1/object/public/pulso-assets/{caminho}"

def quebrar(draw, texto, fonte, largura):
    palavras, linhas, atual = texto.split(), [], ""
    for p in palavras:
        teste = (atual + " " + p).strip()
        if draw.textlength(teste, font=fonte) <= largura: atual = teste
        else:
            if atual: linhas.append(atual)
            atual = p
    if atual: linhas.append(atual)
    return linhas

def pergunta_do_titulo(titulo):
    t = titulo.strip().rstrip(".!")
    return t if t.endswith("?") else t + "?"

def arte_pergunta(frame, titulo, saida):
    fundo = Image.open(frame).convert("RGB")
    esc = max(W / fundo.width, H / fundo.height)
    fundo = fundo.resize((int(fundo.width * esc), int(fundo.height * esc)))
    x0, y0 = (fundo.width - W) // 2, (fundo.height - H) // 2
    fundo = fundo.crop((x0, y0, x0 + W, y0 + H)).filter(ImageFilter.GaussianBlur(22))
    fundo = Image.blend(fundo, Image.new("RGB", (W, H), (8, 6, 16)), 0.72)
    d = ImageDraw.Draw(fundo)
    logo = Image.open(LOGO).convert("RGB").resize((150, 150))
    mask = Image.new("L", (150, 150), 0); ImageDraw.Draw(mask).ellipse((0, 0, 150, 150), fill=255)
    fundo.paste(logo, ((W - 150) // 2, 230), mask)
    d.text((W // 2, 420), "PULSO HISTÓRIAS", font=ImageFont.truetype(F_TEXTO, 44), fill=(220, 210, 255), anchor="mm")
    fonte = ImageFont.truetype(F_TITULO, 92)
    linhas = quebrar(d, pergunta_do_titulo(titulo).upper(), fonte, W - 140)
    if len(linhas) > 5:
        fonte = ImageFont.truetype(F_TITULO, 74); linhas = quebrar(d, pergunta_do_titulo(titulo).upper(), fonte, W - 140)
    alt = 108 if fonte.size == 92 else 88
    y = H // 2 - (len(linhas) * alt) // 2
    for ln in linhas:
        d.text((W // 2, y), ln, font=fonte, fill=(255, 255, 255), anchor="mt", stroke_width=3, stroke_fill=(0, 0, 0)); y += alt
    pill = ImageFont.truetype(F_FAIXA, 64); txt = "A RESPOSTA SAI ÀS 19H"
    tw = d.textlength(txt, font=pill)
    d.rounded_rectangle(((W - tw) // 2 - 50, 1480, (W + tw) // 2 + 50, 1590), radius=55, fill=ROXO)
    d.text((W // 2, 1535), txt, font=pill, fill=(255, 255, 255), anchor="mm")
    d.text((W // 2, 1660), "vídeo completo no perfil", font=ImageFont.truetype(F_TEXTO, 46), fill=(230, 225, 245), anchor="mm")
    fundo.save(saida, quality=90)

def faixa_png(texto, saida):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    f = ImageFont.truetype(F_FAIXA, 78)
    linhas = quebrar(d, texto, f, W - 160)
    # no TOPO, logo abaixo da barra do perfil: embaixo ficam a legenda queimada, o mascote do canto e a
    # caixa de resposta do story — a faixa ali cobre os três (visto no #245, 03/10/2026)
    alt = 92; topo = 290
    d.rounded_rectangle((60, topo - 40, W - 60, topo + len(linhas) * alt + 25), radius=40, fill=ROXO + (235,))
    for k, ln in enumerate(linhas):
        d.text((W // 2, topo + k * alt), ln, font=f, fill=(255, 255, 255), anchor="mt")
    im.save(saida)

def estrela(d, cx, cy, r, cor=(245, 196, 66)):
    import math
    pts = []
    for k in range(10):
        ang = -math.pi / 2 + k * math.pi / 5
        rr = r if k % 2 == 0 else r * 0.42
        pts.append((cx + rr * math.cos(ang), cy + rr * math.sin(ang)))
    d.polygon(pts, fill=cor)

def faixa_estrelas(saida):
    """ESTRELAS DO FACEBOOK (dono, 08/10/2026: prioridade nos stories). Só vai no story do Facebook
    das 19h40 — no Instagram não existe Estrela. Estrela desenhada à mão: o Pillow não pinta emoji."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    topo = 250
    d.rounded_rectangle((60, topo, W - 60, topo + 300), radius=44, fill=ROXO + (240,))
    f1 = ImageFont.truetype(F_FAIXA, 64); f2 = ImageFont.truetype(F_FAIXA, 64)
    d.text((W // 2, topo + 40), "SAIU! VÍDEO COMPLETO NO PERFIL", font=f1, fill=(255, 255, 255), anchor="mt")
    estrela(d, 175, topo + 205, 52); estrela(d, W - 175, topo + 205, 52)
    d.text((W // 2, topo + 170), "APOIE COM ESTRELAS", font=f2, fill=(245, 196, 66), anchor="mt")
    im.save(saida)

def teaser(video, faixa, saida, segundos=9):
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", video, "-i", faixa, "-t", str(segundos),
        "-filter_complex", f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}[v];[v][1:v]overlay=0:0,fade=t=out:st={segundos - 0.6}:d=0.6[o]",
        "-map", "[o]", "-map", "0:a?", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k", "-af", f"afade=t=out:st={segundos - 0.6}:d=0.6", "-movflags", "+faststart", saida],
        check=True, capture_output=True, timeout=300)

def gerar(p, titulo):
    md = p.get("metadata") or {}
    url = md.get("video_url")
    if not url: raise Exception("sem video_url")
    num = md.get("numero") or 0
    slug = re.sub(r"[^a-z0-9]+", "_", url.rsplit("/", 1)[-1].rsplit(".", 1)[0].lower()).strip("_")[:60]
    d = f"{BASE}/{slug}"; os.makedirs(d, exist_ok=True)
    video = baixar(url, f"{d}/video.mp4")
    frame = f"{d}/frame.jpg"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", "1.5", "-i", video, "-frames:v", "1", "-q:v", "2", frame], check=True, capture_output=True)
    arte_pergunta(frame, titulo, f"{d}/pergunta.jpg")
    faixa_png("HOJE ÀS 19H · NO PERFIL", f"{d}/faixa_antes.png")
    faixa_png("SAIU! VÍDEO COMPLETO NO PERFIL", f"{d}/faixa_depois.png")
    teaser(video, f"{d}/faixa_antes.png", f"{d}/teaser_antes.mp4")
    teaser(video, f"{d}/faixa_depois.png", f"{d}/teaser_depois.mp4")
    faixa_estrelas(f"{d}/faixa_estrelas.png")
    teaser(video, f"{d}/faixa_estrelas.png", f"{d}/teaser_depois_estrelas.mp4")
    pasta = "stories/%03d_%s" % (num, slug)
    st = {
        "pergunta": subir(f"{d}/pergunta.jpg", pasta + "/pergunta.jpg", "image/jpeg"),
        "teaser_antes": subir(f"{d}/teaser_antes.mp4", pasta + "/teaser_antes.mp4", "video/mp4"),
        "teaser_depois": subir(f"{d}/teaser_depois.mp4", pasta + "/teaser_depois.mp4", "video/mp4"),
        "teaser_depois_estrelas": subir(f"{d}/teaser_depois_estrelas.mp4", pasta + "/teaser_depois_estrelas.mp4", "video/mp4"),
        "gerado_em": datetime.datetime.now().isoformat(timespec="seconds"),
    }
    atual = g._db("GET", "/rest/v1/pipeline_producao?id=eq.%s&select=metadata" % p["id"], schema="pulso_content")[0]["metadata"] or {}
    atual["stories"] = st
    g._db("PATCH", "/rest/v1/pipeline_producao?id=eq.%s" % p["id"], {"metadata": atual}, schema="pulso_content")
    log("ok #%s %s" % (num, titulo[:50]))
    return st

def titulo_da_ideia(ideia_id):
    r = g._db("GET", "/rest/v1/ideias?id=eq.%s&select=titulo" % ideia_id, schema="pulso_content")
    return (r[0]["titulo"] if r else "") or ""

def main():
    if len(sys.argv) > 1 and sys.argv[1] != "--pendentes":
        p = g._db("GET", "/rest/v1/pipeline_producao?ideia_id=eq.%s&select=id,ideia_id,status,metadata" % sys.argv[1], schema="pulso_content")[0]
        gerar(p, titulo_da_ideia(p["ideia_id"])); return
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    hoje = datetime.date.today().isoformat()
    fila = g._db("GET", "/rest/v1/pipeline_producao?status=eq.PRONTO_PUBLICACAO&data_publicacao_planejada=gte.%s&select=id,ideia_id,status,metadata,data_publicacao_planejada&order=data_publicacao_planejada.asc&limit=40" % hoje, schema="pulso_content") or []
    feitos = 0
    for p in fila:
        if feitos >= n: break
        md = p.get("metadata") or {}
        if (md.get("stories") or {}).get("teaser_depois_estrelas") or not md.get("video_url"): continue
        try:
            gerar(p, titulo_da_ideia(p["ideia_id"])); feitos += 1
        except Exception as e:
            log("falhou %s: %s" % (p["ideia_id"], str(e)[:200]))
    log("stories gerados: %d" % feitos)

if __name__ == "__main__":
    main()
