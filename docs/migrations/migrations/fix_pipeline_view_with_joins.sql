-- =====================================================
-- FIX: Recriar view pipeline_producao com JOINs completos
-- =====================================================
-- Esta view precisa ter todas as colunas que o Kanban usa:
-- - ideia_titulo, ideia_descricao
-- - canal_id, canal_nome
-- - roteiro_titulo, roteiro_status
DROP VIEW IF EXISTS public.pipeline_producao CASCADE;
DROP VIEW IF EXISTS public.conteudos_producao CASCADE;
CREATE OR REPLACE VIEW public.pipeline_producao AS
SELECT p.id,
    p.ideia_id,
    p.roteiro_id,
    p.audio_id,
    p.video_id,
    p.status,
    p.prioridade,
    p.data_prevista,
    p.data_publicacao,
    p.responsavel,
    p.observacoes,
    p.metadata,
    p.created_at,
    p.updated_at,
    p.data_lancamento,
    -- Dados da ideia
    i.titulo as ideia_titulo,
    i.descricao as ideia_descricao,
    i.tags as ideia_tags,
    i.status as ideia_status,
    -- Dados do canal
    c.id as canal_id,
    c.nome as canal_nome,
    -- Dados da série
    s.id as serie_id,
    s.nome as serie_nome,
    -- Dados do roteiro
    r.titulo as roteiro_titulo,
    r.status as roteiro_status
FROM pulso_content.pipeline_producao p
    LEFT JOIN pulso_content.ideias i ON p.ideia_id = i.id
    LEFT JOIN pulso_core.canais c ON i.canal_id = c.id
    LEFT JOIN pulso_core.series s ON i.serie_id = s.id
    LEFT JOIN pulso_content.roteiros r ON p.roteiro_id = r.id;
-- Alias: conteudos_producao
CREATE OR REPLACE VIEW public.conteudos_producao AS
SELECT *
FROM public.pipeline_producao;
-- =====================================================
-- PERMISSÕES
-- =====================================================
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
-- =====================================================
-- TRIGGERS INSTEAD OF para permitir UPDATE/INSERT
-- =====================================================
-- Trigger para UPDATE em pipeline_producao
CREATE OR REPLACE FUNCTION public.pipeline_producao_update() RETURNS TRIGGER AS $$ BEGIN
UPDATE pulso_content.pipeline_producao
SET ideia_id = NEW.ideia_id,
    roteiro_id = NEW.roteiro_id,
    audio_id = NEW.audio_id,
    video_id = NEW.video_id,
    status = NEW.status,
    prioridade = NEW.prioridade,
    data_prevista = NEW.data_prevista,
    data_publicacao = NEW.data_publicacao,
    data_lancamento = NEW.data_lancamento,
    responsavel = NEW.responsavel,
    observacoes = NEW.observacoes,
    metadata = NEW.metadata,
    updated_at = now()
WHERE id = OLD.id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS pipeline_producao_update_trigger ON public.pipeline_producao;
CREATE TRIGGER pipeline_producao_update_trigger INSTEAD OF
UPDATE ON public.pipeline_producao FOR EACH ROW EXECUTE FUNCTION public.pipeline_producao_update();
-- Trigger para INSERT em pipeline_producao
CREATE OR REPLACE FUNCTION public.pipeline_producao_insert() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO pulso_content.pipeline_producao (
        ideia_id,
        roteiro_id,
        audio_id,
        video_id,
        status,
        prioridade,
        data_prevista,
        data_publicacao,
        data_lancamento,
        responsavel,
        observacoes,
        metadata
    )
VALUES (
        NEW.ideia_id,
        NEW.roteiro_id,
        NEW.audio_id,
        NEW.video_id,
        NEW.status,
        NEW.prioridade,
        NEW.data_prevista,
        NEW.data_publicacao,
        NEW.data_lancamento,
        NEW.responsavel,
        NEW.observacoes,
        NEW.metadata
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS pipeline_producao_insert_trigger ON public.pipeline_producao;
CREATE TRIGGER pipeline_producao_insert_trigger INSTEAD OF
INSERT ON public.pipeline_producao FOR EACH ROW EXECUTE FUNCTION public.pipeline_producao_insert();
-- Trigger para DELETE em pipeline_producao
CREATE OR REPLACE FUNCTION public.pipeline_producao_delete() RETURNS TRIGGER AS $$ BEGIN
DELETE FROM pulso_content.pipeline_producao
WHERE id = OLD.id;
RETURN OLD;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS pipeline_producao_delete_trigger ON public.pipeline_producao;
CREATE TRIGGER pipeline_producao_delete_trigger INSTEAD OF DELETE ON public.pipeline_producao FOR EACH ROW EXECUTE FUNCTION public.pipeline_producao_delete();
-- =====================================================
-- Triggers para conteudos_producao (alias)
-- =====================================================
DROP TRIGGER IF EXISTS conteudos_producao_update_trigger ON public.conteudos_producao;
CREATE TRIGGER conteudos_producao_update_trigger INSTEAD OF
UPDATE ON public.conteudos_producao FOR EACH ROW EXECUTE FUNCTION public.pipeline_producao_update();
DROP TRIGGER IF EXISTS conteudos_producao_insert_trigger ON public.conteudos_producao;
CREATE TRIGGER conteudos_producao_insert_trigger INSTEAD OF
INSERT ON public.conteudos_producao FOR EACH ROW EXECUTE FUNCTION public.pipeline_producao_insert();
DROP TRIGGER IF EXISTS conteudos_producao_delete_trigger ON public.conteudos_producao;
CREATE TRIGGER conteudos_producao_delete_trigger INSTEAD OF DELETE ON public.conteudos_producao FOR EACH ROW EXECUTE FUNCTION public.pipeline_producao_delete();
-- =====================================================
-- RECARREGAR CACHE
-- =====================================================
NOTIFY pgrst,
'reload schema';
-- Verificação
SELECT 'View pipeline_producao recriada com JOINs completos!' as status;
-- Testar a view
SELECT id,
    status,
    prioridade,
    ideia_titulo,
    canal_nome,
    roteiro_titulo
FROM public.pipeline_producao
LIMIT 5;