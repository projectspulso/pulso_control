# -*- coding: utf-8 -*-
"""
TEXTOS DOS CORTES POR DESTINO — título curto e legenda de cada corte, um jeito por destino
(Bastidores DIGIAI, DIGIAI, pessoal), escritos pela API do Claude (o "algo diferente" que o dono
liberou em 05/11/2026). Cada destino tem o seu tom em configuracoes.cortes_destinos.

Travas, porque legenda é conteúdo público (e o Pinterest copia a do Instagram):
  · o modelo só recebe o texto narrado do próprio corte e é proibido de trazer fato ou número de fora;
  · toda saída passa pela trava do segredo (receitas do Livro + termos proibidos) e pela checagem de
    número: número que não está no trecho reprova a legenda;
  · um destino só recebe os cortes dos tipos que aceita.

Saída: <pasta do episódio>/cortes/textos_destinos.json
Uso: python D:/tmp/textos_cortes.py T01E01
"""
import json, os, re, sys

import anthropic

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pulso_guard as g  # noqa: E402
import ficha_longo as ficha  # noqa: E402

ONEDRIVE = ficha.ONEDRIVE
MODELO = "claude-opus-5-5"

ESQUEMA = {
    "type": "object",
    "properties": {
        "titulo": {"type": "string", "description": "título curto do corte, até 60 caracteres"},
        "legenda": {"type": "string", "description": "legenda do post, 2 a 4 linhas curtas, termina chamando para o episódio completo"},
        "hashtags": {"type": "array", "items": {"type": "string"}, "description": "3 a 5 hashtags sem acento, com #"},
    },
    "required": ["titulo", "legenda", "hashtags"],
    "additionalProperties": False,
}

SISTEMA = """Você escreve o texto de posts de vídeos curtos em português do Brasil para a série Bastidores, em que o dono de uma empresa conta erros reais do próprio sistema e como consertou.

Regras que não se quebram:
- Use só fatos e números que estão no TRECHO NARRADO recebido. Não invente número, data, nome, ferramenta, resultado ou promessa.
- Não cite nome de ferramenta, fornecedor, modelo de IA nem detalhe técnico de como o sistema funciona por dentro.
- Português do Brasil natural, frases curtas. No máximo um emoji. Sem caixa alta inteira, sem "clique no link".
- A legenda termina chamando para o episódio completo no YouTube."""


def _cliente():
    for linha in open(r"D:/projetos/pulso_control/.env", encoding="utf-8", errors="ignore"):
        m = re.match(r'^ANTHROPIC_API_KEY\s*=\s*"?([^"\r\n]+)', linha)
        if m:
            return anthropic.Anthropic(api_key=m.group(1))
    return anthropic.Anthropic()


def trechos_dos_cortes(roteiro):
    """{numero: texto narrado entre '✂ CORTE n' e '✂ fim'}"""
    out, atual = {}, None
    for l in roteiro.split("## Para o dono")[0].splitlines():
        m = re.match(r"✂ \*\*CORTE (\d+)", l)
        if m:
            atual = int(m.group(1)); out[atual] = []
        elif l.strip() == "✂ fim":
            atual = None
        elif atual is not None and l.startswith("> "):
            out[atual].append(re.sub(r"\*\*", "", l[2:].strip()))
    return {k: " ".join(v) for k, v in out.items()}


def _numeros(t):
    return set(re.findall(r"\d[\d.,]*", t.replace(".", "")))


def escreve(cliente, titulo_ep, corte, trecho, destino):
    pedido = (f"Destino: {destino['nome']}. Tom: {destino['tom']}.\n"
              f"Episódio: {titulo_ep}.\nCorte {corte['numero']}: {corte['titulo']}.\n\n"
              f"TRECHO NARRADO (a única fonte permitida):\n{trecho}")
    r = cliente.beta.messages.create(
        model=MODELO, max_tokens=4000,
        betas=["server-side-fallback-2026-07-01"], fallbacks="default",
        output_config={"effort": "low", "format": {"type": "json_schema", "schema": ESQUEMA}},
        system=SISTEMA, messages=[{"role": "user", "content": pedido}],
    )
    if r.stop_reason == "refusal":
        raise RuntimeError(f"recusado no corte {corte['numero']} / {destino['id']}")
    texto = next(b.text for b in r.content if b.type == "text")
    return json.loads(texto)


def confere(saida, trecho, receitas_telhas):
    texto = f"{saida['titulo']}\n{saida['legenda']}"
    problemas = []
    fora = _numeros(texto) - _numeros(trecho)
    if fora:
        problemas.append(f"número fora do trecho: {sorted(fora)}")
    termos = [p for p in ficha.PROIBIDOS if p in texto.lower()]
    if termos:
        problemas.append(f"termo proibido: {termos}")
    if ficha._telhas(ficha._norm(texto)) & receitas_telhas:
        problemas.append("trecho igual a uma receita do livro")
    return problemas


def gerar(codigo):
    ep = g._db("GET", f"/rest/v1/episodios?codigo=eq.{codigo}&select=id,numero,titulo,roteiro_md", schema="pulso_content")[0]
    cortes = g._db("GET", f"/rest/v1/episodio_cortes?episodio_id=eq.{ep['id']}&select=numero,titulo,tipo&order=numero", schema="pulso_content")
    cfg = json.loads(g._db("GET", "/rest/v1/configuracoes?chave=eq.cortes_destinos&select=valor", schema="pulso_core")[0]["valor"])
    trechos = trechos_dos_cortes(ep["roteiro_md"])
    rec = g._db("GET", "/rest/v1/livro_problemas_receita?select=receita_md", schema="pulso_content")
    receitas = set().union(*[ficha._telhas(ficha._norm(r["receita_md"])) for r in rec])
    cliente = _cliente()
    pasta = f"{ONEDRIVE}/bastidores_ep{int(ep['numero']):02d}/cortes"
    resultado = {}
    for d in cfg["destinos"]:
        for c in cortes:
            if c.get("tipo") not in d["tipos"]:
                continue
            if d.get("so_rosto_real"):  # o avatar é rosto de IA: pessoal só com rosto real (regra do digiai_mkt)
                continue
            trecho = trechos.get(c["numero"], "")
            for tentativa in range(2):
                saida = escreve(cliente, ep["titulo"], c, trecho, d)
                problemas = confere(saida, trecho, receitas)
                if not problemas:
                    break
                print(f"  refazendo corte {c['numero']} / {d['id']}: {problemas}")
            saida["aprovado_pela_trava"] = not problemas
            saida["problemas"] = problemas
            resultado.setdefault(d["id"], {})[str(c["numero"])] = saida
            print(f"{d['id']:18s} corte {c['numero']}: {saida['titulo']}  {'OK' if not problemas else 'BARRADO'}")
    os.makedirs(pasta, exist_ok=True)
    json.dump(resultado, open(f"{pasta}/textos_destinos.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return resultado


if __name__ == "__main__":
    gerar(sys.argv[1])
