# Motor de stories — plano (dono, 03/10/2026)

**Por quê.** Story não traz público novo: aparece para quem já segue. O valor é o retorno — lembrar o
seguidor do vídeo do dia e trazê-lo de volta. É o ponto fraco medido: no YouTube só 1,9% das views
vêm de inscritos, e o Facebook pede 250 visitas de retorno por semana para destravar Assinaturas.

**Decisão do dono:** "montar um plano e começar as criações e sempre postar os automáticos e os manuais".

## Como funciona

| Momento | Hora (BRT) | Peças | Onde |
|---|---|---|---|
| antes | 17h00 | `pergunta.jpg` (título como pergunta + "a resposta sai às 19h") e `teaser_antes.mp4` (9s do gancho + "hoje às 19h · no perfil") | IG + FB automático; TikTok + Kwai na lista |
| depois | 19h40 | `teaser_depois.mp4` ("saiu! vídeo completo no perfil") — só se o vídeo saiu mesmo | IG + FB automático; TikTok + Kwai na lista |

- **Artes:** `motor/gerar_stories.py` (local, ffmpeg + Pillow), custo de geração zero — saem do vídeo
  pronto. O worker de render gera para os 3 próximos agendados a cada rodada (08/16/23h).
  Faixa no topo, logo abaixo da barra do perfil: embaixo ficam a legenda queimada, o mascote e a
  caixa de resposta. Sem emoji (o Pillow não desenha emoji colorido).
- **Publicação:** `POST /api/automation/publicar-stories {momento}` por pg_cron
  (`pulso-stories-antes` 20:00 UTC, `pulso-stories-depois` 22:40 UTC). IG: container `STORIES` +
  `media_publish`. FB: `photo_stories` e `video_stories` (start/upload por `file_url`/finish).
  Idempotente por (ideia, rede, momento, tipo); erro tenta de novo na próxima chamada.
- **Manuais:** TikTok e Kwai entram como `pendente` em `pulso_content.stories`; o card
  "Stories de hoje" na Central de Publicação tem baixar arte + "Postei".
- **Limite da API:** sem figurinha interativa (enquete, quiz, link). O texto vai na arte.

## Medição (fase 2)

- Métricas de story do Instagram só existem enquanto o story está no ar (24h): o coletor precisa
  ler no mesmo dia — reach, replies, navigation, follows, profile_visits, shares → `stories.metricas`.
- **Teste de 14 dias (até 17/10/2026):** comparar seguidores e visitas ao perfil (IG/FB) nos 14 dias
  com story contra os 14 anteriores. Se não mexer, desliga — como a trava de tema novo.

## Fases

1. **03/10 — no ar:** tabela (migration 074), gerador de artes, rota de publicação, crons, card manual.
2. **Próxima:** coletor de métricas de story do IG + bloco no /analytics; veredito em 17/10.
3. **Depois, se o teste passar:** variar formatos (bastidor, curiosidade extra do roteiro, "você sabia").
