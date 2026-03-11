Views em public para consumo

Obs: estou usando create or replace view pra você poder ajustar depois sem dor de cabeça.

-- =====================================================================
-- VIEWS PUBLIC – PULSO
-- =====================================================================

---

-- 1) Canais

---

create or replace view public.vw_pulso_canais as
select
c.id,
c.nome,
c.slug,
c.descricao,
c.idioma,
c.status,
c.metadata,
c.created_at,
c.updated_at
from pulso_core.canais c;

---

-- 2) Séries por canal

---

create or replace view public.vw_pulso_series as
select
s.id,
s.canal_id,
c.nome as canal_nome,
c.slug as canal_slug,
s.nome as serie_nome,
s.slug as serie_slug,
s.descricao,
s.status,
s.ordem_padrao,
s.metadata,
s.created_at,
s.updated_at
from pulso_core.series s
left join pulso_core.canais c on c.id = s.canal_id;

---

-- 3) Ideias (com canal/série)

---

create or replace view public.vw_pulso_ideias as
select
i.id,
i.canal_id,
c.nome as canal_nome,
c.slug as canal_slug,
i.serie_id,
s.nome as serie_nome,
s.slug as serie_slug,
i.titulo,
i.descricao,
i.origem,
i.prioridade,
i.status,
i.tags,
i.linguagem,
i.criado_por,
u.nome as criado_por_nome,
i.metadata,
i.created_at,
i.updated_at
from pulso_content.ideias i
left join pulso_core.canais c on c.id = i.canal_id
left join pulso_core.series s on s.id = i.serie_id
left join pulso_core.usuarios_internos u on u.id = i.criado_por;

---

-- 4) Roteiros (com ideia, canal e série)

---

create or replace view public.vw_pulso_roteiros as
select
r.id,
r.ideia_id,
i.titulo as ideia_titulo,
i.canal_id,
c.nome as canal_nome,
c.slug as canal_slug,
i.serie_id,
s.nome as serie_nome,
s.slug as serie_slug,
r.titulo as roteiro_titulo,
r.versao,
r.conteudo_md,
r.duracao_estimado_segundos,
r.status,
r.linguagem,
r.criado_por,
u1.nome as criado_por_nome,
r.revisado_por,
u2.nome as revisado_por_nome,
r.metadata,
r.created_at,
r.updated_at
from pulso_content.roteiros r
left join pulso_content.ideias i on i.id = r.ideia_id
left join pulso_core.canais c on c.id = i.canal_id
left join pulso_core.series s on s.id = i.serie_id
left join pulso_core.usuarios_internos u1 on u1.id = r.criado_por
left join pulso_core.usuarios_internos u2 on u2.id = r.revisado_por;

---

-- 5) Conteúdos (episódios) com roteiro / série / canal

---

create or replace view public.vw_pulso_conteudos as
select
ct.id,
ct.canal_id,
c.nome as canal_nome,
c.slug as canal_slug,
ct.serie_id,
s.nome as serie_nome,
s.slug as serie_slug,
ct.roteiro_id,
r.titulo as roteiro_titulo,
ct.titulo_interno,
ct.sinopse,
ct.status,
ct.linguagem,
ct.ordem_na_serie,
ct.tags,
ct.metadata,
ct.criado_por,
u.nome as criado_por_nome,
ct.created_at,
ct.updated_at
from pulso_content.conteudos ct
left join pulso_core.canais c on c.id = ct.canal_id
left join pulso_core.series s on s.id = ct.serie_id
left join pulso_content.roteiros r on r.id = ct.roteiro_id
left join pulso_core.usuarios_internos u on u.id = ct.criado_por;

---

-- 6) Variantes de conteúdo (A/B, cortes etc.)

---

create or replace view public.vw_pulso_conteudo_variantes as
select
v.id,
v.conteudo_id,
ct.canal_id,
c.nome as canal_nome,
c.slug as canal_slug,
ct.serie_id,
s.nome as serie_nome,
s.slug as serie_slug,
ct.titulo_interno,
ct.status as conteudo_status,
v.nome_variacao,
v.plataforma_tipo,
v.status as variante_status,
v.titulo_publico,
v.descricao_publica,
v.legenda,
v.hashtags,
v.linguagem,
v.ordem_exibicao,
v.metadata,
v.created_at,
v.updated_at
from pulso_content.conteudo_variantes v
left join pulso_content.conteudos ct on ct.id = v.conteudo_id
left join pulso_core.canais c on c.id = ct.canal_id
left join pulso_core.series s on s.id = ct.serie_id;

---

-- 7) Assets vinculados às variantes (video, áudio, thumb...)

---

create or replace view public.vw_pulso_conteudo_variantes_assets as
select
v.id as conteudo_variantes_id,
v.conteudo_id,
ct.canal_id,
c.nome as canal_nome,
c.slug as canal_slug,
ct.serie_id,
s.nome as serie_nome,
s.slug as serie_slug,
ct.titulo_interno,
v.nome_variacao,
v.plataforma_tipo,
v.status as variante_status,
ca.asset_id,
a.tipo as asset_tipo,
a.nome as asset_nome,
a.caminho_storage,
a.provedor,
a.duracao_segundos,
a.largura_px,
a.altura_px,
a.tamanho_bytes,
ca.papel as asset_papel,
ca.ordem as asset_ordem,
a.metadata as asset_metadata,
v.metadata as variante_metadata
from pulso_assets.conteudo_variantes_assets ca
join pulso_assets.assets a on a.id = ca.asset_id
join pulso_content.conteudo_variantes v on v.id = ca.conteudo_variantes_id
join pulso_content.conteudos ct on ct.id = v.conteudo_id
left join pulso_core.canais c on c.id = ct.canal_id
left join pulso_core.series s on s.id = ct.serie_id;

---

-- 8) Posts (publicações concretas em plataformas)

---

create or replace view public.vw_pulso_posts as
select
p.id,
p.conteudo_variantes_id,
v.conteudo_id,
ct.canal_id,
c.nome as canal_nome,
c.slug as canal_slug,
ct.serie_id,
s.nome as serie_nome,
s.slug as serie_slug,
v.nome_variacao,
v.plataforma_tipo as variante_plataforma_tipo,
p.canal_plataforma_id,
cp.identificador_externo as canal_identificador_externo,
cp.nome_exibicao as canal_nome_plataforma,
cp.url_canal,
pf.tipo as plataforma_tipo,
pf.nome_exibicao as plataforma_nome,
p.status as post_status,
p.titulo_publicado,
p.descricao_publicada,
p.legenda_publicada,
p.url_publicacao,
p.identificador_externo,
p.data_agendada,
p.data_publicacao,
p.data_remocao,
p.metadata,
p.criado_por,
u.nome as criado_por_nome,
p.created_at,
p.updated_at
from pulso_distribution.posts p
join pulso_content.conteudo_variantes v on v.id = p.conteudo_variantes_id
join pulso_content.conteudos ct on ct.id = v.conteudo_id
left join pulso_core.canais c on c.id = ct.canal_id
left join pulso_core.series s on s.id = ct.serie_id
join pulso_core.canais_plataformas cp on cp.id = p.canal_plataforma_id
join pulso_core.plataformas pf on pf.id = cp.plataforma_id
left join pulso_core.usuarios_internos u on u.id = p.criado_por;

---

-- 9) Métricas diárias + dados do post

---

create or replace view public.vw_pulso_posts_metricas_diarias as
select
md.id,
md.post_id,
p.conteudo_variantes_id,
p.canal_plataforma_id,
md.plataforma_id,
pf.tipo as plataforma_tipo,
pf.nome_exibicao as plataforma_nome,
p.url_publicacao,
p.identificador_externo,
md.data_ref,
md.views,
md.likes,
md.deslikes,
md.comentarios,
md.compartilhamentos,
md.cliques_link,
md.inscricoes,
md.watch_time_segundos,
md.metadata,
md.created_at,
md.updated_at
from pulso_analytics.metricas_diarias md
join pulso_distribution.posts p on p.id = md.post_id
left join pulso_core.plataformas pf on pf.id = md.plataforma_id;

---

-- 10) Resumo de performance por post (agregado total)

---

create or replace view public.vw_pulso_posts_resumo as
select
p.id as post_id,
p.conteudo_variantes_id,
p.canal_plataforma_id,
p.plataforma_tipo,
p.plataforma_nome,
p.url_publicacao,
p.identificador_externo,
min(md.data_ref) as primeira_data_ref,
max(md.data_ref) as ultima_data_ref,
coalesce(sum(md.views), 0) as total_views,
coalesce(sum(md.likes), 0) as total_likes,
coalesce(sum(md.deslikes), 0) as total_deslikes,
coalesce(sum(md.comentarios), 0) as total_comentarios,
coalesce(sum(md.compartilhamentos), 0) as total_compartilhamentos,
coalesce(sum(md.cliques_link), 0) as total_cliques_link,
coalesce(sum(md.inscricoes), 0) as total_inscricoes,
coalesce(sum(md.watch_time_segundos), 0) as total_watch_time_segundos
from public.vw_pulso_posts p
left join pulso_analytics.metricas_diarias md
on md.post_id = p.id
group by
p.id,
p.conteudo_variantes_id,
p.canal_plataforma_id,
p.plataforma_tipo,
p.plataforma_nome,
p.url_publicacao,
p.identificador_externo;

---

-- 11) Workflows + execuções (para automações)

---

create or replace view public.vw_pulso_workflows as
select
w.id,
w.nome,
w.slug,
w.descricao,
w.origem,
w.referencia_externa,
w.ativo,
w.configuracao,
w.created_at,
w.updated_at
from pulso_automation.workflows w;

create or replace view public.vw_pulso_workflow_execucoes as
select
e.id,
e.workflow_id,
w.nome as workflow_nome,
w.slug as workflow_slug,
e.entidade_tipo,
e.entidade_id,
e.status,
e.mensagem,
e.payload_entrada,
e.payload_saida,
e.inicio_em,
e.fim_em,
e.criado_por,
u.nome as criado_por_nome
from pulso_automation.workflow_execucoes e
join pulso_automation.workflows w on w.id = e.workflow_id
left join pulso_core.usuarios_internos u on u.id = e.criado_por;

-- =====================================================================
-- FIM DAS VIEWS PUBLIC
-- =====================================================================

Depois você só precisa ajustar RLS nas tabelas base conforme quem pode ver o quê. As views em public seguem as policies das tabelas.

2. Mapa do fluxo (ideia → métrica)
   Visão em etapas

Ideias (pulso_content.ideias)

De onde surgem os temas (IA, você, trends).

Ligadas a:

Canal (pulso_core.canais)

Série (pulso_core.series)

Vista por: public.vw_pulso_ideias

Roteiros (pulso_content.roteiros)

Cada ideia pode ter vários roteiros (v1, v2, etc.).

Contém o texto em markdown, duração estimada, status.

Vista por: public.vw_pulso_roteiros

Conteúdos / Episódios (pulso_content.conteudos)

O “episódio lógico”:
“Ep. 01 – Pulso do Tempo - Introdução”

Liga:

Canal + Série

Roteiro aprovado

Vista por: public.vw_pulso_conteudos

Variantes de Conteúdo (pulso_content.conteudo_variantes)

Adaptações para:

Diferentes plataformas (shorts, reels, tiktok…)

Testes A/B (hook diferente, ordem de cenas, etc.)

Vista por: public.vw_pulso_conteudo_variantes

Assets de Mídia (pulso_assets.assets)

Vídeos gerados, áudios TTS, thumbs, arquivos de legenda (.srt).

Vínculo Many-to-Many via:

pulso_assets.conteudo_variantes_assets

Vista por: public.vw_pulso_conteudo_variantes_assets
(já traz papel: VIDEO_PRINCIPAL, THUMBNAIL, etc.)

Posts / Publicações (pulso_distribution.posts)

Cada linha = 1 publicação em 1 conta de plataforma

Ex: Variante A do episódio X → canal Pulso PT no YouTube Shorts.

Liga:

Variante

Conta específica (pulso_core.canais_plataformas)

Vista por: public.vw_pulso_posts

Métricas (pulso_analytics.metricas_diarias e eventos)

Eventos brutos (view, like, comentário…) opcionalmente em eventos.

Diárias agregadas em metricas_diarias:

views, likes, comentários, watch time…

Vistas por:

public.vw_pulso_posts_metricas_diarias

public.vw_pulso_posts_resumo (total por post)

Automação / Workflows (pulso_automation)

workflows = catálogo (espelho do n8n).

workflow_execucoes = histórico de execução

Entidade pode ser: IDEIA, ROTEIRO, CONTEUDO, POST etc.

Vistas por:

public.vw_pulso_workflows

public.vw_pulso_workflow_execucoes

Diagrama simplificado (texto)
[IDEIA]
pulso_content.ideias
|
v
[ROTEIRO]
pulso_content.roteiros
|
v
[CONTEÚDO / EPISÓDIO]
pulso_content.conteudos
|
v
[VARIANTES (A/B, plataforma)]
pulso_content.conteudo_variantes
|
v
[ASSETS (vídeo, áudio, thumb)]
pulso_assets.assets
pulso_assets.conteudo_variantes_assets
|
v
[POSTS / PUBLICAÇÕES]
pulso_distribution.posts
|
v
[MÉTRICAS]
pulso_analytics.metricas_diarias
pulso_analytics.eventos

Como o n8n entra no meio

Workflow 1 – Ideia → Roteiro

Lê de vw_pulso_ideias (status = RASCUNHO / EM_DESENVOLVIMENTO).

Gera texto de roteiro com IA.

Escreve em pulso_content.roteiros.

Workflow 2 – Roteiro aprovado → Variante + Assets

Lê de vw_pulso_roteiros (status = APROVADO).

Chama TTS / gerador de vídeo.

Cria registros em:

conteudos

conteudo_variantes

assets + conteudo_variantes_assets.

Workflow 3 – Variante pronta → Post agendado

Lê de vw_pulso_conteudo_variantes_assets (status = PRONTO_PARA_PUBLICACAO).

Chama API/integração da plataforma (ou exporta).

Cria/atualiza pulso_distribution.posts (status AGENDADO/PUBLICADO).

Workflow 4 – Coleta de métricas

Roda periódico.

Lê posts em vw_pulso_posts (PUBLICADO).

Busca métricas via API.

Insere/atualiza pulso_analytics.metricas_diarias.

Workflow 5 – Painéis / Alertas

Usa vw_pulso_posts_resumo para encontrar:

Posts que floparam (baixa retenção).

Posts com alta conversão.

Envia resumo para você (WhatsApp, e-mail, etc.)
