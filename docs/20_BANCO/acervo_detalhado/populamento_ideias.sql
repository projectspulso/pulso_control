-- =========================================================
-- POPULAMENTO DE IDEIAS - TODOS OS CANAIS E SÉRIES
-- Seguindo o padrão de melhoria_no_banco.md
-- =========================================================
-- =========================================================
-- 1) ATUALIZAR IDEIAS ANTIGAS (associar aos canais corretos)
-- =========================================================
-- Associar ideias antigas do "Pulso Dark PT" às novas séries
WITH canal_curiosidades AS (
    SELECT id
    FROM pulso_core.canais
    WHERE slug = 'pulso-curiosidades-pt'
    LIMIT 1
), serie_curiosidades_dark AS (
    SELECT id
    FROM pulso_core.series
    WHERE slug = 'curiosidades-dark'
    LIMIT 1
)
UPDATE pulso_content.ideias
SET canal_id = (
        SELECT id
        FROM canal_curiosidades
    ),
    serie_id = (
        SELECT id
        FROM serie_curiosidades_dark
    )
WHERE id IN (
        SELECT id
        FROM pulso_content.ideias
        WHERE canal_id IS NULL
            AND titulo LIKE '%dark%'
        LIMIT 10
    );
-- Associar ideias científicas ao canal Curiosidades
WITH canal_curiosidades AS (
    SELECT id
    FROM pulso_core.canais
    WHERE slug = 'pulso-curiosidades-pt'
    LIMIT 1
), serie_ciencia AS (
    SELECT id
    FROM pulso_core.series
    WHERE slug = 'ciencia-estranha'
    LIMIT 1
)
UPDATE pulso_content.ideias
SET canal_id = (
        SELECT id
        FROM canal_curiosidades
    ),
    serie_id = (
        SELECT id
        FROM serie_ciencia
    )
WHERE id IN (
        SELECT id
        FROM pulso_content.ideias
        WHERE canal_id IS NULL
            AND (
                titulo ILIKE '%ciência%'
                OR titulo ILIKE '%experimento%'
                OR titulo ILIKE '%cérebro%'
            )
        LIMIT 10
    );
-- Associar restantes ao canal Mistérios
WITH canal_misterios AS (
    SELECT id
    FROM pulso_core.canais
    WHERE slug = 'pulso-misterios-historia-pt'
    LIMIT 1
), serie_misterios AS (
    SELECT id
    FROM pulso_core.series
    WHERE slug = 'misterios-urbanos'
    LIMIT 1
)
UPDATE pulso_content.ideias
SET canal_id = (
        SELECT id
        FROM canal_misterios
    ),
    serie_id = (
        SELECT id
        FROM serie_misterios
    )
WHERE canal_id IS NULL;
-- =========================================================
-- 2) IDEIAS - PULSO CURIOSIDADES
-- =========================================================
-- Série: Curiosidades Dark
WITH canal AS (
    SELECT id
    FROM pulso_core.canais
    WHERE slug = 'pulso-curiosidades-pt'
),
serie AS (
    SELECT id
    FROM pulso_core.series
    WHERE slug = 'curiosidades-dark'
)
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        status,
        prioridade,
        metadata
    )
SELECT c.id,
    s.id,
    v.titulo,
    v.descricao,
    'RASCUNHO'::pulso_status_ideia,
    v.prioridade,
    v.metadata
FROM canal c,
    serie s
    CROSS JOIN (
        VALUES (
                'O Paradoxo do Aniversário',
                'Em um grupo de 23 pessoas, há 50% de chance de duas terem o mesmo aniversário. Parece impossível?',
                7,
                jsonb_build_object(
                    'duracao_estimada',
                    '25s',
                    'tipo',
                    'curiosidade_matematica'
                )
            ),
            (
                'Você Nunca Viu Seu Rosto',
                'Você só vê reflexos e fotos. Seu rosto real, como os outros veem, é invisível para você.',
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '20s',
                    'tipo',
                    'curiosidade_existencial'
                )
            ),
            (
                'A Ilusão do Livre Arbítrio',
                'Seu cérebro decide até 7 segundos antes de você "decidir conscientemente". Quem está no controle?',
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '30s',
                    'tipo',
                    'neurociencia_dark'
                )
            ),
            (
                'O Silêncio Absoluto Te Enlouquece',
                'Câmara anecoica: silêncio total faz você ouvir seus órgãos. Ninguém aguenta mais de 45 minutos.',
                10,
                jsonb_build_object(
                    'duracao_estimada',
                    '28s',
                    'tipo',
                    'curiosidade_psicologica'
                )
            ),
            (
                'Você Já Morreu Milhares de Vezes',
                'Células morrem e renascem constantemente. Você de 7 anos atrás não existe mais, literalmente.',
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '22s',
                    'tipo',
                    'biologia_existencial'
                )
            )
    ) AS v(titulo, descricao, prioridade, metadata)
WHERE NOT EXISTS (
        SELECT 1
        FROM pulso_content.ideias i
        WHERE i.titulo = v.titulo
            AND i.canal_id = c.id
    );
-- Série: Ciência Estranha
WITH canal AS (
    SELECT id
    FROM pulso_core.canais
    WHERE slug = 'pulso-curiosidades-pt'
),
serie AS (
    SELECT id
    FROM pulso_core.series
    WHERE slug = 'ciencia-estranha'
)
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        status,
        prioridade,
        metadata
    )
SELECT c.id,
    s.id,
    v.titulo,
    v.descricao,
    v.status,
    v.prioridade,
    v.metadata
FROM canal c,
    serie s
    CROSS JOIN (
        VALUES (
                'Gêmeos Parasitas',
                'Fetus in fetu: gêmeo cresce dentro do corpo do outro. Casos reais de pessoas descobrindo aos 30 anos.',
                'APROVADA'::pulso_status_ideia,
                10,
                jsonb_build_object(
                    'duracao_estimada',
                    '35s',
                    'tipo',
                    'medicina_bizarra'
                )
            ),
            (
                'A Síndrome da Mão Alienígena',
                'Sua mão age sozinha, contra sua vontade. Casos reais de pessoas sendo atacadas pela própria mão.',
                'RASCUNHO'::pulso_status_ideia,
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '30s',
                    'tipo',
                    'neurologia_bizarra'
                )
            ),
            (
                'Bactérias que Controlam Seu Humor',
                'Seu intestino tem mais neurônios que um gato. As bactérias lá decidem se você está feliz ou deprimido.',
                'APROVADA'::pulso_status_ideia,
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '32s',
                    'tipo',
                    'microbioma_mente'
                )
            ),
            (
                'O Experimento do Universo 25',
                'Ratos com recursos infinitos criaram uma utopia que virou apocalipse. E se formos nós?',
                'RASCUNHO'::pulso_status_ideia,
                10,
                jsonb_build_object(
                    'duracao_estimada',
                    '40s',
                    'tipo',
                    'experimento_social'
                )
            ),
            (
                'Priões: O Vírus Indestrutível',
                'Nem vírus, nem bactéria. Proteínas que convertem outras proteínas. Impossível matar, sempre fatal.',
                'APROVADA'::pulso_status_ideia,
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '35s',
                    'tipo',
                    'biologia_terror'
                )
            )
    ) AS v(titulo, descricao, status, prioridade, metadata)
WHERE NOT EXISTS (
        SELECT 1
        FROM pulso_content.ideias i
        WHERE i.titulo = v.titulo
            AND i.canal_id = c.id
    );
-- Série: Curiosidades Psicológicas
WITH canal AS (
    SELECT id
    FROM pulso_core.canais
    WHERE slug = 'pulso-curiosidades-pt'
),
serie AS (
    SELECT id
    FROM pulso_core.series
    WHERE slug = 'curiosidades-psicologicas'
)
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        status,
        prioridade,
        metadata
    )
SELECT c.id,
    s.id,
    v.titulo,
    v.descricao,
    'RASCUNHO'::pulso_status_ideia,
    v.prioridade,
    v.metadata
FROM canal c,
    serie s
    CROSS JOIN (
        VALUES (
                'O Efeito Zeigarnik',
                'Seu cérebro lembra mais de tarefas inacabadas que completas. Por isso você não esquece aquela série.',
                7,
                jsonb_build_object(
                    'duracao_estimada',
                    '25s',
                    'tipo',
                    'psicologia_cognitiva'
                )
            ),
            (
                'Você Mente 200 Vezes Por Dia',
                'Mentiras automáticas: "Tudo bem", "Depois eu vejo", "Tô quase chegando". Sua mente mente sem você saber.',
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '28s',
                    'tipo',
                    'comportamento_social'
                )
            ),
            (
                'O Paradoxo da Escolha',
                'Quanto mais opções, mais infeliz você fica. Por que 50 tipos de iogurte te paralisam?',
                7,
                jsonb_build_object(
                    'duracao_estimada',
                    '30s',
                    'tipo',
                    'psicologia_decisao'
                )
            ),
            (
                'Gaslighting Que Você Faz em Si Mesmo',
                'Você reescreve suas memórias para se proteger. Suas lembranças são mentiras que você acredita.',
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '32s',
                    'tipo',
                    'memoria_autoengano'
                )
            ),
            (
                'O Efeito Dunning-Kruger',
                'Quanto menos você sabe, mais confiante fica. Incompetentes não sabem que são incompetentes.',
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '27s',
                    'tipo',
                    'psicologia_cognição'
                )
            )
    ) AS v(titulo, descricao, prioridade, metadata)
WHERE NOT EXISTS (
        SELECT 1
        FROM pulso_content.ideias i
        WHERE i.titulo = v.titulo
            AND i.canal_id = c.id
    );
-- =========================================================
-- 3) IDEIAS - PULSO MISTÉRIOS & HISTÓRIA
-- =========================================================
-- Série: Mistérios Urbanos
WITH canal AS (
    SELECT id
    FROM pulso_core.canais
    WHERE slug = 'pulso-misterios-historia-pt'
),
serie AS (
    SELECT id
    FROM pulso_core.series
    WHERE slug = 'misterios-urbanos'
)
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        status,
        prioridade,
        metadata
    )
SELECT c.id,
    s.id,
    v.titulo,
    v.descricao,
    v.status,
    v.prioridade,
    v.metadata
FROM canal c,
    serie s
    CROSS JOIN (
        VALUES (
                'A Garota do Elevador Elisa Lam',
                'Vídeo viral: garota age estranhamente em elevador. Dias depois, encontrada morta em caixa d''água.',
                'APROVADA'::pulso_status_ideia,
                10,
                jsonb_build_object(
                    'duracao_estimada',
                    '55s',
                    'tipo',
                    'caso_misterioso_real'
                )
            ),
            (
                'O Homem de Taman Shud',
                'Corpo não identificado com código secreto no bolso. 70 anos depois, ninguém sabe quem era.',
                'RASCUNHO'::pulso_status_ideia,
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '50s',
                    'tipo',
                    'misterio_historico'
                )
            ),
            (
                'A Casa Winchester',
                'Mulher construiu casa por 38 anos sem parar. Portas para o nada, escadas para o teto. Por quê?',
                'APROVADA'::pulso_status_ideia,
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '45s',
                    'tipo',
                    'lenda_urbana_real'
                )
            ),
            (
                'O Suicídio Coletivo de Baleias',
                'Dezenas de baleias encalham em praias sem motivo. Teorias: sonar naval ou... outra coisa?',
                'RASCUNHO'::pulso_status_ideia,
                7,
                jsonb_build_object(
                    'duracao_estimada',
                    '40s',
                    'tipo',
                    'fenomeno_inexplicado'
                )
            ),
            (
                'A Ilha dos Mortos - Poveglia',
                'Ilha italiana usada como quarentena de peste. 160 mil mortos. Ninguém mora lá até hoje.',
                'APROVADA'::pulso_status_ideia,
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '48s',
                    'tipo',
                    'historia_sombria'
                )
            )
    ) AS v(titulo, descricao, status, prioridade, metadata)
WHERE NOT EXISTS (
        SELECT 1
        FROM pulso_content.ideias i
        WHERE i.titulo = v.titulo
            AND i.canal_id = c.id
    );
-- Série: Casos Reais Misteriosos
WITH canal AS (
    SELECT id
    FROM pulso_core.canais
    WHERE slug = 'pulso-misterios-historia-pt'
),
serie AS (
    SELECT id
    FROM pulso_core.series
    WHERE slug = 'casos-reais-misteriosos'
)
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        status,
        prioridade,
        metadata
    )
SELECT c.id,
    s.id,
    v.titulo,
    v.descricao,
    'RASCUNHO'::pulso_status_ideia,
    v.prioridade,
    v.metadata
FROM canal c,
    serie s
    CROSS JOIN (
        VALUES (
                'O Caso dos Irmãos Sodder',
                'Incêndio destrói casa, 5 crianças desaparecem. Corpos nunca encontrados. Pistas indicam sequestro.',
                10,
                jsonb_build_object(
                    'duracao_estimada',
                    '60s',
                    'tipo',
                    'desaparecimento_misterioso'
                )
            ),
            (
                'A Morte de Gloria Ramirez',
                'Mulher no hospital emite vapores tóxicos. 23 pessoas desmaiaram. Ninguém sabe o que aconteceu.',
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '52s',
                    'tipo',
                    'fenomeno_medico'
                )
            ),
            (
                'O Voo MH370 da Malaysia Airlines',
                'Avião com 239 pessoas desaparece no ar. Destroços encontrados anos depois. O que aconteceu?',
                10,
                jsonb_build_object(
                    'duracao_estimada',
                    '55s',
                    'tipo',
                    'desaparecimento_moderno'
                )
            ),
            (
                'A Colônia Perdida de Roanoke',
                'Colônia inteira desaparece. Única pista: palavra "CROATOAN" entalhada em árvore.',
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '48s',
                    'tipo',
                    'misterio_colonial'
                )
            ),
            (
                'O Túnel do Tempo de Tóquio',
                'Homem aparece em aeroporto com passaporte de país que não existe. Desaparece sob vigilância.',
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '50s',
                    'tipo',
                    'caso_bizarro_moderno'
                )
            )
    ) AS v(titulo, descricao, prioridade, metadata)
WHERE NOT EXISTS (
        SELECT 1
        FROM pulso_content.ideias i
        WHERE i.titulo = v.titulo
            AND i.canal_id = c.id
    );
-- Série: Enigmas Históricos
WITH canal AS (
    SELECT id
    FROM pulso_core.canais
    WHERE slug = 'pulso-misterios-historia-pt'
),
serie AS (
    SELECT id
    FROM pulso_core.series
    WHERE slug = 'enigmas-historicos'
)
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        status,
        prioridade,
        metadata
    )
SELECT c.id,
    s.id,
    v.titulo,
    v.descricao,
    'RASCUNHO'::pulso_status_ideia,
    v.prioridade,
    v.metadata
FROM canal c,
    serie s
    CROSS JOIN (
        VALUES (
                'O Manuscrito Voynich',
                'Livro medieval em língua desconhecida. Ninguém conseguiu decifrar em 600 anos. O que está escrito?',
                10,
                jsonb_build_object(
                    'duracao_estimada',
                    '50s',
                    'tipo',
                    'enigma_medieval'
                )
            ),
            (
                'A Biblioteca de Alexandria',
                'Todo conhecimento da antiguidade queimado. Teorias: acidente, guerra ou... conspiração?',
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '45s',
                    'tipo',
                    'historia_perdida'
                )
            ),
            (
                'O Tesouro dos Templários',
                'Ordem dissolvida em 1312. Tesouros desapareceram. Teorias: Escócia, América ou fundo do mar?',
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '52s',
                    'tipo',
                    'tesouro_perdido'
                )
            ),
            (
                'A Verdadeira Atlântida',
                'Platão descreveu ilha que afundou. Teorias: Santorini, Antártida ou pura ficção?',
                7,
                jsonb_build_object(
                    'duracao_estimada',
                    '48s',
                    'tipo',
                    'civilizacao_perdida'
                )
            ),
            (
                'Jack, o Estripador',
                'Identidade real: médico, nobre ou... mulher? Cartas misteriosas e teorias conspiratórias.',
                10,
                jsonb_build_object(
                    'duracao_estimada',
                    '55s',
                    'tipo',
                    'crime_historico'
                )
            )
    ) AS v(titulo, descricao, prioridade, metadata)
WHERE NOT EXISTS (
        SELECT 1
        FROM pulso_content.ideias i
        WHERE i.titulo = v.titulo
            AND i.canal_id = c.id
    );
-- =========================================================
-- 4) IDEIAS - PULSO MOTIVACIONAL
-- =========================================================
-- Série: Reflexões Diretas
WITH canal AS (
    SELECT id
    FROM pulso_core.canais
    WHERE slug = 'pulso-motivacional-pt'
),
serie AS (
    SELECT id
    FROM pulso_core.series
    WHERE slug = 'motivacional-reflexao'
)
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        status,
        prioridade,
        metadata
    )
SELECT c.id,
    s.id,
    v.titulo,
    v.descricao,
    'RASCUNHO'::pulso_status_ideia,
    v.prioridade,
    v.metadata
FROM canal c,
    serie s
    CROSS JOIN (
        VALUES (
                'Você Está Esperando o Que?',
                'Texto direto: "O momento perfeito não existe. Você está só adiando o inevitável. Comece hoje."',
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '25s',
                    'tom',
                    'direto_responsabilizador'
                )
            ),
            (
                'Ninguém Vai Te Salvar',
                '"Você espera que alguém apareça e resolva tudo. Spoiler: não vai acontecer. É tudo com você."',
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '22s',
                    'tom',
                    'realista_duro'
                )
            ),
            (
                'Sua Desculpa Favorita',
                '"Não tenho tempo." Mas tem tempo pra scroll infinito. Seja honesto: você tem prioridades erradas."',
                10,
                jsonb_build_object('duracao_estimada', '28s', 'tom', 'confrontador')
            ),
            (
                'O Amanhã Que Nunca Chega',
                '"Vou começar segunda." "Ano que vem eu faço." Quantos "amanhãs" você já desperdiçou?"',
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '24s',
                    'tom',
                    'reflexivo_direto'
                )
            ),
            (
                'Você Não é Especial (E Tudo Bem)',
                '"O mundo não deve nada a você. Mas você deve tudo a você mesmo. Pare de reclamar, comece a agir."',
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '30s',
                    'tom',
                    'realista_empoderador'
                )
            )
    ) AS v(titulo, descricao, prioridade, metadata)
WHERE NOT EXISTS (
        SELECT 1
        FROM pulso_content.ideias i
        WHERE i.titulo = v.titulo
            AND i.canal_id = c.id
    );
-- Série: Histórias que Viram Chave
WITH canal AS (
    SELECT id
    FROM pulso_core.canais
    WHERE slug = 'pulso-motivacional-pt'
),
serie AS (
    SELECT id
    FROM pulso_core.series
    WHERE slug = 'historias-que-viram-chave'
)
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        status,
        prioridade,
        metadata
    )
SELECT c.id,
    s.id,
    v.titulo,
    v.descricao,
    v.status,
    v.prioridade,
    v.metadata
FROM canal c,
    serie s
    CROSS JOIN (
        VALUES (
                'Faxineira aos 45, CEO aos 55',
                'Mulher limpava escritórios à noite. Aos 45, decidiu estudar. 10 anos depois, fundou empresa de limpeza com 200 funcionários.',
                'APROVADA'::pulso_status_ideia,
                10,
                jsonb_build_object(
                    'duracao_estimada',
                    '45s',
                    'tipo',
                    'virada_tardia'
                )
            ),
            (
                'Do Vício à Maratona',
                'Fumante, sedentário, deprimido. Aos 38, começou a caminhar 15min/dia. Hoje, 42 anos, já correu 5 maratonas.',
                'RASCUNHO'::pulso_status_ideia,
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '40s',
                    'tipo',
                    'transformacao_gradual'
                )
            ),
            (
                'A Decisão do Jantar',
                'Homem perdeu emprego aos 50. No jantar, esposa disse: "Recomeça ou aceita mediocridade?" Ele recomeçou.',
                'APROVADA'::pulso_status_ideia,
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '38s',
                    'tipo',
                    'momento_decisivo'
                )
            ),
            (
                'Professor que Voltou a Estudar aos 60',
                'Lecionava há 35 anos. Aos 60, voltou pra faculdade. "Nunca é tarde pra aprender o que você sempre quis."',
                'RASCUNHO'::pulso_status_ideia,
                7,
                jsonb_build_object(
                    'duracao_estimada',
                    '35s',
                    'tipo',
                    'aprendizado_tardio'
                )
            ),
            (
                'Do Falido ao Fundador',
                'Faliu aos 42. Perdeu tudo. Aos 45, criou startup na garagem. Hoje vale R$ 50 milhões.',
                'APROVADA'::pulso_status_ideia,
                10,
                jsonb_build_object(
                    'duracao_estimada',
                    '42s',
                    'tipo',
                    'recomeço_financeiro'
                )
            )
    ) AS v(titulo, descricao, status, prioridade, metadata)
WHERE NOT EXISTS (
        SELECT 1
        FROM pulso_content.ideias i
        WHERE i.titulo = v.titulo
            AND i.canal_id = c.id
    );
-- =========================================================
-- 5) IDEIAS - PULSO CONTOS & MICROFICÇÃO
-- =========================================================
-- Série: Storytelling Curto
WITH canal AS (
    SELECT id
    FROM pulso_core.canais
    WHERE slug = 'pulso-contos-microficcao-pt'
),
serie AS (
    SELECT id
    FROM pulso_core.series
    WHERE slug = 'storytelling-curto'
)
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        status,
        prioridade,
        metadata
    )
SELECT c.id,
    s.id,
    v.titulo,
    v.descricao,
    'RASCUNHO'::pulso_status_ideia,
    v.prioridade,
    v.metadata
FROM canal c,
    serie s
    CROSS JOIN (
        VALUES (
                'O Último Passageiro',
                'Motorista de ônibus sempre vê o mesmo passageiro às 3h. Um dia, ele não aparece. No jornal: morreu há 10 anos.',
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '55s',
                    'genero',
                    'horror_psicologico'
                )
            ),
            (
                'A Carta do Futuro',
                'Homem recebe carta dele mesmo, 10 anos no futuro. Diz: "Não case com ela." Ele casa. Tudo dá errado.',
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '50s',
                    'genero',
                    'ficcao_temporal'
                )
            ),
            (
                'O Espelho Vazio',
                'Garota percebe que espelhos não refletem mais. Só ela vê. Descobre: está em coma há 3 anos.',
                10,
                jsonb_build_object(
                    'duracao_estimada',
                    '48s',
                    'genero',
                    'suspense_psicologico'
                )
            ),
            (
                'A Última Ligação',
                'Pai liga pro filho todo dia. Um dia, filho não atende. Descobre: pai morreu há 1 ano. Quem ligava?',
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '45s',
                    'genero',
                    'horror_sobrenatural'
                )
            ),
            (
                'O Relógio Parado',
                'Homem compra relógio antigo. Descobre: marca hora exata de mortes futuras. Ele vê o próprio nome.',
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '52s',
                    'genero',
                    'horror_destino'
                )
            )
    ) AS v(titulo, descricao, prioridade, metadata)
WHERE NOT EXISTS (
        SELECT 1
        FROM pulso_content.ideias i
        WHERE i.titulo = v.titulo
            AND i.canal_id = c.id
    );
-- Série: Microcontos Dark
WITH canal AS (
    SELECT id
    FROM pulso_core.canais
    WHERE slug = 'pulso-contos-microficcao-pt'
),
serie AS (
    SELECT id
    FROM pulso_core.series
    WHERE slug = 'microcontos-dark'
)
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        status,
        prioridade,
        metadata
    )
SELECT c.id,
    s.id,
    v.titulo,
    v.descricao,
    v.status,
    v.prioridade,
    v.metadata
FROM canal c,
    serie s
    CROSS JOIN (
        VALUES (
                'A Última Palavra',
                'Conto: "Disse ''te amo'' pela última vez. Ela sorriu. Não sabia que eu estava falando comigo mesmo."',
                'APROVADA'::pulso_status_ideia,
                7,
                jsonb_build_object(
                    'duracao_estimada',
                    '20s',
                    'formato',
                    'microconto_1paragrafo'
                )
            ),
            (
                'O Presente',
                '"Você tem 24 horas pra viver." "Mentira!" Mas o relógio começou a contar. E você acreditou.',
                'RASCUNHO'::pulso_status_ideia,
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '18s',
                    'formato',
                    'microconto_twist'
                )
            ),
            (
                'A Escolha',
                '"Salve sua mãe ou seu filho?" Ele congelou. Quando decidiu, já era tarde demais. Perdeu os dois.',
                'APROVADA'::pulso_status_ideia,
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '22s',
                    'formato',
                    'dilema_moral'
                )
            ),
            (
                'O Silêncio',
                'Mundo ficou em silêncio total. Ninguém fala. Ninguém ouve. Você percebe: sempre foi surdo.',
                'RASCUNHO'::pulso_status_ideia,
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '25s',
                    'formato',
                    'revelacao_final'
                )
            ),
            (
                'A Memória',
                'Lembranças falsas implantadas diariamente. Você descobre. Mas... como sabe que essa memória é real?',
                'APROVADA'::pulso_status_ideia,
                10,
                jsonb_build_object(
                    'duracao_estimada',
                    '28s',
                    'formato',
                    'paradoxo_mental'
                )
            )
    ) AS v(titulo, descricao, status, prioridade, metadata)
WHERE NOT EXISTS (
        SELECT 1
        FROM pulso_content.ideias i
        WHERE i.titulo = v.titulo
            AND i.canal_id = c.id
    );
-- =========================================================
-- 6) IDEIAS - PULSO ESTUDOS & PRODUTIVIDADE
-- =========================================================
-- Série: Estudo & Foco
WITH canal AS (
    SELECT id
    FROM pulso_core.canais
    WHERE slug = 'pulso-estudos-produtividade-pt'
),
serie AS (
    SELECT id
    FROM pulso_core.series
    WHERE slug = 'estudo-foco'
)
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        status,
        prioridade,
        metadata
    )
SELECT c.id,
    s.id,
    v.titulo,
    v.descricao,
    'RASCUNHO'::pulso_status_ideia,
    v.prioridade,
    v.metadata
FROM canal c,
    serie s
    CROSS JOIN (
        VALUES (
                'Técnica Pomodoro Real',
                '25min foco, 5min pausa. Mas de verdade: celular em outro cômodo, apps bloqueados, sem "só uma olhadinha".',
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '35s',
                    'tipo',
                    'tecnica_pratica'
                )
            ),
            (
                'O Mito do Multitasking',
                'Seu cérebro não faz multitarefa. Ele alterna rápido. Resultado: tudo pela metade, nada bem feito.',
                7,
                jsonb_build_object(
                    'duracao_estimada',
                    '28s',
                    'tipo',
                    'neurociencia_estudo'
                )
            ),
            (
                'Revisar É Mais Importante Que Estudar',
                'Ler 1x não adianta. Revisar 3x em intervalos crescentes = memória de longo prazo. Sistema Leitner.',
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '38s',
                    'tipo',
                    'metodo_revisao'
                )
            ),
            (
                'Estude Antes de Dormir',
                'Cérebro consolida memória no sono. Revisar conteúdo antes de dormir = fixação 40% maior.',
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '30s',
                    'tipo',
                    'ciencia_sono'
                )
            ),
            (
                'A Regra dos 2 Minutos',
                'Se leva menos de 2min, faça agora. Acumular micro-tarefas gera procrastinação gigante.',
                7,
                jsonb_build_object(
                    'duracao_estimada',
                    '25s',
                    'tipo',
                    'produtividade_micro'
                )
            )
    ) AS v(titulo, descricao, prioridade, metadata)
WHERE NOT EXISTS (
        SELECT 1
        FROM pulso_content.ideias i
        WHERE i.titulo = v.titulo
            AND i.canal_id = c.id
    );
-- Série: Organização & Rotina
WITH canal AS (
    SELECT id
    FROM pulso_core.canais
    WHERE slug = 'pulso-estudos-produtividade-pt'
),
serie AS (
    SELECT id
    FROM pulso_core.series
    WHERE slug = 'organizacao-rotina'
)
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        status,
        prioridade,
        metadata
    )
SELECT c.id,
    s.id,
    v.titulo,
    v.descricao,
    v.status,
    v.prioridade,
    v.metadata
FROM canal c,
    serie s
    CROSS JOIN (
        VALUES (
                'Rotina Matinal de 15 Minutos',
                'Sem romantização: acordar, água, 10min exercício, 5min planejamento do dia. Pronto.',
                'APROVADA'::pulso_status_ideia,
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '32s',
                    'tipo',
                    'rotina_realista'
                )
            ),
            (
                'To-Do List Que Funciona',
                'Máximo 3 tarefas importantes/dia. Resto é "se sobrar tempo". Foco > quantidade.',
                'RASCUNHO'::pulso_status_ideia,
                7,
                jsonb_build_object(
                    'duracao_estimada',
                    '28s',
                    'tipo',
                    'organizacao_pratica'
                )
            ),
            (
                'O Mito do Horário de Estudos',
                'Não importa acordar 5h se você não rende. Descubra SEU melhor horário. Teste 1 semana cada.',
                'APROVADA'::pulso_status_ideia,
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '35s',
                    'tipo',
                    'autoconhecimento'
                )
            ),
            (
                'Ambiente de Estudo Minimalista',
                'Mesa vazia, só o necessário. Cada objeto distrai 3-7 segundos. Em 1h, perdeu 20min olhando coisas.',
                'RASCUNHO'::pulso_status_ideia,
                7,
                jsonb_build_object(
                    'duracao_estimada',
                    '30s',
                    'tipo',
                    'ambiente_foco'
                )
            ),
            (
                'Descanso Não É Culpa',
                'Produtividade tóxica te faz sentir culpa por descansar. Descanso é parte do processo. Não é preguiça.',
                'APROVADA'::pulso_status_ideia,
                10,
                jsonb_build_object(
                    'duracao_estimada',
                    '33s',
                    'tipo',
                    'saude_mental_produtividade'
                )
            )
    ) AS v(titulo, descricao, status, prioridade, metadata)
WHERE NOT EXISTS (
        SELECT 1
        FROM pulso_content.ideias i
        WHERE i.titulo = v.titulo
            AND i.canal_id = c.id
    );
-- =========================================================
-- 7) IDEIAS - PULSO GAMES NOSTALGIA
-- =========================================================
-- Série: Clássicos & Memórias
WITH canal AS (
    SELECT id
    FROM pulso_core.canais
    WHERE slug = 'pulso-games-nostalgia-pt'
),
serie AS (
    SELECT id
    FROM pulso_core.series
    WHERE slug = 'classicos-memorias'
)
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        status,
        prioridade,
        metadata
    )
SELECT c.id,
    s.id,
    v.titulo,
    v.descricao,
    v.status,
    v.prioridade,
    v.metadata
FROM canal c,
    serie s
    CROSS JOIN (
        VALUES (
                'O Segredo do Aeris em FF7',
                'Morte de Aeris chocou geração. Mas teoria: código oculto poderia ressuscitá-la. Nunca confirmado.',
                'APROVADA'::pulso_status_ideia,
                10,
                jsonb_build_object(
                    'duracao_estimada',
                    '42s',
                    'console',
                    'PlayStation'
                )
            ),
            (
                'Lavender Town Syndrome',
                'Pokémon Red/Blue: música da cidade causou suicídios? Lenda urbana ou frequência real?',
                'RASCUNHO'::pulso_status_ideia,
                9,
                jsonb_build_object('duracao_estimada', '45s', 'console', 'Game Boy')
            ),
            (
                'O Easter Egg Impossível do Atari',
                'Aventura (1979): primeiro easter egg da história. Sala secreta com nome do programador.',
                'APROVADA'::pulso_status_ideia,
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '38s',
                    'console',
                    'Atari 2600'
                )
            ),
            (
                'GTA San Andreas: Mito ou Verdade?',
                'Bigfoot, UFOs, fantasmas. Rockstar confirmou anos depois: eram easter eggs reais.',
                'RASCUNHO'::pulso_status_ideia,
                10,
                jsonb_build_object(
                    'duracao_estimada',
                    '40s',
                    'console',
                    'PlayStation 2'
                )
            ),
            (
                'A Maldição do Polybius',
                'Arcade de 1981 que causava amnésia e pesadelos. Governo confiscou. Jogo nunca mais visto.',
                'APROVADA'::pulso_status_ideia,
                9,
                jsonb_build_object('duracao_estimada', '48s', 'console', 'Arcade')
            )
    ) AS v(titulo, descricao, status, prioridade, metadata)
WHERE NOT EXISTS (
        SELECT 1
        FROM pulso_content.ideias i
        WHERE i.titulo = v.titulo
            AND i.canal_id = c.id
    );
-- =========================================================
-- 8) IDEIAS - PULSO CASOS REAIS & BIZARROS
-- =========================================================
-- Série: Casos Reais & Bizarros
WITH canal AS (
    SELECT id
    FROM pulso_core.canais
    WHERE slug = 'pulso-casos-reais-bizarros-pt'
),
serie AS (
    SELECT id
    FROM pulso_core.series
    WHERE slug = 'casos-reais-bizarros'
)
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        status,
        prioridade,
        metadata
    )
SELECT c.id,
    s.id,
    v.titulo,
    v.descricao,
    v.status,
    v.prioridade,
    v.metadata
FROM canal c,
    serie s
    CROSS JOIN (
        VALUES (
                'O Homem Que Vendeu a Torre Eiffel Duas Vezes',
                'Victor Lustig convenceu empresários a comprar Torre Eiffel como "sucata". Fugiu antes da polícia.',
                'APROVADA'::pulso_status_ideia,
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '52s',
                    'categoria',
                    'fraude_historica'
                )
            ),
            (
                'A Mulher Que Nunca Dormiu 40 Anos',
                'Thái Ngọc, vietnamita, insônia total desde 1973. Médicos confirmam: impossível, mas real.',
                'RASCUNHO'::pulso_status_ideia,
                10,
                jsonb_build_object(
                    'duracao_estimada',
                    '45s',
                    'categoria',
                    'fenomeno_medico'
                )
            ),
            (
                'O Bebê Que Nasceu Grávido',
                'Fetus in fetu: bebê nasceu com gêmeo dentro da barriga. Cirurgia removeu "irmão".',
                'APROVADA'::pulso_status_ideia,
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '48s',
                    'categoria',
                    'medicina_bizarra'
                )
            ),
            (
                'A Cidade Fantasma de 30 Mil Pessoas',
                'Centralia, EUA: incêndio subterrâneo há 60 anos. Cidade evacuada, fogo queima até hoje.',
                'RASCUNHO'::pulso_status_ideia,
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '50s',
                    'categoria',
                    'desastre_permanente'
                )
            ),
            (
                'O Homem Que Sobreviveu 2 Bombas Atômicas',
                'Tsutomu Yamaguchi: em Hiroshima e Nagasaki. Sobreviveu às duas. Viveu até 93 anos.',
                'APROVADA'::pulso_status_ideia,
                10,
                jsonb_build_object(
                    'duracao_estimada',
                    '55s',
                    'categoria',
                    'sobrevivencia_impossivel'
                )
            )
    ) AS v(titulo, descricao, status, prioridade, metadata)
WHERE NOT EXISTS (
        SELECT 1
        FROM pulso_content.ideias i
        WHERE i.titulo = v.titulo
            AND i.canal_id = c.id
    );
-- Série: True Crime Dark
WITH canal AS (
    SELECT id
    FROM pulso_core.canais
    WHERE slug = 'pulso-casos-reais-bizarros-pt'
),
serie AS (
    SELECT id
    FROM pulso_core.series
    WHERE slug = 'true-crime-dark'
)
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        status,
        prioridade,
        metadata
    )
SELECT c.id,
    s.id,
    v.titulo,
    v.descricao,
    'RASCUNHO'::pulso_status_ideia,
    v.prioridade,
    v.metadata
FROM canal c,
    serie s
    CROSS JOIN (
        VALUES (
                'O Caso do Zodíaco: Decodificado 51 Anos Depois',
                'Código Z340 resolvido em 2020. Mensagem perturbadora confirma: assassino zombava da polícia.',
                10,
                jsonb_build_object(
                    'duracao_estimada',
                    '58s',
                    'responsabilidade',
                    'sem_glamurizar'
                )
            ),
            (
                'A Garota na Caixa',
                'Colleen Stan: sequestrada, mantida em caixa sob cama por 7 anos. Como sobreviveu?',
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '60s',
                    'responsabilidade',
                    'foco_sobrevivente'
                )
            ),
            (
                'O Assassino Gentil do Japão',
                'Envenenava pacientes, mas era amável. Descoberto após 60 mortes. Ninguém suspeitava.',
                8,
                jsonb_build_object(
                    'duracao_estimada',
                    '52s',
                    'responsabilidade',
                    'analise_psicologica'
                )
            ),
            (
                'O Caso Turpin: Casa dos Horrores',
                '13 filhos acorrentados por décadas. Pais tinham Facebook normal. Vizinhos não sabiam de nada.',
                10,
                jsonb_build_object(
                    'duracao_estimada',
                    '55s',
                    'responsabilidade',
                    'sem_detalhes_graficos'
                )
            ),
            (
                'Golden State Killer: DNA Resolveu Após 40 Anos',
                'Joseph DeAngelo: 50+ crimes. Preso aos 72 anos por DNA genealógico. Caso pioneiro.',
                9,
                jsonb_build_object(
                    'duracao_estimada',
                    '58s',
                    'responsabilidade',
                    'foco_justica'
                )
            )
    ) AS v(titulo, descricao, prioridade, metadata)
WHERE NOT EXISTS (
        SELECT 1
        FROM pulso_content.ideias i
        WHERE i.titulo = v.titulo
            AND i.canal_id = c.id
    );
-- =========================================================
-- VERIFICAÇÃO FINAL
-- =========================================================
SELECT 'CANAIS' as tipo,
    COUNT(*) as total
FROM pulso_core.canais
WHERE status = 'ATIVO'
UNION ALL
SELECT 'SÉRIES' as tipo,
    COUNT(*) as total
FROM pulso_core.series
WHERE status = 'ATIVO'
UNION ALL
SELECT 'IDEIAS - ' || status as tipo,
    COUNT(*) as total
FROM pulso_content.ideias
GROUP BY status
UNION ALL
SELECT 'IDEIAS TOTAL' as tipo,
    COUNT(*) as total
FROM pulso_content.ideias;