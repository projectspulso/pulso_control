# 🔐 Configurar OAuth - Facebook & Instagram

## 📋 Passo a Passo Completo

### **1️⃣ Criar App no Meta for Developers**

1. **Acesse:** https://developers.facebook.com/apps
2. **Clique:** "Create App" (Criar aplicativo)
3. **Escolha o tipo:** "Business" ou "Consumer"
4. **Preencha:**
   - **App Name:** `Pulso Control` (ou nome que preferir)
   - **App Contact Email:** seu-email@example.com
   - **Purpose:** Selecione "Myself or my own business"
5. **Clique:** "Create App"

---

### **2️⃣ Adicionar Produtos (Products)**

Após criar o app, você verá a dashboard. Adicione os produtos necessários:

#### **A) Instagram Basic Display**

1. No menu lateral, clique em **"+ Add Product"**
2. Procure **"Instagram Basic Display"**
3. Clique em **"Set Up"**

#### **B) Instagram Graph API** (para publicação)

1. No menu lateral, clique em **"+ Add Product"**
2. Procure **"Instagram"** (Instagram Graph API)
3. Clique em **"Set Up"**

#### **C) Facebook Login**

1. No menu lateral, clique em **"+ Add Product"**
2. Procure **"Facebook Login"**
3. Clique em **"Set Up"**

---

### **3️⃣ Configurar Instagram Basic Display**

1. No menu lateral, vá em: **Instagram Basic Display > Basic Display**
2. Clique em **"Create New App"**
3. Preencha:
   - **Display Name:** `Pulso Control`
4. **Valid OAuth Redirect URIs:** (IMPORTANTE!)
   ```
   http://localhost:3000/api/auth/instagram/callback
   https://seu-dominio.com/api/auth/instagram/callback
   ```
5. **Deauthorize Callback URL:**
   ```
   https://seu-dominio.com/api/auth/instagram/deauthorize
   ```
6. **Data Deletion Request URL:**
   ```
   https://seu-dominio.com/api/auth/instagram/data-deletion
   ```
7. Clique em **"Save Changes"**

---

### **4️⃣ Obter Credenciais**

#### **App ID e App Secret:**

1. No menu lateral, clique em **"Settings" > "Basic"**
2. Você verá:
   - **App ID:** `123456789012345` (copie este número)
   - **App Secret:** Clique em "Show" para visualizar (copie)

#### **Instagram App ID e Secret:**

1. Vá em: **Instagram Basic Display > Basic Display**
2. Role até a seção **"Instagram App ID"** e **"Instagram App Secret"**
3. Copie ambos

---

### **5️⃣ Configurar Permissões (Permissions)**

1. No menu lateral, vá em: **App Review > Permissions and Features**
2. Solicite as permissões necessárias:

**Para Instagram:**

- ✅ `instagram_basic` (Aprovado automaticamente em Development Mode)
- ✅ `instagram_content_publish` (Requer revisão da Meta)
- ✅ `pages_show_list` (Para listar páginas conectadas)
- ✅ `pages_read_engagement` (Para ler dados da página)

**Para Facebook:**

- ✅ `pages_manage_posts` (Publicar em páginas)
- ✅ `pages_read_engagement`

**⚠️ IMPORTANTE:** Algumas permissões exigem **App Review** da Meta. Em modo desenvolvimento, você pode testar com sua própria conta.

---

### **6️⃣ Adicionar Testadores (para Development Mode)**

1. Vá em: **Roles > Test Users**
2. Clique em **"Add Test Users"**
3. Ou vá em **Roles > Administrators** e adicione sua conta do Facebook

**Para Instagram:**

1. Vá em: **Instagram Basic Display > User Token Generator**
2. Clique em **"Add or Remove Instagram Testers"**
3. Você será redirecionado para o Instagram
4. Adicione o usuário Instagram que vai testar

---

### **7️⃣ Modo Desenvolvimento vs Produção**

**Development Mode (padrão):**

- ✅ Apenas você e testadores podem usar
- ✅ Não precisa de App Review para testar
- ⚠️ Limitado a contas de teste

**Production Mode:**

- Requer **App Review** da Meta
- Precisa enviar vídeo demonstrativo
- Preencher **Data Use Checkup**
- Adicionar **Privacy Policy URL**

---

### **8️⃣ Conectar Instagram Business Account**

Para usar Instagram Graph API (publicação), você precisa:

1. Ter uma **Página do Facebook**
2. Ter uma **Conta Instagram Business** conectada à página
3. **Como conectar:**
   - Vá na sua Página do Facebook
   - Settings > Instagram
   - Clique em "Connect Account"
   - Faça login no Instagram Business

---

### **9️⃣ Adicionar Credenciais no seu .env**

Após obter as credenciais, adicione no arquivo `.env`:

```bash
# FACEBOOK/INSTAGRAM
FACEBOOK_APP_ID=123456789012345
FACEBOOK_APP_SECRET=abc123def456ghi789jkl012mno345pq

INSTAGRAM_APP_ID=987654321098765
INSTAGRAM_APP_SECRET=xyz789abc456def123ghi890jkl567mno

# URLs de callback (ajustar para produção)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### **🔟 Testar OAuth Flow**

1. Acesse: `http://localhost:3000/settings`
2. Clique em **"Conectar Instagram"**
3. Você será redirecionado para fazer login no Facebook/Instagram
4. Autorize as permissões solicitadas
5. Será redirecionado de volta com o **Access Token**

---

## 📊 Resumo das Credenciais Necessárias

| Plataforma    | Credencial           | Onde encontrar                          |
| ------------- | -------------------- | --------------------------------------- |
| **Facebook**  | App ID               | Settings > Basic                        |
| **Facebook**  | App Secret           | Settings > Basic (clicar "Show")        |
| **Instagram** | Instagram App ID     | Instagram Basic Display > Basic Display |
| **Instagram** | Instagram App Secret | Instagram Basic Display > Basic Display |

---

## 🔗 Links Importantes

- **Meta for Developers:** https://developers.facebook.com/apps
- **Instagram Basic Display:** https://developers.facebook.com/docs/instagram-basic-display-api
- **Instagram Graph API:** https://developers.facebook.com/docs/instagram-api
- **Documentação OAuth:** https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow

---

## ⚠️ Problemas Comuns

### **"Invalid OAuth Redirect URI"**

- Certifique-se que a URL de callback está EXATAMENTE como configurada no app
- Não esqueça `http://` ou `https://`

### **"This app is in development mode"**

- É normal! Você pode testar com sua própria conta
- Para produção, precisa submeter para App Review

### **"Instagram account not connected"**

- Verifique se sua conta Instagram é Business/Creator
- Verifique se está conectada a uma Página do Facebook

### **"Insufficient permissions"**

- Algumas permissões exigem App Review
- Em desenvolvimento, você tem acesso limitado

---

## 🚀 Próximos Passos

Após configurar:

1. ✅ Adicionar credenciais no `.env`
2. ✅ Criar endpoints de callback OAuth
3. ✅ Testar conexão via interface `/settings`
4. ✅ Salvar tokens no banco (tabela `plataforma_credenciais`)

---

**Dúvidas?** Me avise em qual passo você está!
