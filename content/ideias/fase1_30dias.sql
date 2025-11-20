-- =====================================================================
-- PULSO - 30 IDEIAS INICIAIS (Baseado no Calendário Editorial)
-- Fase 1: Canal PULSO Curiosidades PT
-- =====================================================================
-- Executar no Supabase SQL Editor após criar canais e séries
-- =====================================================================
-- Dia 1: Curiosidade - Psicologia: efeito placebo
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'curiosidades-dark'
        ),
        'O Poder do Efeito Placebo',
        'Você sabia que seu cérebro pode curar dor sem remédio? O efeito placebo faz 30% das pessoas melhorarem sem medicamento real. O mais surpreendente: funciona até quando a pessoa SABE que é placebo! Estudos mostram que só a expectativa de melhora já ativa áreas do cérebro ligadas ao alívio da dor.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['psicologia', 'cérebro', 'ciência', 'placebo'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'curiosidade_rapida',
            'dia_calendario',
            1,
            'duracao_alvo',
            25,
            'gancho_sugerido',
            'Você sabia que seu cérebro pode curar dor sem remédio?'
        )
    );
-- Dia 2: Curiosidade - História: o soldado que "sumiu" da guerra
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'misterios-urbanos'
        ),
        'O Soldado que Desapareceu da Guerra',
        'Em 1945, durante a Segunda Guerra, um soldado americano desapareceu misteriosamente do campo de batalha. Nenhum corpo foi encontrado, nenhuma testemunha viu nada. 60 anos depois, cartas dele começaram a chegar na casa da família. As cartas descreviam lugares que só existiam décadas após a guerra. Até hoje ninguém sabe explicar.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['história', 'mistério', 'guerra', 'desaparecimento'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'misterio',
            'dia_calendario',
            2,
            'duracao_alvo',
            60,
            'gancho_sugerido',
            'Um soldado desapareceu em 1945. 60 anos depois, cartas dele começaram a chegar...'
        )
    );
-- Dia 3: Psicologia - 3 sinais de esgotamento mental
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'curiosidades-dark'
        ),
        '3 Sinais de Esgotamento Mental',
        'Você pode estar mais esgotado do que imagina. Sinal 1: Você esquece coisas simples (nome de pessoas, onde deixou as chaves). Sinal 2: Pequenas coisas te irritam demais. Sinal 3: Você não sente prazer em coisas que antes amava. Se identificou com 2 ou mais, seu cérebro está pedindo descanso.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['psicologia', 'saúde mental', 'esgotamento', 'burnout'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'psicologia',
            'dia_calendario',
            3,
            'duracao_alvo',
            35,
            'gancho_sugerido',
            '3 sinais de que você é mais esgotado do que imagina'
        )
    );
-- Dia 4: Storytelling - O cara que ganhou tudo e perdeu a si mesmo
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'curiosidades-dark'
        ),
        'O Homem que Ganhou Tudo e Perdeu a Si Mesmo',
        'Um executivo passou 20 anos subindo na carreira. Ganhou dinheiro, poder, reconhecimento. Mas perdeu os amigos, o casamento, a saúde. Aos 50 anos, sozinho numa mansão vazia, percebeu: tinha conquistado tudo, menos a vida que queria viver. Decidiu recomeçar do zero.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['reflexão', 'vida', 'carreira', 'propósito'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'storytelling',
            'dia_calendario',
            4,
            'duracao_alvo',
            50,
            'gancho_sugerido',
            'Ele ganhou tudo o que sempre quis. E perdeu o que realmente importava.'
        )
    );
-- Dia 5: Mistério - O farol onde os guardas desapareceram
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'misterios-urbanos'
        ),
        'O Farol de Flannan Isles - 3 Homens Sumiram',
        'Escócia, 1900. Três guardas de farol desapareceram sem deixar rastro. A mesa estava posta, o relógio parado às 8h45, mas nenhum sinal de luta. Só encontraram: um diário com anotações estranhas sobre "tempestades que não existiram" e uma cadeira derrubada. Até hoje é um dos maiores mistérios marítimos.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['mistério', 'desaparecimento', 'história', 'mar'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'misterio',
            'dia_calendario',
            5,
            'duracao_alvo',
            60,
            'gancho_sugerido',
            'Três homens desapareceram de um farol. Nunca foram encontrados.'
        )
    );
-- Dia 6: Motivacional - "Ninguém vai te salvar"
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'curiosidades-dark'
        ),
        'Ninguém Vai Te Salvar',
        'Ninguém vai te salvar. Nem seus pais, nem seus amigos, nem aquele amor que você espera. E isso não é triste. Isso é libertador. Porque quando você para de esperar salvação, você vira seu próprio herói. Você é o projeto mais importante da sua vida. Aja como tal.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['motivação', 'reflexão', 'responsabilidade', 'vida'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'motivacional',
            'dia_calendario',
            6,
            'duracao_alvo',
            30,
            'gancho_sugerido',
            'Ninguém vai te salvar. Mas isso é libertador.'
        )
    );
-- Dia 7: Curiosidade - O cérebro e as falsas memórias
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'ciencia-estranha'
        ),
        'Seu Cérebro Inventa Memórias Falsas',
        'Você se lembra do seu primeiro dia de escola? Provavelmente sim. Mas há 50% de chance de que essa memória seja FALSA. Estudos mostram que nosso cérebro inventa detalhes para preencher lacunas. Você pode ter certeza absoluta de uma memória que nunca aconteceu. Assustador, né?',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['cérebro', 'memória', 'psicologia', 'ciência'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'curiosidade_rapida',
            'dia_calendario',
            7,
            'duracao_alvo',
            25,
            'gancho_sugerido',
            'Você tem certeza das suas memórias? Seu cérebro não.'
        )
    );
-- Dia 8: Psicologia - Por que você procrastina?
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'curiosidades-dark'
        ),
        'A Verdade Sobre Procrastinação',
        'Você não procrastina porque é preguiçoso. Procrastinação é ansiedade disfarçada. Seu cérebro evita tarefas que causam estresse emocional. Medo de falhar, medo de não ser perfeito, medo de julgamento. Quando você entende isso, para de se culpar e começa a resolver o problema real: a ansiedade.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['psicologia', 'procrastinação', 'ansiedade', 'produtividade'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'psicologia',
            'dia_calendario',
            8,
            'duracao_alvo',
            40,
            'gancho_sugerido',
            'Você não é preguiçoso. Você está ansioso.'
        )
    );
-- Dia 9: Storytelling - A menina que só via o lado ruim
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'curiosidades-dark'
        ),
        'A Menina Pessimista',
        'Havia uma menina que só via o lado ruim de tudo. Ganhou um cachorro: "Vai dar trabalho". Fez novos amigos: "Vão me decepcionar". Passou numa prova: "Foi sorte". Um dia, perdeu tudo por esperar sempre o pior. Quando tentou recuperar, entendeu: sua profecia se autorrealizou. Ela criou o mundo que temia.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['reflexão', 'pessimismo', 'mentalidade', 'história'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'storytelling',
            'dia_calendario',
            9,
            'duracao_alvo',
            50,
            'gancho_sugerido',
            'Ela só via o lado ruim. Até perder tudo.'
        )
    );
-- Dia 10: Mistério - Avião que sumiu por 37 anos (lenda urbana)
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'misterios-urbanos'
        ),
        'O Avião Fantasma de Santiago',
        'Lenda urbana: em 1989, um avião pousou em Porto Alegre. Era um voo de 1954 que tinha desaparecido 37 anos antes. Todos os passageiros estavam mortos, mas os relógios marcavam apenas 3 horas de voo. Mentira ou verdade? Provavelmente mentira. Mas e se não for?',
        'MANUAL',
        2,
        'RASCUNHO',
        ARRAY ['mistério', 'lenda urbana', 'avião', 'tempo'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'misterio',
            'dia_calendario',
            10,
            'duracao_alvo',
            55,
            'gancho_sugerido',
            'Um avião desapareceu em 1954. Reapareceu 37 anos depois.',
            'nota',
            'Lenda urbana - mencionar que provavelmente é falso'
        )
    );
-- Dia 11: Motivacional - "Não é tarde pra recomeçar"
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'curiosidades-dark'
        ),
        'Nunca É Tarde Para Recomeçar',
        'Colonel Sanders criou o KFC aos 65 anos. Vera Wang entrou na moda aos 40. J.K. Rowling publicou Harry Potter aos 32, depois de anos sendo rejeitada. A ideia de que "passou da hora" é uma mentira que você conta pra si mesmo. Enquanto você respira, pode recomeçar.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['motivação', 'recomeço', 'idade', 'sucesso'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'motivacional',
            'dia_calendario',
            11,
            'duracao_alvo',
            35,
            'gancho_sugerido',
            'Você acha que é tarde? Essas pessoas discordam.'
        )
    );
-- Dia 12: Curiosidade - Música favorita e o cérebro
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'ciencia-estranha'
        ),
        'O Que Acontece Quando Você Ouve Sua Música Favorita',
        'Quando você ouve sua música favorita, seu cérebro libera dopamina - a mesma substância liberada ao comer chocolate ou se apaixonar. Estudos mostram que 15 segundos antes do seu trecho favorito, seu cérebro já começa a liberar a dopamina, antecipando o prazer. Música é droga sem efeitos colaterais.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['música', 'cérebro', 'dopamina', 'ciência'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'curiosidade_rapida',
            'dia_calendario',
            12,
            'duracao_alvo',
            30,
            'gancho_sugerido',
            'Sua música favorita é literalmente uma droga.'
        )
    );
-- Dia 13: Psicologia - Ansiedade social explicada simples
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'curiosidades-dark'
        ),
        'Ansiedade Social em 3 Pontos',
        'Ansiedade social não é timidez. É seu cérebro convencido de que todos estão te julgando. Ponto 1: Você evita situações sociais não por querer, mas por medo. Ponto 2: Você repete interações na sua cabeça por dias. Ponto 3: Você sente sintomas físicos: tremor, suor, coração acelerado. Se identificou? Você não está sozinho. 15% da população tem isso.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['psicologia', 'ansiedade social', 'saúde mental', 'fobia'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'psicologia',
            'dia_calendario',
            13,
            'duracao_alvo',
            40,
            'gancho_sugerido',
            'Ansiedade social explicada em 3 pontos'
        )
    );
-- Dia 14: Storytelling - O homem que só reclamava
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'curiosidades-dark'
        ),
        'O Homem que Só Reclamava',
        'Havia um homem que reclamava de tudo. O café estava frio. O chefe era injusto. O tempo era ruim. Os amigos se afastaram. A esposa cansou. Ficou sozinho. Um dia, percebeu: ele não tinha má sorte. Ele tinha maus hábitos. Mudou. Parou de reclamar. Começou a agradecer. A vida mudou junto.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['reflexão', 'gratidão', 'reclamação', 'mentalidade'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'storytelling',
            'dia_calendario',
            14,
            'duracao_alvo',
            50,
            'gancho_sugerido',
            'Ele reclamava de tudo. Até ficar sozinho.'
        )
    );
-- Dia 15: Mistério - Caso real de déjà vu extremo
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'misterios-urbanos'
        ),
        'O Homem Preso num Déjà Vu Infinito',
        'Em 2010, um britânico começou a sentir déjà vu CONSTANTE. Tudo parecia repetição. Ele parou de assistir TV, ler notícias, sair de casa. Vivia em pânico: "Já vivi isso antes". Médicos descobriram: ansiedade extrema pode causar falso déjà vu crônico. Ele tratou a ansiedade e melhorou. Mas imagine viver assim...',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['mistério', 'déjà vu', 'psicologia', 'caso real'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'misterio',
            'dia_calendario',
            15,
            'duracao_alvo',
            60,
            'gancho_sugerido',
            'Imagine sentir déjà vu em TUDO. 24 horas por dia.'
        )
    );
-- Dia 16: Motivacional - "Você não precisa ser perfeito"
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'curiosidades-dark'
        ),
        'Você Não Precisa Ser Perfeito',
        'Você não precisa ser perfeito. Você precisa ser consistente. Escrever mal é melhor que não escrever. Treinar mal é melhor que não treinar. Tentar e errar é melhor que não tentar. Perfeição é paralisante. Progresso é libertador. Escolha o progresso.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['motivação', 'perfeição', 'progresso', 'ação'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'motivacional',
            'dia_calendario',
            16,
            'duracao_alvo',
            25,
            'gancho_sugerido',
            'Perfeição é paralisante. Progresso é libertador.'
        )
    );
-- Dia 17: Curiosidade - Por que amamos plot twists?
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'ciencia-estranha'
        ),
        'Por Que Amamos Plot Twists',
        'Seu cérebro ADORA ser surpreendido. Quando você assiste um plot twist bem feito, a mesma área do cérebro ativada pela comida saborosa se acende. É prazer puro. Estudos mostram: quanto mais você acha que sabe o final, mais prazeroso é o twist. Nosso cérebro é viciado em ter suas expectativas quebradas.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['psicologia', 'cérebro', 'entretenimento', 'dopamina'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'curiosidade_rapida',
            'dia_calendario',
            17,
            'duracao_alvo',
            30,
            'gancho_sugerido',
            'Plot twists ativam a mesma área do cérebro que comida gostosa.'
        )
    );
-- Dia 18: Psicologia - Efeito manada
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'curiosidades-dark'
        ),
        'O Efeito Manada: Por Que Você Segue a Multidão',
        'Experimento clássico: colocaram uma pessoa numa sala com atores. Todos deram respostas obviamente erradas. 75% das pessoas seguiram a maioria, mesmo sabendo que estava errada. Efeito manada: seu cérebro prefere estar errado com todos do que certo sozinho. Você faz isso sem perceber. Todo dia.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['psicologia', 'comportamento', 'sociedade', 'influência'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'psicologia',
            'dia_calendario',
            18,
            'duracao_alvo',
            40,
            'gancho_sugerido',
            '75% das pessoas preferem estar erradas com todos.'
        )
    );
-- Dia 19: Storytelling - A escolha que mudou tudo
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'curiosidades-dark'
        ),
        'A Escolha de 5 Segundos',
        'Dois amigos. Mesma empresa demitiu os dois. Um decidiu: "Vou reclamar e procurar emprego igual". O outro: "Vou criar algo meu". 5 anos depois: o primeiro ainda reclama da demissão. O segundo construiu uma empresa. Mesma situação. Escolhas diferentes. Vidas diferentes. Sua vida é a soma das suas escolhas nos momentos difíceis.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['reflexão', 'escolhas', 'mindset', 'sucesso'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'storytelling',
            'dia_calendario',
            19,
            'duracao_alvo',
            50,
            'gancho_sugerido',
            'Dois amigos. Mesma crise. Destinos opostos.'
        )
    );
-- Dia 20: Mistério - Cidade fantasma moderna
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'misterios-urbanos'
        ),
        'Pripyat: A Cidade Congelada no Tempo',
        'Ucrânia, 1986. Pripyat era uma cidade próspera de 50 mil habitantes. Em 24 horas, virou cidade fantasma. Chernobyl explodiu. Evacuação total. Hoje: pratos na mesa, brinquedos no chão, relógios parados. Uma cidade inteira abandonada em segundos. Você pode visitá-la, mas não pode ficar mais de algumas horas. A radiação ainda mata.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['história', 'chernobyl', 'cidade fantasma', 'tragédia'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'misterio',
            'dia_calendario',
            20,
            'duracao_alvo',
            60,
            'gancho_sugerido',
            'Uma cidade de 50 mil pessoas. Abandonada em 24 horas.'
        )
    );
-- Dia 21: Motivacional - "Talvez você só esteja cansado"
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'curiosidades-dark'
        ),
        'Talvez Você Só Esteja Cansado',
        'Antes de achar que você está deprimido, fracassado ou perdido, considere: talvez você só esteja CANSADO. Cansado de fingir. Cansado de não descansar. Cansado de viver no automático. Às vezes a solução não é trabalhar mais. É parar, respirar e dormir. Você não é fraco. Você é humano.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['motivação', 'descanso', 'saúde mental', 'autocuidado'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'motivacional',
            'dia_calendario',
            21,
            'duracao_alvo',
            30,
            'gancho_sugerido',
            'Talvez você não esteja deprimido. Só cansado.'
        )
    );
-- Dia 22: Curiosidade - Memória e cheiro (olfato)
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'ciencia-estranha'
        ),
        'Por Que Cheiros Trazem Memórias Tão Fortes',
        'Você sente um perfume e BOOM - memória da infância. Isso acontece porque o olfato é o único sentido conectado DIRETAMENTE ao centro de memórias do cérebro. Visão e audição passam por filtros. Cheiro vai direto. Por isso um perfume pode te fazer chorar instantaneamente. É ciência, não nostalgia.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['cérebro', 'olfato', 'memória', 'ciência'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'curiosidade_rapida',
            'dia_calendario',
            22,
            'duracao_alvo',
            30,
            'gancho_sugerido',
            'Por que um perfume te faz chorar? Ciência.'
        )
    );
-- Dia 23: Psicologia - Por que repetimos padrões ruins?
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'curiosidades-dark'
        ),
        'Por Que Você Repete os Mesmos Erros',
        'Seu cérebro ADORA padrões. Mesmo os ruins. Por quê? Porque padrões são previsíveis. E previsível é seguro. Melhor um relacionamento ruim conhecido do que tentar algo novo e incerto. Seu cérebro prefere a dor familiar à felicidade desconhecida. Quando entende isso, pode começar a quebrar o ciclo.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['psicologia', 'padrões', 'comportamento', 'mudança'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'psicologia',
            'dia_calendario',
            23,
            'duracao_alvo',
            40,
            'gancho_sugerido',
            'Seu cérebro prefere dor familiar a felicidade nova.'
        )
    );
-- Dia 24: Storytelling - O velho relógio quebrado
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'curiosidades-dark'
        ),
        'O Relógio Que Estava Certo',
        'Um homem tinha um relógio quebrado. Mostrava sempre 3h15. Todos diziam: "Conserta isso". Ele respondia: "Pelo menos duas vezes por dia, está certíssimo". Anos depois, alguém perguntou: por que não conserta? Ele: "Porque me lembra que até coisas quebradas acertam às vezes. E coisas perfeitas erram sempre. A vida é assim."',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['reflexão', 'filosofia', 'metáfora', 'imperfeição'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'storytelling',
            'dia_calendario',
            24,
            'duracao_alvo',
            45,
            'gancho_sugerido',
            'Um relógio quebrado. Uma lição profunda.'
        )
    );
-- Dia 25: Mistério - Sinais de rádio misteriosos
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'misterios-urbanos'
        ),
        'O Sinal WOW: Mensagem Alienígena?',
        'Em 1977, um radiotelescópio captou um sinal tão forte e único que o cientista escreveu "WOW!" na impressão. Durou 72 segundos. Nunca se repetiu. Vinha de fora do sistema solar. Até hoje ninguém sabe o que foi. Extraterrestres? Fenômeno natural? Erro? O Sinal WOW continua sem explicação.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['mistério', 'espaço', 'alienígenas', 'ciência'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'misterio',
            'dia_calendario',
            25,
            'duracao_alvo',
            60,
            'gancho_sugerido',
            'Um sinal do espaço. 72 segundos. Nunca mais se repetiu.'
        )
    );
-- Dia 26: Motivacional - "Seu futuro eu está te observando"
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'curiosidades-dark'
        ),
        'Seu Futuro Eu Está Te Observando',
        'Cada escolha que você faz hoje, seu eu do futuro vai viver. Vai pular o treino? Seu futuro eu vai sentir. Vai comer mal? Seu futuro eu vai pagar. Vai adiar seus sonhos? Seu futuro eu vai lamentar. Mas também: vai se esforçar hoje? Seu futuro eu vai agradecer. Pense: o que você quer que ele sinta?',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['motivação', 'futuro', 'escolhas', 'responsabilidade'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'motivacional',
            'dia_calendario',
            26,
            'duracao_alvo',
            35,
            'gancho_sugerido',
            'Seu eu do futuro está observando suas escolhas de hoje.'
        )
    );
-- Dia 27: Curiosidade - Por que o tempo parece passar mais rápido?
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'ciencia-estranha'
        ),
        'Por Que o Tempo Acelera Com a Idade',
        'Quando criança, um ano era ETERNIDADE. Aos 30, os anos voam. Por quê? Seu cérebro grava memórias baseadas em NOVIDADES. Criança: tudo é novo, muitas memórias. Adulto na rotina: pouquíssimas memórias novas. Solução? Viva experiências novas. Quanto mais você varia, mais lento o tempo parece passar. Literalmente.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['psicologia', 'tempo', 'memória', 'idade'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'curiosidade_rapida',
            'dia_calendario',
            27,
            'duracao_alvo',
            35,
            'gancho_sugerido',
            'O tempo está acelerando? Não. Sua vida que está repetitiva.'
        )
    );
-- Dia 28: Psicologia - Apego em relacionamentos
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'curiosidades-dark'
        ),
        'Os 3 Tipos de Apego nos Relacionamentos',
        'Apego Seguro: você confia, é independente, se relaciona bem. Apego Ansioso: você precisa DEMAIS de validação, tem medo de abandono. Apego Evitativo: você foge de intimidade, prefere distância. Qual é você? Seu tipo de apego define TODOS os seus relacionamentos. E pode ser mudado com terapia.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['psicologia', 'relacionamentos', 'apego', 'amor'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'psicologia',
            'dia_calendario',
            28,
            'duracao_alvo',
            45,
            'gancho_sugerido',
            '3 tipos de apego. Qual é o seu?'
        )
    );
-- Dia 29: Storytelling - O vizinho invisível
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'curiosidades-dark'
        ),
        'O Vizinho Que Ninguém Via',
        'Um prédio. 20 apartamentos. Um morador nunca falava com ninguém. Nunca. Anos assim. Um dia, ele morreu. Demoraram 3 semanas pra descobrir. Quando arrombaram o apartamento, encontraram: diário completo sobre cada vizinho. Ele sabia tudo sobre todos. Mas ninguém sabia nada sobre ele. Solidão não é estar sozinho. É ser invisível cercado de gente.',
        'MANUAL',
        1,
        'RASCUNHO',
        ARRAY ['reflexão', 'solidão', 'sociedade', 'conexão'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'storytelling',
            'dia_calendario',
            29,
            'duracao_alvo',
            55,
            'gancho_sugerido',
            'Ele conhecia todos. Mas ninguém o conhecia.'
        )
    );
-- Dia 30: Mistério - Objetos que aparecem do nada
INSERT INTO pulso_content.ideias (
        canal_id,
        serie_id,
        titulo,
        descricao,
        origem,
        prioridade,
        status,
        tags,
        linguagem,
        metadata
    )
VALUES (
        (
            SELECT id
            FROM pulso_core.canais
            WHERE slug = 'pulso-curiosidades-pt'
        ),
        (
            SELECT id
            FROM pulso_core.series
            WHERE slug = 'misterios-urbanos'
        ),
        'Apports: Objetos Que Aparecem do Nada',
        'Fenômeno documentado em sessões espíritas: objetos materializando do nada. Moedas antigas, flores, pedras. Fraude? Provavelmente. Mas há casos sem explicação lógica. Em 1928, um cientista filmou uma pedra se materializando no ar. O vídeo existe. Até hoje sem explicação aceita. Real? Montagem? Você decide.',
        'MANUAL',
        2,
        'RASCUNHO',
        ARRAY ['mistério', 'paranormal', 'apports', 'inexplicável'],
        'pt-BR',
        jsonb_build_object(
            'tipo_formato',
            'misterio',
            'dia_calendario',
            30,
            'duracao_alvo',
            60,
            'gancho_sugerido',
            'Objetos aparecendo do nada. Filmado. Sem explicação.',
            'nota',
            'Mencionar ceticismo'
        )
    );
-- =====================================================================
-- VERIFICAÇÃO: Conte quantas ideias foram inseridas
-- =====================================================================
-- Após executar, rodar:
-- SELECT COUNT(*) as total_ideias FROM pulso_content.ideias;
-- Deve retornar: 30
-- Ver distribuição por série:
-- SELECT 
--   s.nome as serie,
--   COUNT(i.id) as total_ideias
-- FROM pulso_content.ideias i
-- JOIN pulso_core.series s ON s.id = i.serie_id
-- GROUP BY s.nome;