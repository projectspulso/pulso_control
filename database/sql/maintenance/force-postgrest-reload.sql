-- FORÇAR RELOAD DO POSTGREST
-- Execute este script e AGUARDE 60 SEGUNDOS
-- Método 1: NOTIFY direto
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');
-- Método 2: Recriar a função de notificação (força o PostgREST a detectar mudança)
CREATE OR REPLACE FUNCTION public.force_pgrst_reload() RETURNS void LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_notify('pgrst', 'reload schema');
PERFORM pg_notify('pgrst', 'reload config');
END;
$$;
-- Executar a função
SELECT public.force_pgrst_reload();
-- Método 3: Atualizar uma configuração qualquer para forçar detecção
ALTER DATABASE postgres
SET app.settings.version = '2024-12-01';
SELECT 'Aguarde 60 segundos e teste novamente!' as status;