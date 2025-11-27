create or replace view pulso_content.vw_pulso_pipeline_base_v2 as
select
p.id as pipeline_id,
p.conteudo_variantes_id,

-- Canal
coalesce(
ca.nome,
p.metadata->>'canal_nome'
) as canal_nome,

-- Série (por enquanto só via metadata)
coalesce(
p.metadata->>'serie_nome',
co.metadata->>'serie_nome'
) as serie_nome,

-- Ideia / título exibido
cv.titulo_publico as ideia_titulo,

-- Status da ideia (conteúdo) e do pipeline
co.status as ideia_status,
p.status as pipeline_status,

-- Campos do pipeline
p.is_piloto as is_piloto,
p.data_prevista as data_prevista,
p.data_publicacao_planejada as data_publicacao_planejada,
(p.data_publicacao_planejada::time) as hora_publicacao,
p.prioridade as prioridade,
p.metadata as pipeline_metadata

from pulso_content.pipeline_producao p
left join pulso_content.conteudo_variantes cv
on cv.id = p.conteudo_variantes_id
left join pulso_content.conteudos co
on co.id = cv.conteudo_id
left join pulso_core.canais ca
on ca.id = co.canal_id;

create or replace view pulso_content.vw_pulso_pipeline_com_assets_v2 as
select
b.pipeline_id,
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
left join pulso_assets.conteudo_variantes_assets cva
on cva.conteudo_variantes_id = b.conteudo_variantes_id
left join pulso_assets.assets a
on a.id = cva.asset_id;

create or replace view public.vw_pulso_calendario_publicacao_v2 as
select
b.pipeline_id,
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
select
pa.pipeline_id,
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

1. Quais views usar no front

Você pode pensar assim:

a) Calendário / agenda de posts

Use apenas:

public.vw_pulso_calendario_publicacao_v2

Ela já te entrega tudo que precisa para montar a agenda:

pipeline_id

canal

serie

ideia (título da ideia / variação)

ideia_status

pipeline_status

is_piloto

data_prevista

data_publicacao_planejada

hora_publicacao

prioridade

metadata (json pra detalhes extras)

b) Lista com preview / assets (thumb, vídeo, etc.)

Use:

public.vw_pulso_pipeline_com_assets_v2

Ela traz tudo da base + info de asset:

campos de pipeline (mesmos da view de calendário)

asset_id

asset_tipo

caminho_storage

provedor

duracao_segundos, largura_px, altura_px, tamanho_bytes

asset_metadata

asset_papel, asset_ordem

Como ela é “linha por asset”, o front agrupa por pipeline_id quando precisar.

2. Como consumir no Next + Supabase

Vou assumir que você já tem algo assim:

import { supabase } from '@/lib/supabaseClient';

2.1. Buscar calendário de um intervalo de datas

Exemplo: agenda de 01 a 07 de dezembro/2025 só de posts aprovados (isso é front filter, não obrigatoriamente na view):

const { data, error } = await supabase
.from('vw_pulso_calendario_publicacao_v2')
.select('\*')
.gte('data_publicacao_planejada', '2025-12-01T00:00:00')
.lt('data_publicacao_planejada', '2025-12-08T00:00:00')
.order('data_publicacao_planejada', { ascending: true })
.order('hora_publicacao', { ascending: true });

No data você já tem uma lista de:

type CalendarioRow = {
pipeline_id: string;
canal: string;
serie: string | null;
ideia: string;
ideia_status: string;
pipeline_status: string;
is_piloto: boolean | null;
data_prevista: string | null; // ISO
data_publicacao_planejada: string | null; // ISO
hora_publicacao: string | null; // "07:00:00"
prioridade: number | null;
metadata: any; // json
};

2.2. Filtrar por canal, série, etc.
const { data, error } = await supabase
.from('vw_pulso_calendario_publicacao_v2')
.select('\*')
.eq('canal', 'PULSO Mistérios & História')
.gte('data_publicacao_planejada', '2025-12-01T00:00:00')
.lt('data_publicacao_planejada', '2025-12-31T23:59:59')
.order('data_publicacao_planejada', { ascending: true })
.order('hora_publicacao', { ascending: true });

Se quiser filtrar apenas pilotos:

.eq('is_piloto', true)

2.3. Buscar um pipeline com os assets (para tela de detalhe)
const pipelineId = 'fc9a8ceb-d0a6-4679-9b92-bf3978909222';

const { data, error } = await supabase
.from('vw_pulso_pipeline_com_assets_v2')
.select('\*')
.eq('pipeline_id', pipelineId)
.order('asset_ordem', { ascending: true });

Aqui data será um array de linhas com o mesmo pipeline_id, uma por asset.
No front você normalmente faz:

const pipeline = data?.[0]; // metadata principal
const assets = data?.map(row => ({
id: row.asset_id,
tipo: row.asset_tipo,
papel: row.asset_papel,
caminho: row.caminho_storage,
metadata: row.asset_metadata,
ordem: row.asset_ordem,
}));

2.4. Listar tudo que já está “pronto para publicar”

Exemplo: status PRONTO_PUBLICACAO, ordenado por data/hora:

const { data, error } = await supabase
.from('vw_pulso_calendario_publicacao_v2')
.select('\*')
.eq('pipeline_status', 'PRONTO_PUBLICACAO')
.order('data_publicacao_planejada', { ascending: true })
.order('hora_publicacao', { ascending: true });

Essa view já é ótima pra:

painel “fila de posts”

integração futura com n8n / automação (puxar só o que está pronto).

3. Como montar as telas usando só as views
   3.1. Tela 1 – Calendário / Agenda diária

Fonte de dados: vw_pulso_calendario_publicacao_v2

Passos:

No server component ou route handler, buscar por um dia:

const dia = '2025-12-01';

const { data } = await supabase
.from('vw_pulso_calendario_publicacao_v2')
.select('\*')
.gte('data_publicacao_planejada', `${dia}T00:00:00`)
.lt('data_publicacao_planejada', `${dia}T23:59:59`)
.order('hora_publicacao', { ascending: true });

Renderizar uma lista/grids com:

horário → hora_publicacao

canal → canal

série → serie

título → ideia

status (corzinha diferente por pipeline_status)

badge se is_piloto = true

Você nem precisa olhar para assets aqui.

3.2. Tela 2 – Lista “Kanban” de produção

Pode usar a mesma view ou a de assets, dependendo se quer ver thumb ou não.

Coluna “RASCUNHO”, “EM_REVISAO”, “PRONTO_PUBLICACAO”, etc.

Query simples por status:

const { data } = await supabase
.from('vw_pulso_calendario_publicacao_v2')
.select('\*')
.in('pipeline_status', ['RASCUNHO', 'EM_REVISAO', 'PRONTO_PUBLICACAO']);

Se quiser thumb na coluna, troca pra vw_pulso_pipeline_com_assets_v2 e:

filtra no front por asset_papel = 'THUMB' ou algo assim.

3.3. Tela 3 – Detalhe do conteúdo (com assets)

Fonte de dados: vw_pulso_pipeline_com_assets_v2 por pipeline_id.

Faz a query do item único (como mostrei acima).

Usa data[0] para informações gerais do pipeline.

Agrupa os assets:

papel = 'THUMB' → preview de capa

papel = 'VIDEO' → arquivo de vídeo

papel = 'AUDIO' → áudio etc.

No futuro, o n8n só vai popular pulso_assets.\*, mas seu front já está 100% preparado, só começa a aparecer asset quando houver.

4. Permissões / RLS (só pra não esquecer)

Como você decidiu:

tabelas ficam nos seus schemas (pulso_content, pulso_assets, etc.)

views de consumo ficam no public.

Então só precisa garantir que:

grant usage on schema public to anon, authenticated;
grant select on public.vw_pulso_calendario_publicacao_v2 to anon, authenticated;
grant select on public.vw_pulso_pipeline_com_assets_v2 to anon, authenticated;

Se quiser proteger por role, só ajusta quem ganha o GRANT.

Se você quiser, no próximo passo eu posso montar:

um hook React (useCalendarioPulso) consumindo a view
ou

um arquivo de types (PulsoPipelineCalendario.ts) com todos os tipos certinhos pra usar no seu front.
