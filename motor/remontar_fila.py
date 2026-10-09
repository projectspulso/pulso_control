# -*- coding: utf-8 -*-
"""
REMONTAR A FILA com o montador corrigido — sem gerar nada novo (mesmos clipes, mesma narração).

Por quê (09/10/2026): a cópia do make_video.py em uso era de 16/07 — CTA no lugar errado, volume a
−24 LUFS, legenda estourando. Os vídeos já PRONTOS na fila saíram assim. Este script remonta os
próximos da sequência, confere com o qc_peca.py e só então troca o arquivo:
  · sobe com NOME NOVO (`<slug>_<NNN>_v2.mp4`) — sobrescrever o mesmo caminho arrisca a rede baixar
    a versão antiga do cache do storage na hora de publicar;
  · atualiza metadata.video_url (+ remontado_em, video_url_antes) e a cópia FINAL_ do OneDrive;
  · regenera as artes de story a partir do vídeo novo.
Peça que reprova no QC NÃO é trocada (fica a versão antiga e o motivo no log).

Uso: python remontar_fila.py [N]   (padrão 7, a partir de hoje, pela data planejada)
"""
import os, re, sys, json, shutil, subprocess, datetime, urllib.request, urllib.error
sys.path.insert(0, "D:/tmp"); import pulso_guard as g

ENV = {}
for l in open(r"D:/projetos/pulso_control/.env", encoding="utf-8", errors="ignore"):
    m = re.match(r'^([A-Za-z0-9_]+)\s*=\s*"?([^"\r\n]*)"?', l)
    if m and m.group(1) not in ENV: ENV[m.group(1)] = m.group(2)
U = ENV["SUPABASE_URL"]; K = ENV["SUPABASE_SERVICE_ROLE_KEY"]
ONE = "D:/OneDrive - Óticas Taty Mello/Grupo Mello/Marketing_e_Vendas/digiai/pulso/videos"
QC = "D:/projetos/pulso_control/motor/qc_peca.py"
LIMITE_MB = 45

def log(*a): print("[remontar]", *a, flush=True)

def remontar(p):
    md = p["metadata"] or {}
    num = md.get("numero"); url = md.get("video_url", "")
    if md.get("remontado_em"):
        log(f"#{num} já remontado em {md['remontado_em']} — pula"); return
    fn = url.rsplit("/", 1)[-1]; slug = fn.rsplit("_", 1)[0]
    d = f"D:/tmp/pulso_lote4/{slug}"; final = f"{d}/FINAL_{slug}.mp4"
    if os.path.exists(final) and not os.path.exists(f"{d}/FINAL_{slug}_ANTES_09-10.mp4"):
        shutil.copy2(final, f"{d}/FINAL_{slug}_ANTES_09-10.mp4")
    r = subprocess.run(["python", "D:/tmp/make_video.py", slug], capture_output=True, text=True, timeout=3600)
    cta = re.search(r"CTA janela ([\d.]+)s->fim \(([\d.]+)s\)", r.stdout or "")
    if r.returncode != 0 or not os.path.exists(final):
        log(f"#{num} montagem FALHOU: {(r.stderr or r.stdout)[-300:]}"); return
    if os.path.getsize(final) / 1048576 > LIMITE_MB:
        web = final.replace(".mp4", "_web.mp4")
        subprocess.run(["ffmpeg", "-y", "-i", final, "-c:v", "libx264", "-crf", "24", "-maxrate", "4M", "-bufsize", "8M",
                        "-preset", "veryfast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", web], capture_output=True, timeout=900)
        final = web
    rot = g._db("GET", "/rest/v1/roteiros?id=eq.%s&select=conteudo_md" % p["roteiro_id"], schema="pulso_content")[0]["conteudo_md"]
    rp = f"{d}/roteiro_qc.txt"; open(rp, "w", encoding="utf-8").write(rot)
    q = json.loads(subprocess.run(["python", QC, final, "--roteiro", rp], capture_output=True, text=True, timeout=1200).stdout or "{}")
    if not q.get("aprovada"):
        log(f"#{num} QC REPROVOU — mantém a versão antiga: {q.get('erros')}"); return
    novo = f"{slug}_{int(num):03d}_v2.mp4"
    data = open(final, "rb").read()
    try:
        urllib.request.urlopen(urllib.request.Request(U + "/storage/v1/object/pulso-assets/videos/" + novo, data=data, method="POST",
            headers={"apikey": K, "Authorization": "Bearer " + K, "Content-Type": "video/mp4", "x-upsert": "true"}), timeout=300).read()
    except urllib.error.HTTPError as e:
        log(f"#{num} upload falhou ({e.code}): {e.read()[:200]}"); return
    pub = f"{U}/storage/v1/object/public/pulso-assets/videos/{novo}"
    atual = g._db("GET", "/rest/v1/pipeline_producao?id=eq.%s&select=metadata" % p["id"], schema="pulso_content")[0]["metadata"] or {}
    atual.update({"video_url_antes": url, "video_url": pub, "remontado_em": datetime.datetime.now().isoformat(timespec="seconds"),
                  "remontagem_qc": {"overlap": q["info"].get("overlap_roteiro"), "duracao": q["info"].get("duracao_video_s"),
                                    "cta_inicio_s": float(cta.group(1)) if cta else None}})
    atual.pop("stories", None)  # artes saem do vídeo novo
    g._db("PATCH", "/rest/v1/pipeline_producao?id=eq.%s" % p["id"], {"metadata": atual}, schema="pulso_content")
    dest = f"{ONE}/video_{int(num):03d}_{slug}"
    if os.path.isdir(dest): open(f"{dest}/FINAL_{slug}.mp4", "wb").write(data)
    subprocess.run(["python", "D:/tmp/gerar_stories.py", p["ideia_id"]], capture_output=True, timeout=900)
    log(f"#{num} OK — CTA {cta.group(1) if cta else '?'}s ({cta.group(2) if cta else '?'}s) · overlap {q['info'].get('overlap_roteiro')} · {os.path.getsize(final)//1048576} MB → {novo}")

def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 7
    hoje = datetime.date.today().isoformat()
    fila = g._db("GET", "/rest/v1/pipeline_producao?status=eq.PRONTO_PUBLICACAO&data_publicacao_planejada=gte.%s&select=id,ideia_id,roteiro_id,metadata,data_publicacao_planejada&order=data_publicacao_planejada.asc&limit=%d" % (hoje, n), schema="pulso_content") or []
    for p in fila:
        try: remontar(p)
        except Exception as e: log(f"#{(p.get('metadata') or {}).get('numero')} erro: {str(e)[:200]}")

if __name__ == "__main__":
    main()
