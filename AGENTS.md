# Roteamento documental operacional

Antes de qualquer alteracao neste app, leia tambem:

D:\projetos\Cockpit\Apps\pulso_control\README.md

O app/codigo/filesystem e a verdade factual. O Cockpit e a fonte documental operacional. Se divergirem, o app vence e o Cockpit deve ser atualizado no mesmo turno.

---
# AGENTS.md — pulso_control

> **Porta de entrada padronizada** para qualquer agente IA (Claude, Cursor, Cline, Copilot, Aider) entrando neste app. Convenção definida em [ADR-0024](../Cockpit/ADR/ADR-0024-agents-md-por-app-aguardando-design-system.md).
>
> Criado em 2026-05-25. **Reescrito em 2026-07-31** por despacho R-032 do agente do digiai
> (`_DESPACHO_DO_DIGIAI_2026-07-31.md`): a versão anterior dizia que o sistema estava travado
> desde 04/12/2025 — estava 7 meses desatualizada e **custou 3 rodadas de correção** no painel
> do dono, porque agente novo lia isto e concluía que o app morreu. Números abaixo verificados
> no banco em 2026-07-31.

---

## 1. O que é (1 frase)

Centro de comando editorial de uma **esteira 100% automática e viva** de vídeos curtos faceless (personagem-mascote **Pulso**), publicando diariamente em **5 redes** (YouTube, Instagram, Facebook, TikTok, Kwai) — 13 canais/verticais cadastrados, 193 ideias no portfólio, produção contínua há 51+ dias seguidos.

## 2. Posição na DIGIAI

- **Verdade Canônica que rege:** *"Pulso trabalha primeiro a favor da DIGIAI"* (MÉDIO)
- **Fase atual do app:** **OPERAÇÃO CONTÍNUA** — esteira ideia → roteiro → áudio → render → publicação → métricas rodando end-to-end desde ~10/06/2026 (Desafio dos 100 Dias, dia 1 = 10/06). Snapshot 2026-07-31: **475 publicações**, **289.528 views** (FB 133,5k · Kwai 48,6k · YT 43,5k · TikTok 32,4k · IG 31,5k), última publicação **hoje**.
- **Prioridade na matriz:** MÉDIA (motor de mídia interno)
- **Categoria portfólio:** ALAVANCA CRÍTICA — card no Portfólio do digiai (maturidade 92)
- **Pacote comercial:** não aplicável (operação interna DIGIAI, não SaaS)

### ⚠ Onde mora a verdade no banco — LEIA ANTES DE QUALQUER QUERY

- **VIVO:** schema **`pulso_content.*`** (`metricas_publicacao`, `pipeline_producao`, `ideias`, `roteiros`, `audios`, `videos`…) + `pulso_core.configuracoes` + `pulso_analytics.leituras_metricas` (série diária, a "joia").
- **LEGADO MORTO — NÃO USAR COMO FONTE:** `public.posts` (65 linhas, parado em 16/06/2026), `public.metricas_diarias` (snapshots CUMULATIVOS — somar `views` infla ~37×; parou 20/07), fila `automation_queue`, cron jobs pg_cron 1–7 e 10 (todos INATIVOS, apontando para schemas que nem existem mais), views `vw_pulso_*` duplicadas. Proposta de descomissionamento em `docs/20_BANCO/PROPOSTA_LIMPEZA_LEGADO_2026-07-31.md`.
- **CONTRATO EXTERNO:** `public.v_espelho_pulso` — view agregada criada pelo digiai (2026-07-31), **consumida em produção** por `app.digiai.app.br/#/marketing`. Se mudar schema/tabela de `pulso_content`, **atualize a view junto** — quebrá-la = tela vazia no painel do dono.

## 3. Onde está a verdade (leituras obrigatórias antes de editar)

- **Spec própria:** [`../Cockpit/Spec/pulso_control.md`](../Cockpit/Spec/pulso_control.md) — atualizada 2026-07-31 (era automática)
- **Memória operacional do agente:** o Claude Code deste app mantém memória persistente com ~50 fatos operacionais (gotchas de coleta, travas de orçamento, estratégia por rede). Padrões-chave duplicados na Spec.
- **ADRs aplicáveis:** ⚠ sem ADR específico do Pulso ainda
- **Regras Harness críticas:**
  - **R-001** — `docs/` obrigatório (convenção numerada `00_MESTRE`/`10_SETUP`/etc — não padronizar agora)
  - **R-003** — não commit sem pedido (o dono autoriza push por fase, rotineiramente)
  - **R-004** — ação destrutiva exige confirmação
  - **R-005** — UI verificada no navegador antes de declarar pronto
  - **R-010** — Pergunta de Ouro
  - **R-011** — AI nunca publica direto: a rota `/api/automation/publicar` exige `confirmar: true` e o fluxo é sempre autorizado pelo dono. **Facebook é 100% manual** (via API a Meta estrangula reels a ~0 de alcance — testado A/B em 11/07). Kwai não tem API (métrica entra por print lido pelo agente).
  - **R-024** — Baseline AppSec: RLS (anon é read-only desde 29/06) · parametrized queries · headers de segurança
- **NÃO se aplica:** R-014 (clearix_design) — Pulso tem identidade visual própria. R-009 (banco Clearix) — banco próprio.

## 4. Stack + dev

- **Stack:** Next.js 16.2.1 (App Router) + React 19.2 + TypeScript 5 + Tailwind 4 + Supabase + React Query + recharts + `@dnd-kit` (kanban) + react-markdown
- **Porta dev:** **3004** (`npx next dev --port=3004`) — 3000 conflita com Hub/digiai
- **URL produção:** `https://pulsoprojects.vercel.app` (Vercel, deploy automático no push da main)
- **Motor de render (LOCAL, não Vercel):** `motor/` no repo (cópia de segurança; runtime em `D:/tmp`) — `worker_render.py` roda por Tarefa Agendada do Windows (08/16/23h) e esvazia a fila de `EM_EDICAO`. Cascata de b-roll: **banco de clips → Pexels/Pixabay (grátis) → Wan/DashScope (barato) → Veo/Higgsfield (pago, último recurso)**. Gate humano: só renderiza o que o dono arrastou pra "Em Edição" no kanban.
- **Push:** `git push https://projectspulso@github.com/projectspulso/pulso_control.git main` (o `git push` puro trava pedindo credencial no /dev/tty)

## 5. Banco + permissões

- **Projeto Supabase:** `nlcisbfdiokmipyihtuz` (banco próprio do Pulso — NÃO Clearix)
- **Acesso do agente:** SDK Supabase + REST com `SUPABASE_SERVICE_ROLE_KEY` do `.env`. MCP Supabase é **read-only** (DDL via Management API com PAT, quando autorizado).
- **Schemas vivos:** `pulso_core`, `pulso_content`, `pulso_assets`, `pulso_distribution`, `pulso_analytics` (⚠ `pulso_automation` não existe mais — os cron jobs legados que apontam pra ele estão mortos)
- **Espelho documentado:** `docs/migrations/` (schema.sql + 56 migrations; regenerar com `node Cockpit/scripts/dump-db-mirror.mjs pulso_control`)
- **RLS:** anon é read-only nos 6 schemas desde 2026-06-29 (revoke aplicado após incidente de escrita aberta)

## 6. Automação viva — Vercel Crons (vercel.json), NÃO pg_cron

| Cron | Horário (UTC) | Função |
|---|---|---|
| `reconciliar-publicacoes` | 4×/dia (02:30, 10:50, 18:45*, 21:45*) | auto-descobre vídeo publicado por fora (matching de legenda/Jaccard, âncora IG) |
| `resolver-post-ids` | 02:40, 10:55 | conserta post_id placeholder |
| `coletar-metricas` | 11:00 | YouTube Data API + IG Graph + TikTok Display + FB video_insights |
| `status-contas` | 11:05 | snapshot diário de seguidores das 5 redes (`seguidores_historico`) |
| `decisor/analisar` | 11:20 | analista LLM do módulo /decisor (cache em configuracoes) |
| `aprender` | seg 11:30 | digest campeões → cérebro (few-shot do gerador) |
| `extrato-semanal` | seg 11:15 | custo semanal |
| `auto-funil` | 12:00 | ideias → roteiros (respeitando buffers) |
| `agenda/popular` | 12:30 | roteador da agenda (tema > retenção > idade; `lib/agenda/roteador.ts`) |
| `auto-audio` | 13:00 | TTS dos roteiros aprovados |

Gotcha recorrente: **cron da Vercel chama por GET** — toda rota de cron precisa exportar `GET` (rotas só-POST já congelaram o `aprender` por 23 dias sem ninguém notar).

## 7. Comandos

### ✅ Verde (rodar sem confirmar)
- `npm install` · `npx next dev --port=3004` · `npm run build` · `npm run lint`
- `git status` / `git diff` / `git log` — leitura git
- SELECTs no banco via service role

### 🟡 Confirma antes
- `npm install <pacote>` novo
- DDL em qualquer schema `pulso_*`
- Disparar `worker_render.py` fora do horário (gasta crédito se a cascata chegar no Veo)
- Gerar mídia paga (Higgsfield/Veo): **sempre dry-run de custo antes** (trava de orçamento: 600 cr/dia)

### 🔴 Vermelho (exige autorização explícita do dono)
- `git commit` / `git push` sem pedido (R-003 — na prática o dono pede push por fase)
- DELETE em `ideias`/`roteiros`/`pipeline_producao`/`metricas_publicacao`
- **PUBLICAR em rede social** — R-011; a rota exige `confirmar: true`
- Mexer em `public.v_espelho_pulso` (contrato do painel digiai) sem despacho R-032
- Reset/truncate em qualquer schema `pulso_*` · modificar env na Vercel

## 8. Identidade visual (NÃO é Clearix Lens)

- **Personagem-mascote:** Pulso (voz oficial ElevenLabs `GmzLAnPHSUkxG3P5yfca`, criada 14/06; lip-sync local em `motor/lipsync_pulso.py`, custo R$0)
- **Formato:** faceless, sem pessoas nas cenas (trava no gerador de cenas)
- 5 frases proibidas no posicionamento: ✗ "fábrica de canais dark" ✗ "autopost em tudo" ✗ "viral garantido" ✗ "monetização automática" ✗ "escala sem equipe"

## 9. API Routes principais (`app/api/`)

| Endpoint | Função | Risco |
|---|---|---|
| `/api/automation/publicar` | YT upload + IG Reels + TikTok inbox via API (FB fica de fora — manual) | 🔴 R-011, `confirmar: true` |
| `/api/automation/coletar-metricas` | métricas 5 redes + retenção + leituras diárias | 🟡 |
| `/api/automation/reconciliar-publicacoes` | descobre posts feitos por fora | 🟢 |
| `/api/automation/gerar-ideias` | GPT-4o + trava anti-duplicidade (lexical+semântica) + canal por desempenho | 🟢 |
| `/api/automation/gerar-roteiro` | roteiro com harness editorial + CTA variável | 🟢 |
| `/api/decisor` + `/api/decisor/analisar` | fatos determinísticos + analista LLM | 🟢 |
| `/api/agenda/popular` | roteador da agenda | 🟢 |
| `/api/metricas/kwai-perfil` | registro validado do perfil Kwai (print → agente; recusa queda >20%) | 🟡 |

## 10. Dependências externas vivas

| Serviço | Uso |
|---|---|
| OpenAI (`OPENAI_API_KEY`) | GPT-4o gerador + gpt-4o-mini analista (chave só na Vercel; local vazia) |
| ElevenLabs | TTS voz oficial do Pulso |
| Meta Graph API v23 | IG publish + insights; FB video_insights (⚠ `facebook_views` NÃO pode ir na mesma chamada de insights — derruba com "Fatal" subcode 2207086; vai em chamada separada) |
| YouTube Data v3 + Analytics (OAuth conta projectspulso) | upload, métricas, retenção |
| TikTok Display API (OAuth) | inbox upload + video.list |
| Pexels + Pixabay (grátis) | b-roll de acervo |
| Wan/DashScope (região Singapura) | b-roll barato |
| Higgsfield CLI (Veo 3.1 Lite) | b-roll pago, último recurso da cascata |
| ~~n8n~~ · ~~Manus~~ | **aposentados** (workflows legados, pararam em 2025) |

## 11. Pergunta de Ouro e antipatterns

> *Isso aumenta a chance de acerto no Facebook (o tema que sorteia), protege a integridade do dado, ou tira trabalho manual do dono — sem quebrar o contrato com o painel digiai?*

### NÃO fazer
- Ler `public.posts`/`public.metricas_diarias` como fonte (legado morto — engana)
- Somar `views` de `metricas_diarias` (snapshots cumulativos — infla ~37×)
- Publicar reel no Facebook via API (Meta estrangula a ~0; é fluxo manual)
- Derivar seguidor de métrica de post (`taxa_conversao × reach` errou 7,5×) — fonte é o contador em `seguidores_historico`
- Deixar erro de API virar 0 no banco (views nunca retrocede; trava no coletor)
- Criar ideia nova a partir de print do Kwai (legenda ≠ título gera fantasma; casar por número/thumbnail)
- Exemplo literal em prompt de geração (vira cópia literal — aconteceu com ganchos e CTA)

## 12. Skill embedded

- `skills/supabase-postgres-best-practices/` — skill versionada junto com o código (preservar)

---

## Notas para quem mantém este arquivo

- **Última atualização:** 2026-07-31 (reescrita por despacho R-032 do digiai; números verificados no banco nesta data)
- **Nota:** o aviso antigo de "WIP de merge não resolvido na main" foi verificado e **não procede mais** — working tree limpa, sem paths não-mesclados, main com push rotineiro autorizado.
- **Owner deste arquivo:** quem mantém Pulso

> Em caso de dúvida, **pause e pergunte ao humano**. Pulso publica em rede social pública da DIGIAI — erro vira post real que afeta marca.
