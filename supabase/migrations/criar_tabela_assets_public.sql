-- ================================================================
-- CRIAR TABELA ASSETS NO SCHEMA PUBLIC
-- ================================================================
-- A tabela assets deve estar em public para facilitar acesso
-- O schema pulso_assets existe mas não tem permissões configuradas
-- ================================================================

-- 1. Criar tabela assets no schema public (se não existir)
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL CHECK (tipo IN ('audio', 'video', 'imagem', 'thumbnail', 'broll')),
    nome TEXT NOT NULL,
    descricao TEXT,
    caminho_storage TEXT NOT NULL,
    provedor TEXT, -- 'supabase', 'cloudflare', 's3', etc.
    duracao_segundos NUMERIC(10,2),
    largura_px INTEGER,
    altura_px INTEGER,
    tamanho_bytes BIGINT,
    hash_arquivo TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    criado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar tabela conteudo_variantes no schema public (se não existir)
CREATE TABLE IF NOT EXISTS public.conteudo_variantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conteudo_id UUID, -- Referência futura ao conteúdo principal
    nome_variacao TEXT NOT NULL,
    plataforma_tipo TEXT, -- 'youtube', 'tiktok', 'instagram', etc.
    status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'aprovado', 'publicado', 'arquivado')),
    titulo_publico TEXT,
    descricao_publica TEXT,
    legenda TEXT,
    hashtags TEXT[],
    linguagem TEXT DEFAULT 'pt-BR',
    ordem_exibicao INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar tabela de vínculo conteudo_variantes_assets (se não existir)
CREATE TABLE IF NOT EXISTS public.conteudo_variantes_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conteudo_variantes_id UUID NOT NULL REFERENCES public.conteudo_variantes(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    papel TEXT, -- 'principal', 'thumbnail', 'broll', etc.
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conteudo_variantes_id, asset_id)
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_assets_tipo ON public.assets(tipo);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON public.assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_criado_por ON public.assets(criado_por);

CREATE INDEX IF NOT EXISTS idx_variantes_status ON public.conteudo_variantes(status);
CREATE INDEX IF NOT EXISTS idx_variantes_plataforma ON public.conteudo_variantes(plataforma_tipo);

CREATE INDEX IF NOT EXISTS idx_variantes_assets_variante ON public.conteudo_variantes_assets(conteudo_variantes_id);
CREATE INDEX IF NOT EXISTS idx_variantes_assets_asset ON public.conteudo_variantes_assets(asset_id);

-- 5. Habilitar RLS nas tabelas
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conteudo_variantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conteudo_variantes_assets ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas de acesso permissivas (todos autenticados podem tudo)
-- Assets
DROP POLICY IF EXISTS "Assets públicos para leitura" ON public.assets;
CREATE POLICY "Assets públicos para leitura"
    ON public.assets FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Autenticados podem inserir assets" ON public.assets;
CREATE POLICY "Autenticados podem inserir assets"
    ON public.assets FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Autenticados podem atualizar assets" ON public.assets;
CREATE POLICY "Autenticados podem atualizar assets"
    ON public.assets FOR UPDATE
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Autenticados podem deletar assets" ON public.assets;
CREATE POLICY "Autenticados podem deletar assets"
    ON public.assets FOR DELETE
    USING (auth.role() = 'authenticated');

-- Variantes
DROP POLICY IF EXISTS "Variantes públicas para leitura" ON public.conteudo_variantes;
CREATE POLICY "Variantes públicas para leitura"
    ON public.conteudo_variantes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Autenticados podem inserir variantes" ON public.conteudo_variantes;
CREATE POLICY "Autenticados podem inserir variantes"
    ON public.conteudo_variantes FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Autenticados podem atualizar variantes" ON public.conteudo_variantes;
CREATE POLICY "Autenticados podem atualizar variantes"
    ON public.conteudo_variantes FOR UPDATE
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Autenticados podem deletar variantes" ON public.conteudo_variantes;
CREATE POLICY "Autenticados podem deletar variantes"
    ON public.conteudo_variantes FOR DELETE
    USING (auth.role() = 'authenticated');

-- Vínculos
DROP POLICY IF EXISTS "Vínculos públicos para leitura" ON public.conteudo_variantes_assets;
CREATE POLICY "Vínculos públicos para leitura"
    ON public.conteudo_variantes_assets FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Autenticados podem inserir vínculos" ON public.conteudo_variantes_assets;
CREATE POLICY "Autenticados podem inserir vínculos"
    ON public.conteudo_variantes_assets FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Autenticados podem deletar vínculos" ON public.conteudo_variantes_assets;
CREATE POLICY "Autenticados podem deletar vínculos"
    ON public.conteudo_variantes_assets FOR DELETE
    USING (auth.role() = 'authenticated');

-- 7. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Triggers para updated_at
DROP TRIGGER IF EXISTS update_assets_updated_at ON public.assets;
CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON public.assets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_variantes_updated_at ON public.conteudo_variantes;
CREATE TRIGGER update_variantes_updated_at
    BEFORE UPDATE ON public.conteudo_variantes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================================
-- VALIDAÇÃO
-- ================================================================
SELECT 'Tabelas criadas:' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('assets', 'conteudo_variantes', 'conteudo_variantes_assets');

SELECT 'Políticas RLS criadas:' as status;
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('assets', 'conteudo_variantes', 'conteudo_variantes_assets')
ORDER BY tablename, policyname;
