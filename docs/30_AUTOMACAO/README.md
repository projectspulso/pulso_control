# Automacao - Ponto de Entrada

Esta pasta concentra a leitura curada sobre workflows, webhooks, publicacao e riscos de plataforma.

## Decisao atual

n8n esta fora da rota operacional do MVP.

A automacao oficial passa a ser AI-native:

- Supabase como banco, fila e estado operacional
- API routes do Next.js como workers
- OpenAI/TTS e coletores chamados pelo backend
- retry, logs e acompanhamento dentro do app

Docs e exports de n8n ficam como acervo legado. Nao usar como requisito ativo.

## Ler primeiro

1. `../00_MESTRE/TRILHA_OFICIAL_DE_EXECUCAO.md`
2. `AUTOMACAO_AI_NATIVE.md`
3. `INVESTIGACOES_AUTOMACAO_E_PUBLICACAO.md`

## Estrutura

- `AUTOMACAO_AI_NATIVE.md` -> arquitetura operacional atual
- `INVESTIGACOES_AUTOMACAO_E_PUBLICACAO.md` -> perguntas principais e trilha de investigacao
- `apoio/` -> docs operacionais, webhooks, retry, setup e historico tecnico, incluindo legado n8n
- `sql/` -> queries de verificacao de automacao

## Regra

Nao prometer publicacao automatizada multi-rede so porque existe documentacao. Confirmar sempre:

- rota do app
- segredo/configuracao
- politica oficial da plataforma
- estado real da fila e dos logs
