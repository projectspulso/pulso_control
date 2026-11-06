-- ============================================================
-- 090 — Bastidores na DIGIAI: carrossel de lições (Instagram) e corte técnico horizontal (LinkedIn)
-- Pedido: dono, 05/11/2026 ("pode seguir com os cortes na DIGIAI"), revendo a decisão da manhã (DIGIAI sem corte).
-- Peças PRÓPRIAS da DIGIAI, nunca o mesmo arquivo do canal de cortes: identidade DIGIAI House, sem rosto de IA
-- (T-4: nem avatar nem foto gerada), baixa frequência (T-5: 1 carrossel e 1 LinkedIn por episódio), e nunca no
-- mesmo dia em que aquele corte sai no canal de cortes. Quem publica é o digiai_mkt (job).
-- · tipo ganha carrossel e video; o carrossel leva vários arquivos (arquivos[] e urls_assinadas[])
-- · a view do contrato ganha urls_assinadas; rede ganha linkedin
-- Regras: [x] view security_invoker  [x] grants  [x] sem PII  [x] reversão
-- Reversão: recriar a view da 088; alter table pulso_content.corte_publicacoes drop column arquivos, drop column urls_assinadas;
--   restaurar o check de tipo (corte|story); tirar o destino digiai de cortes_destinos
-- ============================================================
begin;

alter table pulso_content.corte_publicacoes drop constraint if exists corte_publicacoes_tipo_check;
alter table pulso_content.corte_publicacoes add constraint corte_publicacoes_tipo_check check (tipo in ('corte','story','carrossel','video'));
alter table pulso_content.corte_publicacoes
  add column if not exists arquivos text[] not null default '{}',
  add column if not exists urls_assinadas text[] not null default '{}';

update pulso_core.configuracoes set valor = jsonb_set(valor::jsonb, '{destinos}', (valor::jsonb->'destinos') || $j$[
 {"id":"digiai","nome":"DIGIAI","publica":"digiai_mkt","contas_criadas":true,"identidade":"DIGIAI House","sem_rosto_ia":true,
  "pecas":[
   {"tipo":"carrossel","rede":"instagram","a_partir_de":"licao","dias_semana":[2],"hora":"10:00"},
   {"tipo":"video","rede":"linkedin","a_partir_de":"tecnico","dias_semana":[4],"hora":"10:00"}],
  "hashtag_fixa":"#BastidoresDIGIAI","hashtags":["#DIGIAI","#inteligenciaartificial","#automacao"],
  "tom":"empresa construindo com IA: lição prática, tom editorial, sem gíria, sem emoji, número só com data e fonte"}
]$j$::jsonb)::text,
 descricao = 'Destinos da fábrica dos Bastidores: canal de cortes (todos os cortes) e DIGIAI (carrossel de lições + corte técnico horizontal, dono 05/11/2026). O digiai_mkt publica tudo.',
 updated_at = now()
 where chave = 'cortes_destinos' and not (valor::jsonb->'destinos') @> '[{"id":"digiai"}]';

drop view if exists pulso_content.v_bastidores_pecas_prontas;
create view pulso_content.v_bastidores_pecas_prontas with (security_invoker = true) as
  select p.id                 as peca_id,
         p.tipo,
         p.destino,
         case when p.destino = 'digiai' then 'digiai' else 'cortes' end as canal,
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
         p.urls_assinadas,
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
         '{}'::text[],
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
