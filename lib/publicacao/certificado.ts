/** O certificado vale para uma URL (motor/certificar_video.py): remontou, precisa certificar de novo. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function motivoSemCertificado(metadata: any, videoUrl?: string | null): string | null {
  const c = metadata?.certificado
  const url = videoUrl || metadata?.video_url
  if (!c || c.url !== url) return 'sem certificado deste arquivo'
  if (!c.ok) return (c.motivos || []).join('; ') || 'reprovado na conferência'
  return null
}
