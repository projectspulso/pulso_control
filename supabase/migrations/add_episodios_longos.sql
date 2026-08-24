-- TRILHA DE VIDEOS LONGOS (estilo limelight: episodio e entidade de primeira classe).
-- Serie -> Temporada -> Episodio, com esteira PROPRIA (capturas/montagem, nao cenas Veo) e
-- maquina de estados propria. NAO toca na esteira de Shorts: a ponte com o pipeline so
-- acontece em pronto_publicacao, criando ideia formato=longo (que as cercas ja isolam).
-- Ver _DESPACHO_VIDEOS_LONGOS_2026-08-24.md e docs/40_PRODUTO/19_SERIE_BASTIDORES.md.

create table if not exists pulso_content.episodios (
  id uuid primary key default gen_random_uuid(),
  serie_id uuid not null references pulso_core.series(id),
  temporada int not null default 1 check (temporada >= 1),
  numero int not null check (numero >= 1),
  codigo text not null check (codigo ~ '^T[0-9]{2}E[0-9]{2}$'),
  titulo text not null,
  gancho text,
  material text,                    -- a prova real que sustenta o episodio (regra: numero falado = tela)
  roteiro_md text,
  checklist jsonb not null default '[]'::jsonb,   -- blocos [TELA]: {item, feito}
  status text not null default 'planejado' check (status in
    ('planejado','roteiro_ok','narracao_gerada','capturas_coletadas','montado','em_revisao','pronto_publicacao','publicado')),
  ordem_producao int,               -- 01 -> 04 -> 02 -> 09... (decisao editorial do doc)
  ideia_id uuid references pulso_content.ideias(id),  -- ponte criada SO ao ficar pronto
  audio_url text,
  video_url text,
  data_prevista date,
  notas text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (serie_id, temporada, numero)
);
create index if not exists idx_episodios_status on pulso_content.episodios (status);

grant all on pulso_content.episodios to service_role;
grant select on pulso_content.episodios to anon;
grant select, insert, update on pulso_content.episodios to authenticated;

-- Serie Bastidores (idempotente), no canal PULSO Bastidores
insert into pulso_core.series (canal_id, nome, slug, descricao)
select c.id, 'Como se constrói um canal sozinho', 'bastidores-t1',
       'Bastidores do PULSO em vídeos longos (8-12min): o painel de verdade, com os números na tela. Caminho das 3.000 horas do YPP.'
from pulso_core.canais c
where c.slug = 'pulso-bastidores-pt'
  and not exists (select 1 from pulso_core.series where slug = 'bastidores-t1');

-- Temporada 1: os 10 episodios do doc, com gancho, material real e ordem de producao.
insert into pulso_content.episodios (serie_id, temporada, numero, codigo, titulo, gancho, material, ordem_producao, notas)
select s.id, 1, v.numero, v.codigo, v.titulo, v.gancho, v.material, v.ordem, v.notas
from pulso_core.series s,
(values
  (1,'T01E01','O bug de um caractere que parou tudo por 6 meses','Uma aspa faltando congelou o sistema inteiro e ninguém percebeu','changelog.md linha 79 — pg_cron job 9, JSON malformado',1,'PILOTO. Roteiro completo em docs/40_PRODUTO/19_SERIE_BASTIDORES.md'),
  (2,'T01E02','Quanto custa, de verdade, publicar 1 vídeo por dia','Extrato real: R$ 2.168,48 por 8.144 créditos','pulso_guard.py, ledger de render, cascata de custo',3,null),
  (3,'T01E03','Eu estava contando o custo errado — em 2,3×','O painel mentia e ninguém sabia','gen_scenes.py linhas 386-392, correção de 01/08',6,null),
  (4,'T01E04','O Facebook estrangula quem publica por API — o teste A/B','0-2 plays em 13h × 232 plays em 40 min','teste de 11/07 + reteste de 19/08 (5 posts = 4 views), decisão de FB manual',2,null),
  (5,'T01E05','Tomei shadowban por um detalhe idiota','Marca d''água de outra rede','histórico TikTok',8,null),
  (6,'T01E06','O algoritmo me disse o que escrever — e eu não gostei','História/arqueologia detém 6 de 6 estouros; tecnologia morreu','módulo /decisor, placar tema×rede',5,null),
  (7,'T01E07','Como se faz uma voz que não existe','Voice Design do zero + travas de sotaque pt-BR','ai-clients.ts, previous_text como âncora',7,null),
  (8,'T01E08','Descobri que minha marca já é de outra empresa','Editora Globo tem 5 registros PULSO em vigor','busca INPI de 24/08/2026',9,'TRAVADO: não gravar antes do parecer do advogado de marcas'),
  (9,'T01E09','O gate que eu estava perseguindo era o errado','Mirava 3M de views; o gate real estava a 17 seguidores','auditoria de 23-24/08, painéis YouTube e Meta',4,null),
  (10,'T01E10','100 dias publicando todo dia: o que sobrou','Balanço honesto, números finais, o que continua','banco, série leituras_metricas',10,'Gravar só depois do dia 100 (17/09)')
) as v(numero,codigo,titulo,gancho,material,ordem,notas)
where s.slug = 'bastidores-t1'
  and not exists (select 1 from pulso_content.episodios e where e.serie_id = s.id and e.temporada = 1 and e.numero = v.numero);
