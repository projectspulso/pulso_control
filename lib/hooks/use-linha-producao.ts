import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'

/**
 * LINHA DE PRODUÇÃO — o ritmo diário da fábrica num hook só.
 * Lê a config pulso_core.configuracoes:linha_producao (caps e buffers), mede cada
 * etapa do funil e monta o checklist do dia. A fila 2×1 (próximos renders, estoque
 * × concorrente) vem do GET /api/producao/produzir-dia — mesma ordem que o POST autoriza.
 */

export interface ConfigLinha {
  render_dia_max: number
  publicar_dia: number
  intercalar: { estoque: number; concorrente: number }
  buffer_audio_max: number
  roteiros_dia_max: number
  buffer_pronto_min: number
  buffer_pronto_max: number
}

export interface FilaItem {
  id: string
  numero: number | null
  titulo: string
  canal: string
  notaHook: number | null
  concorrente: boolean
}

export interface LinhaProducao {
  cfg: ConfigLinha
  // buffers (estoque em cada etapa)
  aprovadasSemRoteiro: number
  concorrenteSemRoteiro: number
  roteiroPronto: number
  audioGerado: number
  filaRender: number // EM_EDICAO (autorizados — o worker consome 3×/dia)
  prontos: number // PRONTO_PUBLICACAO com vídeo
  // checklist do dia
  publicadosHoje: number
  roteirosHoje: number
  audiosHoje: number
  audioPausado: boolean // buffer de áudio cheio → auto-audio pula
  // fila 2×1
  fila10: FilaItem[]
  custoLoteBrl: number | null
}

const CFG_DEFAULT: ConfigLinha = {
  render_dia_max: 3, publicar_dia: 2, intercalar: { estoque: 2, concorrente: 1 },
  buffer_audio_max: 15, roteiros_dia_max: 3, buffer_pronto_min: 4, buffer_pronto_max: 6,
}

export function useLinhaProducao() {
  return useQuery<LinhaProducao>({
    queryKey: ['linha-producao'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const hoje = new Date().toISOString().slice(0, 10)
      const [cfgQ, pipeQ, ideiasQ, rotQ, audQ, pubQ] = await Promise.all([
        supabase.schema('pulso_core').from('configuracoes').select('valor').eq('chave', 'linha_producao').maybeSingle(),
        supabase.schema('pulso_content').from('pipeline_producao').select('ideia_id, status, metadata'),
        supabase.schema('pulso_content').from('ideias').select('id, status, origem'),
        supabase.schema('pulso_content').from('roteiros').select('ideia_id, created_at'),
        supabase.schema('pulso_content').from('audios').select('id, created_at'),
        supabase.schema('pulso_content').from('metricas_publicacao').select('ideia_id, data_publicacao'),
      ])

      let cfg = CFG_DEFAULT
      try { if (cfgQ.data?.valor) cfg = { ...CFG_DEFAULT, ...JSON.parse(cfgQ.data.valor) } } catch { /* default */ }

      const pipe = pipeQ.data || []
      const porStatus = (s: string) => pipe.filter((p) => p.status === s)
      const comRoteiro = new Set((rotQ.data || []).map((r) => r.ideia_id))
      const aprovadas = (ideiasQ.data || []).filter((i) => i.status === 'APROVADA' && !comRoteiro.has(i.id))

      const audioGerado = porStatus('AUDIO_GERADO').length
      const prontos = pipe.filter(
        (p) => p.status === 'PRONTO_PUBLICACAO' && (p.metadata as { video_url?: string } | null)?.video_url,
      ).length

      // fila 2×1 — mesma fonte que o botão Produzir o Dia usa pra autorizar
      let fila10: FilaItem[] = []
      let custoLoteBrl: number | null = null
      try {
        const r = await fetch('/api/producao/produzir-dia')
        if (r.ok) {
          const d = await r.json()
          fila10 = d.fila10 || []
          custoLoteBrl = d.custoEstimadoBrl ?? null
        }
      } catch { /* painel segue sem a fila */ }

      return {
        cfg,
        aprovadasSemRoteiro: aprovadas.length,
        concorrenteSemRoteiro: aprovadas.filter((i) => i.origem === 'BENCHMARK_CONCORRENTE').length,
        roteiroPronto: porStatus('ROTEIRO_PRONTO').length,
        audioGerado,
        filaRender: porStatus('EM_EDICAO').length,
        prontos,
        publicadosHoje: new Set(
          (pubQ.data || []).filter((p) => (p.data_publicacao || '').slice(0, 10) === hoje).map((p) => p.ideia_id),
        ).size,
        roteirosHoje: (rotQ.data || []).filter((r) => (r.created_at || '').slice(0, 10) === hoje).length,
        audiosHoje: (audQ.data || []).filter((a) => (a.created_at || '').slice(0, 10) === hoje).length,
        audioPausado: audioGerado >= cfg.buffer_audio_max,
        fila10,
        custoLoteBrl,
      }
    },
  })
}
