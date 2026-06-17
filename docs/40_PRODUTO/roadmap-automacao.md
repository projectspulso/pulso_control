# Roadmap de Automação — PULSO

> Backlog pra evoluir o pipeline de **semi-automático → quase-total**, conforme as redes
> liberarem APIs de publicação e ferramentas de vídeo com API surgirem.
> Estado atual (16/06): ideias/roteiros/áudios **auto no app**; vídeo via **Higgsfield
> manual (site)**; montagem com o **agente (Claude) orquestrando**; publicação **híbrida**
> (IG auto via Meta API, FB/TikTok/YT manual).

## Por etapa

### Ideias / Roteiros / Áudios (auto no app)
1. ~~**Trava de duplicidade semântica**~~ ✅ **FEITO (17/06)** via LLM-judge (não embeddings): 2ª camada em `dedup.ts`/`gerar-ideias` julga se o assunto central é o mesmo de alguma ideia existente. Norte futuro ainda é embeddings+pgvector (mais barato que chamada LLM por lote), mas o LLM-judge já fecha o buraco do Jaccard lexical.
2. **Monitor + trava de cota ElevenLabs** — estourou sem aviso em 15/06. Alerta antes de zerar + fallback/cache.
3. **Alignment no pipeline** — gerar timestamps junto do áudio sempre (Whisper local ou ElevenLabs `/with-timestamps`), salvo no storage → lip-sync + legendas prontos.
4. **Auto-curadoria de ideias** — usar `potencial_viral_ia` p/ auto-aprovar acima de threshold (31 rascunhos parados em 15/06).

### Vídeo / B-roll (Higgsfield manual — MAIOR GARGALO)
5. **Prompts de cena auto-gerados do roteiro** — função no app converte cada frase → prompt de B-roll, com filtro child-free/horror embutido (Higgsfield NSFW bloqueia crianças).
6. **Banco de clips reutilizável** — catalogar B-roll genérico por tema p/ reduzir gerações e custo.
7. **Ferramenta de vídeo COM API** (Runway / Kling API / Luma) — Higgsfield Veo é só site (sem API) e o download é garimpo manual no navegador. API mata o gargalo.
8. **Pré-validação NSFW** — checar prompt antes de gastar crédito.

### Produção / Montagem (tirar o agente do caminho crítico)
9. **Montagem como endpoint** (`/api/automation/montar-video`) — recebe áudio+alignment+clips, roda o molde bolha (ffmpeg) sozinho. Hoje depende de rodar `D:/tmp/make_video.py`.
10. **Orquestrador no app** (`/api/automation/orchestrator`) — roda a cadeia ideia→roteiro→áudio→prompts→[gate B-roll]→montagem→PRONTO, com gates humanos só nos pontos certos.

### Publicação (híbrida)
11. **YouTube auto** — Data API `videos.insert` + OAuth do canal (hoje upload manual no Studio).
12. **TikTok auto** — Content Posting API direct-post (hoje só rascunho pro celular; precisa auditoria do app TikTok).
13. **Publicação agendada de verdade** — cron pega cards `PRONTO_PUBLICACAO` com data=hoje e publica IG + dispara TikTok/YT no horário.
14. **FB fica manual de propósito** — reels via API nesta Página são sufocados pelo algoritmo (teste A/B 12/06).

### Confiabilidade / Saúde (transversal)
15. **Reconciliação auto-corrige post_id stale** — hoje é só-insert; não conserta id errado (como o IG corrigido na mão em 16/06).
16. **Painel de saúde + alertas** — cota ElevenLabs, créditos Higgsfield, fila travada, deploy 403.

## Maiores alavancas (prioridade)
1. **#10 Orquestrador no app** → cadeia roda sem o agente no meio.
2. **#7 Vídeo com API** → mata o único gargalo 100% manual.
3. **#13 Publicação agendada** → fecha o ciclo do estoque ao ar, com gate humano só onde a plataforma/lei exige.

> Gatilho: revisitar quando (a) uma rede liberar API de publicação confiável, ou (b)
> aparecer ferramenta de vídeo com API que iguale a qualidade do Veo 9:16.
