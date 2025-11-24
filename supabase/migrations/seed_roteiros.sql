-- Script para popular roteiros de teste baseados nas ideias existentes
-- Execute no Supabase SQL Editor
-- Criar 30 roteiros de exemplo baseados nas primeiras 30 ideias
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
    '# ' || i.titulo || E'\n\n' || '**Hook (3 segundos):**' || E'\n' || 'Você sabia que ' || SUBSTRING(
        i.descricao
        FROM 1 FOR 50
    ) || '? 🤯' || E'\n\n' || '**Introdução:**' || E'\n' || i.descricao || E'\n\n' || '**Desenvolvimento:**' || E'\n' || '- Ponto principal sobre o tema' || E'\n' || '- Curiosidade interessante' || E'\n' || '- Dados e fatos relevantes' || E'\n\n' || '**Conclusão:**' || E'\n' || 'Se você gostou, deixa o like! 👍' || E'\n' || 'Comenta aqui embaixo o que você achou!' || E'\n' || 'E se inscreve para mais conteúdo como esse! 🔔' as conteudo_md,
    1 as versao,
    CASE
        WHEN RANDOM() < 0.3 THEN 'RASCUNHO'
        WHEN RANDOM() < 0.6 THEN 'REVISAO'
        ELSE 'APROVADO'
    END as status,
    'pt-BR' as linguagem
FROM pulso_content.ideias i
WHERE i.status = 'APROVADA'
ORDER BY i.id DESC
LIMIT 30;
-- Verificar quantos roteiros foram criados
SELECT COUNT(*) as total_roteiros,
    status,
    COUNT(*) as por_status
FROM pulso_content.roteiros
GROUP BY status;
-- Ver alguns roteiros criados
SELECT r.id,
    r.titulo,
    r.status,
    LENGTH(r.conteudo_md) as tamanho_conteudo
FROM pulso_content.roteiros r
ORDER BY r.id DESC
LIMIT 10;