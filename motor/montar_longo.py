# -*- coding: utf-8 -*-
"""
MONTADOR DOS LONGOS — vídeo 16:9 dos Bastidores a partir do roteiro aprovado (05/11/2026).

Os dois montadores da casa são 1080×1920 (Shorts), e o Geral confirmou que não há montador 16:9;
este copia peças (lip-sync, fundo, fontes), não chama esteira nenhuma.

Entrada:
  · roteiro_md do episódio (pulso_content.episodios), já aprovado (status roteiro_ok em diante)
  · narração por bloco em <pasta>/narracao/bloco_N.mp3 + .json (texto + alinhamento), da voz travada
  · <pasta>/visuais.json — o que cada marcação [TELA]/[AVATAR]/[CARTELA] do roteiro mostra, na ordem.
    No E01 é escrito à mão (fase de aprender); depois o app gera.
Saída: <pasta>/EP_<codigo>_montagem.mp4 + .srt (legenda para subir no YouTube)

Regra de segredo: nenhum print cru do app entra (a tela da esteira de 05/11 explicava a receita do
sorteio de canal); as telas são cartões desenhados com dado real do banco.
O rosto do dono fica no OneDrive; nada disto escreve no repositório.

Uso: python D:/tmp/montar_longo.py T01E01 [--rascunho] [--so-bloco N]
"""
import argparse, json, math, os, re, subprocess, sys, tempfile, wave

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pulso_guard as g  # noqa: E402
import embalagem_bastidores as emb  # noqa: E402

W, H, FPS, SR = emb.W, emb.H, emb.FPS, emb.SR
AMBAR, BRANCO, LILAS = emb.AMBAR, emb.BRANCO, emb.LILAS
CINZA, VERMELHO, VERDE = (163, 160, 176), (248, 113, 113), (52, 211, 153)
CARTAO = (26, 25, 34)
ONEDRIVE = emb.ONEDRIVE
VIDEOS = f"{ONEDRIVE}/videos"
PAUSA = 0.45  # respiro entre blocos


# ── roteiro → linha do tempo ───────────────────────────────────────────────────────────────────

MARCA = re.compile(r"\*\*\[(TELA|AVATAR|CARTELA|VINHETA|ENCERRAMENTO)\]\*\*\s*(.*)")
CORTE = re.compile(r'✂ \*\*CORTE (\d+) — "([^"]+)"\*\*(?:\s*·\s*gancho:\s*\*"([^"]+)"\*)?')


def blocos_do_roteiro(md):
    corpo = md.split("## Para o dono")[0]
    saida = []
    for b in re.split(r"\n## ", corpo)[1:]:
        num = b.split(".")[0].strip()
        itens = []  # ("marca", tipo, texto) | ("fala", texto)
        for l in b.splitlines():
            c = CORTE.match(l)
            if c:
                itens.append(("corte", int(c.group(1)), c.group(2), c.group(3) or ""))
                continue
            if l.strip() == "✂ fim":
                itens.append(("corte_fim",))
                continue
            m = MARCA.match(l)
            if m:
                itens.append(("marca", m.group(1), m.group(2)))
            elif l.startswith("> "):
                itens.append(("fala", re.sub(r"\*\*", "", l[2:].strip())))
        saida.append((num, itens))
    return saida


def fins_das_falas(itens, alinhamento):
    falas = [x[1] for x in itens if x[0] == "fala"]
    texto = " ".join(falas)
    fim = alinhamento["character_end_times_seconds"]
    pos, res = 0, []
    for f in falas:
        i = texto.find(f, pos)
        res.append(fim[min(i + len(f) - 1, len(fim) - 1)]); pos = i + len(f)
    return res


def cortes_do_bloco(itens, al, t_bloco):
    """Faixas [início, fim] (tempo global) de cada ✂ CORTE do bloco: da 1ª fala depois da marca ao fim
    da última fala antes do "✂ fim"."""
    ini, fim = tempos_das_falas(itens, al), fins_das_falas(itens, al)
    res, aberto, k = [], None, 0
    for it in itens:
        if it[0] == "fala":
            if aberto is not None and aberto.get("ini") is None:
                aberto["ini"] = t_bloco + ini[k]
            if aberto is not None:
                aberto["fim"] = t_bloco + fim[k] + 0.35
            k += 1
        elif it[0] == "corte":
            aberto = {"numero": it[1], "titulo": it[2], "gancho": it[3], "ini": None, "fim": None}
        elif it[0] == "corte_fim" and aberto is not None:
            res.append(aberto); aberto = None
    return res


def tempos_das_falas(itens, alinhamento):
    """Onde cada linha de fala começa no áudio: acha o início da linha no texto narrado (o narrador
    juntou as linhas com espaço) e lê o tempo daquele caractere no alinhamento."""
    falas = [x[1] for x in itens if x[0] == "fala"]
    texto = " ".join(falas)
    ini = alinhamento["character_start_times_seconds"]
    pos, res = 0, []
    for f in falas:
        i = texto.find(f, pos)
        res.append(ini[min(i, len(ini) - 1)] if i >= 0 else (res[-1] if res else 0.0))
        pos = i + len(f) if i >= 0 else pos
    return res


# ── visemas do avatar ──────────────────────────────────────────────────────────────────────────

class Avatar:
    """A POSE FICA, SÓ A BOCA MEXE (dono, 05/11/2026: "se apontar, tem que manter apontado").
    Antes o montador trocava o quadro inteiro entre boca (sem mão) e pose (com mão, boca parada) a cada
    vírgula, e a mão piscava. Agora a pose da marcação é a base do trecho todo; a boca e a piscada são
    recortadas dos quadros de fala e coladas por cima com borda suave, no deslocamento medido de cada pose
    (o rosto das poses está 0 a 4 px abaixo do rosto dos quadros de fala). As poses de cabeça virada não
    falam (a boca de frente não encaixa): viram pose_neutro."""
    FALAM = {"pose_neutro": 0, "pose_apontando": 4, "pose_apresentando": 2, "pose_joinha": 4}
    BOCA = (470, 520, 770, 760)    # caixa da boca+queixo nos quadros 1254×1254 (medida pela variação das bocas)
    OLHOS = (420, 370, 830, 530)

    def __init__(self):
        from PIL import ImageFilter
        self.cache, self.bruto = {}, {}
        self.mascaras = {}
        for nome, (x0, y0, x1, y1), raio in (("boca", self.BOCA, 22), ("olhos", self.OLHOS, 16)):
            m = Image.new("L", (x1 - x0, y1 - y0), 0)
            ImageDraw.Draw(m).ellipse((raio, raio, x1 - x0 - raio, y1 - y0 - raio), fill=255)
            self.mascaras[nome] = m.filter(ImageFilter.GaussianBlur(raio))

    def _img(self, nome):
        if nome not in self.bruto:
            self.bruto[nome] = Image.open(f"{emb.AVATAR}/{nome}.png").convert("RGBA")
        return self.bruto[nome]

    def _cola(self, base, fonte, caixa, mascara, dy):
        x0, y0, x1, y1 = caixa
        pedaco = self._img(fonte).crop(caixa)
        base.paste(pedaco, (x0, y0 + dy), self.mascaras[mascara])

    def quadro(self, pose, boca, piscando, altura):
        k = (pose, boca, piscando, altura)
        if k not in self.cache:
            dy = self.FALAM[pose]
            im = self._img(pose).copy()
            if boca:
                self._cola(im, f"viseme_{boca}", self.BOCA, "boca", dy)
            if piscando:
                self._cola(im, "olhos_fechados", self.OLHOS, "olhos", dy)
            self.cache[k] = im.resize((int(im.width * altura / im.height), altura), Image.LANCZOS)
        return self.cache[k]

    def no_tempo(self, t, al, pose, altura):
        """al: alinhamento do bloco (t em segundos do bloco). A pose vale o trecho inteiro."""
        pose = pose if pose in self.FALAM else "pose_neutro"
        piscando = (t % 3.6) < 0.12
        boca = None
        if al:
            for c, a, b in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
                if a <= t < b:
                    if c.strip() and c not in ",.!?:;":
                        boca = emb.VISEMA.get(c.lower(), "meio")
                    break
        return self.quadro(pose, boca, piscando, altura)


# ── cartões (cada um: função t_local → imagem RGBA) ─────────────────────────────────────────────

def fundo_rgba():
    return emb.fundo().convert("RGBA")


FUNDO = None


def base():
    global FUNDO
    if FUNDO is None:
        FUNDO = fundo_rgba()
    return FUNDO.copy()


def cartao_contador(v):
    alvo, rot, sub = int(v["valor"]), v.get("rotulo", ""), v.get("sub", "")
    de, dur = int(v.get("de", 0)), float(v.get("anima", 1.6))
    f1, f2, f3 = emb.fonte(220, "Bold"), emb.fonte(46, "SemiBold"), emb.fonte(34, "SemiBold")

    def r(t):
        img = base(); d = ImageDraw.Draw(img)
        x = emb.suave(t / dur)
        n = int(de + (alvo - de) * x)
        emb.texto_centro(d, H / 2 - 170, f"{n:,}".replace(",", "."), f1, AMBAR if x >= 1 else BRANCO)
        if rot:
            emb.texto_centro(d, H / 2 + 90, rot, f2, BRANCO, alfa=emb.suave((t - 0.3) / 0.4))
        if sub:
            emb.texto_centro(d, H / 2 + 160, sub, f3, CINZA, alfa=emb.suave((t - 0.6) / 0.4))
        return img
    return r


def cartao_terminal(v):
    linhas, titulo = v["linhas"], v.get("titulo", "")
    cores = v.get("cores", {})
    from PIL import ImageFont
    f, ft = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 38), emb.fonte(32, "SemiBold")
    vel = float(v.get("velocidade", 6))  # linhas por segundo que entram

    def r(t):
        img = base(); d = ImageDraw.Draw(img)
        x0, y0, x1, y1 = 140, 120, W - 140, H - 120
        d.rounded_rectangle((x0, y0, x1, y1), radius=24, fill=(12, 11, 18, 255), outline=(60, 58, 74, 255), width=2)
        for i, c in enumerate([(248, 113, 113), (251, 191, 36), (52, 211, 153)]):
            d.ellipse((x0 + 30 + i * 34, y0 + 26, x0 + 50 + i * 34, y0 + 46), fill=c + (255,))
        if titulo:
            d.text((x0 + 150, y0 + 20), titulo, font=ft, fill=CINZA + (255,))
        vis = min(len(linhas), int(t * vel) + 1)
        maxl = (y1 - y0 - 110) // 54
        mostra = linhas[max(0, vis - maxl):vis]
        for i, l in enumerate(mostra):
            y = y0 + 90 + i * 54
            cor = BRANCO
            for k, c in cores.items():
                if k in l:
                    cor = tuple(c)
            d.text((x0 + 40, y), l, font=f, fill=cor + (255,))
        return img
    return r


def cartao_codigo(v):
    errado, certo = v.get("errado"), v.get("certo")
    pergunta = v.get("pergunta", "")
    f, fp = emb.fonte(64, "SemiBold"), emb.fonte(44, "SemiBold")

    def r(t):
        img = base(); d = ImageDraw.Draw(img)
        if certo:
            for i, (sinal, txt, cor) in enumerate((("✗", errado, VERMELHO), ("✓", certo, VERDE))):
                a = emb.suave((t - i * 0.8) / 0.4)
                y = H / 2 - 150 + i * 170
                larg = d.textlength(txt, font=f) + 160
                x = (W - larg) / 2
                d.rounded_rectangle((x, y, x + larg, y + 120), radius=20, fill=CARTAO + (int(255 * a),), outline=cor + (int(255 * a),), width=3)
                # desenhado, não digitado: a Bahnschrift não tem ✗/✓ e saía um quadradinho (05/11)
                cx, cy, rr = x + 70, y + 60, 22
                if sinal == "✗":
                    d.line((cx - rr, cy - rr, cx + rr, cy + rr), fill=cor + (int(255 * a),), width=9)
                    d.line((cx - rr, cy + rr, cx + rr, cy - rr), fill=cor + (int(255 * a),), width=9)
                else:
                    d.line((cx - rr, cy, cx - 6, cy + rr - 4, cx + rr + 4, cy - rr), fill=cor + (int(255 * a),), width=9, joint="curve")
                d.text((x + 120, y + 22), txt, font=f, fill=BRANCO + (int(255 * a),))
        else:
            larg = d.textlength(errado, font=f) + 120
            x = (W - larg) / 2
            d.rounded_rectangle((x, H / 2 - 70, x + larg, H / 2 + 70), radius=20, fill=CARTAO + (255,))
            d.text((x + 60, H / 2 - 40), errado, font=f, fill=BRANCO + (255,))
            if pergunta:
                emb.texto_centro(d, H / 2 + 140, pergunta, fp, AMBAR, alfa=emb.suave((t - 0.8) / 0.4))
        return img
    return r


def cartao_texto(v):
    linhas = v["linhas"]
    tam = int(v.get("tamanho", 84))
    f, fs = emb.fonte(tam, "Bold"), emb.fonte(int(tam * 0.5), "SemiBold")
    rot = v.get("rotulo", "")

    def r(t):
        img = base(); d = ImageDraw.Draw(img)
        alt = len(linhas) * (tam + 24)
        y = (H - alt) / 2
        if rot:
            emb.texto_centro(d, y - 90, rot, fs, AMBAR, espaco=8, alfa=emb.suave(t / 0.4))
        for i, l in enumerate(linhas):
            a = emb.suave((t - 0.15 * i) / 0.45)
            emb.texto_centro(d, y + i * (tam + 24) + (1 - a) * 20, l, f, BRANCO, alfa=a)
        return img
    return r


def cartao_kpis(v):
    itens = v["itens"]  # [[valor, rótulo], ...]
    fv, fr = emb.fonte(110, "Bold"), emb.fonte(34, "SemiBold")
    fundo_mosaico = v.get("mosaico")
    mosaico = montar_mosaico(fundo_mosaico) if fundo_mosaico else None

    def r(t):
        img = base()
        if mosaico is not None:
            desl = int((t * 30) % 300)
            img.alpha_composite(mosaico.crop((desl, 0, desl + W, H)))
        d = ImageDraw.Draw(img)
        n = len(itens)
        larg = 480
        x0 = (W - n * larg - (n - 1) * 40) / 2
        for i, (val, rot) in enumerate(itens):
            a = emb.suave((t - 0.25 * i) / 0.4)
            x = x0 + i * (larg + 40)
            d.rounded_rectangle((x, H / 2 - 140, x + larg, H / 2 + 140), radius=28, fill=(14, 13, 20, int(230 * a)), outline=AMBAR + (int(200 * a),), width=2)
            tw = d.textlength(val, font=fv)
            d.text((x + (larg - tw) / 2, H / 2 - 110), val, font=fv, fill=BRANCO + (int(255 * a),))
            rw = d.textlength(rot, font=fr)
            d.text((x + (larg - rw) / 2, H / 2 + 50), rot, font=fr, fill=CINZA + (int(255 * a),))
        return img
    return r


def montar_mosaico(pastas):
    """Quadros reais de vídeos do PULSO (o meio de cada FINAL), escurecidos, numa faixa que corre."""
    thumbs = []
    for p in pastas:
        d = os.path.join(VIDEOS, p)
        finais = [f for f in os.listdir(d) if f.startswith("FINAL_") and f.endswith(".mp4")] if os.path.isdir(d) else []
        if not finais:
            continue
        tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False).name
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "4", "-i", os.path.join(d, finais[0]), "-frames:v", "1", tmp], check=True)
        thumbs.append(Image.open(tmp).convert("RGB")); os.remove(tmp)
    faixa = Image.new("RGBA", (W + 300, H), (0, 0, 0, 0))
    if not thumbs:
        return faixa
    th_h = H // 2
    x, i = 0, 0
    while x < W + 300:
        im = thumbs[i % len(thumbs)]
        im = im.resize((int(im.width * th_h / im.height), th_h))
        for linha in (0, 1):
            faixa.paste(im, (x - linha * im.width // 2, linha * th_h))
        x += im.width; i += 1
    escuro = Image.new("RGBA", faixa.size, (6, 6, 14, 170))
    return Image.alpha_composite(faixa, escuro)


def cartao_esteira(v):
    etapas = v["etapas"]
    f = emb.fonte(40, "SemiBold")

    def r(t):
        img = base(); d = ImageDraw.Draw(img)
        n = len(etapas); larg, gap = 260, 60
        x0 = (W - n * larg - (n - 1) * gap) / 2
        y = H / 2 - 60
        for i, e in enumerate(etapas):
            x = x0 + i * (larg + gap)
            ativo = int(t * 1.5) % n == i
            d.rounded_rectangle((x, y, x + larg, y + 120), radius=22, fill=CARTAO + (255,), outline=(AMBAR if ativo else (70, 68, 84)) + (255,), width=3)
            tw = d.textlength(e, font=f)
            d.text((x + (larg - tw) / 2, y + 36), e, font=f, fill=(BRANCO if ativo else CINZA) + (255,))
            if i < n - 1:
                d.line((x + larg + 10, y + 60, x + larg + gap - 10, y + 60), fill=(90, 88, 104, 255), width=4)
        # o "trabalhador": um ponto âmbar que corre a esteira
        px = x0 + (t * 0.35 % 1) * (n * larg + (n - 1) * gap)
        d.ellipse((px - 12, y + 160, px + 12, y + 184), fill=AMBAR + (255,))
        return img
    return r


def cartao_calendario(v):
    ini, fim = v["de"], v["ate"]  # "2026-03-31", "2026-05-22"
    fila_ate = int(v.get("fila_ate", 0))
    from datetime import date, timedelta
    d0, d1 = date.fromisoformat(ini), date.fromisoformat(fim)
    dias = (d1 - d0).days
    meses = ["", "janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
    fd, fm, fr = emb.fonte(200, "Bold"), emb.fonte(56, "SemiBold"), emb.fonte(40, "SemiBold")
    dur = float(v.get("anima", 6))

    def r(t):
        img = base(); dr = ImageDraw.Draw(img)
        x = emb.suave(t / dur)
        hoje = d0 + timedelta(days=int(dias * x))
        emb.texto_centro(dr, H / 2 - 230, f"{hoje.day:02d}", fd, BRANCO)
        emb.texto_centro(dr, H / 2 + 10, f"de {meses[hoje.month]}", fm, CINZA)
        if fila_ate:
            emb.texto_centro(dr, H / 2 + 150, f"fila parada: {int(fila_ate * x)} tarefas", fr, AMBAR)
        return img
    return r


def cartao_alerta(v):
    itens = v["itens"]  # [[rede, texto, "alta"|"ok"], ...]
    rot = v.get("rotulo", "")
    f, fb, fr = emb.fonte(38, "SemiBold"), emb.fonte(38, "Bold"), emb.fonte(30, "SemiBold")

    def r(t):
        img = base(); d = ImageDraw.Draw(img)
        y = H / 2 - len(itens) * 70
        if rot:
            emb.texto_centro(d, y - 80, rot, fr, AMBAR, espaco=6)
        for i, (rede, txt, nivel) in enumerate(itens):
            a = emb.suave((t - 0.3 * i) / 0.4)
            cor = VERMELHO if nivel == "alta" else VERDE
            d.rounded_rectangle((300, y, W - 300, y + 110), radius=20, fill=CARTAO + (int(255 * a),), outline=cor + (int(220 * a),), width=3)
            d.ellipse((340, y + 42, 366, y + 68), fill=cor + (int(255 * a),))
            d.text((400, y + 32), rede, font=fb, fill=BRANCO + (int(255 * a),))
            d.text((400 + d.textlength(rede + "   ", font=fb), y + 32), txt, font=f, fill=CINZA + (int(255 * a),))
            y += 140
        return img
    return r


RENDER = {"contador": cartao_contador, "terminal": cartao_terminal, "codigo": cartao_codigo, "texto": cartao_texto,
          "kpis": cartao_kpis, "esteira": cartao_esteira, "calendario": cartao_calendario, "alerta": cartao_alerta}


# ── montagem ────────────────────────────────────────────────────────────────────────────────────

def le_wav(mp3):
    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-ac", "1", "-ar", str(SR), tmp], check=True)
    with wave.open(tmp) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32767
    os.remove(tmp)
    return a


def quadros_bloco(num, itens, al, dur, visuais, avatar, ep, rascunho):
    """Gera os quadros de um bloco. visuais: lista na ordem das marcações TELA/AVATAR/CARTELA do bloco."""
    inicios = tempos_das_falas(itens, al)
    # cada marcação vale a partir da fala seguinte a ela
    segs, fala_i, viz_i = [], 0, 0
    for it in itens:
        if it[0] == "fala":
            fala_i += 1
        elif it[0] == "marca" and it[1] in ("TELA", "AVATAR", "CARTELA"):
            t0 = inicios[fala_i] if fala_i < len(inicios) else dur
            spec = visuais[viz_i] if viz_i < len(visuais) else {"tipo": "avatar", "pose": "pose_neutro"}
            viz_i += 1
            segs.append((max(0.0, t0 - 0.15), it[1], spec))
    if not segs:
        segs = [(0.0, "AVATAR", {"tipo": "avatar", "pose": "pose_neutro"})]
    segs[0] = (0.0,) + segs[0][1:]
    renders = [(t0, k, s, None if s.get("tipo") == "avatar" else RENDER[s["tipo"]](s)) for t0, k, s in segs]
    selo = emb.fonte(24, "SemiBold")

    # fala em destaque ao lado do avatar grande (05/11: o avatar sozinho no fundo liso ficava parado
    # demais): a linha que está sendo dita, com as palavras acendendo no tempo da voz
    falas = [x[1] for x in itens if x[0] == "fala"]
    texto = " ".join(falas)
    posicoes, p = [], 0
    for f_ in falas:
        i_ = texto.find(f_, p); posicoes.append(i_); p = i_ + len(f_)
    ini_c = al["character_start_times_seconds"]
    f_dest = emb.fonte(68, "Bold")
    medidor = ImageDraw.Draw(Image.new("RGBA", (10, 10)))

    def destaque(img, t):
        k = max((j for j, t0 in enumerate(inicios) if t0 <= t), default=None)
        if k is None:
            return
        dito = sum(1 for a in ini_c if a <= t)
        linhas, atual = [], []
        for w_ in falas[k].split():
            if atual and medidor.textlength(" ".join(atual + [w_]), font=f_dest) > 820:
                linhas.append(atual); atual = []
            atual.append(w_)
        linhas.append(atual)
        d = ImageDraw.Draw(img)
        y = H / 2 - len(linhas) * 44
        pos = posicoes[k]
        for linha in linhas:
            x = 980
            for w_ in linha:
                cor = BRANCO + (255,) if pos < dito else (110, 107, 123, 255)
                d.text((x, y), w_, font=f_dest, fill=cor)
                x += medidor.textlength(w_ + " ", font=f_dest)
                pos += len(w_) + 1
            y += 88
    passo = 3 if rascunho else 1
    ultimo = None
    for i in range(int(dur * FPS)):
        t = i / FPS
        atual = max((r for r in renders if r[0] <= t), key=lambda r: r[0])
        if rascunho and i % passo and ultimo is not None:
            yield ultimo; continue
        t0, k, spec, fn = atual
        tl = t - t0
        if fn is None:  # avatar grande à esquerda, a fala em destaque à direita
            img = base()
            av = avatar.no_tempo(t, al, spec.get("pose", "pose_neutro"), 820)
            img.alpha_composite(av, (int(W * 0.25) - av.width // 2, H - av.height - 20))
            destaque(img, t)
        else:
            img = fn(tl)
            av = avatar.no_tempo(t, al, spec.get("pose", "pose_neutro"), 300)
            img.alpha_composite(av, (W - av.width - 40, H - av.height - 30))
        d = ImageDraw.Draw(img)
        d.text((48, 36), f"BASTIDORES DO PULSO · {ep}", font=selo, fill=(163, 160, 176, 150))
        # transição: 0,2 s de entrada em cada troca de cartão
        if 0 <= tl < 0.35 and t0 > 0 and ultimo is not None:
            img = Image.blend(ultimo.convert("RGBA"), img, emb.suave(tl / 0.35))
        ultimo = img
        yield img


def srt_de(trechos):
    """trechos: [(t_inicio_global, alinhamento)] → legendas de até ~42 caracteres."""
    def ts(s):
        h, m = int(s // 3600), int(s % 3600 // 60)
        return f"{h:02d}:{m:02d}:{s % 60:06.3f}".replace(".", ",")
    out, n = [], 1
    for t0, al in trechos:
        chars, ini, fim = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
        palavras, atual, a0 = [], "", None
        for c, a, b in zip(chars, ini, fim):
            if c == " ":
                if atual:
                    palavras.append((atual, a0, b)); atual, a0 = "", None
            else:
                a0 = a if a0 is None else a0
                atual += c
        if atual:
            palavras.append((atual, a0, fim[-1]))
        linha, l0, l1 = [], None, None
        for p, a, b in palavras:
            # quebra no tamanho, ou no fim de frase quando a linha já tem corpo (senão sobra
            # palavra solta, como o "falhou." da 1ª montagem do E01)
            if linha and (len(" ".join(linha + [p])) > 42 or (linha[-1][-1] in ".!?" and len(" ".join(linha)) >= 18)):
                out.append(f"{n}\n{ts(t0 + l0)} --> {ts(t0 + l1)}\n{' '.join(linha)}\n"); n += 1
                linha, l0 = [], None
            linha.append(p); l0 = a if l0 is None else l0; l1 = b
        if linha:
            out.append(f"{n}\n{ts(t0 + l0)} --> {ts(t0 + l1)}\n{' '.join(linha)}\n"); n += 1
    return "\n".join(out)


def montar(codigo, rascunho=False, so_bloco=None):
    ep_row = g._db("GET", f"/rest/v1/episodios?codigo=eq.{codigo}&select=codigo,numero,status,roteiro_md", schema="pulso_content")
    if not ep_row:
        raise SystemExit(f"episódio {codigo} não existe")
    ep = ep_row[0]
    if ep["status"] == "planejado":
        raise SystemExit(f"{codigo} ainda não tem roteiro aprovado pelo dono: não monto")
    pasta = f"{ONEDRIVE}/bastidores_ep{int(ep['numero']):02d}"
    visuais = json.load(open(f"{pasta}/visuais.json", encoding="utf-8"))
    tag = f"EP. {int(ep['numero']):02d}"
    blocos = blocos_do_roteiro(ep["roteiro_md"])
    avatar = Avatar()

    tmp = tempfile.mkdtemp()
    partes, audio, trechos, t_global, cortes, blocos_t = [], [], [], 0.0, [], []

    for num, itens in blocos:
        if so_bloco is not None and num != str(so_bloco):
            continue
        base_n = f"{pasta}/narracao/bloco_{num}"
        if not os.path.exists(base_n + ".mp3"):
            raise SystemExit(f"falta a narração do bloco {num}")
        al = json.load(open(base_n + ".json", encoding="utf-8"))["alinhamento"]
        voz = le_wav(base_n + ".mp3")
        dur = len(voz) / SR + PAUSA
        wav = os.path.join(tmp, f"b{num}.wav")
        sinal = np.zeros(int(dur * SR)); sinal[: len(voz)] = voz
        emb.grava_wav(sinal, wav)
        mp4 = os.path.join(tmp, f"b{num}.mp4")
        print(f"bloco {num}: {dur:.1f}s")
        emb.codifica(quadros_bloco(num, itens, al, dur, visuais.get(num, []), avatar, tag, rascunho), int(dur * FPS), wav, mp4)
        partes.append(mp4); trechos.append((t_global, al))
        cortes += cortes_do_bloco(itens, al, t_global)
        blocos_t.append({"bloco": num, "inicio": round(t_global, 3), "duracao": round(dur, 3)})
        t_global += dur
        tem_vinheta = any(x[0] == "marca" and x[1] == "VINHETA" for x in itens)
        if tem_vinheta and so_bloco is None:
            vin = os.path.join(tmp, "vinheta.mp4")
            emb.vinheta(tag, vin); partes.append(vin); t_global += 3.6
    if so_bloco is None:
        prox = visuais.get("proximo", "")
        enc = os.path.join(tmp, "encerramento.mp4")
        emb.encerramento(prox, enc); partes.append(enc)

    lista = os.path.join(tmp, "lista.txt")
    with open(lista, "w", encoding="utf-8") as f:
        for p in partes:
            f.write(f"file '{p}'\n")
    sufixo = "_rascunho" if rascunho else ""
    saida = f"{pasta}/EP{int(ep['numero']):02d}_montagem{sufixo}{'_bloco' + str(so_bloco) if so_bloco is not None else ''}.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lista,
                    "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-b:a", "192k", "-af", "loudnorm=I=-16", saida], check=True)
    if so_bloco is None:
        open(saida[:-4] + ".srt", "w", encoding="utf-8").write(srt_de(trechos))
        json.dump({"codigo": codigo, "duracao": round(t_global + 11.1, 1), "blocos": blocos_t, "cortes": cortes, "legenda": trechos and saida[:-4] + ".srt"},
                  open(f"{pasta}/linha_do_tempo.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for f in os.listdir(tmp):
        os.remove(os.path.join(tmp, f))
    os.rmdir(tmp)
    return saida


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("codigo")
    ap.add_argument("--rascunho", action="store_true", help="1 quadro novo a cada 3 (rápido, para conferir)")
    ap.add_argument("--so-bloco")
    a = ap.parse_args()
    print(montar(a.codigo, a.rascunho, a.so_bloco))
