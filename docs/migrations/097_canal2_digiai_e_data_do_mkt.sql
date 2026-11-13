-- 097 · Canal 2 de cortes da DIGIAI (@bastidoresdigiai) e data real escolhida pelo robô do MKT (13/11/2026)
-- Contrato combinado com o digiai_mkt (Cockpit/sessoes/_PARA_MKT_2026-11-13-pulso-canal2.md):
--   destino 'bastidores2' nas peças  →  canal 'cortes2' nas leituras e nos seguidores
--   estado_peca_bastidores ganha p_quando (opcional): o MKT grava a hora real em agendado_para

drop function if exists public.estado_peca_bastidores(uuid, text, text, text, text);
create or replace function public.estado_peca_bastidores(p_peca uuid, p_estado text, p_post_id text default null,
  p_url text default null, p_motivo text default null, p_quando timestamptz default null)
returns void language plpgsql security definer set search_path to '' as $function$
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
         motivo = coalesce(p_motivo, motivo), agendado_para = coalesce(p_quando, agendado_para),
         publicado_em = case when p_estado = 'publicado' then coalesce(p_quando, now()) else publicado_em end, atualizado_em = now()
   where id = p_peca and modo = 'job';
  if found then return; end if;
  update pulso_content.episodios
     set metadata = jsonb_set(metadata, '{publicacao}', coalesce(metadata->'publicacao','{}'::jsonb)
                    || jsonb_strip_nulls(jsonb_build_object('estado', p_estado, 'post_id', p_post_id, 'url', p_url, 'motivo', p_motivo,
                                                            'agendado_para', p_quando, 'atualizado_em', now()))),
         status = case when p_estado = 'publicado' then 'publicado' else status end,
         updated_at = now()
   where id = p_peca;
  if not found then
    raise exception 'peça % não existe', p_peca;
  end if;
end $function$;
revoke all on function public.estado_peca_bastidores(uuid, text, text, text, text, timestamptz) from public, anon;
grant execute on function public.estado_peca_bastidores(uuid, text, text, text, text, timestamptz) to authenticated;

create or replace function public.seguidores_bastidores(p_canal text, p_rede text, p_data date, p_seguidores integer)
returns void language plpgsql security definer set search_path to '' as $function$
begin
  if not exists (select 1 from pulso_core.leitores_contrato l where l.auth_user_id = auth.uid() and l.ativo and coalesce(l.app,'') = 'digiai_mkt')
     and not exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo and coalesce(u.papel,'') = 'admin') then
    raise exception 'sem permissão para o contrato dos Bastidores' using errcode = '42501';
  end if;
  if coalesce(p_canal,'') not in ('principal','cortes','cortes2','digiai') or p_data is null or coalesce(p_seguidores,-1) < 0 then
    raise exception 'contagem inválida';
  end if;
  insert into pulso_analytics.seguidores_longos (canal, rede, data_ref, seguidores, fonte)
  values (p_canal, p_rede, p_data, p_seguidores, 'digiai_mkt')
  on conflict (canal, rede, data_ref) do update set seguidores = excluded.seguidores, coletado_em = now();
end $function$;

-- leitura do MKT: peça do destino bastidores2 entra como canal cortes2
CREATE OR REPLACE FUNCTION public.leitura_peca_bastidores(p_peca uuid, p_data date, p_views integer, p_likes integer DEFAULT 0, p_comentarios integer DEFAULT 0, p_compartilhamentos integer DEFAULT 0, p_retencao_media_pct numeric DEFAULT NULL::numeric, p_horas_exibicao numeric DEFAULT NULL::numeric, p_cliques_episodio integer DEFAULT NULL::integer, p_retencao_curva jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_peca record;
begin
  if not exists (select 1 from pulso_core.leitores_contrato l where l.auth_user_id = auth.uid() and l.ativo and coalesce(l.app,'') = 'digiai_mkt')
     and not exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo and coalesce(u.papel,'') = 'admin') then
    raise exception 'sem permissão para o contrato dos Bastidores' using errcode = '42501';
  end if;
  if p_data is null or p_data > current_date or coalesce(p_views, -1) < 0 then
    raise exception 'leitura inválida: data % views %', p_data, p_views;
  end if;
  select p.id, p.rede, p.tipo, p.destino, p.post_id, c.episodio_id into v_peca
    from pulso_content.corte_publicacoes p join pulso_content.episodio_cortes c on c.id = p.corte_id
   where p.id = p_peca and p.modo = 'job';
  if not found then raise exception 'peça % não existe', p_peca; end if;
  insert into pulso_analytics.leituras_longos as l (episodio_id, peca_id, canal, rede, tipo, post_id, data_ref, views, likes,
         comentarios, compartilhamentos, retencao_media_pct, horas_exibicao, cliques_episodio, retencao_curva, fonte)
  values (v_peca.episodio_id, v_peca.id, case v_peca.destino when 'digiai' then 'digiai' when 'bastidores2' then 'cortes2' else 'cortes' end,
          split_part(v_peca.rede, '_', 1), v_peca.tipo, v_peca.post_id, p_data, p_views, coalesce(p_likes,0),
          coalesce(p_comentarios,0), coalesce(p_compartilhamentos,0), p_retencao_media_pct, p_horas_exibicao,
          p_cliques_episodio, p_retencao_curva, 'digiai_mkt')
  on conflict (episodio_id, coalesce(peca_id, '00000000-0000-0000-0000-000000000000'::uuid), rede, data_ref) do update
     set views = excluded.views, likes = excluded.likes, comentarios = excluded.comentarios,
         compartilhamentos = excluded.compartilhamentos, retencao_media_pct = excluded.retencao_media_pct,
         horas_exibicao = excluded.horas_exibicao, cliques_episodio = excluded.cliques_episodio,
         retencao_curva = excluded.retencao_curva, coletado_em = now();
end $function$;

-- trava de canal: cortes2 nas leituras e nos seguidores
alter table pulso_analytics.leituras_longos drop constraint leituras_longos_canal_check;
alter table pulso_analytics.leituras_longos add constraint leituras_longos_canal_check
  check (canal = any (array['principal','cortes','cortes2','digiai','pulso_cortes','pulso_bastidores']));
alter table pulso_analytics.seguidores_longos drop constraint seguidores_longos_canal_check;
alter table pulso_analytics.seguidores_longos add constraint seguidores_longos_canal_check
  check (canal = any (array['principal','cortes','cortes2','digiai','pulso_cortes','pulso_bastidores']));

-- view do MKT: bastidores2 sai como canal cortes2; e o longo que o Pulso já subiu (publicar_longo.py grava post_id)
-- não aparece mais como ficha para o robô do MKT, senão o episódio subiria duas vezes
create or replace view pulso_content.v_bastidores_pecas_prontas with (security_invoker = true) as
 SELECT p.id AS peca_id,
    p.tipo,
    p.destino,
        CASE p.destino
            WHEN 'digiai'::text THEN 'digiai'::text
            WHEN 'bastidores2'::text THEN 'cortes2'::text
            ELSE 'cortes'::text
        END AS canal,
    e.codigo AS episodio,
    e.titulo AS episodio_titulo,
    c.numero AS corte_numero,
    split_part(p.rede, '_'::text, 1) AS rede,
        CASE
            WHEN (p.rede ~~ '%\_antes'::text) THEN 'antes'::text
            WHEN (p.rede ~~ '%\_depois'::text) THEN 'depois'::text
            ELSE NULL::text
        END AS momento,
    p.agendado_para AS data_sugerida,
    p.titulo,
    p.legenda,
    p.hashtags,
    p.video_url_assinada AS url_assinada,
    p.urls_assinadas,
    p.url_expira,
    NULL::text AS capa_url,
    (e.metadata -> 'fontes'::text) AS fontes,
    p.status
   FROM ((pulso_content.corte_publicacoes p
     JOIN pulso_content.episodio_cortes c ON ((c.id = p.corte_id)))
     JOIN pulso_content.episodios e ON ((e.id = c.episodio_id)))
  WHERE ((p.modo = 'job'::text) AND (p.status = ANY (ARRAY['planejado'::text, 'agendado'::text])))
UNION ALL
 SELECT e.id AS peca_id,
    'ficha_longo'::text AS tipo,
    'bastidores'::text AS destino,
    'principal'::text AS canal,
    e.codigo AS episodio,
    e.titulo AS episodio_titulo,
    NULL::integer AS corte_numero,
    'youtube'::text AS rede,
    NULL::text AS momento,
    (NULLIF(((e.metadata -> 'publicacao'::text) ->> 'data'::text), ''::text))::timestamp with time zone AS data_sugerida,
    COALESCE((((e.metadata -> 'textos'::text) -> 'youtube'::text) ->> 'titulo'::text), e.titulo) AS titulo,
    (((e.metadata -> 'textos'::text) -> 'youtube'::text) ->> 'descricao'::text) AS legenda,
    COALESCE(ARRAY( SELECT jsonb_array_elements_text((((e.metadata -> 'textos'::text) -> 'youtube'::text) -> 'tags'::text)) AS jsonb_array_elements_text), '{}'::text[]) AS hashtags,
    ((e.metadata -> 'publicacao'::text) ->> 'video_url_assinada'::text) AS url_assinada,
    '{}'::text[] AS urls_assinadas,
    (NULLIF(((e.metadata -> 'publicacao'::text) ->> 'url_expira'::text), ''::text))::timestamp with time zone AS url_expira,
    ((e.metadata -> 'publicacao'::text) ->> 'capa_url_assinada'::text) AS capa_url,
    (e.metadata -> 'fontes'::text) AS fontes,
    e.status
   FROM pulso_content.episodios e
  WHERE (e.status = 'pronto_publicacao'::text) AND (((e.metadata -> 'publicacao'::text) ->> 'post_id'::text) IS NULL);

-- prova: o leitor do MKT (authenticated) enxerga as 3 funções
select has_function_privilege('authenticated','public.estado_peca_bastidores(uuid,text,text,text,text,timestamptz)','execute') as estado_ok,
       has_function_privilege('authenticated','public.seguidores_bastidores(text,text,date,integer)','execute') as seguidores_ok,
       has_function_privilege('authenticated','public.leitura_peca_bastidores(uuid,date,integer,integer,integer,integer,numeric,numeric,integer,jsonb)','execute') as leitura_ok;
