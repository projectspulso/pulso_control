'use client'

import { useState } from 'react'
import { Download, FileText, Film, HardDrive, Image as ImageIcon, Scissors, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { useArquivosEpisodio, useEpisodios, useUrlsAssinadas, type ArquivoLongo } from '@/lib/hooks/use-longos'
import { Abas, CANAIS, CARTAO, Numero, Vazio } from '@/components/longos/ui'

/**
 * Assets dos Longos (redesenho de 12/11/2026): o que cada episódio já tem online, no bucket bastidores.
 * As fotos do rosto do dono não aparecem aqui: moram só no OneDrive (o repositório é público).
 */
const GRUPOS = [
  { id: 'episodio', titulo: 'Episódio', icone: Film, casa: (a: ArquivoLongo) => a.pasta === '' && !a.nome.startsWith('capa') },
  { id: 'capas', titulo: 'Capas', icone: ImageIcon, casa: (a: ArquivoLongo) => a.pasta === '' && a.nome.startsWith('capa') },
  { id: 'cortes', titulo: 'Cortes', icone: Scissors, casa: (a: ArquivoLongo) => a.pasta.startsWith('cortes') },
  { id: 'stories', titulo: 'Stories', icone: Sparkles, casa: (a: ArquivoLongo) => a.pasta.startsWith('stories') },
  { id: 'digiai', titulo: 'DIGIAI', icone: FileText, casa: (a: ArquivoLongo) => a.pasta.startsWith('digiai') },
] as const
type Grupo = (typeof GRUPOS)[number]['id']

const mb = (b: number) => (b / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' MB'
const ehImagem = (n: string) => /\.(jpe?g|png|webp)$/i.test(n)
const ehVideo = (n: string) => /\.mp4$/i.test(n)
// cortes/<destino>/arquivo → nome do canal; cortes/arquivo → versão base
const canalDaPasta = (pasta: string) => { const d = pasta.split('/')[1]; return d ? CANAIS[d]?.nome || d : 'Versão base' }

function Arquivo({ a, url }: { a: ArquivoLongo; url?: string }) {
  const Icone = ehVideo(a.nome) ? Film : ehImagem(a.nome) ? ImageIcon : FileText
  return (
    <li className={`${CARTAO} flex flex-col overflow-hidden`}>
      {ehImagem(a.nome) && url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={a.nome} className="aspect-video w-full object-cover" loading="lazy" />
      ) : ehVideo(a.nome) && url ? (
        <video src={url} preload="metadata" className="aspect-video w-full bg-black object-contain" />
      ) : (
        <div className="flex aspect-video items-center justify-center text-(--pulso-text-muted)"><Icone className="h-6 w-6" aria-hidden /></div>
      )}
      <div className="flex items-center gap-2 px-3 py-2 text-xs">
        <span className="min-w-0 flex-1 truncate text-(--pulso-text)" title={a.caminho}>{a.nome}</span>
        <span className="tabular-nums text-(--pulso-text-muted)">{mb(a.bytes)}</span>
        {url && <a href={url} download aria-label={`Baixar ${a.nome}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-(--pulso-action) hover:bg-(--pulso-surface-raised)"><Download className="h-3.5 w-3.5" /></a>}
      </div>
    </li>
  )
}

export default function LongosAssetsPage() {
  const { data: episodios } = useEpisodios()
  const [escolhido, setEscolhido] = useState<string | undefined>()
  const [grupo, setGrupo] = useState<Grupo>('episodio')
  const codigo = escolhido || episodios?.find((e) => e.status === 'publicado')?.codigo || episodios?.[0]?.codigo
  const { data: arquivos, isLoading, error } = useArquivosEpisodio(codigo)
  const { data: urls } = useUrlsAssinadas((arquivos || []).map((a) => a.caminho))
  const lista = arquivos || []
  const g = GRUPOS.find((x) => x.id === grupo)!
  const doGrupo = lista.filter(g.casa)
  const porCanal = grupo === 'cortes' ? [...new Set(doGrupo.map((a) => canalDaPasta(a.pasta)))] : []

  return (
    <div className="space-y-5">
      <PageHeader titulo="Assets dos Longos" subtitulo="Os arquivos de cada episódio que já estão online" />
      <label className="flex flex-wrap items-center gap-2 text-xs text-(--pulso-text-muted)">Episódio
        <select value={codigo || ''} onChange={(e) => setEscolhido(e.target.value)}
          className="min-h-11 rounded-lg border border-(--pulso-border) bg-(--pulso-surface) px-3 text-sm text-(--pulso-text) focus:border-(--pulso-action) focus:outline-none">
          {(episodios || []).map((e) => <option key={e.codigo} value={e.codigo}>{e.codigo} · {e.titulo}</option>)}
        </select>
      </label>

      {isLoading && <div className={`h-40 animate-pulse ${CARTAO}`} />}
      {error && <p className={`${CARTAO} p-6 text-sm text-(--pulso-danger)`}>Não deu para ler: {error.message}</p>}
      {arquivos && lista.length === 0 && <Vazio>Este episódio ainda não tem nada online. Os arquivos sobem quando a ficha é gerada.</Vazio>}

      {lista.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Numero icone={HardDrive} rotulo="Arquivos" valor={lista.length} sub={mb(lista.reduce((s, a) => s + a.bytes, 0))} />
            <Numero icone={Scissors} rotulo="Cortes" valor={lista.filter(GRUPOS[2].casa).length} sub="todas as versões" tom="vl" />
            <Numero icone={ImageIcon} rotulo="Capas" valor={lista.filter(GRUPOS[1].casa).length} />
            <Numero icone={Sparkles} rotulo="Stories" valor={lista.filter(GRUPOS[3].casa).length} />
          </div>
          <Abas<Grupo> ativa={grupo} onChange={setGrupo} abas={GRUPOS.map((x) => ({ id: x.id, rotulo: x.titulo, icone: x.icone, n: lista.filter(x.casa).length }))} />
          {doGrupo.length === 0 ? <Vazio>Nada aqui neste episódio.</Vazio> : grupo === 'cortes' ? (
            porCanal.map((canal) => (
              <section key={canal}>
                <h2 className="mb-2 text-xs font-semibold text-(--pulso-text)">{canal}</h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {doGrupo.filter((a) => canalDaPasta(a.pasta) === canal).map((a) => <Arquivo key={a.caminho} a={a} url={urls?.[a.caminho]} />)}
                </ul>
              </section>
            ))
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{doGrupo.map((a) => <Arquivo key={a.caminho} a={a} url={urls?.[a.caminho]} />)}</ul>
          )}
        </>
      )}
      <p className="text-[11px] text-(--pulso-text-subtle)">As fotos do seu rosto ficam só no OneDrive, de propósito.</p>
    </div>
  )
}
