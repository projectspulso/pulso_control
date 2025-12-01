import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // 1. Atualizar status da ideia para APROVADA
    // Usando cast para contornar problema de types com views
    const client = supabaseServer as any
    const { data: ideia, error: updateError } = await client
      .from('ideias')
      .update({ status: 'APROVADA' })
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Erro ao aprovar ideia:', updateError)
      return NextResponse.json(
        { error: 'Erro ao aprovar ideia', details: updateError.message },
        { status: 500 }
      )
    }

    console.log(`✅ Ideia ${id} aprovada com sucesso`)

    // 2. Chamar webhook do n8n (WF01 - Gerar Roteiro)
    const webhookUrl = process.env.N8N_WEBHOOK_APROVAR_IDEIA
    
    if (!webhookUrl) {
      console.warn('⚠️ Webhook URL não configurada, roteiro não será gerado automaticamente')
      return NextResponse.json({
        success: true,
        ideia,
        workflow: { status: 'skipped', message: 'Webhook não configurado' }
      })
    }

    try {
      console.log(`📞 Chamando webhook do n8n: ${webhookUrl}`)
      
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': process.env.WEBHOOK_SECRET || ''
        },
        body: JSON.stringify({
          ideia_id: id,
          trigger: 'app-aprovacao',
          timestamp: new Date().toISOString()
        })
      })

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text()
        console.error(`❌ Webhook falhou: ${webhookResponse.status} - ${errorText}`)
        
        return NextResponse.json({
          success: true,
          ideia,
          workflow: {
            status: 'error',
            message: `Webhook retornou ${webhookResponse.status}`,
            details: errorText
          }
        }, { status: 207 }) // 207 = Multi-Status (ideia ok, workflow falhou)
      }

      const workflowResult = await webhookResponse.json()
      console.log('✅ Workflow WF01 disparado com sucesso:', workflowResult)

      return NextResponse.json({
        success: true,
        ideia,
        workflow: {
          status: 'triggered',
          message: 'Roteiro sendo gerado...',
          data: workflowResult
        }
      })

    } catch (webhookError) {
      console.error('💥 Erro ao chamar webhook:', webhookError)
      
      // Ideia foi aprovada, mas workflow falhou
      return NextResponse.json({
        success: true,
        ideia,
        workflow: {
          status: 'error',
          message: 'Não foi possível disparar geração de roteiro',
          error: webhookError instanceof Error ? webhookError.message : 'Erro desconhecido'
        }
      }, { status: 207 })
    }

  } catch (error) {
    console.error('💥 Erro geral ao processar aprovação:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao processar aprovação',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
