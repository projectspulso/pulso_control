# Workflow 2: Roteiro → Produção (TTS + Vídeo + Assets)

## 🎯 Objetivo

Transformar roteiros aprovados em conteúdo pronto para publicação com áudio, vídeo e thumbnails.

## 🔄 Fluxo do Workflow

```
[Webhook/Schedule Trigger]
    ↓
[Supabase: Buscar Roteiros APROVADOS]
    ↓
[Loop em cada roteiro]
    ↓
[Criar Conteúdo Base]
    ↓
[Gerar Áudio (TTS)]
    ↓
[Upload Áudio → Supabase Storage]
    ↓
[Criar Asset de Áudio]
    ↓
[Gerar Variantes (Shorts/Reels/TikTok)]
    ↓
[Vincular Assets às Variantes]
    ↓
[Notificação: Conteúdo pronto]
```

## 📋 Nodes do Workflow

### 1. **Trigger**

- **Tipo**: Webhook ou Schedule
- **Webhook**: `POST /webhook/producao-conteudo`
- **Ou Schedule**: `0 9,15 * * *` (9h e 15h diariamente)

### 2. **Buscar Roteiros Aprovados**

- **Tipo**: HTTP Request
- **URL**: `{{ $env.SUPABASE_URL }}/rest/v1/vw_pulso_roteiros?status=eq.APROVADO&limit=3`
- **Headers**:

```
apikey: {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
```

### 3. **Loop: Para cada roteiro**

- **Tipo**: Loop Over Items

### 4. **Criar Conteúdo Base**

- **Tipo**: HTTP Request
- **Método**: POST
- **URL**: `{{ $env.SUPABASE_URL }}/rest/v1/conteudos`
- **Body**:

```json
{
  "canal_id": "={{ $json.canal_id }}",
  "serie_id": "={{ $json.serie_id }}",
  "roteiro_id": "={{ $json.id }}",
  "titulo_interno": "={{ $json.roteiro_titulo }}",
  "sinopse": "={{ $json.conteudo_md.substring(0, 200) }}...",
  "status": "EM_PRODUCAO",
  "linguagem": "={{ $json.linguagem }}",
  "metadata": {
    "workflow": "n8n_workflow_2",
    "inicio_producao": "={{ new Date().toISOString() }}"
  }
}
```

### 5. **Preparar Texto para TTS**

- **Tipo**: Code

```javascript
const roteiro = $input.item.json;

// Extrair apenas o texto de narração (remover instruções de B-roll, etc)
let textoNarracao = roteiro.conteudo_md;

// Limpar markdown
textoNarracao = textoNarracao
  .replace(/#+\s/g, "") // Remove headers
  .replace(/\*\*/g, "") // Remove bold
  .replace(/\*/g, "") // Remove italic
  .replace(/\[.*?\]\(.*?\)/g, "") // Remove links
  .replace(/^-\s/gm, "") // Remove bullets
  .trim();

return {
  json: {
    conteudo_id: $("Criar Conteúdo Base").item.json.id,
    roteiro_id: roteiro.id,
    texto_narracao: textoNarracao,
    titulo: roteiro.roteiro_titulo,
    linguagem: roteiro.linguagem || "pt-BR",
  },
};
```

### 6. **Gerar Áudio com TTS**

#### Opção A: ElevenLabs (Qualidade Premium)

- **Tipo**: HTTP Request
- **URL**: `https://api.elevenlabs.io/v1/text-to-speech/{{ $env.ELEVENLABS_VOICE_ID }}`
- **Headers**:

```
xi-api-key: {{ $env.ELEVENLABS_API_KEY }}
Content-Type: application/json
```

- **Body**:

```json
{
  "text": "={{ $json.texto_narracao }}",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.75
  }
}
```

- **Response Format**: Binary Data

#### Opção B: Google TTS (Gratuito/Mais barato)

- **Tipo**: HTTP Request
- **URL**: `https://texttospeech.googleapis.com/v1/text:synthesize`
- **Headers**:

```
Authorization: Bearer {{ $env.GOOGLE_TTS_API_KEY }}
Content-Type: application/json
```

- **Body**:

```json
{
  "input": {
    "text": "={{ $json.texto_narracao }}"
  },
  "voice": {
    "languageCode": "pt-BR",
    "name": "pt-BR-Wavenet-A",
    "ssmlGender": "MALE"
  },
  "audioConfig": {
    "audioEncoding": "MP3",
    "pitch": 0,
    "speakingRate": 1.1
  }
}
```

### 7. **Upload Áudio para Supabase Storage**

- **Tipo**: HTTP Request
- **Método**: POST
- **URL**: `{{ $env.SUPABASE_URL }}/storage/v1/object/pulso-assets/audio/{{ $json.conteudo_id }}_{{ Date.now() }}.mp3`
- **Headers**:

```
apikey: {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
Content-Type: audio/mpeg
```

- **Body**: Binary data from TTS
- **Return**: Salvar path do arquivo

### 8. **Criar Asset de Áudio**

- **Tipo**: HTTP Request
- **Método**: POST
- **URL**: `{{ $env.SUPABASE_URL }}/rest/v1/assets`
- **Body**:

```json
{
  "tipo": "AUDIO",
  "nome": "Áudio - {{ $('Preparar Texto para TTS').item.json.titulo }}",
  "caminho_storage": "={{ $json.path }}",
  "provedor": "SUPABASE",
  "duracao_segundos": "={{ $('Preparar Texto para TTS').item.json.duracao_estimado }}",
  "metadata": {
    "tts_provider": "elevenlabs",
    "voice_id": "{{ $env.ELEVENLABS_VOICE_ID }}",
    "gerado_em": "={{ new Date().toISOString() }}"
  }
}
```

### 9. **Gerar Variantes do Conteúdo**

- **Tipo**: Code

```javascript
const conteudo_id = $("Criar Conteúdo Base").item.json.id;
const titulo = $("Preparar Texto para TTS").item.json.titulo;

// Criar variantes para diferentes plataformas
const variantes = [
  {
    conteudo_id: conteudo_id,
    nome_variacao: "YouTube Shorts - Versão A",
    plataforma_tipo: "YOUTUBE_SHORTS",
    status: "PRONTO_PARA_PRODUCAO",
    titulo_publico: titulo,
    linguagem: "pt-BR",
    ordem_exibicao: 1,
  },
  {
    conteudo_id: conteudo_id,
    nome_variacao: "TikTok - Versão A",
    plataforma_tipo: "TIKTOK",
    status: "PRONTO_PARA_PRODUCAO",
    titulo_publico: titulo,
    linguagem: "pt-BR",
    ordem_exibicao: 2,
  },
  {
    conteudo_id: conteudo_id,
    nome_variacao: "Instagram Reels - Versão A",
    plataforma_tipo: "INSTAGRAM_REELS",
    status: "PRONTO_PARA_PRODUCAO",
    titulo_publico: titulo,
    linguagem: "pt-BR",
    ordem_exibicao: 3,
  },
];

return variantes.map((v) => ({ json: v }));
```

### 10. **Inserir Variantes (Loop)**

- **Tipo**: HTTP Request
- **Método**: POST
- **URL**: `{{ $env.SUPABASE_URL }}/rest/v1/conteudo_variantes`
- **Body**: `={{ $json }}`

### 11. **Vincular Áudio às Variantes**

- **Tipo**: Code

```javascript
const asset_audio_id = $("Criar Asset de Áudio").item.json.id;
const variantes = $("Inserir Variantes (Loop)").all();

// Criar vínculos para todas as variantes
const vinculos = variantes.map((v) => ({
  json: {
    conteudo_variantes_id: v.json.id,
    asset_id: asset_audio_id,
    papel: "AUDIO_TTS",
    ordem: 1,
  },
}));

return vinculos;
```

### 12. **Inserir Vínculos**

- **Tipo**: HTTP Request
- **Método**: POST
- **URL**: `{{ $env.SUPABASE_URL }}/rest/v1/conteudo_variantes_assets`
- **Body**: `={{ $json }}`

### 13. **Atualizar Status do Conteúdo**

- **Tipo**: HTTP Request
- **Método**: PATCH
- **URL**: `{{ $env.SUPABASE_URL }}/rest/v1/conteudos?id=eq.={{ $('Criar Conteúdo Base').item.json.id }}`
- **Body**:

```json
{
  "status": "PRONTO_PARA_PRODUCAO",
  "metadata": {
    "audio_gerado_em": "={{ new Date().toISOString() }}",
    "variantes_criadas": 3
  }
}
```

### 14. **Notificação**

- **Tipo**: Discord/Email

```
🎬 Conteúdo pronto para edição de vídeo!

📝 Título: {{ $('Preparar Texto para TTS').item.json.titulo }}
🎙️ Áudio: Gerado com sucesso
📊 Variantes: 3 (YouTube, TikTok, Instagram)
🔗 Ver no Supabase
```

## 🎥 Próxima Etapa (Manual ou Automática)

Depois do áudio gerado, você pode:

1. **Manual**: Editar vídeo em editor (CapCut, Premiere, etc.)
2. **Semi-automático**: Usar ferramentas como:
   - **Pictory.ai** - Gera vídeo de texto
   - **Invideo AI** - Cria vídeos automaticamente
   - **D-ID** - Avatar falando
3. **Totalmente automático**: Integrar com API de geração de vídeo

## 🔐 Variáveis de Ambiente

```
ELEVENLABS_API_KEY=sua_key
ELEVENLABS_VOICE_ID=id_da_voz
# OU
GOOGLE_TTS_API_KEY=sua_key
```

## 🧪 Teste

1. Aprovar um roteiro:

```sql
UPDATE pulso_content.roteiros
SET status = 'APROVADO'
WHERE id = 'seu_roteiro_id';
```

2. Executar workflow

3. Verificar:

```sql
SELECT * FROM public.vw_pulso_conteudos WHERE status = 'PRONTO_PARA_PRODUCAO';
SELECT * FROM public.vw_pulso_conteudo_variantes_assets;
```

## 💰 Custos Estimados

- **ElevenLabs**: ~$0.15-0.30 por áudio (30-60s)
- **Google TTS**: Gratuito até 1M caracteres/mês
- **Supabase Storage**: Gratuito até 1GB

## 🎨 Melhorias Futuras

1. Integração com gerador de vídeo automático
2. Geração de thumbnails com IA
3. Legendas automáticas (Whisper API)
4. Múltiplas vozes para diálogos
5. Efeitos sonoros e música de fundo
