import type { AreaProblema, Problema } from '@/lib/hooks/use-livro'

export const AREAS_PROBLEMA: Record<AreaProblema, string> = {
  coleta: 'Coleta de métricas',
  publicacao: 'Publicação',
  render: 'Render',
  producao: 'Produção',
  dados: 'Dados',
  seguranca: 'Segurança',
  custo: 'Custo',
  infra: 'Infraestrutura',
  conteudo: 'Conteúdo',
}

// gravidade nunca só pela cor: o rótulo vai junto
export const GRAVIDADE: Record<Problema['gravidade'], { rotulo: string; classe: string }> = {
  alta: { rotulo: 'Grave', classe: 'bg-(--pulso-danger)/12 text-(--pulso-danger)' },
  media: { rotulo: 'Média', classe: 'bg-(--pulso-warn)/12 text-(--pulso-warn)' },
  baixa: { rotulo: 'Leve', classe: 'bg-(--pulso-text-muted)/12 text-(--pulso-text-muted)' },
}
