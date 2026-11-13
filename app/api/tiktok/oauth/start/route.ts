import { NextRequest, NextResponse } from 'next/server'
import { guardApi } from '@/lib/auth/api-guard'
import { gravarEstado, novoEstado } from '@/lib/auth/oauth-state'
import { credenciaisTikTok, TIKTOK_ESCOPOS, TIKTOK_REDIRECT_URI } from '@/lib/publicacao/tiktok-chave'

/**
 * GET /api/tiktok/oauth/start — o dono abre logado no app e autoriza a conta @pulsohistorias no
 * APP DE PRODUÇÃO do TikTok (auditado: publica direto). O callback grava o token com app='producao'.
 */
export async function GET(request: NextRequest) {
  const denied = await guardApi(request)
  if (denied) return denied
  // ?app=sandbox (12/11): enquanto o app de produção não é aprovado, as contas de cortes só entram pelo
  // app de teste, como contas de teste (Target Users), e mandam rascunho igual ao @pulsohistorias
  const app = request.nextUrl.searchParams.get('app') === 'sandbox' ? 'sandbox' : 'producao'
  const { key } = credenciaisTikTok(app)
  if (!key) return new NextResponse('TIKTOK_CLIENT_KEY não configurada na Vercel', { status: 500 })
  const u = new URL('https://www.tiktok.com/v2/auth/authorize/')
  u.searchParams.set('client_key', key)
  u.searchParams.set('scope', TIKTOK_ESCOPOS)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('redirect_uri', TIKTOK_REDIRECT_URI)
  // ?conta=<id de tiktok_contas> (10/11): cada conta de cortes do PULSO guarda o próprio token; sem
  // isso, autorizar uma delas apagava o token do @pulsoprojects e parava a publicação diária
  const conta = request.nextUrl.searchParams.get('conta') || 'principal'
  if (!/^[a-z0-9_]{1,40}$/.test(conta)) return new NextResponse('conta inválida', { status: 400 })
  const estado = novoEstado(conta === 'principal' ? app : `${app}-${conta}`)
  u.searchParams.set('state', estado)
  return gravarEstado(NextResponse.redirect(u.toString()), estado)
}
