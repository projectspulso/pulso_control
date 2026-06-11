-- =====================================================
-- MIGRATION: Logs de Workflows n8n
-- =====================================================
-- Criar tabela de logs para workflows n8n
CREATE TABLE IF NOT EXISTS pulso_content.logs_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sucesso', 'erro', 'em_andamento')),
    detalhes JSONB DEFAULT '{}'::jsonb,
    erro_mensagem TEXT,
    tempo_execucao_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_logs_workflows_created_at ON pulso_content.logs_workflows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_workflows_workflow_name ON pulso_content.logs_workflows(workflow_name);
CREATE INDEX IF NOT EXISTS idx_logs_workflows_status ON pulso_content.logs_workflows(status);
-- Row Level Security
ALTER TABLE pulso_content.logs_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Logs públicos leitura" ON pulso_content.logs_workflows FOR
SELECT USING (true);
CREATE POLICY "Logs públicos escrita" ON pulso_content.logs_workflows FOR ALL USING (true);
-- View pública para acesso via Supabase client
CREATE OR REPLACE VIEW public.logs_workflows AS
SELECT id,
    workflow_name,
    status,
    detalhes,
    erro_mensagem,
    tempo_execucao_ms,
    created_at
FROM pulso_content.logs_workflows
ORDER BY created_at DESC;
-- Grant de acesso
GRANT SELECT ON public.logs_workflows TO anon,
    authenticated;
-- Comentários
COMMENT ON TABLE pulso_content.logs_workflows IS 'Logs de execução dos workflows n8n (WF00-WF04)';
COMMENT ON VIEW public.logs_workflows IS 'View pública de logs de workflows para frontend';
COMMENT ON COLUMN pulso_content.logs_workflows.workflow_name IS 'Nome do workflow (ex: WF00 - Gerar Ideias)';
COMMENT ON COLUMN pulso_content.logs_workflows.status IS 'Status da execução: sucesso, erro, em_andamento';
COMMENT ON COLUMN pulso_content.logs_workflows.detalhes IS 'Detalhes da execução em JSON (ex: {ideias_geradas: 5, canal_id: uuid})';
COMMENT ON COLUMN pulso_content.logs_workflows.tempo_execucao_ms IS 'Tempo de execução em milissegundos';