-- =====================================================
-- Criar view pública de plataformas e tabela de credenciais
-- =====================================================
-- 1) View pública de plataformas
DROP VIEW IF EXISTS public.plataformas CASCADE;
CREATE OR REPLACE VIEW public.plataformas AS
SELECT *
FROM pulso_core.plataformas;
GRANT SELECT ON public.plataformas TO anon,
    authenticated;
COMMENT ON VIEW public.plataformas IS 'View pública de plataformas (YouTube, TikTok, Instagram, etc)';
-- 2) Tabela de credenciais OAuth (segura, não exposta)
CREATE TABLE IF NOT EXISTS pulso_core.plataforma_credenciais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plataforma_id UUID NOT NULL REFERENCES pulso_core.plataformas(id) ON DELETE CASCADE,
    -- OAuth 2.0
    oauth_client_id TEXT,
    oauth_client_secret TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expira_em TIMESTAMPTZ,
    -- Outros tipos de auth
    api_key TEXT,
    api_secret TEXT,
    webhook_url TEXT,
    -- Metadados
    escopo TEXT [],
    -- ['read', 'write', 'analytics']
    usuario_conectado TEXT,
    -- Nome/email do usuário que autorizou
    data_autorizacao TIMESTAMPTZ,
    -- Controle
    ativo BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_plataforma_credenciais UNIQUE (plataforma_id)
);
-- Índices
CREATE INDEX IF NOT EXISTS idx_plataforma_credenciais_plataforma ON pulso_core.plataforma_credenciais(plataforma_id);
CREATE INDEX IF NOT EXISTS idx_plataforma_credenciais_ativo ON pulso_core.plataforma_credenciais(ativo);
-- RLS (Row Level Security) - Apenas authenticated users
ALTER TABLE pulso_core.plataforma_credenciais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Credenciais visíveis apenas para authenticated" ON pulso_core.plataforma_credenciais FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Credenciais editáveis apenas para authenticated" ON pulso_core.plataforma_credenciais FOR ALL USING (auth.role() = 'authenticated');
-- View pública (SEM credenciais sensíveis)
DROP VIEW IF EXISTS public.plataformas_conectadas CASCADE;
CREATE OR REPLACE VIEW public.plataformas_conectadas AS
SELECT p.id,
    p.tipo,
    p.nome_exibicao,
    p.descricao,
    p.ativo as plataforma_ativa,
    -- Status de conexão
    (pc.id IS NOT NULL) as tem_credenciais,
    pc.ativo as credencial_ativa,
    pc.usuario_conectado,
    pc.data_autorizacao,
    pc.escopo,
    -- SEM expor tokens/secrets
    (pc.token_expira_em > now()) as token_valido,
    pc.token_expira_em,
    pc.created_at,
    pc.updated_at
FROM pulso_core.plataformas p
    LEFT JOIN pulso_core.plataforma_credenciais pc ON p.id = pc.plataforma_id;
GRANT SELECT ON public.plataformas_conectadas TO anon,
    authenticated;
COMMENT ON VIEW public.plataformas_conectadas IS 'View de plataformas com status de conexão (SEM expor credenciais sensíveis)';
-- 3) Tabela de configurações gerais do sistema
CREATE TABLE IF NOT EXISTS pulso_core.configuracoes (
    chave TEXT PRIMARY KEY,
    valor TEXT,
    tipo TEXT CHECK (
        tipo IN ('string', 'number', 'boolean', 'json', 'secret')
    ),
    descricao TEXT,
    categoria TEXT,
    -- 'n8n', 'geral', 'email', etc
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID
);
-- Inserir configurações padrão do n8n
INSERT INTO pulso_core.configuracoes (chave, valor, tipo, descricao, categoria)
VALUES (
        'n8n_url',
        'http://localhost:5678',
        'string',
        'URL do servidor n8n',
        'n8n'
    ),
    (
        'n8n_api_key',
        '',
        'secret',
        'API Key do n8n',
        'n8n'
    ),
    (
        'n8n_webhook_base_url',
        'http://localhost:5678/webhook',
        'string',
        'URL base para webhooks',
        'n8n'
    ) ON CONFLICT (chave) DO NOTHING;
-- View pública de configurações (SEM secrets)
DROP VIEW IF EXISTS public.configuracoes CASCADE;
CREATE OR REPLACE VIEW public.configuracoes AS
SELECT chave,
    CASE
        WHEN tipo = 'secret' THEN '***'
        ELSE valor
    END as valor,
    tipo,
    descricao,
    categoria,
    updated_at
FROM pulso_core.configuracoes;
GRANT SELECT ON public.configuracoes TO anon,
    authenticated;
-- RLS em configuracoes
ALTER TABLE pulso_core.configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Configurações visíveis para authenticated" ON pulso_core.configuracoes FOR
SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Configurações editáveis para authenticated" ON pulso_core.configuracoes FOR ALL USING (auth.role() = 'authenticated');
-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_configuracoes_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS configuracoes_updated_at ON pulso_core.configuracoes;
CREATE TRIGGER configuracoes_updated_at BEFORE
UPDATE ON pulso_core.configuracoes FOR EACH ROW EXECUTE FUNCTION update_configuracoes_updated_at();
-- Recarregar cache
NOTIFY pgrst,
'reload schema';
-- Verificação
SELECT 'Views de plataformas e configurações criadas!' as status;
SELECT *
FROM public.plataformas
LIMIT 5;
SELECT *
FROM public.configuracoes
WHERE categoria = 'n8n';
| chave | valor | tipo | descricao | categoria | updated_at | | -------------------- | ----------------------------- | ------ | ---------------------- | --------- | ----------------------------- |
| n8n_url | http: // localhost :5678 | string | URL do servidor n8n | n8n | 2025 -11 -26 22 :50 :47.968351 + 00 | | n8n_api_key | * * * | secret | API Key do n8n | n8n | 2025 -11 -26 22 :50 :47.968351 + 00 | | n8n_webhook_base_url | http: // localhost :5678 / webhook | string | URL base para webhooks | n8n | 2025 -11 -26 22 :50 :47.968351 + 00 |