# ✅ CHECKLIST COMPLETO - Sistema Pulso Control

**Data de criação:** 04/12/2025  
**Última atualização:** 04/12/2025 18:30  
**Status geral:** 🟡 Em desenvolvimento (45% concluído)

---

## 📊 RESUMO EXECUTIVO

### ✅ Concluído (45%)

- [x] Estrutura básica do banco (schemas, tabelas core)
- [x] **BANCO COMPLETO** - Personagens, Thumbnails, Feedbacks, Métricas ✨
- [x] Trigger de agendamento automático (3 posts/dia)
- [x] Sistema de ideias e roteiros
- [x] Pipeline de produção
- [x] Views públicas
- [x] Workflows WF00 (Ideias) e WF01 (Roteiros)
- [x] Interface web básica (Next.js)
- [x] Sistema de autenticação
- [x] Documentação completa

### 🟡 Em Andamento (35%)

- [ ] **AGORA:** Organizar assets de thumbnails (pasta PC → projeto)
- [ ] **AGORA:** Inserir personagens manualmente (sem voz ainda)
- [ ] Workflows de produção (WF02 áudio, WF03 vídeo)
- [ ] Interface de personagens e thumbnails

### 🔴 Não Iniciado (20%)

- [ ] Integração ElevenLabs/OpenAI (vozes) - DEPOIS
- [ ] Publicação automatizada (YouTube, TikTok, Instagram)
- [ ] Dashboard de analytics
- [ ] Geração automática de thumbnails (DALL-E 3)

---

## 🗄️ 1. BANCO DE DADOS

### 1.1 Migrations ✅

- [x] **✅ Estrutura completa executada**

  - **Arquivo:** `supabase/migrations/criar_estrutura_completa_assets_feedback.sql`
  - **Concluído:** 04/12/2025
  - **Criado:** personagens, thumbnails, feedbacks, metricas_publicacao
  - **Status:** ✅ Tabelas criadas com sucesso

- [x] **✅ Ajuste de datas executado**

  - **Arquivo:** `supabase/migrations/ajustar_datas_inicio_projeto.sql`
  - **Concluído:** 04/12/2025
  - **Objetivo:** Ajustar datas de 01/12 para 10/12/2025
  - **Status:** ✅ 129 ideias reagendadas

- [x] **✅ Trigger de agendamento ativo**
  - **Arquivo:** `supabase/migrations/trigger_auto_agendar_publicacao.sql`
  - **Concluído:** 04/12/2025
  - **Objetivo:** Auto-agendar novas ideias no calendário
  - **Status:** ✅ Funcionando (3 posts/dia: 9h, 15h, 21h)

### 1.2 Tabelas Faltando 🚧

- [ ] **Criar tabela de plataformas de publicação**

  ```sql
  pulso_core.plataformas_publicacao (
    id, nome, tipo (youtube, tiktok, instagram),
    credenciais_encrypted, ativo, metadata
  )
  ```

  - **Prioridade:** 🟡 ALTA

- [ ] **Criar tabela de agendamentos**

  ```sql
  pulso_content.agendamentos (
    id, pipeline_id, plataforma_id,
    data_agendada, status, tentativas, erro
  )
  ```

  - **Prioridade:** 🟡 ALTA

- [ ] **Criar tabela de logs de publicação**

  ```sql
  pulso_content.logs_publicacao (
    id, pipeline_id, plataforma, status,
    url_publicada, erro, metadata
  )
  ```

  - **Prioridade:** 🟡 ALTA

- [ ] **Criar tabela de templates de thumbnail**
  ```sql
  pulso_content.templates_thumbnail (
    id, nome, categoria, preview_url,
    configuracao_json, ativo
  )
  ```
  - **Prioridade:** 🟢 MÉDIA

### 1.3 Dados Iniciais 🎭

- [x] **✅ Personagem "Pulso" criado**

  - **Conceito:** Personagem metamórfico único que se adapta ao canal
  - **Variações:**
    - Psicologia (calmo, tom grave, speed 0.9)
    - Fatos Inusitados (empolgado, tom agudo, speed 1.1)
    - Tecnologia (profissional, neutro, speed 1.0)
    - Default (equilibrado)
  - **Script:** `supabase/scripts/inserir_personagem_pulso.sql`
  - **Docs:** `docs/40_PRODUTO/90_APOIO/estrategia/PERSONAGEM_PULSO.md`
  - **Status:** ✅ Pronto para executar

- [ ] **Executar script do Pulso no banco**

  ```bash
  # No Supabase SQL Editor:
  # Executar: supabase/scripts/inserir_personagem_pulso.sql
  ```

  - **Prioridade:** 🔴 CRÍTICA

- [ ] **Criar assets visuais do Pulso**

  ```
  public/avatars/
    ├── pulso_psicologia.png (calmo, cores terra)
    ├── pulso_fatos_inusitados.png (animado, vibrante)
    ├── pulso_tecnologia.png (futurista, neon)
    └── pulso_default.png (base padrão)
  ```

  - **Prioridade:** 🟡 ALTA
  - **Opções:** DALL-E 3, Midjourney, ou placeholder

- [ ] **Inserir plataformas** (quando for publicar)

  ```sql
  -- YouTube, TikTok, Instagram
  ```

  - **Prioridade:** 🟢 BAIXA (fase futura)

### 1.4 Views Faltando 📊

- [ ] **View: Dashboard de performance**

  ```sql
  vw_dashboard_performance (métricas agregadas por período)
  ```

  - **Prioridade:** 🟢 MÉDIA

- [ ] **View: Comparação de personagens**

  ```sql
  vw_comparacao_personagens (qual voz performa melhor)
  ```

  - **Prioridade:** 🟢 MÉDIA

- [ ] **View: Análise de horários**
  ```sql
  vw_melhor_horario_publicacao (por dia da semana)
  ```
  - **Prioridade:** 🟢 MÉDIA

---

## 🤖 2. WORKFLOWS N8N

### 2.1 Workflows Completos ✅

- [x] **WF00 - Gerar Ideias**

  - Status: ✅ Funcionando
  - CRON: A cada 30 minutos
  - Usa: GPT-4o

- [x] **WF01 - Gerar Roteiros**
  - Status: ✅ Funcionando
  - CRON: A cada 5 minutos
  - Usa: GPT-4o

### 2.2 Workflows em Andamento 🟡

- [ ] **WF02 - Gerar Áudio TTS**
  - **Status:** 🟡 Parcialmente implementado
  - **NOVA FUNCIONALIDADE:** Integrar variações do Pulso
  - **Falta:**
    - [ ] Buscar personagem "Pulso" do banco
    - [ ] Selecionar variação baseada no canal (canal.slug)
    - [ ] Aplicar speed correto (0.9 psicologia, 1.1 fatos, 1.0 tech)
    - [ ] Implementar chunking para roteiros >4000 chars
    - [ ] Criar WF02.1 para merge de chunks
    - [ ] Adicionar retry logic
    - [ ] Salvar em Supabase Storage correto
  - **Prioridade:** 🔴 CRÍTICA
  - **Docs:** Ver `PERSONAGEM_PULSO.md` seção "Como os Workflows Usam"

### 2.3 Workflows Faltando 🚧

- [ ] **WF03 - Gerar Vídeo**

  - **Objetivo:** Criar vídeo com avatar visual do Pulso adaptado ao canal
  - **Tecnologia:** FFmpeg ou serviço de IA (D-ID, HeyGen)
  - **NOVA FUNCIONALIDADE:** Avatar muda conforme canal
  - **Passos:**
    1. Buscar áudio pronto
    2. Buscar variação do Pulso baseada no canal
    3. Selecionar avatar visual correto (pulso_psicologia.png, etc)
    4. Aplicar cores da variação como filtros/overlays
    5. Gerar vídeo (avatar + áudio + animação)
    6. Upload para Supabase Storage (`videos/`)
    7. Atualizar pipeline com video_id
  - **Prioridade:** 🟡 ALTA
  - **Docs:** Ver `PERSONAGEM_PULSO.md` seção "WF03 - Gerar Vídeo"

- [ ] **WF04 - Avaliar Qualidade (IA)**

  - **Objetivo:** IA avalia roteiro antes de produzir
  - **Tecnologia:** GPT-4o
  - **Critérios:** qualidade, viral, originalidade, clareza
  - **Salva em:** `feedbacks` table
  - **Prioridade:** 🟢 MÉDIA

- [ ] **WF05 - Gerar Thumbnails (IA)**

  - **Objetivo:** Gerar 3 variantes de thumbnail (A/B/C)
  - **Tecnologia:** DALL-E 3 ou Midjourney
  - **Passos:**
    1. Extrair tema do roteiro
    2. Gerar 3 prompts diferentes
    3. Gerar 3 imagens
    4. Salvar no bucket thumbnails/
    5. IA prevê qual terá melhor CTR
  - **Prioridade:** 🟡 ALTA

- [ ] **WF06 - Publicar Conteúdo**

  - **Objetivo:** Publicar automaticamente nas plataformas
  - **Plataformas:** YouTube, TikTok, Instagram
  - **Passos:**
    1. Verificar agendamento
    2. Buscar vídeo + thumbnail + metadata
    3. Upload via API da plataforma
    4. Salvar URL de publicação
    5. Criar log
  - **Prioridade:** 🔴 CRÍTICA

- [ ] **WF07 - Coletar Métricas**

  - **Objetivo:** Buscar views, likes, etc. das plataformas
  - **Frequência:** A cada 6 horas
  - **Plataformas:** YouTube API, TikTok API, Instagram API
  - **Salva em:** `metricas_publicacao` table
  - **Prioridade:** 🟡 ALTA

- [ ] **WF08 - Analisar Performance**

  - **Objetivo:** Comparar expectativa IA vs realidade
  - **Frequência:** Diária
  - **Passos:**
    1. Buscar feedbacks (previsões)
    2. Buscar métricas reais
    3. Calcular acurácia
    4. Identificar padrões de sucesso
    5. Atualizar metadados de aprendizado
  - **Prioridade:** 🟢 MÉDIA

- [ ] **WF09 - Backup e Manutenção**
  - **Objetivo:** Backup de dados, limpeza de arquivos antigos
  - **Frequência:** Semanal
  - **Prioridade:** 🟢 BAIXA

---

## 🎨 3. INTERFACE WEB (NEXT.JS)

### 3.1 Páginas Funcionais ✅

- [x] `/` - Dashboard inicial
- [x] `/ideias` - Lista de ideias
- [x] `/ideias/[id]` - Detalhes da ideia
- [x] `/roteiros` - Lista de roteiros
- [x] `/roteiros/[id]` - Detalhes do roteiro
- [x] `/pipeline` - Calendário de produção
- [x] `/assets` - Biblioteca de mídia

### 3.2 Páginas Faltando 🚧

- [ ] **`/personagens`**

  - CRUD de personagens (vozes, avatares)
  - Estatísticas de uso
  - Comparação de performance

- [ ] **`/thumbnails`**

  - Galeria de thumbnails geradas
  - A/B testing de variantes
  - Métricas de CTR

- [ ] **`/metricas`** ou `/analytics`\*\*

  - Dashboard de performance
  - Gráficos de crescimento
  - Comparação entre plataformas
  - Top performers

- [ ] **`/agendamentos`**

  - Calendário visual de publicações
  - Gerenciar agendamentos
  - Status de publicação

- [ ] **`/feedback`**

  - Visualizar avaliações de IA
  - Adicionar feedback humano
  - Comparar expectativa vs realidade

- [ ] **`/configuracoes`**
  - Gerenciar plataformas
  - Credenciais de API
  - Configurações de workflows

### 3.3 Componentes Faltando 🔧

- [ ] **Gráficos e Charts**

  - Views ao longo do tempo
  - Comparação de métricas
  - Biblioteca: Recharts ou Chart.js

- [ ] **Editor de Roteiro Visual**

  - Preview formatado
  - Edição inline
  - Contagem de palavras/tempo

- [ ] **Preview de Thumbnail**

  - Visualizar variantes lado a lado
  - Votar em melhor opção
  - Upload manual

- [ ] **Player de Vídeo Inline**

  - Assistir vídeos gerados
  - Controles de qualidade

- [ ] **Notificações/Toasts**
  - Feedback de ações
  - Erros e sucessos

### 3.4 Hooks Faltando 🪝

- [ ] **`use-personagens.ts`**

  - CRUD de personagens
  - Filtros por tipo/idioma

- [ ] **`use-thumbnails.ts`**

  - Listar thumbnails por ideia
  - Upload e deletar

- [ ] **`use-metricas.ts`**

  - Buscar métricas por período
  - Agregações e comparações

- [ ] **`use-publicacoes.ts`**
  - Listar agendamentos
  - Publicar manualmente

---

## 🔗 4. INTEGRAÇÕES

### 4.1 APIs de Plataformas 🌐

- [ ] **YouTube Data API v3**

  - [ ] Upload de vídeos
  - [ ] Atualizar metadata
  - [ ] Buscar estatísticas
  - [ ] Gerenciar agendamentos
  - **Doc:** https://developers.google.com/youtube/v3

- [ ] **TikTok API**

  - [ ] Upload de vídeos
  - [ ] Buscar métricas
  - **Doc:** https://developers.tiktok.com/

- [ ] **Instagram Graph API**

  - [ ] Upload de Reels
  - [ ] Buscar insights
  - **Doc:** https://developers.facebook.com/docs/instagram-api

- [ ] **Kwai API**
  - [ ] Upload de vídeos (se disponível API pública)

### 4.2 APIs de IA 🤖

- [x] **OpenAI API** - ✅ Configurada

  - [x] GPT-4o (roteiros, avaliações)
  - [x] TTS-1-HD (áudios)
  - [ ] DALL-E 3 (thumbnails)

- [ ] **ElevenLabs API**

  - Vozes mais naturais (alternativa ao OpenAI TTS)
  - Clonagem de voz

- [ ] **D-ID API**

  - Avatares falantes
  - Vídeos com apresentadores virtuais

- [ ] **Midjourney API** (via Discord bot)
  - Thumbnails mais artísticas

### 4.3 Supabase Storage 📦

- [x] **Bucket: `audios/`** - ✅ Criado
- [ ] **Bucket: `videos/`** - Criar
- [ ] **Bucket: `thumbnails/`** - Criar
- [ ] **Bucket: `broll/`** - Criar (B-rolls, imagens de apoio)

### 4.4 Autenticação e Segurança 🔐

- [x] **Supabase Auth** - ✅ Configurada
- [ ] **Row Level Security (RLS)** - Revisar e completar
- [ ] **Credenciais criptografadas** - Implementar para APIs

---

## 📚 5. DOCUMENTAÇÃO

### 5.1 Documentos Criados ✅

- [x] `docs/00_MESTRE/FLUXO_PRODUCAO_COMPLETO.md`
- [x] `docs/ASSETS_CONFIGURACAO_FINAL.md`
- [x] `docs/AJUSTE_DATAS_INICIO.md`
- [x] `docs/GUIA_RAPIDO_AJUSTE_DATAS.md`
- [x] `docs/TRIGGER_AUTO_AGENDAMENTO.md`
- [x] `docs/QUERY_CANAL_DIA_CORRIGIDA.md`
- [x] `docs/SISTEMA_FEEDBACK_IA.md`

### 5.2 Documentos Faltando 📝

- [ ] **`docs/WORKFLOWS_N8N.md`**

  - Descrição de todos os workflows
  - Configurações necessárias
  - Credenciais e secrets

- [ ] **`docs/INTEGRACAO_PLATAFORMAS.md`**

  - Como configurar YouTube API
  - Como configurar TikTok API
  - Como configurar Instagram API

- [ ] **`docs/SUPABASE_STORAGE.md`**

  - Estrutura de buckets
  - Políticas de acesso
  - Como fazer upload

- [ ] **`docs/PERSONAGENS_GUIA.md`**

  - Como criar personagens
  - Configurar vozes
  - Testar e comparar

- [ ] **`docs/THUMBNAILS_GUIA.md`**

  - Como gerar thumbnails
  - Templates disponíveis
  - A/B testing

- [ ] **`README.md` atualizado**
  - Overview do projeto completo
  - Setup e instalação
  - Arquitetura

---

## 🧪 6. TESTES

### 6.1 Testes de Integração 🔗

- [ ] **Testar fluxo completo: Ideia → Roteiro → Áudio → Vídeo → Publicação**
  - [ ] Criar ideia manualmente
  - [ ] WF01 gera roteiro
  - [ ] Aprovar roteiro
  - [ ] WF02 gera áudio
  - [ ] WF03 gera vídeo
  - [ ] WF05 gera thumbnails
  - [ ] WF06 publica
  - [ ] WF07 coleta métricas

### 6.2 Testes de Workflows ⚙️

- [x] WF00 - Gerar Ideias ✅
- [x] WF01 - Gerar Roteiros ✅
- [ ] WF02 - Gerar Áudio 🟡 (testar com chunking)
- [ ] WF03 - Gerar Vídeo
- [ ] WF05 - Gerar Thumbnails
- [ ] WF06 - Publicar
- [ ] WF07 - Coletar Métricas

### 6.3 Testes de Performance 📊

- [ ] **Tempo de geração de roteiro** (meta: <30s)
- [ ] **Tempo de geração de áudio** (meta: <60s)
- [ ] **Tempo de geração de vídeo** (meta: <180s)
- [ ] **Tempo de upload** (meta: <120s)

---

## 🚀 7. DEPLOYMENT

### 7.1 Ambientes 🌍

- [x] **Desenvolvimento** - ✅ Funcionando

  - Vercel (Next.js)
  - Supabase (banco + storage)
  - n8n (workflows)

- [ ] **Staging/Homologação**

  - Ambiente de testes antes de produção

- [x] **Produção** - ✅ Funcionando (parcialmente)
  - Vercel
  - Supabase
  - n8n cloud

### 7.2 CI/CD 🔄

- [ ] **GitHub Actions**
  - Auto-deploy no Vercel
  - Rodar testes
  - Migrations automáticas (cuidado!)

### 7.3 Monitoramento 📡

- [ ] **Sentry** - Rastreamento de erros
- [ ] **Posthog** - Analytics de uso
- [ ] **Logs centralizados** - Workflow executions

---

## 💰 8. CUSTOS E OTIMIZAÇÃO

### 8.1 Controle de Custos 💵

- [ ] **Dashboard de custos**

  - Custo por ideia gerada
  - Custo por roteiro
  - Custo por áudio (TTS)
  - Custo por thumbnail (DALL-E)

- [ ] **Limites de uso**
  - Max ideias por dia
  - Max roteiros por dia
  - Budget mensal

### 8.2 Otimizações 🎯

- [ ] **Cache de embeddings** (se usar RAG)
- [ ] **Reutilizar assets** (thumbnails similares)
- [ ] **Batch processing** (gerar múltiplos de uma vez)

---

## 🎓 9. TREINAMENTO E APRENDIZADO

### 9.1 Sistema de Feedback ⚡

- [ ] **Implementar coleta de feedback humano**

  - Interface para avaliar roteiros
  - Interface para avaliar áudios
  - Interface para avaliar thumbnails

- [ ] **Implementar comparação IA vs Real**
  - Script que compara previsões com métricas reais
  - Gera relatório de acurácia

### 9.2 Fine-tuning (futuro) 🧠

- [ ] **Coletar dataset de roteiros aprovados**
- [ ] **Fine-tune GPT em roteiros virais**
- [ ] **Fine-tune modelo de previsão de CTR**

---

## 📅 10. CRONOGRAMA SUGERIDO

### **Semana 1 (04-10 Dez)** - FUNDAÇÃO

- [ ] Executar todas as migrations pendentes
- [ ] Inserir dados iniciais (personagens, plataformas)
- [ ] Corrigir e testar WF02 (Áudio completo)
- [ ] Criar buckets de storage faltantes

### **Semana 2 (11-17 Dez)** - PRODUÇÃO

- [ ] Implementar WF03 (Vídeo)
- [ ] Implementar WF05 (Thumbnails)
- [ ] Criar páginas de personagens e thumbnails
- [ ] Testar fluxo completo até vídeo

### **Semana 3 (18-24 Dez)** - PUBLICAÇÃO

- [ ] Configurar APIs das plataformas
- [ ] Implementar WF06 (Publicar)
- [ ] Implementar WF07 (Métricas)
- [ ] Criar página de agendamentos

### **Semana 4 (25-31 Dez)** - ANALYTICS

- [ ] Implementar WF08 (Análise)
- [ ] Criar dashboard de métricas
- [ ] Sistema de feedback humano
- [ ] Documentação final

---

## 🎯 PRIORIDADE MÁXIMA (FAZER AGORA!)

1. ✅ **Executar migration: criar_estrutura_completa_assets_feedback.sql**
2. ✅ **Executar migration: ajustar_datas_inicio_projeto.sql**
3. ✅ **Executar migration: trigger_auto_agendar_publicacao.sql**
4. 🔴 **Inserir personagens iniciais (vozes OpenAI)**
5. 🔴 **Corrigir WF02 para usar personagens**
6. 🔴 **Testar geração de primeiro áudio completo**
7. 🔴 **Criar buckets: videos/, thumbnails/, broll/**
8. 🔴 **Implementar WF03 (Gerar Vídeo básico)**

---

## 📝 NOTAS

- **Última revisão:** 04/12/2025
- **Revisar checklist:** Semanalmente
- **Adicionar itens:** Conforme necessidade
- **Marcar completo:** ✅ quando 100% testado

---

**Como usar este checklist:**

1. Escolha um item
2. Trabalhe até completar
3. Marque como `[x]` concluído
4. Commite a alteração neste arquivo
5. Passe para o próximo item

**Vamos eliminar item por item! 🚀**
