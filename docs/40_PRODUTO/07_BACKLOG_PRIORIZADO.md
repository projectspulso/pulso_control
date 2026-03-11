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
   `.env.example` e `.env.local` cobrindo o que app, banco e n8n usam de verdade

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

1. Trocar `alert`, `confirm` e `prompt` por UX consistente
2. Criar trilha clara de upload e validacao de assets
3. Melhorar configuracao de plataformas no `/settings`
4. Registrar historico de aprovacoes e motivos
5. Dar visibilidade do estado de webhooks e retries
6. Criar rubric de qualidade de ideia, roteiro e video

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

1. o nucleo do app ja compila e navega como MVP interno
2. o proximo ganho real nao esta mais em layout; esta em integracao real e confiabilidade
3. depois da validacao ponta a ponta, o backlog deve ser reorganizado por incidencia real de uso
