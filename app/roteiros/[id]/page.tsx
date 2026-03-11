'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { use, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ErrorState } from '@/components/ui/error-state'
import {
  type FeedbackTone,
  FeedbackBanner,
} from '@/components/ui/feedback-banner'
import { useAudioDoRoteiro } from '@/lib/hooks/use-assets'
import { useCanais } from '@/lib/hooks/use-core'
import {
  useAtualizarRoteiro,
  useDeletarRoteiro,
  useRoteiro,
} from '@/lib/hooks/use-roteiros'
import type { Database, Json } from '@/lib/supabase/database.types'

type RoteiroUpdate = Database['pulso_content']['Tables']['roteiros']['Update']

interface FeedbackState {
  tone: FeedbackTone
  title: string
  message: string
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

function toRecord(value: unknown): Record<string, Json> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, Json>
  }

  return {}
}

function toStringValue(value: Json | undefined) {
  return typeof value === 'string' ? value : null
}

function toNumberValue(value: Json | undefined) {
  return typeof value === 'number' ? value : 0
}

function toBooleanValue(value: Json | undefined) {
  return typeof value === 'boolean' ? value : undefined
}

function toStringArray(value: Json | undefined) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string')
}

export default function RoteiroDetalhesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: roteiro, isLoading, isError, refetch } = useRoteiro(resolvedParams.id)
  const { data: canais } = useCanais()
  const { data: audio } = useAudioDoRoteiro(resolvedParams.id)

  const atualizarRoteiro = useAtualizarRoteiro()
  const deletarRoteiro = useDeletarRoteiro()

  const [editando, setEditando] = useState(false)
  const [conteudoEditado, setConteudoEditado] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [motivoRejeicao, setMotivoRejeicao] = useState('')
  const [isAprovando, setIsAprovando] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  useEffect(() => {
    if (roteiro?.conteudo_md) {
      setConteudoEditado(roteiro.conteudo_md)
    }
  }, [roteiro])

  const registrarFeedback = (
    tone: FeedbackTone,
    title: string,
    message: string,
  ) => {
    setFeedback({ tone, title, message })
  }

  const handleSalvar = async () => {
    try {
      await atualizarRoteiro.mutateAsync({
        id: resolvedParams.id,
        updates: {
          conteudo_md: conteudoEditado,
        },
      })

      setEditando(false)
      registrarFeedback(
        'success',
        'Roteiro atualizado',
        'As alteracoes foram salvas com sucesso.',
      )
    } catch (error) {
      console.error('Erro ao atualizar roteiro:', error)
      registrarFeedback('error', 'Falha ao salvar', getErrorMessage(error))
    }
  }

  const handleAprovar = async () => {
    setIsAprovando(true)

    try {
      const response = await fetch(`/api/roteiros/${resolvedParams.id}/aprovar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao aprovar roteiro')
      }

      await queryClient.invalidateQueries({ queryKey: ['roteiros'] })
      await queryClient.invalidateQueries({ queryKey: ['roteiros', resolvedParams.id] })
      await queryClient.invalidateQueries({ queryKey: ['audios'] })
      await queryClient.invalidateQueries({
        queryKey: ['audio-roteiro', resolvedParams.id],
      })

      registrarFeedback(
        'success',
        'Roteiro aprovado',
        data.warning
          ? data.warning
          : 'O roteiro foi aprovado e o workflow de audio foi acionado.',
      )
      await refetch()
    } catch (error) {
      console.error('Erro ao aprovar roteiro:', error)
      registrarFeedback('error', 'Falha ao aprovar', getErrorMessage(error))
    } finally {
      setIsAprovando(false)
    }
  }

  const confirmarRejeicao = async () => {
    if (!roteiro) {
      return
    }

    try {
      const metadataAtual = toRecord(roteiro.metadata)
      const updates: RoteiroUpdate = {
        status: 'REVISAO',
        metadata: {
          ...metadataAtual,
          motivo_rejeicao: motivoRejeicao.trim() || 'Nao especificado',
        },
      }

      await atualizarRoteiro.mutateAsync({
        id: resolvedParams.id,
        updates,
      })

      setShowRejectDialog(false)
      setMotivoRejeicao('')
      registrarFeedback(
        'info',
        'Roteiro enviado para revisao',
        'O roteiro voltou para revisao com o motivo informado.',
      )
      await refetch()
    } catch (error) {
      console.error('Erro ao rejeitar roteiro:', error)
      registrarFeedback('error', 'Falha ao rejeitar', getErrorMessage(error))
    }
  }

  const confirmarDelecao = async () => {
    try {
      await deletarRoteiro.mutateAsync(resolvedParams.id)
      router.push('/roteiros')
    } catch (error) {
      console.error('Erro ao deletar roteiro:', error)
      registrarFeedback('error', 'Falha ao deletar', getErrorMessage(error))
    } finally {
      setShowDeleteDialog(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-4xl text-zinc-400">Carregando roteiro...</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-4xl">
          <ErrorState
            title="Erro ao carregar roteiro"
            message="Nao foi possivel carregar os detalhes do roteiro. Tente novamente."
            onRetry={() => refetch()}
          />
          <div className="mt-4">
            <Link href="/roteiros" className="text-violet-400 hover:text-violet-300">
              Voltar para roteiros
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!roteiro) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-zinc-400">Roteiro nao encontrado.</p>
          <Link href="/roteiros" className="text-violet-400 hover:text-violet-300">
            Voltar para roteiros
          </Link>
        </div>
      </div>
    )
  }

  const canal = canais?.find((item) => item.id === roteiro.canal_id)
  const metadata = toRecord(roteiro.metadata)
  const secoes = toRecord(metadata.secoes)
  const validacoes = toRecord(metadata.validacoes)
  const hashtags = toStringArray(metadata.hashtags_sugeridas)
  const palavrasTotal = toNumberValue(metadata.palavras_total)
  const qualityScore = toNumberValue(metadata.quality_score)
  const tomNarrativo = toStringValue(metadata.tom_narrativo)
  const motivoRejeicaoAtual = toStringValue(metadata.motivo_rejeicao)
  const palavrasChave = Array.isArray(roteiro.palavras_chave)
    ? roteiro.palavras_chave.filter(
        (item: unknown): item is string => typeof item === 'string',
      )
    : []

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Link
            href="/roteiros"
            className="mb-4 inline-block text-sm text-violet-400 hover:text-violet-300"
          >
            Voltar para roteiros
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="mb-3 flex items-center gap-3">
                <StatusBadge status={roteiro.status} />
                <span className="text-sm text-zinc-500">
                  {canal?.nome || 'Sem canal'}
                </span>
                <span className="text-sm text-zinc-600">v{roteiro.versao || 1}</span>
              </div>
              <h1 className="mb-2 text-3xl font-bold text-white">
                {roteiro.titulo || 'Sem titulo'}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                {roteiro.duracao_segundos && <span>{roteiro.duracao_segundos}s</span>}
                {palavrasTotal > 0 && <span>{palavrasTotal} palavras</span>}
                {roteiro.created_at && (
                  <span>
                    {new Date(roteiro.created_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
                {roteiro.ideia_id && (
                  <Link
                    href={`/ideias/${roteiro.ideia_id}`}
                    className="text-violet-400 transition-colors hover:text-violet-300"
                  >
                    Ver ideia
                  </Link>
                )}
              </div>

              {audio ? (
                <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-xl">
                        A
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-green-400">
                            Audio gerado
                          </p>
                          <span
                            className={`rounded px-2 py-0.5 text-xs ${
                              audio.status === 'OK'
                                ? 'bg-green-500/20 text-green-400'
                                : audio.status === 'AGUARDANDO_MERGE'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-zinc-700 text-zinc-400'
                            }`}
                          >
                            {audio.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {audio.duracao_segundos}s - {audio.linguagem} -{' '}
                          {audio.metadata?.voice || 'alloy'}
                        </p>
                      </div>
                      {audio.public_url && (
                        <a
                          href={audio.public_url}
                          download
                          className="glass glass-hover rounded-lg px-3 py-2 text-xs text-zinc-400 transition-all hover:text-zinc-300"
                        >
                          Baixar
                        </a>
                      )}
                    </div>

                    {audio.public_url && (
                      <div className="rounded-lg bg-zinc-900/50 p-3">
                        <audio controls className="w-full" preload="metadata">
                          <source src={audio.public_url} type="audio/mpeg" />
                          Seu navegador nao suporta reproducao de audio.
                        </audio>
                      </div>
                    )}
                  </div>
                </div>
              ) : roteiro.status === 'APROVADO' ? (
                <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                  <p className="text-sm font-semibold text-yellow-400">
                    Aguardando geracao de audio
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    O workflow de audio deve processar este roteiro apos a aprovacao.
                  </p>
                </div>
              ) : null}
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {Object.keys(secoes).length > 0 && !editando && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">
                  Estrutura do roteiro
                </h2>
                <div className="space-y-4">
                  {toStringValue(secoes.gancho) && (
                    <SectionPreview
                      label="Gancho"
                      tone="violet"
                      content={toStringValue(secoes.gancho) as string}
                    />
                  )}
                  {toStringValue(secoes.desenvolvimento) && (
                    <SectionPreview
                      label="Desenvolvimento"
                      tone="blue"
                      content={toStringValue(secoes.desenvolvimento) as string}
                    />
                  )}
                  {toStringValue(secoes.climax) && (
                    <SectionPreview
                      label="Climax"
                      tone="yellow"
                      content={toStringValue(secoes.climax) as string}
                    />
                  )}
                  {toStringValue(secoes.cta) && (
                    <SectionPreview
                      label="CTA"
                      tone="green"
                      content={toStringValue(secoes.cta) as string}
                    />
                  )}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-4 text-lg font-semibold text-white">
                {editando ? 'Editando roteiro' : 'Roteiro completo'}
              </h2>

              {editando ? (
                <textarea
                  value={conteudoEditado}
                  onChange={(event) => setConteudoEditado(event.target.value)}
                  rows={20}
                  className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 font-mono text-sm text-white focus:border-violet-500 focus:outline-none"
                  placeholder="Conteudo do roteiro em Markdown..."
                />
              ) : (
                <article
                  className="
                    prose prose-invert prose-sm max-w-none
                    prose-headings:text-white prose-headings:font-semibold
                    prose-h1:text-2xl prose-h1:mb-4 prose-h1:border-b prose-h1:border-zinc-700 prose-h1:pb-2
                    prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-6
                    prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4
                    prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:mb-4
                    prose-strong:text-white prose-strong:font-semibold
                    prose-em:text-zinc-300 prose-em:italic
                    prose-ul:list-disc prose-ul:ml-6 prose-ul:text-zinc-300
                    prose-ol:list-decimal prose-ol:ml-6 prose-ol:text-zinc-300
                    prose-li:mb-1
                    prose-blockquote:border-l-4 prose-blockquote:border-violet-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-zinc-400
                    prose-code:text-violet-400 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                    prose-pre:bg-zinc-800 prose-pre:border prose-pre:border-zinc-700 prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto
                    prose-a:text-violet-400 prose-a:no-underline hover:prose-a:text-violet-300 hover:prose-a:underline
                    prose-hr:border-zinc-700 prose-hr:my-6
                    prose-table:w-full prose-table:border-collapse prose-table:border prose-table:border-zinc-700
                    prose-thead:bg-zinc-800
                    prose-th:border prose-th:border-zinc-700 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-medium
                    prose-td:border prose-td:border-zinc-700 prose-td:px-3 prose-td:py-2
                    prose-img:rounded-lg prose-img:border prose-img:border-zinc-700
                  "
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {roteiro.conteudo_md || '*Sem conteudo*'}
                  </ReactMarkdown>
                </article>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {editando ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
                <h3 className="mb-4 text-sm font-medium text-zinc-400">Acoes</h3>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleSalvar}
                    disabled={atualizarRoteiro.isPending}
                    className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
                  >
                    {atualizarRoteiro.isPending ? 'Salvando...' : 'Salvar alteracoes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditando(false)
                      setConteudoEditado(roteiro.conteudo_md || '')
                    }}
                    className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
                <h3 className="mb-4 text-sm font-medium text-zinc-400">Aprovacao</h3>

                {roteiro.status === 'APROVADO' ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                      <div className="text-sm font-medium text-green-400">
                        Roteiro aprovado
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">
                        O workflow de audio deve seguir a partir deste estado.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRejectDialog(true)}
                      className="w-full rounded-lg bg-red-600/20 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-600/30"
                    >
                      Reverter aprovacao
                    </button>
                  </div>
                ) : roteiro.status === 'REVISAO' ? (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                    <div className="text-sm font-medium text-red-400">
                      Roteiro em revisao
                    </div>
                    {motivoRejeicaoAtual && (
                      <p className="mt-1 text-xs text-zinc-400">
                        Motivo: {motivoRejeicaoAtual}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleAprovar}
                      disabled={isAprovando}
                      className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                      {isAprovando ? 'Aprovando...' : 'Aprovar roteiro'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectDialog(true)}
                      className="w-full rounded-lg bg-red-600/20 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-600/30"
                    >
                      Enviar para revisao
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
              <h3 className="mb-4 text-sm font-medium text-zinc-400">Informacoes</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="mb-1 text-zinc-500">Idioma</div>
                  <div className="text-white">{roteiro.linguagem || 'pt-BR'}</div>
                </div>
                {palavrasChave.length > 0 && (
                  <div>
                    <div className="mb-1 text-zinc-500">Palavras-chave</div>
                    <div className="flex flex-wrap gap-1">
                      {palavrasChave.map((palavra: string) => (
                        <span
                          key={palavra}
                          className="rounded bg-violet-600/20 px-2 py-0.5 text-xs text-violet-300"
                        >
                          {palavra}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="mb-1 text-zinc-500">Criado por</div>
                  <div className="text-white">
                    {roteiro.gerado_por === 'IA' ? 'IA (workflow)' : 'Manual'}
                  </div>
                </div>
              </div>
            </div>

            {Object.keys(metadata).length > 0 && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
                <h3 className="mb-4 text-sm font-medium text-zinc-400">Analise</h3>
                <div className="space-y-3 text-sm">
                  {qualityScore > 0 && (
                    <div>
                      <div className="mb-1 text-zinc-500">Quality score</div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-zinc-800">
                          <div
                            className={`h-2 rounded-full ${
                              qualityScore >= 75
                                ? 'bg-green-500'
                                : qualityScore >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${qualityScore}%` }}
                          />
                        </div>
                        <span className="font-medium text-white">{qualityScore}%</span>
                      </div>
                    </div>
                  )}

                  {tomNarrativo && (
                    <div>
                      <div className="mb-1 text-zinc-500">Tom narrativo</div>
                      <div className="text-white">{tomNarrativo}</div>
                    </div>
                  )}

                  {hashtags.length > 0 && (
                    <div>
                      <div className="mb-1 text-zinc-500">Hashtags sugeridas</div>
                      <div className="flex flex-wrap gap-1">
                        {hashtags.slice(0, 5).map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-blue-600/20 px-2 py-0.5 text-xs text-blue-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.keys(validacoes).length > 0 && (
                    <div>
                      <div className="mb-2 text-zinc-500">Validacoes</div>
                      <div className="space-y-1">
                        <ValidationRow
                          label="Gancho"
                          passed={toBooleanValue(validacoes.tem_gancho)}
                        />
                        <ValidationRow
                          label="Desenvolvimento"
                          passed={toBooleanValue(validacoes.tem_desenvolvimento)}
                        />
                        <ValidationRow
                          label="Climax"
                          passed={toBooleanValue(validacoes.tem_climax)}
                        />
                        <ValidationRow
                          label="CTA"
                          passed={toBooleanValue(validacoes.tem_cta)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        title="Deletar roteiro"
        description="Esta acao remove o roteiro atual. Use apenas se voce tiver certeza."
        confirmLabel="Deletar"
        confirmTone="danger"
        isConfirming={deletarRoteiro.isPending}
        onConfirm={confirmarDelecao}
        onCancel={() => setShowDeleteDialog(false)}
      />

      <ConfirmDialog
        open={showRejectDialog}
        title="Enviar roteiro para revisao"
        description="Registrar um motivo ajuda a rastrear porque este roteiro precisa voltar para revisao."
        confirmLabel="Enviar para revisao"
        confirmTone="danger"
        isConfirming={atualizarRoteiro.isPending}
        onConfirm={confirmarRejeicao}
        onCancel={() => {
          setShowRejectDialog(false)
          setMotivoRejeicao('')
        }}
      >
        <div>
          <label
            htmlFor="motivo-rejeicao-roteiro"
            className="mb-2 block text-sm text-zinc-400"
          >
            Motivo da revisao
          </label>
          <textarea
            id="motivo-rejeicao-roteiro"
            value={motivoRejeicao}
            onChange={(event) => setMotivoRejeicao(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-white"
            placeholder="Explique por que este roteiro nao deve seguir."
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}

function SectionPreview({
  label,
  tone,
  content,
}: {
  label: string
  tone: 'violet' | 'blue' | 'yellow' | 'green'
  content: string
}) {
  const borderClass = {
    violet: 'border-violet-600/50 text-violet-400',
    blue: 'border-blue-600/50 text-blue-400',
    yellow: 'border-yellow-600/50 text-yellow-400',
    green: 'border-green-600/50 text-green-400',
  }[tone]

  return (
    <div>
      <div className={`mb-2 text-xs font-medium uppercase tracking-wide ${borderClass}`}>
        {label}
      </div>
      <div className={`border-l-2 pl-3 text-sm leading-relaxed text-zinc-300 ${borderClass}`}>
        {content}
      </div>
    </div>
  )
}

function ValidationRow({
  label,
  passed,
}: {
  label: string
  passed: boolean | undefined
}) {
  if (passed === undefined) {
    return null
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={passed ? 'text-green-400' : 'text-red-400'}>
        {passed ? 'OK' : 'X'}
      </span>
      <span className="text-zinc-300">{label}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    RASCUNHO: { label: 'Rascunho', color: 'bg-zinc-600' },
    REVISAO: { label: 'Em revisao', color: 'bg-yellow-600' },
    APROVADO: { label: 'Aprovado', color: 'bg-green-600' },
    EM_PRODUCAO: { label: 'Em producao', color: 'bg-purple-600' },
    PRODUCAO: { label: 'Em producao', color: 'bg-purple-600' },
    CONCLUIDO: { label: 'Concluido', color: 'bg-cyan-600' },
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
