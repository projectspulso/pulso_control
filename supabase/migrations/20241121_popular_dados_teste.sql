-- =====================================================
-- POPULAR BANCO COM DADOS DE TESTE
-- Execute DEPOIS da migration principal
-- =====================================================
-- 1. INSERIR CANAIS
INSERT INTO core.canais (id, nome, tipo, descricao, url, ativo)
VALUES (
        '11111111-1111-1111-1111-111111111111',
        'Canal Principal YouTube',
        'YOUTUBE',
        'Canal principal de vídeos',
        'https://youtube.com/@pulso',
        true
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'TikTok PULSO',
        'TIKTOK',
        'Conteúdo curto e viral',
        'https://tiktok.com/@pulso',
        true
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'Instagram PULSO',
        'INSTAGRAM',
        'Reels e stories',
        'https://instagram.com/pulso',
        true
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        'Kwai PULSO',
        'KWAI',
        'Vídeos para Kwai',
        'https://kwai.com/@pulso',
        true
    ),
    (
        '55555555-5555-5555-5555-555555555555',
        'Podcast PULSO',
        'PODCAST',
        'Áudios longos',
        'https://anchor.fm/pulso',
        true
    ) ON CONFLICT (id) DO NOTHING;
-- 2. INSERIR SÉRIES
INSERT INTO core.series (id, canal_id, nome, descricao, ativo)
VALUES (
        'aaaa0001-0001-0001-0001-000000000001',
        '11111111-1111-1111-1111-111111111111',
        'Tutoriais Tech',
        'Tutoriais sobre tecnologia',
        true
    ),
    (
        'aaaa0002-0002-0002-0002-000000000002',
        '11111111-1111-1111-1111-111111111111',
        'Reviews',
        'Reviews de produtos',
        true
    ),
    (
        'aaaa0003-0003-0003-0003-000000000003',
        '22222222-2222-2222-2222-222222222222',
        'Dicas Rápidas',
        'Dicas em 60 segundos',
        true
    ),
    (
        'aaaa0004-0004-0004-0004-000000000004',
        '33333333-3333-3333-3333-333333333333',
        'Bastidores',
        'Conteúdo dos bastidores',
        true
    ),
    (
        'aaaa0005-0005-0005-0005-000000000005',
        '55555555-5555-5555-5555-555555555555',
        'Entrevistas',
        'Conversas com especialistas',
        true
    ) ON CONFLICT (id) DO NOTHING;
-- 3. INSERIR IDEIAS DE TESTE
INSERT INTO content.ideias (
        titulo,
        descricao,
        canal_id,
        serie_id,
        status,
        prioridade,
        origem,
        tags
    )
VALUES (
        'Como usar IA no dia a dia',
        'Tutorial prático sobre ferramentas de IA',
        '11111111-1111-1111-1111-111111111111',
        'aaaa0001-0001-0001-0001-000000000001',
        'APROVADA',
        9,
        'MANUAL',
        ARRAY ['ia', 'tutorial', 'produtividade']
    ),
    (
        'Review do ChatGPT Plus',
        'Review completo do ChatGPT Plus',
        '11111111-1111-1111-1111-111111111111',
        'aaaa0002-0002-0002-0002-000000000002',
        'APROVADA',
        8,
        'TRENDING',
        ARRAY ['chatgpt', 'review', 'ia']
    ),
    (
        '5 prompts essenciais',
        'Os 5 prompts que você precisa conhecer',
        '22222222-2222-2222-2222-222222222222',
        'aaaa0003-0003-0003-0003-000000000003',
        'APROVADA',
        7,
        'IA',
        ARRAY ['prompts', 'dicas', 'ia']
    ),
    (
        'Meu setup de trabalho 2025',
        'Tour pelo meu setup atualizado',
        '33333333-3333-3333-3333-333333333333',
        'aaaa0004-0004-0004-0004-000000000004',
        'RASCUNHO',
        5,
        'MANUAL',
        ARRAY ['setup', 'workspace']
    ),
    (
        'Entrevista com dev sênior',
        'Conversa sobre carreira tech',
        '55555555-5555-5555-5555-555555555555',
        'aaaa0005-0005-0005-0005-000000000005',
        'EM_ANALISE',
        6,
        'MANUAL',
        ARRAY ['entrevista', 'carreira', 'tech']
    ),
    (
        'Melhor notebook 2025',
        'Comparativo de notebooks para trabalho',
        '11111111-1111-1111-1111-111111111111',
        'aaaa0002-0002-0002-0002-000000000002',
        'APROVADA',
        8,
        'FEEDBACK',
        ARRAY ['notebook', 'review', 'hardware']
    ),
    (
        'IA vai substituir programadores?',
        'Reflexão sobre o futuro da programação',
        '55555555-5555-5555-5555-555555555555',
        'aaaa0005-0005-0005-0005-000000000005',
        'RASCUNHO',
        4,
        'TRENDING',
        ARRAY ['ia', 'programação', 'futuro']
    ),
    (
        'Tutorial Git para iniciantes',
        'Git e GitHub do zero',
        '11111111-1111-1111-1111-111111111111',
        'aaaa0001-0001-0001-0001-000000000001',
        'APROVADA',
        9,
        'MANUAL',
        ARRAY ['git', 'github', 'tutorial']
    ),
    (
        'Melhores extensões VSCode',
        'Top 10 extensões que uso diariamente',
        '22222222-2222-2222-2222-222222222222',
        'aaaa0003-0003-0003-0003-000000000003',
        'APROVADA',
        7,
        'MANUAL',
        ARRAY ['vscode', 'extensões', 'dicas']
    ),
    (
        'Como monetizar conteúdo',
        'Estratégias de monetização 2025',
        '55555555-5555-5555-5555-555555555555',
        'aaaa0005-0005-0005-0005-000000000005',
        'RASCUNHO',
        6,
        'MANUAL',
        ARRAY ['monetização', 'youtube', 'estratégia']
    );
-- 4. INSERIR ROTEIROS DE TESTE
INSERT INTO content.roteiros (
        ideia_id,
        titulo,
        conteudo_md,
        status,
        duracao_minutos,
        criado_por
    )
SELECT id,
    titulo,
    '# ' || titulo || E'\n\n## Introdução\n\nBem-vindo a este conteúdo sobre ' || titulo || E'\n\n## Desenvolvimento\n\nConteúdo principal aqui...\n\n## Conclusão\n\nEspero que tenham gostado!',
    'APROVADO',
    CASE
        WHEN canal_id = '22222222-2222-2222-2222-222222222222' THEN 1
        ELSE 10
    END,
    'IA'
FROM content.ideias
WHERE status = 'APROVADA'
LIMIT 5;
-- 5. INSERIR ITENS NO PIPELINE
INSERT INTO content.pipeline_producao (
        ideia_id,
        status,
        prioridade,
        data_prevista,
        responsavel
    )
SELECT i.id,
    CASE
        WHEN random() < 0.15 THEN 'AGUARDANDO_ROTEIRO'
        WHEN random() < 0.30 THEN 'ROTEIRO_PRONTO'
        WHEN random() < 0.50 THEN 'AUDIO_GERADO'
        WHEN random() < 0.70 THEN 'EM_EDICAO'
        WHEN random() < 0.85 THEN 'PRONTO_PUBLICACAO'
        ELSE 'PUBLICADO'
    END,
    i.prioridade,
    now() + (random() * interval '30 days'),
    'Equipe PULSO'
FROM content.ideias i
WHERE i.status IN ('APROVADA', 'EM_PRODUCAO')
LIMIT 6;
-- 6. VERIFICAR DADOS
SELECT 'Canais criados:' as tipo,
    COUNT(*)::text as quantidade
FROM core.canais
UNION ALL
SELECT 'Séries criadas:',
    COUNT(*)::text
FROM core.series
UNION ALL
SELECT 'Ideias criadas:',
    COUNT(*)::text
FROM content.ideias
UNION ALL
SELECT 'Roteiros criados:',
    COUNT(*)::text
FROM content.roteiros
UNION ALL
SELECT 'Pipeline itens:',
    COUNT(*)::text
FROM content.pipeline_producao;