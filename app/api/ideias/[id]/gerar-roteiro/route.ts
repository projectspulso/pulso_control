import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

/**
 * POST /api/ideias/[id]/gerar-roteiro
 * Dispara o workflow WF01 para gerar roteiro (SEM alterar status da ideia)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🎬 Iniciando geração de roteiro...')
    
    const { id } = await params
    console.log(`📝 ID da ideia: ${id}`)
    
    // Criar cliente Supabase com SERVICE_ROLE_KEY
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
    
    // 1. Verificar se ideia existe e está aprovada (usando view public.ideias)
    const { data: ideia, error: fetchError } = await supabase
      .from('ideias')
      .select('id, status, titulo')
      .eq('id', id)
      .single() as any
    
    if (fetchError || !ideia) {
      return NextResponse.json(
        { error: 'Ideia não encontrada' },
        { status: 404 }
      )
    }
    
    if (ideia.status !== 'APROVADA') {
      return NextResponse.json(
        { error: 'Ideia precisa estar aprovada antes de gerar roteiro' },
        { status: 400 }
      )
    }
    
    // 2. Verificar se já existe roteiro para esta ideia (usando view public.roteiros)
    const { data: roteiros, error: roteiroCheckError } = await supabase
      .from('roteiros')
      .select('id')
      .eq('ideia_id', id)
      .limit(1) as any
    
    if (roteiros && roteiros.length > 0) {
      return NextResponse.json(
        { error: 'Já existe um roteiro para esta ideia', roteiro_id: roteiros[0].id },
        { status: 400 }
      )
    }

    console.log(`✅ Ideia ${id} válida para geração de roteiro`)

    // 3. Chamar webhook do n8n (WF01 - Gerar Roteiro)
    const webhookUrl = process.env.N8N_WEBHOOK_APROVAR_IDEIA
    
    if (!webhookUrl) {
      console.warn('⚠️ Webhook URL não configurada')
      return NextResponse.json({
        success: false,
        error: 'Webhook WF01 não configurado'
      }, { status: 500 })
    }

    try {
      console.log(`📞 Chamando webhook WF01: ${webhookUrl}`)
      
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': process.env.WEBHOOK_SECRET || ''
        },
        body: JSON.stringify({
          ideia_id: id,
          trigger: 'manual-gerar-roteiro',
          timestamp: new Date().toISOString()
        })
      })

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text()
        console.error(`❌ Webhook falhou: ${webhookResponse.status} - ${errorText}`)
        
        return NextResponse.json({
          success: false,
          error: `Webhook retornou ${webhookResponse.status}`,
          details: errorText
        }, { status: 500 })
      }

      const workflowResult = await webhookResponse.json()
      console.log('✅ Workflow WF01 disparado com sucesso:', workflowResult)

      return NextResponse.json({
        success: true,
        message: 'Roteiro sendo gerado...',
        ideia: {
          id: ideia.id,
          titulo: ideia.titulo
        },
        workflow: {
          status: 'triggered',
          data: workflowResult
        },
        roteiro_id: workflowResult?.data?.roteiro?.id
      })

    } catch (webhookError) {
      console.error('💥 Erro ao chamar webhook:', webhookError)
      
      return NextResponse.json({
        success: false,
        error: 'Não foi possível disparar geração de roteiro',
        details: webhookError instanceof Error ? webhookError.message : 'Erro desconhecido'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('💥 Erro geral ao processar geração:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao processar geração de roteiro',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
