-- Script para criar publicações agendadas
-- Execute no Supabase SQL Editor
-- Criar publicações agendadas para os próximos 30 dias
INSERT INTO pulso_content.publicacoes_agendadas (
        roteiro_id,
        canal_id,
        plataforma,
        data_agendada,
        hora_agendada,
        status,
        titulo_customizado,
        descricao_customizada
    )
SELECT r.id as roteiro_id,
    i.canal_id,
    CASE
        (RANDOM() * 4)::INTEGER
        WHEN 0 THEN 'YOUTUBE'
        WHEN 1 THEN 'TIKTOK'
        WHEN 2 THEN 'INSTAGRAM'
        ELSE 'KWAI'
    END as plataforma,
    CURRENT_DATE + (RANDOM() * 30)::INTEGER as data_agendada,
    (8 + (RANDOM() * 12)::INTEGER)::TEXT || ':00:00' as hora_agendada,
    CASE
        WHEN RANDOM() < 0.6 THEN 'AGENDADA'
        WHEN RANDOM() < 0.8 THEN 'PUBLICADA'
        ELSE 'CANCELADA'
    END as status,
    r.titulo as titulo_customizado,
    SUBSTRING(
        r.conteudo_md
        FROM 1 FOR 200
    ) || '...' as descricao_customizada
FROM pulso_content.roteiros r
    JOIN pulso_content.ideias i ON r.ideia_id = i.id
WHERE r.status IN ('APROVADO', 'COM_AUDIO', 'PRONTO_PUBLICAR')
ORDER BY RANDOM()
LIMIT 50;
-- Criar algumas publicações recorrentes (séries)
INSERT INTO pulso_content.publicacoes_agendadas (
        roteiro_id,
        canal_id,
        plataforma,
        data_agendada,
        hora_agendada,
        status,
        titulo_customizado,
        descricao_customizada,
        e_recorrente,
        frequencia_recorrencia
    )
SELECT r.id as roteiro_id,
    i.canal_id,
    'YOUTUBE' as plataforma,
    CURRENT_DATE + (RANDOM() * 30)::INTEGER as data_agendada,
    '18:00:00' as hora_agendada,
    'AGENDADA' as status,
    r.titulo as titulo_customizado,
    SUBSTRING(
        r.conteudo_md
        FROM 1 FOR 200
    ) || '...' as descricao_customizada,
    true as e_recorrente,
    'SEMANAL' as frequencia_recorrencia
FROM pulso_content.roteiros r
    JOIN pulso_content.ideias i ON r.ideia_id = i.id
WHERE i.serie_id IS NOT NULL
ORDER BY RANDOM()
LIMIT 10;
-- Ver calendário dos próximos 7 dias
SELECT p.data_agendada,
    p.hora_agendada,
    p.plataforma,
    p.titulo_customizado,
    p.status,
    c.nome as canal_nome
FROM pulso_content.publicacoes_agendadas p
    JOIN pulso_core.canais c ON p.canal_id = c.id
WHERE p.data_agendada BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
ORDER BY p.data_agendada,
    p.hora_agendada;
-- Estatísticas do calendário
SELECT plataforma,
    status,
    COUNT(*) as quantidade
FROM pulso_content.publicacoes_agendadas
GROUP BY plataforma,
    status
ORDER BY plataforma,
    status;