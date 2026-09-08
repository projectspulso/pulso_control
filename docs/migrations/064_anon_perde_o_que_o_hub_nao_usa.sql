-- 064_anon_perde_o_que_o_hub_nao_usa.sql — 2026-09-08
-- Ordem do dono ("hora de resolver tudo", 08/09).
--
-- O QUE ISTO FECHA, AGORA, SEM DEPENDER DE NADA. Medido com a chave `anon` — a que viaja no bundle
-- do navegador de qualquer visitante do hub:
--
--   roteiros          220 linhas, com o `conteudo_md` INTEIRO de cada vídeo
--   videos             67 · plano_publicacao 20 · conteudos 5 · personagens 1
--
-- O hub público consome exatamente TRÊS tabelas: pipeline_producao, ideias e metricas_publicacao.
-- Todo o resto que o anon enxergava era acesso que ninguém pediu e ninguém usa. Este arquivo tira
-- o SELECT do anon de tudo que sobra.
--
-- POR QUE ESTE CAMINHO E NÃO A RLS PRIMEIRO. A 063 (RLS) é a trava certa e continua de pé, mas
-- depende de remover as policies "Permitir tudo para todos" antes — e essa remoção precisa da mão
-- do dono. Este revoke não depende de nada, não apaga dado, é uma linha por tabela e reversível
-- com um `grant`. Entre esperar a trava perfeita e fechar 220 roteiros hoje, fecha-se hoje.
--
-- O QUE NÃO SAI, DE PROPÓSITO: o SELECT do anon nas TRÊS tabelas do hub. O hub em produção ainda
-- lê as tabelas direto — a correção que o faz ler as views está commitada em pulso_hub (2b69387),
-- verificada, e não pôde ser publicada daqui. Tirar o SELECT dessas três antes do deploy derruba o
-- site público. Assim que o hub subir, aplicar a 065.
--
-- MEDIDO ANTES: anon lia 20 tabelas de pulso_content.
-- MEDIDO DEPOIS: anon lê 3 tabelas + as 2 views. roteiros/videos/plano_publicacao -> negado.

revoke select on pulso_content.roteiros                          from anon;
revoke select on pulso_content.roteiros_renders                  from anon;
revoke select on pulso_content.videos                            from anon;
revoke select on pulso_content.plano_publicacao                  from anon;
revoke select on pulso_content.conteudos                         from anon;
revoke select on pulso_content.conteudo_variantes                from anon;
revoke select on pulso_content.personagens                       from anon;
revoke select on pulso_content.canais_personagens                from anon;
revoke select on pulso_content.episodios                         from anon;
revoke select on pulso_content.feedbacks                         from anon;
revoke select on pulso_content.thumbnails                        from anon;
revoke select on pulso_content.agenda_atribuicoes                from anon;
revoke select on pulso_content.audios                            from anon;
revoke select on pulso_content.logs_workflows                    from anon;
revoke select on pulso_content.receitas                          from anon;
revoke select on pulso_content.workflow_queue                    from anon;
revoke select on pulso_content.n8n_roteiro_completo              from anon;
revoke select on pulso_content.pipeline_producao_backup_20251126 from anon;

-- CONFERÊNCIA (por chamada real com a chave anon, não por leitura de catálogo):
--   roteiros          -> negado (era 220 com o roteiro inteiro)
--   videos            -> negado (era 67)
--   plano_publicacao  -> negado (era 20)
--   pipeline_producao -> continua lendo (o hub vivo depende)
--   ideias            -> continua lendo
--   hub em produção   -> 200
--
-- PARA DESFAZER uma tabela específica:
--   grant select on pulso_content.<tabela> to anon;
