-- ============================================================
-- 080 — usuário interno anexa imagem aos assuntos de Bastidores pela própria página
-- Pedido: dono, 04/11/2026 ("página de detalhes com fotos, imagens do app e tudo completo").
-- O bucket continua PRIVADO (078); aqui só o usuário interno ativo pode enviar e trocar arquivo.
-- Reversão: drop policy bastidores_interno_envia on storage.objects; drop policy bastidores_interno_troca on storage.objects;
-- ============================================================
begin;
drop policy if exists bastidores_interno_envia on storage.objects;
create policy bastidores_interno_envia on storage.objects for insert to authenticated
  with check (bucket_id = 'bastidores'
              and exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo));
drop policy if exists bastidores_interno_troca on storage.objects;
create policy bastidores_interno_troca on storage.objects for update to authenticated
  using (bucket_id = 'bastidores'
         and exists (select 1 from pulso_core.usuarios_internos u where u.auth_user_id = auth.uid() and u.ativo));
commit;
