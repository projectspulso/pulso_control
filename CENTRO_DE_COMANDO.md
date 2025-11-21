# 🎮 PULSO Control - Centro de Comando

## 🚀 Visão Geral

**PULSO Control** é o centro de comando completo para gerenciar todo o ecossistema de criação, produção e distribuição de conteúdo do projeto PULSO.

### Arquitetura do Sistema

```
Dashboard Principal
├── Stats em tempo real
├── Atividade recente
└── Quick actions

Canais (/canais)
├── Lista de todos os canais
├── [Canal Específico] (/canais/[slug])
│   ├── Pipeline de ideias
│   ├── Filtros por status
│   └── Ações rápidas (criar roteiro, aprovar, etc)

Workflows (/workflows)
├── Lista de workflows N8N
├── Execuções em tempo real
├── Stats de sucesso/erro
└── Controles (play, pause, config)

Conteúdo (/conteudo)
├── Biblioteca de assets
├── Calendário de publicações
└── Gestão de conteúdos

Analytics (/analytics)
├── Métricas de performance
├── Engajamento
└── ROI

Configurações (/settings)
├── Integrações (Supabase, N8N, APIs)
├── Plataformas conectadas
└── Notificações
```

## 📋 Funcionalidades Implementadas

### ✅ Dashboard (Home)

- Stats gerais do ecossistema
- Canais ativos, ideias totais, em produção, aprovadas
- Lista de últimas ideias
- Log de workflows recentes
- Atualização em tempo real

### ✅ Canais

**Lista de Canais:**

- Cards com stats individuais (ideias, publicações)
- Status de ativo/inativo
- Botão para adicionar novos canais

**Página Individual do Canal:**

- Pipeline completo de ideias
- Filtros por status (Nova, Em Análise, Aprovada, Em Produção, etc)
- Stats por status
- Ações rápidas (criar roteiro, aprovar ideia)
- Breadcrumb navigation

### ✅ Workflows

- Lista de workflows N8N conectados
- Stats de execuções (Total, Sucesso, Erro, Executando, Pendente)
- Log em tempo real das últimas 20 execuções
- Status visual com cores e ícones
- Controles para cada workflow (play, pause, config)
- Informações de última execução

### 🚧 Em Desenvolvimento

- **Conteúdo**: Biblioteca de assets e calendário
- **Analytics**: Métricas e performance
- **Settings**: Configurações de integrações

## 🎯 Fluxo de Trabalho

### 1. Ideação

```
Canais → [Canal] → Nova Ideia
↓
Status: NOVA → EM_ANALISE → APROVADA
```

### 2. Produção

```
Ideia APROVADA → Criar Roteiro
↓
Roteiro → Gerar Conteúdo (Workflows)
↓
Status: EM_PRODUCAO
```

### 3. Distribuição

```
Conteúdo Pronto → Publicar
↓
Workflows → TikTok, YouTube, Instagram, etc
↓
Analytics → Métricas de performance
```

## 🎨 Design System

### Cores Principais

- **Purple** (`#a855f7`): Ações primárias, navegação ativa
- **Pink** (`#ec4899`): Destaques
- **Yellow** (`#eab308`): Avisos, pendências
- **Green** (`#22c55e`): Sucesso, aprovado
- **Red** (`#ef4444`): Erros, rejeitado
- **Blue** (`#3b82f6`): Informações

### Status de Ideias

- 🔵 **NOVA**: Ideia recém criada
- 🟡 **EM_ANALISE**: Em revisão
- 🟢 **APROVADA**: Pronta para produção
- 🔴 **REJEITADA**: Descartada
- 🟣 **EM_PRODUCAO**: Sendo produzida
- ⚫ **ARQUIVADA**: Arquivada

### Status de Workflows

- 🟢 **SUCESSO**: Executado com sucesso
- 🔴 **ERRO**: Falha na execução
- 🟡 **EXECUTANDO**: Em execução (animação de loading)
- ⚪ **PENDENTE**: Aguardando execução

## 🔗 Integrations

### Supabase

- **URL**: `nlcisbfdiokmipyihtuz.supabase.co`
- **Schema**: `public` (views apontando para `pulso_*` schemas)
- **Tables**: ideias, roteiros, canais, series, workflows, workflow_execucoes, etc

### N8N

- Workflows de automação
- Integração via API
- Webhooks para executar workflows

### Plataformas

- YouTube Data API
- TikTok API
- Instagram Graph API
- Facebook Graph API
- Twitter API
- LinkedIn API

## 📦 Estrutura de Arquivos

```
app/
├── page.tsx                    # Dashboard principal
├── canais/
│   ├── page.tsx               # Lista de canais
│   └── [slug]/
│       └── page.tsx           # Página individual do canal
├── workflows/
│   └── page.tsx               # Gestão de workflows
├── conteudo/
│   └── page.tsx               # Biblioteca de conteúdo
├── analytics/
│   └── page.tsx               # Métricas
└── settings/
    └── page.tsx               # Configurações

components/
├── layout/
│   └── sidebar.tsx            # Navegação principal
└── dashboard/
    ├── stats.tsx              # Cards de estatísticas
    ├── ideias-lista.tsx       # Lista de ideias
    └── workflows-log.tsx      # Log de workflows

lib/
├── api/
│   ├── ideias.ts              # CRUD de ideias
│   ├── roteiros.ts            # CRUD de roteiros
│   ├── workflows.ts           # CRUD de workflows
│   └── core.ts                # Canais, séries, plataformas
├── hooks/
│   ├── use-ideias.ts          # React Query hooks
│   ├── use-roteiros.ts
│   ├── use-workflows.ts
│   └── use-core.ts
└── supabase/
    └── client.ts              # Cliente Supabase
```

## 🚀 Como Usar

### Navegação

Use a **sidebar** à esquerda para navegar entre seções:

- **Dashboard**: Visão geral
- **Canais**: Gerenciar canais e ideias
- **Workflows**: Monitorar automações
- **Conteúdo**: Biblioteca de assets
- **Analytics**: Métricas
- **Configurações**: Integrações

### Gerenciar Ideias por Canal

1. Clique em **Canais**
2. Selecione um canal
3. Veja o pipeline completo de ideias
4. Use filtros para organizar por status
5. Clique em "Criar Roteiro" em ideias aprovadas

### Monitorar Workflows

1. Clique em **Workflows**
2. Veja execuções em tempo real
3. Use controles para pausar/iniciar
4. Monitore stats de sucesso/erro

## 🔧 Próximos Passos

### Funcionalidades Planejadas

- [ ] Modal para criar nova ideia
- [ ] Modal para criar roteiro
- [ ] Integração real com N8N API
- [ ] Calendário de publicações
- [ ] Biblioteca de assets com upload
- [ ] Métricas em tempo real
- [ ] Notificações push
- [ ] Sistema de permissões
- [ ] Export de relatórios

### Melhorias Técnicas

- [ ] Server-side rendering otimizado
- [ ] Cache strategies
- [ ] Optimistic updates
- [ ] Error boundaries
- [ ] Loading states aprimorados
- [ ] Testes automatizados

## 📊 Dados Atuais

- ✅ **30 ideias** criadas
- ✅ **5 workflows** N8N
- ✅ **25 execuções** de workflows
- ✅ **1 canal**: Pulso Dark PT
- ✅ **2 séries**: Curiosidades Dark + Mistérios Urbanos
- ✅ **6 plataformas** conectadas

---

**Desenvolvido para o ecossistema PULSO** 🚀
