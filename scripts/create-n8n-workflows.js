/**
 * Script para criar workflows no n8n via API
 * 
 * Uso: node scripts/create-n8n-workflows.js
 * 
 * Requisitos:
 * - N8N_URL e N8N_API_KEY configurados no .env
 */

require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: '.env.local', override: true })

// Usar n8n local se disponível, senão usar Cloud
const N8N_URL = process.env.N8N_LOCAL_URL || process.env.N8N_URL || 'http://localhost:5678'
const N8N_API_KEY = process.env.N8N_API_KEY

if (!N8N_URL || !N8N_API_KEY) {
  console.error('❌ Erro: N8N_URL e N8N_API_KEY devem estar configurados no .env')
  process.exit(1)
}

console.log('🚀 Iniciando criação de workflows no n8n...')
console.log(`📍 URL: ${N8N_URL}`)
console.log(`🔑 API Key: ${N8N_API_KEY.substring(0, 20)}...`)
console.log('')

// Função helper para chamar API do n8n
async function n8nAPI(endpoint, method = 'GET', body = null) {
  // API do n8n (funciona em self-hosted)
  const url = `${N8N_URL}/api/v1${endpoint}`
  
  const options = {
    method,
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(url, options)
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`n8n API Error (${response.status}): ${error}`)
  }

  return response.json()
}

// ============================================
// WORKFLOW 1: Gerar Roteiro (já existe, apenas verificar)
// ============================================
const workflowGerarRoteiro = {
  name: "PULSO - Gerar Roteiro",
  nodes: [
    {
      parameters: {
        httpMethod: "POST",
        path: "gerar-roteiro",
        responseMode: "lastNode",
        options: {}
      },
      id: "webhook-gerar-roteiro",
      name: "Webhook Gerar Roteiro",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [250, 300]
    },
    {
      parameters: {
        jsCode: `// Extrair e validar dados do webhook
const payload = $input.item.json.body;

if (!payload.ideia_id) {
  throw new Error('ideia_id é obrigatório');
}

return {
  ideia_id: payload.ideia_id,
  titulo: payload.titulo || '',
  descricao: payload.descricao || '',
  canal_id: payload.canal_id,
  linguagem: payload.linguagem || 'pt-BR'
};`
      },
      id: "validar-payload",
      name: "Validar Payload",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [450, 300]
    },
    {
      parameters: {
        operation: "executeQuery",
        query: "SELECT i.*, c.nome as canal_nome, s.nome as serie_nome\\nFROM pulso_content.ideias i\\nLEFT JOIN pulso_core.canais c ON i.canal_id = c.id\\nLEFT JOIN pulso_core.series s ON i.serie_id = s.id\\nWHERE i.id = '{{ $json.ideia_id }}'",
        options: {}
      },
      id: "buscar-ideia",
      name: "Buscar Ideia Supabase",
      type: "n8n-nodes-base.postgres",
      typeVersion: 2.4,
      position: [650, 300],
      credentials: {
        postgres: {
          id: "supabase-db",
          name: "Supabase PostgreSQL"
        }
      }
    },
    {
      parameters: {
        jsCode: `// Montar prompt para IA gerar roteiro
const ideia = $input.item.json;

const prompt = \`Você é um roteirista especializado em conteúdo viral para redes sociais.

TAREFA: Criar um roteiro envolvente para o seguinte conteúdo:

TÍTULO: \${ideia.titulo}
DESCRIÇÃO: \${ideia.descricao}
CANAL: \${ideia.canal_nome || 'Geral'}
SÉRIE: \${ideia.serie_nome || 'Sem série'}
IDIOMA: \${ideia.linguagem || 'pt-BR'}

FORMATO DO ROTEIRO:
1. Hook inicial (primeiros 3 segundos) - frase de impacto
2. Introdução (contextualização)
3. Desenvolvimento (conteúdo principal com curiosidades)
4. Clímax (informação mais interessante)
5. Conclusão (call to action)

DIRETRIZES:
- Linguagem casual e envolvente
- Frases curtas e impactantes
- Duração alvo: 60-90 segundos
- Adicionar pausas dramáticas [PAUSA]
- Incluir ênfases *palavra*

Gere APENAS o roteiro em markdown, sem introduções.\`;

return {
  prompt,
  ideia_id: ideia.id,
  titulo: ideia.titulo,
  linguagem: ideia.linguagem
};`
      },
      id: "montar-prompt",
      name: "Montar Prompt IA",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [850, 300]
    },
    {
      parameters: {
        operation: "text",
        text: "={{ $json.prompt }}",
        options: {
          temperature: 0.8,
          maxTokens: 2000
        }
      },
      id: "gerar-roteiro-ia",
      name: "Gerar com IA",
      type: "@n8n/n8n-nodes-langchain.openAi",
      typeVersion: 1.3,
      position: [1050, 300],
      credentials: {
        openAiApi: {
          id: "openai-api",
          name: "OpenAI API"
        }
      }
    },
    {
      parameters: {
        operation: "executeQuery",
        query: "INSERT INTO pulso_content.roteiros (ideia_id, titulo, conteudo_md, versao, status, linguagem)\\nVALUES (\\n  '{{ $json.ideia_id }}',\\n  '{{ $json.titulo }}',\\n  '{{ $json.roteiro }}',\\n  1,\\n  'RASCUNHO',\\n  '{{ $json.linguagem }}'\\n)\\nRETURNING *",
        options: {}
      },
      id: "salvar-roteiro",
      name: "Salvar Roteiro",
      type: "n8n-nodes-base.postgres",
      typeVersion: 2.4,
      position: [1250, 300],
      credentials: {
        postgres: {
          id: "supabase-db",
          name: "Supabase PostgreSQL"
        }
      }
    },
    {
      parameters: {
        respondWith: "json",
        responseBody: "={{ { success: true, roteiro_id: $json.id, message: 'Roteiro gerado com sucesso!' } }}"
      },
      id: "responder-webhook",
      name: "Responder Webhook",
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1,
      position: [1450, 300]
    }
  ],
  connections: {
    "Webhook Gerar Roteiro": {
      main: [[{ node: "Validar Payload", type: "main", index: 0 }]]
    },
    "Validar Payload": {
      main: [[{ node: "Buscar Ideia Supabase", type: "main", index: 0 }]]
    },
    "Buscar Ideia Supabase": {
      main: [[{ node: "Montar Prompt IA", type: "main", index: 0 }]]
    },
    "Montar Prompt IA": {
      main: [[{ node: "Gerar com IA", type: "main", index: 0 }]]
    },
    "Gerar com IA": {
      main: [[{ node: "Salvar Roteiro", type: "main", index: 0 }]]
    },
    "Salvar Roteiro": {
      main: [[{ node: "Responder Webhook", type: "main", index: 0 }]]
    }
  },
  active: true,
  settings: {
    executionOrder: "v1"
  },
  tags: ["pulso", "ia", "roteiro"]
}

// ============================================
// WORKFLOW 2: Gerar Áudio
// ============================================
const workflowGerarAudio = {
  name: "PULSO - Gerar Áudio",
  nodes: [
    {
      parameters: {
        httpMethod: "POST",
        path: "gerar-audio",
        responseMode: "lastNode",
        options: {}
      },
      id: "webhook-gerar-audio",
      name: "Webhook Gerar Áudio",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [250, 300]
    },
    {
      parameters: {
        jsCode: `const payload = $input.item.json.body;

if (!payload.roteiroId) {
  throw new Error('roteiroId é obrigatório');
}

return {
  roteiro_id: payload.roteiroId,
  voz_id: payload.vozId || 'default'
};`
      },
      id: "validar-payload-audio",
      name: "Validar Payload",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [450, 300]
    },
    {
      parameters: {
        operation: "executeQuery",
        query: "SELECT * FROM pulso_content.roteiros WHERE id = '{{ $json.roteiro_id }}'",
        options: {}
      },
      id: "buscar-roteiro",
      name: "Buscar Roteiro",
      type: "n8n-nodes-base.postgres",
      typeVersion: 2.4,
      position: [650, 300],
      credentials: {
        postgres: {
          id: "supabase-db",
          name: "Supabase PostgreSQL"
        }
      }
    },
    {
      parameters: {
        jsCode: `// Preparar texto para TTS (remover markdown)
const roteiro = $input.item.json;

let texto = roteiro.conteudo_md;

// Remover formatação markdown
texto = texto.replace(/[#*_~\`]/g, '');
texto = texto.replace(/\\[PAUSA\\]/g, '... ');
texto = texto.trim();

return {
  texto,
  roteiro_id: roteiro.id,
  voz_id: $('Validar Payload').item.json.voz_id
};`
      },
      id: "preparar-texto",
      name: "Preparar Texto",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [850, 300]
    },
    {
      parameters: {
        method: "POST",
        url: "https://api.elevenlabs.io/v1/text-to-speech/{{$json.voz_id}}",
        authentication: "predefinedCredentialType",
        nodeCredentialType: "elevenLabsApi",
        sendBody: true,
        bodyParameters: {
          parameters: [
            {
              name: "text",
              value: "={{$json.texto}}"
            },
            {
              name: "model_id",
              value: "eleven_multilingual_v2"
            },
            {
              name: "voice_settings",
              value: {
                stability: 0.5,
                similarity_boost: 0.75
              }
            }
          ]
        },
        options: {
          response: {
            response: {
              responseFormat: "file"
            }
          }
        }
      },
      id: "gerar-audio-tts",
      name: "Gerar Áudio (ElevenLabs)",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [1050, 300],
      credentials: {
        elevenLabsApi: {
          id: "elevenlabs-api",
          name: "ElevenLabs API"
        }
      }
    },
    {
      parameters: {
        operation: "upload",
        bucketName: "audios",
        fileName: "={{$json.roteiro_id}}.mp3",
        binaryData: true,
        options: {}
      },
      id: "upload-audio-supabase",
      name: "Upload Áudio Supabase Storage",
      type: "n8n-nodes-base.supabase",
      typeVersion: 1,
      position: [1250, 300],
      credentials: {
        supabaseApi: {
          id: "supabase-api",
          name: "Supabase"
        }
      }
    },
    {
      parameters: {
        operation: "executeQuery",
        query: "INSERT INTO assets.audios (roteiro_id, url, formato, voz_id)\\nVALUES (\\n  '{{ $json.roteiro_id }}',\\n  '{{ $json.publicUrl }}',\\n  'mp3',\\n  '{{ $json.voz_id }}'\\n)\\nRETURNING *",
        options: {}
      },
      id: "salvar-audio-db",
      name: "Salvar Áudio DB",
      type: "n8n-nodes-base.postgres",
      typeVersion: 2.4,
      position: [1450, 300],
      credentials: {
        postgres: {
          id: "supabase-db",
          name: "Supabase PostgreSQL"
        }
      }
    },
    {
      parameters: {
        respondWith: "json",
        responseBody: "={{ { success: true, audio_id: $json.id, url: $json.url } }}"
      },
      id: "responder-webhook-audio",
      name: "Responder Webhook",
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1,
      position: [1650, 300]
    }
  ],
  connections: {
    "Webhook Gerar Áudio": {
      main: [[{ node: "Validar Payload", type: "main", index: 0 }]]
    },
    "Validar Payload": {
      main: [[{ node: "Buscar Roteiro", type: "main", index: 0 }]]
    },
    "Buscar Roteiro": {
      main: [[{ node: "Preparar Texto", type: "main", index: 0 }]]
    },
    "Preparar Texto": {
      main: [[{ node: "Gerar Áudio (ElevenLabs)", type: "main", index: 0 }]]
    },
    "Gerar Áudio (ElevenLabs)": {
      main: [[{ node: "Upload Áudio Supabase Storage", type: "main", index: 0 }]]
    },
    "Upload Áudio Supabase Storage": {
      main: [[{ node: "Salvar Áudio DB", type: "main", index: 0 }]]
    },
    "Salvar Áudio DB": {
      main: [[{ node: "Responder Webhook", type: "main", index: 0 }]]
    }
  },
  active: true,
  settings: {
    executionOrder: "v1"
  },
  tags: ["pulso", "audio", "tts"]
}

// ============================================
// WORKFLOW 3: Gerar Vídeo
// ============================================
const workflowGerarVideo = {
  name: "PULSO - Gerar Vídeo",
  nodes: [
    {
      parameters: {
        httpMethod: "POST",
        path: "gerar-video",
        responseMode: "lastNode",
        options: {}
      },
      id: "webhook-gerar-video",
      name: "Webhook Gerar Vídeo",
      type: "n8n-nodes-base.webhook",
      typeVersion: 2,
      position: [250, 300]
    },
    {
      parameters: {
        jsCode: `const payload = $input.item.json.body;

if (!payload.audioId) {
  throw new Error('audioId é obrigatório');
}

return {
  audio_id: payload.audioId,
  template: payload.template || 'default'
};`
      },
      id: "validar-payload-video",
      name: "Validar Payload",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [450, 300]
    },
    {
      parameters: {
        operation: "executeQuery",
        query: "SELECT a.*, r.titulo, r.conteudo_md\\nFROM assets.audios a\\nJOIN pulso_content.roteiros r ON a.roteiro_id = r.id\\nWHERE a.id = '{{ $json.audio_id }}'",
        options: {}
      },
      id: "buscar-audio",
      name: "Buscar Áudio",
      type: "n8n-nodes-base.postgres",
      typeVersion: 2.4,
      position: [650, 300],
      credentials: {
        postgres: {
          id: "supabase-db",
          name: "Supabase PostgreSQL"
        }
      }
    },
    {
      parameters: {
        jsCode: `// Nota: Este é um placeholder
// Você precisará integrar com serviço de geração de vídeo
// Opções: Remotion, Pictory, Synthesia, FFmpeg

const audio = $input.item.json;

return {
  audio_url: audio.url,
  titulo: audio.titulo,
  audio_id: audio.id,
  template: $('Validar Payload').item.json.template,
  // Placeholder - será substituído por integração real
  video_url: 'https://placeholder-video.mp4'
};`
      },
      id: "gerar-video",
      name: "Gerar Vídeo (Placeholder)",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [850, 300]
    },
    {
      parameters: {
        operation: "executeQuery",
        query: "INSERT INTO assets.videos (audio_id, url, formato, resolucao)\\nVALUES (\\n  '{{ $json.audio_id }}',\\n  '{{ $json.video_url }}',\\n  'mp4',\\n  '1080x1920'\\n)\\nRETURNING *",
        options: {}
      },
      id: "salvar-video-db",
      name: "Salvar Vídeo DB",
      type: "n8n-nodes-base.postgres",
      typeVersion: 2.4,
      position: [1050, 300],
      credentials: {
        postgres: {
          id: "supabase-db",
          name: "Supabase PostgreSQL"
        }
      }
    },
    {
      parameters: {
        respondWith: "json",
        responseBody: "={{ { success: true, video_id: $json.id, url: $json.url } }}"
      },
      id: "responder-webhook-video",
      name: "Responder Webhook",
      type: "n8n-nodes-base.respondToWebhook",
      typeVersion: 1,
      position: [1250, 300]
    }
  ],
  connections: {
    "Webhook Gerar Vídeo": {
      main: [[{ node: "Validar Payload", type: "main", index: 0 }]]
    },
    "Validar Payload": {
      main: [[{ node: "Buscar Áudio", type: "main", index: 0 }]]
    },
    "Buscar Áudio": {
      main: [[{ node: "Gerar Vídeo (Placeholder)", type: "main", index: 0 }]]
    },
    "Gerar Vídeo (Placeholder)": {
      main: [[{ node: "Salvar Vídeo DB", type: "main", index: 0 }]]
    },
    "Salvar Vídeo DB": {
      main: [[{ node: "Responder Webhook", type: "main", index: 0 }]]
    }
  },
  active: false, // Inativo até configurar serviço de vídeo
  settings: {
    executionOrder: "v1"
  },
  tags: ["pulso", "video", "placeholder"]
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================
async function criarWorkflows() {
  const workflows = [
    { name: 'Gerar Roteiro', data: workflowGerarRoteiro },
    { name: 'Gerar Áudio', data: workflowGerarAudio },
    { name: 'Gerar Vídeo', data: workflowGerarVideo }
  ]

  console.log('📦 Workflows a criar:')
  workflows.forEach(w => console.log(`   - ${w.name}`))
  console.log('')

  // Listar workflows existentes
  console.log('🔍 Verificando workflows existentes...')
  const { data: existentes } = await n8nAPI('/workflows')
  
  for (const workflow of workflows) {
    const existe = existentes.find(w => w.name === workflow.data.name)
    
    if (existe) {
      console.log(`⚠️  "${workflow.name}" já existe (ID: ${existe.id})`)
      console.log(`   Deseja sobrescrever? (Por segurança, pulando...)`)
      continue
    }

    try {
      console.log(`📝 Criando "${workflow.name}"...`)
      const result = await n8nAPI('/workflows', 'POST', workflow.data)
      console.log(`✅ "${workflow.name}" criado! ID: ${result.data.id}`)
      
      if (workflow.data.active) {
        console.log(`🟢 Ativando workflow...`)
        await n8nAPI(`/workflows/${result.data.id}/activate`, 'POST')
        console.log(`✅ Workflow ativado!`)
      }
      
      console.log('')
    } catch (error) {
      console.error(`❌ Erro ao criar "${workflow.name}":`, error.message)
      console.log('')
    }
  }

  console.log('✅ Processo concluído!')
  console.log('')
  console.log('📌 PRÓXIMOS PASSOS:')
  console.log('1. Acesse: ' + N8N_URL)
  console.log('2. Configure credenciais necessárias:')
  console.log('   - Supabase PostgreSQL')
  console.log('   - OpenAI API (para gerar roteiro)')
  console.log('   - ElevenLabs API (para gerar áudio)')
  console.log('3. Teste os webhooks!')
}

// Executar
criarWorkflows().catch(console.error)
