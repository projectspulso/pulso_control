-- =====================================================
-- VALIDAÇÃO RÁPIDA - AJUSTE DE DATAS
-- =====================================================
-- Execute APÓS aplicar o script ajustar_datas_inicio_projeto.sql
-- =====================================================
-- 1. Resumo geral
SELECT 'RESUMO GERAL' as categoria,
    (
        SELECT COUNT(*)
        FROM pulso_content.ideias
        WHERE status = 'APROVADA'
    ) as ideias_aprovadas,
    (
        SELECT COUNT(*)
        FROM pulso_content.roteiros
    ) as roteiros_criados,
    (
        SELECT COUNT(*)
        FROM pulso_content.audios
    ) as audios_gerados,
    (
        SELECT COUNT(*)
        FROM pulso_content.pipeline_producao
        WHERE data_publicacao IS NOT NULL
    ) as items_agendados;
| categoria | ideias_aprovadas | roteiros_criados | audios_gerados | items_agendados | | ------------ | ---------------- | ---------------- | -------------- | --------------- |
| RESUMO GERAL | 119 | 3 | 0 | 129 | -- 2. Distribuição de datas de publicação
SELECT 'CALENDÁRIO' as categoria,
    MIN(data_publicacao::date) as primeira_publicacao,
    MAX(data_publicacao::date) as ultima_publicacao,
    (
        MAX(data_publicacao::date) - MIN(data_publicacao::date)
    ) as dias_cobertos,
    COUNT(*) as total_posts,
    ROUND(
        COUNT(*)::numeric / (
            MAX(data_publicacao::date) - MIN(data_publicacao::date) + 1
        ),
        2
    ) as media_posts_dia
FROM pulso_content.pipeline_producao
WHERE data_publicacao IS NOT NULL;
| categoria | primeira_publicacao | ultima_publicacao | dias_cobertos | total_posts | media_posts_dia | | ---------- | ------------------- | ----------------- | ------------- | ----------- | --------------- |
| CALENDÁRIO | 2025 -12 -10 | 2026 -01 -21 | 42 | 129 | 3.00 | -- 3. Primeiras 10 publicações
SELECT 'TOP 10 PUBLICAÇÕES' as categoria,
    ROW_NUMBER() OVER (
        ORDER BY pp.data_publicacao
    ) as ordem,
    i.titulo,
    pp.status,
    TO_CHAR(pp.data_publicacao, 'DD/MM/YYYY') as data,
    TO_CHAR(pp.data_publicacao, 'HH24:MI') as hora,
    TO_CHAR(pp.data_publicacao, 'Day') as dia_semana
FROM pulso_content.pipeline_producao pp
    LEFT JOIN pulso_content.ideias i ON i.id = pp.ideia_id
WHERE pp.data_publicacao IS NOT NULL
ORDER BY pp.data_publicacao
LIMIT 10;
| categoria | ordem | titulo | status | data | hora | dia_semana | | ------------------ | ----- | ----------------------------------- | ------------------ | ---------- | ----- | ---------- |
| TOP 10 PUBLICAÇÕES | 1 | Seu Cérebro Inventa Memórias Falsas | AGUARDANDO_ROTEIRO | 10 / 12 / 2025 | 09 :00 | Wednesday | | TOP 10 PUBLICAÇÕES | 2 | Você Nunca Viu Seu Rosto | AGUARDANDO_ROTEIRO | 10 / 12 / 2025 | 15 :00 | Wednesday | | TOP 10 PUBLICAÇÕES | 3 | O Efeito Zeigarnik | AGUARDANDO_ROTEIRO | 10 / 12 / 2025 | 21 :00 | Wednesday | | TOP 10 PUBLICAÇÕES | 4 | Você Já Morreu Milhares de Vezes | AGUARDANDO_ROTEIRO | 11 / 12 / 2025 | 09 :00 | Thursday | | TOP 10 PUBLICAÇÕES | 5 | A Ilusão do Livre Arbítrio | AGUARDANDO_ROTEIRO | 11 / 12 / 2025 | 15 :00 | Thursday | | TOP 10 PUBLICAÇÕES | 6 | A Casa Winchester | AGUARDANDO_ROTEIRO | 11 / 12 / 2025 | 21 :00 | Thursday | | TOP 10 PUBLICAÇÕES | 7 | A Doença que Te Faz Morrer de Riso | AGUARDANDO_ROTEIRO | 12 / 12 / 2025 | 09 :00 | Friday | | TOP 10 PUBLICAÇÕES | 8 | O Silêncio Absoluto Te Enlouquece | AGUARDANDO_ROTEIRO | 12 / 12 / 2025 | 15 :00 | Friday | | TOP 10 PUBLICAÇÕES | 9 | Priões: O Vírus Indestrutível | AGUARDANDO_ROTEIRO | 12 / 12 / 2025 | 21 :00 | Friday | | TOP 10 PUBLICAÇÕES | 10 | A Colônia Perdida de Roanoke | AGUARDANDO_ROTEIRO | 13 / 12 / 2025 | 09 :00 | Saturday | -- 4. Posts por dia (primeiros 15 dias)
SELECT 'DISTRIBUIÇÃO DIÁRIA' as categoria,
    data_publicacao::date as dia,
    TO_CHAR(data_publicacao::date, 'Day') as dia_semana,
    COUNT(*) as total_posts,
    array_agg(
        TO_CHAR(data_publicacao, 'HH24:MI')
        ORDER BY data_publicacao
    ) as horarios
FROM pulso_content.pipeline_producao
WHERE data_publicacao IS NOT NULL
GROUP BY data_publicacao::date
ORDER BY dia
LIMIT 15;
| categoria | dia | dia_semana | total_posts | horarios | | ------------------- | ---------- | ---------- | ----------- | ------------------------- |
| DISTRIBUIÇÃO DIÁRIA | 2025 -12 -10 | Wednesday | 3 | ["09:00","15:00","21:00"] | | DISTRIBUIÇÃO DIÁRIA | 2025 -12 -11 | Thursday | 3 | ["09:00","15:00","21:00"] | | DISTRIBUIÇÃO DIÁRIA | 2025 -12 -12 | Friday | 3 | ["09:00","15:00","21:00"] | | DISTRIBUIÇÃO DIÁRIA | 2025 -12 -13 | Saturday | 3 | ["09:00","15:00","21:00"] | | DISTRIBUIÇÃO DIÁRIA | 2025 -12 -14 | Sunday | 3 | ["09:00","15:00","21:00"] | | DISTRIBUIÇÃO DIÁRIA | 2025 -12 -15 | Monday | 3 | ["09:00","15:00","21:00"] | | DISTRIBUIÇÃO DIÁRIA | 2025 -12 -16 | Tuesday | 3 | ["09:00","15:00","21:00"] | | DISTRIBUIÇÃO DIÁRIA | 2025 -12 -17 | Wednesday | 3 | ["09:00","15:00","21:00"] | | DISTRIBUIÇÃO DIÁRIA | 2025 -12 -18 | Thursday | 3 | ["09:00","15:00","21:00"] | | DISTRIBUIÇÃO DIÁRIA | 2025 -12 -19 | Friday | 3 | ["09:00","15:00","21:00"] | | DISTRIBUIÇÃO DIÁRIA | 2025 -12 -20 | Saturday | 3 | ["09:00","15:00","21:00"] | | DISTRIBUIÇÃO DIÁRIA | 2025 -12 -21 | Sunday | 3 | ["09:00","15:00","21:00"] | | DISTRIBUIÇÃO DIÁRIA | 2025 -12 -22 | Monday | 3 | ["09:00","15:00","21:00"] | | DISTRIBUIÇÃO DIÁRIA | 2025 -12 -23 | Tuesday | 3 | ["09:00","15:00","21:00"] | | DISTRIBUIÇÃO DIÁRIA | 2025 -12 -24 | Wednesday | 3 | ["09:00","15:00","21:00"] | -- 5. Status do pipeline
SELECT 'PIPELINE STATUS' as categoria,
    status,
    COUNT(*) as total,
    COUNT(
        CASE
            WHEN data_publicacao IS NOT NULL THEN 1
        END
    ) as com_agenda,
    MIN(data_publicacao::date) as primeira_data,
    MAX(data_publicacao::date) as ultima_data
FROM pulso_content.pipeline_producao
GROUP BY status
ORDER BY total DESC;
| categoria | status | total | com_agenda | primeira_data | ultima_data | | --------------- | ------------------ | ----- | ---------- | ------------- | ----------- |
| PIPELINE STATUS | AGUARDANDO_ROTEIRO | 126 | 126 | 2025 -12 -10 | 2026 -01 -21 | | PIPELINE STATUS | ROTEIRO_PRONTO | 3 | 3 | 2025 -12 -23 | 2026 -01 -13 | -- 6. Verificar se há conflitos de horário
SELECT 'CONFLITOS' as categoria,
    data_publicacao,
    COUNT(*) as posts_mesmo_horario
FROM pulso_content.pipeline_producao
WHERE data_publicacao IS NOT NULL
GROUP BY data_publicacao
HAVING COUNT(*) > 1
ORDER BY data_publicacao;
nada -- 7. Ideias sem data de publicação
SELECT 'PENDÊNCIAS' as categoria,
    COUNT(*) as ideias_sem_data,
    array_agg(status) as status_encontrados
FROM pulso_content.pipeline_producao
WHERE data_publicacao IS NULL;
| categoria | ideias_sem_data | status_encontrados | | ---------- | --------------- | ------------------ |
| PENDÊNCIAS | 0 | null | -- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- RESUMO GERAL:
--   - ideias_aprovadas: 119
--   - roteiros_criados: 1
--   - audios_gerados: 0
--   - items_agendados: 129
--
-- CALENDÁRIO:
--   - primeira_publicacao: 2025-12-10
--   - ultima_publicacao: 2026-01-22 (aprox.)
--   - dias_cobertos: 43
--   - media_posts_dia: 3.00
--
-- CONFLITOS: 0 linhas (não deve haver posts no mesmo horário)
-- PENDÊNCIAS: 0 ideias_sem_data
-- =====================================================