'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Filter, Plus, Sparkles } from 'lucide-react'

import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  type FeedbackTone,
  FeedbackBanner,
} from '@/components/ui/feedback-banner'
import { useCanais } from '@/lib/hooks/use-core'
import { useIdeias } from '@/lib/hooks/use-ideias'
import { useGerarIdeias } from '@/lib/hooks/use-automation'
import type { Database } from '@/lib/supabase/database.types'

type Canal = Database['pulso_core']['Tables']['canais']['Row']
type Ideia = Database['pulso_content']['Tables']['ideias']['Row']
type IdeiaStatus = Ideia['status']

interface FeedbackState {
  tone: FeedbackTone
  title: string
  message: string
}

const STATUS_CONFIG: Record<IdeiaStatus, { label: string; color: string }> = {
  RASCUNHO: { label: 'Rascunho', color: 'bg-zinc-500' },
  APROVADA: { label: 'Aprovada', color: 'bg-green-500' },
  EM_PRODUCAO: { label: 'Em producao', color: 'bg-purple-500' },
  CONCLUIDA: { label: 'Concluida', color: 'bg-blue-500' },
  ARQUIVADA: { label: 'Arquivada', color: 'bg-zinc-700' },
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }

  return 'Nao foi possivel executar a acao agora.'
}

export default function CanalPage() {
  const params = useParams()
  const slug = typeof params?.slug === 'string' ? params.slug : ''
  const { data: canais } = useCanais()
  const { data: allIdeias } = useIdeias()
  const gerarIdeias = useGerarIdeias()

  const [statusFilter, setStatusFilter] = useState<'TODAS' | IdeiaStatus>('TODAS')
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [quantidade, setQuantidade] = useState('10')
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  const canal = canais?.find((item: Canal) => item.slug === slug)
  const ideias =
    allIdeias?.filter((item: Ideia) => item.canal_id === canal?.id) ?? []
  const ideiasFiltered =
    statusFilter === 'TODAS'
      ? ideias
      : ideias.filter((item: Ideia) => item.status === statusFilter)

  const stats = ideias.reduce((acc, ideia) => {
    acc[ideia.status] = (acc[ideia.status] || 0) + 1
    return acc
  }, {} as Partial<Record<IdeiaStatus, number>>)

  const statusEntries = Object.entries(STATUS_CONFIG) as Array<
    [IdeiaStatus, { label: string; color: string }]
  >

  const registrarFeedback = (
    tone: FeedbackTone,
    title: string,
    message: string,
  ) => {
    setFeedback({ tone, title, message })
  }

  const handleGerarIdeias = async () => {
    if (!canal) {
      return
    }

    const qtd = Number.parseInt(quantidade, 10)
    if (Number.isNaN(qtd) || qtd < 1 || qtd > 50) {
      registrarFeedback(
        'error',
        'Quantidade invalida',
        'Informe um numero entre 1 e 50 para gerar ideias.',
      )
      return
    }

    try {
      await gerarIdeias.mutateAsync({
        canalId: canal.id,
        quantidade: qtd,
      })
      setShowGenerateDialog(false)
      registrarFeedback(
        'success',
        'Workflow disparado',
        `A geracao de ${qtd} ideias para ${canal.nome} foi iniciada.`,
      )
    } catch (error) {
      console.error('Erro ao gerar ideias:', error)
      registrarFeedback('error', 'Falha ao gerar ideias', getErrorMessage(error))
    }
  }

  if (!canal) {
    return (
      <div className="p-8">
        <p className="text-zinc-400">Canal nao encontrado.</p>
        <Link
          href="/canais"
          className="mt-4 inline-flex text-sm text-violet-400 hover:text-violet-300"
        >
          Voltar para canais
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/canais"
          className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para canais
        </Link>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-white">{canal.nome}</h1>
            {canal.descricao && (
              <p className="text-zinc-400">{canal.descricao}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowGenerateDialog(true)}
              disabled={gerarIdeias.isPending}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {gerarIdeias.isPending ? 'Gerando...' : 'Gerar ideias IA'}
            </button>
            <Link
              href={`/ideias/nova?canal=${canal.id}`}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              Nova ideia
            </Link>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="mb-6">
          <FeedbackBanner
            tone={feedback.tone}
            title={feedback.title}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <button
          type="button"
          onClick={() => setStatusFilter('TODAS')}
          className={`rounded-lg border bg-zinc-900 p-4 transition-colors hover:border-zinc-700 ${statusFilter === 'TODAS' ? 'border-purple-600' : 'border-zinc-800'}`}
        >
          <p className="text-2xl font-bold text-white">{ideias.length}</p>
          <p className="text-xs text-zinc-500">Total</p>
        </button>

        {statusEntries.map(([status, config]) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-lg border bg-zinc-900 p-4 transition-colors hover:border-zinc-700 ${statusFilter === status ? 'border-purple-600' : 'border-zinc-800'}`}
          >
            <p className="text-2xl font-bold text-white">{stats[status] || 0}</p>
            <p className="text-xs text-zinc-500">{config.label}</p>
          </button>
        ))}
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Filter className="h-4 w-4" />
          <span>Filtros</span>
        </div>
        {statusFilter !== 'TODAS' && (
          <button
            type="button"
            onClick={() => setStatusFilter('TODAS')}
            className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-white transition-colors hover:bg-zinc-700"
          >
            Limpar filtro
          </button>
        )}
      </div>

      <div className="space-y-3">
        {ideiasFiltered.map((ideia: Ideia) => {
          const statusConfig = STATUS_CONFIG[ideia.status]

          return (
            <div
              key={ideia.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 transition-colors hover:border-zinc-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">
                      {ideia.titulo}
                    </h3>
                    <span
                      className={`${statusConfig.color} rounded-full px-2 py-1 text-xs text-white`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  {ideia.descricao && (
                    <p className="mb-3 line-clamp-2 text-sm text-zinc-400">
                      {ideia.descricao}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    {ideia.prioridade && <span>Prioridade: {ideia.prioridade}</span>}
                    {ideia.created_at && (
                      <span>
                        Criada em{' '}
                        {new Date(ideia.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/ideias/${ideia.id}`}
                    className="rounded border border-zinc-700 px-3 py-1 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
                  >
                    Ver detalhes
                  </Link>
                  {ideia.status === 'APROVADA' && (
                    <Link
                      href={`/ideias/${ideia.id}`}
                      className="rounded bg-purple-600 px-3 py-1 text-sm text-white transition-colors hover:bg-purple-700"
                    >
                      Abrir para roteiro
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {ideiasFiltered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-zinc-500">
              Nenhuma ideia encontrada para este filtro.
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showGenerateDialog}
        title="Gerar ideias com IA"
        description="Dispare o workflow para criar um novo lote de ideias deste canal."
        confirmLabel="Gerar ideias"
        onConfirm={handleGerarIdeias}
        onCancel={() => setShowGenerateDialog(false)}
        isConfirming={gerarIdeias.isPending}
      >
        <label className="block text-sm font-medium text-zinc-300">
          Quantidade de ideias
        </label>
        <input
          type="number"
          min="1"
          max="50"
          value={quantidade}
          onChange={(event) => setQuantidade(event.target.value)}
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white focus:border-violet-500 focus:outline-none"
        />
        <p className="mt-2 text-xs text-zinc-500">
          Use lotes pequenos no MVP para validar qualidade antes de escalar.
        </p>
      </ConfirmDialog>
    </div>
  )
}
