'use client'

import { AlertTriangle, CalendarDays, CheckCircle2, ExternalLink, Flame, Layers } from 'lucide-react'
import Link from 'next/link'

import { classificarTema, PAPEL_NO_FACEBOOK } from '@/lib/decisor/temas'
import { useDecisor } from '@/lib/hooks/use-decisor'

/**
 * AS PEÇAS DA AGENDA — o que está travando e o calendário.
 *
 * A tela /agenda foi eliminada em 14/08/2026: tinha zero botões e zero mutations, e o único
 * conteúdo exclusivo dela eram estas duas seções. Quem agenda de fato é a Central de Publicação,
 * então é lá que elas passam a viver, como a aba Calendário. O "Publicar hoje" não veio junto —
 * duplicava o Plano do dia da própria Central.
 *
 * Cada item vem com o TEMA e o que ele significa no Facebook, porque é o sinal que decide:
 * história/arqueologia detém os 6 estouros de 48 dias, e nenhum outro tema produziu um.
 * E leva o LINK DO ARQUIVO junto — "ter tudo ligado" era o pedido, então dá pra ir da data até
 * o vídeo sem trocar de tela.
 */

export interface ItemAgenda {
  data: string
  horario: string
  faixa: string
  ideiaId: string | null
  titulo: string | null
  estagio: string
  /** arquivo do vídeo quando já existe — "ter tudo ligado" era o pedido: a agenda leva ao que vai ao ar */
  videoUrl?: string | null
  numero?: number | null
  /** roteiro — o tema sai dele quando o título não diz o assunto, igual ao roteador do servidor */
  corpo?: string | null
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

/**
 * SLOTS TRAVADOS — slot sem conteúdo, ou com item que não fica pronto até a data.
 *
 * Exportado à parte porque a tela /agenda foi eliminada (não tinha ação nenhuma: zero botões,
 * zero mutations) e estas duas seções eram a única coisa que só existia lá. Agora vivem na aba
 * Calendário da Central de Publicação, junto de quem de fato agenda. O "Publicar hoje" da antiga
 * agenda não veio junto: duplicava o Plano do dia da mesma tela.
 */
export function SlotsTravando({ itens, hoje }: { itens: ItemAgenda[]; hoje: string }) {
  const travando = itens.filter(
    (i) => !i.ideiaId || diasEntre(hoje, i.data) < (DIAS_ATE_PRONTO[i.estagio] ?? 0)
  )
  if (travando.length === 0) return null
  const fmt = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })

  return (
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
  )
}

/**
 * CALENDÁRIO ÚNICO. Antes havia "próximos dias" (lista de 8) MAIS o "calendário do mês" logo
 * abaixo — duas visões do mesmo plano, e o dono apontou: "parece duplicidade e sem função,
 * emagrecer é ter um local só para ver as coisas". Ficou um só: cada dia mostra seus slots com
 * horário, tema e o link do arquivo, então dá pra ir da data até o vídeo sem trocar de tela.
 */
export function CalendarioAgenda({ itens, hoje }: { itens: ItemAgenda[]; hoje: string }) {
  const futuros = itens.filter((i) => i.data > hoje)
  const porData = new Map<string, ItemAgenda[]>()
  for (const i of futuros) {
    if (!porData.has(i.data)) porData.set(i.data, [])
    porData.get(i.data)!.push(i)
  }
  const dias = [...porData.entries()]

  return (
    <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="rounded-lg bg-zinc-500/10 p-2">
          <CalendarDays className="h-5 w-5 text-zinc-400" />
        </span>
        <h2 className="text-lg font-semibold text-white">Calendário</h2>
        <span className="ml-auto text-[11px] text-zinc-500">{dias.length} dias planejados</span>
      </div>

      {dias.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">Nada planejado à frente.</p>
      ) : (
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {dias.map(([data, lista]) => {
            const dt = new Date(`${data}T12:00:00`)
            const fds = dt.getDay() === 0 || dt.getDay() === 6
            return (
              <div key={data} className={`rounded-xl border p-3 ${fds ? 'border-white/5 bg-black/30' : 'border-white/8 bg-black/20'}`}>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  {dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                </p>
                <div className="space-y-1.5">
                  {lista.map((i) => {
                    const tema = i.titulo ? classificarTema(i.titulo, i.corpo) : null
                    const papel = tema ? PAPEL_NO_FACEBOOK[tema] : null
                    const cor =
                      papel === 'sorteia' ? 'border-l-emerald-500' : papel === 'morto' ? 'border-l-red-500/70' : 'border-l-zinc-700'
                    return (
                      <div key={i.horario} className={`border-l-2 pl-2 ${cor}`}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] tabular-nums text-zinc-500">{i.horario.slice(0, 5)}</span>
                          {i.numero != null && <span className="text-[10px] text-zinc-600">#{i.numero}</span>}
                          <span className={`ml-auto rounded px-1 text-[9px] ${ESTAGIO_ROTULO[i.estagio]?.cor || ESTAGIO_ROTULO.vazio.cor}`}>
                            {ESTAGIO_ROTULO[i.estagio]?.txt || 'vazio'}
                          </span>
                          {i.videoUrl && (
                            <a href={i.videoUrl} target="_blank" rel="noopener noreferrer" title="abrir o arquivo do vídeo" className="text-zinc-600 hover:text-zinc-300">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        {i.ideiaId ? (
                          <Link href={`/video/${i.ideiaId}`} className="block truncate text-[12px] leading-snug text-zinc-300 hover:text-white" title={i.titulo || ''}>
                            {i.titulo}
                          </Link>
                        ) : (
                          <span className="block text-[12px] text-red-300/70">sem conteúdo</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <p className="mt-3 text-[10px] text-zinc-600">
        Barra verde = tema que estoura no Facebook · vermelha = tema sem estouro registrado. O ícone
        abre o arquivo do vídeo; o título abre a página dele.
      </p>
    </div>
  )
}

/** Resumo de uma linha pro topo — quantos do tema que sorteia estão planejados. */
export function ResumoTemas({ itens }: { itens: ItemAgenda[] }) {
  const comTitulo = itens.filter((i) => i.titulo)
  if (comTitulo.length === 0) return null
  const sorteia = comTitulo.filter((i) => PAPEL_NO_FACEBOOK[classificarTema(i.titulo!, i.corpo)] === 'sorteia').length
  const morto = comTitulo.filter((i) => PAPEL_NO_FACEBOOK[classificarTema(i.titulo!, i.corpo)] === 'morto').length
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

/**
 * O RADAR MANDA NO PLANO. Plano que ignora o que está acontecendo agora é plano morto: os dois
 * virais de 17/07 subiram 4 dias seguidos e a agenda continuou tocando a grade como se nada —
 * ninguém cross-postou nem emendou sequência do tema. Com ~6% de acerto no Facebook, surfar o
 * bilhete premiado vale mais que cumprir o planejado.
 *
 * Aparece SÓ quando há estouro em curso (fatos.radar do /api/decisor, cacheado pelo React Query).
 * Sem estouro, a agenda fica limpa — banner permanente vira papel de parede.
 */
export function BannerEstouro() {
  const { data } = useDecisor()
  const radar = data?.fatos.radar ?? []
  if (radar.length === 0) return null
  const top = radar[0]

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="rounded-lg bg-amber-500/10 p-2">
          <Flame className="h-5 w-5 text-amber-400" />
        </span>
        <p className="min-w-0 flex-1 text-sm leading-snug text-zinc-200">
          <strong className="text-amber-300">Rasga o plano:</strong>{' '}
          <Link href={`/video/${top.ideiaId}`} className="underline decoration-amber-500/40 hover:text-white">
            {top.titulo}
          </Link>{' '}
          está a <strong className="text-amber-300">{top.multiplo}×</strong> a mediana do{' '}
          {top.plataforma === 'instagram' ? 'Instagram' : top.plataforma} agora
          {radar.length > 1 && <> (+{radar.length - 1} em alta)</>}. Enquanto está quente: publique{' '}
          <strong className="text-zinc-100">sequência do tema &ldquo;{top.tema}&rdquo;</strong> hoje e confira o
          cross-post nas outras redes.
        </p>
        <Link href="/decisor" className="shrink-0 text-[11px] text-zinc-500 hover:text-zinc-300">
          ver no Decisor →
        </Link>
      </div>
    </div>
  )
}
