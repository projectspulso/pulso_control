# Checklist da Trilha Oficial

## Fase 1 - Leitura

- [ ] Li `docs/README.md`
- [ ] Li `docs/00_MESTRE/ESTADO_ATUAL_E_FONTES_DE_VERDADE.md`
- [ ] Li `docs/40_PRODUTO/README.md`
- [ ] Li `docs/20_BANCO/README.md`
- [ ] Li `docs/30_AUTOMACAO/README.md`
- [ ] Li `docs/50_BLUEPRINTS/README.md`

## Fase 2 - Ambiente

- [ ] Criei `.env.local`
- [ ] Preenchi Supabase publico
- [ ] Preenchi Supabase server
- [ ] Preenchi n8n API
- [ ] Preenchi webhooks WF01 e WF02
- [ ] Defini `WEBHOOK_SECRET`
- [ ] Rodei `npm install`
- [ ] Rodei `npm run dev`
- [ ] Validei `/api/debug/env`

## Fase 3 - Banco

- [ ] Rodei `database/sql/investigacao/20260311_validacao_runtime_mvp.sql`
- [ ] Li `docs/20_BANCO/RESULTADO_INVESTIGACAO_RUNTIME_MVP_20260311.md`
- [ ] Rodei diagnostico de views
- [ ] Rodei validacao de estado real
- [ ] Validei enums e ids
- [ ] Listei tabelas e views usadas pelo app
- [ ] Decidi o lote minimo de migrations
- [ ] Separei scripts perigosos
- [ ] Confirmei se `pulso_content.workflow_queue` era a unica lacuna real

## Fase 4 - Migration minima

- [ ] Apliquei `database/sql/migrations/20260311_create_workflow_queue_runtime_mvp.sql`
- [ ] Rodei `database/sql/investigacao/20260311_validar_workflow_queue_pos_migration.sql`
- [ ] Validei a `workflow_queue` com o doc de validacao

## Fase 5 - App

- [ ] `/ideias` funciona
- [ ] `/roteiros` funciona
- [ ] `/producao` funciona
- [ ] `/calendario` funciona
- [ ] `/assets` funciona
- [ ] `/publicar` funciona
- [ ] `/monitor` funciona
- [ ] rotas de aprovacao respondem

## Fase 6 - n8n

- [ ] Importei WF00
- [ ] Importei WF01
- [ ] Importei WF02
- [ ] Importei WF03
- [ ] Importei WF04
- [ ] Importei WF99
- [ ] Configurei credenciais
- [ ] Copiei URLs reais de webhook
- [ ] Testei comunicacao app <-> n8n

## Fase 7 - Fluxo ponta a ponta

- [ ] Aprovei uma ideia
- [ ] O WF01 criou roteiro
- [ ] Aprovei um roteiro
- [ ] O WF02 criou audio
- [ ] O WF03 preparou video
- [ ] O video foi montado e subido
- [ ] O WF04 gerou item de publicacao
- [ ] Logs apareceram no banco

## Gate final

- [ ] Consigo repetir o fluxo completo
- [ ] O banco esta estavel
- [ ] O app e o n8n usam a mesma verdade operacional
- [ ] O MVP esta pronto para 1 canal
