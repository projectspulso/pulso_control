/**
 * Gates de monetização por plataforma (jun/2026) — ver docs/40_PRODUTO/18_PLANO_MONETIZACAO.md
 * Alvo inicial = primeiro gate alcançável de cada rede.
 */

export interface GateMonetizacao {
  plataforma: 'youtube' | 'instagram' | 'facebook' | 'tiktok'
  label: string
  programa: string
  metaSeguidores: number
  metaSecundaria: string
  recompensa: string
}

export const GATES_MONETIZACAO: GateMonetizacao[] = [
  {
    plataforma: 'youtube',
    label: 'YouTube',
    programa: 'YPP expandido',
    metaSeguidores: 500,
    metaSecundaria: '+ 3M views Shorts/90d (ou 3.000h)',
    recompensa: 'fan funding → depois anúncios (1k + 10M/90d)',
  },
  {
    plataforma: 'facebook',
    label: 'Facebook',
    programa: 'Content Monetization (CMP)',
    metaSeguidores: 5000,
    metaSecundaria: '+ 60.000 min assistidos',
    recompensa: 'R$ por engajamento em reels/posts',
  },
  {
    plataforma: 'tiktok',
    label: 'TikTok',
    programa: 'Creator Rewards',
    metaSeguidores: 10000,
    metaSecundaria: '+ 100k views/30d · vídeos >1min',
    recompensa: 'R$ 200-750 por 1M views qualificadas',
  },
  {
    plataforma: 'instagram',
    label: 'Instagram',
    programa: 'Bônus Reels / Assinaturas',
    metaSeguidores: 10000,
    metaSecundaria: 'bônus é por convite no BR',
    recompensa: 'bônus + assinaturas',
  },
]
