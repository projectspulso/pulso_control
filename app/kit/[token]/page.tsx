import type { Metadata } from 'next'
import { KitMidiaView } from '@/components/kit-midia-view'
import type { KitDados } from '@/lib/analytics/kit'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Kit de mídia — PULSO Histórias',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
}

interface Envio { dados: KitDados; nota: string; medido_em: string; expira_em: string }

/** Página do patrocinador: sem login, aberta só pelo token. Cada abertura conta um acesso (RPC 082). */
async function lerEnvio(token: string): Promise<Envio | null> {
  if (!/^[0-9a-f]{48}$/.test(token)) return null
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null
  const r = await fetch(`${url}/rest/v1/rpc/kit_midia_publico`, {
    method: 'POST',
    headers: { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_token: token }),
    cache: 'no-store',
  })
  if (!r.ok) return null
  return (await r.json()) as Envio | null
}

export default async function KitPublicoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const envio = await lerEnvio(token)
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 sm:px-6 sm:py-12">
      {envio
        ? <KitMidiaView kit={envio.dados} nota={envio.nota} />
        : (
          <div className="mx-auto mt-24 max-w-md rounded-2xl border border-(--pulso-border) bg-(--pulso-surface) p-8 text-center">
            <h1 className="text-lg font-semibold text-(--pulso-text)">Este link não está mais ativo</h1>
            <p className="mt-2 text-sm text-(--pulso-text-muted)">Ele venceu ou foi cancelado. Peça um kit atualizado a quem te enviou.</p>
          </div>
        )}
    </main>
  )
}
