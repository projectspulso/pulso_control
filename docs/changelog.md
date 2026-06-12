# Changelog — pulso_control

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), simplificado.

## [Não lançado]

### Adicionado
-

### Mudado
- **Facebook fora da publicação via API** (12/06): teste A/B provou que reels FB
  publicados via Graph API na Página Pulso Projects são sufocados pelo algoritmo
  (4 reels API = 0-2 plays em 13h; mesmo vídeo repostado manual no Business Suite
  = 232 plays em 40min, "2,1x acima da média"). Default da rota `/api/automation/publicar`
  e do modal de publicar agora é só `['instagram']`; FB volta ao fluxo manual
  (Business Suite) até a Página ter histórico — re-teste futuro com
  `plataformas:['facebook']` explícito.

### Removido
-

---

## [2026-05-22]

### Corrigido
- **🎯 Worker da automação destravado.** O job pg_cron `processar-fila-auto` (jobid=9, schedule `*/5 * * * *`) falhava silenciosamente desde 31/03/2026 com erro `invalid input syntax for type json, Token "Content" is invalid` por causa de JSON malformado no comando — `headers := '{Content-Type: application/json}'::jsonb` (sem aspas duplas em JSON). Diagnóstico via `cron.job_run_details` com PAT Supabase específico do pulso. Fix: `cron.unschedule(9)` + `cron.schedule` novo (jobid=10) com `headers := '{"Content-Type": "application/json"}'::jsonb`. Validado com 10 calls paralelas via curl ao orchestrator (`https://pulsoprojects.vercel.app/api/automation/orchestrator`) — fila começou a esvaziar (403→390 PENDENTE em segundos). Documentado em `Spec/pulso_control.md` §10 gap #8.

### Notas operacionais
- Hipótese inicial de "WEBHOOK_SECRET divergente" estava **errada** — orchestrator passa sem header (lógica `if (secret && secret !== process.env.WEBHOOK_SECRET)`).
- `app.settings.app_url` e `app.settings.webhook_secret` estão NULL no Postgres do pulso, mas isso não importa: o comando do job já tem URL hardcoded.
- `DEPLOY_MASTER_AUTOMACAO.sql` (linhas 501-502) ainda tenta setar esses settings mas o role do Management API não tem permissão (`ALTER DATABASE postgres SET` exige superuser). Como o fix atual não depende disso, segue.
- Fila tem ~390 PENDENTE acumulados desde 31/03/2026. Vão escoar à razão de 5 itens/5min via cron novo, ou via curl manual se quiser acelerar. Muitos são órfãos (ex.: GERAR_AUDIO de roteiros que já têm áudio → vão para ERRO no orchestrator).

## 2026-06-10 — LANÇAMENTO: 5 vídeos produzidos, vídeo 001 publicado nas 4 redes

- **Vídeo 001 (UVB-76/Mistérios) PUBLICADO**: YouTube (youtube.com/shorts/alsJjjvlNuA), TikTok, Instagram Reels, Facebook Reels
- **Vídeos 002-005 produzidos** (Curiosidades/Psicologia/Motivacional/Casos Reais), em PRONTO_PUBLICACAO
- Pipeline provado ponta a ponta: roteiro (harness) → ElevenLabs (voz Daniel + receita E travada) → Seedance 2.0 (cenas) → avatar mascote animado (chroma) → legendas sincronizadas (timestamps) → trilha por emoção (ffmpeg synth) → montagem → publicação assistida
- Identidade nas redes: PULSO / @pulsohistorias (YT+TikTok 100%; IG/FB parciais)
- Novos docs: HARNESS_ROTEIRO_PULSO.md (bíblia editorial), 17_CONTROLE_DE_AGENDA_GRADE.md, redes/CONFIG_REDES_PULSO.md
- Banco: 5 ideias/roteiros/pipeline registrados (origem lote_lancamento_claude) + metricas_publicacao
- Assets de marca: avatar transparente + chroma + animação em OneDrive pulso/avatar/

## 2026-06-10 (cont.) — LANÇAMENTO COMPLETO: 20/20 publicações
- 5 vídeos publicados nas 4 redes (YouTube, TikTok, Instagram, Facebook) = 20 publicações
- YouTube: alsJjjvlNuA, VklMYX5xypc, 4MQzmgWWSos, lJ2VhSSFuxw, P_4V1un7ntY
- TikTok: 5 publicados com marcação IA (conta @pulsohistorias)
- IG+FB: via Meta Business Suite (cross-post simultâneo)
- Banco: 20/20 metricas_publicacao registradas; pipeline 5x PUBLICADO
- Teste de aderência por vertical EM ANDAMENTO (medir 24-72h)

## 2026-06-11 — Meta API configurada (F2 destravada)
- App Meta for Developers criado: "Pulso Control" (ID 1333767978163007), casos de uso API Instagram + API Páginas — sem app review para uso nas contas próprias
- Página "Pulso Projects" + IG @pulsoprojects movidos para o portfólio empresarial "Projetos Pulso" (1539817773572500)
- System user `pulso_publisher` (Admin) criado com token sem expiração e 10 permissões (publicação + insights IG/FB)
- Credenciais META_* salvas no .env local (pendente: copiar ao Vercel quando F1/F2 entrarem no código)
- API validada: page token OK, IG business account vinculado (17841478757082171), leitura de mídia/likes OK
- Caminho aberto: publicação direta IG Reels + FB Reels via Graph API e métricas Meta no app

## 2026-06-11 (cont.) — F1 NO AR: métricas reais no app
- Envs META_* + INSTAGRAM_ACCESS_TOKEN no Vercel (token novo com instagram_manage_insights)
- Rota /api/automation/coletar-metricas reescrita contra o schema real + cron diário 8h BRT (vercel.json)
- 5 vídeos do lançamento agora existem na cadeia completa: conteudos → conteudo_variantes → pulso_distribution.posts (20 posts PUBLICADO)
- Snapshots diários em pulso_analytics.metricas_diarias (FK válida) → painel /analytics com números reais
- IDs YouTube V1/V4 corrigidos (confusão l/I): aIsJjjviNuA, IJ2VhSSFuxw
- Push corrigido: credencial x-access-token fixada no remote origin
- PRIMEIRA LEITURA DE ADERÊNCIA (24h): YouTube V1 Mistérios 282 views (12x o 2º lugar V5 Casos Reais 22) — sinal forte pra faixa âncora da grade; IG total ~551 views distribuído

## 2026-06-11 (cont. 2) — Central de comando: 7 frentes implementadas
- /validacao reescrita: aderência viva das 4 redes (auto + cowork), ranking por vertical, coletar agora, refresh 5min
- MODO_FOCO desativado — operação multi-canal de volta em ideias/roteiros/producao/publicar/canais
- Prompt de ideias AI reescrito com o harness (emoção-âncora, lacuna de curiosidade, STEPPS, fatos reais)
- /producao: banner de antecipação (dias de cobertura vs meta 7-20 dias, via plano_publicacao)
- /publicar: botão "Copiar kit" (kit completo por rede com configs e hashtags) — gate humano via navegador
- /analytics virou BI: filtros rede/vertical/período, curva diária, custo AI por vídeo (lib/config/custos.ts), receita aguardando gate CNPJ
- Coletor Facebook Reels via video_insights — 15/20 publicações automáticas; TikTok via rotina cowork atualizada

## 2026-06-11 (cont. 3) — Geração AI de ideias validada em produção
- /api/automation/gerar-ideias: parse robusto (objeto único, array embrulhado), fallback de rotação de canais (canal com menos ideias), emocao_ancora no metadata
- Validado ponta a ponta em produção: rotação automática → GPT-4o → ideia salva como RASCUNHO (curadoria humana decide)
- Próximo refinamento: forçar N ideias por chamada (GPT às vezes devolve 1)

## 2026-06-11 (cont. 4) — Ciclo completo dentro do app: ideia AI → roteiro AI → publicar via Meta API
- gerar-roteiro: prompt com harness (lacuna, emoção-âncora, fatos reais, TTS-friendly); testado em produção — roteiro "Por que a Lua brilha no escuro?" gerado com quality_score 100, 68s, status RASCUNHO (gate humano)
- /api/automation/publicar REESCRITA: publica IG Reels + FB Reels DIRETO via Graph API (container/publish + reels start/upload/finish), exige confirmar:true (R-011), registra metricas_publicacao + pipeline; "Manus" órfão aposentado
- Gate de confirmação validado em produção (400 sem confirmar)
- Primeira publicação real via API: no próximo vídeo do pipeline (precisa de video_url público — Supabase Storage ou OneDrive direto)

## 2026-06-12 — TikTok 100% integrado: publicação E métricas via API
- TikTok for Developers: app pulso_control1 + Sandbox configurado (ícone injetado via JS), test user @pulsohistorias
- OAuth Login Kit funcionando: token salvo em pulso_core.configuracoes (tiktok_oauth), refresh automático
- /api/automation/tiktok-upload: envia vídeo pros RASCUNHOS do TikTok (inbox/FILE_UPLOAD) — publicação nativa pelo celular com som trending (remédio do shadowban)
- Coleta de métricas TikTok via Display API (video.list) integrada à rota coletar-metricas
- MARCO: 20/20 publicações com métricas 100% automáticas (YouTube, Instagram, Facebook, TikTok) — cowork agora só audita e reporta

## 2026-06-12 (cont.) — LOTE 2 PRODUZIDO: 5 vídeos prontos pra publicar
- 5 vídeos montados (voz Daniel + receita E, legendas sincronizadas, avatar, trilhas por emoção): Lua 75s, Relógio 61s, Relâmpagos 69s, Foco 68s, Tetris 105s
- 33 cenas Seedance (tetris perdeu 3 pro filtro de marca — esticada com clone)
- Arquivos: OneDrive video_006..010 + UPLOAD no Supabase Storage (lote2_*.mp4) prontos pra publicação via API
- Kanban: 5 cards em PRONTO_PUBLICACAO (roteiros todos aprovados)
- Cobertura do experimento: com a publicação do lote 2, 10/10 verticais testadas
