-- 073_numero_video_sem_colisao.sql — 2026-09-23
--
-- O NÚMERO DO VÍDEO (#pulsoNNN) SAÍA REPETIDO. O número liga o mesmo vídeo entre as redes (vai na
-- legenda) e dá nome à pasta e ao arquivo do render. Era calculado na rota gerar-roteiro como
-- "maior número existente + 1". Duas chamadas ao mesmo tempo leem o mesmo máximo e recebem o mesmo
-- número. Medido em 23/09: #246 em TRÊS vídeos (os 3 roteiros do teste de Espaço, pedidos em
-- paralelo) e #230 em dois (18/09). Nenhum tinha sido publicado nem renderizado.
--
-- A SAÍDA: uma sequência do Postgres, que reserva o número no instante da chamada, fora da
-- transação — duas chamadas nunca recebem o mesmo. A função ainda confere o máximo real das três
-- fontes (roteiros, ideias, pipeline) antes de avançar: se alguém gravar um número à mão acima da
-- sequência, ela pula para depois dele em vez de colidir. O lock serializa só essa conferência.
--
-- ACESSO: só service_role (as rotas de API). Nem anon nem authenticated executam — o número é
-- atribuído pelo servidor, nunca pelo navegador.

create sequence if not exists pulso_content.numero_video_seq;

create or replace function pulso_content.proximo_numero_video()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  m bigint;
  s bigint;
begin
  perform pg_advisory_xact_lock(hashtext('pulso_content.numero_video'));
  select greatest(
    coalesce((select max((metadata->>'numero')::bigint) from pulso_content.roteiros where metadata->>'numero' ~ '^\d+$'), 0),
    coalesce((select max((metadata->>'numero')::bigint) from pulso_content.ideias where metadata->>'numero' ~ '^\d+$'), 0),
    coalesce((select max((metadata->>'numero')::bigint) from pulso_content.pipeline_producao where metadata->>'numero' ~ '^\d+$'), 0)
  ) into m;
  select case when is_called then last_value else last_value - 1 end into s from pulso_content.numero_video_seq;
  if m > s then
    perform setval('pulso_content.numero_video_seq', m, true);
  end if;
  return nextval('pulso_content.numero_video_seq')::integer;
end;
$$;

revoke all on function pulso_content.proximo_numero_video() from public, anon, authenticated;
grant execute on function pulso_content.proximo_numero_video() to service_role;
revoke all on sequence pulso_content.numero_video_seq from public, anon, authenticated;
grant usage, select, update on sequence pulso_content.numero_video_seq to service_role;
