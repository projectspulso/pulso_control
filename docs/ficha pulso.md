# Pulso

> **Ficha de produto — gerada em 16 de abril de 2026**
> Baseada em leitura direta do repositório `pulso_control`, incluindo docs curados, blueprints, workflows exportados, código do app e registros de execução real.

---

## 1. O que é

**PULSO Control** é um sistema operacional editorial para vídeos curtos faceless originais.

Opera o ciclo completo de conteúdo: geração de ideias → roteiro → áudio/TTS → montagem de vídeo → publicação assistida → analytics e métricas.

O núcleo técnico é composto por:

- **Next.js** (app de controle e dashboard)
- **Supabase** (banco de dados e storage)
- **n8n** (orquestração de automação via workflows)
- **APIs de IA** (OpenAI/Claude para roteiro, ElevenLabs/Google TTS para narração)
- **APIs de plataforma** (YouTube, TikTok, Instagram)

---

## 2. Frase oficial

> "Sistema operacional para vídeos curtos faceless originais, com pipeline editorial, automação assistida e humano no loop."

Frases proibidas no posicionamento:

- "fábrica de canais dark"
- "autopost em tudo"
- "viral garantido"
- "monetização automática"
- "escala sem equipe"

---

## 3. Natureza do produto — três leituras

O repositório apresenta tensão clara entre três visões. Todas existem documentadas, mas com pesos diferentes.

### 3.1 Ferramenta interna da DIGIAI

**Evidência:** forte.

O projeto existe como operação própria de criação de canais faceless. A documentação curada em `docs/40_PRODUTO/` define o produto como "laboratorio interno de validação de formatos" operado por "operador solo ou dupla enxuta". O README principal descreve o projeto como "centro de comando para operar vídeos curtos faceless". O app tem rotas, banco e workflows reais rodando desde março/2026. Não há evidência de venda ou licenciamento externo ativo.

**Conclusão:** o uso primário confirmado hoje é interno — operar canais de conteúdo da própria equipe da DIGIAI.

### 3.2 Produto comercial futuro

**Evidência:** presente, mas marcada como "não agora".

A documentação menciona explicitamente que "a tese comercial de SaaS pronto" está fora do escopo do MVP. O critério de GO do produto não inclui venda a terceiros — inclui provar que 1 canal funciona com repetibilidade. A crítica interna (`CRITICA_VIABILIDADE_CANAIS_DARK_2026.md`) avalia o produto como "ferramenta interna de operação editorial: 7/10" e "produto para automação de canais dark multi-rede: 3/10".

O `07_BACKLOG_PRIORIZADO.md` e o `10_ROADMAP_30_DIAS.md` não mencionam comercialização. A ambição de SaaS está implícita na arquitetura (multi-canal, multi-schema, multi-plataforma), mas não há roadmap ou estratégia de go-to-market documentada.

**Conclusão:** potencial comercial existe na arquitetura, mas deliberadamente contido no horizonte atual. **Precisa de validação manual** sobre se/quando isso vira produto comercial.

### 3.3 Motor de mídia para outros produtos

**Evidência:** latente.

A arquitetura em schemas separados (`pulso_core`, `pulso_content`, `pulso_assets`, `pulso_distribution`, `pulso_automation`, `pulso_analytics`) sugere que o motor poderia ser reutilizado ou acoplado a outros contextos. O pipeline ideia → roteiro → áudio → vídeo → publicação é genérico o suficiente para servir outros projetos do ecossistema DIGIAI. Porém, não há documento que afirme esse papel explicitamente.

**Conclusão:** o design técnico permite reutilização como motor de mídia, mas essa função não é declarada. **Precisa de validação manual** sobre se há intenção estratégica de usar o PULSO como infraestrutura para outros produtos DIGIAI.

---

## 4. Pipeline de conteúdo — mapeamento completo

O pipeline está documentado, implementado em banco (`supabase/migrations/`) e nos workflows (`n8n-workflows/`).

```
ENTRADA
  └── Ideia (manual, por IA [WF00], ou tendência externa)
          ↓
  Aprovação humana obrigatória
          ↓
ROTEIRO
  └── WF01 — geração automática via GPT-4 / Claude
          ↓
  Aprovação humana obrigatória
          ↓
ÁUDIO
  └── WF02 — TTS via ElevenLabs ou Google TTS
       └── Upload automático para Supabase Storage (bucket: audios)
          ↓
VÍDEO
  └── WF03 — preparação de assets e variantes por plataforma
       └── Edição manual (CapCut) no MVP atual
       └── Geração automática de vídeo (Runway/Pika/Kling) como roadmap futura
          ↓
PUBLICAÇÃO
  └── WF04 — publicação assistida nas plataformas
       └── YouTube Shorts (âncora)
       └── TikTok, Instagram Reels (extensões)
       └── Kwai (fora do MVP)
          ↓
MÉTRICAS
  └── WF04 (coleta) — 2x/dia via APIs das plataformas
  └── WF05 (análise semanal via IA) — relatório com insights acionáveis e alertas
          ↓
FEEDBACK LOOP
  └── Insights retroalimentam novas ideias via WF00
```

### Workflows exportados — confirmados no repositório

| Arquivo | Função |
|--------|--------|
| `WF00_Gerar_Ideias.json` | Geração automatizada de ideias |
| `WF01_Gerar_Roteiro.json` | Ideia → Roteiro via IA (GPT-4/Claude) |
| `WF02_Gerar_Audio.json` | Roteiro → Áudio TTS (ElevenLabs/Google) |
| `WF03_Preparar_Video.json` | Preparação de variantes por plataforma |
| `WF04_Publicar.json` | Publicação e registro de posts |
| `WF99_Retry_Recovery.json` | Retry automático em falhas de workflow |

---

## 5. Geração de ideias

**Status:** implementado — WF00 exportado e documentado.

- Trigger: cron (3x/dia: 8h, 14h, 20h)
- Fonte: banco de ideias em `pulso_content.ideias`, calendário editorial, tendências
- IA: GPT-4 ou Claude 3.5 Sonnet
- Output: inserção direta no banco com status `RASCUNHO`

O sistema tem 30 ideias pré-definidas para Fase 1 (calendário de 30 dias documentado em `06_CONTEUDO_EDITORIAL.md`), cobrindo 5 formatos: Curiosidade Rápida, Psicologia & Comportamento, Storytelling Curto, Mistério/História Real, Motivacional.

---

## 6. Geração de roteiros

**Status:** implementado — WF01 exportado, documentado e com templates de prompt por formato.

- IA utilizada: GPT-4 por padrão, Claude como alternativa
- Templates por formato de vídeo: estrutura rígida (GANCHO → DESENVOLVIMENTO → TWIST → CTA)
- Custo estimado: $0.01–0.03 por roteiro
- KPI alvo: taxa de aprovação >70% após ajustes de prompt
- Output: Markdown salvo em `pulso_content.roteiros`

O conteúdo é faceless — sem rosto, sem personagem fixo. Os formatos são pensados para alta retenção em vídeos de 15 a 60 segundos.

---

## 7. TTS e áudio

**Status:** implementado — WF02 exportado com 30.8KB de configuração, maior workflow do projeto.

- **ElevenLabs** como API primária
- **Google TTS** como alternativa econômica (custo zero vs. $0.15–0.30/áudio)
- Upload direto para Supabase Storage (bucket `audios` confirmado existente)
- Bucket URL: `https://nlcisbfdiokmipyihtuz.supabase.co`
- Problema conhecido: campos `storage_path` e `public_url` sendo gravados como `undefined` em alguns registros — listado como bloqueador P0
- Documentação dedicada: `n8n-workflows/gerar_audio_completo.md`

---

## 8. Vídeo

**Status:** parcialmente implementado — WF03 exportado, vídeo final ainda depende de edição manual.

- Workflow prepara variantes por plataforma (YouTube 9:16/60s, TikTok, Instagram, Kwai)
- Edição atual: **CapCut** (manual)
- Identidade visual por canal: paleta de cores, mascote PULSO, tipografia padronizada
- Upload do vídeo final para Supabase Storage após edição
- Geração automática de vídeo (Runway/Pika/Kling): **roadmap futuro — não implementado no MVP**

---

## 9. Automação e n8n

**Stack de automação:**

- **n8n Cloud** (`https://pulsoprojects.app.n8n.cloud`)
- **6 workflows** exportados em JSON versionados no repositório
- Integração via webhook: `app/api/n8n/*` (roteado pelo servidor, não direto do browser)
- Webhook de retorno: `POST /api/webhooks/workflow-completed`
- Logs gravados em `pulso_content.logs_workflows`
- Fila de execução: `pulso_content.workflow_queue` (migration aplicada em março/2026)
- Retry automático: WF99 cobre falhas e recuperação
- `docker-compose.n8n.yml` presente — suporte a n8n self-hosted

**Configuração de credenciais no app:**

- `/settings` permite configurar URL base do n8n, webhooks explícitos por workflow
- `lib/n8n/runtime.ts` prioriza configuração salva no banco sobre `.env`

---

## 10. Publicação

**Status:** assistida — não automática.

- WF04 implementado para YouTube, TikTok e Instagram
- Publicação manual assistida: humano valida antes de publicar
- Interface em `/publicar` com feedback inline (sem `alert`/`confirm` nativos)
- Plataformas confirmadas: YouTube Data API v3, TikTok API (limitado), Instagram Graph API
- Alternativa recomendada para MVP: **Publer** ou **Buffer** como ponte de agendamento
- Horários padrão configurados: 10h, 14h, 18h, 21h
- Kwai: fora do MVP atual

**Limitações documentadas de API por plataforma:**

| Plataforma | Limitação |
|-----------|-----------|
| YouTube | 10.000 unidades/dia. Posts públicos exigem OAuth |
| TikTok | API restrita — apps não auditados ficam com posts privados |
| Instagram | Apenas Business accounts via Graph API |
| Kwai | Sem API oficial de automação confirmada |

---

## 11. Analytics

**Status:** estrutura pronta, painel mínimo funcional — não maduro para decisão autônoma.

- Schema `pulso_analytics` com tabelas `eventos` e `metricas_diarias`
- WF04 coleta: views, likes, comentários, compartilhamentos, watch time, inscrições geradas, CTR
- WF05 análise semanal: relatório via IA com top performers, alertas de baixa performance, comparação por plataforma, melhor horário
- Detecção de anomalias: VIRAL (>10k views/24h), BAIXA_PERFORMANCE (<100 views/7 dias), ALTO_ENGAJAMENTO (>5% likes/views)
- Dashboard `/analytics`: painel mínimo de validação (saiu de placeholder em março/2026)
- **Conclusão documentada:** "analytics existe como direção de produto, não como capacidade madura do MVP"

---

## 12. Banco de dados — estrutura

**Supabase** com 6 schemas e 30+ tabelas:

| Schema | Propósito | Tabelas principais |
|--------|-----------|-------------------|
| `pulso_core` | Estrutura base | canais, plataformas, series, tags |
| `pulso_content` | Conteúdo criativo | ideias, roteiros, conteudos, variantes, logs_workflows, workflow_queue |
| `pulso_assets` | Arquivos de mídia | assets, conteudo_variantes_assets |
| `pulso_distribution` | Publicações | posts, posts_logs |
| `pulso_automation` | Automações | workflows, workflow_execucoes |
| `pulso_analytics` | Métricas | eventos, metricas_diarias |

**11 Views públicas** para frontend e dashboards.

---

## 13. Storage

- Supabase Storage integrado
- Bucket `audios` confirmado existente
- Assets carregados pelo WF02 (áudio) e manualmente (vídeo final)
- Problema ativo: `storage_path` e `public_url` sendo gravados como `undefined` — bloqueador P0 identificado

---

## 14. Canais e conteúdo planejado

### Fase 1 (MVP — 1 canal)

- **PULSO Curiosidades** — curiosidades dark, fatos intrigantes, ciência inusitada
- Distribuição: YouTube Shorts (âncora), TikTok, Instagram Reels
- Meta: 7 vídeos/semana × 3 plataformas = 21 posts/semana
- Séries: Curiosidades Dark, Mistérios Urbanos, Ciência Estranha

### Fase 2 (3 canais)

- PULSO Curiosidades
- PULSO Mistérios & História
- PULSO Psicologia & Comportamento
- Meta: 24 uploads/dia (~180 vídeos/mês)

### Fase 3 (10 canais — escala)

- PULSO Psicologia, História, Motivacional, Infantil, Romance Narrado, Educação, Games Nostalgia, Contos
- **Meta: 30 vídeos/dia × 4 plataformas = 120 publicações diárias**

---

## 15. Canais dark — indícios e tensão documentada

O repositório apresenta **tensão explícita e registrada** entre duas teses:

**Tese A — "dark multi-rede automatizado":**
- Presente nos blueprints antigos em `docs/50_BLUEPRINTS/` (ex: "ecossistema automatizado de criação e distribuição de conteúdo dark")
- Mencionada em `06_CONTEUDO_EDITORIAL.md` como "máquina de conteúdo em escala"
- Séries com curadoria de temas de alta retenção: Curiosidades Dark, Mistérios Urbanos, True Crime Curto, Teorias da Conspiração, Psicologia Dark
- Planejamento de 10 canais simultâneos com publicação em 4 plataformas

**Tese B — "sistema operacional editorial com humano no loop" (posição oficial):**
- Adotada como tese oficial em março/2026 em `docs/40_PRODUTO/`
- "Fábrica de canais dark" listada explicitamente como "categoria não recomendada"
- Documento `CRITICA_VIABILIDADE_CANAIS_DARK_2026.md` faz crítica detalhada da tese dark
- Conclusão: "viável como sistema interno para operar 1 a 3 canais faceless com forte revisão humana. Não viável como máquina automatizada para canais dark em todas as redes."

**O que fica claro na leitura do repositório:**
- A tese dark foi a origem do projeto
- A tese do sistema operacional editorial é a posição de reposicionamento deliberado pós-crítica
- O conteúdo planejado ainda é "dark" na natureza (curiosidades, mistérios, psicologia, histórias reais) mas com autoria editorial e humano no loop
- A escala está planejada, mas subordinada à validação de formato em 1 canal primeiro

---

## 16. ICP e personas

### ICP primário

- Operador solo ou dupla enxuta
- 1 a 3 canais faceless originais
- Processo editorial sério
- Necessidade de pipeline, aprovação e visibilidade

### ICP secundário

- Mini estúdio de conteúdo
- Laboratório interno de validação de formatos

### Personas

| Persona | Foco | Dor principal |
|---------|------|---------------|
| Operador Editor | Pauta, aprovações, roteiros | Perder conteúdo no pipeline |
| Líder Criativo | Linha editorial, qualidade, performance | Volume sem identidade |
| Coordenador de Operação | Status, calendário, execução | Status ambíguo, publicação no improviso |

---

## 17. Fluxos do app (rotas)

| Rota | Função |
|------|--------|
| `/` | Dashboard operacional |
| `/ideias` | Gestão e aprovação de ideias |
| `/roteiros` | Revisão e aprovação de roteiros |
| `/producao` | Pipeline visual (kanban por status) |
| `/calendario` | Calendário editorial |
| `/assets` | Biblioteca de ativos de mídia |
| `/publicar` | Publicação assistida |
| `/monitor` | Logs e execuções de workflows |
| `/workflows` | Status dos workflows n8n |
| `/settings` | Configuração de plataformas e integrações |
| `/analytics` | Painel mínimo de métricas |
| `/canais/[slug]` | Gestão por canal |

---

## 18. Estado atual do MVP (março/abril 2026)

- `npm install` ✅ — 598 pacotes instalados
- `npm run build` ✅ — build de produção gerado
- `npm run lint` ✅ — 0 erros / 78 warnings
- Banco com migrations aplicadas ✅
- Workflows JSON exportados ✅
- Bucket `audios` existente ✅
- Integração n8n via servidor ✅
- Publicação rebaixada para "assistida" ✅
- Workflow queue (`pulso_content.workflow_queue`) criado e validado ✅

### Bloqueadores P0 ativos

1. Validar runtime real do app em `/monitor` e `/settings`
2. Validar fluxo ponta a ponta com ambiente real de banco e n8n
3. Corrigir registros inválidos em `pulso_content.audios` (storage_path/public_url como `undefined`)
4. Reduzir warnings de tipagem nas páginas não tratadas
5. Registrar histórico de aprovações, retries e sinais operacionais do workflow

---

## 19. Métricas e critérios de decisão

### North star

> Número de ciclos completos e repetíveis por semana para 1 canal

Não é: volume de posts, número de plataformas, número de workflows.

### Critério de GO (30 dias)

1. Fluxo completo rodou mais de uma vez sem quebra estrutural
2. Há 1 formato claramente repetível
3. A equipe consegue explicar o que está funcionando
4. O app está reduzindo fricção operacional

### Critério de KILL

1. O fluxo não se repete duas vezes
2. A qualidade depende de conteúdo derivativo demais
3. Banco e workflows continuam instáveis
4. O time não consegue identificar um formato promissor

---

## 20. Custos estimados (mensal — 1 canal)

| Serviço | Estimativa |
|---------|-----------|
| OpenAI (roteiros) | ~$6/mês (300 roteiros × $0.02) |
| ElevenLabs (TTS) | ~$75/mês (300 áudios × $0.25) |
| Supabase | $0 (free tier — Storage 10GB) |
| n8n Cloud | $20–40/mês |
| YouTube/TikTok APIs | $0 (leitura gratuita) |
| **Total** | **~$100–120/mês** |
| **Com Google TTS** | **~$25–45/mês** |

---

## 21. Riscos documentados

| Risco | Natureza |
|-------|---------|
| Plataformas apertando conteúdo repetitivo/IA | Externo — regulatório |
| APIs oficiais com restrições crescentes | Externo — técnico |
| TikTok: posts privados em apps não auditados | Externo — operacional |
| YouTube: monetização punitiva para conteúdo mass-produced | Externo — financeiro |
| Meta: crackdown explícito em spammy content | Externo — regulatório |
| Banco ainda sem trilha congelada | Interno — técnico |
| Analytics não sustenta decisão forte | Interno — produto |
| Publicação depende de assistência humana | Interno — operacional |
| Promessa maior que realidade | Interno — posicionamento |

---

## 22. O que o produto NÃO promete

Registrado como "não promessas oficiais":

- Crescer canais sozinho
- Publicar sozinho em qualquer rede
- Monetizar por conta própria
- Substituir critério editorial
- Transformar conteúdo commodity em ativo defensável
- Virais por IA
- Operação sem revisão humana
- Escala antes de provar 1 formato vencedor

---

## 23. Itens que precisam de validação manual

Os itens abaixo não têm evidência suficiente no repositório para conclusão direta:

- [ ] **Relação estratégica com o ecossistema DIGIAI**: o PULSO tem papel definido como motor de mídia para outros produtos DIGIAI?
- [ ] **Intenção de comercialização**: há plano para transformar o PULSO em produto SaaS com clientes externos? Em que horizonte?
- [ ] **Operação atual de canais**: os canais PULSO estão ativos e publicando? Ou ainda é pré-operação?
- [ ] **Voz e identidade do canal**: qual voz TTS está sendo usada como padrão? ElevenLabs ou Google TTS?
- [ ] **Critério de "original o suficiente"**: o playbook de qualidade editorial (rubric de roteiro, vídeo, thumbnail) foi formalizado?
- [ ] **Uso de disclosure de IA**: há processo definido para rotulagem de conteúdo gerado por IA nas plataformas?
- [ ] **Monetização**: há canais já monetizados ou próximos de qualificação?

---

*Ficha gerada por leitura direta do repositório `pulso_control`. Fontes: `docs/40_PRODUTO/` (posicionamento oficial), `docs/50_BLUEPRINTS/` (arquitetura técnica), `n8n-workflows/` (workflows exportados), `docs/00_MESTRE/` (estado atual e execução), `docs/40_PRODUTO/90_APOIO/CRITICA_VIABILIDADE_CANAIS_DARK_2026.md` (análise de viabilidade). Data de referência dos documentos internos: março/2026.*
