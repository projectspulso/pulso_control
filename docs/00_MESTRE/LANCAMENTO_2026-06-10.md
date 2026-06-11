# Lançamento PULSO — 10/06/2026

## O que está NO AR
| # | Vídeo | Canal (vertical) | Status |
|---|---|---|---|
| 001 | UVB-76, a rádio que nunca dormiu | Mistérios & História | **PUBLICADO nas 4 redes** |
| 002 | Seu corpo já foi trocado (Teseu) | Curiosidades | PRONTO_PUBLICACAO |
| 003 | Vergonhas às 3 da manhã | Psicologia | PRONTO_PUBLICACAO |
| 004 | Ninguém vai te salvar | Motivacional | PRONTO_PUBLICACAO |
| 005 | Sobreviveu a 2 bombas (Yamaguchi) | Casos Reais | PRONTO_PUBLICACAO |

Redes: YouTube/TikTok = @pulsohistorias · IG = @pulsoprojects · FB = Página Pulso Projects
Arquivos: OneDrive `pulso/videos/video_00N_*/` · Voz travada: HARNESS §6 · Custos: ~1.000 créditos Higgsfield/lote

## Pipeline provado (replicável)
roteiro (harness §9 checklist) → TTS timestamps (ElevenLabs Daniel) → receita E (ffmpeg) →
cenas Seedance 9:16 (fila 6, retry NSFW) → trilha por emoção (synth) → montagem (concat+logo+avatar+legendas) → upload <10MB → publicação assistida

## Próximos passos
1. **Publicar 002-005** nas 4 redes (em andamento) → flip pipeline pra PUBLICADO
2. **Métricas 24-72h**: comparar aderência por vertical (teste do lote) → decide faixa âncora da grade
3. **CNPJ/AdSense** com contador ANTES das metas de monetização (gate §3.3 CONFIG_REDES)
4. **Grade no banco** (`grade_slots` — doc 17) quando o teste definir as faixas
5. **Rotina cowork**: produção noturna automática + aprovação humana matinal (runbook = este pipeline)
6. Pendentes menores: nome PULSO no FB (Business Suite), IG app (nome/links), Threads, Kwai (decidir escopo)

## Roadmap de automação (decidido 10/06 — levar tudo pro app)

> Estado atual (provisório, funcional): rotina cowork local (8h, métricas) + publicação assistida via navegador. Destino: app autônomo com gate humano.

| Fase | O quê | Como | Esforço |
|---|---|---|---|
| **F1 — Métricas no app** | Coleta diária automática | `/api/automation/coletar-metricas` (rota JÁ EXISTE) + YouTube Data API key (JÁ no Vercel) + cron (pg_cron ou Vercel cron) → grava `metricas_publicacao` | 🟢 baixo — primeiro passo |
| **F2 — Publicar direto Meta** | IG Reels + FB Reels via API | ✅ **INFRA PRONTA (11/06)**: app Meta "Pulso Control" (ID 1333767978163007) + system user `pulso_publisher` com token sem expiração + Página/IG no portfólio "Projetos Pulso". Credenciais `META_*` no `.env` local; falta copiar pro Vercel + rota de publicação | 🟢 só falta código |
| **F3 — Publicar direto YouTube** | Upload via API | OAuth no Google Cloud (CLIENT_ID/SECRET parciais no Vercel) + fluxo de consentimento | 🟡 médio |
| **F4 — TikTok API** | Content Posting API | Exige auditoria do app (sem ela = post privado). Manter assistido até aprovar | 🔴 lento (externo) |
| **F5 — Grade + fila de aprovação** | Agenda vira sistema | `grade_slots` no banco (doc 17) + cron preenche fila + tela de aprovação no app (R-011: humano aprova, sistema publica no horário) | 🟡 médio — fecha o ciclo |

**Ordem:** F1 → F2 → F5 → F3 → F4. A rotina cowork continua como rede de segurança até cada fase substituí-la.

## Infra Meta API (configurada 11/06/2026)

| Item | Valor |
|---|---|
| App Meta | "Pulso Control" — ID `1333767978163007` (casos de uso: API Instagram + API Páginas, sem app review p/ uso próprio) |
| Portfólio empresarial | "Projetos Pulso" — ID `1539817773572500` (agora dono da Página + IG) |
| System user | `pulso_publisher` (Admin) — token **sem expiração**, 10 permissões (pages_manage_posts, instagram_content_publish, read_insights etc.) |
| Página FB | Pulso Projects — `926237593895365` |
| IG business | @pulsoprojects — `17841478757082171` |
| Credenciais | `.env` local: `META_APP_ID`, `META_APP_SECRET`, `META_SYSTEM_USER_TOKEN`, `META_PAGE_ACCESS_TOKEN`, `META_PAGE_ID`, `META_IG_USER_ID`, `META_BUSINESS_ID` — **copiar pro Vercel** ao implementar F1/F2 |
| Validado em 11/06 | `GET /me/accounts` (page token ok) · `GET /{page}?fields=instagram_business_account` ok · IG media c/ like_count ok |

Endpoints prontos para usar: publicar IG Reels = `POST /{ig_user_id}/media` (video_url+caption) → `POST /{ig_user_id}/media_publish`; publicar FB Reels = `POST /{page_id}/video_reels`; insights = `GET /{ig_media_id}/insights`, `GET /{page_id}/insights`.
