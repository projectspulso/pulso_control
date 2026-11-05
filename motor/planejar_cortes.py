# -*- coding: utf-8 -*-
"""
AGENDA DOS CORTES — monta a semana de publicações de um episódio a partir da cadência de cada destino
(configuracoes.cortes_destinos) e grava em pulso_content.corte_publicacoes (084). Gera e sobe a
versão do vídeo de cada destino (cortes_longo --destino) para o bucket privado.

Regras (dono + digiai_mkt, 05/11/2026):
  · domingo nada sai; o mesmo corte não sai no mesmo dia em dois destinos;
  · Bastidores DIGIAI: trailer (o corte de gancho) na véspera da estreia, depois 1 corte por dia;
    cada corte em todas as redes do destino, mais story e status;
  · DIGIAI e pessoal: viram job para a fila do digiai_mkt (um publicador por conta); pessoal só com rosto
    real, então fica de fora enquanto o episódio usa o avatar;
  · enquanto as contas do Bastidores DIGIAI não existem, as linhas nascem 'aguarda_conta'.
Replanejar apaga só o que ainda não saiu (planejado/aguarda_conta) e refaz.

Uso: python D:/tmp/planejar_cortes.py T01E01 --estreia 2026-11-10 [--sem-video]
"""
import argparse, json, os, sys
from datetime import date, datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pulso_guard as g  # noqa: E402
import cortes_longo  # noqa: E402
import ficha_longo  # noqa: E402

ONEDRIVE = ficha_longo.ONEDRIVE


def proximo_dia_valido(d, dias_semana, ocupados):
    while d.isoweekday() == 7 or d.isoweekday() not in dias_semana or d in ocupados:
        d += timedelta(days=1)
    return d


def quando(d, hora):
    return f"{d.isoformat()}T{hora}:00-03:00"  # horário de Brasília


def legenda_de(textos_dest, textos_base, n):
    t = (textos_dest or {}).get(str(n))
    if t and t.get("aprovado_pela_trava"):
        return f"{t['legenda']}\n\n{' '.join(t['hashtags'])}".strip()
    return ((textos_base.get("cortes") or {}).get(str(n)) or {}).get("legenda", "")


def planejar(codigo, estreia, com_video=True):
    ep = g._db("GET", f"/rest/v1/episodios?codigo=eq.{codigo}&select=id,numero", schema="pulso_content")[0]
    nn = int(ep["numero"])
    pasta = f"{ONEDRIVE}/bastidores_ep{nn:02d}"
    cortes = g._db("GET", f"/rest/v1/episodio_cortes?episodio_id=eq.{ep['id']}&select=id,numero,titulo,tipo,status&order=numero", schema="pulso_content")
    cortes = [c for c in cortes if c["status"] != "descartado"]
    cfg = json.loads(g._db("GET", "/rest/v1/configuracoes?chave=eq.cortes_destinos&select=valor", schema="pulso_core")[0]["valor"])
    td_arq = f"{pasta}/cortes/textos_destinos.json"
    textos_dest = json.load(open(td_arq, encoding="utf-8")) if os.path.exists(td_arq) else {}
    tb_arq = f"{pasta}/textos.json"
    textos_base = json.load(open(tb_arq, encoding="utf-8")) if os.path.exists(tb_arq) else {}
    D = date.fromisoformat(estreia)

    ids = ",".join(c["id"] for c in cortes)
    g._db("DELETE", f"/rest/v1/corte_publicacoes?corte_id=in.({ids})&status=in.(planejado,aguarda_conta)", schema="pulso_content")

    dia_do_corte = {}  # (corte_id) -> datas já usadas por outro destino
    linhas = []
    for dest in cfg["destinos"]:
        if dest.get("so_rosto_real"):
            print(f"{dest['nome']}: fora desta agenda (só com rosto real; o E{nn:02d} usa o avatar)")
            continue
        elegiveis = [c for c in cortes if c.get("tipo") in dest["tipos"]]
        if not elegiveis:
            continue
        cad = dest["cadencia"]
        hora = cad.get("hora", "12:00")
        dias = cad.get("dias_semana", [1, 2, 3, 4, 5, 6])
        agenda = []  # (corte, data)
        if dest["publica"] == "pulso":
            ocupados = set()
            gancho = next((c for c in elegiveis if c["tipo"] == "gancho"), None)
            resto = [c for c in elegiveis if c is not gancho]
            if gancho and cad.get("trailer_vespera"):
                v = D - timedelta(days=1)
                while v.isoweekday() == 7:
                    v -= timedelta(days=1)
                agenda.append((gancho, v)); ocupados.add(v)
            d = D + timedelta(days=1)
            for c in resto:
                d = proximo_dia_valido(d, dias, ocupados)
                agenda.append((c, d)); ocupados.add(d)
                d += timedelta(days=1)
        else:
            por_semana = int(cad.get("por_semana", 1))
            d = D + timedelta(days=1)
            semana_uso = {}
            for c in elegiveis:
                while True:
                    d = proximo_dia_valido(d, dias, set())
                    semana = d.isocalendar()[1]
                    if semana_uso.get(semana, 0) < por_semana and d not in dia_do_corte.get(c["id"], set()):
                        break
                    d += timedelta(days=1)
                agenda.append((c, d)); semana_uso[semana] = semana_uso.get(semana, 0) + 1
                d += timedelta(days=1)

        video_por_corte = {}
        if com_video:
            feitos = cortes_longo.gerar(codigo, None, dest["id"])
            for f in feitos:
                local = f"{pasta}/cortes/{dest['id']}/{f['arquivo']}"
                video_por_corte[f["numero"]] = ficha_longo.sobe(local, f"episodios/{codigo}/cortes/{dest['id']}/{f['arquivo']}", "video/mp4")

        for c, dia in agenda:
            dia_do_corte.setdefault(c["id"], set()).add(dia)
            for rede, modo in dest["redes"].items():
                status = "planejado" if dest.get("contas_criadas") or modo == "job" else "aguarda_conta"
                linhas.append({"corte_id": c["id"], "destino": dest["id"], "rede": rede, "modo": modo,
                               "agendado_para": quando(dia, hora), "video": video_por_corte.get(c["numero"]),
                               "legenda": legenda_de(textos_dest.get(dest["id"]), textos_base, c["numero"]), "status": status})
            print(f"{dest['nome']:18s} {dia.strftime('%a %d/%m')} {hora}  corte {c['numero']} · {c['titulo']}")
    if linhas:
        g._db("POST", "/rest/v1/corte_publicacoes", linhas, schema="pulso_content")
    print(f"{len(linhas)} publicações planejadas")
    return linhas


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("codigo")
    ap.add_argument("--estreia", required=True, help="dia em que o episódio longo vai ao ar (AAAA-MM-DD)")
    ap.add_argument("--sem-video", action="store_true", help="só a agenda, sem gerar e subir as versões")
    a = ap.parse_args()
    planejar(a.codigo, a.estreia, not a.sem_video)
