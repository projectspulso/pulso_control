-- =====================================================
-- VIEWS PÚBLICAS - Expor tabelas do pulso_* para public
-- =====================================================
-- View pública de canais
DROP VIEW IF EXISTS public.canais CASCADE;
CREATE OR REPLACE VIEW public.canais AS
SELECT *
FROM pulso_core.canais;
GRANT SELECT ON public.canais TO anon,
    authenticated;
-- View pública de séries
DROP VIEW IF EXISTS public.series CASCADE;
CREATE OR REPLACE VIEW public.series AS
SELECT *
FROM pulso_core.series;
GRANT SELECT ON public.series TO anon,
    authenticated;
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
-- View pública de tags
DROP VIEW IF EXISTS public.tags CASCADE;
CREATE OR REPLACE VIEW public.tags AS
SELECT *
FROM pulso_core.tags;
GRANT SELECT ON public.tags TO anon,
    authenticated;
-- View pública de workflow_execucoes
DROP VIEW IF EXISTS public.workflow_execucoes CASCADE;
CREATE OR REPLACE VIEW public.workflow_execucoes AS
SELECT *
FROM pulso_content.workflow_execucoes;
GRANT SELECT ON public.workflow_execucoes TO anon,
    authenticated;
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
-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON VIEW public.canais IS 'View pública de canais (pulso_core.canais)';
COMMENT ON VIEW public.series IS 'View pública de séries (pulso_core.series)';
COMMENT ON VIEW public.ideias IS 'View pública de ideias com triggers CRUD (pulso_content.ideias)';
COMMENT ON VIEW public.roteiros IS 'View pública de roteiros com triggers CRUD (pulso_content.roteiros)';
COMMENT ON VIEW public.tags IS 'View pública de tags (pulso_core.tags)';
COMMENT ON VIEW public.workflow_execucoes IS 'View pública de workflow_execucoes (pulso_content.workflow_execucoes)';