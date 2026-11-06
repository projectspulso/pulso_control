'use client'

import { useState } from 'react'
import { Download, FileText, Film, Image as ImageIcon } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { useArquivosEpisodio, useEpisodios, useUrlsAssinadas, type ArquivoLongo } from '@/lib/hooks/use-longos'

const CARTAO = 'rounded-2xl border border-(--pulso-border) bg-(--pulso-surface)'

/**
 * Assets dos Longos (06/11/2026): o que cada episódio já tem online, no bucket bastidores. Separado dos
 * Assets dos Curtos (banco de clips do b-roll), que não servem aos Longos. As fotos do rosto do dono
 * não aparecem aqui: moram só no OneDrive (o repositório é público e o rosto nunca sobe).
 */
const GRUPOS: { id: string; titulo: string; casa: (a: ArquivoLongo) => boolean }[] = [
  { id: 'episodio', titulo: 'Episódio', casa: (a) => a.pasta === '' && !a.nome.startsWith('capa') },
  { id: 'capas', titulo: 'Capas', casa: (a) => a.pasta === '' && a.nome.startsWith('capa') },
  { id: 'cortes', titulo: 'Cortes', casa: (a) => a.pasta.startsWith('cortes') },
  { id: 'stories', titulo: 'Stories', casa: (a) => a.pasta.startsWith('stories') },
  { id: 'digiai', titulo: 'DIGIAI (carrossel e LinkedIn)', casa: (a) => a.pasta.startsWith('digiai') },
]

const mb = (b: number) => (b / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' MB'
const ehImagem = (n: string) => /\.(jpe?g|png|webp)$/i.test(n)
const ehVideo = (n: string) => /\.mp4$/i.test(n)

function Arquivo({ a, url }: { a: ArquivoLongo; url?: string }) {
  const Icone = ehVideo(a.nome) ? Film : ehImagem(a.nome) ? ImageIcon : FileText
  return (
    <li className="flex flex-col overflow-hidden rounded-xl border border-(--pulso-border) bg-(--pulso-bg)">
      {ehImagem(a.nome) && url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={a.nome} className="aspect-video w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex aspect-video items-center justify-center text-(--pulso-text-muted)"><Icone className="h-6 w-6" /></div>
      )}
      <div className="flex items-center gap-2 px-3 py-2 text-xs">
        <span className="min-w-0 flex-1 truncate text-(--pulso-text)" title={a.caminho}>{a.pasta ? `${a.pasta}/` : ''}{a.nome}</span>
        <span className="tabular-nums text-(--pulso-text-muted)">{mb(a.bytes)}</span>
        {url && (
          <a href={url} download className="text-(--pulso-action) hover:underline" aria-label={`Baixar ${a.nome}`}>
            <Download className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </li>
  )
}

export default function LongosAssetsPage() {
  const { data: episodios } = useEpisodios()
  const [escolhido, setEscolhido] = useState<string | undefined>()
  const codigo = escolhido || episodios?.[0]?.codigo
  const { data: arquivos, isLoading, error } = useArquivosEpisodio(codigo)
  const { data: urls } = useUrlsAssinadas((arquivos || []).map((a) => a.caminho))
  const total = (arquivos || []).reduce((s, a) => s + a.bytes, 0)

  return (
    <div className="space-y-5">
      <PageHeader titulo="Assets dos Longos" subtitulo="Tudo o que cada episódio já tem online: vídeo, capas, cortes, stories e as peças da DIGIAI" />
      <div className="flex flex-wrap gap-2">
        {(episodios || []).map((e) => (
          <button key={e.codigo} type="button" onClick={() => setEscolhido(e.codigo)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${e.codigo === codigo ? 'border-(--pulso-action) text-(--pulso-action)' : 'border-(--pulso-border) text-(--pulso-text-muted) hover:text-(--pulso-text)'}`}>
            {e.codigo} · {e.titulo}
          </button>
        ))}
      </div>
      {isLoading && <div className={`h-40 animate-pulse ${CARTAO}`} />}
      {error && <p className={`${CARTAO} p-6 text-sm text-(--pulso-danger)`}>Não deu para ler: {error.message}</p>}
      {arquivos && arquivos.length === 0 && (
        <p className={`${CARTAO} p-6 text-sm text-(--pulso-text-muted)`}>Este episódio ainda não tem nada online. Os arquivos sobem quando a ficha é gerada.</p>
      )}
      {arquivos && arquivos.length > 0 && (
        <>
          <p className="text-xs text-(--pulso-text-muted)">{arquivos.length} arquivos · {mb(total)}</p>
          {GRUPOS.map((g) => {
            const lista = arquivos.filter(g.casa)
            if (!lista.length) return null
            return (
              <section key={g.id} className={`${CARTAO} p-5`}>
                <h2 className="mb-3 text-sm font-semibold text-(--pulso-text)">{g.titulo} <span className="font-normal text-(--pulso-text-muted)">· {lista.length}</span></h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {lista.map((a) => <Arquivo key={a.caminho} a={a} url={urls?.[a.caminho]} />)}
                </ul>
              </section>
            )
          })}
        </>
      )}
      <p className="text-xs text-(--pulso-text-muted)">As fotos e o avatar do seu rosto não aparecem aqui de propósito: ficam só no OneDrive.</p>
    </div>
  )
}
