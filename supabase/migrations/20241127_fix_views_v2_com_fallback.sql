-- Migration: Garantir que titulo_publico seja populado nas variantes
-- ou ajustar a view para ter fallback para a estrutura antiga
-- OPÇÃO 1: Ajustar a view para ter fallback (mais seguro)
create or replace view pulso_content.vw_pulso_pipeline_base_v2 as
select p.id as pipeline_id,
    p.conteudo_variantes_id,
    -- Canal com fallback
    coalesce(
        ca.nome,
        p.metadata->>'canal_nome'
    ) as canal_nome,
    -- Série com fallback
    coalesce(
        p.metadata->>'serie_nome',
        co.metadata->>'serie_nome'
    ) as serie_nome,
    -- Ideia / título exibido com FALLBACK para estrutura antiga
    coalesce(
        cv.titulo_publico,
        i.titulo,
        -- fallback para ideias.titulo
        'Sem título'
    ) as ideia_titulo,
    -- Status da ideia (conteúdo) e do pipeline
    coalesce(co.status::text, i.status::text, 'RASCUNHO') as ideia_status,
    p.status as pipeline_status,
    -- Campos do pipeline
    p.is_piloto as is_piloto,
    p.data_prevista as data_prevista,
    p.data_publicacao_planejada as data_publicacao_planejada,
    (p.data_publicacao_planejada::time) as hora_publicacao,
    p.prioridade as prioridade,
    p.metadata as pipeline_metadata
from pulso_content.pipeline_producao p
    left join pulso_content.conteudo_variantes cv on cv.id = p.conteudo_variantes_id
    left join pulso_content.conteudos co on co.id = cv.conteudo_id
    left join pulso_core.canais ca on ca.id = co.canal_id -- FALLBACK: join com ideias caso conteudo_variantes não exista
    left join pulso_content.ideias i on i.id = p.ideia_id;
-- Recriar as views dependentes (não muda nada)
create or replace view pulso_content.vw_pulso_pipeline_com_assets_v2 as
select b.pipeline_id,
    b.conteudo_variantes_id,
    b.canal_nome,
    b.serie_nome,
    b.ideia_titulo,
    b.ideia_status,
    b.pipeline_status,
    b.is_piloto,
    b.data_prevista,
    b.data_publicacao_planejada,
    b.hora_publicacao,
    b.prioridade,
    b.pipeline_metadata,
    -- Dados do asset
    a.id as asset_id,
    a.tipo as asset_tipo,
    a.caminho_storage,
    a.provedor,
    a.duracao_segundos,
    a.largura_px,
    a.altura_px,
    a.tamanho_bytes,
    a.metadata as asset_metadata,
    cva.papel as asset_papel,
    cva.ordem as asset_ordem
from pulso_content.vw_pulso_pipeline_base_v2 b
    left join pulso_assets.conteudo_variantes_assets cva on cva.conteudo_variantes_id = b.conteudo_variantes_id
    left join pulso_assets.assets a on a.id = cva.asset_id;
create or replace view public.vw_pulso_calendario_publicacao_v2 as
select b.pipeline_id,
    b.canal_nome as canal,
    b.serie_nome as serie,
    b.ideia_titulo as ideia,
    b.ideia_status,
    b.pipeline_status,
    b.is_piloto,
    b.data_prevista,
    b.data_publicacao_planejada,
    b.hora_publicacao,
    b.prioridade,
    b.pipeline_metadata as metadata
from pulso_content.vw_pulso_pipeline_base_v2 b;
create or replace view public.vw_pulso_pipeline_com_assets_v2 as
select pa.pipeline_id,
    pa.canal_nome as canal,
    pa.serie_nome as serie,
    pa.ideia_titulo as ideia,
    pa.ideia_status,
    pa.pipeline_status,
    pa.is_piloto,
    pa.data_prevista,
    pa.data_publicacao_planejada,
    pa.hora_publicacao,
    pa.prioridade,
    pa.pipeline_metadata as metadata,
    pa.asset_id,
    pa.asset_tipo,
    pa.caminho_storage,
    pa.provedor,
    pa.duracao_segundos,
    pa.largura_px,
    pa.altura_px,
    pa.tamanho_bytes,
    pa.asset_metadata,
    pa.asset_papel,
    pa.asset_ordem
from pulso_content.vw_pulso_pipeline_com_assets_v2 pa;
-- Garantir permissões
grant select on public.vw_pulso_calendario_publicacao_v2 to anon,
    authenticated;
grant select on public.vw_pulso_pipeline_com_assets_v2 to anon,
    authenticated;