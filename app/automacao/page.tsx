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
  /**
   * Quando presente, a acao e disparada UMA VEZ POR FATIA em vez de uma chamada so.
   *
   * POR QUE: a coleta das 4 redes numa chamada unica estoura o teto de 60s da funcao e o gateway
   * devolve 504 — foi o erro que o dono viu nesta tela. A rota tem prazos internos de 45s (geral) e
   * 50s (Instagram), o que deixa ~10s para gravar as ~540 leituras; quando a gravacao demora, passa
   * dos 60. Os crons de producao nunca caem nisso porque ja sao um job POR REDE (06:10/20/30/40) —
   * a tela e que fazia diferente. A propria rota avisa: "Use ?rede= para fatiar".
   */
  fatias?: string[]
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
    fatias: ['youtube', 'tiktok', 'instagram', 'facebook'],
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
      const fatias = acao.fatias ?? [null]
      let coletados = 0
      let duracao = 0
      let ultima: Record<string, unknown> = {}
      const falhas: string[] = []

      for (const fatia of fatias) {
        const url = fatia ? `${acao.endpoint}?rede=${fatia}` : acao.endpoint
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        // 504 nao devolve JSON: o gateway responde HTML. Ler .json() as cegas troca o erro real
        // por "Unexpected token <", que foi o que escondeu a causa deste bug.
        const data = await res.json().catch(() => ({ error: `${res.status} — a rede ${fatia ?? 'todas'} passou do tempo` }))
        if (!res.ok) {
          // uma rede que falha nao pode derrubar as outras tres: anota e segue
          falhas.push(`${fatia ?? 'coleta'}: ${(data as Record<string, unknown>).error || res.status}`)
          continue
        }
        ultima = data as Record<string, unknown>
        coletados += Number((data as Record<string, unknown>).coletados ?? 0)
        duracao += Number((data as Record<string, unknown>).duracao_ms ?? 0)
      }

      if (falhas.length === fatias.length) throw new Error(falhas.join(' · '))
      const resumo = acao.fatias ? { ...ultima, coletados, duracao_ms: duracao } : ultima
      if (falhas.length) toast.error(`Parcial — ${falhas.join(' · ')}`)
      toast.success(acao.okMsg(resumo))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setRodando(null)
    }
  }

  return (
    <div>
      <div className="space-y-8">
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
