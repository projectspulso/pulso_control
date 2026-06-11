-- =====================================================
-- LIBERAR PERMISSÕES NO SCHEMA PULSO_CONTENT
-- =====================================================
-- Permitir uso do schema
GRANT USAGE ON SCHEMA pulso_content TO anon,
    authenticated;
GRANT USAGE ON SCHEMA pulso_core TO anon,
    authenticated;
GRANT USAGE ON SCHEMA assets TO anon,
    authenticated;
-- Permitir SELECT, INSERT, UPDATE, DELETE nas tabelas
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON pulso_content.ideias TO anon,
    authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON pulso_content.roteiros TO anon,
    authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON pulso_content.pipeline_producao TO anon,
    authenticated;
-- Permitir SELECT nas tabelas core (apenas leitura)
GRANT SELECT ON pulso_core.canais TO anon,
    authenticated;
GRANT SELECT ON pulso_core.series TO anon,
    authenticated;
-- Permitir nas tabelas de assets
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON assets.audios TO anon,
    authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON assets.videos TO anon,
    authenticated;
-- =====================================================
-- INSTEAD OF TRIGGERS nas views
-- =====================================================
-- Primeiro, vamos criar uma função helper para atualizar ideias
CREATE OR REPLACE FUNCTION public.atualizar_ideia() RETURNS TRIGGER AS $$ BEGIN
UPDATE pulso_content.ideias
SET titulo = COALESCE(NEW.titulo, titulo),
    descricao = COALESCE(NEW.descricao, descricao),
    canal_id = COALESCE(NEW.canal_id, canal_id),
    serie_id = NEW.serie_id,
    -- pode ser null
    prioridade = COALESCE(NEW.prioridade, prioridade),
    status = COALESCE(NEW.status, status),
    tags = COALESCE(NEW.tags, tags),
    metadata = COALESCE(NEW.metadata, metadata)
WHERE id = OLD.id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Criar INSTEAD OF UPDATE trigger na view
DROP TRIGGER IF EXISTS ideias_update_trigger ON public.ideias;
CREATE TRIGGER ideias_update_trigger INSTEAD OF
UPDATE ON public.ideias FOR EACH ROW EXECUTE FUNCTION public.atualizar_ideia();
-- Função para inserir ideias
CREATE OR REPLACE FUNCTION public.inserir_ideia() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO pulso_content.ideias (
        titulo,
        descricao,
        canal_id,
        serie_id,
        prioridade,
        status,
        tags,
        metadata
    )
VALUES (
        NEW.titulo,
        NEW.descricao,
        NEW.canal_id,
        NEW.serie_id,
        COALESCE(NEW.prioridade, 5),
        COALESCE(NEW.status, 'RASCUNHO'),
        COALESCE(NEW.tags, ARRAY []::text []),
        COALESCE(NEW.metadata, '{}'::jsonb)
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Criar INSTEAD OF INSERT trigger na view
DROP TRIGGER IF EXISTS ideias_insert_trigger ON public.ideias;
CREATE TRIGGER ideias_insert_trigger INSTEAD OF
INSERT ON public.ideias FOR EACH ROW EXECUTE FUNCTION public.inserir_ideia();
-- Função para deletar ideias
CREATE OR REPLACE FUNCTION public.deletar_ideia() RETURNS TRIGGER AS $$ BEGIN
DELETE FROM pulso_content.ideias
WHERE id = OLD.id;
RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Criar INSTEAD OF DELETE trigger na view
DROP TRIGGER IF EXISTS ideias_delete_trigger ON public.ideias;
CREATE TRIGGER ideias_delete_trigger INSTEAD OF DELETE ON public.ideias FOR EACH ROW EXECUTE FUNCTION public.deletar_ideia();
-- Fazer o mesmo para ROTEIROS
-- Função UPDATE
CREATE OR REPLACE FUNCTION public.atualizar_roteiro() RETURNS TRIGGER AS $$ BEGIN
UPDATE pulso_content.roteiros
SET titulo = COALESCE(NEW.titulo, titulo),
    conteudo_md = COALESCE(NEW.conteudo_md, conteudo_md),
    versao = COALESCE(NEW.versao, versao),
    status = COALESCE(NEW.status, status),
    linguagem = COALESCE(NEW.linguagem, linguagem),
    audio_id = NEW.audio_id,
    video_id = NEW.video_id,
    metadata = COALESCE(NEW.metadata, metadata)
WHERE id = OLD.id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS roteiros_update_trigger ON public.roteiros;
CREATE TRIGGER roteiros_update_trigger INSTEAD OF
UPDATE ON public.roteiros FOR EACH ROW EXECUTE FUNCTION public.atualizar_roteiro();
-- Função INSERT
CREATE OR REPLACE FUNCTION public.inserir_roteiro() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO pulso_content.roteiros (
        ideia_id,
        titulo,
        conteudo_md,
        versao,
        status,
        linguagem,
        metadata
    )
VALUES (
        NEW.ideia_id,
        NEW.titulo,
        NEW.conteudo_md,
        COALESCE(NEW.versao, 1),
        COALESCE(NEW.status, 'RASCUNHO'),
        COALESCE(NEW.linguagem, 'pt-BR'),
        COALESCE(NEW.metadata, '{}'::jsonb)
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS roteiros_insert_trigger ON public.roteiros;
CREATE TRIGGER roteiros_insert_trigger INSTEAD OF
INSERT ON public.roteiros FOR EACH ROW EXECUTE FUNCTION public.inserir_roteiro();
-- Função DELETE
CREATE OR REPLACE FUNCTION public.deletar_roteiro() RETURNS TRIGGER AS $$ BEGIN
DELETE FROM pulso_content.roteiros
WHERE id = OLD.id;
RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS roteiros_delete_trigger ON public.roteiros;
CREATE TRIGGER roteiros_delete_trigger INSTEAD OF DELETE ON public.roteiros FOR EACH ROW EXECUTE FUNCTION public.deletar_roteiro();
-- =====================================================
-- TRIGGERS PARA PIPELINE_PRODUCAO
-- =====================================================
-- Função UPDATE
CREATE OR REPLACE FUNCTION public.atualizar_pipeline() RETURNS TRIGGER AS $$ BEGIN
UPDATE pulso_content.pipeline_producao
SET status = COALESCE(NEW.status, status),
    prioridade = COALESCE(NEW.prioridade, prioridade),
    data_prevista = NEW.data_prevista,
    data_publicacao = NEW.data_publicacao,
    responsavel = NEW.responsavel,
    observacoes = NEW.observacoes,
    roteiro_id = NEW.roteiro_id,
    audio_id = NEW.audio_id,
    video_id = NEW.video_id,
    metadata = COALESCE(NEW.metadata, metadata)
WHERE id = OLD.id;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS pipeline_update_trigger ON public.pipeline_producao;
CREATE TRIGGER pipeline_update_trigger INSTEAD OF
UPDATE ON public.pipeline_producao FOR EACH ROW EXECUTE FUNCTION public.atualizar_pipeline();
-- Função INSERT
CREATE OR REPLACE FUNCTION public.inserir_pipeline() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO pulso_content.pipeline_producao (
        ideia_id,
        status,
        prioridade,
        data_prevista,
        responsavel,
        metadata
    )
VALUES (
        NEW.ideia_id,
        COALESCE(NEW.status, 'AGUARDANDO_ROTEIRO'),
        COALESCE(NEW.prioridade, 5),
        NEW.data_prevista,
        NEW.responsavel,
        COALESCE(NEW.metadata, '{}'::jsonb)
    );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS pipeline_insert_trigger ON public.pipeline_producao;
CREATE TRIGGER pipeline_insert_trigger INSTEAD OF
INSERT ON public.pipeline_producao FOR EACH ROW EXECUTE FUNCTION public.inserir_pipeline();
-- Função DELETE
CREATE OR REPLACE FUNCTION public.deletar_pipeline() RETURNS TRIGGER AS $$ BEGIN
DELETE FROM pulso_content.pipeline_producao
WHERE id = OLD.id;
RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS pipeline_delete_trigger ON public.pipeline_producao;
CREATE TRIGGER pipeline_delete_trigger INSTEAD OF DELETE ON public.pipeline_producao FOR EACH ROW EXECUTE FUNCTION public.deletar_pipeline();
-- =====================================================
-- TRIGGERS PARA PUBLICACOES_AGENDADAS (se existir)
-- =====================================================
-- Verificar se a tabela existe
DO $$ BEGIN IF EXISTS (
    SELECT
    FROM information_schema.tables
    WHERE table_schema = 'pulso_content'
        AND table_name = 'publicacoes_agendadas'
) THEN -- Criar view se não existir
CREATE OR REPLACE VIEW public.publicacoes_agendadas AS
SELECT *
FROM pulso_content.publicacoes_agendadas;
-- Função UPDATE
CREATE OR REPLACE FUNCTION public.atualizar_publicacao() RETURNS TRIGGER AS $func$ BEGIN
UPDATE pulso_content.publicacoes_agendadas
SET status = COALESCE(NEW.status, status),
    data_agendada = NEW.data_agendada,
    data_publicacao = NEW.data_publicacao,
    plataforma = COALESCE(NEW.plataforma, plataforma),
    url_publicada = NEW.url_publicada,
    metadata = COALESCE(NEW.metadata, metadata)
WHERE id = OLD.id;
RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS publicacoes_update_trigger ON public.publicacoes_agendadas;
CREATE TRIGGER publicacoes_update_trigger INSTEAD OF
UPDATE ON public.publicacoes_agendadas FOR EACH ROW EXECUTE FUNCTION public.atualizar_publicacao();
END IF;
END $$;
-- Verificar se os triggers foram criados
SELECT trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public'
    AND event_object_table IN (
        'ideias',
        'roteiros',
        'pipeline_producao',
        'publicacoes_agendadas'
    )
ORDER BY event_object_table,
    event_manipulation;