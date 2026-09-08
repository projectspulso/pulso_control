-- 069_faxina_policies_que_mentem.sql — 2026-09-08
--
-- O QUE SAI, E POR QUE SAIR IMPORTA MESMO SEM RISCO ATIVO. Depois da 065/067 estas policies não
-- têm mais efeito nenhum: as restritivas (`veto_so_interno`, `veto_interno_ou_publicado`)
-- multiplicam com AND e vetam tudo que não seja usuário interno ativo. Mas elas continuam no
-- catálogo com nomes que AFIRMAM o contrário:
--
--   "Permitir tudo para todos"   ·   "Pipeline público leitura" / "escrita"
--   "Logs públicos leitura" / "escrita"   ·   "Fila publica leitura" / "escrita"
--
-- Quem auditar por leitura de `pg_policies` — que é como quase toda auditoria começa — lê esses
-- nomes e conclui o oposto do que o banco faz. Foi exatamente esse padrão que quase produziu o
-- desastre desta noite: as policies estavam escritas com RLS DESLIGADA, e "ligar a RLS" as
-- acordaria. Nome que mente é dívida de segurança mesmo quando o efeito é nulo.
--
-- POR QUE É SEGURO AGORA (e não era antes): `interno_total_v2` existe como policy PERMISSIVA em
-- todas as 20 tabelas, para `authenticated`. Ela é a que concede. As que saem aqui só somavam
-- (OR) permissão a papéis que já perderam o grant na 064/066/068. Removê-las não tira acesso de
-- ninguém — conferido por simulação depois de aplicar.
--
-- CONFERÊNCIA OBRIGATÓRIA DEPOIS: simular o dono (interno ativo) e ver 220/283/67, e simular o
-- intruso (logado, não-interno) e ver 0/0/0.

do $$
declare p record;
begin
  for p in select tablename, policyname from pg_policies
            where schemaname = 'pulso_content'
              and policyname in ('Permitir tudo para todos',
                                 'Pipeline público leitura', 'Pipeline público escrita',
                                 'Logs públicos leitura',    'Logs públicos escrita',
                                 'Fila publica leitura',     'Fila publica escrita',
                                 'audios_select',            'receitas_select')
  loop
    execute format('drop policy if exists %I on pulso_content.%I', p.policyname, p.tablename);
  end loop;
end $$;
