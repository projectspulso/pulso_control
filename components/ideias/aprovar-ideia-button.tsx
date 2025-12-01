'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
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
      toast.info('Esta ideia já foi aprovada')
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
        toast.error(data.error || 'Erro ao aprovar ideia')
        return
      }

      console.log('✅ Resposta da API:', data)

      // Sucesso na aprovação
      if (data.success) {
        toast.success(`✅ "${titulo}" aprovada!`)

        // Verificar status do workflow
        if (data.workflow?.status === 'triggered') {
          toast.success('🤖 Roteiro sendo gerado pelo n8n...', {
            description: 'Você será notificado quando estiver pronto',
            duration: 5000
          })
        } else if (data.workflow?.status === 'error') {
          toast.warning('⚠️ Ideia aprovada, mas workflow falhou', {
            description: 'Você pode gerar o roteiro manualmente',
            duration: 5000
          })
        } else if (data.workflow?.status === 'skipped') {
          toast.info('ℹ️ Webhook não configurado', {
            description: 'Gere o roteiro manualmente',
            duration: 5000
          })
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
      toast.error('Erro ao conectar com servidor')
    } finally {
      setIsApproving(false)
    }
  }

  const isAprovada = ideiaStatus === 'APROVADA'

  return (
    <Button
      onClick={handleAprovar}
      disabled={isApproving || isAprovada}
      variant={isAprovada ? 'outline' : 'default'}
      size="lg"
      className={isAprovada ? 'bg-green-900/20 text-green-400 border-green-600' : ''}
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
    </Button>
  )
}
