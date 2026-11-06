-- ============================================================
-- 087 — Contrato dos Bastidores: cada peça diz o DESTINO (conta onde sai)
-- Antes de mandar o contrato ao digiai_mkt (05/11/2026): hoje só existe o canal de cortes, mas o dono já
-- perguntou se a DIGIAI deve receber cortes também. Com o destino na peça, um destino novo não muda o contrato.
-- Regras: [x] view security_invoker na definição  [x] grants  [x] reversão (recriar a view da 086)
-- ============================================================
begin;

drop view if exists pulso_content.v_bastidores_pecas_prontas;
create view pulso_content.v_bastidores_pecas_prontas with (security_invoker = true) as
  select p.id                 as peca_id,
         p.tipo,
         p.destino,
         e.codigo             as episodio,
         e.titulo             as episodio_titulo,
         c.numero             as corte_numero,
         p.rede,
         p.agendado_para      as data_sugerida,
         p.titulo,
         p.legenda,
         p.hashtags,
         p.video_url_assinada as url_assinada,
         p.url_expira,
         null::text           as capa_url,
         e.metadata->'fontes' as fontes,
         p.status
    from pulso_content.corte_publicacoes p
    join pulso_content.episodio_cortes c on c.id = p.corte_id
    join pulso_content.episodios e on e.id = c.episodio_id
   where p.modo = 'job' and p.status in ('planejado','agendado')
  union all
  select e.id, 'ficha_longo', 'principal', e.codigo, e.titulo, null, 'youtube_principal',
         nullif(e.metadata->'publicacao'->>'data','')::timestamptz,
         coalesce(e.metadata->'textos'->'youtube'->>'titulo', e.titulo),
         e.metadata->'textos'->'youtube'->>'descricao',
         coalesce(array(select jsonb_array_elements_text(e.metadata->'textos'->'youtube'->'tags')), '{}'),
         e.metadata->'publicacao'->>'video_url_assinada',
         nullif(e.metadata->'publicacao'->>'url_expira','')::timestamptz,
         e.metadata->'publicacao'->>'capa_url_assinada',
         e.metadata->'fontes', e.status
    from pulso_content.episodios e
   where e.status = 'pronto_publicacao';
revoke all on pulso_content.v_bastidores_pecas_prontas from public, anon;
grant select on pulso_content.v_bastidores_pecas_prontas to authenticated, service_role;

do $$ begin
  set local role authenticated;
  perform 1 from pulso_content.v_bastidores_pecas_prontas limit 1;
  reset role;
end $$;

commit;
