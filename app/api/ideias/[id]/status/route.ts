import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

/**
 * PATCH /api/ideias/[id]/status
 * Atualiza APENAS o status da ideia (sem disparar workflow)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('📝 Atualizando status da ideia...')
    
    const { id } = await params
    const body = await request.json()
    const { status } = body
    
    if (!status) {
      return NextResponse.json(
        { error: 'Status é obrigatório' },
        { status: 400 }
      )
    }
    
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
    
    console.log('🔧 Atualizando status via view public.ideias')
    
    // Atualizar status via view public.ideias (mesma que o frontend usa)
    // @ts-ignore - View permite update mas TypeScript não reconhece
    const { data: ideia, error: updateError } = await supabase
      .from('ideias')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Erro ao atualizar status:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar status', details: updateError.message },
        { status: 500 }
      )
    }

    console.log(`✅ Status da ideia ${id} atualizado para ${status}`)
    
    return NextResponse.json({
      success: true,
      ideia
    })

  } catch (error) {
    console.error('💥 Erro ao processar atualização:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao processar atualização',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
