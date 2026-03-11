'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { use, useEffect, useState } from 'react'

import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ErrorState } from '@/components/ui/error-state'
import {
  type FeedbackTone,
  FeedbackBanner,
} from '@/components/ui/feedback-banner'
import { useCanais } from '@/lib/hooks/use-core'
import {
  useAtualizarIdeia,
  useDeletarIdeia,
  useIdeia,
} from '@/lib/hooks/use-ideias'
import { useRoteirosPorIdeia } from '@/lib/hooks/use-roteiros'
import type { Database, Json } from '@/lib/supabase/database.types'

type IdeiaRow = Database['pulso_content']['Tables']['ideias']['Row']
type IdeiaUpdate = Database['pulso_content']['Tables']['ideias']['Update']
type IdeiaStatus = IdeiaRow['status']

interface FeedbackState {
  tone: FeedbackTone
  title: string
  message: string
}

interface IdeiaFormState {
  titulo: string
  descricao: string
  prioridade: number
  status: IdeiaStatus
  canal_id: string
  serie_id: string
  tags: string[]
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

  return 'Falha inesperada. Revise os logs e tente novamente.'
}

function buildIdeiaFormState(ideia: IdeiaRow): IdeiaFormState {
  return {
    titulo: ideia.titulo || '',
    descricao: ideia.descricao || '',
    prioridade: ideia.prioridade || 5,
    status: ideia.status || 'RASCUNHO',
    canal_id: ideia.canal_id || '',
    serie_id: ideia.serie_id || '',
    tags: Array.isArray(ideia.tags)
      ? ideia.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
  }
}

export default function IdeiaDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: ideia, isLoading, isError, refetch } = useIdeia(resolvedParams.id)
  const { data: canais } = useCanais()
  const { data: roteiros } = useRoteirosPorIdeia(resolvedParams.id)

  const atualizarIdeia = useAtualizarIdeia()
  const deletarIdeia = useDeletarIdeia()

  const [editando, setEditando] = useState(false)
  const [isGerandoRoteiro, setIsGerandoRoteiro] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [motivoRejeicao, setMotivoRejeicao] = useState('')
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [formData, setFormData] = useState<IdeiaFormState>({
    titulo: '',
    descricao: '',
    prioridade: 5,
    status: 'RASCUNHO',
    canal_id: '',
    serie_id: '',
    tags: [],
  })

  useEffect(() => {
    if (ideia) {
      setFormData(buildIdeiaFormState(ideia))
    }
  }, [ideia])

  const registrarFeedback = (
    tone: FeedbackTone,
    title: string,
    message: string,
  ) => {
    setFeedback({ tone, title, message })
  }

  const handleSalvar = async () => {
    try {
      const updates: IdeiaUpdate = {
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        prioridade: formData.prioridade,
        status: formData.status,
        canal_id: formData.canal_id || null,
        serie_id: formData.serie_id || null,
        tags: formData.tags,
      }

      await atualizarIdeia.mutateAsync({
        id: resolvedParams.id,
        updates,
      })

      setEditando(false)
      registrarFeedback(
        'success',
        'Ideia atualizada',
        'As alteracoes foram salvas com sucesso.',
      )
    } catch (error) {
      console.error('Erro ao atualizar ideia:', error)
      registrarFeedback('error', 'Falha ao salvar', getErrorMessage(error))
    }
  }

  const handleAprovar = async () => {
    try {
      await atualizarIdeia.mutateAsync({
        id: resolvedParams.id,
        updates: { status: 'APROVADA' },
      })

      registrarFeedback(
        'success',
        'Ideia aprovada',
        'A ideia foi aprovada e ja pode seguir para roteiro.',
      )
      await refetch()
    } catch (error) {
      console.error('Erro ao aprovar ideia:', error)
      registrarFeedback('error', 'Falha ao aprovar', getErrorMessage(error))
    }
  }

  const handleGerarRoteiro = async () => {
    setIsGerandoRoteiro(true)

    try {
      const response = await fetch(`/api/ideias/${resolvedParams.id}/gerar-roteiro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar roteiro')
      }

      await queryClient.invalidateQueries({ queryKey: ['roteiros'] })
      await queryClient.invalidateQueries({
        queryKey: ['roteiros', 'ideia', resolvedParams.id],
      })
      await queryClient.invalidateQueries({ queryKey: ['ideias', resolvedParams.id] })

      registrarFeedback(
        'success',
        'Workflow acionado',
        data.roteiro_id
          ? `Roteiro criado com sucesso. ID: ${data.roteiro_id}.`
          : 'O workflow de roteiro foi disparado com sucesso.',
      )
    } catch (error) {
      console.error('Erro ao gerar roteiro:', error)
      registrarFeedback('error', 'Falha ao gerar roteiro', getErrorMessage(error))
    } finally {
      setIsGerandoRoteiro(false)
    }
  }

  const confirmarDelecao = async () => {
    try {
      await deletarIdeia.mutateAsync(resolvedParams.id)
      router.push('/ideias')
    } catch (error) {
      console.error('Erro ao deletar ideia:', error)
      registrarFeedback('error', 'Falha ao deletar', getErrorMessage(error))
    } finally {
      setShowDeleteDialog(false)
    }
  }

  const confirmarRejeicao = async () => {
    if (!ideia) {
      return
    }

    try {
      const metadataAtual =
        typeof ideia.metadata === 'object' &&
        ideia.metadata !== null &&
        !Array.isArray(ideia.metadata)
          ? (ideia.metadata as Record<string, Json>)
          : {}

      const updates: IdeiaUpdate = {
        status: 'ARQUIVADA',
        metadata: {
          ...metadataAtual,
          motivo_rejeicao: motivoRejeicao.trim() || 'Nao especificado',
        },
      }

      await atualizarIdeia.mutateAsync({
        id: resolvedParams.id,
        updates,
      })

      setShowRejectDialog(false)
      setMotivoRejeicao('')
      registrarFeedback(
        'info',
        'Ideia arquivada',
        'A ideia foi arquivada com o motivo informado.',
      )
      await refetch()
    } catch (error) {
      console.error('Erro ao rejeitar ideia:', error)
      registrarFeedback('error', 'Falha ao rejeitar', getErrorMessage(error))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-4xl text-zinc-400">Carregando ideia...</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-4xl">
          <ErrorState
            title="Erro ao carregar ideia"
            message="Nao foi possivel carregar os detalhes da ideia. Tente novamente."
            onRetry={() => refetch()}
          />
          <div className="mt-4">
            <Link href="/ideias" className="text-violet-400 hover:text-violet-300">
              Voltar para ideias
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!ideia) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-zinc-400">Ideia nao encontrada.</p>
          <Link href="/ideias" className="text-violet-400 hover:text-violet-300">
            Voltar para ideias
          </Link>
        </div>
      </div>
    )
  }

  const canal = canais?.find((item) => item.id === ideia.canal_id)
  const roteirosRelacionados = roteiros || []
  const hasRoteiro = roteirosRelacionados.length > 0

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link
            href="/ideias"
            className="mb-4 inline-block text-sm text-violet-400 hover:text-violet-300"
          >
            Voltar para ideias
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-white">
                {editando ? (
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        titulo: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-white"
                  />
                ) : (
                  ideia.titulo
                )}
              </h1>
              <div className="flex items-center gap-3">
                <StatusBadge status={editando ? formData.status : ideia.status} />
                <span className="text-sm text-zinc-500">
                  {canal?.nome || 'Sem canal'}
                </span>
              </div>
            </div>

            {!editando && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-700"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(true)}
                  className="rounded-lg bg-red-600/20 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-600/30"
                >
                  Deletar
                </button>
              </div>
            )}
          </div>
        </div>

        {feedback && (
          <FeedbackBanner
            tone={feedback.tone}
            title={feedback.title}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        )}

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-medium text-zinc-400">Descricao</h3>
            {editando ? (
              <textarea
                value={formData.descricao}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    descricao: event.target.value,
                  }))
                }
                rows={6}
                className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white"
              />
            ) : (
              <p className="whitespace-pre-wrap text-white">{ideia.descricao}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-6 md:grid-cols-4">
            <div>
              <div className="mb-1 text-xs text-zinc-500">Prioridade</div>
              {editando ? (
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.prioridade}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      prioridade: Number.parseInt(event.target.value || '0', 10),
                    }))
                  }
                  className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-white"
                />
              ) : (
                <div className="font-medium text-white">{ideia.prioridade}/10</div>
              )}
            </div>

            <div>
              <div className="mb-1 text-xs text-zinc-500">Origem</div>
              <div className="font-medium text-white">{ideia.origem || 'Manual'}</div>
            </div>

            <div>
              <div className="mb-1 text-xs text-zinc-500">Criado em</div>
              <div className="font-medium text-white">
                {ideia.created_at
                  ? new Date(ideia.created_at).toLocaleDateString('pt-BR')
                  : '-'}
              </div>
            </div>

            <div>
              <div className="mb-1 text-xs text-zinc-500">Atualizado em</div>
              <div className="font-medium text-white">
                {ideia.updated_at
                  ? new Date(ideia.updated_at).toLocaleDateString('pt-BR')
                  : '-'}
              </div>
            </div>
          </div>

          {ideia.tags && ideia.tags.length > 0 && (
            <div className="mt-6 border-t border-zinc-800 pt-6">
              <div className="mb-2 text-xs text-zinc-500">Tags</div>
              <div className="flex flex-wrap gap-2">
                {ideia.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-violet-600/20 px-3 py-1 text-sm text-violet-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {editando ? (
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleSalvar}
              disabled={atualizarIdeia.isPending}
              className="flex-1 rounded-lg bg-violet-600 px-6 py-3 font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
            >
              {atualizarIdeia.isPending ? 'Salvando...' : 'Salvar alteracoes'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditando(false)
                setFormData(buildIdeiaFormState(ideia))
              }}
              className="rounded-lg bg-zinc-800 px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {ideia.status === 'RASCUNHO' && (
              <button
                type="button"
                onClick={handleAprovar}
                disabled={atualizarIdeia.isPending}
                className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {atualizarIdeia.isPending ? 'Aprovando...' : 'Aprovar ideia'}
              </button>
            )}

            {ideia.status !== 'ARQUIVADA' && (
              <button
                type="button"
                onClick={() => setShowRejectDialog(true)}
                className="rounded-lg bg-red-600/20 px-6 py-3 font-medium text-red-400 transition-colors hover:bg-red-600/30"
              >
                Arquivar ideia
              </button>
            )}
          </div>
        )}

        {ideia.status === 'APROVADA' && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Roteiros</h3>

            {!hasRoteiro ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  Nenhum roteiro gerado ainda. Use o workflow para criar a primeira
                  versao.
                </p>
                <button
                  type="button"
                  onClick={handleGerarRoteiro}
                  disabled={isGerandoRoteiro}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {isGerandoRoteiro ? 'Gerando roteiro...' : 'Gerar roteiro'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {roteirosRelacionados.map((roteiro) => (
                  <Link
                    key={roteiro.id}
                    href={`/roteiros/${roteiro.id}`}
                    className="block rounded-lg border border-zinc-700 bg-zinc-800 p-4 transition-colors hover:bg-zinc-700"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white">{roteiro.titulo}</h4>
                        <p className="mt-1 text-sm text-zinc-400">
                          Criado em{' '}
                          {new Date(roteiro.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <StatusBadge status={roteiro.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        title="Deletar ideia"
        description="Esta acao remove a ideia atual. Use apenas se voce tiver certeza."
        confirmLabel="Deletar"
        confirmTone="danger"
        isConfirming={deletarIdeia.isPending}
        onConfirm={confirmarDelecao}
        onCancel={() => setShowDeleteDialog(false)}
      />

      <ConfirmDialog
        open={showRejectDialog}
        title="Arquivar ideia"
        description="Registrar um motivo ajuda a manter historico e contexto editorial. No banco, este fluxo usa o status ARQUIVADA."
        confirmLabel="Arquivar"
        confirmTone="danger"
        isConfirming={atualizarIdeia.isPending}
        onConfirm={confirmarRejeicao}
        onCancel={() => {
          setShowRejectDialog(false)
          setMotivoRejeicao('')
        }}
      >
        <div>
          <label
            htmlFor="motivo-rejeicao-ideia"
            className="mb-2 block text-sm text-zinc-400"
          >
            Motivo do arquivamento
          </label>
          <textarea
            id="motivo-rejeicao-ideia"
            value={motivoRejeicao}
            onChange={(event) => setMotivoRejeicao(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white"
            placeholder="Descreva por que esta ideia nao deve seguir."
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    RASCUNHO: { label: 'Rascunho', color: 'bg-zinc-600' },
    NOVA: { label: 'Nova', color: 'bg-blue-600' },
    EM_ANALISE: { label: 'Em analise', color: 'bg-yellow-600' },
    APROVADA: { label: 'Aprovada', color: 'bg-green-600' },
    EM_PRODUCAO: { label: 'Em producao', color: 'bg-purple-600' },
    ARQUIVADA: { label: 'Arquivada', color: 'bg-zinc-500' },
  }

  const config = status
    ? statusConfig[status]
    : { label: 'Indefinido', color: 'bg-zinc-600' }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${config.color}`}
    >
      {config.label}
    </span>
  )
}
