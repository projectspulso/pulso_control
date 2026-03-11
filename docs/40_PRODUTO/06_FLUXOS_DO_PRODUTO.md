# Fluxos do Produto

## Fluxo 1 - Ideia

Ponto de entrada:

- `/ideias`

Objetivo:

- listar ideias
- filtrar por status e canal
- revisar prioridade
- aprovar ou rejeitar com contexto

Elemento tecnico:

- `POST /api/ideias/[id]/aprovar`
- `POST /api/ideias/[id]/gerar-roteiro`

## Fluxo 2 - Roteiro

Ponto de entrada:

- `/roteiros`

Objetivo:

- revisar qualidade do roteiro
- garantir coerencia editorial
- aprovar o que segue para audio

Elemento tecnico:

- `POST /api/roteiros/[id]/aprovar`
- webhook do WF02

## Fluxo 3 - Producao

Ponto de entrada:

- `/producao`
- `/calendario`

Objetivo:

- acompanhar conteudo por status
- mover cards no kanban
- saber o que esta pronto, travado ou aguardando

Elemento tecnico:

- pipeline visual
- transicao de status
- integracao com audios, videos e agenda

## Fluxo 4 - Publicacao

Ponto de entrada:

- `/publicar`

Objetivo:

- selecionar conteudos prontos
- publicar agora ou agendar
- tratar a camada de distribuicao como assistida

Elemento tecnico:

- hooks de `publicarAgora`
- hooks de `agendarPublicacao`
- workflows de publicacao no n8n

## Fluxo 5 - Monitoramento

Ponto de entrada:

- `/monitor`
- `/workflows`
- webhook callback

Objetivo:

- ver logs
- ver execucoes
- reagir a falhas
- acompanhar retry

Elemento tecnico:

- `POST /api/webhooks/workflow-completed`
- tabelas `logs_workflows` e `workflow_queue`

## Fluxo 6 - Configuracao

Ponto de entrada:

- `/settings`

Objetivo:

- configurar n8n
- ver plataformas conectadas
- centralizar parte das integracoes

Limite atual:

- ainda existem partes "em breve"
- o setup ainda depende de variaveis de ambiente e configuracao fora da interface

## Fluxo 7 - Analytics

Ponto de entrada:

- `/analytics`

Estado atual:

- placeholder

Conclusao:

- analytics existe como direcao de produto, nao como capacidade madura do MVP
