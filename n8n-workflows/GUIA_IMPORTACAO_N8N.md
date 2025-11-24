# 🚀 Guia Completo: Importar Workflows no n8n

## 📋 O que você vai fazer

Você vai importar 3 workflows prontos no seu n8n Cloud:

1. **Gerar Roteiro** - Usa OpenAI para criar roteiros
2. **Gerar Áudio** - Usa ElevenLabs para criar narração
3. **Gerar Vídeo** - Usa Remotion para criar vídeo final

---

## ⚙️ PASSO 1: Configurar Credenciais (ANTES de importar)

### 1.1 OpenAI API Key

1. Acesse: https://pulsoprojects.app.n8n.cloud
2. No menu lateral esquerdo, clique em **"Credentials"**
3. Clique no botão **"Add Credential"** (canto superior direito)
4. Na busca, digite: `OpenAI`
5. Selecione: **"OpenAI"**
6. Preencha:
   - **Name**: `OpenAI`
   - **API Key**: Cole sua chave da OpenAI (começa com `sk-...`)
7. Clique em **"Save"**

### 1.2 ElevenLabs API Key

1. Ainda na tela de Credentials, clique em **"Add Credential"**
2. Na busca, digite: `ElevenLabs`
3. Selecione: **"ElevenLabs API"**
4. Preencha:
   - **Name**: `ElevenLabs API`
   - **API Key**: Cole sua chave do ElevenLabs (começa com `el_...` ou similar)
5. Clique em **"Save"**

### 1.3 Supabase Database (PostgreSQL)

1. Clique em **"Add Credential"**
2. Na busca, digite: `Postgres`
3. Selecione: **"Postgres"**
4. Preencha com seus dados do Supabase:
   - **Name**: `Supabase DB`
   - **Host**: `nlcisbfdiokmipyihtuz.supabase.co`
   - **Database**: `postgres`
   - **User**: `postgres.nlcisbfdiokmipyihtuz`
   - **Password**: Sua senha do Supabase
   - **Port**: `5432`
   - **SSL**: ✅ Marque "Use SSL"
5. Clique em **"Test Connection"** para verificar
6. Se aparecer "Connection successful", clique em **"Save"**

### 1.4 Supabase Storage

1. Clique em **"Add Credential"**
2. Na busca, digite: `Supabase`
3. Selecione: **"Supabase API"**
4. Preencha:
   - **Name**: `Supabase`
   - **Host**: `https://nlcisbfdiokmipyihtuz.supabase.co`
   - **Service Role Secret**: Cole seu Supabase Service Role Key (da aba API Settings)
5. Clique em **"Save"**

---

## 📥 PASSO 2: Importar Workflow 1 - Gerar Roteiro

### 2.1 Importar o arquivo

1. No menu lateral, clique em **"Workflows"**
2. Clique no botão **"Add Workflow"** (canto superior direito)
3. No dropdown que abrir, clique em **"Import from File"**
4. Navegue até a pasta: `d:\projetos\pulso_projects\n8n-workflows\`
5. Selecione o arquivo: **`1-gerar-roteiro.json`**
6. Clique em **"Open"** ou **"Abrir"**

### 2.2 Configurar Credenciais no Workflow

Você verá o workflow aberto com vários nodes (caixinhas). Alguns terão um ⚠️ vermelho.

#### Node "Buscar Ideia" (PostgreSQL):

1. Clique no node **"Buscar Ideia"**
2. No painel direito, procure por **"Credential to connect with"**
3. Clique no dropdown e selecione: **"Supabase DB"**
4. Feche o painel (clique fora ou no X)

#### Node "OpenAI":

1. Clique no node **"OpenAI"**
2. No painel direito, procure por **"Credential to connect with"**
3. Clique no dropdown e selecione: **"OpenAI"**
4. Feche o painel

#### Node "Salvar Roteiro" (PostgreSQL):

1. Clique no node **"Salvar Roteiro"**
2. Selecione credencial: **"Supabase DB"**

#### Node "Log Execução" (PostgreSQL):

1. Clique no node **"Log Execução"**
2. Selecione credencial: **"Supabase DB"**

### 2.3 Ativar o Workflow

1. No canto superior direito, você verá um toggle **"Inactive"**
2. Clique nele para mudar para **"Active"** (ficará verde)
3. Clique no botão **"Save"** (canto superior direito)

✅ **Workflow 1 concluído!**

---

## 📥 PASSO 3: Importar Workflow 2 - Gerar Áudio

### 3.1 Importar o arquivo

1. Clique em **"Workflows"** no menu lateral
2. Clique em **"Add Workflow"** → **"Import from File"**
3. Selecione: **`2-gerar-audio.json`**
4. Clique em **"Open"**

### 3.2 Configurar Credenciais

#### Node "Buscar Roteiro":

1. Clique no node
2. Selecione credencial: **"Supabase DB"**

#### Node "ElevenLabs TTS":

1. Clique no node
2. Procure por **"Authentication"**
3. Selecione: **"Predefined Credential Type"**
4. Em **"Credential Type"**, selecione: **"ElevenLabs API"**
5. Em **"Credential to connect with"**, selecione: **"ElevenLabs API"**

#### Node "Upload Supabase":

1. Clique no node
2. Selecione credencial: **"Supabase"**

#### Node "Salvar Audio":

1. Selecione: **"Supabase DB"**

#### Node "Atualizar Roteiro":

1. Selecione: **"Supabase DB"**

#### Node "Log Execução":

1. Selecione: **"Supabase DB"**

### 3.3 Ativar o Workflow

1. Toggle para **"Active"**
2. Clique em **"Save"**

✅ **Workflow 2 concluído!**

---

## 📥 PASSO 4: Importar Workflow 3 - Gerar Vídeo

### 4.1 Importar o arquivo

1. **"Add Workflow"** → **"Import from File"**
2. Selecione: **`3-gerar-video.json`**

### 4.2 Configurar Credenciais

#### Node "Buscar Audio":

1. Selecione: **"Supabase DB"**

#### Node "Remotion Render":

**ATENÇÃO**: Este workflow precisa de uma API de vídeo (Remotion ou similar).

Por enquanto, você pode:

- **Opção A**: Deixar inativo até configurar serviço de vídeo
- **Opção B**: Criar uma credencial fake para não dar erro

Para criar credencial fake:

1. Vá em **"Credentials"** → **"Add Credential"**
2. Busque: `HTTP Header Auth`
3. Selecione: **"Header Auth"**
4. Preencha:
   - **Name**: `Remotion API`
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer fake-key-temporario`
5. Salve

Depois volte e selecione esta credencial no node.

#### Demais Nodes:

- "Salvar Video": **Supabase DB**
- "Atualizar Roteiro": **Supabase DB**
- "Log Execução": **Supabase DB**

### 4.3 Ativar (ou não)

- Se configurou Remotion: Ative
- Se não tem serviço de vídeo ainda: Deixe **Inactive**

✅ **Workflow 3 concluído!**

---

## ✅ PASSO 5: Verificar URLs dos Webhooks

### 5.1 Copiar URL do Webhook

Para cada workflow ativo:

1. Abra o workflow
2. Clique no node **"Webhook"** (primeiro node)
3. No painel direito, você verá **"Production URL"**
4. Clique no ícone de **copiar** ao lado da URL
5. Salve essa URL

### 5.2 URLs que você deve ter:

```
Gerar Roteiro:
https://pulsoprojects.app.n8n.cloud/webhook/gerar-roteiro

Gerar Áudio:
https://pulsoprojects.app.n8n.cloud/webhook/gerar-audio

Gerar Vídeo:
https://pulsoprojects.app.n8n.cloud/webhook/gerar-video
```

---

## 🧪 PASSO 6: Testar os Workflows

### 6.1 Testar Gerar Roteiro

1. Abra o workflow **"PULSO - Gerar Roteiro"**
2. Clique no node **"Webhook"**
3. Clique em **"Listen for Test Event"** (botão no painel direito)
4. Abra um terminal/PowerShell e execute:

```bash
curl -X POST https://pulsoprojects.app.n8n.cloud/webhook/gerar-roteiro \
  -H "Content-Type: application/json" \
  -d "{\"ideiaId\": \"SEU_ID_DE_IDEIA_AQUI\"}"
```

**Para pegar um ID de ideia real:**

1. Vá em: https://pulso-control.vercel.app/ideias (depois que configurar env vars)
2. Clique em uma ideia
3. Copie o ID da URL (último pedaço)

4. Volte ao n8n e veja os dados fluindo pelos nodes
5. Se tudo funcionar, você verá mensagem de sucesso no último node

### 6.2 Testar Gerar Áudio

1. Abra o workflow **"PULSO - Gerar Áudio"**
2. **"Listen for Test Event"**
3. Execute:

```bash
curl -X POST https://pulsoprojects.app.n8n.cloud/webhook/gerar-audio \
  -H "Content-Type: application/json" \
  -d "{\"roteiroId\": \"SEU_ID_DE_ROTEIRO_AQUI\", \"vozId\": \"EXAVITQu4vr4xnSDxMaL\"}"
```

(Use um roteiroId que você criou no teste anterior)

---

## 🎯 PRÓXIMOS PASSOS

### Depois de importar tudo:

1. **Configurar Environment Variables no Vercel**

   - Acesse: https://vercel.com/projectspulso/pulso-control/settings/environment-variables
   - Adicione:
     ```
     NEXT_PUBLIC_SUPABASE_URL = https://nlcisbfdiokmipyihtuz.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY = (sua anon key)
     N8N_URL = https://pulsoprojects.app.n8n.cloud
     N8N_API_KEY = (sua api key do n8n)
     ```
   - Clique em "Redeploy" para aplicar

2. **Testar no App**

   - Vá em: https://pulso-control.vercel.app/ideias
   - Crie uma nova ideia
   - Clique em "Gerar Roteiro"
   - Aguarde alguns segundos
   - Vá para Roteiros e veja o resultado!

3. **Monitorar Execuções**
   - No n8n, vá em **"Executions"** (menu lateral)
   - Veja todas as execuções dos workflows
   - Clique em cada uma para ver detalhes

---

## ❓ Problemas Comuns

### ❌ "Workflow is not active"

**Solução**: Abra o workflow e clique no toggle para **Active**

### ❌ "Could not find credential"

**Solução**: Configure as credenciais primeiro (Passo 1)

### ❌ Node com ⚠️ vermelho

**Solução**: Clique no node e selecione a credencial correta

### ❌ Erro no PostgreSQL

**Solução**: Verifique se os dados da conexão estão corretos (host, user, password)

### ❌ Webhook não responde

**Solução**:

1. Verifique se o workflow está **Active**
2. Copie a URL do webhook novamente
3. Teste com curl antes de usar no app

---

## 📞 Ajuda

Se tiver dúvidas:

1. Tire screenshot da tela
2. Me mostre qual passo você está
3. Me diga qual erro apareceu

**Vamos conseguir!** 🚀
