'use client'

import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  Compass,
  Eye,
  Flame,
  HelpCircle,
  Layers,
  Radio,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import type {
  DesempenhoTema,
  FilaPorTema,
  ItemParecer,
  Parecer,
  PerfilRede,
  PostEmAlta,
  Tendencia,
  DependenciaViral,
} from '@/lib/hooks/use-decisor'
import { MEDIANA_FB_MEDIDA, motivoDoTema } from '@/lib/decisor/temas'

/**
 * OS BLOCOS DO DECISOR. Regra da tela: só aparece o que MUDA UMA DECISÃO. Bloco sem novidade
 * mostra uma linha dizendo isso e encolhe — tela curta é a feature, não a falha.
 *
 * Sem emojis (padrão de cards DIGIAI): ícone lucide dentro de chip.
 */

const REDE_NOME: Record<string, string> = {
  facebook: 'Facebook',
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  kwai: 'Kwai',
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/8 bg-[#1a1922] p-6 ${className}`}>{children}</div>
}

function Chip({ children, cor }: { children: React.ReactNode; cor: string }) {
  return <span className={`rounded-lg p-2 ${cor}`}>{children}</span>
}

function Titulo({ icone, cor, children, nota }: { icone: React.ReactNode; cor: string; children: React.ReactNode; nota?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Chip cor={cor}>{icone}</Chip>
      <h2 className="text-lg font-semibold text-white">{children}</h2>
      {nota && <span className="ml-auto text-[11px] text-zinc-500">{nota}</span>}
    </div>
  )
}

// ====== 1. RADAR DE ESTOURO ======

/**
 * O bloco que justifica o módulo. Os dois virais de 17/07 (29k e 17k no Facebook) subiram por 4
 * dias seguidos e ninguém surfou — nem cross-post, nem sequência do tema. Com ~6% de acerto no
 * FB, reagir ao bilhete premiado vale mais que qualquer otimização de média.
 */
export function BlocoRadar({ radar }: { radar: PostEmAlta[] }) {
  if (radar.length === 0) {
    return (
      <Card>
        <Titulo icone={<Radio className="h-5 w-5 text-zinc-400" />} cor="bg-zinc-500/10">
          Radar de estouro
        </Titulo>
        <p className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
          <CheckCircle2 className="h-4 w-4 text-zinc-600" />
          Nenhum vídeo acima de 3× a mediana da rede agora. Nada a surfar — siga a agenda.
        </p>
      </Card>
    )
  }

  return (
    <Card className="border-amber-500/25 bg-amber-500/[0.04]">
      <Titulo
        icone={<Flame className="h-5 w-5 text-amber-400" />}
        cor="bg-amber-500/10"
        nota={`${radar.length} em alta · comparado à mediana da rede na MESMA idade`}
      >
        Está estourando agora
      </Titulo>
      <p className="mt-1.5 text-xs text-zinc-400">
        Enquanto está quente, duas ações compõem: <strong className="text-zinc-200">cross-postar</strong> nas
        outras redes e <strong className="text-zinc-200">mandar sequência do mesmo tema</strong> amanhã.
      </p>
      <div className="mt-4 space-y-2.5">
        {radar.slice(0, 5).map((p) => (
          <div
            key={`${p.ideiaId}-${p.plataforma}`}
            className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-white/8 bg-black/20 px-3.5 py-3"
          >
            <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-sm font-semibold tabular-nums text-amber-300">
              {p.multiplo}×
            </span>
            <Link
              href={`/analytics/videos/${p.ideiaId}`}
              className="min-w-0 flex-1 truncate text-sm text-zinc-200 hover:text-white hover:underline"
              title={p.titulo}
            >
              {p.titulo}
            </Link>
            <span className="text-[11px] text-zinc-500">
              {REDE_NOME[p.plataforma] || p.plataforma} · {p.views.toLocaleString('pt-BR')} views em{' '}
              {p.idadeDias}d (mediana {p.medianaNaIdade.toLocaleString('pt-BR')})
            </span>
            <span className="rounded bg-zinc-800/70 px-1.5 py-0.5 text-[10px] text-zinc-400">{p.tema}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ====== 2. BRIEFING DO DIA (o analista) ======

const TIPO_ITEM: Record<ItemParecer['tipo'], { rotulo: string; icone: React.ReactNode; cor: string }> = {
  fato: { rotulo: 'fato', icone: <CheckCircle2 className="h-3.5 w-3.5" />, cor: 'text-sky-300 bg-sky-500/10' },
  tendencia: { rotulo: 'tendência', icone: <TrendingUp className="h-3.5 w-3.5" />, cor: 'text-rose-300 bg-rose-500/10' },
  hipotese: { rotulo: 'hipótese', icone: <HelpCircle className="h-3.5 w-3.5" />, cor: 'text-amber-300 bg-amber-500/10' },
  caminho: { rotulo: 'caminho', icone: <ArrowRight className="h-3.5 w-3.5" />, cor: 'text-emerald-300 bg-emerald-500/10' },
}

export function BlocoBriefing({
  parecer,
  onReanalisar,
  reanalisando,
}: {
  parecer: Parecer | null
  onReanalisar: () => void
  reanalisando: boolean
}) {
  return (
    <Card>
      <Titulo
        icone={<Compass className="h-5 w-5 text-indigo-400" />}
        cor="bg-indigo-500/10"
        nota={parecer ? `analisado ${new Date(parecer.geradoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : undefined}
      >
        Leitura do dia
      </Titulo>

      {!parecer ? (
        <p className="mt-3 text-sm text-zinc-500">
          Sem parecer ainda. O analista roda 1×/dia depois da coleta — ou clique em reanalisar.
        </p>
      ) : (
        <>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-200">{parecer.leitura}</p>

          <div className="mt-5 grid gap-3.5 lg:grid-cols-3">
            <Coluna titulo="Faça" icone={<Target className="h-4 w-4 text-emerald-400" />} itens={parecer.faca} vazio="nada novo" />
            <Coluna titulo="Evite" icone={<Ban className="h-4 w-4 text-red-400" />} itens={parecer.evite} vazio="nada a evitar" />
            <Coluna titulo="Observe" icone={<Eye className="h-4 w-4 text-sky-400" />} itens={parecer.observe} vazio="nada em vigilância" />
          </div>

          {parecer.itens.length > 0 && (
            <div className="mt-5 space-y-1.5 border-t border-white/8 pt-4">
              {parecer.itens.map((i, n) => {
                const t = TIPO_ITEM[i.tipo]
                return (
                  <div key={n} className="flex items-start gap-2.5 text-[13px]">
                    <span className={`mt-px flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${t.cor}`}>
                      {t.icone}
                      {t.rotulo}
                    </span>
                    <span className="text-zinc-300">{i.texto}</span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-3.5">
        <p className="text-[10px] text-zinc-600">
          O analista só redige — todo número vem do motor determinístico. Ele não pode citar dado que
          não recebeu, nem afirmar mudança de algoritmo.
        </p>
        <button
          onClick={onReanalisar}
          disabled={reanalisando}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${reanalisando ? 'animate-spin' : ''}`} />
          {reanalisando ? 'analisando…' : 'reanalisar'}
        </button>
      </div>
    </Card>
  )
}

function Coluna({ titulo, icone, itens, vazio }: { titulo: string; icone: React.ReactNode; itens: string[]; vazio: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/20 p-3.5">
      <div className="flex items-center gap-1.5">
        {icone}
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{titulo}</h3>
      </div>
      {itens.length === 0 ? (
        <p className="mt-2 text-xs text-zinc-600">{vazio}</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {itens.map((t, n) => (
            <li key={n} className="text-[13px] leading-snug text-zinc-300">
              {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ====== 3. TEMA QUE SORTEIA (o DNA do campeão) ======

/**
 * Medido em 29/07/2026 nas 95 publicações de Facebook: história/arqueologia tem mediana 2.919 e
 * MONOPÓLIO dos 6 estouros de 48 dias; tecnologia/IA 268 e produtividade 252, ambos com ZERO
 * estouros. Lift de 10,9×. O placar é recalculado no dado vivo — se outro tema começar a
 * sortear, aparece aqui.
 */
export function BlocoTemas({ temas }: { temas: DesempenhoTema[] }) {
  const comAmostra = temas.filter((t) => t.n >= 3)
  const max = Math.max(...comAmostra.map((t) => t.medianaViews), 1)

  return (
    <Card>
      <Titulo icone={<Layers className="h-5 w-5 text-violet-400" />} cor="bg-violet-500/10" nota="mediana de views no Facebook · a rede que traz seguidor">
        Que tema sorteia
      </Titulo>
      <p className="mt-1.5 text-xs text-zinc-400">
        No Facebook o resultado é loteria — poucos vídeos carregam quase tudo. Isto mostra em qual
        tema o bilhete costuma sair premiado.
      </p>

      <div className="mt-4 space-y-2.5">
        {comAmostra.map((t) => {
          const forte = t.papelFacebook === 'sorteia'
          const morto = t.papelFacebook === 'morto'
          const cor = forte ? 'bg-emerald-500' : morto ? 'bg-red-500/70' : 'bg-zinc-600'
          return (
            <div key={t.tema} className="grid grid-cols-[160px_1fr] items-center gap-3">
              <div className="min-w-0">
                <div className="truncate text-xs font-medium text-zinc-200" title={t.tema}>
                  {t.tema}
                </div>
                <div className="text-[10px] text-zinc-600">
                  n={t.n}
                  {t.estouros > 0 && <span className="text-emerald-400"> · {t.estouros} estouro{t.estouros > 1 ? 's' : ''}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div className={`h-full rounded-full ${cor}`} style={{ width: `${Math.max(2, (t.medianaViews / max) * 100)}%` }} />
                </div>
                <span className="w-14 shrink-0 text-right text-xs tabular-nums text-zinc-300">
                  {t.medianaViews.toLocaleString('pt-BR')}
                </span>
                {morto && <span className="shrink-0 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-300">morto</span>}
                {forte && <span className="shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-300">sorteia</span>}
              </div>
            </div>
          )
        })}
      </div>
      {comAmostra.length === 0 && <p className="mt-3 text-sm text-zinc-500">Nenhum tema com 3+ vídeos ainda.</p>}
    </Card>
  )
}

// ====== 4. FILA: DESPERDÍCIO ANTES DE ACONTECER ======

export function BlocoFila({ fila }: { fila: FilaPorTema }) {
  const amostraBoa = fila.total >= 5
  const percentualSorteia = fila.total > 0 ? Math.round((fila.emTemaQueSorteia / fila.total) * 100) : 0
  // O alarme real não é "quanto tem de tema morto" — é FALTAR o tema que sorteia. Uma fila de 26
  // com 1 item de história/arqueologia produz pouquíssimo bilhete pro Facebook, mesmo que só 12%
  // esteja em tema explicitamente morto: o resto é "outros", que nunca estourou.
  const faltaVencedor = amostraBoa && percentualSorteia < 20
  const alerta = amostraBoa && (faltaVencedor || fila.percentualMorto >= 20)

  return (
    <Card className={alerta ? 'border-red-500/25 bg-red-500/[0.04]' : ''}>
      <Titulo
        icone={alerta ? <AlertTriangle className="h-5 w-5 text-red-400" /> : <Layers className="h-5 w-5 text-zinc-400" />}
        cor={alerta ? 'bg-red-500/10' : 'bg-zinc-500/10'}
        nota={`${fila.total} na fila`}
      >
        O que vem pela frente
      </Titulo>

      {fila.total === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">Fila vazia — nada em produção.</p>
      ) : (
        <>
          {faltaVencedor ? (
            <p className="mt-2 text-sm text-zinc-300">
              Só{' '}
              <strong className="text-red-300">
                {fila.emTemaQueSorteia} de {fila.total}
              </strong>{' '}
              estão no tema que sorteia no Facebook (história/arqueologia). Do jeito que está, a fila
              produz pouquíssimo bilhete pra rede que traz seguidor
              {fila.emTemaMorto > 0 && <> — e {fila.emTemaMorto} estão em tema que nunca estourou</>}.
              Vale puxar a próxima leva pra história/arqueologia.
            </p>
          ) : alerta ? (
            <p className="mt-2 text-sm text-zinc-300">
              <strong className="text-red-300">
                {fila.emTemaMorto} de {fila.total} ({fila.percentualMorto}%)
              </strong>{' '}
              estão em tema que nunca estourou no Facebook em 48 dias. Se forem pro FB, é slot
              desperdiçado — mande pra YouTube/Kwai e priorize o FB com os {fila.emTemaQueSorteia} de
              tema que sorteia.
            </p>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">
              {fila.emTemaQueSorteia} de {fila.total} ({percentualSorteia}%) estão no tema que sorteia
              no Facebook.
            </p>
          )}
          <div className="mt-3.5 flex flex-wrap gap-2">
            {fila.porTema.map((p) => (
              <span
                key={p.tema}
                className={`rounded-lg px-2.5 py-1 text-[11px] ${
                  p.papelFacebook === 'sorteia'
                    ? 'bg-emerald-500/10 text-emerald-300'
                    : p.papelFacebook === 'morto'
                      ? 'bg-red-500/10 text-red-300'
                      : 'bg-zinc-800/70 text-zinc-400'
                }`}
                title={motivoDoTema(p.tema)}
              >
                {p.tema} · {p.n}
              </span>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

// ====== 5. ROTEAMENTO POR REDE ======

export function BlocoRedes({ redes }: { redes: PerfilRede[] }) {
  return (
    <Card>
      <Titulo icone={<Users className="h-5 w-5 text-cyan-400" />} cor="bg-cyan-500/10" nota="para onde mandar o quê">
        Papel de cada rede
      </Titulo>
      <div className="mt-4 space-y-2">
        {redes.map((r) => (
          <div key={r.plataforma} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-white/8 bg-black/20 px-3.5 py-2.5">
            <span className="w-20 shrink-0 text-sm text-zinc-200">{REDE_NOME[r.plataforma] || r.plataforma}</span>
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${
                r.papel === 'motor de seguidor' ? 'bg-emerald-500/10 text-emerald-300' : r.papel === 'motor de view' ? 'bg-sky-500/10 text-sky-300' : 'bg-zinc-800/70 text-zinc-500'
              }`}
            >
              {r.papel}
            </span>
            <span className="text-[11px] tabular-nums text-zinc-500">
              {r.views.toLocaleString('pt-BR')} views · {r.likes.toLocaleString('pt-BR')} curtidas
            </span>
            <span className="ml-auto text-[11px] text-zinc-400">
              {r.seguidoresMedidos != null ? (
                <>
                  <strong className="text-zinc-200">{r.seguidoresMedidos.toLocaleString('pt-BR')}</strong> seguidores (medido)
                </>
              ) : r.seguidoresEstimados != null ? (
                <>
                  ~<strong className="text-zinc-200">{r.seguidoresEstimados.toLocaleString('pt-BR')}</strong> seguidores{' '}
                  <span className="text-zinc-600">(estimativa: 10% das curtidas)</span>
                </>
              ) : (
                <span className="text-zinc-600">seguidor não medido nesta rede</span>
              )}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-zinc-600">
        Facebook converte por alcance (dado da API). Kwai e TikTok usam a razão observada nas contas
        em 29/07 — Kwai 154/1.5k e TikTok 151/1.487, ambos ~10%. É estimativa direcional, não KPI.
      </p>
    </Card>
  )
}

// ====== 6. TENDÊNCIA + DEPENDÊNCIA (o contexto do número) ======

export function BlocoTendencia({ tendencia: t, dependencia }: { tendencia: Tendencia | null; dependencia: DependenciaViral }) {
  return (
    <div className="grid gap-3.5 sm:grid-cols-2">
      <Card>
        <div className="flex items-center gap-1.5">
          {t && t.variacao < 0 ? <TrendingDown className="h-4 w-4 text-red-400" /> : <TrendingUp className="h-4 w-4 text-emerald-400" />}
          <p className="text-[11px] text-zinc-500">Novas views — 7 dias vs 7 anteriores</p>
        </div>
        {t ? (
          <>
            <p className="mt-1 text-2xl font-semibold text-white">
              {t.atual.toLocaleString('pt-BR')}
              <span className={`ml-2 text-sm ${t.variacao < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {t.variacao > 0 ? '+' : ''}
                {t.variacao}%
              </span>
            </p>
            <p className="text-[10px] text-zinc-600">
              antes {t.anterior.toLocaleString('pt-BR')} · média {t.mediaDiaAtual.toLocaleString('pt-BR')}/dia
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-zinc-500">série curta pra comparar</p>
        )}
      </Card>

      <Card>
        <div className="flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-amber-400" />
          <p className="text-[11px] text-zinc-500">Concentração — os 2 maiores vídeos</p>
        </div>
        <p className="mt-1 text-2xl font-semibold text-white">{dependencia.concentracaoTop2}%</p>
        <p className="text-[10px] text-zinc-600">
          {dependencia.dependente
            ? 'crescimento depende de 1–2 vídeos: quando eles saturam, o número cai'
            : 'crescimento distribuído entre vários vídeos'}
          {' · '}piso {dependencia.piso.toLocaleString('pt-BR')} · pico {dependencia.pico.toLocaleString('pt-BR')}
        </p>
      </Card>
    </div>
  )
}

/** Exportado pra tela mostrar o número medido sem reimportar o dicionário. */
export { MEDIANA_FB_MEDIDA }
