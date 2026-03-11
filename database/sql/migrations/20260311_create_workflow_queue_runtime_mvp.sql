-- Migration consolidada do runtime do MVP
-- Data de referencia: 11 de marco de 2026
-- Objetivo: criar apenas o objeto comprovadamente ausente no banco real

create schema if not exists pulso_content;

create table if not exists pulso_content.workflow_queue (
  id uuid primary key default gen_random_uuid(),
  workflow_name text not null,
  payload jsonb not null,
  tentativas integer not null default 0,
  max_tentativas integer not null default 3,
  proximo_retry timestamptz,
  erro_ultimo text,
  status text not null check (status in ('pendente', 'processando', 'falha', 'sucesso')) default 'pendente',
  created_at timestamptz not null default now()
);

create index if not exists idx_workflow_queue_status
  on pulso_content.workflow_queue(status);

create index if not exists idx_workflow_queue_proximo_retry
  on pulso_content.workflow_queue(proximo_retry);

grant usage on schema pulso_content to anon, authenticated, service_role;
grant select, insert, update, delete on table pulso_content.workflow_queue
  to anon, authenticated, service_role;

alter table pulso_content.workflow_queue enable row level security;

drop policy if exists "Fila publica leitura" on pulso_content.workflow_queue;
create policy "Fila publica leitura"
  on pulso_content.workflow_queue
  for select
  using (true);

drop policy if exists "Fila publica escrita" on pulso_content.workflow_queue;
create policy "Fila publica escrita"
  on pulso_content.workflow_queue
  for all
  using (true)
  with check (true);

comment on table pulso_content.workflow_queue is
  'Fila de retry de workflows do MVP interno';

comment on column pulso_content.workflow_queue.workflow_name is
  'Nome logico do workflow';

comment on column pulso_content.workflow_queue.payload is
  'Payload da tentativa pendente';

comment on column pulso_content.workflow_queue.tentativas is
  'Numero de tentativas ja executadas';

comment on column pulso_content.workflow_queue.max_tentativas is
  'Limite de retries do item';

comment on column pulso_content.workflow_queue.proximo_retry is
  'Momento sugerido para nova tentativa';
