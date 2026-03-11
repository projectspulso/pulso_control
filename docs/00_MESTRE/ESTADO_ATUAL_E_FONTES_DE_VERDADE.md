# Estado Atual e Fontes de Verdade

## O que o projeto e hoje

O projeto ja e um sistema interno de operacao editorial com:

- gestao de ideias
- gestao de roteiros
- pipeline de producao
- calendario editorial
- biblioteca de assets
- monitor de workflows
- publicacao assistida
- integracao com Supabase
- integracao com n8n

Isso significa que o repositorio ja passou da fase de conceito.

## O que ainda nao e

O projeto ainda nao e:

- um produto de mercado pronto
- uma automacao multi-rede totalmente confiavel
- uma stack fechada de analytics
- uma base documental coerente por si so

## Fontes de verdade atuais

### App real

Olhar primeiro:

- `app/`
- `lib/`
- `components/`

Esses arquivos mostram o que o sistema realmente faz hoje.

### Banco ideal/base

Olhar primeiro:

- `database/sql/schema/001_pulso_schemas.sql`
- `database/sql/schema/002_pulso_views.sql`
- `database/sql/seeds/001_initial_data.sql`

Esses arquivos explicam a intencao estrutural do banco.

### Banco operacional/correcoes

Olhar primeiro:

- `supabase/migrations/`

Esses arquivos mostram as correcoes, fixs e ajustes feitos para o app atual rodar.

### Workflows e automacao

Olhar primeiro:

- `automation/n8n/docs/`
- `n8n-workflows/`

Os docs descrevem a intencao.
Os JSONs em `n8n-workflows/` sao a representacao mais proxima do que precisa existir no n8n.

## Tensao principal do projeto

A tensao central hoje e esta:

- a modelagem ideal esta espalhada em `database/sql/` e `docs/50_BLUEPRINTS/`
- a operacao real esta espalhada em `app/`, `lib/` e `supabase/migrations/`

Por isso, toda decisao nova deveria responder:

1. Isso mexe na estrutura ideal?
2. Isso mexe so em correcoes do ambiente atual?
3. Isso resolve problema real do produto ou so acumula workaround?

## Verdade sobre a documentacao antiga

Temos quatro tipos de docs antigos:

- docs ainda uteis e conceituais
- docs uteis, mas datados
- docs de operacao pontual
- docs de fix/debug que nao podem ser seguidos cegamente

O acervo antigo nao deve ser apagado, mas tambem nao deve ser lido sem curadoria.

## Leitura pratica

Se a pessoa quer:

### Entender o projeto

Ler:

- `docs/README.md`
- `docs/40_PRODUTO/README.md`
- `docs/50_BLUEPRINTS/README.md`

### Entender o banco

Ler:

- `docs/20_BANCO/MIGRATIONS_NECESSARIAS.md`
- `docs/20_BANCO/INVESTIGACOES_BANCO.md`
- `database/sql/schema/`
- `supabase/migrations/`

### Entender automacao

Ler:

- `docs/30_AUTOMACAO/INVESTIGACOES_AUTOMACAO_E_PUBLICACAO.md`
- `automation/n8n/docs/`
- `n8n-workflows/`

### Entender o legado

Ler:

- `docs/90_LEGADO/MAPA_DA_DOCUMENTACAO_ANTIGA.md`
