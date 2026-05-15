-- ============================================================
-- Migration: Automação AI-Native (substitui n8n)
-- Data: 2026-03-24
-- Objetivo: Criar infraestrutura completa de automação via
--           banco + Edge Functions + pg_cron
-- ============================================================

-- 1. Schema de automação
CREATE SCHEMA IF NOT EXISTS pulso_automation;

GRANT USAGE ON SCHEMA pulso_automation TO anon, authenticated, service_role;

-- 2. Tabela central: automation_queue
CREATE TABLE IF NOT EXISTS pulso_automation.automation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tipo de tarefa
  tipo TEXT NOT NULL CHECK (tipo IN (
    'GERAR_IDEIAS',
    'GERAR_ROTEIRO',
    'GERAR_AUDIO',
    'PREPARAR_VIDEO',
    'PUBLICAR',
    'COLETAR_METRICAS',
    'RELATORIO_SEMANAL',
    'PROCESSAR_FILA',
    'CUSTOM'
  )),

  -- Payload flexível
  payload JSONB NOT NULL DEFAULT '{}',

  -- Status de execução
  status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN (
    'PENDENTE',
    'PROCESSANDO',
    'SUCESSO',
    'ERRO',
    'RETRY',
    'CANCELADO'
  )),

  -- Retry logic
  tentativas INTEGER NOT NULL DEFAULT 0,
  max_tentativas INTEGER NOT NULL DEFAULT 3,
  proximo_retry TIMESTAMPTZ,
  erro_ultimo TEXT,
  erro_historico JSONB DEFAULT '[]',

  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Resultado da execução
  resultado JSONB,

  -- Rastreabilidade
  origem TEXT DEFAULT 'pg_cron',
  referencia_id UUID,
  referencia_tipo TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE pulso_automation.automation_queue IS
  'Fila central de automação AI-native — substitui n8n';

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_aq_status
  ON pulso_automation.automation_queue(status);

CREATE INDEX IF NOT EXISTS idx_aq_tipo
  ON pulso_automation.automation_queue(tipo);

CREATE INDEX IF NOT EXISTS idx_aq_scheduled
  ON pulso_automation.automation_queue(scheduled_at)
  WHERE status = 'PENDENTE';

CREATE INDEX IF NOT EXISTS idx_aq_retry
  ON pulso_automation.automation_queue(proximo_retry)
  WHERE status = 'RETRY';

CREATE INDEX IF NOT EXISTS idx_aq_referencia
  ON pulso_automation.automation_queue(referencia_id, referencia_tipo);

CREATE INDEX IF NOT EXISTS idx_aq_created
  ON pulso_automation.automation_queue(created_at DESC);

-- 4. Permissões
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE pulso_automation.automation_queue
  TO anon, authenticated, service_role;

ALTER TABLE pulso_automation.automation_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automation_queue_read" ON pulso_automation.automation_queue;
CREATE POLICY "automation_queue_read"
  ON pulso_automation.automation_queue FOR SELECT USING (true);

DROP POLICY IF EXISTS "automation_queue_write" ON pulso_automation.automation_queue;
CREATE POLICY "automation_queue_write"
  ON pulso_automation.automation_queue FOR ALL USING (true) WITH CHECK (true);

-- 5. Função de updated_at automático
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

-- 6. Trigger: ideia aprovada → enfileira geração de roteiro
CREATE OR REPLACE FUNCTION pulso_automation.on_ideia_aprovada()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'APROVADA' AND (OLD.status IS NULL OR OLD.status != 'APROVADA') THEN
    -- Evita duplicata na fila
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
        NEW.id,
        'ideia',
        'trigger'
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

-- 7. Trigger: roteiro aprovado → enfileira geração de áudio
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
        jsonb_build_object('roteiro_id', NEW.id, 'canal_id', NEW.canal_id, 'ideia_id', NEW.ideia_id),
        NEW.id,
        'roteiro',
        'trigger'
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

-- 8. View pública para o frontend
CREATE OR REPLACE VIEW public.vw_automation_queue AS
SELECT
  q.id,
  q.tipo,
  q.status,
  q.payload,
  q.tentativas,
  q.max_tentativas,
  q.erro_ultimo,
  q.origem,
  q.referencia_id,
  q.referencia_tipo,
  q.resultado,
  q.scheduled_at,
  q.started_at,
  q.completed_at,
  q.created_at,
  q.updated_at,
  -- Tempo de execução se completado
  CASE
    WHEN q.completed_at IS NOT NULL AND q.started_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (q.completed_at - q.started_at))
    ELSE NULL
  END AS duracao_segundos
FROM pulso_automation.automation_queue q
ORDER BY q.created_at DESC;

GRANT SELECT ON public.vw_automation_queue TO anon, authenticated, service_role;

-- 9. View de resumo para dashboard
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

-- 10. Tabela de configuração de AI (prompts, modelos, etc.)
CREATE TABLE IF NOT EXISTS pulso_automation.ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT NOT NULL UNIQUE,
  valor JSONB NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE ON TABLE pulso_automation.ai_config
  TO authenticated, service_role;

ALTER TABLE pulso_automation.ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_config_read" ON pulso_automation.ai_config FOR SELECT USING (true);
CREATE POLICY "ai_config_write" ON pulso_automation.ai_config FOR ALL USING (true) WITH CHECK (true);

-- Configurações iniciais
INSERT INTO pulso_automation.ai_config (chave, valor, descricao)
VALUES
  ('openai_model', '"gpt-4o"', 'Modelo OpenAI para geração de texto'),
  ('tts_provider', '"openai"', 'Provider de TTS: openai ou elevenlabs'),
  ('tts_model', '"tts-1-hd"', 'Modelo de TTS da OpenAI'),
  ('tts_voice_default', '"alloy"', 'Voz padrão para pt-BR'),
  ('tts_voices', '{"pulso-curiosidades":"alloy","pulso-misterios":"onyx","pulso-motivacional":"nova","pulso-psicologia":"shimmer"}', 'Mapeamento de vozes por canal'),
  ('auto_approve_roteiro', 'false', 'Auto-aprovar roteiros com quality score > 80'),
  ('auto_approve_threshold', '80', 'Threshold de quality score para auto-approve'),
  ('max_ideias_por_dia', '10', 'Máximo de ideias geradas por dia por canal'),
  ('publicacao_horarios', '["06:00","12:00","18:00"]', 'Horários de publicação UTC')
ON CONFLICT (chave) DO NOTHING;

-- ============================================================
-- FIM DA MIGRATION
-- Próximo passo: configurar pg_cron no Dashboard do Supabase
-- (pg_cron precisa ser habilitado manualmente nas extensões)
-- ============================================================
