# Backlog Priorizado

## Regra de prioridade

Ordem de decisao:

1. o que protege a viabilidade do MVP
2. o que protege a confiabilidade operacional
3. o que melhora experiencia do operador
4. o que prepara escala futura

## Status atual em 11 de marco de 2026

- P0.1 trilha oficial de banco e docs: documentada, falta validacao de execucao real
- P0.2 `npm install`, `lint` e `build`: concluido no lote inicial do MVP
- P0.3 hardcodes sensiveis de scripts: concluido no lote inicial
- P0.4 variaveis de ambiente alinhadas com o codigo: concluido no lote inicial
- P0.5 cliente Supabase em contexto server: concluido no lote inicial
- P0.6 publicacao rebaixada para fluxo assistido: concluido no lote inicial
- P0.7 analytics minimo para validacao: concluido no lote inicial
- P1.1 UX sem `alert`, `confirm` e `prompt` na superficie principal: concluido
- P1.2 biblioteca de assets e telas de detalhe: estabilizadas para operacao manual do MVP

## Status atual em 15 de maio de 2026

- `/validacao` criada como tela central de decisao do MVP interno
- navegacao principal emagrecida para o fluxo que importa no lote de validacao
- Modo Foco ativado no app para `PULSO Mistérios & História`
- `/ideias` e `/roteiros` agora iniciam no canal foco
- `/producao` e `/publicar` agora filtram a operacao para o canal foco
- paginas de canais fora do foco bloqueiam nova execucao operacional ate o gate do MVP
- Pulso foi definido para o MVP como voz/narrador com imagens, cortes, legendas e movimento simples; animacao complexa fica fora do primeiro lote
- auditoria read-only do banco real executada contra `nlcisbfdiokmipyihtuz`
- banco real tem 10 canais ativos, 131 ideias, 129 itens no pipeline e 363 itens na fila
- `/validacao` agora mostra alertas de foco, backlog da fila e gargalo do pipeline
- worker de publicacao corrigido para respeitar `pipeline_ids` e o status real `PRONTO_PUBLICACAO`
- `/validacao` agora mostra ranking de canal foco recomendado e politica operacional de fila
- `/validacao` agora mostra lote recomendado de ate 5 itens para executar no canal foco
- `/validacao` agora mostra roadmap datado de implantacao do MVP, da escolha do canal ao gate GO/AJUSTAR/KILL
- `/validacao` agora mostra mapa dos canais, sequencia de uso do app e criterios objetivos de GO/AJUSTAR/KILL
- feedback legado com `alert()` foi removido dos componentes de aprovacao conhecidos em favor de toast
- cliente Supabase da automacao no browser passou a ser reutilizado para evitar multiplas instancias GoTrue
- `npm install` executado com sucesso
- `npm run build` executado com sucesso
- `npm run build` reexecutado apos Modo Foco; sucesso
- rotas `/ideias`, `/roteiros`, `/producao` e `/publicar` responderam HTTP 200 com servidor local na porta 3000
- lint ainda nao foi revalidado nesta etapa
- `npm audit` reportou 10 vulnerabilidades; nao corrigir automaticamente sem avaliar impacto em dependencias

## P0 - Bloqueadores de viabilidade

1. Congelar a trilha oficial de banco
   Resultado esperado:
   definir o lote minimo de migrations e parar de depender de leitura caotica

2. Validar `npm install`, `lint` e `build`
   Resultado esperado:
   saber se o produto compila e em que pontos quebra

3. Remover hardcodes sensiveis de scripts
   Resultado esperado:
   nenhum script relevante com URL ou token fixo sendo tratado como padrao seguro

4. Alinhar variaveis de ambiente com o codigo
   Resultado esperado:
   `.env.example` e `.env.local` cobrindo o que app, banco e automacao nativa usam de verdade

5. Corrigir uso de cliente Supabase em contexto server
   Resultado esperado:
   rotas server usando configuracao apropriada e previsivel

6. Rebaixar a promessa de publicacao para "assistida"
   Resultado esperado:
   interface e docs sem vender auto-post total antes da hora

7. Criar o minimo de analytics para validacao
   Resultado esperado:
   enxergar performance operacional e editorial sem depender de placeholders

## P1 - Produto operavel

1. Validar fluxo ponta a ponta do canal foco: ideia, roteiro, audio, producao, publicacao assistida e metrica
2. Definir politica para limpar, cancelar ou arquivar o backlog antigo da `automation_queue`
3. Definir voz MVP do Pulso e padrao visual simples do primeiro lote
4. Criar rubric de qualidade de ideia, roteiro e video dentro do fluxo operacional
5. Registrar historico de aprovacoes e motivos
6. Dar visibilidade do estado de webhooks e retries
7. Melhorar configuracao de plataformas no `/settings`
8. Criar trilha clara de upload e validacao de assets

## P2 - Produto melhorando a cada lote

1. Comparar performance por formato
2. Associar sinais de performance ao processo editorial
3. Criar score de qualidade operacional
4. Criar score de repetibilidade por formato
5. Preparar operacao para 2o canal sem prometer escala

## O que fica para depois

- multi-rede como tese principal
- analytics avancado completo
- automacao total de publicacao
- qualquer narrativa de "factory"

## Leitura de sequencia agora

1. o nucleo do app compila como MVP interno
2. o app agora tem uma tela de decisao e uma trava de foco para nao confundir producao com progresso
3. o proximo ganho real e executar um lote pequeno no canal foco
4. depois da validacao ponta a ponta, o backlog deve ser reorganizado por incidencia real de uso
