-- ============================================================
-- 076 — trava atômica de publicação por (ideia, rede)
-- Pedido: dono, 03/11/2026 ("verificação completa do código e corrigir tudo"). Achado da revisão:
--   a idempotência de /api/automation/publicar era "lê e depois grava" (20-50s de upload no meio);
--   duplo clique ou botão + cron no mesmo minuto publicavam duas vezes.
-- Regras: [x] R-044 tabela no schema do domínio  [x] só service_role escreve  [x] reversão abaixo
-- Reversão: drop table pulso_content.publicacao_trava;
-- ============================================================
begin;

create table if not exists pulso_content.publicacao_trava (
  ideia_id   uuid not null,
  plataforma text not null,
  criado_em  timestamptz not null default now(),
  post_id    text,          -- preenchido quando o post saiu e o registro em metricas_publicacao falhou
  url        text,
  primary key (ideia_id, plataforma)
);
comment on table pulso_content.publicacao_trava is
  'Uma linha por publicação em andamento. PK impede a segunda chamada; com post_id = já publicado sem registro (não republicar).';

alter table pulso_content.publicacao_trava enable row level security;
revoke all on pulso_content.publicacao_trava from public, anon, authenticated;
grant select, insert, update, delete on pulso_content.publicacao_trava to service_role;

commit;
