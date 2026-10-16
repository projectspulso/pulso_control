# -*- coding: utf-8 -*-
"""Mascote temático: chapéu por cima do boné + casaco recolorido, nas 12 poses da bolha e nos 8 quadros do CTA."""
import os, sys, colorsys, numpy as np
from PIL import Image

RAIZ = "D:/projetos/pulso_control/public/pulso"
SAIDA = f"{RAIZ}/temas/halloween"
HUE_CASACO = 25 / 360  # laranja

def chapeu_recortado(path):
    im = np.array(Image.open(path).convert("RGB")).astype(int)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    verde = (g - np.maximum(r, b))
    alpha = np.clip(255 - (verde - 25) * 6, 0, 255).astype(np.uint8)  # borda suave
    rgba = np.dstack([im.astype(np.uint8), alpha])
    out = Image.fromarray(rgba, "RGBA")
    return out.crop(out.getbbox())

def recolorir_casaco(img):
    a = np.array(img).astype(float) / 255
    rgb = a[..., :3]; alpha = a[..., 3]
    mx, mn = rgb.max(-1), rgb.min(-1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    hsv = np.vectorize(colorsys.rgb_to_hsv, otypes=[float, float, float])
    h, s, v = hsv(rgb[..., 0], rgb[..., 1], rgb[..., 2])
    azul = (h > 190 / 360) & (h < 228 / 360) & (s > 0.45) & (v > 0.35) & (alpha > 0.1)
    h2 = np.where(azul, HUE_CASACO, h)
    v2 = np.where(azul, np.minimum(v * 1.05, 1), v)
    to_rgb = np.vectorize(colorsys.hsv_to_rgb, otypes=[float, float, float])
    r, g, b = to_rgb(h2, s, v2)
    novo = np.dstack([r, g, b, alpha]) * 255
    return Image.fromarray(novo.astype(np.uint8), "RGBA")

def caixa_bone(img, faixa_topo=0.30, faixa_cabeca=0.20):
    """bbox do boné amarelo na parte de cima da figura (o selo da camisa fica abaixo da faixa)."""
    a = np.array(img.convert("RGBA")).astype(int)
    alpha = a[..., 3]
    ys = np.where(alpha.max(1) > 40)[0]; topo, base = ys.min(), ys.max()
    lim = int(topo + (base - topo) * faixa_topo)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    amarelo = (r > 200) & (g > 160) & (b < 90) & (alpha > 40)
    amarelo[lim:] = False
    yy, xx = np.where(amarelo)
    # largura medida só no alto da cabeça: mais abaixo entram braço e mão estendidos
    cabeca = alpha[topo:int(topo + (base - topo) * faixa_cabeca)] > 40
    hx = np.where(cabeca.any(0))[0]
    return dict(topo=topo, x0=hx.min(), x1=hx.max(), by0=yy.min(), by1=yy.max(), bx0=xx.min(), bx1=xx.max())

def por_chapeu(img, chapeu, largura_rel=1.05, pad_topo=0, k_bone=None):
    img = img.convert("RGBA")
    c = caixa_bone(img)
    larg_cab = c["x1"] - c["x0"]
    # braço erguido (2_pop_up) entra na largura da cabeça: aí vale a do boné × a proporção dos outros quadros
    if k_bone and larg_cab > (c["bx1"] - c["bx0"]) * k_bone * 1.25:
        larg_cab = int((c["bx1"] - c["bx0"]) * k_bone)
    w = int(larg_cab * largura_rel); h = int(chapeu.height * w / chapeu.width)
    ch = chapeu.resize((w, h), Image.LANCZOS)
    cx = (c["x0"] + c["x1"]) // 2
    # a aba assenta na base do boné amarelo: cobre o boné e para acima dos olhos
    y_aba = c["by1"] + int(h * 0.04)
    y = y_aba - h
    pad = max(pad_topo, -y if y < 0 else 0)
    tela = Image.new("RGBA", (img.width, img.height + pad), (0, 0, 0, 0))
    tela.alpha_composite(img, (0, pad))
    tela.alpha_composite(ch, (cx - w // 2, y + pad))
    return tela, pad

if __name__ == "__main__":
    chapeu = chapeu_recortado("D:/tmp/mascote_halloween/chapeu_raw.png")
    chapeu.save("D:/tmp/mascote_halloween/chapeu.png")
    os.makedirs(f"{SAIDA}/expression", exist_ok=True); os.makedirs(f"{SAIDA}/cta", exist_ok=True)
    # bolha: 12 visemas (com e sem piscar) — mesma moldura, sem precisar de margem
    for v in ["AEI", "O", "U", "L", "MBP", "FV"]:
        for suf in ["", "_blink"]:
            im = recolorir_casaco(Image.open(f"{RAIZ}/expression/viseme_{v}{suf}.png").convert("RGBA"))
            out, pad = por_chapeu(im, chapeu)
            if pad: out = out.crop((0, pad, out.width, out.height))  # mantém 1024x1536
            out.save(f"{SAIDA}/expression/viseme_{v}{suf}.png")
    # CTA: 8 quadros recortados justos — mesma margem de topo em todos para a escala não mudar
    nomes = ["1_enter_squash","2_pop_up","3_present_open","4_present_closed","5_point_open","6_point_closed","7_thumbs_up","8_thumbs_wink"]
    razoes = []
    for n in nomes:
        c = caixa_bone(Image.open(f"D:/tmp/cta_frames/{n}.png").convert("RGBA"))
        razoes.append((c["x1"] - c["x0"]) / max(1, c["bx1"] - c["bx0"]))
    K = float(np.median(razoes))
    pads = []
    tmp = {}
    for n in nomes:
        im = recolorir_casaco(Image.open(f"D:/tmp/cta_frames/{n}.png").convert("RGBA"))
        tmp[n] = por_chapeu(im, chapeu, k_bone=K)
        pads.append(tmp[n][1])
    P = max(pads)
    for n in nomes:
        im = recolorir_casaco(Image.open(f"D:/tmp/cta_frames/{n}.png").convert("RGBA"))
        out, _ = por_chapeu(im, chapeu, pad_topo=P, k_bone=K)
        out.save(f"{SAIDA}/cta/{n}.png")
    open(f"{SAIDA}/cta/pad_topo.txt", "w").write(str(P))
    print("ok, pad_topo CTA =", P)
