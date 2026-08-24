import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase/client'

export interface Lancamento {
  id: string
  servico: string
  creditos: number | null
  brl: number
  descricao: string
  data: string
}

export interface Travas {
  teto_creditos_higgsfield_dia: number
  teto_brl_mes: number
  max_videos_dia: number
  max_cenas_novas_por_video: number
  min_clips_banco_por_video: number
  credito_brl: number
  modelo_padrao: string
}

export interface MesResumo {
  mes: string // YYYY-MM
  producaoBRL: number
  caixaBRL: number
  creditos: number
  videos?: number
}

export interface ExtratoAgente {
  servico: string
  agente: string
  brl: number
  creditos: number
  lancamentos: number
}
export interface ExtratoSemana {
  semana: string
  periodo: string
  gerado_em?: string
  consumoTotalBRL: number
  recargasBRL: number
  assinaturasMensalBRL: number
  videosProduzidos: number
  custoMedioVideoBRL: number
  saldoHiggsfield: { creditos: number; snapshot_em?: string } | null
  porAgente: ExtratoAgente[]
}

/**
 * Extrato REAL da conta Higgsfield, sincronizado pelo worker local depois de cada render.
 * É a autoridade sobre crédito gasto: o razão do app é escrito por nós e derrapou duas vezes
 * juntas (taxa de R$ 1,00/cr onde o real é R$ 0,27, e toda cena OK contada como Higgsfield mesmo
 * quando saiu de Wan, do acervo grátis ou do banco de clips). Já vem líquido de refund.
 */
export interface ExtratoHiggsfield {
  por_dia: Record<string, { cr: number; jobs: number; modelos: Record<string, number> }>
  credito_brl: number
  sincronizado_em: string
  primeiro_dia: string | null
  ultimo_dia: string | null
}

/** O que o razão do app diz × o que a conta cobrou, no período em que dá pra comparar. */
export interface Conciliacao {
  periodo: string
  creditosRazao: number
  creditosReais: number
  brlRazao: number
  brlReal: number
  creditoBRL: number
  diasDivergentes: Array<{ data: string; razao: number; real: number }>
  sincronizadoEm: string
}

export interface Receita {
  plataforma: string
  programa: string | null
  competencia: string
  valorBRL: number
  status: 'estimado' | 'confirmado' | 'recebido'
}

export interface FinanceiroData {
  lancamentos: Lancamento[]
  travas: Travas | null
  saldoHiggsfield: { creditos: number; snapshot_em: string } | null
  clipsNoBanco: number
  gastoHojeBRL: number
  gastoHojeCreditos: number
  gastoMesBRL: number
  caixaMesBRL: number
  gastoPorServico: { servico: string; brl: number }[]
  porMes: MesResumo[]
  /** extratos semanais persistidos (gerados toda segunda pelo cron) */
  extratoSemanal: ExtratoSemana[]
  /** consumo da semana em curso, calculado ao vivo (parcial) */
  semanaAtual: { periodo: string; consumoBRL: number; porAgente: { servico: string; brl: number }[] }
  /** razão do app × extrato da conta — null enquanto o worker não sincronizou */
  conciliacao: Conciliacao | null
  /** gasto por modelo no extrato real (Seedance, Veo, Kling…), em crédito */
  gastoPorModelo: Array<{ modelo: string; creditos: number; brl: number }>
  /** receita dos programas das redes — zero até o 1º gate abrir (migration 057) */
  receitas: Receita[]
  receitaMesBRL: number
  receitaRecebidaBRL: number
}

const AGENTE_LABEL: Record<string, string> = {
  higgsfield: 'Higgsfield (vídeo/Veo)',
  elevenlabs: 'ElevenLabs (voz)',
  openai: 'OpenAI (roteiro/legenda)',
}
function segundaDaSemana(d: Date): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dow = x.getUTCDay() === 0 ? 7 : x.getUTCDay()
  x.setUTCDate(x.getUTCDate() - (dow - 1))
  return x.toISOString().slice(0, 10)
}

export function useFinanceiro() {
  return useQuery<FinanceiroData>({
    queryKey: ['financeiro'],
    refetchInterval: 5 * 60 * 1000,
    queryFn: async () => {
      const [logsQ, cfgRes, clipsQ, receitasQ] = await Promise.all([
        supabase
          .schema('pulso_content')
          .from('logs_workflows')
          .select('id, detalhes, created_at')
          .eq('workflow_name', 'GASTO_SERVICO')
          .order('created_at', { ascending: false }),
        // configuracoes tem RLS — leitura via rota server (service role)
        fetch('/api/automation/financeiro-config').then((r) => r.json()),
        supabase.schema('pulso_content').from('videos').select('id', { count: 'exact', head: true }).eq('tipo', 'CLIP_CENA'),
        supabase
          .schema('pulso_content')
          .from('receitas')
          .select('plataforma, programa, competencia, valor_brl, status')
          .order('competencia', { ascending: false }),
      ])
      if (logsQ.error) throw logsQ.error

      const lancamentos: Lancamento[] = (logsQ.data || []).map((l) => {
        const d = (l.detalhes || {}) as Record<string, unknown>
        return {
          id: l.id,
          servico: String(d.servico || '?'),
          creditos: (d.creditos as number) ?? null,
          brl: Number(d.brl || 0),
          descricao: String(d.descricao || ''),
          data: String(d.data || l.created_at?.slice(0, 10) || ''),
        }
      })

      const travas = (cfgRes?.travas as Travas) ?? null
      const saldoHiggsfield = cfgRes?.saldoHiggsfield ?? null

      const hoje = new Date().toISOString().slice(0, 10)
      const mes = hoje.slice(0, 7)
      // topup é movimento de CAIXA (compra de créditos); produção é o consumo — não somar os dois
      const producao = lancamentos.filter((l) => l.servico !== 'topup')
      const gastoHojeBRL = producao.filter((l) => l.data === hoje).reduce((a, l) => a + l.brl, 0)
      const gastoHojeCreditos = producao
        .filter((l) => l.data === hoje && l.servico === 'higgsfield')
        .reduce((a, l) => a + (l.creditos || 0), 0)
      const gastoMesBRL = producao.filter((l) => l.data.startsWith(mes)).reduce((a, l) => a + l.brl, 0)
      const caixaMesBRL = lancamentos
        .filter((l) => l.servico === 'topup' && l.data.startsWith(mes))
        .reduce((a, l) => a + l.brl, 0)

      const porServico = new Map<string, number>()
      for (const l of producao) {
        if (!l.data.startsWith(mes)) continue
        porServico.set(l.servico, (porServico.get(l.servico) || 0) + l.brl)
      }

      // controle gerencial mês a mês (produção vs caixa)
      const meses = new Map<string, MesResumo>()
      for (const l of lancamentos) {
        const m = l.data.slice(0, 7)
        if (!m) continue
        const acc = meses.get(m) || { mes: m, producaoBRL: 0, caixaBRL: 0, creditos: 0 }
        if (l.servico === 'topup') acc.caixaBRL += l.brl
        else {
          acc.producaoBRL += l.brl
          if (l.servico === 'higgsfield') acc.creditos += l.creditos || 0
        }
        meses.set(m, acc)
      }
      const porMes = [...meses.values()].sort((a, b) => a.mes.localeCompare(b.mes))

      // Receita dos programas das redes (migration 057). Fica em zero até o 1º gate abrir —
      // o mais próximo é o Estrelas do Facebook, que libera com 500 seguidores.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const receitas: Receita[] = ((receitasQ.data as any[]) || []).map((r) => ({
        plataforma: r.plataforma,
        programa: r.programa ?? null,
        competencia: r.competencia,
        valorBRL: Number(r.valor_brl) || 0,
        status: r.status,
      }))
      const receitaMesBRL = receitas
        .filter((r) => r.competencia?.startsWith(mes))
        .reduce((a, r) => a + r.valorBRL, 0)
      const receitaRecebidaBRL = receitas.filter((r) => r.status === 'recebido').reduce((a, r) => a + r.valorBRL, 0)

      // semana em curso (ao vivo): consumo desde a segunda-feira desta semana
      const segISO = segundaDaSemana(new Date())
      const porAgSemana = new Map<string, number>()
      for (const l of producao) {
        if (l.data < segISO || l.data > hoje) continue
        porAgSemana.set(l.servico, (porAgSemana.get(l.servico) || 0) + l.brl)
      }
      const semanaAtual = {
        periodo: `${segISO} a ${hoje}`,
        consumoBRL: [...porAgSemana.values()].reduce((a, b) => a + b, 0),
        porAgente: [...porAgSemana.entries()]
          .map(([servico, brl]) => ({ servico: AGENTE_LABEL[servico] || servico, brl: Math.round(brl * 100) / 100 }))
          .sort((a, b) => b.brl - a.brl),
      }

      const extratoSemanal: ExtratoSemana[] = Array.isArray(cfgRes?.extratoSemanal) ? cfgRes.extratoSemanal : []

      // ── conciliação: o que escrevemos × o que a conta cobrou ──
      // Só compara dentro da janela que o extrato cobre. Fora dela não é divergência, é ausência
      // de fonte — e tratar ausência como divergência inventaria erro que não existe.
      const hf = (cfgRes?.extratoHiggsfield ?? null) as ExtratoHiggsfield | null
      let conciliacao: Conciliacao | null = null
      const gastoPorModelo: Array<{ modelo: string; creditos: number; brl: number }> = []
      if (hf?.por_dia && hf.primeiro_dia && hf.ultimo_dia) {
        const taxa = hf.credito_brl || 0.266
        const dentro = (d: string) => d >= hf.primeiro_dia! && d <= hf.ultimo_dia!
        const razaoPorDia = new Map<string, number>()
        for (const l of producao) {
          if (l.servico !== 'higgsfield' || !dentro(l.data)) continue
          razaoPorDia.set(l.data, (razaoPorDia.get(l.data) || 0) + (l.creditos || 0))
        }
        let crRazao = 0, crReal = 0, brlRazao = 0
        for (const l of producao) {
          if (l.servico !== 'higgsfield' || !dentro(l.data)) continue
          crRazao += l.creditos || 0
          brlRazao += l.brl
        }
        const divergentes: Array<{ data: string; razao: number; real: number }> = []
        const dias = new Set([...Object.keys(hf.por_dia), ...razaoPorDia.keys()])
        for (const d of [...dias].sort()) {
          if (!dentro(d)) continue
          const real = Math.round((hf.por_dia[d]?.cr || 0) * 10) / 10
          const razao = razaoPorDia.get(d) || 0
          crReal += real
          if (Math.abs(real - razao) > 1) divergentes.push({ data: d, razao, real })
        }
        const modelos = new Map<string, number>()
        for (const d of Object.values(hf.por_dia))
          for (const [m, cr] of Object.entries(d.modelos || {})) modelos.set(m, (modelos.get(m) || 0) + cr)
        gastoPorModelo.push(
          ...[...modelos.entries()]
            .map(([modelo, creditos]) => ({
              modelo,
              creditos: Math.round(creditos),
              brl: Math.round(creditos * taxa * 100) / 100,
            }))
            .sort((a, b) => b.creditos - a.creditos)
        )
        conciliacao = {
          periodo: `${hf.primeiro_dia} a ${hf.ultimo_dia}`,
          creditosRazao: Math.round(crRazao),
          creditosReais: Math.round(crReal),
          brlRazao: Math.round(brlRazao * 100) / 100,
          brlReal: Math.round(crReal * taxa * 100) / 100,
          creditoBRL: taxa,
          diasDivergentes: divergentes,
          sincronizadoEm: hf.sincronizado_em,
        }
      }

      return {
        lancamentos,
        travas,
        saldoHiggsfield,
        clipsNoBanco: clipsQ.count || 0,
        gastoHojeBRL,
        gastoHojeCreditos,
        gastoMesBRL,
        caixaMesBRL,
        porMes,
        extratoSemanal,
        semanaAtual,
        conciliacao,
        gastoPorModelo,
        receitas,
        receitaMesBRL,
        receitaRecebidaBRL,
        gastoPorServico: [...porServico.entries()]
          .map(([servico, brl]) => ({ servico, brl }))
          .sort((a, b) => b.brl - a.brl),
      }
    },
  })
}
