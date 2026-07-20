# Roteamento documental operacional

Antes de qualquer alteracao neste app, leia tambem:

D:\projetos\Cockpit\Apps\pulso_control\README.md

O app/codigo/filesystem e a verdade factual. O Cockpit e a fonte documental operacional. Se divergirem, o app vence e o Cockpit deve ser atualizado no mesmo turno.

---
# AGENTS.md â€” pulso_control

> **Porta de entrada padronizada** para qualquer agente IA (Claude, Cursor, Cline, Copilot, Aider) entrando neste app. ConvenÃ§Ã£o definida em [ADR-0024](../Cockpit/ADR/ADR-0024-agents-md-por-app-aguardando-design-system.md).
>
> Criado em 2026-05-25 (replicaÃ§Ã£o do padrÃ£o piloto `clearix_hub/AGENTS.md` adaptado para app nÃ£o-Clearix).
>
> âš  **ATENÃ‡ÃƒO ABSOLUTA:** segundo a Spec, hÃ¡ "WIP de merge nÃ£o resolvido na main" â€” **NÃƒO TOCAR** no estado da branch sem confirmaÃ§Ã£o explÃ­cita do dono. Trabalhar sempre em branch separada.

---

## 1. O que Ã© (1 frase)

Centro de comando editorial para criar e operar canais de vÃ­deos curtos faceless com **Pulso** como personagem-mascote â€” atualmente em **MODO FOCO** no canal "PULSO MistÃ©rios & HistÃ³ria" (YouTube Shorts), com 10 canais cadastrados e 131 ideias no portfolio.

## 2. PosiÃ§Ã£o na DIGIAI

- **Verdade CanÃ´nica que rege:** *"Pulso trabalha primeiro a favor da DIGIAI"* (MÃ‰DIO)
- **Fase atual do app:** ProduÃ§Ã£o parcial **TRAVADA** â€” sistema parou em 04/12/2025; fix do pg_cron aplicado em 2026-05-22 (jobid=10), mas pipeline de vÃ­deoâ†’publicaÃ§Ã£o nunca rodou end-to-end
- **Prioridade na matriz:** **MÃ‰DIA** (motor de mÃ­dia interno â€” pendÃªncia estratÃ©gica entre alimentar DIGIAI vs canais autÃ´nomos)
- **Categoria portfÃ³lio:** ALAVANCA CRÃTICA / INCUBAÃ‡ÃƒO (depende de decisÃ£o estratÃ©gica documentada no Backlog Executivo digiai 04/2026)
- **Pacote comercial:** **nÃ£o aplicÃ¡vel** (operaÃ§Ã£o interna DIGIAI, nÃ£o SaaS)

## 3. Onde estÃ¡ a verdade (leituras obrigatÃ³rias antes de editar)

- **Spec prÃ³pria:** [`../Cockpit/Spec/pulso_control.md`](../Cockpit/Spec/pulso_control.md) â€” **fonte canÃ´nica** (sweep completo do navegador 2026-05-22 com 14 seÃ§Ãµes de gaps verificados)
- **Doc canÃ´nico crÃ­tico:** `pulso_control/docs/40_PRODUTO/90_APOIO/CRITICA_VIABILIDADE_CANAIS_DARK_2026.md` (sistema interno editorial 7/10 viÃ¡vel vs fÃ¡brica dark multi-rede 3/10)
- **ADRs aplicÃ¡veis:** âš  A confirmar â€” sem ADR especÃ­fico do Pulso ainda
- **Regras Harness crÃ­ticas:**
  - **R-001** â€” `docs/` obrigatÃ³rio (existe com convenÃ§Ã£o numerada `00_MESTRE`/`10_SETUP`/etc â€” **nÃ£o padronizar agora**)
  - **R-003** â€” nÃ£o commit sem pedido
  - **R-004** â€” aÃ§Ã£o destrutiva exige confirmaÃ§Ã£o (worker pg_cron + 49 publicaÃ§Ãµes agendadas)
  - **R-005** â€” UI verificada no navegador (Spec jÃ¡ tem auditoria completa)
  - **R-010** â€” Pergunta de Ouro
  - **R-011** â€” AI nunca publica direto (Pulso publica em redes sociais â€” cuidado MÃXIMO com R-011: publicaÃ§Ã£o real exige autorizaÃ§Ã£o humana)
  - **R-024** â€” Baseline AppSec (OWASP Top 10): RLS Â· parametrized queries Â· webhooks com signature Â· headers de seguranÃ§a Â· `dangerouslySetInnerHTML` e `execute_sql` interpolado bloqueados por hook T-005
- **NÃƒO se aplica:** R-014 (clearix_design). Pulso tem identidade visual prÃ³pria â€” nÃ£o Ã© Clearix.
- **NÃƒO se aplica:** R-009 (banco Clearix). Pulso tem banco prÃ³prio (`nlcisbfdiokmipyihtuz`).

## 4. Stack + dev

- **Stack:** **Next.js 16.2.1** (App Router) + React 19.2 + TypeScript 5 + Tailwind 4 + Supabase + React Query + Zustand + `@antv/x6` + `@xyflow/react` (workflows/grafos) + `react-d3-tree` + `vis-network` (organograma) + recharts + `react-big-calendar` + `@dnd-kit` (kanban) + react-markdown + remark-gfm + `pg` 8.16 (Postgres direto) + babel-plugin-react-compiler 1.0
- **Porta dev:** **3004** (definida pelo dono em runbook; Next.js default 3000 conflita com Hub/digiai). Comando: `npx next dev --port=3004`
- **URL produÃ§Ã£o:** âš  A confirmar â€” Spec presume Vercel (`docs/10_SETUP/VERCEL_ENV_SETUP.md` existe)
- **Como rodar:** `npx next dev --port=3004`
- **Hospedagem:** Vercel presumido (a confirmar)
- **CI/CD:** âš  A confirmar

## 5. Banco + permissÃµes

- **Projeto Supabase:** **`nlcisbfdiokmipyihtuz`** (banco prÃ³prio do Pulso â€” **NÃƒO Clearix**)
- **MCP Supabase tem acesso direto?** **âŒ NÃ£o** (R-012 â€” MCP sÃ³ vÃª banco Clearix). OperaÃ§Ãµes DB neste app via SDK Supabase normal + `pg` (cliente direto).
- **PAT local em `.env`?** Sim â€” usado para Management API (foi crÃ­tico no fix do pg_cron em 22/05/2026)
- **Schemas que o app toca:**
  - `pulso_core`, `pulso_content`, `pulso_assets`, `pulso_distribution`, `pulso_automation`, `pulso_analytics`
- **Auth:** Supabase Auth (dashboard acessÃ­vel sem login nesta sessÃ£o â€” anon mostra dados)
- **Tabela crÃ­tica:** `cron.job` + `cron.job_run_details` (pg_cron) â€” fix do jobid=10 aplicado 22/05/2026, monitorar

## 6. Comandos

### âœ… Verde (rodar sem confirmar)

- `npm install` â€” primeira vez
- `npx next dev --port=3004` â€” dev local
- `npm run build` â€” build Next.js
- `npm run start` â€” start production local
- `npm run lint` â€” eslint
- `git status` / `git diff` / `git log` / `git branch` â€” leitura git

### ðŸŸ¡ Confirma antes

- `npm install <pacote>` â€” nova dependÃªncia
- DDL em qualquer schema `pulso_*` via Management API
- Qualquer comando que toque `cron.job` (worker jÃ¡ travou uma vez por JSON malformado)
- OperaÃ§Ãµes em `net._http_response` (limpeza pode esconder problemas)
- Trigger manual de `processar-fila-auto`

### ðŸ”´ Vermelho (NÃƒO fazer â€” exige autorizaÃ§Ã£o explÃ­cita)

- `git checkout main`, `git pull`, `git merge`, `git push` â€” **WIP de merge nÃ£o resolvido na main**
- `git push --force`
- `git commit`
- **`cron.unschedule` em job ativo** sem backup do cÃ³digo + plano de rollback (jobid=10 Ã© o atual apÃ³s fix)
- DELETE em `ideias` / `roteiros` / `producao` (49 itens agendados em produÃ§Ã£o)
- **PUBLICAR vÃ­deo em rede social** (YouTube/TikTok/Instagram) â€” R-011 absoluto, exige aprovaÃ§Ã£o humana
- Reset/truncate em qualquer schema `pulso_*`
- Modificar `.env` em produÃ§Ã£o (Vercel dashboard)
- `dangerouslySetInnerHTML` sem DOMPurify (hook T-005 bloqueia â€” R-024)
- `execute_sql` com template literal interpolado (hook T-005 bloqueia â€” R-024)

## 7. Identidade visual (NÃƒO Ã© Clearix Lens)

Pulso tem **identidade visual prÃ³pria** â€” nÃ£o segue R-014 / clearix_design.

- **Personagem-mascote:** Pulso (faceless YouTube Shorts content)
- **Verticais visuais:** Dark explÃ­cito + Dark/MistÃ©rio + Curiosidade + Motivacional + Educacional + Infantil
- **5 frases proibidas no posicionamento** (oficial em `docs/40_PRODUTO/90_APOIO/`):
  - âœ— "fÃ¡brica de canais dark"
  - âœ— "autopost em tudo"
  - âœ— "viral garantido"
  - âœ— "monetizaÃ§Ã£o automÃ¡tica"
  - âœ— "escala sem equipe"

## 8. PendÃªncias de validaÃ§Ã£o manual (do Spec Â§14)

- [ ] Origem dos 507K views (seed? canais externos importados? quais?)
- [ ] Status dos 9 erros recentes em workflows (resolvÃ­veis? bug de TTS especÃ­fico?)
- [ ] Status da tabela/migration que estÃ¡ bloqueando `gerar-audio`
- [ ] **DecisÃ£o estratÃ©gica:** Pulso como motor interno DIGIAI vs canais autÃ´nomos (Backlog Executivo 04/2026)
- [ ] Confirmar hospedagem (Vercel presumido)
- [ ] Validar que pg_cron jobid=10 segue processando apÃ³s o fix de 22/05/2026

## 9. Edge Functions / API Routes (`app/api/`)

| Endpoint | FunÃ§Ã£o | Risco |
|---|---|---|
| `/api/automation/coletar-metricas` | Coleta mÃ©tricas das redes sociais | ðŸŸ¡ |
| `/api/automation/gerar-audio` | TTS via OpenAI/ElevenLabs (WF02) | ðŸŸ¡ |
| `/api/automation/gerar-ideias` | GeraÃ§Ã£o via GPT-4/Claude (WF00) | ðŸŸ¢ |
| `/api/automation/gerar-roteiro` | Roteiro via IA (WF01) | ðŸŸ¢ |
| `/api/automation/orchestrator` | Orquestrador central | ðŸŸ¡ |
| `/api/automation/publicar` | Publica nas redes (WF04) | ðŸ”´ **R-011 â€” sempre confirmar** |
| `/api/automation/relatorio` | GeraÃ§Ã£o de relatÃ³rios | ðŸŸ¢ |
| `/api/automation/webhooks` | Endpoints de retorno (n8n, manus) | ðŸŸ¡ |

## 10. DependÃªncias externas

| ServiÃ§o | VariÃ¡veis | Uso |
|---|---|---|
| n8n | 11 vars (URL, API_KEY, LOCAL_URL, MCP_URL, WEBHOOK_BASE + 5 especÃ­ficos + 2 legacy) | Workflows legados (parou nov/2025) |
| OpenAI | `OPENAI_API_KEY` | GPT-4o + TTS |
| Anthropic | `ANTHROPIC_API_KEY` | Claude (alternativa) |
| ElevenLabs | `ELEVENLABS_API_KEY` | TTS premium (opcional) |
| Manus | `MANUS_WEBHOOK_URL` + `MANUS_API_KEY` | Browser automation pra publicar |
| YouTube | `YOUTUBE_API_KEY` + `CLIENT_ID` + `CLIENT_SECRET` | PublicaÃ§Ã£o |
| TikTok | `TIKTOK_CLIENT_KEY` + `CLIENT_SECRET` | PublicaÃ§Ã£o |
| Instagram | `INSTAGRAM_ACCESS_TOKEN` | PublicaÃ§Ã£o |

## 11. Pergunta de Ouro e antipatterns

> *Isso ajuda o Pulso a sair do travamento de 04/12/2025 e voltar a produzir conteÃºdo end-to-end, alinhado com a tese de "motor de mÃ­dia interno da DIGIAI"?*

### NÃƒO fazer

- Tocar `main` sem resolver WIP de merge primeiro
- Adicionar 4Âª camada histÃ³rica de workflows (jÃ¡ tem n8n + WF manual + nativa pg_cron + analytics)
- Publicar em rede social sem aprovaÃ§Ã£o humana (R-011 absoluto)
- Esquecer que pg_cron tem histÃ³rico de quebrar silenciosamente (jobid=9 caiu por JSON malformado)
- Tratar Pulso como SaaS â€” Ã© operaÃ§Ã£o interna DIGIAI

## 12. Skill embedded

- Pasta `skills/supabase-postgres-best-practices/` dentro do projeto â€” padrÃ£o de skill versionada junto com cÃ³digo (preservar)

---

## Notas para quem mantÃ©m este arquivo

- **Ãšltima atualizaÃ§Ã£o:** 2026-05-25
- **Owner deste arquivo:** quem mantÃ©m Pulso

> Em caso de dÃºvida, **pause e pergunte ao humano**. Pulso publica em rede social pÃºblica da DIGIAI â€” erro vira post real que afeta marca.

