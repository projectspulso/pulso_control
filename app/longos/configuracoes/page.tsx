'use client'

import { useState, type ReactNode } from 'react'
import { CheckCircle2, Circle, CircleDashed, Clock, Factory, Hash, Loader2, Mic, Package, Radio, Volume2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { useConfigsLongos } from '@/lib/hooks/use-longos'
import { Abas, CANAIS, CARTAO, Numero, REDES } from '@/components/longos/ui'

/**
 * Configurações dos Longos (redesenho de 12/11/2026). Só leitura: quem muda é o dono, pelo Claude do Pulso.
 * As dos Curtos (linha de produção, grade, redes do PULSO) ficam em /settings.
 */
type Obj = Record<string, unknown>
const o = (v: unknown): Obj => (v && typeof v === 'object' ? (v as Obj) : {})
const txt = (v: unknown) => (v === undefined || v === null || v === '' ? '—' : String(v))
const data = (v: string | null | undefined) => (v ? new Date(v).toLocaleDateString('pt-BR') : '—')
const DIAS = ['', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']
const TIPOS: Record<string, string> = { gancho: 'Gancho', historia: 'História', tecnico: 'Técnico', licao: 'Lição' }
const QUEM: Record<string, string> = { pulso: 'o PULSO publica', digiai_mkt: 'o MKT publica' }

type Aba = 'canais' | 'voz' | 'embalagem' | 'fabrica'

function Item({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="rounded-lg bg-(--pulso-surface-raised) px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-(--pulso-text-subtle)">{rotulo}</p>
      <div className="mt-0.5 text-sm text-(--pulso-text)">{children}</div>
    </div>
  )
}

const Atualizado = ({ em }: { em?: string | null }) => <p className="text-[11px] text-(--pulso-text-subtle)">atualizado em {data(em)}</p>

export default function LongosConfiguracoesPage() {
  const { data: c, isLoading, error } = useConfigsLongos()
  const [aba, setAba] = useState<Aba>('canais')
  const voz = o(c?.voz_bastidores?.valor)
  const emb = o(c?.longos_embalagem?.valor)
  const vin = o(emb.vinheta)
  const enc = o(emb.encerramento)
  const dest = o(c?.cortes_destinos?.valor)
  const destinos = (Array.isArray(dest.destinos) ? dest.destinos : []).map(o)
  const regras = (Array.isArray(dest.regras) ? dest.regras : []).map(String)
  const itens = (Array.isArray(o(c?.longos_fabrica?.valor).itens) ? (o(c?.longos_fabrica?.valor).itens as unknown[]) : []).map(o)

  return (
    <div className="space-y-5">
      <PageHeader titulo="Configurações dos Longos" subtitulo="Só leitura: quem muda é você, pelo Claude do Pulso" />
      {isLoading && <div className={`h-40 animate-pulse ${CARTAO}`} />}
      {error && <p className={`${CARTAO} p-6 text-sm text-(--pulso-danger)`}>Não deu para ler: {error.message}</p>}
      {c && (
        <>
          <Abas<Aba> ativa={aba} onChange={setAba} abas={[
            { id: 'canais', rotulo: 'Canais dos cortes', icone: Radio, n: destinos.length },
            { id: 'voz', rotulo: 'Voz', icone: Mic }, { id: 'embalagem', rotulo: 'Embalagem', icone: Package },
            { id: 'fabrica', rotulo: 'Fábrica', icone: Factory, n: itens.length },
          ]} />

          {aba === 'canais' && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {destinos.map((d) => {
                  const id = txt(d.id)
                  const redes = Object.entries(o(d.redes))
                  const tipos = (Array.isArray(d.tipos) ? d.tipos : []).map(String)
                  const pecas = (Array.isArray(d.pecas) ? d.pecas : []).map(o)
                  return (
                    <section key={id} className={`${CARTAO} p-4`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h2 className="text-sm font-semibold text-(--pulso-text)">{CANAIS[id]?.nome || txt(d.nome)}</h2>
                          <p className="text-[11px] text-(--pulso-text-muted)">{QUEM[txt(d.publica)] || 'o MKT publica'}</p>
                        </div>
                        {o(d.cadencia).hora != null && <span className="inline-flex items-center gap-1 rounded-full bg-(--pulso-vl)/10 px-2 py-0.5 text-[11px] tabular-nums text-(--pulso-vl)"><Clock className="h-3 w-3" aria-hidden />{txt(o(d.cadencia).hora)}</span>}
                      </div>
                      {redes.length > 0 && (
                        <ul className="mt-3 flex flex-wrap gap-1.5">
                          {redes.map(([r, quem]) => {
                            const R = REDES[r.replace(/_story.*$/, '')]
                            const manual = quem === 'manual'
                            return (
                              <li key={r} title={`${R?.nome || r}${r.includes('story') ? ' (story)' : ''}${manual ? ': você posta' : ''}`}
                                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] ${manual ? 'border-(--pulso-warn)/30 bg-(--pulso-warn)/10 text-(--pulso-warn)' : 'border-(--pulso-border) bg-(--pulso-surface-raised) text-(--pulso-text-muted)'} ${r.includes('story') ? 'border-dashed' : ''}`}>
                                {R && <R.Icone className="h-3.5 w-3.5" aria-hidden />}{R?.nome || r}{r.includes('story') ? ' story' : ''}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                      {tipos.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {tipos.map((t) => <span key={t} className="rounded-full bg-(--pulso-surface-raised) px-2 py-0.5 text-[11px] text-(--pulso-text-muted)">{TIPOS[t] || t}</span>)}
                        </div>
                      )}
                      {pecas.length > 0 && (
                        <ul className="mt-2 space-y-1 text-[11px] text-(--pulso-text-muted)">
                          {pecas.map((p, i) => <li key={i}>{txt(p.tipo)} · {txt(p.rede)} · {(Array.isArray(p.dias_semana) ? p.dias_semana : []).map((n) => DIAS[Number(n)] || n).join(', ')} às {txt(p.hora)}</li>)}
                        </ul>
                      )}
                      {d.hashtag_fixa != null && <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-(--pulso-text-subtle)"><Hash className="h-3 w-3" aria-hidden />{txt(d.hashtag_fixa).replace(/^#/, '')}</p>}
                    </section>
                  )
                })}
              </div>
              {regras.length > 0 && (
                <section className={`${CARTAO} p-4`}>
                  <h2 className="mb-2 text-sm font-semibold text-(--pulso-text)">Regras</h2>
                  <ul className="list-disc space-y-1 pl-4 text-xs text-(--pulso-text-muted)">{regras.map((r) => <li key={r}>{r}</li>)}</ul>
                </section>
              )}
              <Atualizado em={c.cortes_destinos?.atualizado} />
            </div>
          )}

          {aba === 'voz' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Numero icone={CheckCircle2} rotulo="Aprovada em" valor={txt(voz.aprovadaEm)} sub={`por ${txt(voz.aprovadaPor)}`} tom="ok" />
                <Numero icone={Mic} rotulo="Tom" valor={`${txt(o(voz.pos).semitons)}`} sub={`formante ${txt(o(voz.pos).formante)}`} />
                <Numero icone={Volume2} rotulo="Volume" valor={`${txt(o(voz.pos).lufs)} LUFS`} />
                <Numero icone={Radio} rotulo="Energia" valor={txt(o(voz.voice_settings).style)} sub={`estabilidade ${txt(o(voz.voice_settings).stability)}`} tom="vl" />
              </div>
              {voz.regra != null && <p className={`${CARTAO} p-4 text-xs text-(--pulso-text-muted)`}>{txt(voz.regra)}</p>}
              <Atualizado em={c.voz_bastidores?.atualizado} />
            </div>
          )}

          {aba === 'embalagem' && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Item rotulo="Ordem">{txt(emb.ordem)}</Item>
                <Item rotulo="Vinheta">{txt(vin.duracao_s)} s · {txt(vin.som)}</Item>
                <Item rotulo="Assinatura falada">“{txt(enc.assinatura)}”</Item>
                <Item rotulo="Tela final">{txt(enc.calmo_final_s)} s com os espaços do YouTube</Item>
                <Item rotulo="Encerramento">{txt(enc.layout)}</Item>
                <Item rotulo="Vinheta (como é)">{txt(vin.descricao)}</Item>
              </div>
              <Atualizado em={c.longos_embalagem?.atualizado} />
            </div>
          )}

          {aba === 'fabrica' && (
            <div className="space-y-3">
              <ul className="grid gap-3 sm:grid-cols-2">
                {itens.map((i) => {
                  const e = txt(i.estado)
                  const Ic = e === 'pronto' ? CheckCircle2 : e === 'em_andamento' ? Loader2 : e === 'falta' ? CircleDashed : Circle
                  const cor = e === 'pronto' ? 'text-(--pulso-ok) bg-(--pulso-ok)/10' : e === 'em_andamento' ? 'text-(--pulso-vl) bg-(--pulso-vl)/10' : e === 'falta' ? 'text-(--pulso-warn) bg-(--pulso-warn)/10' : 'text-(--pulso-text-subtle) bg-(--pulso-surface-raised)'
                  return (
                    <li key={txt(i.id)} className={`${CARTAO} flex gap-3 p-3`}>
                      <span className={`h-fit rounded-lg p-2 ${cor}`}><Ic className="h-4 w-4" aria-hidden /></span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-(--pulso-text)">{txt(i.nome)} <span className="text-[11px] font-normal text-(--pulso-text-muted)">· {e.replace('_', ' ')}</span></p>
                        <p className="line-clamp-2 text-[11px] text-(--pulso-text-subtle)" title={txt(i.nota)}>{txt(i.nota)}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <Atualizado em={c.longos_fabrica?.atualizado} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
