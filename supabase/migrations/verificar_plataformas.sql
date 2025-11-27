-- =====================================================
-- VERIFICAR: Views de plataformas e configurações
-- =====================================================
-- 1) Verificar se existe view em public
SELECT schemaname,
    viewname
FROM pg_views
WHERE viewname = 'plataformas'
ORDER BY schemaname;
| schemaname | viewname | | ---------- | ----------- |
| public | plataformas | -- 2) Verificar dados na tabela original
SELECT id,
    tipo,
    nome_exibicao,
    ativo,
    created_at
FROM pulso_core.plataformas
ORDER BY tipo,
    nome_exibicao;
| id | tipo | nome_exibicao | ativo | created_at | | ------------------------------------ | --------------- | --------------- | ----- | -------------------------- |
| 15b09439-1ce8-4952-89b6-9e94808c4900 | YOUTUBE_SHORTS | YouTube Shorts | true | 2025 -11 -19 23 :21 :51.658758 | | 19ae3c55-1647-4389-8d2c-47f1461cb60b | YOUTUBE_LONGO | YouTube | true | 2025 -11 -19 23 :21 :51.658758 | | cf51935a-02ec-48a9-8822-cfd86bb6e902 | TIKTOK | TikTok | true | 2025 -11 -19 23 :21 :51.658758 | | 02b97345-02c6-4e04-a654-1cbcb1a879f0 | INSTAGRAM_REELS | Instagram Reels | true | 2025 -11 -19 23 :21 :51.658758 | | 786f0628-42a2-47aa-8ef7-caf89a443468 | FACEBOOK_REELS | Facebook Reels | true | 2025 -11 -19 23 :21 :51.658758 | | 62ef8a74-3d4e-425c-b9e4-a46cfa3a1f37 | KWAI | Kwai | true | 2025 -11 -19 23 :21 :51.658758 | -- 3) Verificar enum de tipos
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'public.pulso_plataforma_tipo'::regtype
ORDER BY enumsortorder;
| enumlabel | | --------------- |
| YOUTUBE_SHORTS | | YOUTUBE_LONGO | | TIKTOK | | INSTAGRAM_REELS | | INSTAGRAM_FEED | | FACEBOOK_REELS | | KWAI | | OUTRO | -- 4) Contar plataformas ativas
SELECT tipo,
    COUNT(*) as total
FROM pulso_core.plataformas
WHERE ativo = true
GROUP BY tipo
ORDER BY tipo;
| tipo | total | | --------------- | ----- |
| YOUTUBE_SHORTS | 1 | | YOUTUBE_LONGO | 1 | | TIKTOK | 1 | | INSTAGRAM_REELS | 1 | | FACEBOOK_REELS | 1 | | KWAI | 1 | uma coisa que não temos ainda sãoas ligações reais,
links reais e etc