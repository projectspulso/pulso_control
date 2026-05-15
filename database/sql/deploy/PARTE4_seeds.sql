-- =====================================================================
-- PARTE 4: SEEDS (idempotente — ON CONFLICT DO NOTHING)
-- Banco: nlcisbfdiokmipyihtuz
-- NOTA: O banco já tem dados reais (5+ canais, ideias, etc.)
--       Este script apenas garante que dados mínimos existam.
-- =====================================================================

-- 1. Plataformas
INSERT INTO pulso_core.plataformas (tipo, nome_exibicao, descricao, ativo) VALUES
    ('YOUTUBE_SHORTS', 'YouTube Shorts', 'Vídeos curtos do YouTube', true),
    ('YOUTUBE_LONGO', 'YouTube', 'Vídeos longos do YouTube', true),
    ('TIKTOK', 'TikTok', 'Rede social de vídeos curtos', true),
    ('INSTAGRAM_REELS', 'Instagram Reels', 'Reels do Instagram', true),
    ('KWAI', 'Kwai', 'Plataforma de vídeos curtos', true),
    ('FACEBOOK_REELS', 'Facebook Reels', 'Reels do Facebook', true)
ON CONFLICT (tipo, nome_exibicao) DO NOTHING;

-- 2. Tags
INSERT INTO pulso_core.tags (nome, slug, descricao) VALUES
    ('História', 'historia', 'Conteúdos históricos'),
    ('Ciência', 'ciencia', 'Fatos e curiosidades científicas'),
    ('Mistério', 'misterio', 'Casos e enigmas não resolvidos'),
    ('Tecnologia', 'tecnologia', 'Tech e inovação'),
    ('Cultura Pop', 'cultura-pop', 'Entretenimento e cultura'),
    ('True Crime', 'true-crime', 'Crimes reais')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================================
-- FIM PARTE 4 — Verificação:
-- =====================================================================
SELECT 'plataformas' AS tabela, COUNT(*) AS registros FROM pulso_core.plataformas
UNION ALL
SELECT 'tags', COUNT(*) FROM pulso_core.tags
UNION ALL
SELECT 'canais', COUNT(*) FROM pulso_core.canais;
