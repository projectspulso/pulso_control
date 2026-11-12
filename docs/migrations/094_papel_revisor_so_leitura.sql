-- 094 · papel "revisor": só leitura (dono, 12/11/2026)
-- Por quê: o revisor do TikTok precisa entrar no painel (a revisão de 25/08 foi recusada porque o site
-- cai no login). Até aqui toda política era "membro ativo de usuarios_internos pode tudo"; um revisor
-- nessa lista poderia gravar. Agora:
--   · as políticas ALL de membro passam a excluir papel 'revisor' (escrita só para admin/operador)
--   · cada tabela ganha uma política SELECT para o revisor
--   · no Storage (bucket bastidores) o revisor lê, mas não envia nem troca
-- As RPCs SECURITY DEFINER do contrato dos Bastidores já exigem papel 'admin' e não mudam.

do $$
declare
  p record;
  membro text := '(EXISTS ( SELECT 1 FROM pulso_core.usuarios_internos u WHERE ((u.auth_user_id = auth.uid()) AND u.ativo)))';
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname like 'pulso%' and 'authenticated' = any(roles) and cmd = 'ALL'
      and regexp_replace(coalesce(qual, ''), '\s+', ' ', 'g') = membro
  loop
    execute format($f$alter policy %I on %I.%I
      using (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo and coalesce(u.papel,'') <> 'revisor'))
      with check (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo and coalesce(u.papel,'') <> 'revisor'))$f$,
      p.policyname, p.schemaname, p.tablename);
    execute format($f$create policy %I on %I.%I for select to authenticated
      using (exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo and u.papel = 'revisor'))$f$,
      left(p.tablename, 40) || '_revisor_le', p.schemaname, p.tablename);
  end loop;
end $$;

alter policy bastidores_interno_envia on storage.objects
  with check (bucket_id = 'bastidores' and exists (select 1 from pulso_core.usuarios_internos u
    where u.auth_user_id = auth.uid() and u.ativo and coalesce(u.papel,'') <> 'revisor'));
alter policy bastidores_interno_troca on storage.objects
  using (bucket_id = 'bastidores' and exists (select 1 from pulso_core.usuarios_internos u
    where u.auth_user_id = auth.uid() and u.ativo and coalesce(u.papel,'') <> 'revisor'));
