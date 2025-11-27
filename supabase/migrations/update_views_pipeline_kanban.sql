-- =====================================================
-- ATUALIZAR: Views de Pipeline e Kanban (mais completas)
-- =====================================================

-- 1) Criar/Atualizar view no schema pulso_content (source)
CREATE OR REPLACE VIEW pulso_content.vw_pipeline_calendario_publicacao AS
SELECT
  p.id                            AS pipeline_id,
  p.ideia_id,
  p.roteiro_id,
  c.id                            AS canal_id,
  c.nome                          AS canal,
  s.id                            AS serie_id,
  s.nome                          AS serie,
  i.titulo                        AS ideia,
  i.status                        AS ideia_status,
  r.status                        AS roteiro_status,
  p.status                        AS pipeline_status,
  p.is_piloto,
  p.data_prevista,
  p.data_publicacao_planejada,
  (p.data_publicacao_planejada::TIME) AS hora_publicacao,
  p.prioridade,
  p.metadata
FROM pulso_content.pipeline_producao p
JOIN pulso_content.ideias   i ON i.id = p.ideia_id
JOIN pulso_core.canais      c ON c.id = i.canal_id
JOIN pulso_core.series      s ON s.id = i.serie_id
LEFT JOIN pulso_content.roteiros r ON r.id = p.roteiro_id
WHERE p.data_publicacao_planejada IS NOT NULL
ORDER BY
  p.data_publicacao_planejada,
  c.nome,
  s.nome,
  p.prioridade DESC;

COMMENT ON VIEW pulso_content.vw_pipeline_calendario_publicacao IS 
'View de pipeline para calendário - somente itens com data de publicação planejada';

-- 2) Criar/Atualizar view no schema pulso_content (source)
CREATE OR REPLACE VIEW pulso_content.vw_pipeline_kanban AS
SELECT
  p.id                  AS pipeline_id,
  p.ideia_id,
  p.roteiro_id,
  c.id                  AS canal_id,
  c.nome                AS canal,
  s.id                  AS serie_id,
  s.nome                AS serie,
  i.titulo              AS ideia,
  i.status              AS ideia_status,
  r.status              AS roteiro_status,
  p.status              AS pipeline_status,
  p.is_piloto,
  p.data_prevista,
  p.data_publicacao_planejada,
  (p.data_publicacao_planejada::TIME) AS hora_publicacao,
  p.prioridade,
  p.metadata
FROM pulso_content.pipeline_producao p
JOIN pulso_content.ideias   i ON i.id = p.ideia_id
JOIN pulso_core.canais      c ON c.id = i.canal_id
JOIN pulso_core.series      s ON s.id = i.serie_id
LEFT JOIN pulso_content.roteiros r ON r.id = p.roteiro_id
ORDER BY
  p.status,
  c.nome,
  s.nome,
  p.prioridade DESC;

COMMENT ON VIEW pulso_content.vw_pipeline_kanban IS 
'View de pipeline para Kanban - todos os itens organizados por status';

-- 3) Criar views públicas (para acesso do frontend)
DROP VIEW IF EXISTS public.vw_pipeline_calendario_publicacao CASCADE;
CREATE OR REPLACE VIEW public.vw_pipeline_calendario_publicacao AS
SELECT * FROM pulso_content.vw_pipeline_calendario_publicacao;

GRANT SELECT ON public.vw_pipeline_calendario_publicacao TO anon, authenticated;

COMMENT ON VIEW public.vw_pipeline_calendario_publicacao IS 
'View pública de pipeline para calendário - acesso via PostgREST';

-- 4) Criar view pública para Kanban
DROP VIEW IF EXISTS public.vw_pipeline_kanban CASCADE;
CREATE OR REPLACE VIEW public.vw_pipeline_kanban AS
SELECT * FROM pulso_content.vw_pipeline_kanban;

GRANT SELECT ON public.vw_pipeline_kanban TO anon, authenticated;

COMMENT ON VIEW public.vw_pipeline_kanban IS 
'View pública de pipeline para Kanban - acesso via PostgREST';

-- 5) Recarregar cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- 6) Verificação
SELECT 'Views de Pipeline e Kanban atualizadas com sucesso!' AS status;

-- Testar view de calendário
SELECT 
  canal,
  serie,
  ideia,
  pipeline_status,
  data_publicacao_planejada,
  hora_publicacao
FROM public.vw_pipeline_calendario_publicacao
LIMIT 5;

-- Testar view de Kanban
SELECT 
  pipeline_status,
  canal,
  serie,
  ideia,
  prioridade
FROM public.vw_pipeline_kanban
WHERE pipeline_status = 'AGUARDANDO_ROTEIRO'
LIMIT 5;
