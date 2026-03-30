-- =============================================
-- PULSO - Seed de Exemplo Completo
-- Pipeline: Ideia → Roteiro → Conteúdo → Variantes → Post → Métricas
-- Execute no SQL Editor do Supabase
-- =============================================

-- 1. USUARIO INTERNO (criador do conteúdo)
INSERT INTO pulso_core.usuarios_internos (id, nome, email, papel, ativo)
VALUES
  ('usr-001', 'Junior Silva', 'junior@pulso.ai', 'ADMIN', true),
  ('usr-002', 'Ana Costa', 'ana@pulso.ai', 'EDITOR', true)
ON CONFLICT (id) DO NOTHING;

-- 2. CANAL
INSERT INTO pulso_core.canais (id, nome, slug, descricao, idioma, status, metadata)
VALUES
  ('canal-001', 'Notícias Tech', 'noticias-tech', 'Canal de notícias sobre tecnologia e inovação', 'pt-BR', 'ATIVO', '{"cor": "#3B82F6", "icone": "monitor"}'),
  ('canal-002', 'Curiosidades Mundo', 'curiosidades-mundo', 'Fatos curiosos e interessantes do mundo', 'pt-BR', 'ATIVO', '{"cor": "#10B981", "icone": "globe"}'),
  ('canal-003', 'Finanças Simplificadas', 'financas-simplificadas', 'Educação financeira de forma simples', 'pt-BR', 'ATIVO', '{"cor": "#F59E0B", "icone": "dollar-sign"}')
ON CONFLICT (id) DO NOTHING;

-- 3. PLATAFORMAS
INSERT INTO pulso_core.plataformas (id, tipo, nome_exibicao, descricao, ativo)
VALUES
  ('plat-yt-shorts', 'YOUTUBE_SHORTS', 'YouTube Shorts', 'Vídeos curtos no YouTube', true),
  ('plat-yt-longo', 'YOUTUBE_LONGO', 'YouTube', 'Vídeos longos no YouTube', true),
  ('plat-tiktok', 'TIKTOK', 'TikTok', 'Vídeos no TikTok', true),
  ('plat-ig-reels', 'INSTAGRAM_REELS', 'Instagram Reels', 'Reels no Instagram', true),
  ('plat-fb-reels', 'FACEBOOK_REELS', 'Facebook Reels', 'Reels no Facebook', true),
  ('plat-kwai', 'KWAI', 'Kwai', 'Vídeos no Kwai', true)
ON CONFLICT (id) DO NOTHING;

-- 4. CANAIS_PLATAFORMAS (vincula canais às plataformas)
INSERT INTO pulso_core.canais_plataformas (id, canal_id, plataforma_id, identificador_externo, nome_exibicao, url_canal, ativo, configuracoes)
VALUES
  ('cp-001', 'canal-001', 'plat-yt-shorts', '@NoticiasTechBR', 'Notícias Tech Shorts', 'https://youtube.com/@NoticiasTechBR', true, '{}'),
  ('cp-002', 'canal-001', 'plat-tiktok', '@noticiastech', 'Notícias Tech TikTok', 'https://tiktok.com/@noticiastech', true, '{}'),
  ('cp-003', 'canal-001', 'plat-ig-reels', '@noticiastech.br', 'Notícias Tech IG', 'https://instagram.com/noticiastech.br', true, '{}'),
  ('cp-004', 'canal-002', 'plat-yt-shorts', '@CuriosidadesMundo', 'Curiosidades Shorts', 'https://youtube.com/@CuriosidadesMundo', true, '{}'),
  ('cp-005', 'canal-002', 'plat-tiktok', '@curiosidades.mundo', 'Curiosidades TikTok', 'https://tiktok.com/@curiosidades.mundo', true, '{}'),
  ('cp-006', 'canal-003', 'plat-yt-longo', '@FinancasSimples', 'Finanças YT', 'https://youtube.com/@FinancasSimples', true, '{}')
ON CONFLICT (id) DO NOTHING;

-- 5. SÉRIES
INSERT INTO pulso_core.series (id, canal_id, nome, slug, descricao, status, ordem_padrao, metadata)
VALUES
  ('serie-001', 'canal-001', 'IA no Dia a Dia', 'ia-no-dia-a-dia', 'Como a inteligência artificial está mudando o cotidiano', 'ATIVO', 1, '{}'),
  ('serie-002', 'canal-001', 'Tech em 60s', 'tech-em-60s', 'Notícias de tecnologia em 60 segundos', 'ATIVO', 2, '{}'),
  ('serie-003', 'canal-002', 'Você Sabia?', 'voce-sabia', 'Fatos surpreendentes sobre o mundo', 'ATIVO', 1, '{}'),
  ('serie-004', 'canal-003', 'Investimento Fácil', 'investimento-facil', 'Guia básico de investimentos', 'ATIVO', 1, '{}')
ON CONFLICT (id) DO NOTHING;

-- 6. TAGS
INSERT INTO pulso_core.tags (id, nome, slug, descricao)
VALUES
  ('tag-ia', 'Inteligência Artificial', 'inteligencia-artificial', 'Conteúdos sobre IA'),
  ('tag-tech', 'Tecnologia', 'tecnologia', 'Tecnologia em geral'),
  ('tag-viral', 'Viral', 'viral', 'Conteúdo com potencial viral'),
  ('tag-educativo', 'Educativo', 'educativo', 'Conteúdo educacional'),
  ('tag-financas', 'Finanças', 'financas', 'Conteúdo financeiro'),
  ('tag-trending', 'Trending', 'trending', 'Temas em alta')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- CONTEÚDO: Pipeline completo
-- =============================================

-- 7. IDEIAS (diferentes status para mostrar o pipeline)
INSERT INTO pulso_content.ideias (id, canal_id, serie_id, titulo, descricao, origem, prioridade, status, tags, linguagem, criado_por, metadata)
VALUES
  -- Ideia 1: Pipeline COMPLETO (até publicada)
  ('ideia-001', 'canal-001', 'serie-001',
   'ChatGPT-5 muda tudo: o que esperar',
   'Análise das novidades do ChatGPT-5 e como isso impacta o mercado de trabalho e o dia a dia',
   'MANUAL', 5, 'CONCLUIDA',
   ARRAY['inteligencia-artificial', 'trending'], 'pt-BR', 'usr-001',
   '{"fonte": "OpenAI Blog", "urgencia": "alta"}'),

  -- Ideia 2: Em produção (roteiro aprovado, gravando)
  ('ideia-002', 'canal-001', 'serie-002',
   'Apple Vision Pro 2 - vale a pena?',
   'Review rápido do novo Apple Vision Pro 2 em formato shorts',
   'MANUAL', 4, 'EM_PRODUCAO',
   ARRAY['tecnologia'], 'pt-BR', 'usr-001',
   '{"fonte": "Apple Event"}'),

  -- Ideia 3: Aprovada (pronta pra virar roteiro)
  ('ideia-003', 'canal-002', 'serie-003',
   '5 países que não existiam há 30 anos',
   'Fatos curiosos sobre países que surgiram recentemente no mapa',
   'AI_SUGESTAO', 3, 'APROVADA',
   ARRAY['viral', 'educativo'], 'pt-BR', 'usr-002',
   '{"ai_score": 8.5}'),

  -- Ideia 4: Rascunho
  ('ideia-004', 'canal-003', 'serie-004',
   'Tesouro Direto para iniciantes em 2026',
   'Guia completo de como começar a investir no Tesouro Direto',
   'MANUAL', 3, 'RASCUNHO',
   ARRAY['financas', 'educativo'], 'pt-BR', 'usr-002',
   '{}'),

  -- Ideia 5: Rascunho
  ('ideia-005', 'canal-001', 'serie-001',
   'Gemini 3.0 vs Claude 4 - qual é melhor?',
   'Comparativo entre os dois maiores modelos de IA de 2026',
   'AI_SUGESTAO', 4, 'RASCUNHO',
   ARRAY['inteligencia-artificial', 'trending'], 'pt-BR', 'usr-001',
   '{"ai_score": 9.2}'),

  -- Ideia 6: Arquivada
  ('ideia-006', 'canal-001', NULL,
   'Review do iPhone 16 (ultrapassado)',
   'Review que ficou desatualizado',
   'MANUAL', 1, 'ARQUIVADA',
   ARRAY['tecnologia'], 'pt-BR', 'usr-001',
   '{"motivo_arquivo": "conteudo desatualizado"}')
ON CONFLICT (id) DO NOTHING;

-- 8. ROTEIROS
INSERT INTO pulso_content.roteiros (id, ideia_id, titulo, versao, conteudo_md, duracao_estimado_segundos, status, linguagem, criado_por, revisado_por, metadata)
VALUES
  -- Roteiro da Ideia 1 (concluído)
  ('rot-001', 'ideia-001', 'ChatGPT-5: Tudo que mudou', 1,
   E'# ChatGPT-5: Tudo que mudou\n\n## HOOK (0-3s)\n🎯 "O ChatGPT-5 acabou de sair e NADA será como antes..."\n\n## DESENVOLVIMENTO (3-45s)\n- Raciocínio em tempo real\n- Agentes autônomos que executam tarefas\n- Integração nativa com apps do celular\n- Memória persistente entre conversas\n\n## CTA (45-60s)\n"Segue pra mais novidades de IA todo dia!"',
   60, 'CONCLUIDO', 'pt-BR', 'usr-001', 'usr-002',
   '{"tom": "empolgado", "referencias": ["openai.com/blog"]}'),

  -- Roteiro da Ideia 2 (em produção)
  ('rot-002', 'ideia-002', 'Apple Vision Pro 2 em 60s', 1,
   E'# Apple Vision Pro 2 em 60s\n\n## HOOK (0-3s)\n"A Apple acabou de lançar o Vision Pro 2 e o preço vai te CHOCAR"\n\n## DESENVOLVIMENTO (3-50s)\n- Preço reduzido pela metade\n- Tela 8K por olho\n- Bateria de 4 horas\n- Mais leve que óculos normais\n\n## CTA (50-60s)\n"Comenta se vale a pena!"',
   60, 'APROVADO', 'pt-BR', 'usr-001', 'usr-002',
   '{"tom": "informativo"}'),

  -- Roteiro da Ideia 3 (rascunho)
  ('rot-003', 'ideia-003', '5 Países Novos no Mapa', 1,
   E'# 5 Países que não existiam há 30 anos\n\n## HOOK (0-3s)\n"Esses 5 países NÃO EXISTIAM há 30 anos..."\n\n## PAÍSES\n1. 🇸🇸 Sudão do Sul (2011)\n2. 🇽🇰 Kosovo (2008)\n3. 🇲🇪 Montenegro (2006)\n4. 🇹🇱 Timor-Leste (2002)\n5. 🇪🇷 Eritreia (1993)\n\n## CTA\n"Qual desses te surpreendeu mais? Comenta!"',
   55, 'RASCUNHO', 'pt-BR', 'usr-002', NULL,
   '{}')
ON CONFLICT (id) DO NOTHING;

-- 9. CONTEÚDOS (peça principal que agrupa tudo)
INSERT INTO pulso_content.conteudos (id, canal_id, serie_id, roteiro_id, titulo_interno, sinopse, status, linguagem, ordem_na_serie, tags, metadata, criado_por)
VALUES
  -- Conteúdo 1: PUBLICADO (pipeline completo)
  ('cont-001', 'canal-001', 'serie-001', 'rot-001',
   'ChatGPT-5 - Tudo que mudou',
   'Análise completa do ChatGPT-5 em formato shorts',
   'PUBLICADO', 'pt-BR', 1,
   ARRAY['inteligencia-artificial', 'trending'],
   '{"performance_target": "100k views"}',
   'usr-001'),

  -- Conteúdo 2: EM PRODUÇÃO
  ('cont-002', 'canal-001', 'serie-002', 'rot-002',
   'Apple Vision Pro 2 - 60 segundos',
   'Review rápido do Vision Pro 2',
   'EM_PRODUCAO', 'pt-BR', 5,
   ARRAY['tecnologia'],
   '{}',
   'usr-001'),

  -- Conteúdo 3: PRONTO (aguardando publicação)
  ('cont-003', 'canal-002', 'serie-003', NULL,
   '5 Países Novos no Mapa',
   'Fatos curiosos sobre países recentes',
   'PRONTO', 'pt-BR', 3,
   ARRAY['viral', 'educativo'],
   '{}',
   'usr-002'),

  -- Conteúdo 4: RASCUNHO
  ('cont-004', 'canal-003', 'serie-004', NULL,
   'Tesouro Direto 2026',
   'Guia de investimento no Tesouro',
   'RASCUNHO', 'pt-BR', 1,
   ARRAY['financas', 'educativo'],
   '{}',
   'usr-002')
ON CONFLICT (id) DO NOTHING;

-- 10. CONTEUDO VARIANTES (adaptações por plataforma)
INSERT INTO pulso_content.conteudo_variantes (id, conteudo_id, nome_variacao, plataforma_tipo, status, titulo_publico, descricao_publica, legenda, hashtags, linguagem, ordem_exibicao, metadata)
VALUES
  -- Variantes do Conteúdo 1 (ChatGPT-5) - PUBLICADO em 3 plataformas
  ('var-001a', 'cont-001', 'YouTube Shorts', 'YOUTUBE_SHORTS', 'PUBLICADO',
   'ChatGPT-5 MUDOU TUDO 🤯',
   'O ChatGPT-5 acabou de sair e nada será como antes! Veja as 4 mudanças mais insanas. #ia #chatgpt5 #tecnologia',
   'O ChatGPT-5 acabou de sair e NADA será como antes... 🤯🔥',
   ARRAY['#ia', '#chatgpt5', '#tecnologia', '#inteligenciaartificial', '#tech'],
   'pt-BR', 1, '{"thumbnail_style": "impacto"}'),

  ('var-001b', 'cont-001', 'TikTok', 'TIKTOK', 'PUBLICADO',
   'ChatGPT-5 mudou TUDO 🤯',
   NULL,
   'O ChatGPT-5 acabou de sair e NADA será como antes... Segue pra mais! 🤯',
   ARRAY['#ia', '#chatgpt5', '#tech', '#fyp', '#viral'],
   'pt-BR', 2, '{}'),

  ('var-001c', 'cont-001', 'Instagram Reels', 'INSTAGRAM_REELS', 'PUBLICADO',
   NULL, NULL,
   '🤯 ChatGPT-5 acabou de sair e TUDO mudou!\n\n4 novidades insanas:\n✅ Raciocínio em tempo real\n✅ Agentes autônomos\n✅ Integração com apps\n✅ Memória persistente\n\nSalva pra não esquecer! 💾',
   ARRAY['#ia', '#chatgpt', '#tecnologia', '#inovacao'],
   'pt-BR', 3, '{}'),

  -- Variantes do Conteúdo 2 (Vision Pro) - EM PRODUÇÃO
  ('var-002a', 'cont-002', 'YouTube Shorts', 'YOUTUBE_SHORTS', 'EM_PRODUCAO',
   'Apple Vision Pro 2 - PREÇO CHOCANTE 😱',
   'O novo Vision Pro 2 da Apple surpreende no preço e nas specs!',
   'A Apple acabou de lançar o Vision Pro 2 e o preço vai te CHOCAR 😱',
   ARRAY['#apple', '#visionpro', '#tech', '#vr'],
   'pt-BR', 1, '{}'),

  ('var-002b', 'cont-002', 'TikTok', 'TIKTOK', 'RASCUNHO',
   'Vision Pro 2 vale a pena? 🍎',
   NULL,
   'Apple Vision Pro 2 - vale o preço? 🤔',
   ARRAY['#apple', '#visionpro', '#tech', '#fyp'],
   'pt-BR', 2, '{}'),

  -- Variantes do Conteúdo 3 (Países) - PRONTO para publicar
  ('var-003a', 'cont-003', 'YouTube Shorts', 'YOUTUBE_SHORTS', 'PRONTO',
   '5 PAÍSES que NÃO EXISTIAM há 30 anos! 🌍',
   'Você sabia que esses 5 países foram criados recentemente?',
   'Esses 5 países NÃO EXISTIAM há 30 anos... O último vai te surpreender! 🌍',
   ARRAY['#curiosidades', '#paises', '#geografia', '#vocesabia'],
   'pt-BR', 1, '{}'),

  ('var-003b', 'cont-003', 'TikTok', 'TIKTOK', 'PRONTO',
   '5 países novos no mapa 🗺️',
   NULL,
   'Esses países NÃO EXISTIAM há 30 anos! 🌍 #curiosidades #fyp',
   ARRAY['#curiosidades', '#paises', '#fyp', '#viral'],
   'pt-BR', 2, '{}')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- ASSETS (mídias associadas)
-- =============================================

-- 11. ASSETS
INSERT INTO pulso_assets.assets (id, tipo, nome, descricao, caminho_storage, provedor, duracao_segundos, largura_px, altura_px, tamanho_bytes, metadata, criado_por)
VALUES
  -- Assets do Conteúdo 1 (ChatGPT-5)
  ('asset-001-audio', 'AUDIO', 'chatgpt5_narração.mp3', 'Narração do roteiro ChatGPT-5',
   'pulso/canal-001/cont-001/audio/narracao.mp3', 'elevenlabs', 58, NULL, NULL, 1420000,
   '{"voz": "Pedro", "modelo": "eleven_multilingual_v2"}', 'usr-001'),

  ('asset-001-video', 'VIDEO', 'chatgpt5_final.mp4', 'Vídeo final renderizado',
   'pulso/canal-001/cont-001/video/final_1080x1920.mp4', 'local', 60, 1080, 1920, 45000000,
   '{"codec": "h264", "fps": 30}', 'usr-001'),

  ('asset-001-thumb', 'THUMBNAIL', 'chatgpt5_thumb.png', 'Thumbnail do vídeo',
   'pulso/canal-001/cont-001/thumbnails/thumb_1280x720.png', 'canva', NULL, 1280, 720, 350000,
   '{"estilo": "impacto_vermelho"}', 'usr-001'),

  -- Assets do Conteúdo 2 (Vision Pro) - parciais
  ('asset-002-audio', 'AUDIO', 'visionpro2_narração.mp3', 'Narração Vision Pro 2',
   'pulso/canal-001/cont-002/audio/narracao.mp3', 'elevenlabs', 55, NULL, NULL, 1300000,
   '{"voz": "Pedro", "modelo": "eleven_multilingual_v2"}', 'usr-001')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- DISTRIBUIÇÃO: Posts publicados e agendados
-- =============================================

-- 12. POSTS
INSERT INTO pulso_distribution.posts (id, conteudo_variantes_id, canal_plataforma_id, status, titulo_publicado, descricao_publicada, legenda_publicada, url_publicacao, identificador_externo, data_agendada, data_publicacao, metadata, criado_por)
VALUES
  -- Posts PUBLICADOS (Conteúdo 1 - ChatGPT-5)
  ('post-001a', 'var-001a', 'cp-001', 'PUBLICADO',
   'ChatGPT-5 MUDOU TUDO 🤯',
   'O ChatGPT-5 acabou de sair e nada será como antes!',
   'O ChatGPT-5 acabou de sair e NADA será como antes... 🤯🔥',
   'https://youtube.com/shorts/abc123xyz', 'abc123xyz',
   '2026-03-25 10:00:00', '2026-03-25 10:00:00',
   '{"upload_automatico": true}', 'usr-001'),

  ('post-001b', 'var-001b', 'cp-002', 'PUBLICADO',
   'ChatGPT-5 mudou TUDO 🤯', NULL,
   'O ChatGPT-5 acabou de sair e NADA será como antes... Segue pra mais! 🤯',
   'https://tiktok.com/@noticiastech/video/789456', '789456',
   '2026-03-25 12:00:00', '2026-03-25 12:00:00',
   '{}', 'usr-001'),

  ('post-001c', 'var-001c', 'cp-003', 'PUBLICADO',
   NULL, NULL,
   '🤯 ChatGPT-5 acabou de sair e TUDO mudou!',
   'https://instagram.com/reel/xyz789', 'xyz789',
   '2026-03-25 14:00:00', '2026-03-25 14:01:00',
   '{}', 'usr-001'),

  -- Posts AGENDADOS (Conteúdo 3 - Países)
  ('post-003a', 'var-003a', 'cp-004', 'AGENDADO',
   '5 PAÍSES que NÃO EXISTIAM há 30 anos! 🌍',
   'Você sabia que esses 5 países foram criados recentemente?',
   'Esses 5 países NÃO EXISTIAM há 30 anos... O último vai te surpreender! 🌍',
   NULL, NULL,
   '2026-04-01 10:00:00', NULL,
   '{"motivo_agendamento": "melhor horario engajamento"}', 'usr-002'),

  ('post-003b', 'var-003b', 'cp-005', 'AGENDADO',
   '5 países novos no mapa 🗺️', NULL,
   'Esses países NÃO EXISTIAM há 30 anos! 🌍',
   NULL, NULL,
   '2026-04-01 12:00:00', NULL,
   '{}', 'usr-002')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- ANALYTICS: Métricas dos posts publicados
-- =============================================

-- 13. METRICAS DIARIAS (5 dias de dados para o post do YouTube)
INSERT INTO pulso_analytics.metricas_diarias (id, post_id, plataforma_id, data_ref, views, likes, deslikes, comentarios, compartilhamentos, cliques_link, inscricoes, watch_time_segundos, metadata)
VALUES
  -- Post YouTube Shorts - ChatGPT-5 (viral!)
  ('met-001-d1', 'post-001a', 'plat-yt-shorts', '2026-03-25', 45200, 3800, 120, 890, 1200, 340, 280, 2100000, '{}'),
  ('met-001-d2', 'post-001a', 'plat-yt-shorts', '2026-03-26', 82000, 6200, 180, 1540, 2100, 580, 420, 3900000, '{}'),
  ('met-001-d3', 'post-001a', 'plat-yt-shorts', '2026-03-27', 120000, 9100, 250, 2300, 3400, 890, 650, 5800000, '{}'),
  ('met-001-d4', 'post-001a', 'plat-yt-shorts', '2026-03-28', 65000, 4800, 140, 1100, 1800, 420, 310, 3100000, '{}'),
  ('met-001-d5', 'post-001a', 'plat-yt-shorts', '2026-03-29', 38000, 2900, 90, 680, 950, 280, 180, 1800000, '{}'),

  -- Post TikTok - ChatGPT-5
  ('met-002-d1', 'post-001b', 'plat-tiktok', '2026-03-25', 28000, 5200, NULL, 420, 890, NULL, NULL, 1200000, '{}'),
  ('met-002-d2', 'post-001b', 'plat-tiktok', '2026-03-26', 95000, 18000, NULL, 1800, 4200, NULL, NULL, 4500000, '{}'),
  ('met-002-d3', 'post-001b', 'plat-tiktok', '2026-03-27', 210000, 38000, NULL, 4500, 9800, NULL, NULL, 9200000, '{}'),
  ('met-002-d4', 'post-001b', 'plat-tiktok', '2026-03-28', 130000, 22000, NULL, 2800, 5400, NULL, NULL, 5800000, '{}'),
  ('met-002-d5', 'post-001b', 'plat-tiktok', '2026-03-29', 75000, 12000, NULL, 1500, 3100, NULL, NULL, 3200000, '{}'),

  -- Post Instagram - ChatGPT-5
  ('met-003-d1', 'post-001c', 'plat-ig-reels', '2026-03-25', 15000, 2800, NULL, 320, 450, NULL, NULL, 680000, '{}'),
  ('met-003-d2', 'post-001c', 'plat-ig-reels', '2026-03-26', 42000, 7800, NULL, 890, 1200, NULL, NULL, 1900000, '{}'),
  ('met-003-d3', 'post-001c', 'plat-ig-reels', '2026-03-27', 68000, 12500, NULL, 1400, 2100, NULL, NULL, 3100000, '{}'),
  ('met-003-d4', 'post-001c', 'plat-ig-reels', '2026-03-28', 35000, 6200, NULL, 720, 980, NULL, NULL, 1500000, '{}'),
  ('met-003-d5', 'post-001c', 'plat-ig-reels', '2026-03-29', 22000, 3900, NULL, 450, 620, NULL, NULL, 950000, '{}')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- AUTOMATION: Workflows configurados
-- =============================================

-- 14. WORKFLOWS
INSERT INTO pulso_automation.workflows (id, nome, slug, descricao, origem, ativo, configuracao)
VALUES
  ('wf-001', 'Gerar Roteiro com IA', 'gerar-roteiro-ia',
   'Gera automaticamente um roteiro a partir de uma ideia aprovada',
   'SISTEMA', true,
   '{"modelo": "claude-4", "temperatura": 0.7, "max_tokens": 2000, "prompt_template": "roteiro_shorts"}'),

  ('wf-002', 'Gerar Áudio TTS', 'gerar-audio-tts',
   'Gera narração em áudio a partir do roteiro usando ElevenLabs',
   'SISTEMA', true,
   '{"provedor": "elevenlabs", "voz": "Pedro", "modelo": "eleven_multilingual_v2"}'),

  ('wf-003', 'Publicar Multi-Plataforma', 'publicar-multi-plataforma',
   'Publica o conteúdo em todas as plataformas vinculadas ao canal',
   'SISTEMA', true,
   '{"retry_max": 3, "intervalo_entre_plataformas_minutos": 30}'),

  ('wf-004', 'Coletar Métricas', 'coletar-metricas',
   'Coleta métricas de performance das publicações via API',
   'SISTEMA', true,
   '{"frequencia": "diaria", "horario": "06:00"}')
ON CONFLICT (id) DO NOTHING;

-- 15. WORKFLOW EXECUÇÕES (histórico)
INSERT INTO pulso_automation.workflow_execucoes (id, workflow_id, entidade_tipo, entidade_id, status, mensagem, payload_entrada, payload_saida, inicio_em, fim_em, criado_por)
VALUES
  ('exec-001', 'wf-001', 'ideia', 'ideia-001', 'SUCESSO',
   'Roteiro gerado com sucesso',
   '{"ideia_id": "ideia-001"}',
   '{"roteiro_id": "rot-001", "tokens_usados": 1847}',
   '2026-03-24 08:00:00', '2026-03-24 08:00:45', 'usr-001'),

  ('exec-002', 'wf-002', 'roteiro', 'rot-001', 'SUCESSO',
   'Áudio gerado: 58s de duração',
   '{"roteiro_id": "rot-001"}',
   '{"asset_id": "asset-001-audio", "duracao": 58}',
   '2026-03-24 09:00:00', '2026-03-24 09:01:30', 'usr-001'),

  ('exec-003', 'wf-003', 'conteudo', 'cont-001', 'SUCESSO',
   'Publicado em 3 plataformas',
   '{"conteudo_id": "cont-001"}',
   '{"posts_criados": ["post-001a", "post-001b", "post-001c"]}',
   '2026-03-25 09:55:00', '2026-03-25 10:02:00', 'usr-001'),

  ('exec-004', 'wf-004', 'post', 'post-001a', 'SUCESSO',
   'Métricas coletadas para 3 posts',
   '{}',
   '{"posts_atualizados": 3}',
   '2026-03-29 06:00:00', '2026-03-29 06:02:00', NULL),

  ('exec-005', 'wf-001', 'ideia', 'ideia-003', 'FALHOU',
   'Erro: Rate limit exceeded na API',
   '{"ideia_id": "ideia-003"}',
   '{"erro": "rate_limit", "retry_em": "2026-03-30T08:00:00"}',
   '2026-03-29 14:00:00', '2026-03-29 14:00:05', 'usr-002')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- RESUMO DO QUE FOI CRIADO:
-- =============================================
--
-- 📊 TOTAIS:
--   • 2 usuários internos
--   • 3 canais (Tech, Curiosidades, Finanças)
--   • 6 plataformas (YT Shorts, YT Longo, TikTok, IG Reels, FB Reels, Kwai)
--   • 6 vínculos canal↔plataforma
--   • 4 séries
--   • 6 tags
--   • 6 ideias (2 rascunho, 1 aprovada, 1 em produção, 1 concluída, 1 arquivada)
--   • 3 roteiros (1 concluído, 1 aprovado, 1 rascunho)
--   • 4 conteúdos (1 publicado, 1 em produção, 1 pronto, 1 rascunho)
--   • 7 variantes de plataforma
--   • 4 assets (áudio, vídeo, thumbnail)
--   • 5 posts (3 publicados, 2 agendados)
--   • 15 registros de métricas (5 dias × 3 plataformas)
--   • 4 workflows
--   • 5 execuções de workflow
--
-- 🔄 PIPELINE COMPLETO (Conteúdo "ChatGPT-5"):
--   Ideia → Roteiro → Conteúdo → 3 Variantes → 3 Posts Publicados → Métricas
--
-- ⏳ EM ANDAMENTO (Conteúdo "Vision Pro 2"):
--   Ideia → Roteiro → Conteúdo → 2 Variantes (em produção)
--
-- 📅 AGENDADO (Conteúdo "5 Países"):
--   Conteúdo Pronto → 2 Variantes → 2 Posts Agendados (01/04/2026)
--
