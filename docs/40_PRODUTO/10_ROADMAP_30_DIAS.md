# Roadmap de 30 Dias

## Objetivo

Sair do estado "repositorio promissor" para "MVP validado para 1 canal".

## Semana 1 - Fundacao

Objetivo:

- alinhar docs
- configurar ambiente
- congelar a verdade do banco
- subir app e automacao nativa com previsibilidade

Entregaveis:

- `.env.local` coerente
- lote minimo de migrations definido
- app abrindo
- webhooks mapeados

## Semana 2 - Fluxo funcional

Objetivo:

- fechar o fluxo `ideia -> roteiro -> audio`

Entregaveis:

- ideia aprovada dispara WF01
- roteiro aprovado dispara WF02
- logs e retries visiveis

## Semana 3 - Producao e publicacao assistida

Objetivo:

- levar conteudo ate estado de publicacao

Entregaveis:

- item caminhando pelo `/producao`
- conteudo pronto aparecendo em `/publicar`
- operacao de agendar ou publicar funcionando

## Semana 4 - Aprendizado e decisao

Objetivo:

- medir o primeiro lote
- decidir seguir, ajustar ou matar

Entregaveis:

- lote de 5 a 10 posts analisado
- formato vencedor ou tese revisada
- backlog P0/P1 atualizado
- tela `/validacao` usada como fonte operacional da decisao

## Ajuste atual do roadmap

Em 15 de maio de 2026, o app ganhou a rota `/validacao` para concentrar plano de negocio, plano de marketing, checklist do lote e decisao GO/AJUSTAR/KILL.

Essa rota passa a ser a primeira tela de decisao do MVP interno. Docs e telas auxiliares nao devem substituir essa leitura operacional.

## Regras do roadmap

1. nao abrir 2o canal antes de estabilizar o 1o
2. nao prometer multi-rede antes de validar a ancora
3. nao empilhar feature se o fluxo principal ainda quebra
4. nao chamar renda de passiva antes de existir receita recorrente ou operacao delegavel
