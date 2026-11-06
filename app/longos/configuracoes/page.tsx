'use client'

import type { ReactNode } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { useConfigsLongos } from '@/lib/hooks/use-longos'

const CARTAO = 'rounded-2xl border border-(--pulso-border) bg-(--pulso-surface)'
const DIAS = ['', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo']

/**
 * Configurações dos Longos (06/11/2026): só o que vale para os Bastidores. As dos Curtos (linha de
 * produção, grade, redes do PULSO) ficam em /settings. Leitura: quem muda é o dono, pelo Claude do Pulso.
 */
type Obj = Record<string, unknown>
const o = (v: unknown): Obj => (v && typeof v === 'object' ? (v as Obj) : {})
const txt = (v: unknown) => (v === undefined || v === null ? '—' : String(v))
const data = (v: string | null | undefined) => (v ? new Date(v).toLocaleDateString('pt-BR') : '—')

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-2 text-sm sm:grid-cols-[200px_1fr]">
      <dt className="text-(--pulso-text-muted)">{rotulo}</dt>
      <dd className="text-(--pulso-text)">{children}</dd>
    </div>
  )
}

function Bloco({ titulo, atualizado, children }: { titulo: string; atualizado?: string | null; children: ReactNode }) {
  return (
    <section className={`${CARTAO} p-5`}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-(--pulso-text)">{titulo}</h2>
        <span className="text-xs text-(--pulso-text-muted)">atualizado em {data(atualizado)}</span>
      </div>
      <dl className="divide-y divide-(--pulso-border)">{children}</dl>
    </section>
  )
}

export default function LongosConfiguracoesPage() {
  const { data: c, isLoading, error } = useConfigsLongos()
  const voz = o(c?.voz_bastidores?.valor)
  const emb = o(c?.longos_embalagem?.valor)
  const vin = o(emb.vinheta)
  const enc = o(emb.encerramento)
  const dest = o(c?.cortes_destinos?.valor)
  const destinos = (Array.isArray(dest.destinos) ? dest.destinos : []).map(o)
  const regras = (Array.isArray(dest.regras) ? dest.regras : []).map(String)
  const fab = o(c?.longos_fabrica?.valor)
  const itens = (Array.isArray(fab.itens) ? fab.itens : []).map(o)

  return (
    <div className="space-y-5">
      <PageHeader titulo="Configurações dos Longos" subtitulo="Voz, embalagem, fábrica e destinos dos cortes. Quem muda é você, pelo Claude do Pulso" />
      {isLoading && <div className={`h-40 animate-pulse ${CARTAO}`} />}
      {error && <p className={`${CARTAO} p-6 text-sm text-(--pulso-danger)`}>Não deu para ler: {error.message}</p>}
      {c && (
        <>
          <Bloco titulo="Voz do dono" atualizado={c.voz_bastidores?.atualizado}>
            <Linha rotulo="Aprovada">{txt(voz.aprovadaEm)} por {txt(voz.aprovadaPor)}</Linha>
            <Linha rotulo="Ajuste">{txt(o(voz.pos).semitons)} tom, formante {txt(o(voz.pos).formante)}, volume {txt(o(voz.pos).lufs)} LUFS</Linha>
            <Linha rotulo="Energia">estilo {txt(o(voz.voice_settings).style)}, estabilidade {txt(o(voz.voice_settings).stability)}</Linha>
            <Linha rotulo="Regra">{txt(voz.regra)}</Linha>
          </Bloco>

          <Bloco titulo="Embalagem (abertura e encerramento)" atualizado={c.longos_embalagem?.atualizado}>
            <Linha rotulo="Ordem">{txt(emb.ordem)}</Linha>
            <Linha rotulo="Vinheta">{txt(vin.descricao)} · {txt(vin.duracao_s)} s · {txt(vin.som)}</Linha>
            <Linha rotulo="Assinatura falada">“{txt(enc.assinatura)}”</Linha>
            <Linha rotulo="Encerramento">{txt(enc.layout)}</Linha>
            <Linha rotulo="Tela final">{txt(enc.calmo_final_s)} s com os espaços da tela final do YouTube</Linha>
          </Bloco>

          <Bloco titulo="Destinos dos cortes" atualizado={c.cortes_destinos?.atualizado}>
            {destinos.map((d) => {
              const pecas = (Array.isArray(d.pecas) ? d.pecas : []).map(o)
              const redes = Object.keys(o(d.redes))
              return (
                <Linha key={txt(d.id)} rotulo={txt(d.nome)}>
                  <span className="block">Publica: {txt(d.publica || 'digiai_mkt')}{d.hashtag_fixa ? ` · ${txt(d.hashtag_fixa)} primeiro` : ''}</span>
                  {redes.length > 0 && <span className="block text-(--pulso-text-muted)">{redes.length} saídas: {redes.join(', ')}</span>}
                  {pecas.map((p, i) => (
                    <span key={i} className="block text-(--pulso-text-muted)">
                      {txt(p.tipo)} no {txt(p.rede)}: {(Array.isArray(p.dias_semana) ? p.dias_semana : []).map((n) => DIAS[Number(n)] || n).join(', ')} às {txt(p.hora)}
                    </span>
                  ))}
                </Linha>
              )
            })}
            {regras.length > 0 && (
              <Linha rotulo="Regras">
                <ul className="list-disc space-y-1 pl-4">{regras.map((r) => <li key={r}>{r}</li>)}</ul>
              </Linha>
            )}
          </Bloco>

          <Bloco titulo="Fábrica: o que está pronto" atualizado={c.longos_fabrica?.atualizado}>
            {itens.map((i) => (
              <Linha key={txt(i.id)} rotulo={txt(i.nome)}>
                <span className="font-semibold">{txt(i.estado).replace('_', ' ')}</span> · <span className="text-(--pulso-text-muted)">{txt(i.nota)}</span>
              </Linha>
            ))}
          </Bloco>
        </>
      )}
    </div>
  )
}
