-- =====================================================
-- PASSO 1: APROVAR ALGUMAS IDEIAS (se necessário)
-- =====================================================
-- Aprovar 30 ideias aleatórias que ainda estão em RASCUNHO
UPDATE pulso_content.ideias
SET status = 'APROVADA'
WHERE id IN (
        SELECT id
        FROM pulso_content.ideias
        WHERE status = 'RASCUNHO'
        ORDER BY RANDOM()
        LIMIT 30
    );
-- =====================================================
-- PASSO 2: POPULAR ROTEIROS (30 roteiros de exemplo)
-- =====================================================
INSERT INTO pulso_content.roteiros (
        ideia_id,
        titulo,
        conteudo_md,
        versao,
        status,
        linguagem
    )
SELECT i.id as ideia_id,
    i.titulo as titulo,
    '# ' || i.titulo || E'\n\n' || '**Hook (3 segundos):**' || E'\n' || 'Você sabia que ' || COALESCE(
        SUBSTRING(
            i.descricao
            FROM 1 FOR 50
        ),
        'isso vai mudar tudo'
    ) || '? 🤯' || E'\n\n' || '**Introdução:**' || E'\n' || COALESCE(
        i.descricao,
        'Conteúdo incrível sobre ' || i.titulo
    ) || E'\n\n' || '**Desenvolvimento:**' || E'\n' || '- Ponto principal sobre o tema' || E'\n' || '- Curiosidade interessante' || E'\n' || '- Dados e fatos relevantes' || E'\n\n' || '**Conclusão:**' || E'\n' || 'Se você gostou, deixa o like! 👍' || E'\n' || 'Comenta aqui embaixo o que você achou!' || E'\n' || 'E se inscreve para mais conteúdo como esse! 🔔' as conteudo_md,
    1 as versao,
    CASE
        WHEN RANDOM() < 0.3 THEN 'RASCUNHO'::pulso_status_roteiro
        WHEN RANDOM() < 0.6 THEN 'EM_REVISAO'::pulso_status_roteiro
        ELSE 'APROVADO'::pulso_status_roteiro
    END as status,
    'pt-BR' as linguagem
FROM pulso_content.ideias i
WHERE i.status IN ('APROVADA')
ORDER BY i.created_at DESC
LIMIT 30;
-- =====================================================
-- PASSO 2: POPULAR PIPELINE (30 itens no Kanban)
-- =====================================================
INSERT INTO pulso_content.pipeline_producao (
        ideia_id,
        roteiro_id,
        status,
        prioridade,
        data_prevista,
        responsavel
    )
SELECT r.ideia_id,
    r.id as roteiro_id,
    CASE
        WHEN r.status = 'RASCUNHO' THEN 'AGUARDANDO_ROTEIRO'
        WHEN r.status = 'EM_REVISAO' THEN 'ROTEIRO_PRONTO'
        WHEN r.status = 'APROVADO' THEN 'ROTEIRO_PRONTO'
        ELSE 'AGUARDANDO_ROTEIRO'
    END as status,
    FLOOR(RANDOM() * 10 + 1)::INTEGER as prioridade,
    CURRENT_DATE + (RANDOM() * 20)::INTEGER as data_prevista,
    'Equipe PULSO' as responsavel
FROM pulso_content.roteiros r
WHERE NOT EXISTS (
        SELECT 1
        FROM pulso_content.pipeline_producao p
        WHERE p.roteiro_id = r.id
    )
LIMIT 30;
-- =====================================================
-- VERIFICAÇÕES
-- =====================================================
-- Ver estatísticas de roteiros
SELECT status,
    COUNT(*) as quantidade
FROM pulso_content.roteiros
GROUP BY status
ORDER BY quantidade DESC;
-- Ver estatísticas do pipeline
SELECT status,
    COUNT(*) as quantidade,
    ROUND(AVG(prioridade), 1) as prioridade_media
FROM pulso_content.pipeline_producao
GROUP BY status
ORDER BY CASE
        status
        WHEN 'AGUARDANDO_ROTEIRO' THEN 1
        WHEN 'ROTEIRO_PRONTO' THEN 2
        WHEN 'AUDIO_GERADO' THEN 3
        WHEN 'EM_EDICAO' THEN 4
        WHEN 'PRONTO_PUBLICACAO' THEN 5
        WHEN 'PUBLICADO' THEN 6
    END;
| status | quantidade | prioridade_media | | ------------------ | ---------- | ---------------- |
| AGUARDANDO_ROTEIRO | 8 | 3.6 | | ROTEIRO_PRONTO | 22 | 5.5 | -- Ver alguns roteiros criados
SELECT r.titulo,
    r.status,
    c.nome as canal_nome,
    LENGTH(r.conteudo_md) as tamanho_md
FROM public.roteiros r
    JOIN public.ideias i ON r.ideia_id = i.id
    LEFT JOIN pulso_core.canais c ON i.canal_id = c.id
ORDER BY r.created_at DESC
LIMIT 10;
| titulo | status | canal_nome | tamanho_md | | ---------------------------------------------- | ---------- | ---------------------------- | ---------- |
| Golden State Killer: DNA Resolveu Após 40 Anos | EM_REVISAO | PULSO Casos Reais & Bizarros | 481 | | O Segredo do Aeris em FF7 | RASCUNHO | PULSO Games Nostalgia | 475 | | O Homem Que Sobreviveu 2 Bombas Atômicas | APROVADO | PULSO Casos Reais & Bizarros | 475 | | O Bebê Que Nasceu Grávido | APROVADO | PULSO Casos Reais & Bizarros | 459 | | Você Está Esperando o Que ? | RASCUNHO | PULSO Motivacional | 473 | | A Escolha | EM_REVISAO | PULSO Contos & Microficção | 458 | | O Easter Egg Impossível do Atari | EM_REVISAO | PULSO Games Nostalgia | 472 | | A Última Palavra | EM_REVISAO | PULSO Contos & Microficção | 467 | | A Memória | APROVADO | PULSO Contos & Microficção | 461 | | O Homem Que Vendeu a Torre Eiffel Duas Vezes | APROVADO | PULSO Casos Reais & Bizarros | 494 |