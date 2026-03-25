-- ============================================================
-- pg_cron Jobs — Executar no Supabase Dashboard (SQL Editor)
-- Data: 2026-03-24
-- PRÉ-REQUISITO: Habilitar extensão pg_cron em
--   Dashboard → Database → Extensions → pg_cron → Enable
-- ============================================================

-- Habilitar extensão
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Garantir que pg_cron pode acessar o schema
GRANT USAGE ON SCHEMA cron TO postgres;

-- ============================================================
-- JOB 1: Gerar ideias diariamente às 03:00 UTC (00:00 BRT)
-- ============================================================
SELECT cron.schedule(
  'gerar-ideias-diario',
  '0 3 * * *',
  $$
  INSERT INTO pulso_automation.automation_queue (tipo, payload, origem)
  SELECT 'GERAR_IDEIAS',
         jsonb_build_object(
           'canal_id', c.id,
           'canal_nome', c.nome,
           'quantidade', 5
         ),
         'pg_cron'
  FROM pulso_core.canais c
  WHERE c.status = 'ATIVO'
    AND EXTRACT(DOW FROM NOW()) = (
      -- Rotação de canais por dia da semana (0=dom, 1=seg, ...)
      -- Usa o hash do ID para distribuir uniformemente
      ABS(('x' || SUBSTR(c.id::text, 1, 8))::bit(32)::int) % 7
    )
  LIMIT 2;
  $$
);

-- ============================================================
-- JOB 2: Verificar ideias aprovadas sem roteiro (backup, 5min)
-- ============================================================
SELECT cron.schedule(
  'check-roteiros-pendentes',
  '*/5 * * * *',
  $$
  INSERT INTO pulso_automation.automation_queue
    (tipo, payload, referencia_id, referencia_tipo, origem)
  SELECT
    'GERAR_ROTEIRO',
    jsonb_build_object('ideia_id', i.id, 'canal_id', i.canal_id),
    i.id,
    'ideia',
    'pg_cron'
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

-- ============================================================
-- JOB 3: Verificar roteiros aprovados sem áudio (backup, 10min)
-- ============================================================
SELECT cron.schedule(
  'check-audios-pendentes',
  '*/10 * * * *',
  $$
  INSERT INTO pulso_automation.automation_queue
    (tipo, payload, referencia_id, referencia_tipo, origem)
  SELECT
    'GERAR_AUDIO',
    jsonb_build_object('roteiro_id', r.id, 'canal_id', r.canal_id),
    r.id,
    'roteiro',
    'pg_cron'
  FROM pulso_content.roteiros r
  WHERE r.status = 'APROVADO'
    AND NOT EXISTS (
      SELECT 1 FROM pulso_content.audios a WHERE a.roteiro_id = r.id
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

-- ============================================================
-- JOB 4: Publicar conteúdos prontos (3x/dia)
-- ============================================================
SELECT cron.schedule(
  'publicar-conteudos',
  '0 6,12,18 * * *',
  $$
  INSERT INTO pulso_automation.automation_queue (tipo, payload, origem)
  VALUES ('PUBLICAR', '{}'::jsonb, 'pg_cron');
  $$
);

-- ============================================================
-- JOB 5: Processar retry queue (a cada 30min)
-- ============================================================
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

-- ============================================================
-- JOB 6: Coletar métricas (diário 22:00 UTC)
-- ============================================================
SELECT cron.schedule(
  'coletar-metricas',
  '0 22 * * *',
  $$
  INSERT INTO pulso_automation.automation_queue (tipo, payload, origem)
  VALUES ('COLETAR_METRICAS', '{}'::jsonb, 'pg_cron');
  $$
);

-- ============================================================
-- JOB 7: Relatório semanal (segunda 09:00 UTC)
-- ============================================================
SELECT cron.schedule(
  'relatorio-semanal',
  '0 9 * * 1',
  $$
  INSERT INTO pulso_automation.automation_queue (tipo, payload, origem)
  VALUES ('RELATORIO_SEMANAL', '{}'::jsonb, 'pg_cron');
  $$
);

-- ============================================================
-- JOB 8: Limpeza de itens antigos (semanal, domingo 04:00 UTC)
-- ============================================================
SELECT cron.schedule(
  'limpar-queue-antiga',
  '0 4 * * 0',
  $$
  DELETE FROM pulso_automation.automation_queue
  WHERE status IN ('SUCESSO', 'CANCELADO')
    AND created_at < NOW() - INTERVAL '30 days';
  $$
);

-- ============================================================
-- Verificar jobs criados
-- ============================================================
SELECT jobid, schedule, command, jobname
FROM cron.job
ORDER BY jobname;
