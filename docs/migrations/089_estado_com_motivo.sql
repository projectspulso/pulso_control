-- ============================================================
-- 089 — estado_peca_bastidores aceita p_motivo (pedido do digiai_mkt, 05/11/2026)
-- Quando o MKT recusa (domingo, teto, regra da marca), o motivo fica gravado na peça e os dois agentes não
-- precisam se falar para saber por quê.
-- Parâmetro novo NÃO pode criar sobrecarga (template 4-D: a chamada antiga daria "function is not unique"):
-- a assinatura antiga sai na mesma transação; p_motivo tem default, então a chamada antiga continua valendo.
-- Regras: [x] R-043 portão explícito com coalesce  [x] grants  [x] prova da chamada antiga e da nova  [x] reversão
-- Reversão: recriar estado_peca_bastidores(uuid,text,text,text) da 086 e o estado_corte_mkt da 088;
--   alter table pulso_content.corte_publicacoes drop column motivo;
-- ============================================================
begin;

alter table pulso_content.corte_publicacoes add column if not exists motivo text;

drop function if exists public.estado_corte_mkt(uuid,text,text,text);
drop function if exists public.estado_peca_bastidores(uuid,text,text,text);

create function public.estado_peca_bastidores(p_peca uuid, p_estado text, p_post_id text default null, p_url text default null, p_motivo text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from pulso_core.leitores_contrato l where l.auth_user_id = auth.uid() and l.ativo and coalesce(l.app,'') = 'digiai_mkt')
     and not exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo and coalesce(u.papel,'') = 'admin') then
    raise exception 'sem permissão para o contrato dos Bastidores' using errcode = '42501';
  end if;
  if coalesce(p_estado,'') not in ('agendado','publicado','recusado') then
    raise exception 'estado inválido: %', p_estado;
  end if;
  update pulso_content.corte_publicacoes
     set status = p_estado, post_id = coalesce(p_post_id, post_id), url = coalesce(p_url, url),
         motivo = coalesce(p_motivo, motivo),
         publicado_em = case when p_estado = 'publicado' then now() else publicado_em end, atualizado_em = now()
   where id = p_peca and modo = 'job';
  if found then return; end if;
  update pulso_content.episodios
     set metadata = jsonb_set(metadata, '{publicacao}', coalesce(metadata->'publicacao','{}'::jsonb)
                    || jsonb_strip_nulls(jsonb_build_object('estado', p_estado, 'post_id', p_post_id, 'url', p_url, 'motivo', p_motivo, 'atualizado_em', now()))),
         status = case when p_estado = 'publicado' then 'publicado' else status end,
         updated_at = now()
   where id = p_peca;
  if not found then
    raise exception 'peça % não existe', p_peca;
  end if;
end $$;

create function public.estado_corte_mkt(p_job uuid, p_estado text, p_post_id text default null, p_url text default null, p_motivo text default null)
returns void language sql security invoker set search_path = '' as $$ select public.estado_peca_bastidores(p_job, p_estado, p_post_id, p_url, p_motivo) $$;

revoke all on function public.estado_peca_bastidores(uuid,text,text,text,text) from public, anon;
revoke all on function public.estado_corte_mkt(uuid,text,text,text,text) from public, anon;
grant execute on function public.estado_peca_bastidores(uuid,text,text,text,text) to authenticated, service_role;
grant execute on function public.estado_corte_mkt(uuid,text,text,text,text) to authenticated, service_role;

do $$ declare ok boolean; begin
  set local role authenticated;
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000aa","role":"authenticated"}', true);
  -- chamada antiga (4 parâmetros) e nova (5): as duas resolvem (sem "not unique") e as duas barram quem não é leitor
  ok := false; begin perform public.estado_peca_bastidores(gen_random_uuid(), 'recusado', null, null); exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'chamada antiga abriu para quem não é leitor'; end if;
  ok := false; begin perform public.estado_peca_bastidores(gen_random_uuid(), 'recusado', null, null, 'domingo'); exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'chamada nova abriu para quem não é leitor'; end if;
  ok := false; begin perform public.estado_corte_mkt(gen_random_uuid(), 'recusado'); exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'estado_corte_mkt abriu para quem não é leitor'; end if;
  reset role;
end $$;

commit;
