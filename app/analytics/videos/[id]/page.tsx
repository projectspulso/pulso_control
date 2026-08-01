import { redirect } from 'next/navigation'

/**
 * A ficha do vídeo mudou de endereço: /analytics/videos/[id] → /video/[id].
 *
 * O motivo é que ela deixou de ser um artefato de analytics. A vida do vídeo começa na ideia e
 * termina na publicação; desempenho é uma seção dela, não o contrário. O redirect fica porque
 * links antigos (e a memória do dono) apontam pro caminho velho.
 */
export default async function RedirecionaFichaAntiga({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/video/${id}`)
}
