# Setup n8n para PULSO

## Opção 1: n8n Cloud (Recomendado para começar)

1. Acesse https://n8n.io e crie uma conta
2. Crie um workspace
3. Vá em **Settings → API** e gere uma API key
4. Copie a URL do seu workspace (ex: `https://seu-workspace.app.n8n.cloud`)
5. Adicione ao `.env`:
   ```
   N8N_URL=https://seu-workspace.app.n8n.cloud
   N8N_API_KEY=sua_api_key_aqui
   ```

## Opção 2: n8n Self-hosted com Docker

### Pré-requisitos

- Docker e Docker Compose instalados

### Passos

1. **Edite as credenciais** em `docker-compose.yml`:

   ```yaml
   - N8N_BASIC_AUTH_USER=seu_usuario
   - N8N_BASIC_AUTH_PASSWORD=sua_senha_forte
   ```

2. **Inicie o n8n**:

   ```bash
   cd automation/n8n
   docker-compose up -d
   ```

3. **Acesse**: http://localhost:5678

   - Usuário: admin
   - Senha: pulso2025 (ou a que você configurou)

4. **Configure no `.env`**:
   ```
   N8N_URL=http://localhost:5678
   N8N_API_KEY=  # Gere em Settings → API no n8n
   ```

### Comandos úteis

```bash
# Ver logs
docker-compose logs -f n8n

# Parar
docker-compose down

# Reiniciar
docker-compose restart

# Backup dos workflows
docker-compose exec n8n n8n export:workflow --all --output=/home/node/.n8n/workflows/
```

## Conectando n8n ao Supabase

### No n8n, crie uma credencial do tipo "Supabase":

1. **Name**: Pulso Supabase
2. **Host**: `nlcisbfdiokmipyihtuz.supabase.co`
3. **Service Role Secret**: Cole a `SUPABASE_SERVICE_ROLE_KEY` do `.env`

### Testando a conexão

Crie um workflow simples:

1. **Manual Trigger**
2. **Supabase** node → Query:
   ```sql
   SELECT * FROM public.vw_pulso_canais LIMIT 5
   ```

Se retornar dados, está conectado! ✅

## Workflows iniciais sugeridos

1. **Ideia → Roteiro (IA)**

   - Trigger: Webhook ou Cron
   - Lê: `vw_pulso_ideias` (status = RASCUNHO)
   - OpenAI/Anthropic: Gera roteiro
   - Supabase: Insere em `pulso_content.roteiros`

2. **Roteiro → Áudio TTS**

   - Trigger: Database change (Supabase)
   - Lê: `vw_pulso_roteiros` (status = APROVADO)
   - ElevenLabs/Google TTS: Gera áudio
   - Supabase Storage: Upload
   - Supabase: Insere em `pulso_assets.assets`

3. **Coleta de métricas**
   - Trigger: Cron (diário)
   - Lê: `vw_pulso_posts` (status = PUBLICADO)
   - YouTube API: Busca métricas
   - Supabase: Atualiza `pulso_analytics.metricas_diarias`

## Exportando/Importando workflows

### Exportar

No n8n → Workflows → (três pontinhos) → Download

Salve em: `automation/n8n/workflows/nome-do-workflow.json`

### Importar

No n8n → Workflows → Import from File

## Próximos passos

1. Configure as credenciais de APIs externas no n8n:
   - OpenAI/Anthropic (para geração de roteiros)
   - ElevenLabs (TTS)
   - YouTube API
   - TikTok API
2. Crie webhooks no Supabase (Database → Webhooks) para disparar workflows automaticamente quando houver mudanças

3. Configure alertas e notificações (Discord, WhatsApp, Email)
