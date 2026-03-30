-- =============================================
-- PULSO - Seed de Exemplo Completo
-- Pipeline: Ideia → Roteiro → Conteúdo → Variantes → Post → Métricas
-- Execute no SQL Editor do Supabase
-- Todos os IDs são UUIDs válidos gerados via gen_random_uuid()
-- =============================================

-- Variáveis de ID usando WITH para manter referências
DO $$
DECLARE
  -- Usuarios
  v_usr1 uuid := 'a1000000-0000-0000-0000-000000000001';
  v_usr2 uuid := 'a1000000-0000-0000-0000-000000000002';
  -- Canais
  v_canal1 uuid := 'b1000000-0000-0000-0000-000000000001';
  v_canal2 uuid := 'b1000000-0000-0000-0000-000000000002';
  v_canal3 uuid := 'b1000000-0000-0000-0000-000000000003';
  -- Plataformas
  v_plat_yt_shorts uuid := 'c1000000-0000-0000-0000-000000000001';
  v_plat_yt_longo  uuid := 'c1000000-0000-0000-0000-000000000002';
  v_plat_tiktok    uuid := 'c1000000-0000-0000-0000-000000000003';
  v_plat_ig_reels  uuid := 'c1000000-0000-0000-0000-000000000004';
  v_plat_fb_reels  uuid := 'c1000000-0000-0000-0000-000000000005';
  v_plat_kwai      uuid := 'c1000000-0000-0000-0000-000000000006';
  -- Canais_Plataformas
  v_cp1 uuid := 'd1000000-0000-0000-0000-000000000001';
  v_cp2 uuid := 'd1000000-0000-0000-0000-000000000002';
  v_cp3 uuid := 'd1000000-0000-0000-0000-000000000003';
  v_cp4 uuid := 'd1000000-0000-0000-0000-000000000004';
  v_cp5 uuid := 'd1000000-0000-0000-0000-000000000005';
  v_cp6 uuid := 'd1000000-0000-0000-0000-000000000006';
  -- Series
  v_serie1 uuid := 'e1000000-0000-0000-0000-000000000001';
  v_serie2 uuid := 'e1000000-0000-0000-0000-000000000002';
  v_serie3 uuid := 'e1000000-0000-0000-0000-000000000003';
  v_serie4 uuid := 'e1000000-0000-0000-0000-000000000004';
  -- Tags
  v_tag1 uuid := 'f1000000-0000-0000-0000-000000000001';
  v_tag2 uuid := 'f1000000-0000-0000-0000-000000000002';
  v_tag3 uuid := 'f1000000-0000-0000-0000-000000000003';
  v_tag4 uuid := 'f1000000-0000-0000-0000-000000000004';
  v_tag5 uuid := 'f1000000-0000-0000-0000-000000000005';
  v_tag6 uuid := 'f1000000-0000-0000-0000-000000000006';
  -- Ideias
  v_ideia1 uuid := '11000000-0000-0000-0000-000000000001';
  v_ideia2 uuid := '11000000-0000-0000-0000-000000000002';
  v_ideia3 uuid := '11000000-0000-0000-0000-000000000003';
  v_ideia4 uuid := '11000000-0000-0000-0000-000000000004';
  v_ideia5 uuid := '11000000-0000-0000-0000-000000000005';
  v_ideia6 uuid := '11000000-0000-0000-0000-000000000006';
  -- Roteiros
  v_rot1 uuid := '22000000-0000-0000-0000-000000000001';
  v_rot2 uuid := '22000000-0000-0000-0000-000000000002';
  v_rot3 uuid := '22000000-0000-0000-0000-000000000003';
  -- Conteudos
  v_cont1 uuid := '33000000-0000-0000-0000-000000000001';
  v_cont2 uuid := '33000000-0000-0000-0000-000000000002';
  v_cont3 uuid := '33000000-0000-0000-0000-000000000003';
  v_cont4 uuid := '33000000-0000-0000-0000-000000000004';
  -- Variantes
  v_var1a uuid := '44000000-0000-0000-0000-000000000001';
  v_var1b uuid := '44000000-0000-0000-0000-000000000002';
  v_var1c uuid := '44000000-0000-0000-0000-000000000003';
  v_var2a uuid := '44000000-0000-0000-0000-000000000004';
  v_var2b uuid := '44000000-0000-0000-0000-000000000005';
  v_var3a uuid := '44000000-0000-0000-0000-000000000006';
  v_var3b uuid := '44000000-0000-0000-0000-000000000007';
  -- Assets
  v_asset1_audio uuid := '55000000-0000-0000-0000-000000000001';
  v_asset1_video uuid := '55000000-0000-0000-0000-000000000002';
  v_asset1_thumb uuid := '55000000-0000-0000-0000-000000000003';
  v_asset2_audio uuid := '55000000-0000-0000-0000-000000000004';
  -- Posts
  v_post1a uuid := '66000000-0000-0000-0000-000000000001';
  v_post1b uuid := '66000000-0000-0000-0000-000000000002';
  v_post1c uuid := '66000000-0000-0000-0000-000000000003';
  v_post3a uuid := '66000000-0000-0000-0000-000000000004';
  v_post3b uuid := '66000000-0000-0000-0000-000000000005';
  -- Metricas
  v_met uuid;
  -- Workflows
  v_wf1 uuid := '77000000-0000-0000-0000-000000000001';
  v_wf2 uuid := '77000000-0000-0000-0000-000000000002';
  v_wf3 uuid := '77000000-0000-0000-0000-000000000003';
  v_wf4 uuid := '77000000-0000-0000-0000-000000000004';
BEGIN

-- =============================================
-- 1. USUARIOS INTERNOS
-- =============================================
INSERT INTO pulso_core.usuarios_internos (id, nome, email, papel, ativo)
VALUES
  (v_usr1, 'Junior Silva', 'junior@pulso.ai', 'ADMIN', true),
  (v_usr2, 'Ana Costa', 'ana@pulso.ai', 'EDITOR', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2. CANAIS
-- =============================================
INSERT INTO pulso_core.canais (id, nome, slug, descricao, idioma, status, metadata)
VALUES
  (v_canal1, 'Notícias Tech', 'noticias-tech', 'Canal de notícias sobre tecnologia e inovação', 'pt-BR', 'ATIVO', '{"cor": "#3B82F6", "icone": "monitor"}'),
  (v_canal2, 'Curiosidades Mundo', 'curiosidades-mundo', 'Fatos curiosos e interessantes do mundo', 'pt-BR', 'ATIVO', '{"cor": "#10B981", "icone": "globe"}'),
  (v_canal3, 'Finanças Simplificadas', 'financas-simplificadas', 'Educação financeira de forma simples', 'pt-BR', 'ATIVO', '{"cor": "#F59E0B", "icone": "dollar-sign"}')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. PLATAFORMAS
-- =============================================
INSERT INTO pulso_core.plataformas (id, tipo, nome_exibicao, descricao, ativo)
VALUES
  (v_plat_yt_shorts, 'YOUTUBE_SHORTS', 'YouTube Shorts', 'Vídeos curtos no YouTube', true),
  (v_plat_yt_longo, 'YOUTUBE_LONGO', 'YouTube', 'Vídeos longos no YouTube', true),
  (v_plat_tiktok, 'TIKTOK', 'TikTok', 'Vídeos no TikTok', true),
  (v_plat_ig_reels, 'INSTAGRAM_REELS', 'Instagram Reels', 'Reels no Instagram', true),
  (v_plat_fb_reels, 'FACEBOOK_REELS', 'Facebook Reels', 'Reels no Facebook', true),
  (v_plat_kwai, 'KWAI', 'Kwai', 'Vídeos no Kwai', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 4. CANAIS_PLATAFORMAS
-- =============================================
INSERT INTO pulso_core.canais_plataformas (id, canal_id, plataforma_id, identificador_externo, nome_exibicao, url_canal, ativo, configuracoes)
VALUES
  (v_cp1, v_canal1, v_plat_yt_shorts, '@NoticiasTechBR', 'Notícias Tech Shorts', 'https://youtube.com/@NoticiasTechBR', true, '{}'),
  (v_cp2, v_canal1, v_plat_tiktok, '@noticiastech', 'Notícias Tech TikTok', 'https://tiktok.com/@noticiastech', true, '{}'),
  (v_cp3, v_canal1, v_plat_ig_reels, '@noticiastech.br', 'Notícias Tech IG', 'https://instagram.com/noticiastech.br', true, '{}'),
  (v_cp4, v_canal2, v_plat_yt_shorts, '@CuriosidadesMundo', 'Curiosidades Shorts', 'https://youtube.com/@CuriosidadesMundo', true, '{}'),
  (v_cp5, v_canal2, v_plat_tiktok, '@curiosidades.mundo', 'Curiosidades TikTok', 'https://tiktok.com/@curiosidades.mundo', true, '{}'),
  (v_cp6, v_canal3, v_plat_yt_longo, '@FinancasSimples', 'Finanças YT', 'https://youtube.com/@FinancasSimples', true, '{}')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 5. SÉRIES
-- =============================================
INSERT INTO pulso_core.series (id, canal_id, nome, slug, descricao, status, ordem_padrao, metadata)
VALUES
  (v_serie1, v_canal1, 'IA no Dia a Dia', 'ia-no-dia-a-dia', 'Como a inteligência artificial está mudando o cotidiano', 'ATIVO', 1, '{}'),
  (v_serie2, v_canal1, 'Tech em 60s', 'tech-em-60s', 'Notícias de tecnologia em 60 segundos', 'ATIVO', 2, '{}'),
  (v_serie3, v_canal2, 'Você Sabia?', 'voce-sabia', 'Fatos surpreendentes sobre o mundo', 'ATIVO', 1, '{}'),
  (v_serie4, v_canal3, 'Investimento Fácil', 'investimento-facil', 'Guia básico de investimentos', 'ATIVO', 1, '{}')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 6. TAGS
-- =============================================
INSERT INTO pulso_core.tags (id, nome, slug, descricao)
VALUES
  (v_tag1, 'Inteligência Artificial', 'inteligencia-artificial', 'Conteúdos sobre IA'),
  (v_tag2, 'Tecnologia', 'tecnologia', 'Tecnologia em geral'),
  (v_tag3, 'Viral', 'viral', 'Conteúdo com potencial viral'),
  (v_tag4, 'Educativo', 'educativo', 'Conteúdo educacional'),
  (v_tag5, 'Finanças', 'financas', 'Conteúdo financeiro'),
  (v_tag6, 'Trending', 'trending', 'Temas em alta')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 7. IDEIAS
-- =============================================
INSERT INTO pulso_content.ideias (id, canal_id, serie_id, titulo, descricao, origem, prioridade, status, tags, linguagem, criado_por, metadata)
VALUES
  (v_ideia1, v_canal1, v_serie1,
   'ChatGPT-5 muda tudo: o que esperar',
   'Análise das novidades do ChatGPT-5 e como isso impacta o mercado de trabalho e o dia a dia',
   'MANUAL', 5, 'CONCLUIDA',
   ARRAY['inteligencia-artificial', 'trending'], 'pt-BR', v_usr1::text,
   '{"fonte": "OpenAI Blog", "urgencia": "alta"}'),

  (v_ideia2, v_canal1, v_serie2,
   'Apple Vision Pro 2 - vale a pena?',
   'Review rápido do novo Apple Vision Pro 2 em formato shorts',
   'MANUAL', 4, 'EM_PRODUCAO',
   ARRAY['tecnologia'], 'pt-BR', v_usr1::text,
   '{"fonte": "Apple Event"}'),

  (v_ideia3, v_canal2, v_serie3,
   '5 países que não existiam há 30 anos',
   'Fatos curiosos sobre países que surgiram recentemente no mapa',
   'AI_SUGESTAO', 3, 'APROVADA',
   ARRAY['viral', 'educativo'], 'pt-BR', v_usr2::text,
   '{"ai_score": 8.5}'),

  (v_ideia4, v_canal3, v_serie4,
   'Tesouro Direto para iniciantes em 2026',
   'Guia completo de como começar a investir no Tesouro Direto',
   'MANUAL', 3, 'RASCUNHO',
   ARRAY['financas', 'educativo'], 'pt-BR', v_usr2::text,
   '{}'),

  (v_ideia5, v_canal1, v_serie1,
   'Gemini 3.0 vs Claude 4 - qual é melhor?',
   'Comparativo entre os dois maiores modelos de IA de 2026',
   'AI_SUGESTAO', 4, 'RASCUNHO',
   ARRAY['inteligencia-artificial', 'trending'], 'pt-BR', v_usr1::text,
   '{"ai_score": 9.2}'),

  (v_ideia6, v_canal1, NULL,
   'Review do iPhone 16 (ultrapassado)',
   'Review que ficou desatualizado',
   'MANUAL', 1, 'ARQUIVADA',
   ARRAY['tecnologia'], 'pt-BR', v_usr1::text,
   '{"motivo_arquivo": "conteudo desatualizado"}')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 8. ROTEIROS
-- =============================================
INSERT INTO pulso_content.roteiros (id, ideia_id, titulo, versao, conteudo_md, duracao_estimado_segundos, status, linguagem, criado_por, revisado_por, metadata)
VALUES
  (v_rot1, v_ideia1, 'ChatGPT-5: Tudo que mudou', 1,
   E'# ChatGPT-5: Tudo que mudou\n\n## HOOK (0-3s)\n🎯 "O ChatGPT-5 acabou de sair e NADA será como antes..."\n\n## DESENVOLVIMENTO (3-45s)\n- Raciocínio em tempo real\n- Agentes autônomos que executam tarefas\n- Integração nativa com apps do celular\n- Memória persistente entre conversas\n\n## CTA (45-60s)\n"Segue pra mais novidades de IA todo dia!"',
   60, 'CONCLUIDO', 'pt-BR', v_usr1::text, v_usr2::text,
   '{"tom": "empolgado", "referencias": ["openai.com/blog"]}'),

  (v_rot2, v_ideia2, 'Apple Vision Pro 2 em 60s', 1,
   E'# Apple Vision Pro 2 em 60s\n\n## HOOK (0-3s)\n"A Apple acabou de lançar o Vision Pro 2 e o preço vai te CHOCAR"\n\n## DESENVOLVIMENTO (3-50s)\n- Preço reduzido pela metade\n- Tela 8K por olho\n- Bateria de 4 horas\n- Mais leve que óculos normais\n\n## CTA (50-60s)\n"Comenta se vale a pena!"',
   60, 'APROVADO', 'pt-BR', v_usr1::text, v_usr2::text,
   '{"tom": "informativo"}'),

  (v_rot3, v_ideia3, '5 Países Novos no Mapa', 1,
   E'# 5 Países que não existiam há 30 anos\n\n## HOOK (0-3s)\n"Esses 5 países NÃO EXISTIAM há 30 anos..."\n\n## PAÍSES\n1. Sudão do Sul (2011)\n2. Kosovo (2008)\n3. Montenegro (2006)\n4. Timor-Leste (2002)\n5. Eritreia (1993)\n\n## CTA\n"Qual desses te surpreendeu mais? Comenta!"',
   55, 'RASCUNHO', 'pt-BR', v_usr2::text, NULL,
   '{}')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 9. CONTEÚDOS
-- =============================================
INSERT INTO pulso_content.conteudos (id, canal_id, serie_id, roteiro_id, titulo_interno, sinopse, status, linguagem, ordem_na_serie, tags, metadata, criado_por)
VALUES
  (v_cont1, v_canal1, v_serie1, v_rot1,
   'ChatGPT-5 - Tudo que mudou',
   'Análise completa do ChatGPT-5 em formato shorts',
   'PUBLICADO', 'pt-BR', 1,
   ARRAY['inteligencia-artificial', 'trending'],
   '{"performance_target": "100k views"}',
   v_usr1::text),

  (v_cont2, v_canal1, v_serie2, v_rot2,
   'Apple Vision Pro 2 - 60 segundos',
   'Review rápido do Vision Pro 2',
   'EM_PRODUCAO', 'pt-BR', 5,
   ARRAY['tecnologia'],
   '{}',
   v_usr1::text),

  (v_cont3, v_canal2, v_serie3, NULL,
   '5 Países Novos no Mapa',
   'Fatos curiosos sobre países recentes',
   'PRONTO', 'pt-BR', 3,
   ARRAY['viral', 'educativo'],
   '{}',
   v_usr2::text),

  (v_cont4, v_canal3, v_serie4, NULL,
   'Tesouro Direto 2026',
   'Guia de investimento no Tesouro',
   'RASCUNHO', 'pt-BR', 1,
   ARRAY['financas', 'educativo'],
   '{}',
   v_usr2::text)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 10. CONTEUDO VARIANTES
-- =============================================
INSERT INTO pulso_content.conteudo_variantes (id, conteudo_id, nome_variacao, plataforma_tipo, status, titulo_publico, descricao_publica, legenda, hashtags, linguagem, ordem_exibicao, metadata)
VALUES
  (v_var1a, v_cont1, 'YouTube Shorts', 'YOUTUBE_SHORTS', 'PUBLICADO',
   'ChatGPT-5 MUDOU TUDO',
   'O ChatGPT-5 acabou de sair e nada será como antes! Veja as 4 mudanças mais insanas.',
   'O ChatGPT-5 acabou de sair e NADA será como antes...',
   ARRAY['#ia', '#chatgpt5', '#tecnologia', '#inteligenciaartificial', '#tech'],
   'pt-BR', 1, '{"thumbnail_style": "impacto"}'),

  (v_var1b, v_cont1, 'TikTok', 'TIKTOK', 'PUBLICADO',
   'ChatGPT-5 mudou TUDO',
   NULL,
   'O ChatGPT-5 acabou de sair e NADA será como antes... Segue pra mais!',
   ARRAY['#ia', '#chatgpt5', '#tech', '#fyp', '#viral'],
   'pt-BR', 2, '{}'),

  (v_var1c, v_cont1, 'Instagram Reels', 'INSTAGRAM_REELS', 'PUBLICADO',
   NULL, NULL,
   'ChatGPT-5 acabou de sair e TUDO mudou! 4 novidades insanas. Salva pra não esquecer!',
   ARRAY['#ia', '#chatgpt', '#tecnologia', '#inovacao'],
   'pt-BR', 3, '{}'),

  (v_var2a, v_cont2, 'YouTube Shorts', 'YOUTUBE_SHORTS', 'EM_PRODUCAO',
   'Apple Vision Pro 2 - PREÇO CHOCANTE',
   'O novo Vision Pro 2 da Apple surpreende no preço e nas specs!',
   'A Apple acabou de lançar o Vision Pro 2 e o preço vai te CHOCAR',
   ARRAY['#apple', '#visionpro', '#tech', '#vr'],
   'pt-BR', 1, '{}'),

  (v_var2b, v_cont2, 'TikTok', 'TIKTOK', 'RASCUNHO',
   'Vision Pro 2 vale a pena?',
   NULL,
   'Apple Vision Pro 2 - vale o preço?',
   ARRAY['#apple', '#visionpro', '#tech', '#fyp'],
   'pt-BR', 2, '{}'),

  (v_var3a, v_cont3, 'YouTube Shorts', 'YOUTUBE_SHORTS', 'PRONTO',
   '5 PAÍSES que NÃO EXISTIAM há 30 anos!',
   'Você sabia que esses 5 países foram criados recentemente?',
   'Esses 5 países NÃO EXISTIAM há 30 anos... O último vai te surpreender!',
   ARRAY['#curiosidades', '#paises', '#geografia', '#vocesabia'],
   'pt-BR', 1, '{}'),

  (v_var3b, v_cont3, 'TikTok', 'TIKTOK', 'PRONTO',
   '5 países novos no mapa',
   NULL,
   'Esses países NÃO EXISTIAM há 30 anos!',
   ARRAY['#curiosidades', '#paises', '#fyp', '#viral'],
   'pt-BR', 2, '{}')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 11. ASSETS
-- =============================================
INSERT INTO pulso_assets.assets (id, tipo, nome, descricao, caminho_storage, provedor, duracao_segundos, largura_px, altura_px, tamanho_bytes, metadata, criado_por)
VALUES
  (v_asset1_audio, 'AUDIO', 'chatgpt5_narracao.mp3', 'Narração do roteiro ChatGPT-5',
   'pulso/canal-001/cont-001/audio/narracao.mp3', 'elevenlabs', 58, NULL, NULL, 1420000,
   '{"voz": "Pedro", "modelo": "eleven_multilingual_v2"}', v_usr1::text),

  (v_asset1_video, 'VIDEO', 'chatgpt5_final.mp4', 'Vídeo final renderizado',
   'pulso/canal-001/cont-001/video/final_1080x1920.mp4', 'local', 60, 1080, 1920, 45000000,
   '{"codec": "h264", "fps": 30}', v_usr1::text),

  (v_asset1_thumb, 'THUMBNAIL', 'chatgpt5_thumb.png', 'Thumbnail do vídeo',
   'pulso/canal-001/cont-001/thumbnails/thumb_1280x720.png', 'canva', NULL, 1280, 720, 350000,
   '{"estilo": "impacto_vermelho"}', v_usr1::text),

  (v_asset2_audio, 'AUDIO', 'visionpro2_narracao.mp3', 'Narração Vision Pro 2',
   'pulso/canal-001/cont-002/audio/narracao.mp3', 'elevenlabs', 55, NULL, NULL, 1300000,
   '{"voz": "Pedro", "modelo": "eleven_multilingual_v2"}', v_usr1::text)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 12. POSTS (Distribuição)
-- =============================================
INSERT INTO pulso_distribution.posts (id, conteudo_variantes_id, canal_plataforma_id, status, titulo_publicado, descricao_publicada, legenda_publicada, url_publicacao, identificador_externo, data_agendada, data_publicacao, metadata, criado_por)
VALUES
  (v_post1a, v_var1a, v_cp1, 'PUBLICADO',
   'ChatGPT-5 MUDOU TUDO',
   'O ChatGPT-5 acabou de sair e nada será como antes!',
   'O ChatGPT-5 acabou de sair e NADA será como antes...',
   'https://youtube.com/shorts/abc123xyz', 'abc123xyz',
   '2026-03-25 10:00:00', '2026-03-25 10:00:00',
   '{"upload_automatico": true}', v_usr1::text),

  (v_post1b, v_var1b, v_cp2, 'PUBLICADO',
   'ChatGPT-5 mudou TUDO', NULL,
   'O ChatGPT-5 acabou de sair e NADA será como antes... Segue pra mais!',
   'https://tiktok.com/@noticiastech/video/789456', '789456',
   '2026-03-25 12:00:00', '2026-03-25 12:00:00',
   '{}', v_usr1::text),

  (v_post1c, v_var1c, v_cp3, 'PUBLICADO',
   NULL, NULL,
   'ChatGPT-5 acabou de sair e TUDO mudou!',
   'https://instagram.com/reel/xyz789', 'xyz789',
   '2026-03-25 14:00:00', '2026-03-25 14:01:00',
   '{}', v_usr1::text),

  (v_post3a, v_var3a, v_cp4, 'AGENDADO',
   '5 PAÍSES que NÃO EXISTIAM há 30 anos!',
   'Você sabia que esses 5 países foram criados recentemente?',
   'Esses 5 países NÃO EXISTIAM há 30 anos...',
   NULL, NULL,
   '2026-04-01 10:00:00', NULL,
   '{"motivo_agendamento": "melhor horario engajamento"}', v_usr2::text),

  (v_post3b, v_var3b, v_cp5, 'AGENDADO',
   '5 países novos no mapa', NULL,
   'Esses países NÃO EXISTIAM há 30 anos!',
   NULL, NULL,
   '2026-04-01 12:00:00', NULL,
   '{}', v_usr2::text)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 13. MÉTRICAS DIÁRIAS
-- =============================================
INSERT INTO pulso_analytics.metricas_diarias (id, post_id, plataforma_id, data_ref, views, likes, deslikes, comentarios, compartilhamentos, cliques_link, inscricoes, watch_time_segundos, metadata)
VALUES
  -- YouTube Shorts - ChatGPT-5 (5 dias)
  ('aa000000-0000-0000-0000-000000000001', v_post1a, v_plat_yt_shorts, '2026-03-25', 45200, 3800, 120, 890, 1200, 340, 280, 2100000, '{}'),
  ('aa000000-0000-0000-0000-000000000002', v_post1a, v_plat_yt_shorts, '2026-03-26', 82000, 6200, 180, 1540, 2100, 580, 420, 3900000, '{}'),
  ('aa000000-0000-0000-0000-000000000003', v_post1a, v_plat_yt_shorts, '2026-03-27', 120000, 9100, 250, 2300, 3400, 890, 650, 5800000, '{}'),
  ('aa000000-0000-0000-0000-000000000004', v_post1a, v_plat_yt_shorts, '2026-03-28', 65000, 4800, 140, 1100, 1800, 420, 310, 3100000, '{}'),
  ('aa000000-0000-0000-0000-000000000005', v_post1a, v_plat_yt_shorts, '2026-03-29', 38000, 2900, 90, 680, 950, 280, 180, 1800000, '{}'),
  -- TikTok - ChatGPT-5 (5 dias)
  ('aa000000-0000-0000-0000-000000000006', v_post1b, v_plat_tiktok, '2026-03-25', 28000, 5200, NULL, 420, 890, NULL, NULL, 1200000, '{}'),
  ('aa000000-0000-0000-0000-000000000007', v_post1b, v_plat_tiktok, '2026-03-26', 95000, 18000, NULL, 1800, 4200, NULL, NULL, 4500000, '{}'),
  ('aa000000-0000-0000-0000-000000000008', v_post1b, v_plat_tiktok, '2026-03-27', 210000, 38000, NULL, 4500, 9800, NULL, NULL, 9200000, '{}'),
  ('aa000000-0000-0000-0000-000000000009', v_post1b, v_plat_tiktok, '2026-03-28', 130000, 22000, NULL, 2800, 5400, NULL, NULL, 5800000, '{}'),
  ('aa000000-0000-0000-0000-000000000010', v_post1b, v_plat_tiktok, '2026-03-29', 75000, 12000, NULL, 1500, 3100, NULL, NULL, 3200000, '{}'),
  -- Instagram Reels - ChatGPT-5 (5 dias)
  ('aa000000-0000-0000-0000-000000000011', v_post1c, v_plat_ig_reels, '2026-03-25', 15000, 2800, NULL, 320, 450, NULL, NULL, 680000, '{}'),
  ('aa000000-0000-0000-0000-000000000012', v_post1c, v_plat_ig_reels, '2026-03-26', 42000, 7800, NULL, 890, 1200, NULL, NULL, 1900000, '{}'),
  ('aa000000-0000-0000-0000-000000000013', v_post1c, v_plat_ig_reels, '2026-03-27', 68000, 12500, NULL, 1400, 2100, NULL, NULL, 3100000, '{}'),
  ('aa000000-0000-0000-0000-000000000014', v_post1c, v_plat_ig_reels, '2026-03-28', 35000, 6200, NULL, 720, 980, NULL, NULL, 1500000, '{}'),
  ('aa000000-0000-0000-0000-000000000015', v_post1c, v_plat_ig_reels, '2026-03-29', 22000, 3900, NULL, 450, 620, NULL, NULL, 950000, '{}')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 14. WORKFLOWS (Automação)
-- =============================================
INSERT INTO pulso_automation.workflows (id, nome, slug, descricao, origem, ativo, configuracao)
VALUES
  (v_wf1, 'Gerar Roteiro com IA', 'gerar-roteiro-ia',
   'Gera automaticamente um roteiro a partir de uma ideia aprovada',
   'SISTEMA', true,
   '{"modelo": "claude-4", "temperatura": 0.7, "max_tokens": 2000, "prompt_template": "roteiro_shorts"}'),

  (v_wf2, 'Gerar Áudio TTS', 'gerar-audio-tts',
   'Gera narração em áudio a partir do roteiro usando ElevenLabs',
   'SISTEMA', true,
   '{"provedor": "elevenlabs", "voz": "Pedro", "modelo": "eleven_multilingual_v2"}'),

  (v_wf3, 'Publicar Multi-Plataforma', 'publicar-multi-plataforma',
   'Publica o conteúdo em todas as plataformas vinculadas ao canal',
   'SISTEMA', true,
   '{"retry_max": 3, "intervalo_entre_plataformas_minutos": 30}'),

  (v_wf4, 'Coletar Métricas', 'coletar-metricas',
   'Coleta métricas de performance das publicações via API',
   'SISTEMA', true,
   '{"frequencia": "diaria", "horario": "06:00"}')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 15. WORKFLOW EXECUÇÕES
-- =============================================
INSERT INTO pulso_automation.workflow_execucoes (id, workflow_id, entidade_tipo, entidade_id, status, mensagem, payload_entrada, payload_saida, inicio_em, fim_em, criado_por)
VALUES
  ('88000000-0000-0000-0000-000000000001', v_wf1, 'ideia', v_ideia1::text, 'SUCESSO',
   'Roteiro gerado com sucesso',
   '{"ideia_id": "ideia-001"}',
   '{"roteiro_id": "rot-001", "tokens_usados": 1847}',
   '2026-03-24 08:00:00', '2026-03-24 08:00:45', v_usr1::text),

  ('88000000-0000-0000-0000-000000000002', v_wf2, 'roteiro', v_rot1::text, 'SUCESSO',
   'Áudio gerado: 58s de duração',
   '{"roteiro_id": "rot-001"}',
   '{"asset_id": "asset-001-audio", "duracao": 58}',
   '2026-03-24 09:00:00', '2026-03-24 09:01:30', v_usr1::text),

  ('88000000-0000-0000-0000-000000000003', v_wf3, 'conteudo', v_cont1::text, 'SUCESSO',
   'Publicado em 3 plataformas',
   '{"conteudo_id": "cont-001"}',
   '{"posts_criados": ["post-001a", "post-001b", "post-001c"]}',
   '2026-03-25 09:55:00', '2026-03-25 10:02:00', v_usr1::text),

  ('88000000-0000-0000-0000-000000000004', v_wf4, 'post', v_post1a::text, 'SUCESSO',
   'Métricas coletadas para 3 posts',
   '{}',
   '{"posts_atualizados": 3}',
   '2026-03-29 06:00:00', '2026-03-29 06:02:00', NULL),

  ('88000000-0000-0000-0000-000000000005', v_wf1, 'ideia', v_ideia3::text, 'FALHOU',
   'Erro: Rate limit exceeded na API',
   '{"ideia_id": "ideia-003"}',
   '{"erro": "rate_limit", "retry_em": "2026-03-30T08:00:00"}',
   '2026-03-29 14:00:00', '2026-03-29 14:00:05', v_usr2::text)
ON CONFLICT (id) DO NOTHING;

RAISE NOTICE 'Seed completo! Dados inseridos com sucesso.';
END $$;

-- =============================================
-- RESUMO DO QUE FOI CRIADO:
-- =============================================
--
-- TOTAIS:
--   2 usuários internos
--   3 canais (Tech, Curiosidades, Finanças)
--   6 plataformas (YT Shorts, YT Longo, TikTok, IG Reels, FB Reels, Kwai)
--   6 vínculos canal-plataforma
--   4 séries
--   6 tags
--   6 ideias (2 rascunho, 1 aprovada, 1 em produção, 1 concluída, 1 arquivada)
--   3 roteiros (1 concluído, 1 aprovado, 1 rascunho)
--   4 conteúdos (1 publicado, 1 em produção, 1 pronto, 1 rascunho)
--   7 variantes de plataforma
--   4 assets (áudio, vídeo, thumbnail)
--   5 posts (3 publicados, 2 agendados)
--   15 registros de métricas (5 dias x 3 plataformas)
--   4 workflows
--   5 execuções de workflow
