# PROPOSTA — Descomissionamento do legado no banco (2026-07-31)

> **Status: PROPOSTA. Nada foi executado.** DROP é decisão do dono (R-004).
> Origem: item 5 do `_DESPACHO_DO_DIGIAI_2026-07-31.md` (R-032).
> Inventário re-verificado pelo agente do pulso_control em 31/07 via Management API — e ele
> **corrige o despacho em 3 pontos** (ver §3). Motivo da limpeza: agente novo lê `public.*`
> primeiro e conclui que o app morreu; já custou 3 rodadas de correção no painel do dono.

---

## 1. O que NÃO pode ser tocado (verificado em uso, 31/07)

| Objeto | Por quê |
|---|---|
| `public.v_espelho_pulso` | **Contrato em produção** do painel digiai (`app.digiai.app.br/#/marketing`). Mudança só via despacho R-032. |
| `public.canais` (view) | **Dependência do contrato** — o `v_espelho_pulso` lê dela (fonte declarada no despacho). |
| `public.vw_agenda_semanal` | 4 usos no código vivo (grade da agenda). |
| `public.vw_agenda_atribuicoes` | 1 uso (hook da agenda). |
| `public.vw_pulso_canais` | 2 usos (gerador de ideias — escolha de canal). |
| Schemas `pulso_content`, `pulso_core`, `pulso_analytics`, `pulso_assets`, `pulso_distribution` | O sistema vivo. |
| `pulso_analytics.leituras_metricas` | A série diária — fonte do ganho do dia e do radar. |

## 2. O legado, com evidência

| Objeto | Tipo | Estado verificado |
|---|---|---|
| `pulso_distribution.posts` | tabela (65 linhas) | último registro **16/06/2026** — substituída por `pulso_content.metricas_publicacao` |
| `pulso_analytics.metricas_diarias` | tabela (2.184 linhas) | snapshot CUMULATIVO (somar `views` infla ~37×); aposentada **20/07** — substituída por `leituras_metricas`. Zero leituras no código. |
| `pulso_automation.automation_queue` | tabela (0 linhas) | fila da era n8n, vazia |
| `pulso_automation.ai_config` | tabela (9 linhas) | config da era n8n |
| `pulso_content.workflow_queue` | tabela (0 linhas) | fila antiga, vazia |
| pg_cron jobs **1–7 e 10** | cron | **todos `active=false`** (confirmado) — apontam pra rotinas mortas |
| pg_cron job **8** `limpar-queue-antiga` | cron | ⚠ **AINDA ATIVO** (domingo 04h) — deleta de `pulso_automation.automation_queue`, que está vazia. Zumbi inofensivo, mas zumbi. *(O despacho não citou este.)* |
| ~40 views `public.vw_pulso_*` / `vw_roteiros*` / `vw_automation*` / `public.posts` / `public.metricas_diarias` etc. | views | **zero uso no código do app** (grep em app/ lib/ motor/) — só as 3 listadas na §1 são usadas |
| ~10 views `pulso_content.vw_*` (kanban/calendário antigos, `_v2`, thumbnails/personagens performance) | views | zero uso no código atual |

## 3. Onde o inventário CORRIGE o despacho

1. O schema **`pulso_automation` ainda existe** (o despacho o dava como inexistente) — contém `automation_queue` (vazia) e `ai_config`.
2. **`public.posts` e `public.metricas_diarias` são VIEWS**, não tabelas — as tabelas-base estão em `pulso_distribution.posts` e `pulso_analytics.metricas_diarias`.
3. "views `vw_pulso_*` duplicadas" **não pode virar DROP em bloco**: `vw_pulso_canais` está viva no gerador. Dropar por prefixo quebraria o app.

## 4. Plano proposto

### Fase 1 — imediata, reversível, sem perda (posso executar com um "sim" seu)

```sql
-- rótulo nas tabelas-base do legado (metadado; não muda comportamento)
comment on table pulso_distribution.posts is
  'LEGADO morto desde 2026-06-16 — fonte viva: pulso_content.metricas_publicacao. Proposta de drop: docs/20_BANCO/PROPOSTA_LIMPEZA_LEGADO_2026-07-31.md';
comment on table pulso_analytics.metricas_diarias is
  'LEGADO aposentado em 2026-07-20 — snapshots CUMULATIVOS (somar views infla ~37x). Fonte viva: pulso_analytics.leituras_metricas';
comment on table pulso_automation.automation_queue is 'LEGADO era n8n (vazia) — automação viva: Vercel Crons (vercel.json)';
comment on table pulso_content.workflow_queue is 'LEGADO (vazia) — automação viva: Vercel Crons';

-- desligar o único cron zumbi ainda ativo (limpa fila vazia todo domingo)
select cron.unschedule(8);

-- higiene: remover da lista os já inativos (não executam nada hoje)
select cron.unschedule(jobid) from cron.job where jobid in (1,2,3,4,5,6,7,10) and active = false;
```

### Fase 2 — DROP (só com sua decisão explícita; sugiro esperar 30 dias após a Fase 1)

Pré-checagens obrigatórias antes de qualquer DROP:
1. **`pulsohub` (repo do hub público)** — não vive neste repo; conferir se lê alguma view `public.*` antes de dropar qualquer uma.
2. Dependências no banco: `select * from pg_depend` sobre cada view candidata (view que alimenta view).
3. Backup: `docs/migrations/schema.sql` regenerado no dia (comando no README de lá).

Candidatos, em ordem de risco crescente:
```sql
-- 2a. views public.* sem uso no app (as ~40 fora da lista de protegidas da §1)
-- 2b. views pulso_content.vw_* antigas (kanban/calendário v1/v2 sem uso)
-- 2c. tabelas vazias: pulso_automation.automation_queue, pulso_content.workflow_queue
-- 2d. pulso_distribution.posts e pulso_analytics.metricas_diarias
--     (histórico morto; docs/migrations preserva o DDL. Se quiser o dado, exportar CSV antes)
-- 2e. schema pulso_automation inteiro (sobra só ai_config — migrar pra pulso_core.configuracoes antes)
```

## 5. O que este documento NÃO propõe

- Nenhuma mudança em `v_espelho_pulso` nem em qualquer objeto da §1.
- Nenhum DROP sem sua palavra. A Fase 1 é só rótulo + desligar cron inativo/zumbi.
