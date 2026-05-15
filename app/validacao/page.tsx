'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  Clock3,
  Flame,
  ShieldCheck,
  Target,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

import { ErrorState } from '@/components/ui/error-state'
import { MODO_FOCO } from '@/lib/config/modo-foco'
import { useAnalyticsMvp } from '@/lib/hooks/use-analytics-mvp'
import { useAutomationQueue } from '@/lib/hooks/use-automation'
import { useCanais } from '@/lib/hooks/use-core'
import { useIdeias } from '@/lib/hooks/use-ideias'
import { useConteudosProducao } from '@/lib/hooks/use-producao'
import { useRoteiros } from '@/lib/hooks/use-roteiros'

function percent(part: number, total: number) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    notation: value >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

function getDecision(params: {
  videosPublicados: number
  views7d: number
  workflowSuccessRate: number
  errosFila: number
  pendentesFila: number
  canaisAtivos: number
}) {
  const { videosPublicados, views7d, workflowSuccessRate, errosFila, pendentesFila, canaisAtivos } = params

  if (canaisAtivos > 1) {
    return {
      label: 'AJUSTAR foco',
      tone: 'yellow',
      icon: AlertTriangle,
      text: 'Ha canais ativos demais para validar renda. Escolher 1 canal principal antes de acelerar producao.',
    }
  }

  if (pendentesFila > 50) {
    return {
      label: 'AJUSTAR fila',
      tone: 'yellow',
      icon: AlertTriangle,
      text: 'A fila acumulou tarefas antigas. Limpar ou pausar automacoes antes de gerar mais trabalho.',
    }
  }

  if (videosPublicados >= 20 && views7d === 0) {
    return {
      label: 'KILL ou pivot',
      tone: 'red',
      icon: XCircle,
      text: 'Volume minimo publicado sem sinal de audiencia. Trocar formato, nicho ou tese antes de produzir mais.',
    }
  }

  if (errosFila > 0 || workflowSuccessRate < 70) {
    return {
      label: 'AJUSTAR operacao',
      tone: 'yellow',
      icon: AlertTriangle,
      text: 'A operacao ainda quebra demais. Consertar fluxo antes de acelerar publicacao.',
    }
  }

  if (videosPublicados >= 10 && views7d > 0) {
    return {
      label: 'GO controlado',
      tone: 'green',
      icon: CheckCircle2,
      text: 'Existe sinal inicial. Continuar por lote semanal, cortando formatos fracos sem abrir segundo canal.',
    }
  }

  return {
    label: 'Executar lote',
    tone: 'blue',
    icon: Target,
    text: 'Ainda nao ha amostra suficiente. O trabalho agora e publicar o lote minimo e medir sem romantizar.',
  }
}

const toneClasses = {
  blue: 'border-blue-500/20 bg-blue-500/10 text-blue-100',
  green: 'border-green-500/20 bg-green-500/10 text-green-100',
  yellow: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-100',
  red: 'border-red-500/20 bg-red-500/10 text-red-100',
}

const statusPeso: Record<string, number> = {
  PRONTO_PUBLICACAO: 1,
  AUDIO_GERADO: 2,
  ROTEIRO_PRONTO: 3,
  AGUARDANDO_ROTEIRO: 4,
  EM_EDICAO: 5,
  PUBLICADO: 6,
}

const statusLabels: Record<string, string> = {
  AGUARDANDO_ROTEIRO: 'Aguardando roteiro',
  ROTEIRO_PRONTO: 'Roteiro pronto',
  AUDIO_GERADO: 'Audio gerado',
  EM_EDICAO: 'Em edicao',
  PRONTO_PUBLICACAO: 'Pronto para publicar',
  PUBLICADO: 'Publicado',
}

export default function ValidacaoPage() {
  const canais = useCanais()
  const ideias = useIdeias()
  const roteiros = useRoteiros()
  const producao = useConteudosProducao()
  const analytics = useAnalyticsMvp()
  const automation = useAutomationQueue({ limit: 500 })

  const hasError =
    canais.isError ||
    ideias.isError ||
    roteiros.isError ||
    producao.isError ||
    analytics.isError ||
    automation.isError

  if (hasError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-7xl">
          <ErrorState
            title="Erro ao carregar validacao"
            message="Nao foi possivel montar a visao de decisao do MVP."
            onRetry={() => {
              canais.refetch()
              ideias.refetch()
              roteiros.refetch()
              producao.refetch()
              analytics.refetch()
              automation.refetch()
            }}
          />
        </div>
      </div>
    )
  }

  const canaisRows = canais.data ?? []
  const ideiasRows = ideias.data ?? []
  const roteirosRows = roteiros.data ?? []
  const pipelineRows = producao.data ?? []
  const analyticsData = analytics.data
  const queueRows = automation.data ?? []

  const ideiasAprovadas = ideiasRows.filter((item: any) => item.status === 'APROVADA').length
  const roteirosAprovados = roteirosRows.filter((item: any) => item.status === 'APROVADO').length
  const prontos = pipelineRows.filter((item: any) => item.pipeline_status === 'PRONTO_PUBLICACAO').length
  const publicados = pipelineRows.filter((item: any) => item.pipeline_status === 'PUBLICADO').length
  const errosFila = queueRows.filter((item) => item.status === 'ERRO' || item.status === 'RETRY').length
  const pendentesFila = queueRows.filter((item) => item.status === 'PENDENTE').length
  const canaisAtivos = canaisRows.filter((item: any) => item.status === 'ATIVO').length
  const aguardandoRoteiro = pipelineRows.filter((item: any) => item.pipeline_status === 'AGUARDANDO_ROTEIRO').length
  const audioGerado = pipelineRows.filter((item: any) => item.pipeline_status === 'AUDIO_GERADO').length
  const views7d = analyticsData?.cards.totalViews ?? 0
  const workflowSuccessRate = analyticsData?.cards.workflowSuccessRate ?? 0
  const canaisById = new Map(canaisRows.map((item: any) => [item.id, item]))
  const pipelinePorCanal = pipelineRows.reduce((acc: Record<string, number>, item: any) => {
    const canalId = item.metadata?.canal_id
    const canalNome = canalId ? canaisById.get(canalId)?.nome : item.canal
    const key = canalNome || item.canal || 'Sem canal'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  const prontosPorCanal = pipelineRows.reduce((acc: Record<string, number>, item: any) => {
    const canalId = item.metadata?.canal_id
    const canalNome = canalId ? canaisById.get(canalId)?.nome : item.canal
    const key = canalNome || item.canal || 'Sem canal'
    if (item.pipeline_status === 'PRONTO_PUBLICACAO' || item.pipeline_status === 'PUBLICADO') {
      acc[key] = (acc[key] ?? 0) + 1
    }
    return acc
  }, {})
  const candidatosFoco = canaisRows
    .filter((item: any) => item.status === 'ATIVO')
    .map((item: any) => {
      const ordem = Number(item.metadata?.ordem_prioridade ?? 999)
      return {
        id: item.id,
        nome: item.nome,
        slug: item.slug,
        ordem,
        pipeline: pipelinePorCanal[item.nome] ?? 0,
        prontos: prontosPorCanal[item.nome] ?? 0,
      }
    })
    .sort((a, b) => b.pipeline - a.pipeline || b.prontos - a.prontos || a.ordem - b.ordem)
    .slice(0, 3)
  const filaPorTipo = queueRows.reduce((acc: Record<string, number>, item) => {
    if (item.status === 'PENDENTE') {
      acc[item.tipo] = (acc[item.tipo] ?? 0) + 1
    }
    return acc
  }, {})
  const filaCritica = Object.entries(filaPorTipo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const canalFocoOficial = canaisRows.find((item: any) => item.id === MODO_FOCO.canalId)
  const canalFoco = canalFocoOficial
    ? {
        id: canalFocoOficial.id,
        nome: canalFocoOficial.nome,
        slug: canalFocoOficial.slug,
        ordem: Number(canalFocoOficial.metadata?.ordem_prioridade ?? 999),
        pipeline: pipelinePorCanal[canalFocoOficial.nome] ?? 0,
        prontos: prontosPorCanal[canalFocoOficial.nome] ?? 0,
      }
    : candidatosFoco[0]
  const candidatosFocoExibidos = canalFoco
    ? [canalFoco, ...candidatosFoco.filter((item) => item.id !== canalFoco.id)].slice(0, 3)
    : candidatosFoco
  const mapaCanais = canaisRows
    .filter((item: any) => item.status === 'ATIVO')
    .map((item: any) => ({
      id: item.id,
      nome: item.nome,
      slug: item.slug,
      pipeline: pipelinePorCanal[item.nome] ?? 0,
      prontos: prontosPorCanal[item.nome] ?? 0,
    }))
    .sort((a, b) => b.pipeline - a.pipeline || b.prontos - a.prontos)
  const loteRecomendado = canalFoco
    ? pipelineRows
        .filter((item: any) => item.canal === canalFoco.nome)
        .filter((item: any) => item.pipeline_status !== 'PUBLICADO')
        .sort((a: any, b: any) => {
          const statusA = statusPeso[a.pipeline_status] ?? 99
          const statusB = statusPeso[b.pipeline_status] ?? 99
          return statusA - statusB || (b.prioridade ?? 0) - (a.prioridade ?? 0)
        })
        .slice(0, 5)
    : []

  const decision = getDecision({
    videosPublicados: publicados,
    views7d,
    workflowSuccessRate,
    errosFila,
    pendentesFila,
    canaisAtivos,
  })
  const DecisionIcon = decision.icon

  const isLoading =
    canais.isLoading ||
    ideias.isLoading ||
    roteiros.isLoading ||
    producao.isLoading ||
    analytics.isLoading ||
    automation.isLoading

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  MVP interno
                </p>
                <h1 className="text-4xl font-black text-white">Validacao de renda</h1>
              </div>
            </div>
            <p className="max-w-3xl text-zinc-400">
              Painel para transformar operacao de conteudo em ativo. A decisao aqui e fria: publicar,
              medir, ajustar, matar ou continuar.
            </p>
          </div>

          <div className={`rounded-xl border px-5 py-4 ${toneClasses[decision.tone as keyof typeof toneClasses]}`}>
            <div className="flex items-center gap-3">
              <DecisionIcon className="h-6 w-6 shrink-0" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider">{decision.label}</p>
                <p className="mt-1 max-w-xl text-sm opacity-85">{decision.text}</p>
              </div>
            </div>
          </div>
        </header>

        {isLoading && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-400">
            Carregando dados operacionais...
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Flame}
            label="Videos publicados"
            value={`${publicados}/20`}
            detail={`${prontos} prontos para publicar`}
          />
          <MetricCard
            icon={BarChart3}
            label="Views 7 dias"
            value={formatNumber(views7d)}
            detail={`${analyticsData?.cards.trackedPosts ?? 0} posts medidos`}
          />
          <MetricCard
            icon={ShieldCheck}
            label="Workflows"
            value={`${pendentesFila}`}
            detail={`${errosFila} erro(s) ou retry; ${Math.round(workflowSuccessRate)}% sucesso recente`}
          />
          <MetricCard
            icon={BadgeDollarSign}
            label="Receita validada"
            value="R$ 0"
            detail="Nao contar renda antes de oferta ou monetizacao real"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <RealityCard
            tone={canaisAtivos > 1 ? 'yellow' : 'green'}
            title="Foco operacional"
            value={`${canaisAtivos} canais ativos`}
            text={
              canaisAtivos > 1
                ? 'Para validar renda, isso esta largo demais. O MVP precisa escolher 1 canal principal.'
                : 'Foco compativel com validacao de um canal.'
            }
          />
          <RealityCard
            tone={pendentesFila > 50 ? 'yellow' : 'green'}
            title="Fila de automacao"
            value={`${pendentesFila} pendentes`}
            text={
              pendentesFila > 50
                ? 'Ha backlog antigo suficiente para gerar ruido e custo. Nao acelerar antes de limpar a fila.'
                : 'Fila em tamanho aceitavel para operar.'
            }
          />
          <RealityCard
            tone={aguardandoRoteiro > 20 ? 'yellow' : 'green'}
            title="Gargalo do pipeline"
            value={`${aguardandoRoteiro} aguardando roteiro`}
            text={
              aguardandoRoteiro > 20
                ? 'O gargalo nao e ideia. E transformar pauta aprovada em roteiro e video publicavel.'
                : `${audioGerado} item(ns) com audio gerado para avancar.`
            }
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Funil do lote</h2>
                <p className="text-sm text-zinc-500">
                  O alvo inicial nao e escala. E completar ciclos e descobrir um formato repetivel.
                </p>
              </div>
              <BarChart3 className="h-5 w-5 text-zinc-500" />
            </div>

            <div className="space-y-4">
              <FunnelRow label="Ideias aprovadas" value={ideiasAprovadas} total={Math.max(ideiasRows.length, 1)} />
              <FunnelRow label="Roteiros aprovados" value={roteirosAprovados} total={Math.max(roteirosRows.length, 1)} />
              <FunnelRow label="Prontos para publicar" value={prontos} total={20} />
              <FunnelRow label="Publicados no lote" value={publicados} total={20} />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
            <div className="mb-5 flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-amber-300" />
              <h2 className="text-lg font-semibold text-white">Checklist desta semana</h2>
            </div>

            <div className="space-y-3">
              <ChecklistItem done={ideiasAprovadas >= 10} text="10 ideias aprovadas com gancho claro" />
              <ChecklistItem done={roteirosAprovados >= 5} text="5 roteiros aprovados sem retrabalho pesado" />
              <ChecklistItem done={prontos + publicados >= 5} text="5 videos prontos ou publicados" />
              <ChecklistItem done={views7d > 0} text="Primeiros sinais reais de audiencia coletados" />
              <ChecklistItem done={canaisAtivos === 1} text="1 canal ativo como foco da validacao" />
              <ChecklistItem done={pendentesFila <= 50} text="Fila sem backlog antigo dominando a operacao" />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
            <div className="mb-5 flex items-center gap-2">
              <Target className="h-5 w-5 text-cyan-300" />
              <h2 className="text-lg font-semibold text-white">Canal foco oficial</h2>
            </div>
            <p className="mb-4 text-sm text-zinc-500">
              O ranking agora e auditoria. A execucao diaria esta travada no canal foco oficial do MVP.
            </p>
            <div className="space-y-3">
              {candidatosFocoExibidos.map((canal, index) => (
                <FocusCandidate key={canal.id} index={index + 1} {...canal} />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
            <div className="mb-5 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-300" />
              <h2 className="text-lg font-semibold text-white">Politica da fila</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <QueuePolicyCard
                title="Agora"
                text="Nao gerar novos lotes enquanto a fila pendente antiga estiver dominando a operacao."
              />
              <QueuePolicyCard
                title="Triagem"
                text="Separar tarefas do canal foco das tarefas antigas dos demais canais antes de reprocessar."
              />
              <QueuePolicyCard
                title="Limite"
                text="Operar em lotes pequenos; acima de 50 pendentes, a fila vira ruido e custo."
              />
            </div>
            <div className="mt-5 space-y-2">
              {filaCritica.length > 0 ? (
                filaCritica.map(([tipo, total]) => <QueueTypeRow key={tipo} tipo={tipo} total={total} />)
              ) : (
                <p className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-500">
                  Nao ha pendencias na fila dentro do limite carregado.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Lote de validacao recomendado</h2>
              <p className="text-sm text-zinc-500">
                Ate 5 itens do canal foco, priorizando o que esta mais perto de publicar.
              </p>
            </div>
            {canalFoco && (
              <Link
                href={`/canais/${canalFoco.slug}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-cyan-400 hover:text-cyan-100"
              >
                Abrir canal foco
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <div className="space-y-3">
            {loteRecomendado.length > 0 ? (
              loteRecomendado.map((item: any, index: number) => (
                <ValidationBatchItem key={item.pipeline_id} index={index + 1} item={item} />
              ))
            ) : (
              <p className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-500">
                Ainda nao ha item de pipeline elegivel para o canal foco.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Roadmap de implantacao do MVP</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Sequencia completa para transformar o app em operacao real. Datas fixas a partir de 15/05/2026.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <RoadmapStep
              fase="0"
              periodo="15/05/2026"
              title="Travar foco"
              status="Hoje"
              items={[
                `Canal foco: ${canalFoco?.nome ?? 'definir pelo ranking'}.`,
                'Congelar geracao de demanda nos demais canais.',
                'Usar a fila apenas para diagnostico ate classificar pendencias antigas.',
              ]}
            />
            <RoadmapStep
              fase="1"
              periodo="16/05 a 17/05"
              title="Sanear fila e escolher lote"
              status="P0"
              items={[
                'Separar pendencias do canal foco das pendencias antigas dos outros canais.',
                'Nao cancelar ou arquivar em massa sem confirmacao explicita.',
                'Fechar os 5 itens do lote de validacao na tela atual.',
              ]}
            />
            <RoadmapStep
              fase="2"
              periodo="18/05 a 20/05"
              title="Roteiros do lote"
              status="Execucao"
              items={[
                'Gerar roteiro para cada item sem roteiro.',
                'Aprovar apenas roteiros com hook claro e promessa especifica.',
                'Reprovar ou voltar para revisao o que for generico.',
              ]}
            />
            <RoadmapStep
              fase="3"
              periodo="21/05 a 23/05"
              title="Audio e producao"
              status="Execucao"
              items={[
                'Gerar ou vincular audio dos roteiros aprovados.',
                'Mover itens pelo pipeline ate pronto para publicar.',
                'Registrar qualquer falha na fila antes de tentar novo lote.',
              ]}
            />
            <RoadmapStep
              fase="4"
              periodo="24/05 a 26/05"
              title="Publicacao assistida"
              status="Lote 1"
              items={[
                'Publicar 5 videos no YouTube Shorts como ancora.',
                'Adaptar para TikTok e Instagram somente se nao atrasar a ancora.',
                'Nao abrir segundo canal durante este lote.',
              ]}
            />
            <RoadmapStep
              fase="5"
              periodo="27/05 a 02/06"
              title="Medicao"
              status="Dados"
              items={[
                'Coletar views, cliques, comentarios e sinal de retencao quando disponivel.',
                'Medir tempo humano gasto por video.',
                'Separar problema de conteudo de problema de operacao.',
              ]}
            />
            <RoadmapStep
              fase="6"
              periodo="03/06/2026"
              title="Gate GO/AJUSTAR/KILL"
              status="Decisao"
              items={[
                'GO: repetir formato com lote de 10.',
                'AJUSTAR: corrigir gargalo dominante antes de novo lote.',
                'KILL: matar formato sem abrir excecao emocional.',
              ]}
            />
            <RoadmapStep
              fase="7"
              periodo="04/06 a 12/06"
              title="Segundo lote e monetizacao simples"
              status="Depois"
              items={[
                'So iniciar se o lote 1 tiver sinal minimo ou aprendizado claro.',
                'Testar afiliado, lead magnet ou oferta simples, sem chamar de renda passiva.',
                'Automatizar mais apenas onde o fluxo ja repetiu sem quebra.',
              ]}
            />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">Mapa dos canais</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Ordem operacional para nao confundir escala com validacao.
              </p>
            </div>
            <div className="space-y-3">
              {mapaCanais.map((canal, index) => (
                <ChannelRolloutRow key={canal.id} canal={canal} index={index} />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">Sequencia dentro do app</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Caminho unico de operacao ate o MVP ser real.
              </p>
            </div>
            <div className="space-y-3">
              <ExecutionPlaybookCard href="/validacao" title="1. Validacao" text="Escolher canal, lote, datas e gate." />
              <ExecutionPlaybookCard href="/ideias" title="2. Ideias" text="Aprovar apenas pautas com gancho claro." />
              <ExecutionPlaybookCard href="/roteiros" title="3. Roteiros" text="Revisar promessa, ritmo e originalidade." />
              <ExecutionPlaybookCard href="/producao" title="4. Producao" text="Mover item ate audio, edicao e pronto para publicar." />
              <ExecutionPlaybookCard href="/publicar" title="5. Publicar" text="Publicacao assistida; YouTube Shorts primeiro." />
              <ExecutionPlaybookCard href="/analytics" title="6. Medir" text="Separar sinal de audiencia de mera producao." />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Gate de decisao</h2>
            <p className="mt-1 text-sm text-zinc-500">
              O MVP so vira realidade se passar por esses cortes. Sem excecao por entusiasmo.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <GateRule
              title="GO"
              tone="green"
              items={[
                '5 videos publicados sem quebra operacional grave.',
                'Ha sinal minimo de audiencia ou aprendizado repetivel.',
                'Tempo humano por video cabe na rotina.',
              ]}
            />
            <GateRule
              title="AJUSTAR"
              tone="yellow"
              items={[
                'Fluxo funciona, mas fila ou qualidade travam.',
                'Hook ou formato ainda nao e claro.',
                'Publicacao exige intervencao demais.',
              ]}
            />
            <GateRule
              title="KILL"
              tone="red"
              items={[
                'Formato nao gera sinal apos lote minimo.',
                'Conteudo depende de derivacao fraca ou risco editorial.',
                'Operacao nao repete duas vezes sem correcoes manuais.',
              ]}
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <PlanCard
            title="Plano de negocio"
            items={[
              'Fase 1: provar audiencia, nao receita.',
              'Fase 2: testar afiliado, lead ou produto simples.',
              'Fase 3: so automatizar forte depois do formato vencedor.',
            ]}
          />
          <PlanCard
            title="Plano de marketing"
            items={[
              'YouTube Shorts como ancora do MVP.',
              'TikTok e Instagram apenas como distribuicao adaptada.',
              'Uma tese editorial, dois formatos no maximo.',
            ]}
          />
          <PlanCard
            title="Travas de realidade"
            items={[
              'Nao abrir segundo canal antes de 20 videos.',
              'Nao chamar de renda passiva antes de receita recorrente.',
              'Nao aumentar automacao se a qualidade cair.',
            ]}
          />
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Proximas acoes</h2>
              <p className="text-sm text-zinc-500">
                Ordem correta: completar fluxo, publicar lote, medir, decidir.
              </p>
            </div>
            <Link
              href="/ideias"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-400"
            >
              Ir para ideias
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <ActionStep number="1" title="Aprovar ideias" text="Cortar pauta fraca antes de virar custo." />
            <ActionStep number="2" title="Aprovar roteiros" text="Hook e originalidade antes de audio." />
            <ActionStep number="3" title="Publicar lote" text="20 videos antes de conclusao forte." />
            <ActionStep number="4" title="Decidir" text="GO, ajustar ou matar sem apego." />
          </div>
        </section>
      </div>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="mb-4 flex items-center gap-3 text-zinc-400">
        <Icon className="h-5 w-5 text-cyan-300" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-3xl font-black text-white tabular-nums">{value}</p>
      <p className="mt-2 text-sm text-zinc-500">{detail}</p>
    </div>
  )
}

function RealityCard({
  tone,
  title,
  value,
  text,
}: {
  tone: 'green' | 'yellow'
  title: string
  value: string
  text: string
}) {
  const classes =
    tone === 'green'
      ? 'border-green-500/20 bg-green-500/10 text-green-100'
      : 'border-yellow-500/20 bg-yellow-500/10 text-yellow-100'
  const Icon = tone === 'green' ? CheckCircle2 : AlertTriangle

  return (
    <div className={`rounded-xl border p-5 ${classes}`}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <h2 className="text-sm font-semibold uppercase tracking-wider">{title}</h2>
      </div>
      <p className="text-2xl font-black tabular-nums">{value}</p>
      <p className="mt-2 text-sm opacity-85">{text}</p>
    </div>
  )
}

function FunnelRow({ label, value, total }: { label: string; value: number; total: number }) {
  const width = Math.min(percent(value, total), 100)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm text-zinc-300">{label}</span>
        <span className="text-sm font-semibold text-white tabular-nums">
          {value}/{total}
        </span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800">
        <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

function ChecklistItem({ done, text }: { done: boolean; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
      {done ? (
        <CheckCircle2 className="h-5 w-5 text-green-300" />
      ) : (
        <Clock3 className="h-5 w-5 text-zinc-500" />
      )}
      <span className={done ? 'text-sm text-zinc-200' : 'text-sm text-zinc-500'}>{text}</span>
    </div>
  )
}

function FocusCandidate({
  index,
  nome,
  slug,
  ordem,
  pipeline,
  prontos,
}: {
  index: number
  nome: string
  slug: string
  ordem: number
  pipeline: number
  prontos: number
}) {
  const isTop = index === 1

  return (
    <Link
      href={`/canais/${slug}`}
      className={
        isTop
          ? 'rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4'
          : 'rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 transition hover:border-zinc-700'
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={isTop ? 'text-sm font-semibold text-cyan-100' : 'text-sm font-semibold text-zinc-200'}>
            {index}. {nome}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{slug}</p>
        </div>
        <span className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-400">
          prioridade {ordem === 999 ? '-' : ordem}
        </span>
      </div>
      <div className="mt-3 flex gap-4 text-xs text-zinc-400">
        <span>{pipeline} no pipeline</span>
        <span>{prontos} pronto(s)/publicado(s)</span>
      </div>
    </Link>
  )
}

function QueuePolicyCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-zinc-500">{text}</p>
    </div>
  )
}

function QueueTypeRow({ tipo, total }: { tipo: string; total: number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3">
      <span className="text-sm text-zinc-300">{tipo.replaceAll('_', ' ')}</span>
      <span className="text-sm font-semibold tabular-nums text-white">{total} pendente(s)</span>
    </div>
  )
}

function ValidationBatchItem({ index, item }: { index: number; item: any }) {
  const href = item.roteiro_id ? `/roteiros/${item.roteiro_id}` : `/ideias/${item.ideia_id}`
  const nextAction =
    item.pipeline_status === 'PRONTO_PUBLICACAO'
      ? 'Publicar'
      : item.pipeline_status === 'AUDIO_GERADO'
        ? 'Preparar publicacao'
        : item.pipeline_status === 'ROTEIRO_PRONTO'
          ? 'Gerar audio'
          : 'Gerar roteiro'

  return (
    <Link
      href={href}
      className="grid gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 transition hover:border-cyan-500/50 md:grid-cols-[auto_1fr_auto]"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-sm font-bold text-cyan-300">
        {index}
      </div>
      <div>
        <p className="font-semibold text-white">{item.ideia}</p>
        <p className="mt-1 text-sm text-zinc-500">
          {item.serie || 'Sem serie'} | P{item.prioridade ?? '-'} | {statusLabels[item.pipeline_status] ?? item.pipeline_status}
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
        {nextAction}
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  )
}

function RoadmapStep({
  fase,
  periodo,
  title,
  status,
  items,
}: {
  fase: string
  periodo: string
  title: string
  status: string
  items: string[]
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-sm font-bold text-cyan-300">
            {fase}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{periodo}</p>
            <h3 className="mt-1 font-semibold text-white">{title}</h3>
          </div>
        </div>
        <span className="rounded-full border border-zinc-700 px-2 py-1 text-xs font-semibold text-zinc-400">
          {status}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex gap-3 text-sm text-zinc-400">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChannelRolloutRow({
  canal,
  index,
}: {
  canal: { nome: string; slug: string; pipeline: number; prontos: number }
  index: number
}) {
  const stage =
    index === 0
      ? { label: 'Validar agora', className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100' }
      : index <= 2
        ? { label: 'Reserva', className: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-100' }
        : { label: 'Congelado', className: 'border-zinc-700 bg-zinc-950/60 text-zinc-400' }

  return (
    <Link
      href={`/canais/${canal.slug}`}
      className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 transition hover:border-cyan-500/50"
    >
      <div>
        <p className="font-semibold text-white">{canal.nome}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {canal.pipeline} no pipeline | {canal.prontos} pronto(s)/publicado(s)
        </p>
      </div>
      <span className={`shrink-0 rounded-full border px-2 py-1 text-xs font-semibold ${stage.className}`}>
        {stage.label}
      </span>
    </Link>
  )
}

function ExecutionPlaybookCard({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 transition hover:border-cyan-500/50"
    >
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-zinc-500">{text}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-zinc-500" />
    </Link>
  )
}

function GateRule({ title, tone, items }: { title: string; tone: 'green' | 'yellow' | 'red'; items: string[] }) {
  const classes = {
    green: 'border-green-500/20 bg-green-500/10 text-green-100',
    yellow: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-100',
    red: 'border-red-500/20 bg-red-500/10 text-red-100',
  }

  return (
    <div className={`rounded-lg border p-5 ${classes[tone]}`}>
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex gap-2 text-sm opacity-85">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PlanCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item} className="flex gap-3 text-sm text-zinc-400">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActionStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-sm font-bold text-cyan-300">
        {number}
      </div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-zinc-500">{text}</p>
    </div>
  )
}
