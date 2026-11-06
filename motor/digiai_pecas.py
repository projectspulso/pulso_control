# -*- coding: utf-8 -*-
"""
PEÇAS DA DIGIAI A PARTIR DE UM EPISÓDIO DOS BASTIDORES (dono, 05/11/2026: "pode seguir com os cortes na DIGIAI").

Nunca o mesmo arquivo do canal de cortes. Identidade DIGIAI House (T-4: Swiss/editorial, Deep Forest #2D4B3E,
navy, serifa nos títulos, cantos retos) e SEM rosto de IA: nem o avatar ink nem as fotos geradas no GPT.

  carrossel  Instagram, 1080×1350: capa + 1 slide por lição (as cartelas do corte de lição) + fechamento
             apontando para o episódio no canal principal
  video      LinkedIn, 16:9: o corte técnico renderizado de novo SEM o avatar (a fala em destaque na tela
             toda), selo BASTIDORES DIGIAI e encerramento DIGIAI House de 3 s

Fonte: a marca usa Source Serif 4 + Inter, que não estão instaladas aqui; usa Georgia + Segoe UI (a troca é
só nos caminhos de FONTE_*). Uso: python D:/tmp/digiai_pecas.py T01E01 [--so carrossel|video]
"""
import argparse, json, os, re, subprocess, sys, tempfile, wave

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pulso_guard as g  # noqa: E402
import embalagem_bastidores as emb  # noqa: E402
import montar_longo as ml  # noqa: E402

FOREST, FOREST_CLARO, NAVY, NAVY_TEXTO, CINZA, CLARO = (45, 75, 62), (173, 206, 189), (10, 15, 30), (13, 19, 31), (90, 95, 107), (248, 249, 250)
FONTE_SERIF, FONTE_SERIF_B = "C:/Windows/Fonts/georgia.ttf", "C:/Windows/Fonts/georgiab.ttf"
FONTE_SANS, FONTE_SANS_B = "C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/segoeuib.ttf"
SIMBOLO = "D:/projetos/Cockpit/design_system/brands/digiai/marca/digiai-simbolo-1024.png"
CW, CH = 1080, 1350


def f(caminho, tam):
    return ImageFont.truetype(caminho, tam)


def _quebra(d, txt, fonte, larg):
    linhas, atual = [], ""
    for p in txt.split():
        t = f"{atual} {p}".strip()
        if d.textlength(t, font=fonte) <= larg:
            atual = t
        else:
            linhas.append(atual); atual = p
    return linhas + ([atual] if atual else [])


def _simbolo(img, x, y, tam):
    if os.path.exists(SIMBOLO):
        s = Image.open(SIMBOLO).convert("RGBA")
        s.thumbnail((tam, tam))
        img.alpha_composite(s, (x, y))


def licoes_do_roteiro(md, numero_corte):
    """As cartelas do corte de lição e a frase narrada logo depois de cada uma."""
    corpo = md.split("## Para o dono")[0]
    m = re.search(rf"✂ \*\*CORTE {numero_corte} — \"([^\"]+)\"\*\*(?:\s*·\s*gancho:\s*\*\"([^\"]+)\"\*)?(.*?)✂ fim", corpo, re.S)
    if not m:
        return None, []
    titulo, gancho, trecho = m.group(1), m.group(2) or m.group(1), m.group(3)
    licoes, atual = [], None
    for l in trecho.splitlines():
        c = re.match(r"\*\*\[CARTELA\]\*\*\s*(.*)", l)
        if c:
            atual = {"titulo": re.sub(r"^\d+\.\s*", "", c.group(1)).strip(), "texto": ""}
            licoes.append(atual)
        elif atual is not None and l.startswith("> "):
            frase = re.sub(r"\*\*", "", l[2:].strip())
            frase = re.sub(r"^(Um|Dois|Três|Quatro|Cinco):\s*", "", frase)
            atual["texto"] = (atual["texto"] + " " + frase).strip()
    for li in licoes:  # a frase vem cortada da narração ("Um: falha..."): começa em maiúscula no slide
        li["texto"] = li["texto"][:1].upper() + li["texto"][1:]
    return gancho.rstrip("."), licoes


def carrossel(codigo, ep, pasta, principal):
    corte = next((c for c in g._db("GET", f"/rest/v1/episodio_cortes?episodio_id=eq.{ep['id']}&select=numero,tipo&order=numero", schema="pulso_content") if c["tipo"] == "licao"), None)
    if not corte:
        raise SystemExit("o episódio não tem corte de lição")
    capa_txt, licoes = licoes_do_roteiro(ep["roteiro_md"], corte["numero"])
    if not licoes:
        raise SystemExit("o corte de lição não tem cartelas")
    out = f"{pasta}/digiai/carrossel"
    os.makedirs(out, exist_ok=True)
    tag = f"BASTIDORES DIGIAI · EP. {int(ep['numero']):02d}"
    total = len(licoes) + 2
    arquivos = []

    def slide(n):
        img = Image.new("RGBA", (CW, CH), CLARO + (255,))
        d = ImageDraw.Draw(img)
        d.rectangle((0, 0, CW, 14), fill=FOREST + (255,))
        d.text((80, 80), tag, font=f(FONTE_SANS_B, 28), fill=FOREST + (255,))
        d.text((CW - 80 - d.textlength(f"{n}/{total}", font=f(FONTE_SANS, 28)), 80), f"{n}/{total}", font=f(FONTE_SANS, 28), fill=CINZA + (255,))
        d.line((80, CH - 150, CW - 80, CH - 150), fill=(199, 198, 205, 255), width=2)
        _simbolo(img, 80, CH - 120, 60)
        d.text((160, CH - 108), "DIGIAI", font=f(FONTE_SANS_B, 30), fill=NAVY_TEXTO + (255,))
        return img, d

    # capa
    img, d = slide(1)
    y = 300
    for l in _quebra(d, capa_txt, f(FONTE_SERIF_B, 92), CW - 160):
        d.text((80, y), l, font=f(FONTE_SERIF_B, 92), fill=NAVY_TEXTO + (255,)); y += 108
    d.rectangle((80, y + 30, 200, y + 38), fill=FOREST + (255,))
    for l in _quebra(d, f"O que um erro real ensinou ao construir uma empresa com IA. Episódio: {ep['titulo']}.", f(FONTE_SANS, 38), CW - 160):
        y += 60; d.text((80, y + 40), l, font=f(FONTE_SANS, 38), fill=CINZA + (255,))
    d.text((80, CH - 230), "Deslize →", font=f(FONTE_SANS_B, 34), fill=FOREST + (255,))
    arquivos.append(img)

    # uma lição por slide
    for i, li in enumerate(licoes, start=1):
        img, d = slide(i + 1)
        d.text((80, 230), f"{i:02d}", font=f(FONTE_SERIF_B, 200), fill=FOREST_CLARO + (255,))
        y = 500
        for l in _quebra(d, li["titulo"], f(FONTE_SERIF_B, 72), CW - 160):
            d.text((80, y), l, font=f(FONTE_SERIF_B, 72), fill=NAVY_TEXTO + (255,)); y += 86
        y += 40
        for l in _quebra(d, li["texto"], f(FONTE_SANS, 40), CW - 160):
            d.text((80, y), l, font=f(FONTE_SANS, 40), fill=CINZA + (255,)); y += 56
        arquivos.append(img)

    # fechamento
    img, d = slide(total)
    d.text((80, 360), "Episódio completo", font=f(FONTE_SERIF_B, 88), fill=NAVY_TEXTO + (255,))
    d.text((80, 470), "no YouTube", font=f(FONTE_SERIF_B, 88), fill=NAVY_TEXTO + (255,))
    d.rectangle((80, 620, 200, 628), fill=FOREST + (255,))
    d.text((80, 680), principal["arroba"], font=f(FONTE_SANS_B, 50), fill=FOREST + (255,))
    for j, l in enumerate(_quebra(d, "Bastidores DIGIAI: os erros reais e os números de verdade de quem constrói com IA.", f(FONTE_SANS, 38), CW - 160)):
        d.text((80, 780 + j * 56), l, font=f(FONTE_SANS, 38), fill=CINZA + (255,))
    arquivos.append(img)

    caminhos = []
    for i, im in enumerate(arquivos, start=1):
        c = f"{out}/slide_{i:02d}.jpg"
        im.convert("RGB").save(c, quality=93)
        caminhos.append(c)
    print(f"carrossel: {len(caminhos)} slides (lições do corte {corte['numero']})")
    return corte["numero"], caminhos


def _fim_digiai(saida, principal, seg=3.0):
    """Encerramento 16:9 DIGIAI House: fundo claro, filete Forest, símbolo e o ponteiro para o principal."""
    tmp = tempfile.mkdtemp(dir="D:/tmp")
    img = Image.new("RGBA", (1920, 1080), CLARO + (255,))
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 1920, 16), fill=FOREST + (255,))
    _simbolo(img, 160, 430, 220)
    d.text((440, 400), "Episódio completo no YouTube", font=f(FONTE_SERIF_B, 84), fill=NAVY_TEXTO + (255,))
    d.text((440, 520), principal["arroba"], font=f(FONTE_SANS_B, 60), fill=FOREST + (255,))
    d.text((440, 620), "Bastidores DIGIAI", font=f(FONTE_SANS, 40), fill=CINZA + (255,))
    png = os.path.join(tmp, "fim.png"); img.convert("RGB").save(png)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-t", str(seg), "-i", png,
                    "-f", "lavfi", "-t", str(seg), "-i", "anullsrc=r=44100:cl=stereo",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", str(emb.FPS), "-c:a", "aac", "-shortest", saida], check=True)
    os.remove(png); os.rmdir(tmp)
    return saida


def video_tecnico(codigo, ep, pasta, principal):
    """O corte técnico em 16:9, renderizado de novo SEM o avatar, com selo e fim DIGIAI."""
    corte = next((c for c in g._db("GET", f"/rest/v1/episodio_cortes?episodio_id=eq.{ep['id']}&select=numero,tipo&order=numero", schema="pulso_content") if c["tipo"] == "tecnico"), None)
    if not corte:
        raise SystemExit("o episódio não tem corte técnico")
    lt = json.load(open(f"{pasta}/linha_do_tempo.json", encoding="utf-8"))
    c = next(x for x in lt["cortes"] if x["numero"] == corte["numero"])
    bloco = max((b for b in lt["blocos"] if b["inicio"] <= c["ini"] + 0.01), key=lambda b: b["inicio"])
    visuais = json.load(open(f"{pasta}/visuais.json", encoding="utf-8"))
    blocos = dict(ml.blocos_do_roteiro(ep["roteiro_md"]))
    itens = blocos[bloco["bloco"]]
    base_n = f"{pasta}/narracao/bloco_{bloco['bloco']}"
    al = json.load(open(base_n + ".json", encoding="utf-8"))["alinhamento"]
    voz = ml.le_wav(base_n + ".mp3")
    dur = len(voz) / emb.SR + ml.PAUSA
    tmp = tempfile.mkdtemp(dir="D:/tmp")
    wav = os.path.join(tmp, "b.wav")
    sinal = np.zeros(int(dur * emb.SR)); sinal[: len(voz)] = voz
    emb.grava_wav(sinal, wav)
    bruto = os.path.join(tmp, "bloco.mp4")
    tag = f"EP. {int(ep['numero']):02d}"
    emb.codifica(ml.quadros_bloco(bloco["bloco"], itens, al, dur, visuais.get(bloco["bloco"], []), ml.Avatar(), tag, False,
                                  sem_avatar=True, selo_txt=f"BASTIDORES DIGIAI · {tag}"), int(dur * emb.FPS), wav, bruto)
    ini, fim = max(0.0, c["ini"] - bloco["inicio"] - 0.1), c["fim"] - bloco["inicio"]
    corpo = os.path.join(tmp, "corpo.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{ini:.3f}", "-t", f"{fim - ini:.3f}", "-i", bruto,
                    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-r", str(emb.FPS),
                    "-c:a", "aac", "-ar", "44100", "-ac", "2", corpo], check=True)
    fim_mp4 = _fim_digiai(os.path.join(tmp, "fim.mp4"), principal)
    lista = os.path.join(tmp, "l.txt")
    open(lista, "w").write(f"file '{corpo}'\nfile '{fim_mp4}'\n")
    os.makedirs(f"{pasta}/digiai", exist_ok=True)
    saida = f"{pasta}/digiai/linkedin_corte_{corte['numero']}.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lista, "-c:v", "libx264", "-preset", "medium",
                    "-crf", "21", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-af", "loudnorm=I=-16", "-movflags", "+faststart", saida], check=True)
    for x in os.listdir(tmp):
        os.remove(os.path.join(tmp, x))
    os.rmdir(tmp)
    print(f"LinkedIn: corte {corte['numero']} sem avatar · {fim - ini + 3:.1f}s")
    return corte["numero"], saida


def gerar(codigo, so=None):
    ep = g._db("GET", f"/rest/v1/episodios?codigo=eq.{codigo}&select=id,numero,titulo,roteiro_md", schema="pulso_content")[0]
    cfg = json.loads(g._db("GET", "/rest/v1/configuracoes?chave=eq.cortes_destinos&select=valor", schema="pulso_core")[0]["valor"])
    pasta = f"{emb.ONEDRIVE}/bastidores_ep{int(ep['numero']):02d}"
    out = {}
    if so in (None, "carrossel"):
        out["carrossel"] = carrossel(codigo, ep, pasta, cfg["principal"])
    if so in (None, "video"):
        out["video"] = video_tecnico(codigo, ep, pasta, cfg["principal"])
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("codigo")
    ap.add_argument("--so", choices=["carrossel", "video"])
    a = ap.parse_args()
    gerar(a.codigo, a.so)
