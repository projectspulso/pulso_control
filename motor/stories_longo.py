# -*- coding: utf-8 -*-
"""
STORIES DOS CORTES — 2 por dia de corte, para o Instagram e o Facebook do canal de cortes (desenho v2 do
Geral, 05/11/2026). O digiai_mkt publica; o Pulso só produz.

  antes   arte 1080×1920: "NOVO CORTE HOJE" + título do corte + "link na bio"
  depois  os primeiros 15 s do corte com a faixa "EPISÓDIO COMPLETO NO YOUTUBE · LINK NA BIO"

A Graph API não põe figurinha de link no story: o "link na bio" vai escrito na própria arte.
Uso: python D:/tmp/stories_longo.py T01E01
"""
import json, os, subprocess, sys, tempfile

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import embalagem_bastidores as emb  # noqa: E402
import pulso_guard as g  # noqa: E402

VW, VH = 1080, 1920


def centro(d, y, txt, f, cor, espaco=0):
    """Centraliza na largura do STORY (1080). O texto_centro da embalagem centra em 1920 (vídeo 16:9)."""
    if espaco:
        larg = sum(d.textlength(c, font=f) for c in txt) + espaco * (len(txt) - 1)
        x = (VW - larg) / 2
        for c in txt:
            d.text((x, y), c, font=f, fill=cor + (255,)); x += d.textlength(c, font=f) + espaco
    else:
        d.text(((VW - d.textlength(txt, font=f)) / 2, y), txt, font=f, fill=cor + (255,))


def _cfg():
    return json.loads(g._db("GET", "/rest/v1/configuracoes?chave=eq.cortes_destinos&select=valor", schema="pulso_core")[0]["valor"])


def arte_antes(titulo, tag, arroba, saida):
    img = Image.new("RGB", (VW, VH), emb.BG_BASE).convert("RGBA")
    d = ImageDraw.Draw(img)
    for y in range(VH):
        t = y / VH
        d.line([(0, y), (VW, y)], fill=tuple(int(a * (1 - t) + b * t) for a, b in zip(emb.BG_TOPO, emb.BG_BASE)) + (255,))
    y0 = VH / 2 + 120
    mini = [(0, 0), (0.38, 0), (0.44, -18), (0.48, 0), (0.50, 30), (0.53, -150), (0.56, 60), (0.60, 0), (1.0, 0)]
    d.line([(x * VW, y0 + dy) for x, dy in mini], fill=emb.AMBAR + (255,), width=8, joint="curve")
    f_selo, f_chamada, f_tit, f_rod = emb.fonte(40, "SemiBold"), emb.fonte(64, "Bold"), emb.fonte(104, "Bold"), emb.fonte(44, "SemiBold")
    centro(d, 260, f"BASTIDORES DIGIAI · {tag}", f_selo, emb.AMBAR, espaco=6)
    centro(d, 420, "NOVO CORTE HOJE", f_chamada, emb.BRANCO, espaco=4)
    y = 560
    for linha in emb.quebra(d, titulo.upper(), f_tit, 900)[:4]:
        centro(d, y, linha, f_tit, emb.AMBAR); y += 118
    centro(d, VH - 330, "EPISÓDIO COMPLETO NO YOUTUBE", f_rod, emb.BRANCO)
    centro(d, VH - 260, f"link na bio · {arroba}", f_rod, (163, 160, 176))
    img.convert("RGB").save(saida, quality=92)
    return saida


def clipe_depois(corte_mp4, saida, segundos=15):
    tmp = tempfile.mkdtemp(dir="D:/tmp")
    faixa = os.path.join(tmp, "faixa.png")
    img = Image.new("RGBA", (VW, VH), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # no vão entre o vídeo (termina por volta de y=1250) e a legenda queimada: não cobre o selo do topo
    d.rectangle((0, 1270, VW, 1400), fill=(14, 13, 20, 225))
    f = emb.fonte(46, "Bold")
    centro(d, 1292, "EPISÓDIO COMPLETO NO YOUTUBE", f, emb.AMBAR)
    centro(d, 1346, "LINK NA BIO", emb.fonte(36, "SemiBold"), emb.BRANCO, espaco=6)
    img.save(faixa)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-t", str(segundos), "-i", corte_mp4, "-i", faixa,
                    "-filter_complex", "[0:v][1:v]overlay=0:0[v]", "-map", "[v]", "-map", "0:a",
                    "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", saida], check=True)
    os.remove(faixa); os.rmdir(tmp)
    return saida


def gerar(codigo):
    ep = g._db("GET", f"/rest/v1/episodios?codigo=eq.{codigo}&select=numero", schema="pulso_content")[0]
    nn = int(ep["numero"])
    tag = f"EP. {nn:02d}"
    cfg = _cfg()
    dest = cfg["destinos"][0]
    pasta = f"{emb.ONEDRIVE}/bastidores_ep{nn:02d}"
    sub = f"{pasta}/cortes/{dest['id']}"
    feitos_arq = f"{sub}/cortes.json"
    if not os.path.exists(feitos_arq):
        raise SystemExit(f"faltam as versões do destino {dest['id']}: rode cortes_longo --destino {dest['id']}")
    feitos = json.load(open(feitos_arq, encoding="utf-8"))
    td = f"{pasta}/cortes/textos_destinos.json"
    textos = (json.load(open(td, encoding="utf-8")) if os.path.exists(td) else {}).get(dest["id"], {})
    out = f"{pasta}/stories"
    os.makedirs(out, exist_ok=True)
    gerados = {}
    for c in feitos:
        n = c["numero"]
        titulo = (textos.get(str(n)) or {}).get("titulo") or c["titulo"]
        antes = arte_antes(titulo, tag, dest["arroba"], f"{out}/story_{n}_antes.jpg")
        depois = clipe_depois(f"{sub}/{c['arquivo']}", f"{out}/story_{n}_depois.mp4")
        gerados[n] = {"antes": antes, "depois": depois}
        print(f"stories do corte {n}: {titulo}")
    return gerados


if __name__ == "__main__":
    gerar(sys.argv[1])
