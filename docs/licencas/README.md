# Licenças e direitos de uso comercial — motores do PULSO

> **Por que esta pasta existe:** a monetização exige direito sobre o que se publica. Termos de
> serviço mudam sem aviso, e numa disputa vale o que estava escrito **na data do uso** — o ônus de
> provar é de quem publicou. Link não serve como prova; **print datado serve**.
>
> Criada em 2026-08-24 pela auditoria de conformidade pré-receita
> ([relatório](../../../Cockpit/auditorias/conformidade-receita-pulso-2026-08-23.md), Bloco 7).

## Como usar

Para cada motor: uma subpasta com **print dos termos com data visível** + **plano contratado** +
**recibos**. Ao trocar de plano ou ao renovar, adicionar novo print — não substituir o antigo.

```
docs/licencas/
├── README.md          ← este arquivo (índice + estado)
├── trilha-sonora/     ← PRIORIDADE MÁXIMA
├── higgsfield-veo/
├── elevenlabs/
├── dashscope-wan/
└── pexels-pixabay/
```

## Estado atual

| Motor | Papel no pipeline | Conta | Plano | Prova arquivada | Status |
|---|---|---|---|---|---|
| **Trilha sonora** | música de fundo, mixada a 12% em **todos** os vídeos | — | — | ❌ nenhuma | 🔴 **origem desconhecida** |
| **Pexels** | b-roll de acervo real (tier 0) | PULSO | Free | ❌ | 🟡 termos não arquivados |
| **Pixabay** | b-roll de acervo real (tier 0) | PULSO (`56826734`) | Free | ❌ | 🟡 termos não arquivados |
| **Wan / DashScope** | geração de b-roll (tier 1) | PULSO (região Singapura) | **cota gratuita** | ❌ | 🔴 tier grátis em conteúdo monetizado — verificar se permite |
| **Veo 3.1 lite / Higgsfield** | b-roll caro (fallback) | PULSO | pago — R$ 2.168,48 por 8.144 cr (mai–jul/26) | ❌ | 🟡 plano a confirmar |
| **ElevenLabs** | voz oficial (`GmzLAnPHSUkxG3P5yfca`) | PULSO | **a confirmar** | ❌ | 🟡 direito comercial depende do plano |
| **OpenAI** | roteiro (GPT-4o) + TTS alternativo | — | pago | ❌ | 🟡 |

## 🔴 Pendência crítica — a trilha sonora

**O dono acreditava que o app não aplicava trilha, só narração. A verificação técnica de
2026-08-24 mostrou o contrário.** Registrado aqui para não se perder:

**Evidência 1 — o código copia a mesma música para cada vídeo.**
`D:/tmp/worker_render.py` (runtime real, idêntico a `motor/worker_render.py`):
```python
TRILHA_SRC = "D:/tmp/pulso_lote4/copa_gol11s/trilha.mp3"
...
if not os.path.exists(d + "/trilha.mp3"): shutil.copy(TRILHA_SRC, d + "/trilha.mp3")
```

**Evidência 2 — o mix final inclui a trilha.**
`D:/tmp/make_video.py` linhas 207-210:
```python
run([FF,"-y","-i",ov,"-i",NARR,"-stream_loop","-1","-i",TRILHA,
     f"[2:a]volume=0.12,afade=t=out:st={dur-2:.1f}:d=2[m];[1:a][m]amix=inputs=2:duration=first[a]"
```
A trilha entra a **volume 0.12 (12%)**, em loop, com fade nos 2s finais, misturada à narração.
O volume baixo explica por que passou despercebida.

**Evidência 3 — está em 158 dos 159 vídeos, e é sempre o mesmo arquivo.**
`md5 = 0df7d16d94f6cf9c8351d524ba0fad53` em todos os 158.

**Evidência 4 — medição no áudio publicado.** No trecho 5,6s–6,8s do `copa_gol11s`, onde a
narração está em silêncio detectado:

| Fonte | mean_volume | max_volume |
|---|---|---|
| `narracao_DANIEL.mp3` (narração pura) | **−71,3 dB** | −61,1 dB |
| `FINAL_copa_gol11s.mp4` (vídeo publicado) | **−49,9 dB** | −43,2 dB |

**~21 dB de diferença** no mesmo intervalo. Não é ruído de codec — é música tocando.

### O que isso significa

- **A trilha está publicada em todos os vídeos.** Isso é fato, não hipótese.
- **Zero reivindicações de Content ID** em 146 vídeos no YouTube ao longo de ~3 meses
  (verificado no Studio em 24/08). Isso torna **provável** que a música seja de biblioteca livre
  ou não registrada no Content ID — mas provável não é documentado, e o Content ID aperta a
  varredura quando o canal entra no YPP.

### Ação

- [ ] **Descobrir a origem do arquivo** — é a única pergunta que só o dono responde
- [ ] Se houver licença/recibo: arquivar em `trilha-sonora/` e o item fecha
- [ ] Se não houver: substituir por biblioteca licenciada (YouTube Audio Library, R$ 0) em
      `worker_render.py`, e decidir o que fazer com os 158 já publicados

## Pistas para achar a origem

O arquivo veio de `D:/tmp/pulso_lote4/copa_gol11s/` — o lote 4, vídeo da Copa, produzido em
**22/06/2026** (data de modificação do `trilha.mp3`: 2026-06-22 23:28). Caminhos a checar:

- Histórico de download do navegador em torno de 22/06/2026
- Extrato/recibos de bibliotecas de música naquele período
- Se foi gerada por IA: qual motor, e sob qual plano

**Os metadados do arquivo já foram checados e não ajudam** (`ffprobe`, 24/08/2026):

```
codec_name=mp3 · duration=110.000000 · bit_rate=64000 · TAG:encoder=Lavf62.12.101
```

Sem tag de título, artista ou álbum. `Lavf` = libavformat, ou seja, **o arquivo foi re-encodado
por ffmpeg**, o que apagou os metadados originais. A duração exata de 110,000000s indica corte
deliberado, e 64 kbps é bitrate de material já comprimido. Ou seja: o arquivo passou por edição
local e não carrega mais nenhuma pista de procedência. **A resposta está com o dono ou no
histórico de junho/2026, não no arquivo.**
