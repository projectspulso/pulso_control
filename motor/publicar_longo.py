"""
Publica o episódio completo no YouTube PULSO Histórias JÁ AGENDADO (dono, 13/11/2026: "publicar automático
no YouTube, já com a thumb e todas as descrições"). Roda na máquina, como o montador: o arquivo é grande
demais para o servidor do app.

O que sobe: vídeo (privado, com publishAt), título, descrição com capítulos, tags, idioma pt-BR, categoria,
"conteúdo alterado ou sintético" declarado (voz clonada por IA), capa (thumbnail), legenda .srt e a playlist
da série. Tela final e cards a API não faz: o dono importa em 1 clique no Studio antes da hora.

A publicação do longo continua do dono (R-011): o app sobe e agenda, ele confere no Studio e pode cancelar.

Uso:
  python motor/publicar_longo.py T01E02 --quando "2026-11-19 18:00"            # ensaio: mostra o que faria
  python motor/publicar_longo.py T01E02 --quando "2026-11-19 18:00" --enviar   # sobe e agenda de verdade
"""
import argparse, datetime as dt, json, os, sys, urllib.parse, urllib.request

sys.path.insert(0, os.path.dirname(__file__))
import pulso_guard as g  # noqa: E402

BUCKET = "bastidores"
PLAYLIST = "Bastidores do PULSO"
BRT = dt.timezone(dt.timedelta(hours=-3))


def env():
    e = {}
    for line in open(r"D:/projetos/pulso_control/.env", encoding="utf-8", errors="ignore"):
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            e.setdefault(k.strip(), v.strip().strip('"'))
    return e


def token():
    """Acesso do canal principal (config youtube_oauth), renovado com o cliente do .env."""
    cfg = g._db("GET", "/rest/v1/configuracoes?chave=eq.youtube_oauth&select=valor", schema="pulso_core")
    oauth = json.loads(cfg[0]["valor"])
    if "yt-analytics" not in oauth.get("scope", "") and "youtube" not in oauth.get("scope", ""):
        raise SystemExit("o acesso do canal não tem o escopo do YouTube")
    e = env()
    d = urllib.parse.urlencode({"client_id": e["YOUTUBE_CLIENT_ID"], "client_secret": e["YOUTUBE_CLIENT_SECRET"],
                                "refresh_token": oauth["refresh_token"], "grant_type": "refresh_token"}).encode()
    return json.loads(urllib.request.urlopen("https://oauth2.googleapis.com/token", d).read())["access_token"]


def api(tk, metodo, url, corpo=None, tipo="application/json", cabecalhos=None):
    dados = corpo if isinstance(corpo, (bytes, bytearray)) or corpo is None else json.dumps(corpo).encode()
    h = {"Authorization": f"Bearer {tk}", "Content-Type": tipo, **(cabecalhos or {})}
    req = urllib.request.Request(url, data=dados, method=metodo, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=900) as r:
            t = r.read().decode()
            return (json.loads(t) if t else {}), r.headers
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{metodo} {url.split('?')[0]}: {e.code} {e.read().decode()[:300]}")


def baixa(caminho, destino):
    U, K = g._env()
    req = urllib.request.Request(f"{U}/storage/v1/object/{BUCKET}/{caminho}", headers={"apikey": K, "Authorization": f"Bearer {K}"})
    with urllib.request.urlopen(req, timeout=900) as r, open(destino, "wb") as f:
        while True:
            b = r.read(1 << 20)
            if not b: break
            f.write(b)
    return destino


def arquivo(m, chave_local, chave_nuvem, tmp, nome):
    local = m.get(chave_local)
    if local and os.path.exists(local): return local
    if not m.get(chave_nuvem): return None
    return baixa(m[chave_nuvem], os.path.join(tmp, nome))


def main():
    a = argparse.ArgumentParser()
    a.add_argument("codigo")
    a.add_argument("--quando", required=True, help='hora da estreia em Brasília, "AAAA-MM-DD HH:MM"')
    a.add_argument("--enviar", action="store_true")
    o = a.parse_args()

    estreia = dt.datetime.strptime(o.quando, "%Y-%m-%d %H:%M").replace(tzinfo=BRT)
    if estreia < dt.datetime.now(BRT) + dt.timedelta(hours=1):
        raise SystemExit("a estreia precisa estar pelo menos 1 h no futuro")

    ep = g._db("GET", f"/rest/v1/episodios?codigo=eq.{o.codigo}&select=id,codigo,status,metadata", schema="pulso_content")
    if not ep: raise SystemExit(f"{o.codigo} não existe")
    ep = ep[0]
    md = ep.get("metadata") or {}
    pub = md.get("publicacao") or {}
    if pub.get("post_id"): raise SystemExit(f"{o.codigo} já está no YouTube ({pub.get('url')}): nada a fazer")
    if not (md.get("trava") or {}).get("passou", True): raise SystemExit("a trava do segredo barrou o roteiro")
    m = md.get("montagem") or {}
    yt = (md.get("textos") or {}).get("youtube") or {}
    falta = [k for k, v in {"vídeo montado": m.get("video") or m.get("arquivo_local"), "capa": m.get("capa"),
                            "título": yt.get("titulo"), "descrição": yt.get("descricao")}.items() if not v]
    if falta: raise SystemExit(f"{o.codigo} ainda não está pronto: falta {', '.join(falta)} (rode a ficha do episódio)")

    titulo = yt["titulo"][:100]
    meta = {
        "snippet": {"title": titulo, "description": yt["descricao"][:4900], "tags": yt.get("tags", [])[:30],
                    "categoryId": "28", "defaultLanguage": "pt-BR", "defaultAudioLanguage": "pt-BR"},
        "status": {"privacyStatus": "private", "publishAt": estreia.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                   "selfDeclaredMadeForKids": False, "containsSyntheticMedia": True, "embeddable": True},
    }
    print(f"{o.codigo} · {titulo}")
    print(f"estreia: {estreia:%d/%m/%Y %H:%M} (Brasília) · sobe privado e entra no ar sozinho")
    print(f"capa: {m['capa']} · legenda: {m.get('legenda') or 'sem'} · tags: {len(meta['snippet']['tags'])} · playlist: {PLAYLIST}")
    if not o.enviar:
        print("ensaio: nada foi enviado. Rode de novo com --enviar.")
        return

    tmp = os.path.join("D:/tmp", f"publicar_{o.codigo}")
    os.makedirs(tmp, exist_ok=True)
    video = arquivo(m, "arquivo_local", "video", tmp, "final.mp4")
    capa = arquivo(m, "_", "capa", tmp, "capa.jpg")
    srt = arquivo(m, "_", "legenda", tmp, "legenda.srt") if m.get("legenda") else None
    tk = token()

    # 1) vídeo por upload retomável (o arquivo pode passar de 100 MB)
    tam = os.path.getsize(video)
    _, h = api(tk, "POST", "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
               meta, "application/json; charset=UTF-8", {"X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": str(tam)})
    with open(video, "rb") as f:
        v, _ = api(tk, "PUT", h["Location"], f.read(), "video/mp4")
    vid = v["id"]
    print("vídeo enviado:", vid)

    # 2) capa, 3) legenda, 4) playlist: falha em qualquer um não derruba o vídeo já agendado
    avisos = []
    try:
        api(tk, "POST", f"https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={vid}", open(capa, "rb").read(), "image/jpeg")
        print("capa: ok")
    except SystemExit as e:
        avisos.append(f"capa não entrou ({e}); suba no Studio")
    if srt:
        try:
            limite = "----pulsolongo"
            corpo = (f"--{limite}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"
                     + json.dumps({"snippet": {"videoId": vid, "language": "pt-BR", "name": "Português"}})
                     + f"\r\n--{limite}\r\nContent-Type: application/octet-stream\r\n\r\n").encode() + open(srt, "rb").read() + f"\r\n--{limite}--\r\n".encode()
            api(tk, "POST", "https://www.googleapis.com/upload/youtube/v3/captions?uploadType=multipart&part=snippet", corpo, f"multipart/related; boundary={limite}")
            print("legenda: ok")
        except SystemExit as e:
            avisos.append(f"legenda não entrou ({e})")
    try:
        lista, _ = api(tk, "GET", "https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50")
        pl = next((p["id"] for p in lista.get("items", []) if p["snippet"]["title"] == PLAYLIST), None)
        if not pl:
            nova, _ = api(tk, "POST", "https://www.googleapis.com/youtube/v3/playlists?part=snippet,status",
                          {"snippet": {"title": PLAYLIST, "description": "A série que mostra por dentro como o PULSO é feito: números, erros e consertos.",
                                       "defaultLanguage": "pt-BR"}, "status": {"privacyStatus": "public"}})
            pl = nova["id"]
        api(tk, "POST", "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
            {"snippet": {"playlistId": pl, "resourceId": {"kind": "youtube#video", "videoId": vid}}})
        print("playlist: ok")
    except SystemExit as e:
        avisos.append(f"playlist não entrou ({e})")

    md["publicacao"] = {**pub, "estado": "agendado", "post_id": vid, "url": f"https://youtube.com/watch?v={vid}",
                        "canal": "principal", "agendado_para": estreia.isoformat(), "subido_em": dt.datetime.now(BRT).isoformat(),
                        "fonte": "motor/publicar_longo.py", "avisos": avisos,
                        "falta_no_studio": "tela final e cards (a API não faz)"}
    # pronto_publicacao + estado agendado: a coleta diária vira para publicado depois da hora da estreia
    g._db("PATCH", f"/rest/v1/episodios?id=eq.{ep['id']}", {"metadata": md, "status": "pronto_publicacao"}, schema="pulso_content")
    print(f"AGENDADO: https://studio.youtube.com/video/{vid}/edit · entra no ar {estreia:%d/%m %H:%M}")
    for x in avisos: print("aviso:", x)


if __name__ == "__main__":
    main()
