'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, Sparkles, Volume2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

interface ApproveIdeiaButtonProps {
  ideiaId: string
  onSuccess?: () => void
  className?: string
}

/**
 * Botão para aprovar ideia e disparar WF01 (Gerar Roteiro)
 */
export function ApproveIdeiaButton({ ideiaId, onSuccess, className }: ApproveIdeiaButtonProps) {
  const [isApproving, setIsApproving] = useState(false)
  const queryClient = useQueryClient()

  const handleApprove = async () => {
    setIsApproving(true)
    
    try {
      // Chamar API route que faz tudo: atualizar status + webhook n8n
      const response = await fetch(`/api/ideias/${ideiaId}/aprovar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao aprovar ideia')
      }

      // Invalidar queries para atualizar UI
      queryClient.invalidateQueries({ queryKey: ['ideias'] })
      queryClient.invalidateQueries({ queryKey: ['roteiros'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })

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
      disabled={isApproving}
      className={`flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-green-900 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all group ${className || ''}`}
    >
      {isApproving ? (
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
  const queryClient = useQueryClient()

  const handleApprove = async () => {
    setIsApproving(true)
    
    try {
      // Chamar API route que faz tudo: atualizar status + webhook n8n
      const response = await fetch(`/api/roteiros/${roteiroId}/aprovar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao aprovar roteiro')
      }

      // Invalidar queries para atualizar UI
      queryClient.invalidateQueries({ queryKey: ['roteiros'] })
      queryClient.invalidateQueries({ queryKey: ['audios'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })

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
      disabled={isApproving}
      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all group"
    >
      {isApproving ? (
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
