'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Calendar,
  Copy,
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
import { ModoFocoBanner } from '@/components/modo-foco-banner'
import { PageHeader } from '@/components/layout/page-header'
import { KitPublicacao } from '@/components/kit-publicacao'
import { CockpitDia } from '@/components/cockpit-dia'
import { MODO_FOCO, MODO_FOCO_ATIVO } from '@/lib/config/modo-foco'
import { useAgendarPublicacao, useConteudosProntos } from '@/lib/hooks/use-calendario'
import { usePublicar } from '@/lib/hooks/use-automation'
import { useAprendizados, REDE_LABEL, REDE_EMOJI } from '@/lib/hooks/use-aprendizados'

type FeedbackTone = 'success' | 'error' | 'info'

interface FeedbackState {
  tone: FeedbackTone
  title: string
  description: string
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

  return 'Falha inesperada. Revise a fila de automacao e as credenciais configuradas.'
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
  const publicarAgora = usePublicar()
  const agendarPublicacao = useAgendarPublicacao()
  const apr = useAprendizados()

  const [aba, setAba] = useState<'plano' | 'fila'>('plano')
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [mostrarModalAgendar, setMostrarModalAgendar] = useState(false)
  const [mostrarModalPublicar, setMostrarModalPublicar] = useState(false)
  const [publicando, setPublicando] = useState(false)
  const [dataAgendamento, setDataAgendamento] = useState('')
  const [horaAgendamento, setHoraAgendamento] = useState('')
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  const conteudosModoFoco = (MODO_FOCO_ATIVO ? conteudos?.filter((conteudo) => conteudo.canal === MODO_FOCO.canalNomeDb) : conteudos) ?? []
  const totalConteudos = conteudosModoFoco.length
  const selecionouTodos = totalConteudos > 0 && selecionados.size === totalConteudos


  const HASHTAGS_VERTICAL: Record<string, string> = {
    'Mistérios': '#misterio #historiareal #curiosidades #shorts #fyp',
    'Curiosidades': '#curiosidades #ciencia #vocesabia #shorts #fyp',
    'Psicologia': '#psicologia #saudemental #comportamento #shorts #fyp',
    'Motivacional': '#motivacao #mindset #disciplina #shorts #fyp',
    'Casos Reais': '#historiareal #casosreais #historia #shorts #fyp',
  }

  const copiarKit = async (conteudo: { ideia: string; canal: string; serie?: string | null }) => {
    const vertical = Object.keys(HASHTAGS_VERTICAL).find((v) => conteudo.canal.includes(v.split(' ')[0]))
    const tags = vertical ? HASHTAGS_VERTICAL[vertical] : '#shorts #fyp'
    const kit = [
      `=== KIT DE PUBLICACAO — ${conteudo.ideia} ===`,
      '',
      `[YouTube Shorts]`,
      `Titulo: ${conteudo.ideia}`,
      `Descricao: ${conteudo.ideia} — segue o PULSO pra mais. 👁️`,
      `Tags: ${tags}`,
      `Config: Nao e para criancas · PT-BR · Entretenimento · Publico`,
      '',
      `[TikTok]`,
      `Legenda: ${conteudo.ideia} 👁️ ${tags}`,
      `Config: marcar CONTEUDO GERADO POR IA · Publico`,
      '',
      `[Meta Business Suite — IG + FB juntos]`,
      `Legenda: ${conteudo.ideia} 👁️ Segue o PULSO. ${tags}`,
      `Config: cross-post Instagram + Facebook · Reels`,
      '',
      `Arquivo: OneDrive pulso/videos/ (pasta do video)`,
    ].join('\n')
    await navigator.clipboard.writeText(kit)
    setFeedback({ tone: 'success', title: 'Kit copiado', description: `Kit de publicacao de "${conteudo.ideia}" na area de transferencia.` })
  }

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
    if (conteudosModoFoco.length === 0) {
      return
    }

    if (selecionouTodos) {
      setSelecionados(new Set())
      return
    }

    setSelecionados(new Set(conteudosModoFoco.map((conteudo) => conteudo.pipeline_id)))
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
    if (publicando) return // trava re-entrada: impede double-fire do botão (duplicou 9x reels no IG 15/06)
    if (selecionados.size === 0) {
      setFeedback({
        tone: 'error',
        title: 'Nada selecionado',
        description: 'Selecione pelo menos um conteudo antes de enviar para a fila assistida.',
      })
      return
    }

    setPublicando(true)
    const resultadosMsg: string[] = []
    try {
      for (const pipelineId of Array.from(selecionados)) {
        const conteudo = conteudosModoFoco.find((c) => c.pipeline_id === pipelineId)
        const videoUrl = conteudo?.metadata?.video_url
        const caption = conteudo?.metadata?.caption
        if (!videoUrl) {
          resultadosMsg.push(`${conteudo?.ideia || pipelineId}: sem video_url no pipeline — gere/registre o arquivo antes`)
          continue
        }

        // RESULTADO DO TESTE 11/07: com conta aquecida (~20 dias), YouTube e Instagram via
        // API entregam alcance normal (YT 281, IG 117-208), mas FACEBOOK via API deu 0 nos 3
        // — mesma página, reels published:true, só o método difere (manual 234/265 vs API 0).
        // É política de distribuição do FB pra reels não-nativos (o IG, mesma Graph API, não
        // tem isso). Então: YT+IG+TikTok via API, FB volta pro MANUAL (Business Suite).
        // Reversível: re-adicionar 'facebook' aqui quando descobrirmos o que destrava.
        const REDES = ['youtube', 'instagram', 'tiktok']
        const linhasRede = await Promise.all(
          REDES.map((rede) =>
            fetch('/api/automation/publicar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pipeline_id: pipelineId, video_url: videoUrl, caption, confirmar: true, plataformas: [rede] }),
            })
              .then((r) => r.json())
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .then((d: any) => {
                const r0 = (d.resultados || [])[0]
                return `${rede}: ${r0?.status || (d.error ? 'ERRO' : '?')}${r0?.erro ? ` (${String(r0.erro).slice(0, 40)})` : ''}`
              })
              .catch((e) => `${rede}: falhou (${e instanceof Error ? e.message : 'erro'})`),
          ),
        )
        resultadosMsg.push(`${conteudo?.ideia?.slice(0, 28) || pipelineId} → ${linhasRede.join(' · ')}`)
      }

      setFeedback({
        tone: 'success',
        title: 'Publicacao executada',
        description: resultadosMsg.join(' | '),
      })
      setSelecionados(new Set())
      setMostrarModalPublicar(false)
    } catch (error) {
      console.error('Erro ao publicar:', error)
      setFeedback({ tone: 'error', title: 'Falha na publicacao', description: getErrorMessage(error) })
    } finally {
      setPublicando(false)
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
      // Modo assistido: grava data/hora planejada no pipeline (lembrete/agenda).
      // NAO enfileira PUBLICAR — a fila pulso_automation foi aposentada (worker
      // desligado 23/06) e a publicacao no horario continua manual/assistida.
      await agendarPublicacao.mutateAsync({
        pipelineIds: Array.from(selecionados),
        dataHora,
      })

      setFeedback({
        tone: 'success',
        title: 'Agendado',
        description: `${selecionados.size} conteudo(s) agendado(s) para ${format(
          new Date(dataHora),
          "dd/MM 'as' HH:mm",
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
      <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
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
      <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
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
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header + abas: Plano do dia (cockpit) × Fila de publicação */}
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />
            <h1 className="bg-linear-to-r from-violet-400 to-purple-400 bg-clip-text text-3xl sm:text-4xl font-black text-transparent">Central de Publicação</h1>
          </div>
          <p className="text-zinc-400">Plano do dia e fila de publicação assistida.</p>
        </div>
        <div className="flex w-fit gap-1 rounded-xl bg-zinc-900/60 p-1">
          <button type="button" onClick={() => setAba('plano')} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${aba === 'plano' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}>📅 Plano do dia</button>
          <button type="button" onClick={() => setAba('fila')} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${aba === 'fila' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}>📤 Fila de publicação</button>
        </div>

        {aba === 'plano' && <CockpitDia mostrarLinkPublicar={false} />}

        {aba === 'fila' && (
        <div className="space-y-8">
        <PageHeader
          titulo="Fila de publicação"
          subtitulo={`${totalConteudos} conteudo(s) pronto(s) para envio a fila assistida`}
          acoes={
            selecionados.size > 0 ? (
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
            ) : undefined
          }
        />

        <ModoFocoBanner detail="Publicacao assistida limitada ao canal foco. Outros canais ficam congelados ate o gate." />

        {/* Kit de publicação manual — legenda + passo a passo por rede (YT/FB manuais) */}
        <KitPublicacao />

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
              {conteudosModoFoco.filter((conteudo) => conteudo.data_publicacao_planejada).length}
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
              {conteudosModoFoco.filter((conteudo) => {
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

        {conteudosModoFoco.length === 0 ? (
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
              {conteudosModoFoco.map((conteudo) => {
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

                    <div className="col-span-2 flex flex-col justify-center gap-1">
                      <div className="flex items-center gap-2">
                        {getIconePlataforma(conteudo.canal)}
                        <span className="line-clamp-1 text-sm text-zinc-300">
                          {conteudo.canal}
                        </span>
                      </div>
                      {(() => {
                        const r = apr.data?.redeRecomendadaNome(conteudo.canal)
                        return r ? (
                          <span
                            className="w-fit rounded bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-teal-300 ring-1 ring-teal-500/25"
                            title="Poste primeiro aqui — rede que mais entrega pra esse canal"
                          >
                            {REDE_EMOJI[r]} priorizar {REDE_LABEL[r]}
                          </span>
                        ) : null
                      })()}
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
                        onClick={() => copiarKit(conteudo)}
                        className="rounded-lg p-2 text-cyan-400 transition-colors hover:bg-cyan-600/10"
                        aria-label={`Copiar kit de publicacao de ${conteudo.ideia}`}
                      >
                        <Copy className="h-4 w-4" />
                      </button>
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

        {conteudosModoFoco.length > 0 && (
          <div className="rounded-lg border border-blue-600/20 bg-blue-600/10 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 text-blue-400" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-blue-300">
                  Operacao assistida, nao autopost irrestrito
                </h4>
                <p className="text-sm text-zinc-300">
                  Esta tela envia itens para a fila de publicacao assistida do app.
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
                O disparo passa pela automacao nativa e pelas plataformas configuradas, mas a validacao final continua operacional.
              </p>

              <div className="mt-4 rounded-lg border border-green-600/20 bg-green-600/10 p-3 text-xs text-green-300">
                Instagram: publicação direta via Meta API · FACEBOOK: manual no Business Suite (reels via
                API são sufocados pelo algoritmo — teste A/B 12/06) · TikTok: rascunho no celular (postar
                nativo com som trending) · YouTube: manual via kit (botão copiar).
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
                  disabled={publicando}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {publicando ? 'Enviando...' : 'Confirmar envio'}
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
                    O horario agenda a fila de automacao. Publicacao real ainda depende de plataforma valida e contas configuradas.
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
        )}
      </div>
    </div>
  )
}
