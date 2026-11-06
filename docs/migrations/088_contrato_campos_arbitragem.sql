-- ============================================================
-- 088 — Contrato dos Bastidores nos campos da arbitragem do Geral (05/11/2026, Cockpit/controle/arbitragem.md)
-- · destino = 'bastidores' (o id do canal de cortes muda de 'bastidores_cortes'); DIGIAI e pessoal não recebem corte
-- · rede só entre youtube|instagram|tiktok|facebook|kwai; story vira tipo 'story' com momento antes|depois
--   (na tabela a rede continua 'instagram_story_antes' etc. para a chave única; o contrato normaliza na view)
-- · ficha do longo: rede 'youtube', canal 'principal'; as peças de corte e story: canal 'cortes'
-- · valem os nomes do mecanismo que o MKT conhece: cortes_para_mkt() e estado_corte_mkt() voltam, como portas
--   para as funções da 086 (mesmo portão, mesma prova)
-- Regras: [x] view security_invoker  [x] RPC definer com portão explícito  [x] grants  [x] reversão
-- Reversão: drop function public.cortes_para_mkt(); drop function public.estado_corte_mkt(uuid,text,text,text);
--   recriar a view da 087; update cortes_destinos id de volta para 'bastidores_cortes'
-- ============================================================
begin;

update pulso_core.configuracoes set valor = jsonb_set(valor::jsonb, '{destinos,0,id}', '"bastidores"')::text, updated_at = now()
 where chave = 'cortes_destinos';
update pulso_content.corte_publicacoes set destino = 'bastidores' where destino = 'bastidores_cortes';

drop view if exists pulso_content.v_bastidores_pecas_prontas;
create view pulso_content.v_bastidores_pecas_prontas with (security_invoker = true) as
  select p.id                 as peca_id,
         p.tipo,
         p.destino,
         'cortes'::text       as canal,
         e.codigo             as episodio,
         e.titulo             as episodio_titulo,
         c.numero             as corte_numero,
         split_part(p.rede, '_', 1) as rede,
         case when p.rede like '%\_antes' then 'antes' when p.rede like '%\_depois' then 'depois' end as momento,
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
  select e.id, 'ficha_longo', 'bastidores', 'principal', e.codigo, e.titulo, null, 'youtube', null,
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

-- os nomes que o MKT conhece (mecanismo validado pelo Geral) passam a ser portas para as funções da 086
create or replace function public.cortes_para_mkt()
returns jsonb language sql security invoker set search_path = '' as $$ select public.bastidores_pecas_para_mkt() $$;
create or replace function public.estado_corte_mkt(p_job uuid, p_estado text, p_post_id text default null, p_url text default null)
returns void language sql security invoker set search_path = '' as $$ select public.estado_peca_bastidores(p_job, p_estado, p_post_id, p_url) $$;
revoke all on function public.cortes_para_mkt() from public, anon;
revoke all on function public.estado_corte_mkt(uuid,text,text,text) from public, anon;
grant execute on function public.cortes_para_mkt() to authenticated, service_role;
grant execute on function public.estado_corte_mkt(uuid,text,text,text) to authenticated, service_role;

do $$ declare ok boolean := false; begin
  set local role authenticated;
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000aa","role":"authenticated"}', true);
  begin perform public.cortes_para_mkt(); exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'cortes_para_mkt abriu para quem não é leitor'; end if;
  ok := false;
  begin perform public.estado_corte_mkt(gen_random_uuid(), 'publicado'); exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'estado_corte_mkt abriu para quem não é leitor'; end if;
  reset role;
end $$;

commit;
