# Checklist da Trilha Oficial

Data de referencia: 15 de maio de 2026

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
- [ ] Preenchi `ACCESS_TOKEN_SUPABASE`
- [ ] Preenchi `PROJECT_URL_SUPABASE`
- [ ] Rodei `npm install`
- [ ] Rodei `npm run dev`
- [ ] Validei `/validacao`

## Fase 3 - Banco

- [ ] Confirmei acesso ao projeto Supabase correto
- [ ] Listei tabelas e views usadas pelo app
- [ ] Validei counts de canais, ideias, roteiros, pipeline, posts, metricas e fila
- [ ] Validei estados reais do pipeline
- [ ] Validei erros recentes da `automation_queue`
- [ ] Separei backlog antigo de operacao atual

## Fase 4 - App

- [ ] `/validacao` funciona
- [ ] `/ideias` funciona
- [ ] `/roteiros` funciona
- [ ] `/producao` funciona
- [ ] `/publicar` funciona
- [ ] `/automacao` funciona
- [ ] `/analytics` funciona
- [ ] rotas de aprovacao respondem

## Fase 5 - Automacao nativa

- [ ] `automation_queue` tem politica definida para pendentes antigos
- [ ] API route de publicacao respeita `pipeline_ids`
- [ ] status real `PRONTO_PUBLICACAO` foi validado
- [ ] logs e retries aparecem no app
- [ ] falhas sao tratadas sem depender de ferramenta externa

## Fase 6 - Fluxo ponta a ponta

- [ ] Escolhi 1 canal foco
- [ ] Aprovei uma ideia
- [ ] Gerei ou vinculei roteiro
- [ ] Aprovei um roteiro
- [ ] Gerei ou vinculei audio
- [ ] O item apareceu no pipeline de producao
- [ ] O item chegou em publicacao assistida
- [ ] Logs apareceram no banco

## Gate final

- [ ] Consigo repetir o fluxo completo
- [ ] O banco esta estavel
- [ ] O app e a automacao nativa usam a mesma verdade operacional
- [ ] A fila nao esta acumulando erro silencioso
- [ ] O MVP esta pronto para validar 1 canal
