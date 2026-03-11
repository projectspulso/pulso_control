'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Instagram,
  Music2,
  Sparkles,
  X,
  Youtube,
} from 'lucide-react'
import { useState } from 'react'

import { ErrorState } from '@/components/ui/error-state'
import { useConteudosProntos } from '@/lib/hooks/use-calendario'
import { useAgendarPublicacao, usePublicarAgora } from '@/lib/hooks/use-n8n'

type FeedbackTone = 'success' | 'error' | 'info'

interface FeedbackState {
  tone: FeedbackTone
  title: string
  description: string
}

const PLATAFORMAS_ASSISTIDAS = ['tiktok', 'youtube', 'instagram']

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

  return 'Falha inesperada. Revise o workflow e as credenciais configuradas.'
}

function getFeedbackClasses(tone: FeedbackTone) {
  if (tone === 'success') {
    return 'border-green-500/30 bg-green-500/10 text-green-100'
  }

  if (tone === 'error') {
    return 'border-red-500/30 bg-red-500/10 text-red-100'
  }

  return 'border-blue-500/30 bg-blue-500/10 text-blue-100'
}

export default function PublicarPage() {
  const { data: conteudos, isLoading, isError, refetch } = useConteudosProntos()
  const publicarAgora = usePublicarAgora()
  const agendarPublicacao = useAgendarPublicacao()

  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [mostrarModalAgendar, setMostrarModalAgendar] = useState(false)
  const [mostrarModalPublicar, setMostrarModalPublicar] = useState(false)
  const [dataAgendamento, setDataAgendamento] = useState('')
  const [horaAgendamento, setHoraAgendamento] = useState('')
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  const totalConteudos = conteudos?.length ?? 0
  const selecionouTodos = totalConteudos > 0 && selecionados.size === totalConteudos

  const toggleSelecao = (id: string) => {
    const novos = new Set(selecionados)

    if (novos.has(id)) {
      novos.delete(id)
    } else {
      novos.add(id)
    }

    setSelecionados(novos)
  }

  const selecionarTodos = () => {
    if (!conteudos || conteudos.length === 0) {
      return
    }

    if (selecionouTodos) {
      setSelecionados(new Set())
      return
    }

    setSelecionados(new Set(conteudos.map((conteudo) => conteudo.pipeline_id)))
  }

  const abrirAgendamento = (pipelineId?: string) => {
    if (pipelineId) {
      setSelecionados(new Set([pipelineId]))
    }

    setFeedback(null)
    setMostrarModalAgendar(true)
  }

  const abrirPublicacaoAssistida = (pipelineId?: string) => {
    if (pipelineId) {
      setSelecionados(new Set([pipelineId]))
    }

    setFeedback(null)
    setMostrarModalPublicar(true)
  }

  const fecharModalAgendar = () => {
    if (agendarPublicacao.isPending) {
      return
    }

    setMostrarModalAgendar(false)
    setDataAgendamento('')
    setHoraAgendamento('')
  }

  const fecharModalPublicar = () => {
    if (publicarAgora.isPending) {
      return
    }

    setMostrarModalPublicar(false)
  }

  const confirmarPublicacaoAssistida = async () => {
    if (selecionados.size === 0) {
      setFeedback({
        tone: 'error',
        title: 'Nada selecionado',
        description: 'Selecione pelo menos um conteudo antes de enviar para a fila assistida.',
      })
      return
    }

    try {
      await publicarAgora.mutateAsync({
        pipelineIds: Array.from(selecionados),
        plataformas: PLATAFORMAS_ASSISTIDAS,
      })

      setFeedback({
        tone: 'success',
        title: 'Fila assistida acionada',
        description: `${selecionados.size} conteudo(s) enviado(s) para a fila assistida de publicacao.`,
      })
      setSelecionados(new Set())
      setMostrarModalPublicar(false)
    } catch (error) {
      console.error('Erro ao enviar para publicacao assistida:', error)
      setFeedback({
        tone: 'error',
        title: 'Falha ao acionar a fila',
        description: getErrorMessage(error),
      })
    }
  }

  const confirmarAgendamento = async () => {
    if (!dataAgendamento || !horaAgendamento) {
      setFeedback({
        tone: 'error',
        title: 'Data e hora obrigatorias',
        description: 'Preencha os dois campos antes de agendar a fila assistida.',
      })
      return
    }

    if (selecionados.size === 0) {
      setFeedback({
        tone: 'error',
        title: 'Nada selecionado',
        description: 'Selecione pelo menos um conteudo antes de agendar.',
      })
      return
    }

    const dataHora = `${dataAgendamento}T${horaAgendamento}:00`

    try {
      for (const pipelineId of Array.from(selecionados)) {
        await agendarPublicacao.mutateAsync({
          pipelineId,
          dataHora,
          plataformas: PLATAFORMAS_ASSISTIDAS,
        })
      }

      setFeedback({
        tone: 'success',
        title: 'Fila assistida agendada',
        description: `${selecionados.size} conteudo(s) agendado(s) para ${format(
          new Date(dataHora),
          "dd/MM/yyyy 'as' HH:mm",
          { locale: ptBR },
        )}.`,
      })
      setSelecionados(new Set())
      setMostrarModalAgendar(false)
      setDataAgendamento('')
      setHoraAgendamento('')
    } catch (error) {
      console.error('Erro ao agendar publicacao assistida:', error)
      setFeedback({
        tone: 'error',
        title: 'Falha ao agendar',
        description: getErrorMessage(error),
      })
    }
  }

  const getIconePlataforma = (canal: string) => {
    const nome = canal.toLowerCase()

    if (nome.includes('youtube')) {
      return <Youtube className="h-4 w-4 text-red-500" />
    }

    if (nome.includes('instagram') || nome.includes('reels')) {
      return <Instagram className="h-4 w-4 text-pink-500" />
    }

    if (nome.includes('tiktok')) {
      return <Music2 className="h-4 w-4 text-cyan-500" />
    }

    return <Sparkles className="h-4 w-4 text-violet-500" />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="glass rounded-2xl p-8 text-center space-y-4">
            <div className="skeleton h-8 w-48 mx-auto" />
            <div className="skeleton h-4 w-64 mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-7xl">
          <ErrorState
            title="Erro ao carregar conteudos"
            message="Nao foi possivel carregar os conteudos prontos para publicacao. Tente novamente."
            onRetry={() => refetch()}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 animate-fade-in lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-3 bg-linear-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text text-4xl font-black text-transparent">
              <Sparkles className="h-9 w-9 text-green-400" />
              Publicacao Assistida
            </h1>
            <p className="mt-2 flex items-center gap-2 text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              {totalConteudos} conteudo(s) pronto(s) para envio a fila assistida
            </p>
          </div>

          {selecionados.size > 0 && (
            <div className="flex flex-wrap gap-3 animate-slide-in-right">
              <button
                type="button"
                onClick={() => abrirAgendamento()}
                disabled={agendarPublicacao.isPending}
                className="glass glass-hover rounded-xl border-violet-500/50 bg-linear-to-r from-violet-600 to-purple-600 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {agendarPublicacao.isPending
                    ? 'Agendando fila...'
                    : `Agendar ${selecionados.size}`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => abrirPublicacaoAssistida()}
                disabled={publicarAgora.isPending}
                className="glass glass-hover rounded-xl border-green-500/50 bg-linear-to-r from-green-600 to-emerald-600 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-green-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {publicarAgora.isPending ? 'Enviando fila...' : 'Enviar agora'}
                </span>
              </button>
            </div>
          )}
        </div>

        {feedback && (
          <div className={`rounded-2xl border p-4 ${getFeedbackClasses(feedback.tone)}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold">{feedback.title}</h2>
                <p className="mt-1 text-sm opacity-90">{feedback.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="rounded-lg p-1 text-current/80 transition hover:bg-white/10 hover:text-current"
                aria-label="Fechar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-4 animate-fade-in md:grid-cols-2 xl:grid-cols-4">
          <div className="glass glass-hover group relative overflow-hidden rounded-2xl p-6">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-green-600/20 blur-2xl opacity-0 transition-all duration-500 group-hover:opacity-100" />
            <div className="mb-2 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm text-zinc-400">Prontos</span>
            </div>
            <p className="text-3xl font-bold text-white">{totalConteudos}</p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <div className="mb-2 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-zinc-400">Agendados</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {conteudos?.filter((conteudo) => conteudo.data_publicacao_planejada).length || 0}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <div className="mb-2 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <span className="text-sm text-zinc-400">Selecionados</span>
            </div>
            <p className="text-3xl font-bold text-white">{selecionados.size}</p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <div className="mb-2 flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-sm text-zinc-400">Hoje</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {conteudos?.filter((conteudo) => {
                if (!conteudo.data_publicacao_planejada) {
                  return false
                }

                return (
                  new Date(conteudo.data_publicacao_planejada).toDateString() ===
                  new Date().toDateString()
                )
              }).length || 0}
            </p>
          </div>
        </div>

        {!conteudos || conteudos.length === 0 ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-zinc-700" />
            <h3 className="mb-2 text-xl font-bold text-white">Nenhum conteudo pronto</h3>
            <p className="mb-4 text-zinc-500">
              Ainda nao ha conteudos marcados como PRONTO_PUBLICACAO.
            </p>
            <Link
              href="/producao"
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-white transition-colors hover:bg-violet-700"
            >
              Ir para pipeline
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
            <div className="border-b border-zinc-800 bg-zinc-900/50">
              <div className="grid grid-cols-12 gap-4 p-4 text-sm font-semibold text-zinc-400">
                <div className="col-span-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={selecionouTodos}
                    onChange={selecionarTodos}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 focus:ring-violet-500"
                    aria-label="Selecionar todos os conteudos"
                  />
                </div>
                <div className="col-span-5">Titulo</div>
                <div className="col-span-2">Canal</div>
                <div className="col-span-2">Data e hora</div>
                <div className="col-span-1">Prioridade</div>
                <div className="col-span-1 text-right">Acoes</div>
              </div>
            </div>

            <div className="divide-y divide-zinc-800">
              {conteudos.map((conteudo) => {
                const selecionado = selecionados.has(conteudo.pipeline_id)
                const prioridade = conteudo.prioridade ?? 5

                return (
                  <div
                    key={conteudo.pipeline_id}
                    className={`grid grid-cols-12 gap-4 p-4 transition-colors hover:bg-zinc-800/50 ${
                      selecionado ? 'bg-violet-600/10' : ''
                    }`}
                  >
                    <div className="col-span-1 flex items-center">
                      <input
                        type="checkbox"
                        checked={selecionado}
                        onChange={() => toggleSelecao(conteudo.pipeline_id)}
                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 focus:ring-violet-500"
                        aria-label={`Selecionar ${conteudo.ideia}`}
                      />
                    </div>

                    <div className="col-span-5 flex items-center gap-3">
                      <div className="flex-1">
                        <h3 className="line-clamp-1 font-medium text-white">{conteudo.ideia}</h3>
                        {conteudo.serie && (
                          <p className="mt-1 text-xs text-zinc-500">
                            Serie: {conteudo.serie}
                          </p>
                        )}
                      </div>
                      {conteudo.is_piloto && (
                        <span className="rounded-full bg-purple-600/20 px-2 py-1 text-xs text-purple-400">
                          Piloto
                        </span>
                      )}
                    </div>

                    <div className="col-span-2 flex items-center gap-2">
                      {getIconePlataforma(conteudo.canal)}
                      <span className="line-clamp-1 text-sm text-zinc-300">
                        {conteudo.canal}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center gap-2 text-sm text-zinc-400">
                      {conteudo.data_publicacao_planejada ? (
                        <>
                          <Calendar className="h-4 w-4 text-blue-400" />
                          <div>
                            <div className="text-white">
                              {format(
                                new Date(conteudo.data_publicacao_planejada),
                                'dd/MM/yyyy',
                                { locale: ptBR },
                              )}
                            </div>
                            {conteudo.hora_publicacao && (
                              <div className="text-xs text-zinc-500">
                                {conteudo.hora_publicacao.substring(0, 5)}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <span className="text-zinc-500">Sem data</span>
                      )}
                    </div>

                    <div className="col-span-1 flex items-center">
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          prioridade >= 8
                            ? 'bg-red-600/20 text-red-400'
                            : prioridade >= 5
                              ? 'bg-yellow-600/20 text-yellow-400'
                              : 'bg-zinc-700/20 text-zinc-400'
                        }`}
                      >
                        P{prioridade}
                      </span>
                    </div>

                    <div className="col-span-1 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => abrirAgendamento(conteudo.pipeline_id)}
                        className="rounded-lg p-2 text-violet-400 transition-colors hover:bg-violet-600/10"
                        aria-label={`Agendar ${conteudo.ideia}`}
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => abrirPublicacaoAssistida(conteudo.pipeline_id)}
                        className="rounded-lg p-2 text-green-400 transition-colors hover:bg-green-600/10"
                        aria-label={`Enviar ${conteudo.ideia} para publicacao assistida`}
                      >
                        <Sparkles className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {conteudos && conteudos.length > 0 && (
          <div className="rounded-lg border border-blue-600/20 bg-blue-600/10 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-blue-400" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-blue-300">
                  Operacao assistida, nao autopost irrestrito
                </h4>
                <p className="text-sm text-zinc-300">
                  Esta tela envia itens para a fila de publicacao e para os workflows do n8n.
                </p>
                <p className="text-sm text-zinc-400">
                  Validacao final de conta, plataforma, credenciais e elegibilidade continua sendo humana.
                </p>
              </div>
            </div>
          </div>
        )}

        {mostrarModalPublicar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 animate-fade-in">
              <h3 className="text-xl font-bold text-white">Enviar para fila assistida</h3>
              <p className="mt-3 text-sm text-zinc-400">
                Voce esta enviando {selecionados.size} conteudo(s) para a fila assistida.
              </p>
              <p className="mt-3 text-sm text-zinc-500">
                O disparo passa pelos workflows e pelas plataformas configuradas, mas a validacao final continua operacional.
              </p>

              <div className="mt-4 rounded-lg border border-green-600/20 bg-green-600/10 p-3 text-xs text-green-300">
                Plataformas alvo: {PLATAFORMAS_ASSISTIDAS.join(', ')}.
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={fecharModalPublicar}
                  className="flex-1 rounded-lg bg-zinc-800 px-4 py-2 text-white transition-colors hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarPublicacaoAssistida}
                  disabled={publicarAgora.isPending}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {publicarAgora.isPending ? 'Enviando...' : 'Confirmar envio'}
                </button>
              </div>
            </div>
          </div>
        )}

        {mostrarModalAgendar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 animate-fade-in">
              <h3 className="text-xl font-bold text-white">Agendar fila assistida</h3>

              <p className="mb-6 mt-3 text-sm text-zinc-400">
                Agendando {selecionados.size} conteudo(s) para a fila assistida de publicacao.
              </p>

              <div className="mb-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-zinc-400" htmlFor="data-agendamento">
                    Data
                  </label>
                  <input
                    id="data-agendamento"
                    type="date"
                    value={dataAgendamento}
                    onChange={(event) => setDataAgendamento(event.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-400" htmlFor="hora-agendamento">
                    Hora
                  </label>
                  <input
                    id="hora-agendamento"
                    type="time"
                    value={horaAgendamento}
                    onChange={(event) => setHoraAgendamento(event.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div className="rounded-lg border border-violet-600/20 bg-violet-600/10 p-3">
                  <p className="text-xs text-violet-300">
                    O horario agenda a fila e o workflow. Publicacao real ainda depende de plataforma valida e contas configuradas.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={fecharModalAgendar}
                  className="flex-1 rounded-lg bg-zinc-800 px-4 py-2 text-white transition-colors hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarAgendamento}
                  disabled={!dataAgendamento || !horaAgendamento || agendarPublicacao.isPending}
                  className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {agendarPublicacao.isPending ? 'Agendando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
