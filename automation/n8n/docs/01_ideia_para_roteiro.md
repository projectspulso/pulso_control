# Workflow 1: Ideia → Roteiro

## 🎯 Objetivo

Automatizar a geração de roteiros completos a partir de ideias brutas usando IA.

## 🔄 Fluxo do Workflow

```
[Schedule/Manual Trigger]
    ↓
[Supabase: Buscar Ideias RASCUNHO]
    ↓
[Loop em cada ideia]
    ↓
[OpenAI/Claude: Gerar roteiro]
    ↓
[Supabase: Inserir roteiro]
    ↓
[Supabase: Atualizar status da ideia]
    ↓
[Notificação: Roteiro criado]
```

## 📋 Nodes do Workflow

### 1. **Schedule Trigger** (ou Manual Trigger)

- **Tipo**: Schedule Trigger
- **Configuração**:
  - Mode: `Every Hour` ou `Cron` (ex: `0 */3 * * *` - a cada 3h)
  - Ou use **Manual Trigger** para testes

### 2. **Buscar Ideias Pendentes**

- **Tipo**: Supabase
- **Operação**: Select Rows
- **Configuração**:

```json
{
  "table": "vw_pulso_ideias",
  "select": "*",
  "filters": {
    "status": {
      "in": ["RASCUNHO", "EM_DESENVOLVIMENTO"]
    }
  },
  "limit": 5
}
```

### 3. **Loop: Para cada ideia**

- **Tipo**: Loop Over Items
- **Configuração**: Processar items um por um

### 4. **Preparar Prompt**

- **Tipo**: Code (JavaScript)
- **Código**:

```javascript
const ideia = $input.item.json;

const prompt = `Você é um roteirista especializado em conteúdo dark e viral para redes sociais.

# IDEIA
Título: ${ideia.titulo}
Descrição: ${ideia.descricao}
Canal: ${ideia.canal_nome}
Série: ${ideia.serie_nome || "Geral"}
Tags: ${ideia.tags?.join(", ") || "N/A"}

# TAREFA
Crie um roteiro completo para um vídeo curto (30-60 segundos) seguindo esta estrutura:

## HOOK (3 segundos)
- Frase de impacto inicial

## DESENVOLVIMENTO (40 segundos)
- 3-4 pontos principais
- Cada ponto com fatos concretos
- Linguagem acessível mas intrigante

## CONCLUSÃO (7 segundos)
- Call-to-action
- Frase de efeito final

## EXTRAS
- Sugestões de B-roll
- Tom de voz
- Música sugerida

Formato: Markdown, direto ao ponto, sem enrolação.`;

return {
  json: {
    ideia_id: ideia.id,
    ideia_titulo: ideia.titulo,
    canal_id: ideia.canal_id,
    serie_id: ideia.serie_id,
    prompt: prompt,
    linguagem: ideia.linguagem || "pt-BR",
  },
};
```

### 5. **Gerar Roteiro com IA**

- **Tipo**: OpenAI (ou HTTP Request para Anthropic)

#### Opção A: OpenAI

```json
{
  "model": "gpt-4-turbo-preview",
  "messages": [
    {
      "role": "system",
      "content": "Você é um roteirista expert em conteúdo viral para redes sociais."
    },
    {
      "role": "user",
      "content": "={{ $json.prompt }}"
    }
  ],
  "temperature": 0.8,
  "max_tokens": 1500
}
```

#### Opção B: Anthropic Claude (via HTTP)

- **URL**: `https://api.anthropic.com/v1/messages`
- **Headers**:
  ```
  x-api-key: sua_api_key
  anthropic-version: 2023-06-01
  content-type: application/json
  ```
- **Body**:

```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 2000,
  "messages": [
    {
      "role": "user",
      "content": "={{ $json.prompt }}"
    }
  ]
}
```

### 6. **Processar Resposta da IA**

- **Tipo**: Code (JavaScript)

```javascript
const roteiro_texto =
  $input.item.json.choices?.[0]?.message?.content ||
  $input.item.json.content?.[0]?.text;

const ideia = $("Preparar Prompt").item.json;

// Estimar duração (aprox. 150 palavras/minuto para leitura)
const palavras = roteiro_texto.split(/\s+/).length;
const duracao_estimada = Math.ceil((palavras / 150) * 60);

return {
  json: {
    ideia_id: ideia.ideia_id,
    titulo: `Roteiro - ${ideia.ideia_titulo}`,
    versao: 1,
    conteudo_md: roteiro_texto,
    duracao_estimado_segundos: duracao_estimada,
    status: "RASCUNHO",
    linguagem: ideia.linguagem,
    metadata: {
      gerado_por: "n8n_workflow_1",
      modelo_ia: "gpt-4-turbo",
      data_geracao: new Date().toISOString(),
      prompt_usado: ideia.prompt,
    },
  },
};
```

### 7. **Inserir Roteiro no Supabase**

- **Tipo**: HTTP Request
- **Método**: POST
- **URL**: `https://nlcisbfdiokmipyihtuz.supabase.co/rest/v1/roteiros`
- **Headers**:

```
apikey: {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
Content-Type: application/json
Prefer: return=representation
```

- **Body**:

```json
{
  "ideia_id": "={{ $json.ideia_id }}",
  "titulo": "={{ $json.titulo }}",
  "versao": 1,
  "conteudo_md": "={{ $json.conteudo_md }}",
  "duracao_estimado_segundos": "={{ $json.duracao_estimado_segundos }}",
  "status": "RASCUNHO",
  "linguagem": "={{ $json.linguagem }}",
  "metadata": "={{ JSON.stringify($json.metadata) }}"
}
```

### 8. **Atualizar Status da Ideia**

- **Tipo**: HTTP Request
- **Método**: PATCH
- **URL**: `https://nlcisbfdiokmipyihtuz.supabase.co/rest/v1/ideias?id=eq.={{ $('Preparar Prompt').item.json.ideia_id }}`
- **Headers**: (mesmos do passo anterior)
- **Body**:

```json
{
  "status": "EM_DESENVOLVIMENTO",
  "metadata": {
    "ultimo_roteiro_gerado": "={{ new Date().toISOString() }}"
  }
}
```

### 9. **Notificação (Opcional)**

- **Tipo**: Discord ou Email
- **Mensagem**:

```
✅ Novo roteiro gerado!

📝 Ideia: {{ $('Preparar Prompt').item.json.ideia_titulo }}
⏱️ Duração estimada: {{ $('Processar Resposta da IA').item.json.duracao_estimado_segundos }}s
🔗 Ver no Supabase
```

## 🔐 Variáveis de Ambiente Necessárias

Adicione no n8n (Settings → Variables):

```
SUPABASE_URL=https://nlcisbfdiokmipyihtuz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_key_aqui
OPENAI_API_KEY=sua_key_aqui
```

## 🧪 Teste Manual

1. Crie uma ideia de teste no Supabase:

```sql
INSERT INTO pulso_content.ideias (canal_id, titulo, descricao, origem, status, linguagem)
VALUES (
  (SELECT id FROM pulso_core.canais WHERE slug = 'pulso-dark-pt'),
  'O Mistério do Triângulo das Bermudas',
  'Casos inexplicáveis de desaparecimentos no Triângulo das Bermudas e teorias científicas atuais',
  'MANUAL',
  'RASCUNHO',
  'pt-BR'
);
```

2. Execute o workflow manualmente no n8n

3. Verifique os roteiros gerados:

```sql
SELECT * FROM public.vw_pulso_roteiros ORDER BY created_at DESC LIMIT 5;
```

## 📊 Monitoramento

- **Execuções com erro**: Revisar ideias que falharam
- **Qualidade dos roteiros**: Avaliar manualmente primeiros 10 roteiros
- **Tempo médio**: Deve ficar entre 10-30 segundos por roteiro
- **Custo**: Monitorar uso da API (OpenAI ~$0.01-0.03 por roteiro)

## 🎨 Melhorias Futuras

1. **Variações A/B**: Gerar 2-3 versões do roteiro
2. **Template por série**: Prompts customizados por tipo de conteúdo
3. **Revisão humana**: Flag para roteiros que precisam revisão
4. **Feedback loop**: Usar métricas para melhorar prompts
5. **Multi-idioma**: Suporte para EN, ES, etc.

## 📝 Notas

- Revise os primeiros roteiros manualmente
- Ajuste o prompt conforme necessário
- Considere limitar execução (ex: max 10 roteiros/dia no início)
- Monitore custos da API de IA
