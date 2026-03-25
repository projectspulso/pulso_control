# ⚙️ Configurar Variáveis de Ambiente no Vercel

## 🚨 PROBLEMA ATUAL

O app está usando `placeholder.supabase.co` porque as variáveis de ambiente não estão configuradas no Vercel.

## ✅ SOLUÇÃO - Configurar no Vercel Dashboard

### 1. Acessar Vercel Dashboard

1. Vá em: https://vercel.com/projectspulso/pulso-control
2. Clique em **Settings** (no topo)
3. Clique em **Environment Variables** (menu lateral)

### 2. Adicionar as Variáveis (uma por uma)

#### Supabase

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://nlcisbfdiokmipyihtuz.supabase.co
Environment: Production, Preview, Development
```

```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sY2lzYmZkaW9rbWlweWlodHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODk0OTksImV4cCI6MjA3OTE2NTQ5OX0.-Cfzv9ebOYB8I93zNLghWTszawJk4G3rXwiTTY9PpOI
Environment: Production, Preview, Development
```

#### n8n

```
Name: N8N_URL
Value: https://pulsoprojects.app.n8n.cloud
Environment: Production, Preview, Development
```

```
Name: N8N_API_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZmYzNmJhMy1lMzM1LTRlYWItYmEyNi03NGVkM2YwOTIyN2IiLCJpc3MiOiJuOG4iLCJhdWQiOiJtY3Atc2VydmVyLWFwaSIsImp0aSI6IjAzMmUzNDc4LWIwMjItNDExZi1iNDEzLTQwMzZhMmEzMjk5NSIsImlhdCI6MTc2MzU5Mzk2N30.dOps3JjCuOeWUbqygaIb1LkUwBXNCKc9-KMcJeJilaU
Environment: Production, Preview, Development
```

### 3. Depois de adicionar todas

1. Clique em **Save**
2. Vá em **Deployments** (topo)
3. No último deployment, clique nos 3 pontinhos `...`
4. Clique em **Redeploy**
5. Marque **Use existing Build Cache** (NÃO)
6. Clique em **Redeploy**

### 4. Aguardar Deploy

- O Vercel vai fazer rebuild com as novas variáveis
- Aguarde ~2-3 minutos
- Teste em: https://pulso-control.vercel.app

---

## 🔍 Verificar se funcionou

Após o redeploy, abra o console do navegador e execute:

```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
```

Deve retornar: `https://nlcisbfdiokmipyihtuz.supabase.co`

Se retornar `https://placeholder.supabase.co`, as variáveis não foram aplicadas.

---

## 📝 Variáveis Necessárias (Checklist)

- [x] NEXT_PUBLIC_SUPABASE_URL
- [x] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [x] N8N_URL
- [x] N8N_API_KEY
- [ ] YOUTUBE_API_KEY (Sprint 4)
- [ ] TIKTOK_API_KEY (Sprint 4)
- [ ] INSTAGRAM_API_KEY (Sprint 4)
- [ ] KWAI_API_KEY (Sprint 4)

---

## ⚡ Atalho Via CLI (Alternativa)

Se tiver Vercel CLI instalado:

```bash
# Instalar CLI
npm i -g vercel

# Login
vercel login

# Link do projeto
vercel link

# Adicionar variáveis
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Cole o valor: https://nlcisbfdiokmipyihtuz.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Cole o valor: eyJ...PpOI

vercel env add N8N_URL
# Cole o valor: https://pulsoprojects.app.n8n.cloud

vercel env add N8N_API_KEY
# Cole o valor: eyJ...laU

# Redeploy
vercel --prod
```

---

**⚠️ IMPORTANTE:** Nunca commite `.env.local` ou `.env` no Git! Apenas `.env.example` (sem valores reais).
