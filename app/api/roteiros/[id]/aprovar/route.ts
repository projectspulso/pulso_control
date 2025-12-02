import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Criar cliente Supabase aqui, dentro da função
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
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

    // 1. Atualizar status do roteiro para APROVADO
    // Usando cast para contornar problema de types com views
    const client = supabase as any
    const { data: roteiro, error: updateError } = await client
      .from('roteiros')
      .update({ 
        status: 'APROVADO',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Erro ao atualizar roteiro:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar status do roteiro' },
        { status: 500 }
      )
    }    // 2. Disparar webhook WF02 - Gerar Áudio
    const webhookUrl = process.env.N8N_WEBHOOK_APROVAR_ROTEIRO
    const webhookSecret = process.env.WEBHOOK_SECRET

    if (!webhookUrl) {
      console.error('N8N_WEBHOOK_APROVAR_ROTEIRO não configurado')
      // Continua mesmo sem webhook (roteiro foi aprovado)
      return NextResponse.json({ 
        success: true, 
        roteiro,
        warning: 'Roteiro aprovado, mas webhook WF02 não configurado'
      })
    }

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhookSecret && { 'X-Webhook-Secret': webhookSecret })
        },
        body: JSON.stringify({
          roteiro_id: id,
          timestamp: new Date().toISOString()
        })
      })

      if (!webhookResponse.ok) {
        console.error('Webhook WF02 falhou:', await webhookResponse.text())
        // Não retorna erro, pois o roteiro já foi aprovado
        return NextResponse.json({ 
          success: true, 
          roteiro,
          warning: 'Roteiro aprovado, mas webhook WF02 falhou'
        })
      }

      const webhookData = await webhookResponse.json()
      
      return NextResponse.json({ 
        success: true, 
        roteiro,
        webhook: webhookData
      })
    } catch (webhookError) {
      console.error('Erro ao chamar webhook WF02:', webhookError)
      return NextResponse.json({ 
        success: true, 
        roteiro,
        warning: 'Roteiro aprovado, mas webhook WF02 com erro'
      })
    }

  } catch (error) {
    console.error('Erro ao aprovar roteiro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
