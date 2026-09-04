# O cron da publicação mora no Postgres, não na Vercel

**Decidido em 09/08/2026**, depois de dois dias perdidos e do dia 61 do Desafio dos 100 Dias sem
publicação. Padrão copiado do `limelight_studio` (`docs/migrations/010_cron_tick.sql`).

---

## Por que não é cron da Vercel

O projeto está no plano **Hobby**, e ele quebra o agendamento de duas formas — as duas silenciosas.

**Tentativa 1 — `"schedule": "5 * * * *"` (de hora em hora).**
A Vercel recusa o deploy inteiro:

> Hobby accounts are limited to daily cron jobs. This cron expression (5 * * * *) would run more
> than once per day.

Pelo caminho do GitHub a recusa **não aparece**: nenhum build na lista, nem como "Error", nada na
Activity, nada nas notificações. Cinco commits ficaram fora de produção por dois dias. Quem
denunciou foi comparar o HTTP das rotas — a nova dava 404, as vizinhas 401 — e a **CLI**, que
imprime o motivo que o painel esconde.

**Tentativa 2 — três crons diários (15:05, 21:05, 00:05 UTC).**
O deploy passou, os três apareceram no painel em Settings → Cron Jobs, e **nenhum executou**. Não
é o projeto: no mesmo dia o `coletar-metricas` renovou o token do TikTok às 11:40 UTC. É limite de
cron do Hobby mordendo os jobs novos, sem avisar. Custou o dia 61.

## O que está no ar

Job `pulso-publicar-agendados` no `cron.job` do Postgres, **de hora em hora** no minuto 5:

```sql
select cron.schedule(
  'pulso-publicar-agendados',
  '5 * * * *',
  $cmd$
  select net.http_post(
    url := 'https://pulsoprojects.vercel.app/api/automation/publicar-agendados',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'pulso_webhook_secret')
    ),
    body := jsonb_build_object('disparo', 'pg_cron'),
    timeout_milliseconds := 60000
  );
  $cmd$
);
```

Extensões já instaladas no projeto: `pg_cron 1.6.4`, `pg_net 0.19.5`, `supabase_vault 0.3.1`.

## Os outros três jobs — o cérebro diário (04/09/2026)

Migration: [`docs/migrations/059_cerebro_diario.sql`](../migrations/059_cerebro_diario.sql).

| Hora (UTC) | Job | O que faz |
|---|---|---|
| 06:10–06:40 | coletas por rede | já existiam — trazem o número do dia |
| 07:00 | `pulso-aprender-diario` | reescreve `aprendizado_cerebro` (o gerador de ideias lê) |
| 07:15 | `pulso-decisor-parecer` | reescreve `decisor_parecer` (a leitura do dia) |
| 10:30 | `pulso-popular-agenda` | já existia — reranqueia o plano |
| 10:45 | `pulso-decisor-sombra` | **mede** o que o Decisor trocaria na fila — **não mexe** |

A sombra ficou **depois** do `popular-agenda`, não de manhã: às 07:30 ela leria o plano montado às
10:30 do dia anterior — o erro de "decidir com o dado da véspera" que ela existe para evitar.

**A ordem é o ponto.** Coletar antes de aprender, aprender antes de opinar, opinar antes de
agendar. Fora dessa ordem cada peça decide com o dado da véspera.

**Por que existiram:** em 04/09 o `aprendizado_cerebro` estava com **98 horas** (parado desde
31/08) porque só era reescrito por clique — e é ele que diz ao gerador COMO escrever. O
`decisor_parecer` tinha a mesma dependência.

**Por que o terceiro nasce em sombra:** ninguém mediu ainda quanto o ranking muda de um dia para o
outro. O job grava em `logs_workflows` (`DECISOR_SOMBRA`) o que trocaria, sem trocar. Depois de uns
dias o número aparece e a histerese é calibrada em cima do comportamento real. Para dar o volante:
trocar `sombra` por `confirmar` + `realinhar` no corpo do job 3.

**De hora em hora é de propósito.** Quem decide o que sai são as travas da rota (teto diário +
janela de atraso de 12h), não o horário do cron. Assim nenhum slot da grade depende de um disparo
específico acontecer.

## O segredo: `x-webhook-secret`, não Bearer

**`CRON_SECRET` não autentica.** Medido: 11 caracteres, e `Authorization: Bearer <CRON_SECRET>`
devolve **401**. O `WEBHOOK_SECRET` (42 caracteres) devolve **200**. O `guardApi` aceita os dois
caminhos, mas só o segundo funciona nesta conta.

O valor vive no **Vault** (`vault.decrypted_secrets`, nome `pulso_webhook_secret`) — nunca em
migration nem no repositório. Para recriar:

```bash
npx vercel env pull <arquivo> --environment=production --yes
# e então, via Management API:
# select vault.create_secret('<WEBHOOK_SECRET>', 'pulso_webhook_secret', '...');
```

## Prova de vida obrigatória

A rota grava em `logs_workflows` (`PUBLICAR_AGENDADOS`) em **toda** rodada, inclusive
`status = 'ocioso'` quando não há nada vencido. Sem isso não dá para distinguir *"não tinha o que
publicar"* de *"o cron não rodou"* — foi exatamente essa dúvida que custou dois dias.

Duas armadilhas encontradas ao implementar, ambas do mesmo tipo:

- `logs_workflows.status` tinha `CHECK (sucesso|erro|em_andamento)`. O `'ocioso'` novo **e o
  `'parcial'` que já estava no código desde o início** violavam o CHECK. O CHECK foi ampliado.
- O insert usava `.then(()=>{}, ()=>{})`, engolindo o erro. Ou seja: o log criado para acabar com
  o silêncio falhava em silêncio. Agora reporta no console.

## Como verificar

```sql
select jobid, jobname, schedule, active from cron.job;
select status_code, left(content,200) from net._http_response order by id desc limit 5;
```

```sql
select created_at, status, detalhes from pulso_content.logs_workflows
where workflow_name = 'PUBLICAR_AGENDADOS' order by created_at desc limit 10;
```

Se `logs_workflows` não recebe linha há mais de uma hora, **o cron parou** — não é falta de
conteúdo.

## O que sobrou no vercel.json

Os 14 crons antigos, que comprovadamente executam. Os três de `publicar-agendados` foram
removidos: duas fontes de verdade disparando a mesma coisa é pior que uma.

> **Regra:** enquanto o plano for Hobby, **não adicione cron novo no `vercel.json`.** Frequência
> sub-diária quebra o deploy inteiro; frequência diária passa no deploy e não executa. Cron novo
> vai para o `pg_cron`.
