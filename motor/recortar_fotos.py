# -*- coding: utf-8 -*-
"""
RECORTE DAS FOTOS DO DONO PARA AS CAPAS — separa cada pose de uma prancha e tira o fundo (05/11/2026).

O GPT entrega pranchas e, às vezes, "transparência" falsa: o xadrez cinza e branco DESENHADO na imagem.
Aqui o fundo sai por preenchimento a partir das bordas, só sobre pixel claro e sem cor (o xadrez); pele,
camiseta preta e óculos não são tocados. Prancha com alfa de verdade usa o alfa. Depois, cada pessoa
(componente grande) vira um PNG próprio, recortado e com borda suave.

As fotos têm o rosto do dono: entrada e saída ficam só no OneDrive (o repositório é público).
Uso: python D:/tmp/recortar_fotos.py <pasta>   → <pasta>/recortes/<origem>_<n>.png
"""
import os, sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage


def mascara_frente(im):
    a = np.asarray(im.convert("RGBA")).astype(int)
    if a[..., 3].min() < 250:  # alfa de verdade
        return a[..., 3] > 40
    rgb = a[..., :3]
    claro = rgb.min(axis=2) > 178
    sem_cor = (rgb.max(axis=2) - rgb.min(axis=2)) < 24
    candidato = claro & sem_cor
    # fundo = o candidato ligado à borda (o xadrez); claro DENTRO da pessoa fica
    rot, _ = ndimage.label(candidato)
    borda = set(np.unique(np.concatenate([rot[0], rot[-1], rot[:, 0], rot[:, -1]]))) - {0}
    fundo = np.isin(rot, list(borda))
    frente = ~fundo
    frente = ndimage.binary_opening(frente, iterations=2)
    return ndimage.binary_fill_holes(frente)


# Pranchas em que as pessoas se encostam: a separação automática pelo vão cortava rosto de corpo
# (05/11). A área de cada pessoa é marcada à mão, em pixels da imagem original (x0, y0, x1, y1).
# Cada pessoa é uma lista de retângulos somados: onde duas pessoas se cruzam, só a cabeça passa.
AREAS_MANUAIS = {
    "5": [[(80, 0, 783, 560)], [(806, 0, 1508, 560)], [(720, 495, 1000, 575), (265, 575, 1163, 1024)]],
    "6": [[(870, 0, 1536, 520)], [(0, 0, 930, 1024)], [(1005, 540, 1536, 1024)]],
    "9": [[(0, 0, 615, 1024)], [(800, 0, 1536, 1024)]],
}


def _maior_pedaco(bloco, ponte=7):
    """Fica a pessoa principal. Restos do vizinho às vezes ficam presos por uma ponte de poucos pixels:
    a abertura corta a ponte, escolhe o maior pedaço e depois devolve a borda original dele."""
    aberto = ndimage.binary_opening(bloco, iterations=ponte)
    r, n = ndimage.label(aberto)
    if n == 0:
        return bloco
    maior = r == (1 + int(np.argmax(ndimage.sum(aberto, r, range(1, n + 1)))))
    return ndimage.binary_dilation(maior, iterations=ponte + 2) & bloco


def recortar(caminho, destino, min_area=0.03):
    im = Image.open(caminho).convert("RGBA")
    m = mascara_frente(im)
    total = m.size
    base = os.path.splitext(os.path.basename(caminho))[0]
    blocos = []
    if base in AREAS_MANUAIS:
        for retangulos in AREAS_MANUAIS[base]:
            b = np.zeros_like(m)
            for x0, y0, x1, y1 in retangulos:
                b[y0:y1, x0:x1] = m[y0:y1, x0:x1]
            blocos.append(_maior_pedaco(b))
    else:
        rot, _ = ndimage.label(m)
        for k, sl in enumerate(ndimage.find_objects(rot), start=1):
            b = rot == k
            if b.sum() >= total * min_area:
                blocos.append(b)
    saidas = []
    for bloco in blocos:
        ys, xs = np.nonzero(bloco)
        alfa = Image.fromarray((bloco * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
        pessoa = im.copy()
        pessoa.putalpha(alfa)
        saidas.append((xs.min(), ys.min(), pessoa.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))))
    saidas.sort(key=lambda s: (round(s[1] / 200), s[0]))  # ordem de leitura: linha, depois coluna
    arquivos = []
    for i, (_, _, p) in enumerate(saidas, start=1):
        f = os.path.join(destino, f"{base}_{i}.png")
        p.save(f); arquivos.append(f)
    return arquivos


if __name__ == "__main__":
    pasta = sys.argv[1]
    out = os.path.join(pasta, "recortes")
    os.makedirs(out, exist_ok=True)
    for f in sorted(os.listdir(pasta)):
        if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")) and os.path.splitext(f)[0] not in ("1", "2", "3"):
            r = recortar(os.path.join(pasta, f), out)
            print(f, "→", len(r), "poses")
