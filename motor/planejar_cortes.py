# -*- coding: utf-8 -*-
"""
AGENDA DAS PEÇAS DOS BASTIDORES (v2, dono 05/11/2026) — o Pulso é só fábrica; o digiai_mkt publica tudo.

Monta a semana de um episódio a partir da estreia do longo e grava cada peça em
pulso_content.corte_publicacoes (084/086), que o MKT lê pela view v_bastidores_pecas_prontas:
  · véspera: o corte de gancho como trailer, mais 2 stories
  · estreia (o longo no principal, 18h, quem sobe é o dono): o 1º corte à noite, apontando para o episódio
  · depois: 1 corte por dia + 2 stories, domingo nada (regra da casa)
  · toda peça aponta para o principal: cartão final do corte, 1ª linha da legenda e #BastidoresDIGIAI
Gera e sobe as versões do canal de cortes (cortes_longo --destino) e os stories (stories_longo), com
link assinado de 7 dias (renovado todo dia pela rota assinar-cortes). Grava a data da estreia na ficha
do longo. Replanejar apaga só o que ainda não saiu (planejado/aguarda_conta) e refaz.

Uso: python D:/tmp/planejar_cortes.py T01E01 --estreia 2026-11-12 [--sem-video]
"""
import argparse, json, os, sys
from datetime import date, datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pulso_guard as g  # noqa: E402
import cortes_longo  # noqa: E402
import ficha_longo  # noqa: E402
import stories_longo  # noqa: E402
import digiai_pecas  # noqa: E402

ONEDRIVE = ficha_longo.ONEDRIVE
HORA_ANTES, HORA_DEPOIS, HORA_NOITE_ESTREIA = "09:30", "18:30", "20:30"


def quando(d, hora):
    return f"{d.isoformat()}T{hora}:00-03:00"  # horário de Brasília


def proximo_util(d):
    while d.isoweekday() == 7:  # domingo nada sai
        d += timedelta(days=1)
    return d


def textos_da_peca(principal, dest, tdest, tbase, n):
    t = (tdest or {}).get(str(n)) or {}
    if t.get("aprovado_pela_trava"):
        titulo, corpo, tags = t["titulo"], t["legenda"], list(t.get("hashtags") or [])
    else:
        titulo = ""
        bruto = ((tbase.get("cortes") or {}).get(str(n)) or {}).get("legenda", "")
        linhas = bruto.split("\n")
        tags = [w for l in linhas for w in l.split() if w.startswith("#")]
        # a 1ª linha da legenda já aponta para o principal: frase "episódio completo" no corpo repetiria
        corpo = "\n".join(l for l in linhas if not l.strip().startswith("#") and "episódio completo" not in l.lower()).strip()
    fixa = dest.get("hashtag_fixa")
    if fixa and fixa not in tags:
        tags = [fixa] + tags
    legenda = f"Episódio completo: {principal['url']}\n\n{corpo}".strip()
    return titulo, legenda, tags


def planejar(codigo, estreia, com_video=True):
    ep = g._db("GET", f"/rest/v1/episodios?codigo=eq.{codigo}&select=id,numero,metadata", schema="pulso_content")[0]
    nn = int(ep["numero"])
    pasta = f"{ONEDRIVE}/bastidores_ep{nn:02d}"
    cortes = [c for c in g._db("GET", f"/rest/v1/episodio_cortes?episodio_id=eq.{ep['id']}&select=id,numero,titulo,tipo,status&order=numero", schema="pulso_content")
              if c["status"] != "descartado"]
    cfg = json.loads(g._db("GET", "/rest/v1/configuracoes?chave=eq.cortes_destinos&select=valor", schema="pulso_core")[0]["valor"])
    principal, dest = cfg["principal"], cfg["destinos"][0]
    td = f"{pasta}/cortes/textos_destinos.json"
    tdest = (json.load(open(td, encoding="utf-8")) if os.path.exists(td) else {}).get(dest["id"], {})
    tb = f"{pasta}/textos.json"
    tbase = json.load(open(tb, encoding="utf-8")) if os.path.exists(tb) else {}
    D = date.fromisoformat(estreia)

    ids = ",".join(c["id"] for c in cortes)
    g._db("DELETE", f"/rest/v1/corte_publicacoes?corte_id=in.({ids})&status=in.(planejado,aguarda_conta)", schema="pulso_content")

    elegiveis = [c for c in cortes if c.get("tipo") in dest["tipos"]]
    gancho = next((c for c in elegiveis if c["tipo"] == "gancho"), None)
    resto = [c for c in elegiveis if c is not gancho]
    agenda = []  # (corte, dia, hora do corte)
    if gancho:
        v = D - timedelta(days=1)
        while v.isoweekday() == 7:
            v -= timedelta(days=1)
        agenda.append((gancho, v, dest["cadencia"].get("hora", "12:00")))
    d = D
    for i, c in enumerate(resto):
        d = proximo_util(d)
        agenda.append((c, d, HORA_NOITE_ESTREIA if d == D else dest["cadencia"].get("hora", "12:00")))
        d += timedelta(days=1)

    video, story = {}, {}
    if com_video:
        for f in cortes_longo.gerar(codigo, None, dest["id"]):
            video[f["numero"]] = ficha_longo.sobe(f"{pasta}/cortes/{dest['id']}/{f['arquivo']}", f"episodios/{codigo}/cortes/{dest['id']}/{f['arquivo']}", "video/mp4")
        for n, s in stories_longo.gerar(codigo).items():
            story[n] = {"antes": ficha_longo.sobe(s["antes"], f"episodios/{codigo}/stories/story_{n}_antes.jpg", "image/jpeg"),
                        "depois": ficha_longo.sobe(s["depois"], f"episodios/{codigo}/stories/story_{n}_depois.mp4", "video/mp4")}

    expira = (datetime.now() + timedelta(days=7)).astimezone().isoformat()
    linhas = []
    for c, dia, hora_corte in agenda:
        n = c["numero"]
        titulo, legenda, tags = textos_da_peca(principal, dest, tdest, tbase, n)
        for rede in dest["redes"]:
            if rede.endswith("_antes"):
                tipo, hora, arq = "story", HORA_ANTES, (story.get(n) or {}).get("antes")
            elif rede.endswith("_depois"):
                tipo, arq = "story", (story.get(n) or {}).get("depois")
                hora = "21:30" if hora_corte == HORA_NOITE_ESTREIA else HORA_DEPOIS
            else:
                tipo, hora, arq = "corte", hora_corte, video.get(n)
            linhas.append({"corte_id": c["id"], "destino": dest["id"], "rede": rede, "modo": "job", "tipo": tipo,
                           "agendado_para": quando(dia, hora), "video": arq, "titulo": titulo, "legenda": legenda, "hashtags": tags,
                           "video_url_assinada": ficha_longo.assina(arq) if arq else None, "url_expira": expira if arq else None,
                           "status": "planejado"})
        print(f"{dia.strftime('%a %d/%m')} {hora_corte}  corte {n} · {c['titulo']}  (+2 stories)")
    # DIGIAI (dono 05/11): peças PRÓPRIAS, nunca o arquivo do canal de cortes, nunca no mesmo dia daquele corte
    dia_no_canal = {c["numero"]: dia for c, dia, _ in agenda}
    por_numero = {c["numero"]: c for c in cortes}
    for dd in cfg["destinos"][1:]:
        if dd["id"] != "digiai":
            continue
        pecas = digiai_pecas.gerar(codigo) if com_video else {}
        for pc in dd.get("pecas", []):
            gerado = pecas.get(pc["tipo"] if pc["tipo"] == "carrossel" else "video")
            if not gerado:
                continue
            n, arquivo = gerado
            dia = D + timedelta(days=1)
            while dia.isoweekday() == 7 or dia.isoweekday() not in pc["dias_semana"] or dia == dia_no_canal.get(n):
                dia += timedelta(days=1)
            if pc["tipo"] == "carrossel":
                caminhos = [ficha_longo.sobe(a, f"episodios/{codigo}/digiai/carrossel/{os.path.basename(a)}", "image/jpeg") for a in arquivo]
                capa_txt, _ = digiai_pecas.licoes_do_roteiro(g._db("GET", f"/rest/v1/episodios?id=eq.{ep['id']}&select=roteiro_md", schema="pulso_content")[0]["roteiro_md"], n)
                legenda = (f"{capa_txt}.\n\nO que um erro real ensinou ao construir uma empresa com IA, em {len(caminhos) - 2} lições."
                           f"\n\nEpisódio completo: {principal['url']}")
                linhas.append({"corte_id": por_numero[n]["id"], "destino": "digiai", "rede": pc["rede"], "modo": "job", "tipo": "carrossel",
                               "agendado_para": quando(dia, pc["hora"]), "arquivos": caminhos, "urls_assinadas": [ficha_longo.assina(c_) for c_ in caminhos],
                               "url_expira": expira, "titulo": capa_txt, "legenda": legenda,
                               "hashtags": [dd["hashtag_fixa"]] + dd.get("hashtags", []), "status": "planejado"})
            else:
                cam = ficha_longo.sobe(arquivo, f"episodios/{codigo}/digiai/{os.path.basename(arquivo)}", "video/mp4")
                titulo = por_numero[n]["titulo"]
                legenda = (f"{titulo}.\n\nUm trecho dos Bastidores DIGIAI sobre um erro real do nosso sistema e como ele foi consertado."
                           f"\n\nEpisódio completo: {principal['url']}")
                linhas.append({"corte_id": por_numero[n]["id"], "destino": "digiai", "rede": pc["rede"], "modo": "job", "tipo": "video",
                               "agendado_para": quando(dia, pc["hora"]), "video": cam, "video_url_assinada": ficha_longo.assina(cam),
                               "url_expira": expira, "titulo": titulo, "legenda": legenda,
                               "hashtags": [dd["hashtag_fixa"]] + dd.get("hashtags", []), "status": "planejado"})
            print(f"DIGIAI {pc['rede']:9s} {dia.strftime('%a %d/%m')} {pc['hora']}  {pc['tipo']} do corte {n}")

    if linhas:
        # o envio em lote exige as MESMAS chaves em todas as linhas (o carrossel tem arquivos[] e o corte não)
        padrao = {"arquivos": [], "urls_assinadas": [], "video": None, "video_url_assinada": None, "url_expira": None}
        chaves = set().union(*(l.keys() for l in linhas))
        linhas = [{k: l.get(k, padrao.get(k)) for k in chaves} for l in linhas]
        g._db("POST", "/rest/v1/corte_publicacoes", linhas, schema="pulso_content")

    # a ficha do longo entra na view quando o dono aprovar a montagem (pronto_publicacao); aqui vai a data
    meta = dict(ep.get("metadata") or {})
    pub = dict(meta.get("publicacao") or {})
    pub["data"] = quando(D, dest["cadencia"].get("estreia_hora", "18:00"))
    meta["publicacao"] = pub
    g._db("PATCH", f"/rest/v1/episodios?id=eq.{ep['id']}", {"metadata": meta}, schema="pulso_content")
    print(f"{len(linhas)} peças planejadas · estreia do longo {pub['data']}")
    return linhas


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("codigo")
    ap.add_argument("--estreia", required=True, help="dia em que o longo vai ao ar no principal (AAAA-MM-DD)")
    ap.add_argument("--sem-video", action="store_true", help="só a agenda, sem gerar e subir as versões")
    a = ap.parse_args()
    planejar(a.codigo, a.estreia, not a.sem_video)
