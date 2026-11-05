# -*- coding: utf-8 -*-
"""
FICHA DO EPISÓDIO — fecha a produção de um Longo e alimenta a ficha do app (/longos/<codigo>), igual à
ficha única dos Shorts (dono, 05/11/2026).

  1. trava do segredo: compara o roteiro com TODAS as receitas do Livro (trechos de 5 palavras) e com
     termos proibidos. Trecho em comum barra (sai com erro, nada sobe).
  2. sobe ao bucket PRIVADO bastidores: prévia 720p da montagem (o limite de arquivo é 50 MB), a
     legenda .srt e os cortes verticais.
  3. grava episodios.metadata (fontes, trava, narração, montagem) e episodio_cortes (083).

Uso: python D:/tmp/ficha_longo.py T01E01
"""
import json, os, re, subprocess, sys, tempfile, unicodedata, urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pulso_guard as g  # noqa: E402

ONEDRIVE = "D:/OneDrive - Óticas Taty Mello/Grupo Mello/Marketing_e_Vendas/digiai/pulso"
BUCKET = "bastidores"
PROIBIDOS = ["/api/", "jobid", "orchestrator", "processar-fila", "cron.schedule", "webhook", "service_role",
             "gemini", "veo", "higgsfield", "prompt", "limiar", "sorteio", "piso de explora"]


def _norm(t):
    t = unicodedata.normalize("NFKD", t.lower())
    return re.findall(r"[a-z0-9]+", "".join(c for c in t if not unicodedata.combining(c)))


def _telhas(p, n=5):
    return {" ".join(p[i:i + n]) for i in range(len(p) - n + 1)}


def trava_segredo(roteiro):
    corpo = roteiro.split("## Para o dono")[0]
    R = _telhas(_norm(corpo))
    rec = g._db("GET", "/rest/v1/livro_problemas_receita?select=problema_id,receita_md", schema="pulso_content")
    comuns = []
    for r in rec:
        c = R & _telhas(_norm(r["receita_md"]))
        if c:
            comuns.append({"problema_id": r["problema_id"], "trechos": sorted(c)[:5]})
    termos = [p for p in PROIBIDOS if p in corpo.lower()]
    return {"em": __import__("datetime").date.today().isoformat(), "receitas": len(rec),
            "trechos_comuns": len(comuns), "detalhe": comuns, "termos_proibidos": termos,
            "passou": not comuns and not termos}


def fontes(roteiro):
    cab = roteiro.split("## 0.")[0]
    pega = lambda rot: [s.strip("` ") for linha in re.findall(rf"- {rot}:\s*(.+)", cab) for s in re.findall(r"`([^`]+)`", linha)]
    banco = [re.sub(r"`", "", l).strip() for l in re.findall(r"- Banco:\s*(.+)", cab)]
    return {"casos": pega("Livro"), "assuntos": pega("Linha do tempo"), "banco": banco}


def capitulos(roteiro, lt):
    """Capítulos do YouTube a partir dos blocos (o 1º tem de ser 0:00; o YouTube pede ≥3 e ≥10 s cada)."""
    corpo = roteiro.split("## Para o dono")[0]
    nomes = {m.group(1): m.group(2).strip().capitalize() for m in re.finditer(r"\n## (\d+)\. ([^(\n]+)", corpo)}
    out = []
    for b in lt.get("blocos", []):
        t = int(round(b["inicio"]))
        out.append(f"{t // 60}:{t % 60:02d} {nomes.get(b['bloco'], 'Bloco ' + b['bloco'])}")
    if out:
        out[0] = "0:00 " + out[0].split(" ", 1)[1]
    return out


def textos(pasta, roteiro, lt, cortes):
    """Tudo pronto para copiar na ficha: título, descrição com capítulos, tags e a legenda de cada corte.
    O texto criativo vem de <pasta>/textos.json (escrito à mão no E01; depois, gerado)."""
    arq = f"{pasta}/textos.json"
    base = json.load(open(arq, encoding="utf-8")) if os.path.exists(arq) else {}
    yt = base.get("youtube", {})
    caps = capitulos(roteiro, lt)
    descricao = (yt.get("descricao", "").rstrip() + "\n\nCapítulos\n" + "\n".join(caps) + "\n\n" + yt.get("rodape", "")).strip()
    return {"youtube": {"titulo": yt.get("titulo", ""), "descricao": descricao, "tags": yt.get("tags", []),
                        "aviso": yt.get("aviso", "")},
            "cortes": base.get("cortes", {})}


def sobe(local, caminho, tipo):
    U, K = g._env()
    req = urllib.request.Request(f"{U}/storage/v1/object/{BUCKET}/{caminho}", method="POST", data=open(local, "rb").read(),
                                 headers={"apikey": K, "Authorization": f"Bearer {K}", "Content-Type": tipo, "x-upsert": "true"})
    urllib.request.urlopen(req).read()
    return caminho


def assina(caminho, segundos=7 * 86400):
    """Link assinado do bucket privado (o vídeo tem o rosto do dono): é o que o digiai_mkt baixa."""
    U, K = g._env()
    req = urllib.request.Request(f"{U}/storage/v1/object/sign/{BUCKET}/{caminho}", method="POST",
                                 data=json.dumps({"expiresIn": segundos}).encode(),
                                 headers={"apikey": K, "Authorization": f"Bearer {K}", "Content-Type": "application/json"})
    rel = json.loads(urllib.request.urlopen(req).read())["signedURL"]
    return f"{U}/storage/v1{rel}" if rel.startswith("/") else rel


def duracao(arq):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arq],
                                capture_output=True, text=True, encoding="utf-8").stdout.strip() or 0)


def fechar(codigo):
    ep = g._db("GET", f"/rest/v1/episodios?codigo=eq.{codigo}&select=id,numero,status,roteiro_md,metadata", schema="pulso_content")[0]
    nn = int(ep["numero"])
    pasta = f"{ONEDRIVE}/bastidores_ep{nn:02d}"
    trava = trava_segredo(ep["roteiro_md"])
    print("trava do segredo:", "passou" if trava["passou"] else "BARROU", f"({trava['receitas']} receitas, {trava['trechos_comuns']} com trecho em comum, termos: {trava['termos_proibidos']})")
    if not trava["passou"]:
        raise SystemExit("o roteiro tem trecho de receita ou termo proibido: corrija antes de subir")

    narr = []
    for f in sorted(os.listdir(f"{pasta}/narracao")):
        if f.endswith(".json"):
            j = json.load(open(f"{pasta}/narracao/{f}", encoding="utf-8"))
            narr.append({"bloco": f[6:-5], "caracteres": len(j["texto"]),
                         "duracao_s": round(j["alinhamento"]["character_end_times_seconds"][-1], 1)})
    voz = g._db("GET", "/rest/v1/configuracoes?chave=eq.voz_bastidores&select=valor", schema="pulso_core")
    voz = json.loads(voz[0]["valor"]) if voz else {}

    montagem = f"{pasta}/EP{nn:02d}_montagem.mp4"
    lt = json.load(open(f"{pasta}/linha_do_tempo.json", encoding="utf-8"))
    base = f"episodios/{codigo}"
    tmp = tempfile.mkdtemp(dir="D:/tmp")
    # tudo online (dono, 05/11): o FINAL em 1080p sobe para a nuvem, para publicar do celular. Telas
    # quase paradas comprimem muito (stillimage): o E01 de 7 min ficou com 24 MB, abaixo dos 50 MB.
    previa = os.path.join(tmp, "final.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", montagem, "-c:v", "libx264", "-preset", "slow", "-crf", "26",
                    "-tune", "stillimage", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", previa], check=True)
    mb = os.path.getsize(previa) / 1e6
    if mb > 49:
        raise SystemExit(f"final com {mb:.0f} MB passa do limite de 50 MB do armazenamento")
    sobe(previa, f"{base}/final_1080p.mp4", "video/mp4")
    sobe(montagem[:-4] + ".srt", f"{base}/legenda.srt", "application/x-subrip")
    capa = f"{pasta}/capa.jpg"
    if os.path.exists(capa):
        sobe(capa, f"{base}/capa.jpg", "image/jpeg")
    os.remove(previa); os.rmdir(tmp)

    cortes_json = f"{pasta}/cortes/cortes.json"
    cortes = json.load(open(cortes_json, encoding="utf-8")) if os.path.exists(cortes_json) else []
    for c in cortes:
        caminho = sobe(f"{pasta}/cortes/{c['arquivo']}", f"{base}/cortes/{c['arquivo']}", "video/mp4")
        linha = {"episodio_id": ep["id"], "numero": c["numero"], "titulo": c["titulo"], "gancho": c.get("gancho", ""),
                 "inicio_s": round(c["ini"], 2), "fim_s": round(c["fim"], 2), "duracao_s": c["duracao"], "video": caminho}
        if not g._db("PATCH", f"/rest/v1/episodio_cortes?episodio_id=eq.{ep['id']}&numero=eq.{c['numero']}", linha, schema="pulso_content"):
            g._db("POST", "/rest/v1/episodio_cortes", linha, schema="pulso_content")
        print(f"corte {c['numero']} subiu")

    meta = dict(ep.get("metadata") or {})
    anterior = meta.get("montagem", {})
    meta.update({
        "fontes": fontes(ep["roteiro_md"]),
        "trava": {k: v for k, v in trava.items() if k != "detalhe"},
        "narracao": {"blocos": narr, "total_s": round(sum(b["duracao_s"] for b in narr), 1), "caracteres": sum(b["caracteres"] for b in narr),
                     "voz": voz.get("nome"), "voz_aprovada_em": voz.get("aprovadaEm")},
        "montagem": {"versao": int(anterior.get("versao", 0)) + 1, "duracao_s": round(duracao(montagem), 1),
                     "video": f"{base}/final_1080p.mp4", "capa": f"{base}/capa.jpg" if os.path.exists(f"{pasta}/capa.jpg") else None, "legenda": f"{base}/legenda.srt", "arquivo_local": os.path.basename(montagem),
                     "em": __import__("datetime").datetime.now().isoformat(timespec="minutes"), "final_mb": round(mb, 1),
                     "blocos": lt.get("blocos", [])},
    })
    meta.setdefault("publicacao", {"canal": None, "url": None, "data": None})
    meta["textos"] = textos(pasta, ep["roteiro_md"], lt, cortes)
    novo_status = ep["status"] if ep["status"] in ("em_revisao", "publicado") else "em_revisao"
    g._db("PATCH", f"/rest/v1/episodios?id=eq.{ep['id']}", {"metadata": meta, "status": novo_status, "video_url": f"{base}/final_1080p.mp4"}, schema="pulso_content")
    print(f"ficha gravada · status {novo_status} · montagem v{meta['montagem']['versao']} · {len(cortes)} cortes")


if __name__ == "__main__":
    fechar(sys.argv[1])
