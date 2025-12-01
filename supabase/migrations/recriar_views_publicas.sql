-- =====================================================
-- RECRIAR VIEWS PÚBLICAS URGENTE
-- Execute este script AGORA no Supabase SQL Editor
-- =====================================================
-- 1. Verificar se schemas pulso_* existem
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = 'pulso_core'
) THEN RAISE EXCEPTION 'Schema pulso_core não existe! Execute as migrations base primeiro.';
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = 'pulso_content'
) THEN RAISE EXCEPTION 'Schema pulso_content não existe! Execute as migrations base primeiro.';
END IF;
END $$;
-- 2. Dropar views existentes (para evitar conflitos de estrutura)
DROP VIEW IF EXISTS public.vw_pulso_pipeline_com_assets_v2 CASCADE;
DROP VIEW IF EXISTS public.vw_pulso_pipeline_com_assets CASCADE;
DROP VIEW IF EXISTS public.conteudos_producao CASCADE;
DROP VIEW IF EXISTS public.pipeline_producao CASCADE;
DROP VIEW IF EXISTS public.roteiros CASCADE;
DROP VIEW IF EXISTS public.ideias CASCADE;
DROP VIEW IF EXISTS public.series CASCADE;
DROP VIEW IF EXISTS public.canais CASCADE;
-- 3. Recriar views públicas COM GARANTIA
CREATE OR REPLACE VIEW public.canais AS
SELECT *
FROM pulso_core.canais;
CREATE OR REPLACE VIEW public.series AS
SELECT *
FROM pulso_core.series;
CREATE OR REPLACE VIEW public.ideias AS
SELECT *
FROM pulso_content.ideias;
CREATE OR REPLACE VIEW public.roteiros AS
SELECT *
FROM pulso_content.roteiros;
CREATE OR REPLACE VIEW public.pipeline_producao AS
SELECT *
FROM pulso_content.pipeline_producao;
CREATE OR REPLACE VIEW public.conteudos_producao AS
SELECT *
FROM pulso_content.pipeline_producao;
-- Views auxiliares para assets e calendário
CREATE OR REPLACE VIEW public.vw_pulso_pipeline_com_assets AS
SELECT *
FROM pulso_content.vw_pulso_pipeline_com_assets;
CREATE OR REPLACE VIEW public.vw_pulso_pipeline_com_assets_v2 AS
SELECT *
FROM pulso_content.vw_pulso_pipeline_com_assets_v2;
-- 4. GARANTIR PERMISSÕES
GRANT SELECT ON public.canais TO anon,
    authenticated;
GRANT SELECT ON public.series TO anon,
    authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.ideias TO anon,
    authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.roteiros TO anon,
    authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.pipeline_producao TO anon,
    authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON public.conteudos_producao TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_pipeline_com_assets TO anon,
    authenticated;
GRANT SELECT ON public.vw_pulso_pipeline_com_assets_v2 TO anon,
    authenticated;
-- 5. Recriar triggers INSTEAD OF
-- Triggers para ideias
CREATE OR REPLACE FUNCTION public.ideias_insert() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO pulso_content.ideias
SELECT NEW.*;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
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
CREATE OR REPLACE FUNCTION public.ideias_delete() RETURNS TRIGGER AS $$ BEGIN
DELETE FROM pulso_content.ideias
WHERE id = OLD.id;
RETURN OLD;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS ideias_insert_trigger ON public.ideias;
CREATE TRIGGER ideias_insert_trigger INSTEAD OF
INSERT ON public.ideias FOR EACH ROW EXECUTE FUNCTION public.ideias_insert();
DROP TRIGGER IF EXISTS ideias_update_trigger ON public.ideias;
CREATE TRIGGER ideias_update_trigger INSTEAD OF
UPDATE ON public.ideias FOR EACH ROW EXECUTE FUNCTION public.ideias_update();
DROP TRIGGER IF EXISTS ideias_delete_trigger ON public.ideias;
CREATE TRIGGER ideias_delete_trigger INSTEAD OF DELETE ON public.ideias FOR EACH ROW EXECUTE FUNCTION public.ideias_delete();
-- Triggers para roteiros
CREATE OR REPLACE FUNCTION public.roteiros_insert() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO pulso_content.roteiros
SELECT NEW.*;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
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
CREATE OR REPLACE FUNCTION public.roteiros_delete() RETURNS TRIGGER AS $$ BEGIN
DELETE FROM pulso_content.roteiros
WHERE id = OLD.id;
RETURN OLD;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS roteiros_insert_trigger ON public.roteiros;
CREATE TRIGGER roteiros_insert_trigger INSTEAD OF
INSERT ON public.roteiros FOR EACH ROW EXECUTE FUNCTION public.roteiros_insert();
DROP TRIGGER IF EXISTS roteiros_update_trigger ON public.roteiros;
CREATE TRIGGER roteiros_update_trigger INSTEAD OF
UPDATE ON public.roteiros FOR EACH ROW EXECUTE FUNCTION public.roteiros_update();
DROP TRIGGER IF EXISTS roteiros_delete_trigger ON public.roteiros;
CREATE TRIGGER roteiros_delete_trigger INSTEAD OF DELETE ON public.roteiros FOR EACH ROW EXECUTE FUNCTION public.roteiros_delete();
-- Triggers para pipeline_producao
CREATE OR REPLACE FUNCTION public.pipeline_producao_insert() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO pulso_content.pipeline_producao
SELECT NEW.*;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
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
CREATE OR REPLACE FUNCTION public.pipeline_producao_delete() RETURNS TRIGGER AS $$ BEGIN
DELETE FROM pulso_content.pipeline_producao
WHERE id = OLD.id;
RETURN OLD;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS pipeline_producao_insert_trigger ON public.pipeline_producao;
CREATE TRIGGER pipeline_producao_insert_trigger INSTEAD OF
INSERT ON public.pipeline_producao FOR EACH ROW EXECUTE FUNCTION public.pipeline_producao_insert();
DROP TRIGGER IF EXISTS pipeline_producao_update_trigger ON public.pipeline_producao;
CREATE TRIGGER pipeline_producao_update_trigger INSTEAD OF
UPDATE ON public.pipeline_producao FOR EACH ROW EXECUTE FUNCTION public.pipeline_producao_update();
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
-- 6. RECARREGAR SCHEMA CACHE DO POSTGREST
NOTIFY pgrst,
'reload schema';
-- 7. Verificação final
SELECT 'Views públicas recriadas com sucesso!' as status;
-- Verificar se views existem e têm dados
SELECT 'canais' as tabela,
    COUNT(*) as registros
FROM public.canais
UNION ALL
SELECT 'series',
    COUNT(*)
FROM public.series
UNION ALL
SELECT 'ideias',
    COUNT(*)
FROM public.ideias
UNION ALL
SELECT 'roteiros',
    COUNT(*)
FROM public.roteiros
UNION ALL
SELECT 'pipeline_producao',
    COUNT(*)
FROM public.pipeline_producao;