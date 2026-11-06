-- ============================================================
-- 086 — Bastidores v2: o Pulso é só fábrica; o digiai_mkt publica TUDO
-- Decisão do dono (05/11/2026, direto ao Geral): canal principal no YouTube só com o longo; canais irmãos
-- de cortes nas 5 redes, sempre apontando para o principal; DIGIAI e pessoal não recebem corte.
-- Desenho: Cockpit/bastidores/DESENHO-canais-stories-divisao-2026-11-05.md (v2). Substitui a divisão da 085.
-- · cortes_destinos v2: um destino só, o canal de cortes, publicado pelo digiai_mkt (todas as redes = job)
-- · corte_publicacoes ganha tipo (corte|story), titulo, hashtags
-- · contrato: view v_bastidores_pecas_prontas (corte | story | ficha_longo, sem PII) + RPC de leitura e
--   RPC de estado que serve às três (a ficha do longo devolve estado no metadata do episódio)
-- · sai a RPC cortes_para_mkt e a view v_cortes_job_mkt (085), ainda sem uso
-- Regras: [x] R-044  [x] R-043 definer com portão explícito e coalesce  [x] view security_invoker
--   [x] grants na mesma migration  [x] sem PII  [x] reversão
-- Reversão: drop function public.estado_peca_bastidores(uuid,text,text,text); drop function public.bastidores_pecas_para_mkt();
--   drop view pulso_content.v_bastidores_pecas_prontas; (recriar a 085 se for preciso voltar)
-- ============================================================
begin;

alter table pulso_content.corte_publicacoes
  add column if not exists tipo text not null default 'corte' check (tipo in ('corte','story')),
  add column if not exists titulo text not null default '',
  add column if not exists hashtags text[] not null default '{}';

drop function if exists public.cortes_para_mkt();
drop function if exists public.estado_corte_mkt(uuid,text,text,text);
drop view if exists pulso_content.v_cortes_job_mkt;

update pulso_core.configuracoes set valor = $j${"atualizadoEm":"2026-11-05","versao":2,
 "decisao":"dono 05/11 (ao Geral): principal só com o longo; cortes só nos canais de cortes; o digiai_mkt publica tudo; o Pulso é fábrica",
 "principal":{"nome":"Bastidores DIGIAI","arroba":"@bastidoresdigiai","url":"youtube.com/@bastidoresdigiai","nome_em_decisao":true},
 "destinos":[
  {"id":"bastidores_cortes","nome":"Bastidores DIGIAI Cortes","arroba":"@bastidoresdigiaicortes","nome_em_decisao":true,
   "publica":"digiai_mkt","contas_criadas":false,"tipos":["gancho","historia","tecnico","licao"],"so_rosto_real":false,
   "selo":"BASTIDORES DIGIAI","final":["EPISÓDIO COMPLETO","no YouTube"],"rodape":"@bastidoresdigiai",
   "hashtag_fixa":"#BastidoresDIGIAI",
   "redes":{"youtube":"job","instagram":"job","facebook":"job","tiktok":"job","kwai":"job","instagram_story":"job","facebook_story":"job"},
   "cadencia":{"dias_semana":[1,2,3,4,5,6],"hora":"12:00","trailer":"vespera","estreia_dia_semana":4,"estreia_hora":"18:00","stories_por_dia":2},
   "tom":"descoberta: gancho direto, curiosidade, convida para o episódio completo no canal principal"}
 ],
 "regras":["domingo nada sai","cortes só nos canais de cortes","toda peça aponta para o principal (cartão final, 1ª linha da legenda, #BastidoresDIGIAI)","DIGIAI e pessoal não recebem corte, só um ponteiro por episódio pelo digiai_mkt","no X não se replica"]}$j$::text,
 descricao = 'Destinos da fábrica de cortes v2 (dono 05/11/2026): o digiai_mkt publica tudo; o Pulso só produz.', updated_at = now()
 where chave = 'cortes_destinos';

create or replace view pulso_content.v_bastidores_pecas_prontas with (security_invoker = true) as
  select p.id                 as peca_id,
         p.tipo,
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
  select e.id,
         'ficha_longo',
         e.codigo,
         e.titulo,
         null,
         'youtube_principal',
         nullif(e.metadata->'publicacao'->>'data','')::timestamptz,
         coalesce(e.metadata->'textos'->'youtube'->>'titulo', e.titulo),
         e.metadata->'textos'->'youtube'->>'descricao',
         coalesce(array(select jsonb_array_elements_text(e.metadata->'textos'->'youtube'->'tags')), '{}'),
         e.metadata->'publicacao'->>'video_url_assinada',
         nullif(e.metadata->'publicacao'->>'url_expira','')::timestamptz,
         e.metadata->'publicacao'->>'capa_url_assinada',
         e.metadata->'fontes',
         e.status
    from pulso_content.episodios e
   where e.status = 'pronto_publicacao';
revoke all on pulso_content.v_bastidores_pecas_prontas from public, anon;
grant select on pulso_content.v_bastidores_pecas_prontas to authenticated, service_role;

create or replace function public.bastidores_pecas_para_mkt()
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from pulso_core.leitores_contrato l where l.auth_user_id = auth.uid() and l.ativo and coalesce(l.app,'') = 'digiai_mkt')
     and not exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo and coalesce(u.papel,'') = 'admin') then
    raise exception 'sem permissão para o contrato dos Bastidores' using errcode = '42501';
  end if;
  return coalesce((select jsonb_agg(to_jsonb(v) order by v.data_sugerida nulls last) from pulso_content.v_bastidores_pecas_prontas v), '[]'::jsonb);
end $$;

create or replace function public.estado_peca_bastidores(p_peca uuid, p_estado text, p_post_id text default null, p_url text default null)
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
         publicado_em = case when p_estado = 'publicado' then now() else publicado_em end, atualizado_em = now()
   where id = p_peca and modo = 'job';
  if found then return; end if;
  -- a ficha do longo: o estado vai para o metadata do episódio (quem publica o longo é o dono, R-011)
  update pulso_content.episodios
     set metadata = jsonb_set(metadata, '{publicacao}', coalesce(metadata->'publicacao','{}'::jsonb)
                    || jsonb_strip_nulls(jsonb_build_object('estado', p_estado, 'post_id', p_post_id, 'url', p_url, 'atualizado_em', now()))),
         status = case when p_estado = 'publicado' then 'publicado' else status end,
         updated_at = now()
   where id = p_peca;
  if not found then
    raise exception 'peça % não existe', p_peca;
  end if;
end $$;

revoke all on function public.bastidores_pecas_para_mkt() from public, anon;
revoke all on function public.estado_peca_bastidores(uuid,text,text,text) from public, anon;
grant execute on function public.bastidores_pecas_para_mkt() to authenticated, service_role;
grant execute on function public.estado_peca_bastidores(uuid,text,text,text) to authenticated, service_role;

do $$ declare ok boolean := false; begin
  set local role authenticated;
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000aa","role":"authenticated"}', true);
  begin perform public.bastidores_pecas_para_mkt(); exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'bastidores_pecas_para_mkt abriu para quem não é leitor'; end if;
  ok := false;
  begin perform public.estado_peca_bastidores(gen_random_uuid(), 'publicado'); exception when insufficient_privilege then ok := true; end;
  if not ok then raise exception 'estado_peca_bastidores abriu para quem não é leitor'; end if;
  reset role;
end $$;

commit;
