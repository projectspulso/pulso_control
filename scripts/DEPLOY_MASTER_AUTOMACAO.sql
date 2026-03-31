-- =====================================================================
-- PULSO - DEPLOY MASTER: Automação Híbrida Completa
-- =====================================================================
-- Roda tudo de uma vez no SQL Editor do Supabase
-- PRÉ-REQUISITO: Habilitar extensões no Dashboard:
--   Database → Extensions → pg_cron (Enable)
--   Database → Extensions → pg_net (Enable)
--
-- ORDEM DE EXECUÇÃO:
--   1. Tabela automation_queue + ai_config
--   2. Triggers inteligentes (ideia aprovada → roteiro, roteiro → áudio)
--   3. Views de monitoramento
--   4. pg_cron jobs (8 agendamentos)
--   5. PostgREST config (expor schemas)
--   6. Funções helper para o Cowork
--   7. Seed de exemplo completo
-- =====================================================================

-- ===========================================
-- SEÇÃO 1: AUTOMATION_QUEUE + AI_CONFIG
-- ===========================================

CREATE SCHEMA IF NOT EXISTS pulso_automation;
GRANT USAGE ON SCHEMA pulso_automation TO anon, authenticated, service_role;

-- Tabela central de fila
CREATE TABLE IF NOT EXISTS pulso_automation.automation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN (
    'GERAR_IDEIAS', 'GERAR_ROTEIRO', 'GERAR_AUDIO', 'PREPARAR_VIDEO',
    'PUBLICAR', 'COLETAR_METRICAS', 'RELATORIO_SEMANAL', 'PROCESSAR_FILA', 'CUSTOM'
  )),
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN (
    'PENDENTE', 'PROCESSANDO', 'SUCESSO', 'ERRO', 'RETRY', 'CANCELADO'
  )),
  tentativas INTEGER NOT NULL DEFAULT 0,
  max_tentativas INTEGER NOT NULL DEFAULT 3,
  proximo_retry TIMESTAMPTZ,
  erro_ultimo TEXT,
  erro_historico JSONB DEFAULT '[]',
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  resultado JSONB,
  origem TEXT DEFAULT 'pg_cron',
  referencia_id UUID,
  referencia_tipo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE pulso_automation.automation_queue IS
  'Fila central de automação AI-native — substitui n8n completamente';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_aq_status ON pulso_automation.automation_queue(status);
CREATE INDEX IF NOT EXISTS idx_aq_tipo ON pulso_automation.automation_queue(tipo);
CREATE INDEX IF NOT EXISTS idx_aq_scheduled ON pulso_automation.automation_queue(scheduled_at) WHERE status = 'PENDENTE';
CREATE INDEX IF NOT EXISTS idx_aq_retry ON pulso_automation.automation_queue(proximo_retry) WHERE status = 'RETRY';
CREATE INDEX IF NOT EXISTS idx_aq_referencia ON pulso_automation.automation_queue(referencia_id, referencia_tipo);
CREATE INDEX IF NOT EXISTS idx_aq_created ON pulso_automation.automation_queue(created_at DESC);

-- Permissões + RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE pulso_automation.automation_queue TO anon, authenticated, service_role;
ALTER TABLE pulso_automation.automation_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automation_queue_read" ON pulso_automation.automation_queue;
CREATE POLICY "automation_queue_read" ON pulso_automation.automation_queue FOR SELECT USING (true);

DROP POLICY IF EXISTS "automation_queue_write" ON pulso_automation.automation_queue;
CREATE POLICY "automation_queue_write" ON pulso_automation.automation_queue FOR ALL USING (true) WITH CHECK (true);

-- Tabela de configuração AI
CREATE TABLE IF NOT EXISTS pulso_automation.ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE,
  valor JSONB NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE ON TABLE pulso_automation.ai_config TO authenticated, service_role;
ALTER TABLE pulso_automation.ai_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_config_read" ON pulso_automation.ai_config;
CREATE POLICY "ai_config_read" ON pulso_automation.ai_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "ai_config_write" ON pulso_automation.ai_config;
CREATE POLICY "ai_config_write" ON pulso_automation.ai_config FOR ALL USING (true) WITH CHECK (true);

-- Seeds de configuração
INSERT INTO pulso_automation.ai_config (chave, valor, descricao) VALUES
  ('openai_model', '"gpt-4o"', 'Modelo OpenAI para geração de texto'),
  ('anthropic_model', '"claude-sonnet-4-6"', 'Modelo Claude para geração de texto'),
  ('ai_provider', '"openai"', 'Provider principal: openai ou anthropic'),
  ('tts_provider', '"openai"', 'Provider de TTS: openai ou elevenlabs'),
  ('tts_model', '"tts-1-hd"', 'Modelo de TTS da OpenAI'),
  ('tts_voice_default', '"alloy"', 'Voz padrão para pt-BR'),
  ('tts_voices', '{"pulso-curiosidades":"alloy","pulso-misterios":"onyx","pulso-motivacional":"nova","pulso-psicologia":"shimmer"}', 'Mapeamento de vozes por canal'),
  ('auto_approve_roteiro', 'false', 'Auto-aprovar roteiros com quality score > threshold'),
  ('auto_approve_threshold', '80', 'Threshold de quality score para auto-approve'),
  ('max_ideias_por_dia', '10', 'Máximo de ideias geradas por dia por canal'),
  ('publicacao_horarios', '["09:00","15:00","21:00"]', 'Horários de publicação (BRT)'),
  ('cowork_enabled', 'true', 'Habilitar ações inteligentes via Cowork/Claude Code')
ON CONFLICT (chave) DO NOTHING;


-- ===========================================
-- SEÇÃO 2: TRIGGERS INTELIGENTES
-- ===========================================

-- Auto updated_at
CREATE OR REPLACE FUNCTION pulso_automation.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_aq_updated_at ON pulso_automation.automation_queue;
CREATE TRIGGER trg_aq_updated_at
  BEFORE UPDATE ON pulso_automation.automation_queue
  FOR EACH ROW
  EXECUTE FUNCTION pulso_automation.set_updated_at();

-- TRIGGER: Ideia APROVADA → enfileira GERAR_ROTEIRO
CREATE OR REPLACE FUNCTION pulso_automation.on_ideia_aprovada()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'APROVADA' AND (OLD.status IS NULL OR OLD.status != 'APROVADA') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pulso_automation.automation_queue
      WHERE referencia_id = NEW.id
        AND tipo = 'GERAR_ROTEIRO'
        AND status IN ('PENDENTE', 'PROCESSANDO')
    ) THEN
      INSERT INTO pulso_automation.automation_queue
        (tipo, payload, referencia_id, referencia_tipo, origem)
      VALUES (
        'GERAR_ROTEIRO',
        jsonb_build_object('ideia_id', NEW.id, 'canal_id', NEW.canal_id),
        NEW.id, 'ideia', 'trigger'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ideia_aprovada ON pulso_content.ideias;
CREATE TRIGGER trg_ideia_aprovada
  AFTER UPDATE OF status ON pulso_content.ideias
  FOR EACH ROW
  EXECUTE FUNCTION pulso_automation.on_ideia_aprovada();

-- TRIGGER: Roteiro APROVADO → enfileira GERAR_AUDIO
CREATE OR REPLACE FUNCTION pulso_automation.on_roteiro_aprovado()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'APROVADO' AND (OLD.status IS NULL OR OLD.status != 'APROVADO') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pulso_automation.automation_queue
      WHERE referencia_id = NEW.id
        AND tipo = 'GERAR_AUDIO'
        AND status IN ('PENDENTE', 'PROCESSANDO')
    ) THEN
      INSERT INTO pulso_automation.automation_queue
        (tipo, payload, referencia_id, referencia_tipo, origem)
      VALUES (
        'GERAR_AUDIO',
        jsonb_build_object('roteiro_id', NEW.id, 'ideia_id', NEW.ideia_id),
        NEW.id, 'roteiro', 'trigger'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_roteiro_aprovado ON pulso_content.roteiros;
CREATE TRIGGER trg_roteiro_aprovado
  AFTER UPDATE OF status ON pulso_content.roteiros
  FOR EACH ROW
  EXECUTE FUNCTION pulso_automation.on_roteiro_aprovado();


-- ===========================================
-- SEÇÃO 3: VIEWS DE MONITORAMENTO
-- ===========================================

-- View: Fila completa
CREATE OR REPLACE VIEW public.vw_automation_queue AS
SELECT
  q.id, q.tipo, q.status, q.payload,
  q.tentativas, q.max_tentativas, q.erro_ultimo,
  q.origem, q.referencia_id, q.referencia_tipo,
  q.resultado, q.scheduled_at, q.started_at, q.completed_at,
  q.created_at, q.updated_at,
  CASE
    WHEN q.completed_at IS NOT NULL AND q.started_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (q.completed_at - q.started_at))
    ELSE NULL
  END AS duracao_segundos
FROM pulso_automation.automation_queue q
ORDER BY q.created_at DESC;

GRANT SELECT ON public.vw_automation_queue TO anon, authenticated, service_role;

-- View: Resumo para dashboard
CREATE OR REPLACE VIEW public.vw_automation_stats AS
SELECT
  tipo,
  COUNT(*) FILTER (WHERE status = 'PENDENTE') AS pendentes,
  COUNT(*) FILTER (WHERE status = 'PROCESSANDO') AS processando,
  COUNT(*) FILTER (WHERE status = 'SUCESSO') AS sucesso,
  COUNT(*) FILTER (WHERE status = 'ERRO') AS erros,
  COUNT(*) FILTER (WHERE status = 'RETRY') AS retry,
  COUNT(*) AS total,
  MAX(created_at) FILTER (WHERE status = 'SUCESSO') AS ultima_execucao_ok,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))
    FILTER (WHERE completed_at IS NOT NULL AND started_at IS NOT NULL) AS duracao_media_seg
FROM pulso_automation.automation_queue
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY tipo
ORDER BY tipo;

GRANT SELECT ON public.vw_automation_stats TO anon, authenticated, service_role;

-- View: Pipeline completo (para cowork monitorar)
CREATE OR REPLACE VIEW public.vw_pipeline_status AS
SELECT
  'ideias_rascunho' AS etapa, COUNT(*) AS total
  FROM pulso_content.ideias WHERE status = 'RASCUNHO'
UNION ALL
SELECT 'ideias_aprovadas', COUNT(*)
  FROM pulso_content.ideias WHERE status = 'APROVADA'
UNION ALL
SELECT 'roteiros_rascunho', COUNT(*)
  FROM pulso_content.roteiros WHERE status = 'RASCUNHO'
UNION ALL
SELECT 'roteiros_aprovados', COUNT(*)
  FROM pulso_content.roteiros WHERE status = 'APROVADO'
UNION ALL
SELECT 'queue_pendente', COUNT(*)
  FROM pulso_automation.automation_queue WHERE status = 'PENDENTE'
UNION ALL
SELECT 'queue_processando', COUNT(*)
  FROM pulso_automation.automation_queue WHERE status = 'PROCESSANDO'
UNION ALL
SELECT 'queue_erro', COUNT(*)
  FROM pulso_automation.automation_queue WHERE status = 'ERRO';

GRANT SELECT ON public.vw_pipeline_status TO anon, authenticated, service_role;


-- ===========================================
-- SEÇÃO 4: pg_cron JOBS (8 agendamentos)
-- ===========================================
-- PRÉ-REQUISITO: pg_cron e pg_net habilitados em Extensions

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
GRANT USAGE ON SCHEMA cron TO postgres;

-- Limpar jobs antigos
SELECT cron.unschedule(jobname) FROM cron.job
WHERE jobname IN (
  'gerar-ideias-diario', 'check-roteiros-pendentes', 'check-audios-pendentes',
  'publicar-conteudos', 'processar-retry-queue', 'coletar-metricas',
  'relatorio-semanal', 'limpar-queue-antiga', 'processar-orchestrator'
);

-- JOB 1: Gerar ideias diárias (06:00 BRT = 09:00 UTC)
-- Rotaciona 2 canais por dia
SELECT cron.schedule(
  'gerar-ideias-diario',
  '0 9 * * *',
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

-- JOB 2: Safety net - ideias aprovadas sem roteiro (5 min)
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

-- JOB 3: Safety net - roteiros aprovados sem áudio (10 min)
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
      SELECT 1 FROM pulso_automation.automation_queue q
      WHERE q.referencia_id = r.id
        AND q.tipo = 'GERAR_AUDIO'
        AND q.status IN ('PENDENTE', 'PROCESSANDO', 'SUCESSO')
    )
  LIMIT 3;
  $$
);

-- JOB 4: Publicar conteúdos prontos (3x/dia BRT: 09:00, 15:00, 21:00)
SELECT cron.schedule(
  'publicar-conteudos',
  '0 12,18,0 * * *',
  $$
  INSERT INTO pulso_automation.automation_queue (tipo, payload, origem)
  VALUES ('PUBLICAR', '{}'::jsonb, 'pg_cron');
  $$
);

-- JOB 5: Processar retry (30 min)
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

-- JOB 6: Coletar métricas (diário 19:00 BRT = 22:00 UTC)
SELECT cron.schedule(
  'coletar-metricas',
  '0 22 * * *',
  $$
  INSERT INTO pulso_automation.automation_queue (tipo, payload, origem)
  VALUES ('COLETAR_METRICAS', '{}'::jsonb, 'pg_cron');
  $$
);

-- JOB 7: Relatório semanal (segunda 06:00 BRT = 09:00 UTC)
SELECT cron.schedule(
  'relatorio-semanal',
  '0 9 * * 1',
  $$
  INSERT INTO pulso_automation.automation_queue (tipo, payload, origem)
  VALUES ('RELATORIO_SEMANAL', '{}'::jsonb, 'pg_cron');
  $$
);

-- JOB 8: Limpeza (domingo 01:00 BRT = 04:00 UTC)
SELECT cron.schedule(
  'limpar-queue-antiga',
  '0 4 * * 0',
  $$
  DELETE FROM pulso_automation.automation_queue
  WHERE status IN ('SUCESSO', 'CANCELADO')
    AND created_at < NOW() - INTERVAL '30 days';
  $$
);

-- JOB 9: Processar orchestrator (a cada 2 min — chama a API do app)
-- Este job usa pg_net para chamar o endpoint do Next.js
SELECT cron.schedule(
  'processar-orchestrator',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.app_url', true) || '/api/automation/orchestrator',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', current_setting('app.settings.webhook_secret', true)
    ),
    body := '{}'::jsonb
  );
  $$
);


-- ===========================================
-- SEÇÃO 5: POSTGREST CONFIG
-- ===========================================

ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public, pulso_core, pulso_content, pulso_assets, pulso_distribution, pulso_automation, pulso_analytics';

NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';


-- ===========================================
-- SEÇÃO 6: FUNÇÕES HELPER (para Cowork e App)
-- ===========================================

-- Função: Enfileirar ação manual (botão no app)
CREATE OR REPLACE FUNCTION pulso_automation.enqueue(
  p_tipo TEXT,
  p_payload JSONB DEFAULT '{}',
  p_referencia_id UUID DEFAULT NULL,
  p_referencia_tipo TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO pulso_automation.automation_queue
    (tipo, payload, referencia_id, referencia_tipo, origem)
  VALUES
    (p_tipo, p_payload, p_referencia_id, p_referencia_tipo, 'manual')
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Função: Cancelar item da fila
CREATE OR REPLACE FUNCTION pulso_automation.cancel_item(p_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE pulso_automation.automation_queue
  SET status = 'CANCELADO', completed_at = NOW()
  WHERE id = p_id AND status IN ('PENDENTE', 'RETRY');
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Função: Resumo rápido do pipeline (para Cowork consultar)
CREATE OR REPLACE FUNCTION pulso_automation.pipeline_resumo()
RETURNS TABLE(
  etapa TEXT,
  quantidade BIGINT,
  acao_sugerida TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'Ideias Rascunho'::TEXT, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) > 10 THEN 'Revisar e aprovar ideias pendentes' ELSE 'OK' END
  FROM pulso_content.ideias WHERE status = 'RASCUNHO'
  UNION ALL
  SELECT 'Ideias Aprovadas (sem roteiro)', COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN 'Roteiros serão gerados automaticamente' ELSE 'OK' END
  FROM pulso_content.ideias i
  WHERE i.status = 'APROVADA'
    AND NOT EXISTS (SELECT 1 FROM pulso_content.roteiros r WHERE r.ideia_id = i.id)
  UNION ALL
  SELECT 'Roteiros p/ Revisão', COUNT(*),
    CASE WHEN COUNT(*) > 5 THEN 'Revisar e aprovar roteiros urgente!' ELSE 'OK' END
  FROM pulso_content.roteiros WHERE status = 'RASCUNHO'
  UNION ALL
  SELECT 'Fila Pendente', COUNT(*),
    CASE WHEN COUNT(*) > 20 THEN 'Fila grande — verificar processamento' ELSE 'OK' END
  FROM pulso_automation.automation_queue WHERE status = 'PENDENTE'
  UNION ALL
  SELECT 'Fila com Erro', COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN 'ATENÇÃO: Itens com erro na fila!' ELSE 'OK' END
  FROM pulso_automation.automation_queue WHERE status = 'ERRO'
    AND created_at > NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION pulso_automation.enqueue TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION pulso_automation.cancel_item TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION pulso_automation.pipeline_resumo TO anon, authenticated, service_role;


-- ===========================================
-- SEÇÃO 7: CONFIGURAÇÃO DO pg_net (app_url)
-- ===========================================
-- IMPORTANTE: Substituir pela URL real do seu deploy!

ALTER DATABASE postgres SET app.settings.app_url = 'https://pulsoprojects.vercel.app';
ALTER DATABASE postgres SET app.settings.webhook_secret = 'pulso-webhook-2026';


-- ===========================================
-- VERIFICAÇÃO FINAL
-- ===========================================

SELECT '=== AUTOMAÇÃO DEPLOY COMPLETO ===' AS status;

SELECT 'automation_queue' AS tabela, COUNT(*) AS registros FROM pulso_automation.automation_queue
UNION ALL
SELECT 'ai_config', COUNT(*) FROM pulso_automation.ai_config;

SELECT jobid, jobname, schedule, active FROM cron.job ORDER BY jobname;

SELECT * FROM pulso_automation.pipeline_resumo();
