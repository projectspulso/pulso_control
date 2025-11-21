-- ============================================================================
-- SEED COMPLETO DO PROJETO PULSO
-- Popula todas as tabelas com dados reais do projeto
-- ============================================================================
-- 1. CANAL PRINCIPAL
-- Já existe: Pulso Dark PT (criado anteriormente)
-- 2. PLATAFORMAS
-- Já existem: YouTube, TikTok, Instagram, Facebook, Kwai (criadas anteriormente)
-- 3. CONECTAR CANAL ÀS PLATAFORMAS
INSERT INTO pulso_core.canais_plataformas (
        canal_id,
        plataforma_id,
        identificador_externo,
        nome_exibicao,
        url_canal,
        ativo
    )
SELECT c.id,
    p.id,
    CASE
        p.tipo
        WHEN 'YOUTUBE_LONGO' THEN '@PulsoDarkPT'
        WHEN 'YOUTUBE_SHORTS' THEN '@PulsoDarkPT'
        WHEN 'TIKTOK' THEN '@pulsodark'
        WHEN 'INSTAGRAM_REELS' THEN '@pulsodark'
        WHEN 'FACEBOOK_REELS' THEN 'PulsoDark'
        WHEN 'KWAI' THEN '@pulsodark'
    END,
    CASE
        p.tipo
        WHEN 'YOUTUBE_LONGO' THEN 'Pulso Dark PT - YouTube'
        WHEN 'YOUTUBE_SHORTS' THEN 'Pulso Dark PT - Shorts'
        WHEN 'TIKTOK' THEN 'Pulso Dark - TikTok'
        WHEN 'INSTAGRAM_REELS' THEN 'Pulso Dark - Instagram'
        WHEN 'FACEBOOK_REELS' THEN 'Pulso Dark - Facebook'
        WHEN 'KWAI' THEN 'Pulso Dark - Kwai'
    END,
    CASE
        p.tipo
        WHEN 'YOUTUBE_LONGO' THEN 'https://youtube.com/@PulsoDarkPT'
        WHEN 'YOUTUBE_SHORTS' THEN 'https://youtube.com/@PulsoDarkPT/shorts'
        WHEN 'TIKTOK' THEN 'https://tiktok.com/@pulsodark'
        WHEN 'INSTAGRAM_REELS' THEN 'https://instagram.com/@pulsodark'
        WHEN 'FACEBOOK_REELS' THEN 'https://facebook.com/PulsoDark'
        WHEN 'KWAI' THEN 'https://kwai.com/@pulsodark'
    END,
    true
FROM pulso_core.canais c
    CROSS JOIN pulso_core.plataformas p
WHERE c.slug = 'pulso-dark-pt' ON CONFLICT (plataforma_id, identificador_externo) DO NOTHING;
-- 4. ASSOCIAR TAGS ÀS SÉRIES
INSERT INTO pulso_core.series_tags (serie_id, tag_id)
SELECT s.id,
    t.id
FROM pulso_core.series s
    CROSS JOIN pulso_core.tags t
WHERE (
        s.slug = 'curiosidades-dark'
        AND t.slug IN (
            'ciencia',
            'historia',
            'tecnologia',
            'cultura-pop'
        )
    )
    OR (
        s.slug = 'misterios-urbanos'
        AND t.slug IN ('misterio', 'true-crime')
    ) ON CONFLICT (serie_id, tag_id) DO NOTHING;
-- 5. CRIAR WORKFLOWS N8N
INSERT INTO pulso_automation.workflows (
        nome,
        slug,
        descricao,
        origem,
        referencia_externa,
        ativo,
        configuracao
    )
VALUES (
        'Gerador de Roteiros IA',
        'gerador-roteiros-ia',
        'Workflow que pega ideias aprovadas e gera roteiros usando IA (ChatGPT/Claude)',
        'N8N',
        'workflow_001_roteiros',
        true,
        jsonb_build_object(
            'trigger',
            'webhook',
            'steps',
            jsonb_build_array('fetch_ideia', 'call_ai', 'save_roteiro'),
            'ai_model',
            'gpt-4'
        )
    ),
    (
        'Conversor TTS (Texto para Áudio)',
        'conversor-tts',
        'Converte roteiros aprovados em áudio usando ElevenLabs ou similar',
        'N8N',
        'workflow_002_tts',
        true,
        jsonb_build_object(
            'trigger',
            'manual',
            'tts_provider',
            'elevenlabs',
            'voice_id',
            'default'
        )
    ),
    (
        'Gerador de Vídeos',
        'gerador-videos',
        'Cria vídeos a partir de áudios e assets visuais',
        'N8N',
        'workflow_003_video',
        true,
        jsonb_build_object(
            'trigger',
            'manual',
            'video_tool',
            'remotion',
            'resolution',
            '1080p'
        )
    ),
    (
        'Publicador Multi-Plataforma',
        'publicador-multiplataforma',
        'Publica vídeos em YouTube, TikTok, Instagram, etc.',
        'N8N',
        'workflow_004_publish',
        true,
        jsonb_build_object(
            'trigger',
            'scheduled',
            'platforms',
            jsonb_build_array('youtube', 'tiktok', 'instagram'),
            'auto_schedule',
            true
        )
    ),
    (
        'Coletor de Métricas',
        'coletor-metricas',
        'Coleta métricas diárias de todas as plataformas',
        'N8N',
        'workflow_005_metrics',
        true,
        jsonb_build_object(
            'trigger',
            'cron',
            'schedule',
            '0 6 * * *',
            'platforms',
            jsonb_build_array('youtube', 'tiktok', 'instagram')
        )
    ) ON CONFLICT (slug) DO NOTHING;
-- 6. CRIAR EXECUÇÕES DE EXEMPLO DOS WORKFLOWS
INSERT INTO pulso_automation.workflow_execucoes (
        workflow_id,
        entidade_tipo,
        status,
        mensagem,
        payload_entrada,
        inicio_em,
        fim_em
    )
SELECT w.id,
    'ideia',
    CASE
        (random() * 3)::int
        WHEN 0 THEN 'SUCESSO'
        WHEN 1 THEN 'ERRO'
        WHEN 2 THEN 'EXECUTANDO'
        ELSE 'PENDENTE'
    END,
    CASE
        (random() * 3)::int
        WHEN 0 THEN 'Roteiro gerado com sucesso'
        WHEN 1 THEN 'Erro ao chamar API da IA'
        WHEN 2 THEN 'Gerando roteiro...'
        ELSE 'Aguardando execução'
    END,
    jsonb_build_object('ideia_id', gen_random_uuid()::text),
    NOW() - (random() * interval '7 days'),
    CASE
        WHEN (random() * 3)::int = 0 THEN NOW() - (random() * interval '6 days')
        ELSE NULL
    END
FROM pulso_automation.workflows w
    CROSS JOIN generate_series(1, 3) -- 3 execuções por workflow
WHERE w.slug IN (
        'gerador-roteiros-ia',
        'publicador-multiplataforma',
        'coletor-metricas'
    );
-- 7. CRIAR ALGUNS ROTEIROS A PARTIR DAS IDEIAS
INSERT INTO pulso_content.roteiros (
        ideia_id,
        titulo,
        versao,
        conteudo_md,
        duracao_estimado_segundos,
        status,
        metadata
    )
SELECT i.id,
    i.titulo,
    1,
    format(
        E'# %s\n\n## Introdução\n\n%s\n\n## Desenvolvimento\n\n[Conteúdo a ser desenvolvido]\n\n## Conclusão\n\n[Conclusão impactante]',
        i.titulo,
        COALESCE(i.descricao, 'Roteiro gerado automaticamente')
    ),
    60,
    -- 1 minuto
    CASE
        (random() * 4)::int
        WHEN 0 THEN 'RASCUNHO'::pulso_status_roteiro
        WHEN 1 THEN 'APROVADO'::pulso_status_roteiro
        WHEN 2 THEN 'EM_PRODUCAO'::pulso_status_roteiro
        ELSE 'PUBLICADO'::pulso_status_roteiro
    END,
    jsonb_build_object(
        'gerado_por',
        'ia',
        'modelo',
        'gpt-4',
        'formato',
        'curto',
        'tom',
        'dark'
    )
FROM pulso_content.ideias i
WHERE i.status IN ('APROVADA', 'EM_PRODUCAO')
LIMIT 15 ON CONFLICT DO NOTHING;
-- 8. CRIAR CONTEÚDOS (VÍDEOS) A PARTIR DOS ROTEIROS
INSERT INTO pulso_content.conteudos (
        canal_id,
        serie_id,
        roteiro_id,
        titulo_interno,
        sinopse,
        status,
        ordem_na_serie,
        tags,
        metadata
    )
SELECT r.i_canal_id,
    r.i_serie_id,
    r.id,
    r.titulo,
    substring(
        r.conteudo_md
        from 1 for 200
    ),
    CASE
        (random() * 4)::int
        WHEN 0 THEN 'RASCUNHO'::pulso_status_conteudo
        WHEN 1 THEN 'EM_PRODUCAO'::pulso_status_conteudo
        WHEN 2 THEN 'APROVADO'::pulso_status_conteudo
        ELSE 'PUBLICADO'::pulso_status_conteudo
    END,
    ROW_NUMBER() OVER (
        PARTITION BY r.i_serie_id
        ORDER BY r.created_at
    ),
    i.tags,
    jsonb_build_object(
        'duracao_segundos',
        r.duracao_estimado_segundos,
        'formato',
        'vertical',
        'resolucao',
        '1080x1920'
    )
FROM pulso_content.roteiros r
    INNER JOIN pulso_content.ideias i ON i.id = r.ideia_id
WHERE r.status IN ('APROVADO', 'EM_PRODUCAO', 'PUBLICADO')
LIMIT 10;
-- 9. CRIAR VARIANTES DOS CONTEÚDOS (para diferentes plataformas)
INSERT INTO pulso_content.conteudo_variantes (
        conteudo_id,
        nome_variacao,
        plataforma_tipo,
        status,
        titulo_publico,
        descricao_publica,
        legenda,
        hashtags,
        metadata
    )
SELECT c.id,
    CASE
        p.tipo
        WHEN 'YOUTUBE_SHORTS' THEN 'YouTube Shorts'
        WHEN 'TIKTOK' THEN 'TikTok'
        WHEN 'INSTAGRAM_REELS' THEN 'Instagram Reels'
        ELSE p.nome_exibicao
    END,
    p.tipo,
    c.status,
    c.titulo_interno || ' #shorts',
    c.sinopse,
    c.sinopse || E'\n\n👉 Siga para mais!',
    ARRAY ['#shorts', '#curiosidades', '#dark', '#misterios', '#viral']::text [],
    jsonb_build_object(
        'duracao_max',
        60,
        'formato',
        'vertical',
        'plataforma_original',
        p.tipo
    )
FROM pulso_content.conteudos c
    CROSS JOIN (
        SELECT *
        FROM pulso_core.plataformas
        WHERE tipo IN ('YOUTUBE_SHORTS', 'TIKTOK', 'INSTAGRAM_REELS')
    ) p
WHERE c.status IN ('APROVADO', 'PUBLICADO')
LIMIT 20;
-- 10. SIMULAR PUBLICAÇÕES (POSTS)
INSERT INTO pulso_distribution.posts (
        conteudo_variantes_id,
        canal_plataforma_id,
        status,
        titulo_publicado,
        descricao_publicada,
        legenda_publicada,
        url_publicacao,
        identificador_externo,
        data_agendada,
        data_publicacao,
        metadata
    )
SELECT cv.id,
    cp.id,
    CASE
        (random() * 4)::int
        WHEN 0 THEN 'AGENDADO'::pulso_status_post
        WHEN 1 THEN 'PUBLICADO'::pulso_status_post
        WHEN 2 THEN 'ERRO'::pulso_status_post
        ELSE 'RASCUNHO'::pulso_status_post
    END,
    cv.titulo_publico,
    cv.descricao_publica,
    cv.legenda,
    CASE
        WHEN (random() * 2)::int = 0 THEN 'https://youtube.com/shorts/' || substring(
            md5(random()::text)
            from 1 for 11
        )
        ELSE NULL
    END,
    CASE
        WHEN (random() * 2)::int = 0 THEN substring(
            md5(random()::text)
            from 1 for 16
        )
        ELSE NULL
    END,
    NOW() + (random() * interval '30 days'),
    CASE
        WHEN (random() * 2)::int = 0 THEN NOW() - (random() * interval '15 days')
        ELSE NULL
    END,
    jsonb_build_object(
        'auto_published',
        true,
        'workflow_id',
        'workflow_004_publish'
    )
FROM pulso_content.conteudo_variantes cv
    INNER JOIN pulso_core.canais c ON c.slug = 'pulso-dark-pt'
    INNER JOIN pulso_core.plataformas p ON p.tipo = cv.plataforma_tipo
    INNER JOIN pulso_core.canais_plataformas cp ON cp.canal_id = c.id
    AND cp.plataforma_id = p.id
WHERE cv.status = 'PUBLICADO'::pulso_status_conteudo
LIMIT 15;
-- 11. CRIAR MÉTRICAS PARA OS POSTS PUBLICADOS
INSERT INTO pulso_analytics.metricas_diarias (
        post_id,
        plataforma_id,
        data_ref,
        views,
        likes,
        deslikes,
        comentarios,
        compartilhamentos,
        cliques_link,
        inscricoes,
        watch_time_segundos,
        metadata
    )
SELECT p.id,
    cp.plataforma_id,
    (
        p.data_publicacao + (random() * interval '7 days')
    )::date,
    (random() * 50000)::bigint,
    (random() * 2000)::bigint,
    (random() * 50)::bigint,
    (random() * 200)::bigint,
    (random() * 500)::bigint,
    (random() * 1000)::bigint,
    (random() * 100)::bigint,
    (random() * 30000)::bigint,
    jsonb_build_object(
        'origem',
        'api_coleta',
        'confiabilidade',
        'alta'
    )
FROM pulso_distribution.posts p
    INNER JOIN pulso_core.canais_plataformas cp ON cp.id = p.canal_plataforma_id
WHERE p.status = 'PUBLICADO'::pulso_status_post
    AND p.data_publicacao IS NOT NULL
    CROSS JOIN generate_series(1, 3) -- 3 dias de métricas por post
    ON CONFLICT (post_id, data_ref) DO NOTHING;
-- 12. RESUMO FINAL
DO $$
DECLARE total_ideias INTEGER;
total_roteiros INTEGER;
total_conteudos INTEGER;
total_posts INTEGER;
total_workflows INTEGER;
BEGIN
SELECT COUNT(*) INTO total_ideias
FROM pulso_content.ideias;
SELECT COUNT(*) INTO total_roteiros
FROM pulso_content.roteiros;
SELECT COUNT(*) INTO total_conteudos
FROM pulso_content.conteudos;
SELECT COUNT(*) INTO total_posts
FROM pulso_distribution.posts;
SELECT COUNT(*) INTO total_workflows
FROM pulso_automation.workflows;
RAISE NOTICE '========================================';
RAISE NOTICE 'SEED COMPLETO - PROJETO PULSO';
RAISE NOTICE '========================================';
RAISE NOTICE 'Ideias: %',
total_ideias;
RAISE NOTICE 'Roteiros: %',
total_roteiros;
RAISE NOTICE 'Conteúdos: %',
total_conteudos;
RAISE NOTICE 'Posts: %',
total_posts;
RAISE NOTICE 'Workflows: %',
total_workflows;
RAISE NOTICE '========================================';
END $$;