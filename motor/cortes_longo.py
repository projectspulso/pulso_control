# -*- coding: utf-8 -*-
"""
FÁBRICA DE CORTES DOS LONGOS — cada "✂ CORTE" do roteiro vira um vertical 1080×1920 (Reels, Shorts,
TikTok, stories, status) a partir da montagem do episódio (dono, 05/11/2026).

  topo     o título do corte (o gancho escrito) + selo BASTIDORES DO PULSO · EP. NN
  meio     a montagem 16:9 por cima de um fundo desfocado dela mesma
  embaixo  legenda grande queimada (a maioria assiste sem som), recortada do .srt do episódio
  fim      2,5 s "episódio completo no YouTube" com a batida da marca: todo corte aponta pro longo

Entrada: <pasta>/EPNN_montagem.mp4 + .srt + linha_do_tempo.json (escritos por montar_longo.py).
Saída: <pasta>/cortes/corte_N_<slug>.mp4. Custo zero (só ffmpeg).

Uso: python D:/tmp/cortes_longo.py T01E01 [--so N]
"""
import argparse, json, os, re, subprocess, sys, tempfile, unicodedata

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import embalagem_bastidores as emb  # noqa: E402
import pulso_guard as g  # noqa: E402

VW, VH = 1080, 1920
FIM_S = 2.5


def slug(t):
    t = unicodedata.normalize("NFKD", t.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "_", t).strip("_")[:40]


def ts(s):
    s = max(0.0, s)
    return f"{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{s % 60:06.3f}".replace(".", ",")


def le_srt(caminho):
    blocos = open(caminho, encoding="utf-8").read().strip().split("\n\n")
    out = []
    for b in blocos:
        l = b.splitlines()
        if len(l) < 3:
            continue
        a, z = l[1].split(" --> ")
        seg = lambda x: (lambda h, m, s: int(h) * 3600 + int(m) * 60 + float(s.replace(",", ".")))(*x.split(":"))
        out.append((seg(a), seg(z), " ".join(l[2:])))
    return out


def srt_do_corte(legs, ini, fim, destino):
    linhas, n = [], 1
    for a, z, txt in legs:
        if z <= ini or a >= fim:
            continue
        linhas.append(f"{n}\n{ts(a - ini)} --> {ts(min(z, fim) - ini)}\n{txt}\n"); n += 1
    open(destino, "w", encoding="utf-8").write("\n".join(linhas))


def cartaz_topo(titulo, tag, destino, marca="BASTIDORES DO PULSO"):
    img = Image.new("RGBA", (VW, VH), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    fs, ft = emb.fonte(34, "SemiBold"), emb.fonte(84, "Bold")
    selo = f"{marca} · {tag}"
    d.text(((VW - d.textlength(selo, font=fs)) / 2, 230), selo, font=fs, fill=emb.AMBAR + (255,))
    linhas = emb.quebra(d, titulo.upper(), ft, 940)
    y = 300
    for l in linhas:
        d.text(((VW - d.textlength(l, font=ft)) / 2, y), l, font=ft, fill=emb.BRANCO + (255,))
        y += 96
    img.save(destino)


def cartao_final(tag, destino, linhas=("EPISÓDIO COMPLETO", "no YouTube"), rodape=None):
    """2,5 s: a linha de batimento + 'episódio completo no YouTube', com a batida."""
    tmp = tempfile.mkdtemp()
    n = int(FIM_S * emb.FPS)
    fa, fb, fc = emb.fonte(46, "SemiBold"), emb.fonte(104, "Bold"), emb.fonte(40, "SemiBold")
    bg = Image.new("RGB", (VW, VH), emb.BG_BASE)
    y0 = VH / 2 + 60
    mini = [(0, 0), (0.38, 0), (0.44, -14), (0.48, 0), (0.50, 24), (0.53, -120), (0.56, 48), (0.60, 0), (1.0, 0)]
    for i in range(n):
        t = i / emb.FPS
        img = bg.copy().convert("RGBA")
        d = ImageDraw.Draw(img)
        x = emb.suave(t / 0.8)
        pts = [(px * VW, y0 + dy) for px, dy in mini if px <= x] + [(x * VW, y0)]
        if len(pts) > 1:
            d.line(pts, fill=emb.AMBAR + (255,), width=8, joint="curve")
        a = emb.suave((t - 0.5) / 0.4)
        for txt, f, y, cor in ((linhas[0], fa, VH / 2 - 330, emb.AMBAR), (linhas[1], fb, VH / 2 - 260, emb.BRANCO),
                               (rodape or f"Bastidores do PULSO · {tag}", fc, VH / 2 + 240, (163, 160, 176))):
            w = d.textlength(txt, font=f)
            d.text(((VW - w) / 2, y), txt, font=f, fill=cor + (int(255 * a),))
        img.convert("RGB").save(os.path.join(tmp, f"q{i:04d}.png"))
    wav = os.path.join(tmp, "a.wav")
    emb.grava_wav(emb.batida(FIM_S, [0.5]), wav)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(emb.FPS), "-i", os.path.join(tmp, "q%04d.png"), "-i", wav,
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-ar", "44100", "-ac", "2", "-shortest", destino], check=True)
    for f in os.listdir(tmp):
        os.remove(os.path.join(tmp, f))
    os.rmdir(tmp)


def destino_cfg(destino_id):
    if not destino_id:
        return None
    cfg = json.loads(g._db("GET", "/rest/v1/configuracoes?chave=eq.cortes_destinos&select=valor", schema="pulso_core")[0]["valor"])
    d = next((x for x in cfg["destinos"] if x["id"] == destino_id), None)
    if not d:
        raise SystemExit(f"destino {destino_id} não existe em cortes_destinos")
    return d


def gerar(codigo, so=None, destino_id=None):
    """Sem destino: os cortes-base do episódio (ficha). Com destino: a VERSÃO daquele destino, com selo,
    título e cartão final próprios: arquivo diferente por destino, para a rede não tratar como repost."""
    ep = g._db("GET", f"/rest/v1/episodios?codigo=eq.{codigo}&select=numero", schema="pulso_content")[0]
    nn = int(ep["numero"])
    pasta = f"{emb.ONEDRIVE}/bastidores_ep{nn:02d}"
    tag = f"EP. {nn:02d}"
    dest = destino_cfg(destino_id)
    textos = {}
    arq_textos = f"{pasta}/cortes/textos_destinos.json"
    if dest and os.path.exists(arq_textos):
        textos = json.load(open(arq_textos, encoding="utf-8")).get(dest["id"], {})
    lt = json.load(open(f"{pasta}/linha_do_tempo.json", encoding="utf-8"))
    montagem = f"{pasta}/EP{nn:02d}_montagem.mp4"
    legs = le_srt(montagem[:-4] + ".srt")
    os.makedirs(f"{pasta}/cortes", exist_ok=True)
    tmp = tempfile.mkdtemp(dir="D:/tmp")  # caminho sem acento nem espaço: o filtro de legenda do ffmpeg engasga
    final = os.path.join(tmp, "final.mp4")
    if dest:
        cartao_final(tag, final, tuple(dest["final"]), f"Episódio completo: {dest.get('rodape') or dest['arroba']}")
    else:
        cartao_final(tag, final)
    tipos = {}
    if dest:
        epid = g._db("GET", f"/rest/v1/episodios?codigo=eq.{codigo}&select=id", schema="pulso_content")[0]["id"]
        tipos = {r["numero"]: r["tipo"] for r in g._db("GET", f"/rest/v1/episodio_cortes?episodio_id=eq.{epid}&select=numero,tipo", schema="pulso_content")}
    feitos = []
    for c in lt["cortes"]:
        if so is not None and c["numero"] != int(so):
            continue
        if dest and (tipos.get(c["numero"]) not in dest["tipos"] or dest.get("so_rosto_real")):
            continue
        ini, fim = max(0.0, c["ini"] - 0.1), c["fim"]
        srt = os.path.join(tmp, "c.srt").replace("\\", "/")
        srt_do_corte(legs, ini, fim, srt)
        topo = os.path.join(tmp, "topo.png")
        titulo = (textos.get(str(c["numero"])) or {}).get("titulo") or c["titulo"]
        cartaz_topo(titulo, tag, topo, dest["selo"] if dest else "BASTIDORES DO PULSO")
        corpo = os.path.join(tmp, "corpo.mp4")
        estilo = "Fontname=Bahnschrift,Fontsize=17,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2.2,Shadow=0,Alignment=2,MarginV=52"
        filtro = (
            "[0:v]split[a][b];"
            f"[a]scale=-2:{VH},crop={VW}:{VH},boxblur=24:2,eq=brightness=-0.28[fundo];"
            f"[b]scale={VW}:-2[frente];"
            "[fundo][frente]overlay=0:640[m];"
            "[m][1:v]overlay=0:0[t];"
            f"[t]subtitles='{srt.replace(':', chr(92) + ':')}':force_style='{estilo}'[v]"
        )
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{ini:.3f}", "-t", f"{fim - ini:.3f}", "-i", montagem, "-i", topo,
                        "-filter_complex", filtro, "-map", "[v]", "-map", "0:a", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
                        "-pix_fmt", "yuv420p", "-r", str(emb.FPS), "-c:a", "aac", "-ar", "44100", "-ac", "2", corpo], check=True)
        lista = os.path.join(tmp, "l.txt")
        open(lista, "w").write(f"file '{corpo}'\nfile '{final}'\n")
        sub = f"{pasta}/cortes/{dest['id']}" if dest else f"{pasta}/cortes"
        os.makedirs(sub, exist_ok=True)
        saida = f"{sub}/corte_{c['numero']}_{slug(c['titulo'])}.mp4"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lista, "-c:v", "libx264", "-preset", "medium",
                        "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-af", "loudnorm=I=-14", saida], check=True)
        feitos.append({**c, "arquivo": os.path.basename(saida), "duracao": round(fim - ini + FIM_S, 1)})
        print(f"corte {c['numero']}: {c['titulo']} · {fim - ini + FIM_S:.1f}s")
    json.dump(feitos, open(f"{sub if feitos else pasta + '/cortes'}/cortes.json" if dest else f"{pasta}/cortes/cortes.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for f in os.listdir(tmp):
        os.remove(os.path.join(tmp, f))
    os.rmdir(tmp)
    return feitos


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("codigo")
    ap.add_argument("--so")
    ap.add_argument("--destino", help="id em configuracoes.cortes_destinos (sem: cortes-base da ficha)")
    a = ap.parse_args()
    gerar(a.codigo, a.so, a.destino)
