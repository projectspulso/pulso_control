-- 061_revoke_destrutivo_do_anon.sql — 2026-09-08
-- APLICADA em 08/09/2026 via Management API do Supabase, com "pode" do dono. Espelho aqui.
--
-- O QUE ERA: `anon` — a chave PÚBLICA, que viaja no bundle do navegador de qualquer visitante —
-- tinha `REFERENCES, SELECT, TRIGGER, TRUNCATE` em pulso_content.agenda_atribuicoes.
-- TRUNCATE é destrutivo: esvazia a tabela inteira e não é transacionalmente reversível como um
-- DELETE com WHERE errado. A auditoria do orquestrador tinha classificado o anon como
-- somente-leitura; era o único ponto em que isso não valia.
--
-- POR QUE SÓ ESTA TABELA: varri os quatro privilégios destrutivos (TRUNCATE/INSERT/UPDATE/DELETE)
-- em TODOS os schemas pulso_* — este era o único. Não é um padrão, é uma sobra.
--
-- O QUE NÃO SAIU, DE PROPÓSITO: o `SELECT` do anon FICA, aqui e nas outras tabelas. Revogá-lo é
-- item separado e derruba o hub público (pulsohub.netlify.app lê por esta chave) enquanto a view
-- pública com as colunas que ele usa não existir e estiver testada. Fechar uma porta quebrando a
-- vitrine não é fechar a porta, é trocar de problema.
--
-- MEDIDO ANTES:  anon = REFERENCES,SELECT,TRIGGER,TRUNCATE
-- MEDIDO DEPOIS: anon = SELECT
--                destrutivos do anon em qualquer schema pulso_*: 0
-- CONFERIDO DEPOIS, por chamada real: leitura anon de agenda_atribuicoes e ideias = 200;
--                app em produção = 200; hub público = 200. Nada quebrou.

revoke truncate, references, trigger on pulso_content.agenda_atribuicoes from anon;

-- CONFERÊNCIA:
--   select grantee, string_agg(privilege_type, ',' order by privilege_type)
--     from information_schema.role_table_grants
--    where table_schema = 'pulso_content' and table_name = 'agenda_atribuicoes' and grantee = 'anon'
--    group by grantee;   -- esperado: SELECT
--
-- PARA DESFAZER (não recomendado — não há uso legítimo conhecido):
--   grant truncate, references, trigger on pulso_content.agenda_atribuicoes to anon;

-- AINDA ABERTO depois desta migração (precisa da view pública antes):
--   · RLS OFF em 16 tabelas de pulso_content — inclusive `ideias` e `pipeline_producao`, que têm
--     POLICIES ESCRITAS e RLS desligada. Policy sem RLS não faz nada, mas parece proteção para
--     quem lê a lista de policies. É a armadilha mais perigosa do conjunto.
--   · `authenticated` com DML completo — hoje inofensivo porque o cadastro público foi fechado
--     (disable_signup=true) e só existe 1 usuário; volta a ser crítico se o cadastro reabrir.
