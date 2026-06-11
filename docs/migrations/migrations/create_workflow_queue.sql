-- =====================================================
-- Tabela de Fila para Retry de Workflows n8n
-- =====================================================
CREATE TABLE IF NOT EXISTS pulso_content.workflow_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_name TEXT NOT NULL,
    payload JSONB NOT NULL,
    tentativas INTEGER DEFAULT 0,
    max_tentativas INTEGER DEFAULT 3,
    proximo_retry TIMESTAMPTZ,
    erro_ultimo TEXT,
    status TEXT CHECK (
        status IN ('pendente', 'processando', 'falha', 'sucesso')
    ) DEFAULT 'pendente',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_workflow_queue_status ON pulso_content.workflow_queue(status);
CREATE INDEX IF NOT EXISTS idx_workflow_queue_proximo_retry ON pulso_content.workflow_queue(proximo_retry);
-- RLS
ALTER TABLE pulso_content.workflow_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fila pública leitura" ON pulso_content.workflow_queue FOR
SELECT USING (true);
CREATE POLICY "Fila pública escrita" ON pulso_content.workflow_queue FOR ALL USING (true);
-- Comentários
COMMENT ON TABLE pulso_content.workflow_queue IS 'Fila de retry para execuções de workflows n8n';