-- =====================================================================
-- PARTE 6: pg_cron JOBS (8 jobs agendados)
-- Banco: nlcisbfdiokmipyihtuz
-- PRÉ-REQUISITO: Habilitar pg_cron e pg_net em
--   Dashboard → Database → Extensions → Buscar "pg_cron" → Enable
--   Dashboard → Database → Extensions → Buscar "pg_net" → Enable
-- =====================================================================

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Garantir acesso
GRANT USAGE ON SCHEMA cron TO postgres;

-- Limpar jobs antigos com mesmo nome (se existirem)
SELECT cron.unschedule(jobname) FROM cron.job
WHERE jobname IN (
  'gerar-ideias-diario', 'check-roteiros-pendentes', 'check-audios-pendentes',
  'publicar-conteudos', 'processar-retry-queue', 'coletar-metricas',
  'relatorio-semanal', 'limpar-queue-antiga'
);

-- JOB 1: Gerar ideias diariamente às 03:00 UTC
SELECT cron.schedule(
  'gerar-ideias-diario',
  '0 3 * * *',
  $$
  INSERT INTO pulso_automation.automation_queue (tipo, payload, origem)
  SELECT 'GERAR_IDEIAS',
         jsonb_build_object('canal_id', c.id, 'canal_nome', c.nome, 'quantidade', 5),
         'pg_cron'
  FROM pulso_core.canais c
  WHERE c.status = 'ATIVO'
    AND EXTRACT(DOW FROM NOW()) = (
      ABS(('x' || SUBSTR(c.id::text, 1, 8))::bit(32)::int) % 7
    )
  LIMIT 2;
  $$
);

-- JOB 2: Verificar ideias aprovadas sem roteiro (safety net, 5min)
SELECT cron.schedule(
  'check-roteiros-pendentes',
  '*/5 * * * *',
  $$
  INSERT INTO pulso_automation.automation_queue
    (tipo, payload, referencia_id, referencia_tipo, origem)
  SELECT 'GERAR_ROTEIRO',
    jsonb_build_object('ideia_id', i.id, 'canal_id', i.canal_id),
    i.id, 'ideia', 'pg_cron'
  FROM pulso_content.ideias i
  WHERE i.status = 'APROVADA'
    AND NOT EXISTS (
      SELECT 1 FROM pulso_content.roteiros r WHERE r.ideia_id = i.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM pulso_automation.automation_queue q
      WHERE q.referencia_id = i.id
        AND q.tipo = 'GERAR_ROTEIRO'
        AND q.status IN ('PENDENTE', 'PROCESSANDO')
    )
  LIMIT 5;
  $$
);

-- JOB 3: Verificar roteiros aprovados sem áudio (safety net, 10min)
SELECT cron.schedule(
  'check-audios-pendentes',
  '*/10 * * * *',
  $$
  INSERT INTO pulso_automation.automation_queue
    (tipo, payload, referencia_id, referencia_tipo, origem)
  SELECT 'GERAR_AUDIO',
    jsonb_build_object('roteiro_id', r.id, 'ideia_id', r.ideia_id),
    r.id, 'roteiro', 'pg_cron'
  FROM pulso_content.roteiros r
  WHERE r.status = 'APROVADO'
    AND NOT EXISTS (
      SELECT 1 FROM pulso_assets.assets a
      JOIN pulso_assets.conteudo_variantes_assets cva ON cva.asset_id = a.id
      WHERE a.tipo = 'AUDIO'
    )
    AND NOT EXISTS (
      SELECT 1 FROM pulso_automation.automation_queue q
      WHERE q.referencia_id = r.id
        AND q.tipo = 'GERAR_AUDIO'
        AND q.status IN ('PENDENTE', 'PROCESSANDO')
    )
  LIMIT 3;
  $$
);

-- JOB 4: Publicar conteúdos prontos (3x/dia)
SELECT cron.schedule(
  'publicar-conteudos',
  '0 6,12,18 * * *',
  $$
  INSERT INTO pulso_automation.automation_queue (tipo, payload, origem)
  VALUES ('PUBLICAR', '{}'::jsonb, 'pg_cron');
  $$
);

-- JOB 5: Processar retry queue (a cada 30min)
SELECT cron.schedule(
  'processar-retry-queue',
  '*/30 * * * *',
  $$
  UPDATE pulso_automation.automation_queue
  SET status = 'PENDENTE', updated_at = NOW()
  WHERE status = 'RETRY'
    AND proximo_retry <= NOW()
    AND tentativas < max_tentativas;
  $$
);

-- JOB 6: Coletar métricas (diário 22:00 UTC)
SELECT cron.schedule(
  'coletar-metricas',
  '0 22 * * *',
  $$
  INSERT INTO pulso_automation.automation_queue (tipo, payload, origem)
  VALUES ('COLETAR_METRICAS', '{}'::jsonb, 'pg_cron');
  $$
);

-- JOB 7: Relatório semanal (segunda 09:00 UTC)
SELECT cron.schedule(
  'relatorio-semanal',
  '0 9 * * 1',
  $$
  INSERT INTO pulso_automation.automation_queue (tipo, payload, origem)
  VALUES ('RELATORIO_SEMANAL', '{}'::jsonb, 'pg_cron');
  $$
);

-- JOB 8: Limpeza de itens antigos (semanal, domingo 04:00 UTC)
SELECT cron.schedule(
  'limpar-queue-antiga',
  '0 4 * * 0',
  $$
  DELETE FROM pulso_automation.automation_queue
  WHERE status IN ('SUCESSO', 'CANCELADO')
    AND created_at < NOW() - INTERVAL '30 days';
  $$
);

-- =====================================================================
-- FIM PARTE 6 — Verificação:
-- =====================================================================
SELECT jobid, jobname, schedule, active
FROM cron.job
ORDER BY jobname;
