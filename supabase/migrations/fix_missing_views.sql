-- =====================================================
-- FIX: Recriar TODAS as views públicas que estão faltando
-- =====================================================
-- Executar esse SQL no Supabase Dashboard SQL Editor
-- View pública de canais
DROP VIEW IF EXISTS public.canais CASCADE;
CREATE OR REPLACE VIEW public.canais AS
SELECT *
FROM pulso_core.canais;
GRANT SELECT ON public.canais TO anon,
    authenticated;
COMMENT ON VIEW public.canais IS 'View pública de canais (pulso_core.canais)';
-- View pública de séries (já existe, mas garantir)
DROP VIEW IF EXISTS public.series CASCADE;
CREATE OR REPLACE VIEW public.series AS
SELECT *
FROM pulso_core.series;
GRANT SELECT ON public.series TO anon,
    authenticated;
COMMENT ON VIEW public.series IS 'View pública de séries (pulso_core.series)';
-- View pública de ideias
DROP VIEW IF EXISTS public.ideias CASCADE;
CREATE OR REPLACE VIEW public.ideias AS
SELECT *
FROM pulso_content.ideias;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.ideias TO anon,
    authenticated;
COMMENT ON VIEW public.ideias IS 'View pública de ideias com triggers CRUD (pulso_content.ideias)';
-- View pública de roteiros
DROP VIEW IF EXISTS public.roteiros CASCADE;
CREATE OR REPLACE VIEW public.roteiros AS
SELECT *
FROM pulso_content.roteiros;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.roteiros TO anon,
    authenticated;
COMMENT ON VIEW public.roteiros IS 'View pública de roteiros com triggers CRUD (pulso_content.roteiros)';
-- View pública de pipeline_producao
DROP VIEW IF EXISTS public.pipeline_producao CASCADE;
CREATE OR REPLACE VIEW public.pipeline_producao AS
SELECT *
FROM pulso_content.pipeline_producao;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.pipeline_producao TO anon,
    authenticated;
COMMENT ON VIEW public.pipeline_producao IS 'View pública de pipeline_producao (pulso_content.pipeline_producao)';
-- Alias: conteudos_producao apontando para pipeline_producao
DROP VIEW IF EXISTS public.conteudos_producao CASCADE;
CREATE OR REPLACE VIEW public.conteudos_producao AS
SELECT *
FROM pulso_content.pipeline_producao;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.conteudos_producao TO anon,
    authenticated;
COMMENT ON VIEW public.conteudos_producao IS 'Alias para pipeline_producao (pulso_content.pipeline_producao)';
-- View pública de publicacoes (posts)
DROP VIEW IF EXISTS public.publicacoes CASCADE;
CREATE OR REPLACE VIEW public.publicacoes AS
SELECT *
FROM pulso_distribution.posts;
GRANT SELECT ON public.publicacoes TO anon,
    authenticated;
COMMENT ON VIEW public.publicacoes IS 'View pública de publicações (pulso_distribution.posts)';
-- View pública de plataformas (já existe, mas garantir)
DROP VIEW IF EXISTS public.plataformas CASCADE;
CREATE OR REPLACE VIEW public.plataformas AS
SELECT *
FROM pulso_core.plataformas;
GRANT SELECT ON public.plataformas TO anon,
    authenticated;
COMMENT ON VIEW public.plataformas IS 'View pública de plataformas (pulso_core.plataformas)';
-- =====================================================
-- TRIGGERS para permitir INSERT/UPDATE/DELETE nas views
-- =====================================================
-- Trigger para INSERT em ideias
CREATE OR REPLACE FUNCTION public.ideias_insert() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO pulso_content.ideias
SELECT NEW.*;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS ideias_insert_trigger ON public.ideias;
CREATE TRIGGER ideias_insert_trigger INSTEAD OF
INSERT ON public.ideias FOR EACH ROW EXECUTE FUNCTION public.ideias_insert();
-- Trigger para UPDATE em ideias
CREATE OR REPLACE FUNCTION public.ideias_update() RETURNS TRIGGER AS $$ BEGIN
UPDATE pulso_content.ideias
SET titulo = NEW.titulo,
    descricao = NEW.descricao,
    canal_id = NEW.canal_id,
    serie_id = NEW.serie_id,
    status = NEW.status,
    prioridade = NEW.prioridade,
    origem = NEW.origem,
    tags = NEW.tags,
    linguagem = NEW.linguagem,
    metadata = NEW.metadata,
    updated_at = now()
WHERE id = OLD.id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS ideias_update_trigger ON public.ideias;
CREATE TRIGGER ideias_update_trigger INSTEAD OF
UPDATE ON public.ideias FOR EACH ROW EXECUTE FUNCTION public.ideias_update();
-- Trigger para DELETE em ideias
CREATE OR REPLACE FUNCTION public.ideias_delete() RETURNS TRIGGER AS $$ BEGIN
DELETE FROM pulso_content.ideias
WHERE id = OLD.id;
RETURN OLD;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS ideias_delete_trigger ON public.ideias;
CREATE TRIGGER ideias_delete_trigger INSTEAD OF DELETE ON public.ideias FOR EACH ROW EXECUTE FUNCTION public.ideias_delete();
-- Trigger para INSERT em roteiros
CREATE OR REPLACE FUNCTION public.roteiros_insert() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO pulso_content.roteiros
SELECT NEW.*;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS roteiros_insert_trigger ON public.roteiros;
CREATE TRIGGER roteiros_insert_trigger INSTEAD OF
INSERT ON public.roteiros FOR EACH ROW EXECUTE FUNCTION public.roteiros_insert();
-- Trigger para UPDATE em roteiros
CREATE OR REPLACE FUNCTION public.roteiros_update() RETURNS TRIGGER AS $$ BEGIN
UPDATE pulso_content.roteiros
SET ideia_id = NEW.ideia_id,
    titulo = NEW.titulo,
    conteudo_md = NEW.conteudo_md,
    versao = NEW.versao,
    status = NEW.status,
    duracao_estimado_segundos = NEW.duracao_estimado_segundos,
    linguagem = NEW.linguagem,
    criado_por = NEW.criado_por,
    revisado_por = NEW.revisado_por,
    canal_id = NEW.canal_id,
    metadata = NEW.metadata,
    updated_at = now()
WHERE id = OLD.id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS roteiros_update_trigger ON public.roteiros;
CREATE TRIGGER roteiros_update_trigger INSTEAD OF
UPDATE ON public.roteiros FOR EACH ROW EXECUTE FUNCTION public.roteiros_update();
-- Trigger para DELETE em roteiros
CREATE OR REPLACE FUNCTION public.roteiros_delete() RETURNS TRIGGER AS $$ BEGIN
DELETE FROM pulso_content.roteiros
WHERE id = OLD.id;
RETURN OLD;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS roteiros_delete_trigger ON public.roteiros;
CREATE TRIGGER roteiros_delete_trigger INSTEAD OF DELETE ON public.roteiros FOR EACH ROW EXECUTE FUNCTION public.roteiros_delete();
-- Trigger para INSERT em pipeline_producao
CREATE OR REPLACE FUNCTION public.pipeline_producao_insert() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO pulso_content.pipeline_producao
SELECT NEW.*;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS pipeline_producao_insert_trigger ON public.pipeline_producao;
CREATE TRIGGER pipeline_producao_insert_trigger INSTEAD OF
INSERT ON public.pipeline_producao FOR EACH ROW EXECUTE FUNCTION public.pipeline_producao_insert();
-- Trigger para UPDATE em pipeline_producao
CREATE OR REPLACE FUNCTION public.pipeline_producao_update() RETURNS TRIGGER AS $$ BEGIN
UPDATE pulso_content.pipeline_producao
SET ideia_id = NEW.ideia_id,
    roteiro_id = NEW.roteiro_id,
    titulo = NEW.titulo,
    status = NEW.status,
    prioridade = NEW.prioridade,
    data_entrega_prevista = NEW.data_entrega_prevista,
    data_gravacao = NEW.data_gravacao,
    data_edicao = NEW.data_edicao,
    data_finalizacao = NEW.data_finalizacao,
    responsavel_gravacao = NEW.responsavel_gravacao,
    responsavel_edicao = NEW.responsavel_edicao,
    notas_producao = NEW.notas_producao,
    arquivos_raw = NEW.arquivos_raw,
    metadata = NEW.metadata,
    updated_at = now()
WHERE id = OLD.id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS pipeline_producao_update_trigger ON public.pipeline_producao;
CREATE TRIGGER pipeline_producao_update_trigger INSTEAD OF
UPDATE ON public.pipeline_producao FOR EACH ROW EXECUTE FUNCTION public.pipeline_producao_update();
-- Trigger para DELETE em pipeline_producao
CREATE OR REPLACE FUNCTION public.pipeline_producao_delete() RETURNS TRIGGER AS $$ BEGIN
DELETE FROM pulso_content.pipeline_producao
WHERE id = OLD.id;
RETURN OLD;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS pipeline_producao_delete_trigger ON public.pipeline_producao;
CREATE TRIGGER pipeline_producao_delete_trigger INSTEAD OF DELETE ON public.pipeline_producao FOR EACH ROW EXECUTE FUNCTION public.pipeline_producao_delete();
-- Triggers para conteudos_producao (alias)
DROP TRIGGER IF EXISTS conteudos_producao_insert_trigger ON public.conteudos_producao;
CREATE TRIGGER conteudos_producao_insert_trigger INSTEAD OF
INSERT ON public.conteudos_producao FOR EACH ROW EXECUTE FUNCTION public.pipeline_producao_insert();
DROP TRIGGER IF EXISTS conteudos_producao_update_trigger ON public.conteudos_producao;
CREATE TRIGGER conteudos_producao_update_trigger INSTEAD OF
UPDATE ON public.conteudos_producao FOR EACH ROW EXECUTE FUNCTION public.pipeline_producao_update();
DROP TRIGGER IF EXISTS conteudos_producao_delete_trigger ON public.conteudos_producao;
CREATE TRIGGER conteudos_producao_delete_trigger INSTEAD OF DELETE ON public.conteudos_producao FOR EACH ROW EXECUTE FUNCTION public.pipeline_producao_delete();
-- =====================================================
-- RECARREGAR SCHEMA CACHE DO POSTGREST
-- =====================================================
NOTIFY pgrst,
'reload schema';
-- Verificação
SELECT 'Views criadas com sucesso!' as status;
SELECT table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN (
        'canais',
        'series',
        'ideias',
        'roteiros',
        'pipeline_producao',
        'conteudos_producao',
        'publicacoes',
        'plataformas'
    )
ORDER BY table_name;