# Mapa da Documentacao Antiga

## Objetivo

Nao apagar o acervo antigo, mas impedir que ele confunda a equipe.

## Categoria 1 - Conceitual e ainda util

Esses docs ainda ajudam a entender a intencao do sistema:

- `docs/00_MESTRE/00_MAPA_COMPLETO_PULSO.md`
- `docs/50_BLUEPRINTS/README.md`
- `docs/50_BLUEPRINTS/00_ECOSSISTEMA_COMPLETO.md`
- `docs/50_BLUEPRINTS/01_CANAIS_SERIES.md`
- `docs/50_BLUEPRINTS/02_WORKFLOWS_N8N.md`
- `docs/50_BLUEPRINTS/03_BANCO_DE_DADOS.md`
- `docs/50_BLUEPRINTS/04_FLUXO_CONTEUDO.md`
- `docs/50_BLUEPRINTS/05_GUIA_FASE_1.md`
- `docs/50_BLUEPRINTS/06_CONTEUDO_EDITORIAL.md`

## Categoria 2 - Uteis, mas datados

Esses docs podem ter valor, mas nao devem ser tratados como estado atual sem confronto com o codigo:

- `docs/90_LEGADO/status_e_resumos/STATUS_APP.md`
- `docs/90_LEGADO/status_e_resumos/STATUS_WORKFLOWS_N8N.md`
- `docs/90_LEGADO/status_e_resumos/RESUMO_IMPLEMENTACOES.md`
- `docs/90_LEGADO/analises/IMPLEMENTACAO_COMPLETA.md`
- `docs/30_AUTOMACAO/apoio/INTEGRACOES_ATIVAS.md`
- `docs/90_LEGADO/analises/O_QUE_FALTA_CENTRO_COMANDO.md`
- `docs/90_LEGADO/checklists/CHECKLIST_IMPLEMENTACAO.md`
- `docs/90_LEGADO/checklists/CHECKLIST_COMPLETO.md`

## Categoria 3 - Operacao pontual

Esses docs parecem ter sido escritos para resolver etapas ou incidents especificos:

- `docs/90_LEGADO/checklists/CHECKLIST_APROVACAO.md`
- `docs/90_LEGADO/checklists/CHECKLIST_ATIVACAO_WF01.md`
- `docs/30_AUTOMACAO/apoio/CONFIGURAR_WEBHOOKS_N8N.md`
- `docs/30_AUTOMACAO/apoio/DEBUG_WEBHOOK_N8N.md`
- `docs/90_LEGADO/operacao/GUIA_TESTE_APROVACAO.md`
- `docs/30_AUTOMACAO/apoio/TRIGGER_AUTO_AGENDAMENTO.md`
- `docs/30_AUTOMACAO/apoio/WF99_RECOVERY_RETRY.md`

## Categoria 4 - Debug, fix e investigacao

Esses docs nao devem ser seguidos cegamente. Servem como registro de diagnostico:

- `docs/90_LEGADO/analises/ANALISE_INTEGRACAO_COMPLETA.md`
- `docs/30_AUTOMACAO/apoio/ANALISE_WORKFLOWS_MELHORIAS.md`
- `docs/30_AUTOMACAO/apoio/N8N_API_PROBLEMA.md`
- `docs/20_BANCO/apoio/PROBLEMA_SCHEMA_SUPABASE.md`
- `docs/20_BANCO/apoio/RELATORIO_TESTES_DB.md`
- `docs/90_LEGADO/status_e_resumos/RESUMO_ANALISE.md`
- `docs/90_LEGADO/relatorios/TESTES_FINAIS.md`
- `docs/20_BANCO/apoio/SQL_EXECUTAR_SUPABASE.md`
- `docs/20_BANCO/sql/QUERIES_INVESTIGACAO_SUPABASE.sql`
- `docs/30_AUTOMACAO/sql/VERIFICAR_WORKFLOWS.sql`

## Categoria 5 - Banco detalhado

Esses docs guardam contexto tecnico de banco e merecem consulta dirigida:

- `docs/20_BANCO/acervo_detalhado/banco_completo_estrutura.md`
- `docs/20_BANCO/acervo_detalhado/estrutura inicial completa.md`
- `docs/20_BANCO/acervo_detalhado/melhoria_no_banco.md`
- `docs/20_BANCO/acervo_detalhado/pipeline_no_banco.md`
- `docs/20_BANCO/acervo_detalhado/RELATORIO_VERIFICACAO_BANCO.md`
- `docs/20_BANCO/apoio/views.md`
- `docs/20_BANCO/banco_de_dados.md`

## Categoria 6 - Produto e direcao

Docs que ajudam a pensar direcionamento:

- `docs/40_PRODUTO/90_APOIO/CRITICA_VIABILIDADE_CANAIS_DARK_2026.md`
- `docs/40_PRODUTO/90_APOIO/estrategia/PERSONAGEM_PULSO.md`
- `docs/40_PRODUTO/90_APOIO/estrategia/plano_de_Criacoes.md`

## Regra de uso

- usar Categoria 1 para entender o sistema
- usar Categoria 2 so com confronto com o app
- usar Categoria 3 quando estiver executando uma etapa especifica
- usar Categoria 4 so quando houver problema real
- usar Categoria 5 para decisao de banco
