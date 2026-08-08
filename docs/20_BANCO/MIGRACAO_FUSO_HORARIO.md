# Migração de fuso horário — adiada para depois do dia 100 (17/09/2026)

**Decisão do dono em 08/08/2026:** não mexer no schema durante o Desafio dos 100 Dias. O que
causava dano de comportamento já foi resolvido no código; o que sobra é cosmético.

---

## O problema, em uma frase

38 colunas de data em 20 tabelas são `timestamp WITHOUT time zone`. O Postgres guarda o número
e descarta o fuso, então quem lê decide o significado — e cada leitor decide diferente.

**Prova medida:** um roteiro criado às **09:09 BRT** guardou `2026-08-07 12:09:14` (UTC). O app,
rodando no navegador em BRT, exibe **12:09**. Erro de 3 horas em toda data de criação da interface.

**O caso grave, já corrigido:** `pipeline_producao.data_publicacao_planejada`. Um agendamento
marcado para 11:00 é lido como 11:00 na máquina do dono (BRT) e como 11:00 UTC = **08:00 BRT** na
Vercel. Toda publicação agendada sairia 3 horas adiantada, sem nada no log denunciando. Resolvido
em `app/api/automation/publicar-agendados/route.ts` (a rota assume BRT explicitamente), antes de
o cron rodar pela primeira vez.

## O que NÃO está afetado

`metricas_publicacao`, `leituras_metricas`, `configuracoes` e `logs_workflows` já são
`timestamptz`. **Toda a analítica está correta** — views, marcos, coleta, custo. O erro atinge
datas de criação e o agendamento, nada que alimente decisão editorial.

---

## As duas regras (é aqui que se erra)

Converter tudo com a mesma regra deslocaria metade do histórico em 3 horas, permanentemente.

### Grupo UTC — 33 colunas
Todas as `created_at`/`updated_at`, com default `timezone('utc', now())` ou `now()`. O conteúdo
já é UTC.

```sql
ALTER TABLE <t> ALTER COLUMN <c> TYPE timestamptz USING <c> AT TIME ZONE 'UTC';
ALTER TABLE <t> ALTER COLUMN <c> SET DEFAULT now();   -- 30 colunas têm default a normalizar
```

### Grupo Brasília — 5 colunas
Escritas pelo app com a intenção do dono (hora de parede), sem default.

- `pulso_content.pipeline_producao.data_publicacao_planejada`
- `pulso_content.pipeline_producao_backup_20251126.data_publicacao_planejada`
- `pulso_distribution.posts.data_agendada` · `.data_publicacao` · `.data_remocao` *(legado, 20 linhas)*

```sql
ALTER TABLE <t> ALTER COLUMN <c> TYPE timestamptz USING <c> AT TIME ZONE 'America/Sao_Paulo';
```

**A prova de que é BRT e não UTC:** das 16 linhas com agendamento, **14 são 18:00** — exatamente
um dos horários da grade (12h/18h/21h). Se o conteúdo fosse UTC, 18:00Z seria 15:00 BRT, que não
é horário de grade nenhum.

---

## O que fez a primeira tentativa falhar

```
ERROR: 0A000: cannot alter type of a column used by a view or rule
```

**35 views** dependem dessas colunas, várias encadeadas (`vw_pulso_pipeline_com_assets_v2` →
`vw_pulso_pipeline_base` → `pipeline_producao`). O Postgres exige derrubar todas, alterar, e
recriar na ordem certa.

Nada foi alterado — o SQL estava numa transação e ela abortou inteira no primeiro comando.

**`v_espelho_pulso` NÃO está entre elas.** O contrato consumido pelo painel digiai não é tocado.

---

## Roteiro para executar (quando chegar a hora)

1. `SELECT pg_get_viewdef(oid, true)` das 35 views → salvar num arquivo versionado
2. Montar o script: `DROP VIEW` na ordem inversa de dependência → os 38 `ALTER` → recriar as views
3. **Testar numa branch do Supabase antes de tocar produção** — é o passo que troca "torcer" por
   "verificado", e o único que justifica adiar em vez de improvisar
4. Guardar 5 datas conhecidas de antes e conferir depois da conversão

O SQL dos 38 ALTERs já foi gerado uma vez e validado por inspeção; o que falta é a parte das views.

---

## Enquanto não migra

A regra vive no código, em um lugar só: `horaMarcada()` em
`app/api/automation/publicar-agendados/route.ts`. Qualquer tela nova que leia
`data_publicacao_planejada` precisa usar a mesma conversão — é exatamente esse espalhamento que a
migração vem eliminar.
