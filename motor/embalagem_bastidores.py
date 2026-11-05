# -*- coding: utf-8 -*-
"""
EMBALAGEM DOS BASTIDORES — a abertura (vinheta) e o encerramento padrão de todo episódio e corte
dos Longos (dono, 05/11/2026: "criar uma apresentação padrão em todos os vídeos").

  vinheta       3,6 s · a linha de um eletrocardiograma corta a tela, bate uma vez e vira
                "BASTIDORES DO PULSO". A batida (lub-dub) é a assinatura sonora da marca.
  encerramento  ~9 s · o avatar do dono fala a assinatura com lip-sync, o mascote do PULSO ao lado,
                "no próximo episódio" + título + inscreva-se; os últimos segundos ficam calmos para
                a tela final do YouTube. Fecha com a mesma batida.

O ROSTO DO DONO nunca entra no repositório (é público): os quadros e as saídas ficam no OneDrive.
A voz é a travada (voz_dono.py → configuracoes.voz_bastidores). Custo: só a narração da assinatura.

Uso:
  python D:/tmp/embalagem_bastidores.py vinheta [--ep "EP. 01"] [--saida X.mp4]
  python D:/tmp/embalagem_bastidores.py encerramento --proximo "título do próximo" [--saida X.mp4]
"""
import argparse, json, math, os, subprocess, sys, tempfile, wave

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import voz_dono  # noqa: E402

ONEDRIVE = "D:/OneDrive - Óticas Taty Mello/Grupo Mello/Marketing_e_Vendas/digiai/pulso"
AVATAR = f"{ONEDRIVE}/avatar_dono"
SAIDA = f"{ONEDRIVE}/bastidores_embalagem"
MASCOTE = "D:/projetos/pulso_control/public/pulso/expression"

W, H, FPS, SR = 1920, 1080, 30, 44100
BG_TOPO, BG_BASE = (16, 12, 38), (6, 6, 14)
AMBAR, BRANCO, LILAS = (233, 162, 59), (245, 244, 248), (144, 133, 233)
ASSINATURA = "Eu sou o dono do PULSO, e isso aqui são os bastidores."


def fonte(tam, peso="Bold"):
    try:
        f = ImageFont.truetype("C:/Windows/Fonts/bahnschrift.ttf", tam)
        f.set_variation_by_name(peso)
        return f
    except Exception:
        return ImageFont.truetype("C:/Windows/Fonts/seguibl.ttf", tam)


def fundo():
    g = np.linspace(0, 1, H)[:, None, None]
    a, b = np.array(BG_TOPO), np.array(BG_BASE)
    return Image.fromarray(np.broadcast_to(a * (1 - g) + b * g, (H, W, 3)).astype(np.uint8))


def suave(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def texto_centro(d, y, txt, f, cor, espaco=0, alfa=1.0):
    if espaco:
        larg = sum(d.textlength(c, font=f) for c in txt) + espaco * (len(txt) - 1)
        x = (W - larg) / 2
        for c in txt:
            d.text((x, y), c, font=f, fill=cor + (int(255 * alfa),))
            x += d.textlength(c, font=f) + espaco
    else:
        larg = d.textlength(txt, font=f)
        d.text(((W - larg) / 2, y), txt, font=f, fill=cor + (int(255 * alfa),))


def batida(dur, tempos, forte=1.0):
    """lub-dub grave: duas pancadas senoidais com decaimento; a assinatura sonora dos Bastidores."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for t0 in tempos:
        for atraso, ganho, freq in ((0.0, 1.0, 52), (0.21, 0.62, 61)):
            tau = t - (t0 + atraso)
            m = tau >= 0
            s[m] += forte * ganho * np.sin(2 * np.pi * freq * tau[m]) * np.exp(-tau[m] * 16)
            s[m] += forte * ganho * 0.25 * np.sin(2 * np.pi * freq * 3 * tau[m]) * np.exp(-tau[m] * 40)
    return s


def grava_wav(sinal, caminho):
    pico = np.max(np.abs(sinal)) or 1
    pcm = (sinal / pico * 0.9 * 32767).astype(np.int16)
    with wave.open(caminho, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())


def codifica(frames_iter, n, audio, saida):
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-i", audio, "-map", "0:v", "-map", "1:a",
           "-af", "loudnorm=I=-16", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "192k", "-shortest", saida]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i, fr in enumerate(frames_iter):
        p.stdin.write(fr.convert("RGB").tobytes())
        if i + 1 >= n:
            break
    p.stdin.close()
    if p.wait() != 0:
        raise SystemExit("ffmpeg falhou")
    return saida


# ── vinheta ─────────────────────────────────────────────────────────────────────────────────────

def linha_ecg():
    """Pontos da linha: plana, onda P, a batida, volta à linha e segue plana."""
    y0 = H / 2 + 30
    base = [(0, 0), (0.40, 0), (0.43, -18), (0.455, 0), (0.48, 0), (0.495, 34), (0.515, -175), (0.535, 80),
            (0.555, 0), (0.60, 0), (0.63, -26), (0.67, 0), (1.0, 0)]
    return [(x * W, y0 + dy) for x, dy in base]


def ponto_em(pts, x):
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        if x1 <= x <= x2:
            return (x, y1 + (y2 - y1) * ((x - x1) / (x2 - x1 or 1)))
    return pts[-1]


def vinheta(ep, saida):
    dur, n = 3.6, int(3.6 * FPS)
    bg, pts = fundo(), linha_ecg()
    f_titulo, f_sub, f_ep = fonte(150, "Bold"), fonte(54, "SemiBold"), fonte(40, "SemiBold")
    revela = 1.1  # a linha cruza a tela em 1,1 s; a batida (x = 0,515 W) chega em ~0,57 s

    def quadros():
        for i in range(n):
            t = i / FPS
            img = bg.copy().convert("RGBA")
            camada = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            d = ImageDraw.Draw(camada)
            xf = suave(t / revela) * W
            vis = [p for p in pts if p[0] <= xf] + [ponto_em(pts, xf)]
            pulso = 1.0 + 0.6 * math.exp(-max(0.0, t - 0.57) * 5) * (t >= 0.57)
            if len(vis) > 1:
                d.line(vis, fill=AMBAR + (255,), width=int(6 * pulso), joint="curve")
            brilho = camada.resize((W // 4, H // 4)).filter(ImageFilter.GaussianBlur(6)).resize((W, H))
            img = Image.alpha_composite(img, brilho)
            img = Image.alpha_composite(img, brilho)
            img = Image.alpha_composite(img, camada)
            if t < revela + 0.1:
                cab = ponto_em(pts, xf)
                d2 = ImageDraw.Draw(img)
                d2.ellipse((cab[0] - 9, cab[1] - 9, cab[0] + 9, cab[1] + 9), fill=BRANCO + (255,))
            # o título entra na segunda batida
            a = suave((t - 1.15) / 0.45)
            if a > 0:
                txt = Image.new("RGBA", (W, H), (0, 0, 0, 0))
                dt = ImageDraw.Draw(txt)
                texto_centro(dt, H / 2 - 345 + (1 - a) * 30, "BASTIDORES", f_titulo, BRANCO, espaco=6, alfa=a)
                texto_centro(dt, H / 2 + 165, "DO PULSO", f_sub, AMBAR, espaco=22, alfa=a)
                if ep:
                    texto_centro(dt, H - 150, ep, f_ep, LILAS, espaco=8, alfa=suave((t - 1.7) / 0.4))
                img = Image.alpha_composite(img, txt)
            escuro = suave((t - 3.1) / 0.5)
            if escuro > 0:
                img = Image.blend(img.convert("RGB"), Image.new("RGB", (W, H)), escuro).convert("RGBA")
            yield img

    wav = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
    grava_wav(batida(dur, [0.57, 1.15]), wav)
    try:
        return codifica(quadros(), n, wav, saida)
    finally:
        os.remove(wav)


# ── encerramento ────────────────────────────────────────────────────────────────────────────────

VISEMA = {}
for c in "aàáâã": VISEMA[c] = "AEI"
for c in "eéê": VISEMA[c] = "E"
for c in "iíy": VISEMA[c] = "I"
for c in "oóôõ": VISEMA[c] = "O"
for c in "uúü": VISEMA[c] = "U"
for c in "fv": VISEMA[c] = "FV"
for c in "l": VISEMA[c] = "L"
for c in "szçx": VISEMA[c] = "S"
for c in "mbp": VISEMA[c] = "MBP"


def carrega(caminho, altura):
    im = Image.open(caminho).convert("RGBA")
    return im.resize((int(im.width * altura / im.height), altura), Image.LANCZOS)


def quebra(d, txt, f, larg):
    linhas, atual = [], ""
    for p in txt.split():
        teste = f"{atual} {p}".strip()
        if d.textlength(teste, font=f) <= larg:
            atual = teste
        else:
            linhas.append(atual); atual = p
    return linhas + ([atual] if atual else [])


def assinatura_aprovada(tentativas=5):
    """A assinatura é a MESMA em todo vídeo: narrada uma vez, conferida por transcrição e guardada.
    Nasceu de 05/11: uma geração saiu "besti dois" no lugar de "bastidores" e os dois modelos de
    transcrição ouviram igual. Sem take que passe, para em vez de usar o ruim."""
    mp3, js = f"{SAIDA}/assinatura_voz.mp3", f"{SAIDA}/assinatura_voz.json"
    if os.path.exists(mp3) and os.path.exists(js):
        return mp3, json.load(open(js, encoding="utf-8"))
    from faster_whisper import WhisperModel
    modelo = WhisperModel("small", device="cpu", compute_type="int8")
    for i in range(tentativas):
        cand = f"{SAIDA}/_assinatura_take{i + 1}.mp3"
        _, al = voz_dono.narrar(ASSINATURA, cand, tempos=True)
        ouvido = " ".join(s.text for s in modelo.transcribe(cand, language="pt")[0]).lower()
        print(f"take {i + 1}: {ouvido.strip()}")
        if "bastidores" in ouvido and "dono do pulso" in ouvido:
            os.replace(cand, mp3)
            json.dump(al, open(js, "w", encoding="utf-8"), ensure_ascii=False)
            for f in os.listdir(SAIDA):
                if f.startswith("_assinatura_take"):
                    os.remove(os.path.join(SAIDA, f))
            return mp3, al
    raise SystemExit("nenhum take da assinatura passou na transcrição: os takes ficaram na pasta para o dono ouvir")


def encerramento(proximo, saida):
    tmp = tempfile.mkdtemp()
    voz, al = assinatura_aprovada()
    chars, inicios, fins = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    atraso = 0.4
    fala_fim = atraso + fins[-1]
    dur = fala_fim + 5.0  # os últimos 5 s ficam calmos para a tela final do YouTube
    n = int(dur * FPS)

    alt_av = 720
    bocas = {k: carrega(f"{AVATAR}/viseme_{k}.png", alt_av) for k in ["AEI", "E", "I", "O", "U", "FV", "L", "S", "MBP", "meio"]}
    piscar_fala = carrega(f"{AVATAR}/blink_falando.png", alt_av)
    piscar = carrega(f"{AVATAR}/olhos_fechados.png", alt_av)
    joinha = carrega(f"{AVATAR}/pose_joinha.png", alt_av)
    # o quadro do mascote tem muita sobra transparente: corta pela união das silhuetas (todas iguais
    # entre si, senão ele pula ao trocar de expressão) e só então escala
    brutos = {k: Image.open(f"{MASCOTE}/{k}.png").convert("RGBA") for k in ["exp_feliz", "exp_neutro_blink", "exp_entusiasmado"]}
    caixas = [im.getchannel("A").point(lambda a: 255 if a > 40 else 0).getbbox() for im in brutos.values()]
    uniao = (min(c[0] for c in caixas), min(c[1] for c in caixas), max(c[2] for c in caixas), max(c[3] for c in caixas))
    alt_m = 600
    masc = {}
    for k, im in brutos.items():
        im = im.crop(uniao)
        masc[k] = im.resize((int(im.width * alt_m / im.height), alt_m), Image.LANCZOS)

    def boca(t):
        tt = t - atraso
        for c, a, b in zip(chars, inicios, fins):
            if a <= tt < b:
                return VISEMA.get(c.lower(), "MBP" if not c.strip() or c in ",.!?" else "meio")
        return None

    # faixa de marca no topo: a mesma linha de batimento da vinheta, em miniatura
    bg = fundo().convert("RGBA")
    marca = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dm = ImageDraw.Draw(marca)
    y0, x0, larg = 150, W / 2 - 330, 660
    mini = [(0, 0), (0.40, 0), (0.45, -8), (0.48, 0), (0.50, 14), (0.53, -62), (0.56, 26), (0.59, 0), (1.0, 0)]
    dm.line([(x0 + x * larg, y0 + dy) for x, dy in mini], fill=AMBAR + (255,), width=4, joint="curve")
    texto_centro(dm, 62, "BASTIDORES  DO  PULSO", fonte(30, "SemiBold"), BRANCO, espaco=10, alfa=0.85)
    bg = Image.alpha_composite(bg, marca)
    f_rot, f_tit, f_cta = fonte(34, "SemiBold"), fonte(58, "Bold"), fonte(40, "Bold")
    xa, xm = int(W * 0.22), int(W * 0.80)

    def quadros():
        for i in range(n):
            t = i / FPS
            img = bg.copy().convert("RGBA")
            v = boca(t)
            pisca = (t % 3.4) < 0.12
            if t > fala_fim + 0.3:
                av = joinha
            elif v:
                av = piscar_fala if pisca else bocas[v]
            else:
                av = piscar if pisca else bocas["MBP"]
            img.alpha_composite(av, (xa - av.width // 2, H - av.height - 40))
            # mascote: leve balanço; vibra no fim, quando a assinatura termina
            m = masc["exp_entusiasmado"] if t > fala_fim else (masc["exp_neutro_blink"] if (t % 2.7) < 0.12 else masc["exp_feliz"])
            dy = int(10 * math.sin(t * 2.2))
            img.alpha_composite(m, (xm - m.width // 2, H - m.height - 60 + dy))
            # coluna do meio: próximo episódio e inscreva-se
            a = suave((t - (fala_fim - 0.6)) / 0.5)
            if a > 0:
                txt = Image.new("RGBA", (W, H), (0, 0, 0, 0))
                d = ImageDraw.Draw(txt)
                y = 300
                if proximo:
                    texto_centro(d, y, "NO PRÓXIMO EPISÓDIO", f_rot, AMBAR, espaco=6, alfa=a)
                    y += 70
                    for linha in quebra(d, proximo, f_tit, 620):
                        texto_centro(d, y, linha, f_tit, BRANCO, alfa=a); y += 70
                y += 40
                larg = d.textlength("INSCREVA-SE", font=f_cta) + 80
                x0 = (W - larg) / 2
                d.rounded_rectangle((x0, y, x0 + larg, y + 76), radius=38, fill=AMBAR + (int(255 * a),))
                texto_centro(d, y + 14, "INSCREVA-SE", f_cta, (26, 18, 6), alfa=a)
                img = Image.alpha_composite(img, txt)
            luz = min(suave(t / 0.35), 1 - suave((t - (dur - 0.5)) / 0.5))
            if luz < 1:
                img = Image.blend(Image.new("RGB", (W, H)), img.convert("RGB"), luz).convert("RGBA")
            yield img

    # áudio: a voz com atraso + a batida no fim da assinatura
    voz_wav = os.path.join(tmp, "voz.wav")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", voz, "-ac", "1", "-ar", str(SR), voz_wav], check=True)
    with wave.open(voz_wav) as w:
        v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32767
    mix = np.zeros(int(dur * SR))
    ini = int(atraso * SR)
    mix[ini:ini + len(v)] += v[: len(mix) - ini]
    mix += 0.55 * batida(dur, [fala_fim + 0.25])
    final_wav = os.path.join(tmp, "mix.wav")
    grava_wav(mix, final_wav)
    try:
        return codifica(quadros(), n, final_wav, saida)
    finally:
        for f in os.listdir(tmp):
            os.remove(os.path.join(tmp, f))
        os.rmdir(tmp)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("peca", choices=["vinheta", "encerramento"])
    ap.add_argument("--ep", default="")
    ap.add_argument("--proximo", default="")
    ap.add_argument("--saida")
    a = ap.parse_args()
    os.makedirs(SAIDA, exist_ok=True)
    if a.peca == "vinheta":
        print(vinheta(a.ep, a.saida or f"{SAIDA}/vinheta_bastidores{('_' + a.ep.replace('.', '').replace(' ', '')) if a.ep else ''}.mp4"))
    else:
        print(encerramento(a.proximo, a.saida or f"{SAIDA}/encerramento_bastidores.mp4"))
