-- View para o n8n consumir os dados completos do roteiro
-- Essa view facilita o acesso e centraliza a lógica de JOIN
CREATE OR REPLACE VIEW pulso_content.n8n_roteiro_completo AS
SELECT r.id as roteiro_id,
    r.ideia_id,
    r.titulo as roteiro_titulo,
    r.conteudo_md,
    r.duracao_estimado_segundos,
    r.status as roteiro_status,
    r.metadata as metadata_roteiro,
    r.created_at as roteiro_created_at,
    r.updated_at as roteiro_updated_at,
    i.canal_id,
    i.titulo as ideia_titulo,
    i.descricao as ideia_descricao,
    i.metadata as metadata_ideia,
    c.nome as canal_nome,
    c.slug as canal_slug,
    c.descricao as canal_descricao,
    c.idioma as canal_idioma,
    c.status as canal_status,
    c.metadata as metadata_canal
FROM pulso_content.roteiros r
    JOIN pulso_content.ideias i ON i.id = r.ideia_id
    LEFT JOIN pulso_core.canais c ON c.id = i.canal_id;
-- Conceder permissão de SELECT para o usuário postgres (usado pelo n8n)
GRANT SELECT ON pulso_content.n8n_roteiro_completo TO postgres;
-- Comentário descritivo da view
COMMENT ON VIEW pulso_content.n8n_roteiro_completo IS 'View consolidada para workflows n8n. Combina dados de roteiros, ideias e canais em uma única consulta otimizada.';