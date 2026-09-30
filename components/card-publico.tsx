'use client'

import { useQuery } from '@tanstack/react-query'

import { Card } from '@/components/analytics-cards'
import type { Fatia, PublicoRedes } from '@/lib/automation/publico-redes'
import { supabase } from '@/lib/supabase/client'

// o módulo de coleta é de servidor (token do YouTube): aqui só entram os tipos
const GENERO: Record<string, string> = { male: 'homens', female: 'mulheres', M: 'homens', F: 'mulheres', U: 'não informado', user_specified: 'outro' }

const ORIGEM: Record<string, string> = {
  SHORTS: 'feed de Shorts', YT_SEARCH: 'busca', YT_CHANNEL: 'página do canal', YT_OTHER_PAGE: 'outras páginas',
  SUBSCRIBER: 'inscritos', EXT_URL: 'links externos', RELATED_VIDEO: 'relacionados', PLAYLIST: 'playlists',
}

function Barras({ titulo, fatias, nome }: { titulo: string; fatias: Fatia[]; nome?: (r: string) => string }) {
  const max = Math.max(...fatias.map((f) => f.pct), 1)
  return (
    <div>
      <p className="mb-1.5 text-[10px] uppercase tracking-wide text-[#6f6b7d]">{titulo}</p>
      <div className="space-y-1">
        {fatias.map((f) => (
          <div key={f.rotulo} className="grid grid-cols-[92px_1fr_42px] items-center gap-2">
            <span className="truncate text-[11px] text-[#a3a0b0]" title={f.rotulo}>{nome ? nome(f.rotulo) : f.rotulo}</span>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-[#9085e9]" style={{ width: `${(f.pct / max) * 100}%` }} />
            </div>
            <span className="text-right text-[11px] tabular-nums text-[#a3a0b0]">{f.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Quem assiste — gravado pela rotina diária em configuracoes.publico_redes. */
export function CardPublico() {
  const { data: p } = useQuery({
    queryKey: ['publico-redes'],
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<PublicoRedes | null> => {
      const { data } = await supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'publico_redes').maybeSingle()
      if (!data?.valor) return null
      return typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor
    },
  })

  if (!p) {
    return (
      <Card titulo="Quem assiste" sub="YouTube e Instagram">
        <p className="text-sm text-[#6f6b7d]">Ainda sem coleta — a rotina das 04h (Brasília) grava o perfil do público.</p>
      </Card>
    )
  }
  const quando = new Date(p.atualizadoEm).toLocaleDateString('pt-BR')
  const nomeGenero = (r: string) => GENERO[r] ?? r

  return (
    <Card
      titulo="Quem assiste"
      sub={`medido pelas plataformas · atualizado ${quando}`}
      rodape={<>O Facebook não entrega mais demografia de Página. No Instagram é o perfil de quem <b className="font-medium text-[#f5f4f8]">segue</b>; no YouTube, de quem <b className="font-medium text-[#f5f4f8]">assistiu</b> nos últimos {p.youtube?.janelaDias ?? 90} dias.</>}
    >
      <div className="grid gap-5 pt-1 md:grid-cols-2">
        {p.youtube && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-[#f5f4f8]">
              YouTube
              {p.youtube.inscritosPct != null && <span className="ml-2 font-normal text-[#6f6b7d]">{p.youtube.inscritosPct}% das views vêm de inscritos</span>}
            </p>
            <Barras titulo="Idade" fatias={p.youtube.idade} />
            <Barras titulo="Gênero" fatias={p.youtube.genero} nome={nomeGenero} />
            <Barras titulo="De onde vem a view" fatias={p.youtube.origem} nome={(r) => ORIGEM[r] ?? r.toLowerCase()} />
            <Barras titulo="País" fatias={p.youtube.paises.slice(0, 5)} />
          </div>
        )}
        {p.instagram && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-[#f5f4f8]">Instagram <span className="font-normal text-[#6f6b7d]">seguidores</span></p>
            <Barras titulo="Idade" fatias={p.instagram.idade} />
            <Barras titulo="Gênero" fatias={p.instagram.genero} nome={nomeGenero} />
            <Barras titulo="Cidade" fatias={p.instagram.cidades} nome={(r) => r.split(',')[0]} />
          </div>
        )}
      </div>
      {p.erros.length > 0 && <p className="mt-3 text-[10px] text-amber-400/80">Falhou nesta coleta: {p.erros.join(' · ')}</p>}
    </Card>
  )
}
