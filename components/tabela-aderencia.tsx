'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { BarChart3, ChevronLeft, ChevronRight, Eye, Search } from 'lucide-react'

import { REDE_EMOJI, REDE_LABEL, useAprendizados } from '@/lib/hooks/use-aprendizados'
import type { VideoAderencia } from '@/lib/hooks/use-aderencia'

/**
 * A TABELA CRESCE PARA SEMPRE — e por isso precisa de leme.
 *
 * Eram 124 linhas de uma vez, ordenadas só por views. Achar "o vídeo de ontem" ou "quais ainda
 * não foram pro Kwai" virava rolagem no olho. O padrão de uso do dono é sempre um destes três:
 * o mais recente, um número específico ("o 118"), ou o que está faltando em alguma rede.
 * Cada um virou um controle.
 *
 * Ordem padrão = data decrescente, não views: o trabalho do dia mora no topo.
 */

const PLATAFORMA_LABEL: Record<string, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  kwai: 'Kwai',
}
const ORDEM_PLATAFORMAS = ['youtube', 'instagram', 'facebook', 'tiktok', 'kwai']
const POR_PAGINA = 25

type Ordem = 'data' | 'numero' | 'views'

function n(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    notation: value >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

function dataCurta(iso: string) {
  if (!iso) return '—'
  // As datas de publicação são timestamptz; mostramos no fuso do dono.
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo',
  })
}

function verticalCurta(canalNome: string) {
  return canalNome.replace(/^PULSO\s*/i, '')
}

export function TabelaAderencia({ videos, totalViews }: { videos: VideoAderencia[]; totalViews: number }) {
  const apr = useAprendizados()
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState<Ordem>('data')
  const [faltando, setFaltando] = useState<string>('') // '' = todas | 'incompletos' | nome da rede
  const [pagina, setPagina] = useState(0)

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    // "118" e "#118" acham o mesmo vídeo — é assim que o dono digita.
    const numeroBuscado = termo.replace(/^#/, '')
    let lista = videos.filter((v) => {
      if (termo) {
        const casaTexto = v.titulo.toLowerCase().includes(termo) || v.canalNome.toLowerCase().includes(termo)
        const casaNumero = /^\d+$/.test(numeroBuscado) && v.numero === Number(numeroBuscado)
        if (!casaTexto && !casaNumero) return false
      }
      if (faltando === 'incompletos') return ORDEM_PLATAFORMAS.some((p) => !v.plataformas[p])
      if (faltando) return !v.plataformas[faltando]
      return true
    })
    lista = [...lista].sort((a, b) => {
      if (ordem === 'numero') return (b.numero ?? -1) - (a.numero ?? -1)
      if (ordem === 'views') return b.totalViews - a.totalViews
      return b.dataPublicacao < a.dataPublicacao ? -1 : 1
    })
    return lista
  }, [videos, busca, ordem, faltando])

  const paginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaAtual = Math.min(pagina, paginas - 1)
  const visiveis = filtrados.slice(paginaAtual * POR_PAGINA, (paginaAtual + 1) * POR_PAGINA)
  const mudar = (fn: () => void) => { fn(); setPagina(0) }

  return (
    <div className="glass overflow-hidden rounded-2xl border border-zinc-800/50">
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/50 p-6 pb-4">
        <BarChart3 className="h-5 w-5 text-violet-400" />
        <h2 className="text-lg font-semibold text-white">Vídeos publicados × plataformas</h2>
        <span className="ml-auto flex items-center gap-1 text-sm text-zinc-500">
          <Eye className="h-4 w-4" /> {n(totalViews)} views totais
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/50 px-6 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            value={busca}
            onChange={(e) => mudar(() => setBusca(e.target.value))}
            placeholder="número, título ou canal…"
            className="w-56 rounded-lg border border-zinc-800 bg-zinc-900/60 py-1.5 pl-8 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
          />
        </div>

        <select
          value={ordem}
          onChange={(e) => mudar(() => setOrdem(e.target.value as Ordem))}
          className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1.5 text-sm text-zinc-300 focus:border-violet-500/50 focus:outline-none"
        >
          <option value="data">Mais recentes</option>
          <option value="numero">Número ↓</option>
          <option value="views">Mais vistos</option>
        </select>

        <select
          value={faltando}
          onChange={(e) => mudar(() => setFaltando(e.target.value))}
          className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1.5 text-sm text-zinc-300 focus:border-violet-500/50 focus:outline-none"
        >
          <option value="">Todas as redes</option>
          <option value="incompletos">Só incompletos</option>
          {ORDEM_PLATAFORMAS.map((p) => (
            <option key={p} value={p}>Falta {PLATAFORMA_LABEL[p]}</option>
          ))}
        </select>

        <span className="ml-auto text-xs text-zinc-500">
          {filtrados.length === videos.length
            ? `${videos.length} vídeos`
            : `${filtrados.length} de ${videos.length}`}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800/50 text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-3 py-3">#</th>
              <th className="px-3 py-3">Data</th>
              <th className="px-6 py-3">Vídeo</th>
              <th className="px-3 py-3">Vertical</th>
              {ORDEM_PLATAFORMAS.map((p) => (
                <th key={p} className="px-3 py-3 text-right">{PLATAFORMA_LABEL[p]}</th>
              ))}
              <th className="px-3 py-3 text-right">Total</th>
              <th className="px-6 py-3 text-right">Cobertura</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((v) => (
              <tr key={v.ideiaId} className="border-b border-zinc-800/30 hover:bg-zinc-900/40">
                {/* O dono chama o vídeo pelo número ("posta o 118"), não pelo título — e o
                    número é o mesmo que vai na legenda das redes. */}
                <td className="whitespace-nowrap px-3 py-3 text-xs tabular-nums text-zinc-500">
                  {v.numero != null ? `#${v.numero}` : '—'}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-xs tabular-nums text-zinc-500">
                  {dataCurta(v.dataPublicacao)}
                </td>
                <td className="max-w-xs truncate px-6 py-3" title={v.titulo}>
                  <Link href={`/video/${v.ideiaId}`} className="text-zinc-200 hover:text-violet-300 hover:underline">
                    {v.titulo}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-zinc-400">
                  <div className="flex items-center gap-1.5">
                    <span>{verticalCurta(v.canalNome)}</span>
                    {(() => {
                      const r = apr.data?.redeRecomendadaNome(v.canalNome)
                      return r ? (
                        <span
                          className="rounded bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-teal-300 ring-1 ring-teal-500/25"
                          title="Rede que mais entrega pra esse canal"
                        >
                          {REDE_EMOJI[r]} {REDE_LABEL[r]}
                        </span>
                      ) : null
                    })()}
                  </div>
                </td>
                {ORDEM_PLATAFORMAS.map((p) => {
                  const m = v.plataformas[p]
                  return (
                    <td key={p} className="whitespace-nowrap px-3 py-3 text-right">
                      {m ? (
                        m.url_publicacao ? (
                          <a
                            href={m.url_publicacao}
                            target="_blank"
                            rel="noreferrer"
                            className="text-zinc-200 underline-offset-2 hover:text-violet-300 hover:underline"
                          >
                            {n(m.views || 0)}
                          </a>
                        ) : (
                          <span className="text-zinc-200">{n(m.views || 0)}</span>
                        )
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  )
                })}
                <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-white">
                  {n(v.totalViews)}
                </td>
                <td className="whitespace-nowrap px-6 py-3 text-right">
                  {(() => {
                    const faltam = ORDEM_PLATAFORMAS.filter((p) => !v.plataformas[p])
                    if (faltam.length === 0)
                      return <span className="text-xs font-semibold text-emerald-400">5/5</span>
                    return (
                      <span className="text-xs text-amber-300/90" title={`Ainda não está em: ${faltam.map((p) => PLATAFORMA_LABEL[p]).join(', ')}`}>
                        {ORDEM_PLATAFORMAS.length - faltam.length}/5 · falta {faltam.map((p) => PLATAFORMA_LABEL[p].slice(0, 2)).join(', ')}
                      </span>
                    )
                  })()}
                </td>
              </tr>
            ))}
            {visiveis.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-10 text-center text-sm text-zinc-500">
                  Nenhum vídeo com esse filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {paginas > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-800/50 px-6 py-3 text-sm">
          <span className="text-xs text-zinc-500">
            {paginaAtual * POR_PAGINA + 1}–{Math.min((paginaAtual + 1) * POR_PAGINA, filtrados.length)} de {filtrados.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagina((p) => Math.max(0, p - 1))}
              disabled={paginaAtual === 0}
              className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-30 disabled:hover:border-zinc-800"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs tabular-nums text-zinc-400">{paginaAtual + 1} / {paginas}</span>
            <button
              onClick={() => setPagina((p) => Math.min(paginas - 1, p + 1))}
              disabled={paginaAtual >= paginas - 1}
              className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-30 disabled:hover:border-zinc-800"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
