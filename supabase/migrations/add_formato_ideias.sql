-- FORMATO DO CONTEUDO: short (default, tudo que existe) | longo (serie de bastidores, YPP horas).
-- Por que em ideias: pipeline, metricas e agenda ja se ligam por ideia_id — um lugar so.
-- Por que NOT NULL DEFAULT 'short': nenhum registro existente muda de comportamento.
-- Ver _DESPACHO_VIDEOS_LONGOS_2026-08-24.md e docs/40_PRODUTO/19_SERIE_BASTIDORES.md.
alter table pulso_content.ideias
  add column if not exists formato text not null default 'short'
  check (formato in ('short','longo'));

comment on column pulso_content.ideias.formato is
  'short = esteira automatica (grade 2/dia, 5 redes). longo = serie de bastidores YouTube, FORA da esteira automatica (roteador, auto-agendar e cron ignoram; publicacao deliberada).';

-- Canal da serie de bastidores (idempotente). Fora da grade automatica por design:
-- so entra na agenda quando o formato se provar (criterio de morte: 4 eps < 30% retencao).
insert into pulso_core.canais (nome, slug, descricao, status)
select 'PULSO Bastidores', 'pulso-bastidores-pt',
       'Serie "Como se constroi um canal sozinho" — videos longos (8-12min) de bastidores do proprio PULSO. Caminho das 3.000 horas do YPP.',
       'ATIVO'
where not exists (select 1 from pulso_core.canais where slug='pulso-bastidores-pt');
