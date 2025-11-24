# 🚀 Guia Rápido - Importar Workflows Simplificados

## ✅ O que mudou?

Como você ainda **não configurou OpenAI**, criei versões simplificadas:

- ✅ **1-gerar-roteiro-simples.json** - Webhook → Busca Ideia → Salva Roteiro (sem IA)
- ✅ **2-gerar-audio-simples.json** - Webhook → Busca Roteiro → ElevenLabs → Responde

## 📥 Passo 1: Importar Roteiro Simples

1. Acesse: https://pulsoprojects.app.n8n.cloud
2. **Workflows** → **Add Workflow** → **Import from File**
3. Selecione: `1-gerar-roteiro-simples.json`
4. Clique no node **"Buscar Ideia"**
5. Selecione credencial: **Supabase DB** (que você já configurou)
6. Clique no node **"Salvar Roteiro"**
7. Selecione credencial: **Supabase DB**
8. Toggle para **Active**
9. **Save**

## 📥 Passo 2: Importar Audio Simples

1. **Add Workflow** → **Import from File**
2. Selecione: `2-gerar-audio-simples.json`
3. Node **"Buscar Roteiro"**: Selecione **Supabase DB**
4. Node **"ElevenLabs TTS"**:
   - Authentication: **Predefined Credential Type**
   - Credential Type: **ElevenLabs API**
   - Credential: Selecione a que você já criou
5. Toggle **Active**
6. **Save**

## 🔧 Passo 3: Adicionar OpenAI Depois

Quando você configurar OpenAI:

1. Vá em **Credentials** → **Add Credential**
2. Busque: **OpenAI**
3. Adicione sua API Key
4. Abra o workflow **"Gerar Roteiro"**
5. Entre **"Buscar Ideia"** e **"Salvar Roteiro"**, adicione:
   - Node: **HTTP Request**
   - URL: `https://api.openai.com/v1/chat/completions`
   - Method: POST
   - Authentication: OpenAI
   - Body:
   ```json
   {
     "model": "gpt-4o-mini",
     "messages": [
       {
         "role": "user",
         "content": "Crie um roteiro sobre: {{ $json.titulo }}"
       }
     ],
     "temperature": 0.8
   }
   ```
6. Reconecte os nodes

## 🧪 Teste Rápido

```bash
# Testar Gerar Roteiro
curl -X POST https://pulsoprojects.app.n8n.cloud/webhook/gerar-roteiro \
  -H "Content-Type: application/json" \
  -d '{"ideiaId": "SEU_ID_AQUI"}'

# Testar Gerar Audio
curl -X POST https://pulsoprojects.app.n8n.cloud/webhook/gerar-audio \
  -H "Content-Type: application/json" \
  -d '{"roteiroId": "SEU_ID_AQUI", "vozId": "EXAVITQu4vr4xnSDxMaL"}'
```

---

**Agora deve importar sem erros!** 🎉
