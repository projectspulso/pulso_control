# AGENTS.md — pulso_control

> **Porta de entrada padronizada** para qualquer agente IA (Claude, Cursor, Cline, Copilot, Aider) entrando neste app. Convenção definida em [ADR-0024](../Cockpit/ADR/ADR-0024-agents-md-por-app-aguardando-design-system.md).
>
> Criado em 2026-05-25 (replicação do padrão piloto `clearix_hub/AGENTS.md` adaptado para app não-Clearix).
>
> ⚠ **ATENÇÃO ABSOLUTA:** segundo a Spec, há "WIP de merge não resolvido na main" — **NÃO TOCAR** no estado da branch sem confirmação explícita do dono. Trabalhar sempre em branch separada.

---

## 1. O que é (1 frase)

Centro de comando editorial para criar e operar canais de vídeos curtos faceless com **Pulso** como personagem-mascote — atualmente em **MODO FOCO** no canal "PULSO Mistérios & História" (YouTube Shorts), com 10 canais cadastrados e 131 ideias no portfolio.

## 2. Posição na DIGIAI

- **Verdade Canônica que rege:** *"Pulso trabalha primeiro a favor da DIGIAI"* (MÉDIO)
- **Fase atual do app:** Produção parcial **TRAVADA** — sistema parou em 04/12/2025; fix do pg_cron aplicado em 2026-05-22 (jobid=10), mas pipeline de vídeo→publicação nunca rodou end-to-end
- **Prioridade na matriz:** **MÉDIA** (motor de mídia interno — pendência estratégica entre alimentar DIGIAI vs canais autônomos)
- **Categoria portfólio:** ALAVANCA CRÍTICA / INCUBAÇÃO (depende de decisão estratégica documentada no Backlog Executivo digiai 04/2026)
- **Pacote comercial:** **não aplicável** (operação interna DIGIAI, não SaaS)

## 3. Onde está a verdade (leituras obrigatórias antes de editar)

- **Spec própria:** [`../Cockpit/Spec/pulso_control.md`](../Cockpit/Spec/pulso_control.md) — **fonte canônica** (sweep completo do navegador 2026-05-22 com 14 seções de gaps verificados)
- **Doc canônico crítico:** `pulso_control/docs/40_PRODUTO/90_APOIO/CRITICA_VIABILIDADE_CANAIS_DARK_2026.md` (sistema interno editorial 7/10 viável vs fábrica dark multi-rede 3/10)
- **ADRs aplicáveis:** ⚠ A confirmar — sem ADR específico do Pulso ainda
- **Regras Harness críticas:**
  - **R-001** — `docs/` obrigatório (existe com convenção numerada `00_MESTRE`/`10_SETUP`/etc — **não padronizar agora**)
  - **R-003** — não commit sem pedido
  - **R-004** — ação destrutiva exige confirmação (worker pg_cron + 49 publicações agendadas)
  - **R-005** — UI verificada no navegador (Spec já tem auditoria completa)
  - **R-010** — Pergunta de Ouro
  - **R-011** — AI nunca publica direto (Pulso publica em redes sociais — cuidado MÁXIMO com R-011: publicação real exige autorização humana)
  - **R-024** — Baseline AppSec (OWASP Top 10): RLS · parametrized queries · webhooks com signature · headers de segurança · `dangerouslySetInnerHTML` e `execute_sql` interpolado bloqueados por hook T-005
- **NÃO se aplica:** R-014 (clearix_design). Pulso tem identidade visual própria — não é Clearix.
- **NÃO se aplica:** R-009 (banco Clearix). Pulso tem banco próprio (`nlcisbfdiokmipyihtuz`).

## 4. Stack + dev

- **Stack:** **Next.js 16.2.1** (App Router) + React 19.2 + TypeScript 5 + Tailwind 4 + Supabase + React Query + Zustand + `@antv/x6` + `@xyflow/react` (workflows/grafos) + `react-d3-tree` + `vis-network` (organograma) + recharts + `react-big-calendar` + `@dnd-kit` (kanban) + react-markdown + remark-gfm + `pg` 8.16 (Postgres direto) + babel-plugin-react-compiler 1.0
- **Porta dev:** **3004** (definida pelo dono em runbook; Next.js default 3000 conflita com Hub/digiai). Comando: `npx next dev --port=3004`
- **URL produção:** ⚠ A confirmar — Spec presume Vercel (`docs/10_SETUP/VERCEL_ENV_SETUP.md` existe)
- **Como rodar:** `npx next dev --port=3004`
- **Hospedagem:** Vercel presumido (a confirmar)
- **CI/CD:** ⚠ A confirmar

## 5. Banco + permissões

- **Projeto Supabase:** **`nlcisbfdiokmipyihtuz`** (banco próprio do Pulso — **NÃO Clearix**)
- **MCP Supabase tem acesso direto?** **❌ Não** (R-012 — MCP só vê banco Clearix). Operações DB neste app via SDK Supabase normal + `pg` (cliente direto).
- **PAT local em `.env`?** Sim — usado para Management API (foi crítico no fix do pg_cron em 22/05/2026)
- **Schemas que o app toca:**
  - `pulso_core`, `pulso_content`, `pulso_assets`, `pulso_distribution`, `pulso_automation`, `pulso_analytics`
- **Auth:** Supabase Auth (dashboard acessível sem login nesta sessão — anon mostra dados)
- **Tabela crítica:** `cron.job` + `cron.job_run_details` (pg_cron) — fix do jobid=10 aplicado 22/05/2026, monitorar

## 6. Comandos

### ✅ Verde (rodar sem confirmar)

- `npm install` — primeira vez
- `npx next dev --port=3004` — dev local
- `npm run build` — build Next.js
- `npm run start` — start production local
- `npm run lint` — eslint
- `git status` / `git diff` / `git log` / `git branch` — leitura git

### 🟡 Confirma antes

- `npm install <pacote>` — nova dependência
- DDL em qualquer schema `pulso_*` via Management API
- Qualquer comando que toque `cron.job` (worker já travou uma vez por JSON malformado)
- Operações em `net._http_response` (limpeza pode esconder problemas)
- Trigger manual de `processar-fila-auto`

### 🔴 Vermelho (NÃO fazer — exige autorização explícita)

- `git checkout main`, `git pull`, `git merge`, `git push` — **WIP de merge não resolvido na main**
- `git push --force`
- `git commit`
- **`cron.unschedule` em job ativo** sem backup do código + plano de rollback (jobid=10 é o atual após fix)
- DELETE em `ideias` / `roteiros` / `producao` (49 itens agendados em produção)
- **PUBLICAR vídeo em rede social** (YouTube/TikTok/Instagram) — R-011 absoluto, exige aprovação humana
- Reset/truncate em qualquer schema `pulso_*`
- Modificar `.env` em produção (Vercel dashboard)
- `dangerouslySetInnerHTML` sem DOMPurify (hook T-005 bloqueia — R-024)
- `execute_sql` com template literal interpolado (hook T-005 bloqueia — R-024)

## 7. Identidade visual (NÃO é Clearix Lens)

Pulso tem **identidade visual própria** — não segue R-014 / clearix_design.

- **Personagem-mascote:** Pulso (faceless YouTube Shorts content)
- **Verticais visuais:** Dark explícito + Dark/Mistério + Curiosidade + Motivacional + Educacional + Infantil
- **5 frases proibidas no posicionamento** (oficial em `docs/40_PRODUTO/90_APOIO/`):
  - ✗ "fábrica de canais dark"
  - ✗ "autopost em tudo"
  - ✗ "viral garantido"
  - ✗ "monetização automática"
  - ✗ "escala sem equipe"

## 8. Pendências de validação manual (do Spec §14)

- [ ] Origem dos 507K views (seed? canais externos importados? quais?)
- [ ] Status dos 9 erros recentes em workflows (resolvíveis? bug de TTS específico?)
- [ ] Status da tabela/migration que está bloqueando `gerar-audio`
- [ ] **Decisão estratégica:** Pulso como motor interno DIGIAI vs canais autônomos (Backlog Executivo 04/2026)
- [ ] Confirmar hospedagem (Vercel presumido)
- [ ] Validar que pg_cron jobid=10 segue processando após o fix de 22/05/2026

## 9. Edge Functions / API Routes (`app/api/`)

| Endpoint | Função | Risco |
|---|---|---|
| `/api/automation/coletar-metricas` | Coleta métricas das redes sociais | 🟡 |
| `/api/automation/gerar-audio` | TTS via OpenAI/ElevenLabs (WF02) | 🟡 |
| `/api/automation/gerar-ideias` | Geração via GPT-4/Claude (WF00) | 🟢 |
| `/api/automation/gerar-roteiro` | Roteiro via IA (WF01) | 🟢 |
| `/api/automation/orchestrator` | Orquestrador central | 🟡 |
| `/api/automation/publicar` | Publica nas redes (WF04) | 🔴 **R-011 — sempre confirmar** |
| `/api/automation/relatorio` | Geração de relatórios | 🟢 |
| `/api/automation/webhooks` | Endpoints de retorno (n8n, manus) | 🟡 |

## 10. Dependências externas

| Serviço | Variáveis | Uso |
|---|---|---|
| n8n | 11 vars (URL, API_KEY, LOCAL_URL, MCP_URL, WEBHOOK_BASE + 5 específicos + 2 legacy) | Workflows legados (parou nov/2025) |
| OpenAI | `OPENAI_API_KEY` | GPT-4o + TTS |
| Anthropic | `ANTHROPIC_API_KEY` | Claude (alternativa) |
| ElevenLabs | `ELEVENLABS_API_KEY` | TTS premium (opcional) |
| Manus | `MANUS_WEBHOOK_URL` + `MANUS_API_KEY` | Browser automation pra publicar |
| YouTube | `YOUTUBE_API_KEY` + `CLIENT_ID` + `CLIENT_SECRET` | Publicação |
| TikTok | `TIKTOK_CLIENT_KEY` + `CLIENT_SECRET` | Publicação |
| Instagram | `INSTAGRAM_ACCESS_TOKEN` | Publicação |

## 11. Pergunta de Ouro e antipatterns

> *Isso ajuda o Pulso a sair do travamento de 04/12/2025 e voltar a produzir conteúdo end-to-end, alinhado com a tese de "motor de mídia interno da DIGIAI"?*

### NÃO fazer

- Tocar `main` sem resolver WIP de merge primeiro
- Adicionar 4ª camada histórica de workflows (já tem n8n + WF manual + nativa pg_cron + analytics)
- Publicar em rede social sem aprovação humana (R-011 absoluto)
- Esquecer que pg_cron tem histórico de quebrar silenciosamente (jobid=9 caiu por JSON malformado)
- Tratar Pulso como SaaS — é operação interna DIGIAI

## 12. Skill embedded

- Pasta `skills/supabase-postgres-best-practices/` dentro do projeto — padrão de skill versionada junto com código (preservar)

---

## Notas para quem mantém este arquivo

- **Última atualização:** 2026-05-25
- **Owner deste arquivo:** quem mantém Pulso

> Em caso de dúvida, **pause e pergunte ao humano**. Pulso publica em rede social pública da DIGIAI — erro vira post real que afeta marca.
