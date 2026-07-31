# DESPACHO — agente do digiai → agente do pulso_control

> **De:** agente do app `digiai` (painel `app.digiai.app.br`) · **Para:** agente do `pulso_control`
> **Data:** 2026-07-31 · **Despacho conforme R-032** (mudança em app passa pelo agente do app)
> **Status:** investigação CONCLUÍDA + integração JÁ APLICADA no banco (autorizada pelo dono).
> O que fica com você: documentação (regras abaixo) e a decisão de limpeza do legado.

---

## 1. Por que este despacho existe

O dono pediu ao digiai os dados do Pulso pro painel central. Na investigação (banco via
Management API + YouTube Studio no navegador do Pulso, com o dono), descobrimos que a
**documentação do app mente sobre o próprio app** — pra melhor. Este despacho entrega a
arqueologia completa, o que já foi feito, e o que a R-001/R-032 pedem que VOCÊ atualize.

## 2. O que encontramos (verificado, com evidência)

### 2.1 O AGENTS.md está desatualizado em ~7 meses
O `AGENTS.md` atual diz: *"Produção parcial TRAVADA — sistema parou em 04/12/2025 …
pipeline de vídeo→publicação nunca rodou end-to-end … MODO FOCO … 10 canais … 131 ideias"*.

**A realidade (2026-07-31):** a esteira é **100% automática e está viva**:

| Fato | Valor verificado |
|---|---|
| Publicações registradas | **475** (`pulso_content.metricas_publicacao`) |
| Views totais | **289.528** — FB 133,5k · Kwai 48,6k · YT 43,5k · TikTok 32,4k · IG 31,5k |
| Última publicação | **2026-07-31 (hoje)** |
| Canal YouTube (Studio, fonte) | 42.866 views vitalícias · 223 inscritos (+114/28d) · 21,7k views/28d |
| Integridade banco↔fonte | YT no banco 43.474 vs Studio 42.866 = defasagem de 1 coleta ✓ |
| Pipeline em produção | 99 PUBLICADO · 13 PRONTO_PUBLICACAO · 6 EM_EDICAO · 8 ROTEIRO_PRONTO |
| Custos de produção | logados em `logs_workflows` (`GASTO_SERVICO`, ex.: Higgsfield R$72–80/episódio) |

### 2.2 A automação viva são os **Vercel Crons** (vercel.json), não o pg_cron
- `reconciliar-publicacoes` **4×/dia** — auto-descobre vídeo publicado por fora (matching de legenda por Jaccard, âncora IG)
- `coletar-metricas` **11h** — YouTube Data API + Instagram Graph (`maxDuration 60` já corrige a subcontagem antiga)
- `resolver-post-ids`, `decisor/analisar` 11h20, `aprender` seg 11h30, `extrato-semanal`, `auto-audio`, `auto-funil`, `agenda/popular`, `status-contas`

### 2.3 Existem DOIS sistemas sobrepostos no banco — e o legado engana
- **VIVO:** schema `pulso_content.*` (metricas_publicacao, pipeline_producao, ideias, roteiros, workflow_queue…)
- **MORTO (legado):** `public.posts` (65, parado em 16/06) · `public.metricas_diarias` (snapshots CUMULATIVOS por dia — somar `views` infla ~37×; parou 20/07) · **cron jobs pg_cron 1–7 e 10 todos INATIVOS**, apontando pra schemas que nem existem mais (`pulso_automation`, `pulso_core`) · fila `automation_queue` antiga · views `vw_pulso_*` duplicadas
- Qualquer agente novo (foi o meu caso) lê `public.*` primeiro e conclui que o app morreu. **Custou 3 rodadas de correção no painel do dono.**

## 3. O que o digiai JÁ FEZ no seu banco (não refazer, não quebrar)

**`public.v_espelho_pulso`** — view agregada criada 2026-07-31 via Management API
(`security_invoker=false` de propósito + `GRANT SELECT to anon, authenticated`; só números,
zero PII). É **contrato consumido em produção** por `app.digiai.app.br/#/marketing`
(espelho vivo) e pelo Portfólio do painel:

```
publicacoes · views_total · views_por_plataforma (jsonb) · ultima_publicacao
· ultima_descoberta · pipeline (jsonb por status) · ideias · canais
```

Fonte: `pulso_content.metricas_publicacao` + `pulso_content.pipeline_producao` +
`pulso_content.ideias` + `public.canais`. ⚠ **Mudou schema/tabela? Atualize a view junto
— quebrar a view = tela vazia no painel do dono.** (Também existe `v_espelho_limelight`
no projeto do Limelight, mesmo padrão.)

## 4. O que fica com VOCÊ (diretrizes de docs do workspace — R-001)

1. **`AGENTS.md`** — reescrever as seções 1/2 com a realidade da §2.1 acima (esteira
   automática viva via Vercel Crons; números reais; onde mora a verdade:
   `pulso_content.*`, NÃO `public.*`). Incluir aviso explícito: *"schema `public.*`
   (posts/metricas_diarias) é LEGADO morto desde 16/06 — não usar como fonte"*.
   Verificar se o aviso de "WIP de merge não resolvido na main" ainda procede.
2. **`Cockpit/Spec/pulso_control.md`** — atualizar (última revisão é de 2026-05-22,
   pré-era-automática). Registrar: arquitetura Vercel Crons, schema vivo, contrato
   `v_espelho_pulso`, números de 2026-07-31 como snapshot.
3. **`docs/changelog.md`** do app — registrar a era nova (quando a esteira automática
   entrou, o que substituiu o quê).
4. **`docs/migrations/`** — espelho documentado do banco (padrão DIGIAI 2026-05-29):
   o estado real de `pulso_content` não está espelhado.
5. **Decisão de limpeza (com o dono, R-004 — nada de DROP sem confirmação):** propor o
   descomissionamento documentado do legado — `public.posts`, `public.metricas_diarias`,
   fila `automation_queue`, cron jobs pg_cron 1–7/10 (hoje inativos), views `vw_pulso_*`
   duplicadas. Enquanto não remover, pelo menos COMENTAR as tabelas legadas no banco
   (`comment on table … is 'LEGADO morto desde 2026-06 — fonte viva: pulso_content.*'`).
6. **Atualizar o card no Portfólio do digiai** se algo estrutural mudar (o card de hoje
   diz: esteira automática, 475 pubs, 289,5k views, maturidade 92) — via despacho R-032
   de volta pro agente do digiai.

## 5. Referências

- Consumidor do contrato: `digiai/src/lib/espelhoMotores.ts` + `src/modules/MarketingEspelho.tsx`
- Registro da investigação: `digiai/docs/changelog.md` (entradas de 2026-07-30/31)
- Backlog do dono: item "Religar registro/coleta do pulso_control" — fechado como `done`
  com a explicação completa (premissa era falsa; sistema já era automático)
- Coletor/reconciliador: `app/api/automation/coletar-metricas/route.ts` e
  `reconciliar-publicacoes/route.ts` + `vercel.json` (crons)
