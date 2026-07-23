# -*- coding: utf-8 -*-
"""
PULSO GUARD — trava de orçamento da produção (responsabilidade: Claude, exigida pelo dono em 12/06).

REGRA DURA: todo orquestrador de geração DEVE chamar autorizar(creditos_do_lote) ANTES de
submeter jobs ao Higgsfield, e registrar_gasto() DEPOIS. Se autorizar() retornar False,
o lote NÃO RODA — só com override explícito do dono (autorizar(..., override="<frase do dono>")).

Travas vivas em pulso_core.configuracoes chave=orcamento_travas (editáveis sem código).
Uso CLI:  python D:/tmp/pulso_guard.py status
"""
import json, re, subprocess, sys, time, urllib.error, urllib.request
from datetime import datetime, timezone

HF = r"C:/Users/junio/AppData/Roaming/npm/higgsfield.cmd"

def _env():
    env = {}
    for line in open(r"D:/projetos/pulso_control/.env", encoding="utf-8", errors="ignore"):
        m = re.match(r'^([A-Za-z0-9_]+)\s*=\s*"?([^"\r\n]*)"?', line)
        if m and m.group(1) not in env: env[m.group(1)] = m.group(2)
    return env["SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"]

def _db(method, path, body=None, schema="pulso_content", tent=3):
    U, K = _env()
    for i in range(tent):
        r = urllib.request.Request(U + path, method=method,
            data=json.dumps(body).encode() if body is not None else None,
            headers={"apikey": K, "Authorization": "Bearer " + K, "Content-Type": "application/json",
                     "Prefer": "return=representation", "Content-Profile": schema, "Accept-Profile": schema})
        try:
            with urllib.request.urlopen(r) as resp:
                t = resp.read().decode(); return json.loads(t) if t else None
        except urllib.error.HTTPError:
            if i == tent - 1: raise
            time.sleep(3)

def travas():
    rows = _db("GET", "/rest/v1/configuracoes?chave=eq.orcamento_travas&select=valor", schema="pulso_core")
    return json.loads(rows[0]["valor"]) if rows else {}

def saldo_higgsfield():
    out = subprocess.run([HF, "account", "status"], capture_output=True, text=True, timeout=60).stdout
    m = re.search(r"([\d.]+)\s*credits", out)
    cr = float(m.group(1)) if m else None
    if cr is not None:
        _db("PATCH", "/rest/v1/configuracoes?chave=eq.higgsfield_saldo",
            {"valor": json.dumps({"creditos": cr, "plano": "plus",
                                  "snapshot_em": datetime.now(timezone.utc).isoformat()})}, schema="pulso_core")
    return cr

def gasto_higgsfield_hoje():
    hoje = datetime.now(timezone.utc).date().isoformat()
    rows = _db("GET", "/rest/v1/logs_workflows?workflow_name=eq.GASTO_SERVICO&select=detalhes") or []
    return sum((r["detalhes"].get("creditos") or 0) for r in rows
               if r["detalhes"].get("servico") == "higgsfield" and r["detalhes"].get("data") == hoje)

def autorizar(creditos_lote, override=None):
    t = travas()
    teto = t.get("teto_creditos_higgsfield_dia", 600)
    gasto = gasto_higgsfield_hoje()
    saldo = saldo_higgsfield()
    print(f"[GUARD] teto/dia={teto}cr | gasto hoje={gasto}cr | lote pedido={creditos_lote}cr | saldo={saldo}cr")
    if override:
        print(f"[GUARD] OVERRIDE do dono: \"{override}\" — liberado.")
        return True
    if gasto + creditos_lote > teto:
        print(f"[GUARD] *** BLOQUEADO *** {gasto}+{creditos_lote} > teto {teto}. "
              f"Reduza o lote (menos cenas/modelo mais barato/banco de clips) ou peça override ao dono.")
        return False
    if saldo is not None and creditos_lote > saldo:
        print(f"[GUARD] *** BLOQUEADO *** lote ({creditos_lote}cr) maior que o saldo ({saldo}cr).")
        return False
    print("[GUARD] autorizado.")
    return True

def registrar_gasto(servico, creditos, brl, descricao):
    _db("POST", "/rest/v1/logs_workflows", {
        "workflow_name": "GASTO_SERVICO", "status": "sucesso",
        "detalhes": {"servico": servico, "creditos": creditos, "brl": brl, "descricao": descricao,
                     "data": datetime.now(timezone.utc).date().isoformat()},
    })
    if servico == "higgsfield":
        saldo_higgsfield()  # atualiza snapshot pro app
    print(f"[GUARD] gasto registrado: {servico} {creditos or '-'}cr R${brl}")

def clips_disponiveis(tema=None):
    """Consulta o banco de clips antes de gerar — reuso é de graça."""
    q = "/rest/v1/videos?tipo=eq.CLIP_CENA&select=id,metadata"
    rows = _db("GET", q) or []
    if tema:
        rows = [r for r in rows if tema.lower() in (r["metadata"].get("tema", "") + " " + r["metadata"].get("prompt", "")).lower()]
    return rows

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status":
        t = travas()
        print("TRAVAS:", json.dumps(t, ensure_ascii=False, indent=2))
        print("GASTO HIGGSFIELD HOJE:", gasto_higgsfield_hoje(), "cr")
        print("SALDO:", saldo_higgsfield(), "cr")
        print("CLIPS NO BANCO:", len(clips_disponiveis()))
    elif cmd == "clips":
        for c in clips_disponiveis(sys.argv[2] if len(sys.argv) > 2 else None):
            md = c["metadata"]
            print(f"  lote{md['lote']} {md['slug']}/{md['cena']} | {md['tema']} | {md['prompt'][:60]}")
