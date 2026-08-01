'use client'

import Link from 'next/link'
import { Film } from 'lucide-react'

import { useCentralPublicacao } from '@/lib/hooks/use-central-publicacao'
import { REDES_PADRAO } from '@/lib/hooks/use-central-publicacao'

/**
 * LISTA DE VÍDEOS — só a linha: thumb, número, título, em que redes já saiu, e o botão que leva
 * pra ficha.
 *
 * Era um acordeão com formulário de título/legenda por rede dentro. Aquilo mudou de casa: o
 * conteúdo de publicação agora vive na ficha do vídeo (/video/[id]), junto do roteiro, do áudio,
 * das cenas e do desempenho. O dono resumiu por que: se a legenda mora aqui e a ficha também
 * mostra legenda, o app tem duas versões da mesma coisa esperando pra divergir.
 */

const COR_REDE: Record<string, string> = {
  youtube: 'bg-[#3987e5]', instagram: 'bg-[#199e70]', facebook: 'bg-[#c98500]',
  tiktok: 'bg-[#008300]', kwai: 'bg-[#9085e9]',
}

export function ListaVideos() {
  const { data, isLoading } = useCentralPublicacao()

  if (isLoading) {
    return <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-zinc-900/50" />)}</div>
  }
  if (!data?.length) return null

  const prontos = data.filter((v) => v.pronto).length

  return (
    <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Film className="h-4 w-4 text-violet-400" />
        <h2 className="text-sm font-semibold text-white">Vídeos</h2>
        <span className="ml-auto text-[11px] text-zinc-500">{data.length} no total · {prontos} prontos</span>
      </div>
      <p className="mb-3 text-[11px] text-zinc-600">
        Legenda por rede, passo a passo, roteiro, custo e desempenho ficam em <b className="text-zinc-500">detalhes</b> — um lugar só por vídeo.
      </p>

      <div className="space-y-1.5">
        {data.map((v) => (
          <div key={v.pipelineId} className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/20 p-2.5">
            {v.thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.thumb} alt="" className="h-11 w-7 shrink-0 rounded object-cover ring-1 ring-white/10" loading="lazy" />
            ) : (
              <span className="flex h-11 w-7 shrink-0 items-center justify-center rounded bg-zinc-800 text-[10px] text-zinc-600">🎬</span>
            )}
            <span className="w-10 shrink-0 text-xs font-bold tabular-nums text-zinc-500">{v.numero != null ? `#${v.numero}` : '—'}</span>
            <Link href={`/video/${v.ideiaId}`} className="min-w-0 flex-1 truncate text-sm text-zinc-200 hover:text-violet-300" title={v.titulo}>
              {v.titulo}
            </Link>
            {!v.pronto && <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">a montar</span>}
            <div className="hidden shrink-0 gap-1 sm:flex">
              {REDES_PADRAO.map((r) => (
                <span
                  key={r}
                  title={v.publicadoEm.includes(r) ? `${r}: publicado${v.publicadoDatas[r] ? ` em ${v.publicadoDatas[r]}` : ''}` : `${r}: ainda não`}
                  className={`h-2 w-2 rounded-full ${v.publicadoEm.includes(r) ? COR_REDE[r] : 'bg-zinc-700'}`}
                />
              ))}
            </div>
            <Link
              href={`/video/${v.ideiaId}`}
              className="shrink-0 rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400 hover:border-violet-500/40 hover:text-violet-300"
            >
              detalhes
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
