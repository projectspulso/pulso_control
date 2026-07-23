#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Motor de lip-sync do mascote PULSO.
Entrada: alignment.json (ElevenLabs with-timestamps) + narracao.mp3 + pasta de visemas.
Saida: short 9:16 com o avatar falando (boca trocada por frame) + legendas + audio.
Custo: R$0 (so ffmpeg + PIL, nenhuma API).

Uso:
  python lipsync_pulso.py <align.json> <audio.mp3> <out.mp4> [--legendas]
"""
import sys, os, json, subprocess, tempfile, unicodedata
from PIL import Image, ImageDraw, ImageFont

FFMPEG = r"C:/Users/junio/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin/ffmpeg.exe"
AVATAR_DIR = r"D:/projetos/pulso_control/public/pulso/avatar"
FPS = 30
W, H = 1080, 1920
BG_TOP = (16, 12, 38)      # roxo escuro brand
BG_BOTTOM = (6, 6, 14)     # quase preto

# char -> viseme (PT-BR). 6 bocas disponiveis: AEI, O, U, L, MBP, FV
VISEME_MAP = {}
for c in "aàáâãeéêiíïy": VISEME_MAP[c] = "AEI"
for c in "oóôõ":        VISEME_MAP[c] = "O"
for c in "uúüw":        VISEME_MAP[c] = "U"
for c in "l":           VISEME_MAP[c] = "L"
for c in "mbp":         VISEME_MAP[c] = "MBP"
for c in "fv":          VISEME_MAP[c] = "FV"
# demais consoantes -> boca levemente aberta (AEI) p/ manter movimento
for c in "stdnrcgjkqxzhç": VISEME_MAP[c] = "AEI"
REST = "MBP"  # boca fechada no silencio

def viseme_for(ch):
    ch = ch.lower()
    if not ch.strip():  # espaco / silencio
        return REST
    return VISEME_MAP.get(ch, "AEI")

def grad_bg():
    bg = Image.new("RGB", (W, H))
    px = bg.load()
    for y in range(H):
        t = y / H
        r = int(BG_TOP[0]*(1-t) + BG_BOTTOM[0]*t)
        g = int(BG_TOP[1]*(1-t) + BG_BOTTOM[1]*t)
        b = int(BG_TOP[2]*(1-t) + BG_BOTTOM[2]*t)
        for x in range(W): px[x, y] = (r, g, b)
    return bg

def make_canvas(viseme_png, base_bg):
    """Compoe 1 canvas full-frame com o avatar (uma boca) centralizado."""
    canvas = base_bg.copy()
    av = Image.open(viseme_png).convert("RGBA")
    # escala: ocupar ~62% da largura
    target_w = int(W * 0.62)
    scale = target_w / av.width
    av = av.resize((target_w, int(av.height*scale)), Image.LANCZOS)
    x = (W - av.width)//2
    y = int(H*0.30)
    canvas.paste(av, (x, y), av)
    return canvas

def build_runs(align):
    chars = align["characters"]
    st = align["character_start_times_seconds"]
    en = align["character_end_times_seconds"]
    # sequencia de (viseme, dur) colapsando iguais consecutivos
    runs = []
    for ch, s, e in zip(chars, st, en):
        v = viseme_for(ch)
        d = max(e - s, 0.0)
        if runs and runs[-1][0] == v:
            runs[-1][1] += d
        else:
            runs.append([v, d])
    # garante um frame minimo por run
    runs = [[v, max(d, 1.0/FPS)] for v, d in runs if d > 0]
    return runs

def srt_from_align(align, path):
    """Legendas agrupando em chunks de ~3 palavras."""
    chars = align["characters"]; st = align["character_start_times_seconds"]; en = align["character_end_times_seconds"]
    words = []  # (texto, ini, fim)
    cur = ""; ini = None; fim = None
    for ch, s, e in zip(chars, st, en):
        if ch.strip() == "":
            if cur:
                words.append((cur, ini, fim)); cur=""; ini=None
        else:
            if ini is None: ini = s
            cur += ch; fim = e
    if cur: words.append((cur, ini, fim))
    # agrupa 3 palavras
    chunks=[]
    i=0
    while i < len(words):
        grp = words[i:i+3]
        txt = " ".join(w[0] for w in grp)
        chunks.append((txt, grp[0][1], grp[-1][2]))
        i += 3
    def ts(t):
        h=int(t//3600); m=int((t%3600)//60); s=int(t%60); ms=int((t-int(t))*1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
    with open(path,"w",encoding="utf-8") as f:
        for n,(txt,a,b) in enumerate(chunks,1):
            f.write(f"{n}\n{ts(a)} --> {ts(b)}\n{txt.upper()}\n\n")

def main():
    align_p, audio_p, out_p = sys.argv[1], sys.argv[2], sys.argv[3]
    legendas = "--legendas" in sys.argv
    align = json.load(open(align_p, encoding="utf-8"))
    base = grad_bg()
    tmp = tempfile.mkdtemp(prefix="lipsync_")
    # pre-renderiza os 6 canvases unicos
    canvases = {}
    for v in ["AEI","O","U","L","MBP","FV"]:
        png = os.path.join(AVATAR_DIR, f"viseme_{v}.png")
        c = make_canvas(png, base)
        cp = os.path.join(tmp, f"canvas_{v}.png")
        c.save(cp); canvases[v] = cp
    runs = build_runs(align)
    total = sum(d for _,d in runs)
    print(f"[lipsync] {len(runs)} runs, {total:.1f}s de fala")
    # concat demuxer
    concat_p = os.path.join(tmp, "concat.txt")
    with open(concat_p,"w",encoding="utf-8") as f:
        for v,d in runs:
            f.write(f"file '{canvases[v].replace(chr(92),'/')}'\n")
            f.write(f"duration {d:.4f}\n")
        f.write(f"file '{canvases[runs[-1][0]].replace(chr(92),'/')}'\n")  # ultimo repetido
    silent_video = os.path.join(tmp, "video.mp4")
    subprocess.run([FFMPEG,"-y","-f","concat","-safe","0","-i",concat_p,
                    "-vsync","cfr","-r",str(FPS),"-pix_fmt","yuv420p",
                    "-c:v","libx264","-preset","veryfast",silent_video], check=True)
    # junta audio (+legendas opcional)
    vf = []
    if legendas:
        srt_p = os.path.join(tmp,"leg.srt"); srt_from_align(align, srt_p)
        srt_ff = srt_p.replace(chr(92),'/').replace(':','\\:')
        vf = ["-vf", f"subtitles='{srt_ff}':force_style='Fontsize=20,PrimaryColour=&H00FFFFFF,Outline=2,OutlineColour=&H00000000,Bold=1,Alignment=2,MarginV=120'"]
    cmd=[FFMPEG,"-y","-i",silent_video,"-i",audio_p]+vf+[
        "-c:v","libx264","-preset","veryfast","-pix_fmt","yuv420p",
        "-c:a","aac","-b:a","192k","-shortest",out_p]
    subprocess.run(cmd, check=True)
    print(f"[lipsync] OK -> {out_p}")

if __name__ == "__main__":
    main()
