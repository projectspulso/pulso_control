# -*- coding: utf-8 -*-
"""
CAPA DO EPISÓDIO — miniatura 1280×720 do YouTube (a capa é do agente, dono 05/11/2026).

Desde 05/11 toda capa usa FOTO REAL do dono (variações geradas no GPT a partir de foto dele), recortada
por recortar_fotos.py e descrita em recortes/catalogo.json (pose, emoção, para onde aponta/olha, usos e,
quando houver, a tela do celular ou a folha onde o número entra).

Regras de leitura no celular: 1 número gigante + no máximo 2 linhas curtas; rosto grande; contraste alto.
A pessoa fica do lado de onde ela aponta/olha PARA o texto; foto real nunca é espelhada (muda o rosto).
Cada episódio gera variantes A/B/C para o teste de miniaturas do próprio YouTube.
O rosto do dono fica só no OneDrive (o repositório é público).

Uso: python D:/tmp/capa_longo.py --ep 1 --numero "15.086" --linha "ERROS E NINGUÉM VIU" --foto 4_3 [--variante A]
     python D:/tmp/capa_longo.py --ep 1 --spec   → gera as capas de <pasta do ep>/textos.json["capas"]
"""
import argparse, json, os, sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import embalagem_bastidores as emb  # noqa: E402

CW, CH = 1280, 720
FOTOS = f"{emb.AVATAR}/fotos/fotos_para_thumb/recortes"


def catalogo():
    return json.load(open(f"{FOTOS}/catalogo.json", encoding="utf-8"))


def _fundo(textura):
    g = Image.new("RGB", (CW, CH), emb.BG_BASE)
    d = ImageDraw.Draw(g)
    for y in range(CH):
        t = y / CH
        d.line([(0, y), (CW, y)], fill=tuple(int(a * (1 - t) + b * t) for a, b in zip(emb.BG_TOPO, emb.BG_BASE)))
    img = g.convert("RGBA")
    if textura:
        tex = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
        dt = ImageDraw.Draw(tex)
        mono = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 26)
        for i in range(17):
            dt.text((30, 20 + i * 42), (textura + "   ") * 4, font=mono, fill=(248, 113, 113, 30))
        img = Image.alpha_composite(img, tex)
    return img


def _contorno(pessoa, cor=emb.AMBAR, raio=14):
    """Halo âmbar atrás da pessoa: separa do fundo escuro e é a cor da marca."""
    a = pessoa.getchannel("A").filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(raio))
    halo = Image.new("RGBA", pessoa.size, cor + (0,))
    halo.putalpha(a.point(lambda v: int(v * 0.75)))
    return halo


def capa(ep, numero, linha, foto_id, saida, na_foto=None, textura=None):
    cat = catalogo()
    info = cat.get(foto_id, {})
    pessoa = Image.open(f"{FOTOS}/{foto_id}.png").convert("RGBA")
    img = _fundo(textura)

    # lado: se aponta/olha para a esquerda, a pessoa vai à direita (e vice-versa); de frente, à direita
    direcao = info.get("aponta") or info.get("olha")
    pessoa_na_esquerda = direcao in ("direita", "baixo_direita")
    alvo_h = int(CH * 1.02)
    esc = alvo_h / pessoa.height
    if pessoa.width * esc > CW * 0.62:
        esc = CW * 0.62 / pessoa.width
    p = pessoa.resize((int(pessoa.width * esc), int(pessoa.height * esc)), Image.LANCZOS)
    x = -20 if pessoa_na_esquerda else CW - p.width + 20
    y = CH - p.height + 8
    halo = _contorno(p)
    img.alpha_composite(halo, (x, y))
    img.alpha_composite(p, (x, y))

    # número DENTRO da prova (tela do celular / folha) quando a foto tiver uma
    caixa = info.get("tela") or info.get("folha")
    d = ImageDraw.Draw(img)
    if caixa and na_foto:
        bx0, by0, bx1, by1 = [int(v * esc) for v in caixa]
        bx0, bx1, by0, by1 = bx0 + x, bx1 + x, by0 + y, by1 + y
        tam = 160
        while tam > 20:
            f = emb.fonte(tam, "Bold")
            linhas = na_foto.split("\n")
            larg = max(d.textlength(l, font=f) for l in linhas)
            if larg <= (bx1 - bx0) * 0.86 and len(linhas) * tam * 1.05 <= (by1 - by0) * 0.86:
                break
            tam -= 4
        cor = emb.AMBAR if info.get("tela") else (20, 16, 28)
        ty = (by0 + by1) / 2 - len(linhas) * tam * 1.05 / 2
        for l in linhas:
            d.text(((bx0 + bx1) / 2 - d.textlength(l, font=f) / 2, ty), l, font=f, fill=cor + (255,))
            ty += tam * 1.05

    # texto do lado oposto à pessoa, sem invadir o corpo dela
    if pessoa_na_esquerda:
        area_x0, area_x1 = max(x + p.width - 60, int(CW * 0.42)), CW - 40
    else:
        area_x0, area_x1 = 46, min(x - 16, int(CW * 0.60))
    largura = area_x1 - area_x0
    f_selo = emb.fonte(30, "SemiBold")
    selo = f"BASTIDORES · #{ep:02d}"
    d.rounded_rectangle((area_x0, 44, area_x0 + d.textlength(selo, font=f_selo) + 36, 96), radius=26, fill=emb.AMBAR + (255,))
    d.text((area_x0 + 18, 52), selo, font=f_selo, fill=(26, 18, 6, 255))

    # a frase: o maior tamanho que cabe em até 2 linhas sem deixar palavra sozinha na última
    def arruma(tam_max, tam_min):
        for tam in range(tam_max, tam_min - 1, -4):
            f = emb.fonte(tam, "Bold")
            linhas = emb.quebra(d, linha, f, largura)
            if len(linhas) <= 2 and (len(linhas) == 1 or len(linhas[-1].split()) >= 2):
                return f, tam, linhas
        f = emb.fonte(tam_min, "Bold")
        return f, tam_min, emb.quebra(d, linha, f, largura)[:3]

    f_lin, tam_lin, linhas = arruma(110 if not numero else 84, 46)
    if numero:
        tam = 240
        while tam > 90 and d.textlength(numero, font=emb.fonte(tam, "Bold")) > largura:
            tam -= 8
        f_num = emb.fonte(tam, "Bold")
        bloco_h = int(tam * 1.08) + len(linhas) * int(tam_lin * 1.15)
    else:
        bloco_h = len(linhas) * int(tam_lin * 1.15)
    y_txt = max(130, (CH - bloco_h) // 2 + 20)
    if numero:
        d.text((area_x0, y_txt), numero, font=f_num, fill=emb.AMBAR + (255,), stroke_width=10, stroke_fill=(10, 8, 18, 255))
        y_txt += int(tam * 1.08)
    for parte in linhas:
        d.text((area_x0 + 4, y_txt), parte, font=f_lin, fill=emb.BRANCO + (255,), stroke_width=6, stroke_fill=(10, 8, 18, 255))
        y_txt += int(tam_lin * 1.15)
    img.convert("RGB").save(saida, quality=92)
    return saida


def do_spec(ep):
    pasta = f"{emb.ONEDRIVE}/bastidores_ep{ep:02d}"
    spec = json.load(open(f"{pasta}/textos.json", encoding="utf-8")).get("capas", [])
    feitas = []
    for i, c in enumerate(spec):
        v = c.get("variante") or "ABCDEF"[i]
        out = f"{pasta}/capa_{v}.jpg"
        capa(ep, c.get("numero", ""), c["linha"], c["foto"], out, c.get("na_foto"), c.get("textura"))
        feitas.append(out)
        print(out)
    # a variante A é a capa padrão da ficha
    if feitas:
        Image.open(feitas[0]).save(f"{pasta}/capa.jpg", quality=92)
    return feitas


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--ep", type=int, required=True)
    ap.add_argument("--spec", action="store_true", help="gera as capas descritas em textos.json")
    ap.add_argument("--numero", default="")
    ap.add_argument("--linha", default="")
    ap.add_argument("--foto")
    ap.add_argument("--na-foto")
    ap.add_argument("--textura")
    ap.add_argument("--variante", default="A")
    a = ap.parse_args()
    if a.spec:
        do_spec(a.ep)
    else:
        print(capa(a.ep, a.numero, a.linha, a.foto, f"{emb.ONEDRIVE}/bastidores_ep{a.ep:02d}/capa_{a.variante}.jpg", a.na_foto, a.textura))
