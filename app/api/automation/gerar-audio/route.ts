import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { callElevenLabsTTS, limparParaTTS, splitTextForTTS } from '@/lib/automation/ai-clients'
import { gerarCenas } from '@/lib/automation/gerar-cenas'

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
  const denied = await guardApi(request)
  if (denied) return denied

  const payload = await request.json()
  const { roteiro_id, force } = payload

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
      .select('id, storage_path')
      .eq('roteiro_id', roteiro_id)

    if (existingAudio?.length > 0) {
      if (!force) {
        return NextResponse.json({
          error: 'Áudio já existe para este roteiro (use force: true para regerar)',
          audio_id: existingAudio[0].id,
        }, { status: 409 })
      }
      // force: apaga storage + registros antigos antes de regerar
      const paths = existingAudio.map((a: { storage_path?: string }) => a.storage_path).filter(Boolean)
      if (paths.length) await supabase.storage.from('pulso-assets').remove(paths)
      await supabase.schema('pulso_content').from('audios').delete().eq('roteiro_id', roteiro_id)
    }

    // Buscar config de voz
    const { data: vozConfig } = await supabase
      .schema('pulso_automation')
      .from('ai_config')
      .select('valor')
      .eq('chave', 'tts_voices')
      .single()

    // Determinar voz baseado no canal
    let voz = 'PULSO (Voice Design)'
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
        voz = 'PULSO (Voice Design)'
      }
    }

    // Limpar texto para TTS
    const textoLimpo = limparParaTTS(roteiro.conteudo_md)
    const chunks = splitTextForTTS(textoLimpo)

    // Gerar áudio para cada chunk
    const audioBuffers: ArrayBuffer[] = []
    for (const chunk of chunks) {
      const buffer = await callElevenLabsTTS(chunk)
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

    // Salvar registro de áudio (usando colunas reais da tabela pulso_content.audios)
    const { data: audioSaved, error: audioError } = await supabase
      .schema('pulso_content')
      .from('audios')
      .insert({
        roteiro_id: roteiro.id,
        ideia_id: roteiro.ideia_id,
        canal_id: roteiro.canal_id,
        storage_path: storagePath,
        public_url: publicUrl?.publicUrl,
        url: publicUrl?.publicUrl,
        duracao_segundos: roteiro.duracao_estimado_segundos,
        tamanho_bytes: finalBuffer.byteLength,
        formato: 'mp3',
        status: 'PRONTO',
        metadata: {
          chunks: chunks.length,
          caracteres_total: textoLimpo.length,
          gerado_em: new Date().toISOString(),
          provider: 'elevenlabs',
          voz: 'PULSO (Voice Design)',
          voice_id: 'GmzLAnPHSUkxG3P5yfca',
          modelo: 'eleven_multilingual_v2',
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


    // kanban: marca o pipeline como ÁUDIO GERADO
    await supabase
      .schema('pulso_content')
      .from('pipeline_producao')
      .update({ status: 'AUDIO_GERADO' })
      .eq('ideia_id', roteiro.ideia_id)

    // CÉREBRO do worker: gera as cenas visuais já aqui (best-effort), pra o item chegar
    // em AUDIO_GERADO com metadata.cenas pronto. Falha NUNCA quebra a geração do áudio.
    try {
      await gerarCenas(supabase, { roteiro_id: roteiro.id })
    } catch (e) {
      // O console.error sozinho não bastava: o log morre na Vercel e o card fica em
      // EM_EDICAO sem cenas PRA SEMPRE — o worker de render pula item sem cenas, e ninguém
      // fica sabendo. Quatro vídeos ficaram parados de 6 a 13 dias assim, sem rastro nenhum.
      // Agora o motivo fica escrito no próprio card, visível no kanban.
      const motivo = e instanceof Error ? e.message : 'erro desconhecido'
      console.error('[gerar-audio] gerar-cenas best-effort falhou (segue):', e)
      try {
        await supabase
          .schema('pulso_content')
          .from('pipeline_producao')
          .update({ observacoes: `Cenas não geradas (${new Date().toISOString().slice(0, 10)}): ${motivo}`.slice(0, 500) })
          .eq('ideia_id', roteiro.ideia_id)
      } catch { /* anotar o motivo é best-effort; nunca derruba a geração do áudio */ }
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
