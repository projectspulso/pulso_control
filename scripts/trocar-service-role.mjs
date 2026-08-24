/**
 * Troca a credencial privilegiada do Supabase no .env local, com backup e validação.
 *
 * Por que existe: a service_role legada ficou versionada no git desde 2026-03-11 e ainda é a
 * credencial de produção. A troca precisa acontecer sem que o valor passe por chat, transcript
 * de agente ou histórico de comando — por isso a leitura é interativa e com eco desligado.
 *
 * Uso:  node scripts/trocar-service-role.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const ENV = path.join(RAIZ, '.env')
const CHAVE = 'SUPABASE_SERVICE_ROLE_KEY'

function perguntarOculto(pergunta) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    // Sem isto o valor aparece no terminal e vai parar no scrollback.
    const escrever = rl._writeToOutput
    rl._writeToOutput = function (s) {
      if (s.includes(pergunta)) escrever.call(rl, s)
    }
    rl.question(pergunta, (resposta) => {
      rl._writeToOutput = escrever
      rl.output.write('\n')
      rl.close()
      resolve(resposta.trim())
    })
  })
}

function lerEnv() {
  if (!fs.existsSync(ENV)) {
    console.error(`✖ ${ENV} não existe.`)
    process.exit(1)
  }
  return fs.readFileSync(ENV, 'utf8')
}

function valorDe(conteudo, chave) {
  const m = conteudo.match(new RegExp(`^${chave}=(.*)$`, 'm'))
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : null
}

async function testar(url, chave) {
  const r = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: chave, Authorization: `Bearer ${chave}` },
  })
  return r.ok || r.status === 404 // 404 na raiz do PostgREST também indica auth aceita
}

const conteudo = lerEnv()
const url = valorDe(conteudo, 'SUPABASE_URL')
const atual = valorDe(conteudo, CHAVE)

if (!url) {
  console.error('✖ SUPABASE_URL não encontrada no .env.')
  process.exit(1)
}

console.log(`\nProjeto:  ${url}`)
console.log(`Chave atual termina em: …${(atual || '').slice(-6)}\n`)
console.log('Cole a chave NOVA (o terminal não vai mostrar o que você digitar).')
console.log('Crie em: Settings → API Keys → Secret keys → New secret key\n')

const nova = await perguntarOculto('Nova chave: ')

if (!nova) {
  console.error('✖ Nada colado. Abortado, nada foi alterado.')
  process.exit(1)
}
if (nova === atual) {
  console.error('✖ A chave colada é idêntica à atual. Abortado.')
  process.exit(1)
}
if (!/^(sb_secret_|eyJ)/.test(nova)) {
  console.error('✖ Formato inesperado (esperado sb_secret_… ou um JWT). Abortado por segurança.')
  process.exit(1)
}

process.stdout.write('\nTestando a chave nova contra o projeto… ')
if (!(await testar(url, nova))) {
  console.error('FALHOU.\n✖ O Supabase recusou a chave. Nada foi alterado — confira e rode de novo.')
  process.exit(1)
}
console.log('OK.')

const backup = `${ENV}.bak-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}`
fs.copyFileSync(ENV, backup)

const novoConteudo = atual
  ? conteudo.replace(new RegExp(`^${CHAVE}=.*$`, 'm'), `${CHAVE}=${nova}`)
  : `${conteudo.replace(/\n*$/, '')}\n${CHAVE}=${nova}\n`

fs.writeFileSync(ENV, novoConteudo, 'utf8')

console.log(`
✅ .env atualizado.
   Backup da versão anterior: ${path.basename(backup)}

FALTA AINDA (fora desta máquina):
   1. Vercel → projeto do pulso → Settings → Environment Variables
      → atualizar ${CHAVE} com a mesma chave → Redeploy
   2. Só DEPOIS de validar a esteira, desabilitar a service_role legada no painel

⚠️  Apague o backup quando terminar: ele contém a chave antiga em texto puro.
`)
