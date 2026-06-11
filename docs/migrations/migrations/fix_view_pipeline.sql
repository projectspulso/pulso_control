-- Verificar estrutura da view pipeline_producao
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'pipeline_producao'
ORDER BY ordinal_position;
-- Se não tiver os campos, recriar a view:
DROP VIEW IF EXISTS public.pipeline_producao CASCADE;
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
    -- Dados da ideia
    i.titulo as ideia_titulo,
    i.descricao as ideia_descricao,
    i.tags as ideia_tags,
    i.status as ideia_status,
    -- Dados do canal
    i.canal_id,
    c.nome as canal_nome,
    -- Dados da série
    i.serie_id,
    s.nome as serie_nome,
    -- Dados do roteiro
    r.titulo as roteiro_titulo,
    r.status as roteiro_status,
    r.conteudo_md as roteiro_conteudo,
    -- Dados do áudio
    a.url as audio_url,
    a.duracao_segundos as audio_duracao,
    -- Dados do vídeo
    v.url as video_url,
    v.thumbnail_url
FROM pulso_content.pipeline_producao p
    LEFT JOIN pulso_content.ideias i ON p.ideia_id = i.id
    LEFT JOIN pulso_core.canais c ON i.canal_id = c.id
    LEFT JOIN pulso_core.series s ON i.serie_id = s.id
    LEFT JOIN pulso_content.roteiros r ON p.roteiro_id = r.id
    LEFT JOIN assets.audios a ON p.audio_id = a.id
    LEFT JOIN assets.videos v ON p.video_id = v.id;
-- Dar permissões
GRANT SELECT ON public.pipeline_producao TO anon,
    authenticated;
-- Verificar se funcionou
SELECT id,
    ideia_titulo,
    canal_nome,
    roteiro_titulo,
    status,
    prioridade
FROM public.pipeline_producao
LIMIT 10;