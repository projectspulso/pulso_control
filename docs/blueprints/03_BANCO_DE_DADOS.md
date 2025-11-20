# 🗄️ Blueprint: Banco de Dados

## 🎯 Visão Geral

O banco de dados PULSO usa PostgreSQL (Supabase) com arquitetura multi-schema para separação lógica de domínios.

---

## 🏗️ Arquitetura de Schemas

```
┌────────────────────────────────────────────────────────────┐
│                   PULSO DATABASE                           │
│                 (PostgreSQL / Supabase)                    │
└────────────────────────────────────────────────────────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ pulso_core  │  │pulso_content│  │ pulso_assets│
│  (Base)     │  │  (Criação)  │  │   (Mídia)   │
└─────────────┘  └─────────────┘  └─────────────┘
       │                │                │
       └────────────────┴────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────────────┐          ┌─────────────────┐
│pulso_          │          │ pulso_          │
│distribution   │          │ automation      │
│ (Publicação)  │          │  (Workflows)    │
└───────────────┘          └─────────────────┘
        │                             │
        └──────────────┬──────────────┘
                       │
              ┌────────────────┐
              │pulso_analytics │
              │   (Métricas)   │
              └────────────────┘
```

---

## 📊 Schema 1: `pulso_core` (Estrutura Base)

**Propósito**: Dados fundamentais do ecossistema (canais, plataformas, séries)

### Tabelas

#### 1. `canais`
Canais lógicos do PULSO (ex: PULSO Curiosidades PT)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador único |
| `nome` | VARCHAR(255) | Nome do canal |
| `slug` | VARCHAR(255) UNIQUE | URL-friendly |
| `descricao` | TEXT | Descrição do canal |
| `idioma` | VARCHAR(10) | pt-BR, en-US, etc |
| `status` | ENUM | ATIVO/INATIVO/ARQUIVADO |
| `metadata` | JSONB | Dados adicionais |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Última atualização |

**Índices**: `slug`, `status`

---

#### 2. `plataformas`
Tipos de plataforma suportadas

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador |
| `tipo` | ENUM | YOUTUBE_SHORTS, TIKTOK, etc |
| `nome_exibicao` | VARCHAR(255) | Nome amigável |
| `descricao` | TEXT | Detalhes |
| `ativo` | BOOLEAN | Se está ativa |

**Valores Padrão**:
- YouTube Shorts
- TikTok
- Instagram Reels
- Kwai
- Facebook Reels

---

#### 3. `canais_plataformas`
Contas específicas de cada canal em cada plataforma

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador |
| `canal_id` | UUID FK | Referência ao canal |
| `plataforma_id` | UUID FK | Tipo de plataforma |
| `identificador_externo` | VARCHAR(255) | @username, channel_id |
| `nome_exibicao` | VARCHAR(255) | Nome na plataforma |
| `url_canal` | TEXT | Link direto |
| `ativo` | BOOLEAN | Status |
| `configuracoes` | JSONB | Tokens, etc |

**Exemplo**:
```sql
{
  canal_id: "pulso-curiosidades-pt",
  plataforma_id: "youtube",
  identificador_externo: "@PULSOCuriosidadesPT",
  url_canal: "https://youtube.com/@PULSOCuriosidadesPT"
}
```

---

#### 4. `series`
Séries dentro de cada canal

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador |
| `canal_id` | UUID FK | Canal pai |
| `nome` | VARCHAR(255) | Nome da série |
| `slug` | VARCHAR(255) | URL-friendly |
| `descricao` | TEXT | Resumo |
| `status` | ENUM | ATIVO/INATIVO |
| `ordem_padrao` | INTEGER | Prioridade |
| `metadata` | JSONB | Extras |

**Unique**: `(canal_id, slug)`

---

#### 5. `tags`
Tags para classificação

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador |
| `nome` | VARCHAR(100) UNIQUE | Tag |
| `slug` | VARCHAR(150) UNIQUE | URL-friendly |
| `descricao` | TEXT | Explicação |

---

#### 6. `series_tags`
Relação M:N entre séries e tags

| Coluna | Tipo |
|--------|------|
| `serie_id` | UUID FK |
| `tag_id` | UUID FK |

**PK**: `(serie_id, tag_id)`

---

#### 7. `usuarios_internos`
Equipe (opcional)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador |
| `auth_user_id` | UUID | Link auth.users |
| `nome` | VARCHAR(200) | Nome |
| `email` | VARCHAR(200) | Email |
| `papel` | VARCHAR(100) | ROTEIRISTA, EDITOR |
| `ativo` | BOOLEAN | Status |

---

## 📝 Schema 2: `pulso_content` (Criação de Conteúdo)

**Propósito**: Ideias, roteiros e conteúdos produzidos

### Tabelas

#### 1. `ideias`
Banco de ideias brutas

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador |
| `canal_id` | UUID FK | Canal alvo |
| `serie_id` | UUID FK | Série alvo |
| `titulo` | VARCHAR(255) | Título da ideia |
| `descricao` | TEXT | Detalhamento |
| `origem` | VARCHAR(100) | MANUAL, IA, TREND |
| `prioridade` | INTEGER | 1=alta, 5=baixa |
| `status` | ENUM | RASCUNHO, APROVADA, etc |
| `tags` | TEXT[] | Tags livres |
| `linguagem` | VARCHAR(10) | pt-BR |
| `criado_por` | UUID FK | Usuário |
| `metadata` | JSONB | Extras |

**Status Enum**: RASCUNHO, EM_DESENVOLVIMENTO, APROVADA, DESCARTADA

---

#### 2. `roteiros`
Roteiros gerados a partir de ideias

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador |
| `ideia_id` | UUID FK | Ideia origem |
| `titulo` | VARCHAR(255) | Título do roteiro |
| `versao` | INTEGER | Versionamento |
| `conteudo_md` | TEXT | Roteiro em Markdown |
| `duracao_estimado_segundos` | INTEGER | Previsão |
| `status` | ENUM | RASCUNHO, APROVADO, etc |
| `linguagem` | VARCHAR(10) | Idioma |
| `criado_por` | UUID FK | Autor |
| `revisado_por` | UUID FK | Revisor |
| `metadata` | JSONB | Info adicional |

**Status Enum**: RASCUNHO, EM_REVISAO, APROVADO, PUBLICADO, ARQUIVADO

**Unique**: `(ideia_id, versao)`

---

#### 3. `conteudos`
Peças de conteúdo (episódios)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador |
| `canal_id` | UUID FK | Canal |
| `serie_id` | UUID FK | Série |
| `roteiro_id` | UUID FK | Roteiro base |
| `titulo_interno` | VARCHAR(255) | Título de trabalho |
| `sinopse` | TEXT | Resumo |
| `status` | ENUM | Status produção |
| `linguagem` | VARCHAR(10) | Idioma |
| `ordem_na_serie` | INTEGER | Número episódio |
| `tags` | TEXT[] | Tags |
| `metadata` | JSONB | Extras |
| `criado_por` | UUID FK | Criador |

**Status Enum**: RASCUNHO, PRONTO_PARA_PRODUCAO, EM_PRODUCAO, PRONTO_PARA_PUBLICACAO, PUBLICADO, PAUSADO, ARQUIVADO

---

#### 4. `conteudo_variantes`
Variações de um conteúdo (A/B, plataformas)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador |
| `conteudo_id` | UUID FK | Conteúdo pai |
| `nome_variacao` | VARCHAR(100) | "Versão A", "Corte 1" |
| `plataforma_tipo` | ENUM | Plataforma alvo |
| `status` | ENUM | Status |
| `titulo_publico` | VARCHAR(255) | Título final |
| `descricao_publica` | TEXT | Descrição final |
| `legenda` | TEXT | Caption/legenda |
| `hashtags` | TEXT[] | Hashtags |
| `linguagem` | VARCHAR(10) | Idioma |
| `ordem_exibicao` | INTEGER | Ordenação |
| `metadata` | JSONB | Extras |

---

## 🎬 Schema 3: `pulso_assets` (Assets de Mídia)

**Propósito**: Arquivos (áudio, vídeo, thumbs)

### Tabelas

#### 1. `assets`
Registro de todos os arquivos

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador |
| `tipo` | ENUM | AUDIO, VIDEO, IMAGEM, etc |
| `nome` | VARCHAR(255) | Nome do arquivo |
| `descricao` | TEXT | Detalhes |
| `caminho_storage` | TEXT | Path no Storage |
| `provedor` | VARCHAR(100) | SUPABASE, DRIVE, etc |
| `duracao_segundos` | INTEGER | Se áudio/vídeo |
| `largura_px` | INTEGER | Se imagem/vídeo |
| `altura_px` | INTEGER | Se imagem/vídeo |
| `tamanho_bytes` | BIGINT | Tamanho |
| `hash_arquivo` | VARCHAR(255) | Checksum |
| `metadata` | JSONB | Info técnica |
| `criado_por` | UUID FK | Criador |

**Tipo Enum**: AUDIO, VIDEO, IMAGEM, TEXTO, OUTRO

---

#### 2. `conteudo_variantes_assets`
Vínculo M:N entre variantes e assets

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `conteudo_variantes_id` | UUID FK | Variante |
| `asset_id` | UUID FK | Asset |
| `papel` | VARCHAR(50) | Função do asset |
| `ordem` | INTEGER | Ordem |

**PK**: `(conteudo_variantes_id, asset_id, papel)`

**Papéis Comuns**:
- `VIDEO_PRINCIPAL`
- `AUDIO_TTS`
- `THUMBNAIL`
- `LEGENDAS`
- `MUSICA_FUNDO`

---

## 📤 Schema 4: `pulso_distribution` (Publicação)

**Propósito**: Registro de posts em plataformas

### Tabelas

#### 1. `posts`
Cada publicação em cada plataforma

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador |
| `conteudo_variantes_id` | UUID FK | Variante |
| `canal_plataforma_id` | UUID FK | Conta específica |
| `status` | ENUM | Status publicação |
| `titulo_publicado` | VARCHAR(255) | Título usado |
| `descricao_publicada` | TEXT | Descrição usada |
| `legenda_publicada` | TEXT | Caption final |
| `url_publicacao` | TEXT | Link do post |
| `identificador_externo` | VARCHAR(255) | ID na plataforma |
| `data_agendada` | TIMESTAMP | Quando agendar |
| `data_publicacao` | TIMESTAMP | Quando publicou |
| `data_remocao` | TIMESTAMP | Se removido |
| `metadata` | JSONB | Extras |
| `criado_por` | UUID FK | Quem criou |

**Status Enum**: AGENDADO, PUBLICADO, ERRO_PUBLICACAO, CANCELADO

**Índices**: `conteudo_variantes_id`, `canal_plataforma_id`, `status`, `data_publicacao`

---

#### 2. `posts_logs`
Logs de tentativas de publicação

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador |
| `post_id` | UUID FK | Post relacionado |
| `tipo` | VARCHAR(50) | REQUEST, RESPONSE, ERRO |
| `mensagem` | TEXT | Mensagem |
| `payload` | JSONB | Dados completos |
| `created_at` | TIMESTAMP | Data |

---

## ⚙️ Schema 5: `pulso_automation` (Workflows)

**Propósito**: Controle de automações

### Tabelas

#### 1. `workflows`
Catálogo de workflows

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador |
| `nome` | VARCHAR(255) | Nome |
| `slug` | VARCHAR(255) UNIQUE | Identificador |
| `descricao` | TEXT | Descrição |
| `origem` | VARCHAR(50) | N8N, OUTRO |
| `referencia_externa` | VARCHAR(255) | ID no n8n |
| `ativo` | BOOLEAN | Status |
| `configuracao` | JSONB | Config |

---

#### 2. `workflow_execucoes`
Histórico de execuções

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador |
| `workflow_id` | UUID FK | Workflow |
| `entidade_tipo` | VARCHAR(50) | IDEIA, ROTEIRO, etc |
| `entidade_id` | UUID | ID da entidade |
| `status` | VARCHAR(50) | SUCESSO, ERRO, etc |
| `mensagem` | TEXT | Mensagem |
| `payload_entrada` | JSONB | Input |
| `payload_saida` | JSONB | Output |
| `inicio_em` | TIMESTAMP | Início |
| `fim_em` | TIMESTAMP | Fim |
| `criado_por` | UUID FK | Executor |

**Índices**: `workflow_id`, `(entidade_tipo, entidade_id)`

---

## 📊 Schema 6: `pulso_analytics` (Métricas)

**Propósito**: Dados de performance

### Tabelas

#### 1. `eventos`
Eventos brutos coletados

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador |
| `post_id` | UUID FK | Post relacionado |
| `plataforma_id` | UUID FK | Plataforma |
| `tipo` | ENUM | Tipo de evento |
| `quantidade` | INTEGER | Contagem |
| `valor_numerico` | NUMERIC(18,4) | Valor extra |
| `metadata` | JSONB | Dados adicionais |
| `registrado_em` | TIMESTAMP | Data registro |
| `data_evento` | DATE | Data do evento |

**Tipo Enum**: VIEW, LIKE, DESLIKE, COMENTARIO, COMPARTILHAMENTO, CLIQUES_LINK, INSCRICAO, OUTRO

**Índices**: `post_id`, `(tipo, data_evento)`

---

#### 2. `metricas_diarias`
Agregação diária de métricas

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | Identificador |
| `post_id` | UUID FK | Post |
| `plataforma_id` | UUID FK | Plataforma |
| `data_ref` | DATE | Data referência |
| `views` | BIGINT | Views |
| `likes` | BIGINT | Likes |
| `deslikes` | BIGINT | Deslikes |
| `comentarios` | BIGINT | Comentários |
| `compartilhamentos` | BIGINT | Shares |
| `cliques_link` | BIGINT | Cliques |
| `inscricoes` | BIGINT | Inscrições geradas |
| `watch_time_segundos` | BIGINT | Tempo assistido |
| `metadata` | JSONB | Extras |

**Unique**: `(post_id, data_ref)`

**Índices**: `(post_id, data_ref)`

---

## 🔍 Views Públicas (11 total)

Criadas no schema `public` para consumo do frontend:

1. **`vw_pulso_canais`** - Canais com info resumida
2. **`vw_pulso_series`** - Séries por canal
3. **`vw_pulso_ideias`** - Ideias com joins
4. **`vw_pulso_roteiros`** - Roteiros completos
5. **`vw_pulso_conteudos`** - Conteúdos com série/canal
6. **`vw_pulso_conteudo_variantes`** - Variantes detalhadas
7. **`vw_pulso_conteudo_variantes_assets`** - Assets vinculados
8. **`vw_pulso_posts`** - Posts com plataforma/canal
9. **`vw_pulso_posts_metricas_diarias`** - Métricas por dia
10. **`vw_pulso_posts_resumo`** - Agregação total por post
11. **`vw_pulso_workflows`** - Workflows cadastrados
12. **`vw_pulso_workflow_execucoes`** - Execuções

---

## 🔐 Políticas RLS (Row Level Security)

**Recomendado**: Implementar RLS para acesso via frontend

```sql
-- Exemplo: Apenas usuários autenticados veem seus canais
ALTER TABLE pulso_core.canais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem apenas seus canais"
  ON pulso_core.canais
  FOR SELECT
  USING (auth.uid() IN (
    SELECT auth_user_id FROM pulso_core.usuarios_internos
  ));
```

---

## 📁 Arquivos SQL

```
database/sql/
├── schema/
│   ├── 001_pulso_schemas.sql        # ✅ DDL completo
│   └── 002_pulso_views.sql          # ✅ 11 views
├── migrations/
│   └── (futuras alterações)
└── seeds/
    └── 001_initial_data.sql         # ✅ Dados iniciais
```

---

## 🚀 Execução dos Scripts

### 1. Criar Schemas e Tabelas
```bash
# Executar no Supabase SQL Editor
cat database/sql/schema/001_pulso_schemas.sql
```

### 2. Criar Views
```bash
cat database/sql/schema/002_pulso_views.sql
```

### 3. Popular Dados Iniciais
```bash
cat database/sql/seeds/001_initial_data.sql
```

---

## 📊 Tamanho Estimado

| Schema | Tabelas | Linhas (6 meses) | Tamanho Estimado |
|--------|---------|------------------|------------------|
| pulso_core | 7 | ~100 | <1 MB |
| pulso_content | 4 | ~5.000 | 10-20 MB |
| pulso_assets | 2 | ~15.000 | 5-10 MB |
| pulso_distribution | 2 | ~30.000 | 20-40 MB |
| pulso_automation | 2 | ~50.000 | 30-50 MB |
| pulso_analytics | 2 | ~1.000.000 | 200-500 MB |
| **Total** | **19** | **~1M** | **~300-700 MB** |

**Storage (assets)**: 50-100 GB (vídeos)

---

## 🔄 Backup e Manutenção

### Backup Automático (Supabase)
- Daily backups automáticos (plano pago)
- Point-in-time recovery

### Limpeza Periódica
```sql
-- Remover eventos antigos (>90 dias)
DELETE FROM pulso_analytics.eventos
WHERE data_evento < NOW() - INTERVAL '90 days';

-- Arquivar posts antigos
UPDATE pulso_distribution.posts
SET metadata = jsonb_set(metadata, '{archived}', 'true')
WHERE data_publicacao < NOW() - INTERVAL '180 days';
```

---

**Próximo**: [Blueprint: Fluxo de Conteúdo](./04_FLUXO_CONTEUDO.md)
