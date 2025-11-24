-- Criar 1 roteiro de teste para testar o botão "Gerar Áudio"
INSERT INTO pulso_content.roteiros (
        ideia_id,
        titulo,
        conteudo_md,
        versao,
        status,
        linguagem
    )
SELECT i.id,
    i.titulo,
    E'# ' || i.titulo || E'\n\n' || E'**Hook (3 segundos):**\n' || E'Você sabia que isso pode mudar tudo? 🤯\n\n' || E'**Introdução:**\n' || i.descricao || E'\n\n' || E'**Desenvolvimento:**\n' || E'Aqui está o que você precisa saber sobre esse assunto incrível.\n' || E'Primeiro ponto importante que vai te surpreender.\n' || E'Segundo dado que muda completamente a perspectiva.\n\n' || E'**Clímax:**\n' || E'E agora vem a parte mais interessante de todas!\n\n' || E'**Conclusão:**\n' || E'Se você gostou, deixa o like! 👍\n' || E'Comenta aqui embaixo o que você achou!\n' || E'E se inscreve para mais conteúdo como esse! 🔔',
    1,
    'APROVADO',
    'pt-BR'
FROM pulso_content.ideias i
WHERE i.status = 'APROVADA'
LIMIT 1;
-- Verificar o roteiro criado
SELECT r.id,
    r.titulo,
    r.status,
    LENGTH(r.conteudo_md) as tamanho_conteudo
FROM pulso_content.roteiros r
ORDER BY r.created_at DESC
LIMIT 1;