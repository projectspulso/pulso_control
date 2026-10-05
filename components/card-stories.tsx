'use client'

import { useQuery } from '@tanstack/react-query'

import { Card } from '@/components/analytics-cards'
import { supabase } from '@/lib/supabase/client'

/**
 * O STORY FAZ CRESCER? — teste de 14 dias do motor de stories (docs/planos/motor-stories.md).
 * Compara o período com story (desde 03/10/2026) contra os 14 dias anteriores em três réguas:
 * seguidores/dia (contador do perfil, IG e FB), visitas ao perfil/dia (IG) e o desempenho de cada
 * story (alcance, quem sai). Veredito só com amostra: antes de 7 dias a tela diz que é cedo.
 */

const INICIO = '2026-10-03'
const VEREDITO = '2026-10-17'

type Ponto = Record<string, number | string | null>
const lerCfg = async (chave: string) => {
  const { data } = await supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', chave).maybeSingle()
  if (!data?.valor) return null
  try { return typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor } catch { return null }
}
const somaDias = (iso: string, n: number) => new Date(new Date(`${iso}T12:00:00Z`).getTime() + n * 86_400_000).toISOString().slice(0, 10)

/** ganho médio por dia de uma série acumulada (seguidores) entre duas datas */
function ganhoDia(hist: Ponto[], rede: string, de: string, ate: string): number | null {
  const pts = hist.filter((h) => typeof h[rede] === 'number' && String(h.data) >= de && String(h.data) <= ate)
  if (pts.length < 2) return null
  const dias = (new Date(String(pts[pts.length - 1].data)).getTime() - new Date(String(pts[0].data)).getTime()) / 86_400_000
  return dias > 0 ? ((pts[pts.length - 1][rede] as number) - (pts[0][rede] as number)) / dias : null
}
const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

export function CardStories() {
  const { data } = useQuery({
    queryKey: ['card-stories'],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const [seg, conta, st] = await Promise.all([
        lerCfg('seguidores_historico'),
        lerCfg('ig_conta_diaria'),
        supabase.schema('pulso_content').from('stories').select('rede, modo, status, metricas, created_at').gte('created_at', `${INICIO}T00:00:00`),
      ])
      return { seg: (Array.isArray(seg) ? seg : seg?.historico || []) as Ponto[], conta: (conta?.historico || []) as Ponto[], stories: (st.data || []) as Array<{ rede: string; modo: string; status: string; metricas: Record<string, number> | null }> }
    },
  })
  if (!data) return null

  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const diasTeste = Math.max(0, Math.round((new Date(hoje).getTime() - new Date(INICIO).getTime()) / 86_400_000))
  const antesDe = somaDias(INICIO, -14)
  const linhas = (['instagram', 'facebook'] as const).map((rede) => ({
    rede, antes: ganhoDia(data.seg, rede, antesDe, INICIO), depois: ganhoDia(data.seg, rede, INICIO, hoje),
  }))
  const visitas = (de: string, ate: string) => media(data.conta.filter((c) => String(c.data) >= de && String(c.data) < ate && typeof c.profile_views === 'number').map((c) => c.profile_views as number))
  const visAntes = visitas(antesDe, INICIO)
  const visDepois = visitas(INICIO, hoje)

  const medidos = data.stories.filter((s) => s.rede === 'instagram' && s.metricas)
  const alcance = media(medidos.map((s) => s.metricas!.reach ?? 0))
  const saidas = medidos.reduce((a, s) => a + (s.metricas!.nav_tap_exit ?? 0), 0)
  const totalAlcance = medidos.reduce((a, s) => a + (s.metricas!.reach ?? 0), 0)
  const follows = medidos.reduce((a, s) => a + (s.metricas!.follows ?? 0), 0)
  const visitasStory = medidos.reduce((a, s) => a + (s.metricas!.profile_visits ?? 0), 0)
  const autos = data.stories.filter((s) => s.modo === 'auto')
  const manuais = data.stories.filter((s) => s.modo === 'manual')

  const f1 = (n: number | null) => (n == null ? '—' : n.toLocaleString('pt-BR', { maximumFractionDigits: 1 }))
  const seta = (a: number | null, d: number | null) => (a == null || d == null ? '' : d > a * 1.1 ? '▲' : d < a * 0.9 ? '▼' : '≈')
  const cedo = diasTeste < 7

  return (
    <Card
      titulo="O story faz crescer?"
      sub={`teste de 14 dias · dia ${Math.min(diasTeste, 14)} de 14 · veredito em ${VEREDITO.split('-').reverse().join('/')}`}
      rodape={cedo
        ? <>Ainda é cedo: com menos de 7 dias, qualquer diferença pode ser o tema do vídeo do dia, não o story.</>
        : <>Comparação com os 14 dias antes de 03/10. Seguidor vem do contador do perfil; visitas ao perfil, do Instagram.</>}
    >
      <div className="space-y-4 pt-1">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-[#6f6b7d]">
              <th className="pb-1.5 font-normal">régua</th><th className="pb-1.5 font-normal">14 dias antes</th><th className="pb-1.5 font-normal">com story</th>
            </tr>
          </thead>
          <tbody className="text-[#a3a0b0]">
            {linhas.map((l) => (
              <tr key={l.rede} className="border-t border-white/5">
                <td className="py-1.5">seguidores/dia · {l.rede === 'instagram' ? 'Instagram' : 'Facebook'}</td>
                <td className="py-1.5 tabular-nums">{f1(l.antes)}</td>
                <td className="py-1.5 tabular-nums text-[#f5f4f8]">{f1(l.depois)} <span className="text-[10px]">{seta(l.antes, l.depois)}</span></td>
              </tr>
            ))}
            <tr className="border-t border-white/5">
              <td className="py-1.5">visitas ao perfil/dia · Instagram</td>
              <td className="py-1.5 tabular-nums">{f1(visAntes)}</td>
              <td className="py-1.5 tabular-nums text-[#f5f4f8]">{f1(visDepois)} <span className="text-[10px]">{seta(visAntes, visDepois)}</span></td>
            </tr>
          </tbody>
        </table>
        <div className="grid grid-cols-2 gap-3 text-[11px] text-[#a3a0b0] sm:grid-cols-4">
          <div><p className="text-lg font-semibold tabular-nums text-[#f5f4f8]">{f1(alcance)}</p>alcance médio por story (IG, {medidos.length} medidos)</div>
          <div><p className="text-lg font-semibold tabular-nums text-[#f5f4f8]">{totalAlcance ? `${Math.round((saidas / totalAlcance) * 100)}%` : '—'}</p>saíram do story (quanto menor, melhor)</div>
          <div><p className="text-lg font-semibold tabular-nums text-[#f5f4f8]">{follows}</p>seguidores vindos do story</div>
          <div><p className="text-lg font-semibold tabular-nums text-[#f5f4f8]">{visitasStory}</p>visitas ao perfil vindas do story</div>
        </div>
        <p className="text-[11px] text-[#6f6b7d]">
          {autos.filter((s) => s.status === 'publicado').length} automáticos publicados ({autos.filter((s) => s.status === 'erro').length} com erro) ·
          {' '}{manuais.filter((s) => s.status === 'feito').length} de {manuais.length} manuais postados (TikTok/Kwai)
        </p>
      </div>
    </Card>
  )
}
