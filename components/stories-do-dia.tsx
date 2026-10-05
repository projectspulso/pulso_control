'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Circle, Download, XCircle } from 'lucide-react'

import { supabase } from '@/lib/supabase/client'

/**
 * STORIES DE HOJE — motor de stories (docs/planos/motor-stories.md). Instagram e Facebook saem
 * sozinhos (17h e 19h40); TikTok e Kwai aparecem aqui como tarefa: baixa a arte, posta no app e marca.
 */

type Story = {
  id: string
  rede: string
  momento: 'antes' | 'depois'
  tipo: 'imagem' | 'video'
  asset_url: string
  status: string
  modo: 'auto' | 'manual'
  erro: string | null
  publicado_em: string | null
}

const REDE: Record<string, string> = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', kwai: 'Kwai' }
const MOMENTO = { antes: 'Antes das 19h', depois: 'Depois que saiu' }

export function StoriesDoDia() {
  const qc = useQueryClient()
  const { data: stories = [] } = useQuery({
    queryKey: ['stories-do-dia'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async (): Promise<Story[]> => {
      // os de HOJE + qualquer pendente anterior: com janela fixa de 20h, o manual de ontem sumia da
      // lista antes de ser marcado (os 10 de 03–04/10 ficaram "pendente" sem aparecer em lugar nenhum)
      const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
      const { data } = await supabase.schema('pulso_content').from('stories')
        .select('id, rede, momento, tipo, asset_url, status, modo, erro, publicado_em, created_at')
        .or(`created_at.gte.${hoje}T03:00:00Z,status.eq.pendente`).order('created_at')
      return (data || []) as Story[]
    },
  })
  const marcar = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const r = await fetch('/api/stories/marcar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) })
      if (!r.ok) throw new Error((await r.json()).error || 'falhou')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories-do-dia'] }),
  })

  const manuais = stories.filter((s) => s.modo === 'manual')
  const autos = stories.filter((s) => s.modo === 'auto')
  const pendentes = manuais.filter((s) => s.status === 'pendente').length

  return (
    <div className="rounded-2xl border border-white/8 bg-[#1a1922] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-white">Stories de hoje</h3>
        <span className="text-[11px] text-zinc-500">
          Instagram e Facebook saem sozinhos às 17h e 19h40 · TikTok e Kwai são com você
          {pendentes > 0 && <b className="ml-1.5 text-amber-300">· {pendentes} para postar</b>}
        </span>
      </div>

      {stories.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">Nenhum story ainda hoje — o primeiro sai às 17h.</p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-wide text-zinc-500">Para você postar</p>
            <div className="space-y-2">
              {manuais.map((s) => (
                <div key={s.id} className={`flex items-center gap-3 rounded-xl border p-2.5 ${s.status === 'pendente' ? 'border-amber-500/30 bg-amber-500/[0.05]' : 'border-white/8 bg-black/20'}`}>
                  {s.status === 'feito' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <Circle className="h-4 w-4 shrink-0 text-amber-400" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-200">{REDE[s.rede]} · {s.tipo === 'imagem' ? 'pergunta (imagem)' : 'teaser (vídeo)'}</p>
                    <p className="text-[11px] text-zinc-500">{MOMENTO[s.momento]}</p>
                  </div>
                  <a href={s.asset_url} target="_blank" rel="noreferrer" download className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white" title="Baixar a arte">
                    <Download className="h-4 w-4" />
                  </a>
                  {s.status === 'pendente' ? (
                    <button type="button" onClick={() => marcar.mutate({ id: s.id, status: 'feito' })} disabled={marcar.isPending}
                      className="rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-violet-500 disabled:opacity-50">
                      Postei
                    </button>
                  ) : (
                    <button type="button" onClick={() => marcar.mutate({ id: s.id, status: 'pendente' })} className="text-[11px] text-zinc-500 hover:text-zinc-300">desfazer</button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-wide text-zinc-500">Automáticos</p>
            <div className="space-y-2">
              {autos.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/20 p-2.5">
                  {s.status === 'publicado' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <XCircle className="h-4 w-4 shrink-0 text-red-400" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-200">{REDE[s.rede]} · {s.tipo === 'imagem' ? 'pergunta' : 'teaser'} · {MOMENTO[s.momento].toLowerCase()}</p>
                    <p className="truncate text-[11px] text-zinc-500" title={s.erro || ''}>
                      {s.status === 'publicado' && s.publicado_em ? `saiu às ${new Date(s.publicado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : s.erro || s.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
