-- 098 · Origem das views dos cortes da DIGIAI (13/11/2026): o robô do MKT já lê o YouTube Analytics dos 2 canais
-- DIGIAI; agora manda também de onde vieram as views, no mesmo formato que o Pulso grava nos canais dele (096):
--   p_origens          {"SHORTS": 120, "YT_SEARCH": 4, "EXT_URL": 2, ...}  (insightTrafficSourceType → views)
--   p_origens_detalhe  {"EXT_URL": {"instagram.com": 2}, "RELATED_VIDEO": {"<videoId>": 3}, ...}  (insightTrafficSourceDetail, top 25)
-- Opcionais, com DEFAULT: a chamada antiga continua valendo. Leitura sem origem não apaga a origem já gravada.
drop function if exists public.leitura_peca_bastidores(uuid, date, integer, integer, integer, integer, numeric, numeric, integer, jsonb);
CREATE OR REPLACE FUNCTION public.leitura_peca_bastidores(p_peca uuid, p_data date, p_views integer, p_likes integer DEFAULT 0, p_comentarios integer DEFAULT 0, p_compartilhamentos integer DEFAULT 0, p_retencao_media_pct numeric DEFAULT NULL::numeric, p_horas_exibicao numeric DEFAULT NULL::numeric, p_cliques_episodio integer DEFAULT NULL::integer, p_retencao_curva jsonb DEFAULT NULL::jsonb, p_origens jsonb DEFAULT NULL::jsonb, p_origens_detalhe jsonb DEFAULT NULL::jsonb)
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
         comentarios, compartilhamentos, retencao_media_pct, horas_exibicao, cliques_episodio, retencao_curva, origens, origens_detalhe, fonte)
  values (v_peca.episodio_id, v_peca.id, case v_peca.destino when 'digiai' then 'digiai' when 'bastidores2' then 'cortes2' else 'cortes' end,
          split_part(v_peca.rede, '_', 1), v_peca.tipo, v_peca.post_id, p_data, p_views, coalesce(p_likes,0),
          coalesce(p_comentarios,0), coalesce(p_compartilhamentos,0), p_retencao_media_pct, p_horas_exibicao,
          p_cliques_episodio, p_retencao_curva, p_origens, p_origens_detalhe, 'digiai_mkt')
  on conflict (episodio_id, coalesce(peca_id, '00000000-0000-0000-0000-000000000000'::uuid), rede, data_ref) do update
     set views = excluded.views, likes = excluded.likes, comentarios = excluded.comentarios,
         compartilhamentos = excluded.compartilhamentos, retencao_media_pct = excluded.retencao_media_pct,
         horas_exibicao = excluded.horas_exibicao, cliques_episodio = excluded.cliques_episodio,
         retencao_curva = excluded.retencao_curva,
         origens = coalesce(excluded.origens, l.origens), origens_detalhe = coalesce(excluded.origens_detalhe, l.origens_detalhe), coletado_em = now();
end $function$;
revoke all on function public.leitura_peca_bastidores(uuid, date, integer, integer, integer, integer, numeric, numeric, integer, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.leitura_peca_bastidores(uuid, date, integer, integer, integer, integer, numeric, numeric, integer, jsonb, jsonb, jsonb) to authenticated;

select has_function_privilege('authenticated','public.leitura_peca_bastidores(uuid, date, integer, integer, integer, integer, numeric, numeric, integer, jsonb, jsonb, jsonb)','execute') as leitura_ok;
