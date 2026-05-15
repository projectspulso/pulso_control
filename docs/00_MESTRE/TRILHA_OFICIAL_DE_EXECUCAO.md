# Trilha Oficial de Execucao

Data de referencia: 15 de maio de 2026

## Objetivo

Este documento define a ordem oficial para:

- entender o projeto
- configurar ambiente
- validar banco
- operar o app local
- executar o primeiro fluxo funcional
- decidir `GO`, `AJUSTAR` ou `KILL`

## Decisao atual

n8n nao faz parte da rota operacional do MVP.

A trilha oficial agora e:

- Next.js app
- Supabase real
- `automation_queue`
- API routes do app
- logs, retries e decisao em telas internas

Materiais de n8n continuam como acervo legado. Nao usar como requisito ativo, fallback operacional ou fonte de verdade sem uma nova decisao documentada.

## Regra zero

Antes de qualquer acao:

1. nao rodar lotes cegos de SQL
2. nao confiar em doc antigo sem confrontar com `app/`, `lib/` e banco real
3. nao usar script com host, token ou chave hardcoded sem revisao manual
4. nao chamar renda de passiva antes de existir receita recorrente ou operacao delegavel

## Resultado esperado

Ao fim desta trilha, a equipe deve ter:

- `.env.local` preenchido e coerente com o codigo
- app abrindo com Supabase configurado
- diagnostico real do banco concluido
- 1 canal foco escolhido
- backlog de fila antigo classificado
- fluxo `ideia -> roteiro -> audio -> producao -> publicacao assistida` validado
- decisao objetiva de `GO`, `AJUSTAR` ou `KILL` em `/validacao`

## Fase 1 - Leitura

Ler nesta ordem:

1. `docs/README.md`
2. `docs/00_MESTRE/ESTADO_ATUAL_E_FONTES_DE_VERDADE.md`
3. `docs/00_MESTRE/EXECUCAO_ATUAL_MVP.md`
4. `docs/40_PRODUTO/05_MVP_OFICIAL.md`
5. `docs/30_AUTOMACAO/README.md`

Saida obrigatoria:

- entender que o produto e um sistema interno de operacao editorial
- entender que a tese correta e faceless original com humano no loop
- entender que n8n e legado, nao rota operacional

## Fase 2 - Ambiente

Usar `.env.example` como template e preencher `.env.local`.

Variaveis minimas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ACCESS_TOKEN_SUPABASE`
- `PROJECT_URL_SUPABASE`

Validar:

```bash
npm install
npm run dev
```

Abrir:

- `/validacao`
- `/ideias`
- `/roteiros`
- `/producao`
- `/publicar`
- `/automacao`
- `/analytics`

Saida obrigatoria:

- app sobe localmente
- frontend le dados do Supabase
- rotas server reconhecem variaveis essenciais

## Fase 3 - Banco real

Confirmar antes de mexer:

1. projeto Supabase correto
2. counts de canais, ideias, roteiros, pipeline, posts, metricas e fila
3. status reais usados no pipeline
4. erros recentes da `automation_queue`
5. registros invalidos em assets, audios ou posts

Estado medido em 15 de maio de 2026:

- 10 canais ativos
- 131 ideias
- 24 roteiros
- 129 itens no pipeline
- 5 audios
- 6 posts
- 28 metricas diarias
- 363 itens na `automation_queue`

Leitura obrigatoria:

- 10 canais ativos contradizem a regra de validar 1 canal
- 120 de 129 itens do pipeline estao em `AGUARDANDO_ROTEIRO`
- 360 itens pendentes na fila nao podem ser tratados como operacao saudavel

## Fase 4 - Decisao de foco

Antes de gerar mais conteudo:

1. escolher 1 canal foco
2. escolher 1 formato principal
3. pausar expansao operacional dos demais canais
4. definir se a fila antiga sera limpa, cancelada, arquivada ou reprocessada em lote pequeno

Saida obrigatoria:

- foco operacional visivel em `/validacao`
- backlog antigo nao confundido com progresso

## Fase 5 - Fluxo funcional

Executar nesta ordem:

1. aprovar ou criar uma ideia
2. gerar ou vincular roteiro
3. aprovar roteiro
4. gerar ou vincular audio
5. mover item pelo pipeline de producao
6. levar item para publicacao assistida
7. registrar resultado e falhas

Rotas e telas principais:

- `/validacao`
- `/ideias`
- `/roteiros`
- `/producao`
- `/publicar`
- `/automacao`
- `/analytics`

## Fase 6 - Automacao nativa

A automacao oficial deve usar:

- `automation_queue`
- API routes do app
- logs no banco
- retries controlados
- leitura operacional na UI

Nao usar:

- n8n como requisito ativo
- webhook externo como dependencia obrigatoria
- script manual para mascarar falha recorrente

## Fase 7 - Gate de MVP

O MVP pode seguir apenas se:

- 1 canal consegue fechar o fluxo completo
- o humano consegue revisar ideias e roteiros sem quebrar o processo
- o banco nao depende de fix manual a cada etapa
- a fila nao acumula erro silencioso
- publicacao assistida gera itens acionaveis
- `/validacao` permite decidir com dados

O MVP deve voltar para investigacao se:

- o fluxo nao se repetir duas vezes seguidas
- o app depender de operacao manual invisivel
- a fila antiga contaminar a leitura do lote atual
- as metricas nao permitirem diferenciar progresso de volume

## Regra final

Se uma etapa falhar, nao pular para a proxima. Corrigir a etapa quebrada, registrar a decisao e so depois continuar.
