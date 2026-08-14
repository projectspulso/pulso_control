'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/layout/page-header'
import { Lightbulb, BarChart3, RefreshCw, Loader2 } from 'lucide-react'

/**
 * AUTOMAÇÃO — gatilhos manuais dos crons.
 * A página era o painel da fila antiga (automation_queue, era n8n) — aposentada em
 * 20/07: a esteira hoje é dirigida pela Linha de Produção (/producao) e pelos crons
 * da Vercel. Sobram aqui os disparos manuais úteis entre um cron e outro.
 */

interface Acao {
  id: string
  titulo: string
  desc: string
  endpoint: string
  icone: React.ReactNode
  okMsg: (d: Record<string, unknown>) => string
}

const ACOES: Acao[] = [
  {
    id: 'gerar-ideias',
    titulo: 'Gerar Ideias',
    desc: 'GPT gera ideias novas no canal com menos estoque (travas de dedup ativas).',
    endpoint: '/api/automation/gerar-ideias',
    icone: <Lightbulb className="h-5 w-5" />,
    okMsg: (d) => `${d.quantidade_gerada ?? '?'} ideia(s) gerada(s)`,
  },
  {
    id: 'coletar',
    titulo: 'Coletar Métricas',
    desc: 'Puxa views/likes das 4 redes via API agora (o cron roda 11h).',
    endpoint: '/api/automation/coletar-metricas',
    icone: <BarChart3 className="h-5 w-5" />,
    okMsg: (d) => `${d.coletados ?? 0} posts coletados em ${(Number(d.duracao_ms ?? 0) / 1000).toFixed(0)}s`,
  },
  {
    id: 'reconciliar',
    titulo: 'Reconciliar Publicações',
    desc: 'Descobre vídeos postados fora do app (IG/FB/TikTok) e casa com as ideias.',
    endpoint: '/api/automation/reconciliar-publicacoes',
    icone: <RefreshCw className="h-5 w-5" />,
    okMsg: (d) => {
      const novos = Object.values((d.varridos as Record<string, { novos: number }>) || {}).reduce((a, v) => a + (v.novos || 0), 0)
      return novos > 0 ? `${novos} publicação(ões) nova(s) descoberta(s)` : 'Tudo já sincronizado'
    },
  },
]

export default function AutomacaoPage() {
  const [rodando, setRodando] = useState<string | null>(null)

  async function disparar(acao: Acao) {
    setRodando(acao.id)
    try {
      const res = await fetch(acao.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`)
      toast.success(acao.okMsg(data))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setRodando(null)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <PageHeader
          titulo="Automação"
          subtitulo="Gatilhos manuais — os crons da Vercel rodam sozinhos (coleta 11h, funil 12h, áudio 13h)"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ACOES.map((acao) => (
            <button
              key={acao.id}
              type="button"
              onClick={() => disparar(acao)}
              disabled={rodando !== null}
              className="glass glass-hover group rounded-2xl border border-zinc-800/60 p-5 text-left transition-all hover:border-violet-500/40 disabled:opacity-50"
            >
              <div className="mb-2 flex items-center gap-2 text-violet-300">
                {rodando === acao.id ? <Loader2 className="h-5 w-5 animate-spin" /> : acao.icone}
                <span className="font-bold text-white">{acao.titulo}</span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">{acao.desc}</p>
            </button>
          ))}
        </div>

        <p className="text-xs text-zinc-600">
          O ritmo diário (renders, roteiros, buffers) é dirigido pela Linha de Produção em{' '}
          <a href="/producao" className="text-violet-400 underline-offset-2 hover:underline">/producao</a>.
        </p>
      </div>
    </div>
  )
}
