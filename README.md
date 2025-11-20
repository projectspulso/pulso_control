# PULSO – Ecossistema de Canais Dark

Sistema completo de automação para criação, produção, distribuição e análise de conteúdo para múltiplas plataformas.

## 🚀 Status do Projeto

✅ Estrutura completa criada  
✅ Banco de dados Supabase configurado  
✅ n8n Cloud conectado  
✅ Documentação dos workflows pronta  
⏳ Workflows em implementação

## 📊 Stack Tecnológica

- **Backend/Database**: Supabase (PostgreSQL)
- **Automação**: n8n Cloud
- **IA**: OpenAI/Anthropic Claude
- **TTS**: ElevenLabs / Google TTS
- **Storage**: Supabase Storage
- **Plataformas**: YouTube, TikTok, Instagram, Kwai

## 📁 Estrutura do Projeto

- `apps/dashboard`: frontend (painel interno)
- `apps/api`: backend interno / APIs auxiliares
- `automation/n8n`: workflows do n8n + documentação completa
- `database/sql`: schemas, migrations e seeds do Supabase
- `content`: ideias, roteiros, assets de mídia
- `analytics`: scripts ETL e dashboards
- `docs`: documentação geral do ecossistema

## 🔄 Fluxo de Automação

**IDEIA** → **ROTEIRO (IA)** → **PRODUÇÃO (TTS/Vídeo)** → **PUBLICAÇÃO** → **MÉTRICAS** → **ANÁLISE**

## 🛠️ Setup Inicial

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Editar .env com suas credenciais
```

### 3. Popular banco de dados

Execute o SQL em `database/sql/seeds/001_initial_data.sql` no Supabase SQL Editor

### 4. Testar conexão

```bash
npm run db:test
```

## 📚 Workflows Disponíveis

1. **Ideia → Roteiro**: Geração automática com IA
2. **Roteiro → Produção**: TTS + criação de assets
3. **Variante → Publicação**: Upload nas plataformas
4. **Coleta de Métricas**: Análise de performance
5. **Relatórios e Alertas**: Insights inteligentes

📖 **Documentação completa**: `automation/n8n/docs/`

## 🔐 Variáveis de Ambiente

```env
SUPABASE_URL=https://nlcisbfdiokmipyihtuz.supabase.co
SUPABASE_ANON_KEY=<sua_key>
SUPABASE_SERVICE_ROLE_KEY=<sua_key>
N8N_URL=https://pulsoprojects.app.n8n.cloud
N8N_API_KEY=<sua_key>
OPENAI_API_KEY=<sua_key>
ELEVENLABS_API_KEY=<sua_key>
```

## 🧪 Scripts

```bash
npm run db:seed    # Popular banco com dados iniciais
npm run db:test    # Testar conexão com Supabase
```

## 🎯 Roadmap

- [x] Estrutura de pastas e organização
- [x] Banco de dados (6 schemas + 11 views públicas)
- [x] Documentação completa dos workflows
- [x] Dados iniciais (plataformas, canal, séries, tags)
- [ ] Implementar Workflow 1 (Ideia → Roteiro)
- [ ] Implementar Workflow 2 (TTS + Assets)
- [ ] Implementar Workflow 4 (Coleta de Métricas)
- [ ] Dashboard frontend
- [ ] Testes automatizados

---

**Desenvolvido com ❤️ para automatizar a criação de conteúdo viral**
