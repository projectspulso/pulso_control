# -*- coding: utf-8 -*-
"""
WORKER DE RENDER do PULSO — tira o Claude do loop de produção.

Fluxo (1 item por execução; uma tarefa agendada chama em loop):
  1. Pega o próximo AUDIO_GERADO vencedor da fila (mesma regra do painel /producao),
     ou um ideia_id passado por argumento.
  2. Lê metadata.cenas (gravado pela rota /api/automation/gerar-cenas — inteligência no app).
     Se faltar, tenta a rota de prod (x-webhook-secret) como fallback.
  3. TTS with-timestamps (voz PULSO) -> narracao + alignment (para spans + janela do CTA).
  4. Calcula dur (8s se audio/10>6, senão 6) + spans -> escreve scenes.json.
  5. gen_scenes.py (guard de orçamento) -> make_video.py (CTA embutida + trava de duração).
  6. QC COMPLETO (duração + transcrição batendo com roteiro + freeze + frames) -> só então
     upload + PRONTO_PUBLICACAO + legenda (cérebro) + OneDrive.

RESUMÍVEL: se já está PRONTO_PUBLICACAO com video_url, sai. Se o FINAL já existe, pula
render (não re-gasta Veo) e vai pro QC. Reusa narração/alignment se existirem.

Uso:
  python worker_render.py --next          # próximo da fila
  python worker_render.py <ideia_id>      # item específico
"""
import os, re, json, base64, shutil, subprocess, urllib.request, sys, datetime
sys.path.insert(0, "D:/tmp"); import pulso_guard as g

ENV = {}
for l in open(r"D:/projetos/pulso_control/.env", encoding="utf-8", errors="ignore"):
    m = re.match(r'^([A-Za-z0-9_]+)\s*=\s*"?([^"\r\n]*)"?', l)
    if m and m.group(1) not in ENV: ENV[m.group(1)] = m.group(2)
U = ENV["SUPABASE_URL"]; K = ENV["SUPABASE_SERVICE_ROLE_KEY"]
ELK = ENV["ELEVENLABS_API_KEY"]; VOICE = "GmzLAnPHSUkxG3P5yfca"
ONE = "D:/OneDrive - Óticas Taty Mello/Grupo Mello/Marketing_e_Vendas/digiai/pulso/videos"
TRILHA_SRC = "D:/tmp/pulso_lote4/copa_gol11s/trilha.mp3"
PROD = "https://pulsoprojects.vercel.app"

TIER1 = ['curiosidade','mistério','misterio','psicologia','estudos','produtividade','casos reais','bizarr']
TIER3 = ['do momento','momento','games','nostalgia']
def tier(nome):
    n = (nome or '').lower()
    if any(k in n for k in TIER1): return 1
    if any(k in n for k in TIER3): return 3
    return 2

def log(*a): print("[worker]", *a, flush=True)

HF_CLI = r"C:/Users/junio/AppData/Roaming/npm/higgsfield.cmd"
def atualizar_saldo_higgsfield():
    """Lê o saldo do Higgsfield (CLI) e grava em configuracoes pro app avisar
    ANTES de o render falhar por falta de crédito. Roda a cada invocação (3x/dia)."""
    try:
        out = subprocess.run([HF_CLI, "account", "status"], capture_output=True, text=True, timeout=60).stdout
        m = re.search(r"([\d.]+)\s*credits", out)
        plano = re.search(r"—\s*([a-z]+)\s*plan", out, re.I)
        if not m:
            return
        val = {"creditos": float(m.group(1)), "plano": (plano.group(1) if plano else None),
               "quando": datetime.datetime.now().isoformat(timespec="seconds")}
        existe = g._db('GET', '/rest/v1/configuracoes?chave=eq.higgsfield_saldo&select=chave', schema='pulso_core')
        if existe:
            g._db('PATCH', '/rest/v1/configuracoes?chave=eq.higgsfield_saldo', {"valor": val}, schema='pulso_core')
        else:
            g._db('POST', '/rest/v1/configuracoes', {"chave": "higgsfield_saldo", "valor": val}, schema='pulso_core')
        log("saldo Higgsfield: %.2f créditos" % val["creditos"])
    except Exception as e:
        log("aviso: não atualizou saldo Higgsfield (%s)" % str(e)[:60])

def set_render_status(p, estado, motivo=None):
    """Grava o estado do render no metadata pro APP mostrar por que o card está
    (ou não está) em EM_EDICAO. estados: renderizando | erro | aguardando_cenas."""
    md = dict(p.get('metadata') or {})
    prev = md.get('render_status') or {}
    md['render_status'] = {
        'estado': estado,
        'motivo': motivo,
        'quando': datetime.datetime.now().isoformat(timespec='seconds'),
        'tentativas': (prev.get('tentativas') or 0) + (1 if estado == 'renderizando' else 0),
    }
    g._db('PATCH', '/rest/v1/pipeline_producao?id=eq.%s' % p['id'], {'metadata': md}, schema='pulso_content')
    p['metadata'] = md

def proximo_da_fila(excluir=None):
    excluir = excluir or set()
    pipe = g._db('GET', '/rest/v1/pipeline_producao?select=id,ideia_id,roteiro_id,status,metadata', schema='pulso_content') or []
    pipe = [p for p in pipe if p.get('id') not in excluir]
    ideias = g._db('GET', '/rest/v1/ideias?select=id,titulo,canal_id', schema='pulso_content') or []
    canais = g._db('GET', '/rest/v1/canais?select=id,nome', schema='pulso_core') or []
    cn = {c['id']: (c.get('nome') or '').replace('PULSO ', '') for c in canais}
    cid = {i['id']: i.get('canal_id') for i in ideias}
    # GATE DE RENDER (passo caro/Veo): renderiza SÓ o que está em EM_EDICAO — o humano
    # arrasta pra "Em Edição" no kanban pra autorizar o vídeo. AUDIO_GERADO fica esperando.
    # Precisa ter cenas (senão travaria) — pula o resto.
    aud = [p for p in pipe if p.get('status') == 'EM_EDICAO' and (p.get('metadata') or {}).get('cenas')]
    aud.sort(key=lambda p: (tier(cn.get(cid.get(p['ideia_id']), '')), (p.get('metadata') or {}).get('numero', 999)))
    sem = sum(1 for p in pipe if p.get('status') == 'EM_EDICAO' and not (p.get('metadata') or {}).get('cenas'))
    if sem: log("aviso: %d AUDIO_GERADO sem cenas (pulados — gere o áudio no app pra criar as cenas)" % sem)
    return aud[0] if aud else None

def get_item(ideia_id):
    p = g._db('GET', '/rest/v1/pipeline_producao?ideia_id=eq.%s&select=id,ideia_id,roteiro_id,status,metadata' % ideia_id, schema='pulso_content')
    return p[0] if p else None

def cenas_do_item(p):
    cenas = (p.get('metadata') or {}).get('cenas')
    if cenas and cenas.get('scenes'):
        log("cenas lidas do metadata (%d)" % len(cenas['scenes'])); return cenas
    # fallback: rota de prod (precisa WEBHOOK_SECRET do Vercel == .env)
    log("metadata.cenas ausente — tentando rota de prod gerar-cenas...")
    body = json.dumps({"ideia_id": p['ideia_id']}).encode()
    req = urllib.request.Request(PROD + "/api/automation/gerar-cenas", data=body, method="POST",
        headers={"Content-Type": "application/json", "x-webhook-secret": ENV.get("WEBHOOK_SECRET", "")})
    try:
        r = json.loads(urllib.request.urlopen(req, timeout=120).read())
        if r.get('scenes'): return r
        log("rota falhou:", r.get('error')); return None
    except Exception as e:
        log("rota inacessível:", e); return None

def tts(texto):
    body = {"text": texto, "model_id": "eleven_multilingual_v2", "voice_settings": {"stability": 0.5, "similarity_boost": 0.8, "style": 0.2}}
    d = json.loads(urllib.request.urlopen(urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps",
        data=json.dumps(body).encode(), headers={"xi-api-key": ELK, "Content-Type": "application/json"}, method="POST"), timeout=180).read())
    return base64.b64decode(d["audio_base64"]), d["alignment"]

def ffprobe_dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path], capture_output=True, text=True).stdout.strip()
    try: return float(out)
    except: return 0.0

def _toks(s):
    import unicodedata
    n = "".join(c for c in unicodedata.normalize("NFKD", s or "") if not unicodedata.combining(c)).lower()
    return set(t for t in re.findall(r"[a-z0-9]+", n) if len(t) > 3)

def qc_completo(final, audio_dur, roteiro_texto, qcdir):
    """QC do jeito que sempre foi feito: duração + transcrição batendo com roteiro + freeze + frames.
    Retorna (erros[], avisos[], info{}). erros != [] => NÃO registra."""
    erros, avisos, info = [], [], {}
    # 1) duração (truncamento)
    vdur = ffprobe_dur(final); info["vdur"] = round(vdur, 1)
    if vdur < audio_dur * 0.98:
        erros.append("duração %.1fs < áudio %.1fs (vídeo truncado, CTA pode sumir)" % (vdur, audio_dur))
    # 2) transcrição vs roteiro (pega áudio enrolado/incompleto — lição Voynich)
    try:
        from faster_whisper import WhisperModel
        m = WhisperModel("small", device="cpu", compute_type="int8")
        segs, _ = m.transcribe(final, language="pt")
        trans = " ".join(s.text for s in segs)
        info["transcricao"] = trans.strip()  # guarda pra SEO/GEO (página /v)
        rt = _toks(roteiro_texto); tt = _toks(trans)
        overlap = (len(rt & tt) / len(rt)) if rt else 0.0
        info["transcricao_overlap"] = round(overlap, 2)
        if overlap < 0.80:
            erros.append("transcrição diverge do roteiro (overlap %.0f%%) — áudio enrolado/incompleto" % (overlap * 100))
    except Exception as e:
        avisos.append("transcrição não rodou (%s) — checar áudio à mão" % e)
    # 3) freeze nos últimos 8s (fim congelado / CTA travada)
    try:
        ini = max(0, vdur - 8)
        r = subprocess.run(["ffmpeg", "-ss", str(ini), "-i", final, "-vf", "freezedetect=n=0.003:d=2", "-map", "0:v", "-f", "null", "-"],
                           capture_output=True, text=True, timeout=120)
        if "freeze_start" in (r.stderr or ""):
            avisos.append("possível congelamento no fim (freezedetect) — conferir CTA")
    except Exception:
        pass
    # 4) frames de registro (start/mid/cta) — pro spot-check humano/Claude
    os.makedirs(qcdir, exist_ok=True)
    for nm, t in [("start", 4), ("mid", round(vdur / 2, 1)), ("cta", max(0, round(vdur - 1.5, 1)))]:
        subprocess.run(["ffmpeg", "-v", "error", "-ss", str(t), "-i", final, "-frames:v", "1", "-q:v", "3", f"{qcdir}/{nm}.jpg", "-y"], capture_output=True)
    return erros, avisos, info

def run(ideia_id=None):
    p = get_item(ideia_id) if ideia_id else proximo_da_fila()
    if not p: log("nada na fila (AUDIO_GERADO)."); return
    iid = p['ideia_id']; rid = p.get('roteiro_id'); md = p.get('metadata') or {}
    num = md.get('numero')
    if p.get('status') == 'PRONTO_PUBLICACAO' and md.get('video_url'):
        log("já registrado (%s) — nada a fazer." % md.get('video_url')); return
    rot = g._db('GET', '/rest/v1/roteiros?id=eq.%s&select=conteudo_md,metadata,titulo' % rid, schema='pulso_content')[0]
    texto = rot['conteudo_md'].strip()
    log("item: ideia %s | #%s | %s" % (iid[:8], num, rot.get('titulo', '')[:40]))

    cenas = cenas_do_item(p)
    if not cenas:
        log("SEM cenas — gere no app (/producao) e rode de novo.")
        set_render_status(p, 'aguardando_cenas', 'faltam as cenas — gere o áudio/cenas no app')
        return
    slug = cenas['slug']; d = f"D:/tmp/pulso_lote4/{slug}"; os.makedirs(d, exist_ok=True)

    # TTS -> narracao + alignment (reusa se já existe — resumível, não re-gasta ElevenLabs)
    if os.path.exists(d + "/narracao_DANIEL.mp3") and os.path.exists(d + "/alignment.json"):
        al = json.load(open(d + "/alignment.json", encoding="utf-8")); log("narração/alignment reusados")
    else:
        log("TTS (voz PULSO)...")
        blob, al = tts(texto)
        open(d + "/narracao_DANIEL.mp3", "wb").write(blob)
        json.dump(al, open(d + "/alignment.json", "w", encoding="utf-8"), ensure_ascii=False)
    if not os.path.exists(d + "/trilha.mp3"): shutil.copy(TRILHA_SRC, d + "/trilha.mp3")
    audio_dur = al["character_end_times_seconds"][-1]

    # dur por fluidez (clip >= span, alvo fator 0.75-1.0) + spans
    n = len(cenas['scenes'])
    dur = 8 if (audio_dur / n) > 6 else 6
    acc = 0.0; spans = []
    for s in cenas['scenes']:
        acc += dur; spans.append([s['name'], round(audio_dur * acc / (n * dur), 2)])
    scenes_out = [{"name": s['name'], "prompt": s['prompt'], "dur": dur} for s in cenas['scenes']]
    json.dump({"slug": slug, "base": cenas['base'], "scenes": scenes_out, "spans": spans},
              open(d + "/scenes.json", "w", encoding="utf-8"), ensure_ascii=False)
    log("audio %.1fs | %d cenas x %ds | fator ~%.2f" % (audio_dur, n, dur, audio_dur / (n * dur)))

    final = f"{d}/FINAL_{slug}.mp4"
    # RENDER — pula se o FINAL já existe (resumível: corte depois do render não re-gasta Veo)
    if os.path.exists(final) and os.path.getsize(final) > 0:
        log("FINAL já existe — pulando render, indo direto pro QC (resume).")
    else:
        set_render_status(p, 'renderizando')
        log("gerando cenas (Veo)...")
        r1 = subprocess.run(["python", "D:/tmp/gen_scenes.py", slug], capture_output=True, text=True, timeout=1800)
        if "DONE" not in r1.stdout:
            log("gen_scenes falhou:", r1.stdout[-300:], r1.stderr[-200:])
            # motivo real: última linha útil do gen_scenes (ex.: "FALHOU: 3 cenas nao geradas: [...]")
            linhas = [l.strip() for l in (r1.stdout or '').splitlines() if l.strip()]
            motivo = next((l for l in reversed(linhas) if 'FALHOU' in l or 'GUARD' in l), linhas[-1] if linhas else 'gen_scenes sem saída')
            set_render_status(p, 'erro', motivo[:180])
            return
        log("montando (ffmpeg + CTA)...")
        r2 = subprocess.run(["python", "D:/tmp/make_video.py", slug], capture_output=True, text=True, timeout=900)
        if not os.path.exists(final):
            log("make_video falhou:", r2.stdout[-300:], r2.stderr[-200:])
            set_render_status(p, 'erro', 'montagem (ffmpeg) falhou')
            return

    # QC COMPLETO (duração + transcrição vs roteiro + freeze + frames) — só registra se passar
    log("QC completo (transcrição + duração + frames)...")
    erros, avisos, info = qc_completo(final, audio_dur, texto, d + "/qc")
    for a in avisos: log("QC aviso:", a)
    if erros:
        log("QC REPROVOU — NÃO registra:")
        for e in erros: log("  -", e)
        set_render_status(p, 'erro', 'QC reprovou: ' + '; '.join(erros))
        return
    log("QC OK:", json.dumps(info, ensure_ascii=False))

    # legenda: cérebro (cenas.caption) -> roteiro.legendas -> título
    cap = (cenas.get('caption') or "").strip() or ((rot.get('metadata') or {}).get('legendas') or {}).get('legenda_ig_fb') or rot.get('titulo', '')

    # upload + PRONTO + OneDrive
    if not num:
        allp = g._db('GET', '/rest/v1/pipeline_producao?select=metadata', schema='pulso_content') or []
        nums = [int(x.get('metadata', {}).get('numero')) for x in allp if str((x.get('metadata') or {}).get('numero')).isdigit()]
        num = (max(nums) if nums else 0) + 1
    FN = "%s_%03d.mp4" % (slug, num)
    data = open(final, "rb").read()
    urllib.request.urlopen(urllib.request.Request(U + "/storage/v1/object/pulso-assets/videos/" + FN, data=data, method="POST",
        headers={"Authorization": "Bearer " + K, "Content-Type": "video/mp4", "x-upsert": "true"}), timeout=300).read()
    pub = f"{U}/storage/v1/object/public/pulso-assets/videos/{FN}"
    nmd = dict(md); nmd['video_url'] = pub; nmd['caption'] = cap; nmd['numero'] = num
    nmd.pop('render_status', None)  # deu certo — limpa o estado de render
    if info.get('transcricao'): nmd['transcricao'] = info['transcricao']
    g._db('PATCH', '/rest/v1/pipeline_producao?id=eq.%s' % p['id'], {'status': 'PRONTO_PUBLICACAO', 'metadata': nmd}, schema='pulso_content')
    dest = f"{ONE}/video_{num:03d}_{slug}"; os.makedirs(dest, exist_ok=True)
    open(f"{dest}/FINAL_{slug}.mp4", "wb").write(data)
    log("PRONTO #%d %s (%dMB) -> PRONTO_PUBLICACAO + OneDrive" % (num, slug, len(data) // 1024 // 1024))
    # thumb (capa) do vídeo final -> Supabase + metadata.thumb
    try:
        subprocess.run(["python", "D:/tmp/video_thumbs.py", f"{dest}/FINAL_{slug}.mp4", str(num)], capture_output=True, timeout=120)
        log("thumb do vídeo gerada")
    except Exception:
        pass
    # atualiza a galeria do banco (sobe só thumbs novas; catálogo/usos sempre) — custo ~0
    try:
        subprocess.run(["python", "D:/tmp/banco_thumbs.py", "--novos"], capture_output=True, timeout=300)
        log("galeria do banco atualizada")
    except Exception as e:
        log("aviso: banco_thumbs falhou (%s)" % str(e)[:60])
    # enriquece os clips NOVOS: tag por visão + embedding (rotas no Vercel, só os que faltam)
    try:
        import banco_clips as _bc
        _bc.enriquecer_novos()
        log("banco enriquecido (visão + embedding dos clips novos)")
    except Exception:
        pass

if __name__ == "__main__":
    atualizar_saldo_higgsfield()  # saldo ANTES do render (aviso proativo)
    arg = sys.argv[1] if len(sys.argv) > 1 else "--next"
    if arg == "--next":
        # ESVAZIA A FILA por rodada (não mais 1 por vez) — o freio de custo real é o
        # guard (teto 600cr/dia) dentro do gen_scenes + o gate humano do EM_EDICAO.
        # 'feitos' evita loop infinito em item que falhou (fica com render_status=erro).
        feitos = set()
        for _ in range(10):  # teto duro de segurança por invocação
            p = proximo_da_fila(excluir=feitos)
            if not p:
                log("fila vazia — fim da rodada (%d processados)" % len(feitos)); break
            feitos.add(p['id'])
            try:
                run(p['ideia_id'])
            except Exception as e:
                log("item %s crashou: %s" % (p['ideia_id'][:8], str(e)[:120]))
    else:
        run(arg)
    atualizar_saldo_higgsfield()  # saldo DEPOIS do render (captura o gasto)
    # auto-adiciona vídeos novos do YT nas playlists por vertical (idempotente, ~grátis)
    try:
        subprocess.run(["python", "D:/tmp/yt_playlists.py"], capture_output=True, timeout=180)
    except Exception:
        pass
