0. Preparos rápidos (somente uma vez)
   0.1. Credencial Supabase (DB)

No n8n:

Menu esquerdo → Credentials

New

Tipo: Supabase

Preencher:

Name: Supabase – Pulso

URL: https://SEU_PROJECT_REF.supabase.co

API Key: service_role do Supabase (só aqui)

Save.

0.2. Credencial ElevenLabs

Ainda em Credentials:

New

Tipo: Header Auth

Preencher:

Name: ElevenLabs – Pulso

Header Name: xi-api-key

Header Value: sk\_.... (sua key ElevenLabs)

Save.

0.3. Credencial Supabase Storage (HTTP)

Vamos precisar de uma credencial HTTP que mande o header de autorização pro Storage:

New

Tipo: Header Auth

Preencher:

Name: Supabase Storage – Pulso

Header Name: Authorization

Header Value: Bearer SEU_SERVICE_ROLE_KEY

Save.

SEU_SERVICE_ROLE_KEY = mesma key do passo 0.1.

0.4. Bucket no Supabase Storage

No Supabase Studio:

Crie (ou confirme) um bucket audios

Marque como Public.

A URL base vai ser:

https://SEU_PROJECT_REF.supabase.co/storage/v1/object/public/audios

1. Criar o Workflow PULSO – Gerar Áudio

No n8n:

Workflows → New

Nome: PULSO – Gerar Áudio

(Opcional) Tags: PULSO, AUDIO, PRODUCAO

Vamos montar os nodes na seguinte ordem:

Webhook (entrada do app)

Function: validar payload

Supabase: buscar roteiro

Function: preparar texto

Function: definir nome de arquivo

HTTP: ElevenLabs TTS

HTTP: upload pro Supabase Storage

Function: montar registro do áudio

Supabase: salvar em assets.audios

Respond to Webhook

Vou numerar como “Node 1, 2, 3…” só pra organizar.

🧩 Node 1 – Webhook gerar-audio

Adicione um node Webhook.

Configure:

Name: Webhook Gerar Áudio

HTTP Method: POST

Path: gerar-audio
→ URL ficará: https://.../webhook/gerar-audio

Response Mode: When last node finishes

Aba Options:

Response Content Type: application/json

👉 Se você quer proteger com API key (recomendo):

Aba Authentication:

Authentication: Header Auth

Header Name: x-api-key

Header Value: SUA_CHAVE_APP
(depois o app envia esse header nas requisições)

Payload esperado do app:

{
"roteiro_id": "uuid",
"voz_id": "string (opcional)"
}

🧩 Node 2 – Function Validar Payload

Adicione um node Function.

Conecte Webhook → Function.

Configura:

Name: Validar Payload

Aba Function → código:

const body = $json;

if (!body.roteiro_id) {
throw new Error('roteiro_id é obrigatório');
}

return [
{
roteiro_id: body.roteiro_id,
voz_id: body.voz_id || 'YOUR_DEFAULT_VOICE_ID'
}
];

Troque "YOUR_DEFAULT_VOICE_ID" pelo ID de voz padrão do ElevenLabs, se quiser.

🧩 Node 3 – Supabase Buscar Roteiro

Adicione um node Supabase.

Conecte Validar Payload → Buscar Roteiro.

Configura:

Name: Buscar Roteiro

Credentials: Supabase – Pulso

Operation: Select

Schema: content

Table: roteiros

Columns: \*

Filters:

Add Condition:

Column: id

Operator: equals

Value (expression): ={{ $json.roteiro_id }}

Limit: 1

🧩 Node 4 – Function Preparar Texto para TTS

Adicione um Function.

Conecte Buscar Roteiro → Preparar Texto.

Configura:

Name: Preparar Texto para TTS

Código:

// Linhas retornadas pelo Supabase
const rows = $items(0).map(item => item.json);

if (!rows.length) {
throw new Error('Roteiro não encontrado no Supabase');
}

const roteiro = rows[0];

// Pegar voz_id original do Webhook, se tiver
const webhookItem = $items('Webhook Gerar Áudio', 0);
const voz_id = (webhookItem && webhookItem.json.voz_id) || 'YOUR_DEFAULT_VOICE_ID';

// Ajuste o campo do texto conforme sua tabela
const texto = roteiro.conteudo_markdown || roteiro.conteudo || roteiro.titulo;

return [
{
roteiro_id: roteiro.id,
texto,
voz_id
}
];

Aqui estamos buscando voz_id diretamente do node Webhook Gerar Áudio pelo nome dele.

🧩 Node 5 – Function Definir Nome do Arquivo

Esse node define um fileName que será usado tanto no upload quanto na URL salva.

Adicione um node Function.

Conecte Preparar Texto → Definir Nome do Arquivo.

Configura:

Name: Definir Nome do Arquivo

Código:

const roteiroId = $json.roteiro_id;
const timestamp = Date.now();
const fileName = `${roteiroId}-${timestamp}.mp3`;

return [
{
...$json,
fileName
}
];

Saída agora tem:

roteiro_id

texto

voz_id

fileName

🧩 Node 6 – HTTP Request ElevenLabs TTS

Adicione um node HTTP Request.

Conecte Definir Nome do Arquivo → ElevenLabs TTS.

Configura:

Name: ElevenLabs TTS

Method: POST

URL: (clique no botão de expressão =)

Expressão:

={{ 'https://api.elevenlabs.io/v1/text-to-speech/' + $json.voz_id }}

Aba Authentication:

Authentication: Header Auth

Credentials: ElevenLabs – Pulso

Aba Headers:

Add:

Name: Content-Type

Value: application/json

Aba Body:

Send Body as: JSON

JSON:

{
"text": "{{$json.texto}}",
"model_id": "eleven_monolingual_v1",
"voice_settings": {
"stability": 0.5,
"similarity_boost": 0.8
}
}

Aba Response:

Response Format: File
(isso faz o binário vir em binary.data por padrão)

Importante: esse node não altera o JSON; ele só adiciona o binário. Então roteiro_id, fileName, etc., continuam disponíveis em $json.

🧩 Node 7 – HTTP Request Upload Supabase Storage (audios)

Adicione outro node HTTP Request.

Conecte ElevenLabs TTS → Upload Supabase.

Configura:

Name: Upload Supabase (audios)

Method: POST

URL: (expressão)

={{ 'https://SEU_PROJECT_REF.supabase.co/storage/v1/object/audios/' + $json.fileName }}

Troque SEU_PROJECT_REF pelo prefixo do seu projeto Supabase
(o que aparece em https://SEU_PROJECT_REF.supabase.co).

Authentication:

Authentication: Header Auth

Credentials: Supabase Storage – Pulso

Headers:

Name: Content-Type

Value: audio/mpeg

Body:

Send Binary Data: marcado (true)

Binary Property: data
(que é onde o ElevenLabs TTS colocou o binário)

Esse node faz o upload do áudio gerado para o bucket audios.

🧩 Node 8 – Function Montar Registro Áudio

Agora vamos construir o objeto final pra inserir em assets.audios.

Adicione um node Function.

Conecte Upload Supabase → Montar Registro Áudio.

Configura:

Name: Montar Registro Áudio

Código:

const { roteiro_id, fileName, voz_id } = $json;

// URL pública do Supabase Storage
const baseUrl = 'https://SEU_PROJECT_REF.supabase.co/storage/v1/object/public/audios';
const url = `${baseUrl}/${fileName}`;

return [
{
roteiro_id,
url,
duracao_segundos: null, // se você quiser preencher depois
formato: 'audio/mpeg',
tamanho_bytes: null, // pode popular depois via metadata
voz_id,
metadata: {}
}
];

Troque SEU_PROJECT_REF pelo seu.

🧩 Node 9 – Supabase Salvar em assets.audios

Adicione um node Supabase.

Conecte Montar Registro Áudio → Salvar em assets.audios.

Configura:

Name: Salvar em assets.audios

Credentials: Supabase – Pulso

Operation: Insert

Schema: assets

Table: audios

Aba Columns / Values:

Modo simples: use campos individuais:

roteiro_id ← ={{ $json.roteiro_id }}

url ← ={{ $json.url }}

duracao_segundos ← ={{ $json.duracao_segundos }}

formato ← ={{ $json.formato }}

tamanho_bytes ← ={{ $json.tamanho_bytes }}

voz_id ← ={{ $json.voz_id }}

metadata ← ={{ $json.metadata }}

Marque a opção de Return data / Return fields: \*
(pra receber o id do áudio criado)

🧩 Node 10 – Respond to Webhook

Adicione um node Respond to Webhook.

Conecte Salvar em assets.audios → Respond to Webhook.

Configura:

Name: Responder Webhook

Response Code: 200

Response Body (expression):

={{
  {
    audio_id: $json.id,
    url: $json.url,
    duracao_segundos: $json.duracao_segundos,
    status: 'SUCESSO'
  }
}}

2. Ordem final dos nodes (pra você conferir no canvas)

Fluxo principal, da esquerda pra direita:

Webhook Gerar Áudio

Validar Payload

Buscar Roteiro

Preparar Texto para TTS

Definir Nome do Arquivo

ElevenLabs TTS

Upload Supabase (audios)

Montar Registro Áudio

Salvar em assets.audios

Responder Webhook

Depois de montar:

Ative o workflow (toggle ON).

Teste com um curl ou pelo seu app.
