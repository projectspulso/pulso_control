import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { callOpenAITTS, limparParaTTS, splitTextForTTS } from '@/lib/automation/ai-clients'

/**
 * POST /api/automation/gerar-audio
 *
 * Gera áudio TTS a partir de um roteiro aprovado.
 * Payload: { roteiro_id: string, canal_id?: string }
 *
 * Processo:
 * 1. Busca roteiro no banco
 * 2. Limpa texto para TTS
 * 3. Gera áudio via OpenAI TTS-1-HD
 * 4. Upload para Supabase Storage
 * 5. Cria registro em pulso_content.audios
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret')
  if (secret && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await request.json()
  const { roteiro_id } = payload

  if (!roteiro_id) {
    return NextResponse.json({ error: 'roteiro_id é obrigatório' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseAdminClient() as any

  try {
    // Buscar roteiro
    const { data: roteiro, error: roteiroError } = await supabase
      .schema('pulso_content')
      .from('roteiros')
      .select('*')
      .eq('id', roteiro_id)
      .single()

    if (roteiroError || !roteiro) {
      return NextResponse.json({ error: 'Roteiro não encontrado' }, { status: 404 })
    }

    // Verificar se já existe áudio
    const { data: existingAudio } = await supabase
      .schema('pulso_content')
      .from('audios')
      .select('id')
      .eq('roteiro_id', roteiro_id)
      .limit(1)

    if (existingAudio?.length > 0) {
      return NextResponse.json({
        error: 'Áudio já existe para este roteiro',
        audio_id: existingAudio[0].id,
      }, { status: 409 })
    }

    // Buscar config de voz
    const { data: vozConfig } = await supabase
      .schema('pulso_automation')
      .from('ai_config')
      .select('valor')
      .eq('chave', 'tts_voices')
      .single()

    // Determinar voz baseado no canal
    let voz = 'alloy'
    if (vozConfig?.valor && roteiro.canal_id) {
      const { data: canal } = await supabase
        .from('vw_pulso_canais')
        .select('slug')
        .eq('id', roteiro.canal_id)
        .single()

      if (canal?.slug) {
        const vozes = typeof vozConfig.valor === 'string'
          ? JSON.parse(vozConfig.valor)
          : vozConfig.valor
        voz = vozes[canal.slug] || 'alloy'
      }
    }

    // Limpar texto para TTS
    const textoLimpo = limparParaTTS(roteiro.conteudo_md)
    const chunks = splitTextForTTS(textoLimpo)

    // Gerar áudio para cada chunk
    const audioBuffers: ArrayBuffer[] = []
    for (const chunk of chunks) {
      const buffer = await callOpenAITTS(chunk, { voice: voz })
      audioBuffers.push(buffer)
    }

    // Concatenar buffers (para múltiplos chunks)
    let finalBuffer: ArrayBuffer
    if (audioBuffers.length === 1) {
      finalBuffer = audioBuffers[0]
    } else {
      // Concatenação simples de MP3s (funciona para playback sequencial)
      const totalLength = audioBuffers.reduce((sum, buf) => sum + buf.byteLength, 0)
      const merged = new Uint8Array(totalLength)
      let offset = 0
      for (const buf of audioBuffers) {
        merged.set(new Uint8Array(buf), offset)
        offset += buf.byteLength
      }
      finalBuffer = merged.buffer
    }

    // Upload para Supabase Storage
    const canalSlug = roteiro.canal_id || 'geral'
    const fileName = `${roteiro.id}_${Date.now()}.mp3`
    const storagePath = `audio/${canalSlug}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('pulso-assets')
      .upload(storagePath, finalBuffer, {
        contentType: 'audio/mpeg',
        upsert: false,
      })

    if (uploadError) {
      // Tentar criar o bucket se não existir
      if (uploadError.message.includes('not found')) {
        await supabase.storage.createBucket('pulso-assets', { public: true })
        const { error: retryError } = await supabase.storage
          .from('pulso-assets')
          .upload(storagePath, finalBuffer, {
            contentType: 'audio/mpeg',
            upsert: false,
          })
        if (retryError) {
          return NextResponse.json(
            { error: `Erro no upload: ${retryError.message}` },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json(
          { error: `Erro no upload: ${uploadError.message}` },
          { status: 500 }
        )
      }
    }

    // URL pública do áudio
    const { data: publicUrl } = supabase.storage
      .from('pulso-assets')
      .getPublicUrl(storagePath)

    // Salvar registro de áudio
    const { data: audioSaved, error: audioError } = await supabase
      .schema('pulso_content')
      .from('audios')
      .insert({
        roteiro_id: roteiro.id,
        canal_id: roteiro.canal_id,
        storage_path: storagePath,
        url_publica: publicUrl?.publicUrl,
        duracao_segundos: roteiro.duracao_estimado_segundos,
        tamanho_bytes: finalBuffer.byteLength,
        formato: 'mp3',
        provider: 'openai',
        voz: voz,
        modelo: 'tts-1-hd',
        status: 'PRONTO',
        metadata: {
          chunks: chunks.length,
          caracteres_total: textoLimpo.length,
          gerado_em: new Date().toISOString(),
        },
      })
      .select('id')
      .single()

    if (audioError) {
      return NextResponse.json(
        { error: `Erro ao salvar registro de áudio: ${audioError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      audio_id: audioSaved?.id,
      storage_path: storagePath,
      url: publicUrl?.publicUrl,
      tamanho_bytes: finalBuffer.byteLength,
      voz,
      chunks: chunks.length,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
