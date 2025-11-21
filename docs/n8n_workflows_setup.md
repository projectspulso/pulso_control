# 🔄 n8n Workflows - Guia de Configuração

## Pré-requisitos

1. Conta no n8n Cloud: https://n8n.io/
2. Credenciais OpenAI (GPT-4)
3. Credenciais ElevenLabs ou Google TTS
4. URL da sua instância n8n

## Workflow 1: Ideia → Roteiro

### Endpoint

```
POST https://sua-instancia.n8n.cloud/webhook/gerar-roteiro
```

### Payload

```json
{
  "ideiaId": "uuid",
  "titulo": "string",
  "descricao": "string",
  "canalId": "uuid",
  "linguagem": "pt-BR"
}
```

### Passos no n8n

1. **Webhook Node** - Recebe payload
2. **Supabase Query** - Busca dados do canal e série
3. **OpenAI Node** - Gera roteiro usando GPT-4
   - Prompt: "Você é um roteirista de conteúdo digital. Crie um roteiro estruturado para [tipo_canal] sobre [titulo]. Descrição: [descricao]. Inclua introdução, desenvolvimento e conclusão."
   - Model: gpt-4-turbo
   - Max tokens: 2000
4. **Supabase Insert** - Salva roteiro na tabela `content.roteiros`
5. **Supabase Update** - Atualiza status da ideia para `EM_PRODUCAO`
6. **Response Node** - Retorna JSON com sucesso

### Configuração OpenAI

```
Credentials:
- API Key: sua_key_openai
- Organization: (opcional)

Prompt Template:
System: "Você é um roteirista especializado em conteúdo para {canal_tipo}"
User: "Título: {titulo}\nDescrição: {descricao}\n\nCrie um roteiro completo com introdução, desenvolvimento e conclusão."
```

---

## Workflow 2: Roteiro → Áudio

### Endpoint

```
POST https://sua-instancia.n8n.cloud/webhook/gerar-audio
```

### Payload

```json
{
  "roteiroId": "uuid",
  "conteudo": "string (markdown)",
  "linguagem": "pt-BR",
  "vozId": "default"
}
```

### Passos no n8n

1. **Webhook Node** - Recebe payload
2. **Function Node** - Processa markdown (remove formatação)
3. **ElevenLabs Node** (ou Google TTS)
   - Voice ID: configurar voz preferida
   - Model: eleven_multilingual_v2
4. **Supabase Storage** - Upload do arquivo .mp3
5. **Supabase Insert** - Registro na tabela `assets.audios`
6. **Supabase Update** - Atualiza roteiro com `audio_url`
7. **Response Node** - Retorna URL do áudio

### Configuração ElevenLabs

```
Credentials:
- API Key: sua_key_elevenlabs

Settings:
- Voice: Rachel (ou voz em português)
- Model: eleven_multilingual_v2
- Stability: 0.5
- Similarity Boost: 0.75
```

### Alternativa: Google TTS

```
Credentials:
- Service Account JSON

Settings:
- Language Code: pt-BR
- Voice Name: pt-BR-Wavenet-A
- Audio Format: MP3
```

---

## Workflow 3: Monitoramento de Status

### Endpoint

```
GET https://sua-instancia.n8n.cloud/webhook/status/:executionId
```

### Retorno

```json
{
  "status": "running" | "success" | "error",
  "progress": 0-100,
  "message": "string"
}
```

---

## Configuração no Centro de Comando

1. Copie a URL base do n8n
2. Edite `.env.local`:
   ```
   NEXT_PUBLIC_N8N_WEBHOOK_URL=https://sua-instancia.n8n.cloud/webhook
   ```
3. Reinicie o servidor: `npm run dev`
4. Teste os botões:
   - "Gerar Roteiro (IA)" em `/ideias/[id]`
   - "Gerar Áudio (IA)" em `/roteiros/[id]`

---

## Testes

### Testar WF1 (Gerar Roteiro)

```bash
curl -X POST https://sua-instancia.n8n.cloud/webhook/gerar-roteiro \
  -H "Content-Type: application/json" \
  -d '{
    "ideiaId": "test-123",
    "titulo": "Como fazer café",
    "descricao": "Tutorial rápido de preparo de café",
    "canalId": "test-canal",
    "linguagem": "pt-BR"
  }'
```

### Testar WF2 (Gerar Áudio)

```bash
curl -X POST https://sua-instancia.n8n.cloud/webhook/gerar-audio \
  -H "Content-Type: application/json" \
  -d '{
    "roteiroId": "test-456",
    "conteudo": "Olá, bem-vindo ao tutorial de café.",
    "linguagem": "pt-BR",
    "vozId": "default"
  }'
```

---

## Próximos Passos (Sprint 2)

- [ ] Criar conta n8n Cloud
- [ ] Configurar credenciais OpenAI
- [ ] Configurar credenciais ElevenLabs/Google TTS
- [ ] Importar workflows do template
- [ ] Testar endpoints
- [ ] Atualizar .env.local com URLs
- [ ] Testar integração completa
