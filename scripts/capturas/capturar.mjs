/**
 * CAPTURA DAS TELAS DOS BASTIDORES NA SPEC — PNG 3840x2160 nativo.
 *
 * POR QUE ESTE SCRIPT EXISTE. O navegador da sessao do agente entrega 1568x579 JPEG. Isso nao e
 * parametro errado, e o teto da ferramenta. E a spec dos Bastidores (orquestrador + Limelight,
 * 04/09) pede 3840x2160 PNG por um motivo concreto: numa serie de tela real o movimento mais
 * comum e ENTRAR num numero — painel inteiro, depois a camera fecha no que importa. Capturado a
 * 1x, esse zoom vira interpolacao e o numero sai borrado justo no quadro em que ele e o assunto.
 * A 2x da para cortar ate ~50% da tela e ainda entregar 1080p nativo.
 *
 * COMO ELE RESOLVE: Chromium via playwright-core em 1920x1080 com deviceScaleFactor 2 — cada
 * ponto CSS vira 2 pixels, e o PNG sai 3840x2160 REAL. Reduzir sempre melhora; ampliar nunca.
 *
 * O PASSO HUMANO, E POR QUE ELE NAO SAI DAQUI. O app protege tudo no middleware (sessao Supabase).
 * O agente NAO faz login: digitar senha do dono e coisa que ele nao faz, e copiar cookie de sessao
 * de um navegador para outro e mover credencial. Entao a sessao e gravada UMA VEZ, pelo dono, e
 * reusada:
 *
 *   1) npm run capturas:login    -> abre o Chromium, o DONO faz login, fecha a janela
 *   2) npm run capturas          -> captura tudo, sozinho, na spec
 *
 * O arquivo de sessao (scripts/capturas/.sessao.json) e CREDENCIAL: fica no .gitignore e nao sobe.
 */
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.CAPTURA_BASE || 'http://localhost:3004'
const SESSAO = path.join(import.meta.dirname, '.sessao.json')
const DESTINO = path.join(process.cwd(), 'public', 'pulso', 'bastidores_capturas')

// O executavel ja baixado pelo Playwright desta maquina — o pacote npm aqui e so o driver.
function acharChromium() {
  const raiz = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright')
  if (!fs.existsSync(raiz)) return null
  const versoes = fs.readdirSync(raiz).filter((d) => /^chromium-\d+$/.test(d))
    .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))
  // a pasta muda de nome entre builds do Playwright (chrome-win64 no 1228, chrome-win no 1217)
  for (const v of versoes) {
    for (const dir of ['chrome-win64', 'chrome-win']) {
      const exe = path.join(raiz, v, dir, 'chrome.exe')
      if (fs.existsSync(exe)) return exe
    }
  }
  return null
}

// O que capturar. `nome` segue a convencao EPxx_<bloco>_<descricao>; `sigilo` marca o que so viaja
// borrado (regra do 🔒: blur na origem e trava, blur na edicao e lembrete).
const ALVOS = [
  { nome: 'EP01_app_kanban-producao',   rota: '/producao',  espera: 'Produção' },
  { nome: 'EP01_app_calendario-grade',  rota: '/publicar',  espera: null },
  { nome: 'EP01_app_esteira-ideias',    rota: '/esteira',   espera: null },
  { nome: 'EP01_app_saude-dos-dados',   rota: '/validacao', espera: null },
  { nome: 'EP01_app_analytics-geral',   rota: '/analytics', espera: null },
  { nome: 'EP06_app_decisor-visao',     rota: '/',          espera: null, sigilo: true },
]

const modoLogin = process.argv.includes('--login')
const exe = acharChromium()
if (!exe) {
  console.error('Chromium do Playwright nao encontrado em %LOCALAPPDATA%\ms-playwright.')
  process.exit(1)
}

const navegador = await chromium.launch({ executablePath: exe, headless: !modoLogin })

if (modoLogin) {
  console.log('\n  Abrindo o app. Faca login e FECHE a janela quando o painel aparecer.')
  console.log('  A sessao fica em scripts/capturas/.sessao.json (nao versionado).\n')
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } })
  const pg = await ctx.newPage()
  await pg.goto(BASE, { waitUntil: 'domcontentloaded' }).catch(() => {})
  await pg.waitForEvent('close', { timeout: 0 })
  await ctx.storageState({ path: SESSAO })
  await navegador.close()
  console.log('  Sessao gravada. Agora: npm run capturas')
  process.exit(0)
}

if (!fs.existsSync(SESSAO)) {
  console.error('Sem sessao gravada. Rode primeiro: npm run capturas:login')
  process.exit(1)
}

fs.mkdirSync(DESTINO, { recursive: true })
const ctx = await navegador.newContext({
  storageState: SESSAO,
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2, // 1920x1080 CSS x2 = 3840x2160 de pixel real
})
const pagina = await ctx.newPage()
const feitas = [], falhas = []

for (const alvo of ALVOS) {
  const arquivo = path.join(DESTINO, `${alvo.nome}.png`)
  try {
    const r = await pagina.goto(BASE + alvo.rota, { waitUntil: 'networkidle', timeout: 45000 })
    if (pagina.url().includes('/login')) throw new Error('sessao expirada — rode capturas:login')
    if (r && r.status() >= 400) throw new Error(`HTTP ${r.status()}`)
    if (alvo.espera) await pagina.getByText(alvo.espera).first().waitFor({ timeout: 10000 }).catch(() => {})
    await pagina.waitForTimeout(1200) // deixa grafico/animacao assentar antes do clique do obturador
    await pagina.screenshot({ path: arquivo, type: 'png' })
    const kb = Math.round(fs.statSync(arquivo).size / 1024)
    feitas.push(`${alvo.nome}.png (${kb} KB)${alvo.sigilo ? '  <- SO VIAJA BORRADA' : ''}`)
  } catch (e) {
    falhas.push(`${alvo.nome}: ${e.message}`)
  }
}
await navegador.close()

console.log('\n=== CAPTURAS ===')
for (const f of feitas) console.log('  ok    ', f)
for (const f of falhas) console.log('  FALHOU', f)
console.log(`\n  ${feitas.length} de ${ALVOS.length} · PNG 3840x2160 · destino public/pulso/bastidores_capturas/`)
if (falhas.length) process.exitCode = 1
