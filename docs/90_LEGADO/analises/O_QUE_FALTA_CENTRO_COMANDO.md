# 🎯 O QUE FALTA NO CENTRO DE COMANDO - Análise Completa

> **Status Atual**: Dashboard básico funcionando + Banco populado (130 ideias)  
> **Objetivo**: Centro de Comando completo para gerenciar todo o ecossistema PULSO

---

## 📊 DIAGNÓSTICO ATUAL (21/11/2025)

### ✅ O QUE JÁ TEMOS (60% completo)

**Banco de Dados:**

- ✅ 6 schemas estruturados (core, content, assets, distribution, analytics, auth)
- ✅ 10 canais ativos
- ✅ 21 séries distribuídas
- ✅ 130 ideias populadas (37 APROVADA, 93 RASCUNHO)
- ✅ 11 views para consultas otimizadas
- ✅ RLS configurado

**Dashboard Atual (Next.js):**

- ✅ Página inicial com estatísticas gerais
- ✅ Listagem de canais com contadores
- ✅ Páginas individuais por canal
- ✅ Filtros básicos por status
- ✅ Integração com Supabase funcionando
- ✅ Sem erros de hydration ou runtime

**Documentação:**

- ✅ 8 blueprints completos
- ✅ Fluxos mapeados
- ✅ Workflows documentados
- ✅ Estrutura técnica definida

### 🔴 O QUE FALTA (40% restante)

---

## 🏗️ PARTE 1: FUNCIONALIDADES DO DASHBOARD

### 🎯 1.1. GESTÃO DE IDEIAS

**Status:** ❌ NÃO EXISTE

**O que falta:**

#### Interface de Criação de Ideias

```typescript
// app/ideias/nova/page.tsx - NÃO EXISTE AINDA

Formulário com:
- Campo: Título da ideia
- Campo: Descrição detalhada
- Select: Canal (dropdown dos 10 canais)
- Select: Série (filtrado por canal escolhido)
- Tags: Input com autocomplete
- Campo: Prioridade (1-10)
- Campo: Origem (MANUAL, IA, FEEDBACK, TRENDING)
- Botão: Salvar como RASCUNHO
- Botão: Aprovar diretamente (status APROVADA)
```

#### Lista/Grid de Ideias

```typescript
// app/ideias/page.tsx - NÃO EXISTE AINDA

Features necessárias:
- Tabela paginada de todas as ideias
- Filtros por:
  * Canal
  * Série
  * Status (RASCUNHO, NOVA, APROVADA, REJEITADA, etc)
  * Prioridade
  * Data de criação
  * Tags
- Busca por texto (título/descrição)
- Ações rápidas:
  * Editar
  * Aprovar/Rejeitar
  * Deletar
  * Gerar roteiro (trigger WF1)
- Ordenação por colunas
- Visualização: Lista ou Cards
```

#### Edição de Ideias

```typescript
// app/ideias/[id]/editar/page.tsx - NÃO EXISTE

Mesmos campos da criação +
- Histórico de alterações
- Campo: Motivo da rejeição (se REJEITADA)
- Botão: Duplicar ideia
```

#### Dashboard de Ideias

```typescript
// app/ideias/dashboard/page.tsx - NÃO EXISTE

Métricas:
- Total de ideias por status (gráfico pizza)
- Ideias criadas por mês (gráfico linha)
- Top 10 tags mais usadas
- Canal com mais ideias
- Série com mais ideias
- Ideias aprovadas aguardando roteiro
- Ideias RASCUNHO há mais de 30 dias (alertas)
```

---

### 🎯 1.2. GESTÃO DE ROTEIROS

**Status:** ❌ NÃO EXISTE

**O que falta:**

#### Lista de Roteiros

```typescript
// app/roteiros/page.tsx - NÃO EXISTE

Features:
- Tabela com todos os roteiros
- Colunas:
  * Título do roteiro
  * Ideia de origem
  * Canal/Série
  * Status (RASCUNHO, EM_REVISAO, APROVADO, REJEITADO)
  * Duração estimada
  * Data de geração
  * Gerado por (IA ou MANUAL)
- Filtros por canal, série, status
- Preview do roteiro (modal)
- Botão: Editar roteiro
- Botão: Aprovar/Rejeitar
- Botão: Gerar áudio (trigger WF2)
```

#### Visualizador/Editor de Roteiro

```typescript
// app/roteiros/[id]/page.tsx - NÃO EXISTE

Features:
- Exibir roteiro formatado (Markdown renderizado)
- Seções destacadas:
  * HOOK (primeiros 3s)
  * DESENVOLVIMENTO
  * TWIST
  * CTA
  * EXTRAS (B-roll, música, tom)
- Editor de texto (Monaco ou similar)
- Botão: Regenerar roteiro (IA)
- Botão: Testar com TTS (preview)
- Histórico de versões
- Comentários/notas internas
- Aprovação com assinatura digital (opcional)
```

#### Comparador de Roteiros

```typescript
// app/roteiros/[id]/comparar/page.tsx - NÃO EXISTE

Funcionalidade:
- Gerar 2-3 variações de roteiro para mesma ideia
- Exibir lado a lado
- Votar na melhor versão
- Mesclar partes de diferentes versões
```

---

### 🎯 1.3. GESTÃO DE PRODUÇÃO

**Status:** ❌ NÃO EXISTE

**O que falta:**

#### Pipeline de Produção (Kanban)

```typescript
// app/producao/page.tsx - NÃO EXISTE

Colunas:
1. Aguardando Roteiro (ideias APROVADA sem roteiro)
2. Roteiro Pronto (roteiros APROVADO sem áudio)
3. Áudio Gerado (tem áudio, sem vídeo)
4. Em Edição (vídeo sendo produzido)
5. Pronto para Publicação
6. Publicado

Cada card mostra:
- Thumbnail preview
- Título
- Canal/Série
- Tempo nesta etapa
- Prazo (se houver)
- Botão: Ver detalhes
- Botão: Avançar etapa
```

#### Fila de Áudio (TTS)

```typescript
// app/producao/audio/page.tsx - NÃO EXISTE

Lista de roteiros aprovados aguardando TTS:
- Status: Aguardando, Em processamento, Completo, Erro
- Botão: Processar agora (trigger WF2)
- Botão: Processar lote (top 10)
- Player de áudio integrado
- Download de arquivo .mp3
- Regenerar com voz diferente
- Métricas:
  * Tempo médio de geração
  * Custo acumulado (API TTS)
  * Taxa de sucesso
```

#### Fila de Vídeo

```typescript
// app/producao/video/page.tsx - NÃO EXISTE

Lista de áudios aguardando vídeo:
- Upload manual de vídeo (até automatizar)
- Ou trigger de geração automática (Runway/Pexels)
- Preview do vídeo
- Status de renderização
- Botão: Download para edição local
- Botão: Marcar como pronto
```

#### Gerenciador de Assets

```typescript
// app/assets/page.tsx - NÃO EXISTE

Biblioteca de todos os assets:
- Filtros: AUDIO, VIDEO, THUMBNAIL, BROLL, MUSICA
- Preview inline
- Busca por nome/tags
- Uso: "Usado em 5 vídeos"
- Upload manual de assets
- Organização por pastas/tags
- Estatísticas de storage usado
```

---

### 🎯 1.4. GESTÃO DE PUBLICAÇÃO

**Status:** ❌ NÃO EXISTE

**O que falta:**

#### Calendário Editorial

```typescript
// app/calendario/page.tsx - NÃO EXISTE

Calendário mensal mostrando:
- Publicações agendadas por dia
- Cores por canal
- Tooltip com detalhes ao hover
- Drag & drop para reagendar
- Botão: Adicionar publicação
- Visão: Mês, Semana, Dia
- Filtros por canal/plataforma
```

#### Agendador de Publicações

```typescript
// app/publicar/page.tsx - NÃO EXISTE

Wizard de 4 passos:

PASSO 1: Escolher Conteúdo
- Dropdown: Conteúdo pronto para publicação
- Preview do vídeo

PASSO 2: Escolher Plataformas
- Checkboxes: YouTube, TikTok, Instagram, Kwai
- Para cada plataforma:
  * Campo: Título otimizado (max chars)
  * Campo: Legenda/descrição
  * Tags/hashtags sugeridas (IA)
  * Thumbnail personalizado

PASSO 3: Agendar ou Publicar Agora
- Radio: Publicar agora / Agendar
- Se agendar:
  * Date picker
  * Time picker
  * Opção: "Melhor horário automático"

PASSO 4: Confirmar
- Resumo de tudo
- Botão: Agendar publicações
- Ou botão: Publicar agora
```

#### Monitoramento de Publicações

```typescript
// app/publicacoes/page.tsx - NÃO EXISTE

Tabela de posts publicados:
- Colunas:
  * Thumbnail
  * Título
  * Plataforma(s)
  * Data de publicação
  * Status (PUBLICADO, ERRO, REMOVIDO)
  * Views (atualizado a cada 6h)
  * Likes
  * Comentários
  * Shares
- Link direto para post
- Botão: Coletar métricas agora
- Botão: Republicar (duplicar)
- Alertas: "Post com erro de publicação"
```

---

### 🎯 1.5. ANALYTICS & MÉTRICAS

**Status:** ❌ NÃO EXISTE

**O que falta:**

#### Dashboard de Performance

```typescript
// app/analytics/page.tsx - NÃO EXISTE

Métricas Gerais (últimos 30 dias):
- Total de views
- Total de likes
- Total de comentários
- Total de shares
- Taxa de engajamento média
- Crescimento de seguidores
- Vídeos publicados
- Tempo médio de retenção

Gráficos:
1. Views por dia (linha)
2. Engajamento por plataforma (barras)
3. Top 10 vídeos (tabela ranqueada)
4. Pior 10 vídeos (tabela)
5. Performance por canal (pizza)
6. Performance por série (barras)
7. Horários de pico de views (heatmap)
8. Hashtags com melhor alcance (nuvem de palavras)
```

#### Análise Comparativa

```typescript
// app/analytics/comparar/page.tsx - NÃO EXISTE

Comparar:
- Canal vs Canal
- Série vs Série
- Plataforma vs Plataforma
- Período vs Período (este mês vs mês passado)
- Formato de vídeo vs Formato

Visualizações:
- Gráficos lado a lado
- Tabela de diferenças percentuais
- Insights automáticos (IA):
  "TikTok performa 32% melhor que YouTube"
  "Vídeos de mistério têm 2.1x mais shares"
  "Publicações às 19h têm 45% mais views"
```

#### Relatórios Exportáveis

```typescript
// app/analytics/relatorios/page.tsx - NÃO EXISTE

Tipos de relatórios:
1. Semanal (PDF/Excel)
2. Mensal (PDF/Excel)
3. Por canal (PDF)
4. Por série (PDF)
5. Comparativo (Excel)

Conteúdo:
- Resumo executivo
- Gráficos principais
- Top/Flop vídeos
- Recomendações da IA
- Próximos passos sugeridos
```

#### Alertas Inteligentes

```typescript
// app/analytics/alertas/page.tsx - NÃO EXISTE

Sistema de notificações automáticas:

ALERTAS DE SUCESSO:
🚀 "Vídeo X alcançou 10k views em 24h"
🎯 "Canal Y bateu meta mensal"
⭐ "Série Z com engajamento 5x acima da média"

ALERTAS DE ATENÇÃO:
⚠️ "Vídeo A com 80% de queda nas views"
📉 "Canal B sem publicações há 7 dias"
🔴 "Série C com 5 vídeos consecutivos abaixo de 500 views"

ALERTAS DE TENDÊNCIA:
📈 "Hashtag #X em alta, considere criar conteúdo"
🔥 "Formato Y viralizando no TikTok"
💡 "Público pedindo mais sobre tema Z (10+ comentários)"
```

---

### 🎯 1.6. CONFIGURAÇÕES & ADMINISTRAÇÃO

**Status:** ⚠️ PARCIAL (só .env)

**O que falta:**

#### Gestão de Canais

```typescript
// app/settings/canais/page.tsx - NÃO EXISTE

CRUD de canais:
- Criar novo canal
- Editar canal existente:
  * Nome
  * Slug
  * Descrição
  * Cor/tema
  * Avatar/logo
  * Status (ATIVO/PAUSADO/ARQUIVADO)
  * Configurações de publicação
- Deletar canal (soft delete)
- Reordenar prioridade
```

#### Gestão de Séries

```typescript
// app/settings/series/page.tsx - NÃO EXISTE

CRUD de séries:
- Criar nova série (associada a canal)
- Editar série:
  * Nome
  * Slug
  * Descrição
  * Tags padrão
  * Template de roteiro específico
  * Periodicidade sugerida
  * Status
- Mover série para outro canal
- Deletar série
```

#### Gestão de Plataformas

```typescript
// app/settings/plataformas/page.tsx - NÃO EXISTE

Configurar conexões:
- YouTube:
  * OAuth configurado
  * Canal vinculado
  * API quota usado/restante
  * Status: Conectado/Erro
  * Botão: Reconectar

- TikTok:
  * API key
  * Account ID
  * Status

- Instagram:
  * Graph API token
  * Business account ID
  * Status

- Kwai:
  * Credenciais
  * Status

Testar conexão de cada plataforma
```

#### Configurações de Workflows

```typescript
// app/settings/workflows/page.tsx - NÃO EXISTE

Gerenciar automações:
- WF1: Ideia → Roteiro
  * Ativar/Desativar
  * Frequência (3x/dia, 1x/dia, manual)
  * Modelo IA (GPT-4, Claude, Gemini)
  * Temperatura
  * Max tokens
  * Prompt customizado
  * Testar workflow

- WF2: Roteiro → Áudio
  * Provedor TTS (ElevenLabs, Google, Azure)
  * Voz padrão
  * Velocidade
  * Pitch
  * Testar com texto sample

- WF3: Publicação
  * Horários padrão
  * Plataformas ativas
  * Regras de agendamento

- WF4: Coleta Métricas
  * Frequência
  * Plataformas monitoradas
  * Threshold de alertas

- WF5: Análise
  * Frequência de relatórios
  * Destinatários de email
  * Formato (PDF, Excel, ambos)
```

#### Usuários & Permissões

```typescript
// app/settings/usuarios/page.tsx - NÃO EXISTE

Gestão de equipe:
- Lista de usuários
- Adicionar novo usuário
- Roles:
  * ADMIN (full access)
  * EDITOR (criar/editar conteúdo)
  * REVIEWER (apenas aprovar/rejeitar)
  * ANALYST (apenas ver métricas)
  * VIEWER (read-only)
- Log de atividades por usuário
```

---

## 🏗️ PARTE 2: FLUXOS QUE FALTAM

### 🔄 2.1. FLUXO COMPLETO: IDEIA → PUBLICAÇÃO

**Status Atual:** ❌ MANUAL E FRAGMENTADO

**Como está hoje:**

1. Ideias existem no banco (manual via SQL)
2. Roteiros não são gerados automaticamente
3. Áudio não é criado
4. Vídeo não é produzido
5. Publicação é 100% manual

**Como deveria ser:**

```mermaid
IDEIA (dashboard)
  ↓ (aprovar no dashboard)
TRIGGER WF1 (automático 3x/dia OU manual)
  ↓
ROTEIRO gerado (notificação no dashboard)
  ↓ (revisar e aprovar no dashboard)
TRIGGER WF2 (automático OU manual)
  ↓
ÁUDIO + VARIANTES criados
  ↓ (opcional: edição manual de vídeo)
VÍDEO finalizado
  ↓ (agendar no calendário)
TRIGGER WF3 (no horário agendado)
  ↓
PUBLICADO em 4 plataformas
  ↓ (WF4 roda 2x/dia)
MÉTRICAS coletadas
  ↓ (WF5 roda 1x/semana)
INSIGHTS & ALERTAS (dashboard)
```

**O que falta implementar:**

- ❌ Botão "Gerar Roteiro" na interface de ideias
- ❌ Webhook de notificação quando roteiro estiver pronto
- ❌ Botão "Gerar Áudio" na interface de roteiros
- ❌ Fila de processamento visível
- ❌ Sistema de notificações em tempo real
- ❌ Calendário de agendamento
- ❌ Integração com APIs das plataformas

---

### 🔄 2.2. FLUXO DE APROVAÇÃO

**Status:** ❌ NÃO EXISTE

**Como deveria funcionar:**

```
CRIADOR cria ideia (status: RASCUNHO)
  ↓
REVISOR 1 aprova ideia (status: APROVADA)
  ↓
WF1 gera roteiro (status: EM_REVISAO)
  ↓
REVISOR 2 aprova roteiro (status: APROVADO)
  ↓
WF2 gera áudio/vídeo
  ↓
EDITOR finaliza vídeo (status: PRONTO_PUBLICACAO)
  ↓
PUBLISHER agenda/publica
```

**O que falta:**

- Sistema de aprovação multi-nível
- Notificações por email/Discord quando ação necessária
- Dashboard de "Pendente Minha Aprovação"
- Histórico de aprovações/rejeições
- Campo de comentários em cada etapa

---

### 🔄 2.3. FLUXO DE FEEDBACK (MÉTRICAS → NOVAS IDEIAS)

**Status:** ❌ NÃO EXISTE

**Como deveria funcionar:**

```
WF5 analisa métricas semanalmente
  ↓
IA identifica padrões:
  - "Vídeos de mistério têm 2x mais views"
  - "Hashtag #darkfacts viral"
  - "Público pede mais sobre X (comentários)"
  ↓
WF5 gera 10-20 novas ideias baseadas em insights
  ↓
Ideias aparecem no dashboard com tag "SUGESTÃO_IA"
  ↓
Equipe revisa e aprova as melhores
  ↓
Ciclo recomeça
```

**O que falta:**

- Workflow 5 implementado
- Lógica de análise de padrões (IA)
- Gerador automático de ideias
- Interface de revisão de ideias sugeridas

---

## 🏗️ PARTE 3: INTEGRAÇÕES EXTERNAS

### 🔌 3.1. INTEGRAÇÕES QUE FALTAM

**Status:** ❌ NENHUMA INTEGRAÇÃO ATIVA

#### n8n Cloud

```
O que falta:
- [ ] Conta n8n criada
- [ ] Workflows 1-5 implementados
- [ ] Webhooks configurados apontando para Supabase
- [ ] Credenciais das APIs configuradas no n8n
- [ ] Testes de cada workflow
```

#### OpenAI / Anthropic (IA)

```
O que falta:
- [ ] API key configurada
- [ ] Integração no WF1 (geração de roteiros)
- [ ] Integração no WF5 (análise de métricas)
- [ ] Prompts otimizados e testados
- [ ] Controle de custos (alertas se >$X/mês)
```

#### ElevenLabs / Google TTS

```
O que falta:
- [ ] API key configurada
- [ ] Integração no WF2 (geração de áudio)
- [ ] Escolha de voz padrão
- [ ] Testes de qualidade
- [ ] Configuração de fallback (se ElevenLabs falhar, usar Google)
```

#### YouTube API

```
O que falta:
- [ ] OAuth 2.0 configurado
- [ ] Canal vinculado
- [ ] Testes de upload de Shorts
- [ ] Integração WF3 (publicação)
- [ ] Integração WF4 (coleta de métricas)
```

#### TikTok API

```
O que falta:
- [ ] Criar TikTok Developer account
- [ ] Obter API credentials
- [ ] Integração WF3 (publicação)
- [ ] Integração WF4 (métricas)
- [ ] Testar com vídeo sample
```

#### Instagram Graph API

```
O que falta:
- [ ] Business account configurado
- [ ] Facebook Developer app criado
- [ ] Access token de longa duração
- [ ] Integração WF3 (publicação de Reels)
- [ ] Integração WF4 (insights)
```

#### Kwai API

```
O que falta:
- [ ] Pesquisar se API pública existe
- [ ] Ou usar alternativa (Publer, Buffer)
- [ ] Integração WF3
```

#### Cloudflare R2 / Supabase Storage

```
O que falta:
- [ ] Decisão: usar R2 ou Supabase Storage
- [ ] Bucket criado
- [ ] Upload de assets via WF2
- [ ] CDN configurado
- [ ] Política de retenção (deletar após X dias?)
```

#### Runway / Pexels (geração de vídeo)

```
O que falta (futuro):
- [ ] API key Runway
- [ ] Ou API key Pexels
- [ ] Integração WF2
- [ ] Templates de vídeo
- [ ] Testes de qualidade
```

---

### 🔌 3.2. WEBHOOKS E NOTIFICAÇÕES

**Status:** ❌ NÃO CONFIGURADO

#### Discord Webhooks

```typescript
O que falta:
- [ ] Criar servidor Discord da equipe
- [ ] Canais:
  * #alertas-criticos (erros de workflow)
  * #novos-roteiros (WF1 completado)
  * #audio-pronto (WF2 completado)
  * #videos-publicados (WF3 completado)
  * #metricas-virais (post >10k views)
  * #relatorios-semanais (WF5)
- [ ] Configurar webhooks em cada workflow
- [ ] Mensagens formatadas com embeds
```

#### Email Notifications

```typescript
O que falta:
- [ ] Configurar SMTP (SendGrid, Resend, etc)
- [ ] Templates de email:
  * Aprovação pendente
  * Roteiro gerado
  * Vídeo publicado com sucesso
  * Vídeo com erro de publicação
  * Relatório semanal (PDF anexo)
- [ ] Preferências de notificação por usuário
```

---

## 🏗️ PARTE 4: EXPERIÊNCIA DO USUÁRIO (UX/UI)

### 🎨 4.1. MELHORIAS DE INTERFACE

**Status Atual:** ⚠️ BÁSICO FUNCIONAL

**O que falta para ser profissional:**

#### Design System

```typescript
O que falta:
- [ ] Paleta de cores consistente
- [ ] Tipografia definida
- [ ] Componentes reutilizáveis:
  * Button (variants: primary, secondary, danger, ghost)
  * Card
  * Table
  * Modal
  * Toast/Notification
  * Dropdown
  * DatePicker
  * FileUploader
  * VideoPlayer
  * AudioPlayer
- [ ] Dark mode (opcional mas recomendado)
- [ ] Ícones consistentes (Lucide, Heroicons)
- [ ] Spacing system (4px, 8px, 16px, 24px, 32px)
```

#### Responsividade

```typescript
O que falta:
- [ ] Mobile first design
- [ ] Breakpoints: mobile, tablet, desktop
- [ ] Menu hamburger em mobile
- [ ] Tabelas viram cards em mobile
- [ ] Gráficos adaptáveis
```

#### Acessibilidade

```typescript
O que falta:
- [ ] Contraste de cores adequado (WCAG AA)
- [ ] Navegação por teclado
- [ ] ARIA labels
- [ ] Focus states visíveis
- [ ] Alt text em imagens
```

---

### 🎨 4.2. NAVEGAÇÃO E ESTRUTURA

**Status Atual:** ⚠️ BÁSICA

**Como está:**

```
/ (home)
/canais
/canais/[slug]
```

**Como deveria ser:**

```
/ (dashboard principal)

/ideias
  /ideias/nova
  /ideias/[id]
  /ideias/[id]/editar
  /ideias/dashboard

/roteiros
  /roteiros/[id]
  /roteiros/[id]/comparar

/producao
  /producao/audio
  /producao/video
  /producao/pipeline

/assets
  /assets/upload

/calendario

/publicar

/publicacoes
  /publicacoes/[id]

/analytics
  /analytics/comparar
  /analytics/relatorios
  /analytics/alertas

/canais
  /canais/[slug]
  /canais/[slug]/series/[serie-slug]

/settings
  /settings/canais
  /settings/series
  /settings/plataformas
  /settings/workflows
  /settings/usuarios
  /settings/perfil

/workflows
  /workflows/[workflow-id]/execucoes
  /workflows/[workflow-id]/logs
```

#### Sidebar Navigation

```typescript
O que falta:
- [ ] Menu lateral fixo
- [ ] Seções:
  * 📊 Dashboard
  * 💡 Ideias
  * 📝 Roteiros
  * 🎬 Produção
  * 📁 Assets
  * 📅 Calendário
  * 🚀 Publicar
  * 📈 Analytics
  * 📺 Canais
  * ⚙️ Configurações
- [ ] Badges com contadores:
  * "Ideias (15)"
  * "Aprovações Pendentes (3)"
  * "Alertas (2)"
- [ ] Search global (Cmd+K)
```

---

## 🏗️ PARTE 5: SEGURANÇA E PERFORMANCE

### 🔒 5.1. SEGURANÇA

**Status:** ⚠️ RLS BÁSICO NO SUPABASE

**O que falta:**

#### Autenticação

```typescript
O que falta:
- [ ] Login com email/senha
- [ ] Login com Google (OAuth)
- [ ] Recuperação de senha
- [ ] 2FA (opcional)
- [ ] Sessões com expiração
- [ ] Logout automático após inatividade
```

#### Autorização

```typescript
O que falta:
- [ ] Middleware Next.js verificando auth em cada rota
- [ ] RLS policies mais granulares no Supabase
- [ ] Proteção de rotas:
  * /settings/* → apenas ADMIN
  * /publicar → apenas PUBLISHER ou ADMIN
  * /analytics → todos autenticados
- [ ] API routes protegidas
```

#### Auditoria

```typescript
O que falta:
- [ ] Log de todas as ações:
  * Quem criou/editou/deletou
  * Quando
  * IP de origem
  * Ação específica
- [ ] Tabela pulso_auth.audit_logs
- [ ] Interface de visualização de logs
```

---

### ⚡ 5.2. PERFORMANCE

**Status:** ⚠️ FUNCIONAL MAS NÃO OTIMIZADO

**O que falta:**

#### Caching

```typescript
O que falta:
- [ ] React Query configurado (já tem, mas expandir)
- [ ] Stale time adequado por query
- [ ] Invalidação de cache inteligente
- [ ] Cache de imagens (Next.js Image)
- [ ] Service Worker (PWA opcional)
```

#### Otimização de Queries

```typescript
O que falta:
- [ ] Pagination em todas as listas
- [ ] Infinite scroll ou "Load More"
- [ ] Índices no banco para queries frequentes
- [ ] Select apenas campos necessários
- [ ] Joins otimizados (usar views já criadas)
```

#### Lazy Loading

```typescript
O que falta:
- [ ] Code splitting por rota
- [ ] Componentes pesados em dynamic import
- [ ] Imagens com loading="lazy"
- [ ] Vídeos não carregam até user interagir
```

---

## 🏗️ PARTE 6: MONITORAMENTO E LOGS

### 📊 6.1. OBSERVABILIDADE

**Status:** ❌ NÃO EXISTE

**O que falta:**

#### Logs Estruturados

```typescript
// lib/logger.ts - NÃO EXISTE

Sistema de logging:
- [ ] Winston ou Pino
- [ ] Níveis: debug, info, warn, error, fatal
- [ ] Contexto: userId, action, resource, timestamp
- [ ] Envio para serviço externo (Datadog, Sentry)
```

#### Error Tracking

```typescript
O que falta:
- [ ] Sentry configurado
- [ ] Source maps para stack traces
- [ ] Contexto de erro (user, página, ação)
- [ ] Agrupamento inteligente de erros
- [ ] Alertas quando erro crítico ocorre
```

#### Performance Monitoring

```typescript
O que falta:
- [ ] Web Vitals tracking (LCP, FID, CLS)
- [ ] API response time tracking
- [ ] Database query performance
- [ ] Dashboards do Vercel Analytics
- [ ] Alertas se P95 > threshold
```

---

## 🎯 ROADMAP DE IMPLEMENTAÇÃO

### 🚀 SPRINT 1 (Semana 1) - FUNDAÇÃO

**Objetivo:** Ter gestão básica de ideias e roteiros

**Tarefas:**

- [ ] Criar página /ideias com lista e filtros
- [ ] Criar página /ideias/nova (formulário)
- [ ] Criar página /ideias/[id]/editar
- [ ] Criar página /roteiros com lista
- [ ] Criar página /roteiros/[id] (visualizador)
- [ ] Implementar API routes para CRUD de ideias
- [ ] Implementar API routes para CRUD de roteiros

**Critério de sucesso:**

- Conseguir criar uma ideia via dashboard
- Conseguir editar e aprovar uma ideia
- Conseguir visualizar roteiros

---

### 🚀 SPRINT 2 (Semana 2) - AUTOMAÇÃO

**Objetivo:** Workflows funcionando end-to-end

**Tarefas:**

- [ ] Configurar conta n8n Cloud
- [ ] Implementar Workflow 1 (Ideia → Roteiro)
- [ ] Testar geração de roteiro via OpenAI
- [ ] Implementar Workflow 2 (Roteiro → Áudio)
- [ ] Testar geração de áudio via ElevenLabs
- [ ] Adicionar botões no dashboard para trigger manual
- [ ] Configurar webhooks de notificação

**Critério de sucesso:**

- Aprovar uma ideia → roteiro gerado automaticamente
- Aprovar roteiro → áudio gerado automaticamente
- Notificações chegando no Discord

---

### 🚀 SPRINT 3 (Semana 3) - PRODUÇÃO

**Objetivo:** Pipeline de produção visível e gerenciável

**Tarefas:**

- [ ] Criar página /producao (Kanban)
- [ ] Criar página /producao/audio (fila TTS)
- [ ] Criar página /producao/video (fila)
- [ ] Criar página /assets (biblioteca)
- [ ] Implementar upload manual de vídeos finalizados
- [ ] Vincular vídeos aos conteúdos no banco

**Critério de sucesso:**

- Ver status de cada conteúdo no pipeline
- Mover cards entre colunas
- Upload de vídeo finalizado funciona

---

### 🚀 SPRINT 4 (Semana 4) - PUBLICAÇÃO

**Objetivo:** Publicar vídeos via dashboard

**Tarefas:**

- [ ] Criar página /calendario
- [ ] Criar página /publicar (wizard)
- [ ] Integrar YouTube API (OAuth + upload)
- [ ] Integrar TikTok API (upload)
- [ ] Implementar Workflow 3 (Publicação)
- [ ] Criar página /publicacoes (monitoramento)

**Critério de sucesso:**

- Agendar uma publicação via calendário
- Publicar um vídeo no YouTube Shorts via dashboard
- Ver post publicado na lista com link

---

### 🚀 SPRINT 5 (Semana 5-6) - ANALYTICS

**Objetivo:** Métricas e insights funcionando

**Tarefas:**

- [ ] Implementar Workflow 4 (Coleta Métricas)
- [ ] Criar página /analytics (dashboard)
- [ ] Criar página /analytics/comparar
- [ ] Implementar gráficos (Chart.js ou Recharts)
- [ ] Implementar Workflow 5 (Análise semanal)
- [ ] Sistema de alertas

**Critério de sucesso:**

- Métricas sendo coletadas 2x/dia automaticamente
- Dashboard mostrando views/likes em tempo real
- Receber relatório semanal por email

---

### 🚀 SPRINT 6 (Semana 7-8) - REFINAMENTO

**Objetivo:** UX profissional e funcionalidades avançadas

**Tarefas:**

- [ ] Design system completo
- [ ] Sidebar navigation
- [ ] Responsividade mobile
- [ ] Dark mode
- [ ] Sistema de notificações in-app
- [ ] Search global (Cmd+K)
- [ ] Onboarding para novos usuários

**Critério de sucesso:**

- App funciona perfeitamente no mobile
- Interface profissional e polida
- Usuários conseguem navegar intuitivamente

---

## 📝 CHECKLIST DE PRIORIDADES

### 🔴 CRÍTICO (fazer primeiro)

- [ ] Interface de criação de ideias
- [ ] Interface de listagem de ideias
- [ ] Workflow 1: Ideia → Roteiro (n8n)
- [ ] Interface de visualização de roteiros
- [ ] Workflow 2: Roteiro → Áudio (n8n)
- [ ] Pipeline de produção (Kanban básico)

### 🟡 IMPORTANTE (fazer em seguida)

- [ ] Calendário editorial
- [ ] Agendador de publicações
- [ ] YouTube API integration
- [ ] Workflow 3: Publicação
- [ ] Workflow 4: Coleta Métricas
- [ ] Dashboard de analytics básico

### 🟢 DESEJÁVEL (quando tiver tempo)

- [ ] TikTok/Instagram API integration
- [ ] Workflow 5: Análise semanal
- [ ] Comparador de roteiros
- [ ] Sistema de aprovação multi-nível
- [ ] Relatórios exportáveis
- [ ] Geração automática de vídeo (Runway)

### ⚪ FUTURO (nice to have)

- [ ] Dark mode
- [ ] PWA (app instalável)
- [ ] Modo offline
- [ ] Multi-idioma
- [ ] Webhooks públicos
- [ ] API pública para integrações externas

---

## 🎯 RESUMO EXECUTIVO

**O que falta no Centro de Comando:**

### Gestão de Conteúdo (0% implementado)

- Interface de ideias (CRUD completo)
- Interface de roteiros (visualização e edição)
- Sistema de aprovação

### Automação (0% ativo)

- 5 Workflows do n8n (documentados mas não implementados)
- Integrações com APIs de IA (OpenAI, ElevenLabs)
- Webhooks e notificações

### Produção (0% implementado)

- Pipeline visual (Kanban)
- Fila de áudio/vídeo
- Biblioteca de assets

### Distribuição (0% implementado)

- Calendário editorial
- Agendador de publicações
- Integrações com plataformas (YouTube, TikTok, Instagram, Kwai)

### Analytics (0% implementado)

- Dashboard de métricas
- Coleta automática de dados
- Relatórios e alertas
- Insights com IA

### Infraestrutura

- Autenticação e autorização completas
- Logging e monitoramento
- Performance optimization
- UX profissional

**Estimativa de trabalho:**

- 🔴 Features críticas: **40-60 horas**
- 🟡 Features importantes: **60-80 horas**
- 🟢 Features desejáveis: **40-60 horas**
- **TOTAL: 140-200 horas de desenvolvimento**

**Sugestão:**
Dividir em **8 sprints de 1 semana**, priorizando features críticas primeiro, validando cada fase antes de avançar.

---

**Última atualização:** 21/11/2025  
**Próxima revisão:** Após Sprint 1 completo
