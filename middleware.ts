import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Protege TODAS as páginas. Exceções (matcher abaixo): /api (cron 8h + scripts sem sessão),
// /termos e /privacidade (exigidos públicos pelo TikTok), assets e as próprias telas de auth.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const ehAuthPage = path === '/login' || path === '/registrar'

  if (!user && !ehAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  if (user && ehAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    // tudo, EXCETO: api, _next, estáticos, termos/privacidade (TikTok), robots, manifest/ícones
    // (o hub público — /hub e /v/ — foi movido pra https://pulsohub.vercel.app)
    '/((?!api|_next/static|_next/image|favicon.ico|termos|privacidade|robots.txt|manifest.json|icons|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)',
  ],
}
