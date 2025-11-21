-- =========================================================
-- 1) Canais PULSO - Hub + Canais Temáticos (PT-BR)
-- =========================================================
INSERT INTO pulso_core.canais (nome, slug, descricao, idioma, status, metadata)
SELECT
v.nome,
v.slug,
v.descricao,
'pt-BR'::varchar AS idioma,
'ATIVO'::pulso_status_geral AS status,
v.metadata
FROM (
VALUES
-- HUB / Geral
('Pulso Dark PT',
'pulso-dark-pt',
'Canal hub de testes, compilações e crossovers de todos os outros canais PULSO em português.',
jsonb_build_object('fase', 'HUB', 'idioma', 'pt-BR')),

    -- Fase 1 - Curiosidades
    ('PULSO Curiosidades',
     'pulso-curiosidades-pt',
     'Curiosidades rápidas sobre psicologia, ciência, história, cultura pop e bizarrices.',
     jsonb_build_object('fase', 'F1', 'tipo', 'curiosidades')),

    -- Fase 2 - Mistérios & História
    ('PULSO Mistérios & História',
     'pulso-misterios-historia-pt',
     'Casos misteriosos, lendas urbanas, enigmas históricos e acontecimentos estranhos.',
     jsonb_build_object('fase', 'F2', 'tipo', 'misterios_historia')),

    -- Fase 2 - Psicologia & Comportamento
    ('PULSO Psicologia & Comportamento',
     'pulso-psicologia-comportamento-pt',
     'Conteúdos curtos de psicologia aplicada, comportamento humano e saúde mental.',
     jsonb_build_object('fase', 'F2', 'tipo', 'psicologia')),

    -- Fase 3 - Motivacional
    ('PULSO Motivacional',
     'pulso-motivacional-pt',
     'Frases de impacto, reflexões curtas e histórias motivacionais com tom realista.',
     jsonb_build_object('fase', 'F3', 'tipo', 'motivacional')),

    -- Fase 3 - Infantil (sem exposição de criança)
    ('PULSO Infantil',
     'pulso-infantil-pt',
     'Histórias rápidas, curiosidades e micro-contos para crianças, sem exposição de menores.',
     jsonb_build_object('fase', 'F3', 'tipo', 'infantil')),

    -- Fase 3 - Contos & Microficção
    ('PULSO Contos & Microficção',
     'pulso-contos-microficcao-pt',
     'Histórias ficcionais curtas, microcontos e narrativas seriadas.',
     jsonb_build_object('fase', 'F3', 'tipo', 'contos_ficcao')),

    -- Fase 3 - Estudos & Produtividade
    ('PULSO Estudos & Produtividade',
     'pulso-estudos-produtividade-pt',
     'Dicas práticas de estudo, foco, organização e produtividade realista.',
     jsonb_build_object('fase', 'F3', 'tipo', 'estudos_produtividade')),

    -- Fase 3 - Games Nostalgia
    ('PULSO Games Nostalgia',
     'pulso-games-nostalgia-pt',
     'Histórias, curiosidades e memórias sobre jogos clássicos e cultura gamer retrô.',
     jsonb_build_object('fase', 'F3', 'tipo', 'games_nostalgia')),

    -- Fase 3 - Casos Reais & Bizarros
    ('PULSO Casos Reais & Bizarros',
     'pulso-casos-reais-bizarros-pt',
     'Casos reais estranhos, crimes bizarros, coincidências e situações fora da curva.',
     jsonb_build_object('fase', 'F3', 'tipo', 'casos_reais_bizarros'))

) AS v(nome, slug, descricao, metadata)
WHERE NOT EXISTS (
SELECT 1 FROM pulso_core.canais c WHERE c.slug = v.slug
);

-- =========================================================
-- SÉRIES - PULSO CURIOSIDADES (pulso-curiosidades-pt)
-- =========================================================
WITH canal AS (
SELECT id
FROM pulso_core.canais
WHERE slug = 'pulso-curiosidades-pt'
)
INSERT INTO pulso_core.series (
canal_id,
nome,
slug,
descricao,
status,
ordem_padrao,
metadata
)
SELECT
c.id,
v.nome,
v.slug,
v.descricao,
'ATIVO'::pulso_status_geral,
v.ordem_padrao,
v.metadata
FROM canal c
CROSS JOIN (
VALUES
(
'Curiosidades Dark',
'curiosidades-dark',
'Fatos curiosos com tom levemente sombrio, psicológico ou existencial.',
1,
jsonb_build_object(
'formato_padrao', '15-30s',
'tipo_formato', 'curiosidade_rapida'
)
),
(
'Ciência Estranha',
'ciencia-estranha',
'Ciência bizarra, efeitos do cérebro e fenômenos pouco conhecidos.',
2,
jsonb_build_object(
'formato_padrao', '20-40s',
'tipo_formato', 'curiosidade_rapida'
)
),
(
'Curiosidades Psicológicas',
'curiosidades-psicologicas',
'Pequenos fatos sobre mente humana, memória, emoções e decisões.',
3,
jsonb_build_object(
'formato_padrao', '20-35s',
'tipo_formato', 'psicologia_curiosidade'
)
)
) AS v(nome, slug, descricao, ordem_padrao, metadata)
WHERE NOT EXISTS (
SELECT 1
FROM pulso_core.series s
WHERE s.canal_id = c.id
AND s.slug = v.slug
);

-- =========================================================
-- SÉRIES - PULSO MISTÉRIOS & HISTÓRIA (pulso-misterios-historia-pt)
-- =========================================================
WITH canal AS (
SELECT id
FROM pulso_core.canais
WHERE slug = 'pulso-misterios-historia-pt'
)
INSERT INTO pulso_core.series (
canal_id,
nome,
slug,
descricao,
status,
ordem_padrao,
metadata
)
SELECT
c.id,
v.nome,
v.slug,
v.descricao,
'ATIVO'::pulso_status_geral,
v.ordem_padrao,
v.metadata
FROM canal c
CROSS JOIN (
VALUES
(
'Mistérios Urbanos',
'misterios-urbanos',
'Lendas urbanas, casos estranhos em cidades e eventos sem explicação clara.',
1,
jsonb_build_object(
'formato_padrao', '40-60s',
'tipo_formato', 'misterio_historia'
)
),
(
'Casos Reais Misteriosos',
'casos-reais-misteriosos',
'Casos reais com elementos de mistério, desaparecimentos e coincidências bizarras.',
2,
jsonb_build_object(
'formato_padrao', '45-60s',
'tipo_formato', 'misterio_real'
)
),
(
'Enigmas Históricos',
'enigmas-historicos',
'Fatos históricos com dúvidas, versões conflitantes ou lacunas na narrativa.',
3,
jsonb_build_object(
'formato_padrao', '40-60s',
'tipo_formato', 'historia_misteriosa'
)
)
) AS v(nome, slug, descricao, ordem_padrao, metadata)
WHERE NOT EXISTS (
SELECT 1
FROM pulso_core.series s
WHERE s.canal_id = c.id
AND s.slug = v.slug
);

-- =========================================================
-- SÉRIES - PULSO MOTIVACIONAL (pulso-motivacional-pt)
-- =========================================================
WITH canal AS (
SELECT id
FROM pulso_core.canais
WHERE slug = 'pulso-motivacional-pt'
)
INSERT INTO pulso_core.series (
canal_id,
nome,
slug,
descricao,
status,
ordem_padrao,
metadata
)
SELECT
c.id,
v.nome,
v.slug,
v.descricao,
'ATIVO'::pulso_status_geral,
v.ordem_padrao,
v.metadata
FROM canal c
CROSS JOIN (
VALUES
(
'Reflexões Diretas',
'motivacional-reflexao',
'Textos curtos, intensos, em 2ª pessoa, puxando responsabilidade e esperança.',
1,
jsonb_build_object(
'formato_padrao', '20-35s',
'tipo_formato', 'motivacional'
)
),
(
'Histórias que Viram Chave',
'historias-que-viram-chave',
'Micro histórias de virada de vida, decisão difícil ou recomeço tardio.',
2,
jsonb_build_object(
'formato_padrao', '30-50s',
'tipo_formato', 'storytelling_motivacional'
)
)
) AS v(nome, slug, descricao, ordem_padrao, metadata)
WHERE NOT EXISTS (
SELECT 1
FROM pulso_core.series s
WHERE s.canal_id = c.id
AND s.slug = v.slug
);

-- =========================================================
-- SÉRIES - PULSO CONTOS & MICROFICÇÃO
-- (pulso-contos-microficcao-pt)
-- =========================================================
WITH canal AS (
SELECT id
FROM pulso_core.canais
WHERE slug = 'pulso-contos-microficcao-pt'
)
INSERT INTO pulso_core.series (
canal_id,
nome,
slug,
descricao,
status,
ordem_padrao,
metadata
)
SELECT
c.id,
v.nome,
v.slug,
v.descricao,
'ATIVO'::pulso_status_geral,
v.ordem_padrao,
v.metadata
FROM canal c
CROSS JOIN (
VALUES
(
'Storytelling Curto',
'storytelling-curto',
'Histórias com situação, conflito, clímax e moral em até 60s.',
1,
jsonb_build_object(
'formato_padrao', '40-60s',
'tipo_formato', 'storytelling'
)
),
(
'Microcontos Dark',
'microcontos-dark',
'Contos bem curtos, sombrios ou reflexivos, muitas vezes em 1 parágrafo.',
2,
jsonb_build_object(
'formato_padrao', '20-40s',
'tipo_formato', 'microficcao'
)
)
) AS v(nome, slug, descricao, ordem_padrao, metadata)
WHERE NOT EXISTS (
SELECT 1
FROM pulso_core.series s
WHERE s.canal_id = c.id
AND s.slug = v.slug
);

-- =========================================================
-- SÉRIES - PULSO ESTUDOS & PRODUTIVIDADE
-- (pulso-estudos-produtividade-pt)
-- =========================================================
WITH canal AS (
SELECT id
FROM pulso_core.canais
WHERE slug = 'pulso-estudos-produtividade-pt'
)
INSERT INTO pulso_core.series (
canal_id,
nome,
slug,
descricao,
status,
ordem_padrao,
metadata
)
SELECT
c.id,
v.nome,
v.slug,
v.descricao,
'ATIVO'::pulso_status_geral,
v.ordem_padrao,
v.metadata
FROM canal c
CROSS JOIN (
VALUES
(
'Estudo & Foco',
'estudo-foco',
'Técnicas de estudo, foco e concentração de forma prática.',
1,
jsonb_build_object(
'formato_padrao', '20-40s',
'tipo_formato', 'dica_rapida'
)
),
(
'Organização & Rotina',
'organizacao-rotina',
'Rotinas simples para quem estuda e trabalha, sem romantizar a exaustão.',
2,
jsonb_build_object(
'formato_padrao', '20-40s',
'tipo_formato', 'produtividade_realista'
)
)
) AS v(nome, slug, descricao, ordem_padrao, metadata)
WHERE NOT EXISTS (
SELECT 1
FROM pulso_core.series s
WHERE s.canal_id = c.id
AND s.slug = v.slug
);

-- =========================================================
-- SÉRIES - PULSO GAMES NOSTALGIA
-- (pulso-games-nostalgia-pt)
-- =========================================================
WITH canal AS (
SELECT id
FROM pulso_core.canais
WHERE slug = 'pulso-games-nostalgia-pt'
)
INSERT INTO pulso_core.series (
canal_id,
nome,
slug,
descricao,
status,
ordem_padrao,
metadata
)
SELECT
c.id,
v.nome,
v.slug,
v.descricao,
'ATIVO'::pulso_status_geral,
v.ordem_padrao,
v.metadata
FROM canal c
CROSS JOIN (
VALUES
(
'Clássicos & Memórias',
'classicos-memorias',
'Histórias e curiosidades de jogos clássicos e consoles antigos.',
1,
jsonb_build_object(
'formato_padrao', '20-45s',
'tipo_formato', 'curiosidade_games'
)
)
) AS v(nome, slug, descricao, ordem_padrao, metadata)
WHERE NOT EXISTS (
SELECT 1
FROM pulso_core.series s
WHERE s.canal_id = c.id
AND s.slug = v.slug
);

-- =========================================================
-- SÉRIES - PULSO CASOS REAIS & BIZARROS
-- (pulso-casos-reais-bizarros-pt)
-- =========================================================
WITH canal AS (
SELECT id
FROM pulso_core.canais
WHERE slug = 'pulso-casos-reais-bizarros-pt'
)
INSERT INTO pulso_core.series (
canal_id,
nome,
slug,
descricao,
status,
ordem_padrao,
metadata
)
SELECT
c.id,
v.nome,
v.slug,
v.descricao,
'ATIVO'::pulso_status_geral,
v.ordem_padrao,
v.metadata
FROM canal c
CROSS JOIN (
VALUES
(
'Casos Reais & Bizarros',
'casos-reais-bizarros',
'Histórias reais com elementos absurdos, coincidências extremas e bizarrices.',
1,
jsonb_build_object(
'formato_padrao', '40-60s',
'tipo_formato', 'caso_real'
)
),
(
'True Crime Dark',
'true-crime-dark',
'Casos criminais contados com responsabilidade, sem glamurizar violência.',
2,
jsonb_build_object(
'formato_padrao', '45-60s',
'tipo_formato', 'true_crime_responsavel'
)
)
) AS v(nome, slug, descricao, ordem_padrao, metadata)
WHERE NOT EXISTS (
SELECT 1
FROM pulso_core.series s
WHERE s.canal_id = c.id
AND s.slug = v.slug
);

-- =========================================================
-- TAGS EXTRAS PARA O UNIVERSO PULSO
-- =========================================================
INSERT INTO pulso_core.tags (nome, slug, descricao)
VALUES
('Psicologia', 'psicologia', 'Conteúdos sobre mente, emoções e comportamento humano.'),
('Motivação', 'motivacao', 'Vídeos de reflexão, incentivo e mudança de mentalidade.'),
('Comportamento', 'comportamento', 'Hábitos, padrões e atitudes no dia a dia.'),
('Produtividade', 'produtividade', 'Estudo, foco, organização e rotina.'),
('Infantil', 'infantil', 'Conteúdos seguros e positivos para crianças.'),
('Microficção', 'microficcao', 'Histórias curtas, microcontos e narrativas rápidas.'),
('Games', 'games', 'Conteúdos sobre jogos, consoles e cultura gamer.'),
('Nostalgia', 'nostalgia', 'Memórias afetivas, passado, infância e épocas antigas.'),
('Casos Reais', 'casos-reais', 'Histórias reais marcantes e fora do comum.'),
('Bizarro', 'bizarro', 'Situações estranhas, improváveis ou desconfortáveis.'),
('PULSO', 'pulso', 'Tag raiz que identifica conteúdos do ecossistema PULSO.')
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- DIA 1 – Curiosidade – Efeito Placebo
-- Canal: PULSO Curiosidades | Série: Ciência Estranha
-- =========================================================
INSERT INTO pulso_content.ideias (
canal_id, serie_id, titulo, descricao,
origem, prioridade, status, tags, linguagem, metadata
)
SELECT
c.id AS canal_id,
s.id AS serie_id,
'O Poder do Efeito Placebo',
'Você sabia que seu cérebro pode curar dor sem remédio? O efeito placebo faz 30% das pessoas melhorarem sem medicamento real. O mais surpreendente: funciona até quando a pessoa SABE que é placebo! Estudos mostram que só a expectativa de melhora já ativa áreas do cérebro ligadas ao alívio da dor.',
'MANUAL',
1,
'RASCUNHO',
ARRAY ['psicologia', 'cérebro', 'ciência', 'placebo'],
'pt-BR',
jsonb_build_object(
'tipo_formato', 'curiosidade_rapida',
'dia_calendario', 1,
'duracao_alvo', 25,
'gancho_sugerido', 'Você sabia que seu cérebro pode curar dor sem remédio?'
)
FROM pulso_core.canais c
JOIN pulso_core.series s
ON s.canal_id = c.id
AND s.slug = 'ciencia-estranha'
WHERE c.slug = 'pulso-curiosidades-pt'
AND NOT EXISTS (
SELECT 1 FROM pulso_content.ideias i
WHERE i.titulo = 'O Poder do Efeito Placebo'
);

-- =========================================================
-- DIA 2 – Mistério – Soldado desaparecido
-- Canal: PULSO Mistérios & História | Série: Casos Reais Misteriosos
-- =========================================================
INSERT INTO pulso_content.ideias (
canal_id, serie_id, titulo, descricao,
origem, prioridade, status, tags, linguagem, metadata
)
SELECT
c.id,
s.id,
'O Soldado que Desapareceu da Guerra',
'Em 1945, durante a Segunda Guerra, um soldado americano desapareceu misteriosamente do campo de batalha. Nenhum corpo foi encontrado, nenhuma testemunha viu nada. 60 anos depois, cartas dele começaram a chegar na casa da família. As cartas descreviam lugares que só existiam décadas após a guerra. Até hoje ninguém sabe explicar.',
'MANUAL',
1,
'RASCUNHO',
ARRAY ['história', 'mistério', 'guerra', 'desaparecimento'],
'pt-BR',
jsonb_build_object(
'tipo_formato', 'misterio',
'dia_calendario', 2,
'duracao_alvo', 60,
'gancho_sugerido', 'Um soldado desapareceu em 1945. 60 anos depois, cartas dele começaram a chegar...'
)
FROM pulso_core.canais c
JOIN pulso_core.series s
ON s.canal_id = c.id
AND s.slug = 'casos-reais-misteriosos'
WHERE c.slug = 'pulso-misterios-historia-pt'
AND NOT EXISTS (
SELECT 1 FROM pulso_content.ideias i
WHERE i.titulo = 'O Soldado que Desapareceu da Guerra'
);

-- =========================================================
-- DIA 3 – Psicologia – Esgotamento mental
-- Canal: PULSO Psicologia & Comportamento | Série: Saúde Mental no Cotidiano
-- =========================================================
INSERT INTO pulso_content.ideias (
canal_id, serie_id, titulo, descricao,
origem, prioridade, status, tags, linguagem, metadata
)
SELECT
c.id, s.id,
'3 Sinais de Esgotamento Mental',
'Você pode estar mais esgotado do que imagina. Sinal 1: Você esquece coisas simples (nome de pessoas, onde deixou as chaves). Sinal 2: Pequenas coisas te irritam demais. Sinal 3: Você não sente prazer em coisas que antes amava. Se identificou com 2 ou mais, seu cérebro está pedindo descanso.',
'MANUAL',
1,
'RASCUNHO',
ARRAY ['psicologia', 'saúde mental', 'esgotamento', 'burnout'],
'pt-BR',
jsonb_build_object(
'tipo_formato', 'psicologia',
'dia_calendario', 3,
'duracao_alvo', 35,
'gancho_sugerido', '3 sinais de que você é mais esgotado do que imagina'
)
FROM pulso_core.canais c
JOIN pulso_core.series s
ON s.canal_id = c.id
AND s.slug = 'saude-mental-cotidiano'
WHERE c.slug = 'pulso-psicologia-comportamento-pt'
AND NOT EXISTS (
SELECT 1 FROM pulso_content.ideias i
WHERE i.titulo = '3 Sinais de Esgotamento Mental'
);

-- =========================================================
-- DIA 4 – Storytelling – Homem que ganhou tudo
-- Canal: PULSO Contos & Microficção | Série: Storytelling Curto
-- =========================================================
INSERT INTO pulso_content.ideias (
canal_id, serie_id, titulo, descricao,
origem, prioridade, status, tags, linguagem, metadata
)
SELECT
c.id, s.id,
'O Homem que Ganhou Tudo e Perdeu a Si Mesmo',
'Um executivo passou 20 anos subindo na carreira. Ganhou dinheiro, poder, reconhecimento. Mas perdeu os amigos, o casamento, a saúde. Aos 50 anos, sozinho numa mansão vazia, percebeu: tinha conquistado tudo, menos a vida que queria viver. Decidiu recomeçar do zero.',
'MANUAL',
1,
'RASCUNHO',
ARRAY ['reflexão', 'vida', 'carreira', 'propósito'],
'pt-BR',
jsonb_build_object(
'tipo_formato', 'storytelling',
'dia_calendario', 4,
'duracao_alvo', 50,
'gancho_sugerido', 'Ele ganhou tudo o que sempre quis. E perdeu o que realmente importava.'
)
FROM pulso_core.canais c
JOIN pulso_core.series s
ON s.canal_id = c.id
AND s.slug = 'storytelling-curto'
WHERE c.slug = 'pulso-contos-microficcao-pt'
AND NOT EXISTS (
SELECT 1 FROM pulso_content.ideias i
WHERE i.titulo = 'O Homem que Ganhou Tudo e Perdeu a Si Mesmo'
);

-- =========================================================
-- DIA 5 – Mistério – Farol de Flannan Isles
-- Canal: PULSO Mistérios & História | Série: Mistérios Urbanos
-- =========================================================
INSERT INTO pulso_content.ideias (
canal_id, serie_id, titulo, descricao,
origem, prioridade, status, tags, linguagem, metadata
)
SELECT
c.id, s.id,
'O Farol de Flannan Isles - 3 Homens Sumiram',
'Escócia, 1900. Três guardas de farol desapareceram sem deixar rastro. A mesa estava posta, o relógio parado às 8h45, mas nenhum sinal de luta. Só encontraram: um diário com anotações estranhas sobre "tempestades que não existiram" e uma cadeira derrubada. Até hoje é um dos maiores mistérios marítimos.',
'MANUAL',
1,
'RASCUNHO',
ARRAY ['mistério', 'desaparecimento', 'história', 'mar'],
'pt-BR',
jsonb_build_object(
'tipo_formato', 'misterio',
'dia_calendario', 5,
'duracao_alvo', 60,
'gancho_sugerido', 'Três homens desapareceram de um farol. Nunca foram encontrados.'
)
FROM pulso_core.canais c
JOIN pulso_core.series s
ON s.canal_id = c.id
AND s.slug = 'misterios-urbanos'
WHERE c.slug = 'pulso-misterios-historia-pt'
AND NOT EXISTS (
SELECT 1 FROM pulso_content.ideias i
WHERE i.titulo = 'O Farol de Flannan Isles - 3 Homens Sumiram'
);

-- =========================================================
-- DIA 6 – Motivacional – Ninguém vai te salvar
-- Canal: PULSO Motivacional | Série: Reflexões Diretas
-- =========================================================
INSERT INTO pulso_content.ideias (
canal_id, serie_id, titulo, descricao,
origem, prioridade, status, tags, linguagem, metadata
)
SELECT
c.id, s.id,
'Ninguém Vai Te Salvar',
'Ninguém vai te salvar. Nem seus pais, nem seus amigos, nem aquele amor que você espera. E isso não é triste. Isso é libertador. Porque quando você para de esperar salvação, você vira seu próprio herói. Você é o projeto mais importante da sua vida. Aja como tal.',
'MANUAL',
1,
'RASCUNHO',
ARRAY ['motivação', 'reflexão', 'responsabilidade', 'vida'],
'pt-BR',
jsonb_build_object(
'tipo_formato', 'motivacional',
'dia_calendario', 6,
'duracao_alvo', 30,
'gancho_sugerido', 'Ninguém vai te salvar. Mas isso é libertador.'
)
FROM pulso_core.canais c
JOIN pulso_core.series s
ON s.canal_id = c.id
AND s.slug = 'motivacional-reflexao'
WHERE c.slug = 'pulso-motivacional-pt'
AND NOT EXISTS (
SELECT 1 FROM pulso_content.ideias i
WHERE i.titulo = 'Ninguém Vai Te Salvar'
);

-- =========================================================
-- DIA 7 – Curiosidade – Falsas memórias
-- Canal: PULSO Curiosidades | Série: Ciência Estranha
-- =========================================================
INSERT INTO pulso_content.ideias (
canal_id, serie_id, titulo, descricao,
origem, prioridade, status, tags, linguagem, metadata
)
SELECT
c.id, s.id,
'Seu Cérebro Inventa Memórias Falsas',
'Você se lembra do seu primeiro dia de escola? Provavelmente sim. Mas há 50% de chance de que essa memória seja FALSA. Estudos mostram que nosso cérebro inventa detalhes para preencher lacunas. Você pode ter certeza absoluta de uma memória que nunca aconteceu. Assustador, né?',
'MANUAL',
1,
'RASCUNHO',
ARRAY ['cérebro', 'memória', 'psicologia', 'ciência'],
'pt-BR',
jsonb_build_object(
'tipo_formato', 'curiosidade_rapida',
'dia_calendario', 7,
'duracao_alvo', 25,
'gancho_sugerido', 'Você tem certeza das suas memórias? Seu cérebro não.'
)
FROM pulso_core.canais c
JOIN pulso_core.series s
ON s.canal_id = c.id
AND s.slug = 'ciencia-estranha'
WHERE c.slug = 'pulso-curiosidades-pt'
AND NOT EXISTS (
SELECT 1 FROM pulso_content.ideias i
WHERE i.titulo = 'Seu Cérebro Inventa Memórias Falsas'
);

-- =========================================================
-- DIA 8 – Psicologia – Procrastinação
-- Canal: PULSO Psicologia & Comportamento | Série: Psicologia & Comportamento
-- =========================================================
INSERT INTO pulso_content.ideias (
canal_id, serie_id, titulo, descricao,
origem, prioridade, status, tags, linguagem, metadata
)
SELECT
c.id, s.id,
'A Verdade Sobre Procrastinação',
'Você não procrastina porque é preguiçoso. Procrastinação é ansiedade disfarçada. Seu cérebro evita tarefas que causam estresse emocional. Medo de falhar, medo de não ser perfeito, medo de julgamento. Quando você entende isso, para de se culpar e começa a resolver o problema real: a ansiedade.',
'MANUAL',
1,
'RASCUNHO',
ARRAY ['psicologia', 'procrastinação', 'ansiedade', 'produtividade'],
'pt-BR',
jsonb_build_object(
'tipo_formato', 'psicologia',
'dia_calendario', 8,
'duracao_alvo', 40,
'gancho_sugerido', 'Você não é preguiçoso. Você está ansioso.'
)
FROM pulso_core.canais c
JOIN pulso_core.series s
ON s.canal_id = c.id
AND s.slug = 'psicologia-comportamento'
WHERE c.slug = 'pulso-psicologia-comportamento-pt'
AND NOT EXISTS (
SELECT 1 FROM pulso_content.ideias i
WHERE i.titulo = 'A Verdade Sobre Procrastinação'
);

-- =========================================================
-- DIA 9 – Storytelling – Menina pessimista
-- Canal: PULSO Contos & Microficção | Série: Storytelling Curto
-- =========================================================
INSERT INTO pulso_content.ideias (
canal_id, serie_id, titulo, descricao,
origem, prioridade, status, tags, linguagem, metadata
)
SELECT
c.id, s.id,
'A Menina Pessimista',
'Havia uma menina que só via o lado ruim de tudo. Ganhou um cachorro: "Vai dar trabalho". Fez novos amigos: "Vão me decepcionar". Passou numa prova: "Foi sorte". Um dia, perdeu tudo por esperar sempre o pior. Quando tentou recuperar, entendeu: sua profecia se autorrealizou. Ela criou o mundo que temia.',
'MANUAL',
1,
'RASCUNHO',
ARRAY ['reflexão', 'pessimismo', 'mentalidade', 'história'],
'pt-BR',
jsonb_build_object(
'tipo_formato', 'storytelling',
'dia_calendario', 9,
'duracao_alvo', 50,
'gancho_sugerido', 'Ela só via o lado ruim. Até perder tudo.'
)
FROM pulso_core.canais c
JOIN pulso_core.series s
ON s.canal_id = c.id
AND s.slug = 'storytelling-curto'
WHERE c.slug = 'pulso-contos-microficcao-pt'
AND NOT EXISTS (
SELECT 1 FROM pulso_content.ideias i
WHERE i.titulo = 'A Menina Pessimista'
);

-- =========================================================
-- DIA 10 – Mistério – Avião fantasma (lenda urbana)
-- Canal: PULSO Mistérios & História | Série: Mistérios Urbanos
-- =========================================================
INSERT INTO pulso_content.ideias (
canal_id, serie_id, titulo, descricao,
origem, prioridade, status, tags, linguagem, metadata
)
SELECT
c.id, s.id,
'O Avião Fantasma de Santiago',
'Lenda urbana: em 1989, um avião pousou em Porto Alegre. Era um voo de 1954 que tinha desaparecido 37 anos antes. Todos os passageiros estavam mortos, mas os relógios marcavam apenas 3 horas de voo. Mentira ou verdade? Provavelmente mentira. Mas e se não for?',
'MANUAL',
2,
'RASCUNHO',
ARRAY ['mistério', 'lenda urbana', 'avião', 'tempo'],
'pt-BR',
jsonb_build_object(
'tipo_formato', 'misterio',
'dia_calendario', 10,
'duracao_alvo', 55,
'gancho_sugerido', 'Um avião desapareceu em 1954. Reapareceu 37 anos depois.',
'nota', 'Lenda urbana - mencionar que provavelmente é falso'
)
FROM pulso_core.canais c
JOIN pulso_core.series s
ON s.canal_id = c.id
AND s.slug = 'misterios-urbanos'
WHERE c.slug = 'pulso-misterios-historia-pt'
AND NOT EXISTS (
SELECT 1 FROM pulso_content.ideias i
WHERE i.titulo = 'O Avião Fantasma de Santiago'
);

-- =========================================================
-- DIA 11 – Motivacional – "Não é tarde pra recomeçar"
-- Canal: PULSO Motivacional | Série: Reflexões Diretas
-- =========================================================
INSERT INTO pulso_content.ideias (
canal_id, serie_id, titulo, descricao,
origem, prioridade, status, tags, linguagem, metadata
)
SELECT
c.id, s.id,
'Nunca É Tarde Para Recomeçar',
'Colonel Sanders criou o KFC aos 65 anos. Vera Wang entrou na moda aos 40. J.K. Rowling publicou Harry Potter aos 32, depois de anos sendo rejeitada. A ideia de que "passou da hora" é uma mentira que você conta pra si mesmo. Enquanto você respira, pode recomeçar.',
'MANUAL',
1,
'RASCUNHO',
ARRAY ['motivação', 'recomeço', 'idade', 'sucesso'],
'pt-BR',
jsonb_build_object(
'tipo_formato', 'motivacional',
'dia_calendario', 11,
'duracao_alvo', 35,
'gancho_sugerido', 'Você acha que é tarde? Essas pessoas discordam.'
)
FROM pulso_core.canais c
JOIN pulso_core.series s
ON s.canal_id = c.id
AND s.slug = 'motivacional-reflexao'
WHERE c.slug = 'pulso-motivacional-pt'
AND NOT EXISTS (
SELECT 1 FROM pulso_content.ideias i
WHERE i.titulo = 'Nunca É Tarde Para Recomeçar'
);

-- =========================================================
-- DIA 12 – Curiosidade – Música favorita e o cérebro
-- Canal: PULSO Curiosidades | Série: Ciência Estranha
-- =========================================================
INSERT INTO pulso_content.ideias (
canal_id, serie_id, titulo, descricao,
origem, prioridade, status, tags, linguagem, metadata
)
SELECT
c.id, s.id,
'O Que Acontece Quando Você Ouve Sua Música Favorita',
'Quando você ouve sua música favorita, seu cérebro libera dopamina - a mesma substância liberada ao comer chocolate ou se apaixonar. Estudos mostram que 15 segundos antes do seu trecho favorito, seu cérebro já começa a liberar a dopamina, antecipando o prazer. Música é droga sem efeitos colaterais.',
'MANUAL',
1,
'RASCUNHO',
ARRAY ['música', 'cérebro', 'dopamina', 'ciência'],
'pt-BR',
jsonb_build_object(
'tipo_formato', 'curiosidade_rapida',
'dia_calendario', 12,
'duracao_alvo', 30,
'gancho_sugerido', 'Sua música favorita é literalmente uma droga.'
)
FROM pulso_core.canais c
JOIN pulso_core.series s
ON s.canal_id = c.id
AND s.slug = 'ciencia-estranha'
WHERE c.slug = 'pulso-curiosidades-pt'
AND NOT EXISTS (
SELECT 1 FROM pulso_content.ideias i
WHERE i.titulo = 'O Que Acontece Quando Você Ouve Sua Música Favorita'
);

-- =========================================================
-- DIA 13 – Psicologia – Ansiedade social
-- Canal: PULSO Psicologia & Comportamento | Série: Saúde Mental no Cotidiano
-- =========================================================
INSERT INTO pulso_content.ideias (
canal_id, serie_id, titulo, descricao,
origem, prioridade, status, tags, linguagem, metadata
)
SELECT
c.id, s.id,
'Ansiedade Social em 3 Pontos',
'Ansiedade social não é timidez. É seu cérebro convencido de que todos estão te julgando. Ponto 1: Você evita situações sociais não por querer, mas por medo. Ponto 2: Você repete interações na sua cabeça por dias. Ponto 3: Você sente sintomas físicos: tremor, suor, coração acelerado. Se identificou? Você não está sozinho. 15% da população tem isso.',
'MANUAL',
1,
'RASCUNHO',
ARRAY ['psicologia', 'ansiedade social', 'saúde mental', 'fobia'],
'pt-BR',
jsonb_build_object(
'tipo_formato', 'psicologia',
'dia_calendario', 13,
'duracao_alvo', 40,
'gancho_sugerido', 'Ansiedade social explicada em 3 pontos'
)
FROM pulso_core.canais c
JOIN pulso_core.series s
ON s.canal_id = c.id
AND s.slug = 'saude-mental-cotidiano'
WHERE c.slug = 'pulso-psicologia-comportamento-pt'
AND NOT EXISTS (
SELECT 1 FROM pulso_content.ideias i
WHERE i.titulo = 'Ansiedade Social em 3 Pontos'
);

-- =========================================================
-- DIA 14 – Storytelling – Homem que só reclamava
-- Canal: PULSO Contos & Microficção | Série: Storytelling Curto
-- =========================================================
INSERT INTO pulso_content.ideias (
canal_id, serie_id, titulo, descricao,
origem, prioridade, status, tags, linguagem, metadata
)
SELECT
c.id, s.id,
'O Homem que Só Reclamava',
'Havia um homem que reclamava de tudo. O café estava frio. O chefe era injusto. O tempo era ruim. Os amigos se afastaram. A esposa cansou. Ficou sozinho. Um dia, percebeu: ele não tinha má sorte. Ele tinha maus hábitos. Mudou. Parou de reclamar. Começou a agradecer. A vida mudou junto.',
'MANUAL',
1,
'RASCUNHO',
ARRAY ['reflexão', 'gratidão', 'reclamação', 'mentalidade'],
'pt-BR',
jsonb_build_object(
'tipo_formato', 'storytelling',
'dia_calendario', 14,
'duracao_alvo', 50,
'gancho_sugerido', 'Ele reclamava de tudo. Até ficar sozinho.'
)
FROM pulso_core.canais c
JOIN pulso_core.series s
ON s.canal_id = c.id
AND s.slug = 'storytelling-curto'
WHERE c.slug = 'pulso-contos-microficcao-pt'
AND NOT EXISTS (
SELECT 1 FROM pulso_content.ideias i
WHERE i.titulo = 'O Homem que Só Reclamava'
);

-- =========================================================
-- DIA 15 – Mistério – Déjà vu extremo (caso real)
-- Canal: PULSO Mistérios & História | Série: Casos Reais Misteriosos
-- =========================================================
INSERT INTO pulso_content.ideias (
canal_id, serie_id, titulo, descricao,
origem, prioridade, status, tags, linguagem, metadata
)
SELECT
c.id, s.id,
'O Homem Preso num Déjà Vu Infinito',
'Em 2010, um britânico começou a sentir déjà vu CONSTANTE. Tudo parecia repetição. Ele parou de assistir TV, ler notícias, sair de casa. Vivia em pânico: "Já vivi isso antes". Médicos descobriram: ansiedade extrema pode causar falso déjà vu crônico. Ele tratou a ansiedade e melhorou. Mas imagine viver assim...',
'MANUAL',
1,
'RASCUNHO',
ARRAY ['mistério', 'déjà vu', 'psicologia', 'caso real'],
'pt-BR',
jsonb_build_object(
'tipo_formato', 'misterio',
'dia_calendario', 15,
'duracao_alvo', 60,
'gancho_sugerido', 'Imagine sentir déjà vu em TUDO. 24 horas por dia.'
)
FROM pulso_core.canais c
JOIN pulso_core.series s
ON s.canal_id = c.id
AND s.slug = 'casos-reais-misteriosos'
WHERE c.slug = 'pulso-misterios-historia-pt'
AND NOT EXISTS (
SELECT 1 FROM pulso_content.ideias i
WHERE i.titulo = 'O Homem Preso num Déjà Vu Infinito'
);

-- =========================================================
-- DIA 16 – Motivacional – Você não precisa ser perfeito
-- Canal: PULSO Motivacional | Série: Reflexões Diretas
-- =========================================================
INSERT INTO pulso_content.ideias (
canal_id, serie_id, titulo, descricao,
origem, prioridade, status, tags, linguagem, metadata
)
SELECT
c.id, s.id,
'Você Não Precisa Ser Perfeito',
'Você não precisa ser perfeito. Você precisa ser consistente. Escrever mal é melhor que não escrever. Treinar mal é melhor que não treinar. Tentar e errar é melhor que não tentar. Perfeição é paralisante. Progresso é libertador. Escolha o progresso.',
'MANUAL',
1,
'RASCUNHO',
ARRAY ['motivação', 'perfeição', 'progresso', 'ação'],
'pt-BR',
jsonb_build_object(
'tipo_formato', 'motivacional',
'dia_calendario', 16,
'duracao_alvo', 25,
'gancho_sugerido', 'Perfeição é paralisante. Progresso é libertador.'
)
FROM pulso_core.canais c
JOIN pulso_core.series s
ON s.canal_id = c.id
AND s.slug = 'motivacional-reflexao'
WHERE c.slug = 'pulso-motivacional-pt'
AND NOT EXISTS (
SELECT 1 FROM pulso_content.ideias i
WHERE i.titulo = 'Você Não Precisa Ser Perfeito'
);

-- =========================================================
-- DIA 17 – Curiosidade – Por que amamos plot twists?
-- Canal: PULSO Curiosidades | Série: Ciência Estranha
-- =========================================================
INSERT INTO pulso_content.ideias (
canal_id, serie_id, titulo, descricao,
origem, prioridade, status, tags, linguagem, metadata
)
SELECT
c.id, s.id,
'Por Que Amamos Plot Twists',
'Seu cérebro ADORA ser surpreendido. Quando você assiste um plot twist bem feito, a mesma área do cérebro ativada pela comida saborosa se acende. É prazer puro. Estudos mostram: quanto mais você acha que sabe o final, mais prazeroso é o twist. Nosso cérebro é viciado em ter suas expectativas quebradas.',
'MANUAL',
1,
'RASCUNHO',
ARRAY ['psicologia', 'cérebro', 'entretenimento', 'dopamina'],
'pt-BR',
jsonb_build_object(
'tipo_formato', 'curiosidade_rapida',
'dia_calendario', 17,
'duracao_alvo', 30,
'gancho_sugerido', 'Plot twists ativam a mesma área do cérebro que comida gostosa.'
)
FROM pulso_core.canais c
JOIN pulso_core.series s
ON s.canal_id = c.id
AND s.slug = 'ciencia-estranha'
WHERE c.slug = 'pulso-curiosidades-pt'
AND NOT EXISTS (
SELECT 1 FROM pulso_content.ideias i
WHERE i.titulo = 'Por Que Amamos Plot Twists'
);

-- =========================================================
-- DIA 18 – Psicologia – Efeito manada
-- Canal: PULSO Psicologia & Comportamento | Série: Psicologia & Comportamento
-- =========================================================
INSERT INTO pulso_content.ideias (
canal_id, serie_id, titulo, descricao,
origem, prioridade, status, tags, linguagem, metadata
)
SELECT
c.id, s.id,
'O Efeito Manada: Por Que Você Segue a Multidão',
'Experimento clássico: colocaram uma pessoa numa sala com atores. Todos deram respostas obviamente erradas. 75% das pessoas seguiram a maioria, mesmo sabendo que estava errada. Efeito manada: seu cérebro prefere estar errado com todos do que certo sozinho. Você faz isso sem perceber. Todo dia.',
'MANUAL',
1,
'RASCUNHO',
ARRAY ['psicologia', 'comportamento', 'sociedade', 'influência'],
'pt-BR',
jsonb_build_object(
'tipo_formato', 'psicologia',
'dia_calendario', 18,
'duracao_alvo', 40,
'gancho_sugerido', '75% das pessoas preferem estar erradas com todos.'
)
FROM pulso_core.canais c
JOIN pulso_core.series s
ON s.canal_id = c.id
AND s.slug = 'psicologia-comportamento'
WHERE c.slug = 'pulso-psicologia-comportamento-pt'
AND NOT EXISTS (
SELECT 1 FROM pulso_content.ideias i
WHERE i.titulo = 'O Efeito Manada: Por Que Você Segue a Multidão'
);

-- =========================================================
-- DIA 19 – Storytelling – A escolha que mudou tudo
-- Canal: PULSO Contos & Microficção | Série: Storytelling Curto
-- =========================================================
INSERT INTO pulso_content.ideias (
canal_id, serie_id, titulo, descricao,
origem, prioridade, status, tags, linguagem, metadata
)
SELECT
c.id, s.id,
'A Escolha de 5 Segundos',
'Dois amigos. Mesma empresa demitiu os dois. Um decidiu: "Vou reclamar e procurar emprego igual". O outro: "Vou criar algo meu". 5 anos depois: o primeiro ainda reclama da demissão. O segundo construiu uma empresa. Mesma situação. Escolhas diferentes. Vidas diferentes. Sua vida é a soma das suas escolhas nos momentos difíceis.',
'MANUAL',
1,
'RASCUNHO',
ARRAY ['reflexão', 'escolhas', 'mindset', 'sucesso'],
'pt-BR',
jsonb_build_object(
'tipo_formato', 'storytelling',
'dia_calendario', 19,
'duracao_alvo', 50,
'gancho_sugerido', 'Dois amigos. Mesma crise. Destinos opostos.'
)
FROM pulso_core.canais c
JOIN pulso_core.series s
ON s.canal_id = c.id
AND s.slug = 'storytelling-curto'
WHERE c.slug = 'pulso-contos-microficcao-pt'
AND NOT EXISTS (
SELECT 1 FROM pulso_content.ideias i
WHERE i.titulo = 'A Escolha de 5 Segundos'
);

-- =========================================================
-- DIA 20 – Mistério – Cidade fantasma moderna (Pripyat)
-- Canal: PULSO Mistérios & História | Série: Mistérios Urbanos
-- =========================================================
INSERT INTO pulso_content.ideias (
canal_id, serie_id, titulo, descricao,
origem, prioridade, status, tags, linguagem, metadata
)
SELECT
c.id, s.id,
'Pripyat: A Cidade Congelada no Tempo',
'Ucrânia, 1986. Pripyat era uma cidade próspera de 50 mil habitantes. Em 24 horas, virou cidade fantasma. Chernobyl explodiu. Evacuação total. Hoje: pratos na mesa, brinquedos no chão, relógios parados. Uma cidade inteira abandonada em segundos. Você pode visitá-la, mas não pode ficar mais de algumas horas. A radiação ainda mata.',
'MANUAL',
1,
'RASCUNHO',
ARRAY ['história', 'chernobyl', 'cidade fantasma', 'tragédia'],
'pt-BR',
jsonb_build_object(
'tipo_formato', 'misterio',
'dia_calendario', 20,
'duracao_alvo', 60,
'gancho_sugerido', 'Uma cidade de 50 mil pessoas. Abandonada em 24 horas.'
)
FROM pulso_core.canais c
JOIN pulso_core.series s
ON s.canal_id = c.id
AND s.slug = 'misterios-urbanos'
WHERE c.slug = 'pulso-misterios-historia-pt'
AND NOT EXISTS (
SELECT 1 FROM pulso_content.ideias i
WHERE i.titulo = 'Pripyat: A Cidade Congelada no Tempo'
);
