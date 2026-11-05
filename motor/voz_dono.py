# -*- coding: utf-8 -*-
"""
VOZ DO DONO — narração dos Longos (Bastidores) com a voz TRAVADA da marca.

A configuração não mora aqui: vem de pulso_core.configuracoes['voz_bastidores'], aprovada pelo dono
em 05/11/2026 (referência: avatar_dono/voz/teste_clone/3_energia_grave1.mp3). Clone + mais energia
+ 1 tom abaixo com formante preservado. Mudar a voz = mudar a config, com a palavra do dono.

Uso:  python D:/tmp/voz_dono.py "<texto>" <saida.mp3>
      python D:/tmp/voz_dono.py --arquivo roteiro.txt <saida.mp3>
"""
import json, os, re, subprocess, sys, tempfile, urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pulso_guard as g  # noqa: E402


def config():
    rows = g._db("GET", "/rest/v1/configuracoes?chave=eq.voz_bastidores&select=valor", schema="pulso_core")
    if not rows:
        raise SystemExit("voz_bastidores não existe em configuracoes: sem voz travada, não narro")
    return json.loads(rows[0]["valor"])


def _chave():
    for linha in open(r"D:/projetos/pulso_control/.env", encoding="utf-8", errors="ignore"):
        m = re.match(r'^ELEVENLABS_API_KEY\s*=\s*"?([^"\r\n]+)', linha)
        if m:
            return m.group(1)
    raise SystemExit("ELEVENLABS_API_KEY ausente no .env")


def narrar(texto, saida):
    c = config()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{c['voice_id']}?output_format=mp3_44100_128", method="POST",
        data=json.dumps({"text": texto, "model_id": c["model_id"], "voice_settings": c["voice_settings"]}).encode(),
        headers={"xi-api-key": _chave(), "Content-Type": "application/json"})
    bruto = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False).name
    try:
        with urllib.request.urlopen(req) as r, open(bruto, "wb") as f:
            f.write(r.read())
        pos = c.get("pos", {})
        fator = 2 ** (float(pos.get("semitons", 0)) / 12)
        filtro = f"rubberband=pitch={fator:.4f}:formant=preserved,loudnorm=I={pos.get('lufs', -16)}"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", bruto, "-af", filtro, saida], check=True)
    finally:
        os.remove(bruto)
    return saida


if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) == 3 and a[0] == "--arquivo":
        texto, saida = open(a[1], encoding="utf-8").read(), a[2]
    elif len(a) == 2:
        texto, saida = a
    else:
        raise SystemExit(__doc__)
    print(narrar(texto.strip(), saida))
