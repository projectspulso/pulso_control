import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🚀 Iniciando aprovação de ideia...')
    
    const { id } = await params
    console.log(`📝 ID da ideia: ${id}`)
    
    // Criar cliente Supabase aqui, dentro da função
    // IMPORTANTE: Usar SERVICE_ROLE_KEY para ter permissão total
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Usar apenas SERVICE_ROLE_KEY
    
    console.log('🔑 Verificando credenciais...')
    console.log('   URL:', !!supabaseUrl)
    console.log('   SERVICE_ROLE_KEY:', !!supabaseKey)
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Variáveis de ambiente faltando!')
      console.error('SUPABASE_URL:', !!supabaseUrl)
      console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey)
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
    
    console.log('✅ Cliente Supabase criado, tentando atualizar...')
    console.log('🔧 Usando view public.ideias (mesma que o frontend)')
    
    // 1. Atualizar status da ideia para APROVADA (via view public.ideias)
    // Cast para any para contornar limitação de tipos com views
    const supabaseAny = supabase as any
    const { data: ideia, error: updateError } = await supabaseAny
      .from('ideias')
      .update({ status: 'APROVADA' })
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Erro ao aprovar ideia:', updateError)
      console.error('❌ Detalhes do erro:', JSON.stringify(updateError, null, 2))
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
