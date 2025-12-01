'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AprovarIdeiaButtonProps {
  ideiaId: string
  ideiaStatus: string
  titulo: string
  onSuccess?: () => void
}

export function AprovarIdeiaButton({ 
  ideiaId, 
  ideiaStatus, 
  titulo,
  onSuccess 
}: AprovarIdeiaButtonProps) {
  const [isApproving, setIsApproving] = useState(false)
  const router = useRouter()

  async function handleAprovar() {
    if (ideiaStatus === 'APROVADA') {
      alert('Esta ideia já foi aprovada')
      return
    }

    setIsApproving(true)

    try {
      console.log(`📞 Aprovando ideia ${ideiaId}...`)
      
      const response = await fetch(`/api/ideias/${ideiaId}/aprovar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('❌ Erro ao aprovar:', data)
        alert(data.error || 'Erro ao aprovar ideia')
        return
      }

      console.log('✅ Resposta da API:', data)

      // Sucesso na aprovação
      if (data.success) {
        alert(`✅ "${titulo}" aprovada!`)

        // Verificar status do workflow
        if (data.workflow?.status === 'triggered') {
          console.log('🤖 Roteiro sendo gerado pelo n8n...')
        } else if (data.workflow?.status === 'error') {
          console.warn('⚠️ Ideia aprovada, mas workflow falhou')
        } else if (data.workflow?.status === 'skipped') {
          console.info('ℹ️ Webhook não configurado')
        }

        // Callback de sucesso
        if (onSuccess) {
          onSuccess()
        } else {
          // Recarregar página ou redirecionar
          router.refresh()
        }
      }

    } catch (error) {
      console.error('💥 Erro ao aprovar ideia:', error)
      alert('Erro ao conectar com servidor')
    } finally {
      setIsApproving(false)
    }
  }

  const isAprovada = ideiaStatus === 'APROVADA'

  return (
    <button
      onClick={handleAprovar}
      disabled={isApproving || isAprovada}
      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
        isAprovada 
          ? 'bg-green-900/20 text-green-400 border-2 border-green-600' 
          : 'bg-violet-600 hover:bg-violet-700 text-white'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isApproving ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Aprovando...
        </>
      ) : isAprovada ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Já Aprovada
        </>
      ) : (
        <>
          <Check className="mr-2 h-4 w-4" />
          Aprovar e Gerar Roteiro
        </>
      )}
    </button>
  )
}
