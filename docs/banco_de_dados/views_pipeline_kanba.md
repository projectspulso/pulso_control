create or replace view pulso_content.vw_pipeline_calendario_publicacao as
select
p.id as pipeline_id,
p.ideia_id,
p.roteiro_id,
c.id as canal_id,
c.nome as canal,
s.id as serie_id,
s.nome as serie,
i.titulo as ideia,
i.status as ideia_status,
r.status as roteiro_status,
p.status as pipeline_status,
p.is_piloto,
p.data_prevista,
p.data_publicacao_planejada,
(p.data_publicacao_planejada::time) as hora_publicacao,
p.prioridade,
p.metadata
from pulso_content.pipeline_producao p
join pulso_content.ideias i on i.id = p.ideia_id
join pulso_core.canais c on c.id = i.canal_id
join pulso_core.series s on s.id = i.serie_id
left join pulso_content.roteiros r on r.id = p.roteiro_id
where p.data_publicacao_planejada is not null
order by
p.data_publicacao_planejada,
canal,
serie,
p.prioridade desc;

create or replace view pulso_content.vw_pipeline_kanban as
select
p.id as pipeline_id,
p.ideia_id,
p.roteiro_id,
c.id as canal_id,
c.nome as canal,
s.id as serie_id,
s.nome as serie,
i.titulo as ideia,
i.status as ideia_status,
r.status as roteiro_status,
p.status as pipeline_status,
p.is_piloto,
p.data_prevista,
p.data_publicacao_planejada,
(p.data_publicacao_planejada::time) as hora_publicacao,
p.prioridade,
p.metadata
from pulso_content.pipeline_producao p
join pulso_content.ideias i on i.id = p.ideia_id
join pulso_core.canais c on c.id = i.canal_id
join pulso_core.series s on s.id = i.serie_id
left join pulso_content.roteiros r on r.id = p.roteiro_id
order by
p.status,
c.nome,
s.nome,
p.prioridade desc;
