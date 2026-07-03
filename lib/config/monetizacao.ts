/**
 * Gates de monetização por plataforma (jul/2026) — ver docs/40_PRODUTO/18_PLANO_MONETIZACAO.md
 * Alvo inicial = primeiro gate alcançável de cada rede.
 *
 * alavanca = a UMA coisa a melhorar naquela rede pra destravar receita (data-driven).
 * metaSecundariaNum = quando dá pra medir o progresso do 2º gate (views/90d), preenche.
 */

export interface GateMonetizacao {
  plataforma: 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'kwai'
  label: string
  emoji: string
  programa: string
  metaSeguidores: number
  /** gate mais fácil primeiro (ex.: Kwai Lives libera com 100). null = só o principal */
  gateRapido?: { meta: number; label: string }
  metaSecundaria: string
  /** meta numérica do 2º gate quando dá pra medir progresso (views acumuladas) */
  metaSecundariaNum?: number
  metaSecundariaUnidade?: string
  recompensa: string
  alavanca: string
}

export const GATES_MONETIZACAO: GateMonetizacao[] = [
  {
    plataforma: 'youtube',
    label: 'YouTube',
    emoji: '▶️',
    programa: 'YPP expandido',
    metaSeguidores: 500,
    metaSecundaria: '+ 3M views Shorts/90d (ou 3.000h)',
    metaSecundariaNum: 3_000_000,
    metaSecundariaUnidade: 'views/90d',
    recompensa: 'fan funding → depois anúncios (1k insc + 10M/90d)',
    alavanca: 'Gate mais perto e melhor engajamento — CTA de inscrição fixo + no fim do vídeo. Converter quem já ama.',
  },
  {
    plataforma: 'kwai',
    label: 'Kwai',
    emoji: '🧡',
    programa: 'Creator Fund / Lives',
    metaSeguidores: 1000,
    gateRapido: { meta: 100, label: 'Lives (receita) liberam com 100 seguidores' },
    metaSecundaria: 'Lives monetizadas a partir de 100 seguidores',
    recompensa: 'Fundo por views + presentes em Lives',
    alavanca: 'Meta de receita mais próxima do ecossistema — 606 média/post. Correr pros 100 seguidores e abrir Lives.',
  },
  {
    plataforma: 'facebook',
    label: 'Facebook',
    emoji: '📘',
    programa: 'Content Monetization (CMP)',
    metaSeguidores: 5000,
    metaSecundaria: '+ 60.000 min assistidos',
    recompensa: 'R$ por engajamento em reels/posts',
    alavanca: 'Maior alcance de todas, mas view não vira seguidor. CTA de seguir + série recorrente pra fidelizar.',
  },
  {
    plataforma: 'tiktok',
    label: 'TikTok',
    emoji: '🎵',
    programa: 'Creator Rewards',
    metaSeguidores: 10000,
    metaSecundaria: '+ 100k views/30d · vídeos >1min',
    recompensa: 'R$ 200-750 por 1M views qualificadas',
    alavanca: 'Gate longe (10k). Volume + consistência diária e ganchos fortes pra subir a base.',
  },
  {
    plataforma: 'instagram',
    label: 'Instagram',
    emoji: '📸',
    programa: 'Bônus Reels / Assinaturas',
    metaSeguidores: 10000,
    metaSecundaria: 'bônus é por convite no BR',
    recompensa: 'bônus + assinaturas',
    alavanca: 'Base mais fraca. Reels perenes + Stories dos campeões pra crescer seguidores.',
  },
]
