'use client'

/**
 * O topo do /analytics: a leitura do dia em uma frase.
 *
 * Existe porque a página tinha todos os dados e nenhuma frase — você olhava 20 painéis e
 * pensava "ok… e agora?". Dashboard bom termina numa decisão, não numa tabela.
 * A prosa é gerada dos números reais; nada aqui é escrito à mão.
 *
 * Alerta de operação (crédito/estoque/sequência) NÃO vive aqui — é <AlertasOperacao/> no
 * Dashboard. Esta página responde "o que aprender?", não "o que fazer agora?".
 */

export interface InsightDados {
  topRede?: { rede: string; share: number }
  topVertical?: { nome: string; share: number }
  melhorDia?: { dia: string; media: number; vezes: number }
  conversaoYt?: number | null
}

const REDE_NOME: Record<string, string> = {
  facebook: 'Facebook', youtube: 'YouTube', instagram: 'Instagram', tiktok: 'TikTok', kwai: 'Kwai',
}

function Faixa({ tom, icone, children }: { tom: 'crit' | 'warn'; icone: string; children: React.ReactNode }) {
  const cor = tom === 'crit' ? 'border-l-red-500' : 'border-l-amber-400'
  return (
    <div className={`flex items-start gap-3 rounded-r-2xl border border-zinc-800/60 ${cor} border-l-[3px] bg-zinc-900/60 px-4 py-3.5`}>
      <span className="text-[15px] leading-tight">{icone}</span>
      <p className="text-[13px] leading-snug text-zinc-400">{children}</p>
    </div>
  )
}

export function InsightDoDia({ topRede, topVertical, melhorDia, conversaoYt }: InsightDados) {
  const b = (t: React.ReactNode) => <b className="font-semibold text-white">{t}</b>

  return (
    <div className="flex flex-col gap-2.5">
      <Faixa tom="warn" icone="⚡">
        <b className="font-semibold text-white">A leitura de hoje: </b>
        {topRede && (
          <>
            o {b(REDE_NOME[topRede.rede] ?? topRede.rede)} entrega {b(`${topRede.share.toFixed(0)}% do alcance`)}
            {topRede.rede !== 'youtube' && ', mas quase não vira seguidor — o YouTube entrega menos e é o único que paga'}.{' '}
          </>
        )}
        {topVertical && (
          <>
            {b(topVertical.nome)} vale {b(`${topVertical.share.toFixed(0)}% das views`)} — é a aposta pra empurrar o canal.{' '}
          </>
        )}
        {melhorDia && melhorDia.vezes > 1.3 && (
          <>
            E publique {b(melhorDia.dia)}: rende {b(`${melhorDia.vezes.toFixed(1)}×`)} o pior dia.{' '}
          </>
        )}
        {conversaoYt != null && conversaoYt < 1 && (
          <>Conversão view→inscrito em {b(`${conversaoYt.toFixed(1)}%`)} (bom é 1–3%): dobrar isso vale mais que dobrar o alcance.</>
        )}
      </Faixa>
    </div>
  )
}
