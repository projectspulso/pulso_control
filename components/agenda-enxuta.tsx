'use client'

import { AlertTriangle, CalendarDays, CheckCircle2, Flame, Layers } from 'lucide-react'
import Link from 'next/link'

import { classificarTema, PAPEL_NO_FACEBOOK, MEDIANA_FB_MEDIDA, type Tema } from '@/lib/decisor/temas'

/**
 * A AGENDA EM TRÊS BLOCOS — hoje, próximos dias, e o que está travando.
 *
 * A tela anterior era uma grade de 28 dias com filtros (canal, faixa, grid/lista) e a trilha do
 * funil: 336 linhas onde a decisão do dia se escondia. Grade grande parece completa e não é —
 * ninguém lê 84 células pra descobrir o que publicar hoje.
 *
 * Aqui cada item vem com o TEMA e o que ele significa no Facebook, porque é o sinal que decide
 * (história/arqueologia tem mediana 2.919 e monopoliza os estouros; tecnologia/IA 268 e zero).
 * O calendário completo continua existindo como consulta, embaixo — não como a tela principal.
 */

export interface ItemAgenda {
  data: string
  horario: string
  faixa: string
  ideiaId: string | null
  titulo: string | null
  estagio: string
}

const ESTAGIO_ROTULO: Record<string, { txt: string; cor: string }> = {
  video: { txt: 'vídeo pronto', cor: 'bg-emerald-500/10 text-emerald-300' },
  audio: { txt: 'áudio', cor: 'bg-sky-500/10 text-sky-300' },
  roteiro: { txt: 'roteiro', cor: 'bg-amber-500/10 text-amber-300' },
  ideia: { txt: 'só ideia', cor: 'bg-zinc-700/40 text-zinc-400' },
  vazio: { txt: 'vazio', cor: 'bg-red-500/10 text-red-300' },
}

/** Dias mínimos até virar vídeo publicável — mesma régua do roteador. */
const DIAS_ATE_PRONTO: Record<string, number> = { video: 0, audio: 1, roteiro: 2, ideia: 3, vazio: 99 }

function diasEntre(deISO: string, ateISO: string) {
  return Math.round(
    (new Date(`${ateISO}T00:00:00Z`).getTime() - new Date(`${deISO}T00:00:00Z`).getTime()) / 86_400_000
  )
}

function ChipTema({ tema }: { tema: Tema }) {
  const papel = PAPEL_NO_FACEBOOK[tema]
  const cor =
    papel === 'sorteia'
      ? 'bg-emerald-500/10 text-emerald-300'
      : papel === 'morto'
        ? 'bg-red-500/10 text-red-300'
        : 'bg-zinc-800/70 text-zinc-400'
  const titulo =
    papel === 'sorteia'
      ? `mediana ${MEDIANA_FB_MEDIDA[tema]} no Facebook — os 6 estouros de 48 dias saíram deste tema`
      : papel === 'morto'
        ? `mediana ${MEDIANA_FB_MEDIDA[tema]} no Facebook e zero estouros em 48 dias`
        : `mediana ${MEDIANA_FB_MEDIDA[tema]} no Facebook, sem estouro registrado`
  return (
    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${cor}`} title={titulo}>
      {tema}
    </span>
  )
}

function Linha({ item, hoje }: { item: ItemAgenda; hoje: string }) {
  const est = ESTAGIO_ROTULO[item.estagio] || ESTAGIO_ROTULO.vazio
  const tema = item.titulo ? classificarTema(item.titulo) : null
  const atrasado = diasEntre(hoje, item.data) < (DIAS_ATE_PRONTO[item.estagio] ?? 0)

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-white/8 bg-black/20 px-3.5 py-2.5">
      <span className="w-12 shrink-0 text-xs tabular-nums text-zinc-500">{item.horario.slice(0, 5)}</span>
      {item.ideiaId ? (
        <Link
          href={`/analytics/videos/${item.ideiaId}`}
          className="min-w-0 flex-1 truncate text-sm text-zinc-200 hover:text-white hover:underline"
          title={item.titulo || ''}
        >
          {item.titulo}
        </Link>
      ) : (
        <span className="min-w-0 flex-1 text-sm text-red-300/80">sem conteúdo atribuído</span>
      )}
      {tema && <ChipTema tema={tema} />}
      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${est.cor}`}>{est.txt}</span>
      {atrasado && (
        <span className="shrink-0 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-300" title="não dá tempo de ficar pronto até a data">
          não fica pronto
        </span>
      )}
    </div>
  )
}

export function AgendaEnxuta({ itens, hoje }: { itens: ItemAgenda[]; hoje: string }) {
  const doDia = itens.filter((i) => i.data === hoje)
  const proximos = itens.filter((i) => i.data > hoje).slice(0, 8)

  // TRAVANDO: slot sem conteúdo, ou com item que não fica pronto a tempo. É o que exige ação —
  // o resto é só o plano seguindo.
  const travando = itens.filter(
    (i) => !i.ideiaId || diasEntre(hoje, i.data) < (DIAS_ATE_PRONTO[i.estagio] ?? 0)
  )

  const porData = new Map<string, ItemAgenda[]>()
  for (const i of proximos) {
    if (!porData.has(i.data)) porData.set(i.data, [])
    porData.get(i.data)!.push(i)
  }

  const fmt = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })

  return (
    <div className="space-y-4">
      {/* ══════ HOJE ══════ */}
      <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-lg bg-violet-500/10 p-2">
            <Flame className="h-5 w-5 text-violet-400" />
          </span>
          <h2 className="text-lg font-semibold text-white">Publicar hoje</h2>
          <span className="ml-auto text-[11px] text-zinc-500">{fmt(hoje)}</span>
        </div>
        {doDia.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">Nenhum slot hoje na grade.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {doDia.map((i) => (
              <Linha key={i.data + i.horario} item={i} hoje={hoje} />
            ))}
          </div>
        )}
        <p className="mt-3 text-[10px] text-zinc-600">
          O tema decide: história/arqueologia é o único que estourou no Facebook em 48 dias
          (mediana 2.919); tecnologia/IA e produtividade têm ~260 e nenhum estouro. Passe o mouse no
          chip pra ver o número.
        </p>
      </div>

      {/* ══════ TRAVANDO ══════ */}
      {travando.length > 0 && (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.04] p-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-lg bg-red-500/10 p-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </span>
            <h2 className="text-lg font-semibold text-white">O que está travando</h2>
            <span className="ml-auto text-[11px] text-zinc-500">{travando.length} slot(s)</span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-400">
            Slot sem conteúdo, ou com item que não fica pronto até a data — cada etapa (roteiro,
            áudio, render) leva cerca de um dia.
          </p>
          <div className="mt-4 space-y-2">
            {travando.slice(0, 6).map((i) => (
              <div key={i.data + i.horario} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="w-24 shrink-0 text-xs text-zinc-500">{fmt(i.data)}</span>
                <span className="min-w-0 flex-1 truncate text-zinc-300">
                  {i.titulo || <span className="text-red-300/80">sem conteúdo atribuído</span>}
                </span>
                <span className="shrink-0 text-[11px] text-zinc-500">{i.estagio}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════ PRÓXIMOS DIAS ══════ */}
      <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-lg bg-zinc-500/10 p-2">
            <CalendarDays className="h-5 w-5 text-zinc-400" />
          </span>
          <h2 className="text-lg font-semibold text-white">Próximos dias</h2>
        </div>
        {porData.size === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">Nada planejado à frente.</p>
        ) : (
          <div className="mt-4 space-y-3.5">
            {[...porData.entries()].map(([data, lista]) => (
              <div key={data}>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">{fmt(data)}</p>
                <div className="space-y-1.5">
                  {lista.map((i) => (
                    <Linha key={i.data + i.horario} item={i} hoje={hoje} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** Resumo de uma linha pro topo — quantos do tema que sorteia estão planejados. */
export function ResumoTemas({ itens }: { itens: ItemAgenda[] }) {
  const comTitulo = itens.filter((i) => i.titulo)
  if (comTitulo.length === 0) return null
  const sorteia = comTitulo.filter((i) => PAPEL_NO_FACEBOOK[classificarTema(i.titulo!)] === 'sorteia').length
  const morto = comTitulo.filter((i) => PAPEL_NO_FACEBOOK[classificarTema(i.titulo!)] === 'morto').length
  const pct = Math.round((sorteia / comTitulo.length) * 100)
  const fraco = pct < 20

  return (
    <div className={`flex flex-wrap items-center gap-2.5 rounded-2xl border p-4 ${fraco ? 'border-amber-500/25 bg-amber-500/[0.04]' : 'border-white/8 bg-[#1a1922]'}`}>
      {fraco ? <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" /> : <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
      <p className="text-sm text-zinc-300">
        <strong className={fraco ? 'text-amber-300' : 'text-emerald-300'}>
          {sorteia} de {comTitulo.length}
        </strong>{' '}
        do que está planejado é história/arqueologia — o único tema que estourou no Facebook.
        {morto > 0 && <span className="text-zinc-500"> {morto} em tema sem estouro registrado.</span>}
      </p>
      <Link href="/decisor" className="ml-auto shrink-0 text-[11px] text-zinc-500 hover:text-zinc-300">
        ver no Decisor →
      </Link>
    </div>
  )
}

export { Layers }
