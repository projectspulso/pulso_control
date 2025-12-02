'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, Sparkles, Volume2, FileText } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

interface ApproveIdeiaButtonProps {
  ideiaId: string
  currentStatus: string
  onSuccess?: () => void
  className?: string
}

/**
 * Botão para APENAS aprovar ideia (sem gerar roteiro)
 */
export function ApproveIdeiaButton({ ideiaId, currentStatus, onSuccess, className }: ApproveIdeiaButtonProps) {
  const [isApproving, setIsApproving] = useState(false)
  const queryClient = useQueryClient()

  const handleApprove = async () => {
    setIsApproving(true)
    
    try {
      const response = await fetch(`/api/ideias/${ideiaId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'APROVADA' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao aprovar ideia')
      }

      queryClient.invalidateQueries({ queryKey: ['ideias'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })

      onSuccess?.()
    } catch (error) {
      console.error('Erro ao aprovar ideia:', error)
      alert('Erro ao aprovar ideia. Tente novamente.')
    } finally {
      setIsApproving(false)
    }
  }

  // Não mostrar se já aprovada
  if (currentStatus === 'APROVADA') {
    return null
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
          Aprovando...
        </>
      ) : (
        <>
          <CheckCircle2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
          Aprovar Ideia
        </>
      )}
    </button>
  )
}

interface GerarRoteiroButtonProps {
  ideiaId: string
  ideiaStatus: string
  hasRoteiro: boolean
  onSuccess?: () => void
  className?: string
}

/**
 * Botão para gerar roteiro via WF01
 * Só aparece se ideia estiver aprovada e NÃO tiver roteiro ainda
 */
export function GerarRoteiroButton({ 
  ideiaId, 
  ideiaStatus, 
  hasRoteiro, 
  onSuccess, 
  className 
}: GerarRoteiroButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const queryClient = useQueryClient()

  const handleGenerate = async () => {
    setIsGenerating(true)
    
    try {
      const response = await fetch(`/api/ideias/${ideiaId}/gerar-roteiro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar roteiro')
      }

      queryClient.invalidateQueries({ queryKey: ['ideias'] })
      queryClient.invalidateQueries({ queryKey: ['roteiros'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })

      alert(`✅ Roteiro gerado com sucesso! ID: ${data.roteiro_id || 'N/A'}`)
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao gerar roteiro:', error)
      alert('Erro ao gerar roteiro. Tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Não mostrar se:
  // 1. Ideia não está aprovada
  // 2. Já tem roteiro criado
  if (ideiaStatus !== 'APROVADA' || hasRoteiro) {
    return null
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={isGenerating}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all group ${className || ''}`}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Gerando roteiro...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 group-hover:scale-110 transition-transform" />
          Gerar Roteiro (IA)
          <FileText className="h-3 w-3 opacity-70" />
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
