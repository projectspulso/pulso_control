# -*- coding: utf-8 -*-
"""
CAPA DO EPISÓDIO — miniatura 1280×720 do YouTube (a capa é do agente, dono 05/11/2026).

Regra de leitura no celular: no máximo 2 linhas de texto, um número gigante, rosto grande olhando
ou apontando para o texto, contraste alto. Até o E02 o rosto é o avatar ink; do E03 em diante pode
ser foto real do dono (--foto), que fica só no OneDrive (o repositório é público).

Uso: python D:/tmp/capa_longo.py --ep 1 --numero "15.086" --linha "ERROS E NINGUÉM VIU" [--pose pose_apontando] [--foto arquivo.png]
"""
import argparse, os, sys

from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import embalagem_bastidores as emb  # noqa: E402

CW, CH = 1280, 720


def capa(ep, numero, linha, pose, foto, saida):
    g = Image.new("RGB", (CW, CH), emb.BG_BASE)
    d = ImageDraw.Draw(g)
    for y in range(CH):  # degradê da marca
        t = y / CH
        d.line([(0, y), (CW, y)], fill=tuple(int(a * (1 - t) + b * t) for a, b in zip(emb.BG_TOPO, emb.BG_BASE)))
    img = g.convert("RGBA")

    # textura: o "failed" que rola no episódio, bem apagado, atrás do texto
    tex = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    dt = ImageDraw.Draw(tex)
    from PIL import ImageFont
    mono = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 26)
    for i in range(16):
        dt.text((40, 30 + i * 44), "failed   ERROR: invalid input syntax   " * 2, font=mono, fill=(248, 113, 113, 34))
    img = Image.alpha_composite(img, tex)

    # rosto à direita, olhando/apontando para o texto
    rosto = Image.open(foto).convert("RGBA") if foto else Image.open(f"{emb.AVATAR}/{pose}.png").convert("RGBA")
    alt = 760
    rosto = rosto.resize((int(rosto.width * alt / rosto.height), alt), Image.LANCZOS)
    if not foto:  # o avatar aponta para a direita no quadro original; na capa ele aponta para o texto
        rosto = rosto.transpose(Image.FLIP_LEFT_RIGHT)
    sombra = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
    sombra.alpha_composite(rosto, (CW - rosto.width + 70, CH - rosto.height + 60))
    img = Image.alpha_composite(img, sombra)

    d = ImageDraw.Draw(img)
    f_num, f_lin, f_selo = emb.fonte(250, "Bold"), emb.fonte(66, "Bold"), emb.fonte(30, "SemiBold")
    # contorno escuro grosso: lê em miniatura pequena sobre qualquer fundo
    for txt, f, xy, cor in ((numero, f_num, (48, 150), emb.AMBAR),):
        d.text(xy, txt, font=f, fill=cor + (255,), stroke_width=10, stroke_fill=(10, 8, 18, 255))
    y = 430
    for parte in emb.quebra(d, linha, f_lin, 700):
        d.text((56, y), parte, font=f_lin, fill=emb.BRANCO + (255,), stroke_width=6, stroke_fill=(10, 8, 18, 255))
        y += 78
    d.rounded_rectangle((52, 52, 52 + d.textlength(f"BASTIDORES DO PULSO · #{ep:02d}", font=f_selo) + 36, 104), radius=26, fill=emb.AMBAR + (255,))
    d.text((70, 60), f"BASTIDORES DO PULSO · #{ep:02d}", font=f_selo, fill=(26, 18, 6, 255))
    img.convert("RGB").save(saida, quality=92)
    return saida


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--ep", type=int, required=True)
    ap.add_argument("--numero", required=True)
    ap.add_argument("--linha", required=True)
    ap.add_argument("--pose", default="pose_apontando")
    ap.add_argument("--foto")
    a = ap.parse_args()
    out = f"{emb.ONEDRIVE}/bastidores_ep{a.ep:02d}/capa.jpg"
    print(capa(a.ep, a.numero, a.linha, a.pose, a.foto, out))
