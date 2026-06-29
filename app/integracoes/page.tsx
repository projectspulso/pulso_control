'use client'

import { CheckCircle2, AlertTriangle, HelpCircle, Database, Send, Sparkles, Zap, Plug } from 'lucide-react'

import { useIntegracoes, type Integracao, type StatusIntegracao } from '@/lib/hooks/use-integracoes'
import { ErrorState } from '@/components/ui/error-state'

const CAT: Record<Integracao['categoria'], { nome: string; icon: typeof Database }> = {
  dados: { nome: 'Dados', icon: Database },
  publicacao: { nome: 'Publicação & Métricas', icon: Send },
  geracao: { nome: 'Geração de conteúdo', icon: Sparkles },
  automacao: { nome: 'Automação', icon: Zap },
}

const STATUS: Record<StatusIntegracao, { cls: string; icon: typeof CheckCircle2; label: string }> = {
  ok: { cls: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/30', icon: CheckCircle2, label: 'OK' },
  atencao: { cls: 'text-amber-400 bg-amber-500/10 ring-amber-500/30', icon: AlertTriangle, label: 'Atenção' },
  desconhecido: { cls: 'text-zinc-400 bg-zinc-500/10 ring-zinc-500/30', icon: HelpCircle, label: 'Servidor' },
}

export default function IntegracoesPage() {
  const { data, isLoading, isError, refetch } = useIntegracoes()

  if (isError) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8">
        <div className="mx-auto max-w-5xl">
          <ErrorState title="Erro ao carregar integrações" message="Não foi possível checar as integrações." onRetry={() => refetch()} />
        </div>
      </div>
    )
  }

  const cats = Object.keys(CAT) as Integracao['categoria'][]

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <Plug className="h-7 w-7 text-cyan-400" />
            <h1 className="bg-linear-to-r from-cyan-400 to-blue-400 bg-clip-text text-4xl font-black text-transparent">Integrações</h1>
          </div>
          <p className="text-zinc-400">Os serviços que fazem o PULSO rodar — pra que cada um serve e se está saudável.</p>
        </div>

        {isLoading && <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-900/50" />)}</div>}

        {cats.map((cat) => {
          const itens = (data ?? []).filter((i) => i.categoria === cat)
          if (!itens.length) return null
          const C = CAT[cat]
          return (
            <div key={cat} className="mb-8">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-400">
                <C.icon className="h-4 w-4" /> {C.nome}
              </h2>
              <div className="space-y-3">
                {itens.map((i) => {
                  const S = STATUS[i.status]
                  return (
                    <div key={i.chave} className="flex items-start gap-4 rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-4">
                      <span className={`mt-0.5 flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${S.cls}`}>
                        <S.icon className="h-3.5 w-3.5" /> {S.label}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-white">{i.nome}</h3>
                        <p className="text-sm text-zinc-400">{i.para_que}</p>
                        <p className="mt-1 text-xs text-zinc-500">{i.detalhe}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        <p className="mt-6 text-[11px] text-zinc-600">
          Status derivado de sinais reais do banco (última métrica/áudio/render). “Servidor” = chave fica no Vercel/local e não dá pra checar pelo navegador.
        </p>
      </div>
    </div>
  )
}
