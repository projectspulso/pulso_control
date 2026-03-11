# Investigacoes de Automacao e Publicacao

## Objetivo

Separar o que o produto pode automatizar de verdade do que ainda e promessa.

## Perguntas principais

### 1. Qual e o estado real dos workflows?

Precisamos cruzar:

- `automation/n8n/docs/`
- `n8n-workflows/*.json`
- integracoes do app em `lib/api/n8n.ts`

Perguntas:

- WF00 a WF04 existem de fato no n8n?
- os JSONs exportados batem com o que esta documentado?
- o app aponta para os mesmos webhooks esperados pelos JSONs?

### 2. Qual e o estado real dos webhooks?

Precisamos confirmar:

- URLs configuradas
- secrets configurados
- payloads esperados
- resposta esperada
- logs gerados

Arquivos importantes:

- `docs/30_AUTOMACAO/apoio/CONFIGURAR_WEBHOOKS_N8N.md`
- `docs/30_AUTOMACAO/apoio/DEBUG_WEBHOOK_N8N.md`
- `docs/30_AUTOMACAO/apoio/WF99_RECOVERY_RETRY.md`
- `app/api/webhooks/workflow-completed/route.ts`
- `app/api/ideias/[id]/gerar-roteiro/route.ts`

### 3. O produto pode prometer publicacao multi-rede oficial?

Hoje a resposta e: ainda nao.

Investigar por plataforma:

- YouTube: trilha oficial de upload, auditoria e escopos
- TikTok: restricoes da Content Posting API
- Instagram/Facebook: uso real do Graph API/Reels API
- Kwai: possibilidade oficial de publicacao automatizada

## Recomendacao de leitura por prioridade

### Prioridade alta

- `n8n-workflows/WF00_Gerar_Ideias.json`
- `n8n-workflows/WF01_Gerar_Roteiro.json`
- `n8n-workflows/WF02_Gerar_Audio.json`
- `n8n-workflows/WF03_Preparar_Video.json`
- `n8n-workflows/WF04_Publicar.json`
- `n8n-workflows/WF99_Retry_Recovery.json`

### Prioridade alta

- `automation/n8n/docs/01_ideia_para_roteiro.md`
- `automation/n8n/docs/02_roteiro_para_producao.md`
- `automation/n8n/docs/03_publicacao_plataformas.md`
- `automation/n8n/docs/04_coleta_metricas.md`
- `automation/n8n/docs/05_analise_alertas.md`

## Investigacoes necessarias

### Investigacao A - alinhamento app x n8n

Checar:

- nome dos webhooks
- nome dos payloads
- nomes dos campos de retorno
- se o app invalida caches corretos
- se o workflow escreve nas tabelas esperadas

### Investigacao B - observabilidade

Checar:

- quem grava em `logs_workflows`
- quem grava em `workflow_queue`
- se RLS atrapalha a escrita
- se o retry realmente fecha o ciclo

### Investigacao C - publicacao por rede

Checar:

- quais redes podem entrar por API oficial agora
- quais redes entram por publicacao manual assistida
- quais redes nao devem entrar no MVP

## Regra de produto para automacao

No estagio atual, o produto deve assumir:

- automacao forte em organizacao interna
- automacao media em geracao de roteiro e audio
- automacao baixa em publicacao multi-rede

## Direcao recomendada

### MVP

- YouTube Shorts como ancora
- TikTok como extensao
- Instagram como extensao
- Kwai so depois

### Nao prometer ainda

- auto-post universal
- operacao 100 por cento no escuro
- escalabilidade multi-rede como tese principal

## Fontes oficiais de plataforma usadas nesta linha de pensamento

- YouTube monetization policies: https://support.google.com/youtube/answer/1311392
- YouTube altered or synthetic content: https://support.google.com/youtube/answer/14328491
- TikTok Content Sharing Guidelines: https://developers.tiktok.com/doc/content-sharing-guidelines
- TikTok AI-generated content: https://support.tiktok.com/en/using-tiktok/creating-videos/ai-generated-content
- TikTok Creator Rewards Program: https://support.tiktok.com/en/business-and-creator/creator-rewards-program/creator-rewards-program
- Meta spammy content: https://about.fb.com/news/2025/04/cracking-down-spammy-content-facebook/
- Instagram creator best practices: https://about.fb.com/news/2024/10/best-practices-education-hub-creators-instagram/
- Kwai creators earn: https://www.kwai.com/creators/earn
