# -*- coding: utf-8 -*-
"""
GRAVA AS MÉTRICAS DO KWAI lidas dos prints — o ÚNICO caminho da rotina das 21h.

Por quê (13/10/2026): a cada noite a rotina escrevia um script novo "de cabeça". Em 12/10 inventou
endereço e chave de um Supabase que não existe, concluiu que "a URL mudou" e não gravou nada. Agora o
agente só LÊ os prints e preenche um JSON; tudo o que é banco, casamento card→ideia e trava mora aqui.

Entrada (JSON):
  {"lido_em": "2026-10-12",          # dia do print (BRT); padrão = hoje
   "seguidores": 517,                # do topo do perfil; opcional
   "cards": [{"legenda": "Em 1998, em São Paulo...", "views": 1060, "likes": 40, "comentarios": 2,
              "shares": 12, "post_em": "2026/10/11 22:05", "duracao": "01:15", "rotulo": "EM 1998"}]}

Uso:
  python kwai_gravar.py leitura.json            # SIMULA: mostra o casamento e o que gravaria
  python kwai_gravar.py leitura.json --grava    # grava só o que casou sem dúvida

Travas (decisões do dono, não reabrir):
  A  nunca cria ideia — só grava em ideia que já existe no banco
  B  card já conhecido (mesmo post_em + duração gravados antes) volta para a MESMA ideia; linhas que
     somam 2 cards (metadata.kwai_posts ≥ 2: e2e40d58, 1a9201d0) somam de novo
  C  rede: timeout + repetição em qualquer erro, 6 em paralelo
  D  print MENOR que o banco = card duplicado ou casamento errado → não grava aquela ideia, avisa
  E  dois cards na mesma ideia sem carimbo de soma → ambíguo, não grava, pergunta ao dono
Credenciais: SEMPRE do .env do pulso_control via pulso_guard. Nunca escreva URL ou chave à mão.
"""
import re, sys, json, socket, time, datetime as dt, unicodedata
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor

socket.setdefaulttimeout(25)
sys.path.insert(0, "D:/tmp")
import pulso_guard as g

BRT = dt.timezone(dt.timedelta(hours=-3))

def db(method, path, body=None, schema="pulso_content", tent=4):
    for i in range(tent):
        try:
            return g._db(method, path, body, schema=schema, tent=1)
        except Exception:
            if i == tent - 1: raise
            time.sleep(2 + i)

def norm(s):
    s = "".join(c for c in unicodedata.normalize("NFKD", s or "") if not unicodedata.combining(c)).lower()
    return " ".join(re.findall(r"[a-z0-9]+", s))

def norm_post(s):
    return re.sub(r"[-/]", "/", (s or "").strip())[:16]

def validar(d):
    erros = []
    if not isinstance(d.get("cards"), list) or not d["cards"]:
        erros.append("faltou a lista 'cards'")
    for i, c in enumerate(d.get("cards") or []):
        for k in ("views", "likes", "comentarios", "shares"):
            if not isinstance(c.get(k), int) or c[k] < 0: erros.append(f"card {i+1}: '{k}' tem que ser número inteiro ≥ 0")
        if not re.fullmatch(r"\d{4}[/-]\d{2}[/-]\d{2} \d{2}:\d{2}", str(c.get("post_em", ""))):
            erros.append(f"card {i+1}: 'post_em' no formato AAAA/MM/DD HH:MM (veio {c.get('post_em')!r})")
        if not re.fullmatch(r"\d{2}:\d{2}", str(c.get("duracao", ""))):
            erros.append(f"card {i+1}: 'duracao' no formato MM:SS (veio {c.get('duracao')!r})")
        if not (c.get("legenda") or "").strip(): erros.append(f"card {i+1}: sem 'legenda'")
    if "seguidores" in d and (not isinstance(d["seguidores"], int) or d["seguidores"] <= 0):
        erros.append("'seguidores' tem que ser número inteiro > 0")
    return erros

def casar(cards, pipe, linhas):
    caps = []  # (ideia_id, caption normalizada, numero)
    for p in pipe:
        md = p.get("metadata") or {}
        caps.append((p["ideia_id"], norm(md.get("caption") or ""), md.get("numero")))
    conhecidos = {}  # (post_em, duracao) -> ideia_id, do que já foi gravado antes
    for l in linhas:
        md = l.get("metadata") or {}
        for c in (md.get("kwai_cards") or []):
            conhecidos[(norm_post(c.get("post_em")), c.get("duracao"))] = l["ideia_id"]
        if md.get("kwai_post_em"):
            conhecidos.setdefault((norm_post(md["kwai_post_em"]), md.get("kwai_duracao")), l["ideia_id"])
    out = []
    for c in cards:
        chave = (norm_post(c["post_em"]), c["duracao"])
        if chave in conhecidos:
            out.append((c, conhecidos[chave], "já conhecido")); continue
        leg = norm(c["legenda"])
        pref = {i for i, cap, _ in caps if cap and len(leg) >= 15 and cap.startswith(leg)}
        if len(pref) == 1:
            out.append((c, pref.pop(), "prefixo da legenda")); continue
        pal = set(leg.split())
        notas = sorted(((len(pal & set(cap.split())) / len(pal) if pal else 0, i) for i, cap, _ in caps if cap), reverse=True)
        if notas and notas[0][0] >= 0.85 and (len(notas) == 1 or notas[0][0] - notas[1][0] >= 0.10):
            out.append((c, notas[0][1], f"palavras {notas[0][0]:.2f}")); continue
        m = re.search(r"#pulso(\d+)", c["legenda"].lower())
        if m:
            achou = [i for i, _, n in caps if str(n) == str(int(m.group(1)))]
            if len(achou) == 1:
                out.append((c, achou[0], "#pulso" + m.group(1))); continue
        out.append((c, None, "SEM CASAMENTO" + (f" (empate: {len(pref)} legendas)" if len(pref) > 1 else "")))
    return out

def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(2)
    grava = "--grava" in sys.argv
    d = json.load(open(sys.argv[1], encoding="utf-8"))
    erros = validar(d)
    if erros:
        print("ENTRADA INVÁLIDA — corrija o JSON (nada foi gravado):"); [print(" -", e) for e in erros]; sys.exit(2)
    agora = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    lido_em = d.get("lido_em") or dt.datetime.now(BRT).date().isoformat()

    pipe = db("GET", "/rest/v1/pipeline_producao?select=ideia_id,metadata&limit=2000") or []
    ideias = {i["id"]: i["titulo"] for i in (db("GET", "/rest/v1/ideias?select=id,titulo&limit=5000") or [])}
    linhas = db("GET", "/rest/v1/metricas_publicacao?plataforma=eq.kwai&select=id,ideia_id,views,metadata&limit=2000") or []
    linha_de = {l["ideia_id"]: l for l in linhas}

    casados = casar(d["cards"], pipe, linhas)
    por_ideia = defaultdict(list)
    sem = []
    for c, iid, como in casados:
        if iid and iid in ideias: por_ideia[iid].append((c, como))
        else: sem.append((c, como))

    plano, avisos = [], []
    for iid, itens in por_ideia.items():
        linha = linha_de.get(iid)
        soma_ok = ((linha or {}).get("metadata") or {}).get("kwai_posts", 1) >= 2
        if len(itens) > 1 and not soma_ok:
            avisos.append(f"AMBÍGUO (trava E): {len(itens)} cards caíram em '{ideias[iid][:50]}' — não gravei; pergunte ao dono")
            continue
        cards = sorted((c for c, _ in itens), key=lambda c: norm_post(c["post_em"]))
        v = sum(c["views"] for c in cards)
        if linha and (linha.get("views") or 0) > v:
            avisos.append(f"MENOR QUE O BANCO (trava D): '{ideias[iid][:50]}' print {v} < banco {linha['views']} — não gravei")
            continue
        plano.append((iid, cards, linha, " + ".join(sorted({como for _, como in itens}))))

    print(f"Kwai · print de {lido_em} · {len(d['cards'])} cards · {len(plano)} a gravar · {len(sem)} sem casamento · {len(avisos)} avisos\n")
    print(f"{'vídeo':52} {'views':>6} {'♡':>5} {'💬':>4} {'↗':>5}  casou por")
    for iid, cards, linha, como in sorted(plano, key=lambda x: -sum(c['views'] for c in x[1])):
        print(f"{ideias[iid][:52]:52} {sum(c['views'] for c in cards):>6} {sum(c['likes'] for c in cards):>5} "
              f"{sum(c['comentarios'] for c in cards):>4} {sum(c['shares'] for c in cards):>5}  {como}{'' if linha else ' (linha nova)'}")
    for c, como in sem:
        print(f"\n✗ {como}: \"{c['legenda'][:70]}\" ({c['post_em']}, {c['duracao']}, {c['views']} views) — NÃO crie ideia; pergunte ao dono")
    for a in avisos: print("\n⚠", a)

    if not grava:
        print("\nSIMULAÇÃO — nada gravado. Confira e rode de novo com --grava."); sys.exit(1 if (sem or avisos) else 0)

    def gravar(item):
        iid, cards, linha, _ = item
        p0 = cards[0]
        quando = dt.datetime.strptime(norm_post(p0["post_em"]), "%Y/%m/%d %H:%M")
        md = dict((linha or {}).get("metadata") or {})
        md.update({"kwai_post_em": norm_post(p0["post_em"]), "kwai_duracao": p0["duracao"], "kwai_rotulo": p0.get("rotulo") or md.get("kwai_rotulo")})
        if len(cards) > 1:
            md["kwai_posts"] = len(cards)
            md["kwai_cards"] = [{"views": c["views"], "likes": c["likes"], "comentarios": c["comentarios"], "shares": c["shares"],
                                 "duracao": c["duracao"], "rotulo": c.get("rotulo"), "post_em": norm_post(c["post_em"])} for c in cards]
        tot = {k: sum(c[k] for c in cards) for k in ("views", "likes", "comentarios", "shares")}
        corpo = {**tot, "ultima_atualizacao": agora, "data_publicacao": quando.date().isoformat() + "T00:00:00+00:00",
                 "hora_publicacao": quando.strftime("%H:%M:%S"), "dia_semana": quando.isoweekday(), "metadata": md}
        if linha: db("PATCH", f"/rest/v1/metricas_publicacao?id=eq.{linha['id']}", corpo)
        else: db("POST", "/rest/v1/metricas_publicacao", {**corpo, "ideia_id": iid, "plataforma": "kwai"})
        leit = {"views": tot["views"], "likes": tot["likes"], "comentarios": tot["comentarios"], "compartilhamentos": tot["shares"], "coletado_em": agora}
        ja = db("GET", f"/rest/v1/leituras_metricas?ideia_id=eq.{iid}&plataforma=eq.kwai&data_ref=eq.{lido_em}&select=id", schema="pulso_analytics") or []
        if ja: db("PATCH", f"/rest/v1/leituras_metricas?id=eq.{ja[0]['id']}", leit, schema="pulso_analytics")
        else: db("POST", "/rest/v1/leituras_metricas", {**leit, "ideia_id": iid, "plataforma": "kwai", "data_ref": lido_em}, schema="pulso_analytics")
        return iid

    with ThreadPoolExecutor(max_workers=6) as ex:
        feitos = list(ex.map(gravar, plano))

    if d.get("seguidores"):
        likes = sum(l2.get("likes") or 0 for l2 in (db("GET", "/rest/v1/metricas_publicacao?plataforma=eq.kwai&select=likes&limit=2000") or []))
        db("PATCH", "/rest/v1/configuracoes?chave=eq.kwai_perfil",
           {"valor": json.dumps({"seguidores": d["seguidores"], "curtidas": likes, "quando": agora})}, schema="pulso_core")
        h = db("GET", "/rest/v1/configuracoes?chave=eq.seguidores_historico&select=valor", schema="pulso_core")
        hist = json.loads(h[0]["valor"]) if h else None
        if hist and hist.get("historico"):
            hist["historico"][-1]["kwai"] = d["seguidores"]  # data do histórico é UTC: o ritual das 21h cai na entrada do dia seguinte
            db("PATCH", "/rest/v1/configuracoes?chave=eq.seguidores_historico", {"valor": json.dumps(hist)}, schema="pulso_core")
    print(f"\nGRAVADO: {len(feitos)} vídeos" + (f" · seguidores {d['seguidores']}" if d.get("seguidores") else "")
          + (f" · {len(sem)} sem casamento e {len(avisos)} avisos ficaram de fora" if (sem or avisos) else ""))

if __name__ == "__main__":
    main()
