1. Criar pasta do projeto e iniciar Git + Node

No terminal:

# 1. criar pasta raiz do projeto

mkdir pulso
cd pulso

# 2. iniciar git (depois você conecta no GitHub pela UI ou CLI)

git init

# 3. iniciar projeto Node básico (para scripts, CLIs, etc.)

npm init -y

Opcional (mas recomendo) – usar pnpm:

npm install -g pnpm

2. Estrutura principal de pastas (pensada no blueprint PULSO)

Vamos criar tudo de uma vez:

# apps principais (frontend, backend/orquestração interna)

mkdir -p apps/dashboard
mkdir -p apps/api

# automações (n8n, outros fluxos)

mkdir -p automation/n8n/workflows
mkdir -p automation/n8n/docs
mkdir -p automation/scripts

# banco de dados (Supabase)

mkdir -p database/sql/schema
mkdir -p database/sql/migrations
mkdir -p database/sql/seeds
mkdir -p database/docs

# assets de conteúdo (idéias, roteiros, templates etc.)

mkdir -p content/ideias
mkdir -p content/roteiros
mkdir -p content/assets/audio
mkdir -p content/assets/video
mkdir -p content/assets/thumbs
mkdir -p content/templates

# observabilidade / métricas (para depois conectarmos com Supabase + BI)

mkdir -p analytics/etl
mkdir -p analytics/dashboards
mkdir -p analytics/exports

# documentação geral do projeto

mkdir -p docs/blueprints
mkdir -p docs/processos
mkdir -p docs/canais
mkdir -p docs/infra

# config de editor / workspace

mkdir -p .vscode

3. Arquivos essenciais (README, .gitignore, .env)
   README inicial
   cat << 'EOF' > README.md

# PULSO – Ecossistema de Canais Dark

Este repositório centraliza:

- **Supabase**: banco de dados (ideias, roteiros, assets, publicações e métricas).
- **n8n**: orquestração dos fluxos (ideia → roteiro → áudio → vídeo → postagem → métricas).
- **Apps**: dashboard e API de suporte.
- **Content**: roteiros, templates e assets de conteúdo.
- **Docs**: blueprints, processos e padrões.

Estrutura geral:

- `apps/dashboard`: frontend (painel interno)
- `apps/api`: backend interno / APIs auxiliares
- `automation/n8n`: workflows exportados do n8n
- `database/sql`: schema, migrations e seeds do Supabase
- `content`: ideias, roteiros, assets
- `analytics`: scripts e exportações de métricas
- `docs`: documentação do ecossistema

EOF

.gitignore padrão (Node + ambiente + editor)
cat << 'EOF' > .gitignore

# Node

node_modules
npm-debug.log\*
pnpm-lock.yaml
yarn.lock

# Ambiente

.env
.env.local
.env.\*.local

# Logs

logs
_.log
log-_.txt

# Sistema / Editor

.DS_Store
Thumbs.db
.vscode/\*
!.vscode/extensions.json
!.vscode/settings.json

# Build

dist
build
.next
.out
EOF

Modelo de .env (para depois plugar Supabase, n8n etc.)
cat << 'EOF' > .env.example

# SUPABASE

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# N8N

N8N_URL=
N8N_API_KEY=

# OUTROS SERVIÇOS (YouTube, TikTok, etc.)

YOUTUBE_API_KEY=
TIKTOK_API_KEY=
EOF

4. Configuração do VSCode (.vscode)

Recomendo já deixar extensões sugeridas e alguns ajustes:

cat << 'EOF' > .vscode/extensions.json
{
"recommendations": [
"dbaeumer.vscode-eslint",
"esbenp.prettier-vscode",
"mhutchie.git-graph",
"ms-vscode.vscode-typescript-next"
]
}
EOF

cat << 'EOF' > .vscode/settings.json
{
"editor.formatOnSave": true,
"files.exclude": {
"node_modules": true,
"dist": true,
"build": true
}
}
EOF

5. Esqueleto dos apps (dashboard + API)
   Dashboard (Next.js ou futuro frontend)

Por enquanto só um placeholder pra não ficar vazio:

cat << 'EOF' > apps/dashboard/README.md

# PULSO Dashboard

Frontend interno para:

- Visualizar ideias, roteiros e status dos conteúdos.
- Acompanhar filas de produção e publicação.
- Ver métricas consolidadas do Supabase / n8n.

Futuro: implementar com Next.js / React.
EOF

API / Backend interno
cat << 'EOF' > apps/api/README.md

# PULSO API

Backend interno para:

- Endpoints de integração com Supabase (quando necessário).
- Webhooks de publicação / callbacks (YouTube, etc.).
- Serviços auxiliares para o n8n.

Futuro: implementar com Node/Express/Fastify ou outra stack.
EOF

6. Pastas “guia” para Supabase & n8n
   Supabase – scripts iniciais
   cat << 'EOF' > database/sql/schema/README.md

# Schema Supabase – PULSO

Aqui vão os arquivos SQL para:

- Criação de tabelas de ideias, roteiros, assets, publicações e métricas.
- Views para observabilidade (dashboards de conteúdo).
- Funções e policies (RLS) conforme o projeto evoluir.
  EOF

n8n – workflows
cat << 'EOF' > automation/n8n/README.md

# n8n – Workflows PULSO

- `workflows/`: exports dos fluxos (JSON) de automação.
- `docs/`: explicações de cada workflow (entrada, saída, integrações).

Sugestão de primeiros fluxos:

- Ideias → Roteiro (IA)
- Roteiro → Áudio (TTS)
- Áudio → Vídeo (ferramentas externas)
- Vídeo → Upload/Agendamento em canais
- Coleta de métricas e gravação no Supabase
  EOF

7. Organização dos conteúdos (ideias, roteiros, templates)
   cat << 'EOF' > content/README.md

# Content – PULSO

- `ideias/`: banco de ideias brutas (TXT/MD/JSON).
- `roteiros/`: roteiros aprovados por série/canal.
- `templates/`: prompts, estruturas de roteiro, descrições padrão, etc.
- `assets/`: arquivos de áudio, vídeo e thumbnails gerados ou base.

O Supabase será a "fonte da verdade". Estes arquivos locais servem como backup,
rascunho e base para versionamento.
EOF

8. Pequeno mapa da estrutura final (para você visualizar)

Só pra você bater o olho (não é comando):

pulso/
apps/
dashboard/
README.md
api/
README.md
automation/
n8n/
workflows/
docs/
README.md
scripts/
database/
sql/
schema/
migrations/
seeds/
docs/
content/
ideias/
roteiros/
assets/
audio/
video/
thumbs/
templates/
README.md
analytics/
etl/
dashboards/
exports/
docs/
blueprints/
processos/
canais/
infra/
.vscode/
extensions.json
settings.json
README.md
.gitignore
.env.example
package.json

9. Próximos passos (rapidinho)

Depois de rodar tudo isso:

Conectar ao GitHub

git add .
git commit -m "chore: estrutura inicial PULSO"
git branch -M main
git remote add origin git@github.com:SEU_USUARIO/pulso.git
git push -u origin main

Criar projeto no Supabase

Pegar SUPABASE_URL e SUPABASE_ANON_KEY

Preencher .env com base no .env.example

Conectar o n8n

Definir N8N_URL e N8N_API_KEY no .env

Começar a exportar workflows pra automation/n8n/workflows.
