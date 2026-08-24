/**
 * Leitor de .env compartilhado pelos scripts avulsos desta pasta.
 *
 * Existe porque os scripts carregavam o PAT de Management em texto puro, versionado —
 * ver docs/licencas e a pendência S1 no Cockpit. PAT de Management administra a
 * organização inteira, não um banco: nunca deve entrar no git.
 */
const fs = require('fs')
const path = require('path')

function carregar() {
  const env = {}
  // .env.local tem precedência sobre .env quando os dois existem
  for (const nome of ['.env', '.env.local']) {
    const p = path.join(__dirname, '..', nome)
    if (!fs.existsSync(p)) continue
    for (const linha of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = linha.trim().match(/^([^=#]+)=(.*)$/)
      if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
    }
  }
  return env
}

const env = carregar()

/** Lê uma variável obrigatória e morre com mensagem útil se faltar. */
function exigir(chave) {
  const v = process.env[chave] || env[chave]
  if (!v) {
    console.error(
      `\n✖ ${chave} não encontrada.\n` +
        `  Defina em pulso_control/.env (o arquivo é gitignored) e rode de novo.\n`,
    )
    process.exit(1)
  }
  return v
}

module.exports = { env, exigir }
