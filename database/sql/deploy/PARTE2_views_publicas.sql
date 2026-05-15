-- =====================================================================
-- PARTE 2: VIEWS PÚBLICAS
-- Banco: nlcisbfdiokmipyihtuz
-- NOTA: DROP CASCADE necessário porque views existentes têm colunas
--       diferentes. CASCADE remove views dependentes que serão recriadas.
-- =====================================================================

-- Remover views existentes (ordem reversa de dependência)
DROP VIEW IF EXISTS public.vw_pulso_posts_resumo CASCADE;
DROP VIEW IF EXISTS public.vw_pulso_posts_metricas_diarias CASCADE;
DROP VIEW IF EXISTS public.vw_pulso_posts CASCADE;
DROP VIEW IF EXISTS public.vw_pulso_conteudo_variantes_assets CASCADE;
DROP VIEW IF EXISTS public.vw_pulso_conteudo_variantes CASCADE;
DROP VIEW IF EXISTS public.vw_pulso_conteudos CASCADE;
DROP VIEW IF EXISTS public.vw_pulso_roteiros CASCADE;
DROP VIEW IF EXISTS public.vw_pulso_ideias CASCADE;
DROP VIEW IF EXISTS public.vw_pulso_series CASCADE;
DROP VIEW IF EXISTS public.vw_pulso_canais CASCADE;
DROP VIEW IF EXISTS public.vw_pulso_workflow_execucoes CASCADE;
DROP VIEW IF EXISTS public.vw_pulso_workflows CASCADE;

-- 1) Canais
CREATE OR REPLACE VIEW public.vw_pulso_canais AS
SELECT c.id, c.nome, c.slug, c.descricao, c.idioma, c.status, c.metadata, c.created_at, c.updated_at
FROM pulso_core.canais c;

-- 2) Séries por canal
CREATE OR REPLACE VIEW public.vw_pulso_series AS
SELECT s.id, s.canal_id, c.nome AS canal_nome, c.slug AS canal_slug,
    s.nome AS serie_nome, s.slug AS serie_slug, s.descricao, s.status,
    s.ordem_padrao, s.metadata, s.created_at, s.updated_at
FROM pulso_core.series s
    LEFT JOIN pulso_core.canais c ON c.id = s.canal_id;

-- 3) Ideias
CREATE OR REPLACE VIEW public.vw_pulso_ideias AS
SELECT i.id, i.canal_id, c.nome AS canal_nome, c.slug AS canal_slug,
    i.serie_id, s.nome AS serie_nome, s.slug AS serie_slug,
    i.titulo, i.descricao, i.origem, i.prioridade, i.status, i.tags,
    i.linguagem, i.criado_por, u.nome AS criado_por_nome,
    i.metadata, i.created_at, i.updated_at
FROM pulso_content.ideias i
    LEFT JOIN pulso_core.canais c ON c.id = i.canal_id
    LEFT JOIN pulso_core.series s ON s.id = i.serie_id
    LEFT JOIN pulso_core.usuarios_internos u ON u.id = i.criado_por;

-- 4) Roteiros
CREATE OR REPLACE VIEW public.vw_pulso_roteiros AS
SELECT r.id, r.ideia_id, i.titulo AS ideia_titulo,
    i.canal_id, c.nome AS canal_nome, c.slug AS canal_slug,
    i.serie_id, s.nome AS serie_nome, s.slug AS serie_slug,
    r.titulo AS roteiro_titulo, r.versao, r.conteudo_md,
    r.duracao_estimado_segundos, r.status, r.linguagem,
    r.criado_por, u1.nome AS criado_por_nome,
    r.revisado_por, u2.nome AS revisado_por_nome,
    r.metadata, r.created_at, r.updated_at
FROM pulso_content.roteiros r
    LEFT JOIN pulso_content.ideias i ON i.id = r.ideia_id
    LEFT JOIN pulso_core.canais c ON c.id = i.canal_id
    LEFT JOIN pulso_core.series s ON s.id = i.serie_id
    LEFT JOIN pulso_core.usuarios_internos u1 ON u1.id = r.criado_por
    LEFT JOIN pulso_core.usuarios_internos u2 ON u2.id = r.revisado_por;

-- 5) Conteúdos
CREATE OR REPLACE VIEW public.vw_pulso_conteudos AS
SELECT ct.id, ct.canal_id, c.nome AS canal_nome, c.slug AS canal_slug,
    ct.serie_id, s.nome AS serie_nome, s.slug AS serie_slug,
    ct.roteiro_id, r.titulo AS roteiro_titulo,
    ct.titulo_interno, ct.sinopse, ct.status, ct.linguagem,
    ct.ordem_na_serie, ct.tags, ct.metadata,
    ct.criado_por, u.nome AS criado_por_nome,
    ct.created_at, ct.updated_at
FROM pulso_content.conteudos ct
    LEFT JOIN pulso_core.canais c ON c.id = ct.canal_id
    LEFT JOIN pulso_core.series s ON s.id = ct.serie_id
    LEFT JOIN pulso_content.roteiros r ON r.id = ct.roteiro_id
    LEFT JOIN pulso_core.usuarios_internos u ON u.id = ct.criado_por;

-- 6) Variantes de conteúdo
CREATE OR REPLACE VIEW public.vw_pulso_conteudo_variantes AS
SELECT v.id, v.conteudo_id, ct.canal_id,
    c.nome AS canal_nome, c.slug AS canal_slug,
    ct.serie_id, s.nome AS serie_nome, s.slug AS serie_slug,
    ct.titulo_interno, ct.status AS conteudo_status,
    v.nome_variacao, v.plataforma_tipo,
    v.status AS variante_status, v.titulo_publico,
    v.descricao_publica, v.legenda, v.hashtags,
    v.linguagem, v.ordem_exibicao, v.metadata,
    v.created_at, v.updated_at
FROM pulso_content.conteudo_variantes v
    LEFT JOIN pulso_content.conteudos ct ON ct.id = v.conteudo_id
    LEFT JOIN pulso_core.canais c ON c.id = ct.canal_id
    LEFT JOIN pulso_core.series s ON s.id = ct.serie_id;

-- 7) Assets vinculados às variantes
CREATE OR REPLACE VIEW public.vw_pulso_conteudo_variantes_assets AS
SELECT v.id AS conteudo_variantes_id, v.conteudo_id,
    ct.canal_id, c.nome AS canal_nome, c.slug AS canal_slug,
    ct.serie_id, s.nome AS serie_nome, s.slug AS serie_slug,
    ct.titulo_interno, v.nome_variacao, v.plataforma_tipo,
    v.status AS variante_status,
    ca.asset_id, a.tipo AS asset_tipo, a.nome AS asset_nome,
    a.caminho_storage, a.provedor, a.duracao_segundos,
    a.largura_px, a.altura_px, a.tamanho_bytes,
    ca.papel AS asset_papel, ca.ordem AS asset_ordem,
    a.metadata AS asset_metadata, v.metadata AS variante_metadata
FROM pulso_assets.conteudo_variantes_assets ca
    JOIN pulso_assets.assets a ON a.id = ca.asset_id
    JOIN pulso_content.conteudo_variantes v ON v.id = ca.conteudo_variantes_id
    JOIN pulso_content.conteudos ct ON ct.id = v.conteudo_id
    LEFT JOIN pulso_core.canais c ON c.id = ct.canal_id
    LEFT JOIN pulso_core.series s ON s.id = ct.serie_id;

-- 8) Posts
CREATE OR REPLACE VIEW public.vw_pulso_posts AS
SELECT p.id, p.conteudo_variantes_id, v.conteudo_id,
    ct.canal_id, c.nome AS canal_nome, c.slug AS canal_slug,
    ct.serie_id, s.nome AS serie_nome, s.slug AS serie_slug,
    v.nome_variacao, v.plataforma_tipo AS variante_plataforma_tipo,
    p.canal_plataforma_id,
    cp.identificador_externo AS canal_identificador_externo,
    cp.nome_exibicao AS canal_nome_plataforma, cp.url_canal,
    pf.tipo AS plataforma_tipo, pf.nome_exibicao AS plataforma_nome,
    p.status AS post_status, p.titulo_publicado,
    p.descricao_publicada, p.legenda_publicada,
    p.url_publicacao, p.identificador_externo,
    p.data_agendada, p.data_publicacao, p.data_remocao,
    p.metadata, p.criado_por, u.nome AS criado_por_nome,
    p.created_at, p.updated_at
FROM pulso_distribution.posts p
    JOIN pulso_content.conteudo_variantes v ON v.id = p.conteudo_variantes_id
    JOIN pulso_content.conteudos ct ON ct.id = v.conteudo_id
    LEFT JOIN pulso_core.canais c ON c.id = ct.canal_id
    LEFT JOIN pulso_core.series s ON s.id = ct.serie_id
    JOIN pulso_core.canais_plataformas cp ON cp.id = p.canal_plataforma_id
    JOIN pulso_core.plataformas pf ON pf.id = cp.plataforma_id
    LEFT JOIN pulso_core.usuarios_internos u ON u.id = p.criado_por;

-- 9) Métricas diárias
CREATE OR REPLACE VIEW public.vw_pulso_posts_metricas_diarias AS
SELECT md.id, md.post_id, p.conteudo_variantes_id, p.canal_plataforma_id,
    md.plataforma_id, pf.tipo AS plataforma_tipo, pf.nome_exibicao AS plataforma_nome,
    p.url_publicacao, p.identificador_externo, md.data_ref,
    md.views, md.likes, md.deslikes, md.comentarios,
    md.compartilhamentos, md.cliques_link, md.inscricoes,
    md.watch_time_segundos, md.metadata, md.created_at, md.updated_at
FROM pulso_analytics.metricas_diarias md
    JOIN pulso_distribution.posts p ON p.id = md.post_id
    LEFT JOIN pulso_core.plataformas pf ON pf.id = md.plataforma_id;

-- 10) Resumo de performance por post
CREATE OR REPLACE VIEW public.vw_pulso_posts_resumo AS
SELECT p.id AS post_id, p.conteudo_variantes_id, p.canal_plataforma_id,
    p.plataforma_tipo, p.plataforma_nome,
    p.url_publicacao, p.identificador_externo,
    MIN(md.data_ref) AS primeira_data_ref,
    MAX(md.data_ref) AS ultima_data_ref,
    COALESCE(SUM(md.views), 0) AS total_views,
    COALESCE(SUM(md.likes), 0) AS total_likes,
    COALESCE(SUM(md.deslikes), 0) AS total_deslikes,
    COALESCE(SUM(md.comentarios), 0) AS total_comentarios,
    COALESCE(SUM(md.compartilhamentos), 0) AS total_compartilhamentos,
    COALESCE(SUM(md.cliques_link), 0) AS total_cliques_link,
    COALESCE(SUM(md.inscricoes), 0) AS total_inscricoes,
    COALESCE(SUM(md.watch_time_segundos), 0) AS total_watch_time_segundos
FROM public.vw_pulso_posts p
    LEFT JOIN pulso_analytics.metricas_diarias md ON md.post_id = p.id
GROUP BY p.id, p.conteudo_variantes_id, p.canal_plataforma_id,
    p.plataforma_tipo, p.plataforma_nome, p.url_publicacao, p.identificador_externo;

-- 11) Workflows + execuções
CREATE OR REPLACE VIEW public.vw_pulso_workflows AS
SELECT w.id, w.nome, w.slug, w.descricao, w.origem, w.referencia_externa,
    w.ativo, w.configuracao, w.created_at, w.updated_at
FROM pulso_automation.workflows w;

CREATE OR REPLACE VIEW public.vw_pulso_workflow_execucoes AS
SELECT e.id, e.workflow_id, w.nome AS workflow_nome, w.slug AS workflow_slug,
    e.entidade_tipo, e.entidade_id, e.status, e.mensagem,
    e.payload_entrada, e.payload_saida, e.inicio_em, e.fim_em,
    e.criado_por, u.nome AS criado_por_nome
FROM pulso_automation.workflow_execucoes e
    JOIN pulso_automation.workflows w ON w.id = e.workflow_id
    LEFT JOIN pulso_core.usuarios_internos u ON u.id = e.criado_por;

-- Grants para views públicas
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- =====================================================================
-- FIM PARTE 2 — Verificação:
-- =====================================================================
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public' AND table_name LIKE 'vw_pulso%'
ORDER BY table_name;
