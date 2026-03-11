# 📋 STATUS ATUAL DO APP - PULSO CONTROL

**Data:** 23/11/2025  
**Banco de Dados:** ✅ Limpo (21 roteiros, 114 ideias, 0 duplicatas)

---

## ✅ FUNCIONALIDADES COMPLETAS

### 1. **Gestão de Ideias** (`/ideias`)

- ✅ Listagem com filtros (status + canal)
- ✅ Cards com tags e descrição
- ✅ Botão "Gerar Roteiro" (integrado com n8n)
- ✅ Link para detalhes

### 2. **Gestão de Roteiros** (`/roteiros`)

- ✅ Listagem com filtros (status + canal)
- ✅ Cards mostrando título corretamente
- ✅ Página de detalhes (`/roteiros/[id]`)
- ✅ Botão "Gerar Áudio (TTS)" integrado
- ✅ Edição de roteiros

### 3. **Pipeline Kanban** (`/producao`)

- ✅ 6 colunas de status (Aguardando → Publicado)
- ✅ Drag & drop entre colunas (@dnd-kit)
- ✅ Atualização de status via drag
- ✅ Visual feedback durante drag
- ✅ Prioridade (P1-P10) nos cards
- ✅ Data prevista visível
- ✅ Link para calendário

### 4. **Calendário Editorial** (`/calendario`)

- ✅ Visualizações: Mês, Semana, Dia, Lista
- ✅ Drag & drop para reagendar
- ✅ Cores por status
- ✅ Navegação entre datas
- ✅ Localização PT-BR
- ✅ Link para Kanban

### 5. **Gestão de Canais** (`/canais`)

- ✅ Listagem de todos os canais
- ✅ Cards com estatísticas (ideias, roteiros, publicações)
- ✅ Página individual por canal (`/canais/[slug]`)
- ✅ Filtros de status em cada canal

### 6. **Dashboard** (`/`)

- ✅ Estatísticas gerais
- ✅ Cards de resumo (ideias, roteiros, pipeline)
- ✅ Links rápidos para seções

### 7. **Integrações** (`/integracoes`)

- ✅ Listagem de webhooks configurados
- ✅ Status de cada integração
- ✅ Workflows registrados

### 8. **Workflows** (`/workflows`)

- ✅ Listagem de workflows n8n
- ✅ Execuções recentes
- ✅ Status visual (sucesso, erro, executando)
- ✅ Logs detalhados

---

## 🔄 WORKFLOWS N8N (Em configuração manual)

### ✅ Implementados no App:

1. **Gerar Roteiro** (`useGerarRoteiro`)

   - Trigger: Botão em `/ideias/[id]`
   - Endpoint: `n8nApi.workflows.gerarRoteiro(ideiaId, prompt)`
   - Webhook: `gerar-roteiro`

2. **Gerar Áudio** (`useGerarAudio`) ← **VOCÊ ESTÁ MONTANDO**

   - Trigger: Botão em `/roteiros/[id]`
   - Endpoint: `n8nApi.workflows.gerarAudio(roteiroId, vozId)`
   - Webhook: `gerar-audio`
   - Após aprovação do roteiro

3. **Gerar Vídeo** (`useGerarVideo`)

   - Trigger: Próximo passo
   - Endpoint: `n8nApi.workflows.gerarVideo(audioId, template)`
   - Webhook: `gerar-video`

4. **Publicar Conteúdo** (`usePublicarConteudo`)
   - Trigger: Próximo passo
   - Endpoint: `n8nApi.workflows.publicarConteudo(conteudoId, plataforma)`
   - Webhook: `publicar`

---

## 🚀 PRÓXIMOS PASSOS (ORDEM DE PRIORIDADE)

### 1. **TESTAR Kanban no Navegador** (5 min)

- [ ] Abrir https://pulso-control.vercel.app/producao
- [ ] Verificar se 21 cards aparecem corretamente
- [ ] Testar drag & drop entre colunas
- [ ] Verificar se status atualiza no banco
- [ ] Conferir se títulos aparecem

**Como testar:**

```bash
# Verificar se app está rodando
https://pulso-control.vercel.app/producao
```

### 2. **Finalizar Workflows n8n** (Você está fazendo agora)

- [ ] Workflow "Gerar Áudio" (em andamento)
- [ ] Workflow "Gerar Vídeo"
- [ ] Workflow "Publicar Conteúdo"
- [ ] Workflow "Coletar Métricas"

### 3. **Conectar Workflow de Áudio no App** (Já está pronto!)

O botão "🎙️ Gerar Áudio (TTS)" em `/roteiros/[id]` já chama:

```typescript
const gerarAudio = useGerarAudio();
await gerarAudio.mutateAsync({ roteiroId, vozId });
```

**O que precisa no n8n:**

- Webhook URL: `${N8N_URL}/webhook/gerar-audio`
- Payload esperado: `{ roteiroId: string, vozId?: string }`
- Ações:
  1. Buscar roteiro no Supabase
  2. Chamar ElevenLabs TTS
  3. Salvar áudio em `assets.audios`
  4. Atualizar `pipeline_producao.audio_id`
  5. Mudar status para `AUDIO_GERADO`

### 4. **Adicionar Feedback Visual** (10 min)

Quando workflow n8n executar com sucesso/erro:

- [ ] Toast de sucesso/erro
- [ ] Atualizar lista automaticamente
- [ ] Mostrar loading state

### 5. **Página de Assets** (`/assets`) (30 min)

- [ ] Listagem de áudios gerados
- [ ] Player integrado
- [ ] Listagem de vídeos
- [ ] Preview de thumbnails
- [ ] Opção de download

### 6. **Melhorias no Pipeline** (15 min)

- [ ] Adicionar campo de observações no card
- [ ] Botão para editar prioridade
- [ ] Filtro por responsável
- [ ] Busca por título

---

## 🎯 FLUXO COMPLETO (Como deve funcionar)

```
1. IDEIA criada → Status: APROVADA
   ↓
2. Workflow "Gerar Roteiro" (IA)
   → Cria roteiro em pulso_content.roteiros
   → Cria registro em pipeline_producao (status: ROTEIRO_PRONTO)
   ↓
3. [VOCÊ ESTÁ AQUI] Workflow "Gerar Áudio" (ElevenLabs)
   → Salva em assets.audios
   → Atualiza pipeline_producao.audio_id
   → Status: AUDIO_GERADO
   ↓
4. Workflow "Gerar Vídeo" (automático ou manual)
   → Salva em assets.videos
   → Atualiza pipeline_producao.video_id
   → Status: PRONTO_PUBLICACAO
   ↓
5. Workflow "Publicar" (YouTube, TikTok, etc)
   → Faz upload na plataforma
   → Registra em pulso_distribution.posts
   → Status: PUBLICADO
   ↓
6. Workflow "Coletar Métricas" (diário)
   → Busca views, likes, comments via API
   → Salva em pulso_analytics.metricas_diarias
```

---

## 📊 DADOS ATUAIS

| Tabela     | Quantidade | Status   |
| ---------- | ---------- | -------- |
| Ideias     | 114        | ✅ Limpo |
| Roteiros   | 21         | ✅ Limpo |
| Pipeline   | 21         | ✅ Limpo |
| Duplicatas | 0          | ✅ Limpo |
| Formatação | OK         | ✅ Limpo |

---

## 🔧 ARQUIVOS IMPORTANTES

### Frontend (Next.js)

- `app/producao/page.tsx` - Kanban drag & drop
- `app/roteiros/[id]/page.tsx` - Botão "Gerar Áudio"
- `lib/hooks/use-n8n.ts` - Hooks de integração
- `lib/api/n8n.ts` - Cliente da API n8n

### Backend (Supabase)

- `supabase/migrations/20241121_create_pipeline_producao.sql` - Schema completo
- `supabase/migrations/expor_schemas_api.sql` - Views e triggers
- Views públicas: `public.ideias`, `public.roteiros`, `public.pipeline_producao`

### Python Scripts

- `scripts/check_data_quality.py` - Verificar duplicatas
- `scripts/fix_duplicates.py` - Limpar duplicatas (usado)

---

## ❓ O QUE FALTA FAZER NO APP?

### Urgente (para workflow funcionar):

1. ✅ Banco limpo (FEITO)
2. ✅ Kanban implementado (FEITO)
3. ⏳ **Testar drag & drop no navegador** (FALTA TESTAR)
4. ⏳ **Workflow n8n "Gerar Áudio"** (VOCÊ ESTÁ FAZENDO)

### Importante (próximas features):

5. Página `/assets` para gerenciar áudios/vídeos
6. Sistema de notificações (toast)
7. Filtros avançados no pipeline
8. Edição inline de prioridade/data

### Nice to have:

9. Autenticação (Supabase Auth)
10. Permissões por usuário
11. Dashboard com gráficos (métricas)
12. Exportação de relatórios

---

## 🎬 AÇÃO IMEDIATA

**Agora que o banco está limpo, você deve:**

1. **Testar o Kanban** (abrir no navegador e arrastar cards)
2. **Finalizar workflow "Gerar Áudio" no n8n**
3. **Testar botão "Gerar Áudio" em `/roteiros/[id]`**

O app está **95% pronto** para o workflow funcionar! 🚀
