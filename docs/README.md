# Fio do Novelo - Documentacao Mestre

Este arquivo e o ponto de entrada oficial para entender o projeto.

Objetivo:

- dar um caminho de leitura claro
- separar fonte de verdade de documento legado
- apontar o que precisa ser decidido antes de mexer em codigo, banco ou workflows
- ajudar um humano a enxergar rapido onde esta cada coisa

## Leitura recomendada

Ordem sugerida:

1. [Indice mestre](./00_MESTRE/README.md)
2. [Trilha oficial de execucao](./00_MESTRE/TRILHA_OFICIAL_DE_EXECUCAO.md)
3. [Estado atual e fontes de verdade](./00_MESTRE/ESTADO_ATUAL_E_FONTES_DE_VERDADE.md)
4. [Setup e operacao inicial](./10_SETUP/README.md)
5. [Viabilidade e direcao do produto](./40_PRODUTO/README.md)
6. [Banco de dados](./20_BANCO/README.md)
7. [Automacao e publicacao](./30_AUTOMACAO/README.md)
8. [Blueprints e visao estrutural](./50_BLUEPRINTS/README.md)
9. [Mapa da documentacao antiga](./90_LEGADO/MAPA_DA_DOCUMENTACAO_ANTIGA.md)

## Como pensar o repositorio

O projeto tem hoje duas camadas de verdade:

### 1. Verdade estrutural

Arquivos que descrevem o sistema ideal/base:

- `database/sql/schema/001_pulso_schemas.sql`
- `database/sql/schema/002_pulso_views.sql`
- `database/sql/seeds/001_initial_data.sql`
- `automation/n8n/docs/`
- `n8n-workflows/`
- `docs/50_BLUEPRINTS/`

### 2. Verdade operacional

Arquivos que mostram o que foi sendo corrigido para o app atual funcionar:

- `supabase/migrations/`
- `app/`
- `lib/`
- `components/`

## Regra de uso desta documentacao

- Se um doc antigo contradizer o app atual, o app atual vence.
- Se uma migration de fix contradizer a modelagem ideal, investigar antes de executar.
- Se um workflow estiver documentado, mas nao existir em `n8n-workflows/`, considerar o doc incompleto.
- Se uma funcionalidade estiver no app mas nao estiver no doc, documentar a funcionalidade real antes de evoluir.

## Mapa rapido por tema

### Produto

- Pacote oficial de produto: [./40_PRODUTO/README.md](./40_PRODUTO/README.md)

### Trilha operacional

- Trilha oficial: [./00_MESTRE/TRILHA_OFICIAL_DE_EXECUCAO.md](./00_MESTRE/TRILHA_OFICIAL_DE_EXECUCAO.md)
- Checklist: [./00_MESTRE/CHECKLIST_DA_TRILHA_OFICIAL.md](./00_MESTRE/CHECKLIST_DA_TRILHA_OFICIAL.md)

### Setup e operacao

- Setup inicial: [./10_SETUP/README.md](./10_SETUP/README.md)

### Banco de dados

- Ponto de entrada: [./20_BANCO/README.md](./20_BANCO/README.md)
- Migracoes necessarias: [./20_BANCO/MIGRATIONS_NECESSARIAS.md](./20_BANCO/MIGRATIONS_NECESSARIAS.md)
- Investigacoes de banco: [./20_BANCO/INVESTIGACOES_BANCO.md](./20_BANCO/INVESTIGACOES_BANCO.md)

### Automacao

- Ponto de entrada: [./30_AUTOMACAO/README.md](./30_AUTOMACAO/README.md)
- Investigacoes de automacao e publicacao: [./30_AUTOMACAO/INVESTIGACOES_AUTOMACAO_E_PUBLICACAO.md](./30_AUTOMACAO/INVESTIGACOES_AUTOMACAO_E_PUBLICACAO.md)

### Blueprints

- Visao estrutural e conceitual: [./50_BLUEPRINTS/README.md](./50_BLUEPRINTS/README.md)

### Legado

- Mapa dos docs antigos: [./90_LEGADO/MAPA_DA_DOCUMENTACAO_ANTIGA.md](./90_LEGADO/MAPA_DA_DOCUMENTACAO_ANTIGA.md)

## O que esta organizado agora

Nova camada curada criada para leitura humana:

- `docs/README.md` -> ponto de entrada
- `docs/00_MESTRE/` -> estado atual e fontes de verdade
- `docs/00_MESTRE/TRILHA_OFICIAL_DE_EXECUCAO.md` -> ordem oficial de leitura, validacao e execucao
- `docs/10_SETUP/` -> setup, ambiente e testes rapidos
- `docs/20_BANCO/` -> migracoes e investigacoes de banco
- `docs/30_AUTOMACAO/` -> investigacoes de workflows, webhooks e plataformas
- `docs/40_PRODUTO/` -> direcao do produto e viabilidade
- `docs/50_BLUEPRINTS/` -> blueprints conceituais e arquitetura-alvo
- `docs/90_LEGADO/` -> mapa para navegar o acervo antigo sem se perder

## Proximo principio

Daqui para frente, qualquer nova documentacao deveria nascer dentro dessa estrutura curada.
