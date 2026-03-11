# ✅ Implementação Completa - App PULSO + n8n

**Data:** 29/11/2025  
**Status:** ✅ Funcionalidades principais implementadas

---

## 🎯 RESUMO DAS MUDANÇAS

O app frontend agora está **100% integrado** com o blueprint de automação n8n. Todas as funcionalidades críticas foram implementadas.

---

## 📋 WORKFLOWS IMPLEMENTADOS

### **WF00 - Gerar Ideias (IA Automático)**

- ✅ Hook: `useGerarIdeias()`
- ✅ API: `n8nApi.workflows.gerarIdeias(canalId, quantidade)`
- ✅ UI: Botão "Gerar Ideias IA" em `/canais/[slug]`
- 🔗 Webhook n8n: `gerar-ideias`

**Como usar:**

1. Acesse qualquer canal (ex: `/canais/pulso-dark-pt`)
2. Clique em "Gerar Ideias IA"
3. Escolha quantas ideias (1-50)
4. n8n gera ideias com GPT-4o

---

### **WF01 - Gerar Roteiro**

- ✅ Hook: `useGerarRoteiro()`
- ✅ API: `n8nApi.workflows.gerarRoteiro(ideiaId, prompt)`
- ✅ UI: Botão "Gerar Roteiro" em `/ideias/[id]`
- 🔗 Webhook n8n: `gerar-roteiro`

**Fluxo:**

1. Criar ou aprovar uma ideia
2. Clicar em "Gerar Roteiro"
3. n8n chama GPT-4o e cria roteiro no banco
4. Status da ideia muda automaticamente

---

### **WF02 - Gerar Áudio (TTS)**

- ✅ Hook: `useGerarAudio()`
- ✅ API: `n8nApi.workflows.gerarAudio(roteiroId, vozId)`
- ✅ UI: Botão "Gerar Áudio" em `/roteiros/[id]`
- 🔗 Webhook n8n: `gerar-audio`

**Fluxo:**

1. Aprovar um roteiro
2. Clicar em "Gerar Áudio"
3. n8n gera TTS (OpenAI) e faz upload para Supabase Storage
4. Pipeline atualiza para "AUDIO_GERADO"

---

### **WF03 - Gerar Vídeo**

- ✅ Hook: `useGerarVideo()`
- ✅ API: `n8nApi.workflows.gerarVideo(audioId, template)`
- ⚠️ **Fase 1:** Manual (você edita no CapCut)
- 🚧 **Fase 2:** Auto (Remotion/Shotstack) - futuro

---

### **WF04 - Publicar Conteúdo**

- ✅ Hook: `usePublicarAgora()` - Publicação imediata
- ✅ Hook: `useAgendarPublicacao()` - Agendamento
- ✅ API: `n8nApi.workflows.publicarAgora(pipelineIds, plataformas)`
- ✅ API: `n8nApi.workflows.agendarPublicacao(pipelineId, dataHora, plataformas)`
- ✅ UI: Página `/publicar` completa com modal de agendamento
- 🔗 Webhook n8n: `publicar-agora`, `agendar-publicacao`

**Funcionalidades:**

- ✅ Listar conteúdos "PRONTO_PUBLICACAO"
- ✅ Seleção múltipla
- ✅ Botão "Publicar Agora" (envia para n8n imediatamente)
- ✅ Botão "Agendar" (abre modal com data/hora)
- ✅ Exibe stats (prontos, agendados, hoje)

---

## 🗂️ ESTRUTURA DE ARQUIVOS MODIFICADOS

### **Hooks (`lib/hooks/`)**

```typescript
// lib/hooks/use-n8n.ts
✅ useGerarRoteiro()
✅ useGerarAudio()
✅ useGerarVideo()
✅ usePublicarConteudo()
✅ useAgendarPublicacao()     // NOVO
✅ usePublicarAgora()          // NOVO
✅ useGerarIdeias()            // NOVO
```

### **API (`lib/api/`)**

```typescript
// lib/api/n8n.ts
✅ n8nApi.workflows.gerarRoteiro()
✅ n8nApi.workflows.gerarAudio()
✅ n8nApi.workflows.gerarVideo()
✅ n8nApi.workflows.publicarConteudo()
✅ n8nApi.workflows.agendarPublicacao()   // NOVO
✅ n8nApi.workflows.publicarAgora()       // NOVO
✅ n8nApi.workflows.gerarIdeias()         // NOVO
```

### **Páginas (`app/`)**

```typescript
// app/ideias/[id]/page.tsx
✅ Botão "Aprovar Ideia"
✅ Botão "Gerar Roteiro" (chama n8n WF01)

// app/roteiros/[id]/page.tsx
✅ Botão "Aprovar Roteiro"
✅ Botão "Gerar Áudio" (chama n8n WF02)

// app/canais/[slug]/page.tsx
✅ Botão "Gerar Ideias IA" (chama n8n WF00) // NOVO

// app/publicar/page.tsx
✅ Botão "Publicar Agora" (chama n8n WF04)   // ATUALIZADO
✅ Botão "Agendar" + Modal                    // NOVO
✅ Integração completa com hooks
```

---

## 🔗 WEBHOOKS N8N NECESSÁRIOS

Para tudo funcionar, você precisa ter esses webhooks configurados no n8n:

| Webhook                       | Método | Payload                                                | Workflow |
| ----------------------------- | ------ | ------------------------------------------------------ | -------- |
| `/webhook/gerar-ideias`       | POST   | `{ canal_id, quantidade }`                             | WF00     |
| `/webhook/gerar-roteiro`      | POST   | `{ ideia_id, prompt_adicional? }`                      | WF01     |
| `/webhook/gerar-audio`        | POST   | `{ roteiro_id, voz_id? }`                              | WF02     |
| `/webhook/gerar-video`        | POST   | `{ audio_id, template? }`                              | WF03     |
| `/webhook/publicar-agora`     | POST   | `{ pipeline_ids[], plataformas[] }`                    | WF04     |
| `/webhook/agendar-publicacao` | POST   | `{ pipeline_id, data_hora_publicacao, plataformas[] }` | WF04     |

---

## 🎨 EXPERIÊNCIA DO USUÁRIO

### **1. Gerar Ideias Automaticamente**

```
1. Ir em /canais/pulso-dark-pt
2. Clicar "Gerar Ideias IA"
3. Digite: 10 ideias
4. ✅ n8n gera 10 ideias com GPT-4o
5. Aparecem em /ideias com status RASCUNHO
```

### **2. Aprovar Ideia → Gerar Roteiro**

```
1. Ir em /ideias/[id]
2. Clicar "Aprovar" (status → APROVADA)
3. Clicar "Gerar Roteiro"
4. ✅ n8n cria roteiro
5. Aparece em /roteiros com status RASCUNHO
```

### **3. Aprovar Roteiro → Gerar Áudio**

```
1. Ir em /roteiros/[id]
2. Editar conteúdo se necessário
3. Clicar "Aprovar" (status → APROVADO)
4. Clicar "Gerar Áudio"
5. ✅ n8n gera TTS e faz upload
6. Pipeline muda para AUDIO_GERADO
```

### **4. Publicar Conteúdo**

```
1. Ir em /publicar
2. Selecionar conteúdos prontos
3. Opção A: "Publicar Agora" → vai direto
4. Opção B: "Agendar" → escolhe data/hora
5. ✅ n8n agenda/publica em TikTok + YouTube + Instagram
```

---

## 📊 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

```bash
# .env.local
N8N_URL=https://seu-n8n.com
N8N_API_KEY=sua_chave_api

# Ou use as variáveis públicas (para Next.js client-side)
NEXT_PUBLIC_N8N_URL=https://seu-n8n.com
NEXT_PUBLIC_N8N_API_KEY=sua_chave_api
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **Frontend (App)**

- [x] Hooks de integração n8n
- [x] API client para webhooks
- [x] Página de ideias com aprovação
- [x] Página de roteiros com aprovação
- [x] Página de canais com "Gerar Ideias IA"
- [x] Página de publicação completa
- [x] Modal de agendamento
- [x] Estados de loading/error

### **Backend (n8n)**

- [ ] WF00 - Workflow "Gerar Ideias"
- [x] WF01 - Workflow "Gerar Roteiro" (já existe)
- [x] WF02 - Workflow "Gerar Áudio" (já existe)
- [ ] WF03 - Workflow "Gerar Vídeo" (manual por enquanto)
- [ ] WF04 - Workflow "Publicar Conteúdo"
- [ ] WF04 - Workflow "Agendar Publicação"

### **Banco de Dados**

- [x] Tabelas: ideias, roteiros, audios, videos
- [x] View: `n8n_roteiro_completo`
- [x] Triggers para sync de pipeline
- [x] Views de calendário

---

## 🚀 PRÓXIMOS PASSOS

### **Curto Prazo (1-2 semanas)**

1. **Implementar WF00 no n8n** - Gerar Ideias com GPT-4o
2. **Implementar WF04 no n8n** - Publicação automática nas plataformas
3. **Testar fluxo completo:** Ideia → Roteiro → Áudio → Publicação
4. **Configurar CRON do WF00** - Gerar ideias automaticamente 1x/dia

### **Médio Prazo (1 mês)**

5. **WF03 - Geração automática de vídeo** (Remotion/Shotstack)
6. **Dashboard de métricas** - Acompanhar performance dos posts
7. **A/B Testing** - Testar variantes de títulos/thumbnails

### **Longo Prazo (3 meses)**

8. **Auto-aprovação de ideias** - IA decide o que é bom
9. **Auto-publicação** - Sistema totalmente autônomo
10. **Multicanal escalável** - 10+ canais rodando em paralelo

---

## 🎓 COMO TESTAR LOCALMENTE

```bash
# 1. Rodar o app
npm run dev

# 2. Acessar páginas:
http://localhost:3000/canais/pulso-dark-pt
http://localhost:3000/ideias
http://localhost:3000/roteiros
http://localhost:3000/producao
http://localhost:3000/publicar

# 3. Testar workflow:
- Gerar ideias IA
- Aprovar ideia
- Gerar roteiro
- Aprovar roteiro
- Gerar áudio
- Publicar/Agendar
```

---

## 📝 NOTAS IMPORTANTES

1. **Todos os webhooks do n8n devem aceitar POST com JSON**
2. **O app invalida cache automaticamente após cada ação**
3. **Use `bg-linear-to-r` no Tailwind (não `bg-gradient-to-r`)**
4. **O banco já está completo - não precisa criar schemas**
5. **A view `n8n_roteiro_completo` simplifica queries complexas**

---

## 🐛 TROUBLESHOOTING

### **Erro: "n8n não configurado"**

- Verifique `N8N_URL` e `N8N_API_KEY` no `.env.local`

### **Erro: "Webhook error: 404"**

- Webhook não existe no n8n ou está desativado
- Verifique o path correto (ex: `/webhook/gerar-roteiro`)

### **Erro: "Failed to fetch"**

- CORS bloqueado - configure CORS no n8n
- Ou use NEXT*PUBLIC*\* vars para rodar no client

### **Ideias não aparecem após gerar**

- Aguarde 30s-1min (GPT-4o pode demorar)
- Verifique logs do n8n
- Recarregue a página `/ideias`

---

## 📞 SUPORTE

Se algo não funcionar:

1. Verifique console do navegador (F12)
2. Verifique logs do n8n
3. Verifique se o webhook está ativo
4. Teste com `curl` direto no n8n

---

**Implementado por:** GitHub Copilot  
**Data:** 29/11/2025  
**Versão:** 1.0
