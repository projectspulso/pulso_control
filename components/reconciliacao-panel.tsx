'use client'

import { Database, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useReconciliacao } from '@/lib/hooks/use-reconciliacao'

const NOME_REDE: Record<string, string> = {
  youtube: 'YouTube', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', kwai: 'Kwai',
}
const fmtData = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'

/**
 * RECONCILIAÇÃO — "os números fecham?". Base de confiabilidade da Analytics: por rede, quantas
 * publicações, vídeos distintos, republicações, registros manuais (sem post_id) e a cobertura
 * de cada métrica. Nada de recomendação vale se isto não fechar.
 */
export function ReconciliacaoPanel() {
  const { data, isLoading } = useReconciliacao()

  if (isLoading) return <div className="h-72 animate-pulse rounded-2xl bg-[#1a1922]" />
  if (!data) return null

  const cobRotulos = data.redes[0]?.cobertura.map((c) => c.rotulo) ?? []

  return (
    <div className="space-y-4">
      {/* topo: a conta fecha? */}
      <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Database className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Os números fecham?</h2>
          <span className="ml-auto text-[11px] text-zinc-500">última coleta {fmtData(data.ultimaColeta)}</span>
        </div>
        <p className="text-sm text-zinc-300">
          <b className="text-white">{data.totalLinhas}</b> publicações ={' '}
          <b className="text-white">{data.totalPares}</b> pares vídeo-rede{' '}
          <span className="text-zinc-500">
            + {data.totalRepublicacoes} republicaç{data.totalRepublicacoes === 1 ? 'ão' : 'ões'}
          </span>
          {' '}(o mesmo vídeo repostado — os dois posts existem, mas o vídeo conta 1×).
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Vídeos-base: <b className="text-zinc-300">{data.ideiasPublicadas}</b> publicados de{' '}
          <b className="text-zinc-300">{data.ideiasTotais}</b> ideias no banco. Uma publicação é uma
          ideia numa rede; um snapshot é uma leitura de métrica. São coisas distintas.
        </p>
      </div>

      {/* tabela por rede */}
      <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
        <h3 className="mb-3 text-sm font-semibold text-zinc-300">Por rede</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="text-zinc-500">
              <tr>
                <th className="pb-2 font-medium">Rede</th>
                <th className="pb-2 text-right font-medium">Publicações</th>
                <th className="pb-2 text-right font-medium">Vídeos</th>
                <th className="pb-2 text-right font-medium">Repost</th>
                <th className="pb-2 text-right font-medium">Sem link</th>
                {cobRotulos.map((r) => (
                  <th key={r} className="pb-2 text-right font-medium capitalize">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {data.redes.map((rede) => (
                <tr key={rede.plataforma} className="border-t border-white/5">
                  <td className="py-2 font-medium text-zinc-100">{NOME_REDE[rede.plataforma] || rede.plataforma}</td>
                  <td className="py-2 text-right tabular-nums">{rede.linhas}</td>
                  <td className="py-2 text-right tabular-nums text-zinc-400">{rede.videos}</td>
                  <td className="py-2 text-right tabular-nums text-zinc-500">{rede.republicacoes || '—'}</td>
                  <td className="py-2 text-right tabular-nums">
                    {rede.semPostId ? <span className="text-amber-400">{rede.semPostId}</span> : <span className="text-zinc-600">—</span>}
                  </td>
                  {rede.cobertura.map((c) => (
                    <td key={c.rotulo} className="py-2 text-right tabular-nums">
                      {c.suportada ? (
                        <span className={c.tem >= rede.videos * 0.8 ? 'text-emerald-400' : 'text-amber-400'}>
                          {c.tem}/{rede.videos}
                        </span>
                      ) : (
                        <span className="text-zinc-700" title="a API desta rede não entrega esta métrica">indisp.</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 space-y-1 text-[11px] text-zinc-500">
          <p className="flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            <b className="text-zinc-400">Sem link</b> = registro manual sem id externo (Kwai não tem API — postado à mão).
          </p>
          <p className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <b className="text-zinc-400">indisp.</b> = a API daquela rede não entrega a métrica. Não é dado faltando; é dado que não existe. Nunca vira zero.
          </p>
        </div>
      </div>
    </div>
  )
}
