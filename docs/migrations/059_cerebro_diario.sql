-- 059_cerebro_diario.sql — 2026-09-04
--
-- O DECISOR VIRA O CÉREBRO: três crons diários que tiram o pensamento do botão.
--
-- POR QUE: em 04/09/2026 medimos a idade do que o app "sabe". A ordem da fila já era recalculada
-- sozinha (POPULAR_AGENDA rodava havia 48 min), mas duas peças do cérebro dependiam de clique:
--   · decisor_parecer     — a leitura escrita, fresca só porque o dono tinha clicado naquele dia
--   · aprendizado_cerebro — o texto que o GERADOR DE IDEIAS lê para saber COMO escrever: 98 HORAS
--                           parado, desde 31/08
-- O apodrecimento do aprendizado_cerebro já tinha sido diagnosticado em 27/08 (3,4 dias na época)
-- e a resposta de então foi criar o briefing ao vivo para andar do lado dele. Consertou a metade
-- viva; a metade escrita voltou a envelhecer, porque continuava dependendo de alguém lembrar.
--
-- A ORDEM ENTRE OS TRÊS É O PONTO. Coletar antes de aprender, aprender antes de opinar, opinar
-- antes de agendar. Fora dessa ordem cada peça decide com o dado da véspera — que é exatamente o
-- problema de hoje, só que automatizado e mais difícil de enxergar.
--
--   06:40 UTC  COLETAR_METRICAS  (já existia)
--   07:00 UTC  aprender          -> reescreve aprendizado_cerebro
--   07:15 UTC  decisor/analisar  -> reescreve decisor_parecer
--   07:30 UTC  comprometer       -> MODO SOMBRA (mede, não mexe)
--
-- O TERCEIRO NASCE EM SOMBRA DE PROPÓSITO. O dono quer o Decisor remanejando a fila sozinho, e a
-- máquina para isso está pronta — mas falta um número: quanto o ranking muda de um dia para o
-- outro. Se muda pouco, remanejar toda noite compra pouco e adiciona risco. O modo sombra roda a
-- decisão inteira e grava em logs_workflows (DECISOR_SOMBRA) o que ele TROCARIA, sem tocar em
-- nada. Uma semana disso responde com dado, e aí a histerese é calibrada em cima do comportamento
-- real. Para dar o volante: trocar "sombra" por "confirmar" + "realinhar" no job 3.
--
-- Padrão de cron: pg_cron + pg_net + vault, igual ao pulso-publicar-agendados
-- (ver docs/20_BANCO/CRON_PUBLICACAO.md). Cron da Vercel no plano Hobby não serve: sub-diário
-- derruba o deploy e diário passa sem executar.

-- 1) APRENDER — reescreve o digest que o gerador de ideias lê
select cron.schedule(
  'pulso-aprender-diario',
  '0 7 * * *',
  $cmd$
  select net.http_post(
    url := 'https://pulsoprojects.vercel.app/api/automation/aprender',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'pulso_webhook_secret')
    ),
    body := jsonb_build_object('disparo', 'pg_cron'),
    timeout_milliseconds := 120000
  );
  $cmd$
);

-- 2) PARECER — o analista relê os fatos e reescreve a leitura do dia
select cron.schedule(
  'pulso-decisor-parecer',
  '15 7 * * *',
  $cmd$
  select net.http_post(
    url := 'https://pulsoprojects.vercel.app/api/decisor/analisar',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'pulso_webhook_secret')
    ),
    body := jsonb_build_object('disparo', 'pg_cron'),
    timeout_milliseconds := 120000
  );
  $cmd$
);

-- 3) DECISOR NA FILA — em SOMBRA. Mede a decisão, não executa.
select cron.schedule(
  'pulso-decisor-sombra',
  '30 7 * * *',
  $cmd$
  select net.http_post(
    url := 'https://pulsoprojects.vercel.app/api/agenda/comprometer',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'pulso_webhook_secret')
    ),
    body := jsonb_build_object('sombra', true, 'disparo', 'pg_cron'),
    timeout_milliseconds := 120000
  );
  $cmd$
);

-- CONFERÊNCIA (rodar depois de aplicar):
--   select jobid, jobname, schedule, active from cron.job order by jobname;
--
-- O QUE A SOMBRA ESTÁ DIZENDO (rodar daqui a alguns dias):
--   select created_at,
--          detalhes->>'trocaria'   as trocaria,
--          detalhes->>'candidatos' as candidatos,
--          detalhes->>'sem_slot'   as sem_slot
--     from pulso_content.logs_workflows
--    where workflow_name = 'DECISOR_SOMBRA'
--    order by created_at desc;
--
-- PARA DESLIGAR QUALQUER UM:
--   select cron.unschedule('pulso-aprender-diario');
