'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, Sparkles, Volume2 } from 'lucide-react'
import { useGerarRoteiro, useGerarAudio } from '@/lib/hooks/use-n8n'
import { supabase } from '@/lib/supabase/client'

interface ApproveIdeiaButtonProps {
  ideiaId: string
  onSuccess?: () => void
}

/**
 * Botão para aprovar ideia e disparar WF01 (Gerar Roteiro)
 */
export function ApproveIdeiaButton({ ideiaId, onSuccess }: ApproveIdeiaButtonProps) {
  const [isApproving, setIsApproving] = useState(false)
  const gerarRoteiro = useGerarRoteiro()

  const handleApprove = async () => {
    setIsApproving(true)
    
    try {
      // 1. Atualizar status da ideia para APROVADA
      const { error: updateError } = await supabase
        .from('ideias')
        .update({ status: 'APROVADA' })
        .eq('id', ideiaId)
      
      if (updateError) throw updateError

      // 2. Disparar WF01 - Gerar Roteiro (webhook)
      await gerarRoteiro.mutateAsync(ideiaId)

      onSuccess?.()
    } catch (error) {
      console.error('Erro ao aprovar ideia:', error)
      alert('Erro ao aprovar ideia. Tente novamente.')
    } finally {
      setIsApproving(false)
    }
  }

  return (
    <button
      onClick={handleApprove}
      disabled={isApproving || gerarRoteiro.isPending}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-green-900 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all group"
    >
      {(isApproving || gerarRoteiro.isPending) ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Gerando roteiro...
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
          Aprovar & Gerar Roteiro
          <Sparkles className="h-3 w-3 opacity-70" />
        </>
      )}
    </button>
  )
}

interface ApproveRoteiroButtonProps {
  roteiroId: string
  onSuccess?: () => void
}

/**
 * Botão para aprovar roteiro e disparar WF02 (Gerar Áudio)
 */
export function ApproveRoteiroButton({ roteiroId, onSuccess }: ApproveRoteiroButtonProps) {
  const [isApproving, setIsApproving] = useState(false)
  const gerarAudio = useGerarAudio()

  const handleApprove = async () => {
    setIsApproving(true)
    
    try {
      // 1. Atualizar status do roteiro para APROVADO
      const { error: updateError } = await supabase
        .from('roteiros')
        .update({ status: 'APROVADO' })
        .eq('id', roteiroId)
      
      if (updateError) throw updateError

      // 2. Disparar WF02 - Gerar Áudio (webhook)
      await gerarAudio.mutateAsync(roteiroId)

      onSuccess?.()
    } catch (error) {
      console.error('Erro ao aprovar roteiro:', error)
      alert('Erro ao aprovar roteiro. Tente novamente.')
    } finally {
      setIsApproving(false)
    }
  }

  return (
    <button
      onClick={handleApprove}
      disabled={isApproving || gerarAudio.isPending}
      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all group"
    >
      {(isApproving || gerarAudio.isPending) ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Gerando áudio...
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
          Aprovar & Gerar Áudio
          <Volume2 className="h-3 w-3 opacity-70" />
        </>
      )}
    </button>
  )
}
