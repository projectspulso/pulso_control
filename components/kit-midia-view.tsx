import type { Fatia, KitDados, PublicoRede } from '@/lib/analytics/kit'

const inteiro = new Intl.NumberFormat('pt-BR')
const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const pct = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 })
const dataLonga = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })

const CARTAO = 'rounded-2xl border border-(--pulso-border) bg-(--pulso-surface)'

/** O kit como o patrocinador vê. Só desenha o que recebe: os números já vêm congelados. */
export function KitMidiaView({ kit, nota }: { kit: KitDados; nota?: string }) {
  const engaj = kit.totais.views > 0 ? kit.totais.interacoes / kit.totais.views : null
  const maxMes = Math.max(1, ...kit.meses.map((m) => m.views))

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className={`${CARTAO} p-6 sm:p-8`}>
        <p className="text-xs uppercase tracking-[0.2em] text-(--pulso-action)">Kit de mídia</p>
        <h1 className="mt-2 text-3xl font-bold text-(--pulso-text) sm:text-4xl">PULSO Histórias</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-(--pulso-text-muted)">
          Vídeos curtos de história, mistério e ciência, publicados todo dia em cinco redes.
          {kit.desde && <> No ar desde {dataLonga(kit.desde)}.</>}
        </p>
        <p className="mt-4 text-xs text-(--pulso-text-subtle)">
          Números medidos em {new Date(kit.medidoEm).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })} (horário de Brasília).
          Este kit é uma foto daquele momento e não muda depois.
        </p>
      </header>

      {nota?.trim() && (
        <section className={`${CARTAO} p-5`}>
          <p className="whitespace-pre-line text-sm leading-relaxed text-(--pulso-text)">{nota.trim()}</p>
        </section>
      )}

      <section aria-label="Números gerais" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero rotulo="Seguidores somados" valor={inteiro.format(kit.totais.seguidores)} sub="5 redes, contador de cada perfil" />
        <Numero rotulo="Views nos últimos 30 dias" valor={inteiro.format(kit.totais.views30)} sub="views ganhas no período" />
        <Numero rotulo="Views acumuladas" valor={compacto.format(kit.totais.views)} sub={`${inteiro.format(kit.totais.videos)} vídeos publicados`} />
        <Numero rotulo="Interações por view" valor={engaj === null ? '—' : pct.format(engaj)} sub="curtidas, comentários, compartilhamentos e salvos" />
      </section>

      <section className={`${CARTAO} overflow-hidden`}>
        <h2 className="px-5 pt-5 text-sm font-semibold text-(--pulso-text)">Rede a rede</h2>
        <div className="overflow-x-auto">
          <table className="mt-3 w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-(--pulso-border) text-left text-[11px] uppercase tracking-wide text-(--pulso-text-subtle)">
                <th className="px-5 py-2 font-normal">Rede</th>
                <th className="px-3 py-2 text-right font-normal">Seguidores</th>
                <th className="px-3 py-2 text-right font-normal">Novos em 30 dias</th>
                <th className="px-3 py-2 text-right font-normal">Views em 30 dias</th>
                <th className="px-5 py-2 text-right font-normal">Vídeos</th>
              </tr>
            </thead>
            <tbody>
              {kit.redes.map((r) => (
                <tr key={r.rede} className="border-b border-(--pulso-border) last:border-0">
                  <td className="px-5 py-2.5 text-(--pulso-text)">
                    {r.nome}
                    {r.manual && <span className="ml-2 text-[11px] text-(--pulso-text-subtle)">lido do painel da rede</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-(--pulso-text)">{r.seguidores === null ? 'não medido' : inteiro.format(r.seguidores)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-(--pulso-text-muted)">{r.ganho30 === null ? '—' : `${r.ganho30 >= 0 ? '+' : ''}${inteiro.format(r.ganho30)}`}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-(--pulso-text-muted)">{inteiro.format(r.views30)}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-(--pulso-text-muted)">{inteiro.format(r.videos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {kit.meses.length > 0 && (
        <section className={`${CARTAO} p-5`}>
          <h2 className="text-sm font-semibold text-(--pulso-text)">Views ganhas por mês</h2>
          <p className="mt-0.5 text-xs text-(--pulso-text-subtle)">Soma das cinco redes. O primeiro mês é parcial e o mês corrente ainda está em andamento.</p>
          <div className="mt-5 flex h-44 items-end gap-2 sm:gap-4" role="list">
            {kit.meses.map((m) => (
              <div key={m.rotulo} role="listitem" className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                title={`${m.rotulo}: ${inteiro.format(m.views)} views, ${m.videos} vídeos novos`}>
                <span className="text-[11px] tabular-nums text-(--pulso-text-muted)">{compacto.format(m.views)}</span>
                <div className="w-full max-w-14 rounded-t-md bg-(--pulso-action) transition-opacity group-hover:opacity-80"
                  style={{ height: `${Math.max(2, (m.views / maxMes) * 100)}%` }} />
                <span className="text-[11px] text-(--pulso-text-subtle)">{m.rotulo}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {kit.publico.youtube && <Publico titulo="Quem assiste no YouTube" p={kit.publico.youtube} />}
        {kit.publico.instagram && <Publico titulo="Quem assiste no Instagram" p={kit.publico.instagram} />}
      </div>
      {kit.publico.atualizadoEm && (kit.publico.youtube || kit.publico.instagram) && (
        <p className="-mt-2 text-[11px] text-(--pulso-text-subtle)">Público informado pelas próprias redes, leitura de {dataLonga(kit.publico.atualizadoEm)}.</p>
      )}

      <div>
        {kit.top.length > 0 && (
          <section className={`${CARTAO} p-5`}>
            <h2 className="text-sm font-semibold text-(--pulso-text)">Os vídeos mais vistos</h2>
            <ol className="mt-3 space-y-2.5">
              {kit.top.map((v, i) => (
                <li key={i} className="flex items-baseline gap-3 text-sm">
                  <span className="w-4 shrink-0 text-(--pulso-text-subtle)">{i + 1}</span>
                  <span className="min-w-0 flex-1 text-(--pulso-text)">{v.titulo}</span>
                  <span className="shrink-0 tabular-nums text-(--pulso-text-muted)">{inteiro.format(v.views)}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      <footer className="pb-6 text-[11px] leading-relaxed text-(--pulso-text-subtle)">
        Seguidores vêm do contador de cada perfil. Views somam cada vídeo uma vez por rede; o Kwai não tem integração e é lido do painel da própria rede.
        Vídeos longos ficam fora da conta. Link pessoal: não repasse.
      </footer>
    </div>
  )
}

function Numero({ rotulo, valor, sub }: { rotulo: string; valor: string; sub: string }) {
  return (
    <div className={`${CARTAO} p-4`}>
      <p className="text-[11px] uppercase tracking-wide text-(--pulso-text-subtle)">{rotulo}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-(--pulso-text)">{valor}</p>
      <p className="mt-0.5 text-[11px] text-(--pulso-text-subtle)">{sub}</p>
    </div>
  )
}

function Publico({ titulo, p }: { titulo: string; p: PublicoRede }) {
  return (
    <section className={`${CARTAO} p-5`}>
      <h2 className="text-sm font-semibold text-(--pulso-text)">{titulo}</h2>
      {p.idade.length > 0 && <Barras rotulo="Idade" fatias={p.idade} />}
      {p.genero.length > 0 && <Barras rotulo="Gênero" fatias={p.genero} />}
      {(p.cidades.length > 0 ? p.cidades : p.paises).length > 0 && (
        <Barras rotulo={p.cidades.length > 0 ? 'Cidades' : 'Países'} fatias={p.cidades.length > 0 ? p.cidades : p.paises} />
      )}
    </section>
  )
}

function Barras({ rotulo, fatias }: { rotulo: string; fatias: Fatia[] }) {
  const max = Math.max(...fatias.map((f) => f.pct), 1)
  return (
    <div className="mt-4">
      <p className="mb-1.5 text-[11px] uppercase tracking-wide text-(--pulso-text-subtle)">{rotulo}</p>
      <ul className="space-y-1">
        {fatias.map((f) => (
          <li key={f.rotulo} className="flex items-center gap-2 text-xs" title={`${f.rotulo}: ${f.pct.toLocaleString('pt-BR')}%`}>
            <span className="w-28 shrink-0 truncate text-(--pulso-text-muted)">{f.rotulo}</span>
            <span className="h-2 flex-1 rounded-full bg-(--pulso-surface-raised)">
              <span className="block h-2 rounded-full bg-(--pulso-action)" style={{ width: `${(f.pct / max) * 100}%` }} />
            </span>
            <span className="w-12 shrink-0 text-right tabular-nums text-(--pulso-text-muted)">{f.pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
