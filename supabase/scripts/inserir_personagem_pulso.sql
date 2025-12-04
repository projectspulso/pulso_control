-- =========================================================================
-- INSERIR PERSONAGEM ÚNICO: PULSO
-- =========================================================================
-- Data: 04/12/2025
-- Descrição: Insere o personagem "Pulso" com variações por canal
-- 
-- CONCEITO:
-- - 1 personagem único que se adapta ao contexto
-- - Mesma voz base, mas com entonações diferentes
-- - Visual muda conforme o canal
-- =========================================================================

BEGIN;

-- Deletar se já existir (para re-executar o script)
DELETE FROM pulso_content.personagens WHERE nome = 'Pulso';

-- Inserir o Pulso com todas as variações
INSERT INTO pulso_content.personagens (
  nome,
  tipo,
  genero,
  idioma,
  tom,
  metadata,
  ativo
) VALUES (
  'Pulso',
  'AVATAR_ADAPTATIVO',
  'NEUTRO',
  'pt-BR',
  'ADAPTATIVO',
  jsonb_build_object(
    'conceito', 'Personagem metamórfico que se adapta ao canal',
    
    -- Configuração de voz (quando tiver API de voz)
    'voz', jsonb_build_object(
      'provedor', 'openai',  -- ou 'elevenlabs' quando tiver
      'voz_base_id', 'alloy', -- ID da voz no provedor
      'modelo', 'tts-1-hd'
    ),
    
    -- Variações por canal
    'variacoes', jsonb_build_object(
      
      -- PSICOLOGIA: Tom reflexivo, calmo, acolhedor
      'psicologia', jsonb_build_object(
        'visual', 'pulso_psicologia.png',
        'cores', ARRAY['#8B7355', '#D4A574', '#F5E6D3'], -- Terra, acolhedor
        'expressao', 'calmo, sábio, acolhedor',
        'voz', jsonb_build_object(
          'speed', 0.9,        -- 10% mais devagar (OpenAI)
          'pitch', -0.1,       -- Tom mais grave (ElevenLabs/Google)
          'stability', 0.8,    -- Mais estável (ElevenLabs)
          'estilo', 'reflexivo'
        ),
        'descricao', 'Pulso assume uma forma calma e acolhedora, com cores terrosas. Voz pausada e reflexiva para conteúdos de psicologia.'
      ),
      
      -- FATOS INUSITADOS: Tom animado, rápido, curioso
      'fatos_inusitados', jsonb_build_object(
        'visual', 'pulso_fatos_inusitados.png',
        'cores', ARRAY['#FF6B35', '#F7931E', '#FDC830'], -- Vibrante, energia
        'expressao', 'curioso, empolgado, surpreso',
        'voz', jsonb_build_object(
          'speed', 1.1,        -- 10% mais rápido
          'pitch', 0.1,        -- Tom mais agudo
          'stability', 0.5,    -- Mais variado/animado
          'estilo', 'empolgado'
        ),
        'descricao', 'Pulso fica empolgado e curioso, com cores vibrantes. Voz rápida e animada para surpreender com fatos inusitados.'
      ),
      
      -- TECNOLOGIA: Tom moderno, profissional, preciso
      'tecnologia', jsonb_build_object(
        'visual', 'pulso_tecnologia.png',
        'cores', ARRAY['#667EEA', '#764BA2', '#00D4FF'], -- Futurista, tech
        'expressao', 'confiante, moderno, inovador',
        'voz', jsonb_build_object(
          'speed', 1.0,        -- Velocidade padrão
          'pitch', 0.0,        -- Tom neutro
          'stability', 0.7,    -- Moderado
          'estilo', 'profissional'
        ),
        'descricao', 'Pulso assume forma futurista com cores tech (azul/roxo). Voz moderna e precisa para conteúdos de tecnologia.'
      ),
      
      -- DEFAULT: Quando não houver variação específica
      'default', jsonb_build_object(
        'visual', 'pulso_default.png',
        'cores', ARRAY['#6366F1', '#8B5CF6', '#EC4899'], -- Gradiente padrão
        'expressao', 'neutro, versátil',
        'voz', jsonb_build_object(
          'speed', 1.0,
          'pitch', 0.0,
          'stability', 0.7,
          'estilo', 'equilibrado'
        ),
        'descricao', 'Forma padrão do Pulso para canais sem variação específica.'
      )
    ),
    
    -- Informações adicionais
    'branding', jsonb_build_object(
      'tagline', 'Seu guia adaptável pelo conhecimento',
      'filosofia', 'Um personagem, infinitas formas. O Pulso se transforma para se conectar melhor com cada tema.',
      'identidade', 'Mantém a essência mas adapta forma e tom ao contexto'
    )
  ),
  true  -- ativo
);

-- Verificar inserção
SELECT 
  id,
  nome,
  tipo,
  genero,
  idioma,
  tom,
  ativo,
  metadata->'voz'->>'provedor' as provedor_voz,
  metadata->'voz'->>'voz_base_id' as voz_id,
  jsonb_object_keys(metadata->'variacoes') as canais_com_variacoes
FROM pulso_content.personagens 
WHERE nome = 'Pulso';

-- Mostrar detalhes de cada variação
SELECT 
  nome,
  variacao.key as canal,
  variacao.value->>'expressao' as expressao,
  variacao.value->>'visual' as arquivo_visual,
  variacao.value->'voz'->>'speed' as speed,
  variacao.value->'voz'->>'estilo' as estilo,
  variacao.value->>'descricao' as descricao
FROM pulso_content.personagens,
LATERAL jsonb_each(metadata->'variacoes') as variacao
WHERE nome = 'Pulso'
ORDER BY canal;

COMMIT;

-- =========================================================================
-- PRÓXIMOS PASSOS:
-- =========================================================================
-- 1. Executar este script no Supabase SQL Editor
-- 2. Criar assets visuais (pulso_psicologia.png, pulso_fatos_inusitados.png, etc)
-- 3. Atualizar WF02 para buscar variação baseada no canal
-- 4. Testar geração de áudio com diferentes speeds
-- 5. (Futuro) Migrar para ElevenLabs para ter pitch/stability
-- =========================================================================
