'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CalendarClock, PlugZap, ThumbsDown } from 'lucide-react'

import { useFlops, type FlopComContexto } from '@/lib/hooks/use-flops'
import type { MotivoFlop } from '@/lib/analytics/flops'

/**
 * FLOPS — o inverso do radar de estouro, que só olhava pra cima.
 *
 * A tela existe separada por MOTIVO de propósito. Juntar os três baldes dá conclusão errada: em
 * 04/08 eu mesmo li 5 zeros do Facebook como rejeição do público, quando 3 deles nunca tinham sido
 * entregues (postados via API, que a Meta estrangula). Vídeo que ninguém viu não flopou — ficou
 * na gaveta.
 */

const NOME_REDE: Record<string, string> = {
  youtube: 'YouTube', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', kwai: 'Kwai',
}

const BALDES: Array<{
  id: MotivoFlop; titulo: string; sub: string; icone: React.ReactNode; cor: string; acao: string
}> = [
  {
    id: 'nao_entregue',
    titulo: 'Não foi entregue',
    sub: 'a rede não mostrou pra ninguém — não é o conteúdo, é o canal de publicação',
    icone: <PlugZap className="h-4 w-4" />,
    cor: 'text-red-300',
    acao: 'Republicar do jeito certo. Para a audiência é estreia, não repost: o alcance foi de 0 a 2 pessoas.',
  },
  {
    id: 'sem_publicar',
    titulo: 'Nunca foi publicado nessa rede',
    sub: 'o vídeo existe, a rede não recebeu',
    icone: <AlertTriangle className="h-4 w-4" />,
    cor: 'text-amber-300',
    acao: 'É só publicar. Cada linha aqui é alcance que já foi produzido e está parado.',
  },
  {
    id: 'entregue_fraco',
    titulo: 'Entregue e não pegou',
    sub: 'teve alcance normal e mesmo assim ninguém quis — o único balde que ensina',
    icone: <ThumbsDown className="h-4 w-4" />,
    cor: 'text-zinc-400',
    acao: 'Não republicar. Aqui o dado serve para escolher o que NÃO produzir de novo — descontando os mais antigos, que rodaram em contas recém-criadas e quase sem distribuição.',
  },
]

function Linha({ f }: { f: FlopComContexto }) {
  const corTema = f.papelNoFacebook === 'sorteia' ? 'text-emerald-400'
    : f.papelNoFacebook === 'morto' ? 'text-red-400/80' : 'text-zinc-600'
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-white/8 bg-black/20 px-3 py-2">
      <span className="w-10 shrink-0 text-[11px] font-bold tabular-nums text-zinc-500">
        {f.numero != null ? `#${f.numero}` : '—'}
      </span>
      <span className="w-20 shrink-0 text-[11px] text-zinc-400">{NOME_REDE[f.plataforma] || f.plataforma}</span>
      <Link href={`/video/${f.ideiaId}`} className="min-w-0 flex-1 truncate text-xs text-zinc-300 hover:text-violet-300" title={f.titulo}>
        {f.titulo}
      </Link>
      <span className={`shrink-0 text-[10px] ${corTema}`} title={`papel no Facebook: ${f.papelNoFacebook}`}>{f.tema}</span>
      <span className="shrink-0 text-[10px] tabular-nums text-zinc-600" title={f.explicacao}>
        {f.motivo === 'sem_publicar' ? '—' : `${f.views} / med ${f.medianaRede}`}
      </span>
      {/* A idade importa para julgar: os primeiros vídeos rodaram em contas recém-criadas, que
          quase não recebem distribuição. Flop de conta nova não é flop de conteúdo. */}
      <span className="w-12 shrink-0 text-right text-[10px] tabular-nums text-zinc-700">
        {f.idadeDias != null ? `${f.idadeDias}d` : ''}
      </span>
    </div>
  )
}

export function FlopsPanel() {
  const { data, isLoading } = useFlops()
  const [aberto, setAberto] = useState<MotivoFlop | null>('nao_entregue')

  if (isLoading || !data) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-[#1a1922]" />)}</div>
  }

  const recuperaveis = data.flops.filter((f) => f.recuperavel).length

  return (
    <div className="space-y-3.5">
      {/* fila de recuperação + a trava do desafio */}
      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.05] p-5">
        <div className="flex flex-wrap items-center gap-2">
          <CalendarClock className="h-4 w-4 shrink-0 text-violet-400" />
          <h2 className="text-base font-semibold text-white">Fila de recuperação</h2>
          <span className="ml-auto text-sm font-semibold tabular-nums text-violet-300">
            {recuperaveis} publicações recuperáveis
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">
          {data.liberaEm ? (
            <>
              Programada para <strong className="text-violet-200">depois do dia 100 ({new Date(`${data.liberaEm}T12:00:00`).toLocaleDateString('pt-BR')})</strong>
              {data.diasAteLiberar != null && data.diasAteLiberar > 0 && <> — faltam {data.diasAteLiberar} dias</>}.
              Durante o desafio, um repost concorreria com a grade do dia e sujaria a leitura de qual vídeo rendeu o quê.
            </>
          ) : (
            <>Sem data do desafio configurada — a fila fica liberada.</>
          )}
        </p>
      </div>

      {BALDES.map((b) => {
        const lista = data.flops.filter((f) => f.motivo === b.id)
        const abertoAqui = aberto === b.id
        return (
          <div key={b.id} className="rounded-2xl border border-white/8 bg-[#1a1922] p-5">
            <button onClick={() => setAberto(abertoAqui ? null : b.id)} className="flex w-full flex-wrap items-center gap-2 text-left">
              <span className={b.cor}>{b.icone}</span>
              <h2 className="text-base font-semibold text-white">{b.titulo}</h2>
              <span className={`rounded-md bg-white/5 px-2 py-0.5 text-xs font-semibold tabular-nums ${b.cor}`}>{lista.length}</span>
              <span className="ml-auto text-[11px] text-zinc-600">{abertoAqui ? 'ocultar' : 'ver lista'}</span>
            </button>
            <p className="mt-1 text-[11px] text-zinc-500">{b.sub}</p>
            <p className="mt-2 rounded-lg border border-white/8 bg-black/20 px-3 py-2 text-[11px] leading-relaxed text-zinc-400">
              {b.acao}
            </p>

            {abertoAqui && (
              <div className="mt-3 max-h-96 space-y-1 overflow-y-auto pr-1">
                {lista.length === 0
                  ? <p className="text-xs text-zinc-600">Nada aqui — e isso é bom.</p>
                  : lista
                      .slice()
                      .sort((a, c) => (a.numero ?? 0) - (c.numero ?? 0))
                      .map((f) => <Linha key={`${f.ideiaId}|${f.plataforma}|${f.motivo}`} f={f} />)}
              </div>
            )}
          </div>
        )
      })}

      <p className="px-1 text-[10px] leading-relaxed text-zinc-600">
        O corte é <b className="text-zinc-500">relativo à mediana de cada rede</b>, nunca um número fixo: 100 views é
        normal no Instagram (mediana {data.medianas.instagram}) e fraco no Kwai (mediana {data.medianas.kwai}).
        Publicação com menos de 7 dias não entra — a rede ainda está distribuindo.
        Base: {data.totalPublicacoes} publicações.
      </p>
    </div>
  )
}
