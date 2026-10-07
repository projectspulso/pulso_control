# -*- coding: utf-8 -*-
"""
QC DE PEÇA — a conferência automática do Pulso, separada do worker para servir outras marcas.

Nasceu para a peça-piloto da Mello (Limelight monta, Pulso confere — desenho em
Cockpit/sessoes/pulso-render-mello-2026-10.md, dono "pode" em 07/10/2026). Não publica nada.

Confere:
  duração      vídeo cobre a narração (se --audio vier)
  roteiro      o que se ouve no vídeo bate com o roteiro (faster-whisper, overlap ≥ 80%)
  congelado    nenhum trecho parado > 2 s no vídeo inteiro
  gancho       a primeira fala começa até 2 s
  marca mello  nunca preço (roteiro e fala) · fecho "veja no site mellooticas.com.br" nos últimos 8 s
               · com --taty-ia, lembra de conferir o aviso na tela (texto na imagem não é lido aqui)

Uso:
  python qc_peca.py <video.mp4> --roteiro <roteiro.txt> [--audio narracao.mp3] [--marca mello] [--taty-ia]
Saída: JSON com erros (barram), avisos (olho humano) e info (tempos, overlap, transcrição).
"""
import os, re, sys, json, argparse, subprocess, unicodedata, time

def dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path],
                         capture_output=True, text=True).stdout.strip()
    try: return float(out)
    except ValueError: return 0.0

def norm(s):
    return "".join(c for c in unicodedata.normalize("NFKD", s or "") if not unicodedata.combining(c)).lower()

def toks(s):
    return set(t for t in re.findall(r"[a-z0-9]+", norm(s)) if len(t) > 3)

# "R$ 199", "199 reais", "por apenas", "a partir de 99" — preço em qualquer forma falada ou escrita
RE_PRECO = re.compile(r"r\$\s*\d|\d[\d.,]*\s*(reais|real)\b|por apenas|a partir de\s*\d|\bpreco\b|\bdesconto de\s*\d", re.I)
RE_FECHO = re.compile(r"veja no site|mello\s*oticas|mellooticas", re.I)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video"); ap.add_argument("--roteiro", required=True)
    ap.add_argument("--audio"); ap.add_argument("--marca", default="pulso"); ap.add_argument("--taty-ia", action="store_true")
    a = ap.parse_args()
    t0 = time.time()
    roteiro = open(a.roteiro, encoding="utf-8").read()
    erros, avisos, info = [], [], {}

    vdur = dur(a.video); info["duracao_video_s"] = round(vdur, 1)
    if a.audio:
        adur = dur(a.audio); info["duracao_audio_s"] = round(adur, 1)
        if vdur < adur * 0.98: erros.append("vídeo %.1fs mais curto que a narração %.1fs (truncado)" % (vdur, adur))

    segs = []
    try:
        from faster_whisper import WhisperModel
        m = WhisperModel("small", device="cpu", compute_type="int8")
        segs = [(s.start, s.end, s.text) for s in m.transcribe(a.video, language="pt")[0]]
        fala = " ".join(t for _, _, t in segs).strip()
        info["transcricao"] = fala
        rt, tt = toks(roteiro), toks(fala)
        ov = len(rt & tt) / len(rt) if rt else 0.0
        info["overlap_roteiro"] = round(ov, 2)
        if ov < 0.80: erros.append("fala diverge do roteiro (overlap %.0f%%)" % (ov * 100))
        if segs:
            info["primeira_fala_s"] = round(segs[0][0], 2)
            if segs[0][0] > 2.0: erros.append("gancho tarde: primeira fala aos %.1fs (limite 2s)" % segs[0][0])
    except Exception as e:
        avisos.append("transcrição não rodou (%s) — conferir à mão" % str(e)[:80])

    r = subprocess.run(["ffmpeg", "-i", a.video, "-vf", "freezedetect=n=0.003:d=2", "-map", "0:v", "-f", "null", "-"],
                       capture_output=True, text=True, timeout=900)
    congel = re.findall(r"freeze_start: ([\d.]+)", r.stderr or "")
    if congel: avisos.append("trecho parado > 2s em %s s" % ", ".join(c[:5] for c in congel[:5]))

    if a.marca == "mello":
        if RE_PRECO.search(norm(roteiro)) or RE_PRECO.search(norm(info.get("transcricao", ""))):
            erros.append("menciona preço (regra da Mello: nunca preço)")
        fim = " ".join(t for s, e, t in segs if e >= vdur - 8)
        if segs and not RE_FECHO.search(norm(fim)) and not RE_FECHO.search(norm(roteiro[-300:])):
            erros.append('sem o fecho "veja no site mellooticas.com.br" no final')
        if a.taty_ia: avisos.append("Taty por IA: conferir o aviso na tela (texto na imagem não é lido por este QC)")

    qcdir = os.path.splitext(a.video)[0] + "_qc"; os.makedirs(qcdir, exist_ok=True)
    for nm, t in [("inicio", 1.0), ("meio", round(vdur / 2, 1)), ("fim", max(0, round(vdur - 1.5, 1)))]:
        subprocess.run(["ffmpeg", "-v", "error", "-ss", str(t), "-i", a.video, "-frames:v", "1", "-q:v", "3", f"{qcdir}/{nm}.jpg", "-y"], capture_output=True)
    info["frames"] = qcdir
    info["qc_levou_s"] = round(time.time() - t0, 1)
    print(json.dumps({"aprovada": not erros, "erros": erros, "avisos": avisos, "info": info}, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
