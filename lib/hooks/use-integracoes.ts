import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export type StatusIntegracao = 'ok' | 'atencao' | 'desconhecido'

export interface Integracao {
  chave: string
  nome: string
  para_que: string // o que essa integração faz no PULSO
  categoria: 'dados' | 'publicacao' | 'geracao' | 'automacao'
  status: StatusIntegracao
  detalhe: string
}

function diasAtras(iso?: string | null): number | null {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  return Math.floor(ms / 86400000)
}

export function useIntegracoes() {
  return useQuery<Integracao[]>({
    queryKey: ['integracoes-health'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const content = (t: string) => supabase.schema('pulso_content').from(t)

      // sinais reais do banco
      const [mp, audios, pronto, configs] = await Promise.all([
        content('metricas_publicacao').select('plataforma, ultima_atualizacao').order('ultima_atualizacao', { ascending: false }).limit(200),
        content('audios').select('id, created_at').order('created_at', { ascending: false }).limit(1),
        content('pipeline_producao').select('updated_at').eq('status', 'PRONTO_PUBLICACAO').order('updated_at', { ascending: false }).limit(1),
        supabase.schema('pulso_core').from('configuracoes').select('chave'),
      ])

      const rows = mp.data || []
      const ultMeta = rows.find((r: { plataforma: string }) => r.plataforma === 'instagram' || r.plataforma === 'facebook')?.ultima_atualizacao
      const ultYt = rows.find((r: { plataforma: string }) => r.plataforma === 'youtube')?.ultima_atualizacao
      const ultTk = rows.find((r: { plataforma: string }) => r.plataforma === 'tiktok')?.ultima_atualizacao
      const ultKwai = rows.find((r: { plataforma: string }) => r.plataforma === 'kwai')?.ultima_atualizacao
      const ultAudio = audios.data?.[0]?.created_at
      const ultPronto = pronto.data?.[0]?.updated_at
      const chaves = new Set((configs.data || []).map((c: { chave: string }) => c.chave))

      const recente = (iso?: string | null, lim = 7): StatusIntegracao => {
        const d = diasAtras(iso)
        if (d === null) return 'desconhecido'
        return d <= lim ? 'ok' : 'atencao'
      }
      const txtDias = (iso?: string | null) => {
        const d = diasAtras(iso)
        return d === null ? 'sem atividade registrada' : d === 0 ? 'hoje' : `há ${d}d`
      }

      return [
        { chave: 'supabase', nome: 'Supabase', para_que: 'Banco de tudo: ideias, roteiros, pipeline, métricas e configurações.', categoria: 'dados', status: 'ok', detalhe: 'Conectado (o app está lendo agora).' },
        { chave: 'meta', nome: 'Meta API (Instagram + Facebook)', para_que: 'Publica reels no Instagram via API e coleta métricas de IG e FB.', categoria: 'publicacao', status: recente(ultMeta), detalhe: `Última métrica IG/FB ${txtDias(ultMeta)}.` },
        { chave: 'youtube', nome: 'YouTube (Data + Analytics)', para_que: 'Coleta views/retenção dos Shorts e auto-captura as publicações pelo título/descrição.', categoria: 'publicacao', status: chaves.has('youtube_oauth') ? recente(ultYt) : 'atencao', detalhe: chaves.has('youtube_oauth') ? `OAuth ok · última métrica ${txtDias(ultYt)}.` : 'OAuth ausente — reautorizar.' },
        { chave: 'tiktok', nome: 'TikTok', para_que: 'Coleta a lista de vídeos pra reconciliar publicações feitas no celular.', categoria: 'publicacao', status: recente(ultTk, 14), detalhe: `Última métrica ${txtDias(ultTk)}.` },
        { chave: 'kwai', nome: 'Kwai (manual)', para_que: 'Rede sem API — posta pelo celular e os números entram pela Central de Publicação (views/curtidas + perfil).', categoria: 'publicacao', status: recente(ultKwai, 3), detalhe: `Última atualização manual ${txtDias(ultKwai)}.` },
        { chave: 'openai', nome: 'OpenAI (cérebro)', para_que: 'Gera os roteiros e as cenas (prompts de vídeo) de cada ideia aprovada.', categoria: 'geracao', status: 'desconhecido', detalhe: 'Chave no servidor (Vercel) — roda no auto-funil e no gerar-cenas.' },
        { chave: 'elevenlabs', nome: 'ElevenLabs', para_que: 'Voz oficial do PULSO — narração de cada vídeo.', categoria: 'geracao', status: recente(ultAudio, 14), detalhe: `Último áudio gerado ${txtDias(ultAudio)}.` },
        { chave: 'higgsfield', nome: 'Higgsfield (Veo)', para_que: 'Gera os clips de vídeo das cenas. Teto de 600 créditos/dia + banco de clips reusáveis.', categoria: 'geracao', status: 'desconhecido', detalhe: 'CLI local — controlado pelo guard de custo.' },
        { chave: 'worker', nome: 'Worker de render (local)', para_que: 'Monta os vídeos (TTS + clips + CTA + QC) e marca PRONTO. Roda 3×/dia (08/16/23h).', categoria: 'automacao', status: recente(ultPronto, 3), detalhe: `Último vídeo PRONTO ${txtDias(ultPronto)}.` },
        { chave: 'crons', nome: 'Crons (Vercel)', para_que: 'Reconciliar publicações (10:50), coletar métricas (11:00), auto-funil de roteiros (12:00), popular agenda (12:30).', categoria: 'automacao', status: 'ok', detalhe: 'Agendados em vercel.json (UTC).' },
      ]
    },
  })
}
