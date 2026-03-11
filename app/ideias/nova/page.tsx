'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

import { ErrorState } from '@/components/ui/error-state'
import {
  type FeedbackTone,
  FeedbackBanner,
} from '@/components/ui/feedback-banner'
import { useCanais, useSeriesPorCanal } from '@/lib/hooks/use-core'
import { useCriarIdeia } from '@/lib/hooks/use-ideias'
import type { Database } from '@/lib/supabase/database.types'

type Canal = Database['pulso_core']['Tables']['canais']['Row']
type Serie = Database['pulso_core']['Tables']['series']['Row']
type IdeiaInsert = Database['pulso_content']['Tables']['ideias']['Insert']
type IdeiaStatus = Database['pulso_content']['Tables']['ideias']['Row']['status']

interface FeedbackState {
  tone: FeedbackTone
  title: string
  message: string
}

interface FormState {
  titulo: string
  descricao: string
  canal_id: string
  serie_id: string
  prioridade: number
  origem: string
  tags: string[]
  linguagem: string
}

const initialFormData: FormState = {
  titulo: '',
  descricao: '',
  canal_id: '',
  serie_id: '',
  prioridade: 5,
  origem: 'MANUAL',
  tags: [],
  linguagem: 'pt-BR',
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

  return 'Nao foi possivel criar a ideia agora.'
}

function NovaIdeiaPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: canais, isError, refetch } = useCanais()
  const canalPreSelecionado = searchParams.get('canal') ?? ''
  const [canalSelecionado, setCanalSelecionado] = useState(canalPreSelecionado)
  const { data: series } = useSeriesPorCanal(canalSelecionado || null)
  const criarIdeia = useCriarIdeia()

  const [formData, setFormData] = useState<FormState>(() => ({
    ...initialFormData,
    canal_id: canalPreSelecionado,
  }))
  const [tagInput, setTagInput] = useState('')
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  const registrarFeedback = (
    tone: FeedbackTone,
    title: string,
    message: string,
  ) => {
    setFeedback({ tone, title, message })
  }

  const handleSubmit = async (status: Extract<IdeiaStatus, 'RASCUNHO' | 'APROVADA'>) => {
    const titulo = formData.titulo.trim()
    const descricao = formData.descricao.trim()

    if (!titulo || !descricao) {
      registrarFeedback(
        'error',
        'Campos obrigatorios',
        'Preencha titulo e descricao antes de salvar a ideia.',
      )
      return
    }

    const payload: IdeiaInsert = {
      titulo,
      descricao,
      canal_id: formData.canal_id || null,
      serie_id: formData.serie_id || null,
      prioridade: formData.prioridade,
      origem: formData.origem,
      status,
      tags: formData.tags,
      linguagem: formData.linguagem,
      criado_por: null,
      metadata: {
        tipo_formato: 'curiosidade_rapida',
        duracao_alvo: 30,
      },
    }

    try {
      await criarIdeia.mutateAsync(payload)
      router.push('/ideias')
    } catch (error) {
      console.error('Erro ao criar ideia:', error)
      registrarFeedback('error', 'Falha ao criar ideia', getErrorMessage(error))
    }
  }

  const adicionarTag = () => {
    const tag = tagInput.trim()

    if (!tag || formData.tags.includes(tag)) {
      return
    }

    setFormData({
      ...formData,
      tags: [...formData.tags, tag],
    })
    setTagInput('')
  }

  const removerTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((item) => item !== tag),
    })
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-7xl">
          <ErrorState
            title="Erro ao carregar dados"
            message="Nao foi possivel carregar os canais necessarios para criar uma nova ideia."
            onRetry={() => refetch()}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 animate-fade-in">
          <Link
            href="/ideias"
            className="mb-4 flex w-fit items-center gap-2 rounded-lg px-4 py-2 text-sm text-yellow-400 transition-colors hover:text-yellow-300"
          >
            Voltar para ideias
          </Link>
          <div className="mb-2 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse-glow" />
            <h1 className="text-4xl font-black bg-linear-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Nova Ideia
            </h1>
          </div>
          <p className="text-zinc-400">
            Crie uma nova ideia de conteudo para os canais PULSO.
          </p>
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

        <form
          className="space-y-6 animate-fade-in"
          style={{ animationDelay: '100ms' }}
          onSubmit={(event) => event.preventDefault()}
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Titulo da ideia *
            </label>
            <input
              type="text"
              required
              value={formData.titulo}
              onChange={(event) =>
                setFormData({ ...formData, titulo: event.target.value })
              }
              placeholder="Ex: O misterio do triangulo das Bermudas"
              className="w-full rounded-lg border border-zinc-800/50 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-500 transition-all focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Descricao *
            </label>
            <textarea
              required
              value={formData.descricao}
              onChange={(event) =>
                setFormData({ ...formData, descricao: event.target.value })
              }
              placeholder="Descreva a ideia com detalhes. O que sera abordado? Qual o gancho? Quais fatos interessantes?"
              rows={6}
              className="w-full resize-none rounded-lg border border-zinc-800/50 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-500 transition-all focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Quanto mais detalhada, melhor sera a base para o roteiro.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Canal
              </label>
              <select
                value={formData.canal_id}
                onChange={(event) => {
                  setFormData({
                    ...formData,
                    canal_id: event.target.value,
                    serie_id: '',
                  })
                  setCanalSelecionado(event.target.value)
                }}
                className="w-full rounded-lg border border-zinc-800/50 bg-zinc-950 px-4 py-3 text-white transition-all focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
              >
                <option value="">Selecione um canal</option>
                {canais?.map((canal: Canal) => (
                  <option key={canal.id} value={canal.id}>
                    {canal.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Serie
              </label>
              <select
                value={formData.serie_id}
                onChange={(event) =>
                  setFormData({ ...formData, serie_id: event.target.value })
                }
                disabled={!canalSelecionado}
                className="w-full rounded-lg border border-zinc-800/50 bg-zinc-950 px-4 py-3 text-white transition-all focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecione uma serie</option>
                {series?.map((serie: Serie) => (
                  <option key={serie.id} value={serie.id}>
                    {serie.nome}
                  </option>
                ))}
              </select>
              {!canalSelecionado && (
                <p className="mt-1 text-xs text-zinc-500">
                  Selecione um canal primeiro.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Prioridade (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.prioridade}
                onChange={(event) => {
                  const nextValue = Number.parseInt(event.target.value, 10)
                  setFormData({
                    ...formData,
                    prioridade: Number.isNaN(nextValue)
                      ? 1
                      : Math.min(10, Math.max(1, nextValue)),
                  })
                }}
                className="w-full rounded-lg border border-zinc-800/50 bg-zinc-950 px-4 py-3 text-white transition-all focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
              />
              <p className="mt-1 text-xs text-zinc-500">
                1 = baixa, 10 = urgente.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Origem
              </label>
              <select
                value={formData.origem}
                onChange={(event) =>
                  setFormData({ ...formData, origem: event.target.value })
                }
                className="w-full rounded-lg border border-zinc-800/50 bg-zinc-950 px-4 py-3 text-white transition-all focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
              >
                <option value="MANUAL">Manual</option>
                <option value="IA">IA automatica</option>
                <option value="FEEDBACK">Feedback de metricas</option>
                <option value="TRENDING">Trending topics</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Tags
            </label>
            <div className="mb-2 flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    adicionarTag()
                  }
                }}
                placeholder="Digite uma tag e pressione Enter"
                className="flex-1 rounded-lg border border-zinc-800/50 bg-zinc-950 px-4 py-2 text-white placeholder-zinc-500 transition-all focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/20"
              />
              <button
                type="button"
                onClick={adicionarTag}
                className="rounded-lg bg-zinc-800 px-6 py-2 text-white transition-colors hover:bg-zinc-700"
              >
                Adicionar
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-sm text-yellow-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removerTag(tag)}
                      className="text-yellow-100 transition-colors hover:text-white"
                      aria-label={`Remover tag ${tag}`}
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4 border-t border-zinc-800/50 pt-6">
            <button
              type="button"
              onClick={() => handleSubmit('RASCUNHO')}
              disabled={criarIdeia.isPending}
              className="flex-1 rounded-lg bg-zinc-800 px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {criarIdeia.isPending ? 'Salvando...' : 'Salvar como rascunho'}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('APROVADA')}
              disabled={criarIdeia.isPending}
              className="flex-1 rounded-lg bg-linear-to-r from-yellow-600 to-orange-600 px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {criarIdeia.isPending ? 'Salvando...' : 'Salvar e aprovar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="h-10 w-64 animate-pulse rounded bg-zinc-800" />
      </div>
    </div>
  )
}

export default function NovaIdeiaPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <NovaIdeiaPageContent />
    </Suspense>
  )
}
