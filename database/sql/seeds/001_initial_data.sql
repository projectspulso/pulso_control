-- =====================================================================
-- SEED INICIAL - PULSO
-- Execute no Supabase SQL Editor
-- =====================================================================
-- 1. Plataformas
INSERT INTO pulso_core.plataformas (tipo, nome_exibicao, descricao, ativo)
VALUES (
        'YOUTUBE_SHORTS',
        'YouTube Shorts',
        'Vídeos curtos do YouTube',
        true
    ),
    (
        'YOUTUBE_LONGO',
        'YouTube',
        'Vídeos longos do YouTube',
        true
    ),
    (
        'TIKTOK',
        'TikTok',
        'Rede social de vídeos curtos',
        true
    ),
    (
        'INSTAGRAM_REELS',
        'Instagram Reels',
        'Reels do Instagram',
        true
    ),
    (
        'KWAI',
        'Kwai',
        'Plataforma de vídeos curtos',
        true
    ),
    (
        'FACEBOOK_REELS',
        'Facebook Reels',
        'Reels do Facebook',
        true
    ) ON CONFLICT (tipo, nome_exibicao) DO NOTHING;
-- 2. Canal exemplo
DO $$
DECLARE v_canal_id uuid;
BEGIN
INSERT INTO pulso_core.canais (nome, slug, descricao, idioma, status)
VALUES (
        'Pulso Dark PT',
        'pulso-dark-pt',
        'Canal principal de conteúdos dark em português',
        'pt-BR',
        'ATIVO'
    ) ON CONFLICT (slug) DO
UPDATE
SET nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao,
    updated_at = timezone('utc', now())
RETURNING id INTO v_canal_id;
-- Se não retornou ID (conflito), buscar o ID existente
IF v_canal_id IS NULL THEN
SELECT id INTO v_canal_id
FROM pulso_core.canais
WHERE slug = 'pulso-dark-pt';
END IF;
-- 3. Séries usando o ID do canal
INSERT INTO pulso_core.series (
        canal_id,
        nome,
        slug,
        descricao,
        status,
        ordem_padrao
    )
VALUES (
        v_canal_id,
        'Curiosidades Dark',
        'curiosidades-dark',
        'Série sobre fatos curiosos e obscuros da história e ciência',
        'ATIVO',
        1
    ),
    (
        v_canal_id,
        'Mistérios Urbanos',
        'misterios-urbanos',
        'Casos inexplicáveis e lendas urbanas',
        'ATIVO',
        2
    ) ON CONFLICT (canal_id, slug) DO NOTHING;
RAISE NOTICE 'Canal ID: %',
v_canal_id;
END $$;
-- 4. Tags
INSERT INTO pulso_core.tags (nome, slug, descricao)
VALUES ('História', 'historia', 'Conteúdos históricos'),
    (
        'Ciência',
        'ciencia',
        'Fatos e curiosidades científicas'
    ),
    (
        'Mistério',
        'misterio',
        'Casos e enigmas não resolvidos'
    ),
    ('Tecnologia', 'tecnologia', 'Tech e inovação'),
    (
        'Cultura Pop',
        'cultura-pop',
        'Entretenimento e cultura'
    ),
    ('True Crime', 'true-crime', 'Crimes reais') ON CONFLICT (slug) DO NOTHING;
-- 5. Verificar dados criados
SELECT *
FROM public.vw_pulso_canais;
SELECT *
FROM public.vw_pulso_series;
SELECT *
FROM pulso_core.tags;
SELECT *
FROM pulso_core.plataformas;
| id | tipo | nome_exibicao | descricao | ativo | created_at | updated_at | | ------------------------------------ | --------------- | --------------- | ---------------------------- | ----- | -------------------------- | -------------------------- |
| 15b09439-1ce8-4952-89b6-9e94808c4900 | YOUTUBE_SHORTS | YouTube Shorts | Vídeos curtos do YouTube | true | 2025 -11 -19 23 :21 :51.658758 | 2025 -11 -19 23 :21 :51.658758 | | 19ae3c55-1647-4389-8d2c-47f1461cb60b | YOUTUBE_LONGO | YouTube | Vídeos longos do YouTube | true | 2025 -11 -19 23 :21 :51.658758 | 2025 -11 -19 23 :21 :51.658758 | | cf51935a-02ec-48a9-8822-cfd86bb6e902 | TIKTOK | TikTok | Rede social de vídeos curtos | true | 2025 -11 -19 23 :21 :51.658758 | 2025 -11 -19 23 :21 :51.658758 | | 02b97345-02c6-4e04-a654-1cbcb1a879f0 | INSTAGRAM_REELS | Instagram Reels | Reels do Instagram | true | 2025 -11 -19 23 :21 :51.658758 | 2025 -11 -19 23 :21 :51.658758 | | 62ef8a74-3d4e-425c-b9e4-a46cfa3a1f37 | KWAI | Kwai | Plataforma de vídeos curtos | true | 2025 -11 -19 23 :21 :51.658758 | 2025 -11 -19 23 :21 :51.658758 | | 786f0628-42a2-47aa-8ef7-caf89a443468 | FACEBOOK_REELS | Facebook Reels | Reels do Facebook | true | 2025 -11 -19 23 :21 :51.658758 | 2025 -11 -19 23 :21 :51.658758 |