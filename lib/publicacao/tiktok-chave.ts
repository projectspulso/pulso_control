/**
 * QUAL APP DO TIKTOK ASSINA O TOKEN — produção (auditado) ou sandbox (teste).
 *
 * Até 07/10/2026 todo o app usava `TIKTOK_SANDBOX_KEY || TIKTOK_CLIENT_KEY`: o token era do app de
 * TESTE, que o TikTok não deixa publicar direto — o teste de API do #214 caiu no rascunho por isso.
 * O dono mandou trocar para a chave de produção. Como o refresh precisa da MESMA chave que emitiu o
 * token, o token guarda `app` (o callback grava) e cada rota renova com a chave certa: token antigo
 * (sem `app`) continua no sandbox até o dono reautorizar em /api/tiktok/oauth/start.
 */
export function credenciaisTikTok(app?: string | null): { key: string; secret: string } {
  if (app === 'producao') {
    return { key: process.env.TIKTOK_CLIENT_KEY || '', secret: process.env.TIKTOK_CLIENT_SECRET || '' }
  }
  return {
    key: process.env.TIKTOK_SANDBOX_KEY || process.env.TIKTOK_CLIENT_KEY || '',
    secret: process.env.TIKTOK_SANDBOX_SECRET || process.env.TIKTOK_CLIENT_SECRET || '',
  }
}

export const TIKTOK_REDIRECT_URI = 'https://pulsoprojects.vercel.app/api/automation/webhooks/tiktok-callback'
export const TIKTOK_ESCOPOS = 'user.info.basic,user.info.stats,video.list,video.upload,video.publish'
