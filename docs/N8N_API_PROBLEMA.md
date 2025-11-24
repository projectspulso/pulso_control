# ⚠️ n8n Cloud - API Não Disponível

A instância **n8n Cloud** (`pulsoprojects.app.n8n.cloud`) **não expõe a API REST publicamente** por padrão.

## 🎯 SOLUÇÃO: Import Manual via JSON

Criei os arquivos JSON dos workflows prontos para importar:

### 📁 Arquivos disponíveis:

- `n8n-workflows/1-gerar-roteiro.json` ✅
- `n8n-workflows/2-gerar-audio.json` ⏳
- `n8n-workflows/3-gerar-video.json` ⏳

---

## 📝 COMO IMPORTAR (Passo a Passo)

### 1. Acesse seu n8n

```
https://pulsoprojects.app.n8n.cloud
```

### 2. Clicar em "Add Workflow" (+ no canto superior direito)

### 3. Clicar nos 3 pontinhos (...) → "Import from File"

### 4. Selecionar o arquivo JSON

### 5. Configurar Credenciais

Cada workflow precisa de credenciais configuradas:

#### Workflow 1: Gerar Roteiro

- ✅ **Supabase PostgreSQL**

  - Host: `db.nlcisbfdiokmipyihtuz.supabase.co`
  - Database: `postgres`
  - User: `postgres`
  - Password: (sua service role key)
  - Port: `5432`
  - SSL: `require`

- ✅ **OpenAI API**
  - API Key: (sua chave OpenAI)

#### Workflow 2: Gerar Áudio

- ✅ **Supabase PostgreSQL** (mesma acima)
- ✅ **ElevenLabs API**
  - API Key: (sua chave ElevenLabs)
- ✅ **Supabase Storage**
  - URL: `https://nlcisbfdiokmipyihtuz.supabase.co`
  - Service Role Key: (sua key)

#### Workflow 3: Gerar Vídeo

- ✅ **Supabase PostgreSQL** (mesma acima)
- ⏳ Serviço de vídeo (a definir)

---

## 🔐 Credenciais Necessárias

### Já tem no .env:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://nlcisbfdiokmipyihtuz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...HQ4
```

### Precisa criar:

#### 1. OpenAI API Key

- Acesse: https://platform.openai.com/api-keys
- Crie uma nova key
- Adicione no n8n

#### 2. ElevenLabs API Key (para áudio)

- Acesse: https://elevenlabs.io/app/settings/api-keys
- Crie uma key
- Adicione no n8n

---

## 🚀 Alternativa: n8n Self-Hosted

Se quiser usar a API do n8n (para criar workflows via script), você precisa de uma instância **self-hosted**.

### Opções:

1. **Docker local**

   ```bash
   docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
   ```

2. **Railway/Render** (gratuito)

   - Deploy automático do n8n
   - Acesso completo à API

3. **Upgrade n8n Cloud** (plano pago)
   - API disponível nos planos Enterprise

---

## ✅ RECOMENDAÇÃO ATUAL

**Use import manual via JSON** - É o método mais confiável e rápido para n8n Cloud.

Os arquivos JSON estão prontos em `n8n-workflows/`.

---

Quer que eu:

1. ✅ Gere os arquivos JSON completos agora?
2. ⏳ Configure Docker local para usar API?
3. ⏳ Explore outras plataformas (Railway/Render)?
