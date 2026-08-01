'use client'

import { useState } from 'react'
import { Camera, Check, ChevronDown, ChevronRight, Copy, Plus, Save, Smartphone } from 'lucide-react'

import { useCentralPublicacao, useSalvarPublicacao, REDES_PADRAO, type PubRede } from '@/lib/hooks/use-central-publicacao'

/**
 * O QUE PRECISA PRA PUBLICAR ESTE VÍDEO — título e legenda por rede, editáveis e salváveis, mais
 * o passo a passo de cada rede.
 *
 * Nasceu de uma fusão. A mesma informação vivia em três lugares: a Central de Publicação no
 * /assets (título/legenda por rede, salvável), o Kit de publicação no /publicar (o passo a passo
 * com os macetes de COPPA e do composer do Facebook) e a legenda solta na ficha. Três telas
 * contando a mesma coisa é convite pra divergirem — e o dono cobrou: "senão teremos informações
 * duplicadas no app".
 *
 * Agora mora só aqui, na ficha do vídeo, que é o lugar onde a pergunta nasce ("como eu posto o
 * 118?"). A lista do /assets virou lista mesmo, com botão de detalhes.
 */

// Redes 100% manuais (sem API/coletor) — o "já publicado" só entra quando você marca no app.
const REDES_MANUAIS = new Set(['kwai'])
const HASHTAGS_KWAI = '#curiosidades #misterios #voceSabia #pulso #fyp #viral'
const HUB_EXTERNO = 'https://pulsohub.vercel.app'
const FB_COMPOSER = 'https://business.facebook.com/latest/reels_composer'

/** Macetes que só existem porque doeram: COPPA, portfólio errado, alcance suprimido. */
const PASSOS: Record<string, string[]> = {
  youtube: [
    'Sobe pela API — confira só se saiu',
    'Se for manual: Criar → Enviar vídeo → marque "não é para crianças" (COPPA)',
    'Cole o título curto e a descrição com o link do hub',
  ],
  facebook: [
    'MANUAL sempre — via API o alcance vai a zero (testado em 11/07)',
    'Business Suite → Reels → escolha a página Pulso Projects (NÃO a das Óticas)',
    'Cole a legenda · desmarque o crosspost pro Instagram',
  ],
  tiktok: ['O app já criou o rascunho — abra o TikTok no celular', 'Cole a legenda', 'Publicar'],
  instagram: [
    'Sobe pela API',
    'Se for manual: app do IG → + → Reel → selecione o vídeo → cole a legenda',
  ],
  kwai: [
    '📱 Só pelo celular (o vídeo do rascunho do TikTok já está na galeria)',
    'App Kwai → + → Álbum → selecione o vídeo',
    'Cole a legenda (com as hashtags do Kwai)',
    'Métricas depois: print da Central de Dados pro Claude — nunca digitar número',
  ],
}

function Copiar({ texto, label }: { texto: string; label?: string }) {
  const [ok, setOk] = useState(false)
  if (!texto) return null
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(texto); setOk(true); setTimeout(() => setOk(false), 1200) }}
      className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-200"
    >
      {ok ? <><Check className="h-3 w-3 text-emerald-400" /> copiado</> : <><Copy className="h-3 w-3" /> {label || 'copiar'}</>}
    </button>
  )
}

export function PublicarPorRede({ ideiaId }: { ideiaId: string }) {
  const { data, isLoading } = useCentralPublicacao()
  const salvar = useSalvarPublicacao()
  const video = data?.find((v) => v.ideiaId === ideiaId) ?? null

  const [edits, setEdits] = useState<Record<string, PubRede> | null>(null)
  const [passos, setPassos] = useState<string | null>(null)
  const [novaRede, setNovaRede] = useState('')

  if (isLoading) return <div className="h-24 animate-pulse rounded-xl bg-black/20" />
  if (!video) return <p className="text-sm text-zinc-600">Este vídeo ainda não entrou no pipeline de produção.</p>
  if (!video.pronto) {
    return (
      <p className="text-sm text-zinc-400">
        Vídeo <b className="text-amber-300">em produção</b> ({video.status.toLowerCase().replace(/_/g, ' ')}).
        Título e legenda por rede aparecem quando ficar pronto.
      </p>
    )
  }

  const atuais = edits ?? video.publicacao
  const redes = Array.from(new Set([...REDES_PADRAO, ...Object.keys(atuais)]))
  const hubUrl = video.numero != null ? `${HUB_EXTERNO}/v/${video.numero}` : HUB_EXTERNO
  const usaTitulo = (rede: string) => rede === 'youtube'

  function get(rede: string, campo: 'titulo' | 'legenda'): string {
    const salvo = atuais[rede]?.[campo]
    if (salvo != null) return salvo
    if (campo === 'titulo') return rede === 'youtube' ? video!.tituloCurto : ''
    // Só o YouTube leva link na descrição. Em IG/TikTok/FB o link não fica clicável e derruba o
    // alcance (a rede penaliza quem manda o público pra fora) — ali o link vive na bio.
    if (rede === 'youtube') return `${video!.captionBase}\n\n🔗 Mais histórias: ${HUB_EXTERNO}`
    if (rede === 'kwai') return `${video!.captionBase}\n\n${HASHTAGS_KWAI}`
    return video!.captionBase
  }
  function set(rede: string, campo: 'titulo' | 'legenda', valor: string) {
    setEdits({ ...atuais, [rede]: { ...atuais[rede], [campo]: valor } })
  }
  function addRede() {
    const r = novaRede.trim().toLowerCase()
    if (!r || redes.includes(r)) return
    setEdits({ ...atuais, [r]: { legenda: video!.captionBase } })
    setNovaRede('')
  }

  // Vídeos antigos (os primeiros ~50) foram publicados antes de a legenda ser guardada no
  // pipeline: sobra só o código #pulsoNNN. Dizer isso é melhor que mostrar um campo quase vazio
  // e deixar parecer que a legenda sumiu.
  const semLegendaBase = video.captionBase.replace(/#pulso\d+/i, '').trim().length === 0

  return (
    <div className="space-y-3">
      {semLegendaBase && (
        <p className="rounded-lg border border-white/8 bg-black/20 px-3 py-2 text-[11px] text-zinc-500">
          A legenda deste vídeo não ficou registrada — ele é anterior ao momento em que passamos a
          guardar a legenda no pipeline. O que aparece abaixo é só o código de ligação entre redes.
        </p>
      )}
      {video.numero != null && (
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.05] px-3.5 py-2.5">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-sky-300">Link do hub (cross-rede / SEO)</span>
            <Copiar texto={hubUrl} />
          </div>
          <code className="block break-all text-xs text-zinc-300">{hubUrl}</code>
          <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">
            Vai na <b className="text-zinc-400">descrição do YouTube</b> e na <b className="text-zinc-400">bio</b> das outras.
            Não colar em legenda de IG/TikTok/FB — não fica clicável e derruba o alcance.
          </p>
        </div>
      )}

      {redes.map((rede) => {
        const jaPub = video.publicadoEm.includes(rede)
        const dataPub = video.publicadoDatas[rede]
        return (
          <div key={rede} className={`rounded-xl p-3.5 ${jaPub ? 'border border-amber-500/30 bg-amber-500/[0.05]' : 'border border-white/8 bg-black/20'}`}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-300">{rede}</span>
              {REDES_MANUAIS.has(rede) && (
                <span className="inline-flex items-center gap-0.5 rounded bg-zinc-800 px-1 py-0.5 text-[9px] text-zinc-400" title="Rede manual — só posta pelo celular">
                  <Smartphone className="h-2.5 w-2.5" /> celular
                </span>
              )}
              {jaPub && (
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                  já publicado{dataPub ? ` em ${dataPub}` : ''} — não repostar
                </span>
              )}
              <button
                onClick={() => setPassos((p) => (p === rede ? null : rede))}
                className="ml-auto inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-300"
              >
                {passos === rede ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />} como postar
              </button>
            </div>

            {passos === rede && PASSOS[rede] && (
              <ol className="mb-2 list-decimal space-y-0.5 rounded-lg bg-black/30 p-3 pl-6 text-[11px] text-zinc-300">
                {PASSOS[rede].map((p) => <li key={p}>{p}</li>)}
                {rede === 'facebook' && (
                  <a href={FB_COMPOSER} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[10px] font-semibold text-violet-300 hover:text-violet-200">
                    → abrir composer Pulso Projects
                  </a>
                )}
              </ol>
            )}

            {REDES_MANUAIS.has(rede) && (
              <div className="mb-2 flex items-center gap-2 rounded-md bg-sky-500/5 p-2 text-[10px] text-sky-200/80 ring-1 ring-sky-500/20">
                <Camera className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                <span>Métricas por <b>foto</b>: mande o print da Central de Dados do Kwai pro Claude, que lê vídeo a vídeo e grava com validação. Sem digitar número.</span>
              </div>
            )}

            {usaTitulo(rede) && (
              <div className="mb-2">
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-[10px] text-zinc-500">Título</label>
                  <Copiar texto={get(rede, 'titulo')} />
                </div>
                <input
                  value={get(rede, 'titulo')}
                  onChange={(e) => set(rede, 'titulo', e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none"
                />
              </div>
            )}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[10px] text-zinc-500">{usaTitulo(rede) ? 'Descrição' : 'Legenda'}</label>
                <Copiar texto={get(rede, 'legenda')} />
              </div>
              <textarea
                value={get(rede, 'legenda')}
                onChange={(e) => set(rede, 'legenda', e.target.value)}
                rows={3}
                className="w-full resize-y rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>
        )
      })}

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={novaRede}
          onChange={(e) => setNovaRede(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addRede()}
          placeholder="nova rede (ex.: linkedin)"
          className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-zinc-300 focus:border-violet-500 focus:outline-none"
        />
        <button onClick={addRede} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1.5 text-xs text-zinc-300 hover:bg-white/5">
          <Plus className="h-3 w-3" /> adicionar rede
        </button>
        <button
          onClick={() => salvar.mutate({ pipelineId: video.pipelineId, publicacao: atuais })}
          disabled={salvar.isPending}
          className="ml-auto inline-flex items-center gap-1 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
        >
          <Save className="h-3 w-3" /> {salvar.isPending ? 'salvando…' : salvar.isSuccess ? 'salvo ✓' : 'salvar'}
        </button>
      </div>
    </div>
  )
}
