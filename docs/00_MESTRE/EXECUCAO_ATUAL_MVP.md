# Execucao Atual do MVP

Data de referencia: 15 de maio de 2026

## Estado atual medido

### Dependencias

- `npm install` executado com sucesso em 15 de maio de 2026
- 598 pacotes instalados
- 10 vulnerabilidades reportadas pelo `npm audit` apos instalacao atual
- `npm audit fix` nao foi executado porque pode alterar dependencias fora do escopo da validacao

### Ambiente local

- `.env.local` criado a partir dos valores sensiveis que estavam temporariamente no `.env.example`
- `.env.example` limpo e mantido apenas como template sem segredos
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ACCESS_TOKEN_SUPABASE` e `PROJECT_URL_SUPABASE` estao presentes no `.env.local`
- `.env.local` esta coberto pelo `.gitignore`
- acesso Supabase validado com anon key e service role contra o projeto `nlcisbfdiokmipyihtuz`
- servidor local reiniciado apos criacao do `.env.local`

### Auditoria read-only do banco real

Projeto Supabase validado:

- `nlcisbfdiokmipyihtuz`
- status: ativo e saudavel

Estado encontrado:

- `pulso_core.canais`: 10 linhas, todas com status ativo
- `pulso_core.series`: 20 linhas
- `pulso_content.ideias`: 131 linhas
- `pulso_content.roteiros`: 24 linhas
- `pulso_content.pipeline_producao`: 129 linhas
- `pulso_content.audios`: 5 linhas
- `pulso_distribution.posts`: 6 linhas
- `pulso_analytics.metricas_diarias`: 28 linhas
- `pulso_automation.automation_queue`: 363 linhas

Leitura honesta:

- o banco tem dado real suficiente para operar, mas esta disperso demais para a fase de validacao
- ha 10 canais ativos, o que contradiz a regra de validar 1 canal antes de escalar
- a fila de automacao tem backlog antigo relevante: 360 itens pendentes e 3 erros
- o pipeline esta concentrado em `AGUARDANDO_ROTEIRO`: 120 de 129 itens
- existem 5 audios, sendo 4 `PRONTO` e 1 `OK` com URL invalida
- as views publicas centrais existem: `vw_pulso_canais`, `vw_pulso_calendario_publicacao_v2`, `vw_automation_queue`, `vw_automation_stats`

### Build

- `npm run build` executado com sucesso em 15 de maio de 2026
- o app gera build de producao
- a rota nova `/validacao` foi compilada
- build reexecutado apos auditoria do banco, ajuste de `/validacao` e correcao do worker de publicacao; resultado: sucesso
- build reexecutado apos ranking de canal foco, politica de fila e remocao dos `alert()` restantes em componentes de aprovacao; resultado: sucesso
- build reexecutado apos ativacao do Modo Foco em ideias, roteiros, producao, publicar e pagina de canal; resultado: sucesso
- build reexecutado apos correcao de calendario/publicacao e lint; resultado: sucesso

### Runtime local validado

- servidor local ativo em `http://127.0.0.1:3000`
- servidor local confirmado em 15 de maio de 2026 na porta 3000, processo 15716
- `/validacao`, `/ideias`, `/roteiros`, `/producao`, `/publicar`, `/automacao` e `/analytics` abriram no navegador sem erro de console
- `/ideias`, `/roteiros`, `/producao` e `/publicar` responderam HTTP 200 apos ativacao do Modo Foco
- consulta com a chave anon do browser confirmou 129 itens visiveis na view publica de calendario e 43 itens do canal foco
- `/validacao` mostrou `Canal foco recomendado` e `Politica da fila`
- `/validacao` mostrou `Lote de validacao recomendado` com itens acionaveis do canal foco
- `/validacao` mostrou `Roadmap de implantacao do MVP` com datas absolutas e fases de execucao
- `/validacao` mostrou `Mapa dos canais`, `Sequencia dentro do app` e `Gate de decisao`
- nao ha referencia visivel a n8n nas telas principais testadas
- falsos positivos de encoding em `/ideias` e `/producao` vieram de conteudo real com acentos no banco, nao de mojibake da UI

### Lint

- `npm run lint` executado em 15 de maio de 2026 apos Modo Foco e correcao da view de calendario
- resultado: 0 erros, 102 warnings
- warnings atuais sao divida tecnica de tipagem/unused em superficies antigas e nao bloqueiam build

## Decisao tecnica tomada

Para estabilizacao inicial do MVP:

- `any` foi rebaixado para warning no TypeScript do app
- arquivos gerados do Supabase passaram a ter tratamento especifico
- scripts legados, apoio tecnico e paginas de teste ficaram fora da trilha principal do lint

Motivo:

- separar bloqueador real de MVP de divida tecnica historica
- manter erro para problemas estruturais do app principal
- impedir que o legado esconda os problemas reais da superficie do produto

## Ajustes executados nesta etapa

- `/validacao` criada como tela de decisao do MVP interno
- sidebar emagrecida para o fluxo principal: Dashboard, Validacao, Ideias, Roteiros, Producao, Publicar, Automacao e Analytics
- telas auxiliares continuam existentes, mas sairam da navegacao principal para reduzir dispersao operacional
- `/validacao` passou a mostrar alertas reais de foco, fila e gargalo do pipeline com base no banco
- `app/api/automation/publicar/route.ts` corrigida para respeitar `pipeline_ids` e buscar o status real `PRONTO_PUBLICACAO`
- baseline tecnico completo rodado
- `app/page.tsx` ajustado para remover problema de `setState` em efeito
- `lib/supabase/server.ts` criado como cliente server unico com `SERVICE_ROLE_KEY`
- rotas server de ideias, roteiros e webhook migradas para o cliente server unico
- `app/api/debug/env/route.ts` deixou de ficar exposto fora de desenvolvimento, salvo override explicito
- `app/publicar/page.tsx` saiu do modo "auto-post total" e entrou em "publicacao assistida" com feedback inline
- `app/analytics/page.tsx` deixou de ser placeholder e virou painel minimo de validacao do MVP
- `components/ui/feedback-banner.tsx` e `components/ui/confirm-dialog.tsx` criados para padronizar feedback e confirmacoes
- `app/assets/page.tsx` deixou de depender de URL hardcoded de storage
- `app/ideias/[id]/page.tsx` saiu de `alert/confirm/prompt` e alinhou a rejeicao com o schema real via `ARQUIVADA`
- `app/roteiros/[id]/page.tsx` saiu de `alert/confirm/prompt` e alinhou a rejeicao com o schema real via `REVISAO`
- `app/ideias/nova/page.tsx` ganhou criacao manual mais consistente, com pre-selecao opcional de canal e feedback inline
- `app/canais/[slug]/page.tsx` ganhou filtro tipado, disparo assistido de geracao de ideias e navegacao direta para criar/abrir ideias
- `app/canais/page.tsx` foi alinhado ao schema real de canais
- `app/api/webhooks/workflow-completed/route.ts` passou a gravar direto em `pulso_content.logs_workflows`
- `lib/supabase/runtime-access.ts` passou a ter fallback seguro para leitura de logs
- `lib/hooks/use-workflow-queue.ts` foi alinhado ao contrato real esperado da fila e agora degrada sem quebrar o monitor enquanto a tabela nao existir
- `lib/hooks/use-plataformas.ts` passou a gravar configuracoes e credenciais nas tabelas reais de `pulso_core`
- `eslint.config.mjs` ajustado para foco na superficie do MVP
- scripts criticos de integracao e validacao deixaram de carregar URL/chave hardcoded
- `.env.example` passou a cobrir variaveis usadas por esses scripts
- a investigacao real do banco confirmou que a unica lacuna critica do runtime e `pulso_content.workflow_queue`
- `database/sql/migrations/20260311_create_workflow_queue_runtime_mvp.sql` foi criada como migration limpa e oficial desta etapa
- `database/sql/investigacao/20260311_validar_workflow_queue_pos_migration.sql` foi criado como pacote de validacao pos-migration
- a migration `workflow_queue` foi aplicada e validada no banco real
- n8n saiu da rota operacional do MVP; a trilha atual usa Supabase, `automation_queue` e API routes do app
- referencias de n8n ficam apenas como acervo legado e nao devem orientar novas implementacoes
- a investigacao de storage mostrou que o bucket `audios` existe; o problema atual dos assets vem de `storage_path/public_url` gravados como `undefined`
- `/validacao` ganhou ranking de canal foco recomendado e politica operacional de fila sem alterar dados no banco
- o ranking de canal foco prioriza tracao operacional existente; a prioridade cadastrada entra apenas como desempate
- os cards do ranking de canal foco apontam direto para a pagina do canal correspondente
- `/validacao` ganhou lote de validacao recomendado com ate 5 itens do canal foco, priorizando o que esta mais perto de publicar
- `/validacao` ganhou roadmap de implantacao do MVP com datas de 15/05/2026 a 12/06/2026, cobrindo foco de canal, saneamento de fila, roteiro, audio, publicacao assistida, medicao, gate e segunda rodada
- `/validacao` ganhou mapa dos canais, sequencia operacional dentro do app e criterios de gate GO/AJUSTAR/KILL
- `lib/api/automation.ts` passou a reutilizar o cliente Supabase no browser para evitar multiplas instancias GoTrue
- `components/ideias/aprovar-ideia-button.tsx` e `components/ui/approve-buttons.tsx` deixaram de usar `alert()` e passaram a usar feedback por toast
- `lib/config/modo-foco.ts` criado como contrato unico do canal foco do MVP
- canal foco oficial do MVP: `PULSO Mistérios & História` (`pulso-misterios-historia-pt`)
- `/ideias` e `/roteiros` agora abrem filtrados no canal foco, com opcao de auditoria dos demais canais
- `/producao` e `/publicar` agora operam somente itens do canal foco para o lote do MVP
- paginas de canais fora do foco bloqueiam geracao/criacao operacional e viram apenas consulta ate o gate
- o mascote Pulso fica definido para o MVP como voz/narrador e guia editorial; animacao complexa do personagem fica fora do primeiro lote ate haver sinal de audiencia
- `lib/hooks/use-calendario.ts` corrigido para mapear a view real `vw_pulso_calendario_publicacao_v2` de `canal_nome`, `serie_nome`, `ideia_titulo` e `pipeline_metadata` para o contrato usado pelo frontend
- `/validacao` passou a usar o canal foco oficial, nao ranking dinamico, como referencia de execucao diaria
- `docs/00_MESTRE/PENDENCIAS_DO_USUARIO_MVP.md` criado com decisoes e acessos que dependem do usuario
- `/producao/higgsfield` criado como kit manual para gerar videos no Higgsfield enquanto a automacao de video nao e validada
- `docs/40_PRODUTO/16_KIT_MANUAL_HIGGSFIELD_MVP.md` criado como fonte operacional do fluxo manual

### Snapshot do canal foco em 15 de maio de 2026

- canal foco: `PULSO Mistérios & História`
- 43 ideias aprovadas no canal foco
- 11 roteiros no canal foco
- 3 audios prontos no canal foco
- 43 itens de pipeline do canal foco:
  - 38 em `AGUARDANDO_ROTEIRO`
  - 2 em `ROTEIRO_PRONTO`
  - 3 em `AUDIO_GERADO`
- nenhum item do canal foco esta em `PRONTO_PUBLICACAO`

## Leitura honesta

O produto esta mais perto do MVP do que parecia.

Nao por estar limpo, mas porque:

- a build passa
- o app principal compila
- o app agora tem uma tela explicita para decidir GO, AJUSTAR ou KILL do lote de validacao
- os gargalos agora sao de estabilizacao e confiabilidade, nao de inexistencia
- a superficie principal deixou de depender de dialogs nativos do navegador para operacao critica
- o app agora reduz dispersao operacional: existe um canal foco e as telas de execucao respeitam esse foco

O ponto fraco ainda nao mudou: o produto so vira renda quando o lote real sair publicado, medido e comparado. Modo Foco evita dispersao, mas nao valida demanda sozinho.

## Proximos bloqueadores P0

1. validar fluxo ponta a ponta com banco real e automacao nativa do app no canal `PULSO Mistérios & História`
2. transformar os 3 itens em `AUDIO_GERADO` em videos revisados e mover para `PRONTO_PUBLICACAO`
3. gerar audio para os 2 itens em `ROTEIRO_PRONTO` para fechar lote minimo de 5
4. usar `/producao/higgsfield` para gerar 3 ou 4 clipes por video e montar final acima de 15 segundos
5. definir politica de limpar, cancelar, arquivar ou reprocessar em lote pequeno os pendentes antigos da `automation_queue`
6. corrigir a origem dos registros invalidos em `pulso_content.audios`
7. definir voz MVP do Pulso e ferramenta TTS antes de produzir audio em lote
8. registrar historico de aprovacoes, retries e sinais operacionais do workflow
